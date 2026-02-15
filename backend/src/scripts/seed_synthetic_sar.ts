/**
 * Seed the database with synthetic SAR data from synthetic_sar_dataset.csv.
 * - Removes all existing Cases, SARReports, and AuditLogs (demo data).
 * - Imports ALL rows from the CSV (not just attention_required=1).
 * - Uses the notebook's ML feature importances to compute realistic risk scores.
 * - attention_required=1  → HIGH risk  (SAR generated via LangChain)
 * - attention_required=0  → LOW or MEDIUM risk (no SAR narrative needed)
 *
 * Run from repo root: npx ts-node --project backend/tsconfig.json backend/src/scripts/seed_synthetic_sar.ts
 * Or: npm run seed:synthetic (if script is added)
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../core/prisma';
import { LangChainLLMProvider } from '../llm/provider';
import { logAuditEvent } from '../audit/service';

// CSV at repo root; run from repo root: npm run seed:synthetic
const CSV_PATH = path.resolve(process.cwd(), 'synthetic_sar_dataset.csv');

interface CsvRow {
  customer_id: string;
  kyc_risk_level: string;
  customer_type: string;
  occupation: string;
  relationship_years: string;
  total_incoming_amount: string;
  total_outgoing_amount: string;
  num_incoming_transactions: string;
  num_unique_senders: string;
  foreign_transfer_flag: string;
  volume_spike_ratio: string;
  rapid_fund_movement_flag: string;
  structuring_flag: string;
  layering_flag: string;
  mule_account_indicator: string;
  past_alert_count: string;
  transaction_deviation_score: string;
  matched_typology: string;
  attention_required: string;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = values[j] ?? '';
    });
    rows.push(row as unknown as CsvRow);
  }
  return rows;
}

function num(row: CsvRow, key: keyof CsvRow): number {
  const v = String(row[key] ?? '').trim();
  const n = parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
}

function generateRiskSignals(row: CsvRow): string[] {
  const signals: string[] = [];
  if (num(row, 'foreign_transfer_flag') === 1) signals.push('Foreign remittance detected');
  if (num(row, 'structuring_flag') === 1) signals.push('Structuring behavior identified');
  if (num(row, 'layering_flag') === 1) signals.push('Layering pattern observed');
  if (num(row, 'mule_account_indicator') === 1) signals.push('Potential mule account usage');
  if (num(row, 'rapid_fund_movement_flag') === 1) signals.push('Rapid movement of funds');
  if (num(row, 'volume_spike_ratio') > 2) signals.push('Unusual volume spike compared to historical behavior');
  if (num(row, 'transaction_deviation_score') > 2) signals.push("Significant deviation from customer's normal activity");
  if (num(row, 'past_alert_count') > 1) signals.push('Multiple historical alerts');
  return signals;
}

function createStructuredSummary(row: CsvRow, signals: string[]): string {
  return `
Subject Information:
- KYC Risk Level: ${row.kyc_risk_level}
- Customer Type: ${row.customer_type}
- Occupation: ${row.occupation}
- Relationship Duration: ${row.relationship_years} years

Activity Overview:
- Total Incoming Amount: ₹${row.total_incoming_amount}
- Total Outgoing Amount: ₹${row.total_outgoing_amount}
- Number of Incoming Transactions: ${row.num_incoming_transactions}
- Unique Senders: ${row.num_unique_senders}
- Foreign Transfer: ${row.foreign_transfer_flag}

Transaction Pattern Indicators:
${signals.length > 0 ? signals.map((s) => `- ${s}`).join('\n') : '- No suspicious patterns detected'}

Historical Context:
- Past Alerts: ${row.past_alert_count}
- Deviation Score: ${row.transaction_deviation_score}
`.trim();
}

/**
 * Compute a risk score (0–100) based on the notebook's feature importances.
 *
 * Feature importance weights from the RandomForest model (risk-prediction.ipynb):
 *   total_outgoing_amount:       0.158
 *   volume_spike_ratio:          0.155
 *   matched_typology:            0.138
 *   num_unique_senders:          0.133
 *   num_incoming_transactions:   0.129
 *   total_incoming_amount:       0.125
 *   transaction_deviation_score: 0.125
 *   structuring_flag:            0.014
 *   rapid_fund_movement_flag:    0.012
 *   foreign_transfer_flag:       0.006
 *   layering_flag:               0.002
 *   mule_account_indicator:      0.002
 *   past_alert_count:            0.002
 *
 * We normalise each feature to a 0–1 range using approximate thresholds
 * derived from the dataset, then compute a weighted sum scaled to 0–100.
 */
