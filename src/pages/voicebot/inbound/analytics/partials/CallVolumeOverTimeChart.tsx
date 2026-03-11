import React from "react";
import { Col } from "react-bootstrap";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

export interface VolumeDataItem {
  date: string;
  dateKey: string;
  calls: number;
}

export interface CallVolumeOverTimeChartProps {
  loading: boolean;
  data: VolumeDataItem[];
}

const CallVolumeOverTimeChart = ({ loading, data }: CallVolumeOverTimeChartProps) => (
  <Col xs={12} className="mb-4">
    <div className="p-4 card" style={{ minHeight: "360px" }}>
      <h5 className="mb-1">Call Volume Over Time</h5>
      <p className="small text-muted mb-3">Calls by date</p>
      {loading ? (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "280px" }}>
          Loading...
        </div>
      ) : data.length === 0 ? (
        <div className="d-flex flex-column align-items-center justify-content-center text-muted py-5" style={{ minHeight: "280px" }}>
          <TrendingUp size={48} className="mb-3 opacity-50" strokeWidth={1.5} />
          <p className="mb-1 fw-medium">No volume data available</p>
          <p className="small mb-0 opacity-75">Try a different time period or company filter.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="date"
              type="category"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              allowDecimals={false}
              axisLine={false}
              tickLine={{ stroke: "#e5e7eb" }}
              label={{ value: "Calls", angle: -90, position: "insideLeft", style: { fontSize: 12 } }}
            />
            <Tooltip
              formatter={(value: number) => [value, "Calls"]}
              contentStyle={{ border: "none", borderRadius: "6px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="calls"
              name="Calls"
              stroke="#7dd3fc"
              strokeWidth={2}
              dot={{ fill: "#7dd3fc", r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  </Col>
);

export default CallVolumeOverTimeChart;
