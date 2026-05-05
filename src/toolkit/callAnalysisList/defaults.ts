import moment from "moment";

/** Default date range used on first load (1 day ago start → end of today, UTC). */
export function getDefaultCallAnalysisFilters(): Record<string, unknown> {
  return {
    start_datetime:
      moment().subtract(1, "day").startOf("day").utc().format("YYYY-MM-DDTHH:mm:ss") +
      "Z",
    end_datetime:
      moment().endOf("day").utc().format("YYYY-MM-DDTHH:mm:ss") + "Z",
  };
}
