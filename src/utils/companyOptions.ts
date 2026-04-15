export type CompanyOption = {
  /** Stable identifier used by UI selects/filters */
  id: string;
  /** API/company identifier (when provided) */
  identifier?: string;
  /** API company_id (when provided) */
  company_id?: string;
  /** Display name */
  name: string;
};

type CompaniesApiItem = {
  id?: unknown;
  identifier?: unknown;
  company_identifier?: unknown;
  company_id?: unknown;
  name?: unknown;
};

function coerceCompaniesList(res: unknown): CompaniesApiItem[] {
  if (Array.isArray(res)) return res as CompaniesApiItem[];
  if (!res || typeof res !== "object") return [];

  const obj = res as { results?: unknown; data?: unknown };
  if (Array.isArray(obj.results)) return obj.results as CompaniesApiItem[];
  if (Array.isArray(obj.data)) return obj.data as CompaniesApiItem[];
  return [];
}

function normalizeCompanyId(v: unknown): string {
  const s = typeof v === "string" || typeof v === "number" ? String(v) : "";
  return s.trim();
}

/**
 * Normalizes a "companies" API response (or array) into a consistent option list.
 * Handles common shapes: array, `{ results: [] }`, `{ data: [] }`.
 */
export function normalizeCompaniesResponse(
  res: unknown,
  options?: Readonly<{ prefer?: "identifier" | "company_id" }>,
): CompanyOption[] {
  const list = coerceCompaniesList(res);
  const out: CompanyOption[] = [];
  const prefer = options?.prefer ?? "identifier";

  for (const item of list) {
    if (!item) continue;
    const identifier = normalizeCompanyId(
      item.identifier ?? item.company_identifier ?? item.company_id,
    );
    const company_id = normalizeCompanyId(
      item.id ?? item.company_identifier ?? item.identifier ?? item.company_id,
    );
    const fallbackId = normalizeCompanyId(item.id);
    const id =
      prefer === "company_id"
        ? company_id || identifier || fallbackId
        : identifier || company_id || fallbackId;
    if (!id) continue;

    out.push({
      id,
      identifier: identifier || undefined,
      company_id: company_id || undefined,
      name: typeof item.name === "string" ? item.name : "",
    });
  }

  return out;
}
