import React, { useMemo } from "react";
import moment from "moment";
import type { ToolbarConfig, FilterPill, TabConfig } from "@components/GenericTable";

export type CrmEntityType = "prospects" | "leads" | "deals" | "orders";

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
  onTabAdd: () => void;
  onTabRemove: (tabId: string) => void;
  tabsDropdownLabel: string;

  // Toolbar actions
  onFiltersClick: () => void;
  onExportClick: () => void;
  onEditColumnsClick: () => void;
  showImport?: boolean;
  onImportClick?: () => void;

  // View (table / board)
  currentTableView?: "table" | "board";
  onTableViewChange?: (view: "table" | "board") => void;

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
    onSearch,
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
    extensions,
    onPaginationReset,
    rightActions,
    stages = [],
    prospectsTabCountOverrides,
  } = options;

  const filterPills = useMemo((): FilterPill[] => {
    const pills: FilterPill[] = [];

    // Owner / Associate pill (all entities)
    const ownerLabel = entity === "prospects" || entity === "leads" || entity === "deals" || entity === "orders" ? "Owner" : "Associate with";
    const ownerFilterKey = entity === "prospects" ? "user_extension" : "assigned_to";

    const isOwnerArray = entity === "prospects";
    const hasOwnerFilter = isOwnerArray
      ? currentFilters.user_extension &&
        (Array.isArray(currentFilters.user_extension)
          ? currentFilters.user_extension.length > 0
          : true)
      : !!currentFilters.assigned_to;

    const ownerActiveLabel = (() => {
      if (entity === "prospects") {
        const extId = Array.isArray(currentFilters.user_extension)
          ? currentFilters.user_extension[0]
          : currentFilters.user_extension;
        if (!extId) return undefined;
        const ext = extensions.find((e: any) => (e.id || e.extension) === extId);
        return ext ? ext.display_name || ext.name || ext.extension : String(extId);
      }
      const extId = currentFilters.assigned_to;
      if (!extId) return undefined;
      const ext = extensions.find((e: any) => (e.id || e.extension) === extId);
      return ext ? ext.display_name || ext.name || ext.extension : String(extId);
    })();

    const clearOwner = () => {
      if (entity === "prospects") {
        handleFiltersChange({ ...currentFilters, user_extension: undefined });
      } else {
        handleFiltersChange({ ...currentFilters, assigned_to: undefined });
      }
      refresh();
    };

    pills.push({
      id: "contact_owner",
      label: ownerLabel,
      showDropdown: true,
      searchable: entity === "prospects" || entity === "leads" || entity === "deals" || entity === "orders",
      active: !!hasOwnerFilter,
      activeLabel: ownerActiveLabel,
      onClear: clearOwner,
      dropdownOptions: [
        {
          label: entity === "prospects" ? "All Owners" : "All Owners",
          value: "all",
          onClick: clearOwner,
        },
        ...extensions.map((ext) => ({
          label: ext.display_name || ext.name || ext.extension || String(ext.id ?? ext.extension ?? ""),
          value: String(ext.id ?? ext.extension),
          onClick: () => {
            if (entity === "prospects") {
              handleFiltersChange({
                ...currentFilters,
                user_extension: [ext.id || ext.extension],
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
    });

    // Create date pill (prospects, leads)
    if (entity === "prospects" || entity === "leads") {
      const fromKey = entity === "prospects" ? "created_at_from" : "date_from";
      const toKey = entity === "prospects" ? "created_at_to" : "date_to";
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

    // Last activity date pill (prospects only)
    if (entity === "prospects") {
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

  const resolvedTabs = useMemo((): TabConfig[] => {
    if (entity !== "prospects" || !prospectsTabCountOverrides) return tabs;
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

      showSearch: true,
      searchValue,
      searchPlaceholder,
      onSearchChange: (value: string) => {
        onSearchChange(value);
        if (!value) {
          handleFiltersChange({ ...currentFilters, search: undefined });
          refresh();
        }
      },
      onSearch: () => {
        if (searchValue) {
          handleFiltersChange({ ...currentFilters, search: searchValue });
          onPaginationReset?.();
          refresh();
        }
      },

      showTableViewDropdown: true,
      currentTableView,
      onTableViewChange,
      showEditColumns: true,
      onEditColumnsClick,
      showPipelineDropdown: false,
      pipelineLabel: "All Pipelines",
      showFiltersButton: true,
      onFiltersClick,
      showSortButton: true,
      showExportButton: true,
      onExportClick,
      showSaveButton: true,
      onSaveClick: () => {},

      filterPills,
      showAdvancedFilters: true,
      onAdvancedFiltersClick: onFiltersClick,

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
      onEditColumnsClick,
      onFiltersClick,
      onExportClick,
      filterPills,
      rightActions,
      currentFilters,
      handleFiltersChange,
      refresh,
      onSearchChange,
      onPaginationReset,
    ]
  );
}
