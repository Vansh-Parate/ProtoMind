import 'dotenv/config';
import { prisma } from '../core/prisma';
import { scoreAlert, AlertPayload } from '../scoring/engine';
import { detectTypology } from '../typologies/detector';
import { MockLLMProvider } from '../llm/provider';
import { generateSarForCase } from '../services/sar';

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeAlertPayload(index: number): AlertPayload {
  const baseCustomerId = `CUST-${90000 + index}`;
  const isHighRisk = index % 2 === 0;

  const transactions = Array.from({ length: randomInt(10, 50) }).map(() => {
    const direction = Math.random() > 0.5 ? 'IN' : 'OUT';
    const days_lookback = randomInt(1, 10);
    const high_risk_geo = Math.random() < (isHighRisk ? 0.4 : 0.1);
    const foreign_country = high_risk_geo && Math.random() > 0.3;

    return {
      direction,
      days_lookback,
      high_risk_geo,
      foreign_country,
      structuring_flag: isHighRisk && Math.random() < 0.3,
      smurfing_flag: isHighRisk && Math.random() < 0.2,
      mule_flag: !isHighRisk && Math.random() < 0.05,
      rapid_movement: isHighRisk && Math.random() < 0.4,
      cross_border_layering: high_risk_geo && Math.random() < 0.3
    };
  });

  const kyc_profile = {
    behavior_inconsistent: isHighRisk && Math.random() < 0.5,
    dormant_recently_activated: Math.random() < 0.2
  };

  return {
    customer_id: baseCustomerId,
    transactions,
    kyc_profile
  };
}

async function main() {
  console.log('Seeding ProtoMind dataset...');

  const provider = new MockLLMProvider();

  for (let i = 0; i < 100; i += 1) {
    const alert = makeAlertPayload(i);
    const score = scoreAlert(alert);
    const typology = detectTypology(alert, score.risk_level);

    const triggered_rules_payload = score.triggered_rules.map((r) => ({
      code: r.code,
      description: r.description,
      weight: r.weight
    }));

    const createdCase = await prisma.case.create({
      data: {
        customer_id: alert.customer_id,
        alert_payload: alert as unknown as object,
        risk_score: score.risk_score,
        risk_level: score.risk_level,
        typology,
        triggered_rules: triggered_rules_payload as unknown as object,
        confidence_score: score.confidence_score,
        status: pick(['PENDING', 'APPROVED', 'REJECTED'])
      }
    });

    await generateSarForCase({
      case_id: createdCase.id,
      provider,
      regenerate: true,
      actor: 'seed-script'
    });
  }

  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

