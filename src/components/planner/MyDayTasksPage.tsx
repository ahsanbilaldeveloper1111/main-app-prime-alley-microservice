import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import { useSession } from "next-auth/react";
import { Button, Form, Modal } from "react-bootstrap";
import { Circle, CircleCheckBig, History, Pencil, Plus, Search, X } from "lucide-react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import CreateTaskSidebar from "@components/CreatePlannerTaskSidebar";
import { MyDayTeamSection } from "@components/planner/my-day/MyDayTeamSection";
import { getSessionPhoneOrExtension } from "@planner/projectMemberRole";
import {
  ackMyDayRolloverPrompt,
  addTaskToMyDay,
  getMyDayCapacity,
  getMyDayPreferences,
  getMyDayRollover,
  getMyDaySuggestions,
  listMyDayTasks,
  overrideMyDayCapacity,
  patchMyDayPreferences,
  removeTaskFromMyDay,
  submitMyDayRolloverAction,
  toggleMyDayTaskComplete,
  type MyDaySuggestionCategory,
  type MyDaySuggestionsPayload,
  type MyDayCapacityPayload,
  type MyDayRolloverPayload,
  type MyDayTasksMeta,
  type MyDayTasksPayload,
} from "@utils/tasks";
import { MyDayHistoryModal } from "@components/planner/MyDayHistoryModal";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { formatDateGlobal, ModuleSlug } from "@utils/Helper";
import {
  formatCapacityOverageMessageFromStats,
  formatMyDayHeaderMetaLine,
  resolveCapacityStatsFromPayload,
  formatRolloverPromptCopy,
  formatSuggestionDueDate,
  getCapacityFillTone,
  isFlexibleTaskRow,
  MY_DAY_CATEGORY_LABELS,
  MY_DAY_SUGGESTION_CATEGORY_ORDER,
  readRolloverIgnoreCount,
  readTaskPriorityLabel,
  readHasEstimateFromRow,
  resolveEstimateMinutesFromRow,
  normalizeMyDaySuggestionsPayload,
  resolveMyDayReporteeExtensions,
  resolveMyDayTaskCount,
  shouldShowMyDayTeamSection,
  resolveMyDayUnestimatedCount,
  resolveProjectFromRow,
  resolveShowRolloverPrompt,
  shouldShowIgnoredFlag,
  toMinutesDisplay,
} from "@page-modules/planner/my-day/myDayDomain";
import "@assets/scss/my-day-tasks.scss";
import { toast } from "react-toastify";

type MyDayTask = {
  id: number;
  title: string;
  dueDate: string | null;
  priority: string;
  isCompleted: boolean;
  estimateMinutes: number;
  hasEstimate: boolean;
  projectName: string;
  isPersonalTask: boolean;
  isOrganizationalTask: boolean;
  isFlexibleTask: boolean;
  isCarryOver: boolean;
  rolloverIgnoreCount: number;
  showIgnoredFlag: boolean;
  alreadyInMyDay?: boolean;
  raw: Record<string, unknown>;
};

type SuggestedTask = MyDayTask & {
  category: MyDaySuggestionCategory;
  categoryLabel: string;
};

type MyDayCarryOverMode = "pending" | "added" | "skipped";

type MyDaySuggestionGroup = Readonly<{
  category: MyDaySuggestionCategory;
  label: string;
  items: SuggestedTask[];
}>;

/** Spec §3.6: lead with 30m / 1h / 2h chips; extra presets for custom flows. */
const ESTIMATE_PRESETS = [30, 60, 120, 15, 90, 180] as const;

function swallowAsyncError(promise: Promise<unknown>): void {
  promise.catch(() => undefined);
}

function resolveMyDayCapacityUsedMinutes(tasks: MyDayTask[], plannedMinutes: number): number {
  const fromEstimates = tasks.reduce(
    (sum, task) => sum + Math.max(0, task.estimateMinutes),
    0,
  );
  if (fromEstimates > 0) return fromEstimates;
  return Math.max(0, plannedMinutes);
}

function isSuggestionInMyDay(task: SuggestedTask, myDayTaskIds: ReadonlySet<number>): boolean {
  return myDayTaskIds.has(task.id) || task.alreadyInMyDay === true;
}

const MAX_CAPACITY_DURATION_INPUT_LENGTH = 40;

function tokenizeCapacityDurationInput(value: string): string[] {
  return value
    .replace(/([hm])/g, " $1 ")
    .trim()
    .split(" ")
    .filter((part) => part.length > 0);
}

function parseCapacityDurationTokenPair(
  tokens: string[],
  index: number,
): { consumed: number; minutes: number } | null {
  const numToken = tokens[index];
  const unitToken = tokens[index + 1];
  if (numToken === undefined || unitToken === undefined) return null;
  if (!/^\d{1,5}(?:\.\d{1,2})?$/.test(numToken)) return null;
  const num = Number(numToken);
  if (!Number.isFinite(num) || num <= 0) return null;
  if (unitToken === "h") return { consumed: 2, minutes: Math.round(num * 60) };
  if (unitToken === "m") return { consumed: 2, minutes: Math.round(num) };
  return null;
}

/** Parses capacity strings like `480`, `2h`, `30m`, or `2h 30m` without slow regex backtracking. */
function parseCapacityDurationInput(value: string): number | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed.length > MAX_CAPACITY_DURATION_INPUT_LENGTH) return null;

  if (/^\d{1,7}$/.test(trimmed)) {
    const minutes = Number.parseInt(trimmed, 10);
    return minutes > 0 ? minutes : null;
  }

  const tokens = tokenizeCapacityDurationInput(trimmed);
  if (tokens.length === 0 || tokens.length % 2 !== 0) return null;

  let total = 0;
  for (let i = 0; i < tokens.length; i += 2) {
    const pair = parseCapacityDurationTokenPair(tokens, i);
    if (!pair) return null;
    total += pair.minutes;
  }

  return total > 0 ? total : null;
}

function formatCapacityDurationInput(totalMinutes: number): string {
  return toMinutesDisplay(totalMinutes);
}

type MyDayTaskListsSnapshot = Readonly<{
  tasks: MyDayTask[];
  planDate: string;
  meta: MyDayTasksMeta;
  isEmptyByDesign: boolean;
  hasIncompleteToday: boolean;
  todayTaskCount: number;
}>;

function isDeletedRolloverRow(row: unknown): boolean {
  if (row == null || typeof row !== "object") return false;
  const record = row as Record<string, unknown>;
  return (
    record.is_deleted === true ||
    record.deleted === true ||
    (typeof record.deleted_at === "string" && record.deleted_at.length > 0)
  );
}

function syncRolloverFromPayload(
  rolloverPayload: MyDayRolloverPayload,
  todayStart: moment.Moment,
  lists: MyDayTaskListsSnapshot,
): Readonly<{
  rolloverTasks: MyDayTask[];
  previousDate: string | null;
  showPrompt: boolean;
}> {
  const rolloverRows = (rolloverPayload.tasks ?? []).filter((row) => !isDeletedRolloverRow(row));
  return {
    rolloverTasks: rolloverRows.map((row) => mapMyDayTaskRow(row, todayStart)),
    previousDate: rolloverPayload.previous_date ?? null,
    showPrompt: resolveShowRolloverPrompt(rolloverPayload, {
      hasIncompleteTodayTasks: lists.hasIncompleteToday,
      todayTaskCount: lists.todayTaskCount,
    }),
  };
}

function groupSuggestionsByCategory(suggestedTasks: SuggestedTask[]): MyDaySuggestionGroup[] {
  const byCategory = new Map<MyDaySuggestionCategory, SuggestedTask[]>();
  for (const task of suggestedTasks) {
    const bucket = byCategory.get(task.category) ?? [];
    bucket.push(task);
    byCategory.set(task.category, bucket);
  }
  const groups: MyDaySuggestionGroup[] = [];
  for (const category of MY_DAY_SUGGESTION_CATEGORY_ORDER) {
    const items = byCategory.get(category);
    if (!items?.length) continue;
    groups.push({
      category,
      label: MY_DAY_CATEGORY_LABELS[category] ?? category.replaceAll("_", " "),
      items,
    });
    byCategory.delete(category);
  }
  for (const [category, items] of byCategory.entries()) {
    if (!items.length) continue;
    groups.push({
      category,
      label: MY_DAY_CATEGORY_LABELS[category] ?? category.replaceAll("_", " "),
      items,
    });
  }
  return groups;
}

