import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import { Button, Form, Modal } from "react-bootstrap";
import { Circle, CircleCheckBig, Plus, Search, Trash2 } from "lucide-react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { type TableColumn } from "@components/GenericTable";
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
} from "@utils/tasks";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { ModuleSlug } from "@utils/Helper";
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

function mapApiTaskToMyDayTask(apiTask: ApiTask, todayStart: moment.Moment): MyDayTask {
  const dueRaw = apiTask.due_date ?? null;
  const dueMoment = dueRaw ? moment(dueRaw) : null;
  const isCarryOver = dueMoment?.isValid() === true && dueMoment.isBefore(todayStart, "day");
  const estimate = Number(apiTask.estimated_minutes ?? apiTask.estimated_duration_minutes ?? 0);
  return {
    id: apiTask.id,
    title: apiTask.title?.trim() || `Task #${apiTask.id}`,
    dueDate: dueRaw,
    priority: String(apiTask.priority ?? "normal"),
    isCompleted: apiTask.is_completed === true,
    estimateMinutes: Number.isFinite(estimate) && estimate > 0 ? estimate : 0,
    projectName: apiTask.project?.name?.trim() || "No project",
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

const CATEGORY_LABELS: Record<MyDaySuggestionCategory, string> = {
  overdue: "Overdue",
  due_today: "Due today",
  high_priority: "High priority",
  assigned_to_me: "Assigned to me",
  flexible_upcoming: "Flexible upcoming",
};

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
  const rolloverAckSentRef = useRef(false);

  const today = useMemo(() => moment().format("YYYY-MM-DD"), []);
  const todayStart = useMemo(() => moment().startOf("day"), []);

  const fetchMyDayData = useCallback(async () => {
    try {
      setLoading(true);
      const [preferences, taskPayload, capacityPayload, rolloverPayload, suggestionsPayload] =
        await Promise.all([
          getMyDayPreferences(),
          listMyDayTasks({ date: today }),
          getMyDayCapacity({ date: today }),
          getMyDayRollover(),
          getMyDaySuggestions({ search: suggestedSearch }),
        ]);

      const active = (taskPayload.active ?? []).map((row) =>
        mapApiTaskToMyDayTask(toApiTask(row), todayStart),
      );
      const completed = (taskPayload.completed ?? []).map((row) =>
        mapApiTaskToMyDayTask(toApiTask(row), todayStart),
      );
      setTasks([...active, ...completed]);

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

      const flattenedSuggestions: SuggestedTask[] = [];
      (Object.keys(CATEGORY_LABELS) as MyDaySuggestionCategory[]).forEach((category) => {
        const rows = suggestionsPayload[category];
        if (!Array.isArray(rows)) return;
        rows.forEach((row) => {
          const mapped = mapApiTaskToMyDayTask(toApiTask(row), todayStart);
          flattenedSuggestions.push({
            ...mapped,
            category,
            categoryLabel: CATEGORY_LABELS[category],
          });
        });
      });
      setSuggestedTasks(flattenedSuggestions);
    } catch {
      toast.error("Failed to load My Day tasks");
      setTasks([]);
      setSuggestedTasks([]);
      setRolloverTasks([]);
      setRolloverShowPrompt(false);
    } finally {
      setLoading(false);
    }
  }, [suggestedSearch, today, todayStart]);

  useEffect(() => {
    fetchMyDayData().catch(() => undefined);
  }, [fetchMyDayData]);

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
    const planned = plannedMinutes;
    const done = completedMinutes;
    const plannedPct = Math.min(100, Math.round((planned / Math.max(1, capacityMinutes)) * 100));
    const donePct = planned > 0 ? Math.min(100, Math.round((done / planned) * 100)) : 0;
    return { planned, done, plannedPct, donePct };
  }, [capacityMinutes, completedMinutes, plannedMinutes]);

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
      fetchMyDayData().catch(() => undefined);
    },
    [fetchMyDayData],
  );

  const confirmEstimateAndAdd = useCallback(async () => {
    if (pendingEstimateTask == null) return;
    const parsed = Number.parseInt(estimateInput.trim(), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Please add valid estimate minutes");
      return;
    }
    try {
      await addTaskToMyDay({
        task_id: pendingEstimateTask.id,
        plan_date: today,
        estimated_minutes: parsed,
      });
      setShowEstimateModal(false);
      setPendingEstimateTask(null);
      setEstimateInput("");
      fetchMyDayData().catch(() => undefined);
    } catch {
      toast.error("Failed to add task to My Day");
    }
  }, [estimateInput, fetchMyDayData, pendingEstimateTask, today]);

  const handleRemoveFromMyDay = useCallback(
    async (taskId: number) => {
      try {
        await removeTaskFromMyDay(taskId, { plan_date: today });
        fetchMyDayData().catch(() => undefined);
      } catch {
        toast.error("Failed to remove task from My Day");
      }
    },
    [fetchMyDayData, today],
  );

  const handleAddSuggestedTask = useCallback(
    async (task: SuggestedTask) => {
      if (task.alreadyInMyDay) return;
      // Spec §3.6: no estimate → prompt before add (unestimated still allowed via Skip).
      if (task.estimateMinutes <= 0) {
        setPendingEstimateTask(task);
        setEstimateInput("");
        setShowEstimateModal(true);
        return;
      }
      try {
        await addTaskToMyDay({ task_id: task.id, plan_date: today });
        fetchMyDayData().catch(() => undefined);
      } catch {
        toast.error("Failed to add task to My Day");
      }
    },
    [fetchMyDayData, today],
  );

  const skipEstimateAndAddToMyDay = useCallback(async () => {
    if (pendingEstimateTask == null) return;
    try {
      await addTaskToMyDay({
        task_id: pendingEstimateTask.id,
        plan_date: today,
      });
      setShowEstimateModal(false);
      setPendingEstimateTask(null);
      setEstimateInput("");
      fetchMyDayData().catch(() => undefined);
    } catch {
      toast.error("Failed to add task to My Day");
    }
  }, [fetchMyDayData, pendingEstimateTask, today]);

  const handleSaveCapacity = useCallback(async () => {
    try {
      const parsed = Math.max(1, Math.min(1440, Math.floor(capacityMinutes)));
      await overrideMyDayCapacity({ minutes: parsed, for_date: today });
      fetchMyDayData().catch(() => undefined);
    } catch {
      toast.error("Failed to override capacity");
    }
  }, [capacityMinutes, fetchMyDayData, today]);

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

  const columns: TableColumn<MyDayTask>[] = useMemo(
    () => [
      {
        key: "done",
        label: "",
        type: "custom",
        sortable: false,
        render: (row) => (
          <button
            className="myday-toggle-btn"
            onClick={() => onTaskToggleCompleteClick(row)}
          >
            {row.isCompleted ? <CircleCheckBig size={18} /> : <Circle size={18} />}
          </button>
        ),
      },
      {
        key: "title",
        label: "Task",
        type: "custom",
        sortable: false,
        render: (row) => (
          <div className={`myday-task-cell ${row.isCompleted ? "is-completed" : ""}`}>
            <div className="myday-task-title">{row.title}</div>
            <div className="myday-task-meta">
              <span>{row.projectName}</span>
              <span className={`priority-${row.priority.toLowerCase()}`}>{row.priority}</span>
              <span>{row.dueDate ? moment(row.dueDate).format("MMM D") : "No due date"}</span>
              <span>{row.estimateMinutes > 0 ? `${row.estimateMinutes}m` : "No estimate"}</span>
              {!row.isCompleted && (
                <button
                  type="button"
                  className="myday-toggle-btn"
                  title="Remove from My Day"
                  onClick={() => onTaskRemoveClick(row.id)}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        ),
      },
    ],
    [onTaskRemoveClick, onTaskToggleCompleteClick],
  );

  return (
    <div className="myday-page-shell">
      <BreadcrumbItem mainTitle="Planner" mainLink="/planner/dashboard" subTitle="My Day" />
      <div className="myday-layout">
        <div className="myday-main">
          <div className="myday-header">
            <div>
              <h2>My Day</h2>
              <p>{activeTasks.length} active • {completedTasks.length} completed</p>
            </div>
            <Button size="sm" onClick={() => setShowCreateSidebar(true)}>
              <Plus size={14} className="me-1" /> Add Task
            </Button>
          </div>

          <div className="myday-capacity-card">
            <div className="myday-capacity-top">
              <div className="myday-capacity-title">
                <strong>{toMinutesDisplay(summary.done)}</strong> / {toMinutesDisplay(capacityMinutes)}
              </div>
              <div className="myday-capacity-input">
                <span>Capacity</span>
                <input
                  type="number"
                  min={1}
                  value={capacityMinutes}
                  onChange={(e) => {
                    const next = Number.parseInt(e.target.value, 10);
                    if (!Number.isFinite(next) || next <= 0) return;
                    setCapacityMinutes(next);
                  }}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    handleSaveCapacity().catch(() => undefined);
                  }}
                >
                  Save
                </button>
              </div>
            </div>
            <div className="myday-progress-track">
              <div className="myday-progress-fill planned" style={{ width: `${summary.plannedPct}%` }} />
            </div>
            <div className="myday-progress-track">
              <div className="myday-progress-fill done" style={{ width: `${summary.donePct}%` }} />
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
                      return fetchMyDayData();
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
                    }).then(() => fetchMyDayData()).catch(() => undefined);
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          )}

          <div className="myday-table-card">
            <div className="myday-section-title">Active Tasks</div>
            <GenericTable
              data={activeTasks}
              columns={columns}
              showActions={false}
              loading={loading}
              emptyMessage="No active tasks in My Day"
              loadingMessage="Loading My Day tasks..."
              hover
              uniqueKey="id"
            />
          </div>

          <div className="myday-table-card myday-completed-card">
            <div className="myday-section-title">Completed Tasks</div>
            <GenericTable
              data={completedTasks}
              columns={columns}
              showActions={false}
              loading={false}
              emptyMessage="No completed tasks yet"
              loadingMessage="Loading completed tasks..."
              hover
              uniqueKey="id"
            />
          </div>
        </div>

        <aside className="myday-suggested">
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
          <div className="myday-suggested-list">
            {suggestedTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                className="myday-suggested-item"
                disabled={task.alreadyInMyDay}
                onClick={() => {
                  handleAddSuggestedTask(task).catch(() => undefined);
                }}
              >
                <div className="title">{task.title}</div>
                <div className="meta">
                  {task.categoryLabel} • {task.projectName} • {task.priority}
                  {task.alreadyInMyDay ? " • Added" : ""}
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>

      <CreateTaskSidebar
        isOpen={showCreateSidebar}
        onClose={() => setShowCreateSidebar(false)}
        onCreate={async () => {
          setShowCreateSidebar(false);
          await fetchMyDayData();
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
    </div>
  );
};

export default MyDayTasksPage;
