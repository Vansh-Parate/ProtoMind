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
          <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-blue-100 to-blue-200 flex items-center justify-center">
            <span className="text-blue-600 text-2xl">📋</span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#1e3a5f]">
              Cases Overview
            </h2>
            <p className="text-sm text-slate-500">
              Suspicious Activity Reports
            </p>
          </div>
        </div>
        <Button variant="primary" size="md">
          New Case
        </Button>
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2 text-xs">
            <select className="filter-select px-3 py-2.5 rounded-lg bg-white border-2 border-slate-200 text-sm text-slate-700 min-w-[160px] focus-visible:outline-none focus-visible:border-blue-600 focus-visible:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] hover:border-slate-300">
              <option>Status: All</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
            <select className="filter-select px-3 py-2.5 rounded-lg bg-white border-2 border-slate-200 text-sm text-slate-700 min-w-[160px] focus-visible:outline-none focus-visible:border-blue-600 focus-visible:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] hover:border-slate-300">
              <option>Risk: All</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          <input
            placeholder="Search by customer, ID, or typology"
            className="search-input w-full md:w-[400px] px-4 pl-10 py-3 rounded-xl bg-white border-2 border-slate-200 text-[15px] text-slate-700 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:shadow-[0_0_0_4px_rgba(37,99,235,0.08)] md:focus:w-[500px] transition-all"
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


