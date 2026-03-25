"use client";

import React, { ReactElement, useState } from "react";
import Layout from "@layout/index";
import {
  CheckSquare,
  AlertTriangle,
  List,
  Phone,
  Mail,
  Share2,
  ExternalLink,
  Plus,
  ChevronDown,
  GripVertical,
  Info,
} from "lucide-react";
import { toast } from "react-toastify";
import CompanyData from "@pages/crm/companies";
import DealsData from "@pages/crm/deals";
import TasksData from "@pages/planner/tasks";
import AssociateTaskModal from "@components/AssociateTaskModal";
import CreateTaskSidebar from "@components/CreateTaskSidebar";
import UserActivityByCategory from "@components/UserActivityByCategory";
import TwoCharts from "@components/TwoCharts";
import SchedulePage from "@components/SchedulePage";
import { useSession } from "next-auth/react";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;

// ─── Styles (inline via style tag approach using className strings) ───────────

const FONT = "'Lexend Deca', Helvetica, Arial, sans-serif";

const styles: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: FONT,
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
    color: "#141414",
  },
  header: {
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e5e5e5",
    padding: "0 24px",
  },
  headerTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: "16px",
    paddingBottom: "0",
  },
  headerTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 600,
    fontSize: "18px",
    color: "#141414",
  },
  headerDivider: {
    color: "#bbb",
    fontWeight: 300,
    fontSize: "20px",
  },
  headerUser: {
    fontWeight: 400,
    fontSize: "18px",
    color: "#141414",
  },
  helpBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "1px solid #e0e0e0",
    backgroundColor: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#666",
  },
  nav: {
    display: "flex",
    gap: "0",
    marginTop: "8px",
  },
  navTab: {
    fontWeight: 400,
    fontSize: "14px",
    color: "#141414",
    whiteSpace: "nowrap" as const,
    padding: "10px 16px",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    textDecoration: "none",
    display: "block",
  },
  navTabActive: {
    borderBottom: "2px solid #006162",
    fontWeight: 600,
    color: "#006162",
  },
  content: {
    padding: "24px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    border: "1px solid #e5e5e5",
    overflow: "hidden",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "15px",
    fontWeight: 600,
    color: "#141414",
  },
  sectionActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  viewAllLink: {
    fontSize: "13px",
    color: "#006162",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "3px",
    cursor: "pointer",
    fontWeight: 400,
  },
  btn: {
    cursor: "pointer",
    transition: "150ms ease-out",
    display: "inline-block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    backgroundColor: "#ffffff",
    borderColor: "rgb(138, 138, 138)",
    color: "#141414",
    textDecoration: "none",
    borderRadius: "4px",
    borderWidth: "1px",
    borderStyle: "solid",
    verticalAlign: "middle",
    paddingBlock: "8px",
    paddingInline: "16px",
    maxWidth: "100%",
    fontFamily: FONT,
    fontSize: "12px",
    fontWeight: 300,
    letterSpacing: "0px",
    lineHeight: "14px",
    textUnderlineOffset: "24%",
  },
  btnPrimary: {
    backgroundColor: "#bfc9d4",
    borderColor: "#bfc9d4",
    color: "#000000",
  },
  taskFilters: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "12px 16px",
    flexWrap: "wrap" as const,
  },
  taskFiltersContainer: {
    display: "flex",
    border: "1px solid rgb(138, 138, 138)",
    borderRadius: "4px",
    overflow: "hidden",
  },
  taskFilterBtn: {
    cursor: "pointer",
    display: "inline-block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    backgroundColor: "#ffffff",
    color: "#141414",
    border: "none",
    borderRight: "1px solid rgb(138, 138, 138)",
    padding: "8px 16px",
    fontFamily: FONT,
    fontSize: "12px",
    fontWeight: 300,
    lineHeight: "14px",
  },
  taskFilterBtnLast: {
    borderRight: "none",
  },
  taskFilterBtnActive: {
    backgroundColor: "#e6e6e6",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    padding: "0 15px 15px 15px",
  },
  statCard: {
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "10px",
    margin: "0px 5px",
  },
  statLabel: {
    fontSize: "14px",
    fontStyle: "unset" as const,
    fontWeight: 600,
    textTransform: "unset" as const,
    fontFamily: FONT,
    letterSpacing: "0px",
    lineHeight: "18px",
    color: "#141414",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statValue: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#006162",
    marginTop: "4px",
    cursor: "pointer",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
    textAlign: "center" as const,
  },
  emptyIllustration: {
    marginBottom: "16px",
  },
  emptyTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#141414",
    marginBottom: "6px",
  },
  emptyText: {
    fontSize: "13px",
    color: "#666",
    marginBottom: "12px",
    maxWidth: "400px",
  },
  emptyLink: {
    fontSize: "13px",
    color: "#006162",
    textDecoration: "underline",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "3px",
  },
  suggestedCard: {
    margin: "12px 16px",
    border: "1px solid #e5e5e5",
    borderRadius: "6px",
    padding: "14px 16px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "16px",
  },
  suggestedLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    flex: 1,
  },
  suggestedIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: "2px",
  },
  suggestedText: {
    fontSize: "13px",
    color: "#141414",
    lineHeight: "18px",
  },
  suggestedSubtext: {
    fontSize: "12px",
    color: "#666",
    marginTop: "2px",
  },
  followUpLink: {
    fontSize: "12px",
    color: "#006162",
    cursor: "pointer",
    textDecoration: "none",
    marginTop: "6px",
    display: "block",
    fontWeight: 500,
  },
  suggestedRight: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    flexShrink: 0,
  },
  dealInfo: {
    textAlign: "right" as const,
  },
  dealName: {
    fontSize: "13px",
    color: "#006162",
    fontWeight: 600,
    cursor: "pointer",
  },
  dealAmount: {
    fontSize: "12px",
    color: "#141414",
    marginTop: "2px",
  },
  dealClose: {
    fontSize: "12px",
    color: "#141414",
  },
  dealAvatar: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#d4e8ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 700,
    color: "#006162",
    flexShrink: 0,
  },
  gripIcon: {
    color: "#bbb",
    cursor: "grab",
    display: "flex",
    alignItems: "center",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

type SectionHeaderProps = Readonly<{
  title: string;
  actionSlot?: React.ReactNode;
  infoIcon?: boolean;
  onToggle?: () => void;
  isCollapsed?: boolean;
}>;

function SectionHeader({
  title,
  actionSlot,
  infoIcon = false,
  onToggle,
  isCollapsed = false,
}: SectionHeaderProps) {
  const chevronStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    transition: "transform 0.2s ease",
    transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
  };

  return (
    <div style={styles.sectionHeader}>
      <div style={styles.sectionTitle}>
        <div style={styles.gripIcon}>
          <GripVertical size={14} />
        </div>
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? `Expand ${title} section` : `Collapse ${title} section`}
            style={{
              ...chevronStyle,
              cursor: "pointer",
              border: "none",
              background: "none",
              padding: 0,
              font: "inherit",
            }}
          >
            <ChevronDown size={14} color="#666" />
          </button>
        ) : (
          <span style={{ ...chevronStyle, cursor: "default" }}>
            <ChevronDown size={14} color="#666" />
          </span>
        )}
        {title}
        {infoIcon && <Info size={13} color="#999" />}
      </div>
      <div style={styles.sectionActions}>{actionSlot}</div>
    </div>
  );
}

