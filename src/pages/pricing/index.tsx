import React, { useState, ReactElement } from "react";
import Layout from "@layout/index";

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT = "Lexend Deca, Helvetica, Arial, sans-serif";
const PRIMARY = "#141414";
const BORDER = "#8a8a8a";
const LINK_COLOR = "#006162";

const LINK_BUTTON_STYLE: React.CSSProperties = {
  cursor: "pointer",
  background: "none",
  border: "none",
  padding: 0,
  font: "inherit",
  color: LINK_COLOR,
  textDecoration: "underline",
};

const getButtonStyles = (
  variant: PlanButton["variant"],
  isHovered: boolean,
): React.CSSProperties => {
  const base: React.CSSProperties = {
    cursor: "pointer",
    transition: "150ms ease-out",
    display: "inline-block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    textDecoration: "none",
    borderRadius: "4px",
    borderWidth: "1px",
    borderStyle: "solid",
    verticalAlign: "middle",
    paddingBlock: "10px",
    paddingInline: "24px",
    width: "100%",
    maxWidth: "100%",
    fontFamily: FONT,
    fontSize: "14px",
    fontWeight: 600,
    letterSpacing: "0px",
    lineHeight: "18px",
    textAlign: "center",
    boxSizing: "border-box",
  };

  switch (variant) {
    case "solid":
      return {
        ...base,
        backgroundColor: isHovered ? "#374151" : PRIMARY,
        borderColor: PRIMARY,
        color: "#ffffff",
      };
    case "outline":
    case "ghost-outline":
      return {
        ...base,
        backgroundColor: isHovered ? "#f5f5f5" : "#ffffff",
        borderColor: BORDER,
        color: PRIMARY,
      };
  }
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavGroup {
  heading: string;
  items: string[];
}

interface Plan {
  id: string;
  name: string;
  description: string;
  startsAt: string;
  originalPrice?: string;
  credits: string;
  featureIntro: string;
  features: string[];
  buttons: PlanButton[];
  badge?: string;
  badgeDark?: boolean;
  footnote?: string;
}

interface PlanButton {
  label: string;
  variant: "outline" | "solid" | "ghost-outline";
}

// ─── Build Pipeline Types ─────────────────────────────────────────────────────

type CellContent =
  | { type: "text"; value: string; isLink?: boolean }
  | { type: "check" }
  | { type: "empty" };

const CHECK_CELL: CellContent = { type: "check" };
const EMPTY_CELL: CellContent = { type: "empty" };
const textCell = (value: string, isLink?: boolean): CellContent =>
  isLink ? { type: "text", value, isLink } : { type: "text", value };

interface PipelineRow {
  feature: string;
  isBold?: boolean;
  hasIcon?: boolean;
  iconColor?: string;
  standard: CellContent;
  professional: CellContent;
  enterprise: CellContent;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    heading: "RingEdge Connect",
    items: ["Plans", "Features", "Pricing"],
  },
  {
    heading: "Resources",
    items: ["Documentation", "API Reference", "Support"],
  },
];

