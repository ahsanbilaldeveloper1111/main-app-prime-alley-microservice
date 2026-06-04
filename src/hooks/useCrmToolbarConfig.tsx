import React, { useCallback, useMemo } from "react";
import moment from "moment";
import type { ToolbarConfig, FilterPill, TabConfig } from "@components/GenericTable";
import { normalizeSearchQuery } from "@utils/Helper";

export type CrmEntityType =
  | "prospects"
  | "contacts"
  | "leads"
  | "deals"
  | "orders"
  | "approvals";

function isProspectsLikeEntity(entity: CrmEntityType): boolean {
  return entity === "prospects" || entity === "contacts";
}

function getProspectsLikeOwnerFilterValue(
  entity: CrmEntityType,
  filters: Record<string, any>,
): unknown {
  if (entity === "prospects" || entity === "contacts") {
    return filters.user_extension_filter;
  }
  return filters.user_extension;
}

function shouldUseOwnerLabel(entity: CrmEntityType): boolean {
  return (
    isProspectsLikeEntity(entity) ||
    entity === "leads" ||
    entity === "deals" ||
    entity === "orders" ||
    entity === "approvals"
  );
}

function getOwnerFilterKey(entity: CrmEntityType): "user_extension_filter" | "user_extension" {
  return entity === "prospects" || entity === "contacts"
    ? "user_extension_filter"
    : "user_extension";
}

function hasProspectsLikeOwnerFilter(value: unknown): boolean {
  if (!value) {
    return false;
  }
  if (!Array.isArray(value)) {
    return true;
  }
  return value.length > 0;
}

/** Safe display when no extension row matches; avoids String(object) → "[object Object]". */
function extensionIdToFallbackLabel(extensionId: unknown): string {
  if (
    typeof extensionId === "string" ||
    typeof extensionId === "number" ||
    typeof extensionId === "boolean" ||
    typeof extensionId === "bigint"
  ) {
    return String(extensionId);
  }
  if (extensionId !== null && typeof extensionId === "object") {
    const record = extensionId as Record<string, unknown>;
    for (const key of ["id", "value", "extension"] as const) {
      const v = record[key];
      if (typeof v === "string" || typeof v === "number") {
        return String(v);
      }
    }
  }
  return "";
}

function findExtensionLabel(
  extensionId: unknown,
  extensions: Array<{ id?: string; extension?: string; display_name?: string; name?: string }>,
): string | undefined {
  if (!extensionId) {
    return undefined;
  }
  const ext = extensions.find((item: any) => (item.id || item.extension) === extensionId);
  if (ext) {
    return ext.display_name || ext.name || ext.extension;
  }
  const fallback = extensionIdToFallbackLabel(extensionId);
  return fallback || undefined;
}

function getOwnerFilterValue(
  entity: CrmEntityType,
  prospectsLikeOwnerFilterValue: unknown,
  currentFilters: Record<string, any>,
): unknown {
  if (!isProspectsLikeEntity(entity)) {
    return currentFilters.assigned_to;
  }
  if (Array.isArray(prospectsLikeOwnerFilterValue)) {
    return prospectsLikeOwnerFilterValue[0];
  }
  return prospectsLikeOwnerFilterValue;
}

function buildOwnerPill({
  entity,
  currentFilters,
  extensions,
  handleFiltersChange,
  refresh,
}: {
  entity: CrmEntityType;
  currentFilters: Record<string, any>;
  extensions: Array<{ id?: string; extension?: string; display_name?: string; name?: string }>;
  handleFiltersChange: (filters: Record<string, any>) => void;
  refresh: () => void;
}): FilterPill {
  const ownerLabel = shouldUseOwnerLabel(entity) ? "Owner" : "Associate with";
  const isOwnerArray = isProspectsLikeEntity(entity);
  const prospectsLikeOwnerFilterValue = getProspectsLikeOwnerFilterValue(entity, currentFilters);
  const hasOwnerFilter = isOwnerArray
    ? hasProspectsLikeOwnerFilter(prospectsLikeOwnerFilterValue)
    : Boolean(currentFilters.assigned_to);
  const ownerFilterValue = getOwnerFilterValue(
    entity,
    prospectsLikeOwnerFilterValue,
    currentFilters,
  );
  const ownerActiveLabel = findExtensionLabel(ownerFilterValue, extensions);

  const clearOwner = () => {
    if (isProspectsLikeEntity(entity)) {
      const key = getOwnerFilterKey(entity);
      handleFiltersChange({
        ...currentFilters,
        [key]: undefined,
      });
    } else {
      handleFiltersChange({ ...currentFilters, assigned_to: undefined });
    }
    refresh();
  };

  return {
    id: "contact_owner",
    label: ownerLabel,
    showDropdown: true,
    searchable: shouldUseOwnerLabel(entity),
    active: !!hasOwnerFilter,
    activeLabel: ownerActiveLabel,
    onClear: clearOwner,
    dropdownOptions: [
      {
        label: "All Owners",
        value: "all",
        onClick: clearOwner,
      },
      ...extensions.map((ext) => ({
        label: ext.display_name || ext.name || ext.extension || String(ext.id ?? ext.extension ?? ""),
        value: String(ext.id ?? ext.extension),
        onClick: () => {
          if (isProspectsLikeEntity(entity)) {
            const key = getOwnerFilterKey(entity);
            handleFiltersChange({
              ...currentFilters,
              [key]: [ext.id || ext.extension],
            });
          } else {
            handleFiltersChange({
              ...currentFilters,
              assigned_to: ext.id || ext.extension,
            });
          }
          refresh();
        },
      })),
    ],
  };
}

