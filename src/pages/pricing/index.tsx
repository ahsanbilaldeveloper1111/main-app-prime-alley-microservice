import React, { useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT = "Lexend Deca, Helvetica, Arial, sans-serif";
const PRIMARY = "#141414";

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

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Platform Solutions",
    items: ["Customer Platform", "Prime for Marketers"],
  },
  {
    heading: "Products",
    items: ["Smart CRM", "Marketing", "Sales", "Service", "Content", "Data", "Commerce"],
  },
  {
    heading: "Enhancements",
    items: ["Prime Credits", "Add-ons"],
  },
];

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Essential sales tools to shorten sales cycles and improve close rates",
    startsAt: "£9/mo/seat",
    originalPrice: "£18/mo/seat",
    credits: "500 Prime Credits",
    featureIntro: "Free tools with increased limits, plus:",
    features: [
      "Breeze Assistant",
      "Calling",
      "Prime-provided phone numbers",
      "Repeating tasks and task queues",
      "Object Tags",
      "Goals",
    ],
    buttons: [{ label: "See current plan", variant: "outline" }],
    badge: "YOU OWN STARTER CUSTOMER PLATFORM",
    badgeDark: false,
  },
  {
    id: "professional",
    name: "Professional",
    description: "Comprehensive sales software to automate and scale your sales processes",
    startsAt: "£77/mo/seat",
    originalPrice: "£85/mo/seat",
    credits: "3,000 Prime Credits",
    featureIntro: "Sales Hub Starter, plus:",
    features: [
      "AI Meeting Assistant",
      "Breeze Prospecting Agent",
      "Call transcription and coaching",
      "Sales analytics",
      "Sales workspace",
      "Forecasting",
      "Sequences",
    ],
    buttons: [
      { label: "Buy now", variant: "solid" },
      { label: "Start 14-day trial", variant: "outline" },
      { label: "Talk to Sales", variant: "outline" },
    ],
    footnote: "*Cost shown does not include the required, one-time onboarding fee.",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Our most powerful sales software for advanced control and flexibility",
    startsAt: "£135/mo/seat",
    credits: "5,000 Prime Credits",
    featureIntro: "Sales Hub Professional, plus:",
    features: [
      "AI call transcript enrichment (Beta)",
      "Conversation intelligence",
      "Deal splits",
      "Deal journey analytics",
      "Lead Form Routing",
      "Pipeline approvals for Deals",
      "Interactive Voice Response",
    ],
    buttons: [{ label: "Talk to Sales", variant: "solid" }],
    badge: "RECOMMENDED",
    badgeDark: true,
    footnote:
      "*Cost shown does not include the required, one-time Enterprise Onboarding for a fee of £3,050.",
  },
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

// ─── Plan Card ────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: Plan;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan }) => {
  const [hoveredBtn, setHoveredBtn] = useState<number | null>(null);

  const getButtonStyles = (variant: PlanButton["variant"], idx: number): React.CSSProperties => {
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
    const isHovered = hoveredBtn === idx;
    if (variant === "solid") {
      return { ...base, backgroundColor: isHovered ? "#374151" : "#141414", borderColor: "#141414", color: "#ffffff" };
    }
    return { ...base, backgroundColor: isHovered ? "#f5f5f5" : "#ffffff", borderColor: "rgb(138, 138, 138)", color: PRIMARY };
  };

  return (
    <div style={{ flex: "1 1 0", minWidth: 0, backgroundColor: "#ffffff", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* Badge */}
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
          {plan.buttons.map((btn, idx) => (
            <button key={idx} type="button" style={getButtonStyles(btn.variant, idx)} onMouseEnter={() => setHoveredBtn(idx)} onMouseLeave={() => setHoveredBtn(null)}>{btn.label}</button>
          ))}
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
            {plan.id === "enterprise" && <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "#006162", textDecoration: "underline" }}>Learn more</a>}
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Agent Carousel Mini-Table ────────────────────────────────────────────────

