import React from "react";
import { Circle, MoreHorizontal } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface DepartmentChartDatum {
  id: number;
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export interface DepartmentHeadcountPanelProps {
  departmentData: DepartmentChartDatum[];
}

const DepartmentHeadcountPanel: React.FC<DepartmentHeadcountPanelProps> = ({ departmentData }) => (
  <div className="employees-dashboard__card">
    <div className="employees-dashboard__card-head">
      <h3 className="employees-dashboard__card-title">Department Headcount</h3>
      <MoreHorizontal size={20} color="#9CA3AF" style={{ cursor: "pointer" }} />
    </div>

    <div>
      {departmentData.length === 0 ? (
        <div className="employees-dashboard__muted-placeholder">No department data for the selected period.</div>
      ) : (
        departmentData.map((dept) => (
          <div key={dept.id} className="employees-dashboard__dept-row">
            <Circle size={12} fill={dept.color} color={dept.color} />
            <span className="employees-dashboard__dept-name">{dept.name}</span>
            <span className="employees-dashboard__dept-count">{dept.value}</span>
            <span className="employees-dashboard__dept-pct">({dept.percentage}%)</span>
          </div>
        ))
      )}
    </div>

    <div className="employees-dashboard__chart-slot">
      {departmentData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={departmentData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 11 }} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 11 }}
              domain={[0, departmentData.length ? Math.max(...departmentData.map((d) => d.value), 0) + 1 : 5]}
            />
            <Tooltip
              contentStyle={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number, _name: unknown, props: { payload?: { percentage?: number } }) => {
                const percentage = props.payload?.percentage;
                const hasPercentage = typeof percentage === "number";
                const percentageText = hasPercentage ? ` (${percentage}%)` : "";
                return [`${value} employees${percentageText}`, "Count"];
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={45}>
              {departmentData.map((entry) => (
                <Cell key={`cell-${entry.id}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="employees-dashboard__chart-empty">No chart data</div>
      )}
    </div>

    <div className="employees-dashboard__insights">
      <h4 className="employees-dashboard__insights-title">Department Insights</h4>

      <div className="employees-dashboard__insights-stack">
        {departmentData.length > 0 && (
          <div className="employees-dashboard__insight-callout">
            <div className="employees-dashboard__insight-callout-head">
              <span className="employees-dashboard__insight-callout-label">Total headcount</span>
              <span className="employees-dashboard__insight-callout-value">
                {departmentData.reduce((sum, d) => sum + d.value, 0)} employees
              </span>
            </div>
            <div className="employees-dashboard__insight-callout-detail">
              {(() => {
                const hasMultipleDepartments = departmentData.length > 1;
                const departmentSuffix = hasMultipleDepartments ? "s" : "";
                return `${departmentData.length} department${departmentSuffix} in scope`;
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default DepartmentHeadcountPanel;
