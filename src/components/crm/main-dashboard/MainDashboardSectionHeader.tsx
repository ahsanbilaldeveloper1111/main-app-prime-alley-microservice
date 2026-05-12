import React from "react";
import { ChevronDown, GripVertical, Info } from "lucide-react";

interface MainDashboardSectionHeaderProps {
  readonly title: string;
  readonly actionSlot?: React.ReactNode;
  readonly infoIcon?: boolean;
  readonly onToggle?: () => void;
  readonly isCollapsed?: boolean;
}

function buildChevronClassName(
  isClickable: boolean,
  isCollapsed: boolean,
): string {
  let cls = "crm-md-sectionTitle-chevron";
  if (isClickable) cls += " crm-md-sectionTitle-chevron--clickable";
  if (isCollapsed) cls += " crm-md-sectionTitle-chevron--collapsed";
  return cls;
}

export function MainDashboardSectionHeader({
  title,
  actionSlot,
  infoIcon = false,
  onToggle,
  isCollapsed = false,
}: MainDashboardSectionHeaderProps) {
  const chevronClassName = buildChevronClassName(Boolean(onToggle), isCollapsed);
  const chevron = <ChevronDown size={14} color="#666" />;

  return (
    <div className="crm-md-sectionHeader">
      <div className="crm-md-sectionTitle">
        <div className="crm-md-gripIcon">
          <GripVertical size={14} />
        </div>
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            className={chevronClassName}
            aria-expanded={!isCollapsed}
            aria-label={`Toggle ${title} section`}
          >
            {chevron}
          </button>
        ) : (
          <div className={chevronClassName}>{chevron}</div>
        )}
        {title}
        {infoIcon && <Info size={13} color="#999" />}
      </div>
      <div className="crm-md-sectionActions">{actionSlot}</div>
    </div>
  );
}
