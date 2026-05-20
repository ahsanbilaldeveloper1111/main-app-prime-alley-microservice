"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { MainDashboardChartLoader } from "@components/salesDashboard/MainDashboardChartLoader";
import { MainDashboardDateField } from "@components/salesDashboard/MainDashboardDateField";
import { useMainDashboardAttendanceActivity } from "@hooks/useMainDashboardAttendanceActivity";
import { useMainDashboardCrmListCounts } from "@hooks/useMainDashboardCrmListCounts";
import {
  CRM_ACTIVITY_LEGEND_ITEMS,
  buildUserActivityByCategoryRows,
} from "@utils/mainDashboardChartData";
import { getDefaultCrmActivityDateRange } from "@utils/mainDashboardDateRanges";

const FONT = "'Lexend Deca', Helvetica, Arial, sans-serif";

type TooltipPayload = {
  value?: number;
  payload?: { percentage?: number };
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload?.length) {
    const first = payload[0];
    const count =
      typeof first?.value === "number" ? first.value : Number(first?.value);
    const percentage = first?.payload?.percentage;
    return (
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #e0e0e0",
          borderRadius: "6px",
          padding: "8px 12px",
          fontFamily: FONT,
          fontSize: "13px",
          color: "#141414",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: "4px" }}>{label}</div>
        <div style={{ color: "#444" }}>
          Activity Volume:{" "}
          <strong>{Number.isFinite(count) ? count.toLocaleString() : "—"}</strong>
          {typeof percentage === "number" ? (
            <span style={{ marginLeft: 6, color: "#666" }}>({percentage.toFixed(1)}%)</span>
          ) : null}
        </div>
      </div>
    );
  }
  return null;
};

const formatXTick = (value: number) => value.toLocaleString();

export default function UserActivityByCategory({ scale = 1 }: Readonly<{ scale?: number }>) {
  const defaultRange = useMemo(() => getDefaultCrmActivityDateRange(), []);
  const [startDate, setStartDate] = useState(defaultRange.start_date);
  const [endDate, setEndDate] = useState(defaultRange.end_date);

  const apiRange = useMemo(() => {
    if (!startDate || !endDate) return null;
    if (startDate > endDate) {
      return { start_date: endDate, end_date: startDate };
    }
    return { start_date: startDate, end_date: endDate };
  }, [startDate, endDate]);

  const handleStartDateChange = useCallback(
    (nextStart: string) => {
      setStartDate(nextStart);
      if (nextStart > endDate) {
        setEndDate(nextStart);
      }
    },
    [endDate],
  );

  const handleEndDateChange = useCallback(
    (nextEnd: string) => {
      setEndDate(nextEnd);
      if (nextEnd < startDate) {
        setStartDate(nextEnd);
      }
    },
    [startDate],
  );

  const crmQuery = useMainDashboardCrmListCounts(
    apiRange ?? { start_date: "", end_date: "" },
  );
  const attendanceQuery = useMainDashboardAttendanceActivity(
    apiRange ?? { start_date: "", end_date: "" },
  );

  const effectiveCategories = useMemo(
    () =>
      buildUserActivityByCategoryRows(
        crmQuery.data ?? null,
        attendanceQuery.data ?? null,
        scale,
      ),
    [crmQuery.data, attendanceQuery.data, scale],
  );

  const maxCount = Math.max(1, ...effectiveCategories.map((c) => c.count));
  const isChartLoading =
    crmQuery.isPending ||
    crmQuery.isFetching ||
    attendanceQuery.isPending ||
    attendanceQuery.isFetching;

  return (
    <MainDashboardChartLoader isLoading={isChartLoading}>
      <div style={{ fontFamily: FONT, color: "#141414" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 600,
              color: "#141414",
              fontFamily: FONT,
            }}
          >
            Chart view
          </h2>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "14px", color: "#555", fontWeight: 400 }}>Date</span>

            <MainDashboardDateField
              label="From date"
              value={startDate}
              max={endDate}
              onChange={handleStartDateChange}
            />

            <span style={{ fontSize: "14px", color: "#555" }}>to</span>

            <MainDashboardDateField
              label="To date"
              value={endDate}
              min={startDate}
              onChange={handleEndDateChange}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px 16px",
            marginBottom: "6px",
          }}
        >
          {CRM_ACTIVITY_LEGEND_ITEMS.map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
                color: "#141414",
                fontFamily: FONT,
                fontWeight: 400,
              }}
            >
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: item.color,
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
              {item.label}
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={360}>
          <BarChart
            data={effectiveCategories}
            layout="vertical"
            margin={{ top: 0, right: 24, left: 0, bottom: 32 }}
            barCategoryGap="20%"
          >
            <CartesianGrid
              horizontal={false}
              vertical
              stroke="#cccccc"
              strokeDasharray="4 4"
            />
            <XAxis
              type="number"
              domain={[0, maxCount]}
              tickCount={14}
              tickFormatter={formatXTick}
              tick={{
                fontFamily: FONT,
                fontSize: 12,
                fill: "#141414",
                fontWeight: 400,
              }}
              axisLine={{ stroke: "#ccc" }}
              tickLine={false}
              label={{
                value: "Activity Volume",
                position: "insideBottom",
                offset: -20,
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 700,
                fill: "#141414",
              }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={155}
              tick={{
                fontFamily: FONT,
                fontSize: 12,
                fill: "#141414",
                fontWeight: 100,
                textAnchor: "end",
              }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Bar dataKey="count" radius={[0, 2, 2, 0]} maxBarSize={22}>
              {effectiveCategories.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </MainDashboardChartLoader>
  );
}
