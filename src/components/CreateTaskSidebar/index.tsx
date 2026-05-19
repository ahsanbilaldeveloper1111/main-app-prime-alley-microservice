import React, { useState, useEffect, useRef } from "react";
import { buildIn3BusinessDaysLabel } from "@utils/crmFollowUpTaskDue";

type Option = { value: string; label: string };
type SelectOption = string | Option;

type LabelProps = {
  children: React.ReactNode;
  required?: boolean;
};

type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
};

type NativeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
};

type MultiSelectProps = {
  value?: Option[];
  onChange: (value: Option[]) => void;
  options?: Option[];
  placeholder?: string;
};

type SearchableSelectProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  options?: Option[];
  placeholder?: string;
  isClearable?: boolean;
};

type CreateTaskForm = {
  taskTitle: string;
  taskType: string;
  priority: string;
  associatedRecords: Option[];
  assignedTo: string | null;
  queue: string;
  dueDateOption: string;
  dueTime: string;
  setToRepeat: boolean;
  reminder: string;
  notes: string;
};

type CreateTaskSidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: (formData: CreateTaskForm, addAnother: boolean) => void;
  initialData?: Partial<CreateTaskForm> | null;
  taskId?: string | number | null;
  loading?: boolean;
  assigneeOptions?: Option[];
  queueOptions?: Option[];
  recordOptions?: Option[];
  settingsUrl?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TASK_TYPES = [
  "To-do",
  "Call",
  "Email",
  "Meeting",
  "Task",
  "SMS",
  "WhatsApp",
];
const PRIORITIES = ["None", "Low", "Medium", "High"];
const REMINDER_OPTIONS = [
  "No reminder",
  "At time of due date",
  "5 minutes before",
  "15 minutes before",
  "30 minutes before",
  "1 hour before",
  "1 day before",
];
const DUE_DATE_OPTIONS = [
  "Today",
  "Tomorrow",
  buildIn3BusinessDaysLabel(),
  "In 1 week",
  "Custom date",
];

const INITIAL_FORM = {
  taskTitle: "",
  taskType: "To-do",
  priority: "None",
  associatedRecords: [],
  assignedTo: null,
  queue: "None",
  dueDateOption: buildIn3BusinessDaysLabel(),
  dueTime: "08:00",
  setToRepeat: false,
  reminder: "No reminder",
  notes: "",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Label = ({ children, required }: LabelProps) => (
  <label
    style={{
      display: "flex",
      alignItems: "center",
      gap: 5,
      fontSize: 14,
      fontWeight: 600,
      color: "#141414",
      marginBottom: 8,
    }}
  >
    {children}
    {required && <span style={{ color: "#f2545b" }}>*</span>}
  </label>
);

const TextInput = ({
  value,
  onChange,
  placeholder,
  type = "text",
  ...rest
}: TextInputProps) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        padding: "10px 12px",
        border: `1px solid ${focused ? "#0091ae" : "#8a8a8a"}`,
        borderRadius: 4,
        fontSize: 14,
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "inherit",
        transition: "border-color 0.15s",
      }}
      {...rest}
    />
  );
};

const NativeSelect = ({ value, onChange, options }: NativeSelectProps) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          padding: "10px 36px 10px 12px",
          border: `1px solid ${focused ? "#0091ae" : "#8a8a8a"}`,
          borderRadius: 4,
          fontSize: 14,
          outline: "none",
          appearance: "none",
          backgroundColor: "#fff",
          color: "#141414",
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "border-color 0.15s",
        }}
      >
        {options.map((opt) => (
          <option
            key={typeof opt === "string" ? opt : opt.value}
            value={typeof opt === "string" ? opt : opt.value}
          >
            {typeof opt === "string" ? opt : opt.label}
          </option>
        ))}
      </select>
      <ChevronIcon />
    </div>
  );
};

