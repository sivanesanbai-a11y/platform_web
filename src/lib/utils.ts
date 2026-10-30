import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Strips leading zeros when followed by another digit, e.g. "01" -> "1", "01000" -> "1000",
 * while preserving valid single "0" and decimals like "0.5".
 */
export function cleanNumberString(raw: string): string {
  if (!raw) return "";
  return raw.replace(/^0+(?=\d)/, "");
}

export function parseCleanNumber(raw: string): number {
  const cleaned = cleanNumberString(raw);
  return cleaned === "" ? 0 : Number(cleaned);
}

/**
 * Universal clipboard copy with navigator.clipboard and fallback for older browsers/contexts.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    ta.setAttribute("readonly", "");
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
