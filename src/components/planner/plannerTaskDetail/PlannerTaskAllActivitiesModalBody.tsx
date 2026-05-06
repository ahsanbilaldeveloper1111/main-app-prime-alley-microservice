import React from "react";
import { Spinner } from "react-bootstrap";
import { PlannerTaskDetailActivityList } from "./PlannerTaskDetailActivityList";
import type { PlannerTaskActivityRow } from "./usePlannerTaskActivitiesPreview";

export type PlannerTaskAllActivitiesModalBodyProps = Readonly<{
  loadingAllActivities: boolean;
  allActivities: PlannerTaskActivityRow[];
  hierarchyDataExtensions: unknown;
  formatActivityDateFn?: (dateString: string) => string;
}>;

export function PlannerTaskAllActivitiesModalBody({
  loadingAllActivities,
  allActivities,
  hierarchyDataExtensions,
  formatActivityDateFn,
}: PlannerTaskAllActivitiesModalBodyProps) {
  if (loadingAllActivities) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" />
      </div>
    );
  }
  if (allActivities.length === 0) {
    return <div className="text-center py-4 text-muted">No activities found</div>;
  }
  return (
    <PlannerTaskDetailActivityList
      activities={allActivities}
      avatarSize="40px"
      hierarchyDataExtensions={hierarchyDataExtensions}
      formatActivityDateFn={formatActivityDateFn}
    />
  );
}
