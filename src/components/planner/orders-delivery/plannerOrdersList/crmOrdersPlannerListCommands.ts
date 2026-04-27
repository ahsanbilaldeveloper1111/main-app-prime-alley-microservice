import { buildCrmOrdersListGetOrdersParams } from "@crm/orders/buildCrmOrdersListGetOrdersParams";
import {
  deleteOrder,
  deleteOrderAttachment,
  downloadDealAttachment,
  downloadOrderAttachment,
  getOrders,
  getStages,
  markOrderLost,
  restoreOrder,
  uploadOrderAttachment,
} from "@crm/orders/orderListCrmApi";
import { GetHierarchyData } from "@utils/users";
import { toast } from "react-toastify";
import {
  plannerFetchOrderAttachmentsBundle,
  plannerFetchOrderDetailBundle,
} from "./crmOrdersPlannerListFetches";

export type PlannerOrdersListFetchSetters = Readonly<{
  setLoading: (v: boolean) => void;
  setOrdersData: (v: any[]) => void;
  setTotalOrders: (v: number) => void;
  setSummaryTiles: (v: any) => void;
}>;

export async function plannerExecuteOrdersListFetch(
  page: number,
  perPage: number,
  currentFilters: Record<string, unknown>,
  tableSort: { sortBy: string; sortOrder: string },
  setters: PlannerOrdersListFetchSetters,
): Promise<void> {
  setters.setLoading(true);
  try {
    const params = buildCrmOrdersListGetOrdersParams({
      filters: currentFilters,
      page,
      perPage,
      tableSort: tableSort.sortBy ? tableSort : null,
      normalizeSearch: true,
      ownerParamStyle: "user_extension_filter",
    });
    const response: unknown = await getOrders(params);
    const res = response as {
      dataList?: any[];
      meta?: { total?: number };
      summary_tiles?: unknown;
    };
    const ordersArray: any[] = res?.dataList || [];
    const pagination: { total?: number } = res?.meta || {};
    const summary = res?.summary_tiles ?? null;
    setters.setOrdersData(Array.isArray(ordersArray) ? ordersArray : []);
    setters.setTotalOrders(pagination?.total || 0);
    setters.setSummaryTiles(summary);
  } finally {
    setters.setLoading(false);
  }
}

export async function plannerLoadStages(setStages: (v: any[]) => void): Promise<void> {
  try {
    const stagesData = await getStages("order");
    setStages(stagesData || []);
  } catch (error) {
    console.error("Failed to fetch stages:", error);
  }
}

export async function plannerLoadLostReasons(setLostReasons: (v: any[]) => void): Promise<void> {
  try {
    const lostReasonsData = await (getStages as (slug: string) => Promise<any[]>)("lost_reason");
    setLostReasons(lostReasonsData || []);
  } catch (error) {
    console.error("Failed to fetch lost reasons:", error);
  }
}

export async function plannerLoadExtensions(
  setExtensions: (v: any[]) => void,
  moduleSlug: string,
): Promise<void> {
  try {
    const hierarchyData = await GetHierarchyData(moduleSlug);
    if (hierarchyData?.extensions) {
      setExtensions(hierarchyData.extensions);
    }
  } catch (error) {
    console.error("Failed to fetch extensions:", error);
  }
}

export async function plannerExecuteAttachmentLoad(
  selectedOrder: any,
  setLoadingAttachments: (v: boolean) => void,
  setAttachments: (v: any[]) => void,
  setDealAttachments: (v: any[]) => void,
): Promise<void> {
  if (!selectedOrder?.id) return;
  setLoadingAttachments(true);
  try {
    const { orderAttachments, relatedDealAttachments } =
      await plannerFetchOrderAttachmentsBundle(selectedOrder);
    setAttachments(orderAttachments);
    setDealAttachments(relatedDealAttachments);
  } catch (error) {
    console.error("Failed to fetch attachments:", error);
    setAttachments([]);
    setDealAttachments([]);
  } finally {
    setLoadingAttachments(false);
  }
}

