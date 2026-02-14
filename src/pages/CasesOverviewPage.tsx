import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { RiskBadge } from '../components/ui/RiskBadge';
import { StatusDot } from '../components/ui/StatusDot';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import type { SarCaseSummary } from '../types';
import { fetchCases } from '../api/client';

export const CasesOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = React.useState<SarCaseSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[#1e3a5f]">
              Cases Overview
            </h2>
            <p className="text-sm text-slate-500">
              Suspicious Activity Reports
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          size="lg"
          icon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          }
        >
          New Case
        </Button>
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <select
              className="filter-select h-10 min-w-[160px] rounded-button border border-slate-200 bg-white px-3 text-sm text-slate-700"
              aria-label="Filter by status"
            >
              <option>Status: All</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
            <select
              className="filter-select h-10 min-w-[160px] rounded-button border border-slate-200 bg-white px-3 text-sm text-slate-700"
              aria-label="Filter by risk"
            >
              <option>Risk: All</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          <input
            type="search"
            placeholder="Search by customer, ID, or typology"
            aria-label="Search cases"
            className="h-10 w-full md:w-[400px] rounded-button border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 placeholder:text-slate-400 transition-[width,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--button-primary-bg)] focus-visible:ring-offset-2 md:focus:w-[500px]"
          />
        </div>

        <Table>
          <THead>
            <tr>
              <TH>Risk</TH>
              <TH>Customer ID</TH>
              <TH>Typology</TH>
              <TH>Status</TH>
              <TH>Created</TH>
              <TH align="right">Score</TH>
            </tr>
          </THead>
          <TBody>
            {loading && (
              <TR>
                <TD colSpan={6}>Loading cases…</TD>
              </TR>
            )}
            {error && !loading && (
              <TR>
                <TD colSpan={6} className="text-red-600 text-sm">
                  {error}
                </TD>
              </TR>
            )}
            {!loading &&
              !error &&
              cases.map((c) => (
              <TR
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}`)}
                className="min-h-[64px]"
              >
                <TD>
                  <RiskBadge level={c.risk} />
                </TD>
                <TD>{c.customerId}</TD>
                <TD>{c.typology}</TD>
                <TD>
                  <StatusDot status={c.status} />
                </TD>
                <TD>{new Date(c.createdAt).toLocaleString()}</TD>
                <TD align="right">
                  <span className="score text-2xl font-bold text-[#1e3a5f] numeric">
                    {c.score}
                  </span>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
};


