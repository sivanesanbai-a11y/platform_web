const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/quotations/page.tsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add Package, MapPin, Users to lucide-react imports
if (!content.includes('Package,')) {
  content = content.replace(
    'ChevronRight,',
    'ChevronRight,\n  Package,\n  MapPin,\n  Users,'
  );
}

// 2. Add getDeliveryModeInfo function
const getDeliveryFunc = `export function getDeliveryModeInfo(job: Partial<ServiceJob>) {
  const wf = job.workflow || {};
  const rc = (job as any).receipt || {};
  const dp = (job as any).dispatch || {};

  const handoverType = wf.priyaHandoverType;
  const receiptMode = rc.mode;

  // Courier criteria:
  // 1. Explicitly chosen as COURIER by Priya
  // 2. Or intake receipt mode was COURIER and Priya hasn't changed to DIRECT_HANDOVER
  // 3. Or workflow marked as cannotGetDirect / isBranchDelivery
  // 4. Or dispatch mode mentions courier
  const cannotGetDirect =
    handoverType === "COURIER" ||
    (!handoverType && receiptMode === "COURIER") ||
    Boolean(wf.cannotGetDirect) ||
    Boolean(wf.isBranchDelivery) ||
    (typeof dp.mode === "string" && dp.mode.toLowerCase().includes("courier"));

  const isFieldPickup =
    handoverType === "FIELD_PICKUP" ||
    (!handoverType && (receiptMode === "FIELD_PICKUP" || receiptMode === "OTHER"));

  const isDirect = !cannotGetDirect && !isFieldPickup;

  const courierPartner =
    wf.priyaCourierName ||
    rc.courierName ||
    (typeof dp.mode === "string" && dp.mode !== "DIRECT_HANDOVER" && dp.mode !== "Direct Delivery" ? dp.mode : "") ||
    "ST Courier";

  const docketOrRef =
    wf.priyaCourierDocket ||
    rc.docketNo ||
    (cannotGetDirect ? dp.reference : "") ||
    "";

  const repPerson =
    wf.priyaDeliveryPersonName ||
    rc.personName ||
    job.customer?.contactPerson ||
    (!cannotGetDirect ? dp.reference : "") ||
    "";

  const destinationCity = job.customer?.city || "Coimbatore";

  return {
    cannotGetDirect,
    isDirect,
    isFieldPickup,
    courierPartner,
    docketOrRef,
    repPerson,
    destinationCity,
    badgeText: cannotGetDirect
      ? "Cannot Get Direct (Courier)"
      : isFieldPickup
      ? "Field Delivery"
      : "Direct Walk-in",
  };
}

function getCleanComplaint`;

if (!content.includes('function getDeliveryModeInfo')) {
  content = content.replace('function getCleanComplaint', getDeliveryFunc);
}

// 3. Add deliveryFilter state
if (!content.includes('deliveryFilter, setDeliveryFilter')) {
  content = content.replace(
    'const [serviceStageFilter, setServiceStageFilter] = useState<string>("ALL");',
    'const [serviceStageFilter, setServiceStageFilter] = useState<string>("ALL");\n  const [deliveryFilter, setDeliveryFilter] = useState<"ALL" | "CANNOT_GET_DIRECT" | "DIRECT_WALKIN">("ALL");'
  );
}

// 4. Auto-detect delivery & collection mode in openPricingModal
const oldOpenPricingHandover = `    setPricingHandoverType(wf.priyaHandoverType || "COURIER");
    setPricingRecipientOrDocket(
      wf.priyaCourierDocket || wf.priyaDeliveryPersonName || ""
    );
    setPricingCourierName(wf.priyaCourierName || "ST Courier");`;

const newOpenPricingHandover = `    // Auto-detect delivery & collection mode (Direct Walk-in vs Cannot Get Direct / Courier)
    const initialDel = getDeliveryModeInfo(job);
    const determinedHandover = initialDel.cannotGetDirect
      ? "COURIER"
      : initialDel.isFieldPickup
      ? "FIELD_PICKUP"
      : "DIRECT_HANDOVER";

    setPricingHandoverType(wf.priyaHandoverType || determinedHandover);
    setPricingRecipientOrDocket(
      wf.priyaCourierDocket || wf.priyaDeliveryPersonName || rc.docketNo || rc.personName || ""
    );
    setPricingCourierName(wf.priyaCourierName || rc.courierName || "ST Courier");`;

