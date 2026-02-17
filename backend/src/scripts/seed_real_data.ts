/**
 * Seed the database with sar_compliant_dataset_500.csv.
 * - Clears all existing Cases, SARReports, AuditLogs.
 * - Imports EVERY column from the CSV into alert_payload (Json).
 * - Uses risk_score / risk_level from the CSV directly.
 * - Generates rich SAR narratives for HIGH risk cases via the
 *   LangChain structured chain, injecting an ML risk-prediction summary
 *   into the context so the LLM can leverage model insights.
 *
 * Run:  npm run seed:real
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { Prisma, PrismaClient } from '@prisma/client';
import { LangChainLLMProvider } from '../llm/provider';
import { logAuditEvent } from '../audit/service';

const prisma = new PrismaClient();

// CSV lives inside backend/
const CSV_PATH = path.resolve(process.cwd(), 'backend', 'sar_compliant_dataset_500.csv');

// ------------------------------------------------------------------ helpers

/** Build a human-readable ML risk summary from the row features. */
function buildRiskSummary(row: Record<string, string>): string {
    const factors: string[] = [];

    if (row.structuring_flag === '1') factors.push('Structuring pattern detected');
    if (row.rapid_movement_flag === '1') factors.push('Rapid fund movement observed');
    if (row.layering_flag === '1') factors.push('Layering behavior identified');
    if (row.mule_account_flag === '1') factors.push('Potential mule account activity');
    if (row.international_transfer_flag === '1') factors.push('International transfers present');
    if (row.high_risk_geo_flag === '1') factors.push('High-risk geography involvement');
    if (row.previous_sar_flag === '1') factors.push('Prior SAR filing on record');
    if (row.profile_deviation_flag === '1') factors.push('Profile deviation flagged');

    const deviation = parseFloat(row.deviation_score);
    if (!isNaN(deviation) && deviation > 3)
        factors.push(`High deviation score (${deviation.toFixed(2)})`);

    const velocity = parseFloat(row.velocity_score);
    if (!isNaN(velocity) && velocity > 5)
        factors.push(`Elevated velocity score (${velocity.toFixed(2)})`);

    const prevAlerts = parseInt(row.previous_alerts, 10);
    if (!isNaN(prevAlerts) && prevAlerts >= 3)
        factors.push(`${prevAlerts} previous alerts on file`);

    const summary = factors.length > 0 ? factors.join('; ') : 'No prominent risk indicators';
    return `ML Risk Prediction Summary — ${row.risk_level} risk (score ${row.risk_score}/10). Key factors: ${summary}.`;
}

/** Map the CSV triggered_rules code to a readable description. */
function expandTriggeredRule(code: string): string {
    const map: Record<string, string> = {
        RULE_001: 'Large cash transaction exceeding threshold',
        RULE_045: 'Multiple rapid transfers between accounts',
        RULE_089: 'Unusual cross-border remittance pattern',
        RULE_120: 'Transaction structuring below reporting limits',
        MANUAL: 'Flagged for manual analyst review',
    };
    return map[code] ?? `Rule ${code} triggered`;
}

// ------------------------------------------------------------------ main

