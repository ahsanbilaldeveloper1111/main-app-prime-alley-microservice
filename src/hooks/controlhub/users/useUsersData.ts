import { useState, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAllUsers } from "@utils/users";
import { Column } from "@components/CustomDataTable";
import { SummaryCard } from "@components/PageSummaryGrid";
import { controlhubKeys } from "../../../query/keys";

interface Summary {
  users: number;
  departments: number;
  ranks: number;
  groups: number;
  activeUsers: number;
}

export const useUsersData = (
  _session: unknown,
  _initialBaseColumns: Column[],
  roleId?: string,
) => {
  const queryClient = useQueryClient();
  const [customFieldColumns, setCustomFieldColumns] = useState<Column[]>([]);
  const [currentFilters, setCurrentFilters] = useState<Record<string, unknown>>(() => {
    const filters: Record<string, unknown> = {};
    if (roleId) {
      filters.role_id = roleId;
    }
    return filters;
  });
  const [summary, setSummary] = useState<Summary>({
    users: 0,
    departments: 0,
    ranks: 0,
    groups: 0,
    activeUsers: 0,
  });

  const invalidateUsersList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: controlhubKeys.users.all() }).then(() => undefined);
  }, [queryClient]);

  const fetchUsers = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      const filters: Record<string, unknown> = { ...currentFilters };
      if (roleId) {
        filters.role_id = roleId;
      }
      const filtersKey = JSON.stringify(filters);
      const response = await queryClient.fetchQuery({
        queryKey: controlhubKeys.users.list({
          page,
          perPage,
          search: search || "",
          filtersKey,
        }),
        queryFn: () => getAllUsers({ page, perPage, search, filters }),
      });

      setSummary({
        users: response?.summary?.users,
        departments: response?.summary?.departments,
        ranks: response?.summary?.ranks,
        groups: response?.summary?.groups,
        activeUsers: response?.summary?.activeUserPercentage,
      });
      return response;
    },
    [queryClient, currentFilters, roleId],
  );

  const handleFiltersChange = (filters: Record<string, unknown>) => {
    setCurrentFilters(filters);
  };

  const summaryCards: SummaryCard[] = useMemo(
    () => [
      {
        id: "total-users",
        title: "Total Users",
        value: summary?.users || 0,
        description: "Total users currently in the system",
        delay: 0.1,
        showAnimatedNumber: true,
        animationDuration: 1000,
        fontStyle: "style-2",
      },
      {
        id: "departments",
        title: "Departments",
        value: summary?.departments || 0,
        description: "Total departments currently in the system",
        delay: 0.3,
        showAnimatedNumber: true,
        animationDuration: 1000,
        fontStyle: "style-2",
      },
      {
        id: "ranks",
        title: "Ranks",
        value: summary?.ranks || 0,
        description: "The ranks were created by you within the system",
        delay: 0.5,
        showAnimatedNumber: true,
        animationDuration: 1000,
        fontStyle: "style-2",
      },
      {
        id: "groups",
        title: "Groups",
        value: summary?.groups || 0,
        description: "The groups were created by you within the system",
        delay: 0.7,
        showAnimatedNumber: true,
        animationDuration: 1000,
        fontStyle: "style-2",
      },
    ],
    [summary],
  );

  return {
    customFieldColumns,
    currentFilters,
    summary,
    fetchUsers,
    handleFiltersChange,
    summaryCards,
    invalidateUsersList,
  };
};
