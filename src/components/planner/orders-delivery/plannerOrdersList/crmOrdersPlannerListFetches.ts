import {
  getDeal,
  getDealAttachments,
  getLead,
  getOrder,
  getOrderAttachments,
} from "@crm/orders/orderListCrmApi";
import { normalizePlannerLeadContactPersons } from "./crmOrdersPlannerListRowModel";

export async function plannerFetchOrderAttachmentsBundle(selectedOrder: {
  id: number;
  deal_id?: number | null;
}): Promise<{ orderAttachments: any[]; relatedDealAttachments: any[] }> {
  const orderAttachments = await getOrderAttachments(selectedOrder.id);
  if (!selectedOrder.deal_id) {
    return { orderAttachments: orderAttachments || [], relatedDealAttachments: [] };
  }

  try {
    const dealData = await getDealAttachments(Number(selectedOrder.deal_id));
    return {
      orderAttachments: orderAttachments || [],
      relatedDealAttachments: dealData || [],
    };
  } catch (error) {
    console.error("Failed to fetch deal attachments:", error);
    return { orderAttachments: orderAttachments || [], relatedDealAttachments: [] };
  }
}

export async function plannerFetchOrderDetailBundle(orderId: number) {
  const orderData: any = await getOrder(orderId);

  let dealData: any = null;
  let leadData: any = null;

  if (orderData?.deal_id) {
    try {
      dealData = await getDeal(Number(orderData.deal_id));
    } catch (error) {
      console.error("Failed to fetch deal:", error);
    }
  }

  if (dealData?.ticket_id) {
    try {
      const lead = await getLead(Number(dealData.ticket_id));
      leadData = normalizePlannerLeadContactPersons(lead);
    } catch (error) {
      console.error("Failed to fetch lead:", error);
    }
  }

  return { orderData, dealData, leadData };
}
