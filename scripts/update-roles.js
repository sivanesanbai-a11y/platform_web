const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'lib', 'role-routing.ts');
let content = fs.readFileSync(filePath, 'utf8');
const isCRLF = content.includes('\r\n');
let code = content.replace(/\r\n/g, '\n');

code = code.replace(
  '    const isAllowed =\n      pathname === "/workshop" ||',
  '    const isAllowed =\n      pathname === "/forms" ||\n      pathname.startsWith("/forms") ||\n      pathname === "/workshop" ||'
);

code = code.replace(
  '    const isAllowed =\n      pathname === "/quotations" ||',
  '    const isAllowed =\n      pathname === "/forms" ||\n      pathname.startsWith("/forms") ||\n      pathname === "/quotations" ||'
);

const finalContent = isCRLF ? code.replace(/\n/g, '\r\n') : code;
fs.writeFileSync(filePath, finalContent, 'utf8');
console.log('Successfully updated role-routing.ts');
