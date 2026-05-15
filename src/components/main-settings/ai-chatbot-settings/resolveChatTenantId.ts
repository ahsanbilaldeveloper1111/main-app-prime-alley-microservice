export function resolveChatTenantIdFromSession(
  user: Record<string, unknown> | undefined,
): string {
  if (!user) return "";
  const candidates = [user.company_identifier, user.tenant_id, user.tenant];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}
