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
  Form,
  Card,
} from "@crm/orders/orderListBootstrap";
import Select, { type SingleValue } from "@components/AppSelect";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { ModuleSlug } from "@utils/Helper";
import {
  CheckCircle,
  Trash2,
  ShoppingBag,
  X,
  Layers,
  DollarSign,
  Activity,
  ShoppingCart,
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
  PLANNER_CRM_ORDERS_TABLE_COLUMNS,
  plannerBuildOrdersRowActions,
  plannerGetOrderRowNumericId,
} from "./plannerOrdersList/crmOrdersPlannerListTable";
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
import { useCrmOrdersPlannerLifecycleEffects } from "./plannerOrdersList/crmOrdersPlannerListLifecycle";
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

const { PERMISSIONS } = HEADER_CONSTANTS;

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
      await plannerExecuteOrdersListFetch(
        page,
        perPage,
        currentFilters as Record<string, unknown>,
        {
          sortBy: ordersPagination.sortBy,
          sortOrder: ordersPagination.sortOrder,
        },
        {
          setLoading,
          setOrdersData,
          setTotalOrders,
          setSummaryTiles,
        },
      );
    },
    [currentFilters, ordersPagination.sortBy, ordersPagination.sortOrder],
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
    await plannerExecuteAttachmentLoad(
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
    await plannerExecuteAttachmentUpload(
      selectedOrderForAttachments,
      file,
      fileInputRef,
      fetchAttachments,
      setUploadingFile,
    );
  };

  const handleDeleteAttachment = useCallback(
    async (attachmentId: number) => {
      await plannerExecuteAttachmentDelete(
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
    await plannerExecuteDownloadOrderAttachment(
      selectedOrderForAttachments,
      attachmentId,
    );
  };

  const handleDownloadDealAttachment = async (attachmentId: number) => {
    await plannerExecuteDownloadDealAttachment(
      selectedOrderForAttachments,
      attachmentId,
    );
  };

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters((prev) =>
      mergePlannerOrdersSidebarFilters(prev, filters) as Record<string, any>,
    );
    setRefreshKey((prev) => prev + 1);
  }, []);

  const applyOrdersUiFilters = useCallback(
    (closeSidebar = false) => {
      const filtersToApply = buildPlannerOrdersFiltersPayload(ordersSearch, ordersFilters);
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
      await plannerExecuteFetchOrderDetailsForView(
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
    await plannerExecuteDeleteOrder(
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
    await plannerExecuteRestoreOrder(
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
    await plannerExecuteMarkOrderLost(
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
    (order: any) => plannerTransformOrderRowForGrid(order, extensions),
    [extensions],
  );

  // Calculate analytics data
  const analyticsData = useMemo(
    () =>
      plannerComputeOrdersAnalyticsSlice(ordersData, extensions, summaryTiles, totalOrders),
    [ordersData, extensions, summaryTiles, totalOrders],
  );

  // Transform orders data (no client-side filtering - API handles it)
  const filteredOrders = useMemo(() => {
    return ordersData.map(transformOrderData);
  }, [ordersData, transformOrderData]);

  // Calculate filter counts (using summary_tiles if available, otherwise from data)
  const filterCounts = useMemo(
    () =>
      plannerComputeOrdersTabCounts(
        ordersData,
        extensions,
        stages,
        summaryTiles,
        totalOrders,
      ),
    [ordersData, extensions, stages, summaryTiles, totalOrders],
  );

  // Define columns for GenericTable
  const ordersColumns = PLANNER_CRM_ORDERS_TABLE_COLUMNS;

  // Define actions for GenericTable
  const ordersActions: TableAction<any>[] = useMemo(
    () =>
      plannerBuildOrdersRowActions({
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
          setEditingOrderId(plannerGetOrderRowNumericId(row));
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
              await plannerExecuteFetchOrderDetailsForView(
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
            value: plannerBuildAssignedToSelectValue(
              ordersFilters.assignedTo,
              extensions,
            ),
            onChange: (selected) => {
              const opt =
                selected as SingleValue<OrdersDeliverySelectOption>;
              const assignedToValue = plannerOrdersToOptionalSelectString(opt?.value);
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
            value: plannerBuildStageSelectValue(ordersFilters.stage, stages),
            onChange: (selected) => {
              const opt =
                selected as SingleValue<OrdersDeliverySelectOption>;
              const stageValue = plannerOrdersToOptionalSelectString(opt?.value);
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
