import { HEADER_CONSTANTS } from "@constants/headerConstants";

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
