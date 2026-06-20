import { useCallback, useMemo, type CSSProperties } from "react";
import type { FilterPill } from "@components/GenericTable";
import {
  resolveTicketExtensionLabel,
  type TicketHierarchyExtensionLike,
} from "@components/crm/tickets/crmTicketExtensionLabel";
import {
  toCrmTicketAppliedFilters,
  type CrmTicketAppliedFilters,
  type CrmTicketPriority,
} from "@components/crm/tickets/crmTicketsListDomain";
import { buildDateTimeFilterPill } from "@utils/communicationsFilterPills";
import type { StageFiltersFn } from "@utils/communicationsFilterStaging";
import { createDateTimeDropdownContent } from "@utils/communicationsFilterDropdowns";
import { formatFilterDateTimeLabel } from "@utils/communicationsDateUtils";

type FiltersUpdater =
  | CrmTicketAppliedFilters
  | ((prev: CrmTicketAppliedFilters) => CrmTicketAppliedFilters);

type TicketFiltersRecord = Record<string, unknown>;

type FilterDropdownOption = NonNullable<FilterPill["dropdownOptions"]>[number];

const CRM_TICKET_PRIORITY_OPTIONS: ReadonlyArray<{
  label: string;
  value: CrmTicketPriority | "All Priorities";
}> = [
  { label: "All Priorities", value: "All Priorities" },
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
];

