import type { SarCaseDetail } from './types';

/** Editable form fields for the formal SAR report (Parts I–IV). Part V narrative is handled separately. */
export interface SarFormData {
  // Part I
  correctsPriorReport: boolean;
  nameOfInstitution: string;
  ein: string;
  addressOfInstitution: string;
  primaryRegulator: string;
  city: string;
  state: string;
  zipCode: string;
  branchAddress: string;
  multipleBranches: boolean;
  branchCity: string;
  branchState: string;
  branchZipCode: string;
  dateClosed: string;
  accountNumbers: string[];
  accountClosed: boolean[];
  // Part II
  suspectUnavailable: boolean;
  suspectLastName: string;
  suspectFirstName: string;
  suspectMiddle: string;
  suspectAddress: string;
  ssnEinTin: string;
  suspectCity: string;
  suspectState: string;
  suspectZipCode: string;
  suspectCountry: string;
  phoneResidence: string;
  phoneWork: string;
  occupation: string;
  dateOfBirth: string;
  admissionConfession: 'yes' | 'no' | '';
  relationshipToInstitution: string[];
  insiderRelationship: 'yes' | 'no' | '';
  insiderStatus: string[];
  dateSuspensionTermination: string;
  // Part III
  activityDateFrom: string;
  activityDateTo: string;
  totalDollarAmount: string;
  summaryCharacterization: string[];
  amountOfLoss: string;
  amountOfRecovery: string;
  materialImpact: 'yes' | 'no' | '';
  bondingNotified: 'yes' | 'no' | '';
  lawEnforcementAdvised: string[];
  contactName1: string;
  contactPhone1: string;
  contactName2: string;
  contactPhone2: string;
  // Part IV
  contactLastName: string;
  contactFirstName: string;
  contactMiddle: string;
  contactTitle: string;
  contactPhone: string;
  datePrepared: string;
  agencyIfNotInstitution: string;
}

function formatDateForForm(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const y = date.getFullYear();
  return `${m} / ${day} / ${y}`;
}

/** Build initial form data with AI/case auto-fill from case detail. */
export function defaultSarFormData(detail: SarCaseDetail): SarFormData {
  const createdAt = detail?.createdAt ? new Date(detail.createdAt) : new Date();
  const typology = detail?.typology ?? '';
  const chars = typologyToCharacterization[typology] ?? [];
  const payload = detail?.alertPayload || {};

  return {
    correctsPriorReport: false,
    nameOfInstitution: 'Barclays',
    ein: '',
    addressOfInstitution: 'Barclays PLC, 1 Churchill Place, London E14 5HP',
    primaryRegulator: 'OCC',
    city: 'London',
    state: '',
    zipCode: '',
    branchAddress: '',
    multipleBranches: false,
    branchCity: '',
    branchState: '',
    branchZipCode: '',
    dateClosed: '',
    accountNumbers: [String(payload.customer_id || ''), '', '', ''],
    accountClosed: [false, false, false, false],
    suspectUnavailable: false,
    suspectLastName: String(payload.customer_name || detail?.customerId || '').split(' ').pop() || '',
    suspectFirstName: String(payload.customer_name || '').split(' ')[0] || '',
    suspectMiddle: '',
    suspectAddress: String(payload.customer_address || ''),
    ssnEinTin: String(payload.customer_ssn || ''),
    suspectCity: String(payload.customer_city || ''),
    suspectState: String(payload.customer_state || ''),
    suspectZipCode: String(payload.customer_zip || ''),
    suspectCountry: String(payload.customer_country || ''),
    phoneResidence: '',
    phoneWork: '',
    occupation: String(payload.customer_occupation || ''),
    dateOfBirth: String(payload.customer_dob || ''),
    admissionConfession: '',
    relationshipToInstitution: ['Customer'],
    insiderRelationship: 'no',
    insiderStatus: [],
    dateSuspensionTermination: '',
    activityDateFrom: formatDateForForm(createdAt),
    activityDateTo: formatDateForForm(createdAt),
    totalDollarAmount: String(payload.txn_amount || payload.total_amount || ''),
    summaryCharacterization: [...chars],
    amountOfLoss: '',
    amountOfRecovery: '',
    materialImpact: 'no',
    bondingNotified: 'no',
    lawEnforcementAdvised: [],
    contactName1: '',
    contactPhone1: '',
    contactName2: '',
    contactPhone2: '',
    contactLastName: '',
    contactFirstName: '',
    contactMiddle: '',
    contactTitle: 'Compliance Analyst',
    contactPhone: '',
    datePrepared: formatDateForForm(new Date()),
    agencyIfNotInstitution: '',
  };
}

/** Map typology to Part III summary characterization checkboxes (a–u keys). */
export const typologyToCharacterization: Record<string, string[]> = {
  'Money Laundering': ['b'],
  'Structuring': ['a'],
  'Terrorist Financing': ['t'],
  'Wire Transfer Fraud': ['r'],
  'Identity Theft': ['u'],
  'Fraud': ['d', 'e', 'f', 'g', 'k', 'l', 'm', 'n', 'p'],
};
export const SUMMARY_CHARACTERIZATION_OPTIONS = [
  { key: 'a', label: 'Bank Secrecy Act/Structuring/' },
  { key: 'b', label: 'Money Laundering' },
  { key: 'c', label: 'Bribery/Gratuity' },
  { key: 'd', label: 'Check Fraud' },
  { key: 'e', label: 'Check Kiting' },
  { key: 'e2', label: 'Commercial Loan Fraud' },
  { key: 'f', label: 'Computer Intrusion' },
  { key: 'g', label: 'Consumer Loan Fraud' },
  { key: 'h', label: 'Counterfeit Check' },
  { key: 'i', label: 'Counterfeit Credit/Debit Card' },
  { key: 'j', label: 'Counterfeit Instrument (other)' },
  { key: 'k', label: 'Credit Card Fraud' },
  { key: 'l', label: 'Debit Card Fraud' },
  { key: 'm', label: 'Defalcation/Embezzlement' },
  { key: 'n', label: 'False Statement' },
  { key: 'o', label: 'Misuse of Position or Self Dealing' },
  { key: 'p', label: 'Mortgage Loan Fraud' },
  { key: 'q', label: 'Mysterious Disappearance' },
  { key: 'r', label: 'Wire Transfer Fraud' },
  { key: 's', label: 'Other' },
  { key: 't', label: 'Terrorist Financing' },
  { key: 'u', label: 'Identity Theft' },
];
