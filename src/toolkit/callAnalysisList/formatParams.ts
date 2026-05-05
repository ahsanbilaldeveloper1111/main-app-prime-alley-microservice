import moment from "moment";

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
    if (startRaw.endsWith("Z") || startRaw.includes("T")) {
      startDate = startRaw;
    } else {
      startDate = moment(startRaw).utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";
    }
  }

  const endRaw = filters.end_datetime;
  if (typeof endRaw === "string" && endRaw.trim()) {
    if (endRaw.endsWith("Z") || endRaw.includes("T")) {
      endDate = endRaw;
    } else {
      endDate = moment(endRaw).utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";
    }
  }

  return { startDate, endDate };
}
