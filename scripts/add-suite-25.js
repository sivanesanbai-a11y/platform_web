const fs = require('fs');
const path = require('path');

let content = fs.readFileSync('scripts/verify-workflow-passes.js', 'utf8');

const suite25Code = `
console.log('\\n--- SUITE 25: Excel / Google Drive Sheet Backup & Older Data Reset ---');
const excelExportCode = fs.readFileSync(path.join(__dirname, '../src/lib/excel-export.ts'), 'utf8');
const googleBackupCode = fs.readFileSync(path.join(__dirname, '../src/app/api/backup/google/route.ts'), 'utf8');
const dataLibCode = fs.readFileSync(path.join(__dirname, '../src/lib/data.ts'), 'utf8');
const shellCode = fs.readFileSync(path.join(__dirname, '../src/components/Shell.tsx'), 'utf8');
const servicingFormCode = fs.readFileSync(path.join(__dirname, '../src/components/forms/ServicingJobForm.tsx'), 'utf8');
const dashboardClientCode = fs.readFileSync(path.join(__dirname, '../src/components/DashboardClient.tsx'), 'utf8');
const formsClientCode = fs.readFileSync(path.join(__dirname, '../src/components/FormsClient.tsx'), 'utf8');

assert('excel-export utility generates RFC 4180 CSV with UTF-8 BOM (\\\\uFEFF) for Microsoft Excel & Google Sheets',
  excelExportCode.includes('\\\\uFEFF') &&
  excelExportCode.includes('generateServiceJobsCsv') &&
  excelExportCode.includes('downloadServiceJobsExcel') &&
  excelExportCode.includes('exportAndBackupToDriveSheet')
);

assert('excel-export CSV headers cover complete job lifecycle, customer, equipment, pricing, signoffs, and attachments',
  excelExportCode.includes('"Job No"') &&
  excelExportCode.includes('"Form / Custom Name"') &&
  excelExportCode.includes('"Receipt Mode Details"') &&
  excelExportCode.includes('"Customer Name"') &&
  excelExportCode.includes('"Equipment Name"') &&
  excelExportCode.includes('"MD Approved Price (INR)"') &&
  excelExportCode.includes('"Attached Files"')
);

assert('/api/backup/google accepts sheet_csv and attaches nunes-sheet-*.csv to Google email & drive backup',
  googleBackupCode.includes('sheet_csv') &&
  googleBackupCode.includes('nunes-sheet-') &&
  googleBackupCode.includes('text/csv')
);

assert('clearAllOlderForms wipes all client storage, calls /api/data/reset-all, and triggers notification events',
  dataLibCode.includes('clearAllOlderForms') &&
  dataLibCode.includes('/api/data/reset-all') &&
  dataLibCode.includes('nunes:records-synced') &&
  dataLibCode.includes('nunes:forms-cleared')
);

assert('Shell.tsx updates purge key to nunes_purged_all_demo_v7 to guarantee clean slate across all devices',
  shellCode.includes('nunes_purged_all_demo_v7') &&
  shellCode.includes('/api/data/reset-all')
);

assert('ServicingJobForm renders Export Excel / Sheet and Remove Older Data & Start New buttons',
  servicingFormCode.includes('Export Excel / Sheet') &&
  servicingFormCode.includes('Export to Excel / Drive Sheet') &&
  servicingFormCode.includes('Remove Older Data &amp; Start New') &&
  servicingFormCode.includes('handleExportToSheet') &&
  servicingFormCode.includes('handleClearAllOlderForms')
);

assert('DashboardClient renders Export to Excel / Sheet and Clear Older Data in the Operations Queue',
  dashboardClientCode.includes('Export to Excel / Sheet') &&
  dashboardClientCode.includes('Clear Older Data') &&
  dashboardClientCode.includes('handleExportToSheet') &&
  dashboardClientCode.includes('handleResetOlderData')
);

assert('FormsClient renders Export to Excel / Drive Sheet and Remove Older Data action strip',
  formsClientCode.includes('Export to Excel / Drive Sheet') &&
  formsClientCode.includes('Remove Older Data &amp; Start New') &&
  formsClientCode.includes('handleExportSheet') &&
  formsClientCode.includes('handleClearData')
);
`;

const summaryTarget = "console.log('\\n======================================================');\nconsole.log(`VERIFICATION SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);";

if (content.includes(summaryTarget)) {
  content = content.replace(summaryTarget, suite25Code + '\n' + summaryTarget);
  fs.writeFileSync('scripts/verify-workflow-passes.js', content, 'utf8');
  console.log('[OK] Added SUITE 25 to verify-workflow-passes.js');
} else {
  console.error('[ERR] summaryTarget not found');
}
