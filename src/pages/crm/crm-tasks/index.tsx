import { useQuery, useQueryClient } from "@tanstack/react-query";
import { crmAppKeys } from "../../../query/keys";
import React, {
    ReactElement,
    useState,
    useEffect,
    useCallback,
    useMemo,
  } from "react";
  import Layout from "@layout/index";
  import BreadcrumbItem from "@common/BreadcrumbItem";
  import { Button, Dropdown, Form } from "react-bootstrap";
  import { toast } from "react-toastify";
  import { useRouter } from "next/router";
  import moment from "moment";
  import { 
    Plus, 
    X, 
    ChevronDown, 
    ExternalLink, 
    Save, 
    Filter,
  } from "lucide-react";
  import GenericTable, { 
    TableColumn, 
    TableAction,
    FilterPill,
  } from "@components/GenericTable";
  import GenericFilterSidebar, { FilterField } from "@components/GenericFilterSidebar";
  import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
  import SuccessfulModal from "@components/page-partials/SuccessfulModal";
  import CreateTaskSidebar from "@components/CreateTaskSidebar";
import { useTasksListingPager } from "@hooks/useTasksListingPager";
import { buildCrmTasksListQueryParams } from "@utils/taskListing/buildCrmTasksListQueryParams";
import {
  buildTaskListingPageStyleTag,
  formatTaskDueDateCellParts,
  TaskCompleteCircleButton,
  TaskListingAssigneeCell,
  TaskListingSearchRow,
  TASK_LIST_BTN_OUTLINE,
  TASK_LIST_BTN_COMPACT_CELL,
  TASK_LIST_CELL,
  TASK_PRIORITY_DOT_COLORS,
} from "@utils/taskListing/taskListUiPrimitives";
    
    // ─── Types ─────────────────────────────────────────────────────────────────────
    
    interface Task {
      id: number;
      title: string;
      task_type: string;
      assigned_to: string | null;
      assigned_to_name?: string;
      priority: "low" | "medium" | "high" | null;
      due_date: string | null;
      /** When set, due-date column includes clock time (matches planner `due_time`). */
      due_time?: string | null;
      notes: string | null;
      repeat_status: string | null;
      status: "pending" | "completed" | "overdue";
    }
    
    // ─── Dummy data for fallback when API is unavailable ──────────────────────────
    
    const DUMMY_TASKS: Task[] = [
      {
        id: 1,
        title: "Follow up with prospects",
        task_type: "call",
        assigned_to: "U001",
        assigned_to_name: "John Smith",
        priority: "high",
        due_date: moment().format("YYYY-MM-DD"),
        notes: "Check on their interest in Q4 services",
        repeat_status: "no_repeat",
        status: "pending",
      },
      {
        id: 2,
        title: "Send proposal document",
        task_type: "email",
        assigned_to: "U002",
        assigned_to_name: "Sarah Johnson",
        priority: "high",
        due_date: moment().subtract(1, "days").format("YYYY-MM-DD"),
        notes: "Enterprise package proposal",
        repeat_status: "no_repeat",
        status: "overdue",
      },
      {
        id: 3,
        title: "Schedule meeting with client",
        task_type: "meeting",
        assigned_to: "U003",
        assigned_to_name: "Mike Davis",
        priority: "medium",
        due_date: moment().add(2, "days").format("YYYY-MM-DD"),
        notes: "Quarterly business review",
        repeat_status: "no_repeat",
        status: "pending",
      },
      {
        id: 4,
        title: "Review contract terms",
        task_type: "todo",
        assigned_to: "U004",
        assigned_to_name: "Emily Chen",
        priority: "high",
        due_date: moment().subtract(3, "days").format("YYYY-MM-DD"),
        notes: "Legal review required before signing",
        repeat_status: "no_repeat",
        status: "overdue",
      },
      {
        id: 5,
        title: "Follow up email",
        task_type: "email",
        assigned_to: "U001",
        assigned_to_name: "John Smith",
        priority: "low",
        due_date: moment().add(5, "days").format("YYYY-MM-DD"),
        notes: "Check-in on previous proposal",
        repeat_status: "no_repeat",
        status: "pending",
      },
      {
        id: 6,
        title: "Prepare presentation",
        task_type: "todo",
        assigned_to: "U002",
        assigned_to_name: "Sarah Johnson",
        priority: "high",
        due_date: moment().add(1, "days").format("YYYY-MM-DD"),
        notes: "Sales pitch for new features",
        repeat_status: "no_repeat",
        status: "pending",
      },
      {
        id: 7,
        title: "Confirm appointment time",
        task_type: "call",
        assigned_to: "U003",
        assigned_to_name: "Mike Davis",
        priority: "medium",
        due_date: moment().format("YYYY-MM-DD"),
        notes: "Call to confirm Monday meeting",
        repeat_status: "no_repeat",
        status: "pending",
      },
      {
        id: 8,
        title: "Update CRM with new contacts",
        task_type: "todo",
        assigned_to: "U004",
        assigned_to_name: "Emily Chen",
        priority: "low",
        due_date: moment().subtract(2, "days").format("YYYY-MM-DD"),
        notes: "Import from recent campaign",
        repeat_status: "no_repeat",
        status: "completed",
      },
      {
        id: 9,
        title: "Send contract to legal",
        task_type: "email",
        assigned_to: "U001",
        assigned_to_name: "John Smith",
        priority: "high",
        due_date: moment().subtract(5, "days").format("YYYY-MM-DD"),
        notes: "Review and sign-off needed",
        repeat_status: "no_repeat",
        status: "overdue",
      },
      {
        id: 10,
        title: "Client onboarding call",
        task_type: "call",
        assigned_to: "U002",
        assigned_to_name: "Sarah Johnson",
        priority: "medium",
        due_date: moment().add(3, "days").format("YYYY-MM-DD"),
        notes: "Walk through platform features",
        repeat_status: "no_repeat",
        status: "pending",
      },
      {
        id: 11,
        title: "Analyze competitor proposals",
        task_type: "todo",
        assigned_to: "U003",
        assigned_to_name: "Mike Davis",
        priority: "low",
        due_date: moment().add(7, "days").format("YYYY-MM-DD"),
        notes: "Market research and analysis",
        repeat_status: "no_repeat",
        status: "pending",
      },
      {
        id: 12,
        title: "Follow up on invoice",
        task_type: "email",
        assigned_to: "U004",
        assigned_to_name: "Emily Chen",
        priority: "medium",
        due_date: moment().subtract(4, "days").format("YYYY-MM-DD"),
        notes: "Invoice #INV-2024-001",
        repeat_status: "no_repeat",
        status: "overdue",
      },
      {
        id: 13,
        title: "Training session preparation",
        task_type: "todo",
        assigned_to: "U001",
        assigned_to_name: "John Smith",
        priority: "high",
        due_date: moment().add(4, "days").format("YYYY-MM-DD"),
        notes: "Prepare slides and materials",
        repeat_status: "no_repeat",
        status: "pending",
      },
      {
        id: 14,
        title: "Verify payment received",
        task_type: "todo",
        assigned_to: "U002",
        assigned_to_name: "Sarah Johnson",
        priority: "high",
        due_date: moment().subtract(1, "days").format("YYYY-MM-DD"),
        notes: "Check bank account for deposit",
        repeat_status: "no_repeat",
        status: "completed",
      },
      {
        id: 15,
        title: "Demo setup for prospect",
        task_type: "meeting",
        assigned_to: "U003",
        assigned_to_name: "Mike Davis",
        priority: "high",
        due_date: moment().add(1, "days").format("YYYY-MM-DD"),
        notes: "Prepare demo environment",
        repeat_status: "no_repeat",
        status: "pending",
      },
      {
        id: 16,
        title: "Collect feedback from client",
        task_type: "call",
        assigned_to: "U004",
        assigned_to_name: "Emily Chen",
        priority: "medium",
        due_date: moment().add(6, "days").format("YYYY-MM-DD"),
        notes: "Post-implementation survey",
        repeat_status: "no_repeat",
        status: "pending",
      },
      {
        id: 17,
        title: "Update pricing strategy",
        task_type: "todo",
        assigned_to: "U001",
        assigned_to_name: "John Smith",
        priority: "low",
        due_date: moment().add(10, "days").format("YYYY-MM-DD"),
        notes: "Review market rates",
        repeat_status: "no_repeat",
        status: "pending",
      },
      {
        id: 18,
        title: "Send thank you note",
        task_type: "email",
        assigned_to: "U002",
        assigned_to_name: "Sarah Johnson",
        priority: "low",
        due_date: moment().subtract(6, "days").format("YYYY-MM-DD"),
        notes: "After successful demo",
        repeat_status: "no_repeat",
        status: "completed",
      },
      {
        id: 19,
        title: "Resolve support ticket",
        task_type: "todo",
        assigned_to: "U003",
        assigned_to_name: "Mike Davis",
        priority: "high",
        due_date: moment().format("YYYY-MM-DD"),
        notes: "Customer issue with integration",
        repeat_status: "no_repeat",
        status: "pending",
      },
      {
        id: 20,
        title: "Schedule quarterly review",
        task_type: "meeting",
        assigned_to: "U004",
        assigned_to_name: "Emily Chen",
        priority: "medium",
        due_date: moment().add(8, "days").format("YYYY-MM-DD"),
        notes: "Team performance review",
        repeat_status: "no_repeat",
        status: "pending",
      },
      {
        id: 21,
        title: "Process refund request",
        task_type: "todo",
        assigned_to: "U001",
        assigned_to_name: "John Smith",
        priority: "high",
        due_date: moment().subtract(2, "days").format("YYYY-MM-DD"),
        notes: "Refund for order #ORD-12345",
        repeat_status: "no_repeat",
        status: "overdue",
      },
      {
        id: 22,
        title: "Send price quote",
        task_type: "email",
        assigned_to: "U002",
        assigned_to_name: "Sarah Johnson",
        priority: "medium",
        due_date: moment().add(2, "days").format("YYYY-MM-DD"),
        notes: "Custom enterprise package",
        repeat_status: "no_repeat",
        status: "pending",
      },
      {
        id: 23,
        title: "Update product documentation",
        task_type: "todo",
        assigned_to: "U003",
        assigned_to_name: "Mike Davis",
        priority: "low",
        due_date: moment().add(9, "days").format("YYYY-MM-DD"),
        notes: "Add new feature documentation",
        repeat_status: "no_repeat",
        status: "pending",
      },
      {
        id: 24,
        title: "Attend industry conference",
        task_type: "meeting",
        assigned_to: "U004",
        assigned_to_name: "Emily Chen",
        priority: "medium",
        due_date: moment().add(14, "days").format("YYYY-MM-DD"),
        notes: "Networking and learning",
        repeat_status: "no_repeat",
        status: "pending",
      },
      {
        id: 25,
        title: "Finalize partnership agreement",
        task_type: "todo",
        assigned_to: "U001",
        assigned_to_name: "John Smith",
        priority: "high",
        due_date: moment().subtract(7, "days").format("YYYY-MM-DD"),
        notes: "Awaiting legal review",
        repeat_status: "no_repeat",
        status: "overdue",
      },
    ];
    
    // ─── Mock API (replace with real imports) ──────────────────────────────────────
    
    const getTasks = async (_p: any): Promise<{ data: Task[]; pagination: any }> => ({
      data: DUMMY_TASKS,
      pagination: { total: DUMMY_TASKS.length, current_page: 1, last_page: 1, per_page: 25 },
    });
    const createTask = async (_p: any): Promise<Task> => { throw new Error("NYI"); };
    const updateTask = async (_id: number, _p: any): Promise<Task> => { throw new Error("NYI"); };
    const deleteTask = async (_id: number): Promise<void> => { throw new Error("NYI"); };
    const markTaskComplete = async (_id: number): Promise<void> => { throw new Error("NYI"); };
    
    // ─── Constants ─────────────────────────────────────────────────────────────────
    
    const TASK_TYPE_OPTIONS = [
      { value: "call", label: "Call" },
      { value: "email", label: "Email" },
      { value: "todo", label: "To-do" },
      { value: "meeting", label: "Meeting" },
      { value: "follow_up", label: "Follow-up" },
    ];
    
    const PRIORITY_OPTIONS = [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
    ];
    
    
    // ─── Input style ───────────────────────────────────────────────────────────────
    
    const INPUT: React.CSSProperties = {
      width: "100%",
      padding: "9px 12px",
      border: "1px solid #8a8a8a",
      borderRadius: 4,
      fontSize: 13,
      outline: "none",
      fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
      color: "#141414",
      backgroundColor: "#fff",
    };
    
    // ─── React-select styles ───────────────────────────────────────────────────────
    
    const SEL: any = {
      control: (b: any) => ({
        ...b,
        minHeight: 38,
        border: "1px solid #8a8a8a",
        borderRadius: 4,
        fontSize: 13,
        boxShadow: "none",
        fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
        backgroundColor: "#fff",
        "&:hover": { borderColor: "#0091ae" },
      }),
      option: (b: any, s: any) => ({
        ...b,
        fontSize: 13,
        fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
        backgroundColor: s.isSelected ? "#0091ae" : s.isFocused ? "#f0f9ff" : "#fff",
        color: s.isSelected ? "#fff" : "#374151",
      }),
      placeholder: (b: any) => ({ ...b, fontSize: 13, color: "#9ca3af" }),
      singleValue: (b: any) => ({ ...b, fontSize: 13 }),
    };
    
    // ─── Small label+children wrapper ─────────────────────────────────────────────
    
    const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({
      label, required, children,
    }) => (
      <div style={{ marginBottom: 18 }}>
        <label style={{
          display: "block", fontSize: 13, fontWeight: 600, color: "#141414",
          marginBottom: 6, fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
        }}>
          {label}{required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
        </label>
        {children}
      </div>
    );
    
    // ─── Component ─────────────────────────────────────────────────────────────────
    
    const TasksListingPage = () => {
      const router = useRouter();
    
      // ── Tab state ─────────────────────────────────────────────────────────────────
      const [activeTab, setActiveTab] = useState("all");
    
      const TABS = [
        { id: "due_today",  label: "Due today"  },
        { id: "overdue",   label: "Overdue"    },
        { id: "upcoming",  label: "Upcoming"   },
      ];
    
      useEffect(() => {
        if (router.isReady && router.query.tab) {
          const t = String(router.query.tab);
          if (["all", "due_today", "overdue", "upcoming"].includes(t)) setActiveTab(t);
        }
      }, [router.isReady, router.query.tab]);
    
      const switchTab = useCallback((id: string) => {
        setActiveTab(id);
        setPager(p => ({ ...p, page: 1 }));
        router.push({ pathname: router.pathname, query: { ...router.query, tab: id } }, undefined, { shallow: true });
      }, [router]);

      const [filters, setFilters] = useState<Record<string, unknown>>({});
      const [search, setSearch] = useState("");
      const [hoveredId, setHoveredId] = useState<number | null>(null);

      const { pager, setPager } = useTasksListingPager();

      const queryClient = useQueryClient();
      const listParams = useMemo(
        () =>
          buildCrmTasksListQueryParams({
            page: pager.page,
            perPage: pager.perPage,
            filters,
            activeTab,
          }),
        [pager.page, pager.perPage, filters, activeTab],
      );

      const tasksListQuery = useQuery({
        queryKey: crmAppKeys.crmTasksListing.list(listParams),
        queryFn: () => getTasks(listParams),
      });

      const tasks = tasksListQuery.data?.data ?? [];
      const total = tasksListQuery.data?.pagination?.total ?? 0;
      const loading = tasksListQuery.isPending;

      const refetchTasks = useCallback(() => {
        void queryClient.invalidateQueries({ queryKey: crmAppKeys.crmTasksListing.all() });
      }, [queryClient]);
    
      // ── Filter sidebar ────────────────────────────────────────────────────────────
      const [showSidebar, setShowSidebar]   = useState(false);
      const [fForm, setFForm]              = useState({
        task_type: null as any, priority: null as any,
        assigned_to: null as any, due_date_from: "", due_date_to: "",
      });
    
      // ── Active filter pills ───────────────────────────────────────────────────────
      const [assignedActive, setAssignedActive] = useState(true);
      const [filterPillSearch, setFilterPillSearch] = useState<Record<string, string>>({});
    
      // ── Create/edit task sidebar ──────────────────────────────────────────────────
      const [showCreate, setShowCreate]   = useState(false);
      const [editId, setEditId]           = useState<number | null>(null);
      const [form, setForm]               = useState({
        title: "", task_type: "todo", assigned_to: null as string | null,
        priority: "medium" as "low"|"medium"|"high",
        due_date: "", notes: "", repeat: false, repeat_interval: "daily",
      });
      const [saving, setSaving]           = useState(false);
    
      // ── Delete / success ──────────────────────────────────────────────────────────
      const [showDelete, setShowDelete]   = useState(false);
      const [toDelete, setToDelete]       = useState<Task | null>(null);
      const [showSuccess, setShowSuccess] = useState(false);
      const [successMsg, setSuccessMsg]   = useState({ title: "", desc: "" });
    
      // ── Helpers ───────────────────────────────────────────────────────────────────
      const resetForm = () => setForm({
        title: "", task_type: "todo", assigned_to: null, priority: "medium",
        due_date: "", notes: "", repeat: false, repeat_interval: "daily",
      });
    
      const openEdit = (row: Task) => {
        setEditId(row.id);
        setForm({
          title: row.title, task_type: row.task_type, assigned_to: row.assigned_to,
          priority: row.priority || "medium",
          due_date: row.due_date ? moment(row.due_date).format("YYYY-MM-DDTHH:mm") : "",
          notes: row.notes || "", repeat: !!row.repeat_status, repeat_interval: "daily",
        });
        setShowCreate(true);
      };
    
      const handleSave = async (addAnother = false) => {
        if (!form.title.trim()) { toast.error("Title is required"); return; }
        setSaving(true);
        try {
          editId ? await updateTask(editId, form) : await createTask(form);
          toast.success(editId ? "Task updated" : "Task created");
          refetchTasks();
          if (!addAnother) { setShowCreate(false); setEditId(null); resetForm(); }
          else resetForm();
        } catch { toast.error("Failed to save task"); }
        finally { setSaving(false); }
      };
    
      const handleDelete = async () => {
        if (!toDelete) return;
        try {
          await deleteTask(toDelete.id);
          setShowDelete(false); setToDelete(null);
          refetchTasks(); toast.success("Task deleted");
        } catch { toast.error("Failed to delete"); }
      };
    
      // ── Columns ───────────────────────────────────────────────────────────────────
      const columns: TableColumn<Task>[] = useMemo(() => [
        {
          key: "status", label: "Status", sortable: false, type: "custom",
          render: (row) => (
            <TaskCompleteCircleButton
              isCompleted={row.status === "completed"}
              title="Mark complete"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await markTaskComplete(row.id);
                  refetchTasks();
                } catch {
                  toast.error("Failed to update");
                }
              }}
            />
          ),
        },
        {
          key: "title", label: "Title", sortable: true, type: "custom",
          render: (row) => (
            <div
              style={{ display: "flex", alignItems: "center", gap: 8 }}
              onMouseEnter={() => setHoveredId(row.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <span
                onClick={e => { e.stopPropagation(); router.push(`/crm/tasks/task-detail?id=${row.id}`); }}
                style={{ color: "#2563eb", fontWeight: 400, fontSize: 13, cursor: "pointer",
                  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif" }}
              >{row.title}</span>
    
              {hoveredId === row.id && (
                <>
                  <button onClick={e => { e.stopPropagation(); openEdit(row); }}
                    style={TASK_LIST_BTN_COMPACT_CELL}>
                    Edit
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); router.push(`/crm/tasks/task-detail?id=${row.id}&tab=history`); }}
                    style={TASK_LIST_BTN_COMPACT_CELL}>
                    History <ExternalLink size={10} />
                  </button>
                </>
              )}
            </div>
          ),
        },
        {
          key: "task_type", label: "Task Type", sortable: true, type: "custom",
          render: (row) => (
            <span style={TASK_LIST_CELL}>
              {TASK_TYPE_OPTIONS.find(t => t.value === row.task_type)?.label || row.task_type}
            </span>
          ),
        },
        {
          key: "assigned_to", label: "Assigned to", sortable: true, type: "custom",
          render: (row) => {
            const name = row.assigned_to
              ? row.assigned_to_name || row.assigned_to
              : "";
            return <TaskListingAssigneeCell label={name} />;
          },
        },
        {
          key: "priority", label: "Priority", sortable: true, type: "custom",
          render: (row) => {
            if (!row.priority) return <span style={{ ...TASK_LIST_CELL, color: "#9ca3af" }}>—</span>;
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, display: "inline-block",
                  backgroundColor: TASK_PRIORITY_DOT_COLORS[row.priority] }} />
                <span style={TASK_LIST_CELL}>{row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}</span>
              </div>
            );
          },
        },
        {
          key: "due_date", label: "Due date", sortable: true, type: "custom",
          render: (row) => {
            const parts = formatTaskDueDateCellParts(row.due_date, row.status, row.due_time);
            return (
              <span
                style={{
                  ...TASK_LIST_CELL,
                  color: parts.color,
                  fontWeight: parts.fontWeight,
                }}
              >
                {parts.label}
              </span>
            );
          },
        },
        {
          key: "notes", label: "Notes", sortable: true, type: "custom",
          render: (row) => (
            <span style={{ ...TASK_LIST_CELL, maxWidth: 200, overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}
              title={row.notes || ""}>{row.notes || "—"}</span>
          ),
        },
        {
          key: "repeat_status", label: "Repeat Status", sortable: false, type: "custom",
          render: (row) => <span style={TASK_LIST_CELL}>{row.repeat_status || "—"}</span>,
        },
      ], [hoveredId, refetchTasks, router]);
    
      const actions: TableAction<Task>[] = useMemo(() => [], []);
    
      // ── Filter sidebar fields ─────────────────────────────────────────────────────
      const filterFields: FilterField[] = [
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
          id: "assigned_to",
          label: assignedActive ? "Assigned to (1)" : "Assigned to",
          icon: <ChevronDown size={12} />,
          showDropdown: false,
          onClick: () => setAssignedActive(!assignedActive),
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
            setAssignedActive(false);
            setFilters({});
            setFForm({ task_type: null, priority: null, assigned_to: null, due_date_from: "", due_date_to: "" });
          },
        },
      ];
    
      // ── Render ─────────────────────────────────────────────────────────────────────
      return (
        <React.Fragment>
    
          {/* ── Global style overrides ── */}
          <style
            dangerouslySetInnerHTML={{
              __html: buildTaskListingPageStyleTag({
                extraRules:
                  ".generic-table-responsive.fixed-height-table { border-radius: 0 !important; margin-top: 0 !important; }",
              }),
            }}
          />
    
          <BreadcrumbItem mainTitle="CRM" mainLink="/crm/dashboard" subTitle="Tasks" />
    
          <div className="tasks-page" style={{
            backgroundColor: "#fff",
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 100px)",
            overflow: "hidden",
            marginTop: "-15px",
            marginLeft: "-15px",
            padding: "15px",
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
                <button type="button" style={TASK_LIST_BTN_OUTLINE}>Manage queues</button>
                <button type="button" style={TASK_LIST_BTN_OUTLINE}>Import</button>
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  style={{ 
                    ...TASK_LIST_BTN_OUTLINE,
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
              margin: "0 18px",
              borderLeft: "1px solid",
            }}>
    
              {/* All 4 tabs with equal width */}
              {[{ id: "all", label: "All" }, ...TABS].map(tab => (
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
                    backgroundColor: activeTab === tab.id ? "#ffffff" : "#f7f2f7",
                    borderBottom: activeTab === tab.id ? "none" : "1px solid #8A8A8A",
                    color: "#141414",
                    fontSize: 14,
                    fontWeight: activeTab === tab.id ? 400 : 300,
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
    
              {/* + Add view (4/50) */}
              <button
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
                Add view (4/50)
              </button>
    
              {/* All Views */}
              <button
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
            </div>
    
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
              
              gap: 8,
              flexShrink: 0,
            }}>
    
              {/* LEFT — filter pills (GenericTable style) */}
              <div className="gt-filter-pills" style={{ padding: "0px", border: "none" }}>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {filterPills.map((pill) =>
                    pill.showDropdown ? (
                      <Dropdown key={pill.id}>
                        <Dropdown.Toggle
                          variant="outline-secondary"
                          size="sm"
                          className="gt-filter-pill"
                        >
                          {pill.icon && <span className="me-1">{pill.icon}</span>}
                          <span>{pill.label}</span>
                        </Dropdown.Toggle>
                        <Dropdown.Menu
                          style={{ maxHeight: "280px", overflowY: "auto" }}
                        >
                          {pill.searchable &&
                            pill.dropdownOptions &&
                            pill.dropdownOptions.length > 0 && (
                              <div
                                className="px-2 pb-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Form.Control
                                  size="sm"
                                  type="text"
                                  placeholder="Search..."
                                  value={filterPillSearch[pill.id] ?? ""}
                                  onChange={(e) =>
                                    setFilterPillSearch((prev) => ({
                                      ...prev,
                                      [pill.id]: e.target.value,
                                    }))
                                  }
                                  autoFocus
                                />
                              </div>
                            )}
                          {pill.dropdownOptions &&
                          pill.dropdownOptions.length > 0 ? (
                            (() => {
                              const q = (filterPillSearch[pill.id] ?? "")
                                .trim()
                                .toLowerCase();
                              const options =
                                pill.searchable && q
                                  ? pill.dropdownOptions.filter(
                                      (o) =>
                                        (o.label ?? "")
                                          .toLowerCase()
                                          .includes(q) ||
                                        (o.value ?? "").toLowerCase().includes(q),
                                    )
                                  : pill.dropdownOptions;
                              return options.map((option, idx) => (
                                <Dropdown.Item
                                  key={idx}
                                  onClick={() => {
                                    (option.onClick || pill.onClick)?.();
                                    setFilterPillSearch((prev) => ({
                                      ...prev,
                                      [pill.id]: "",
                                    }));
                                  }}
                                >
                                  {option.label}
                                </Dropdown.Item>
                              ));
                            })()
                          ) : (
                            <>
                              <Dropdown.Item onClick={pill.onClick}>
                                All
                              </Dropdown.Item>
                              <Dropdown.Item onClick={pill.onClick}>
                                Active
                              </Dropdown.Item>
                              <Dropdown.Item onClick={pill.onClick}>
                                Inactive
                              </Dropdown.Item>
                            </>
                          )}
                        </Dropdown.Menu>
                      </Dropdown>
                    ) : (
                      <button
                        key={pill.id}
                        className="gt-filter-pill"
                        onClick={pill.onClick}
                      >
                        {pill.icon && <span className="me-1">{pill.icon}</span>}
                        <span>{pill.label}</span>
                      </button>
                    ),
                  )}
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
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <Button
                  variant="outline-secondary"
                  style={{
                    ...TASK_LIST_BTN_OUTLINE, fontSize: 12,
                    backgroundColor: "#fff", borderColor: "#8a8a8a", color: "#141414",
                  }}
                >
                  <Save size={13} /> Save view
                </Button>
                <Button
                  variant="outline-secondary"
                  style={{
                    ...TASK_LIST_BTN_OUTLINE, fontSize: 12,
                    backgroundColor: "#fff", borderColor: "#8a8a8a", color: "#141414",
                  }}
                >
                  Start {total} tasks
                </Button>
              </div>
            </div>
    
            {/* ══════════════════════════════════════════════════════
                ROW 4 — Search + Edit columns
            ══════════════════════════════════════════════════════ */}
            <TaskListingSearchRow
              search={search}
              onSearchChange={setSearch}
              onSubmitSearch={() => {
                setFilters((p) => ({ ...p, search }));
                setPager((p) => ({ ...p, page: 1 }));
              }}
              wrapperStyle={{
                padding: "8px 16px",
                paddingBottom: 18,
                backgroundColor: "#fff",
                borderTop: "1px solid rgb(229, 231, 235)",
                borderLeft: "1px solid #ccc",
                borderRight: "1px solid #ccc",
                borderRadius: "14px 14px 0 0",
                marginLeft: 25,
                marginRight: 30,
                marginBottom: 0,
              }}
              editColumnsSlot={(
                <Button
                  variant="outline-secondary"
                  style={{
                    ...TASK_LIST_BTN_OUTLINE,
                    fontSize: 12,
                    backgroundColor: "#fff",
                    borderColor: "#8a8a8a",
                    color: "#141414",
                  }}
                >
                  Edit columns
                </Button>
              )}
            />
    
            {/* ══════════════════════════════════════════════════════
                ROW 5 — Table (fills remaining height)
            ══════════════════════════════════════════════════════ */}
            <div style={{ flex: 1, overflow: "hidden", marginTop: "-11px" }}>
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
                defaultSortBy={pager.sortCol}
                defaultSortOrder={pager.sortDir}
                onSort={(col, dir) => setPager(p => ({ ...p, sortCol: col, sortDir: dir }))}
                onFirstColumnClick={row => router.push(`/crm/tasks/task-detail?id=${row.id}`)}
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
              setFForm({ task_type: null, priority: null, assigned_to: null, due_date_from: "", due_date_to: "" });
              setFilters({});
              setSearch("");
              setPager(p => ({ ...p, page: 1 }));
            }}
          />
    
          {/* ── Create / Edit task sidebar (new component) ── */}
          <CreateTaskSidebar
            isOpen={showCreate}
            onClose={() => { setShowCreate(false); setEditId(null); }}
            onSubmit={(formData, addAnother) => {
              console.log("Task form submitted:", formData, "Add another:", addAnother);
              // TODO: Call API to create/update task here
              // await createTask(formData) or await updateTask(editId, formData)
              toast.success(editId ? "Task updated" : "Task created");
              refetchTasks();
              if (!addAnother) { setShowCreate(false); setEditId(null); }
            }}
            taskId={editId}
            loading={saving}
            assigneeOptions={[
              { value: "U001", label: "John Smith" },
              { value: "U002", label: "Sarah Johnson" },
              { value: "U003", label: "Mike Davis" },
              { value: "U004", label: "Emily Chen" },
            ]}
            queueOptions={[
              { value: "queue-1", label: "Sales Queue" },
              { value: "queue-2", label: "Support Queue" },
            ]}
            recordOptions={[
              { value: "contact-1", label: "Contact Records" },
              { value: "company-1", label: "Company Records" },
              { value: "deal-1", label: "Deal Records" },
            ]}
          />
    
          {/* OLD INLINE FORM REMOVED - Using CreateTaskSidebar component above */}
    
          {/* ── Delete confirmation ── */}
          <DeleteConfirmationModal
            show={showDelete}
            onHide={() => { setShowDelete(false); setToDelete(null); }}
            onConfirm={handleDelete}
            itemName={toDelete?.title}
            itemType="task"
          />
    
          {/* ── Success modal ── */}
          <SuccessfulModal
            show={showSuccess}
            onHide={() => setShowSuccess(false)}
            title={successMsg.title}
            description={successMsg.desc}
          />
    
        </React.Fragment>
      );
    };
    
    // ─── Layout wrapper ────────────────────────────────────────────────────────────
    
    TasksListingPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
    
    export default TasksListingPage;
    