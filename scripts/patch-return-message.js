const fs = require('fs');
const path = require('path');

// 1. Patch DashboardClient.tsx
const dashboardPath = path.join(__dirname, '../src/components/DashboardClient.tsx');
let dashboardCode = fs.readFileSync(dashboardPath, 'utf8');

// Ensure mdReturnMessageToPriya and mdPriceAlertSentToPriyaAt are stored in updatedWorkflow
if (!dashboardCode.includes('mdReturnMessageToPriya: bodyMsg')) {
  dashboardCode = dashboardCode.replace(
    /const orig = originalAmount !== undefined \? originalAmount : Number\(job\.workflow\?\.priyaTotalQuotationAmount \|\| job\.totals\?\.totalEstimate \|\| 0\);\s*const isModified = approvedAmount !== orig;\s*const updatedWorkflow = \{([\s\S]*?)mdApprovedBy: "Managing Director \(MD\)",\s*\};/m,
    `const orig = originalAmount !== undefined ? originalAmount : Number(job.workflow?.priyaTotalQuotationAmount || job.totals?.totalEstimate || 0);
      const isModified = approvedAmount !== orig;

      const titleMsg = isModified
        ? \`✅ MD Adjusted & Approved ₹\${approvedAmount.toLocaleString("en-IN")} (Orig: ₹\${orig.toLocaleString("en-IN")}) for Job #\${job.jobNo}!\`
        : \`✅ MD Approved ₹\${approvedAmount.toLocaleString("en-IN")} for Job #\${job.jobNo}!\`;

      const bodyMsg = isModified
        ? \`MD adjusted and approved quotation price to ₹\${approvedAmount.toLocaleString("en-IN")} (modified from Priya's quote of ₹\${orig.toLocaleString("en-IN")}) directly from Executive Dashboard. Azhalaku Priya: Please fill courier/delivery details and send updated quotation.\`
        : \`MD approved quotation price ₹\${approvedAmount.toLocaleString("en-IN")} directly from Executive Dashboard. Azhalaku Priya: Please fill courier/delivery details and send quotation.\`;

      const updatedWorkflow = {
        ...(job.workflow || {}),
        stage: "PRICE_APPROVED_BY_MD",
        approvedByMd: true,
        mdApprovedPrice: approvedAmount,
        priyaTotalQuotationAmount: approvedAmount,
        mdPriceModified: isModified,
        originalQuotedPrice: orig,
        mdApprovedAt: new Date().toISOString(),
        mdApprovedBy: "Managing Director (MD)",
        mdReturnMessageToPriya: bodyMsg,
        mdPriceAlertSentToPriyaAt: new Date().toISOString(),
      };`
  );
  fs.writeFileSync(dashboardPath, dashboardCode, 'utf8');
  console.log('✓ Successfully patched DashboardClient.tsx with mdReturnMessageToPriya');
} else {
  console.log('• DashboardClient.tsx already has mdReturnMessageToPriya');
}

// 2. Patch workshop/page.tsx
const workshopPath = path.join(__dirname, '../src/app/workshop/page.tsx');
let workshopCode = fs.readFileSync(workshopPath, 'utf8');

if (!workshopCode.includes('mdReturnMessageToPriya: bodyMsg')) {
  workshopCode = workshopCode.replace(
    /const updatedWorkflow: JobWorkflowInfo = \{([\s\S]*?)mdApprovedBy: "MD \(Managing Director\)",\s*\};([\s\S]*?)const titleMsg = isModified([\s\S]*?)const bodyMsg = isModified([\s\S]*?);/m,
    `const titleMsg = isModified
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
    };`
  );
  fs.writeFileSync(workshopPath, workshopCode, 'utf8');
  console.log('✓ Successfully patched workshop/page.tsx with mdReturnMessageToPriya');
} else {
  console.log('• workshop/page.tsx already has mdReturnMessageToPriya');
}

console.log('All patches applied.');
