import moment from "moment";
import { GlobalDateFormat, formatDateForTable } from "@utils/Helper";
import { crmPlannerExtensionDisplayName } from "../crmOrdersPlannerOrderDisplayHelpers";

export function normalizePlannerLeadContactPersons(leadPayload: unknown): unknown {
  const lead = leadPayload as { contact_persons?: unknown } | null | undefined;
  if (!lead?.contact_persons || typeof lead.contact_persons !== "string") {
    return leadPayload;
  }
  try {
    return { ...lead, contact_persons: JSON.parse(lead.contact_persons as string) };
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
  return {
    id: order.id,
    orderNumber: order.order_number || "",
    customer: order.customer_name || "",
    customerEmail: order.customer_email || "",
    customerPhone: order.customer_phone || "",
    deal: order.deal?.name || order.deal_id || "",
    dealId: order.deal_id || null,
    stage: order.stage?.name || "No Stage",
    stageColor: order.stage?.color || "grey",
    stageId: order.order_stage_id || null,
    value: order.final_amount || order.total_amount || "0",
    currency: order.currency || "AED",
    approvalStatus: order.order_approval_status || null,
    fulfillmentStatus: order.fulfillment_status || null,
    paymentStatus: order.payment_status || null,
    orderDate: order.order_date ? moment(order.order_date).format(GlobalDateFormat) : "-",
    assignedUser: assignedDisplay,
    expectedDeliveryDate: formatDateForTable(order.expected_delivery_date),
    actualDeliveryDate: formatDateForTable(order.actual_delivery_date),
    owner: assignedDisplay,
    created: formatDateForTable(order.created_at),
    contractType: order.contract_type || "",
    contractLength: order.contract_length || "",
    contractStartDate: formatDateForTable(order.contract_start_date),
    contractEndDate: formatDateForTable(order.contract_end_date),
    billingModel: order.billing_model || "",
    billingStatus: order.billing_status || "",
    paymentTerms: order.payment_terms || "",
    progressDial: order.progress_dial || 0,
    pocName: order.poc_name || order.customer_name || "",
    pocTitle: order.poc_title || "",
    pocPhone: order.poc_phone || "",
    company: order.company || order.deal?.company_name || "",
    industry: order.industry || order.deal?.industry || "",
    status: order.status || "pending",
    rawData: order,
  };
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
    const value =
      Number.parseFloat(String(o.value).replaceAll(/[^0-9.-]/g, "")) || 0;
    return sum + value;
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
