import React, { useMemo, useCallback } from "react";
import { Table, Form, Button, Dropdown, Card } from "react-bootstrap";
import { ChevronRight, RotateCcw } from "lucide-react";
import "@assets/css/GenericTable.css";
import { DROPDOWN_MENU_POPPER_CONFIG } from "./dropdownMenuPopperConfig";
import { GenericTableMobileActionsMenu } from "./GenericTableMobileActionsMenu";
import { GENERIC_TABLE_ACTION_COLUMN_KEY } from "./genericTableColumnResize";
import { GenericTableToolbarSection } from "./GenericTableToolbarSection";
import { GenericTablePaginationControls } from "./GenericTablePagination";
import { GenericTableHeader } from "./GenericTableHeader";
import { GenericTableColumnCustomizerDropdown } from "./GenericTableColumnCustomizerDropdown";
import {
  useGenericTableViewModel,
  type GenericTableViewModel,
} from "./useGenericTableViewModel";
import {
  getGenericTableCardClassName,
  getGenericTableClassName,
  getGenericTableContainerClassName,
  getGenericTableResponsiveClassName,
  getGenericTableScrollStyle,
  shouldRenderDefaultTableBody,
} from "./genericTableClassNames";

import type { GenericTableProps } from "./genericTableProps";

export type {
  TabConfig,
  FilterPill,
  ToolbarTabsDropdownItem,
  ToolbarConfig,
} from "./genericTableTypes";

export type { GenericTableProps, PaginationConfig } from "./genericTableProps";

const ACTION_COLUMN_KEY = GENERIC_TABLE_ACTION_COLUMN_KEY;

function isGenericTableInteractiveClickTarget(
  target: EventTarget | null,
): boolean {
  if (!(target instanceof Element)) {
    return false;
  }
  return Boolean(
    target.closest(
      'button, a, input, select, textarea, label, .dropdown-menu, .dropdown, [role="menu"], [role="menuitem"]',
    ),
  );
}

function isGenericTableActionColumnKey(columnKey: string): boolean {
  return columnKey === ACTION_COLUMN_KEY || columnKey === "Action";
}

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
    | "number"
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

  /** Row field used for sorting when it differs from `key` (e.g. sort by ISO `created_at`, display `create_date`). */
  sortKey?: string;

  /** Custom value extractor for client-side column sorting. */
  sortAccessor?: (row: T) => string | number;
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
  /** Context-menu label when `disabled(row)` is true (e.g. "Already in My Day"). */
  disabledLabel?: string;
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
    /**
     * When true, the right-click context menu shows one row (action label) that opens a
     * flyout submenu instead of listing every option at the top level.
     */
    nestInContextMenu?: boolean;
  };
}

/** Row context menu entry (onClick receives the row). Shared by the table and Kanban card menu. */
export type TableContextMenuItem<T = unknown> = {
  label: string;
  icon?: React.ReactNode;
  /** Present for leaf items; omitted when `submenu` is set. */
  onClick?: (row: T) => void;
  submenu?: TableContextMenuItem<T>[];
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
  onClick?: () => void;
  submenu?: BoundTableContextMenuItem[];
  divider?: boolean;
  className?: string;
  disabled?: boolean;
  disabledTitle?: string;
  disabledClassName?: string;
}

function buildDropdownContextMenuItems<T>(
  action: TableAction<T>,
  row: T,
): TableContextMenuItem<T>[] {
  const opts = getVisibleDropdownOptions(action.dropdown!.options, row);
  if (opts.length === 0) return [];

  const mapOption = (o: DropdownOption<T>): TableContextMenuItem<T> => ({
    label: o.label,
    icon: o.icon,
    onClick: o.onClick,
    divider: o.divider ?? false,
    className: o.className,
  });

  if (action.dropdown!.nestInContextMenu) {
    return [
      { label: action.label, icon: action.icon, submenu: opts.map(mapOption) },
    ];
  }
  return opts.map(mapOption);
}

