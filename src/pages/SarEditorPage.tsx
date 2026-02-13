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
        <button
          onClick={() => navigate('/')}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Cases
        </button>
        <Card>
          <p className="text-sm text-slate-500">{error ?? 'Case not found.'}</p>
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
    <div className="space-y-6">
      <button
        onClick={() => navigate(`/cases/${detail.id}`)}
        className="text-sm text-blue-600 hover:underline"
      >
        ← Back to Case #{detail.id}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-50">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 mb-3">
            Generated SAR narrative
          </div>
          <p className="text-[15px] leading-[1.8] text-slate-700 whitespace-pre-line">
            {detail.narrativeGenerated}
          </p>

          <div className="mt-6 border-t border-slate-200 pt-4 space-y-2 text-xs text-slate-500">
            <div className="font-semibold uppercase tracking-[0.16em]">
              Customer profile
            </div>
            <div>Customer ID: {detail.customerId}</div>
            <div>Typology: {detail.typology}</div>
            <div>Score: {detail.score}</div>
          </div>
        </Card>

        <Card className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Your edits
            </div>
            <div className="text-xs text-slate-500 space-x-3">
              <span>
                Words:{' '}
                <span className="font-medium text-slate-800">{wordCount}</span>
              </span>
              <span>
                Characters:{' '}
                <span className="font-medium text-slate-800">{charCount}</span>
              </span>
            </div>
          </div>
          <textarea
            className="w-full h-72 md:h-80 border-2 border-slate-200 border-l-4 border-l-blue-600 rounded-lg px-3 py-2 text-sm leading-relaxed text-slate-700 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] resize-none bg-white"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <div>{saving ? 'Saving…' : 'Auto-save: mock'}</div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleSave} disabled={saving}>
                Save draft
              </Button>
              <Button variant="primary" size="sm" onClick={handleSubmit} disabled={saving}>
                Submit for review
              </Button>
            </div>
          </div>
          {error && (
            <div className="mt-2 text-xs text-red-600">
              {error}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

