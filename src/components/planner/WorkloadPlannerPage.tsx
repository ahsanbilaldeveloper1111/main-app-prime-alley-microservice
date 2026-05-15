import React, { useCallback, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Container } from "react-bootstrap";
import { toast } from "react-toastify";
import { getSessionPhoneOrExtension } from "@planner/projectMemberRole";
import { plannerKeys } from "../../query/keys";
import {
  getWorkloadBoard,
  getWorkloadDay,
  getWorkloadGrid,
  getWorkloadOverloadCheck,
  getWorkloadSummary,
  getWorkloadUnassigned,
  patchWorkloadTask,
  type AssigneeMatch,
  type WorkloadGridCell,
  type WorkloadRangePreset,
  type WorkloadTaskCard,
} from "@utils/tasks";
import {
  getWorkloadWeekRange,
  isWorkloadCustomRangeValid,
  workloadCellKey,
} from "@page-modules/planner/workload/workloadDomain";
import {
  WorkloadPlannerAlertStack,
} from "./workload/WorkloadPlannerSubviews";
import {
  WorkloadPlannerDataViews,
} from "./workload/WorkloadPlannerDataViews";
import {
  WorkloadPlannerFiltersCard,
  WorkloadPlannerPageHeader,
} from "./workload/WorkloadPlannerChrome";
import {
  WorkloadDayOffcanvas,
  WorkloadRescheduleModal,
  WorkloadUnassignedOffcanvas,
} from "./workload/WorkloadPlannerDialogs";

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
  const router = useRouter();
  const queryClient = useQueryClient();
  const extension = useMemo(() => getSessionPhoneOrExtension(session), [session]);

  const [range, setRange] = useState<WorkloadRangePreset>("this_week");
  const defaultWeekRange = useMemo(() => getWorkloadWeekRange("this_week"), []);
  const [customStart, setCustomStart] = useState(defaultWeekRange.start);
  const [customEnd, setCustomEnd] = useState(defaultWeekRange.end);
  const [assigneeMatch, setAssigneeMatch] = useState<AssigneeMatch>("primary");
  const [mainView, setMainView] = useState<MainView>("grid");
  const [selectedCell, setSelectedCell] = useState<{ extension: string; date: string } | null>(
    null,
  );
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [assignTargets, setAssignTargets] = useState<Record<number, string>>({});
  const [rescheduleTask, setRescheduleTask] = useState<WorkloadTaskCard | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [overloadSecondStep, setOverloadSecondStep] = useState(false);

  const customRangeValid = useMemo(
    () => range !== "custom" || isWorkloadCustomRangeValid(customStart, customEnd),
    [range, customStart, customEnd],
  );

  const queryBase = useMemo(() => {
    const base: Parameters<typeof getWorkloadSummary>[0] = {
      extension_number: extension,
      assignee_match: assigneeMatch,
      range,
    };
    if (range === "custom" && customRangeValid) {
      base.start = customStart;
      base.end = customEnd;
    }
    return base;
  }, [extension, assigneeMatch, range, customStart, customEnd, customRangeValid]);

  const workloadQueryKeyParams = useMemo(
    () => ({
      ext: extension,
      range,
      match: assigneeMatch,
      start: range === "custom" ? customStart : undefined,
      end: range === "custom" ? customEnd : undefined,
    }),
    [extension, range, assigneeMatch, customStart, customEnd],
  );

  const enabled = extension.length > 0 && customRangeValid;

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

  const unassignedQuery = useQuery({
    queryKey: plannerKeys.workload.unassigned(extension),
    queryFn: () => getWorkloadUnassigned({ extension_number: extension, limit: 100 }),
    enabled,
    staleTime: 30_000,
  });

  const cellMap = useMemo(() => buildCellMap(gridQuery.data?.cells), [gridQuery.data?.cells]);

  const memberExtensions = useMemo(() => {
    const fromMembers = gridQuery.data?.members?.map((m) => m.extension_number) ?? [];
    if (fromMembers.length > 0) return fromMembers;
    const fromGridRoot = gridQuery.data?.extension_numbers ?? [];
    if (fromGridRoot.length > 0) return fromGridRoot;
    return boardQuery.data?.columns?.map((c) => c.extension_number) ?? [];
  }, [gridQuery.data?.members, gridQuery.data?.extension_numbers, boardQuery.data?.columns]);

  const invalidateWorkload = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: plannerKeys.workload.all() });
  }, [queryClient]);

  const assignMutation = useMutation({
    mutationFn: async ({ taskId, toExtension }: { taskId: number; toExtension: string }) => {
      if (!toExtension) throw new Error("Choose a team member.");
      await patchWorkloadTask(taskId, extension, { extension_numbers: [toExtension] });
    },
    onSuccess: () => {
      toast.success("Task assigned");
      invalidateWorkload();
      void unassignedQuery.refetch();
    },
    onError: (err: unknown) => {
      toast.error(workloadErrorMessage(err));
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: async (payload: { taskId: number; dueDate: string }) => {
      await patchWorkloadTask(payload.taskId, extension, { due_date: payload.dueDate });
    },
    onSuccess: () => {
      toast.success("Task rescheduled");
      setRescheduleTask(null);
      setOverloadSecondStep(false);
      invalidateWorkload();
      void dayQuery.refetch();
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

  const submitReschedule = useCallback(async () => {
    if (!rescheduleTask || !rescheduleDate) return;
    if (overloadSecondStep) {
      rescheduleMutation.mutate({ taskId: rescheduleTask.id, dueDate: rescheduleDate });
      return;
    }
    const minutes = rescheduleTask.estimated_duration_minutes ?? 0;
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
      rescheduleMutation.mutate({ taskId: rescheduleTask.id, dueDate: rescheduleDate });
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
          onSelectCell={(extension, date) => setSelectedCell({ extension, date })}
        />

        <WorkloadDayOffcanvas
          selected={selectedCell}
          onClose={() => setSelectedCell(null)}
          dayQuery={dayQuery}
          router={router}
          onReschedule={openReschedule}
          formatError={workloadErrorMessage}
        />

        <WorkloadUnassignedOffcanvas
          show={showUnassigned}
          onClose={() => setShowUnassigned(false)}
          unassignedQuery={unassignedQuery}
          memberExtensions={memberExtensions}
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
          onClose={() => {
            setRescheduleTask(null);
            setOverloadSecondStep(false);
          }}
          rescheduleDate={rescheduleDate}
          onDateChange={(value) => {
            setRescheduleDate(value);
            setOverloadSecondStep(false);
          }}
          overloadSecondStep={overloadSecondStep}
          isSaving={rescheduleMutation.isPending}
          onSubmit={() => {
            void submitReschedule();
          }}
        />
      </Container>
    </div>
  );
};

export default WorkloadPlannerPage;
