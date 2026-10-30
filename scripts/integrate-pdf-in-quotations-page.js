const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'quotations', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// 1. Add FileDown and ServiceQuotationModal import
if (!content.includes('ServiceQuotationModal')) {
  content = content.replace(
    'import { syncFormToCloud, syncPullFromCloud } from "@/lib/sync";',
    'import { syncFormToCloud, syncPullFromCloud } from "@/lib/sync";\nimport ServiceQuotationModal from "@/components/forms/ServiceQuotationModal";'
  );
}

if (!content.includes('FileDown,')) {
  content = content.replace(
    '  Download,\n  Eye,',
    '  Download,\n  FileDown,\n  Eye,'
  );
}

// 2. Add pdfQuotationJob state
if (!content.includes('pdfQuotationJob')) {
  content = content.replace(
    '  // AZHALAKU PRIYA SERVICE JOB FORM FILLING STATE\n  // =========================================================================\n  const [selectedPricingJob, setSelectedPricingJob] = useState<ServiceJob | null>(null);',
    '  // AZHALAKU PRIYA SERVICE JOB FORM FILLING STATE\n  // =========================================================================\n  const [selectedPricingJob, setSelectedPricingJob] = useState<ServiceJob | null>(null);\n  const [pdfQuotationJob, setPdfQuotationJob] = useState<ServiceJob | null>(null);'
  );
}

// 3. Add handleOpenQuotationPdf helper
const helperCode = `  const handleOpenQuotationPdf = (job: ServiceJob) => {
    const isSelected = selectedPricingJob && (selectedPricingJob.id === job.id || selectedPricingJob.jobNo === job.jobNo);
    const effectiveService = isSelected ? pricingServiceCharge : (job.workflow?.priyaServiceCharge || job.totals?.repairEstimate || 0);
    const effectiveSpares = isSelected ? pricingSpareParts : (job.workflow?.priyaSparePartsCost || (job.workflow as any)?.estimatedSpareCost || 0);
    const effectiveDiscount = isSelected ? pricingDiscount : (job.workflow?.priyaDiscount || job.totals?.discount || 0);
    const effectiveNotes = isSelected ? pricingNotes : (job.workflow?.priyaPricingNotes || "");

    const jobToOpen: ServiceJob = {
      ...job,
      totals: {
        ...job.totals,
        repairEstimate: effectiveService,
        discount: effectiveDiscount,
        totalEstimate: isSelected ? pricingTotal : (job.workflow?.mdApprovedPrice || job.workflow?.priyaTotalQuotationAmount || job.totals?.totalEstimate || 0),
      },
      workflow: {
        ...(job.workflow || {}),
        priyaServiceCharge: effectiveService,
        priyaRepairEstimate: effectiveService,
        priyaSparePartsCost: effectiveSpares,
        priyaDiscount: effectiveDiscount,
        priyaPricingNotes: effectiveNotes,
      }
    };
    setPdfQuotationJob(jobToOpen);
  };

`;

if (!content.includes('handleOpenQuotationPdf')) {
  content = content.replace(
    '  const saveSingleServiceJob = (updatedJob: ServiceJob) => {',
    helperCode + '  const saveSingleServiceJob = (updatedJob: ServiceJob) => {'
  );
}

// 4. Add PDF action button in Service Jobs table rows
const oldTableRowActions = `                              <button
                                type="button"
                                onClick={() => openPricingModal(j)}
                                className={\`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer \${
                                  stage === "AWAITING_PRIYA_PRICING"
                                    ? "bg-teal-700 hover:bg-teal-800 text-white shadow-xs"
                                    : stage === "AWAITING_MD_APPROVAL"
                                    ? "bg-purple-700 hover:bg-purple-800 text-white shadow-xs"
                                    : stage === "PRICE_APPROVED_BY_MD"
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                    : stage === "READY_FOR_HANDOVER"
                                    ? "bg-blue-700 hover:bg-blue-800 text-white shadow-xs"
                                    : "bg-slate-800 hover:bg-slate-900 text-white"
                                }\`}
                              >
                                <span>
                                  {stage === "AWAITING_PRIYA_PRICING"
                                    ? "Fill Pricing Form ➔"
                                    : stage === "AWAITING_MD_APPROVAL"
                                    ? "Review Pricing ➔"
                                    : stage === "PRICE_APPROVED_BY_MD"
                                    ? "Dispatch Quotation ➔"
                                    : stage === "READY_FOR_HANDOVER"
                                    ? "Record Payment ➔"
                                    : "View Details ➔"}
                                </span>
                              </button>
                              <Link
                                href={\`/forms/servicing?id=\${j.jobNo || j.id}\`}
                                title="Open Full Servicing Page"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                              >
                                <ArrowRight size={14} />
                              </Link>`;

const newTableRowActions = `                              <button
                                type="button"
                                onClick={() => handleOpenQuotationPdf(j)}
                                title="Preview & Download Official Quotation PDF"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                <FileDown size={13} />
                                <span>PDF</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openPricingModal(j)}
                                className={\`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer \${
                                  stage === "AWAITING_PRIYA_PRICING"
                                    ? "bg-teal-700 hover:bg-teal-800 text-white shadow-xs"
                                    : stage === "AWAITING_MD_APPROVAL"
                                    ? "bg-purple-700 hover:bg-purple-800 text-white shadow-xs"
                                    : stage === "PRICE_APPROVED_BY_MD"
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                    : stage === "READY_FOR_HANDOVER"
                                    ? "bg-blue-700 hover:bg-blue-800 text-white shadow-xs"
                                    : "bg-slate-800 hover:bg-slate-900 text-white"
                                }\`}
                              >
                                <span>
                                  {stage === "AWAITING_PRIYA_PRICING"
                                    ? "Fill Pricing Form ➔"
                                    : stage === "AWAITING_MD_APPROVAL"
                                    ? "Review Pricing ➔"
                                    : stage === "PRICE_APPROVED_BY_MD"
                                    ? "Dispatch Quotation ➔"
                                    : stage === "READY_FOR_HANDOVER"
                                    ? "Record Payment ➔"
                                    : "View Details ➔"}
                                </span>
                              </button>
                              <Link
                                href={\`/forms/servicing?id=\${j.jobNo || j.id}\`}
                                title="Open Full Servicing Page"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                              >
                                <ArrowRight size={14} />
                              </Link>`;

