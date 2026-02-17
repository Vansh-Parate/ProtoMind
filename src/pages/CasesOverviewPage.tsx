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

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 50;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  const [riskFilter, setRiskFilter] = React.useState<'all' | 'high' | 'medium' | 'low'>('all');

  const filteredCases = React.useMemo(() => {
    let result = cases;

    // Tab filter (Status)
    if (activeTab === 'pending') result = result.filter(c => c.status === 'PENDING');
    else if (activeTab === 'approved') result = result.filter(c => c.status === 'APPROVED');
    else if (activeTab === 'rejected') result = result.filter(c => c.status === 'REJECTED');

    // Risk Filter
    if (riskFilter !== 'all') {
      result = result.filter(c => c.risk.toLowerCase() === riskFilter);
    }

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
  }, [cases, activeTab, search, riskFilter]);

  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const paginatedCases = filteredCases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
    console.log();
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
        {/* New Case button removed as requested */}
      </div>

      {/* Tabs & Search & Filter */}
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
        <div className="pb-2 flex items-center gap-4">
          {/* Risk Filter */}
          <div className="relative">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-border-light rounded-lg text-sm text-text-primary focus:border-text-secondary transition-colors outline-none cursor-pointer hover:bg-bg-hover"
            >
              <option value="all">All Risks</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-tertiary">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
          </div>

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
            paginatedCases.map((c) => (
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
          <span>
            Showing {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, filteredCases.length)} of {filteredCases.length} cases
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, i, arr) => (
                  <React.Fragment key={p}>
                    {i > 0 && p - arr[i - 1] > 1 && <span className="text-text-tertiary">...</span>}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${currentPage === p
                        ? 'bg-primary text-white font-medium'
                        : 'hover:bg-muted-neutralBg text-text-secondary hover:text-text-primary'
                        }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
