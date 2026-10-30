const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'workshop', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');
const isCRLF = content.includes('\r\n');
let code = content.replace(/\r\n/g, '\n');

// 1. Update handleAravindhAccept in workshop/page.tsx
const oldAravindhAccept = `  // ACTION 2: Real-Time Acceptance (Aravindh)
  const handleAravindhAccept = (job: ServiceJob) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: "INTAKE_RECEIVED" as WorkflowStage }),
      stage: "UNDER_REPAIR_ARAVINDH" as WorkflowStage,
      aravindhAcceptedBy: currentUserEmail,
      aravindhAcceptedAt: new Date().toISOString(),
      aravindhProductPhoto: verificationPhoto || job.workflow?.aravindhProductPhoto,
      aravindhInspectionNotes: inspectionNotes,
      mechanicAssigned: "Aravindh",
    };

    const updatedPhotos = verificationPhoto && !(job.proofPhotos || []).includes(verificationPhoto)
      ? [verificationPhoto, ...(job.proofPhotos || [])]
      : (job.proofPhotos || []);

    const updatedJob: ServiceJob = {
      ...job,
      status: "REPAIRING",
      proofPhotos: updatedPhotos,
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    saveJobRecord(updatedJob);

    const pName = job.products?.[0]?.productName || "Equipment";
    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || "Customer",
      equipmentName: pName,
      fromUser: "Aravindh",
      stage: "UNDER_REPAIR_ARAVINDH",
      targetRole: "ALL",
      title: \`🔧 Aravindh Accepted Job #\${job.jobNo} (\${pName})\`,
      message: \`Aravindh located physical equipment in workshop, uploaded verification photo, and accepted repair. Repair is in progress.\`,
      priority: "normal",
    });

    setStatusMessage(\`✓ Verification photo saved & job accepted! Moved to Stage 3: Repair Workbench.\`);
    setActiveTab("repair");
    setSelectedJobId(String(job.id || job.jobNo));
    setTimeout(() => setStatusMessage(""), 5000);
  };`;

const newAravindhAccept = `  // ACTION 2: Real-Time Acceptance (Aravindh -> Sends to Senthil)
  const handleAravindhAccept = (job: ServiceJob) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: "INTAKE_RECEIVED" as WorkflowStage }),
      stage: "UNDER_REPAIR_SENTHIL" as WorkflowStage,
      aravindhAcceptedBy: currentUserEmail,
      aravindhAcceptedAt: new Date().toISOString(),
      aravindhProductPhoto: verificationPhoto || job.workflow?.aravindhProductPhoto,
      aravindhInspectionNotes: inspectionNotes,
      mechanicAssigned: "Senthil Kumar (Repair Engineer)",
    };

    const updatedPhotos = verificationPhoto && !(job.proofPhotos || []).includes(verificationPhoto)
      ? [verificationPhoto, ...(job.proofPhotos || [])]
      : (job.proofPhotos || []);

    const updatedJob: ServiceJob = {
      ...job,
      status: "REPAIRING",
      proofPhotos: updatedPhotos,
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    saveJobRecord(updatedJob);

    const pName = job.products?.[0]?.productName || "Equipment";
    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || "Customer",
      equipmentName: pName,
      fromUser: "Aravindh",
      stage: "UNDER_REPAIR_SENTHIL",
      targetRole: "SENTHIL",
      targetNames: ["Senthil", "senthil", "senthilkumar"],
      title: \`⚡ Aravindh Verified Job #\${job.jobNo} — Senthil Begin Repair\`,
      message: \`Aravindh verified equipment physical condition and uploaded verification photo. Senthil: Please begin technical repair and fit 30%/50% scope.\`,
      priority: "urgent",
    });

    setStatusMessage(\`✓ Verification photo saved! Sent alert to Senthil (Repair Engineer) to start repair.\`);
    setActiveTab("repair");
    setSelectedJobId(String(job.id || job.jobNo));
    setTimeout(() => setStatusMessage(""), 5000);
  };`;

if (code.includes(oldAravindhAccept)) {
  code = code.replace(oldAravindhAccept, newAravindhAccept);
  console.log('1. Replaced handleAravindhAccept in workshop/page.tsx');
} else {
  console.error('Failed to locate handleAravindhAccept');
  process.exit(1);
}

