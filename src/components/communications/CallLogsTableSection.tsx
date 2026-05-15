import React, { useCallback, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "react-redux";
import GenericTable from "@components/GenericTable";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { ModuleSlug } from "@utils/Helper";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import type { RootState } from "@toolkit/index";
import {
  buildCallLogsStatsCardsData,
  buildCallLogsTableToolbar,
  getCallLogsTableColumns,
  type CallLogsTablePaginationState,
} from "@components/communications";
import type { CallLogRow } from "@components/communications/callLogTypes";
import { useStagedFiltersActions } from "@utils/communicationsStagedFilters";
import { useAppDispatch, useAppSelector } from "../../toolkit/hooks";
import {
  setCallLogsCurrentFilters,
  setSearchValue,
  setShowPageLoader,
  setTablePagination,
  hydrateCallLogsFetchResult,
} from "../../toolkit/callLogsList/slice";
import {
  commitCallLogsFiltersThunk,
  exportCallLogsThunk,
  resetCallLogsFiltersThunk,
} from "../../toolkit/callLogsList/thunks";
import { fetchCallLogsListPayload } from "../../toolkit/callLogsList/fetchCallLogsListPayload";
import { communicationsKeys } from "@query/keys";

const { PERMISSIONS } = HEADER_CONSTANTS;

function unknownScalarToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  switch (typeof value) {
    case "string":
    case "number":
    case "boolean":
    case "bigint":
    case "symbol":
      return String(value);
    default:
      return "";
  }
}

