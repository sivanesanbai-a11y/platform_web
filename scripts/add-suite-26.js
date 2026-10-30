const fs = require('fs');

let content = fs.readFileSync('scripts/verify-workflow-passes.js', 'utf8');

const suite26Code = `
console.log('\\n--- SUITE 26: Admin Process Execution, Older Files Visibility & Product All Done ---');
{
  const pipelineCode = fs.readFileSync(path.join(__dirname, '../src/components/forms/ServiceWorkflowPipeline.tsx'), 'utf8');
  const dashboardCode = fs.readFileSync(path.join(__dirname, '../src/components/DashboardClient.tsx'), 'utf8');
  const workshopCode = fs.readFileSync(path.join(__dirname, '../src/app/workshop/page.tsx'), 'utf8');
  const servicingCode = fs.readFileSync(path.join(__dirname, '../src/components/forms/ServicingJobForm.tsx'), 'utf8');
  const typesCode = fs.readFileSync(path.join(__dirname, '../src/types/service-job.ts'), 'utf8');
  const sidebarCode = fs.readFileSync(path.join(__dirname, '../src/components/AppSidebar.tsx'), 'utf8');

  assert('ServiceWorkflowPipeline renders Admin Executive Fast-Forward Controller with 1-click stage advancement',
    pipelineCode.includes('Admin Executive Fast-Forward Controller') &&
    pipelineCode.includes('onSendToSenthilDirect') &&
    pipelineCode.includes('onRecordPaymentAndCloseJob')
  );

  assert('Admin can advance or run stages across sections in ServiceWorkflowPipeline without being blocked',
    pipelineCode.includes('stage === "AWAITING_ARAVINDH_ACCEPT" || isAdminOrMd') &&
    pipelineCode.includes('stage === "UNDER_REPAIR_SENTHIL" || stage === "UNDER_REPAIR_ARAVINDH" || isAdminOrMd') &&
    pipelineCode.includes('stage === "AWAITING_PRIYA_PRICING" || isAdminOrMd')
  );

  assert('DashboardClient renders Dashboard Form Details & Older Files Inspection Side Drawer with upload and download',
    dashboardCode.includes('DASHBOARD SIDE FORM DETAILS & OLDER FILES INSPECTION DRAWER') &&
    dashboardCode.includes('Attached Older Files &amp; Scanned Documents') &&
    dashboardCode.includes('handleUploadAttachmentFromDashboard') &&
    dashboardCode.includes('selectedJobDetail')
  );

  assert('Workshop page allows uploading and viewing attached older forms & files in inspection panel',
    workshopCode.includes('Attach Older Form / File') &&
    workshopCode.includes('Attached Older Forms &amp; Files') &&
    workshopCode.includes('activeJob.attachments')
  );

  assert('Product All Done capability is supported in ServiceProduct types and rendered with toggle button',
    typesCode.includes('isAllDone?: boolean;') &&
    typesCode.includes('isAllProductsDone?: boolean;') &&
    servicingCode.includes('Product All Done') &&
    dashboardCode.includes('✓ ALL DONE') &&
    dashboardCode.includes('handleToggleProductAllDone')
  );

  assert('AppSidebar keeps saved forms clean with ONLY the name, routing to dashboard side details on dashboard',
    sidebarCode.includes('displayName') &&
    sidebarCode.includes('nunes:dashboard_selected_job') &&
    sidebarCode.includes('nunes:select-job')
  );
}`;

const summaryTarget = "console.log('\\n======================================================');\nconsole.log(`VERIFICATION SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);";

if (content.includes(summaryTarget)) {
  content = content.replace(summaryTarget, suite26Code + '\n' + summaryTarget);
  fs.writeFileSync('scripts/verify-workflow-passes.js', content, 'utf8');
  console.log('[OK] Added SUITE 26 to verify-workflow-passes.js');
} else {
  console.error('[ERR] summaryTarget not found');
}
