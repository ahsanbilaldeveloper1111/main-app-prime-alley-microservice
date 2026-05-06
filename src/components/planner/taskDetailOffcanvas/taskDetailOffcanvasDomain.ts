import type { TaskDetailAssignee, TaskDetailRawData, TaskDetailWatcher } from "./taskDetailOffcanvasTypes";

/** Matches prior offcanvas copy: en-US short date + time. */
export function formatOffcanvasActivityDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

export function resolveOffcanvasWatchers(raw: TaskDetailRawData | undefined): TaskDetailWatcher[] {
  if (raw?.watchers?.length) {
    return raw.watchers;
  }
  if (raw?.watcher_numbers?.length) {
    return raw.watcher_numbers.map((extNum) => ({ extension_number: extNum }));
  }
  return [];
}

export function offcanvasAssigneeKey(assignee: TaskDetailAssignee, index: number): string {
  if (assignee.id !== undefined && assignee.id !== "") {
    return `assignee-id-${String(assignee.id)}`;
  }
  if (assignee.extension_number) {
    return `assignee-ext-${assignee.extension_number}`;
  }
  return `assignee-fallback-${index}`;
}

export function offcanvasWatcherKey(watcher: TaskDetailWatcher, index: number): string {
  const ext = watcher.extension_number ?? "";
  if (ext) {
    return `watcher-${ext}`;
  }
  return `watcher-fallback-${index}`;
}
