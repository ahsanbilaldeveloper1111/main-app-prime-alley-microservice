import { crmPlannerExtensionDisplayName } from "../crmOrdersPlannerOrderDisplayHelpers";
import { buildCrmOrderGridRowFromApiOrder } from "@utils/crmOrdersGridRowFromApiOrder";
import { computeCrmOrdersAnalyticsFromGridRows } from "@utils/crmOrdersGridAnalyticsFromRows";

export function normalizePlannerLeadContactPersons(leadPayload: unknown): unknown {
  const lead = leadPayload as { contact_persons?: unknown } | null | undefined;
  if (!lead?.contact_persons || typeof lead.contact_persons !== "string") {
    return leadPayload;
  }
  try {
    return { ...lead, contact_persons: JSON.parse(lead.contact_persons) };
  } catch (error) {
    console.error("Failed to parse contact_persons:", error);
    return { ...lead, contact_persons: [] };
  }
}

export function plannerTransformOrderRowForGrid(order: any, extensions: any[]) {
  const assignedDisplay = crmPlannerExtensionDisplayName(
    extensions,
    order?.assigned_to,
    { labelWhenUnassigned: "" },
  );
  return buildCrmOrderGridRowFromApiOrder(order, assignedDisplay) as any;
}

export function plannerComputeOrdersAnalyticsSlice(
  ordersData: any[],
  extensions: any[],
  summaryTiles: unknown,
  totalOrders: number,
) {
  const transformedOrders = ordersData.map((order) =>
    plannerTransformOrderRowForGrid(order, extensions),
  );
  return computeCrmOrdersAnalyticsFromGridRows(transformedOrders, summaryTiles, totalOrders);
}

export function plannerComputeOrdersTabCounts(
  ordersData: any[],
  extensions: any[],
  stages: any[],
  summaryTiles: any,
  totalOrders: number,
): Record<string, number> {
  const transformed = ordersData.map((order) =>
    plannerTransformOrderRowForGrid(order, extensions),
  );
  const counts: Record<string, number> = {
    all: summaryTiles?.total_orders || totalOrders || transformed.length,
    lost:
      summaryTiles?.lost_orders || transformed.filter((o) => o.rawData?.is_lost).length,
    deleted: summaryTiles?.deleted_orders || 0,
  };

  stages.slice(0, 5).forEach((stage: any) => {
    const stageOrders = transformed.filter(
      (o) => o.stage === stage.name || o.rawData?.order_stage_id === stage.id,
    );
    counts[stage.id] = stageOrders.length;
  });
  return counts;
}
