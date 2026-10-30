"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Wrench,
  CheckCircle2,
  Truck,
  Send,
  Check,
  ShieldCheck,
  Clock,
  Package,
  Camera,
  Upload,
  Video,
  Film,
  X,
  CheckSquare,
  IndianRupee,
  MapPin,
  Building2,
  FileText,
  FileDown,
  BadgeCheck,
  MessageSquare,
  Mail,
  CreditCard,
} from "lucide-react";
import type { ServiceJob, WorkflowStage } from "@/types/service-job";

export interface ServiceWorkflowPipelineProps {
  job: ServiceJob;
  currentUser: string;
  onSendToAravindh?: () => void;
  onSendToSenthilDirect?: () => void;
  onConfirmBranchPickup?: () => void;
  onAravindhApproveAndSendToSenthil?: (photoUrl: string, videoUrl?: string, notes?: string) => void;
  onAravindhAccept?: (photoUrl: string, notes?: string) => void;
  onSenthilSubmitRepairToPriya?: (
    scope: "MINIMUM_30" | "MAXIMUM_50" | "CUSTOM",
    notes: string,
    proofPhotos: string[],
    proofVideo?: string
  ) => void;
  onSenthilSubmitRepairWork?: (notes: string, proofPhotos: string[], proofVideo?: string) => void;
  onAravindhSubmitScopeToPriya?: (
    scope: "MINIMUM_30" | "MAXIMUM_50" | "CUSTOM",
    notes: string,
    proofPhotos: string[],
    proofVideo?: string
  ) => void;
  onPriyaSubmitPriceToMd?: (
    serviceEstimate: number,
    sparePartsCost: number,
    discount: number,
    gstRate: number,
    totalAmount: number,
    notes?: string
  ) => void;
  onMdApprovePrice?: (approvedPrice: number, discount?: number, mdNote?: string) => void;
  onPriyaCompleteDeliveryAndQuotation?: (
    handoverType: "COURIER" | "DIRECT_HANDOVER" | "FIELD_PICKUP",
    recipientOrDocket: string,
    courierName?: string,
    notes?: string
  ) => void;
  onRecordPaymentAndCloseJob?: (
    paymentMode: string,
    reference: string,
    amount: number,
    receivedBy: string,
    notes?: string
  ) => void;
  onOpenQuotation?: () => void;
}

