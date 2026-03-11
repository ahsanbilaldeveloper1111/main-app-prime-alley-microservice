import React from "react";
import { Col } from "react-bootstrap";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3 } from "lucide-react";

export interface DurationDataItem {
  name: string;
  count: number;
}

export interface CallDurationDistributionChartProps {
  loading: boolean;
  data: DurationDataItem[];
}

const CallDurationDistributionChart = ({ loading, data }: CallDurationDistributionChartProps) => (
  <Col xl={6} className="mb-4">
    <div className="p-4 card" style={{ minHeight: "360px" }}>
      <h5 className="mb-1">Call Duration Distribution</h5>
      <p className="small text-muted mb-3">Calls by duration range</p>
      {loading ? (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "280px" }}>
          Loading...
        </div>
      ) : data.every((d) => d.count === 0) ? (
        <div className="d-flex flex-column align-items-center justify-content-center text-muted py-5" style={{ minHeight: "280px" }}>
          <BarChart3 size={48} className="mb-3 opacity-50" strokeWidth={1.5} />
          <p className="mb-1 fw-medium">No duration data available</p>
          <p className="small mb-0 opacity-75">Try a different time period or company filter.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              formatter={(value: number) => [value, "Calls"]}
              contentStyle={{ border: "none", borderRadius: "6px" }}
              labelFormatter={(label) => `Duration: ${label}`}
            />
            <Bar dataKey="count" name="Calls" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  </Col>
);

export default CallDurationDistributionChart;
