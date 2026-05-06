import { ListCallLogs } from "@utils/calls";
import { ModuleSlug } from "@utils/Helper";
import { isExactPhoneMatch, normalizePhoneValue } from "@utils/phoneMatch";
import {
  extractCallLogRows,
  normalizeCallLogRow,
} from "@components/communications/callLogRowUtils";
import type { CallLogRow, CallLogsSummary } from "@components/communications/callLogTypes";

export interface CallLogsFetchHydratePayload {
  rows: CallLogRow[];
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
  totalCalls: number;
  responseSummary?: CallLogsSummary & Record<string, unknown>;
  dataFilters?: { start_datetime?: string; end_datetime?: string };
  selectedExtensionFilter: string[];
}

export async function fetchCallLogsListPayload(input: {
  page: number;
  perPage: number;
  search: string;
  appliedFilters: Record<string, unknown>;
}): Promise<CallLogsFetchHydratePayload> {
  const { page, perPage, search, appliedFilters } = input;

  const response = await ListCallLogs(
    {
      page,
      perPage,
      search,
      filters: appliedFilters,
      moduleSlug: ModuleSlug.CALL_LOGS,
    },
    "call-logs/list",
  );

  let rowsArray: CallLogRow[] = extractCallLogRows(response).map((r) =>
    normalizeCallLogRow(r as CallLogRow & Record<string, unknown>),
  );

  const exactPhoneFilter = normalizePhoneValue(
    appliedFilters.phone_number as string | undefined,
  );
  if (exactPhoneFilter) {
    rowsArray = rowsArray.filter((row) =>
      isExactPhoneMatch(row.phone_number, exactPhoneFilter),
    );
  }

  const rawData = response?.data as Record<string, unknown> | undefined;
  const paginationData =
    (rawData?.pagination as Record<string, unknown> | undefined) ??
    (response?.pagination as Record<string, unknown> | undefined) ??
    response;
  const total =
    (response as { recordsTotal?: number }).recordsTotal ??
    (response as { total?: number }).total ??
    (rawData?.recordsTotal as number | undefined) ??
    (rawData?.total as number | undefined) ??
    (paginationData as { total?: number })?.total ??
    Math.max(rowsArray.length, 0);
  const currentPage =
    (response as { current_page?: number }).current_page ??
    (paginationData as { current_page?: number })?.current_page ??
    page;
  const perPageVal =
    (response as { per_page?: number }).per_page ??
    (paginationData as { per_page?: number })?.per_page ??
    perPage;

  const selectedExtensionFilter = Array.isArray(appliedFilters.extension_number)
    ? (appliedFilters.extension_number as string[])
    : [];

  const respSummary = (response as { summary?: CallLogsSummary }).summary;
  const dataFilters = (response as {
    filters?: { start_datetime?: string; end_datetime?: string };
  }).filters;

  return {
    rows: rowsArray,
    currentPage,
    rowsPerPage: perPageVal,
    totalRows: Number(total) || 0,
    totalCalls: Number(total) || 0,
    responseSummary: respSummary as
      | (CallLogsSummary & Record<string, unknown>)
      | undefined,
    dataFilters,
    selectedExtensionFilter,
  };
}
