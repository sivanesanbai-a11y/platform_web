const fs = require('fs');

let content = fs.readFileSync('src/components/DashboardClient.tsx', 'utf8');
const isCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Add FileSpreadsheet and Trash2 imports from lucide-react
if (!content.includes('FileSpreadsheet')) {
  content = content.replace('CheckSquare,\n} from "lucide-react";', 'CheckSquare,\n  FileSpreadsheet,\n  Trash2,\n} from "lucide-react";');
}

// 2. Add imports from excel-export and data
if (!content.includes('@/lib/excel-export')) {
  content = content.replace(
    'import { syncPullFromCloud } from "@/lib/sync";',
    'import { syncPullFromCloud } from "@/lib/sync";\nimport { exportAndBackupToDriveSheet, downloadServiceJobsExcel } from "@/lib/excel-export";\nimport { clearAllOlderForms } from "@/lib/data";'
  );
}

// 3. Add handleExportToSheet and handleResetOlderData inside DashboardClient
const targetDashState = '  const [syncTick, setSyncTick] = useState(0);';
const replaceDashState = `  const [syncTick, setSyncTick] = useState(0);
  const [isExportingSheet, setIsExportingSheet] = useState(false);
  const [sheetFeedback, setSheetFeedback] = useState("");

  const handleExportToSheet = async () => {
    setIsExportingSheet(true);
    try {
      const res = await exportAndBackupToDriveSheet({ download: true });
      if (res.success) {
        setSheetFeedback(\`✓ Exported \${res.count} form(s) to Excel spreadsheet & synced to Google Drive Sheet backup.\`);
      } else {
        setSheetFeedback(\`⚠️ Export: \${res.message}\`);
      }
    } catch (err: any) {
      setSheetFeedback(\`⚠️ Export error: \${err.message || "Failed"}\`);
    } finally {
      setIsExportingSheet(false);
      setTimeout(() => setSheetFeedback(""), 4500);
    }
  };

  const handleResetOlderData = () => {
    if (typeof window !== "undefined" && window.confirm("Are you sure you want to permanently clear all older forms and demo records? This will purge all saved jobs and give a clean operational slate.")) {
      clearAllOlderForms();
      setSheetFeedback("✓ All older forms and records cleared. Clean slate active.");
      setTimeout(() => setSheetFeedback(""), 4000);
    }
  };`;

if (content.includes(targetDashState) && !content.includes('isExportingSheet')) {
  content = content.replace(targetDashState, replaceDashState);
}

// 4. In Operations Queue section header, add Export & Reset buttons + feedback alert
const targetQueueHeader = `<h3 style={{ fontSize: "15px", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                    Operations Queue &amp; Live Details
                  </h3>
                </div>
                <p style={{ margin: "3px 0 0", fontSize: "11.5px", color: "#64748b" }}>
                  Real-time visibility into completed jobs, pending MD signoffs, active workflow progress, and mechanical repairs.
                </p>
              </div>

              {/* 5 Filter Tabs */}`;

const replaceQueueHeader = `<h3 style={{ fontSize: "15px", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                    Operations Queue &amp; Live Details
                  </h3>
                </div>
                <p style={{ margin: "3px 0 0", fontSize: "11.5px", color: "#64748b" }}>
                  Real-time visibility into completed jobs, pending MD signoffs, active workflow progress, and mechanical repairs.
                </p>
              </div>

              {/* Excel / Google Drive Sheet Backup & Reset Actions */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleExportToSheet}
                  disabled={isExportingSheet}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid #6ee7b7",
                    background: "#ecfdf5",
                    color: "#047857",
                    fontSize: "11.5px",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                  }}
                  title="Export all forms to Excel (.csv) and Google Drive Sheet backup"
                >
                  <FileSpreadsheet size={14} style={{ color: "#059669" }} />
                  <span>{isExportingSheet ? "Exporting Sheet..." : "Export to Excel / Sheet"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetOlderData}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid #fecaca",
                    background: "#fff1f2",
                    color: "#b91c1c",
                    fontSize: "11.5px",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                  }}
                  title="Remove all older forms and data to start fresh"
                >
                  <Trash2 size={14} style={{ color: "#dc2626" }} />
                  <span>Clear Older Data</span>
                </button>
              </div>

              {sheetFeedback && (
                <div style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "12px", fontWeight: 700 }}>
                  {sheetFeedback}
                </div>
              )}

              {/* 5 Filter Tabs */}`;

if (content.includes(targetQueueHeader)) {
  content = content.replace(targetQueueHeader, replaceQueueHeader);
}

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('src/components/DashboardClient.tsx', content, 'utf8');
console.log('[OK] DashboardClient.tsx patched successfully');
