import React from 'react';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { fetchAllAudits, type AuditLog } from '../api/client';

export const AuditTimelinePage: React.FC = () => {
  const [events, setEvents] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadAudits() {
      try {
        const data = await fetchAllAudits();
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

    void loadAudits();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-14">
        <h1 className="text-3xl font-semibold text-text-primary tracking-tight">
          Audit Timeline
        </h1>
        <p className="text-sm text-text-secondary mt-2 font-normal max-w-2xl">
          Track key actions taken on SAR narratives for audit and governance. This view shows the
          real audit trail across all cases.
        </p>
      </div>

      <Card>
        <div className="text-[11px] font-medium uppercase tracking-wider text-text-secondary mb-6">
          Audit timeline
        </div>
        <div className="relative pl-6">
          <div className="absolute left-2 top-0 bottom-0 w-px bg-border-light" />

          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}

          {error && !loading && (
            <div className="text-xs text-muted-danger">
              {error}
            </div>
          )}

          {!loading && !error && !events.length && (
            <div className="text-xs text-text-secondary">No audit events recorded yet.</div>
          )}

          {!loading && !error && events.length > 0 && (
            <ul className="space-y-6">
              {events.map((event, index) => (
                <li key={event.id} className="relative flex gap-4">
                  <div className="relative">
                    <div className="h-3 w-3 rounded-full border-2 border-white shadow-card bg-text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="text-sm font-medium text-text-primary">
                        {event.action.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-text-tertiary">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-text-secondary flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-text-primary text-[10px] font-semibold text-white">
                        {event.actor
                          .split(' ')
                          .map((p) => p[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                      <span>{event.actor}</span>
                      <span className="text-text-tertiary">•</span>
                      <span className="font-medium text-text-primary">Case #{event.case_id}</span>
                      <span className="text-text-tertiary">•</span>
                      <span className="capitalize">{event.action.toLowerCase()}</span>
                      {index === 0 && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-muted-successBg text-muted-success px-2 py-0.5 text-[11px] font-medium">
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
