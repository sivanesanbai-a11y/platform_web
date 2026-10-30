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
function makeInstrumentSvg(color: string, accentColor: string, iconType: string, label: string): string {
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

export const BASELINE_PRODUCT_PROFILES: ProductProfile[] = [
  {
    id: "prod-dpg-500",
    name: "Digital Pressure Gauge (0.05% FS)",
    model: "NPG-500D",
    category: "Pressure",
    price: 18500,
    imageUrl: makeInstrumentSvg("#1e293b", "#0f766e", "bar / PSI", "PRESSURE"),
    accuracy: "±0.05% Full Scale",
    range: "-1 to 700 bar (selectable)",
    description: "High-precision microprocessor-based digital test gauge for laboratory calibration and field hydrostatic testing.",
    specifications: "Connection: 1/2\" BSP Male SS316; Display: 5-digit backlit LCD with bargraph; Battery Life: 2000 hours continuous; Media: Liquids and gases compatible with SS316.",
    calibrationPeriodMonths: 12,
    inStock: true,
    featured: true
  },
  {
    id: "prod-dwt-1200",
    name: "Dead Weight Tester (Primary Standard)",
    model: "NDWT-1200",
    category: "Calibration",
    price: 145000,
    imageUrl: makeInstrumentSvg("#0f172a", "#1d4ed8", "kg/cm²", "PRIMARY STD"),
    accuracy: "±0.015% of Reading",
    range: "1 to 1200 bar",
    description: "Primary pressure calibration standard with tungsten carbide piston-cylinder system and non-magnetic stainless steel mass set.",
    specifications: "Operating Medium: Hydraulic mineral oil; Piston Area: 0.05 cm²; Mass Set: 50 kg total; Gravity: Adjusted to regional g factor.",
    calibrationPeriodMonths: 24,
    inStock: true,
    featured: true
  },
  {
    id: "prod-dry-650",
    name: "Industrial Dry Block Temperature Calibrator",
    model: "NTC-650Dry",
    category: "Temperature",
    price: 92000,
    imageUrl: makeInstrumentSvg("#334155", "#b45309", "°C / °F", "TEMPERATURE"),
    accuracy: "±0.15°C at 400°C",
    range: "33°C to 650°C",
    description: "Portable micro-processor controlled dry block heating calibrator with multi-hole interchangeable test inserts.",
    specifications: "Stability: ±0.03°C; Well Depth: 155 mm; Insert diameter: 28 mm; Ramp Rate: 35°C/min; Interface: RS-485 / USB.",
    calibrationPeriodMonths: 12,
    inStock: true,
    featured: true
  },
  {
    id: "prod-dpt-420",
    name: "Differential Pressure Smart Transmitter",
    model: "NDPT-420-HART",
    category: "Pressure",
    price: 34000,
    imageUrl: makeInstrumentSvg("#1e293b", "#0284c7", "4-20 mA", "TRANSMITTER"),
    accuracy: "±0.075% Span",
    range: "0 to 2500 mmH2O / 250 mbar",
    description: "Industrial smart DP transmitter with HART protocol communication and explosion-proof terminal enclosure.",
    specifications: "Output: 4-20mA 2-wire with HART; Static Pressure Limit: 160 bar; Diaphragm: Hastelloy C-276 / SS316L; Ingress: IP67 / NEMA 4X.",
    calibrationPeriodMonths: 12,
    inStock: true
  },
  {
    id: "prod-dmm-6500",
    name: "6½ Digit True-RMS Precision Benchtop Multimeter",
    model: "NMM-6500",
    category: "Electrical",
    price: 78000,
    imageUrl: makeInstrumentSvg("#0f172a", "#7c3aed", "V / mA / Ω", "METROLOGY"),
    accuracy: "0.0035% DC Voltage",
    range: "100 mV to 1000 V / 10 µA to 10 A",
    description: "Metrology-grade benchtop digital multimeter for laboratory testing, RTD temperature simulation, and automated test benches.",
    specifications: "Sampling: 1 Million readings/s; Measurements: DCV, ACV, DCI, ACI, 2/4-wire Resistance, Frequency, Capacitance; Connectivity: LAN, USB-TMC, GPIB.",
    calibrationPeriodMonths: 12,
    inStock: true,
    featured: true
  },
  {
    id: "prod-rtd-pt100",
    name: "Class A RTD Pt100 Temperature Sensor",
    model: "N-RTD-300SS",
    category: "Temperature",
    price: 4800,
    imageUrl: makeInstrumentSvg("#1e293b", "#d97706", "Pt100 Ω", "SENSOR"),
    accuracy: "Class A (±0.15 + 0.002×|t|)",
    range: "-50°C to 450°C",
    description: "3-Wire simplex Pt100 RTD element housed inside mineral insulated SS316 sheath with aluminium weatherproof terminal head.",
    specifications: "Sheath Length: 300 mm; Sheath Dia: 6 mm; Process Thread: 1/2\" NPT Male; Head: IP65 Die-cast aluminium with cable gland.",
    calibrationPeriodMonths: 12,
    inStock: true
  },
  {
    id: "prod-vfm-80",
    name: "Flanged Inline Vortex Flow Meter",
    model: "NVFM-080F",
    category: "Flow & Level",
    price: 56000,
    imageUrl: makeInstrumentSvg("#1e293b", "#059669", "m³/h / LPM", "FLOW METER"),
    accuracy: "±1.0% of Reading (Liquids)",
    range: "6 to 80 m³/h (DN80 pipe)",
    description: "No-moving-parts inline vortex flow meter for steam, gas, and clean liquids with integrated temperature compensation.",
    specifications: "Flange Standard: ANSI 150# RF; Material: WCB body with SS304 sensor; Output: Pulse & 4-20mA; Medium: Steam, Water, Nitrogen.",
    calibrationPeriodMonths: 24,
    inStock: true
  },
  {
    id: "prod-pmp-700",
    name: "Hydraulic Handheld Comparison Test Pump",
    model: "NHP-700Hyd",
    category: "Calibration",
    price: 28500,
    imageUrl: makeInstrumentSvg("#0f172a", "#2563eb", "0-700 bar", "HAND PUMP"),
    accuracy: "Effortless vernier fine control to 0.01 bar",
    range: "0 to 700 bar (10,000 PSI)",
    description: "Compact bench/field hydraulic comparator pump for calibration of pressure gauges, transducers, and switches.",
    specifications: "Fluid: Distilled water or hydraulic oil; Port: Two 1/4\" BSP quick connectors; Reservoir: 100 ml transparent acrylic; Weight: 1.8 kg.",
    calibrationPeriodMonths: 24,
    inStock: true
  },
  {
    id: "prod-vac-pirani",
    name: "Digital Pirani Vacuum Gauge",
    model: "NVG-10Pirani",
    category: "Lab & Safety",
    price: 36000,
    imageUrl: makeInstrumentSvg("#1e293b", "#475569", "mbar / Torr", "VACUUM"),
    accuracy: "±15% of Reading",
    range: "1000 to 0.001 mbar (1×10⁻³ mbar)",
    description: "Precision thermal conductivity Pirani vacuum measuring instrument with digital display and dual set-point relays.",
    specifications: "Sensor Flange: KF-16 / KF-25; Display: High-contrast OLED; Power: 230V AC / 24V DC; Output: 0-10V log output.",
    calibrationPeriodMonths: 12,
    inStock: true
  },
  {
    id: "prod-humi-100",
    name: "Portable Precision Humidity & Temperature Meter",
    model: "NHT-100Pro",
    category: "Temperature",
    price: 16500,
    imageUrl: makeInstrumentSvg("#1e293b", "#0891b2", "%RH & °C", "ENVIRONMENT"),
    accuracy: "±1.5% RH / ±0.3°C",
    range: "0 to 100% RH / -20°C to 80°C",
    description: "Handheld environmental instrument for HVAC certification, clean room monitoring, and pharmaceutical stability chambers.",
    specifications: "Sensor: Capacitive polymer RH sensor; Calculations: Dew point & wet bulb temperature; Memory: 16,000 logging records.",
    calibrationPeriodMonths: 12,
    inStock: true
  },
  {
    id: "prod-sound-94",
    name: "Acoustic Sound Level Calibrator",
    model: "NSLC-94-114",
    category: "Lab & Safety",
    price: 24000,
    imageUrl: makeInstrumentSvg("#0f172a", "#e11d48", "94 / 114 dB", "ACOUSTIC"),
    accuracy: "Class 1 (±0.3 dB at 1 kHz)",
    range: "94.0 dB and 114.0 dB at 1000 Hz",
    description: "High-precision acoustic calibrator meeting IEC 60942 Class 1 standard for fast on-site verification of sound level meters.",
    specifications: "Transducer Cavity: 1\" and 1/2\" microphones; Distortion: <1.5%; Standard: IEC 60942:2003 Class 1; Battery: 9V transistor.",
    calibrationPeriodMonths: 12,
    inStock: true
  },
  {
    id: "prod-tach-2236",
    name: "Optical & Contact Digital Tachometer",
    model: "NTC-2236RPM",
    category: "Electrical",
    price: 8900,
    imageUrl: makeInstrumentSvg("#1e293b", "#4f46e5", "RPM / m/min", "TACHOMETER"),
    accuracy: "±(0.05% + 1 digit)",
    range: "2.5 to 99,999 RPM (Photo) / 0.5 to 19,999 RPM (Contact)",
    description: "Combination laser photo and contact tachometer for measuring rotational speeds of motors, turbines, and conveyor belts.",
    specifications: "Detecting Distance: 50 to 500 mm (Laser); Sampling Time: 0.8 sec; Accessories: Reflective tape, funnel contact tip, surface speed wheel.",
    calibrationPeriodMonths: 12,
    inStock: true
  }
];

export function getAllProducts(): ProductProfile[] {
  if (typeof window === "undefined") return BASELINE_PRODUCT_PROFILES;
  try {
    const raw = localStorage.getItem("nunes:product_profiles");
    if (raw) {
      const list: ProductProfile[] = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        // Merge with baseline to guarantee comprehensive catalog
        const map = new Map<string, ProductProfile>();
        for (const p of BASELINE_PRODUCT_PROFILES) map.set(p.id, p);
        for (const p of list) map.set(p.id, p);
        return Array.from(map.values());
      }
    }
  } catch {}
  return BASELINE_PRODUCT_PROFILES;
}

export function saveProductProfile(p: ProductProfile): ProductProfile[] {
  if (typeof window === "undefined") return BASELINE_PRODUCT_PROFILES;
  const current = getAllProducts();
  const idx = current.findIndex(x => x.id === p.id);
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
  if (typeof window === "undefined") return BASELINE_PRODUCT_PROFILES;
  const current = getAllProducts();
  const updated = current.filter(x => x.id !== id);
  try {
    localStorage.setItem("nunes:product_profiles", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("nunes:records-synced"));
  } catch {}
  return updated;
}
