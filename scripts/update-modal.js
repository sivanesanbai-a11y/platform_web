const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'forms', 'ServiceQuotationModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update ServiceQuotationModalProps to include workflow
content = content.replace(
  '    branchName?: string;\n    notes?: string;\n  };',
  '    branchName?: string;\n    notes?: string;\n    workflow?: any;\n  };'
);

// 2. Update initial discount and tax rate
content = content.replace(
  '  const [taxRate, setTaxRate] = useState<number>(18);\n  const [discount, setDiscount] = useState<number>(Number(job.totals?.discount || 0));',
  '  const [taxRate, setTaxRate] = useState<number>(Number(job.workflow?.priyaGstRate ?? (job.totals as any)?.gstRate ?? 18));\n  const [discount, setDiscount] = useState<number>(Number(job.totals?.discount ?? job.workflow?.priyaDiscount ?? 0));'
);

// 3. Update products definition to state with dynamic extraction
const oldProductsBlock = `  // Products
  const products: ServiceProduct[] = (job.products && job.products.length > 0)
    ? job.products
    : [{
        id: '1',
        productName: 'Equipment Service & Calibration',
        makeModel: 'Standard',
        serialNo: '',
        qty: 1,
        status: 'RECEIVED',
        complaint: 'General service and diagnostic check',
        repairWork: 'Component inspection and calibration',
        productValue: 0,
        repairEstimate: Number(job.totals?.repairEstimate || job.totals?.totalEstimate || 1500),
        repairCategory: 'MINIMUM_30',
        repairPercent: 30,
        onlinePrice: 0,
        onlinePriceSource: '',
        onlinePriceConfirmed: false,
        onlinePriceCheckedAt: '',
        estimateStatus: 'ESTIMATE_READY',
        productImageUrl: '',
        productSpecifications: '',
        onlineProductUrl: '',
        onlineDetailsTitle: '',
        onlineDetailsFetchedAt: '',
        onlineLookupQuery: '',
        productImageUrls: [],
        marketPriceMin: 0,
        marketPriceMax: 0,
        marketPriceMedian: 0,
        marketPriceSampleCount: 0
      }];`;