function buildClickActionContextMenuItem<T>(
  action: TableAction<T>,
  row: T,
): TableContextMenuItem<T> {
  const isDisabled = action.disabled?.(row);
  const label =
    isDisabled && action.disabledLabel?.trim()
      ? action.disabledLabel.trim()
      : action.label;
  return {
    label,
    icon: action.icon,
    onClick: action.onClick,
    divider: false,
    className: isDisabled
      ? action.disabledClassName || "text-muted"
      : action.className,
    disabled: isDisabled,
    disabledTitle: action.disabledTitle,
    disabledClassName: action.disabledClassName,
  };
}

export function buildTableContextMenuItems<T>(
  actions: TableAction<T>[],
  row: T,
): TableContextMenuItem<T>[] {
  const items: TableContextMenuItem<T>[] = [];
  for (const action of actions) {
    if (action.show && !action.show(row)) continue;
    if (action.dropdown) {
      items.push(...buildDropdownContextMenuItems(action, row));
    } else if (action.onClick && !action.render) {
      items.push(buildClickActionContextMenuItem(action, row));
    }
  }
  return items;
}

function bindTableContextMenuItemsToRow<T>(
  items: TableContextMenuItem<T>[],
  row: T,
): BoundTableContextMenuItem[] {
  return items.map((item) => {
    const bound: BoundTableContextMenuItem = {
      label: item.label,
      icon: item.icon,
      divider: item.divider,
      className: item.className,
      disabled: item.disabled,
      disabledTitle: item.disabledTitle,
      disabledClassName: item.disabledClassName,
    };
    if (item.submenu && item.submenu.length > 0) {
      bound.submenu = bindTableContextMenuItemsToRow(item.submenu, row);
    } else if (item.onClick) {
      bound.onClick = () => item.onClick!(row);
    }
    return bound;
  });
}

export function buildBoundTableContextMenuItems<T>(
  actions: TableAction<T>[],
  row: T,
): BoundTableContextMenuItem[] {
  return bindTableContextMenuItemsToRow(
    buildTableContextMenuItems(actions, row),
    row,
  );
}

/** One row in `gt-context-menu`; `onClick` is a bound handler (no row argument). */
export type GtContextMenuItemRow = BoundTableContextMenuItem;

function renderGtContextMenuItemRow(
  item: GtContextMenuItemRow,
  idx: number,
  keyPrefix: string,
  onClose: () => void,
): React.ReactNode {
  const key = `${keyPrefix}-${item.label}-${idx}-${item.className ?? ""}`;

  if (item.submenu && item.submenu.length > 0) {
    return (
      <React.Fragment key={key}>
        <div className="gt-context-menu-submenu-host">
          <div
            className={`gt-context-menu-item gt-context-menu-item--parent ${item.className || ""}`}
            role="menuitem"
            aria-haspopup="menu"
          >
            {item.icon && (
              <span className="gt-context-menu-icon">{item.icon}</span>
            )}
            <span className="gt-context-menu-item-label">{item.label}</span>
            <ChevronRight
              size={16}
              className="gt-context-menu-chevron"
              aria-hidden
            />
          </div>
          <div className="gt-context-submenu" role="menu" tabIndex={-1}>
            {item.submenu.map((sub, subIdx) =>
              renderGtContextMenuItemRow(sub, subIdx, `${key}-sub`, onClose),
            )}
          </div>
        </div>
        {item.divider ? <div className="gt-context-menu-divider" /> : null}
      </React.Fragment>
    );
  }

  const runClick = () => {
    item.onClick?.();
    onClose();
  };

  return (
    <React.Fragment key={key}>
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
              runClick();
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
      {item.divider ? <div className="gt-context-menu-divider" /> : null}
    </React.Fragment>
  );
}