const PLANS: Plan[] = [
  {
    id: "standard",
    name: "Standard",
    description: "For small teams getting started with cloud calling",
    startsAt: "180 AED/mo/seat",
    credits: "Max 2 seats",
    featureIntro: "Includes:",
    features: [
      "Web dialer for agents",
      "Inbound & outbound calls",
      "Basic IVR and call routing",
      "Call logs & dispositions",
      "Call recordings (basic controls)",
      "Email notifications",
    ],
    buttons: [
      { label: "Start Free Trial", variant: "outline" },
      { label: "Buy now", variant: "solid" },
    ],
  },
  {
    id: "professional",
    name: "Professional",
    description: "For growing contact centers that need more control",
    startsAt: "290 AED/mo/seat",
    credits: "Scalable seats",
    featureIntro: "Includes all Standard features, plus:",
    features: [
      "Advanced IVR and routing policies",
      "DNCR compliance checker",
      "Supervisor live view & monitoring",
      "Advanced wallboards and KPIs",
      "Better recording controls & retention options",
      "Channels: SMS & WhatsApp",
    ],
    buttons: [
      { label: "Start Free Trial", variant: "outline" },
      { label: "Buy now", variant: "solid" },
    ],
    badge: "POPULAR",
    badgeDark: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large operations with complex needs",
    startsAt: "437 AED/mo/seat",
    credits: "Unlimited seats",
    featureIntro: "Includes all Professional features, plus:",
    features: [
      "Multi-site wallboards and reporting",
      "Full DNCR & compliance suite",
      "BYOC model for own carriers (add-on)",
      "Advanced calling features (queues, whisper, barge, etc.)",
      "High-touch support and onboarding",
      "Custom routing design and policy consulting",
    ],
    buttons: [{ label: "Contact Sales", variant: "solid" }],
    badge: "RECOMMENDED",
    badgeDark: true,
    footnote: "*Contact sales for pricing. Response guaranteed within 24 hours.",
  },
];

// ─── Build Pipeline rows data ─────────────────────────────────────────────────

const PIPELINE_ROWS: PipelineRow[] = [
  {
    feature: "Users",
    isBold: true,
    standard: textCell("Max 2 seats"),
    professional: textCell("Scalable"),
    enterprise: textCell("Unlimited"),
  },
  {
    feature: "Live Calls (real-time view + monitoring)",
    standard: CHECK_CELL,
    professional: CHECK_CELL,
    enterprise: CHECK_CELL,
  },
  {
    feature: "Calls History (logs + recordings search/playback)",
    standard: CHECK_CELL,
    professional: CHECK_CELL,
    enterprise: CHECK_CELL,
  },
  {
    feature: "IVR",
    standard: textCell("Basic"),
    professional: textCell("Advanced"),
    enterprise: textCell("Advanced"),
  },
  {
    feature: "Telco Gateway (GSM gateway management)",
    standard: EMPTY_CELL,
    professional: CHECK_CELL,
    enterprise: CHECK_CELL,
  },
  {
    feature: "Web Dialer (agent calling UI)",
    standard: CHECK_CELL,
    professional: CHECK_CELL,
    enterprise: CHECK_CELL,
  },
  {
    feature: "Call Logs + Dispositions",
    standard: CHECK_CELL,
    professional: CHECK_CELL,
    enterprise: CHECK_CELL,
  },
  {
    feature: "Call Recordings",
    standard: textCell("Basic"),
    professional: textCell("Full controls"),
    enterprise: textCell("Full controls"),
  },
  {
    feature: "Supervisor View (live status)",
    standard: textCell("Limited"),
    professional: CHECK_CELL,
    enterprise: CHECK_CELL,
  },
  {
    feature: "Live Wallboard",
    standard: textCell("Basic"),
    professional: textCell("Advanced"),
    enterprise: textCell("Multi-site"),
  },
  {
    feature: "Channels: Email notifications",
    standard: CHECK_CELL,
    professional: CHECK_CELL,
    enterprise: CHECK_CELL,
  },
  {
    feature: "Channels: SMS",
    standard: EMPTY_CELL,
    professional: CHECK_CELL,
    enterprise: CHECK_CELL,
  },
  {
    feature: "Channels: WhatsApp",
    standard: EMPTY_CELL,
    professional: CHECK_CELL,
    enterprise: CHECK_CELL,
  },
  {
    feature: "DNCR Compliance Checker",
    standard: EMPTY_CELL,
    professional: CHECK_CELL,
    enterprise: textCell("Full suite"),
  },
  {
    feature: "BYOC Model (Bring Your Own Carrier)",
    isBold: true,
    standard: EMPTY_CELL,
    professional: EMPTY_CELL,
    enterprise: textCell("Add-on available"),
  },
  {
    feature: "Advanced Calling Features (queues, whisper, barge)",
    standard: EMPTY_CELL,
    professional: EMPTY_CELL,
    enterprise: CHECK_CELL,
  },
  {
    feature: "Calling Routes / Routing Policies",
    standard: EMPTY_CELL,
    professional: EMPTY_CELL,
    enterprise: CHECK_CELL,
  },
  {
    feature: "Dashboards (basic KPIs)",
    isBold: true,
    standard: CHECK_CELL,
    professional: CHECK_CELL,
    enterprise: CHECK_CELL,
  },
  {
    feature: "Unified Reporting (CRM + Connect)",
    standard: textCell("Basic"),
    professional: textCell("Advanced filters"),
    enterprise: textCell("Custom dashboards"),
  },
  {
    feature: "Scheduled Reports",
    standard: EMPTY_CELL,
    professional: CHECK_CELL,
    enterprise: CHECK_CELL,
  },
  {
    feature: "AI Analytics (transcription, sentiment, QA scoring)",
    standard: EMPTY_CELL,
    professional: CHECK_CELL,
    enterprise: CHECK_CELL,
  },
];