export interface UseCrmToolbarConfigOptions {
  entity: CrmEntityType;

  // Search
  searchValue: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;

  // Filters state & handlers
  currentFilters: Record<string, any>;
  handleFiltersChange: (filters: Record<string, any>) => void;
  refresh: () => void;

  // Tabs
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: TabConfig[];
  onTabAdd?: () => void;
  onTabRemove: (tabId: string) => void;
  tabsDropdownLabel: string;

  // Toolbar actions — omit to use GenericTable default (toggle filter pills row)
  onFiltersClick?: () => void;
  onExportClick: () => void;
  onEditColumnsClick: () => void;
  showImport?: boolean;
  onImportClick?: () => void;

  // View (table / board)
  currentTableView?: "table" | "board";
  onTableViewChange?: (view: "table" | "board") => void;
  /** When false, hides the table/board (or legacy table/grid/list) toolbar dropdown. Defaults to true. */
  showTableViewDropdown?: boolean;

  /** When false, hides the toolbar search field. Default true (CRM). */
  showSearch?: boolean;
  /** When false, hides Export in the toolbar. Default true (CRM). */
  showExportButton?: boolean;
  /** When false, hides Save in the toolbar. Default true (CRM legacy). */
  showSaveButton?: boolean;

  // Owner/assignee pill – extensions list
  extensions: Array<{ id?: string; extension?: string; display_name?: string; name?: string }>;

  // Optional: reset pagination to page 1 (used when applying search in some pages)
  onPaginationReset?: () => void;

  // Optional: right-aligned custom actions (e.g. Add prospects, Add Lead)
  rightActions?: React.ReactNode;

  // Entity-specific (leads): stages for Lead Stage pill
  stages?: Array<{ id: number | string; name: string }>;

  // Entity-specific (prospects): for has_leads tab count when active
  prospectsTabCountOverrides?: {
    loading?: boolean;
    totalRecords?: number;
    activeFilter?: string;
  };
}

function getDateRangeLabel(
  fromKey: string,
  toKey: string,
  filters: Record<string, any>
): string | undefined {
  const from = filters[fromKey];
  const to = filters[toKey];
  if (!from && !to) return undefined;
  const today = moment().format("YYYY-MM-DD");
  if (from === today && to === today) return "Today";
  const weekStart = moment().subtract(7, "days").format("YYYY-MM-DD");
  if (from === weekStart && to === today) return "Last 7 Days";
  const monthStart = moment().subtract(30, "days").format("YYYY-MM-DD");
  if (from === monthStart && to === today) return "Last 30 Days";
  return "Custom";
}