async function main() {
    // 0. Enforce REAL LLM usage
    if (!process.env.OPENROUTER_API_KEY) {
        console.error('❌ ERROR: OPENROUTER_API_KEY is missing in .env');
        console.error('   The user explicitly requested a REAL LLM (OpenRouter), not a mock.');
        console.error('   Please add OPENROUTER_API_KEY to your .env file and retry.');
        process.exit(1);
    }
    console.log('✅ OPENROUTER_API_KEY found. Using REAL LLM for SAR generation.');

    // 1. Read & parse CSV ------------------------------------------------
    console.log(`Reading CSV from ${CSV_PATH}`);
    if (!fs.existsSync(CSV_PATH)) {
        console.error('CSV file not found at', CSV_PATH);
        process.exit(1);
    }

    const raw = fs.readFileSync(CSV_PATH, 'utf-8');

    // csv-parse handles quoted multi-line fields, commas inside quotes, etc.
    const rows: Record<string, string>[] = parse(raw, {
        columns: true,          // first line = header
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        relax_column_count: true,
    });

    console.log(`Parsed ${rows.length} rows with ${Object.keys(rows[0] ?? {}).length} columns each.`);

    // 2. Clear existing data ---------------------------------------------
    console.log('Clearing existing data (AuditLog → SARReport → Case)...');
    await prisma.auditLog.deleteMany({});
    await prisma.sARReport.deleteMany({});
    await prisma.case.deleteMany({});
    console.log('Existing data cleared.');

    // 3. Seed rows -------------------------------------------------------
    const provider = new LangChainLLMProvider();
    let created = 0;
    let sarCount = 0;

    for (const row of rows) {
        // --- risk fields ---------------------------------------------------
        const riskScoreRaw = parseInt(row.risk_score, 10);
        const riskScore = isNaN(riskScoreRaw) ? 0 : riskScoreRaw * 10;

        const riskLevelNorm = (row.risk_level ?? 'Low').trim();
        const riskLevel = riskLevelNorm.toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW';

        const confidence =
            riskLevel === 'HIGH' ? 0.95 : riskLevel === 'MEDIUM' ? 0.70 : 0.50;

        // --- triggered rules -----------------------------------------------
        const ruleCode = (row.triggered_rules ?? '').trim() || 'MANUAL';
        const triggeredRules = [
            {
                code: ruleCode,
                description: expandTriggeredRule(ruleCode),
                weight: riskLevel === 'HIGH' ? 20 : riskLevel === 'MEDIUM' ? 12 : 5,
            },
        ];

        // --- alert_payload = entire CSV row + ML summary -------------------
        const mlRiskSummary = buildRiskSummary(row);
        const alertPayload: Record<string, unknown> = {
            ...row,                       // ← ALL 53 columns preserved
            ml_risk_summary: mlRiskSummary,
        };

        // --- status --------------------------------------------------------
        let status: string;
        const csvStatus = (row.review_status ?? '').trim();
        if (csvStatus === 'Approved' || csvStatus === 'Rejected' || csvStatus === 'Pending') {
            status = csvStatus.toUpperCase();
        } else {
            status =
                riskLevel === 'HIGH'
                    ? 'PENDING'
                    : riskLevel === 'MEDIUM'
                        ? Math.random() < 0.4 ? 'PENDING' : 'APPROVED'
                        : 'APPROVED';
        }

        // --- typology ------------------------------------------------------
        const typology = (row.typology_matched ?? '').trim() || 'Unknown';

        // --- create Case ---------------------------------------------------
        const createdCase = await prisma.case.create({
            data: {
                customer_id: row.customer_id ?? `UNKNOWN_${created}`,
                alert_payload: alertPayload as Prisma.InputJsonValue,
                risk_score: riskScore,
                risk_level: riskLevel,
                typology,
                triggered_rules: triggeredRules,
                confidence_score: confidence,
                status,
            },
        });

        // --- audit log -----------------------------------------------------
        await logAuditEvent({
            case_id: Number(createdCase.id),
            action: riskLevel === 'HIGH' ? 'SAR_GENERATED' : 'CASE_CREATED',
            actor: 'seed_real_data',
            input_snapshot: {
                source: 'sar_compliant_dataset_500.csv',
                sar_id: row.sar_id,
                customer_id: row.customer_id,
            } as Prisma.InputJsonValue,
            output_snapshot: {},
        });

        // --- generate SAR narrative for HIGH-risk cases --------------------
        if (riskLevel === 'HIGH') {
            try {
                const narrative = await provider.generateSar({
                    case_id: Number(createdCase.id),
                    alert_payload: alertPayload,
                    score: {
                        risk_score: riskScore,
                        risk_level: riskLevel,
                        confidence_score: confidence,
                        triggered_rules: triggeredRules,
                    },
                    typology,
                });

                await prisma.sARReport.create({
                    data: {
                        case_id: createdCase.id,
                        generated_text: narrative,
                    },
                });

                sarCount++;
                console.log(
                    `  ✓ SAR #${sarCount} generated for Case ${createdCase.id} (${row.customer_name ?? row.customer_id})`
                );
            } catch (err: any) {
                console.error(
                    `  ✗ SAR failed for Case ${createdCase.id}: ${err.message ?? err}`
                );
            }
        }

        created++;
        if (created % 25 === 0) {
            console.log(`  … ${created}/${rows.length} cases created (${sarCount} SARs)`);
        }
    }

    // 4. Summary ---------------------------------------------------------
    console.log('\n══════════════════════════════════════════════');
    console.log(`  Total cases created : ${created}`);
    console.log(`  SAR narratives      : ${sarCount}`);
    console.log(`  Columns per row     : ${Object.keys(rows[0] ?? {}).length}`);
    console.log('══════════════════════════════════════════════\n');
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
