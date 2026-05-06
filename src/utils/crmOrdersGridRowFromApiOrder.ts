import moment from "moment";
import { GlobalDateFormat, formatDateForTable } from "@utils/Helper";

/**
 * Maps a CRM orders API record to the GenericTable grid row shape.
 * Callers supply the resolved "assigned / owner" label (extensions lookup or planner helper).
 */
export function buildCrmOrderGridRowFromApiOrder(
  order: any,
  assignedAndOwnerLabel: string,
): Record<string, unknown> {
  const companyName =
      order.company?.name || order.deal?.company_name || order.customer_name || "";
  return {
    id: order.id,
    orderNumber: order.order_number || "",
    customer: companyName,
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
    assignedUser: assignedAndOwnerLabel,
    expectedDeliveryDate: formatDateForTable(order.expected_delivery_date),
    actualDeliveryDate: formatDateForTable(order.actual_delivery_date),
    owner: assignedAndOwnerLabel,
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
