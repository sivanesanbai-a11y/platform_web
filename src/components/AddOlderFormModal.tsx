"use client";

import React, { useState, useRef, useId } from "react";
import {
  X,
  FileText,
  DollarSign,
  Calendar,
  Building2,
  Phone,
  User,
  MapPin,
  Wrench,
  CheckCircle2,
  Upload,
  Trash2,
  Camera,
  Paperclip,
  Sparkles,
  Zap,
  Search,
  Info,
  ShieldCheck,
  ChevronDown
} from "lucide-react";
import type { ServiceJob, ServiceAttachment, JobStatus, WorkflowStage } from "@/types/service-job";
import { syncFormToCloud } from "@/lib/sync";
import { exportAndBackupToDriveSheet } from "@/lib/excel-export";

const OLDER_FORM_BENCHMARKS = [
  { name: "Digital Pressure Gauge", model: "DPG-0.05%", price: 28500 },
  { name: "Hydraulic Dead Weight Tester", model: "DWT-700BAR", price: 145000 },
  { name: "Digital Vernier Caliper (0-200mm)", model: "DVC-200", price: 8500 },
  { name: "Precision Digital Multimeter", model: "DMM-6500", price: 42000 },
  { name: "RTD / Thermocouple Calibrator", model: "TC-RTD-PRO", price: 34000 },
  { name: "Vacuum Pirani Gauge Head", model: "VAC-P100", price: 22500 },
  { name: "Torque Wrench / Calibrator", model: "TQ-500", price: 18500 },
  { name: "Dial Thickness & Depth Gauge", model: "DTG-50", price: 6800 },
];

interface AddOlderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (job: ServiceJob) => void;
  defaultValues?: Partial<ServiceJob>;
}