function buildDatePillDropdownOptions(
  fromKey: string,
  toKey: string,
  currentFilters: Record<string, any>,
  handleFiltersChange: (f: Record<string, any>) => void,
  refresh: () => void
): FilterPill["dropdownOptions"] {
  const clearDates = () => {
    const next = { ...currentFilters };
    delete next[fromKey];
    delete next[toKey];
    handleFiltersChange(next);
    refresh();
  };
  const today = moment().format("YYYY-MM-DD");
  return [
    { label: "All Time", value: "all", onClick: clearDates },
    {
      label: "Today",
      value: "today",
      onClick: () => {
        handleFiltersChange({ ...currentFilters, [fromKey]: today, [toKey]: today });
        refresh();
      },
    },
    {
      label: "Last 7 Days",
      value: "week",
      onClick: () => {
        const from = moment().subtract(7, "days").format("YYYY-MM-DD");
        const to = moment().format("YYYY-MM-DD");
        handleFiltersChange({ ...currentFilters, [fromKey]: from, [toKey]: to });
        refresh();
      },
    },
    {
      label: "Last 30 Days",
      value: "month",
      onClick: () => {
        const from = moment().subtract(30, "days").format("YYYY-MM-DD");
        const to = moment().format("YYYY-MM-DD");
        handleFiltersChange({ ...currentFilters, [fromKey]: from, [toKey]: to });
        refresh();
      },
    },
  ];
}