const ChevronIcon = () => (
  <svg
    style={{
      position: "absolute",
      right: 10,
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none",
      color: "#718096",
    }}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 6l4 4 4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const XIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="#8a8a8a" strokeWidth="1.2" />
    <path d="M8 7v5" stroke="#8a8a8a" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="8" cy="4.5" r="0.75" fill="#8a8a8a" />
  </svg>
);

const MultiSelect = ({
  value = [],
  onChange,
  options = [],
  placeholder,
}: MultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleOption = (opt: Option) => {
    const exists = value.find((v) => v.value === opt.value);
    onChange(
      exists ? value.filter((v) => v.value !== opt.value) : [...value, opt],
    );
  };

  const removeTag = (e: React.MouseEvent, optValue: string) => {
    e.stopPropagation();
    onChange(value.filter((v) => v.value !== optValue));
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        tabIndex={0}
        style={{
          minHeight: 40,
          padding: "6px 36px 6px 10px",
          border: `1px solid ${open || focused ? "#0091ae" : "#8a8a8a"}`,
          borderRadius: 4,
          fontSize: 14,
          backgroundColor: "#fff",
          cursor: "pointer",
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          alignItems: "center",
          boxSizing: "border-box",
          transition: "border-color 0.15s",
        }}
      >
        {value.length === 0 ? (
          <span style={{ color: "#a0aec0" }}>
            {placeholder || `Associated with 0 records`}
          </span>
        ) : (
          value.map((v) => (
            <span
              key={v.value}
              style={{
                backgroundColor: "#e6f4f7",
                color: "#0091ae",
                borderRadius: 3,
                padding: "2px 6px",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {v.label}
              <span
                onMouseDown={(e) => removeTag(e, v.value)}
                style={{ cursor: "pointer", lineHeight: 1, fontWeight: "bold" }}
              >
                ×
              </span>
            </span>
          ))
        )}
        <ChevronIcon />
      </div>
      {open && options.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 4,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 10,
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          {options.map((opt) => {
            const selected = value.find((v) => v.value === opt.value);
            return (
              <div
                key={opt.value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  toggleOption(opt);
                }}
                style={{
                  padding: "8px 12px",
                  fontSize: 14,
                  cursor: "pointer",
                  backgroundColor: selected ? "#f0f9fb" : "transparent",
                  color: selected ? "#0091ae" : "#141414",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  if (!selected)
                    e.currentTarget.style.backgroundColor = "#f7fafc";
                }}
                onMouseLeave={(e) => {
                  if (!selected)
                    e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <input
                  type="checkbox"
                  readOnly
                  checked={!!selected}
                  style={{ accentColor: "#0091ae" }}
                />
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SearchableSelect = ({
  value,
  onChange,
  options = [],
  placeholder,
  isClearable,
}: SearchableSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedLabel = value
    ? options.find((o) => o.value === value)?.label
    : null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        style={{
          minHeight: 40,
          padding: "0 36px 0 12px",
          border: `1px solid ${open || focused ? "#0091ae" : "#8a8a8a"}`,
          borderRadius: 4,
          fontSize: 14,
          backgroundColor: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          boxSizing: "border-box",
          transition: "border-color 0.15s",
        }}
        onClick={() => {
          setOpen((o) => !o);
          setSearch("");
        }}
      >
        {open ? (
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onClick={(e) => e.stopPropagation()}
            placeholder={selectedLabel || placeholder || "Search..."}
            style={{
              border: "none",
              outline: "none",
              fontSize: 14,
              width: "100%",
              fontFamily: "inherit",
              color: "#141414",
              backgroundColor: "transparent",
            }}
          />
        ) : (
          <span
            style={{ color: selectedLabel ? "#141414" : "#a0aec0", flex: 1 }}
          >
            {selectedLabel || placeholder}
          </span>
        )}
        {isClearable && selectedLabel && !open && (
          <span
            onMouseDown={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            style={{
              position: "absolute",
              right: 28,
              color: "#718096",
              fontSize: 16,
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ×
          </span>
        )}
        <ChevronIcon />
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 4,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 10,
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{ padding: "10px 12px", fontSize: 14, color: "#a0aec0" }}
            >
              No results
            </div>
          ) : (
            filtered.map((opt) => (
              <div
                key={opt.value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt.value);
                  setOpen(false);
                  setSearch("");
                }}
                style={{
                  padding: "8px 12px",
                  fontSize: 14,
                  cursor: "pointer",
                  color: opt.value === value ? "#0091ae" : "#141414",
                  backgroundColor:
                    opt.value === value ? "#f0f9fb" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (opt.value !== value)
                    e.currentTarget.style.backgroundColor = "#f7fafc";
                }}
                onMouseLeave={(e) => {
                  if (opt.value !== value)
                    e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const NotesToolbar = () => {
  const tools = [
    { label: "B", title: "Bold", style: { fontWeight: "bold" } },
    { label: "I", title: "Italic", style: { fontStyle: "italic" } },
    { label: "U", title: "Underline", style: { textDecoration: "underline" } },
    { label: "S̶", title: "Strikethrough", style: {} },
  ];
  const icons = [
    {
      title: "Insert link",
      svg: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
    },
    {
      title: "Insert email",
      svg: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      ),
    },
    {
      title: "List",
      svg: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
    },
  ];

  const btnStyle = {
    background: "transparent",
    border: "none",
    padding: "3px 7px",
    cursor: "pointer",
    fontSize: 13,
    color: "#4a5568",
    borderRadius: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: "6px 10px",
        borderTop: "1px solid #eaf0f6",
        backgroundColor: "#fafafa",
        flexWrap: "wrap",
      }}
    >
      {tools.map((t) => (
        <button
          key={t.title}
          type="button"
          title={t.title}
          style={{ ...btnStyle, ...t.style }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#edf2f7")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          {t.label}
        </button>
      ))}
      <span style={{ color: "#cbd5e0", margin: "0 4px", fontSize: 16 }}>|</span>
      <button
        type="button"
        style={btnStyle}
        title="More formatting"
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#edf2f7")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "transparent")
        }
      >
        More ▾
      </button>
      <span style={{ color: "#cbd5e0", margin: "0 4px", fontSize: 16 }}>|</span>
      {icons.map((ic) => (
        <button
          key={ic.title}
          type="button"
          title={ic.title}
          style={btnStyle}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#edf2f7")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          {ic.svg}
        </button>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * CreateTaskSidebar
 *
 * Props:
 *  - isOpen          {boolean}   Whether the sidebar is visible
 *  - onClose         {function}  Called when sidebar is dismissed
 *  - onSubmit        {function}  Called with (formData, addAnother). addAnother=true when "Create and add another" clicked
 *  - initialData     {object}    Optional pre-filled form values (for edit mode)
 *  - taskId          {string|null} If provided, sidebar runs in "edit" mode
 *  - loading         {boolean}   Shows loading state on submit button
 *  - assigneeOptions {Array}     [{ value, label }] for "Assigned to"
 *  - queueOptions    {Array}     [{ value, label }] for "Queue"
 *  - recordOptions   {Array}     [{ value, label }] for "Associate with records"
 *  - settingsUrl     {string}    URL for "Go to settings" link (default "/settings/tasks")
 */
const CreateTaskSidebar = ({
  isOpen = false,
  onClose,
  onSubmit,
  initialData = null,
  taskId = null,
  loading = false,
  assigneeOptions = [],
  queueOptions = [],
  recordOptions = [],
  settingsUrl = "/settings/tasks",
}: CreateTaskSidebarProps) => {
  const isEditMode = Boolean(taskId);
  const [form, setForm] = useState<CreateTaskForm>(INITIAL_FORM);
  const [notesAreaFocused, setNotesAreaFocused] = useState(false);

  // Sync initialData when sidebar opens
  useEffect(() => {
    if (isOpen) {
      setForm(
        initialData ? { ...INITIAL_FORM, ...initialData } : { ...INITIAL_FORM },
      );
    }
  }, [isOpen, initialData]);

  // Trap scroll on body while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const set =
    <K extends keyof CreateTaskForm>(key: K) =>
    (val: CreateTaskForm[K]) =>
      setForm((prev) => ({ ...prev, [key]: val }));
  const setVal =
    <K extends keyof CreateTaskForm>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({
        ...prev,
        [key]: e.target.value as CreateTaskForm[K],
      }));
  const setCheck =
    <K extends keyof CreateTaskForm>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({
        ...prev,
        [key]: e.target.checked as CreateTaskForm[K],
      }));

  const isFormValid = form.taskTitle.trim().length > 0;

  const handleSubmit = (addAnother = false) => {
    if (!isFormValid || loading) return;
    onSubmit?.(form, addAnother);
    if (addAnother) setForm({ ...INITIAL_FORM });
  };

  // Build queue options with "None" prepended
  const fullQueueOptions: Option[] = [
    { value: "None", label: "None" },
    ...queueOptions,
  ];

  const btnBase = {
    padding: "10px 20px",
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "background-color 0.15s, color 0.15s",
    fontFamily: "inherit",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          backgroundColor: "transparent",
        }}
      />

      {/* Sidebar panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 500,
          height: "100vh",
          backgroundColor: "#ffffff",
          boxShadow: "-4px 0 20px rgba(0,0,0,0.12)",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #eaf0f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#141414",
              margin: 0,
            }}
          >
            {isEditMode ? "Edit task" : "Create task"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              padding: 4,
              cursor: "pointer",
              color: "#718096",
              display: "flex",
              alignItems: "center",
              borderRadius: 4,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f7fafc")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>

        {/* ── Form Body ── */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(false);
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
          }}
        >
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
            {/* Task Title */}
            <div style={{ marginBottom: 20 }}>
              <Label required>Task Title</Label>
              <TextInput
                value={form.taskTitle}
                onChange={setVal("taskTitle")}
                data-testid="task-title-input"
              />
            </div>

            {/* Task Type + Priority */}
            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <Label required>Task Type</Label>
                <NativeSelect
                  value={form.taskType}
                  onChange={set("taskType")}
                  options={TASK_TYPES}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Label required>Priority</Label>
                <NativeSelect
                  value={form.priority}
                  onChange={set("priority")}
                  options={PRIORITIES}
                />
              </div>
            </div>

            {/* Associate with records */}
            <div style={{ marginBottom: 20 }}>
              <Label>
                Associate with records
                <span
                  title="Link this task to contacts, companies, or deals"
                  style={{ cursor: "help", display: "flex" }}
                >
                  <InfoIcon />
                </span>
              </Label>
              <MultiSelect
                value={form.associatedRecords}
                onChange={set("associatedRecords")}
                options={recordOptions}
                placeholder={`Associated with ${form.associatedRecords.length} records`}
              />
            </div>

            {/* Assigned to */}
            <div style={{ marginBottom: 20 }}>
              <Label>Assigned to</Label>
              <SearchableSelect
                value={form.assignedTo}
                onChange={set("assignedTo")}
                options={assigneeOptions}
                placeholder="Select assignee"
                isClearable
              />
            </div>

            {/* Queue */}
            <div style={{ marginBottom: 20 }}>
              <Label>Queue</Label>
              <NativeSelect
                value={form.queue}
                onChange={set("queue")}
                options={fullQueueOptions}
              />
            </div>

            {/* Due date + Time */}
            <div style={{ marginBottom: 12 }}>
              <Label>Due date</Label>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <NativeSelect
                    value={form.dueDateOption}
                    onChange={set("dueDateOption")}
                    options={DUE_DATE_OPTIONS}
                  />
                </div>
                <div style={{ width: 140 }}>
                  <TextInput
                    type="time"
                    value={form.dueTime}
                    onChange={setVal("dueTime")}
                  />
                </div>
              </div>
            </div>

            {/* Set to repeat */}
            <div
              style={{
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <input
                type="checkbox"
                id="task-set-to-repeat"
                checked={form.setToRepeat}
                onChange={setCheck("setToRepeat")}
                style={{
                  width: 16,
                  height: 16,
                  accentColor: "#0091ae",
                  cursor: "pointer",
                }}
              />
              <label
                htmlFor="task-set-to-repeat"
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#141414",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                Set to repeat
              </label>
            </div>

            {/* Reminder */}
            <div style={{ marginBottom: 6 }}>
              <Label>Reminder</Label>
              <NativeSelect
                value={form.reminder}
                onChange={set("reminder")}
                options={REMINDER_OPTIONS}
              />
              <p
                style={{
                  fontSize: 12,
                  color: "#718096",
                  marginTop: 6,
                  marginBottom: 0,
                }}
              >
                You can customize your default settings.{" "}
                <a
                  href={settingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#0091ae",
                    fontWeight: 500,
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.textDecoration = "underline")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.textDecoration = "none")
                  }
                >
                  Go to settings ↗
                </a>
              </p>
            </div>

            {/* Notes */}
            <div style={{ marginTop: 20 }}>
              <Label>Notes</Label>
              <div
                style={{
                  border: `1px solid ${notesAreaFocused ? "#0091ae" : "#8a8a8a"}`,
                  borderRadius: 4,
                  overflow: "hidden",
                  transition: "border-color 0.15s",
                }}
              >
                <textarea
                  rows={5}
                  value={form.notes}
                  onChange={setVal("notes")}
                  onFocus={() => setNotesAreaFocused(true)}
                  onBlur={() => setNotesAreaFocused(false)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "none",
                    fontSize: 14,
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                    display: "block",
                    boxSizing: "border-box",
                    color: "#141414",
                  }}
                />
                <NotesToolbar />
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #eaf0f6",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              {/* Primary: Create / Update */}
              <button
                type="submit"
                disabled={!isFormValid || loading}
                style={{
                  ...btnBase,
                  backgroundColor:
                    isFormValid && !loading ? "#0091ae" : "#cbd5e0",
                  color: "#fff",
                  border: "none",
                  cursor: isFormValid && !loading ? "pointer" : "not-allowed",
                }}
                onMouseEnter={(e) => {
                  if (isFormValid && !loading)
                    e.currentTarget.style.backgroundColor = "#007a94";
                }}
                onMouseLeave={(e) => {
                  if (isFormValid && !loading)
                    e.currentTarget.style.backgroundColor = "#0091ae";
                }}
              >
                {loading
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                    ? "Update"
                    : "Create"}
              </button>

              {/* Create and add another (only in create mode) */}
              {!isEditMode && (
                <button
                  type="button"
                  disabled={!isFormValid || loading}
                  onClick={() => handleSubmit(true)}
                  style={{
                    ...btnBase,
                    backgroundColor: "transparent",
                    color: isFormValid && !loading ? "#141414" : "#a0aec0",
                    border: "1px solid #8a8a8a",
                    cursor: isFormValid && !loading ? "pointer" : "not-allowed",
                  }}
                  onMouseEnter={(e) => {
                    if (isFormValid && !loading)
                      e.currentTarget.style.backgroundColor = "#f7fafc";
                  }}
                  onMouseLeave={(e) => {
                    if (isFormValid && !loading)
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Create and add another
                </button>
              )}
            </div>

            {/* Cancel */}
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              style={{
                ...btnBase,
                alignSelf: "flex-start",
                backgroundColor: "transparent",
                color: "#141414",
                border: "1px solid #8a8a8a",
                fontWeight: 600,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f7fafc")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateTaskSidebar;
