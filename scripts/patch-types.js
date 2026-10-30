const fs = require('fs');
const file = 'C:/Users/NUNES/Desktop/NUNES_OPERATIONS_WORKSPACE/platform_web/src/types/service-job.ts';
let content = fs.readFileSync(file, 'utf8');

const isCRLF = content.includes('\r\n');
if (isCRLF) {
  content = content.replace(/\r\n/g, '\n');
}

const target = `  // Step 3: Senthil Repair Engineer Service Repair & Scope (30% / 50%)
  mechanicAssigned?: string;
  mechanicAssessment?: string;
  mechanicEstimateType?: 'MINIMUM_30' | 'MAXIMUM_50' | 'CUSTOM';
  mechanicProposedCost?: number;
  repairCompletedAt?: string;
  repairProofPhotos?: string[];
  repairProofVideo?: string;
  aravindhScopeSentToPriyaAt?: string;
  senthilScopeSentToPriyaAt?: string;

  // Step 4: Azhalaku Priya Service Price Entry
  priyaPriceEnteredBy?: string;
  priyaPriceEnteredAt?: string;
  priyaRepairEstimate?: number;
  priyaSparePartsCost?: number;
  priyaDiscount?: number;
  priyaGstRate?: number;
  priyaTotalQuotationAmount?: number;`;

const replacement = `  // Step 3: Senthil Repair Engineer Service Repair & Scope (30% / 50%)
  mechanicAssigned?: string;
  mechanicAssessment?: string;
  mechanicNotes?: string;
  repairScopePercent?: number;
  mechanicEstimateType?: 'MINIMUM_30' | 'MAXIMUM_50' | 'CUSTOM';
  mechanicProposedCost?: number;
  repairCompletedAt?: string;
  repairProofPhotos?: string[];
  repairProofVideo?: string;
  aravindhScopeSentToPriyaAt?: string;
  senthilScopeSentToPriyaAt?: string;

  // Step 4: Azhalaku Priya Service Price Entry
  priyaPriceEnteredBy?: string;
  priyaPriceEnteredAt?: string;
  priyaServiceCharge?: number;
  priyaRepairEstimate?: number;
  priyaSparePartsCost?: number;
  priyaDiscount?: number;
  priyaGstRate?: number;
  priyaTotalQuotationAmount?: number;`;

if (!content.includes(target)) {
  console.error('Target not found!');
  process.exit(1);
}

content = content.replace(target, replacement);

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(file, content, 'utf8');
console.log('service-job.ts updated successfully!');
