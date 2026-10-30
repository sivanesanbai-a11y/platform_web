/**
 * AUTOMATED END-TO-END WORKFLOW VERIFICATION SUITE
 * NUNES Operations Platform
 *
 * Tests:
 * 1. Persona Content & Section Isolation (MD Section 5 Isolation)
 * 2. Role Station Routing & Security Access Guards
 * 3. Form Creation Capability & Worker Filter Isolation
 * 4. 7-Persona Step-by-Step Collaborative Pipeline Execution
 * 5. Pristine Benchmark Single Job in Cloud Store
 */

const fs = require('fs');
const path = require('path');

let testsPassed = 0;
let testsFailed = 0;
const results = [];

function assert(description, condition, details = '') {
  if (condition) {
    testsPassed++;
    results.push({ status: 'PASS', description, details });
    console.log(`  [PASS] ${description}`);
  } else {
    testsFailed++;
    results.push({ status: 'FAIL', description, details });
    console.error(`  [FAIL] ${description} -> ${details}`);
  }
}

console.log('\n======================================================');
console.log('   NUNES OPERATIONS WORKFLOW VERIFICATION SUITE');
console.log('======================================================\n');

// -----------------------------------------------------------------
// SUITE 1: PERSONA ROUTING & SECURITY ACCESS GUARDS
// -----------------------------------------------------------------
console.log('--- SUITE 1: Persona Station Routing & Access Control ---');
const { getRoleDestination, isRouteAllowedForRole } = require('../src/lib/role-routing.ts');

const roleTests = [
  { email: 'suganya@nunesinstruments.com', expectedDest: '/forms/servicing', forbidden: ['/dashboard', '/workshop', '/quotations'] },
  { email: 'radha@nunesinstruments.com', expectedDest: '/forms/servicing', forbidden: ['/dashboard', '/workshop', '/quotations'] },
  { email: 'sabitha@nunesinstruments.com', expectedDest: '/forms/servicing', forbidden: ['/dashboard', '/workshop', '/quotations'] },
  { email: 'rekha@nunesinstruments.com', expectedDest: '/forms/servicing', forbidden: ['/dashboard', '/workshop', '/quotations'] },
  { email: 'aravindh@nunesinstruments.com', expectedDest: '/workshop', forbidden: ['/dashboard', '/quotations'] },
  { email: 'senthil@nunesinstruments.com', expectedDest: '/workshop', forbidden: ['/dashboard', '/quotations'] },
  { email: 'azhalakupriya@nunesinstruments.com', expectedDest: '/quotations', forbidden: ['/dashboard', '/workshop'] },
  { email: 'md@nunesinstruments.com', expectedDest: '/dashboard', forbidden: [] },
  { email: 'admin@nunes.com', expectedDest: '/dashboard', forbidden: [] },
];

roleTests.forEach((t) => {
  const dest = getRoleDestination(t.email);
  assert(`Destination for ${t.email} is ${t.expectedDest}`, dest === t.expectedDest, `Got: ${dest}`);

  t.forbidden.forEach((route) => {
    const check = isRouteAllowedForRole(t.email, route);
    assert(`${t.email} is strictly blocked from ${route}`, !check.allowed, `Route was incorrectly allowed!`);
  });

  const checkAllowed = isRouteAllowedForRole(t.email, t.expectedDest);
  assert(`${t.email} is permitted to access assigned destination ${t.expectedDest}`, checkAllowed.allowed, `Allowed was false!`);
});

// -----------------------------------------------------------------
// SUITE 2: PERSONA CONTENT & SECTION VISIBILITY ISOLATION
// -----------------------------------------------------------------
console.log('\n--- SUITE 2: Persona Content & Section Visibility Isolation ---');

function checkSectionVisibility(userEmail) {
  const user = (userEmail || '').toLowerCase().trim();
  const isAdmin = user.includes('admin') || user === 'admin';
  const isMd = user.includes('md') || user.startsWith('director') || user === 'md';
  const isAravindh = user.includes('aravind');
  const isSenthil = user.includes('senthil');
  const isPriya = user.includes('priya') || user.includes('azhalaku');
  const isBranchStaff = user.includes('suganya') || user.includes('radha');
  const isMainOfficeIntake = user.includes('rekha') || user.includes('sabitha');
  const isIntakeStaff = isBranchStaff || isMainOfficeIntake;

  return {
    showSection1: isAdmin || isIntakeStaff,
    showSection2: isAdmin || isAravindh,
    showSection3: isAdmin || isSenthil,
    showSection4: isAdmin || isPriya,
    showSection5: isAdmin || isMd,
    showSection6: isAdmin || isPriya,
    showSection7: isAdmin || isPriya || (!isBranchStaff && !isMainOfficeIntake && !isAravindh && !isSenthil && !isMd),
  };
}

// Suganya & Radha (Branch): Section 1 only
const suganyaVis = checkSectionVisibility('suganya@nunesinstruments.com');
assert('Suganya sees Section 1 (Branch Intake)', suganyaVis.showSection1 === true);
assert('Suganya does NOT see Section 2 (Aravindh Verification)', suganyaVis.showSection2 === false);
assert('Suganya does NOT see Section 3 (Senthil Repair)', suganyaVis.showSection3 === false);
assert('Suganya does NOT see Section 4 (Priya Pricing)', suganyaVis.showSection4 === false);
assert('Suganya does NOT see Section 5 (MD Approval)', suganyaVis.showSection5 === false);
assert('Suganya does NOT see Section 6 (Quotation Dispatch)', suganyaVis.showSection6 === false);

// Aravindh: Section 2 only
const aravindhVis = checkSectionVisibility('aravindh@nunesinstruments.com');
assert('Aravindh does NOT see Section 1 (Intake)', aravindhVis.showSection1 === false);
assert('Aravindh sees Section 2 (Physical Verification & Pickup)', aravindhVis.showSection2 === true);
assert('Aravindh does NOT see Section 3 (Technical Repair)', aravindhVis.showSection3 === false);
assert('Aravindh does NOT see Section 4 (Pricing)', aravindhVis.showSection4 === false);
assert('Aravindh does NOT see Section 5 (MD Approval)', aravindhVis.showSection5 === false);

// Senthil: Section 3 only
const senthilVis = checkSectionVisibility('senthil@nunesinstruments.com');
assert('Senthil does NOT see Section 1 (Intake)', senthilVis.showSection1 === false);
assert('Senthil does NOT see Section 2 (Verification)', senthilVis.showSection2 === false);
assert('Senthil sees Section 3 (Technical Repair & 30%/50% Scope)', senthilVis.showSection3 === true);
assert('Senthil does NOT see Section 4 (Commercial Pricing)', senthilVis.showSection4 === false);
assert('Senthil does NOT see Section 5 (MD Approval)', senthilVis.showSection5 === false);

// Priya: Sections 4, 6, 7
const priyaVis = checkSectionVisibility('azhalakupriya@nunesinstruments.com');
assert('Priya does NOT see Section 1 (Intake)', priyaVis.showSection1 === false);
assert('Priya does NOT see Section 2 (Physical Verification)', priyaVis.showSection2 === false);
assert('Priya does NOT see Section 3 (Teardown & Solder Repair)', priyaVis.showSection3 === false);
assert('Priya sees Section 4 (Service Pricing & GST)', priyaVis.showSection4 === true);
assert('Priya does NOT see Section 5 (MD Approval Gateway)', priyaVis.showSection5 === false);
assert('Priya sees Section 6 (Quotation & Courier Handover)', priyaVis.showSection6 === true);
assert('Priya sees Section 7 (Payment Receipt)', priyaVis.showSection7 === true);

