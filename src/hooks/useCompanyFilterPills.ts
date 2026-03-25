import { useMemo } from "react";
import moment from "moment";
import type { FilterPill } from "@components/GenericTable";

type CompanyOwner = {
  id?: string | number;
  extension?: string;
  display_name?: string;
  name?: string;
};

interface UseCompanyFilterPillsOptions {
  currentFilters: Record<string, any>;
  handleFiltersChange: (filters: Record<string, any>) => void;
  refresh: () => void;
  extensions: CompanyOwner[];
}

const buildDateLabel = (from?: string, to?: string): string | undefined => {
  if (!from && !to) return undefined;
  if (from && to) {
    if (from === to) {
      return moment(from).isValid() ? moment(from).format("MMM D, YYYY") : from;
    }
    const fromLabel = moment(from).isValid() ? moment(from).format("MMM D") : from;
    const toLabel = moment(to).isValid() ? moment(to).format("MMM D") : to;
    return `${fromLabel} - ${toLabel}`;
  }
  const single = from || to;
  if (!single) return undefined;
  return moment(single).isValid() ? moment(single).format("MMM D, YYYY") : single;
};

export function useCompanyFilterPills({
  currentFilters,
  handleFiltersChange,
  refresh,
  extensions,
}: UseCompanyFilterPillsOptions): FilterPill[] {
  return useMemo<FilterPill[]>(() => {
    const applyFilters = (nextFilters: Record<string, any>) => {
      handleFiltersChange(nextFilters);
      refresh();
    };

    return [
      {
        id: "company_owner",
        label: "Company owner",
        showDropdown: true,
        active:
          Array.isArray(currentFilters.user_extension)
            ? currentFilters.user_extension.length > 0
            : !!currentFilters.user_extension,
        activeLabel: (() => {
          const ownerValue = Array.isArray(currentFilters.user_extension)
            ? currentFilters.user_extension[0]
            : currentFilters.user_extension;
          if (!ownerValue) return undefined;
          const owner = extensions.find((ext) => {
            const extKey = String(ext.id ?? ext.extension ?? "");
            return extKey === String(ownerValue);
          });
          return (
            owner?.display_name ||
            owner?.name ||
            owner?.extension ||
            String(ownerValue)
          );
        })(),
        onClear: () => {
          const newFilters = { ...currentFilters };
          delete newFilters.user_extension;
          applyFilters(newFilters);
        },
        dropdownOptions: [
          {
            label: "All Owners",
            value: "all",
            onClick: () => {
              const newFilters = { ...currentFilters };
              delete newFilters.user_extension;
              applyFilters(newFilters);
            },
          },
          ...extensions.map((ext) => ({
            label:
              ext.display_name ||
              ext.name ||
              ext.extension ||
              String(ext.id ?? ""),
            value: String(ext.id ?? ext.extension ?? ""),
            onClick: () => {
              applyFilters({
                ...currentFilters,
                user_extension: [String(ext.id ?? ext.extension ?? "")],
              });
            },
          })),
        ],
      },
      {
        id: "create_date",
        label: "Create date",
        showDropdown: true,
        active: !!currentFilters.created_at_from || !!currentFilters.created_at_to,
        activeLabel: buildDateLabel(
          currentFilters.created_at_from,
          currentFilters.created_at_to,
        ),
        onClear: () => {
          const newFilters = { ...currentFilters };
          delete newFilters.created_at_from;
          delete newFilters.created_at_to;
          applyFilters(newFilters);
        },
        dropdownOptions: [
          {
            label: "All Time",
            value: "all",
            onClick: () => {
              const newFilters = { ...currentFilters };
              delete newFilters.created_at_from;
              delete newFilters.created_at_to;
              applyFilters(newFilters);
            },
          },
          {
            label: "Today",
            value: "today",
            onClick: () => {
              const today = moment().format("YYYY-MM-DD");
              applyFilters({
                ...currentFilters,
                created_at_from: today,
                created_at_to: today,
              });
            },
          },
          {
            label: "Last 7 Days",
            value: "week",
            onClick: () => {
              const from = moment().subtract(7, "days").format("YYYY-MM-DD");
              const to = moment().format("YYYY-MM-DD");
              applyFilters({
                ...currentFilters,
                created_at_from: from,
                created_at_to: to,
              });
            },
          },
          {
            label: "Last 30 Days",
            value: "month",
            onClick: () => {
              const from = moment().subtract(30, "days").format("YYYY-MM-DD");
              const to = moment().format("YYYY-MM-DD");
              applyFilters({
                ...currentFilters,
                created_at_from: from,
                created_at_to: to,
              });
            },
          },
        ],
      },
      {
        id: "last_activity",
        label: "Last activity date",
        showDropdown: true,
        active:
          !!currentFilters.last_called_at_from || !!currentFilters.last_called_at_to,
        activeLabel: buildDateLabel(
          currentFilters.last_called_at_from,
          currentFilters.last_called_at_to,
        ),
        onClear: () => {
          const newFilters = { ...currentFilters };
          delete newFilters.last_called_at_from;
          delete newFilters.last_called_at_to;
          applyFilters(newFilters);
        },
        dropdownOptions: [
          {
            label: "All Time",
            value: "all",
            onClick: () => {
              const newFilters = { ...currentFilters };
              delete newFilters.last_called_at_from;
              delete newFilters.last_called_at_to;
              applyFilters(newFilters);
            },
          },
          {
            label: "Today",
            value: "today",
            onClick: () => {
              const today = moment().format("YYYY-MM-DD");
              applyFilters({
                ...currentFilters,
                last_called_at_from: today,
                last_called_at_to: today,
              });
            },
          },
          {
            label: "Last 7 Days",
            value: "week",
            onClick: () => {
              const from = moment().subtract(7, "days").format("YYYY-MM-DD");
              const to = moment().format("YYYY-MM-DD");
              applyFilters({
                ...currentFilters,
                last_called_at_from: from,
                last_called_at_to: to,
              });
            },
          },
          {
            label: "Last 30 Days",
            value: "month",
            onClick: () => {
              const from = moment().subtract(30, "days").format("YYYY-MM-DD");
              const to = moment().format("YYYY-MM-DD");
              applyFilters({
                ...currentFilters,
                last_called_at_from: from,
                last_called_at_to: to,
              });
            },
          },
        ],
      },
    ];
  }, [currentFilters, extensions, handleFiltersChange, refresh]);
}