if (content.includes(oldOpenPricingHandover)) {
  content = content.replace(oldOpenPricingHandover, newOpenPricingHandover);
}

// 5. handleOpenQuotationPdf: pass delivery mode to syntheticJob.workflow
const oldHandleOpenPdf = `    const jobToOpen: ServiceJob = {
      ...job,
      totals: {
        ...job.totals,
        repairEstimate: effectiveService,
        discount: effectiveDiscount,
        totalEstimate: job.workflow?.mdApprovedPrice || (isSelected ? pricingTotal : (job.workflow?.priyaTotalQuotationAmount || job.totals?.totalEstimate || 0)),
      },
      workflow: {
        stage: (job.workflow?.stage || "INTAKE_RECEIVED") as any,
        ...(job.workflow || {}),
        priyaServiceCharge: effectiveService,
        priyaRepairEstimate: effectiveService,
        priyaSparePartsCost: effectiveSpares,
        priyaDiscount: effectiveDiscount,
        priyaPricingNotes: effectiveNotes,
      } as any,
    };`;

const newHandleOpenPdf = `    const effectiveHandoverType = isSelected
      ? pricingHandoverType
      : (job.workflow?.priyaHandoverType || (job.receipt?.mode === "COURIER" ? "COURIER" : "DIRECT_HANDOVER"));
    const effectiveCourierName = isSelected
      ? pricingCourierName
      : (job.workflow?.priyaCourierName || job.receipt?.courierName || "ST Courier");
    const effectiveDocket = isSelected
      ? pricingRecipientOrDocket
      : (job.workflow?.priyaCourierDocket || job.receipt?.docketNo || "");
    const effectiveCannotGetDirect = effectiveHandoverType === "COURIER";

    const jobToOpen: ServiceJob = {
      ...job,
      totals: {
        ...job.totals,
        repairEstimate: effectiveService,
        discount: effectiveDiscount,
        totalEstimate: job.workflow?.mdApprovedPrice || (isSelected ? pricingTotal : (job.workflow?.priyaTotalQuotationAmount || job.totals?.totalEstimate || 0)),
      },
      workflow: {
        stage: (job.workflow?.stage || "INTAKE_RECEIVED") as any,
        ...(job.workflow || {}),
        priyaServiceCharge: effectiveService,
        priyaRepairEstimate: effectiveService,
        priyaSparePartsCost: effectiveSpares,
        priyaDiscount: effectiveDiscount,
        priyaPricingNotes: effectiveNotes,
        priyaHandoverType: effectiveHandoverType,
        cannotGetDirect: effectiveCannotGetDirect,
        priyaCourierName: effectiveCourierName,
        priyaCourierDocket: effectiveDocket,
      } as any,
    };`;

if (content.includes(oldHandleOpenPdf)) {
  content = content.replace(oldHandleOpenPdf, newHandleOpenPdf);
}

// 6. handleDispatchQuotation: set cannotGetDirect
const oldDispatchWf = `    const updatedWf = {
      ...(selectedPricingJob.workflow || {}),
      stage: "READY_FOR_HANDOVER" as const,
      priyaHandoverType: pricingHandoverType,
      priyaCourierName: pricingHandoverType === "COURIER" ? pricingCourierName : undefined,
      priyaCourierDocket: pricingHandoverType === "COURIER" ? finalDocket : undefined,
      priyaDeliveryPersonName: pricingHandoverType !== "COURIER" ? finalDocket : undefined,
      priyaQuotationSentAt: new Date().toISOString(),
      priyaCompletionNotes: "Quotation dispatched to client via " + (pricingHandoverType === "COURIER" ? (pricingCourierName + " - " + finalDocket) : "direct delivery (" + finalDocket + ")") + ".",
      handoverHandledBy: "azhalakupriya@nunesinstruments.com",
    };`;

