import "@crm/orders/orderListPageOrderScss";
import { useRouter, type NextRouter } from "next/router";
import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import {
  BreadcrumbItem,
  GenericTable,
  GenericFilterSidebar,
  StatsCards,
  OrderEditModal,
  type TableColumn,
  type TableAction,
} from "@crm/orders/orderListOrderPageFrame";
import { FiFilter } from "@crm/orders/orderListFiIcons";
import {
  getOrders,
  getOrder,
  getStages,
  deleteOrder,
  restoreOrder,
  getOrderAttachments,
  uploadOrderAttachment,
  deleteOrderAttachment,
  downloadOrderAttachment,
  markOrderLost,
  getDeal,
  getLead,
  getDealAttachments,
  downloadDealAttachment,
} from "@crm/orders/orderListCrmApi";
import { GetHierarchyData } from "@utils/users";
import {
  Button,
  Row,
  Col,
  Badge,
  Form,
  Card,
} from "@crm/orders/orderListBootstrap";
import Select, { type SingleValue } from "@components/AppSelect";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

type OrdersDeliverySelectOption = { value: string | number; label: string };
const toOptionalSelectString = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return null;
  return String(value);
};
const { PERMISSIONS } = HEADER_CONSTANTS;
import { GlobalDateFormat, ModuleSlug, formatDateForTable } from "@utils/Helper";
import {
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  ShoppingBag,
  MoreVertical,
  X,
  Layers,
  DollarSign,
  Activity,
  ShoppingCart,
  Paperclip,
  RotateCcw,
} from "@crm/orders/orderListLucideHeavy";
import { toast } from "react-toastify";

import {
  SuccessfulModal,
  FormModal,
  DeleteConfirmationModal,
  KPICard,
  FilterBar,
  getInitials,
  getRandomColor,
  customSelectStyles,
} from "@crm/orders/orderListOrderPageShared";
import { useSession } from "next-auth/react";
import { renderCrmOrdersOrderViewModal } from "./CrmOrdersOrderViewModal";
import { CrmOrdersOrderPageSidebar } from "./CrmOrdersOrderPageSidebar";
import { CrmOrdersAttachmentsModal } from "./CrmOrdersAttachmentsModal";
import {
  CrmOrdersFulfillmentBarChart,
  CrmOrdersStagePieChart,
} from "./CrmOrdersAnalyticsCharts";
import moment from "moment";


const OPTIONAL_STRING_FILTER_KEYS = [
  "stage_id",
  "assigned_to",
  "search",
  "industry",
  "order_value_min",
  "order_value_max",
  "order_stage_id",
  "order_approval_status",
  "fulfillment_status",
  "payment_status",
  "date_from",
  "date_to",
] as const;

const OPTIONAL_TRUE_FILTER_KEYS = ["include_lost", "include_archived"] as const;

type OrdersUiFilters = {
  assignedTo: string | null;
  stage: string | null;
  industry: string | null;
  orderValueMin: string | null;
  orderValueMax: string | null;
  orderApprovalStatus: string | null;
  fulfillmentStatus: string | null;
  paymentStatus: string | null;
  dateFrom: string | null;
  dateTo: string | null;
};

const DEFAULT_ORDERS_UI_FILTERS: OrdersUiFilters = {
  assignedTo: null,
  stage: null,
  industry: null,
  orderValueMin: null,
  orderValueMax: null,
  orderApprovalStatus: null,
  fulfillmentStatus: null,
  paymentStatus: null,
  dateFrom: null,
  dateTo: null,
};

type OrdersFilterSelectOption = { value: string; label: string };

function buildAssignedToSelectValue(
  assignedTo: string | null,
  extensions: any[],
): OrdersFilterSelectOption | null {
  if (!assignedTo) {
    return null;
  }
  const ext = extensions.find((e: any) => (e.id || e.extension) === assignedTo);
  if (ext) {
    return {
      value: assignedTo,
      label: String(ext.display_name || ext.name || assignedTo),
    };
  }
  return { value: assignedTo, label: assignedTo };
}

function buildStageSelectValue(
  stageId: string | null,
  stages: any[],
): OrdersFilterSelectOption | null {
  if (!stageId) {
    return null;
  }
  const stage = stages.find((st: any) => st.id.toString() === stageId);
  if (stage) {
    return { value: stageId, label: String(stage.name) };
  }
  return { value: stageId, label: stageId };
}

function setOptionalFilterValue(
  target: Record<string, any>,
  key: string,
  value: unknown,
  toStringValue = false,
): void {
  if (!value) {
    delete target[key];
    return;
  }
  if (!toStringValue) {
    target[key] = value;
    return;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    target[key] = String(value);
    return;
  }
  delete target[key];
}

function buildOrdersRequestParams(
  page: number,
  perPage: number,
  filters: Record<string, any>,
) {
  const params: Record<string, any> = { page, per_page: perPage };
  OPTIONAL_STRING_FILTER_KEYS.forEach((key) => {
    if (!(key in filters)) return;
    setOptionalFilterValue(
      params,
      key,
      filters[key],
      key === "stage_id" || key === "assigned_to" || key === "order_value_min" || key === "order_value_max" || key === "order_stage_id",
    );
  });
  if ("is_lost" in filters) {
    params.is_lost = filters.is_lost;
  }
  OPTIONAL_TRUE_FILTER_KEYS.forEach((key) => {
    if (filters[key] !== undefined) {
      params[key] = filters[key];
    }
  });
  return params;
}

function applyActiveFilterState(
  previousFilters: Record<string, any>,
  activeFilter: string,
  stages: any[],
): { nextFilters: Record<string, any>; stageValue: string | null } {
  const nextFilters = { ...previousFilters };

  delete nextFilters.stage_id;
  delete nextFilters.include_archived;
  delete nextFilters.include_lost;

  if (activeFilter === "lost") {
    nextFilters.include_lost = true;
    return { nextFilters, stageValue: null };
  }

  if (activeFilter === "deleted") {
    nextFilters.include_archived = true;
    return { nextFilters, stageValue: null };
  }

  if (activeFilter !== "all") {
    const selectedStage = stages.find((s: any) => s.id.toString() === activeFilter);
    if (selectedStage) {
      const stageId = selectedStage.id.toString();
      nextFilters.stage_id = stageId;
      return { nextFilters, stageValue: stageId };
    }
  }

  return { nextFilters, stageValue: null };
}

function isValidActiveFilterTab(tab: string, stages: any[]): boolean {
  if (tab === "all" || tab === "lost" || tab === "deleted") return true;
  return stages.some((s: any) => s.id.toString() === tab);
}