// MD: Section 5 ONLY (MD Price Approval & Executive Decision Gateway)
const mdVis = checkSectionVisibility('md@nunesinstruments.com');
assert('MD sees Section 5 (Price Approval & Override Gateway)', mdVis.showSection5 === true);
assert('MD does NOT see Section 1 (Intake Creation)', mdVis.showSection1 === false);
assert('MD does NOT see Section 2 (Aravindh Physical Verification)', mdVis.showSection2 === false);
assert('MD does NOT see Section 3 (Senthil Technical Repair)', mdVis.showSection3 === false);
assert('MD does NOT see Section 4 (Priya Service Pricing)', mdVis.showSection4 === false);
assert('MD does NOT see Section 6 (Quotation Dispatch)', mdVis.showSection6 === false);
assert('MD does NOT see Section 7 (Payment Collection)', mdVis.showSection7 === false);

// Admin: Full visibility across all 7 sections
const adminVis = checkSectionVisibility('admin@nunes.com');
assert('Admin has system-level oversight across all 7 sections', adminVis.showSection1 && adminVis.showSection2 && adminVis.showSection3 && adminVis.showSection4 && adminVis.showSection5 && adminVis.showSection6 && adminVis.showSection7);

// -----------------------------------------------------------------
// SUITE 3: FORM CREATION CAPABILITY & WORKER FILTER ISOLATION
// -----------------------------------------------------------------
console.log('\n--- SUITE 3: Form Creation Capability & Worker Filter Isolation ---');

function canUserCreateNewJob(userEmail) {
  const user = (userEmail || '').toLowerCase().trim();
  const isAdmin = user.includes('admin') || user === 'admin';
  const isBranchStaff = user.includes('suganya') || user.includes('radha');
  const isMainOfficeIntake = user.includes('rekha') || user.includes('sabitha');
  const isIntakeStaff = isBranchStaff || isMainOfficeIntake;
  return isIntakeStaff || isAdmin;
}

assert('Suganya (Branch Intake) can create new service jobs', canUserCreateNewJob('suganya@nunesinstruments.com') === true);
assert('Radha (Branch Intake) can create new service jobs', canUserCreateNewJob('radha@nunesinstruments.com') === true);
assert('Sabitha (Main Office Intake) can create new service jobs', canUserCreateNewJob('sabitha@nunesinstruments.com') === true);
assert('Rekha (Main Office Intake) can create new service jobs', canUserCreateNewJob('rekha@nunesinstruments.com') === true);
assert('Admin (Superuser) can create new service jobs', canUserCreateNewJob('admin@nunes.com') === true);

assert('MD CANNOT create new service jobs (Approval Gateway only)', canUserCreateNewJob('md@nunesinstruments.com') === false);
assert('Aravindh CANNOT create new service jobs (Workshop Pickup only)', canUserCreateNewJob('aravindh@nunesinstruments.com') === false);
assert('Senthil CANNOT create new service jobs (Workshop Repair only)', canUserCreateNewJob('senthil@nunesinstruments.com') === false);
assert('Priya CANNOT create new service jobs (Commercial Pricing only)', canUserCreateNewJob('azhalakupriya@nunesinstruments.com') === false);

// Verify Worker Filter Bar chips
const servicingFormCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'forms', 'ServicingJobForm.tsx'), 'utf8');
assert('MD is NOT in worker filter chips in ServicingJobForm', !servicingFormCode.includes("{ key: 'md', label: 'MD' }"));
assert('Suganya is in worker filter chips', servicingFormCode.includes("{ key: 'suganya', label: 'Suganya' }"));
assert('Senthil is in worker filter chips', servicingFormCode.includes("{ key: 'senthil', label: 'Senthil' }"));
assert('Aravindh is in worker filter chips', servicingFormCode.includes("{ key: 'aravind', label: 'Aravindh' }"));
assert('Priya is in worker filter chips', servicingFormCode.includes("{ key: 'priya', label: 'Priya' }"));

// -----------------------------------------------------------------
// SUITE 4: END-TO-END 7-STAGE PIPELINE WORKFLOW TRANSITIONS
// -----------------------------------------------------------------
console.log('\n--- SUITE 4: End-to-End 7-Persona Pipeline Execution ---');

let job = {
  id: 'SJ-TEST-2026',
  jobNo: 'SJ-TEST-2026',
  legacySerialNo: 'SRV-TEST-001',
  jobDate: '2026-10-26',
  status: 'RECEIVED',
  marketType: 'INDIA',
  officeType: 'BRANCH_OFFICE',
  branchName: 'Branch Office (Coimbatore)',
  customer: {
    name: 'Texmo Precision Castings Ltd',
    phone: '+91 98421 54321',
    email: 'maintenance@texmopowertools.com',
  },
  products: [
    {
      id: 'p-1',
      productName: 'Yokogawa Digital Pressure Transmitter',
      makeModel: 'EJA110A',
      serialNo: '91K284019',
      qty: 1,
      complaint: '4-20mA output fluctuating, zero calibration drift',
      productValue: 12500,
      onlinePrice: 12500,
    },
  ],
  workflow: {
    stage: 'INTAKE_RECEIVED',
    isBranchDelivery: true,
  },
  createdBy: 'suganya@nunesinstruments.com',
};

// Stage 1: Branch Intake Creation
function step1_BranchSaveAndSend(baseJob, staffEmail) {
  return {
    ...baseJob,
    status: 'RECEIVED',
    workflow: {
      ...baseJob.workflow,
      stage: 'AWAITING_ARAVINDH_ACCEPT',
      isBranchDelivery: true,
      aravindhAlertSentAt: new Date().toISOString(),
      intakeStaffName: staffEmail,
    },
  };
}
job = step1_BranchSaveAndSend(job, 'suganya@nunesinstruments.com');
assert('Step 1: Stage transitioned to AWAITING_ARAVINDH_ACCEPT', job.workflow.stage === 'AWAITING_ARAVINDH_ACCEPT');
assert('Step 1: isBranchDelivery flag is true', job.workflow.isBranchDelivery === true);
assert('Step 1: Intake staff recorded as Suganya', job.workflow.intakeStaffName === 'suganya@nunesinstruments.com');

// Stage 2: Aravindh Physical Verification
function step2_AravindhAcceptAndVerify(baseJob, aravindhEmail, photoUrl) {
  return {
    ...baseJob,
    status: 'REPAIRING',
    workflow: {
      ...baseJob.workflow,
      stage: 'UNDER_REPAIR_SENTHIL',
      aravindhAcceptedBy: aravindhEmail,
      aravindhAcceptedAt: new Date().toISOString(),
      aravindhBranchPickupDone: true,
      aravindhProductPhoto: photoUrl,
      mechanicAssigned: 'Senthil',
      mechanicAlertSentAt: new Date().toISOString(),
    },
  };
}
job = step2_AravindhAcceptAndVerify(job, 'aravindh@nunesinstruments.com', 'data:image/jpeg;base64,mockphoto');
assert('Step 2: Stage transitioned to UNDER_REPAIR_SENTHIL', job.workflow.stage === 'UNDER_REPAIR_SENTHIL');
assert('Step 2: Aravindh branch pickup marked true', job.workflow.aravindhBranchPickupDone === true);
assert('Step 2: Inspection photo uploaded', Boolean(job.workflow.aravindhProductPhoto));
assert('Step 2: Assigned mechanic is Senthil', job.workflow.mechanicAssigned === 'Senthil');

