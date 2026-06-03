import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "react-toastify";
import "@assets/scss/common.scss";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { getSessionPhoneOrExtension } from "@planner/projectMemberRole";
import { ModuleSlug } from "@utils/Helper";
import { plannerKeys } from "../../query/keys";
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
import {
  buildWorkloadQueryBase,
  buildWorkloadQueryKeyParams,
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
import { startWorkloadTour } from "./workload/useWorkloadTour";

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
  const { hierarchyDataExtensions } = useHierarchyData(ModuleSlug.WORK_PLANNER);

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

  function handleOnboardingComplete(choice: "sample" | "fresh" | null) {
    if (choice === "sample") {
      setUseMockData(true);
      setTimeout(() => startWorkloadTour(mainView, () => {}), 600);
    }
    setShowOnboarding(false);
  }

  function handleStartTour() {
    startWorkloadTour(mainView, () => {
      // tour complete — nothing extra needed
    });
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

  const queryBase = useMemo(
    () => buildWorkloadQueryBase(extension, appliedFilters, appliedRangeValid),
    [extension, appliedFilters, appliedRangeValid],
  );

  const workloadQueryKeyParams = useMemo(
    () =>
      buildWorkloadQueryKeyParams(
        extension,
        appliedFilters,
        appliedProjectFilterKey,
      ),
    [extension, appliedFilters, appliedProjectFilterKey],
  );

  const queriesEnabled = extension.length > 0 && appliedRangeValid;
  const filtersEnabled = extension.length > 0;

  useEffect(() => {
    writeWorkloadMainViewPreference(mainView);
  }, [mainView]);

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
    queryFn: () => getWorkloadSummary(queryBase),
    enabled: queriesEnabled,
  });

  const gridQuery = useQuery({
    queryKey: plannerKeys.workload.grid(workloadQueryKeyParams),
    queryFn: () => getWorkloadGrid(queryBase),
    enabled: queriesEnabled,
  });

  const boardQuery = useQuery({
    queryKey: plannerKeys.workload.board(workloadQueryKeyParams),
    queryFn: () => getWorkloadBoard(queryBase),
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

  const displayGridData = useMemo(
    () =>
      resolveWorkloadGridDisplayData(effectiveGridData, {
        viewerExtension: extension,
        memberFilter: appliedFilters.memberFilter,
        rangeFallback: gridRangeFallback,
      }),
    [effectiveGridData, extension, appliedFilters.memberFilter, gridRangeFallback],
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
        effectiveBoardData?.columns,
      ),
    [displayGridData, extension, effectiveBoardData?.columns],
  );

  const displayPeriodMembers = useMemo(
    () =>
      resolveWorkloadPeriodDisplayMembers(
        summaryQuery.data?.members,
        extension,
      ),
    [summaryQuery.data?.members, extension],
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
      dueDate,
      estimateMinutes,
    }: {
      task: WorkloadTaskCard;
      toExtension: string;
      dueDate?: string | null;
      estimateMinutes?: number | null;
    }) => {
      if (!toExtension) throw new Error("Choose a team member.");
      await patchWorkloadTask(
        task.id,
        extension,
        buildWorkloadTaskPatchBody(task, {
          extension_numbers: [toExtension],
          ...(dueDate ? { due_date: dueDate } : {}),
          ...(estimateMinutes ? { estimated_duration_minutes: estimateMinutes } : {}),
        }),
      );
    },
    onSuccess: () => {
      toast.success(
        reassignTask?.due_date
          ? "Task assigned successfully"
          : "Task assigned. Set a due date so it appears in the grid.",
        { autoClose: reassignTask?.due_date ? 3000 : 5000 }
      );
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
          <i className="ti ti-info-circle" aria-hidden="true" />
          You are viewing sample data.
          <button
            type="button"
            className="workload-demo-banner__exit"
            onClick={() => setUseMockData(false)}
          >
            Exit demo → view real data
          </button>
        </div>
      ) : null}
      <div className="workload-page__inner">

        <WorkloadPlannerPageHeader
          mainView={mainView}
          onMainViewChange={setMainView}
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

        <WorkloadPlannerDataViews
          loadingMain={loadingMain}
          enabled={queriesEnabled}
          mainView={mainView}
          summaryData={summaryQuery.data}
          gridData={displayGridData}
          periodMembers={displayPeriodMembers}
          boardData={effectiveBoardData}
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
        onConfirm={(dueDate, estimateMinutes) => {
          submitReassign(dueDate, estimateMinutes).catch(() => undefined);
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
          setReassignTask(task);
          setReassignTarget(toExtension);
          setReassignOverloadConfirm(false);
        }}
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