export async function plannerExecuteAttachmentUpload(
  selectedOrder: any,
  file: File,
  fileInputRef: HTMLInputElement | null,
  fetchAgain: () => Promise<void>,
  setUploadingFile: (v: boolean) => void,
): Promise<void> {
  if (!selectedOrder?.id) return;
  setUploadingFile(true);
  try {
    await uploadOrderAttachment(selectedOrder.id, file, file.name);
    await fetchAgain();
    if (fileInputRef) {
      fileInputRef.value = "";
    }
  } catch (error) {
    console.error("Failed to upload file:", error);
  } finally {
    setUploadingFile(false);
  }
}

export async function plannerExecuteAttachmentDelete(
  selectedOrder: any,
  attachmentId: number,
  refresh: () => Promise<void>,
): Promise<void> {
  if (!selectedOrder?.id) return;
  try {
    await deleteOrderAttachment(selectedOrder.id, attachmentId);
    await refresh();
    toast.success("Attachment deleted successfully!");
  } catch (error) {
    console.error("Failed to delete attachment:", error);
    toast.error("Failed to delete attachment");
  }
}

export async function plannerExecuteDownloadOrderAttachment(
  selectedOrder: any,
  attachmentId: number,
): Promise<void> {
  if (!selectedOrder?.id) return;
  try {
    await downloadOrderAttachment(selectedOrder.id, attachmentId);
  } catch (error) {
    console.error("Failed to download attachment:", error);
  }
}

export async function plannerExecuteDownloadDealAttachment(
  selectedOrder: any,
  attachmentId: number,
): Promise<void> {
  if (!selectedOrder?.deal_id) return;
  try {
    await downloadDealAttachment(Number(selectedOrder.deal_id), attachmentId);
  } catch (error) {
    console.error("Failed to download deal attachment:", error);
  }
}

export async function plannerExecuteFetchOrderDetailsForView(
  orderId: number,
  setLoadingOrder: (v: boolean) => void,
  setViewingOrder: (v: any) => void,
  setRelatedDeal: (v: any) => void,
  setRelatedLead: (v: any) => void,
): Promise<void> {
  setLoadingOrder(true);
  setRelatedDeal(null);
  setRelatedLead(null);
  try {
    const { orderData, dealData, leadData } = await plannerFetchOrderDetailBundle(orderId);
    setViewingOrder(orderData);
    setRelatedDeal(dealData);
    setRelatedLead(leadData);
  } catch (error) {
    console.error("Failed to fetch order:", error);
  } finally {
    setLoadingOrder(false);
  }
}

export async function plannerExecuteDeleteOrder(
  orderToDelete: { id: number } | null,
  setShowDeleteModal: (v: boolean) => void,
  setOrderToDelete: (v: any) => void,
  bumpSuccessModal: (title: string, description: string) => void,
  bumpRefresh: () => void,
): Promise<void> {
  if (!orderToDelete) return;
  try {
    await deleteOrder(orderToDelete.id);
    setShowDeleteModal(false);
    setOrderToDelete(null);
    bumpSuccessModal("Order Deleted", "Order has been deleted successfully");
    bumpRefresh();
  } catch (error) {
    console.error("Failed to delete order:", error);
  }
}

export async function plannerExecuteRestoreOrder(
  orderId: number,
  bumpSuccessModal: (title: string, description: string) => void,
  bumpRefresh: () => void,
): Promise<void> {
  if (!globalThis.confirm("Are you sure you want to restore this order?")) return;
  try {
    await restoreOrder(orderId);
    toast.success("Order restored successfully!");
    bumpSuccessModal("Order Restored", "Order has been restored successfully");
    bumpRefresh();
  } catch (error) {
    console.error("Failed to restore order:", error);
    toast.error("Failed to restore order");
  }
}

export async function plannerExecuteMarkOrderLost(
  orderToMarkLost: any,
  lostReasonId: number | null,
  lostFeedback: string,
  resetLostModal: () => void,
  bumpSuccessModal: (title: string, description: string) => void,
  bumpRefresh: () => void,
): Promise<void> {
  if (!orderToMarkLost || !lostReasonId || !lostFeedback.trim()) return;
  try {
    await markOrderLost(orderToMarkLost.id, {
      lost_reason_id: lostReasonId,
      lost_feedback: lostFeedback,
    });
    resetLostModal();
    toast.success("Order marked as lost!");
    bumpSuccessModal(
      "Order Marked as Lost",
      "Order has been marked as lost successfully",
    );
    bumpRefresh();
  } catch (error) {
    console.error("Failed to mark order as lost:", error);
  }
}
