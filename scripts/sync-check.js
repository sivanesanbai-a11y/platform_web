const fs = require('fs');
const path = require('path');
const { put, head } = require('@vercel/blob');

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
  const store = {
    service_jobs: [
      { id: 'SJ-INIT-001', jobNo: 'SJ-INIT-001', customer: { name: 'Nunes Instruments' }, status: 'Delivered' },
      { id: 'SJ-CROSS-DEV-VERIFY', jobNo: 'SJ-CROSS-DEV-VERIFY', customer: { name: 'Priya Calibration Lab' }, status: 'In Servicing' }
    ],
    purchasing_orders: [],
    quotations: [],
    users: [
      { email: 'suganya@nunesinstruments.com', password: 'suganya@2026', createdAt: '2026-10-23T06:00:00.000Z' },
      { email: 'suganya', password: 'suganya@2026', createdAt: '2026-10-23T06:00:00.000Z' },
      { email: 'rekha@nunesinstruments.com', password: 'rekha@2026', createdAt: '2026-10-23T06:00:00.000Z' },
      { email: 'rekha', password: 'rekha@2026', createdAt: '2026-10-23T06:00:00.000Z' },
      { email: 'sabitha@nunesinstruments.com', password: 'sabitha@2026', createdAt: '2026-10-23T06:00:00.000Z' },
      { email: 'sabitha', password: 'sabitha@2026', createdAt: '2026-10-23T06:00:00.000Z' },
      { email: 'azhalakupriya@nunesinstruments.com', password: 'priya@2026', createdAt: '2026-10-23T06:00:00.000Z' },
      { email: 'azhalakupriya', password: 'priya@2026', createdAt: '2026-10-23T06:00:00.000Z' },
      { email: 'priya', password: 'priya@2026', createdAt: '2026-10-23T06:00:00.000Z' },
      { email: 'aravindh@nunesinstruments.com', password: 'aravindh@2026', createdAt: '2026-10-23T06:00:00.000Z' },
      { email: 'aravindh', password: 'aravindh@2026', createdAt: '2026-10-23T06:00:00.000Z' },
      { email: 'md@nunesinstruments.com', password: 'md@nunes2026', createdAt: '2026-10-23T06:00:00.000Z' },
      { email: 'md', password: 'md@nunes2026', createdAt: '2026-10-23T06:00:00.000Z' },
      { email: 'admin@nunes.com', password: 'admin123', createdAt: '2026-10-23T06:00:00.000Z' },
      { email: 'admin', password: 'admin123', createdAt: '2026-10-23T06:00:00.000Z' }
    ],
    last_updated: new Date().toISOString()
  };

  const res = await put('nunes_cloud_store.json', JSON.stringify(store, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    token: process.env.BLOB_READ_WRITE_TOKEN
  });
  console.log('Put res url:', res.url, 'downloadUrl:', res.downloadUrl);

  const fetchRes = await fetch(res.downloadUrl || res.url, { cache: 'no-store' });
  const data = await fetchRes.json();
  console.log('Fetched data jobs count:', data.service_jobs?.length);
}

test().catch(console.error);
