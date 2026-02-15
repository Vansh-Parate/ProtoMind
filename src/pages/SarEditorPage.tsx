import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import type { SarCaseDetail } from '../types';
import { fetchCaseDetail, updateSarEdits, approveSar } from '../api/client';

export const SarEditorPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = React.useState<SarCaseDetail | null>(null);
  const [value, setValue] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchCaseDetail(id);
        if (!cancelled) {
          setDetail(data);
          setValue(data.narrativeEdited || data.narrativeGenerated || '');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load case');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          ← Back to Cases
        </Button>
        <Card>
          <p className="text-sm text-text-secondary">{error ?? 'Case not found.'}</p>
        </Card>
      </div>
    );
  }

  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      await updateSarEdits({ caseId: id, editedText: value, actor: 'demo-analyst' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      await updateSarEdits({ caseId: id, editedText: value, actor: 'demo-analyst' });
      await approveSar({ caseId: id, actor: 'demo-analyst' });
      navigate(`/cases/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit for review');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate(`/cases/${detail.id}`)} className="mb-6">
        ← Back to Case #{detail.id}
      </Button>

      {/* Header */}
      <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-8">
        SAR Editor — Case #{detail.id}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Generated Narrative */}
        <Card className="bg-bg-main">
          <div className="text-[11px] font-medium uppercase tracking-wider text-text-secondary mb-3">
            Generated SAR narrative
          </div>
          <p className="text-sm leading-[1.8] text-text-primary whitespace-pre-line">
            {detail.narrativeGenerated}
          </p>

          <div className="mt-6 border-t border-border-light pt-4 space-y-2 text-xs text-text-secondary">
            <div className="font-medium uppercase tracking-wider text-[11px]">
              Customer profile
            </div>
            <div>Customer ID: {detail.customerId}</div>
            <div>Typology: {detail.typology}</div>
            <div>Score: {detail.score}</div>
          </div>
        </Card>

        {/* Right: Editor */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-medium uppercase tracking-wider text-text-secondary">
              Your edits
            </div>
            <div className="text-xs text-text-secondary space-x-3">
              <span>
                Words: <span className="font-medium text-text-primary">{wordCount}</span>
              </span>
              <span>
                Characters: <span className="font-medium text-text-primary">{charCount}</span>
              </span>
            </div>
          </div>
          <textarea
            className="w-full h-72 md:h-80 rounded-lg border border-border-light bg-white px-4 py-3 text-sm leading-relaxed text-text-primary resize-none focus:border-text-secondary transition-colors"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />

          <div className="mt-4 flex items-center justify-between text-xs text-text-secondary">
            <div>{saving ? 'Saving…' : 'Save draft to store edits'}</div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleSave} disabled={saving} loading={saving}>
                Save draft
              </Button>
              <Button variant="primary" size="sm" onClick={handleSubmit} disabled={saving} loading={saving}>
                Submit for review
              </Button>
            </div>
          </div>
          {error && (
            <div className="mt-2 text-xs text-muted-danger">
              {error}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
