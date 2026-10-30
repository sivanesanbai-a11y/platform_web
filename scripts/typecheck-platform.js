const ts = require('C:/Users/NUNES/Desktop/nunes-service-desk-quotation-update/node_modules/typescript');
const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/components/DashboardClient.tsx');
console.log('Type-checking:', filePath);

const program = ts.createProgram([filePath], {
  noEmit: true,
  jsx: ts.JsxEmit.ReactJSX,
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  allowJs: true,
  checkJs: false,
  skipLibCheck: true
});

const diagnostics = ts.getPreEmitDiagnostics(program);
let errorCount = 0;
for (const diag of diagnostics) {
  if (diag.file && diag.file.fileName.includes('DashboardClient.tsx')) {
    const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
    const { line, character } = diag.file.getLineAndCharacterOfPosition(diag.start);
    console.log(`Line ${line + 1}:${character + 1} - ${message}`);
    errorCount++;
  }
}
console.log(`Finished: ${errorCount} errors in DashboardClient.tsx`);
