const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'forms', 'ServicingJobForm.tsx');
let content = fs.readFileSync(filePath, 'utf8');
const isCRLF = content.includes('\r\n');
let code = content.replace(/\r\n/g, '\n');

// 1. Update visibleSavedJobs & add stageFilter state
const oldVisibleSavedJobsTarget = `  // Separate worker accounts: individual workers only see jobs they created or are assigned to.
  // Admin and MD see all jobs and can filter by staff.
  const visibleSavedJobs = useMemo(() => {
    const user = (currentUserEmail || '').toLowerCase();
    const uKey = user.split('@')[0].replace(/[^a-z]/g, '');

    return savedJobsList.filter((j) => {
      // 1. Search text filter
      if (searchSaved.trim()) {
        const s = searchSaved.toLowerCase();
        const name = String(j.customer?.name || '').toLowerCase();
        const jobNo = String(j.jobNo || j.id || '').toLowerCase();
        const prod = (j.products || []).map((p: any) => String(p.productName || '')).join(' ').toLowerCase();
        if (!name.includes(s) && !jobNo.includes(s) && !prod.includes(s)) return false;
      }

      // 2. Admin & MD Master View: can view all or filter by selected staff
      if (isAdminOrMd) {
        if (staffFilter === 'ALL') return true;
        const target = staffFilter.toLowerCase();
        const createdBy = String(j.createdBy || '').toLowerCase();
        const intakeStaff = String(j.workflow?.intakeStaffName || j.workflow?.intakeBy || '').toLowerCase();
        const receivedBy = String(j.signoff?.receivedBy || '').toLowerCase();
        const repairedBy = String(j.signoff?.repairedBy || j.workflow?.mechanicAssigned || '').toLowerCase();
        const handoverBy = String(j.workflow?.handoverHandledBy || j.workflow?.handoverPerson || '').toLowerCase();
        return (
          createdBy.includes(target) ||
          intakeStaff.includes(target) ||
          receivedBy.includes(target) ||
          repairedBy.includes(target) ||
          handoverBy.includes(target)
        );
      }

      // 3. Regular Worker Account View: ONLY show the particular jobs they added or are handling
      const createdBy = String(j.createdBy || '').toLowerCase();
      const intakeStaff = String(j.workflow?.intakeStaffName || j.workflow?.intakeBy || '').toLowerCase();
      const receivedBy = String(j.signoff?.receivedBy || '').toLowerCase();
      const mrPerson = String(j.receipt?.personName || j.receipt?.pickedUpBy || '').toLowerCase();

      // Senthil: service mechanic - only show jobs he is repairing or created
      if (uKey.includes('senthil')) {
        const isUnderRepair = j.workflow?.stage === 'UNDER_REPAIR_ARAVINDH' || j.workflow?.stage === 'UNDER_REPAIR_SENTHIL';
        const repairedBy = String(j.signoff?.repairedBy || '').toLowerCase();
        const mechanic = String(j.workflow?.mechanicAssigned || '').toLowerCase();
        return isUnderRepair || repairedBy.includes('senthil') || mechanic.includes('senthil') || createdBy.includes('senthil');
      }

      // Aravindh: show jobs awaiting his acceptance, branch pickups, under repair by him, ready for handover, or created by him
      if (uKey.includes('aravind')) {
        const isAwaitingAccept = j.workflow?.stage === 'AWAITING_ARAVINDH_ACCEPT';
        const isUnderRepair = j.workflow?.stage === 'UNDER_REPAIR_ARAVINDH';
        const isBranchPickupPending = Boolean(j.workflow?.isBranchDelivery && !j.workflow?.aravindhBranchPickupDone);
        const isReadyForHandover = j.workflow?.stage === 'READY_FOR_HANDOVER';
        const handoverBy = String(j.workflow?.handoverHandledBy || j.workflow?.handoverPerson || '').toLowerCase();
        const mechanic = String(j.workflow?.mechanicAssigned || '').toLowerCase();
        return isAwaitingAccept || isUnderRepair || isBranchPickupPending || isReadyForHandover || handoverBy.includes('aravind') || mechanic.includes('aravind') || mrPerson.includes('aravind') || createdBy.includes('aravind');
      }

      // Azhalaku Priya: show jobs awaiting her pricing, price approved by MD, ready for handover, or created by her
      if (uKey.includes('priya') || uKey.includes('azhalaku')) {
        const isAwaitingPricing = j.workflow?.stage === 'AWAITING_PRIYA_PRICING';
        const isPriceApproved = j.workflow?.stage === 'PRICE_APPROVED_BY_MD';
        const isReadyForHandover = j.workflow?.stage === 'READY_FOR_HANDOVER';
        const isOwner = (
          (createdBy && (createdBy.includes('priya') || createdBy.includes('azhalaku'))) ||
          (intakeStaff && (intakeStaff.includes('priya') || intakeStaff.includes('azhalaku'))) ||
          (receivedBy && (receivedBy.includes('priya') || receivedBy.includes('azhalaku')))
        );
        return isAwaitingPricing || isPriceApproved || isReadyForHandover || isOwner;
      }

      // Front Office & Branch Intake staff (Suganya, Radha, Sabitha, Rekha)
      // Show ONLY the particular jobs they added or took intake for
      const isOwner = (
        (createdBy && (createdBy.includes(uKey) || uKey.includes(createdBy.split('@')[0]))) ||
        (intakeStaff && (intakeStaff.includes(uKey) || uKey.includes(intakeStaff.split('@')[0]))) ||
        (receivedBy && (receivedBy.includes(uKey) || uKey.includes(receivedBy.split('@')[0]))) ||
        (mrPerson && (mrPerson.includes(uKey) || uKey.includes(mrPerson.split('@')[0])))
      );

      return isOwner;
    });
  }, [savedJobsList, searchSaved, isAdminOrMd, staffFilter, currentUserEmail]);`;

