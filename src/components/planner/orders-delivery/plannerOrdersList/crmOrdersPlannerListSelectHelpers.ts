import type { OrdersFilterSelectOption } from "./crmOrdersPlannerListConstants";

export function plannerBuildAssignedToSelectValue(
  assignedTo: string | null,
  extensions: unknown[],
): OrdersFilterSelectOption | null {
  if (!assignedTo) {
    return null;
  }
  const ext = extensions.find((e: any) => (e.id || e.extension) === assignedTo);
  if (ext) {
    return {
      value: assignedTo,
      label: String((ext as any).display_name || (ext as any).name || assignedTo),
    };
  }
  return { value: assignedTo, label: assignedTo };
}

export function plannerBuildStageSelectValue(
  stageId: string | null,
  stages: unknown[],
): OrdersFilterSelectOption | null {
  if (!stageId) {
    return null;
  }
  const stage = stages.find((st: any) => st.id.toString() === stageId);
  if (stage) {
    return { value: stageId, label: String((stage as any).name) };
  }
  return { value: stageId, label: stageId };
}
