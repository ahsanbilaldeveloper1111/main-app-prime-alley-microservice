import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import { Button, Form, Modal } from "react-bootstrap";
import { Circle, CircleCheckBig, History, Pencil, Plus, Search, X } from "lucide-react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import CreateTaskSidebar from "@components/CreatePlannerTaskSidebar";
import {
  ackMyDayRolloverPrompt,
  addTaskToMyDay,
  getMyDayCapacity,
  getMyDayPreferences,
  getMyDayRollover,
  getMyDaySuggestions,
  listMyDayTasks,
  overrideMyDayCapacity,
  removeTaskFromMyDay,
  submitMyDayRolloverAction,
  toggleMyDayTaskComplete,
  type MyDaySuggestionCategory,
  type MyDaySuggestionsPayload,
  type MyDayTasksMeta,
} from "@utils/tasks";
import { MyDayHistoryModal } from "@components/planner/MyDayHistoryModal";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { formatDateGlobal, ModuleSlug } from "@utils/Helper";
import "@assets/scss/my-day-tasks.scss";
import { toast } from "react-toastify";

type ApiTask = {
  id: number;
  title?: string;
  due_date?: string | null;
  priority?: string | null;
  is_completed?: boolean;
  estimated_duration_minutes?: number | null;
  project?: { name?: string | null } | null;
  estimated_minutes?: number | null;
  already_in_my_day?: boolean;
};

type MyDayTask = {
  id: number;
  title: string;
  dueDate: string | null;
  priority: string;
  isCompleted: boolean;
  estimateMinutes: number;
  projectName: string;
  isPersonalTask: boolean;
  isFlexibleTask: boolean;
  isCarryOver: boolean;
  alreadyInMyDay?: boolean;
  raw: ApiTask;
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

function toMinutesDisplay(totalMinutes: number): string {
  const m = Math.max(0, totalMinutes);
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h > 0 && rem > 0) return `${h}h ${rem}m`;
  if (h > 0) return `${h}h`;
  return `${rem}m`;
}

function formatMyDayHeaderMetaLine(taskCount: number, usedMinutes: number): string {
  const taskPart = taskCount === 1 ? "1 task planned" : `${taskCount} tasks planned`;
  return `${taskPart} · ${toMinutesDisplay(usedMinutes)} capacity used`;
}

function resolveMyDayTaskCount(tasks: MyDayTask[], meta: MyDayTasksMeta): number {
  if (meta.active_count != null && meta.completed_count != null) {
    return meta.active_count + meta.completed_count;
  }
  return tasks.length;
}

function resolveMyDayCapacityUsedMinutes(tasks: MyDayTask[], plannedMinutes: number): number {
  const fromEstimates = tasks.reduce(
    (sum, task) => sum + (task.estimateMinutes > 0 ? task.estimateMinutes : 0),
    0,
  );
  if (fromEstimates > 0) return fromEstimates;
  return plannedMinutes > 0 ? plannedMinutes : 0;
}

function isFlexibleTaskRow(
  row: Record<string, unknown>,
  category?: MyDaySuggestionCategory,
): boolean {
  if (category === "flexible_upcoming") return true;
  return row.is_flexible === true || row.flexible === true || row.is_flexible_task === true;
}

function isSuggestionInMyDay(task: SuggestedTask, myDayTaskIds: ReadonlySet<number>): boolean {
  return myDayTaskIds.has(task.id) || task.alreadyInMyDay === true;
}

function resolveEstimateMinutesFromRow(row: Record<string, unknown>): number {
  const candidates = [
    row.estimated_minutes,
    row.estimated_duration_minutes,
    row.my_day_estimated_minutes,
    row.plan_estimated_minutes,
    row.estimate_minutes,
    row.duration_minutes,
  ];
  for (const value of candidates) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return Math.round(parsed);
  }
  const hours = Number(row.estimated_hours);
  if (Number.isFinite(hours) && hours > 0) return Math.round(hours * 60);
  return 0;
}

function resolveProjectFromRow(row: Record<string, unknown>): { label: string; isPersonal: boolean } {
  const project = row.project;
  if (project != null && typeof project === "object") {
    const name = (project as { name?: string | null }).name?.trim();
    if (name) return { label: name, isPersonal: false };
  }
  const projectName = typeof row.project_name === "string" ? row.project_name.trim() : "";
  if (projectName) return { label: projectName, isPersonal: false };
  return { label: "Personal Task", isPersonal: true };
}

function parseCapacityDurationInput(value: string): number | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    const minutes = Number.parseInt(trimmed, 10);
    return minutes > 0 ? minutes : null;
  }
  let total = 0;
  const hourMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*h/);
  const minuteMatch = trimmed.match(/(\d+)\s*m/);
  if (hourMatch) total += Math.round(Number(hourMatch[1]) * 60);
  if (minuteMatch) total += Number.parseInt(minuteMatch[1], 10);
  return total > 0 ? total : null;
}

