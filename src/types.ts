export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type CaseStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SarCaseSummary {
  id: string;
  customerId: string;
  typology: string;
  risk: RiskLevel;
  status: CaseStatus;
  createdAt: string;
  score: number;
}

export interface SarCaseDetail extends SarCaseSummary {
  whyGenerated: string[];
  narrativeGenerated: string;
  narrativeEdited: string;
}

