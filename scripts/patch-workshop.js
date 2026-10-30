const fs = require('fs');

let content = fs.readFileSync('src/app/workshop/page.tsx', 'utf8');
const isCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Give Admin the 4 dedicated command bars
content = content.replace(') : isMd ? (\n        /* MD 4 Dedicated Command Bars', ') : isAdminOrMd ? (\n        /* MD & Admin 4 Dedicated Command Bars');

// 2. Add File Upload for Attached Older Forms in Inspection Panel
const targetAttSection = `{/* ATTACHED OLDER FORMS & FILES ARCHIVE */}
              {activeJob.attachments && activeJob.attachments.length > 0 && (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1.5px solid #86efac",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", fontWeight: 800, fontSize: "13px", marginBottom: "8px" }}>
                    <Paperclip size={15} />
                    <span>Attached Older Forms &amp; Files ({activeJob.attachments.length})</span>
                  </div>`;

const replaceAttSection = `{/* ATTACHED OLDER FORMS & FILES ARCHIVE */}
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1.5px solid #86efac",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", fontWeight: 800, fontSize: "13px" }}>
                    <Paperclip size={15} />
                    <span>Attached Older Forms &amp; Files ({(activeJob.attachments || []).length})</span>
                  </div>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "#166534",
                      background: "#dcfce7",
                      border: "1px solid #86efac",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Upload size={11} />
                    <span>Attach Older Form / File</span>
                    <input
                      type="file"
                      multiple
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        const newAtts: any[] = [];
                        let doneCount = 0;
                        Array.from(files).forEach((file) => {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            newAtts.push({
                              id: "att_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
                              fileName: file.name,
                              storedName: ev.target?.result as string,
                              fileType: file.type || "application/octet-stream",
                              fileSize: file.size,
                              category: "OLDER_FORM",
                              tag: "Workshop Attached Older Form",
                              uploadedAt: new Date().toISOString(),
                              uploadedBy: user,
                            });
                            doneCount++;
                            if (doneCount === files.length) {
                              const updatedAtts = [...(activeJob.attachments || []), ...newAtts];
                              const updatedJob = { ...activeJob, attachments: updatedAtts, updatedAt: new Date().toISOString() };
                              saveUpdatedJob(updatedJob);
                              setStatusMessage(\`✓ Attached \${newAtts.length} older file(s) to Job #\${activeJob.jobNo}\`);
                              setTimeout(() => setStatusMessage(""), 3500);
                            }
                          };
                          reader.readAsDataURL(file);
                        });
                      }}
                    />
                  </label>
                </div>
                {(activeJob.attachments || []).length === 0 && (
                  <div style={{ fontSize: "11.5px", color: "#15803d", fontStyle: "italic", background: "#ffffff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                    No older forms or files attached yet. Click "Attach Older Form / File" above to upload scanned files or inspection documents.
                  </div>
                )}`;

if (content.includes(targetAttSection)) {
  content = content.replace(targetAttSection, replaceAttSection);
}

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('src/app/workshop/page.tsx', content, 'utf8');
console.log('[OK] workshop/page.tsx patched for Admin and Older Form uploads');
