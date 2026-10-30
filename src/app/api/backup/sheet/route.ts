import { NextRequest, NextResponse } from "next/server";
import { refreshServerStoreFromCloud, getServerStore } from "@/lib/serverStore";
import { generateServiceJobsCsv } from "@/lib/excel-export";
import type { ServiceJob } from "@/types/service-job";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    let store = await refreshServerStoreFromCloud();
    if (!store || !Array.isArray(store.service_jobs)) {
      store = getServerStore();
    }

    const jobs: ServiceJob[] = (store.service_jobs || []) as ServiceJob[];
    const csvContent = generateServiceJobsCsv(jobs);

    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `nunes_service_forms_excel_backup_${dateStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "x-total-forms": String(jobs.length),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate Excel/Drive sheet" },
      { status: 500 }
    );
  }
}
