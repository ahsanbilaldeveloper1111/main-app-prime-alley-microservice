import type { Dispatch, SetStateAction } from "react";
import type { ToolbarConfig } from "@components/GenericTable";
import {
  buildDateTimeFilterPill,
  buildCallDirectionFilterPill,
  buildCallStatusFilterPill,
  buildDepartmentFilterPill,
  buildExtensionMultiSelectFilterPill,
  buildTextDropdownFilterPill,
} from "@utils/communicationsFilterPills";
import {
  createDateTimeDropdownContent,
  createTextFilterDropdownContent,
} from "@utils/communicationsFilterDropdowns";
import {
  renderApplyResetFilterActions,
} from "@utils/communicationsStagedFilters";
import { formatFilterDateTimeLabel } from "@utils/communicationsDateUtils";

export interface CallLogsTablePaginationState {
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
  pageSizeOptions: number[];
}

export interface BuildCallLogsTableToolbarParams {
  canExportCallLogs: boolean;
  searchValue: string;
  setSearchValue: (value: string) => void;
  tablePaginationRowsPerPage: number;
  setTablePagination: Dispatch<SetStateAction<CallLogsTablePaginationState>>;
  fetchCallLogs: (
    page?: number,
    perPage?: number,
    search?: string,
  ) => Promise<unknown>;
  currentFilters: Record<string, unknown>;
  stageFilters: (next: Record<string, unknown>) => void;
  setCurrentFilters: (filters: Record<string, unknown>) => void;
  extensionOptionsSelectedFirst: unknown[];
  hierarchyDataDepartments: unknown[];
  handleExport: () => void | Promise<void>;
  handleApplyFiltersClick: () => void;
  handleResetFiltersClick: () => void;
  hasUnappliedFilterChanges: boolean;
  hasNonDefaultFilters: boolean;
}

export function buildCallLogsTableToolbar({
  canExportCallLogs,
  searchValue,
  setSearchValue,
  tablePaginationRowsPerPage,
  setTablePagination,
  fetchCallLogs,
  currentFilters,
  stageFilters,
  setCurrentFilters,
  extensionOptionsSelectedFirst,
  hierarchyDataDepartments,
  handleExport,
  handleApplyFiltersClick,
  handleResetFiltersClick,
  hasUnappliedFilterChanges,
  hasNonDefaultFilters,
}: BuildCallLogsTableToolbarParams): ToolbarConfig {
  return {
    showTabs: true,
    tabs: [
      {
        id: "call-logs-title",
        label: "Call Logs",
        removable: false,
      },
    ],
    activeTab: "call-logs-title",
    onTabChange: () => {},
    showSearch: true,
    searchValue,
    searchPlaceholder: "Search by username, extension, phone...",
    onSearchChange: (value: string) => setSearchValue(value),
    onSearch: () => {
      setTablePagination((prev) => ({ ...prev, currentPage: 1 }));
      fetchCallLogs(1, tablePaginationRowsPerPage, searchValue.trim());
    },
    showFiltersButton: true,
    showExportButton: canExportCallLogs,
    onExportClick: () => {
      void handleExport();
    },
    showFilterPills: true,
    showMoreFiltersButton: false,
    filterPills: [
      buildCallDirectionFilterPill(currentFilters as any, stageFilters as any),
      buildCallStatusFilterPill(currentFilters as any, stageFilters as any),
      {
        id: "traffic_type",
        label: "Traffic Type",
        showDropdown: true,
        active: Boolean(currentFilters.traffic_type),
        activeLabel: (currentFilters.traffic_type as string) || undefined,
        onClear: () =>
          stageFilters({ ...currentFilters, traffic_type: "" }),
        dropdownOptions: [
          {
            label: "Internal",
            value: "internal",
            onClick: () =>
              stageFilters({ ...currentFilters, traffic_type: "internal" }),
          },
          {
            label: "External",
            value: "external",
            onClick: () =>
              stageFilters({ ...currentFilters, traffic_type: "external" }),
          },
          {
            label: "All",
            value: "",
            onClick: () =>
              stageFilters({ ...currentFilters, traffic_type: "" }),
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
          stageFilters({ ...currentFilters, destination_type: "" }),
        dropdownOptions: [
          {
            label: "Local",
            value: "local",
            onClick: () =>
              stageFilters({ ...currentFilters, destination_type: "local" }),
          },
          {
            label: "National",
            value: "national",
            onClick: () =>
              stageFilters({
                ...currentFilters,
                destination_type: "national",
              }),
          },
          {
            label: "International",
            value: "international",
            onClick: () =>
              stageFilters({
                ...currentFilters,
                destination_type: "international",
              }),
          },
          {
            label: "All",
            value: "",
            onClick: () =>
              stageFilters({ ...currentFilters, destination_type: "" }),
          },
        ],
      },
      buildExtensionMultiSelectFilterPill(
        extensionOptionsSelectedFirst as any[],
        currentFilters as any,
        stageFilters as any,
      ),
      buildDepartmentFilterPill(
        hierarchyDataDepartments as any[],
        currentFilters as any,
        stageFilters as any,
      ),
      buildTextDropdownFilterPill(
        "phone_number",
        "Numbers",
        currentFilters as any,
        setCurrentFilters as any,
        stageFilters as any,
        createTextFilterDropdownContent,
        "Enter number",
      ),
      buildDateTimeFilterPill(
        "start_datetime",
        "Start Date & Time",
        currentFilters as any,
        setCurrentFilters as any,
        stageFilters as any,
        formatFilterDateTimeLabel,
        createDateTimeDropdownContent,
      ),
      buildDateTimeFilterPill(
        "end_datetime",
        "End Date & Time",
        currentFilters as any,
        setCurrentFilters as any,
        stageFilters as any,
        formatFilterDateTimeLabel,
        createDateTimeDropdownContent,
      ),
    ],
    filterPillsRightActions: renderApplyResetFilterActions(
      hasNonDefaultFilters,
      hasUnappliedFilterChanges,
      handleResetFiltersClick,
      handleApplyFiltersClick,
      "call-logs",
    ),
  };
}