const newDispatchWf = `    const updatedWf = {
      ...(selectedPricingJob.workflow || {}),
      stage: "READY_FOR_HANDOVER" as const,
      priyaHandoverType: pricingHandoverType,
      cannotGetDirect: pricingHandoverType === "COURIER",
      priyaCourierName: pricingHandoverType === "COURIER" ? pricingCourierName : undefined,
      priyaCourierDocket: pricingHandoverType === "COURIER" ? finalDocket : undefined,
      priyaDeliveryPersonName: pricingHandoverType !== "COURIER" ? finalDocket : undefined,
      priyaQuotationSentAt: new Date().toISOString(),
      priyaCompletionNotes: "Quotation dispatched to client via " + (pricingHandoverType === "COURIER" ? (pricingCourierName + " - " + finalDocket) : "direct delivery (" + finalDocket + ")") + ".",
      handoverHandledBy: "azhalakupriya@nunesinstruments.com",
    };`;

if (content.includes(oldDispatchWf)) {
  content = content.replace(oldDispatchWf, newDispatchWf);
}

// 7. Update getWhatsAppLink and getEmailLink
const oldWhatsApp = `  const getWhatsAppLink = (job: ServiceJob, total: number) => {
    const custPhone = (job.customer?.phone || "").replace(/[^0-9]/g, "");
    const phone = custPhone.length >= 10 ? custPhone : "919842100000";
    const msg = encodeURIComponent(
      "Hello " + (job.customer?.name || "Sir/Madam") + ",\\n\\nYour service quotation for *" + (job.products?.[0]?.productName || "Equipment") + "* (Job #" + (job.jobNo || job.id) + ") is approved.\\n\\n*Total Amount:* ₹" + total.toLocaleString("en-IN") + " (incl. 18% GST)\\n*Terms:* Includes calibration test certificate & 3 months warranty.\\n\\nThank you,\\nNUNES Instruments Commercial Team\\n+91 98421 00000"
    );
    return "https://wa.me/" + phone + "?text=" + msg;
  };

  const getEmailLink = (job: ServiceJob, total: number) => {
    const email = job.customer?.email || "service@nunesinstruments.com";
    const subject = encodeURIComponent(
      "Service Quotation & Estimation: Job #" + (job.jobNo || job.id) + " - " + (job.customer?.name || "Customer")
    );
    const body = encodeURIComponent(
      "Dear " + (job.customer?.name || "Customer") + ",\\n\\nPlease find your approved service quotation details below:\\n\\nJob Number: " + (job.jobNo || job.id) + "\\nEquipment: " + (job.products?.[0]?.productName || "Equipment") + " (SN: " + (job.products?.[0]?.serialNo || "N/A") + ")\\nApproved Total: ₹" + total.toLocaleString("en-IN") + " (incl. 18% GST)\\n\\nPlease confirm approval so we can release for courier dispatch.\\n\\nBest Regards,\\nAzhalaku Priya\\nNUNES Instruments"
    );
    return "mailto:" + email + "?subject=" + subject + "&body=" + body;
  };`;

const newWhatsApp = `  const getWhatsAppLink = (job: ServiceJob, total: number) => {
    const custPhone = (job.customer?.phone || "").replace(/[^0-9]/g, "");
    const phone = custPhone.length >= 10 ? custPhone : "919842100000";
    const del = getDeliveryModeInfo(job);
    const delMsg = del.cannotGetDirect
      ? "\\n*Delivery Mode:* Courier Dispatch to " + del.destinationCity + " via " + del.courierPartner + " (Cannot collect in direct)"
      : "\\n*Delivery Mode:* Direct Handover (Counter Collection at Coimbatore Works)";

    const msg = encodeURIComponent(
      "Hello " + (job.customer?.name || "Sir/Madam") + ",\\n\\nYour service quotation for *" + (job.products?.[0]?.productName || "Equipment") + "* (Job #" + (job.jobNo || job.id) + ") is approved.\\n\\n*Total Amount:* ₹" + total.toLocaleString("en-IN") + " (incl. 18% GST)" + delMsg + "\\n*Terms:* Includes calibration test certificate & 3 months warranty.\\n\\nThank you,\\nNUNES Instruments Commercial Team\\n+91 98421 00000"
    );
    return "https://wa.me/" + phone + "?text=" + msg;
  };

  const getEmailLink = (job: ServiceJob, total: number) => {
    const email = job.customer?.email || "service@nunesinstruments.com";
    const del = getDeliveryModeInfo(job);
    const delLine = del.cannotGetDirect
      ? "Delivery Mode: Courier Dispatch to " + del.destinationCity + " via " + del.courierPartner + " (Cannot collect in direct)\\n"
      : "Delivery Mode: Direct Handover at Coimbatore Works\\n";

    const subject = encodeURIComponent(
      "Service Quotation & Estimation: Job #" + (job.jobNo || job.id) + " - " + (job.customer?.name || "Customer")
    );
    const body = encodeURIComponent(
      "Dear " + (job.customer?.name || "Customer") + ",\\n\\nPlease find your approved service quotation details below:\\n\\nJob Number: " + (job.jobNo || job.id) + "\\nEquipment: " + (job.products?.[0]?.productName || "Equipment") + " (SN: " + (job.products?.[0]?.serialNo || "N/A") + ")\\nApproved Total: ₹" + total.toLocaleString("en-IN") + " (incl. 18% GST)\\n" + delLine + "\\nPlease confirm approval so we can release for courier dispatch.\\n\\nBest Regards,\\nAzhalaku Priya\\nNUNES Instruments"
    );
    return "mailto:" + email + "?subject=" + subject + "&body=" + body;
  };`;

