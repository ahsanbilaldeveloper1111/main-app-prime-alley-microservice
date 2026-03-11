import React from "react";
import { Col } from "react-bootstrap";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { STATUS_COLORS, defaultStatusColor } from "./constants";

export interface StatusDataItem {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface CallStatusDistributionChartProps {
  loading: boolean;
  data: StatusDataItem[];
  totalCalls: number;
}

const CallStatusDistributionChart = ({ loading, data, totalCalls }: CallStatusDistributionChartProps) => {
  let content: React.ReactNode;
  if (loading) {
    content = (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "280px" }}>
        Loading...
      </div>
    );
  } else if (data.length === 0) {
    content = (
      <div className="d-flex flex-column align-items-center justify-content-center text-muted py-5" style={{ minHeight: "280px" }}>
        <PieChartIcon size={48} className="mb-3 opacity-50" strokeWidth={1.5} />
        <p className="mb-1 fw-medium">No call data available</p>
        <p className="small mb-0 opacity-75">Try a different time period or company filter.</p>
      </div>
    );
  } else {
    content = (
      <>
        <ResponsiveContainer width="100%" height={280}>
          <RechartsPieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={(props: Record<string, unknown>) =>
                Number(props.percent) * 100 >= 5 ? `${(Number(props.percent) * 100).toFixed(0)}%` : null}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? defaultStatusColor} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [value, "Calls"]}
              contentStyle={{ border: "none", borderRadius: "6px" }}
              labelFormatter={(label) => `Status: ${label}`}
            />
            <Legend
              formatter={(value) => value}
              wrapperStyle={{ paddingTop: "12px" }}
              iconType="square"
              iconSize={10}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
        <p className="small text-white-50 mb-0 text-center">Total: {totalCalls} calls</p>
      </>
    );
  }

  return (
    <Col xl={6} className="mb-4">
      <div className="p-4 card" style={{ minHeight: "340px" }}>
        <h5 className="mb-1">Call Status Distribution</h5>
        <p className="small text-white-50 mb-3">Calls by Status</p>
        {content}
      </div>
    </Col>
  );
};

export default CallStatusDistributionChart;
