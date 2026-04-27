import "@crm/orders/orderListPageOrderScss";
import { useRouter } from "next/router";
import React, { useState, useCallback, useMemo } from "react";
import {
  BreadcrumbItem,
  GenericTable,
  GenericFilterSidebar,
  StatsCards,
  OrderEditModal,
  type TableAction,
} from "@crm/orders/orderListOrderPageFrame";
import { FiFilter } from "@crm/orders/orderListFiIcons";
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
import {
  DEFAULT_ORDERS_UI_FILTERS,
  type OrdersDeliverySelectOption,
  type OrdersUiFilters,
  plannerOrdersToOptionalSelectString,
} from "./plannerOrdersList/crmOrdersPlannerListConstants";
import {
  buildPlannerOrdersFiltersPayload,
  mergePlannerOrdersSidebarFilters,
} from "./plannerOrdersList/crmOrdersPlannerListFilters";
import {
  plannerBuildAssignedToSelectValue,
  plannerBuildStageSelectValue,
} from "./plannerOrdersList/crmOrdersPlannerListSelectHelpers";
import {
  plannerComputeOrdersAnalyticsSlice,
  plannerComputeOrdersTabCounts,
  plannerTransformOrderRowForGrid,
} from "./plannerOrdersList/crmOrdersPlannerListRowModel";
import {
  PLANNER_CRM_ORDERS_TABLE_COLUMNS,
  plannerBuildOrdersRowActions,
  plannerGetOrderRowNumericId,
} from "./plannerOrdersList/crmOrdersPlannerListTable";
import {
  plannerExecuteAttachmentDelete,
  plannerExecuteAttachmentLoad,
  plannerExecuteAttachmentUpload,
  plannerExecuteDeleteOrder,
  plannerExecuteDownloadDealAttachment,
  plannerExecuteDownloadOrderAttachment,
  plannerExecuteFetchOrderDetailsForView,
  plannerExecuteMarkOrderLost,
  plannerExecuteOrdersListFetch,
  plannerExecuteRestoreOrder,
} from "./plannerOrdersList/crmOrdersPlannerListCommands";
import { useCrmOrdersPlannerLifecycleEffects } from "./plannerOrdersList/crmOrdersPlannerListLifecycle";
import { ModuleSlug } from "@utils/Helper";

const { PERMISSIONS } = HEADER_CONSTANTS;
