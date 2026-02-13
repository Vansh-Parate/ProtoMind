import type { ScoreResult } from '../scoring/engine';
import { ChromaClient, type Collection, type EmbeddingFunction } from 'chromadb';
import { pipeline } from '@xenova/transformers';

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

let chromaClient: ChromaClient | null = null;
let embeddingFunction: EmbeddingFunction | null = null;
let collectionsCache: Partial<Record<KnowledgeCollectionName, Collection>> = {};

async function getChromaClient(): Promise<ChromaClient> {
  if (!chromaClient) {
    const url = process.env.CHROMA_URL ?? 'http://localhost:8000';
    chromaClient = new ChromaClient({ path: url });
  }
  return chromaClient;
}

async function getEmbeddingFunction(): Promise<EmbeddingFunction> {
  if (embeddingFunction) return embeddingFunction;

  // Use a local sentence-transformer-style model via transformers.js.
  const featureExtractor = await pipeline(
    'feature-extraction',
    process.env.SENTENCE_TRANSFORMER_MODEL ?? 'Xenova/all-MiniLM-L6-v2'
  );

  embeddingFunction = {
    async generate(texts: string[]): Promise<number[][]> {
      const embeddings: number[][] = [];
      // Sequential to avoid uncontrolled parallel memory pressure.
      // Chroma caches embeddings, so repeated queries remain fast.
      for (const text of texts) {
        const output = await featureExtractor(text, {
          pooling: 'mean',
          normalize: true
        });
        // transformers.js returns a Tensor-like object with a `data` property.
        embeddings.push(Array.from(output.data as Float32Array));
      }
      return embeddings;
    }
  };

  return embeddingFunction;
}

async function getOrCreateCollection(
  name: KnowledgeCollectionName
): Promise<Collection> {
  if (collectionsCache[name]) return collectionsCache[name] as Collection;

  const client = await getChromaClient();
  const embFn = await getEmbeddingFunction();

  // Try to fetch existing collection; fall back to create.
  let collection: Collection;
  try {
    collection = await client.getCollection({ name, embeddingFunction: embFn });
  } catch {
    collection = await client.createCollection({ name, embeddingFunction: embFn });
  }

  collectionsCache[name] = collection;
  return collection;
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
 * Retrieve top-k knowledge snippets across all configured collections.
 *
 * This function is used both by the ingestion script (for sanity checks)
 * and by the main SAR generation flow.
 */
export async function getRelevantKnowledgeForCase(
  params: KnowledgeRetrievalParams
): Promise<KnowledgeRetrievalResult> {
  const { k = 5 } = params;
  const query = buildRetrievalQuery(params);

  // Query each collection independently, then merge the results.
  const collectionNames: KnowledgeCollectionName[] = [
    'aml_typologies',
    'sar_templates',
    'regulatory_guidelines'
  ];

  const allDocs: RetrievedKnowledgeDocument[] = [];

  for (const collectionName of collectionNames) {
    const collection = await getOrCreateCollection(collectionName);

    const results = await collection.query({
      queryTexts: [query],
      nResults: k
    });

    const ids = results.ids?.[0] ?? [];
    const docs = results.documents?.[0] ?? [];
    const metadatas = results.metadatas?.[0] ?? [];

    for (let i = 0; i < ids.length; i += 1) {
      if (!docs[i]) continue;
      allDocs.push({
        id: String(ids[i]),
        content: String(docs[i]),
        metadata: (metadatas[i] as Record<string, unknown>) ?? {},
        collection: collectionName
      });
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

