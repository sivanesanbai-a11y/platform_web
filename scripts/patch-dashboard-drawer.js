const fs = require('fs');

let content = fs.readFileSync('src/components/DashboardClient.tsx', 'utf8');
const isCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Add lucide imports
if (!content.includes('Paperclip')) {
  content = content.replace(
    'Trash2,\n} from "lucide-react";',
    'Trash2,\n  Paperclip,\n  Download,\n  X,\n  ExternalLink,\n  Upload,\n  FolderOpen,\n} from "lucide-react";'
  );
}

// 2. Add ServiceJob and WorkflowStage type imports
if (!content.includes('import type { ServiceJob')) {
  content = content.replace(
    'import type { ActivityPayload, Overview, TasksPayload } from "@/lib/types";',
    'import type { ActivityPayload, Overview, TasksPayload } from "@/lib/types";\nimport type { ServiceJob, WorkflowStage } from "@/types/service-job";'
  );
}

// 3. Add selectedJobDetail state and handler functions inside DashboardClient
const targetStateAnchor = '  const [highlightedJobId, setHighlightedJobId] = useState<string | null>(null);';
const replaceStateAnchor = `  const [highlightedJobId, setHighlightedJobId] = useState<string | null>(null);
  const [selectedJobDetail, setSelectedJobDetail] = useState<ServiceJob | null>(null);

  const currentUserEmail = useMemo(() => {
    try {
      if (typeof window === "undefined") return "";
      const raw = localStorage.getItem("nunes_auth_session");
      if (raw) return JSON.parse(raw)?.email || "";
    } catch {}
    return "";
  }, []);

  const isAdminOrMd = useMemo(() => {
    const u = (currentUserEmail || "").toLowerCase();
    return u.includes("admin") || u.includes("md") || u.startsWith("admin@") || u.startsWith("md@") || u.includes("director");
  }, [currentUserEmail]);

  const handleToggleProductAllDone = (job: ServiceJob) => {
    try {
      const raw = localStorage.getItem("nunes:service_jobs");
      const list: ServiceJob[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((x) => String(x.jobNo || x.id) === String(job.jobNo || job.id));
      if (idx >= 0) {
        const currentProducts = list[idx].products || [{} as any];
        const newDone = !currentProducts[0]?.isAllDone;
        currentProducts[0] = {
          ...currentProducts[0],
          isAllDone: newDone,
          doneAt: newDone ? new Date().toISOString() : undefined,
          doneBy: newDone ? currentUserEmail : undefined,
        };
        const updated: ServiceJob = {
          ...list[idx],
          products: currentProducts,
          isAllProductsDone: newDone,
          status: newDone ? "READY" : list[idx].status,
          updatedAt: new Date().toISOString(),
        };
        list[idx] = updated;
        localStorage.setItem("nunes:service_jobs", JSON.stringify(list));
        setSelectedJobDetail(updated);
        setSyncTick((t) => t + 1);
        void syncFormToCloud("servicing", String(updated.jobNo || updated.id), String(updated.customer?.name || "Customer"), updated);
        window.dispatchEvent(new CustomEvent("nunes:records-synced", { detail: { job: updated } }));
        setSheetFeedback(\`✓ Product marked \${newDone ? "ALL DONE" : "in progress"} for Job #\${updated.jobNo || updated.id}\`);
        setTimeout(() => setSheetFeedback(""), 4000);
      }
    } catch {}
  };

  const handleAdminAdvanceStage = (job: ServiceJob, newStage: WorkflowStage) => {
    try {
      const raw = localStorage.getItem("nunes:service_jobs");
      const list: ServiceJob[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((x) => String(x.jobNo || x.id) === String(job.jobNo || job.id));
      if (idx >= 0) {
        const isDone = newStage === "JOB_COMPLETED";
        const updated: ServiceJob = {
          ...list[idx],
          status: isDone ? "READY" : list[idx].status,
          workflow: {
            ...(list[idx].workflow || {}),
            stage: newStage,
            finalHandoverCompletedAt: isDone ? new Date().toISOString() : list[idx].workflow?.finalHandoverCompletedAt,
          },
          updatedAt: new Date().toISOString(),
        };
        list[idx] = updated;
        localStorage.setItem("nunes:service_jobs", JSON.stringify(list));
        setSelectedJobDetail(updated);
        setSyncTick((t) => t + 1);
        void syncFormToCloud("servicing", String(updated.jobNo || updated.id), String(updated.customer?.name || "Customer"), updated);
        window.dispatchEvent(new CustomEvent("nunes:records-synced", { detail: { job: updated } }));
        setSheetFeedback(\`✓ Admin updated Job #\${updated.jobNo || updated.id} to stage: \${newStage.replace(/_/g, " ")}\`);
        setTimeout(() => setSheetFeedback(""), 4000);
      }
    } catch {}
  };

  const handleUploadAttachmentFromDashboard = (e: React.ChangeEvent<HTMLInputElement>, job: ServiceJob) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newAttachments: any[] = [];
    let processed = 0;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        newAttachments.push({
          id: \`att_\${Date.now()}_\${Math.random().toString(36).substring(2, 7)}\`,
          fileName: file.name,
          storedName: base64,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
          category: "OLDER_FORM",
          tag: "Dashboard Attached Older Form / Document",
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUserEmail,
        });
        processed++;
        if (processed === files.length) {
          try {
            const raw = localStorage.getItem("nunes:service_jobs");
            const list: ServiceJob[] = raw ? JSON.parse(raw) : [];
            const idx = list.findIndex((x) => String(x.jobNo || x.id) === String(job.jobNo || job.id));
            if (idx >= 0) {
              const updatedAtts = [...(list[idx].attachments || []), ...newAttachments];
              const updated: ServiceJob = {
                ...list[idx],
                attachments: updatedAtts,
                updatedAt: new Date().toISOString(),
              };
              list[idx] = updated;
              localStorage.setItem("nunes:service_jobs", JSON.stringify(list));
              setSelectedJobDetail(updated);
              setSyncTick((t) => t + 1);
              void syncFormToCloud("servicing", String(updated.jobNo || updated.id), String(updated.customer?.name || "Customer"), updated);
              window.dispatchEvent(new CustomEvent("nunes:records-synced", { detail: { job: updated } }));
              setSheetFeedback(\`✓ Attached \${newAttachments.length} older file(s) to Job #\${updated.jobNo || updated.id}\`);
              setTimeout(() => setSheetFeedback(""), 4000);
            }
          } catch {}
        }
      };
      reader.readAsDataURL(file);
    });
  };`;