function formatCapacityDurationInput(totalMinutes: number): string {
  return toMinutesDisplay(totalMinutes);
}

type CapacityFillTone = "low" | "medium" | "high";

function getCapacityFillTone(usagePct: number): CapacityFillTone {
  if (usagePct >= 100) return "high";
  if (usagePct >= 75) return "medium";
  return "low";
}

function mapApiTaskToMyDayTask(
  apiTask: ApiTask,
  todayStart: moment.Moment,
  category?: MyDaySuggestionCategory,
): MyDayTask {
  const dueRaw = apiTask.due_date ?? null;
  const dueMoment = dueRaw ? moment(dueRaw) : null;
  const isCarryOver = dueMoment?.isValid() === true && dueMoment.isBefore(todayStart, "day");
  const row = apiTask as unknown as Record<string, unknown>;
  const estimate = resolveEstimateMinutesFromRow(row);
  const project = resolveProjectFromRow(row);
  return {
    id: apiTask.id,
    title: apiTask.title?.trim() || `Task #${apiTask.id}`,
    dueDate: dueRaw,
    priority: String(apiTask.priority ?? "normal"),
    isCompleted: apiTask.is_completed === true,
    estimateMinutes: estimate,
    projectName: project.label,
    isPersonalTask: project.isPersonal,
    isFlexibleTask: isFlexibleTaskRow(row, category),
    isCarryOver,
    alreadyInMyDay: apiTask.already_in_my_day === true,
    raw: apiTask,
  };
}

function toApiTask(input: unknown): ApiTask {
  if (input == null || typeof input !== "object") return { id: 0 };
  const row = input as Record<string, unknown>;
  let dueDateValue: string | null = null;
  if (typeof row.due_date === "string") {
    dueDateValue = row.due_date;
  } else if (typeof row.end_date === "string") {
    dueDateValue = row.end_date;
  }
  return {
    id: Number(row.id ?? 0),
    title: typeof row.title === "string" ? row.title : undefined,
    due_date: dueDateValue,
    priority: typeof row.priority === "string" ? row.priority : null,
    is_completed: row.is_completed === true,
    estimated_duration_minutes:
      typeof row.estimated_duration_minutes === "number"
        ? row.estimated_duration_minutes
        : null,
    estimated_minutes: typeof row.estimated_minutes === "number" ? row.estimated_minutes : null,
    already_in_my_day: row.already_in_my_day === true,
    project:
      row.project != null && typeof row.project === "object"
        ? (row.project as { name?: string | null })
        : null,
  };
}

const SUGGESTION_CATEGORY_ORDER: MyDaySuggestionCategory[] = [
  "overdue",
  "due_today",
  "high_priority",
  "assigned_to_me",
  "organizational_tasks",
  "personal_tasks",
  "flexible_upcoming",
];

const CATEGORY_LABELS: Record<MyDaySuggestionCategory, string> = {
  overdue: "Overdue",
  due_today: "Due Today",
  high_priority: "High Priority",
  assigned_to_me: "Assigned to Me",
  organizational_tasks: "Organizational Tasks",
  personal_tasks: "Personal Tasks",
  flexible_upcoming: "Flexible Upcoming",
};

