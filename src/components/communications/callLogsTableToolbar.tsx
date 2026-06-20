import type { Dispatch, SetStateAction } from "react";
import type { ToolbarConfig } from "@components/GenericTable";
import {
  buildDateTimeFilterPill,
  buildCallDirectionFilterPill,
  buildCallStatusFilterPill,
  buildDepartmentFilterPill,
  buildExtensionMultiSelectFilterPill,
  buildCalledNumbersFilterPill,
} from "@utils/communicationsFilterPills";
import {
  createCalledNumbersDropdownContent,
  createDateTimeDropdownContent,
} from "@utils/communicationsFilterDropdowns";
import type { StageFiltersFn } from "@utils/communicationsFilterStaging";
import { renderApplyFilterActions } from "@utils/communicationsStagedFilters";
import { formatFilterDateTimeLabel } from "@utils/communicationsDateUtils";
import {
  CALL_LOGS_TOOLBAR,
  COMMUNICATIONS_TABS_DROPDOWN_ITEMS,
} from "@components/communications/callLogsListPageConfig";

export interface CallLogsTablePaginationState {
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
  pageSizeOptions: number[];
}

export interface BuildCallLogsTableToolbarParams {
  canExportCallLogs: boolean;
  searchDraft: string;
  setSearchDraft: (value: string) => void;
  applySearch: (value: string) => void;
  tablePaginationRowsPerPage: number;
  setTablePagination: Dispatch<SetStateAction<CallLogsTablePaginationState>>;
  fetchCallLogs: (
    page?: number,
    perPage?: number,
    search?: string,
  ) => Promise<unknown>;
  currentFilters: Record<string, unknown>;
  stageFilters: StageFiltersFn;
  extensionOptionsSelectedFirst: unknown[];
  hierarchyDataDepartments: unknown[];
  handleExport: () => void | Promise<void>;
  handleApplyFiltersClick: () => void;
  handleResetFiltersClick: () => void;
  hasUnappliedFilterChanges: boolean;
  /** Total records for the active tab badge (prospects `All prospects` count). */
  allTabCount?: number;
}

export function buildCallLogsTableToolbar({
  canExportCallLogs,
  searchDraft,
  setSearchDraft,
  applySearch,
  tablePaginationRowsPerPage,
  setTablePagination,
  fetchCallLogs,
  currentFilters,
  stageFilters,
  extensionOptionsSelectedFirst,
  hierarchyDataDepartments,
  handleExport,
  handleApplyFiltersClick,
  handleResetFiltersClick,
  hasUnappliedFilterChanges,
  allTabCount,
}: BuildCallLogsTableToolbarParams): ToolbarConfig {
  return {
    clearAllFilters: handleResetFiltersClick,
    showTabs: true,
    tabsDropdownLabel: CALL_LOGS_TOOLBAR.tabsDropdownLabel,
    tabsDropdownItems: COMMUNICATIONS_TABS_DROPDOWN_ITEMS,
    tabs: [
      {
        id: "all",
        label: CALL_LOGS_TOOLBAR.allTabLabel,
        count: allTabCount,
        removable: false,
      },
    ],
    activeTab: "all",
    onTabChange: () => {},
    showSearch: true,
    searchValue: searchDraft,
    searchPlaceholder: CALL_LOGS_TOOLBAR.searchPlaceholder,
    onSearchChange: (value: string) => setSearchDraft(value),
    onSearch: () => {
      const trimmed = searchDraft.trim();
      applySearch(trimmed);
      setTablePagination((prev) => ({ ...prev, currentPage: 1 }));
      fetchCallLogs(1, tablePaginationRowsPerPage, trimmed);
    },
    showFiltersButton: true,
    showSortButton: true,
    showAdvancedFilters: true,
    showExportButton: canExportCallLogs,
    onExportClick: () => {
      void handleExport();
    },
    showMoreFiltersButton: false,
    filterPills: [
      buildCallDirectionFilterPill(currentFilters, stageFilters),
      buildCallStatusFilterPill(currentFilters, stageFilters),
      {
        id: "traffic_type",
        label: "Traffic Type",
        showDropdown: true,
        active: Boolean(currentFilters.traffic_type),
        activeLabel: (currentFilters.traffic_type as string) || undefined,
        onClear: () =>
          stageFilters((prev) => ({ ...prev, traffic_type: "" })),
        dropdownOptions: [
          {
            label: "Internal",
            value: "internal",
            onClick: () =>
              stageFilters((prev) => ({ ...prev, traffic_type: "internal" })),
          },
          {
            label: "External",
            value: "external",
            onClick: () =>
              stageFilters((prev) => ({ ...prev, traffic_type: "external" })),
          },
          {
            label: "All",
            value: "",
            onClick: () =>
              stageFilters((prev) => ({ ...prev, traffic_type: "" })),
          },
        ],
      },
      {
        id: "destination_type",
        label: "Destination Type",
        showDropdown: true,
        active: Boolean(currentFilters.destination_type),
        activeLabel: (currentFilters.destination_type as string) || undefined,
        onClear: () =>
          stageFilters((prev) => ({ ...prev, destination_type: "" })),
        dropdownOptions: [
          {
            label: "Local",
            value: "local",
            onClick: () =>
              stageFilters((prev) => ({
                ...prev,
                destination_type: "local",
              })),
          },
          {
            label: "National",
            value: "national",
            onClick: () =>
              stageFilters((prev) => ({
                ...prev,
                destination_type: "national",
              })),
          },
          {
            label: "International",
            value: "international",
            onClick: () =>
              stageFilters((prev) => ({
                ...prev,
                destination_type: "international",
              })),
          },
          {
            label: "All",
            value: "",
            onClick: () =>
              stageFilters((prev) => ({ ...prev, destination_type: "" })),
          },
        ],
      },
      buildExtensionMultiSelectFilterPill(
        extensionOptionsSelectedFirst as { id?: unknown; name?: unknown }[],
        currentFilters,
        stageFilters,
      ),
      buildDepartmentFilterPill(
        hierarchyDataDepartments as { id?: unknown; name?: unknown }[],
        currentFilters,
        stageFilters,
      ),
      buildCalledNumbersFilterPill(
        currentFilters,
        stageFilters,
        createCalledNumbersDropdownContent,
      ),
      buildDateTimeFilterPill(
        "start_datetime",
        "Start Date & Time",
        currentFilters,
        stageFilters,
        formatFilterDateTimeLabel,
        createDateTimeDropdownContent,
        { clearable: false },
      ),
      buildDateTimeFilterPill(
        "end_datetime",
        "End Date & Time",
        currentFilters,
        stageFilters,
        formatFilterDateTimeLabel,
        createDateTimeDropdownContent,
        { clearable: false },
      ),
    ],
    filterPillsRightActions: renderApplyFilterActions(
      hasUnappliedFilterChanges,
      handleApplyFiltersClick,
      "call-logs",
    ),
  };
}