function buildOrdersFiltersToApply(
  ordersSearch: string,
  ordersFilters: OrdersUiFilters,
): Record<string, string> {
  const filtersToApply: Record<string, string> = {};
  setOptionalFilterValue(filtersToApply, "search", ordersSearch);
  setOptionalFilterValue(filtersToApply, "assigned_to", ordersFilters.assignedTo, true);
  setOptionalFilterValue(filtersToApply, "order_stage_id", ordersFilters.stage, true);
  setOptionalFilterValue(filtersToApply, "industry", ordersFilters.industry);
  setOptionalFilterValue(filtersToApply, "order_value_min", ordersFilters.orderValueMin, true);
  setOptionalFilterValue(filtersToApply, "order_value_max", ordersFilters.orderValueMax, true);
  setOptionalFilterValue(filtersToApply, "order_approval_status", ordersFilters.orderApprovalStatus);
  setOptionalFilterValue(filtersToApply, "fulfillment_status", ordersFilters.fulfillmentStatus);
  setOptionalFilterValue(filtersToApply, "payment_status", ordersFilters.paymentStatus);
  setOptionalFilterValue(filtersToApply, "date_from", ordersFilters.dateFrom);
  setOptionalFilterValue(filtersToApply, "date_to", ordersFilters.dateTo);
  return filtersToApply;
}

function syncOrdersFiltersFromActiveTab(params: {
  activeFilter: string;
  stages: any[];
  setCurrentFilters: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setOrdersFilters: React.Dispatch<React.SetStateAction<OrdersUiFilters>>;
}): void {
  const { stageValue } = applyActiveFilterState({}, params.activeFilter, params.stages);
  params.setCurrentFilters((prev) =>
    applyActiveFilterState(prev, params.activeFilter, params.stages).nextFilters,
  );
  params.setOrdersFilters((prev) => ({ ...prev, stage: stageValue }));
}

function syncActiveTabFromRouter(params: {
  routerReady: boolean;
  routerTab: unknown;
  stages: any[];
  activeFilter: string;
  setActiveFilter: React.Dispatch<React.SetStateAction<string>>;
}): void {
  if (!params.routerReady || !params.routerTab) return;
  let tabFromUrl = "";
  if (typeof params.routerTab === "string") {
    tabFromUrl = params.routerTab;
  } else if (Array.isArray(params.routerTab)) {
    tabFromUrl = params.routerTab[0] ?? "";
  }
  if (!tabFromUrl) return;
  const isValidFilter = isValidActiveFilterTab(tabFromUrl, params.stages);
  if (isValidFilter && tabFromUrl !== params.activeFilter) {
    params.setActiveFilter(tabFromUrl);
  }
}

function getOrderRowId(row: any): number {
  return Number(row?.rawData?.id || row?.id || 0);
}

function buildOrdersActions(params: {
  activeFilter: string;
  canEdit: boolean;
  canDelete: boolean;
  onViewOrder: (orderId: number) => void | Promise<void>;
  onRestoreOrder: (orderId: number) => void | Promise<void>;
  onEditOrder: (row: any) => void;
  onOpenAttachments: (row: any) => void;
  onDeleteOrder: (orderId: number, orderNumber?: string) => void;
  onMarkLost: (row: any) => void;
}): TableAction<any>[] {
  if (params.activeFilter === "deleted") {
    return [
      {
        label: "View",
        icon: <Eye size={16} />,
        onClick: (row: any) => params.onViewOrder(getOrderRowId(row)),
        variant: "link",
      },
      {
        label: "Restore",
        icon: <RotateCcw size={16} />,
        onClick: (row: any) => params.onRestoreOrder(getOrderRowId(row)),
        variant: "link",
        className: "text-success",
      },
    ];
  }

  const actions: TableAction<any>[] = [
    {
      label: "View",
      icon: <Eye size={16} />,
      onClick: (row: any) => params.onViewOrder(getOrderRowId(row)),
      variant: "link",
    },
    {
      label: "Attachments",
      icon: <Paperclip size={16} />,
      onClick: (row: any) => params.onOpenAttachments(row),
      variant: "link",
      className: "text-info",
    },
  ];

  if (params.canEdit) {
    actions.splice(1, 0, {
      label: "Edit",
      icon: <Edit size={16} />,
      onClick: (row: any) => params.onEditOrder(row),
      variant: "link",
    });
  }

  if (params.canDelete) {
    actions.push({
      label: "Delete",
      icon: <Trash2 size={16} />,
      onClick: (row: any) => params.onDeleteOrder(getOrderRowId(row), row.orderNumber),
      variant: "link",
      className: "text-danger",
    });
  }

  if (params.activeFilter !== "lost") {
    actions.push({
      label: "More Actions",
      icon: <MoreVertical size={16} />,
      variant: "link",
      dropdown: {
        align: "end",
        options: [
          {
            label: "Mark as Lost",
            icon: <X size={14} />,
            onClick: (row: any) => params.onMarkLost(row.rawData || row),
            className: "text-danger",
          },
        ],
      },
    });
  }

  return actions;
}

function buildOrdersTableColumns(): TableColumn<any>[] {
  return [
    {
      key: "orderNumber",
      label: "Order Number",
      sortable: true,
      type: "text",
      emptyValue: "-",
    },
    {
      key: "customer",
      label: "Company",
      sortable: true,
      type: "multi-field",
      fields: {
        primary: "customer",
        secondary: "customerEmail",
        secondaryClass: "text-muted small",
      },
      render: (row: any) => (
        <div className="d-flex align-items-center gap-2">
          {row.customer ? (
            <>
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  backgroundColor: getRandomColor(row.customer),
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: "600",
                  flexShrink: 0,
                }}
              >
                {getInitials(row.customer)}
              </div>
              <div>
                <div className="fw-medium">{row.customer}</div>
                {row.customerEmail ? (
                  <small className="text-muted">{row.customerEmail}</small>
                ) : null}
              </div>
            </>
          ) : (
            <div>No Company</div>
          )}
        </div>
      ),
      emptyValue: "No Company",
    },
    {
      key: "deal",
      label: "Linked Deal",
      sortable: true,
      type: "text",
      accessor: (row: any) => row.deal || "No Deal",
      emptyValue: "No Deal",
    },
    {
      key: "stage",
      label: "Stage",
      sortable: true,
      type: "custom",
      render: (row: any) => (
        <span style={{ backgroundColor: row?.stageColor || "grey" }} className="badge">
          {row.stage}
        </span>
      ),
    },
    {
      key: "value",
      label: "Value",
      sortable: true,
      type: "custom",
      render: (row: any) => (
        <span className="fw-semibold">
          {row.currency} {Number.parseFloat(String(row.value)).toLocaleString()}
        </span>
      ),
    },
    {
      key: "approvalStatus",
      label: "Approval",
      sortable: true,
      type: "custom",
      render: (row: any) => {
        const s = String(row.approvalStatus ?? "").toLowerCase();
        let bg: "success" | "danger" | "warning" = "warning";
        if (s === "approved") bg = "success";
        else if (s === "rejected") bg = "danger";
        return <Badge bg={bg}>{row.approvalStatus}</Badge>;
      },
      emptyValue: "-",
    },
    {
      key: "fulfillmentStatus",
      label: "Fulfillment",
      sortable: true,
      type: "custom",
      render: (row: any) => {
        const s = String(row.fulfillmentStatus ?? "").toLowerCase();
        let bg: "success" | "primary" | "secondary" = "secondary";
        if (s.includes("completed") || s.includes("delivered")) bg = "success";
        else if (s.includes("progress")) bg = "primary";
        return <Badge bg={bg}>{row.fulfillmentStatus}</Badge>;
      },
      emptyValue: "-",
    },
    {
      key: "paymentStatus",
      label: "Payment",
      sortable: true,
      type: "custom",
      render: (row: any) => {
        const s = String(row.paymentStatus ?? "").toLowerCase();
        let bg: "success" | "warning" | "danger" = "danger";
        if (s === "paid") bg = "success";
        else if (s === "partial") bg = "warning";
        return <Badge bg={bg}>{row.paymentStatus}</Badge>;
      },
      emptyValue: "-",
    },
    {
      key: "assignedUser",
      label: "Assigned To",
      sortable: true,
      type: "text",
      emptyValue: "-",
    },
    {
      key: "orderDate",
      label: "Order Date",
      sortable: true,
      type: "text",
      emptyValue: "-",
    },
    {
      key: "owner",
      label: "Owner",
      sortable: true,
      type: "text",
      emptyValue: "-",
    },
    {
      key: "created",
      label: "Created",
      sortable: true,
      type: "text",
      emptyValue: "-",
    },
  ];
}