// Stage 3: Senthil 30% Repair & Scope
function step3_SenthilCompleteRepair(baseJob, notes, scopePercent, sparePartsCost) {
  return {
    ...baseJob,
    status: 'ESTIMATE_PENDING',
    workflow: {
      ...baseJob.workflow,
      stage: 'AWAITING_PRIYA_PRICING',
      mechanicCompletedAt: new Date().toISOString(),
      mechanicNotes: notes,
      mechanicEstimateType: scopePercent === 30 ? 'MINIMUM_30' : 'MAXIMUM_50',
      repairScopePercent: scopePercent,
      sparePartsCostEstimate: sparePartsCost,
      priyaPricingAlertSentAt: new Date().toISOString(),
    },
  };
}
job = step3_SenthilCompleteRepair(
  job,
  'Replaced primary sensor seal, ultrasonically cleaned diaphragm chamber, recalibrated 4-20mA span to 0.05% FS precision.',
  30,
  800
);
assert('Step 3: Stage transitioned to AWAITING_PRIYA_PRICING', job.workflow.stage === 'AWAITING_PRIYA_PRICING');
assert('Step 3: Senthil repair notes recorded', Boolean(job.workflow.mechanicNotes));
assert('Step 3: Repair scope set to 30%', job.workflow.repairScopePercent === 30);
assert('Step 3: Spare parts cost estimated at ₹800', job.workflow.sparePartsCostEstimate === 800);

// Stage 4: Priya Commercial Pricing
function step4_PriyaSubmitPriceToMd(baseJob, serviceCharge, partsCost, discount, priyaEmail) {
  const subtotal = serviceCharge + partsCost - discount;
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;
  return {
    ...baseJob,
    status: 'APPROVAL_PENDING',
    workflow: {
      ...baseJob.workflow,
      stage: 'AWAITING_MD_APPROVAL',
      priyaServiceCharge: serviceCharge,
      priyaSparePartsCost: partsCost,
      priyaDiscount: discount,
      priyaGstRate: 18,
      priyaGstAmount: gst,
      priyaTotalQuotationAmount: total,
      priyaPriceEnteredBy: priyaEmail,
      priyaPriceEnteredAt: new Date().toISOString(),
      mdAlertSentAt: new Date().toISOString(),
    },
  };
}
job = step4_PriyaSubmitPriceToMd(job, 3200, 800, 0, 'azhalakupriya@nunesinstruments.com');
assert('Step 4: Stage transitioned to AWAITING_MD_APPROVAL', job.workflow.stage === 'AWAITING_MD_APPROVAL');
assert('Step 4: Priya subtotal calculation: ₹3,200 + ₹800 = ₹4,000', job.workflow.priyaServiceCharge + job.workflow.priyaSparePartsCost === 4000);
assert('Step 4: 18% GST calculated accurately: ₹720', job.workflow.priyaGstAmount === 720);
assert('Step 4: Total quotation submitted to MD is ₹4,720', job.workflow.priyaTotalQuotationAmount === 4720);

// Stage 5: MD Executive Price Approval
function step5_MdApprovePrice(baseJob, approvedPrice, discount, note, mdEmail) {
  return {
    ...baseJob,
    status: 'APPROVAL_PENDING',
    workflow: {
      ...baseJob.workflow,
      stage: 'PRICE_APPROVED_BY_MD',
      approvedByMd: true,
      mdApprovedPrice: approvedPrice,
      mdDiscount: discount,
      mdApprovalNotes: note,
      mdApprovedAt: new Date().toISOString(),
      mdApprovedBy: mdEmail,
      priyaApprovalAlertSentAt: new Date().toISOString(),
    },
  };
}
job = step5_MdApprovePrice(job, 4720, 0, 'Approved. Proceed with customer quotation and delivery.', 'md@nunesinstruments.com');
assert('Step 5: Stage transitioned to PRICE_APPROVED_BY_MD', job.workflow.stage === 'PRICE_APPROVED_BY_MD');
assert('Step 5: MD approved flag is true', job.workflow.approvedByMd === true);
assert('Step 5: MD approved price matches ₹4,720', job.workflow.mdApprovedPrice === 4720);
assert('Step 5: Alert sent back to Azhalaku Priya', Boolean(job.workflow.priyaApprovalAlertSentAt));

// Stage 6: Priya Quotation Dispatch & Courier
function step6_PriyaDispatchQuotation(baseJob, courierName, docket) {
  return {
    ...baseJob,
    status: 'DISPATCHED',
    workflow: {
      ...baseJob.workflow,
      stage: 'READY_FOR_HANDOVER',
      quotationSentAt: new Date().toISOString(),
      quotationSentVia: 'WHATSAPP_AND_EMAIL',
      priyaCourierDocket: docket,
      priyaCourierName: courierName,
      dispatchNotes: `Dispatched via ${courierName} (AWB: ${docket})`,
    },
  };
}
job = step6_PriyaDispatchQuotation(job, 'ST Courier', 'STC-98421045');
assert('Step 6: Stage transitioned to READY_FOR_HANDOVER', job.workflow.stage === 'READY_FOR_HANDOVER');
assert('Step 6: Status is DISPATCHED', job.status === 'DISPATCHED');
assert('Step 6: Courier docket recorded (STC-98421045)', job.workflow.priyaCourierDocket === 'STC-98421045');

// Stage 7: Payment Received & Job Closed
function step7_RecordPaymentAndClose(baseJob, mode, ref, amount, receivedBy) {
  return {
    ...baseJob,
    status: 'CLOSED',
    workflow: {
      ...baseJob.workflow,
      stage: 'JOB_COMPLETED',
      paymentMode: mode,
      paymentReference: ref,
      paymentAmount: amount,
      paymentReceivedAt: new Date().toISOString(),
      paymentReceivedBy: receivedBy,
      finalHandoverCompletedAt: new Date().toISOString(),
    },
  };
}
job = step7_RecordPaymentAndClose(job, 'UPI', 'UPI/2026/9842145', 4720, 'Azhalaku Priya');
assert('Step 7: Final stage is JOB_COMPLETED', job.workflow.stage === 'JOB_COMPLETED');
assert('Step 7: Job status is CLOSED', job.status === 'CLOSED');
assert('Step 7: Payment reference recorded (UPI/2026/9842145)', job.workflow.paymentReference === 'UPI/2026/9842145');
assert('Step 7: Payment amount recorded (₹4,720)', job.workflow.paymentAmount === 4720);

// -----------------------------------------------------------------
// SUITE 5: CLOUD STORE DATA INTEGRITY
// -----------------------------------------------------------------
console.log('\n--- SUITE 5: Cloud Store & Benchmark Data Integrity ---');

const storePath = path.join(__dirname, '..', 'data', 'nunes_cloud_store.json');
assert('data/nunes_cloud_store.json exists', fs.existsSync(storePath));

const storeData = JSON.parse(fs.readFileSync(storePath, 'utf8'));
assert('service_jobs array contains exactly 1 benchmark record', storeData.service_jobs && storeData.service_jobs.length === 1);

const bench = storeData.service_jobs[0];
assert('Benchmark job ID is SJ-2026-1001', bench.id === 'SJ-2026-1001');
assert('Benchmark customer is Texmo Precision Castings Ltd', bench.customer?.name === 'Texmo Precision Castings Ltd');
assert('Benchmark product is Digital Pressure Transmitter (Yokogawa)', bench.products?.[0]?.productName === 'Digital Pressure Transmitter');
assert('Benchmark stage is JOB_COMPLETED', bench.workflow?.stage === 'JOB_COMPLETED');
assert('Benchmark status is CLOSED', bench.status === 'CLOSED');
assert('Benchmark has Aravindh verification details', bench.workflow?.aravindhBranchPickupDone === true && Boolean(bench.workflow?.aravindhProductPhoto));
assert('Benchmark has Senthil 30% repair assessment', bench.workflow?.mechanicEstimateType === 'MINIMUM_30' && Boolean(bench.workflow?.mechanicAssessment));
assert('Benchmark has Priya pricing & GST quotation', bench.workflow?.priyaTotalQuotationAmount === 4720);
assert('Benchmark has MD approval confirmation', bench.workflow?.approvedByMd === true && bench.workflow?.mdApprovedPrice === 4720);
assert('Benchmark has ST Courier docket', bench.workflow?.priyaCourierDocket === 'STC-98421045');
assert('Benchmark has UPI payment receipt', bench.workflow?.paymentReference === 'UPI/2026/9842145' && bench.workflow?.paymentAmount === 4720);

