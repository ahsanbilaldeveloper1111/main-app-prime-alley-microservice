export type BillingAddressLine = {
  key: string;
  text: string;
  tone: "primary" | "secondary";
};

export function getBillingAddressLines(companyDetails: any): BillingAddressLine[] {
  if (!companyDetails) return [];
  const address = companyDetails?.profile?.address;
  const country = companyDetails?.country ?? companyDetails?.profile?.country ?? companyDetails?.billing_address?.country ?? "";
  if (typeof address === "string" && address.trim()) {
    const lines = address.split("\n").filter(Boolean);
    const out: BillingAddressLine[] = lines.map((text, idx) => ({
      key: `address_${idx + 1}`,
      text,
      tone: idx === 0 ? "primary" : "secondary",
    }));
    if (country.trim()) out.push({ key: "country", text: country.trim(), tone: "secondary" });
    return out;
  }
  const p = companyDetails?.profile ?? companyDetails?.billing_address ?? {};
  const line1 = p?.address_line1 ?? p?.address ?? "";
  const line2 = p?.address_line2 ?? p?.building ?? "";
  const city = p?.city ?? p?.region ?? "";
  const postal = p?.postal_code ?? "";
  const countryFallback = p?.country ?? country;
  const cityPostal = [city, postal].filter(Boolean).join(" ");

  const out: BillingAddressLine[] = [];
  if (line1) out.push({ key: "line1", text: line1, tone: "primary" });
  if (line2) out.push({ key: "line2", text: line2, tone: "secondary" });
  if (cityPostal) out.push({ key: "city_postal", text: cityPostal, tone: "secondary" });
  if (countryFallback) out.push({ key: "country", text: countryFallback, tone: "secondary" });
  return out;
}

export function getBillingAddressForStripe(companyDetails: any): Record<string, string> {
  if (!companyDetails) return {};
  const p = companyDetails?.profile ?? companyDetails?.billing_address ?? {};
  const addressStr = companyDetails?.profile?.address;
  const country = companyDetails?.country ?? p?.country ?? "";
  let line1 = p?.address_line1 ?? p?.address ?? "";
  let line2 = p?.address_line2 ?? p?.building ?? "";
  const city = p?.city ?? p?.region ?? "";
  const state = p?.state ?? "";
  const postal = p?.postal_code ?? "";
  if (typeof addressStr === "string" && addressStr.trim()) {
    const lines = addressStr.split("\n").filter(Boolean);
    if (lines.length > 0 && !line1) line1 = lines[0];
    if (lines.length > 1 && !line2) line2 = lines[1];
  }
  const out: Record<string, string> = {};
  if (line1) out.address_line1 = line1;
  if (line2) out.address_line2 = line2;
  if (city) out.address_city = city;
  if (state) out.address_state = state;
  if (postal) out.address_zip = postal;
  if (country) out.address_country = country;
  return out;
}