const CRM_ORDERS_TABLE_COLUMNS = buildOrdersTableColumns();

async function fetchAttachmentsBundle(selectedOrder: any): Promise<{
  orderAttachments: any[];
  relatedDealAttachments: any[];
}> {
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

function normalizeLeadContactPersons(leadData: any) {
  if (!leadData?.contact_persons || typeof leadData.contact_persons !== "string") {
    return leadData;
  }

  try {
    return { ...leadData, contact_persons: JSON.parse(leadData.contact_persons) };
  } catch (error) {
    console.error("Failed to parse contact_persons:", error);
    return { ...leadData, contact_persons: [] };
  }
}

async function fetchOrderDetailsBundle(orderId: number) {
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
      leadData = normalizeLeadContactPersons(lead);
    } catch (error) {
      console.error("Failed to fetch lead:", error);
    }
  }

  return { orderData, dealData, leadData };
}

function resolveExtensionDisplayName(extensions: any[], assignedTo: unknown): string {
  const extensionMatch = extensions.find(
    (ext: any) => ext?.id == assignedTo || ext?.extension == assignedTo,
  );
  if (extensionMatch?.display_name) return extensionMatch.display_name;
  if (extensionMatch?.name) return extensionMatch.name;
  if (typeof assignedTo === "string" || typeof assignedTo === "number") {
    return String(assignedTo);
  }
  return "";
}