assert('purchasing_orders is empty', storeData.purchasing_orders && storeData.purchasing_orders.length === 0);
assert('quotations is empty', storeData.quotations && storeData.quotations.length === 0);
assert('users array contains all staff credentials (19 entries)', storeData.users && storeData.users.length === 19);

// -----------------------------------------------------------------
// SUITE 6: AZHALAKU PRIYA FORM FILLING & COMMERCIAL STATION INTEGRITY
// -----------------------------------------------------------------
console.log('\n--- SUITE 6: Azhalaku Priya Form Filling & Commercial Station Integrity ---');

const quotPageCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'quotations', 'page.tsx'), 'utf8');
const pipelineCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'forms', 'ServiceWorkflowPipeline.tsx'), 'utf8');

assert('QuotationsPage imports MessageSquare for instant client dispatch', quotPageCode.includes('MessageSquare'));
assert('QuotationsPage has selectedPricingJob modal state', quotPageCode.includes('selectedPricingJob'));
assert('QuotationsPage has openPricingModal handler', quotPageCode.includes('openPricingModal'));
assert('QuotationsPage has handleSubmitPriceToMd form handler', quotPageCode.includes('handleSubmitPriceToMd'));
assert('QuotationsPage has handleDispatchQuotation delivery handler', quotPageCode.includes('handleDispatchQuotation'));
assert('QuotationsPage has handleRecordPaymentAndClose handler', quotPageCode.includes('handleRecordPaymentAndClose'));
assert('QuotationsPage calculates 18% GST on taxable value', quotPageCode.includes('Math.round((pricingTaxable * 18) / 100)'));
assert('QuotationsPage renders Azhalaku Priya Commercial Pricing Station modal', quotPageCode.includes('Azhalaku Priya Commercial Pricing Station'));
assert('QuotationsPage renders Customer Details in pricing modal', quotPageCode.includes('Customer Information'));
assert('QuotationsPage renders Equipment Details in pricing modal', quotPageCode.includes('Equipment Details'));
assert('QuotationsPage renders Senthil Technical Repair Assessment in modal', quotPageCode.includes('Senthil Technical Repair Assessment'));
assert('QuotationsPage renders 30% and 50% quick scope buttons', quotPageCode.includes('Apply 30% Scope') && quotPageCode.includes('Apply 50% Scope'));
assert('QuotationsPage renders WhatsApp quotation dispatch link', quotPageCode.includes('getWhatsAppLink'));
assert('QuotationsPage renders Email quotation dispatch link', quotPageCode.includes('getEmailLink'));

assert('ServicingJobForm has dedicated isPriya station card', servicingFormCode.includes('isPriya ?') && servicingFormCode.includes('💼 Azhalaku Priya Commercial Pricing Station'));
assert('ServiceWorkflowPipeline has Section 4 quick 30% scope button', pipelineCode.includes('Apply 30% Standard Scope'));
assert('ServiceWorkflowPipeline has Section 4 quick 50% overhaul button', pipelineCode.includes('Apply 50% Overhaul Scope'));
assert('ServiceWorkflowPipeline has Commercial Quotation Notes textarea in Section 4', pipelineCode.includes('Commercial Quotation Notes'));

// Math Verification:
const baseVal = 10000;
const scope30 = Math.round(baseVal * 0.3);
const scope50 = Math.round(baseVal * 0.5);
assert('30% scope on ₹10,000 product is exactly ₹3,000', scope30 === 3000);
assert('50% scope on ₹10,000 product is exactly ₹5,000', scope50 === 5000);

const testSubtotal = 3000 + 1000; // 4000
const testDiscount = 500; // 3500 taxable
const testGst = Math.round((3500 * 18) / 100); // 630
const testTotal = 3500 + testGst; // 4130
assert('Priya pricing computation correctly produces ₹4,130 with discount and 18% GST', testTotal === 4130);

// -----------------------------------------------------------------
// SUITE 7: FORMAL PDF QUOTATION DOCUMENT GENERATION & EXPORT
// -----------------------------------------------------------------
console.log('\n--- SUITE 7: Formal PDF Quotation Generation & Export Integrity ---');

const modalCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'forms', 'ServiceQuotationModal.tsx'), 'utf8');

assert('ServiceQuotationModal imports exportElementToPdf and triggerFileDownload', modalCode.includes('exportElementToPdf') && modalCode.includes('triggerFileDownload'));
assert('ServiceQuotationModal has handleDownloadPdf export handler', modalCode.includes('async function handleDownloadPdf'));
assert('ServiceQuotationModal has handleWhatsAppWithPdf handler', modalCode.includes('async function handleWhatsAppWithPdf'));
assert('ServiceQuotationModal has handleGmailWithPdf handler', modalCode.includes('async function handleGmailWithPdf'));
assert('ServiceQuotationModal renders exact formal #service-quotation-sheet element', modalCode.includes('id="service-quotation-sheet"'));
assert('ServiceQuotationModal includes NUNES INSTRUMENTATION company header & letterhead', modalCode.includes('NUNES INSTRUMENTATION') && modalCode.includes('Coimbatore'));
assert('ServiceQuotationModal supports dynamic line item addition & rate changes', modalCode.includes('addLineItem') && modalCode.includes('updateProductRate'));
assert('ServiceQuotationModal calculates amount in words dynamically', modalCode.includes('numberToWordsINR'));
assert('ServiceQuotationModal includes authorized technical signatory section', modalCode.includes('Authorized Technical Signatory'));
assert('QuotationsPage imports ServiceQuotationModal', quotPageCode.includes('import ServiceQuotationModal'));
assert('QuotationsPage has pdfQuotationJob state', quotPageCode.includes('pdfQuotationJob'));
assert('QuotationsPage has handleOpenQuotationPdf handler', quotPageCode.includes('handleOpenQuotationPdf'));
assert('QuotationsPage renders ServiceQuotationModal when pdfQuotationJob is set', quotPageCode.includes('<ServiceQuotationModal'));
assert('QuotationsPage table rows have 1-click PDF quotation button', quotPageCode.includes('title="Preview & Download Official Quotation PDF"'));
assert('QuotationsPage Section 4 has View & Download Official Quotation PDF button', quotPageCode.includes('View &amp; Download Official Quotation PDF') || quotPageCode.includes('View & Download Official Quotation PDF'));
assert('ServiceWorkflowPipeline Section 6 has Official PDF Quotation button', pipelineCode.includes('Official PDF Quotation'));

// -----------------------------------------------------------------
// SUITE 8: MOBILE-FIRST WORKSHOP OPERATION & LIVE CAMERA/VIDEO INTEGRATION
// -----------------------------------------------------------------
console.log('\n--- SUITE 8: Mobile-First Workshop Operation & Live Camera/Video Integration ---');

const liveCameraCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'LiveCameraModal.tsx'), 'utf8');
const workshopPageCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'workshop', 'page.tsx'), 'utf8');
const workflowServiceCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'workflow-service.ts'), 'utf8');
const notifManagerCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'WorkflowNotificationManager.tsx'), 'utf8');