const PLAN_COMPARISON_META: Array<{
  id: Plan["id"];
  ctaLabel: string;
  ctaVariant: PlanButton["variant"];
}> = [
  { id: "standard", ctaLabel: "Get Started", ctaVariant: "outline" },
  { id: "professional", ctaLabel: "Buy now", ctaVariant: "solid" },
  { id: "enterprise", ctaLabel: "Contact Sales", ctaVariant: "solid" },
];

// ─── Agent carousel data ──────────────────────────────────────────────────────

interface AgentSlide {
  tag: string;
  title: string;
  description: string;
  learnMoreHref?: string;
  stats: { value: string; label: string }[];
  tableRows: { feature: string; action: string; costPerAction: string; totalActions: string; creditsUsed: string }[];
  agentBannerLabel: string;
  agentBannerAction: string;
  totalCredits: string;
}

const AGENT_SLIDES: AgentSlide[] = [
  {
    tag: "AI Agents",
    title: "Customer Agent",
    description:
      "Resolves inquiries with fast, accurate responses — and escalates when needed, so your team can focus on complex cases and building loyalty.",
    learnMoreHref: "#",
    stats: [
      { value: "65%+", label: "of conversations\nresolved automatically" },
      { value: "39%", label: "faster ticket resolution\nvs. teams not using\ncustomer agent" },
    ],
    tableRows: [
      { feature: "Customer Agent", action: "Handle conv...", costPerAction: "100 credits", totalActions: "254", creditsUsed: "25,400" },
      { feature: "Prospecting Agent", action: "Create monthly...", costPerAction: "100 credits", totalActions: "518", creditsUsed: "1,048" },
      { feature: "Prospecting Agent", action: "", costPerAction: "", totalActions: "", creditsUsed: "" },
      { feature: "Prospecting Agent", action: "", costPerAction: "", totalActions: "", creditsUsed: "" },
    ],
    agentBannerLabel: "Breeze Customer Agent",
    agentBannerAction: "▶ Resume usage",
    totalCredits: "25,400",
  },
  {
    tag: "AI Agents",
    title: "Prospecting Agent",
    description:
      "Automates outreach and prospecting tasks so your sales team can focus on closing — not cold outreach.",
    learnMoreHref: "#",
    stats: [
      { value: "3x", label: "more prospects\nengaged per rep" },
      { value: "55%", label: "reduction in manual\nprospecting time" },
    ],
    tableRows: [
      { feature: "Prospecting Agent", action: "Create monthly...", costPerAction: "100 credits", totalActions: "518", creditsUsed: "1,048" },
      { feature: "Customer Agent", action: "Handle conv...", costPerAction: "100 credits", totalActions: "254", creditsUsed: "25,400" },
      { feature: "Prospecting Agent", action: "", costPerAction: "", totalActions: "", creditsUsed: "" },
      { feature: "Prospecting Agent", action: "", costPerAction: "", totalActions: "", creditsUsed: "" },
    ],
    agentBannerLabel: "Breeze Prospecting Agent",
    agentBannerAction: "▶ Resume usage",
    totalCredits: "1,048",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const CheckIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: "3px" }}>
    <path d="M2 7.5L5.5 11L12 4" stroke="#141414" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HubIcon: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M16 2L20 8H28L22 13L24.5 21L16 16.5L7.5 21L10 13L4 8H12L16 2Z" fill="#e8390e" stroke="#e8390e" strokeWidth="1" strokeLinejoin="round" />
    <circle cx="16" cy="15" r="3.5" fill="#fff" />
  </svg>
);

