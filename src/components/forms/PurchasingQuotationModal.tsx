'use client';

import React, { useState, useMemo } from 'react';
import { 
  Printer, X, MessageCircle, Mail, Check, Copy, 
  Save, Send, FileCheck
} from 'lucide-react';
import type { PurchasingOrder, MarketingItem } from '@/types/purchasing-order';
import { syncFormToCloud } from '@/lib/sync';
import { cleanNumberString, parseCleanNumber } from '@/lib/utils';

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
    order.special_terms || '1. Prices are valid for 15 days.\n2. Delivery as per schedule.\n3. Standard 18% GST as applicable.\n4. Payment terms as agreed.'
  );

  const [copied, setCopied] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

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

  const formattedPhone = cleanPhone(recipientPhone);

  const whatsappWebUrl = useMemo(() => {
    return `https://web.whatsapp.com/send?phone=${encodeURIComponent(formattedPhone)}&text=${encodeURIComponent(whatsappMessage)}`;
  }, [formattedPhone, whatsappMessage]);

  const whatsappDirectUrl = useMemo(() => {
    return `https://api.whatsapp.com/send?phone=${encodeURIComponent(formattedPhone)}&text=${encodeURIComponent(whatsappMessage)}`;
  }, [formattedPhone, whatsappMessage]);

  const gmailWebUrl = useMemo(() => {
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(whatsappMessage)}`;
  }, [recipientEmail, subject, whatsappMessage]);

  const mailtoUrl = useMemo(() => {
    return `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(whatsappMessage)}`;
  }, [recipientEmail, subject, whatsappMessage]);

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
                READY
              </span>
              <b style={{ fontSize: '15px' }}>Commercial Quotation &amp; Dispatcher</b>
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Quotation ready for {customerName} ({orderId}). Send via WhatsApp Web or Gmail with 1 click.
            </span>
          </div>

          <div className="paperPreviewActions" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginLeft: 'auto' }}>
            <button
              type="button"
              className="btn"
              onClick={handleWhatsAppClick}
              style={{ background: '#25D366', color: '#fff', borderColor: '#25D366', fontWeight: 600 }}
              title="Open WhatsApp Web with pre-filled message"
            >
              <MessageCircle size={16} /> WhatsApp Web
            </button>

            <button
              type="button"
              className="btn"
              onClick={handleGmailClick}
              style={{ background: '#EA4335', color: '#fff', borderColor: '#EA4335', fontWeight: 600 }}
              title="Open Gmail Composer with pre-filled message"
            >
              <Mail size={16} /> Send via Gmail
            </button>

            <button
              type="button"
              className="btn primary"
              onClick={() => window.print()}
              title="Print official quotation or save as PDF"
            >
              <Printer size={16} /> Print / PDF
            </button>

            <button
              type="button"
              className="btn"
              onClick={handleCopy}
              title="Copy formatted quotation message to clipboard"
            >
              {copied ? <Check size={16} style={{ color: '#10b981' }} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Text'}
            </button>

            <button
              type="button"
              className="btn"
              onClick={saveQuotationSnapshot}
              disabled={saving}
              title="Save a snapshot of this quotation"
            >
              <Save size={16} />
              {savedSuccess ? 'Saved!' : 'Save Quote'}
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
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                WhatsApp Phone Number:
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={recipientPhone}
                  onChange={e => setRecipientPhone(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
                <a
                  href={whatsappDirectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn mini-btn"
                  style={{ background: '#22c55e', color: '#fff', borderColor: '#22c55e', whiteSpace: 'nowrap' }}
                >
                  <Send size={13} /> Mobile
                </a>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Customer Email Address:
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="email"
                  placeholder="customer@domain.com"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
                <a
                  href={mailtoUrl}
                  className="btn mini-btn"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Mail size={13} /> Mailto
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* PRINTABLE QUOTATION SHEET */}
        <article 
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
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '8px', 
                  background: 'linear-gradient(135deg, #1d4ed8, #0284c7)', 
                  display: 'grid', 
                  placeItems: 'center',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '20px',
                  fontFamily: 'sans-serif'
                }}>
                  N
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#164f91', letterSpacing: '1px', lineHeight: 1.1 }}>
                    NUNES INSTRUMENTATION
                  </h1>
                  <span style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Manufacturing, Testing, Supply &amp; Order Solutions
                  </span>
                </div>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>
                Office / Works: Head Office: Kolkata &amp; Branches: Chennai, Mumbai, Delhi<br/>
                Email: sales@nunesinstruments.com | Web: https://nunes-operations-v44.vercel.app
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
                SALES QUOTATION
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                <div><b>Quote Ref:</b> <span style={{ color: '#0f172a', fontWeight: 700 }}>{reference}</span></div>
                <div><b>Date:</b> {formatDate(quoteDate)}</div>
                <div><b>Order Ref:</b> {orderId}</div>
                {validUntil && <div><b>Valid Until:</b> {formatDate(validUntil)}</div>}
              </div>
            </div>
          </div>

          {/* Customer & Order Box */}
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
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                {recipientPhone && <span><b>Phone:</b> {recipientPhone} &nbsp;|&nbsp; </span>}
                {recipientEmail && <span><b>Email:</b> {recipientEmail}</span>}
              </div>
            </div>

            <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '16px' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                COMMERCIAL DETAILS:
              </div>
              <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.6 }}>
                <div><b>Branch:</b> {order.branch || 'Main Commercial Office'}</div>
                <div><b>Current Status:</b> <span style={{ color: '#0284c7', fontWeight: 700 }}>{order.current_status || 'Quotation'}</span></div>
                <div><b>Items Count:</b> {items.length} Product(s)</div>
              </div>
            </div>
          </div>

          {/* Intro */}
          <div style={{ fontSize: '12.5px', color: '#334155', marginBottom: '16px', lineHeight: 1.5, fontStyle: 'italic' }}>
            {intro}
          </div>

          {/* Products Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '20px' }}>
            <thead>
              <tr style={{ background: '#164f91', color: '#ffffff', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px', width: '35px', textAlign: 'center' }}>#</th>
                <th style={{ padding: '8px 10px' }}>Product &amp; Specification</th>
                <th style={{ padding: '8px 10px' }}>Model / Remarks</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', width: '50px' }}>Qty</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', width: '110px' }}>Unit Rate</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', width: '110px' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const qty = Number(item.qty || 1);
                const rate = Number(item.item_value || 0);
                const lineTotal = qty * rate;
                return (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '10px 8px', textAlign: 'center', verticalAlign: 'top', color: '#64748b' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>
                      <b style={{ color: '#0f172a', display: 'block', fontSize: '12.5px' }}>{item.item_name || 'Item'}</b>
                    </td>
                    <td style={{ padding: '10px 8px', verticalAlign: 'top', color: '#334155' }}>
                      {item.model && <div>Model: {item.model}</div>}
                      {Boolean(item.add_charge) && <div style={{ color: '#64748b', fontSize: '11px' }}>Addl charge: {formatMoney(item.add_charge)}</div>}
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
                Customer Acceptance
              </div>
            </div>

            <div style={{ textAlign: 'center', width: '220px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#164f91', marginBottom: '35px' }}>
                For NUNES INSTRUMENTATION
              </div>
              <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px', fontSize: '11.5px', color: '#475569', fontWeight: 600 }}>
                Authorized Commercial Signatory
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
