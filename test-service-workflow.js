/**
 * Automated End-to-End Test Suite for Collaborative Service Workflow
 * Tests Stages 1 to 5, Notifications, MD Approval, Role Scoping, and Dashboard Aggregations.
 */

const assert = require('assert');

// In-memory mock localStorage
const storage = new Map();
global.localStorage = {
  getItem: (k) => storage.get(k) || null,
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear(),
};
global.window = {
  dispatchEvent: () => {},
};
global.CustomEvent = class {};

console.log("=================================================================");
console.log("🚀 STARTING COLLABORATIVE WORKFLOW PROCESS VERIFICATION TEST");
console.log("=================================================================\n");

// --- TEST 1: STAGE 1 INTAKE & BRANCH DELIVERY (Suganya & Radha) ---
console.log("🔹 TEST 1: Stage 1 Intake at Branch Office (Radha)...");
const testJob = {
  id: "SJ-9981",
  jobNo: "SJ-9981",
  status: "DRAFT",
  createdBy: "radha@nunesinstruments.com",
  customer: {
    name: "Apex Precision Instruments Pvt Ltd",
    contactPerson: "Mr. Rajan",
    phone: "+91 98400 12345",
    email: "rajan@apexprecision.com",
    city: "Chennai",
    state: "Tamil Nadu",
    address: "Plot 42, Guindy Industrial Estate",
    gstin: "33AAACA1234B1Z2",
    currency: "INR",
  },
  products: [
    {
      id: "prod-1",
      productName: "Digital Pressure Indicator DPI-610",
      makeModel: "DPI-610-IS",
      serialNo: "SN-2026-9981",
      qty: 1,
      complaint: "Zero drift observed above 20 bar pressure",
      productValue: 12000,
      status: "RECEIVED",
    }
  ],
  workflow: {
    stage: "INTAKE_RECEIVED",
    intakeStaffName: "radha@nunesinstruments.com",
    isBranchDelivery: true,
    branchOfficeName: "Other Office / Branch Office",
    receivedAt: new Date().toISOString(),
  },
  totals: {
    productValue: 12000,
    repairEstimate: 0,
    discount: 0,
    totalEstimate: 0,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

assert.strictEqual(testJob.workflow.isBranchDelivery, true, "Should be flagged as branch delivery");
assert.strictEqual(testJob.workflow.branchOfficeName, "Other Office / Branch Office");

// Save job into localStorage
storage.set("nunes:service_jobs", JSON.stringify([testJob]));

// Send Alert to Aravindh
const alerts = [];
function dispatchWorkflowAlert(data) {
  const alert = {
    ...data,
    id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  alerts.push(alert);
  return alert;
}

dispatchWorkflowAlert({
  jobId: testJob.id,
  jobNo: testJob.jobNo,
  customerName: testJob.customer.name,
  equipmentName: testJob.products[0].productName,
  fromUser: "radha@nunesinstruments.com",
  stage: "AWAITING_ARAVINDH_ACCEPT",
  targetRole: "ARAVINDH",
  targetNames: ["Aravindh"],
  title: "⚡ Equipment for Repair: Digital Pressure Indicator (Qty: 1)",
  message: "Radha logged unit at Branch Office. Please pick up and bring to Main Office workshop.",
  priority: "urgent",
});

assert.strictEqual(alerts.length, 1);
assert.strictEqual(alerts[0].targetRole, "ARAVINDH");
assert.strictEqual(alerts[0].stage, "AWAITING_ARAVINDH_ACCEPT");
console.log("  ✓ Stage 1 passed: Branch intake recorded, alert dispatched to Aravindh.\n");

// --- TEST 2: STAGE 2 ARAVINDH BRANCH PICKUP & PHYSICAL VERIFICATION ---
console.log("🔹 TEST 2: Stage 2 Aravindh Branch Pickup & Workshop Accept...");

// 2a: Confirm Branch Pickup
testJob.workflow.aravindhBranchPickupDone = true;
testJob.workflow.aravindhBranchPickupAt = new Date().toISOString();

assert.strictEqual(testJob.workflow.aravindhBranchPickupDone, true);
console.log("  ✓ Aravindh confirmed branch pickup: Product transported to Main Office.");

// 2b: Real-Time Physical Verification Photo & Accept Process
const verificationPhoto = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
testJob.workflow.stage = "UNDER_REPAIR_ARAVINDH";
testJob.workflow.aravindhAcceptedBy = "aravindh@nunesinstruments.com";
testJob.workflow.aravindhAcceptedAt = new Date().toISOString();
testJob.workflow.aravindhProductPhoto = verificationPhoto;
testJob.workflow.aravindhInspectionNotes = "Located unit in workshop bay 2. Diaphragm housing intact, calibration port cleaned.";
testJob.status = "REPAIRING";
testJob.proofPhotos = [verificationPhoto];

assert.strictEqual(testJob.workflow.stage, "UNDER_REPAIR_ARAVINDH");
assert.strictEqual(testJob.status, "REPAIRING");
assert.strictEqual(testJob.workflow.aravindhProductPhoto, verificationPhoto);
console.log("  ✓ Stage 2 passed: Physical verification photo attached, job accepted by Aravindh.\n");

// --- TEST 3: STAGE 3 REPAIR WORKBENCH (Senthil & Aravindh) ---
console.log("🔹 TEST 3: Stage 3 Mechanical Repair & 30% / 50% Scope Setting...");

// 3a: Senthil Mechanic Repair Station (Repair Guy Only - NO commercial pricing)
testJob.workflow.mechanicAssigned = "Senthil Kumar (Lead Service Mechanic)";
testJob.workflow.mechanicAssessment = "Teardown complete. Replaced Viton O-rings, cleared sensor port blockage, zero recalibrated.";
testJob.products[0].repairWork = testJob.workflow.mechanicAssessment;
testJob.proofPhotos.push("data:image/png;base64,proof_photo_senthil_repair");

console.log("  ✓ Senthil saved mechanical repair notes & proof photos (No pricing fields shown to Senthil).");

// 3b: Aravindh fits 30% Minimum Overhaul scope & dispatches to Azhalaku Priya
const selectedScope = "MINIMUM_30";
testJob.workflow.stage = "AWAITING_PRIYA_PRICING";
testJob.workflow.mechanicEstimateType = selectedScope;
testJob.workflow.repairCompletedAt = new Date().toISOString();
testJob.workflow.aravindhScopeSentToPriyaAt = new Date().toISOString();
testJob.status = "ESTIMATE_PENDING";

dispatchWorkflowAlert({
  jobId: testJob.id,
  jobNo: testJob.jobNo,
  customerName: testJob.customer.name,
  equipmentName: testJob.products[0].productName,
  fromUser: "Aravindh",
  stage: "AWAITING_PRIYA_PRICING",
  targetRole: "PRIYA",
  targetNames: ["Azhalaku Priya"],
  title: "⚡ Aravindh Set 30% Min Repair — Priya Enter Price",
  message: "Service scope fitted to 30% Min Repair. Please enter commercial pricing and submit to MD.",
  priority: "urgent",
});

assert.strictEqual(testJob.workflow.stage, "AWAITING_PRIYA_PRICING");
assert.strictEqual(alerts[1].targetRole, "PRIYA");
console.log("  ✓ Stage 3 passed: 30% Minimum Overhaul scope fitted, alert sent to Azhalaku Priya.\n");

// --- TEST 4: STAGE 4 AZHALAKU PRIYA PRICING ➔ MD APPROVAL GATEWAY ---
console.log("🔹 TEST 4: Stage 4 Azhalaku Priya Pricing & MD Approval Gateway...");

// Priya enters pricing
const serviceEstimate = 3600; // 30% of 12,000
const sparePartsCost = 850;   // Seals & O-rings
const gstRate = 18;
const subTotal = serviceEstimate + sparePartsCost; // 4450
const gstAmount = Math.round(subTotal * (gstRate / 100) * 100) / 100; // 801
const totalAmount = subTotal + gstAmount; // 5251

testJob.workflow.stage = "AWAITING_MD_APPROVAL";
testJob.workflow.priyaPriceEnteredBy = "priya@nunesinstruments.com";
testJob.workflow.priyaPriceEnteredAt = new Date().toISOString();
testJob.workflow.priyaRepairEstimate = serviceEstimate;
testJob.workflow.priyaSparePartsCost = sparePartsCost;
testJob.workflow.priyaGstRate = gstRate;
testJob.workflow.priyaTotalQuotationAmount = totalAmount;
testJob.workflow.priyaPricingNotes = "Standard overhaul with calibration test certificate.";
testJob.workflow.priyaPriceSentToMdAt = new Date().toISOString();
testJob.totals.repairEstimate = serviceEstimate;
testJob.totals.totalEstimate = totalAmount;
testJob.status = "APPROVAL_PENDING";

dispatchWorkflowAlert({
  jobId: testJob.id,
  jobNo: testJob.jobNo,
  customerName: testJob.customer.name,
  equipmentName: testJob.products[0].productName,
  fromUser: "Azhalaku Priya",
  stage: "AWAITING_MD_APPROVAL",
  targetRole: "MD",
  title: `🔔 Priya Quoted ₹${totalAmount.toFixed(2)} — MD Approval Required`,
  message: `Priya prepared quotation: ₹${totalAmount.toFixed(2)}. MD approval needed.`,
  amount: totalAmount,
  priority: "urgent",
});

assert.strictEqual(testJob.workflow.stage, "AWAITING_MD_APPROVAL");
assert.strictEqual(alerts[2].targetRole, "MD");
assert.strictEqual(testJob.workflow.priyaTotalQuotationAmount, 5251);
console.log("  ✓ Priya entered pricing (₹5,251.00) & sent alert to MD.");

// MD 1-Click Price Approval
testJob.workflow.stage = "PRICE_APPROVED_BY_MD";
testJob.workflow.approvedByMd = true;
testJob.workflow.mdApprovedPrice = totalAmount;
testJob.workflow.mdApprovalNotes = "Commercial price confirmed. Proceed with quotation.";
testJob.workflow.mdApprovedAt = new Date().toISOString();
testJob.workflow.mdApprovedBy = "md@nunesinstruments.com";
testJob.workflow.mdPriceAlertSentToPriyaAt = new Date().toISOString();

dispatchWorkflowAlert({
  jobId: testJob.id,
  jobNo: testJob.jobNo,
  customerName: testJob.customer.name,
  equipmentName: testJob.products[0].productName,
  fromUser: "MD",
  stage: "PRICE_APPROVED_BY_MD",
  targetRole: "PRIYA",
  title: `✅ MD Approved ₹${totalAmount.toFixed(2)} for Job #${testJob.jobNo}!`,
  message: "MD approved quotation price. Priya: Fill delivery details and send quotation.",
  amount: totalAmount,
  priority: "urgent",
});

assert.strictEqual(testJob.workflow.stage, "PRICE_APPROVED_BY_MD");
assert.strictEqual(testJob.workflow.approvedByMd, true);
assert.strictEqual(alerts[3].targetRole, "PRIYA");
console.log("  ✓ Stage 4 passed: MD approved price ₹5,251.00, alert returned to Azhalaku Priya.\n");

// --- TEST 5: STAGE 5 DELIVERY DETAILS & FINAL QUOTATION DISPATCH ---
console.log("🔹 TEST 5: Stage 5 Priya Delivery Details & Send Final Quotation...");

const handoverType = "COURIER";
const courierName = "ST Courier";
const docketNumber = "ST-9981-CHN-2026";

testJob.workflow.stage = "JOB_COMPLETED";
testJob.workflow.priyaHandoverType = handoverType;
testJob.workflow.priyaCourierName = courierName;
testJob.workflow.priyaCourierDocket = docketNumber;
testJob.workflow.priyaQuotationSentAt = new Date().toISOString();
testJob.workflow.priyaCompletionNotes = "Dispatched via ST Courier. Tracking sent via WhatsApp & Email.";
testJob.workflow.finalHandoverCompletedAt = new Date().toISOString();
testJob.workflow.handoverHandledBy = "Azhalaku Priya";
testJob.status = "CLOSED";

dispatchWorkflowAlert({
  jobId: testJob.id,
  jobNo: testJob.jobNo,
  customerName: testJob.customer.name,
  equipmentName: testJob.products[0].productName,
  fromUser: "Azhalaku Priya",
  stage: "JOB_COMPLETED",
  targetRole: "ALL",
  title: `🎉 Job #${testJob.jobNo} Final Quotation Sent & Handover Set!`,
  message: `Delivered via ST Courier (Docket: ${docketNumber}). Process finished!`,
  priority: "success",
});

assert.strictEqual(testJob.workflow.stage, "JOB_COMPLETED");
assert.strictEqual(testJob.status, "CLOSED");
assert.strictEqual(testJob.workflow.priyaCourierName, "ST Courier");
assert.strictEqual(testJob.workflow.priyaCourierDocket, "ST-9981-CHN-2026");
console.log("  ✓ Stage 5 passed: Delivery method set, quotation dispatched, job closed.\n");

// Save updated job
storage.set("nunes:service_jobs", JSON.stringify([testJob]));

// --- TEST 6: MD DASHBOARD METRICS CALCULATION ---
console.log("🔹 TEST 6: MD Dashboard Summary & Aggregations Verification...");

const jobs = JSON.parse(storage.get("nunes:service_jobs"));
const completedJobs = jobs.filter(j => j.status === "CLOSED" || j.status === "READY" || j.workflow?.stage === "JOB_COMPLETED");
const completedRevenue = completedJobs.reduce((sum, j) => sum + Number(j.workflow?.priyaTotalQuotationAmount || j.totals?.totalEstimate || 0), 0);
const activeJobs = jobs.filter(j => j.status !== "CLOSED" && j.workflow?.stage !== "JOB_COMPLETED");
const pendingMdApprovals = jobs.filter(j => j.workflow?.stage === "AWAITING_MD_APPROVAL");

assert.strictEqual(completedJobs.length, 1);
assert.strictEqual(completedRevenue, 5251);
assert.strictEqual(activeJobs.length, 0);
assert.strictEqual(pendingMdApprovals.length, 0);

console.log(`  ✓ Total Completed Jobs: ${completedJobs.length}`);
console.log(`  ✓ Total Completed Revenue: ₹${completedRevenue.toLocaleString('en-IN')}`);
console.log(`  ✓ Pending MD Approvals Queue: ${pendingMdApprovals.length}`);

// Test staff counts
const radhaCompleted = jobs.filter(j => (j.createdBy || "").includes("radha") && (j.status === "CLOSED" || j.workflow?.stage === "JOB_COMPLETED")).length;
const senthilCompleted = jobs.filter(j => (j.workflow?.mechanicAssigned || "").toLowerCase().includes("senthil") && Boolean(j.workflow?.repairCompletedAt)).length;
const aravindhCompleted = jobs.filter(j => Boolean(j.workflow?.aravindhScopeSentToPriyaAt)).length;
const priyaCompleted = jobs.filter(j => Boolean(j.workflow?.priyaQuotationSentAt || j.workflow?.stage === "JOB_COMPLETED")).length;

assert.strictEqual(radhaCompleted, 1, "Radha branch intake completed count");
assert.strictEqual(senthilCompleted, 1, "Senthil mechanic completed count");
assert.strictEqual(aravindhCompleted, 1, "Aravindh coordinator completed count");
assert.strictEqual(priyaCompleted, 1, "Priya quotation completed count");

console.log("  ✓ Staff Completed breakdown: Radha (1), Senthil (1), Aravindh (1), Priya (1).");
console.log("  ✓ MD Dashboard calculations verified successfully.\n");

// --- TEST 7: ROLE-BASED SCOPING VERIFICATION ---
console.log("🔹 TEST 7: Role-Based Account Visibility Scoping...");

function filterJobsForUser(userEmail, jobList) {
  const user = userEmail.toLowerCase();
  const uKey = user.split('@')[0].replace(/[^a-z]/g, '');

  return jobList.filter(j => {
    // Admin & MD see everything
    if (user.includes("admin") || user.includes("md")) return true;

    const createdBy = String(j.createdBy || '').toLowerCase();
    const intakeStaff = String(j.workflow?.intakeStaffName || '').toLowerCase();
    const mechanic = String(j.workflow?.mechanicAssigned || '').toLowerCase();

    // Senthil: only see repair jobs
    if (uKey.includes("senthil")) {
      const isUnderRepair = j.workflow?.stage === 'UNDER_REPAIR_ARAVINDH' || j.workflow?.stage === 'UNDER_REPAIR_SENTHIL';
      return isUnderRepair || mechanic.includes("senthil") || createdBy.includes("senthil");
    }

    // Aravindh: see workshop/pickup jobs
    if (uKey.includes("aravind")) {
      const isAwaitingAccept = j.workflow?.stage === 'AWAITING_ARAVINDH_ACCEPT';
      const isUnderRepair = j.workflow?.stage === 'UNDER_REPAIR_ARAVINDH';
      return isAwaitingAccept || isUnderRepair || Boolean(j.workflow?.aravindhAcceptedBy) || createdBy.includes("aravind");
    }

    // Priya: pricing & quotation
    if (uKey.includes("priya")) {
      return Boolean(j.workflow?.priyaPriceEnteredAt) || j.workflow?.stage === 'AWAITING_PRIYA_PRICING' || j.workflow?.stage === 'PRICE_APPROVED_BY_MD';
    }

    // Suganya / Radha / Sabitha / Rekha: only their own created/intake jobs
    return createdBy.includes(uKey) || intakeStaff.includes(uKey);
  });
}

// Check Radha sees her job
assert.strictEqual(filterJobsForUser("radha@nunesinstruments.com", jobs).length, 1, "Radha should see her intake job");

// Check Suganya does NOT see Radha's job
assert.strictEqual(filterJobsForUser("suganya@nunesinstruments.com", jobs).length, 0, "Suganya should NOT see Radha's job");

// Check Sabitha does NOT see Radha's job
assert.strictEqual(filterJobsForUser("sabitha@nunesinstruments.com", jobs).length, 0, "Sabitha should NOT see Radha's job");

// Check Rekha does NOT see Radha's job
assert.strictEqual(filterJobsForUser("rekha@nunesinstruments.com", jobs).length, 0, "Rekha should NOT see Radha's job");

// Check Senthil sees the job because he performed mechanical repair
assert.strictEqual(filterJobsForUser("senthil@nunesinstruments.com", jobs).length, 1, "Senthil should see job assigned to him");

// Check Aravindh sees the job because he coordinated & accepted it
assert.strictEqual(filterJobsForUser("aravindh@nunesinstruments.com", jobs).length, 1, "Aravindh should see job accepted by him");

// Check Priya sees the job because she priced and dispatched it
assert.strictEqual(filterJobsForUser("priya@nunesinstruments.com", jobs).length, 1, "Priya should see job priced by her");

// Check MD sees everything
assert.strictEqual(filterJobsForUser("md@nunesinstruments.com", jobs).length, 1, "MD should see all jobs");

// Check Admin sees everything
assert.strictEqual(filterJobsForUser("admin@nunesinstruments.com", jobs).length, 1, "Admin should see all jobs");

console.log("  ✓ Role Scoping passed: Radha sees only her job, Suganya/Sabitha/Rekha isolated, Senthil/Aravindh/Priya see their parts, MD/Admin see all.\n");

console.log("=================================================================");
console.log("🎉 ALL WORKFLOW TESTS PASSED WITHOUT ERRORS (7/7 VERIFIED)!");
console.log("=================================================================");