function resolveCompletedTasksCount(
  completedTasks: MyDayTask[],
  tasksMeta: MyDayTasksMeta,
): number {
  if (tasksMeta.tasks_completed != null) {
    return Math.max(0, Math.floor(tasksMeta.tasks_completed));
  }
  if (tasksMeta.completed_count != null) {
    return Math.max(0, Math.floor(tasksMeta.completed_count));
  }
  return completedTasks.length;
}

function buildMyDayTaskListsSnapshot(
  taskPayload: MyDayTasksPayload,
  todayStart: moment.Moment,
  today: string,
): MyDayTaskListsSnapshot {
  const active = (taskPayload.active ?? []).map((row) => mapMyDayTaskRow(row, todayStart));
  const completed = (taskPayload.completed ?? []).map((row) => mapMyDayTaskRow(row, todayStart));
  const tasks = [...active, ...completed];
  return {
    tasks,
    planDate: taskPayload.plan_date ?? today,
    meta: taskPayload.meta ?? {},
    isEmptyByDesign: taskPayload.is_empty_by_design === true,
    hasIncompleteToday: tasks.some((task) => !task.isCompleted),
    todayTaskCount: tasks.length,
  };
}

function mapMyDayTaskRow(
  input: unknown,
  todayStart: moment.Moment,
  category?: MyDaySuggestionCategory,
): MyDayTask {
  const row =
    input != null && typeof input === "object"
      ? (input as Record<string, unknown>)
      : ({} as Record<string, unknown>);
  const id = Math.floor(Number(row.id ?? row.task_id ?? 0));
  let dueRaw: string | null = null;
  if (typeof row.due_date === "string") {
    dueRaw = row.due_date;
  } else if (typeof row.end_date === "string") {
    dueRaw = row.end_date;
  }
  const dueMoment = dueRaw ? moment(dueRaw) : null;
  const isCarryOver = dueMoment?.isValid() === true && dueMoment.isBefore(todayStart, "day");
  const estimate = resolveEstimateMinutesFromRow(row);
  const hasEstimate = readHasEstimateFromRow(row);
  const project = resolveProjectFromRow(row);
  const ignoreCount = readRolloverIgnoreCount(row);
  const isOrgTask = row.is_org_task === true || project.isOrganizational;
  const title =
    typeof row.title === "string" && row.title.trim() ? row.title.trim() : `Task #${id}`;
  return {
    id,
    title,
    dueDate: dueRaw,
    priority: readTaskPriorityLabel(row.priority),
    isCompleted: row.is_completed === true || row.completed === true,
    estimateMinutes: estimate,
    hasEstimate,
    projectName: project.label,
    isPersonalTask: project.isPersonal,
    isOrganizationalTask: isOrgTask,
    isFlexibleTask: isFlexibleTaskRow(row, category),
    isCarryOver,
    rolloverIgnoreCount: ignoreCount,
    showIgnoredFlag: shouldShowIgnoredFlag(row),
    alreadyInMyDay: row.already_in_my_day === true,
    raw: row,
  };
}

function resolveMinutesFromAddTaskResponse(
  result: { task?: unknown },
  fallback: number,
): number {
  if (result.task == null || typeof result.task !== "object") return fallback;
  const fromApi = resolveEstimateMinutesFromRow(result.task as Record<string, unknown>);
  return fromApi > 0 ? fromApi : fallback;
}

function collectSuggestionCategories(payload: MyDaySuggestionsPayload): MyDaySuggestionCategory[] {
  const seen = new Set<string>();
  const ordered: MyDaySuggestionCategory[] = [];
  for (const category of MY_DAY_SUGGESTION_CATEGORY_ORDER) {
    const rows = payload[category];
    if (!Array.isArray(rows) || rows.length === 0) continue;
    ordered.push(category);
    seen.add(category);
  }
  for (const key of Object.keys(payload)) {
    if (seen.has(key) || key === "flexible_tasks") continue;
    const rows = payload[key as MyDaySuggestionCategory];
    if (!Array.isArray(rows) || rows.length === 0) continue;
    ordered.push(key as MyDaySuggestionCategory);
  }
  return ordered;
}

type MyDaySuggestedItemButtonProps = Readonly<{
  task: SuggestedTask;
  groupCategory: MyDaySuggestionCategory;
  inMyDay: boolean;
  onAdd: (task: SuggestedTask) => void;
  className?: string;
}>;

function resolveSuggestedItemBorder(hovered: boolean, inMyDay: boolean): string {
  if (hovered && !inMyDay) return "1px solid #0066CC";
  if (inMyDay) return "1px solid #bbf7d0";
  return "1px solid #e2e8f0";
}

function resolveSuggestedItemBorderLeft(hovered: boolean, inMyDay: boolean): string {
  if (inMyDay) return "3px solid #22c55e";
  if (hovered && !inMyDay) return "3px solid #0066CC";
  return "1px solid #e2e8f0";
}

function resolveSuggestedItemBackground(hovered: boolean, inMyDay: boolean): string {
  if (hovered && !inMyDay) return "#f0f7ff";
  if (inMyDay) return "#f9fafb";
  return "#fff";
}

function resolvePriorityDotBackground(priorityKey: string): string {
  if (priorityKey === "urgent" || priorityKey === "critical") return "#ef4444";
  if (priorityKey === "high") return "#f97316";
  if (priorityKey === "medium" || priorityKey === "normal") return "#eab308";
  return "#22c55e";
}

function resolveSuggestedAddButtonBorder(inMyDay: boolean, hovered: boolean): string {
  if (inMyDay) return "1px solid #22c55e";
  if (hovered) return "1px solid #0066CC";
  return "1px solid #e2e8f0";
}

function resolveSuggestedAddButtonBackground(inMyDay: boolean, hovered: boolean): string {
  if (inMyDay) return "#f0fdf4";
  if (hovered) return "#0066CC";
  return "#fff";
}

function resolveSuggestedAddButtonColor(inMyDay: boolean, hovered: boolean): string {
  if (inMyDay) return "#22c55e";
  if (hovered) return "#fff";
  return "#718096";
}

function MyDaySuggestedItemButton({
  task,
  inMyDay,
  onAdd,
  className = "",
}: MyDaySuggestedItemButtonProps) {
  const priorityKey = task.priority.toLowerCase().replace(/\s+/g, "-");
  const dueLabel = formatSuggestionDueDate(task.dueDate);
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      type="button"
      className={`myday-suggested-item ${inMyDay ? "is-added" : ""}`}
      disabled={inMyDay}
      onClick={() => onAdd(task)}
      onMouseEnter={() => !inMyDay && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        textAlign: "left",
        padding: "clamp(9px, 1.2vw, 13px) clamp(10px, 1.5vw, 14px)",
        border: resolveSuggestedItemBorder(hovered, inMyDay),
        borderLeft: resolveSuggestedItemBorderLeft(hovered, inMyDay),
        borderRadius: 8,
        background: resolveSuggestedItemBackground(hovered, inMyDay),
        cursor: inMyDay ? "not-allowed" : "pointer",
        opacity: inMyDay ? 0.65 : 1,
        fontFamily: "inherit",
        transition: "all 0.15s ease",
      }}
    >
      <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
        <div className="title" style={{
          fontSize: "clamp(12px, 1.2vw, 14px)",
          fontWeight: 500,
          color: "#141414",
          marginBottom: "clamp(4px, 0.6vw, 6px)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          textAlign: "left",
        }}>{task.title}</div>
        <div className="meta" style={{ display: "flex", flexWrap: "wrap", gap: "clamp(4px, 0.6vw, 6px)", alignItems: "center", justifyContent: "flex-start" }}>
          {dueLabel ? (
            <span style={{ fontSize: "clamp(10px, 0.9vw, 12px)", color: "#718096" }}>{dueLabel}</span>
          ) : null}
          <span className={`myday-tag myday-tag--priority priority-${priorityKey}`} style={{ fontSize: "clamp(10px, 0.9vw, 11px)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", display: "inline-block", flexShrink: 0, marginRight: 3,
              background: resolvePriorityDotBackground(priorityKey),
            }} />
            {task.priority}
          </span>
          {task.estimateMinutes > 0 ? (
            <span style={{ fontSize: "clamp(10px, 0.9vw, 12px)", color: "#718096" }}>{toMinutesDisplay(task.estimateMinutes)}</span>
          ) : (
            <span style={{ fontSize: "clamp(10px, 0.9vw, 11px)", color: "#f97316", fontWeight: 500 }}>No est.</span>
          )}
        </div>
      </div>
      <div style={{
        width: "clamp(22px, 2vw, 28px)",
        height: "clamp(22px, 2vw, 28px)",
        borderRadius: "50%",
        border: resolveSuggestedAddButtonBorder(inMyDay, hovered),
        background: resolveSuggestedAddButtonBackground(inMyDay, hovered),
        color: resolveSuggestedAddButtonColor(inMyDay, hovered),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: "clamp(14px, 1.4vw, 18px)",
        transition: "all 0.15s ease",
        marginLeft: "auto",
      }}>
        {inMyDay ? "✓" : "+"}
      </div>
    </button>
  );
}

