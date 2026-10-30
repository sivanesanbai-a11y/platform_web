const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, '../data/nunes_cloud_store.json');
let data = {
  service_jobs: [],
  purchasing_orders: [],
  quotations: [],
  customers: [],
  suppliers: [],
  users: [],
  last_updated: new Date().toISOString()
};

if (fs.existsSync(storePath)) {
  try {
    data = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  } catch (e) {}
}

const defaultsFile = fs.readFileSync(path.join(__dirname, '../src/lib/service-defaults.ts'), 'utf8');

// Require ts-node or just read the jobs JSON directly from serverStore execution
console.log('Writing updated store file...');
