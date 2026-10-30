const fs = require('fs');
const path = require('path');

// 1. DashboardClient.tsx: link directly to /forms/servicing
const dashFile = path.join(__dirname, '..', 'src', 'components', 'DashboardClient.tsx');
let dashContent = fs.readFileSync(dashFile, 'utf8');
dashContent = dashContent.replace('href="/forms?type=servicing"', 'href="/forms/servicing"');
fs.writeFileSync(dashFile, dashContent, 'utf8');
console.log('Updated DashboardClient.tsx link');

// 2. CommandPalette.tsx: filter out /forms for MD
const cmdFile = path.join(__dirname, '..', 'src', 'components', 'CommandPalette.tsx');
let cmdContent = fs.readFileSync(cmdFile, 'utf8');
const isCRLF = cmdContent.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';

// Check if userEmail state is declared
if (!cmdContent.includes('const [userEmail, setUserEmail] = useState("");')) {
  cmdContent = cmdContent.replace(
    `const [dynamicItems, setDynamicItems] = useState<PaletteItem[]>([]);`,
    `const [dynamicItems, setDynamicItems] = useState<PaletteItem[]>([]);${eol}  const [userEmail, setUserEmail] = useState("");`
  );
  cmdContent = cmdContent.replace(
    `  useEffect(() => {${eol}    if (!isOpen) return;`,
    `  useEffect(() => {${eol}    if (!isOpen) return;${eol}    try {${eol}      const raw = localStorage.getItem("nunes_auth_session");${eol}      if (raw) setUserEmail((JSON.parse(raw)?.email || "").toLowerCase().trim());${eol}    } catch {}${eol}`
  );
  cmdContent = cmdContent.replace(
    `  // Combined and filtered items${eol}  const allItems = [...STATIC_ITEMS, ...dynamicItems];`,
    `  const isMd = Boolean(${eol}    userEmail &&${eol}      !userEmail.includes("admin") &&${eol}      (userEmail === "md" ||${eol}        userEmail.startsWith("md@") ||${eol}        userEmail.includes("md@nunesinstruments.com") ||${eol}        userEmail.includes("director") ||${eol}        userEmail.includes("managing"))${eol}  );${eol}${eol}  // Combined and filtered items${eol}  const baseStatic = isMd ? STATIC_ITEMS.filter((item) => item.href !== "/forms") : STATIC_ITEMS;${eol}  const allItems = [...baseStatic, ...dynamicItems];`
  );
  fs.writeFileSync(cmdFile, cmdContent, 'utf8');
  console.log('Updated CommandPalette.tsx');
}

// 3. ModuleWorkspace.tsx: Back button routes MD to /dashboard instead of /forms
const modFile = path.join(__dirname, '..', 'src', 'components', 'ModuleWorkspace.tsx');
let modContent = fs.readFileSync(modFile, 'utf8');
const modCRLF = modContent.includes('\r\n');
const modEol = modCRLF ? '\r\n' : '\n';

if (!modContent.includes('const [userEmail, setUserEmail] = useState("");')) {
  modContent = modContent.replace(
    `export default function ModuleWorkspace({ kind }: { kind: "purchasing" | "servicing" }) {${modEol}  const router = useRouter();`,
    `export default function ModuleWorkspace({ kind }: { kind: "purchasing" | "servicing" }) {${modEol}  const router = useRouter();${modEol}  const [userEmail, setUserEmail] = useState("");`
  );
  modContent = modContent.replace(
    `      if (raw) {${modEol}        const email = (JSON.parse(raw)?.email || "").toLowerCase().trim();`,
    `      if (raw) {${modEol}        const email = (JSON.parse(raw)?.email || "").toLowerCase().trim();${modEol}        setUserEmail(email);`
  );
  modContent = modContent.replace(
    `<Link href="/forms" className="btn">${modEol}            <ArrowLeft size={15} /> Forms${modEol}          </Link>`,
    `{(() => {${modEol}            const isMd = Boolean(userEmail && !userEmail.includes("admin") && (userEmail === "md" || userEmail.startsWith("md@") || userEmail.includes("director") || userEmail.includes("managing")));${modEol}            return (${modEol}              <Link href={isMd ? "/dashboard" : "/forms"} className="btn">${modEol}                <ArrowLeft size={15} /> {isMd ? "Dashboard" : "Forms"}${modEol}              </Link>${modEol}            );${modEol}          })()}`
  );
  fs.writeFileSync(modFile, modContent, 'utf8');
  console.log('Updated ModuleWorkspace.tsx');
}
