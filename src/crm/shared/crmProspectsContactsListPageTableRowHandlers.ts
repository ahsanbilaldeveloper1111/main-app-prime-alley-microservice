export function prospectsTableRowDoubleClick(
  session: { user?: { permissions?: string[] } } | null,
  handleViewData: (row: any) => void,
  row: any,
): void {
  if (!session?.user?.permissions?.includes("view-crm-data-management")) {
    return;
  }
  handleViewData(row);
}