const newVisibleSavedJobsReplacement = `  // Stage Filter for Global Visibility across ALL staff
  const [stageFilter, setStageFilter] = useState<string>('ALL');

  // GLOBAL VISIBILITY: All staff members can view and search ALL forms across all workflow stages.
  // Stage tabs allow filtering by: Branch Intake, Aravindh Verify, Senthil Repair (30%/50%), Priya Pricing, MD Approval, Quotation Sent, Completed.
  const visibleSavedJobs = useMemo(() => {
    return savedJobsList.filter((j) => {
      // 1. Search text filter
      if (searchSaved.trim()) {
        const s = searchSaved.toLowerCase();
        const name = String(j.customer?.name || '').toLowerCase();
        const jobNo = String(j.jobNo || j.id || '').toLowerCase();
        const phone = String(j.customer?.phone || '').toLowerCase();
        const prod = (j.products || [])
          .map((p: any) => \`\${p.productName || ''} \${p.makeModel || ''} \${p.serialNo || ''}\`)
          .join(' ')
          .toLowerCase();
        if (!name.includes(s) && !jobNo.includes(s) && !phone.includes(s) && !prod.includes(s)) {
          return false;
        }
      }

      // 2. Stage Filter
      const currentStage = j.workflow?.stage || 'INTAKE_RECEIVED';
      if (stageFilter === 'BRANCH_INTAKE') {
        const isBranch =
          Boolean(j.workflow?.isBranchDelivery) ||
          String(j.createdBy || '').toLowerCase().includes('suganya') ||
          String(j.createdBy || '').toLowerCase().includes('radha');
        return isBranch && (!j.workflow?.aravindhBranchPickupDone || currentStage === 'AWAITING_ARAVINDH_ACCEPT');
      }
      if (stageFilter === 'ARAVINDH_VERIFY') {
        return currentStage === 'AWAITING_ARAVINDH_ACCEPT';
      }
      if (stageFilter === 'SENTHIL_REPAIR') {
        return currentStage === 'UNDER_REPAIR_SENTHIL' || currentStage === 'UNDER_REPAIR_ARAVINDH';
      }
      if (stageFilter === 'PRIYA_PRICING') {
        return currentStage === 'AWAITING_PRIYA_PRICING';
      }
      if (stageFilter === 'MD_APPROVAL') {
        return currentStage === 'AWAITING_MD_APPROVAL';
      }
      if (stageFilter === 'QUOTATION_SENT') {
        return currentStage === 'PRICE_APPROVED_BY_MD' || currentStage === 'READY_FOR_HANDOVER';
      }
      if (stageFilter === 'COMPLETED') {
        return currentStage === 'JOB_COMPLETED' || j.status === 'CLOSED';
      }

      // 3. Worker Filter (Optional filter by worker name)
      if (staffFilter !== 'ALL') {
        const target = staffFilter.toLowerCase();
        const createdBy = String(j.createdBy || '').toLowerCase();
        const intakeStaff = String(j.workflow?.intakeStaffName || j.workflow?.intakeBy || '').toLowerCase();
        const receivedBy = String(j.signoff?.receivedBy || '').toLowerCase();
        const repairedBy = String(j.signoff?.repairedBy || j.workflow?.mechanicAssigned || '').toLowerCase();
        const priyaStaff = String(j.workflow?.priyaPriceEnteredBy || '').toLowerCase();
        const handoverBy = String(j.workflow?.handoverHandledBy || j.workflow?.handoverPerson || '').toLowerCase();
        return (
          createdBy.includes(target) ||
          intakeStaff.includes(target) ||
          receivedBy.includes(target) ||
          repairedBy.includes(target) ||
          priyaStaff.includes(target) ||
          handoverBy.includes(target)
        );
      }

      // All forms shown to all persons
      return true;
    });
  }, [savedJobsList, searchSaved, stageFilter, staffFilter]);`;

