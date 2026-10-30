const fs = require('fs');
const path = require('path');

const files = [
  path.resolve(__dirname, '../src/components/DashboardClient.tsx'),
  path.resolve(__dirname, '../src/components/TasksClient.tsx'),
  path.resolve(__dirname, '../src/components/ActivityClient.tsx'),
  path.resolve(__dirname, '../src/components/FormsClient.tsx')
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  // Remove any misplaced CylindricalLoader import
  content = content.replace(/import CylindricalLoader from ['"]@\/components\/CylindricalLoader['"];\r?\n?/g, '');
  // Ensure "use client"; is at the top, followed immediately by the import
  content = content.replace(/^("use client";|'use client';)\r?\n?/, '');
  content = `"use client";\nimport CylindricalLoader from '@/components/CylindricalLoader';\n` + content;
  fs.writeFileSync(f, content, 'utf8');
  console.log('Corrected header in', f);
});
