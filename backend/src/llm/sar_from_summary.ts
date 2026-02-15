import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * Prompt for generating a full SAR document from a structured AML summary
 * (e.g. from the ML pipeline: Subject Information, Activity Overview, etc.).
 * Input is clean text only; output is a single narrative string.
 */
const promptTemplate = ChatPromptTemplate.fromMessages([
  [
    'system',
    [
      'You are a senior AML compliance analyst.',
      'Based on the structured alert details provided, generate a formal Suspicious Activity Report (SAR).',
      'The SAR must include:',
      '1. Clear narrative of what occurred',
      '2. Timeline summary',
      '3. Transaction behavior analysis',
      '4. Justification for suspicion',
      '5. Reference to AML typology',
      '6. Risk conclusion',
      'Write in professional regulatory language suitable for submission to financial intelligence authorities.',
      'Do not invent facts; use only the information in the alert details.',
      'Return the full SAR as plain text (no JSON).'
    ].join(' ')
  ],
  ['human', 'Structured alert details:\n\n{structured_summary}']
]);

export interface SarFromSummaryResult {
  narrative: string;
}

/**
 * Generate a full SAR narrative from a structured summary string.
 * Used when the ML pipeline has already produced a clean summary
 * (Subject Information, Activity Overview, Transaction Indicators, etc.)
 * and we want the LLM to turn it into a formal SAR document.
 */
export async function generateSarFromStructuredSummary(
  model: ChatOpenAI,
  structuredSummary: string
): Promise<SarFromSummaryResult> {
  const messages = await promptTemplate.formatMessages({
    structured_summary: structuredSummary.trim()
  });

  const response = await model.invoke(messages);
  const narrative =
    typeof response.content === 'string'
      ? response.content
      : Array.isArray(response.content)
        ? response.content
            .map((c) => ('text' in c ? c.text : JSON.stringify(c)))
            .join('\n')
        : String(response.content ?? '');

  return { narrative: narrative.trim() };
}
