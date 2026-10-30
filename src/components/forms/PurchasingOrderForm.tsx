'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, Check, Plus, Trash2, Printer, 
  ArrowRight, ArrowLeft, Save, Building, Phone, MapPin, DollarSign,
  FolderOpen, X, Search, Clock, CheckCircle2, RotateCcw, FileCheck,
  Camera, Upload, Eye, Package, LogOut
} from 'lucide-react';
import type { PurchasingOrder, MarketingItem, SupplierRow } from '@/types/purchasing-order';
import { blankPurchasingOrder, newMarketingItem, newSupplierRow } from '@/lib/purchasing-defaults';
import { clearAllOlderForms } from '@/lib/data';
import { cleanNumberString, parseCleanNumber } from '@/lib/utils';
import { PageTransition } from '@/components/animate-ui/components/page-transition';
import PurchasingPaperForm from './PurchasingPaperForm';
import PurchasingQuotationModal from './PurchasingQuotationModal';
import FormCompletionCelebration from './FormCompletionCelebration';
import { syncFormToCloud, syncPullFromCloud } from '@/lib/sync';
import { getAllProducts, ProductProfile } from '@/lib/products';

const BENCHMARK_PURCHASING: PurchasingOrder[] = [];

const STEPS = [
  { key: 'marketing', label: '1. Marketing', title: 'Marketing & Quotation Details' },
  { key: 'dispatch', label: '2. Dispatch', title: 'Packing & Dispatch Information' },
  { key: 'payment', label: '3. Payment', title: 'Customer Payment Tracking' },
  { key: 'supplier', label: '4. Supplier', title: 'Supplier & Purchase Order' },
  { key: 'accounts', label: '5. Accounts', title: 'Accounts & Profit Analysis' },
  { key: 'approval', label: '6. Final Approval', title: 'Management Final Signoff' },
] as const;