function collectSuggestionCategories(payload: MyDaySuggestionsPayload): MyDaySuggestionCategory[] {
  const seen = new Set<string>();
  const ordered: MyDaySuggestionCategory[] = [];
  for (const category of SUGGESTION_CATEGORY_ORDER) {
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
              }`}
            >
              {task.projectName}
            </span>
            <span className={`myday-tag myday-tag--priority priority-${priorityKey}`}>
              {task.priority}
            </span>
            {task.isFlexibleTask ? (
              <span className="myday-tag myday-tag--flexible">Flexible Task</span>
            ) : null}
            {task.estimateMinutes > 0 ? (
              <span className="myday-tag myday-tag--estimate">
                {toMinutesDisplay(task.estimateMinutes)}
              </span>
            ) : !task.isCompleted && onEditEstimate ? (
              <button
                type="button"
                className="myday-edit-estimate-btn"
                onClick={() => onEditEstimate(task)}
              >
                Edit Estimate
              </button>
            ) : (
              <span className="myday-tag myday-tag--estimate">No estimate</span>
            )}
          </div>
        </div>
      </div>
      {!task.isCompleted ? (
        <button
          type="button"
          className="myday-task-card__remove"
          aria-label="Remove from My Day"
          onClick={() => onRemove(task.id)}
        >
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}

const MyDayTasksPage: React.FC = () => {
  const { hierarchyDataExtensions } = useHierarchyData(ModuleSlug.WORK_PLANNER);
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
  const [completedMinutes, setCompletedMinutes] = useState(0);
  const [rolloverShowPrompt, setRolloverShowPrompt] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [planDate, setPlanDate] = useState("");
  const [tasksMeta, setTasksMeta] = useState<MyDayTasksMeta>({});
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);
  const [capacityDraft, setCapacityDraft] = useState("");
  const [debouncedSuggestedSearch, setDebouncedSuggestedSearch] = useState("");
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
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
        const categoryLabel = CATEGORY_LABELS[category] ?? category.replaceAll("_", " ");
        rows.forEach((row) => {
          const mapped = mapApiTaskToMyDayTask(toApiTask(row), todayStart, category);
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
        const suggestionsPayload = await getMyDaySuggestions({ search });
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

  const fetchCoreMyDayData = useCallback(async () => {
    try {
      setLoading(true);
      const [preferences, taskPayload, capacityPayload, rolloverPayload] = await Promise.all([
        getMyDayPreferences(),
        listMyDayTasks({ date: today }),
        getMyDayCapacity({ date: today }),
        getMyDayRollover(),
      ]);

      const active = (taskPayload.active ?? []).map((row) =>
        mapApiTaskToMyDayTask(toApiTask(row), todayStart),
      );
      const completed = (taskPayload.completed ?? []).map((row) =>
        mapApiTaskToMyDayTask(toApiTask(row), todayStart),
      );
      setTasks([...active, ...completed]);
      setPlanDate(taskPayload.plan_date ?? today);
      setTasksMeta(taskPayload.meta ?? {});

      const defaultCapacity = Number(preferences.daily_capacity_minutes ?? 0);
      const effectiveCapacity = Number(capacityPayload.effective_capacity_minutes ?? 0);
      const resolvedCapacity = effectiveCapacity || defaultCapacity || 8 * 60;
      setCapacityMinutes(resolvedCapacity);
      setPlannedMinutes(
        Number(capacityPayload.planned_minutes ?? taskPayload.meta?.planned_minutes ?? 0),
      );
      setCompletedMinutes(
        Number(capacityPayload.completed_minutes ?? taskPayload.meta?.completed_minutes ?? 0),
      );

      const rollover = (rolloverPayload.tasks ?? []).map((row) =>
        mapApiTaskToMyDayTask(toApiTask(row), todayStart),
      );
      setRolloverTasks(rollover);
      setRolloverShowPrompt(rolloverPayload.show_rollover_prompt === true);
    } catch {
      toast.error("Failed to load My Day tasks");
      setTasks([]);
      setRolloverTasks([]);
      setRolloverShowPrompt(false);
    } finally {
      setLoading(false);
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
    void ackMyDayRolloverPrompt().catch(() => {
      rolloverAckSentRef.current = false;
    });
  }, [rolloverShowPrompt, carryOverTasks.length, carryOverMode]);

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

  const completedTasks = useMemo(
    () => visibleTasks.filter((task) => task.isCompleted),
    [visibleTasks],
  );

  const summary = useMemo(() => {
    const planned = resolveMyDayCapacityUsedMinutes(tasks, plannedMinutes);
    const plannedPct = Math.min(100, Math.round((planned / Math.max(1, capacityMinutes)) * 100));
    const capacityTone = getCapacityFillTone(plannedPct);
    return { planned, plannedPct, capacityTone };
  }, [capacityMinutes, plannedMinutes, tasks]);

  const groupedSuggestions = useMemo(() => {
    const byCategory = new Map<MyDaySuggestionCategory, SuggestedTask[]>();
    for (const task of suggestedTasks) {
      const bucket = byCategory.get(task.category) ?? [];
      bucket.push(task);
      byCategory.set(task.category, bucket);
    }
    const groups: { category: MyDaySuggestionCategory; label: string; items: SuggestedTask[] }[] =
      [];
    for (const category of SUGGESTION_CATEGORY_ORDER) {
      const items = byCategory.get(category);
      if (!items?.length) continue;
      groups.push({
        category,
        label: CATEGORY_LABELS[category] ?? category.replaceAll("_", " "),
        items,
      });
      byCategory.delete(category);
    }
    for (const [category, items] of byCategory.entries()) {
      if (!items.length) continue;
      groups.push({
        category,
        label: CATEGORY_LABELS[category] ?? category.replaceAll("_", " "),
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
    const taskCount = resolveMyDayTaskCount(tasks, tasksMeta);
    const usedMinutes = resolveMyDayCapacityUsedMinutes(tasks, plannedMinutes);
    return formatMyDayHeaderMetaLine(taskCount, usedMinutes);
  }, [plannedMinutes, tasks, tasksMeta]);

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
        active_count: prev.active_count != null ? prev.active_count + 1 : prev.active_count,
      }));
    }
    setSuggestedTasks((prev) =>
      prev.map((row) => (row.id === task.id ? { ...row, alreadyInMyDay: true } : row)),
    );
  }, []);

  const applyOptimisticMyDayRemove = useCallback((taskId: number) => {
    setTasks((prev) => {
      const removed = prev.find((row) => row.id === taskId);
      if (!removed) return prev;

      const minutes = removed.estimateMinutes > 0 ? removed.estimateMinutes : 0;
      if (minutes > 0) {
        setPlannedMinutes((planned) => Math.max(0, planned - minutes));
        setTasksMeta((meta) => ({
          ...meta,
          planned_minutes:
            meta.planned_minutes != null
              ? Math.max(0, meta.planned_minutes - minutes)
              : meta.planned_minutes,
        }));
      }
      setTasksMeta((meta) => ({
        ...meta,
        active_count:
          !removed.isCompleted && meta.active_count != null
            ? Math.max(0, meta.active_count - 1)
            : meta.active_count,
        completed_count:
          removed.isCompleted && meta.completed_count != null
            ? Math.max(0, meta.completed_count - 1)
            : meta.completed_count,
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

      if (alreadyOnMyDay) {
        const previousMinutes = pendingEstimateTask.estimateMinutes;
        const delta = parsed - previousMinutes;
        setTasks((prev) =>
          prev.map((row) =>
            row.id === pendingEstimateTask.id ? { ...row, estimateMinutes: parsed } : row,
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
        applyOptimisticMyDayAdd(pendingEstimateTask, parsed);
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
        applyOptimisticMyDayAdd(task, task.estimateMinutes);
        refreshMyDayPage().catch(() => undefined);
      } catch {
        toast.error("Failed to add task to My Day");
      }
    },
    [applyOptimisticMyDayAdd, handleOpenEstimateModal, refreshMyDayPage, myDayTaskIds, today],
  );

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
        await overrideMyDayCapacity({ minutes: parsed, for_date: today });
        setCapacityMinutes(parsed);
        setIsEditingCapacity(false);
        refreshMyDayPage().catch(() => undefined);
      } catch {
        toast.error("Failed to override capacity");
      }
    },
    [capacityMinutes, refreshMyDayPage, today],
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
                style={{ width: `${summary.plannedPct}%` }}
              />
              <span className="myday-capacity-pct">{summary.plannedPct}%</span>
            </div>
          </div>

          {carryOverTasks.length > 0 && carryOverMode === "pending" && (
            <div className="myday-carry-card">
              <h4>Kal ke incomplete tasks</h4>
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
                <button type="button" onClick={() => setCarryOverMode("added")}>Selected Add Karo</button>
                <button
                  type="button"
                  onClick={() => setSelectedCarryOverIds(carryOverTasks.map((t) => t.id))}
                >
                  Sab Select Karo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    submitMyDayRolloverAction({
                      task_ids: selectedCarryOverIds,
                      action: "dismiss",
                    }).then(() => {
                      setCarryOverMode("skipped");
                      return refreshMyDayPage();
                    }).catch(() => undefined);
                  }}
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => {
                    submitMyDayRolloverAction({
                      task_ids: selectedCarryOverIds,
                      action: "today",
                    }).then(() => refreshMyDayPage()).catch(() => undefined);
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          )}

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
              <p className="myday-empty-state">No active tasks in My Day</p>
            ) : null}
            <div className="myday-task-card-list">
              {activeTasks.map((task) => (
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

          {completedTasks.length > 0 ? (
            <div className="myday-table-card myday-completed-card">
              <div className="myday-section-title">Completed Tasks</div>
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
                  {group.items.map((task) => {
                    const inMyDay = isSuggestionInMyDay(task, myDayTaskIds);
                    return (
                      <button
                        key={`${group.category}-${task.id}`}
                        type="button"
                        className={`myday-suggested-item ${inMyDay ? "is-added" : ""}`}
                        disabled={inMyDay}
                        onClick={() => {
                          handleAddSuggestedTask(task).catch(() => undefined);
                        }}
                      >
                        <div className="title">{task.title}</div>
                        <div className="meta">
                          <span
                            className={`myday-tag myday-tag--project ${
                              task.isPersonalTask ? "myday-tag--personal" : ""
                            }`}
                          >
                            {task.projectName}
                          </span>
                          <span
                            className={`myday-tag myday-tag--priority priority-${task.priority.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            {task.priority}
                          </span>
                          {task.isFlexibleTask ? (
                            <span className="myday-tag myday-tag--flexible">Flexible Task</span>
                          ) : null}
                          <span className="myday-tag myday-tag--estimate">
                            {task.estimateMinutes > 0
                              ? toMinutesDisplay(task.estimateMinutes)
                              : "No estimate"}
                          </span>
                          {inMyDay ? <span className="myday-added-label">Added</span> : null}
                        </div>
                      </button>
                    );
                  })}
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
    </div>
  );
};

export default MyDayTasksPage;
