import type { Task } from "./plannerTasksListingDomain";

export type PlannerAddToMyDayTarget = Readonly<{
  id: number;
  title?: string;
  rawData?: unknown;
}>;

function rawDataRecord(rawData: unknown): Record<string, unknown> | undefined {
  if (rawData == null || typeof rawData !== "object") return undefined;
  return rawData as Record<string, unknown>;
}

export function taskRowEstimateMinutes(row: PlannerAddToMyDayTarget): number {
  const raw = rawDataRecord(row.rawData);
  const est = Number(raw?.estimated_duration_minutes ?? raw?.estimated_minutes ?? 0);
  return Number.isFinite(est) && est > 0 ? est : 0;
}

export function taskRowAlreadyInMyDay(row: PlannerAddToMyDayTarget): boolean {
  const raw = rawDataRecord(row.rawData);
  if (raw?.already_in_my_day === true) return true;
  if (raw?.is_in_my_day === true) return true;
  if (raw?.in_my_day === true) return true;
  return false;
}

export function isPlannerTaskInMyDay(
  target: PlannerAddToMyDayTarget,
  myDayTaskIds: ReadonlySet<number>,
): boolean {
  return taskRowAlreadyInMyDay(target) || myDayTaskIds.has(target.id);
}

export function extractMyDayTaskIdsFromListPayload(payload: {
  active?: unknown[];
  completed?: unknown[];
}): Set<number> {
  const ids = new Set<number>();
  const rows = [...(payload.active ?? []), ...(payload.completed ?? [])];
  for (const row of rows) {
    if (row == null || typeof row !== "object") continue;
    const id = Number((row as { id?: unknown }).id);
    if (Number.isFinite(id) && id > 0) ids.add(id);
  }
  return ids;
}

export function toPlannerAddToMyDayTarget(
  id: number,
  title?: string | null,
  rawData?: unknown,
): PlannerAddToMyDayTarget {
  return {
    id,
    title: title?.trim() || undefined,
    rawData,
  };
}

export function listingTaskToAddToMyDayTarget(row: Task): PlannerAddToMyDayTarget {
  return { id: row.id, title: row.title, rawData: row.rawData };
}

export function plannerAddToMyDayDisabledTitle(
  canUseMyDay: boolean,
  alreadyInMyDay: boolean,
): string | undefined {
  if (!canUseMyDay) return "You are not authorized to use My Day";
  if (alreadyInMyDay) return "Task is already on My Day";
  return undefined;
}
