import type { ActivityEntityType } from "./activityHistoryPageTypes";

/** Narrow an unknown activity `type` to the allowed entity-type literal union. */
export function getActivityEntityType(
  value: unknown,
): ActivityEntityType | undefined {
  if (typeof value !== "string") return undefined;
  const lower = value.toLowerCase();
  if (lower === "prospect") return "prospect";
  if (lower === "lead") return "lead";
  if (lower === "deal") return "deal";
  if (lower === "order") return "order";
  return undefined;
}

/** Build the details-page route for a given activity entity type, or null. */
export function buildActivityDetailsRoute(
  type: string,
  recordId: string | number,
): string | null {
  const entity = getActivityEntityType(type);
  if (!entity) return null;
  return `/crm/detailspage?type=${entity}&id=${recordId}&section=activities`;
}

/** Read an activity record's preferred numeric id (record_id, else id). */
export function getActivityRecordIdNumber(
  rec: { record_id?: unknown; id?: unknown } | null | undefined,
): number | undefined {
  if (!rec) return undefined;
  if (rec.record_id !== null && rec.record_id !== undefined) {
    return Number(rec.record_id);
  }
  if (rec.id !== null && rec.id !== undefined) return Number(rec.id);
  return undefined;
}
