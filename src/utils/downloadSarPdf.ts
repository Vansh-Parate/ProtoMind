/**
 * Generate PDF from the SAR report container. Expects container to have child elements
 * with data-sar-page (each is one A4 page). One PDF page per child so UI matches PDF.
 */
/** Inject PDF-only alignment fixes into the cloned DOM before html2canvas renders it. */
function injectPdfAlignmentFixes(clonedDoc: Document) {
  const style = clonedDoc.createElement('style');
  style.textContent = `
    /* Push checkbox/radio boxes down to align with text in PDF only */
    label.inline-flex > div:first-child {
      position: relative !important;
      top: 6px !important;
    }
    /* Shift the tick (✓) upward inside the checkbox box — change top value to adjust */
    label.inline-flex > div:first-child > span {
      position: relative !important;
      top: -6px !important;
    }
  `;
  clonedDoc.head.appendChild(style);
}

export async function generateSarPdfBlob(
  containerElement: HTMLElement,
  filename: string = 'SAR-Report.pdf'
): Promise<{ blob: Blob; url: string; filename: string }> {
  const [html2canvas, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf')
  ]);

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 0;

  const pages = containerElement.querySelectorAll('[data-sar-page]');
  if (pages.length === 0) {
    const canvas = await html2canvas.default(containerElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (_doc: Document) => injectPdfAlignmentFixes(_doc),
    });
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  } else {
    for (let i = 0; i < pages.length; i++) {
      if (i > 0) pdf.addPage();
      const pageEl = pages[i] as HTMLElement;
      const captureHeight = Math.max(pageEl.scrollHeight, pageEl.offsetHeight);
      const canvas = await html2canvas.default(pageEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: pageEl.scrollWidth || pageEl.offsetWidth,
        height: captureHeight,
        windowWidth: pageEl.scrollWidth || pageEl.offsetWidth,
        windowHeight: captureHeight,
        onclone: (_doc: Document) => injectPdfAlignmentFixes(_doc),
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // First page for this section
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add extra pages if content overflows vertically
      while (heightLeft > 0) {
        position -= pageHeight; // Move the image up to show the next segment
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }
  }

  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);
  return { blob, url, filename };
}

/** Trigger download of an existing blob (e.g. after user confirms in preview). */
export function downloadSarPdfBlob(blob: Blob, filename: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Capture a DOM element and download it as a multi-page PDF (A4) immediately (no preview).
 */
export async function downloadSarPdf(element: HTMLElement, filename: string = 'SAR-Report.pdf'): Promise<void> {
  const { blob, url, filename: name } = await generateSarPdfBlob(element, filename);
  URL.revokeObjectURL(url);
  downloadSarPdfBlob(blob, name);
}
