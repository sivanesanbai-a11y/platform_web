const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'src', 'components', 'forms', 'ServicingJobForm.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const targetBlock = `          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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
      ) : (`;

const replacement = `          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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
      ) : isPriya ? (
        <div className="nunes-form-card" style={{ marginTop: '16px', background: '#f0fdfa', border: '1.5px solid #0d9488' }}>
          <div className="nunes-card-head" style={{ borderBottom: '1px solid #ccfbf1', paddingBottom: '12px', marginBottom: '14px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f766e' }}>💼 Azhalaku Priya Commercial Pricing Station</h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                Job #{job.jobNo} — Service labor pricing, GST computation, MD approval routing, and client quotation dispatch.
              </p>
            </div>
            <span className="nunes-status-pill">{job.workflow?.stage || job.status}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <small style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Customer Details</small>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {job.customer?.name || 'Customer'}
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                {job.customer?.phone || ''} {job.customer?.city ? \`• \${job.customer.city}\` : ''}
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <small style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Equipment Details</small>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {job.products?.[0]?.productName || 'Service Equipment'}
              </div>
              <div style={{ fontSize: '12px', color: '#047857', fontFamily: 'monospace', fontWeight: 700, marginTop: '2px' }}>
                SN: {job.products?.[0]?.serialNo || 'N/A'} • Value: ₹{Number(job.products?.[0]?.productValue || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <small style={{ fontSize: '10.5px', fontWeight: 800, color: '#d97706', textTransform: 'uppercase' }}>Senthil Workshop Repair Scope</small>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#b45309', marginTop: '2px' }}>
                {job.workflow?.mechanicEstimateType === 'MAXIMUM_50' ? '50% Overhaul' : '30% Standard Scope'}
              </div>
              <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>
                Parts Estimate: ₹{Number(job.workflow?.estimatedSpareCost || job.workflow?.priyaSparePartsCost || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
              <small style={{ fontSize: '10.5px', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase' }}>Senthil Technical Repair Notes</small>
              <div style={{ fontSize: '12.5px', color: '#1e293b', marginTop: '4px', background: '#f0fdf4', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                {job.workflow?.mechanicAssessment || 'Mechanical teardown complete. Sensor recalibrated and zero-point certified.'}
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
      ) : (`;

const idx = content.indexOf(targetBlock.replace(/\r\n/g, '\n'));
if (idx !== -1) {
  content = content.slice(0, idx) + replacement + content.slice(idx + targetBlock.replace(/\r\n/g, '\n').length);
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('SUCCESS: Patched isPriya in ServicingJobForm.tsx');
} else {
  const idx2 = content.indexOf(targetBlock.replace(/\n/g, '\r\n'));
  if (idx2 !== -1) {
    content = content.slice(0, idx2) + replacement.replace(/\n/g, '\r\n') + content.slice(idx2 + targetBlock.replace(/\n/g, '\r\n').length);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('SUCCESS (CRLF): Patched isPriya in ServicingJobForm.tsx');
  } else {
    console.error('ERROR: Could not find targetBlock in ServicingJobForm.tsx');
    process.exit(1);
  }
}
