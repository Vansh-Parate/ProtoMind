import { ChatOpenAI } from '@langchain/openai';
import type { Prisma } from '@prisma/client';
import { ScoreResult } from '../scoring/engine';
import { logAuditEvent } from '../audit/service';
import { getRelevantKnowledgeForCase, type RetrievedKnowledgeDocument } from './vector_store';
import { runSarChainWithRetry, renderNarrativeFromStructuredSar } from './sar_chain';
import { generateSarFromStructuredSummary } from './sar_from_summary';

export interface LLMProvider {
  generateSar(params: {
    case_id: bigint;
    alert_payload: Record<string, unknown>;
    score: ScoreResult;
    typology: string;
  }): Promise<string>;

  /**
   * Generate a full SAR narrative from a structured summary string (e.g. from ML pipeline).
   * Use this when you already have: Subject Information, Activity Overview, Transaction Indicators, etc.
   */
  generateSarFromStructuredSummary(structuredSummary: string): Promise<string>;
}

/**
 * Development-only mock provider used for seeding and offline work.
 * Keeps the previous deterministic text behaviour so existing flows continue to work.
 */
export class MockLLMProvider implements LLMProvider {
  async generateSar(params: {
    case_id: bigint;
    alert_payload: Record<string, unknown>;
    score: ScoreResult;
    typology: string;
  }): Promise<string> {
    const { alert_payload, score, typology } = params;
    const customer_id = (alert_payload.customer_id as string) ?? 'UNKNOWN';
    const triggered =
      score.triggered_rules.map((r) => r.description).join(', ') || 'no major rules';

    return [
      'Customer Profile',
      `- Customer ID: ${customer_id}`,
      `- Typology: ${typology}`,
      '',
      'Alert Summary',
      `- Risk score: ${score.risk_score} (${score.risk_level})`,
      `- Confidence: ${Math.round(score.confidence_score * 100)}%`,
      '',
      'Transaction Analysis',
      `- Triggered indicators: ${triggered}`,
      '',
      'Suspicious Indicators',
      '- This is a deterministic mock narrative for development.',
      '',
      'Typology Mapping',
      `- Primary typology: ${typology}`,
      '',
      'Risk Assessment',
      `- Overall risk level is assessed as ${score.risk_level}.`,
      '',
      'Recommendation',
      '- Recommend manual review by an AML analyst before filing or closing the alert.'
    ].join('\n');
  }

  async generateSarFromStructuredSummary(structuredSummary: string): Promise<string> {
    return [
      'Customer Profile',
      '- Based on structured alert summary below.',
      '',
      'Activity Summary',
      '- See structured summary.',
      '',
      'Suspicious Indicators',
      '- This is a deterministic mock narrative from structured summary (development).',
      '',
      'Recommendation',
      '- Recommend manual review by an AML analyst.',
      '',
      '--- Structured summary used ---',
      structuredSummary.slice(0, 1500)
    ].join('\n');
  }
}

/**
 * Error type used to signal to the API layer that SAR generation
 * failed in a controlled way and a friendly error should be returned.
 */
export class SarGenerationUnavailableError extends Error {
  constructor(message = 'SAR generation temporarily unavailable.') {
    super(message);
    this.name = 'SarGenerationUnavailableError';
  }
}

/**
 * OpenRouter-backed LLM provider that orchestrates:
 * - retrieval from Pinecone (vector store)
 * - SAR prompt construction via LangChain
 * - structured JSON output parsing
 * - final narrative rendering
 * - detailed audit logging
 */
export class LangChainLLMProvider implements LLMProvider {
  private model: ChatOpenAI | null;
  private readonly modelName: string;
  private readonly temperature: number;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    this.modelName =
      process.env.OPENROUTER_MODEL ?? 'meta-llama/llama-3.1-8b-instruct';

    const configuredTemperature = Number(process.env.OPENROUTER_TEMPERATURE ?? '0.2');
    // Clamp to the allowed 0.1–0.3 range.
    this.temperature = Math.min(0.3, Math.max(0.1, Number.isNaN(configuredTemperature) ? 0.2 : configuredTemperature));

    this.model = apiKey
      ? new ChatOpenAI({
        apiKey,
        modelName: this.modelName,
        temperature: this.temperature,
        maxRetries: 2,
        configuration: {
          baseURL: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1'
        }
      })
      : null;
  }

  async generateSar(params: {
    case_id: bigint;
    alert_payload: Record<string, unknown>;
    score: ScoreResult;
    typology: string;
  }): Promise<string> {
    const { case_id, alert_payload, score, typology } = params;

    // If no API key is configured, fall back to the deterministic mock provider.
    if (!this.model) {
      const mock = new MockLLMProvider();
      return mock.generateSar(params);
    }

    try {
      const triggeredRuleDescriptions =
        score.triggered_rules?.map((r) => r.description) ?? [];

      // 1) Retrieve relevant knowledge from Pinecone.
      const knowledge = await getRelevantKnowledgeForCase({
        alert_payload,
        score,
        typology,
        k: 5
      });

      const retrievalQuery = knowledge.query;
      const retrievedDocumentsForAudit = knowledge.documents.map(
        (doc: RetrievedKnowledgeDocument) => ({
          id: doc.id,
          collection: doc.collection,
          metadata: doc.metadata
        })
      );

      // 2) Run the structured SAR generation chain with automatic JSON retry.
      const { structured, rawJson, prompt } = await runSarChainWithRetry(this.model, {
        alert_payload,
        score,
        typology,
        context: knowledge.context,
        triggered_rule_descriptions: triggeredRuleDescriptions
      });

      // 3) Render final narrative text that is stored in the SARReport.
      const narrative = renderNarrativeFromStructuredSar(structured);

      // 4) Audit log for explainability.
      const input_snapshot = {
        provider: 'openrouter',
        model: this.modelName,
        temperature: this.temperature,
        retrieval_query: retrievalQuery,
        retrieved_documents: retrievedDocumentsForAudit,
        prompt,
        score_summary: {
          risk_score: score.risk_score,
          risk_level: score.risk_level,
          confidence_score: score.confidence_score,
          triggered_rules: triggeredRuleDescriptions
        },
        typology,
        customer_id: String(alert_payload.customer_id ?? 'UNKNOWN')
      } as Prisma.InputJsonValue;

      const output_snapshot = {
        structured_sar: structured,
        raw_json: rawJson,
        rendered_narrative: narrative
      } as Prisma.InputJsonValue;

      await logAuditEvent({
        case_id,
        action: 'SAR_LLM_GENERATED',
        actor: 'system-llm',
        input_snapshot,
        output_snapshot
      });

      return narrative;
    } catch (err) {
      // Log a failure event for traceability, but do not crash the API.
      await logAuditEvent({
        case_id: params.case_id,
        action: 'SAR_LLM_FAILED',
        actor: 'system-llm',
        input_snapshot: {
          error: err instanceof Error ? err.message : 'Unknown SAR LLM error',
          model: this.modelName
        }
      });

      throw new SarGenerationUnavailableError();
    }
  }

  async generateSarFromStructuredSummary(structuredSummary: string): Promise<string> {
    if (!this.model) {
      const mock = new MockLLMProvider();
      return mock.generateSarFromStructuredSummary(structuredSummary);
    }
    const { narrative } = await generateSarFromStructuredSummary(
      this.model,
      structuredSummary
    );
    return narrative;
  }
}

