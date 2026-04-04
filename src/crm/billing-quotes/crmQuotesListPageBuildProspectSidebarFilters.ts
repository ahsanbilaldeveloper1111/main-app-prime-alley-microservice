export function buildCrmQuotesListFiltersFromProspectsSidebar(
  prospectsSearch: string,
  prospectsFilters: Record<string, any>,
): Record<string, any> {
  const filtersToApply: Record<string, any> = {};

  if (prospectsSearch) {
    filtersToApply.search = prospectsSearch;
  }
  if (prospectsFilters.assignedTo) {
    filtersToApply.user_extension = [prospectsFilters.assignedTo];
  }
  if (prospectsFilters.campaigns) {
    filtersToApply.status = prospectsFilters.campaigns;
  }
  if (prospectsFilters.nextCallDateFrom) {
    filtersToApply.last_activity_date = prospectsFilters.nextCallDateFrom;
  }
  if (prospectsFilters.sourceFile) {
    filtersToApply.quote_owner = prospectsFilters.sourceFile;
  }
  if (prospectsFilters.tags) {
    filtersToApply.signing_status = prospectsFilters.tags;
  }

  return filtersToApply;
}
