import React from "react";
import { Button, Spinner } from "react-bootstrap";
import { PlannerTaskDetailActivityList } from "./PlannerTaskDetailActivityList";
import type { PlannerTaskActivityRow } from "./usePlannerTaskActivitiesPreview";

export type PlannerTaskActivityTabPanelProps = Readonly<{
  loadingActivities: boolean;
  taskActivities: PlannerTaskActivityRow[];
  onViewAll: () => void;
  hierarchyDataExtensions: unknown;
  formatActivityDateFn?: (dateString: string) => string;
  /** When set, wraps panel content for offcanvas / embedded shells */
  sectionClassName?: string;
}>;

export function PlannerTaskActivityTabPanel({
  loadingActivities,
  taskActivities,
  onViewAll,
  hierarchyDataExtensions,
  formatActivityDateFn,
  sectionClassName,
}: PlannerTaskActivityTabPanelProps) {
  let content: React.ReactNode;
  if (loadingActivities) {
    content = (
      <div className="text-center py-4">
        <Spinner animation="border" size="sm" />
      </div>
    );
  } else if (taskActivities.length === 0) {
    content = <div className="text-center py-3 text-muted small">No activities found</div>;
  } else {
    content = (
      <>
        <PlannerTaskDetailActivityList
          activities={taskActivities}
          hierarchyDataExtensions={hierarchyDataExtensions}
          formatActivityDateFn={formatActivityDateFn}
        />
        <div className="text-center mt-3">
          <Button
            variant="link"
            size="sm"
            onClick={onViewAll}
            className="ptd-link-muted p-0 text-decoration-underline"
          >
            View All
          </Button>
        </div>
      </>
    );
  }
  return sectionClassName ? <div className={sectionClassName}>{content}</div> : content;
}