const newProductsBlock = `  // Products & Line Items Dynamic Initialization
  const initialProducts = useMemo<ServiceProduct[]>(() => {
    const rawProds: ServiceProduct[] = (job.products && job.products.length > 0)
      ? job.products.map((p, idx) => {
          const serviceChargeFallback = Number(
            job.workflow?.priyaServiceCharge ||
            job.workflow?.priyaRepairEstimate ||
            job.totals?.repairEstimate ||
            0
          );
          const activeRate = Number(p.repairEstimate || 0) > 0 
            ? Number(p.repairEstimate) 
            : (serviceChargeFallback > 0 ? serviceChargeFallback : 1500);
          
          const senthilNotes = job.workflow?.senthilWorkSummary || job.workflow?.senthilRepairNotes || '';
          const activeWork = p.repairWork || senthilNotes || p.complaint || 'Diagnostic testing, precision calibration and inspection';
          const activeCategory = p.repairCategory || (job.workflow?.senthilRepairPercent === 50 ? 'MAXIMUM_50' : 'MINIMUM_30');

          return {
            ...p,
            repairEstimate: activeRate,
            repairWork: activeWork,
            repairCategory: activeCategory as any,
            repairPercent: p.repairPercent || job.workflow?.senthilRepairPercent || 30
          };
        })
      : [{
          id: 'prod-1',
          productName: (job as any).item_description || (job as any).equipmentName || 'Equipment Service & Calibration',
          makeModel: (job as any).makeModel || 'Industrial Instrument',
          serialNo: (job as any).serialNo || '',
          qty: 1,
          status: 'RECEIVED' as const,
          complaint: (job as any).complaint || 'General diagnostic and service',
          repairWork: job.workflow?.senthilWorkSummary || job.workflow?.senthilRepairNotes || 'Component diagnostic, precision calibration & testing',
          productValue: 0,
          repairEstimate: Number(job.workflow?.priyaServiceCharge || job.totals?.repairEstimate || job.totals?.totalEstimate || 1500),
          repairCategory: (job.workflow?.senthilRepairPercent === 50 ? 'MAXIMUM_50' : 'MINIMUM_30') as any,
          repairPercent: job.workflow?.senthilRepairPercent || 30,
          onlinePrice: 0,
          onlinePriceSource: '',
          onlinePriceConfirmed: false,
          onlinePriceCheckedAt: '',
          estimateStatus: 'ESTIMATE_READY' as const,
          productImageUrl: '',
          productSpecifications: '',
          onlineProductUrl: '',
          onlineDetailsTitle: '',
          onlineDetailsFetchedAt: '',
          onlineLookupQuery: '',
          productImageUrls: [],
          marketPriceMin: 0,
          marketPriceMax: 0,
          marketPriceMedian: 0,
          marketPriceSampleCount: 0
        }];

    // Dynamic spare parts injection if specified in pricing workflow
    const spareCost = Number(
      job.workflow?.priyaSparePartsCost ??
      job.workflow?.estimatedSpareCost ??
      (job.totals as any)?.spareParts ??
      0
    );
    if (spareCost > 0 && !rawProds.some(p => (p.productName || '').toLowerCase().includes('spare'))) {
      rawProds.push({
        id: 'spares-' + Date.now(),
        productName: 'Replacement Spare Parts & Components',
        makeModel: 'OEM Certified',
        serialNo: '',
        qty: 1,
        status: 'RECEIVED' as const,
        complaint: '',
        repairWork: 'OEM replacement components, sensor modules & calibration seals',
        productValue: 0,
        repairEstimate: spareCost,
        repairCategory: 'MINIMUM_30' as any,
        repairPercent: 30,
        onlinePrice: 0,
        onlinePriceSource: '',
        onlinePriceConfirmed: false,
        onlinePriceCheckedAt: '',
        estimateStatus: 'ESTIMATE_READY' as const,
        productImageUrl: '',
        productSpecifications: '',
        onlineProductUrl: '',
        onlineDetailsTitle: '',
        onlineDetailsFetchedAt: '',
        onlineLookupQuery: '',
        productImageUrls: [],
        marketPriceMin: 0,
        marketPriceMax: 0,
        marketPriceMedian: 0,
        marketPriceSampleCount: 0
      });
    }

    return rawProds;
  }, [job]);

  const [products, setProducts] = useState<ServiceProduct[]>(initialProducts);

  React.useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const updateProductRate = (idx: number, newRate: number) => {
    setProducts(prev => prev.map((p, i) => i === idx ? { ...p, repairEstimate: newRate } : p));
  };

  const updateProductQty = (idx: number, newQty: number) => {
    setProducts(prev => prev.map((p, i) => i === idx ? { ...p, qty: Math.max(1, newQty) } : p));
  };

  const updateProductName = (idx: number, newName: string) => {
    setProducts(prev => prev.map((p, i) => i === idx ? { ...p, productName: newName } : p));
  };

  const updateProductWork = (idx: number, newWork: string) => {
    setProducts(prev => prev.map((p, i) => i === idx ? { ...p, repairWork: newWork } : p));
  };

  const addLineItem = () => {
    setProducts(prev => [
      ...prev,
      {
        id: 'item-' + Date.now(),
        productName: 'Additional Service / Spare Component',
        makeModel: 'Industrial Standard',
        serialNo: '',
        qty: 1,
        status: 'RECEIVED' as const,
        complaint: '',
        repairWork: 'Precision calibration, technical labor & verification',
        productValue: 0,
        repairEstimate: 500,
        repairCategory: 'MINIMUM_30' as any,
        repairPercent: 30,
        onlinePrice: 0,
        onlinePriceSource: '',
        onlinePriceConfirmed: false,
        onlinePriceCheckedAt: '',
        estimateStatus: 'ESTIMATE_READY' as const,
        productImageUrl: '',
        productSpecifications: '',
        onlineProductUrl: '',
        onlineDetailsTitle: '',
        onlineDetailsFetchedAt: '',
        onlineLookupQuery: '',
        productImageUrls: [],
        marketPriceMin: 0,
        marketPriceMax: 0,
        marketPriceMedian: 0,
        marketPriceSampleCount: 0
      }
    ]);
  };

  const removeLineItem = (idx: number) => {
    if (products.length <= 1) return;
    setProducts(prev => prev.filter((_, i) => i !== idx));
  };`;

// 4. Add dynamic items customization into controls area
const oldControlsEnd = `            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Customer Email Address:
              </label>
              <input
                type="email"
                placeholder="customer@domain.com"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                style={{ width: '100%', padding: '7px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
          </div>
        </div>`;