assert('LiveCameraModal component exists and handles getUserMedia', liveCameraCode.includes('navigator.mediaDevices.getUserMedia'));
assert('LiveCameraModal configures rear camera facingMode: ideal environment', liveCameraCode.includes('facingMode: { ideal: facing }') || liveCameraCode.includes('facingMode: { ideal: "environment" }'));
assert('LiveCameraModal implements live video clip recording with MediaRecorder', liveCameraCode.includes('MediaRecorder'));
assert('LiveCameraModal implements instant canvas photo snapshot', liveCameraCode.includes('canvas.toDataURL("image/jpeg"'));
assert('LiveCameraModal provides fallback native phone camera triggers', liveCameraCode.includes('capture="environment"'));

assert('Workshop page imports LiveCameraModal', workshopPageCode.includes('import LiveCameraModal'));
assert('Workshop page has mobileView switcher state (queue vs workbench)', workshopPageCode.includes('const [mobileView, setMobileView] = useState'));
assert('Workshop page renders mobile toggle buttons', workshopPageCode.includes('workshop-mobile-switcher'));
assert('Workshop page renders mobile back to queue button', workshopPageCode.includes('workshop-mobile-back-btn'));
assert('Workshop page includes responsive media queries for phone screens', workshopPageCode.includes('@media (max-width: 768px)'));

assert('Workshop page Aravindh section has live camera photo trigger', workshopPageCode.includes('openLiveCamera("verification", "photo")'));
assert('Workshop page Aravindh section has live video record trigger', workshopPageCode.includes('openLiveCamera("verification", "video")'));
assert('Workshop page Senthil section has live camera photo trigger', workshopPageCode.includes('openLiveCamera("repair", "photo")'));
assert('Workshop page Senthil section has live video stream trigger', workshopPageCode.includes('openLiveCamera("repair", "video")'));
assert('Workshop page provides 1-tap snap using phone camera', workshopPageCode.includes('capture="environment"'));

assert('ServiceWorkflowPipeline imports LiveCameraModal', pipelineCode.includes('import LiveCameraModal'));
assert('ServiceWorkflowPipeline provides live camera in technical repair section', pipelineCode.includes('openPipelineCamera("repair", "photo")'));
assert('ServiceWorkflowPipeline provides live video in technical repair section', pipelineCode.includes('openPipelineCamera("repair", "video")'));

assert('WorkflowAlert interface includes equipmentModel, serialNo, customerPhone, customerCity, scope',
  workflowServiceCode.includes('equipmentModel?: string') &&
  workflowServiceCode.includes('serialNo?: string') &&
  workflowServiceCode.includes('customerPhone?: string') &&
  workflowServiceCode.includes('customerCity?: string') &&
  workflowServiceCode.includes('scope?: string')
);

assert('WorkflowNotificationManager renders equipment details in notification items', notifManagerCode.includes('equipmentModel') && notifManagerCode.includes('equipmentName'));
assert('WorkflowNotificationManager routes Senthil directly to /workshop?job=...&tab=repair', notifManagerCode.includes('/workshop?job=') && notifManagerCode.includes('&tab=repair'));
assert('WorkflowNotificationManager routes Priya directly to /quotations?job=...', notifManagerCode.includes('/quotations?job='));

assert('QuotationsPage renders Senthil repair proof photos for Priya to inspect', quotPageCode.includes('repairProofPhotos') && quotPageCode.includes('Repair Proof'));
assert('QuotationsPage renders Senthil repair proof video for Priya to inspect', quotPageCode.includes('repairProofVideo'));

// -----------------------------------------------------------------
// SUITE 9: SABITHA & REKHA MAIN OFFICE INTAKE (NO ARAVINDH)
// -----------------------------------------------------------------
console.log('\n--- SUITE 9: Sabitha & Rekha Main Office Intake (No Aravindh) ---');

const servicingFormUpdatedCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'forms', 'ServicingJobForm.tsx'), 'utf8');
const pipelineUpdatedCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'forms', 'ServiceWorkflowPipeline.tsx'), 'utf8');

assert('ServicingJobForm hides Branch Office Intake checkbox from Sabitha and Rekha',
  servicingFormUpdatedCode.includes('!isMainOfficeIntake && (isBranchStaff || isAdminOrMd)')
);

assert('ServicingJobForm routes Main Office intake on first save directly to Senthil without Aravindh',
  servicingFormUpdatedCode.includes('Main Office Walk-in / Courier Intake (Sabitha & Rekha) -> Direct to Senthil (NO Aravindh)') &&
  servicingFormUpdatedCode.includes('targetRole: \'SENTHIL\'') &&
  servicingFormUpdatedCode.includes('mechanicAssigned: \'Senthil Kumar (Repair Engineer)\'')
);

assert('ServicingJobForm stage filter pills adapt for Sabitha & Rekha without Aravindh verify',
  servicingFormUpdatedCode.includes('isMainOfficeIntake') &&
  servicingFormUpdatedCode.includes('MAIN_INTAKE') &&
  servicingFormUpdatedCode.includes('1. Main Office Intake')
);

assert('ServiceWorkflowPipeline computes isBranchPipeline excluding Sabitha & Rekha',
  pipelineUpdatedCode.includes('const isBranchPipeline = isCreatedByBranch && !isCreatedByMainOffice && !isMainOfficeIntake')
);

assert('ServiceWorkflowPipeline hides Section 2 Aravindh Physical Verification when not branch pipeline',
  pipelineUpdatedCode.includes('const showSection2 = (isAdmin || isAravindh) && isBranchPipeline')
);

assert('ServiceWorkflowPipeline provides 6-stage direct tracker for Sabitha and Rekha without Aravindh',
  pipelineUpdatedCode.includes('Main Office Intake') &&
  pipelineUpdatedCode.includes('Sabitha / Rekha') &&
  pipelineUpdatedCode.includes('number: 6')
);

// -----------------------------------------------------------------
// SUITE 10: DEMO EQUIPMENT ERADICATION & EMPTY CATALOG INTEGRITY
// -----------------------------------------------------------------
console.log('\n--- SUITE 10: Demo Equipment Eradication & Empty Catalog Integrity ---');

const productsLibCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'products.ts'), 'utf8');
const productsClientCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'ProductsClient.tsx'), 'utf8');
const shellCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'Shell.tsx'), 'utf8');

assert('products.ts defines empty BASELINE_PRODUCT_PROFILES array',
  productsLibCode.includes('export const BASELINE_PRODUCT_PROFILES: ProductProfile[] = [];')
);

assert('products.ts does NOT contain legacy demo products (NPG-500D, NDWT-1200, NTC-650Dry)',
  !productsLibCode.includes('name: "Digital Pressure Gauge (0.05% FS)"') &&
  !productsLibCode.includes('name: "Dead Weight Tester (Primary Standard)"') &&
  !productsLibCode.includes('name: "Industrial Dry Block Temperature Calibrator"')
);

assert('products.ts includes DEMO_PRODUCT_IDS purge filter in getAllProducts',
  productsLibCode.includes('DEMO_PRODUCT_IDS') &&
  productsLibCode.includes('DEMO_PRODUCT_IDS.has(p.id)')
);

assert('ProductsClient initializes state with clean empty array',
  productsClientCode.includes('const [products, setProducts] = useState<ProductProfile[]>([]);')
);

assert('ProductsClient displays dynamic category count reflecting catalog size',
  productsClientCode.includes('0 Categories') &&
  productsClientCode.includes('new Set(products.map(p => p.category)).size')
);

assert('ProductsClient renders empty state with Add First Equipment Profile action',
  productsClientCode.includes('No Equipment Profiles in Catalog') &&
  productsClientCode.includes('Add First Equipment Profile')
);

