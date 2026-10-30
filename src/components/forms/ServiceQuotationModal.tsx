'use client';

import React, { useState, useMemo, useRef } from 'react';
import { 
  Printer, X, MessageCircle, Mail, FileText, Check, Copy, 
  Save, ExternalLink, Send, Share2, FileCheck, Calendar,
  Building, User, Phone, MapPin, Percent, DollarSign, Download,
  FileDown, Image as ImageIcon, Sparkles, AlertCircle, Plus
} from 'lucide-react';
import type { ServiceJob, ServiceProduct } from '@/types/service-job';
import { exportElementToPdf, triggerFileDownload, copyElementAsImage } from '@/lib/pdf-service';
import { syncFormToCloud } from '@/lib/sync';
import { cleanNumberString, parseCleanNumber, copyToClipboard } from '@/lib/utils';

export interface ServiceQuotationModalProps {
  job: Partial<ServiceJob> & {
    id?: string;
    jobNo?: string;
    customer?: any;
    products?: any[];
    totals?: any;
    jobDate?: string;
    branchName?: string;
    notes?: string;
  };
  onClose: () => void;
  onSaved?: () => void;
}

function cleanPhone(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) return '91' + digits;
  return digits;
}

function formatMoney(amount: number): string {
  const n = Number(amount || 0);
  return '₹ ' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return isoDate;
}

function getFutureDate(days = 15): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function sanitizeCustomerScope(text: string): string {
  if (!text) return 'Comprehensive technical inspection, sensor calibration & precision overhaul';
  let clean = text
    .replace(/Priya:?\s*Please fill commercial pricing form[^\n.]*/gi, '')
    .replace(/submit for MD approval[^\n.]*/gi, '')
    .replace(/Senthil finished overhaul \(\d+\s*mins?\)\s*(for [^.]*)?/gi, 'Comprehensive technical overhaul & servicing')
    .replace(/Senthil finished overhaul[^\n.]*/gi, 'Comprehensive technical overhaul & servicing')
    .replace(/\bCategory:\s*(Min\s*30%|Max\s*50%|MINIMUM_30|MAXIMUM_50)\b/gi, '')
    .replace(/Stage:\s*[A-Z_]+/gi, '')
    .replace(/Proof photos:?\s*\d*/gi, '')
    .replace(/Take product from [^\n.]*/gi, '')
    .replace(/Awaiting MD approval[^\n.]*/gi, '')
    .replace(/MD Executive Approved[^\n.]*/gi, '')
    .trim();

  clean = clean.replace(/^[-,:.]+\s*/, '').replace(/\s*[-,:.]+$/, '').trim();
  if (!clean || clean.length < 5) {
    return 'Precision overhaul, component calibration & standard verification';
  }
  return clean;
}

function sanitizeCustomerProblem(text: string, defaultProblem = 'Electrode calibration drift & diagnostic inspection'): string {
  if (!text) return defaultProblem;
  let clean = text
    .replace(/Priya:?\s*Please fill commercial pricing form[^\n.]*/gi, '')
    .replace(/submit for MD approval[^\n.]*/gi, '')
    .replace(/Senthil finished overhaul[^\n.]*/gi, '')
    .replace(/\bCategory:\s*(Min\s*30%|Max\s*50%|MINIMUM_30|MAXIMUM_50)\b/gi, '')
    .replace(/Stage:\s*[A-Z_]+/gi, '')
    .trim();
  clean = clean.replace(/^[-,:.]+\s*/, '').replace(/\s*[-,:.]+$/, '').trim();
  if (!clean || clean.length < 4) {
    return defaultProblem;
  }
  return clean;
}

function numberToWordsINR(amount: number): string {
  const num = Math.round(Number(amount || 0));
  if (num === 0) return 'Zero Rupees Only';

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n === 0) return '';
    if (n < 20) return a[n] + ' ';
    if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10] + ' ';
    if (n < 1000) return inWords(Math.floor(n / 100)) + 'Hundred ' + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + inWords(n % 10000000);
  }

  return (inWords(num).trim() + ' Rupees Only').replace(/\s+/g, ' ');
}

