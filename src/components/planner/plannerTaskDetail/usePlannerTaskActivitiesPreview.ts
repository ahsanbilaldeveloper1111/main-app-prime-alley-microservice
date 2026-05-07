import { useEffect, useState } from "react";
import { getTaskActivities } from "@utils/tasks";

export type PlannerTaskActivityRow = Readonly<{
  id?: string | number;
  extension_number?: string;
  created_at?: string;
  description?: string;
  action?: string;
}>;

/** Loads the recent-activities strip for a task id (complexity isolated for Sonar). */
export function usePlannerTaskActivitiesPreview(taskId: number | string | undefined | null) {
  const [taskActivities, setTaskActivities] = useState<PlannerTaskActivityRow[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    if (taskId == null || taskId === "") {
      setTaskActivities([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoadingActivities(true);
      try {
        const activitiesResponse = await getTaskActivities(taskId, 1, 5);
        if (!cancelled && activitiesResponse != null) {
          setTaskActivities(Array.isArray(activitiesResponse) ? activitiesResponse : []);
        }
      } catch (err) {
        console.error("Error loading task activities:", err);
        if (!cancelled) {
          setTaskActivities([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingActivities(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  return { taskActivities, loadingActivities };
}
