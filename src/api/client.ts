import type { SarCaseSummary, SarCaseDetail } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/** TTL for demo data cache (2 minutes). */
const CACHE_TTL_MS = 2 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export interface AuditLog {
  id: number;
  case_id: number;
  action: string;
  actor: string;
  timestamp: string;
  input_snapshot?: unknown;
  output_snapshot?: unknown;
}

let casesListCache: CacheEntry<SarCaseSummary[]> | null = null;
const caseDetailCache = new Map<string, CacheEntry<SarCaseDetail>>();
const auditCache = new Map<string, CacheEntry<AuditLog[]>>();

function getCachedCasesList(): SarCaseSummary[] | null {
  if (!casesListCache || Date.now() > casesListCache.expiresAt) return null;
  return casesListCache.data;
}

function setCachedCasesList(data: SarCaseSummary[]): void {
  casesListCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }

  return (await res.json()) as T;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function fetchCases(): Promise<SarCaseSummary[]> {
  const cached = getCachedCasesList();
  if (cached) return Promise.resolve(cached);
  return request<SarCaseSummary[]>('/cases').then((data) => {
    setCachedCasesList(data);
    return data;
  });
}

export function fetchCasesPaginated(page: number, limit = 50): Promise<PaginatedResult<SarCaseSummary>> {
  return request<PaginatedResult<SarCaseSummary>>(`/cases?page=${page}&limit=${limit}`);
}

/** Ensure API response has safe shape for rendering (avoid white screen from undefined). */
function normalizeCaseDetail(data: unknown): SarCaseDetail {
  const d = data as Record<string, unknown>;
  return {
    id: d?.id != null ? String(d.id) : '',
    customerId: typeof d?.customerId === 'string' ? d.customerId : '',
    typology: typeof d?.typology === 'string' ? d.typology : '',
    risk: d?.risk === 'HIGH' || d?.risk === 'MEDIUM' || d?.risk === 'LOW' ? d.risk : 'LOW',
    status: d?.status === 'PENDING' || d?.status === 'APPROVED' || d?.status === 'REJECTED' ? d.status : 'PENDING',
    createdAt: typeof d?.createdAt === 'string' ? d.createdAt : new Date().toISOString(),
    score: typeof d?.score === 'number' ? d.score : 0,
    whyGenerated: Array.isArray(d?.whyGenerated) ? d.whyGenerated.map((x: unknown) => String(x ?? '')) : [],
    narrativeGenerated: typeof d?.narrativeGenerated === 'string' ? d.narrativeGenerated : '',
    narrativeEdited: typeof d?.narrativeEdited === 'string' ? d.narrativeEdited : '',
    confidenceScore: typeof d?.confidenceScore === 'number' ? d.confidenceScore : undefined,
    alertPayload: (d?.alertPayload != null && typeof d.alertPayload === 'object') ? d.alertPayload as Record<string, unknown> : undefined,
  };
}

export function fetchCaseDetail(id: string, skipCache = false): Promise<SarCaseDetail> {
  if (!skipCache) {
    const entry = caseDetailCache.get(id);
    if (entry && Date.now() <= entry.expiresAt) return Promise.resolve(entry.data as SarCaseDetail);
  }
  return request<SarCaseDetail>(`/cases/${id}`).then((data) => {
    const normalized = normalizeCaseDetail(data);
    caseDetailCache.set(id, { data: normalized, expiresAt: Date.now() + CACHE_TTL_MS });
    return normalized;
  });
}

/** Invalidate cached data after mutations so next read is fresh. */
export function invalidateCasesCache(): void {
  casesListCache = null;
}

export function invalidateCaseDetailCache(caseId: string): void {
  caseDetailCache.delete(caseId);
  auditCache.delete(caseId);
}

export function fetchAudit(caseId: string): Promise<AuditLog[]> {
  const entry = auditCache.get(caseId);
  if (entry && Date.now() <= entry.expiresAt) return Promise.resolve(entry.data);
  return request<AuditLog[]>(`/audit/${caseId}`).then((data) => {
    auditCache.set(caseId, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  });
}

export function updateSarEdits(params: { caseId: string; editedText: string; actor: string }) {
  const { caseId, editedText, actor } = params;
  return request(`/sar/${caseId}`, {
    method: 'PUT',
    body: JSON.stringify({
      edited_text: editedText,
      actor
    })
  }).then((result) => {
    invalidateCaseDetailCache(caseId);
    invalidateCasesCache();
    return result;
  });
}

export function approveSar(params: { caseId: string; actor: string }) {
  const { caseId, actor } = params;
  return request(`/sar/approve/${caseId}`, {
    method: 'POST',
    body: JSON.stringify({ actor })
  }).then((result) => {
    invalidateCaseDetailCache(caseId);
    invalidateCasesCache();
    return result;
  });
}

export function rejectSar(params: { caseId: string; actor: string; reason?: string }) {
  const { caseId, actor, reason } = params;
  return request(`/sar/reject/${caseId}`, {
    method: 'POST',
    body: JSON.stringify({ actor, reason })
  }).then((result) => {
    invalidateCaseDetailCache(caseId);
    invalidateCasesCache();
    return result;
  });
}