const newControlsEnd = `            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Customer Email Address:
              </label>
              <input
                type="email"
                placeholder="customer@domain.com"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                style={{ width: '100%', padding: '7px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
          </div>

          {/* Dynamic Line Items & Rate Customization */}
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Line Items, Scope of Work &amp; Pricing Rates
                </span>
                <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>
                  (Edit rates or descriptions to dynamically recalculate the PDF)
                </span>
              </div>
              <button
                type="button"
                onClick={addLineItem}
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  color: '#166534',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={13} /> Add Spare / Line Item
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {products.map((p, idx) => (
                <div
                  key={p.id || idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(140px, 1.4fr) minmax(180px, 2fr) 60px 110px 32px',
                    gap: '8px',
                    alignItems: 'center',
                    background: '#f8fafc',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#64748b', marginBottom: '2px' }}>
                      Item Name #{idx + 1}
                    </label>
                    <input
                      type="text"
                      value={p.productName || ''}
                      onChange={e => updateProductName(idx, e.target.value)}
                      placeholder="Equipment / Spare Name"
                      style={{ width: '100%', padding: '5px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '5px', background: '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#64748b', marginBottom: '2px' }}>
                      Diagnostics / Scope of Work
                    </label>
                    <input
                      type="text"
                      value={p.repairWork || ''}
                      onChange={e => updateProductWork(idx, e.target.value)}
                      placeholder="e.g. Overhaul, sensor replacement & calibration"
                      style={{ width: '100%', padding: '5px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '5px', background: '#fff' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#64748b', marginBottom: '2px', textAlign: 'center' }}>
                      Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={p.qty || 1}
                      onChange={e => updateProductQty(idx, parseInt(e.target.value) || 1)}
                      style={{ width: '100%', padding: '5px 4px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '5px', background: '#fff', textAlign: 'center' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: '#64748b', marginBottom: '2px', textAlign: 'right' }}>
                      Rate (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={p.repairEstimate || 0}
                      onChange={e => updateProductRate(idx, parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '5px', background: '#fff', fontWeight: 700, color: '#0f2e5a', textAlign: 'right' }}
                    />
                  </div>

                  <div style={{ paddingTop: '14px', textAlign: 'center' }}>
                    {products.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeLineItem(idx)}
                        title="Remove item"
                        style={{ background: 'transparent', border: 0, color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      >
                        <X size={15} />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>`;

// 5. MD approval display on sheet
const oldSpecsBlock = `                <div><b>Overall Status:</b> <span style={{ color: '#0284c7', fontWeight: 700 }}>{job.status || 'ESTIMATE READY'}</span></div>
                <div><b>Equipments Included:</b> {products.length} Unit(s)</div>
              </div>`;

const newSpecsBlock = `                <div><b>Overall Status:</b> <span style={{ color: '#0284c7', fontWeight: 700 }}>{job.status || 'ESTIMATE READY'}</span></div>
                <div><b>Equipments Included:</b> {products.length} Unit(s)</div>
                {job.workflow?.approvedByMd && (
                  <div style={{ color: '#15803d', fontWeight: 700, marginTop: '2px', fontSize: '11px' }}>
                    ✓ MD Executive Approved (₹{Number(job.workflow.mdApprovedPrice || grandTotal).toLocaleString('en-IN')})
                  </div>
                )}
              </div>`;

// Normalize CRLF
let norm = content.replace(/\r\n/g, '\n');
const normOldProducts = oldProductsBlock.replace(/\r\n/g, '\n');
const normOldControls = oldControlsEnd.replace(/\r\n/g, '\n');
const normOldSpecs = oldSpecsBlock.replace(/\r\n/g, '\n');

if (norm.includes(normOldProducts)) {
  norm = norm.replace(normOldProducts, newProductsBlock);
  console.log('Replaced products block!');
} else {
  console.error('Failed to find products block');
}

if (norm.includes(normOldControls)) {
  norm = norm.replace(normOldControls, newControlsEnd);
  console.log('Replaced controls end block!');
} else {
  console.error('Failed to find controls end block');
}

if (norm.includes(normOldSpecs)) {
  norm = norm.replace(normOldSpecs, newSpecsBlock);
  console.log('Replaced specs block!');
} else {
  console.error('Failed to find specs block');
}

fs.writeFileSync(filePath, norm, 'utf8');
console.log('Finished updating ServiceQuotationModal.tsx');