if (code.includes(oldVisibleSavedJobsTarget)) {
  code = code.replace(oldVisibleSavedJobsTarget, newVisibleSavedJobsReplacement);
  console.log('1. Replaced visibleSavedJobs logic');
} else {
  console.error('Failed to locate visibleSavedJobs block');
  process.exit(1);
}

// 2. Replace Collaborative Workflow Action Handlers
const oldHandlersTarget = `  // --- COLLABORATIVE WORKFLOW ACTION HANDLERS ---
  const handleSendToAravindh = () => {`;

const oldHandlersEnd = `    setCelebrationData({
      recordNumber: String(job.jobNo || job.id),
      title: '🎉 Complete Workflow Cycle Closed!',
      subtitle: \`Quotation sent & delivery details logged via \${handoverType.replace('_', ' ')}. Well done team!\`,
    });
    setShowCelebration(true);
  };`;

const newHandlers = `  // --- COLLABORATIVE WORKFLOW ACTION HANDLERS (7-STEP END-TO-END PIPELINE) ---

  // STEP 1A: Branch Intake (Suganya / Radha) -> Dispatches to Aravindh for Branch Pickup
  const handleSendToAravindh = () => {
    const pName = (job.products || [])[0]?.productName || 'Equipment';
    const pQty = (job.products || [])[0]?.qty || 1;
    const pModel = (job.products || [])[0]?.makeModel ? \` (\${(job.products || [])[0]?.makeModel})\` : '';

    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      stage: 'AWAITING_ARAVINDH_ACCEPT' as WorkflowStage,
      intakeStaffName: currentUserEmail,
      receivedAt: job.workflow?.receivedAt || new Date().toISOString(),
      isBranchDelivery: true,
      branchOfficeName: 'Branch Company (Suganya / Radha)',
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
      title: \`⚡ Branch Pickup Required: \${pName} (Qty: \${pQty})\`,
      message: \`Job #\${job.jobNo}: Logged at Branch Office by \${currentUserEmail}. Product: \${pName}\${pModel} for \${job.customer?.name || 'Customer'}. Aravindh: Please pick up equipment from branch, bring to Main Office workshop, upload verification photo/video, and send to Senthil.\`,
      priority: 'urgent',
    });

    setMessage(\`✓ Alert dispatched to Aravindh for Branch Pickup! Awaiting Aravindh's verification.\`);
    setCelebrationData({
      recordNumber: String(job.jobNo || job.id),
      title: '✓ Branch Intake Complete & Dispatched to Aravindh!',
      subtitle: \`Equipment logged by \${currentUserEmail}. Alert sent to Aravindh for branch pickup & verification.\`,
    });
    setShowCelebration(true);
    setTimeout(() => setMessage(''), 5000);
  };

  // STEP 1B: Main Office Intake (Sabitha / Rekha / Priya) -> Direct to Senthil (NO Aravindh needed)
  const handleSendToSenthilDirect = () => {
    const pName = (job.products || [])[0]?.productName || 'Equipment';
    const pQty = (job.products || [])[0]?.qty || 1;
    const pModel = (job.products || [])[0]?.makeModel ? \` (\${(job.products || [])[0]?.makeModel})\` : '';

    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      stage: 'UNDER_REPAIR_SENTHIL' as WorkflowStage,
      intakeStaffName: currentUserEmail,
      receivedAt: job.workflow?.receivedAt || new Date().toISOString(),
      isBranchDelivery: false,
      senthilAlertSentAt: new Date().toISOString(),
      mechanicAssigned: 'Senthil Kumar (Repair Engineer)',
    };

    const updatedJob: ServiceJob = {
      ...job,
      status: 'REPAIRING',
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
      stage: 'UNDER_REPAIR_SENTHIL',
      targetRole: 'SENTHIL',
      targetNames: ['Senthil', 'senthil', 'senthilkumar'],
      title: \`⚡ Direct Main Office Intake: Senthil Begin Repair on #\${job.jobNo}\`,
      message: \`Job #\${job.jobNo}: Logged at Main Office by \${currentUserEmail}. Product: \${pName}\${pModel} for \${job.customer?.name || 'Customer'}. No Aravindh branch pickup required. Senthil: Please begin technical repair and fit 30%/50% scope.\`,
      priority: 'urgent',
    });

    setMessage(\`✓ Direct Main Office intake saved! Dispatched alert to Senthil (Repair Engineer) to start repair.\`);
    setCelebrationData({
      recordNumber: String(job.jobNo || job.id),
      title: '✓ Direct Intake Complete & Dispatched to Senthil!',
      subtitle: \`Equipment received at Main Office. Routed directly to Senthil (Repair Engineer).\`,
    });
    setShowCelebration(true);
    setTimeout(() => setMessage(''), 5000);
  };

  // STEP 2A: Aravindh Confirms Branch Pickup to Main Office
  const handleConfirmBranchPickup = () => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      aravindhBranchPickupDone: true,
      aravindhBranchPickupAt: new Date().toISOString(),
      stage: 'AWAITING_ARAVINDH_ACCEPT' as WorkflowStage,
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
      message: \`Aravindh has picked up "\${pName}" from Branch Office (Suganya/Radha) and brought it safely to Main Office workshop. Next: verification photo/video.\`,
      priority: 'normal',
    });

    setMessage(\`✓ Branch pickup confirmed! Equipment is now at the Main Office workshop.\`);
    setTimeout(() => setMessage(''), 4500);
  };

  // STEP 2B: Aravindh Physical Verification (Photo or Video) -> Sends to Senthil (Repair Engineer)
  const handleAravindhApproveAndSendToSenthil = (photoUrl: string, videoUrl?: string, notes?: string) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      stage: 'UNDER_REPAIR_SENTHIL' as WorkflowStage,
      aravindhAcceptedBy: currentUserEmail,
      aravindhAcceptedAt: new Date().toISOString(),
      aravindhProductPhoto: photoUrl || job.workflow?.aravindhProductPhoto,
      aravindhProductVideo: videoUrl || job.workflow?.aravindhProductVideo,
      aravindhInspectionNotes: notes || 'Product located in workshop and physical condition verified.',
      mechanicAssigned: 'Senthil Kumar (Repair Engineer)',
    };

    const updatedPhotos = photoUrl && !(job.proofPhotos || []).includes(photoUrl)
      ? [photoUrl, ...(job.proofPhotos || [])]
      : (job.proofPhotos || []);

    const updatedJob: ServiceJob = {
      ...job,
      status: 'REPAIRING',
      proofPhotos: updatedPhotos,
      proofVideo: videoUrl || job.proofVideo,
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
      stage: 'UNDER_REPAIR_SENTHIL',
      targetRole: 'SENTHIL',
      targetNames: ['Senthil', 'senthil', 'senthilkumar'],
      title: \`⚡ Aravindh Verified Job #\${job.jobNo} — Senthil Begin Repair\`,
      message: \`Aravindh verified equipment physical condition and uploaded verification photo/video. Senthil: Please start repair work, upload completion proof, and fit 30%/50% scope.\`,
      priority: 'urgent',
    });

    setMessage(\`✓ Aravindh verified equipment! Sent message to Senthil (Repair Engineer) to start work.\`);
    setTimeout(() => setMessage(''), 5000);
  };

  // Compatibility alias for Aravindh Accept
  const handleAravindhAccept = (photoUrl: string, notes?: string) => {
    handleAravindhApproveAndSendToSenthil(photoUrl, undefined, notes);
  };

  // STEP 3: Senthil (Repair Engineer) - Completes Repair, Uploads Proof Media, Fits 30%/50% Scope -> Sends to Azhalaku Priya
  const handleSenthilSubmitRepairToPriya = (
    scope: 'MINIMUM_30' | 'MAXIMUM_50' | 'CUSTOM',
    notes: string,
    proofPhotos: string[],
    proofVideo?: string
  ) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      stage: 'AWAITING_PRIYA_PRICING' as WorkflowStage,
      mechanicAssigned: 'Senthil Kumar (Repair Engineer)',
      mechanicAssessment: notes,
      mechanicEstimateType: scope,
      repairCompletedAt: new Date().toISOString(),
      repairProofPhotos: proofPhotos,
      repairProofVideo: proofVideo,
      senthilScopeSentToPriyaAt: new Date().toISOString(),
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
        repairedBy: 'Senthil Kumar (Repair Engineer)',
      },
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    setJob(updatedJob);
    saveJobRecordDirect(updatedJob);

    const prodName = (job.products || [])[0]?.productName || 'Equipment';
    const scopeLabel = scope === 'MINIMUM_30' ? '30% Standard Service' : scope === 'MAXIMUM_50' ? '50% Major Overhaul' : 'Custom Estimate';

    // Dispatches immediate alert & details to Azhalaku Priya
    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || 'Customer',
      equipmentName: prodName,
      fromUser: 'Senthil Kumar',
      stage: 'AWAITING_PRIYA_PRICING',
      targetRole: 'PRIYA',
      targetNames: ['Azhalaku Priya', 'azhalaku', 'priya', 'priya@nunesinstruments.com', 'azhalaku@nunesinstruments.com'],
      title: \`⚡ Senthil Set \${scopeLabel} on Job #\${job.jobNo} — Priya Enter Price\`,
      message: \`Job #\${job.jobNo} (\${prodName}): Senthil completed repair and fitted \${scopeLabel}. Notes: "\${notes}". Proof media uploaded. Azhalaku Priya: Please enter the service pricing (discount + 18% GST) and submit to MD.\`,
      priority: 'urgent',
    });

    setMessage(\`✓ Senthil completed repair & fitted \${scopeLabel}! Sent to Azhalaku Priya with all details.\`);
    setTimeout(() => setMessage(''), 5500);
  };

  // Compatibility alias for Aravindh Scope
  const handleAravindhSubmitScopeToPriya = handleSenthilSubmitRepairToPriya;
  const handleSenthilSubmitRepairWork = (notes: string, proofPhotos: string[], proofVideo?: string) => {
    handleSenthilSubmitRepairToPriya('MINIMUM_30', notes, proofPhotos, proofVideo);
  };

  // STEP 4: Azhalaku Priya Pricing -> Submits Pricing Breakdown to MD for Approval
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
      priyaPriceEnteredBy: currentUserEmail,
      priyaPriceEnteredAt: new Date().toISOString(),
      priyaRepairEstimate: serviceEstimate,
      priyaSparePartsCost: sparePartsCost,
      priyaDiscount: discount,
      priyaGstRate: gstRate,
      priyaTotalQuotationAmount: totalAmount,
      priyaPricingNotes: notes || '',
      priyaPriceSentToMdAt: new Date().toISOString(),
    };

    const updatedProducts = [...job.products];
    if (updatedProducts[0]) {
      updatedProducts[0] = {
        ...updatedProducts[0],
        repairEstimate: serviceEstimate,
      };
    }

    const updatedJob: ServiceJob = {
      ...job,
      status: 'APPROVAL_PENDING',
      products: updatedProducts,
      totals: {
        ...job.totals,
        repairEstimate: serviceEstimate,
        discount: discount,
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
      targetNames: ['MD', 'Managing Director', 'Director'],
      title: \`🔔 Priya Quoted ₹\${totalAmount.toFixed(2)} for Job #\${job.jobNo} — MD Approval Required\`,
      message: \`Azhalaku Priya prepared service pricing for "\${prodName}" (\${job.customer?.name || 'Customer'}): Service ₹\${serviceEstimate} + Parts ₹\${sparePartsCost} - Discount ₹\${discount} + \${gstRate}% GST = Total ₹\${totalAmount.toFixed(2)}. MD approval needed.\`,
      amount: totalAmount,
      priority: 'urgent',
    });

    setMessage(\`✓ Service price ₹\${totalAmount.toFixed(2)} submitted by Priya! Alert sent to MD for approval.\`);
    setTimeout(() => setMessage(''), 5000);
  };

  // STEP 5: MD Approval Gateway -> MD can Edit Price / Add Discount & Approve -> Returns to Priya
  const handleMdApprovePrice = (approvedPrice: number, discount?: number, mdNote?: string) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      stage: 'PRICE_APPROVED_BY_MD' as WorkflowStage,
      approvedByMd: true,
      mdApprovedPrice: approvedPrice,
      mdDiscount: discount,
      mdApprovalNotes: mdNote || 'Price approved for customer quotation and equipment handover.',
      mdApprovedAt: new Date().toISOString(),
      mdApprovedBy: currentUserEmail,
      mdPriceAlertSentToPriyaAt: new Date().toISOString(),
    };

    const updatedProducts = [...job.products];
    if (updatedProducts[0]) {
      updatedProducts[0] = {
        ...updatedProducts[0],
        repairEstimate: approvedPrice,
      };
    }

    const updatedJob: ServiceJob = {
      ...job,
      products: updatedProducts,
      totals: {
        ...job.totals,
        discount: discount !== undefined ? discount : job.totals.discount,
        totalEstimate: approvedPrice,
      },
      signoff: {
        ...job.signoff,
        estimateConfirmedBy: 'Managing Director (MD)',
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
      fromUser: 'MD',
      stage: 'PRICE_APPROVED_BY_MD',
      targetRole: 'PRIYA',
      targetNames: ['Azhalaku Priya', 'azhalaku', 'priya', 'priya@nunesinstruments.com', 'azhalaku@nunesinstruments.com'],
      title: \`✅ MD Approved ₹\${approvedPrice.toFixed(2)} for Job #\${job.jobNo}!\`,
      message: \`MD has approved/adjusted quotation price of ₹\${approvedPrice.toFixed(2)} for "\${prodName}". Azhalaku Priya: Please dispatch formal quotation to customer via WhatsApp/Email and set delivery handover.\`,
      amount: approvedPrice,
      priority: 'urgent',
    });

    setMessage(\`✓ MD approved price ₹\${approvedPrice.toFixed(2)}! Dispatched notification back to Azhalaku Priya to send quotation.\`);
    setTimeout(() => setMessage(''), 5000);
  };

  // STEP 6: Azhalaku Priya Delivery Details & Quotation Send (Awaiting Customer Payment)
  const handlePriyaCompleteDeliveryAndQuotation = (
    handoverType: 'COURIER' | 'DIRECT_HANDOVER' | 'FIELD_PICKUP',
    recipientOrDocket: string,
    courierName?: string,
    notes?: string
  ) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      stage: 'READY_FOR_HANDOVER' as WorkflowStage,
      priyaHandoverType: handoverType,
      priyaDeliveryPersonName: handoverType !== 'COURIER' ? recipientOrDocket : undefined,
      priyaCourierDocket: handoverType === 'COURIER' ? recipientOrDocket : undefined,
      priyaCourierName: handoverType === 'COURIER' ? (courierName || 'ST Courier') : undefined,
      priyaQuotationSentAt: new Date().toISOString(),
      priyaCompletionNotes: notes || 'Delivery details confirmed and quotation dispatched to client.',
      handoverType: handoverType === 'COURIER' ? 'COURIER' : (handoverType === 'DIRECT_HANDOVER' ? 'ARAVINDH' : 'FIELD_PICKUP'),
      courierOrHandoverDetails: \`\${handoverType}: \${courierName ? courierName + ' - ' : ''}\${recipientOrDocket}\`,
      handoverHandledBy: 'Azhalaku Priya',
      quotationSentBy: 'Azhalaku Priya',
      quotationSentAt: new Date().toISOString(),
    };

    const updatedJob: ServiceJob = {
      ...job,
      status: 'READY',
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    setJob(updatedJob);
    saveJobRecordDirect(updatedJob);

    const prodName = (job.products || [])[0]?.productName || 'Equipment';
    const handoverLabel = handoverType === 'COURIER'
      ? \`Courier (\${courierName || 'ST Courier'} Docket: \${recipientOrDocket})\`
      : (handoverType === 'DIRECT_HANDOVER' ? \`Direct Handover to \${recipientOrDocket}\` : \`Field Pickup by \${recipientOrDocket}\`);

    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || 'Customer',
      equipmentName: prodName,
      fromUser: 'Azhalaku Priya',
      stage: 'READY_FOR_HANDOVER',
      targetRole: 'ALL',
      title: \`📦 Job #\${job.jobNo} Quotation Dispatched & Delivery Set!\`,
      message: \`Azhalaku Priya sent quotation to \${job.customer?.name || 'Customer'} and set delivery mode (\${handoverLabel}). Awaiting customer payment confirmation.\`,
      priority: 'urgent',
    });

    setMessage(\`✓ Delivery details saved & quotation dispatched! Waiting for customer payment.\`);
    setTimeout(() => setMessage(''), 5000);
  };

  // STEP 7: Customer Payment Received & Final Closure (Any Staff)
  const handleRecordPaymentAndCloseJob = (
    paymentMode: string,
    reference: string,
    amount: number,
    receivedBy: string,
    notes?: string
  ) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      stage: 'JOB_COMPLETED' as WorkflowStage,
      paymentMode,
      paymentReference: reference,
      paymentAmount: amount,
      paymentReceivedAt: new Date().toISOString(),
      paymentReceivedBy: receivedBy || currentUserEmail,
      paymentNotes: notes || '',
      finalHandoverCompletedAt: new Date().toISOString(),
    };

    const updatedJob: ServiceJob = {
      ...job,
      status: 'CLOSED',
      payment: {
        ...job.payment,
        mode: paymentMode,
        reference: reference,
        receivedBy: receivedBy || currentUserEmail,
        invoiceDate: new Date().toISOString(),
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
      fromUser: receivedBy || currentUserEmail,
      stage: 'JOB_COMPLETED',
      targetRole: 'ALL',
      title: \`🎉 Job #\${job.jobNo} Payment Received & Closed!\`,
      message: \`Payment of ₹\${amount.toLocaleString('en-IN')} confirmed via \${paymentMode} (\${reference}) by \${receivedBy || currentUserEmail}. Service job #\${job.jobNo} (\${prodName}) for \${job.customer?.name || 'Customer'} successfully completed and closed!\`,
      priority: 'success',
    });

    setCelebrationData({
      recordNumber: String(job.jobNo || job.id),
      title: '🎉 Payment Received & Job Card Closed!',
      subtitle: \`Payment of ₹\${amount.toLocaleString('en-IN')} received. Service cycle 100% completed!\`,
    });
    setShowCelebration(true);
    setMessage(\`✓ Payment confirmed and job #\${job.jobNo} closed successfully!\`);
    setTimeout(() => setMessage(''), 5000);
  };`;