const SparkleIcon: React.FC<{ color?: string }> = ({ color = "#ff4800" }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M10 2L11.5 8H18L12.5 12L14.5 18L10 14.5L5.5 18L7.5 12L2 8H8.5L10 2Z" fill={color} />
  </svg>
);

const ExternalLinkIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 1h4v4M11 1L5 7M3 3H1v8h8V9" stroke="#006162" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Dark circle with white checkmark — used in comparison table cells
const TableCheckIcon: React.FC = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{
      width: "28px",
      height: "28px",
      borderRadius: "50%",
      backgroundColor: "#141414",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}>
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M2 6.5L5 9.5L11 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  </div>
);

// Small [i] icon for feature labels that have an info indicator
const FeatureIcon: React.FC<{ color?: string }> = ({ color = "#666" }) => (
  <span style={{
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "14px",
    height: "14px",
    border: `1px solid ${color}`,
    borderRadius: "2px",
    fontSize: "9px",
    fontWeight: 700,
    color,
    flexShrink: 0,
    lineHeight: 1,
    marginRight: "6px",
  }}>
    i
  </span>
);

// ─── Plan Card ────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: Plan;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan }) => {
  const [hoveredBtnKey, setHoveredBtnKey] = useState<string | null>(null);

  return (
    <div style={{ flex: "1 1 0", minWidth: 0, backgroundColor: "#ffffff", display: "flex", flexDirection: "column", position: "relative" }}>
      {plan.badge && (
        <div style={{ position: "absolute", top: "-36px", left: 0, right: 0, height: "36px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: plan.badgeDark ? "#141414" : "#8a8a8a", zIndex: 2 }}>
          <span style={{ fontFamily: FONT, fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: "#ffffff", textTransform: "uppercase" }}>{plan.badge}</span>
        </div>
      )}
      <div style={{ padding: "28px 28px 32px", display: "flex", flexDirection: "column", flex: 1 }}>
        <h2 style={{ fontFamily: FONT, fontSize: "22px", fontWeight: 600, color: PRIMARY, margin: "0 0 10px 0", lineHeight: "27px" }}>{plan.name}</h2>
        <p style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: PRIMARY, lineHeight: "24px", margin: "0 0 20px 0", minHeight: "48px" }}>{plan.description}</p>
        <p style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 300, color: "rgb(102, 102, 102)", lineHeight: "18px", margin: "0 0 2px 0" }}>Starts at</p>
        <p style={{ fontFamily: FONT, fontSize: "22px", fontWeight: 600, color: PRIMARY, lineHeight: "27px", margin: "0 0 4px 0" }}>{plan.startsAt}</p>
        {plan.originalPrice ? (
          <p style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: "rgb(102, 102, 102)", lineHeight: "20px", margin: "0 0 24px 0", textDecoration: "line-through" }}>{plan.originalPrice}</p>
        ) : (
          <div style={{ marginBottom: "24px" }} />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
          {plan.buttons.map((btn) => {
            const btnKey = `${plan.id}-${btn.label}`;
            const isHovered = hoveredBtnKey === btnKey;
            return (
              <button
                key={btnKey}
                type="button"
                style={getButtonStyles(btn.variant, isHovered)}
                onMouseEnter={() => setHoveredBtnKey(btnKey)}
                onMouseLeave={() => setHoveredBtnKey(null)}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
        <p style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: PRIMARY, margin: "0 0 18px 0", lineHeight: "22px" }}>{plan.credits}</p>
        <p style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: PRIMARY, margin: "0 0 10px 0", lineHeight: "22px" }}>{plan.featureIntro}</p>
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 auto 0", display: "flex", flexDirection: "column", gap: "8px" }}>
          {plan.features.map((feature) => (
            <li key={feature} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: PRIMARY, lineHeight: "22px" }}>
              <CheckIcon /><span>{feature}</span>
            </li>
          ))}
        </ul>
        {plan.footnote && (
          <p style={{ fontFamily: FONT, fontSize: "12px", fontWeight: 300, color: "rgb(102, 102, 102)", lineHeight: "18px", margin: "20px 0 0 0" }}>
            {plan.footnote}{" "}
            {plan.id === "enterprise" && (
              <button type="button" style={LINK_BUTTON_STYLE}>
                Learn more
              </button>
            )}
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Agent Carousel Mini-Table ────────────────────────────────────────────────

const AgentMiniTable: React.FC<{ slide: AgentSlide }> = ({ slide }) => (
  <div style={{ borderRadius: "6px", overflow: "hidden", border: "1px solid #e5e7eb", fontSize: "11px", fontFamily: FONT, marginBottom: "12px" }}>
    <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.2fr 1fr 0.8fr 0.8fr", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "6px 10px", gap: "4px" }}>
      {["FEATURE", "ACTION", "COST PER ACTION", "TOTAL ACTIONS", "CREDITS USED"].map((h) => (
        <span key={h} style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</span>
      ))}
    </div>
    {slide.tableRows.map((row, i) => (
      <div key={`${slide.title}-${row.feature}-${row.action}-${i}`} style={{ display: "grid", gridTemplateColumns: "1.6fr 1.2fr 1fr 0.8fr 0.8fr", padding: "6px 10px", gap: "4px", borderBottom: i < slide.tableRows.length - 1 ? "1px solid #f3f4f6" : "none", backgroundColor: "#fff" }}>
        <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 400, color: PRIMARY }}>{row.feature}</span>
        <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 300, color: "#6b7280" }}>{row.action}</span>
        <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 300, color: "#6b7280" }}>{row.costPerAction}</span>
        <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 300, color: "#6b7280" }}>{row.totalActions}</span>
        <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 300, color: "#6b7280" }}>{row.creditsUsed}</span>
      </div>
    ))}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f0fdf4", padding: "8px 10px", borderTop: "1px solid #e5e7eb" }}>
      <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 600, color: PRIMARY }}>{slide.agentBannerLabel}</span>
      <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 500, color: "#fff", backgroundColor: "#141414", padding: "3px 8px", borderRadius: "3px" }}>{slide.agentBannerAction}</span>
    </div>
    <div style={{ backgroundColor: "#042729", padding: "10px", textAlign: "center", borderTop: "1px solid #0a3d3f" }}>
      <p style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 2px 0" }}>TOTAL CREDITS USED</p>
      <p style={{ fontFamily: FONT, fontSize: "20px", fontWeight: 700, color: "#ffffff", margin: 0, lineHeight: "1.2" }}>{slide.totalCredits}</p>
    </div>
  </div>
);

