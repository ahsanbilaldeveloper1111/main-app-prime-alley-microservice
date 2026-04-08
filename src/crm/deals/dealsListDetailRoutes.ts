/** Builds the CRM deal detail page URL (list row / first-column navigation). */
export function buildCrmDealDetailPagePath(
  id: unknown,
  isApprovalsList: boolean,
): string {
  if (id == null || id === "") {
    return "/crm/deals";
  }
  const suffix = isApprovalsList ? "&approval=1" : "";
  return `/crm/detailspage?type=deal&id=${id}${suffix}`;
}
