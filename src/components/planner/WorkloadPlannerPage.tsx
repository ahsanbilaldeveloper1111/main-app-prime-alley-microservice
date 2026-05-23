import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Container } from "react-bootstrap";
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
  getWorkloadOverloadCheck,
  getWorkloadSummary,
  getWorkloadUnassigned,
  listProjects,
  patchWorkloadTask,
  updateTask,
  type WorkloadGridCell,
  type WorkloadRangePreset,
  type WorkloadGridMember,
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
  workloadProjectFilterQuery,
  writeWorkloadMainViewPreference,
  buildWorkloadTaskPatchBody,
  resolveWorkloadTaskEstimateMinutes,
  workloadCellKey,
  workloadPriorityToApiString,
  type WorkloadPlannerFilterState,
} from "@page-modules/planner/workload/workloadDomain";
import type { WorkloadBoardDropIntent } from "./workload/WorkloadBoardPanel";
import { useWorkloadTeamScope } from "./workload/useWorkloadTeamScope";
import {
  buildWorkloadGridBoardQuery,
  buildWorkloadSummaryQuery,
} from "@page-modules/planner/workload/workloadTeamScope";
import {
  WorkloadPlannerAlertStack,
} from "./workload/WorkloadPlannerSubviews";
import {
  WorkloadPlannerDataViews,
} from "./workload/WorkloadPlannerDataViews";
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

type MainView = "grid" | "board";

function isForbiddenError(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 403;
}

