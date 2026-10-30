const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'types', 'service-job.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF for search
const isCRLF = content.includes('\r\n');
let normalized = content.replace(/\r\n/g, '\n');

const searchStr = `  // Step 2: Aravindh Branch Pickup & Real-Time Acceptance
  aravindhBranchPickupDone?: boolean;
  aravindhBranchPickupAt?: string;
  aravindhAcceptedBy?: string;
  aravindhAcceptedAt?: string;
  aravindhProductPhoto?: string;
  aravindhInspectionNotes?: string;

  // Step 3: Aravindh & Senthil Service Repair & Scope (30% / 50%)
  mechanicAssigned?: string;
  mechanicAssessment?: string;
  mechanicEstimateType?: 'MINIMUM_30' | 'MAXIMUM_50' | 'CUSTOM';
  mechanicProposedCost?: number;
  repairCompletedAt?: string;
  repairProofPhotos?: string[];
  repairProofVideo?: string;
  aravindhScopeSentToPriyaAt?: string;

  // Step 4: Azhalaku Priya Service Price Entry
  priyaPriceEnteredBy?: string;
  priyaPriceEnteredAt?: string;
  priyaRepairEstimate?: number;
  priyaSparePartsCost?: number;
  priyaGstRate?: number;
  priyaTotalQuotationAmount?: number;
  priyaPricingNotes?: string;
  priyaPriceSentToMdAt?: string;

  // Step 5: MD Price Approval
  approvedByMd?: boolean;
  mdApprovalAt?: string;
  mdApprovedAt?: string;
  mdApprovedBy?: string;
  mdConfirmedPrice?: number;
  mdApprovedPrice?: number;
  mdNotes?: string;
  mdApprovalNotes?: string;
  mdPriceAlertSentToPriyaAt?: string;

  // Step 6: Azhalaku Priya Final Delivery Details & Quotation Send
  priyaHandoverType?: 'COURIER' | 'DIRECT_HANDOVER' | 'FIELD_PICKUP';
  priyaDeliveryPersonName?: string;
  priyaCourierDocket?: string;
  priyaCourierName?: string;
  priyaQuotationSentAt?: string;
  priyaCompletionNotes?: string;`;

const replaceStr = `  // Step 2: Aravindh Branch Pickup & Real-Time Acceptance
  aravindhBranchPickupDone?: boolean;
  aravindhBranchPickupAt?: string;
  aravindhAcceptedBy?: string;
  aravindhAcceptedAt?: string;
  aravindhProductPhoto?: string;
  aravindhProductVideo?: string;
  aravindhInspectionNotes?: string;

  // Step 3: Senthil Repair Engineer Service Repair & Scope (30% / 50%)
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
  priyaTotalQuotationAmount?: number;
  priyaPricingNotes?: string;
  priyaPriceSentToMdAt?: string;

  // Step 5: MD Price Approval
  approvedByMd?: boolean;
  mdApprovalAt?: string;
  mdApprovedAt?: string;
  mdApprovedBy?: string;
  mdConfirmedPrice?: number;
  mdApprovedPrice?: number;
  mdDiscount?: number;
  mdNotes?: string;
  mdApprovalNotes?: string;
  mdPriceAlertSentToPriyaAt?: string;

  // Step 6: Azhalaku Priya Final Delivery Details & Quotation Send
  priyaHandoverType?: 'COURIER' | 'DIRECT_HANDOVER' | 'FIELD_PICKUP';
  priyaDeliveryPersonName?: string;
  priyaCourierDocket?: string;
  priyaCourierName?: string;
  priyaQuotationSentAt?: string;
  priyaCompletionNotes?: string;

  // Step 7: Customer Payment & Closure
  paymentMode?: string;
  paymentReference?: string;
  paymentAmount?: number;
  paymentReceivedAt?: string;
  paymentReceivedBy?: string;
  paymentNotes?: string;`;

if (normalized.includes(searchStr)) {
  normalized = normalized.replace(searchStr, replaceStr);
  const finalContent = isCRLF ? normalized.replace(/\n/g, '\r\n') : normalized;
  fs.writeFileSync(filePath, finalContent, 'utf8');
  console.log('Successfully updated service-job.ts');
} else {
  console.error('Target not found in service-job.ts');
  process.exit(1);
}
