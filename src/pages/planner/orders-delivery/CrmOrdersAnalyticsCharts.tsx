import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "@crm/orders/orderListRecharts";

const STAGE_PIE_COLORS = [
  "#0dcaf0",
  "#0d6efd",
  "#ffc107",
  "#fd7e14",
  "#198754",
  "#6c757d",
] as const;

type PieLabelPayload = Readonly<{
  name?: string;
  percent?: number;
}>;

function formatPieStageLabel(payload: PieLabelPayload): string {
  const name = payload.name ?? "";
  const pct = Math.round((payload.percent ?? 0) * 100);
  return `${name}: ${pct}%`;
}

export type CrmOrdersStagePieChartProps = Readonly<{
  stageCounts: Record<string, number>;
}>;

export function CrmOrdersStagePieChart(props: CrmOrdersStagePieChartProps) {
  const { stageCounts } = props;
  const data = Object.entries(stageCounts).map(([stage, count]) => ({
    name: stage,
    value: count,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(p: PieLabelPayload) => formatPieStageLabel(p)}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {Object.entries(stageCounts).map(([stage], index) => (
            <Cell
              key={`cell-${stage}`}
              fill={STAGE_PIE_COLORS[index % STAGE_PIE_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export type CrmOrdersFulfillmentBarChartProps = Readonly<{
  statusCounts: Record<string, number>;
}>;

export function CrmOrdersFulfillmentBarChart(
  props: CrmOrdersFulfillmentBarChartProps,
) {
  const { statusCounts } = props;
  const data = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="status" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#0d6efd" />
      </BarChart>
    </ResponsiveContainer>
  );
}
