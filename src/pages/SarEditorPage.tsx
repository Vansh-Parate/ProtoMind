import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SarFormReport, useSarFormState } from '../components/SarFormReport';

import type { SarCaseDetail } from '../types';
import type { SarFormData } from '../sarForm';
import { defaultSarFormData } from '../sarForm';
import { fetchCaseDetail, updateSarEdits, approveSar } from '../api/client';

/** Pack narrative + form data into a single JSON string for storage. */
function packEdits(narrative: string, formData: SarFormData): string {
  return JSON.stringify({ narrative, formData });
}

/** Unpack stored edited_text. Backward compatible with plain text. */
export function unpackEdits(editedText: string, detail: SarCaseDetail): { narrative: string; formData: SarFormData } {
  const defaults = defaultSarFormData(detail);
  if (!editedText) return { narrative: '', formData: defaults };
  try {
    const parsed = JSON.parse(editedText);
    if (parsed && typeof parsed === 'object' && typeof parsed.narrative === 'string') {
      // Merge saved formData with defaults so every field exists
      const merged = { ...defaults, ...(parsed.formData ?? {}) };
      return { narrative: parsed.narrative, formData: merged };
    }
  } catch { /* not JSON, treat as plain narrative */ }
  return { narrative: editedText, formData: defaults };
}

export const SarEditorPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = React.useState<SarCaseDetail | null>(null);
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

  return (
    <SarEditorContent
      detail={detail}
      caseId={id!}
      navigate={navigate}
      saving={saving}
      setSaving={setSaving}
      error={error}
      setError={setError}
      onSaveSuccess={async () => {
        const data = await fetchCaseDetail(id!, true);
        setDetail(data);
        return data;
      }}
    />
  );
};

function SarEditorContent({
  detail,
  caseId,
  navigate,
  saving,
  setSaving,
  error,
  setError,
  onSaveSuccess
}: {
  detail: SarCaseDetail;
  caseId: string;
  navigate: (path: string) => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
  error: string | null;
  setError: (v: string | null) => void;
  onSaveSuccess: () => Promise<SarCaseDetail | void>;
}) {
  const unpacked = React.useMemo(() => unpackEdits(detail.narrativeEdited, detail), [detail.narrativeEdited, detail]);
  const [value, setValue] = React.useState(unpacked.narrative || detail.narrativeGenerated || '');
  const [formData, setFormData] = useSarFormState(detail, unpacked.formData);

  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const packed = packEdits(value, formData);
      await updateSarEdits({ caseId, editedText: packed, actor: 'demo-analyst' });
      await onSaveSuccess();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const packed = packEdits(value, formData);
      await updateSarEdits({ caseId, editedText: packed, actor: 'demo-analyst' });
      await onSaveSuccess();
      await approveSar({ caseId, actor: 'demo-analyst' });
      navigate(`/cases/${caseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit for review');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate(`/cases/${detail.id}`)} className="mb-6">
        ← Back to Case #{detail.id}
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          SAR Editor — Case #{detail.id}
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">
            Words: <span className="font-medium text-text-primary">{wordCount}</span>
            {' · '}
            Characters: <span className="font-medium text-text-primary">{charCount}</span>
          </span>
          <Button variant="secondary" size="sm" onClick={handleSave} disabled={saving} loading={saving}>
            Save draft
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={saving} loading={saving}>
            Submit for review
          </Button>
        </div>
      </div>

      <Card>
        <div className="bg-white rounded-lg border border-border-light overflow-x-auto">
          <SarFormReport
            detail={detail}
            formData={formData}
            onFormDataChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
            narrativeValue={value}
            onNarrativeChange={setValue}
            editable

          />
        </div>
      </Card>
      {saveSuccess && (
        <div className="mt-2 text-xs text-green-600 font-medium">
          Draft saved. Your changes are stored.
        </div>
      )}
      {error && (
        <div className="mt-2 text-xs text-muted-danger">
          {error}
        </div>
      )}
    </div>
  );
}
