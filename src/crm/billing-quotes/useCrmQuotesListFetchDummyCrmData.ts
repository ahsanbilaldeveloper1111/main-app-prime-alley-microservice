import { useCallback, type MutableRefObject } from "react";
import type { CrmDataItem } from "@utils/crm";
import { getCrmQuotesListDummyFetchResult } from "./crmQuotesListDummyFetchResult";

export type UseCrmQuotesListFetchDummyCrmDataParams = {
  requestIdRef: MutableRefObject<number>;
  memoizedFilters: Record<string, any>;
  setLoading: (value: boolean) => void;
  setDataList: (value: CrmDataItem[]) => void;
  setTotalRecords: (value: number) => void;
  setTotalAllQuotes: (value: number) => void;
  setMetrics: (value: Record<string, any>) => void;
};

export function useCrmQuotesListFetchDummyCrmData(
  params: UseCrmQuotesListFetchDummyCrmDataParams,
) {
  const {
    requestIdRef,
    memoizedFilters,
    setLoading,
    setDataList,
    setTotalRecords,
    setTotalAllQuotes,
    setMetrics,
  } = params;

  return useCallback(async () => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    setLoading(true);
    try {
      const response = getCrmQuotesListDummyFetchResult();
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setDataList((response.data || []) as unknown as CrmDataItem[]);
      setTotalRecords(response.pagination.total || 0);

      const isAllProspects =
        memoizedFilters.has_scheduled_calls !== true &&
        memoizedFilters.has_tickets !== true;
      if (isAllProspects) {
        setTotalAllQuotes(response.pagination.total || 0);
      }

      setMetrics(response.metrics || {});
    } catch (error: unknown) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      console.error("Failed to fetch CRM data:", error);
      setDataList([]);
      setTotalRecords(0);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [
    memoizedFilters.has_scheduled_calls,
    memoizedFilters.has_tickets,
    requestIdRef,
    setDataList,
    setLoading,
    setMetrics,
    setTotalAllQuotes,
    setTotalRecords,
  ]);
}