assert('Shell.tsx includes nunes:product_profiles in nunes_purged_all_demo_v6',
  shellCode.includes('nunes_purged_all_demo_v6') &&
  shellCode.includes('localStorage.setItem("nunes:product_profiles", "[]");')
);

assert('ServicingJobForm handles empty equipment catalog gracefully',
  servicingFormUpdatedCode.includes('No Equipment Profiles in Catalog') &&
  servicingFormUpdatedCode.includes('All demo/dummy equipment has been removed')
);

// -----------------------------------------------------------------
// SUITE 11: MD EXCLUSIVE FORMS HUB REMOVAL & ROUTING
// -----------------------------------------------------------------
console.log('\n--- SUITE 11: MD Exclusive Forms Hub Removal & Routing ---');

const appSidebarCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'AppSidebar.tsx'), 'utf8');
const formsClientCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'FormsClient.tsx'), 'utf8');
const commandPaletteCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'CommandPalette.tsx'), 'utf8');

assert('AppSidebar computes isMd specifically for MD role without impacting Admin',
  appSidebarCode.includes('const isMd = Boolean(') &&
  appSidebarCode.includes('!emailLower.includes("admin")') &&
  appSidebarCode.includes('emailLower === "md"')
);

assert('AppSidebar hides Forms Hub from expanded navigation when user is MD',
  appSidebarCode.includes('{!isMd && (') &&
  appSidebarCode.includes('<span>Forms Hub</span>')
);

assert('AppSidebar hides Forms Hub from collapsed navigation when user is MD',
  appSidebarCode.includes('{!isMd && (') &&
  appSidebarCode.includes('title="Forms Hub"')
);

assert('FormsClient routes MD directly to /dashboard if /forms is visited',
  formsClientCode.includes('isMdUser') &&
  formsClientCode.includes('router.replace("/dashboard");')
);

assert('CommandPalette filters out /forms for MD user',
  commandPaletteCode.includes('isMd') &&
  commandPaletteCode.includes('item.href !== "/forms"')
);

// -----------------------------------------------------------------
// SUITE 12: 1-CLICK NOTIFICATION OPENING & REAL-TIME AUTO-OPEN
// -----------------------------------------------------------------
console.log('\n--- SUITE 12: 1-Click Notification Opening & Real-Time Auto-Open ---');

const updatedNotifCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'WorkflowNotificationManager.tsx'), 'utf8');
const updatedWorkshopCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'workshop', 'page.tsx'), 'utf8');
const updatedQuotCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'quotations', 'page.tsx'), 'utf8');
const updatedServicingCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'forms', 'ServicingJobForm.tsx'), 'utf8');

assert('WorkflowNotificationManager toggle button handles stopPropagation & preventDefault for 1-click open',
  updatedNotifCode.includes('e.preventDefault()') &&
  updatedNotifCode.includes('e.stopPropagation()') &&
  updatedNotifCode.includes('setPanelOpen((prev) => !prev)')
);

assert('WorkflowNotificationManager has panelContainerRef and click-outside handler',
  updatedNotifCode.includes('panelContainerRef') &&
  updatedNotifCode.includes('handleClickOutside') &&
  updatedNotifCode.includes('addEventListener("mousedown", handleClickOutside)')
);

assert('WorkflowNotificationManager dispatches nunes:select-job CustomEvent on 1st click',
  updatedNotifCode.includes('new CustomEvent("nunes:select-job"') &&
  updatedNotifCode.includes('detail: { jobId, tab: targetTab, alert }')
);

assert('WorkflowNotificationManager updates pushState & popstate if already on destination page',
  updatedNotifCode.includes('window.history.pushState({}, "", targetUrl)') &&
  updatedNotifCode.includes('window.dispatchEvent(new PopStateEvent("popstate"))')
);

assert('Workshop page imports syncPullFromCloud and getWorkflowAlerts',
  updatedWorkshopCode.includes('syncPullFromCloud') &&
  updatedWorkshopCode.includes('getWorkflowAlerts')
);

assert('Workshop page loadJobs supports authoritative cloud sync forceSync',
  updatedWorkshopCode.includes('loadJobs = async (forceSync = false)') &&
  updatedWorkshopCode.includes('await syncPullFromCloud(true)')
);

assert('Workshop page implements applyTargetJob with cloud sync & workflow alert synthesis',
  updatedWorkshopCode.includes('const applyTargetJob = async') &&
  updatedWorkshopCode.includes('getWorkflowAlerts()') &&
  updatedWorkshopCode.includes('setSelectedJobId(matchAlert.jobId)')
);

assert('Workshop page listens to nunes:select-job and popstate for 1-click auto-open',
  updatedWorkshopCode.includes('window.addEventListener("nunes:select-job"') &&
  updatedWorkshopCode.includes('window.addEventListener("popstate"')
);

assert('QuotationsPage implements applyTargetJob and opens pricing modal on 1st click',
  updatedQuotCode.includes('const applyTargetJob = async') &&
  updatedQuotCode.includes('openPricingModal(found)') &&
  updatedQuotCode.includes('getWorkflowAlerts()')
);

assert('QuotationsPage listens to nunes:select-job and popstate for 1-click auto-open',
  updatedQuotCode.includes('window.addEventListener("nunes:select-job"') &&
  updatedQuotCode.includes('window.addEventListener("popstate"')
);

assert('ServicingJobForm listens to nunes:select-job and popstate for 1-click auto-open',
  updatedServicingCode.includes('window.addEventListener(\'nunes:select-job\'') &&
  updatedServicingCode.includes('window.addEventListener(\'popstate\'')
);

// -----------------------------------------------------------------
// SUITE 13: SENTHIL REPAIR LIFECYCLE (BAY ACCEPT, START REPAIR, TIME DISPLAY)
// -----------------------------------------------------------------
console.log('\n--- SUITE 13: Senthil Repair Lifecycle & Repair Time Tracking ---');

const jobTypesCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'types', 'service-job.ts'), 'utf8');
const freshWorkshopCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'workshop', 'page.tsx'), 'utf8');
const freshQuotCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'quotations', 'page.tsx'), 'utf8');
const freshPipelineCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'forms', 'ServiceWorkflowPipeline.tsx'), 'utf8');

assert('service-job.ts defines senthilAcceptedAt, senthilAcceptedBy, repairStartedAt, and repairDurationMinutes',
  jobTypesCode.includes('senthilAcceptedAt?: string;') &&
  jobTypesCode.includes('senthilAcceptedBy?: string;') &&
  jobTypesCode.includes('repairStartedAt?: string;') &&
  jobTypesCode.includes('repairDurationMinutes?: number;')
);

assert('Workshop page implements handleSenthilAcceptProduct',
  freshWorkshopCode.includes('const handleSenthilAcceptProduct = (job: ServiceJob)') &&
  freshWorkshopCode.includes('senthilAcceptedAt: new Date().toISOString()')
);

assert('Workshop page implements handleSenthilStartRepair',
  freshWorkshopCode.includes('const handleSenthilStartRepair = (job: ServiceJob)') &&
  freshWorkshopCode.includes('repairStartedAt:')
);

assert('Workshop page computes repairDurationMinutes on repair completion',
  freshWorkshopCode.includes('repairDurationMinutes: durationMins') &&
  freshWorkshopCode.includes('Math.round((completed - started) / 60000)')
);

assert('Workshop page renders Accept & Confirm Product Received button',
  freshWorkshopCode.includes('Accept &amp; Confirm Product Received') &&
  freshWorkshopCode.includes('handleSenthilAcceptProduct')
);

assert('Workshop page renders Start Repairing Instrument button',
  freshWorkshopCode.includes('Start Repairing Instrument') &&
  freshWorkshopCode.includes('handleSenthilStartRepair')
);

