import { useCallback, useMemo, type CSSProperties } from "react";
import type { FilterPill } from "@components/GenericTable";
import type {
  CrmTicketAppliedFilters,
  CrmTicketPriority,
} from "@components/crm/tickets/crmTicketsListDomain";
import { buildDateTimeFilterPill } from "@utils/communicationsFilterPills";
import { createDateTimeDropdownContent } from "@utils/communicationsFilterDropdowns";
import { formatFilterDateTimeLabel } from "@utils/communicationsDateUtils";

type TicketHierarchyExtension = {
  id?: unknown;
  display_name?: string;
  name?: string;
  extension?: string;
};

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

function resolveExtensionLabel(
  extension: TicketHierarchyExtension,
): string {
  return (
    extension.display_name ||
    extension.name ||
    extension.extension ||
    String(extension.id ?? "")
  );
}

type FiltersUpdater =
  | CrmTicketAppliedFilters
  | ((prev: CrmTicketAppliedFilters) => CrmTicketAppliedFilters);

interface UseCrmTicketsFilterPillsOptions {
  currentFilters: CrmTicketAppliedFilters;
  onFiltersChange: (update: FiltersUpdater) => void;
  extensions: TicketHierarchyExtension[];
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
  const setTicketFilters = useCallback(
    (next: Record<string, unknown>) => {
      onFiltersChange(next as CrmTicketAppliedFilters);
    },
    [onFiltersChange],
  );

  const stageTicketFilters = setTicketFilters;

  return useMemo(() => {
    const filtersRecord = currentFilters as Record<string, unknown>;

    return [
      {
        id: "ticket_owner",
        label: "Ticket owner",
        showDropdown: true,
        searchable: true,
        active: currentFilters.ticketOwner !== "All Owners",
        activeLabelOnly: currentFilters.ticketOwner !== "All Owners",
        activeLabel:
          currentFilters.ticketOwner === "All Owners"
            ? undefined
            : truncateFilterLabel(currentFilters.ticketOwner),
        dropdownMenuStyle: CRM_TICKETS_OWNER_DROPDOWN_MENU_STYLE,
        onClear: () => {
          onFiltersChange((prev) => ({ ...prev, ticketOwner: "All Owners" }));
        },
        dropdownOptions: [
          {
            label: "All Owners",
            value: "all",
            selected: currentFilters.ticketOwner === "All Owners",
            onClick: () => {
              onFiltersChange((prev) => ({ ...prev, ticketOwner: "All Owners" }));
            },
          },
          ...extensions.map((extension) => {
            const label = resolveExtensionLabel(extension);
            return {
              label,
              value: label,
              selected: currentFilters.ticketOwner === label,
              onClick: () => {
                onFiltersChange((prev) => ({ ...prev, ticketOwner: label }));
              },
            };
          }),
        ],
      },
      buildDateTimeFilterPill(
        "createDateFrom",
        "Create date from",
        filtersRecord,
        setTicketFilters,
        stageTicketFilters,
        formatFilterDateTimeLabel,
        createDateTimeDropdownContent,
      ),
      buildDateTimeFilterPill(
        "createDateTo",
        "Create date to",
        filtersRecord,
        setTicketFilters,
        stageTicketFilters,
        formatFilterDateTimeLabel,
        createDateTimeDropdownContent,
      ),
      {
        id: "priority",
        label: "Priority",
        showDropdown: true,
        active: currentFilters.priority !== "All Priorities",
        activeLabelOnly: currentFilters.priority !== "All Priorities",
        activeLabel:
          currentFilters.priority === "All Priorities"
            ? undefined
            : currentFilters.priority,
        dropdownMenuStyle: CRM_TICKETS_FILTER_DROPDOWN_MENU_STYLE,
        onClear: () => {
          onFiltersChange((prev) => ({ ...prev, priority: "All Priorities" }));
        },
        dropdownOptions: (
          [
            { label: "All Priorities", value: "All Priorities" },
            { label: "Low", value: "Low" },
            { label: "Medium", value: "Medium" },
            { label: "High", value: "High" },
          ] as const
        ).map((option) => ({
          label: option.label,
          value: option.value,
          selected: currentFilters.priority === option.value,
          onClick: () => {
            onFiltersChange((prev) => ({
              ...prev,
              priority: option.value as CrmTicketPriority | "All Priorities",
            }));
          },
        })),
      },
    ];
  }, [
    currentFilters,
    extensions,
    onFiltersChange,
    setTicketFilters,
    stageTicketFilters,
  ]);
}
