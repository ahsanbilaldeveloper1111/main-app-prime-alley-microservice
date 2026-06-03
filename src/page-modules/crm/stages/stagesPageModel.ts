import type { StageData } from "@utils/crm";
import { resolveStageThemeColor } from "@utils/crmThemeColors";

export { resolveStageThemeColor as resolveStageDotColor };

export type StageType = "lead" | "deal" | "order" | "lost_reason";

/** Table row type for stages UI (aligned with API `StageData`). */
export type StageRow = StageData;

export interface StageFormState {
  name: string;
  sequence: number;
  is_won: boolean;
  fold: boolean;
  color: string;
  description: string;
  is_default: boolean;
  active: boolean;
  type: StageType;
  probability: number;
}

export interface StageFilterState {
  search: string;
  type: string;
}

export const TYPE_DISPLAY_NAMES: Record<StageType, string> = {
  lead: "Lead",
  deal: "Deal",
  order: "Order",
  lost_reason: "Lost Reason",
};

export const TYPE_BADGE_COLORS: Record<StageType, string> = {
  lead: "primary",
  deal: "warning",
  order: "success",
  lost_reason: "danger",
};

export function getTypeDisplayName(type: string): string {
  return TYPE_DISPLAY_NAMES[type as StageType] ?? type;
}

export function getTypeBadgeColor(type: string): string {
  return TYPE_BADGE_COLORS[type as StageType] ?? "secondary";
}

/** CSS modifier for stage name dot (same semantic mapping as `TYPE_BADGE_COLORS`). */
export function getStageTypeDotClassName(type: string): string {
  const key = type as StageType;
  if (key in TYPE_BADGE_COLORS) {
    return `stages-table-name-dot stages-table-name-dot--${key}`;
  }
  return "stages-table-name-dot stages-table-name-dot--neutral";
}

export const INITIAL_STAGE_FORM: StageFormState = {
  name: "",
  sequence: 1,
  is_won: false,
  fold: false,
  color: resolveStageThemeColor("lead"),
  description: "",
  is_default: false,
  active: true,
  type: "lead",
  probability: 50,
};

export const STAGES_TABLE_COLUMN_STORAGE_KEY = "stagesSelectedColumns";

export const STAGES_TABLE_SELECTABLE_KEYS = [
  "sequence",
  "name",
  "type",
  "description",
  "color",
  "actions",
] as const;

export const DEFAULT_STAGES_SELECTED_COLUMNS = [
  "sequence",
  "name",
  "type",
  "description",
  "color",
  "actions",
];

export function normalizeSelectedStageColumns(cols: string[]): string[] {
  const map: Record<string, string> = {
    order: "sequence",
    stageName: "name",
    category: "type",
    description: "description",
    color: "color",
    actions: "actions",
    sequence: "sequence",
    name: "name",
    type: "type",
  };

  const normalized = (cols ?? [])
    .map((c) => map[c])
    .filter((c): c is string => Boolean(c));
  return normalized.reduce<string[]>((acc, value) => {
    if (!acc.includes(value)) acc.push(value);
    return acc;
  }, []);
}

export function sortStagesData<T>(
  data: T[],
  sortBy: string,
  sortOrder: "asc" | "desc",
): T[] {
  if (!sortBy) return data;

  const cell = (row: T, key: string): unknown =>
    (row as Record<string, unknown>)[key];

  return [...data].sort((a, b) => {
    let aVal = cell(a, sortBy);
    let bVal = cell(b, sortBy);

    if (aVal === undefined) aVal = "";
    if (bVal === undefined) bVal = "";

    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();

    if (aStr < bStr) return sortOrder === "asc" ? -1 : 1;
    if (aStr > bStr) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });
}

export function paginateStagesData<T>(
  data: T[],
  currentPage: number,
  rowsPerPage: number,
): T[] {
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  return data.slice(startIndex, endIndex);
}
