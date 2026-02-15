import type { ScoreResult } from '../scoring/engine';
import { Pinecone } from '@pinecone-database/pinecone';

type KnowledgeCollectionName = 'aml_typologies' | 'sar_templates' | 'regulatory_guidelines';

export interface RetrievedKnowledgeDocument {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  collection: KnowledgeCollectionName;
}

export interface KnowledgeRetrievalResult {
  query: string;
  context: string;
  documents: RetrievedKnowledgeDocument[];
}

interface KnowledgeRetrievalParams {
  alert_payload: Record<string, unknown>;
  score: ScoreResult;
  typology: string;
  k?: number;
}

let pineconeIndex: ReturnType<Pinecone['index']> | null = null;

function getPineconeIndex() {
  if (pineconeIndex) return pineconeIndex;

  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error('PINECONE_API_KEY environment variable is not set.');
  }

  const indexName = process.env.PINECONE_INDEX_NAME ?? 'protomind-knowledge';
  const pc = new Pinecone({ apiKey });
  pineconeIndex = pc.index(indexName);
  return pineconeIndex;
}

function buildRetrievalQuery(params: KnowledgeRetrievalParams): string {
  const { alert_payload, score, typology } = params;

  const customerId = (alert_payload.customer_id as string | undefined) ?? 'UNKNOWN';
  const triggeredDescriptions =
    score.triggered_rules?.map((r) => r.description).join('; ') ?? 'None';

  const transactions = Array.isArray((alert_payload as any).transactions)
    ? ((alert_payload as any).transactions as Array<Record<string, unknown>>)
    : [];

  const behaviorSummary =
    transactions.length === 0
      ? 'No transaction behaviour available.'
      : `Sample transaction behaviour (first 5 records): ${JSON.stringify(
        transactions.slice(0, 5)
      )}`;

  return [
    `Customer ID: ${customerId}`,
    `Typology: ${typology}`,
    `Risk score: ${score.risk_score} (${score.risk_level})`,
    `Confidence: ${Math.round(score.confidence_score * 100)}%`,
    `Triggered rules: ${triggeredDescriptions}`,
    behaviorSummary
  ].join('\n');
}

/**
 * Retrieve top-k knowledge snippets across all configured namespaces in Pinecone.
 *
 * Uses Pinecone's integrated embedding — the query text is embedded server-side
 * by the model configured on the index (e.g. llama-text-embed-v2).
 */
export async function getRelevantKnowledgeForCase(
  params: KnowledgeRetrievalParams
): Promise<KnowledgeRetrievalResult> {
  const { k = 5 } = params;
  const query = buildRetrievalQuery(params);
  const index = getPineconeIndex();

  // Each knowledge category is stored as a separate Pinecone namespace.
  const namespaces: KnowledgeCollectionName[] = [
    'aml_typologies',
    'sar_templates',
    'regulatory_guidelines'
  ];

  const allDocs: RetrievedKnowledgeDocument[] = [];

  for (const ns of namespaces) {
    try {
      const results = await index.namespace(ns).searchRecords({
        query: {
          inputs: { text: query },
          topK: k
        },
        fields: ['text', 'source', 'collection']
      });

      const hits = (results as any).result?.hits ?? [];

      for (const hit of hits) {
        const fields = hit.fields ?? {};
        allDocs.push({
          id: String(hit._id ?? hit.id ?? ''),
          content: String(fields.text ?? ''),
          metadata: { source: fields.source, ...fields },
          collection: ns
        });
      }
    } catch (err) {
      // If the namespace is empty or doesn't exist yet, skip gracefully.
      console.warn(`[vector_store] Failed to query namespace "${ns}":`, err);
    }
  }

  // Keep only the first k documents overall to avoid overloading the prompt.
  const topDocs = allDocs.slice(0, k);
  const context = topDocs
    .map(
      (doc, index) =>
        `[#${index + 1} – ${doc.collection}] ${doc.content}\nMETADATA: ${JSON.stringify(
          doc.metadata
        )}`
    )
    .join('\n\n---\n\n');

  return {
    query,
    context,
    documents: topDocs
  };
}
