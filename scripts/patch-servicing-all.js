const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/components/forms/ServicingJobForm.tsx');
let code = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Fix Lucide imports
code = code.replace(
  `} from 'lucide-react';`,
  `  IndianRupee,\n  Sparkles,\n  Paperclip,\n  FileText,\n  Download,\n} from 'lucide-react';`
);

// 2. Fix type imports
code = code.replace(
  `import type { ServiceJob, ServiceProduct, RepairCategory, JobStatus } from '@/types/service-job';`,
  `import type { ServiceJob, ServiceProduct, RepairCategory, JobStatus, ProofCategory, WorkflowStage, ServiceAttachment, JobWorkflowInfo } from '@/types/service-job';`
);

// 3. Add component imports
code = code.replace(
  `import FormCompletionCelebration from './FormCompletionCelebration';`,
  `import FormCompletionCelebration from './FormCompletionCelebration';\nimport ServiceWorkflowPipeline from './ServiceWorkflowPipeline';\nimport AddOlderFormModal from '@/components/AddOlderFormModal';\nimport { dispatchWorkflowAlert } from '@/lib/workflow-service';`
);

// 4. Inject saveJobRecordDirect and workflow handlers
const handlersCode = `
  const [stageFilter, setStageFilter] = useState<'ALL' | 'INTAKE' | 'VERIFICATION' | 'REPAIR' | 'MD_APPROVAL' | 'DELIVERY'>('ALL');

  const isMainOfficeIntake = useMemo(() => {
    const u = (currentUserEmail || '').toLowerCase();
    return Boolean(u && (u.includes('admin') || u.includes('md') || u.includes('priya') || u.includes('azhalaku')));
  }, [currentUserEmail]);

  function saveJobRecordDirect(updated: ServiceJob) {
    try {
      const recordToSave: ServiceJob = {
        ...updated,
        createdBy: updated.createdBy || currentUserEmail,
        updatedAt: new Date().toISOString()
      };

      const hasCust = Boolean(recordToSave.customer?.name);
      const hasProd = Boolean(recordToSave.products && recordToSave.products.some(p => p.productName));
      if (hasCust && hasProd && (!recordToSave.workflow?.stage || recordToSave.workflow?.stage === 'INTAKE_RECEIVED') && !recordToSave.workflow?.aravindhAlertSentAt) {
        recordToSave.workflow = {
          ...(recordToSave.workflow || { stage: 'AWAITING_ARAVINDH_ACCEPT' as WorkflowStage }),
          stage: 'AWAITING_ARAVINDH_ACCEPT' as WorkflowStage,
          aravindhAlertSentAt: new Date().toISOString(),
          intakeStaffName: recordToSave.createdBy || currentUserEmail,
        };
        const pName = (recordToSave.products || [])[0]?.productName || 'Equipment';
        const pQty = (recordToSave.products || [])[0]?.qty || 1;
        dispatchWorkflowAlert({
          jobId: String(recordToSave.id || recordToSave.jobNo),
          jobNo: String(recordToSave.jobNo || recordToSave.id),
          customerName: recordToSave.customer?.name || 'Customer',
          equipmentName: \`\${pName} (Qty: \${pQty})\`,
          fromUser: recordToSave.createdBy || currentUserEmail,
          stage: 'AWAITING_ARAVINDH_ACCEPT',
          targetRole: 'ARAVINDH',
          targetNames: ['Aravindh', 'aravindh', 'aravind'],
          title: \`⚡ New Equipment Saved: \${pName} - Aravindh Please Accept\`,
          message: \`Job #\${recordToSave.jobNo}: Logged and saved by \${recordToSave.createdBy || currentUserEmail}. Product: \${pName} (Qty: \${pQty}) for \${recordToSave.customer?.name || 'Customer'}. Aravindh: Please locate physical equipment in workshop, upload inspection photo, and click Accept Process.\`,
          priority: 'urgent',
        });
      }

      const raw = localStorage.getItem('nunes:service_jobs');
      const list: ServiceJob[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(x => String(x.id) === String(recordToSave.id));
      if (idx >= 0) {
        list[idx] = recordToSave;
      } else {
        list.unshift(recordToSave);
      }
      localStorage.setItem('nunes:service_jobs', JSON.stringify(list));
      setSavedJobsList(list);
      void syncFormToCloud("servicing", String(recordToSave.jobNo || recordToSave.id), String(recordToSave.customer?.name || "Customer"), recordToSave);
    } catch {}
  }

  // --- COLLABORATIVE WORKFLOW ACTION HANDLERS ---
  const handleSendToAravindh = () => {
    const pName = (job.products || [])[0]?.productName || 'Equipment';
    const pQty = (job.products || [])[0]?.qty || 1;
    const pModel = (job.products || [])[0]?.makeModel ? \` (\${(job.products || [])[0]?.makeModel})\` : '';

    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      stage: 'AWAITING_ARAVINDH_ACCEPT' as WorkflowStage,
      intakeStaffName: currentUserEmail,
      receivedAt: job.workflow?.receivedAt || new Date().toISOString(),
      aravindhAlertSentAt: new Date().toISOString(),
    };

    const updatedJob: ServiceJob = {
      ...job,
      status: 'ESTIMATE_PENDING',
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    setJob(updatedJob);
    saveJobRecordDirect(updatedJob);

    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || 'Customer',
      equipmentName: \`\${pName}\${pModel} (Qty: \${pQty})\`,
      fromUser: currentUserEmail,
      stage: 'AWAITING_ARAVINDH_ACCEPT',
      targetRole: 'ARAVINDH',
      targetNames: ['Aravindh', 'aravindh', 'aravind'],
      title: \`⚡ Equipment for Repair: \${pName} (Qty: \${pQty})\`,
      message: \`Job #\${job.jobNo}: Logged by \${currentUserEmail}. Product: \${pName}\${pModel} for \${job.customer?.name || 'Customer'}. Aravindh: Please locate unit in workshop, upload physical verification photo, and click Accept Process.\`,
      priority: 'urgent',
    });

    setMessage(\`✓ Alert dispatched to Aravindh with product details! Awaiting Aravindh's real-time inspection & acceptance.\`);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleConfirmBranchPickup = () => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      aravindhBranchPickupDone: true,
      aravindhBranchPickupAt: new Date().toISOString(),
    };

    const updatedJob: ServiceJob = {
      ...job,
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    setJob(updatedJob);
    saveJobRecordDirect(updatedJob);

    const pName = (job.products || [])[0]?.productName || 'Equipment';
    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || 'Customer',
      equipmentName: pName,
      fromUser: 'Aravindh',
      stage: 'AWAITING_ARAVINDH_ACCEPT',
      targetRole: 'ALL',
      title: \`🚚 Aravindh Picked Up Job #\${job.jobNo} from Branch Office\`,
      message: \`Aravindh has picked up "\${pName}" from the Branch Office (Suganya/Radha) and brought it safely to the Main Office workshop for repair.\`,
      priority: 'normal',
    });

    setMessage(\`✓ Branch pickup confirmed! Equipment is now at the Main Office workshop.\`);
    setTimeout(() => setMessage(''), 4500);
  };

  const handleAravindhAccept = (photoUrl: string, notes?: string) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      stage: 'UNDER_REPAIR_ARAVINDH' as WorkflowStage,
      aravindhAcceptedBy: currentUserEmail,
      aravindhAcceptedAt: new Date().toISOString(),
      aravindhProductPhoto: photoUrl || job.workflow?.aravindhProductPhoto,
      aravindhInspectionNotes: notes || 'Product located in workshop and physical condition verified.',
      mechanicAssigned: 'Aravindh',
    };

    const updatedPhotos = photoUrl && !(job.proofPhotos || []).includes(photoUrl)
      ? [photoUrl, ...(job.proofPhotos || [])]
      : (job.proofPhotos || []);

    const updatedJob: ServiceJob = {
      ...job,
      status: 'REPAIRING',
      proofPhotos: updatedPhotos,
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    setJob(updatedJob);
    saveJobRecordDirect(updatedJob);

    const pName = (job.products || [])[0]?.productName || 'Equipment';
    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || 'Customer',
      equipmentName: pName,
      fromUser: 'Aravindh',
      stage: 'UNDER_REPAIR_ARAVINDH',
      targetRole: 'ALL',
      title: \`🔧 Aravindh Accepted Job #\${job.jobNo} (\${pName})\`,
      message: \`Aravindh located physical equipment in workshop, uploaded verification photo, and accepted repair. Repair is now in progress.\`,
      priority: 'normal',
    });

    setMessage(\`✓ Aravindh accepted equipment! Physical inspection photo saved. Moved to Stage 3: Service Repair.\`);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleAravindhSubmitScopeToPriya = (
    scope: 'MINIMUM_30' | 'MAXIMUM_50' | 'CUSTOM',
    notes: string,
    proofPhotos: string[],
    proofVideo?: string
  ) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      stage: 'AWAITING_PRIYA_PRICING' as WorkflowStage,
      mechanicAssigned: 'Aravindh',
      mechanicAssessment: notes,
      mechanicEstimateType: scope,
      repairCompletedAt: new Date().toISOString(),
      repairProofPhotos: proofPhotos,
      repairProofVideo: proofVideo,
      aravindhScopeSentToPriyaAt: new Date().toISOString(),
    };

    const updatedProducts = [...job.products];
    if (updatedProducts[0]) {
      updatedProducts[0] = {
        ...updatedProducts[0],
        repairCategory: scope,
        repairWork: notes,
        status: 'READY',
      };
    }

    const mergedPhotos = Array.from(new Set([...(job.proofPhotos || []), ...proofPhotos]));

    const updatedJob: ServiceJob = {
      ...job,
      status: 'ESTIMATE_PENDING',
      products: updatedProducts,
      proofPhotos: mergedPhotos,
      proofVideo: proofVideo || job.proofVideo,
      signoff: {
        ...job.signoff,
        repairedBy: 'Aravindh (Service & Repair)',
      },
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    setJob(updatedJob);
    saveJobRecordDirect(updatedJob);

    const prodName = (job.products || [])[0]?.productName || 'Equipment';
    const scopeLabel = scope === 'MINIMUM_30' ? '30% Min Repair' : scope === 'MAXIMUM_50' ? '50% Max Overhaul' : 'Custom Estimate';

    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || 'Customer',
      equipmentName: prodName,
      fromUser: 'Aravindh',
      stage: 'AWAITING_PRIYA_PRICING',
      targetRole: 'PRIYA',
      targetNames: ['Azhalaku Priya', 'azhalaku', 'priya', 'priya@nunesinstruments.com', 'azhalaku@nunesinstruments.com'],
      title: \`⚡ Aravindh Set \${scopeLabel} for Job #\${job.jobNo} — Priya Enter Price\`,
      message: \`Job #\${job.jobNo} (\${prodName}): Aravindh fitted \${scopeLabel}. Notes: "\${notes}". Proof media attached. Azhalaku Priya: Please enter the service pricing and submit to MD for approval.\`,
      priority: 'urgent',
    });

    setMessage(\`✓ Scope (\${scopeLabel}) saved & sent to Azhalaku Priya with all product details! Priya will enter pricing.\`);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleSenthilSubmitRepairWork = (
    notes: string,
    proofPhotos: string[],
    proofVideo?: string
  ) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      stage: 'AWAITING_PRIYA_PRICING' as WorkflowStage,
      mechanicAssigned: 'Senthil Kumar (Lead Service Mechanic)',
      mechanicAssessment: notes,
      repairCompletedAt: new Date().toISOString(),
      repairProofPhotos: proofPhotos,
      repairProofVideo: proofVideo,
      senthilScopeSentToPriyaAt: new Date().toISOString(),
    };

    const updatedProducts = [...job.products];
    if (updatedProducts[0]) {
      updatedProducts[0] = {
        ...updatedProducts[0],
        repairWork: notes,
        status: 'READY',
      };
    }

    const mergedPhotos = Array.from(new Set([...(job.proofPhotos || []), ...proofPhotos]));

    const updatedJob: ServiceJob = {
      ...job,
      status: 'ESTIMATE_PENDING',
      products: updatedProducts,
      proofPhotos: mergedPhotos,
      proofVideo: proofVideo || job.proofVideo,
      signoff: {
        ...job.signoff,
        repairedBy: 'Senthil Kumar (Lead Service Mechanic)',
      },
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    setJob(updatedJob);
    saveJobRecordDirect(updatedJob);

    const prodName = (job.products || [])[0]?.productName || 'Equipment';

    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || 'Customer',
      equipmentName: prodName,
      fromUser: 'Senthil Kumar',
      stage: 'AWAITING_PRIYA_PRICING',
      targetRole: 'PRIYA',
      targetNames: ['Azhalaku Priya', 'azhalaku', 'priya', 'priya@nunesinstruments.com', 'azhalaku@nunesinstruments.com'],
      title: \`⚡ Senthil Completed Repair on Job #\${job.jobNo} — Priya Enter Price\`,
      message: \`Job #\${job.jobNo} (\${prodName}): Senthil completed repair work. Notes: "\${notes}". Azhalaku Priya: Please enter commercial pricing and submit to MD for signoff.\`,
      priority: 'urgent',
    });

    setMessage(\`✓ Senthil repair submitted! Sent to Azhalaku Priya for commercial pricing.\`);
    setTimeout(() => setMessage(''), 5000);
  };

  const handlePriyaSubmitPriceToMd = (
    serviceEstimate: number,
    sparePartsCost: number,
    discount: number,
    gstRate: number,
    totalAmount: number,
    notes?: string
  ) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      stage: 'AWAITING_MD_APPROVAL' as WorkflowStage,
      priyaPricingEnteredBy: currentUserEmail,
      priyaPricingEnteredAt: new Date().toISOString(),
      priyaServiceCharge: serviceEstimate,
      priyaSparePartsCost: sparePartsCost,
      priyaDiscountAmount: discount,
      priyaGstRate: gstRate,
      priyaTotalQuotationAmount: totalAmount,
      priyaPricingNotes: notes,
      priyaPriceSentToMdAt: new Date().toISOString(),
    };

    const updatedProducts = [...job.products];
    if (updatedProducts[0]) {
      updatedProducts[0] = {
        ...updatedProducts[0],
        repairEstimate: serviceEstimate + sparePartsCost,
      };
    }

    const updatedJob: ServiceJob = {
      ...job,
      status: 'ESTIMATE_PENDING',
      products: updatedProducts,
      totals: {
        ...(job.totals || {}),
        subtotal: serviceEstimate + sparePartsCost,
        discount: discount,
        gstRate: gstRate,
        gstAmount: Math.round(((serviceEstimate + sparePartsCost - discount) * (gstRate / 100))),
        totalEstimate: totalAmount,
      },
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    setJob(updatedJob);
    saveJobRecordDirect(updatedJob);

    const prodName = (job.products || [])[0]?.productName || 'Equipment';

    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || 'Customer',
      equipmentName: prodName,
      fromUser: 'Azhalaku Priya',
      stage: 'AWAITING_MD_APPROVAL',
      targetRole: 'MD',
      targetNames: ['MD', 'Managing Director', 'md@nunesinstruments.com'],
      title: \`⚡ Price Approval Required: Job #\${job.jobNo} (₹\${totalAmount.toFixed(2)})\`,
      message: \`Azhalaku Priya submitted quotation price of ₹\${totalAmount.toFixed(2)} for \${job.customer?.name || 'Customer'} (\${prodName}). MD approval required.\`,
      amount: totalAmount,
      priority: 'urgent',
    });

    setMessage(\`✓ Quotation price ₹\${totalAmount.toFixed(2)} submitted to Managing Director for approval!\`);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleMdApprovePrice = (
    approvedPrice: number,
    discount?: number,
    mdNote?: string
  ) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      stage: 'PRICE_APPROVED_BY_MD' as WorkflowStage,
      isPriceApprovedByMd: true,
      customApprovedPrice: approvedPrice,
      mdApprovedAt: new Date().toISOString(),
      mdApprovedBy: currentUserEmail,
      mdApprovalNote: mdNote,
    };

    const updatedJob: ServiceJob = {
      ...job,
      status: 'APPROVED',
      totals: {
        ...(job.totals || {}),
        totalEstimate: approvedPrice,
      },
      signoff: {
        ...job.signoff,
        estimateConfirmedBy: currentUserEmail,
        estimateConfirmedAt: new Date().toISOString(),
      },
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    setJob(updatedJob);
    saveJobRecordDirect(updatedJob);

    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || 'Customer',
      equipmentName: (job.products || [])[0]?.productName || 'Equipment',
      fromUser: 'MD',
      stage: 'PRICE_APPROVED_BY_MD',
      targetRole: 'PRIYA',
      targetNames: ['Azhalaku Priya', 'azhalaku', 'priya', 'priya@nunesinstruments.com', 'azhalaku@nunesinstruments.com'],
      title: \`✓ MD Approved Price: ₹\${approvedPrice.toFixed(2)} for Job #\${job.jobNo}\`,
      message: \`MD approved ₹\${approvedPrice.toFixed(2)}! Priya: Send final quotation and prepare delivery.\`,
      amount: approvedPrice,
      priority: 'success',
    });

    setMessage(\`✓ MD successfully approved price ₹\${approvedPrice.toFixed(2)}! Dispatched alert to Azhalaku Priya.\`);
    setTimeout(() => setMessage(''), 5000);
  };

  const handlePriyaCompleteDeliveryAndQuotation = (
    handoverType: 'ARAVINDH_DIRECT_HANDOVER' | 'COURIER_DISPATCH' | 'WALK_IN_COLLECT',
    handoverDetail: string,
    courierName?: string,
    courierDocket?: string,
    completionNote?: string
  ) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      stage: 'JOB_COMPLETED' as WorkflowStage,
      priyaHandoverType: handoverType,
      priyaHandoverDetail: handoverDetail,
      priyaCourierName: courierName,
      priyaCourierDocket: courierDocket,
      priyaCompletionNote: completionNote,
      quotationSentToCustomerAt: new Date().toISOString(),
      finalHandoverCompletedAt: new Date().toISOString(),
    };

    const updatedJob: ServiceJob = {
      ...job,
      status: 'CLOSED',
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    setJob(updatedJob);
    saveJobRecordDirect(updatedJob);

    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || 'Customer',
      equipmentName: (job.products || [])[0]?.productName || 'Equipment',
      fromUser: 'Azhalaku Priya',
      stage: 'JOB_COMPLETED',
      targetRole: 'ALL',
      title: \`🎉 Job #\${job.jobNo} Completed & Delivered! (\${handoverType.replace(/_/g, ' ')})\`,
      message: \`Service job #\${job.jobNo} for \${job.customer?.name || 'Customer'} successfully delivered via \${handoverType.replace(/_/g, ' ')}. Final quotation dispatched.\`,
      priority: 'success',
    });

    setMessage(\`🎉 Job #\${job.jobNo} Completed! Delivery & quotation confirmed.\`);
    setTimeout(() => setMessage(''), 5000);
  };
`;

// Insert after currentUserEmail useEffect
const targetAnchor = `  useEffect(() => {
    try {
      const raw = localStorage.getItem('nunes_auth_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.email) setCurrentUserEmail(parsed.email);
      }
    } catch {}
  }, []);`;

code = code.replace(targetAnchor, targetAnchor + '\n' + handlersCode);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully patched ServicingJobForm.tsx');
