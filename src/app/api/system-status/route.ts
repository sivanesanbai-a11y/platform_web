import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function probe(url: string) {
  try { const r = await fetch(url, {cache:"no-store", signal:AbortSignal.timeout(4000)});
    if (!r.ok) return null; return await r.json(); } catch { return null; }
}
export async function GET() {
  if (process.env.VERCEL) return NextResponse.json({dashboard:true, data:false, servicing:false, gmail:"Check on server"});
  const api = (process.env.NUNES_API_INTERNAL_URL || process.env.NUNES_API_URL || "http://127.0.0.1:8865").replace(/\/$/, "");
  const [data, service] = await Promise.all([probe(`${api}/api/health`),probe("http://127.0.0.1:5055/api/health")]);
  const servicing = service?.app === "ServiceFlowJobCards" && service?.ok === true;
  const gmail = servicing ? await probe("http://127.0.0.1:5055/api/google/oauth/status") : null;
  return NextResponse.json({dashboard:true, data:Boolean(data?.ok && data?.product === "NUNES Company Data API"), servicing,
    gmail:gmail?.connected ? "Connected" : gmail?.status === "WAITING" ? "Login pending" : gmail?.configured ? "Login required" : gmail ? "Upload JSON" : "Unavailable",
    checkedAt:new Date().toISOString()}, {headers:{"Cache-Control":"no-store"}});
}