function transformOrderDataForTable(order: any, extensions: any[]) {
  const assignedDisplay = resolveExtensionDisplayName(extensions, order?.assigned_to);
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

function computeOrdersAnalyticsData(
  ordersData: any[],
  extensions: any[],
  summaryTiles: any,
  totalOrders: number,
) {
  const transformedOrders = ordersData.map((order) =>
    transformOrderDataForTable(order, extensions),
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

function computeOrdersFilterCounts(
  ordersData: any[],
  extensions: any[],
  stages: any[],
  summaryTiles: any,
  totalOrders: number,
): Record<string, number> {
  const transformed = ordersData.map((order) =>
    transformOrderDataForTable(order, extensions),
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

type OrdersListFetchSetters = {
  setLoading: (v: boolean) => void;
  setOrdersData: (v: any[]) => void;
  setTotalOrders: (v: number) => void;
  setSummaryTiles: (v: any) => void;
};

async function executeCrmOrdersListFetch(
  page: number,
  perPage: number,
  currentFilters: Record<string, any>,
  setters: OrdersListFetchSetters,
): Promise<void> {
  setters.setLoading(true);
  try {
    const params = buildOrdersRequestParams(page, perPage, currentFilters);
    const response: any = await getOrders(params);
    console.log("Raw response from getOrders:", response);
    const ordersArray: any[] = response?.dataList || [];
    const pagination: any = response?.meta || {};
    const summary: any = response?.summary_tiles || null;
    setters.setOrdersData(Array.isArray(ordersArray) ? ordersArray : []);
    setters.setTotalOrders(pagination?.total || 0);
    setters.setSummaryTiles(summary);
  } finally {
    setters.setLoading(false);
  }
}

async function loadCrmOrdersStagesIntoState(setStages: (v: any[]) => void): Promise<void> {
  try {
    const stagesData = await getStages("order");
    setStages(stagesData || []);
  } catch (error) {
    console.error("Failed to fetch stages:", error);
  }
}

async function loadCrmOrdersLostReasonsIntoState(
  setLostReasons: (v: any[]) => void,
): Promise<void> {
  try {
    const lostReasonsData = await (getStages as any)("lost_reason");
    setLostReasons(lostReasonsData || []);
  } catch (error) {
    console.error("Failed to fetch lost reasons:", error);
  }
}

async function loadCrmOrdersExtensionsIntoState(
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

async function executeCrmOrdersAttachmentLoad(
  selectedOrder: any,
  setLoadingAttachments: (v: boolean) => void,
  setAttachments: (v: any[]) => void,
  setDealAttachments: (v: any[]) => void,
): Promise<void> {
  if (!selectedOrder?.id) return;
  setLoadingAttachments(true);
  try {
    const { orderAttachments, relatedDealAttachments } =
      await fetchAttachmentsBundle(selectedOrder);
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

async function executeCrmOrdersAttachmentUpload(
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

async function executeCrmOrdersAttachmentDelete(
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

async function executeCrmOrdersDownloadOrderAttachment(
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

async function executeCrmOrdersDownloadDealAttachment(
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

async function executeCrmOrdersFetchOrderDetailsForView(
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
    const { orderData, dealData, leadData } = await fetchOrderDetailsBundle(orderId);
    setViewingOrder(orderData);
    setRelatedDeal(dealData);
    setRelatedLead(leadData);
  } catch (error) {
    console.error("Failed to fetch order:", error);
  } finally {
    setLoadingOrder(false);
  }
}

async function executeCrmOrdersDeleteOrder(
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

async function executeCrmOrdersRestoreOrder(
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

async function executeCrmOrdersMarkLost(
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

type UseCrmOrdersPlannerLifecycleEffectsInput = Readonly<{
  setStages: React.Dispatch<React.SetStateAction<any[]>>;
  setLostReasons: React.Dispatch<React.SetStateAction<any[]>>;
  setExtensions: React.Dispatch<React.SetStateAction<any[]>>;
  activeFilter: string;
  stages: any[];
  setCurrentFilters: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setOrdersFilters: React.Dispatch<React.SetStateAction<OrdersUiFilters>>;
  router: NextRouter;
  setActiveFilter: React.Dispatch<React.SetStateAction<string>>;
  refreshKey: number;
  currentFilters: Record<string, any>;
  ordersPagination: {
    currentPage: number;
    rowsPerPage: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
  fetchOrders: (page?: number, perPage?: number) => Promise<void>;
  showAttachmentModal: boolean;
  selectedOrderForAttachments: any;
  fetchAttachments: () => Promise<void>;
  setAttachments: React.Dispatch<React.SetStateAction<any[]>>;
  setDealAttachments: React.Dispatch<React.SetStateAction<any[]>>;
}>;

function useCrmOrdersPlannerLifecycleEffects(
  input: UseCrmOrdersPlannerLifecycleEffectsInput,
): void {
  const {
    setStages,
    setLostReasons,
    setExtensions,
    activeFilter,
    stages,
    setCurrentFilters,
    setOrdersFilters,
    router,
    setActiveFilter,
    refreshKey,
    currentFilters,
    ordersPagination,
    fetchOrders,
    showAttachmentModal,
    selectedOrderForAttachments,
    fetchAttachments,
    setAttachments,
    setDealAttachments,
  } = input;

  useEffect(() => {
    Promise.all([
      loadCrmOrdersStagesIntoState(setStages),
      loadCrmOrdersLostReasonsIntoState(setLostReasons),
      loadCrmOrdersExtensionsIntoState(setExtensions, ModuleSlug.CRM_ORDERS),
    ]).catch((error: unknown) => {
      console.error("Failed to load CRM orders bootstrap data:", error);
    });
  }, []);

  useEffect(() => {
    syncOrdersFiltersFromActiveTab({
      activeFilter,
      stages,
      setCurrentFilters,
      setOrdersFilters,
    });
  }, [activeFilter, stages, setCurrentFilters, setOrdersFilters]);

  useEffect(() => {
    syncActiveTabFromRouter({
      routerReady: router.isReady,
      routerTab: router.query.tab,
      stages,
      activeFilter,
      setActiveFilter,
    });
  }, [router, router.isReady, router.query.tab, stages, activeFilter, setActiveFilter]);

  useEffect(() => {
    fetchOrders(ordersPagination.currentPage, ordersPagination.rowsPerPage).catch(
      (error: unknown) => {
        console.error("Failed to fetch orders:", error);
      },
    );
  }, [
    refreshKey,
    currentFilters,
    ordersPagination.currentPage,
    ordersPagination.rowsPerPage,
    fetchOrders,
  ]);

  useEffect(() => {
    if (showAttachmentModal && selectedOrderForAttachments?.id) {
      fetchAttachments().catch((error: unknown) => {
        console.error("Failed to fetch attachments:", error);
      });
      return;
    }
    setAttachments([]);
    setDealAttachments([]);
  }, [
    showAttachmentModal,
    selectedOrderForAttachments?.id,
    fetchAttachments,
    setAttachments,
    setDealAttachments,
  ]);
}

export const CrmOrdersPageContentImpl = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const [stages, setStages] = useState<any[]>([]);
  const [lostReasons, setLostReasons] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [summaryTiles, setSummaryTiles] = useState<any>(null);

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");

  // View Modal
  const [showOrderViewModal, setShowOrderViewModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [relatedDeal, setRelatedDeal] = useState<any>(null);
  const [relatedLead, setRelatedLead] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("tab1");

  // Sidebar states
  const [showOrderSidebar, setShowOrderSidebar] = useState(false);
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);

  // Attachments Modal
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedOrderForAttachments, setSelectedOrderForAttachments] =
    useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [dealAttachments, setDealAttachments] = useState<any[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Delete Attachment Modal
  const [showDeleteAttachmentModal, setShowDeleteAttachmentModal] =
    useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(
    null
  );

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  // Mark Order Lost Modal
  const [showMarkLostModal, setShowMarkLostModal] = useState(false);
  const [orderToMarkLost, setOrderToMarkLost] = useState<any>(null);
  const [lostReasonId, setLostReasonId] = useState<number | null>(null);
  const [lostFeedback, setLostFeedback] = useState("");

  // UI State
  const [showOrdersAnalytics] = useState(false);
  const [showAdvancedFilters] = useState(false);
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [ordersSearch, setOrdersSearch] = useState("");
  const [ordersPagination, setOrdersPagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    sortBy: "",
    sortOrder: "asc" as "asc" | "desc",
  });
  const [ordersFilters, setOrdersFilters] = useState<OrdersUiFilters>(
    DEFAULT_ORDERS_UI_FILTERS,
  );

  // Fetch orders when filters or search change
  const fetchOrders = useCallback(
    async (page = 1, perPage = 15) => {
      await executeCrmOrdersListFetch(page, perPage, currentFilters, {
        setLoading,
        setOrdersData,
        setTotalOrders,
        setSummaryTiles,
      });
    },
    [currentFilters],
  );

  // Handler to update filter and URL
  const handleFilterChange = useCallback((filterId: string) => {
    setActiveFilter(filterId);
    setOrdersPagination((prev) => ({ ...prev, currentPage: 1 }));
    
    // Update URL with tab query parameter
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, tab: filterId }
      },
      undefined,
      { shallow: true }
    );
  }, [router]);

  const fetchAttachments = useCallback(async () => {
    await executeCrmOrdersAttachmentLoad(
      selectedOrderForAttachments,
      setLoadingAttachments,
      setAttachments,
      setDealAttachments,
    );
  }, [selectedOrderForAttachments]);

  useCrmOrdersPlannerLifecycleEffects({
    setStages,
    setLostReasons,
    setExtensions,
    activeFilter,
    stages,
    setCurrentFilters,
    setOrdersFilters,
    router,
    setActiveFilter,
    refreshKey,
    currentFilters,
    ordersPagination,
    fetchOrders,
    showAttachmentModal,
    selectedOrderForAttachments,
    fetchAttachments,
    setAttachments,
    setDealAttachments,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleFileUpload = async (file: File) => {
    await executeCrmOrdersAttachmentUpload(
      selectedOrderForAttachments,
      file,
      fileInputRef,
      fetchAttachments,
      setUploadingFile,
    );
  };

  const handleDeleteAttachment = useCallback(
    async (attachmentId: number) => {
      await executeCrmOrdersAttachmentDelete(
        selectedOrderForAttachments,
        attachmentId,
        fetchAttachments,
      );
    },
    [selectedOrderForAttachments, fetchAttachments],
  );

  const confirmDeleteAttachment = useCallback(async () => {
    if (!attachmentToDelete) return;

    await handleDeleteAttachment(attachmentToDelete.id);
    setShowDeleteAttachmentModal(false);
    setAttachmentToDelete(null);
  }, [attachmentToDelete, handleDeleteAttachment]);

  const handleDownloadAttachment = async (attachmentId: number) => {
    await executeCrmOrdersDownloadOrderAttachment(
      selectedOrderForAttachments,
      attachmentId,
    );
  };

  const handleDownloadDealAttachment = async (attachmentId: number) => {
    await executeCrmOrdersDownloadDealAttachment(
      selectedOrderForAttachments,
      attachmentId,
    );
  };

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters((prev) => {
      const newFilters = { ...prev };
      if ("is_lost" in filters) {
        newFilters.is_lost = filters.is_lost;
      }
      OPTIONAL_STRING_FILTER_KEYS.forEach((key) => {
        if (!(key in filters)) return;
        const shouldStringify =
          key === "stage_id" || key === "assigned_to" || key === "order_value_min" || key === "order_value_max" || key === "order_stage_id";
        setOptionalFilterValue(newFilters, key, filters[key], shouldStringify);
      });
      OPTIONAL_TRUE_FILTER_KEYS.forEach((key) => {
        if (!(key in filters)) return;
        setOptionalFilterValue(newFilters, key, filters[key] ? true : undefined);
      });

      return newFilters;
    });
    setRefreshKey((prev) => prev + 1);
  }, []);

  const applyOrdersUiFilters = useCallback(
    (closeSidebar = false) => {
      const filtersToApply = buildOrdersFiltersToApply(ordersSearch, ordersFilters);
      handleFiltersChange(filtersToApply);
      setOrdersPagination((prev) => ({ ...prev, currentPage: 1 }));
      setRefreshKey((prev) => prev + 1);
      if (closeSidebar) {
        setShowFiltersSidebar(false);
      }
    },
    [ordersSearch, ordersFilters, handleFiltersChange],
  );

  const resetOrdersUiFilters = useCallback(() => {
    setOrdersSearch("");
    setOrdersFilters(DEFAULT_ORDERS_UI_FILTERS);
    handleFiltersChange({});
    setCurrentFilters({});
    setActiveFilter("all");
    setOrdersPagination((prev) => ({ ...prev, currentPage: 1 }));
    setRefreshKey((prev) => prev + 1);
  }, [handleFiltersChange]);

  const handleViewOrder = useCallback(async (orderId: number) => {
    try {
      await executeCrmOrdersFetchOrderDetailsForView(
        orderId,
        setLoadingOrder,
        setViewingOrder,
        setRelatedDeal,
        setRelatedLead,
      );
      setShowOrderViewModal(true);
    } catch (error) {
      console.error("Failed to fetch order:", error);
      toast.error("Failed to load order details");
    }
  }, []);

  const handleDeleteOrder = useCallback(
    (orderId: number, orderNumber?: string) => {
      setOrderToDelete({ id: orderId, orderNumber });
      setShowDeleteModal(true);
    },
    []
  );

  const confirmDeleteOrder = useCallback(async () => {
    await executeCrmOrdersDeleteOrder(
      orderToDelete,
      setShowDeleteModal,
      setOrderToDelete,
      (title, description) => {
        setShowSuccessfulModal(true);
        setSuccessModalTitle(title);
        setSuccessModalDescription(description);
      },
      () => setRefreshKey((oldKey) => oldKey + 1),
    );
  }, [orderToDelete]);

  // Restore Order Handler
  const handleRestoreOrder = useCallback(async (orderId: number) => {
    await executeCrmOrdersRestoreOrder(
      orderId,
      (title, description) => {
        setShowSuccessfulModal(true);
        setSuccessModalTitle(title);
        setSuccessModalDescription(description);
      },
      () => setRefreshKey((oldKey) => oldKey + 1),
    );
  }, []);

  // Mark Order Lost Modal
  const handleMarkLost = useCallback((order: any) => {
    setOrderToMarkLost(order);
    setShowMarkLostModal(true);
  }, []);

  const handleMarkLostSubmit = useCallback(async () => {
    await executeCrmOrdersMarkLost(
      orderToMarkLost,
      lostReasonId,
      lostFeedback,
      () => {
        setShowMarkLostModal(false);
        setOrderToMarkLost(null);
        setLostReasonId(null);
        setLostFeedback("");
      },
      (title, description) => {
        setShowSuccessfulModal(true);
        setSuccessModalTitle(title);
        setSuccessModalDescription(description);
      },
      () => setRefreshKey((oldKey) => oldKey + 1),
    );
  }, [orderToMarkLost, lostReasonId, lostFeedback]);

  // Transform API order data to UI format
  const transformOrderData = useCallback(
    (order: any) => transformOrderDataForTable(order, extensions),
    [extensions],
  );

  // Calculate analytics data
  const analyticsData = useMemo(
    () =>
      computeOrdersAnalyticsData(ordersData, extensions, summaryTiles, totalOrders),
    [ordersData, extensions, summaryTiles, totalOrders],
  );

  // Transform orders data (no client-side filtering - API handles it)
  const filteredOrders = useMemo(() => {
    return ordersData.map(transformOrderData);
  }, [ordersData, extensions]);

  // Calculate filter counts (using summary_tiles if available, otherwise from data)
  const filterCounts = useMemo(
    () =>
      computeOrdersFilterCounts(
        ordersData,
        extensions,
        stages,
        summaryTiles,
        totalOrders,
      ),
    [ordersData, extensions, stages, summaryTiles, totalOrders],
  );

  // Define columns for GenericTable
  const ordersColumns = CRM_ORDERS_TABLE_COLUMNS;

  // Define actions for GenericTable
  const ordersActions: TableAction<any>[] = useMemo(
    () =>
      buildOrdersActions({
        activeFilter,
        canEdit: Boolean(
          session?.user?.permissions?.includes(PERMISSIONS.EDIT_CRM_ORDERS_BILLING),
        ),
        canDelete: Boolean(
          session?.user?.permissions?.includes(PERMISSIONS.DELETE_CRM_ORDERS_BILLING),
        ),
        onViewOrder: async (orderId) => {
          await handleViewOrder(orderId);
        },
        onRestoreOrder: async (orderId) => {
          await handleRestoreOrder(orderId);
        },
        onEditOrder: (row) => {
          setEditingOrderId(getOrderRowId(row));
          setShowEditModal(true);
        },
        onOpenAttachments: (row) => {
          setSelectedOrderForAttachments(row.rawData || row);
          setShowAttachmentModal(true);
        },
        onDeleteOrder: handleDeleteOrder,
        onMarkLost: handleMarkLost,
      }),
    [activeFilter, session, handleViewOrder, handleRestoreOrder, handleDeleteOrder, handleMarkLost],
  );

  if (!session?.user?.permissions?.includes(PERMISSIONS.LIST_CRM_ORDERS_BILLING)) {
    return null;
  }

  return (
    <React.Fragment>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .orders-table-wrapper {
          width: 100%;
          overflow: hidden;
        }
        .orders-table-wrapper .table-responsive {
          width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
        }
        .orders-table-wrapper .table-responsive table {
          width: 100%;
          table-layout: auto;
          margin-bottom: 0;
        }
        .orders-table-wrapper .table-responsive table th,
        .orders-table-wrapper .table-responsive table td {
          padding: 12px 16px;
          vertical-align: middle;
        }
      `,
        }}
      />
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/work-planner/dashboard"
        subTitle="Orders"
      />
      <div>
        {/* Page Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div className="mb-3 mb-md-0">
  <nav aria-label="breadcrumb">
    <ol className="breadcrumb mb-0">
      <li className="breadcrumb-item">
        <a href="/dashboard" className="text-decoration-none">
          Work Planner
        </a>
      </li>
      <li className="breadcrumb-item active fw-bold" aria-current="page">
        Order Management
      </li>
    </ol>
  </nav>
</div>
          <div className="d-flex flex-wrap gap-2">
            <Button
              variant={showFilterBar ? "secondary" : "outline-secondary"}
              onClick={() => setShowFilterBar(!showFilterBar)}
            >
              <Layers size={16} className="me-2" />
              {showFilterBar ? "Hide Tabs" : "Show Tabs"}
            </Button>
            <Button
            variant={showFiltersSidebar ? "secondary" : "outline-secondary"}
            onClick={() => setShowFiltersSidebar(!showFiltersSidebar)}
          >
            <FiFilter size={16} className="me-2" />
            {showFiltersSidebar ? "Hide Filters" : "Show Filters"}
          </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards 
          data={[
            {
              title: 'All Orders',
              value: summaryTiles?.total_orders || totalOrders || 0,
              
            },
            {
              title: 'New',
              value: summaryTiles?.new_orders || analyticsData.stageCounts['New'] || 0,
              
            },
            {
              title: 'Qualified',
              value: summaryTiles?.qualified_orders || analyticsData.stageCounts['Qualified'] || 0,
             
            },
            {
              title: 'Proposal',
              value: analyticsData.stageCounts['Proposal'] || 0,
             
            },
            {
              title: 'Negotiation',
              value: analyticsData.stageCounts['Negotiation'] || 0,
              
            },
            {
              title: 'Lost',
              value: summaryTiles?.lost_orders || filterCounts.lost || 0,
             
            }
            // {
            //   title: 'Deleted',
            //   value: summaryTiles?.deleted_orders || filterCounts.deleted || 0,
            //   icon: Trash2,
            //   iconColor: '#6B7280',
            //   iconBgColor: '#F3F4F6',
            //   metric: {
            //     text: 'Archived',
            //     dotColor: '#9CA3AF'
            //   }
            // }
          ]}
          gridMinWidth="180px"
        />

        {/* Analytics Section - Collapsible */}
        {showOrdersAnalytics && (
          <>
            {/* Summary Stats using KPICard */}
            <Row className="mb-4">
              <Col lg={3} md={6} className="mb-3">
                <KPICard
                  title="Total Orders"
                  value={analyticsData.total.toString()}
                  icon={<ShoppingBag size={24} />}
                  color="primary"
                />
              </Col>
              <Col lg={3} md={6} className="mb-3">
                <KPICard
                  title="Delivered"
                  value={analyticsData.delivered.toString()}
                  icon={<CheckCircle size={24} />}
                  color="success"
                />
              </Col>
              <Col lg={3} md={6} className="mb-3">
                <KPICard
                  title="In Progress"
                  value={analyticsData.inProgress.toString()}
                  icon={<Activity size={24} />}
                  color="info"
                />
              </Col>
              <Col lg={3} md={6} className="mb-3">
                <KPICard
                  title="Total Value"
                  value={`${analyticsData.totalValue.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}`}
                  icon={<DollarSign size={24} />}
                  color="success"
                />
              </Col>
            </Row>

            {/* Analytics Charts */}
            <Row className="mb-4">
              <Col md={6} className="mb-3">
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <h6 className="fw-bold mb-3">Orders by Stage</h6>
                    <CrmOrdersStagePieChart
                      stageCounts={analyticsData.stageCounts}
                    />
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} className="mb-3">
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <h6 className="fw-bold mb-3">
                      Fulfillment Status Distribution
                    </h6>
                    <CrmOrdersFulfillmentBarChart
                      statusCounts={analyticsData.statusCounts}
                    />
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}

        {/* Filter Bar */}
        {showFilterBar && (
          <FilterBar
            quickFilters={[
              {
                id: "all",
                label: "All Orders",
                count: filterCounts.all,
                color: "#0d6efd",
                icon: <ShoppingCart size={16} />,
              },
              ...stages.slice(0, 5).map((stage: any) => ({
                id: stage.id.toString(),
                label: stage.name,
                count: filterCounts[stage.id] || 0,
                color: stage.color || "#6c757d",
                icon: <Layers size={16} />,
              })),
              {
                id: "lost",
                label: "Lost",
                count: filterCounts.lost || 0,
                color: "#fd7e14",
                icon: <X size={16} />,
              },
              {
                id: "deleted",
                label: "Deleted",
                count: filterCounts.deleted || 0,
                color: "#dc3545",
                icon: <Trash2 size={16} />,
              },
            ]}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            // searchValue={ordersSearch}
            
            // onSearch={() => {
            //   if (ordersSearch.trim()) {
            //     handleFiltersChange({ search: ordersSearch.trim() });
            //   } else {
            //     handleFiltersChange({ search: null });
            //   }
            //   setOrdersPagination({ ...ordersPagination, currentPage: 1 });
            // }}
            // searchPlaceholder="Search orders by number, customer, deal..."
            // onSearchChange={(value) => setOrdersSearch(value)}
            // showAdvancedFilters={showAdvancedFilters}
            // onToggleAdvancedFilters={() =>
            //   setShowAdvancedFilters(!showAdvancedFilters)
            // }
            // advancedFilterCount={
            //   (ordersFilters.assignedTo !== null ? 1 : 0) +
            //   (ordersFilters.stage !== null ? 1 : 0) +
            //   (ordersFilters.industry !== null ? 1 : 0) +
            //   (ordersFilters.orderValueMin !== null ||
            //   ordersFilters.orderValueMax !== null
            //     ? 1
            //     : 0) +
            //   (ordersFilters.orderApprovalStatus !== null ? 1 : 0) +
            //   (ordersFilters.fulfillmentStatus !== null ? 1 : 0) +
            //   (ordersFilters.paymentStatus !== null ? 1 : 0) +
            //   (ordersFilters.dateFrom !== null || ordersFilters.dateTo !== null
            //     ? 1
            //     : 0)
            // }
          />
        )}

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row className="g-3 align-items-end">
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">
                    Search
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={ordersSearch}
                    onChange={(e) => setOrdersSearch(e.target.value)}
                    placeholder="Search orders by number, customer, deal..."
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">
                    Assigned To
                  </Form.Label>
                  <Select
                    options={extensions.map((ext: any) => ({
                      value: ext.id || ext.extension,
                      label:
                        ext.display_name || ext.name || ext.id || ext.extension,
                    }))}
                    value={buildAssignedToSelectValue(
                      ordersFilters.assignedTo,
                      extensions,
                    )}
                    onChange={(selected) => {
                      const opt =
                        selected as SingleValue<OrdersDeliverySelectOption>;
                      const assignedToValue = toOptionalSelectString(opt?.value);
                      setOrdersFilters((prev) => ({
                        ...prev,
                        assignedTo: assignedToValue,
                      }));
                      // Reset to all when assigned filter changes
                      setActiveFilter("all");
                    }}
                    placeholder="Select user..."
                    styles={customSelectStyles}
                    isClearable
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">
                    Order Stage
                  </Form.Label>
                  <Select
                    options={stages.map((s) => ({
                      value: s.id.toString(),
                      label: s.name,
                    }))}
                    value={buildStageSelectValue(
                      ordersFilters.stage,
                      stages,
                    )}
                    onChange={(selected) => {
                      const opt =
                        selected as SingleValue<OrdersDeliverySelectOption>;
                      const stageValue = toOptionalSelectString(opt?.value);
                      setOrdersFilters((prev) => ({
                        ...prev,
                        stage: stageValue,
                      }));
                      // Update activeFilter to match selected stage
                      if (stageValue) {
                        setActiveFilter(stageValue);
                      } else {
                        setActiveFilter("all");
                      }
                    }}
                    placeholder="Select stage..."
                    styles={customSelectStyles}
                    isClearable
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">
                    Industry
                  </Form.Label>
                  <Form.Select
                    value={ordersFilters.industry || ""}
                    onChange={(e) => {
                      const value = e.target.value || null;
                      setOrdersFilters((prev) => ({
                        ...prev,
                        industry: value,
                      }));
                    }}
                  >
                    <option value="">Select Industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <option value="Banking & Financial Services">
                      Banking & Financial Services
                    </option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Education">Education</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Telecommunications">
                      Telecommunications
                    </option>
                    <option value="Construction">Construction</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">
                    Order Value Min
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    value={ordersFilters.orderValueMin || ""}
                    onChange={(e) => {
                      const value = e.target.value || null;
                      setOrdersFilters((prev) => ({
                        ...prev,
                        orderValueMin: value,
                      }));
                    }}
                    placeholder="0.00"
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">
                    Order Value Max
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    value={ordersFilters.orderValueMax || ""}
                    onChange={(e) => {
                      const value = e.target.value || null;
                      setOrdersFilters((prev) => ({
                        ...prev,
                        orderValueMax: value,
                      }));
                    }}
                    placeholder="0.00"
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">
                    Order Approval Status
                  </Form.Label>
                  <Form.Select
                    value={ordersFilters.orderApprovalStatus || ""}
                    onChange={(e) => {
                      const value = e.target.value || null;
                      setOrdersFilters((prev) => ({
                        ...prev,
                        orderApprovalStatus: value,
                      }));
                    }}
                  >
                    <option value="">Select Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">
                    Fulfillment Status
                  </Form.Label>
                  <Form.Select
                    value={ordersFilters.fulfillmentStatus || ""}
                    onChange={(e) => {
                      const value = e.target.value || null;
                      setOrdersFilters((prev) => ({
                        ...prev,
                        fulfillmentStatus: value,
                      }));
                    }}
                  >
                    <option value="">Select Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">
                    Payment Status
                  </Form.Label>
                  <Form.Select
                    value={ordersFilters.paymentStatus || ""}
                    onChange={(e) => {
                      const value = e.target.value || null;
                      setOrdersFilters((prev) => ({
                        ...prev,
                        paymentStatus: value,
                      }));
                    }}
                  >
                    <option value="">Select Status</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">
                    Date From
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={ordersFilters.dateFrom || ""}
                    onChange={(e) => {
                      const dateValue = e.target.value || null;
                      setOrdersFilters((prev) => ({
                        ...prev,
                        dateFrom: dateValue,
                      }));
                    }}
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">
                    Date To
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={ordersFilters.dateTo || ""}
                    onChange={(e) => {
                      const dateValue = e.target.value || null;
                      setOrdersFilters((prev) => ({
                        ...prev,
                        dateTo: dateValue,
                      }));
                    }}
                  />
                </Col>
                <Col md={4}>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-secondary"
                      className="d-flex align-items-center justify-content-center"
                      onClick={() => applyOrdersUiFilters(false)}
                    >
                      Submit Filters
                    </Button>
                    <Button
                      variant="outline-secondary"
                      className="d-flex align-items-center justify-content-center"
                      onClick={resetOrdersUiFilters}
                    >
                      Reset
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* Orders Table with GenericTable */}
        <GenericTable
          data={filteredOrders}
          columns={ordersColumns}
          actions={ordersActions}
          customizableColumns={true}
          defaultSelectedColumns={['orderNumber', 'customer', 'deal', 'stage', 'value', 'approvalStatus', 'fulfillmentStatus', 'assignedUser', 'orderDate', 'owner']}
          columnStorageKey="ordersSelectedColumns"
          pagination={{
            currentPage: ordersPagination.currentPage,
            rowsPerPage: ordersPagination.rowsPerPage,
            totalRows: totalOrders,
            pageSizeOptions: [10, 15, 25, 50, 100]
          }}
          onPaginationChange={(page, rowsPerPage) => {
            setOrdersPagination({
              ...ordersPagination,
              currentPage: page,
              rowsPerPage
            });
          }}
          sortable={true}
          onRowClick={async (row) => {
            if (session?.user?.permissions?.includes(PERMISSIONS.LIST_CRM_ORDERS_BILLING)) {
              setShowOrderSidebar(true);
              // Fetch full order details including related deal and lead
              await executeCrmOrdersFetchOrderDetailsForView(
                row.rawData?.id || row.id,
                setLoadingOrder,
                setViewingOrder,
                setRelatedDeal,
                setRelatedLead,
              );
            }
          }}
          loading={loading}
          emptyMessage="No orders found matching your criteria"
          loadingMessage="Loading orders..."
          hover={true}
          uniqueKey="id"
        />
      </div>

      {/* Delete Order Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setOrderToDelete(null);
        }}
        onConfirm={confirmDeleteOrder}
        itemName={orderToDelete?.orderNumber}
        itemType="order"
      />

      <SuccessfulModal
        show={showSuccessfulModal}
        onHide={() => setShowSuccessfulModal(false)}
        title={successModalTitle}
        description={successModalDescription}
      />

      {/* Delete Attachment Modal */}
      <DeleteConfirmationModal
        show={showDeleteAttachmentModal}
        onHide={() => {
          setShowDeleteAttachmentModal(false);
          setAttachmentToDelete(null);
        }}
        onConfirm={confirmDeleteAttachment}
        itemName={attachmentToDelete?.name}
        itemType="attachment"
      />

      <CrmOrdersOrderPageSidebar
        isOpen={showOrderSidebar}
        onClose={() => {
          setShowOrderSidebar(false);
          setViewingOrder(null);
          setRelatedDeal(null);
          setRelatedLead(null);
        }}
        moduleSlug={ModuleSlug.WORK_PLANNER}
        viewingOrder={viewingOrder}
        relatedDeal={relatedDeal}
        relatedLead={relatedLead}
        extensions={extensions}
        showEditAction={Boolean(
          session?.user?.permissions?.includes(
            PERMISSIONS.EDIT_CRM_ORDERS_BILLING,
          ) && activeFilter !== "lost",
        )}
        onEditOrder={() => {
          setShowOrderSidebar(false);
          setEditingOrderId(viewingOrder?.id);
          setShowEditModal(true);
        }}
        onViewOrderDetails={() => {
          setShowOrderSidebar(false);
          handleViewOrder(viewingOrder?.id).catch((error: unknown) => {
            console.error("Failed to open order from sidebar:", error);
          });
        }}
      />

      {/* Filters Sidebar */}
      <GenericFilterSidebar
        isOpen={showFiltersSidebar}
        onClose={() => setShowFiltersSidebar(false)}
        title="Filters"
        subtitle="Filter and refine your orders"
        width="400px"
        filters={[
          {
            id: 'search',
            label: 'Search',
            type: 'text' as const,
            value: ordersSearch,
            onChange: (value) => setOrdersSearch(value),
            placeholder: 'Search orders by number, customer, deal...'
          },
          {
            id: 'assignedTo',
            label: 'Assigned To',
            type: 'select' as const,
            value: buildAssignedToSelectValue(
              ordersFilters.assignedTo,
              extensions,
            ),
            onChange: (selected) => {
              const opt =
                selected as SingleValue<OrdersDeliverySelectOption>;
              const assignedToValue = toOptionalSelectString(opt?.value);
              setOrdersFilters(prev => ({
                ...prev,
                assignedTo: assignedToValue
              }));
              setActiveFilter('all');
            },
            options: extensions.map((ext: any) => ({ 
              value: ext.id || ext.extension, 
              label: ext.display_name || ext.name || ext.id || ext.extension
            })),
            placeholder: 'Select user...',
            isClearable: true,
            styles: customSelectStyles
          },
          {
            id: 'stage',
            label: 'Order Stage',
            type: 'select' as const,
            value: buildStageSelectValue(ordersFilters.stage, stages),
            onChange: (selected) => {
              const opt =
                selected as SingleValue<OrdersDeliverySelectOption>;
              const stageValue = toOptionalSelectString(opt?.value);
              setOrdersFilters(prev => ({
                ...prev,
                stage: stageValue
              }));
              if (stageValue) {
                setActiveFilter(stageValue);
              } else {
                setActiveFilter('all');
              }
            },
            options: stages.map(s => ({ value: s.id.toString(), label: s.name })),
            placeholder: 'Select stage...',
            isClearable: true,
            styles: customSelectStyles
          },
          {
            id: 'industry',
            label: 'Industry',
            type: 'dropdown' as const,
            value: ordersFilters.industry || '',
            onChange: (value) => setOrdersFilters(prev => ({ ...prev, industry: value })),
            options: [
              { value: '', label: 'Select Industry' },
              { value: 'Technology', label: 'Technology' },
              { value: 'Healthcare', label: 'Healthcare' },
              { value: 'Finance', label: 'Finance' },
              { value: 'Banking & Financial Services', label: 'Banking & Financial Services' },
              { value: 'Manufacturing', label: 'Manufacturing' },
              { value: 'Retail', label: 'Retail' },
              { value: 'Education', label: 'Education' },
              { value: 'Real Estate', label: 'Real Estate' },
              { value: 'Telecommunications', label: 'Telecommunications' },
              { value: 'Construction', label: 'Construction' },
              { value: 'Other', label: 'Other' }
            ]
          },
          {
            id: 'orderValueMin',
            label: 'Order Value Min',
            type: 'text' as const,
            value: ordersFilters.orderValueMin || '',
            onChange: (value) => setOrdersFilters(prev => ({ ...prev, orderValueMin: value })),
            placeholder: '0.00'
          },
          {
            id: 'orderValueMax',
            label: 'Order Value Max',
            type: 'text' as const,
            value: ordersFilters.orderValueMax || '',
            onChange: (value) => setOrdersFilters(prev => ({ ...prev, orderValueMax: value })),
            placeholder: '0.00'
          },
          {
            id: 'orderApprovalStatus',
            label: 'Order Approval Status',
            type: 'dropdown' as const,
            value: ordersFilters.orderApprovalStatus || '',
            onChange: (value) => setOrdersFilters(prev => ({ ...prev, orderApprovalStatus: value })),
            options: [
              { value: '', label: 'Select Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' }
            ]
          },
          {
            id: 'fulfillmentStatus',
            label: 'Fulfillment Status',
            type: 'dropdown' as const,
            value: ordersFilters.fulfillmentStatus || '',
            onChange: (value) => setOrdersFilters(prev => ({ ...prev, fulfillmentStatus: value })),
            options: [
              { value: '', label: 'Select Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' }
            ]
          },
          {
            id: 'paymentStatus',
            label: 'Payment Status',
            type: 'dropdown' as const,
            value: ordersFilters.paymentStatus || '',
            onChange: (value) => setOrdersFilters(prev => ({ ...prev, paymentStatus: value })),
            options: [
              { value: '', label: 'Select Status' },
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'partial', label: 'Partial' },
              { value: 'paid', label: 'Paid' },
              { value: 'refunded', label: 'Refunded' }
            ]
          },
          {
            id: 'dateFrom',
            label: 'Date From',
            type: 'date' as const,
            value: ordersFilters.dateFrom || '',
            onChange: (value) => setOrdersFilters(prev => ({ ...prev, dateFrom: value }))
          },
          {
            id: 'dateTo',
            label: 'Date To',
            type: 'date' as const,
            value: ordersFilters.dateTo || '',
            onChange: (value) => setOrdersFilters(prev => ({ ...prev, dateTo: value }))
          }
        ]}
        onApply={() => applyOrdersUiFilters(true)}
        onReset={resetOrdersUiFilters}
        showApplyButton={true}
        showResetButton={true}
      />

      {/* Mark Order Lost Modal */}
      <FormModal
        show={showMarkLostModal}
        onHide={() => setShowMarkLostModal(false)}
        title="Mark order as lost"
        desc="Please fill in the details below to mark the order as lost."
        size="lg"
        formHtml={
          <>
            <Form.Group className="mb-3">
              <Form.Label>Lost Reason *</Form.Label>
              <Form.Select
                value={lostReasonId || ""}
                onChange={(e) =>
                  setLostReasonId(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                required
              >
                <option value="">Select a reason</option>
                {lostReasons.map((reason) => (
                  <option key={reason.id} value={reason.id}>
                    {reason.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Additional Feedback *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={lostFeedback}
                onChange={(e) => setLostFeedback(e.target.value)}
                placeholder="Please provide additional feedback about why this order was lost..."
                required
              />
            </Form.Group>
          </>
        }
        onSubmit={handleMarkLostSubmit}
        onCancel={() => setShowMarkLostModal(false)}
        submitButtonText="Mark Lost Reason"
        cancelButtonText="Cancel"
        isSubmitDisabled={
          lostReasonId == null || lostFeedback.trim().length === 0
        }
      />

    {/* Order View Modal */}
    {renderCrmOrdersOrderViewModal({
      viewingOrder,
      showOrderViewModal,
      setShowOrderViewModal,
      loadingOrder,
      relatedDeal,
      relatedLead,
      extensions,
      activeTab,
      setActiveTab,
      session,
    })}


      {selectedOrderForAttachments != null && (
        <CrmOrdersAttachmentsModal
          show={showAttachmentModal}
          onHide={() => {
            setShowAttachmentModal(false);
            setSelectedOrderForAttachments(null);
          }}
          order={selectedOrderForAttachments}
          attachments={attachments}
          dealAttachments={dealAttachments}
          loadingAttachments={loadingAttachments}
          uploadingFile={uploadingFile}
          fileInputRef={(el) => setFileInputRef(el)}
          onFileChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              handleFileUpload(files[0]).catch((error: unknown) => {
                console.error("Attachment upload failed:", error);
              });
            }
          }}
          formatFileSize={formatFileSize}
          onDownloadOrderAttachment={handleDownloadAttachment}
          onDownloadDealAttachment={handleDownloadDealAttachment}
          onRequestDeleteAttachment={(id, name) => {
            setAttachmentToDelete({ id, name });
            setShowDeleteAttachmentModal(true);
          }}
        />
      )}

    {editingOrderId != null && (
            <OrderEditModal
              show={showEditModal}
              onHide={() => {
                setShowEditModal(false);
                setEditingOrderId(null);
              }}
              orderId={editingOrderId}
              onSuccess={() => {
                setRefreshKey((prev) => prev + 1);
                toast.success("Order updated successfully!");
              }}
            />
      )}
    </React.Fragment>
  );
};
