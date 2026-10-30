const ts = require('C:/Users/NUNES/Desktop/nunes-service-desk-quotation-update/node_modules/typescript');
const path = require('path');

const targetFile = process.argv[2] || 'src/components/DashboardClient.tsx';
const fullPath = path.resolve(targetFile);

const program = ts.createProgram([fullPath], {
  noEmit: true,
  jsx: ts.JsxEmit.ReactJSX,
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  skipLibCheck: true
});

const diagnostics = ts.getPreEmitDiagnostics(program);
const undeclared = [];
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

for (const diag of diagnostics) {
  if (diag.file && path.resolve(diag.file.fileName) === fullPath) {
    if (diag.code === 2304 || diag.code === 2552) {
      const msg = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
      const match = msg.match(/Cannot find name '([^']+)'/);
      if (match && !browserGlobals.has(match[1])) {
        const { line, character } = diag.file.getLineAndCharacterOfPosition(diag.start);
        undeclared.push(`Line ${line + 1}:${character + 1} - ${msg}`);
      }
    }
  }
}

console.log(`=== Undeclared in ${targetFile}: ${undeclared.length} ===`);
if (undeclared.length > 0) {
  console.log(undeclared.join('\n'));
}