export default function PurchasingOrderForm() {
  const [order, setOrder] = useState<PurchasingOrder>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nunes:purchasing_current_draft');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return blankPurchasingOrder();
  });

  const [activeStep, setActiveStep] = useState<number>(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

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
    title: 'Purchasing Order Successfully Completed & Saved!',
    subtitle: 'All order details and marketing items have been recorded in the database.'
  });

  const [showSavedModal, setShowSavedModal] = useState(false);
  const [savedOrdersList, setSavedOrdersList] = useState<PurchasingOrder[]>([]);
  const [searchSaved, setSearchSaved] = useState('');

  // Cross-device sync & saved orders watcher
  useEffect(() => {
    const loadSavedOrders = () => {
      try {
        const raw = localStorage.getItem('nunes:purchasing_orders');
        const list: PurchasingOrder[] = raw ? JSON.parse(raw) : [];
        setSavedOrdersList(list);
      } catch {}
    };

    loadSavedOrders();
    void syncPullFromCloud().then(() => loadSavedOrders());
    window.addEventListener('nunes:records-synced', loadSavedOrders);
    return () => window.removeEventListener('nunes:records-synced', loadSavedOrders);
  }, []);

  // Active User Email for Multi-Role Collaborative Workflow
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('suganya@nunesinstruments.com');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('nunes_auth_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.email) setCurrentUserEmail(parsed.email);
        else if (parsed.username) setCurrentUserEmail(parsed.username);
      }
    } catch {}
  }, []);

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

  // For MD: Auto-open Saved Orders Modal on load so MD inspects existing orders
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const targetId = sp.get('id') || sp.get('order_id');
    if (!targetId && isMd) {
      setShowSavedModal(true);
    }
  }, [isMd]);

  // Separate worker accounts: individual workers only see orders they created or handle.
  // Admin and MD see all orders and can filter by staff.
  const visibleSavedOrders = useMemo(() => {
    const user = (currentUserEmail || '').toLowerCase();
    const uKey = user.split('@')[0].replace(/[^a-z]/g, '');

    return savedOrdersList.filter((ord) => {
      // 1. Search text filter
      if (searchSaved.trim()) {
        const s = searchSaved.toLowerCase();
        const name = String(ord.customer_name || '').toLowerCase();
        const orderId = String(ord.order_id || ord.id || '').toLowerCase();
        const prod = (ord.marketing_items || []).map((m: any) => String(m.item_name || '')).join(' ').toLowerCase();
        if (!name.includes(s) && !orderId.includes(s) && !prod.includes(s)) return false;
      }

      // 2. Admin & MD Master View: can view all or filter by selected staff
      if (isAdminOrMd) {
        if (staffFilter === 'ALL') return true;
        const target = staffFilter.toLowerCase();
        const createdBy = String(ord.createdBy || '').toLowerCase();
        const marketingPerson = String(ord.marketing_person || '').toLowerCase();
        const packingBy = String(ord.packing_by || '').toLowerCase();
        const servicePerson = String(ord.service_person || '').toLowerCase();
        return (
          createdBy.includes(target) ||
          marketingPerson.includes(target) ||
          packingBy.includes(target) ||
          servicePerson.includes(target)
        );
      }

      // 3. Regular Worker Account View: ONLY show the particular orders they added or handle
      const createdBy = String(ord.createdBy || '').toLowerCase();
      const marketingPerson = String(ord.marketing_person || '').toLowerCase();
      const packingBy = String(ord.packing_by || '').toLowerCase();
      const servicePerson = String(ord.service_person || '').toLowerCase();

      const isOwner = (
        (createdBy && (createdBy.includes(uKey) || uKey.includes(createdBy.split('@')[0]))) ||
        (marketingPerson && (marketingPerson.includes(uKey) || uKey.includes(marketingPerson.split('@')[0]))) ||
        (packingBy && (packingBy.includes(uKey) || uKey.includes(packingBy.split('@')[0]))) ||
        (servicePerson && (servicePerson.includes(uKey) || uKey.includes(servicePerson.split('@')[0])))
      );

      return isOwner;
    });
  }, [savedOrdersList, searchSaved, isAdminOrMd, staffFilter, currentUserEmail]);

  // Product Catalog & Photo states
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogTargetIdx, setCatalogTargetIdx] = useState<number>(0);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);

  // Cross-device sync & saved orders watcher
  useEffect(() => {
    const loadSavedOrders = () => {
      try {
        const raw = localStorage.getItem('nunes:purchasing_orders');
        const list: PurchasingOrder[] = raw ? JSON.parse(raw) : [];
        setSavedOrdersList(list);
      } catch {}
    };

    loadSavedOrders();
    void syncPullFromCloud().then(() => loadSavedOrders());
    window.addEventListener('nunes:records-synced', loadSavedOrders);
    return () => window.removeEventListener('nunes:records-synced', loadSavedOrders);
  }, []);

  // Automatically load from URL query param if present (e.g. ?id=NM-1042), or restore saved half-filled draft
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const targetId = sp.get('id') || sp.get('order_id') || sp.get('order');
      if (targetId) {
        const raw = localStorage.getItem('nunes:purchasing_orders');
        const list: PurchasingOrder[] = raw ? JSON.parse(raw) : [];
        const found = list.find(x => String(x.id) === targetId || String(x.order_id) === targetId) ||
                      BENCHMARK_PURCHASING.find(x => String(x.id) === targetId || String(x.order_id) === targetId);
        if (found) {
          setOrder(found);
          setMessage(`✓ Loaded older form ${found.order_id || found.id} (${found.customer_name || 'Customer'})`);
          setTimeout(() => setMessage(''), 3500);
          return;
        }
      }

      // Pre-fill from Product Catalog URL params if present
      const urlProdName = sp.get('itemName') || sp.get('productName') || sp.get('product');
      const urlModel = sp.get('model');
      const urlPrice = sp.get('price');
      const urlSpec = sp.get('spec');
      if (urlProdName) {
        const catalog = getAllProducts();
        const foundProd = catalog.find(
          x => x.name.toLowerCase() === urlProdName.toLowerCase() || x.model.toLowerCase() === (urlModel || '').toLowerCase()
        );
        setOrder(prev => {
          const items = [...prev.marketing_items];
          items[0] = {
            ...items[0],
            item_name: urlProdName,
            model: urlModel || items[0].model || '',
            item_value: urlPrice ? parseFloat(urlPrice) : items[0].item_value,
            image_url: foundProd?.imageUrl || items[0].image_url,
            specifications: urlSpec || foundProd?.specifications || items[0].specifications
          };
          return { ...prev, marketing_items: items };
        });
        setDirection('forward');
    setDirection('forward');
    setActiveStep(0);
        setMessage(`✓ Pre-filled ordered product "${urlProdName}" with photo from catalog`);
        setTimeout(() => setMessage(''), 4000);
        return;
      }

      // Auto-restore half-filled draft when user returns to the form
      const savedDraft = localStorage.getItem('nunes:purchasing_current_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && (parsed.customer_name || (parsed.marketing_items && parsed.marketing_items.length > 0 && parsed.marketing_items.some((m: any) => m.item_name || m.model)))) {
          setOrder(parsed);
        }
      }
    } catch {}
  }, []);

  // Persist current active form draft with debounce to avoid freezing UI
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('nunes:purchasing_current_draft', JSON.stringify(order));
      } catch {}
    }, 400);
    return () => clearTimeout(timer);
  }, [order]);

  // Recalculate Marketing Total Order Value
  const calculatedTotal = useMemo(() => {
    return order.marketing_items.reduce((sum, item) => {
      const v = Number(item.item_value || 0);
      const c = Number(item.add_charge || 0);
      const q = Math.max(1, Number(item.qty || 1));
      return sum + (v * q) + c;
    }, 0);
  }, [order.marketing_items]);

  useEffect(() => {
    if (order.total_order_value !== calculatedTotal) {
      setOrder(prev => ({ ...prev, total_order_value: calculatedTotal }));
    }
  }, [calculatedTotal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Customer payment totals
  const totalReceived = useMemo(() => {
    return order.customer_payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [order.customer_payments]);

  const balanceDue = Math.max(0, Number(order.total_order_value || 0) - totalReceived);

  // Accounts Bill Amount
  const calculatedBillAmount = useMemo(() => {
    return order.accounts_items.reduce((sum, item) => {
      return sum + Number(item.total || item.item_value || 0);
    }, 0);
  }, [order.accounts_items]);

  // Profit calculation
  useEffect(() => {
    const purchaseCost = Number(order.total_purchase_cost || order.bill_amount || 0);
    const sellingCost = Number(order.total_selling_cost || order.total_order_value || 0);
    const profit = Math.max(0, sellingCost - purchaseCost);
    const profitPct = sellingCost > 0 ? Number(((profit / sellingCost) * 100).toFixed(1)) : 0;
    
    setOrder(prev => ({
      ...prev,
      bill_amount: calculatedBillAmount,
      total_payment_received: totalReceived,
      payment_balance: balanceDue,
      profit,
      profit_percentage: profitPct
    }));
  }, [calculatedBillAmount, totalReceived, balanceDue]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateOrder<K extends keyof PurchasingOrder>(key: K, value: PurchasingOrder[K]) {
    setOrder(prev => ({ ...prev, [key]: value }));
  }

  function updateItem(index: number, patch: Partial<MarketingItem>) {
    setOrder(prev => {
      const items = [...prev.marketing_items];
      items[index] = { ...items[index], ...patch };
      return { ...prev, marketing_items: items };
    });
  }

  function addItem() {
    setOrder(prev => ({
      ...prev,
      marketing_items: [...prev.marketing_items, newMarketingItem(prev.marketing_items.length + 1)]
    }));
  }

  function removeItem(index: number) {
    if (order.marketing_items.length <= 1) return;
    setOrder(prev => ({
      ...prev,
      marketing_items: prev.marketing_items.filter((_, i) => i !== index)
    }));
  }

  function saveRecord(completeCurrent = false) {
    const isFinalStep = activeStep === STEPS.length - 1;
    const updated = {
      ...order,
      updated_at: new Date().toISOString(),
      current_status: isFinalStep ? 'COMPLETED' : (completeCurrent && activeStep < STEPS.length - 1 ? STEPS[activeStep + 1].label.slice(3) : order.current_status)
    };

    if (activeStep === 0) updated.marketing_complete = true;
    if (activeStep === 1) updated.dispatch_complete = true;
    if (activeStep === 2) updated.payment_complete = true;
    if (activeStep === 3) updated.supplier_complete = true;
    if (activeStep === 4) updated.accounts_complete = true;
    if (activeStep === 5) updated.approval_complete = true;

    setOrder(updated);

    try {
      const raw = localStorage.getItem('nunes:purchasing_orders');
      const list: PurchasingOrder[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(x => String(x.id) === String(updated.id));
      if (idx >= 0) {
        list[idx] = updated;
      } else {
        list.unshift(updated);
      }
      localStorage.setItem('nunes:purchasing_orders', JSON.stringify(list));
      void syncFormToCloud("purchasing", String(updated.order_id || updated.id), String(updated.customer_name || "Customer"), updated);
    } catch {}

    if (completeCurrent) {
      if (!isFinalStep) {
        setDirection('forward');
        setDirection('forward');
        setDirection('forward');
        setActiveStep(s => s + 1);
        setMessage('✓ Saved & moving to next step.');
        setTimeout(() => setMessage(''), 3000);
      } else {
        // Report totally completed! Show 4 sec fireworks celebration then redirect to fresh new form
        const completedNo = updated.order_id || updated.id;
        setCelebrationData({
          recordNumber: String(completedNo),
          title: 'Purchasing Order Successfully Completed & Saved!',
          subtitle: `Order ${completedNo} for ${updated.customer_name || 'Customer'} has been saved to Reports.`
        });
        setShowCelebration(true);
      }
    } else {
      setMessage(`✓ Saved draft for Order #${updated.order_id || updated.id}`);
      setDraftSaveNotice(true);
      setTimeout(() => setMessage(''), 4500);
    }
  }

  function handleSaveAndClose() {
    const updated = {
      ...order,
      updated_at: new Date().toISOString()
    };
    setOrder(updated);

    try {
      const raw = localStorage.getItem('nunes:purchasing_orders');
      const list: PurchasingOrder[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(x => String(x.id) === String(updated.id));
      if (idx >= 0) {
        list[idx] = updated;
      } else {
        list.unshift(updated);
      }
      localStorage.setItem('nunes:purchasing_orders', JSON.stringify(list));
      void syncFormToCloud("purchasing", String(updated.order_id || updated.id), String(updated.customer_name || "Customer"), updated);
    } catch {}

    try {
      localStorage.removeItem('nunes:purchasing_current_draft');
    } catch {}

    setShowCloseModal(false);
    setDraftSaveNotice(false);
    setMessage('✓ Draft saved. Closing form and returning to Forms Hub...');
    setTimeout(() => {
      router.push('/forms');
    }, 350);
  }

  function handleCloseWithoutSaving() {
    try {
      localStorage.removeItem('nunes:purchasing_current_draft');
    } catch {}
    setShowCloseModal(false);
    setDraftSaveNotice(false);
    router.push('/forms');
  }

  function handlePromptClose() {
    const hasData = Boolean(
      order.customer_name ||
      order.place ||
      (order.marketing_items && order.marketing_items.some(i => i.item_name || i.model))
    );

    if (!hasData) {
      handleCloseWithoutSaving();
    } else {
      setShowCloseModal(true);
    }
  }

  function handleClearAllOlderForms() {
    if (typeof window !== 'undefined' && window.confirm("Are you sure you want to delete all older forms and drafts? This will purge all saved orders and return to a clean blank order.")) {
      clearAllOlderForms();
      startNewOrder();
      setMessage("✓ All older forms, order history, and drafts have been deleted.");
      setTimeout(() => setMessage(''), 4000);
    }
  }

  function startNewOrder() {
    try {
      localStorage.removeItem('nunes:purchasing_current_draft');
    } catch {}
    const fresh = blankPurchasingOrder();
    setOrder(fresh);
    setDirection('forward');
    setDirection('forward');
    setDirection('forward');
    setActiveStep(0);
    setMessage(`✓ Started new blank order ${fresh.order_id}`);
    setTimeout(() => setMessage(''), 3500);
  }

  // Memoize product names summary for the main header title
  const productSummary = useMemo(() => {
    const list = order.marketing_items
      .map(m => m.item_name?.trim() || (m.model ? `Model ${m.model.trim()}` : ''))
      .filter(Boolean);
    if (list.length === 0) return 'Commercial Equipment';
    return list.join(', ');
  }, [order.marketing_items]);

  return (
    <div className="nunes-form-workspace">
      {showPaper && (
        <PurchasingPaperForm order={order} onClose={() => setShowPaper(false)} />
      )}

      {showQuotation && (
        <PurchasingQuotationModal
          order={order}
          onClose={() => setShowQuotation(false)}
          onSaved={() => {
            setMessage('✓ Commercial quotation saved.');
            setTimeout(() => setMessage(''), 3500);
          }}
          onStartNewOrder={() => {
            setShowQuotation(false);
            setCelebrationData({
              recordNumber: String(order.quote_no || order.order_id || order.id),
              title: 'Quotation Dispatched & Saved!',
              subtitle: 'Commercial quotation finalized and saved. Transitioning to fresh new order.'
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
                  <FolderOpen size={18} style={{ color: '#2563eb' }} />
                  <span>
                    {isAdminOrMd
                      ? `All Saved Purchasing Orders (${visibleSavedOrders.length})`
                      : `My Saved Purchasing Orders (${visibleSavedOrders.length})`}
                  </span>
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {isAdminOrMd
                    ? 'Master Administration View • Showing orders across all staff members'
                    : `Account: ${currentUserEmail} • Showing only the particular orders you created or handle`}
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
                  { key: 'ALL', label: `All (${savedOrdersList.length})` },
                  { key: 'suganya', label: 'Suganya' },
                  { key: 'senthil', label: 'Senthil' },
                  { key: 'rekha', label: 'Rekha' },
                  { key: 'sabitha', label: 'Sabitha' },
                  { key: 'priya', label: 'Azhalaku Priya' },
                  { key: 'aravind', label: 'Aravindh' },
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
                        border: isActive ? '1px solid #2563eb' : '1px solid #cbd5e1',
                        background: isActive ? '#2563eb' : '#ffffff',
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
                  placeholder="Search by Order ID, Customer, or Ordered Items..."
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
              {visibleSavedOrders.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  {isAdminOrMd
                    ? 'No purchasing orders match this search or staff filter.'
                    : `No purchasing orders recorded under your account (${currentUserEmail}) yet. Fill out the form and click Save Draft to save your first order.`}
                </div>
              ) : (
                visibleSavedOrders.map((o) => {
                  const prodName = (o.marketing_items || []).map((m) => m.item_name).filter(Boolean).join(', ') || 'Ordered Items';
                  const isCurrent = (o.order_id || o.id) === (order.order_id || order.id);
                  return (
                    <div
                      key={String(o.id || o.order_id)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: isCurrent ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                        backgroundColor: isCurrent ? '#eff6ff' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '14px', color: '#0f172a' }}>{o.order_id || o.id}</strong>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>
                            {o.current_status || 'In Progress'}
                          </span>
                          {o.createdBy && (
                            <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                              by {o.createdBy.split('@')[0]}
                            </span>
                          )}
                          {isCurrent && (
                            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }}>
                              ACTIVE IN FORM
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '13px', color: '#334155', fontWeight: 600, marginTop: '2px' }}>
                          {o.customer_name || 'Customer'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>
                          {prodName} • Total Value: ₹{Number(o.total_order_value || o.bill_amount || 0).toLocaleString()}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setOrder(o);
                          setShowSavedModal(false);
                          setMessage(`✓ Loaded purchasing order ${o.order_id || o.id} into form.`);
                          setTimeout(() => setMessage(''), 3500);
                        }}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '10px',
                          background: isCurrent ? '#cbd5e1' : '#2563eb',
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
                  <FolderOpen size={18} style={{ color: '#2563eb' }} />
                  <span>All Saved Purchasing Orders ({savedOrdersList.length})</span>
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
                  placeholder="Search by Order ID, Customer, or Ordered Items..."
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
              {savedOrdersList.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  No purchasing orders saved yet. Fill out the form and click <b>Save to Database</b> to record your first order.
                </div>
              ) : (
                savedOrdersList
                  .filter((o) => {
                    if (!searchSaved.trim()) return true;
                    const s = searchSaved.toLowerCase();
                    const name = String(o.customer_name || '').toLowerCase();
                    const orderId = String(o.order_id || o.id || '').toLowerCase();
                    const prod = (o.marketing_items || []).map((m: any) => String(m.item_name || '')).join(' ').toLowerCase();
                    return name.includes(s) || orderId.includes(s) || prod.includes(s);
                  })
                  .map((o) => {
                    const prodName = (o.marketing_items || []).map((m) => m.item_name).filter(Boolean).join(', ') || 'Ordered Items';
                    const isCurrent = (o.order_id || o.id) === (order.order_id || order.id);
                    return (
                      <div
                        key={String(o.id || o.order_id)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: isCurrent ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                          backgroundColor: isCurrent ? '#eff6ff' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '14px', color: '#0f172a' }}>{o.order_id || o.id}</strong>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>
                              {o.current_status || 'In Progress'}
                            </span>
                            {isCurrent && (
                              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }}>
                                ACTIVE IN FORM
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '13px', color: '#334155', fontWeight: 600, marginTop: '2px' }}>
                            {o.customer_name || 'Customer'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>
                            {prodName} • Total Value: ₹{Number(o.total_order_value || o.bill_amount || 0).toLocaleString()}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setOrder(o);
                            setShowSavedModal(false);
                            setMessage(`✓ Loaded purchasing order ${o.order_id || o.id} into form.`);
                            setTimeout(() => setMessage(''), 3500);
                          }}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            background: isCurrent ? '#cbd5e1' : '#2563eb',
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

      {/* Top Header */}
      <div className="nunes-form-header">
        <div>
          <span className="nunes-tag purchasing-badge">Purchasing Process</span>
          <h1 style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '22px', fontWeight: 800 }}>
            {order.customer_name ? (
              <>
                <span style={{ color: '#0f172a' }}>{order.customer_name}</span>
                <span style={{ color: '#94a3b8', fontWeight: 400 }}>•</span>
                <span style={{ color: '#1d4ed8', background: '#eff6ff', padding: '2px 10px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                  {productSummary}
                </span>
                <span style={{ color: '#94a3b8', fontWeight: 400 }}>•</span>
                <span style={{ color: '#64748b', fontSize: '18px', fontWeight: 700 }}>{order.order_id}</span>
              </>
            ) : (
              <>
                <span style={{ color: '#1d4ed8', background: '#eff6ff', padding: '2px 10px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                  {productSummary}
                </span>
                <span style={{ color: '#94a3b8', fontWeight: 400 }}>•</span>
                <span style={{ color: '#64748b', fontSize: '18px', fontWeight: 700 }}>Purchasing Order ({order.order_id})</span>
              </>
            )}
          </h1>
        </div>
        <div className="nunes-form-actions">
          <button
            type="button"
            className="btn"
            onClick={() => setShowSavedModal(true)}
            title="View & load all purchasing orders saved across all devices"
            style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontWeight: 700 }}
          >
            <FolderOpen size={15} style={{ color: '#1d4ed8' }} />
            <span>Saved Orders ({visibleSavedOrders.length})</span>
          </button>
          <button type="button" className="btn" onClick={startNewOrder} title="Start a fresh blank order">
            <Plus size={15} /> New Order
          </button>
          <button 
            type="button" 
            className="btn btn-quotation-header" 
            onClick={() => setShowQuotation(true)}
            title="Generate Commercial Quotation with WhatsApp & Gmail"
          >
            <FileCheck size={16} /> Quotation
          </button>
          <button type="button" className="btn" onClick={() => setShowPaper(true)}>
            <Printer size={15} /> Official Paper Form
          </button>
          <button type="button" className="btn" onClick={() => saveRecord(false)}>
            <Save size={15} /> Save Draft
          </button>
          <button 
            type="button" 
            className="btn primary" 
            onClick={() => saveRecord(true)}
            style={{ fontWeight: 700 }}
            title={activeStep === STEPS.length - 1 ? "Complete this order and move to next new form" : "Save and proceed to next step"}
          >
            {activeStep === STEPS.length - 1 ? (
              <>Complete &amp; Next Order <ArrowRight size={15} /></>
            ) : (
              <>Save &amp; Proceed <ArrowRight size={15} /></>
            )}
          </button>
        </div>
      </div>

      {/* ACTIVE PRODUCTS / ITEMS OUTPUT BANNER (VISIBLE ON ALL STEPS) */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
        border: '1.5px solid #bfdbfe',
        borderLeft: '5px solid #1d4ed8',
        borderRadius: '14px',
        padding: '14px 20px',
        marginBottom: '18px',
        boxShadow: '0 4px 16px -2px rgba(29, 78, 216, 0.10)',
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
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
            color: '#ffffff',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            boxShadow: '0 3px 10px rgba(29, 78, 216, 0.3)'
          }}>
            <FileText size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#1d4ed8' }}>
                Active Products in this Purchase Order ({order.marketing_items.length})
              </span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                • Order #{order.order_id}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '6px' }}>
              {order.marketing_items.map((item, i) => (
                <span key={item.id || i} style={{
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
                  <b style={{ color: '#0f172a', fontWeight: 750 }}>{item.item_name?.trim() || 'Ordered Item'}</b>
                  {item.model && <span style={{ color: '#1d4ed8', fontSize: '12px', fontWeight: 700 }}>({item.model})</span>}
                  <span style={{ color: '#64748b', fontSize: '11.5px' }}>Qty: {item.qty || 1}</span>
                  <span style={{
                    background: '#1d4ed8',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '5px',
                    fontSize: '11px',
                    fontWeight: 800
                  }}>
                    ₹{Number(item.item_value || 0).toFixed(2)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginLeft: 'auto' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Order Value
            </span>
            <b style={{ fontSize: '19px', color: '#1d4ed8', fontWeight: 850 }}>
              ₹ {order.total_order_value.toFixed(2)}
            </b>
          </div>
          {activeStep !== 0 && (
            <button
              type="button"
              onClick={() => goToStep(0)}
              style={{
                background: '#1d4ed8',
                border: '1px solid #1e40af',
                color: '#ffffff',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 750,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(29, 78, 216, 0.25)',
                transition: 'all 0.15s ease'
              }}
              title="Jump to Step 1: Marketing & Ordered Items"
            >
              Edit Items →
            </button>
          )}
        </div>
      </div>

      {message && <div className="notice success">{message}</div>}

      {/* Draft Saved Banner with Instant Close Option */}
      {draftSaveNotice && (
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
          border: '1.5px solid #93c5fd',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 4px 14px rgba(29, 78, 216, 0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#1d4ed8',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0
            }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#1e3a8a' }}>
                Draft Saved Successfully for Order #{order.order_id}!
              </div>
              <div style={{ fontSize: '12px', color: '#1d4ed8' }}>
                Saved to your purchasing records and synced across devices. You can close this form now or keep editing.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleSaveAndClose}
              style={{
                background: '#1d4ed8',
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
                boxShadow: '0 2px 6px rgba(29, 78, 216, 0.25)'
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

      {/* Stepper */}
      <div className="nunes-stepper">
        {STEPS.map((s, idx) => {
          const isCompleted = idx < activeStep;
          const isActive = idx === activeStep;
          return (
            <button
              key={s.key}
              type="button"
              className={`nunes-step-btn ${isActive ? 'active' : ''}`}
              onClick={() => goToStep(idx)}
              style={isCompleted ? { color: '#1d4ed8', background: '#eff6ff', borderColor: '#bfdbfe' } : undefined}
            >
              <span className="nunes-step-num" style={isCompleted ? { background: '#1d4ed8', color: '#ffffff' } : undefined}>
                {isCompleted ? <Check size={12} strokeWidth={3} /> : idx + 1}
              </span>
              <span>{s.label.split('. ')[1]}</span>
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="nunes-form-card">
        <div className="nunes-card-head">
          <h2>{STEPS[activeStep].title}</h2>
          <span className="nunes-status-pill">{order.current_status}</span>
        </div>

        <PageTransition pageKey={activeStep} effect="slide" direction={direction}>
        {/* STEP 1: MARKETING */}
        {activeStep === 0 && (
          <div className="nunes-form-fields">
            <div className="nunes-grid3">
              <label>
                Quote No:
                <input value={order.quote_no} onChange={e => updateOrder('quote_no', e.target.value)} />
              </label>
              <label>
                Quote Date:
                <input type="date" value={order.quote_date} onChange={e => updateOrder('quote_date', e.target.value)} />
              </label>
              <label>
                MKT Person:
                <input value={order.marketing_person} onChange={e => updateOrder('marketing_person', e.target.value)} placeholder="Sales Engineer / Rep" />
              </label>
            </div>

            <div className="nunes-grid3">
              <label>
                Customer Name *:
                <input value={order.customer_name} onChange={e => updateOrder('customer_name', e.target.value)} placeholder="Company or Client name" />
              </label>
              <label>
                Place / City:
                <input value={order.place} onChange={e => updateOrder('place', e.target.value)} />
              </label>
              <label>
                Delivery Period:
                <input value={order.delivery_period} onChange={e => updateOrder('delivery_period', e.target.value)} />
              </label>
            </div>

            <div className="nunes-grid2">
              <label>
                Commercial Terms:
                <input value={order.terms} onChange={e => updateOrder('terms', e.target.value)} placeholder="e.g. 50% advance, balance on dispatch" />
              </label>
              <label>
                Market Type:
                <select value={order.market_type} onChange={e => updateOrder('market_type', e.target.value as any)}>
                  <option value="IND">India Domestic (IND)</option>
                  <option value="EXPORT">International (EXPORT)</option>
                </select>
              </label>
            </div>

            {/* Items Table */}
            <div className="nunes-items-wrap">
              <div className="nunes-items-head">
                <h3>Ordered Items</h3>
                <button type="button" className="btn mini-btn" onClick={addItem}>
                  <Plus size={13} /> Add Item Row
                </button>
              </div>

              <table className="nunes-table">
                <thead>
                  <tr>
                    <th style={{ width: '4%' }}>#</th>
                    <th style={{ width: '44%' }}>Item Name &amp; Photo</th>
                    <th style={{ width: '18%' }}>Model</th>
                    <th style={{ width: '8%' }}>Qty</th>
                    <th style={{ width: '13%' }}>Item Value (₹)</th>
                    <th style={{ width: '10%' }}>Add. Charge</th>
                    <th style={{ width: '3%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {order.marketing_items.map((item, idx) => (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {item.image_url ? (
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                border: '1.5px solid #1d4ed8',
                                background: '#ffffff',
                                cursor: 'pointer',
                                flexShrink: 0
                              }}
                              onClick={() => setEnlargedPhoto(item.image_url!)}
                              title="Click to zoom photo"
                            >
                              <img src={item.image_url} alt="Item" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                          ) : (
                            <label
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '6px',
                                border: '1.5px dashed #94a3b8',
                                display: 'grid',
                                placeItems: 'center',
                                cursor: 'pointer',
                                color: '#94a3b8',
                                background: '#f8fafc',
                                flexShrink: 0
                              }}
                              title="Upload Item Photo"
                            >
                              <Camera size={14} />
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = ev => {
                                      const res = ev.target?.result as string;
                                      if (res) updateItem(idx, { image_url: res });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          )}
                          <input
                            value={item.item_name}
                            onChange={e => updateItem(idx, { item_name: e.target.value })}
                            placeholder="Item name or description"
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setCatalogTargetIdx(idx);
                              setShowCatalogModal(true);
                            }}
                            style={{
                              padding: '5px 8px',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                              color: '#1d4ed8',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Select from product catalog"
                          >
                            <Package size={11} /> Catalog
                          </button>
                        </div>
                      </td>
                      <td>
                        <input value={item.model} onChange={e => updateItem(idx, { model: e.target.value })} placeholder="Model code" />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          placeholder="1"
                          value={item.qty ? String(item.qty) : ''}
                          onFocus={e => {
                            if (e.target.value === '0') e.target.select();
                          }}
                          onChange={e => {
                            const cleaned = cleanNumberString(e.target.value);
                            e.target.value = cleaned;
                            updateItem(idx, { qty: parseCleanNumber(cleaned) });
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={item.item_value ? String(item.item_value) : ''}
                          onFocus={e => {
                            if (e.target.value === '0') e.target.select();
                          }}
                          onChange={e => {
                            const cleaned = cleanNumberString(e.target.value);
                            e.target.value = cleaned;
                            updateItem(idx, { item_value: parseCleanNumber(cleaned) });
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={item.add_charge ? String(item.add_charge) : ''}
                          onFocus={e => {
                            if (e.target.value === '0') e.target.select();
                          }}
                          onChange={e => {
                            const cleaned = cleanNumberString(e.target.value);
                            e.target.value = cleaned;
                            updateItem(idx, { add_charge: parseCleanNumber(cleaned) });
                          }}
                        />
                      </td>
                      <td>
                        <button type="button" className="iconButton danger" onClick={() => removeItem(idx)}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Order Value:</td>
                    <td colSpan={3} style={{ fontWeight: 'bold', color: '#1b4f9c', fontSize: '15px' }}>
                      ₹ {order.total_order_value.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Service Checkboxes */}
            <div className="nunes-service-options">
              <b>Included Services:</b>
              <label className="cl-checkbox">
                <input type="checkbox" checked={order.service_demo} onChange={e => updateOrder('service_demo', e.target.checked)} />
                <span>Demo Required</span>
              </label>
              <label className="cl-checkbox">
                <input type="checkbox" checked={order.service_installation} onChange={e => updateOrder('service_installation', e.target.checked)} />
                <span>Installation Required</span>
              </label>
              <label className="cl-checkbox">
                <input type="checkbox" checked={order.service_calibration} onChange={e => updateOrder('service_calibration', e.target.checked)} />
                <span>Calibration</span>
              </label>
            </div>

            <div className="nunes-grid3">
              <label>
                Service Person:
                <input value={order.service_person} onChange={e => updateOrder('service_person', e.target.value)} />
              </label>
              <label>
                Service Date:
                <input type="date" value={order.service_date} onChange={e => updateOrder('service_date', e.target.value)} />
              </label>
              <label>
                Service Charge (₹):
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={order.service_amount ? String(order.service_amount) : ''}
                  onFocus={e => {
                    if (e.target.value === '0') e.target.select();
                  }}
                  onChange={e => {
                    const cleaned = cleanNumberString(e.target.value);
                    e.target.value = cleaned;
                    updateOrder('service_amount', parseCleanNumber(cleaned));
                  }}
                />
              </label>
            </div>
          </div>
        )}

        {/* STEP 2: DISPATCH */}
        {activeStep === 1 && (
          <div className="nunes-form-fields">
            <div className="nunes-grid3">
              <label>
                Packing By:
                <input value={order.packing_by} onChange={e => updateOrder('packing_by', e.target.value)} placeholder="Staff member name" />
              </label>
              <label>
                Dispatch On:
                <input type="date" value={order.dispatch_on} onChange={e => updateOrder('dispatch_on', e.target.value)} />
              </label>
              <label>
                Consignment Weight:
                <input value={order.weight} onChange={e => updateOrder('weight', e.target.value)} placeholder="e.g. 8.5 kg" />
              </label>
            </div>

            <div className="nunes-grid3">
              <label>
                Courier Mode:
                <select value={order.courier_mode} onChange={e => updateOrder('courier_mode', e.target.value as any)}>
                  <option value="ROAD">Road Transport</option>
                  <option value="AIR">Air Cargo</option>
                  <option value="RAILWAY">Railway Express</option>
                  <option value="OTHER">Hand Delivery / Other</option>
                </select>
              </label>
              <label>
                Freight / Dispatch Amount (₹):
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={order.dispatch_amount ? String(order.dispatch_amount) : ''}
                  onFocus={e => {
                    if (e.target.value === '0') e.target.select();
                  }}
                  onChange={e => {
                    const cleaned = cleanNumberString(e.target.value);
                    e.target.value = cleaned;
                    updateOrder('dispatch_amount', parseCleanNumber(cleaned));
                  }}
                />
              </label>
              <label>
                Dispatch Staff Sign:
                <input value={order.dispatch_sign} onChange={e => updateOrder('dispatch_sign', e.target.value)} placeholder="Initials or signature" />
              </label>
            </div>
          </div>
        )}

        {/* STEP 3: PAYMENT */}
        {activeStep === 2 && (
          <div className="nunes-form-fields">
            <div className="nunes-kpi-summary">
              <div>
                <span>Total Order Value</span>
                <b>₹ {order.total_order_value.toFixed(2)}</b>
              </div>
              <div>
                <span>Total Received</span>
                <b style={{ color: '#15803d' }}>₹ {totalReceived.toFixed(2)}</b>
              </div>
              <div>
                <span>Balance Outstanding</span>
                <b style={{ color: balanceDue > 0 ? '#b45309' : '#15803d' }}>₹ {balanceDue.toFixed(2)}</b>
              </div>
            </div>

            <div className="nunes-items-wrap">
              <div className="nunes-items-head">
                <h3>Customer Payment Installments</h3>
                <button type="button" className="btn mini-btn" onClick={() => {
                  setOrder(prev => ({
                    ...prev,
                    customer_payments: [...prev.customer_payments, { id: String(Date.now()), payment_date: new Date().toISOString().slice(0, 10), bank_mode: 'NEFT', amount: 0 }]
                  }));
                }}>
                  <Plus size={13} /> Add Payment Row
                </button>
              </div>

              <table className="nunes-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Payment / Bank Mode</th>
                    <th>Amount Received (₹)</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {order.customer_payments.map((p, idx) => (
                    <tr key={p.id}>
                      <td>
                        <input type="date" value={p.payment_date} onChange={e => {
                          const list = [...order.customer_payments];
                          list[idx].payment_date = e.target.value;
                          setOrder(prev => ({ ...prev, customer_payments: list }));
                        }} />
                      </td>
                      <td>
                        <input value={p.bank_mode} onChange={e => {
                          const list = [...order.customer_payments];
                          list[idx].bank_mode = e.target.value;
                          setOrder(prev => ({ ...prev, customer_payments: list }));
                        }} placeholder="e.g. HDFC NEFT / Cash / Cheque" />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={p.amount ? String(p.amount) : ''}
                          onFocus={e => {
                            if (e.target.value === '0') e.target.select();
                          }}
                          onChange={e => {
                            const cleaned = cleanNumberString(e.target.value);
                            e.target.value = cleaned;
                            const list = [...order.customer_payments];
                            list[idx].amount = parseCleanNumber(cleaned);
                            setOrder(prev => ({ ...prev, customer_payments: list }));
                          }}
                        />
                      </td>
                      <td>
                        <button type="button" className="iconButton danger" onClick={() => {
                          if (order.customer_payments.length > 1) {
                            setOrder(prev => ({ ...prev, customer_payments: prev.customer_payments.filter((_, i) => i !== idx) }));
                          }
                        }}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 4: SUPPLIER */}
        {activeStep === 3 && (
          <div className="nunes-form-fields">
            <div className="nunes-items-wrap">
              <div className="nunes-items-head">
                <h3>Supplier Purchase Allocations</h3>
                <button type="button" className="btn mini-btn" onClick={() => {
                  setOrder(prev => ({ ...prev, supplier_rows: [...prev.supplier_rows, newSupplierRow()] }));
                }}>
                  <Plus size={13} /> Add Supplier Row
                </button>
              </div>

              <table className="nunes-table">
                <thead>
                  <tr>
                    <th>Supplier Name</th>
                    <th>Model Code</th>
                    <th>Net Value (₹)</th>
                    <th>Commercial Terms</th>
                    <th>Delivery Period</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {order.supplier_rows.map((s, idx) => (
                    <tr key={s.id}>
                      <td>
                        <input value={s.supplier} onChange={e => {
                          const list = [...order.supplier_rows];
                          list[idx].supplier = e.target.value;
                          setOrder(prev => ({ ...prev, supplier_rows: list }));
                        }} placeholder="Manufacturer or Vendor" />
                      </td>
                      <td>
                        <input value={s.model} onChange={e => {
                          const list = [...order.supplier_rows];
                          list[idx].model = e.target.value;
                          setOrder(prev => ({ ...prev, supplier_rows: list }));
                        }} />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={s.net_value ? String(s.net_value) : ''}
                          onFocus={e => {
                            if (e.target.value === '0') e.target.select();
                          }}
                          onChange={e => {
                            const cleaned = cleanNumberString(e.target.value);
                            e.target.value = cleaned;
                            const list = [...order.supplier_rows];
                            list[idx].net_value = parseCleanNumber(cleaned);
                            setOrder(prev => ({ ...prev, supplier_rows: list }));
                          }}
                        />
                      </td>
                      <td>
                        <input value={s.terms} onChange={e => {
                          const list = [...order.supplier_rows];
                          list[idx].terms = e.target.value;
                          setOrder(prev => ({ ...prev, supplier_rows: list }));
                        }} />
                      </td>
                      <td>
                        <input value={s.delivery_period} onChange={e => {
                          const list = [...order.supplier_rows];
                          list[idx].delivery_period = e.target.value;
                          setOrder(prev => ({ ...prev, supplier_rows: list }));
                        }} />
                      </td>
                      <td>
                        <button type="button" className="iconButton danger" onClick={() => {
                          if (order.supplier_rows.length > 1) {
                            setOrder(prev => ({ ...prev, supplier_rows: prev.supplier_rows.filter((_, i) => i !== idx) }));
                          }
                        }}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="nunes-grid2">
              <label>
                Order Placed To:
                <input value={order.order_place_to} onChange={e => updateOrder('order_place_to', e.target.value)} placeholder="Company / Supplier Name" />
              </label>
              <label>
                Supplier Procurement Sign:
                <input value={order.supplier_sign} onChange={e => updateOrder('supplier_sign', e.target.value)} />
              </label>
            </div>
          </div>
        )}

        {/* STEP 5: ACCOUNTS */}
        {activeStep === 4 && (
          <div className="nunes-form-fields">
            <div className="nunes-grid4">
              <label>
                PO Date:
                <input type="date" value={order.po_date} onChange={e => updateOrder('po_date', e.target.value)} />
              </label>
              <label>
                PO Number:
                <input value={order.po_no} onChange={e => updateOrder('po_no', e.target.value)} />
              </label>
              <label>
                Supplier Name:
                <input value={order.accounts_supplier_name} onChange={e => updateOrder('accounts_supplier_name', e.target.value)} />
              </label>
              <label>
                Terms:
                <input value={order.accounts_terms} onChange={e => updateOrder('accounts_terms', e.target.value)} />
              </label>
            </div>

            <div className="nunes-grid3">
              <label>
                Proforma No:
                <input value={order.proforma_no} onChange={e => updateOrder('proforma_no', e.target.value)} />
              </label>
              <label>
                Courier Today Basic:
                <input value={order.courier_today_basic} onChange={e => updateOrder('courier_today_basic', e.target.value)} />
              </label>
              <label>
                PDC On Delivery:
                <input value={order.pdc_on_delivery} onChange={e => updateOrder('pdc_on_delivery', e.target.value)} />
              </label>
            </div>

            <div className="nunes-grid3">
              <label>
                Dispatch Date:
                <input type="date" value={order.accounts_dispatch_date} onChange={e => updateOrder('accounts_dispatch_date', e.target.value)} />
              </label>
              <label>
                Courier Name:
                <input value={order.accounts_courier} onChange={e => updateOrder('accounts_courier', e.target.value)} />
              </label>
              <label>
                Packing Mode:
                <input value={order.packing_mode} onChange={e => updateOrder('packing_mode', e.target.value)} />
              </label>
            </div>

            <div className="nunes-grid3">
              <label>
                Docket No:
                <input value={order.docket_no} onChange={e => updateOrder('docket_no', e.target.value)} />
              </label>
              <label>
                Courier Charges (₹):
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={order.courier_rs ? String(order.courier_rs) : ''}
                  onFocus={e => {
                    if (e.target.value === '0') e.target.select();
                  }}
                  onChange={e => {
                    const cleaned = cleanNumberString(e.target.value);
                    e.target.value = cleaned;
                    updateOrder('courier_rs', parseCleanNumber(cleaned));
                  }}
                />
              </label>
              <label>
                Item Received On:
                <input type="date" value={order.item_received_on} onChange={e => updateOrder('item_received_on', e.target.value)} />
              </label>
            </div>

            {/* Profit Margin Box */}
            <div className="nunes-profit-card" style={{ marginTop: '16px' }}>
              <div className="nunes-profit-grid">
                <div>
                  <span>Total Purchase Cost</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={order.total_purchase_cost ? String(order.total_purchase_cost) : ''}
                    onFocus={e => {
                      if (e.target.value === '0') e.target.select();
                    }}
                    onChange={e => {
                      const cleaned = cleanNumberString(e.target.value);
                      e.target.value = cleaned;
                      updateOrder('total_purchase_cost', parseCleanNumber(cleaned));
                    }}
                  />
                </div>
                <div>
                  <span>Total Selling Cost</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={order.total_selling_cost || order.total_order_value ? String(order.total_selling_cost || order.total_order_value) : ''}
                    onFocus={e => {
                      if (e.target.value === '0') e.target.select();
                    }}
                    onChange={e => {
                      const cleaned = cleanNumberString(e.target.value);
                      e.target.value = cleaned;
                      updateOrder('total_selling_cost', parseCleanNumber(cleaned));
                    }}
                  />
                </div>
                <div>
                  <span>Calculated Net Profit</span>
                  <b style={{ color: '#15803d', fontSize: '18px' }}>₹ {order.profit.toFixed(2)}</b>
                </div>
                <div>
                  <span>Margin Percentage</span>
                  <b style={{ fontSize: '18px' }}>{order.profit_percentage}%</b>
                </div>
              </div>
            </div>

            <div className="nunes-grid2">
              <label>
                Account Remarks:
                <input value={order.account_remarks} onChange={e => updateOrder('account_remarks', e.target.value)} />
              </label>
              <label>
                Accounts Signature:
                <input value={order.account_signature} onChange={e => updateOrder('account_signature', e.target.value)} />
              </label>
            </div>
          </div>
        )}

        {/* STEP 6: FINAL APPROVAL */}
        {activeStep === 5 && (
          <div className="nunes-form-fields">
            <div className="nunes-approval-box">
              <Check size={28} className="nunes-green-check" />
              <div>
                <h3>All Prior Workflow Stages Verified</h3>
                <p>Marketing, Dispatch, Customer Payment, Supplier Allocation and Accounts have been reviewed.</p>
              </div>
            </div>

            <div className="nunes-grid3">
              <label>
                Approval Date:
                <input type="date" value={order.approval_date} onChange={e => updateOrder('approval_date', e.target.value)} />
              </label>
              <label>
                Approved By:
                <input value={order.approved_by} onChange={e => updateOrder('approved_by', e.target.value)} />
              </label>
              <label>
                Final Status:
                <select value={order.current_status} onChange={e => updateOrder('current_status', e.target.value)}>
                  <option value="Marketing">Marketing</option>
                  <option value="Dispatch">Dispatch</option>
                  <option value="Payment">Payment</option>
                  <option value="Supplier">Supplier</option>
                  <option value="Accounts">Accounts</option>
                  <option value="Completed">Completed / Approved</option>
                </select>
              </label>
            </div>

            <label>
              Management Signoff Remarks / Notes:
              <textarea
                rows={4}
                value={order.remarks}
                onChange={e => updateOrder('remarks', e.target.value)}
                placeholder="Final approval observations, customer dispatch clearance, or special instructions..."
              />
            </label>
          </div>
        )}
        </PageTransition>

        {/* Navigation buttons */}
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
            {activeStep < STEPS.length - 1 ? (
              <button 
                type="button" 
                className="btn primary" 
                onClick={() => saveRecord(true)}
                style={{ background: '#1d4ed8', borderColor: '#1d4ed8', color: '#ffffff', fontWeight: 750, boxShadow: '0 4px 12px rgba(29, 78, 216, 0.2)' }}
              >
                Next Step: {STEPS[activeStep + 1].label.split('. ')[1]} <ArrowRight size={14} />
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  className="btn primary" 
                  onClick={() => saveRecord(true)}
                  style={{ background: '#059669', borderColor: '#059669', color: '#ffffff', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '6px' }}
                  title="Complete this order and move to next new form"
                >
                  <Check size={16} /> Complete &amp; Start Next Order
                </button>
                <button 
                  type="button" 
                  className="btn btn-complete-quote" 
                  onClick={() => {
                    const updated = {
                      ...order,
                      updated_at: new Date().toISOString(),
                      current_status: 'COMPLETED',
                      approval_complete: true
                    };
                    setOrder(updated);
                    try {
                      const raw = localStorage.getItem('nunes:purchasing_orders');
                      const list = raw ? JSON.parse(raw) : [];
                      const idx = list.findIndex((x: any) => String(x.id) === String(updated.id));
                      if (idx >= 0) list[idx] = updated; else list.unshift(updated);
                      localStorage.setItem('nunes:purchasing_orders', JSON.stringify(list));
                    } catch {}
                    setShowQuotation(true);
                  }}
                  title="Complete order and generate Commercial Quotation for WhatsApp & Gmail"
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
          startNewOrder();
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
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#1d4ed8', color: '#fff', display: 'grid', placeItems: 'center' }}>
                  <Package size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                    Select Instrument from Product Catalog
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                    Populates item name, model, photo, technical specifications, and catalog price for Item #{catalogTargetIdx + 1}
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
                  placeholder="Search by instrument name, model, category, specifications..."
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
                      updateItem(catalogTargetIdx, {
                        item_name: prod.name,
                        model: prod.model,
                        item_value: prod.price,
                        image_url: prod.imageUrl,
                        specifications: prod.specifications
                      });
                      setShowCatalogModal(false);
                      setMessage(`✓ Loaded "${prod.name}" into Item #${catalogTargetIdx + 1}`);
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
                      e.currentTarget.style.borderColor = '#1d4ed8';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(29,78,216,0.12)';
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
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#1d4ed8', flexShrink: 0 }}>
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
                        <span style={{ fontSize: '10px', background: '#eff6ff', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          Range: {prod.range}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8' }}>
                          Add to Order →
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
                style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: 600, textDecoration: 'none' }}
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
              <span style={{ fontSize: '13px', fontWeight: 750, color: '#0f172a' }}>Ordered Item Photo Preview</span>
              <button
                type="button"
                onClick={() => setEnlargedPhoto(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ width: '100%', height: '360px', borderRadius: '12px', overflow: 'hidden', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={enlargedPhoto} alt="Enlarged Item" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
            <button
              type="button"
              onClick={() => setEnlargedPhoto(null)}
              style={{ marginTop: '14px', padding: '8px 20px', borderRadius: '8px', background: '#1d4ed8', color: '#fff', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
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
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#1d4ed8', color: '#fff', display: 'grid', placeItems: 'center' }}>
                  <Package size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                    Select Instrument from Product Catalog
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                    Populates item name, model, photo, technical specifications, and catalog price for Item #{catalogTargetIdx + 1}
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
                  placeholder="Search by instrument name, model, category, specifications..."
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
                      updateItem(catalogTargetIdx, {
                        item_name: prod.name,
                        model: prod.model,
                        item_value: prod.price,
                        image_url: prod.imageUrl,
                        specifications: prod.specifications
                      });
                      setShowCatalogModal(false);
                      setMessage(`✓ Loaded "${prod.name}" into Item #${catalogTargetIdx + 1}`);
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
                      e.currentTarget.style.borderColor = '#1d4ed8';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(29,78,216,0.12)';
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
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#1d4ed8', flexShrink: 0 }}>
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
                        <span style={{ fontSize: '10px', background: '#eff6ff', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          Range: {prod.range}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8' }}>
                          Add to Order →
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
                style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: 600, textDecoration: 'none' }}
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
              <span style={{ fontSize: '13px', fontWeight: 750, color: '#0f172a' }}>Ordered Item Photo Preview</span>
              <button
                type="button"
                onClick={() => setEnlargedPhoto(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ width: '100%', height: '360px', borderRadius: '12px', overflow: 'hidden', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={enlargedPhoto} alt="Enlarged Item" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
            <button
              type="button"
              onClick={() => setEnlargedPhoto(null)}
              style={{ marginTop: '14px', padding: '8px 20px', borderRadius: '8px', background: '#1d4ed8', color: '#fff', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
            >
              Done Viewing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