if (content.includes(oldWhatsApp)) {
  content = content.replace(oldWhatsApp, newWhatsApp);
}

// 8. Update filteredServiceJobs & counts
const oldFilteredJobs = `      if (serviceStageFilter === "COMPLETED") {
        return stage === "JOB_COMPLETED" || j.status === "CLOSED";
      }

      // Default: Priya sees all service jobs in her workflow scope
      return true;
    });
  }, [serviceJobs, q, serviceStageFilter]);`;

const newFilteredJobs = `      if (serviceStageFilter === "COMPLETED") {
        return stage === "JOB_COMPLETED" || j.status === "CLOSED";
      }

      // 3. Collection / Delivery Mode Filter (Direct Walk-in vs Cannot Get Direct / Courier)
      if (deliveryFilter === "CANNOT_GET_DIRECT") {
        if (!getDeliveryModeInfo(j).cannotGetDirect) return false;
      } else if (deliveryFilter === "DIRECT_WALKIN") {
        if (!getDeliveryModeInfo(j).isDirect) return false;
      }

      // Default: Priya sees all service jobs in her workflow scope
      return true;
    });
  }, [serviceJobs, q, serviceStageFilter, deliveryFilter]);`;

if (content.includes(oldFilteredJobs)) {
  content = content.replace(oldFilteredJobs, newFilteredJobs);
}

const oldCounts = `  const priceApprovedCount = useMemo(() => {
    return serviceJobs.filter((j) => j.workflow?.stage === "PRICE_APPROVED_BY_MD").length;
  }, [serviceJobs]);`;

const newCounts = `  const priceApprovedCount = useMemo(() => {
    return serviceJobs.filter((j) => j.workflow?.stage === "PRICE_APPROVED_BY_MD").length;
  }, [serviceJobs]);

  const cannotGetDirectCount = useMemo(() => {
    return serviceJobs.filter((j) => getDeliveryModeInfo(j).cannotGetDirect).length;
  }, [serviceJobs]);

  const directWalkinCount = useMemo(() => {
    return serviceJobs.filter((j) => getDeliveryModeInfo(j).isDirect).length;
  }, [serviceJobs]);`;

if (content.includes(oldCounts)) {
  content = content.replace(oldCounts, newCounts);
}

// 9. MD Return Approval Messages from MD: add delivery badge
const oldMdBannerCard = `                            <div className="text-[11px] text-slate-600 mt-1">
                              👤 <strong>{apprJob.customer?.name}</strong> • {apprJob.customer?.city || "Coimbatore"}
                            </div>`;

const newMdBannerCard = `                            <div className="text-[11px] text-slate-600 mt-1">
                              👤 <strong>{apprJob.customer?.name}</strong> • {apprJob.customer?.city || "Coimbatore"}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              {getDeliveryModeInfo(apprJob).cannotGetDirect ? (
                                <span className="inline-flex items-center gap-1 text-[9.5px] font-black bg-amber-100 text-amber-950 px-1.5 py-0.5 rounded border border-amber-300">
                                  <Truck size={10} className="text-amber-700" />
                                  <span>Cannot Get Direct • {getDeliveryModeInfo(apprJob).courierPartner}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-emerald-100 text-emerald-950 px-1.5 py-0.5 rounded border border-emerald-300">
                                  <span>🤝 Direct Walk-in</span>
                                </span>
                              )}
                            </div>`;

