import moment from "moment";

export type CrmListExportDateRangeKeyPair = { from: string; to: string };

export type CrmListExportModalDateRangeField = {
  label: string;
  keys: CrmListExportDateRangeKeyPair;
};

/**
 * Shared CRM export modal: map stored from/to filter values to preset select value.
 */
export function crmListExportDateRangePresetValue(
  filters: Record<string, any>,
  keys: CrmListExportDateRangeKeyPair,
): string {
  const from = filters[keys.from];
  const to = filters[keys.to];
  if (!from || !to) return "all";
  const days = moment(to).diff(moment(from), "days");
  if (days === 0) return "today";
  if (days >= 6 && days <= 8) return "week";
  if (days >= 28 && days <= 31) return "month";
  return "all";
}

/**
 * Apply a date-range preset (all | today | week | month) to export filter state.
 */
export function applyCrmListExportDateRangePreset(
  prev: Record<string, any>,
  preset: string,
  keys: CrmListExportDateRangeKeyPair,
): Record<string, any> {
  const next = { ...prev };
  if (preset === "all") {
    delete next[keys.from];
    delete next[keys.to];
  } else {
    const today = moment().format("YYYY-MM-DD");
    if (preset === "today") {
      next[keys.from] = today;
      next[keys.to] = today;
    } else if (preset === "week") {
      next[keys.from] = moment().subtract(7, "days").format("YYYY-MM-DD");
      next[keys.to] = today;
    } else {
      next[keys.from] = moment().subtract(30, "days").format("YYYY-MM-DD");
      next[keys.to] = today;
    }
  }
  return next;
}

/** Create date + last activity presets used by prospects, quotes, and similar CRM exports. */
export const CRM_LIST_EXPORT_MODAL_DEFAULT_DATE_RANGE_FIELDS: CrmListExportModalDateRangeField[] =
  [
    {
      label: "Create date",
      keys: { from: "created_at_from", to: "created_at_to" },
    },
    {
      label: "Last activity date",
      keys: { from: "last_called_at_from", to: "last_called_at_to" },
    },
  ];
