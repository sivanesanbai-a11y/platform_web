const fs = require('fs');

let content = fs.readFileSync('src/components/forms/ServicingJobForm.tsx', 'utf8');
const isCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Step 2 Product Box: Add "Product All Done" toggle button in the header
const targetBoxHead = `<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {job.products.length > 1 && (
                      <button type="button" className="iconButton danger" onClick={() => removeProduct(idx)} title="Remove this equipment">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>`;

const replaceBoxHead = `<div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const isDone = !p.isAllDone;
                        updateProduct(idx, {
                          isAllDone: isDone,
                          doneAt: isDone ? new Date().toISOString() : undefined,
                          doneBy: isDone ? currentUserEmail : undefined
                        });
                        setMessage(isDone ? \`✓ Equipment #\${idx + 1} marked ALL DONE!\` : \`Equipment #\${idx + 1} marked in progress.\`);
                        setTimeout(() => setMessage(''), 3000);
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: p.isAllDone ? '#dcfce7' : '#f1f5f9',
                        color: p.isAllDone ? '#166534' : '#475569',
                        border: p.isAllDone ? '1px solid #86efac' : '1px solid #cbd5e1',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                      title="Mark this product as completely serviced and all done"
                    >
                      <CheckCircle2 size={13} style={{ color: p.isAllDone ? '#16a34a' : '#94a3b8' }} />
                      <span>{p.isAllDone ? '✓ Product All Done' : 'Mark All Done'}</span>
                    </button>
                    {job.products.length > 1 && (
                      <button type="button" className="iconButton danger" onClick={() => removeProduct(idx)} title="Remove this equipment">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>`;

if (content.includes(targetBoxHead) && !content.includes('Product All Done')) {
  content = content.replace(targetBoxHead, replaceBoxHead);
}

// 2. Step 6: Update Sign-Check card title and placeholder for Admin and MD
content = content.replace(
  '<span>MD Executive Sign-Check &amp; Approval</span>',
  '<span>MD &amp; Admin Executive Sign-Check &amp; Process Completion</span>'
);
content = content.replace(
  'Confirm inspection &amp; engineering signcheck. This seals the record and marks it completed in MD Control Tower.',
  'Confirm inspection &amp; engineering signcheck. MD or Admin can sign to seal the record and mark it completed across all reports and queues.'
);
content = content.replace(
  'placeholder="MD Name / Signoff Sign"',
  'placeholder="MD / Admin Name or Signoff Sign"'
);
content = content.replace(
  '<span>Confirm MD Sign-Check &amp; Complete</span>',
  '<span>Confirm Sign-Check &amp; Complete Job</span>'
);

// 3. Header Action Button: Show MD / Admin Sign-Check & Complete
content = content.replace(
  `{activeStep === visibleSteps.length - 1 ? (
              isMd ? (
                <>MD Sign-Check &amp; Complete <CheckCircle2 size={15} /></>
              ) : isIntakeStaff ? (`,
  `{activeStep === visibleSteps.length - 1 ? (
              (isMd || isAdmin) ? (
                <>MD / Admin Sign-Check &amp; Complete <CheckCircle2 size={15} /></>
              ) : isIntakeStaff ? (`
);

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('src/components/forms/ServicingJobForm.tsx', content, 'utf8');
console.log('[OK] ServicingJobForm.tsx updated with Product All Done and Admin Sign-Check');