/** Shared markup for context menu rows (GenericTable rightâ€‘click + Kanban card menu). */
export const GtContextMenuItemList: React.FC<{
  items: GtContextMenuItemRow[];
  onClose: () => void;
}> = ({ items, onClose }) => (
  <>
    {items.map((item, idx) =>
      renderGtContextMenuItemRow(item, idx, "gt-ctx", onClose),
    )}
  </>
);

function safeStringifyValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (
    typeof val === "number" ||
    typeof val === "boolean" ||
    typeof val === "bigint"
  )
    return String(val);
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
      const opts = action.dropdown.options.filter(
        (o) => !o.show || o.show(row),
      );
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
        column.avatar?.getInitials?.(row) || name.slice(0, 2).toUpperCase();
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
        <div className="gt-company-cell" title={multiTitle}>
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
  columnWidthStyle,
}: Readonly<{
  col: TableColumn<T>;
  row: T;
  index: number;
  colIdx: number;
  onFirstColumnClick?: (row: T, index: number) => void;
  onPreviewClick?: (row: T, index: number) => void;
  hoveredRowIndex: number | null;
  columnWidthStyle?: React.CSSProperties;
}>) {
  const cellContent = renderGenericTableCellContent(col, row, index);
  const firstColumnClickable = colIdx === 0 && onFirstColumnClick !== undefined;

  return (
    <td
      className="generic-table-td"
      data-col-key={col.key}
      onClick={
        isGenericTableActionColumnKey(col.key)
          ? (e) => e.stopPropagation()
          : undefined
      }
      onMouseDown={
        isGenericTableActionColumnKey(col.key)
          ? (e) => e.stopPropagation()
          : undefined
      }
      style={{
        verticalAlign: "top",
        textAlign: col.align || "left",
        position: colIdx === 0 ? "relative" : undefined,
        ...columnWidthStyle,
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
  const hasDesktopActions = actions.some((action) => {
    if (action.show && !action.show(row)) return false;
    if (action.render) return true;
    if (action.dropdown) {
      return action.dropdown.options.some(
        (option) => !option.show || option.show(row),
      );
    }
    return true;
  });

  return (
    <>
      {hasDesktopActions ? (
        <div className="gt-row-actions gt-row-actions--desktop d-none d-md-flex align-items-center flex-nowrap">
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
                    renderOnMount
                    popperConfig={DROPDOWN_MENU_POPPER_CONFIG}
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
        </div>
      ) : null}
      <GenericTableMobileActionsMenu
        row={row}
        rowStableKey={rowStableKey}
        actions={actions}
      />
    </>
  );
}

type GenericTableBodyRowsProps<T extends Record<string, any>> = Readonly<{
  selectable: boolean;
  visibleColumns: TableColumn<T>[];
  showColumnPickerPlaceholder: boolean;
  actionsColumnVisible: boolean;
  loading: boolean;
  loadingMessage: React.ReactNode;
  sortedData: T[];
  emptyMessage: React.ReactNode;
  uniqueKey: string;
  onRowClick?: (row: T, index: number) => void;
  onRowDoubleClick?: (row: T, index: number) => void;
  rowClassName?: (row: T, index: number) => string;
  actions: TableAction<T>[];
  getBoundContextMenuItems: (
    row: T,
  ) => ReturnType<typeof buildBoundTableContextMenuItems<T>>;
  setContextMenu: React.Dispatch<
    React.SetStateAction<{ x: number; y: number; row: T } | null>
  >;
  setHoveredRowIndex: React.Dispatch<React.SetStateAction<number | null>>;
  isSelected: (row: T) => boolean;
  applyRowCheckboxChange: (
    row: T,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  checkboxColumnWidthStyle: React.CSSProperties | undefined;
  getColumnWidthStyle: (col: TableColumn<T>) => React.CSSProperties | undefined;
  onFirstColumnClick?: (row: T, index: number) => void;
  onPreviewClick?: (row: T, index: number) => void;
  hoveredRowIndex: number | null;
  actionsColumnWidthStyle: React.CSSProperties | undefined;
}>;

function GenericTableBodyRows<T extends Record<string, any>>({
  selectable,
  visibleColumns,
  showColumnPickerPlaceholder,
  actionsColumnVisible,
  loading,
  loadingMessage,
  sortedData,
  emptyMessage,
  uniqueKey,
  onRowClick,
  onRowDoubleClick,
  rowClassName,
  actions,
  getBoundContextMenuItems,
  setContextMenu,
  setHoveredRowIndex,
  isSelected,
  applyRowCheckboxChange,
  checkboxColumnWidthStyle,
  getColumnWidthStyle,
  onFirstColumnClick,
  onPreviewClick,
  hoveredRowIndex,
  actionsColumnWidthStyle,
}: GenericTableBodyRowsProps<T>) {
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
        onClick={(e) => {
          if (isGenericTableInteractiveClickTarget(e.target)) {
            return;
          }
          onRowClick?.(row, index);
        }}
        onDoubleClick={() => onRowDoubleClick?.(row, index)}
        onMouseEnter={() => setHoveredRowIndex(index)}
        onMouseLeave={() => setHoveredRowIndex(null)}
        onContextMenu={(e) => {
          if (actions.length === 0) return;
          const items = getBoundContextMenuItems(row);
          if (items.length === 0) return;
          e.preventDefault();
          e.stopPropagation();
          setContextMenu({ x: e.clientX, y: e.clientY, row });
        }}
        className={`generic-table-row ${rowClassName?.(row, index) || ""} ${isClickable ? "clickable" : ""}`}
      >
        {selectable && (
          <td
            className="generic-table-td"
            style={checkboxColumnWidthStyle}
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
            columnWidthStyle={getColumnWidthStyle(col)}
          />
        ))}
        {showColumnPickerPlaceholder && (
          <td className="generic-table-td" style={{ width: "52px" }} />
        )}
        {actionsColumnVisible && (
          <td
            className="generic-table-td generic-table-actions-cell"
            data-col-key={ACTION_COLUMN_KEY}
            style={actionsColumnWidthStyle}
            onMouseDown={(e) => e.stopPropagation()}
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
}

function GenericTableView<T extends Record<string, any>>({
  vm,
}: Readonly<{ vm: GenericTableViewModel<T> }>) {
  const {
    pagination,
    onPaginationChange,
    actions,
    actionsLabel,
    selectable,
    customizableColumns,
    selectedColumnsProp,
    defaultSelectedColumns,
    onColumnChange,
    columnStorageKey,
    resizableColumns,
    pinActionsColumn,
    onRowClick,
    onRowDoubleClick,
    onPreviewClick,
    onFirstColumnClick,
    rowClassName,
    striped,
    hover,
    bordered,
    size,
    loading,
    emptyMessage,
    loadingMessage,
    toolbar,
    showToolbar,
    uniqueKey,
    fixedHeight,
    maxHeight,
    statsCards,
    metricsGridMinWidth,
    metricsColumns,
    metricsEmbedded,
    showToolbarActions,
    noBorder,
    customBody,
    baseActionsEnabled,
    actionsColumnVisible,
    visibleColumns,
    showColumnPickerPlaceholder,
    columnCustomizerHeaderId,
    columnCustomizerPlaceholderId,
    columnCustomizerActionsHeaderId,
    debounceToolbarSearch,
    toolbarSearchDraft,
    setToolbarSearchDraft,
    flushDebouncedToolbarSearch,
    columnCatalog,
    setSelectedColumns,
    effectiveSelectedColumns,
    handleColumnToggle,
    contextMenu,
    setContextMenu,
    contextMenuRef,
    showFilterPills,
    setShowFilterPills,
    showMetrics,
    setShowMetrics,
    openFilterPillId,
    setOpenFilterPillId,
    filterPillSearch,
    setFilterPillSearch,
    hoveredRowIndex,
    setHoveredRowIndex,
    filterPillMenuPopperConfig,
    tableScrollRef,
    columnWidths,
    hasCustomColumnWidths,
    handleColumnResizeStart,
    handleColumnWidthReset,
    handleResetAllColumnWidths,
    actionsColumnWidthStyle,
    getColumnWidthStyle,
    checkboxColumnWidthStyle,
    resizedTableStyle,
    sortable,
    sortBy,
    sortOrder,
    sortableColumns,
    sortedData,
    handleSort,
    isSelected,
    handleSelectAll,
    applyRowCheckboxChange,
  } = vm;

  const getBoundContextMenuItems = useMemo(
    () => (row: T) => buildBoundTableContextMenuItems(actions, row),
    [actions],
  );

  const renderColumnCustomizer = useCallback(
    (toggleId: string) => (
      <GenericTableColumnCustomizerDropdown
        toggleId={toggleId}
        columnCatalog={columnCatalog}
        effectiveSelectedColumns={effectiveSelectedColumns}
        baseActionsEnabled={baseActionsEnabled}
        actionsLabel={actionsLabel}
        pinActionsColumn={pinActionsColumn}
        onColumnToggle={handleColumnToggle}
        selectedColumnsProp={selectedColumnsProp}
        setSelectedColumns={setSelectedColumns}
        defaultSelectedColumns={defaultSelectedColumns}
        columnStorageKey={columnStorageKey}
        onColumnChange={onColumnChange}
        resizableColumns={resizableColumns}
        hasCustomColumnWidths={hasCustomColumnWidths}
        onResetAllColumnWidths={handleResetAllColumnWidths}
      />
    ),
    [
      columnCatalog,
      effectiveSelectedColumns,
      baseActionsEnabled,
      actionsLabel,
      pinActionsColumn,
      handleColumnToggle,
      selectedColumnsProp,
      setSelectedColumns,
      defaultSelectedColumns,
      columnStorageKey,
      onColumnChange,
      resizableColumns,
      hasCustomColumnWidths,
      handleResetAllColumnWidths,
    ],
  );

  const cardClassName = getGenericTableCardClassName(noBorder);
  const containerClassName = getGenericTableContainerClassName(
    resizableColumns,
    hasCustomColumnWidths,
  );
  const responsiveClassName = getGenericTableResponsiveClassName(
    fixedHeight,
    resizableColumns,
    hasCustomColumnWidths,
  );
  const tableClassName = getGenericTableClassName(
    resizableColumns,
    hasCustomColumnWidths,
  );
  const scrollStyle = getGenericTableScrollStyle(fixedHeight, maxHeight);
  const showDefaultTable = shouldRenderDefaultTableBody(customBody);

  const tableSection = (
    <>
      {resizableColumns && hasCustomColumnWidths && (
        <div className="generic-table-width-reset-bar">
          <Button
            variant="link"
            size="sm"
            className="generic-table-reset-all-widths-btn"
            onClick={handleResetAllColumnWidths}
          >
            <RotateCcw size={14} aria-hidden />
            Reset column widths
          </Button>
        </div>
      )}
      <div
        ref={tableScrollRef}
        className={responsiveClassName}
        style={scrollStyle}
      >
        <Table
          hover={hover}
          striped={striped}
          bordered={bordered}
          size={size}
          className={tableClassName}
          style={resizedTableStyle}
        >
          <GenericTableHeader
            selectable={selectable}
            sortedData={sortedData}
            isSelected={isSelected}
            onSelectAll={handleSelectAll}
            checkboxColumnWidthStyle={checkboxColumnWidthStyle}
            visibleColumns={visibleColumns}
            sortable={sortable}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            customizableColumns={customizableColumns}
            actionsColumnVisible={actionsColumnVisible}
            columnCustomizerHeaderId={columnCustomizerHeaderId}
            columnCustomizerPlaceholderId={columnCustomizerPlaceholderId}
            columnCustomizerActionsHeaderId={columnCustomizerActionsHeaderId}
            renderColumnCustomizer={renderColumnCustomizer}
            resizableColumns={resizableColumns}
            columnWidths={columnWidths}
            getColumnWidthStyle={getColumnWidthStyle}
            onColumnWidthReset={handleColumnWidthReset}
            onColumnResizeStart={handleColumnResizeStart}
            showColumnPickerPlaceholder={showColumnPickerPlaceholder}
            actionsLabel={actionsLabel}
            actionsColumnWidthStyle={actionsColumnWidthStyle}
          />
          <tbody>
            <GenericTableBodyRows
              selectable={selectable}
              visibleColumns={visibleColumns}
              showColumnPickerPlaceholder={showColumnPickerPlaceholder}
              actionsColumnVisible={actionsColumnVisible}
              loading={loading}
              loadingMessage={loadingMessage}
              sortedData={sortedData}
              emptyMessage={emptyMessage}
              uniqueKey={uniqueKey}
              onRowClick={onRowClick}
              onRowDoubleClick={onRowDoubleClick}
              rowClassName={rowClassName}
              actions={actions}
              getBoundContextMenuItems={getBoundContextMenuItems}
              setContextMenu={setContextMenu}
              setHoveredRowIndex={setHoveredRowIndex}
              isSelected={isSelected}
              applyRowCheckboxChange={applyRowCheckboxChange}
              checkboxColumnWidthStyle={checkboxColumnWidthStyle}
              getColumnWidthStyle={getColumnWidthStyle}
              onFirstColumnClick={onFirstColumnClick}
              onPreviewClick={onPreviewClick}
              hoveredRowIndex={hoveredRowIndex}
              actionsColumnWidthStyle={actionsColumnWidthStyle}
            />
          </tbody>
        </Table>
      </div>
      {pagination && (
        <div className="p-3">
          <GenericTablePaginationControls
            pagination={pagination}
            onPaginationChange={onPaginationChange}
          />
        </div>
      )}
    </>
  );

  return (
    <div className={containerClassName}>
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="gt-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          role="menu"
          tabIndex={-1}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <GtContextMenuItemList
            items={getBoundContextMenuItems(contextMenu.row)}
            onClose={() => setContextMenu(null)}
          />
        </div>
      )}

      {showToolbar && toolbar && (
        <GenericTableToolbarSection
          toolbar={toolbar}
          debounceToolbarSearch={debounceToolbarSearch}
          toolbarSearchDraft={toolbarSearchDraft}
          setToolbarSearchDraft={setToolbarSearchDraft}
          flushDebouncedToolbarSearch={flushDebouncedToolbarSearch}
          sortableColumns={sortableColumns}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortColumn={handleSort}
          showFilterPills={showFilterPills}
          setShowFilterPills={setShowFilterPills}
          openFilterPillId={openFilterPillId}
          setOpenFilterPillId={setOpenFilterPillId}
          filterPillSearch={filterPillSearch}
          setFilterPillSearch={setFilterPillSearch}
          filterPillMenuPopperConfig={filterPillMenuPopperConfig}
          showToolbarActions={showToolbarActions}
          statsCards={statsCards}
          showMetrics={showMetrics}
          setShowMetrics={setShowMetrics}
          metricsGridMinWidth={metricsGridMinWidth}
          metricsColumns={metricsColumns}
          metricsEmbedded={metricsEmbedded}
        />
      )}

      {showDefaultTable ? (
        <Card className={cardClassName}>
          <Card.Body className="p-0">{tableSection}</Card.Body>
        </Card>
      ) : (
        <Card className={cardClassName}>
          <Card.Body className="p-0">{customBody}</Card.Body>
        </Card>
      )}
    </div>
  );
}

const GenericTable = <T extends Record<string, any>>(
  props: GenericTableProps<T>,
) => {
  const vm = useGenericTableViewModel(props);
  return <GenericTableView vm={vm} />;
};

export default GenericTable;
