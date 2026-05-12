import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { GetHierarchyData } from "@utils/users";
import { ModuleSlug } from "@utils/Helper";
import { crmAppKeys } from "../query/keys";
import { fetchCrmHistoryList } from "../query/fetchCrmHistoryList";
import { mapCrmActivityHistoryRecords } from "../query/mapCrmActivityHistoryRecords";
import { fetchCrmActivityHistoryRecordDetail } from "../query/fetchCrmActivityHistoryRecordDetail";
import type {
  HistoryActivityFiltersState,
  HistoryPaginationState,
} from "@page-modules/crm/activities/activityHistoryPageTypes";
import {
  buildHistoryListParams,
  mergeHistoryPagination,
} from "@page-modules/crm/activities/activityHistoryListParams";
import type { Dispatch, SetStateAction } from "react";

function toSafeIdString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") {
    return value.toString();
  }
  return "";
}

function toRecordIdString(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  return String(raw);
}

type UseCrmActivityHistoryPageDataArgs = {
  pagination: HistoryPaginationState;
  setPagination: Dispatch<SetStateAction<HistoryPaginationState>>;
  activitySearch: string;
  activityTypeFilter: string;
  activityFilters: HistoryActivityFiltersState;
  selectedActivityRecord: unknown;
  showActivitySidebar: boolean;
  showActivityTimelineModal: boolean;
};

export function useCrmActivityHistoryPageData({
  pagination,
  setPagination,
  activitySearch,
  activityTypeFilter,
  activityFilters,
  selectedActivityRecord,
  showActivitySidebar,
  showActivityTimelineModal,
}: UseCrmActivityHistoryPageDataArgs) {
  const hierarchyQuery = useQuery({
    queryKey: crmAppKeys.hierarchyExtensions.module(ModuleSlug.CRM_HISTORY),
    queryFn: async () => {
      const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_HISTORY);
      return hierarchyData?.extensions ?? [];
    },
  });

  const extensions = hierarchyQuery.data ?? [];

  const extensionsStamp = useMemo(
    () =>
      extensions
        .map(
          (e: { id?: unknown; extension?: unknown }) =>
            `${toSafeIdString(e?.id)}:${toSafeIdString(e?.extension)}`,
        )
        .join("|"),
    [extensions],
  );

  const agentsKey = useMemo(
    () =>
      JSON.stringify(
        [...activityFilters.agents]
          .map(String)
          .sort((a, b) => a.localeCompare(b)),
      ),
    [activityFilters.agents],
  );

  const historyListQuery = useQuery({
    queryKey: crmAppKeys.activityHistory.list({
      page: pagination.current_page,
      perPage: pagination.per_page,
      sortBy: pagination.sort_by,
      sortOrder: pagination.sort_order,
      search: activitySearch,
      typeTab: activityTypeFilter,
      agentsKey,
      dateFrom: activityFilters.dateRange.start,
      dateTo: activityFilters.dateRange.end,
      extensionsStamp,
    }),
    queryFn: async () => {
      const params = buildHistoryListParams({
        pagination,
        activitySearch,
        activityFilters,
        activityTypeFilter,
      });
      const raw = await fetchCrmHistoryList(params);
      const rows = mapCrmActivityHistoryRecords(raw.records, extensions);
      return { rows, pagination: raw.pagination };
    },
    enabled: hierarchyQuery.isFetched,
  });

  const allActivityRecords = historyListQuery.data?.rows ?? [];
  const loading =
    hierarchyQuery.isPending ||
    hierarchyQuery.isFetching ||
    historyListQuery.isPending ||
    historyListQuery.isFetching;

  useEffect(() => {
    const p = historyListQuery.data?.pagination;
    if (!p) return;
    setPagination((prev) => mergeHistoryPagination(prev, p));
  }, [historyListQuery.data?.pagination, setPagination]);

  useEffect(() => {
    if (!hierarchyQuery.isFetched) return;
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  }, [
    activityFilters.agents,
    activityFilters.dateRange.start,
    activityFilters.dateRange.end,
    activityTypeFilter,
    hierarchyQuery.isFetched,
    setPagination,
  ]);

  const detailOpen = Boolean(
    selectedActivityRecord &&
      (showActivitySidebar || showActivityTimelineModal),
  );
  const recordTypeStr = String(
    (selectedActivityRecord as { type?: unknown })?.type ?? "",
  ).toLowerCase();
  const recordIdRaw =
    (selectedActivityRecord as { record_id?: unknown; id?: unknown })
      ?.record_id ??
    (selectedActivityRecord as { id?: unknown })?.id;
  const recordIdStr = toRecordIdString(recordIdRaw);

  const detailQuery = useQuery({
    queryKey: crmAppKeys.activityHistory.recordDetail({
      recordType: recordTypeStr,
      recordId: recordIdStr,
      open: detailOpen,
    }),
    queryFn: () => {
      const rid = recordIdRaw;
      const recordId: string | number =
        typeof rid === "string" || typeof rid === "number"
          ? rid
          : String(rid ?? "");
      return fetchCrmActivityHistoryRecordDetail({
        recordType: recordTypeStr,
        recordId,
      });
    },
    enabled: detailOpen && Boolean(recordIdStr && recordTypeStr),
  });

  const historyChain = detailOpen ? detailQuery.data?.historyChain ?? [] : [];
  const recordStages = detailOpen ? detailQuery.data?.recordStages ?? [] : [];
  const currentStageIndex = detailOpen
    ? detailQuery.data?.currentStageIndex ?? 0
    : 0;
  const crmData = detailOpen ? detailQuery.data?.crmData ?? null : null;
  const loadingHistory =
    detailOpen && (detailQuery.isPending || detailQuery.isFetching);
  const loadingCrmData =
    detailOpen && (detailQuery.isPending || detailQuery.isFetching);

  return {
    extensions,
    allActivityRecords,
    loading,
    historyChain,
    recordStages,
    currentStageIndex,
    crmData,
    loadingHistory,
    loadingCrmData,
  };
}
