import React, { useState, useMemo, useRef, useEffect, useId } from "react";
import {
  Table,
  Form,
  Button,
  Dropdown,
  Card,
  InputGroup,
} from "react-bootstrap";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Layers,
  Search,
  X,
  Plus,
  Filter,
  MoreVertical,
  Menu,
} from "lucide-react";
import "@assets/css/GenericTable.css";
import StatsCards, { StatsCardData } from "@components/GenericStatsCards";
import { useRouter } from "next/router";
import { sanitizeSearchInputLive } from "@utils/Helper";

const ACTION_COLUMN_KEY = "actions";

// Type definitions
export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";

  // Data rendering types
  type?:
    | "text"
    | "badge"
    | "avatar"
    | "multi-field"
    | "date"
    | "phone"
    | "custom";

  // For custom rendering (fallback)
  render?: (row: T, index: number) => React.ReactNode;

  // For avatar type
  avatar?: {
    getInitials?: (row: T) => string;
    getColor?: (row: T) => string;
  };

  // For badge type
  badge?: {
    getVariant?: (
      row: T,
    ) =>
      | "primary"
      | "secondary"
      | "success"
      | "danger"
      | "warning"
      | "info"
      | "dark"
      | "light";
    getColor?: (row: T) => string; // For custom color
    showDot?: (row: T) => boolean; // For status badges with dot indicator
  };

  // For multi-field type
  fields?: {
    primary: string; // Key for primary field
    secondary?: string; // Key for secondary field
    secondaryClass?: string; // CSS class for secondary
  };

  // For date formatting
  dateFormat?: string;

  // For empty values
  emptyValue?: string | React.ReactNode;

  // Data accessor (if different from key)
  accessor?: (row: T) => any;

  /** Optional `<th>` width (e.g. `"260px"` or `"22%"`) for fixed-width columns like descriptions. */
  width?: string;
}

export interface DropdownOption<T = any> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  show?: (row: T) => boolean;
  className?: string;
  divider?: boolean; // Add divider after this option
}

/** Options visible for a row (same rule as row actions and context menu). */
export function getVisibleDropdownOptions<T>(
  options: DropdownOption<T>[],
  row: T,
): DropdownOption<T>[] {
  return options.filter((o) => !o.show || o.show(row));
}

export interface TableAction<T = any> {
  label: string;
  icon?: React.ReactNode;
  onClick?: (row: T) => void;
  variant?: string;
  className?: string;
  show?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  /** Tooltip text when the action is disabled */
  disabledTitle?: string;
  /** Class name applied when the action is disabled */
  disabledClassName?: string;
  render?: (row: T) => React.ReactNode; // For custom action rendering like dropdowns

  // Dropdown configuration
  dropdown?: {
    options: DropdownOption<T>[];
    align?: "start" | "end";
    toggleVariant?: string;
    toggleClassName?: string;
  };
}

/** Row context menu entry (onClick receives the row). Shared by the table and Kanban card menu. */
export type TableContextMenuItem<T = unknown> = {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  divider?: boolean;
  className?: string;
  disabled?: boolean;
  disabledTitle?: string;
  disabledClassName?: string;
};

/** Bound row actions for Kanban / custom surfaces (no row argument). */
export interface BoundTableContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  divider?: boolean;
  className?: string;
  disabled?: boolean;
  disabledTitle?: string;
  disabledClassName?: string;
}

export function buildTableContextMenuItems<T>(
  actions: TableAction<T>[],
  row: T,
): TableContextMenuItem<T>[] {
  const items: TableContextMenuItem<T>[] = [];
  for (const action of actions) {
    if (action.show && !action.show(row)) continue;
    if (action.dropdown) {
      const opts = getVisibleDropdownOptions(action.dropdown.options, row);
      for (const o of opts) {
        items.push({
          label: o.label,
          icon: o.icon,
          onClick: o.onClick,
          divider: o.divider ?? false,
          className: o.className,
        });
      }
    } else if (action.onClick && !action.render) {
      const isDisabled = action.disabled?.(row);
      items.push({
        label: action.label,
        icon: action.icon,
        onClick: action.onClick,
        divider: false,
        className: isDisabled
          ? action.disabledClassName || "text-muted"
          : action.className,
        disabled: isDisabled,
        disabledTitle: action.disabledTitle,
        disabledClassName: action.disabledClassName,
      });
    }
  }
  return items;
}

export function buildBoundTableContextMenuItems<T>(
  actions: TableAction<T>[],
  row: T,
): BoundTableContextMenuItem[] {
  return buildTableContextMenuItems(actions, row).map((item) => ({
    label: item.label,
    icon: item.icon,
    onClick: () => item.onClick(row),
    divider: item.divider,
    className: item.className,
    disabled: item.disabled,
    disabledTitle: item.disabledTitle,
    disabledClassName: item.disabledClassName,
  }));
}

/** One row in `gt-context-menu`; `onClick` is a bound handler (no row argument). */
export type GtContextMenuItemRow = BoundTableContextMenuItem;

/** Shared markup for context menu rows (GenericTable right‑click + Kanban card menu). */
export const GtContextMenuItemList: React.FC<{
  items: GtContextMenuItemRow[];
  onClose: () => void;
}> = ({ items, onClose }) => (
  <>
    {items.map((item, idx) => (
      <React.Fragment
        key={`${item.label}-${idx}-${item.className ?? ""}`}
      >
        {item.disabled && item.disabledTitle ? (
          <span
            className="gt-context-menu-disabled-wrapper"
            title={item.disabledTitle}
          >
            <button
              type="button"
              className={`gt-context-menu-item ${item.className || ""}`}
              disabled
              onClick={(e) => e.stopPropagation()}
              role="menuitem"
            >
              {item.icon && (
                <span className="gt-context-menu-icon">{item.icon}</span>
              )}
              {item.label}
            </button>
          </span>
        ) : (
          <button
            type="button"
            className={`gt-context-menu-item ${item.className || ""}`}
            disabled={item.disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            role="menuitem"
            title={item.disabled ? item.disabledTitle : undefined}
          >
            {item.icon && (
              <span className="gt-context-menu-icon">{item.icon}</span>
            )}
            {item.label}
          </button>
        )}
        {item.divider && <div className="gt-context-menu-divider" />}
      </React.Fragment>
    ))}
  </>
);

export interface PaginationConfig {
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
  pageSizeOptions?: number[];
}

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
  /** Custom dropdown content (use instead of `dropdownOptions` when you need rich controls). */
  dropdownContent?:
    | React.ReactNode
    | ((context: { closeMenu: () => void }) => React.ReactNode);
  /** When true, pill is shown as active (filter applied) */
  active?: boolean;
  /** When filter is applied, show this label (e.g. selected owner name, "Today", "Hot Lead") */
  activeLabel?: string;
  /** When true and activeLabel exists, show only the activeLabel instead of `label: activeLabel`. */
  activeLabelOnly?: boolean;
  /** When filter is active, called when the clear (X) icon is clicked to remove the filter */
  onClear?: () => void;
  dropdownOptions?: Array<{
    label: string;
    value: string;
    onClick?: () => void;
  }>;
}

