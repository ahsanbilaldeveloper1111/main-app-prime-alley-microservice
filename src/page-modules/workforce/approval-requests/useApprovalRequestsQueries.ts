import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getUserRequestCategories,
  getUserRequestCategoryFields,
  getUserRequests,
  getUserRequest,
  getUserRequestApprovalInfo,
  type UserRequest,
  type UserRequestCategory,
  type UserRequestCategoryField,
} from "@utils/staffManagement";
import { workforceKeys } from "../../../query/keys";
import {
  buildUserRequestsListApiParams,
  serializeApprovalRequestsListFiltersKey,
  type ApprovalRequestsListFilters,
  type UserRequestApprovalInfo,
} from "./approvalRequestsDomain";

export type ApprovalRequestsPagination = Readonly<{
  page: number;
  limit: number;
  total: number;
  last_page: number;
}>;

export type ApprovalRequestsListResult = Readonly<{
  requests: UserRequest[];
  pagination: ApprovalRequestsPagination | null;
}>;

async function fetchApprovalCategoriesBundle(): Promise<{
  categories: UserRequestCategory[];
  categoryFields: Record<number, UserRequestCategoryField[]>;
}> {
  const { data } = await getUserRequestCategories({
    limit: 100,
    is_active: true,
    parent_id: null,
    children: false,
  });
  const parentsOnly = (data ?? []).filter((c) => c.parent_id == null);
  const fieldsByCategory: Array<{ id: number; fields: UserRequestCategoryField[] }> =
    parentsOnly.length === 0
      ? []
      : await Promise.all(
          parentsOnly.map(async (cat: UserRequestCategory) => {
            try {
              const fields = await getUserRequestCategoryFields(cat.id);
              return { id: cat.id, fields };
            } catch (err) {
              console.error(`Failed to load fields for category ${cat.id}`, err);
              return { id: cat.id, fields: [] };
            }
          }),
        );
  const map: Record<number, UserRequestCategoryField[]> = {};
  fieldsByCategory.forEach(({ id, fields }) => {
    map[id] = fields ?? [];
  });
  return { categories: parentsOnly, categoryFields: map };
}

export function useApprovalRequestCategoriesBundleQuery() {
  return useQuery({
    queryKey: workforceKeys.approvalRequests.categoriesBundle(),
    queryFn: fetchApprovalCategoriesBundle,
    staleTime: 5 * 60 * 1000,
  });
}

async function fetchApprovalRequestsListPayload(args: Readonly<{
  page: number;
  limit: number;
  filters: ApprovalRequestsListFilters;
  categories: readonly UserRequestCategory[];
}>): Promise<ApprovalRequestsListResult> {
  try {
    const params = buildUserRequestsListApiParams(args);
    const { data, pagination: p } = await getUserRequests(params);
    const requests = data ?? [];
    if (!p) {
      return { requests, pagination: null };
    }
    return {
      requests,
      pagination: {
        page: p.page,
        limit: p.limit,
        total: p.total,
        last_page: p.last_page,
      },
    };
  } catch (err) {
    console.error("[ApprovalRequests] list fetch error", err);
    return { requests: [], pagination: null };
  }
}

export function useApprovalRequestsListQuery(args: Readonly<{
  page: number;
  limit: number;
  filters: ApprovalRequestsListFilters;
  categories: readonly UserRequestCategory[];
}>) {
  const filtersKey = serializeApprovalRequestsListFiltersKey(args.filters, args.categories);
  return useQuery({
    queryKey: workforceKeys.approvalRequests.list({
      page: args.page,
      limit: args.limit,
      filtersKey,
    }),
    queryFn: () =>
      fetchApprovalRequestsListPayload({
        page: args.page,
        limit: args.limit,
        filters: args.filters,
        categories: args.categories,
      }),
    placeholderData: keepPreviousData,
  });
}

export function useApprovalRequestDetailQuery(
  requestId: number | null,
  placeholderRow: UserRequest | null | undefined,
) {
  return useQuery({
    queryKey: workforceKeys.approvalRequests.detail(requestId ?? 0),
    queryFn: async () => {
      const id = requestId;
      if (id == null) throw new Error("Missing approval request id");
      return getUserRequest(id);
    },
    enabled: requestId != null,
    placeholderData: placeholderRow ?? undefined,
  });
}

export function useApprovalRequestApprovalInfoQuery(requestId: number | null) {
  return useQuery({
    queryKey: workforceKeys.approvalRequests.approvalInfo(requestId ?? 0),
    queryFn: async (): Promise<UserRequestApprovalInfo | null> => {
      try {
        const id = requestId;
        if (id == null) return null;
        const raw = await getUserRequestApprovalInfo(id);
        return raw as UserRequestApprovalInfo;
      } catch {
        return null;
      }
    },
    enabled: requestId != null,
  });
}
