/** Display name for CRM extension / assigned_to id (orders list + sidebars). */
export function extensionLabelForAssignedTo(
  extensions: any[],
  assignedTo: unknown,
): string {
  const ext = extensions.find(
    (e: any) => e?.id == assignedTo || e?.extension == assignedTo,
  );
  if (ext?.display_name) {
    return ext.display_name;
  }
  if (ext?.name) {
    return ext.name;
  }
  if (assignedTo != null && assignedTo !== "") {
    if (
      typeof assignedTo === "string" ||
      typeof assignedTo === "number" ||
      typeof assignedTo === "boolean" ||
      typeof assignedTo === "bigint"
    ) {
      return String(assignedTo);
    }
    return "";
  }
  return "";
}
