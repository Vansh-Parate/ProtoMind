import React from 'react';
import { generateSarPdfBlob, downloadSarPdfBlob } from '../utils/downloadSarPdf';
import { Button } from './ui/Button';

type PdfPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  elementRef: React.RefObject<HTMLElement | null>;
  filename: string;
};

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  elementRef,
  filename
}) => {
  const element = isOpen ? elementRef.current : null;
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'preview' | 'error'>('idle');
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [blob, setBlob] = React.useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const urlRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!isOpen || !elementRef.current) {
      setStatus('idle');
      setPreviewUrl(null);
      setBlob(null);
      setErrorMessage(null);
      urlRef.current = null;
      return;
    }
    let cancelled = false;
    setStatus('loading');
    setErrorMessage(null);
    generateSarPdfBlob(elementRef.current, filename)
      .then(({ blob: b, url }) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = url;
        setBlob(b);
        setPreviewUrl(url);
        setStatus('preview');
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to generate PDF');
          setStatus('error');
        }
      });
    return () => {
      cancelled = true;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [isOpen, elementRef, filename]);

  const handleConfirmDownload = () => {
    if (blob) {
      downloadSarPdfBlob(blob, filename);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setBlob(null);
      onClose();
    }
  };

  const handleClose = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setBlob(null);
    setStatus('idle');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
          <h2 className="text-lg font-semibold text-text-primary">PDF Preview — Confirm & Download</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-text-tertiary hover:text-text-primary p-1"
            aria-label="Close"
          >
            <iconify-icon icon="solar:close-circle-linear" width="24" />
          </button>
        </div>
        <div className="flex-1 min-h-0 p-4 flex flex-col items-center justify-center">
          {status === 'loading' && (
            <p className="text-text-secondary">Generating PDF preview…</p>
          )}
          {status === 'error' && (
            <p className="text-muted-danger">{errorMessage}</p>
          )}
          {status === 'preview' && previewUrl && (
            <iframe
              title="PDF Preview"
              src={previewUrl}
              className="w-full h-[70vh] border border-border-light rounded"
            />
          )}
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border-light">
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirmDownload}
            disabled={status !== 'preview' || !blob}
          >
            Confirm & Download
          </Button>
        </div>
      </div>
    </div>
  );
};