export interface ToolbarConfig {
  // Search
  showSearch?: boolean;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  onSearch?: () => void;

  // Tabs
  showTabs?: boolean;
  tabs?: TabConfig[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onTabAdd?: () => void;
  onTabRemove?: (tabId: string) => void;
  tabsDropdownLabel?: string;

  // View controls
  showViewSwitcher?: boolean;
  currentView?: "table" | "grid" | "list";
  onViewChange?: (view: "table" | "grid" | "list") => void;

  // Edit columns
  showEditColumns?: boolean;
  onEditColumnsClick?: () => void;

  // Filters
  showFiltersButton?: boolean;
  onFiltersClick?: () => void;
  showFilterPills?: boolean;
  filterPills?: FilterPill[];
  /** Controls whether the "+ More" pill is rendered in the filter pills row (defaults to true). */
  showMoreFiltersButton?: boolean;
  showAdvancedFilters?: boolean;
  onAdvancedFiltersClick?: () => void;
  /** When true, shows `advancedFiltersContent` inline beneath the filter pills row. */
  advancedFiltersOpen?: boolean;
  /** Inline advanced filters panel content (rendered when `advancedFiltersOpen` is true). */
  advancedFiltersContent?: React.ReactNode;

  // Sort
  showSortButton?: boolean;
  onSortClick?: () => void;

  // Export
  showExportButton?: boolean;
  onExportClick?: () => void;

  // Save
  showSaveButton?: boolean;
  onSaveClick?: () => void;

  // Custom actions
  customActions?: React.ReactNode;
  rightActions?: React.ReactNode; // Right-aligned custom actions (e.g., Add Contacts button)

  // Table view dropdown
  showTableViewDropdown?: boolean;
  tableViewLabel?: string;
  onTableViewClick?: () => void;
  /** When set, dropdown shows only "Table view" and "Board View"; label = current, menu = other option only */
  currentTableView?: "table" | "board";
  onTableViewChange?: (view: "table" | "board") => void;

  // Pipelines/Groups dropdown
  showPipelineDropdown?: boolean;
  pipelineLabel?: string;
  onPipelineClick?: () => void;

  showImport?: boolean;
  onImportClick?: () => void;
}

export interface GenericTableProps<T = any> {
  // Data
  data: T[];
  columns: TableColumn<T>[];

  // Pagination
  pagination?: PaginationConfig;
  onPaginationChange?: (page: number, rowsPerPage: number) => void;

  // Sorting
  sortable?: boolean;
  defaultSortColumn?: string;
  defaultSortDirection?: "asc" | "desc";
  onSort?: (column: string, direction: "asc" | "desc") => void;

  // Actions
  actions?: TableAction<T>[];
  showActions?: boolean;
  actionsLabel?: string;

  // Selection
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (selected: T[]) => void;

  // Column customization
  customizableColumns?: boolean;
  /** When provided, column selection is controlled by the parent (e.g. from ColumnEditorModal) */
  selectedColumns?: string[];
  defaultSelectedColumns?: string[];
  onColumnChange?: (selectedColumns: string[]) => void;
  columnStorageKey?: string;

  // Row interactions
  onRowClick?: (row: T, index: number) => void;
  onRowDoubleClick?: (row: T, index: number) => void;
  onPreviewClick?: (row: T, index: number) => void; // Preview button click handler
  onFirstColumnClick?: (row: T, index: number) => void; // First column click handler
  rowClassName?: (row: T, index: number) => string;

  // Styling
  striped?: boolean;
  hover?: boolean;
  bordered?: boolean;
  size?: "sm" | "md" | "lg";

  // Loading & Empty states
  loading?: boolean;
  emptyMessage?: string | React.ReactNode;
  loadingMessage?: string | React.ReactNode;

  // Toolbar configuration
  toolbar?: ToolbarConfig;
  showToolbar?: boolean;

  // Misc
  uniqueKey?: string; // Key to use for row key (default: 'id')

  // Fixed height mode
  fixedHeight?: boolean; // Enable fixed height with scrollable body
  maxHeight?: string; // Max height for the table body (e.g., 'calc(100vh - 300px)')

  // Stats cards
  statsCards?: StatsCardData[]; // Stats cards data to display above table
  metricsGridMinWidth?: string; // Grid min width for metrics cards layout
  
  // Hide toolbar actions (three dots menu)
  showToolbarActions?: boolean;
  
  // Remove border from table card
  noBorder?: boolean;

  /** When provided (e.g. when currentTableView === 'board'), render this instead of the table */
  customBody?: React.ReactNode;
}

function safeStringifyValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean" || typeof val === "bigint") return String(val);
  try {
    return JSON.stringify(val);
  } catch {
    return "";
  }
}

function truncateGtText(text: string | number, maxLength = 20): string {
  const str = String(text ?? "");
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

function parseStoredColumnKeys(raw: string | null, defaults: string[]): string[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const keys = parsed.filter((c): c is string => typeof c === "string");
    const allowed = new Set(defaults);
    return keys.filter((key) => allowed.has(key));
  } catch {
    return null;
  }
}

type GenericTableContextMenuItem<T extends Record<string, any>> = {
  reactKey: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  divider?: boolean;
  className?: string;
  disabled?: boolean;
  disabledTitle?: string;
  disabledClassName?: string;
};

function buildContextMenuItemsForRow<T extends Record<string, any>>(
  tableActions: TableAction<T>[],
  row: T,
): GenericTableContextMenuItem<T>[] {
  const items: GenericTableContextMenuItem<T>[] = [];
  let seq = 0;

  for (const action of tableActions) {
    if (action.show && !action.show(row)) continue;
    if (action.dropdown) {
      const opts = action.dropdown.options.filter((o) => !o.show || o.show(row));
      for (const o of opts) {
        items.push({
          reactKey: `gt-ctxm-${seq++}-${action.label}-${o.label}`,
          label: o.label,
          icon: o.icon,
          onClick: o.onClick,
          divider: o.divider ?? false,
          className: o.className,
        });
      }
    } else if (action.onClick && !action.render) {
      const isDisabled = action.disabled?.(row);
      items.push({
        reactKey: `gt-ctxm-${seq++}-${action.label}`,
        label: action.label,
        icon: action.icon,
        onClick: action.onClick,
        divider: false,
        className: isDisabled
          ? action.disabledClassName || "text-muted"
          : action.className,
        disabled: isDisabled,
        disabledTitle: action.disabledTitle,
        disabledClassName: action.disabledClassName,
      });
    }
  }
  return items;
}

