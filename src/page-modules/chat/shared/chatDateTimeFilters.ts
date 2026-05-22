import moment from "moment";

import {
  formatEndDateValueForApi,
  formatStartDateValueForApi,
} from "@utils/communications/communicationsDateExtensionFilters";

export type ChatDateTimeFilterBound = "from" | "to";

/** Map UI `datetime-local` value to `YYYY-MM-DD` for chat history APIs. */
export function chatDateTimeUiToApiDate(
  uiValue: string,
  bound: ChatDateTimeFilterBound,
): string | undefined {
  const trimmed = uiValue.trim();
  if (!trimmed) return undefined;

  const iso =
    bound === "from"
      ? formatStartDateValueForApi(trimmed)
      : formatEndDateValueForApi(trimmed);

  return moment(iso).utc().format("YYYY-MM-DD");
}
