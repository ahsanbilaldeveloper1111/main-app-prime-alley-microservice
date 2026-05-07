import React from "react";
import type { LucideIcon } from "lucide-react";

export interface DashboardQuickActionItem {
  icon: LucideIcon;
  color: string;
  text: string;
  onClick: () => void;
}

export interface DashboardQuickActionsProps {
  actions: DashboardQuickActionItem[];
}

const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({ actions }) => (
  <div className="employees-dashboard__quick-actions">
    {actions.map((action) => (
      <button key={action.text} type="button" className="employees-dashboard__quick-action" onClick={action.onClick}>
        <div
          className="employees-dashboard__quick-action-icon-wrap"
          style={{ background: action.color }}
        >
          <action.icon size={24} color="#FFFFFF" strokeWidth={2.5} />
        </div>
        <span className="employees-dashboard__quick-action-label">{action.text}</span>
      </button>
    ))}
  </div>
);

export default DashboardQuickActions;
