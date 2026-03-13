import React, {
  ReactElement,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { X, ChevronRight, ChevronDown, ExternalLink, Search, Info } from "lucide-react";
// import Layout from "@layout/index";

// ─── Shared style tokens ─────────────────────────────────────────────────────

const FONT = "Lexend Deca, Helvetica, Arial, sans-serif";
const PRIMARY_TEXT = "#141414";

const BASE_BUTTON: React.CSSProperties = {
  cursor: "pointer",
  transition: "150ms ease-out",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  backgroundColor: "rgb(255, 255, 255)",
  borderColor: "rgb(138, 138, 138)",
  color: PRIMARY_TEXT,
  textDecoration: "none",
  borderRadius: "4px",
  borderWidth: "1px",
  borderStyle: "solid",
  verticalAlign: "middle",
  paddingBlock: "12px",
  paddingInline: "27px",
  maxWidth: "100%",
  fontFamily: FONT,
  fontSize: "14px",
  fontWeight: 300,
  letterSpacing: "0px",
  lineHeight: "14px",
};

const FIELD_LABEL: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: "12px",
  fontWeight: 400,
  color: PRIMARY_TEXT,
  marginBottom: "6px",
  display: "block",
};

const FIELD_INPUT: React.CSSProperties = {
  height: "42px",
  width: "100%",
  border: "1px solid rgb(138, 138, 138)",
  borderRadius: "4px",
  padding: "0 12px",
  fontSize: "14px",
  fontWeight: 100,
  color: PRIMARY_TEXT,
  fontFamily: FONT,
  outline: "none",
  boxSizing: "border-box",
  backgroundColor: "#fff",
  transition: "border-color 150ms ease-out",
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface StepMeta {
  id: "email" | "access" | "review";
  label: string;
}

const STEPS: StepMeta[] = [
  { id: "email", label: "Select user" },
  { id: "access", label: "Access" },
  { id: "review", label: "Review" },
];

const SELECTABLE_USERS = [
  { id: "u_1", name: "Sarah Johnson", email: "sarah.johnson@crmportal.com" },
  { id: "u_2", name: "Michael Chen", email: "michael.chen@crmportal.com" },
  { id: "u_3", name: "Ava Martinez", email: "ava.martinez@crmportal.com" },
  { id: "u_4", name: "Daniel Kim", email: "daniel.kim@crmportal.com" },
  { id: "u_5", name: "Priya Patel", email: "priya.patel@crmportal.com" },
];

// ─── Seat options ─────────────────────────────────────────────────────────────

interface SeatOption {
  id: string;
  label: string;
  sublabel: string;
  badge?: { text: string; color: string };
}

const SEAT_OPTIONS: SeatOption[] = [
  { id: "admin", label: "Admin Seat", sublabel: "Full workspace administration" },
  { id: "operations", label: "Operations Seat", sublabel: "Manage workflows, compliance, and operations" },
  { id: "sales", label: "Sales Seat", sublabel: "Access CRM, deals, and customer pipeline" },
  { id: "support", label: "Support Seat", sublabel: "Support conversations and service workflows" },
  { id: "finance", label: "Finance Seat", sublabel: "Billing, invoices, subscriptions, and payments" },
  { id: "ai_automation", label: "AI Automation Seat", sublabel: "Virtual agents and voicebot management", badge: { text: "Popular", color: "#2d7a4f" } },
  { id: "view_only", label: "View-Only Seat", sublabel: "Unlimited seats" },
  { id: "core", label: "Core Seat", sublabel: "Unlimited seats", badge: { text: "Trial", color: "#2d7a4f" } },
  { id: "developer", label: "Developer Seat", sublabel: "Unlimited seats" },
  { id: "commerce_pro", label: "Commerce Professional Seat", sublabel: "Unlimited seats", badge: { text: "Trial", color: "#2d7a4f" } },
  { id: "sales_pro", label: "Sales Professional Seat", sublabel: "5 seats remaining" },
  { id: "service_starter", label: "Service Starter Seat", sublabel: "Unlimited seats" },
];

// ─── Access method icons (inline SVG illustrations) ───────────────────────────

const IconLock = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="40" cy="70" rx="22" ry="5" fill="#F0B429" fillOpacity="0.35"/>
    <rect x="18" y="36" width="44" height="30" rx="5" fill="#F5C842" stroke="#2D3748" strokeWidth="2.2"/>
    <rect x="24" y="41" width="32" height="20" rx="3" fill="#F7D96A"/>
    <path d="M27 36V27C27 19.82 32.82 14 40 14s13 5.82 13 13v9" stroke="#2D3748" strokeWidth="2.6" strokeLinecap="round"/>
    <circle cx="40" cy="51" r="5" fill="#2D3748"/>
    <rect x="38" y="52" width="4" height="7" rx="1.5" fill="#2D3748"/>
  </svg>
);

const IconKeys = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="40" cy="70" rx="22" ry="5" fill="#F0B429" fillOpacity="0.3"/>
    <circle cx="30" cy="32" r="14" fill="#F5C842" stroke="#2D3748" strokeWidth="2.2"/>
    <circle cx="30" cy="32" r="8" fill="#fff" stroke="#2D3748" strokeWidth="1.8"/>
    <circle cx="30" cy="32" r="3.5" fill="#F5C842" stroke="#2D3748" strokeWidth="1.5"/>
    <path d="M40 40l22 20" stroke="#C0392B" strokeWidth="3.5" strokeLinecap="round"/>
    <path d="M50 50l5-5" stroke="#C0392B" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M54 55l5-5" stroke="#C0392B" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M34 20l22 20" stroke="#E67E22" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.6"/>
  </svg>
);

const IconRuler = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="40" cy="70" rx="22" ry="5" fill="#F0B429" fillOpacity="0.3"/>
    <path d="M20 62L20 20L54 62Z" fill="#5B9BD5" stroke="#2D3748" strokeWidth="2.2" strokeLinejoin="round"/>
    <path d="M20 62L54 62" stroke="#2D3748" strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M20 52h5M20 44h4M20 36h5M20 28h4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="58" cy="30" r="7" fill="#F5C842" stroke="#2D3748" strokeWidth="1.8"/>
    <path d="M55 30h6M58 27v6" stroke="#2D3748" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="62" cy="50" r="8" fill="#F7D96A" stroke="#2D3748" strokeWidth="1.8"/>
    <path d="M60 48l4 4M64 48l-4 4" stroke="#2D3748" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const IconPencil = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="40" cy="70" rx="22" ry="5" fill="#F0B429" fillOpacity="0.3"/>
    <path d="M44 14L62 32L34 60L16 60L16 42L44 14Z" fill="#F5E6A3" stroke="#2D3748" strokeWidth="2.2" strokeLinejoin="round"/>
    <path d="M40 18L58 36" stroke="#2D3748" strokeWidth="1.5" strokeDasharray="3 2.5"/>
    <path d="M16 42L22 48L16 60Z" fill="#F5C842" stroke="#2D3748" strokeWidth="1.5" strokeLinejoin="round"/>
    <rect x="55" y="10" width="12" height="8" rx="2" fill="#F48FB1" stroke="#2D3748" strokeWidth="1.8" transform="rotate(45 55 10)"/>
    <path d="M50 15L58 23" stroke="#2D3748" strokeWidth="1.5"/>
  </svg>
);

// ─── Access methods ───────────────────────────────────────────────────────────

