"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  LabelList,
} from "recharts";
import { Info } from "lucide-react";
const FONT = "'Lexend Deca', Helvetica, Arial, sans-serif";

const TICK_STYLE = {
  fontFamily: FONT,
  fontSize: 11,
  fill: "#141414",
  fontWeight: 100,
};

// ─── Leaderboard Data ─────────────────────────────────────────────────────────

const leaderboardData = [
  {
    name: "Rizwan Haider",
    propertyValue: 12,
    crmObject: 4,
    crmObjectAssociation: 3,
  },
];

// ─── Calls vs Goal Data ───────────────────────────────────────────────────────
// Achieved = actual count; Target = goal/target for comparison
const callsData = [
  { date: "1/1/2026",   calls: 12,  callsGoal: 25,  leads: 45,   leadsGoal: 50,   orders: 28,  ordersGoal: 35 },
  { date: "8/1/2026",   calls: 18,  callsGoal: 25,  leads: 62,   leadsGoal: 55,   orders: 41,  ordersGoal: 40 },
  { date: "15/1/2026",  calls: 8,   callsGoal: 20,  leads: 58,   leadsGoal: 60,   orders: 55,  ordersGoal: 50 },
  { date: "22/1/2026",  calls: 22,  callsGoal: 30,  leads: 85,   leadsGoal: 80,   orders: 48,  ordersGoal: 55 },
  { date: "29/1/2026",  calls: 15,  callsGoal: 28,  leads: 72,   leadsGoal: 75,   orders: 68,  ordersGoal: 65 },
  { date: "5/2/2026",   calls: 28,  callsGoal: 35,  leads: 95,   leadsGoal: 90,   orders: 82,  ordersGoal: 80 },
  { date: "12/2/2026",  calls: 20,  callsGoal: 32,  leads: 112,  leadsGoal: 100,  orders: 76,  ordersGoal: 85 },
  { date: "19/2/2026",  calls: 25,  callsGoal: 35,  leads: 98,   leadsGoal: 105,  orders: 91,  ordersGoal: 90 },
  { date: "20/2/2026",  calls: 35,  callsGoal: 40,  leads: 125,  leadsGoal: 120,  orders: 105, ordersGoal: 100 },
  { date: "21/2/2026",  calls: 42,  callsGoal: 45,  leads: 118,  leadsGoal: 125,  orders: 115, ordersGoal: 110 },
  { date: "22/2/2026",  calls: 18,  callsGoal: 38,  leads: 132,  leadsGoal: 130,  orders: 92,  ordersGoal: 95 },
  { date: "1/3/2026",   calls: 30,  callsGoal: 40,  leads: 145,  leadsGoal: 140,  orders: 128, ordersGoal: 120 },
  { date: "11/4/2026",  calls: 38,  callsGoal: 45,  leads: 158,  leadsGoal: 150,  orders: 135, ordersGoal: 130 },
  { date: "31/5/2026",  calls: 24,  callsGoal: 42,  leads: 142,  leadsGoal: 145,  orders: 118, ordersGoal: 125 },
  { date: "20/7/2026",  calls: 32,  callsGoal: 40,  leads: 128,  leadsGoal: 135,  orders: 148, ordersGoal: 140 },
  { date: "8/9/2026",   calls: 26,  callsGoal: 38,  leads: 105,  leadsGoal: 120,  orders: 132, ordersGoal: 130 },
  { date: "28/10/2026", calls: 19,  callsGoal: 35,  leads: 88,   leadsGoal: 100,  orders: 115, ordersGoal: 120 },
  { date: "17/12/2026", calls: 14,  callsGoal: 30,  leads: 65,   leadsGoal: 80,   orders: 95,  ordersGoal: 100 },
];

// Parse "d/M/yyyy" to Date
function parseChartDate(s: string): Date {
  const [d, m, y] = s.split("/").map(Number);
  return new Date(y, m - 1, d);
}

