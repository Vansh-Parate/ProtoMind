import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RiskBadge } from '../components/ui/RiskBadge';
import { StatusDot } from '../components/ui/StatusDot';
import type { SarCaseSummary } from '../types';
import { fetchCases } from '../api/client';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = React.useState<SarCaseSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchCases();
        if (!cancelled) setCases(data);
      } catch {
        // silently fail on dashboard
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalCases = cases.length;
  const pendingCount = cases.filter((c) => c.status === 'PENDING').length;
  const approvedCount = cases.filter((c) => c.status === 'APPROVED').length;
  const highRiskCount = cases.filter((c) => c.risk === 'HIGH').length;
  const mediumRiskCount = cases.filter((c) => c.risk === 'MEDIUM').length;
  const lowRiskCount = cases.filter((c) => c.risk === 'LOW').length;
  const needsAttentionCount = cases.filter(
    (c) => c.status === 'PENDING' && c.risk === 'HIGH'
  ).length;
  const avgScore =
    totalCases > 0
      ? Math.round(cases.reduce((s, c) => s + c.score, 0) / totalCases)
      : 0;
  const recentCases = cases.slice(0, 5);

  const highPct = totalCases > 0 ? Math.round((highRiskCount / totalCases) * 100) : 0;
  const medPct = totalCases > 0 ? Math.round((mediumRiskCount / totalCases) * 100) : 0;
  const lowPct = totalCases > 0 ? 100 - highPct - medPct : 0;

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const statCards = [
    {
      label: 'Total cases',
      value: totalCases,
      icon: 'solar:folder-with-files-linear',
      textClass: 'text-text-primary',
      iconBg: 'bg-muted-neutralBg',
      iconClass: 'text-muted-neutral',
    },
    {
      label: 'Requires attention',
      value: needsAttentionCount,
      icon: 'solar:bell-bing-linear',
      textClass: 'text-text-primary',
      iconBg: 'bg-muted-dangerBg',
      iconClass: 'text-muted-danger',
    },
    {
      label: 'Pending review',
      value: pendingCount,
      icon: 'solar:clock-circle-linear',
      textClass: 'text-text-primary',
      iconBg: 'bg-muted-warningBg',
      iconClass: 'text-muted-warning',
    },
    {
      label: 'Approved',
      value: approvedCount,
      icon: 'solar:check-circle-linear',
      textClass: 'text-text-primary',
      iconBg: 'bg-muted-successBg',
      iconClass: 'text-muted-success',
    },
  ];

  // Average risk score gauge – hex matches avgScoreGauge in tailwind.config.cjs
  const gaugeColor =
    avgScore >= 70 ? '#FCA5A5' : avgScore >= 40 ? '#FCD34D' : '#6EE7B7';

  return (
    <div className="min-h-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Compliance overview and SAR case metrics
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => navigate('/cases')}>
          <span className="flex items-center gap-2">
            <iconify-icon icon="solar:folder-with-files-linear" width="16" />
            View all cases
          </span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center flex-shrink-0`}
            >
              <iconify-icon icon={stat.icon} width="20" class={stat.iconClass} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider font-medium text-text-tertiary">
                {stat.label}
              </div>
              <div className={`text-xl font-semibold ${stat.textClass} mt-0.5 tabular-nums`}>
                {loading ? '—' : stat.value}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Risk distribution + Avg score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-text-secondary">
              Risk distribution
            </span>
            <span className="text-xs text-text-tertiary">{totalCases} cases</span>
          </div>

          {loading ? (
            <div className="h-28 flex items-center justify-center">
              <span className="text-sm text-text-tertiary">Loading…</span>
            </div>
          ) : (
            <div>
              <div className="flex gap-0.5 h-7 rounded-md overflow-hidden bg-muted-neutralBg mb-5">
                {highPct > 0 && (
                  <div
                    className="bg-riskBar-high border-r border-muted-danger/15 transition-all duration-500 min-w-0"
                    style={{ width: `${highPct}%` }}
                    title={`High: ${highPct}%`}
                  />
                )}
                {medPct > 0 && (
                  <div
                    className="bg-riskBar-medium border-r border-muted-warning/15 transition-all duration-500 min-w-0"
                    style={{ width: `${medPct}%` }}
                    title={`Medium: ${medPct}%`}
                  />
                )}
                {lowPct > 0 && (
                  <div
                    className="bg-riskBar-low transition-all duration-500 min-w-0"
                    style={{ width: `${lowPct}%` }}
                    title={`Low: ${lowPct}%`}
                  />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-riskBar-high" />
                  <span className="text-sm text-text-secondary">
                    High · {highRiskCount} <span className="text-text-tertiary">({highPct}%)</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-riskBar-medium" />
                  <span className="text-sm text-text-secondary">
                    Medium · {mediumRiskCount} <span className="text-text-tertiary">({medPct}%)</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-riskBar-low" />
                  <span className="text-sm text-text-secondary">
                    Low · {lowRiskCount} <span className="text-text-tertiary">({lowPct}%)</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <span className="text-[11px] font-medium uppercase tracking-wider text-text-secondary block mb-5">
            Average risk score
          </span>
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke={gaugeColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(avgScore / 100) * 327} 327`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-semibold text-text-primary tabular-nums">
                  {loading ? '—' : avgScore}
                </span>
              </div>
            </div>
            <span className="text-xs text-text-tertiary mt-2">out of 100</span>
          </div>
        </Card>
      </div>

      {/* Recent cases + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-medium uppercase tracking-wider text-text-secondary">
              Recent cases
            </span>
            <button
              onClick={() => navigate('/cases')}
              className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              View all →
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-lg bg-muted-neutralBg/60 animate-pulse"
                />
              ))}
            </div>
          ) : recentCases.length === 0 ? (
            <div className="py-10 text-center text-sm text-text-tertiary">
              No cases yet
            </div>
          ) : (
            <ul className="space-y-1">
              {recentCases.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => navigate(`/cases/${c.id}`)}
                    className="w-full flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-transparent hover:bg-bg-hover hover:border-border-light transition-colors text-left group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <RiskBadge level={c.risk} variant="light" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate">
                          Case #{c.id} · {c.customerId}
                        </div>
                        <div className="text-xs text-text-tertiary truncate">
                          {c.typology}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StatusDot status={c.status} variant="light" />
                      <span className="text-xs text-text-tertiary hidden sm:inline tabular-nums">
                        {formatDate(c.createdAt)}
                      </span>
                      <iconify-icon
                        icon="solar:arrow-right-linear"
                        width="14"
                        class="text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <span className="text-[11px] font-medium uppercase tracking-wider text-text-secondary block mb-4">
              Quick actions
            </span>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/cases')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border-light hover:bg-bg-hover hover:border-border-focus/50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-muted-neutralBg flex items-center justify-center flex-shrink-0">
                  <iconify-icon
                    icon="solar:folder-with-files-linear"
                    width="18"
                    class="text-muted-neutral"
                  />
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">
                    Browse cases
                  </div>
                  <div className="text-[11px] text-text-tertiary">
                    View and manage SAR cases
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate('/audit')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border-light hover:bg-bg-hover hover:border-border-focus/50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-muted-neutralBg flex items-center justify-center flex-shrink-0">
                  <iconify-icon
                    icon="solar:history-linear"
                    width="18"
                    class="text-muted-neutral"
                  />
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">
                    Audit timeline
                  </div>
                  <div className="text-[11px] text-text-tertiary">
                    Track compliance actions
                  </div>
                </div>
              </button>
            </div>
          </Card>

          <Card>
            <span className="text-[11px] font-medium uppercase tracking-wider text-text-secondary block mb-4">
              Status breakdown
            </span>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-text-secondary">Pending</span>
                  <span className="font-medium text-text-primary tabular-nums">
                    {loading ? '—' : pendingCount}
                  </span>
                </div>
                <div className="h-2 bg-muted-neutralBg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-statusBreakdown-pending rounded-full transition-all duration-500"
                    style={{
                      width:
                        totalCases > 0
                          ? `${(pendingCount / totalCases) * 100}%`
                          : '0%',
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-text-secondary">Approved</span>
                  <span className="font-medium text-text-primary tabular-nums">
                    {loading ? '—' : approvedCount}
                  </span>
                </div>
                <div className="h-2 bg-muted-neutralBg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-statusBreakdown-approved rounded-full transition-all duration-500"
                    style={{
                      width:
                        totalCases > 0
                          ? `${(approvedCount / totalCases) * 100}%`
                          : '0%',
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-text-secondary">Rejected</span>
                  <span className="font-medium text-text-primary tabular-nums">
                    {loading
                      ? '—'
                      : totalCases - pendingCount - approvedCount}
                  </span>
                </div>
                <div className="h-2 bg-muted-neutralBg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-statusBreakdown-rejected rounded-full transition-all duration-500"
                    style={{
                      width:
                        totalCases > 0
                          ? `${((totalCases - pendingCount - approvedCount) / totalCases) * 100}%`
                          : '0%',
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