interface AccessMethod {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface AppPermissionCategory {
  id: string;
  label: string;
}

interface AppPermissionModule {
  id: string;
  label: string;
  categories: AppPermissionCategory[];
}

const ACCESS_METHODS: AccessMethod[] = [
  {
    id: "seat_permissions",
    title: "Use seat permissions",
    description: "Users will have default permissions based on the seat you select.",
    icon: <IconLock />,
  },
  {
    id: "super_admin",
    title: "Make Super Admin",
    description: "Super Admins can manage all users, tools, and settings.",
    icon: <IconKeys />,
  },
  {
    id: "template",
    title: "Start with a template",
    description: "Copy another user's permissions or use a suggested set of permissions based on common roles.",
    icon: <IconRuler />,
  },
  {
    id: "scratch",
    title: "Start from scratch",
    description: "Create permissions specifically for this user.",
    icon: <IconPencil />,
  },
];

const APP_PERMISSION_MODULES: AppPermissionModule[] = [
  {
    id: "smart_crm",
    label: "Smart CRM",
    categories: [
      { id: "crm-dashboard", label: "Dashboard" },
      { id: "crm-prospects-management", label: "Data Management" },
      { id: "crm-leads", label: "Leads" },
      { id: "crm-deals", label: "Deals" },
      { id: "crm-orders", label: "Orders" },
      { id: "crm-deals-approval", label: "Deals Approval" },
      { id: "crm-contacts", label: "Contacts" },
      { id: "crm-company", label: "Company" },
      { id: "crm-inbox", label: "Inbox" },
      { id: "crm-activities", label: "Activities" },
    ],
  },
  {
    id: "communications",
    label: "Communications",
    categories: [
      { id: "call-history-dashboard", label: "Dashboard" },
      { id: "call-history-logs", label: "Call Logs" },
      { id: "call-history-recordings", label: "Call Recordings" },
      { id: "ai-ml-calls-analysis", label: "Calls Analysis" },
      { id: "wallboards-live", label: "Wallboards (Live)" },
      { id: "text-messages-communications", label: "Text Messages" },
      { id: "live-calls-campaign-manager", label: "Campaigns Manager" },
      { id: "live-calls-campaign-console", label: "Campaign Console" },
    ],
  },
  {
    id: "planner",
    label: "Planner",
    categories: [
      { id: "planner-dashboard", label: "Dashboard" },
      { id: "planner-projects", label: "Projects" },
      { id: "planner-tasks", label: "Tasks" },
      { id: "planner-calendar", label: "Calendar" },
      { id: "work-planner-orders", label: "Orders Delivery" },
    ],
  },
  {
    id: "virtual_agents",
    label: "Virtual Agents",
    categories: [
      { id: "virtual-agents-outbound-agent", label: "Outbound Agent" },
      { id: "virtual-agents-inbound-agent", label: "Inbound Agent" },
      { id: "virtual-agents-agent-campaigns", label: "Agent Campaigns" },
      { id: "virtual-agents-create-campaigns", label: "Create Campaign" },
      { id: "ai-agent-outbound-campaigns-pitch-deck", label: "Pitch Deck" },
      { id: "virtual-agents-live-monitoring", label: "Live Monitoring" },
      { id: "virtual-agents-analytics", label: "Analytics" },
      { id: "virtual-agents-usage-reports", label: "Usage Reports" },
    ],
  },
  {
    id: "pulse",
    label: "Pulse",
    categories: [
      { id: "pulse-dashboard", label: "Dashboard" },
      { id: "pulse-hosts", label: "Hosts" },
      { id: "pulse-hosts-groups", label: "Hosts Groups" },
      { id: "pulse-hosts-alerts", label: "Alerts" },
      { id: "pulse-templates", label: "Templates" },
      { id: "pulse-events", label: "Events" },
      { id: "pulse-customers", label: "Customers" },
      { id: "pulse-uptime-sla", label: "Uptime SLA" },
      { id: "pulse-select-server", label: "Server Insights" },
      { id: "pulse-gateways", label: "Gateways" },
      { id: "pulse-gateway-ports", label: "Gateway Ports" },
    ],
  },
  {
    id: "compliance",
    label: "Compliance",
    categories: [
      { id: "compliance-api-number-check", label: "API Number Check" },
      { id: "compliance-cdr-records", label: "CDR Records" },
      { id: "dncr-local-dnd-call-block", label: "Add Records" },
    ],
  },
  {
    id: "workforce",
    label: "Workforce",
    categories: [
      { id: "workforce-dashboard", label: "Dashboard" },
      { id: "workforce-org-chart", label: "Org Chart" },
      { id: "workforce-employees", label: "Employees" },
      { id: "workforce-attendence", label: "Attendance" },
      { id: "workforce-journey", label: "Journey" },
      { id: "workforce-approval-requests", label: "Approval Requests" },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    categories: [
      { id: "finance-account-overview", label: "Overview" },
      { id: "finance-quotes", label: "Quotes" },
      { id: "finance-products", label: "Products" },
      { id: "finance-subscriptions", label: "Subscription" },
      { id: "finance-invoices", label: "Invoices" },
      { id: "finance-payments", label: "Payments" },
      { id: "finance-transactions", label: "Transactions" },
    ],
  },
  {
    id: "voicebot_inbound",
    label: "Voicebot Inbound",
    categories: [
      { id: "voicebot-inbound-dashboard", label: "Dashboard" },
      { id: "voicebot-inbound-companies", label: "Companies" },
      { id: "voicebot-inbound-bots", label: "Bots" },
      { id: "voicebot-inbound-calls", label: "Conversations" },
      { id: "voicebot-inbound-analytics", label: "Analytics" },
    ],
  },
  {
    id: "voicebot_outbound",
    label: "Voicebot Outbound",
    categories: [
      { id: "voicebot-outbound-trunks", label: "Trunks" },
      { id: "voicebot-outbound-voicebots", label: "Bots" },
      { id: "voicebot-outbound-campaigns", label: "Campaigns" },
      { id: "voicebot-outbound-reports", label: "Reports" },
      { id: "voicebot-outbound-analytics", label: "Analytics" },
    ],
  },
  {
    id: "unified_reports",
    label: "Unified Reports",
    categories: [
      { id: "crm-reports", label: "CRM Insights" },
      { id: "call-reports", label: "Call Analytics" },
      { id: "ai-chat-usage-reports", label: "Chat Usage" },
    ],
  },
  {
    id: "audit_logs",
    label: "Audit Logs",
    categories: [],
  },
  {
    id: "settings",
    label: "Settings",
    categories: [],
  },
];

// ─── Template data ────────────────────────────────────────────────────────────

type PermStatus = "green-circle" | "grey-circle" | "green-dot" | "grey-dot";

interface PermItem {
  name: string;
  status: PermStatus;
}

interface PermCategory {
  title: string;
  items: PermItem[];
}

interface TemplateItem {
  id: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
  permissions?: PermCategory[];
}

interface TemplateGroup {
  groupLabel: string;
  items: TemplateItem[];
}

const TEMPLATE_MODULES = APP_PERMISSION_MODULES.slice(0, 4);

const buildTemplatePermissions = (variant: "viewer" | "operator"): PermCategory[] => {
  return TEMPLATE_MODULES.map((module, moduleIndex) => ({
    title: module.label,
    items: module.categories.map((category, categoryIndex) => {
      let status: PermStatus;

      if (variant === "viewer") {
        status = categoryIndex < 2 ? "green-circle" : categoryIndex < 4 ? "green-dot" : "grey-dot";
      } else {
        status = categoryIndex < 3 ? "green-circle" : categoryIndex < 6 ? "green-dot" : moduleIndex % 2 === 0 ? "grey-dot" : "grey-circle";
      }

      return { name: category.label, status };
    }),
  }));
};

const VIEW_ONLY_PERMISSIONS: PermCategory[] = buildTemplatePermissions("viewer");

const STANDARD_USER_PERMISSIONS: PermCategory[] = buildTemplatePermissions("operator");

const TEMPLATE_GROUPS: TemplateGroup[] = [
  {
    groupLabel: "Workspace templates",
    items: [
      {
        id: "view_only_tpl",
        label: "Workspace viewer",
        sublabel: "Lightweight read-first access across the core workspace modules.",
        permissions: VIEW_ONLY_PERMISSIONS,
      },
    ],
  },
  {
    groupLabel: "Role-based templates",
    items: [
      {
        id: "super_admin_tpl",
        label: "Super Admin",
        sublabel: "Super Admin permissions can't be edited.",
        disabled: true,
      },
      {
        id: "standard_user_tpl",
        label: "Workspace operator",
        sublabel: "Balanced access for daily operations across active business modules.",
        permissions: STANDARD_USER_PERMISSIONS,
      },
    ],
  },
];

const ALL_TEMPLATE_ITEMS = TEMPLATE_GROUPS.flatMap((g) => g.items);

// ─── Permission dot ───────────────────────────────────────────────────────────

const PermDot: React.FC<{ status: PermStatus }> = ({ status }) => {
  const isCircle = status.includes("circle");
  const isGreen = status.includes("green");
  const color = isGreen ? "#00bda5" : "#d1d5db";
  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        flexShrink: 0,
        border: isCircle ? `2px solid ${color}` : "none",
        backgroundColor: isCircle ? "transparent" : color,
      }}
    />
  );
};

// ─── Permissions grid ─────────────────────────────────────────────────────────

const PermissionsGrid: React.FC<{ categories: PermCategory[] }> = ({ categories }) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const getAccessLabel = (status: PermStatus) => {
    if (status === "green-circle") return "Full Access";
    if (status === "green-dot") return "Partial access";
    if (status === "grey-circle") return "No Access";
    return "No Access";
  };
   return (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "0 32px",
      marginTop: "50px",
    }}
  >
    {categories.map((cat) => (
      <div key={cat.title}>
        <p style={{ fontFamily: FONT, fontSize: "16px", fontWeight: 600, color: PRIMARY_TEXT, margin: "0 0 14px 0" }}>
          {cat.title}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {cat.items.map((item) => {
              const itemKey = `${cat.title}-${item.name}`;
              const tooltipLabel = getAccessLabel(item.status);
              const isHovered = hoveredItem === itemKey;

              return (
                <div
                  key={item.name}
                  onMouseEnter={() => setHoveredItem(itemKey)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{ display: "flex", alignItems: "center", gap: "8px", position: "relative", width: "fit-content" }}
                >
                  <PermDot status={item.status} />
                  <span style={{ fontFamily: FONT, fontSize: "15px", fontWeight: 300, color: PRIMARY_TEXT, lineHeight: "18px" }}>
                    {item.name}
                  </span>
                  {isHovered && (
                    <span
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "calc(100% + 8px)",
                        transform: "translateY(-50%)",
                        backgroundColor: "#141414",
                        color: "#ffffff",
                        fontFamily: FONT,
                        fontSize: "12px",
                        fontWeight: 400,
                        lineHeight: "16px",
                        padding: "6px 10px",
                        borderRadius: "4px",
                        whiteSpace: "nowrap",
                        zIndex: 1100,
                        pointerEvents: "none",
                      }}
                    >
                      {tooltipLabel}
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    ))}
  </div>
  
);
};

// ─── Template dropdown ────────────────────────────────────────────────────────

const TemplateDropdown: React.FC<{
  value: string;
  onChange: (id: string) => void;
}> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedItem = ALL_TEMPLATE_ITEMS.find((i) => i.id === value);
  const selectedLabel = selectedItem?.label ?? "";

  const filteredGroups = TEMPLATE_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => i.label.toLowerCase().includes(search.toLowerCase())),
  })).filter((g) => g.items.length > 0);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 10);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", width: "420px" }}>
      {/* Trigger */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          height: "42px",
          border: `1px solid ${open ? "#141414" : "rgb(138,138,138)"}`,
          borderRadius: open ? "4px 4px 0 0" : "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          cursor: "pointer",
          backgroundColor: "#fff",
          boxSizing: "border-box",
          gap: "8px",
        }}
      >
        <span style={{ fontFamily: FONT, fontSize: "16px", fontWeight: 300, color: selectedLabel ? "#141414" : "#6b7280", flex: 1 }}>
          {selectedLabel || "Choose a template"}
        </span>
        <ChevronDown
          size={16}
          color="#555"
          style={{ flexShrink: 0, transition: "transform 150ms ease-out", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </div>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            border: "1px solid #2563eb",
            borderTop: "none",
            borderRadius: "0 0 4px 4px",
            backgroundColor: "#fff",
            zIndex: 300,
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
          }}
        >
          {/* Search input */}
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #cccccc" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                border: "2px solid #2563eb",
                borderRadius: "4px",
                padding: "6px 10px",
              }}
            >
              <Search size={14} color="#6b7280" style={{ flexShrink: 0 }} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                style={{
                  border: "none",
                  outline: "none",
                  flex: 1,
                  fontFamily: FONT,
                  fontSize: "13px",
                  fontWeight: 300,
                  color: PRIMARY_TEXT,
                  backgroundColor: "transparent",
                  padding: 0,
                }}
              />
            </div>
          </div>

          {/* Groups + items */}
          <div style={{ maxHeight: "260px", overflowY: "auto" }}>
            {filteredGroups.length === 0 ? (
              <div style={{ padding: "14px", fontFamily: FONT, fontSize: "13px", color: "#9ca3af" }}>
                No templates found
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.groupLabel}>
                  <div
                    style={{
                      padding: "10px 14px 4px",
                      fontFamily: FONT,
                      fontSize: "12px",
                      fontWeight: 700,
                      color: PRIMARY_TEXT,
                    }}
                  >
                    {group.groupLabel}
                  </div>
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (!item.disabled) {
                          onChange(item.id);
                          setOpen(false);
                          setSearch("");
                        }
                      }}
                      style={{
                        padding: "9px 14px 9px 22px",
                        cursor: item.disabled ? "default" : "pointer",
                        backgroundColor: item.id === value ? "#f0f5ff" : "#f9f9f9",
                        transition: "background-color 100ms ease-out",
                        opacity: item.disabled ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!item.disabled && item.id !== value)
                          (e.currentTarget as HTMLDivElement).style.backgroundColor = "#f0f0f0";
                      }}
                      onMouseLeave={(e) => {
                        if (!item.disabled && item.id !== value)
                          (e.currentTarget as HTMLDivElement).style.backgroundColor = "#f9f9f9";
                      }}
                    >
                      <div style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: item.disabled ? "#9ca3af" : PRIMARY_TEXT }}>
                        {item.label}
                      </div>
                      {item.sublabel && (
                        <div style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 300, color: "#e8390e", marginTop: "2px" }}>
                          {item.sublabel}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Magnifying-glass placeholder illustration ────────────────────────────────