if (!content.includes('selectedJobDetail')) {
  content = content.replace(targetStateAnchor, replaceStateAnchor);
}

// 4. Update handleSelectJobEvent in DashboardClient
const targetSelectEvent = `    const handleSelectJobEvent = (e: CustomEvent) => {
      if (e.detail?.jobId) {
        setHighlightedJobId(e.detail.jobId);
        setTimeout(() => {
          if (priceApprovalGatewayRef.current) {
            priceApprovalGatewayRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 200);
      }
    };`;

const replaceSelectEvent = `    const handleSelectJobEvent = (e: CustomEvent) => {
      if (e.detail?.jobId) {
        const jId = String(e.detail.jobId);
        setHighlightedJobId(jId);
        try {
          const raw = localStorage.getItem("nunes:service_jobs");
          const list: any[] = raw ? JSON.parse(raw) : [];
          const found = list.find((x) => String(x.jobNo || x.id) === jId);
          if (found) {
            setSelectedJobDetail(found);
          } else if (e.detail.job) {
            setSelectedJobDetail(e.detail.job);
          }
        } catch {}
        setTimeout(() => {
          if (priceApprovalGatewayRef.current) {
            priceApprovalGatewayRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 200);
      }
    };`;

if (content.includes(targetSelectEvent)) {
  content = content.replace(targetSelectEvent, replaceSelectEvent);
}

// 5. In Operations Queue items: add All Done badge, older files badge, and Details button
const targetCardReturn = `                  const isCourier = j.workflow?.cannotGetDirect || j.receipt?.mode === "COURIER";
                  const isAwaitingMd = j.workflow?.stage === "AWAITING_MD_APPROVAL";
                  const isDone = j.workflow?.stage === "JOB_COMPLETED" || j.status === "CLOSED" || j.status === "READY";`;

const replaceCardReturn = `                  const isCourier = j.workflow?.cannotGetDirect || j.receipt?.mode === "COURIER";
                  const isAwaitingMd = j.workflow?.stage === "AWAITING_MD_APPROVAL";
                  const isDone = j.workflow?.stage === "JOB_COMPLETED" || j.status === "CLOSED" || j.status === "READY";
                  const isAllDone = Boolean(j.isAllProductsDone || (j.products || [])[0]?.isAllDone || isDone);
                  const olderFilesCount = (j.attachments || []).length;
                  const formCustomName = j.customFormName;`;

