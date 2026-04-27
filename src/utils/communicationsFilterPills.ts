import type { FilterPill } from "@components/GenericTable";
import type { ComponentType } from "react";

type Filters = Record<string, any>;
type StageFilters = (nextFilters: Filters) => void;
type SetCurrentFilters = (nextFilters: Filters) => void;
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
  stageFilters: StageFilters,
): FilterPill {
  return {
    id: "call_direction",
    label: "Call Direction",
    showDropdown: true,
    active: Boolean(currentFilters.call_direction),
    activeLabel: getCallDirectionActiveLabel(currentFilters.call_direction),
    onClear: () => stageFilters({ ...currentFilters, call_direction: "" }),
    dropdownOptions: [
      {
        label: "Outgoing",
        value: "OUTGOING",
        onClick: () =>
          stageFilters({ ...currentFilters, call_direction: "OUTGOING" }),
      },
      {
        label: "Incoming",
        value: "INCOMING",
        onClick: () =>
          stageFilters({ ...currentFilters, call_direction: "INCOMING" }),
      },
      {
        label: "Both",
        value: "Both",
        onClick: () => stageFilters({ ...currentFilters, call_direction: "Both" }),
      },
    ],
  };
}

export function buildCallStatusFilterPill(
  currentFilters: Filters,
  stageFilters: StageFilters,
): FilterPill {
  return {
    id: "call_status",
    label: "Call Status",
    showDropdown: true,
    active: Boolean(currentFilters.call_status),
    activeLabel: currentFilters.call_status || undefined,
    onClear: () => stageFilters({ ...currentFilters, call_status: "" }),
    dropdownOptions: [
      {
        label: "Answered",
        value: "Answered",
        onClick: () => stageFilters({ ...currentFilters, call_status: "Answered" }),
      },
      {
        label: "Not Answered",
        value: "Not Answered",
        onClick: () =>
          stageFilters({
            ...currentFilters,
            call_status: "Not Answered",
          }),
      },
      {
        label: "Both",
        value: "Both",
        onClick: () => stageFilters({ ...currentFilters, call_status: "Both" }),
      },
    ],
  };
}

export function buildExtensionMultiSelectFilterPill(
  hierarchyDataExtensions: any[],
  currentFilters: Filters,
  stageFilters: StageFilters,
): FilterPill {
  const extensionAllIds = hierarchyDataExtensions.map((ext: any) => String(ext.id));
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
      stageFilters({
        ...currentFilters,
        extension_number: allSelected ? [] : extensionAllIds,
      }),
    selectAllLabel: allSelected ? "Deselect all" : "Select all",
    active: selected.length > 0,
    activeLabel: selected.length > 0 ? `${selected.length} selected` : undefined,
    onClear: () => stageFilters({ ...currentFilters, extension_number: [] }),
    dropdownOptions: hierarchyDataExtensions.map((ext: any) => {
      const idVal = String(ext.id);
      const isSelected = selected.includes(idVal);
      return {
        label: String(ext.name ?? ext.id),
        value: idVal,
        selected: isSelected,
        onClick: () => {
          const next = isSelected
            ? selected.filter((v) => v !== idVal)
            : [...selected, idVal];
          stageFilters({ ...currentFilters, extension_number: next });
        },
      };
    }),
  };
}

export function buildDepartmentFilterPill(
  hierarchyDataDepartments: any[],
  currentFilters: Filters,
  stageFilters: StageFilters,
): FilterPill {
  const selected = Array.isArray(currentFilters.department)
    ? (currentFilters.department as string[])
    : [];
  return {
    id: "department",
    label: "Department",
    showDropdown: true,
    searchable: true,
    active: selected.length > 0,
    activeLabel: selected.length > 0 ? `${selected.length} selected` : undefined,
    onClear: () => stageFilters({ ...currentFilters, department: [] }),
    dropdownOptions: hierarchyDataDepartments.map((dept: any) => {
      const idVal = String(dept.id);
      return {
        label: String(dept.name ?? dept.id),
        value: idVal,
        onClick: () => stageFilters({ ...currentFilters, department: [idVal] }),
      };
    }),
  };
}

export function buildTextDropdownFilterPill(
  id: string,
  label: string,
  currentFilters: Filters,
  setCurrentFilters: SetCurrentFilters,
  stageFilters: StageFilters,
  createTextDropdownContent: CreateTextDropdown,
  placeholder: string,
): FilterPill {
  return {
    id,
    label,
    showDropdown: true,
    active: Boolean(currentFilters[id]),
    activeLabel: currentFilters[id] ? String(currentFilters[id]) : undefined,
    onClear: () => stageFilters({ ...currentFilters, [id]: "" }),
    dropdownContent: createTextDropdownContent(
      currentFilters[id] ?? "",
      (value: string) => setCurrentFilters({ ...currentFilters, [id]: value }),
      (value: string) => stageFilters({ ...currentFilters, [id]: value }),
      placeholder,
    ),
  };
}

export function buildDateTimeFilterPill(
  id: string,
  label: string,
  currentFilters: Filters,
  setCurrentFilters: SetCurrentFilters,
  stageFilters: StageFilters,
  formatLabel: FormatLabel,
  createDateTimeDropdownContent: CreateDateTimeDropdown,
): FilterPill {
  return {
    id,
    label,
    showDropdown: true,
    active: Boolean(currentFilters[id]),
    activeLabel: formatLabel(currentFilters[id]),
    activeLabelOnly: true,
    dropdownContent: createDateTimeDropdownContent(
      currentFilters[id] ?? "",
      (value: string) => setCurrentFilters({ ...currentFilters, [id]: value }),
      (value: string) => stageFilters({ ...currentFilters, [id]: value }),
    ),
  };
}