const MagnifyPlaceholder = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", paddingTop: "16px" }}>
    <svg width="110" height="95" viewBox="0 0 110 95" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="55" cy="86" rx="38" ry="7" fill="#cccccc" />
      <path d="M18 66L55 86L92 66L55 46Z" fill="#f3f4f6" stroke="#cccccc" strokeWidth="1.2"/>
      <path d="M18 66L55 76L92 66" stroke="#cccccc" strokeWidth="1"/>
      <line x1="72" y1="52" x2="86" y2="66" stroke="#d1d5db" strokeWidth="5" strokeLinecap="round"/>
      <circle cx="56" cy="36" r="20" fill="none" stroke="#d1d5db" strokeWidth="4"/>
      <circle cx="56" cy="36" r="14" fill="#f9fafb" stroke="#cccccc" strokeWidth="1.5"/>
      <circle cx="50" cy="30" r="4" fill="#cccccc" opacity="0.7"/>
      <path d="M56 26a8 8 0 0 1 5 3" stroke="#cccccc" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <line x1="78" y1="22" x2="82" y2="18" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="82" y1="28" x2="88" y2="26" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="79" y1="35" x2="85" y2="36" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
    <p style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: "#141414", margin: 0, textAlign: "center" }}>
      Choose a template to preview access.
    </p>
  </div>
);

// ─── Choose Permissions Section (new design) ──────────────────────────────────

type ViewOption = "All contacts" | "Own contacts" | "Team contacts" | "None";
type EditOption = "All" | "Own" | "Team" | "None";
type DeleteOption = "All" | "Own" | "Team" | "None";
type MergeOption = "All" | "Own" | "None";

interface CrmObjectState {
  enabled: boolean;
  view: ViewOption;
  create: boolean;
  edit: EditOption;
  delete: DeleteOption;
  merge: MergeOption;
  expanded: boolean;
}

interface PermissionsState {
  [key: string]: CrmObjectState;
}

const CRM_OBJECTS = [
  { key: "contacts", label: "Contacts", description: "Save important info about your customers as a contact, so your team can connect with them." },
  { key: "companies", label: "Companies", description: "Save useful info about companies in your database, so your team stays organized." },
  { key: "deals", label: "Deals", description: "Track revenue opportunities and manage your sales pipeline." },
  { key: "orders", label: "Orders", description: "Manage and track customer orders in your CRM." },
  { key: "tickets", label: "Tickets", description: "Manage customer support requests and issues." },
  { key: "tasks", label: "Tasks", description: "Create and assign tasks to manage work across your team." },
];

const NAV_SECTIONS = APP_PERMISSION_MODULES.map((module) => ({
  id: module.id,
  label: module.label,
  expandable: module.categories.length > 0,
  children: module.categories.map((category) => ({ id: category.id, label: category.label })),
}));

const initPermissions = (): PermissionsState => {
  const state: PermissionsState = {};
  CRM_OBJECTS.forEach((obj) => {
    state[obj.key] = {
      enabled: true,
      view: "All contacts" as ViewOption,
      create: false,
      edit: "None" as EditOption,
      delete: "None" as DeleteOption,
      merge: "None" as MergeOption,
      expanded: true,
    };
  });
  return state;
};

// Toggle switch component
const Toggle: React.FC<{ checked: boolean; onChange: () => void; small?: boolean }> = ({ checked, onChange, small }) => {
  const w = small ? 34 : 38;
  const h = small ? 18 : 20;
  const knob = small ? 12 : 14;
  const off = small ? 3 : 3;
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      style={{
        width: w,
        height: h,
        borderRadius: h / 2,
        backgroundColor: checked ? "#00bda5" : "#d1d5db",
        position: "relative",
        cursor: "pointer",
        transition: "background-color 200ms ease-out",
        flexShrink: 0,
      }}
    >
      <div style={{
        width: knob,
        height: knob,
        borderRadius: "50%",
        backgroundColor: "#fff",
        position: "absolute",
        top: (h - knob) / 2,
        left: checked ? w - knob - off : off,
        transition: "left 200ms ease-out",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
      }} />
    </div>
  );
};

// ON/OFF button pair
const OnOffButton: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <div
    style={{
      display: "flex",
      border: "1px solid #d1d5db",
      borderRadius: "4px",
      overflow: "hidden",
      flexShrink: 0,
    }}
  >
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); if (!checked) onChange(); }}
      style={{
        fontFamily: FONT,
        fontSize: "12px",
        fontWeight: 600,
        padding: "5px 12px",
        border: "none",
        borderRight: "1px solid #d1d5db",
        cursor: checked ? "default" : "pointer",
        backgroundColor: checked ? "#f3f4f6" : "#fff",
        color: checked ? "#374151" : "#9ca3af",
        transition: "background-color 150ms ease-out",
        letterSpacing: "0.02em",
      }}
    >
      ON
    </button>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        paddingRight: "8px",
        backgroundColor: checked ? "#f3f4f6" : "#fff",
      }}
    >
      {checked && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 7l3 3L11.5 4" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  </div>
);

// Small dropdown for permission options
const PermDropdown: React.FC<{
  value: string;
  options: string[];
  onChange: (v: string) => void;
}> = ({ value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: FONT,
          fontSize: "14px",
          fontWeight: 600,
          color: PRIMARY_TEXT,
          padding: "4px 0",
        }}
      >
        {value}
        <ChevronDown size={12} color="#555" style={{ transition: "transform 150ms ease-out", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div style={{
          position: "absolute",
          right: 0,
          top: "100%",
          backgroundColor: "#fff",
          border: "1px solid #cccccc",
          borderRadius: "4px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
          zIndex: 500,
          minWidth: "130px",
          overflow: "hidden",
        }}>
          {options.map((opt) => (
            <div
              key={opt}
              onClick={(e) => { e.stopPropagation(); onChange(opt); setOpen(false); }}
              style={{
                padding: "9px 14px",
                fontFamily: FONT,
                fontSize: "13px",
                fontWeight: opt === value ? 600 : 300,
                color: opt === value ? "#2563eb" : PRIMARY_TEXT,
                cursor: "pointer",
                backgroundColor: opt === value ? "#f0f5ff" : "#fff",
                transition: "background-color 100ms ease-out",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { if (opt !== value) (e.currentTarget as HTMLDivElement).style.backgroundColor = "#f9fafb"; }}
              onMouseLeave={(e) => { if (opt !== value) (e.currentTarget as HTMLDivElement).style.backgroundColor = "#fff"; }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// CRM object permission row
const CrmObjectRow: React.FC<{
  obj: { key: string; label: string; description: string };
  state: CrmObjectState;
  onChange: (key: string, updates: Partial<CrmObjectState>) => void;
}> = ({ obj, state, onChange }) => {
  const isExpanded = state.expanded;

  return (
    <div style={{ borderBottom: "1px solid #cccccc" }}>
      {/* Header row */}
      <div
        onClick={() => onChange(obj.key, { expanded: !state.expanded })}
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "16px 20px",
          cursor: "pointer",
          userSelect: "none",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", flex: 1, minWidth: 0 }}>
          <ChevronDown
            size={16}
            color="#374151"
            style={{
              flexShrink: 0,
              marginTop: "3px",
              transition: "transform 150ms ease-out",
              transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
            }}
          />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: FONT, fontSize: "16px", fontWeight: 600, color: PRIMARY_TEXT, margin: "0 0 4px 0" }}>
              {obj.label}
            </p>
            <p style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: "#666666", margin: "0 0 4px 0", lineHeight: "18px" }}>
              {obj.description}
            </p>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 600, color: "#006162", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "3px" }}
            >
              Manage property access <ExternalLink size={10} />
            </a>
            {!isExpanded && (
              <p style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 100, color: "#666666", margin: "4px 0 0 0" }}>
                View ({state.view})
              </p>
            )}
          </div>
        </div>
        {/* ON/OFF toggle */}
<div
  onClick={(e) => e.stopPropagation()}
  style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}