if (content.includes(oldMdBannerCard)) {
  content = content.replace(oldMdBannerCard, newMdBannerCard);
}

// 10. Filter toolbar: add Delivery Mode filter chips
const oldFilterToolbar = `          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs overflow-x-auto">
              {[
                { key: "ALL", label: \`All (\${serviceJobs.length})\` },
                { key: "AWAITING_PRICING", label: \`1. Awaiting Pricing (\${awaitingPricingCount})\` },
                { key: "AWAITING_MD_APPROVAL", label: "2. MD Approval" },
                { key: "PRICE_APPROVED", label: \`3. Price Approved (\${priceApprovedCount})\` },
                { key: "READY_FOR_HANDOVER", label: "4. Quotation Dispatched" },
                { key: "COMPLETED", label: "5. Paid & Closed" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setServiceStageFilter(tab.key)}
                  className={\`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap \${
                    serviceStageFilter === tab.key
                      ? "bg-white text-teal-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }\`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search customer, equipment, serial #..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>`;

const newFilterToolbar = `          {/* Search & Filter Bar */}
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs overflow-x-auto">
                {[
                  { key: "ALL", label: \`All (\${serviceJobs.length})\` },
                  { key: "AWAITING_PRICING", label: \`1. Awaiting Pricing (\${awaitingPricingCount})\` },
                  { key: "AWAITING_MD_APPROVAL", label: "2. MD Approval" },
                  { key: "PRICE_APPROVED", label: \`3. Price Approved (\${priceApprovedCount})\` },
                  { key: "READY_FOR_HANDOVER", label: "4. Quotation Dispatched" },
                  { key: "COMPLETED", label: "5. Paid & Closed" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setServiceStageFilter(tab.key)}
                    className={\`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap \${
                      serviceStageFilter === tab.key
                        ? "bg-white text-teal-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }\`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 sm:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search customer, equipment, serial #..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>

            {/* Quick Delivery Filter Bar: Direct vs Cannot Get Direct (Courier) */}
            <div className="flex items-center gap-2 text-xs overflow-x-auto py-0.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1 shrink-0">
                <Truck size={13} className="text-teal-700" />
                <span>Delivery Mode:</span>
              </span>
              <button
                type="button"
                onClick={() => setDeliveryFilter("ALL")}
                className={\`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer shrink-0 \${
                  deliveryFilter === "ALL"
                    ? "bg-slate-800 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }\`}
              >
                All Delivery Modes ({serviceJobs.length})
              </button>
              <button
                type="button"
                onClick={() => setDeliveryFilter("CANNOT_GET_DIRECT")}
                className={\`px-2.5 py-1 rounded-lg font-black text-[11px] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 \${
                  deliveryFilter === "CANNOT_GET_DIRECT"
                    ? "bg-amber-500 text-amber-950 ring-2 ring-amber-400 shadow-xs"
                    : "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
                }\`}
              >
                <Truck size={12} className="text-amber-700" />
                <span>Cannot Get Direct • Courier Required ({cannotGetDirectCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryFilter("DIRECT_WALKIN")}
                className={\`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 \${
                  deliveryFilter === "DIRECT_WALKIN"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100"
                }\`}
              >
                <span>🤝 Direct Walk-in ({directWalkinCount})</span>
              </button>
            </div>
          </div>`;

if (content.includes(oldFilterToolbar)) {
  content = content.replace(oldFilterToolbar, newFilterToolbar);
}

// 11. Table header: Add Collection / Delivery Mode & colSpan=8
const oldThead = `                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Job No &amp; Date</th>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">Equipment &amp; Serial #</th>
                    <th className="py-3 px-4">Senthil Repair Assessment &amp; Scope</th>
                    <th className="py-3 px-4">Quotation / Value</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredServiceJobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                        No service jobs match your current filter.
                      </td>
                    </tr>`;