// Aggregate by calendar week (Sunday start); label = "1 Jan", "8 Jan", etc.
function getWeeklyData() {
  const groups = new Map<
    number,
    { calls: number; callsGoal: number; leads: number; leadsGoal: number; orders: number; ordersGoal: number; date: string; dateObj: Date }
  >();
  callsData.forEach((row) => {
    const d = parseChartDate(row.date);
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - d.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const key = startOfWeek.getTime();
    const existing = groups.get(key);
    const dateLabel = `${startOfWeek.getDate()} ${startOfWeek.toLocaleString("en", { month: "short" })}`;
    if (!existing) {
      groups.set(key, {
        date: dateLabel,
        dateObj: startOfWeek,
        calls: row.calls,
        callsGoal: row.callsGoal,
        leads: row.leads,
        leadsGoal: row.leadsGoal,
        orders: row.orders,
        ordersGoal: row.ordersGoal,
      });
    } else {
      existing.calls += row.calls;
      existing.callsGoal += row.callsGoal;
      existing.leads += row.leads;
      existing.leadsGoal += row.leadsGoal;
      existing.orders += row.orders;
      existing.ordersGoal += row.ordersGoal;
    }
  });
  return Array.from(groups.values())
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
    .map(({ dateObj, ...rest }) => ({ ...rest, date: rest.date }));
}

// Aggregate by month; label = "Jan 2026"
function getMonthlyData() {
  const groups = new Map<
    string,
    { calls: number; callsGoal: number; leads: number; leadsGoal: number; orders: number; ordersGoal: number; date: string; dateObj: Date }
  >();
  callsData.forEach((row) => {
    const d = parseChartDate(row.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const dateLabel = `${d.toLocaleString("en", { month: "short" })} ${d.getFullYear()}`;
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        date: dateLabel,
        dateObj: new Date(d.getFullYear(), d.getMonth(), 1),
        calls: row.calls,
        callsGoal: row.callsGoal,
        leads: row.leads,
        leadsGoal: row.leadsGoal,
        orders: row.orders,
        ordersGoal: row.ordersGoal,
      });
    } else {
      existing.calls += row.calls;
      existing.callsGoal += row.callsGoal;
      existing.leads += row.leads;
      existing.leadsGoal += row.leadsGoal;
      existing.orders += row.orders;
      existing.ordersGoal += row.ordersGoal;
    }
  });
  return Array.from(groups.values())
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
    .map(({ dateObj, ...rest }) => ({ ...rest, date: rest.date }));
}

const weeklyData = getWeeklyData();
const monthlyData = getMonthlyData();

function scaleNumber(value: number, scale: number) {
  return Math.round(value * scale);
}

// ─── Shared pill badge ────────────────────────────────────────────────────────

function PillBadge({
  children,
  active,
  onClick,
}: Readonly<{
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}>) {
  const isButton = typeof onClick === "function";
  const style = {
    display: "inline-block",
    border: `1px solid ${active ? "#00818a" : "#adadad"}`,
    borderRadius: "3px",
    padding: "2px 8px",
    fontSize: "11px",
    fontWeight: 400,
    color: active ? "#00818a" : "#141414",
    fontFamily: FONT,
    backgroundColor: active ? "#e6f7f8" : "#fff",
    lineHeight: "16px",
    cursor: isButton ? "pointer" : undefined,
  };
  if (isButton) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{ ...style, background: "none", font: "inherit" }}
      >
        {children}
      </button>
    );
  }
  return <span style={style}>{children}</span>;
}

// ─── Custom tooltip for leaderboard ──────────────────────────────────────────

const LeaderboardTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #e0e0e0",
          borderRadius: "6px",
          padding: "8px 12px",
          fontFamily: FONT,
          fontSize: 12,
          color: "#141414",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ color: p.fill, marginBottom: 2 }}>
            {p.name}: <strong>{p.value}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Custom tooltip for calls ─────────────────────────────────────────────────

const CallsTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #e0e0e0",
          borderRadius: "6px",
          padding: "8px 12px",
          fontFamily: FONT,
          fontSize: 12,
          color: "#141414",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ marginBottom: 2 }}>
            <span style={{ color: p.color }}>{p.name}: </span>
            <strong>{p.value}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Activity Leaderboard Chart ───────────────────────────────────────────────

