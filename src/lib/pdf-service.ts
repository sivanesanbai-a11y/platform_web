'use client';

/**
 * High-fidelity client-side PDF Generator for NUNES Quotations
 * Uses html2canvas + jsPDF to render the EXACT paper quotation layout
 */

export interface ExportPdfResult {
  blob: Blob;
  file: File;
  dataUrl: string;
}

export async function exportElementToPdf(
  element: HTMLElement,
  filename: string
): Promise<ExportPdfResult> {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  // Render high-DPI canvas (2x scale ensures sharp text, lines & logos)
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = 210;
  const pdfHeight = 297;
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pdfHeight;

  while (heightLeft > 2) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;
  }

  const blob = pdf.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });
  const dataUrl = URL.createObjectURL(blob);

  return { blob, file, dataUrl };
}

export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

export async function copyElementAsImage(element: HTMLElement): Promise<boolean> {
  try {
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob || typeof navigator === 'undefined' || !navigator.clipboard) {
          resolve(false);
          return;
        }
        try {
          // Clipboard Item for PNG
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          resolve(true);
        } catch {
          resolve(false);
        }
      }, 'image/png');
    });
  } catch {
    return false;
  }
}

export async function sharePdfFile(file: File, text?: string, title?: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      const shareData: ShareData = {
        files: [file],
        title: title || file.name
      };
      if (text) {
        shareData.text = text;
      }
      await navigator.share(shareData);
      return true;
    } catch (e: any) {
      if (e.name !== 'AbortError') console.error('Share failed', e);
      return false;
    }
  }
  return false;
}

