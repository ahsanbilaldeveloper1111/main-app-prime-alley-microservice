"use client";

import React from "react";
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
  Legend,
  ReferenceLine,
  LabelList,
} from "recharts";
import { Info } from "lucide-react";
import CallsVsGoalChart from "@components/CallsVsGoals";
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

const callsData = [
  { date: "1/1/2026",   calls: 0,      goal: 0 },
  { date: "8/1/2026",   calls: 0,      goal: 0 },
  { date: "15/1/2026",  calls: 0,      goal: 0 },
  { date: "22/1/2026",  calls: 0,      goal: 0 },
  { date: "29/1/2026",  calls: 0,      goal: 0 },
  { date: "5/2/2026",   calls: 0,      goal: 0 },
  { date: "12/2/2026",  calls: 0,      goal: 0 },
  { date: "19/2/2026",  calls: 0,      goal: 0 },
  { date: "20/2/2026",  calls: 2,      goal: 0 },
  { date: "21/2/2026",  calls: 141414, goal: 3 },
  { date: "22/2/2026",  calls: 0,      goal: 0 },
  { date: "1/3/2026",   calls: 0,      goal: 0 },
  { date: "11/4/2026",  calls: 0,      goal: 0 },
  { date: "31/5/2026",  calls: 0,      goal: 0 },
  { date: "20/7/2026",  calls: 0,      goal: 0 },
  { date: "8/9/2026",   calls: 0,      goal: 0 },
  { date: "28/10/2026", calls: 0,      goal: 0 },
  { date: "17/12/2026", calls: 0,      goal: 0 },
];

// ─── Shared pill badge ────────────────────────────────────────────────────────

function PillBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        border: "1px solid #adadad",
        borderRadius: "3px",
        padding: "2px 8px",
        fontSize: "11px",
        fontWeight: 400,
        color: "#141414",
        fontFamily: FONT,
        backgroundColor: "#fff",
        lineHeight: "16px",
      }}
    >
      {children}
    </span>
  );
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

function ActivityLeaderboard() {
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
          Activity leaderboard by rep with type breakdown
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
          data={leaderboardData}
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
          <Bar dataKey="propertyValue" name="Property Value" stackId="a" fill="#F4A57A" radius={[0, 0, 0, 0]} maxBarSize={60}>
          </Bar>

          {/* CRM Object bar (teal) */}
          <Bar dataKey="crmObject" name="CRM Object" stackId="a" fill="#4ECDC4" maxBarSize={60}>
          </Bar>

          {/* CRM Object Association bar (purple) */}
          <Bar dataKey="crmObjectAssociation" name="CRM Object Association" stackId="a" fill="#B5A7E0" radius={[0, 2, 2, 0]} maxBarSize={60}>
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

function CallsVsGoal() {
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
          Calls made vs goal
        </span>
        <Info size={14} color="#888" />
      </div>

      {/* Pills */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
        <PillBadge>This entire year</PillBadge>
        <PillBadge>Daily</PillBadge>
      </div>

      {/* Custom legend */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "8px", paddingLeft: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", fontSize: 11, color: "#141414", fontFamily: FONT, fontWeight: 100 }}>
          {renderLegendDot("#F4A57A", false)}
          (Count) Calls
        </div>
        <div style={{ display: "flex", alignItems: "center", fontSize: 11, color: "#141414", fontFamily: FONT, fontWeight: 100 }}>
          {renderLegendDot("#aaaaaa", false)}
          (Sum) Goal target
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={240}>
        <LineChart
          data={callsData}
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
            domain={[0, 20]}
            ticks={[0, 10, 20]}
            tick={TICK_STYLE}
            axisLine={false}
            tickLine={false}
            width={22}
          />
          <Tooltip content={<CallsTooltip />} />

          {/* Goal target line (grey, dashed) */}
          <Line
            type="monotone"
            dataKey="goal"
            stroke="#bbbbbb"
            strokeWidth={1}
            dot={false}
            name="(Sum) Goal target"
          />

          {/* Calls line (orange) */}
          <Line
            type="monotone"
            dataKey="calls"
            stroke="#F4A57A"
            strokeWidth={1.5}
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
            label={(props: any) => {
              const { x, y, value, index } = props;
              if (value === 0) return null;
              if (value === 141414) {
                return (
                  <text
                    x={x}
                    y={y - 8}
                    textAnchor="middle"
                    fontFamily={FONT}
                    fontSize={11}
                    fontWeight={700}
                    fill="#141414"
                  >
                    {value}
                  </text>
                );
              }
              return (
                <text
                  x={x}
                  y={y - 8}
                  textAnchor="middle"
                  fontFamily={FONT}
                  fontSize={11}
                  fontWeight={100}
                  fill="#141414"
                >
                  {value}
                </text>
              );
            }}
            name="(Count) Calls"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Combined Export ──────────────────────────────────────────────────────────

export default function ChartsRow() {
  return (
    <div
      style={{
        display: "flex",
        gap: "6px",
        width: "100%",
        fontFamily: FONT,
      }}
    >
      <ActivityLeaderboard />
      <CallsVsGoal />
    </div>
  );
}
