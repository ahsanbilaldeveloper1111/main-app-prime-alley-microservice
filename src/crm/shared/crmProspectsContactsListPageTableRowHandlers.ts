import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;

export function prospectsTableRowDoubleClick(
  session: { user?: { permissions?: string[] } } | null,
  handleViewData: (row: any) => void,
  row: any,
): void {
  if (
    !session?.user?.permissions?.includes(PERMISSIONS.VIEW_CRM_DATA_MANAGEMENT)
  ) {
    return;
  }
  handleViewData(row);
}