function ActivityLeaderboard({ scale }: Readonly<{ scale: number }>) {
  const scaledLeaderboardData = leaderboardData.map((row) => ({
    ...row,
    propertyValue: scaleNumber(row.propertyValue, scale),
    crmObject: scaleNumber(row.crmObject, scale),
    crmObjectAssociation: scaleNumber(row.crmObjectAssociation, scale),
  }));

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        border: "1px solid #e5e5e5",
        padding: "20px 20px 16px",
        flex: 1,
        minWidth: 0,
        fontFamily: FONT,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
        <span
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#00818a",
            fontFamily: FONT,
          }}
        >
          Top activities by count
        </span>
        <Info size={14} color="#888" />
      </div>

      {/* Pills */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
        <PillBadge>In the last 30 days</PillBadge>
        <PillBadge>Filters (2)</PillBadge>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={scaledLeaderboardData}
          layout="vertical"
          margin={{ top: 8, right: 36, left: 0, bottom: 28 }}
          barCategoryGap="5%"
        >
          <CartesianGrid
            horizontal={false}
            vertical={true}
            stroke="#d9d9d9"
            strokeDasharray="4 4"
          />
          <XAxis
            type="number"
            domain={[0, 20]}
            ticks={[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20]}
            tick={TICK_STYLE}
            axisLine={{ stroke: "#ccc" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={92}
            tick={{ ...TICK_STYLE, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<LeaderboardTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />

          {/* Property Value bar (salmon/orange) */}
          <Bar dataKey="propertyValue" name="Leads" stackId="a" fill="#F4A57A" radius={[0, 0, 0, 0]} maxBarSize={60}>
          </Bar>

          {/* CRM Object bar (teal) */}
          <Bar dataKey="crmObject" name="Companies" stackId="a" fill="#4ECDC4" maxBarSize={60}>
          </Bar>

          {/* CRM Object Association bar (purple) */}
          <Bar dataKey="crmObjectAssociation" name="Tasks" stackId="a" fill="#B5A7E0" radius={[0, 2, 2, 0]} maxBarSize={60}>
            <LabelList
              dataKey={(entry: any) =>
                entry.propertyValue + entry.crmObject + entry.crmObjectAssociation
              }
              position="right"
              style={{
                fontFamily: FONT,
                fontSize: 11,
                fontWeight: 700,
                fill: "#141414",
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Custom dot for legend ────────────────────────────────────────────────────

const renderLegendDot = (color: string, filled: boolean) => (
  <span
    style={{
      display: "inline-block",
      width: "10px",
      height: "10px",
      borderRadius: "50%",
      backgroundColor: filled ? color : "transparent",
      border: `2px solid ${color}`,
      marginRight: "5px",
      flexShrink: 0,
    }}
  />
);

// ─── Calls vs Goal Chart ──────────────────────────────────────────────────────

type PillRange = "daily" | "weekly" | "monthly";

function CallsVsGoal({ scale }: Readonly<{ scale: number }>) {
  const [activePill, setActivePill] = useState<PillRange>("daily");
  const [visible, setVisible] = useState({ calls: true, leads: true, orders: true });

  const chartData = useMemo(() => {
    let base = callsData;
    if (activePill === "weekly") base = weeklyData;
    else if (activePill === "monthly") base = monthlyData;
    return base.map((row) => ({
      ...row,
      calls: scaleNumber(row.calls, scale),
      callsGoal: scaleNumber(row.callsGoal, scale),
      leads: scaleNumber(row.leads, scale),
      leadsGoal: scaleNumber(row.leadsGoal, scale),
      orders: scaleNumber(row.orders, scale),
      ordersGoal: scaleNumber(row.ordersGoal, scale),
    }));
  }, [activePill, scale]);

  const toggleSeries = (key: "calls" | "leads" | "orders") => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const legendItemStyle = (isVisible: boolean) => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: 11,
    color: "#141414",
    fontFamily: FONT,
    fontWeight: 100,
    cursor: "pointer",
    opacity: isVisible ? 1 : 0.45,
  });

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        border: "1px solid #e5e5e5",
        padding: "20px 20px 16px",
        flex: 1,
        minWidth: 0,
        fontFamily: FONT,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
        <span
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#00818a",
            fontFamily: FONT,
          }}
        >
          Achieved vs Target
        </span>
        <Info size={14} color="#888" />
      </div>

      {/* Pills – clickable */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
        <PillBadge active={activePill === "daily"} onClick={() => setActivePill("daily")}>
          Daily
        </PillBadge>
        <PillBadge active={activePill === "weekly"} onClick={() => setActivePill("weekly")}>
          Weekly
        </PillBadge>
        <PillBadge active={activePill === "monthly"} onClick={() => setActivePill("monthly")}>
          Monthly
        </PillBadge>
      </div>

      {/* Custom legend – clickable to show/hide series */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 24px", marginBottom: "8px", paddingLeft: "8px" }}>
        <button
          type="button"
          onClick={() => toggleSeries("calls")}
          style={{ ...legendItemStyle(visible.calls), border: "none", background: "none", padding: 0 }}
        >
          {renderLegendDot("#F4A57A", visible.calls)}
          <span>Calls</span>
          <span style={{ color: "#999", marginLeft: "4px" }}>—</span>
          <span style={{ display: "inline-block", borderTop: "2px dashed #F4A57A", width: 14, verticalAlign: "middle" }} />
          <span>Calls target</span>
        </button>
        <button
          type="button"
          onClick={() => toggleSeries("leads")}
          style={{ ...legendItemStyle(visible.leads), border: "none", background: "none", padding: 0 }}
        >
          {renderLegendDot("#90CAF9", visible.leads)}
          <span>Leads</span>
          <span style={{ color: "#999", marginLeft: "4px" }}>—</span>
          <span style={{ display: "inline-block", borderTop: "2px dashed #90CAF9", width: 14, verticalAlign: "middle" }} />
          <span>Leads target</span>
        </button>
        <button
          type="button"
          onClick={() => toggleSeries("orders")}
          style={{ ...legendItemStyle(visible.orders), border: "none", background: "none", padding: 0 }}
        >
          {renderLegendDot("#A5D6A7", visible.orders)}
          <span>Orders</span>
          <span style={{ color: "#999", marginLeft: "4px" }}>—</span>
          <span style={{ display: "inline-block", borderTop: "2px dashed #A5D6A7", width: 14, verticalAlign: "middle" }} />
          <span>Orders target</span>
        </button>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={240}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 16, left: 70, bottom: 8 }}
        >
          <CartesianGrid
            horizontal={true}
            vertical={false}
            stroke="#e5e5e5"
            strokeDasharray="4 4"
          />
          <XAxis
            dataKey="date"
            tick={TICK_STYLE}
            axisLine={{ stroke: "#ccc" }}
            tickLine={false}
            interval={2}
            angle={0}
          />
          <YAxis
            domain={[0, "auto"]}
            tick={TICK_STYLE}
            axisLine={false}
            tickLine={false}
            width={22}
          />
          <Tooltip content={<CallsTooltip />} />

          

          {/* Achieved: Calls (solid) */}
          <Line
            type="monotone"
            dataKey="calls"
            stroke="#F4A57A"
            strokeWidth={1.5}
            hide={!visible.calls}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (payload.calls === 0) return <g key={props.key} />;
              return (
                <circle
                  key={props.key}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill="#F4A57A"
                  stroke="#F4A57A"
                />
              );
            }}
            name="Calls"
          />
          {/* Target: Calls (dashed) */}
          <Line
            type="monotone"
            dataKey="callsGoal"
            stroke="#F4A57A"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            dot={false}
            name="Calls target"
            hide={!visible.calls}
          />
          {/* Achieved: Leads (solid) */}
          <Line
            type="monotone"
            dataKey="leads"
            stroke="#90CAF9"
            strokeWidth={1.5}
            hide={!visible.leads}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (payload.leads === 0) return <g key={props.key} />;
              return (
                <circle
                  key={props.key}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill="#90CAF9"
                  stroke="#90CAF9"
                />
              );
            }}
            name="Leads"
          />
          {/* Target: Leads (dashed) */}
          <Line
            type="monotone"
            dataKey="leadsGoal"
            stroke="#90CAF9"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            dot={false}
            name="Leads target"
            hide={!visible.leads}
          />
          {/* Achieved: Orders (solid) */}
          <Line
            type="monotone"
            dataKey="orders"
            stroke="#A5D6A7"
            strokeWidth={1.5}
            hide={!visible.orders}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (payload.orders === 0) return <g key={props.key} />;
              return (
                <circle
                  key={props.key}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill="#A5D6A7"
                  stroke="#A5D6A7"
                />
              );
            }}
            name="Orders"
          />
          {/* Target: Orders (dashed) */}
          <Line
            type="monotone"
            dataKey="ordersGoal"
            stroke="#A5D6A7"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            dot={false}
            name="Orders target"
            hide={!visible.orders}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Combined Export ──────────────────────────────────────────────────────────

export default function ChartsRow({ scale = 1 }: Readonly<{ scale?: number }>) {
  return (
    <div
      style={{
        display: "flex",
        gap: "6px",
        width: "100%",
        fontFamily: FONT,
      }}
    >
      <ActivityLeaderboard scale={scale} />
      <CallsVsGoal scale={scale} />
    </div>
  );
}