function renderGenericTableCellContent<T extends Record<string, any>>(
  column: TableColumn<T>,
  row: T,
  index: number,
): React.ReactNode {
  if (column.render) {
    return column.render(row, index);
  }
  const getValue = (): unknown => {
    if (column.accessor) return column.accessor(row);
    return row[column.key as keyof T];
  };
  const value = getValue();

  if (value === null || value === undefined || value === "") {
    return <span className="gt-empty-cell">{column.emptyValue || "--"}</span>;
  }

  switch (column.type) {
    case "avatar": {
      const name = safeStringifyValue(value);
      const displayName = truncateGtText(name, 20);
      const initials =
        column.avatar?.getInitials?.(row) ||
        name.slice(0, 2).toUpperCase();
      const bgColor = column.avatar?.getColor?.(row) || "#6c757d";
      return (
        <div className="gt-name-cell" title={name}>
          <div className="gt-avatar" style={{ backgroundColor: bgColor }}>
            {initials}
          </div>
          <span className="gt-name-text">{displayName}</span>
        </div>
      );
    }
    case "badge": {
      const badgeText = safeStringifyValue(value);
      const truncatedBadgeText = truncateGtText(badgeText, 20);
      const badgeVariant = column.badge?.getVariant?.(row) || "secondary";
      const badgeColor = column.badge?.getColor?.(row);
      const showDot = column.badge?.showDot?.(row) ?? false;
      const badgeClass = showDot
        ? `gt-status-badge gt-badge-${badgeVariant}`
        : `gt-badge gt-badge-${badgeVariant}`;
      return (
        <span
          className={badgeClass}
          style={badgeColor ? { backgroundColor: badgeColor } : undefined}
          title={badgeText}
        >
          {showDot && <span className="gt-status-dot"></span>}
          {truncatedBadgeText}
        </span>
      );
    }
    case "multi-field": {
      if (!column.fields) {
        return <span className="gt-text">{safeStringifyValue(value)}</span>;
      }
      const primaryValue = String(row[column.fields.primary as keyof T] || "");
      const secondaryValue = column.fields.secondary
        ? String(row[column.fields.secondary as keyof T] || "")
        : null;
      const truncatedPrimary = truncateGtText(primaryValue, 20);
      const truncatedSecondary = secondaryValue
        ? truncateGtText(secondaryValue, 20)
        : null;
      const multiTitleSecondary = secondaryValue ? `\n${secondaryValue}` : "";
      const multiTitle = `${primaryValue}${multiTitleSecondary}`;
      return (
        <div
          className="gt-company-cell"
          title={multiTitle}
        >
          <div className="gt-company-name gt-text">
            {truncatedPrimary || column.emptyValue || "--"}
          </div>
          {truncatedSecondary && (
            <div
              className={column.fields.secondaryClass || "gt-company-industry"}
            >
              {truncatedSecondary}
            </div>
          )}
        </div>
      );
    }
    case "phone":
      return value as React.ReactNode;
    case "date": {
      const dateText = safeStringifyValue(value);
      const truncatedDate = truncateGtText(dateText, 20);
      return (
        <span className="gt-text" title={dateText}>
          {truncatedDate}
        </span>
      );
    }
    case "text":
    default: {
      const textValue = safeStringifyValue(value);
      const truncatedText = truncateGtText(textValue, 20);
      return (
        <span className="gt-text" title={textValue}>
          {truncatedText}
        </span>
      );
    }
  }
}

function filterPillOptionsForQuery(
  pill: FilterPill,
  filterPillSearch: Record<string, string>,
): NonNullable<FilterPill["dropdownOptions"]> {
  const opts = pill.dropdownOptions ?? [];
  if (opts.length === 0) return [];
  const q = (filterPillSearch[pill.id] ?? "").trim().toLowerCase();
  if (!pill.searchable || q.length === 0) return opts;
  return opts.filter(
    (o) =>
      (o.label ?? "").toLowerCase().includes(q) ||
      String(o.value ?? "").toLowerCase().includes(q),
  );
}

function GenericTableFilterPillMenuBody({
  pill,
  filterPillSearch,
  setFilterPillSearch,
  closeMenu,
}: Readonly<{
  pill: FilterPill;
  filterPillSearch: Record<string, string>;
  setFilterPillSearch: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  closeMenu: () => void;
}>) {
  if (pill.dropdownContent) {
    return (
      <div className="px-2 py-2">
        {typeof pill.dropdownContent === "function"
          ? pill.dropdownContent({ closeMenu })
          : pill.dropdownContent}
      </div>
    );
  }

  const hasOptions = Boolean(
    pill.dropdownOptions && pill.dropdownOptions.length > 0,
  );
  const optionsToShow = hasOptions
    ? filterPillOptionsForQuery(pill, filterPillSearch)
    : [];

  const clearPillQuery = () => {
    setFilterPillSearch((prev) => ({ ...prev, [pill.id]: "" }));
  };

  return (
    <>
      {pill.searchable && hasOptions && (
        <div className="px-2 pb-2">
          <Form.Control
            size="sm"
            type="text"
            placeholder="Search..."
            value={filterPillSearch[pill.id] ?? ""}
            onChange={(e) =>
              setFilterPillSearch((prev) => ({
                ...prev,
                [pill.id]: e.target.value,
              }))
            }
            autoFocus
          />
        </div>
      )}
      {hasOptions ? (
        optionsToShow.map((option) => (
          <Dropdown.Item
            key={`${pill.id}:${option.value}:${option.label}`}
            onClick={() => {
              (option.onClick || pill.onClick)?.();
              clearPillQuery();
              closeMenu();
            }}
          >
            {option.label}
          </Dropdown.Item>
        ))
      ) : (
        <>
          <Dropdown.Item onClick={() => { pill.onClick?.(); closeMenu(); }}>All</Dropdown.Item>
          <Dropdown.Item onClick={() => { pill.onClick?.(); closeMenu(); }}>Active</Dropdown.Item>
          <Dropdown.Item onClick={() => { pill.onClick?.(); closeMenu(); }}>Inactive</Dropdown.Item>
        </>
      )}
    </>
  );
}

function GenericTableFirstColumnTrigger({
  children,
  onActivate,
}: Readonly<{
  children: React.ReactNode;
  onActivate: () => void;
}>) {
  return (
    <button
      type="button"
      className="gt-first-column-trigger"
      onClick={(e) => {
        e.stopPropagation();
        onActivate();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onActivate();
        }
      }}
    >
      {children}
    </button>
  );
}

const GT_PREVIEW_BUTTON_STYLE: React.CSSProperties = {
  position: "absolute",
  right: "8px",
  top: "50%",
  transform: "translateY(-50%)",
  fontSize: "12px",
  padding: "4px 10px",
  zIndex: 10,
  whiteSpace: "nowrap",
  backgroundColor: "#ffffff",
  border: "1px solid #141414",
  color: "#141414",
  fontWeight: "300",
  borderRadius: "4px",
  cursor: "pointer",
};

