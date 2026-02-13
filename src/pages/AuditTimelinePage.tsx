import React from 'react';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';

interface AuditLog {
  id: number;
  case_id: number;
  action: string;
  actor: string;
  timestamp: string;
  input_snapshot?: unknown;
  output_snapshot?: unknown;
}

export const AuditTimelinePage: React.FC = () => {
  const [events, setEvents] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadLatestCaseAudit() {
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const casesRes = await fetch(`${apiBase}/cases`);
        if (!casesRes.ok) {
          throw new Error(await casesRes.text());
        }
        const cases = (await casesRes.json()) as { id: string }[];
        if (!cases.length) {
          if (!cancelled) {
            setEvents([]);
          }
          return;
        }

        const latestId = cases[0].id;
        const auditRes = await fetch(`${apiBase}/audit/${latestId}`);
        if (!auditRes.ok) {
          throw new Error(await auditRes.text());
        }
        const data = (await auditRes.json()) as AuditLog[];
        if (!cancelled) {
          setEvents(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load audit logs');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLatestCaseAudit();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500 max-w-2xl">
        Track key actions taken on SAR narratives for audit and governance. This view shows the
        real audit trail for the most recently updated case.
      </p>

      <Card>
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-6">
          Audit timeline
        </div>
        <div className="relative pl-6">
          <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200" />

          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}

          {error && !loading && (
            <div className="text-xs text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && !events.length && (
            <div className="text-xs text-slate-500">No audit events recorded yet.</div>
          )}

          {!loading && !error && events.length > 0 && (
            <ul className="space-y-6">
              {events.map((event, index) => (
                <li key={event.id} className="relative flex gap-4">
                  <div className="relative">
                    <div className="h-3 w-3 rounded-full border-2 border-white shadow-card bg-slate-700" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="text-sm font-medium text-slate-800">
                        {event.action.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-slate-500 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-800 text-[10px] font-semibold text-white">
                        {event.actor
                          .split(' ')
                          .map((p) => p[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                      <span>{event.actor}</span>
                      <span className="text-slate-400">•</span>
                      <span className="capitalize">{event.action.toLowerCase()}</span>
                      {index === events.length - 1 && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-700 px-2 py-0.5 text-[11px] font-medium">
                          Latest
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
};

