import { prisma } from '../core/prisma';
import { AlertPayload, scoreAlert } from '../scoring/engine';
import { detectTypology } from '../typologies/detector';

export async function createCaseFromAlert(alert: AlertPayload) {
  const score = scoreAlert(alert);
  const typology = detectTypology(alert, score.risk_level);

  const triggered_rules_payload = score.triggered_rules.map((r) => ({
    code: r.code,
    description: r.description,
    weight: r.weight
  }));

  const created = await prisma.case.create({
    data: {
      customer_id: alert.customer_id,
      alert_payload: alert as unknown as object,
      risk_score: score.risk_score,
      risk_level: score.risk_level,
      typology,
      triggered_rules: triggered_rules_payload as unknown as object,
      confidence_score: score.confidence_score,
      status: 'PENDING'
    }
  });

  return created;
}

export async function listCases() {
  return prisma.case.findMany({
    orderBy: { created_at: 'desc' },
    take: 200
  });
}

export async function getCaseById(caseId: bigint) {
  return prisma.case.findUnique({
    where: { id: caseId }
  });
}

