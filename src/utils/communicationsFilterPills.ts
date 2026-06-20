import type { FilterPill } from "@components/GenericTable";
import { createElement, type ComponentType } from "react";
import type { StageFiltersFn } from "@utils/communicationsFilterStaging";

type Filters = Record<string, unknown>;
type FormatLabel = (value: unknown) => string | undefined;
type CreateTextDropdown = (
  value: string,
  onChange: (value: string) => void,
  onApply: (value: string) => void,
  placeholder: string,
) => ComponentType<{ closeMenu: () => void }>;
type CreateDateTimeDropdown = (
  value: string,
  onChange: (value: string) => void,
  onApply: (value: string) => void,
) => ComponentType<{ closeMenu: () => void }>;
type CreateCalledNumbersDropdown = (
  value: string,
  onChange: (values: string[]) => void,
  onApply: (values: string[]) => void,
  placeholder?: string,
) => ComponentType<{ closeMenu: () => void }>;

function getCalledNumbersFilterValue(currentFilters: Filters): string[] {
  return Array.isArray(currentFilters.called_numbers)
    ? (currentFilters.called_numbers as string[])
    : [];
}

export function getCallDirectionActiveLabel(value: unknown): string | undefined {
  const v =
    typeof value === "string" || typeof value === "number"
      ? String(value)
      : "";
  if (v === "OUTGOING") return "Outgoing";
  if (v === "INCOMING") return "Incoming";
  if (v === "Both") return "Both";
  return undefined;
}

export function buildCallDirectionFilterPill(
  currentFilters: Filters,
  stageFilters: StageFiltersFn,
): FilterPill {
  return {
    id: "call_direction",
    label: "Call Direction",
    showDropdown: true,
    active: Boolean(currentFilters.call_direction),
    activeLabel: getCallDirectionActiveLabel(currentFilters.call_direction),
    onClear: () => stageFilters((prev) => ({ ...prev, call_direction: "" })),
    dropdownOptions: [
      {
        label: "Outgoing",
        value: "OUTGOING",
        onClick: () =>
          stageFilters((prev) => ({ ...prev, call_direction: "OUTGOING" })),
      },
      {
        label: "Incoming",
        value: "INCOMING",
        onClick: () =>
          stageFilters((prev) => ({ ...prev, call_direction: "INCOMING" })),
      },
      {
        label: "Both",
        value: "Both",
        onClick: () =>
          stageFilters((prev) => ({ ...prev, call_direction: "Both" })),
      },
    ],
  };
}

export function buildCallStatusFilterPill(
  currentFilters: Filters,
  stageFilters: StageFiltersFn,
): FilterPill {
  return {
    id: "call_status",
    label: "Call Status",
    showDropdown: true,
    active: Boolean(currentFilters.call_status),
    activeLabel: currentFilters.call_status
      ? String(currentFilters.call_status)
      : undefined,
    onClear: () => stageFilters((prev) => ({ ...prev, call_status: "" })),
    dropdownOptions: [
      {
        label: "Answered",
        value: "Answered",
        onClick: () =>
          stageFilters((prev) => ({ ...prev, call_status: "Answered" })),
      },
      {
        label: "Not Answered",
        value: "Not Answered",
        onClick: () =>
          stageFilters((prev) => ({ ...prev, call_status: "Not Answered" })),
      },
      {
        label: "Both",
        value: "Both",
        onClick: () =>
          stageFilters((prev) => ({ ...prev, call_status: "Both" })),
      },
    ],
  };
}

export function buildExtensionMultiSelectFilterPill(
  hierarchyDataExtensions: { id?: unknown; name?: unknown }[],
  currentFilters: Filters,
  stageFilters: StageFiltersFn,
): FilterPill {
  const extensionAllIds = hierarchyDataExtensions.map((ext) => String(ext.id));
  const selected = Array.isArray(currentFilters.extension_number)
    ? (currentFilters.extension_number as string[])
    : [];
  const allSelected =
    extensionAllIds.length > 0 && selected.length === extensionAllIds.length;

  return {
    id: "extension_number",
    label: "Extension",
    showDropdown: true,
    searchable: true,
    multiSelect: true,
    onSelectAll: () =>
      stageFilters((prev) => ({
        ...prev,
        extension_number: allSelected ? [] : extensionAllIds,
      })),
    selectAllLabel: allSelected ? "Deselect all" : "Select all",
    active: selected.length > 0,
    activeLabel: selected.length > 0 ? `${selected.length} selected` : undefined,
    onClear: () =>
      stageFilters((prev) => ({ ...prev, extension_number: [] })),
    dropdownOptions: hierarchyDataExtensions.map((ext) => {
      const idVal = String(ext.id);
      const isSelected = selected.includes(idVal);
      return {
        label: String(ext.name ?? ext.id),
        value: idVal,
        selected: isSelected,
        onClick: () => {
          stageFilters((prev) => {
            const currentSelected = Array.isArray(prev.extension_number)
              ? (prev.extension_number as string[])
              : [];
            const next = isSelected
              ? currentSelected.filter((v) => v !== idVal)
              : [...currentSelected, idVal];
            return { ...prev, extension_number: next };
          });
        },
      };
    }),
  };
}

