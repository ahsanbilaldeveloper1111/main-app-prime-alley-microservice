import { ListCallLogs } from "@utils/calls";
import { ModuleSlug } from "@utils/Helper";
import { isExactPhoneMatch, normalizePhoneValue } from "@utils/phoneMatch";
import type { CallRecordingsPagination, CallRecordingsSummary } from "./slice";
import {
  buildDirectionChartModel,
  buildDurationChartFromExtension,
  type DirectionChartModel,
  type DurationChartModel,
} from "./chartBuilders";

function getRowsArray(response: unknown): Record<string, unknown>[] {
  const r = response as Record<string, unknown> | undefined;
  const rawData = r?.data as Record<string, unknown> | unknown[] | undefined;
  if (Array.isArray(rawData)) return rawData as Record<string, unknown>[];
  if (
    rawData &&
    typeof rawData === "object" &&
    Array.isArray((rawData as { data?: unknown[] }).data)
  ) {
    return (rawData as { data: Record<string, unknown>[] }).data;
  }
  if (Array.isArray(r?.dataList)) {
    return r.dataList as Record<string, unknown>[];
  }
  return [];
}

function buildPaginationFromResponse(
  response: unknown,
  rowsArray: unknown[],
  page: number,
  perPage: number,
): CallRecordingsPagination {
  const r = response as Record<string, unknown>;
  const rawData = r?.data as Record<string, unknown> | undefined;
  const paginationData =
    (rawData?.pagination as Record<string, unknown> | undefined) ??
    (r?.pagination as Record<string, unknown> | undefined) ??
    r;
  const total =
    (r.recordsTotal as number | undefined) ??
    (r.total as number | undefined) ??
    (rawData?.recordsTotal as number | undefined) ??
    (rawData?.total as number | undefined) ??
    (paginationData as { total?: number })?.total ??
    rowsArray.length;

  const currentPage =
    (r.current_page as number | undefined) ??
    (paginationData as { current_page?: number })?.current_page ??
    page;
  const perPageVal =
    (r.per_page as number | undefined) ??
    (paginationData as { per_page?: number })?.per_page ??
    perPage;

  const totalNum = Number(total) || 0;
  const lastPage =
    (paginationData as { last_page?: number })?.last_page ??
    (r.last_page as number | undefined) ??
    Math.max(1, Math.ceil(totalNum / perPageVal));

  return {
    totalRows: totalNum,
    totalPages: Number(lastPage) || 1,
    currentPage,
    perPage: perPageVal,
  };
}

export interface CallRecordingsFetchHydratePayload {
  tableData: Record<string, unknown>[];
  summary?: CallRecordingsSummary;
  dataFilters?: { start_date?: string; end_date?: string };
  pagination: CallRecordingsPagination;
  durationChart: DurationChartModel | null;
  directionChart: DirectionChartModel | null;
  chartLoading: boolean;
}

export async function fetchCallRecordingsListPayload(input: {
  page: number;
  perPage: number;
  search: string;
  appliedFilters: Record<string, unknown>;
}): Promise<CallRecordingsFetchHydratePayload> {
  const { page, perPage, search, appliedFilters } = input;

  const response = await ListCallLogs(
    {
      page,
      perPage,
      search,
      filters: appliedFilters,
      reportType: "recordings",
      moduleSlug: ModuleSlug.CALL_RECORDINGS,
    },
    "call-logs/recordings",
  );

  const resp = response as Record<string, unknown>;
  const summary = resp.summary as CallRecordingsSummary | undefined;
  const dataFilters = resp.filters as
    | { start_date?: string; end_date?: string }
    | undefined;

  let rowsArray = getRowsArray(response);

  const rawRemoteFilter = appliedFilters.remote_party_number;
  const exactRemoteFilter = Array.isArray(rawRemoteFilter)
    ? normalizePhoneValue(String(rawRemoteFilter[0]))
    : normalizePhoneValue(rawRemoteFilter as string | undefined);
  if (exactRemoteFilter) {
    rowsArray = rowsArray.filter((row) =>
      isExactPhoneMatch(
        row.RemotePartyNumber as string | undefined,
        exactRemoteFilter,
      ),
    );
  }

  const pagination = buildPaginationFromResponse(
    response,
    rowsArray,
    page,
    perPage,
  );

  const chart = resp.chart as
    | { extension?: unknown[]; date?: unknown[] }
    | undefined;

  const durationChart = buildDurationChartFromExtension(
    chart?.extension ?? [],
  );
  const directionChart = buildDirectionChartModel(chart?.date ?? []);

  return {
    tableData: rowsArray,
    summary,
    dataFilters,
    pagination,
    durationChart,
    directionChart,
    chartLoading: false,
  };
}