const idxStart = code.indexOf(oldHandlersTarget);
const idxEnd = code.indexOf(oldHandlersEnd) + oldHandlersEnd.length;

if (idxStart !== -1 && idxEnd > idxStart) {
  code = code.slice(0, idxStart) + newHandlers + code.slice(idxEnd);
  console.log('2. Replaced collaborative workflow handlers');
} else {
  console.error('Failed to locate handlers block');
  process.exit(1);
}

// 3. Update <ServiceWorkflowPipeline ... /> invocation in JSX
const oldPipelineInvocation = `      <ServiceWorkflowPipeline
        job={job}
        currentUser={currentUserEmail}
        onSendToAravindh={handleSendToAravindh}
        onConfirmBranchPickup={handleConfirmBranchPickup}
        onAravindhAccept={handleAravindhAccept}
        onAravindhSubmitScopeToPriya={handleAravindhSubmitScopeToPriya}
        onSenthilSubmitRepairWork={handleSenthilSubmitRepairWork}
        onPriyaSubmitPriceToMd={handlePriyaSubmitPriceToMd}
        onMdApprovePrice={handleMdApprovePrice}
        onPriyaCompleteDeliveryAndQuotation={handlePriyaCompleteDeliveryAndQuotation}
        onOpenQuotation={() => setShowQuotation(true)}
      />`;

