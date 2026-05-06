import React from "react";
import {
  formatActivityDate,
  getExtensionDisplay,
} from "@components/planner/plannerTaskDetail/plannerTaskDetailDomain";
import type { PlannerTaskActivityRow } from "./usePlannerTaskActivitiesPreview";
import "./plannerTaskDetail.scss";

export type PlannerTaskDetailActivityListProps = Readonly<{
  activities: PlannerTaskActivityRow[];
  avatarSize?: "32px" | "40px";
  hierarchyDataExtensions: unknown;
  /** When set, replaces default {@link formatActivityDate} (e.g. offcanvas en-US). */
  formatActivityDateFn?: (dateString: string) => string;
}>;

export function PlannerTaskDetailActivityList({
  activities,
  avatarSize = "32px",
  hierarchyDataExtensions,
  formatActivityDateFn,
}: PlannerTaskDetailActivityListProps) {
  const isLarge = avatarSize === "40px";
  const formatDate = formatActivityDateFn ?? formatActivityDate;
  return (
    <>
      {activities.map((activity, idx) => {
        const extNumber = activity.extension_number || "";
        const { name: extensionName, initials: extensionInitials } = getExtensionDisplay(
          extNumber,
          hierarchyDataExtensions,
        );
        const activityDate = formatDate(activity.created_at || "");
        const actionText = activity.description || activity.action || "Activity";
        const itemClass = isLarge
          ? "ptd-activity-item ptd-activity-item--large"
          : "ptd-activity-item";
        return (
          <div key={activity.id ?? `activity-${idx}`} className={itemClass}>
            <div
              className={
                isLarge
                  ? "ptd-activity-avatar ptd-activity-avatar--lg"
                  : "ptd-activity-avatar ptd-activity-avatar--sm"
              }
            >
              {extensionInitials}
            </div>
            <div className="ptd-activity-body">
              <div className="ptd-activity-title">
                {extNumber === "system" ? (
                  <>{actionText}</>
                ) : (
                  <>
                    <strong>{extensionName}</strong> {actionText}
                  </>
                )}
              </div>
              <div className="ptd-activity-meta">{activityDate}</div>
            </div>
          </div>
        );
      })}
    </>
  );
}
