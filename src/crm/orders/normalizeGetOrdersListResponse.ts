/**
 * Normalizes the payload returned by `getOrders` / `/crm/orders` list endpoints.
 * Shared by planner, billing customer order-invoicing, and other order list UIs.
 */
export type NormalizedOrdersListResponse = {
  ordersData: unknown[];
  totalOrders: number;
  summaryTiles?: unknown;
  metrics?: unknown;
};

export function normalizeGetOrdersListResponse(
  response: unknown,
): NormalizedOrdersListResponse {
  const res = response as {
    dataList?: unknown;
    meta?: { total?: number };
    summary_tiles?: unknown;
    metrics?: unknown;
  };
  const ordersArray: unknown[] = Array.isArray(res?.dataList)
    ? (res.dataList as unknown[])
    : [];
  const pagination = res?.meta ?? {};
  return {
    ordersData: ordersArray,
    totalOrders: pagination.total ?? 0,
    summaryTiles: res?.summary_tiles,
    metrics: res?.metrics,
  };
}