function workloadErrorMessage(err: unknown): string {
  if (isAxiosError(err) && typeof err.response?.data === "object" && err.response.data !== null) {
    const msg = (err.response.data as { message?: string }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

function buildCellMap(cells: WorkloadGridCell[] | undefined): Map<string, WorkloadGridCell> {
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
  const extension = useMemo(() => getSessionPhoneOrExtension(session), [session]);
  const sessionUserId = useMemo(() => {
    const id = (session?.user as { id?: string | number } | undefined)?.id;
    return id == null ? "" : String(id).trim();
  }, [session?.user]);
  const teamScope = useWorkloadTeamScope(sessionUserId, extension, sessionStatus);
  const { hierarchyDataExtensions } = useHierarchyData(ModuleSlug.WORK_PLANNER);

  const [draftFilters, setDraftFilters] = useState<WorkloadPlannerFilterState>(
    createDefaultWorkloadPlannerFilters,
  );
  const [appliedFilters, setAppliedFilters] = useState<WorkloadPlannerFilterState>(
    createDefaultWorkloadPlannerFilters,
  );
  const [mainView, setMainView] = useState<MainView>(() => readWorkloadMainViewPreference());
  const [reassignOverloadConfirm, setReassignOverloadConfirm] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    extension: string;
    date: string;
    member?: Pick<WorkloadGridMember, "name" | "display_name">;
    cell?: WorkloadGridCell;
  } | null>(null);
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [assignTargets, setAssignTargets] = useState<Record<number, string>>({});
  const [reassignTask, setReassignTask] = useState<WorkloadTaskCard | null>(null);
  const [reassignTarget, setReassignTarget] = useState("");
  const [rescheduleTask, setRescheduleTask] = useState<WorkloadTaskCard | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [overloadSecondStep, setOverloadSecondStep] = useState(false);
  const [boardDropIntent, setBoardDropIntent] = useState<WorkloadBoardDropIntent | null>(null);
  const [boardDropOverload, setBoardDropOverload] = useState(false);
  const [showWorkloadPerDay, setShowWorkloadPerDay] = useState(true);

  const appliedRangeValid = useMemo(
    () => isWorkloadPlannerDraftRangeValid(appliedFilters),
    [appliedFilters],
  );

  const draftRangeInvalid = useMemo(
    () => !isWorkloadPlannerDraftRangeValid(draftFilters),
    [draftFilters],
  );

  const appliedProjectFilterKey = useMemo(() => {
    const { projectFilter } = appliedFilters;
    if (projectFilter === "all") return "all";
    if (projectFilter === "none") return "none";
    return String(projectFilter);
  }, [appliedFilters]);

  const queryBase = useMemo(() => {
    const { range, customStart, customEnd, assigneeMatch, projectFilter, memberFilter } =
      appliedFilters;
    const base: Parameters<typeof getWorkloadSummary>[0] = {
      extension_number: extension,
      assignee_match: assigneeMatch,
      range,
      ...workloadProjectFilterQuery(projectFilter),
    };
    if (range === "custom" && appliedRangeValid) {
      base.start = customStart;
      base.end = customEnd;
    }
    if (memberFilter !== "all") {
      base.extension_numbers = [memberFilter];
    }
    return base;
  }, [extension, appliedFilters, appliedRangeValid]);

  const workloadQueryKeyParams = useMemo(() => {
    const { range, customStart, customEnd, assigneeMatch, memberFilter } = appliedFilters;
    return {
      ext: extension,
      range,
      match: assigneeMatch,
      start: range === "custom" ? customStart : undefined,
      end: range === "custom" ? customEnd : undefined,
      member: memberFilter,
      project: appliedProjectFilterKey,
    };
  }, [extension, appliedFilters, appliedProjectFilterKey]);

  const queriesEnabled = extension.length > 0 && appliedRangeValid;
  const filtersEnabled = extension.length > 0;

  useEffect(() => {
    writeWorkloadMainViewPreference(mainView);
  }, [mainView]);

  const handleDraftRangeChange = useCallback((value: WorkloadRangePreset) => {
    setDraftFilters((prev) => {
      if (value === "custom") {
        const week = getWorkloadWeekRange("this_week");
        return { ...prev, range: value, customStart: week.start, customEnd: week.end };
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
      const rows = (res as { data?: { id?: number; name?: string }[] } | null)?.data ?? [];
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
    queryKey: plannerKeys.workload.unassigned(extension, appliedProjectFilterKey),
    queryFn: () =>
      getWorkloadUnassigned({
        extension_number: extension,
        limit: 100,
        project_id: unassignedProjectId,
      }),
    enabled: queriesEnabled,
    staleTime: 30_000,
  });

  const gridRangeFallback = useMemo((): { start: string; end: string } => {
    const { range, customStart, customEnd } = appliedFilters;
    if (range === "custom" && appliedRangeValid) {
      return { start: customStart, end: customEnd };
    }
    return getWorkloadWeekRange(range === "next_week" ? "next_week" : "this_week");
  }, [appliedFilters, appliedRangeValid]);

  const displayGridData = useMemo(
    () =>
      resolveWorkloadGridDisplayData(gridQuery.data, {
        viewerExtension: extension,
        memberFilter: appliedFilters.memberFilter,
        rangeFallback: gridRangeFallback,
        teamExtensionNumbers:
          teamScope.teamExtensions.length > 0 ? teamScope.teamExtensions : undefined,
      }),
    [gridQuery.data, extension, appliedFilters.memberFilter, gridRangeFallback],
  );

  const cellMap = useMemo(
    () => buildCellMap(displayGridData?.cells ?? gridQuery.data?.cells),
    [displayGridData?.cells, gridQuery.data?.cells],
  );

  const memberExtensions = useMemo(() => {
    if (teamScope.teamExtensions.length > 0) {
      return teamScope.teamExtensions;
    }
    const fromDisplay = displayGridData?.members?.map((m) => m.extension_number) ?? [];
    if (fromDisplay.length > 0) return fromDisplay;
    if (extension) return [extension];
    return boardQuery.data?.columns?.map((c) => c.extension_number) ?? [];
  }, [
    teamScope.teamExtensions,
    displayGridData?.members,
    extension,
    boardQuery.data?.columns,
  ]);

  const displayPeriodMembers = useMemo(
    () =>
      resolveWorkloadPeriodDisplayMembers(
        summaryQuery.data?.members,
        extension,
        teamScope.teamExtensions.length > 0 ? teamScope.teamExtensions : undefined,
      ),
    [summaryQuery.data?.members, extension, teamScope.teamExtensions],
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
    mutationFn: async ({ task, minutes }: { task: WorkloadTaskCard; minutes: number }) => {
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
    mutationFn: async (payload: { task: WorkloadTaskCard; dueDate: string }) => {
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

  const openReschedule = useCallback((task: WorkloadTaskCard) => {
    setRescheduleTask(task);
    const d = task.due_date?.slice(0, 10) ?? selectedCell?.date ?? "";
    setRescheduleDate(d);
    setOverloadSecondStep(false);
  }, [selectedCell?.date]);

  const submitReassign = useCallback(async () => {
    if (!reassignTask || !reassignTarget || !selectedCell) return;
    if (reassignOverloadConfirm) {
      assignMutation.mutate({ task: reassignTask, toExtension: reassignTarget });
      return;
    }
    const minutes = resolveWorkloadTaskEstimateMinutes(reassignTask);
    try {
      const check = await getWorkloadOverloadCheck({
        extension_number: reassignTarget,
        date: selectedCell.date,
        additional_estimated_minutes: minutes,
        exclude_task_id: reassignTask.id,
        assignee_match: appliedFilters.assigneeMatch,
      });
      if (check.overloaded) {
        setReassignOverloadConfirm(true);
        return;
      }
      assignMutation.mutate({ task: reassignTask, toExtension: reassignTarget });
    } catch (err) {
      toast.error(workloadErrorMessage(err));
    }
  }, [
    assignMutation,
    appliedFilters.assigneeMatch,
    reassignOverloadConfirm,
    reassignTarget,
    reassignTask,
    selectedCell,
  ]);

  const boardDragMutation = useMutation({
    mutationFn: async (intent: WorkloadBoardDropIntent) => {
      await patchWorkloadTask(
        intent.task.id,
        extension,
        buildWorkloadTaskPatchBody(intent.task, {
          ...(intent.toExtension ? { extension_numbers: [intent.toExtension] } : {}),
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

  const checkBoardDropOverload = useCallback(
    async (intent: WorkloadBoardDropIntent) => {
      const targetDate =
        intent.toDate ??
        intent.task.due_date?.slice(0, 10) ??
        boardQuery.data?.range.start ??
        "";
      const minutes = resolveWorkloadTaskEstimateMinutes(intent.task);
      if (!targetDate || !intent.toExtension) {
        return;
      }
      const check = await getWorkloadOverloadCheck({
        extension_number: intent.toExtension,
        date: targetDate,
        additional_estimated_minutes: minutes,
        exclude_task_id: intent.task.id,
        assignee_match: appliedFilters.assigneeMatch,
      });
      if (check.overloaded) setBoardDropOverload(true);
    },
    [appliedFilters.assigneeMatch, boardQuery.data?.range.start],
  );

  const handleBoardDropIntent = useCallback(
    (intent: WorkloadBoardDropIntent) => {
      setBoardDropIntent(intent);
      setBoardDropOverload(false);
      checkBoardDropOverload(intent).catch(() => undefined);
    },
    [checkBoardDropOverload],
  );

  const confirmBoardDrop = useCallback(() => {
    if (!boardDropIntent) return;
    boardDragMutation.mutate(boardDropIntent);
  }, [boardDragMutation, boardDropIntent]);

  const submitReschedule = useCallback(async () => {
    if (!rescheduleTask || !rescheduleDate) return;
    if (overloadSecondStep) {
      rescheduleMutation.mutate({ task: rescheduleTask, dueDate: rescheduleDate });
      return;
    }
    const minutes = resolveWorkloadTaskEstimateMinutes(rescheduleTask);
    try {
      const check = await getWorkloadOverloadCheck({
        extension_number: rescheduleTask.primary_assignee_extension ?? extension,
        date: rescheduleDate,
        additional_estimated_minutes: minutes,
        exclude_task_id: rescheduleTask.id,
        assignee_match: appliedFilters.assigneeMatch,
      });
      if (check.overloaded && !overloadSecondStep) {
        setOverloadSecondStep(true);
        return;
      }
      rescheduleMutation.mutate({ task: rescheduleTask, dueDate: rescheduleDate });
    } catch (err) {
      toast.error(workloadErrorMessage(err));
    }
  }, [
    appliedFilters.assigneeMatch,
    extension,
    overloadSecondStep,
    rescheduleDate,
    rescheduleMutation,
    rescheduleTask,
  ]);

  const summaryForbidden = summaryQuery.isError && isForbiddenError(summaryQuery.error);
  const gridForbidden = gridQuery.isError && isForbiddenError(gridQuery.error);
  const boardForbidden = boardQuery.isError && isForbiddenError(boardQuery.error);
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

  const loadingMain =
    !queriesEnabled ||
    summaryQuery.isPending ||
    (mainView === "grid" && gridQuery.isPending) ||
    (mainView === "board" && boardQuery.isPending);

  const applyDisabled =
    !filtersEnabled || draftRangeInvalid || !hasPendingFilters || loadingMain;

  const isApplyingFilters =
    !hasPendingFilters &&
    queriesEnabled &&
    (summaryQuery.isFetching ||
      (mainView === "grid" && gridQuery.isFetching) ||
      (mainView === "board" && boardQuery.isFetching));

  return (
    <div className="workload-page">
      <Container fluid className="px-3 px-md-4 py-3">
        <BreadcrumbItem mainTitle="Planner" mainLink="/planner/dashboard" subTitle="Workload" />

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
          customRangeInvalid={draftFilters.range === "custom" && draftRangeInvalid}
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
          boardData={boardQuery.data}
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
      </Container>

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
            markDoneMutation.isPending ? (markDoneMutation.variables?.id ?? null) : null
          }
          onSaveEstimate={(task, minutes) => {
            estimateMutation.mutate({ task, minutes });
          }}
          estimateSavingTaskId={
            estimateMutation.isPending ? (estimateMutation.variables?.task.id ?? null) : null
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
          assignMutation={{
            isPending: assignMutation.isPending,
            mutate: assignMutation.mutate,
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
    </div>
  );
};

export default WorkloadPlannerPage;
