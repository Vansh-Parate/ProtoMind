/**
 * In-memory TTL cache for demo/read data to reduce database load.
 * Invalidated on mutations (e.g. SAR edit/approve).
 */

const TTL_MS = 2 * 60 * 1000; // 2 minutes

interface Entry<T> {
  data: T;
  expiresAt: number;
}

const caseDetailCache = new Map<number, Entry<unknown>>();
const auditCache = new Map<number, Entry<unknown[]>>();

let casesList: Entry<unknown[]> | null = null;

function isExpired<T>(entry: Entry<T>): boolean {
  return Date.now() > entry.expiresAt;
}

export function getCachedCasesList(): unknown[] | null {
  if (!casesList || isExpired(casesList)) return null;
  return casesList.data;
}

export function setCachedCasesList(data: unknown[]): void {
  casesList = { data, expiresAt: Date.now() + TTL_MS };
}

export function getCachedCaseDetail(caseId: number): unknown | null {
  const entry = caseDetailCache.get(caseId);
  if (!entry || isExpired(entry)) return null;
  return entry.data;
}

export function setCachedCaseDetail(caseId: number, data: unknown): void {
  caseDetailCache.set(caseId, { data, expiresAt: Date.now() + TTL_MS });
}

export function getCachedAudit(caseId: number): unknown[] | null {
  const entry = auditCache.get(caseId);
  if (!entry || isExpired(entry)) return null;
  return entry.data;
}

export function setCachedAudit(caseId: number, data: unknown[]): void {
  auditCache.set(caseId, { data, expiresAt: Date.now() + TTL_MS });
}

/** Call after any mutation that changes cases list or case/audit data. */
export function invalidateCase(caseId: number): void {
  caseDetailCache.delete(caseId);
  auditCache.delete(caseId);
}

export function invalidateCasesList(): void {
  casesList = null;
}
