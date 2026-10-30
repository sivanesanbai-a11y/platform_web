const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const desktopZip = 'C:\\Users\\NUNES\\Desktop\\nunes-operations-platform.zip';

const psFile = path.join(rootDir, 'scripts', 'temp_pack.ps1');
const psContent = `
$exclude = @('.next', 'node_modules', '.git', '*.zip', '.vercel')
Get-ChildItem -Path '${rootDir}' -Exclude $exclude | Compress-Archive -DestinationPath '${desktopZip}' -Force
Write-Host "ZIP Created Successfully"
`;

fs.writeFileSync(psFile, psContent, 'utf8');
try {
  console.log('Building zip archive...');
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psFile}"`, { stdio: 'inherit' });
  console.log('Zip created successfully at: ' + desktopZip);
} finally {
  if (fs.existsSync(psFile)) fs.unlinkSync(psFile);
}
