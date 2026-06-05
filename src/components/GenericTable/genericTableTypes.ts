import type React from "react";

export interface TabConfig {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  removable?: boolean;
}

export interface FilterPill {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  showDropdown?: boolean;
  searchable?: boolean;
  dropdownContent?:
    | React.ReactNode
    | ((context: { closeMenu: () => void }) => React.ReactNode);
  active?: boolean;
  activeLabel?: string;
  activeLabelOnly?: boolean;
  onClear?: () => void;
  multiSelect?: boolean;
  onSelectAll?: () => void;
  selectAllLabel?: string;
  dropdownOptions?: Array<{
    label: string;
    value: string;
    selected?: boolean;
    onClick?: () => void;
  }>;
  dropdownMenuStyle?: React.CSSProperties;
}

export interface ToolbarTabsDropdownItem {
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export interface ToolbarConfig {
  showSearch?: boolean;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  onSearch?: () => void;
  searchDebounceMs?: number;
  showTabs?: boolean;
  tabs?: TabConfig[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onTabAdd?: () => void;
  onTabRemove?: (tabId: string) => void;
  tabsDropdownLabel?: string;
  tabsDropdownItems?: ToolbarTabsDropdownItem[];
  showViewSwitcher?: boolean;
  currentView?: "table" | "grid" | "list";
  onViewChange?: (view: "table" | "grid" | "list") => void;
  showEditColumns?: boolean;
  onEditColumnsClick?: () => void;
  showFiltersButton?: boolean;
  actionsAfterFilters?: React.ReactNode;
  onFiltersClick?: () => void;
  showFilterPills?: boolean;
  filterPills?: FilterPill[];
  clearAllFilters?: () => void;
  showMoreFiltersButton?: boolean;
  showAdvancedFilters?: boolean;
  onAdvancedFiltersClick?: () => void;
  advancedFiltersOpen?: boolean;
  advancedFiltersContent?: React.ReactNode;
  filterPillsRightActions?: React.ReactNode;
  showSortButton?: boolean;
  onSortClick?: () => void;
  showExportButton?: boolean;
  onExportClick?: () => void;
  showSaveButton?: boolean;
  onSaveClick?: () => void;
  customActions?: React.ReactNode;
  rightActions?: React.ReactNode;
  showTableViewDropdown?: boolean;
  tableViewLabel?: string;
  onTableViewClick?: () => void;
  currentTableView?: "table" | "board";
  onTableViewChange?: (view: "table" | "board") => void;
  showPipelineDropdown?: boolean;
  pipelineLabel?: string;
  onPipelineClick?: () => void;
  showImport?: boolean;
  onImportClick?: () => void;
  toolbarSettingsPath?: string;
}
