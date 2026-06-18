export const SHIFT_MANAGEMENT_INNER_TABS = [
  { id: "shifts", label: "Shifts" },
  { id: "shift-assignments", label: "Shift Assignments" },
] as const;

export type ShiftManagementInnerTabId =
  (typeof SHIFT_MANAGEMENT_INNER_TABS)[number]["id"];

export function isShiftManagementInnerTabId(
  value: string,
): value is ShiftManagementInnerTabId {
  return SHIFT_MANAGEMENT_INNER_TABS.some((tab) => tab.id === value);
}
