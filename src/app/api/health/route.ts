import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function currentReleaseId() {
  try {
    const base = (process.env.LOCALAPPDATA || process.env.APPDATA || "").trim();
    if (base) {
      const releaseFile = path.join(base, "NUNES Operations", "release-id.txt");
      if (fs.existsSync(releaseFile)) {
        const value = fs.readFileSync(releaseFile, "utf8").trim();
        if (value) return value;
      }
    }
  } catch { /* use environment/version fallback */ }
  return (process.env.NUNES_RELEASE_ID || process.env.VERCEL_GIT_COMMIT_SHA || "6.5.0").trim();
}

export async function GET() {
  const dataBackendConfigured = Boolean(
    (process.env.NUNES_API_INTERNAL_URL || process.env.NUNES_API_URL || "").trim()
  ) || !process.env.VERCEL;

  return NextResponse.json(
    {
      ok: true,
      product: "NUNES Company Platform",
      version: "6.5.0",
      release_id: currentReleaseId(),
      central_server: !process.env.VERCEL,
      server_name: process.env.COMPUTERNAME || null,
      architecture: "Next.js",
      deployment: process.env.VERCEL ? "vercel" : "local-or-cloud-vm",
      data_backend_configured: dataBackendConfigured,
      data_api_token_configured: Boolean((process.env.NUNES_DATA_API_TOKEN || "").trim()) || !process.env.VERCEL,
      data_persistence: process.env.VERCEL ? "external-required" : "local-persistent-service",
      git_commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
    },
    { headers: { "cache-control": "no-store, no-cache, must-revalidate, max-age=0" } }
  );
}
