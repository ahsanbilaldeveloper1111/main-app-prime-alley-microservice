import moment from "moment";

import { formatDateTimeFilterForApi } from "@utils/communicationsDateUtils";

export function getDatesFromFilters(filters: Record<string, unknown>): {
  startDate: string;
  endDate: string;
} {
  const defaultStartDate =
    moment().subtract(1, "day").startOf("day").utc().format("YYYY-MM-DDTHH:mm:ss") +
    "Z";
  const defaultEndDate =
    moment().endOf("day").utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";

  let startDate = defaultStartDate;
  let endDate = defaultEndDate;

  const startRaw = filters.start_datetime;
  if (typeof startRaw === "string" && startRaw.trim()) {
    startDate =
      formatDateTimeFilterForApi(startRaw, false) ?? defaultStartDate;
  }

  const endRaw = filters.end_datetime;
  if (typeof endRaw === "string" && endRaw.trim()) {
    endDate = formatDateTimeFilterForApi(endRaw, true) ?? defaultEndDate;
  }

  return { startDate, endDate };
}