function MyDayTaskEstimateSlot({
  task,
  onEditEstimate,
}: Readonly<{
  task: MyDayTask;
  onEditEstimate?: (task: MyDayTask) => void;
}>) {
  if (task.hasEstimate || task.estimateMinutes > 0) {
    const label =
      task.estimateMinutes > 0 ? toMinutesDisplay(task.estimateMinutes) : "Estimated";
    return (
      <span className="myday-tag myday-tag--estimate myday-tag--estimate-has-value">
        <span>{label}</span>
        {onEditEstimate && !task.isCompleted ? (
          <button
            type="button"
            className="myday-edit-estimate-btn myday-edit-estimate-btn--inline"
            onClick={() => onEditEstimate(task)}
          >
            Edit
          </button>
        ) : null}
      </span>
    );
  }
  const noEstimate = (
    <span className="myday-tag myday-tag--estimate myday-tag--no-estimate">
      <span className="myday-unestimated-dot" title="No estimate" aria-label="No estimate" />
      <span>No estimate</span>
    </span>
  );
  if (task.isCompleted) {
    return noEstimate;
  }
  if (onEditEstimate) {
    return (
      <button
        type="button"
        className="myday-edit-estimate-btn"
        onClick={() => onEditEstimate(task)}
      >
        Edit Estimate
      </button>
    );
  }
  return noEstimate;
}

type MyDayTaskCardProps = Readonly<{
  task: MyDayTask;
  onToggleComplete: (task: MyDayTask) => void;
  onRemove: (taskId: number) => void;
  onEditEstimate?: (task: MyDayTask) => void;
}>;

function MyDayTaskCard({ task, onToggleComplete, onRemove, onEditEstimate }: MyDayTaskCardProps) {
  const priorityKey = task.priority.toLowerCase().replace(/\s+/g, "-");
  const priorityBorderColor: Record<string, string> = {
    urgent: "#ef4444",
    critical: "#ef4444",
    high: "#f97316",
    medium: "#eab308",
    normal: "#eab308",
    low: "#22c55e",
  };
  const borderColor = task.isCompleted ? "#e2e8f0" : (priorityBorderColor[priorityKey] ?? "#eaf0f6");

  return (
    <div
      className={`myday-task-card ${task.isCompleted ? "is-completed" : ""}`}
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      <div className="myday-task-card__main">
        <button
          type="button"
          className="myday-toggle-btn myday-task-card__complete"
          aria-label={task.isCompleted ? "Mark incomplete" : "Mark complete"}
          onClick={() => onToggleComplete(task)}
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            border: task.isCompleted ? "2px solid #22c55e" : "2px solid #cbd5e0",
            background: task.isCompleted ? "#22c55e" : "transparent",
            color: task.isCompleted ? "#fff" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 2,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {task.isCompleted ? <CircleCheckBig size={12} /> : null}
        </button>
        <div className="myday-task-card__body">
          <div className="myday-task-card__title">{task.title}</div>
          <div className="myday-task-card__tags">
            <span
              className={`myday-tag myday-tag--project ${
                task.isPersonalTask ? "myday-tag--personal" : ""
              } ${task.isOrganizationalTask ? "myday-tag--organizational" : ""}`}
            >
              {task.projectName}
            </span>
            <span className={`myday-tag myday-tag--priority priority-${priorityKey}`}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: priorityBorderColor[priorityKey] ?? "#94a3b8",
                display: "inline-block",
                flexShrink: 0,
              }} />
              {task.priority}
            </span>
            {task.isFlexibleTask ? (
              <span className="myday-tag myday-tag--flexible">Flexible</span>
            ) : null}
            {task.showIgnoredFlag ? (
              <span className="myday-tag myday-tag--ignored">3x Ignored</span>
            ) : null}
            <MyDayTaskEstimateSlot task={task} onEditEstimate={onEditEstimate} />
          </div>
        </div>
      </div>
      <button
        type="button"
        className="myday-task-card__remove"
        aria-label="Remove from My Day"
        onClick={() => onRemove(task.id)}
      >
        <X size={14} />
      </button>
    </div>
  );
}

function useMyDayCarryOverSelection(
  carryOverTasks: MyDayTask[],
  setCarryOverMode: React.Dispatch<React.SetStateAction<MyDayCarryOverMode>>,
  setSelectedCarryOverIds: React.Dispatch<React.SetStateAction<number[]>>,
): void {
  useEffect(() => {
    if (carryOverTasks.length === 0) {
      setCarryOverMode("added");
      setSelectedCarryOverIds([]);
      return;
    }
    setSelectedCarryOverIds((prev) => {
      const keep = carryOverTasks.map((t) => t.id).filter((id) => prev.includes(id));
      return keep.length > 0 ? keep : carryOverTasks.map((t) => t.id);
    });
  }, [carryOverTasks, setCarryOverMode, setSelectedCarryOverIds]);
}

