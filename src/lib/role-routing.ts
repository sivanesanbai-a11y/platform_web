/**
 * Role-Based Station Routing & Access Verification for NUNES Operations Platform
 */

export function getRoleDestination(email: string): string {
  const lower = (email || "").toLowerCase().trim();
  if (lower.includes("aravind") || lower.includes("senthil")) {
    return "/workshop";
  }
  if (lower.includes("priya") || lower.includes("azhalaku")) {
    return "/quotations";
  }
  if (
    lower.includes("suganya") ||
    lower.includes("radha") ||
    lower.includes("sabitha") ||
    lower.includes("rekha")
  ) {
    return "/forms/servicing";
  }
  return "/dashboard";
}

export function isRouteAllowedForRole(email: string, pathname: string): { allowed: boolean; redirectPath: string } {
  const lower = (email || "").toLowerCase().trim();

  // MD, Admin, Management can access everything
  if (
    lower.includes("admin") ||
    lower.includes("md") ||
    lower.startsWith("md@") ||
    lower.startsWith("admin@") ||
    lower.includes("director")
  ) {
    return { allowed: true, redirectPath: "/dashboard" };
  }

  // Aravindh & Senthil (Workshop Team)
  // Strictly permitted: /workshop, /products, /tasks, /team, /settings
  // FORBIDDEN: /dashboard, /forms, /forms/*, /quotations, /customers, /suppliers, /reports
  if (lower.includes("aravind") || lower.includes("senthil")) {
    const isAllowed =
      pathname === "/workshop" ||
      pathname.startsWith("/workshop") ||
      pathname === "/products" ||
      pathname.startsWith("/products") ||
      pathname === "/tasks" ||
      pathname.startsWith("/tasks") ||
      pathname === "/team" ||
      pathname === "/settings";
    return { allowed: isAllowed, redirectPath: "/workshop" };
  }

  // Azhalaku Priya (Quotations & Delivery)
  // Strictly permitted: /quotations, /customers, /tasks, /team, /settings
  // FORBIDDEN: /dashboard, /forms, /forms/*, /workshop, /suppliers, /reports
  if (lower.includes("priya") || lower.includes("azhalaku")) {
    const isAllowed =
      pathname === "/quotations" ||
      pathname.startsWith("/quotations") ||
      pathname === "/customers" ||
      pathname.startsWith("/customers") ||
      pathname === "/tasks" ||
      pathname.startsWith("/tasks") ||
      pathname === "/team" ||
      pathname === "/settings";
    return { allowed: isAllowed, redirectPath: "/quotations" };
  }

  // Intake Specialists: Suganya, Radha, Sabitha, Rekha
  // Strictly permitted: /forms, /forms/*, /customers, /tasks, /team, /settings
  // FORBIDDEN: /dashboard, /workshop, /quotations, /suppliers, /reports
  if (
    lower.includes("suganya") ||
    lower.includes("radha") ||
    lower.includes("sabitha") ||
    lower.includes("rekha")
  ) {
    const isAllowed =
      pathname === "/forms" ||
      pathname.startsWith("/forms") ||
      pathname === "/customers" ||
      pathname.startsWith("/customers") ||
      pathname === "/tasks" ||
      pathname.startsWith("/tasks") ||
      pathname === "/team" ||
      pathname === "/settings";
    return { allowed: isAllowed, redirectPath: "/forms/servicing" };
  }

  return { allowed: true, redirectPath: "/dashboard" };
}
