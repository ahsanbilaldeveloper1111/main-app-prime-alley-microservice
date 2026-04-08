import { useCallback, useState } from "react";

export type TasksListingPagerState = Readonly<{
  page: number;
  perPage: number;
  sortCol: string;
  sortDir: "asc" | "desc";
}>;

export function useTasksListingPager(
  initial?: Partial<TasksListingPagerState>,
) {
  const [pager, setPager] = useState<TasksListingPagerState>(() => ({
    page: 1,
    perPage: 25,
    sortCol: "due_date",
    sortDir: "asc",
    ...initial,
  }));

  const resetToFirstPage = useCallback(() => {
    setPager((p) => ({ ...p, page: 1 }));
  }, []);

  return { pager, setPager, resetToFirstPage };
}
