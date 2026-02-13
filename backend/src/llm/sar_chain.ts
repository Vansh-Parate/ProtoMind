import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import type { ScoreResult } from '../scoring/engine';

const SarSchema = z.object({
  customer_profile: z.string(),
  activity_summary: z.string(),
  transaction_analysis: z.string(),
  suspicious_indicators: z.array(z.string()),
  typology_mapping: z.string(),
  risk_assessment: z.string(),
  recommendation: z.string()
});

export type StructuredSar = z.infer<typeof SarSchema>;

// The generic types inferred from complex Zod schemas can cause
// "Type instantiation is excessively deep and possibly infinite"
// errors in TypeScript. We deliberately loosen the parser typing to
// avoid that, and cast only at the parse call site.
const parser: StructuredOutputParser<any> = StructuredOutputParser.fromZodSchema(
  SarSchema as any
);

const promptTemplate = ChatPromptTemplate.fromMessages([
  [
    'system',
    [
      'You are an AML compliance analyst drafting a Suspicious Activity Report (SAR).',
      'Rely ONLY on the provided case data and retrieved knowledge.',
      'Do NOT invent facts or speculate beyond the data.',
      'Maintain a formal, regulatory-compliant tone.',
      'Explicitly reference triggered rules and align with retrieved regulatory guidance where applicable.',
      'If data is missing or incomplete, clearly state that limitation.',
      'You MUST respond strictly in JSON following the required schema and format instructions.'
    ].join(' ')
  ],
  [
    'human',
    [
      'Case data (JSON):',
      '{case_json}',
      '',
      'Risk scoring result (JSON):',
      '{score_json}',
      '',
      'Detected typology:',
      '{typology}',
      '',
      'Triggered rules (descriptions only):',
      '{triggered_rules}',
      '',
      'Retrieved knowledge context:',
      '{context}',
      '',
      'Use the above information to generate a SAR narrative strictly grounded in the facts.',
      'Follow these rules:',
      '- Do not decide whether activity is suspicious; assume the rule engine has already made that determination.',
      '- Do not change or override any risk scores.',
      '- Do not introduce new entities, accounts, or transactions.',
      '',
      'Return a JSON object that matches this schema exactly:',
      '{format_instructions}'
    ].join('\n')
  ]
]);

export interface SarChainInput {
  alert_payload: Record<string, unknown>;
  score: ScoreResult;
  typology: string;
  context: string;
  triggered_rule_descriptions: string[];
}

interface SarChainResult {
  structured: StructuredSar;
  rawJson: string;
  prompt: string;
}

/**
 * Run the SAR generation LangChain pipeline once.
 * This is kept small and side-effect free to make retries simple.
 */
async function runSarChainOnce(
  model: ChatOpenAI,
  input: SarChainInput
): Promise<SarChainResult> {
  const formatInstructions = parser.getFormatInstructions();

  const case_json = JSON.stringify(input.alert_payload ?? {}, null, 2);
  const score_json = JSON.stringify(
    {
      risk_score: input.score.risk_score,
      risk_level: input.score.risk_level,
      confidence_score: input.score.confidence_score,
      triggered_rules: input.score.triggered_rules.map((r) => r.description)
    },
    null,
    2
  );

  const triggered_rules =
    input.triggered_rule_descriptions.length > 0
      ? input.triggered_rule_descriptions.join('; ')
      : 'None';

  const messages = await promptTemplate.formatMessages({
    case_json,
    score_json,
    typology: input.typology,
    triggered_rules,
    context: input.context || 'No additional knowledge was retrieved.',
    format_instructions: formatInstructions
  });

  // Reconstruct a string representation of the prompt for audit logging.
  const prompt = messages
    .map((m) => {
      const role = m._getType();
      const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      return `[${role.toUpperCase()}]\n${content}`;
    })
    .join('\n\n');

  const response = await model.invoke(messages);
  const raw =
    typeof response.content === 'string'
      ? response.content
      : Array.isArray(response.content)
        ? response.content
            .map((c) => ('text' in c ? c.text : JSON.stringify(c)))
            .join('\n')
        : JSON.stringify(response.content);

  const structured = (await parser.parse(raw)) as StructuredSar;

  return {
    structured,
    rawJson: raw,
    prompt
  };
}

/**
 * Public entrypoint used by the provider. It wraps the core chain with
 * a single automatic retry if JSON parsing fails or the model returns
 * something that does not match the schema.
 */
export async function runSarChainWithRetry(
  model: ChatOpenAI,
  input: SarChainInput
): Promise<SarChainResult> {
  try {
    return await runSarChainOnce(model, input);
  } catch (firstError) {
    // Retry once with the exact same inputs.
    try {
      return await runSarChainOnce(model, input);
    } catch (secondError) {
      // Bubble up the second failure; the caller will handle it and surface a
      // controlled error back to the API.
      throw secondError;
    }
  }
}

/**
 * Convert the structured JSON SAR into a single narrative string that can be
 * stored in the existing `generated_text` column without changing schemas.
 */
export function renderNarrativeFromStructuredSar(structured: StructuredSar): string {
  const sections: string[] = [];

  sections.push('Customer Profile', structured.customer_profile.trim(), '');
  sections.push('Activity Summary', structured.activity_summary.trim(), '');
  sections.push('Transaction Analysis', structured.transaction_analysis.trim(), '');

  const indicatorsList =
    structured.suspicious_indicators.length > 0
      ? structured.suspicious_indicators.map((s) => `- ${s}`).join('\n')
      : '- No explicit suspicious indicators were identified in the provided data.';
  sections.push('Suspicious Indicators', indicatorsList, '');

  sections.push('Typology Mapping', structured.typology_mapping.trim(), '');
  sections.push('Risk Assessment', structured.risk_assessment.trim(), '');
  sections.push('Recommendation', structured.recommendation.trim());

  return sections.join('\n');
}

