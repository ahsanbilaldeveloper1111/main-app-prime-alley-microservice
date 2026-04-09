/** Resolves a primitive id for query strings (avoids `[object Object]` when callers pass a row object). */
function normalizeCrmDealDetailId(id: unknown): string | null {
  if (id == null || id === "") {
    return null;
  }
  if (typeof id === "string" || typeof id === "number" || typeof id === "bigint") {
    const s = String(id);
    return s === "" ? null : s;
  }
  if (typeof id === "object" && id !== null && "id" in id) {
    return normalizeCrmDealDetailId((id as { id?: unknown }).id);
  }
  return null;
}

/** Builds the CRM deal detail page URL (list row / first-column navigation). */
export function buildCrmDealDetailPagePath(
  id: unknown,
  isApprovalsList: boolean,
): string {
  const normalized = normalizeCrmDealDetailId(id);
  if (normalized == null) {
    return "/crm/deals";
  }
  const suffix = isApprovalsList ? "&approval=1" : "";
  return `/crm/detailspage?type=deal&id=${normalized}${suffix}`;
}
