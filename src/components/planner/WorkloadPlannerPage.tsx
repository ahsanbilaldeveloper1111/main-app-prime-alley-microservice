import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Info, X } from "lucide-react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { toast } from "react-toastify";
import "@assets/scss/common.scss";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { getSessionPhoneOrExtension } from "@planner/projectMemberRole";
import { ModuleSlug } from "@utils/Helper";
import { plannerKeys } from "../../query/keys";
import { canViewAllEmployeesAttendance } from "@utils/workforce/canViewAllEmployeesAttendance";
import {
  getWorkloadBoard,
  getWorkloadDay,
  getWorkloadGrid,
  getWorkloadSummary,
  getWorkloadUnassigned,
  listProjects,
  patchWorkloadTask,
  updateTask,
  type WorkloadGridCell,
  type WorkloadRangePreset,
  type WorkloadTaskCard,
} from "@utils/tasks";
import {
  formatWorkloadDayDetailDate,
  formatWorkloadMemberLabel,
  getWorkloadWeekRange,
  collectWorkloadExtensionsFromHierarchy,
  filterWorkloadMemberExtensions,
  resolveWorkloadBoardDisplayData,
  resolveWorkloadGridDisplayData,
  resolveWorkloadPeriodDisplayMembers,
  createDefaultWorkloadPlannerFilters,
  isDefaultWorkloadPlannerFilters,
  isWorkloadPlannerDraftRangeValid,
  readWorkloadMainViewPreference,
  workloadPlannerFiltersEqual,
  writeWorkloadMainViewPreference,
  buildWorkloadTaskPatchBody,
  workloadCellKey,
  workloadPriorityToApiString,
  type WorkloadPlannerFilterState,
} from "@page-modules/planner/workload/workloadDomain";
import type { WorkloadBoardDropIntent } from "./workload/WorkloadBoardPanel";
import {
  buildWorkloadGridBoardQuery,
  buildWorkloadSummaryQuery,
  buildWorkloadCompanyExtensionAllowlist,
  fetchCompanyWorkloadRoster,
  mergeViewerWorkloadExtension,
  readWorkloadCompanyScopeFromSession,
  resolveWorkloadDisplayTeamExtensions,
} from "@page-modules/planner/workload/workloadTeamScope";
import { WorkloadPlannerAlertStack } from "./workload/WorkloadPlannerSubviews";
import { WorkloadPlannerDataViews } from "./workload/WorkloadPlannerDataViews";
import {
  WorkloadPlannerFilterBar,
  WorkloadPlannerPageHeader,
  type WorkloadProjectOption,
} from "./workload/WorkloadPlannerChrome";
import {
  WorkloadBoardDragConfirmModal,
  WorkloadDayOffcanvas,
  WorkloadReassignModal,
  WorkloadRescheduleModal,
} from "./workload/WorkloadPlannerDialogs";
import { WorkloadUnassignedSidebar } from "./workload/WorkloadUnassignedSidebar";
import { useWorkloadPlannerTaskActions } from "./workload/useWorkloadPlannerTaskActions";
import { useWorkloadTeamScope } from "./workload/useWorkloadTeamScope";
import {
  computeWorkloadIsApplyingFilters,
  computeWorkloadLoadingMain,
  resolveAppliedProjectFilterKey,
  resolveWorkloadGridRangeFallback,
  resolveWorkloadMemberExtensions,
  type WorkloadSelectedCellState,
} from "./workload/workloadPlannerPageHelpers";
import { WorkloadOnboardingModal } from "./workload/WorkloadOnboardingModal";
import {
  getOnboardingStatus,
  WORKLOAD_MOCK_BOARD_DATA,
  WORKLOAD_MOCK_GRID_DATA,
} from "./workload/workloadOnboarding";
import { startWorkloadTour, getGridTourSeen, getBoardTourSeen } from "./workload/useWorkloadTour";

type MainView = "grid" | "board";

function isForbiddenError(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 403;
}

