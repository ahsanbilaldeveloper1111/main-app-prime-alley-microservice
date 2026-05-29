import type { FilterField } from "@components/GenericFilterSidebar";
import { toDateTimeLocalInputValue } from "@utils/communications/communicationsDateExtensionFilters";
import type { CrmTicketAppliedFilters } from "@components/crm/tickets/crmTicketsListDomain";

type TicketHierarchyExtension = {
  id?: unknown;
  display_name?: string;
  name?: string;
};

type FiltersUpdater =
  | CrmTicketAppliedFilters
  | ((prev: CrmTicketAppliedFilters) => CrmTicketAppliedFilters);

export function buildCrmTicketsFilterFields(
  currentFilters: CrmTicketAppliedFilters,
  onFiltersChange: (update: FiltersUpdater) => void,
  extensions: TicketHierarchyExtension[],
): FilterField[] {
  return [
    {
      id: "ticketOwner",
      label: "Ticket owner",
      type: "dropdown",
      value: currentFilters.ticketOwner,
      onChange: (value) =>
        onFiltersChange((prev) => ({
          ...prev,
          ticketOwner: value || "All Owners",
        })),
      options: [
        { value: "All Owners", label: "All Owners" },
        ...extensions.map((extension) => {
          const label =
            extension.display_name ||
            extension.name ||
            String(extension.id ?? "");
          return { value: label, label };
        }),
      ],
    },
    {
      id: "createDateFrom",
      label: "Create date from",
      type: "datetime",
      value: toDateTimeLocalInputValue(currentFilters.createDateFrom, "start"),
      onChange: (value) =>
        onFiltersChange((prev) => ({
          ...prev,
          createDateFrom: value || "",
        })),
    },
    {
      id: "createDateTo",
      label: "Create date to",
      type: "datetime",
      value: toDateTimeLocalInputValue(currentFilters.createDateTo, "end"),
      onChange: (value) =>
        onFiltersChange((prev) => ({
          ...prev,
          createDateTo: value || "",
        })),
    },
    {
      id: "priority",
      label: "Priority",
      type: "dropdown",
      value: currentFilters.priority,
      onChange: (value) =>
        onFiltersChange((prev) => ({
          ...prev,
          priority: value || "All Priorities",
        })),
      options: [
        { value: "All Priorities", label: "All Priorities" },
        { value: "Low", label: "Low" },
        { value: "Medium", label: "Medium" },
        { value: "High", label: "High" },
      ],
    },
  ];
}
