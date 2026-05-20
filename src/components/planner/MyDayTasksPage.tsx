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
  type MyDayTasksMeta,
} from "@utils/tasks";
import { MyDayHistoryModal } from "@components/planner/MyDayHistoryModal";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { formatDateGlobal, ModuleSlug } from "@utils/Helper";
import {
  formatCapacityOverageMessage,
  formatMyDayHeaderMetaLine,
  formatRolloverPromptCopy,
  formatSuggestionDueDate,
  getCapacityFillTone,
  isFlexibleTaskRow,
  MY_DAY_CATEGORY_LABELS,
  MY_DAY_SUGGESTION_CATEGORY_ORDER,
  readRolloverIgnoreCount,
  resolveEstimateMinutesFromRow,
  resolveMyDayReporteeExtensions,
  resolveMyDayTaskCount,
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
  const project = resolveProjectFromRow(row);
  const ignoreCount = readRolloverIgnoreCount(row);
  const isOrgTask = row.is_org_task === true || project.isOrganizational;
  const title =
    typeof row.title === "string" && row.title.trim() ? row.title.trim() : `Task #${id}`;
  return {
    id,
    title,
    dueDate: dueRaw,
    priority: String(row.priority ?? "normal"),
    isCompleted: row.is_completed === true || row.completed === true,
    estimateMinutes: estimate,
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

function collectSuggestionCategories(payload: MyDaySuggestionsPayload): MyDaySuggestionCategory[] {
  const seen = new Set<string>();
  const ordered: MyDaySuggestionCategory[] = [];
  for (const category of MY_DAY_SUGGESTION_CATEGORY_ORDER) {
    if (!Array.isArray(payload[category])) continue;
    ordered.push(category);
    seen.add(category);
  }
  for (const key of Object.keys(payload)) {
    if (seen.has(key) || !Array.isArray(payload[key as MyDaySuggestionCategory])) continue;
    ordered.push(key as MyDaySuggestionCategory);
  }
  return ordered;
}

type MyDaySuggestedItemButtonProps = Readonly<{
  task: SuggestedTask;
  groupCategory: MyDaySuggestionCategory;
  inMyDay: boolean;
  onAdd: (task: SuggestedTask) => void;
}>;

function MyDaySuggestedItemButton({
  task,
  inMyDay,
  onAdd,
}: MyDaySuggestedItemButtonProps) {
  const priorityKey = task.priority.toLowerCase().replace(/\s+/g, "-");
  const dueLabel = formatSuggestionDueDate(task.dueDate);
  return (
    <button
      type="button"
      className={`myday-suggested-item ${inMyDay ? "is-added" : ""}`}
      disabled={inMyDay}
      onClick={() => onAdd(task)}
    >
      <div className="title">{task.title}</div>
      <div className="meta">
        {dueLabel ? <span className="myday-tag myday-tag--due">{dueLabel}</span> : null}
        <span
          className={`myday-tag myday-tag--project ${
            task.isPersonalTask ? "myday-tag--personal" : ""
          } ${task.isOrganizationalTask ? "myday-tag--organizational" : ""}`}
        >
          {task.projectName}
        </span>
        <span className={`myday-tag myday-tag--priority priority-${priorityKey}`}>
          {task.priority}
        </span>
        {task.isFlexibleTask ? (
          <span className="myday-tag myday-tag--flexible">Flexible Task</span>
        ) : null}
        {task.showIgnoredFlag ? (
          <span className="myday-tag myday-tag--ignored">3x Ignored</span>
        ) : null}
        <span
          className={`myday-tag myday-tag--estimate ${
            task.estimateMinutes <= 0 ? "myday-tag--no-estimate" : ""
          }`}
        >
          {task.estimateMinutes > 0 ? (
            toMinutesDisplay(task.estimateMinutes)
          ) : (
            <>
              <span className="myday-unestimated-dot" title="No estimate" aria-label="No estimate" />
              No estimate
            </>
          )}
        </span>
        {inMyDay ? <span className="myday-added-label">Added</span> : null}
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
  if (task.estimateMinutes > 0) {
    return (
      <span className="myday-tag myday-tag--estimate">
        {toMinutesDisplay(task.estimateMinutes)}
      </span>
    );
  }
  const noEstimate = (
    <span className="myday-tag myday-tag--estimate myday-tag--no-estimate">
      <span className="myday-unestimated-dot" title="No estimate" aria-label="No estimate" />
      No estimate
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
  return (
    <div className={`myday-task-card ${task.isCompleted ? "is-completed" : ""}`}>
      <div className="myday-task-card__main">
        <button
          type="button"
          className="myday-toggle-btn myday-task-card__complete"
          aria-label={task.isCompleted ? "Mark incomplete" : "Mark complete"}
          onClick={() => onToggleComplete(task)}
        >
          {task.isCompleted ? <CircleCheckBig size={18} /> : <Circle size={18} />}
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
              {task.priority}
            </span>
            {task.isFlexibleTask ? (
              <span className="myday-tag myday-tag--flexible">Flexible Task</span>
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
        <X size={16} />
      </button>
    </div>
  );
}

const MyDayTasksPage: React.FC = () => {
  const { data: session } = useSession();
  const managerExtension = useMemo(() => getSessionPhoneOrExtension(session), [session]);
  const { hierarchyDataExtensions } = useHierarchyData(ModuleSlug.WORK_PLANNER);
  const reporteeExtensions = useMemo(
    () => resolveMyDayReporteeExtensions(hierarchyDataExtensions, managerExtension),
    [hierarchyDataExtensions, managerExtension],
  );
  const [tasks, setTasks] = useState<MyDayTask[]>([]);
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);
  const [rolloverTasks, setRolloverTasks] = useState<MyDayTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [capacityMinutes, setCapacityMinutes] = useState(8 * 60);
  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [carryOverMode, setCarryOverMode] = useState<"pending" | "added" | "skipped">("pending");
  const [selectedCarryOverIds, setSelectedCarryOverIds] = useState<number[]>([]);
  const [suggestedSearch, setSuggestedSearch] = useState("");
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [estimateInput, setEstimateInput] = useState("");
  const [pendingEstimateTask, setPendingEstimateTask] = useState<MyDayTask | null>(null);
  const [plannedMinutes, setPlannedMinutes] = useState(0);
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
  const rolloverAckSentRef = useRef(false);
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
        const suggestionsPayload = await getMyDaySuggestions(
          search ? { search } : {},
        );
        if (requestId !== suggestionsRequestRef.current) return;
        setSuggestedTasks(buildSuggestionsFromPayload(suggestionsPayload));
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

  const applyCapacityFromApi = useCallback((capacityPayload: MyDayCapacityPayload) => {
    const effective = Number(capacityPayload.effective_capacity_minutes ?? 0);
    if (effective > 0) {
      setCapacityMinutes(effective);
    }
    const planned = Number(capacityPayload.planned_minutes);
    if (Number.isFinite(planned)) {
      setPlannedMinutes(Math.max(0, planned));
    }
  }, []);

  const fetchCoreMyDayData = useCallback(async () => {
    try {
      setLoading(true);
      const [preferences, taskPayload, capacityPayload, rolloverPayload] = await Promise.all([
        getMyDayPreferences(),
        listMyDayTasks(),
        getMyDayCapacity({ date: today }),
        getMyDayRollover(),
      ]);

      const active = (taskPayload.active ?? []).map((row) =>
        mapMyDayTaskRow(row, todayStart),
      );
      const completed = (taskPayload.completed ?? []).map((row) =>
        mapMyDayTaskRow(row, todayStart),
      );
      setTasks([...active, ...completed]);
      setPlanDate(taskPayload.plan_date ?? today);
      setTasksMeta(taskPayload.meta ?? {});
      setIsEmptyByDesign(taskPayload.is_empty_by_design === true);

      const defaultCapacity = Number(preferences.daily_capacity_minutes ?? 0);
      const resolvedDefault = defaultCapacity > 0 ? defaultCapacity : 8 * 60;
      setDefaultCapacityMinutes(resolvedDefault);
      applyCapacityFromApi({
        ...capacityPayload,
        effective_capacity_minutes:
          Number(capacityPayload.effective_capacity_minutes ?? 0) || resolvedDefault,
      });

      const rollover = (rolloverPayload.tasks ?? []).map((row) =>
        mapMyDayTaskRow(row, todayStart),
      );
      setRolloverTasks(rollover);
      setRolloverPreviousDate(rolloverPayload.previous_date ?? null);
      const hasIncompleteToday = [...active, ...completed].some((task) => !task.isCompleted);
      setRolloverShowPrompt(
        resolveShowRolloverPrompt(rolloverPayload, {
          hasIncompleteTodayTasks: hasIncompleteToday,
          todayTaskCount: active.length + completed.length,
        }),
      );
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
      const active = (taskPayload.active ?? []).map((row) =>
        mapMyDayTaskRow(row, todayStart),
      );
      const completed = (taskPayload.completed ?? []).map((row) =>
        mapMyDayTaskRow(row, todayStart),
      );
      setTasks([...active, ...completed]);
      setPlanDate(taskPayload.plan_date ?? today);
      setTasksMeta(taskPayload.meta ?? {});
      setIsEmptyByDesign(taskPayload.is_empty_by_design === true);

      const rollover = (rolloverPayload.tasks ?? []).map((row) =>
        mapMyDayTaskRow(row, todayStart),
      );
      setRolloverTasks(rollover);
      setRolloverPreviousDate(rolloverPayload.previous_date ?? null);
      const hasIncompleteToday = [...active, ...completed].some((task) => !task.isCompleted);
      setRolloverShowPrompt(
        resolveShowRolloverPrompt(rolloverPayload, {
          hasIncompleteTodayTasks: hasIncompleteToday,
          todayTaskCount: active.length + completed.length,
        }),
      );
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

  useEffect(() => {
    if (!rolloverShowPrompt) {
      rolloverAckSentRef.current = false;
      return;
    }
    if (carryOverTasks.length === 0 || carryOverMode !== "pending") {
      return;
    }
    if (rolloverAckSentRef.current) return;
    rolloverAckSentRef.current = true;
    void ackMyDayRolloverPrompt()
      .then(() => refreshMyDayPage())
      .catch(() => {
        rolloverAckSentRef.current = false;
      });
  }, [carryOverMode, carryOverTasks.length, refreshMyDayPage, rolloverShowPrompt]);

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
  }, [carryOverTasks]);

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

  const organizationalActiveTasks = useMemo(
    () => activeTasks.filter((task) => task.isOrganizationalTask),
    [activeTasks],
  );

  const standardActiveTasks = useMemo(
    () => activeTasks.filter((task) => !task.isOrganizationalTask),
    [activeTasks],
  );

  const unestimatedActiveCount = useMemo(
    () => resolveMyDayUnestimatedCount(activeTasks, tasksMeta),
    [activeTasks, tasksMeta],
  );

  const completedTasks = useMemo(
    () => visibleTasks.filter((task) => task.isCompleted),
    [visibleTasks],
  );

  const completedTasksCount = useMemo(() => {
    if (tasksMeta.tasks_completed != null) {
      return Math.max(0, Math.floor(tasksMeta.tasks_completed));
    }
    if (tasksMeta.completed_count != null) {
      return Math.max(0, Math.floor(tasksMeta.completed_count));
    }
    return completedTasks.length;
  }, [completedTasks.length, tasksMeta.completed_count, tasksMeta.tasks_completed]);

  const summary = useMemo(() => {
    const planned = resolveMyDayCapacityUsedMinutes(tasks, plannedMinutes);
    const plannedPct = Math.round((planned / Math.max(1, capacityMinutes)) * 100);
    const capacityTone = getCapacityFillTone(Math.min(100, plannedPct));
    return { planned, plannedPct, capacityTone };
  }, [capacityMinutes, plannedMinutes, tasks]);

  const capacityOverageMessage = useMemo(
    () => formatCapacityOverageMessage(summary.planned, capacityMinutes),
    [capacityMinutes, summary.planned],
  );

  const groupedSuggestions = useMemo(() => {
    const byCategory = new Map<MyDaySuggestionCategory, SuggestedTask[]>();
    for (const task of suggestedTasks) {
      const bucket = byCategory.get(task.category) ?? [];
      bucket.push(task);
      byCategory.set(task.category, bucket);
    }
    const groups: { category: MyDaySuggestionCategory; label: string; items: SuggestedTask[] }[] =
      [];
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
  }, [suggestedTasks]);

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

      let resolvedMinutes = parsed;
      if (result.task != null && typeof result.task === "object") {
        const fromApi = resolveEstimateMinutesFromRow(
          result.task as Record<string, unknown>,
        );
        if (fromApi > 0) resolvedMinutes = fromApi;
      }

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
        let minutes = task.estimateMinutes;
        if (result.task != null && typeof result.task === "object") {
          const fromApi = resolveEstimateMinutesFromRow(
            result.task as Record<string, unknown>,
          );
          if (fromApi > 0) minutes = fromApi;
        }
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
      }).then(() => {
        setCarryOverMode("skipped");
        setRolloverShowPrompt(false);
        return refreshMyDayPage();
      }),
    );
  }, [refreshMyDayPage, selectedCarryOverIds]);

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
      }).then(() => {
        setShowScheduleLaterModal(false);
        setCarryOverMode("skipped");
        setRolloverShowPrompt(false);
        return refreshMyDayPage();
      }),
    );
  }, [refreshMyDayPage, scheduleLaterDate, selectedCarryOverIds]);

  const handleCarryOverApply = useCallback(() => {
    swallowAsyncError(
      submitMyDayRolloverAction({
        task_ids: selectedCarryOverIds,
        action: "today",
      }).then(() => {
        setCarryOverMode("added");
        setRolloverShowPrompt(false);
        return refreshMyDayPage();
      }),
    );
  }, [refreshMyDayPage, selectedCarryOverIds]);

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
      applyCapacityFromApi({
        ...capacityPayload,
        effective_capacity_minutes:
          Number(capacityPayload.effective_capacity_minutes ?? 0) || parsed,
        default_capacity_minutes: parsed,
      });
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
        applyCapacityFromApi(capacityPayload);
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

  return (
    <div className="myday-page-shell">
      <BreadcrumbItem mainTitle="Planner" mainLink="/planner/dashboard" subTitle="My Day" />
      <div className="myday-layout">
        <div className="myday-main">
          <div className="myday-header">
            <div className="myday-header__text">
              <h2>My Day</h2>
              <p className="myday-header__date">{headerDateLabel}</p>
              <p className="myday-header__meta">{headerMetaLine}</p>
            </div>
            <div className="myday-header__actions">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setShowHistoryModal(true)}
              >
                <History size={14} className="me-1" />
                History
              </Button>
              <Button size="sm" onClick={() => setShowCreateSidebar(true)}>
                <Plus size={14} className="me-1" />
                Add Task
              </Button>
            </div>
          </div>

          <div className="myday-capacity-card">
            <div className="myday-capacity-top">
              <div className="myday-capacity-title">
                <span className="myday-capacity-label">CAPACITY</span>
                <span className="myday-capacity-values">
                  <strong>{toMinutesDisplay(summary.planned)}</strong> /{" "}
                  {toMinutesDisplay(capacityMinutes)}
                  <span className="myday-capacity-units"> (hours &amp; minutes)</span>
                </span>
              </div>
              <div className="myday-capacity-side">
                <span className="myday-capacity-pct-inline">{summary.plannedPct}%</span>
                <button
                  type="button"
                  className="btn btn-link btn-sm myday-default-capacity-btn"
                  onClick={() => {
                    setDefaultCapacityDraft(formatCapacityDurationInput(defaultCapacityMinutes));
                    setShowDefaultCapacityModal(true);
                  }}
                >
                  Default capacity
                </button>
              </div>
              <div className="myday-capacity-input">
                {isEditingCapacity ? (
                  <>
                    <input
                      type="text"
                      value={capacityDraft}
                      placeholder="8h or 2h 30m"
                      onChange={(e) => setCapacityDraft(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleSaveCapacityDraft()}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-link"
                      onClick={() => setIsEditingCapacity(false)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="myday-capacity-edit-btn"
                    aria-label="Edit capacity"
                    onClick={handleStartCapacityEdit}
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="myday-progress-track myday-progress-track--capacity">
              <div
                className={`myday-progress-fill myday-progress-fill--${summary.capacityTone}`}
                style={{ width: `${Math.min(100, summary.plannedPct)}%` }}
              />
            </div>
            {capacityOverageMessage ? (
              <output className="myday-capacity-alert">{capacityOverageMessage}</output>
            ) : null}
            {unestimatedActiveCount > 0 ? (
              <p className="myday-unestimated-count">
                {unestimatedActiveCount === 1
                  ? "1 task without an estimate"
                  : `${unestimatedActiveCount} tasks without an estimate`}
              </p>
            ) : null}
          </div>

          {carryOverTasks.length > 0 && carryOverMode === "pending" && rolloverShowPrompt ? (
            <div className="myday-carry-card">
              <h4>Missed yesterday</h4>
              <p className="myday-carry-copy">{rolloverPromptCopy}</p>
              <div className="myday-carry-list">
                {carryOverTasks.slice(0, 5).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    className={`myday-carry-item ${selectedCarryOverIds.includes(task.id) ? "selected" : ""}`}
                    onClick={() => toggleCarryOverSelection(task.id)}
                  >
                    <span>{task.title}</span>
                    <span>{task.estimateMinutes > 0 ? `${task.estimateMinutes}m` : "--"}</span>
                  </button>
                ))}
              </div>
              <div className="myday-carry-actions">
                <button type="button" onClick={handleCarryOverApply}>
                  Add to today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScheduleLaterDate(moment().add(1, "day").format("YYYY-MM-DD"));
                    setShowScheduleLaterModal(true);
                  }}
                >
                  Schedule later
                </button>
                <button type="button" onClick={handleCarryOverSkip}>
                  Handle later
                </button>
              </div>
            </div>
          ) : null}

          <div className="myday-table-card">
            <div className="myday-section-header">
              <div className="myday-section-title">Today&apos;s Tasks</div>
              <Button variant="outline-primary" size="sm" onClick={scrollToSuggestions}>
                Add to My Day
              </Button>
            </div>
            {loading && activeTasks.length === 0 ? (
              <p className="myday-empty-state">Loading My Day tasks...</p>
            ) : null}
            {!loading && activeTasks.length === 0 ? (
              <p className="myday-empty-state">
                {isEmptyByDesign
                  ? "My Day starts empty each morning. Add tasks from suggestions or create a new task."
                  : "No active tasks in My Day"}
              </p>
            ) : null}
            <div className="myday-task-card-list">
              {standardActiveTasks.map((task) => (
                <MyDayTaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={onTaskToggleCompleteClick}
                  onRemove={onTaskRemoveClick}
                  onEditEstimate={handleOpenEstimateModal}
                />
              ))}
            </div>
            {organizationalActiveTasks.length > 0 ? (
              <>
                <div className="myday-section-title myday-section-title--nested">
                  Organizational Tasks
                </div>
                <div className="myday-task-card-list">
                  {organizationalActiveTasks.map((task) => (
                    <MyDayTaskCard
                      key={`org-${task.id}`}
                      task={task}
                      onToggleComplete={onTaskToggleCompleteClick}
                      onRemove={onTaskRemoveClick}
                      onEditEstimate={handleOpenEstimateModal}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {reporteeExtensions.length > 0 ? (
            <MyDayTeamSection
              planDate={planDate || today}
              managerExtension={managerExtension}
              reporteeExtensions={reporteeExtensions}
              hierarchyExtensions={hierarchyDataExtensions}
            />
          ) : null}

          {completedTasks.length > 0 ? (
            <div className="myday-table-card myday-completed-card">
              <div className="myday-section-title">
                Completed Tasks
                <span className="myday-section-count">({completedTasksCount})</span>
              </div>
              <div className="myday-task-card-list">
                {completedTasks.map((task) => (
                  <MyDayTaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={onTaskToggleCompleteClick}
                    onRemove={onTaskRemoveClick}
                    onEditEstimate={handleOpenEstimateModal}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside ref={suggestionsPanelRef} id="myday-suggestions-panel" className="myday-suggested">
          <h4>Suggested for Today</h4>
          <div className="myday-search-wrap">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={suggestedSearch}
              onChange={(e) => setSuggestedSearch(e.target.value)}
            />
          </div>
          {suggestionsLoading ? (
            <p className="myday-empty-state">Searching suggestions...</p>
          ) : null}
          <div className="myday-suggested-groups">
            {!suggestionsLoading && groupedSuggestions.length === 0 ? (
              <p className="myday-empty-state">No suggestions match your search.</p>
            ) : null}
            {groupedSuggestions.map((group) => (
              <section key={group.category} className="myday-suggested-group">
                <h5 className="myday-suggested-group__title">{group.label}</h5>
                <div className="myday-suggested-list">
                  {group.items.map((task) => (
                    <MyDaySuggestedItemButton
                      key={`${group.category}-${task.id}`}
                      task={task}
                      groupCategory={group.category}
                      inMyDay={isSuggestionInMyDay(task, myDayTaskIds)}
                      onAdd={handleSuggestedAddClick}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </aside>
      </div>

      <CreateTaskSidebar
        isOpen={showCreateSidebar}
        onClose={() => setShowCreateSidebar(false)}
        onCreate={async () => {
          setShowCreateSidebar(false);
          await refreshMyDayPage();
        }}
        extensions={hierarchyDataExtensions as any}
      />

      <Modal
        show={showEstimateModal}
        onHide={() => {
          setShowEstimateModal(false);
          setPendingEstimateTask(null);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Quick estimate</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-2">{pendingEstimateTask?.title}</div>
          <div className="d-flex flex-wrap gap-2 mb-3">
            {ESTIMATE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setEstimateInput(String(preset))}
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
            value={estimateInput}
            onChange={(e) => setEstimateInput(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              skipEstimateAndAddToMyDay().catch(() => undefined);
            }}
          >
            Skip
          </Button>
          <Button
            onClick={() => {
              confirmEstimateAndAdd().catch(() => undefined);
            }}
          >
            Add to My Day
          </Button>
        </Modal.Footer>
      </Modal>

      <MyDayHistoryModal
        show={showHistoryModal}
        todayIso={today}
        onClose={() => setShowHistoryModal(false)}
      />

      <Modal
        show={showDefaultCapacityModal}
        onHide={() => setShowDefaultCapacityModal(false)}
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
            value={defaultCapacityDraft}
            onChange={(e) => setDefaultCapacityDraft(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDefaultCapacityModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              handleSaveDefaultCapacity().catch(() => undefined);
            }}
          >
            Save default
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showScheduleLaterModal}
        onHide={() => setShowScheduleLaterModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Schedule missed tasks</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Label>Schedule for</Form.Label>
          <Form.Control
            type="date"
            min={today}
            value={scheduleLaterDate}
            onChange={(e) => setScheduleLaterDate(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowScheduleLaterModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              handleCarryOverScheduleLater();
            }}
          >
            Schedule later
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MyDayTasksPage;