const newThead = `                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Job No &amp; Date</th>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">Collection / Delivery Mode</th>
                    <th className="py-3 px-4">Equipment &amp; Serial #</th>
                    <th className="py-3 px-4">Senthil Repair Assessment &amp; Scope</th>
                    <th className="py-3 px-4">Quotation / Value</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredServiceJobs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                        No service jobs match your current filter.
                      </td>
                    </tr>`;

if (content.includes(oldThead)) {
  content = content.replace(oldThead, newThead);
}

// 12. Table row: Add Collection / Delivery Mode cell
const oldTableRowCust = `                          {/* Customer Details */}
                          <td className="py-3 px-4 min-w-[180px]">
                            <div className="font-bold text-slate-900">{j.customer?.name || "Customer"}</div>
                            <div className="text-[11px] text-slate-600 font-medium">
                              {j.customer?.phone || ""} {j.customer?.city ? \`• \${j.customer.city}\` : ""}
                            </div>
                            {j.customer?.contactPerson && (
                              <div className="text-[10px] text-slate-400">Attn: {j.customer.contactPerson}</div>
                            )}
                          </td>`;

const newTableRowCust = `                          {/* Customer Details */}
                          <td className="py-3 px-4 min-w-[180px]">
                            <div className="font-bold text-slate-900">{j.customer?.name || "Customer"}</div>
                            <div className="text-[11px] text-slate-600 font-medium">
                              {j.customer?.phone || ""} {j.customer?.city ? \`• \${j.customer.city}\` : ""}
                            </div>
                            {j.customer?.contactPerson && (
                              <div className="text-[10px] text-slate-400">Attn: {j.customer.contactPerson}</div>
                            )}
                          </td>

                          {/* Collection / Delivery Mode (Direct Walk-in vs Cannot Get Direct / Courier) */}
                          <td className="py-3 px-4 min-w-[175px]">
                            {(() => {
                              const delInfo = getDeliveryModeInfo(j);
                              if (delInfo.cannotGetDirect) {
                                return (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-black bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
                                      <Truck size={12} className="text-amber-700" />
                                      <span>Cannot Get Direct (Courier)</span>
                                    </span>
                                    <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                                      <Package size={12} className="text-teal-700 shrink-0" />
                                      <span>{delInfo.courierPartner}</span>
                                    </div>
                                    {delInfo.docketOrRef ? (
                                      <div className="text-[10px] text-emerald-800 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                                        Docket: {delInfo.docketOrRef}
                                      </div>
                                    ) : (
                                      <div className="text-[10px] text-slate-500 font-medium">
                                        📍 To: {delInfo.destinationCity}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              if (delInfo.isFieldPickup) {
                                return (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                                      <MapPin size={11} className="text-blue-700" />
                                      <span>🚗 Field Delivery</span>
                                    </span>
                                    <div className="text-[10.5px] text-slate-500">
                                      Site drop at {delInfo.destinationCity}
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-300">
                                    <span>🤝 Direct Walk-in</span>
                                  </span>
                                  <div className="text-[10.5px] text-slate-600 font-medium">
                                    Counter pickup at Coimbatore
                                  </div>
                                  {delInfo.repPerson && (
                                    <div className="text-[10px] text-slate-500">
                                      Attn: {delInfo.repPerson}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>`;

if (content.includes(oldTableRowCust)) {
  content = content.replace(oldTableRowCust, newTableRowCust);
}

// 13. Modal Header: Add delivery badge
const oldModalHeaderRight = `              <div className="flex items-center gap-2">
                <span className={\`hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border \${
                  selectedPricingJob.workflow?.approvedByMd || selectedPricingJob.workflow?.stage === "PRICE_APPROVED_BY_MD"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                    : selectedPricingJob.workflow?.stage === "READY_FOR_HANDOVER"
                    ? "bg-blue-500/20 text-blue-300 border-blue-400/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-400/30"
                }\`}>
                  {selectedPricingJob.workflow?.stage?.replace(/_/g, " ") || selectedPricingJob.status}
                </span>`;

