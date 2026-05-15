export function resolveChatTenantIdFromSession(user: unknown): string {
  if (!user || typeof user !== "object") {
    return "";
  }
  const record = user as Record<string, unknown>;
  const candidates = [record.company_identifier, record.tenant_id, record.tenant];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return "";
}