export default function AddOlderFormModal({
  isOpen,
  onClose,
  onSuccess,
  defaultValues,
}: AddOlderFormModalProps) {
  const formHtmlId = useId();

  // Basic identification & dates
  const currentYear = new Date().getFullYear();
  const [jobNo, setJobNo] = useState<string>(
    defaultValues?.jobNo || `OLD-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [customFormName, setCustomFormName] = useState<string>(
    defaultValues?.customFormName || ""
  );
  const [jobDate, setJobDate] = useState<string>(
    defaultValues?.jobDate || new Date().toISOString().slice(0, 10)
  );

  // Customer Details
  const [customerName, setCustomerName] = useState<string>(
    defaultValues?.customer?.name || ""
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    defaultValues?.customer?.phone || ""
  );
  const [contactPerson, setContactPerson] = useState<string>(
    defaultValues?.customer?.contactPerson || ""
  );
  const [customerCity, setCustomerCity] = useState<string>(
    defaultValues?.customer?.city || ""
  );
  const [customerAddress, setCustomerAddress] = useState<string>(
    defaultValues?.customer?.address || ""
  );

  // Inward & Receipt Mode
  const [receiptMode, setReceiptMode] = useState<"DIRECT" | "COURIER" | "FIELD_PICKUP">(
    (defaultValues?.receipt?.mode as any) || "DIRECT"
  );
  const [courierName, setCourierName] = useState<string>(
    defaultValues?.receipt?.courierName || ""
  );
  const [docketNo, setDocketNo] = useState<string>(
    defaultValues?.receipt?.docketNo || ""
  );

  // Equipment / Instrument Details
  const defaultProd = (defaultValues?.products || [])[0];
  const [productName, setProductName] = useState<string>(
    defaultProd?.productName || ""
  );
  const [makeModel, setMakeModel] = useState<string>(
    defaultProd?.makeModel || ""
  );
  const [serialNo, setSerialNo] = useState<string>(
    defaultProd?.serialNo || ""
  );
  const [complaint, setComplaint] = useState<string>(
    defaultProd?.complaint || ""
  );
  const [isProductAllDone, setIsProductAllDone] = useState<boolean>(true);

  // Manual Price & Commercial Valuation (Crucial feature)
  const [customApprovedPrice, setCustomApprovedPrice] = useState<string>(
    defaultValues?.workflow?.customApprovedPrice
      ? String(defaultValues.workflow.customApprovedPrice)
      : defaultValues?.totals?.totalEstimate
      ? String(defaultValues.totals.totalEstimate)
      : ""
  );
  const [serviceCharge, setServiceCharge] = useState<string>(
    defaultValues?.workflow?.priyaServiceCharge
      ? String(defaultValues.workflow.priyaServiceCharge)
      : ""
  );
  const [sparePartsCost, setSparePartsCost] = useState<string>(
    defaultValues?.workflow?.priyaSparePartsCost
      ? String(defaultValues.workflow.priyaSparePartsCost)
      : ""
  );
  const [discount, setDiscount] = useState<string>(
    defaultValues?.workflow?.priyaDiscount
      ? String(defaultValues.workflow.priyaDiscount)
      : "0"
  );
  const [gstRate, setGstRate] = useState<number>(
    defaultValues?.workflow?.priyaGstRate !== undefined ? defaultValues.workflow.priyaGstRate : 0
  );
  const [pricingNotes, setPricingNotes] = useState<string>(
    defaultValues?.workflow?.priyaPricingNotes || ""
  );

  // Original Product Price / Market Value & Benchmark Lookup
  const [productValue, setProductValue] = useState<string>(
    defaultProd?.productValue
      ? String(defaultProd.productValue)
      : defaultProd?.onlinePrice
      ? String(defaultProd.onlinePrice)
      : ""
  );
  const [showBenchmarkPicker, setShowBenchmarkPicker] = useState<boolean>(false);

  // Operational Status & Personnel
  const [status, setStatus] = useState<JobStatus>(
    defaultValues?.status || "CLOSED"
  );
  const [assignedStaff, setAssignedStaff] = useState<string>(
    defaultValues?.signoff?.repairedBy || ""
  );
  const [technicianAssessment, setTechnicianAssessment] = useState<string>(
    defaultValues?.workflow?.mechanicAssessment || ""
  );

  // File Attachments (Scanned Older Forms, Invoices, Photos)
  const [attachments, setAttachments] = useState<ServiceAttachment[]>(
    defaultValues?.attachments || []
  );
  const [isAttaching, setIsAttaching] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle file uploads (converts to base64 data URLs)
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsAttaching(true);
    setErrorMsg("");

    const fileArray = Array.from(files);
    let loadedCount = 0;
    const newAttachments: ServiceAttachment[] = [];

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || "";
        const isImage = file.type.startsWith("image/");
        const isPdf = file.type.includes("pdf");

        newAttachments.push({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          fileName: file.name,
          storedName: dataUrl,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          kind: isImage ? "IMAGE" : "OTHER",
          category: "OLDER_FORM",
          uploadedAt: new Date().toISOString(),
          tag: isPdf ? "Scanned PDF" : isImage ? "Physical Form Photo" : "Older Attachment",
        });

        loadedCount++;
        if (loadedCount === fileArray.length) {
          setAttachments((prev) => [...prev, ...newAttachments]);
          setIsAttaching(false);
        }
      };

      reader.onerror = () => {
        loadedCount++;
        if (loadedCount === fileArray.length) {
          setIsAttaching(false);
        }
      };

      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  // 1-Click calculation helper to calculate from parts + service
  const handleAutoSumPrice = () => {
    const sc = Number(serviceCharge) || 0;
    const sp = Number(sparePartsCost) || 0;
    const disc = Number(discount) || 0;
    const subtotal = Math.max(0, sc + sp - disc);
    const tax = gstRate > 0 ? (subtotal * gstRate) / 100 : 0;
    const total = Math.round(subtotal + tax);
    setCustomApprovedPrice(String(total));
  };

  // 1-Click calculation helper to auto-fill estimate based on original product market value
  const handleAutoFillFromProductValue = (percent = 30) => {
    const val = Number(productValue) || 0;
    if (val <= 0) {
      setShowBenchmarkPicker(true);
      setErrorMsg("Please enter or select Original Product Value to auto-fill estimate.");
      setTimeout(() => setErrorMsg(""), 4000);
      return;
    }
    const totalQuote = Math.round(val * (percent / 100));
    const labor = Math.round(totalQuote * 0.65);
    const spares = totalQuote - labor;
    setServiceCharge(String(labor));
    setSparePartsCost(String(spares));
    setDiscount("0");
    setCustomApprovedPrice(String(totalQuote));
    setErrorMsg("");
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg("Please enter the Customer or Company Name.");
      return;
    }
    if (!jobNo.trim()) {
      setErrorMsg("Please enter a valid Form / Job Number.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    try {
      const finalPrice = Number(customApprovedPrice) || 0;
      const sCharge = Number(serviceCharge) || 0;
      const spCost = Number(sparePartsCost) || 0;
      const disc = Number(discount) || 0;
      const parsedProdVal = parseFloat(productValue) || (finalPrice * 2);

      // Determine appropriate workflow stage based on status
      let stage: WorkflowStage = "JOB_COMPLETED";
      if (status === "DISPATCHED") stage = "READY_FOR_HANDOVER";
      else if (status === "APPROVAL_PENDING") stage = "AWAITING_MD_APPROVAL";
      else if (status === "REPAIRING") stage = "UNDER_REPAIR_SENTHIL";
      else if (status === "READY" || status === "CLOSED") stage = "JOB_COMPLETED";

      const now = new Date().toISOString();

      const newJob: ServiceJob = {
        id: jobNo.trim(),
        jobNo: jobNo.trim(),
        legacySerialNo: jobNo.trim(),
        jobDate: jobDate || now.slice(0, 10),
        status: status,
        marketType: "INDIA",
        officeType: "HEAD_OFFICE",
        branchName: customerCity || "Coimbatore",
        customFormName: customFormName.trim() || `${customerName.trim()} - Older Service Form`,
        isAllProductsDone: isProductAllDone,
        createdAt: `${jobDate || now.slice(0, 10)}T10:00:00.000Z`,
        updatedAt: now,
        createdBy: "Admin (Manual Historical Entry)",

        customer: {
          name: customerName.trim(),
          phone: customerPhone.trim() || "N/A",
          email: "",
          address: customerAddress.trim() || `${customerCity}, Tamil Nadu`,
          city: customerCity.trim() || "Coimbatore",
          state: "Tamil Nadu",
          country: "India",
          gstin: "",
          currency: "INR",
          contactPerson: contactPerson.trim() || customerName.trim(),
        },

        receipt: {
          mrNo: `MR-${jobNo.trim()}`,
          mrDate: jobDate || now.slice(0, 10),
          mode: receiptMode,
          reference: receiptMode === "COURIER" ? (docketNo || "Courier") : "Walk-in Handover",
          courierName: receiptMode === "COURIER" ? courierName : undefined,
          docketNo: receiptMode === "COURIER" ? docketNo : undefined,
          personName: contactPerson || customerName,
          personPhone: customerPhone,
        },

        products: [
          {
            id: `prod-${Date.now()}`,
            productName: productName.trim() || "Instrument",
            makeModel: makeModel.trim(),
            serialNo: serialNo.trim(),
            qty: 1,
            status: isProductAllDone ? "READY" : "REPAIRING",
            complaint: complaint.trim(),
            repairWork: technicianAssessment.trim(),
            physicalCondition: "Inspected Good",
            productValue: parsedProdVal,
            repairEstimate: finalPrice,
            discount: disc,
            repairCategory: "MAXIMUM_50",
            repairPercent: 50,
            onlinePrice: parsedProdVal,
            onlinePriceSource: "MANUAL_ARCHIVE",
            onlinePriceConfirmed: true,
            onlinePriceCheckedAt: now,
            estimateStatus: "APPROVED",
            productImageUrl: "",
            productSpecifications: "",
            onlineProductUrl: "",
            onlineDetailsTitle: "",
            onlineDetailsFetchedAt: now,
            onlineLookupQuery: "",
            productImageUrls: [],
            marketPriceMin: 0,
            marketPriceMax: 0,
            marketPriceMedian: 0,
            marketPriceSampleCount: 0,
            isAllDone: isProductAllDone,
            doneAt: isProductAllDone ? now : undefined,
            doneBy: assignedStaff,
          },
        ],

        totals: {
          productValue: parsedProdVal,
          repairEstimate: sCharge || finalPrice,
          discount: disc,
          totalEstimate: finalPrice,
          totalEstimateManual: true,
        },

        workflow: {
          stage: stage,
          // Technical & Repair
          mechanicAssigned: assignedStaff,
          senthilAcceptedAt: now,
          senthilAcceptedBy: assignedStaff,
          repairStartedAt: now,
          repairCompletedAt: status === "CLOSED" || status === "DISPATCHED" || status === "READY" ? now : undefined,
          mechanicAssessment: technicianAssessment,
          mechanicEstimateType: "MAXIMUM_50",
          mechanicProposedCost: sCharge,
          estimatedSpareCost: spCost,

          // Pricing & Manual Commercial Entry
          priyaPriceEnteredBy: "Azhalaku Priya / Admin",
          priyaPriceEnteredAt: now,
          priyaServiceCharge: sCharge,
          priyaRepairEstimate: sCharge,
          priyaSparePartsCost: spCost,
          priyaDiscount: disc,
          priyaGstRate: gstRate,
          priyaTotalQuotationAmount: finalPrice,
          priyaPricingNotes: pricingNotes,

          // MD Approval
          approvedByMd: true,
          mdApprovedAt: now,
          mdApprovedBy: "MD",
          mdConfirmedPrice: finalPrice,
          mdApprovedPrice: finalPrice,
          customApprovedPrice: finalPrice,
          mdPriceModified: true,
          mdApprovalNotes: `Manual older form entry. Final approved commercial price set to ₹${finalPrice}.`,

          // Delivery & Handover
          priyaHandoverType: receiptMode === "COURIER" ? "COURIER" : "DIRECT_HANDOVER",
          cannotGetDirect: receiptMode === "COURIER",
          priyaCourierName: courierName,
          priyaCourierDocket: docketNo,
          finalHandoverCompletedAt: status === "CLOSED" || status === "DISPATCHED" ? now : undefined,
        },

        dispatch: {
          testedBy: assignedStaff,
          dcNo: `DC-${jobNo.trim()}`,
          dcDate: jobDate || now.slice(0, 10),
          mode: receiptMode === "COURIER" ? "COURIER" : "DIRECT",
          reference: docketNo || "Delivered",
        },

        payment: {
          invoiceNo: `INV-${jobNo.trim()}`,
          invoiceDate: jobDate || now.slice(0, 10),
          mode: "CASH_OR_BANK",
          reference: "Older Form Settlement",
          receivedBy: "Admin / Accounts",
        },

        signoff: {
          receivedBy: "Front Desk Intake",
          inspectedBy: "Aravindh Kumar",
          estimateConfirmedBy: "Azhalaku Priya",
          repairedBy: assignedStaff,
        },

        notes: technicianAssessment || "Older form historical service record.",
        attachments: attachments,
      };

      // 1. Save directly into localStorage
      const raw = localStorage.getItem("nunes:service_jobs");
      const list: ServiceJob[] = raw ? JSON.parse(raw) : [];

      // Filter out if duplicate jobNo exists, or prepend
      const filtered = list.filter((j) => String(j.jobNo || j.id) !== String(newJob.jobNo));
      const updatedList = [newJob, ...filtered];
      localStorage.setItem("nunes:service_jobs", JSON.stringify(updatedList));

      // 2. Broadcast events across the entire application & open tabs
      window.dispatchEvent(new CustomEvent("nunes:job-saved", { detail: { job: newJob } }));
      window.dispatchEvent(new CustomEvent("nunes:records-synced", { detail: { job: newJob } }));

      try {
        const bc = new BroadcastChannel("nunes_workflow_bus");
        bc.postMessage({ type: "JOB_UPDATED", job: newJob });
        bc.close();
      } catch {}

      // 3. Sync to cloud database & Google Drive Sheet backup
      void syncFormToCloud("servicing", String(newJob.jobNo), String(newJob.customer.name), newJob);
      void exportAndBackupToDriveSheet({ download: false });

      // 4. Callback
      if (onSuccess) {
        onSuccess(newJob);
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save older form record.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.72)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "840px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "16px 20px",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  background: "#4f46e5",
                  color: "#ffffff",
                  fontSize: "10px",
                  fontWeight: 800,
                  padding: "3px 8px",
                  borderRadius: "999px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Historical Archive
              </span>
              <h2 style={{ fontSize: "17px", fontWeight: 800, margin: 0, color: "#ffffff" }}>
                Add Older Form Record (Manual Entry &amp; Price)
              </h2>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>
              Record legacy physical job cards, paper bills, enter manual pricing, and attach scanned older documents.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: "8px",
              color: "#cbd5e1",
              cursor: "pointer",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {errorMsg && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Section 1: Form Identification & Past Date */}
          <div
            style={{
              padding: "14px",
              borderRadius: "12px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
            }}
          >
            <div>
              <label
                htmlFor={`${formHtmlId}-jobNo`}
                style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "#334155", marginBottom: "4px" }}
              >
                Form / Job Number (Paper / Serial) *
              </label>
              <input
                id={`${formHtmlId}-jobNo`}
                type="text"
                required
                value={jobNo}
                onChange={(e) => setJobNo(e.target.value)}
                placeholder="e.g. OLD-2024-1042 or 1042"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              />
              <span style={{ fontSize: "10.5px", color: "#64748b" }}>Original paper bill, docket, or legacy serial</span>
            </div>

            <div>
              <label
                htmlFor={`${formHtmlId}-customFormName`}
                style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "#334155", marginBottom: "4px" }}
              >
                Custom Form Name / Title
              </label>
              <input
                id={`${formHtmlId}-customFormName`}
                type="text"
                value={customFormName}
                onChange={(e) => setCustomFormName(e.target.value)}
                placeholder="e.g. TVS Motors - Annual Calibration & Overhaul"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "13px",
                  color: "#0f172a",
                }}
              />
              <span style={{ fontSize: "10.5px", color: "#64748b" }}>Appears cleanly in sidebar &amp; executive sheets</span>
            </div>

            <div>
              <label
                htmlFor={`${formHtmlId}-jobDate`}
                style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "#334155", marginBottom: "4px" }}
              >
                Past Job Date *
              </label>
              <input
                id={`${formHtmlId}-jobDate`}
                type="date"
                required
                value={jobDate}
                onChange={(e) => setJobDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              />
              <span style={{ fontSize: "10.5px", color: "#64748b" }}>Select the past date when service was conducted</span>
            </div>
          </div>

          {/* Section 2: Customer & Handover Information */}
          <div
            style={{
              padding: "14px",
              borderRadius: "12px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
              <Building2 size={16} style={{ color: "#4f46e5" }} />
              <h3 style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Customer &amp; Inward Channel
              </h3>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "10px",
              }}
            >
              <div>
                <label
                  htmlFor={`${formHtmlId}-customerName`}
                  style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}
                >
                  Customer / Company Name *
                </label>
                <input
                  id={`${formHtmlId}-customerName`}
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. TVS Motor Company Ltd / Roots Industries"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "7px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor={`${formHtmlId}-contactPerson`}
                  style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}
                >
                  Contact Person
                </label>
                <input
                  id={`${formHtmlId}-contactPerson`}
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Ramesh Kumar (Quality Manager)"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "7px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12.5px",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor={`${formHtmlId}-customerPhone`}
                  style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}
                >
                  Phone / Mobile
                </label>
                <input
                  id={`${formHtmlId}-customerPhone`}
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +91 98422 12345"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "7px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12.5px",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor={`${formHtmlId}-customerCity`}
                  style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}
                >
                  City / Location
                </label>
                <input
                  id={`${formHtmlId}-customerCity`}
                  type="text"
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  placeholder="e.g. Coimbatore, Hosur, Chennai"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "7px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12.5px",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor={`${formHtmlId}-receiptMode`}
                  style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}
                >
                  Receipt / Inward Mode
                </label>
                <select
                  id={`${formHtmlId}-receiptMode`}
                  value={receiptMode}
                  onChange={(e) => setReceiptMode(e.target.value as any)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "7px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12.5px",
                    background: "#ffffff",
                  }}
                >
                  <option value="DIRECT">Direct Walk-in / Handover</option>
                  <option value="COURIER">Courier / Parcel Dispatch</option>
                  <option value="FIELD_PICKUP">Field Engineer Pickup</option>
                </select>
              </div>

              {receiptMode === "COURIER" && (
                <div>
                  <label
                    htmlFor={`${formHtmlId}-courierDocket`}
                    style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}
                  >
                    Courier Name &amp; Docket / LR No.
                  </label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      id={`${formHtmlId}-courierDocket`}
                      type="text"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      placeholder="e.g. Professional / ST"
                      style={{
                        flex: 1,
                        padding: "8px 10px",
                        borderRadius: "7px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12.5px",
                      }}
                    />
                    <input
                      type="text"
                      value={docketNo}
                      onChange={(e) => setDocketNo(e.target.value)}
                      placeholder="Docket #"
                      style={{
                        flex: 1,
                        padding: "8px 10px",
                        borderRadius: "7px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12.5px",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Equipment & Technical Scope */}
          <div
            style={{
              padding: "14px",
              borderRadius: "12px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
              <Wrench size={16} style={{ color: "#0f766e" }} />
              <h3 style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Equipment &amp; Technical Scope
              </h3>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "10px",
              }}
            >
              <div>
                <label
                  htmlFor={`${formHtmlId}-productName`}
                  style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}
                >
                  Equipment / Instrument Name *
                </label>
                <input
                  id={`${formHtmlId}-productName`}
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Digital Vernier Caliper, Pressure Gauge"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "7px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor={`${formHtmlId}-makeModel`}
                  style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}
                >
                  Make &amp; Model
                </label>
                <input
                  id={`${formHtmlId}-makeModel`}
                  type="text"
                  value={makeModel}
                  onChange={(e) => setMakeModel(e.target.value)}
                  placeholder="e.g. Mitutoyo 500-196-30 / Wika 213.53"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "7px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12.5px",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor={`${formHtmlId}-serialNo`}
                  style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}
                >
                  Instrument Serial Number
                </label>
                <input
                  id={`${formHtmlId}-serialNo`}
                  type="text"
                  value={serialNo}
                  onChange={(e) => setSerialNo(e.target.value)}
                  placeholder="e.g. MIT-892147 / CAL-2023-9"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "7px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12.5px",
                  }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label
                  htmlFor={`${formHtmlId}-complaint`}
                  style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}
                >
                  Reported Problem &amp; Work Done Details
                </label>
                <textarea
                  id={`${formHtmlId}-complaint`}
                  rows={2}
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="Describe the complaint reported and repairs/calibration executed on this older job..."
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "7px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12.5px",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                <input
                  type="checkbox"
                  id={`${formHtmlId}-allDone`}
                  checked={isProductAllDone}
                  onChange={(e) => setIsProductAllDone(e.target.checked)}
                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#059669" }}
                />
                <label htmlFor={`${formHtmlId}-allDone`} style={{ fontSize: "12.5px", fontWeight: 700, color: "#065f46", cursor: "pointer" }}>
                  ✓ Mark Product as All Done &amp; Fully Tested (Recommended for completed historical records)
                </label>
              </div>
            </div>
          </div>

          {/* Section 4: Manual Price Entry & Commercial Valuation (USER EMPHASIS) */}
          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
              border: "2px solid #86efac",
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.08)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ background: "#059669", color: "#ffffff", borderRadius: "8px", padding: "4px" }}>
                  <DollarSign size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#065f46", margin: 0 }}>
                    Manual Price Entry &amp; Commercial Valuation
                  </h3>
                  <p style={{ margin: "1px 0 0", fontSize: "11.5px", color: "#047857" }}>
                    Directly enter the agreed final price, service estimate, spare parts, and tax.
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setShowBenchmarkPicker(prev => !prev)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #14b8a6",
                    borderRadius: "7px",
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#0f766e",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  title="Open catalog benchmarks to look up or select authentic market value"
                >
                  <Search size={12} style={{ color: "#0d9488" }} />
                  <span>Open Product Value</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAutoFillFromProductValue(30)}
                  style={{
                    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    border: "none",
                    borderRadius: "7px",
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    boxShadow: "0 2px 4px rgba(5,150,105,0.25)",
                  }}
                  title="Auto-fill recommended service quotation from original product market value"
                >
                  <Sparkles size={12} />
                  <span>Check &amp; Auto-Fill Value</span>
                </button>
                <button
                  type="button"
                  onClick={handleAutoSumPrice}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #6ee7b7",
                    borderRadius: "7px",
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#047857",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>Sum Breakdown</span>
                </button>
              </div>
            </div>

            {/* Benchmark Valuation Dropdown / Picker */}
            {showBenchmarkPicker && (
              <div
                style={{
                  marginBottom: "12px",
                  padding: "12px",
                  background: "#ffffff",
                  borderRadius: "10px",
                  border: "1.5px solid #14b8a6",
                  boxShadow: "0 2px 6px rgba(15,118,110,0.1)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#0f766e" }}>
                    Select Instrument Benchmark Market Valuation:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowBenchmarkPicker(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
                  {OLDER_FORM_BENCHMARKS.map((b, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setProductValue(String(b.price));
                        if (!productName || productName.includes("Digital Vernier")) setProductName(b.name);
                        if (!makeModel) setMakeModel(b.model);
                        const quote = Math.round(b.price * 0.30);
                        const labor = Math.round(quote * 0.65);
                        const spares = quote - labor;
                        setServiceCharge(String(labor));
                        setSparePartsCost(String(spares));
                        setCustomApprovedPrice(String(quote));
                        setShowBenchmarkPicker(false);
                      }}
                      style={{
                        padding: "6px 10px",
                        background: "#f0fdf4",
                        border: "1px solid #86efac",
                        borderRadius: "6px",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#166534" }}>{b.name}</div>
                      <div style={{ fontSize: "10.5px", color: "#059669", fontWeight: 700 }}>
                        Market: ₹{b.price.toLocaleString("en-IN")} • 30% Service: ₹{Math.round(b.price * 0.3).toLocaleString("en-IN")}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "12px",
              }}
            >
              {/* ORIGINAL PRODUCT VALUE (Catalog Replacement Value) */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label
                    htmlFor={`${formHtmlId}-productValue`}
                    style={{ fontSize: "11.5px", fontWeight: 800, color: "#0f766e", margin: 0 }}
                  >
                    Original Product Price (₹)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowBenchmarkPicker(prev => !prev)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      fontSize: "10px",
                      color: "#0d9488",
                      fontWeight: 700,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Open Benchmarks
                  </button>
                </div>
                <input
                  id={`${formHtmlId}-productValue`}
                  type="number"
                  min="0"
                  step="1"
                  value={productValue}
                  onChange={(e) => setProductValue(e.target.value)}
                  placeholder="e.g. 25000"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "7px",
                    border: "1.5px solid #14b8a6",
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "#0f766e",
                    background: "#ffffff",
                  }}
                />
                <span style={{ fontSize: "10px", color: "#0d9488", fontWeight: 600, display: "block", marginTop: "3px" }}>
                  Equipment replacement value
                </span>
              </div>
              {/* PRIMARY MANUAL PRICE (Direct Entry) */}
              <div
                style={{
                  background: "#ffffff",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "2px solid #059669",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                }}
              >
                <label
                  htmlFor={`${formHtmlId}-customApprovedPrice`}
                  style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: "#065f46", marginBottom: "4px" }}
                >
                  Final Quoted / Approved Price (₹) *
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontWeight: 800, color: "#059669", fontSize: "15px" }}>
                    ₹
                  </span>
                  <input
                    id={`${formHtmlId}-customApprovedPrice`}
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={customApprovedPrice}
                    onChange={(e) => setCustomApprovedPrice(e.target.value)}
                    placeholder="e.g. 4500"
                    style={{
                      width: "100%",
                      padding: "8px 10px 8px 26px",
                      borderRadius: "7px",
                      border: "1.5px solid #059669",
                      fontSize: "16px",
                      fontWeight: 800,
                      color: "#065f46",
                      background: "#f0fdf4",
                    }}
                  />
                </div>
                <span style={{ fontSize: "10px", color: "#047857", fontWeight: 700, display: "block", marginTop: "3px" }}>
                  Directly saved to invoice &amp; MD signoff
                </span>
              </div>

              {/* Service / Labor Charge */}
              <div>
                <label
                  htmlFor={`${formHtmlId}-serviceCharge`}
                  style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}
                >
                  Service / Labor Charges (₹)
                </label>
                <input
                  id={`${formHtmlId}-serviceCharge`}
                  type="number"
                  min="0"
                  step="1"
                  value={serviceCharge}
                  onChange={(e) => setServiceCharge(e.target.value)}
                  placeholder="e.g. 2500"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "7px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    fontWeight: 700,
                    background: "#ffffff",
                  }}
                />
              </div>

              {/* Spare Parts Cost */}
              <div>
                <label
                  htmlFor={`${formHtmlId}-sparePartsCost`}
                  style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}
                >
                  Spare Parts Cost (₹)
                </label>
                <input
                  id={`${formHtmlId}-sparePartsCost`}
                  type="number"
                  min="0"
                  step="1"
                  value={sparePartsCost}
                  onChange={(e) => setSparePartsCost(e.target.value)}
                  placeholder="e.g. 1000"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "7px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    fontWeight: 700,
                    background: "#ffffff",
                  }}
                />
              </div>

              {/* Discount */}
              <div>
                <label
                  htmlFor={`${formHtmlId}-discount`}
                  style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}
                >
                  Discount Allowed (₹)
                </label>
                <input
                  id={`${formHtmlId}-discount`}
                  type="number"
                  min="0"
                  step="1"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "7px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    fontWeight: 700,
                    background: "#ffffff",
                  }}
                />
              </div>

              {/* GST Rate */}
              <div>
                <label
                  htmlFor={`${formHtmlId}-gstRate`}
                  style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}
                >
                  GST Applied
                </label>
                <select
                  id={`${formHtmlId}-gstRate`}
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "7px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    background: "#ffffff",
                  }}
                >
                  <option value={0}>0% - Exempt / Inclusive</option>
                  <option value={18}>18% - Standard GST</option>
                  <option value={12}>12% - Concessional GST</option>
                </select>
              </div>
            </div>

            {/* Quick Auto-Fill from Product Value */}
            <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed #86efac", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
              <span style={{ fontSize: "11px", color: "#166534", fontWeight: 700 }}>
                Quick Auto-Fill from Product Value:
              </span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {[
                  { pct: 30, label: "30% Standard Service" },
                  { pct: 50, label: "50% Major Overhaul" },
                  { pct: 70, label: "70% Complete Rebuild" },
                ].map(({ pct, label }) => {
                  const val = Number(productValue) || 0;
                  const calculated = Math.round(val * (pct / 100));
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleAutoFillFromProductValue(pct)}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #86efac",
                        color: "#166534",
                        padding: "3px 8px",
                        borderRadius: "5px",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                      title={`Auto-fill ${label} (₹${calculated > 0 ? calculated.toLocaleString("en-IN") : "..."})`}
                    >
                      ⚡ {pct}% {val > 0 ? `(₹${calculated.toLocaleString("en-IN")})` : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: "10px" }}>
              <input
                type="text"
                value={pricingNotes}
                onChange={(e) => setPricingNotes(e.target.value)}
                placeholder="Optional pricing / customer negotiation notes..."
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #bbf7d0",
                  fontSize: "11.5px",
                  background: "#ffffff",
                }}
              />
            </div>
          </div>

          {/* Section 5: Status, Engineer & Signoff */}
          <div
            style={{
              padding: "14px",
              borderRadius: "12px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "10px",
            }}
          >
            <div>
              <label
                htmlFor={`${formHtmlId}-status`}
                style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "3px" }}
              >
                Overall Operational Status *
              </label>
              <select
                id={`${formHtmlId}-status`}
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "7px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  background: "#ffffff",
                }}
              >
                <option value="CLOSED">✓ CLOSED &amp; COMPLETED (Default Archive)</option>
                <option value="READY">✓ READY / ALL DONE</option>
                <option value="DISPATCHED">📦 DISPATCHED (Handover Complete)</option>
                <option value="APPROVAL_PENDING">⏳ PENDING MD SIGN-CHECK</option>
                <option value="REPAIRING">⚙️ UNDER REPAIR / PROCESS</option>
              </select>
            </div>

            <div>
              <label
                htmlFor={`${formHtmlId}-assignedStaff`}
                style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "3px" }}
              >
                Assigned Service Engineer
              </label>
              <input
                id={`${formHtmlId}-assignedStaff`}
                type="text"
                value={assignedStaff}
                onChange={(e) => setAssignedStaff(e.target.value)}
                placeholder="e.g. Senthil Kumar"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "7px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12.5px",
                }}
              />
            </div>

            <div>
              <label
                htmlFor={`${formHtmlId}-assessment`}
                style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "3px" }}
              >
                Technical Assessment / Repair Note
              </label>
              <input
                id={`${formHtmlId}-assessment`}
                type="text"
                value={technicianAssessment}
                onChange={(e) => setTechnicianAssessment(e.target.value)}
                placeholder="e.g. Certified accuracy within +/-0.02mm."
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "7px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12.5px",
                }}
              />
            </div>
          </div>

          {/* Section 6: Attached Older Files & Scanned Documents */}
          <div
            style={{
              padding: "14px",
              borderRadius: "12px",
              background: "#f8fafc",
              border: "1.5px dashed #cbd5e1",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Paperclip size={16} style={{ color: "#475569" }} />
                <h3 style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Attach Older Paper Scans, Photos &amp; Bills ({attachments.length})
                </h3>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    padding: "5px 10px",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#334155",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Upload size={13} />
                  <span>Choose Files / PDFs</span>
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    padding: "5px 10px",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#334155",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Camera size={13} />
                  <span>Camera Photo</span>
                </button>
                {/* Hidden native inputs */}
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/*,application/pdf"
                  style={{ display: "none" }}
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  style={{ display: "none" }}
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
              </div>
            </div>

            {isAttaching && (
              <div style={{ fontSize: "12px", color: "#4f46e5", fontWeight: 700, marginBottom: "8px" }}>
                Processing attachments...
              </div>
            )}

            {attachments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "12px", fontSize: "12px", color: "#64748b" }}>
                No files attached yet. Click "Choose Files / PDFs" or "Camera Photo" to attach scanned paper forms.
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "5px 10px",
                      borderRadius: "7px",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      color: "#1e293b",
                    }}
                  >
                    <FileText size={13} style={{ color: "#4f46e5" }} />
                    <span style={{ maxWidth: "180px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {att.fileName}
                    </span>
                    <span style={{ fontSize: "10px", color: "#64748b" }}>
                      ({Math.round(att.size / 1024)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        padding: "2px",
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="Remove"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              paddingTop: "12px",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              Older form will be saved into <strong style={{ color: "#0f172a" }}>Service Jobs</strong>, synced to <strong style={{ color: "#0f172a" }}>Excel &amp; Google Drive</strong>.
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                style={{
                  padding: "9px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  padding: "9px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
                }}
              >
                <CheckCircle2 size={16} />
                <span>{isSaving ? "Saving Form..." : "Save Older Form Record"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
