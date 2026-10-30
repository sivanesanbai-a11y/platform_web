'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wrench, Save, Printer, ArrowRight, ArrowLeft, Plus, 
  Trash2, Check, Calculator, Building, Phone, MapPin, User, DollarSign,
  FolderOpen, X, Search, Clock, CheckCircle2, FileCheck, Camera, Upload, Eye, Package,
  Video, Film, Play, LogOut, Send, Pencil,
  IndianRupee,
  Sparkles,
  Paperclip,
  FileText,
  Download,
} from 'lucide-react';
import type { ServiceJob, ServiceProduct, RepairCategory, JobStatus, ProofCategory, WorkflowStage, ServiceAttachment, JobWorkflowInfo } from '@/types/service-job';
import { blankJob, newProduct } from '@/lib/service-defaults';
import { clearAllOlderForms } from '@/lib/data';
import { cleanNumberString, parseCleanNumber } from '@/lib/utils';
import { PageTransition } from '@/components/animate-ui/components/page-transition';
import PaperJobCardPreview from './PaperJobCardPreview';
import ServiceQuotationModal from './ServiceQuotationModal';
import FormCompletionCelebration from './FormCompletionCelebration';
import ServiceWorkflowPipeline from './ServiceWorkflowPipeline';
import AddOlderFormModal from '@/components/AddOlderFormModal';
import { dispatchWorkflowAlert } from '@/lib/workflow-service';
import { syncFormToCloud, syncPullFromCloud } from '@/lib/sync';
import { getAllProducts, ProductProfile } from '@/lib/products';

const BENCHMARK_SERVICING: ServiceJob[] = [];

const BENCHMARK_VALUATIONS = [
  { name: 'Digital Pressure Gauge', model: 'DPG-0.05%', price: 28500, category: 'Pressure' },
  { name: 'Hydraulic Dead Weight Tester', model: 'DWT-700BAR', price: 145000, category: 'Pressure' },
  { name: 'Digital Vernier Caliper (0-200mm)', model: 'DVC-200', price: 8500, category: 'Calibration' },
  { name: 'Precision Digital Multimeter (6.5 Digit)', model: 'DMM-6500', price: 42000, category: 'Electrical' },
  { name: 'RTD / Thermocouple Calibrator', model: 'TC-RTD-PRO', price: 34000, category: 'Temperature' },
  { name: 'Vacuum Pirani Gauge Sensor', model: 'VAC-P100', price: 22500, category: 'Pressure' },
  { name: 'Torque Wrench / Torque Tester', model: 'TQ-500', price: 18500, category: 'Calibration' },
  { name: 'Dial Thickness & Depth Gauge', model: 'DTG-50', price: 6800, category: 'Calibration' },
];

const SERVICE_STEPS = [
  { key: 'customer', label: '1. Customer', title: 'Customer & Contact Details' },
  { key: 'products', label: '2. Product Details', title: 'Product Details' },
  { key: 'receipt', label: '3. Receipt', title: 'Intake & Material Receipt (MR)' },
  { key: 'dispatch', label: '4. Dispatch', title: 'Service Dispatch & Delivery Challan' },
  { key: 'payment', label: '5. Payment', title: 'Invoice & Payment Confirmation' },
  { key: 'signoff', label: '6. Signoff', title: 'Inspection & Engineering Signoff' },
] as const;