const CallLogsTableSection: React.FC = () => {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const queryClient = useQueryClient();

  const userPermissions = session?.user?.permissions ?? [];
  const canViewCallLogs =
    userPermissions.includes(PERMISSIONS.VIEW_CALL_LOGS) ||
    userPermissions.includes(PERMISSIONS.LIST_CALL_LOGS);
  const canExportCallLogs = userPermissions.includes(
    PERMISSIONS.EXPORT_CALL_LOGS,
  );

  const tablePagination = useAppSelector((s) => s.callLogsList.tablePagination);
  const searchValue = useAppSelector((s) => s.callLogsList.searchValue);
  const currentFilters = useAppSelector((s) => s.callLogsList.currentFilters);
  const appliedFilters = useAppSelector((s) => s.callLogsList.appliedFilters);
  const defaultFiltersCurrent = useAppSelector(
    (s) => s.callLogsList.defaultFiltersCurrent,
  );
  const summary = useAppSelector((s) => s.callLogsList.summary);
  const totalCalls = useAppSelector((s) => s.callLogsList.totalCalls);
  const refreshKey = useAppSelector((s) => s.callLogsList.refreshKey);

  const callLogData = useAppSelector((s) => s.callLogsList.callLogData);

  const filtersKey = useMemo(
    () => JSON.stringify(appliedFilters),
    [appliedFilters],
  );

  const listQueryKey = useMemo(
    () =>
      communicationsKeys.callLogs.list({
        page: tablePagination.currentPage,
        perPage: tablePagination.rowsPerPage,
        search: searchValue.trim(),
        filtersKey,
        refreshKey,
      }),
    [
      tablePagination.currentPage,
      tablePagination.rowsPerPage,
      searchValue,
      filtersKey,
      refreshKey,
    ],
  );

  const {
    data: listPayload,
    isPending: listPending,
    isFetching: listFetching,
  } = useQuery({
    queryKey: listQueryKey,
    queryFn: () =>
      fetchCallLogsListPayload({
        page: tablePagination.currentPage,
        perPage: tablePagination.rowsPerPage,
        search: searchValue.trim(),
        appliedFilters,
      }),
    enabled: canViewCallLogs,
  });

  useEffect(() => {
    if (listPayload) {
      dispatch(hydrateCallLogsFetchResult(listPayload));
    }
  }, [listPayload, dispatch]);

  useEffect(() => {
    dispatch(setShowPageLoader(listPending));
  }, [listPending, dispatch]);

  const exportMutation = useMutation({
    mutationFn: async () => {
      await dispatch(exportCallLogsThunk()).unwrap();
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: communicationsKeys.callLogs.all(),
      });
    },
  });

  const { hierarchyDataExtensions, hierarchyDataDepartments } =
    useHierarchyData(ModuleSlug.CALL_LOGS);

  const selectedExtensionIds = useMemo<string[]>(
    () =>
      Array.isArray(currentFilters.extension_number)
        ? (currentFilters.extension_number as unknown[])
            .map((value) => unknownScalarToString(value).trim())
            .filter((id) => id.length > 0)
        : [],
    [currentFilters.extension_number],
  );

  const extensionOptionsSelectedFirst = useMemo(
    () =>
      [...hierarchyDataExtensions].sort((a: unknown, b: unknown) => {
        const aId = unknownScalarToString(
          (a as { id?: unknown }).id,
        ).trim();
        const bId = unknownScalarToString(
          (b as { id?: unknown }).id,
        ).trim();
        const aSelected = selectedExtensionIds.includes(aId);
        const bSelected = selectedExtensionIds.includes(bId);
        if (aSelected === bSelected) return 0;
        return aSelected ? -1 : 1;
      }),
    [hierarchyDataExtensions, selectedExtensionIds],
  );

  const tableColumns = useMemo(() => getCallLogsTableColumns(), []);

  const statsCardsData = useMemo(
    () => buildCallLogsStatsCardsData(totalCalls, summary),
    [totalCalls, summary],
  );

  const setTablePaginationState = useCallback(
    (
      update: React.SetStateAction<CallLogsTablePaginationState>,
    ) => {
      const prev = store.getState().callLogsList.tablePagination;
      const next =
        typeof update === "function"
          ? (update as (p: CallLogsTablePaginationState) => CallLogsTablePaginationState)(
              prev,
            )
          : update;
      dispatch(setTablePagination(next));
    },
    [dispatch, store],
  );

  const fetchCallLogs = useCallback(
    (page = 1, perPage = 15, _search?: string): Promise<unknown> => {
      const prev = store.getState().callLogsList.tablePagination;
      dispatch(
        setTablePagination({
          ...prev,
          currentPage: page,
          rowsPerPage: perPage,
        }),
      );
      return Promise.resolve();
    },
    [dispatch, store],
  );

  const stageFilters = useCallback(
    (nextFilters: Record<string, unknown>) => {
      dispatch(setCallLogsCurrentFilters(nextFilters));
    },
    [dispatch],
  );

  const applyCommitted = useCallback(
    (filters: Record<string, unknown>) => {
      dispatch(commitCallLogsFiltersThunk(filters)).catch(() => {
        /* commit filters failed */
      });
    },
    [dispatch],
  );

  const {
    handleApplyFiltersClick,
    hasUnappliedFilterChanges,
    hasNonDefaultFilters,
  } = useStagedFiltersActions(
    currentFilters,
    appliedFilters,
    defaultFiltersCurrent,
    (f) => dispatch(setCallLogsCurrentFilters(f)),
    applyCommitted,
  );

  const handleResetFiltersClick = useCallback(() => {
    dispatch(resetCallLogsFiltersThunk()).catch(() => {
      /* reset filters failed */
    });
  }, [dispatch]);

  const handleExport = useCallback(() => {
    exportMutation.mutate();
  }, [exportMutation]);

  const tableToolbar = useMemo(
    () =>
      buildCallLogsTableToolbar({
        canExportCallLogs,
        searchValue,
        setSearchValue: (value: string) => dispatch(setSearchValue(value)),
        tablePaginationRowsPerPage: tablePagination.rowsPerPage,
        setTablePagination: setTablePaginationState,
        fetchCallLogs,
        currentFilters,
        stageFilters,
        setCurrentFilters: (f) => dispatch(setCallLogsCurrentFilters(f)),
        extensionOptionsSelectedFirst,
        hierarchyDataDepartments,
        handleExport,
        handleApplyFiltersClick,
        handleResetFiltersClick,
        hasUnappliedFilterChanges,
        hasNonDefaultFilters,
      }),
    [
      canExportCallLogs,
      searchValue,
      dispatch,
      tablePagination.rowsPerPage,
      setTablePaginationState,
      fetchCallLogs,
      currentFilters,
      stageFilters,
      extensionOptionsSelectedFirst,
      hierarchyDataDepartments,
      handleExport,
      handleApplyFiltersClick,
      handleResetFiltersClick,
      hasUnappliedFilterChanges,
      hasNonDefaultFilters,
    ],
  );

  const tableLoading = listPending || listFetching;

  if (!canViewCallLogs) {
    return null;
  }

  return (
    <GenericTable<CallLogRow>
      data={callLogData}
      columns={tableColumns}
      loading={tableLoading}
      emptyMessage="No call logs found."
      loadingMessage="Loading call logs..."
      showToolbar={true}
      toolbar={tableToolbar}
      showToolbarActions={false}
      statsCards={statsCardsData}
      metricsGridMinWidth="180px"
      pagination={{
        currentPage: tablePagination.currentPage,
        rowsPerPage: tablePagination.rowsPerPage,
        totalRows: tablePagination.totalRows,
        pageSizeOptions: tablePagination.pageSizeOptions,
      }}
      onPaginationChange={(page, rowsPerPage) => {
        const prev = store.getState().callLogsList.tablePagination;
        dispatch(
          setTablePagination({
            ...prev,
            currentPage: page,
            rowsPerPage,
          }),
        );
      }}
      sortable={true}
      hover={true}
      striped={false}
      uniqueKey="id"
    />
  );
};

export default CallLogsTableSection;
