import axiosInstance from "@utils/axios";
import type { HistoryListRecord } from "@utils/crm";

export type FetchCrmHistoryListParams = {
  page: number;
  per_page: number;
  sort_by?: string;
  sort_order?: string;
  search?: string;
  user_extension?: string[];
  from?: string;
  to?: string;
  type?: string;
};

export type CrmHistoryListPagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type CrmHistoryListResult = {
  records: HistoryListRecord[];
  pagination: CrmHistoryListPagination;
};

export async function fetchCrmHistoryList(
  params: FetchCrmHistoryListParams,
): Promise<CrmHistoryListResult> {
  const rawResponse = await axiosInstance.get("/crm/history/list", { params });
  const responseData = rawResponse?.data?.data;
  const records = (responseData?.data || []) as HistoryListRecord[];
  const paginationInfo = responseData?.pagination || {};
  return {
    records,
    pagination: {
      current_page: paginationInfo.current_page ?? params.page,
      last_page: paginationInfo.last_page ?? 1,
      per_page: paginationInfo.per_page ?? params.per_page,
      total: paginationInfo.total ?? 0,
    },
  };
}