function useMyDayTasksPageController() {
  const { data: session } = useSession();
  const managerExtension = useMemo(() => getSessionPhoneOrExtension(session), [session]);
  const { hierarchyDataExtensions } = useHierarchyData(ModuleSlug.WORK_PLANNER);
  const reporteeExtensions = useMemo(
    () => resolveMyDayReporteeExtensions(hierarchyDataExtensions, managerExtension),
    [hierarchyDataExtensions, managerExtension],
  );
  const showMyTeamSection = useMemo(
    () => shouldShowMyDayTeamSection(hierarchyDataExtensions, managerExtension),
    [hierarchyDataExtensions, managerExtension],
  );
  const [tasks, setTasks] = useState<MyDayTask[]>([]);
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);
  const [rolloverTasks, setRolloverTasks] = useState<MyDayTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [capacityMinutes, setCapacityMinutes] = useState(8 * 60);
  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [carryOverMode, setCarryOverMode] = useState<MyDayCarryOverMode>("pending");
  const [selectedCarryOverIds, setSelectedCarryOverIds] = useState<number[]>([]);
  const [suggestedSearch, setSuggestedSearch] = useState("");
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [estimateInput, setEstimateInput] = useState("");
  const [pendingEstimateTask, setPendingEstimateTask] = useState<MyDayTask | null>(null);
  const [plannedMinutes, setPlannedMinutes] = useState(0);
  const [capacityStats, setCapacityStats] = useState(() =>
    resolveCapacityStatsFromPayload({}, 0, 8 * 60),
  );
  const [rolloverShowPrompt, setRolloverShowPrompt] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [planDate, setPlanDate] = useState("");
  const [tasksMeta, setTasksMeta] = useState<MyDayTasksMeta>({});
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);
  const [capacityDraft, setCapacityDraft] = useState("");
  const [debouncedSuggestedSearch, setDebouncedSuggestedSearch] = useState("");
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [defaultCapacityMinutes, setDefaultCapacityMinutes] = useState(8 * 60);
  const [showDefaultCapacityModal, setShowDefaultCapacityModal] = useState(false);
  const [defaultCapacityDraft, setDefaultCapacityDraft] = useState("");
  const [showScheduleLaterModal, setShowScheduleLaterModal] = useState(false);
  const [scheduleLaterDate, setScheduleLaterDate] = useState("");
  const [isEmptyByDesign, setIsEmptyByDesign] = useState(false);
  const [rolloverPreviousDate, setRolloverPreviousDate] = useState<string | null>(null);
  const suggestionsRequestRef = useRef(0);
  const tasksRef = useRef<MyDayTask[]>([]);
  const suggestionsPanelRef = useRef<HTMLElement>(null);

  const today = useMemo(() => moment().format("YYYY-MM-DD"), []);
  const todayStart = useMemo(() => moment().startOf("day"), []);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      setDebouncedSuggestedSearch(suggestedSearch.trim());
    }, 400);
    return () => globalThis.clearTimeout(timer);
  }, [suggestedSearch]);

  const myDayTaskIds = useMemo(() => new Set(tasks.map((task) => task.id)), [tasks]);
  tasksRef.current = tasks;

  const buildSuggestionsFromPayload = useCallback(
    (suggestionsPayload: MyDaySuggestionsPayload): SuggestedTask[] => {
      const myDayIds = new Set(tasksRef.current.map((task) => task.id));
      const flattened: SuggestedTask[] = [];
      collectSuggestionCategories(suggestionsPayload).forEach((category) => {
        const rows = suggestionsPayload[category];
        if (!Array.isArray(rows)) return;
        const categoryLabel = MY_DAY_CATEGORY_LABELS[category] ?? category.replaceAll("_", " ");
        rows.forEach((row) => {
          const mapped = mapMyDayTaskRow(row, todayStart, category);
          flattened.push({
            ...mapped,
            category,
            categoryLabel,
            alreadyInMyDay: mapped.alreadyInMyDay === true || myDayIds.has(mapped.id),
          });
        });
      });
      return flattened;
    },
    [todayStart],
  );

  const fetchSuggestions = useCallback(
    async (search: string) => {
      const requestId = suggestionsRequestRef.current + 1;
      suggestionsRequestRef.current = requestId;
      setSuggestionsLoading(true);
      try {
        const searchTerm = search.trim();
        const suggestionsPayload = await getMyDaySuggestions(
          searchTerm ? { search: searchTerm } : {},
        );
        if (requestId !== suggestionsRequestRef.current) return;
        const normalized = normalizeMyDaySuggestionsPayload(suggestionsPayload, {
          todayStart,
          hasSearch: searchTerm.length > 0,
        });
        setSuggestedTasks(buildSuggestionsFromPayload(normalized));
      } catch {
        if (requestId !== suggestionsRequestRef.current) return;
        setSuggestedTasks([]);
      } finally {
        if (requestId === suggestionsRequestRef.current) {
          setSuggestionsLoading(false);
        }
      }
    },
    [buildSuggestionsFromPayload],
  );

  const applyCapacityFromApi = useCallback(
    (capacityPayload: MyDayCapacityPayload, fallbackCapacityMinutes?: number) => {
      const effectiveRaw = Number(capacityPayload.effective_capacity_minutes ?? 0);
      const fallback = fallbackCapacityMinutes ?? 8 * 60;
      const resolvedEffective = effectiveRaw > 0 ? effectiveRaw : fallback;
      const planned = Number(capacityPayload.planned_minutes);
      const resolvedPlanned = Number.isFinite(planned) ? Math.max(0, planned) : 0;

      setCapacityMinutes(resolvedEffective);
      if (Number.isFinite(planned)) {
        setPlannedMinutes(resolvedPlanned);
      }
      setCapacityStats(
        resolveCapacityStatsFromPayload(
          capacityPayload,
          resolvedPlanned,
          resolvedEffective,
        ),
      );
    },
    [],
  );

  const fetchCoreMyDayData = useCallback(async () => {
    try {
      setLoading(true);
      const [preferences, taskPayload, capacityPayload, rolloverPayload] = await Promise.all([
        getMyDayPreferences(),
        listMyDayTasks(),
        getMyDayCapacity({ date: today }),
        getMyDayRollover(),
      ]);

      const lists = buildMyDayTaskListsSnapshot(taskPayload, todayStart, today);
      setTasks(lists.tasks);
      setPlanDate(lists.planDate);
      setTasksMeta(lists.meta);
      setIsEmptyByDesign(lists.isEmptyByDesign);

      const defaultCapacity = Number(preferences.daily_capacity_minutes ?? 0);
      const resolvedDefault = defaultCapacity > 0 ? defaultCapacity : 8 * 60;
      setDefaultCapacityMinutes(resolvedDefault);
      applyCapacityFromApi(
        {
          ...capacityPayload,
          effective_capacity_minutes:
            Number(capacityPayload.effective_capacity_minutes ?? 0) || resolvedDefault,
        },
        resolvedDefault,
      );

      const rollover = syncRolloverFromPayload(rolloverPayload, todayStart, lists);
      setRolloverTasks(rollover.rolloverTasks);
      setRolloverPreviousDate(rollover.previousDate);
      setRolloverShowPrompt(rollover.showPrompt);
    } catch {
      toast.error("Failed to load My Day tasks");
      setTasks([]);
      setRolloverTasks([]);
      setRolloverShowPrompt(false);
    } finally {
      setLoading(false);
    }
  }, [applyCapacityFromApi, today, todayStart]);

  const refreshTasksAndRollover = useCallback(async () => {
    try {
      const [taskPayload, rolloverPayload] = await Promise.all([
        listMyDayTasks(),
        getMyDayRollover(),
      ]);
      const lists = buildMyDayTaskListsSnapshot(taskPayload, todayStart, today);
      setTasks(lists.tasks);
      setPlanDate(lists.planDate);
      setTasksMeta(lists.meta);
      setIsEmptyByDesign(lists.isEmptyByDesign);

      const rollover = syncRolloverFromPayload(rolloverPayload, todayStart, lists);
      setRolloverTasks(rollover.rolloverTasks);
      setRolloverPreviousDate(rollover.previousDate);
      setRolloverShowPrompt(rollover.showPrompt);
    } catch {
      toast.error("Failed to refresh My Day tasks");
    }
  }, [today, todayStart]);

  const refreshMyDayPage = useCallback(async () => {
    await fetchCoreMyDayData();
    await fetchSuggestions(debouncedSuggestedSearch);
  }, [debouncedSuggestedSearch, fetchCoreMyDayData, fetchSuggestions]);

  useEffect(() => {
    fetchCoreMyDayData().catch(() => undefined);
  }, [fetchCoreMyDayData]);

  useEffect(() => {
    fetchSuggestions(debouncedSuggestedSearch).catch(() => undefined);
  }, [debouncedSuggestedSearch, fetchSuggestions]);

  const carryOverTasks = useMemo(
    () => rolloverTasks.filter((t) => !t.isCompleted),
    [rolloverTasks],
  );

  useMyDayCarryOverSelection(carryOverTasks, setCarryOverMode, setSelectedCarryOverIds);

  const persistRolloverAck = useCallback(async () => {
    try {
      await ackMyDayRolloverPrompt();
    } catch {
      /* prompt may still show on next load if ack fails */
    }
  }, []);

  const visibleTasks = useMemo(() => {
    if (carryOverMode === "added") return tasks;
    if (carryOverMode === "skipped") return tasks.filter((t) => !t.isCarryOver);
    const allowed = new Set(selectedCarryOverIds);
    return tasks.filter((t) => !t.isCarryOver || allowed.has(t.id));
  }, [carryOverMode, selectedCarryOverIds, tasks]);

  const activeTasks = useMemo(
    () => visibleTasks.filter((task) => !task.isCompleted),
    [visibleTasks],
  );

  const unestimatedActiveCount = useMemo(
    () => resolveMyDayUnestimatedCount(activeTasks, tasksMeta),
    [activeTasks, tasksMeta],
  );

  const completedTasks = useMemo(
    () => visibleTasks.filter((task) => task.isCompleted),
    [visibleTasks],
  );

  const completedTasksCount = useMemo(
    () => resolveCompletedTasksCount(completedTasks, tasksMeta),
    [completedTasks, tasksMeta],
  );

  const summary = useMemo(() => {
    const planned = resolveMyDayCapacityUsedMinutes(tasks, plannedMinutes);
    const plannedPct =
      capacityStats.capacityUsedPercent == null
        ? Math.round((planned / Math.max(1, capacityMinutes)) * 100)
        : Math.round(capacityStats.capacityUsedPercent);
    const capacityTone = getCapacityFillTone(Math.min(100, plannedPct));
    return { planned, plannedPct, capacityTone, displayPct: plannedPct };
  }, [capacityMinutes, capacityStats.capacityUsedPercent, plannedMinutes, tasks]);

  const capacityOverageMessage = useMemo(
    () =>
      formatCapacityOverageMessageFromStats(capacityStats, summary.planned, capacityMinutes),
    [capacityMinutes, capacityStats, summary.planned],
  );

  const groupedSuggestions = useMemo(
    () => groupSuggestionsByCategory(suggestedTasks),
    [suggestedTasks],
  );

  const headerDateLabel = useMemo(() => {
    const iso = planDate || today;
    return formatDateGlobal(iso) || moment(iso).format("D MMMM, YYYY");
  }, [planDate, today]);

  const headerMetaLine = useMemo(() => {
    const taskCount = resolveMyDayTaskCount(tasks.length, tasksMeta);
    const usedMinutes = resolveMyDayCapacityUsedMinutes(tasks, plannedMinutes);
    return formatMyDayHeaderMetaLine(taskCount, usedMinutes);
  }, [plannedMinutes, tasks, tasksMeta]);

  const rolloverPromptCopy = useMemo(
    () => formatRolloverPromptCopy(rolloverPreviousDate),
    [rolloverPreviousDate],
  );

  const applyOptimisticMyDayAdd = useCallback((task: MyDayTask, estimatedMinutes?: number) => {
    const minutes = Math.max(0, estimatedMinutes ?? task.estimateMinutes ?? 0);
    const isNew = !tasksRef.current.some((row) => row.id === task.id);
    setTasks((prev) => {
      if (prev.some((row) => row.id === task.id)) {
        return prev.map((row) =>
          row.id === task.id
            ? { ...row, estimateMinutes: minutes > 0 ? minutes : row.estimateMinutes, alreadyInMyDay: true }
            : row,
        );
      }
      return [
        ...prev,
        {
          ...task,
          estimateMinutes: minutes,
          isCompleted: false,
          alreadyInMyDay: true,
        },
      ];
    });
    if (minutes > 0) {
      setPlannedMinutes((prev) => prev + minutes);
      setTasksMeta((prev) => ({
        ...prev,
        planned_minutes: (prev.planned_minutes ?? 0) + minutes,
      }));
    }
    if (isNew) {
      setTasksMeta((prev) => ({
        ...prev,
        active_count:
          prev.active_count == null ? prev.active_count : prev.active_count + 1,
      }));
    }
    setSuggestedTasks((prev) =>
      prev.map((row) => (row.id === task.id ? { ...row, alreadyInMyDay: true } : row)),
    );
  }, []);

  const applyOptimisticMyDayRemove = useCallback((taskId: number) => {
    setTasks((prev) => {
      const removed = prev.find((row) => row.id === taskId);
      if (removed === undefined) return prev;

      const minutes = Math.max(0, removed.estimateMinutes);
      if (minutes > 0) {
        setPlannedMinutes((planned) => Math.max(0, planned - minutes));
        setTasksMeta((meta) => ({
          ...meta,
          planned_minutes:
            meta.planned_minutes == null
              ? meta.planned_minutes
              : Math.max(0, meta.planned_minutes - minutes),
        }));
      }
      setTasksMeta((meta) => ({
        ...meta,
        active_count:
          removed.isCompleted || meta.active_count == null
            ? meta.active_count
            : Math.max(0, meta.active_count - 1),
        completed_count:
          removed.isCompleted === false || meta.completed_count == null
            ? meta.completed_count
            : Math.max(0, meta.completed_count - 1),
      }));
      return prev.filter((row) => row.id !== taskId);
    });
  }, []);

  const toggleCarryOverSelection = useCallback((taskId: number) => {
    setSelectedCarryOverIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  }, []);

  const handleToggleComplete = useCallback(
    async (task: MyDayTask) => {
      await toggleMyDayTaskComplete(task.id);
      refreshMyDayPage().catch(() => undefined);
    },
    [refreshMyDayPage],
  );

  const handleOpenEstimateModal = useCallback((task: MyDayTask) => {
    setPendingEstimateTask(task);
    setEstimateInput(task.estimateMinutes > 0 ? String(task.estimateMinutes) : "");
    setShowEstimateModal(true);
  }, []);

  const scrollToSuggestions = useCallback(() => {
    suggestionsPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const confirmEstimateAndAdd = useCallback(async () => {
    if (pendingEstimateTask == null) return;
    const parsed = Number.parseInt(estimateInput.trim(), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Please add valid estimate minutes");
      return;
    }
    const alreadyOnMyDay = myDayTaskIds.has(pendingEstimateTask.id);
    if (alreadyOnMyDay && pendingEstimateTask.estimateMinutes === parsed) {
      setShowEstimateModal(false);
      setPendingEstimateTask(null);
      setEstimateInput("");
      return;
    }
    try {
      const result = await addTaskToMyDay({
        task_id: pendingEstimateTask.id,
        plan_date: today,
        estimated_minutes: parsed,
      });
      if (!alreadyOnMyDay && result.already_in_my_day) return;

      const resolvedMinutes = resolveMinutesFromAddTaskResponse(result, parsed);

      if (alreadyOnMyDay) {
        const previousMinutes = pendingEstimateTask.estimateMinutes;
        const delta = resolvedMinutes - previousMinutes;
        setTasks((prev) =>
          prev.map((row) =>
            row.id === pendingEstimateTask.id
              ? { ...row, estimateMinutes: resolvedMinutes }
              : row,
          ),
        );
        if (delta > 0) {
          setPlannedMinutes((prev) => prev + delta);
          setTasksMeta((prev) => ({
            ...prev,
            planned_minutes: (prev.planned_minutes ?? 0) + delta,
          }));
        }
      } else {
        applyOptimisticMyDayAdd(pendingEstimateTask, resolvedMinutes);
      }

      setShowEstimateModal(false);
      setPendingEstimateTask(null);
      setEstimateInput("");
      refreshMyDayPage().catch(() => undefined);
    } catch {
      toast.error("Failed to add task to My Day");
    }
  }, [
    applyOptimisticMyDayAdd,
    estimateInput,
    myDayTaskIds,
    pendingEstimateTask,
    refreshMyDayPage,
    today,
  ]);

  const handleRemoveFromMyDay = useCallback(
    async (taskId: number) => {
      applyOptimisticMyDayRemove(taskId);
      try {
        await removeTaskFromMyDay(taskId, { plan_date: today });
        refreshMyDayPage().catch(() => undefined);
      } catch {
        toast.error("Failed to remove task from My Day");
        refreshMyDayPage().catch(() => undefined);
      }
    },
    [applyOptimisticMyDayRemove, refreshMyDayPage, today],
  );

  const handleAddSuggestedTask = useCallback(
    async (task: SuggestedTask) => {
      if (isSuggestionInMyDay(task, myDayTaskIds)) return;
      if (task.estimateMinutes <= 0) {
        handleOpenEstimateModal(task);
        return;
      }
      try {
        const result = await addTaskToMyDay({ task_id: task.id, plan_date: today });
        if (result.already_in_my_day) return;
        const minutes = resolveMinutesFromAddTaskResponse(result, task.estimateMinutes);
        applyOptimisticMyDayAdd(task, minutes);
        refreshMyDayPage().catch(() => undefined);
      } catch {
        toast.error("Failed to add task to My Day");
      }
    },
    [applyOptimisticMyDayAdd, handleOpenEstimateModal, refreshMyDayPage, myDayTaskIds, today],
  );

  const handleSuggestedAddClick = useCallback(
    (suggested: SuggestedTask) => {
      swallowAsyncError(handleAddSuggestedTask(suggested));
    },
    [handleAddSuggestedTask],
  );

  const handleCarryOverSkip = useCallback(() => {
    swallowAsyncError(
      submitMyDayRolloverAction({
        task_ids: selectedCarryOverIds,
        action: "dismiss",
      }).then(async () => {
        setCarryOverMode("skipped");
        setRolloverShowPrompt(false);
        await persistRolloverAck();
        return refreshMyDayPage();
      }),
    );
  }, [persistRolloverAck, refreshMyDayPage, selectedCarryOverIds]);

  const handleCarryOverScheduleLater = useCallback(() => {
    if (!scheduleLaterDate) {
      toast.error("Choose a date to schedule missed tasks");
      return;
    }
    swallowAsyncError(
      submitMyDayRolloverAction({
        task_ids: selectedCarryOverIds,
        action: "schedule",
        schedule_date: scheduleLaterDate,
      }).then(async () => {
        setShowScheduleLaterModal(false);
        setCarryOverMode("skipped");
        setRolloverShowPrompt(false);
        await persistRolloverAck();
        return refreshMyDayPage();
      }),
    );
  }, [persistRolloverAck, refreshMyDayPage, scheduleLaterDate, selectedCarryOverIds]);

  const handleCarryOverApply = useCallback(() => {
    swallowAsyncError(
      submitMyDayRolloverAction({
        task_ids: selectedCarryOverIds,
        action: "today",
      }).then(async () => {
        setCarryOverMode("added");
        setRolloverShowPrompt(false);
        await persistRolloverAck();
        return refreshMyDayPage();
      }),
    );
  }, [persistRolloverAck, refreshMyDayPage, selectedCarryOverIds]);

  const handleSaveDefaultCapacity = useCallback(async () => {
    const parsed = parseCapacityDurationInput(defaultCapacityDraft);
    if (parsed == null) {
      toast.error("Enter default capacity like 8h or 2h 30m");
      return;
    }
    try {
      await patchMyDayPreferences({ daily_capacity_minutes: parsed });
      setDefaultCapacityMinutes(parsed);
      setShowDefaultCapacityModal(false);
      const capacityPayload = await getMyDayCapacity({ date: today });
      applyCapacityFromApi(
        {
          ...capacityPayload,
          effective_capacity_minutes:
            Number(capacityPayload.effective_capacity_minutes ?? 0) || parsed,
          default_capacity_minutes: parsed,
        },
        parsed,
      );
      await refreshTasksAndRollover();
      await fetchSuggestions(debouncedSuggestedSearch).catch(() => undefined);
      toast.success("Default daily capacity saved");
    } catch {
      toast.error("Failed to save default capacity");
    }
  }, [
    applyCapacityFromApi,
    debouncedSuggestedSearch,
    defaultCapacityDraft,
    fetchSuggestions,
    refreshTasksAndRollover,
    today,
  ]);

  const skipEstimateAndAddToMyDay = useCallback(async () => {
    if (pendingEstimateTask == null) return;
    if (myDayTaskIds.has(pendingEstimateTask.id)) return;
    try {
      const result = await addTaskToMyDay({
        task_id: pendingEstimateTask.id,
        plan_date: today,
      });
      if (result.already_in_my_day) return;
      applyOptimisticMyDayAdd(pendingEstimateTask);
      setShowEstimateModal(false);
      setPendingEstimateTask(null);
      setEstimateInput("");
      refreshMyDayPage().catch(() => undefined);
    } catch {
      toast.error("Failed to add task to My Day");
    }
  }, [applyOptimisticMyDayAdd, refreshMyDayPage, myDayTaskIds, pendingEstimateTask, today]);

  const handleSaveCapacity = useCallback(
    async (minutesOverride?: number) => {
      try {
        const parsed = Math.max(
          1,
          Math.min(1440, Math.floor(minutesOverride ?? capacityMinutes)),
        );
        const capacityPayload = await overrideMyDayCapacity({
          minutes: parsed,
          for_date: today,
        });
        applyCapacityFromApi(capacityPayload, defaultCapacityMinutes);
        setIsEditingCapacity(false);
        await refreshTasksAndRollover();
        await fetchSuggestions(debouncedSuggestedSearch).catch(() => undefined);
      } catch {
        toast.error("Failed to override capacity");
      }
    },
    [
      applyCapacityFromApi,
      capacityMinutes,
      debouncedSuggestedSearch,
      fetchSuggestions,
      refreshTasksAndRollover,
      today,
    ],
  );

  const handleStartCapacityEdit = useCallback(() => {
    setCapacityDraft(formatCapacityDurationInput(capacityMinutes));
    setIsEditingCapacity(true);
  }, [capacityMinutes]);

  const handleSaveCapacityDraft = useCallback(() => {
    const parsed = parseCapacityDurationInput(capacityDraft);
    if (parsed == null) {
      toast.error("Enter capacity like 8h or 2h 30m");
      return;
    }
    setCapacityMinutes(parsed);
    handleSaveCapacity(parsed).catch(() => undefined);
  }, [capacityDraft, handleSaveCapacity]);

  const onTaskToggleCompleteClick = useCallback(
    (task: MyDayTask) => {
      swallowAsyncError(handleToggleComplete(task));
    },
    [handleToggleComplete],
  );

  const onTaskRemoveClick = useCallback(
    (taskId: number) => {
      swallowAsyncError(handleRemoveFromMyDay(taskId));
    },
    [handleRemoveFromMyDay],
  );

  return {
    managerExtension,
    reporteeExtensions,
    showMyTeamSection,
    hierarchyDataExtensions,
    loading,
    capacityMinutes,
    showCreateSidebar,
    setShowCreateSidebar,
    carryOverMode,
    carryOverTasks,
    selectedCarryOverIds,
    suggestedSearch,
    setSuggestedSearch,
    showEstimateModal,
    setShowEstimateModal,
    estimateInput,
    setEstimateInput,
    pendingEstimateTask,
    setPendingEstimateTask,
    rolloverShowPrompt,
    showHistoryModal,
    setShowHistoryModal,
    planDate,
    isEditingCapacity,
    setIsEditingCapacity,
    capacityDraft,
    setCapacityDraft,
    suggestionsLoading,
    defaultCapacityMinutes,
    showDefaultCapacityModal,
    setShowDefaultCapacityModal,
    defaultCapacityDraft,
    setDefaultCapacityDraft,
    showScheduleLaterModal,
    setShowScheduleLaterModal,
    scheduleLaterDate,
    setScheduleLaterDate,
    isEmptyByDesign,
    suggestionsPanelRef,
    today,
    myDayTaskIds,
    activeTasks,
    unestimatedActiveCount,
    completedTasks,
    completedTasksCount,
    summary,
    capacityOverageMessage,
    groupedSuggestions,
    headerDateLabel,
    headerMetaLine,
    rolloverPromptCopy,
    refreshMyDayPage,
    toggleCarryOverSelection,
    handleOpenEstimateModal,
    scrollToSuggestions,
    confirmEstimateAndAdd,
    skipEstimateAndAddToMyDay,
    handleSaveDefaultCapacity,
    handleSaveCapacityDraft,
    handleStartCapacityEdit,
    handleCarryOverApply,
    handleCarryOverSkip,
    handleCarryOverScheduleLater,
    handleSuggestedAddClick,
    onTaskToggleCompleteClick,
    onTaskRemoveClick,
    formatCapacityDurationInput,
  };
}

export type MyDayTasksPageViewModel = ReturnType<typeof useMyDayTasksPageController>;

type MyDayTasksPageViewProps = Readonly<{ vm: MyDayTasksPageViewModel }>;

function formatUnestimatedActiveLabel(count: number): string {
  if (count === 1) return "1 task without an estimate";
  return `${count} tasks without an estimate`;
}

function resolveTodayEmptyMessage(isEmptyByDesign: boolean): string {
  if (isEmptyByDesign) {
    return "My Day starts empty each morning. Add tasks from suggestions or create a new task.";
  }
  return "No active tasks in My Day";
}

function MyDayPageHeader({ vm }: MyDayTasksPageViewProps) {
  return (
    <div className="myday-header">
      <div className="myday-header__text">
        <h2>My Day</h2>
        <p className="myday-header__date">{vm.headerDateLabel}</p>
        <p className="myday-header__meta">{vm.headerMetaLine}</p>
      </div>
      <div className="myday-header__actions">
        <Button variant="outline-secondary" size="sm" onClick={() => vm.setShowHistoryModal(true)}>
          <History size={14} className="me-1" />
          History
        </Button>
        <Button size="sm" onClick={() => vm.setShowCreateSidebar(true)}>
          <Plus size={14} className="me-1" />
          Add Task
        </Button>
      </div>
    </div>
  );
}

function MyDayCapacitySection({ vm }: MyDayTasksPageViewProps) {
  const showUnestimated = vm.unestimatedActiveCount > 0;
  return (
    <div className="myday-capacity-card">
      <div className="myday-capacity-top">
        <div className="myday-capacity-title">
          <span className="myday-capacity-label">CAPACITY</span>
          <span className="myday-capacity-values">
            <strong>{toMinutesDisplay(vm.summary.planned)}</strong> /{" "}
            {toMinutesDisplay(vm.capacityMinutes)}
            <span className="myday-capacity-units"> (hours &amp; minutes)</span>
          </span>
        </div>
        <div className="myday-capacity-side">
          <span className="myday-capacity-pct-inline">{vm.summary.displayPct}%</span>
          <button
            type="button"
            className="btn btn-link btn-sm myday-default-capacity-btn"
            onClick={() => {
              vm.setDefaultCapacityDraft(
                vm.formatCapacityDurationInput(vm.defaultCapacityMinutes),
              );
              vm.setShowDefaultCapacityModal(true);
            }}
          >
            Default capacity
          </button>
        </div>
        <div className="myday-capacity-input">
          {vm.isEditingCapacity ? (
            <>
              <input
                type="text"
                value={vm.capacityDraft}
                placeholder="8h or 2h 30m"
                onChange={(e) => vm.setCapacityDraft(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => vm.handleSaveCapacityDraft()}
              >
                Save
              </button>
              <button
                type="button"
                className="btn btn-sm btn-link"
                onClick={() => vm.setIsEditingCapacity(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className="myday-capacity-edit-btn"
              aria-label="Edit capacity"
              onClick={vm.handleStartCapacityEdit}
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="myday-progress-track myday-progress-track--capacity">
        <div
          className={`myday-progress-fill myday-progress-fill--${vm.summary.capacityTone}`}
          style={{ width: `${Math.min(100, vm.summary.plannedPct)}%` }}
        />
      </div>
      {vm.capacityOverageMessage ? (
        <output className="myday-capacity-alert">{vm.capacityOverageMessage}</output>
      ) : null}
      {showUnestimated ? (
        <p className="myday-unestimated-count">
          {formatUnestimatedActiveLabel(vm.unestimatedActiveCount)}
        </p>
      ) : null}
    </div>
  );
}

function MyDayRolloverSection({ vm }: MyDayTasksPageViewProps) {
  const showCard =
    vm.carryOverTasks.length > 0 && vm.carryOverMode === "pending" && vm.rolloverShowPrompt;
  if (!showCard) return null;
  return (
    <div className="myday-carry-card">
      <h4>Missed yesterday</h4>
      <p className="myday-carry-copy">{vm.rolloverPromptCopy}</p>
      <div className="myday-carry-list">
        {vm.carryOverTasks.slice(0, 5).map((task) => (
          <button
            key={task.id}
            type="button"
            className={`myday-carry-item ${vm.selectedCarryOverIds.includes(task.id) ? "selected" : ""}`}
            onClick={() => vm.toggleCarryOverSelection(task.id)}
          >
            <span>{task.title}</span>
            <span>{task.estimateMinutes > 0 ? `${task.estimateMinutes}m` : "--"}</span>
          </button>
        ))}
      </div>
      <div className="myday-carry-actions">
        <button type="button" onClick={vm.handleCarryOverApply}>
          Add to today
        </button>
        <button
          type="button"
          onClick={() => {
            vm.setScheduleLaterDate(moment().add(1, "day").format("YYYY-MM-DD"));
            vm.setShowScheduleLaterModal(true);
          }}
        >
          Schedule later
        </button>
        <button type="button" onClick={vm.handleCarryOverSkip}>
          Handle them later
        </button>
      </div>
    </div>
  );
}

type MyDayTaskListHandlers = Readonly<{
  onToggleComplete: (task: MyDayTask) => void;
  onRemove: (taskId: number) => void;
  onEditEstimate: (task: MyDayTask) => void;
}>;

function MyDayTaskList({
  tasks,
  handlers,
  keyPrefix = "",
}: Readonly<{
  tasks: MyDayTask[];
  handlers: MyDayTaskListHandlers;
  keyPrefix?: string;
}>) {
  return (
    <div className="myday-task-card-list">
      {tasks.map((task) => (
        <MyDayTaskCard
          key={keyPrefix ? `${keyPrefix}${task.id}` : task.id}
          task={task}
          onToggleComplete={handlers.onToggleComplete}
          onRemove={handlers.onRemove}
          onEditEstimate={handlers.onEditEstimate}
        />
      ))}
    </div>
  );
}

function MyDayTodayTasksSection({ vm }: MyDayTasksPageViewProps) {
  const [isOpen, setIsOpen] = React.useState(true);
  const handlers: MyDayTaskListHandlers = {
    onToggleComplete: vm.onTaskToggleCompleteClick,
    onRemove: vm.onTaskRemoveClick,
    onEditEstimate: vm.handleOpenEstimateModal,
  };
  const showLoading = vm.loading && vm.activeTasks.length === 0;
  const showEmpty = !vm.loading && vm.activeTasks.length === 0;
  const hasTasks = vm.activeTasks.length > 0;
  return (
    <div className="myday-table-card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => hasTasks && setIsOpen(!isOpen)}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: hasTasks ? "pointer" : "default", padding: 0, fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif", flex: 1 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"
            style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s ease", flexShrink: 0, opacity: hasTasks ? 1 : 0.3 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#718096", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
            Today&apos;s Tasks
          </span>
          {hasTasks && (
            <span style={{ fontSize: 11, color: "#0066CC", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "1px 8px", borderRadius: 20, fontWeight: 500 }}>
              {vm.activeTasks.length}
            </span>
          )}
          <div style={{ flex: 1, height: 1, background: "#eaf0f6", marginLeft: 4 }} />
        </button>
        {null}
      </div>
      {isOpen && (
        <>
      {showLoading ? (
        <div className="myday-empty-state">
          <div style={{ fontSize: 32, opacity: 0.2 }}>⏳</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#4a5568" }}>Loading tasks...</div>
        </div>
      ) : null}
      {showEmpty ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "clamp(16px, 2.5vw, 28px) 16px", gap: 10, minHeight: "clamp(140px, 20vh, 220px)" }}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.18 }}>
            <circle cx="32" cy="32" r="28" stroke="#0066CC" strokeWidth="2.5"/>
            <path d="M20 32h24M32 20v24" stroke="#0066CC" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="32" cy="14" r="3" fill="#0066CC"/>
            <circle cx="50" cy="32" r="3" fill="#0066CC"/>
            <circle cx="32" cy="50" r="3" fill="#0066CC"/>
            <circle cx="14" cy="32" r="3" fill="#0066CC"/>
          </svg>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#4a5568" }}>No tasks planned for today</div>
          <div style={{ fontSize: 12, color: "#718096", maxWidth: 220, lineHeight: 1.6, textAlign: "center" }}>
            Add tasks from the suggestions panel or create a new one
          </div>
          <button
            type="button"
            onClick={() => {
              vm.scrollToSuggestions();
              setTimeout(() => {
                const searchInput = document.querySelector('#myday-suggestions-panel input[type="text"]') as HTMLInputElement | null;
                if (searchInput) {
                  searchInput.focus();
                  searchInput.style.transition = "box-shadow 0.2s ease";
                  searchInput.style.boxShadow = "0 0 0 3px rgba(0,102,204,0.25)";
                  setTimeout(() => { searchInput.style.boxShadow = ""; }, 1500);
                }
              }, 300);
            }}
            style={{
              marginTop: 4,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 500,
              color: "#fff",
              background: "#0066CC",
              border: "none",
              borderRadius: 7,
              padding: "7px 16px",
              cursor: "pointer",
              fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
            }}
          >
            + Browse Suggestions
          </button>
        </div>
      ) : null}
      <MyDayTaskList tasks={vm.activeTasks} handlers={handlers} />
        </>
      )}
    </div>
  );
}

function MyDayCompletedSection({ vm }: MyDayTasksPageViewProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const handlers: MyDayTaskListHandlers = {
    onToggleComplete: vm.onTaskToggleCompleteClick,
    onRemove: vm.onTaskRemoveClick,
    onEditEstimate: vm.handleOpenEstimateModal,
  };
  const hasCompleted = vm.completedTasks.length > 0;
  return (
    <div style={{ marginTop: 16 }}>
      <button
        type="button"
        onClick={() => hasCompleted && setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          background: "none",
          border: "none",
          cursor: hasCompleted ? "pointer" : "default",
          fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
          padding: 0,
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          style={{
            transform: isOpen ? "rotate(90deg)" : "none",
            transition: "transform 0.2s ease",
            flexShrink: 0,
            opacity: hasCompleted ? 1 : 0.3,
          }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span style={{ fontSize: 10, fontWeight: 600, color: "#718096", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
          Completed
        </span>
        {hasCompleted && (
          <span style={{
            fontSize: 11, color: "#22c55e", background: "#f0fdf4",
            border: "1px solid #bbf7d0", padding: "1px 8px",
            borderRadius: 20, fontWeight: 500, whiteSpace: "nowrap",
          }}>
            {vm.completedTasksCount}
          </span>
        )}
        <div style={{ flex: 1, height: 1, background: "#eaf0f6", marginLeft: 4 }} />
      </button>

      {!hasCompleted && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "clamp(16px, 2.5vw, 28px) 16px", gap: 10, minHeight: "clamp(140px, 20vh, 220px)" }}>
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.15 }}>
            <circle cx="26" cy="26" r="22" stroke="#22c55e" strokeWidth="2.5"/>
            <path d="M16 26l7 7 13-13" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#4a5568" }}>No completed tasks yet</div>
          <div style={{ fontSize: 11, color: "#94a3b8", maxWidth: 200, textAlign: "center", lineHeight: 1.6 }}>
            Complete a task to see it here
          </div>
        </div>
      )}

      {isOpen && hasCompleted && (
        <div style={{ marginTop: 8 }}>
          <MyDayTaskList tasks={vm.completedTasks} handlers={handlers} />
        </div>
      )}
    </div>
  );
}

