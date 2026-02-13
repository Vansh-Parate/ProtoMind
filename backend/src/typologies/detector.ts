import { AlertPayload } from '../scoring/engine';

export function detectTypology(alert: AlertPayload, risk_level: 'LOW' | 'MEDIUM' | 'HIGH'): string {
  const directions = alert.transactions.map((tx) => (tx.direction ?? '').toUpperCase());

  if (alert.transactions.some((tx) => tx.structuring_flag)) {
    return 'Structuring';
  }

  if (alert.transactions.some((tx) => tx.smurfing_flag)) {
    return 'Smurfing';
  }

  if (alert.transactions.some((tx) => tx.mule_flag)) {
    return 'Mule account';
  }

  if (
    directions.includes('IN') &&
    directions.includes('OUT') &&
    alert.transactions.some((tx) => tx.rapid_movement)
  ) {
    return 'Rapid movement of funds';
  }

  if (alert.transactions.some((tx) => tx.cross_border_layering)) {
    return 'Cross-border layering';
  }

  if (risk_level === 'HIGH') return 'Unusual high-risk activity';
  if (risk_level === 'MEDIUM') return 'Unusual activity';
  return 'Low-risk activity pattern';
}

