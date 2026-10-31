"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Camera,
  Truck,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Package,
  Film,
  Upload,
  X,
  Eye,
  Check,
  ShieldCheck,
  User,
  ArrowRight,
  Layers,
  MapPin,
  Smartphone,
  Paperclip,
  FileText,
  Download,
} from "lucide-react";
import type { ServiceJob, JobWorkflowInfo, WorkflowStage } from "@/types/service-job";
import { dispatchWorkflowAlert } from "@/lib/workflow-service";
import { syncFormToCloud, syncPullFromCloud } from "@/lib/sync";
import { DEMO_BENCHMARK_JOB } from "@/lib/service-defaults";

export default function WorkshopPage() {
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("aravindh@nunesinstruments.com");
  const [jobs, setJobs] = useState<ServiceJob[]>([]);
  const [activeTab, setActiveTab] = useState<"pickups" | "verification" | "repair" | "completed" | "pending" | "in_process">("verification");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [mobileView, setMobileView] = useState<"queue" | "workbench">("queue");

  // Real-time photo state for verification
  const [verificationPhoto, setVerificationPhoto] = useState<string>("");
  const [inspectionNotes, setInspectionNotes] = useState<string>("Located unit in workshop. Physical condition verified and ready for repair.");

  // Repair scope state (30% vs 50%)
  const [repairScope, setRepairScope] = useState<"MINIMUM_30" | "MAXIMUM_50" | "CUSTOM">("MINIMUM_30");
  const [repairNotes, setRepairNotes] = useState<string>("Cleaned sensor diaphragm, replaced seals, re-calibrated zero point.");
  const [repairPhotos, setRepairPhotos] = useState<string[]>([]);
  const [repairVideo, setRepairVideo] = useState<string>("");

  const router = useRouter();

  // Read session on mount & enforce role guard
  useEffect(() => {
    try {
      const raw = localStorage.getItem("nunes_auth_session");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.email) {
          const email = parsed.email.toLowerCase().trim();
          setCurrentUserEmail(parsed.email);
          if (
            !email.includes("admin") &&
            !email.includes("md") &&
            !email.startsWith("md@") &&
            !email.startsWith("admin@") &&
            !email.includes("director")
          ) {
            if (email.includes("priya") || email.includes("azhalaku")) {
              router.replace("/quotations");
              return;
            }
            if (
              email.includes("suganya") ||
              email.includes("radha") ||
              email.includes("sabitha") ||
              email.includes("rekha")
            ) {
              router.replace("/forms/servicing");
              return;
            }
          }
        }
      }
    } catch {}
  }, [router]);

  const user = currentUserEmail.toLowerCase();
  const isAravindh = user.includes("aravind");
  const isSenthil = user.includes("senthil");
  const isAdminOrMd = user.includes("admin") || user.includes("md");

  // Load jobs from localStorage & sync from server
  const loadJobs = async (force = false) => {
    try {
      if (typeof window === "undefined") return;
      const raw = localStorage.getItem("nunes:service_jobs");
      if (raw) {
        setJobs(JSON.parse(raw));
      }
      await syncPullFromCloud(force);
      const updatedRaw = localStorage.getItem("nunes:service_jobs");
      if (updatedRaw) {
        setJobs(JSON.parse(updatedRaw));
      }
    } catch {
      const raw = localStorage.getItem("nunes:service_jobs");
      if (raw) setJobs(JSON.parse(raw));
    }
  };

  useEffect(() => {
    void loadJobs(true);
    const handleSync = () => { void loadJobs(false); };
    window.addEventListener("nunes:records-synced", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("nunes:records-synced", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Check URL query parameters for target job & tab
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const targetJob = sp.get("job") || sp.get("id") || sp.get("job_no");
    const targetTab = sp.get("tab") as "pickups" | "verification" | "repair" | "completed" | null;

    if (targetJob) {
      setSelectedJobId(targetJob);
    }
    if (targetTab && ["pickups", "verification", "repair", "completed"].includes(targetTab)) {
      setActiveTab(targetTab);
    }
  }, []);

  // When jobs load or update, auto-select and auto-switch tab if requested in URL
  useEffect(() => {
    if (typeof window === "undefined" || !jobs.length) return;
    const sp = new URLSearchParams(window.location.search);
    const targetJob = sp.get("job") || sp.get("id") || sp.get("job_no");
    if (targetJob) {
      const found = jobs.find((j) => String(j.id) === targetJob || String(j.jobNo) === targetJob);
      if (found) {
        setSelectedJobId(String(found.id || found.jobNo));
        const stage = found.workflow?.stage;
        if (stage === "UNDER_REPAIR_SENTHIL" || stage === "UNDER_REPAIR_ARAVINDH") {
          setActiveTab("repair");
        } else if (stage === "AWAITING_ARAVINDH_ACCEPT" || stage === "INTAKE_RECEIVED") {
          setActiveTab("verification");
        } else if (
          stage === "AWAITING_PRIYA_PRICING" ||
          stage === "AWAITING_MD_APPROVAL" ||
          stage === "PRICE_APPROVED_BY_MD" ||
          stage === "READY_FOR_HANDOVER" ||
          stage === "JOB_COMPLETED"
        ) {
          setActiveTab("completed");
        }
      }
    }
  }, [jobs]);

  // Save updated job helper
  const saveJobRecord = (updatedJob: ServiceJob) => {
    try {
      const nextList = jobs.map((j) =>
        String(j.id) === String(updatedJob.id) || String(j.jobNo) === String(updatedJob.jobNo)
          ? updatedJob
          : j
      );
      if (!nextList.some((j) => String(j.id) === String(updatedJob.id) || String(j.jobNo) === String(updatedJob.jobNo))) {
        nextList.unshift(updatedJob);
      }
      setJobs(nextList);
      localStorage.setItem("nunes:service_jobs", JSON.stringify(nextList));
      void syncFormToCloud("servicing", String(updatedJob.jobNo || updatedJob.id), String(updatedJob.customer?.name || "Customer"), updatedJob);
    } catch (e) {
      console.error("Failed saving job record:", e);
    }
  };

  // Helper to determine if a job has completed its lifecycle
  const isJobFinishedOrDelivered = (j: any) => {
    const s = String(j.status || "").toUpperCase();
    const st = String(j.workflow?.stage || "").toUpperCase();
    return (
      s === "READY" ||
      s === "CLOSED" ||
      s === "DELIVERED" ||
      st === "JOB_COMPLETED" ||
      st === "READY_FOR_HANDOVER" ||
      Boolean(j.workflow?.finalHandoverCompletedAt)
    );
  };

  // Filter queues
  // 1. Pending Branch Pickups (Suganya / Radha Branch -> Workshop)
  const branchPickups = useMemo(() => {
    return jobs.filter(
      (j) => !isJobFinishedOrDelivered(j) && Boolean(j.workflow?.isBranchDelivery) && !j.workflow?.aravindhBranchPickupDone
    );
  }, [jobs]);

  // 2. Pending Workshop Physical Verification (Units in shop needing physical check)
  const verificationQueue = useMemo(() => {
    return jobs.filter((j) => {
      if (isJobFinishedOrDelivered(j)) return false;
      const isBranchPending = Boolean(j.workflow?.isBranchDelivery) && !j.workflow?.aravindhBranchPickupDone;
      if (isBranchPending) return false;
      const stage = j.workflow?.stage;
      const status = String(j.status || "").toUpperCase();
      if (stage === "UNDER_REPAIR_ARAVINDH" || stage === "UNDER_REPAIR_SENTHIL" || status === "REPAIRING") {
        return false;
      }
      return !stage || stage === "INTAKE_RECEIVED" || stage === "AWAITING_ARAVINDH_ACCEPT";
    });
  }, [jobs]);

  // 3. Active Repair Workbench (Needs 30%/50% scope or mechanic repair)
  const repairQueue = useMemo(() => {
    return jobs.filter((j) => {
      if (isJobFinishedOrDelivered(j)) return false;
      const stage = j.workflow?.stage;
      const status = String(j.status || "").toUpperCase();
      return stage === "UNDER_REPAIR_ARAVINDH" || stage === "UNDER_REPAIR_SENTHIL" || status === "REPAIRING";
    });
  }, [jobs]);

  // 4. Completed / Awaiting Priya Pricing / Handover / Sign-Check
  const completedQueue = useMemo(() => {
    return jobs.filter((j) => {
      const stage = j.workflow?.stage;
      return (
        isJobFinishedOrDelivered(j) ||
        stage === "JOB_COMPLETED" ||
        stage === "READY_FOR_HANDOVER" ||
        stage === "PRICE_APPROVED_BY_MD" ||
        stage === "AWAITING_PRIYA_PRICING" ||
        stage === "AWAITING_MD_APPROVAL" ||
        Boolean(j.signoff?.repairedBy && j.signoff?.inspectedBy) ||
        Boolean(j.signoff?.estimateConfirmedBy)
      );
    });
  }, [jobs]);

  // 5. Pending MD Approvals & Signoffs (for MD supervision)
  const pendingQueue = useMemo(() => {
    return jobs.filter(
      (j) => !isJobFinishedOrDelivered(j) && (j.workflow?.stage === "AWAITING_MD_APPROVAL" || j.workflow?.stage === "AWAITING_ARAVINDH_ACCEPT")
    );
  }, [jobs]);

  // 6. In-Process Workflow Pipeline (Intake, Verification, Priya pricing, Branch transfer)
  const inProcessQueue = useMemo(() => {
    return jobs.filter(
      (j) => !isJobFinishedOrDelivered(j)
    );
  }, [jobs]);

  // Auto-select first job if none selected
  const activeJob = useMemo(() => {
    const norm = (s?: any) => String(s || "").trim().toLowerCase();
    if (selectedJobId) {
      const found = jobs.find((j) => norm(j.id) === norm(selectedJobId) || norm(j.jobNo) === norm(selectedJobId));
      if (found) return found;
    }
    if (activeTab === "pickups" && branchPickups.length > 0) return branchPickups[0];
    if (activeTab === "verification" && verificationQueue.length > 0) return verificationQueue[0];
    if (activeTab === "repair" && repairQueue.length > 0) return repairQueue[0];
    if (activeTab === "completed" && completedQueue.length > 0) return completedQueue[0];
    if (activeTab === "pending" && pendingQueue.length > 0) return pendingQueue[0];
    if (activeTab === "in_process" && inProcessQueue.length > 0) return inProcessQueue[0];
    if (jobs.length > 0) return jobs[0];
    return null;
  }, [selectedJobId, activeTab, branchPickups, verificationQueue, repairQueue, completedQueue, pendingQueue, inProcessQueue, jobs]);

  // Auto-activate repair tab for Senthil
  useEffect(() => {
    if (isSenthil) {
      setActiveTab("repair");
    }
  }, [isSenthil]);

  // Sync active job data to local form states
  useEffect(() => {
    if (activeJob) {
      setVerificationPhoto(activeJob.workflow?.aravindhProductPhoto || "");
      setInspectionNotes(activeJob.workflow?.aravindhInspectionNotes || "Located unit in workshop. Physical condition verified and ready for repair.");
      setRepairScope(activeJob.workflow?.mechanicEstimateType || "MINIMUM_30");
      setRepairNotes(activeJob.workflow?.mechanicAssessment || "Cleaned sensor diaphragm, replaced seals, re-calibrated zero point.");
      setRepairPhotos(activeJob.workflow?.repairProofPhotos || activeJob.proofPhotos || []);
      setRepairVideo(activeJob.workflow?.repairProofVideo || activeJob.proofVideo || "");
    }
  }, [activeJob?.id]);

  // ACTION 1: Confirm Branch Pickup (Aravindh)
  const handleConfirmBranchPickup = (job: ServiceJob) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: "INTAKE_RECEIVED" as WorkflowStage }),
      aravindhBranchPickupDone: true,
      aravindhBranchPickupAt: new Date().toISOString(),
      stage: "AWAITING_ARAVINDH_ACCEPT" as WorkflowStage,
    };

    const updatedJob: ServiceJob = {
      ...job,
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    saveJobRecord(updatedJob);

    const pName = job.products?.[0]?.productName || "Equipment";
    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || "Customer",
      equipmentName: pName,
      fromUser: "Aravindh",
      stage: "AWAITING_ARAVINDH_ACCEPT",
      targetRole: "FRONT_OFFICE",
      targetNames: ["Suganya", "Radha", "Sabitha", "Rekha"],
      title: `🚚 Aravindh Picked Up Job #${job.jobNo} from Branch Office`,
      message: `Aravindh picked up "${pName}" from Branch Office (Suganya/Radha) and brought it safely to Main Office workshop.`,
      priority: "normal",
    });

    setStatusMessage(`✓ Branch pickup confirmed for Job #${job.jobNo}! Moved to Workshop Verification.`);
    setActiveTab("verification");
    setSelectedJobId(String(job.id || job.jobNo));
    setTimeout(() => setStatusMessage(""), 5000);
  };

  // ACTION 2: Real-Time Acceptance (Aravindh)
  const handleAravindhAccept = (job: ServiceJob) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: "INTAKE_RECEIVED" as WorkflowStage }),
      stage: "UNDER_REPAIR_SENTHIL" as WorkflowStage,
      aravindhAcceptedBy: currentUserEmail,
      aravindhAcceptedAt: new Date().toISOString(),
      aravindhProductPhoto: verificationPhoto || job.workflow?.aravindhProductPhoto,
      aravindhInspectionNotes: inspectionNotes,
      mechanicAssigned: "Senthil Kumar (Lead Service Mechanic)",
    };

    const updatedPhotos = verificationPhoto && !(job.proofPhotos || []).includes(verificationPhoto)
      ? [verificationPhoto, ...(job.proofPhotos || [])]
      : (job.proofPhotos || []);

    const updatedJob: ServiceJob = {
      ...job,
      status: "REPAIRING",
      proofPhotos: updatedPhotos,
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    saveJobRecord(updatedJob);

    const pName = job.products?.[0]?.productName || "Equipment";
    // Dispatches strictly to Senthil so Senthil gets the notification to conduct teardown
    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || "Customer",
      equipmentName: pName,
      fromUser: "Aravindh",
      stage: "UNDER_REPAIR_SENTHIL",
      targetRole: "SENTHIL",
      targetNames: ["Senthil Kumar", "senthil", "senthil@nunesinstruments.com"],
      title: `🔧 Equipment Ready for Senthil: Job #${job.jobNo} (${pName})`,
      message: `Aravindh located physical equipment in workshop, uploaded verification photo, and accepted repair. Senthil: Please conduct teardown, fit 30% or 50% scope, and send to MD.`,
      priority: "urgent",
    });

    setStatusMessage(`✓ Verification photo saved & job handed to Senthil Kumar! Moved to Stage 3: Repair Workbench.`);
    setActiveTab("repair");
    setSelectedJobId(String(job.id || job.jobNo));
    setTimeout(() => setStatusMessage(""), 5000);
  };

  // ACTION 2B: Senthil Accepts Incoming Product into Workshop Bay
  const handleSenthilAcceptProduct = (job: ServiceJob) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: "UNDER_REPAIR_SENTHIL" as WorkflowStage }),
      stage: "UNDER_REPAIR_SENTHIL" as WorkflowStage,
      senthilAcceptedAt: new Date().toISOString(),
      senthilAcceptedBy: "Senthil Kumar (Repair Engineer)",
      mechanicAssigned: "Senthil Kumar (Repair Engineer)",
    };

    const updatedJob: ServiceJob = {
      ...job,
      status: "REPAIRING",
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    saveJobRecord(updatedJob);
    setStatusMessage(`✓ Equipment accepted & confirmed received in workshop by Senthil Kumar!`);
    setTimeout(() => setStatusMessage(""), 5000);
  };

  // ACTION 2C: Senthil Starts Repair Work & Tracks Start Time
  const handleSenthilStartRepair = (job: ServiceJob) => {
    const nowIso = new Date().toISOString();
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: "UNDER_REPAIR_SENTHIL" as WorkflowStage }),
      stage: "UNDER_REPAIR_SENTHIL" as WorkflowStage,
      senthilAcceptedAt: job.workflow?.senthilAcceptedAt || nowIso,
      senthilAcceptedBy: job.workflow?.senthilAcceptedBy || "Senthil Kumar (Repair Engineer)",
      repairStartedAt: nowIso,
    };

    const updatedJob: ServiceJob = {
      ...job,
      status: "REPAIRING",
      workflow: updatedWorkflow,
      updatedAt: nowIso,
    };

    saveJobRecord(updatedJob);
    setStatusMessage(`⚡ Senthil started repair work on ${job.products?.[0]?.productName || "Equipment"}! Tracking repair time.`);
    setTimeout(() => setStatusMessage(""), 5000);
  };

  // ACTION 3: Senthil Fit 30%/50% Scope & Send to MD
  const handleSenthilSubmitRepair = (job: ServiceJob) => {
    const scopeLabel = repairScope === "MAXIMUM_50" ? "50% Max Overhaul" : "30% Min Overhaul";
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: "INTAKE_RECEIVED" as WorkflowStage }),
      stage: "AWAITING_MD_APPROVAL" as WorkflowStage,
      mechanicAssigned: "Senthil Kumar (Lead Service Mechanic)",
      mechanicAssessment: repairNotes,
      mechanicEstimateType: repairScope,
      repairCompletedAt: new Date().toISOString(),
      repairProofPhotos: repairPhotos,
      repairProofVideo: repairVideo,
      senthilFittedScopeAt: new Date().toISOString(),
    };

    const updatedProducts = [...job.products];
    if (updatedProducts[0]) {
      updatedProducts[0] = {
        ...updatedProducts[0],
        repairCategory: repairScope,
        repairWork: repairNotes,
        status: "READY",
      };
    }

    const updatedJob: ServiceJob = {
      ...job,
      status: "APPROVAL_PENDING",
      products: updatedProducts,
      proofPhotos: repairPhotos,
      proofVideo: repairVideo,
      signoff: {
        ...job.signoff,
        repairedBy: "Senthil Kumar (Lead Mechanic)",
      },
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    saveJobRecord(updatedJob);

    const pName = job.products?.[0]?.productName || "Equipment";
    // Dispatches strictly to MD for commercial signoff
    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || "Customer",
      equipmentName: pName,
      fromUser: "Senthil Kumar",
      stage: "AWAITING_MD_APPROVAL",
      targetRole: "MD",
      targetNames: ["MD", "Managing Director", "Director", "md@nunesinstruments.com", "admin"],
      title: `⭐ Senthil Fitted ${scopeLabel} for Job #${job.jobNo} — MD Approval Needed`,
      message: `Senthil Kumar completed teardown, fitted ${scopeLabel}, and attached proof media. MD: Please review and sign off.`,
      priority: "urgent",
    });

    setStatusMessage(`✓ Senthil Kumar fitted ${scopeLabel} and sent to MD for approval!`);
    setActiveTab("completed");
    setTimeout(() => setStatusMessage(""), 5000);
  };

  // ACTION 4: Aravindh Fit 30%/50% Scope & Send to Azhalaku Priya
  const handleAravindhSendToPriya = (job: ServiceJob) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: "INTAKE_RECEIVED" as WorkflowStage }),
      stage: "AWAITING_PRIYA_PRICING" as WorkflowStage,
      mechanicAssigned: "Aravindh",
      mechanicAssessment: repairNotes,
      mechanicEstimateType: repairScope,
      repairCompletedAt: new Date().toISOString(),
      repairProofPhotos: repairPhotos,
      repairProofVideo: repairVideo,
      aravindhScopeSentToPriyaAt: new Date().toISOString(),
    };

    const updatedProducts = [...job.products];
    if (updatedProducts[0]) {
      updatedProducts[0] = {
        ...updatedProducts[0],
        repairCategory: repairScope,
        repairWork: repairNotes,
        status: "READY",
      };
    }

    const updatedJob: ServiceJob = {
      ...job,
      status: "ESTIMATE_PENDING",
      products: updatedProducts,
      proofPhotos: repairPhotos,
      proofVideo: repairVideo,
      signoff: {
        ...job.signoff,
        repairedBy: "Aravindh (Service & Repair)",
      },
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    saveJobRecord(updatedJob);

    const prodName = job.products?.[0]?.productName || "Equipment";
    const prodModel = job.products?.[0]?.makeModel || "";
    const prodSerial = job.products?.[0]?.serialNo || "";
    const cPhone = job.customer?.phone || "";
    const cCity = job.customer?.city || "";
    const scopeLabel = repairScope === "MINIMUM_30" ? "30% Min Repair" : repairScope === "MAXIMUM_50" ? "50% Max Overhaul" : "Custom Scope";

    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || "Customer",
      customerPhone: cPhone,
      customerCity: cCity,
      equipmentName: prodName,
      equipmentModel: prodModel,
      serialNo: prodSerial,
      scope: scopeLabel,
      fromUser: "Aravindh",
      stage: "AWAITING_PRIYA_PRICING",
      targetRole: "PRIYA",
      targetNames: ["Azhalaku Priya", "azhalaku", "priya", "priya@nunesinstruments.com", "azhalaku@nunesinstruments.com"],
      title: `⚡ Aravindh Set ${scopeLabel} for Job #${job.jobNo} — Priya Enter Price`,
      message: `Job #${job.jobNo} (${prodName}): Aravindh fitted ${scopeLabel}. Notes: "${repairNotes}". Proof media attached. Azhalaku Priya: Please enter pricing and submit to MD.`,
      priority: "urgent",
    });

    setStatusMessage(`✓ Scope (${scopeLabel}) saved and dispatched to Azhalaku Priya with all product details! Priya will enter pricing.`);
    setActiveTab("completed");
    setTimeout(() => setStatusMessage(""), 5500);
  };

  // ACTION 4: Direct 1-Click MD Executive Price Approval on Workshop
  const handleMdApproveOnWorkshop = (job: ServiceJob) => {
    const quotedAmount = Number(
      job.workflow?.priyaTotalQuotationAmount || job.totals?.totalEstimate || 0
    );

    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: "PRICE_APPROVED_BY_MD" as WorkflowStage }),
      stage: "PRICE_APPROVED_BY_MD" as WorkflowStage,
      approvedByMd: true,
      mdApprovedPrice: quotedAmount,
      mdApprovedAt: new Date().toISOString(),
      mdApprovedBy: "MD (Managing Director)",
    };

    const updatedJob: ServiceJob = {
      ...job,
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    saveJobRecord(updatedJob);
    setStatusMessage(`✅ MD Approved ₹${quotedAmount.toLocaleString("en-IN")} for Job #${job.jobNo}! Alert sent to Priya.`);

    // Dispatch workflow alert back to Priya
    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || "Customer",
      customerPhone: job.customer?.phone || "",
      customerCity: job.customer?.city || "Coimbatore",
      equipmentName: job.products?.[0]?.productName || "Equipment",
      equipmentModel: job.products?.[0]?.makeModel || "",
      serialNo: job.products?.[0]?.serialNo || "",
      fromUser: "MD (Managing Director)",
      stage: "PRICE_APPROVED_BY_MD",
      targetRole: "PRIYA",
      targetNames: [
        "Azhalaku Priya",
        "azhalaku",
        "priya",
        "priya@nunesinstruments.com",
        "azhalaku@nunesinstruments.com",
      ],
      title: `✅ MD Approved ₹${quotedAmount.toLocaleString("en-IN")} for Job #${job.jobNo}!`,
      message: `MD approved quotation price ₹${quotedAmount.toLocaleString("en-IN")} directly from Workshop Station. Azhalaku Priya: Please fill courier/delivery details and send quotation to customer.`,
      amount: quotedAmount,
      priority: "urgent",
    });
    setTimeout(() => setStatusMessage(""), 6000);
  };

  // Photo uploader helper
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "verification" | "repair") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (target === "verification") {
        setVerificationPhoto(dataUrl);
      } else {
        setRepairPhotos((prev) => [...prev, dataUrl]);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="page" style={{ padding: "20px 24px", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Top Identity Header */}
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" }}>
            Workshop
          </h1>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => { void loadJobs(true); }}
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#334155",
              padding: "7px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ↻ Refresh Queue
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div
          style={{
            background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
            border: "1.5px solid #86efac",
            borderRadius: "12px",
            padding: "12px 18px",
            marginBottom: "16px",
            color: "#065f46",
            fontSize: "13px",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 4px 14px rgba(5, 150, 105, 0.12)",
          }}
        >
          <CheckCircle2 size={18} color="#059669" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Role-Specific Workshop Station Tabs: Only MD & Admin can see all stages; Senthil only sees Repair; Aravindh sees Verification & Pickups */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1.5px solid #e2e8f0",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {/* Verification Tab (Aravindh & MD/Admin only) */}
        {(isAravindh || isAdminOrMd) && (
          <button
            type="button"
            onClick={() => setActiveTab("verification")}
            style={{
              padding: "10px 16px",
              border: "none",
              borderBottom: activeTab === "verification" ? "3px solid #7c3aed" : "3px solid transparent",
              background: "transparent",
              color: activeTab === "verification" ? "#6d28d9" : "#64748b",
              fontWeight: activeTab === "verification" ? 900 : 700,
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "7px",
            }}
          >
            <Camera size={15} />
            <span>Physical Verification ({verificationQueue.length})</span>
          </button>
        )}

        {/* Branch Pickups Tab (Aravindh & MD/Admin only) */}
        {(isAravindh || isAdminOrMd) && (
          <button
            type="button"
            onClick={() => setActiveTab("pickups")}
            style={{
              padding: "10px 16px",
              border: "none",
              borderBottom: activeTab === "pickups" ? "3px solid #b45309" : "3px solid transparent",
              background: "transparent",
              color: activeTab === "pickups" ? "#b45309" : "#64748b",
              fontWeight: activeTab === "pickups" ? 900 : 700,
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "7px",
            }}
          >
            <Truck size={15} />
            <span>Branch Pickups ({branchPickups.length})</span>
          </button>
        )}

        {/* Active Repairs Tab (Senthil, Aravindh & MD/Admin) */}
        <button
          type="button"
          onClick={() => setActiveTab("repair")}
          style={{
            padding: "10px 16px",
            border: "none",
            borderBottom: activeTab === "repair" ? "3px solid #059669" : "3px solid transparent",
            background: "transparent",
            color: activeTab === "repair" ? "#047857" : "#64748b",
            fontWeight: activeTab === "repair" ? 900 : 700,
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "7px",
          }}
        >
          <Wrench size={15} />
          <span>Repairs &amp; Scope ({repairQueue.length})</span>
        </button>

        {/* Completed Dispatches Tab (MD & Admin only) */}
        {isAdminOrMd && (
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            style={{
              padding: "10px 16px",
              border: "none",
              borderBottom: activeTab === "completed" ? "3px solid #0891b2" : "3px solid transparent",
              background: "transparent",
              color: activeTab === "completed" ? "#0e7490" : "#64748b",
              fontWeight: activeTab === "completed" ? 900 : 700,
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "7px",
            }}
          >
            <CheckCircle2 size={15} />
            <span>Completed ({completedQueue.length})</span>
          </button>
        )}
      </div>

      {/* Mobile-Only Queue vs Workbench Viewport Switcher */}
      <div
        className="workshop-mobile-switcher"
        style={{
          gap: "8px",
          marginBottom: "14px",
        }}
      >
        <button
          type="button"
          onClick={() => setMobileView("queue")}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "10px",
            border: mobileView === "queue" ? "2px solid #0f766e" : "1.5px solid #cbd5e1",
            background: mobileView === "queue" ? "#0f766e" : "#ffffff",
            color: mobileView === "queue" ? "#ffffff" : "#475569",
            fontWeight: 800,
            fontSize: "12.5px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <Smartphone size={14} />
          <span>Queue ({activeTab === "repair" ? repairQueue.length : activeTab === "verification" ? verificationQueue.length : activeTab === "pickups" ? branchPickups.length : activeTab === "pending" ? pendingQueue.length : activeTab === "in_process" ? inProcessQueue.length : completedQueue.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileView("workbench")}
          style={{
            flex: 1.2,
            padding: "10px",
            borderRadius: "10px",
            border: mobileView === "workbench" ? "2px solid #0f766e" : "1.5px solid #cbd5e1",
            background: mobileView === "workbench" ? "#0f766e" : "#ffffff",
            color: mobileView === "workbench" ? "#ffffff" : "#475569",
            fontWeight: 800,
            fontSize: "12.5px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <Wrench size={14} />
          <span>Workbench {activeJob ? `(#${activeJob.jobNo || activeJob.id})` : ""}</span>
        </button>
      </div>

      {/* Main Layout: Queue List (Left) + Action Workbench (Right) */}
      <div className="workshop-main-layout" style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px", alignItems: "start" }}>
        {/* Left Column: Job Queue Cards */}
        <div className={`workshop-queue-col ${mobileView === "workbench" ? "mobile-hide" : ""}`} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "12px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {activeTab === "pickups" && `Branch Transfer Queue (${branchPickups.length})`}
            {activeTab === "verification" && `Workshop Verification Queue (${verificationQueue.length})`}
            {activeTab === "repair" && `Ongoing Repairing Products (${repairQueue.length})`}
            {activeTab === "completed" && `Completed Products (${completedQueue.length})`}
            {activeTab === "pending" && `Pending MD Approvals & Signoffs (${pendingQueue.length})`}
            {activeTab === "in_process" && `In-Process Workflow Queue (${inProcessQueue.length})`}
          </div>

          {/* Queue List Items with Emil Kowalski Fluid Tactile Feel */}
          {(() => {
            const currentList =
              activeTab === "pickups"
                ? branchPickups
                : activeTab === "repair"
                ? repairQueue
                : activeTab === "completed"
                ? completedQueue
                : activeTab === "pending"
                ? pendingQueue
                : activeTab === "in_process"
                ? inProcessQueue
                : verificationQueue;

            if (currentList.length === 0) {
              return (
                <div style={{ padding: "30px 16px", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1", color: "#64748b", fontSize: "12.5px" }}>
                  {activeTab === "pickups" && "✓ No pending pickups. All branch drop-offs have arrived at Main Office."}
                  {activeTab === "repair" && "✓ No units currently in active repair."}
                  {activeTab === "completed" && "No completed jobs in this queue."}
                  {activeTab === "pending" && "✓ No pending MD approvals."}
                  {activeTab === "in_process" && "✓ No jobs in process."}
                  {activeTab === "verification" && "✓ No incoming units waiting for physical verification."}
                </div>
              );
            }

            return currentList.map((j) => {
              const currentId = String(j.id || "").toLowerCase();
              const currentJobNo = String(j.jobNo || "").toLowerCase();
              const targetActive = String(activeJob?.id || activeJob?.jobNo || "").toLowerCase();
              const targetSelected = String(selectedJobId || "").toLowerCase();

              const isSelected = Boolean(
                (targetActive && (targetActive === currentId || targetActive === currentJobNo)) ||
                (targetSelected && (targetSelected === currentId || targetSelected === currentJobNo))
              );

              const productName =
                j.products?.[0]?.productName ||
                j.products?.[0]?.makeModel ||
                (j.products?.[0]?.complaint ? `Issue: ${j.products[0].complaint}` : "") ||
                j.notes ||
                "Service Equipment";

              const hasPhoto = Boolean(j.workflow?.aravindhProductPhoto || (j.proofPhotos && j.proofPhotos.length > 0));

              let badgeText = "Needs Photo";
              let badgeBg = "#ede9fe";
              let badgeColor = "#6d28d9";

              if (activeTab === "pickups") {
                badgeText = "Branch Drop";
                badgeBg = "#fef3c7";
                badgeColor = "#92400e";
              } else if (activeTab === "repair") {
                badgeText = "In Repair";
                badgeBg = "#dcfce7";
                badgeColor = "#15803d";
              } else if (activeTab === "completed") {
                badgeText = j.workflow?.stage === "JOB_COMPLETED" || j.status === "READY" ? "Delivered / Ready" : "Pricing / MD";
                badgeBg = "#cffafe";
                badgeColor = "#0e7490";
              } else if (activeTab === "pending") {
                badgeText = "Needs Approval";
                badgeBg = "#fef3c7";
                badgeColor = "#92400e";
              } else if (activeTab === "verification") {
                if (hasPhoto) {
                  badgeText = "✓ Photo Verified";
                  badgeBg = "#dcfce7";
                  badgeColor = "#15803d";
                } else {
                  badgeText = "Needs Photo";
                  badgeBg = "#ede9fe";
                  badgeColor = "#6d28d9";
                }
              } else {
                badgeText = String(j.workflow?.stage || j.status || "In Process").replace(/_/g, " ");
                badgeBg = "#f1f5f9";
                badgeColor = "#334155";
              }

              const borderClr = isSelected
                ? activeTab === "repair" ? "#059669" : activeTab === "pickups" ? "#f59e0b" : activeTab === "completed" ? "#0891b2" : "#7c3aed"
                : "#e2e8f0";
              const bgClr = isSelected
                ? activeTab === "repair" ? "#f0fdf4" : activeTab === "pickups" ? "#fffbeb" : activeTab === "completed" ? "#ecfeff" : "#f5f3ff"
                : "#ffffff";

              return (
                <div
                  key={j.jobNo || j.id}
                  onClick={() => { setSelectedJobId(String(j.id || j.jobNo)); setMobileView("workbench"); }}
                  style={{
                    background: bgClr,
                    border: `2px solid ${borderClr}`,
                    borderRadius: "12px",
                    padding: "12px 14px",
                    cursor: "pointer",
                    boxShadow: isSelected ? "0 4px 12px rgba(0,0,0,0.06)" : "0 2px 6px rgba(0,0,0,0.03)",
                    transition: "all 0.18s cubic-bezier(0.23, 1, 0.32, 1)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b style={{ fontSize: "13px", color: "#0f172a" }}>Job #{j.jobNo || j.id}</b>
                    <span style={{ fontSize: "10.5px", background: badgeBg, color: badgeColor, padding: "2px 7px", borderRadius: "5px", fontWeight: 800 }}>
                      {badgeText}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#334155", marginTop: "3px" }}>
                    {productName}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    Customer: {j.customer?.name || "Customer"}
                    {j.products?.[0]?.makeModel ? ` · ${j.products[0].makeModel}` : ""}
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* Right Column: Active Action Workbench */}
        <div className={`workshop-workbench-col ${mobileView === "queue" ? "mobile-hide" : ""}`}>
          {!activeJob ? (
            <div style={{ padding: "60px 20px", textAlign: "center", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <Package size={36} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b", margin: 0 }}>
                No Equipment Selected
              </h3>
              <p style={{ fontSize: "12.5px", color: "#64748b", margin: "4px 0 0" }}>
                Select an equipment card from the queue to view details and perform actions.
              </p>
            </div>
          ) : (
            <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 4px 18px rgba(15, 23, 42, 0.05)" }}>
              {/* Mobile Back Button to Queue */}
              <div className="workshop-mobile-back-btn" style={{ marginBottom: "14px" }}>
                <button
                  type="button"
                  onClick={() => setMobileView("queue")}
                  style={{
                    background: "#0f766e",
                    border: "none",
                    borderRadius: "8px",
                    padding: "9px 16px",
                    fontSize: "12.5px",
                    fontWeight: 800,
                    color: "#ffffff",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 2px 6px rgba(15,118,110,0.2)",
                  }}
                >
                  <span>← Back to Job Queue</span>
                </button>
              </div>

              {/* Job Header & Equipment Info */}
              <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                      Service Record #{activeJob.jobNo || activeJob.id}
                    </span>
                    <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a", margin: "2px 0 0" }}>
                      {activeJob.products?.[0]?.productName || "Equipment Under Service"}
                    </h2>
                  </div>

                  <span
                    style={{
                      background: "#f1f5f9",
                      color: "#334155",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11.5px",
                      fontWeight: 800,
                    }}
                  >
                    {activeJob.workflow?.stage || "INTAKE_RECEIVED"}
                  </span>
                </div>

                {/* Equipment Specs Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginTop: "14px" }}>
                  <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <small style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Customer</small>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", marginTop: "1px" }}>
                      {activeJob.customer?.name || "Customer"}
                    </div>
                    {(activeJob.customer?.phone || activeJob.customer?.city) && (
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        {activeJob.customer?.phone || ""} {activeJob.customer?.city ? `• ${activeJob.customer.city}` : ""}
                      </div>
                    )}
                  </div>

                  <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <small style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Make &amp; Model</small>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#334155", marginTop: "1px" }}>
                      {activeJob.products?.[0]?.makeModel || "Standard"}
                    </div>
                  </div>

                  <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <small style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Serial Number</small>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#047857", marginTop: "1px", fontFamily: "monospace" }}>
                      {activeJob.products?.[0]?.serialNo || "N/A"}
                    </div>
                  </div>

                  <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <small style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Intake Location</small>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: activeJob.workflow?.isBranchDelivery ? "#b45309" : "#0369a1", marginTop: "1px" }}>
                      {activeJob.workflow?.isBranchDelivery ? "Branch Office (Suganya/Radha)" : "Main Office Direct"}
                    </div>
                  </div>

                  {activeJob.workflow?.senthilAcceptedAt && (
                    <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <small style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Workshop Receipt</small>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#0369a1", marginTop: "1px" }}>
                        ✓ Received in Bay
                      </div>
                      <div style={{ fontSize: "10.5px", color: "#64748b", marginTop: "2px" }}>
                        {new Date(activeJob.workflow.senthilAcceptedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  )}

                  {activeJob.workflow?.repairStartedAt && (
                    <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <small style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Repair Time</small>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#059669", marginTop: "1px" }}>
                        ⏱️ {activeJob.workflow.repairDurationMinutes ? `${activeJob.workflow.repairDurationMinutes} mins` : "Repairing Now"}
                      </div>
                      <div style={{ fontSize: "10.5px", color: "#64748b", marginTop: "2px" }}>
                        Started: {new Date(activeJob.workflow.repairStartedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer Reported Complaint */}
                <div style={{ marginTop: "12px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "8px", padding: "10px 14px" }}>
                  <small style={{ fontSize: "10.5px", color: "#dc2626", fontWeight: 800, textTransform: "uppercase" }}>
                    Customer Reported Fault / Complaint
                  </small>
                  <p style={{ margin: "3px 0 0", fontSize: "12.5px", color: "#1e293b", fontWeight: 600 }}>
                    {activeJob.products?.[0]?.complaint || "General servicing and physical inspection requested."}
                  </p>
                </div>
              </div>

              {/* ATTACHED OLDER FORMS & FILES ARCHIVE */}
              {activeJob.attachments && activeJob.attachments.length > 0 && (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1.5px solid #86efac",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", fontWeight: 800, fontSize: "13px", marginBottom: "8px" }}>
                    <Paperclip size={15} />
                    <span>Attached Older Forms &amp; Files ({activeJob.attachments.length})</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {activeJob.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.storedName}
                        download={att.fileName}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#ffffff",
                          border: "1px solid #bbf7d0",
                          borderRadius: "8px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#15803d",
                          textDecoration: "none",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                        }}
                      >
                        <FileText size={13} />
                        <span style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.fileName}</span>
                        <Download size={12} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* ACTION 1: Branch Pickup Confirmation (if from Suganya/Radha branch) */}
              {activeJob.workflow?.isBranchDelivery && !activeJob.workflow?.aravindhBranchPickupDone && (
                <div
                  style={{
                    background: "#fffbeb",
                    border: "2px solid #fcd34d",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#b45309", fontWeight: 900, fontSize: "13.5px" }}>
                      <Truck size={17} />
                      <span>Branch Office Equipment Transfer</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleConfirmBranchPickup(activeJob)}
                      style={{
                        background: "linear-gradient(135deg, #b45309 0%, #92400e 100%)",
                        color: "#ffffff",
                        border: "none",
                        padding: "9px 18px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 900,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 2px 8px rgba(180, 83, 9, 0.3)",
                      }}
                    >
                      <Check size={14} strokeWidth={3} /> Confirm Branch Pickup
                    </button>
                  </div>
                </div>
              )}

              {/* ACTION 2: Real-Time Physical Verification Photo & Accept Process */}
              {activeTab === "verification" && (
                <div style={{ background: "#f5f3ff", border: "1.5px solid #ddd6fe", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <Camera size={18} color="#7c3aed" />
                    <span style={{ fontSize: "14px", fontWeight: 850, color: "#5b21b6" }}>
                      Physical Verification &amp; Photo Inspection
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: "12px", marginBottom: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                        Inspection &amp; Physical Condition Notes:
                      </label>
                      <textarea
                        rows={3}
                        value={inspectionNotes}
                        onChange={(e) => setInspectionNotes(e.target.value)}
                        placeholder="Detail external scratches, serial plate condition, missing accessories..."
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                        Product Photo:
                      </label>
                      {verificationPhoto ? (
                        <div style={{ position: "relative", width: "100%", height: "70px", borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
                          <img src={verificationPhoto} alt="Product" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <button
                            type="button"
                            onClick={() => setVerificationPhoto("")}
                            style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: "18px", height: "18px", cursor: "pointer", display: "grid", placeItems: "center" }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                          <label style={{ flex: 1, height: "64px", border: "1.5px dashed #7c3aed", borderRadius: "8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#f5f3ff" }}>
                            <Camera size={18} color="#7c3aed" />
                            <span style={{ fontSize: "11px", color: "#6d28d9", fontWeight: 800, marginTop: "2px" }}>Camera</span>
                            <input type="file" accept="image/*" capture="environment" onChange={(e) => handlePhotoUpload(e, "verification")} style={{ display: "none" }} />
                          </label>
                          <label style={{ flex: 1, height: "64px", border: "1.5px dashed #cbd5e1", borderRadius: "8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#ffffff" }}>
                            <Upload size={18} color="#64748b" />
                            <span style={{ fontSize: "11px", color: "#475569", fontWeight: 800, marginTop: "2px" }}>Upload</span>
                            <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, "verification")} style={{ display: "none" }} />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => handleAravindhAccept(activeJob)}
                      style={{
                        background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                        color: "#ffffff",
                        border: "none",
                        padding: "9px 20px",
                        borderRadius: "8px",
                        fontSize: "12.5px",
                        fontWeight: 900,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 2px 8px rgba(124, 58, 237, 0.3)",
                      }}
                    >
                      <Check size={15} strokeWidth={3} /> Confirm &amp; Accept Repair ➔
                    </button>
                  </div>
                </div>
              )}

              {/* ACTION 3: Technical Repair Workbench & 30% / 50% Scope Setting */}
              {(activeTab === "repair" || activeJob.workflow?.stage === "UNDER_REPAIR_ARAVINDH" || activeJob.workflow?.stage === "UNDER_REPAIR_SENTHIL") && (
                <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Wrench size={18} color="#059669" />
                      <span style={{ fontSize: "14px", fontWeight: 850, color: "#065f46" }}>
                        Repair &amp; Service Scope
                      </span>
                    </div>
                  </div>

                  {/* Senthil Physical Receipt Confirmation & Repair Start Status */}
                  {isSenthil && (
                    <div style={{ marginBottom: "16px" }}>
                      {!activeJob.workflow?.senthilAcceptedAt ? (
                        <div style={{ background: "#fffbeb", border: "2px solid #f59e0b", borderRadius: "12px", padding: "14px 16px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#b45309", fontWeight: 900, fontSize: "13.5px" }}>
                              <Package size={17} />
                              <span>Incoming Instrument Receipt</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSenthilAcceptProduct(activeJob)}
                              style={{
                                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                color: "#ffffff",
                                border: "none",
                                padding: "9px 18px",
                                borderRadius: "8px",
                                fontSize: "12.5px",
                                fontWeight: 900,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                boxShadow: "0 2px 8px rgba(217, 119, 6, 0.3)",
                              }}
                            >
                              <Check size={15} strokeWidth={3} />
                              <span>Confirm Received</span>
                            </button>
                          </div>
                        </div>
                      ) : !activeJob.workflow?.repairStartedAt ? (
                        <div style={{ background: "#eff6ff", border: "2px solid #3b82f6", borderRadius: "12px", padding: "14px 16px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#1d4ed8", fontWeight: 900, fontSize: "13.5px" }}>
                              <Clock size={17} />
                              <span>Received in Workshop</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSenthilStartRepair(activeJob)}
                              style={{
                                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                                color: "#ffffff",
                                border: "none",
                                padding: "9px 18px",
                                borderRadius: "8px",
                                fontSize: "12.5px",
                                fontWeight: 900,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
                              }}
                            >
                              <Wrench size={15} />
                              <span>Start Repair</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ background: "#ecfdf5", border: "1.5px solid #6ee7b7", borderRadius: "10px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Clock size={17} color="#059669" />
                            <div>
                              <div style={{ fontSize: "12.5px", fontWeight: 850, color: "#065f46" }}>
                                ⚡ Repair Work in Progress • Tracking Repair Time
                              </div>
                              <div style={{ fontSize: "11px", color: "#047857", marginTop: "2px" }}>
                                Started: {new Date(activeJob.workflow.repairStartedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                {activeJob.workflow.repairDurationMinutes ? ` • Total Time: ${activeJob.workflow.repairDurationMinutes} mins` : ""}
                              </div>
                            </div>
                          </div>
                          <div style={{ background: "#ffffff", border: "1.5px solid #10b981", borderRadius: "8px", padding: "4px 10px", fontSize: "12px", fontWeight: 900, color: "#047857" }}>
                            ⏱️ {activeJob.workflow.repairDurationMinutes ? `${activeJob.workflow.repairDurationMinutes} mins logged` : "Active Work Session"}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 30% / 50% Scope Selector */}
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#166534", marginBottom: "6px" }}>
                      Service Scope:
                    </label>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => setRepairScope("MINIMUM_30")}
                        style={{
                          padding: "9px 16px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: 800,
                          cursor: "pointer",
                          border: repairScope === "MINIMUM_30" ? "2px solid #059669" : "1px solid #cbd5e1",
                          background: repairScope === "MINIMUM_30" ? "#dcfce7" : "#ffffff",
                          color: repairScope === "MINIMUM_30" ? "#14532d" : "#475569",
                          boxShadow: repairScope === "MINIMUM_30" ? "0 2px 8px rgba(5,150,105,0.2)" : "none",
                        }}
                      >
                        ✓ 30% Minimum Overhaul
                      </button>

                      <button
                        type="button"
                        onClick={() => setRepairScope("MAXIMUM_50")}
                        style={{
                          padding: "9px 16px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: 800,
                          cursor: "pointer",
                          border: repairScope === "MAXIMUM_50" ? "2px solid #d97706" : "1px solid #cbd5e1",
                          background: repairScope === "MAXIMUM_50" ? "#fef3c7" : "#ffffff",
                          color: repairScope === "MAXIMUM_50" ? "#92400e" : "#475569",
                          boxShadow: repairScope === "MAXIMUM_50" ? "0 2px 8px rgba(217,119,6,0.2)" : "none",
                        }}
                      >
                        ✓ 50% Maximum Overhaul
                      </button>
                    </div>
                  </div>

                  {/* Technical Repair Notes */}
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#166534", marginBottom: "4px" }}>
                      Repair Work Executed &amp; Diagnosis Notes:
                    </label>
                    <textarea
                      rows={3}
                      value={repairNotes}
                      onChange={(e) => setRepairNotes(e.target.value)}
                      placeholder="Detail sensor cleaning, replaced O-rings, calibration testing..."
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                    />
                  </div>

                  {/* Proof Photos & Video */}
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#166534", marginBottom: "6px" }}>
                      Repair Proof Media (Photos &amp; Video):
                    </label>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                      <label style={{ height: "44px", padding: "0 14px", border: "1.5px dashed #10b981", borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", background: "#ecfdf5", color: "#047857", fontSize: "12px", fontWeight: 800 }}>
                        <Camera size={16} color="#059669" />
                        <span>Camera</span>
                        <input type="file" accept="image/*" capture="environment" onChange={(e) => handlePhotoUpload(e, "repair")} style={{ display: "none" }} />
                      </label>

                      <label style={{ height: "44px", padding: "0 14px", border: "1.5px dashed #cbd5e1", borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", background: "#ffffff", color: "#475569", fontSize: "12px", fontWeight: 800 }}>
                        <Upload size={16} color="#475569" />
                        <span>Gallery</span>
                        <input type="file" accept="image/*" multiple onChange={(e) => handlePhotoUpload(e, "repair")} style={{ display: "none" }} />
                      </label>

                      {repairPhotos.map((photo, i) => (
                        <div key={i} style={{ position: "relative", width: "48px", height: "48px", borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
                          <img src={photo} alt="Proof" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <button
                            type="button"
                            onClick={() => setRepairPhotos((p) => p.filter((_, idx) => idx !== i))}
                            style={{ position: "absolute", top: "2px", right: "2px", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: "16px", height: "16px", cursor: "pointer", display: "grid", placeItems: "center" }}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    {isSenthil ? (
                      <button
                        type="button"
                        onClick={() => handleSenthilSubmitRepair(activeJob)}
                        style={{
                          background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                          color: "#ffffff",
                          border: "none",
                          padding: "10px 22px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: 900,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          boxShadow: "0 3px 12px rgba(5, 150, 105, 0.35)",
                        }}
                      >
                        <Check size={16} strokeWidth={3} />
                        <span>Submit Scope to MD ➔</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAravindhSendToPriya(activeJob)}
                        style={{
                          background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                          color: "#ffffff",
                          border: "none",
                          padding: "9px 20px",
                          borderRadius: "8px",
                          fontSize: "12.5px",
                          fontWeight: 900,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 2px 8px rgba(217, 119, 6, 0.3)",
                        }}
                      >
                        <Send size={14} /> Submit Scope &amp; Forward ➔
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Dedicated Completed Repair Summary Card (when viewing Completed Products or after repair is finished) */}
              {(activeTab === "completed" || activeJob.workflow?.repairCompletedAt || activeJob.workflow?.stage === "AWAITING_PRIYA_PRICING" || activeJob.workflow?.stage === "AWAITING_MD_APPROVAL" || activeJob.workflow?.stage === "PRICE_APPROVED_BY_MD" || activeJob.workflow?.stage === "READY_FOR_HANDOVER" || activeJob.workflow?.stage === "JOB_COMPLETED") && (
                <div
                  style={{
                    background: "linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)",
                    border: "2px solid #059669",
                    borderRadius: "14px",
                    padding: "18px 20px",
                    marginBottom: "18px",
                    boxShadow: "0 4px 18px rgba(5, 150, 105, 0.12)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#059669", color: "#ffffff", display: "grid", placeItems: "center" }}>
                        <CheckCircle2 size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: 900, color: "#065f46" }}>
                          ✓ Product Repair Completed
                        </div>
                        <div style={{ fontSize: "12px", color: "#047857", marginTop: "2px" }}>
                          Serviced by Senthil Kumar (Lead Repair Engineer) • Logged &amp; Verified
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "11px", fontWeight: 900, background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "8px", border: "1px solid #86efac" }}>
                        {activeJob.workflow?.mechanicEstimateType === "MAXIMUM_50" ? "⚡ 50% Maximum Overhaul" : "✓ 30% Minimum Overhaul"}
                      </span>
                      {activeJob.workflow?.repairDurationMinutes && (
                        <span style={{ fontSize: "11px", fontWeight: 900, background: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: "8px", border: "1px solid #7dd3fc" }}>
                          ⏱️ {activeJob.workflow.repairDurationMinutes} mins logged
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "14px" }}>
                    <div style={{ background: "#ffffff", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
                      <div style={{ fontSize: "10.5px", color: "#64748b", textTransform: "uppercase", fontWeight: 800 }}>Repaired Instrument</div>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                        {activeJob.products?.[0]?.productName || "Equipment"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        {activeJob.products?.[0]?.makeModel || "Standard Model"} {activeJob.products?.[0]?.serialNo ? `(S/N: ${activeJob.products[0].serialNo})` : ""}
                      </div>
                    </div>

                    <div style={{ background: "#ffffff", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
                      <div style={{ fontSize: "10.5px", color: "#64748b", textTransform: "uppercase", fontWeight: 800 }}>Timing Log</div>
                      <div style={{ fontSize: "12px", fontWeight: 800, color: "#047857", marginTop: "2px" }}>
                        {activeJob.workflow?.repairCompletedAt ? new Date(activeJob.workflow.repairCompletedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Completed"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        {activeJob.workflow?.repairStartedAt ? `Started: ${new Date(activeJob.workflow.repairStartedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Bench repair recorded"}
                      </div>
                    </div>

                    <div style={{ background: "#ffffff", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
                      <div style={{ fontSize: "10.5px", color: "#64748b", textTransform: "uppercase", fontWeight: 800 }}>Current Workflow Status</div>
                      <div style={{ fontSize: "12px", fontWeight: 800, color: "#0369a1", marginTop: "2px" }}>
                        {activeJob.workflow?.stage === "AWAITING_PRIYA_PRICING" && "⏳ With Azhalaku Priya (Pricing)"}
                        {activeJob.workflow?.stage === "AWAITING_MD_APPROVAL" && "⚡ With MD (Approval Gateway)"}
                        {activeJob.workflow?.stage === "PRICE_APPROVED_BY_MD" && "✅ MD Approved (Ready for Quote)"}
                        {activeJob.workflow?.stage === "READY_FOR_HANDOVER" && "📦 Ready for Delivery"}
                        {activeJob.workflow?.stage === "JOB_COMPLETED" && "🎉 Delivered to Customer"}
                        {!activeJob.workflow?.stage && "Completed in Workshop"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        {activeJob.workflow?.senthilScopeSentToPriyaAt ? `Sent to Priya: ${new Date(activeJob.workflow.senthilScopeSentToPriyaAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Forwarded from workshop"}
                      </div>
                    </div>
                  </div>

                  {/* Senthil Assessment Notes */}
                  {activeJob.workflow?.mechanicAssessment && (
                    <div style={{ background: "#ffffff", padding: "10px 14px", borderRadius: "10px", border: "1px solid #bbf7d0", marginBottom: "12px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 800, color: "#166534", marginBottom: "2px" }}>
                        🛠️ Mechanic Teardown &amp; Service Remarks:
                      </div>
                      <div style={{ fontSize: "12px", color: "#1e293b" }}>
                        {activeJob.workflow.mechanicAssessment}
                      </div>
                    </div>
                  )}

                  {/* Proof Photos & Video Thumbnails if present */}
                  {((activeJob.workflow?.repairProofPhotos && activeJob.workflow.repairProofPhotos.length > 0) || activeJob.workflow?.repairProofVideo) && (
                    <div style={{ background: "#ffffff", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
                      <div style={{ fontSize: "11px", fontWeight: 800, color: "#334155", marginBottom: "8px" }}>
                        📷 Attached Repair Proof Media ({activeJob.workflow?.repairProofPhotos?.length || 0} photos{activeJob.workflow?.repairProofVideo ? " + 1 video" : ""}):
                      </div>
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                        {activeJob.workflow?.repairProofPhotos?.map((p, idx) => (
                          <div key={idx} style={{ width: "70px", height: "70px", borderRadius: "8px", overflow: "hidden", border: "1.5px solid #10b981" }}>
                            <img src={p} alt={`Proof ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        ))}
                        {activeJob.workflow?.repairProofVideo && (
                          <div style={{ width: "110px", height: "70px", borderRadius: "8px", overflow: "hidden", border: "1.5px solid #8b5cf6" }}>
                            <video src={activeJob.workflow.repairProofVideo} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status Banner when with Priya / MD / Handover */}
              {activeJob.workflow?.stage === "AWAITING_PRIYA_PRICING" && (
                <div style={{ background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: "10px", padding: "12px 14px", color: "#0e7490", fontSize: "12px" }}>
                  ⏳ <b>Dispatched to Azhalaku Priya:</b> Aravindh fitted {activeJob.workflow?.mechanicEstimateType === "MAXIMUM_50" ? "50% Max Overhaul" : "30% Min Overhaul"}. Priya is preparing commercial service pricing to submit to MD.
                </div>
              )}

              {activeJob.workflow?.stage === "AWAITING_MD_APPROVAL" && (
                <div
                  style={{
                    background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                    border: "2px solid #f59e0b",
                    borderRadius: "12px",
                    padding: "16px 18px",
                    boxShadow: "0 4px 16px rgba(245, 158, 11, 0.18)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#b45309", fontWeight: 900, fontSize: "14px" }}>
                        <ShieldCheck size={18} />
                        <span>⚡ MD Approval Gateway — Commercial Pricing Signoff</span>
                      </div>
                      <div style={{ fontSize: "12.5px", color: "#78350f", marginTop: "4px" }}>
                        Azhalaku Priya submitted quotation for <b>{activeJob.products?.[0]?.productName || "Equipment"}</b>:{" "}
                        Service ₹{activeJob.workflow?.priyaRepairEstimate || 0} + Parts ₹{activeJob.workflow?.priyaSparePartsCost || 0} - Discount ₹{activeJob.workflow?.priyaDiscount || 0} + 18% GST ={" "}
                        <span style={{ fontSize: "14px", fontWeight: 900, color: "#b45309" }}>
                          ₹{Number(activeJob.workflow?.priyaTotalQuotationAmount || activeJob.totals?.totalEstimate || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => handleMdApproveOnWorkshop(activeJob)}
                        style={{
                          background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "10px 18px",
                          fontSize: "12.5px",
                          fontWeight: 850,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 3px 10px rgba(5, 150, 105, 0.35)",
                        }}
                      >
                        <Check size={15} strokeWidth={3} />
                        <span>✓ MD 1-Click Approve Price &amp; Alert Priya</span>
                      </button>

                      <Link
                        href={`/dashboard?job=${encodeURIComponent(String(activeJob.jobNo || activeJob.id))}`}
                        style={{
                          background: "#ffffff",
                          color: "#2563eb",
                          border: "1.5px solid #bfdbfe",
                          borderRadius: "8px",
                          padding: "9px 14px",
                          fontSize: "12px",
                          fontWeight: 800,
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <span>Executive Dashboard</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {activeJob.workflow?.stage === "PRICE_APPROVED_BY_MD" && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "12px 14px", color: "#166534", fontSize: "12px" }}>
                  ✅ <b>MD Price Approved:</b> MD confirmed ₹{activeJob.workflow?.mdApprovedPrice}. Priya is generating customer quotation and filling delivery mode (Courier / Direct Handover / Field Pick up).
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
