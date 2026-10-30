const fs = require('fs');
const path = require('path');

// 1. Patch src/types/service-job.ts
const typesFile = path.join(__dirname, '..', 'src', 'types', 'service-job.ts');
let typesContent = fs.readFileSync(typesFile, 'utf8');
if (!typesContent.includes('estimatedSpareCost?: number;')) {
  typesContent = typesContent.replace(
    'mechanicProposedCost?: number;',
    'mechanicProposedCost?: number;\r\n  estimatedSpareCost?: number;'
  );
}
if (!typesContent.includes('isPaymentReceived?: boolean;')) {
  typesContent = typesContent.replace(
    'paymentReceivedAt?: string;',
    'isPaymentReceived?: boolean;\r\n  paymentReceivedAt?: string;'
  );
}
fs.writeFileSync(typesFile, typesContent, 'utf8');

// 2. Patch src/app/quotations/page.tsx
const quotFile = path.join(__dirname, '..', 'src', 'app', 'quotations', 'page.tsx');
let quotContent = fs.readFileSync(quotFile, 'utf8');

// Fix syncFormToCloud parameter
quotContent = quotContent.replace(
  'void syncFormToCloud(\n      "service_job",',
  'void syncFormToCloud(\n      "servicing",'
);
quotContent = quotContent.replace(
  'void syncFormToCloud(\r\n      "service_job",',
  'void syncFormToCloud(\r\n      "servicing",'
);

// Fix totals.spareParts
quotContent = quotContent.replace(
  'repairEstimate: pricingServiceCharge,\r\n        spareParts: pricingSpareParts,\r\n        discount: pricingDiscount,',
  'repairEstimate: pricingServiceCharge,\r\n        discount: pricingDiscount,'
);
quotContent = quotContent.replace(
  'repairEstimate: pricingServiceCharge,\n        spareParts: pricingSpareParts,\n        discount: pricingDiscount,',
  'repairEstimate: pricingServiceCharge,\n        discount: pricingDiscount,'
);

fs.writeFileSync(quotFile, quotContent, 'utf8');
console.log('SUCCESS: Patched types and quotations page');
