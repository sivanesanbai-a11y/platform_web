const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/quotations/page.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add MailCheck to lucide imports if not present
if (!code.includes('MailCheck,')) {
  code = code.replace('Mail,', 'Mail,\n  MailCheck,');
}

// 2. Enhance useEffect with BroadcastChannel, storage events, workflow events, and polling fallback
const oldUseEffect = `  useEffect(() => {
    loadQuotations();
    void loadServiceJobs(true).then(() => applyTargetJob());

    const handleSync = () => {
      loadQuotations();
      void loadServiceJobs(false).then(() => applyTargetJob());
    };

    const handleSelectJobEvent = (e: CustomEvent) => {
      if (e.detail?.jobId) {
        void applyTargetJob(e.detail.jobId);
      }
    };

    const handlePopState = () => {
      void applyTargetJob();
    };

    window.addEventListener("nunes:records-synced", handleSync);
    window.addEventListener("storage", handleSync);
    window.addEventListener("nunes:select-job", handleSelectJobEvent as EventListener);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("nunes:records-synced", handleSync);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("nunes:select-job", handleSelectJobEvent as EventListener);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);`;

const newUseEffect = `  useEffect(() => {
    loadQuotations();
    void loadServiceJobs(true).then(() => applyTargetJob());

    const handleSync = () => {
      loadQuotations();
      void loadServiceJobs(false).then((jobs) => {
        applyTargetJob();
        // Keep selected modal in sync with any live MD approval return message
        setSelectedPricingJob((prev) => {
          if (!prev) return null;
          const fresh = (jobs || []).find((j) => String(j.id) === String(prev.id) || String(j.jobNo) === String(prev.jobNo));
          return fresh || prev;
        });
      });
    };

    const handleSelectJobEvent = (e: CustomEvent) => {
      if (e.detail?.jobId) {
        void applyTargetJob(e.detail.jobId);
      }
    };

    const handlePopState = () => {
      void applyTargetJob();
    };

    // 1. Window Event Listeners
    window.addEventListener("nunes:records-synced", handleSync);
    window.addEventListener("nunes:workflow-notification", handleSync as EventListener);
    window.addEventListener("nunes:workflow-alerts-updated", handleSync);
    window.addEventListener("storage", handleSync);
    window.addEventListener("nunes:select-job", handleSelectJobEvent as EventListener);
    window.addEventListener("popstate", handlePopState);

    // 2. Cross-tab Broadcast Channel for instantaneous 0ms sync
    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
      try {
        channel = new BroadcastChannel("nunes_workflow_channel");
        channel.onmessage = () => {
          handleSync();
        };
      } catch {}
    }

    // 3. Fallback periodic polling every 7 seconds for cross-device alerts
    const pollInterval = setInterval(() => {
      handleSync();
    }, 7000);

    return () => {
      window.removeEventListener("nunes:records-synced", handleSync);
      window.removeEventListener("nunes:workflow-notification", handleSync as EventListener);
      window.removeEventListener("nunes:workflow-alerts-updated", handleSync);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("nunes:select-job", handleSelectJobEvent as EventListener);
      window.removeEventListener("popstate", handlePopState);
      clearInterval(pollInterval);
      if (channel) {
        try {
          channel.close();
        } catch {}
      }
    };
  }, []);`;

if (code.includes('loadQuotations();\n    void loadServiceJobs(true).then(() => applyTargetJob());')) {
  code = code.replace(oldUseEffect, newUseEffect);
  console.log('✓ Replaced useEffect in quotations/page.tsx');
} else {
  console.log('• useEffect pattern not matched exactly, checking if already patched');
}

