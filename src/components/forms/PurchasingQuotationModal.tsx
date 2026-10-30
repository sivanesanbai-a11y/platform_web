'use client';

import React, { useState, useMemo } from 'react';
import { 
  Printer, X, MessageCircle, Mail, Check, Copy, 
  Save, Send, FileCheck, Download, FileDown, Image as ImageIcon, Sparkles, AlertCircle, ExternalLink, Plus
} from 'lucide-react';
import { exportElementToPdf, triggerFileDownload, copyElementAsImage, sharePdfFile } from '@/lib/pdf-service';
import { cleanNumberString, parseCleanNumber, copyToClipboard } from '@/lib/utils';
import { syncFormToCloud } from '@/lib/sync';
import type { PurchasingOrder, MarketingItem } from '@/types/purchasing-order';

export interface PurchasingQuotationModalProps {
  order: Partial<PurchasingOrder> & {
    id?: string | number;
    order_id?: string;
    customer_name?: string;
    quote_no?: string;
    quote_date?: string;
    phone?: string;
    email?: string;
    branch?: string;
    marketing_items?: MarketingItem[];
    total_order_value?: number;
    payment_terms?: string;
    special_terms?: string;
  };
  onClose: () => void;
  onSaved?: () => void;
  onStartNewOrder?: () => void;
}

function cleanPhone(raw: string): string {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }
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