export default function ServiceWorkflowPipeline({
  job,
  currentUser,
  onSendToAravindh,
  onSendToSenthilDirect,
  onConfirmBranchPickup,
  onAravindhApproveAndSendToSenthil,
  onAravindhAccept,
  onSenthilSubmitRepairToPriya,
  onSenthilSubmitRepairWork,
  onAravindhSubmitScopeToPriya,
  onPriyaSubmitPriceToMd,
  onMdApprovePrice,
  onPriyaCompleteDeliveryAndQuotation,
  onRecordPaymentAndCloseJob,
  onOpenQuotation,
}: ServiceWorkflowPipelineProps) {
  const workflow = job.workflow || {
    stage: "INTAKE_RECEIVED" as WorkflowStage,
  };
  const stage = workflow.stage || "INTAKE_RECEIVED";

  const user = (currentUser || "").toLowerCase().trim();
  const isAravindh = user.includes("aravind");
  const isSenthil = user.includes("senthil");
  const isPriya = user.includes("priya") || user.includes("azhalaku");
  const isBranchStaff = user.includes("suganya") || user.includes("radha");
  const isMainOfficeIntake = user.includes("rekha") || user.includes("sabitha");
  const isIntakeStaff = isBranchStaff || isMainOfficeIntake;
  const isMd =
    user.includes("md") ||
    user.startsWith("md@") ||
    user.startsWith("director") ||
    user === "md";
  const isAdmin =
    user.includes("admin") ||
    user.startsWith("admin@") ||
    user === "admin";
  const isAdminOrMd = isAdmin || isMd;

  const firstProduct = (job.products && job.products[0]) || {
    productName: "Service Equipment",
    makeModel: "",
    serialNo: "",
    qty: 1,
    complaint: "",
    productValue: 4000,
  };

  const originalCreator = job.createdBy || workflow.intakeStaffName || "Service Staff";
  const creatorLower = originalCreator.toLowerCase();
  const isCreatedByBranch =
    workflow.isBranchDelivery ||
    creatorLower.includes("suganya") ||
    creatorLower.includes("radha");

  const isCreatedByMainOffice =
    creatorLower.includes("sabitha") ||
    creatorLower.includes("rekha");

  // Aravindh branch pickup/verification is ONLY for Branch Deliveries (Suganya & Radha).
  // Main Office Intake (Sabitha & Rekha) routes directly to Senthil (No Aravindh).
  const isBranchPipeline = isCreatedByBranch && !isCreatedByMainOffice && !isMainOfficeIntake;

  // ROLE-BASED SECTION VISIBILITY:
  // Each account only sees the work and content they perform!
  // Suganya/Radha/Sabitha/Rekha: Section 1 (Intake Creation)
  // Aravindh: Section 2 (Physical Pickup & Verification - Branch Deliveries ONLY)
  // Senthil: Section 3 (Technical Repair & 30%/50% Scope)
  // Priya: Section 4 (Pricing), Section 6 (Quotation Dispatch), Section 7 (Payment)
  // MD: Section 5 ONLY (Price Approval Gateway)
  // Admin: Full oversight across sections
  const showSection1 = isAdmin || isIntakeStaff;
  const showSection2 = (isAdmin || isAravindh) && isBranchPipeline;
  const showSection3 = isAdmin || isSenthil;
  const showSection4 = isAdmin || isPriya;
  const showSection5 = isAdmin || isMd;
  const showSection6 = isAdmin || isPriya;
  const showSection7 = isAdmin || isPriya || (!isBranchStaff && !isMainOfficeIntake && !isAravindh && !isSenthil && !isMd);

  // Stage 2: Verification State
  const [verificationPhoto, setVerificationPhoto] = useState<string>(
    workflow.aravindhProductPhoto || ""
  );
  const [verificationVideo, setVerificationVideo] = useState<string>(
    workflow.aravindhProductVideo || ""
  );
  const [verificationNotes, setVerificationNotes] = useState<string>(
    workflow.aravindhInspectionNotes || "Unit received at workshop. Serial number plate intact, zero external physical damage."
  );

  // Stage 3: Repair Scope State
  const [repairScope, setRepairScope] = useState<"MINIMUM_30" | "MAXIMUM_50" | "CUSTOM">(
    workflow.mechanicEstimateType || "MINIMUM_30"
  );
  const [repairNotes, setRepairNotes] = useState<string>(
    workflow.mechanicAssessment || "Cleaned sensor diaphragm, replaced seals, recalibrated zero and span point."
  );
  const [proofPhotos, setProofPhotos] = useState<string[]>(() => {
    return Array.from(
      new Set([
        ...(job.proofPhotos || job.proofImages || []),
        ...(workflow.repairProofPhotos || []),
      ])
    );
  });
  const [proofVideo, setProofVideo] = useState<string>(
    job.proofVideo || workflow.repairProofVideo || ""
  );

  // Stage 4: Pricing State
  const defaultBaseEstimate = () => {
    if (workflow.priyaRepairEstimate && workflow.priyaRepairEstimate > 0)
      return workflow.priyaRepairEstimate;
    const baseVal = Number(firstProduct.productValue || 4000);
    return repairScope === "MAXIMUM_50"
      ? Math.round(baseVal * 0.5)
      : Math.round(baseVal * 0.3);
  };

  const [priyaServiceEstimate, setPriyaServiceEstimate] = useState<number>(defaultBaseEstimate);
  const [priyaPartsCost, setPriyaPartsCost] = useState<number>(
    workflow.priyaSparePartsCost || 0
  );
  const [priyaDiscount, setPriyaDiscount] = useState<number>(
    workflow.priyaDiscount || job.totals?.discount || 0
  );
  const [priyaPricingNotes, setPriyaPricingNotes] = useState<string>(
    workflow.priyaPricingNotes || "Standard overhaul with calibration test certificate."
  );

  const priyaGstRate = 18;
  const priyaTaxableAmount = Math.max(
    0,
    Number(priyaServiceEstimate || 0) +
      Number(priyaPartsCost || 0) -
      Number(priyaDiscount || 0)
  );
  const priyaGstAmount = Math.round((priyaTaxableAmount * priyaGstRate) / 100);
  const priyaTotalQuotation = priyaTaxableAmount + priyaGstAmount;

  // Stage 5: MD Approval State
  const [mdPriceDecision, setMdPriceDecision] = useState<number>(
    workflow.mdApprovedPrice ||
      workflow.priyaTotalQuotationAmount ||
      priyaTotalQuotation
  );
  const [mdDiscountInput, setMdDiscountInput] = useState<number>(
    workflow.mdDiscount || priyaDiscount || 0
  );
  const [mdNoteText, setMdNoteText] = useState<string>(
    workflow.mdApprovalNotes || "Approved. Proceed with customer quotation and delivery."
  );

  // Stage 6: Delivery State
  const [handoverType, setHandoverType] = useState<"COURIER" | "DIRECT_HANDOVER" | "FIELD_PICKUP">(
    workflow.priyaHandoverType || "COURIER"
  );
  const [recipientOrDocket, setRecipientOrDocket] = useState<string>(
    workflow.priyaCourierDocket ||
      workflow.priyaDeliveryPersonName ||
      "STC-98421045"
  );
  const [courierName, setCourierName] = useState<string>(
    workflow.priyaCourierName || "ST Courier"
  );

  // Stage 7: Payment State
  const [paymentMode, setPaymentMode] = useState<string>(
    workflow.paymentMode || job.payment?.mode || "UPI"
  );
  const [paymentRef, setPaymentRef] = useState<string>(
    workflow.paymentReference || job.payment?.reference || "UPI/2026/9842145"
  );
  const [paymentAmount, setPaymentAmount] = useState<number>(
    workflow.paymentAmount ||
      workflow.mdApprovedPrice ||
      priyaTotalQuotation
  );
  const [paymentReceivedBy, setPaymentReceivedBy] = useState<string>(
    workflow.paymentReceivedBy || currentUser
  );
  const [paymentNotes, setPaymentNotes] = useState<string>(
    workflow.paymentNotes || "Payment received in full. Job closed successfully."
  );

  // Sync state if job prop updates
  useEffect(() => {
    if (workflow.aravindhProductPhoto) setVerificationPhoto(workflow.aravindhProductPhoto);
    if (workflow.aravindhProductVideo) setVerificationVideo(workflow.aravindhProductVideo);
    if (workflow.mechanicEstimateType) setRepairScope(workflow.mechanicEstimateType);
    if (workflow.priyaTotalQuotationAmount) setMdPriceDecision(workflow.priyaTotalQuotationAmount);
    if (workflow.mdApprovedPrice) setPaymentAmount(workflow.mdApprovedPrice);
  }, [workflow]);

  // Recalculate default service estimate when repair scope changes if not manually set
  useEffect(() => {
    if (!workflow.priyaRepairEstimate) {
      const baseVal = Number(firstProduct.productValue || 4000);
      setPriyaServiceEstimate(
        repairScope === "MAXIMUM_50" ? Math.round(baseVal * 0.5) : Math.round(baseVal * 0.3)
      );
    }
  }, [repairScope, firstProduct.productValue, workflow.priyaRepairEstimate]);

  // File Handlers
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setVerificationPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setVerificationVideo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddProofPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProofPhotos((prev) => [...prev, reader.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddProofVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProofVideo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Adaptive Stage Tracker Definition:
  // Branch Office (Suganya/Radha): 7 stages including Aravindh Branch Pickup & Verification
  // Main Office (Sabitha/Rekha): 6 stages directly to Senthil (NO Aravindh!)
  const STAGES: {
    key: WorkflowStage;
    number: number;
    label: string;
    actor: string;
    color: string;
  }[] = useMemo(() => {
    if (isBranchPipeline) {
      return [
        {
          key: "INTAKE_RECEIVED" as WorkflowStage,
          number: 1,
          label: "Branch Intake",
          actor: "Suganya / Radha",
          color: "#0284c7",
        },
        {
          key: "AWAITING_ARAVINDH_ACCEPT" as WorkflowStage,
          number: 2,
          label: "Verification",
          actor: "Aravindh",
          color: "#6366f1",
        },
        {
          key: "UNDER_REPAIR_SENTHIL" as WorkflowStage,
          number: 3,
          label: "Repair",
          actor: "Senthil",
          color: "#d97706",
        },
        {
          key: "AWAITING_PRIYA_PRICING" as WorkflowStage,
          number: 4,
          label: "Pricing",
          actor: "Azhalaku Priya",
          color: "#0891b2",
        },
        {
          key: "AWAITING_MD_APPROVAL" as WorkflowStage,
          number: 5,
          label: "MD Approval",
          actor: "Director",
          color: "#7c3aed",
        },
        {
          key: "PRICE_APPROVED_BY_MD" as WorkflowStage,
          number: 6,
          label: "Quotation",
          actor: "Azhalaku Priya",
          color: "#059669",
        },
        {
          key: "JOB_COMPLETED" as WorkflowStage,
          number: 7,
          label: "Payment",
          actor: "Accounts Desk",
          color: "#16a34a",
        },
      ];
    } else {
      return [
        {
          key: "INTAKE_RECEIVED" as WorkflowStage,
          number: 1,
          label: "Main Office Intake",
          actor: "Sabitha / Rekha",
          color: "#0284c7",
        },
        {
          key: "UNDER_REPAIR_SENTHIL" as WorkflowStage,
          number: 2,
          label: "Repair",
          actor: "Senthil",
          color: "#d97706",
        },
        {
          key: "AWAITING_PRIYA_PRICING" as WorkflowStage,
          number: 3,
          label: "Pricing",
          actor: "Azhalaku Priya",
          color: "#0891b2",
        },
        {
          key: "AWAITING_MD_APPROVAL" as WorkflowStage,
          number: 4,
          label: "MD Approval",
          actor: "Director",
          color: "#7c3aed",
        },
        {
          key: "PRICE_APPROVED_BY_MD" as WorkflowStage,
          number: 5,
          label: "Quotation",
          actor: "Azhalaku Priya",
          color: "#059669",
        },
        {
          key: "JOB_COMPLETED" as WorkflowStage,
          number: 6,
          label: "Payment",
          actor: "Accounts Desk",
          color: "#16a34a",
        },
      ];
    }
  }, [isBranchPipeline]);

  const getStageIndex = (s: WorkflowStage) => {
    if (isBranchPipeline) {
      if (s === "INTAKE_RECEIVED") return 0;
      if (s === "AWAITING_ARAVINDH_ACCEPT") return 1;
      if (s === "UNDER_REPAIR_SENTHIL" || s === "UNDER_REPAIR_ARAVINDH") return 2;
      if (s === "AWAITING_PRIYA_PRICING") return 3;
      if (s === "AWAITING_MD_APPROVAL") return 4;
      if (s === "PRICE_APPROVED_BY_MD" || s === "READY_FOR_HANDOVER") return 5;
      if (s === "JOB_COMPLETED") return 6;
      return 0;
    } else {
      if (s === "INTAKE_RECEIVED") return 0;
      if (s === "UNDER_REPAIR_SENTHIL" || s === "UNDER_REPAIR_ARAVINDH" || s === "AWAITING_ARAVINDH_ACCEPT") return 1;
      if (s === "AWAITING_PRIYA_PRICING") return 2;
      if (s === "AWAITING_MD_APPROVAL") return 3;
      if (s === "PRICE_APPROVED_BY_MD" || s === "READY_FOR_HANDOVER") return 4;
      if (s === "JOB_COMPLETED") return 5;
      return 0;
    }
  };

  const currentIndex = getStageIndex(stage);

  // Helper to generate WhatsApp URL for customer quotation
  const getWhatsAppQuotationLink = () => {
    const rawPhone = String(job.customer?.phone || "").replace(/[^0-9]/g, "");
    const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const approvedPrice =
      workflow.mdApprovedPrice ||
      workflow.priyaTotalQuotationAmount ||
      priyaTotalQuotation;
    const msg = `Dear ${job.customer?.name || "Customer"},\n\nQuotation for Service Job #${job.jobNo || job.id} (${firstProduct.productName}):\n\nRepair Scope: ${repairScope === "MAXIMUM_50" ? "50% Overhaul" : "30% Standard Service"}\nTotal Quotation: ₹${approvedPrice.toLocaleString("en-IN")} (incl. 18% GST)\n\nPlease confirm your acceptance.\n\nThank you,\nNUNES Instruments`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  // Helper to generate Mailto URL for customer quotation
  const getEmailQuotationLink = () => {
    const email = job.customer?.email || "";
    const approvedPrice =
      workflow.mdApprovedPrice ||
      workflow.priyaTotalQuotationAmount ||
      priyaTotalQuotation;
    const subject = `Service Quotation #${job.jobNo || job.id} - ${firstProduct.productName}`;
    const body = `Dear ${job.customer?.name || "Customer"},\n\nPlease find the service quotation details:\n\nJob No: #${job.jobNo || job.id}\nEquipment: ${firstProduct.productName} (${firstProduct.makeModel || ""})\nSerial No: ${firstProduct.serialNo || "N/A"}\nScope: ${repairScope === "MAXIMUM_50" ? "50% Overhaul" : "30% Standard Service"}\nTotal Amount: ₹${approvedPrice.toLocaleString("en-IN")} (incl. 18% GST)\n\nWarm regards,\nAzhalaku Priya\nNUNES Instruments`;
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "16px 20px",
        marginBottom: "20px",
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
      }}
    >
      {/* HEADER: CLEAN TITLE & CURRENT STAGE */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          paddingBottom: "12px",
          borderBottom: "1px solid #f1f5f9",
          marginBottom: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              background: "#0f766e",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
            }}
          >
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>
              Service Workflow
            </h3>
            <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
              Job Status &amp; Approvals
            </p>
          </div>
        </div>

        {/* Current Stage Badge */}
        <div
          style={{
            background:
              stage === "INTAKE_RECEIVED"
                ? "#eff6ff"
                : stage === "AWAITING_ARAVINDH_ACCEPT"
                ? "#eef2ff"
                : stage === "UNDER_REPAIR_SENTHIL" || stage === "UNDER_REPAIR_ARAVINDH"
                ? "#fffbeb"
                : stage === "AWAITING_PRIYA_PRICING"
                ? "#ecfeff"
                : stage === "AWAITING_MD_APPROVAL"
                ? "#f5f3ff"
                : stage === "PRICE_APPROVED_BY_MD" || stage === "READY_FOR_HANDOVER"
                ? "#ecfdf5"
                : "#f0fdf4",
            border:
              stage === "INTAKE_RECEIVED"
                ? "1px solid #bfdbfe"
                : stage === "AWAITING_ARAVINDH_ACCEPT"
                ? "1px solid #c7d2fe"
                : stage === "UNDER_REPAIR_SENTHIL" || stage === "UNDER_REPAIR_ARAVINDH"
                ? "1px solid #fde68a"
                : stage === "AWAITING_PRIYA_PRICING"
                ? "1px solid #a5f3fc"
                : stage === "AWAITING_MD_APPROVAL"
                ? "1px solid #ddd6fe"
                : "1px solid #a7f3d0",
            color:
              stage === "INTAKE_RECEIVED"
                ? "#1d4ed8"
                : stage === "AWAITING_ARAVINDH_ACCEPT"
                ? "#4338ca"
                : stage === "UNDER_REPAIR_SENTHIL" || stage === "UNDER_REPAIR_ARAVINDH"
                ? "#b45309"
                : stage === "AWAITING_PRIYA_PRICING"
                ? "#0891b2"
                : stage === "AWAITING_MD_APPROVAL"
                ? "#6d28d9"
                : "#047857",
            padding: "5px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Clock size={13} />
          <span>
            {stage === "INTAKE_RECEIVED" && (isBranchPipeline ? "Branch Intake" : "Main Office Intake")}
            {stage === "AWAITING_ARAVINDH_ACCEPT" && (isBranchPipeline ? "Awaiting Verification" : "In Repair")}
            {(stage === "UNDER_REPAIR_SENTHIL" || stage === "UNDER_REPAIR_ARAVINDH") && "In Repair"}
            {stage === "AWAITING_PRIYA_PRICING" && "Pricing"}
            {stage === "AWAITING_MD_APPROVAL" && "Awaiting MD Approval"}
            {(stage === "PRICE_APPROVED_BY_MD" || stage === "READY_FOR_HANDOVER") && "Quotation Dispatched"}
            {stage === "JOB_COMPLETED" && "Completed"}
          </span>
        </div>
      </div>

      {/* 7-STAGE PROGRESS TRACKER (Shows high-level progress to everyone) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        {STAGES.map((stg, idx) => {
          const isDone = currentIndex > idx || stage === "JOB_COMPLETED";
          const isCurrent = currentIndex === idx && stage !== "JOB_COMPLETED";
          return (
            <div
              key={stg.key}
              style={{
                background: isCurrent ? "#f8fafc" : isDone ? "#f0fdf4" : "#ffffff",
                border: isCurrent
                  ? `2px solid ${stg.color}`
                  : isDone
                  ? "1.5px solid #86efac"
                  : "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "8px 10px",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: isDone ? "#16a34a" : isCurrent ? stg.color : "#cbd5e1",
                    color: "#ffffff",
                    fontSize: "10px",
                    fontWeight: 900,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {isDone ? <Check size={11} strokeWidth={3} /> : stg.number}
                </span>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    color: isDone ? "#15803d" : isCurrent ? stg.color : "#94a3b8",
                    textTransform: "uppercase",
                  }}
                >
                  {isDone ? "Done" : isCurrent ? "Active" : "Pending"}
                </span>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 750,
                  color: isCurrent ? "#0f172a" : "#334155",
                  lineHeight: 1.25,
                }}
              >
                {stg.label}
              </div>
              <div
                style={{
                  fontSize: "9.5px",
                  color: "#64748b",
                  marginTop: "2px",
                  lineHeight: 1.2,
                }}
              >
                {stg.actor}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* ADMIN EXECUTIVE FAST-FORWARD CONTROLLER */}
      {/* ========================================================================= */}
      {isAdminOrMd && (
        <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '10px 14px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ⚡ Admin Executive Fast-Forward Controller
              </span>
              <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#64748b' }}>
                Admin has full oversight: click any stage below to run or fast-forward this job instantly.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {[
                { s: 'INTAKE_RECEIVED', l: '1. Intake' },
                { s: 'AWAITING_ARAVINDH_ACCEPT', l: '2. Verify' },
                { s: 'UNDER_REPAIR_SENTHIL', l: '3. Repair' },
                { s: 'AWAITING_PRIYA_PRICING', l: '4. Pricing' },
                { s: 'AWAITING_MD_APPROVAL', l: '5. MD Approval' },
                { s: 'READY_FOR_HANDOVER', l: '6. Handover' },
                { s: 'JOB_COMPLETED', l: '✓ Complete All' },
              ].map(st => (
                <button
                  key={st.s}
                  type="button"
                  onClick={() => {
                    if (st.s === 'INTAKE_RECEIVED' && onSendToSenthilDirect) onSendToSenthilDirect();
                    else if (st.s === 'AWAITING_ARAVINDH_ACCEPT' && onSendToAravindh) onSendToAravindh();
                    else if (st.s === 'UNDER_REPAIR_SENTHIL' && onAravindhApproveAndSendToSenthil) onAravindhApproveAndSendToSenthil(verificationPhoto, verificationVideo, verificationNotes);
                    else if (st.s === 'AWAITING_PRIYA_PRICING' && onSenthilSubmitRepairToPriya) onSenthilSubmitRepairToPriya(repairScope, repairNotes, proofPhotos, proofVideo);
                    else if (st.s === 'AWAITING_MD_APPROVAL' && onPriyaSubmitPriceToMd) onPriyaSubmitPriceToMd(priyaServiceEstimate, priyaPartsCost, priyaDiscount, priyaGstRate, priyaTotalQuotation, priyaPricingNotes);
                    else if (st.s === 'READY_FOR_HANDOVER' && onMdApprovePrice) onMdApprovePrice(mdPriceDecision, mdDiscountInput, mdNoteText);
                    else if (st.s === 'JOB_COMPLETED' && onRecordPaymentAndCloseJob) onRecordPaymentAndCloseJob('UPI', 'ADMIN_DIRECT', priyaTotalQuotation || 3000, 'Admin Director', 'Admin Fast-Forward Approval');
                  }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: stage === st.s ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                    background: stage === st.s ? '#2563eb' : '#ffffff',
                    color: stage === st.s ? '#ffffff' : '#334155',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {st.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: INTAKE (Shown only to Front Office Intake staff & Admin/MD) */}
      {/* ========================================================================= */}
      {showSection1 && (
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "12px 14px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Package size={17} color="#0284c7" />
              <span style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>
                1. Equipment Intake
              </span>
            </div>
            <div style={{ fontSize: "12.5px", color: "#64748b" }}>
              Logged by: <b style={{ color: "#0f172a" }}>{originalCreator}</b>
            </div>
          </div>

          {/* Location badge */}
          <div style={{ marginTop: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "13px", fontWeight: 750, color: isCreatedByBranch ? "#b45309" : "#047857" }}>
              {isCreatedByBranch ? <MapPin size={15} /> : <Building2 size={15} />}
              <span>{isCreatedByBranch ? "Branch Office Delivery • Transfer Required" : "Main Office Delivery • Direct to Workshop"}</span>
            </div>
            {isCreatedByBranch && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  background: workflow.aravindhBranchPickupDone ? "#dcfce7" : "#fef3c7",
                  color: workflow.aravindhBranchPickupDone ? "#15803d" : "#92400e",
                  padding: "3px 9px",
                  borderRadius: "6px",
                }}
              >
                {workflow.aravindhBranchPickupDone ? "✓ Picked Up" : "Pickup Pending"}
              </span>
            )}
          </div>

          {/* Buttons */}
          {stage === "INTAKE_RECEIVED" && (
            <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
              {isCreatedByBranch ? (
                <button
                  type="button"
                  onClick={onSendToAravindh}
                  style={{
                    background: "#0284c7",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "13.5px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                  }}
                >
                  <Send size={14} />
                  <span>Send to Aravindh ➔</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSendToSenthilDirect}
                  style={{
                    background: "#059669",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "13.5px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                  }}
                >
                  <Send size={14} />
                  <span>Send to Senthil ➔</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: PHYSICAL VERIFICATION (Shown only to Aravindh & Admin/MD) */}
      {/* ========================================================================= */}
      {showSection2 && (
        <div
          style={{
            background: stage === "AWAITING_ARAVINDH_ACCEPT" ? "#fbfbfe" : "#ffffff",
            border: stage === "AWAITING_ARAVINDH_ACCEPT" ? "1.5px solid #818cf8" : "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "12px 14px",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Camera size={16} color="#4f46e5" />
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                2. Physical Verification
              </span>
            </div>
            {workflow.aravindhAcceptedAt && (
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#15803d", background: "#dcfce7", padding: "2px 8px", borderRadius: "6px" }}>
                ✓ Verified
              </span>
            )}
          </div>

          {isCreatedByBranch && !workflow.aravindhBranchPickupDone && (
            <div style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fef3c7", padding: "8px 12px", borderRadius: "8px", fontSize: "11.5px" }}>
              <span style={{ color: "#92400e", fontWeight: 700 }}>Branch Transfer Required</span>
              <button
                type="button"
                onClick={onConfirmBranchPickup}
                style={{ background: "#b45309", color: "#fff", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}
              >
                Confirm Pickup
              </button>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "10px" }}>
            <div style={{ border: "1px dashed #cbd5e1", borderRadius: "8px", padding: "8px", background: "#ffffff" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Verification Photo:
              </label>
              {verificationPhoto ? (
                <div style={{ position: "relative", height: "80px", borderRadius: "6px", overflow: "hidden", border: "1px solid #cbd5e1", marginBottom: "4px" }}>
                  <img src={verificationPhoto} alt="Verification" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ) : (
                <div style={{ height: "50px", background: "#f8fafc", borderRadius: "6px", display: "grid", placeItems: "center", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
                  No photo uploaded
                </div>
              )}
              {stage === "AWAITING_ARAVINDH_ACCEPT" && (
                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoFileChange} style={{ fontSize: "11px", width: "100%" }} />
              )}
            </div>

            <div style={{ border: "1px dashed #cbd5e1", borderRadius: "8px", padding: "8px", background: "#ffffff" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                Verification Video (Optional):
              </label>
              {verificationVideo ? (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f1f5f9", padding: "6px", borderRadius: "6px", fontSize: "11px", color: "#334155", marginBottom: "4px" }}>
                  <Film size={13} color="#6366f1" />
                  <span>Video attached</span>
                </div>
              ) : (
                <div style={{ height: "50px", background: "#f8fafc", borderRadius: "6px", display: "grid", placeItems: "center", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
                  No video attached
                </div>
              )}
              {stage === "AWAITING_ARAVINDH_ACCEPT" && (
                <input type="file" accept="video/*" capture="environment" onChange={handleVideoFileChange} style={{ fontSize: "11px", width: "100%" }} />
              )}
            </div>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
              Condition Remarks:
            </label>
            <input
              type="text"
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              disabled={stage !== "AWAITING_ARAVINDH_ACCEPT"}
              placeholder="e.g. Serial # checked, no physical breakage."
              style={{ width: "100%", fontSize: "12px", padding: "6px 10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>

          {stage === "AWAITING_ARAVINDH_ACCEPT" && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  if (onAravindhApproveAndSendToSenthil) {
                    onAravindhApproveAndSendToSenthil(verificationPhoto, verificationVideo, verificationNotes);
                  } else if (onAravindhAccept) {
                    onAravindhAccept(verificationPhoto, verificationNotes);
                  }
                }}
                style={{
                  background: "#4f46e5",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <CheckSquare size={13} />
                <span>Verify &amp; Send to Senthil ➔</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: TECHNICAL REPAIR (Shown only to Senthil & Admin/MD) */}
      {/* ========================================================================= */}
      {showSection3 && (
        <div
          style={{
            background: stage === "UNDER_REPAIR_SENTHIL" || stage === "UNDER_REPAIR_ARAVINDH" ? "#fffdfa" : "#ffffff",
            border: stage === "UNDER_REPAIR_SENTHIL" || stage === "UNDER_REPAIR_ARAVINDH" ? "1.5px solid #f59e0b" : "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "12px 14px",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Wrench size={17} color="#d97706" />
              <span style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>
                {isBranchPipeline ? "3. Technical Repair" : "2. Technical Repair"}
              </span>
            </div>
            {workflow.repairCompletedAt && (
              <span style={{ fontSize: "12.5px", fontWeight: 750, color: "#15803d", background: "#dcfce7", padding: "3px 9px", borderRadius: "6px" }}>
                ✓ Repaired ({workflow.mechanicEstimateType === "MAXIMUM_50" ? "50% Overhaul" : "30% Service"}{workflow.repairDurationMinutes ? ` • ${workflow.repairDurationMinutes}m` : ""})
              </span>
            )}
          </div>

          {/* Senthil Physical Receipt & Repair Time Status */}
          {(workflow.repairStartedAt || workflow.senthilAcceptedAt) && (
            <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px", fontSize: "12.5px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", color: "#065f46", fontWeight: 750 }}>
                <Clock size={15} color="#059669" />
                <span>
                  {workflow.repairCompletedAt
                    ? `✓ Repair Completed (${workflow.repairDurationMinutes ? `${workflow.repairDurationMinutes} mins` : "Logged"})`
                    : workflow.repairStartedAt
                    ? `⚡ Repair in Progress • Started: ${new Date(workflow.repairStartedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : `⏳ In Bay • Received: ${new Date(workflow.senthilAcceptedAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                </span>
              </div>
              {workflow.senthilAcceptedAt && (
                <span style={{ color: "#475569", fontWeight: 600 }}>
                  Bay Intake: {workflow.senthilAcceptedBy || "Senthil Kumar"}
                </span>
              )}
            </div>
          )}

          {/* Customer & Equipment Reference Summary for Senthil */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "12px 14px",
              marginBottom: "12px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Customer Name &amp; Contact
              </div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                {job.customer?.name || "Customer"}
              </div>
              <div style={{ fontSize: "13px", color: "#475569" }}>
                {job.customer?.phone || ""} {job.customer?.city ? `• ${job.customer.city}` : ""}
              </div>
              {job.customer?.address && (
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  {job.customer.address}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Equipment &amp; Serial #
              </div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                {firstProduct.productName} {firstProduct.makeModel ? `(${firstProduct.makeModel})` : ""}
              </div>
              <div style={{ fontSize: "13px", color: "#047857", fontFamily: "monospace", fontWeight: 700 }}>
                Serial: {firstProduct.serialNo || "N/A"} • Base Value: ₹{Number(firstProduct.productValue || 0).toLocaleString("en-IN")}
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Customer Reported Problem / Fault Complaint
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#7f1d1d",
                  background: "#fef2f2",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #fee2e2",
                  marginTop: "4px",
                  fontWeight: 650,
                }}
              >
                {firstProduct.complaint || "General servicing and physical inspection requested."}
              </div>
            </div>
          </div>

          {/* Scope Selection */}
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>
              Repair Scope:
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setRepairScope("MINIMUM_30")}
                disabled={stage !== "UNDER_REPAIR_SENTHIL" && stage !== "UNDER_REPAIR_ARAVINDH"}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: repairScope === "MINIMUM_30" ? "2px solid #059669" : "1px solid #cbd5e1",
                  background: repairScope === "MINIMUM_30" ? "#ecfdf5" : "#ffffff",
                  color: repairScope === "MINIMUM_30" ? "#047857" : "#475569",
                }}
              >
                30% Standard Service
              </button>

              <button
                type="button"
                onClick={() => setRepairScope("MAXIMUM_50")}
                disabled={stage !== "UNDER_REPAIR_SENTHIL" && stage !== "UNDER_REPAIR_ARAVINDH"}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: repairScope === "MAXIMUM_50" ? "2px solid #d97706" : "1px solid #cbd5e1",
                  background: repairScope === "MAXIMUM_50" ? "#fffbeb" : "#ffffff",
                  color: repairScope === "MAXIMUM_50" ? "#b45309" : "#475569",
                }}
              >
                50% Major Overhaul
              </button>

              <button
                type="button"
                onClick={() => setRepairScope("CUSTOM")}
                disabled={stage !== "UNDER_REPAIR_SENTHIL" && stage !== "UNDER_REPAIR_ARAVINDH"}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: repairScope === "CUSTOM" ? "2px solid #6366f1" : "1px solid #cbd5e1",
                  background: repairScope === "CUSTOM" ? "#eef2ff" : "#ffffff",
                  color: repairScope === "CUSTOM" ? "#4338ca" : "#475569",
                }}
              >
                Custom Scope
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
              Repair Details:
            </label>
            <input
              type="text"
              value={repairNotes}
              onChange={(e) => setRepairNotes(e.target.value)}
              disabled={stage !== "UNDER_REPAIR_SENTHIL" && stage !== "UNDER_REPAIR_ARAVINDH"}
              placeholder="e.g. Diaphragm cleaned, seals replaced, zero recalibrated."
              style={{ width: "100%", fontSize: "12px", padding: "6px 10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>

          {/* Proof Media */}
          <div style={{ marginBottom: "10px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {(stage === "UNDER_REPAIR_SENTHIL" || stage === "UNDER_REPAIR_ARAVINDH") && (
              <>
                <label style={{ padding: "5px 10px", borderRadius: "6px", border: "1px dashed #cbd5e1", background: "#ffffff", fontSize: "11px", fontWeight: 700, color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Upload size={12} />
                  <span>Add Photo</span>
                  <input type="file" accept="image/*" onChange={handleAddProofPhoto} style={{ display: "none" }} />
                </label>

                <label style={{ padding: "5px 10px", borderRadius: "6px", border: "1px dashed #cbd5e1", background: "#ffffff", fontSize: "11px", fontWeight: 700, color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Video size={12} />
                  <span>Add Video</span>
                  <input type="file" accept="video/*" onChange={handleAddProofVideo} style={{ display: "none" }} />
                </label>
              </>
            )}

            {proofPhotos.map((photo, i) => (
              <div key={i} style={{ width: "40px", height: "40px", borderRadius: "6px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
                <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}

            {proofVideo && (
              <span style={{ fontSize: "11px", color: "#334155", background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px" }}>
                Video attached
              </span>
            )}
          </div>

          {(stage === "UNDER_REPAIR_SENTHIL" || stage === "UNDER_REPAIR_ARAVINDH") && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  if (onSenthilSubmitRepairToPriya) {
                    onSenthilSubmitRepairToPriya(repairScope, repairNotes, proofPhotos, proofVideo);
                  } else if (onAravindhSubmitScopeToPriya) {
                    onAravindhSubmitScopeToPriya(repairScope, repairNotes, proofPhotos, proofVideo);
                  }
                }}
                style={{
                  background: "#d97706",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Send size={13} />
                <span>Send to Priya ➔</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: SERVICE PRICING (Shown only to Azhalaku Priya & Admin/MD) */}
      {/* ========================================================================= */}
      {showSection4 && (
        <div
          style={{
            background: stage === "AWAITING_PRIYA_PRICING" ? "#fbfdfe" : "#ffffff",
            border: stage === "AWAITING_PRIYA_PRICING" ? "1.5px solid #06b6d4" : "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "12px 14px",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <IndianRupee size={16} color="#0891b2" />
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                {isBranchPipeline ? "4. Service Pricing" : "3. Service Pricing"}
              </span>
            </div>
            {workflow.priyaPriceSentToMdAt && (
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#0891b2", background: "#cffafe", padding: "2px 8px", borderRadius: "6px" }}>
                ✓ Quoted ₹{workflow.priyaTotalQuotationAmount?.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Customer & Equipment Reference Summary for Priya */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "10px 12px",
              marginBottom: "12px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "10px",
            }}
          >
            <div>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                Customer Name &amp; Contact
              </div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                {job.customer?.name || "Customer"}
              </div>
              <div style={{ fontSize: "11px", color: "#475569" }}>
                {job.customer?.phone || ""} {job.customer?.city ? `• ${job.customer.city}` : ""}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                Equipment &amp; Serial #
              </div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                {firstProduct.productName} {firstProduct.makeModel ? `(${firstProduct.makeModel})` : ""}
              </div>
              <div style={{ fontSize: "11px", color: "#047857", fontFamily: "monospace", fontWeight: 700 }}>
                Serial: {firstProduct.serialNo || "N/A"} • Value: ₹{Number(firstProduct.productValue || 0).toLocaleString("en-IN")}
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#d97706", textTransform: "uppercase" }}>
                Senthil Repair Assessment ({repairScope === "MAXIMUM_50" ? "50% Overhaul" : "30% Standard Service"})
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#1e293b",
                  background: "#fffbeb",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #fef3c7",
                  marginTop: "3px",
                }}
              >
                <strong>Work Done:</strong> {workflow.mechanicAssessment || repairNotes || "Standard technical repair & sensor recalibration."}
              </div>

              {/* Senthil's Uploaded Repair Proof Media & Aravindh Verification */}
              {Boolean(
                (workflow.repairProofPhotos && workflow.repairProofPhotos.length > 0) ||
                (job.proofPhotos && job.proofPhotos.length > 0) ||
                workflow.repairProofVideo ||
                job.proofVideo ||
                workflow.aravindhProductPhoto
              ) && (
                <div style={{ marginTop: "8px", background: "#ffffff", padding: "8px 10px", borderRadius: "6px", border: "1px solid #fde68a" }}>
                  <div style={{ fontSize: "10.5px", fontWeight: 800, color: "#b45309", marginBottom: "6px" }}>
                    Repair Completion Proof Media &amp; Inspection:
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    {workflow.aravindhProductPhoto && (
                      <div style={{ position: "relative", width: "65px", height: "50px", borderRadius: "6px", overflow: "hidden", border: "1px solid #c084fc" }} title="Aravindh Verification Photo">
                        <img src={workflow.aravindhProductPhoto} alt="Verification" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(107,33,168,0.85)", color: "#fff", fontSize: "8px", textAlign: "center", fontWeight: 800 }}>Receipt</span>
                      </div>
                    )}
                    {Array.from(new Set([...(workflow.repairProofPhotos || []), ...(job.proofPhotos || [])])).map((img, idx) => (
                      <div key={idx} style={{ position: "relative", width: "65px", height: "50px", borderRadius: "6px", overflow: "hidden", border: "1px solid #cbd5e1" }} title={`Senthil Proof ${idx + 1}`}>
                        <img src={img} alt={`Proof ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(180,83,9,0.85)", color: "#fff", fontSize: "8px", textAlign: "center", fontWeight: 800 }}>Proof {idx + 1}</span>
                      </div>
                    ))}
                    {(workflow.repairProofVideo || job.proofVideo) && (
                      <div style={{ width: "80px", height: "50px", borderRadius: "6px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
                        <video src={workflow.repairProofVideo || job.proofVideo} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Senthil Scope Quick Buttons */}
          {stage === "AWAITING_PRIYA_PRICING" && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  const baseVal = Number(firstProduct.productValue || 4000);
                  setPriyaServiceEstimate(Math.round(baseVal * 0.3));
                }}
                style={{
                  background: "#ecfeff",
                  border: "1px solid #0891b2",
                  color: "#0e7490",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Apply 30% Standard Scope (₹{Math.round(Number(firstProduct.productValue || 4000) * 0.3).toLocaleString("en-IN")})
              </button>
              <button
                type="button"
                onClick={() => {
                  const baseVal = Number(firstProduct.productValue || 4000);
                  setPriyaServiceEstimate(Math.round(baseVal * 0.5));
                }}
                style={{
                  background: "#fdf4ff",
                  border: "1px solid #a855f7",
                  color: "#7e22ce",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Apply 50% Overhaul Scope (₹{Math.round(Number(firstProduct.productValue || 4000) * 0.5).toLocaleString("en-IN")})
              </button>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "8px", marginBottom: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                Service (₹):
              </label>
              <input
                type="number"
                value={priyaServiceEstimate}
                onChange={(e) => setPriyaServiceEstimate(Number(e.target.value))}
                disabled={stage !== "AWAITING_PRIYA_PRICING" && !isAdminOrMd}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                Parts (₹):
              </label>
              <input
                type="number"
                value={priyaPartsCost}
                onChange={(e) => setPriyaPartsCost(Number(e.target.value))}
                disabled={stage !== "AWAITING_PRIYA_PRICING" && !isAdminOrMd}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                Discount (₹):
              </label>
              <input
                type="number"
                value={priyaDiscount}
                onChange={(e) => setPriyaDiscount(Number(e.target.value))}
                disabled={stage !== "AWAITING_PRIYA_PRICING" && !isAdminOrMd}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                GST (18%):
              </label>
              <div style={{ padding: "6px 8px", borderRadius: "6px", background: "#f1f5f9", fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                ₹{priyaGstAmount.toLocaleString("en-IN")}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#0891b2", marginBottom: "2px" }}>
                Total (₹):
              </label>
              <div style={{ padding: "6px 8px", borderRadius: "6px", background: "#0891b2", color: "#ffffff", fontSize: "12px", fontWeight: 900 }}>
                ₹{priyaTotalQuotation.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {stage === "AWAITING_PRIYA_PRICING" && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  if (onPriyaSubmitPriceToMd) {
                    onPriyaSubmitPriceToMd(
                      priyaServiceEstimate,
                      priyaPartsCost,
                      priyaDiscount,
                      priyaGstRate,
                      priyaTotalQuotation,
                      priyaPricingNotes
                    );
                  }
                }}
                style={{
                  background: "#0891b2",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Send size={13} />
                <span>Submit to MD ➔</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: MD APPROVAL (Shown strictly to Admin / MD) */}
      {/* ========================================================================= */}
      {showSection5 && (
        <div
          style={{
            background: stage === "AWAITING_MD_APPROVAL" ? "#fbfbfe" : "#ffffff",
            border: stage === "AWAITING_MD_APPROVAL" ? "1.5px solid #8b5cf6" : "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "12px 14px",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <BadgeCheck size={18} color="#7c3aed" />
              <span style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>
                {isBranchPipeline ? "5. MD Approval" : "4. MD Approval"}
              </span>
            </div>
            {workflow.approvedByMd && (
              <span style={{ fontSize: "12.5px", fontWeight: 750, color: "#15803d", background: "#dcfce7", padding: "3px 10px", borderRadius: "6px" }}>
                ✓ Approved (₹{(workflow.mdApprovedPrice || priyaTotalQuotation).toLocaleString("en-IN")})
              </span>
            )}
          </div>

          {/* Customer, Equipment & Technical Repair Context for MD Decision */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '13px' }}>
              <div>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Customer: </span>
                <strong style={{ color: '#0f172a', fontSize: '13.5px' }}>{job.customer?.name || 'Customer'}</strong>
                {job.customer?.phone && <span style={{ color: '#64748b' }}> ({job.customer.phone})</span>}
              </div>
              <div>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Equipment: </span>
                <strong style={{ color: '#0f172a', fontSize: '13.5px' }}>{firstProduct.productName}</strong>
                {firstProduct.makeModel && <span style={{ color: '#475569' }}> [{firstProduct.makeModel}]</span>}
              </div>
              <div>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Serial No: </span>
                <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '13.5px' }}>{firstProduct.serialNo || 'N/A'}</span>
                {firstProduct.productValue ? <span style={{ color: '#64748b' }}> • Val: ₹{Number(firstProduct.productValue).toLocaleString('en-IN')}</span> : null}
              </div>
              <div>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Complaint: </span>
                <span style={{ color: '#b45309', fontWeight: 700, fontSize: '13px' }}>{firstProduct.complaint || 'General Service & Calibration'}</span>
              </div>
            </div>

            {/* Senthil's Scope & Repair Details */}
            {(workflow.mechanicNotes || workflow.repairScopePercent) && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', fontSize: '13px' }}>
                <span style={{ color: '#d97706', fontWeight: 800 }}>Senthil's Repair Details ({workflow.repairScopePercent || 30}% Scope): </span>
                <span style={{ color: '#334155' }}>{workflow.mechanicNotes || 'Standard overhaul and calibration complete.'}</span>
              </div>
            )}

            {/* Priya's Quoted Commercial Breakdown */}
            {(workflow.priyaPriceEnteredAt || workflow.priyaTotalQuotationAmount) && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', fontSize: '13px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Priya's Base Service Charge: </span>
                  <strong style={{ color: '#0f172a', fontSize: '13.5px' }}>₹{Number(workflow.priyaServiceCharge || 0).toLocaleString('en-IN')}</strong>
                </div>
                {workflow.priyaSparePartsCost ? (
                  <div>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Parts: </span>
                    <strong style={{ color: '#0f172a', fontSize: '13.5px' }}>₹{Number(workflow.priyaSparePartsCost).toLocaleString('en-IN')}</strong>
                  </div>
                ) : null}
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Priya's Quoted Total (incl. 18% GST): </span>
                  <strong style={{ color: '#7c3aed', fontSize: '14px' }}>₹{Number(workflow.priyaTotalQuotationAmount || priyaTotalQuotation).toLocaleString('en-IN')}</strong>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                Approved Price (₹):
              </label>
              <input
                type="number"
                value={mdPriceDecision}
                onChange={(e) => setMdPriceDecision(Number(e.target.value))}
                disabled={stage !== "AWAITING_MD_APPROVAL" && !isAdminOrMd}
                style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #8b5cf6", fontSize: "14px", fontWeight: 800 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                Approved Discount (₹):
              </label>
              <input
                type="number"
                value={mdDiscountInput}
                onChange={(e) => setMdDiscountInput(Number(e.target.value))}
                disabled={stage !== "AWAITING_MD_APPROVAL" && !isAdminOrMd}
                style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
              />
            </div>
          </div>

          {(stage === "AWAITING_MD_APPROVAL" || (isAdminOrMd && stage === "AWAITING_PRIYA_PRICING")) && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  if (onMdApprovePrice) {
                    onMdApprovePrice(mdPriceDecision, mdDiscountInput, mdNoteText);
                  }
                }}
                style={{
                  background: "#7c3aed",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "9px 18px",
                  fontSize: "13.5px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                <CheckCircle2 size={15} />
                <span>Approve Price ➔</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6: QUOTATION & DISPATCH (Shown only to Azhalaku Priya & Admin/MD) */}
      {/* ========================================================================= */}
      {showSection6 && (
        <div
          style={{
            background: stage === "PRICE_APPROVED_BY_MD" || stage === "READY_FOR_HANDOVER" ? "#fbfefe" : "#ffffff",
            border: stage === "PRICE_APPROVED_BY_MD" || stage === "READY_FOR_HANDOVER" ? "1.5px solid #10b981" : "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "12px 14px",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Truck size={16} color="#059669" />
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                {isBranchPipeline ? "6. Quotation & Dispatch" : "5. Quotation & Dispatch"}
              </span>
            </div>
            {workflow.priyaQuotationSentAt && (
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#15803d", background: "#dcfce7", padding: "2px 8px", borderRadius: "6px" }}>
                ✓ Dispatched
              </span>
            )}
          </div>

          {/* WhatsApp & Email & Preview buttons */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
            <a
              href={getWhatsAppQuotationLink()}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#25D366",
                color: "#ffffff",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "11px",
                fontWeight: 800,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <MessageSquare size={12} />
              <span>Send WhatsApp</span>
            </a>

            <a
              href={getEmailQuotationLink()}
              style={{
                background: "#0284c7",
                color: "#ffffff",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "11px",
                fontWeight: 800,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Mail size={12} />
              <span>Send Email</span>
            </a>

            <button
              type="button"
              onClick={onOpenQuotation}
              style={{
                background: "#ffffff",
                border: "1px solid #059669",
                color: "#059669",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <FileText size={12} />
              <span>Preview Quotation</span>
            </button>
          </div>

          {/* Handover method */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px", marginBottom: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                Handover Mode:
              </label>
              <select
                value={handoverType}
                onChange={(e) => setHandoverType(e.target.value as any)}
                disabled={stage === "JOB_COMPLETED"}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
              >
                <option value="COURIER">Courier Dispatch</option>
                <option value="DIRECT_HANDOVER">Direct Handover</option>
                <option value="FIELD_PICKUP">Field Delivery</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                {handoverType === "COURIER" ? "Docket / Waybill #:" : "Recipient Name:"}
              </label>
              <input
                type="text"
                value={recipientOrDocket}
                onChange={(e) => setRecipientOrDocket(e.target.value)}
                disabled={stage === "JOB_COMPLETED"}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>
          </div>

          {stage !== "JOB_COMPLETED" && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  if (onPriyaCompleteDeliveryAndQuotation) {
                    onPriyaCompleteDeliveryAndQuotation(handoverType, recipientOrDocket, courierName);
                  }
                }}
                style={{
                  background: "#059669",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <CheckCircle2 size={13} />
                <span>Dispatch Quotation ➔</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 7: PAYMENT & CLOSURE (Shown to Accounts & Admin/MD) */}
      {/* ========================================================================= */}
      {showSection7 && (
        <div
          style={{
            background: stage === "JOB_COMPLETED" ? "#f0fdf4" : "#ffffff",
            border: stage === "JOB_COMPLETED" ? "1.5px solid #16a34a" : "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "12px 14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CreditCard size={16} color="#16a34a" />
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                {isBranchPipeline ? "7. Payment & Closure" : "6. Payment & Closure"}
              </span>
            </div>
            {stage === "JOB_COMPLETED" && (
              <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#166534", background: "#dcfce7", padding: "3px 8px", borderRadius: "6px" }}>
                ✓ Closed
              </span>
            )}
          </div>

          {/* Senthil Scope Quick Buttons */}
          {stage === "AWAITING_PRIYA_PRICING" && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  const baseVal = Number(firstProduct.productValue || 4000);
                  setPriyaServiceEstimate(Math.round(baseVal * 0.3));
                }}
                style={{
                  background: "#ecfeff",
                  border: "1px solid #0891b2",
                  color: "#0e7490",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Apply 30% Standard Scope (₹{Math.round(Number(firstProduct.productValue || 4000) * 0.3).toLocaleString("en-IN")})
              </button>
              <button
                type="button"
                onClick={() => {
                  const baseVal = Number(firstProduct.productValue || 4000);
                  setPriyaServiceEstimate(Math.round(baseVal * 0.5));
                }}
                style={{
                  background: "#fdf4ff",
                  border: "1px solid #a855f7",
                  color: "#7e22ce",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Apply 50% Overhaul Scope (₹{Math.round(Number(firstProduct.productValue || 4000) * 0.5).toLocaleString("en-IN")})
              </button>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "8px", marginBottom: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                Payment Mode:
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                disabled={stage === "JOB_COMPLETED"}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
              >
                <option value="UPI">UPI</option>
                <option value="BANK_NEFT">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CARD">Card</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                Reference / UTR #:
              </label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                disabled={stage === "JOB_COMPLETED"}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                Amount (₹):
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                disabled={stage === "JOB_COMPLETED"}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                Received By:
              </label>
              <input
                type="text"
                value={paymentReceivedBy}
                onChange={(e) => setPaymentReceivedBy(e.target.value)}
                disabled={stage === "JOB_COMPLETED"}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
              />
            </div>
          </div>

          {stage !== "JOB_COMPLETED" && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  if (onRecordPaymentAndCloseJob) {
                    onRecordPaymentAndCloseJob(paymentMode, paymentRef, paymentAmount, paymentReceivedBy, paymentNotes);
                  }
                }}
                style={{
                  background: "#16a34a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 18px",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <CheckCircle2 size={13} />
                <span>Record Payment &amp; Close ➔</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