function workloadErrorMessage(err: unknown): string {
  if (
    isAxiosError(err) &&
    typeof err.response?.data === "object" &&
    err.response.data !== null
  ) {
    const msg = (err.response.data as { message?: string }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

function buildCellMap(
  cells: WorkloadGridCell[] | undefined,
): Map<string, WorkloadGridCell> {
  const m = new Map<string, WorkloadGridCell>();
  if (!Array.isArray(cells)) return m;
  for (const c of cells) {
    m.set(workloadCellKey(c.extension_number, c.date), c);
  }
  return m;
}

const WorkloadPlannerPage: React.FC = () => {
  const { data: session, status: sessionStatus } = useSession();
  const queryClient = useQueryClient();
  const extension = useMemo(
    () => getSessionPhoneOrExtension(session),
    [session],
  );
  const isCompanyAdmin = useMemo(() => {
    const value =
      (session?.user as { is_company_admin?: unknown } | undefined)?.is_company_admin;
    return value === true || value === "1" || value === 1;
  }, [session?.user]);
  const canViewCompanyWideRoster = useMemo(
    () => canViewAllEmployeesAttendance(session?.user as any),
    [session?.user],
  );
  const sessionUserId = useMemo(() => {
    const id = (session?.user as { id?: string | number } | undefined)?.id;
    return id == null ? "" : String(id).trim();
  }, [session?.user]);
  const teamScope = useWorkloadTeamScope(
    sessionUserId,
    extension,
    sessionStatus,
    canViewCompanyWideRoster || isCompanyAdmin,
  );
  /** Company-wide only — team managers still send `extension_numbers[]` (incl. their own ext). */
  const isWorkloadRoot = canViewCompanyWideRoster || isCompanyAdmin;
  const effectiveTeamScope = useMemo(
    () => ({ ...teamScope, isTeamOwner: isWorkloadRoot }),
    [teamScope, isWorkloadRoot],
  );
  const { hierarchyDataExtensions } = useHierarchyData(ModuleSlug.WORK_PLANNER);

  const companyScope = useMemo(
    () => readWorkloadCompanyScopeFromSession(session?.user),
    [session?.user],
  );

  const companyRosterQuery = useQuery({
    queryKey: [
      ...plannerKeys.workload.all(),
      "company-roster",
      companyScope?.companyId ?? "",
      companyScope?.companyIdentifier ?? "",
    ],
    queryFn: () => fetchCompanyWorkloadRoster(companyScope),
    enabled:
      (canViewCompanyWideRoster || isCompanyAdmin) &&
      sessionStatus === "authenticated" &&
      companyScope != null,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const companyExtensionAllowlist = useMemo(
    () =>
      buildWorkloadCompanyExtensionAllowlist({
        companyScope,
        companyRoster: companyRosterQuery.data,
        hierarchyExtensions: hierarchyDataExtensions,
        teamExtensions: teamScope.teamExtensions,
        viewerExtension: extension,
      }),
    [
      companyScope,
      companyRosterQuery.data,
      hierarchyDataExtensions,
      teamScope.teamExtensions,
      extension,
    ],
  );

  const rosterExtensions = useMemo(() => {
    let raw: string[];
    if (!isWorkloadRoot) {
      raw = mergeViewerWorkloadExtension(teamScope.teamExtensions, extension);
    } else {
      const fromCompany = companyRosterQuery.data ?? [];
      if (fromCompany.length > 0) {
        raw = fromCompany;
      } else {
        const fromHierarchy = collectWorkloadExtensionsFromHierarchy(
          hierarchyDataExtensions,
          companyExtensionAllowlist,
        );
        raw = fromHierarchy.length > 0 ? fromHierarchy : teamScope.teamExtensions;
      }
    }
    return filterWorkloadMemberExtensions(raw, companyExtensionAllowlist);
  }, [
    isWorkloadRoot,
    teamScope.teamExtensions,
    extension,
    companyRosterQuery.data,
    hierarchyDataExtensions,
    companyExtensionAllowlist,
  ]);

  const [draftFilters, setDraftFilters] = useState<WorkloadPlannerFilterState>(
    createDefaultWorkloadPlannerFilters,
  );
  const [appliedFilters, setAppliedFilters] =
    useState<WorkloadPlannerFilterState>(createDefaultWorkloadPlannerFilters);
  const [mainView, setMainView] = useState<MainView>(() =>
    readWorkloadMainViewPreference(),
  );
  const [reassignOverloadConfirm, setReassignOverloadConfirm] = useState(false);
  const [selectedCell, setSelectedCell] =
    useState<WorkloadSelectedCellState>(null);
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [assignTargets, setAssignTargets] = useState<Record<number, string>>(
    {},
  );
  const [reassignTask, setReassignTask] = useState<WorkloadTaskCard | null>(
    null,
  );
  const [reassignTarget, setReassignTarget] = useState("");
  const [rescheduleTask, setRescheduleTask] = useState<WorkloadTaskCard | null>(
    null,
  );
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [overloadSecondStep, setOverloadSecondStep] = useState(false);
  const [boardDropIntent, setBoardDropIntent] =
    useState<WorkloadBoardDropIntent | null>(null);
  const [boardDropOverload, setBoardDropOverload] = useState(false);
  const [showWorkloadPerDay, setShowWorkloadPerDay] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(
    () => !getOnboardingStatus(),
  );
  const [useMockData, setUseMockData] = useState(false);
  const [showBoardHint, setShowBoardHint] = useState(true);

  function handleOnboardingComplete(choice: "sample" | "fresh" | null) {
    if (choice === "sample") {
      setUseMockData(true);
      setTimeout(() => startWorkloadTour("grid", () => {}), 600);
    }
    setShowOnboarding(false);
  }

  function handleMainViewChange(view: MainView) {
    setMainView(view);
    writeWorkloadMainViewPreference(view);
    if (view === "board" && !getBoardTourSeen()) {
      setTimeout(() => startWorkloadTour("board", () => {}), 600);
    }
    if (view === "grid" && !getGridTourSeen()) {
      setTimeout(() => startWorkloadTour("grid", () => {}), 600);
    }
  }

  const appliedRangeValid = useMemo(
    () => isWorkloadPlannerDraftRangeValid(appliedFilters),
    [appliedFilters],
  );

  const draftRangeInvalid = useMemo(
    () => !isWorkloadPlannerDraftRangeValid(draftFilters),
    [draftFilters],
  );

  const appliedProjectFilterKey = useMemo(
    () => resolveAppliedProjectFilterKey(appliedFilters.projectFilter),
    [appliedFilters.projectFilter],
  );

  const workloadQueryInput = useMemo(
    () => ({
      viewerExtension: extension,
      teamScope: effectiveTeamScope,
      memberFilter: appliedFilters.memberFilter,
      assigneeMatch: appliedFilters.assigneeMatch,
      range: appliedFilters.range,
      customStart: appliedFilters.customStart,
      customEnd: appliedFilters.customEnd,
      customRangeValid: appliedRangeValid,
      projectFilter: appliedFilters.projectFilter,
    }),
    [extension, effectiveTeamScope, appliedFilters, appliedRangeValid],
  );

  const summaryQueryBase = useMemo(
    () => buildWorkloadSummaryQuery(workloadQueryInput),
    [workloadQueryInput],
  );

  const gridBoardQueryBase = useMemo(
    () => buildWorkloadGridBoardQuery(workloadQueryInput),
    [workloadQueryInput],
  );

  const workloadQueryKeyParams = useMemo(
    () => ({
      ext: isWorkloadRoot ? "root" : extension,
      range: appliedFilters.range,
      match: appliedFilters.assigneeMatch,
      start: appliedFilters.range === "custom" ? appliedFilters.customStart : undefined,
      end: appliedFilters.range === "custom" ? appliedFilters.customEnd : undefined,
      member: appliedFilters.memberFilter,
      project: appliedProjectFilterKey,
    }),
    [extension, isWorkloadRoot, appliedFilters, appliedProjectFilterKey],
  );

  const teamMemberBlocked = teamScope.isTeamMemberOnly;
  const companyRosterLoading =
    (canViewCompanyWideRoster || isCompanyAdmin) && companyRosterQuery.isLoading;
  const hasWorkloadScope =
    isWorkloadRoot ||
    teamScope.teamExtensions.length > 0 ||
    extension.trim().length > 0;
  const queriesEnabled =
    appliedRangeValid &&
    hasWorkloadScope &&
    !teamScope.loading &&
    !companyRosterLoading &&
    !teamMemberBlocked;
  const filtersEnabled = extension.length > 0 || teamScope.teamExtensions.length > 0;

  useEffect(() => {
    writeWorkloadMainViewPreference(mainView);
  }, [mainView]);

  useEffect(() => {
    const originalScrollbar = document.body.style.paddingRight;
    const observer = new MutationObserver(() => {
      if (document.body.classList.contains('modal-open')) {
        document.body.style.paddingRight = "0px";
      }
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    return () => {
      observer.disconnect();
      document.body.style.paddingRight = originalScrollbar;
    };
  }, []);

  const handleDraftRangeChange = useCallback((value: WorkloadRangePreset) => {
    setDraftFilters((prev) => {
      if (value === "custom") {
        const week = getWorkloadWeekRange("this_week");
        return {
          ...prev,
          range: value,
          customStart: week.start,
          customEnd: week.end,
        };
      }
      return { ...prev, range: value };
    });
  }, []);

  const handleApplyFilters = useCallback(() => {
    if (!isWorkloadPlannerDraftRangeValid(draftFilters)) {
      toast.error("Choose a valid custom date range.");
      return;
    }
    setAppliedFilters({ ...draftFilters });
  }, [draftFilters]);

  const summaryQuery = useQuery({
    queryKey: plannerKeys.workload.summary(workloadQueryKeyParams),
    queryFn: () => getWorkloadSummary(summaryQueryBase),
    enabled: queriesEnabled,
  });

  const gridQuery = useQuery({
    queryKey: plannerKeys.workload.grid(workloadQueryKeyParams),
    queryFn: () => getWorkloadGrid(gridBoardQueryBase),
    enabled: queriesEnabled,
  });

  const boardQuery = useQuery({
    queryKey: plannerKeys.workload.board(workloadQueryKeyParams),
    queryFn: () => getWorkloadBoard(gridBoardQueryBase),
    enabled: queriesEnabled && mainView === "board",
  });

  const effectiveGridData = useMockData ? WORKLOAD_MOCK_GRID_DATA : gridQuery.data;
  const effectiveBoardData = useMockData ? WORKLOAD_MOCK_BOARD_DATA : boardQuery.data;

  const dayQuery = useQuery({
    queryKey: plannerKeys.workload.day({
      ext: selectedCell?.extension ?? "",
      date: selectedCell?.date ?? "",
      match: appliedFilters.assigneeMatch,
    }),
    queryFn: async () => {
      const cell = selectedCell;
      if (!cell) {
        throw new Error("No day selected");
      }
      return getWorkloadDay({
        extension_number: cell.extension,
        date: cell.date,
        assignee_match: appliedFilters.assigneeMatch,
      });
    },
    enabled: Boolean(selectedCell && queriesEnabled),
  });

  const projectsQuery = useQuery({
    queryKey: [...plannerKeys.workload.all(), "project-options"],
    queryFn: async () => {
      const res = await listProjects({ page: 1, limit: 200 });
      const rows =
        (res as { data?: { id?: number; name?: string }[] } | null)?.data ?? [];
      return rows
        .filter((p) => typeof p.id === "number" && p.name)
        .map((p) => ({ id: p.id as number, name: String(p.name) }));
    },
    enabled: filtersEnabled,
    staleTime: 120_000,
  });

  const projectOptions: WorkloadProjectOption[] = projectsQuery.data ?? [];

  const unassignedProjectId =
    typeof appliedFilters.projectFilter === "number"
      ? appliedFilters.projectFilter
      : undefined;

  const unassignedQuery = useQuery({
    queryKey: plannerKeys.workload.unassigned(
      extension,
      appliedProjectFilterKey,
    ),
    queryFn: () =>
      getWorkloadUnassigned({
        extension_number: extension,
        limit: 100,
        project_id: unassignedProjectId,
      }),
    enabled: queriesEnabled,
    staleTime: 30_000,
  });

  const gridRangeFallback = useMemo(
    () => resolveWorkloadGridRangeFallback(appliedFilters, appliedRangeValid),
    [appliedFilters, appliedRangeValid],
  );

  const gridTeamExtensionNumbers = useMemo(
    () => resolveWorkloadDisplayTeamExtensions(rosterExtensions, extension),
    [rosterExtensions, extension],
  );

  const displayGridData = useMemo(
    () =>
      resolveWorkloadGridDisplayData(effectiveGridData, {
        viewerExtension: extension,
        memberFilter: appliedFilters.memberFilter,
        rangeFallback: gridRangeFallback,
        teamExtensionNumbers: gridTeamExtensionNumbers,
        companyExtensionAllowlist,
      }),
    [
      effectiveGridData,
      extension,
      appliedFilters.memberFilter,
      gridRangeFallback,
      gridTeamExtensionNumbers,
      companyExtensionAllowlist,
    ],
  );

  const displayBoardData = useMemo(
    () =>
      resolveWorkloadBoardDisplayData(effectiveBoardData, {
        viewerExtension: extension,
        memberFilter: appliedFilters.memberFilter,
        teamExtensionNumbers: gridTeamExtensionNumbers,
        companyExtensionAllowlist,
      }),
    [
      effectiveBoardData,
      extension,
      appliedFilters.memberFilter,
      gridTeamExtensionNumbers,
      companyExtensionAllowlist,
    ],
  );

  const cellMap = useMemo(
    () => buildCellMap(displayGridData?.cells ?? effectiveGridData?.cells),
    [displayGridData?.cells, effectiveGridData?.cells],
  );

  const memberExtensions = useMemo(
    () =>
      resolveWorkloadMemberExtensions(
        displayGridData,
        extension,
        displayBoardData?.columns,
      ),
    [displayGridData, extension, displayBoardData?.columns],
  );

  const displayPeriodMembers = useMemo(
    () =>
      resolveWorkloadPeriodDisplayMembers(
        summaryQuery.data?.members,
        extension,
        rosterExtensions.length > 0 ? rosterExtensions : undefined,
        companyExtensionAllowlist,
      ),
    [summaryQuery.data?.members, extension, rosterExtensions, companyExtensionAllowlist],
  );

  const invalidateWorkload = useCallback(() => {
    queryClient
      .invalidateQueries({ queryKey: plannerKeys.workload.all() })
      .catch(() => undefined);
  }, [queryClient]);

  const assignMutation = useMutation({
    mutationFn: async ({
      task,
      toExtension,
    }: {
      task: WorkloadTaskCard;
      toExtension: string;
    }) => {
      if (!toExtension) throw new Error("Choose a team member.");
      await patchWorkloadTask(
        task.id,
        extension,
        buildWorkloadTaskPatchBody(task, { extension_numbers: [toExtension] }),
      );
    },
    onSuccess: () => {
      toast.success("Task assigned");
      setReassignTask(null);
      setReassignOverloadConfirm(false);
      invalidateWorkload();
      unassignedQuery.refetch().catch(() => undefined);
      dayQuery.refetch().catch(() => undefined);
    },
    onError: (err: unknown) => {
      toast.error(workloadErrorMessage(err));
    },
  });

  const estimateMutation = useMutation({
    mutationFn: async ({
      task,
      minutes,
    }: {
      task: WorkloadTaskCard;
      minutes: number;
    }) => {
      if (!Number.isFinite(minutes) || minutes <= 0) {
        throw new Error("Enter a valid estimate in minutes.");
      }
      await updateTask(task.id, {
        estimated_duration_minutes: minutes,
        priority: workloadPriorityToApiString(task.priority),
      });
    },
    onSuccess: () => {
      invalidateWorkload();
      dayQuery.refetch().catch(() => undefined);
    },
    onError: (err: unknown) => {
      toast.error(workloadErrorMessage(err));
    },
  });

  const markDoneMutation = useMutation({
    mutationFn: async (task: WorkloadTaskCard) => {
      await patchWorkloadTask(
        task.id,
        extension,
        buildWorkloadTaskPatchBody(task, { is_completed: true }),
      );
    },
    onSuccess: () => {
      toast.success("Task marked done");
      invalidateWorkload();
      dayQuery.refetch().catch(() => undefined);
    },
    onError: (err: unknown) => {
      toast.error(workloadErrorMessage(err));
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: async (payload: {
      task: WorkloadTaskCard;
      dueDate: string;
    }) => {
      await patchWorkloadTask(
        payload.task.id,
        extension,
        buildWorkloadTaskPatchBody(payload.task, { due_date: payload.dueDate }),
      );
    },
    onSuccess: () => {
      toast.success("Task rescheduled");
      setRescheduleTask(null);
      setOverloadSecondStep(false);
      invalidateWorkload();
      dayQuery.refetch().catch(() => undefined);
    },
    onError: (err: unknown) => {
      toast.error(workloadErrorMessage(err));
    },
  });

  const openReschedule = useCallback(
    (task: WorkloadTaskCard) => {
      setRescheduleTask(task);
      const d = task.due_date?.slice(0, 10) ?? selectedCell?.date ?? "";
      setRescheduleDate(d);
      setOverloadSecondStep(false);
    },
    [selectedCell?.date],
  );

  const boardDragMutation = useMutation({
    mutationFn: async (intent: WorkloadBoardDropIntent) => {
      await patchWorkloadTask(
        intent.task.id,
        extension,
        buildWorkloadTaskPatchBody(intent.task, {
          ...(intent.toExtension
            ? { extension_numbers: [intent.toExtension] }
            : {}),
          ...(intent.toDate ? { due_date: intent.toDate } : {}),
        }),
      );
    },
    onSuccess: () => {
      toast.success("Task updated");
      setBoardDropIntent(null);
      setBoardDropOverload(false);
      invalidateWorkload();
    },
    onError: (err: unknown) => {
      toast.error(workloadErrorMessage(err));
    },
  });

  const {
    submitReassign,
    submitReschedule,
    handleBoardDropIntent,
    confirmBoardDrop,
  } = useWorkloadPlannerTaskActions({
    extension,
    assigneeMatch: appliedFilters.assigneeMatch,
    boardRangeStart: effectiveBoardData?.range.start,
    reassignTask,
    reassignTarget,
    reassignOverloadConfirm,
    selectedCell,
    rescheduleTask,
    rescheduleDate,
    overloadSecondStep,
    boardDropIntent,
    assignMutation,
    rescheduleMutation,
    boardDragMutation,
    setReassignOverloadConfirm,
    setOverloadSecondStep,
    setBoardDropIntent,
    setBoardDropOverload,
    formatError: workloadErrorMessage,
  });

  const summaryForbidden =
    summaryQuery.isError && isForbiddenError(summaryQuery.error);
  const gridForbidden = gridQuery.isError && isForbiddenError(gridQuery.error);
  const boardForbidden =
    boardQuery.isError && isForbiddenError(boardQuery.error);
  const accessForbidden = summaryForbidden || gridForbidden || boardForbidden;

  const hasActiveFilters = useMemo(
    () => !isDefaultWorkloadPlannerFilters(draftFilters),
    [draftFilters],
  );

  const hasPendingFilters = useMemo(
    () => !workloadPlannerFiltersEqual(draftFilters, appliedFilters),
    [draftFilters, appliedFilters],
  );

  const handleClearFilters = useCallback(() => {
    const defaults = createDefaultWorkloadPlannerFilters();
    setDraftFilters(defaults);
    setAppliedFilters(defaults);
  }, []);

  const loadingMain = computeWorkloadLoadingMain(
    queriesEnabled,
    mainView,
    summaryQuery.isPending,
    gridQuery.isPending,
    boardQuery.isPending,
  );

  const applyDisabled =
    !filtersEnabled || draftRangeInvalid || !hasPendingFilters || loadingMain;

  const isApplyingFilters = computeWorkloadIsApplyingFilters(
    hasPendingFilters,
    queriesEnabled,
    mainView,
    summaryQuery.isFetching,
    gridQuery.isFetching,
    boardQuery.isFetching,
  );

  return (
    <div className="workload-page">
      {useMockData ? (
        <div className="workload-demo-banner">
          <Info size={18} aria-hidden />
          You are viewing sample data.
          <button
            type="button"
            className="workload-demo-banner__exit"
            onClick={() => { setUseMockData(false); window.scrollTo(0, 0); }}
          >
            Exit demo → view real data
          </button>
        </div>
      ) : null}
      <div className="workload-page__inner">

        <WorkloadPlannerPageHeader
          mainView={mainView}
          onMainViewChange={handleMainViewChange}
          enabled={queriesEnabled}
        />

        <WorkloadPlannerFilterBar
          range={draftFilters.range}
          onRangeChange={handleDraftRangeChange}
          customStart={draftFilters.customStart}
          customEnd={draftFilters.customEnd}
          onCustomStartChange={(value) =>
            setDraftFilters((prev) => ({ ...prev, customStart: value }))
          }
          onCustomEndChange={(value) =>
            setDraftFilters((prev) => ({ ...prev, customEnd: value }))
          }
          customRangeInvalid={
            draftFilters.range === "custom" && draftRangeInvalid
          }
          assigneeMatch={draftFilters.assigneeMatch}
          onAssigneeMatchChange={(value) =>
            setDraftFilters((prev) => ({ ...prev, assigneeMatch: value }))
          }
          projectFilter={draftFilters.projectFilter}
          onProjectFilterChange={(value) =>
            setDraftFilters((prev) => ({ ...prev, projectFilter: value }))
          }
          projectOptions={projectOptions}
          memberFilter={draftFilters.memberFilter}
          onMemberFilterChange={(value) =>
            setDraftFilters((prev) => ({ ...prev, memberFilter: value }))
          }
          memberExtensions={memberExtensions}
          hierarchyExtensions={hierarchyDataExtensions}
          priorityFilter={draftFilters.priorityFilter}
          onPriorityFilterChange={(value) =>
            setDraftFilters((prev) => ({ ...prev, priorityFilter: value }))
          }
          enabled={filtersEnabled}
          unassignedCount={unassignedQuery.data?.count}
          onOpenUnassigned={() => setShowUnassigned(true)}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          onApply={handleApplyFilters}
          applyDisabled={applyDisabled}
          isApplying={isApplyingFilters}
        />

        <WorkloadPlannerAlertStack
          sessionStatus={sessionStatus}
          enabled={queriesEnabled}
          teamMemberOnly={teamMemberBlocked}
          accessForbidden={accessForbidden}
          summaryError={summaryQuery.error}
          summaryHasError={summaryQuery.isError}
          gridError={gridQuery.error}
          gridHasError={gridQuery.isError}
          boardError={boardQuery.error}
          boardHasError={boardQuery.isError && !boardForbidden}
          mainView={mainView}
          workloadErrorMessage={workloadErrorMessage}
        />

        {mainView === "board" && useMockData && showBoardHint ? (
          <div className="workload-board-hint">
            <Info size={18} aria-hidden />
            <span><strong>Drag</strong> cards between columns to reassign &nbsp;·&nbsp; <strong>Move to</strong> changes due date &nbsp;·&nbsp; <strong>View</strong> opens the full task</span>
            <button
              type="button"
              className="workload-board-hint__close"
              onClick={() => setShowBoardHint(false)}
              aria-label="Dismiss"
            >
              <X size={16} aria-hidden />
            </button>
          </div>
        ) : null}

        <WorkloadPlannerDataViews
          loadingMain={loadingMain}
          enabled={queriesEnabled}
          mainView={mainView}
          summaryData={summaryQuery.data}
          gridData={displayGridData}
          periodMembers={displayPeriodMembers}
          boardData={displayBoardData}
          cellMap={cellMap}
          hierarchyExtensions={hierarchyDataExtensions}
          priorityFilter={appliedFilters.priorityFilter}
          boardDragSaving={boardDragMutation.isPending}
          onBoardDropIntent={handleBoardDropIntent}
          showWorkloadPerDay={showWorkloadPerDay}
          onToggleWorkloadPerDay={() => setShowWorkloadPerDay((prev) => !prev)}
          onSelectCell={(extension, date) => {
            const member = displayGridData?.members?.find(
              (m) => m.extension_number === extension,
            );
            const cell = cellMap.get(workloadCellKey(extension, date));
            setSelectedCell({ extension, date, member, cell });
          }}
        />
      </div>

      <WorkloadDayOffcanvas
        selected={selectedCell}
        onClose={() => setSelectedCell(null)}
        dayQuery={dayQuery}
        onReassign={(task) => {
          setReassignTask(task);
          setReassignTarget(memberExtensions[0] ?? "");
          setReassignOverloadConfirm(false);
        }}
        onReschedule={openReschedule}
        onMarkDone={(task) => {
          markDoneMutation.mutate(task);
        }}
        markDoneTaskId={
          markDoneMutation.isPending
            ? (markDoneMutation.variables?.id ?? null)
            : null
        }
        onSaveEstimate={(task, minutes) => {
          estimateMutation.mutate({ task, minutes });
        }}
        estimateSavingTaskId={
          estimateMutation.isPending
            ? (estimateMutation.variables?.task.id ?? null)
            : null
        }
        formatError={workloadErrorMessage}
        hierarchyExtensions={hierarchyDataExtensions}
      />

      <WorkloadReassignModal
        task={reassignTask}
        memberExtensions={memberExtensions}
        hierarchyExtensions={hierarchyDataExtensions}
        targetExtension={reassignTarget}
        onTargetChange={setReassignTarget}
        isSaving={assignMutation.isPending}
        overloadConfirm={reassignOverloadConfirm}
        memberName={
          reassignTarget
            ? formatWorkloadMemberLabel(reassignTarget, hierarchyDataExtensions)
            : ""
        }
        onClose={() => {
          setReassignTask(null);
          setReassignOverloadConfirm(false);
        }}
        onConfirm={() => {
          submitReassign().catch(() => undefined);
        }}
      />

      <WorkloadUnassignedSidebar
        show={showUnassigned}
        onClose={() => setShowUnassigned(false)}
        unassignedQuery={unassignedQuery}
        memberExtensions={memberExtensions}
        hierarchyExtensions={hierarchyDataExtensions}
        assignTargets={assignTargets}
        setAssignTargets={setAssignTargets}
        onRequestAssign={(task, toExtension) => {
          assignMutation.mutate({ task, toExtension });
        }}
        assignPending={assignMutation.isPending}
        formatError={workloadErrorMessage}
      />

      <WorkloadRescheduleModal
        task={rescheduleTask}
        currentDate={selectedCell?.date}
        onClose={() => {
          setRescheduleTask(null);
          setOverloadSecondStep(false);
        }}
        rescheduleDate={rescheduleDate}
        onDateChange={(value: string) => {
          setRescheduleDate(value);
          setOverloadSecondStep(false);
        }}
        overloadSecondStep={overloadSecondStep}
        isSaving={rescheduleMutation.isPending}
        onSubmit={() => {
          submitReschedule().catch(() => undefined);
        }}
      />

      <WorkloadBoardDragConfirmModal
        payload={
          boardDropIntent
            ? {
                taskTitle: boardDropIntent.task.title,
                memberName: formatWorkloadMemberLabel(
                  boardDropIntent.toExtension,
                  hierarchyDataExtensions,
                ),
                dateLabel: boardDropIntent.toDate
                  ? formatWorkloadDayDetailDate(boardDropIntent.toDate)
                  : "",
                overloadWarning: boardDropOverload,
              }
            : null
        }
        isSaving={boardDragMutation.isPending}
        onClose={() => {
          setBoardDropIntent(null);
          setBoardDropOverload(false);
        }}
        onConfirm={confirmBoardDrop}
      />

      <WorkloadOnboardingModal
        show={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
};

export default WorkloadPlannerPage;
