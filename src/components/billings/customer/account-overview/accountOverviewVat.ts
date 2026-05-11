export function formatVatRateString(vat: unknown): string {
  const raw =
    typeof vat === "string" || typeof vat === "number" ? String(vat) : "";
  const s = raw.replaceAll("%", "").trim();
  const n = Number(s);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

/**
 * VAT % field: decimals allowed (e.g. 22.5), one dot, up to 2 fractional digits, range 0–100 on save.
 */
export function sanitizeVatPercentDecimalInput(raw: string): string {
  let t = raw.replaceAll(",", ".").replaceAll(/[^\d.]/g, "");
  if (t === "") return "";
  if (t === ".") return "0.";
  const firstDot = t.indexOf(".");
  if (firstDot === -1) {
    return t.slice(0, 3);
  }
  let intPart = t.slice(0, firstDot).slice(0, 3);
  if (intPart === "") intPart = "0";
  const decPart = t.slice(firstDot + 1).replaceAll(".", "").slice(0, 2);
  if (t.endsWith(".") && decPart.length === 0) {
    return `${intPart}.`;
  }
  return decPart.length > 0 ? `${intPart}.${decPart}` : intPart;
}

export function parseVatPercentToClampedNumber(raw: string): number {
  const s = raw.trim();
  if (s === "") return 0;
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}