>
  <div
    style={{
      display: "flex",
      border: state.enabled ? "1px solid #000000" : "1px solid #d1d5db",
      borderRadius: "4px",
      overflow: "hidden",
      flexShrink: 0,
    }}
  >
    {/* ON BUTTON */}
    <button
      type="button"
      onClick={() => onChange(obj.key, { enabled: true })}
      style={{
        fontFamily: FONT,
        fontSize: "14px",
        fontWeight: 600,
        padding: "8px 16px",
        border: "none",
        borderRight: "1px solid #d1d5db",
        cursor: state.enabled ? "default" : "pointer",
        backgroundColor: state.enabled ? "#000000" : "#ffffff",
        color: "#ffffff",
        transition: "background-color 150ms ease-out",
        letterSpacing: "0.03em",
      }}
    >
      {state.enabled ? "ON" : ""}
    </button>

    {/* RIGHT BUTTON */}
    <button
      type="button"
      onClick={() => onChange(obj.key, { enabled: false })}
      style={{
        fontFamily: FONT,
        fontSize: "14px",
        fontWeight: 600,
        padding: state.enabled ? "8px 9px" : "8px 16px",
        border: "none",
        cursor: !state.enabled ? "default" : "pointer",
        backgroundColor: !state.enabled ? "#f3f4f6" : "#ffffff",
        color: "#374151",
        transition: "background-color 150ms ease-out",
        letterSpacing: "0.03em",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: state.enabled ? "34px" : "48px",
      }}
    >
      {state.enabled ? (
        <svg width="18" height="18" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6l2.5 2.5L10 3"
            stroke="#374151"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        "OFF"
      )}
    </button>
  </div>
</div>
      </div>

      {/* Expanded permission rows */}
      {isExpanded && (
        <div style={{ paddingBottom: "8px" }}>
          {/* View */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px 12px 46px",
            borderTop: "1px solid #f3f4f6",
          }}>
            <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 600, color: PRIMARY_TEXT }}>View</span>
            <PermDropdown
              value={state.view}
              options={["All contacts", "Own contacts", "Team contacts", "None"]}
              onChange={(v) => onChange(obj.key, { view: v as ViewOption })}
            />
          </div>

          {/* Create */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px 12px 46px",
            borderTop: "1px solid #f3f4f6",
          }}>
            <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 600, color: PRIMARY_TEXT }}>Create</span>
            <Toggle checked={state.create} onChange={() => onChange(obj.key, { create: !state.create })} small />
          </div>

          {/* Edit */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px 12px 46px",
            borderTop: "1px solid #f3f4f6",
          }}>
            <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 600, color: PRIMARY_TEXT }}>Edit</span>
            <PermDropdown
              value={state.edit}
              options={["All", "Own", "Team", "None"]}
              onChange={(v) => onChange(obj.key, { edit: v as EditOption })}
            />
          </div>

          {/* Delete */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px 12px 46px",
            borderTop: "1px solid #f3f4f6",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 600, color: PRIMARY_TEXT }}>Delete</span>
              <span style={{
                fontSize: "10px",
                fontFamily: FONT,
                fontWeight: 500,
                color: "#92400e",
                backgroundColor: "#fef3c7",
                border: "1px solid #f59e0b",
                borderRadius: "3px",
                padding: "1px 6px",
                letterSpacing: "0.02em",
              }}>Critical</span>
            </div>
            <PermDropdown
              value={state.delete}
              options={["All", "Own", "Team", "None"]}
              onChange={(v) => onChange(obj.key, { delete: v as DeleteOption })}
            />
          </div>

          {/* Merge */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px 12px 46px",
            borderTop: "1px solid #f3f4f6",
          }}>
            <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 600, color: PRIMARY_TEXT }}>Merge</span>
            <PermDropdown
              value={state.merge}
              options={["All", "Own", "None"]}
              onChange={(v) => onChange(obj.key, { merge: v as MergeOption })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Left nav item
const NavItem: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  indent?: boolean;
}> = ({ label, active, onClick, indent }) => (
  <div
    onClick={onClick}
    style={{
      padding: `8px 12px 8px ${indent ? "24px" : "12px"}`,
      fontFamily: FONT,
      fontSize: "13px",
      fontWeight: active ? 600 : 400,
      color: active ? PRIMARY_TEXT : "#374151",
      cursor: "pointer",
      backgroundColor: active ? "#f3f4f6" : "transparent",
      borderLeft: active ? "3px solid #374151" : "3px solid transparent",
      borderRadius: "0 4px 4px 0",
      transition: "background-color 100ms ease-out",
      userSelect: "none",
    }}
    onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = "#f9fafb"; }}
    onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"; }}
  >
    {label}
  </div>
);