const newPipelineInvocation = `      <ServiceWorkflowPipeline
        job={job}
        currentUser={currentUserEmail}
        onSendToAravindh={handleSendToAravindh}
        onSendToSenthilDirect={handleSendToSenthilDirect}
        onConfirmBranchPickup={handleConfirmBranchPickup}
        onAravindhApproveAndSendToSenthil={handleAravindhApproveAndSendToSenthil}
        onAravindhAccept={handleAravindhAccept}
        onSenthilSubmitRepairToPriya={handleSenthilSubmitRepairToPriya}
        onSenthilSubmitRepairWork={handleSenthilSubmitRepairWork}
        onAravindhSubmitScopeToPriya={handleAravindhSubmitScopeToPriya}
        onPriyaSubmitPriceToMd={handlePriyaSubmitPriceToMd}
        onMdApprovePrice={handleMdApprovePrice}
        onPriyaCompleteDeliveryAndQuotation={handlePriyaCompleteDeliveryAndQuotation}
        onRecordPaymentAndCloseJob={handleRecordPaymentAndCloseJob}
        onOpenQuotation={() => setShowQuotation(true)}
      />`;

if (code.includes(oldPipelineInvocation)) {
  code = code.replace(oldPipelineInvocation, newPipelineInvocation);
  console.log('3. Updated ServiceWorkflowPipeline JSX invocation');
} else {
  console.error('Failed to locate ServiceWorkflowPipeline invocation');
  process.exit(1);
}