export default function ServiceQuotationModal({ job, onClose, onSaved, onStartNewJob }: ServiceQuotationModalProps) {
  const jobNo = job.jobNo || job.id || 'SJ-TEMP';
  const customerName = job.customer?.name || 'Valued Customer';
  const customerContact = job.customer?.contactPerson || '';
  const initialPhone = job.customer?.phone || '';
  const initialEmail = job.customer?.email || '';

  // Form states
  const [reference, setReference] = useState(`QT-${jobNo}`);
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState(getFutureDate(15));
  const [taxRate, setTaxRate] = useState<number>(18);
  const [discount, setDiscount] = useState<number>(Number(job.totals?.discount || 0));
  const [recipientPhone, setRecipientPhone] = useState(initialPhone);
  const [recipientEmail, setRecipientEmail] = useState(initialEmail);
  const [intro, setIntro] = useState(
    'Thank you for contacting NUNES Instrumentation. Based on our technical inspection and requested features, please find our service and repair quotation below.'
  );
  const [terms, setTerms] = useState(
    '1. Quotation subject to customer approval.\n2. Work commences after confirmation.\n3. 90-day warranty on replaced components.\n4. Standard GST 18% as applicable.'
  );

  const [copied, setCopied] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfNotice, setPdfNotice] = useState<{ title: string; desc: string; type: 'whatsapp' | 'email' | 'download' } | null>(null);

  // Delivery & Dispatch mode state (Direct Walk-in vs Cannot Get Direct / Courier)
  const initialCannotGetDirect = useMemo(() => {
    const wf = job.workflow || {};
    const rc = (job as any).receipt || {};
    const dp = (job as any).dispatch || {};
    return (
      wf.priyaHandoverType === 'COURIER' ||
      (!wf.priyaHandoverType && rc.mode === 'COURIER') ||
      Boolean(wf.cannotGetDirect) ||
      Boolean(wf.isBranchDelivery) ||
      (typeof dp.mode === 'string' && dp.mode.toLowerCase().includes('courier'))
    );
  }, [job]);

  const [cannotGetDirect, setCannotGetDirect] = useState(initialCannotGetDirect);
  const [courierPartner, setCourierPartner] = useState(
    job.workflow?.priyaCourierName || (job as any).receipt?.courierName || 'ST Courier'
  );
  const [courierDocket, setCourierDocket] = useState(
    job.workflow?.priyaCourierDocket || (job as any).receipt?.docketNo || ''
  );

  // Products
  const products: ServiceProduct[] = (job.products && job.products.length > 0)
    ? job.products
    : [{
        id: '1',
        productName: 'Equipment Service & Calibration',
        makeModel: 'Standard',
        serialNo: '',
        qty: 1,
        status: 'RECEIVED',
        complaint: 'General service and diagnostic check',
        repairWork: 'Component inspection and calibration',
        productValue: 0,
        repairEstimate: Number(job.totals?.repairEstimate || job.totals?.totalEstimate || 1500),
        repairCategory: 'MINIMUM_30',
        repairPercent: 30,
        onlinePrice: 0,
        onlinePriceSource: '',
        onlinePriceConfirmed: false,
        onlinePriceCheckedAt: '',
        estimateStatus: 'ESTIMATE_READY',
        productImageUrl: '',
        productSpecifications: '',
        onlineProductUrl: '',
        onlineDetailsTitle: '',
        onlineDetailsFetchedAt: '',
        onlineLookupQuery: '',
        productImageUrls: [],
        marketPriceMin: 0,
        marketPriceMax: 0,
        marketPriceMedian: 0,
        marketPriceSampleCount: 0
      }];

  // Financial calculations
  const subtotal = useMemo(() => {
    return products.reduce((sum, p) => {
      const qty = Number(p.qty || 1);
      const est = Number(p.repairEstimate || 0);
      return sum + (qty * est);
    }, 0);
  }, [products]);

  const taxableAmount = Math.max(0, subtotal - discount);
  const taxAmount = (taxableAmount * taxRate) / 100;
  const grandTotal = taxableAmount + taxAmount;
  const amountInWords = numberToWordsINR(grandTotal);

  const subject = `Service Repair Quotation ${reference} | Job ${jobNo} (PDF Attached) - NUNES Instrumentation`;

  const quoteLinesWhatsApp = useMemo(() => {
    return products.map((p, i) => {
      const name = p.productName || 'Equipment';
      const model = p.makeModel ? ` (${p.makeModel})` : '';
      const work = p.repairWork || p.complaint ? `\n   *Work/Feature:* ${p.repairWork || p.complaint}` : '';
      const totalLine = (Number(p.qty || 1) * Number(p.repairEstimate || 0));
      return `${i + 1}. *${name}*${model}${work}\n   *Qty:* ${p.qty || 1}  |  *Rate:* ${formatMoney(p.repairEstimate || 0)}  |  *Amount:* ${formatMoney(totalLine)}`;
    }).join('\n\n');
  }, [products]);

  const whatsappMessage = useMemo(() => {
    return `*NUNES INSTRUMENTATION & OPERATIONS*
*OFFICIAL SERVICE & REPAIR QUOTATION*
---------------------------------------
*Quotation Ref:* ${reference}
*Service Job:* ${jobNo}
*Date:* ${formatDate(quoteDate)}
${validUntil ? `*Valid Until:* ${formatDate(validUntil)}\n` : ''}
*Customer:* ${customerName}
${customerContact ? `*Contact Person:* ${customerContact}\n` : ''}
${intro}

*EQUIPMENT & SERVICE SPECIFICATIONS:*
${quoteLinesWhatsApp}

---------------------------------------
*Subtotal:* ${formatMoney(subtotal)}
${discount > 0 ? `*Discount:* -${formatMoney(discount)}\n` : ''}*Taxable Value:* ${formatMoney(taxableAmount)}
*GST (${taxRate}%):* ${formatMoney(taxAmount)}
*GRAND TOTAL:* ${formatMoney(grandTotal)}
_(${amountInWords})_
---------------------------------------

📄 *Official Quotation PDF attached.*
Please reply to confirm and approve the service quotation.

Regards,
*NUNES Instrumentation Service Team*`;
  }, [
    reference, jobNo, quoteDate, validUntil, customerName, customerContact,
    intro, quoteLinesWhatsApp, subtotal, discount, taxableAmount, taxRate,
    taxAmount, grandTotal, amountInWords, terms
  ]);

  const emailBody = useMemo(() => {
    return `Dear ${customerName},\n\n${intro}\n\nPlease find attached our official service and repair quotation in exact PDF format for your review and approval.\n\nQuotation Reference: ${reference}\nService Job: ${jobNo}\nDate: ${formatDate(quoteDate)}\n${validUntil ? 'Valid Until: ' + formatDate(validUntil) + '\n' : ''}\nSubtotal: ${formatMoney(subtotal)}\nDiscount: ${formatMoney(discount)}\nGST (${taxRate}%): ${formatMoney(taxAmount)}\nGrand Total: ${formatMoney(grandTotal)}\n(${amountInWords})\n\nKindly refer to the attached PDF for complete technical specifications, itemized line rates, and terms.\n\nPlease confirm acceptance to proceed.\n\nRegards,\nNUNES Instrumentation Service Team`;
  }, [customerName, intro, reference, jobNo, quoteDate, validUntil, subtotal, discount, taxRate, taxAmount, grandTotal, amountInWords]);

  const formattedPhone = cleanPhone(recipientPhone);

  const whatsappWebUrl = useMemo(() => {
    return `https://web.whatsapp.com/send?phone=${encodeURIComponent(formattedPhone)}&text=${encodeURIComponent(whatsappMessage)}`;
  }, [formattedPhone, whatsappMessage]);

  const gmailWebUrl = useMemo(() => {
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
  }, [recipientEmail, subject, emailBody]);

  // Helper: Export and download PDF
  async function handleDownloadPdf() {
    const el = document.getElementById('service-quotation-sheet');
    if (!el) return;
    setGeneratingPdf(true);
    try {
      const pdfFileName = `NUNES-Quotation-${reference}.pdf`;
      const res = await exportElementToPdf(el, pdfFileName);
      triggerFileDownload(res.blob, pdfFileName);
      saveQuotationSnapshot();
      setPdfNotice({
        title: 'Quotation PDF Downloaded & Saved',
        desc: `"${pdfFileName}" has been generated in exact formal layout, saved to Quotations & Downloads.`,
        type: 'download'
      });
    } catch (err) {
      console.error(err);
      window.print();
    } finally {
      setGeneratingPdf(false);
    }
  }

  // Helper: Copy exact quotation card as image (to paste into WhatsApp / Teams / Email)
  async function handleCopyExactImage() {
    const el = document.getElementById('service-quotation-sheet');
    if (!el) return;
    setGeneratingPdf(true);
    try {
      const ok = await copyElementAsImage(el);
      if (ok) {
        setImageCopied(true);
        setTimeout(() => setImageCopied(false), 3500);
      } else {
        handleCopy();
      }
    } catch {
      handleCopy();
    } finally {
      setGeneratingPdf(false);
    }
  }

  // 1-Click WhatsApp Web with Exact PDF Generation
  async function handleWhatsAppWithPdf() {
    const el = document.getElementById('service-quotation-sheet');
    if (!el) {
      window.open(whatsappWebUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setGeneratingPdf(true);
    const pdfFileName = `NUNES-Quotation-${reference}.pdf`;
    try {
      // 1. Generate & download exact PDF
      const res = await exportElementToPdf(el, pdfFileName);
      triggerFileDownload(res.blob, pdfFileName);

      // 2. Also copy exact image to clipboard for instant Ctrl+V pasting in WhatsApp Web
      try {
        await copyElementAsImage(el);
      } catch {}

      // 3. Mark communication
      markCommunicationSent('whatsapp');
      saveQuotationSnapshot();

      // 4. Open WhatsApp Web
      window.open(whatsappWebUrl, '_blank', 'noopener,noreferrer');

      // 5. Show instructions banner
      setPdfNotice({
        title: 'Exact Quotation PDF Ready for WhatsApp Web',
        desc: `"${pdfFileName}" has been downloaded to your PC and the exact quotation card has been copied to your clipboard. Simply drag and drop the downloaded PDF file or press Ctrl+V in WhatsApp Web to send the exact visual quotation!`,
        type: 'whatsapp'
      });
    } catch (err) {
      console.error(err);
      window.open(whatsappWebUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setGeneratingPdf(false);
    }
  }

  // 1-Click Gmail with Exact PDF Generation
  async function handleGmailWithPdf() {
    const el = document.getElementById('service-quotation-sheet');
    if (!el) {
      window.open(gmailWebUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setGeneratingPdf(true);
    const pdfFileName = `NUNES-Quotation-${reference}.pdf`;
    try {
      // 1. Generate & download exact PDF
      const res = await exportElementToPdf(el, pdfFileName);
      triggerFileDownload(res.blob, pdfFileName);

      // 2. Mark communication
      markCommunicationSent('email');

      // 3. Open Gmail
      window.open(gmailWebUrl, '_blank', 'noopener,noreferrer');

      // 4. Show instruction
      setPdfNotice({
        title: 'Exact Quotation PDF Ready for Gmail',
        desc: `"${pdfFileName}" has been downloaded. Gmail has opened in your browser — simply attach the downloaded PDF file to your email draft!`,
        type: 'email'
      });
    } catch (err) {
      console.error(err);
      window.open(gmailWebUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setGeneratingPdf(false);
    }
  }

  function handleCopy() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  function markCommunicationSent(channel: 'whatsapp' | 'email') {
    try {
      const nowIso = new Date().toISOString();
      const raw = localStorage.getItem('nunes:service_jobs');
      if (raw) {
        const list: any[] = JSON.parse(raw);
        const idx = list.findIndex(x => String(x.id) === String(job.id) || String(x.jobNo) === String(jobNo));
        if (idx >= 0) {
          list[idx].communication = list[idx].communication || {};
          if (channel === 'whatsapp') {
            list[idx].communication.whatsappStatus = 'QUOTED';
            list[idx].communication.whatsappSentAt = nowIso;
          } else {
            list[idx].communication.emailStatus = 'QUOTED';
            list[idx].communication.emailSentAt = nowIso;
          }
          localStorage.setItem('nunes:service_jobs', JSON.stringify(list));
        }
      }
    } catch {}
  }

  function saveQuotationSnapshot() {
    setSaving(true);
    try {
      const snapshot = {
        id: `SQ-${Date.now()}`,
        jobId: job.id || jobNo,
        jobNo,
        reference,
        quoteDate,
        validUntil,
        customerName,
        customerPhone: recipientPhone,
        customerEmail: recipientEmail,
        cannotGetDirect,
        courierPartner: cannotGetDirect ? courierPartner : undefined,
        courierDocket: cannotGetDirect ? courierDocket : undefined,
        deliveryMode: cannotGetDirect ? 'COURIER' : 'DIRECT_HANDOVER',
        intro,
        terms,
        subtotal: subtotal,
        discount: discount,
        taxRate,
        taxAmount,
        grandTotal,
        amountInWords,
        products,
        savedAt: new Date().toISOString()
      };

      // 1. Service quotations cache
      const raw = localStorage.getItem('nunes:service_quotations');
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(snapshot);
      localStorage.setItem('nunes:service_quotations', JSON.stringify(list.slice(0, 100)));

      // 2. Unified Quotations Registry (powers /quotations, /customers, and backups)
      const unifiedQuote = {
        id: `qt-${Date.now()}`,
        quotation_no: reference,
        customer_name: customerName,
        customer_phone: recipientPhone || '+91 98421 00000',
        customer_city: 'Coimbatore',
        item_description: (products || []).map((p: any) => p.productName || p.name).filter(Boolean).join(', ') || 'Instrument Calibration & Servicing',
        scope_type: 'Calibration',
        amount: Math.max(0, subtotal - discount),
        gst_amount: taxAmount,
        total_amount: grandTotal,
        status: 'SENT',
        sent_at: new Date().toISOString(),
        valid_until: validUntil || new Date(Date.now() + 86400000 * 30).toISOString(),
        notes: terms || 'Standard NUNES Calibration & Servicing warranty applies.'
      };
      const qRaw = localStorage.getItem('nunes:quotations');
      const qList = qRaw ? JSON.parse(qRaw) : [];
      const filteredQ = qList.filter((x: any) => x.quotation_no !== reference);
      localStorage.setItem('nunes:quotations', JSON.stringify([unifiedQuote, ...filteredQ]));

      // 3. Automatic Cloud & Instruasia Webhook synchronization
      void syncFormToCloud('quotation', reference, customerName, snapshot);

      markCommunicationSent('whatsapp');
      markCommunicationSent('email');

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
      if (onSaved) onSaved();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="paperPreviewOverlay" role="dialog" aria-modal="true" aria-label="Service Quotation Generator">
      <div className="paperPreviewShell" style={{ maxWidth: '1060px' }}>
        
        {/* TOP TOOLBAR */}
        <div className="paperPreviewToolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#059669', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                PDF ENGINE READY
              </span>
              <b style={{ fontSize: '15px' }}>Service Quotation (Exact PDF Format)</b>
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Official PDF format with NUNES logo, itemized repair rates and GST. Ready to dispatch via WhatsApp Web and Gmail.
            </span>
          </div>

          <div className="paperPreviewActions" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginLeft: 'auto' }}>
            <button
              type="button"
              className="btn"
              onClick={handleWhatsAppWithPdf}
              disabled={generatingPdf}
              style={{ background: '#25D366', color: '#fff', borderColor: '#25D366', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Generate exact PDF and open WhatsApp Web"
            >
              <MessageCircle size={16} />
              <span>{generatingPdf ? 'Generating PDF...' : 'WhatsApp Web (with PDF)'}</span>
            </button>

            <button
              type="button"
              className="btn"
              onClick={handleGmailWithPdf}
              disabled={generatingPdf}
              style={{ background: '#EA4335', color: '#fff', borderColor: '#EA4335', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Generate exact PDF and open Gmail Composer"
            >
              <Mail size={16} />
              <span>{generatingPdf ? 'Generating PDF...' : 'Send via Gmail (with PDF)'}</span>
            </button>

            <button
              type="button"
              className="btn primary"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              style={{ background: '#1d4ed8', borderColor: '#1d4ed8', fontWeight: 600 }}
              title="Download exact official quotation PDF"
            >
              <FileDown size={16} />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              className="btn"
              onClick={handleCopyExactImage}
              disabled={generatingPdf}
              title="Copy exact quotation card as image (press Ctrl+V to paste into WhatsApp Web)"
            >
              {imageCopied ? <Check size={16} style={{ color: '#10b981' }} /> : <ImageIcon size={16} />}
              <span>{imageCopied ? 'Image Copied!' : 'Copy Image (Ctrl+V)'}</span>
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => window.print()}
              title="Print official quotation"
            >
              <Printer size={16} /> Print
            </button>

            <button
              type="button"
              className="btn"
              onClick={saveQuotationSnapshot}
              disabled={saving}
              title="Save a snapshot of this quotation"
            >
              <Save size={16} />
              <span>{savedSuccess ? 'Saved!' : 'Save Quote'}</span>
            </button>

            <button
              type="button"
              className="btn"
              onClick={onClose}
              title="Close quotation preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* NOTICE POPUP / HELPER BANNER WHEN PDF IS DISPATCHED */}
        {pdfNotice && (
          <div className="no-print" style={{
            background: pdfNotice.type === 'whatsapp' ? '#f0fdf4' : '#eff6ff',
            border: `1.5px solid ${pdfNotice.type === 'whatsapp' ? '#86efac' : '#93c5fd'}`,
            borderRadius: '10px',
            padding: '14px 18px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: pdfNotice.type === 'whatsapp' ? '#22c55e' : '#3b82f6',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              flexShrink: 0
            }}>
              {pdfNotice.type === 'whatsapp' ? <MessageCircle size={18} /> : <Mail size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <b style={{ color: pdfNotice.type === 'whatsapp' ? '#14532d' : '#1e3a8a', fontSize: '14px', display: 'block' }}>
                {pdfNotice.title}
              </b>
              <p style={{ color: pdfNotice.type === 'whatsapp' ? '#166534' : '#1e40af', fontSize: '13px', margin: '4px 0 0', lineHeight: 1.5 }}>
                {pdfNotice.desc}
              </p>
              {onStartNewJob && (
                <div style={{ marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={onStartNewJob}
                    style={{
                      background: '#059669',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '6px 14px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={13} /> Complete &amp; Start Next Job (4s Fireworks)
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPdfNotice(null)}
              style={{ background: 'transparent', border: 0, cursor: 'pointer', color: '#64748b' }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* CONTROLS (HIDDEN IN PRINT) */}
        <div className="no-print" style={{ 
          background: '#ffffff', 
          borderRadius: '12px', 
          padding: '16px', 
          marginBottom: '16px', 
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Quotation Configuration &amp; Recipient
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Any adjustments automatically update the exact PDF document
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Quotation Ref No:
              </label>
              <input
                type="text"
                value={reference}
                onChange={e => setReference(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Quotation Date:
              </label>
              <input
                type="date"
                value={quoteDate}
                onChange={e => setQuoteDate(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Valid Until:
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={e => setValidUntil(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#475569' }}>
                  GST Tax Rate (%):
                </label>
                {taxRate > 0 ? (
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                    GST Applied ({taxRate}%)
                  </span>
                ) : (
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    No GST (0% Nil)
                  </span>
                )}
              </div>

              {/* Quick 1-click GST Toggle buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={() => setTaxRate(0)}
                  style={{
                    padding: '6px 8px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: taxRate === 0 ? '2px solid #0f2e5a' : '1px solid #cbd5e1',
                    background: taxRate === 0 ? '#0f2e5a' : '#ffffff',
                    color: taxRate === 0 ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  ✓ No GST (0%)
                </button>
                <button
                  type="button"
                  onClick={() => setTaxRate(18)}
                  style={{
                    padding: '6px 8px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: taxRate === 18 ? '2px solid #2563eb' : '1px solid #93c5fd',
                    background: taxRate === 18 ? '#2563eb' : '#eff6ff',
                    color: taxRate === 18 ? '#ffffff' : '#1d4ed8',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  + Add 18% GST
                </button>
              </div>

              <select
                value={taxRate}
                onChange={e => setTaxRate(Number(e.target.value))}
                style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}
              >
                <option value={0}>0% (No GST / Nil / Tax Exempt)</option>
                <option value={5}>5% GST</option>
                <option value={12}>12% GST</option>
                <option value={18}>18% GST (Standard Services)</option>
                <option value={28}>28% GST</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Discount (INR):
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={discount ? String(discount) : ''}
                onFocus={e => {
                  if (e.target.value === '0') e.target.select();
                }}
                onChange={e => {
                  const cleaned = cleanNumberString(e.target.value);
                  e.target.value = cleaned;
                  setDiscount(parseCleanNumber(cleaned));
                }}
                style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#475569' }}>
                  WhatsApp Phone Number:
                </label>
                {phoneCopied && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Check size={12} /> Copied! Press Ctrl+V in WhatsApp
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={recipientPhone}
                  onChange={e => setRecipientPhone(e.target.value)}
                  style={{ flex: 1, padding: '7px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
                <button
                  type="button"
                  onClick={async () => {
                    const p = recipientPhone.trim() || (formattedPhone ? `+${formattedPhone}` : '');
                    if (p) {
                      await copyToClipboard(p);
                      setPhoneCopied(true);
                      setTimeout(() => setPhoneCopied(false), 3000);
                    }
                  }}
                  className="btn"
                  title="Copy phone number to clipboard"
                  style={{ padding: '6px 12px', fontSize: '12px', background: '#f8fafc', borderColor: '#cbd5e1', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Copy size={13} /> {phoneCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Customer Email Address:
              </label>
              <input
                type="email"
                placeholder="customer@domain.com"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                style={{ width: '100%', padding: '7px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Collection / Delivery Mode:
              </label>
              <select
                value={cannotGetDirect ? 'COURIER' : 'DIRECT'}
                onChange={e => setCannotGetDirect(e.target.value === 'COURIER')}
                style={{ width: '100%', padding: '7px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', fontWeight: 600, color: cannotGetDirect ? '#b45309' : '#047857' }}
              >
                <option value="DIRECT">🤝 Direct Walk-in (Counter Collection)</option>
                <option value="COURIER">📦 Cannot Get Direct (Courier Dispatch)</option>
              </select>
            </div>

            {cannotGetDirect && (
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Courier Partner Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. ST Courier, DTDC, Professional"
                  value={courierPartner}
                  onChange={e => setCourierPartner(e.target.value)}
                  style={{ width: '100%', padding: '7px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* PRINTABLE & EXPORTABLE EXACT PDF QUOTATION SHEET */}
        <article 
          id="service-quotation-sheet"
          className="paperJobCard quotationSheet" 
          style={{ 
            fontFamily: '"Times New Roman", Times, serif', 
            background: '#ffffff',
            boxShadow: '0 15px 45px rgba(0,0,0,0.12)',
            padding: '40px 48px',
            minHeight: '1050px',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #164f91', paddingBottom: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '8px', 
                  background: 'linear-gradient(135deg, #1d4ed8, #0284c7)', 
                  display: 'grid', 
                  placeItems: 'center',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '22px',
                  fontFamily: 'sans-serif'
                }}>
                  N
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#164f91', letterSpacing: '1px', lineHeight: 1.1 }}>
                    NUNES INSTRUMENTATION
                  </h1>
                  <span style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Testing, Calibration, Service &amp; Maintenance Operations
                  </span>
                </div>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>
                Office / Works: Head Office: Kolkata &amp; Branches: Chennai, Mumbai, Delhi<br/>
                Email: servicing@nunesinstruments.com | Web: https://nunes-operations-v44.vercel.app
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                background: '#164f91', 
                color: '#fff', 
                padding: '6px 14px', 
                borderRadius: '4px', 
                display: 'inline-block',
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '1px'
              }}>
                OFFICIAL SERVICE QUOTATION
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                <div><b>Quote Ref:</b> <span style={{ color: '#0f172a', fontWeight: 700 }}>{reference}</span></div>
                <div><b>Date:</b> {formatDate(quoteDate)}</div>
                <div><b>Job Ref:</b> {jobNo}</div>
                {validUntil && <div><b>Valid Until:</b> {formatDate(validUntil)}</div>}
              </div>
            </div>
          </div>

          {/* Customer & Job Info Box */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1.2fr 0.8fr', 
            gap: '16px', 
            background: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '6px', 
            padding: '14px 18px',
            marginBottom: '20px'
          }}>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                QUOTATION ISSUED TO:
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                {customerName}
              </div>
              {customerContact && (
                <div style={{ fontSize: '12px', color: '#334155', marginTop: '2px' }}>
                  <b>Attn:</b> {customerContact}
                </div>
              )}
              {job.customer?.address && (
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                  {job.customer.address}{job.customer.city ? `, ${job.customer.city}` : ''}{job.customer.state ? `, ${job.customer.state}` : ''}
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                {recipientPhone && <span><b>Phone:</b> {recipientPhone} &nbsp;|&nbsp; </span>}
                {recipientEmail && <span><b>Email:</b> {recipientEmail}</span>}
              </div>
              {job.customer?.gstin && (
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                  <b>GSTIN:</b> {job.customer.gstin}
                </div>
              )}
            </div>

            <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '16px' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                SERVICE SPECIFICATIONS:
              </div>
              <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.6 }}>
                <div><b>Branch:</b> {job.branchName || 'Main Service Centre'}</div>
                <div><b>Date Received:</b> {formatDate(job.jobDate || quoteDate)}</div>
                <div><b>Overall Status:</b> <span style={{ color: '#0284c7', fontWeight: 700 }}>{job.status || 'ESTIMATE READY'}</span></div>
                <div><b>Equipments Included:</b> {products.length} Unit(s)</div>
              </div>
            </div>
          </div>

          {/* Intro text */}
          <div style={{ fontSize: '12.5px', color: '#334155', marginBottom: '16px', lineHeight: 1.5, fontStyle: 'italic' }}>
            {intro}
          </div>

          {/* Equipment & Features Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '20px' }}>
            <thead>
              <tr style={{ background: '#164f91', color: '#ffffff', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px', width: '35px', textAlign: 'center' }}>#</th>
                <th style={{ padding: '8px 10px' }}>Equipment / Make &amp; Model</th>
                <th style={{ padding: '8px 10px' }}>Features, Diagnostics &amp; Scope of Work</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', width: '50px' }}>Qty</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', width: '110px' }}>Estimate Rate</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', width: '110px' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, idx) => {
                const qty = Number(p.qty || 1);
                const rate = Number(p.repairEstimate || 0);
                const lineTotal = qty * rate;
                return (
                  <tr key={p.id || idx} style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '10px 8px', textAlign: 'center', verticalAlign: 'top', color: '#64748b' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>
                      <b style={{ color: '#0f172a', display: 'block', fontSize: '12.5px' }}>{p.productName || 'Equipment'}</b>
                      {p.makeModel && <span style={{ color: '#475569', fontSize: '11.5px', display: 'block' }}>Model: {p.makeModel}</span>}
                      {p.serialNo && <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>S/N: {p.serialNo}</span>}
                    </td>
                    <td style={{ padding: '10px 8px', verticalAlign: 'top', color: '#334155' }}>
                      {p.repairWork && <div style={{ fontWeight: 600 }}>{p.repairWork}</div>}
                      {p.complaint && <div style={{ color: '#64748b', fontSize: '11.5px' }}>Reported issue: {p.complaint}</div>}
                      {p.repairCategory && (
                        <div style={{ fontSize: '10.5px', color: '#0284c7', marginTop: '2px' }}>
                          Category: {p.repairCategory === 'MINIMUM_30' ? 'Min 30% Benchmark' : 'Max 50% Benchmark'}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', verticalAlign: 'top' }}>
                      {qty}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', verticalAlign: 'top' }}>
                      {formatMoney(rate)}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', verticalAlign: 'top', fontWeight: 700, color: '#0f172a' }}>
                      {formatMoney(lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pricing Totals */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div style={{ maxWidth: '420px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                AMOUNT IN WORDS:
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#164f91', background: '#f8fafc', padding: '8px 12px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                {amountInWords}
              </div>

              {job.notes && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    SERVICE &amp; INSPECTION NOTES:
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
                    {job.notes}
                  </div>
                </div>
              )}
            </div>

            <div style={{ width: '320px', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', borderBottom: '1px solid #e2e8f0', fontSize: '12px' }}>
                <span>Subtotal:</span>
                <b>{formatMoney(subtotal)}</b>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', borderBottom: '1px solid #e2e8f0', fontSize: '12px', color: '#dc2626' }}>
                  <span>Discount:</span>
                  <b>-{formatMoney(discount)}</b>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', borderBottom: '1px solid #e2e8f0', fontSize: '12px' }}>
                <span>Taxable Value:</span>
                <b>{formatMoney(taxableAmount)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', borderBottom: '2px solid #164f91', fontSize: '12px' }}>
                <span>GST ({taxRate}%):</span>
                <b>{formatMoney(taxAmount)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: '#f1f5f9', fontSize: '14px', fontWeight: 800, color: '#164f91' }}>
                <span>GRAND TOTAL:</span>
                <span>{formatMoney(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
              TERMS &amp; CONDITIONS:
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              {terms}
            </div>
          </div>

          {/* Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '36px', paddingTop: '16px' }}>
            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px', fontSize: '11.5px', color: '#475569', fontWeight: 600 }}>
                Customer Confirmation &amp; Stamp
              </div>
            </div>

            <div style={{ textAlign: 'center', width: '220px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#164f91', marginBottom: '35px' }}>
                For NUNES INSTRUMENTATION
              </div>
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px', fontSize: '11.5px', color: '#475569', fontWeight: 600 }}>
                Authorized Technical Signatory
              </div>
            </div>
          </div>
        </article>

      </div>
    </div>
  );
}
