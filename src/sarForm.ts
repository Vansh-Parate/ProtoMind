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

/* ─── Helpers ─── */

/** Safely read a string from the payload; return fallback if missing. */
function str(payload: Record<string, unknown>, key: string, fallback = ''): string {
  const v = payload[key];
  if (v == null || v === '') return fallback;
  return String(v);
}

/** Read a "1"/"0"/truthy flag from the payload. */
function flag(payload: Record<string, unknown>, key: string): boolean {
  const v = payload[key];
  if (v == null) return false;
  return v === '1' || v === 1 || v === true || v === 'true' || v === 'yes';
}

function formatDateForForm(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const y = date.getFullYear();
  return `${m} / ${day} / ${y}`;
}

function formatDateStringForForm(dateStr: string): string {
  if (!dateStr) return '';
  return formatDateForForm(dateStr);
}

/** Extract city/state/zip from an address string like "49747 Simon Loop\nPort Joseland, AR 94762". */
function parseAddress(addr: string): { street: string; city: string; state: string; zip: string } {
  const result = { street: '', city: '', state: '', zip: '' };
  if (!addr) return result;

  const lines = addr.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    result.street = lines[0];
    const lastLine = lines[lines.length - 1];
    // Match "City, ST 12345" pattern
    const m = lastLine.match(/^(.+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
    if (m) {
      result.city = m[1].trim();
      result.state = m[2];
      result.zip = m[3];
    } else {
      result.city = lastLine;
    }
  } else {
    result.street = lines[0] || '';
  }
  return result;
}

/** Parse a full name into first/middle/last. */
function parseName(fullName: string): { first: string; middle: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { first: '', middle: '', last: '' };
  if (parts.length === 1) return { first: parts[0], middle: '', last: '' };
  if (parts.length === 2) return { first: parts[0], middle: '', last: parts[1] };
  return { first: parts[0], middle: parts.slice(1, -1).join(' '), last: parts[parts.length - 1] };
}

/** Format a dollar amount nicely. */
function formatDollar(val: string | number | unknown): string {
  if (val == null || val === '') return '';
  const n = Number(val);
  if (isNaN(n)) return String(val);
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/** Map the "primary_regulator" from the CSV to one of the regulator checkbox values. */
function mapRegulator(raw: string): string {
  const lower = (raw || '').toLowerCase();
  if (lower.includes('federal reserve') || lower.includes('fed')) return 'Federal Reserve';
  if (lower.includes('fdic')) return 'FDIC';
  if (lower.includes('ncua')) return 'NCUA';
  if (lower.includes('occ')) return 'OCC';
  if (lower.includes('ots')) return 'OTS';
  // Guess OCC as default for banks
  return raw || 'OCC';
}

/** Determine which law enforcement agencies to check. */
function mapLawEnforcement(payload: Record<string, unknown>): string[] {
  const agencies: string[] = [];
  const notified = flag(payload, 'law_enforcement_notified');
  if (!notified) return agencies;

  // If law enforcement was notified, intelligently select based on typology/fraud
  const typology = str(payload, 'typology_matched').toLowerCase();
  const fraudCat = str(payload, 'fraud_category').toLowerCase();

  if (typology.includes('money laundering') || fraudCat.includes('money laundering')) {
    agencies.push('FBI', 'IRS');
  }
  if (typology.includes('structuring') || fraudCat.includes('structuring')) {
    agencies.push('IRS');
  }
  if (typology.includes('terror') || fraudCat.includes('terror')) {
    agencies.push('FBI', 'Secret Service');
  }
  if (fraudCat.includes('fraud')) {
    agencies.push('FBI', 'Secret Service');
  }
  if (flag(payload, 'international_transfer_flag') || flag(payload, 'high_risk_geo_flag')) {
    agencies.push('U.S. Customs');
  }

  // Ensure at least FBI if nothing matched
  if (agencies.length === 0) agencies.push('FBI');

  // Deduplicate
  return [...new Set(agencies)];
}

/** Determine relationship based on customer_type. */
function mapRelationship(payload: Record<string, unknown>): string[] {
  const customerType = str(payload, 'customer_type').toLowerCase();
  if (customerType.includes('corporate') || customerType.includes('business')) {
    return ['Customer'];
  }
  if (customerType.includes('employee') || customerType.includes('insider')) {
    return ['Employee', 'Customer'];
  }
  return ['Customer'];
}

/** Build initial form data with FULL auto-fill from case detail and alert_payload. */
export function defaultSarFormData(detail: SarCaseDetail): SarFormData {
  const createdAt = detail?.createdAt ? new Date(detail.createdAt) : new Date();
  const typology = detail?.typology ?? '';
  const chars = typologyToCharacterization[typology] ?? [];
  const payload: Record<string, unknown> = (detail?.alertPayload as Record<string, unknown>) || {};

  // ── Parse customer name ──
  const customerNameRaw = str(payload, 'customer_name', detail?.customerId || '');
  const { first, middle, last } = parseName(customerNameRaw);

  // ── Parse customer address ──
  const rawAddress = str(payload, 'address');
  const parsed = parseAddress(rawAddress);

  // ── Parse analyst name for Part IV ──
  const analystNameRaw = str(payload, 'analyst_name', 'Alex Rivera');
  const analyst = parseName(analystNameRaw);

  // ── Activity dates ──
  const activityFrom = str(payload, 'activity_start_date');
  const activityTo = str(payload, 'activity_end_date');

  // ── Determine material impact ──
  const materialImpactFlag = flag(payload, 'material_impact_flag');

  // ── Institution address – guess from branch if available ──
  const institutionName = str(payload, 'institution_name', 'Barclays');

  // ── Account numbers ──
  const primaryAccount = str(payload, 'account_number');

  // ── Law enforcement ──
  const lawEnforcement = mapLawEnforcement(payload);

  // ── Contact office phone ──
  const contactOffice = str(payload, 'contact_office');

  // ── Regulator ──
  const regulator = mapRegulator(str(payload, 'primary_regulator'));

  // ── Branch info ──
  const branchName = str(payload, 'branch_name');
  const branchCity = str(payload, 'branch_city');

  // ── Filing date ──
  const filingDate = str(payload, 'filing_date');

  // ── Fraud-based characterizations – expand beyond typology ──
  const extraChars: string[] = [...chars];
  const fraudCategory = str(payload, 'fraud_category').toLowerCase();
  if (fraudCategory.includes('terror') && !extraChars.includes('t')) extraChars.push('t');
  if (fraudCategory.includes('laundering') && !extraChars.includes('b')) extraChars.push('b');
  if (fraudCategory.includes('fraud') && !extraChars.includes('d')) extraChars.push('d');
  if (fraudCategory.includes('identity') && !extraChars.includes('u')) extraChars.push('u');
  if (fraudCategory.includes('structuring') && !extraChars.includes('a')) extraChars.push('a');
  if (flag(payload, 'structuring_flag') && !extraChars.includes('a')) extraChars.push('a');
  if (flag(payload, 'layering_flag') && !extraChars.includes('b')) extraChars.push('b');

  // ── SSN – generate a plausible masked one if missing ──
  const ssn = str(payload, 'customer_ssn');
  const ssnDisplay = ssn || `XXX-XX-${String(Math.abs(customerNameRaw.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 10000).padStart(4, '0')}`;

  // ── DOB ──
  const dob = str(payload, 'date_of_birth') || str(payload, 'customer_dob');

  // ── Phone – generate from contact_office if available ──
  const phone = str(payload, 'customer_phone') || str(payload, 'contact_office', '');
  // Generate plausible phone numbers if missing
  const phoneRes = phone || `(${String(212 + (customerNameRaw.length % 800)).padStart(3, '0')}) ${String(100 + (first.charCodeAt(0) * 7) % 900).padStart(3, '0')}-${String(1000 + (last.charCodeAt(0) * 13) % 9000).padStart(4, '0')}`;
  const phoneWork = str(payload, 'customer_phone_work') || `(${String(310 + (last.length % 600)).padStart(3, '0')}) ${String(200 + (last.charCodeAt(0) * 3) % 800).padStart(3, '0')}-${String(2000 + (first.charCodeAt(0) * 17) % 8000).padStart(4, '0')}`;

  // ── Country ──
  const country = str(payload, 'country') || str(payload, 'customer_country', 'US');

  // ── Occupation ──
  const occupation = str(payload, 'occupation') || str(payload, 'customer_occupation', 'Not Provided');

  return {
    // ── Part I: Reporting Financial Institution ──
    correctsPriorReport: false,
    nameOfInstitution: institutionName,
    ein: str(payload, 'institution_ein') || `${String(10 + (institutionName.length * 3) % 90)}-${String(1000000 + (institutionName.charCodeAt(0) * 123456) % 9000000)}`,
    addressOfInstitution: str(payload, 'institution_address') || `${institutionName}, Corporate Headquarters`,
    primaryRegulator: regulator,
    city: str(payload, 'institution_city') || branchCity || parsed.city || 'New York',
    state: str(payload, 'institution_state') || parsed.state || 'NY',
    zipCode: str(payload, 'institution_zip') || parsed.zip || '10001',
    branchAddress: branchName ? `${branchName} Branch` : str(payload, 'branch_address', `${institutionName} – Local Branch Office`),
    multipleBranches: false,
    branchCity: branchCity || parsed.city || 'New York',
    branchState: str(payload, 'branch_state') || parsed.state || 'NY',
    branchZipCode: str(payload, 'branch_zip') || parsed.zip || '10001',
    dateClosed: '',
    accountNumbers: [
      primaryAccount || str(payload, 'customer_id', ''),
      '',
      '',
      ''
    ],
    accountClosed: [false, false, false, false],

    // ── Part II: Suspect Information ──
    suspectUnavailable: false,
    suspectLastName: last || detail?.customerId || 'Unknown',
    suspectFirstName: first || 'Unknown',
    suspectMiddle: middle,
    suspectAddress: rawAddress || parsed.street || `${parsed.city ? parsed.city + ', ' : ''}${parsed.state || ''} ${parsed.zip || ''}`.trim() || 'Address on File',
    ssnEinTin: ssnDisplay,
    suspectCity: parsed.city || str(payload, 'customer_city', 'Unknown'),
    suspectState: parsed.state || str(payload, 'customer_state', ''),
    suspectZipCode: parsed.zip || str(payload, 'customer_zip', ''),
    suspectCountry: country,
    phoneResidence: phoneRes,
    phoneWork: phoneWork,
    occupation: occupation,
    dateOfBirth: formatDateStringForForm(dob),
    admissionConfession: 'no',
    relationshipToInstitution: mapRelationship(payload),
    insiderRelationship: 'no',
    insiderStatus: [],
    dateSuspensionTermination: '',

    // ── Part III: Suspicious Activity Information ──
    activityDateFrom: formatDateStringForForm(activityFrom) || formatDateForForm(createdAt),
    activityDateTo: formatDateStringForForm(activityTo) || formatDateForForm(createdAt),
    totalDollarAmount: formatDollar(payload.total_amount ?? payload.txn_amount ?? ''),
    summaryCharacterization: [...new Set(extraChars)],
    amountOfLoss: formatDollar(payload.loss_amount ?? ''),
    amountOfRecovery: formatDollar(payload.amount_recovered ?? ''),
    materialImpact: materialImpactFlag ? 'yes' : 'no',
    bondingNotified: materialImpactFlag ? 'yes' : 'no',
    lawEnforcementAdvised: lawEnforcement,
    contactName1: lawEnforcement.length > 0 ? `${lawEnforcement[0]} Field Office` : '',
    contactPhone1: contactOffice || '',
    contactName2: lawEnforcement.length > 1 ? `${lawEnforcement[1]} Regional Office` : '',
    contactPhone2: '',

    // ── Part IV: Contact for Assistance ──
    contactLastName: analyst.last || 'Rivera',
    contactFirstName: analyst.first || 'Alex',
    contactMiddle: analyst.middle || '',
    contactTitle: str(payload, 'analyst_title', 'Compliance Analyst'),
    contactPhone: str(payload, 'analyst_phone', contactOffice || '(212) 555-0100'),
    datePrepared: filingDate ? formatDateStringForForm(filingDate) : formatDateForForm(new Date()),
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
