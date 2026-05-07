import React from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface ApprovalsAgingChartDatum {
  name: string;
  value: number;
  fill: string;
}

export interface ApprovalsAgingPanelProps {
  approvalsAgingChartData: ApprovalsAgingChartDatum[];
  approvalsAgingTotal: number;
}

const ApprovalsAgingPanel: React.FC<ApprovalsAgingPanelProps> = ({
  approvalsAgingChartData,
  approvalsAgingTotal,
}) => (
  <div className="employees-dashboard__card">
    <div className="employees-dashboard__card-head">
      <h3 className="employees-dashboard__card-title">Approvals Aging</h3>
    </div>

    <div className="employees-dashboard__aging-summary">
      <div className="employees-dashboard__aging-total-row">
        <div className="employees-dashboard__aging-total">{approvalsAgingTotal}</div>
        <span className="employees-dashboard__aging-label">Pending</span>
      </div>
    </div>

    <div className="employees-dashboard__chart-slot employees-dashboard__chart-slot--aging">
      {approvalsAgingChartData.some((d) => d.value > 0) || approvalsAgingTotal === 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={approvalsAgingChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 11 }} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 11 }}
              domain={[0, Math.max(...approvalsAgingChartData.map((d) => d.value), 0) + 1]}
            />
            <Tooltip
              contentStyle={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "12px",
                padding: "8px 12px",
              }}
              formatter={(value: number) => [`${value} pending`, "Count"]}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={48}>
              {approvalsAgingChartData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="employees-dashboard__chart-empty">No aging data</div>
      )}
    </div>
  </div>
);

export default ApprovalsAgingPanel;
