import type { QueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { invalidateUserRequestCategoryFields } from "./invalidateRequestCategoriesQueries";

/** Errors are surfaced by react-query `onError` / shared toast helpers. */
export async function runMutationWithQuietCatch(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch {
    // handled by mutation layer
  }
}

export function toastSuccessAndInvalidateCategoryFields(
  queryClient: QueryClient,
  categoryId: number,
  message: string,
): void {
  toast.success(message);
  invalidateUserRequestCategoryFields(queryClient, categoryId);
}
