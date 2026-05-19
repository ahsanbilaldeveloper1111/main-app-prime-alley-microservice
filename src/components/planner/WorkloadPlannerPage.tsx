import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Container } from "react-bootstrap";
import { toast } from "react-toastify";
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
  type AssigneeMatch,
  type WorkloadGridCell,
  type WorkloadRangePreset,
  type WorkloadGridMember,
  type WorkloadTaskCard,
} from "@utils/tasks";
import {
  formatWorkloadDayDetailDate,
  formatWorkloadMemberLabel,
  getWorkloadWeekRange,
  isWorkloadCustomRangeValid,
  readWorkloadMainViewPreference,
  workloadProjectFilterQuery,
  writeWorkloadMainViewPreference,
  buildWorkloadTaskPatchBody,
  resolveWorkloadTaskEstimateMinutes,
  workloadCellKey,
  workloadPriorityToApiString,
  type WorkloadPriorityFilterValue,
  type WorkloadProjectFilterValue,
} from "@page-modules/planner/workload/workloadDomain";
import type { WorkloadBoardDropIntent } from "./workload/WorkloadBoardPanel";
import {
  WorkloadPlannerAlertStack,
} from "./workload/WorkloadPlannerSubviews";
import {
  WorkloadPlannerDataViews,
} from "./workload/WorkloadPlannerDataViews";
import {
  WorkloadPlannerFiltersCard,
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
  const { hierarchyDataExtensions } = useHierarchyData(ModuleSlug.WORK_PLANNER);

  const [range, setRange] = useState<WorkloadRangePreset>("this_week");
  const defaultWeekRange = useMemo(() => getWorkloadWeekRange("this_week"), []);
  const [customStart, setCustomStart] = useState(defaultWeekRange.start);
  const [customEnd, setCustomEnd] = useState(defaultWeekRange.end);
  const [assigneeMatch, setAssigneeMatch] = useState<AssigneeMatch>("primary");
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
  const [projectFilter, setProjectFilter] = useState<WorkloadProjectFilterValue>("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState<WorkloadPriorityFilterValue>("all");
  const [boardDropIntent, setBoardDropIntent] = useState<WorkloadBoardDropIntent | null>(null);
  const [boardDropOverload, setBoardDropOverload] = useState(false);

  const customRangeValid = useMemo(
    () => range !== "custom" || isWorkloadCustomRangeValid(customStart, customEnd),
    [range, customStart, customEnd],
  );

  const projectFilterKey = useMemo(() => {
    if (projectFilter === "all") return "all";
    if (projectFilter === "none") return "none";
    return String(projectFilter);
  }, [projectFilter]);

  const queryBase = useMemo(() => {
    const base: Parameters<typeof getWorkloadSummary>[0] = {
      extension_number: extension,
      assignee_match: assigneeMatch,
      range,
      ...workloadProjectFilterQuery(projectFilter),
    };
    if (range === "custom" && customRangeValid) {
      base.start = customStart;
      base.end = customEnd;
    }
    if (memberFilter !== "all") {
      base.extension_numbers = [memberFilter];
    }
    return base;
  }, [
    extension,
    assigneeMatch,
    range,
    customStart,
    customEnd,
    customRangeValid,
    projectFilter,
    memberFilter,
  ]);

  const workloadQueryKeyParams = useMemo(
    () => ({
      ext: extension,
      range,
      match: assigneeMatch,
      start: range === "custom" ? customStart : undefined,
      end: range === "custom" ? customEnd : undefined,
      member: memberFilter,
      project: projectFilterKey,
    }),
    [extension, range, assigneeMatch, customStart, customEnd, memberFilter, projectFilterKey],
  );

  const enabled = extension.length > 0 && customRangeValid;

  useEffect(() => {
    writeWorkloadMainViewPreference(mainView);
  }, [mainView]);

  const handleRangeChange = useCallback((value: WorkloadRangePreset) => {
    setRange(value);
    if (value === "custom") {
      const week = getWorkloadWeekRange("this_week");
      setCustomStart(week.start);
      setCustomEnd(week.end);
    }
  }, []);

  const summaryQuery = useQuery({
    queryKey: plannerKeys.workload.summary(workloadQueryKeyParams),
    queryFn: () => getWorkloadSummary(queryBase),
    enabled,
  });

  const gridQuery = useQuery({
    queryKey: plannerKeys.workload.grid(workloadQueryKeyParams),
    queryFn: () => getWorkloadGrid(queryBase),
    enabled,
  });

  const boardQuery = useQuery({
    queryKey: plannerKeys.workload.board(workloadQueryKeyParams),
    queryFn: () => getWorkloadBoard(queryBase),
    enabled: enabled && mainView === "board",
  });

  const dayQuery = useQuery({
    queryKey: plannerKeys.workload.day({
      ext: selectedCell?.extension ?? "",
      date: selectedCell?.date ?? "",
      match: assigneeMatch,
    }),
    queryFn: async () => {
      const cell = selectedCell;
      if (!cell) {
        throw new Error("No day selected");
      }
      return getWorkloadDay({
        extension_number: cell.extension,
        date: cell.date,
        assignee_match: assigneeMatch,
      });
    },
    enabled: Boolean(selectedCell && enabled),
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
    enabled,
    staleTime: 120_000,
  });

  const projectOptions: WorkloadProjectOption[] = projectsQuery.data ?? [];

  const unassignedProjectId =
    typeof projectFilter === "number" ? projectFilter : undefined;

  const unassignedQuery = useQuery({
    queryKey: plannerKeys.workload.unassigned(extension, projectFilterKey),
    queryFn: () =>
      getWorkloadUnassigned({
        extension_number: extension,
        limit: 100,
        project_id: unassignedProjectId,
      }),
    enabled,
    staleTime: 30_000,
  });

  const cellMap = useMemo(() => buildCellMap(gridQuery.data?.cells), [gridQuery.data?.cells]);

  const completedTaskCount = useMemo(() => {
    if (!boardQuery.data?.columns) return 0;
    return boardQuery.data.columns.reduce(
      (total, col) => total + col.tasks.filter((t) => t.is_completed).length,
      0,
    );
  }, [boardQuery.data?.columns]);

  const memberExtensions = useMemo(() => {
    const fromMembers = gridQuery.data?.members?.map((m) => m.extension_number) ?? [];
    if (fromMembers.length > 0) return fromMembers;
    const fromGridRoot = gridQuery.data?.extension_numbers ?? [];
    if (fromGridRoot.length > 0) return fromGridRoot;
    return boardQuery.data?.columns?.map((c) => c.extension_number) ?? [];
  }, [gridQuery.data?.members, gridQuery.data?.extension_numbers, boardQuery.data?.columns]);

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
        assignee_match: assigneeMatch,
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
    assigneeMatch,
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
        assignee_match: assigneeMatch,
      });
      if (check.overloaded) setBoardDropOverload(true);
    },
    [assigneeMatch, boardQuery.data?.range.start],
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
        assignee_match: assigneeMatch,
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
    assigneeMatch,
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

  const handleExportCsv = useCallback(() => {
    toast.info("CSV export will be available in a later release.");
  }, []);

  const loadingMain =
    !enabled ||
    summaryQuery.isPending ||
    (mainView === "grid" && gridQuery.isPending) ||
    (mainView === "board" && boardQuery.isPending);

  return (
    <div className="workload-page">
      <Container fluid className="px-3 px-md-4 py-3">
        <BreadcrumbItem mainTitle="Planner" mainLink="/planner/dashboard" subTitle="Workload" />

        <WorkloadPlannerPageHeader
          onExportCsv={handleExportCsv}
          onRefresh={() => invalidateWorkload()}
          onOpenUnassigned={() => setShowUnassigned(true)}
          enabled={enabled}
          unassignedCount={unassignedQuery.data?.count}
        />

        <WorkloadPlannerAlertStack
          sessionStatus={sessionStatus}
          enabled={enabled}
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

        <WorkloadPlannerFiltersCard
          range={range}
          onRangeChange={handleRangeChange}
          customStart={customStart}
          customEnd={customEnd}
          onCustomStartChange={setCustomStart}
          onCustomEndChange={setCustomEnd}
          customRangeInvalid={range === "custom" && !customRangeValid}
          assigneeMatch={assigneeMatch}
          onAssigneeMatchChange={setAssigneeMatch}
          mainView={mainView}
          onMainViewChange={setMainView}
          projectFilter={projectFilter}
          onProjectFilterChange={setProjectFilter}
          projectOptions={projectOptions}
          memberFilter={memberFilter}
          onMemberFilterChange={setMemberFilter}
          memberExtensions={memberExtensions}
          hierarchyExtensions={hierarchyDataExtensions}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          enabled={extension.length > 0}
        />

        <WorkloadPlannerDataViews
          loadingMain={loadingMain}
          enabled={enabled}
          mainView={mainView}
          summaryData={summaryQuery.data}
          gridData={gridQuery.data}
          boardData={boardQuery.data}
          cellMap={cellMap}
          hierarchyExtensions={hierarchyDataExtensions}
          priorityFilter={priorityFilter}
          boardDragSaving={boardDragMutation.isPending}
          onBoardDropIntent={handleBoardDropIntent}
          unassignedCount={unassignedQuery.data?.count}
          completedCount={completedTaskCount}
          onOpenUnassigned={() => setShowUnassigned(true)}
          onSelectCell={(extension, date) => {
            const member = gridQuery.data?.members?.find(
              (m) => m.extension_number === extension,
            );
            const cell = cellMap.get(workloadCellKey(extension, date));
            setSelectedCell({ extension, date, member, cell });
          }}
        />

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
      </Container>
    </div>
  );
};

export default WorkloadPlannerPage;
