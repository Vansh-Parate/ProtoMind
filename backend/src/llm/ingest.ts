import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { RecursiveCharacterTextSplitter } from '@langchain/community/text_splitter';
import { getRelevantKnowledgeForCase } from './vector_store';
import { ChromaClient, type EmbeddingFunction } from 'chromadb';

type KnowledgeCollectionName = 'aml_typologies' | 'sar_templates' | 'regulatory_guidelines';

const KNOWLEDGE_ROOT = path.join(__dirname, '..', '..', 'knowledge');

async function ensureEmbeddingFunction(): Promise<EmbeddingFunction> {
  // Dynamic import to avoid loading onnxruntime-node at startup.
  const { pipeline } = await import('@xenova/transformers');
  const featureExtractor = await pipeline(
    'feature-extraction',
    process.env.SENTENCE_TRANSFORMER_MODEL ?? 'Xenova/all-MiniLM-L6-v2'
  );

  return {
    async generate(texts: string[]): Promise<number[][]> {
      const embeddings: number[][] = [];
      for (const text of texts) {
        const output = await featureExtractor(text, {
          pooling: 'mean',
          normalize: true
        });
        embeddings.push(Array.from(output.data as Float32Array));
      }
      return embeddings;
    }
  };
}

async function getCollection(
  client: ChromaClient,
  name: KnowledgeCollectionName,
  embeddingFunction: EmbeddingFunction
) {
  try {
    return await client.getCollection({ name, embeddingFunction });
  } catch {
    return client.createCollection({ name, embeddingFunction });
  }
}

async function ingestDirectory(
  client: ChromaClient,
  collectionName: KnowledgeCollectionName,
  dirPath: string,
  embeddingFunction: EmbeddingFunction
) {
  if (!fs.existsSync(dirPath)) return;

  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200
  });

  const collection = await getCollection(client, collectionName, embeddingFunction);

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const fullPath = path.join(dirPath, entry.name);
    const content = await fs.promises.readFile(fullPath, 'utf8');

    const docs = await splitter.createDocuments(
      [content],
      [
        {
          source: path.relative(KNOWLEDGE_ROOT, fullPath),
          collection: collectionName
        }
      ]
    );

    const ids = docs.map(
      (d, index) => `${collectionName}:${path.relative(KNOWLEDGE_ROOT, fullPath)}:${index}`
    );
    const metadatas = docs.map((d) => d.metadata as Record<string, unknown>);
    const documents = docs.map((d) => d.pageContent);

    // Use upsert so the script is idempotent and can be safely re-run.
    await collection.upsert({
      ids,
      metadatas,
      documents
    });
  }
}

async function ingestKnowledge() {
  const client = new ChromaClient({
    path: process.env.CHROMA_URL ?? 'http://localhost:8000'
  });
  const embeddingFunction = await ensureEmbeddingFunction();

  const collections: Array<[KnowledgeCollectionName, string]> = [
    ['aml_typologies', path.join(KNOWLEDGE_ROOT, 'aml_typologies')],
    ['sar_templates', path.join(KNOWLEDGE_ROOT, 'sar_templates')],
    ['regulatory_guidelines', path.join(KNOWLEDGE_ROOT, 'regulatory_guidelines')]
  ];

  console.log(`Ingesting knowledge from ${KNOWLEDGE_ROOT} ...`);

  for (const [name, dir] of collections) {
    console.log(` → Collection "${name}" from ${dir}`);
    await ingestDirectory(client, name, dir, embeddingFunction);
  }

  console.log('Knowledge ingestion complete.');
}

async function main() {
  if (!fs.existsSync(KNOWLEDGE_ROOT)) {
    console.warn(
      `Knowledge directory "${KNOWLEDGE_ROOT}" does not exist. ` +
      'Create it with subfolders "aml_typologies", "sar_templates", and "regulatory_guidelines" and re-run this script.'
    );
    return;
  }

  await ingestKnowledge();

  // Optional: quick sanity check retrieval using a dummy payload to ensure embeddings were stored.
  try {
    await getRelevantKnowledgeForCase({
      alert_payload: { customer_id: 'SANITY-CHECK', transactions: [] },
      score: {
        risk_score: 0,
        risk_level: 'LOW',
        confidence_score: 0.0,
        triggered_rules: []
      },
      typology: 'SANITY_CHECK',
      k: 3
    });
  } catch (err) {
    console.warn(
      'Sanity-check retrieval after ingestion failed. Verify that ChromaDB is running and reachable.',
      err
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

