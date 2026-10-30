"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, RefreshCw, Layout, Server } from "lucide-react";
import { clearDataCache, companyFetch, getModuleStatus, moduleUrl } from "@/lib/data";
import PurchasingOrderForm from "./forms/PurchasingOrderForm";
import ServicingJobForm from "./forms/ServicingJobForm";

const PORTS = { order_forms: 8770, service_operations: 5055 } as const;

function isOfficeHost(host: string) {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(host) ||
    !host.includes(".")
  );
}

function directOfficeUrl(key: keyof typeof PORTS) {
  if (typeof window === "undefined" || !isOfficeHost(window.location.hostname)) return "";
  const path = key === "service_operations" ? "/jobs/new" : "/";
  return `${window.location.protocol}//${window.location.hostname}:${PORTS[key]}${path}`;
}

export default function ModuleWorkspace({ kind }: { kind: "purchasing" | "servicing" }) {
  const router = useRouter();

  // Role Redirection Guard (Preserving active job query params)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("nunes_auth_session");
      if (raw) {
        const email = (JSON.parse(raw)?.email || "").toLowerCase().trim();
        if (
          email &&
          !email.includes("admin") &&
          !email.includes("md") &&
          !email.startsWith("md@") &&
          !email.startsWith("admin@") &&
          !email.includes("director")
        ) {
          const sp = typeof window !== "undefined" ? window.location.search : "";
          if (email.includes("aravind") || email.includes("senthil")) {
            router.replace(`/workshop${sp}`);
            return;
          }
          if (email.includes("priya") || email.includes("azhalaku")) {
            router.replace(`/quotations${sp}`);
            return;
          }
        }
      }
    } catch {}
  }, [router]);
  const key = kind === "purchasing" ? "order_forms" : "service_operations";
  const storageKey = `nunes:module-url:${key}`;
  const initialUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return directOfficeUrl(key) || localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey) || "";
  }, [key, storageKey]);

  const [url, setUrl] = useState(initialUrl);
  const [engineReady, setEngineReady] = useState(false);
  const [useLocalEngine, setUseLocalEngine] = useState(false);
  const title = kind === "purchasing" ? "Purchasing Form" : "Servicing Form";

  useEffect(() => {
    // On Cloud / Vercel, the form runs entirely in-browser with cloud sync — avoid unnecessary engine probing
    if (typeof window !== "undefined" && !isOfficeHost(window.location.hostname) && !useLocalEngine) {
      return;
    }

    let stopped = false;
    const check = async () => {
      try {
        clearDataCache(`/api/data/modules/${key}`);
        const m = await getModuleStatus(key).catch(() => null as any);
        if (stopped) return;
        if (m) {
          const u = moduleUrl(m) || directOfficeUrl(key);
          if (u) setUrl(u);
          if (m.ready || m.public_url) {
            setEngineReady(true);
            return;
          }
        }
      } catch {}
    };
    check();
    return () => { stopped = true; };
  }, [key, useLocalEngine]);

  return (
    <div className="module-shell">
      {useLocalEngine && (
        <div className="module-head">
          <Link href="/forms" className="btn">
            <ArrowLeft size={15} /> Forms
          </Link>
          <div className="grow">
            <b>{title}</b>
            <span>{engineReady ? "Local Engine Connected" : "Connecting to Local Engine..."}</span>
          </div>
          <button
            type="button"
            className="btn primary"
            onClick={() => setUseLocalEngine(false)}
            title="Switch back to Cloud Form"
          >
            <Layout size={14} />
            <span>Switch to Cloud Form</span>
          </button>
        </div>
      )}

      <div className="module-frame-wrap" style={{ overflow: 'auto', background: '#f7f8fb' }}>
        {useLocalEngine && engineReady && url ? (
          <iframe className="module-frame" src={url} title={title} />
        ) : kind === "purchasing" ? (
          <PurchasingOrderForm />
        ) : (
          <ServicingJobForm />
        )}
      </div>
    </div>
  );
}