// 3. Add MD Return Approval Messages Inbox banner before the search & filter bar
const inboxBannerSnippet = `          {/* MD RETURN APPROVAL MESSAGES INBOX BANNER */}
          {serviceJobs.filter((j) => j.workflow?.stage === "PRICE_APPROVED_BY_MD").length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 border-2 border-emerald-500 shadow-sm space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                      <span>📩 Return Approval Messages from MD</span>
                      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-200 text-emerald-900 animate-pulse">
                        {serviceJobs.filter((j) => j.workflow?.stage === "PRICE_APPROVED_BY_MD").length} Ready for Quotation Release
                      </span>
                    </h3>
                    <p className="text-xs text-emerald-800 font-medium mt-0.5">
                      MD has reviewed and approved quotation prices. Azhalaku Priya: please open each job to dispatch quotations with courier/delivery tracking.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {serviceJobs
                  .filter((j) => j.workflow?.stage === "PRICE_APPROVED_BY_MD")
                  .slice(0, 4)
                  .map((apprJob) => {
                    const firstP = (apprJob.products && apprJob.products[0]) || { productName: "Instrument" };
                    const approvedAmt = Number(apprJob.workflow?.mdApprovedPrice || apprJob.totals?.totalEstimate || 0);
                    return (
                      <div
                        key={apprJob.id || apprJob.jobNo}
                        className="bg-white rounded-xl p-3 border border-emerald-300 shadow-2xs flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                                #{apprJob.jobNo || apprJob.id}
                              </span>
                              <span className="font-bold text-xs text-slate-900">
                                {firstP.productName}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 mt-1">
                              👤 <strong>{apprJob.customer?.name}</strong> • {apprJob.customer?.city || "Coimbatore"}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                              ₹{approvedAmt.toLocaleString("en-IN")}
                            </span>
                            {apprJob.workflow?.mdPriceModified && (
                              <div className="text-[9.5px] text-amber-800 font-bold mt-0.5">
                                ✏️ Price Adjusted
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/70 italic line-clamp-2">
                          &ldquo;{apprJob.workflow?.mdReturnMessageToPriya || "MD approved quotation price. Azhalaku Priya: Please fill courier/delivery details and send quotation."}&rdquo;
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="text-[10px] text-slate-500">
                            {apprJob.workflow?.mdApprovedAt ? new Date(apprJob.workflow.mdApprovedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Approved"}
                          </span>
                          <button
                            type="button"
                            onClick={() => openPricingModal(apprJob)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                          >
                            <span>📩 View Return Message &amp; Dispatch ➔</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Search & Filter Bar */}`;

if (!code.includes('📩 Return Approval Messages from MD')) {
  code = code.replace(
    `          {/* Search & Filter Bar */}`,
    inboxBannerSnippet
  );
  console.log('✓ Added MD Return Approval Messages Inbox banner');
}

// 4. Add Return Message Card inside the Pricing Modal (above Section 1)
const modalReturnCard = `            {/* Notification / Toast Banner */}
            {pricingSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{pricingSuccessMsg}</span>
              </div>
            )}

            {/* RETURN MESSAGE RECEIVED FROM MD BANNER (PROMINENT FOR AZHALAKU PRIYA) */}
            {(selectedPricingJob.workflow?.stage === "PRICE_APPROVED_BY_MD" ||
              selectedPricingJob.workflow?.approvedByMd ||
              selectedPricingJob.workflow?.mdApprovedPrice) && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 border-2 border-emerald-500 shadow-md space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-emerald-600 text-white shadow-xs">
                      <CheckCircle2 size={16} />
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                        <span>📩 Return Approval Message Received from MD</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900 animate-pulse">
                          Price Approved &amp; Locked
                        </span>
                      </h4>
                      <div className="text-[11px] text-emerald-800 font-semibold">
                        Approved by <strong>{selectedPricingJob.workflow?.mdApprovedBy || "Managing Director (MD)"}</strong>
                        {selectedPricingJob.workflow?.mdApprovedAt && (
                          <span> • {new Date(selectedPricingJob.workflow.mdApprovedAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-900 bg-white/90 px-3 py-1.5 rounded-xl border border-emerald-300 shadow-2xs">
                      Approved Price: ₹{Number(selectedPricingJob.workflow?.mdApprovedPrice || pricingTotal).toLocaleString("en-IN")}
                    </div>
                    {selectedPricingJob.workflow?.mdPriceModified && (
                      <div className="text-[10.5px] font-bold text-amber-900 mt-1">
                        ✏️ Price Adjusted by MD (Orig: ₹{Number(selectedPricingJob.workflow?.originalQuotedPrice || pricingTotal).toLocaleString("en-IN")})
                      </div>
                    )}
                  </div>
                </div>

                {/* Return Message Body */}
                <div className="p-3 rounded-xl bg-white/95 border border-emerald-300 text-slate-800 text-xs font-medium leading-relaxed">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5">
                    Message from Managing Director:
                  </div>
                  <p className="m-0 text-slate-900 font-bold">
                    &ldquo;{selectedPricingJob.workflow?.mdReturnMessageToPriya ||
                      \`MD approved quotation price ₹\${Number(selectedPricingJob.workflow?.mdApprovedPrice || pricingTotal).toLocaleString("en-IN")} directly from Executive Station. Azhalaku Priya: Please fill courier/delivery details and send formal quotation.\`}&rdquo;
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 text-emerald-900 font-bold flex-wrap gap-2">
                  <span>👉 Action: Complete Courier / Delivery Dispatch details in Section 4 below to release quotation.</span>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("priya-dispatch-section");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Proceed to Delivery Dispatch Section ➔</span>
                  </button>
                </div>
              </div>
            )}`;

