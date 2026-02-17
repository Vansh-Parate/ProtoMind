import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { getRelevantKnowledgeForCase } from './vector_store';
import { Pinecone } from '@pinecone-database/pinecone';

type KnowledgeCollectionName = 'aml_typologies' | 'sar_templates' | 'regulatory_guidelines';

const KNOWLEDGE_ROOT = path.join(__dirname, '..', '..', 'knowledge');

/** Maximum records per upsertRecords batch (Pinecone limit). */
const BATCH_SIZE = 100;

/** Simple text chunker: split `text` into chunks of `size` characters with `overlap`. */
function chunkText(text: string, size: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + size));
    start += size - overlap;
  }
  return chunks;
}

async function ingestDirectory(
  index: ReturnType<Pinecone['index']>,
  namespaceName: KnowledgeCollectionName,
  dirPath: string
) {
  if (!fs.existsSync(dirPath)) return;

  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

  const ns = index.namespace(namespaceName);

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const fullPath = path.join(dirPath, entry.name);
    const content = await fs.promises.readFile(fullPath, 'utf8');

    // Simple text chunking (1000 chars, 200 overlap)
    const chunks = chunkText(content, 1000, 200);
    const relativePath = path.relative(KNOWLEDGE_ROOT, fullPath);

    // Build records for Pinecone integrated embedding.
    // The index is configured with field map { text: 'text' },
    // so Pinecone will auto-embed the 'text' field.
    const records = chunks.map((chunk: string, idx: number) => ({
      id: `${namespaceName}:${relativePath}:${idx}`,
      text: chunk,
      source: relativePath,
      collection: namespaceName
    }));

    // Upsert in batches to stay within API limits.
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      await ns.upsertRecords({ records: batch } as any);
    }

    console.log(`   ✓ ${entry.name} → ${records.length} chunks`);
  }
}

async function ingestKnowledge() {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    console.error('PINECONE_API_KEY environment variable is not set.');
    process.exit(1);
  }

  const indexName = process.env.PINECONE_INDEX_NAME ?? 'protomind-knowledge';
  const pc = new Pinecone({ apiKey });
  const index = pc.index(indexName);

  const collections: Array<[KnowledgeCollectionName, string]> = [
    ['aml_typologies', path.join(KNOWLEDGE_ROOT, 'aml_typologies')],
    ['sar_templates', path.join(KNOWLEDGE_ROOT, 'sar_templates')],
    ['regulatory_guidelines', path.join(KNOWLEDGE_ROOT, 'regulatory_guidelines')]
  ];

  console.log(`Ingesting knowledge from ${KNOWLEDGE_ROOT} ...`);

  for (const [name, dir] of collections) {
    console.log(` → Namespace "${name}" from ${dir}`);
    await ingestDirectory(index, name, dir);
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
    console.log('Sanity-check retrieval succeeded.');
  } catch (err) {
    console.warn(
      'Sanity-check retrieval after ingestion failed. Verify that Pinecone is configured correctly.',
      err
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