export function buildDepartmentFilterPill(
  hierarchyDataDepartments: { id?: unknown; name?: unknown }[],
  currentFilters: Filters,
  stageFilters: StageFiltersFn,
): FilterPill {
  const selected = Array.isArray(currentFilters.department)
    ? (currentFilters.department as string[])
    : [];
  return {
    id: "department",
    label: "Department",
    showDropdown: true,
    searchable: true,
    multiSelect: true,
    active: selected.length > 0,
    activeLabel: selected.length > 0 ? `${selected.length} selected` : undefined,
    onClear: () => stageFilters((prev) => ({ ...prev, department: [] })),
    dropdownOptions: hierarchyDataDepartments.map((dept) => {
      const idVal = String(dept.id);
      const isSelected = selected.includes(idVal);
      return {
        label: String(dept.name ?? dept.id),
        value: idVal,
        selected: isSelected,
        onClick: () => {
          stageFilters((prev) => {
            const currentSelected = Array.isArray(prev.department)
              ? (prev.department as string[])
              : [];
            const next = isSelected
              ? currentSelected.filter((v) => v !== idVal)
              : [...currentSelected, idVal];
            return { ...prev, department: next };
          });
        },
      };
    }),
  };
}

export function buildCalledNumbersFilterPill(
  currentFilters: Filters,
  stageFilters: StageFiltersFn,
  createCalledNumbersDropdownContent: CreateCalledNumbersDropdown,
  placeholder = "Enter numbers (comma separated)",
): FilterPill {
  const numbers = getCalledNumbersFilterValue(currentFilters);
  const displayValue = numbers.join(", ");

  const DropdownContent = createCalledNumbersDropdownContent(
    displayValue,
    (values: string[]) =>
      stageFilters((prev) => ({ ...prev, called_numbers: values })),
    (values: string[]) =>
      stageFilters((prev) => ({ ...prev, called_numbers: values })),
    placeholder,
  );

  return {
    id: "called_numbers",
    label: "Numbers",
    showDropdown: true,
    active: numbers.length > 0,
    activeLabel:
      numbers.length > 0 ? `${numbers.length} number(s)` : undefined,
    onClear: () =>
      stageFilters((prev) => ({ ...prev, called_numbers: [] })),
    dropdownContent: ({ closeMenu }) =>
      createElement(DropdownContent, { closeMenu }),
  };
}

export function buildTextDropdownFilterPill(
  id: string,
  label: string,
  currentFilters: Filters,
  stageFilters: StageFiltersFn,
  createTextDropdownContent: CreateTextDropdown,
  placeholder: string,
): FilterPill {
  const DropdownContent = createTextDropdownContent(
    String(currentFilters[id] ?? ""),
    (value: string) => stageFilters((prev) => ({ ...prev, [id]: value })),
    (value: string) => stageFilters((prev) => ({ ...prev, [id]: value })),
    placeholder,
  );
  return {
    id,
    label,
    showDropdown: true,
    active: Boolean(currentFilters[id]),
    activeLabel: currentFilters[id] ? String(currentFilters[id]) : undefined,
    onClear: () => stageFilters((prev) => ({ ...prev, [id]: "" })),
    dropdownContent: ({ closeMenu }) =>
      createElement(DropdownContent, { closeMenu }),
  };
}

export function buildDateTimeFilterPill(
  id: string,
  label: string,
  currentFilters: Filters,
  stageFilters: StageFiltersFn,
  formatLabel: FormatLabel,
  createDateTimeDropdownContent: CreateDateTimeDropdown,
  options?: { clearable?: boolean },
): FilterPill {
  const clearable = options?.clearable !== false;
  const DropdownContent = createDateTimeDropdownContent(
    String(currentFilters[id] ?? ""),
    (value: string) => stageFilters((prev) => ({ ...prev, [id]: value })),
    (value: string) => stageFilters((prev) => ({ ...prev, [id]: value })),
  );
  return {
    id,
    label,
    showDropdown: true,
    active: Boolean(currentFilters[id]),
    activeLabel: formatLabel(currentFilters[id]),
    activeLabelOnly: true,
    ...(clearable
      ? { onClear: () => stageFilters((prev) => ({ ...prev, [id]: "" })) }
      : {}),
    dropdownContent: ({ closeMenu }) =>
      createElement(DropdownContent, { closeMenu }),
  };
}
