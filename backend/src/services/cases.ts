import { prisma } from '../core/prisma';
import { AlertPayload, scoreAlert } from '../scoring/engine';
import { detectTypology } from '../typologies/detector';

import { predictRisk } from '../ml/predictor';

export async function createCaseFromAlert(alert: AlertPayload) {
  const score = scoreAlert(alert);
  const typology = detectTypology(alert, score.risk_level);

  // Try ML prediction
  const mlPrediction = await predictRisk(alert);

  // Use ML values if available, otherwise fallback to heuristic
  const finalRiskScore = mlPrediction ? mlPrediction.risk_score : score.risk_score;
  const finalRiskLevel = mlPrediction ? mlPrediction.risk_level : score.risk_level;
  const finalConfidence = mlPrediction ? mlPrediction.confidence : score.confidence_score;

  const triggered_rules_payload = score.triggered_rules.map((r) => ({
    code: r.code,
    description: r.description,
    weight: r.weight
  }));

  const created = await prisma.case.create({
    data: {
      customer_id: alert.customer_id,
      alert_payload: alert as unknown as object,
      risk_score: finalRiskScore,
      risk_level: finalRiskLevel,
      typology,
      triggered_rules: triggered_rules_payload as unknown as object,
      confidence_score: finalConfidence,
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

export async function getCaseById(caseId: number) {
  return prisma.case.findUnique({
    where: { id: caseId }
  });
}

