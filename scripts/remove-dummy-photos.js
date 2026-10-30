const fs = require('fs');
const path = require('path');

// 1. Update src/lib/service-defaults.ts
const defaultsPath = path.join(__dirname, '..', 'src', 'lib', 'service-defaults.ts');
let defaultsContent = fs.readFileSync(defaultsPath, 'utf8');

defaultsContent = defaultsContent.replace(
  'proofImages: ["/images/servicing_tools.png"],',
  'proofImages: [],'
);
defaultsContent = defaultsContent.replace(
  'productImageUrl: "/images/servicing_tools.png",',
  'productImageUrl: "",'
);
defaultsContent = defaultsContent.replace(
  'productImageUrls: ["/images/servicing_tools.png"],',
  'productImageUrls: [],'
);
defaultsContent = defaultsContent.replace(
  'aravindhProductPhoto: "/images/servicing_tools.png",',
  'aravindhProductPhoto: "",'
);
defaultsContent = defaultsContent.replace(
  'repairProofPhotos: ["/images/servicing_tools.png"],',
  'repairProofPhotos: [],'
);

fs.writeFileSync(defaultsPath, defaultsContent, 'utf8');
console.log('src/lib/service-defaults.ts updated!');

// 2. Update data/nunes_cloud_store.json
const storePath = path.join(__dirname, '..', 'data', 'nunes_cloud_store.json');
let storeContent = fs.readFileSync(storePath, 'utf8');
const store = JSON.parse(storeContent);

if (store.service_jobs && store.service_jobs.length > 0) {
  store.service_jobs.forEach(job => {
    if (job.receipt) {
      job.receipt.proofImages = [];
    }
    if (job.products) {
      job.products.forEach(p => {
        p.productImageUrl = "";
        p.productImageUrls = [];
      });
    }
    if (job.workflow) {
      job.workflow.aravindhProductPhoto = "";
      job.workflow.aravindhProductVideo = "";
      job.workflow.repairProofPhotos = [];
      job.workflow.repairProofVideo = "";
    }
    job.proofPhotos = [];
    job.proofImages = [];
    job.proofVideo = "";
  });
}

fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log('data/nunes_cloud_store.json updated!');
