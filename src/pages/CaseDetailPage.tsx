import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { RiskBadge } from '../components/ui/RiskBadge';
import { StatusDot } from '../components/ui/StatusDot';
import type { SarCaseDetail } from '../types';
import { fetchCaseDetail } from '../api/client';

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = React.useState<SarCaseDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchCaseDetail(id);
        if (!cancelled) {
          setDetail(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load case');
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
  }, [id]);

  if (loading) {
    return <div className="text-sm text-slate-500">Loading case…</div>;
  }

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          ← Back to Cases
        </Button>
        <Card>
          <p className="text-sm text-slate-500">{error ?? 'Case not found.'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
        ← Back to Cases
      </Button>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight text-[#1e3a5f]">
              Case #{detail.id} • {detail.customerId}
            </h2>
            <RiskBadge level={detail.risk} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {detail.typology} • Created:{' '}
            {new Date(detail.createdAt).toLocaleString()} •{' '}
            <StatusDot status={detail.status} />
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="success" size="md" onClick={() => navigate(`/editor/${detail.id}`)}>
            Approve
          </Button>
          <Button variant="danger" size="md">
            Reject
          </Button>
          <Button variant="secondary" size="md" onClick={() => navigate(`/editor/${detail.id}`)}>
            Open SAR Editor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-3">
            Customer Profile
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Customer ID</dt>
              <dd className="font-medium text-slate-800">{detail.customerId}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Typology</dt>
              <dd className="font-medium text-slate-800">{detail.typology}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Score</dt>
              <dd className="font-medium text-slate-800">{detail.score}</dd>
            </div>
          </dl>
        </Card>

        <Card className="md:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-2">
            Why this report was generated
          </div>
          <div className="text-xs text-slate-500 mb-3">
            Confidence: 89% • Typology: {detail.typology}
          </div>
          <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
            {detail.whyGenerated.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-3">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Transaction Timeline
          </div>
          <span className="text-xs text-slate-400">Sample visualization placeholder</span>
        </div>
        <div className="h-40 rounded-md bg-slate-100 flex items-center justify-center text-sm text-slate-500">
          Transaction timeline visualization would appear here.
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Generated SAR narrative
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate(`/editor/${detail.id}`)}>
            Open in editor
          </Button>
        </div>
        <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
          {detail.narrativeGenerated}
        </p>
      </Card>
    </div>
  );
};

