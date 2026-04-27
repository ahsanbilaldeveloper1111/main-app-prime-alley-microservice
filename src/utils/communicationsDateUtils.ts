import moment from "moment";

export function getDefaultCommunicationsDateFilterPair(
  startKey: string,
  endKey: string,
): { current: Record<string, string>; applied: Record<string, string> } {
  const now = moment();
  const startDateApi =
    now.clone().startOf("day").utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";
  const endDateApi =
    now.clone().endOf("day").utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";
  const startDateUi = now.clone().startOf("day").format("YYYY-MM-DDTHH:mm");
  const endDateUi = now.clone().endOf("day").format("YYYY-MM-DDTHH:mm");
  return {
    current: { [startKey]: startDateUi, [endKey]: endDateUi },
    applied: { [startKey]: startDateApi, [endKey]: endDateApi },
  };
}

export function formatDateTimeFilterForApi(
  value: string | undefined,
  endOfDay: boolean,
): string | undefined {
  if (!value) return value;
  let parsed = moment(value);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    const timePart = value.split("T")[1];
    const seconds = endOfDay && timePart === "23:59" ? "59" : "00";
    parsed = moment(`${value}:${seconds}`);
  } else if (!value.includes("T")) {
    parsed = endOfDay ? moment(value).endOf("day") : moment(value).startOf("day");
  }
  return parsed.utc().format("YYYY-MM-DDTHH:mm:ss") + "Z";
}

export function shouldSkipCommunicationsListFetch(
  isFetching: boolean,
  paramsKey: string,
  lastParamsKey: string,
  lastFetchTime: number,
  now: number,
): boolean {
  if (isFetching && lastParamsKey === paramsKey && now - lastFetchTime < 500) {
    return true;
  }
  if (lastParamsKey === paramsKey && now - lastFetchTime < 100) {
    return true;
  }
  return false;
}

export function formatFilterDateTimeLabel(value: unknown): string | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = moment(value);
  if (!parsed.isValid()) return String(value);
  return parsed.format("DD MMM YYYY, hh:mm A");
}