function computeRiskScore(row: CsvRow): number {
  // Normalise helpers – clamp to [0,1]
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  const norm = (val: number, max: number) => clamp01(val / max);

  // Approximate max values from the dataset for normalisation
  const totalOutgoing = norm(num(row, 'total_outgoing_amount'), 6_000_000);
  const volumeSpike = norm(num(row, 'volume_spike_ratio'), 6);
  const typologyScore = row.matched_typology && row.matched_typology !== 'None' ? 1 : 0;
  const uniqueSenders = norm(num(row, 'num_unique_senders'), 70);
  const incomingTxns = norm(num(row, 'num_incoming_transactions'), 90);
  const totalIncoming = norm(num(row, 'total_incoming_amount'), 6_000_000);
  const deviationScore = norm(num(row, 'transaction_deviation_score'), 5);
  const structuringFlag = num(row, 'structuring_flag');
  const rapidMovement = num(row, 'rapid_fund_movement_flag');
  const foreignTransfer = num(row, 'foreign_transfer_flag');
  const layeringFlag = num(row, 'layering_flag');
  const muleIndicator = num(row, 'mule_account_indicator');
  const pastAlerts = norm(num(row, 'past_alert_count'), 3);

  const weightedSum =
    totalOutgoing * 0.158 +
    volumeSpike * 0.155 +
    typologyScore * 0.138 +
    uniqueSenders * 0.133 +
    incomingTxns * 0.129 +
    totalIncoming * 0.125 +
    deviationScore * 0.125 +
    structuringFlag * 0.014 +
    rapidMovement * 0.012 +
    foreignTransfer * 0.006 +
    layeringFlag * 0.002 +
    muleIndicator * 0.002 +
    pastAlerts * 0.002;

  // weightedSum is in [0, ~1]. Scale to 0–100 and round.
  return Math.round(weightedSum * 100);
}

/**
 * Determine risk level from the CSV row.
 * Uses the ML-predicted `attention_required` column as the primary signal,
 * plus the computed risk score for differentiating LOW vs MEDIUM.
 */
function determineRiskLevel(row: CsvRow, riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  // attention_required=1 means the ML model flagged this case (100% accuracy per notebook)
  if (row.attention_required === '1') {
    return 'HIGH';
  }

  // For non-flagged cases, differentiate based on computed score
  if (riskScore >= 30) {
    return 'MEDIUM';
  }
  return 'LOW';
}

/**
 * Compute confidence score based on risk level.
 * HIGH cases have high confidence (ML model had 1.0 accuracy).
 * MEDIUM/LOW are more nuanced.
 */
function computeConfidenceScore(riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'): number {
  switch (riskLevel) {
    case 'HIGH':
      return 0.95;
    case 'MEDIUM':
      return 0.7;
    case 'LOW':
      return 0.5;
  }
}

function signalsToTriggeredRules(signals: string[]): Array<{ code: string; description: string; weight: number }> {
  // Assign variable weights based on signal type for more realistic scoring
  const weightMap: Record<string, number> = {
    'Foreign remittance detected': 10,
    'Structuring behavior identified': 20,
    'Layering pattern observed': 18,
    'Potential mule account usage': 22,
    'Rapid movement of funds': 15,
    'Unusual volume spike compared to historical behavior': 12,
    "Significant deviation from customer's normal activity": 14,
    'Multiple historical alerts': 8,
  };

  return signals.map((desc, i) => ({
    code: `SIGNAL_${i + 1}`,
    description: desc,
    weight: weightMap[desc] ?? 10,
  }));
}

async function main() {
  console.log('Reading CSV from', CSV_PATH);
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const allRows = parseCsv(content);

  const highRiskCount = allRows.filter((r) => r.attention_required === '1').length;
  const lowMediumCount = allRows.filter((r) => r.attention_required === '0').length;
  console.log(`Total rows: ${allRows.length}, high-risk: ${highRiskCount}, low/medium-risk: ${lowMediumCount}`);

  console.log('Clearing existing demo data...');
  await prisma.auditLog.deleteMany({});
  await prisma.sARReport.deleteMany({});
  await prisma.case.deleteMany({});

  const provider = new LangChainLLMProvider();
  let created = 0;
  let sarGenerated = 0;

  for (const row of allRows) {
    const signals = generateRiskSignals(row);
    const triggered_rules = signalsToTriggeredRules(signals);
    const typology = row.matched_typology && row.matched_typology !== 'None' ? row.matched_typology : 'Normal';
    const riskScore = computeRiskScore(row);
    const riskLevel = determineRiskLevel(row, riskScore);
    const confidenceScore = computeConfidenceScore(riskLevel);

    // Assign statuses based on risk level for a realistic dashboard
    let status: string;
    if (riskLevel === 'HIGH') {
      status = 'PENDING';
    } else if (riskLevel === 'MEDIUM') {
      status = Math.random() < 0.5 ? 'PENDING' : 'APPROVED';
    } else {
      status = 'APPROVED';
    }

    const createdCase = await prisma.case.create({
      data: {
        customer_id: row.customer_id,
        alert_payload: row as unknown as object,
        risk_score: riskScore,
        risk_level: riskLevel,
        typology,
        triggered_rules: triggered_rules as unknown as object,
        confidence_score: confidenceScore,
        status,
      },
    });

    // Only generate LLM SAR narratives for HIGH-risk cases
    if (riskLevel === 'HIGH') {
      const structuredSummary = createStructuredSummary(row, signals);
      const narrative = await provider.generateSarFromStructuredSummary(structuredSummary);

      await prisma.sARReport.create({
        data: {
          case_id: createdCase.id,
          generated_text: narrative,
        },
      });

      sarGenerated++;
    }

    await logAuditEvent({
      case_id: createdCase.id,
      action: riskLevel === 'HIGH' ? 'SAR_GENERATED' : 'CASE_CREATED',
      actor: 'seed_synthetic_sar',
      input_snapshot: { source: 'synthetic_sar_dataset.csv', customer_id: row.customer_id },
      output_snapshot: {},
    });

    created++;
    if (created % 10 === 0) console.log(`  Created ${created}/${allRows.length} cases (${sarGenerated} SARs)...`);
  }

  console.log(`\nDone. Created ${created} cases total.`);
  console.log(`  HIGH risk (SAR generated): ${sarGenerated}`);
  console.log(`  MEDIUM + LOW risk: ${created - sarGenerated}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
