import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { plannerKeys } from "../../../query/keys";
import {
  patchWorkloadTask,
  updateTask,
  type WorkloadTaskCard,
} from "@utils/tasks";
import {
  buildWorkloadTaskPatchBody,
  workloadPriorityToApiString,
} from "@page-modules/planner/workload/workloadDomain";
import type { WorkloadBoardDropIntent } from "./WorkloadBoardPanel";
import { workloadPlannerErrorMessage } from "./workloadPlannerPageHelpers";
import type { useWorkloadPlannerPageData } from "./useWorkloadPlannerPageData";

type WorkloadData = ReturnType<typeof useWorkloadPlannerPageData>;

type UseWorkloadPlannerPageMutationsInput = Readonly<{
  extension: string;
  data: Pick<
    WorkloadData,
    "dayQuery" | "unassignedQuery"
  >;
  onAssignSuccess: () => void;
  onRescheduleSuccess: () => void;
  onBoardDropSuccess: () => void;
}>;

export function useWorkloadPlannerPageMutations({
  extension,
  data,
  onAssignSuccess,
  onRescheduleSuccess,
  onBoardDropSuccess,
}: UseWorkloadPlannerPageMutationsInput) {
  const { dayQuery, unassignedQuery } = data;
  const queryClient = useQueryClient();

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
      onAssignSuccess();
      invalidateWorkload();
      unassignedQuery.refetch().catch(() => undefined);
      dayQuery.refetch().catch(() => undefined);
    },
    onError: (err: unknown) => {
      toast.error(workloadPlannerErrorMessage(err));
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
      toast.error(workloadPlannerErrorMessage(err));
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
      toast.error(workloadPlannerErrorMessage(err));
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
      onRescheduleSuccess();
      invalidateWorkload();
      dayQuery.refetch().catch(() => undefined);
    },
    onError: (err: unknown) => {
      toast.error(workloadPlannerErrorMessage(err));
    },
  });

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
      onBoardDropSuccess();
      invalidateWorkload();
    },
    onError: (err: unknown) => {
      toast.error(workloadPlannerErrorMessage(err));
    },
  });

  return {
    assignMutation,
    estimateMutation,
    markDoneMutation,
    rescheduleMutation,
    boardDragMutation,
    formatError: workloadPlannerErrorMessage,
  };
}
