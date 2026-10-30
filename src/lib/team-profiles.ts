export interface StaffProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  avatarBg: string;
  avatarTextColor: string;
  avatarUrl?: string;
  initials: string;
  modules: ("Purchasing" | "Servicing" | "Quotations" | "Approvals" | "Calibration" | "Administration")[];
  responsibilities: string[];
  status: "Active" | "In Lab" | "On Field" | "Available";
  isExecutive?: boolean;
}

export const COMPANY_STAFF_PROFILES: StaffProfile[] = [
  {
    id: "staff-md",
    name: "Managing Director (MD)",
    username: "md",
    email: "md@nunesinstruments.com",
    role: "Executive Director & CEO",
    department: "Executive Directorate",
    phone: "+91 94430 12345",
    avatarBg: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)",
    avatarTextColor: "#ffffff",
    initials: "MD",
    modules: ["Approvals", "Purchasing", "Servicing", "Quotations", "Administration"],
    responsibilities: [
      "Executive commercial approvals and company operations leadership",
      "Strategic procurement agreements and high-value orders",
      "NABL / ISO 17025 compliance and laboratory governance"
    ],
    status: "Active",
    isExecutive: true
  },
  {
    id: "staff-suganya",
    name: "Suganya S.",
    username: "suganya",
    email: "suganya@nunesinstruments.com",
    role: "Senior Purchasing & Commercial Executive",
    department: "Procurement & Commercials",
    phone: "+91 98422 45678",
    avatarBg: "linear-gradient(135deg, #065f46 0%, #059669 100%)",
    avatarTextColor: "#ffffff",
    initials: "SS",
    modules: ["Purchasing", "Approvals"],
    responsibilities: [
      "Authoring and processing purchase orders (NM-Series)",
      "Vendor price negotiations, rate contracts & supplier evaluations",
      "Tracking material inwards, GST verification & invoice clearances"
    ],
    status: "Active"
  },
  {
    id: "staff-rekha",
    name: "Rekha M.",
    username: "rekha",
    email: "rekha@nunesinstruments.com",
    role: "Marketing & Client Quotations Lead",
    department: "Client Relations & Quotations",
    phone: "+91 98423 56789",
    avatarBg: "linear-gradient(135deg, #831843 0%, #be185d 100%)",
    avatarTextColor: "#ffffff",
    initials: "RM",
    modules: ["Quotations", "Purchasing"],
    responsibilities: [
      "Generating official quotations with GST, discounts & validity",
      "Direct client inquiries via WhatsApp and email correspondence",
      "Commercial follow-up and conversion to firm purchase orders"
    ],
    status: "Active"
  },
  {
    id: "staff-sabitha",
    name: "Sabitha K.",
    username: "sabitha",
    email: "sabitha@nunesinstruments.com",
    role: "Inventory & Dispatch Logistics Coordinator",
    department: "Stores, Stock & Logistics",
    phone: "+91 98424 67890",
    avatarBg: "linear-gradient(135deg, #78350f 0%, #d97706 100%)",
    avatarTextColor: "#ffffff",
    initials: "SK",
    modules: ["Purchasing", "Servicing"],
    responsibilities: [
      "Material receipt registration (MR No.) on incoming equipment",
      "Dispatch challans, courier tracking, and outward gate passes",
      "Finished goods stock maintenance and packaging verification"
    ],
    status: "Active"
  },
  {
    id: "staff-priya",
    name: "Azhalaku Priya R.",
    username: "azhalakupriya",
    email: "azhalakupriya@nunesinstruments.com",
    role: "Lead Calibration & QA Engineer",
    department: "Quality Assurance & Calibration Lab",
    phone: "+91 98425 78901",
    avatarBg: "linear-gradient(135deg, #0e7490 0%, #0891b2 100%)",
    avatarTextColor: "#ffffff",
    initials: "AP",
    modules: ["Servicing", "Calibration"],
    responsibilities: [
      "Primary calibration testing against Master Dead Weight standards",
      "Issuance of ISO 17025 compliant calibration test certificates",
      "Pre-dispatch quality assurance, accuracy checks and zero-error signoff"
    ],
    status: "In Lab"
  },
  {
    id: "staff-aravindh",
    name: "Aravindh V.",
    username: "aravindh",
    email: "aravindh@nunesinstruments.com",
    role: "Senior Instrumentation Service Engineer",
    department: "Bench Servicing & Electronics Rework",
    phone: "+91 98426 89012",
    avatarBg: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
    avatarTextColor: "#ffffff",
    initials: "AV",
    modules: ["Servicing"],
    responsibilities: [
      "Troubleshooting electronic PCB faults, display chips & sensors",
      "Hydraulic seal replacement, pressure chamber cleaning & overhaul",
      "Equipment inspection reports and technical repair estimates"
    ],
    status: "Active"
  },
  {
    id: "staff-admin",
    name: "System Administrator",
    username: "admin",
    email: "admin@nunes.com",
    role: "Cloud Platform & IT Administrator",
    department: "IT Infrastructure & Security",
    phone: "+91 98420 11223",
    avatarBg: "linear-gradient(135deg, #18181b 0%, #3f3f46 100%)",
    avatarTextColor: "#ffffff",
    initials: "SA",
    modules: ["Administration"],
    responsibilities: [
      "Vercel cloud database synchronization and offline backup maintenance",
      "User security credentials and access rights administration",
      "System health audits and continuous multi-device uptime"
    ],
    status: "Active"
  },
  {
    id: "staff-instruasia",
    name: "Admin / Instruasia",
    username: "instruasia",
    email: "instruasia@gmail.com",
    role: "System Operations & Master Admin",
    department: "Executive Operations",
    phone: "+91 98420 00000",
    avatarBg: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
    avatarTextColor: "#ffffff",
    initials: "IN",
    modules: ["Administration", "Servicing", "Quotations", "Approvals"],
    responsibilities: [
      "Master workstation oversight and company telemetry",
      "Executive authorization and cross-departmental operations"
    ],
    status: "Active"
  }
];

export function getStaffProfiles(): StaffProfile[] {
  if (typeof window === "undefined") return COMPANY_STAFF_PROFILES;
  try {
    const raw = localStorage.getItem("nunes:staff_profiles");
    if (raw) {
      const list: StaffProfile[] = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        const map = new Map<string, StaffProfile>();
        for (const s of COMPANY_STAFF_PROFILES) map.set(s.id, s);
        for (const s of list) map.set(s.id, s);
        return Array.from(map.values());
      }
    }
  } catch {}
  return COMPANY_STAFF_PROFILES;
}

export function saveStaffProfile(profile: StaffProfile): StaffProfile[] {
  if (typeof window === "undefined") return COMPANY_STAFF_PROFILES;
  const current = getStaffProfiles();
  const idx = current.findIndex(x => x.id === profile.id || x.username === profile.username);
  let updated: StaffProfile[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = profile;
  } else {
    updated = [...current, profile];
  }
  try {
    localStorage.setItem("nunes:staff_profiles", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("nunes:records-synced"));
  } catch {}
  return updated;
}