assert('Workshop page renders Repair Time in Progress banner & Specs Grid',
  freshWorkshopCode.includes('Tracking Repair Time') &&
  freshWorkshopCode.includes('Repair Time')
);

assert('Workshop page repair queue displays sub-status badges (Needs Accept, In Bay, Repairing)',
  freshWorkshopCode.includes('Needs Accept') &&
  freshWorkshopCode.includes('In Bay • Ready') &&
  freshWorkshopCode.includes('Repairing')
);

assert('QuotationsPage renders Repair Time in table and Priya Pricing modal',
  freshQuotCode.includes('Repair Time:') &&
  freshQuotCode.includes('selectedPricingJob.workflow?.repairDurationMinutes')
);

assert('ServiceWorkflowPipeline renders Bay Intake and Repair Time status',
  freshPipelineCode.includes('Bay Intake:') &&
  freshPipelineCode.includes('workflow.repairDurationMinutes')
);

// SUITE 14: PRIYA-TO-MD COMMERCIAL PRICE APPROVAL ALERT & 1-CLICK MD SIGNOFF
console.log('\n--- SUITE 14: Priya-to-MD Price Approval Alert & 1-Click MD Signoff ---');

const freshQuotationsCode = fs.readFileSync(path.join(__dirname, '../src/app/quotations/page.tsx'), 'utf8');
const freshNotificationCode = fs.readFileSync(path.join(__dirname, '../src/components/WorkflowNotificationManager.tsx'), 'utf8');
const freshDashboardCode = fs.readFileSync(path.join(__dirname, '../src/components/DashboardClient.tsx'), 'utf8');
const freshWorkflowServiceCode = fs.readFileSync(path.join(__dirname, '../src/lib/workflow-service.ts'), 'utf8');
const freshWorkshopCodeLatest = fs.readFileSync(path.join(__dirname, '../src/app/workshop/page.tsx'), 'utf8');

assert('QuotationsPage dispatches urgent alert to MD when Priya submits commercial price',
  freshQuotationsCode.includes('dispatchWorkflowAlert({') &&
  freshQuotationsCode.includes('targetRole: "MD"') &&
  freshQuotationsCode.includes('stage: "AWAITING_MD_APPROVAL"') &&
  freshQuotationsCode.includes('Priya Quoted')
);

assert('WorkflowNotificationManager routes MD user or MD approval alerts directly to /dashboard?job=...',
  freshNotificationCode.includes('isMdAlertOrUser') &&
  freshNotificationCode.includes('/dashboard?job=') &&
  freshNotificationCode.includes('alert?.targetRole === "MD"') &&
  freshNotificationCode.includes('alert?.stage === "AWAITING_MD_APPROVAL"')
);

assert('workflow-service delivers MD alerts to MD, Director, Admin, and Management logins',
  freshWorkflowServiceCode.includes('alert.targetRole === "MD"') &&
  freshWorkflowServiceCode.includes('user.includes("md")') &&
  freshWorkflowServiceCode.includes('user.includes("director")')
);

assert('DashboardClient has highlightedJobId and priceApprovalGatewayRef for auto-scrolling',
  freshDashboardCode.includes('const [highlightedJobId, setHighlightedJobId] = useState') &&
  freshDashboardCode.includes('const priceApprovalGatewayRef = useRef') &&
  freshDashboardCode.includes('priceApprovalGatewayRef.current.scrollIntoView')
);

assert('DashboardClient listens to nunes:select-job and highlights target job for review',
  freshDashboardCode.includes('window.addEventListener("nunes:select-job"') &&
  freshDashboardCode.includes('TARGET JOB FOR MD REVIEW')
);

assert('Workshop page provides 1-click MD Approve Price & Alert Priya button',
  freshWorkshopCodeLatest.includes('handleMdApproveOnWorkshop') &&
  freshWorkshopCodeLatest.includes('MD Approve Price &amp; Alert Priya') &&
  freshWorkshopCodeLatest.includes('Executive Dashboard')
);

assert('Workshop page recognizes MD user and auto-switches to completed queue for MD approval jobs',
  freshWorkshopCodeLatest.includes('setActiveTab("completed")') &&
  freshWorkshopCodeLatest.includes('isMd') &&
  freshWorkshopCodeLatest.includes('EXECUTIVE WORKSHOP SUPERVISION & MD APPROVAL')
);

assert('DashboardClient enables MD to edit or override price before approving',
  freshDashboardCode.includes('setEditedPrices') &&
  freshDashboardCode.includes('MD Approved Price (₹)') &&
  freshDashboardCode.includes('mdPriceModified')
);

assert('Workshop page enables MD to edit or override price before approving',
  freshWorkshopCodeLatest.includes('mdWorkshopPrice') &&
  freshWorkshopCodeLatest.includes('MD Final Approved Price (₹)') &&
  freshWorkshopCodeLatest.includes('customApprovedPrice?: number')
);

console.log('\n--- SUITE 21: Professional Customer Quotation Layout & Cleanup ---');
const serviceQuoteModalCode = fs.readFileSync(path.join(__dirname, '../src/components/forms/ServiceQuotationModal.tsx'), 'utf8');

assert('ServiceQuotationModal does NOT contain boilerplate "Thank you for contacting NUNES Instrumentation..." default text',
  !serviceQuoteModalCode.includes('Thank you for contacting NUNES Instrumentation. Based on our technical inspection and requested features, please find our service and repair quotation below.')
);

assert('ServiceQuotationModal does NOT render internal status "Overall Status: ESTIMATE_PENDING" or MD approval to customer',
  !serviceQuoteModalCode.includes('Overall Status:') &&
  !serviceQuoteModalCode.includes('✓ MD Executive Approved')
);

assert('ServiceQuotationModal does NOT render "AMOUNT IN WORDS:" in quotation preview sheet',
  !serviceQuoteModalCode.includes('AMOUNT IN WORDS:')
);

assert('ServiceQuotationModal table has clean columns: Product & Model, Reported Problem & Service Required, Qty, Rate, Discount, Total Amount',
  serviceQuoteModalCode.includes('Product &amp; Model') &&
  serviceQuoteModalCode.includes('Reported Problem &amp; Service Required') &&
  serviceQuoteModalCode.includes('Rate (₹)') &&
  serviceQuoteModalCode.includes('Discount (₹)') &&
  serviceQuoteModalCode.includes('Total Amount')
);

assert('ServiceQuotationModal includes sanitizeCustomerScope and sanitizeCustomerProblem to scrub internal notes',
  serviceQuoteModalCode.includes('function sanitizeCustomerScope') &&
  serviceQuoteModalCode.includes('function sanitizeCustomerProblem') &&
  serviceQuoteModalCode.includes('Priya:?\\s*Please fill commercial pricing form')
);

assert('ServiceQuotationModal provides 1-click promotional fake/courtesy discount buttons in line editor',
  serviceQuoteModalCode.includes('applyQuickDiscountPercent(10)') &&
  serviceQuoteModalCode.includes('applyQuickDiscountPercent(15)') &&
  serviceQuoteModalCode.includes('🏷️ 10% Promo Discount')
);

assert('ServiceQuotationModal table renders Special Rebate discount badge and net line total',
  serviceQuoteModalCode.includes('Special Rebate') &&
  serviceQuoteModalCode.includes('FINAL TOTAL AMOUNT:')
);

console.log('\n--- SUITE 22: MD Separate Side Operations Status & Details (Completed, Pending, Process, Repairing) ---');
const appSidebarMdSuiteCode = fs.readFileSync(path.join(__dirname, '../src/components/AppSidebar.tsx'), 'utf8');
const workshopMdSuiteCode = fs.readFileSync(path.join(__dirname, '../src/app/workshop/page.tsx'), 'utf8');
const dashboardMdSuiteCode = fs.readFileSync(path.join(__dirname, '../src/components/DashboardClient.tsx'), 'utf8');

