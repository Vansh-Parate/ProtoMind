import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { RiskBadge } from '../components/ui/RiskBadge';
import { StatusDot } from '../components/ui/StatusDot';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import type { SarCaseSummary } from '../types';
import { fetchCases } from '../api/client';

type TabFilter = 'all' | 'pending' | 'approved' | 'rejected';

export const CasesOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = React.useState<SarCaseSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabFilter>('all');
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchCases();
        if (!cancelled) {
          setCases(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load cases');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCases = React.useMemo(() => {
    let result = cases;

    // Tab filter
    if (activeTab === 'pending') result = result.filter(c => c.status === 'PENDING');
    else if (activeTab === 'approved') result = result.filter(c => c.status === 'APPROVED');
    else if (activeTab === 'rejected') result = result.filter(c => c.status === 'REJECTED');

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        c =>
          c.id.toLowerCase().includes(q) ||
          c.customerId.toLowerCase().includes(q) ||
          c.typology.toLowerCase().includes(q)
      );
    }

    return result;
  }, [cases, activeTab, search]);

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all', label: 'All Cases' },
    { key: 'pending', label: 'Pending Review' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Archived' },
  ];

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs} hrs ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-14">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary tracking-tight">
            Cases Overview
          </h1>
          <p className="text-sm text-text-secondary mt-2 font-normal">
            Suspicious Activity Reports management
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          }
        >
          New Case
        </Button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 border-b border-border-light pb-0">
        <div className="flex gap-8">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-4 text-sm font-medium transition-all border-b-2 ${activeTab === tab.key
                  ? 'text-text-primary border-text-primary'
                  : 'text-text-secondary hover:text-text-primary border-transparent hover:border-border-focus'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="pb-2">
          <div className="relative group">
            <iconify-icon
              icon="solar:magnifer-linear"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-text-secondary transition-colors"
              width="16"
            />
            <input
              type="text"
              placeholder="Search ID or Customer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-border-light rounded-lg text-sm text-text-primary placeholder-text-tertiary w-64 focus:border-text-secondary transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <Table>
        <THead>
          <tr>
            <TH>Risk Level</TH>
            <TH>Case ID</TH>
            <TH>Customer</TH>
            <TH>Typology</TH>
            <TH>Status</TH>
            <TH>Created</TH>
            <TH align="right">Score</TH>
          </tr>
        </THead>
        <TBody>
          {loading && (
            <TR>
              <TD colSpan={7} className="text-text-secondary">Loading cases…</TD>
            </TR>
          )}
          {error && !loading && (
            <TR>
              <TD colSpan={7} className="text-muted-danger text-sm">
                {error}
              </TD>
            </TR>
          )}
          {!loading && !error && filteredCases.length === 0 && (
            <TR>
              <TD colSpan={7} className="text-text-secondary text-sm">
                No cases found.
              </TD>
            </TR>
          )}
          {!loading &&
            !error &&
            filteredCases.map((c) => (
              <TR
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}`)}
              >
                <TD>
                  <RiskBadge level={c.risk} variant="cases" />
                </TD>
                <TD>
                  <span className="font-medium">{c.id}</span>
                </TD>
                <TD>{c.customerId}</TD>
                <TD className="text-text-secondary">{c.typology}</TD>
                <TD>
                  <StatusDot status={c.status} />
                </TD>
                <TD className="text-text-secondary">{formatDate(c.createdAt)}</TD>
                <TD align="right">
                  <span className="font-medium">{c.score}</span>
                </TD>
              </TR>
            ))}
        </TBody>
      </Table>

      {/* Pagination */}
      {!loading && !error && filteredCases.length > 0 && (
        <div className="mt-8 flex items-center justify-between text-sm text-text-secondary">
          <span>Showing 1-{filteredCases.length} of {cases.length} cases</span>
          <div className="flex items-center gap-4">
            <button className="hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              Previous
            </button>
            <button className="hover:text-text-primary">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};
