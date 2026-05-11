import React from "react";
import { ChevronDown, GripVertical, Info } from "lucide-react";

export type DashboardSectionHeaderProps = Readonly<{
  title: string;
  actionSlot?: React.ReactNode;
  infoIcon?: boolean;
  onToggle?: () => void;
  isCollapsed?: boolean;
}>;

export function DashboardSectionHeader({
  title,
  actionSlot,
  infoIcon = false,
  onToggle,
  isCollapsed = false,
}: DashboardSectionHeaderProps) {
  const chevronCollapsedClass = isCollapsed
    ? " sales-dashboard__section-chevron--collapsed"
    : "";

  return (
    <div className="sales-dashboard__section-header">
      <div className="sales-dashboard__section-title">
        <div className="sales-dashboard__grip-icon">
          <GripVertical size={14} />
        </div>
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={!isCollapsed}
            aria-label={
              isCollapsed ? `Expand ${title} section` : `Collapse ${title} section`
            }
            className={`sales-dashboard__section-chevron sales-dashboard__section-chevron-btn${chevronCollapsedClass}`}
          >
            <ChevronDown size={14} color="#666" />
          </button>
        ) : (
          <span
            className={`sales-dashboard__section-chevron sales-dashboard__section-chevron-static${chevronCollapsedClass}`}
          >
            <ChevronDown size={14} color="#666" />
          </span>
        )}
        {title}
        {infoIcon && <Info size={13} color="#999" />}
      </div>
      <div className="sales-dashboard__section-actions">{actionSlot}</div>
    </div>
  );
}
