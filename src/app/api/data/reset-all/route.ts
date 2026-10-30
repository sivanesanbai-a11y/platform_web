import { NextResponse } from "next/server";
import { purgeAllStoreDataAsync, getServerStore } from "@/lib/serverStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await purgeAllStoreDataAsync();
  const store = getServerStore();
  return NextResponse.json({
    success: true,
    message: "All operational and demo records permanently wiped from database.",
    store: {
      service_jobs: store.service_jobs.length,
      purchasing_orders: store.purchasing_orders.length,
      quotations: store.quotations.length,
      customers: store.customers.length,
      suppliers: store.suppliers.length,
    },
    timestamp: new Date().toISOString(),
  });
}

export async function POST() {
  return GET();
}

export async function DELETE() {
  return GET();
}