function normalizeJob(raw: any): ServiceJob {
  const initial = blankJob();
  const base = raw && typeof raw === 'object' ? raw : {};
  const randomSeq = Math.floor(1000 + Math.random() * 9000);
  const normalizedCust = { ...initial.customer, ...(base.customer || {}) };
  if (!normalizedCust.date) {
    normalizedCust.date = String(base.jobDate || base.createdAt || new Date().toISOString()).slice(0, 10);
  }
  const normalizedReceipt = { ...initial.receipt, ...(base.receipt || {}) };

  // If receipt mode is DIRECT (Walk-in), auto-populate customer name and contact phone if empty
  if ((!normalizedReceipt.mode || normalizedReceipt.mode === 'DIRECT') && !normalizedReceipt.personName) {
    const defaultCustName = normalizedCust.contactPerson || normalizedCust.name || '';
    if (defaultCustName) {
      normalizedReceipt.personName = defaultCustName;
      if (!normalizedReceipt.personPhone && normalizedCust.phone) {
        normalizedReceipt.personPhone = normalizedCust.phone;
      }
      if (!normalizedReceipt.reference) {
        normalizedReceipt.reference = `Direct Handover by ${defaultCustName} ${normalizedReceipt.personPhone ? `(Ph: ${normalizedReceipt.personPhone})` : ''}`.trim();
      }
    }
  }

  return {
    ...initial,
    ...base,
    id: base.id || `SJ-${randomSeq}`,
    jobNo: base.jobNo || base.id || `SJ-${randomSeq}`,
    customer: normalizedCust,
    receipt: normalizedReceipt,
    dispatch: { ...initial.dispatch, ...(base.dispatch || {}) },
    payment: { ...initial.payment, ...(base.payment || {}) },
    signoff: { ...initial.signoff, ...(base.signoff || {}) },
    totals: { ...initial.totals, ...(base.totals || {}) },
    products: Array.isArray(base.products) && base.products.length > 0 ? base.products : initial.products,
    proofImages: Array.isArray(base.proofImages) ? base.proofImages : [],
    proofVideo: base.proofVideo || '',
    proofNotes: base.proofNotes || '',
    attachments: Array.isArray(base.attachments) ? base.attachments : [],
    workflow: base.workflow || initial.workflow || {
      stage: 'INTAKE_RECEIVED',
      receivedAt: base.createdAt || new Date().toISOString()
    },
    createdAt: base.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export default function ServicingJobForm() {
  const [job, setJob] = useState<ServiceJob>(() => {
    return normalizeJob({});
  });

  const [activeStep, setActiveStep] = useState<number>(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [draftRestored, setDraftRestored] = useState<boolean>(false);

  const goToStep = (next: number) => {
    if (next === activeStep) return;
    setDirection(next > activeStep ? 'forward' : 'back');
    setActiveStep(next);
  };
  const router = useRouter();
  const [showPaper, setShowPaper] = useState(false);
  const [showQuotation, setShowQuotation] = useState(false);
  const [message, setMessage] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [draftSaveNotice, setDraftSaveNotice] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    recordNumber: string;
    title: string;
    subtitle: string;
  }>({
    recordNumber: '',
    title: 'Service Job Successfully Completed & Saved!',
    subtitle: 'The service job card has been completed and recorded to database & reports.'
  });

  const [showSavedModal, setShowSavedModal] = useState(false);
  const [savedJobsList, setSavedJobsList] = useState<ServiceJob[]>([]);
  const [searchSaved, setSearchSaved] = useState('');

  // Inline Form Rename states
  const [isEditingFormName, setIsEditingFormName] = useState(false);
  const [tempFormName, setTempFormName] = useState('');

  const handleSaveFormName = () => {
    const trimmed = tempFormName.trim();
    const updated: ServiceJob = {
      ...job,
      customFormName: trimmed || job.customer?.name || String(job.jobNo || job.id)
    };
    setJob(updated);
    saveJobRecordDirect(updated);
    setIsEditingFormName(false);
    setMessage(`✓ Form renamed to "${updated.customFormName}"`);
    setTimeout(() => setMessage(''), 3000);
  };

  // Attachment Category and Upload states
  const [selectedAttachmentCategory, setSelectedAttachmentCategory] = useState<ProofCategory>('OLDER_FORM');
  const [attachmentTagInput, setAttachmentTagInput] = useState<string>('Scanned Older Form');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, customCategory?: ProofCategory, customTag?: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const targetCategory = customCategory || selectedAttachmentCategory || 'OLDER_FORM';
    const targetTag = customTag || attachmentTagInput || 'Scanned Older Form';
    const newAttachments: ServiceAttachment[] = [];
    const readPromises: Promise<void>[] = [];

    Array.from(files).forEach((file) => {
      const promise = new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Data = (event.target?.result as string) || '';
          const ext = file.name.split('.').pop()?.toLowerCase() || '';
          const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);
          const isVid = ['mp4', 'mov', 'webm', 'mkv'].includes(ext);

          newAttachments.push({
            id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            fileName: file.name,
            storedName: base64Data,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            kind: isImg ? 'IMAGE' : isVid ? 'VIDEO' : 'OTHER',
            category: targetCategory,
            tag: targetTag,
            uploadedAt: new Date().toISOString()
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
      readPromises.push(promise);
    });

    Promise.all(readPromises).then(() => {
      setJob((prev) => {
        const updatedAtts = [...(prev.attachments || []), ...newAttachments];
        const updated = { ...prev, attachments: updatedAtts };
        saveJobRecordDirect(updated);
        return updated;
      });
      setMessage(`✓ Attached ${newAttachments.length} file(s) to Job #${job.jobNo}`);
      setTimeout(() => setMessage(''), 4000);
      e.target.value = '';
    });
  };

  const handleRemoveAttachment = (attId: string) => {
    setJob((prev) => {
      const updatedAtts = (prev.attachments || []).filter((a) => a.id !== attId);
      const updated = { ...prev, attachments: updatedAtts };
      saveJobRecordDirect(updated);
      return updated;
    });
    setMessage('✓ File removed from attachments.');
    setTimeout(() => setMessage(''), 3000);
  };

  // Product Catalog & Photo states
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogTargetIdx, setCatalogTargetIdx] = useState<number>(0);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);
  const [showAddOlderModal, setShowAddOlderModal] = useState<boolean>(false);

  // Active User Email for Multi-Role Collaborative Workflow
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('suganya@nunesinstruments.com');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('nunes_auth_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.email) setCurrentUserEmail(parsed.email);
      }
    } catch {}
  }, []);

  const [stageFilter, setStageFilter] = useState<'ALL' | 'INTAKE' | 'VERIFICATION' | 'REPAIR' | 'MD_APPROVAL' | 'DELIVERY'>('ALL');

  const isMainOfficeIntake = useMemo(() => {
    const u = (currentUserEmail || '').toLowerCase();
    return Boolean(u && (u.includes('admin') || u.includes('md') || u.includes('priya') || u.includes('azhalaku')));
  }, [currentUserEmail]);

  function saveJobRecordDirect(updated: ServiceJob) {
    try {
      const recordToSave: ServiceJob = {
        ...updated,
        createdBy: updated.createdBy || currentUserEmail,
        updatedAt: new Date().toISOString()
      };

      const hasCust = Boolean(recordToSave.customer?.name);
      const hasProd = Boolean(recordToSave.products && recordToSave.products.some(p => p.productName));
      if (hasCust && hasProd && (!recordToSave.workflow?.stage || recordToSave.workflow?.stage === 'INTAKE_RECEIVED') && !recordToSave.workflow?.aravindhAlertSentAt) {
        recordToSave.workflow = {
          ...(recordToSave.workflow || { stage: 'AWAITING_ARAVINDH_ACCEPT' as WorkflowStage }),
          stage: 'AWAITING_ARAVINDH_ACCEPT' as WorkflowStage,
          aravindhAlertSentAt: new Date().toISOString(),
          intakeStaffName: recordToSave.createdBy || currentUserEmail,
        };
        const pName = (recordToSave.products || [])[0]?.productName || 'Equipment';
        const pQty = (recordToSave.products || [])[0]?.qty || 1;
        dispatchWorkflowAlert({
          jobId: String(recordToSave.id || recordToSave.jobNo),
          jobNo: String(recordToSave.jobNo || recordToSave.id),
          customerName: recordToSave.customer?.name || 'Customer',
          equipmentName: `${pName} (Qty: ${pQty})`,
          fromUser: recordToSave.createdBy || currentUserEmail,
          stage: 'AWAITING_ARAVINDH_ACCEPT',
          targetRole: 'ARAVINDH',
          targetNames: ['Aravindh', 'aravindh', 'aravind'],
          title: `⚡ New Equipment Saved: ${pName} - Aravindh Please Accept`,
          message: `Job #${recordToSave.jobNo}: Logged and saved by ${recordToSave.createdBy || currentUserEmail}. Product: ${pName} (Qty: ${pQty}) for ${recordToSave.customer?.name || 'Customer'}. Aravindh: Please locate physical equipment in workshop, upload inspection photo, and click Accept Process.`,
          priority: 'urgent',
        });
      }

      const raw = localStorage.getItem('nunes:service_jobs');
      const list: ServiceJob[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(x => String(x.id) === String(recordToSave.id));
      if (idx >= 0) {
        list[idx] = recordToSave;
      } else {
        list.unshift(recordToSave);
      }
      localStorage.setItem('nunes:service_jobs', JSON.stringify(list));
      setSavedJobsList(list);
      void syncFormToCloud("servicing", String(recordToSave.jobNo || recordToSave.id), String(recordToSave.customer?.name || "Customer"), recordToSave);
    } catch {}
  }

  // --- COLLABORATIVE WORKFLOW ACTION HANDLERS ---
  const handleSendToAravindh = () => {
    const pName = (job.products || [])[0]?.productName || 'Equipment';
    const pQty = (job.products || [])[0]?.qty || 1;
    const pModel = (job.products || [])[0]?.makeModel ? ` (${(job.products || [])[0]?.makeModel})` : '';

    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      stage: 'AWAITING_ARAVINDH_ACCEPT' as WorkflowStage,
      intakeStaffName: currentUserEmail,
      receivedAt: job.workflow?.receivedAt || new Date().toISOString(),
      aravindhAlertSentAt: new Date().toISOString(),
    };

    const updatedJob: ServiceJob = {
      ...job,
      status: 'ESTIMATE_PENDING',
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    setJob(updatedJob);
    saveJobRecordDirect(updatedJob);

    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || 'Customer',
      equipmentName: `${pName}${pModel} (Qty: ${pQty})`,
      fromUser: currentUserEmail,
      stage: 'AWAITING_ARAVINDH_ACCEPT',
      targetRole: 'ARAVINDH',
      targetNames: ['Aravindh', 'aravindh', 'aravind'],
      title: `⚡ Equipment for Repair: ${pName} (Qty: ${pQty})`,
      message: `Job #${job.jobNo}: Logged by ${currentUserEmail}. Product: ${pName}${pModel} for ${job.customer?.name || 'Customer'}. Aravindh: Please locate unit in workshop, upload physical verification photo, and click Accept Process.`,
      priority: 'urgent',
    });

    setMessage(`✓ Alert dispatched to Aravindh with product details! Awaiting Aravindh's real-time inspection & acceptance.`);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleConfirmBranchPickup = () => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      aravindhBranchPickupDone: true,
      aravindhBranchPickupAt: new Date().toISOString(),
    };

    const updatedJob: ServiceJob = {
      ...job,
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    setJob(updatedJob);
    saveJobRecordDirect(updatedJob);

    const pName = (job.products || [])[0]?.productName || 'Equipment';
    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || 'Customer',
      equipmentName: pName,
      fromUser: 'Aravindh',
      stage: 'AWAITING_ARAVINDH_ACCEPT',
      targetRole: 'ALL',
      title: `🚚 Aravindh Picked Up Job #${job.jobNo} from Branch Office`,
      message: `Aravindh has picked up "${pName}" from the Branch Office (Suganya/Radha) and brought it safely to the Main Office workshop for repair.`,
      priority: 'normal',
    });

    setMessage(`✓ Branch pickup confirmed! Equipment is now at the Main Office workshop.`);
    setTimeout(() => setMessage(''), 4500);
  };

  const handleAravindhAccept = (photoUrl: string, notes?: string) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      stage: 'UNDER_REPAIR_ARAVINDH' as WorkflowStage,
      aravindhAcceptedBy: currentUserEmail,
      aravindhAcceptedAt: new Date().toISOString(),
      aravindhProductPhoto: photoUrl || job.workflow?.aravindhProductPhoto,
      aravindhInspectionNotes: notes || 'Product located in workshop and physical condition verified.',
      mechanicAssigned: 'Aravindh',
    };

    const updatedPhotos = photoUrl && !(job.proofPhotos || []).includes(photoUrl)
      ? [photoUrl, ...(job.proofPhotos || [])]
      : (job.proofPhotos || []);

    const updatedJob: ServiceJob = {
      ...job,
      status: 'REPAIRING',
      proofPhotos: updatedPhotos,
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    setJob(updatedJob);
    saveJobRecordDirect(updatedJob);

    const pName = (job.products || [])[0]?.productName || 'Equipment';
    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || 'Customer',
      equipmentName: pName,
      fromUser: 'Aravindh',
      stage: 'UNDER_REPAIR_ARAVINDH',
      targetRole: 'ALL',
      title: `🔧 Aravindh Accepted Job #${job.jobNo} (${pName})`,
      message: `Aravindh located physical equipment in workshop, uploaded verification photo, and accepted repair. Repair is now in progress.`,
      priority: 'normal',
    });

    setMessage(`✓ Aravindh accepted equipment! Physical inspection photo saved. Moved to Stage 3: Service Repair.`);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleAravindhSubmitScopeToPriya = (
    scope: 'MINIMUM_30' | 'MAXIMUM_50' | 'CUSTOM',
    notes: string,
    proofPhotos: string[],
    proofVideo?: string
  ) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      stage: 'AWAITING_PRIYA_PRICING' as WorkflowStage,
      mechanicAssigned: 'Aravindh',
      mechanicAssessment: notes,
      mechanicEstimateType: scope,
      repairCompletedAt: new Date().toISOString(),
      repairProofPhotos: proofPhotos,
      repairProofVideo: proofVideo,
      aravindhScopeSentToPriyaAt: new Date().toISOString(),
    };

    const updatedProducts = [...job.products];
    if (updatedProducts[0]) {
      updatedProducts[0] = {
        ...updatedProducts[0],
        repairCategory: scope,
        repairWork: notes,
        status: 'READY',
      };
    }

    const mergedPhotos = Array.from(new Set([...(job.proofPhotos || []), ...proofPhotos]));

    const updatedJob: ServiceJob = {
      ...job,
      status: 'ESTIMATE_PENDING',
      products: updatedProducts,
      proofPhotos: mergedPhotos,
      proofVideo: proofVideo || job.proofVideo,
      signoff: {
        ...job.signoff,
        repairedBy: 'Aravindh (Service & Repair)',
      },
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    setJob(updatedJob);
    saveJobRecordDirect(updatedJob);

    const prodName = (job.products || [])[0]?.productName || 'Equipment';
    const scopeLabel = scope === 'MINIMUM_30' ? '30% Min Repair' : scope === 'MAXIMUM_50' ? '50% Max Overhaul' : 'Custom Estimate';

    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || 'Customer',
      equipmentName: prodName,
      fromUser: 'Aravindh',
      stage: 'AWAITING_PRIYA_PRICING',
      targetRole: 'PRIYA',
      targetNames: ['Azhalaku Priya', 'azhalaku', 'priya', 'priya@nunesinstruments.com', 'azhalaku@nunesinstruments.com'],
      title: `⚡ Aravindh Set ${scopeLabel} for Job #${job.jobNo} — Priya Enter Price`,
      message: `Job #${job.jobNo} (${prodName}): Aravindh fitted ${scopeLabel}. Notes: "${notes}". Proof media attached. Azhalaku Priya: Please enter the service pricing and submit to MD for approval.`,
      priority: 'urgent',
    });

    setMessage(`✓ Scope (${scopeLabel}) saved & sent to Azhalaku Priya with all product details! Priya will enter pricing.`);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleSenthilSubmitRepairWork = (
    notes: string,
    proofPhotos: string[],
    proofVideo?: string
  ) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      stage: 'AWAITING_PRIYA_PRICING' as WorkflowStage,
      mechanicAssigned: 'Senthil Kumar (Lead Service Mechanic)',
      mechanicAssessment: notes,
      repairCompletedAt: new Date().toISOString(),
      repairProofPhotos: proofPhotos,
      repairProofVideo: proofVideo,
      senthilScopeSentToPriyaAt: new Date().toISOString(),
    };

    const updatedProducts = [...job.products];
    if (updatedProducts[0]) {
      updatedProducts[0] = {
        ...updatedProducts[0],
        repairWork: notes,
        status: 'READY',
      };
    }

    const mergedPhotos = Array.from(new Set([...(job.proofPhotos || []), ...proofPhotos]));

    const updatedJob: ServiceJob = {
      ...job,
      status: 'ESTIMATE_PENDING',
      products: updatedProducts,
      proofPhotos: mergedPhotos,
      proofVideo: proofVideo || job.proofVideo,
      signoff: {
        ...job.signoff,
        repairedBy: 'Senthil Kumar (Lead Service Mechanic)',
      },
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    setJob(updatedJob);
    saveJobRecordDirect(updatedJob);

    const prodName = (job.products || [])[0]?.productName || 'Equipment';

    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || 'Customer',
      equipmentName: prodName,
      fromUser: 'Senthil Kumar',
      stage: 'AWAITING_PRIYA_PRICING',
      targetRole: 'PRIYA',
      targetNames: ['Azhalaku Priya', 'azhalaku', 'priya', 'priya@nunesinstruments.com', 'azhalaku@nunesinstruments.com'],
      title: `⚡ Senthil Completed Repair on Job #${job.jobNo} — Priya Enter Price`,
      message: `Job #${job.jobNo} (${prodName}): Senthil completed repair work. Notes: "${notes}". Azhalaku Priya: Please enter commercial pricing and submit to MD for signoff.`,
      priority: 'urgent',
    });

    setMessage(`✓ Senthil repair submitted! Sent to Azhalaku Priya for commercial pricing.`);
    setTimeout(() => setMessage(''), 5000);
  };

  const handlePriyaSubmitPriceToMd = (
    serviceEstimate: number,
    sparePartsCost: number,
    discount: number,
    gstRate: number,
    totalAmount: number,
    notes?: string
  ) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      stage: 'AWAITING_MD_APPROVAL' as WorkflowStage,
      priyaPricingEnteredBy: currentUserEmail,
      priyaPricingEnteredAt: new Date().toISOString(),
      priyaServiceCharge: serviceEstimate,
      priyaSparePartsCost: sparePartsCost,
      priyaDiscountAmount: discount,
      priyaGstRate: gstRate,
      priyaTotalQuotationAmount: totalAmount,
      priyaPricingNotes: notes,
      priyaPriceSentToMdAt: new Date().toISOString(),
    };

    const updatedProducts = [...job.products];
    if (updatedProducts[0]) {
      updatedProducts[0] = {
        ...updatedProducts[0],
        repairEstimate: serviceEstimate + sparePartsCost,
      };
    }

    const updatedJob: ServiceJob = {
      ...job,
      status: 'ESTIMATE_PENDING',
      products: updatedProducts,
      totals: {
        ...(job.totals || {}),
        subtotal: serviceEstimate + sparePartsCost,
        discount: discount,
        gstRate: gstRate,
        gstAmount: Math.round(((serviceEstimate + sparePartsCost - discount) * (gstRate / 100))),
        totalEstimate: totalAmount,
      },
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    setJob(updatedJob);
    saveJobRecordDirect(updatedJob);

    const prodName = (job.products || [])[0]?.productName || 'Equipment';

    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || 'Customer',
      equipmentName: prodName,
      fromUser: 'Azhalaku Priya',
      stage: 'AWAITING_MD_APPROVAL',
      targetRole: 'MD',
      targetNames: ['MD', 'Managing Director', 'md@nunesinstruments.com'],
      title: `⚡ Price Approval Required: Job #${job.jobNo} (₹${totalAmount.toFixed(2)})`,
      message: `Azhalaku Priya submitted quotation price of ₹${totalAmount.toFixed(2)} for ${job.customer?.name || 'Customer'} (${prodName}). MD approval required.`,
      amount: totalAmount,
      priority: 'urgent',
    });

    setMessage(`✓ Quotation price ₹${totalAmount.toFixed(2)} submitted to Managing Director for approval!`);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleMdApprovePrice = (
    approvedPrice: number,
    discount?: number,
    mdNote?: string
  ) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      stage: 'PRICE_APPROVED_BY_MD' as WorkflowStage,
      isPriceApprovedByMd: true,
      customApprovedPrice: approvedPrice,
      mdApprovedAt: new Date().toISOString(),
      mdApprovedBy: currentUserEmail,
      mdApprovalNote: mdNote,
    };

    const updatedJob: ServiceJob = {
      ...job,
      status: 'APPROVED',
      totals: {
        ...(job.totals || {}),
        totalEstimate: approvedPrice,
      },
      signoff: {
        ...job.signoff,
        estimateConfirmedBy: currentUserEmail,
        estimateConfirmedAt: new Date().toISOString(),
      },
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    setJob(updatedJob);
    saveJobRecordDirect(updatedJob);

    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || 'Customer',
      equipmentName: (job.products || [])[0]?.productName || 'Equipment',
      fromUser: 'MD',
      stage: 'PRICE_APPROVED_BY_MD',
      targetRole: 'PRIYA',
      targetNames: ['Azhalaku Priya', 'azhalaku', 'priya', 'priya@nunesinstruments.com', 'azhalaku@nunesinstruments.com'],
      title: `✓ MD Approved Price: ₹${approvedPrice.toFixed(2)} for Job #${job.jobNo}`,
      message: `MD approved ₹${approvedPrice.toFixed(2)}! Priya: Send final quotation and prepare delivery.`,
      amount: approvedPrice,
      priority: 'success',
    });

    setMessage(`✓ MD successfully approved price ₹${approvedPrice.toFixed(2)}! Dispatched alert to Azhalaku Priya.`);
    setTimeout(() => setMessage(''), 5000);
  };

  const handlePriyaCompleteDeliveryAndQuotation = (
    handoverType: 'ARAVINDH_DIRECT_HANDOVER' | 'COURIER_DISPATCH' | 'WALK_IN_COLLECT',
    handoverDetail: string,
    courierName?: string,
    courierDocket?: string,
    completionNote?: string
  ) => {
    const updatedWorkflow: JobWorkflowInfo = {
      ...(job.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
      stage: 'JOB_COMPLETED' as WorkflowStage,
      priyaHandoverType: handoverType,
      priyaHandoverDetail: handoverDetail,
      priyaCourierName: courierName,
      priyaCourierDocket: courierDocket,
      priyaCompletionNote: completionNote,
      quotationSentToCustomerAt: new Date().toISOString(),
      finalHandoverCompletedAt: new Date().toISOString(),
    };

    const updatedJob: ServiceJob = {
      ...job,
      status: 'CLOSED',
      workflow: updatedWorkflow,
      updatedAt: new Date().toISOString(),
    };

    setJob(updatedJob);
    saveJobRecordDirect(updatedJob);

    dispatchWorkflowAlert({
      jobId: String(job.id || job.jobNo),
      jobNo: String(job.jobNo || job.id),
      customerName: job.customer?.name || 'Customer',
      equipmentName: (job.products || [])[0]?.productName || 'Equipment',
      fromUser: 'Azhalaku Priya',
      stage: 'JOB_COMPLETED',
      targetRole: 'ALL',
      title: `🎉 Job #${job.jobNo} Completed & Delivered! (${handoverType.replace(/_/g, ' ')})`,
      message: `Service job #${job.jobNo} for ${job.customer?.name || 'Customer'} successfully delivered via ${handoverType.replace(/_/g, ' ')}. Final quotation dispatched.`,
      priority: 'success',
    });

    setMessage(`🎉 Job #${job.jobNo} Completed! Delivery & quotation confirmed.`);
    setTimeout(() => setMessage(''), 5000);
  };


  const [staffFilter, setStaffFilter] = useState<string>('ALL');

  const isMd = useMemo(() => {
    const u = (currentUserEmail || '').toLowerCase();
    return (
      u.includes('md') ||
      u.startsWith('director') ||
      u === 'md'
    );
  }, [currentUserEmail]);

  const isAdmin = useMemo(() => {
    const u = (currentUserEmail || '').toLowerCase();
    return u.includes('admin') || u === 'admin';
  }, [currentUserEmail]);

  const isAdminOrMd = useMemo(() => {
    return isAdmin || isMd;
  }, [isAdmin, isMd]);

  const isSenthil = useMemo(() => {
    const u = (currentUserEmail || '').toLowerCase();
    return u.includes('senthil');
  }, [currentUserEmail]);

  const isBranchStaff = useMemo(() => {
    const u = (currentUserEmail || '').toLowerCase();
    return u.includes('suganya') || u.includes('radha');
  }, [currentUserEmail]);

  const isIntakeStaff = useMemo(() => {
    const u = (currentUserEmail || '').toLowerCase();
    return u.includes('suganya') || u.includes('radha') || u.includes('rekha') || u.includes('sabitha');
  }, [currentUserEmail]);

  const visibleSteps = useMemo(() => {
    if (isIntakeStaff && !isAdminOrMd) {
      // Front Office & Branch Intake staff only handle Customer, Products, and Receipt/Intake
      return SERVICE_STEPS.slice(0, 3);
    }
    return SERVICE_STEPS;
  }, [isIntakeStaff, isAdminOrMd]);

  // Separate worker accounts: individual workers only see jobs they created or are assigned to.
  // Admin and MD see all jobs and can filter by staff.
  const visibleSavedJobs = useMemo(() => {
    const user = (currentUserEmail || '').toLowerCase();
    const uKey = user.split('@')[0].replace(/[^a-z]/g, '');

    return savedJobsList.filter((j) => {
      // 1. Search text filter
      if (searchSaved.trim()) {
        const s = searchSaved.toLowerCase();
        const name = String(j.customer?.name || '').toLowerCase();
        const jobNo = String(j.jobNo || j.id || '').toLowerCase();
        const prod = (j.products || []).map((p: any) => String(p.productName || '')).join(' ').toLowerCase();
        if (!name.includes(s) && !jobNo.includes(s) && !prod.includes(s)) return false;
      }

      // 2. Admin & MD Master View: can view all or filter by selected staff
      if (isAdminOrMd) {
        if (staffFilter === 'ALL') return true;
        const target = staffFilter.toLowerCase();
        const createdBy = String(j.createdBy || '').toLowerCase();
        const intakeStaff = String(j.workflow?.intakeStaffName || j.workflow?.intakeBy || '').toLowerCase();
        const receivedBy = String(j.signoff?.receivedBy || '').toLowerCase();
        const repairedBy = String(j.signoff?.repairedBy || j.workflow?.mechanicAssigned || '').toLowerCase();
        const handoverBy = String(j.workflow?.handoverHandledBy || j.workflow?.handoverPerson || '').toLowerCase();
        return (
          createdBy.includes(target) ||
          intakeStaff.includes(target) ||
          receivedBy.includes(target) ||
          repairedBy.includes(target) ||
          handoverBy.includes(target)
        );
      }

      // 3. Regular Worker Account View: ONLY show the particular jobs they added or are handling
      const createdBy = String(j.createdBy || '').toLowerCase();
      const intakeStaff = String(j.workflow?.intakeStaffName || j.workflow?.intakeBy || '').toLowerCase();
      const receivedBy = String(j.signoff?.receivedBy || '').toLowerCase();
      const mrPerson = String(j.receipt?.personName || j.receipt?.pickedUpBy || '').toLowerCase();

      // Senthil: service mechanic - only show jobs he is repairing or created
      if (uKey.includes('senthil')) {
        const isUnderRepair = j.workflow?.stage === 'UNDER_REPAIR_ARAVINDH' || j.workflow?.stage === 'UNDER_REPAIR_SENTHIL';
        const repairedBy = String(j.signoff?.repairedBy || '').toLowerCase();
        const mechanic = String(j.workflow?.mechanicAssigned || '').toLowerCase();
        return isUnderRepair || repairedBy.includes('senthil') || mechanic.includes('senthil') || createdBy.includes('senthil');
      }

      // Aravindh: show jobs awaiting his acceptance, branch pickups, under repair by him, ready for handover, or created by him
      if (uKey.includes('aravind')) {
        const isAwaitingAccept = j.workflow?.stage === 'AWAITING_ARAVINDH_ACCEPT';
        const isUnderRepair = j.workflow?.stage === 'UNDER_REPAIR_ARAVINDH';
        const isBranchPickupPending = Boolean(j.workflow?.isBranchDelivery && !j.workflow?.aravindhBranchPickupDone);
        const isReadyForHandover = j.workflow?.stage === 'READY_FOR_HANDOVER';
        const handoverBy = String(j.workflow?.handoverHandledBy || j.workflow?.handoverPerson || '').toLowerCase();
        const mechanic = String(j.workflow?.mechanicAssigned || '').toLowerCase();
        return isAwaitingAccept || isUnderRepair || isBranchPickupPending || isReadyForHandover || handoverBy.includes('aravind') || mechanic.includes('aravind') || mrPerson.includes('aravind') || createdBy.includes('aravind');
      }

      // Azhalaku Priya: show jobs awaiting her pricing, price approved by MD, ready for handover, or created by her
      if (uKey.includes('priya') || uKey.includes('azhalaku')) {
        const isAwaitingPricing = j.workflow?.stage === 'AWAITING_PRIYA_PRICING';
        const isPriceApproved = j.workflow?.stage === 'PRICE_APPROVED_BY_MD';
        const isReadyForHandover = j.workflow?.stage === 'READY_FOR_HANDOVER';
        const isOwner = (
          (createdBy && (createdBy.includes('priya') || createdBy.includes('azhalaku'))) ||
          (intakeStaff && (intakeStaff.includes('priya') || intakeStaff.includes('azhalaku'))) ||
          (receivedBy && (receivedBy.includes('priya') || receivedBy.includes('azhalaku')))
        );
        return isAwaitingPricing || isPriceApproved || isReadyForHandover || isOwner;
      }

      // Front Office & Branch Intake staff (Suganya, Radha, Sabitha, Rekha)
      // Show ONLY the particular jobs they added or took intake for
      const isOwner = (
        (createdBy && (createdBy.includes(uKey) || uKey.includes(createdBy.split('@')[0]))) ||
        (intakeStaff && (intakeStaff.includes(uKey) || uKey.includes(intakeStaff.split('@')[0]))) ||
        (receivedBy && (receivedBy.includes(uKey) || uKey.includes(receivedBy.split('@')[0]))) ||
        (mrPerson && (mrPerson.includes(uKey) || uKey.includes(mrPerson.split('@')[0])))
      );

      return isOwner;
    });
  }, [savedJobsList, searchSaved, isAdminOrMd, staffFilter, currentUserEmail]);

  // Cross-device sync & saved jobs watcher
  useEffect(() => {
    const loadSavedJobs = () => {
      try {
        const raw = localStorage.getItem('nunes:service_jobs');
        const list: ServiceJob[] = raw ? JSON.parse(raw) : [];
        setSavedJobsList(list);
      } catch {}
    };

    loadSavedJobs();
    void syncPullFromCloud().then(() => loadSavedJobs());
    window.addEventListener('nunes:records-synced', loadSavedJobs);
    return () => window.removeEventListener('nunes:records-synced', loadSavedJobs);
  }, []);


  const loadJobById = (targetId: string) => {
    try {
      const raw = localStorage.getItem('nunes:service_jobs');
      const list: ServiceJob[] = raw ? JSON.parse(raw) : [];
      const found = list.find(x => String(x.id) === targetId || String(x.jobNo) === targetId) ||
                    BENCHMARK_SERVICING.find(x => String(x.id) === targetId || String(x.jobNo) === targetId);
      if (found) {
        setJob(normalizeJob(found));
        setMessage(`✓ Loaded service job ${found.jobNo || found.id} (${found.customer?.name || 'Customer'})`);
        setTimeout(() => setMessage(''), 3500);
        return true;
      }
    } catch {}
    return false;
  };

  // 1-Click Instant Target Job Resolver for Servicing Intake Workspace
  useEffect(() => {
    const handleSelect = (e: CustomEvent) => {
      const jId = e.detail?.jobId;
      if (jId === 'new') {
        startNewJob();
      } else if (jId) {
        loadJobById(jId);
      }
    };
    const handlePop = () => {
      if (typeof window === 'undefined') return;
      const sp = new URLSearchParams(window.location.search);
      const t = sp.get('id') || sp.get('job_no') || sp.get('job');
      if (t === 'new') {
        startNewJob();
      } else if (t) {
        loadJobById(t);
      }
    };
    window.addEventListener('nunes:select-job', handleSelect as EventListener);
    window.addEventListener('popstate', handlePop);
    return () => {
      window.removeEventListener('nunes:select-job', handleSelect as EventListener);
      window.removeEventListener('popstate', handlePop);
    };
  }, []);

  // Automatically load from URL query param if present (e.g. ?id=SJ-8821), or restore saved half-filled draft
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const targetId = sp.get('id') || sp.get('job_no') || sp.get('job');
      if (targetId === 'new') {
        startNewJob();
        return;
      } else if (targetId) {
        if (loadJobById(targetId)) return;
      }

      // Pre-fill from Product Catalog URL params if present
      const urlProdName = sp.get('productName') || sp.get('product');
      const urlModel = sp.get('model');
      const urlPrice = sp.get('price');
      const urlSpec = sp.get('spec');
      if (urlProdName) {
        const catalog = getAllProducts();
        const foundProd = catalog.find(
          x => x.name.toLowerCase() === urlProdName.toLowerCase() || x.model.toLowerCase() === (urlModel || '').toLowerCase()
        );
        setJob(prev => {
          const prods = [...prev.products];
          prods[0] = {
            ...prods[0],
            productName: urlProdName,
            makeModel: urlModel || prods[0].makeModel || '',
            productValue: urlPrice ? parseFloat(urlPrice) : prods[0].productValue,
            onlinePrice: urlPrice ? parseFloat(urlPrice) : prods[0].onlinePrice,
            productImageUrl: foundProd?.imageUrl || prods[0].productImageUrl,
            productSpecifications: urlSpec || foundProd?.specifications || prods[0].productSpecifications
          };
          return { ...prev, products: prods };
        });
        setActiveStep(1);
        setMessage(`✓ Pre-filled product "${urlProdName}" with photo from catalog`);
        setTimeout(() => setMessage(''), 4000);
        return;
      }

      // Forms always start clean and blank by default unless a specific saved job ID was requested in URL query
    } catch {}
  }, []);

  // Executive Approvals Queue Auto-Display for MD:
  // MD is strictly the Executive Approver and does not create intake jobs.
  // When MD opens the servicing interface without a specific job requested, automatically present the Directory & Approval Queue.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const targetId = sp.get('id') || sp.get('job_no') || sp.get('job');
    if (!targetId && isMd) {
      setShowSavedModal(true);
      setStageFilter('MD_APPROVAL');
    }
  }, [isMd]);

  // Persist active draft with debouncing so typing doesn't block UI
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('nunes:service_current_draft', JSON.stringify(job));
      } catch {}
    }, 400);
    return () => clearTimeout(timer);
  }, [job]);

  // Recalculate totals safely
  const calculatedTotals = useMemo(() => {
    const prods = Array.isArray(job?.products) ? job.products : [];
    const productVal = prods.reduce((sum, p) => sum + (Number(p.productValue || p.onlinePrice || 0) * Math.max(1, p.qty || 1)), 0);
    const repairEst = prods.reduce((sum, p) => sum + (Number(p.repairEstimate || 0) * Math.max(1, p.qty || 1)), 0);
    const disc = Number(job?.totals?.discount || 0);
    const finalEst = Math.max(0, repairEst - disc);

    return {
      productValue: productVal,
      repairEstimate: repairEst,
      discount: disc,
      totalEstimate: finalEst
    };
  }, [job?.products, job?.totals?.discount]);

  useEffect(() => {
    setJob(prev => {
      const isManual = Boolean(prev.totals?.totalEstimateManual);
      const targetEstimate = isManual && prev.totals?.totalEstimate !== undefined ? prev.totals.totalEstimate : calculatedTotals.totalEstimate;
      const targetRepair = isManual && prev.totals?.repairEstimate !== undefined ? prev.totals.repairEstimate : calculatedTotals.repairEstimate;

      if (
        prev.totals?.productValue === calculatedTotals.productValue &&
        prev.totals?.repairEstimate === targetRepair &&
        prev.totals?.discount === calculatedTotals.discount &&
        prev.totals?.totalEstimate === targetEstimate
      ) {
        return prev;
      }
      return {
        ...prev,
        totals: {
          ...prev.totals,
          productValue: calculatedTotals.productValue,
          repairEstimate: targetRepair,
          discount: calculatedTotals.discount,
          totalEstimate: targetEstimate
        }
      };
    });
  }, [calculatedTotals]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateCustomer(field: keyof ServiceJob['customer'], val: string) {
    setJob(prev => {
      const nextCustomer = { ...prev.customer, [field]: val };
      let nextReceipt = prev.receipt;
      let nextJobDate = prev.jobDate;

      if (field === 'date') {
        nextJobDate = val;
        if (!nextReceipt.mrDate) {
          nextReceipt = { ...nextReceipt, mrDate: val };
        }
      }

      // When Receipt Mode is DIRECT (Direct Walk-in), the person handing over is the customer / rep.
      // Automatically keep receipt.personName, receipt.personPhone, and receipt.reference in sync.
      if (prev.receipt.mode === 'DIRECT') {
        const oldEffectiveName = prev.customer?.contactPerson?.trim() || prev.customer?.name?.trim() || '';
        const oldEffectivePhone = prev.customer?.phone?.trim() || '';
        const isDefaultOrEmptyName = !prev.receipt.personName || prev.receipt.personName === oldEffectiveName;
        const isDefaultOrEmptyPhone = !prev.receipt.personPhone || prev.receipt.personPhone === oldEffectivePhone;

        const newEffectiveName = nextCustomer.contactPerson?.trim() || nextCustomer.name?.trim() || '';
        const newEffectivePhone = nextCustomer.phone?.trim() || '';

        if (isDefaultOrEmptyName && (field === 'contactPerson' || field === 'name')) {
          const updatedName = newEffectiveName;
          const updatedPhone = isDefaultOrEmptyPhone ? newEffectivePhone : (prev.receipt.personPhone || '');
          nextReceipt = {
            ...nextReceipt,
            personName: updatedName,
            reference: updatedName ? `Direct Handover by ${updatedName} ${updatedPhone ? `(Ph: ${updatedPhone})` : ''}`.trim() : nextReceipt.reference
          };
        }
        if (isDefaultOrEmptyPhone && field === 'phone') {
          const currentPName = nextReceipt.personName || newEffectiveName;
          nextReceipt = {
            ...nextReceipt,
            personPhone: newEffectivePhone,
            reference: currentPName ? `Direct Handover by ${currentPName} ${newEffectivePhone ? `(Ph: ${newEffectivePhone})` : ''}`.trim() : nextReceipt.reference
          };
        }
      }

      return {
        ...prev,
        customer: nextCustomer,
        receipt: nextReceipt,
        jobDate: nextJobDate
      };
    });
  }

  function updateReceipt(field: keyof ServiceJob['receipt'], val: any) {
    setJob(prev => {
      const nextReceipt = { ...prev.receipt, [field]: val };

      // If user switches receipt mode to DIRECT (Direct Handover / Walk-in):
      // Automatically use the customer name and contact phone if personName is empty or not yet customized!
      if (field === 'mode' && val === 'DIRECT') {
        const custName = prev.customer?.contactPerson?.trim() || prev.customer?.name?.trim() || '';
        const custPhone = prev.customer?.phone?.trim() || '';
        if (!nextReceipt.personName || nextReceipt.personName.trim() === '') {
          nextReceipt.personName = custName;
        }
        if (!nextReceipt.personPhone || nextReceipt.personPhone.trim() === '') {
          nextReceipt.personPhone = custPhone;
        }
        if (custName) {
          nextReceipt.reference = `Direct Handover by ${nextReceipt.personName || custName} ${nextReceipt.personPhone ? `(Ph: ${nextReceipt.personPhone})` : ''}`.trim();
        }
      }

      return {
        ...prev,
        receipt: nextReceipt
      };
    });
  }

  function updateDispatch(field: keyof ServiceJob['dispatch'], val: any) {
    setJob(prev => ({
      ...prev,
      dispatch: { ...prev.dispatch, [field]: val }
    }));
  }

  function updatePayment(field: keyof ServiceJob['payment'], val: any) {
    setJob(prev => ({
      ...prev,
      payment: { ...prev.payment, [field]: val }
    }));
  }

  function updateSignoff(field: keyof ServiceJob['signoff'], val: any) {
    setJob(prev => ({
      ...prev,
      signoff: { ...prev.signoff, [field]: val }
    }));
  }

  function updateProduct(index: number, patch: Partial<ServiceProduct>) {
    setJob(prev => {
      const items = [...prev.products];
      const curr = { ...items[index], ...patch };

      // If price or category changed, auto-recalculate repairEstimate only if not already fixed manually
      if (patch.repairCategory !== undefined || patch.onlinePrice !== undefined || patch.productValue !== undefined || patch.repairPercent !== undefined) {
        const cat = curr.repairCategory === 'MAXIMUM_50' ? 'MAXIMUM_50' : 'MINIMUM_30';
        const pct = patch.repairPercent !== undefined ? patch.repairPercent : (cat === 'MAXIMUM_50' ? 50 : 30);
        const price = Number(curr.onlinePrice || curr.productValue || 0);
        curr.repairCategory = cat;
        curr.repairPercent = pct;
        curr.productValue = price;

        // FIXED VALUE LOCK: Do not overwrite an existing manual repairEstimate unless explicitly passed in patch
        if (patch.repairEstimate !== undefined) {
          curr.repairEstimate = patch.repairEstimate;
        } else if (!curr.repairEstimate || curr.repairEstimate === 0 || patch.repairPercent !== undefined) {
          curr.repairEstimate = Number(((price * pct) / 100).toFixed(2));
        }
      }

      if (patch.repairEstimate !== undefined) {
        curr.repairEstimate = patch.repairEstimate;
        curr.estimateStatus = 'PRICE_CONFIRMED';
      }

      items[index] = curr;
      return { ...prev, products: items };
    });
  }

  function addProduct() {
    setJob(prev => ({
      ...prev,
      products: [...prev.products, newProduct()]
    }));
  }

  function removeProduct(index: number) {
    if (job.products.length <= 1) return;
    setJob(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  }

  function handleUploadProofPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const res = ev.target?.result as string;
        if (res) {
          setJob(prev => {
            const list = [...(prev.proofImages || prev.proofPhotos || []), res];
            return {
              ...prev,
              proofImages: list,
              proofPhotos: list
            };
          });
        }
      };
      reader.readAsDataURL(file);
    });
    setMessage('✓ Added photo proof of incoming equipment');
    setTimeout(() => setMessage(''), 3000);
  }

  function handleRemoveProofPhoto(idx: number) {
    setJob(prev => {
      const list = (prev.proofImages || prev.proofPhotos || []).filter((_, i) => i !== idx);
      return {
        ...prev,
        proofImages: list,
        proofPhotos: list
      };
    });
  }

  function handleUploadProofVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const res = ev.target?.result as string;
      if (res) {
        setJob(prev => ({
          ...prev,
          proofVideo: res
        }));
        setMessage('✓ Added video proof of equipment defect / incoming condition');
        setTimeout(() => setMessage(''), 3500);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveProofVideo() {
    setJob(prev => ({ ...prev, proofVideo: '' }));
  }

  function handleUploadProofPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const res = ev.target?.result as string;
        if (res) {
          setJob(prev => {
            const list = [...(prev.proofImages || prev.proofPhotos || []), res];
            return {
              ...prev,
              proofImages: list,
              proofPhotos: list
            };
          });
        }
      };
      reader.readAsDataURL(file);
    });
    setMessage('✓ Added photo proof of incoming equipment');
    setTimeout(() => setMessage(''), 3000);
  }

  function handleRemoveProofPhoto(idx: number) {
    setJob(prev => {
      const list = (prev.proofImages || prev.proofPhotos || []).filter((_, i) => i !== idx);
      return {
        ...prev,
        proofImages: list,
        proofPhotos: list
      };
    });
  }

  function handleUploadProofVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const res = ev.target?.result as string;
      if (res) {
        setJob(prev => ({
          ...prev,
          proofVideo: res
        }));
        setMessage('✓ Added video proof of equipment defect / incoming condition');
        setTimeout(() => setMessage(''), 3500);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveProofVideo() {
    setJob(prev => ({ ...prev, proofVideo: '' }));
  }

  function saveRecord(proceed = false) {
    const isFinalStep = activeStep === visibleSteps.length - 1;
    const finalStatus: JobStatus = isFinalStep 
      ? (job.status === 'DRAFT' || job.status === 'RECEIVED' || job.status === 'ESTIMATE_PENDING' || job.status === 'REPAIRING' ? 'READY' : job.status) 
      : job.status;
    const updated: ServiceJob = {
      ...job,
      status: finalStatus,
      workflow: isFinalStep ? {
        ...(job.workflow || { stage: 'JOB_COMPLETED', receivedAt: new Date().toISOString() }),
        stage: 'JOB_COMPLETED',
        finalHandoverCompletedAt: job.workflow?.finalHandoverCompletedAt || new Date().toISOString()
      } : job.workflow,
      updatedAt: new Date().toISOString()
    };

    setJob(updated);

    try {
      const raw = localStorage.getItem('nunes:service_jobs');
      const list: ServiceJob[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(x => String(x.id) === String(updated.id) || (Boolean(updated.jobNo) && String(x.jobNo) === String(updated.jobNo)));
      if (idx >= 0) {
        list[idx] = updated;
      } else {
        list.unshift(updated);
      }
      localStorage.setItem('nunes:service_jobs', JSON.stringify(list));
      void syncFormToCloud("servicing", String(updated.jobNo || updated.id), String(updated.customer?.name || "Customer"), updated);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nunes:records-synced', { detail: { type: 'service_jobs', job: updated } }));
        window.dispatchEvent(new CustomEvent('nunes:job-saved', { detail: { job: updated } }));
        try {
          const channel = new BroadcastChannel("nunes_workflow_channel");
          channel.postMessage({ type: "JOB_SAVED", job: updated });
          channel.close();
        } catch {}
      }
    } catch {}

    if (proceed) {
      if (!isFinalStep) {
        setDirection('forward');
        setDirection('forward');
        setActiveStep(s => s + 1);
        setMessage('✓ Saved & moving to next step.');
        setTimeout(() => setMessage(''), 3000);
      } else {
        // Report totally completed! Show 4 sec fireworks celebration then redirect to fresh new form
        const completedNo = updated.jobNo || updated.id;
        setCelebrationData({
          recordNumber: String(completedNo),
          title: 'Service Job Successfully Completed & Saved!',
          subtitle: `Service Job ${completedNo} for ${updated.customer?.name || 'Customer'} has been saved to Reports.`
        });
        setShowCelebration(true);
      }
    } else {
      setMessage(`✓ Saved draft for Job #${updated.jobNo}`);
      setDraftSaveNotice(true);
      setTimeout(() => setMessage(''), 4500);
    }
  }

  function handleSaveAndClose() {
    const updated: ServiceJob = {
      ...job,
      status: job.status === 'READY' || job.status === 'CLOSED' ? job.status : 'DRAFT',
      updatedAt: new Date().toISOString()
    };
    setJob(updated);
    saveJobRecordDirect(updated);
    
    // Clear active working draft from localStorage so reopening the form starts fresh
    try {
      localStorage.removeItem('nunes:service_current_draft');
    } catch {}

    setShowCloseModal(false);
    setDraftSaveNotice(false);
    setMessage('✓ Draft saved. Closing form and returning to Forms Hub...');

    setTimeout(() => {
      router.push('/forms');
    }, 350);
  }

  function handleCloseWithoutSaving() {
    // Discard active working draft so user is not stuck on it
    try {
      localStorage.removeItem('nunes:service_current_draft');
    } catch {}
    setShowCloseModal(false);
    setDraftSaveNotice(false);
    router.push('/forms');
  }

  function handlePromptClose() {
    const hasData = Boolean(
      job.customer?.name || 
      job.customer?.phone || 
      (job.products && job.products.some(p => p.productName || p.makeModel || p.complaint))
    );

    if (!hasData) {
      handleCloseWithoutSaving();
    } else {
      setShowCloseModal(true);
    }
  }

  function completeAndOpenQuotation() {
    const updated: ServiceJob = {
      ...job,
      status: (job.status === 'DRAFT' || job.status === 'RECEIVED') ? 'ESTIMATE_PENDING' : job.status,
      updatedAt: new Date().toISOString()
    };
    setJob(updated);
    try {
      const raw = localStorage.getItem('nunes:service_jobs');
      const list: ServiceJob[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(x => String(x.id) === String(updated.id) || (Boolean(updated.jobNo) && String(x.jobNo) === String(updated.jobNo)));
      if (idx >= 0) {
        list[idx] = updated;
      } else {
        list.unshift(updated);
      }
      localStorage.setItem('nunes:service_jobs', JSON.stringify(list));
      void syncFormToCloud("servicing", String(updated.jobNo || updated.id), String(updated.customer?.name || "Customer"), updated);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nunes:records-synced', { detail: { type: 'service_jobs', job: updated } }));
        window.dispatchEvent(new CustomEvent('nunes:job-saved', { detail: { job: updated } }));
        try {
          const channel = new BroadcastChannel("nunes_workflow_channel");
          channel.postMessage({ type: "JOB_SAVED", job: updated });
          channel.close();
        } catch {}
      }
    } catch {}

    setMessage('✓ Service Job completed & saved. Opening Quotation & Messaging Dispatcher...');
    setTimeout(() => setMessage(''), 4000);
    setShowQuotation(true);
  }

  function handleClearAllOlderForms() {
    if (typeof window !== 'undefined' && window.confirm("Are you sure you want to delete all older forms and drafts? This will purge all saved jobs and return to a clean blank form.")) {
      clearAllOlderForms();
      startNewJob();
      setMessage("✓ All older forms, job history, and drafts have been deleted.");
      setTimeout(() => setMessage(''), 4000);
    }
  }

  function startNewJob() {
    try {
      localStorage.removeItem('nunes:service_current_draft');
    } catch {}
    const fresh = normalizeJob({});
    setJob(fresh);
    setDraftRestored(false);
    setDirection('forward');
    setDirection('forward');
    setActiveStep(0);
    setMessage(`✓ Started new blank service job ${fresh.jobNo}`);
    setTimeout(() => setMessage(''), 3500);
  }

  // Memoize product names summary for the main header title
  const productSummary = useMemo(() => {
    const list = (job.products || [])
      .map(p => p.productName?.trim() || (p.makeModel ? `Model ${p.makeModel.trim()}` : ''))
      .filter(Boolean);
    if (list.length === 0) return 'Equipment Under Service';
    return list.join(', ');
  }, [job.products]);

  return (
    <div className="nunes-form-workspace">
      {showPaper && (
        <PaperJobCardPreview 
          job={job} 
          onClose={() => setShowPaper(false)} 
          onOpenQuotation={() => setShowQuotation(true)}
        />
      )}

      {showQuotation && (
        <ServiceQuotationModal 
          job={job} 
          onClose={() => setShowQuotation(false)}
          onSaved={() => {
            setMessage('✓ Quotation saved & communication logged.');
            setTimeout(() => setMessage(''), 3500);
          }}
          onStartNewJob={() => {
            setShowQuotation(false);
            setCelebrationData({
              recordNumber: String(job.jobNo || job.id),
              title: 'Service Estimate & Quotation Dispatched!',
              subtitle: 'Estimate sent to customer. Transitioning to fresh service job card.'
            });
            setShowCelebration(true);
          }}
        />
      )}

      {showSavedModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'grid',
            placeItems: 'center',
            padding: '16px',
          }}
          onClick={() => setShowSavedModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc',
              }}
            >
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderOpen size={18} style={{ color: '#0f766e' }} />
                  <span>
                    {isAdminOrMd 
                      ? `All Saved Service Jobs (${visibleSavedJobs.length})` 
                      : `My Saved Service Jobs (${visibleSavedJobs.length})`}
                  </span>
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {isAdminOrMd 
                    ? `Master Administration View • Showing jobs across all staff members` 
                    : `Account: ${currentUserEmail} • Showing only the particular jobs you created or handle`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSavedModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Staff Filter Bar for Admin / MD */}
            {isAdminOrMd && (
              <div style={{ padding: '8px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px' }}>
                  Filter by Worker:
                </span>
                {[
                  { key: 'ALL', label: `All (${savedJobsList.length})` },
                  { key: 'suganya', label: 'Suganya' },
                  { key: 'radha', label: 'Radha' },
                  { key: 'rekha', label: 'Rekha' },
                  { key: 'sabitha', label: 'Sabitha' },
                  { key: 'aravind', label: 'Aravindh' },
                  { key: 'senthil', label: 'Senthil' },
                  { key: 'priya', label: 'Priya' },
                ].map((chip) => {
                  const isActive = staffFilter === chip.key;
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => setStaffFilter(chip.key)}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '6px',
                        border: isActive ? '1px solid #0f766e' : '1px solid #cbd5e1',
                        background: isActive ? '#0f766e' : '#ffffff',
                        color: isActive ? '#ffffff' : '#475569',
                        fontSize: '11px',
                        fontWeight: 750,
                        cursor: 'pointer',
                      }}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Search Input */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search by Job No, Customer, or Equipment..."
                  value={searchSaved}
                  onChange={(e) => setSearchSaved(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* List */}
            <div style={{ padding: '12px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {visibleSavedJobs.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  {isAdminOrMd
                    ? 'No service jobs match this search or staff filter.'
                    : `No service jobs recorded under your account (${currentUserEmail}) yet. Fill out the form and click Save Draft to save your first job.`}
                </div>
              ) : (
                visibleSavedJobs
                  .map((j) => {
                    const prodName = (j.products || []).map((p) => p.productName).filter(Boolean).join(', ') || 'Equipment';
                    const isCurrent = (j.jobNo || j.id) === (job.jobNo || job.id);
                    return (
                      <div
                        key={String(j.id || j.jobNo)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: isCurrent ? '1.5px solid #0f766e' : '1px solid #e2e8f0',
                          backgroundColor: isCurrent ? '#f0fdfa' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '14px', color: '#0f172a' }}>{j.jobNo || j.id}</strong>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>
                              {j.status || 'RECEIVED'}
                            </span>
                            {isCurrent && (
                              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#ccfbf1', color: '#0f766e', fontWeight: 700 }}>
                                ACTIVE IN FORM
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: 700, marginTop: '3px' }}>
                            {j.customer?.name || 'Customer'}
                            {j.customer?.phone && (
                              <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500, marginLeft: '6px' }}>
                                ({j.customer.phone})
                              </span>
                            )}
                            {j.customer?.city && (
                              <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>
                                • {j.customer.city}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#334155', fontWeight: 600, marginTop: '2px' }}>
                            {prodName}
                            {j.products?.[0]?.serialNo && (
                              <span style={{ fontFamily: 'monospace', color: '#047857', marginLeft: '6px' }}>
                                [SN: {j.products[0].serialNo}]
                              </span>
                            )}
                          </div>
                          {j.workflow?.mechanicAssessment && (
                            <div style={{ fontSize: '11px', color: '#92400e', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '3px', fontWeight: 600 }}>
                              {j.workflow.mechanicEstimateType === 'MAXIMUM_50' ? '50% Overhaul' : '30% Service'}: {j.workflow.mechanicAssessment}
                            </div>
                          )}
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                            Quotation / Value: <strong>₹{Number(j.workflow?.mdApprovedPrice || j.workflow?.priyaTotalQuotationAmount || j.totals?.totalEstimate || 0).toLocaleString('en-IN')}</strong>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setJob(normalizeJob(j));
                            setShowSavedModal(false);
                            setMessage(`✓ Loaded service job ${j.jobNo || j.id} into form.`);
                            setTimeout(() => setMessage(''), 3500);
                          }}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            background: isCurrent ? '#cbd5e1' : '#0f766e',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          Load into Form →
                        </button>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowSavedModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Form Confirmation Modal */}
      {showCloseModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.70)',
            backdropFilter: 'blur(4px)',
            display: 'grid',
            placeItems: 'center',
            padding: '16px',
          }}
          onClick={() => setShowCloseModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px 28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#fef3c7',
                color: '#d97706',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0
              }}>
                <Save size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Save Draft Before Closing?
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '3px 0 0' }}>
                  Job #{job.jobNo} • {job.customer?.name || 'Customer'}
                </p>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.5, marginBottom: '22px' }}>
              You are about to close this servicing job form. Would you like to save your current work as a draft so you or another team member can resume it anytime from <b>Saved Jobs</b>?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={handleSaveAndClose}
                style={{
                  background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Save size={16} /> Save Draft &amp; Close Form
              </button>

              <button
                type="button"
                onClick={handleCloseWithoutSaving}
                style={{
                  background: '#f8fafc',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 650,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={15} /> Close Without Saving
              </button>

              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                style={{
                  background: 'transparent',
                  color: '#64748b',
                  border: 'none',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Keep Editing This Form
              </button>
            </div>
          </div>
        </div>
      )}

      {showSavedModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'grid',
            placeItems: 'center',
            padding: '16px',
          }}
          onClick={() => setShowSavedModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc',
              }}
            >
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderOpen size={18} style={{ color: '#0f766e' }} />
                  <span>
                    {isAdminOrMd 
                      ? `All Saved Service Jobs (${visibleSavedJobs.length})` 
                      : `My Saved Service Jobs (${visibleSavedJobs.length})`}
                  </span>
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {isAdminOrMd 
                    ? `Master Administration View • Showing jobs across all staff members` 
                    : `Account: ${currentUserEmail} • Showing only the particular jobs you created or handle`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSavedModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Staff Filter Bar for Admin / MD */}
            {isAdminOrMd && (
              <div style={{ padding: '8px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px' }}>
                  Filter by Worker:
                </span>
                {[
                  { key: 'ALL', label: `All (${savedJobsList.length})` },
                  { key: 'suganya', label: 'Suganya' },
                  { key: 'radha', label: 'Radha' },
                  { key: 'rekha', label: 'Rekha' },
                  { key: 'sabitha', label: 'Sabitha' },
                  { key: 'aravind', label: 'Aravindh' },
                  { key: 'senthil', label: 'Senthil' },
                  { key: 'priya', label: 'Priya' },
                ].map((chip) => {
                  const isActive = staffFilter === chip.key;
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => setStaffFilter(chip.key)}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '6px',
                        border: isActive ? '1px solid #0f766e' : '1px solid #cbd5e1',
                        background: isActive ? '#0f766e' : '#ffffff',
                        color: isActive ? '#ffffff' : '#475569',
                        fontSize: '11px',
                        fontWeight: 750,
                        cursor: 'pointer',
                      }}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Search Input */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search by Job No, Customer, or Equipment..."
                  value={searchSaved}
                  onChange={(e) => setSearchSaved(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* List */}
            <div style={{ padding: '12px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {visibleSavedJobs.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  {isAdminOrMd
                    ? 'No service jobs match this search or staff filter.'
                    : `No service jobs recorded under your account (${currentUserEmail}) yet. Fill out the form and click Save Draft to save your first job.`}
                </div>
              ) : (
                visibleSavedJobs
                  .map((j) => {
                    const prodName = (j.products || []).map((p) => p.productName).filter(Boolean).join(', ') || 'Equipment';
                    const isCurrent = (j.jobNo || j.id) === (job.jobNo || job.id);
                    return (
                      <div
                        key={String(j.id || j.jobNo)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: isCurrent ? '1.5px solid #0f766e' : '1px solid #e2e8f0',
                          backgroundColor: isCurrent ? '#f0fdfa' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '14px', color: '#0f172a' }}>{j.jobNo || j.id}</strong>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>
                              {j.status || 'RECEIVED'}
                            </span>
                            {isCurrent && (
                              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#ccfbf1', color: '#0f766e', fontWeight: 700 }}>
                                ACTIVE IN FORM
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: 700, marginTop: '3px' }}>
                            {j.customer?.name || 'Customer'}
                            {j.customer?.phone && (
                              <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500, marginLeft: '6px' }}>
                                ({j.customer.phone})
                              </span>
                            )}
                            {j.customer?.city && (
                              <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>
                                • {j.customer.city}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#334155', fontWeight: 600, marginTop: '2px' }}>
                            {prodName}
                            {j.products?.[0]?.serialNo && (
                              <span style={{ fontFamily: 'monospace', color: '#047857', marginLeft: '6px' }}>
                                [SN: {j.products[0].serialNo}]
                              </span>
                            )}
                          </div>
                          {j.workflow?.mechanicAssessment && (
                            <div style={{ fontSize: '11px', color: '#92400e', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '3px', fontWeight: 600 }}>
                              {j.workflow.mechanicEstimateType === 'MAXIMUM_50' ? '50% Overhaul' : '30% Service'}: {j.workflow.mechanicAssessment}
                            </div>
                          )}
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                            Quotation / Value: <strong>₹{Number(j.workflow?.mdApprovedPrice || j.workflow?.priyaTotalQuotationAmount || j.totals?.totalEstimate || 0).toLocaleString('en-IN')}</strong>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setJob(normalizeJob(j));
                            setShowSavedModal(false);
                            setMessage(`✓ Loaded service job ${j.jobNo || j.id} into form.`);
                            setTimeout(() => setMessage(''), 3500);
                          }}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            background: isCurrent ? '#cbd5e1' : '#0f766e',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          Load into Form →
                        </button>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowSavedModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Form Confirmation Modal */}
      {showCloseModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.70)',
            backdropFilter: 'blur(4px)',
            display: 'grid',
            placeItems: 'center',
            padding: '16px',
          }}
          onClick={() => setShowCloseModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px 28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#fef3c7',
                color: '#d97706',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0
              }}>
                <Save size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Save Draft Before Closing?
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '3px 0 0' }}>
                  Job #{job.jobNo} • {job.customer?.name || 'Customer'}
                </p>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.5, marginBottom: '22px' }}>
              You are about to close this servicing job form. Would you like to save your current work as a draft so you or another team member can resume it anytime from <b>Saved Jobs</b>?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={handleSaveAndClose}
                style={{
                  background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Save size={16} /> Save Draft &amp; Close Form
              </button>

              <button
                type="button"
                onClick={handleCloseWithoutSaving}
                style={{
                  background: '#f8fafc',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 650,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={15} /> Close Without Saving
              </button>

              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                style={{
                  background: 'transparent',
                  color: '#64748b',
                  border: 'none',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Keep Editing This Form
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="nunes-form-header">
        <div>
          <span className="nunes-tag servicing-badge">Servicing Operations</span>
          <h1 style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '22px', fontWeight: 800 }}>
            {job.customer?.name ? (
              <>
                <span style={{ color: '#0f172a' }}>{job.customer.name}</span>
                <span style={{ color: '#94a3b8', fontWeight: 400 }}>•</span>
                <span style={{ color: '#0f766e', background: '#ecfdf5', padding: '2px 10px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                  {productSummary}
                </span>
                <span style={{ color: '#94a3b8', fontWeight: 400 }}>•</span>
                <span style={{ color: '#64748b', fontSize: '18px', fontWeight: 700 }}>{job.jobNo}</span>
              </>
            ) : (
              <>
                <span style={{ color: '#0f766e', background: '#ecfdf5', padding: '2px 10px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                  {productSummary}
                </span>
                <span style={{ color: '#94a3b8', fontWeight: 400 }}>•</span>
                <span style={{ color: '#64748b', fontSize: '18px', fontWeight: 700 }}>Service Job ({job.jobNo})</span>
              </>
            )}
          </h1>
        </div>
        <div className="nunes-form-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Group 1: Record Management */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f8fafc', padding: '3px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <button
              type="button"
              className="btn"
              onClick={() => setShowSavedModal(true)}
              title={isAdminOrMd ? "View & filter all saved service jobs" : "View your particular saved service jobs"}
              style={{ background: '#ffffff', border: '1px solid #99f6e4', color: '#0f766e', fontWeight: 700, fontSize: '12px', padding: '6px 10px' }}
            >
              <FolderOpen size={14} style={{ color: '#0f766e' }} />
              <span>Saved ({visibleSavedJobs.length})</span>
            </button>
            <button
              type="button"
              className="btn"
              onClick={startNewJob}
              title="Start a fresh blank service job"
              style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 700, fontSize: '12px', padding: '6px 10px' }}
            >
              <Plus size={14} /> New
            </button>
          </div>

          {/* Group 2: Output Documents */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f8fafc', padding: '3px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <button 
              type="button" 
              className="btn btn-quotation-header" 
              onClick={() => setShowQuotation(true)}
              title="Generate Service Quotation with WhatsApp & Gmail"
              style={{ fontSize: '12px', padding: '6px 11px', fontWeight: 700 }}
            >
              <FileCheck size={14} /> Quotation
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setShowPaper(true)}
              title="Official Paper Job Card View"
              style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 700, fontSize: '12px', padding: '6px 10px' }}
            >
              <Printer size={14} /> Paper Card
            </button>
          </div>

          {/* Group 3: Primary Workflow Actions */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            <button
              type="button"
              className="btn"
              onClick={() => saveRecord(false)}
              title="Save draft and continue editing"
              style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 700, fontSize: '12px', padding: '7px 11px' }}
            >
              <Save size={14} /> Save Draft
            </button>
            <button 
              type="button" 
              className="btn" 
              onClick={handleSaveAndClose}
              title="Save draft and close this form to return to Forms Hub"
              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#1e293b', fontWeight: 700, fontSize: '12px', padding: '7px 11px' }}
            >
              <LogOut size={14} /> Save &amp; Close
            </button>
            <button 
              type="button" 
              className="btn primary" 
              onClick={() => saveRecord(true)}
              style={{ fontWeight: 800, fontSize: '12px', padding: '7px 14px', background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', color: '#ffffff', boxShadow: '0 2px 8px rgba(13, 148, 136, 0.35)' }}
              title={activeStep === SERVICE_STEPS.length - 1 ? "Complete this job and move to next new form" : "Save and proceed to next step"}
            >
              {activeStep === SERVICE_STEPS.length - 1 ? (
                <>Complete Job <ArrowRight size={14} /></>
              ) : (
                <>Save &amp; Next <ArrowRight size={14} /></>
              )}
            </button>
            <button
              type="button"
              className="btn"
              onClick={handlePromptClose}
              title="Close this form and return to Forms Hub"
              style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#e11d48', fontWeight: 750, fontSize: '12px', padding: '7px 10px' }}
            >
              <X size={14} /> Close
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE EQUIPMENT / PRODUCT OUTPUT BANNER (VISIBLE AT STAGE 6 SIGNOFF OR WHEN READY) */}
      {(activeStep === 5 || job.status === 'READY' || job.status === 'CLOSED' || job.status === 'DISPATCHED' || Boolean(job.signoff?.repairedBy)) && (
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)',
        border: '1.5px solid #99f6e4',
        borderLeft: '5px solid #0f766e',
        borderRadius: '14px',
        padding: '14px 20px',
        marginBottom: '18px',
        boxShadow: '0 4px 16px -2px rgba(15, 118, 110, 0.10)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
            color: '#ffffff',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            boxShadow: '0 3px 10px rgba(15, 118, 110, 0.3)'
          }}>
            <Wrench size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#0f766e' }}>
                Active Equipment Under Service ({job.products.length})
              </span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                • Job #{job.jobNo}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '6px' }}>
              {job.products.map((p, i) => (
                <span key={p.id || i} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#0f172a',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                  <b style={{ color: '#0f172a', fontWeight: 750 }}>{p.productName?.trim() || 'Equipment Under Service'}</b>
                  {p.makeModel && <span style={{ color: '#0f766e', fontSize: '12px', fontWeight: 700 }}>({p.makeModel})</span>}
                  {p.serialNo && <span style={{ color: '#64748b', fontSize: '11px' }}>S/N: {p.serialNo}</span>}
                  <span style={{
                    background: '#047857',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '5px',
                    fontSize: '11px',
                    fontWeight: 800
                  }}>
                    ₹{Number(p.repairEstimate || 0).toFixed(2)}
                  </span>
                  <span style={{
                    background: p.status === 'READY' ? '#dcfce7' : p.status === 'REPAIRING' ? '#ede9fe' : '#e0f2fe',
                    color: p.status === 'READY' ? '#15803d' : p.status === 'REPAIRING' ? '#6d28d9' : '#0369a1',
                    padding: '2px 8px',
                    borderRadius: '5px',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    letterSpacing: '0.3px'
                  }}>
                    {p.status || 'RECEIVED'}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginLeft: 'auto' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Service Estimate
            </span>
            <b style={{ fontSize: '19px', color: '#047857', fontWeight: 850 }}>
              ₹ {job.totals.totalEstimate.toFixed(2)}
            </b>
          </div>
          {activeStep !== 1 && (
            <button
              type="button"
              onClick={() => goToStep(1)}
              style={{
                background: '#047857',
                border: '1px solid #065f46',
                color: '#ffffff',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 750,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(4, 120, 87, 0.25)',
                transition: 'all 0.15s ease'
              }}
              title="Jump to Step 2: Products & Pricing"
            >
              Edit Equipment →
            </button>
          )}
        </div>
      </div>
      )}

      {message && <div className="notice success">{message}</div>}

      {/* Draft Saved Banner with Instant Close Option */}
      {draftSaveNotice && (
        <div style={{
          background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
          border: '1.5px solid #86efac',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 4px 14px rgba(5, 150, 105, 0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#059669',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0
            }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#065f46' }}>
                Draft Saved Successfully for Job #{job.jobNo}!
              </div>
              <div style={{ fontSize: '12px', color: '#047857' }}>
                Saved to your records and synced across devices. You can close this form now or keep editing.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleSaveAndClose}
              style={{
                background: '#059669',
                color: '#ffffff',
                border: 'none',
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 750,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
              }}
            >
              <LogOut size={14} /> Close Form Now
            </button>
            <button
              type="button"
              onClick={() => setDraftSaveNotice(false)}
              style={{
                background: '#ffffff',
                color: '#475569',
                border: '1px solid #cbd5e1',
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Keep Editing
            </button>
          </div>
        </div>
      )}

      {/* Multi-Role Operational Pipeline (Intake -> Aravindh Real-Time Acceptance & Repair -> Take Product Handover) */}
      <ServiceWorkflowPipeline
        job={job}
        currentUser={currentUserEmail}
        onSendToAravindh={handleSendToAravindh}
        onConfirmBranchPickup={handleConfirmBranchPickup}
        onAravindhAccept={handleAravindhAccept}
        onAravindhSubmitScopeToPriya={handleAravindhSubmitScopeToPriya}
        onSenthilSubmitRepairWork={handleSenthilSubmitRepairWork}
        onPriyaSubmitPriceToMd={handlePriyaSubmitPriceToMd}
        onMdApprovePrice={handleMdApprovePrice}
        onPriyaCompleteDeliveryAndQuotation={handlePriyaCompleteDeliveryAndQuotation}
        onOpenQuotation={() => setShowQuotation(true)}
      />

      {isSenthil ? (
        <div className="nunes-form-card" style={{ marginTop: '16px', background: '#f8fafc', border: '1.5px solid #cbd5e1' }}>
          <div className="nunes-card-head" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>🛠️ Senthil Technical Repair Station</h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                Job #{job.jobNo} — Mechanical teardown, replacement of seals/sensors, calibration &amp; proof documentation.
              </p>
            </div>
            <span className="nunes-status-pill">{job.status}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <small style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Equipment Name</small>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {job.products?.[0]?.productName || 'Service Equipment'}
              </div>
            </div>
            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <small style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Make &amp; Model</small>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#334155', marginTop: '2px' }}>
                {job.products?.[0]?.makeModel || 'Standard Model'}
              </div>
            </div>
            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <small style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Serial Number</small>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#047857', marginTop: '2px', fontFamily: 'monospace' }}>
                {job.products?.[0]?.serialNo || 'N/A'}
              </div>
            </div>
            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
              <small style={{ fontSize: '10.5px', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase' }}>Customer Reported Fault / Complaint</small>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', marginTop: '4px', background: '#fef2f2', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                {job.products?.[0]?.complaint || 'General service, sensor calibration, and physical inspection requested.'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn"
              onClick={handleSaveAndClose}
              style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 700 }}
            >
              <LogOut size={14} /> Close Station
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stepper */}
          <div className="nunes-stepper">
        {visibleSteps.map((s, idx) => {
          const isCompleted = idx < activeStep;
          const isActive = idx === activeStep;
          return (
            <button
              key={s.key}
              type="button"
              className={`nunes-step-btn ${isActive ? 'active' : ''}`}
              onClick={() => goToStep(idx)}
              style={isCompleted ? { color: '#047857', background: '#f0fdf4', borderColor: '#bbf7d0' } : undefined}
            >
              <span className="nunes-step-num" style={isCompleted ? { background: '#059669', color: '#ffffff' } : undefined}>
                {isCompleted ? <Check size={12} strokeWidth={3} /> : idx + 1}
              </span>
              <span>{s.label.split('. ')[1]}</span>
            </button>
          );
        })}
      </div>

      {/* Form Card */}
      <div className="nunes-form-card">
        <div className="nunes-card-head">
          <h2>{visibleSteps[activeStep]?.title || visibleSteps[0]?.title}</h2>
          <span className="nunes-status-pill">{job.status}</span>
        </div>

        <PageTransition pageKey={activeStep} effect="slide" direction={direction}>
        {/* STEP 1: CUSTOMER */}
        {activeStep === 0 && (
          <div className="nunes-form-fields">
            <div className="nunes-grid3">
              <label>
                Company / Customer Name *:
                <input value={job.customer.name} onChange={e => updateCustomer('name', e.target.value)} placeholder="" />
              </label>
              <label>
                Contact Person:
                <input value={job.customer.contactPerson} onChange={e => updateCustomer('contactPerson', e.target.value)} placeholder="" />
              </label>
              <label>
                Phone Number:
                <input value={job.customer.phone} onChange={e => updateCustomer('phone', e.target.value)} placeholder="" />
              </label>
            </div>

            <div className="nunes-grid3">
              <label>
                Email Address:
                <input type="email" value={job.customer.email} onChange={e => updateCustomer('email', e.target.value)} placeholder="" />
              </label>
              <label>
                City:
                <input value={job.customer.city} onChange={e => updateCustomer('city', e.target.value)} placeholder="" />
              </label>
              <label>
                State:
                <input value={job.customer.state} onChange={e => updateCustomer('state', e.target.value)} placeholder="" />
              </label>
            </div>

            <div className="nunes-grid3">
              <label>
                Complete Address:
                <input value={job.customer.address} onChange={e => updateCustomer('address', e.target.value)} placeholder="" />
              </label>
              <label>
                GSTIN Number:
                <input value={job.customer.gstin} onChange={e => updateCustomer('gstin', e.target.value)} placeholder="" />
              </label>
              <label>
                Date *:
                <input
                  type="date"
                  value={job.customer.date || job.jobDate || (typeof window !== 'undefined' ? new Date().toISOString().slice(0, 10) : '')}
                  onChange={e => updateCustomer('date', e.target.value)}
                  title="Customer / Inward Entry Date"
                  required
                />
              </label>
            </div>

            {/* Branch Office Delivery Selector (Suganya & Radha Branch ONLY - Completely Hidden from Sabitha & Rekha) */}
            {(!isMainOfficeIntake && (isBranchStaff || isAdminOrMd)) && (
              <div style={{
                marginTop: '14px',
                padding: '12px 16px',
                background: job.workflow?.isBranchDelivery ? '#fffbeb' : '#f8fafc',
                border: job.workflow?.isBranchDelivery ? '1.5px solid #fcd34d' : '1px solid #e2e8f0',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: job.workflow?.isBranchDelivery ? '#92400e' : '#1e293b' }}>
                    🏢 Other Office / Branch Office Intake (Suganya &amp; Radha)
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Check this if customer dropped equipment at branch office. Aravindh will pick it up and transport to Main Office workshop.
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '12px', color: job.workflow?.isBranchDelivery ? '#b45309' : '#475569' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(job.workflow?.isBranchDelivery)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setJob(prev => ({
                        ...prev,
                        workflow: {
                          ...(prev.workflow || { stage: 'INTAKE_RECEIVED' as WorkflowStage }),
                          isBranchDelivery: checked,
                          branchOfficeName: checked ? 'Other Office / Branch Office' : undefined,
                        }
                      }));
                    }}
                    style={{ width: '16px', height: '16px', accentColor: '#b45309', cursor: 'pointer' }}
                  />
                  <span>{job.workflow?.isBranchDelivery ? '✓ Branch Delivery (Aravindh Pickup Needed)' : 'Main Office Walk-in / Courier'}</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PRODUCT DETAILS */}
        {activeStep === 1 && (
          <div className="nunes-form-fields">
            <div className="nunes-items-head">
              <h3>Equipment Under Service</h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {isAdminOrMd && (
                  <button
                    type="button"
                    className="btn mini-btn"
                    onClick={() => setShowAddOlderModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 800,
                      boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)',
                    }}
                    title="Add a historical paper form with manual price entry and file attachments"
                  >
                    <Plus size={13} /> Add Older Form
                  </button>
                )}
                <button type="button" className="btn mini-btn" onClick={addProduct}>
                  <Plus size={13} /> Add Equipment
                </button>
              </div>
            </div>

            {job.products.map((p, idx) => (
              <div key={p.id} className="nunes-product-box">
                <div className="nunes-product-box-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <b>Equipment #{idx + 1}</b>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {job.products.length > 1 && (
                      <button type="button" className="iconButton danger" onClick={() => removeProduct(idx)} title="Remove this equipment">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                    marginTop: '10px',
                  }}
                >
                  <label style={{ flex: '2 1 240px' }}>
                    Product Name *:
                    <input
                      value={p.productName}
                      onChange={e => updateProduct(idx, { productName: e.target.value })}
                      placeholder="e.g. Digital Pressure Gauge"
                      required
                    />
                  </label>
                  <label style={{ flex: '1.5 1 180px' }}>
                    Make / Model:
                    <input
                      value={p.makeModel}
                      onChange={e => updateProduct(idx, { makeModel: e.target.value })}
                      placeholder="e.g. Ashcroft D1005"
                    />
                  </label>
                  <label style={{ flex: '1.5 1 180px' }}>
                    Serial Number:
                    <input
                      value={p.serialNo}
                      onChange={e => updateProduct(idx, { serialNo: e.target.value })}
                      placeholder="S/N from nameplate"
                    />
                  </label>
                  <label style={{ flex: '0.8 1 90px' }}>
                    Qty:
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={p.qty || 1}
                      onChange={e => updateProduct(idx, { qty: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                      placeholder="1"
                      style={{ textAlign: 'center', fontWeight: 700 }}
                    />
                  </label>
                </div>

                <div className="nunes-grid2" style={{ marginTop: '10px' }}>
                  <label>
                    Reported Complaint:
                    <input
                      value={p.complaint}
                      onChange={e => updateProduct(idx, { complaint: e.target.value })}
                      placeholder="e.g. Display blinking / No output reading"
                    />
                  </label>
                  <label>
                    Repair Work to Carry Out:
                    <input
                      value={p.repairWork}
                      onChange={e => updateProduct(idx, { repairWork: e.target.value })}
                      placeholder="e.g. Sensor PCB replacement & calibration"
                    />
                  </label>
                </div>

                {/* Admin-Only Manual Price Entry for Older Forms & Direct Commercial Estimation */}
                {isAdminOrMd && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                      border: '1.5px solid #86efac',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#166534' }}>
                        <IndianRupee size={14} style={{ color: '#059669' }} />
                        <span>Admin Manual Price Entry (For Older Forms &amp; Direct Quotation)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, border: '1px solid #86efac' }}>
                          ADMIN / MD ONLY
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCatalogTargetIdx(idx);
                            setShowCatalogModal(true);
                          }}
                          style={{
                            background: '#ffffff',
                            color: '#0f766e',
                            border: '1.5px solid #0d9488',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 750,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                          }}
                          title="Open Equipment Catalog / Benchmark to look up or select authentic market value"
                        >
                          <Search size={12} style={{ color: '#0d9488' }} />
                          <span>Open Product Value</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const val = Number(p.productValue || p.onlinePrice || 0);
                            if (!val || val <= 0) {
                              setCatalogTargetIdx(idx);
                              setShowCatalogModal(true);
                              setMessage('ℹ️ Enter Original Product Price or select from catalog first to auto-fill estimate.');
                              setTimeout(() => setMessage(''), 4000);
                              return;
                            }
                            const quote = Math.round(val * 0.30);
                            const labor = Math.round(val * 0.20);
                            const spares = Math.round(val * 0.10);
                            updateProduct(idx, {
                              repairEstimate: quote,
                              repairPercent: 30,
                            });
                            const updatedProducts = [...job.products];
                            updatedProducts[idx] = {
                              ...updatedProducts[idx],
                              repairEstimate: quote,
                              repairPercent: 30,
                            };
                            const sumEstimate = updatedProducts.reduce((acc, curr) => acc + (Number(curr.repairEstimate) || 0), 0);
                            setJob(prev => ({
                              ...prev,
                              totals: {
                                ...prev.totals,
                                totalEstimate: sumEstimate,
                                totalEstimateManual: true,
                                repairEstimate: sumEstimate,
                              },
                              workflow: {
                                ...(prev.workflow || { stage: 'JOB_COMPLETED' as WorkflowStage }),
                                customApprovedPrice: sumEstimate,
                                mdApprovedPrice: sumEstimate,
                                mdConfirmedPrice: sumEstimate,
                                priyaTotalQuotationAmount: sumEstimate,
                                priyaServiceCharge: labor,
                                priyaSparePartsCost: spares,
                                approvedByMd: true,
                                mdApprovedAt: new Date().toISOString(),
                              }
                            }));
                            setMessage(`✓ Auto-filled: Quoted ₹${quote.toLocaleString('en-IN')} (30% standard service of original product value ₹${val.toLocaleString('en-IN')})`);
                            setTimeout(() => setMessage(''), 3500);
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 11px',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 4px rgba(5,150,105,0.25)',
                          }}
                          title="Check product value and auto-fill recommended service charges and final estimate"
                        >
                          <Sparkles size={12} />
                          <span>Check &amp; Auto-Fill Value</span>
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                      {/* Original Product Price / Market Value */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 800, color: '#0f766e', margin: 0 }}>
                            Original Product Price (₹)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setCatalogTargetIdx(idx);
                              setShowCatalogModal(true);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              fontSize: '10px',
                              color: '#0d9488',
                              fontWeight: 700,
                              cursor: 'pointer',
                              textDecoration: 'underline',
                            }}
                          >
                            Lookup Value
                          </button>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={p.productValue || p.onlinePrice || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const curEst = p.repairEstimate;
                            updateProduct(idx, { productValue: val, onlinePrice: val, onlinePriceConfirmed: true, ...(curEst ? { repairEstimate: curEst } : {}) });
                            const updatedProducts = [...job.products];
                            updatedProducts[idx] = { 
                              ...updatedProducts[idx], 
                              productValue: val, 
                              onlinePrice: val, 
                              onlinePriceConfirmed: true,
                              ...(curEst ? { repairEstimate: curEst } : {})
                            };
                            const sumVal = updatedProducts.reduce((acc, curr) => acc + (Number(curr.productValue) || 0), 0);
                            setJob(prev => ({
                              ...prev,
                              totals: {
                                ...prev.totals,
                                productValue: sumVal,
                              }
                            }));
                          }}
                          placeholder="e.g. 25000"
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            border: '1.5px solid #14b8a6',
                            fontSize: '13px',
                            fontWeight: 750,
                            color: '#0f766e',
                            background: '#ffffff',
                          }}
                        />
                        <span style={{ fontSize: '10px', color: '#0d9488', fontWeight: 600 }}>New machine catalog value</span>
                      </div>

                      {/* Final Quoted / Approved Price */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#166534', marginBottom: '3px' }}>
                          Final Quoted / Approved Price (₹) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={p.repairEstimate || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updateProduct(idx, { repairEstimate: val });
                            const updatedProducts = [...job.products];
                            updatedProducts[idx] = { ...updatedProducts[idx], repairEstimate: val };
                            const sumEstimate = updatedProducts.reduce((acc, curr) => acc + (Number(curr.repairEstimate) || 0), 0);
                            setJob(prev => ({
                              ...prev,
                              totals: {
                                ...prev.totals,
                                totalEstimate: sumEstimate,
                                totalEstimateManual: true,
                                repairEstimate: sumEstimate,
                              },
                              workflow: {
                                ...(prev.workflow || { stage: 'JOB_COMPLETED' as WorkflowStage }),
                                customApprovedPrice: sumEstimate,
                                mdApprovedPrice: sumEstimate,
                                mdConfirmedPrice: sumEstimate,
                                priyaTotalQuotationAmount: sumEstimate,
                                approvedByMd: true,
                                mdApprovedAt: new Date().toISOString(),
                              }
                            }));
                          }}
                          placeholder="e.g. 3500"
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            border: '1.5px solid #059669',
                            fontSize: '14px',
                            fontWeight: 800,
                            color: '#065f46',
                            background: '#ffffff',
                          }}
                        />
                        <span style={{ fontSize: '10px', color: '#15803d', fontWeight: 600 }}>Total price for this older equipment</span>
                      </div>

                      {/* Service / Labor Charges */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                          Service / Labor Charges (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={job.workflow?.priyaServiceCharge || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setJob(prev => ({
                              ...prev,
                              workflow: {
                                ...(prev.workflow || { stage: 'JOB_COMPLETED' as WorkflowStage }),
                                priyaServiceCharge: val,
                              }
                            }));
                          }}
                          placeholder="e.g. 2500"
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#ffffff' }}
                        />
                      </div>

                      {/* Spare Parts Cost */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                          Spare Parts Cost (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={job.workflow?.priyaSparePartsCost || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setJob(prev => ({
                              ...prev,
                              workflow: {
                                ...(prev.workflow || { stage: 'JOB_COMPLETED' as WorkflowStage }),
                                priyaSparePartsCost: val,
                              }
                            }));
                          }}
                          placeholder="e.g. 1000"
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#ffffff' }}
                        />
                      </div>

                      {/* Discount */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                          Discount (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={p.discount || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updateProduct(idx, { discount: val });
                            setJob(prev => ({
                              ...prev,
                              totals: {
                                ...prev.totals,
                                discount: val,
                              },
                              workflow: {
                                ...(prev.workflow || { stage: 'JOB_COMPLETED' as WorkflowStage }),
                                priyaDiscount: val,
                              }
                            }));
                          }}
                          placeholder="0"
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#ffffff' }}
                        />
                      </div>
                    </div>

                    {/* Quick percentage pills */}
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #86efac', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '10.5px', color: '#166534', fontWeight: 700 }}>
                        Quick Auto-Fill from Value:
                      </span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {[
                          { pct: 30, label: '30% Standard Service' },
                          { pct: 50, label: '50% Major Overhaul' },
                          { pct: 70, label: '70% Complete Rebuild' },
                        ].map(({ pct, label }) => {
                          const val = Number(p.productValue || p.onlinePrice || 0);
                          const calculated = Math.round(val * (pct / 100));
                          return (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => {
                                if (!val || val <= 0) {
                                  setCatalogTargetIdx(idx);
                                  setShowCatalogModal(true);
                                  setMessage('ℹ️ Enter Original Product Price or select from catalog first.');
                                  setTimeout(() => setMessage(''), 3000);
                                  return;
                                }
                                const labor = Math.round(calculated * 0.65);
                                const spares = calculated - labor;
                                updateProduct(idx, {
                                  repairEstimate: calculated,
                                  repairPercent: pct,
                                });
                                const updatedProducts = [...job.products];
                                updatedProducts[idx] = {
                                  ...updatedProducts[idx],
                                  repairEstimate: calculated,
                                  repairPercent: pct,
                                };
                                const sumEstimate = updatedProducts.reduce((acc, curr) => acc + (Number(curr.repairEstimate) || 0), 0);
                                setJob(prev => ({
                                  ...prev,
                                  totals: {
                                    ...prev.totals,
                                    totalEstimate: sumEstimate,
                                    totalEstimateManual: true,
                                    repairEstimate: sumEstimate,
                                  },
                                  workflow: {
                                    ...(prev.workflow || { stage: 'JOB_COMPLETED' as WorkflowStage }),
                                    customApprovedPrice: sumEstimate,
                                    mdApprovedPrice: sumEstimate,
                                    mdConfirmedPrice: sumEstimate,
                                    priyaTotalQuotationAmount: sumEstimate,
                                    priyaServiceCharge: labor,
                                    priyaSparePartsCost: spares,
                                    approvedByMd: true,
                                    mdApprovedAt: new Date().toISOString(),
                                  }
                                }));
                                setMessage(`✓ Applied ${pct}%: Quoted ₹${calculated.toLocaleString('en-IN')} (Labor ₹${labor}, Spares ₹${spares})`);
                                setTimeout(() => setMessage(''), 3500);
                              }}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #86efac',
                                color: '#166534',
                                padding: '2px 8px',
                                borderRadius: '5px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                              title={`Auto-fill ${label} (₹${calculated > 0 ? calculated.toLocaleString('en-IN') : '...'})`}
                            >
                              ⚡ {pct}% {val > 0 ? `(₹${calculated.toLocaleString('en-IN')})` : ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Step 2 File Attachments / Technical Documentation & Scanned Older Forms */}
            <div style={{ marginTop: '16px', padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1.5px dashed #cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Paperclip size={16} style={{ color: '#2563eb' }} />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                    Attach Scanned Older Forms &amp; Technical Files
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    (PDF, Scanned paper, Photos, Calibration docs)
                  </span>
                </div>

                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#2563eb',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}>
                  <Upload size={13} />
                  <span>Upload Files</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt"
                    onChange={(e) => handleFileUpload(e, 'OLDER_FORM', 'Technical Inspection & Older Form')}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {job.attachments && job.attachments.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                  {job.attachments.map((att) => (
                    <div
                      key={att.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        <FileText size={16} style={{ color: '#2563eb', flexShrink: 0 }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={att.fileName}>
                            {att.fileName}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                            {(att.size / 1024).toFixed(0)} KB • {att.tag || 'Scanned Form'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                        <a
                          href={att.storedName}
                          download={att.fileName}
                          target="_blank"
                          rel="noreferrer"
                          style={{ padding: '4px', color: '#2563eb', textDecoration: 'none' }}
                          title="Download / View"
                        >
                          <Download size={13} />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                          title="Delete file"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '8px' }}>
                  No older forms or files attached yet. Click &quot;Upload Files&quot; to attach scanned documents.
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: RECEIPT */}
        {activeStep === 2 && (
          <div className="nunes-form-fields">
            <div className="nunes-grid3">
              <label>
                MR Number:
                <input value={job.receipt.mrNo} onChange={e => updateReceipt('mrNo', e.target.value)} placeholder="" />
              </label>
              <label>
                MR Date:
                <input type="date" value={job.receipt.mrDate} onChange={e => updateReceipt('mrDate', e.target.value)} />
              </label>
              <label>
                Receipt Mode *:
                <select
                  value={job.receipt.mode === 'OTHER' ? 'FIELD_PICKUP' : job.receipt.mode}
                  onChange={e => updateReceipt('mode', e.target.value as any)}
                  style={{ fontWeight: 700 }}
                >
                  <option value="COURIER">📦 Courier / Parcel</option>
                  <option value="DIRECT">🤝 Direct Handover (Walk-in)</option>
                  <option value="FIELD_PICKUP">🚗 Field Pickup (Collected from Client)</option>
                </select>
              </label>
            </div>

            {/* DYNAMIC MODE DETAILS: COURIER / PARCEL */}
            {job.receipt.mode === 'COURIER' && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderLeft: '4px solid #2563eb',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginTop: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e3a8a', fontWeight: 800, fontSize: '13px' }}>
                  <span>📦</span>
                  <span>Courier &amp; Parcel Delivery Information</span>
                </div>

                <div className="nunes-grid3">
                  <label>
                    Courier Partner / Service *:
                    <input
                      list="courierPartnersList"
                      value={job.receipt.courierName || ''}
                      onChange={e => {
                        const name = e.target.value;
                        const dock = job.receipt.docketNo || '';
                        updateReceipt('courierName', name);
                        updateReceipt('reference', `Courier: ${name} ${dock ? `(#${dock})` : ''}`.trim());
                      }}
                      placeholder="e.g. ST Courier, Professional, DTDC, Blue Dart..."
                      required
                    />
                    <datalist id="courierPartnersList">
                      <option value="ST Courier" />
                      <option value="The Professional Couriers (TPC)" />
                      <option value="DTDC Express" />
                      <option value="Blue Dart Express" />
                      <option value="Speed Post (India Post)" />
                      <option value="Delhivery" />
                      <option value="Trackon Couriers" />
                      <option value="Frans Express" />
                    </datalist>
                  </label>

                  <label>
                    Docket / Waybill / Tracking No *:
                    <input
                      value={job.receipt.docketNo || ''}
                      onChange={e => {
                        const dock = e.target.value;
                        const name = job.receipt.courierName || '';
                        updateReceipt('docketNo', dock);
                        updateReceipt('reference', `Courier: ${name} (#${dock})`.trim());
                      }}
                      placeholder="e.g. STC-89234120"
                      required
                    />
                  </label>

                  <label>
                    Parcel Booking / Arrival Date:
                    <input
                      type="date"
                      value={job.receipt.courierDate || job.receipt.mrDate}
                      onChange={e => updateReceipt('courierDate', e.target.value)}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* DYNAMIC MODE DETAILS: DIRECT HANDOVER (WALK-IN) */}
            {job.receipt.mode === 'DIRECT' && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderLeft: '4px solid #0f766e',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginTop: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f766e', fontWeight: 800, fontSize: '13px' }}>
                    <span>🤝</span>
                    <span>Direct Handover (Walk-in Customer Representative)</span>
                  </div>
                  {(job.customer.contactPerson || job.customer.name) && (
                    <button
                      type="button"
                      onClick={() => {
                        const custName = job.customer.contactPerson || job.customer.name;
                        const phone = job.customer.phone || '';
                        updateReceipt('personName', custName);
                        if (phone) updateReceipt('personPhone', phone);
                        updateReceipt('reference', `Direct Handover by ${custName} ${phone ? `(Ph: ${phone})` : ''}`.trim());
                        setMessage(`✓ Synced walk-in person to Customer: ${custName}`);
                        setTimeout(() => setMessage(''), 3000);
                      }}
                      style={{
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        color: '#166534',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                      }}
                      title="Click to automatically populate with Customer Name & Phone from Step 1"
                    >
                      <span>🔄 Same as Customer ({job.customer.contactPerson || job.customer.name})</span>
                    </button>
                  )}
                </div>

                {/* Walk-in Customer Auto-sync Context Banner */}
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '11.5px',
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '13px' }}>✓</span>
                  <span>
                    <strong>Walk-in Handover Logic:</strong> Automatically pre-filled with Customer Contact (<strong>{job.customer.contactPerson || job.customer.name || 'Customer'}</strong>) and Phone (<strong>{job.customer.phone || 'None'}</strong>). You can keep as-is or edit below if an alternate representative delivered the unit.
                  </span>
                </div>

                <div className="nunes-grid2">
                  <label>
                    Handed Over By (Person Name) *:
                    <input
                      value={job.receipt.personName || ''}
                      onChange={e => {
                        const pName = e.target.value;
                        const phone = job.receipt.personPhone || '';
                        updateReceipt('personName', pName);
                        updateReceipt('reference', `Direct Handover by ${pName} ${phone ? `(Ph: ${phone})` : ''}`.trim());
                      }}
                      placeholder={job.customer.contactPerson || job.customer.name || "Full name of representative who delivered the equipment"}
                      required
                    />
                  </label>

                  <label>
                    Person Contact Phone:
                    <input
                      value={job.receipt.personPhone || ''}
                      onChange={e => {
                        const phone = e.target.value;
                        const pName = job.receipt.personName || '';
                        updateReceipt('personPhone', phone);
                        updateReceipt('reference', `Direct Handover by ${pName} (Ph: ${phone})`.trim());
                      }}
                      placeholder={job.customer.phone || "e.g. +91 98420 12345"}
                    />
                  </label>
                </div>

                <label>
                  Purpose / Reason for Handover (Why given for service) *:
                  <input
                    value={job.receipt.handoverReason || ''}
                    onChange={e => updateReceipt('handoverReason', e.target.value)}
                    placeholder="e.g. Annual calibration before audit, Needle stuck at 150 bar, Display error inspection..."
                  />
                </label>
              </div>
            )}

            {/* DYNAMIC MODE DETAILS: FIELD PICKUP */}
            {(job.receipt.mode === 'FIELD_PICKUP' || job.receipt.mode === 'OTHER') && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderLeft: '4px solid #d97706',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginTop: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 800, fontSize: '13px' }}>
                  <span>🚗</span>
                  <span>Field Pickup (Collected from Customer Premises by Nunes Staff)</span>
                </div>

                <div className="nunes-grid3">
                  <label>
                    Picked Up By (Nunes Engineer / Staff) *:
                    <input
                      value={job.receipt.pickedUpBy || ''}
                      onChange={e => {
                        const staff = e.target.value;
                        const client = job.receipt.clientContactPerson || '';
                        updateReceipt('pickedUpBy', staff);
                        updateReceipt('reference', `Field Pickup by ${staff} from ${client}`.trim());
                      }}
                      placeholder="e.g. Aravindh (Service Engg), Driver name..."
                      required
                    />
                  </label>

                  <label>
                    Client Representative at Site *:
                    <input
                      value={job.receipt.clientContactPerson || ''}
                      onChange={e => {
                        const client = e.target.value;
                        const staff = job.receipt.pickedUpBy || '';
                        updateReceipt('clientContactPerson', client);
                        updateReceipt('reference', `Field Pickup by ${staff} from ${client}`.trim());
                      }}
                      placeholder="Person who handed over at client factory"
                    />
                  </label>

                  <label>
                    Client Contact Phone:
                    <input
                      value={job.receipt.clientPhone || ''}
                      onChange={e => updateReceipt('clientPhone', e.target.value)}
                      placeholder="e.g. +91 98421 23456"
                    />
                  </label>
                </div>

                <div className="nunes-grid2">
                  <label>
                    Pickup Location / Site Address:
                    <input
                      value={job.receipt.pickupLocation || ''}
                      onChange={e => updateReceipt('pickupLocation', e.target.value)}
                      placeholder="e.g. Plant Unit 2, Mettupalayam Road, Coimbatore"
                    />
                  </label>

                  <label>
                    Purpose / Reason for Pickup *:
                    <input
                      value={job.receipt.pickupReason || ''}
                      onChange={e => updateReceipt('pickupReason', e.target.value)}
                      placeholder="e.g. Scheduled annual contract pickup, breakdown emergency..."
                    />
                  </label>
                </div>
              </div>
            )}

            <label style={{ marginTop: '10px' }}>
              Receipt Reference / Delivery Note / Tracking Summary:
              <input
                value={job.receipt.reference || ''}
                onChange={e => updateReceipt('reference', e.target.value)}
                placeholder="Combined reference for delivery challans & reports"
              />
            </label>
          </div>
        )}

        {/* STEP 4: DISPATCH */}
        {activeStep === 3 && (
          <div className="nunes-form-fields">
            <div className="nunes-grid3">
              <label>
                Tested By:
                <input value={job.dispatch.testedBy} onChange={e => updateDispatch('testedBy', e.target.value)} placeholder="Technician name" />
              </label>
              <label>
                DC Number:
                <input value={job.dispatch.dcNo} onChange={e => updateDispatch('dcNo', e.target.value)} placeholder="" />
              </label>
              <label>
                DC Date:
                <input type="date" value={job.dispatch.dcDate} onChange={e => updateDispatch('dcDate', e.target.value)} />
              </label>
            </div>

            <div className="nunes-grid2">
              <label>
                Mode of Despatch:
                <input value={job.dispatch.mode} onChange={e => updateDispatch('mode', e.target.value)} placeholder="" />
              </label>
              <label>
                Despatch Reference:
                <input value={job.dispatch.reference} onChange={e => updateDispatch('reference', e.target.value)} placeholder="" />
              </label>
            </div>
          </div>
        )}

        {/* STEP 5: PAYMENT */}
        {activeStep === 4 && (
          <div className="nunes-form-fields">
            <div className="nunes-grid3">
              <label>
                Invoice Number:
                <input value={job.payment.invoiceNo} onChange={e => updatePayment('invoiceNo', e.target.value)} placeholder="" />
              </label>
              <label>
                Invoice Date:
                <input type="date" value={job.payment.invoiceDate} onChange={e => updatePayment('invoiceDate', e.target.value)} />
              </label>
              <label>
                Payment Mode:
                <input value={job.payment.mode} onChange={e => updatePayment('mode', e.target.value)} placeholder="" />
              </label>
            </div>

            <div className="nunes-grid2">
              <label>
                Payment Reference / UTR:
                <input value={job.payment.reference} onChange={e => updatePayment('reference', e.target.value)} placeholder="" />
              </label>
              <label>
                Payment Received By:
                <input value={job.payment.receivedBy} onChange={e => updatePayment('receivedBy', e.target.value)} placeholder="" />
              </label>
            </div>
          </div>
        )}

        {/* STEP 6: SIGNOFF */}
        {activeStep === 5 && (
          <div className="nunes-form-fields">
            <div className="nunes-grid4">
              <label>
                Received By:
                <input value={job.signoff.receivedBy} onChange={e => updateSignoff('receivedBy', e.target.value)} />
              </label>
              <label>
                Inspected By:
                <input value={job.signoff.inspectedBy} onChange={e => updateSignoff('inspectedBy', e.target.value)} />
              </label>
              <label>
                Estimate Confirmed By:
                <input value={job.signoff.estimateConfirmedBy} onChange={e => updateSignoff('estimateConfirmedBy', e.target.value)} />
              </label>
              <label>
                Repaired By:
                <input value={job.signoff.repairedBy} onChange={e => updateSignoff('repairedBy', e.target.value)} />
              </label>
            </div>

            <div className="nunes-grid2">
              <label>
                Overall Service Job Status:
                <select value={job.status} onChange={e => setJob(prev => ({ ...prev, status: e.target.value as JobStatus }))}>
                  <option value="DRAFT">DRAFT</option>
                  <option value="RECEIVED">RECEIVED</option>
                  <option value="ESTIMATE_PENDING">ESTIMATE PENDING</option>
                  <option value="APPROVAL_PENDING">APPROVAL PENDING</option>
                  <option value="REPAIRING">REPAIRING</option>
                  <option value="READY">READY</option>
                  <option value="DISPATCHED">DISPATCHED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </label>
              <label>
                Branch:
                <input value={job.branchName} onChange={e => setJob(prev => ({ ...prev, branchName: e.target.value }))} />
              </label>
            </div>

            <label>
              Technical Observations &amp; Service Notes:
              <textarea
                rows={3}
                value={job.notes}
                onChange={e => setJob(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Component part numbers replaced, test calibration results..."
              />
            </label>

            {/* STEP 6 FILE ATTACHMENTS & OLDER FORMS ARCHIVE */}
            <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Paperclip size={18} style={{ color: '#0f766e' }} />
                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Attach Files &amp; Scanned Older Forms Archive
                    </h3>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>
                    Attach paper intake sheets, older warranty receipts, calibration certificates, and customer documents.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <select
                    value={selectedAttachmentCategory}
                    onChange={(e) => setSelectedAttachmentCategory(e.target.value as ProofCategory)}
                    style={{ fontSize: '12px', fontWeight: 700, padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff' }}
                  >
                    <option value="OLDER_FORM">📁 Scanned Older Form</option>
                    <option value="INSPECTION">🔧 Technical Inspection</option>
                    <option value="RECEIPT">📄 Material Receipt / PO</option>
                    <option value="CUSTOMER_APPROVAL">🤝 Customer Approval Doc</option>
                    <option value="OTHER">📝 Other Document</option>
                  </select>

                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 750,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(15, 118, 110, 0.25)'
                  }}>
                    <Upload size={14} />
                    <span>Choose Files to Attach</span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt"
                      onChange={(e) => handleFileUpload(e)}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {job.attachments && job.attachments.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                  {job.attachments.map((att) => (
                    <div
                      key={att.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: '#f0fdfa',
                          color: '#0f766e',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0
                        }}>
                          <FileText size={16} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 750, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={att.fileName}>
                            {att.fileName}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '6px', marginTop: '2px' }}>
                            <span>{(att.size / 1024).toFixed(0)} KB</span>
                            <span>•</span>
                            <span style={{ color: '#0f766e', fontWeight: 700 }}>
                              {att.category === 'OLDER_FORM' ? 'Older Form' : att.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                        <a
                          href={att.storedName}
                          download={att.fileName}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '6px 8px',
                            background: '#f1f5f9',
                            color: '#0f766e',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '11.5px',
                            fontWeight: 700
                          }}
                          title="Download / View"
                        >
                          <Download size={13} />
                          <span>View</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          style={{
                            background: '#fff1f2',
                            border: 'none',
                            color: '#e11d48',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '6px'
                          }}
                          title="Delete file"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '12.5px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  No older forms or files attached yet. Click &quot;Choose Files to Attach&quot; to save scanned copies with this job card.
                </div>
              )}
            </div>

            {/* MD EXECUTIVE SIGN-CHECK & COMPLETE CARD */}
            <div style={{
              marginTop: '16px',
              padding: '16px',
              background: '#f0fdf4',
              borderRadius: '12px',
              border: '1.5px solid #86efac',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 800, fontSize: '14px' }}>
                  <CheckCircle2 size={18} />
                  <span>MD Executive Sign-Check &amp; Approval</span>
                </div>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#14532d' }}>
                  Confirm inspection &amp; engineering signcheck. This seals the record and marks it completed in MD Control Tower.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={job.signoff.estimateConfirmedBy || ''}
                  onChange={(e) => updateSignoff('estimateConfirmedBy', e.target.value)}
                  placeholder="MD Name / Signoff Sign"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #86efac',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    outline: 'none',
                    background: '#ffffff'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated: ServiceJob = {
                      ...job,
                      status: 'READY',
                      signoff: {
                        ...job.signoff,
                        estimateConfirmedBy: job.signoff.estimateConfirmedBy || 'MD Executive Signed',
                        repairedBy: job.signoff.repairedBy || 'Technical Bench Completed'
                      },
                      workflow: {
                        ...(job.workflow || { stage: 'JOB_COMPLETED', receivedAt: new Date().toISOString() }),
                        stage: 'JOB_COMPLETED',
                        finalHandoverCompletedAt: new Date().toISOString()
                      },
                      updatedAt: new Date().toISOString()
                    };
                    setJob(updated);
                    saveJobRecordDirect(updated);
                    setCelebrationData({
                      recordNumber: String(updated.jobNo || updated.id),
                      title: 'MD Sign-Check Complete — Job Finished!',
                      subtitle: `Job #${updated.jobNo} has been sign-checked and marked completed for MD Reports.`
                    });
                    setShowCelebration(true);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(22, 101, 52, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Confirm MD Sign-Check &amp; Complete</span>
                </button>
              </div>
            </div>
          </div>
        )}

        </PageTransition>

        {/* Navigation */}
        <div className="nunes-card-footer">
          {activeStep > 0 && (
            <button type="button" className="btn" onClick={() => { setDirection('back'); setActiveStep(s => s - 1); }}>
              <ArrowLeft size={14} /> Back
            </button>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button type="button" className="btn" onClick={handleSaveAndClose} title="Save record and return to Forms Hub">
              <Save size={14} /> Save &amp; Close
            </button>
            {activeStep < visibleSteps.length - 1 ? (
              <button 
                type="button" 
                className="btn primary" 
                onClick={() => saveRecord(true)}
                style={{ background: '#1d4ed8', borderColor: '#1d4ed8', color: '#ffffff', fontWeight: 750, boxShadow: '0 4px 12px rgba(29, 78, 216, 0.2)' }}
              >
                Next Step: {visibleSteps[activeStep + 1]?.label.split('. ')[1]} <ArrowRight size={14} />
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                {isIntakeStaff && !isAdminOrMd ? (
                  <button 
                    type="button" 
                    className="btn primary" 
                    onClick={handleSendToAravindh}
                    style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', borderColor: '#0284c7', color: '#ffffff', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}
                    title="Complete intake and send alert message to Aravindh for Branch Pickup"
                  >
                    <Send size={15} /> Complete Intake &amp; Send to Aravindh
                  </button>
                ) : (
                  <>
                    <button 
                      type="button" 
                      className="btn primary" 
                      onClick={() => saveRecord(true)}
                      style={{ background: '#059669', borderColor: '#059669', color: '#ffffff', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '6px' }}
                      title="Complete this job and move to next new form"
                    >
                      <Check size={16} /> Complete &amp; Start Next Job
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-complete-quote" 
                      onClick={completeAndOpenQuotation}
                      title="Complete service job and generate quotation for WhatsApp Web & Gmail"
                    >
                      <FileCheck size={16} /> Complete &amp; Generate Quotation
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      </>
      )}

      {/* 4-Second Celebratory Fireworks & Auto-Redirect Modal */}
      <FormCompletionCelebration
        isOpen={showCelebration}
        title={celebrationData.title}
        subtitle={celebrationData.subtitle}
        recordNumber={celebrationData.recordNumber}
        durationSeconds={4}
        onRedirectNow={() => {
          setShowCelebration(false);
          startNewJob();
        }}
        onCancel={() => setShowCelebration(false)}
      />

      {/* Product Catalog Picker Modal */}
      {showCatalogModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '820px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 22px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#0f766e', color: '#fff', display: 'grid', placeItems: 'center' }}>
                  <Package size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                    Select Equipment from Product Catalog
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                    Populates name, model, photo, technical specifications, and replacement valuation for Equipment #{catalogTargetIdx + 1}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Bar */}
            <div style={{ padding: '12px 22px', borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '8px 12px' }}>
                <Search size={16} style={{ color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search by instrument name, model, manufacturer, category..."
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px' }}
                />
              </div>
            </div>

            {/* Product List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '12px' }}>
              {getAllProducts()
                .filter(prod => {
                  if (!catalogSearch) return true;
                  const q = catalogSearch.toLowerCase();
                  return prod.name.toLowerCase().includes(q) ||
                         prod.model.toLowerCase().includes(q) ||
                         prod.category.toLowerCase().includes(q) ||
                         prod.specifications.toLowerCase().includes(q);
                })
                .map(prod => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      updateProduct(catalogTargetIdx, {
                        productName: prod.name,
                        makeModel: prod.model,
                        productValue: prod.price,
                        onlinePrice: prod.price,
                        productImageUrl: prod.imageUrl,
                        productSpecifications: prod.specifications
                      });
                      setShowCatalogModal(false);
                      setMessage(`✓ Loaded "${prod.name}" into Equipment #${catalogTargetIdx + 1}`);
                      setTimeout(() => setMessage(''), 3000);
                    }}
                    style={{
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      background: '#ffffff',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#0f766e';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,118,110,0.12)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc', border: '1px solid #cbd5e1', flexShrink: 0 }}>
                      <img src={prod.imageUrl} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 750, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {prod.name}
                        </h4>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f766e', flexShrink: 0 }}>
                          ₹{prod.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                        Model: {prod.model} • {prod.category}
                      </div>
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {prod.specifications}
                      </div>
                      <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          Calib: {prod.calibrationPeriodMonths} mo
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f766e' }}>
                          Select Instrument →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              {getAllProducts().filter(prod => {
                if (!catalogSearch) return true;
                const q = catalogSearch.toLowerCase();
                return prod.name.toLowerCase().includes(q) ||
                       prod.model.toLowerCase().includes(q) ||
                       prod.category.toLowerCase().includes(q) ||
                       prod.specifications.toLowerCase().includes(q);
              }).length === 0 && (
                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <Package size={32} style={{ color: '#0f766e', margin: '0 auto 6px', display: 'block' }} />
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>No Equipment Profiles in Catalog</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                      All demo/dummy equipment has been removed. You can select an authentic instrumentation benchmark below or enter custom valuation for Equipment #{catalogTargetIdx + 1}:
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                    {BENCHMARK_VALUATIONS
                      .filter(b => !catalogSearch || b.name.toLowerCase().includes(catalogSearch.toLowerCase()) || b.category.toLowerCase().includes(catalogSearch.toLowerCase()))
                      .map((bench, bIdx) => (
                        <div
                          key={bIdx}
                          onClick={() => {
                            updateProduct(catalogTargetIdx, {
                              productName: job.products[catalogTargetIdx]?.productName || bench.name,
                              makeModel: job.products[catalogTargetIdx]?.makeModel || bench.model,
                              productValue: bench.price,
                              onlinePrice: bench.price,
                              onlinePriceConfirmed: true,
                            });
                            const updated = [...job.products];
                            updated[catalogTargetIdx] = {
                              ...updated[catalogTargetIdx],
                              productName: updated[catalogTargetIdx]?.productName || bench.name,
                              makeModel: updated[catalogTargetIdx]?.makeModel || bench.model,
                              productValue: bench.price,
                              onlinePrice: bench.price,
                              onlinePriceConfirmed: true,
                            };
                            const sumVal = updated.reduce((acc, curr) => acc + (Number(curr.productValue) || 0), 0);
                            setJob(prev => ({
                              ...prev,
                              totals: {
                                ...prev.totals,
                                productValue: sumVal,
                              }
                            }));
                            setShowCatalogModal(false);
                            setMessage(`✓ Applied benchmark "${bench.name}" market value ₹${bench.price.toLocaleString('en-IN')} to Equipment #${catalogTargetIdx + 1}`);
                            setTimeout(() => setMessage(''), 3500);
                          }}
                          style={{
                            padding: '10px 12px',
                            background: '#ffffff',
                            borderRadius: '10px',
                            border: '1.5px solid #cbd5e1',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = '#0f766e';
                            e.currentTarget.style.background = '#f0fdf4';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.background = '#ffffff';
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                            <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#1e293b' }}>{bench.name}</span>
                            <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#059669', flexShrink: 0 }}>₹{bench.price.toLocaleString('en-IN')}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: '#64748b' }}>
                            <span>Model: {bench.model}</span>
                            <span style={{ color: '#0f766e', fontWeight: 700 }}>Click to Apply →</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 22px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a
                href="/products"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
              >
                Manage Product Profiles &amp; Add New Equipment ↗
              </a>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Photo Lightbox Modal */}
      {enlargedPhoto && (
        <div
          onClick={() => setEnlargedPhoto(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(5px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            cursor: 'zoom-out'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '16px',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'default'
            }}
          >
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 750, color: '#0f172a' }}>Equipment Photo Preview</span>
              <button
                type="button"
                onClick={() => setEnlargedPhoto(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ width: '100%', height: '360px', borderRadius: '12px', overflow: 'hidden', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={enlargedPhoto} alt="Enlarged Equipment" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
            <button
              type="button"
              onClick={() => setEnlargedPhoto(null)}
              style={{ marginTop: '14px', padding: '8px 20px', borderRadius: '8px', background: '#0f766e', color: '#fff', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
            >
              Done Viewing
            </button>
          </div>
        </div>
      )}

      {/* Product Catalog Picker Modal */}
      {showCatalogModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '820px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 22px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#0f766e', color: '#fff', display: 'grid', placeItems: 'center' }}>
                  <Package size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                    Select Equipment from Product Catalog
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                    Populates name, model, photo, technical specifications, and replacement valuation for Equipment #{catalogTargetIdx + 1}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Bar */}
            <div style={{ padding: '12px 22px', borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '8px 12px' }}>
                <Search size={16} style={{ color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search by instrument name, model, manufacturer, category..."
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px' }}
                />
              </div>
            </div>

            {/* Product List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '12px' }}>
              {getAllProducts()
                .filter(prod => {
                  if (!catalogSearch) return true;
                  const q = catalogSearch.toLowerCase();
                  return prod.name.toLowerCase().includes(q) ||
                         prod.model.toLowerCase().includes(q) ||
                         prod.category.toLowerCase().includes(q) ||
                         prod.specifications.toLowerCase().includes(q);
                })
                .map(prod => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      updateProduct(catalogTargetIdx, {
                        productName: prod.name,
                        makeModel: prod.model,
                        productValue: prod.price,
                        onlinePrice: prod.price,
                        productImageUrl: prod.imageUrl,
                        productSpecifications: prod.specifications
                      });
                      setShowCatalogModal(false);
                      setMessage(`✓ Loaded "${prod.name}" into Equipment #${catalogTargetIdx + 1}`);
                      setTimeout(() => setMessage(''), 3000);
                    }}
                    style={{
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      gap: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      background: '#ffffff',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#0f766e';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,118,110,0.12)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc', border: '1px solid #cbd5e1', flexShrink: 0 }}>
                      <img src={prod.imageUrl} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 750, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {prod.name}
                        </h4>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f766e', flexShrink: 0 }}>
                          ₹{prod.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                        Model: {prod.model} • {prod.category}
                      </div>
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {prod.specifications}
                      </div>
                      <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          Calib: {prod.calibrationPeriodMonths} mo
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f766e' }}>
                          Select Instrument →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              {getAllProducts().filter(prod => {
                if (!catalogSearch) return true;
                const q = catalogSearch.toLowerCase();
                return prod.name.toLowerCase().includes(q) ||
                       prod.model.toLowerCase().includes(q) ||
                       prod.category.toLowerCase().includes(q) ||
                       prod.specifications.toLowerCase().includes(q);
              }).length === 0 && (
                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <Package size={32} style={{ color: '#0f766e', margin: '0 auto 6px', display: 'block' }} />
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>No Equipment Profiles in Catalog</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                      All demo/dummy equipment has been removed. You can select an authentic instrumentation benchmark below or enter custom valuation for Equipment #{catalogTargetIdx + 1}:
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                    {BENCHMARK_VALUATIONS
                      .filter(b => !catalogSearch || b.name.toLowerCase().includes(catalogSearch.toLowerCase()) || b.category.toLowerCase().includes(catalogSearch.toLowerCase()))
                      .map((bench, bIdx) => (
                        <div
                          key={bIdx}
                          onClick={() => {
                            updateProduct(catalogTargetIdx, {
                              productName: job.products[catalogTargetIdx]?.productName || bench.name,
                              makeModel: job.products[catalogTargetIdx]?.makeModel || bench.model,
                              productValue: bench.price,
                              onlinePrice: bench.price,
                              onlinePriceConfirmed: true,
                            });
                            const updated = [...job.products];
                            updated[catalogTargetIdx] = {
                              ...updated[catalogTargetIdx],
                              productName: updated[catalogTargetIdx]?.productName || bench.name,
                              makeModel: updated[catalogTargetIdx]?.makeModel || bench.model,
                              productValue: bench.price,
                              onlinePrice: bench.price,
                              onlinePriceConfirmed: true,
                            };
                            const sumVal = updated.reduce((acc, curr) => acc + (Number(curr.productValue) || 0), 0);
                            setJob(prev => ({
                              ...prev,
                              totals: {
                                ...prev.totals,
                                productValue: sumVal,
                              }
                            }));
                            setShowCatalogModal(false);
                            setMessage(`✓ Applied benchmark "${bench.name}" market value ₹${bench.price.toLocaleString('en-IN')} to Equipment #${catalogTargetIdx + 1}`);
                            setTimeout(() => setMessage(''), 3500);
                          }}
                          style={{
                            padding: '10px 12px',
                            background: '#ffffff',
                            borderRadius: '10px',
                            border: '1.5px solid #cbd5e1',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = '#0f766e';
                            e.currentTarget.style.background = '#f0fdf4';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.background = '#ffffff';
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                            <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#1e293b' }}>{bench.name}</span>
                            <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#059669', flexShrink: 0 }}>₹{bench.price.toLocaleString('en-IN')}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: '#64748b' }}>
                            <span>Model: {bench.model}</span>
                            <span style={{ color: '#0f766e', fontWeight: 700 }}>Click to Apply →</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 22px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a
                href="/products"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
              >
                Manage Product Profiles &amp; Add New Equipment ↗
              </a>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Photo Lightbox Modal */}
      {enlargedPhoto && (
        <div
          onClick={() => setEnlargedPhoto(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(5px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            cursor: 'zoom-out'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '16px',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'default'
            }}
          >
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 750, color: '#0f172a' }}>Equipment Photo Preview</span>
              <button
                type="button"
                onClick={() => setEnlargedPhoto(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ width: '100%', height: '360px', borderRadius: '12px', overflow: 'hidden', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={enlargedPhoto} alt="Enlarged Equipment" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
            <button
              type="button"
              onClick={() => setEnlargedPhoto(null)}
              style={{ marginTop: '14px', padding: '8px 20px', borderRadius: '8px', background: '#0f766e', color: '#fff', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
            >
              Done Viewing
            </button>
          </div>
        </div>
      )}

      {/* Modal: Add Older Form Record with Manual Price & File Attachments */}
      <AddOlderFormModal
        isOpen={showAddOlderModal}
        onClose={() => setShowAddOlderModal(false)}
        onSuccess={(olderJob) => {
          setJob(olderJob);
          saveJobRecordDirect(olderJob);
          setMessage(`✓ Loaded older form #${olderJob.jobNo} (${olderJob.customer?.name}) with manual price ₹${olderJob.totals?.totalEstimate || 0}!`);
          setTimeout(() => setMessage(''), 4500);
        }}
      />
    </div>
  );
}