function GenericTableBodyDataCell<T extends Record<string, any>>({
  col,
  row,
  index,
  colIdx,
  onFirstColumnClick,
  onPreviewClick,
  hoveredRowIndex,
}: Readonly<{
  col: TableColumn<T>;
  row: T;
  index: number;
  colIdx: number;
  onFirstColumnClick?: (row: T, index: number) => void;
  onPreviewClick?: (row: T, index: number) => void;
  hoveredRowIndex: number | null;
}>) {
  const cellContent = renderGenericTableCellContent(col, row, index);
  const firstColumnClickable =
    colIdx === 0 && onFirstColumnClick !== undefined;

  return (
    <td
      className="generic-table-td"
      style={{
        textAlign: col.align || "left",
        position: colIdx === 0 ? "relative" : undefined,
      }}
    >
      {firstColumnClickable ? (
        <GenericTableFirstColumnTrigger
          onActivate={() => onFirstColumnClick?.(row, index)}
        >
          {cellContent}
        </GenericTableFirstColumnTrigger>
      ) : (
        cellContent
      )}
      {colIdx === 0 &&
        hoveredRowIndex === index &&
        onPreviewClick !== undefined && (
          <button
            type="button"
            className="preview-button"
            onClick={(e) => {
              e.stopPropagation();
              onPreviewClick(row, index);
            }}
            style={GT_PREVIEW_BUTTON_STYLE}
          >
            Preview
          </button>
        )}
    </td>
  );
}

function GenericTableRowActionsCell<T extends Record<string, any>>({
  row,
  rowStableKey,
  actions,
}: Readonly<{
  row: T;
  rowStableKey: string;
  actions: TableAction<T>[];
}>) {
  return (
    <>
      {actions.map((action, actionIndex) => {
        if (action.show && !action.show(row)) return null;
        const actionStableKey = `gt-act-${rowStableKey}-${action.label}`;

        if (action.render) {
          return (
            <React.Fragment key={actionStableKey}>
              {action.render(row)}
            </React.Fragment>
          );
        }

        if (action.dropdown) {
          const visibleOptions = action.dropdown.options.filter(
            (option) => !option.show || option.show(row),
          );

          if (visibleOptions.length === 0) return null;

          return (
            <Dropdown key={actionStableKey} drop="down" align="end">
              <Dropdown.Toggle
                variant={action.variant || "link"}
                size="sm"
                className={action.className || ""}
                id={`dropdown-${rowStableKey}-${action.label}`}
              >
                {action.icon}
              </Dropdown.Toggle>
              <Dropdown.Menu
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
              >
                {visibleOptions.map((option, optionIndex) => {
                  const optKey = `${actionStableKey}-opt-${option.label}`;
                  const menuItem = (
                    <Dropdown.Item
                      key={optKey}
                      onClick={(e) => {
                        e.stopPropagation();
                        option.onClick(row);
                      }}
                      className={option.className}
                    >
                      {option.icon && (
                        <span className="me-2">{option.icon}</span>
                      )}
                      {option.label}
                    </Dropdown.Item>
                  );

                  if (option.divider) {
                    return (
                      <React.Fragment key={`${optKey}-div`}>
                        {menuItem}
                        <Dropdown.Divider />
                      </React.Fragment>
                    );
                  }

                  return menuItem;
                })}
              </Dropdown.Menu>
            </Dropdown>
          );
        }

        const isDisabled = action.disabled?.(row);
        const buttonEl = (
          <Button
            key={actionStableKey}
            variant={action.variant || "link"}
            size="sm"
            disabled={isDisabled}
            onClick={(e) => {
              e.stopPropagation();
              if (isDisabled) {
                return;
              }
              action.onClick?.(row);
            }}
            className={`p-1 ${
              isDisabled
                ? `gt-action-disabled ${action.disabledClassName ?? ""}`
                : action.className || ""
            }`}
            title={isDisabled ? undefined : action.label}
          >
            {action.icon || action.label}
          </Button>
        );
        if (isDisabled && action.disabledTitle) {
          return (
            <span
              key={actionStableKey}
              className="gt-action-disabled-wrapper"
              title={action.disabledTitle}
            >
              {buttonEl}
            </span>
          );
        }
        return buttonEl;
      })}
    </>
  );
}