// ─── Prime Credits Section ──────────────────────────────────────────────────



// ─── Build Pipeline Section ───────────────────────────────────────────────────

const BuildPipelineSection: React.FC = () => {
  const [hoveredPlan, setHoveredPlan] = useState<Plan["id"] | null>(null);
  const comparisonPlans = PLAN_COMPARISON_META.map((meta) => {
    const plan = PLANS.find((p) => p.id === meta.id);
    return { ...meta, plan };
  }).filter((entry): entry is { id: Plan["id"]; ctaLabel: string; ctaVariant: PlanButton["variant"]; plan: Plan } => Boolean(entry.plan));

  // Column widths: first col = 35%, remaining 3 cols each = ~21.67%
  const firstColFlex = "0 0 35%";
  const dataColFlex = "1 1 0";

  // Cell base styles
  const featureCellStyle: React.CSSProperties = {
    flex: firstColFlex,
    padding: "14px 20px 14px 24px",
    boxSizing: "border-box",
    borderRight: `1px solid ${BORDER}`,
    display: "flex",
    alignItems: "center",
    minHeight: "52px",
  };

  const dataCellStyle: React.CSSProperties = {
    flex: dataColFlex,
    padding: "14px 16px",
    boxSizing: "border-box",
    borderRight: "1px solid #8a8a8a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    minHeight: "52px",
  };

  const lastDataCellStyle: React.CSSProperties = {
    ...dataCellStyle,
    borderRight: "none",
  };

  const renderCellContent = (content: CellContent): React.ReactNode => {
    if (content.type === "empty") return null;
    if (content.type === "check") return <TableCheckIcon />;
    return (
      <span style={{
        fontFamily: FONT,
        fontSize: "14px",
        fontWeight: 300,
        lineHeight: "24px",
        color: content.isLink ? LINK_COLOR : PRIMARY,
        margin: 0,
        padding: 0,
        display: "block",
        textAlign: "center",
      }}>
        {content.value}
      </span>
    );
  };

  return (
    <div style={{
      marginTop: "48px",
      backgroundColor: "#ffffff",
      overflow: "hidden",
      padding: "50px 60px",
    }}>

      {/* ── Sticky-style header row with plan names + buttons ── */}
      <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}` }}>

        {/* Col 1: Build Pipeline heading */}
        <div style={{
          flex: firstColFlex,
          padding: "24px 20px 24px 24px",
          boxSizing: "border-box",
          border: "none",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}>
          <h2 style={{
            fontFamily: FONT,
            fontSize: "32px",
            fontWeight: 700,
            color: PRIMARY,
            lineHeight: "39px",
            margin: "0",
            padding: "0",
            marginBlockStart: "40px",
          }}>
            Feature Comparison
          </h2>
        </div>

        {comparisonPlans.map(({ id, ctaLabel, ctaVariant, plan }) => (
          <div
            key={id}
            style={{
              flex: dataColFlex,
              padding: "20px 16px 24px",
              boxSizing: "border-box",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 600, color: PRIMARY, lineHeight: "18px" }}>{plan.name}</span>
            <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: PRIMARY, lineHeight: "24px" }}>
              {plan.startsAt.replace("/seat", "")}
            </span>
            <div style={{ width: "100%", marginTop: "8px" }}>
              <button
                type="button"
                style={getButtonStyles(ctaVariant, hoveredPlan === id)}
                onMouseEnter={() => setHoveredPlan(id)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                {ctaLabel}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Feature comparison rows ── */}
      {PIPELINE_ROWS.map((row, idx) => {
        const isLast = idx === PIPELINE_ROWS.length - 1;
        return (
          <div
            key={`${row.feature}-${idx}`}
            style={{
              display: "flex",
              borderBottom: isLast ? "none" : "1px solid #8a8a8a",
              backgroundColor: "#ffffff",
            }}
          >
            {/* Feature label */}
            <div style={featureCellStyle}>
              <span style={{
                fontFamily: FONT,
                fontSize: "14px",
                fontWeight: row.isBold ? 700 : 300,
                color: row.hasIcon ? LINK_COLOR : PRIMARY,
                lineHeight: "24px",
                display: "flex",
                alignItems: "center",
              }}>
                {row.hasIcon && <FeatureIcon color={row.iconColor} />}
                {row.feature}
              </span>
            </div>

            {/* Standard */}
            <div style={dataCellStyle}>
              {renderCellContent(row.standard)}
            </div>

            {/* Professional */}
            <div style={dataCellStyle}>
              {renderCellContent(row.professional)}
            </div>

            {/* Enterprise */}
            <div style={lastDataCellStyle}>
              {renderCellContent(row.enterprise)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const SalesHubPage = () => {
  const defaultNavItem = NAV_GROUPS[0]?.items[0] ?? "";
  const [activeNavItem, setActiveNavItem] = useState(defaultNavItem);
  const [hoveredNavItem, setHoveredNavItem] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f0f0f0", fontFamily: FONT, maxWidth: "1540px", margin: "0 auto" }}>
      {/* ── Left Sidebar ── */}
      <aside style={{ width: "240px", flexShrink: 0, backgroundColor: "#f0f0f0", padding: "28px 0", borderRight: "1px solid #e5e7eb", position: "sticky", top: 0, height: "100vh", overflowY: "auto", boxSizing: "border-box" }}>
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={group.heading} style={{ marginBottom: gIdx < NAV_GROUPS.length - 1 ? "8px" : "0" }}>
            <p style={{ fontFamily: FONT, fontSize: "16px", fontWeight: 600, color: PRIMARY, margin: "0", padding: "10px 20px 8px", lineHeight: "22px" }}>{group.heading}</p>
            {group.items.map((item) => {
              const isActive = item === activeNavItem;
              const isHovered = hoveredNavItem === item;
              let backgroundColor = "transparent";
              if (isActive) backgroundColor = "#e5e7eb";
              else if (isHovered) backgroundColor = "#e9eaec";
              return (
                <button
                  key={item}
                  onClick={() => setActiveNavItem(item)}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onMouseEnter={() => setHoveredNavItem(item)}
                  onMouseLeave={() => setHoveredNavItem(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "calc(100% - 19px)",
                    padding: "15px",
                    cursor: "pointer",
                    backgroundColor,
                    borderLeft: isActive ? "3px solid #141414" : "3px solid transparent",
                    transition: "background-color 120ms ease-out",
                    marginLeft: "19px",
                    borderTop: "none",
                    borderRight: "none",
                    borderBottom: "none",
                    borderRadius: 0,
                    boxSizing: "border-box",
                  }}
                >
                  <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: PRIMARY, letterSpacing: "0px", lineHeight: "24px", whiteSpace: "nowrap" }}>{item}</span>
                </button>
              );
            })}
            {gIdx < NAV_GROUPS.length - 1 && <div style={{ height: "1px", backgroundColor: "#d1d5db", margin: "10px 20px" }} />}
          </div>
        ))}
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, minWidth: 0, padding: "36px 100px 48px", overflowX: "auto" }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "6px" }}>
            <HubIcon />
            <h1 style={{ fontFamily: FONT, fontSize: "32px", fontWeight: 700, color: PRIMARY, lineHeight: "39px", margin: 0 }}>RingEdge Connect</h1>
          </div>
          <p style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: PRIMARY, lineHeight: "24px", margin: 0 }}>
            Cloud calling solution with scalable pricing for teams of any size
          </p>
        </div>

        {/* Plans grid */}
        <div style={{ display: "flex", border: "1px solid #d1d5db", borderRadius: "4px", overflow: "visible", backgroundColor: "#ffffff", minWidth: "720px", marginTop: "36px" }}>
          {PLANS.map((plan, idx) => (
            <div key={plan.id} style={{ flex: "1 1 0", minWidth: 0, borderRight: idx < PLANS.length - 1 ? "1px solid #d1d5db" : "none", display: "flex", flexDirection: "column" }}>
              <PlanCard plan={plan} />
            </div>
          ))}
        </div>

    

        {/* Build Pipeline Section */}
        <BuildPipelineSection />
      </main>
    </div>
  );
};

SalesHubPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default SalesHubPage;
