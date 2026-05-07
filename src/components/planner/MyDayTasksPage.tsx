import React, { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import { Button, Form, Modal } from "react-bootstrap";
import { Circle, CircleCheckBig, Plus, Search } from "lucide-react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { type TableColumn } from "@components/GenericTable";
import CreateTaskSidebar from "@components/CreatePlannerTaskSidebar";
import { listTasks, completeTask, incompleteTask, updateTask } from "@utils/tasks";
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
  raw: ApiTask;
};

const CAPACITY_STORAGE_KEY = "planner-settings-daily-capacity";
const ESTIMATE_REQUIRED_STORAGE_KEY = "planner-settings-require-estimate-for-my-day";
const ESTIMATE_PRESETS = [15, 30, 60, 90, 120, 180] as const;

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
  const estimate = Number(apiTask.estimated_duration_minutes ?? 0);
  return {
    id: apiTask.id,
    title: apiTask.title?.trim() || `Task #${apiTask.id}`,
    dueDate: dueRaw,
    priority: String(apiTask.priority ?? "normal"),
    isCompleted: apiTask.is_completed === true,
    estimateMinutes: Number.isFinite(estimate) && estimate > 0 ? estimate : 0,
    projectName: apiTask.project?.name?.trim() || "No project",
    isCarryOver,
    raw: apiTask,
  };
}

const MyDayTasksPage: React.FC = () => {
  const { hierarchyDataExtensions } = useHierarchyData(ModuleSlug.WORK_PLANNER);
  const [tasks, setTasks] = useState<MyDayTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [capacityMinutes, setCapacityMinutes] = useState(8 * 60);
  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [carryOverMode, setCarryOverMode] = useState<"pending" | "added" | "skipped">("pending");
  const [selectedCarryOverIds, setSelectedCarryOverIds] = useState<number[]>([]);
  const [suggestedSearch, setSuggestedSearch] = useState("");
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [estimateInput, setEstimateInput] = useState("");
  const [pendingCompleteTask, setPendingCompleteTask] = useState<MyDayTask | null>(null);

  const today = useMemo(() => moment().format("YYYY-MM-DD"), []);
  const todayStart = useMemo(() => moment().startOf("day"), []);

  const fetchMyDayTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listTasks({
        page: 1,
        limit: 200,
        due_date_to: today,
        withRelations: ["project", "assignees"],
        order: { column: "due_date", dir: "asc" },
      });
      const rawRows = (res?.data ?? []) as ApiTask[];
      const mapped = rawRows.map((row) => mapApiTaskToMyDayTask(row, todayStart));
      setTasks(mapped);
    } catch {
      toast.error("Failed to load My Day tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [today, todayStart]);

  useEffect(() => {
    if (globalThis.window === undefined) return;
    const rawCapacity = globalThis.window.localStorage.getItem(CAPACITY_STORAGE_KEY);
    const parsedHours = Number.parseInt(rawCapacity ?? "", 10);
    if (Number.isFinite(parsedHours) && parsedHours > 0) {
      setCapacityMinutes(parsedHours * 60);
    }
  }, []);

  useEffect(() => {
    fetchMyDayTasks().catch(() => undefined);
  }, [fetchMyDayTasks]);

  const carryOverTasks = useMemo(
    () => tasks.filter((t) => t.isCarryOver && !t.isCompleted),
    [tasks],
  );

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
    let planned = 0;
    let done = 0;
    for (const t of visibleTasks) {
      planned += t.estimateMinutes;
      if (t.isCompleted) done += t.estimateMinutes;
    }
    const plannedPct = Math.min(100, Math.round((planned / Math.max(1, capacityMinutes)) * 100));
    const donePct = planned > 0 ? Math.min(100, Math.round((done / planned) * 100)) : 0;
    return { planned, done, plannedPct, donePct };
  }, [capacityMinutes, visibleTasks]);

  const suggestedTasks = useMemo(() => {
    const normalized = suggestedSearch.trim().toLowerCase();
    return tasks
      .filter((t) => !t.isCompleted)
      .filter((t) => (normalized ? t.title.toLowerCase().includes(normalized) : true))
      .slice(0, 8);
  }, [suggestedSearch, tasks]);

  const toggleCarryOverSelection = useCallback((taskId: number) => {
    setSelectedCarryOverIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  }, []);

  const handleToggleComplete = useCallback(
    async (task: MyDayTask) => {
      if (task.isCompleted) {
        await incompleteTask(task.id);
        fetchMyDayTasks().catch(() => undefined);
        return;
      }
      const requireEstimate =
        globalThis.window?.localStorage.getItem(ESTIMATE_REQUIRED_STORAGE_KEY) === "true";
      if (requireEstimate && task.estimateMinutes <= 0) {
        setPendingCompleteTask(task);
        setEstimateInput("");
        setShowEstimateModal(true);
        return;
      }
      await completeTask(task.id);
      fetchMyDayTasks().catch(() => undefined);
    },
    [fetchMyDayTasks],
  );

  const confirmEstimateAndComplete = useCallback(async () => {
    if (pendingCompleteTask == null) return;
    const parsed = Number.parseInt(estimateInput.trim(), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Please add valid estimate minutes");
      return;
    }
    try {
      await updateTask(pendingCompleteTask.id, { estimated_duration_minutes: parsed });
      await completeTask(pendingCompleteTask.id);
      setShowEstimateModal(false);
      setPendingCompleteTask(null);
      setEstimateInput("");
      fetchMyDayTasks().catch(() => undefined);
    } catch {
      toast.error("Failed to update estimate");
    }
  }, [estimateInput, fetchMyDayTasks, pendingCompleteTask]);

  const columns: TableColumn<MyDayTask>[] = useMemo(
    () => [
      {
        key: "done",
        label: "",
        type: "custom",
        sortable: false,
        render: (row) => (
          <button className="myday-toggle-btn" onClick={() => void handleToggleComplete(row)}>
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
            </div>
          </div>
        ),
      },
    ],
    [handleToggleComplete],
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
                  min={60}
                  step={30}
                  value={capacityMinutes}
                  onChange={(e) => {
                    const next = Number.parseInt(e.target.value, 10);
                    if (!Number.isFinite(next) || next <= 0) return;
                    setCapacityMinutes(next);
                    if (globalThis.window !== undefined) {
                      globalThis.window.localStorage.setItem(
                        CAPACITY_STORAGE_KEY,
                        String(Math.max(1, Math.round(next / 60))),
                      );
                    }
                  }}
                />
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
                  onClick={() => {
                    setSelectedCarryOverIds(carryOverTasks.map((t) => t.id));
                    setCarryOverMode("added");
                  }}
                >
                  Sab Add Karo
                </button>
                <button type="button" onClick={() => setCarryOverMode("skipped")}>Baad Mein</button>
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
                onClick={() => void handleToggleComplete(task)}
              >
                <div className="title">{task.title}</div>
                <div className="meta">{task.projectName} • {task.priority}</div>
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
          await fetchMyDayTasks();
        }}
        extensions={hierarchyDataExtensions as any}
      />

      <Modal
        show={showEstimateModal}
        onHide={() => {
          setShowEstimateModal(false);
          setPendingCompleteTask(null);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Quick estimate</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-2">{pendingCompleteTask?.title}</div>
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
              setShowEstimateModal(false);
              setPendingCompleteTask(null);
            }}
          >
            Skip
          </Button>
          <Button onClick={() => void confirmEstimateAndComplete()}>Confirm</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MyDayTasksPage;
