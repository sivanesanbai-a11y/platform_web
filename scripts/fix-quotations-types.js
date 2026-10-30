const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/quotations/page.tsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// Fix 1: change export function getDeliveryModeInfo to function getDeliveryModeInfo and type cast wf, rc, dp as any
content = content.replace(
  'export function getDeliveryModeInfo(job: Partial<ServiceJob>) {',
  'function getDeliveryModeInfo(job: Partial<ServiceJob>) {'
);

content = content.replace(
  `  const wf = job.workflow || {};
  const rc = (job as any).receipt || {};
  const dp = (job as any).dispatch || {};`,
  `  const wf: any = job.workflow || {};
  const rc: any = (job as any).receipt || {};
  const dp: any = (job as any).dispatch || {};`
);

// Fix 2: add const rc in openPricingModal
if (!content.includes('const rc = (job as any).receipt || {};')) {
  content = content.replace(
    'const wf = job.workflow || ({} as any);',
    'const wf = job.workflow || ({} as any);\n    const rc = (job as any).receipt || {};'
  );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed types in src/app/quotations/page.tsx');
