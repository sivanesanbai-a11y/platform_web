export type MarketType = 'INDIA' | 'EXPORT';
export type OfficeType = 'HEAD_OFFICE' | 'BRANCH_OFFICE';
export type JobStatus =
  | 'DRAFT'
  | 'RECEIVED'
  | 'ESTIMATE_PENDING'
  | 'APPROVAL_PENDING'
  | 'REPAIRING'
  | 'READY'
  | 'DISPATCHED'
  | 'CLOSED';
export type ProductStatus = JobStatus;
export type RepairCategory = 'MINIMUM_30' | 'MAXIMUM_50' | 'CUSTOM';
export type EstimateStatus = 'PENDING_PRICE' | 'PRICE_CONFIRMED' | 'ESTIMATE_READY' | 'SENT_TO_CUSTOMER' | 'APPROVED';

export type ProofCategory =
  | 'RECEIPT'
  | 'INSPECTION'
  | 'BEFORE_REPAIR'
  | 'AFTER_REPAIR'
  | 'CUSTOMER_APPROVAL'
  | 'DISPATCH'
  | 'OLDER_FORM'
  | 'OTHER';

export type WorkflowStage =
  | 'INTAKE_RECEIVED'            // Step 1: Entered & saved (Suganya / Radha / Sabitha / Rekha / Senthil)
  | 'AWAITING_ARAVINDH_ACCEPT'   // Step 2: Aravindh branch pickup & real-time product verification
  | 'UNDER_REPAIR_ARAVINDH'      // Step 3: Aravindh / Senthil repair, Aravindh fits 30% or 50% service repair
  | 'UNDER_REPAIR_SENTHIL'       // Compatibility alias
  | 'AWAITING_PRIYA_PRICING'     // Step 4: Aravindh entered 30%/50% -> Priya enters service price & quotation
  | 'AWAITING_MD_APPROVAL'       // Step 5: Priya submitted price -> MD reviews & approves
  | 'PRICE_APPROVED_BY_MD'       // Step 6: MD approved price -> back to Priya for further details & quotation
  | 'READY_FOR_HANDOVER'         // Step 7: Delivery / Handover in progress (Courier / Direct Handover / Field Pick up)
  | 'JOB_COMPLETED';             // Step 8: Final quotation sent & product delivered

export interface JobWorkflowInfo {
  stage: WorkflowStage;
  // Step 1: Intake & Entry (Suganya / Radha / Sabitha / Rekha)
  intakeBy?: string;
  intakeStaffName?: string;
  intakeAt?: string;
  receivedAt?: string;
  senthilAlertSentAt?: string;
  aravindhAlertSentAt?: string;
  intakeNote?: string;
  isBranchDelivery?: boolean;
  branchOfficeName?: string; // e.g. "Other Office / Branch Office"

  // Step 2: Aravindh Branch Pickup & Real-Time Acceptance
  aravindhBranchPickupDone?: boolean;
  aravindhBranchPickupAt?: string;
  aravindhBranchPickupBy?: string;
  aravindhAcceptedBy?: string;
  aravindhAcceptedAt?: string;
  aravindhProductPhoto?: string;
  aravindhInspectionNotes?: string;

  // Step 3: Aravindh & Senthil Service Repair & Scope (30% / 50%)
  mechanicAssigned?: string;
  senthilAcceptedAt?: string;
  senthilAcceptedBy?: string;
  repairStartedAt?: string;
  repairDurationMinutes?: number;
  mechanicAssessment?: string;
  mechanicEstimateType?: 'MINIMUM_30' | 'MAXIMUM_50' | 'CUSTOM';
  mechanicProposedCost?: number;
  repairCompletedAt?: string;
  repairProofPhotos?: string[];
  repairProofVideo?: string;
  aravindhScopeSentToPriyaAt?: string;
  senthilFittedScopeAt?: string;
  senthilScopeSentToMdAt?: string;

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
  customApprovedPrice?: number;
  mdPriceModified?: boolean;
  originalQuotedPrice?: number;
  mdNotes?: string;
  mdApprovalNotes?: string;
  mdReturnMessageToPriya?: string;
  mdPriceAlertSentToPriyaAt?: string;

