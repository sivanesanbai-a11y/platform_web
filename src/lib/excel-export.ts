import type { ServiceJob } from "@/types/service-job";

/**
 * Escapes a cell value according to RFC 4180 CSV standard.
 */
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generates an RFC 4180 compliant CSV string with UTF-8 BOM,
 * ready to be opened directly in Microsoft Excel or Google Sheets.
 */
export function generateServiceJobsCsv(jobs: ServiceJob[]): string {
  const headers = [
    "Job No",
    "Date",
    "Form / Custom Name",
    "Overall Status",
    "Workflow Stage",
    "Receipt Mode",
    "Receipt Mode Details",
    "Customer Name",
    "Contact Person",
    "Phone",
    "Email",
    "Address",
    "GSTIN",
    "Equipment Name",
    "Make / Model",
    "Serial No",
    "Qty",
    "Physical Condition",
    "Reported Complaint",
    "Repair Work / Scope",
    "Technical Estimate (INR)",
    "Commercial Quotation (INR)",
    "Discount (INR)",
    "MD Approved Price (INR)",
    "Handover Completed Date",
    "Repaired By",
    "Inspected By",
    "MD Sign-Check By",
    "Attachments Count",
    "Attached Files",
    "Created By",
    "Created At",
    "Last Updated"
  ];

  const rows = jobs.map((j) => {
    const prod = (j.products || [])[0] || ({} as any);
    const receiptMode = j.receipt?.mode || "DIRECT";
    const receiptDetails =
      receiptMode === "COURIER"
        ? `${j.receipt?.courierName || "Courier"} (LR/Docket: ${j.receipt?.docketNo || "N/A"})`
        : `Direct Walk-in by ${j.receipt?.personName || j.customer?.contactPerson || j.customer?.name || "Customer"}`;

    const attachedFiles = (j.attachments || []).map((a) => a.fileName).join("; ");

    return [
      escapeCsv(j.jobNo || j.id),
      escapeCsv(j.jobDate || j.createdAt?.slice(0, 10) || ""),
      escapeCsv(j.customFormName || j.customer?.name || `Job ${j.jobNo || j.id}`),
      escapeCsv(j.status || "RECEIVED"),
      escapeCsv((j.workflow?.stage || "INTAKE_RECEIVED").replace(/_/g, " ")),
      escapeCsv(receiptMode === "COURIER" ? "Courier" : "Direct Walk-in"),
      escapeCsv(receiptDetails),
      escapeCsv(j.customer?.name || ""),
      escapeCsv(j.customer?.contactPerson || ""),
      escapeCsv(j.customer?.phone || ""),
      escapeCsv(j.customer?.email || ""),
      escapeCsv(j.customer?.address || ""),
      escapeCsv(j.customer?.gstin || ""),
      escapeCsv(prod.productName || "Equipment"),
      escapeCsv(prod.makeModel || ""),
      escapeCsv(prod.serialNo || ""),
      escapeCsv(prod.qty || 1),
      escapeCsv(prod.physicalCondition || "Good"),
      escapeCsv(prod.complaint || ""),
      escapeCsv(prod.repairWork || ""),
      escapeCsv(j.totals?.totalEstimate || prod.repairEstimate || 0),
      escapeCsv(j.workflow?.priyaTotalQuotationAmount || ""),
      escapeCsv(j.workflow?.priyaDiscount || j.totals?.discount || 0),
      escapeCsv(j.workflow?.customApprovedPrice || ""),
      escapeCsv(j.workflow?.finalHandoverCompletedAt || ""),
      escapeCsv(j.signoff?.repairedBy || ""),
      escapeCsv(j.signoff?.inspectedBy || ""),
      escapeCsv(j.signoff?.estimateConfirmedBy || ""),
      escapeCsv(j.attachments?.length || 0),
      escapeCsv(attachedFiles),
      escapeCsv(j.createdBy || ""),
      escapeCsv(j.createdAt || ""),
      escapeCsv(j.updatedAt || "")
    ].join(",");
  });

  // Prepend UTF-8 BOM (\uFEFF) so Excel on Windows & Mac immediately renders properly
  return "\uFEFF" + [headers.map(escapeCsv).join(","), ...rows].join("\r\n");
}

/**
 * Triggers an immediate browser download of all service jobs in Excel/Google Sheets CSV format.
 */
export function downloadServiceJobsExcel(jobs: ServiceJob[], customFileName?: string): void {
  if (typeof window === "undefined") return;

  const csv = generateServiceJobsCsv(jobs);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = customFileName || `nunes_service_forms_sheet_backup_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports all local service forms to Excel / Google Sheets format,
 * triggers a local backup download, and syncs to Google Account / Drive via API.
 */
export async function exportAndBackupToDriveSheet(options: { email?: string; download?: boolean } = {}): Promise<{
  success: boolean;
  message: string;
  count: number;
}> {
  if (typeof window === "undefined") {
    return { success: false, message: "Browser environment required", count: 0 };
  }

  try {
    const raw = localStorage.getItem("nunes:service_jobs");
    const jobs: ServiceJob[] = raw ? JSON.parse(raw) : [];

    // 1. Generate clean Excel/Google Sheet CSV
    const csvContent = generateServiceJobsCsv(jobs);

    // 2. Local download if requested (default true)
    if (options.download !== false) {
      downloadServiceJobsExcel(jobs);
    }

    // 3. Dispatch to Google Account / Drive Backup endpoint
    const targetEmail =
      options.email ||
      localStorage.getItem("nunes:google_backup_email") ||
      "";
    const appPassword =
      localStorage.getItem("nunes:google_app_password") ||
      "tpqb fhyx dgfx wcpx";

    if (targetEmail) {
      void fetch("/api/backup/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "drive_sheet_backup",
          id: `SHEET-${new Date().toISOString().slice(0, 10)}`,
          customer: `NUNES Platform (${jobs.length} Forms)`,
          email: targetEmail,
          app_password: appPassword,
          data: {
            total_forms: jobs.length,
            backup_type: "Excel / Google Drive Sheet Backup",
            timestamp: new Date().toISOString(),
          },
          sheet_csv: csvContent,
          title: `[NUNES EXCEL / DRIVE SHEET BACKUP] ${jobs.length} Application Forms (${new Date().toLocaleDateString("en-IN")})`
        })
      }).catch(() => {});
    }

    return {
      success: true,
      message: `Successfully exported ${jobs.length} form(s) to Excel / Google Sheet format!`,
      count: jobs.length
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to export spreadsheet",
      count: 0
    };
  }
}
