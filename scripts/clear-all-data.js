const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, '..', 'data', 'nunes_cloud_store.json');
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

store.service_jobs = [];
store.purchasing_orders = [];
store.quotations = [];
store.customers = [];
store.suppliers = [];
store.last_updated = new Date().toISOString();

fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log('SUCCESS: Permanently removed all older operational data from nunes_cloud_store.json');
