export interface ProductProfile {
  id: string;
  name: string;
  model: string;
  category: "Pressure" | "Temperature" | "Electrical" | "Flow & Level" | "Calibration" | "Lab & Safety";
  price: number;
  imageUrl: string;
  accuracy: string;
  range: string;
  description: string;
  specifications: string;
  calibrationPeriodMonths: number;
  inStock?: boolean;
  featured?: boolean;
}

// Generate inline SVG illustration for each instrument so they always render crisply
export function makeInstrumentSvg(color: string, accentColor: string, iconType: string, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc" />
        <stop offset="100%" stop-color="#e2e8f0" />
      </linearGradient>
      <linearGradient id="bezel" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color}" />
        <stop offset="100%" stop-color="${accentColor}" />
      </linearGradient>
    </defs>
    <rect width="400" height="300" rx="16" fill="url(#grad)" />
    <!-- Instrument Outer Body -->
    <rect x="70" y="45" width="260" height="210" rx="20" fill="url(#bezel)" stroke="#334155" stroke-width="4" filter="drop-shadow(0 10px 15px rgba(0,0,0,0.15))" />
    <!-- Display Screen -->
    <rect x="95" y="70" width="210" height="110" rx="10" fill="#0f172a" stroke="#475569" stroke-width="2" />
    <!-- Screen Grid & readout -->
    <text x="110" y="105" fill="#38bdf8" font-family="monospace" font-size="12" font-weight="bold">NUNES INSTRUMENTS</text>
    <text x="110" y="145" fill="#4ade80" font-family="monospace" font-size="28" font-weight="bold">00.000</text>
    <text x="245" y="145" fill="#94a3b8" font-family="monospace" font-size="14">${iconType}</text>
    <text x="110" y="165" fill="#facc15" font-family="monospace" font-size="11">CALIBRATED • ISO 17025</text>
    <!-- Buttons / Knobs -->
    <circle cx="120" cy="215" r="14" fill="#1e293b" stroke="#cbd5e1" stroke-width="2" />
    <circle cx="165" cy="215" r="14" fill="#1e293b" stroke="#cbd5e1" stroke-width="2" />
    <circle cx="210" cy="215" r="14" fill="#1e293b" stroke="#cbd5e1" stroke-width="2" />
    <!-- Rotary Dial or Terminals -->
    <circle cx="275" cy="215" r="18" fill="#334155" stroke="#f8fafc" stroke-width="3" />
    <line x1="275" y1="205" x2="275" y2="215" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />
    <!-- Bottom Badge -->
    <rect x="130" y="265" width="140" height="22" rx="6" fill="#0f766e" />
    <text x="200" y="280" fill="#ffffff" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// All legacy demo/dummy equipment profiles removed permanently
export const BASELINE_PRODUCT_PROFILES: ProductProfile[] = [];

const DEMO_PRODUCT_IDS = new Set([
  "prod-dpg-500",
  "prod-dwt-1200",
  "prod-dry-650",
  "prod-dpt-420",
  "prod-dmm-6500",
  "prod-rtd-pt100",
  "prod-vfm-80",
  "prod-pmp-700",
  "prod-vac-pirani",
  "prod-humi-100",
  "prod-sound-94",
  "prod-tach-2236",
]);

export function getAllProducts(): ProductProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("nunes:product_profiles");
    if (raw) {
      const list: ProductProfile[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        // Purge any legacy demo or mock items
        const cleaned = list.filter(
          (p) =>
            p &&
            p.id &&
            !DEMO_PRODUCT_IDS.has(p.id) &&
            !p.name?.includes("Digital Pressure Gauge (0.05% FS)") &&
            !p.model?.includes("NPG-500D")
        );
        if (cleaned.length !== list.length) {
          localStorage.setItem("nunes:product_profiles", JSON.stringify(cleaned));
        }
        return cleaned;
      }
    }
  } catch {}
  return [];
}

export function saveProductProfile(p: ProductProfile): ProductProfile[] {
  if (typeof window === "undefined") return [];
  const current = getAllProducts();
  const idx = current.findIndex((x) => x.id === p.id);
  let updated: ProductProfile[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = p;
  } else {
    updated = [p, ...current];
  }
  try {
    localStorage.setItem("nunes:product_profiles", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("nunes:records-synced"));
  } catch {}
  return updated;
}

export function deleteProductProfile(id: string): ProductProfile[] {
  if (typeof window === "undefined") return [];
  const current = getAllProducts();
  const updated = current.filter((x) => x.id !== id);
  try {
    localStorage.setItem("nunes:product_profiles", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("nunes:records-synced"));
  } catch {}
  return updated;
}