if (content.includes(oldTableRowActions)) {
  content = content.replace(oldTableRowActions, newTableRowActions);
  console.log('Added PDF button to table rows!');
} else {
  console.error('Failed to find oldTableRowActions');
}

// 5. Add Preview PDF button in Section 3
const oldSubmitPriceButton = `                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      <ShieldCheck size={13} />
                      <span>Submit Commercial Pricing to MD for Approval ➔</span>
                    </button>`;

const newSubmitPriceButton = `                    <button
                      type="button"
                      onClick={() => handleOpenQuotationPdf(selectedPricingJob)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-colors cursor-pointer"
                      title="Preview formal quotation PDF layout"
                    >
                      <Eye size={13} />
                      <span>Preview Quotation PDF</span>
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      <ShieldCheck size={13} />
                      <span>Submit Commercial Pricing to MD for Approval ➔</span>
                    </button>`;

if (content.includes(oldSubmitPriceButton)) {
  content = content.replace(oldSubmitPriceButton, newSubmitPriceButton);
  console.log('Added Preview Quotation PDF button in Section 3!');
} else {
  console.error('Failed to find oldSubmitPriceButton');
}

// 6. Upgrade Section 4 Dispatch links with formal PDF options
const oldSection4Links = `                  {/* Instant Send Links */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={getWhatsAppLink(selectedPricingJob, pricingTotal)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                    >
                      <MessageSquare size={13} />
                      <span>Send WhatsApp Quotation</span>
                    </a>

                    <a
                      href={getEmailLink(selectedPricingJob, pricingTotal)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                    >
                      <Mail size={13} />
                      <span>Send Email Quotation</span>
                    </a>
                  </div>`;

const newSection4Links = `                  {/* Official PDF Generation & Instant Send */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleOpenQuotationPdf(selectedPricingJob)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                      title="Open Official Quotation PDF with 1-click Download"
                    >
                      <FileDown size={14} />
                      <span>📄 View &amp; Download Official Quotation PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenQuotationPdf(selectedPricingJob)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                      title="Send Official PDF Quotation to Customer on WhatsApp"
                    >
                      <MessageSquare size={13} />
                      <span>💬 WhatsApp (PDF Format)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenQuotationPdf(selectedPricingJob)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                      title="Send Official PDF Quotation via Email"
                    >
                      <Mail size={13} />
                      <span>✉ Email (PDF Format)</span>
                    </button>
                  </div>`;

if (content.includes(oldSection4Links)) {
  content = content.replace(oldSection4Links, newSection4Links);
  console.log('Upgraded Section 4 links with PDF options!');
} else {
  console.error('Failed to find oldSection4Links');
}

// 7. Add Download Official PDF in viewQuotation modal
const oldViewQuotationActions = `            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer size={14} /> Print
              </button>`;

const newViewQuotationActions = `            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const convertedJob: any = {
                    id: viewQuotation.id,
                    jobNo: viewQuotation.quotation_no,
                    jobDate: viewQuotation.sent_at ? viewQuotation.sent_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
                    customer: {
                      name: viewQuotation.customer_name,
                      phone: viewQuotation.customer_phone,
                      city: viewQuotation.customer_city,
                    },
                    products: [{
                      id: '1',
                      productName: viewQuotation.item_description,
                      makeModel: viewQuotation.scope_type,
                      qty: 1,
                      repairEstimate: viewQuotation.amount,
                      repairWork: viewQuotation.notes || 'Standard instrumentation services',
                    }],
                    totals: {
                      repairEstimate: viewQuotation.amount,
                      discount: 0,
                      totalEstimate: viewQuotation.total_amount,
                    },
                    notes: viewQuotation.notes,
                  };
                  setViewQuotation(null);
                  setPdfQuotationJob(convertedJob);
                }}
                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileDown size={14} /> Download Official PDF
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer size={14} /> Print
              </button>`;

if (content.includes(oldViewQuotationActions)) {
  content = content.replace(oldViewQuotationActions, newViewQuotationActions);
  console.log('Added Download Official PDF in viewQuotation modal!');
} else {
  console.error('Failed to find oldViewQuotationActions');
}

// 8. Add ServiceQuotationModal render at the bottom of the page
const pageEndMarker = `      {/* New Manual Quotation Modal */}
      {modalOpen && (`;

const pdfModalRender = `      {/* Formal PDF Quotation Document Modal (NUNES Exact Company Layout) */}
      {pdfQuotationJob && (
        <ServiceQuotationModal
          job={pdfQuotationJob}
          onClose={() => setPdfQuotationJob(null)}
          onSaved={() => {
            loadQuotations();
            loadServiceJobs();
          }}
        />
      )}

      {/* New Manual Quotation Modal */}
      {modalOpen && (`;

if (content.includes(pageEndMarker) && !content.includes('job={pdfQuotationJob}')) {
  content = content.replace(pageEndMarker, pdfModalRender);
  console.log('Added ServiceQuotationModal rendering to page!');
} else {
  console.error('Failed to add ServiceQuotationModal render');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Finished updating src/app/quotations/page.tsx');
