import type { ReactNode } from "react";
import type { FilterPill, TabConfig, ToolbarConfig } from "@components/GenericTable";
import { renderApplyFilterActions } from "@utils/communicationsStagedFilters";

const CRM_TICKETS_SEARCH_DEBOUNCE_MS = 400;

export interface BuildCrmTicketsTableToolbarParams {
  searchValue: string;
  onSearchChange: (value: string) => void;
  ticketTabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  filterPills: FilterPill[];
  handleApplyFiltersClick: () => void;
  handleResetFiltersClick: () => void;
  hasUnappliedFilterChanges: boolean;
  rightActions: ReactNode;
}

export function buildCrmTicketsTableToolbar({
  searchValue,
  onSearchChange,
  ticketTabs,
  activeTab,
  onTabChange,
  filterPills,
  handleApplyFiltersClick,
  handleResetFiltersClick,
  hasUnappliedFilterChanges,
  rightActions,
}: BuildCrmTicketsTableToolbarParams): ToolbarConfig {
  return {
    clearAllFilters: handleResetFiltersClick,
    showSearch: true,
    searchValue,
    searchPlaceholder: "Search tickets...",
    onSearchChange,
    searchDebounceMs: CRM_TICKETS_SEARCH_DEBOUNCE_MS,
    onSearch: () => {},
    showTabs: true,
    tabs: ticketTabs,
    activeTab,
    onTabChange,
    tabsDropdownLabel: "Tickets",
    showFilterPills: true,
    showMoreFiltersButton: false,
    filterPills,
    filterPillsRightActions: renderApplyFilterActions(
      hasUnappliedFilterChanges,
      handleApplyFiltersClick,
      "crm-tickets",
    ),
    showImport: false,
    rightActions,
  };
}
