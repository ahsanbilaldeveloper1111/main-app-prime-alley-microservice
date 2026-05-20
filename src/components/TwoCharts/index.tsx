"use client";

import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { Info } from "lucide-react";
import { MainDashboardChartLoader } from "@components/salesDashboard/MainDashboardChartLoader";
import { useCrmDataManagementExtensions } from "@hooks/useCrmDataManagementExtensions";
import { useMainDashboardCrmCreatedCounts } from "@hooks/useMainDashboardCrmCreatedCounts";
import {
  buildTopActivitiesLeaderboardRows,
  type TopActivitiesLeaderboardRow,
} from "@utils/mainDashboardChartData";
import { AttendanceApprovalsChart } from "./AttendanceApprovalsChart";
const FONT = "'Lexend Deca', Helvetica, Arial, sans-serif";

const TICK_STYLE = {
  fontFamily: FONT,
  fontSize: 11,
  fill: "#141414",
  fontWeight: 100,
};

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
  if (active && payload?.length) {
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
// ─── Activity Leaderboard Chart ───────────────────────────────────────────────

function ActivityLeaderboard({ scale }: Readonly<{ scale: number }>) {
  const createdCountsQuery = useMainDashboardCrmCreatedCounts();
  const extensionsQuery = useCrmDataManagementExtensions();

  const chartData = useMemo(
    () =>
      buildTopActivitiesLeaderboardRows(
        createdCountsQuery.data,
        extensionsQuery.data ?? [],
        scale,
      ),
    [createdCountsQuery.data, extensionsQuery.data, scale],
  );

  const maxStackTotal = useMemo(() => {
    const peak = chartData.reduce(
      (max, row) => Math.max(max, row.prospects + row.leads + row.deals),
      0,
    );
    return Math.max(1, peak);
  }, [chartData]);

  const isChartLoading =
    createdCountsQuery.isPending ||
    createdCountsQuery.isFetching ||
    extensionsQuery.isPending ||
    extensionsQuery.isFetching;

  return (
    <MainDashboardChartLoader isLoading={isChartLoading}>
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        border: "1px solid #e5e5e5",
        padding: "20px 20px 16px",
        flex: 1,
        minWidth: 0,
        width: "100%",
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
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 36, left: 0, bottom: 28 }}
          barCategoryGap="5%"
        >
          <CartesianGrid
            horizontal={false}
            vertical
            stroke="#d9d9d9"
            strokeDasharray="4 4"
          />
          <XAxis
            type="number"
            domain={[0, maxStackTotal]}
            tick={TICK_STYLE}
            axisLine={{ stroke: "#ccc" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ ...TICK_STYLE, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<LeaderboardTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />

          <Bar dataKey="prospects" name="Prospects" stackId="a" fill="#F4A57A" maxBarSize={60} />
          <Bar dataKey="leads" name="Leads" stackId="a" fill="#4ECDC4" maxBarSize={60} />
          <Bar
            dataKey="deals"
            name="Deals"
            stackId="a"
            fill="#B5A7E0"
            radius={[0, 2, 2, 0]}
            maxBarSize={60}
          >
            <LabelList
              dataKey={(entry: TopActivitiesLeaderboardRow) =>
                entry.prospects + entry.leads + entry.deals
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
    </MainDashboardChartLoader>
  );
}
// ─── Combined Export ──────────────────────────────────────────────────────────

export default function ChartsRow({ scale = 1 }: Readonly<{ scale?: number }>) {
  const [isCompact, setIsCompact] = useState(false);

  React.useEffect(() => {
    const updateLayout = () => setIsCompact(window.innerWidth < 1100);
    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isCompact ? "column" : "row",
        gap: "6px",
        width: "100%",
        fontFamily: FONT,
      }}
    >
      <ActivityLeaderboard scale={scale} />
      <AttendanceApprovalsChart />
    </div>
  );
}