export default function PurchasingQuotationModal({ order, onClose, onSaved, onStartNewOrder }: PurchasingQuotationModalProps) {
  const orderId = order.order_id || order.id || 'NM-TEMP';
  const customerName = order.customer_name || 'Valued Customer';
  const initialPhone = order.phone || '';
  const initialEmail = order.email || '';

  const [reference, setReference] = useState(order.quote_no || `QTE-${orderId}`);
  const [quoteDate, setQuoteDate] = useState(order.quote_date || new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState(getFutureDate(15));
  const [taxRate, setTaxRate] = useState<number>(18);
  const [discount, setDiscount] = useState<number>(0);
  const [recipientPhone, setRecipientPhone] = useState(initialPhone);
  const [recipientEmail, setRecipientEmail] = useState(initialEmail);
  const [intro, setIntro] = useState(
    'Thank you for your enquiry with NUNES Instrumentation. Please find our commercial quotation below based on your requested specifications.'
  );
  const [terms, setTerms] = useState(
    order.special_terms || '1. Prices are Ex-Works, Coimbatore.\n2. Delivery as per schedule from Coimbatore Works.\n3. Standard 18% GST as applicable.\n4. Payment terms as agreed.'
  );

  const [copied, setCopied] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfNotice, setPdfNotice] = useState<{ title: string; desc: string; type: 'whatsapp' | 'email' | 'download' } | null>(null);

  const items: MarketingItem[] = (order.marketing_items && order.marketing_items.length > 0)
    ? order.marketing_items
    : [{
        id: '1',
        item_name: 'Instrumentation Product',
        model: 'Standard',
        qty: 1,
        item_value: Number(order.total_order_value || 5000),
        add_charge: 0
      }];

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.qty || 1) * Number(item.item_value || 0)), 0);
  }, [items]);

  const taxableAmount = Math.max(0, subtotal - discount);
  const taxAmount = (taxableAmount * taxRate) / 100;
  const grandTotal = taxableAmount + taxAmount;
  const amountInWords = numberToWordsINR(grandTotal);

  const subject = `Sales Quotation ${reference} | Order ${orderId} - NUNES Instrumentation`;

  const quoteLinesWhatsApp = useMemo(() => {
    return items.map((item, i) => {
      const name = item.item_name || 'Item';
      const model = item.model ? ` (${item.model})` : '';
      const totalLine = Number(item.qty || 1) * Number(item.item_value || 0);
      return `${i + 1}. *${name}*${model}\n   *Qty:* ${item.qty || 1}  |  *Rate:* ${formatMoney(item.item_value || 0)}  |  *Amount:* ${formatMoney(totalLine)}`;
    }).join('\n\n');
  }, [items]);

  const whatsappMessage = useMemo(() => {
    return `*NUNES INSTRUMENTATION & OPERATIONS*
*SALES & ORDER QUOTATION*
---------------------------------------
*Quotation Ref:* ${reference}
*Order Ref:* ${orderId}
*Date:* ${formatDate(quoteDate)}
${validUntil ? `*Valid Until:* ${formatDate(validUntil)}\n` : ''}
*Customer:* ${customerName}
${intro}

*PRODUCTS & SPECIFICATIONS:*
${quoteLinesWhatsApp}

---------------------------------------
*Subtotal:* ${formatMoney(subtotal)}
${discount > 0 ? `*Discount:* -${formatMoney(discount)}\n` : ''}*Taxable Value:* ${formatMoney(taxableAmount)}
*GST (${taxRate}%):* ${formatMoney(taxAmount)}
*GRAND TOTAL:* ${formatMoney(grandTotal)}
_(${amountInWords})_
---------------------------------------

*Terms & Conditions:*
${terms}

Please confirm acceptance to proceed.

Regards,
*NUNES Instrumentation Team*`;
  }, [
    reference, orderId, quoteDate, validUntil, customerName,
    intro, quoteLinesWhatsApp, subtotal, discount, taxableAmount, taxRate,
    taxAmount, grandTotal, amountInWords, terms
  ]);

  const emailBody = useMemo(() => {
    return `Dear ${customerName},\n\n${intro}\n\nPlease find attached our official sales & commercial quotation in exact PDF format for your review and approval.\n\nQuotation Reference: ${reference}\nOrder Reference: ${orderId}\nDate: ${formatDate(quoteDate)}\n${validUntil ? 'Valid Until: ' + formatDate(validUntil) + '\n' : ''}\nSubtotal: ${formatMoney(subtotal)}\nDiscount: ${formatMoney(discount)}\nGST (${taxRate}%): ${formatMoney(taxAmount)}\nGrand Total: ${formatMoney(grandTotal)}\n(${amountInWords})\n\nKindly refer to the attached PDF for complete itemized specifications, line rates, and commercial terms.\n\nPlease confirm acceptance to proceed.\n\nRegards,\nNUNES Instrumentation Commercial Sales Team`;
  }, [customerName, intro, reference, orderId, quoteDate, validUntil, subtotal, discount, taxRate, taxAmount, grandTotal, amountInWords]);

  const formattedPhone = cleanPhone(recipientPhone);

  const whatsappWebUrl = useMemo(() => {
    return formattedPhone ? `https://web.whatsapp.com/send?phone=${encodeURIComponent(formattedPhone)}` : 'https://web.whatsapp.com';
  }, [formattedPhone]);

  const whatsappDirectUrl = useMemo(() => {
    return formattedPhone ? `https://api.whatsapp.com/send?phone=${encodeURIComponent(formattedPhone)}` : 'https://api.whatsapp.com';
  }, [formattedPhone]);

  const gmailWebUrl = useMemo(() => {
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
  }, [recipientEmail, subject, emailBody]);

  const mailtoUrl = useMemo(() => {
    return `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
  }, [recipientEmail, subject, emailBody]);

  function handleCopy() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  function handleWhatsAppClick() {
    window.open(whatsappWebUrl, '_blank', 'noopener,noreferrer');
  }

  function handleGmailClick() {
    window.open(gmailWebUrl, '_blank', 'noopener,noreferrer');
  }

  // Helper: Export and download exact PDF
  async function handleDownloadPdf() {
    const el = document.getElementById('purchasing-quotation-sheet');
    if (!el) return;
    setGeneratingPdf(true);
    try {
      const pdfFileName = `NUNES-Purchasing-Quotation-${reference}.pdf`;
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
    const el = document.getElementById('purchasing-quotation-sheet');
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

  // 1-Click WhatsApp with Exact PDF Generation + Automatic Phone Number Copy to Clipboard
  async function handleWhatsAppWithPdf() {
    const phoneToCopy = recipientPhone.trim() || (formattedPhone ? `+${formattedPhone}` : '');
    if (phoneToCopy) {
      await copyToClipboard(phoneToCopy);
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 5000);
    }

    const el = document.getElementById('purchasing-quotation-sheet');
    if (!el) {
      window.open(whatsappWebUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setGeneratingPdf(true);
    const pdfFileName = `NUNES-Purchasing-Quotation-${reference}.pdf`;
    try {
      const res = await exportElementToPdf(el, pdfFileName);
      const shared = await sharePdfFile(res.file, phoneToCopy);
      if (!shared) {
        triggerFileDownload(res.blob, pdfFileName);
        window.open(whatsappWebUrl, '_blank', 'noopener,noreferrer');
        setPdfNotice({
          title: 'Quotation PDF Ready for WhatsApp',
          desc: `"${pdfFileName}" has been downloaded. Phone number (${phoneToCopy}) copied! Attach this PDF in WhatsApp chat.`,
          type: 'whatsapp'
        });
      } else {
        setPdfNotice({
          title: `Phone Number Copied: ${phoneToCopy}`,
          desc: `In WhatsApp Desktop "Send message to" search bar, just press Ctrl+V (Paste) to select this contact immediately! The quotation PDF is attached.`,
          type: 'whatsapp'
        });
      }
      saveQuotationSnapshot();
    } catch (err) {
      console.error(err);
      window.open(whatsappWebUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setGeneratingPdf(false);
    }
  }

  // 1-Click Email with Exact PDF Attached via System Mail / Outlook
  async function handleEmailWithPdf() {
    const el = document.getElementById('purchasing-quotation-sheet');
    if (!el) {
      window.open(mailtoUrl, '_blank');
      return;
    }

    setGeneratingPdf(true);
    const pdfFileName = `NUNES-Purchasing-Quotation-${reference}.pdf`;
    try {
      const res = await exportElementToPdf(el, pdfFileName);
      const shared = await sharePdfFile(res.file, emailBody, subject);
      if (shared) {
        saveQuotationSnapshot();
        setPdfNotice({
          title: 'Quotation PDF Attached to Email Draft',
          desc: `"${pdfFileName}" has been attached directly to your email draft with recipient, subject, and quotation details pre-filled.`,
          type: 'email'
        });
      } else {
        await handleGmailWithPdf();
      }
    } catch (err) {
      console.error(err);
      window.open(gmailWebUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setGeneratingPdf(false);
    }
  }

  // 1-Click Gmail with Exact PDF Generation (Downloads PDF + Copies visual card + Pre-fills full body)
  async function handleGmailWithPdf() {
    const el = document.getElementById('purchasing-quotation-sheet');
    if (!el) {
      window.open(gmailWebUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setGeneratingPdf(true);
    const pdfFileName = `NUNES-Purchasing-Quotation-${reference}.pdf`;
    try {
      const res = await exportElementToPdf(el, pdfFileName);
      triggerFileDownload(res.blob, pdfFileName);
      await copyElementAsImage(el);
      saveQuotationSnapshot();
      window.open(gmailWebUrl, '_blank', 'noopener,noreferrer');
      setPdfNotice({
        title: 'Quotation PDF Ready for Gmail',
        desc: `"${pdfFileName}" downloaded. Email body pre-filled in Gmail! Drag the PDF from Chrome's download icon (↓) into Gmail compose to attach, or press Ctrl+V to paste the card.`,
        type: 'email'
      });
    } catch (err) {
      console.error(err);
      window.open(gmailWebUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setGeneratingPdf(false);
    }
  }


  function saveQuotationSnapshot() {
    setSaving(true);
    try {
      const snapshot = {
        id: `PQ-${Date.now()}`,
        orderId: order.id || orderId,
        reference,
        quoteDate,
        validUntil,
        customerName,
        customerPhone: recipientPhone,
        customerEmail: recipientEmail,
        subtotal,
        discount,
        taxRate,
        taxAmount,
        grandTotal,
        items,
        savedAt: new Date().toISOString()
      };

      // 1. Purchasing quotations cache
      const raw = localStorage.getItem('nunes:purchasing_quotations');
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(snapshot);
      localStorage.setItem('nunes:purchasing_quotations', JSON.stringify(list.slice(0, 100)));

      // 2. Unified Quotations Registry (powers /quotations, /customers, and backups)
      const unifiedQuote = {
        id: `qt-${Date.now()}`,
        quotation_no: reference,
        customer_name: customerName,
        customer_phone: recipientPhone || '+91 98421 00000',
        customer_city: 'Coimbatore',
        item_description: (items || []).map((it: any) => it.itemName || it.item_name || it.description).filter(Boolean).join(', ') || 'Commercial Procurement Supply',
        scope_type: 'Procurement',
        amount: Math.max(0, subtotal - discount),
        gst_amount: taxAmount,
        total_amount: grandTotal,
        status: 'SENT',
        sent_at: new Date().toISOString(),
        valid_until: validUntil || new Date(Date.now() + 86400000 * 30).toISOString(),
        notes: `PO Reference: ${orderId}`
      };
      const qRaw = localStorage.getItem('nunes:quotations');
      const qList = qRaw ? JSON.parse(qRaw) : [];
      const filteredQ = qList.filter((x: any) => x.quotation_no !== reference);
      localStorage.setItem('nunes:quotations', JSON.stringify([unifiedQuote, ...filteredQ]));

      // 3. Automatic Cloud & Instruasia Webhook synchronization
      void syncFormToCloud('quotation', reference, customerName, snapshot);

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
    <div className="paperPreviewOverlay" role="dialog" aria-modal="true" aria-label="Purchasing Quotation Generator">
      <div className="paperPreviewShell" style={{ maxWidth: '1060px' }}>
        
        {/* TOP TOOLBAR */}
        <div className="paperPreviewToolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#059669', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                PDF ENGINE READY
              </span>
              <b style={{ fontSize: '15px' }}>Commercial Quotation (Exact PDF Format)</b>
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Official PDF format with NUNES logo, itemized specifications and GST. Ready to dispatch via WhatsApp Web and Gmail.
            </span>
          </div>

          <div className="paperPreviewActions" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginLeft: 'auto' }}>
            <button
              type="button"
              className="btn btn-whatsapp-action"
              onClick={handleWhatsAppWithPdf}
              disabled={generatingPdf}
              title="Generate and send exact quotation PDF via WhatsApp"
            >
              <MessageCircle size={16} />
              <span>{generatingPdf ? 'Generating PDF...' : 'Send PDF via WhatsApp'}</span>
            </button>

            <button
              type="button"
              className="btn btn-gmail-action"
              onClick={handleEmailWithPdf}
              disabled={generatingPdf}
              title="Attach PDF directly to Email draft via system Mail / Outlook"
            >
              <Mail size={16} />
              <span>{generatingPdf ? 'Generating PDF...' : 'Send PDF via Email (Attached)'}</span>
            </button>

            <button
              type="button"
              className="btn"
              onClick={handleGmailWithPdf}
              disabled={generatingPdf}
              style={{ background: '#EA4335', color: '#fff', borderColor: '#EA4335', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Open Gmail Web draft with pre-filled body, downloaded PDF & copied card"
            >
              <ExternalLink size={14} />
              <span>Gmail Web</span>
            </button>

            <button
              type="button"
              className="btn primary"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              title="Download exact official quotation PDF"
            >
              <FileDown size={16} />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => window.print()}
              title="Print official quotation or save as PDF"
            >
              <Printer size={16} />
              <span>Print</span>
            </button>

            <button
              type="button"
              className="btn btn-quotation-header"
              onClick={saveQuotationSnapshot}
              disabled={saving}
              title="Save a snapshot of this quotation"
            >
              <Save size={16} />
              {savedSuccess ? 'Saved!' : 'Save'}
            </button>

            {onStartNewOrder && (
              <button
                type="button"
                className="btn primary"
                onClick={onStartNewOrder}
                title="Complete current order and start next new order"
                style={{ background: '#059669', borderColor: '#059669', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Plus size={15} /> Start Next Order
              </button>
            )}

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

        {/* PDF / NOTICE BANNER */}
        {pdfNotice && (
          <div className="no-print" style={{
            background: pdfNotice.type === 'whatsapp' ? '#f0fdf4' : pdfNotice.type === 'email' ? '#fef2f2' : '#eff6ff',
            border: `1px solid ${pdfNotice.type === 'whatsapp' ? '#bbf7d0' : pdfNotice.type === 'email' ? '#fecaca' : '#bfdbfe'}`,
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <Sparkles size={20} style={{ color: pdfNotice.type === 'whatsapp' ? '#16a34a' : pdfNotice.type === 'email' ? '#dc2626' : '#2563eb', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <b style={{ display: 'block', fontSize: '13px', color: '#0f172a', marginBottom: '2px' }}>
                {pdfNotice.title}
              </b>
              <p style={{ margin: 0, fontSize: '12px', color: '#334155', lineHeight: 1.5 }}>
                {pdfNotice.desc}
              </p>
              {onStartNewOrder && (
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={onStartNewOrder}
                    style={{
                      background: '#059669',
                      borderColor: '#059669',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '5px 12px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={13} /> Complete &amp; Start Next Order (4s Fireworks)
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPdfNotice(null)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* SETTINGS (HIDDEN IN PRINT) */}
        <div className="no-print" style={{ 
          background: '#ffffff', 
          borderRadius: '12px', 
          padding: '16px', 
          marginBottom: '16px', 
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
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
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                GST Tax Rate (%):
              </label>
              <select
                value={taxRate}
                onChange={e => setTaxRate(Number(e.target.value))}
                style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}
              >
                <option value={0}>0% (Tax Exempt)</option>
                <option value={5}>5% GST</option>
                <option value={12}>12% GST</option>
                <option value={18}>18% GST (Standard)</option>
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
          </div>
        </div>

        {/* PRINTABLE QUOTATION SHEET */}
        <article 
          id="purchasing-quotation-sheet"
          className="paperJobCard quotationSheet" 
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', 
            background: '#ffffff',
            boxShadow: '0 10px 35px rgba(0,0,0,0.08)',
            padding: '36px 42px',
            maxWidth: '850px',
            margin: '0 auto',
            color: '#1e293b',
            position: 'relative',
            borderRadius: '4px'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #0f2e5a', paddingBottom: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '42px', 
                  height: '42px', 
                  borderRadius: '10px', 
                  background: 'linear-gradient(135deg, #0f2e5a 0%, #1e40af 100%)', 
                  display: 'grid', 
                  placeItems: 'center',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '24px',
                  boxShadow: '0 4px 10px rgba(15, 46, 90, 0.25)'
                }}>
                  N
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f2e5a', letterSpacing: '0.8px', lineHeight: 1.1 }}>
                    NUNES INSTRUMENTS
                  </h1>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Manufacturing, Testing, Supply &amp; Order Solutions
                  </span>
                </div>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>
                Head Office &amp; Works: Coimbatore, Tamil Nadu - 641027, India<br/>
                Email: sales@nunesinstruments.com
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                background: '#0f2e5a', 
                color: '#ffffff', 
                padding: '6px 14px', 
                borderRadius: '6px', 
                display: 'inline-block',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '0.8px',
                textTransform: 'uppercase'
              }}>
                Commercial Sales Quotation
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', lineHeight: 1.6, color: '#334155' }}>
                <div><b>Quote Ref:</b> <span style={{ color: '#0f2e5a', fontWeight: 800 }}>{reference}</span></div>
                <div><b>Date:</b> {formatDate(quoteDate)}</div>
                <div><b>Order Ref:</b> {orderId}</div>
                {validUntil && <div><b>Valid Until:</b> {formatDate(validUntil)}</div>}
              </div>
            </div>
          </div>

          {/* Customer & Order Box */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1.25fr 0.75fr', 
            gap: '16px', 
            background: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px', 
            padding: '12px 16px',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
                QUOTATION ISSUED TO:
              </div>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>
                {customerName}
              </div>
              <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '3px' }}>
                {recipientPhone && <span><b>Phone:</b> {recipientPhone} &nbsp;|&nbsp; </span>}
                {recipientEmail && <span><b>Email:</b> {recipientEmail}</span>}
              </div>
            </div>

            <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '16px' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
                COMMERCIAL DETAILS:
              </div>
              <div style={{ fontSize: '11.5px', color: '#334155', lineHeight: 1.55 }}>
                <div><b>Location / Works:</b> Coimbatore, Tamil Nadu</div>
                <div><b>Branch:</b> {order.branch || 'Coimbatore'}</div>
                <div><b>Current Status:</b> <span style={{ color: '#0284c7', fontWeight: 700 }}>{order.current_status || 'Quotation'}</span></div>
                <div><b>Items Count:</b> {items.length} Product(s)</div>
              </div>
            </div>
          </div>

          {/* Intro */}
          {intro && (
            <div style={{ fontSize: '12px', color: '#475569', marginBottom: '14px', lineHeight: 1.5, fontStyle: 'italic' }}>
              {intro}
            </div>
          )}

          {/* Products Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '16px', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#0f2e5a', color: '#ffffff', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px', width: '35px', textAlign: 'center', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>#</th>
                <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>Product &amp; Specification</th>
                <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>Model / Remarks</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', width: '50px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>Qty</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', width: '110px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>Unit Rate</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', width: '110px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const qty = Number(item.qty || 1);
                const rate = Number(item.item_value || 0);
                const lineTotal = qty * rate;
                return (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '8px', textAlign: 'center', verticalAlign: 'top', color: '#64748b' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '8px', verticalAlign: 'top' }}>
                      <b style={{ color: '#0f2e5a', display: 'block', fontSize: '13px', fontWeight: 800 }}>{item.item_name || 'Item'}</b>
                    </td>
                    <td style={{ padding: '8px', verticalAlign: 'top', color: '#334155', fontSize: '11.5px' }}>
                      {item.model && <div style={{ color: '#1e40af', fontWeight: 650, fontSize: '11.5px' }}>Model: {item.model}</div>}
                      {Boolean(item.add_charge) && <div style={{ color: '#64748b', fontSize: '10.5px' }}>Addl charge: {formatMoney(item.add_charge)}</div>}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center', verticalAlign: 'top' }}>
                      {qty}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', verticalAlign: 'top' }}>
                      {formatMoney(rate)}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', verticalAlign: 'top', fontWeight: 700, color: '#0f172a' }}>
                      {formatMoney(lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pricing Totals */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
                AMOUNT IN WORDS:
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f2e5a', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', lineHeight: 1.4 }}>
                {amountInWords}
              </div>
            </div>

            <div style={{ width: '310px', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontSize: '11.5px' }}>
                <span>Subtotal:</span>
                <b>{formatMoney(subtotal)}</b>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontSize: '11.5px', color: '#dc2626' }}>
                  <span>Discount:</span>
                  <b>-{formatMoney(discount)}</b>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #e2e8f0', fontSize: '11.5px' }}>
                <span>Taxable Value:</span>
                <b>{formatMoney(taxableAmount)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '2px solid #0f2e5a', fontSize: '11.5px' }}>
                <span>GST ({taxRate}%):</span>
                <b>{formatMoney(taxAmount)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0f2e5a', color: '#ffffff', fontSize: '13.5px', fontWeight: 800 }}>
                <span>GRAND TOTAL:</span>
                <span>{formatMoney(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Signatures & Authorization */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '10px' }}>
            <div style={{ textAlign: 'center', width: '240px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f2e5a', marginBottom: '38px', letterSpacing: '0.5px' }}>
                For NUNES INSTRUMENTS, Coimbatore
              </div>
              <div style={{ borderTop: '1.5px solid #0f2e5a', paddingTop: '6px', fontSize: '11.5px', color: '#334155', fontWeight: 700 }}>
                Authorized Commercial Signatory
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
