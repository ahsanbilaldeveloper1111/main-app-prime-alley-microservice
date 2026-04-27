/** Minimal row shape used by orders list analytics (planner + CRM list). */
export type CrmOrdersGridRowForAnalytics = {
  fulfillmentStatus?: string | null;
  approvalStatus?: string | null;
  value?: unknown;
  stage?: string | null;
};

export function computeCrmOrdersAnalyticsFromGridRows(
  transformedOrders: CrmOrdersGridRowForAnalytics[],
  summaryTiles: unknown,
  totalOrders: number,
): {
  total: number;
  delivered: number;
  inProgress: number;
  pendingApproval: number;
  totalValue: number;
  stageCounts: Record<string, number>;
  statusCounts: Record<string, number>;
} {
  const total = summaryTiles ? totalOrders : transformedOrders.length;
  const delivered = transformedOrders.filter(
    (o) =>
      o.fulfillmentStatus?.toLowerCase().includes("completed") ||
      o.fulfillmentStatus?.toLowerCase().includes("delivered"),
  ).length;
  const inProgress = transformedOrders.filter((o) =>
    o.fulfillmentStatus?.toLowerCase().includes("progress"),
  ).length;
  const pendingApproval = transformedOrders.filter((o) =>
    o.approvalStatus?.toLowerCase().includes("pending"),
  ).length;
  const totalValue = transformedOrders.reduce((sum, o) => {
    const raw = o.value;
    if (typeof raw === "number" && Number.isFinite(raw)) {
      return sum + raw;
    }
    if (raw === null || raw === undefined) {
      return sum;
    }
    if (typeof raw === "string") {
      return sum + (Number.parseFloat(raw.replaceAll(/[^0-9.-]/g, "")) || 0);
    }
    return sum;
  }, 0);
  const stageCounts: Record<string, number> = {};
  transformedOrders.forEach((o) => {
    const stage = o.stage || "No Stage";
    stageCounts[stage] = (stageCounts[stage] || 0) + 1;
  });
  const statusCounts: Record<string, number> = {};
  transformedOrders.forEach((o) => {
    const status = o.fulfillmentStatus || "pending";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  return {
    total,
    delivered,
    inProgress,
    pendingApproval,
    totalValue,
    stageCounts,
    statusCounts,
  };
}
