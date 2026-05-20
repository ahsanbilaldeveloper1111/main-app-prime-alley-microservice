import type { FilterPill } from "@components/GenericTable";
import { getCrmDataCounts } from "@utils/crm";
import { persistVisibleColumnKeys } from "@utils/crmListVisibleColumnsStorage";
import type { CrmProspectsContactsListPageConfig } from "@crm/shared/crmProspectsContactsListPageConfig";
import { normalizeSearchQuery } from "@utils/Helper";

/**
 * True when the prospects list matches the default “full directory” view: All tab,
 * no toolbar search, no advanced sidebar filters, and no metric-widget-driven filters.
 * Used to snapshot `total_all_records` for the “All Prospects” stat and toolbar count.
 */
export function isProspectsUnfilteredBaselineListContext(args: {
  activeFilter: string;
  search: string;
  currentFilters: Record<string, unknown>;
  hasAdvancedFiltersApplied: boolean;
}): boolean {
  const { activeFilter, search, currentFilters, hasAdvancedFiltersApplied } = args;
  if (activeFilter !== "all") {
    return false;
  }
  if (hasAdvancedFiltersApplied) {
    return false;
  }
  if (normalizeSearchQuery(search)) {
    return false;
  }
  if (currentFilters.scheduled_call_from) {
    return false;
  }
  if (currentFilters.scheduled_call_to) {
    return false;
  }
  if (currentFilters.scheduled_call_status) {
    return false;
  }
  if (currentFilters.last_called_at_from || currentFilters.last_called_at_to) {
    return false;
  }
  if (currentFilters.has_scheduled_calls === true) {
    return false;
  }
  if (currentFilters.has_scheduled_calls === false) {
    return false;
  }
  if (currentFilters.has_tickets === true) {
    return false;
  }
  return true;
}

type AssignmentFiltersForCounts = {
  selectedCampaigns: ReadonlyArray<{ value: string }> | Set<{ value: string }>;
  selectedTags: ReadonlyArray<{ value: string }> | Set<{ value: string }>;
};

export async function fetchCrmProspectsEntryCountsForFilters(
  assignmentFilters: AssignmentFiltersForCounts,
): Promise<{ total: number; assigned: number; unassigned: number }> {
  try {
    const campaignIds = Array.from(assignmentFilters.selectedCampaigns).map(
      (campaign) => Number.parseInt(campaign.value, 10),
    );
    const tags = Array.from(assignmentFilters.selectedTags).map(
      (tag) => tag.value,
    );
    const counts = await getCrmDataCounts(campaignIds, tags);
    return {
      total: counts.summary.total_records,
      assigned: counts.summary.assigned_records,
      unassigned: counts.summary.unassigned_records,
    };
  } catch (error) {
    console.error("Failed to get entry counts:", error);
    return { total: 5000, assigned: 2000, unassigned: 3000 };
  }
}

export type ProspectsContactsPageFiltersState = {
  assignedTo: string | null;
  campaigns: string[] | null;
  nextCallDateFrom: string | null;
  nextCallDateTo: string | null;
  sourceFile: string | null;
  tags: string[] | null;
};

export function getProspectsContactsDeleteModalItemName(
  deleteModalMode: "single" | "bulk" | null,
  itemToDelete: { id: number } | null,
  selectedCount: number,
  copy: CrmProspectsContactsListPageConfig["deleteModalCopy"],
): string | undefined {
  if (deleteModalMode === "single" && itemToDelete) {
    return `${copy.singleNamePrefix} #${itemToDelete.id}`;
  }
  if (deleteModalMode === "bulk") {
    return `${selectedCount} ${copy.bulkSelectedLabel}`;
  }
  return undefined;
}

export function buildProspectsContactsAppliedFiltersPayload(
  prospectsSearch: string,
  prospectsFilters: ProspectsContactsPageFiltersState,
): Record<string, unknown> {
  const filtersToApply: Record<string, unknown> = {};
  if (prospectsSearch) {
    filtersToApply.search = prospectsSearch;
  }
  if (prospectsFilters.assignedTo) {
    filtersToApply.user_extension_filter = [prospectsFilters.assignedTo];
  }
  if (prospectsFilters.campaigns && prospectsFilters.campaigns.length > 0) {
    filtersToApply.campaign_id = prospectsFilters.campaigns;
  }
  if (prospectsFilters.sourceFile) {
    filtersToApply.source_file = prospectsFilters.sourceFile;
  }
  if (prospectsFilters.tags && prospectsFilters.tags.length > 0) {
    filtersToApply.tags = prospectsFilters.tags;
  }
  if (prospectsFilters.nextCallDateFrom) {
    filtersToApply.scheduled_call_from = prospectsFilters.nextCallDateFrom;
  }
  if (prospectsFilters.nextCallDateTo) {
    filtersToApply.scheduled_call_to = prospectsFilters.nextCallDateTo;
  }
  return filtersToApply;
}

export function mergeCrmProspectsToolbarFilterPills(
  basePills: FilterPill[] | undefined,
  showAdvancedFilterPills: boolean,
  advancedFilterPills: FilterPill[],
): FilterPill[] {
  return [
    ...(basePills ?? []),
    ...(showAdvancedFilterPills ? advancedFilterPills : []),
  ];
}

export function resetActiveFilterIfRemovedTabMatches(
  tabId: string,
  activeFilter: string,
  handleFilterChange: (id: string) => void,
): void {
  if (activeFilter !== tabId) return;
  handleFilterChange("all");
}

export function persistCrmProspectsContactsSelectedColumns(
  storageKey: string,
  keys: string[],
): void {
  persistVisibleColumnKeys(storageKey, keys);
}
