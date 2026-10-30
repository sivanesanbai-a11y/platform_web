const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/workshop/page.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const targetOld = `  // ACTION 1: Confirm Branch Pickup (Aravindh)
  const handleConfirmBranchPickup = (job: ServiceJob) => {
    const titleMsg = isModified
      ? \`✅ MD Adjusted & Approved ₹\${approvedPrice.toLocaleString("en-IN")} (Orig: ₹\${quotedAmount.toLocaleString("en-IN")}) for Job #\${job.jobNo}!\`
      : \`✅ MD Approved ₹\${approvedPrice.toLocaleString("en-IN")} for Job #\${job.jobNo}!\`;

    const bodyMsg = isModified
      ? \`MD adjusted quotation price to ₹\${approvedPrice.toLocaleString("en-IN")} (modified from Priya's quote of ₹\${quotedAmount.toLocaleString("en-IN")}) directly from Workshop Station. Azhalaku Priya: Please fill courier/delivery details and send updated quotation.\`
      : \`MD approved quotation price ₹\${approvedPrice.toLocaleString("en-IN")} directly from Workshop Station. Azhalaku Priya: Please fill courier/delivery details and send quotation to customer.\`;

    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: "PRICE_APPROVED_BY_MD" as WorkflowStage }),
      stage: "PRICE_APPROVED_BY_MD" as WorkflowStage,
      approvedByMd: true,
      mdApprovedPrice: approvedPrice,
      priyaTotalQuotationAmount: approvedPrice,
      mdPriceModified: isModified,
      originalQuotedPrice: quotedAmount,
      mdApprovedAt: new Date().toISOString(),
      mdApprovedBy: "MD (Managing Director)",
      mdReturnMessageToPriya: bodyMsg,
      mdPriceAlertSentToPriyaAt: new Date().toISOString(),
    };

    // Dispatch workflow alert back to Priya
    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || "Customer",
      customerPhone: job.customer?.phone || "",
      customerCity: job.customer?.city || "Coimbatore",
      equipmentName: job.products?.[0]?.productName || "Equipment",
      equipmentModel: job.products?.[0]?.makeModel || "",
      serialNo: job.products?.[0]?.serialNo || "",
      fromUser: "MD (Managing Director)",
      stage: "PRICE_APPROVED_BY_MD",
      targetRole: "PRIYA",
      targetNames: [
        "Azhalaku Priya",
        "azhalaku",
        "priya",
        "priya@nunesinstruments.com",
        "azhalaku@nunesinstruments.com",
      ],
      title: titleMsg,
      message: bodyMsg,
      amount: approvedPrice,
      priority: "urgent",
    });
    setTimeout(() => setStatusMessage(""), 6000);
  };`;

