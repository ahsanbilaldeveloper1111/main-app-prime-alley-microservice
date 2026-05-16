export { resolveTenantIdFromCompany } from "@page-modules/chat/shared/chatCompanySelectOptions";

function readTenantIdCandidate(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "";
}

export function resolveChatTenantIdFromSession(user: unknown): string {
  if (!user || typeof user !== "object") {
    return "";
  }
  const record = user as Record<string, unknown>;
  const candidates = [record.tenant_id, record.company_identifier, record.tenant];
  for (const candidate of candidates) {
    const id = readTenantIdCandidate(candidate);
    if (id) return id;
  }
  return "";
}