const newModalHeaderRight = `              <div className="flex items-center gap-2">
                {getDeliveryModeInfo(selectedPricingJob).cannotGetDirect ? (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-amber-500/25 text-amber-200 border border-amber-400/40">
                    <Truck size={11} />
                    <span>Cannot Get Direct • Courier Needed</span>
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    <span>🤝 Direct Walk-in</span>
                  </span>
                )}
                <span className={\`hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border \${
                  selectedPricingJob.workflow?.approvedByMd || selectedPricingJob.workflow?.stage === "PRICE_APPROVED_BY_MD"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                    : selectedPricingJob.workflow?.stage === "READY_FOR_HANDOVER"
                    ? "bg-blue-500/20 text-blue-300 border-blue-400/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-400/30"
                }\`}>
                  {selectedPricingJob.workflow?.stage?.replace(/_/g, " ") || selectedPricingJob.status}
                </span>`;

if (content.includes(oldModalHeaderRight)) {
  content = content.replace(oldModalHeaderRight, newModalHeaderRight);
}

// 14. Customer Card in Modal: Add Collection Status line
const oldModalCustCard = `                  <div className="text-slate-400 text-[10.5px] pt-0.5">
                    GSTIN: <span className="font-mono font-semibold text-slate-700">{selectedPricingJob.customer?.gstin || "Unregistered"}</span>
                  </div>
                </div>`;

const newModalCustCard = `                  <div className="text-slate-400 text-[10.5px] pt-0.5">
                    GSTIN: <span className="font-mono font-semibold text-slate-700">{selectedPricingJob.customer?.gstin || "Unregistered"}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200/90 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Collection Status:</span>
                    {getDeliveryModeInfo(selectedPricingJob).cannotGetDirect ? (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-black text-amber-950 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                        <Truck size={11} className="text-amber-700" />
                        <span>Cannot Get Direct • Courier ({getDeliveryModeInfo(selectedPricingJob).courierPartner})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                        <span>🤝 Direct Walk-in Collection</span>
                      </span>
                    )}
                  </div>
                </div>`;

if (content.includes(oldModalCustCard)) {
  content = content.replace(oldModalCustCard, newModalCustCard);
}

// 15. Section 4: Add prominent 2-card selector for "Can Customer Collect Product in Direct?"
const oldHandoverInputs = `                  {/* Handover Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white p-3 rounded-xl border border-emerald-200/90 shadow-2xs">`;

const newHandoverInputs = `                  {/* Can customer get product in direct toggle card */}
                  <div className="bg-white p-3 rounded-xl border border-emerald-200/90 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <label className="text-slate-800 font-bold text-xs flex items-center gap-1.5">
                        <Truck size={14} className="text-emerald-700" />
                        <span>Can Customer Collect Product in Direct?</span>
                      </label>
                      <span className="text-[10.5px] font-semibold text-slate-500">
                        Destination: <strong>{selectedPricingJob.customer?.city || "Outstation"}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPricingHandoverType("COURIER")}
                        className={\`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer \${
                          pricingHandoverType === "COURIER"
                            ? "bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-300 shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }\`}
                      >
                        <div className={\`p-1.5 rounded-lg shrink-0 \${pricingHandoverType === "COURIER" ? "bg-amber-600 text-white" : "bg-slate-200 text-slate-600"}\`}>
                          <Truck size={15} />
                        </div>
                        <div>
                          <b className="text-xs block">📦 No — Cannot Get in Direct</b>
                          <span className="text-[10.5px] text-slate-500 block leading-tight mt-0.5">
                            Customer is outstation / requires courier parcel dispatch to {selectedPricingJob.customer?.city || "customer works"}
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPricingHandoverType("DIRECT_HANDOVER")}
                        className={\`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer \${
                          pricingHandoverType === "DIRECT_HANDOVER"
                            ? "bg-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-300 shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }\`}
                      >
                        <div className={\`p-1.5 rounded-lg shrink-0 \${pricingHandoverType === "DIRECT_HANDOVER" ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}\`}>
                          <Users size={15} />
                        </div>
                        <div>
                          <b className="text-xs block">🤝 Yes — Direct Walk-in</b>
                          <span className="text-[10.5px] text-slate-500 block leading-tight mt-0.5">
                            Customer representative will visit in-person for counter collection at Coimbatore Works
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Handover Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white p-3 rounded-xl border border-emerald-200/90 shadow-2xs">`;

if (content.includes(oldHandoverInputs)) {
  content = content.replace(oldHandoverInputs, newHandoverInputs);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated src/app/quotations/page.tsx with delivery mode & cannot-get-direct features!');
