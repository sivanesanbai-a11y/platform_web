const ts = require('C:/Users/NUNES/Desktop/nunes-service-desk-quotation-update/node_modules/typescript');
const path = require('path');
const fs = require('fs');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (file.endsWith('.tsx') || (file.endsWith('.ts') && !file.endsWith('.d.ts'))) {
      results.push(fullPath);
    }
  });
  return results;
}

const allFiles = getFiles('src');
console.log(`Checking ${allFiles.length} files in src...`);

let totalUndeclared = 0;
for (const f of allFiles) {
  const program = ts.createProgram([f], {
    noEmit: true,
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    skipLibCheck: true
  });

  const diagnostics = ts.getPreEmitDiagnostics(program);
  const issues = [];
  for (const diag of diagnostics) {
    if (diag.file && path.resolve(diag.file.fileName) === path.resolve(f)) {
      if (diag.code === 2304 || diag.code === 2552) {
        // filter out browser globals like window, document, localStorage, CustomEvent, setTimeout, fetch, alert, confirm, console, etc.
        const msg = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
        const match = msg.match(/Cannot find name '([^']+)'/);
        if (match) {
          const name = match[1];
          const browserGlobals = new Set([
            'window', 'document', 'localStorage', 'sessionStorage', 'CustomEvent', 'Event',
            'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'fetch', 'alert', 'confirm',
            'console', 'prompt', 'navigator', 'location', 'history', 'URL', 'URLSearchParams',
            'Blob', 'File', 'FileReader', 'FormData', 'Headers', 'Request', 'Response',
            'MutationObserver', 'ResizeObserver', 'IntersectionObserver', 'HTMLDivElement',
            'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLSelectElement', 'HTMLElement',
            'HTMLFormElement', 'Element', 'Node', 'KeyboardEvent', 'MouseEvent', 'ChangeEvent',
            'React', 'NodeJS', 'Record', 'Partial', 'Set', 'Map', 'Promise', 'Date', 'Math', 'JSON',
            'RegExp', 'Error', 'TypeError', 'Array', 'String', 'Number', 'Boolean', 'Object', 'Function'
          ]);
          if (!browserGlobals.has(name)) {
            const { line, character } = diag.file.getLineAndCharacterOfPosition(diag.start);
            issues.push(`  Line ${line + 1}:${character + 1} - ${msg}`);
          }
        }
      }
    }
  }

  if (issues.length > 0) {
    console.log(`\n[FAIL] ${f}:`);
    console.log(issues.join('\n'));
    totalUndeclared += issues.length;
  }
}

console.log(`\n========================================`);
console.log(`Total undeclared identifier issues: ${totalUndeclared}`);
console.log(`========================================`);
