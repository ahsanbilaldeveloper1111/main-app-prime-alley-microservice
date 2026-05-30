import { useCallback } from "react";
import { toast } from "react-toastify";
import {
  getWorkloadOverloadCheck,
  type AssigneeMatch,
  type WorkloadTaskCard,
} from "@utils/tasks";
import { resolveWorkloadTaskEstimateMinutes } from "@page-modules/planner/workload/workloadDomain";
import type { WorkloadBoardDropIntent } from "./WorkloadBoardPanel";
import type { WorkloadSelectedCellState } from "./workloadPlannerPageHelpers";

type AssignMutation = Readonly<{
  mutate: (vars: { task: WorkloadTaskCard; toExtension: string }) => void;
}>;

type RescheduleMutation = Readonly<{
  mutate: (vars: { task: WorkloadTaskCard; dueDate: string }) => void;
}>;

type BoardDragMutation = Readonly<{
  mutate: (intent: WorkloadBoardDropIntent) => void;
}>;

type UseWorkloadPlannerTaskActionsParams = Readonly<{
  extension: string;
  assigneeMatch: AssigneeMatch;
  boardRangeStart: string | undefined;
  reassignTask: WorkloadTaskCard | null;
  reassignTarget: string;
  reassignOverloadConfirm: boolean;
  selectedCell: WorkloadSelectedCellState;
  rescheduleTask: WorkloadTaskCard | null;
  rescheduleDate: string;
  overloadSecondStep: boolean;
  boardDropIntent: WorkloadBoardDropIntent | null;
  assignMutation: AssignMutation;
  rescheduleMutation: RescheduleMutation;
  boardDragMutation: BoardDragMutation;
  setReassignOverloadConfirm: (value: boolean) => void;
  setOverloadSecondStep: (value: boolean) => void;
  setBoardDropIntent: (value: WorkloadBoardDropIntent | null) => void;
  setBoardDropOverload: (value: boolean) => void;
  formatError: (err: unknown) => string;
}>;

export function useWorkloadPlannerTaskActions({
  extension,
  assigneeMatch,
  boardRangeStart,
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
  formatError,
}: UseWorkloadPlannerTaskActionsParams) {
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
      toast.error(formatError(err));
    }
  }, [
    assignMutation,
    assigneeMatch,
    formatError,
    reassignOverloadConfirm,
    reassignTarget,
    reassignTask,
    selectedCell,
    setReassignOverloadConfirm,
  ]);

  const checkBoardDropOverload = useCallback(
    async (intent: WorkloadBoardDropIntent) => {
      const targetDate =
        intent.toDate ?? intent.task.due_date?.slice(0, 10) ?? boardRangeStart ?? "";
      if (!targetDate || !intent.toExtension) return;

      const minutes = resolveWorkloadTaskEstimateMinutes(intent.task);
      const check = await getWorkloadOverloadCheck({
        extension_number: intent.toExtension,
        date: targetDate,
        additional_estimated_minutes: minutes,
        exclude_task_id: intent.task.id,
        assignee_match: assigneeMatch,
      });
      if (check.overloaded) setBoardDropOverload(true);
    },
    [assigneeMatch, boardRangeStart, setBoardDropOverload],
  );

  const handleBoardDropIntent = useCallback(
    (intent: WorkloadBoardDropIntent) => {
      setBoardDropIntent(intent);
      setBoardDropOverload(false);
      checkBoardDropOverload(intent).catch(() => undefined);
    },
    [checkBoardDropOverload, setBoardDropIntent, setBoardDropOverload],
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
      if (check.overloaded) {
        setOverloadSecondStep(true);
        return;
      }
      rescheduleMutation.mutate({ task: rescheduleTask, dueDate: rescheduleDate });
    } catch (err) {
      toast.error(formatError(err));
    }
  }, [
    assigneeMatch,
    extension,
    formatError,
    overloadSecondStep,
    rescheduleDate,
    rescheduleMutation,
    rescheduleTask,
    setOverloadSecondStep,
  ]);

  return {
    submitReassign,
    submitReschedule,
    handleBoardDropIntent,
    confirmBoardDrop,
  };
}
