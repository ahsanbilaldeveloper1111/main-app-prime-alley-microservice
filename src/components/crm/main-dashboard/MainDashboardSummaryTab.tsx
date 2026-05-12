import React from "react";
import {
  CheckSquare,
  AlertTriangle,
  List,
  Phone,
  Mail,
  ExternalLink,
  Plus,
  Play,
} from "lucide-react";
import { FaLinkedinIn } from "react-icons/fa";
import UserActivityByCategory from "@components/UserActivityByCategory";
import TwoCharts from "@components/TwoCharts";
import { MainDashboardSectionHeader } from "./MainDashboardSectionHeader";

const TASK_FILTERS = [
  "All tasks",
  "Due today",
  "Overdue",
  "Due tomorrow",
] as const;

interface StatRow {
  label: string;
  value: string;
  icon: React.ReactNode;
  done?: boolean;
}

const STAT_ROWS: readonly StatRow[] = [
  { label: "All tasks", value: "7", icon: <CheckSquare size={16} color="#666" /> },
  {
    label: "High priority",
    value: "3",
    icon: <AlertTriangle size={16} color="#666" />,
  },
  { label: "To-dos", value: "4", icon: <List size={16} color="#666" /> },
  { label: "Calls", value: "2", icon: <Phone size={16} color="#666" /> },
  { label: "Emails", value: "1", icon: <Mail size={16} color="#666" /> },
  {
    label: "LinkedIn",
    value: "0",
    icon: <FaLinkedinIn size={14} color="#22c55e" />,
    done: true,
  },
];

function StatDoneBadge() {
  return (
    <span className="crm-md-statDoneBadge">
      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden>
        <path
          d="M1 4l2.5 2.5L9 1"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function StatCard({ stat }: { readonly stat: StatRow }) {
  const valueClassName =
    "crm-md-statValue" +
    (stat.value === "0" ? " crm-md-statValue--zero" : "");
  return (
    <div className="crm-md-statCard">
      <div className="crm-md-statLabel">
        {stat.label}
        {stat.done ? <StatDoneBadge /> : stat.icon}
      </div>
      <div className={valueClassName}>{stat.value}</div>
    </div>
  );
}

interface TaskFilterButtonsProps {
  readonly activeTaskFilter: string;
  readonly setActiveTaskFilter: (v: string) => void;
}

function TaskFilterButtons({
  activeTaskFilter,
  setActiveTaskFilter,
}: TaskFilterButtonsProps) {
  return (
    <div className="crm-md-taskFiltersContainer">
      {TASK_FILTERS.map((f) => {
        const className =
          "crm-md-taskFilterBtn" +
          (activeTaskFilter === f ? " crm-md-taskFilterBtn--active" : "");
        return (
          <button
            key={f}
            type="button"
            className={className}
            onClick={() => setActiveTaskFilter(f)}
          >
            {f}
          </button>
        );
      })}
    </div>
  );
}

interface TaskFilterActionsProps {
  readonly onCreateTask: () => void;
  readonly onStartTasks: () => void;
}

function TaskFilterActions({
  onCreateTask,
  onStartTasks,
}: TaskFilterActionsProps) {
  return (
    <div className="crm-md-taskFiltersActions">
      <button type="button" className="crm-md-btn" onClick={onCreateTask}>
        <span className="crm-md-btnInner">
          <Plus size={12} /> Create task
        </span>
      </button>
      <button
        type="button"
        className="crm-md-btn crm-md-btn--primary"
        onClick={onStartTasks}
      >
        <span className="crm-md-btnInner">
          <Play size={12} /> Start tasks
        </span>
      </button>
    </div>
  );
}

interface TasksSectionProps {
  readonly activeTaskFilter: string;
  readonly setActiveTaskFilter: (v: string) => void;
  readonly collapsed: boolean;
  readonly onToggle: () => void;
  readonly onCreateTask: () => void;
  readonly onStartTasks: () => void;
}

function TasksSection({
  activeTaskFilter,
  setActiveTaskFilter,
  collapsed,
  onToggle,
  onCreateTask,
  onStartTasks,
}: TasksSectionProps) {
  return (
    <div className="crm-md-section">
      <MainDashboardSectionHeader
        title="Tasks"
        actionSlot={
          <button type="button" className="crm-md-viewAllLink">
            View all <ExternalLink size={11} />
          </button>
        }
        onToggle={onToggle}
        isCollapsed={collapsed}
      />

      {!collapsed && (
        <>
          <div className="crm-md-taskFilters">
            <TaskFilterButtons
              activeTaskFilter={activeTaskFilter}
              setActiveTaskFilter={setActiveTaskFilter}
            />
            <TaskFilterActions
              onCreateTask={onCreateTask}
              onStartTasks={onStartTasks}
            />
          </div>

          <div className="crm-md-statsGrid">
            {STAT_ROWS.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface CollapsibleEmbedSectionProps {
  readonly title: string;
  readonly collapsed: boolean;
  readonly onToggle: () => void;
  readonly children: React.ReactNode;
}

function CollapsibleEmbedSection({
  title,
  collapsed,
  onToggle,
  children,
}: CollapsibleEmbedSectionProps) {
  return (
    <div className="crm-md-section">
      <MainDashboardSectionHeader
        title={title}
        infoIcon
        onToggle={onToggle}
        isCollapsed={collapsed}
      />
      {!collapsed && <div className="crm-md-sectionBodyPad">{children}</div>}
    </div>
  );
}

interface MainDashboardSummaryTabProps {
  readonly activeTaskFilter: string;
  readonly setActiveTaskFilter: (v: string) => void;
  readonly collapsedSections: Set<string>;
  readonly toggleSection: (sectionId: string) => void;
  readonly onCreateTask: () => void;
  readonly onStartTasks: () => void;
}

export function MainDashboardSummaryTab({
  activeTaskFilter,
  setActiveTaskFilter,
  collapsedSections,
  toggleSection,
  onCreateTask,
  onStartTasks,
}: MainDashboardSummaryTabProps) {
  return (
    <>
      <TasksSection
        activeTaskFilter={activeTaskFilter}
        setActiveTaskFilter={setActiveTaskFilter}
        collapsed={collapsedSections.has("tasks")}
        onToggle={() => toggleSection("tasks")}
        onCreateTask={onCreateTask}
        onStartTasks={onStartTasks}
      />

      <CollapsibleEmbedSection
        title="User activity by category"
        collapsed={collapsedSections.has("userActivity")}
        onToggle={() => toggleSection("userActivity")}
      >
        <UserActivityByCategory />
      </CollapsibleEmbedSection>

      <CollapsibleEmbedSection
        title="Activity"
        collapsed={collapsedSections.has("twoCharts")}
        onToggle={() => toggleSection("twoCharts")}
      >
        <TwoCharts />
      </CollapsibleEmbedSection>
    </>
  );
}
