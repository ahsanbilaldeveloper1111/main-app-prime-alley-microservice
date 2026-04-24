import React from "react";
import { Col } from "react-bootstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
import type { BotPerformanceRow } from "./BotPerformanceTable";

const COMPLETED_COLOR = "#2563eb";
const TRANSFERRED_COLOR = "#7dd3fc";
const FAILED_COLOR = "#ef4444";

export interface BotPerformanceComparisonChartProps {
  loading: boolean;
  rows: BotPerformanceRow[];
}

const BotPerformanceComparisonChart = ({ loading, rows }: BotPerformanceComparisonChartProps) => {
  const hasData = rows.some((r) => r.total > 0);
  const isEmpty = rows.every((r) => (r.total ?? 0) <= 0);

  let content: React.ReactNode;
  if (loading) {
    content = (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "280px" }}>
        Loading...
      </div>
    );
  } else if (hasData) {
    content = (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 8, bottom: 8 }} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-22}
            textAnchor="end"
            height={56}
          />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ border: "none", borderRadius: "6px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
            formatter={(value: number) => [value, ""]}
            labelFormatter={(label) => `Bot: ${label}`}
          />
          <Legend
            wrapperStyle={{ paddingTop: "12px" }}
            iconType="square"
            iconSize={10}
            formatter={(value) => value}
          />
          <Bar dataKey="failed" name="Failed" stackId="a" fill={FAILED_COLOR} radius={[0, 0, 0, 0]} />
          <Bar dataKey="transferred" name="Transferred" stackId="a" fill={TRANSFERRED_COLOR} radius={[0, 0, 0, 0]} />
          <Bar dataKey="completed" name="Completed" stackId="a" fill={COMPLETED_COLOR} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  } else if (isEmpty) {
    content = (
      <div className="d-flex flex-column align-items-center justify-content-center text-muted py-5" style={{ minHeight: "280px" }}>
        <BarChart3 size={48} className="mb-3 opacity-50" strokeWidth={1.5} />
        <p className="mb-1 fw-medium">No bot performance data available</p>
        <p className="small mb-0 opacity-75">Try a different time period or company filter.</p>
      </div>
    );
  } else {
    content = null;
  }

  return (
    <Col xs={12} className="mb-4">
      <div className="p-4 card" style={{ minHeight: "360px" }}>
        <h5 className="mb-1">Bot Performance Comparison</h5>
        <p className="small text-muted mb-3">Completed, Transferred, and Failed calls by bot</p>
        {content}
      </div>
    </Col>
  );
};

export default BotPerformanceComparisonChart;
