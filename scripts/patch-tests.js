const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'scripts', 'verify-workflow-passes.js');
let content = fs.readFileSync(file, 'utf8');

const isCRLF = content.includes('\r\n');
if (isCRLF) {
  content = content.replace(/\r\n/g, '\n');
}

const target = `assert('Benchmark has Aravindh verification details', bench.workflow?.aravindhBranchPickupDone === true && Boolean(bench.workflow?.aravindhProductPhoto));`;

const replacement = `assert('Benchmark has Aravindh branch pickup confirmed', bench.workflow?.aravindhBranchPickupDone === true);
assert('No dummy photos (/images/servicing_tools.png) present in benchmark record', !JSON.stringify(bench).includes('/images/servicing_tools.png'));
assert('Clean initial media states (zero dummy photos)', bench.workflow?.aravindhProductPhoto === "" && (!bench.workflow?.repairProofPhotos || bench.workflow?.repairProofPhotos.length === 0));`;

if (!content.includes(target)) {
  console.error('Target not found in verify-workflow-passes.js!');
  process.exit(1);
}

content = content.replace(target, replacement);

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(file, content, 'utf8');
console.log('verify-workflow-passes.js updated successfully!');
