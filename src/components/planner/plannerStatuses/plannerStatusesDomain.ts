/**
 * Work Planner global statuses — types, defaults, and pure helpers.
 */

export interface PlannerWorkPlannerStatusRow {
  id: number;
  name: string;
  color: string;
  order?: number;
  is_default?: boolean;
  is_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const PLANNER_STATUS_DEFAULT_COLOR = "#4680FF";

export const PLANNER_STATUS_PREDEFINED_COLORS: readonly string[] = [
  "#4680FF",
  "#2CA87F",
  "#FFB64D",
  "#DC2626",
  "#9E9E9E",
  "#667EEA",
  "#F56565",
  "#48BB78",
  "#ED8936",
  "#4FC3F7",
  "#A855F7",
  "#EC4899",
  "#14B8A6",
  "#F59E0B",
  "#EF4444",
];

export type PlannerStatusFormState = Readonly<{
  name: string;
  color: string;
  order: number;
  is_default: boolean;
  is_completed: boolean;
}>;

export function emptyPlannerStatusForm(): PlannerStatusFormState {
  return {
    name: "",
    color: PLANNER_STATUS_DEFAULT_COLOR,
    order: 0,
    is_default: false,
    is_completed: false,
  };
}

export function plannerStatusFormFromRow(row: PlannerWorkPlannerStatusRow): PlannerStatusFormState {
  return {
    name: row.name || "",
    color: row.color || PLANNER_STATUS_DEFAULT_COLOR,
    order: row.order ?? 0,
    is_default: row.is_default ?? false,
    is_completed: row.is_completed ?? false,
  };
}

export function normalizedStatusesFromListResponse(
  response: unknown,
): PlannerWorkPlannerStatusRow[] {
  if (response && Array.isArray(response)) {
    return response as PlannerWorkPlannerStatusRow[];
  }
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    Array.isArray((response as { data: unknown }).data)
  ) {
    return (response as { data: PlannerWorkPlannerStatusRow[] }).data;
  }
  return [];
}

export function buildPlannerStatusApiPayload(form: PlannerStatusFormState): {
  name: string;
  color: string;
  order: number;
  is_default: boolean;
  is_completed: boolean;
} {
  return {
    name: form.name.trim(),
    color: form.color,
    order: form.order,
    is_default: form.is_default,
    is_completed: form.is_completed,
  };
}
