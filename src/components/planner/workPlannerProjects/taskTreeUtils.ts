import type { SubTask, Task } from "@planner/workPlannerProjectsDomain";

export function computeOpenSubtaskCount(task: Task): number | null {
  if (task.children && task.children.length > 0) {
    return task.children.filter((c) => c.status !== "done").length;
  }
  if (task.subtasks && task.subtasks.length > 0) {
    return task.subtasks.filter((s) => s.status !== "done").length;
  }
  const total = task.sub_task_count;
  if (total == null || total <= 0) {
    return null;
  }
  return Math.max(0, total - (task.completed_sub_task_count ?? 0));
}

export function getSubtaskBadgeCounts(task: Task): { completed: number; total: number } | null {
  if (task.children && task.children.length > 0) {
    const total = task.children.length;
    const completed = task.children.filter((c) => c.status === "done").length;
    return { completed, total };
  }
  const total = task.sub_task_count;
  if (total == null || total <= 0) {
    return null;
  }
  return { completed: task.completed_sub_task_count ?? 0, total };
}

export function plannerChildTasksToSubTasks(children: Task[]): SubTask[] {
  return children.map((c) => ({
    id: c.id,
    title: c.title,
    status: c.status,
    assignee: c.assignee,
    dueDate: c.dueDate,
    description: c.description,
    assigneeExtensionNumbers: c.assigneeExtensionNumbers,
    watcherExtensionNumbers: c.watcherExtensionNumbers,
  }));
}
