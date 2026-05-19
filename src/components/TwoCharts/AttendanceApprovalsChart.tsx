"use client";

import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Info } from "lucide-react";
import { MainDashboardChartLoader } from "@components/salesDashboard/MainDashboardChartLoader";
import { useMainDashboardAttendanceActivity } from "@hooks/useMainDashboardAttendanceActivity";
import {
  getMainDashboardDateRange,
  type MainDashboardRangePill,
} from "@utils/mainDashboardDateRanges";

const FONT = "'Lexend Deca', Helvetica, Arial, sans-serif";

const TICK_STYLE = {
  fontFamily: FONT,
  fontSize: 11,
  fill: "#141414",
  fontWeight: 100,
};

const ATTENDANCE_ACTIVITY_METRICS = [
  { key: "attendance", name: "Attendance", color: "#CE93D8" },
  { key: "approvals", name: "Approval requests", color: "#90CAF9" },
  { key: "pendingTasks", name: "Pending tasks", color: "#F4A57A" },
] as const;

type AttendanceMetricKey = (typeof ATTENDANCE_ACTIVITY_METRICS)[number]["key"];

type AttendanceChartRow = {
  key: AttendanceMetricKey;
  name: string;
  color: string;
  count: number;
};

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

type AttendanceActivityTooltipProps = {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: { name?: string } }>;
};

const AttendanceActivityTooltip = ({ active, payload }: AttendanceActivityTooltipProps) => {
  if (!active || !payload?.length) return null;
  const row = payload[0];
  const value = typeof row.value === "number" ? row.value : Number(row.value);
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
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{row.payload?.name}</div>
      <div>
        Count: <strong>{Number.isFinite(value) ? value.toLocaleString() : "—"}</strong>
      </div>
    </div>
  );
};

export function AttendanceApprovalsChart() {
  const [activePill, setActivePill] = useState<MainDashboardRangePill>("daily");
  const [visible, setVisible] = useState<Record<AttendanceMetricKey, boolean>>({
    attendance: true,
    approvals: true,
    pendingTasks: true,
  });

  const dateRange = useMemo(() => getMainDashboardDateRange(activePill), [activePill]);
  const activityQuery = useMainDashboardAttendanceActivity(dateRange);

  const chartData = useMemo((): AttendanceChartRow[] => {
    const attendance = activityQuery.data?.attendance;
    return ATTENDANCE_ACTIVITY_METRICS.map((metric) => {
      let count = 0;
      if (metric.key === "attendance") {
        count = attendance?.attendance_count ?? 0;
      } else if (metric.key === "approvals") {
        count = attendance?.approval_request_count ?? 0;
      } else {
        count = activityQuery.data?.pendingTasksCount ?? 0;
      }
      return { ...metric, count };
    });
  }, [activityQuery.data]);

  const visibleChartData = chartData.filter((row) => visible[row.key]);
  const maxCount = useMemo(() => {
    const peak = visibleChartData.reduce((max, row) => Math.max(max, row.count), 0);
    return Math.max(peak, 1);
  }, [visibleChartData]);

  const isChartLoading = activityQuery.isPending || activityQuery.isFetching;

  const toggleSeries = (key: AttendanceMetricKey) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const legendItemStyle = (isVisible: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: 11,
    color: "#141414",
    fontFamily: FONT,
    fontWeight: 100,
    cursor: "pointer",
    opacity: isVisible ? 1 : 0.45,
    border: "none",
    background: "none",
    padding: 0,
  });

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
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
          <span
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "#00818a",
              fontFamily: FONT,
            }}
          >
            Attendance & approvals
          </span>
          <Info size={14} color="#888" />
        </div>

        <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
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

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px 20px",
            marginBottom: "12px",
            paddingLeft: "4px",
          }}
        >
          {ATTENDANCE_ACTIVITY_METRICS.map((metric) => (
            <button
              key={metric.key}
              type="button"
              onClick={() => toggleSeries(metric.key)}
              style={legendItemStyle(visible[metric.key])}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: metric.color,
                  display: "inline-block",
                }}
              />
              {metric.name}
            </button>
          ))}
        </div>

        <div style={{ width: "100%", height: 260, minHeight: 260, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={visibleChartData}
              margin={{ top: 12, right: 12, left: 4, bottom: 56 }}
              barCategoryGap="20%"
            >
              <CartesianGrid vertical={false} stroke="#e5e5e5" strokeDasharray="4 4" />
              <XAxis
                dataKey="name"
                tick={TICK_STYLE}
                interval={0}
                angle={-22}
                textAnchor="end"
                height={56}
                axisLine={{ stroke: "#ccc" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, maxCount]}
                tick={TICK_STYLE}
                width={36}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<AttendanceActivityTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={56}>
                {visibleChartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </MainDashboardChartLoader>
  );
}
