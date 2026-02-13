import { SarCaseDetail } from '../types';

export const mockCases: SarCaseDetail[] = [
  {
    id: '12345',
    customerId: 'CUST-90821',
    typology: 'Structuring',
    risk: 'HIGH',
    status: 'PENDING',
    createdAt: '2026-02-10T10:15:00Z',
    score: 85,
    whyGenerated: [
      '35 inbound transfers in 7 days',
      'Cross-border pattern detected',
      'Typology: Structuring'
    ],
    narrativeGenerated:
      'On February 10, 2026, an automated monitoring system generated an alert for customer CUST-90821 due to a high volume of inbound wire transfers over a short period. The account received 35 inbound transfers within seven days, primarily from foreign financial institutions in higher-risk jurisdictions. Transaction amounts were structured just below USD 10,000, suggesting potential evasion of currency transaction reporting thresholds.',
    narrativeEdited: ''
  },
  {
    id: '12346',
    customerId: 'CUST-10234',
    typology: 'Unusual Cash Activity',
    risk: 'MEDIUM',
    status: 'PENDING',
    createdAt: '2026-02-09T09:30:00Z',
    score: 72,
    whyGenerated: [
      'Spike in cash deposits',
      'Activity inconsistent with historical profile'
    ],
    narrativeGenerated:
      'Customer CUST-10234 exhibited a sudden increase in cash deposits over a three-day period. The pattern and volume of deposits are inconsistent with the customer’s historical activity profile and stated occupation.',
    narrativeEdited: ''
  }
];

