import type { ServiceJob, ServiceProduct } from "@/types/service-job";

export function createServiceId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try { return crypto.randomUUID(); } catch {}
  }
  return `sf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newProduct(): ServiceProduct {
  return {
    id: createServiceId(),
    productName: "",
    makeModel: "",
    serialNo: "",
    qty: 1,
    status: "RECEIVED",
    complaint: "",
    repairWork: "",
    productValue: 0,
    repairEstimate: 0,
    repairCategory: "MINIMUM_30",
    repairPercent: 30,
    onlinePrice: 0,
    onlinePriceSource: "",
    onlinePriceConfirmed: false,
    onlinePriceCheckedAt: "",
    estimateStatus: "PENDING_PRICE",
    productImageUrl: "",
    productSpecifications: "",
    onlineProductUrl: "",
    onlineDetailsTitle: "",
    onlineDetailsFetchedAt: "",
    onlineLookupQuery: "",
    productImageUrls: [],
    marketPriceMin: 0,
    marketPriceMax: 0,
    marketPriceMedian: 0,
    marketPriceSampleCount: 0
  };
}

export function blankJob(): Omit<ServiceJob, "id" | "jobNo" | "createdAt" | "updatedAt"> & Partial<Pick<ServiceJob, "id" | "jobNo" | "createdAt" | "updatedAt">> {
  const today = new Date().toISOString().slice(0, 10);
  return {
    legacySerialNo: "",
    jobDate: today,
    status: "RECEIVED",
    marketType: "INDIA",
    officeType: "HEAD_OFFICE",
    branchName: "Head Office - Rathinapuri",
    customer: {
      name: "",
      phone: "",
      email: "",
      address: "",
      city: "Coimbatore",
      state: "Tamil Nadu",
      country: "India",
      gstin: "",
      currency: "INR",
      contactPerson: ""
    },
    receipt: {
      mrNo: "",
      mrDate: today,
      mode: "DIRECT",
      reference: "",
      courierName: "",
      docketNo: "",
      courierDate: today,
      personName: "",
      personPhone: "",
      handoverReason: "",
      pickedUpBy: "",
      clientContactPerson: "",
      clientPhone: "",
      pickupLocation: "",
      pickupReason: ""
    },
    products: [newProduct()],
    totals: {
      productValue: 0,
      repairEstimate: 0,
      discount: 0,
      totalEstimate: 0,
      totalEstimateManual: false
    },
    dispatch: {
      testedBy: "",
      dcNo: "",
      dcDate: "",
      mode: "COURIER",
      reference: ""
    },
    payment: {
      invoiceNo: "",
      invoiceDate: "",
      mode: "UPI",
      reference: "",
      receivedBy: ""
    },
    signoff: {
      receivedBy: "",
      inspectedBy: "",
      estimateConfirmedBy: "",
      repairedBy: ""
    },
    notes: "",
    attachments: []
  };
}
