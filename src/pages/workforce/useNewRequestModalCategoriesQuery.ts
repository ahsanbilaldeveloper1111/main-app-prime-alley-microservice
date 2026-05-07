import { useQuery } from "@tanstack/react-query";
import {
  getUserRequestCategories,
  type UserRequestCategory,
} from "@utils/staffManagement";
import { workforceKeys } from "../../query/keys";

export type NewRequestCategoryWithChildren = UserRequestCategory & {
  children?: Array<{ id: number; name?: string | null; code?: string | null; is_active?: boolean }>;
};

async function fetchNewRequestModalCategories(): Promise<NewRequestCategoryWithChildren[]> {
  const { data } = await getUserRequestCategories({ limit: 100, is_active: true });
  return (data ?? []) as NewRequestCategoryWithChildren[];
}

export function useNewRequestModalCategoriesQuery(enabled: boolean) {
  return useQuery({
    queryKey: workforceKeys.requestCategories.newRequestModalCategories(),
    queryFn: fetchNewRequestModalCategories,
    enabled,
    staleTime: 60 * 1000,
  });
}