export function useCrmToolbarConfig(
  options: UseCrmToolbarConfigOptions
): ToolbarConfig {
  const {
    entity,
    searchValue,
    searchPlaceholder,
    onSearchChange,
    currentFilters,
    handleFiltersChange,
    refresh,
    activeTab,
    onTabChange,
    tabs,
    onTabAdd,
    onTabRemove,
    tabsDropdownLabel,
    onFiltersClick,
    onExportClick,
    onEditColumnsClick,
    showImport = false,
    onImportClick,
    currentTableView,
    onTableViewChange,
    showTableViewDropdown = true,
    showSearch = true,
    showExportButton = true,
    showSaveButton = true,
    extensions,
    onPaginationReset,
    rightActions,
    stages = [],
    prospectsTabCountOverrides,
  } = options;

  const filterPills = useMemo((): FilterPill[] => {
    const pills: FilterPill[] = [];

    pills.push(
      buildOwnerPill({
        entity,
        currentFilters,
        extensions,
        handleFiltersChange,
        refresh,
      }),
    );

    // Create date pill (prospects, contacts, leads)
    if (isProspectsLikeEntity(entity) || entity === "leads") {
      const fromKey = isProspectsLikeEntity(entity)
        ? "created_at_from"
        : "date_from";
      const toKey = isProspectsLikeEntity(entity)
        ? "created_at_to"
        : "date_to";
      const hasDate = !!(currentFilters[fromKey] || currentFilters[toKey]);
      pills.push({
        id: "create_date",
        label: "Create date",
        showDropdown: true,
        active: hasDate,
        activeLabel: getDateRangeLabel(fromKey, toKey, currentFilters),
        onClear: () => {
          handleFiltersChange({
            ...currentFilters,
            [fromKey]: undefined,
            [toKey]: undefined,
          });
          refresh();
        },
        dropdownOptions: buildDatePillDropdownOptions(
          fromKey,
          toKey,
          currentFilters,
          handleFiltersChange,
          refresh
        ),
      });
    }

    // Last activity date pill (prospects / contacts)
    if (isProspectsLikeEntity(entity)) {
      const fromKey = "last_called_at_from";
      const toKey = "last_called_at_to";
      const hasDate = !!(currentFilters[fromKey] || currentFilters[toKey]);
      pills.push({
        id: "last_activity",
        label: "Last activity date",
        showDropdown: true,
        active: hasDate,
        activeLabel: getDateRangeLabel(fromKey, toKey, currentFilters),
        onClear: () => {
          handleFiltersChange({
            ...currentFilters,
            [fromKey]: undefined,
            [toKey]: undefined,
          });
          refresh();
        },
        dropdownOptions: buildDatePillDropdownOptions(
          fromKey,
          toKey,
          currentFilters,
          handleFiltersChange,
          refresh
        ),
      });
    }

    // Lead Stage pill (leads only)
    if (entity === "leads" && stages.length > 0) {
      const hasStage = !!currentFilters.stage_id;
      const stageActiveLabel = hasStage
        ? (() => {
            const stageId = currentFilters.stage_id;
            const stage = stages.find((s) => String(s.id) === String(stageId));
            return stage ? stage.name : String(stageId);
          })()
        : undefined;
      pills.push({
        id: "lead_stage",
        label: "Lead Stage",
        showDropdown: true,
        active: hasStage,
        activeLabel: stageActiveLabel,
        onClear: () => {
          handleFiltersChange({ ...currentFilters, stage_id: undefined });
          refresh();
        },
        dropdownOptions: [
          {
            label: "All Stages",
            value: "all",
            onClick: () => {
              handleFiltersChange({ ...currentFilters, stage_id: undefined });
              refresh();
            },
          },
          ...stages.map((stage) => ({
            label: stage.name,
            value: String(stage.id),
            onClick: () => {
              handleFiltersChange({
                ...currentFilters,
                stage_id: String(stage.id),
              });
              refresh();
            },
          })),
        ],
      });
    }

    // Lead Potential pill (leads only)
    if (entity === "leads") {
      const hasPotential = !!currentFilters.lead_potential;
      const potentialActiveLabel = hasPotential
        ? String(currentFilters.lead_potential)
        : undefined;
      const options: NonNullable<FilterPill["dropdownOptions"]> = [
        {
          label: "All Potential",
          value: "all",
          onClick: () => {
            handleFiltersChange({ ...currentFilters, lead_potential: undefined });
            refresh();
          },
        },
        ...["Hot", "Warm", "Cold"].map((p) => ({
          label: p,
          value: p,
          onClick: () => {
            handleFiltersChange({ ...currentFilters, lead_potential: p });
            refresh();
          },
        })),
      ];
      pills.push({
        id: "lead_potential",
        label: "Lead Potential",
        showDropdown: true,
        active: hasPotential,
        activeLabel: potentialActiveLabel,
        onClear: () => {
          handleFiltersChange({ ...currentFilters, lead_potential: undefined });
          refresh();
        },
        dropdownOptions: options,
      });
    }

    return pills;
  }, [
    entity,
    currentFilters,
    handleFiltersChange,
    refresh,
    extensions,
    stages,
  ]);

  const clearAllFilters = useCallback(() => {
    handleFiltersChange({});
    refresh();
  }, [handleFiltersChange, refresh]);

  const resolvedTabs = useMemo((): TabConfig[] => {
    if (!isProspectsLikeEntity(entity) || !prospectsTabCountOverrides) return tabs;
    const { loading, totalRecords, activeFilter } = prospectsTabCountOverrides;
    return tabs.map((tab) => {
      if (tab.id === "has_leads" && activeFilter === "has_leads" && !loading && totalRecords != null) {
        return { ...tab, count: totalRecords };
      }
      return tab;
    });
  }, [entity, tabs, prospectsTabCountOverrides]);

  return useMemo(
    (): ToolbarConfig => ({
      showTabs: true,
      showImport,
      onImportClick: onImportClick ?? (() => {}),
      tabsDropdownLabel,
      tabs: resolvedTabs,
      activeTab,
      onTabChange,
      onTabAdd,
      onTabRemove,

      showSearch,
      searchValue,
      searchPlaceholder,
      onSearchChange: (value: string) => {
        onSearchChange(value);
        const q = normalizeSearchQuery(value);
        if (!q) {
          handleFiltersChange({ ...currentFilters, search: undefined });
          refresh();
          return;
        }
        handleFiltersChange({ ...currentFilters, search: q });
        onPaginationReset?.();
        refresh();
      },
      onSearch: () => {
        const q = normalizeSearchQuery(searchValue);
        onSearchChange(q);
        if (q) {
          handleFiltersChange({ ...currentFilters, search: q });
          onPaginationReset?.();
        } else {
          handleFiltersChange({ ...currentFilters, search: undefined });
        }
        refresh();
      },

      showTableViewDropdown,
      currentTableView,
      onTableViewChange,
      showEditColumns: true,
      onEditColumnsClick,
      showPipelineDropdown: false,
      pipelineLabel: "All Pipelines",
      showFiltersButton: true,
      ...(onFiltersClick ? { onFiltersClick } : {}),
      showSortButton: true,
      showExportButton,
      onExportClick,
      showSaveButton,
      onSaveClick: () => {},

      filterPills,
      clearAllFilters,
      showAdvancedFilters: true,
      ...(onFiltersClick ? { onAdvancedFiltersClick: onFiltersClick } : {}),

      rightActions,
    }),
    [
      showImport,
      onImportClick,
      tabsDropdownLabel,
      resolvedTabs,
      activeTab,
      onTabChange,
      onTabAdd,
      onTabRemove,
      searchValue,
      searchPlaceholder,
      currentTableView,
      onTableViewChange,
      showTableViewDropdown,
      showSearch,
      showExportButton,
      showSaveButton,
      onEditColumnsClick,
      onFiltersClick,
      onExportClick,
      filterPills,
      clearAllFilters,
      rightActions,
      currentFilters,
      handleFiltersChange,
      refresh,
      onSearchChange,
      onPaginationReset,
    ]
  );
}
