import { z } from 'zod';

export const TransactionSchema = z.object({
  direction: z.string().optional(), // 'IN' | 'OUT'
  days_lookback: z.number().optional(),
  foreign_country: z.boolean().optional(),
  high_risk_geo: z.boolean().optional(),
  structuring_flag: z.boolean().optional(),
  smurfing_flag: z.boolean().optional(),
  mule_flag: z.boolean().optional(),
  rapid_movement: z.boolean().optional(),
  cross_border_layering: z.boolean().optional()
});

export const KycProfileSchema = z
  .object({
    behavior_inconsistent: z.boolean().optional(),
    dormant_recently_activated: z.boolean().optional()
  })
  .optional();

export const AlertPayloadSchema = z.object({
  customer_id: z.string(),
  transactions: z.array(TransactionSchema),
  kyc_profile: KycProfileSchema
});

export type AlertPayload = z.infer<typeof AlertPayloadSchema>;

export interface TriggeredRule {
  code: string;
  description: string;
  weight: number;
}

export interface ScoreResult {
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence_score: number;
  triggered_rules: TriggeredRule[];
}

const RISK_THRESHOLD_HIGH = 70;
const RISK_THRESHOLD_MEDIUM = 40;

function ruleManyInboundTransfers(alert: AlertPayload): TriggeredRule | null {
  const inboundCount = alert.transactions.filter(
    (tx) => tx.direction === 'IN' && (tx.days_lookback ?? 999) <= 7
  ).length;
  if (inboundCount > 30) {
    return {
      code: 'MANY_INBOUND_TRANSFERS_7D',
      description: `${inboundCount} inbound transfers within 7 days`,
      weight: 30
    };
  }
  return null;
}

function ruleCrossBorder(alert: AlertPayload): TriggeredRule | null {
  if (alert.transactions.some((tx) => tx.foreign_country)) {
    return {
      code: 'CROSS_BORDER',
      description: 'Cross-border pattern detected',
      weight: 25
    };
  }
  return null;
}

function ruleBehaviorInconsistentWithKyc(alert: AlertPayload): TriggeredRule | null {
  if (alert.kyc_profile?.behavior_inconsistent) {
    return {
      code: 'INCONSISTENT_WITH_KYC',
      description: 'Activity inconsistent with historical / KYC profile',
      weight: 20
    };
  }
  return null;
}

function ruleDormantAccountActivation(alert: AlertPayload): TriggeredRule | null {
  if (alert.kyc_profile?.dormant_recently_activated) {
    return {
      code: 'DORMANT_ACCOUNT_ACTIVATION',
      description: 'Dormant account recently became active',
      weight: 15
    };
  }
  return null;
}

function ruleHighRiskGeography(alert: AlertPayload): TriggeredRule | null {
  if (alert.transactions.some((tx) => tx.high_risk_geo)) {
    return {
      code: 'HIGH_RISK_GEOGRAPHY',
      description: 'Transactions involve high-risk geography',
      weight: 10
    };
  }
  return null;
}

const RULES = [
  ruleManyInboundTransfers,
  ruleCrossBorder,
  ruleBehaviorInconsistentWithKyc,
  ruleDormantAccountActivation,
  ruleHighRiskGeography
];

export function scoreAlert(alert: AlertPayload): ScoreResult {
  const triggered_rules: TriggeredRule[] = [];
  let total = 0;

  for (const rule of RULES) {
    const result = rule(alert);
    if (result) {
      triggered_rules.push(result);
      total += result.weight;
    }
  }

  let risk_level: ScoreResult['risk_level'];
  let confidence_score: number;

  if (total >= RISK_THRESHOLD_HIGH) {
    risk_level = 'HIGH';
    confidence_score = 0.9;
  } else if (total >= RISK_THRESHOLD_MEDIUM) {
    risk_level = 'MEDIUM';
    confidence_score = 0.75;
  } else {
    risk_level = 'LOW';
    confidence_score = 0.5;
  }

  return {
    risk_score: total,
    risk_level,
    confidence_score,
    triggered_rules
  };
}