function OutreachIllustration() {
  return (
    <svg width="80" height="70" viewBox="0 0 80 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="30" width="60" height="32" rx="4" fill="#e8f0fe" />
      <rect x="18" y="38" width="20" height="3" rx="1.5" fill="#93b4f5" />
      <rect x="18" y="44" width="32" height="3" rx="1.5" fill="#c5d7fb" />
      <rect x="18" y="50" width="26" height="3" rx="1.5" fill="#c5d7fb" />
      <circle cx="55" cy="20" r="10" fill="#fde68a" />
      <circle cx="55" cy="20" r="6" fill="#f59e0b" />
      <line x1="55" y1="8" x2="55" y2="5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <line x1="55" y1="35" x2="55" y2="32" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <line x1="43" y1="20" x2="40" y2="20" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <line x1="70" y1="20" x2="67" y2="20" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIllustration() {
  return (
    <svg width="80" height="75" viewBox="0 0 80 75" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="18" width="56" height="48" rx="4" fill="#fff3cd" stroke="#ffc107" strokeWidth="1.5" />
      <rect x="12" y="18" width="56" height="14" rx="4" fill="#ffc107" />
      <rect x="22" y="12" width="6" height="12" rx="3" fill="#e65100" />
      <rect x="52" y="12" width="6" height="12" rx="3" fill="#e65100" />
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3, 4, 5, 6].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={20 + col * 6}
            y={38 + row * 7}
            width="4"
            height="4"
            rx="1"
            fill="#fde68a"
          />
        ))
      )}
    </svg>
  );
}

