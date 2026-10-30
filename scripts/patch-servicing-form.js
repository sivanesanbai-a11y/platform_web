const fs = require('fs');

let content = fs.readFileSync('src/components/forms/ServicingJobForm.tsx', 'utf8');

// Normalize line endings for replacement
const isCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Add FileSpreadsheet import
if (!content.includes('FileSpreadsheet')) {
  content = content.replace('Download, ExternalLink, FileText', 'Download, ExternalLink, FileText, FileSpreadsheet');
}

// 2. Add excel-export import
if (!content.includes('@/lib/excel-export')) {
  content = content.replace(
    "import { clearAllOlderForms } from '@/lib/data';",
    "import { clearAllOlderForms } from '@/lib/data';\nimport { exportAndBackupToDriveSheet, downloadServiceJobsExcel } from '@/lib/excel-export';"
  );
}

// 3. Add handleExportToSheet and isExportingSheet
const targetState = '  const [showSavedModal, setShowSavedModal] = useState(false);';
const replaceState = `  const [showSavedModal, setShowSavedModal] = useState(false);
  const [isExportingSheet, setIsExportingSheet] = useState(false);

  async function handleExportToSheet() {
    setIsExportingSheet(true);
    try {
      const res = await exportAndBackupToDriveSheet({ download: true });
      if (res.success) {
        setMessage(\`✓ Downloaded Excel spreadsheet & synced \${res.count} form(s) to Google Drive Sheet backup.\`);
      } else {
        setMessage(\`⚠️ Excel export: \${res.message}\`);
      }
    } catch (err: any) {
      setMessage(\`⚠️ Excel export failed: \${err.message || 'Unknown error'}\`);
    } finally {
      setIsExportingSheet(false);
      setTimeout(() => setMessage(''), 4500);
    }
  }`;

if (content.includes(targetState) && !content.includes('isExportingSheet')) {
  content = content.replace(targetState, replaceState);
}

// 4. In header actions: add Export to Excel / Sheet button
const targetHeader = `<button
            type="button"
            className="btn"
            onClick={() => setShowSavedModal(true)}
            title={isAdminOrMd ? "View & filter all saved service jobs" : "View your particular saved service jobs"}
            style={{ background: '#f0fdfa', border: '1px solid #99f6e4', color: '#0f766e', fontWeight: 700 }}
          >
            <FolderOpen size={15} style={{ color: '#0f766e' }} />
            <span>Saved Jobs ({visibleSavedJobs.length})</span>
          </button>`;

const replaceHeader = `<button
            type="button"
            className="btn"
            onClick={() => setShowSavedModal(true)}
            title={isAdminOrMd ? "View & filter all saved service jobs" : "View your particular saved service jobs"}
            style={{ background: '#f0fdfa', border: '1px solid #99f6e4', color: '#0f766e', fontWeight: 700 }}
          >
            <FolderOpen size={15} style={{ color: '#0f766e' }} />
            <span>Saved Jobs ({visibleSavedJobs.length})</span>
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleExportToSheet}
            disabled={isExportingSheet}
            title="Export all application forms to Excel (.csv) & Google Drive Sheet backup"
            style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#047857', fontWeight: 700 }}
          >
            <FileSpreadsheet size={15} style={{ color: '#059669' }} />
            <span>{isExportingSheet ? 'Exporting...' : 'Export Excel / Sheet'}</span>
          </button>`;

if (content.includes(targetHeader) && !content.includes('Export Excel / Sheet')) {
  content = content.replace(targetHeader, replaceHeader);
}

// 5. In showSavedModal footer: add Export & Reset buttons
const targetFooter = `            {/* Footer */}
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
            </div>`;

const replaceFooter = `            {/* Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleExportToSheet}
                  disabled={isExportingSheet}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1px solid #a7f3d0',
                    background: '#f0fdf4',
                    color: '#065f46',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                  title="Export all forms to Excel and Google Sheets"
                >
                  <FileSpreadsheet size={15} style={{ color: '#059669' }} />
                  <span>{isExportingSheet ? 'Exporting Sheet...' : 'Export to Excel / Drive Sheet'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAllOlderForms}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1px solid #fecaca',
                    background: '#fff1f2',
                    color: '#b91c1c',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                  title="Remove all older forms and drafts to start fresh blank forms"
                >
                  <Trash2 size={15} style={{ color: '#dc2626' }} />
                  <span>Remove Older Data &amp; Start New</span>
                </button>
              </div>

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
            </div>`;

if (content.includes(targetFooter)) {
  content = content.replace(targetFooter, replaceFooter);
}

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('src/components/forms/ServicingJobForm.tsx', content, 'utf8');
console.log('[OK] ServicingJobForm.tsx patched successfully');
