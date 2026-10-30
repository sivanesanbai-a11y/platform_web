const fs = require('fs');
const file = 'C:/Users/NUNES/Desktop/NUNES_OPERATIONS_WORKSPACE/platform_web/src/components/forms/PurchasingOrderForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings to LF for simple matching
const isCRLF = content.includes('\r\n');
if (isCRLF) {
  content = content.replace(/\r\n/g, '\n');
}

const target1 = `  const isAdminOrMd = useMemo(() => {
    const u = (currentUserEmail || '').toLowerCase();
    return (
      u.includes('admin') ||
      u.includes('md') ||
      u.startsWith('director') ||
      u === 'admin' ||
      u === 'md'
    );
  }, [currentUserEmail]);`;

const replacement1 = `  const isMd = useMemo(() => {
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
  }, [isMd]);`;

const target2 = `          <button type="button" className="btn" onClick={startNewOrder} title="Start a fresh blank order">
            <Plus size={15} /> New Order
          </button>`;

const replacement2 = `          {!isMd && (
            <button type="button" className="btn" onClick={startNewOrder} title="Start a fresh blank order">
              <Plus size={15} /> New Order
            </button>
          )} `;

if (!content.includes(target1)) {
  console.error('Target 1 not found!');
  process.exit(1);
}
if (!content.includes(target2)) {
  console.error('Target 2 not found!');
  process.exit(1);
}

content = content.replace(target1, replacement1);
content = content.replace(target2, replacement2);

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(file, content, 'utf8');
console.log('PurchasingOrderForm.tsx updated successfully!');
