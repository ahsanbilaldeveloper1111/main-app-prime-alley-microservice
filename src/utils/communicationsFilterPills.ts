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

function readFilterScalarAsString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  return "";
}

function readStringArrayFilter(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => readFilterScalarAsString(item))
    .filter((item) => item.length > 0);
}

function addIdToMultiSelectField(
  field: string,
  idVal: string,
): (prev: Filters) => Filters {
  return (prev) => {
    const currentSelected = readStringArrayFilter(prev[field]);
    if (currentSelected.includes(idVal)) {
      return prev;
    }
    return { ...prev, [field]: [...currentSelected, idVal] };
  };
}

function removeIdFromMultiSelectField(
  field: string,
  idVal: string,
): (prev: Filters) => Filters {
  return (prev) => {
    const currentSelected = readStringArrayFilter(prev[field]);
    return {
      ...prev,
      [field]: currentSelected.filter((value) => value !== idVal),
    };
  };
}

function createMultiSelectSelectHandler(
  field: string,
  idVal: string,
  stageFilters: StageFiltersFn,
): () => void {
  return () => {
    stageFilters(addIdToMultiSelectField(field, idVal));
  };
}

function createMultiSelectDeselectHandler(
  field: string,
  idVal: string,
  stageFilters: StageFiltersFn,
): () => void {
  return () => {
    stageFilters(removeIdFromMultiSelectField(field, idVal));
  };
}

function hierarchyItemIdString(item: { id?: unknown }): string {
  return readFilterScalarAsString(item.id);
}

function hierarchyItemLabel(item: { id?: unknown; name?: unknown }): string {
  return readFilterScalarAsString(item.name) || hierarchyItemIdString(item);
}

function getCalledNumbersFilterValue(currentFilters: Filters): string[] {
  return readStringArrayFilter(currentFilters.called_numbers);
}

export function getCallDirectionActiveLabel(value: unknown): string | undefined {
  const v = readFilterScalarAsString(value);
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
  const callStatusLabel = readFilterScalarAsString(currentFilters.call_status);

  return {
    id: "call_status",
    label: "Call Status",
    showDropdown: true,
    active: Boolean(callStatusLabel),
    activeLabel: callStatusLabel || undefined,
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
  const extensionAllIds = hierarchyDataExtensions.map((ext) =>
    hierarchyItemIdString(ext),
  );
  const selected = readStringArrayFilter(currentFilters.extension_number);
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
      const idVal = hierarchyItemIdString(ext);
      const isSelected = selected.includes(idVal);
      return {
        label: hierarchyItemLabel(ext),
        value: idVal,
        selected: isSelected,
        onClick: isSelected
          ? createMultiSelectDeselectHandler(
              "extension_number",
              idVal,
              stageFilters,
            )
          : createMultiSelectSelectHandler(
              "extension_number",
              idVal,
              stageFilters,
            ),
      };
    }),
  };
}

export function buildDepartmentFilterPill(
  hierarchyDataDepartments: { id?: unknown; name?: unknown }[],
  currentFilters: Filters,
  stageFilters: StageFiltersFn,
): FilterPill {
  const selected = readStringArrayFilter(currentFilters.department);

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
      const idVal = hierarchyItemIdString(dept);
      const isSelected = selected.includes(idVal);
      return {
        label: hierarchyItemLabel(dept),
        value: idVal,
        selected: isSelected,
        onClick: isSelected
          ? createMultiSelectDeselectHandler("department", idVal, stageFilters)
          : createMultiSelectSelectHandler("department", idVal, stageFilters),
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
  const filterValue = readFilterScalarAsString(currentFilters[id]);
  const DropdownContent = createTextDropdownContent(
    filterValue,
    (value: string) => stageFilters((prev) => ({ ...prev, [id]: value })),
    (value: string) => stageFilters((prev) => ({ ...prev, [id]: value })),
    placeholder,
  );
  return {
    id,
    label,
    showDropdown: true,
    active: Boolean(filterValue),
    activeLabel: filterValue || undefined,
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
  const filterValue = readFilterScalarAsString(currentFilters[id]);
  const DropdownContent = createDateTimeDropdownContent(
    filterValue,
    (value: string) => stageFilters((prev) => ({ ...prev, [id]: value })),
    (value: string) => stageFilters((prev) => ({ ...prev, [id]: value })),
  );
  return {
    id,
    label,
    showDropdown: true,
    active: Boolean(filterValue),
    activeLabel: formatLabel(currentFilters[id]),
    activeLabelOnly: true,
    ...(clearable
      ? { onClear: () => stageFilters((prev) => ({ ...prev, [id]: "" })) }
      : {}),
    dropdownContent: ({ closeMenu }) =>
      createElement(DropdownContent, { closeMenu }),
  };
}
