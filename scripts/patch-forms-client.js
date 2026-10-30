const fs = require('fs');

let content = fs.readFileSync('src/components/FormsClient.tsx', 'utf8');
const isCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Add FileSpreadsheet and Trash2 imports
if (!content.includes('FileSpreadsheet')) {
  content = content.replace('Wrench\n} from "lucide-react";', 'Wrench,\n  FileSpreadsheet,\n  Trash2\n} from "lucide-react";');
}

// 2. Add clearAllOlderForms and exportAndBackupToDriveSheet
if (!content.includes('@/lib/excel-export')) {
  content = content.replace(
    'import { clearDataCache, companyFetch, getModules, getOverview, getTasks, moduleUrl } from "@/lib/data";',
    'import { clearDataCache, companyFetch, getModules, getOverview, getTasks, moduleUrl, clearAllOlderForms } from "@/lib/data";\nimport { exportAndBackupToDriveSheet } from "@/lib/excel-export";'
  );
}

// 3. Add handleExportSheet and handleClearData inside ProcessSelection
const targetComp = 'export default function ProcessSelection() {';
const replaceComp = `export default function ProcessSelection() {
  const [isExportingSheet, setIsExportingSheet] = useState(false);
  const [toolbarMsg, setToolbarMsg] = useState("");

  const handleExportSheet = async () => {
    setIsExportingSheet(true);
    try {
      const res = await exportAndBackupToDriveSheet({ download: true });
      if (res.success) {
        setToolbarMsg(\`✓ Downloaded Excel spreadsheet & backed up \${res.count} form(s) to Google Drive Sheet.\`);
      } else {
        setToolbarMsg(\`⚠️ Export: \${res.message}\`);
      }
    } catch (e: any) {
      setToolbarMsg(\`⚠️ Export failed: \${e.message || "Error"}\`);
    } finally {
      setIsExportingSheet(false);
      setTimeout(() => setToolbarMsg(""), 4500);
    }
  };

  const handleClearData = () => {
    if (typeof window !== "undefined" && window.confirm("Are you sure you want to permanently clear all older forms and drafts? This will purge all saved jobs and give a clean operational slate.")) {
      clearAllOlderForms();
      setToolbarMsg("✓ All older forms, job history, and drafts have been cleared. Clean slate ready.");
      setTimeout(() => setToolbarMsg(""), 4000);
    }
  };`;

if (content.includes(targetComp) && !content.includes('isExportingSheet')) {
  content = content.replace(targetComp, replaceComp);
}

// 4. In return statement, add top action strip
const targetGrid = `  return (
    <main className="forms-hub-page">
      <div className="hub-forms-grid">`;

const replaceGrid = `  return (
    <main className="forms-hub-page">
      {/* Top Action Strip: Excel / Sheet Backup & Clear Older Data */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', padding: '12px 18px', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Operational Forms Hub
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
            Manage purchasing requisitions and servicing job cards with automatic Excel spreadsheet backups and real-time cloud sync.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExportSheet}
            disabled={isExportingSheet}
            style={{
              padding: '7px 14px',
              borderRadius: '9px',
              border: '1px solid #6ee7b7',
              background: '#ecfdf5',
              color: '#047857',
              fontSize: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
            title="Export all forms to Excel (.csv) & Google Drive Sheet backup"
          >
            <FileSpreadsheet size={15} style={{ color: '#059669' }} />
            <span>{isExportingSheet ? 'Exporting...' : 'Export to Excel / Drive Sheet'}</span>
          </button>
          <button
            type="button"
            onClick={handleClearData}
            style={{
              padding: '7px 14px',
              borderRadius: '9px',
              border: '1px solid #fecaca',
              background: '#fff1f2',
              color: '#b91c1c',
              fontSize: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
            title="Clear all older forms and return to clean blank forms"
          >
            <Trash2 size={15} style={{ color: '#dc2626' }} />
            <span>Remove Older Data &amp; Start New</span>
          </button>
        </div>
        {toolbarMsg && (
          <div style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: '12px', fontWeight: 700 }}>
            {toolbarMsg}
          </div>
        )}
      </div>

      <div className="hub-forms-grid">`;

if (content.includes(targetGrid)) {
  content = content.replace(targetGrid, replaceGrid);
}

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('src/components/FormsClient.tsx', content, 'utf8');
console.log('[OK] FormsClient.tsx patched successfully');
