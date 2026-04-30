import { HEADER_CONSTANTS } from "@constants/headerConstants";
import type { Dispatch, SetStateAction } from "react";

const { PERMISSIONS } = HEADER_CONSTANTS;

export const hasCallLogsViewPermission = (permissions?: string[]): boolean => {
  if (!permissions?.length) return false;
  return (
    permissions.includes(PERMISSIONS.VIEW_CALL_LOGS) ||
    permissions.includes(PERMISSIONS.LIST_CALL_LOGS)
  );
};

export const hasCallLogsExportPermission = (permissions?: string[]): boolean => {
  if (!permissions?.length) return false;
  return permissions.includes(PERMISSIONS.EXPORT_CALL_LOGS);
};

export const hasCallRecordingsViewPermission = (permissions?: string[]): boolean => {
  if (!permissions?.length) return false;
  return (
    permissions.includes(PERMISSIONS.VIEW_CALL_RECORDINGS) ||
    permissions.includes(PERMISSIONS.LIST_CALL_RECORDINGS)
  );
};

export const hasCallRecordingsExportPermission = (
  permissions?: string[],
): boolean => {
  if (!permissions?.length) return false;
  return permissions.includes(PERMISSIONS.EXPORT_CALL_RECORDINGS);
};

export interface CallAnalyticsSummary {
  total_calls: number;
  answered_calls: number;
  unanswered_calls: number;
  total_cost: number;
  total_duration: number;
  avg_duration: number;
  avg_ring_time: number;
}

export const EMPTY_CALL_ANALYTICS_SUMMARY: CallAnalyticsSummary = {
  total_calls: 0,
  answered_calls: 0,
  unanswered_calls: 0,
  total_cost: 0,
  total_duration: 0,
  avg_duration: 0,
  avg_ring_time: 0,
};

export const isCallAnalyticsFilterCleared = (
  filters: Record<string, unknown>,
): boolean => {
  const keys = Object.keys(filters);
  return keys.length === 0 || (keys.length === 1 && Object.hasOwn(filters, "is_incoming_only"));
};

export const canViewCallLogsFromSession = (
  session?: { user?: { permissions?: string[] } } | null,
): boolean => hasCallLogsViewPermission(session?.user?.permissions);

interface ApplyCallAnalyticsFiltersArgs {
  currentFilters: Record<string, any>;
  nextFilters: Record<string, any>;
  filtersReady: boolean;
  setCurrentFilters: (value: any) => void;
  setFiltersReady: (value: boolean) => void;
  setDataLoaded: (value: boolean) => void;
  setSummary: (summary: any) => void;
  setRefreshKey: Dispatch<SetStateAction<number>>;
}

export const applyCallAnalyticsFilters = ({
  currentFilters,
  nextFilters,
  filtersReady,
  setCurrentFilters,
  setFiltersReady,
  setDataLoaded,
  setSummary,
  setRefreshKey,
}: ApplyCallAnalyticsFiltersArgs): void => {
  const filtersChanged = JSON.stringify(currentFilters) !== JSON.stringify(nextFilters);
  const isCompletelyCleared = isCallAnalyticsFilterCleared(nextFilters);

  setCurrentFilters(nextFilters);
  if (!filtersReady) setFiltersReady(true);

  const shouldRefresh = (filtersChanged && filtersReady) || isCompletelyCleared;
  if (!shouldRefresh) return;

  setDataLoaded(false);
  setSummary(EMPTY_CALL_ANALYTICS_SUMMARY);
  setRefreshKey((prev) => prev + 1);
};
