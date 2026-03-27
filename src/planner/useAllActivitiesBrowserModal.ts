import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import {
  getProjectActivitiesPaged,
  getRecentActivity,
  getTaskActivitiesPaged,
  type TaskActivitiesPagedResult,
} from "@utils/tasks";
import {
  DEFAULT_ACTIVITIES_MODAL_PER_PAGE,
  parseActivitiesModalPerPage,
} from "./taskActivityLogModalShared";
import type { ActivityLogExtension } from "./activityLogExtension";

export type ActivitiesBrowserScope =
  | { type: "task"; taskId: string | number | null | undefined }
  | { type: "project"; projectId: number | null | undefined };

function filterActivitiesForModal(items: unknown[], search: string, action: string): unknown[] {
  let out = items;
  const act = action.trim().toLowerCase();
  if (act) {
    out = out.filter((a) => {
      const row = a as { action?: string; activity_type?: string };
      return String(row.action ?? row.activity_type ?? "").toLowerCase() === act;
    });
  }
  const q = search.trim().toLowerCase();
  if (q) {
    out = out.filter((a) => {
      const row = a as {
        description?: string;
        action?: string;
        activity_type?: string;
        user?: string;
        action_by?: string;
        task?: { title?: string };
        extension_number?: string;
      };
      const hay = [
        row.description,
        row.action,
        row.activity_type,
        row.user,
        row.action_by,
        row.task?.title,
        row.extension_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }
  return out;
}

function paginateLocal<T>(
  items: T[],
  page: number,
  limit: number,
): { data: T[]; pagination: TaskActivitiesPagedResult["pagination"] } {
  const total = items.length;
  const lastPage = Math.max(1, Math.ceil(total / Math.max(limit, 1)) || 1);
  const pageClamped = Math.min(Math.max(1, page), lastPage);
  const start = (pageClamped - 1) * limit;
  return {
    data: items.slice(start, start + limit),
    pagination: { total, limit, page: pageClamped, last_page: lastPage },
  };
}

async function fetchModalActivitiesPage(
  scope: ActivitiesBrowserScope,
  taskId: string | number | null,
  projectId: number | null,
  page: number,
  limit: number,
  searchApplied: string,
  action: string,
): Promise<{ data: unknown[]; pagination: TaskActivitiesPagedResult["pagination"] | null }> {
  if (scope.type === "task") {
    if (taskId == null) {
      return { data: [], pagination: null };
    }
    const result = await getTaskActivitiesPaged(taskId, {
      page,
      limit,
      search: searchApplied || undefined,
      action: action || undefined,
    });
    if (result) {
      return { data: result.data, pagination: result.pagination };
    }
    return { data: [], pagination: null };
  }

  if (projectId == null) {
    return { data: [], pagination: null };
  }
  const paged = await getProjectActivitiesPaged(projectId, {
    page,
    limit,
    search: searchApplied || undefined,
    action: action || undefined,
  });
  if (paged) {
    return { data: paged.data, pagination: paged.pagination };
  }
  const raw = await getRecentActivity(projectId);
  const list = Array.isArray(raw) ? raw : [];
  const filtered = filterActivitiesForModal(list, searchApplied, action);
  const { data, pagination } = paginateLocal(filtered, page, limit);
  return { data, pagination };
}

export interface AllActivitiesBrowserModalProps {
  show: boolean;
  onHide: () => void;
  extensions: ActivityLogExtension[];
  loadingAllActivities: boolean;
  allActivities: unknown[];
  activitiesModalPage: number;
  setActivitiesModalPage: (p: number) => void;
  activityModalSearch: string;
  setActivityModalSearch: (s: string) => void;
  activityModalAction: string;
  handleActivityModalActionChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  activitiesModalPerPage: number;
  handleActivitiesModalPerPageChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  activityModalTotalPages: number;
  activityModalTotalItems: number;
}

export function useAllActivitiesBrowserModal(
  scope: ActivitiesBrowserScope,
  extensions: ActivityLogExtension[] = [],
): {
  openActivitiesModal: () => void;
  resetActivitiesModal: () => void;
  activitiesModalProps: AllActivitiesBrowserModalProps;
} {
  const [showAllActivitiesModal, setShowAllActivitiesModal] = useState(false);
  const [allActivities, setAllActivities] = useState<unknown[]>([]);
  const [loadingAllActivities, setLoadingAllActivities] = useState(false);
  const [activitiesModalPage, setActivitiesModalPage] = useState(1);
  const [activitiesPagination, setActivitiesPagination] = useState<
    TaskActivitiesPagedResult["pagination"] | null
  >(null);
  const [activityModalSearch, setActivityModalSearch] = useState("");
  const [activityModalSearchApplied, setActivityModalSearchApplied] = useState("");
  const [activityModalAction, setActivityModalAction] = useState("");
  const [activitiesModalPerPage, setActivitiesModalPerPage] = useState(
    DEFAULT_ACTIVITIES_MODAL_PER_PAGE,
  );

  const resolvedTaskId =
    scope.type === "task" && scope.taskId != null && scope.taskId !== ""
      ? scope.taskId
      : null;
  const resolvedProjectId =
    scope.type === "project" && scope.projectId != null ? Number(scope.projectId) : null;

  const resetActivitiesModal = useCallback(() => {
    setShowAllActivitiesModal(false);
    setAllActivities([]);
    setActivitiesModalPage(1);
    setActivitiesPagination(null);
    setActivityModalSearch("");
    setActivityModalSearchApplied("");
    setActivityModalAction("");
    setActivitiesModalPerPage(DEFAULT_ACTIVITIES_MODAL_PER_PAGE);
  }, []);

  useEffect(() => {
    resetActivitiesModal();
  }, [resolvedTaskId, resolvedProjectId, resetActivitiesModal]);

  const openActivitiesModal = useCallback(() => {
    if (scope.type === "task" && resolvedTaskId == null) {
      return;
    }
    if (scope.type === "project" && resolvedProjectId == null) {
      return;
    }
    setActivityModalSearch("");
    setActivityModalSearchApplied("");
    setActivityModalAction("");
    setActivitiesModalPerPage(DEFAULT_ACTIVITIES_MODAL_PER_PAGE);
    setActivitiesModalPage(1);
    setActivitiesPagination(null);
    setAllActivities([]);
    setShowAllActivitiesModal(true);
  }, [scope.type, resolvedTaskId, resolvedProjectId]);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = activityModalSearch.trim();
      setActivityModalSearchApplied((prev) => {
        if (next === prev) {
          return prev;
        }
        if (showAllActivitiesModal) {
          setActivitiesModalPage(1);
        }
        return next;
      });
    }, 450);
    return () => clearTimeout(t);
  }, [activityModalSearch, showAllActivitiesModal]);

  const handleActivityModalActionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setActivityModalAction(e.target.value);
    setActivitiesModalPage(1);
  };

  const handleActivitiesModalPerPageChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setActivitiesModalPerPage(parseActivitiesModalPerPage(e.target.value));
    setActivitiesModalPage(1);
  };

  useEffect(() => {
    if (!showAllActivitiesModal) {
      return;
    }
    if (scope.type === "task" && resolvedTaskId == null) {
      return;
    }
    if (scope.type === "project" && resolvedProjectId == null) {
      return;
    }

    let cancelled = false;
    void (async () => {
      setLoadingAllActivities(true);
      try {
        const { data, pagination } = await fetchModalActivitiesPage(
          scope,
          resolvedTaskId,
          resolvedProjectId,
          activitiesModalPage,
          activitiesModalPerPage,
          activityModalSearchApplied,
          activityModalAction,
        );
        if (cancelled) {
          return;
        }
        setAllActivities(data);
        setActivitiesPagination(pagination);
      } catch (error) {
        console.error("Error fetching activities for modal:", error);
        if (!cancelled) {
          setAllActivities([]);
          setActivitiesPagination(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingAllActivities(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    showAllActivitiesModal,
    scope.type,
    resolvedTaskId,
    resolvedProjectId,
    activitiesModalPage,
    activityModalSearchApplied,
    activityModalAction,
    activitiesModalPerPage,
  ]);

  useEffect(() => {
    if (activitiesPagination == null) {
      return;
    }
    if (activitiesModalPage > activitiesPagination.last_page) {
      setActivitiesModalPage(activitiesPagination.last_page);
    }
  }, [activitiesPagination, activitiesModalPage]);

  const activityModalTotalPages = Math.max(1, activitiesPagination?.last_page ?? 1);
  const activityModalTotalItems = activitiesPagination?.total ?? allActivities.length;

  const onHide = useCallback(() => {
    resetActivitiesModal();
  }, [resetActivitiesModal]);

  const activitiesModalProps: AllActivitiesBrowserModalProps = {
    show: showAllActivitiesModal,
    onHide,
    extensions,
    loadingAllActivities,
    allActivities,
    activitiesModalPage,
    setActivitiesModalPage,
    activityModalSearch,
    setActivityModalSearch,
    activityModalAction,
    handleActivityModalActionChange,
    activitiesModalPerPage,
    handleActivitiesModalPerPageChange,
    activityModalTotalPages,
    activityModalTotalItems,
  };

  return { openActivitiesModal, resetActivitiesModal, activitiesModalProps };
}