// 2. Update handleSenthilSubmitRepair to also send 30%/50% scope to Priya
const oldSenthilSubmit = `  // ACTION 3: Senthil Save Technical Repair
  const handleSenthilSubmitRepair = (job: ServiceJob) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: "INTAKE_RECEIVED" as WorkflowStage }),
      mechanicAssigned: "Senthil Kumar (Lead Service Mechanic)",
      mechanicAssessment: repairNotes,
      repairCompletedAt: new Date().toISOString(),
      repairProofPhotos: repairPhotos,
      repairProofVideo: repairVideo,
    };

    const updatedProducts = [...job.products];
    if (updatedProducts[0]) {
      updatedProducts[0] = {
        ...updatedProducts[0],
        repairWork: repairNotes,
        status: "READY",
      };
    }

    const updatedJob: ServiceJob = {
      ...job,
      products: updatedProducts,
      proofPhotos: repairPhotos,
      proofVideo: repairVideo,
      signoff: {
        ...job.signoff,
        repairedBy: "Senthil Kumar (Lead Mechanic)",
      },
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    saveJobRecord(updatedJob);

    const pName = job.products?.[0]?.productName || "Equipment";
    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || "Customer",
      equipmentName: pName,
      fromUser: "Senthil Kumar",
      stage: "UNDER_REPAIR_SENTHIL",
      targetRole: "ARAVINDH",
      targetNames: ["Aravindh"],
      title: \`🔧 Senthil Finished Repair on Job #\${job.jobNo} (\${pName})\`,
      message: \`Senthil finished mechanical repair. Notes: "\${repairNotes}". Proof media uploaded. Aravindh: Please fit 30%/50% scope and send to Priya.\`,
      priority: "normal",
    });

    setStatusMessage(\`✓ Senthil Kumar saved technical repair work & proof photos!\`);
    setTimeout(() => setStatusMessage(""), 5000);
  };`;

const newSenthilSubmit = `  // ACTION 3: Senthil Completes Repair & Sends 30%/50% Scope to Azhalaku Priya
  const handleSenthilSubmitRepair = (job: ServiceJob) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: "INTAKE_RECEIVED" as WorkflowStage }),
      stage: "AWAITING_PRIYA_PRICING" as WorkflowStage,
      mechanicAssigned: "Senthil Kumar (Repair Engineer)",
      mechanicAssessment: repairNotes,
      mechanicEstimateType: repairScope,
      repairCompletedAt: new Date().toISOString(),
      repairProofPhotos: repairPhotos,
      repairProofVideo: repairVideo,
      senthilScopeSentToPriyaAt: new Date().toISOString(),
    };

    const updatedProducts = [...job.products];
    if (updatedProducts[0]) {
      updatedProducts[0] = {
        ...updatedProducts[0],
        repairCategory: repairScope,
        repairWork: repairNotes,
        status: "READY",
      };
    }

    const updatedJob: ServiceJob = {
      ...job,
      status: "ESTIMATE_PENDING",
      products: updatedProducts,
      proofPhotos: repairPhotos,
      proofVideo: repairVideo,
      signoff: {
        ...job.signoff,
        repairedBy: "Senthil Kumar (Repair Engineer)",
      },
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    saveJobRecord(updatedJob);

    const pName = job.products?.[0]?.productName || "Equipment";
    const scopeLabel = repairScope === "MAXIMUM_50" ? "50% Major Overhaul" : "30% Standard Service";

    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || "Customer",
      equipmentName: pName,
      fromUser: "Senthil Kumar",
      stage: "AWAITING_PRIYA_PRICING",
      targetRole: "PRIYA",
      targetNames: ["Azhalaku Priya", "azhalaku", "priya", "priya@nunesinstruments.com", "azhalaku@nunesinstruments.com"],
      title: \`⚡ Senthil Set \${scopeLabel} on Job #\${job.jobNo} — Priya Enter Price\`,
      message: \`Senthil completed repair and fitted \${scopeLabel}. Notes: "\${repairNotes}". Proof photos/video uploaded. Azhalaku Priya: Please calculate price and submit to MD.\`,
      priority: "urgent",
    });

    setStatusMessage(\`✓ Senthil Kumar completed repair & sent \${scopeLabel} to Azhalaku Priya!\`);
    setTimeout(() => setStatusMessage(""), 5000);
  };`;

if (code.includes(oldSenthilSubmit)) {
  code = code.replace(oldSenthilSubmit, newSenthilSubmit);
  console.log('2. Replaced handleSenthilSubmitRepair in workshop/page.tsx');
} else {
  console.error('Failed to locate handleSenthilSubmitRepair');
  process.exit(1);
}

// 3. Make 30%/50% scope selector visible to Senthil as well in JSX
code = code.replace(
  `{/* 30% / 50% Scope Selector (Fitted by Aravindh - hidden from Senthil) */}\n                  {!isSenthil && (`,
  `{/* 30% / 50% Scope Selector (Senthil Technical Assessment) */}\n                  {(`
);

// 4. Update Senthil's button in the repair workbench
code = code.replace(
  `<Check size={14} strokeWidth={3} /> Senthil: Save Technical Repair &amp; Proof Photos`,
  `<Send size={14} /> ✓ Complete Repair (\${repairScope === "MAXIMUM_50" ? "50%" : "30%"}) &amp; Send to Azhalaku Priya ➔`
);

const finalContent = isCRLF ? code.replace(/\n/g, '\r\n') : code;
fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('Successfully updated workshop/page.tsx');