function truncateFilterLabel(label: string, maxLength = 28): string {
  const trimmed = label.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

const CRM_TICKETS_FILTER_DROPDOWN_MENU_STYLE: CSSProperties = {
  maxHeight: "280px",
  overflowY: "auto",
  overflowX: "hidden",
  minWidth: "220px",
  maxWidth: "min(320px, calc(100vw - 24px))",
};

const CRM_TICKETS_OWNER_DROPDOWN_MENU_STYLE: CSSProperties = {
  ...CRM_TICKETS_FILTER_DROPDOWN_MENU_STYLE,
  minWidth: "240px",
  maxWidth: "min(360px, calc(100vw - 24px))",
};

function applyTicketOwner(
  onFiltersChange: (update: FiltersUpdater) => void,
  ticketOwner: string,
): void {
  onFiltersChange((prev) => ({ ...prev, ticketOwner }));
}

function applyTicketPriority(
  onFiltersChange: (update: FiltersUpdater) => void,
  priority: CrmTicketPriority | "All Priorities",
): void {
  onFiltersChange((prev) => ({ ...prev, priority }));
}

function createTicketFiltersRecord(
  filters: CrmTicketAppliedFilters,
): TicketFiltersRecord {
  return { ...filters };
}

function mapExtensionToOwnerOption(
  extension: TicketHierarchyExtensionLike,
  selectedOwner: string,
  onFiltersChange: (update: FiltersUpdater) => void,
): FilterDropdownOption {
  const label = resolveTicketExtensionLabel(extension);
  return {
    label,
    value: label,
    selected: selectedOwner === label,
    onClick: () => applyTicketOwner(onFiltersChange, label),
  };
}

function buildOwnerDropdownOptions(
  currentFilters: CrmTicketAppliedFilters,
  extensions: TicketHierarchyExtensionLike[],
  onFiltersChange: (update: FiltersUpdater) => void,
): FilterDropdownOption[] {
  const allOwnersOption: FilterDropdownOption = {
    label: "All Owners",
    value: "all",
    selected: currentFilters.ticketOwner === "All Owners",
    onClick: () => applyTicketOwner(onFiltersChange, "All Owners"),
  };

  return [
    allOwnersOption,
    ...extensions.map((extension) =>
      mapExtensionToOwnerOption(extension, currentFilters.ticketOwner, onFiltersChange),
    ),
  ];
}

function buildCrmTicketsOwnerFilterPill(
  currentFilters: CrmTicketAppliedFilters,
  extensions: TicketHierarchyExtensionLike[],
  onFiltersChange: (update: FiltersUpdater) => void,
): FilterPill {
  const isOwnerFiltered = currentFilters.ticketOwner !== "All Owners";

  return {
    id: "ticket_owner",
    label: "Ticket owner",
    showDropdown: true,
    searchable: true,
    active: isOwnerFiltered,
    activeLabelOnly: isOwnerFiltered,
    activeLabel: isOwnerFiltered
      ? truncateFilterLabel(currentFilters.ticketOwner)
      : undefined,
    dropdownMenuStyle: CRM_TICKETS_OWNER_DROPDOWN_MENU_STYLE,
    onClear: () => applyTicketOwner(onFiltersChange, "All Owners"),
    dropdownOptions: buildOwnerDropdownOptions(
      currentFilters,
      extensions,
      onFiltersChange,
    ),
  };
}

function buildCrmTicketsCreateDateFromPill(
  currentFilters: CrmTicketAppliedFilters,
  stageTicketFilters: StageFiltersFn,
): FilterPill {
  const filtersRecord = createTicketFiltersRecord(currentFilters);
  return buildDateTimeFilterPill(
    "createDateFrom",
    "Create date from",
    filtersRecord,
    stageTicketFilters,
    formatFilterDateTimeLabel,
    createDateTimeDropdownContent,
  );
}

function buildCrmTicketsCreateDateToPill(
  currentFilters: CrmTicketAppliedFilters,
  stageTicketFilters: StageFiltersFn,
): FilterPill {
  const filtersRecord = createTicketFiltersRecord(currentFilters);
  return buildDateTimeFilterPill(
    "createDateTo",
    "Create date to",
    filtersRecord,
    stageTicketFilters,
    formatFilterDateTimeLabel,
    createDateTimeDropdownContent,
  );
}

function mapPriorityToDropdownOption(
  option: (typeof CRM_TICKET_PRIORITY_OPTIONS)[number],
  selectedPriority: CrmTicketAppliedFilters["priority"],
  onFiltersChange: (update: FiltersUpdater) => void,
): FilterDropdownOption {
  return {
    label: option.label,
    value: option.value,
    selected: selectedPriority === option.value,
    onClick: () => applyTicketPriority(onFiltersChange, option.value),
  };
}

function buildCrmTicketsPriorityFilterPill(
  currentFilters: CrmTicketAppliedFilters,
  onFiltersChange: (update: FiltersUpdater) => void,
): FilterPill {
  const isPriorityFiltered = currentFilters.priority !== "All Priorities";

  return {
    id: "priority",
    label: "Priority",
    showDropdown: true,
    active: isPriorityFiltered,
    activeLabelOnly: isPriorityFiltered,
    activeLabel: isPriorityFiltered ? currentFilters.priority : undefined,
    dropdownMenuStyle: CRM_TICKETS_FILTER_DROPDOWN_MENU_STYLE,
    onClear: () => applyTicketPriority(onFiltersChange, "All Priorities"),
    dropdownOptions: CRM_TICKET_PRIORITY_OPTIONS.map((option) =>
      mapPriorityToDropdownOption(option, currentFilters.priority, onFiltersChange),
    ),
  };
}

function buildCrmTicketsFilterPillList(
  currentFilters: CrmTicketAppliedFilters,
  extensions: TicketHierarchyExtensionLike[],
  onFiltersChange: (update: FiltersUpdater) => void,
  stageTicketFilters: StageFiltersFn,
): FilterPill[] {
  return [
    buildCrmTicketsOwnerFilterPill(currentFilters, extensions, onFiltersChange),
    buildCrmTicketsCreateDateFromPill(currentFilters, stageTicketFilters),
    buildCrmTicketsCreateDateToPill(currentFilters, stageTicketFilters),
    buildCrmTicketsPriorityFilterPill(currentFilters, onFiltersChange),
  ];
}

interface UseCrmTicketsFilterPillsOptions {
  currentFilters: CrmTicketAppliedFilters;
  onFiltersChange: (update: FiltersUpdater) => void;
  extensions: TicketHierarchyExtensionLike[];
}

export function countCrmTicketsActiveFilters(
  filters: CrmTicketAppliedFilters,
): number {
  let count = 0;
  if (filters.ticketOwner !== "All Owners") {
    count += 1;
  }
  if (filters.createDateFrom || filters.createDateTo) {
    count += 1;
  }
  if (filters.priority !== "All Priorities") {
    count += 1;
  }
  return count;
}

export function useCrmTicketsFilterPills({
  currentFilters,
  onFiltersChange,
  extensions,
}: UseCrmTicketsFilterPillsOptions): FilterPill[] {
  const stageTicketFilters = useCallback<StageFiltersFn>(
    (nextOrUpdater) => {
      onFiltersChange((prev) => {
        const prevRecord = createTicketFiltersRecord(prev);
        const next =
          typeof nextOrUpdater === "function"
            ? nextOrUpdater(prevRecord)
            : nextOrUpdater;
        return toCrmTicketAppliedFilters(next, prev);
      });
    },
    [onFiltersChange],
  );

  return useMemo(
    () =>
      buildCrmTicketsFilterPillList(
        currentFilters,
        extensions,
        onFiltersChange,
        stageTicketFilters,
      ),
    [currentFilters, extensions, onFiltersChange, stageTicketFilters],
  );
}