if (content.includes(targetCardReturn)) {
  content = content.replace(targetCardReturn, replaceCardReturn);
}

// Also update the card badges & action buttons
const targetCardBadges = `<span style={{ fontSize: "12.5px", fontWeight: 900, color: "#0f172a" }}>
                            #{jId}
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 800,
                              background: isDone ? "#dcfce7" : isAwaitingMd ? "#fef3c7" : "#e0f2fe",
                              color: isDone ? "#166534" : isAwaitingMd ? "#92400e" : "#0369a1",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {isDone ? "✓ Completed" : isAwaitingMd ? "⚡ Pending Signoff" : j.status || "In Process"}
                          </span>`;

const replaceCardBadges = `<span style={{ fontSize: "12.5px", fontWeight: 900, color: "#0f172a" }}>
                            #{jId}
                          </span>
                          {formCustomName && (
                            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#0f766e", background: "#f0fdf4", padding: "1px 6px", borderRadius: "4px", border: "1px solid #bbf7d0" }}>
                              {formCustomName}
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 800,
                              background: isDone ? "#dcfce7" : isAwaitingMd ? "#fef3c7" : "#e0f2fe",
                              color: isDone ? "#166534" : isAwaitingMd ? "#92400e" : "#0369a1",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {isDone ? "✓ Completed" : isAwaitingMd ? "⚡ Pending Signoff" : j.status || "In Process"}
                          </span>
                          {isAllDone && (
                            <span style={{ fontSize: "10px", fontWeight: 800, background: "#dcfce7", color: "#166534", padding: "2px 6px", borderRadius: "4px", border: "1px solid #86efac" }}>
                              ✓ ALL DONE
                            </span>
                          )}
                          {olderFilesCount > 0 && (
                            <span style={{ fontSize: "10px", fontWeight: 800, background: "#ecfdf5", color: "#065f46", padding: "2px 6px", borderRadius: "4px", border: "1px solid #a7f3d0", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                              <Paperclip size={10} /> {olderFilesCount} Older File(s)
                            </span>
                          )}`;

if (content.includes(targetCardBadges)) {
  content = content.replace(targetCardBadges, replaceCardBadges);
}

// Add the Details & Older Files button next to Workshop
const targetWorkshopLink = `<Link
                          href={\`/workshop?job=\${encodeURIComponent(jId)}\`}`;

const replaceWorkshopLink = `<button
                          type="button"
                          onClick={() => setSelectedJobDetail(j)}
                          style={{
                            background: "#0f766e",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "7px",
                            padding: "6px 12px",
                            fontSize: "11.5px",
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          title="View complete form details and attached older files on dashboard"
                        >
                          Details &amp; Files ➔
                        </button>
                        <Link
                          href={\`/workshop?job=\${encodeURIComponent(jId)}\`}`;

if (content.includes(targetWorkshopLink) && !content.includes('Details &amp; Files ➔')) {
  content = content.replace(targetWorkshopLink, replaceWorkshopLink);
}

// 6. Near the bottom: render Dashboard Form Details & Older Files Inspection Side Drawer
const targetDetailModal = `{/* Detail Modal when user clicks "View" on any record */}
      {detail && (
        <ReportModal data={detail} onClose={() => setDetail(null)} />
      )}`;

