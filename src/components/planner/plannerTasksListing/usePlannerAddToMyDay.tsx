import { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import { Sun } from "lucide-react";
import { toast } from "react-toastify";
import type { TableAction } from "@components/GenericTable";
import { addTaskToMyDay, listMyDayTasks } from "@utils/tasks";
import type { Task } from "./plannerTasksListingDomain";
import {
  type PlannerAddToMyDayTarget,
  extractMyDayTaskIdsFromListPayload,
  isPlannerTaskInMyDay,
  listingTaskToAddToMyDayTarget,
  plannerAddToMyDayDisabledTitle,
  taskRowEstimateMinutes,
} from "./plannerTasksListingMyDay";

type UsePlannerAddToMyDayOptions = Readonly<{
  canUseMyDay: boolean;
  extensionNumber?: string;
  onAdded?: () => void;
}>;

function isAddToMyDaySuccess(result: {
  added?: boolean;
  already_in_my_day?: boolean;
}): boolean {
  if (result.already_in_my_day) return false;
  if (result.added === true) return true;
  if (result.added === false) return false;
  return true;
}

export function usePlannerAddToMyDay({
  canUseMyDay,
  extensionNumber = "",
  onAdded,
}: UsePlannerAddToMyDayOptions) {
  const today = useMemo(() => moment().format("YYYY-MM-DD"), []);
  const [pendingTask, setPendingTask] = useState<PlannerAddToMyDayTarget | null>(null);
  const [estimateInput, setEstimateInput] = useState("");
  const [myDayTaskIds, setMyDayTaskIds] = useState<Set<number>>(() => new Set());

  const refreshMyDayTaskIds = useCallback(async () => {
    if (!canUseMyDay) return;
    try {
      const payload = await listMyDayTasks({
        date: today,
        extension_number: extensionNumber || undefined,
      });
      setMyDayTaskIds(extractMyDayTaskIdsFromListPayload(payload));
    } catch {
      // Non-blocking: list UI still works; add flow validates on submit.
    }
  }, [canUseMyDay, extensionNumber, today]);

  useEffect(() => {
    refreshMyDayTaskIds().catch(() => undefined);
  }, [refreshMyDayTaskIds]);

  const markTaskInMyDay = useCallback((taskId: number) => {
    setMyDayTaskIds((prev) => {
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });
  }, []);

  const closeEstimateModal = useCallback(() => {
    setPendingTask(null);
    setEstimateInput("");
  }, []);

  const performAdd = useCallback(
    async (task: PlannerAddToMyDayTarget, estimatedMinutes?: number) => {
      const payload: { task_id: number; plan_date: string; estimated_minutes?: number } = {
        task_id: task.id,
        plan_date: today,
      };
      if (estimatedMinutes != null && estimatedMinutes > 0) {
        payload.estimated_minutes = estimatedMinutes;
      }
      const result = await addTaskToMyDay(
        payload,
        extensionNumber || undefined,
      );

      if (result.already_in_my_day) {
        markTaskInMyDay(task.id);
        toast.info("Task is already on My Day");
        onAdded?.();
        await refreshMyDayTaskIds();
        return;
      }

      if (!isAddToMyDaySuccess(result)) {
        toast.error("Failed to add task to My Day");
        return;
      }

      markTaskInMyDay(task.id);
      toast.success("Added to My Day");
      onAdded?.();
      await refreshMyDayTaskIds();
    },
    [extensionNumber, markTaskInMyDay, onAdded, refreshMyDayTaskIds, today],
  );

  const requestAddTaskToMyDay = useCallback(
    (task: PlannerAddToMyDayTarget) => {
      if (!canUseMyDay) {
        toast.error(plannerAddToMyDayDisabledTitle(false, false));
        return;
      }
      if (isPlannerTaskInMyDay(task, myDayTaskIds)) {
        toast.info("Task is already on My Day");
        return;
      }
      const minutes = taskRowEstimateMinutes(task);
      if (minutes <= 0) {
        setPendingTask(task);
        setEstimateInput("");
        return;
      }
      performAdd(task, minutes).catch(() => {
        toast.error("Failed to add task to My Day");
      });
    },
    [canUseMyDay, myDayTaskIds, performAdd],
  );

  const skipEstimateAndAdd = useCallback(() => {
    if (!pendingTask) return;
    const task = pendingTask;
    closeEstimateModal();
    performAdd(task).catch(() => {
      toast.error("Failed to add task to My Day");
    });
  }, [closeEstimateModal, pendingTask, performAdd]);

  const confirmEstimateAndAdd = useCallback(() => {
    if (!pendingTask) return;
    const parsed = Number.parseInt(estimateInput.trim(), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Please add valid estimate minutes");
      return;
    }
    const task = pendingTask;
    closeEstimateModal();
    performAdd(task, parsed).catch(() => {
      toast.error("Failed to add task to My Day");
    });
  }, [closeEstimateModal, estimateInput, pendingTask, performAdd]);

  const isTaskInMyDay = useCallback(
    (target: PlannerAddToMyDayTarget) => isPlannerTaskInMyDay(target, myDayTaskIds),
    [myDayTaskIds],
  );

  const canAddTaskToMyDay = useCallback(
    (row: PlannerAddToMyDayTarget) => canUseMyDay && !isTaskInMyDay(row),
    [canUseMyDay, isTaskInMyDay],
  );

  const addToMyDayTableAction: TableAction<Task> = useMemo(
    () => ({
      label: "Add to My Day",
      disabledLabel: "Already in My Day",
      icon: <Sun size={14} />,
      show: () => canUseMyDay,
      disabled: (row) => !canAddTaskToMyDay(listingTaskToAddToMyDayTarget(row)),
      disabledTitle: "Task is already on My Day",
      disabledClassName: "text-muted",
      onClick: (row) => requestAddTaskToMyDay(listingTaskToAddToMyDayTarget(row)),
    }),
    [canAddTaskToMyDay, canUseMyDay, requestAddTaskToMyDay],
  );

  return {
    today,
    pendingTask,
    estimateInput,
    setEstimateInput,
    closeEstimateModal,
    requestAddTaskToMyDay,
    skipEstimateAndAdd,
    confirmEstimateAndAdd,
    canAddTaskToMyDay,
    isTaskInMyDay,
    addToMyDayTableAction,
    refreshMyDayTaskIds,
  };
}
