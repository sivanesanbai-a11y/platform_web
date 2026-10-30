const fs = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    process.env[match[1].trim()] = val.replace(/\\n/g, '\n');
  }
}

async function test() {
  try {
    const res = await put('nunes_cloud_store.json', JSON.stringify({ hello: 'world' }), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    console.log('Put res url:', res.url);
  } catch (e) {
    console.error('Put error message:', e.message);
  }
}
test();