const GenericTable = <T extends Record<string, any>>({
  data,
  columns,
  pagination,
  onPaginationChange,
  sortable = true,
  defaultSortColumn = "",
  defaultSortDirection = "asc",
  onSort,
  actions = [],
  showActions = true,
  actionsLabel = "Actions",
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  customizableColumns = false,
  selectedColumns: selectedColumnsProp,
  defaultSelectedColumns,
  onColumnChange,
  columnStorageKey,
  onRowClick,
  onRowDoubleClick,
  onPreviewClick,
  onFirstColumnClick,
  rowClassName,
  striped = false,
  hover = true,
  bordered = false,
  size = "md",
  loading = false,
  emptyMessage = "No data available",
  loadingMessage = "Loading...",
  toolbar,
  showToolbar = false,
  uniqueKey = "id",
  fixedHeight = false,
  maxHeight = "calc(100vh - 300px)",
  statsCards,
  metricsGridMinWidth = "200px",
  showToolbarActions = true,
  noBorder = false,
  customBody,
}: GenericTableProps<T>) => {
  const router = useRouter();
  const columnCustomizerHeaderId = useId();
  const columnCustomizerPlaceholderId = useId();
  const columnCustomizerActionsHeaderId = useId();
  // Sorting state (synced from props when parent controls sort, e.g. server-side)
  const [sortColumn, setSortColumn] = useState(defaultSortColumn);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    defaultSortDirection,
  );
  const baseActionsEnabled = showActions && actions.length > 0;
  const allSelectableColumnKeys = useMemo(() => {
    const keys = columns.map((c) => c.key);
    if (baseActionsEnabled) keys.push(ACTION_COLUMN_KEY);
    return keys;
  }, [columns, baseActionsEnabled]);

  useEffect(() => {
    setSortColumn(defaultSortColumn);
    setSortDirection(defaultSortDirection);
  }, [defaultSortColumn, defaultSortDirection]);

  // Column selection state (uncontrolled when selectedColumns prop is not provided)
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => {
    if (selectedColumnsProp !== undefined) return selectedColumnsProp;
    const defaults = defaultSelectedColumns || allSelectableColumnKeys;
    if (columnStorageKey && globalThis.window !== undefined) {
      const stored = parseStoredColumnKeys(
        globalThis.localStorage.getItem(columnStorageKey),
        defaults,
      );
      if (stored) return stored;
    }
    return defaults.filter((key) => allSelectableColumnKeys.includes(key));
  });

  // Sync internal column selection when parent controls it (e.g. ColumnEditorModal apply)
  const effectiveSelectedColumns = selectedColumnsProp ?? selectedColumns;
  // Keep a stable master list for the selector so hidden columns stay re-selectable.
  const [columnCatalog, setColumnCatalog] = useState(columns);
  useEffect(() => {
    setColumnCatalog((prev) => {
      const mergedByKey = new Map(prev.map((col) => [col.key, col]));
      columns.forEach((col) => {
        mergedByKey.set(col.key, col);
      });
      return Array.from(mergedByKey.values());
    });
  }, [columns]);
  useEffect(() => {
    setSelectedColumns((prev) => {
      const source = selectedColumnsProp ?? prev;
      const next = source.filter((key) => allSelectableColumnKeys.includes(key));
      return next;
    });
  }, [allSelectableColumnKeys, selectedColumnsProp]);
  useEffect(() => {
    if (selectedColumnsProp !== undefined) {
      setSelectedColumns(
        selectedColumnsProp.filter((key) => allSelectableColumnKeys.includes(key)),
      );
    }
  }, [selectedColumnsProp, allSelectableColumnKeys]);
  const actionsColumnVisible =
    baseActionsEnabled &&
    (!customizableColumns || effectiveSelectedColumns.includes(ACTION_COLUMN_KEY));

  // Context menu (right‑click) state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    row: T;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Hover state for preview button
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);

  // Filter pills visibility state (hidden by default)
  const [showFilterPills, setShowFilterPills] = useState(
    toolbar?.showFilterPills ?? false,
  );

  // Metrics visibility state (hidden by default)
  const [showMetrics, setShowMetrics] = useState(false);
  const [openFilterPillId, setOpenFilterPillId] = useState<string | null>(null);
  const [filterPillSearch, setFilterPillSearch] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (toolbar?.showFilterPills !== undefined) {
      setShowFilterPills(toolbar.showFilterPills);
    }
  }, [toolbar?.showFilterPills]);

  const getContextMenuItems = useMemo(() => {
    return (row: T) => buildTableContextMenuItems(actions, row);
  }, [actions]);

  // Close context menu on outside click or Escape
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const onMouseDown = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      )
        close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [contextMenu]);

  // Filter visible columns (use effective so controlled parent updates apply)
  const visibleColumns = useMemo(() => {
    if (!customizableColumns) return columns;
    return columns.filter((col) => effectiveSelectedColumns.includes(col.key));
  }, [columns, effectiveSelectedColumns, customizableColumns]);

  /** No data columns and no actions column: still show the picker (e.g. optional row without actions). */
  const showColumnPickerPlaceholder =
    customizableColumns &&
    visibleColumns.length === 0 &&
    !actionsColumnVisible;

  // Sortable columns for toolbar Sort dropdown
  const sortableColumns = useMemo(
    () =>
      visibleColumns.filter(
        (col) => sortable && col.sortable !== false && col.key,
      ),
    [visibleColumns, sortable],
  );

  // Sort data (client-side if no onSort provided) — before selection handlers that depend on it
  const sortedData = useMemo(() => {
    if (onSort || !sortColumn) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn as keyof T] ?? "";
      const bVal = b[sortColumn as keyof T] ?? "";

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (aStr < bStr) return sortDirection === "asc" ? -1 : 1;
      if (aStr > bStr) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection, onSort]);

  // Check if a row is selected
  const isSelected = (row: T) => {
    return selectedRows.some(
      (selectedRow) =>
        selectedRow[uniqueKey as keyof T] === row[uniqueKey as keyof T],
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const branch = String(e.target.checked) as "true" | "false";
    const selectAllHandlers: Record<"true" | "false", () => void> = {
      true: () => onSelectionChange?.(sortedData),
      false: () => onSelectionChange?.([]),
    };
    selectAllHandlers[branch]();
  };

  const applyRowCheckboxChange = (
    row: T,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    e.stopPropagation();
    const branch = String(e.target.checked) as "true" | "false";
    const rowCheckboxHandlers: Record<"true" | "false", () => void> = {
      true: () => onSelectionChange?.([...selectedRows, row]),
      false: () =>
        onSelectionChange?.(
          selectedRows.filter(
            (r) => r[uniqueKey as keyof T] !== row[uniqueKey as keyof T],
          ),
        ),
    };
    rowCheckboxHandlers[branch]();
  };

  // Handle sorting
  const handleSort = (column: string) => {
    if (!sortable) return;

    const newDirection =
      sortColumn === column && sortDirection === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortDirection(newDirection);

    if (onSort) {
      onSort(column, newDirection);
    }
  };

  // Render sort icon
  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown size={14} className="ms-1 text-muted" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp size={14} className="ms-1" />
    ) : (
      <ArrowDown size={14} className="ms-1" />
    );
  };

  // Handle column selection (when controlled, parent updates via onColumnChange)
  const handleColumnToggle = (columnKey: string) => {
    const current = effectiveSelectedColumns;
    if (current.includes(columnKey) && current.length <= 1) {
      return;
    }
    const newSelected = current.includes(columnKey)
      ? current.filter((k) => k !== columnKey)
      : [...current, columnKey];

    setSelectedColumns(newSelected);
    if (columnStorageKey) {
      globalThis.localStorage.setItem(
        columnStorageKey,
        JSON.stringify(newSelected),
      );
    }
    if (onColumnChange) {
      onColumnChange(newSelected);
    }
  };

  /** Escape scroll/overflow parents (short tables clip `position: absolute` menus). */
  const columnSelectorMenuPopperConfig = useMemo(
    () => ({ strategy: "fixed" as const }),
    [],
  );

  const renderColumnCustomizerDropdown = (toggleId: string) => (
    <Dropdown
      align="end"
      autoClose="outside"
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
    >
      <Dropdown.Toggle
        variant="link"
        size="sm"
        className="d-inline-flex align-items-center p-1 text-secondary text-decoration-none border-0"
        id={toggleId}
        style={{ minWidth: "auto" }}
      >
        <Layers size={18} />
      </Dropdown.Toggle>
      <Dropdown.Menu
        align="end"
        className="column-selector-menu"
        popperConfig={columnSelectorMenuPopperConfig}
      >
        {columnCatalog.map((c) => (
          <Dropdown.Item key={c.key} as="div">
            <Form.Check
              type="checkbox"
              label={c.label || c.key}
              checked={effectiveSelectedColumns.includes(c.key)}
              onChange={() => handleColumnToggle(c.key)}
            />
          </Dropdown.Item>
        ))}
        {baseActionsEnabled && (
          <Dropdown.Item key={ACTION_COLUMN_KEY} as="div">
            <Form.Check
              type="checkbox"
              label={actionsLabel}
              checked={effectiveSelectedColumns.includes(ACTION_COLUMN_KEY)}
              onChange={() => handleColumnToggle(ACTION_COLUMN_KEY)}
            />
          </Dropdown.Item>
        )}
        <Dropdown.Divider />
        <Dropdown.Item
          onClick={() => {
            const allKeys = columnCatalog.map((c) => c.key);
            if (baseActionsEnabled && !allKeys.includes(ACTION_COLUMN_KEY)) {
              allKeys.push(ACTION_COLUMN_KEY);
            }
            if (selectedColumnsProp === undefined) setSelectedColumns(allKeys);
            if (columnStorageKey)
              globalThis.localStorage.setItem(
                columnStorageKey,
                JSON.stringify(allKeys),
              );
            if (onColumnChange) onColumnChange(allKeys);
          }}
        >
          Select All
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => {
            const defaultKeys =
              defaultSelectedColumns || columnCatalog.map((c) => c.key);
            if (selectedColumnsProp === undefined)
              setSelectedColumns(defaultKeys);
            if (columnStorageKey)
              globalThis.localStorage.setItem(
                columnStorageKey,
                JSON.stringify(defaultKeys),
              );
            if (onColumnChange) onColumnChange(defaultKeys);
          }}
        >
          Reset to Default
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );

  // Render toolbar
  const renderToolbar = () => {
    if (!showToolbar || !toolbar) return null;

    let tableViewToggleLabel: string = toolbar.tableViewLabel || "Table view";
    if (toolbar.currentTableView !== undefined) {
      tableViewToggleLabel =
        toolbar.currentTableView === "table" ? "Table view" : "Board View";
    }

    return (
      <div className="gt-toolbar-container">
        {/* Tabs Section */}
        {toolbar.showTabs && toolbar.tabs && toolbar.tabs.length > 0 && (
          <div className="gt-toolbar-tabs-section">
            <div className="d-flex align-items-center gap-3">
              {/* Dropdown (if provided) */}
              {toolbar.tabsDropdownLabel && (
                <Dropdown>
                  <Dropdown.Toggle
                    variant="outline-secondary"
                    size="sm"
                    className="gt-toolbar-dropdown"
                  >
                    <span>{toolbar.tabsDropdownLabel}</span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu style={{ zIndex: "99" }}>
                    <Dropdown.Item
                      onClick={() => router.push("/crm/prospects")}
                    >
                      Prospects
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => router.push("/crm/leads")}>
                      Leads
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => router.push("/crm/deals")}>
                      Deals
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => router.push("/crm/orders")}>
                      Orders
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => router.push("/crm/companies")}>
                      Company
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => router.push("/crm/inbox")}>
                      Inbox
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => router.push("/crm/approvals")}>
                      Approvals
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}

              {/* Tabs */}
              <div className="d-flex align-items-center gap-2">
                {toolbar.tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => toolbar.onTabChange?.(tab.id)}
                    className={`gt-tab-button ${
                      toolbar.activeTab === tab.id ? "active" : ""
                    }`}
                  >
                    {tab.icon && (
                      <span className="gt-tab-icon">{tab.icon}</span>
                    )}
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className="gt-tab-count">{tab.count}</span>
                    )}
                    {tab.removable && (
                      <button
                        className="gt-tab-close"
                        onClick={(e) => {
                          e.stopPropagation();
                          toolbar.onTabRemove?.(tab.id);
                        }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </button>
                ))}
                {toolbar.onTabAdd && (
                  <button
                    className="gt-tab-add-button"
                    onClick={toolbar.onTabAdd}
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>

              {/* Right-aligned custom actions (e.g., Add Contacts) */}
              {toolbar.rightActions && (
                <div style={{ marginLeft: "auto" }}>{toolbar.rightActions}</div>
              )}
            </div>
          </div>
        )}

        {/* Search and Toolbar Actions */}
        <div className="gt-toolbar-main">
          {/* Left: Search */}
          {toolbar.showSearch && (
            <div className="gt-toolbar-search">
              <InputGroup size="sm">
                <InputGroup.Text className="gt-search-icon">
                  <Search size={16} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder={toolbar.searchPlaceholder || "Search"}
                  value={toolbar.searchValue || ""}
                  onChange={(e) =>
                    toolbar.onSearchChange?.(
                      sanitizeSearchInputLive(e.target.value),
                    )
                  }
                  onPaste={(e) => {
                    const target = e.currentTarget;
                    globalThis.setTimeout(() => {
                      toolbar.onSearchChange?.(
                        sanitizeSearchInputLive(target.value),
                      );
                    }, 0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && toolbar.onSearch) {
                      toolbar.onSearch();
                    }
                  }}
                  className="gt-search-input"
                />
              </InputGroup>
            </div>
          )}

          {/* Right: Toolbar Actions */}
          <div className="gt-toolbar-actions">
            {/* Table View Dropdown */}
            {toolbar.showTableViewDropdown && (
              <Dropdown>
                <Dropdown.Toggle
                  variant="outline-secondary"
                  size="sm"
                  className="gt-toolbar-btn"
                >
                  <Menu size={16} className="me-1" />
                  <span>{tableViewToggleLabel}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {toolbar.currentTableView !== undefined &&
                  toolbar.onTableViewChange ? (
                    <>
                      {toolbar.currentTableView === "table" && (
                        <Dropdown.Item
                          onClick={() =>
                            toolbar.onTableViewChange?.("board")
                          }
                        >
                          Board View
                        </Dropdown.Item>
                      )}
                      {toolbar.currentTableView === "board" && (
                        <Dropdown.Item
                          onClick={() =>
                            toolbar.onTableViewChange?.("table")
                          }
                        >
                          Table view
                        </Dropdown.Item>
                      )}
                    </>
                  ) : (
                    <>
                      <Dropdown.Item onClick={toolbar.onTableViewClick}>
                        Table
                      </Dropdown.Item>
                      <Dropdown.Item>Grid</Dropdown.Item>
                      <Dropdown.Item>List</Dropdown.Item>
                    </>
                  )}
                </Dropdown.Menu>
              </Dropdown>
            )}

            {/* Edit Columns */}
            {toolbar.showEditColumns && (
              <Button
                variant="outline-secondary"
                size="sm"
                className="gt-toolbar-btn"
                onClick={toolbar.onEditColumnsClick}
              >
                Edit columns
              </Button>
            )}

            {/* Pipeline Dropdown */}
            {toolbar.showPipelineDropdown && (
              <Dropdown>
                <Dropdown.Toggle
                  variant="outline-secondary"
                  size="sm"
                  className="gt-toolbar-btn"
                >
                  <span>{toolbar.pipelineLabel || "All Pipelines"}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu onClick={toolbar.onPipelineClick}>
                  <Dropdown.Item>All Pipelines</Dropdown.Item>
                  <Dropdown.Item>Sales Pipeline</Dropdown.Item>
                  <Dropdown.Item>Marketing Pipeline</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}

            {/* Filters */}
            {toolbar.showFiltersButton && (
              <Button
                variant="outline-secondary"
                size="sm"
                className="gt-toolbar-btn"
                onClick={() => setShowFilterPills(!showFilterPills)}
              >
                Filters
              </Button>
            )}

            {/* Sort */}
            {toolbar.showSortButton &&
              (toolbar.onSortClick ? (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="gt-toolbar-btn"
                  onClick={toolbar.onSortClick}
                >
                  Sort
                </Button>
              ) : (
                <Dropdown align="end">
                  <Dropdown.Toggle
                    variant="outline-secondary"
                    size="sm"
                    className="gt-toolbar-btn"
                  >
                    Sort
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {sortableColumns.length === 0 ? (
                      <Dropdown.Item disabled>No sortable columns</Dropdown.Item>
                    ) : (
                      sortableColumns.map((col) => (
                        <Dropdown.Item
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                        >
                          {col.label}
                          {sortColumn === col.key &&
                            (sortDirection === "asc" ? " ↑" : " ↓")}
                        </Dropdown.Item>
                      ))
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              ))}

            {statsCards && statsCards.length > 0 && (
              <Button
                variant="outline-secondary"
                size="sm"
                className="gt-toolbar-btn"
                onClick={() => setShowMetrics(!showMetrics)}
              >
                Metrics
              </Button>
            )}

            {/* Export */}
            {toolbar.showExportButton && (
              <Button
                variant="outline-secondary"
                size="sm"
                className="gt-toolbar-btn"
                onClick={toolbar.onExportClick}
              >
                Export
              </Button>
            )}

            {/* Actions Menu */}
            {showToolbarActions && (
              <Dropdown>
                <Dropdown.Toggle
                  variant="outline-secondary"
                  size="sm"
                  className="gt-toolbar-btn gt-icon-btn"
                >
                  <MoreVertical size={16} />
                </Dropdown.Toggle>
                <Dropdown.Menu align="end">
                  {toolbar.showImport && (
                    <Dropdown.Item onClick={toolbar.onImportClick}>
                      Import
                    </Dropdown.Item>
                  )}
                  <Dropdown.Divider />
                  <Dropdown.Item
                    onClick={() => {
                      if (globalThis.window === undefined) {
                        router.push("/main-settings/smart-crm");
                        return;
                      }
                      const win = globalThis.open(
                        "/main-settings/smart-crm",
                        "_blank",
                        "noopener,noreferrer",
                      );
                      if (win != null) {
                        win.opener = null;
                      }
                    }}
                  >
                    Settings
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}

            {/* Custom Actions */}
            {toolbar.customActions}

            {/* Right-aligned actions (shown here when no tabs section is rendered) */}
            {(!toolbar.showTabs || !toolbar.tabs || toolbar.tabs.length === 0) &&
              toolbar.rightActions}
          </div>
        </div>

        {/* Filter Pills */}
        {showFilterPills &&
          toolbar.filterPills &&
          toolbar.filterPills.length > 0 && (
            <div className="gt-filter-pills">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {toolbar.filterPills.map((pill) =>
                  pill.showDropdown ? (
                    <Dropdown
                      key={pill.id}
                      show={openFilterPillId === pill.id}
                      onToggle={(nextShow) =>
                        setOpenFilterPillId(nextShow ? pill.id : null)
                      }
                    >
                      <Dropdown.Toggle
                        variant={pill.active ? "primary" : "outline-secondary"}
                        size="sm"
                        className={`gt-filter-pill${pill.active ? " gt-filter-pill-active" : ""}`}
                      >
                        {pill.icon && <span className="me-1">{pill.icon}</span>}
                        <span>
                          {pill.active && pill.activeLabel && pill.activeLabelOnly
                            ? pill.activeLabel
                            : pill.label}
                        </span>
                        {pill.active && pill.activeLabel && !pill.activeLabelOnly && (
                          <span className="gt-filter-pill-value">: {pill.activeLabel}</span>
                        )}
                        {pill.active && !pill.activeLabel && (
                          <span className="gt-filter-pill-dot" title="Filter applied" />
                        )}
                        {pill.active && pill.onClear && (
                          <button
                            type="button"
                            className="gt-filter-pill-clear"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              pill.onClear?.();
                            }}
                            title="Clear filter"
                            aria-label="Clear filter"
                          >
                            <X size={14} aria-hidden />
                          </button>
                        )}
                      </Dropdown.Toggle>
                      <Dropdown.Menu
                        style={{ maxHeight: "280px", overflowY: "auto" }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <GenericTableFilterPillMenuBody
                          pill={pill}
                          filterPillSearch={filterPillSearch}
                          setFilterPillSearch={setFilterPillSearch}
                          closeMenu={() => setOpenFilterPillId(null)}
                        />
                      </Dropdown.Menu>
                    </Dropdown>
                  ) : (
                    <button
                      key={pill.id}
                      className="gt-filter-pill"
                      onClick={pill.onClick}
                    >
                      {pill.icon && <span className="me-1">{pill.icon}</span>}
                      <span>{pill.label}</span>
                    </button>
                  ),
                )}
                {toolbar.showMoreFiltersButton !== false && (
                  <button className="gt-filter-pill-add">
                    <Plus size={14} className="me-1" />
                    <span>More</span>
                  </button>
                )}
                {toolbar.showAdvancedFilters && (
                  <button
                    className="gt-filter-pill-add"
                    onClick={toolbar.onAdvancedFiltersClick}
                  >
                    <Filter size={14} className="me-1" />
                    <span>Advanced filters</span>
                  </button>
                )}
              </div>
              {toolbar.advancedFiltersOpen && toolbar.advancedFiltersContent && (
                <div className="w-100 mt-2">{toolbar.advancedFiltersContent}</div>
              )}
            </div>
          )}

        {/* Stats Cards */}
        {showMetrics && statsCards && statsCards.length > 0 && (
          <div
            style={{
              paddingTop: "16px",
              paddingLeft: "25px",
              paddingRight: "25px",
              backgroundColor: "#ffffff",
              paddingBottom: "1px",
              borderLeft: "1px solid #cccccc",
              borderRight: "1px solid #cccccc",
            }}
          >
            <StatsCards data={statsCards} gridMinWidth={metricsGridMinWidth} />
          </div>
        )}
      </div>
    );
  };

  // Pagination controls
  const renderPaginationControls = () => {
    if (!pagination) return null;

    const {
      currentPage,
      rowsPerPage,
      totalRows,
      pageSizeOptions = [10, 25, 50, 100],
    } = pagination;
    const totalPages =
      totalRows === 0 ? 1 : Math.ceil(totalRows / rowsPerPage);
    const startRow =
      totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const endRow =
      totalRows === 0
        ? 0
        : Math.min(currentPage * rowsPerPage, totalRows);

    return (
      <div className="generic-table-pagination">
        <div className="pagination-info">
          <span className="text-muted small">Show</span>
          <Form.Select
            size="sm"
            value={rowsPerPage}
            onChange={(e) =>
              onPaginationChange?.(1, Number(e.target.value))
            }
            className="pagination-select"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Form.Select>
          <span className="text-muted small">entries</span>
        </div>

        <div className="text-muted small">
          Showing {startRow} to {endRow} of {totalRows} entries
        </div>

        <div className="pagination-buttons">
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === 1}
            onClick={() => onPaginationChange?.(1, rowsPerPage)}
          >
            <ChevronsLeft size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === 1}
            onClick={() => onPaginationChange?.(currentPage - 1, rowsPerPage)}
          >
            <ChevronLeft size={14} />
          </Button>

          {Array.from({ length: totalPages }, (_, index) => {
            const pageNum = index + 1;
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
            ) {
              return (
                <Button
                  key={pageNum}
                  size="sm"
                  variant={
                    currentPage === pageNum ? "primary" : "outline-secondary"
                  }
                  onClick={() => onPaginationChange?.(pageNum, rowsPerPage)}
                >
                  {pageNum}
                </Button>
              );
            }
            if (
              pageNum === currentPage - 2 ||
              pageNum === currentPage + 2
            ) {
              return (
                <span key={pageNum} className="px-2">
                  ...
                </span>
              );
            }
            return null;
          })}

          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() => onPaginationChange?.(currentPage + 1, rowsPerPage)}
          >
            <ChevronRight size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() => onPaginationChange?.(totalPages, rowsPerPage)}
          >
            <ChevronsRight size={14} />
          </Button>
        </div>
      </div>
    );
  };

  const renderTableBodyContent = (): React.ReactNode => {
    const colSpan =
      (selectable ? 1 : 0) +
      visibleColumns.length +
      (showColumnPickerPlaceholder ? 1 : 0) +
      (actionsColumnVisible ? 1 : 0);

    if (loading) {
      return (
        <tr>
          <td colSpan={colSpan} className="text-center py-4">
            <div className="generic-table-loading">{loadingMessage}</div>
          </td>
        </tr>
      );
    }

    if (sortedData.length === 0) {
      return (
        <tr>
          <td colSpan={colSpan} className="text-center py-4">
            <div className="generic-table-empty">{emptyMessage}</div>
          </td>
        </tr>
      );
    }

    return sortedData.map((row, index) => {
      const rowKey = String(row[uniqueKey as keyof T] || index);
      const isClickable = Boolean(onRowClick || onRowDoubleClick);
      return (
        <tr
          key={rowKey}
          onClick={() => onRowClick?.(row, index)}
          onDoubleClick={() => onRowDoubleClick?.(row, index)}
          onMouseEnter={() => setHoveredRowIndex(index)}
          onMouseLeave={() => setHoveredRowIndex(null)}
          onContextMenu={(e) => {
            if (!actionsColumnVisible) return;
            e.preventDefault();
            e.stopPropagation();
            const items = getContextMenuItems(row);
            if (items.length === 0) return;
            setContextMenu({ x: e.clientX, y: e.clientY, row });
          }}
          className={`generic-table-row ${rowClassName?.(row, index) || ""} ${isClickable ? "clickable" : ""}`}
        >
          {selectable && (
            <td
              className="generic-table-td"
              style={{ width: "40px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <Form.Check
                type="checkbox"
                checked={isSelected(row)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  e.stopPropagation();
                  applyRowCheckboxChange(row, e);
                }}
              />
            </td>
          )}
          {visibleColumns.map((col, colIdx) => (
            <GenericTableBodyDataCell
              key={col.key}
              col={col}
              row={row}
              index={index}
              colIdx={colIdx}
              onFirstColumnClick={onFirstColumnClick}
              onPreviewClick={onPreviewClick}
              hoveredRowIndex={hoveredRowIndex}
            />
          ))}
          {showColumnPickerPlaceholder && (
            <td
              className="generic-table-td"
              style={{ width: "52px" }}
              aria-hidden
            />
          )}
          {actionsColumnVisible && (
            <td
              className="generic-table-td generic-table-actions-cell"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="generic-table-actions">
                <GenericTableRowActionsCell
                  row={row}
                  rowStableKey={rowKey}
                  actions={actions}
                />
              </div>
            </td>
          )}
        </tr>
      );
    });
  };

  return (
    <div className="generic-table-container">
      {/* Right‑click context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="gt-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          role="menu"
        >
          <GtContextMenuItemList
            items={getContextMenuItems(contextMenu.row).map((item) => ({
              label: item.label,
              icon: item.icon,
              className: item.className,
              divider: item.divider,
              disabled: item.disabled,
              disabledTitle: item.disabledTitle,
              disabledClassName: item.disabledClassName,
              onClick: () => item.onClick(contextMenu.row),
            }))}
            onClose={() => setContextMenu(null)}
          />
        </div>
      )}

      {/* Toolbar */}
      {renderToolbar()}

      {/* Table or custom body (e.g. Board view) */}
      {customBody === undefined || customBody === null ? (
      <Card className={noBorder ? "border-0 shadow-none generic-table-card" : "border-1 shadow-sm generic-table-card"}>
        <Card.Body className="p-0">
          <div
            className={`generic-table-responsive ${fixedHeight ? "fixed-height-table" : ""}`}
            style={
              fixedHeight
                ? {
                    maxHeight,
                    overflow: "auto",
                  }
                : {}
            }
          >
            <Table
              hover={hover}
              striped={striped}
              bordered={bordered}
              size={size}
              className="generic-table mb-0"
            >
              <thead className="generic-table-header">
                <tr>
                  {selectable && (
                    <th className="generic-table-th" style={{ width: "40px" }}>
                      <Form.Check
                        type="checkbox"
                        checked={
                          sortedData.length > 0 &&
                          sortedData.every((row) => isSelected(row))
                        }
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  {visibleColumns.map((col, colIndex) => {
                    const isLastColumn = colIndex === visibleColumns.length - 1;
                    const showCustomizerInDataHeader =
                      customizableColumns && isLastColumn && !actionsColumnVisible;
                    return (
                      <th
                        key={col.key}
                        className={`generic-table-th ${col.sortable !== false && sortable ? "sortable" : ""}`}
                        style={{
                          textAlign: col.align || "left",
                          ...(col.width ? { width: col.width } : {}),
                        }}
                        onClick={(e) => {
                          if (
                            showCustomizerInDataHeader &&
                            (e.target as HTMLElement).closest(".dropdown")
                          )
                            return;
                          col.sortable !== false &&
                            sortable &&
                            handleSort(col.key);
                        }}
                      >
                        <div className="th-content d-flex align-items-center justify-content-between">
                          {/* Left Side - Column Name */}
                          <span>{col.label}</span>

                          {/* Right Side - Sort Icon */}
                          {col.sortable !== false &&
                            sortable &&
                            renderSortIcon(col.key)}
                          {showCustomizerInDataHeader &&
                            renderColumnCustomizerDropdown(
                              columnCustomizerHeaderId,
                            )}
                        </div>
                      </th>
                    );
                  })}
                  {showColumnPickerPlaceholder && (
                    <th
                      className="generic-table-th"
                      style={{ width: "52px" }}
                      aria-label="Column visibility"
                    >
                      <div className="d-flex align-items-center justify-content-center">
                        {renderColumnCustomizerDropdown(
                          columnCustomizerPlaceholderId,
                        )}
                      </div>
                    </th>
                  )}
                  {actionsColumnVisible && (
                    <th className="generic-table-th generic-table-actions-header">
                      <div className="d-flex align-items-center justify-content-center gap-1 w-100">
                        <span className="text-center">{actionsLabel}</span>
                        {customizableColumns &&
                          renderColumnCustomizerDropdown(
                            columnCustomizerActionsHeaderId,
                          )}
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {renderTableBodyContent()}
              </tbody>
            </Table>
          </div>
          {pagination && (
            <div className="p-3">{renderPaginationControls()}</div>
          )}
        </Card.Body>
      </Card>
      ) : (
        <Card className={noBorder ? "border-0 shadow-none generic-table-card" : "border-1 shadow-sm generic-table-card"}>
          <Card.Body className="p-0">
            {customBody}
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default GenericTable;