function StalledIllustration() {
  return (
    <svg width="80" height="75" viewBox="0 0 80 75" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="40" width="18" height="28" rx="2" fill="#c7d2fe" />
      <rect x="31" y="28" width="18" height="40" rx="2" fill="#818cf8" />
      <rect x="54" y="16" width="18" height="52" rx="2" fill="#4f46e5" />
      <polyline points="17,38 40,26 63,14" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 3" />
    </svg>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const NAV_TAB_CONFIG: { id: string; label: string; permission: string }[] = [
  { id: "Summary", label: "Summary", permission: '' },
  { id: "Companies", label: "Companies", permission: PERMISSIONS.VIEW_COMPANIES_CRM },
  { id: "Deals", label: "Deals", permission: PERMISSIONS.VIEW_CRM_DEALS },
  { id: "Tasks", label: "Tasks", permission: PERMISSIONS.VIEW_TASKSLIST_WORK_PLANNER },
  { id: "Calendar", label: "Calendar", permission: PERMISSIONS.VIEW_CALENDAR_WORK_PLANNER },
];

type NextPageWithLayout = React.FC & {
  getLayout?: (page: ReactElement) => ReactElement;
};

const SalesDashboard: NextPageWithLayout = () => {
  const { data: session } = useSession();

  const navTabs = React.useMemo(() => {
    const perms = session?.user?.permissions ?? [];
    return NAV_TAB_CONFIG.filter(
      (tab) => !tab.permission || perms.includes(tab.permission)
    );
  }, [session?.user?.permissions]);

  const [activeTab, setActiveTab] = useState("Summary");

  // If current activeTab is not in allowed tabs, switch to first allowed tab
  React.useEffect(() => {
    if (navTabs.length && !navTabs.some((t) => t.id === activeTab)) {
      setActiveTab(navTabs[0].id);
    }
  }, [navTabs, activeTab]);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving] = useState(false);
  const [activeTaskFilter, setActiveTaskFilter] = useState("All tasks");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  
  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  return (
    <div style={styles.page}>
      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.headerTitle}>
            <span>Welcome</span>
            <span style={styles.headerDivider}>|</span>
            <span style={styles.headerUser}>{session?.user?.name}</span>
          </div>
        </div>
        <nav style={styles.nav} aria-label="Dashboard sections">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              style={{
                ...styles.navTab,
                ...(activeTab === tab.id ? styles.navTabActive : {}),
                background: "none",
                font: "inherit",
                boxShadow: "none",
              }}
              aria-current={activeTab === tab.id ? "page" : undefined}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Content ── */}
      <div style={styles.content}>
        {activeTab === "Summary" && (
        <>
        {/* ── Tasks Section ── */}
        <div style={styles.section}>
          <SectionHeader
            title="Tasks"
            actionSlot={
              <a style={styles.viewAllLink}>
                View all <ExternalLink size={11} />
              </a>
            }
            onToggle={() => toggleSection("tasks")}
            isCollapsed={collapsedSections.has("tasks")}
          />

          {!collapsedSections.has("tasks") && (
          <>
          {/* Filter tabs */}
          <div style={styles.taskFilters}>
            <div style={styles.taskFiltersContainer}>
              {["All tasks", "Due today", "Overdue", "Due tomorrow"].map((f, index, arr) => (
                <button
                  key={f}
                  style={{
                    ...styles.taskFilterBtn,
                    ...(activeTaskFilter === f ? styles.taskFilterBtnActive : {}),
                    ...(index === arr.length - 1 ? styles.taskFilterBtnLast : {}),
                  }}
                  onClick={() => setActiveTaskFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button style={styles.btn} onClick={() => setShowCreate(true)}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Plus size={12} /> Create task
                </span>
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={styles.statsGrid}>
            {[
              { label: "All tasks", value: "7", icon: <CheckSquare size={16} color="#666" /> },
              { label: "High priority", value: "3", icon: <AlertTriangle size={16} color="#666" /> },
              { label: "To-dos", value: "4", icon: <List size={16} color="#666" /> },
              { label: "Calls", value: "2", icon: <Phone size={16} color="#666" /> },
              { label: "Emails", value: "1", icon: <Mail size={16} color="#666" /> },
              { label: "LinkedIn", value: "0", icon: <Share2 size={16} color="#22c55e" />, done: true },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  ...styles.statCard,
                  
                }}
              >
                <div style={styles.statLabel}>
                  {stat.label}
                  {stat.done ? (
                    <span
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        backgroundColor: "#22c55e",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  ) : (
                    stat.icon
                  )}
                </div>
                <div
                  style={{
                    ...styles.statValue,
                    color: stat.value === "0" ? "#141414" : "#006162",
                    fontWeight: stat.value === "0" ? 400 : 700,
                  }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
          </>
          )}
        </div>

        {/* ── User Activity By Category ── */}
        <div style={styles.section}>
          <SectionHeader
            title="User activity by category"
            infoIcon
            onToggle={() => toggleSection("userActivity")}
            isCollapsed={collapsedSections.has("userActivity")}
          />
          {!collapsedSections.has("userActivity") && (
            <div style={{ padding: "12px 16px 16px" }}>
              <UserActivityByCategory />
            </div>
          )}
        </div>

        <div style={styles.section}>
          <SectionHeader
            title="Activity"
            infoIcon
            onToggle={() => toggleSection("twoCharts")}
            isCollapsed={collapsedSections.has("twoCharts")}
          />
          {!collapsedSections.has("twoCharts") && (
            <div style={{ padding: "12px 16px 16px" }}>
              <TwoCharts />
            </div>
          )}
        </div>

       
        </>
        )}

        {activeTab === "Companies" && <CompanyData />}

        {activeTab === "Deals" && <DealsData />}

        {activeTab === "Tasks" && <TasksData />}

        {activeTab === "Calendar" && <SchedulePage />}
      </div>

      {/* ── Got feedback button ── */}
      <div
        style={{
          position: "fixed",
          bottom: "16px",
          right: "16px",
          backgroundColor: "#ffffff",
          border: "1px solid #e0e0e0",
          borderRadius: "4px",
          padding: "8px 14px",
          fontSize: "12px",
          color: "#141414",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          fontFamily: FONT,
        }}
      >
        Got feedback?
      </div>
      <AssociateTaskModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  taskName="AI bot offer"
  onAddAssociations={() => console.log("Add associations clicked")}
  onMarkComplete={() => { console.log("Marked complete"); setIsModalOpen(false); }}
  onSkipTask={() => { console.log("Skipped task"); setIsModalOpen(false); }}
/>

 {/* ── Create / Edit task sidebar (new component) ── */}
 <CreateTaskSidebar
            isOpen={showCreate}
            onClose={() => { setShowCreate(false); setEditId(null); }}
            onSubmit={(formData, addAnother) => {
              console.log("Task form submitted:", formData, "Add another:", addAnother);
              toast.success(editId ? "Task updated" : "Task created");
              if (!addAnother) {
                setShowCreate(false);
                setEditId(null);
              }
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
    </div>
  );
};

SalesDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default SalesDashboard;
