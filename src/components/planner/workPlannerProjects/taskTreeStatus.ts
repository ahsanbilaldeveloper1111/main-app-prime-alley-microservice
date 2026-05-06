import { AlertCircle, CheckCircle2, Circle, Clock } from "lucide-react";
import type { Task } from "@planner/workPlannerProjectsDomain";
import type { LucideIcon } from "lucide-react";

export const TASK_STATUS_ICONS: Record<Task["status"], LucideIcon> = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle2,
  overdue: AlertCircle,
};

export function taskStatusClassSuffix(status: Task["status"]): string {
  return status;
}
