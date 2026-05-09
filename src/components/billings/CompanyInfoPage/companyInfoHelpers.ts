const PLACEHOLDER = "—";

export function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function formatNameWithOptionalEmail(name: unknown, email: unknown): string | null {
  const n = toNonEmptyString(name);
  if (!n) return null;
  const e = toNonEmptyString(email);
  return e ? `${n} (${e})` : n;
}

export function getCompanyName(companyDetails: any, session: any): string {
  return companyDetails?.name ?? session?.user?.company_name ?? PLACEHOLDER;
}

export function getBusinessTrn(companyDetails: any): string {
  return (
    companyDetails?.profile?.tax_id ??
    PLACEHOLDER
  );
}

export function getPrimaryContactLabel(companyDetails: any, session: any): string {
  const fromCompany =
    formatNameWithOptionalEmail(
      companyDetails?.primary_contact_name ?? companyDetails?.billing_contact_name,
      companyDetails?.email
    );
  return fromCompany ?? session?.user?.name ?? PLACEHOLDER;
}

export function getBillingContactLabel(companyDetails: any, primaryContactLabel: string): string {
  const fromBilling =
    formatNameWithOptionalEmail(
      companyDetails?.billing_contact_name,
      companyDetails?.billing_email ?? companyDetails?.email
    );
  return fromBilling ?? primaryContactLabel;
}

export function toSelectDefaultValue(label: string): string | undefined {
  const normalized = toNonEmptyString(label);
  if (!normalized || normalized === PLACEHOLDER) return undefined;
  return normalized;
}

export function getAddressLines(companyDetails: any): string[] {
  if (!companyDetails) return [];
  const p = companyDetails?.profile ?? companyDetails?.billing_address ?? {};
  const addressStr = companyDetails?.profile?.address;
  const country = companyDetails?.country ?? p?.country ?? "";
  if (typeof addressStr === "string" && addressStr.trim()) {
    const lines = addressStr.split("\n").filter(Boolean);
    if (country.trim()) lines.push(country.trim());
    return lines;
  }
  const line1 = p?.address_line1 ?? p?.address ?? "";
  const line2 = p?.address_line2 ?? p?.building ?? "";
  const city = p?.city ?? p?.region ?? "";
  const postal = p?.postal_code ?? "";
  const countryFallback = p?.country ?? country;
  const parts = [line1, line2, [city, postal].filter(Boolean).join(" "), countryFallback].filter(Boolean);
  return parts;
}

export function getAddressDisplay(companyDetails: any): string {
  const lines = getAddressLines(companyDetails);
  return lines.length > 0 ? lines.join("\n") : PLACEHOLDER;
}

export { PLACEHOLDER };
