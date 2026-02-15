import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { RiskBadge } from '../components/ui/RiskBadge';
import { StatusDot } from '../components/ui/StatusDot';
import { SarFormReport } from '../components/SarFormReport';
import { defaultSarFormData } from '../sarForm';
import { PdfPreviewModal } from '../components/PdfPreviewModal';
import type { SarCaseDetail, RiskLevel } from '../types';
import { fetchCaseDetail, approveSar, rejectSar } from '../api/client';
import { unpackEdits } from './SarEditorPage';

function getRiskAccentColor(level: RiskLevel) {
  switch (level) {
    case 'HIGH': return { bg: 'bg-muted-dangerBg', border: 'border-muted-danger/30', text: 'text-muted-danger', accent: '#B91C1C' };
    case 'MEDIUM': return { bg: 'bg-riskMediumYellow-bg', border: 'border-riskMediumYellow-text/40', text: 'text-riskMediumYellow-text', accent: '#B45309' };
    case 'LOW': return { bg: 'bg-muted-successBg', border: 'border-muted-success/30', text: 'text-muted-success', accent: '#047857' };
    default: return { bg: 'bg-bg-main', border: 'border-border-light', text: 'text-text-secondary', accent: '#64748B' };
  }
}

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const pdfRef = React.useRef<HTMLDivElement>(null);
  const [detail, setDetail] = React.useState<SarCaseDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<'approve' | 'reject' | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const refetchDetail = React.useCallback(async () => {
    if (!id) return;
    const data = await fetchCaseDetail(id, true);
    setDetail(data);
  }, [id]);

  const handleApprove = React.useCallback(async () => {
    if (!id) return;
    setActionLoading('approve');
    setActionError(null);
    try {
      await approveSar({ caseId: id, actor: 'demo-analyst' });
      await refetchDetail();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  }, [id, refetchDetail]);

  const handleReject = React.useCallback(async () => {
    if (!id) return;
    if (!window.confirm('Reject this case? The case status will be set to Rejected.')) return;
    setActionLoading('reject');
    setActionError(null);
    try {
      await rejectSar({ caseId: id, actor: 'demo-analyst' });
      await refetchDetail();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  }, [id, refetchDetail]);

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchCaseDetail(id, true);
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
    return (
      <div className="space-y-6">
        <div className="h-4 w-32 bg-border-light rounded animate-pulse" />
        <div className="h-8 w-64 bg-border-light rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-border-light rounded-card animate-pulse" />
          <div className="h-40 bg-border-light rounded-card animate-pulse col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <iconify-icon icon="solar:arrow-left-linear" width="16" />
          Back to Cases
        </button>
        <Card>
          <div className="flex flex-col items-center py-8 text-center">
            <iconify-icon icon="solar:folder-error-linear" width="48" class="text-text-tertiary mb-3" />
            <p className="text-sm text-text-secondary">{error ?? 'Case not found.'}</p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/')} className="mt-4">
              Return to Cases
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const riskColors = getRiskAccentColor(detail.risk);

  return (
    <div>
      {/* Back navigation */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-8"
      >
        <iconify-icon icon="solar:arrow-left-linear" width="16" />
        Back to Cases
      </button>

      {/* Page Header */}
      <div className="mb-10">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
                Case #{detail.id}
              </h1>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${riskColors.bg} ${riskColors.border} ${riskColors.text} border`}>
                <div className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: riskColors.accent }} />
                {detail.risk === 'HIGH' ? 'High Risk' : detail.risk === 'MEDIUM' ? 'Medium Risk' : 'Low Risk'}
              </div>
            </div>
            <p className="text-sm text-text-secondary mt-1 font-normal">
              Suspicious Activity Reports management
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <iconify-icon icon="solar:user-linear" width="14" class="text-text-tertiary" />
                {detail.customerId}
              </span>
              <span className="text-text-tertiary">•</span>
              <span className="flex items-center gap-1.5">
                <iconify-icon icon="solar:tag-linear" width="14" class="text-text-tertiary" />
                {detail.typology}
              </span>
              <span className="text-text-tertiary">•</span>
              <span className="flex items-center gap-1.5">
                <iconify-icon icon="solar:calendar-linear" width="14" class="text-text-tertiary" />
                {new Date(detail.createdAt).toLocaleString()}
              </span>
              <span className="text-text-tertiary">•</span>
              <StatusDot status={detail.status} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Button
              variant="success"
              size="md"
              onClick={handleApprove}
              disabled={detail.status === 'APPROVED' || actionLoading !== null}
              loading={actionLoading === 'approve'}
            >
              <span className="flex items-center gap-1.5">
                <iconify-icon icon="solar:check-circle-linear" width="16" />
                Approve
              </span>
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleReject}
              disabled={detail.status === 'REJECTED' || actionLoading !== null}
              loading={actionLoading === 'reject'}
            >
              <span className="flex items-center gap-1.5">
                <iconify-icon icon="solar:close-circle-linear" width="16" />
                Reject
              </span>
            </Button>
            <Button variant="secondary" size="md" onClick={() => navigate(`/editor/${detail.id}`)}>
              <span className="flex items-center gap-1.5">
                <iconify-icon icon="solar:pen-new-square-linear" width="16" />
                Open SAR Editor
              </span>
            </Button>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Score + Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-border-light rounded-card p-5">
          <div className="text-[11px] uppercase tracking-wider font-medium text-text-tertiary mb-1">Risk Score</div>
          <div className="text-2xl font-semibold text-text-primary">{detail.score}</div>
        </div>
        <div className="bg-white border border-border-light rounded-card p-5">
          <div className="text-[11px] uppercase tracking-wider font-medium text-text-tertiary mb-1">Risk Level</div>
          <div className="flex items-center gap-2 mt-0.5">
            <RiskBadge level={detail.risk} />
          </div>
        </div>
        <div className="bg-white border border-border-light rounded-card p-5">
          <div className="text-[11px] uppercase tracking-wider font-medium text-text-tertiary mb-1">Status</div>
          <div className="mt-0.5">
            <StatusDot status={detail.status} />
          </div>
        </div>
        <div className="bg-white border border-border-light rounded-card p-5">
          <div className="text-[11px] uppercase tracking-wider font-medium text-text-tertiary mb-1">Confidence</div>
          <div className="text-2xl font-semibold text-text-primary">
            {detail.confidenceScore != null
              ? `${Math.round(detail.confidenceScore * 100)}%`
              : '—'}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Customer Profile */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <iconify-icon icon="solar:user-id-linear" width="18" class="text-text-tertiary" />
            <div className="text-[11px] font-medium uppercase tracking-wider text-text-secondary">
              Customer Profile
            </div>
          </div>
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-border-light">
              <dt className="text-text-secondary">Customer ID</dt>
              <dd className="font-medium text-text-primary">{detail.customerId}</dd>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-light">
              <dt className="text-text-secondary">Typology</dt>
              <dd className="font-medium text-text-primary">{detail.typology}</dd>
            </div>
            <div className="flex justify-between items-center py-2">
              <dt className="text-text-secondary">Risk Score</dt>
              <dd className="font-medium text-text-primary">{detail.score}</dd>
            </div>
          </dl>
        </Card>

        {/* Why Generated */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <iconify-icon icon="solar:lightbulb-bolt-linear" width="18" class="text-text-tertiary" />
            <div className="text-[11px] font-medium uppercase tracking-wider text-text-secondary">
              Why this report was generated
            </div>
          </div>
          <div className="text-xs text-text-tertiary mb-4">
            {detail.confidenceScore != null
              ? `Confidence: ${Math.round(detail.confidenceScore * 100)}% • `
              : ''}
            Typology: {detail.typology}
          </div>
          <ul className="space-y-2.5">
            {(Array.isArray(detail.whyGenerated) ? detail.whyGenerated : []).map((item, i) => (
              <li key={item} className="flex items-start gap-3 text-sm text-text-primary">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-bg-main flex items-center justify-center text-[10px] font-medium text-text-tertiary mt-0.5">
                  {i + 1}
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Transaction Timeline */}
      <Card className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <iconify-icon icon="solar:chart-2-linear" width="18" class="text-text-tertiary" />
            <div className="text-[11px] font-medium uppercase tracking-wider text-text-secondary">
              Transaction Timeline
            </div>
          </div>
          <span className="text-xs text-text-tertiary">Visualization placeholder</span>
        </div>
        <div className="h-44 rounded-lg bg-bg-main border border-border-light flex items-center justify-center">
          <div className="text-center">
            <iconify-icon icon="solar:chart-square-linear" width="32" class="text-text-tertiary mb-2" />
            <p className="text-sm text-text-tertiary">Transaction timeline visualization would appear here</p>
          </div>
        </div>
      </Card>

      {/* SAR Report (formal form format) */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <iconify-icon icon="solar:document-text-linear" width="18" class="text-text-tertiary" />
            <div className="text-[11px] font-medium uppercase tracking-wider text-text-secondary">
              SAR Report
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowPdfPreview(true)}>
              <span className="flex items-center gap-1.5">
                <iconify-icon icon="solar:download-linear" width="14" />
                Download PDF
              </span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/editor/${detail.id}`)}>
              <span className="flex items-center gap-1.5">
                <iconify-icon icon="solar:pen-new-square-linear" width="14" />
                Open in editor
              </span>
            </Button>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-border-light overflow-x-auto">
          <CaseDetailSarForm detail={detail} pdfRef={pdfRef} />
        </div>
      </Card>

      <PdfPreviewModal
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        elementRef={pdfRef}
        filename={`SAR-Case-${detail.id}.pdf`}
      />
    </div>
  );
};

function CaseDetailSarForm({ detail, pdfRef }: { detail: SarCaseDetail; pdfRef: React.RefObject<HTMLDivElement | null> }) {
  const unpacked = React.useMemo(() => unpackEdits(detail.narrativeEdited, detail), [detail.narrativeEdited, detail]);
  const narrative = unpacked.narrative || detail.narrativeGenerated || '';
  return (
    <div ref={pdfRef}>
      <SarFormReport
        detail={detail}
        formData={unpacked.formData}
        narrativeValue={narrative}
        editable={false}
      />
    </div>
  );
}