  // Step 6: Azhalaku Priya Final Delivery Details & Quotation Send
  priyaHandoverType?: 'COURIER' | 'DIRECT_HANDOVER' | 'FIELD_PICKUP';
  cannotGetDirect?: boolean;
  courierPartner?: string;
  priyaDeliveryPersonName?: string;
  priyaCourierDocket?: string;
  priyaCourierName?: string;
  priyaQuotationSentAt?: string;
  priyaCompletionNotes?: string;

  // Backwards compat fields
  takeProductAlertSentToCreatorAt?: string;
  takeProductAlertSentToPriyaAt?: string;
  handoverMethod?: 'ARAVINDH_HANDOVER' | 'COURIER_DISPATCH' | 'WALK_IN_COLLECT';
  handoverType?: 'ARAVINDH' | 'COURIER' | 'FIELD_PICKUP';
  handoverPerson?: string;
  handoverHandledBy?: string;
  courierDetail?: string;
  courierOrHandoverDetails?: string;
  quotationSentBy?: string;
  quotationSentAt?: string;
  finalHandoverCompletedAt?: string;
}

export interface ServiceProduct {
  id: string;
  productName: string;
  makeModel: string;
  serialNo: string;
  qty: number;
  status: ProductStatus;
  complaint: string;
  repairWork: string;
  physicalCondition?: string;
  accessories?: string;
  productValue: number;
  repairEstimate: number;
  discount?: number;
  repairCategory: RepairCategory;
  repairPercent: number;
  onlinePrice: number;
  onlinePriceSource: string;
  onlinePriceConfirmed: boolean;
  onlinePriceCheckedAt: string;
  estimateStatus: EstimateStatus;
  productImageUrl: string;
  productSpecifications: string;
  onlineProductUrl: string;
  onlineDetailsTitle: string;
  onlineDetailsFetchedAt: string;
  onlineLookupQuery: string;
  productImageUrls: string[];
  marketPriceMin: number;
  marketPriceMax: number;
  marketPriceMedian: number;
  marketPriceSampleCount: number;
  isAllDone?: boolean;
  doneAt?: string;
  doneBy?: string;
}

export interface ServiceAttachment {
  id: string;
  fileName: string;
  storedName: string;
  mimeType: string;
  size: number;
  kind: 'IMAGE' | 'VIDEO' | 'OTHER';
  category: ProofCategory;
  uploadedAt: string;
  tag?: string;
}

export interface ServiceJob {
  id: string;
  jobNo: string;
  legacySerialNo: string;
  jobDate: string;
  status: JobStatus;
  marketType: MarketType;
  officeType: OfficeType;
  branchName: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    country: string;
    gstin: string;
    currency: string;
    contactPerson: string;
    date?: string;
  };
  receipt: {
    mrNo: string;
    mrDate: string;
    mode: 'COURIER' | 'DIRECT' | 'OTHER' | 'FIELD_PICKUP';
    reference: string;
    courierName?: string;
    docketNo?: string;
    courierDate?: string;
    personName?: string;
    personPhone?: string;
    handoverReason?: string;
    pickedUpBy?: string;
    clientContactPerson?: string;
    clientPhone?: string;
    pickupLocation?: string;
    pickupReason?: string;
    proofImages?: string[];
    proofVideo?: string;
  };
  products: ServiceProduct[];
  totals: {
    productValue: number;
    repairEstimate: number;
    discount: number;
    totalEstimate: number;
    totalEstimateManual?: boolean;
  };
  dispatch: {
    testedBy: string;
    dcNo: string;
    dcDate: string;
    mode: string;
    reference: string;
  };
  payment: {
    invoiceNo: string;
    invoiceDate: string;
    mode: string;
    reference: string;
    receivedBy: string;
  };
  signoff: {
    receivedBy: string;
    inspectedBy: string;
    estimateConfirmedBy: string;
    repairedBy: string;
  };
  customFormName?: string;
  isAllProductsDone?: boolean;
  notes: string;
  proofImages?: string[];
  proofPhotos?: string[];
  proofVideo?: string;
  proofNotes?: string;
  attachments: ServiceAttachment[];
  workflow?: JobWorkflowInfo;
  createdBy?: string;
  assignedStaff?: string;
  createdAt: string;
  updatedAt: string;
}