const targetNew = `  // ACTION 1: Confirm Branch Pickup (Aravindh)
  const handleConfirmBranchPickup = (job: ServiceJob) => {
    const updatedWf: JobWorkflowInfo = {
      ...(job.workflow || { stage: "AWAITING_ARAVINDH_ACCEPT" as WorkflowStage }),
      stage: "AWAITING_ARAVINDH_ACCEPT" as WorkflowStage,
      aravindhBranchPickupDone: true,
      aravindhBranchPickupAt: new Date().toISOString(),
      aravindhBranchPickupBy: currentUserEmail || "aravindh@nunesinstruments.com",
    };

    const updatedJob: ServiceJob = {
      ...job,
      status: "RECEIVED",
      workflow: updatedWf,
      updatedAt: new Date().toISOString(),
    };

    saveJobRecord(updatedJob);
    setStatusMessage(\`✓ Branch Pickup confirmed for Job #\${job.jobNo}! Equipment ready for physical verification.\`);
    setTimeout(() => setStatusMessage(""), 5000);
  };

  // ACTION 2: Physical Verification & Photo Upload (Aravindh)
  const handleVerifyByAravindh = (job: ServiceJob) => {
    const updatedWf: JobWorkflowInfo = {
      ...(job.workflow || { stage: "UNDER_REPAIR_SENTHIL" as WorkflowStage }),
      stage: "UNDER_REPAIR_SENTHIL" as WorkflowStage,
      aravindhPhysicalInspectionDone: true,
      aravindhInspectionAt: new Date().toISOString(),
      aravindhInspectionBy: currentUserEmail || "aravindh@nunesinstruments.com",
      aravindhProductPhoto: verificationPhoto || job.workflow?.aravindhProductPhoto,
      aravindhProductVideo: verificationVideo || job.workflow?.aravindhProductVideo,
      aravindhInspectionNotes: inspectionNotes.trim() || "Unit received in workshop. Exterior casing intact, sensor calibration required.",
      mechanicAssigned: "Senthil Kumar (Repair Engineer)",
    };

    const updatedJob: ServiceJob = {
      ...job,
      workflow: updatedWf,
      status: "REPAIRING",
      updatedAt: new Date().toISOString(),
    };

    saveJobRecord(updatedJob);
    setStatusMessage(\`✓ Equipment verified by Aravindh and handed to Senthil for repair!\`);

    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || "Customer",
      customerPhone: job.customer?.phone || "",
      customerCity: job.customer?.city || "Coimbatore",
      equipmentName: job.products?.[0]?.productName || "Equipment",
      equipmentModel: job.products?.[0]?.makeModel || "",
      serialNo: job.products?.[0]?.serialNo || "",
      fromUser: "Aravindh",
      stage: "UNDER_REPAIR_SENTHIL",
      targetRole: "SENTHIL",
      targetNames: ["Senthil Kumar", "senthil", "senthil@nunesinstruments.com"],
      title: \`🔧 Equipment Assigned: Job #\${job.jobNo} (\${job.products?.[0]?.productName || "Equipment"})\`,
      message: \`Aravindh verified \"\${job.products?.[0]?.productName || "Equipment"}\" and transferred to repair bay. Senthil: Please accept and begin technical repair.\`,
      priority: "normal",
    });

    setTimeout(() => setStatusMessage(""), 5000);
  };

  // ACTION 3: Senthil Bay Acceptance
  const handleSenthilAcceptProduct = (job: ServiceJob) => {
    const updatedWf: JobWorkflowInfo = {
      ...(job.workflow || { stage: "UNDER_REPAIR_SENTHIL" as WorkflowStage }),
      stage: "UNDER_REPAIR_SENTHIL" as WorkflowStage,
      senthilAcceptedAt: new Date().toISOString(),
      senthilAcceptedBy: currentUserEmail || "senthil@nunesinstruments.com",
    };

    const updatedJob: ServiceJob = {
      ...job,
      workflow: updatedWf,
      updatedAt: new Date().toISOString(),
    };

    saveJobRecord(updatedJob);
    setStatusMessage(\`✓ Product accepted into Senthil's repair bay for Job #\${job.jobNo}! Ready to start repairing.\`);
    setTimeout(() => setStatusMessage(""), 5000);
  };

  // ACTION 4: Senthil Start Repairing
  const handleSenthilStartRepair = (job: ServiceJob) => {
    const updatedWf: JobWorkflowInfo = {
      ...(job.workflow || { stage: "UNDER_REPAIR_SENTHIL" as WorkflowStage }),
      stage: "UNDER_REPAIR_SENTHIL" as WorkflowStage,
      repairStartedAt: new Date().toISOString(),
    };

    const updatedJob: ServiceJob = {
      ...job,
      workflow: updatedWf,
      status: "REPAIRING",
      updatedAt: new Date().toISOString(),
    };

    saveJobRecord(updatedJob);
    setStatusMessage(\`✓ Repair started on Job #\${job.jobNo}! Live repair timer is running.\`);
    setTimeout(() => setStatusMessage(""), 5000);
  };

  // ACTION 5: Senthil Repair Completion & Estimation (Scope, Spares, Photos)
  const handleSenthilCompleteRepair = (job: ServiceJob) => {
    const started = job.workflow?.repairStartedAt ? new Date(job.workflow.repairStartedAt).getTime() : Date.now() - 35 * 60000;
    const completed = Date.now();
    const durationMins = Math.max(1, Math.round((completed - started) / 60000));

    const updatedWf: JobWorkflowInfo = {
      ...(job.workflow || { stage: "AWAITING_PRIYA_PRICING" as WorkflowStage }),
      stage: "AWAITING_PRIYA_PRICING" as WorkflowStage,
      mechanicEstimateType: repairScope,
      mechanicAssessment: repairNotes.trim() || "Teardown complete. Replaced seals, re-soldered connection pads, zero & span recalibrated.",
      repairCompletedAt: new Date().toISOString(),
      repairDurationMinutes: durationMins,
      repairProofPhotos: repairPhotos.length > 0 ? repairPhotos : (job.workflow?.repairProofPhotos || []),
      repairProofVideo: repairVideo || job.workflow?.repairProofVideo,
      senthilScopeSentToPriyaAt: new Date().toISOString(),
    };

    const updatedJob: ServiceJob = {
      ...job,
      status: "ESTIMATE_PENDING",
      workflow: updatedWf,
      proofPhotos: repairPhotos.length > 0 ? repairPhotos : job.proofPhotos,
      proofVideo: repairVideo || job.proofVideo,
      updatedAt: new Date().toISOString(),
    };

    saveJobRecord(updatedJob);
    setStatusMessage(\`✓ Technical repair completed (\${durationMins} mins) and forwarded to Azhalaku Priya for pricing!\`);

    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || "Customer",
      customerPhone: job.customer?.phone || "",
      customerCity: job.customer?.city || "Coimbatore",
      equipmentName: job.products?.[0]?.productName || "Equipment",
      equipmentModel: job.products?.[0]?.makeModel || "",
      serialNo: job.products?.[0]?.serialNo || "",
      fromUser: "Senthil Kumar (Repair Engineer)",
      stage: "AWAITING_PRIYA_PRICING",
      targetRole: "PRIYA",
      targetNames: ["Azhalaku Priya", "azhalaku", "priya", "priya@nunesinstruments.com", "azhalaku@nunesinstruments.com"],
      title: \`💰 Pricing Required: Job #\${job.jobNo} (\${repairScope === "MAXIMUM_50" ? "50% Overhaul" : "30% Standard"})\`,
      message: \`Senthil finished overhaul (\${durationMins} mins) for \"\${job.products?.[0]?.productName || "Equipment"}\". Proof photos & notes attached. Priya: Please fill commercial pricing form and submit for MD approval.\`,
      priority: "urgent",
    });

    setTimeout(() => setStatusMessage(""), 5000);
  };

  // ACTION 6: 1-Click MD Approve Price on Completed Tab
  const handleMdApproveOnWorkshop = (job: ServiceJob, customApprovedPrice?: number) => {
    const quotedAmount = Number(job.workflow?.priyaTotalQuotationAmount || job.totals?.totalEstimate || 0);
    const approvedPrice = customApprovedPrice !== undefined ? customApprovedPrice : quotedAmount;
    const isModified = approvedPrice !== quotedAmount;

    const titleMsg = isModified
      ? \`✅ MD Adjusted & Approved ₹\${approvedPrice.toLocaleString("en-IN")} (Orig: ₹\${quotedAmount.toLocaleString("en-IN")}) for Job #\${job.jobNo}!\`
      : \`✅ MD Approved ₹\${approvedPrice.toLocaleString("en-IN")} for Job #\${job.jobNo}!\`;

    const bodyMsg = isModified
      ? \`MD adjusted quotation price to ₹\${approvedPrice.toLocaleString("en-IN")} (modified from Priya's quote of ₹\${quotedAmount.toLocaleString("en-IN")}) directly from Workshop Station. Azhalaku Priya: Please fill courier/delivery details and send updated quotation.\`
      : \`MD approved quotation price ₹\${approvedPrice.toLocaleString("en-IN")} directly from Workshop Station. Azhalaku Priya: Please fill courier/delivery details and send quotation to customer.\`;

    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: "PRICE_APPROVED_BY_MD" as WorkflowStage }),
      stage: "PRICE_APPROVED_BY_MD" as WorkflowStage,
      approvedByMd: true,
      mdApprovedPrice: approvedPrice,
      priyaTotalQuotationAmount: approvedPrice,
      mdPriceModified: isModified,
      originalQuotedPrice: quotedAmount,
      mdApprovedAt: new Date().toISOString(),
      mdApprovedBy: "MD (Managing Director)",
      mdReturnMessageToPriya: bodyMsg,
      mdPriceAlertSentToPriyaAt: new Date().toISOString(),
    };

    const updatedJob: ServiceJob = {
      ...job,
      workflow: updatedWorkflow,
      totals: {
        ...job.totals,
        totalEstimate: approvedPrice,
      },
      updatedAt: new Date().toISOString(),
    };

    saveJobRecord(updatedJob);
    setStatusMessage(
      isModified
        ? \`✅ MD Adjusted & Approved ₹\${approvedPrice.toLocaleString("en-IN")} (was ₹\${quotedAmount.toLocaleString("en-IN")}) for Job #\${job.jobNo}! Alert sent to Priya.\`
        : \`✅ MD Approved ₹\${approvedPrice.toLocaleString("en-IN")} for Job #\${job.jobNo}! Alert sent to Priya.\`
    );

    // Dispatch workflow alert back to Priya
    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || "Customer",
      customerPhone: job.customer?.phone || "",
      customerCity: job.customer?.city || "Coimbatore",
      equipmentName: job.products?.[0]?.productName || "Equipment",
      equipmentModel: job.products?.[0]?.makeModel || "",
      serialNo: job.products?.[0]?.serialNo || "",
      fromUser: "MD (Managing Director)",
      stage: "PRICE_APPROVED_BY_MD",
      targetRole: "PRIYA",
      targetNames: [
        "Azhalaku Priya",
        "azhalaku",
        "priya",
        "priya@nunesinstruments.com",
        "azhalaku@nunesinstruments.com",
      ],
      title: titleMsg,
      message: bodyMsg,
      amount: approvedPrice,
      priority: "urgent",
    });
    setTimeout(() => setStatusMessage(""), 6000);
  };`;

if (code.includes('handleConfirmBranchPickup = (job: ServiceJob) => {')) {
  code = code.replace(targetOld, targetNew);
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('✓ Successfully restored workshop actions in workshop/page.tsx');
} else {
  console.log('Could not find handleConfirmBranchPickup in workshop/page.tsx');
}
