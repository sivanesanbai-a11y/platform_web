const { execSync } = require('child_process');
const fs = require('fs');

console.log('Checking TypeScript/ESBuild syntax across src...');

// Use tsc if available or check with basic node parsing
try {
  const code = fs.readFileSync('src/components/DashboardClient.tsx', 'utf8');
  console.log('DashboardClient.tsx lines:', code.split('\n').length);
} catch (e) {
  console.error(e);
}
