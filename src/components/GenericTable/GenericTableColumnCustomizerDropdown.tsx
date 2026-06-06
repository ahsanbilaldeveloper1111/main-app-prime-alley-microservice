import React, { useMemo } from "react";
import { Dropdown, Form } from "react-bootstrap";
import { Layers } from "lucide-react";
import { DROPDOWN_MENU_POPPER_CONFIG } from "./dropdownMenuPopperConfig";
import { GENERIC_TABLE_ACTION_COLUMN_KEY } from "./genericTableColumnResize";

const ACTION_COLUMN_KEY = GENERIC_TABLE_ACTION_COLUMN_KEY;

export type GenericTableColumnCustomizerDropdownProps = Readonly<{
  toggleId: string;
  columnCatalog: Array<{ key: string; label?: string }>;
  effectiveSelectedColumns: string[];
  baseActionsEnabled: boolean;
  actionsLabel: string;
  pinActionsColumn: boolean;
  onColumnToggle: (columnKey: string) => void;
  selectedColumnsProp: string[] | undefined;
  setSelectedColumns: React.Dispatch<React.SetStateAction<string[]>>;
  defaultSelectedColumns: string[] | undefined;
  columnStorageKey: string | undefined;
  onColumnChange?: (selectedColumns: string[]) => void;
  resizableColumns: boolean;
  hasCustomColumnWidths: boolean;
  onResetAllColumnWidths: () => void;
}>;

export function GenericTableColumnCustomizerDropdown({
  toggleId,
  columnCatalog,
  effectiveSelectedColumns,
  baseActionsEnabled,
  actionsLabel,
  pinActionsColumn,
  onColumnToggle,
  selectedColumnsProp,
  setSelectedColumns,
  defaultSelectedColumns,
  columnStorageKey,
  onColumnChange,
  resizableColumns,
  hasCustomColumnWidths,
  onResetAllColumnWidths,
}: GenericTableColumnCustomizerDropdownProps) {
  const columnSelectorMenuPopperConfig = useMemo(
    () => DROPDOWN_MENU_POPPER_CONFIG,
    [],
  );

  const selectAllColumns = () => {
    const allKeys = columnCatalog.map((column) => column.key);
    if (baseActionsEnabled && !allKeys.includes(ACTION_COLUMN_KEY)) {
      allKeys.push(ACTION_COLUMN_KEY);
    }
    if (selectedColumnsProp === undefined) {
      setSelectedColumns(allKeys);
    }
    if (columnStorageKey) {
      globalThis.localStorage.setItem(
        columnStorageKey,
        JSON.stringify(allKeys),
      );
    }
    onColumnChange?.(allKeys);
  };

  const resetColumnsToDefault = () => {
    const defaultKeys =
      defaultSelectedColumns || columnCatalog.map((column) => column.key);
    if (selectedColumnsProp === undefined) {
      setSelectedColumns(defaultKeys);
    }
    if (columnStorageKey) {
      globalThis.localStorage.setItem(
        columnStorageKey,
        JSON.stringify(defaultKeys),
      );
    }
    onColumnChange?.(defaultKeys);
  };

  return (
    <Dropdown
      drop="down"
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
        renderOnMount
        popperConfig={columnSelectorMenuPopperConfig}
      >
        {columnCatalog.map((column) => (
          <Dropdown.Item key={column.key} as="div">
            <Form.Check
              type="checkbox"
              label={column.label || column.key}
              checked={effectiveSelectedColumns.includes(column.key)}
              onChange={() => onColumnToggle(column.key)}
            />
          </Dropdown.Item>
        ))}
        {baseActionsEnabled && (
          <Dropdown.Item key={ACTION_COLUMN_KEY} as="div">
            <Form.Check
              type="checkbox"
              label={actionsLabel}
              checked={effectiveSelectedColumns.includes(ACTION_COLUMN_KEY)}
              disabled={pinActionsColumn}
              onChange={() => onColumnToggle(ACTION_COLUMN_KEY)}
            />
          </Dropdown.Item>
        )}
        <Dropdown.Divider />
        <Dropdown.Item onClick={selectAllColumns}>Select All</Dropdown.Item>
        <Dropdown.Item onClick={resetColumnsToDefault}>
          Reset to Default
        </Dropdown.Item>
        {resizableColumns && hasCustomColumnWidths && (
          <Dropdown.Item onClick={onResetAllColumnWidths}>
            Reset column widths
          </Dropdown.Item>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}
