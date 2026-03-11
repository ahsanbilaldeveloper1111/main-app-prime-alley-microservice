import React, { ReactElement, useState, useEffect, useCallback, useMemo, useRef } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Button, Modal, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import moment from "moment";
import { FiSearch } from "react-icons/fi";
import { Plus, X, ChevronDown, ExternalLink, Save, Filter } from "lucide-react";
import GenericTable, { TableColumn, TableAction, FilterPill } from "@components/GenericTable";
import GenericFilterSidebar, { FilterField } from "@components/GenericFilterSidebar";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import CreateTaskSidebar from "@components/CreatePlannerTaskSidebar";
import {
  listTasks,
  listProjects,
  deleteTask as deleteTaskApi,
  completeTask,
  incompleteTask,
} from "@utils/tasks";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { ModuleSlug } from "@utils/Helper";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Task {
  id: number;
  title: string;
  task_type: string;
  assigned_to: string | null;
  assigned_to_name?: string;
  priority: "low" | "medium" | "high" | null;
  due_date: string | null;
  notes: string | null;
  repeat_status: string | null;
  status: "pending" | "completed" | "overdue";
  rawData?: any;
}

interface ApiTask {
  id: number;
  task_id?: string;
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
  due_time?: string;
  project?: { id: number; name: string } | null;
  status?: { id: number; name: string } | null;
  assignees?: Array<{ extension_number: string }>;
  is_completed?: boolean;
  type?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TASK_TYPE_OPTIONS = [
  { value: "regular", label: "Regular" },
  { value: "todo", label: "To-do" },
  { value: "recurring", label: "Recurring" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const STATUS_OPTIONS = [
  { value: "All Status", label: "All Status" },
  { value: "To Do", label: "To Do" },
  { value: "In Progress", label: "In Progress" },
  { value: "In Review", label: "In Review" },
  { value: "Overdue", label: "Overdue" },
  { value: "Completed", label: "Completed" },
];

const PRIORITY_COLOR: Record<string, string> = {
  low: "#22c55e",
  normal: "#f59e0b",
  high: "#ef4444",
  urgent: "#ef4444",
};

const INITIAL_FILTER_FORM = {
  task_type: null as any,
  priority: null as any,
  assigned_to: null as string | null,
  due_date_from: "",
  due_date_to: "",
  project: "All Projects",
  assignee: [] as string[],
  status: "All Status",
};

const TOTAL_VIEWS = 6;

const POSSIBLE_TABS = [
  { id: "all", label: "All" },
  { id: "due_today", label: "Due today" },
  { id: "overdue", label: "Overdue" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "pending", label: "Pending" },
] as const;

const DEFAULT_VISIBLE_TAB_IDS = ["all", "due_today", "overdue", "upcoming"];
const SAVED_VIEW_STORAGE_KEY = "planner_tasks_visible_tabs";

function getInitialVisibleTabIds(): string[] {
  if (typeof window === "undefined") return [...DEFAULT_VISIBLE_TAB_IDS];
  try {
    const raw = localStorage.getItem(SAVED_VIEW_STORAGE_KEY);
    if (!raw) return [...DEFAULT_VISIBLE_TAB_IDS];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_VISIBLE_TAB_IDS];
    const validIds = POSSIBLE_TABS.map((t) => t.id);
    const filtered = (parsed as string[]).filter((id) => validIds.includes(id as any));
    return filtered.length > 0 ? filtered : [...DEFAULT_VISIBLE_TAB_IDS];
  } catch {
    return [...DEFAULT_VISIBLE_TAB_IDS];
  }
}

const BTN_BASE: React.CSSProperties = {
  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
  fontSize: 12,
  fontWeight: 400,
  borderRadius: 4,
  border: "1px solid #8a8a8a",
  padding: "8px 16px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  whiteSpace: "nowrap",
  outline: "none",
  backgroundColor: "#fff",
  color: "#141414",
};

const CELL_STYLE: React.CSSProperties = {
  fontSize: 13,
  color: "#374151",
  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
  fontWeight: 300,
};

// ─── Component ─────────────────────────────────────────────────────────────────
  
  const TasksListingPage = () => {
    const router = useRouter();
    const { hierarchyDataExtensions } = useHierarchyData(ModuleSlug.USER_DIRECTORY);

    // Map API task to UI Task (uses hierarchy for assignee names)
    const mapApiTaskToTask = useCallback((apiTask: ApiTask): Task => {
      const priorityMap: Record<string, "low" | "medium" | "high"> = {
        low: "low",
        normal: "medium",
        high: "high",
        urgent: "high",
      };
      const p = (apiTask.priority || "normal").toLowerCase();
      const priority = priorityMap[p] ?? "medium";

      const findExtensionName = (extNumber: string): string => {
        if (!extNumber || !hierarchyDataExtensions) return extNumber;
        const ext = (hierarchyDataExtensions as any[]).find(
          (e: any) => e.id === extNumber || e.extension_number === extNumber
        );
        return ext?.name || extNumber;
      };

      const assignees = apiTask.assignees || [];
      const firstExt = assignees[0]?.extension_number;
      const assigned_to = firstExt || null;
      const assigned_to_name = firstExt ? findExtensionName(firstExt) : undefined;

      const dueDate = apiTask.due_date
        ? (apiTask.due_time
            ? `${apiTask.due_date}T${apiTask.due_time}`
            : apiTask.due_date)
        : null;

      const isCompleted = apiTask.is_completed === true;
      const dueMoment = dueDate ? moment(dueDate) : null;
      const isOverdue = dueMoment && dueMoment.isBefore(moment(), "day") && !isCompleted;
      const status: Task["status"] = isCompleted ? "completed" : isOverdue ? "overdue" : "pending";

      const taskTypeMap: Record<string, string> = {
        todo: "todo",
        regular: "regular",
        recurring: "recurring",
      };
      const task_type = taskTypeMap[apiTask.type || ""] || "todo";

      return {
        id: apiTask.id,
        title: apiTask.title || "",
        task_type,
        assigned_to,
        assigned_to_name,
        priority,
        due_date: dueDate,
        notes: apiTask.description?.replace(/<[^>]*>/g, "") || null,
        repeat_status: apiTask.type === "recurring" ? "repeat" : "no_repeat",
        status,
        rawData: apiTask,
      };
    }, [hierarchyDataExtensions]);

    // Assignee options for CreateTaskSidebar
    const assigneeOptions = useMemo(() => {
      if (!hierarchyDataExtensions || !Array.isArray(hierarchyDataExtensions)) return [];
      return (hierarchyDataExtensions as any[]).map((ext: any) => ({
        value: ext.extension_number || ext.id || "",
        label: ext.name || ext.extension_number || ext.id || "Unknown",
      }));
    }, [hierarchyDataExtensions]);

    // ── Tab state ─────────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState("all");
    const [visibleTabIds, setVisibleTabIds] = useState<string[]>(() => [...DEFAULT_VISIBLE_TAB_IDS]);
    const [showAddViewModal, setShowAddViewModal] = useState(false);

    useEffect(() => {
      setVisibleTabIds(getInitialVisibleTabIds());
    }, []);

    const allTabs = useMemo(
      () => POSSIBLE_TABS.filter((t) => visibleTabIds.includes(t.id)),
      [visibleTabIds]
    );

    // If current active tab was hidden, switch to first visible
    useEffect(() => {
      if (visibleTabIds.length > 0 && !visibleTabIds.includes(activeTab)) {
        setActiveTab(visibleTabIds[0]);
        router.push(
          { pathname: router.pathname, query: { ...router.query, tab: visibleTabIds[0] } },
          undefined,
          { shallow: true }
        );
      }
    }, [visibleTabIds, activeTab, router]);

    useEffect(() => {
      if (router.isReady && router.query.tab) {
        const t = String(router.query.tab);
        if (["all", "due_today", "overdue", "upcoming", "completed", "pending"].includes(t)) setActiveTab(t);
      }
    }, [router.isReady, router.query.tab]);
  
    const switchTab = useCallback((id: string) => {
      setActiveTab(id);
      setPager(p => ({ ...p, page: 1 }));
      router.push({ pathname: router.pathname, query: { ...router.query, tab: id } }, undefined, { shallow: true });
    }, [router]);
  
    // ── Data ──────────────────────────────────────────────────────────────────────
    const [tasks, setTasks]           = useState<Task[]>([]);
    const [total, setTotal]           = useState(0);
    const [loading, setLoading]       = useState(false);
    const [filters, setFilters]       = useState<Record<string, any>>({});
    const [search, setSearch]         = useState("");
    const [hoveredId, setHoveredId]   = useState<number | null>(null);
  
    const [pager, setPager] = useState({
      page: 1, perPage: 25,
      sortCol: "due_date", sortDir: "asc" as "asc" | "desc",
    });
  
    // ── Filter sidebar ────────────────────────────────────────────────────────────
    const [showSidebar, setShowSidebar]   = useState(false);
    const [allProjects, setAllProjects]  = useState<Array<{ id: number; name: string }>>([]);
    const [fForm, setFForm] = useState(INITIAL_FILTER_FORM);
  
    // ── Create/edit task sidebar ──────────────────────────────────────────────────
    const [showCreate, setShowCreate]   = useState(false);
    const [editId, setEditId]           = useState<number | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
  
    // ── Delete confirmation ──────────────────────────────────────────────────────
    const [showDelete, setShowDelete] = useState(false);
    const [toDelete, setToDelete] = useState<Task | null>(null);

    const tasksRef = useRef<Task[]>([]);
    useEffect(() => { tasksRef.current = tasks; }, [tasks]);

    // Fetch projects for filter and sidebar
    useEffect(() => {
      const load = async () => {
        try {
          const res = await listProjects({ page: 1, limit: 100 });
          if (res?.success === true && Array.isArray(res.data)) {
            const list = res.data.map((p: any) => ({ id: p.id, name: p.name }));
            setAllProjects(list);
          }
        } catch {
          // ignore
        }
      };
      load();
    }, []);

    // ── Fetch ─────────────────────────────────────────────────────────────────────
    const fetchTasks = useCallback(async () => {
      setLoading(true);
      try {
        const today = moment().format("YYYY-MM-DD");
        const yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");
        const tomorrow = moment().add(1, "day").format("YYYY-MM-DD");

        const params: any = {
          page: pager.page,
          limit: pager.perPage,
          search: filters.search || undefined,
          order: { column: pager.sortCol === "due_date" ? "due_date" : "created_at", dir: pager.sortDir },
          withRelations: ["project", "status", "assignees"],
        };

        if (filters.priority) {
          const priorityMap: Record<string, string> = { low: "low", medium: "normal", high: "high" };
          params.priority = priorityMap[String(filters.priority)] || "normal";
        }
        if (filters.due_date_from) params.due_date_from = filters.due_date_from;
        if (filters.due_date_to) params.due_date_to = filters.due_date_to;
        if (filters.project && filters.project !== "All Projects") {
          const proj = allProjects.find(p => p.name === filters.project);
          if (proj) params.project_id = proj.id;
        }
        if (filters.assignee?.length) params.extension_numbers = filters.assignee;
        if (filters.status && filters.status !== "All Status") {
          const statusId = tasksRef.current.find(t => t.rawData?.status?.name === filters.status)?.rawData?.status?.id;
          if (statusId) params.status_id = statusId;
        }

        if (activeTab === "due_today") {
          params.due_date_from = today;
          params.due_date_to = today;
        } else if (activeTab === "overdue") {
          params.due_date_to = yesterday;
          params.is_completed = false;
        } else if (activeTab === "upcoming") {
          params.due_date_from = tomorrow;
        } else if (activeTab === "completed") {
          params.is_completed = true;
        } else if (activeTab === "pending") {
          params.is_completed = false;
        }

        const res = await listTasks(params);
        if (res && res.data) {
          const mapped = (res.data as ApiTask[]).map(mapApiTaskToTask);
          setTasks(mapped);
          setTotal(res.pagination?.total ?? 0);
        } else {
          setTasks([]);
          setTotal(0);
        }
      } catch {
        setTasks([]);
        setTotal(0);
        toast.error("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }, [pager.page, pager.perPage, pager.sortCol, pager.sortDir, filters, activeTab, mapApiTaskToTask, allProjects]);
  
    useEffect(() => { fetchTasks(); }, [fetchTasks]);
  
    const openEdit = (row: Task) => {
      setEditId(row.id);
      setEditingTask(row);
      setShowCreate(true);
    };

    const handleDelete = async () => {
      if (!toDelete) return;
      try {
        await deleteTaskApi(toDelete.id);
        setShowDelete(false);
        setToDelete(null);
        fetchTasks();
        toast.success("Task deleted");
      } catch {
        toast.error("Failed to delete task");
      }
    };

    const handleToggleComplete = useCallback(async (row: Task) => {
      try {
        if (row.status === "completed") {
          await incompleteTask(row.id);
        //  toast.success("Task marked incomplete");
        } else {
          await completeTask(row.id);
        //  toast.success("Task marked complete");
        }
        fetchTasks();
      } catch {
        toast.error("Failed to update task");
      }
    }, [fetchTasks]);
  
    // ── Columns ───────────────────────────────────────────────────────────────────
    const columns: TableColumn<Task>[] = useMemo(() => [
      {
        key: "status", label: "Status", sortable: false, type: "custom",
        render: (row) => (
          <button
            onClick={async e => {
              e.stopPropagation();
              await handleToggleComplete(row);
            }}
            title={row.status === "completed" ? "Mark incomplete" : "Mark complete"}
            style={{
              background: "transparent", border: "1.5px solid #9ca3af",
              borderRadius: "50%", width: 20, height: 20, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
            }}
          >
            {row.status === "completed" && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="#6b7280" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        ),
      },
      {
        key: "title", label: "Title", sortable: true, type: "custom",
        render: (row) => (
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden", minWidth: 0 }}
            onMouseEnter={() => setHoveredId(row.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <span
              onClick={e => { e.stopPropagation(); router.push(`/planner/tasks/${row.id}`); }}
              title={row.title}
              style={{
                color: "#2563eb", fontWeight: 400, fontSize: 13, cursor: "pointer",
                fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                flex: 1, minWidth: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                display: "block",
              }}
            >{row.title}</span>

            <button
              onClick={e => { e.stopPropagation(); openEdit(row); }}
              style={{
                ...BTN_BASE,
                paddingTop: 3, paddingBottom: 3, paddingLeft: 9, paddingRight: 9, fontSize: 11,
                flexShrink: 0,
                visibility: hoveredId === row.id ? "visible" : "hidden",
              }}
            >
              Edit
            </button>
          </div>
        ),
      },
      {
        key: "task_type", label: "Task Type", sortable: true, type: "custom",
        render: (row) => (
          <span style={CELL_STYLE}>
            {TASK_TYPE_OPTIONS.find(t => t.value === row.task_type)?.label || row.task_type}
          </span>
        ),
      },
      {
        key: "assigned_to", label: "Assigned to", sortable: true, type: "custom",
        render: (row) => {
          if (!row.assigned_to) return <span style={{ ...CELL_STYLE, color: "#9ca3af" }}>—</span>;
          const name = row.assigned_to_name || row.assigned_to;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", background: "#10b981",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0,
              }}>{name.charAt(0).toUpperCase()}</div>
              <span style={{ ...CELL_STYLE, maxWidth: 130, overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}
                title={name}>{name}</span>
            </div>
          );
        },
      },
      {
        key: "priority", label: "Priority", sortable: true, type: "custom",
        render: (row) => {
          if (!row.priority) return <span style={{ ...CELL_STYLE, color: "#9ca3af" }}>—</span>;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, display: "inline-block",
                backgroundColor: PRIORITY_COLOR[row.priority] }} />
              <span style={CELL_STYLE}>{row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}</span>
            </div>
          );
        },
      },
      {
        key: "due_date", label: "Due date", sortable: true, type: "custom",
        render: (row) => {
          if (!row.due_date) return <span style={{ ...CELL_STYLE, color: "#9ca3af" }}>—</span>;
          const overdue = moment(row.due_date).isBefore(moment()) && row.status !== "completed";
          const isToday    = moment(row.due_date).isSame(moment(), "day");
          const isTomorrow = moment(row.due_date).isSame(moment().add(1, "day"), "day");
          const label = isToday
            ? `Today at ${moment(row.due_date).format("HH:mm")}`
            : isTomorrow
              ? `Tomorrow at ${moment(row.due_date).format("HH:mm")}`
              : moment(row.due_date).format("D MMMM YYYY HH:mm");
          return <span style={{ ...CELL_STYLE, color: overdue ? "#ef4444" : "#374151", fontWeight: overdue ? 500 : 300 }}>{label}</span>;
        },
      },
      {
        key: "notes", label: "Notes", sortable: true, type: "custom",
        render: (row) => (
          <span style={{ ...CELL_STYLE, maxWidth: 200, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}
            title={row.notes || ""}>{row.notes || "—"}</span>
        ),
      },
      {
        key: "repeat_status", label: "Repeat Status", sortable: false, type: "custom",
        render: (row) => <span style={CELL_STYLE}>{row.repeat_status || "—"}</span>,
      },
    ], [hoveredId, fetchTasks, router, handleToggleComplete]);
  
    const actions: TableAction<Task>[] = useMemo(() => [], []);
  
    // Filter options for Project, Assignee, Status
    const projectOptions = useMemo(() => [
      { value: "All Projects", label: "All Projects" },
      ...allProjects.map(p => ({ value: p.name, label: p.name })),
    ], [allProjects]);

    // ── Filter sidebar fields ─────────────────────────────────────────────────────
    const filterFields: FilterField[] = [
      { id: "project", label: "Project", type: "dropdown", value: fForm.project,
        onChange: v => setFForm(p => ({ ...p, project: v ?? "All Projects" })),
        options: projectOptions },
      { id: "assignee", label: "Assignee", type: "multi-select",
        value: fForm.assignee.map(ext => ({ value: ext, label: assigneeOptions.find(o => o.value === ext)?.label ?? ext })),
        onChange: (opts: Array<{ value: string; label: string }>) => setFForm(p => ({ ...p, assignee: opts?.length ? opts.map(o => o.value) : [] })),
        options: assigneeOptions, placeholder: "Select assignees...", isClearable: true },
      { id: "status", label: "Status", type: "dropdown", value: fForm.status,
        onChange: v => setFForm(p => ({ ...p, status: v ?? "All Status" })),
        options: STATUS_OPTIONS },
      { id: "task_type", label: "Task Type", type: "select", value: fForm.task_type,
        onChange: v => setFForm(p => ({ ...p, task_type: v })),
        options: TASK_TYPE_OPTIONS, placeholder: "Select task type...", isClearable: true },
      { id: "priority", label: "Priority", type: "select", value: fForm.priority,
        onChange: v => setFForm(p => ({ ...p, priority: v })),
        options: PRIORITY_OPTIONS, placeholder: "Select priority...", isClearable: true },
      { id: "due_date_from", label: "Due Date From", type: "date", value: fForm.due_date_from,
        onChange: v => setFForm(p => ({ ...p, due_date_from: v })) },
      { id: "due_date_to", label: "Due Date To", type: "date", value: fForm.due_date_to,
        onChange: v => setFForm(p => ({ ...p, due_date_to: v })) },
    ];

    const filterPills: FilterPill[] = [
      {
        id: "project",
        label: fForm.project,
        icon: <ChevronDown size={12} />,
        showDropdown: false,
        onClick: () => setShowSidebar(true),
      }
    ,
      {
        id: "assigned_to",
        label: `Assigned to (${fForm.assignee.length})`,
        icon: <ChevronDown size={12} />,
        showDropdown: false,
        onClick: () => setShowSidebar(true),
      },
      {
        id: "task_type",
        label: fForm.task_type
          ? TASK_TYPE_OPTIONS.find(o => o.value === fForm.task_type?.value)?.label || "Task type"
          : "Task type",
        icon: <ChevronDown size={12} />,
        showDropdown: false,
        onClick: () => setShowSidebar(true),
      },
      {
        id: "status",
        label: fForm.status,
        icon: <ChevronDown size={12} />,
        showDropdown: false,
        onClick: () => setShowSidebar(true),
      },
      
      {
        id: "due_date",
        label: "Due date",
        icon: <ChevronDown size={12} />,
        showDropdown: false,
        onClick: () => setShowSidebar(true),
      },
      {
        id: "queue",
        label: "Queue",
        icon: <ChevronDown size={12} />,
        showDropdown: false,
        onClick: () => setShowSidebar(true),
      },
      {
        id: "clear_all",
        label: "Clear all",
        showDropdown: false,
        onClick: () => {
          setFilters({});
          setFForm(INITIAL_FILTER_FORM);
        },
      },
    ];
  
    // ── Render ─────────────────────────────────────────────────────────────────────
    return (
      <React.Fragment>
  
        {/* ── Global style overrides ── */}
        <style dangerouslySetInnerHTML={{ __html: `
          body, .tasks-page, .tasks-page * { box-sizing: border-box; }
  
          /* Kill GenericTable toolbar — we render our own */
          .tasks-page .gt-toolbar-container { display: none !important; }
  
          /* Flatten card so our sections sit flush */
          .tasks-page .generic-table-card,
          .tasks-page .generic-table-container,
          .tasks-page .card-body {
            border-radius: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #fff !important;
          }
        `}} />
  
        <BreadcrumbItem mainTitle="Planner" mainLink="/planner/dashboard" subTitle="Tasks" />
  
        <div className="tasks-page" style={{
          backgroundColor: "#fff",
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 100px)",
          overflow: "hidden",
        }}>
  
          {/* ══════════════════════════════════════════════════════
              ROW 1 — Page title + top-right buttons
          ══════════════════════════════════════════════════════ */}
          <div style={{
            padding: "14px 20px",
            backgroundColor: "#fff",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div>
              <h4 style={{
                fontWeight: 700, fontSize: 20, margin: 0, color: "#141414",
                fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
              }}>Tasks</h4>
              <p style={{
                fontSize: 12, color: "#6b7280", margin: "3px 0 0",
                fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif", fontWeight: 400,
              }}>{total} records</p>
            </div>
  
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* <button style={BTN_BASE}>Manage queues</button>
              <button style={BTN_BASE}>Import</button> */}
              <button
                onClick={() => { setEditId(null); setEditingTask(null); setShowCreate(true); }}
                style={{ 
                  ...BTN_BASE,
                  backgroundColor: "#000",
                  background: "#000",
                  borderColor: "#000", 
                  color: "#fff", 
                  fontWeight: 600,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#333";
                  e.currentTarget.style.background = "#333";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "#000";
                  e.currentTarget.style.background = "#000";
                }}
              >Create task</button>
            </div>
          </div>
  
          {/* ══════════════════════════════════════════════════════
              ROW 2 — Tabs
              Design: [All ✕] [Due today flex-1] [Overdue flex-1] [Upcoming flex-1]
                      ────────── spacer ──────────  [+ Add view (4/50)]  [All Views]
          ══════════════════════════════════════════════════════ */}
          <div style={{
            display: "flex",
            alignItems: "stretch",
            backgroundColor: "#fff",
            
         
            height: 44,
            flexShrink: 0,
          }}>
            {(() => {
              const currentViewCount = allTabs.length;
              const hasAllViews = visibleTabIds.length === POSSIBLE_TABS.length;
              return (
                <>
            {/* Tabs with equal width */}
            {allTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  padding: "0 20px",
                  border: "none",
                  borderRight: "1px solid #8A8A8A",
                  borderTop: "1px solid #8A8A8A",
                  backgroundColor: activeTab === tab.id ? "#f7f2f7" : "#fff",
                  borderBottom: activeTab === tab.id ? "none" : "1px solid #8A8A8A",
                  color: "#141414",
                  fontSize: 13,
                  fontWeight: activeTab === tab.id ? 500 : 400,
                  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                  cursor: "pointer",
                  height: "100%",
                  gap: tab.id === "all" ? 10 : 0,
                }}
              >
                {tab.label}
                {tab.id === "all" && <X size={13} color="#9ca3af" />}
              </button>
            ))}

            {/* + Add view — opens popup to toggle which tabs are visible */}
            <button
              onClick={() => setShowAddViewModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "0 16px",
               border: "none",
              //   borderLeft: "1px solid #e5e7eb",
                borderTop: "none",
                backgroundColor: "#fff",
                color: "#374151",
                fontSize: 13,
                fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                fontWeight: 400,
                cursor: "pointer",
                flexShrink: 0,
                height: "100%",
                whiteSpace: "nowrap",
                borderRight: "none",
                borderBottom: "1px solid #ccc",
              }}
            >
              <Plus size={14} />
              Add view ({currentViewCount}/{TOTAL_VIEWS})
            </button>

            {/* All Views — enable all tabs, then hide this button */}
            {!hasAllViews && (
              <button
                onClick={() => setVisibleTabIds(POSSIBLE_TABS.map((t) => t.id))}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0 16px",
                  border: "none",
                  borderBottom: "1px solid #ccc",
                  borderLeft: "none",
                  borderTop: "none",
                  borderRight: "none",
                  backgroundColor: "#fff",
                  color: "#2563eb",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                  cursor: "pointer",
                  flexShrink: 0,
                  height: "100%",
                  whiteSpace: "nowrap",
                }}
              >All Views</button>
            )}
                </>
              );
            })()}
          </div>

          {/* Add view / Manage tabs modal */}
          <Modal show={showAddViewModal} onHide={() => setShowAddViewModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Manage views</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p className="text-muted small mb-3">
                Toggle which views appear in the tab bar. At least one must be visible.
              </p>
              {POSSIBLE_TABS.map((tab) => {
                const isVisible = visibleTabIds.includes(tab.id);
                const isOnlyOne = visibleTabIds.length === 1;
                return (
                  <Form.Check
                    key={tab.id}
                    type="switch"
                    id={`view-${tab.id}`}
                    label={tab.label}
                    checked={isVisible}
                    disabled={isVisible && isOnlyOne}
                    onChange={() => {
                      if (isVisible && isOnlyOne) return;
                      setVisibleTabIds((prev) =>
                        prev.includes(tab.id)
                          ? prev.filter((id) => id !== tab.id)
                          : [...prev, tab.id]
                      );
                    }}
                    className="mb-2"
                  />
                );
              })}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowAddViewModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>

          {/* ══════════════════════════════════════════════════════
              ROW 3 — Filter controls row
              LEFT:  Assigned to (1) ✕ | Task type ▼ | Due date ▼ | Queue ▼ | Clear all | Advanced filters
              RIGHT: Save view | Start N tasks
          ══════════════════════════════════════════════════════ */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            backgroundColor: "#fff",
            borderBottom: "1px solid #e5e7eb",
            gap: 8,
            flexShrink: 0,
          }}>
  
            {/* LEFT — filter pills (GenericTable style) */}
            <div className="gt-filter-pills">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {filterPills.map((pill) => (
                    <button
                      key={pill.id}
                      className="gt-filter-pill"
                      onClick={pill.onClick}
                    >
                      {pill.icon && <span className="me-1">{pill.icon}</span>}
                      <span>{pill.label}</span>
                    </button>
                  ))}
                <button className="gt-filter-pill-add">
                  <Plus size={14} className="me-1" />
                  <span>More</span>
                </button>
                <button
                  className="gt-filter-pill-add"
                  onClick={() => setShowSidebar(true)}
                >
                  <Filter size={14} className="me-1" />
                  <span>Advanced filters</span>
                </button>
              </div>
            </div>
  
            {/* RIGHT */}
            {/* <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <Button
                variant="outline-secondary"
                style={{
                  ...BTN_BASE, fontSize: 12,
                  backgroundColor: "#fff", borderColor: "#8a8a8a", color: "#141414",
                }}
                onClick={() => {
                  try {
                    localStorage.setItem(SAVED_VIEW_STORAGE_KEY, JSON.stringify(visibleTabIds));
                    toast.success("View saved. Your tab selection will be restored next time.");
                  } catch {
                    toast.error("Could not save view");
                  }
                }}
              >
                <Save size={13} /> Save view
              </Button>
              <Button
                variant="outline-secondary"
                style={{
                  ...BTN_BASE, fontSize: 12,
                  backgroundColor: "#fff", borderColor: "#8a8a8a", color: "#141414",
                }}
              >
                Start {total} tasks
              </Button>
            </div> */}
          </div>
  
          {/* ══════════════════════════════════════════════════════
              ROW 4 — Search + Edit columns
          ══════════════════════════════════════════════════════ */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 16px",
            backgroundColor: "#fff",
            borderBottom: "1px solid #e5e7eb",
            flexShrink: 0,
          }}>
            {/* Search — height 41px, rounded, with an outline-secondary search button beside it */}
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {/* Input wrapper */}
              <div style={{ position: "relative" }}>
                <FiSearch size={14} style={{
                  position: "absolute", left: 12, top: "50%",
                  transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none",
                }} />
                <input
                  className="task-search-input"
                  type="text"
                  placeholder="Search task title and notes"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      setFilters(p => ({ ...p, search }));
                      setPager(p => ({ ...p, page: 1 }));
                    }
                  }}
                  style={{
                    /* height 41px matches search button height per spec */
                    height: 41,
                    width: 260,
                    padding: "0 12px 0 34px",
                    border: "1px solid #d1d5db",
                    /* left side rounded only — right abuts the search button */
                    borderRadius: "20px 0 0 20px",
                    borderRight: "none",
                    fontSize: 13,
                    color: "#374151",
                    outline: "none",
                    backgroundColor: "#fff",
                    fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                  }}
                />
              </div>
  
              {/* Bootstrap outline-secondary search button */}
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setFilters(p => ({ ...p, search }));
                  setPager(p => ({ ...p, page: 1 }));
                }}
                style={{
                  height: 41,
                  padding: "0 16px",
                  borderRadius: "0 20px 20px 0",
                  border: "1px solid #d1d5db",
                  borderLeft: "none",
                  backgroundColor: "#fff",
                  color: "#6b7280",
                  display: "inline-flex",
                  alignItems: "center",
                  fontSize: 13,
                  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                }}
              >
                <FiSearch size={15} />
              </Button>
            </div>
  
            {/* Edit columns */}
            <Button
              variant="outline-secondary"
              style={{
                ...BTN_BASE, fontSize: 12,
                backgroundColor: "#fff", borderColor: "#8a8a8a", color: "#141414",
              }}
            >Edit columns</Button>
          </div>
  
          {/* ══════════════════════════════════════════════════════
              ROW 5 — Table (fills remaining height)
          ══════════════════════════════════════════════════════ */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            <GenericTable
              data={tasks}
              columns={columns}
              actions={actions}
              showActions={false}
              selectable
              selectedRows={[]}
              onSelectionChange={() => {}}
              pagination={{
                currentPage: pager.page,
                rowsPerPage: pager.perPage,
                totalRows: total,
                pageSizeOptions: [10, 25, 50, 100],
              }}
              onPaginationChange={(page, perPage) =>
                setPager(p => ({ ...p, page, perPage }))
              }
              sortable
              defaultSortColumn={pager.sortCol}
              defaultSortDirection={pager.sortDir}
              onSort={(col, dir) => setPager(p => ({ ...p, sortCol: col, sortDir: dir }))}
              onFirstColumnClick={row => router.push(`/planner/tasks/task-detail?id=${row.id}`)}
              loading={loading}
              emptyMessage="No tasks found"
              loadingMessage="Loading tasks..."
              hover
              uniqueKey="id"
              fixedHeight
              maxHeight="calc(100vh - 439px)"
              showToolbar={false}
            />
          </div>
  
        </div>
  
        {/* ── Filter sidebar ── */}
        <GenericFilterSidebar
          isOpen={showSidebar}
          onClose={() => setShowSidebar(false)}
          title="Filters"
          subtitle="Filter tasks by various criteria"
          width="380px"
          filters={filterFields}
          onApply={() => {
            const f: Record<string, any> = {};
            if (fForm.project && fForm.project !== "All Projects") f.project = fForm.project;
            if (fForm.assignee?.length) f.assignee = fForm.assignee;
            if (fForm.status && fForm.status !== "All Status") f.status = fForm.status;
            if (fForm.task_type)    f.task_type    = fForm.task_type.value;
            if (fForm.priority)     f.priority     = fForm.priority.value;
            if (fForm.due_date_from) f.due_date_from = fForm.due_date_from;
            if (fForm.due_date_to)   f.due_date_to   = fForm.due_date_to;
            if (search) f.search = search;
            setFilters(f);
            setPager(p => ({ ...p, page: 1 }));
            setShowSidebar(false);
          }}
          onReset={() => {
            setFForm(INITIAL_FILTER_FORM);
            setFilters({});
            setSearch("");
            setPager(p => ({ ...p, page: 1 }));
          }}
        />
  
        {/* ── Create / Edit task (CreateTaskSidebar – same logic as createtask-modal) ── */}
        <CreateTaskSidebar
          isOpen={showCreate}
          onClose={() => {
            setShowCreate(false);
            setEditId(null);
            setEditingTask(null);
          }}
          onCreate={async () => {
            setShowCreate(false);
            setEditId(null);
            setEditingTask(null);
            await fetchTasks();
          }}
          extensions={hierarchyDataExtensions as any}
          labels={[]}
          task={editingTask?.rawData ?? editingTask}
          isEdit={!!editingTask}
          taskType="regular"
        />
  
        {/* ── Delete confirmation ── */}
        <DeleteConfirmationModal
          show={showDelete}
          onHide={() => { setShowDelete(false); setToDelete(null); }}
          onConfirm={handleDelete}
          itemName={toDelete?.title}
          itemType="task"
        />
      </React.Fragment>
    );
  };
  
  // ─── Layout wrapper ────────────────────────────────────────────────────────────
  
  TasksListingPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
  
  export default TasksListingPage;
  