import type { SarCaseSummary, SarCaseDetail } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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

export function fetchCases(): Promise<SarCaseSummary[]> {
  return request<SarCaseSummary[]>('/cases');
}

export function fetchCaseDetail(id: string): Promise<SarCaseDetail> {
  return request<SarCaseDetail>(`/cases/${id}`);
}

export function updateSarEdits(params: { caseId: string; editedText: string; actor: string }) {
  const { caseId, editedText, actor } = params;
  return request(`/sar/${caseId}`, {
    method: 'PUT',
    body: JSON.stringify({
      edited_text: editedText,
      actor
    })
  });
}

export function approveSar(params: { caseId: string; actor: string }) {
  const { caseId, actor } = params;
  return request(`/sar/approve/${caseId}`, {
    method: 'POST',
    body: JSON.stringify({ actor })
  });
}

