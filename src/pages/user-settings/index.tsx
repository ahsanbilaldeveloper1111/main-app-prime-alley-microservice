import React, {
    ReactElement,
    useState,
    useCallback,
    useRef,
    useEffect,
  } from "react";
  import { useRouter } from "next/router";
  import { toast } from "react-toastify";
  import { X, ChevronRight, ChevronDown, ExternalLink, Search } from "lucide-react";
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
  
  const VIEW_ONLY_PERMISSIONS: PermCategory[] = [
    {
      title: "CRM objects",
      items: [
        { name: "Contacts", status: "green-circle" },
        { name: "Companies", status: "green-circle" },
        { name: "Deals", status: "green-circle" },
        { name: "Orders", status: "green-circle" },
        { name: "Carts", status: "green-circle" },
        { name: "Tickets", status: "green-circle" },
        { name: "Tasks", status: "green-circle" },
        { name: "CRM emails", status: "green-circle" },
        { name: "Meetings", status: "green-circle" },
        { name: "Calls", status: "green-circle" },
        { name: "Notes", status: "green-circle" },
        { name: "Projects", status: "green-circle" },
      ],
    },
    {
      title: "CRM tools",
      items: [
        { name: "Communicate", status: "grey-dot" },
        { name: "Bulk delete", status: "grey-dot" },
        { name: "Import", status: "grey-dot" },
        { name: "Export", status: "grey-dot" },
        { name: "Edit associations", status: "grey-dot" },
        { name: "Custom views", status: "grey-dot" },
        { name: "Customize record page layout", status: "grey-dot" },
        { name: "View connected record data", status: "grey-dot" },
      ],
    },
    {
      title: "Marketing",
      items: [
        { name: "Segments", status: "green-circle" },
        { name: "Forms", status: "grey-dot" },
        { name: "Delete form submissions", status: "grey-dot" },
        { name: "Files", status: "grey-dot" },
        { name: "Marketing Access", status: "green-dot" },
        { name: "Ads", status: "green-circle" },
        { name: "Marketing email", status: "green-circle" },
        { name: "CTA", status: "green-circle" },
        { name: "SMS", status: "green-circle" },
        { name: "Buyer Intent", status: "green-circle" },
        { name: "Social", status: "grey-dot" },
        { name: "Marketing Events", status: "grey-dot" },
        { name: "Blog", status: "green-circle" },
        { name: "Landing pages", status: "green-circle" },
        { name: "Website pages", status: "green-circle" },
        { name: "URL Redirects", status: "green-circle" },
      ],
    },
    {
      title: "Sales",
      items: [
        { name: "Sales Access", status: "grey-dot" },
        { name: "Templates", status: "grey-dot" },
        { name: "Meeting scheduling pages", status: "grey-dot" },
        { name: "Sales Starter", status: "grey-dot" },
        { name: "Forecasts", status: "grey-dot" },
      ],
    },
  ];
  
  const STANDARD_USER_PERMISSIONS: PermCategory[] = [
    {
      title: "CRM objects",
      items: [
        { name: "Contacts", status: "green-circle" },
        { name: "Companies", status: "green-circle" },
        { name: "Deals", status: "green-circle" },
        { name: "Orders", status: "green-circle" },
        { name: "Tickets", status: "green-circle" },
        { name: "Tasks", status: "green-circle" },
      ],
    },
    {
      title: "CRM tools",
      items: [
        { name: "Communicate", status: "green-dot" },
        { name: "Import", status: "green-dot" },
        { name: "Export", status: "green-dot" },
        { name: "Custom views", status: "green-dot" },
      ],
    },
    {
      title: "Marketing",
      items: [
        { name: "Marketing Access", status: "green-dot" },
        { name: "Marketing email", status: "green-circle" },
        { name: "Blog", status: "green-circle" },
        { name: "Landing pages", status: "green-circle" },
      ],
    },
    {
      title: "Sales",
      items: [
        { name: "Sales Access", status: "green-dot" },
        { name: "Templates", status: "green-dot" },
        { name: "Meeting scheduling pages", status: "green-dot" },
      ],
    },
  ];
  
  const TEMPLATE_GROUPS: TemplateGroup[] = [
    {
      groupLabel: "Suggested templates",
      items: [
        { id: "view_only_tpl", label: "View only", permissions: VIEW_ONLY_PERMISSIONS },
      ],
    },
    {
      groupLabel: "Role templates",
      items: [
        {
          id: "super_admin_tpl",
          label: "Super Admin",
          sublabel: "Super Admin permissions can't be edited.",
          disabled: true,
        },
        {
          id: "standard_user_tpl",
          label: "Standard user",
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
    // green-circle → teal open ring  |  green-dot → teal filled  |  grey-dot → grey filled  |  grey-circle → grey open ring
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
            <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
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
                    <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: PRIMARY_TEXT, lineHeight: "18px" }}>
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
            <div style={{ padding: "8px 10px", borderBottom: "1px solid #e5e7eb" }}>
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
                    {/* Group header */}
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
        {/* Base diamond / platform */}
        <ellipse cx="55" cy="86" rx="38" ry="7" fill="#e5e7eb" />
        <path d="M18 66L55 86L92 66L55 46Z" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1.2"/>
        <path d="M18 66L55 76L92 66" stroke="#e5e7eb" strokeWidth="1"/>
        {/* Magnifying glass handle */}
        <line x1="72" y1="52" x2="86" y2="66" stroke="#d1d5db" strokeWidth="5" strokeLinecap="round"/>
        {/* Magnifying glass ring */}
        <circle cx="56" cy="36" r="20" fill="none" stroke="#d1d5db" strokeWidth="4"/>
        <circle cx="56" cy="36" r="14" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1.5"/>
        {/* Glare / shine */}
        <circle cx="50" cy="30" r="4" fill="#e5e7eb" opacity="0.7"/>
        <path d="M56 26a8 8 0 0 1 5 3" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
        {/* Sparkle lines */}
        <line x1="78" y1="22" x2="82" y2="18" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="82" y1="28" x2="88" y2="26" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="79" y1="35" x2="85" y2="36" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <p style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: "#141414", margin: 0, textAlign: "center" }}>
        Choose a template to preview access.
      </p>
    </div>
  );
  
  // ─── Template section (rendered inside accordion when "template" is chosen) ───
  
  const TemplateSection: React.FC = () => {
    const [chooseTplOpen, setChooseTplOpen] = useState(true);
    const [choosePermsOpen, setChoosePermsOpen] = useState(false);
    const [selectedTplId, setSelectedTplId] = useState("");
  
    const selectedItem = ALL_TEMPLATE_ITEMS.find((i) => i.id === selectedTplId);
    const selectedPermissions = selectedItem?.permissions ?? null;
  
    const handleTemplateChange = (id: string) => {
      setSelectedTplId(id);
    };
  
    return (
      <>
        {/* ── Sub-accordion A: Choose a template ── */}
        <div style={{ borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
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
            {/* Show selected template name in header when collapsed */}
            {!chooseTplOpen && selectedItem && (
              <span style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 400, color: PRIMARY_TEXT }}>
                {selectedItem.label}
              </span>
            )}
          </div>
  
          {/* Body */}
          {chooseTplOpen && (
            <div style={{ padding: "4px 28px 28px" }}>
              {/* Description */}
              <p style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: "#33475b", lineHeight: "22px", marginTop: 0, marginBottom: "18px" }}>
                Assign access based on a set of common roles, or base access on another user's permissions.
              </p>
  
              {/* Template selection */}
              <div style={{ display: "flex", gap: "48px", alignItems: "flex-start" }}>
                {/* Left column */}
                <div style={{ flexShrink: 0 }}>
                  <p style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 600, color: PRIMARY_TEXT, margin: "0 0 8px 0" }}>
                    Choose a template
                  </p>
                  <TemplateDropdown value={selectedTplId} onChange={handleTemplateChange} />
                </div>
  
                {/* Right column: placeholder */}
                <div style={{  minWidth: 0 }}>
                  {!selectedTplId
                    ? <MagnifyPlaceholder />
                    : (
                        <></>
                      )
                  }
                </div>
              </div>
  
              {/* Permissions grid: full width on next row */}
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
  
          {/* Body */}
          {choosePermsOpen && selectedTplId && (
            <div style={{ padding: "4px 28px 28px" }}>
              <p style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: "#33475b", lineHeight: "22px", marginTop: 0, marginBottom: "4px" }}>
                Fine-tune the permissions for this user based on the selected template.
              </p>
              {selectedPermissions
                ? <PermissionsGrid categories={selectedPermissions} />
                : (
                  <p style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: "#6b7280", marginTop: "8px" }}>
                    Permissions for this template cannot be modified.
                  </p>
                )
              }
            </div>
          )}
        </div>
      </>
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
        {/* Trigger */}
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
          border: `1px solid ${selected ? "#9ca3af" : "#e5e7eb"}`,
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
        {/* Radio top-right */}
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
  
        {/* Icon area */}
        <div style={{ height: "90px", display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: "14px" }}>
          {method.icon}
        </div>
  
        {/* Title */}
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
  
        {/* Description */}
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
        {/* Heading */}
        <h2 style={{ fontFamily: FONT, fontSize: "22px", fontWeight: 500, color: PRIMARY_TEXT, marginBottom: "10px", marginTop: 0, textAlign: "center" }}>
          Set up user access levels
        </h2>
        <p style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: "#33475b", lineHeight: "22px", marginBottom: "16px", textAlign: "center", maxWidth: "560px" }}>
          Assign a seat to give users access to features. Narrow down that access with permissions.
        </p>
  
        {/* Email chips */}
        {emails.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", marginBottom: "28px" }}>
            {emails.map((email) => (
              <EmailChip key={email} email={email} />
            ))}
          </div>
        )}
  
        {/* Accordion wrapper */}
        <div style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "visible", position: "relative" }}>
  
          {/* ── Section 1: Assign a seat ── */}
          <div style={{ borderBottom: "1px solid #e5e7eb" }}>
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
                  <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "#0d6efd", textDecoration: "none", fontWeight: 400, display: "inline-flex", alignItems: "center", gap: "3px" }}
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
                  <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "#0d6efd", textDecoration: "none", fontWeight: 400, display: "inline-flex", alignItems: "center", gap: "3px" }}
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
          <div style={{ borderBottom: accessMethod === "template" && seatId ? "1px solid #e5e7eb" : "none" }}>
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
              {/* Show method in header when collapsed */}
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
  
        </div>
      </div>
    );
  };
  
  // ─── Step 3 — Review ─────────────────────────────────────────────────────────
  
  interface Step3Props {
    emails: string[];
    seatLabel: string;
    accessMethod: string;
  }
  
  const StepReview: React.FC<Step3Props> = ({ emails, seatLabel, accessMethod }) => {
    const methodLabel = ACCESS_METHODS.find((m) => m.id === accessMethod)?.title ?? "—";
  
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "48px", width: "100%" }}>
        <h2 style={{ fontFamily: FONT, fontSize: "22px", fontWeight: 700, color: PRIMARY_TEXT, marginBottom: "10px", textAlign: "center" }}>
          Review &amp; confirm
        </h2>
        <p style={{ fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: "#6b7280", marginBottom: "36px", textAlign: "center" }}>
          Review the details below before creating the users.
        </p>
  
        <div style={{ width: "100%", maxWidth: "520px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Users */}
          <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontFamily: FONT, fontSize: "12px", fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Users ({emails.length})
            </div>
            {emails.map((email, idx) => (
              <div key={email} style={{ padding: "10px 16px", fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: PRIMARY_TEXT, borderBottom: idx < emails.length - 1 ? "1px solid #f3f4f6" : "none", backgroundColor: "#fff" }}>
                {email}
              </div>
            ))}
          </div>
  
          {/* Seat */}
          <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontFamily: FONT, fontSize: "12px", fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Seat
            </div>
            <div style={{ padding: "10px 16px", fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: seatLabel ? PRIMARY_TEXT : "#9ca3af", backgroundColor: "#fff" }}>
              {seatLabel || "No seat selected"}
            </div>
          </div>
  
          {/* Access method */}
          <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontFamily: FONT, fontSize: "12px", fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Access method
            </div>
            <div style={{ padding: "10px 16px", fontFamily: FONT, fontSize: "13px", fontWeight: 300, color: accessMethod ? PRIMARY_TEXT : "#9ca3af", backgroundColor: "#fff" }}>
              {accessMethod ? methodLabel : "No access method selected"}
            </div>
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
        <div style={{ height: "60px", borderTop: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", paddingInline: "24px", flexShrink: 0, backgroundColor: "#fff" }}>
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
              {submitting ? "Creating…" : "Create users"}
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
  
  // CreateUsersPage.getLayout = (page: ReactElement) => {
  //   return <Layout>{page}</Layout>;
  // };
  
  export default CreateUsersPage;
  