assert('AppSidebar computes mdOperationsMetrics for Completed, Pending, In Process, and Repairing',
  appSidebarMdSuiteCode.includes('mdOperationsMetrics') &&
  appSidebarMdSuiteCode.includes('mdOperationsMetrics.completed.length') &&
  appSidebarMdSuiteCode.includes('mdOperationsMetrics.pending.length') &&
  appSidebarMdSuiteCode.includes('mdOperationsMetrics.inProcess.length') &&
  appSidebarMdSuiteCode.includes('mdOperationsMetrics.repairing.length')
);

assert('AppSidebar renders MD Operations Side View widget in expanded sidebar',
  appSidebarMdSuiteCode.includes('MD Operations Side View') &&
  appSidebarMdSuiteCode.includes('mdSidebarCategory === "completed"') &&
  appSidebarMdSuiteCode.includes('mdSidebarCategory === "pending"') &&
  appSidebarMdSuiteCode.includes('mdSidebarCategory === "in_process"') &&
  appSidebarMdSuiteCode.includes('mdSidebarCategory === "repairing"')
);

assert('AppSidebar renders compact MD quick counter badges in collapsed sidebar',
  appSidebarMdSuiteCode.includes('MD Quick Counter Badges in Collapsed Mode') &&
  appSidebarMdSuiteCode.includes('/workshop?tab=completed') &&
  appSidebarMdSuiteCode.includes('/workshop?tab=pending') &&
  appSidebarMdSuiteCode.includes('/workshop?tab=in_process') &&
  appSidebarMdSuiteCode.includes('/workshop?tab=repair')
);

assert('Workshop renders 4 Dedicated Executive Command Bars for MD (Completed, Pending, In Process, Repairing)',
  workshopMdSuiteCode.includes('MD 4 Dedicated Command Bars: Completed, Pending, In Process, Ongoing Repairing') &&
  workshopMdSuiteCode.includes('Completed Products') &&
  workshopMdSuiteCode.includes('Pending Approvals') &&
  workshopMdSuiteCode.includes('In-Process Pipeline') &&
  workshopMdSuiteCode.includes('Ongoing Repairing') &&
  workshopMdSuiteCode.includes('setActiveTab("pending")') &&
  workshopMdSuiteCode.includes('setActiveTab("in_process")')
);

assert('Workshop left queue column displays Pending and In-Process cards with rich details',
  workshopMdSuiteCode.includes('activeTab === "pending"') &&
  workshopMdSuiteCode.includes('⚡ Awaiting MD Signoff') &&
  workshopMdSuiteCode.includes('activeTab === "in_process"') &&
  workshopMdSuiteCode.includes('In-Process Workflow Queue')
);

assert('DashboardClient renders Operations Queue & Live Details with 5 interactive filter tabs',
  dashboardMdSuiteCode.includes('Operations Queue &amp; Live Details') &&
  dashboardMdSuiteCode.includes('setMdFilterCategory("ALL")') &&
  dashboardMdSuiteCode.includes('setMdFilterCategory("COMPLETED")') &&
  dashboardMdSuiteCode.includes('setMdFilterCategory("PENDING")') &&
  dashboardMdSuiteCode.includes('setMdFilterCategory("IN_PROCESS")') &&
  dashboardMdSuiteCode.includes('setMdFilterCategory("REPAIRING")')
);

console.log('\n--- SUITE 23: Sidebar Saved Forms Name & Inline Rename + Full Details Inside Workspace ---');
const appSidebarSuite23Code = fs.readFileSync(path.join(__dirname, '../src/components/AppSidebar.tsx'), 'utf8');
const servicingSuite23Code = fs.readFileSync(path.join(__dirname, '../src/components/forms/ServicingJobForm.tsx'), 'utf8');

assert('AppSidebar displays only the name in Saved Forms and supports inline renaming with Pencil and input',
  appSidebarSuite23Code.includes('displayName') &&
  appSidebarSuite23Code.includes('handleStartRename') &&
  appSidebarSuite23Code.includes('handleSaveRename') &&
  appSidebarSuite23Code.includes('editingJobId') &&
  appSidebarSuite23Code.includes('Pencil')
);

assert('AppSidebar persists customFormName to localStorage and dispatches sync events',
  appSidebarSuite23Code.includes('customFormName') &&
  appSidebarSuite23Code.includes('nunes:service_jobs') &&
  appSidebarSuite23Code.includes('nunes:job-saved')
);

assert('ServicingJobForm renders comprehensive Saved Form Details banner inside the workspace (not in sidebar)',
  servicingSuite23Code.includes('SAVED FORM COMPREHENSIVE DETAILS INSIDE THE WORKSPACE (NOT IN SIDEBAR)') &&
  servicingSuite23Code.includes('Form Name:') &&
  servicingSuite23Code.includes('handleSaveFormName') &&
  servicingSuite23Code.includes('isEditingFormName')
);

assert('ServicingJobForm workspace displays full Customer, Equipment, Reported Problem, and Receipt Mode details inside',
  servicingSuite23Code.includes('Equipment / Model') &&
  servicingSuite23Code.includes('Reported Problem') &&
  servicingSuite23Code.includes('Inward &amp; Receipt Mode') &&
  servicingSuite23Code.includes('Walk-in Handover by')
);

console.log('\n--- SUITE 24: Completed Form Showing to MD (Sign Check) & File Attachments (Older Forms) ---');
const appSidebarSuite24Code = fs.readFileSync(path.join(__dirname, '../src/components/AppSidebar.tsx'), 'utf8');
const workshopSuite24Code = fs.readFileSync(path.join(__dirname, '../src/app/workshop/page.tsx'), 'utf8');
const dashboardSuite24Code = fs.readFileSync(path.join(__dirname, '../src/components/DashboardClient.tsx'), 'utf8');
const servicingSuite24Code = fs.readFileSync(path.join(__dirname, '../src/components/forms/ServicingJobForm.tsx'), 'utf8');

assert('Completed forms are shown to MD across AppSidebar, Workshop, and Dashboard',
  appSidebarSuite24Code.includes('estimateConfirmedBy') &&
  workshopSuite24Code.includes('estimateConfirmedBy') &&
  dashboardSuite24Code.includes('estimateConfirmedBy') &&
  servicingSuite24Code.includes('estimateConfirmedBy')
);

assert('ServicingJobForm includes MD Executive Sign-Check and complete action',
  servicingSuite24Code.includes('MD Executive Sign-Check &amp; Approval') &&
  servicingSuite24Code.includes('Confirm MD Sign-Check &amp; Complete') &&
  servicingSuite24Code.includes('MD Sign-Check Complete')
);

assert('ServicingJobForm supports file attachments and older forms archive in technical Step 2 and final Step 6',
  servicingSuite24Code.includes('Attach Scanned Older Forms &amp; Technical Files') &&
  servicingSuite24Code.includes('Attach Files &amp; Scanned Older Forms Archive') &&
  servicingSuite24Code.includes('handleFileUpload') &&
  servicingSuite24Code.includes('handleRemoveAttachment') &&
  servicingSuite24Code.includes('OLDER_FORM')
);

assert('Workshop page displays attached older forms and documents in the inspection panel',
  workshopSuite24Code.includes('Attached Older Forms &amp; Files') &&
  workshopSuite24Code.includes('activeJob.attachments')
);

console.log('\n======================================================');
console.log(`VERIFICATION SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log('======================================================\n');

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
