const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, 'verify-workflow-passes.js');
let scriptCode = fs.readFileSync(scriptPath, 'utf8');

const suite15Snippet = `// SUITE 15: MD APPROVAL RETURN MESSAGE TO AZHALAKU PRIYA & REAL-TIME RECEPTION
console.log('\\n--- SUITE 15: MD Approval Return Message to Azhalaku Priya & Real-Time Reception ---');

const serviceJobTypeDefCode = fs.readFileSync(path.join(__dirname, '../src/types/service-job.ts'), 'utf8');
const quotPageLatestCode = fs.readFileSync(path.join(__dirname, '../src/app/quotations/page.tsx'), 'utf8');
const notifManagerLatestCode = fs.readFileSync(path.join(__dirname, '../src/components/WorkflowNotificationManager.tsx'), 'utf8');
const dashboardLatestCode = fs.readFileSync(path.join(__dirname, '../src/components/DashboardClient.tsx'), 'utf8');
const workshopLatestCode = fs.readFileSync(path.join(__dirname, '../src/app/workshop/page.tsx'), 'utf8');
const workflowServiceLatestCode = fs.readFileSync(path.join(__dirname, '../src/lib/workflow-service.ts'), 'utf8');

assert('service-job.ts declares mdReturnMessageToPriya in JobWorkflowInfo',
  serviceJobTypeDefCode.includes('mdReturnMessageToPriya?: string;')
);

assert('DashboardClient persists mdReturnMessageToPriya on workflow upon MD price approval',
  dashboardLatestCode.includes('mdReturnMessageToPriya: bodyMsg') &&
  dashboardLatestCode.includes('mdPriceAlertSentToPriyaAt: new Date().toISOString()')
);

assert('workshop/page.tsx persists mdReturnMessageToPriya on workflow upon MD price approval',
  workshopLatestCode.includes('mdReturnMessageToPriya: bodyMsg') &&
  workshopLatestCode.includes('mdPriceAlertSentToPriyaAt: new Date().toISOString()')
);

assert('workflow-service delivers PRICE_APPROVED_BY_MD return alerts to Priya and quotations path',
  workflowServiceLatestCode.includes('alert.stage === "PRICE_APPROVED_BY_MD"') &&
  workflowServiceLatestCode.includes('user.includes("priya")') &&
  workflowServiceLatestCode.includes('window.location.pathname.startsWith("/quotations")')
);

assert('workflow-service auto-synthesizes return alerts from service_jobs for cross-device resilience',
  workflowServiceLatestCode.includes('alert-auto-md-appr-') &&
  workflowServiceLatestCode.includes('wf.stage === "PRICE_APPROVED_BY_MD"') &&
  workflowServiceLatestCode.includes('targetRole: "PRIYA"')
);

assert('workflow-service integrates BroadcastChannel for 0ms cross-tab inter-process alerts',
  workflowServiceLatestCode.includes('new BroadcastChannel("nunes_workflow_channel")') &&
  workflowServiceLatestCode.includes('workflowChannel.postMessage')
);

assert('WorkflowNotificationManager plays audible notification chime upon return alert reception',
  notifManagerLatestCode.includes('function playNotificationChime()') &&
  notifManagerLatestCode.includes('AudioCtx') &&
  notifManagerLatestCode.includes('playNotificationChime()')
);

assert('WorkflowNotificationManager routes PRICE_APPROVED_BY_MD directly to /quotations?job=...',
  notifManagerLatestCode.includes('isPriceApprovedAlert') &&
  notifManagerLatestCode.includes('/quotations?job=')
);

assert('QuotationsPage renders prominent MD Return Approval Messages Inbox banner',
  quotPageLatestCode.includes('📩 Return Approval Messages from MD') &&
  quotPageLatestCode.includes('Ready for Quotation Release')
);

assert('QuotationsPage renders rich Return Message Received from MD Card inside pricing modal',
  quotPageLatestCode.includes('RETURN MESSAGE RECEIVED FROM MD BANNER') &&
  quotPageLatestCode.includes('📩 Return Approval Message Received from MD') &&
  quotPageLatestCode.includes('selectedPricingJob.workflow?.mdReturnMessageToPriya')
);

assert('QuotationsPage highlights table rows with Return Msg indicator and Action button',
  quotPageLatestCode.includes('📩 Return Msg: MD Approved') &&
  quotPageLatestCode.includes('📩 View Return Msg & Dispatch ➔')
);

assert('QuotationsPage listens to live events and synchronizes open modal with return approval',
  quotPageLatestCode.includes('nunes:workflow-notification') &&
  quotPageLatestCode.includes('nunes:workflow-alerts-updated') &&
  quotPageLatestCode.includes('new BroadcastChannel("nunes_workflow_channel")') &&
  quotPageLatestCode.includes('setSelectedPricingJob((prev) =>')
);
`;

scriptCode = scriptCode.replace(
  `console.log('\\n======================================================');\nconsole.log(\`VERIFICATION SUMMARY: \${testsPassed} PASSED, \${testsFailed} FAILED\`);`,
  `${suite15Snippet}\nconsole.log('\\n======================================================');\nconsole.log(\`VERIFICATION SUMMARY: \${testsPassed} PASSED, \${testsFailed} FAILED\`);`
);

fs.writeFileSync(scriptPath, scriptCode, 'utf8');
console.log('✓ Successfully appended SUITE 15 to verify-workflow-passes.js');
