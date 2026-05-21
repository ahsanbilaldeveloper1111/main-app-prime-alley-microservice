import type { ChatCompanyOption } from "@page-modules/chat/useChatCompaniesQuery";

/** react-select option shape for chat company / tenant pickers (value and label are always strings). */
export type ChatCompanySelectOption = Readonly<{
  value: string;
  label: string;
}>;

function readTenantIdCandidate(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "";
}

/** Company list id for chat APIs (`tenant_id` query/body param). */
export function resolveTenantIdFromCompany(company: unknown): string {
  if (!company || typeof company !== "object") {
    return "";
  }
  const record = company as Record<string, unknown>;
  const candidates = [
    record.tenant_id,
    record.tenantId,
    record.identifier,
    record.company_identifier,
    record.id,
  ];
  for (const candidate of candidates) {
    const id = readTenantIdCandidate(candidate);
    if (id) return id;
  }
  return "";
}

/** Build typed react-select options; skips companies without a resolvable tenant id. */
export function mapChatCompaniesToSelectOptions(
  companies: readonly ChatCompanyOption[],
): ChatCompanySelectOption[] {
  return companies.flatMap((company) => {
    const value = resolveTenantIdFromCompany(company);
    if (!value) return [];
    return [{ value, label: company.name?.trim() || value }];
  });
}

export function findChatCompanySelectOption(
  companies: readonly ChatCompanyOption[],
  tenantId: string,
): ChatCompanySelectOption | null {
  const id = tenantId.trim();
  if (!id) return null;
  const match = companies.find((c) => resolveTenantIdFromCompany(c) === id);
  if (match) {
    return { value: id, label: match.name?.trim() || id };
  }
  return { value: id, label: id };
}

/** Resolve tenant display name from company list; falls back to tenant id. */
export function resolveTenantDisplayFromCompanies(
  tenantId: string,
  companies: readonly ChatCompanyOption[],
): Readonly<{ tenantId: string; tenantName: string }> {
  const id = tenantId.trim();
  if (!id) {
    return { tenantId: "", tenantName: "—" };
  }
  const match = companies.find((c) => resolveTenantIdFromCompany(c) === id);
  const tenantName = match?.name?.trim() || id;
  return { tenantId: id, tenantName };
}
