"use client";

import React, { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Info } from "lucide-react";
import { MainDashboardChartLoader } from "@components/salesDashboard/MainDashboardChartLoader";
import { useMainDashboardCrmDailyCreationCounts } from "@hooks/useMainDashboardCrmDailyCreationCounts";
import {
  DAILY_CREATION_LINE_SERIES,
  buildDailyCreationLineChartRows,
  type DailyCreationRangePill,
} from "@utils/mainDashboardChartData";
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

type SeriesKey = (typeof DAILY_CREATION_LINE_SERIES)[number]["key"];

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

type LineDotProps = {
  cx?: number;
  cy?: number;
  payload?: Record<string, number>;
};

function SeriesDot({
  cx,
  cy,
  payload,
  dataKey,
  color,
}: LineDotProps & { dataKey: SeriesKey; color: string }) {
  const value = payload?.[dataKey];
  if (!cx || !cy || !value) return <g />;
  return <circle cx={cx} cy={cy} r={3} fill={color} stroke={color} />;
}

function LeadsDot(props: Readonly<LineDotProps>) {
  return <SeriesDot {...props} dataKey="leads" color="#90CAF9" />;
}

function DealsDot(props: Readonly<LineDotProps>) {
  return <SeriesDot {...props} dataKey="deals" color="#F4A57A" />;
}

function OrdersDot(props: Readonly<LineDotProps>) {
  return <SeriesDot {...props} dataKey="orders" color="#A5D6A7" />;
}

type CreationTooltipProps = {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
};

const CreationTooltip = ({ active, payload, label }: CreationTooltipProps) => {
  if (!active || !payload?.length) return null;
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
      {payload.map((entry) => (
        <div key={entry.name} style={{ marginBottom: 2 }}>
          <span style={{ color: entry.color }}>{entry.name}: </span>
          <strong>
            {typeof entry.value === "number" ? entry.value.toLocaleString() : "—"}
          </strong>
        </div>
      ))}
    </div>
  );
};

const SERIES_DOTS: Record<SeriesKey, (props: LineDotProps) => React.JSX.Element> = {
  leads: LeadsDot,
  deals: DealsDot,
  orders: OrdersDot,
};

export function AttendanceApprovalsChart({ scale = 1 }: Readonly<{ scale?: number }>) {
  const [activePill, setActivePill] = useState<MainDashboardRangePill>("daily");
  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({
    leads: true,
    deals: true,
    orders: true,
  });

  const dateRange = useMemo(() => getMainDashboardDateRange(activePill), [activePill]);
  const dailyCreationQuery = useMainDashboardCrmDailyCreationCounts(dateRange);

  const chartData = useMemo(
    () =>
      buildDailyCreationLineChartRows(dailyCreationQuery.data ?? null, activePill, scale),
    [dailyCreationQuery.data, activePill, scale],
  );

  const isChartLoading = dailyCreationQuery.isPending || dailyCreationQuery.isFetching;

  const toggleSeries = (key: SeriesKey) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const legendItemStyle = (isVisible: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
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
            CRM Activity last 7 days
          </span>
          <Info size={14} color="#888" />
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px 24px",
            marginBottom: "8px",
            paddingLeft: "8px",
          }}
        >
          {DAILY_CREATION_LINE_SERIES.map((series) => (
            <button
              key={series.key}
              type="button"
              onClick={() => toggleSeries(series.key)}
              style={legendItemStyle(visible[series.key])}
            >
              {renderLegendDot(series.color, visible[series.key])}
              <span>{series.name}</span>
            </button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 20, right: 16, left: 70, bottom: 8 }}>
            <CartesianGrid horizontal vertical={false} stroke="#e5e5e5" strokeDasharray="4 4" />
            <XAxis
              dataKey="date"
              tick={TICK_STYLE}
              axisLine={{ stroke: "#ccc" }}
              tickLine={false}
              interval={chartData.length > 10 ? 2 : 0}
            />
            <YAxis
              domain={[0, "auto"]}
              tick={TICK_STYLE}
              axisLine={false}
              tickLine={false}
              width={22}
            />
            <Tooltip content={<CreationTooltip />} />
            {DAILY_CREATION_LINE_SERIES.map((series) => (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                stroke={series.color}
                strokeWidth={1.5}
                hide={!visible[series.key]}
                dot={SERIES_DOTS[series.key]}
                name={series.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </MainDashboardChartLoader>
  );
}
