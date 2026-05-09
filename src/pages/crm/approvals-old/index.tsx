import "@assets/scss/datatable-style.scss";
import { useRouter } from "next/router";
import React, {
  ReactElement,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  getApprovals,
  getApproval,
  deleteApproval,
  approveApproval,
  rejectApproval,
  downloadApprovalPdf,
  getApprovalsByDealOrOrder,
  ApprovalData,
  getDeal,
  getOrder,
  getLead,
  createApproval,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import { ModuleSlug, formatDateForTable } from "@utils/Helper";
import {
  Button,
  Row,
  Col,
  Badge,
  Form,
  Card,
  Table,
  Modal,
} from "react-bootstrap";
import Select from "react-select";
import {
  Eye,
  Trash2,
  CheckCircle,
  X,
  Download,
  FileText,
  User,
  Calendar,
  Handshake,
  Building2,
  Target,
  ClipboardCheck,
  Clock,
  Filter,
} from "lucide-react";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import { crmListPageReactSelectStyles as customSelectStyles } from "@utils/crmListPageReactSelectStyles";

// Filter Bar Component
interface FilterBarProps {
  quickFilters: {
    id: string;
    label: string;
    count: number;
    variant?: string;
    color?: string;
    icon?: React.ReactNode;
  }[];
  activeFilter?: string;
  onFilterChange?: (filterId: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearch?: () => void;
  searchPlaceholder?: string;
  showAdvancedFilters?: boolean;
  onToggleAdvancedFilters?: () => void;
  advancedFilterCount?: number;
}

const FilterBar: React.FC<FilterBarProps> = ({
  quickFilters,
  activeFilter,
  onFilterChange,
  searchValue,
  onSearchChange,
  onSearch,
  searchPlaceholder = "Search...",
  showAdvancedFilters,
  onToggleAdvancedFilters,
  advancedFilterCount = 0,
}) => {
  return (
    <Card className="border-0 shadow-sm mb-3">
      <Card.Body className="p-3">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-stretch align-items-lg-center gap-3">
          <div className="d-flex gap-2 flex-wrap align-items-center flex-grow-1">
            {quickFilters.map((filter) => {
              const isActive = activeFilter === filter.id;
              const hasCustomColor = filter.color;
              const buttonStyle: React.CSSProperties = {};
              if (hasCustomColor) {
                if (isActive) {
                  const bgColor = filter.color;
                  buttonStyle.background = bgColor;
                  buttonStyle.borderColor = bgColor;
                  buttonStyle.color = "#fff";
                } else {
                  buttonStyle.background = "#fff";
                  buttonStyle.borderColor = filter.color;
                  buttonStyle.color = filter.color;
                }
              }

              return (
                <Button
                  key={filter.id}
                  variant={
                    hasCustomColor
                      ? undefined
                      : isActive
                      ? filter.variant || "primary"
                      : "outline-secondary"
                  }
                  onClick={() => onFilterChange && onFilterChange(filter.id)}
                  className="d-flex align-items-center gap-2"
                  style={hasCustomColor ? buttonStyle : undefined}
                >
                  {filter.icon && (
                    <span className="d-flex align-items-center">
                      {filter.icon}
                    </span>
                  )}
                  {filter.label}
                </Button>
              );
            })}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

const CrmApprovals = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const [approvals, setApprovals] = useState<ApprovalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalApprovals, setTotalApprovals] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    sortBy: "",
    sortOrder: "asc" as "asc" | "desc",
  });

  // Filters
  const [filters, setFilters] = useState({
    status: null as string | null,
    type: null as string | null,
    search: "",
  });
  
  // UI State for filters
  const [activeFilter, setActiveFilter] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [approvalsSearch, setApprovalsSearch] = useState("");
  const [approvalsFilters, setApprovalsFilters] = useState({
    status: null as string | null,
    type: null as string | null,
    requestedBy: null as string | null,
    dateFrom: null as string | null,
    dateTo: null as string | null,
  });

  // Modals
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingApproval, setViewingApproval] = useState<ApprovalData | null>(null);
  const [loadingApproval, setLoadingApproval] = useState(false);
  const [viewingDeal, setViewingDeal] = useState<any>(null);
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [relatedLead, setRelatedLead] = useState<any>(null);
  const [relatedDeal, setRelatedDeal] = useState<any>(null);
  const [loadingDeal, setLoadingDeal] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [loadingLead, setLoadingLead] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("general-info");
  const [extensions, setExtensions] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [approvalToDelete, setApprovalToDelete] = useState<ApprovalData | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalToApprove, setApprovalToApprove] = useState<ApprovalData | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalToReject, setApprovalToReject] = useState<ApprovalData | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");

  // Fetch approvals
  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.currentPage,
        per_page: pagination.rowsPerPage,
      };

      if (filters.status) {
        params.status = filters.status;
      }
      if (filters.type) {
        params.type = filters.type;
      }
      if (filters.search) {
        params.search = filters.search;
      }

      const response = await getApprovals(params);
      setApprovals(response.data || []);
      setTotalApprovals(response.total || 0);
    } catch (error) {
      console.error("Failed to fetch approvals:", error);
      setApprovals([]);
      setTotalApprovals(0);
    } finally {
      setLoading(false);
    }
  }, [pagination, filters]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals, refreshKey,]);

  // Fetch extensions on mount
  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_LEADS);
        if (hierarchyData?.extensions) {
          setExtensions(hierarchyData.extensions);
        }
      } catch (error) {
        console.error("Failed to fetch extensions:", error);
      }
    };
    fetchExtensions();
  }, []);

  // Helper function to get extension name - depends on extensions from hierarchy data
  const getExtensionName = useCallback((extensionId: string | number | null | undefined): string => {
    if (!extensionId) return "N/A";
    if (extensions.length === 0) return String(extensionId); // Return ID if extensions not loaded yet
    const extension = extensions.find((ext: any) => 
      ext?.id == extensionId || ext?.extension == extensionId
    );
    return extension?.display_name || extension?.name || String(extensionId);
  }, [extensions]);

  // View approval - fetch deal/order and related approvals
  const handleViewApproval = useCallback(async (id: number) => {
    setLoadingApproval(true);
    setLoadingDeal(false);
    setLoadingOrder(false);
    setLoadingLead(false);
    setViewingDeal(null);
    setViewingOrder(null);
    setRelatedLead(null);
    setRelatedDeal(null);
    setActiveTab("general-info");
    
    try {
      const approval = await getApproval(id);
      setViewingApproval(approval);
      
      // Get item_id and type from approval
      const itemId = approval.item_id || approval.deal_id || approval.order_id;
      const type = approval.type || approval.approval_type;
      
      if (!itemId || !type) {
        toast.error("Cannot load details: Missing item information");
        setShowViewModal(true);
        return;
      }
      
      // Call getApprovalsByDealOrOrder to get related approvals
      try {
        const relatedApprovals = await getApprovalsByDealOrOrder({
          item_id: Number(itemId),
          type: type as 'deal' | 'order'
        });
        console.log('Related approvals:', relatedApprovals);
      } catch (error) {
        console.error("Failed to fetch related approvals:", error);
      }
      
      // Fetch deal or order based on type
      if (type === 'deal' || approval.deal_id) {
        try {
          setLoadingDeal(true);
          setLoadingLead(true);
          const dealData: any = await getDeal(Number(itemId));
          setViewingDeal(dealData);
          
          // Fetch lead information if ticket_id exists
          if (dealData.ticket_id) {
            try {
              const leadData: any = await getLead(Number(dealData.ticket_id));
              if (leadData.contact_persons && typeof leadData.contact_persons === 'string') {
                try {
                  leadData.contact_persons = JSON.parse(leadData.contact_persons);
                } catch (e) {
                  console.error("Failed to parse contact_persons:", e);
                  leadData.contact_persons = [];
                }
              }
              setRelatedLead(leadData);
            } catch (error) {
              console.error("Failed to fetch lead:", error);
            }
          }
        } catch (error) {
          console.error("Failed to fetch deal:", error);
          toast.error("Failed to load deal details");
        } finally {
          setLoadingDeal(false);
          setLoadingLead(false);
        }
      } else if (type === 'order' || approval.order_id) {
        try {
          setLoadingOrder(true);
          setLoadingDeal(true);
          setLoadingLead(true);
          const orderData: any = await getOrder(Number(itemId));
          setViewingOrder(orderData);
          
          // Fetch deal information if deal_id exists
          if (orderData.deal_id) {
            try {
              const dealData: any = await getDeal(Number(orderData.deal_id));
              setRelatedDeal(dealData);
              
              // Fetch lead information if ticket_id exists
              if (dealData.ticket_id) {
                try {
                  const leadData: any = await getLead(Number(dealData.ticket_id));
                  if (leadData.contact_persons && typeof leadData.contact_persons === 'string') {
                    try {
                      leadData.contact_persons = JSON.parse(leadData.contact_persons);
                    } catch (e) {
                      console.error("Failed to parse contact_persons:", e);
                      leadData.contact_persons = [];
                    }
                  }
                  setRelatedLead(leadData);
                } catch (error) {
                  console.error("Failed to fetch lead:", error);
                }
              }
            } catch (error) {
              console.error("Failed to fetch deal:", error);
            } finally {
              setLoadingDeal(false);
              setLoadingLead(false);
            }
          }
        } catch (error) {
          console.error("Failed to fetch order:", error);
          toast.error("Failed to load order details");
        } finally {
          setLoadingOrder(false);
        }
      }
      
      setShowViewModal(true);
    } catch (error) {
      console.error("Failed to fetch approval:", error);
      toast.error("Failed to load approval details");
    } finally {
      setLoadingApproval(false);
    }
  }, []);

  // Handle create approval request
  const handleCreateApprovalRequest = useCallback(async () => {
    if (!viewingApproval) return;
    
    const itemId = viewingApproval.item_id || viewingApproval.deal_id || viewingApproval.order_id;
    const type = viewingApproval.type || viewingApproval.approval_type;
    
    if (!itemId || !type) {
      toast.error("Cannot create approval request: Missing item information");
      return;
    }
    
    try {
      await createApproval({
        item_id: Number(itemId),
        type: type as 'deal' | 'order',
        notes: `Approval request for ${type} #${itemId}`
      });
      toast.success("Approval request created successfully!");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to create approval:", error);
      toast.error("Failed to create approval request");
    }
  }, [viewingApproval]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: totalApprovals || approvals.length,
      pending: approvals.filter((a) => a.status === "pending").length,
      approved: approvals.filter((a) => a.status === "approved").length,
      rejected: approvals.filter((a) => a.status === "rejected").length,
    };
    return counts;
  }, [approvals, totalApprovals]);

  // Handle filter change
  const handleFilterChange = useCallback((filterId: string) => {
    setActiveFilter(filterId);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    
    // Update filters based on active filter
    if (filterId === "all") {
      setFilters((prev) => ({ ...prev, status: null }));
    } else if (filterId === "pending") {
      setFilters((prev) => ({ ...prev, status: "pending" }));
    } else if (filterId === "approved") {
      setFilters((prev) => ({ ...prev, status: "approved" }));
    } else if (filterId === "rejected") {
      setFilters((prev) => ({ ...prev, status: "rejected" }));
    }
    
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Handle advanced filters change
  const handleFiltersChange = useCallback((filtersToApply: Record<string, any>) => {
    const newFilters: any = {};
    
    if (filtersToApply.status) {
      newFilters.status = filtersToApply.status;
    }
    if (filtersToApply.type) {
      newFilters.type = filtersToApply.type;
    }
    if (filtersToApply.requested_by) {
      newFilters.requested_by = filtersToApply.requested_by;
    }
    if (filtersToApply.date_from) {
      newFilters.date_from = filtersToApply.date_from;
    }
    if (filtersToApply.date_to) {
      newFilters.date_to = filtersToApply.date_to;
    }
    if (filtersToApply.search) {
      newFilters.search = filtersToApply.search;
    }
    
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Delete approval
  const handleDeleteApproval = useCallback((approval: ApprovalData) => {
    setApprovalToDelete(approval);
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteApproval = useCallback(async () => {
    if (!approvalToDelete) return;
    try {
      await deleteApproval(approvalToDelete.id);
      setShowDeleteModal(false);
      setApprovalToDelete(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to delete approval:", error);
    }
  }, [approvalToDelete]);

  // Approve approval
  const handleApproveApproval = useCallback((approval: ApprovalData) => {
    setApprovalToApprove(approval);
    setApprovalNotes("");
    setShowApproveModal(true);
  }, []);

  const confirmApproveApproval = useCallback(async () => {
    if (!approvalToApprove) return;
    try {
      await approveApproval(approvalToApprove.id, {
        notes: approvalNotes || undefined,
      });
      setShowApproveModal(false);
      setApprovalToApprove(null);
      setApprovalNotes("");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to approve:", error);
    }
  }, [approvalToApprove, approvalNotes]);

  // Reject approval
  const handleRejectApproval = useCallback((approval: ApprovalData) => {
    setApprovalToReject(approval);
    setRejectionReason("");
    setShowRejectModal(true);
  }, []);

  const confirmRejectApproval = useCallback(async () => {
    if (!approvalToReject || !rejectionReason.trim()) return;
    try {
      await rejectApproval(approvalToReject.id, {
        rejection_reason: rejectionReason,
      });
      setShowRejectModal(false);
      setApprovalToReject(null);
      setRejectionReason("");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to reject:", error);
    }
  }, [approvalToReject, rejectionReason]);

  // Download PDF
  const handleDownloadPdf = useCallback(async (id: number) => {
    try {
      await downloadApprovalPdf(id);
    } catch (error) {
      console.error("Failed to download PDF:", error);
    }
  }, []);

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "warning",
      approved: "success",
      rejected: "danger",
    };
    return (
      <Badge bg={variants[status] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Pagination controls
  const totalPages = Math.ceil(totalApprovals / pagination.rowsPerPage);
  const startRow = (pagination.currentPage - 1) * pagination.rowsPerPage + 1;
  const endRow = Math.min(pagination.currentPage * pagination.rowsPerPage, totalApprovals);

//   if (!session?.user?.permissions?.includes('list-crm-approvals')) {
//     return null;
//   }

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Approvals"
      />
      <div>
        {/* Page Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div className="mb-3 mb-md-0">
            <h2 className="mb-1 fw-bold">Approvals</h2>
            <p className="text-muted mb-0">Manage approval requests</p>
          </div>
          <div className="d-flex gap-2">
            <Button 
              variant={showAdvancedFilters ? "secondary" : "outline-secondary"} 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter size={16} className="me-2" />
              {showAdvancedFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar
          quickFilters={[
            {
              id: "all",
              label: "All Approvals",
              count: filterCounts.all,
              color: "#0d6efd",
              icon: <ClipboardCheck size={16} />,
            },
            {
              id: "pending",
              label: "Pending",
              count: filterCounts.pending,
              color: "#ffc107",
              icon: <Clock size={16} />,
            },
            {
              id: "approved",
              label: "Approved",
              count: filterCounts.approved,
              color: "#28a745",
              icon: <CheckCircle size={16} />,
            },
            {
              id: "rejected",
              label: "Rejected",
              count: filterCounts.rejected,
              color: "#dc3545",
              icon: <X size={16} />,
            },
          ]}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row className="g-3 align-items-end">
                {/* <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">
                    Search
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search approvals..."
                    value={approvalsSearch}
                    onChange={(e) => setApprovalsSearch(e.target.value)}
                  />
                </Col> */}
                {/* <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">Status</Form.Label>
                  <Select
                    options={[
                      { value: "pending", label: "Pending" },
                      { value: "approved", label: "Approved" },
                      { value: "rejected", label: "Rejected" },
                    ]}
                    value={
                      approvalsFilters.status
                        ? {
                            value: approvalsFilters.status,
                            label: approvalsFilters.status.charAt(0).toUpperCase() + approvalsFilters.status.slice(1),
                          }
                        : null
                    }
                    onChange={(selected) => {
                      const statusValue = selected ? selected.value : null;
                      setApprovalsFilters((prev) => ({
                        ...prev,
                        status: statusValue,
                      }));
                    }}
                    placeholder="Select status..."
                    styles={customSelectStyles}
                    isClearable
                  />
                </Col> */}
                <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">Type</Form.Label>
                  <Select
                    options={[
                      { value: "deal", label: "Deal" },
                      { value: "order", label: "Order" },
                    ]}
                    value={
                      approvalsFilters.type
                        ? {
                            value: approvalsFilters.type,
                            label: approvalsFilters.type.charAt(0).toUpperCase() + approvalsFilters.type.slice(1),
                          }
                        : null
                    }
                    onChange={(selected) => {
                      const typeValue = selected ? selected.value : null;
                      setApprovalsFilters((prev) => ({
                        ...prev,
                        type: typeValue,
                      }));
                    }}
                    placeholder="Select type..."
                    styles={customSelectStyles}
                    isClearable
                  />
                </Col>
                {/* <Col md={4}>
                  <Form.Label className="small fw-bold mb-2">
                    Requested By
                  </Form.Label>
                  <Select
                    options={extensions.map((ext: any) => ({
                      value: ext.id || ext.extension,
                      label:
                        ext.display_name || ext.name || ext.id || ext.extension,
                    }))}
                    value={
                      approvalsFilters.requestedBy
                        ? (() => {
                            const requestedById = approvalsFilters.requestedBy;
                            const ext = extensions.find(
                              (e: any) => (e.id || e.extension) === requestedById
                            );
                            return ext
                              ? {
                                  value: requestedById,
                                  label:
                                    ext.display_name ||
                                    ext.name ||
                                    requestedById,
                                }
                              : { value: requestedById, label: requestedById };
                          })()
                        : null
                    }
                    onChange={(selected) => {
                      const requestedByValue = selected ? selected.value : null;
                      setApprovalsFilters((prev) => ({
                        ...prev,
                        requestedBy: requestedByValue,
                      }));
                    }}
                    placeholder="Select user..."
                    styles={customSelectStyles}
                    isClearable
                  />
                </Col>
                <Col md={6}>
                  <Form.Label className="small fw-bold mb-2">
                    Date Range
                  </Form.Label>
                  <div className="d-flex gap-2 align-items-center">
                    <Form.Control
                      type="date"
                      value={approvalsFilters.dateFrom || ""}
                      onChange={(e) => {
                        const dateFromValue = e.target.value || null;
                        setApprovalsFilters((prev) => ({
                          ...prev,
                          dateFrom: dateFromValue,
                        }));
                      }}
                      placeholder="From"
                      style={{ flex: 1 }}
                    />
                    <span className="text-muted">to</span>
                    <Form.Control
                      type="date"
                      value={approvalsFilters.dateTo || ""}
                      onChange={(e) => {
                        const dateToValue = e.target.value || null;
                        setApprovalsFilters((prev) => ({
                          ...prev,
                          dateTo: dateToValue,
                        }));
                      }}
                      placeholder="To"
                      style={{ flex: 1 }}
                    />
                  </div>
                </Col> */}
                <Col md={4}>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-secondary"
                      className="d-flex align-items-center justify-content-center"
                      onClick={() => {
                        const filtersToApply: Record<string, any> = {};
                        
                        if (approvalsSearch) {
                          filtersToApply.search = approvalsSearch;
                        }
                        if (approvalsFilters.status) {
                          filtersToApply.status = approvalsFilters.status;
                        }
                        if (approvalsFilters.type) {
                          filtersToApply.type = approvalsFilters.type;
                        }
                        if (approvalsFilters.requestedBy) {
                          filtersToApply.requested_by = approvalsFilters.requestedBy;
                        }
                        if (approvalsFilters.dateFrom) {
                          filtersToApply.date_from = approvalsFilters.dateFrom;
                        }
                        if (approvalsFilters.dateTo) {
                          filtersToApply.date_to = approvalsFilters.dateTo;
                        }
                        
                        handleFiltersChange(filtersToApply);
                        setPagination({ ...pagination, currentPage: 1 });
                        setRefreshKey((prev) => prev + 1);
                      }}
                    >
                      Submit Filters
                    </Button>
                    <Button
                      variant="outline-secondary"
                      className="d-flex align-items-center justify-content-center"
                      onClick={() => {
                        setApprovalsSearch("");
                        setApprovalsFilters({
                          status: null,
                          type: null,
                          requestedBy: null,
                          dateFrom: null,
                          dateTo: null,
                        });
                        handleFiltersChange({});
                        setFilters({
                          status: null,
                          type: null,
                          search: "",
                        });
                        setActiveFilter("all");
                        setPagination({
                          ...pagination,
                          currentPage: 1,
                        });
                        setRefreshKey((prev) => prev + 1);
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* Approvals Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    
                    <th>Type</th>
                    <th>Item</th>
                    <th>Status</th>
                    <th>Requested By</th>
                    <th>Requested At</th>
                    <th>Approved/Rejected By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4">
                        Loading...
                      </td>
                    </tr>
                  ) : approvals.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-muted">
                        No approvals found
                      </td>
                    </tr>
                  ) : (
                    approvals.map((approval) => (
                      <tr key={approval.id}>
                        
                        <td>
                          <Badge bg="info" className="bg-opacity-10 text-dark">
                            {approval.type || approval.approval_type || "N/A"}
                          </Badge>
                        </td>
                        <td>
                          {approval.item_id ? (
                            <span>
                              {approval.type === 'deal' ? 'Deal' : approval.type === 'order' ? 'Order' : 'Item'} #{approval.item_id}
                            </span>
                          ) : approval.deal_id ? (
                            <span>Deal #{approval.deal_id}</span>
                          ) : approval.order_id ? (
                            <span>Order #{approval.order_id}</span>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td>{getStatusBadge(approval.status)}</td>
                        <td>{getExtensionName(approval.created_by || approval.requested_by)}</td>
                        <td>
                          {approval.created_at
                            ? formatDateForTable(approval.created_at)
                            : approval.requested_at
                            ? formatDateForTable(approval.requested_at)
                            : "N/A"}
                        </td>
                        <td>
                          {approval.status === "approved" && approval.approved_by
                            ? getExtensionName(approval.approved_by)
                            : approval.status === "rejected" && approval.rejected_by
                            ? getExtensionName(approval.rejected_by)
                            : "-"}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="link"
                              size="sm"
                              className="p-1"
                              title="View"
                              onClick={() => handleViewApproval(approval.id)}
                            >
                              <Eye size={16} />
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-1 text-primary"
                              title="Download PDF"
                              onClick={() => handleDownloadPdf(approval.id)}
                            >
                              <Download size={16} />
                            </Button>
                            {approval.status === "pending" && (
                              <>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-1 text-success"
                                  title="Approve"
                                  onClick={() => handleApproveApproval(approval)}
                                >
                                  <CheckCircle size={16} />
                                </Button>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-1 text-danger"
                                  title="Reject"
                                  onClick={() => handleRejectApproval(approval)}
                                >
                                  <X size={16} />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="link"
                              size="sm"
                              className="p-1 text-danger"
                              title="Delete"
                              onClick={() => handleDeleteApproval(approval)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
            <div className="p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-muted small">
                  Showing {startRow} to {endRow} of {totalApprovals} approvals
                </div>
                <div className="d-flex gap-2">
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    disabled={pagination.currentPage === 1}
                    onClick={() =>
                      setPagination({
                        ...pagination,
                        currentPage: pagination.currentPage - 1,
                      })
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    disabled={pagination.currentPage === totalPages}
                    onClick={() =>
                      setPagination({
                        ...pagination,
                        currentPage: pagination.currentPage + 1,
                      })
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* View Modal - Deal/Order View */}
      {viewingApproval && (viewingDeal || viewingOrder) && (
        <Modal
          show={showViewModal}
          onHide={() => {
            setShowViewModal(false);
            setViewingDeal(null);
            setViewingOrder(null);
            setRelatedLead(null);
            setRelatedDeal(null);
          }}
          size="xl"
          centered
        >
          {/* Custom Header */}
          <div style={{
            color: 'black',
            padding: '30px',
            position: 'relative',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <button 
              onClick={() => {
                setShowViewModal(false);
                setViewingDeal(null);
                setViewingOrder(null);
                setRelatedLead(null);
                setRelatedDeal(null);
              }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'black',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                e.currentTarget.style.transform = 'rotate(90deg)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'rotate(0deg)';
              }}
            >
              <X size={20} />
            </button>
            <h3 style={{ margin: 0, fontWeight: 600, fontSize: '24px' }}>
              {viewingDeal ? viewingDeal.name : viewingOrder ? (viewingOrder.order_number || `Order #${viewingOrder.id}`) : 'Details'}
            </h3>
            <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
              {viewingDeal ? 'Deal Details' : viewingOrder ? 'Order Details' : 'Details'}
            </p>
          </div>

          <Modal.Body style={{ padding: '30px' }}>
            {loadingApproval || loadingDeal || loadingOrder ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                <style jsx>{`
                  .lead-detail-filter-buttons {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    margin-bottom: 24px;
                  }

                  .lead-detail-filter-button {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s;
                    border: 1px solid;
                  }

                  .lead-detail-filter-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                  }

                  .lead-detail-filter-button.active {
                    color: white;
                  }

                  .lead-detail-filter-button.active .filter-icon {
                    color: white;
                  }

                  .lead-detail-filter-button:not(.active) .filter-icon {
                    color: inherit;
                  }

                  .filter-icon {
                    width: 18px;
                    height: 18px;
                    flex-shrink: 0;
                  }
                `}</style>
                
                {/* Tabs Navigation */}
                <div className="lead-detail-filter-buttons mb-4">
                  <button
                    className={`lead-detail-filter-button ${activeTab === "general-info" ? 'active' : ''}`}
                    onClick={() => setActiveTab("general-info")}
                    style={{
                      backgroundColor: activeTab === "general-info" ? "#4680ff" : 'white',
                      borderColor: "#4680ff",
                      color: activeTab === "general-info" ? 'white' : "#4680ff"
                    }}
                  >
                    <Handshake className="filter-icon" size={18} />
                    <span>General Information</span>
                  </button>
                  {viewingDeal && relatedLead && (
                    <button
                      className={`lead-detail-filter-button ${activeTab === "campaign-prospect" ? 'active' : ''}`}
                      onClick={() => setActiveTab("campaign-prospect")}
                      style={{
                        backgroundColor: activeTab === "campaign-prospect" ? "#4680ff" : 'white',
                        borderColor: "#4680ff",
                        color: activeTab === "campaign-prospect" ? 'white' : "#4680ff"
                      }}
                    >
                      <FileText className="filter-icon" size={18} />
                      <span>Campaign & Prospect</span>
                    </button>
                  )}
                </div>

                {/* Tab Content */}
                {activeTab === "general-info" && (
                  <div style={{ paddingTop: "20px" }}>
                    {/* Deal View */}
                    {viewingDeal && (
                      <>
                        {/* Deal Information Section */}
                        <div style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#1f2937',
                          marginBottom: '20px',
                          paddingBottom: '10px',
                          borderBottom: '2px solid #f8f9fa',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <Handshake size={18} style={{ color: '#4680ff' }} />
                          Deal Information
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                          gap: '20px',
                          marginBottom: '30px'
                        }}>
                          <div style={{
                            background: '#f8f9fa',
                            padding: '16px',
                            borderRadius: '10px',
                          }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '6px'
                            }}>Deal Name</div>
                            <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                              {viewingDeal.name}
                            </div>
                          </div>
                          <div style={{
                            background: '#f8f9fa',
                            padding: '16px',
                            borderRadius: '10px',
                          }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '6px'
                            }}>Stage</div>
                            <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                              <Badge 
                                bg="primary"
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  backgroundColor: viewingDeal.stage?.color || '#6c757d'
                                }}
                              >
                                {viewingDeal.stage?.name || 'Not assigned'}
                              </Badge>
                            </div>
                          </div>
                          <div style={{
                            background: '#f8f9fa',
                            padding: '16px',
                            borderRadius: '10px',
                          }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '6px'
                            }}>Deal Value</div>
                            <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                              {viewingDeal.currency || 'AED'} {parseFloat(String(viewingDeal.net_value || viewingDeal.grand_total || 0)).toLocaleString()}
                            </div>
                          </div>
                          <div style={{
                            background: '#f8f9fa',
                            padding: '16px',
                            borderRadius: '10px',
                          }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '6px'
                            }}>Probability</div>
                            <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                              {viewingDeal?.stage?.probability || 0}%
                            </div>
                          </div>
                          <div style={{
                            background: '#f8f9fa',
                            padding: '16px',
                            borderRadius: '10px',
                          }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '6px'
                            }}>Assigned To</div>
                            <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                              <User size={14} style={{ color: '#4680ff', marginRight: '6px', display: 'inline' }} />
                              {extensions.find((ext: any) => ext?.id == viewingDeal?.assigned_to || ext?.extension == viewingDeal?.assigned_to)?.display_name || 
                               extensions.find((ext: any) => ext?.id == viewingDeal?.assigned_to || ext?.extension == viewingDeal?.assigned_to)?.name || 
                               viewingDeal.assigned_to || 'Not assigned'}
                            </div>
                          </div>
                          <div style={{
                            background: '#f8f9fa',
                            padding: '16px',
                            borderRadius: '10px',
                          }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '6px'
                            }}>Created Date</div>
                            <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                              <Calendar size={14} style={{ color: '#4680ff', marginRight: '6px', display: 'inline' }} />
                              {viewingDeal.created_at ? formatDateForTable(viewingDeal.created_at) : 'N/A'}
                            </div>
                          </div>
                        </div>

                        {/* Client Information Section */}
                        {viewingDeal.company_name && (
                          <>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: 600,
                              color: '#1f2937',
                              marginTop: '40px',
                              marginBottom: '20px',
                              paddingBottom: '10px',
                              borderBottom: '2px solid #f8f9fa',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}>
                              <Building2 size={18} style={{ color: '#4680ff' }} />
                              Client information
                            </div>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                              gap: '20px',
                              marginBottom: '30px'
                            }}>
                              <div style={{
                                background: '#f8f9fa',
                                padding: '16px',
                                borderRadius: '10px',
                              }}>
                                <div style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: '#6b7280',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  marginBottom: '6px'
                                }}>Client Name</div>
                                <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                                  <Building2 size={14} style={{ color: '#4680ff', marginRight: '6px', display: 'inline' }} />
                                  {viewingDeal.company_name}
                                </div>
                              </div>
                              {viewingDeal.industry && (
                                <div style={{
                                  background: '#f8f9fa',
                                  padding: '16px',
                                  borderRadius: '10px',
                                }}>
                                  <div style={{
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#6b7280',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    marginBottom: '6px'
                                  }}>Industry</div>
                                  <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                                    {viewingDeal.industry}
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {/* Lead Information Section */}
                        {relatedLead && (
                          <>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: 600,
                              color: '#1f2937',
                              marginTop: '40px',
                              marginBottom: '20px',
                              paddingBottom: '10px',
                              borderBottom: '2px solid #f8f9fa',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}>
                              <Target size={18} style={{ color: '#4680ff' }} />
                              Lead Information
                            </div>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                              gap: '20px',
                              marginBottom: '30px'
                            }}>
                              <div style={{
                                background: '#f8f9fa',
                                padding: '16px',
                                borderRadius: '10px',
                              }}>
                                <div style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: '#6b7280',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  marginBottom: '6px'
                                }}>Lead Name</div>
                                <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                                  {relatedLead.name}
                                </div>
                              </div>
                              {relatedLead.lead_potential && (
                                <div style={{
                                  background: '#f8f9fa',
                                  padding: '16px',
                                  borderRadius: '10px',
                                }}>
                                  <div style={{
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#6b7280',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    marginBottom: '6px'
                                  }}>Lead Potential</div>
                                  <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                                    <Badge 
                                      bg={relatedLead.lead_potential === 'Hot' ? 'danger' : relatedLead.lead_potential === 'Warm' ? 'warning' : 'secondary'}
                                      style={{
                                        padding: '6px 14px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: 600
                                      }}
                                    >
                                      {relatedLead.lead_potential || 'N/A'}
                                    </Badge>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {/* Order View */}
                    {viewingOrder && (
                      <>
                        {/* Order Information Section */}
                        <div style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#1f2937',
                          marginBottom: '20px',
                          paddingBottom: '10px',
                          borderBottom: '2px solid #f8f9fa',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <Handshake size={18} style={{ color: '#4680ff' }} />
                          Order Information
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                          gap: '20px',
                          marginBottom: '30px'
                        }}>
                          <div style={{
                            background: '#f8f9fa',
                            padding: '16px',
                            borderRadius: '10px',
                          }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '6px'
                            }}>Order Number</div>
                            <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                              {viewingOrder.order_number || `Order #${viewingOrder.id}`}
                            </div>
                          </div>
                          {viewingOrder.stage && (
                            <div style={{
                              background: '#f8f9fa',
                              padding: '16px',
                              borderRadius: '10px',
                            }}>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#6b7280',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '6px'
                              }}>Stage</div>
                              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                                <Badge 
                                  bg="primary"
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    backgroundColor: viewingOrder.stage?.color || '#6c757d'
                                  }}
                                >
                                  {viewingOrder.stage?.name || 'Not assigned'}
                                </Badge>
                              </div>
                            </div>
                          )}
                          {viewingOrder.grand_total && (
                            <div style={{
                              background: '#f8f9fa',
                              padding: '16px',
                              borderRadius: '10px',
                            }}>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#6b7280',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '6px'
                              }}>Order Value</div>
                              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                                {viewingOrder.currency || 'AED'} {parseFloat(String(viewingOrder.grand_total || 0)).toLocaleString()}
                              </div>
                            </div>
                          )}
                          {viewingOrder.created_at && (
                            <div style={{
                              background: '#f8f9fa',
                              padding: '16px',
                              borderRadius: '10px',
                            }}>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#6b7280',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '6px'
                              }}>Created Date</div>
                              <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                                <Calendar size={14} style={{ color: '#4680ff', marginRight: '6px', display: 'inline' }} />
                                {formatDateForTable(viewingOrder.created_at)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Related Deal Information */}
                        {relatedDeal && (
                          <>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: 600,
                              color: '#1f2937',
                              marginTop: '40px',
                              marginBottom: '20px',
                              paddingBottom: '10px',
                              borderBottom: '2px solid #f8f9fa',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}>
                              <Handshake size={18} style={{ color: '#4680ff' }} />
                              Related Deal Information
                            </div>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                              gap: '20px',
                              marginBottom: '30px'
                            }}>
                              <div style={{
                                background: '#f8f9fa',
                                padding: '16px',
                                borderRadius: '10px',
                              }}>
                                <div style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: '#6b7280',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  marginBottom: '6px'
                                }}>Deal Name</div>
                                <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                                  {relatedDeal.name}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Campaign & Prospect Tab for Deal */}
                {activeTab === "campaign-prospect" && viewingDeal && relatedLead && (
                  <div style={{ paddingTop: "20px" }}>
                    {/* Campaign Information Section */}
                    {relatedLead.campaign && (
                      <>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#1f2937',
                          marginBottom: '20px',
                          paddingBottom: '10px',
                          borderBottom: '2px solid #f8f9fa',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <FileText size={18} style={{ color: '#4680ff' }} />
                          Campaign Information
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                          gap: '20px',
                          marginBottom: '30px'
                        }}>
                          <div style={{
                            background: '#f8f9fa',
                            padding: '16px',
                            borderRadius: '10px',
                          }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '6px'
                            }}>Campaign Name</div>
                            <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500 }}>
                              {relatedLead.campaign.name}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                  paddingTop: '20px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <Button
                    variant="primary"
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: 500,
                      fontSize: '14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onClick={handleCreateApprovalRequest}
                  >
                    <ClipboardCheck size={16} />
                    Create Request
                  </Button>
                  <Button
                    variant="outline-secondary"
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: 500,
                      fontSize: '14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onClick={() => {
                      setShowViewModal(false);
                      setViewingDeal(null);
                      setViewingOrder(null);
                      setRelatedLead(null);
                      setRelatedDeal(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </Modal.Body>
        </Modal>
      )}

      {/* Approve Modal */}
      <Modal
        show={showApproveModal}
        onHide={() => {
          setShowApproveModal(false);
          setApprovalToApprove(null);
          setApprovalNotes("");
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Approve Approval</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Notes (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Add any notes about this approval..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowApproveModal(false);
              setApprovalToApprove(null);
              setApprovalNotes("");
            }}
          >
            Cancel
          </Button>
          <Button variant="success" onClick={confirmApproveApproval}>
            Approve
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reject Modal */}
      <Modal
        show={showRejectModal}
        onHide={() => {
          setShowRejectModal(false);
          setApprovalToReject(null);
          setRejectionReason("");
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Reject Approval</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Rejection Reason *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowRejectModal(false);
              setApprovalToReject(null);
              setRejectionReason("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={confirmRejectApproval}
            disabled={!rejectionReason.trim()}
          >
            Reject
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setApprovalToDelete(null);
        }}
        onConfirm={confirmDeleteApproval}
        itemName={`Approval #${approvalToDelete?.id}`}
        itemType="approval"
      />
    </React.Fragment>
  );
};

CrmApprovals.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmApprovals;