// Full "Choose permissions" UI
const ChoosePermissionsPanel: React.FC<{ templateLabel: string; onReset: () => void }> = ({ templateLabel, onReset }) => {
  const [activeNav, setActiveNav] = useState(APP_PERMISSION_MODULES[0]?.categories[0]?.id ?? APP_PERMISSION_MODULES[0]?.id ?? "");
  const [expandedNavSections, setExpandedNavSections] = useState<{ [k: string]: boolean }>(() => {
    const initialState: { [k: string]: boolean } = {};
    APP_PERMISSION_MODULES.forEach((module, index) => {
      if (module.categories.length > 0) initialState[module.id] = index === 0;
    });
    return initialState;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [permissions, setPermissions] = useState<PermissionsState>(initPermissions);

  const expandedCount = CRM_OBJECTS.filter((obj) => permissions[obj.key]?.expanded).length;
  const allExpanded = expandedCount === CRM_OBJECTS.length;
  const someExpanded = expandedCount > 0 && !allExpanded;
  const activeNavLabel = NAV_SECTIONS.flatMap((section) => [
    { id: section.id, label: section.label },
    ...(section.children ?? []),
  ]).find((item) => item.id === activeNav)?.label ?? "this section";
  const isCrmSelection = activeNav.startsWith("crm-") || activeNav === "smart_crm";

  const handlePermChange = (key: string, updates: Partial<CrmObjectState>) => {
    setPermissions((prev) => ({ ...prev, [key]: { ...prev[key], ...updates } }));
  };

  const handleExpandAllToggle = () => {
    const shouldExpandAll = !allExpanded;
    setPermissions((prev) => {
      const next = { ...prev };
      CRM_OBJECTS.forEach((obj) => {
        next[obj.key] = { ...next[obj.key], expanded: shouldExpandAll };
      });
      return next;
    });
  };

  const toggleNavSection = (id: string) => {
    setExpandedNavSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredNavSections = NAV_SECTIONS.map((section) => {
    if (!searchQuery) return { ...section, hidden: false };

    const sectionMatches = section.label.toLowerCase().includes(searchQuery.toLowerCase());
    const filteredChildren = (section.children ?? []).filter((child) => child.label.toLowerCase().includes(searchQuery.toLowerCase()));

    return {
      ...section,
      children: sectionMatches ? section.children : filteredChildren,
      hidden: !sectionMatches && filteredChildren.length === 0,
    };
  }).filter((section) => !section.hidden);

  const filteredObjects = CRM_OBJECTS.filter(
    (obj) => !searchQuery || obj.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ marginTop: "0" }}>
      {/* Selected template bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        border: "1px solid #cccccc",
        borderRadius: "6px",
        padding: "12px 16px",
        marginBottom: "20px",
        backgroundColor: "#fff",
      }}>
        <span style={{ fontFamily: FONT, fontSize: "16px", fontWeight: 600, color: PRIMARY_TEXT }}>Selected template:</span>
        <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: PRIMARY_TEXT }}>{templateLabel}</span>
        <button
          type="button"
          onClick={onReset}
          style={{
            ...BASE_BUTTON,
            padding: "4px 12px",
            fontSize: "12px",
            fontWeight: 400,
            marginLeft: "4px",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f5f5f5"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#fff"; }}
        >
          Reset changes
        </button>
      </div>

      {/* Heading row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
        <h3 style={{ fontFamily: FONT, fontSize: "22px", fontWeight: 600, color: PRIMARY_TEXT, margin: 0 }}>
          Choose permissions
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Checkbox */}
          <div
            onClick={handleExpandAllToggle}
            style={{
              width: "18px",
              height: "18px",
              border: `2px solid ${(allExpanded || someExpanded) ? "#000" : "#d1d5db"}`,
              borderRadius: "3px",
              backgroundColor: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 150ms ease-out",
            }}
          >
            {allExpanded && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 5l2.5 2.5L8.5 2" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {!allExpanded && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5h6" stroke="#000" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <span
            onClick={handleExpandAllToggle}
            style={{ fontFamily: FONT, fontSize: "16px", fontWeight: 300, color: PRIMARY_TEXT, cursor: "pointer", userSelect: "none" }}
          >
            Expand all permissions
          </span>
          <Info size={14} color="#9ca3af" style={{ flexShrink: 0, cursor: "help" }} />
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "flex", gap: "0", overflow: "hidden", minHeight: "500px" }}>
        {/* Left sidebar */}
        <div style={{
          width: "275px",
          flexShrink: 0,
          backgroundColor: "#fff",
          padding: "12px 0",
        }}>
          {/* Search */}
          <div style={{ padding: "0 10px 10px", borderBottom: "1px solid #f3f4f6", marginBottom: "8px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "1px solid #d1d5db",
              borderRadius: "20px",
              padding: "6px 12px",
              backgroundColor: "#fff",
            }}>
              <Search size={13} color="#9ca3af" style={{ flexShrink: 0 }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                style={{
                  border: "none",
                  outline: "none",
                  flex: 1,
                  fontFamily: FONT,
                  fontSize: "16px",
                  fontWeight: 300,
                  color: PRIMARY_TEXT,
                  backgroundColor: "transparent",
                  padding: 0,
                }}
              />
            </div>
          </div>

          {/* Nav items */}
          {filteredNavSections.map((section) => (
            <div key={section.id}>
              <div
                onClick={() => {
                  if (section.expandable) {
                    toggleNavSection(section.id);
                    setActiveNav(section.id);
                  }
                  else setActiveNav(section.id);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  fontFamily: FONT,
                  fontSize: "14px",
                  fontWeight: activeNav === section.id ? 600 : 400,
                  color: PRIMARY_TEXT,
                  cursor: "pointer",
                  backgroundColor: !section.expandable && activeNav === section.id ? "#f3f4f6" : "transparent",
                  borderLeft: !section.expandable && activeNav === section.id ? "3px solid #374151" : "3px solid transparent",
                  transition: "background-color 100ms ease-out",
                  userSelect: "none",
                }}
                onMouseEnter={(e) => {
                  if (section.expandable || activeNav !== section.id)
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  if (!section.expandable || activeNav !== section.id)
                    (e.currentTarget as HTMLDivElement).style.backgroundColor =
                      !section.expandable && activeNav === section.id ? "#f3f4f6" : "transparent";
                }}
              >
                <span>{section.label}</span>
                {section.expandable && (
                  <ChevronDown
                    size={14}
                    color="#6b7280"
                    style={{ transition: "transform 150ms ease-out", transform: expandedNavSections[section.id] ? "rotate(0deg)" : "rotate(-90deg)" }}
                  />
                )}
              </div>
              {/* Children */}
              {section.expandable && expandedNavSections[section.id] && section.children && (
                <div>
                  {section.children.map((child) => (
                    <NavItem
                      key={child.id}
                      label={child.label}
                      active={activeNav === child.id}
                      onClick={() => setActiveNav(child.id)}
                      indent
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, minWidth: 0, backgroundColor: "#fff", overflowY: "auto", border: "1px solid #cccccc" }}>
          {isCrmSelection && (
            <div>
              {filteredObjects.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", fontFamily: FONT, fontSize: "13px", color: "#9ca3af" }}>
                  No results for "{searchQuery}"
                </div>
              ) : (
                filteredObjects.map((obj) => (
                  <CrmObjectRow
                    key={obj.key}
                    obj={obj}
                    state={permissions[obj.key]}
                    onChange={handlePermChange}
                  />
                ))
              )}
            </div>
          )}
          {!isCrmSelection && (
            <div style={{ padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "12px",
              }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v4m0 4v.01" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <p style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 400, color: "#6b7280", margin: 0, textAlign: "center" }}>
                Permissions for {activeNavLabel} are configured<br />in a future release.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Template section (rendered inside accordion when "template" is chosen) ───

const TemplateSection: React.FC = () => {
  const [chooseTplOpen, setChooseTplOpen] = useState(true);
  const [choosePermsOpen, setChoosePermsOpen] = useState(false);
  const [selectedTplId, setSelectedTplId] = useState("");
  const [permissionsReset, setPermissionsReset] = useState(0);

  const selectedItem = ALL_TEMPLATE_ITEMS.find((i) => i.id === selectedTplId);
  const selectedPermissions = selectedItem?.permissions ?? null;

  const handleTemplateChange = (id: string) => {
    setSelectedTplId(id);
  };

  const handleReset = () => {
    setPermissionsReset((n) => n + 1);
  };

  return (
    <>
      {/* ── Sub-accordion A: Choose a template ── */}
      <div style={{ borderTop: "1px solid #cccccc", borderBottom: "1px solid #cccccc" }}>
        {/* Header */}
        <div
          onClick={() => setChooseTplOpen((o) => !o)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            cursor: "pointer",
            userSelect: "none",
            backgroundColor: "#fff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ChevronDown
              size={16}
              color="#374151"
              style={{ transition: "transform 150ms ease-out", transform: chooseTplOpen ? "rotate(0deg)" : "rotate(-90deg)", flexShrink: 0 }}
            />
            <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 600, color: PRIMARY_TEXT }}>
              Choose a template
            </span>
          </div>
          {!chooseTplOpen && selectedItem && (
            <span style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 400, color: PRIMARY_TEXT }}>
              {selectedItem.label}
            </span>
          )}
        </div>

        {/* Body */}
        {chooseTplOpen && (
          <div style={{ padding: "4px 28px 28px" }}>
            <p style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: "#33475b", lineHeight: "22px", marginTop: 0, marginBottom: "18px" }}>
              Assign access based on a set of common roles, or base access on another user's permissions.
            </p>

            <div style={{ display: "flex", gap: "48px", alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0 }}>
                <p style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 600, color: PRIMARY_TEXT, margin: "0 0 8px 0" }}>
                  Choose a template
                </p>
                <TemplateDropdown value={selectedTplId} onChange={handleTemplateChange} />
              </div>

              <div style={{ minWidth: 0 }}>
                {!selectedTplId ? <MagnifyPlaceholder /> : <></>}
              </div>
            </div>

            {selectedTplId && selectedPermissions && <PermissionsGrid categories={selectedPermissions} />}
          </div>
        )}
      </div>

      {/* ── Sub-accordion B: Choose permissions ── */}
      <div>
        {/* Header */}
        <div
          onClick={() => { if (selectedTplId) setChoosePermsOpen((o) => !o); }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            cursor: selectedTplId ? "pointer" : "default",
            userSelect: "none",
            backgroundColor: "#fff",
            opacity: selectedTplId ? 1 : 0.45,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ChevronDown
              size={16}
              color={selectedTplId ? "#374151" : "#9ca3af"}
              style={{ transition: "transform 150ms ease-out", transform: choosePermsOpen ? "rotate(0deg)" : "rotate(-90deg)", flexShrink: 0 }}
            />
            <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: choosePermsOpen ? 600 : 400, color: selectedTplId ? PRIMARY_TEXT : "#9ca3af" }}>
              Choose permissions
            </span>
          </div>
        </div>

        {/* Body — NEW design */}
        {choosePermsOpen && selectedTplId && (
          <div style={{ padding: "4px 28px 28px" }}>
            <ChoosePermissionsPanel
              key={permissionsReset}
              templateLabel={selectedItem?.label ?? ""}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </>
  );
};

const ScratchPermissionsSection: React.FC = () => {
  const [choosePermsOpen, setChoosePermsOpen] = useState(true);
  const [permissionsReset, setPermissionsReset] = useState(0);

  const handleReset = () => {
    setPermissionsReset((n) => n + 1);
  };

  return (
    <div style={{ borderTop: "1px solid #cccccc", borderBottom: "1px solid #cccccc" }}>
      <div
        onClick={() => setChoosePermsOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          cursor: "pointer",
          userSelect: "none",
          backgroundColor: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ChevronDown
            size={16}
            color="#374151"
            style={{ transition: "transform 150ms ease-out", transform: choosePermsOpen ? "rotate(0deg)" : "rotate(-90deg)", flexShrink: 0 }}
          />
          <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: choosePermsOpen ? 600 : 400, color: PRIMARY_TEXT }}>
            Choose permissions
          </span>
        </div>
      </div>

      {choosePermsOpen && (
        <div style={{ padding: "4px 28px 28px" }}>
          <ChoosePermissionsPanel
            key={permissionsReset}
            templateLabel="Custom permissions"
            onReset={handleReset}
          />
        </div>
      )}
    </div>
  );
};

// ─── Step indicator ──────────────────────────────────────────────────────────

const StepIndicator: React.FC<{ current: number }> = ({ current }) => {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", width: "100%" }}>
      {STEPS.map((step, idx) => {
        const isActive = idx === current;
        const isDone = idx < current;
        const isLast = idx === STEPS.length - 1;

        const circleColor = isActive || isDone ? "#e8390e" : "#fff";
        const circleBorder = isActive || isDone ? "#e8390e" : "#9ca3af";
        const labelColor = isActive ? "#e8390e" : PRIMARY_TEXT;
        const labelWeight = isActive ? 600 : 400;

        return (
          <div
            key={step.id}
            style={{ display: "flex", alignItems: "center", flex: isLast ? "0 0 auto" : 1, minWidth: 0 }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  border: `2px solid ${circleBorder}`,
                  backgroundColor: circleColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxSizing: "border-box",
                }}
              >
                {isDone && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{ fontFamily: FONT, fontSize: "12px", fontWeight: labelWeight, color: labelColor, letterSpacing: "0px", whiteSpace: "nowrap" }}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div style={{ flex: 1, height: "2px", backgroundColor: isDone ? "#e8390e" : "#d1d5db", marginTop: "11px" }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Email chip ──────────────────────────────────────────────────────────────

const EmailChip: React.FC<{ email: string; onRemove?: () => void }> = ({ email, onRemove }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      border: "1px solid #9ca3af",
      borderRadius: "20px",
      padding: "3px 10px 3px 12px",
      fontSize: "13px",
      fontFamily: FONT,
      fontWeight: 300,
      color: PRIMARY_TEXT,
      backgroundColor: "#fff",
      lineHeight: "18px",
    }}
  >
    {email}
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: "#6b7280", lineHeight: 1 }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#374151"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; }}
      >
        <X size={12} />
      </button>
    )}
  </div>
);

// ─── Step 1 — Select User ────────────────────────────────────────────────────

interface Step1Props {
  emails: string[];
  onAddEmail: (email: string) => void;
  onRemoveEmail: (email: string) => void;
}

const StepEmail: React.FC<Step1Props> = ({ emails, onAddEmail, onRemoveEmail }) => {
  const [selectedUser, setSelectedUser] = useState("");
  const availableUsers = SELECTABLE_USERS.filter((u) => !emails.includes(u.email));

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "48px", width: "100%" }}>
      <h2 style={{ fontFamily: FONT, fontSize: "22px", fontWeight: 500, color: PRIMARY_TEXT, marginBottom: "16px", marginTop: 0, textAlign: "center" }}>
        Select user
      </h2>
      <p style={{ fontFamily: FONT, fontWeight: 300, fontSize: "14px", color: "#33475b", lineHeight: "24px", marginBottom: "16px", textAlign: "center" }}>
        Select one or more users from the list to continue.
      </p>

      {emails.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", marginBottom: "16px", maxWidth: "520px" }}>
          {emails.map((email) => (
            <EmailChip key={email} email={email} onRemove={() => onRemoveEmail(email)} />
          ))}
        </div>
      )}

      <div style={{ width: "100%", maxWidth: "520px" }}>
        <div style={{ position: "relative" }}>
          <select
            value={selectedUser}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedUser(v);
              if (!v) return;
              if (!emails.includes(v)) onAddEmail(v);
              setSelectedUser("");
            }}
            style={{
              backgroundColor: "#fff",
              border: "1px solid rgb(138, 138, 138)",
              borderRadius: "4px",
              color: PRIMARY_TEXT,
              display: "block",
              fontFamily: FONT,
              fontSize: "16px",
              fontWeight: 300,
              height: "40px",
              lineHeight: "24px",
              paddingInline: "16px",
              paddingRight: "40px",
              paddingBlock: "8px",
              width: "100%",
              cursor: "pointer",
              outline: "none",
              boxSizing: "border-box",
              appearance: "none",
              WebkitAppearance: "none",
            }}
            onFocus={(e) => { e.target.style.borderColor = "#2563eb"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgb(138,138,138)"; }}
          >
            <option value="">Select a user…</option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.email}>{user.name} ({user.email})</option>
            ))}
          </select>
          <ChevronDown size={16} color="#555" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", flexShrink: 0 }} />
        </div>
        {availableUsers.length === 0 && (
          <p style={{ fontFamily: FONT, fontSize: "11px", color: "#9ca3af", marginTop: "4px", marginBottom: 0 }}>
            All users in the list are already selected.
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Seat Search Dropdown ─────────────────────────────────────────────────────

interface SeatSearchDropdownProps {
  value: string;
  onChange: (id: string, label: string) => void;
}

const SeatSearchDropdown: React.FC<SeatSearchDropdownProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = SEAT_OPTIONS.filter((s) =>
    s.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  const selectedLabel = SEAT_OPTIONS.find((s) => s.id === value)?.label ?? "";

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          height: "42px",
          border: `1px solid ${open ? "#2563eb" : "rgb(138,138,138)"}`,
          borderRadius: open ? "4px 4px 0 0" : "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          cursor: "pointer",
          backgroundColor: "#fff",
          boxSizing: "border-box",
          transition: "border-color 150ms ease-out",
          gap: "8px",
        }}
      >
        {open ? (
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            onClick={(e) => e.stopPropagation()}
            style={{
              border: "none",
              outline: "none",
              flex: 1,
              fontFamily: FONT,
              fontSize: "14px",
              fontWeight: 300,
              color: PRIMARY_TEXT,
              backgroundColor: "transparent",
              padding: 0,
            }}
          />
        ) : (
          <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: selectedLabel ? PRIMARY_TEXT : "#9ca3af", flex: 1 }}>
            {selectedLabel || "Search"}
          </span>
        )}
        <ChevronDown
          size={16}
          color="#555"
          style={{ flexShrink: 0, transition: "transform 150ms ease-out", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            border: "1px solid #2563eb",
            borderTop: "none",
            borderRadius: "0 0 4px 4px",
            backgroundColor: "#fff",
            zIndex: 1001,
            maxHeight: "260px",
            overflowY: "auto",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: "14px 16px", fontFamily: FONT, fontSize: "13px", color: "#9ca3af" }}>
              No results found
            </div>
          ) : (
            filtered.map((seat, idx) => (
              <div
                key={seat.id}
                onClick={() => {
                  onChange(seat.id, seat.label);
                  setSearch("");
                  setOpen(false);
                }}
                style={{
                  padding: "12px 16px",
                  borderBottom: idx < filtered.length - 1 ? "1px solid #f3f4f6" : "none",
                  cursor: "pointer",
                  backgroundColor: seat.id === value ? "#f0f5ff" : "#fff",
                  transition: "background-color 100ms ease-out",
                }}
                onMouseEnter={(e) => {
                  if (seat.id !== value) (e.currentTarget as HTMLDivElement).style.backgroundColor = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  if (seat.id !== value) (e.currentTarget as HTMLDivElement).style.backgroundColor = "#fff";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                  <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 400, color: PRIMARY_TEXT }}>
                    {seat.label}
                  </span>
                  {seat.badge && (
                    <span style={{
                      backgroundColor: seat.badge.color,
                      color: "#fff",
                      fontSize: "10px",
                      fontWeight: 600,
                      fontFamily: FONT,
                      padding: "2px 9px",
                      borderRadius: "20px",
                      letterSpacing: "0.02em",
                    }}>
                      {seat.badge.text}
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 300, color: "#6b7280" }}>
                  {seat.sublabel}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ─── Access card ──────────────────────────────────────────────────────────────

interface AccessCardProps {
  method: AccessMethod;
  selected: boolean;
  onSelect: () => void;
}

const AccessCard: React.FC<AccessCardProps> = ({ method, selected, onSelect }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: "1 1 0",
        minWidth: 0,
        border: `1px solid ${selected ? "#9ca3af" : "#cccccc"}`,
        borderRadius: "6px",
        padding: "40px 21px 66px",
        cursor: "pointer",
        backgroundColor: selected ? "#f3f4f6" : hovered ? "#fafafa" : "#fff",
        transition: "background-color 120ms ease-out, border-color 120ms ease-out",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      <div style={{ position: "absolute", top: "12px", right: "12px" }}>
        <div style={{
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          border: `2px solid ${selected ? PRIMARY_TEXT : "#d1d5db"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
          boxSizing: "border-box",
        }}>
          {selected && (
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: PRIMARY_TEXT }} />
          )}
        </div>
      </div>

      <div style={{ height: "90px", display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: "14px" }}>
        {method.icon}
      </div>

      <p style={{
        fontFamily: FONT,
        fontSize: "16px",
        fontWeight: 600,
        color: PRIMARY_TEXT,
        textAlign: "center",
        margin: "0 0 6px 0",
        lineHeight: "18px",
      }}>
        {method.title}
      </p>

      <p style={{
        fontFamily: FONT,
        fontSize: "14px",
        fontWeight: 100,
        color: "#666666",
        textAlign: "center",
        margin: 0,
        lineHeight: "17px",
      }}>
        {method.description}
      </p>
    </div>
  );
};

// ─── Step 2 — Access ─────────────────────────────────────────────────────────

interface Step2Props {
  emails: string[];
  seatId: string;
  seatLabel: string;
  onSeatChange: (id: string, label: string) => void;
  accessMethod: string;
  onAccessMethodChange: (id: string) => void;
}

const StepAccess: React.FC<Step2Props> = ({
  emails,
  seatId,
  seatLabel,
  onSeatChange,
  accessMethod,
  onAccessMethodChange,
}) => {
  const [seatOpen, setSeatOpen] = useState(true);
  const [accessOpen, setAccessOpen] = useState(false);
  const showPermissionsAccordion = (accessMethod === "template" || accessMethod === "scratch") && !!seatId;

  const handleSeatChange = (id: string, label: string) => {
    onSeatChange(id, label);
    if (id) {
      setSeatOpen(false);
      setAccessOpen(true);
    }
  };

  const accessMethodLabel = ACCESS_METHODS.find((m) => m.id === accessMethod)?.title ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "40px", width: "100%" }}>
      <h2 style={{ fontFamily: FONT, fontSize: "22px", fontWeight: 500, color: PRIMARY_TEXT, marginBottom: "10px", marginTop: 0, textAlign: "center" }}>
        Set up user access levels
      </h2>
      <p style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: "#33475b", lineHeight: "22px", marginBottom: "16px", textAlign: "center", maxWidth: "560px" }}>
        Assign a seat to give users access to features. Narrow down that access with permissions.
      </p>

      {emails.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", marginBottom: "28px" }}>
          {emails.map((email) => (
            <EmailChip key={email} email={email} />
          ))}
        </div>
      )}

      <div style={{ width: "100%", border: "1px solid #cccccc", borderRadius: "6px", overflow: "visible", position: "relative" }}>

        {/* ── Section 1: Assign a seat ── */}
        <div style={{ borderBottom: "1px solid #cccccc" }}>
          <div
            onClick={() => setSeatOpen((o) => !o)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: "pointer", userSelect: "none", backgroundColor: "#fff" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ChevronDown size={16} color="#374151" style={{ transition: "transform 150ms ease-out", transform: seatOpen ? "rotate(0deg)" : "rotate(-90deg)", flexShrink: 0 }} />
              <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 600, color: PRIMARY_TEXT }}>Assign a seat</span>
            </div>
            {!seatOpen && seatLabel && (
              <span style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 400, color: PRIMARY_TEXT }}>{seatLabel}</span>
            )}
          </div>

          {seatOpen && (
            <div style={{ padding: "4px 28px 28px" }}>
              <p style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 600, color: PRIMARY_TEXT, marginBottom: "3px", marginTop: 0 }}>
                Seat assignment
              </p>
              <p style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: "#374151", marginBottom: "14px", marginTop: 0, lineHeight: "20px" }}>
                Seats give users access to features.{" "}
                <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "#006162", textDecoration: "none", fontWeight: 400, display: "inline-flex", alignItems: "center", gap: "3px" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none"; }}>
                  Learn more about seats <ExternalLink size={11} />
                </a>
              </p>
              <div style={{ maxWidth: "420px" }}>
                <SeatSearchDropdown value={seatId} onChange={handleSeatChange} />
              </div>
              <p style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: "#374151", marginTop: "16px", marginBottom: 0, lineHeight: "20px" }}>
                Visit{" "}
                <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "#006162", textDecoration: "none", fontWeight: 400, display: "inline-flex", alignItems: "center", gap: "3px" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none"; }}>
                  Products &amp; Services Catalog <ExternalLink size={11} />
                </a>{" "}
                to see the features included with each subscription.
              </p>
            </div>
          )}
        </div>

        {/* ── Section 2: Choose how to set access ── */}
        <div style={{ borderBottom: showPermissionsAccordion ? "1px solid #cccccc" : "none" }}>
          <div
            onClick={() => { if (seatId) setAccessOpen((o) => !o); }}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: seatId ? "pointer" : "default", userSelect: "none", backgroundColor: "#fff", opacity: seatId ? 1 : 0.55 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ChevronDown size={16} color={seatId ? "#374151" : "#9ca3af"} style={{ transition: "transform 150ms ease-out", transform: accessOpen ? "rotate(0deg)" : "rotate(-90deg)", flexShrink: 0 }} />
              <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 600, color: seatId ? PRIMARY_TEXT : "#9ca3af" }}>
                Choose how to set access
              </span>
            </div>
            {!accessOpen && accessMethodLabel && seatId && (
              <span style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 400, color: PRIMARY_TEXT }}>{accessMethodLabel}</span>
            )}
          </div>

          {accessOpen && seatId && (
            <div style={{ padding: "4px 20px 24px" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                {ACCESS_METHODS.map((method) => (
                  <AccessCard
                    key={method.id}
                    method={method}
                    selected={accessMethod === method.id}
                    onSelect={() => onAccessMethodChange(method.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sections 3 & 4: Only shown when "Start with a template" is selected ── */}
        {accessMethod === "template" && seatId && (
          <TemplateSection />
        )}

        {accessMethod === "scratch" && seatId && (
          <ScratchPermissionsSection />
        )}

      </div>
    </div>
  );
};

// ─── Step 3 — Review (redesigned to match design image) ──────────────────────

// Helper: user avatar initials
const UserAvatar: React.FC<{ email: string }> = ({ email }) => {
  const initial = email.charAt(0).toUpperCase();
  return (
    <div style={{
      width: "72px",
      height: "72px",
      borderRadius: "50%",
      backgroundColor: "#e5e7eb",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}>
      <span style={{ fontFamily: FONT, fontSize: "29px", fontWeight: 600, color: "#141414" }}>{initial}</span>
    </div>
  );
};

// CriticalBadge
const CriticalBadge = () => (
  <span style={{
    display: "inline-flex",
    alignItems: "center",
    fontFamily: FONT,
    fontSize: "11px",
    fontWeight: 500,
    color: "#374151",
    backgroundColor: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: "3px",
    padding: "1px 7px",
    marginLeft: "6px",
    letterSpacing: "0.01em",
    verticalAlign: "middle",
  }}>
    critical
  </span>
);

// Permission summary for a single CRM object (used in review)
interface ReviewPermRow {
  label: string;
  detail: string;
  isCritical?: boolean;
}

// Build readable permission lines from CrmObjectState
const buildPermissionLines = (state: CrmObjectState): ReviewPermRow[] => {
  const lines: ReviewPermRow[] = [];

  // View line
  lines.push({ label: "View", detail: `(${state.view})` });

  // Create
  if (state.create) lines.push({ label: "Create", detail: "" });

  // Edit
  if (state.edit !== "None") lines.push({ label: "Edit", detail: `(${state.edit})` });

  // Delete
  if (state.delete !== "None") lines.push({ label: "Delete", detail: `(${state.delete})`, isCritical: true });

  // Merge
  if (state.merge !== "None") lines.push({ label: "Merge", detail: `(${state.merge})` });

  return lines;
};

// Review accordion section (CRM objects, CRM tools, etc.)
const ReviewSection: React.FC<{
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, count, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ marginBottom: "4px" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          userSelect: "none",
          marginBottom: open ? "10px" : "0",
        }}
      >
        <ChevronDown
          size={15}
          color="#374151"
          style={{ transition: "transform 150ms ease-out", transform: open ? "rotate(0deg)" : "rotate(-90deg)", flexShrink: 0 }}
        />
        <span style={{ fontFamily: FONT, fontSize: "16px", fontWeight: 600, color: PRIMARY_TEXT }}>
          {title} ({count})
        </span>
      </div>
      {open && <div style={{ paddingLeft: "4px" }}>{children}</div>}
    </div>
  );
};

// A single CRM object permission block in the review
const ReviewObjectBlock: React.FC<{
  label: string;
  lines: ReviewPermRow[];
}> = ({ label, lines }) => (
  <div style={{ marginBottom: "14px" }}>
    <p style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 400, color: "#6b7280", margin: "0 0 2px 22px" }}>
      {label}
    </p>
    <p style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 400, color: PRIMARY_TEXT, margin: "0 0 0 22px", lineHeight: "20px" }}>
      {lines.map((line, idx) => (
        <React.Fragment key={line.label}>
          <strong style={{ fontWeight: 600 }}>{line.label}</strong>
          {line.detail && ` ${line.detail}`}
          {line.isCritical && <CriticalBadge />}
          {idx < lines.length - 1 && <span style={{ color: "#9ca3af" }}>{", "}</span>}
          {idx === lines.length - 2 && lines.length > 1 && <span>{" and "}</span>}
        </React.Fragment>
      ))}
    </p>
  </div>
);

// CRM Tools review items (static, representing the on/off tool states)
const REVIEW_CRM_TOOLS = [
  { label: "Communicate", value: "All records" },
  { label: "Bulk delete", value: "On", critical: true },
  { label: "Import", value: "On", critical: true },
  { label: "Export", value: "On", critical: true },
  { label: "Edit associations", value: "On" },
  { label: "Custom views", value: "On" },
];

interface Step3Props {
  emails: string[];
  seatLabel: string;
  accessMethod: string;
}

const StepReview: React.FC<Step3Props> = ({ emails, seatLabel, accessMethod }) => {
  const [noEmailInvite, setNoEmailInvite] = useState(false);
  const [teamsOpen, setTeamsOpen] = useState(false);
  const teamsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (teamsRef.current && !teamsRef.current.contains(e.target as Node)) setTeamsOpen(false);
    };
    if (teamsOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [teamsOpen]);

  // Build mock permission states for the review (using initPermissions defaults + full access demo)
  const demoPermissions: PermissionsState = {
    contacts: { enabled: true, view: "All contacts", create: true, edit: "All contacts" as any, delete: "All contacts" as any, merge: "All contacts" as any, expanded: false },
    companies: { enabled: true, view: "All contacts", create: true, edit: "All contacts" as any, delete: "All contacts" as any, merge: "All contacts" as any, expanded: false },
    deals: { enabled: true, view: "All contacts", create: true, edit: "All contacts" as any, delete: "All contacts" as any, merge: "All contacts" as any, expanded: false },
    orders: { enabled: true, view: "All contacts", create: false, edit: "None", delete: "None", merge: "None", expanded: false },
    tickets: { enabled: true, view: "All contacts", create: true, edit: "All contacts" as any, delete: "All contacts" as any, merge: "All contacts" as any, expanded: false },
    tasks: { enabled: true, view: "All contacts", create: false, edit: "All contacts" as any, delete: "None", merge: "None", expanded: false },
  };

  // Build review lines per object
  const buildDemoLines = (key: string): ReviewPermRow[] => {
    const s = demoPermissions[key];
    const lines: ReviewPermRow[] = [];
    lines.push({ label: "View", detail: `(All ${key})` });
    if (s.create) lines.push({ label: "Create", detail: "" });
    if (s.edit !== "None") lines.push({ label: "Edit", detail: `(All ${key})` });
    if (s.delete !== "None") lines.push({ label: "Delete", detail: `(All ${key})`, isCritical: true });
    if (s.merge !== "None") lines.push({ label: "Merge", detail: `(All ${key})` });
    return lines;
  };

  const crmObjectsWithLines = [
    { key: "contacts", label: "Contacts", lines: buildDemoLines("contacts") },
    { key: "companies", label: "Companies", lines: buildDemoLines("companies") },
    { key: "deals", label: "Deals", lines: buildDemoLines("deals") },
    { key: "orders", label: "Orders", lines: [{ label: "View", detail: "" }] },
    { key: "tickets", label: "Tickets", lines: buildDemoLines("tickets") },
    { key: "tasks", label: "Tasks", lines: [{ label: "View", detail: "(All tasks)" }, { label: "Edit", detail: "(All tasks)" }] },
    { key: "crm_emails", label: "CRM emails", lines: [{ label: "View", detail: "(All CRM emails)" }, { label: "Edit", detail: "(All CRM emails and unassigned)" }] },
    { key: "meetings", label: "Meetings", lines: [{ label: "View", detail: "(All meetings and unassigned)" }] },
    { key: "calls", label: "Calls", lines: [{ label: "View", detail: "(All calls and unassigned)" }] },
    { key: "notes", label: "Notes", lines: [{ label: "View", detail: "(Notes they own)" }, { label: "Edit", detail: "(All notes and unassigned)" }] },
    { key: "projects", label: "Projects", lines: [{ label: "View", detail: "(All projects)" }, { label: "Edit", detail: "(All projects)" }, { label: "Delete", detail: "(All projects)", isCritical: true }] },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "36px", width: "100%", paddingBottom: "48px" }}>
      {/* Title */}
      <h2 style={{ fontFamily: FONT, fontSize: "24px", fontWeight: 500, color: PRIMARY_TEXT, marginBottom: "10px", marginTop: 0, textAlign: "center" }}>
        Review user access
      </h2>
      <p style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: "#141414", marginBottom: "28px", textAlign: "center", lineHeight: "20px" }}>
        You're almost done. Check all the access settings to make sure everything looks good.
      </p>

      <div style={{ width: "100%", maxWidth: "560px" }}>

        {/* ── Users section ── */}
        <div style={{ marginBottom: "28px" }}>
          <h3 style={{ fontFamily: FONT, fontSize: "15px", fontWeight: 700, color: PRIMARY_TEXT, margin: "0 0 14px 0" }}>
            Users
          </h3>

          {emails.map((email) => (
            <div key={email} style={{ marginBottom: "12px" }}>
              {/* User row */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <UserAvatar email={email} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: FONT, fontSize: "24px", fontWeight: 300, color: PRIMARY_TEXT, margin: "0 0 2px 0" }}>
                    {email}
                  </p>
                  {/* Teams dropdown */}
                  <div ref={teamsRef} style={{ position: "relative", display: "inline-block" }}>
                    <button
                      type="button"
                      onClick={() => setTeamsOpen((o) => !o)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: FONT,
                        fontSize: "14px",
                        fontWeight: 300,
                        color: "#141414",
                        padding: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      Teams: <span style={{ fontWeight: 600, marginLeft: "4px" }}>No team assigned</span>
                      <ChevronDown size={12} color="#141414" style={{ transition: "transform 150ms ease-out", transform: teamsOpen ? "rotate(180deg)" : "none" }} />
                    </button>
                    {teamsOpen && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        marginTop: "4px",
                        backgroundColor: "#fff",
                        border: "1px solid #cccccc",
                        borderRadius: "4px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
                        zIndex: 500,
                        minWidth: "180px",
                        overflow: "hidden",
                      }}>
                        <div style={{ padding: "8px 12px 6px", fontFamily: FONT, fontSize: "11px", fontWeight: 700, color: "#141414", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Teams
                        </div>
                        <div style={{ padding: "6px 12px 6px", fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: "#141414", borderTop: "1px solid #f3f4f6" }}>
                          No teams available
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* No email invite checkbox */}
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}
                onClick={() => setNoEmailInvite((v) => !v)}
              >
                <div style={{
                  width: "16px",
                  height: "16px",
                  border: `1px solid ${noEmailInvite ? "#374151" : "#9ca3af"}`,
                  borderRadius: "3px",
                  backgroundColor: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "1px",
                  boxSizing: "border-box",
                  transition: "border-color 150ms ease-out",
                  margin: "11px 0",
                }}>
                  {noEmailInvite && (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M1.5 4.5l2 2L7.5 2" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <p style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 100, color: "#141414", margin: "8px 0", lineHeight: "18px", maxWidth: "520px" }}>
                  Don't send an email invite when this user is added. They'll still get access to this account once they log in.
                </p>
              </div>
            </div>
          ))}

          {/* Super admin note */}
          {accessMethod === "super_admin" && (
            <p style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: "#374151", margin: "8px 0 0 0", lineHeight: "20px" }}>
              Note: To protect your account, we'll notify all Super Admins when a new Super Admin is added.
            </p>
          )}
        </div>

        {/* ── Seat assignment section ── */}
        <div style={{ marginBottom: "28px" }}>
          <h3 style={{ fontFamily: FONT, fontSize: "16px", fontWeight: 700, color: PRIMARY_TEXT, margin: "0 0 8px 0" }}>
            Seat assignment
          </h3>
          <p style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: seatLabel ? PRIMARY_TEXT : "#9ca3af", margin: 0 }}>
            {seatLabel || "No seat selected"}
          </p>
        </div>

        {/* ── Permissions section ── */}
        <div>
          <h3 style={{ fontFamily: FONT, fontSize: "16px", fontWeight: 700, color: PRIMARY_TEXT, margin: "0 0 16px 0" }}>
            Permissions
          </h3>

          {/* CRM objects */}
          <ReviewSection title="CRM objects" count={crmObjectsWithLines.length}>
            {crmObjectsWithLines.map((obj) => (
              <ReviewObjectBlock key={obj.key} label={obj.label} lines={obj.lines} />
            ))}
          </ReviewSection>

          {/* CRM tools */}
          <ReviewSection title="CRM tools" count={REVIEW_CRM_TOOLS.length} defaultOpen={true}>
            {REVIEW_CRM_TOOLS.map((tool) => (
              <div key={tool.label} style={{ marginBottom: "12px", paddingLeft: "22px" }}>
                <p style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 400, color: "#6b7280", margin: "0 0 2px 0" }}>
                  {tool.label}
                </p>
                <p style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 400, color: PRIMARY_TEXT, margin: 0, display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0" }}>
                  <strong style={{ fontWeight: 600 }}>{tool.value}</strong>
                  {tool.critical && <CriticalBadge />}
                </p>
              </div>
            ))}
          </ReviewSection>
        </div>
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const CreateUsersPage = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [emails, setEmails] = useState<string[]>([]);
  const [seatId, setSeatId] = useState("");
  const [seatLabel, setSeatLabel] = useState("");
  const [accessMethod, setAccessMethod] = useState("seat_permissions");
  const [submitting, setSubmitting] = useState(false);

  const totalSteps = STEPS.length;

  const handleAddEmail = useCallback((email: string) => {
    setEmails((prev) => [...prev, email]);
  }, []);

  const handleRemoveEmail = useCallback((email: string) => {
    setEmails((prev) => prev.filter((e) => e !== email));
  }, []);

  const handleSeatChange = useCallback((id: string, label: string) => {
    setSeatId(id);
    setSeatLabel(label);
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep === 0 && emails.length === 0) {
      toast.error("Please select at least one user to continue.");
      return;
    }
    if (currentStep === 1 && !seatId) {
      toast.error("Please assign a seat before continuing.");
      return;
    }
    if (currentStep < totalSteps - 1) setCurrentStep((s) => s + 1);
  }, [currentStep, emails, seatId, totalSteps]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const handleCreate = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      toast.success(`${emails.length} user${emails.length !== 1 ? "s" : ""} created successfully!`);
      router.push("/settings/users");
    } catch {
      toast.error("Failed to create users. Please try again.");
      setSubmitting(false);
    }
  }, [submitting, emails, router]);

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, backgroundColor: "#fff", display: "flex", flexDirection: "column", fontFamily: FONT }}>

      {/* ── Top bar ── */}
      <div style={{ minHeight: "84px", display: "flex", alignItems: "center", paddingInline: "24px", flexShrink: 0, position: "relative" }}>
        <div style={{ width: "70%", margin: "0 auto" }}>
          <StepIndicator current={currentStep} />
        </div>
        <button
          type="button"
          onClick={handleCancel}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", color: "#6b7280", transition: "color 150ms ease-out", position: "absolute", right: "24px" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = PRIMARY_TEXT; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; }}
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: "1200px" }}>
          {currentStep === 0 && (
            <StepEmail emails={emails} onAddEmail={handleAddEmail} onRemoveEmail={handleRemoveEmail} />
          )}
          {currentStep === 1 && (
            <StepAccess
              emails={emails}
              seatId={seatId}
              seatLabel={seatLabel}
              onSeatChange={handleSeatChange}
              accessMethod={accessMethod}
              onAccessMethodChange={setAccessMethod}
            />
          )}
          {currentStep === 2 && (
            <StepReview emails={emails} seatLabel={seatLabel} accessMethod={accessMethod} />
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ height: "60px", borderTop: "1px solid #cccccc", display: "flex", alignItems: "center", justifyContent: "space-between", paddingInline: "24px", flexShrink: 0, backgroundColor: "#fff" }}>
        {currentStep === 0 ? (
          <button
            type="button"
            onClick={handleCancel}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT, fontSize: "13px", fontWeight: 400, color: "#2563eb", textDecoration: "underline", padding: 0, transition: "opacity 150ms ease-out" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.75"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={handleBack}
            style={{ ...BASE_BUTTON }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f5f5f5"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#fff"; }}
          >
            Back
          </button>
        )}

        {isLastStep ? (
          <button
            type="button"
            onClick={handleCreate}
            disabled={submitting}
            style={{ ...BASE_BUTTON, backgroundColor: submitting ? "#374151" : "#141414", borderColor: "#141414", color: "#fff", fontWeight: 400, paddingInline: "27px", fontSize: "14px", opacity: submitting ? 0.7 : 1, cursor: submitting ? "not-allowed" : "pointer" }}
            onMouseEnter={(e) => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#374151"; }}
            onMouseLeave={(e) => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#111827"; }}
          >
            {submitting ? "Saving…." : "Save"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            style={{ ...BASE_BUTTON, backgroundColor: "#141414", borderColor: "#141414", color: "#fff", fontWeight: 600, paddingInline: "27px", fontSize: "14px" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#374151"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#111827"; }}
          >
            Next <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};


export default CreateUsersPage;