// 4. Update Saved Jobs Modal Header and Stage Filter Pills
const oldModalHeader = `                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderOpen size={18} style={{ color: '#0f766e' }} />
                  <span>
                    {isAdminOrMd 
                      ? \`All Saved Service Jobs (\${visibleSavedJobs.length})\` 
                      : \`My Saved Service Jobs (\${visibleSavedJobs.length})\`}
                  </span>
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {isAdminOrMd 
                    ? \`Master Administration View • Showing jobs across all staff members\` 
                    : \`Account: \${currentUserEmail} • Showing only the particular jobs you created or handle\`}
                </p>`;

const newModalHeader = `                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderOpen size={18} style={{ color: '#0f766e' }} />
                  <span>All Service Jobs Directory ({visibleSavedJobs.length})</span>
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Global Visibility Active • Visible to all staff members across all stages ({savedJobsList.length} total)
                </p>`;

if (code.includes(oldModalHeader)) {
  code = code.replace(oldModalHeader, newModalHeader);
  console.log('4. Updated Modal header');
} else {
  console.error('Failed to locate modal header');
  process.exit(1);
}

// 5. Update stage filter pills in the modal
const oldStaffFilterBlock = `            {/* Staff Filter Bar for Admin / MD */}
            {isAdminOrMd && (
              <div style={{ padding: '8px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px' }}>
                  Filter by Worker:
                </span>
                {[
                  { key: 'ALL', label: \`All (\${savedJobsList.length})\` },
                  { key: 'suganya', label: 'Suganya (Branch)' },
                  { key: 'radha', label: 'Radha (Branch)' },
                  { key: 'rekha', label: 'Rekha' },
                  { key: 'sabitha', label: 'Sabitha' },
                  { key: 'aravind', label: 'Aravindh' },
                  { key: 'senthil', label: 'Senthil' },
                  { key: 'priya', label: 'Azhalaku Priya' },
                  { key: 'md', label: 'MD' },
                ].map((chip) => {
                  const isActive = staffFilter === chip.key;
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => setStaffFilter(chip.key)}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '6px',
                        border: isActive ? '1px solid #0f766e' : '1px solid #cbd5e1',
                        background: isActive ? '#0f766e' : '#ffffff',
                        color: isActive ? '#ffffff' : '#475569',
                        fontSize: '11px',
                        fontWeight: 750,
                        cursor: 'pointer',
                      }}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            )}`;

