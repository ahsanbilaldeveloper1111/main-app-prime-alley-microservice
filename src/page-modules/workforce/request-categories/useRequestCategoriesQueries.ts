import { useQuery } from "@tanstack/react-query";
import {
  getUserRequestCategories,
  getUserRequestCategoryFields,
  type UserRequestCategory,
  type UserRequestCategoryField,
} from "@utils/staffManagement";
import { workforceKeys } from "@query/keys";
import { consumeHandledApiError } from "./requestCategoriesDomain";

export interface RequestCategoriesListResult {
  data: UserRequestCategory[];
  pagination: { page: number; limit: number; total: number; last_page: number } | null;
}

export function useRequestCategoriesListQuery(params: Readonly<{
  companyIdentifier: string | null;
  page: number;
  limit: number;
  search: string;
}>) {
  const { companyIdentifier, page, limit, search } = params;

  return useQuery({
    queryKey: workforceKeys.requestCategories.list({ page, limit, search }),
    queryFn: async (): Promise<RequestCategoriesListResult> => {
      try {
        const { data, pagination: p } = await getUserRequestCategories({
          page,
          limit,
          parent_id: null,
          children: false,
          search,
        });
        return {
          data: data ?? [],
          pagination: p
            ? { page: p.page, limit: p.limit, total: p.total, last_page: p.last_page }
            : null,
        };
      } catch (error: unknown) {
        consumeHandledApiError(error, "RequestCategories.useRequestCategoriesListQuery");
        return { data: [], pagination: null };
      }
    },
    enabled: Boolean(companyIdentifier),
    placeholderData: (previousData) => previousData,
  });
}

export function useRequestCategoryChildrenQuery(
  parentId: number | null,
  enabled: boolean,
  companyIdentifier: string | null,
) {
  return useQuery({
    queryKey: workforceKeys.requestCategories.children(parentId ?? 0),
    queryFn: async (): Promise<UserRequestCategory[]> => {
      if (parentId == null) return [];
      try {
        const { data } = await getUserRequestCategories({ parent_id: parentId, limit: 500 });
        return data ?? [];
      } catch (error: unknown) {
        consumeHandledApiError(error, "RequestCategories.useRequestCategoryChildrenQuery");
        return [];
      }
    },
    enabled: Boolean(enabled && parentId != null && companyIdentifier),
  });
}

export function useRequestCategoryFieldsQuery(
  categoryId: number | null,
  enabled: boolean,
  companyIdentifier: string | null,
) {
  return useQuery({
    queryKey: workforceKeys.requestCategories.fields(categoryId ?? 0),
    queryFn: async (): Promise<UserRequestCategoryField[]> => {
      if (categoryId == null) return [];
      try {
        const list = await getUserRequestCategoryFields(categoryId);
        return list ?? [];
      } catch (error: unknown) {
        consumeHandledApiError(error, "RequestCategories.useRequestCategoryFieldsQuery");
        return [];
      }
    },
    enabled: Boolean(enabled && categoryId != null && companyIdentifier),
  });
}

export function useRequestSubCategoriesListQuery(
  params: Readonly<{
    companyIdentifier: string | null;
    page: number;
    limit: number;
  }>,
) {
  const { companyIdentifier, page, limit } = params;

  return useQuery({
    queryKey: workforceKeys.requestCategories.subCategoriesList({ page, limit }),
    queryFn: async (): Promise<RequestCategoriesListResult> => {
      try {
        const { data, pagination: p } = await getUserRequestCategories({
          page,
          limit,
          children: true,
        });
        return {
          data: data ?? [],
          pagination: p
            ? { page: p.page, limit: p.limit, total: p.total, last_page: p.last_page }
            : null,
        };
      } catch (error: unknown) {
        consumeHandledApiError(error, "SubCategories.useRequestSubCategoriesListQuery");
        return { data: [], pagination: null };
      }
    },
    enabled: Boolean(companyIdentifier),
    placeholderData: (previousData) => previousData,
  });
}