if (!code.includes('RETURN MESSAGE RECEIVED FROM MD BANNER')) {
  code = code.replace(
    `            {/* Notification / Toast Banner */}
            {pricingSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{pricingSuccessMsg}</span>
              </div>
            )}`,
    modalReturnCard
  );
  console.log('✓ Added RETURN MESSAGE RECEIVED FROM MD BANNER inside pricing modal');
}

// 5. Add id="priya-dispatch-section" to Section 4
if (!code.includes('id="priya-dispatch-section"')) {
  code = code.replace(
    `            {/* Section 4: Quotation Dispatch & Handover (Active if MD Approved or Ready) */}
            {(selectedPricingJob.workflow?.approvedByMd ||
              selectedPricingJob.workflow?.stage === "PRICE_APPROVED_BY_MD" ||
              selectedPricingJob.workflow?.stage === "READY_FOR_HANDOVER" ||
              selectedPricingJob.workflow?.stage === "JOB_COMPLETED") && (
              <div className="mt-4 pt-4 border-t border-slate-200/90 space-y-3">`,
    `            {/* Section 4: Quotation Dispatch & Handover (Active if MD Approved or Ready) */}
            {(selectedPricingJob.workflow?.approvedByMd ||
              selectedPricingJob.workflow?.stage === "PRICE_APPROVED_BY_MD" ||
              selectedPricingJob.workflow?.stage === "READY_FOR_HANDOVER" ||
              selectedPricingJob.workflow?.stage === "JOB_COMPLETED") && (
              <div id="priya-dispatch-section" className="mt-4 pt-4 border-t border-slate-200/90 space-y-3">`
  );
  console.log('✓ Added id="priya-dispatch-section"');
}

// 6. Update Action button text in table for stage === "PRICE_APPROVED_BY_MD"
code = code.replace(
  `: stage === "PRICE_APPROVED_BY_MD"\n                                    ? "Dispatch Quotation ➔"`,
  `: stage === "PRICE_APPROVED_BY_MD"\n                                    ? "📩 View Return Msg & Dispatch ➔"`
);

// 7. Update table equipment column with Return Msg indicator
if (!code.includes('Return Msg: MD Approved')) {
  code = code.replace(
    `                            {firstProd.productValue ? (
                              <div className="text-[10.5px] text-slate-400">
                                Base Value: ₹{Number(firstProd.productValue).toLocaleString("en-IN")}
                              </div>
                            ) : null}`,
    `                            {firstProd.productValue ? (
                              <div className="text-[10.5px] text-slate-400">
                                Base Value: ₹{Number(firstProd.productValue).toLocaleString("en-IN")}
                              </div>
                            ) : null}
                            {stage === "PRICE_APPROVED_BY_MD" && (
                              <div className="text-[10px] text-emerald-800 font-bold mt-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                <span>📩 Return Msg: MD Approved ₹{Number(approvedPrice).toLocaleString("en-IN")}</span>
                              </div>
                            )}`
  );
  console.log('✓ Added Return Msg indicator to table equipment cell');
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully written updated quotations/page.tsx');