const newStageAndStaffFilterBlock = `            {/* Stage Filter Pills for Global Visibility (Shown to ALL users) */}
            <div style={{ padding: '10px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px' }}>
                Stage:
              </span>
              {[
                { key: 'ALL', label: \`All (\${savedJobsList.length})\` },
                { key: 'BRANCH_INTAKE', label: '1. Branch Intake' },
                { key: 'ARAVINDH_VERIFY', label: '2. Aravindh Verify' },
                { key: 'SENTHIL_REPAIR', label: '3. Senthil 30%/50%' },
                { key: 'PRIYA_PRICING', label: '4. Priya Pricing' },
                { key: 'MD_APPROVAL', label: '5. MD Approval' },
                { key: 'QUOTATION_SENT', label: '6. Quotation Sent' },
                { key: 'COMPLETED', label: '7. Paid & Closed' },
              ].map((pill) => {
                const isActive = stageFilter === pill.key;
                return (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setStageFilter(pill.key)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: isActive ? '1.5px solid #0f766e' : '1px solid #cbd5e1',
                      background: isActive ? '#0f766e' : '#ffffff',
                      color: isActive ? '#ffffff' : '#334155',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* Worker Filter Bar */}
            <div style={{ padding: '6px 20px', borderBottom: '1px solid #f1f5f9', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginRight: '4px' }}>
                Worker:
              </span>
              {[
                { key: 'ALL', label: 'All' },
                { key: 'suganya', label: 'Suganya' },
                { key: 'radha', label: 'Radha' },
                { key: 'sabitha', label: 'Sabitha' },
                { key: 'rekha', label: 'Rekha' },
                { key: 'aravind', label: 'Aravindh' },
                { key: 'senthil', label: 'Senthil' },
                { key: 'priya', label: 'Priya' },
                { key: 'md', label: 'MD' },
              ].map((chip) => {
                const isActive = staffFilter === chip.key;
                return (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => setStaffFilter(chip.key)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '5px',
                      border: isActive ? '1px solid #2563eb' : '1px solid #e2e8f0',
                      background: isActive ? '#eff6ff' : '#ffffff',
                      color: isActive ? '#1d4ed8' : '#64748b',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>`;