const sideDrawerJSX = `{/* DASHBOARD SIDE FORM DETAILS & OLDER FILES INSPECTION DRAWER */}
      {selectedJobDetail && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => setSelectedJobDetail(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "580px",
              height: "100%",
              background: "#ffffff",
              boxShadow: "-8px 0 25px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              borderLeft: "1px solid #cbd5e1",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a" }}>
                    {selectedJobDetail.customFormName || selectedJobDetail.customer?.name || \`Job #\${selectedJobDetail.jobNo || selectedJobDetail.id}\`}
                  </span>
                  <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", background: "#e0f2fe", color: "#0369a1", fontWeight: 700 }}>
                    #{selectedJobDetail.jobNo || selectedJobDetail.id}
                  </span>
                </div>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                  Full Form Details &amp; Attached Older Files (Dashboard Side View)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobDetail(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* 1. Status & Product All Done Banner */}
              <div style={{ padding: "12px 16px", borderRadius: "10px", background: (selectedJobDetail.isAllProductsDone || (selectedJobDetail.products || [])[0]?.isAllDone || selectedJobDetail.status === "READY" || selectedJobDetail.status === "CLOSED") ? "#f0fdf4" : "#eff6ff", border: (selectedJobDetail.isAllProductsDone || (selectedJobDetail.products || [])[0]?.isAllDone || selectedJobDetail.status === "READY" || selectedJobDetail.status === "CLOSED") ? "1.5px solid #86efac" : "1.5px solid #bfdbfe", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: (selectedJobDetail.isAllProductsDone || (selectedJobDetail.products || [])[0]?.isAllDone || selectedJobDetail.status === "READY" || selectedJobDetail.status === "CLOSED") ? "#166534" : "#1d4ed8" }}>
                    {(selectedJobDetail.isAllProductsDone || (selectedJobDetail.products || [])[0]?.isAllDone || selectedJobDetail.status === "READY" || selectedJobDetail.status === "CLOSED") ? "✓ PRODUCT ALL DONE" : "WORK IN PROGRESS"}
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                    Status: {selectedJobDetail.status || "RECEIVED"} • Stage: {(selectedJobDetail.workflow?.stage || "INTAKE_RECEIVED").replace(/_/g, " ")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleProductAllDone(selectedJobDetail)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    background: (selectedJobDetail.isAllProductsDone || (selectedJobDetail.products || [])[0]?.isAllDone) ? "#dcfce7" : "#16a34a",
                    color: (selectedJobDetail.isAllProductsDone || (selectedJobDetail.products || [])[0]?.isAllDone) ? "#166534" : "#ffffff",
                    border: "1px solid #16a34a",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>{(selectedJobDetail.isAllProductsDone || (selectedJobDetail.products || [])[0]?.isAllDone) ? "Product Marked Done" : "Mark Product All Done"}</span>
                </button>
              </div>

              {/* 2. Admin Quick Fast-Forward Process Bar */}
              {isAdminOrMd && (
                <div style={{ padding: "12px", borderRadius: "10px", background: "#f8fafc", border: "1.5px solid #cbd5e1" }}>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "#475569", textTransform: "uppercase", marginBottom: "8px" }}>
                    ⚡ Admin Process Controller: Advance or Run Stage
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {[
                      { stage: "INTAKE_RECEIVED", label: "1. Intake" },
                      { stage: "UNDER_REPAIR_SENTHIL", label: "2. Repair" },
                      { stage: "AWAITING_PRIYA_PRICING", label: "3. Pricing" },
                      { stage: "AWAITING_MD_APPROVAL", label: "4. MD Approval" },
                      { stage: "READY_FOR_HANDOVER", label: "5. Handover" },
                      { stage: "JOB_COMPLETED", label: "✓ Complete All" },
                    ].map((s) => (
                      <button
                        key={s.stage}
                        type="button"
                        onClick={() => handleAdminAdvanceStage(selectedJobDetail, s.stage as any)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: selectedJobDetail.workflow?.stage === s.stage ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                          background: selectedJobDetail.workflow?.stage === s.stage ? "#2563eb" : "#ffffff",
                          color: selectedJobDetail.workflow?.stage === s.stage ? "#ffffff" : "#334155",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Customer & Inward Details */}
              <div style={{ padding: "12px", borderRadius: "10px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                  Customer &amp; Inward Details
                </div>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a" }}>
                  {selectedJobDetail.customer?.name || "Customer Name"}
                </div>
                <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px" }}>
                  Contact: {selectedJobDetail.customer?.contactPerson || "N/A"} • Phone: {selectedJobDetail.customer?.phone || "N/A"}
                </div>
                {selectedJobDetail.customer?.address && (
                  <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                    Address: {selectedJobDetail.customer.address}
                  </div>
                )}
                <div style={{ marginTop: "6px", fontSize: "12px", color: "#0f766e", fontWeight: 700 }}>
                  Receipt Mode: {selectedJobDetail.receipt?.mode === "COURIER" ? \`Courier: \${selectedJobDetail.receipt?.courierName || "Courier"} (Docket: \${selectedJobDetail.receipt?.docketNo || "N/A"})\` : \`Walk-in Handover by \${selectedJobDetail.receipt?.personName || "Customer"}\`}
                </div>
              </div>

              {/* 4. Equipment & Complaint */}
              <div style={{ padding: "12px", borderRadius: "10px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                  Equipment &amp; Technical Scope
                </div>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a" }}>
                  {(selectedJobDetail.products || [])[0]?.productName || "Equipment"} {(selectedJobDetail.products || [])[0]?.makeModel ? \`(\${(selectedJobDetail.products || [])[0].makeModel})\` : ""}
                </div>
                {(selectedJobDetail.products || [])[0]?.serialNo && (
                  <div style={{ fontSize: "11.5px", color: "#059669", fontWeight: 700, marginTop: "2px" }}>
                    Serial No: {(selectedJobDetail.products || [])[0].serialNo}
                  </div>
                )}
                <div style={{ fontSize: "12px", color: "#475569", marginTop: "4px" }}>
                  <strong>Reported Problem:</strong> {(selectedJobDetail.products || [])[0]?.complaint || "N/A"}
                </div>
                {selectedJobDetail.workflow?.mechanicAssessment && (
                  <div style={{ fontSize: "12px", color: "#92400e", marginTop: "4px" }}>
                    <strong>Repair Assessment ({selectedJobDetail.workflow?.mechanicEstimateType === "MAXIMUM_50" ? "50% Overhaul" : "30% Service"}):</strong> {selectedJobDetail.workflow.mechanicAssessment}
                  </div>
                )}
              </div>

              {/* 5. Attached Older Files & Scanned Documents */}
              <div style={{ padding: "14px", borderRadius: "10px", background: "#f0fdf4", border: "1.5px solid #86efac" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 800, color: "#166534" }}>
                    <Paperclip size={15} />
                    <span>Attached Older Files &amp; Scanned Documents ({(selectedJobDetail.attachments || []).length})</span>
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
                    <span>Attach Older File</span>
                    <input
                      type="file"
                      multiple
                      style={{ display: "none" }}
                      onChange={(e) => handleUploadAttachmentFromDashboard(e, selectedJobDetail)}
                    />
                  </label>
                </div>

                {(selectedJobDetail.attachments || []).length === 0 ? (
                  <div style={{ fontSize: "12px", color: "#15803d", fontStyle: "italic", background: "#ffffff", padding: "10px", borderRadius: "8px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                    No older forms or files attached yet. Click "Attach Older File" above to upload scanned older forms or photos.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {selectedJobDetail.attachments.map((att: any) => (
                      <div
                        key={att.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 10px",
                          background: "#ffffff",
                          borderRadius: "6px",
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {att.fileName}
                          </div>
                          <div style={{ fontSize: "10.5px", color: "#64748b" }}>
                            {att.category === "OLDER_FORM" ? "Scanned Older Form" : att.category} • {att.uploadedAt?.slice(0, 10)}
                          </div>
                        </div>
                        <a
                          href={att.storedName}
                          download={att.fileName}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            background: "#16a34a",
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: 700,
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            flexShrink: 0,
                          }}
                        >
                          <Download size={11} />
                          <span>View / Download</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 6. Pricing & Estimates */}
              <div style={{ padding: "12px", borderRadius: "10px", background: "#ffffff", border: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: 700 }}>Technical Estimate</div>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                    ₹{Number(selectedJobDetail.totals?.totalEstimate || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: 700 }}>Commercial / Approved</div>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#059669" }}>
                    ₹{Number(selectedJobDetail.workflow?.customApprovedPrice || selectedJobDetail.workflow?.priyaTotalQuotationAmount || 0).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* 7. Action Navigation Buttons */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                <Link
                  href={\`/forms/servicing?job=\${encodeURIComponent(String(selectedJobDetail.jobNo || selectedJobDetail.id))}\`}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "#0f766e",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 800,
                    textAlign: "center",
                    textDecoration: "none",
                  }}
                >
                  Open in Service Form ➔
                </Link>
                <Link
                  href={\`/workshop?job=\${encodeURIComponent(String(selectedJobDetail.jobNo || selectedJobDetail.id))}\`}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "#2563eb",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 800,
                    textAlign: "center",
                    textDecoration: "none",
                  }}
                >
                  Open in Workshop ➔
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal when user clicks "View" on any record */}
      {detail && (
        <ReportModal data={detail} onClose={() => setDetail(null)} />
      )}`;

if (!content.includes('DASHBOARD SIDE FORM DETAILS & OLDER FILES INSPECTION DRAWER')) {
  content = content.replace(targetDetailModal, sideDrawerJSX);
}

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('src/components/DashboardClient.tsx', content, 'utf8');
console.log('[OK] DashboardClient.tsx patched with Side Details Drawer & Older Files View');
