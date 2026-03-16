import React, { useState, ReactElement } from "react";
import Layout from "@layout/index";
import { APP_FONT } from "../../styles/fonts";
import {
   RotateCcw,
  Settings,
  Maximize2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Phone,
  Users,
  X,
  ArrowUpRight,
  RefreshCw,
  Settings2,
  Copy,
  Tag,
  AlignLeft,
  Sparkles,
  Clock,
  PhoneCall,
  PhoneIncoming,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type TabType = "calls" | "users" | "numbers";
type StatusType =
  | "Available"
  | "Ringing"
  | "In call"
  | "After call work"
  | "Not available"
  | "Offline";

interface CallRow {
  id: number;
  user: string;
  number: string;
  numberPhone: string;
  customer: string;
  status: string;
  startedAt: string;
  isOutbound: boolean;
  callId: string;
  startedAtFull: string;
  callStatus: string;
  inCallTime: string;
  totalCallTime: string;
  teams: { name: string; emoji: string }[];
}

interface UserRow {
  id: number;
  initials: string;
  name: string;
  bgColor: string;
  status: StatusType;
  statusColor: string;
  callsHandled: number;
  talkTime: string;
  team: string;
}

interface NumberRow {
  id: number;
  flag: string;
  name: string;
  phone: string;
  callsToday: number;
  inbound: number;
  outbound: number;
  availableUsers: number;
}

interface UserStatusEntry {
  initials: string;
  name: string;
  duration: string;
  bgColor: string;
}

interface UserStatusGroup {
  label: StatusType;
  count: number;
  badgeColor: string;
  users: UserStatusEntry[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CALL_DATA: CallRow[] = [
  {
    id: 1,
    user: "Rizwan Haider",
    number: "RING EDGE",
    numberPhone: "+1 470 239 1959",
    customer: "+44 7831 505446",
    status: "20s",
    startedAt: "12:21:57 AM",
    isOutbound: true,
    callId: "CA2c157902b7a75acaf8309f0aa9ed1946",
    startedAtFull: "Today - 12:21:57 AM",
    callStatus: "Answered",
    inCallTime: "20s",
    totalCallTime: "25s",
    teams: [
      { name: "Sales Team", emoji: "😊" },
      { name: "Inbound Campaign", emoji: "😊" },
    ],
  },
  {
    id: 2,
    user: "Sarah Connor",
    number: "MAIN LINE",
    numberPhone: "+1 800 555 0100",
    customer: "+1 312 555 9876",
    status: "45s",
    startedAt: "12:35:10 AM",
    isOutbound: false,
    callId: "CA9f3a881cd2b4e5f6a7890b1c2d3e4f50",
    startedAtFull: "Today - 12:35:10 AM",
    callStatus: "Answered",
    inCallTime: "45s",
    totalCallTime: "52s",
    teams: [
      { name: "Support Team", emoji: "🎧" },
    ],
  },
];

const USERS_DATA: UserRow[] = [
  { id: 1, initials: "RH", name: "Rizwan Haider",  bgColor: "#3E525B", status: "In call",       statusColor: "#3b82f6", callsHandled: 5,  talkTime: "22m 10s", team: "Sales Team" },
  { id: 2, initials: "SC", name: "Sarah Connor",   bgColor: "#7C3AED", status: "Available",    statusColor: "#22c55e", callsHandled: 8,  talkTime: "41m 30s", team: "Support Team" },
  { id: 3, initials: "JD", name: "John Doe",       bgColor: "#0891B2", status: "After call work", statusColor: "#8b5cf6", callsHandled: 3, talkTime: "14m 05s", team: "Sales Team" },
  { id: 4, initials: "AM", name: "Alice Morgan",   bgColor: "#BE185D", status: "Not available", statusColor: "#ef4444", callsHandled: 0, talkTime: "0s",      team: "Billing" },
  { id: 5, initials: "TK", name: "Tom Keller",     bgColor: "#B45309", status: "Offline",      statusColor: "#9ca3af", callsHandled: 12, talkTime: "1h 02m", team: "Inbound Campaign" },
];

const NUMBERS_DATA: NumberRow[] = [
  { id: 1, flag: "🇺🇸", name: "RING EDGE",    phone: "+1 470 239 1959", callsToday: 14, inbound: 9,  outbound: 5, availableUsers: 3 },
  { id: 2, flag: "🇺🇸", name: "MAIN LINE",    phone: "+1 800 555 0100", callsToday: 22, inbound: 15, outbound: 7, availableUsers: 2 },
  { id: 3, flag: "🇬🇧", name: "UK SUPPORT",   phone: "+44 20 7946 0958", callsToday: 8,  inbound: 8,  outbound: 0, availableUsers: 1 },
  { id: 4, flag: "🇩🇪", name: "DE SALES",     phone: "+49 30 12345678",  callsToday: 5,  inbound: 2,  outbound: 3, availableUsers: 0 },
  { id: 5, flag: "🇦🇺", name: "AU HELPDESK",  phone: "+61 2 9876 5432",  callsToday: 11, inbound: 11, outbound: 0, availableUsers: 4 },
];

const USER_STATUS_GROUPS: UserStatusGroup[] = [
  { label: "Available",      count: 0, badgeColor: "#22c55e", users: [] },
  { label: "Ringing",        count: 0, badgeColor: "#f59e0b", users: [] },
  { label: "In call",        count: 0, badgeColor: "#3b82f6", users: [] },
  { label: "After call work",count: 0, badgeColor: "#8b5cf6", users: [] },
  { label: "Not available",  count: 0, badgeColor: "#ef4444", users: [] },
  {
    label: "Offline",
    count: 1,
    badgeColor: "#9ca3af",
    users: [
      { initials: "RH", name: "Rizwan Haider", duration: "47min 12s", bgColor: "#3E525B" },
    ],
  },
];

// ─── Shared constants ─────────────────────────────────────────────────────────

const FF = APP_FONT;

const TRANS = "background-color 150ms cubic-bezier(0.4,0,0.2,1), border-color 150ms cubic-bezier(0.4,0,0.2,1), color 150ms cubic-bezier(0.4,0,0.2,1)";

function pluralize(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

// ─── Small reusable components ────────────────────────────────────────────────
const CallInfoSidebar: React.FC<{ call: CallRow; onClose: () => void }> = ({ call, onClose }) => {
  const [aiBannerVisible, setAiBannerVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(call.callId)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        setCopied(false);
      });
  };

  const divider = (
    <div style={{ height: 1, backgroundColor: "#F0F0F0", margin: "4px 0" }} />
  );

  const sectionLabel = (icon: React.ReactNode, text: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
      <span style={{ color: "#3E525B", display: "flex", alignItems: "center" }}>{icon}</span>
      <span style={{ fontFamily: FF, fontSize: 15, fontWeight: 700, color: "#111111" }}>{text}</span>
    </div>
  );

  const infoRow = (label: string, value: React.ReactNode) => (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
      <span style={{ fontFamily: FF, fontSize: 13, color: "#6B6B6B", width: 120, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: FF, fontSize: 13, color: "#1A1A1A", fontWeight: 400 }}>{value}</span>
    </div>
  );

  return (
    /* Overlay backdrop */
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", justifyContent: "flex-end",
      }}
    >
      <button
        type="button"
        aria-label="Close call info"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          border: "none",
          padding: 0,
          margin: 0,
          background: "transparent",
          cursor: "pointer",
        }}
      />

      <div
        style={{
          width: 440,
          height: "100%",
          backgroundColor: "#FFFFFF",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.10)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          animation: "slideIn 200ms ease",
          position: "relative",
          zIndex: 1,
        }}
      >
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 20px 16px",
          borderBottom: "1px solid #F0F0F0",
          position: "sticky", top: 0, backgroundColor: "#FFFFFF", zIndex: 10,
        }}>
          <span style={{ fontFamily: FF, fontSize: 18, fontWeight: 700, color: "#111111" }}>
            Call info
          </span>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 4, borderRadius: 6, display: "flex", alignItems: "center",
            color: "#6B6B6B",
          }}>
            <X size={20} color="#6B6B6B" />
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, padding: "20px 20px 32px", overflowY: "auto" }}>

          {/* Call ID row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <span style={{ fontFamily: FF, fontSize: 12, fontWeight: 600, color: "#6B6B6B", flexShrink: 0 }}>
              Call ID
            </span>
            <span style={{
              fontFamily: FF, fontSize: 12, color: "#1A1A1A",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              maxWidth: 280,
            }}>
              {call.callId}
            </span>
            <button
              onClick={handleCopy}
              title={copied ? "Copied!" : "Copy"}
              style={{
                background: "none", border: "1px solid #E0E0E0", cursor: "pointer",
                borderRadius: 4, padding: "2px 5px", display: "flex", alignItems: "center",
                flexShrink: 0, transition: TRANS,
                backgroundColor: copied ? "#f0faf5" : "#FFFFFF",
              }}
            >
              <Copy size={13} color={copied ? "#00A878" : "#9CA3AF"} />
            </button>
          </div>

          {divider}

          {/* Tags section */}
          <div style={{ padding: "14px 0" }}>
            {sectionLabel(<Tag size={15} />, "Tags")}
            <p style={{ fontFamily: FF, fontSize: 13, color: "#9CA3AF", margin: 0 }}>
              No tags added yet
            </p>
          </div>

          {divider}

          {/* Notes section */}
          <div style={{ padding: "14px 0" }}>
            {sectionLabel(<AlignLeft size={15} />, "Notes")}
            <p style={{ fontFamily: FF, fontSize: 13, color: "#9CA3AF", margin: 0 }}>
              No notes added yet
            </p>
          </div>

          {/* AI Banner */}
          {aiBannerVisible && (
            <div style={{
              margin: "16px 0",
              backgroundColor: "#E8FAF4",
              border: "1px solid #B2EDD8",
              borderRadius: 10,
              padding: "16px",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  backgroundColor: "#00C896",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Sparkles size={16} color="#FFFFFF" />
                </div>
                <p style={{
                  fontFamily: FF, fontSize: 13, fontWeight: 500,
                  color: "#1A3D2B", margin: 0, lineHeight: "20px",
                }}>
                  Speed up your call review by 2 with<br />
                  Instant summarization and Key topics detection
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 17, marginLeft: 40 }}>
                <button
                  onClick={() => setAiBannerVisible(false)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: FF, fontSize: 15, fontWeight: 300, color: "#3E525B",
                    padding: "6px 0",
                  }}
                >
                  Close
                </button>
                <button style={{
                  backgroundColor: "#004736", color: "#FFFFFF",
                  border: "none", borderRadius: 8, cursor: "pointer",
                  fontFamily: FF, fontSize: 15, fontWeight: 300,
                  padding: "9px 16px", lineHeight: "18px",
                  transition: TRANS,
                }}>
                  Learn more about Prime Alley AI
                </button>
              </div>
            </div>
          )}

          {divider}

          {/* Outbound / Inbound call section */}
          <div style={{ padding: "14px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              {call.isOutbound
                ? <ArrowUpRight size={16} color="#3b82f6" />
                : <PhoneIncoming size={16} color="#22c55e" />
              }
              <span style={{ fontFamily: FF, fontSize: 15, fontWeight: 700, color: "#111111" }}>
                {call.isOutbound ? "Outbound call" : "Inbound call"}
              </span>
            </div>
            {infoRow("Customer", call.customer)}
            {infoRow("Started at", call.startedAtFull)}
            {infoRow("Status",
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {call.callStatus}
                <Phone size={13} color="#22c55e" />
              </span>
            )}
          </div>

          {divider}

          {/* Timing section */}
          <div style={{ padding: "14px 0" }}>
            {sectionLabel(<Clock size={15} />, "Timing")}
            {infoRow("In call time",    call.inCallTime)}
            {infoRow("Total call time", call.totalCallTime)}
          </div>

          {divider}

          {/* Number section */}
          <div style={{ padding: "14px 0" }}>
            {sectionLabel(<PhoneCall size={15} />, "Number")}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>🇺🇸</span>
              <div>
                <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>
                  {call.number}
                </div>
                <div style={{ fontFamily: FF, fontSize: 12, color: "#6B6B6B", marginTop: 1 }}>
                  {call.numberPhone}
                </div>
              </div>
            </div>
          </div>

          {divider}

          {/* Teams & users section */}
          <div style={{ padding: "14px 0" }}>
            {sectionLabel(<Users size={15} />, "Teams & users")}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {call.teams.map((team) => (
                <div key={team.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    border: "1.5px solid #E0E0E0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, backgroundColor: "#FAFAFA", flexShrink: 0,
                  }}>
                    {team.emoji}
                  </div>
                  <span style={{ fontFamily: FF, fontSize: 13, color: "#1A1A1A" }}>
                    {team.name}
                  </span>
                </div>
              ))}
              {/* User row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  border: "1.5px solid #E0E0E0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backgroundColor: "#3E525B", flexShrink: 0,
                }}>
                  <span style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, color: "#fff" }}>
                    {call.user.split(" ").map(w => w[0]).join("")}
                  </span>
                </div>
                <span style={{ fontFamily: FF, fontSize: 13, color: "#1A1A1A" }}>
                  {call.user}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};


const RestoreBtn: React.FC = () => (
  <button style={{
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontFamily: FF, transition: TRANS, borderWidth: 1.5, borderStyle: "solid",
    borderColor: "transparent", borderRadius: 8, cursor: "pointer", userSelect: "none",
    color: "#3E525B", backgroundColor: "transparent", fontSize: 16, lineHeight: "20px",
    fontWeight: 500, height: 40, padding: "0 12px", background: "none",
  }}>
    <RotateCcw size={16} color="#3E525B" /> Restore
  </button>
);

const SaveBtn: React.FC = () => (
  <button style={{
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontFamily: FF, transition: TRANS, borderWidth: 1.5, borderStyle: "solid",
    borderColor: "#3E525B", borderRadius: 8, cursor: "pointer", userSelect: "none",
    color: "#FFFFFF", backgroundColor: "#3E525B", fontSize: 16, lineHeight: "20px",
    fontWeight: 500, height: 40, padding: "0 16px",
  }}>
    Save
  </button>
);

const IconBtn: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <button style={{
    background: "none", border: "none", cursor: "pointer",
    padding: 6, borderRadius: 6, display: "flex", alignItems: "center",
  }}>
    {children}
  </button>
);

// Filter dropdown (Numbers / Users / Teams)
const FilterDropdown: React.FC<{ label: string }> = ({ label }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 8, height: 40,
          paddingLeft: 14, paddingRight: 12, borderRadius: 8,
          border: "1px solid #D6D6D6", backgroundColor: "#FFFFFF",
          cursor: "pointer", userSelect: "none", fontFamily: FF,
          fontSize: 14, fontWeight: 500, color: "#24262A",
          minWidth: 130, boxSizing: "border-box" as const, width: "100%",
          textAlign: "left",
        }}
      >
        <span style={{ flex: 1 }}>{label}</span>
        <ChevronDown size={15} color="#9CA3AF" strokeWidth={2} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 150,
          backgroundColor: "#fff", border: "1px solid #E0E0E0", borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.10)", zIndex: 300, padding: "4px 0",
        }}>
          {["All", "Option A", "Option B"].map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOpen(false)}
              style={{
                width: "100%",
                textAlign: "left",
                border: "none",
                background: "transparent",
                padding: "9px 14px",
                cursor: "pointer",
                fontSize: 14,
                fontFamily: FF,
                color: "#24262A",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F5F5F5"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Today dropdown
const TodayDropdown: React.FC = () => {
  const [open, setOpen] = useState(false);
  const options = ["Today", "Yesterday", "Last 7 days", "Last 30 days"];
  const [sel, setSel] = useState("Today");
  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 8, height: 40,
          paddingLeft: 16, paddingRight: 14, border: "1px solid #D6D6D6",
          borderRadius: 8, backgroundColor: "#FFFFFF", cursor: "pointer",
          fontFamily: FF, fontSize: 14, fontWeight: 500, color: "#24262A",
          minWidth: 120, boxSizing: "border-box" as const,
          width: "100%",
          textAlign: "left",
        }}
      >
        <span style={{ flex: 1 }}>{sel}</span>
        <ChevronDown size={15} color="#9CA3AF" strokeWidth={2} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0, minWidth: 150,
          backgroundColor: "#fff", border: "1px solid #E0E0E0", borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.10)", zIndex: 300, padding: "4px 0",
        }}>
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => { setSel(o); setOpen(false); }}
              style={{
                width: "100%",
                textAlign: "left",
                border: "none",
                backgroundColor: sel === o ? "#F0F0F0" : "transparent",
                padding: "9px 16px",
                cursor: "pointer",
                fontSize: 14,
                fontFamily: FF,
                color: "#24262A",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F5F5F5"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = sel === o ? "#F0F0F0" : "transparent"; }}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Toggle switch
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    style={{
      border: "none",
      padding: 0,
      margin: 0,
      background: "none",
    width: 44, height: 24, borderRadius: 12,
    backgroundColor: checked ? "#00C896" : "#D1D5DB",
    position: "relative", cursor: "pointer",
    transition: "background-color 200ms", flexShrink: 0,
  }}>
    <div style={{
      position: "absolute", top: 2, left: checked ? 22 : 2,
      width: 20, height: 20, borderRadius: "50%", backgroundColor: "#fff",
      boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 200ms",
    }} />
  </button>
);

// ── SLA Card: 128×148 ─────────────────────────────────────────────────────────
const SLACard: React.FC<{ percent: number }> = ({ percent }) => {
  const size = 96, sw = 7, r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
    <div style={{
      width: 164, height:164, flexShrink: 0, backgroundColor: "#FFFFFF",
      border: "1px solid #E0E0E0", borderRadius: 8, display: "flex",
      alignItems: "center", justifyContent: "center", position: "relative",
      boxSizing: "border-box" as const,
    }}>
      <div style={{ position: "absolute", top: 8, right: 8 }}>
        <Settings2 size={13} color="#BDBDBD" />
      </div>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E8E8E8" strokeWidth={sw} />
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={percent > 0 ? "#004736" : "#E8E8E8"}
            strokeWidth={sw}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={circ / 4}
            strokeLinecap="round"
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontFamily: FF, fontWeight: 700, fontSize: 18, color: "#24262A", lineHeight: "22px" }}>
            {percent}%
          </span>
          <span style={{ fontFamily: FF, fontSize: 12, color: "#6B6B6B", lineHeight: "16px" }}>SLA</span>
        </div>
      </div>
    </div>
  );
};

// ── Calls Waiting Card: 128×148 ───────────────────────────────────────────────
const CallsWaitingCard: React.FC<{ value: number }> = ({ value }) => {
  const size = 72, sw = 6, r = (size - sw) / 2, circ = 2 * Math.PI * r;
  return (
    <div style={{
      width: 128, height: 164, flexShrink: 0, backgroundColor: "#FFFFFF",
      border: "1px solid #E0E0E0", borderRadius: 8, display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 8, boxSizing: "border-box" as const, padding: 8,
    }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E8E8E8" strokeWidth={sw} />
          {value > 0 && (
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#00C896" strokeWidth={sw}
              strokeDasharray={`${(value / Math.max(value, 5)) * circ} ${circ}`}
              strokeDashoffset={circ / 4} strokeLinecap="round"
            />
          )}
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", fontFamily: FF, fontWeight: 700, fontSize: 24, color: "#004736",
        }}>{value}</div>
      </div>
      <div style={{ fontFamily: FF, fontSize: 12, color: "#6B6B6B", lineHeight: "16px", textAlign: "center" }}>
        Calls waiting
      </div>
    </div>
  );
};

// ── Individual KPI stat card: fixed width, height 83 ─────────────────────────
interface KpiStatCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  extraContent?: React.ReactNode;
  showGear?: boolean;
  borderless?: boolean;
  style?: React.CSSProperties;
}

const KpiStatCard: React.FC<KpiStatCardProps> = ({
  label,
  value,
  suffix,
  extraContent,
  showGear,
  borderless,
  style,
}) => (
  <div style={{
    height: 75, flex: "1 1 140px", minWidth: 120, 
    backgroundColor: "#FFFFFF", border: "1px solid #E0E0E0",
    borderRadius: 8, display: "flex", flexDirection: "column",
    justifyContent: "center", padding: "8px 14px",
    boxSizing: "border-box" as const, position: "relative",
    ...(borderless ? { border: "none", borderRadius: 0 } : {}),
    ...style,
  }}>
    {showGear && (
      <div style={{ position: "absolute", top: 8, right: 8 }}>
        <Settings2 size={13} color="#BDBDBD" />
      </div>
    )}
    <div style={{ color: "#6B6B6B", fontFamily: FF, fontSize: 12, lineHeight: "16px", fontWeight: 400, marginBottom: 1 }}>
      {label}
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexWrap: "nowrap" }}>
      <span style={{ color: "#004736", fontFamily: FF, fontWeight: 700, fontSize: 24, lineHeight: "32px" }}>
        {value}
      </span>
      {suffix && (
        <span style={{ fontFamily: FF, fontSize: 13, color: "#6B6B6B", lineHeight: "20px", fontWeight: 400 }}>
          {suffix}
        </span>
      )}
      {extraContent}
    </div>
  </div>
);

const MergedKpiGroup: React.FC<{ cards: KpiStatCardProps[] }> = ({ cards }) => (
  <div style={{
    height: 75,
    display: "flex",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E0E0E0",
    borderRadius: 8,
    overflow: "hidden",
  }}>
    {cards.map((card, index) => (
      <div
        key={card.label}
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        <KpiStatCard
          {...card}
          borderless
          style={{
            height: "100%",
            minWidth: 0,
          }}
        />
      </div>
    ))}
  </div>
);

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ Offline: true });

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // Donut chart for user status summary
  const totalUsers = USER_STATUS_GROUPS.reduce((s, g) => s + g.count, 0);
  const offlineCount = USER_STATUS_GROUPS.find(g => g.label === "Offline")?.count ?? 0;
  const size = 80, sw = 7, r = (size - sw) / 2, circ = 2 * Math.PI * r;
  // offline segment (grey)
  const offlineFrac = totalUsers > 0 ? offlineCount / totalUsers : 0;
  const offlineDash = offlineFrac * circ;

  return (
    <div style={{
      width: 295, flexShrink: 0, borderLeft: "1px solid #E8E8E8",
      backgroundColor: "#FFFFFF", display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 16px 14px", borderBottom: "1px solid #EEEEEE",
      }}>
        <span style={{ fontFamily: FF, fontSize: 16, fontWeight: 700, color: "#111111" }}>
          User status
        </span>
        <button onClick={onClose} style={{
          background: "none", border: "none", cursor: "pointer", padding: 4,
          borderRadius: 4, display: "flex", alignItems: "center",
        }}>
          <X size={18} color="#6B6B6B" />
        </button>
      </div>

      {/* Donut summary card */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #EEEEEE" }}>
        <div style={{
          border: "1px solid #E8E8E8", borderRadius: 10, padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 16, backgroundColor: "#FFFFFF",
        }}>
          <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size}>
              {/* Background ring */}
              <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E8E8E8" strokeWidth={sw} />
              {/* Offline (grey) segment */}
              {offlineCount > 0 && (
                <circle cx={size/2} cy={size/2} r={r} fill="none"
                  stroke="#9ca3af"
                  strokeWidth={sw}
                  strokeDasharray={`${offlineDash} ${circ - offlineDash}`}
                  strokeDashoffset={circ / 4}
                  strokeLinecap="round"
                />
              )}
              {/* If all users: full green ring */}
              {totalUsers > 0 && offlineCount === 0 && (
                <circle cx={size/2} cy={size/2} r={r} fill="none"
                  stroke="#22c55e"
                  strokeWidth={sw}
                  strokeDasharray={`${circ} 0`}
                  strokeDashoffset={circ / 4}
                  strokeLinecap="round"
                />
              )}
            </svg>
          </div>
          <div>
            <div style={{ color: "#6B6B6B", fontFamily: FF, fontSize: 12, lineHeight: "16px", fontWeight: 400, marginBottom: 2 }}>
              User status
            </div>
            <div style={{ color: "#111111", fontFamily: FF, fontWeight: 700, fontSize: 28, lineHeight: "34px" }}>
              {totalUsers}
            </div>
            <div style={{ color: "#6B6B6B", fontFamily: FF, fontSize: 12, lineHeight: "16px", fontWeight: 400 }}>
              Total
            </div>
          </div>
        </div>
      </div>

      {/* Status groups list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 16 }}>
        {USER_STATUS_GROUPS.map((group) => {
          const isExpanded = expandedGroups[group.label];
          const hasUsers = group.users.length > 0;
          return (
            <div key={group.label}>
              {/* Group row */}
              <button
                type="button"
                aria-expanded={hasUsers ? isExpanded : undefined}
                disabled={!hasUsers}
                onClick={() => toggleGroup(group.label)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px", borderRadius: 8,
                  backgroundColor: "rgb(247, 247, 247)",
                  cursor: hasUsers ? "pointer" : "default",
                  userSelect: "none",
                  width: "100%",
                  border: "none",
                  textAlign: "left",
                  opacity: 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: FF, fontSize: 16, fontWeight: 600, color: "#1A1A1A" }}>
                    {group.label}
                  </span>
                  {/* Badge */}
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    minWidth: 22, height: 22, borderRadius: 11,
                    backgroundColor: group.badgeColor,
                    color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: FF,
                    padding: "0 5px",
                  }}>
                    {group.count}
                  </span>
                </div>
                {hasUsers && (
                  isExpanded
                    ? <ChevronUp size={15} color="#6B6B6B" />
                    : <ChevronDown size={15} color="#6B6B6B" />
                )}
              </button>

              {/* Expanded users */}
              {isExpanded && hasUsers && (
                <div style={{ paddingTop: 4, paddingLeft: 4, paddingRight: 4 }}>
                  {group.users.map((u) => (
                    <div key={u.name} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 10px 9px 10px",
                    }}>
                      {/* Avatar */}
                      <div style={{
                        width: 34, height: 34, borderRadius: "50%",
                        backgroundColor: u.bgColor,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: FF,
                        flexShrink: 0, border: "2px solid #E8E8E8",
                      }}>
                        {u.initials}
                      </div>
                      {/* Name */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: FF, fontSize: 13, fontWeight: 600, color: "#1A1A1A",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {u.name}
                        </div>
                      </div>
                      {/* Duration */}
                      <div style={{ fontFamily: FF, fontSize: 12, color: "#6B6B6B", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {u.duration}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const LiveMonitoring: React.FC & { getLayout?: (page: ReactElement) => ReactElement } = () => {
  const [showKPIs, setShowKPIs] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("calls");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedCall, setSelectedCall] = useState<CallRow | null>(null);
  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: "calls",   label: "Calls",   icon: <Phone size={13} /> },
    { key: "users",   label: "Users",   icon: <Users size={13} /> },
    { key: "numbers", label: "Numbers", icon: <Phone size={13} /> },
  ];

  // Unanswered extra: percentage + avatar
  const UnansweredExtra = (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: 4 }}>
      <span style={{ fontFamily: FF, fontSize: 12, color: "#6B6B6B" }}>0%</span>
      {/* <div style={{
        width: 22, height: 22, borderRadius: "50%", backgroundColor: "#00C896",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: FF, flexShrink: 0,
      }}>A</div> */}
    </div>
  );

  let filterLabel: string;
  let countText: string;
  if (activeTab === "calls") {
    filterLabel = "Filter calls";
    countText = pluralize(CALL_DATA.length, "call");
  } else if (activeTab === "users") {
    filterLabel = "Filter users";
    countText = pluralize(USERS_DATA.length, "user");
  } else {
    filterLabel = "Filter numbers";
    countText = pluralize(NUMBERS_DATA.length, "number");
  }

  return (
    <div style={{ minHeight: "100vh", height: "100%", backgroundColor: "#FFFFFF", fontFamily: FF }}>

      {/* ── Top Header ─────────────────────────────────────────────────────── */}
      {/* <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: 64, backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E8E8E8",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1 style={{
            fontSize: 32, lineHeight: "40px", fontWeight: 700, color: "#000000",
            fontFamily: FF, margin: 0,
          }}>
            Live Monitoring +
          </h1>
          <span style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block", flexShrink: 0 }} />
          <RefreshCw size={15} color="#9CA3AF" style={{ cursor: "pointer", flexShrink: 0 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <RestoreBtn />
          <SaveBtn />
          <div style={{ width: 1, height: 24, backgroundColor: "#E8E8E8", margin: "0 4px" }} />
          <IconBtn><Settings size={20} color="#3E525B" /></IconBtn>
          <IconBtn><Maximize2 size={20} color="#3E525B" /></IconBtn>
          <IconBtn><HelpCircle size={20} color="#3E525B" /></IconBtn>
        </div>
      </div> */}

      {/* ── Main white card ─────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: "#FFFFFF", margin: 12, 
         overflow: "hidden",
        display: "flex", flexDirection: "column",
        minHeight: "calc(100vh - 24px)",
        boxSizing: "border-box" as const,
      }}>
<div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: 64, backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E8E8E8",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1 style={{
            fontSize: 32, lineHeight: "40px", fontWeight: 700, color: "#000000",
            fontFamily: FF, margin: 0,
          }}>
            Live Monitoring
          </h1>
          <span style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block", flexShrink: 0 }} />
          <RefreshCw size={15} color="#9CA3AF" style={{ cursor: "pointer", flexShrink: 0 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <RestoreBtn />
          <SaveBtn />
          <div style={{ width: 1, height: 24, backgroundColor: "#E8E8E8", margin: "0 4px" }} />
          <IconBtn><Settings size={20} color="#3E525B" /></IconBtn>
          <IconBtn><Maximize2 size={20} color="#3E525B" /></IconBtn>
          <IconBtn><HelpCircle size={20} color="#3E525B" /></IconBtn>
        </div>
      </div>
        {/* ── Filter toolbar ─────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderBottom: "1px solid #F0F0F0",
          flexWrap: "wrap", gap: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FilterDropdown label="Numbers" />
            <FilterDropdown label="Users" />
            <FilterDropdown label="Teams" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Toggle checked={showKPIs} onChange={setShowKPIs} />
              <span style={{ fontFamily: FF, fontSize: 14, fontWeight: 500, color: "#24262A", userSelect: "none" }}>
                Show KPIs
              </span>
            </div>
            <TodayDropdown />
          </div>
        </div>

        {/* ── Content row ────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ── Left column ──────────────────────────────────────────────── */}
          <div style={{ flex: 1, overflow: "auto", minWidth: 0 }}>

            {/* ── KPI Section ──────────────────────────────────────────── */}
            {showKPIs && (
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #F0F0F0" }}>
                {/*
                  Layout:
                  [SLA 128×148]  [flex row of 6 individual 83px cards]  [CallsWaiting 128×148]

                  The 6 stat cards fill the space between SLA and CallsWaiting.
                  They are in two rows of 3:
                    Row 1: Total calls | Outbound | Time to answer
                    Row 2: Inbound     | Answered | Unanswered
                  Achieved with a flex-wrap grid that fills available space.
                  Longest waiting and Available users are also individual cards in the right area.

                  Actually per the original design image description:
                  Row 1 top: Total calls, Outbound, Time to answer, Longest waiting
                  Row 2 bot: Inbound, Answered, Unanswered, Available users
                  All 8 cards are the same height (83px) in a 4-col × 2-row grid between SLA and Calls Waiting.
                */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 17 }}>

                  {/* SLA card — fixed 128×148 */}
                  <SLACard percent={0} />

                  {/* Middle: 4-col × 2-row grid of stat cards — fills remaining space */}
                  <div style={{
                    flex: 1, minWidth: 0,
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gridTemplateRows: "73px 79px",
                    gap: 17,
                    alignContent: "start",
                  }}>
                    {/* Row 1 */}
                    <KpiStatCard label="Total calls"     value={1} />
                    <KpiStatCard label="Outbound"        value={1} />
                    <KpiStatCard label="Time to answer"  value="0" suffix="s  avg." />
                    <KpiStatCard label="Longest waiting" value="0" suffix="s" />
                    {/* Row 2 */}
                    <div style={{ gridColumn: "1 / span 3" }}>
                      <MergedKpiGroup
                        cards={[
                          { label: "Inbound", value: 0 },
                          { label: "Answered", value: 0 },
                          { label: "Unanswered", value: 0, extraContent: UnansweredExtra, showGear: true },
                        ]}
                      />
                    </div>
                    <KpiStatCard label="Available users" value={1} />
                  </div>

                  {/* Calls Waiting card — fixed 128×148 */}
                  <CallsWaitingCard value={0} />

                </div>
              </div>
            )}

            {/* ── Pill Tabs ─────────────────────────────────────────────── */}
            <div style={{
              display: "flex", justifyContent: "center",
              padding: "14px 16px 10px", 
            }}>
              <div style={{
                display: "flex", backgroundColor: "#F4F5F7", borderRadius: 24,
                padding: 4, width: 300, gap: 2, boxSizing: "border-box" as const,
              }}>
                {tabs.map((tab) => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 6, padding: "6px 0", borderRadius: 20, border: "none",
                    cursor: "pointer", fontFamily: FF, fontSize: 13, fontWeight: 500,
                    transition: "all 150ms",
                    backgroundColor: activeTab === tab.key ? "#3E525B" : "transparent",
                    color: activeTab === tab.key ? "#FFFFFF" : "#6B6B6B",
                  }}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Filter / count row ─────────────────────────────────── */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 16px",
            }}>
              <button style={{
                display: "flex", alignItems: "center", gap: 4, background: "none",
                border: "none", cursor: "pointer", fontFamily: FF, fontSize: 13,
                fontWeight: 500, color: "#24262A", padding: "4px 8px", borderRadius: 6,
              }}>
                {filterLabel}
                <ChevronDown size={14} />
              </button>
              <span style={{ fontFamily: FF, fontSize: 13, color: "#6B6B6B" }}>
                {countText}
              </span>
            </div>

            {/* ── Table ────────────────────────────────────────────────── */}
            <div style={{ overflow: "auto" }}>

              {/* ── Calls Table ── */}
              {activeTab === "calls" && (
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FF, fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderTop: "1px solid #F0F0F0", borderBottom: "1px solid #F0F0F0" }}>
                      {["", "User", "Number", "Customer", "Status", "Started at"].map((col) => (
                        <th key={col} style={{ textAlign: "left", padding: "8px 16px", color: "#6B6B6B", fontWeight: 500, fontSize: 12, whiteSpace: "nowrap" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CALL_DATA.map((row) => {
                      const isSelected = selectedCall?.id === row.id;
                      return (
                        <tr key={row.id} onClick={() => setSelectedCall(isSelected ? null : row)}
                          style={{ borderBottom: "1px solid #F8F8F8", cursor: "pointer", backgroundColor: isSelected ? "#F0FAF6" : "transparent", transition: "background-color 120ms" }}
                          onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "#FAFAFA"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = isSelected ? "#F0FAF6" : "transparent"; }}
                        >
                          <td style={{ padding: "12px 16px", width: 32 }}>
                            {row.isOutbound ? <ArrowUpRight size={16} color="#3b82f6" /> : <Phone size={16} color="#22c55e" />}
                          </td>
                          <td style={{ padding: "12px 16px", fontWeight: 500, color: "#24262A" }}>{row.user}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#24262A" }}>🇺🇸 {row.number}</div>
                          </td>
                          <td style={{ padding: "12px 16px", color: "#24262A" }}>{row.customer}</td>
                          <td style={{ padding: "12px 16px", color: "#24262A" }}>{row.status}</td>
                          <td style={{ padding: "12px 16px", color: "#6B6B6B" }}>{row.startedAt}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* ── Users Table ── */}
              {activeTab === "users" && (
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FF, fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderTop: "1px solid #F0F0F0", borderBottom: "1px solid #F0F0F0" }}>
                      {["User", "Status", "Calls handled", "Talk time", "Team"].map((col) => (
                        <th key={col} style={{ textAlign: "left", padding: "8px 16px", color: "#6B6B6B", fontWeight: 500, fontSize: 12, whiteSpace: "nowrap" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {USERS_DATA.map((row) => (
                      <tr key={row.id}
                        style={{ borderBottom: "1px solid #F8F8F8", transition: "background-color 120ms" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "#FAFAFA"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent"; }}
                      >
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: row.bgColor, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: FF, flexShrink: 0 }}>
                              {row.initials}
                            </div>
                            <span style={{ fontWeight: 500, color: "#24262A" }}>{row.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FF, fontSize: 12, fontWeight: 600, color: row.statusColor }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: row.statusColor, display: "inline-block", flexShrink: 0 }} />
                            {row.status}
                          </span>
                        </td>
                        <td style={{ padding: "10px 16px", color: "#24262A" }}>{row.callsHandled}</td>
                        <td style={{ padding: "10px 16px", color: "#24262A" }}>{row.talkTime}</td>
                        <td style={{ padding: "10px 16px", color: "#6B6B6B" }}>{row.team}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* ── Numbers Table ── */}
              {activeTab === "numbers" && (
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FF, fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderTop: "1px solid #F0F0F0", borderBottom: "1px solid #F0F0F0" }}>
                      {["Number", "Calls today", "Inbound", "Outbound", "Available users"].map((col) => (
                        <th key={col} style={{ textAlign: "left", padding: "8px 16px", color: "#6B6B6B", fontWeight: 500, fontSize: 12, whiteSpace: "nowrap" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {NUMBERS_DATA.map((row) => (
                      <tr key={row.id}
                        style={{ borderBottom: "1px solid #F8F8F8", transition: "background-color 120ms" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "#FAFAFA"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent"; }}
                      >
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 18, lineHeight: "1" }}>{row.flag}</span>
                            <div>
                              <div style={{ fontWeight: 600, color: "#24262A", fontFamily: FF, fontSize: 13 }}>{row.name}</div>
                              <div style={{ color: "#9CA3AF", fontFamily: FF, fontSize: 12, marginTop: 1 }}>{row.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "10px 16px", fontWeight: 600, color: "#004736" }}>{row.callsToday}</td>
                        <td style={{ padding: "10px 16px", color: "#22c55e", fontWeight: 500 }}>{row.inbound}</td>
                        <td style={{ padding: "10px 16px", color: "#3b82f6", fontWeight: 500 }}>{row.outbound}</td>
                        <td style={{ padding: "10px 16px", color: "#24262A" }}>{row.availableUsers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

            </div>

          </div>{/* end left column */}

          {/* ── Right Sidebar ─────────────────────────────────────────────── */}
          {sidebarOpen && <Sidebar onClose={() => setSidebarOpen(false)} />}

          {/* Sidebar re-open tab */}
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} title="Open User Status" style={{
              position: "fixed", right: 0, top: "50%", transform: "translateY(-50%)",
              background: "#3E525B", border: "none", borderRadius: "8px 0 0 8px",
              padding: "12px 6px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4, zIndex: 50,
            }}>
              <Users size={16} color="#fff" />
            </button>
          )}

{selectedCall && (
  <CallInfoSidebar call={selectedCall} onClose={() => setSelectedCall(null)} />
)}
        </div>{/* end content row */}
      </div>{/* end main card */}
    </div>
  );
};

LiveMonitoring.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default LiveMonitoring;