if (code.includes(oldStaffFilterBlock)) {
  code = code.replace(oldStaffFilterBlock, newStageAndStaffFilterBlock);
  console.log('5. Updated filter pills');
} else {
  console.error('Failed to locate staff filter block');
  process.exit(1);
}

// 6. Update step button in bottom action bar to support both Branch (Aravindh) and Main Office (Senthil)
const oldBottomBtn = `                {isIntakeStaff && !isAdminOrMd ? (
                  <button 
                    type="button" 
                    className="btn primary" 
                    onClick={handleSendToAravindh}
                    style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', borderColor: '#0284c7', color: '#ffffff', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}
                    title="Complete intake and send alert message to Aravindh for Branch Pickup"
                  >
                    <Send size={15} /> Complete Intake &amp; Send to Aravindh
                  </button>
                ) : (`;

const newBottomBtn = `                {isBranchStaff ? (
                  <button 
                    type="button" 
                    className="btn primary" 
                    onClick={handleSendToAravindh}
                    style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', borderColor: '#0284c7', color: '#ffffff', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}
                    title="Complete intake and send alert message to Aravindh for Branch Pickup"
                  >
                    <Send size={15} /> Save &amp; Send to Aravindh (Branch Pickup) ➔
                  </button>
                ) : isIntakeStaff ? (
                  <button 
                    type="button" 
                    className="btn primary" 
                    onClick={handleSendToSenthilDirect}
                    style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', borderColor: '#059669', color: '#ffffff', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)' }}
                    title="Complete intake and send directly to Senthil (Repair Engineer)"
                  >
                    <Send size={15} /> Save &amp; Send Directly to Senthil (Repair Engineer) ➔
                  </button>
                ) : (`;

if (code.includes(oldBottomBtn)) {
  code = code.replace(oldBottomBtn, newBottomBtn);
  console.log('6. Updated bottom action bar buttons');
} else {
  console.error('Failed to locate bottom button');
  process.exit(1);
}

const finalContent = isCRLF ? code.replace(/\n/g, '\r\n') : code;
fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('Successfully updated ServicingJobForm.tsx');