function MyDaySuggestionsPanel({ vm }: MyDayTasksPageViewProps) {
  const showEmptySuggestions = !vm.suggestionsLoading && vm.groupedSuggestions.length === 0;
  return (
    <aside ref={vm.suggestionsPanelRef} id="myday-suggestions-panel" className="myday-suggested">
      <h4>Suggested for Today</h4>
      <div className="myday-search-wrap">
        <Search size={14} />
        <input
          type="text"
          placeholder="Search tasks..."
          value={vm.suggestedSearch}
          onChange={(e) => vm.setSuggestedSearch(e.target.value)}
        />
      </div>
      {vm.suggestionsLoading ? (
        <p className="myday-empty-state">Searching suggestions...</p>
      ) : null}
      <div className="myday-suggested-groups">
        {showEmptySuggestions ? (
          <p className="myday-empty-state">No suggestions match your search.</p>
        ) : null}
        {vm.groupedSuggestions.map((group) => (
          <section key={group.category} className="myday-suggested-group">
            <h5 className={`myday-suggested-group__title cat-${group.category}`}>{group.label}</h5>
            <div className="myday-suggested-list">
              {group.items.map((task) => (
                <MyDaySuggestedItemButton
                  key={`${group.category}-${task.id}`}
                  task={task}
                  groupCategory={group.category}
                  inMyDay={isSuggestionInMyDay(task, vm.myDayTaskIds)}
                  onAdd={vm.handleSuggestedAddClick}
                  className={group.category === "overdue" ? "cat-overdue" : ""}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}

function MyDayTasksPageModals({ vm }: MyDayTasksPageViewProps) {
  return (
    <>
      <CreateTaskSidebar
        isOpen={vm.showCreateSidebar}
        onClose={() => vm.setShowCreateSidebar(false)}
        onCreate={async () => {
          vm.setShowCreateSidebar(false);
          await vm.refreshMyDayPage();
        }}
        extensions={vm.hierarchyDataExtensions as never}
      />
      <Modal
        show={vm.showEstimateModal}
        onHide={() => {
          vm.setShowEstimateModal(false);
          vm.setPendingEstimateTask(null);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Quick estimate</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-2">{vm.pendingEstimateTask?.title}</div>
          <div className="d-flex flex-wrap gap-2 mb-3">
            {ESTIMATE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => vm.setEstimateInput(String(preset))}
                className="myday-estimate-chip"
              >
                {preset}m
              </button>
            ))}
          </div>
          <Form.Control
            type="number"
            min={1}
            placeholder="Custom minutes"
            value={vm.estimateInput}
            onChange={(e) => vm.setEstimateInput(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              vm.skipEstimateAndAddToMyDay().catch(() => undefined);
            }}
          >
            Skip
          </Button>
          <Button
            onClick={() => {
              vm.confirmEstimateAndAdd().catch(() => undefined);
            }}
          >
            Add to My Day
          </Button>
        </Modal.Footer>
      </Modal>
      <MyDayHistoryModal
        show={vm.showHistoryModal}
        todayIso={vm.today}
        onClose={() => vm.setShowHistoryModal(false)}
      />
      <Modal
        show={vm.showDefaultCapacityModal}
        onHide={() => vm.setShowDefaultCapacityModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Default daily capacity</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small mb-2">
            Used as your default when opening My Day (Settings / My Day).
          </p>
          <Form.Control
            type="text"
            placeholder="8h or 2h 30m"
            value={vm.defaultCapacityDraft}
            onChange={(e) => vm.setDefaultCapacityDraft(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => vm.setShowDefaultCapacityModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              vm.handleSaveDefaultCapacity().catch(() => undefined);
            }}
          >
            Save default
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={vm.showScheduleLaterModal}
        onHide={() => vm.setShowScheduleLaterModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Schedule missed tasks</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Label>Schedule for</Form.Label>
          <Form.Control
            type="date"
            min={vm.today}
            value={vm.scheduleLaterDate}
            onChange={(e) => vm.setScheduleLaterDate(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => vm.setShowScheduleLaterModal(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={vm.handleCarryOverScheduleLater}>
            Schedule later
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

function MyDayTasksPageView({ vm }: MyDayTasksPageViewProps) {
  const showTeam = vm.showMyTeamSection;
  return (
    <div className="myday-page-shell">
      <BreadcrumbItem mainTitle="Planner" mainLink="/planner/dashboard" subTitle="My Day" />
      <div className="myday-header-area">
        <MyDayPageHeader vm={vm} />
        <MyDayCapacitySection vm={vm} />
      </div>
      <div className="myday-layout">
        <div className="myday-main">
          <MyDayRolloverSection vm={vm} />
          {showTeam && vm.reporteeExtensions.length > 0 ? (
            <MyDayTeamSection
              planDate={vm.planDate || vm.today}
              managerExtension={vm.managerExtension}
              reporteeExtensions={vm.reporteeExtensions}
              hierarchyExtensions={vm.hierarchyDataExtensions}
            />
          ) : null}
          <MyDayTodayTasksSection vm={vm} />
          <MyDayCompletedSection vm={vm} />
        </div>
        <MyDaySuggestionsPanel vm={vm} />
      </div>
      <MyDayTasksPageModals vm={vm} />
    </div>
  );
}

const MyDayTasksPage: React.FC = () => (
  <MyDayTasksPageView vm={useMyDayTasksPageController()} />
);

export default MyDayTasksPage;
