import moment from "moment";

/** Bar filter payload before UTC normalization (datetime-local / pending state). */
export type BarFiltersPayload = Record<string, unknown>;

export type NormalizeBarFiltersOptions = {
  /**
   * When true, removes `is_incoming_only` if empty/falsy (legacy stats pages).
   * Incoming-only reports keep `'true'` and should leave this false unless they also omit empty keys.
   */
  stripEmptyIncomingOnly?: boolean;
};

function utcIsoFromLocalStart(value: string): string {
  let startMoment = moment(value);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    startMoment = moment(`${value}:00`);
  } else if (!value.includes("T")) {
    startMoment = moment(value).startOf("day");
  }
  return `${startMoment.utc().format("YYYY-MM-DDTHH:mm:ss")}Z`;
}

function utcIsoFromLocalEnd(value: string): string {
  let endMoment = moment(value);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    const timePart = value.split("T")[1];
    endMoment =
      timePart === "23:59" ? moment(`${value}:59`) : moment(`${value}:00`);
  } else if (!value.includes("T")) {
    endMoment = moment(value).endOf("day");
  }
  return `${endMoment.utc().format("YYYY-MM-DDTHH:mm:ss")}Z`;
}

/**
 * Converts `datetime-local` style fields on pending filters to UTC ISO strings for API calls.
 */
export function normalizeBarFiltersForApi(
  filters: BarFiltersPayload,
  options: NormalizeBarFiltersOptions = {},
): BarFiltersPayload {
  const { stripEmptyIncomingOnly = false } = options;
  const formattedFilters: BarFiltersPayload = { ...filters };

  const startRaw = formattedFilters.start_datetime;
  if (typeof startRaw === "string" && startRaw.length > 0) {
    formattedFilters.start_datetime = utcIsoFromLocalStart(startRaw);
  }

  const endRaw = formattedFilters.end_datetime;
  if (typeof endRaw === "string" && endRaw.length > 0) {
    formattedFilters.end_datetime = utcIsoFromLocalEnd(endRaw);
  }

  if (stripEmptyIncomingOnly) {
    const inc = formattedFilters.is_incoming_only;
    if (!inc || inc === "") {
      delete formattedFilters.is_incoming_only;
    }
  }

  return formattedFilters;
}

export function createDefaultDayBoundaryFilters(extras?: {
  pending?: BarFiltersPayload;
  current?: BarFiltersPayload;
}): { pending: BarFiltersPayload; current: BarFiltersPayload } {
  const now = moment();
  const startDateInput = now.clone().startOf("day").format("YYYY-MM-DDTHH:mm");
  const endDateInput = now.clone().endOf("day").format("YYYY-MM-DDTHH:mm");
  const startDateUTC = `${now.clone().startOf("day").utc().format("YYYY-MM-DDTHH:mm:ss")}Z`;
  const endDateUTC = `${now.clone().endOf("day").utc().format("YYYY-MM-DDTHH:mm:ss")}Z`;

  return {
    pending: {
      start_datetime: startDateInput,
      end_datetime: endDateInput,
      ...extras?.pending,
    },
    current: {
      start_datetime: startDateUTC,
      end_datetime: endDateUTC,
      ...extras?.current,
    },
  };
}
