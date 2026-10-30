'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Wrench, Save, Printer, ArrowRight, ArrowLeft, Plus, 
  Trash2, Check, Calculator, Building, Phone, MapPin, User, DollarSign,
  FolderOpen, X, Search, Clock, CheckCircle2, FileCheck, Camera, Upload, Eye, Package,
  Video, Film, Play
} from 'lucide-react';
import type { ServiceJob, ServiceProduct, RepairCategory, JobStatus } from '@/types/service-job';
import { blankJob, newProduct } from '@/lib/service-defaults';
import { clearAllOlderForms } from '@/lib/data';
import { cleanNumberString, parseCleanNumber } from '@/lib/utils';
import { PageTransition } from '@/components/animate-ui/components/page-transition';
import PaperJobCardPreview from './PaperJobCardPreview';
import ServiceQuotationModal from './ServiceQuotationModal';
import FormCompletionCelebration from './FormCompletionCelebration';
import { syncFormToCloud, syncPullFromCloud } from '@/lib/sync';
import { getAllProducts, ProductProfile } from '@/lib/products';

const BENCHMARK_SERVICING: ServiceJob[] = [];

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
  return {
    ...initial,
    ...base,
    id: base.id || `SJ-${randomSeq}`,
    jobNo: base.jobNo || base.id || `SJ-${randomSeq}`,
    customer: { ...initial.customer, ...(base.customer || {}) },
    receipt: { ...initial.receipt, ...(base.receipt || {}) },
    dispatch: { ...initial.dispatch, ...(base.dispatch || {}) },
    payment: { ...initial.payment, ...(base.payment || {}) },
    signoff: { ...initial.signoff, ...(base.signoff || {}) },
    totals: { ...initial.totals, ...(base.totals || {}) },
    products: Array.isArray(base.products) && base.products.length > 0 ? base.products : initial.products,
    proofImages: Array.isArray(base.proofImages) ? base.proofImages : [],
    proofVideo: base.proofVideo || '',
    proofNotes: base.proofNotes || '',
    createdAt: base.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export default function ServicingJobForm() {
  const [job, setJob] = useState<ServiceJob>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nunes:service_current_draft');
        if (saved) return normalizeJob(JSON.parse(saved));
      } catch {}
    }
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
  const [showPaper, setShowPaper] = useState(false);
  const [showQuotation, setShowQuotation] = useState(false);
  const [message, setMessage] = useState('');
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

  // Product Catalog & Photo states
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogTargetIdx, setCatalogTargetIdx] = useState<number>(0);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);

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

  // Automatically load from URL query param if present (e.g. ?id=SJ-8821), or restore saved half-filled draft
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const targetId = sp.get('id') || sp.get('job_no') || sp.get('job');
      if (targetId) {
        const raw = localStorage.getItem('nunes:service_jobs');
        const list: ServiceJob[] = raw ? JSON.parse(raw) : [];
        const found = list.find(x => String(x.id) === targetId || String(x.jobNo) === targetId) ||
                      BENCHMARK_SERVICING.find(x => String(x.id) === targetId || String(x.jobNo) === targetId);
        if (found) {
          setJob(normalizeJob(found));
          setMessage(`✓ Loaded service job ${found.jobNo || found.id} (${found.customer?.name || 'Customer'})`);
          setTimeout(() => setMessage(''), 3500);
          return;
        }
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

      // Auto-restore half-filled draft when user returns to the form
      const savedDraft = localStorage.getItem('nunes:service_current_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && (parsed.customer?.name || (parsed.products && parsed.products.length > 0 && parsed.products.some((p: any) => p.productName || p.makeModel)))) {
          setJob(normalizeJob(parsed));
          setDraftRestored(true);
        }
      }
    } catch {}
  }, []);

  // Continuously persist active draft so user never loses half-filled form
  useEffect(() => {
    try {
      localStorage.setItem('nunes:service_current_draft', JSON.stringify(job));
    } catch {}
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
    setJob(prev => ({
      ...prev,
      totals: {
        ...prev.totals,
        ...calculatedTotals
      }
    }));
  }, [calculatedTotals]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateCustomer(field: keyof ServiceJob['customer'], val: string) {
    setJob(prev => ({
      ...prev,
      customer: { ...prev.customer, [field]: val }
    }));
  }

  function updateReceipt(field: keyof ServiceJob['receipt'], val: any) {
    setJob(prev => ({
      ...prev,
      receipt: { ...prev.receipt, [field]: val }
    }));
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

      // If price or category changed, auto-recalculate repairEstimate
      if (patch.repairCategory !== undefined || patch.onlinePrice !== undefined || patch.productValue !== undefined || patch.repairPercent !== undefined) {
        const cat = curr.repairCategory === 'MAXIMUM_50' ? 'MAXIMUM_50' : 'MINIMUM_30';
        const pct = patch.repairPercent !== undefined ? patch.repairPercent : (cat === 'MAXIMUM_50' ? 50 : 30);
        const price = Number(curr.onlinePrice || curr.productValue || 0);
        curr.repairCategory = cat;
        curr.repairPercent = pct;
        curr.productValue = price;
        curr.repairEstimate = Number(((price * pct) / 100).toFixed(2));
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
          setJob(prev => ({
            ...prev,
            proofImages: [...(prev.proofImages || []), res]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
    setMessage('✓ Added photo proof of incoming equipment');
    setTimeout(() => setMessage(''), 3000);
  }

  function handleRemoveProofPhoto(idx: number) {
    setJob(prev => ({
      ...prev,
      proofImages: (prev.proofImages || []).filter((_, i) => i !== idx)
    }));
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
    const isFinalStep = activeStep === SERVICE_STEPS.length - 1;
    const finalStatus: JobStatus = isFinalStep 
      ? (job.status === 'DRAFT' || job.status === 'RECEIVED' ? 'READY' : job.status) 
      : job.status;
    const updated: ServiceJob = {
      ...job,
      status: finalStatus,
      updatedAt: new Date().toISOString()
    };

    setJob(updated);

    try {
      const raw = localStorage.getItem('nunes:service_jobs');
      const list: ServiceJob[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(x => String(x.id) === String(updated.id));
      if (idx >= 0) {
        list[idx] = updated;
      } else {
        list.unshift(updated);
      }
      localStorage.setItem('nunes:service_jobs', JSON.stringify(list));
      void syncFormToCloud("servicing", String(updated.jobNo || updated.id), String(updated.customer?.name || "Customer"), updated);
    } catch {}

    if (proceed) {
      if (!isFinalStep) {
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
      setMessage('✓ Saved to Servicing job records.');
      setTimeout(() => setMessage(''), 3000);
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
      const idx = list.findIndex(x => String(x.id) === String(updated.id));
      if (idx >= 0) {
        list[idx] = updated;
      } else {
        list.unshift(updated);
      }
      localStorage.setItem('nunes:service_jobs', JSON.stringify(list));
      void syncFormToCloud("servicing", String(updated.jobNo || updated.id), String(updated.customer?.name || "Customer"), updated);
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
                  <span>All Saved Service Jobs ({savedJobsList.length})</span>
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Synced across all connected devices and office PCs in real time.
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
              {savedJobsList.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  No service jobs saved yet. Fill out the form and click <b>Save Draft</b> or <b>Complete & Next Job</b> to record your first job.
                </div>
              ) : (
                savedJobsList
                  .filter((j) => {
                    if (!searchSaved.trim()) return true;
                    const s = searchSaved.toLowerCase();
                    const name = String(j.customer?.name || '').toLowerCase();
                    const jobNo = String(j.jobNo || j.id || '').toLowerCase();
                    const prod = (j.products || []).map((p: any) => String(p.productName || '')).join(' ').toLowerCase();
                    return name.includes(s) || jobNo.includes(s) || prod.includes(s);
                  })
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
                          <div style={{ fontSize: '13px', color: '#334155', fontWeight: 600, marginTop: '2px' }}>
                            {j.customer?.name || 'Customer'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>
                            {prodName} • Estimate: ₹{Number(j.totals?.totalEstimate || 0).toLocaleString()}
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
        <div className="nunes-form-actions">
          <button
            type="button"
            className="btn"
            onClick={() => setShowSavedModal(true)}
            title="View & load all service jobs saved across all devices"
            style={{ background: '#f0fdfa', border: '1px solid #99f6e4', color: '#0f766e', fontWeight: 700 }}
          >
            <FolderOpen size={15} style={{ color: '#0f766e' }} />
            <span>Saved Jobs ({savedJobsList.length})</span>
          </button>
          <button type="button" className="btn" onClick={startNewJob} title="Start a fresh blank service job">
            <Plus size={15} /> New Job
          </button>
          <button 
            type="button" 
            className="btn btn-quotation-header" 
            onClick={() => setShowQuotation(true)}
            title="Generate Service Quotation with WhatsApp & Gmail"
          >
            <FileCheck size={16} /> Quotation
          </button>
          <button type="button" className="btn" onClick={() => setShowPaper(true)}>
            <Printer size={15} /> Paper Job Card
          </button>
          <button type="button" className="btn" onClick={() => saveRecord(false)}>
            <Save size={15} /> Save Draft
          </button>
          <button 
            type="button" 
            className="btn primary" 
            onClick={() => saveRecord(true)}
            style={{ fontWeight: 700 }}
            title={activeStep === SERVICE_STEPS.length - 1 ? "Complete this job and move to next new form" : "Save and proceed to next step"}
          >
            {activeStep === SERVICE_STEPS.length - 1 ? (
              <>Complete &amp; Next Job <ArrowRight size={15} /></>
            ) : (
              <>Save &amp; Next <ArrowRight size={15} /></>
            )}
          </button>
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

      {/* Stepper */}
      <div className="nunes-stepper">
        {SERVICE_STEPS.map((s, idx) => {
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
          <h2>{SERVICE_STEPS[activeStep].title}</h2>
          <span className="nunes-status-pill">{job.status}</span>
        </div>

        <PageTransition pageKey={activeStep} effect="slide" direction={direction}>
        {/* STEP 1: CUSTOMER */}
        {activeStep === 0 && (
          <div className="nunes-form-fields">
            <div className="nunes-grid3">
              <label>
                Company / Customer Name *:
                <input value={job.customer.name} onChange={e => updateCustomer('name', e.target.value)} placeholder="Full Customer or Company Name" />
              </label>
              <label>
                Contact Person:
                <input value={job.customer.contactPerson} onChange={e => updateCustomer('contactPerson', e.target.value)} placeholder="Name of rep" />
              </label>
              <label>
                Phone Number:
                <input value={job.customer.phone} onChange={e => updateCustomer('phone', e.target.value)} placeholder="+91 9876543210" />
              </label>
            </div>

            <div className="nunes-grid3">
              <label>
                Email Address:
                <input type="email" value={job.customer.email} onChange={e => updateCustomer('email', e.target.value)} placeholder="service@client.com" />
              </label>
              <label>
                City:
                <input value={job.customer.city} onChange={e => updateCustomer('city', e.target.value)} />
              </label>
              <label>
                State:
                <input value={job.customer.state} onChange={e => updateCustomer('state', e.target.value)} />
              </label>
            </div>

            <div className="nunes-grid2">
              <label>
                Complete Address:
                <input value={job.customer.address} onChange={e => updateCustomer('address', e.target.value)} placeholder="Building, Street, Landmark" />
              </label>
              <label>
                GSTIN Number:
                <input value={job.customer.gstin} onChange={e => updateCustomer('gstin', e.target.value)} placeholder="33AAAAA0000A1Z5" />
              </label>
            </div>
          </div>
        )}

        {/* STEP 2: PRODUCT DETAILS */}
        {activeStep === 1 && (
          <div className="nunes-form-fields">
            <div className="nunes-items-head">
              <h3>Equipment Under Service</h3>
              <button type="button" className="btn mini-btn" onClick={addProduct}>
                <Plus size={13} /> Add Equipment
              </button>
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
              </div>
            ))}
          </div>
        )}

        {/* STEP 3: RECEIPT */}
        {activeStep === 2 && (
          <div className="nunes-form-fields">
            <div className="nunes-grid3">
              <label>
                MR Number:
                <input value={job.receipt.mrNo} onChange={e => updateReceipt('mrNo', e.target.value)} placeholder="MR-2026-XXXX" />
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f766e', fontWeight: 800, fontSize: '13px' }}>
                  <span>🤝</span>
                  <span>Direct Handover (Walk-in Customer Representative)</span>
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
                      placeholder="Full name of representative who delivered the equipment"
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
                      placeholder="e.g. +91 98420 12345"
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
                <input value={job.dispatch.dcNo} onChange={e => updateDispatch('dcNo', e.target.value)} placeholder="DC-XXXX" />
              </label>
              <label>
                DC Date:
                <input type="date" value={job.dispatch.dcDate} onChange={e => updateDispatch('dcDate', e.target.value)} />
              </label>
            </div>

            <div className="nunes-grid2">
              <label>
                Mode of Despatch:
                <input value={job.dispatch.mode} onChange={e => updateDispatch('mode', e.target.value)} placeholder="Courier / In-person handover" />
              </label>
              <label>
                Despatch Reference:
                <input value={job.dispatch.reference} onChange={e => updateDispatch('reference', e.target.value)} placeholder="Tracking number or recipient name" />
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
                <input value={job.payment.invoiceNo} onChange={e => updatePayment('invoiceNo', e.target.value)} />
              </label>
              <label>
                Invoice Date:
                <input type="date" value={job.payment.invoiceDate} onChange={e => updatePayment('invoiceDate', e.target.value)} />
              </label>
              <label>
                Payment Mode:
                <input value={job.payment.mode} onChange={e => updatePayment('mode', e.target.value)} placeholder="UPI / NEFT / Cheque / Cash" />
              </label>
            </div>

            <div className="nunes-grid2">
              <label>
                Payment Reference / UTR:
                <input value={job.payment.reference} onChange={e => updatePayment('reference', e.target.value)} placeholder="Transaction ref or cheque number" />
              </label>
              <label>
                Payment Received By:
                <input value={job.payment.receivedBy} onChange={e => updatePayment('receivedBy', e.target.value)} placeholder="Accounts staff" />
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
            <button type="button" className="btn" onClick={() => saveRecord(false)}>
              <Save size={14} /> Save Draft
            </button>
            {activeStep < SERVICE_STEPS.length - 1 ? (
              <button 
                type="button" 
                className="btn primary" 
                onClick={() => saveRecord(true)}
                style={{ background: '#1d4ed8', borderColor: '#1d4ed8', color: '#ffffff', fontWeight: 750, boxShadow: '0 4px 12px rgba(29, 78, 216, 0.2)' }}
              >
                Next Step: {SERVICE_STEPS[activeStep + 1].label.split('. ')[1]} <ArrowRight size={14} />
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
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
              </div>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
}
