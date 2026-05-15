import type { QueryClient } from "@tanstack/react-query";
import { workforceKeys } from "@query/keys";
import { consumeHandledApiError } from "./requestCategoriesDomain";

export function invalidateAllUserRequestCategories(queryClient: QueryClient): void {
  queryClient
    .invalidateQueries({ queryKey: workforceKeys.requestCategories.all() })
    .catch((e: unknown) => {
      consumeHandledApiError(e, "RequestCategories.invalidateAll");
    });
}

export function invalidateUserRequestCategoryFields(
  queryClient: QueryClient,
  categoryId: number,
): void {
  queryClient
    .invalidateQueries({
      queryKey: workforceKeys.requestCategories.fields(categoryId),
    })
    .catch((e: unknown) => {
      consumeHandledApiError(e, "RequestCategories.invalidateFields");
    });
}
