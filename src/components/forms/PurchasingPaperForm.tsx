'use client';

import { Printer, X, FileCheck } from 'lucide-react';
import type { PurchasingOrder } from '@/types/purchasing-order';

function text(value: unknown) {
  const s = String(value ?? '').trim();
  return s || '\u00a0';
}

function money(n: number) {
  return Number(n || 0).toFixed(2);
}

export default function PurchasingPaperForm({ 
  order, 
  onClose, 
  onOpenQuotation 
}: { 
  order: PurchasingOrder; 
  onClose: () => void; 
  onOpenQuotation?: () => void;
}) {
  const marketingRows = Array.from({ length: 3 }, (_, i) => order.marketing_items[i]);
  const paymentRows = Array.from({ length: 3 }, (_, i) => order.customer_payments[i]);
  const supplierRows = Array.from({ length: 3 }, (_, i) => order.supplier_rows[i]);
  const accountsRows = Array.from({ length: 3 }, (_, i) => order.accounts_items[i]);
  const supplierPaymentRows = Array.from({ length: 3 }, (_, i) => order.supplier_payments[i]);

  const totalReceived = order.customer_payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const balance = Math.max(0, Number(order.total_order_value || 0) - totalReceived);
  const supplierPaid = order.supplier_payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const supplierBal = Math.max(0, Number(order.bill_amount || 0) - supplierPaid);

  return (
    <div className="paperPreviewOverlay" role="dialog" aria-modal="true" aria-label="Purchasing Paper Form Preview">
      <div className="paperPreviewShell">
        <div className="paperPreviewToolbar">
          <div>
            <b>Official Purchasing Paper Form (2 Pages)</b>
            <span>Identical layout to the NUNES INSTRUMENTS physical pre-printed office order sheet.</span>
          </div>
          <div className="paperPreviewActions">
            {onOpenQuotation && (
              <button 
                type="button" 
                className="btn btn-quotation-header" 
                onClick={() => { onClose(); onOpenQuotation(); }}
                title="Generate Commercial Quotation with WhatsApp & Gmail"
              >
                <FileCheck size={16}/> Commercial Quotation
              </button>
            )}
            <button type="button" className="btn primary" onClick={() => window.print()}><Printer size={16}/> Print / PDF</button>
            <button type="button" className="btn" title="Back to form" onClick={onClose}><X size={18}/> Close</button>
          </div>
        </div>

        <div className="paperPreviewSummary" aria-label="Purchasing tracking summary" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          <div><span>Order No</span><b>{order.order_id || order.id}</b></div>
          <div><span>Customer</span><b>{order.customer_name || '—'}</b></div>
          <div><span>Products / Items</span><b style={{ color: '#0f2e5a' }}>{order.marketing_items.map(m => m.item_name).filter(Boolean).join(', ') || '—'}</b></div>
          <div><span>Total Order Value</span><b>₹ {Number(order.total_order_value || 0).toFixed(2)}</b></div>
          <div><span>Status</span><b>{order.current_status || 'Marketing'}</b></div>
        </div>

        {/* PAGE 1 */}
        <section className="nunes-paper-page">
          <div className="nunes-paper-border" />
          <div className="nunes-company-title">NUNES INSTRUMENTS / INSTRUMENTATION</div>
          <div className="nunes-paper-serial">Order #{order.order_id || order.id}</div>
          
          <div className="nunes-blue-header" style={{ top: '24mm', left: '16mm', width: '75mm' }}>Marketing Details</div>

          <div className="nunes-field-row" style={{ top: '38mm', left: '16mm', right: '16mm' }}>
            <div style={{ flex: '0 0 25%' }}><b>Quote No:</b> <span>{text(order.quote_no)}</span></div>
            <div style={{ flex: '0 0 20%' }}><b>Dt:</b> <span>{text(order.quote_date)}</span></div>
            <div style={{ flex: '0 0 30%' }}><b>MKT Person:</b> <span>{text(order.marketing_person)}</span></div>
            <div style={{ flex: '1' }}><b>Delivery:</b> <span>{text(order.delivery_period)}</span></div>
          </div>

          <div className="nunes-field-row" style={{ top: '48mm', left: '16mm', right: '16mm' }}>
            <div style={{ flex: '0 0 45%' }}><b>Customer Name:</b> <span>{text(order.customer_name)}</span></div>
            <div style={{ flex: '0 0 25%' }}><b>Place:</b> <span>{text(order.place)}</span></div>
            <div style={{ flex: '1' }}><b>Terms:</b> <span>{text(order.terms)}</span></div>
          </div>

          <table className="nunes-sheet-table" style={{ top: '58mm', left: '16mm', width: '178mm' }}>
            <thead>
              <tr>
                <th style={{ width: '8%' }}>Sl.No</th>
                <th style={{ width: '40%' }}>Item Name</th>
                <th style={{ width: '18%' }}>Model</th>
                <th style={{ width: '10%' }}>Qty</th>
                <th style={{ width: '12%' }}>Item Value</th>
                <th style={{ width: '12%' }}>Add. Charge</th>
              </tr>
            </thead>
            <tbody>
              {marketingRows.map((r, i) => (
                <tr key={r?.id || i} style={{ height: '9mm' }}>
                  <td style={{ textAlign: 'center' }}>{i + 1}.</td>
                  <td>{r?.item_name || '\u00a0'}</td>
                  <td>{r?.model || '\u00a0'}</td>
                  <td style={{ textAlign: 'center' }}>{r?.qty ?? '\u00a0'}</td>
                  <td style={{ textAlign: 'right' }}>{r ? money(r.item_value) : '\u00a0'}</td>
                  <td style={{ textAlign: 'right' }}>{r ? money(r.add_charge) : '\u00a0'}</td>
                </tr>
              ))}
              <tr style={{ height: '8mm', fontWeight: 'bold', background: '#f5f7fb' }}>
                <td colSpan={4} style={{ textAlign: 'center' }}>Total Order Value</td>
                <td colSpan={2} style={{ textAlign: 'right' }}>₹ {money(order.total_order_value)}</td>
              </tr>
            </tbody>
          </table>

          <div className="nunes-service-strip" style={{ top: '106mm', left: '16mm', width: '178mm' }}>
            <span>Demo: <b className="paperCheck">{order.service_demo ? '✓' : ''}</b></span>
            <span>Installation: <b className="paperCheck">{order.service_installation ? '✓' : ''}</b></span>
            <span>Calibration: <b className="paperCheck">{order.service_calibration ? '✓' : ''}</b></span>
            <span>Ser. Person: <u>{text(order.service_person)}</u></span>
            <span>Dt: <u>{text(order.service_date)}</u></span>
            <span>Amount: <u>₹ {money(order.service_amount)}</u></span>
          </div>

          <div className="nunes-two-col" style={{ top: '118mm', left: '16mm', width: '178mm' }}>
            <div style={{ flex: '1', paddingRight: '6mm' }}>
              <div className="nunes-blue-header" style={{ position: 'static', width: '100%', marginBottom: '4mm' }}>Dispatch Details</div>
              <div className="nunes-mini-row"><b>Packing By:</b> <span>{text(order.packing_by)}</span></div>
              <div className="nunes-mini-row"><b>Dispatch On:</b> <span>{text(order.dispatch_on)}</span></div>
              <div className="nunes-mini-row"><b>Weight:</b> <span>{text(order.weight)}</span></div>
              <div className="nunes-mini-row"><b>Courier Mode:</b> <span>{text(order.courier_mode)}</span></div>
              <div className="nunes-mini-row"><b>Freight Amount:</b> <span>₹ {money(order.dispatch_amount)}</span></div>
              <div className="nunes-mini-row"><b>Sign:</b> <span>{text(order.dispatch_sign)}</span></div>
            </div>

            <div style={{ flex: '1', paddingLeft: '6mm' }}>
              <div className="nunes-blue-header" style={{ position: 'static', width: '100%', marginBottom: '4mm' }}>Payment Details</div>
              <table className="nunes-sheet-table" style={{ position: 'static', width: '100%' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Bank Mode</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentRows.map((r, i) => (
                    <tr key={r?.id || i} style={{ height: '8mm' }}>
                      <td>{r?.payment_date || '\u00a0'}</td>
                      <td>{r?.bank_mode || '\u00a0'}</td>
                      <td style={{ textAlign: 'right' }}>{r ? money(r.amount) : '\u00a0'}</td>
                    </tr>
                  ))}
                  <tr style={{ height: '7mm', fontWeight: 'bold' }}>
                    <td colSpan={2} style={{ textAlign: 'right' }}>Total Received:</td>
                    <td style={{ textAlign: 'right' }}>₹ {money(totalReceived)}</td>
                  </tr>
                  <tr style={{ height: '7mm', fontWeight: 'bold', color: '#1b4f9c' }}>
                    <td colSpan={2} style={{ textAlign: 'right' }}>Balance Due:</td>
                    <td style={{ textAlign: 'right' }}>₹ {money(balance)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="nunes-blue-header" style={{ top: '185mm', left: '16mm', width: '70mm' }}>Supplier Details</div>
          <table className="nunes-sheet-table" style={{ top: '196mm', left: '16mm', width: '178mm' }}>
            <thead>
              <tr>
                <th style={{ width: '8%' }}>Sl.No</th>
                <th style={{ width: '38%' }}>Supplier</th>
                <th style={{ width: '18%' }}>Model</th>
                <th style={{ width: '14%' }}>Net Value</th>
                <th style={{ width: '11%' }}>Terms</th>
                <th style={{ width: '11%' }}>Delivery</th>
              </tr>
            </thead>
            <tbody>
              {supplierRows.map((r, i) => (
                <tr key={r?.id || i} style={{ height: '8.5mm' }}>
                  <td style={{ textAlign: 'center' }}>{i + 1}.</td>
                  <td>{r?.supplier || '\u00a0'}</td>
                  <td>{r?.model || '\u00a0'}</td>
                  <td style={{ textAlign: 'right' }}>{r ? money(r.net_value) : '\u00a0'}</td>
                  <td>{r?.terms || '\u00a0'}</td>
                  <td>{r?.delivery_period || '\u00a0'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="nunes-orderline" style={{ top: '244mm', left: '16mm', right: '16mm' }}>
            ORDER PLACED TO: <u>{text(order.order_place_to)}</u>
          </div>

          <div className="nunes-sign-box" style={{ top: '254mm', left: '16mm', width: '110mm', height: '18mm' }}>
            <b>Remarks:</b> <span>{text(order.remarks)}</span>
          </div>
          <div className="nunes-sign-box" style={{ top: '254mm', right: '16mm', width: '64mm', height: '18mm' }}>
            <div>Date: {text(order.approval_date)}</div>
            <div style={{ marginTop: '4mm' }}>Approved by: <b>{text(order.approved_by)}</b></div>
          </div>
        </section>

        {/* PAGE 2 */}
        <section className="nunes-paper-page" style={{ marginTop: '20px' }}>
          <div className="nunes-paper-border" />
          <div className="nunes-blue-header center" style={{ top: '12mm', left: '60mm', width: '90mm' }}>ACCOUNTS DETAILS</div>
          <div className="nunes-paper-serial" style={{ top: '14mm', left: '16mm' }}>Order #{order.order_id || order.id}</div>

          <div className="nunes-accounts-grid4" style={{ top: '28mm', left: '16mm', width: '178mm' }}>
            <div className="nunes-box-cell"><b>PO Dt:</b> <span>{text(order.po_date)}</span></div>
            <div className="nunes-box-cell"><b>PO No:</b> <span>{text(order.po_no)}</span></div>
            <div className="nunes-box-cell"><b>Supplier:</b> <span>{text(order.accounts_supplier_name)}</span></div>
            <div className="nunes-box-cell"><b>Terms:</b> <span>{text(order.accounts_terms)}</span></div>
          </div>

          <div className="nunes-field-row" style={{ top: '48mm', left: '16mm', right: '16mm' }}>
            <div><b>Proforma No:</b> <span>{text(order.proforma_no)}</span></div>
            <div><b>Courier Today Basic:</b> <span>{text(order.courier_today_basic)}</span></div>
            <div><b>PDC On Delivery:</b> <span>{text(order.pdc_on_delivery)}</span></div>
          </div>

          <div className="nunes-field-row" style={{ top: '58mm', left: '16mm', right: '16mm' }}>
            <div><b>Dispatch Dt:</b> <span>{text(order.accounts_dispatch_date)}</span></div>
            <div><b>Courier:</b> <span>{text(order.accounts_courier)}</span></div>
            <div><b>Packing Mode:</b> <span>{text(order.packing_mode)}</span></div>
          </div>

          <div className="nunes-field-row" style={{ top: '68mm', left: '16mm', right: '16mm' }}>
            <div><b>Docket No:</b> <span>{text(order.docket_no)}</span></div>
            <div><b>Courier Rs:</b> <span>₹ {money(order.courier_rs)}</span></div>
            <div><b>Item Received On:</b> <span>{text(order.item_received_on)}</span></div>
          </div>

          <table className="nunes-sheet-table" style={{ top: '80mm', left: '16mm', width: '178mm' }}>
            <thead>
              <tr>
                <th style={{ width: '8%' }}>S.No</th>
                <th style={{ width: '44%' }}>Particulars</th>
                <th style={{ width: '14%' }}>Item Value</th>
                <th style={{ width: '12%' }}>P&amp;F Charges</th>
                <th style={{ width: '10%' }}>Tax</th>
                <th style={{ width: '12%' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {accountsRows.map((r, i) => (
                <tr key={r?.id || i} style={{ height: '8.5mm' }}>
                  <td style={{ textAlign: 'center' }}>{i + 1}</td>
                  <td>{r?.particulars || '\u00a0'}</td>
                  <td style={{ textAlign: 'right' }}>{r ? money(r.item_value) : '\u00a0'}</td>
                  <td style={{ textAlign: 'right' }}>{r ? money(r.pf_charges) : '\u00a0'}</td>
                  <td style={{ textAlign: 'right' }}>{r ? money(r.tax) : '\u00a0'}</td>
                  <td style={{ textAlign: 'right' }}>{r ? money(r.total) : '\u00a0'}</td>
                </tr>
              ))}
              <tr style={{ height: '8mm', fontWeight: 'bold', background: '#f5f7fb' }}>
                <td colSpan={5} style={{ textAlign: 'right', paddingRight: '8mm' }}>Bill Amount</td>
                <td style={{ textAlign: 'right' }}>₹ {money(order.bill_amount)}</td>
              </tr>
            </tbody>
          </table>

          <div className="nunes-blue-header" style={{ top: '135mm', left: '16mm', width: '65mm' }}>Supplier Payment</div>
          <table className="nunes-sheet-table" style={{ top: '146mm', left: '16mm', width: '178mm' }}>
            <thead>
              <tr>
                <th style={{ width: '8%' }}>S.No</th>
                <th style={{ width: '22%' }}>Date</th>
                <th style={{ width: '40%' }}>Bank &amp; Branch</th>
                <th style={{ width: '15%' }}>Mode</th>
                <th style={{ width: '15%' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {supplierPaymentRows.map((r, i) => (
                <tr key={r?.id || i} style={{ height: '8.5mm' }}>
                  <td style={{ textAlign: 'center' }}>{i + 1}</td>
                  <td>{r?.payment_date || '\u00a0'}</td>
                  <td>{r?.bank_branch || '\u00a0'}</td>
                  <td>{r?.mode || '\u00a0'}</td>
                  <td style={{ textAlign: 'right' }}>{r ? money(r.amount) : '\u00a0'}</td>
                </tr>
              ))}
              <tr style={{ height: '8mm', fontWeight: 'bold' }}>
                <td colSpan={4} style={{ textAlign: 'right' }}>Balance Payable:</td>
                <td style={{ textAlign: 'right' }}>₹ {money(supplierBal)}</td>
              </tr>
            </tbody>
          </table>

          <div className="nunes-blue-header center" style={{ top: '198mm', left: '16mm', width: '178mm' }}>Profit Margin</div>
          <div className="nunes-profit-card" style={{ top: '209mm', left: '16mm', width: '178mm' }}>
            <div className="nunes-profit-grid">
              <div><span>Total Purchase Cost:</span> <b>₹ {money(order.total_purchase_cost)}</b></div>
              <div><span>Total Selling Cost:</span> <b>₹ {money(order.total_selling_cost || order.total_order_value)}</b></div>
              <div><span>Net Profit:</span> <b style={{ color: '#15803d' }}>₹ {money(order.profit)}</b></div>
              <div><span>Profit Percentage:</span> <b>{order.profit_percentage || 0}%</b></div>
            </div>
          </div>

          <div className="nunes-field-row" style={{ top: '248mm', left: '16mm', right: '16mm' }}>
            <div style={{ flex: '1' }}><b>Account Remarks:</b> <span>{text(order.account_remarks)}</span></div>
            <div style={{ flex: '0 0 30%' }}><b>Signature:</b> <span>{text(order.account_signature)}</span></div>
          </div>
        </section>
      </div>
    </div>
  );
}
