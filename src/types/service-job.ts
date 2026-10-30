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
export type RepairCategory = 'MINIMUM_30' | 'MAXIMUM_50';
export type EstimateStatus = 'PENDING_PRICE' | 'PRICE_CONFIRMED' | 'ESTIMATE_READY' | 'SENT_TO_CUSTOMER' | 'APPROVED';

export type ProofCategory =
  | 'RECEIPT'
  | 'INSPECTION'
  | 'BEFORE_REPAIR'
  | 'AFTER_REPAIR'
  | 'CUSTOMER_APPROVAL'
  | 'DISPATCH'
  | 'OTHER';

export interface ServiceProduct {
  id: string;
  productName: string;
  makeModel: string;
  serialNo: string;
  qty: number;
  status: ProductStatus;
  complaint: string;
  repairWork: string;
  productValue: number;
  repairEstimate: number;
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
  notes: string;
  proofImages?: string[];
  proofVideo?: string;
  proofNotes?: string;
  attachments: ServiceAttachment[];
  createdAt: string;
  updatedAt: string;
}