const AgentMiniTable: React.FC<{ slide: AgentSlide }> = ({ slide }) => (
  <div style={{ borderRadius: "6px", overflow: "hidden", border: "1px solid #e5e7eb", fontSize: "11px", fontFamily: FONT, marginBottom: "12px" }}>
    {/* Table header */}
    <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.2fr 1fr 0.8fr 0.8fr", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "6px 10px", gap: "4px" }}>
      {["FEATURE", "ACTION", "COST PER ACTION", "TOTAL ACTIONS", "CREDITS USED"].map((h) => (
        <span key={h} style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</span>
      ))}
    </div>
    {/* Rows */}
    {slide.tableRows.map((row, i) => (
      <div key={i} style={{ display: "grid", gridTemplateColumns: "1.6fr 1.2fr 1fr 0.8fr 0.8fr", padding: "6px 10px", gap: "4px", borderBottom: i < slide.tableRows.length - 1 ? "1px solid #f3f4f6" : "none", backgroundColor: "#fff" }}>
        <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 400, color: PRIMARY }}>{row.feature}</span>
        <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 300, color: "#6b7280" }}>{row.action}</span>
        <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 300, color: "#6b7280" }}>{row.costPerAction}</span>
        <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 300, color: "#6b7280" }}>{row.totalActions}</span>
        <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 300, color: "#6b7280" }}>{row.creditsUsed}</span>
      </div>
    ))}
    {/* Banner */}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f0fdf4", padding: "8px 10px", borderTop: "1px solid #e5e7eb" }}>
      <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 600, color: PRIMARY }}>{slide.agentBannerLabel}</span>
      <span style={{ fontFamily: FONT, fontSize: "10px", fontWeight: 500, color: PRIMARY, backgroundColor: "#141414", padding: "3px 8px", borderRadius: "3px", cursor: "pointer" }}>{slide.agentBannerAction}</span>
    </div>
    {/* Total */}
    <div style={{ backgroundColor: "#042729", padding: "10px", textAlign: "center", borderTop: "1px solid #0a3d3f" }}>
      <p style={{ fontFamily: FONT, fontSize: "9px", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 2px 0" }}>TOTAL CREDITS USED</p>
      <p style={{ fontFamily: FONT, fontSize: "20px", fontWeight: 700, color: "#ffffff", margin: 0, lineHeight: "1.2" }}>{slide.totalCredits}</p>
    </div>
  </div>
);

// ─── Prime Credits Section ──────────────────────────────────────────────────

const PrimeCreditsSection: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = AGENT_SLIDES[activeSlide];

  const goNext = () => setActiveSlide((s) => (s + 1) % AGENT_SLIDES.length);
  const goPrev = () => setActiveSlide((s) => (s - 1 + AGENT_SLIDES.length) % AGENT_SLIDES.length);

  return (
    <div
      style={{
        borderRadius: "8px",
        overflow: "hidden",
        marginTop: "28px",
        border: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top row: info + dark strip */}
      <div style={{ display: "flex", minHeight: "320px" }}>
        {/* Left top: Prime Credits info */}
        <div
          style={{
            flex: "0 0 50%",
            backgroundColor: "#ffffff",
            padding: "32px 0px 0 0px",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {/* Plant illustration */}
          

<div style={{ padding: "0 150px 40px 40px" }}>
          {/* Text content */}
          <h2
            style={{
              fontFamily: FONT,
              fontSize: "1.375rem",
              fontWeight: 500,
              lineHeight: 1.45454545,
              color: PRIMARY,
              margin: "0 0 0 0",
            }}
          >
            Prime Credits:
          </h2>
          <p
            style={{
              fontFamily: FONT,
              fontSize: "16px",
              fontWeight: 600,
              color: PRIMARY,
              lineHeight: "20px",
              margin: "8px 0 0 0",
              paddingInlineEnd: "80px",
            }}
          >
            Fuel powerful features that scale work at your own pace
          </p>
          <p
            style={{
              fontFamily: FONT,
              fontSize: "0.875rem",
              fontWeight: 300,
              color: PRIMARY,
              lineHeight: "24px",
              marginBlockStart: "24px",
              marginTop: "24px",
              paddingInlineEnd: "32px",
              marginBottom: "0",
            }}
          >
            Prime has powerful tools that scale work alongside your teams. You can take advantage of these tools with Prime Credits—a simple, flexible way to pay for what you use.
          </p>
</div>
           {/* Bottom row: Simple + Flexible dark strip */}
      <div
        style={{
          backgroundColor: "#042729",
          display: "flex",
          gap: "0",
        }}
      >
        {/* Simple */}
        <div style={{ flex: 1, padding: "32px 36px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <SparkleIcon color="#ff4800" />
            <h3
              style={{
                fontFamily: FONT,
                fontSize: "1.375rem",
                fontWeight: 500,
                lineHeight: 1.45454545,
                color: "#ffffff",
                margin: 0,
              }}
            >
              Simple
            </h3>
          </div>
          <ul style={{ listStyle: "disc", paddingLeft: "18px", margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              <><strong>Get started fast</strong> and test the latest AI tools with included credits.</>,
              <>See credit balance, track usage, and more—<strong>all in a single workspace</strong>.</>,
              <>Report on exactly which tools are <strong>delivering the most value</strong>.</>,
            ].map((item, i) => (
              <li
                key={i}
                style={{
                  fontFamily: FONT,
                  fontSize: "0.875rem",
                  fontWeight: 300,
                  color: "#ffffff",
                  lineHeight: 1.55555556,
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", backgroundColor: "#0f4345", margin: "24px 0" }} />

        {/* Flexible */}
        <div style={{ flex: 1, padding: "32px 36px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <SparkleIcon color="#ff4800" />
            <h3
              style={{
                fontFamily: FONT,
                fontSize: "1.375rem",
                fontWeight: 500,
                lineHeight: 1.45454545,
                color: "#ffffff",
                margin: 0,
              }}
            >
              Flexible
            </h3>
          </div>
          <ul style={{ listStyle: "disc", paddingLeft: "18px", margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              <><strong>Easily plan</strong> your spend with credit packs, or enable pay as you go.</>,
              <>Add more packs, adjust your spend cap, or pause features—<strong>staying in control</strong> without disruption.</>,
            ].map((item, i) => (
              <li
                key={i}
                style={{
                  fontFamily: FONT,
                  fontSize: "0.875rem",
                  fontWeight: 300,
                  color: "#ffffff",
                  lineHeight: 1.55555556,
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
        </div>

        

        {/* Right top: AI Agent carousel — peach bg */}
        <div
          style={{
            flex: "0 0 50%",
            backgroundColor: "#fcece6",
            padding: "55px 60px 55px 60px",
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Prev / Next arrows */}
          <button
            onClick={goPrev}
            type="button"
            style={{
              position: "absolute",
              left: "49px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M6.5 2L3.5 5L6.5 8" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button
            onClick={goNext}
            type="button"
            style={{
              position: "absolute",
              right: "52px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 2L6.5 5L3.5 8" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>

          {/* Card */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              padding: "40px 50px",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              position: "relative",
              overflow: "visible",
            }}
          >
            {/* AI Agents tag */}
            <div style={{ position: "absolute", top: "-14px", left: "24px" }}>
              <span
                style={{
                  fontFamily: FONT,
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#8b3a0f",
                  backgroundColor: "#fcc6b1",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  display: "inline-block",
                }}
              >
                {slide.tag}
              </span>
            </div>

            {/* Agent title */}
            <h3
              style={{
                fontFamily: FONT,
                fontSize: "1.125rem",
                fontWeight: 500,
                lineHeight: 1.55555556,
                color: PRIMARY,
                margin: "0 0 8px 0",
              }}
            >
              {slide.title}
            </h3>

            {/* Description */}
            <p
              style={{
                fontFamily: FONT,
                fontSize: "0.875rem",
                fontWeight: 300,
                color: PRIMARY,
                lineHeight: "22px",
                margin: "0 0 6px 0",
              }}
            >
              {slide.description}{" "}
              {slide.learnMoreHref && (
                <a
                  href={slide.learnMoreHref}
                  onClick={(e) => e.preventDefault()}
                  style={{ color: "#006162", fontWeight: 500, textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "3px" }}
                >
                  Learn more <ExternalLinkIcon />
                </a>
              )}
            </p>

            {/* Mini table */}
            <AgentMiniTable slide={slide} />

            {/* Divider */}
            <div style={{ height: "1px", backgroundColor: "#e5e7eb", margin: "4px 0 14px" }} />

            {/* Stats */}
            <div style={{ display: "flex", gap: "0", flex: 1, alignItems: "flex-start" }}>
              {slide.stats.map((stat, i) => (
                <React.Fragment key={i}>
                  <div style={{ flex: 1, textAlign: "center", padding: "0 8px" }}>
                    <p
                      style={{
                        fontFamily: FONT,
                        fontSize: "2.5rem",
                        fontWeight: 500,
                        lineHeight: 1.04545455,
                        color: "rgb(255, 72, 0)",
                        margin: "0 0 4px 0",
                      }}
                    >
                      {stat.value}
                    </p>
                    <p
                      style={{
                        fontFamily: FONT,
                        fontSize: "0.875rem",
                        fontWeight: 300,
                        color: "#374151",
                        lineHeight: "20px",
                        margin: 0,
                        whiteSpace: "pre-line",
                        textAlign: "center",
                      }}
                    >
                      {stat.label}
                    </p>
                  </div>
                  {i < slide.stats.length - 1 && (
                    <div style={{ width: "1px", backgroundColor: "#e5e7eb", alignSelf: "stretch", margin: "0 4px" }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

     
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const SalesHubPage: React.FC = () => {
  const [activeNavItem, setActiveNavItem] = useState("Sales");

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f0f0f0", fontFamily: FONT, maxWidth: "1500px", margin: "0 auto" }}>
      {/* ── Left Sidebar ── */}
      <aside
        style={{
          width: "240px",
          flexShrink: 0,
          backgroundColor: "#f0f0f0",
          padding: "28px 0",
          borderRight: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          boxSizing: "border-box",
        }}
      >
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={group.heading} style={{ marginBottom: gIdx < NAV_GROUPS.length - 1 ? "8px" : "0" }}>
            <p style={{ fontFamily: FONT, fontSize: "16px", fontWeight: 600, color: PRIMARY, margin: "0", padding: "10px 20px 8px", lineHeight: "22px" }}>{group.heading}</p>
            {group.items.map((item) => {
              const isActive = item === activeNavItem;
              return (
                <div
                  key={item}
                  onClick={() => setActiveNavItem(item)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "15px",
                    cursor: "pointer",
                    backgroundColor: isActive ? "#e5e7eb" : "transparent",
                    borderLeft: isActive ? "3px solid #141414" : "3px solid transparent",
                    transition: "background-color 120ms ease-out",
                    marginLeft: "19px",
                  }}
                  onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.backgroundColor = "#e9eaec"; }}
                  onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"; }}
                >
                  <span style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: PRIMARY, letterSpacing: "0px", lineHeight: "24px", whiteSpace: "nowrap" }}>{item}</span>
                </div>
              );
            })}
            {gIdx < NAV_GROUPS.length - 1 && <div style={{ height: "1px", backgroundColor: "#d1d5db", margin: "10px 20px" }} />}
          </div>
        ))}
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, minWidth: 0, padding: "36px 100px 48px", overflowX: "auto" }}>
        {/* Title area */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "6px" }}>
            <HubIcon />
            <h1 style={{ fontFamily: FONT, fontSize: "32px", fontWeight: 700, color: PRIMARY, lineHeight: "39px", margin: 0 }}>Sales Hub</h1>
          </div>
          <p style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 300, color: PRIMARY, lineHeight: "24px", margin: 0 }}>
            Close more deals and accelerate growth with powerful sales software
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

        {/* Prime Credits Section */}
        <PrimeCreditsSection />
      </main>
    </div>
  );
};

export default SalesHubPage;