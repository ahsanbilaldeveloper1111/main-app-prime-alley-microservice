import React from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DepartmentHeadcountChartRow } from "../employeesDomain";

export interface EmployeesDepartmentHeadcountPanelProps {
  chartRows: DepartmentHeadcountChartRow[];
}

const EmployeesDepartmentHeadcountPanel: React.FC<EmployeesDepartmentHeadcountPanelProps> = ({
  chartRows,
}) => (
  <div className="employees-page__chart-card">
    <div className="employees-page__chart-card-head">
      <h2 className="employees-page__chart-card-title">Department Headcount</h2>
    </div>

    <div className="employees-page__chart-legend">
      {chartRows.map((dept) => (
        <div key={dept.rowKey} className="employees-page__chart-legend-item">
          <div className="employees-page__chart-legend-dot" style={{ backgroundColor: dept.color }} />
          <span className="employees-page__chart-legend-label">{dept.name}</span>
        </div>
      ))}
    </div>

    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartRows}>
        <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#475569" }} axisLine={{ stroke: "#bfdbfe" }} />
        <YAxis tick={{ fontSize: 12, fill: "#475569" }} axisLine={{ stroke: "#bfdbfe" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#141414",
          }}
        />
        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
          {chartRows.map((entry) => (
            <Cell key={entry.rowKey} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default EmployeesDepartmentHeadcountPanel;
