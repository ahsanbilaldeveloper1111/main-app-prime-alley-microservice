import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  getOrders,
  getStages,
  deleteOrder,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import {
  Button,
  Row,
  Col,
  Badge,
  Dropdown,
  Form,
  Card,
  Table,
  InputGroup,
} from "react-bootstrap";
import Select from 'react-select';
import { ModuleSlug } from "@utils/Helper";
import {
  Target,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Plus,
  Eye,
  Edit,
  Trash2,
  ShoppingBag,
  MoreVertical,
  X,
  Users,
  PlusCircle,
  CheckSquare,
  Zap,
  Star,
  Clock,
  Search,
  Filter,
  Layers,
  Calendar,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  DollarSign,
  Activity,
  FileText,
  ShoppingCart,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import Link from "next/link";
import { toast } from "react-toastify";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import ConfirmModal from "@pages/partial/ConfirmModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import { useSession } from "next-auth/react";

// KPI Card Component
interface KPICardData {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const KPICard: React.FC<KPICardData> = ({ title, value, change, isPositive, icon, color, onClick }) => {
  return (
    <Card 
      className={onClick ? 'h-100' : ''} 
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        border: '1px solid #e9ecef'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className={`bg-${color} bg-opacity-10 rounded p-3`}>
            <div className={`text-${color}`}>{icon}</div>
          </div>
          {change && (
            <Badge bg={isPositive ? 'success' : 'danger'} className="bg-opacity-10">
              {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              {change}
            </Badge>
          )}
        </div>
        <h3 className="mb-1">{value}</h3>
        <p className="text-muted mb-0 small">{title}</p>
      </Card.Body>
    </Card>
  );
};

// Filter Bar Component
interface FilterBarProps {
  quickFilters: { id: string; label: string; count: number; variant?: string; color?: string; activeColor?: string; icon?: React.ReactNode }[];
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  searchPlaceholder?: string;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
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
  advancedFilterCount = 0
}) => {
  return (
    <Card className="border-0 shadow-sm mb-3">
      <Card.Body className="p-3">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-stretch align-items-lg-center gap-3">
          <div className="d-flex gap-2 flex-wrap align-items-center flex-grow-1">
            {quickFilters.map(filter => {
              const isActive = activeFilter === filter.id;
              const hasCustomColor = filter.color || filter.activeColor;
              const buttonStyle: React.CSSProperties = {};
              if (hasCustomColor) {
                if (isActive) {
                  const bgColor = filter.activeColor || filter.color;
                  buttonStyle.background = '#fff';
                  buttonStyle.borderColor = bgColor;
                  buttonStyle.color = bgColor;
                } else {
                  buttonStyle.background = '#fff';
                  buttonStyle.borderColor = filter.color;
                  buttonStyle.color = filter.color;
                  buttonStyle.opacity = '0.7';
                }
              }

              return (
                <Button
                  key={filter.id}
                  variant={hasCustomColor ? undefined : (isActive ? (filter.variant || 'primary') : 'outline-secondary')}
                  onClick={() => onFilterChange(filter.id)}
                  className="d-flex align-items-center gap-2"
                  style={hasCustomColor ? buttonStyle : undefined}
                >
                  {filter.icon && <span className="d-flex align-items-center">{filter.icon}</span>}
                  {filter.label}
                  <Badge
                    bg={isActive ? 'light' : 'light'}
                    text={isActive ? 'dark' : 'dark'}
                    className="ms-2"
                  >
                    {filter.count}
                  </Badge>
                </Button>
              );
            })}
          </div>

          <div className="d-flex flex-column flex-sm-row gap-2 align-items-stretch align-items-sm-center flex-shrink-0">
            <InputGroup style={{ width: '300px', minWidth: '200px' }} className="flex-shrink-0">
              <Form.Control
                style={{ height: '41px' }}
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    onSearch();
                  }
                }}
              />
              <Button 
                variant="outline-secondary"
                onClick={onSearch}
              >
                <Search size={16} />
              </Button>
            </InputGroup>
            <Button 
              variant={showAdvancedFilters ? 'primary' : 'outline-secondary'}
              onClick={onToggleAdvancedFilters}
              className="d-flex align-items-center flex-shrink-0"
            >
              <Filter size={16} className="me-2" />
              Filters
              {advancedFilterCount > 0 && (
                <Badge bg="light" text="dark" className="ms-2">
                  {advancedFilterCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

const CrmOrders = () => {
  const { data: session } = useSession();

  const [stages, setStages] = useState<any[]>([]);
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
  const [successModalTitle, setSuccessModalTitle] = useState('');
  const [successModalDescription, setSuccessModalDescription] = useState('');
  
  // UI State
  const [showOrdersAnalytics, setShowOrdersAnalytics] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [ordersSearch, setOrdersSearch] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [selectedOrdersColumns, setSelectedOrdersColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('ordersSelectedColumns');
    return saved ? JSON.parse(saved) : ['orderNumber', 'customer', 'deal', 'stage', 'value', 'approvalStatus', 'fulfillmentStatus', 'orderDate', 'owner'];
  });
  const [ordersPagination, setOrdersPagination] = useState({ currentPage: 1, rowsPerPage: 15, sortColumn: '', sortDirection: 'asc' as 'asc' | 'desc' });
  const [ordersFilters, setOrdersFilters] = useState({
    stage: [] as string[],
    approvalStatus: [] as string[],
    fulfillmentStatus: [] as string[],
    paymentStatus: [] as string[],
    priority: [] as string[],
    owner: [] as string[],
    minValue: '',
    orderDate: ''
  });

  // Fetch stages and extensions on component mount
  useEffect(() => {
    fetchStages();
    fetchExtensions(ModuleSlug.CRM_LEADS);
  }, []);

  // Fetch orders when filters or search change
  const fetchOrders = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      setLoading(true);
      try {
        const params: any = {
          page,
          per_page: perPage,
          ...(currentFilters || {}),
        };

        const searchTerm = currentFilters.search || search || ordersSearch;
        if (searchTerm) {
          params.search = searchTerm;
        }

        if (currentFilters.stage_id) {
          params.stage_id = currentFilters.stage_id;
        }
        if (currentFilters.is_lost !== undefined) {
          params.is_lost = currentFilters.is_lost;
        }

        const response: any = await getOrders(params);
        console.log("Raw response from getOrders:", response);

        const ordersArray: any[] = response?.dataList || [];
        const pagination: any = response?.meta || {};
        const summary: any = response?.summary_tiles || null;
        
        setOrdersData(Array.isArray(ordersArray) ? ordersArray : []);
        setTotalOrders(pagination?.total || 0);
        setSummaryTiles(summary);

        return response;
      } finally {
        setLoading(false);
      }
    },
    [currentFilters, ordersSearch]
  );

  useEffect(() => {
    fetchOrders(ordersPagination.currentPage, ordersPagination.rowsPerPage, ordersSearch);
  }, [refreshKey, currentFilters, ordersPagination.currentPage, ordersPagination.rowsPerPage, fetchOrders]);

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters(filters);
    setRefreshKey((prev) => prev + 1);
  }, []);

  const fetchStages = async () => {
    try {
      const stagesData = await getStages('order');
      setStages(stagesData || []);
    } catch (error) {
      console.error("Failed to fetch stages:", error);
    }
  };

  const fetchExtensions = async (moduleSlug: string = ModuleSlug.CRM_LEADS) => {
    try {
      const hierarchyData = await GetHierarchyData(moduleSlug);
      if (hierarchyData?.extensions) {
        setExtensions(hierarchyData.extensions);
      }
    } catch (error) {
      console.error("Failed to fetch extensions:", error);
    }
  };

  const handleDeleteOrder = useCallback((orderId: number) => {
    setOrderToDelete({ id: orderId });
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteOrder = useCallback(async () => {
    if (!orderToDelete) return;

    try {
      await deleteOrder(orderToDelete.id);
      setShowDeleteModal(false);
      setOrderToDelete(null);
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Order Deleted");
      setSuccessModalDescription("Order has been deleted successfully");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to delete order:", error);
    }
  }, [orderToDelete]);

  // Helper functions
  const handleSort = (column: string, paginationState: any, setPaginationState: (state: any) => void) => {
    const newDirection = paginationState.sortColumn === column && paginationState.sortDirection === 'asc' ? 'desc' : 'asc';
    setPaginationState({ ...paginationState, sortColumn: column, sortDirection: newDirection, currentPage: 1 });
  };

  const sortData = <T extends Record<string, any>>(data: T[], sortColumn: string, sortDirection: 'asc' | 'desc'): T[] => {
    if (!sortColumn) return data;
    
    return [...data].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
      
      if (aVal === undefined) aVal = '';
      if (bVal === undefined) bVal = '';
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const paginateData = <T,>(data: T[], currentPage: number, rowsPerPage: number): T[] => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (dataLength: number, rowsPerPage: number): number => {
    return Math.ceil(dataLength / rowsPerPage);
  };

  const renderPaginationControls = (
    dataLength: number,
    paginationState: any,
    setPaginationState: (state: any) => void,
    label: string
  ) => {
    const totalPages = getTotalPages(dataLength, paginationState.rowsPerPage);
    const { currentPage, rowsPerPage } = paginationState;
    const startRow = (currentPage - 1) * rowsPerPage + 1;
    const endRow = Math.min(currentPage * rowsPerPage, dataLength);

    return (
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">Show</span>
          <Form.Select
            size="sm"
            value={rowsPerPage}
            onChange={(e) => setPaginationState({ ...paginationState, rowsPerPage: Number(e.target.value), currentPage: 1 })}
            style={{ width: 'auto' }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </Form.Select>
          <span className="text-muted small">entries</span>
        </div>
        
        <div className="text-muted small">
          Showing {startRow} to {endRow} of {dataLength} {label}
        </div>

        <div className="d-flex gap-1">
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === 1}
            onClick={() => setPaginationState({ ...paginationState, currentPage: 1 })}
          >
            <ChevronsLeft size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === 1}
            onClick={() => setPaginationState({ ...paginationState, currentPage: currentPage - 1 })}
          >
            <ChevronLeft size={14} />
          </Button>
          
          {[...Array(totalPages)].map((_, index) => {
            const pageNum = index + 1;
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
            ) {
              return (
                <Button
                  key={pageNum}
                  size="sm"
                  variant={currentPage === pageNum ? 'primary' : 'outline-secondary'}
                  onClick={() => setPaginationState({ ...paginationState, currentPage: pageNum })}
                >
                  {pageNum}
                </Button>
              );
            } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
              return <span key={pageNum} className="px-2">...</span>;
            }
            return null;
          })}
          
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() => setPaginationState({ ...paginationState, currentPage: currentPage + 1 })}
          >
            <ChevronRight size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() => setPaginationState({ ...paginationState, currentPage: totalPages })}
          >
            <ChevronsRight size={14} />
          </Button>
        </div>
      </div>
    );
  };

  const renderSortIcon = (column: string, paginationState: any) => {
    if (paginationState.sortColumn !== column) {
      return <ArrowUpDown size={14} className="ms-1 text-muted" />;
    }
    return paginationState.sortDirection === 'asc' ? 
      <ArrowUp size={14} className="ms-1" /> : 
      <ArrowDown size={14} className="ms-1" />;
  };

  // Transform API order data to UI format
  const transformOrderData = (order: any) => {
    return {
      id: order.id,
      orderNumber: order.order_number || '',
      customer: order.customer_name || '',
      customerEmail: order.customer_email || '',
      customerPhone: order.customer_phone || '',
      deal: order.deal?.name || order.deal_id || '',
      dealId: order.deal_id || null,
      stage: order.stage?.name || 'New',
      stageId: order.order_stage_id || null,
      value: order.final_amount || order.total_amount || '0',
      currency: order.currency || 'USD',
      approvalStatus: order.order_approval_status || 'pending',
      fulfillmentStatus: order.fulfillment_status || 'pending',
      paymentStatus: order.payment_status || 'unpaid',
      priority: order.order_priority || '',
      orderDate: order.order_date ? new Date(order.order_date).toLocaleDateString() : '',
      expectedDeliveryDate: order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : '',
      actualDeliveryDate: order.actual_delivery_date ? new Date(order.actual_delivery_date).toLocaleDateString() : '',
      owner: extensions.find((ext: any) => ext?.id == order?.assigned_to || ext?.extension == order?.assigned_to)?.display_name || 
              extensions.find((ext: any) => ext?.id == order?.assigned_to || ext?.extension == order?.assigned_to)?.name || 
              order.assigned_to || '',
      created: order.created_at ? new Date(order.created_at).toLocaleDateString() : '',
      contractType: order.contract_type || '',
      contractLength: order.contract_length || '',
      contractStartDate: order.contract_start_date ? new Date(order.contract_start_date).toLocaleDateString() : '',
      contractEndDate: order.contract_end_date ? new Date(order.contract_end_date).toLocaleDateString() : '',
      billingModel: order.billing_model || '',
      billingStatus: order.billing_status || '',
      paymentTerms: order.payment_terms || '',
      progressDial: order.progress_dial || 0,
      pocName: order.poc_name || order.customer_name || '',
      pocTitle: order.poc_title || '',
      pocPhone: order.poc_phone || '',
      company: order.company || order.deal?.company_name || '',
      industry: order.industry || order.deal?.industry || '',
      status: order.status || 'pending',
      rawData: order // Keep original data for actions
    };
  };

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    const transformedOrders = ordersData.map(transformOrderData);
    
    const total = summaryTiles ? totalOrders : transformedOrders.length;
    const delivered = transformedOrders.filter(o => o.fulfillmentStatus?.toLowerCase().includes('completed') || o.fulfillmentStatus?.toLowerCase().includes('delivered')).length;
    const inProgress = transformedOrders.filter(o => o.fulfillmentStatus?.toLowerCase().includes('progress')).length;
    const pendingApproval = transformedOrders.filter(o => o.approvalStatus?.toLowerCase().includes('pending')).length;
    
    // Calculate total value
    const totalValue = transformedOrders.reduce((sum, o) => {
      const value = parseFloat(String(o.value).replace(/[^0-9.-]/g, '')) || 0;
      return sum + value;
    }, 0);
    
    // Stage distribution
    const stageCounts: Record<string, number> = {};
    transformedOrders.forEach(o => {
      const stage = o.stage || 'New';
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    });
    
    // Status distribution
    const statusCounts: Record<string, number> = {};
    transformedOrders.forEach(o => {
      const status = o.fulfillmentStatus || 'pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return { total, delivered, inProgress, pendingApproval, totalValue, stageCounts, statusCounts };
  }, [ordersData, extensions, summaryTiles, totalOrders]);

  // Filter and transform orders data
  const filteredOrders = useMemo(() => {
    const transformed = ordersData.map(transformOrderData);
    
    return transformed.filter(order => {
      // Quick filters
      if (activeFilter === 'pending-approval') {
        if (!order.approvalStatus?.toLowerCase().includes('pending')) return false;
      } else if (activeFilter === 'in-progress') {
        if (!order.fulfillmentStatus?.toLowerCase().includes('progress')) return false;
      } else if (activeFilter === 'delivered') {
        if (!order.fulfillmentStatus?.toLowerCase().includes('completed') && !order.fulfillmentStatus?.toLowerCase().includes('delivered')) return false;
      } else if (activeFilter === 'high-priority') {
        if (order.priority?.toLowerCase() !== 'high' && order.priority?.toLowerCase() !== 'urgent') return false;
      }

      // Search filter
      const matchesSearch = !ordersSearch || !ordersSearch.trim() ||
        (order.orderNumber && order.orderNumber.toLowerCase().includes(ordersSearch.toLowerCase())) ||
        (order.customer && order.customer.toLowerCase().includes(ordersSearch.toLowerCase())) ||
        (order.deal && order.deal.toLowerCase().includes(ordersSearch.toLowerCase()));

      // Advanced filters
      const matchesStage = ordersFilters.stage.length === 0 || ordersFilters.stage.includes(order.stage);
      const matchesApprovalStatus = ordersFilters.approvalStatus.length === 0 || ordersFilters.approvalStatus.includes(order.approvalStatus);
      const matchesFulfillmentStatus = ordersFilters.fulfillmentStatus.length === 0 || ordersFilters.fulfillmentStatus.includes(order.fulfillmentStatus);
      const matchesPaymentStatus = ordersFilters.paymentStatus.length === 0 || ordersFilters.paymentStatus.includes(order.paymentStatus);
      const matchesPriority = ordersFilters.priority.length === 0 || ordersFilters.priority.includes(order.priority);
      const matchesOwner = ordersFilters.owner.length === 0 || ordersFilters.owner.includes(order.owner);
      const matchesMinValue = !ordersFilters.minValue || parseFloat(String(order.value).replace(/[^0-9.-]/g, '')) >= parseFloat(ordersFilters.minValue);
      const matchesOrderDate = !ordersFilters.orderDate;

      return matchesSearch && matchesStage && matchesApprovalStatus && 
        matchesFulfillmentStatus && matchesPaymentStatus && matchesPriority && 
        matchesOwner && matchesMinValue && matchesOrderDate;
    });
  }, [ordersData, activeFilter, ordersSearch, ordersFilters, extensions]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const transformed = ordersData.map(transformOrderData);
    return {
      all: transformed.length,
      pendingApproval: transformed.filter(o => o.approvalStatus?.toLowerCase().includes('pending')).length,
      inProgress: transformed.filter(o => o.fulfillmentStatus?.toLowerCase().includes('progress')).length,
      delivered: transformed.filter(o => o.fulfillmentStatus?.toLowerCase().includes('completed') || o.fulfillmentStatus?.toLowerCase().includes('delivered')).length,
      highPriority: transformed.filter(o => o.priority?.toLowerCase() === 'high' || o.priority?.toLowerCase() === 'urgent').length
    };
  }, [ordersData, extensions]);

  // Custom select styles
  const customSelectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: '45px',
      fontSize: '0.875rem',
      borderColor: state.isFocused ? '#86b7fe' : '#dee2e6',
      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(13, 110, 253, 0.25)' : 'none',
      '&:hover': {
        borderColor: '#86b7fe'
      }
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: '#0d6efd',
      color: 'white',
      fontSize: '0.813rem'
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: 'white',
      padding: '2px 6px'
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: 'white',
      '&:hover': {
        backgroundColor: '#0b5ed7',
        color: 'white'
      }
    }),
    menu: (provided: any) => ({
      ...provided,
      fontSize: '0.875rem'
    })
  };
 
  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Orders"
      />
      <div>
        {/* Page Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div className="mb-3 mb-md-0">
            <h2 className="mb-1 fw-bold">Orders Management</h2>
            <p className="text-muted mb-0">Track and fulfill customer orders</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button 
              variant={showOrdersAnalytics ? "primary" : "outline-secondary"}
              onClick={() => setShowOrdersAnalytics(!showOrdersAnalytics)}
            >
              <BarChart3 size={16} className="me-2" />
              {showOrdersAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </Button>
            {session?.user?.permissions?.includes('add-crm-orders') && (
              <Link href="/crm/orders/create">
                <Button variant="primary">
                  <Plus size={16} className="me-2" />
                  Add Order
                </Button>
              </Link>
            )}
          </div>
        </div>

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
                  value={`${analyticsData.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
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
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={Object.entries(analyticsData.stageCounts).map(([stage, count]) => ({ name: stage, value: count }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(analyticsData.stageCounts).map(([stage, count], index) => {
                            const colors = ['#0dcaf0', '#0d6efd', '#ffc107', '#fd7e14', '#198754', '#6c757d'];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} className="mb-3">
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <h6 className="fw-bold mb-3">Fulfillment Status Distribution</h6>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={Object.entries(analyticsData.statusCounts).map(([status, count]) => ({ status, count }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="status" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#0d6efd" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}

        {/* Filter Bar */}
        <FilterBar
          quickFilters={[
            {
              id: 'all',
              label: 'All Orders',
              count: filterCounts.all,
              color: '#6c757d',
              activeColor: '#0d6efd',
              icon: <ShoppingCart size={16} />
            },
            {
              id: 'pending-approval',
              label: 'Pending Approval',
              count: filterCounts.pendingApproval,
              color: '#ffc107',
              activeColor: '#0d6efd',
              icon: <AlertTriangle size={16} />
            },
            {
              id: 'in-progress',
              label: 'In Progress',
              count: filterCounts.inProgress,
              color: '#0dcaf0',
              activeColor: '#0d6efd',
              icon: <RefreshCw size={16} />
            },
            {
              id: 'delivered',
              label: 'Delivered',
              count: filterCounts.delivered,
              color: '#198754',
              activeColor: '#0d6efd',
              icon: <CheckCircle size={16} />
            },
            {
              id: 'high-priority',
              label: 'High Priority',
              count: filterCounts.highPriority,
              color: '#dc3545',
              activeColor: '#0d6efd',
              icon: <Star size={16} />
            }
          ]}
          activeFilter={activeFilter}
          onFilterChange={(filterId) => setActiveFilter(filterId)}
          searchValue={ordersSearch}
          onSearchChange={(value) => setOrdersSearch(value)}
          onSearch={() => {
            setOrdersPagination({ ...ordersPagination, currentPage: 1 });
            setRefreshKey(prev => prev + 1);
          }}
          searchPlaceholder="Search orders by number, customer, deal..."
          showAdvancedFilters={showAdvancedFilters}
          onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
          advancedFilterCount={
            ordersFilters.stage.length +
            ordersFilters.approvalStatus.length +
            ordersFilters.fulfillmentStatus.length +
            ordersFilters.paymentStatus.length +
            ordersFilters.priority.length +
            ordersFilters.owner.length +
            (ordersFilters.minValue ? 1 : 0) +
            (ordersFilters.orderDate ? 1 : 0)
          }
        />

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row className="g-3 align-items-end">
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Stage</Form.Label>
                  <Select
                    isMulti
                    options={stages.map(s => ({ value: s.name, label: s.name }))}
                    value={ordersFilters.stage.map(s => ({ value: s, label: s }))}
                    onChange={(selected) => {
                      setOrdersFilters(prev => ({
                        ...prev,
                        stage: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select stages..."
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Approval Status</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: 'pending', label: 'Pending' },
                      { value: 'approved', label: 'Approved' },
                      { value: 'rejected', label: 'Rejected' }
                    ]}
                    value={ordersFilters.approvalStatus.map(s => ({ value: s, label: s }))}
                    onChange={(selected) => {
                      setOrdersFilters(prev => ({
                        ...prev,
                        approvalStatus: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select status..."
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Fulfillment Status</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: 'pending', label: 'Pending' },
                      { value: 'in progress', label: 'In Progress' },
                      { value: 'completed', label: 'Completed' }
                    ]}
                    value={ordersFilters.fulfillmentStatus.map(s => ({ value: s, label: s }))}
                    onChange={(selected) => {
                      setOrdersFilters(prev => ({
                        ...prev,
                        fulfillmentStatus: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select status..."
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Payment Status</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: 'unpaid', label: 'Unpaid' },
                      { value: 'paid', label: 'Paid' },
                      { value: 'partial', label: 'Partial' }
                    ]}
                    value={ordersFilters.paymentStatus.map(s => ({ value: s, label: s }))}
                    onChange={(selected) => {
                      setOrdersFilters(prev => ({
                        ...prev,
                        paymentStatus: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select status..."
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Priority</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: 'high', label: 'High' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'low', label: 'Low' }
                    ]}
                    value={ordersFilters.priority.map(p => ({ value: p, label: p }))}
                    onChange={(selected) => {
                      setOrdersFilters(prev => ({
                        ...prev,
                        priority: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select priority..."
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Owner</Form.Label>
                  <Select
                    isMulti
                    options={extensions.map((ext: any) => ({ 
                      value: ext.display_name || ext.name || ext.id, 
                      label: ext.display_name || ext.name || ext.id 
                    }))}
                    value={ordersFilters.owner.map(o => ({ value: o, label: o }))}
                    onChange={(selected) => {
                      setOrdersFilters(prev => ({
                        ...prev,
                        owner: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select owners..."
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Min Value</Form.Label>
                  <Form.Control 
                    type="number" 
                    size="sm"
                    placeholder="0"
                    value={ordersFilters.minValue}
                    onChange={(e) => setOrdersFilters(prev => ({
                      ...prev,
                      minValue: e.target.value
                    }))}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Order Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    size="sm"
                    value={ordersFilters.orderDate}
                    onChange={(e) => setOrdersFilters(prev => ({
                      ...prev,
                      orderDate: e.target.value
                    }))}
                  />
                </Col>
                <Col md={2}>
                  <div className="d-flex gap-2">
                    <Button
                      variant="primary"
                      className="flex-grow-1 d-flex align-items-center justify-content-center"
                      onClick={() => {
                        setOrdersPagination({ ...ordersPagination, currentPage: 1 });
                      }}
                    >
                      Apply
                    </Button>
                    <Button
                      variant="outline-secondary"
                      className="d-flex align-items-center justify-content-center"
                      onClick={() => {
                        setOrdersFilters({
                          stage: [],
                          approvalStatus: [],
                          fulfillmentStatus: [],
                          paymentStatus: [],
                          priority: [],
                          owner: [],
                          minValue: '',
                          orderDate: ''
                        });
                        setOrdersPagination({ ...ordersPagination, currentPage: 1 });
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

        {/* Bulk Actions and Column Customization */}
        <div className="d-flex justify-content-end gap-2 mb-3">
          {selectedOrders.length > 0 && (
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary" size="sm">
                <CheckSquare size={16} className="me-2" />
                Bulk Actions ({selectedOrders.length})
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item 
                  onClick={() => {
                    if (selectedOrders.length === 1) {
                      toast.info(`Bulk delete for ${selectedOrders.length} order - implement bulk delete handler`);
                    } else {
                      toast.info(`Bulk delete for ${selectedOrders.length} orders - implement bulk delete handler`);
                    }
                  }}
                  className="d-flex align-items-center text-danger"
                >
                  <Trash2 size={14} className="me-2" />
                  Delete Selected ({selectedOrders.length})
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}

          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              <Layers size={16} className="me-2" />
              Customize Table
            </Dropdown.Toggle>
            <Dropdown.Menu align="end" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {[
                { key: 'orderNumber', label: 'Order Number' },
                { key: 'customer', label: 'Customer' },
                { key: 'deal', label: 'Linked Deal' },
                { key: 'stage', label: 'Stage' },
                { key: 'value', label: 'Value' },
                { key: 'approvalStatus', label: 'Approval Status' },
                { key: 'fulfillmentStatus', label: 'Fulfillment Status' },
                { key: 'paymentStatus', label: 'Payment Status' },
                { key: 'priority', label: 'Priority' },
                { key: 'orderDate', label: 'Order Date' },
                { key: 'owner', label: 'Owner' },
                { key: 'created', label: 'Created' }
              ].map((col) => (
                <Dropdown.Item key={col.key} as="div">
                  <Form.Check
                    type="checkbox"
                    label={col.label}
                    checked={selectedOrdersColumns.includes(col.key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrdersColumns([...selectedOrdersColumns, col.key]);
                        localStorage.setItem('ordersSelectedColumns', JSON.stringify([...selectedOrdersColumns, col.key]));
                      } else {
                        const newCols = selectedOrdersColumns.filter(c => c !== col.key);
                        setSelectedOrdersColumns(newCols);
                        localStorage.setItem('ordersSelectedColumns', JSON.stringify(newCols));
                      }
                    }}
                  />
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => {
                const allCols = ['orderNumber', 'customer', 'deal', 'stage', 'value', 'approvalStatus', 'fulfillmentStatus', 'paymentStatus', 'priority', 'orderDate', 'owner', 'created'];
                setSelectedOrdersColumns(allCols);
                localStorage.setItem('ordersSelectedColumns', JSON.stringify(allCols));
              }}>
                Select All
              </Dropdown.Item>
              <Dropdown.Item onClick={() => {
                const defaultCols = ['orderNumber', 'customer', 'deal', 'stage', 'value', 'approvalStatus', 'fulfillmentStatus', 'orderDate', 'owner'];
                setSelectedOrdersColumns(defaultCols);
                localStorage.setItem('ordersSelectedColumns', JSON.stringify(defaultCols));
              }}>
                Reset to Default
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Orders Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th style={{ width: '50px' }}>
                      <Form.Check
                        type="checkbox"
                        checked={filteredOrders.length > 0 && filteredOrders.every(o => selectedOrders.includes(o.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders(filteredOrders.map(o => o.id));
                          } else {
                            setSelectedOrders([]);
                          }
                        }}
                      />
                    </th>
                    {selectedOrdersColumns.includes('orderNumber') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('orderNumber', ordersPagination, setOrdersPagination)}
                      >
                        Order Number {renderSortIcon('orderNumber', ordersPagination)}
                      </th>
                    )}
                    {selectedOrdersColumns.includes('customer') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('customer', ordersPagination, setOrdersPagination)}
                      >
                        Customer {renderSortIcon('customer', ordersPagination)}
                      </th>
                    )}
                    {selectedOrdersColumns.includes('deal') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('deal', ordersPagination, setOrdersPagination)}
                      >
                        Linked Deal {renderSortIcon('deal', ordersPagination)}
                      </th>
                    )}
                    {selectedOrdersColumns.includes('stage') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('stage', ordersPagination, setOrdersPagination)}
                      >
                        Stage {renderSortIcon('stage', ordersPagination)}
                      </th>
                    )}
                    {selectedOrdersColumns.includes('value') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('value', ordersPagination, setOrdersPagination)}
                      >
                        Value {renderSortIcon('value', ordersPagination)}
                      </th>
                    )}
                    {selectedOrdersColumns.includes('approvalStatus') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('approvalStatus', ordersPagination, setOrdersPagination)}
                      >
                        Approval {renderSortIcon('approvalStatus', ordersPagination)}
                      </th>
                    )}
                    {selectedOrdersColumns.includes('fulfillmentStatus') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('fulfillmentStatus', ordersPagination, setOrdersPagination)}
                      >
                        Fulfillment {renderSortIcon('fulfillmentStatus', ordersPagination)}
                      </th>
                    )}
                    {selectedOrdersColumns.includes('paymentStatus') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('paymentStatus', ordersPagination, setOrdersPagination)}
                      >
                        Payment {renderSortIcon('paymentStatus', ordersPagination)}
                      </th>
                    )}
                    {selectedOrdersColumns.includes('priority') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('priority', ordersPagination, setOrdersPagination)}
                      >
                        Priority {renderSortIcon('priority', ordersPagination)}
                      </th>
                    )}
                    {selectedOrdersColumns.includes('orderDate') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('orderDate', ordersPagination, setOrdersPagination)}
                      >
                        Order Date {renderSortIcon('orderDate', ordersPagination)}
                      </th>
                    )}
                    {selectedOrdersColumns.includes('owner') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('owner', ordersPagination, setOrdersPagination)}
                      >
                        Owner {renderSortIcon('owner', ordersPagination)}
                      </th>
                    )}
                    {selectedOrdersColumns.includes('created') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('created', ordersPagination, setOrdersPagination)}
                      >
                        Created {renderSortIcon('created', ordersPagination)}
                      </th>
                    )}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={selectedOrdersColumns.length + 2} className="text-center py-4">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={selectedOrdersColumns.length + 2} className="text-center py-4 text-muted">
                        No orders found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    paginateData(
                      sortData(filteredOrders, ordersPagination.sortColumn, ordersPagination.sortDirection),
                      ordersPagination.currentPage,
                      ordersPagination.rowsPerPage
                    ).map((order) => (
                      <tr key={order.id}>
                        <td>
                          <Form.Check
                            type="checkbox"
                            checked={selectedOrders.includes(order.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOrders([...selectedOrders, order.id]);
                              } else {
                                setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                              }
                            }}
                          />
                        </td>
                        {selectedOrdersColumns.includes('orderNumber') && (
                          <td className="fw-semibold">{order.orderNumber}</td>
                        )}
                        {selectedOrdersColumns.includes('customer') && (
                          <td>
                            <div>
                              <div className="fw-medium">{order.customer || 'No Customer'}</div>
                              {order.customerEmail && <small className="text-muted">{order.customerEmail}</small>}
                            </div>
                          </td>
                        )}
                        {selectedOrdersColumns.includes('deal') && (
                          <td>
                            <div>
                              <div className="fw-medium">{order.deal || 'No Deal'}</div>
                              {order.dealId && (
                                <Link href={`/crm/deals/${order.dealId}/edit`} className="text-decoration-none small">
                                  <Eye size={12} className="me-1" />
                                  View Deal
                                </Link>
                              )}
                            </div>
                          </td>
                        )}
                        {selectedOrdersColumns.includes('stage') && (
                          <td>
                            <Badge 
                              bg="secondary"
                              style={{ 
                                backgroundColor: order.rawData?.stage?.color || '#6c757d',
                                color: '#fff'
                              }}
                            >
                              {order.stage}
                            </Badge>
                          </td>
                        )}
                        {selectedOrdersColumns.includes('value') && (
                          <td className="fw-semibold">{order.currency} {parseFloat(String(order.value)).toLocaleString()}</td>
                        )}
                        {selectedOrdersColumns.includes('approvalStatus') && (
                          <td>
                            <Badge 
                              bg={
                                order.approvalStatus?.toLowerCase() === 'approved' ? 'success' :
                                order.approvalStatus?.toLowerCase() === 'rejected' ? 'danger' :
                                'warning'
                              }
                            >
                              {order.approvalStatus}
                            </Badge>
                          </td>
                        )}
                        {selectedOrdersColumns.includes('fulfillmentStatus') && (
                          <td>
                            <Badge 
                              bg={
                                order.fulfillmentStatus?.toLowerCase().includes('completed') || order.fulfillmentStatus?.toLowerCase().includes('delivered') ? 'success' :
                                order.fulfillmentStatus?.toLowerCase().includes('progress') ? 'primary' :
                                'secondary'
                              }
                            >
                              {order.fulfillmentStatus}
                            </Badge>
                          </td>
                        )}
                        {selectedOrdersColumns.includes('paymentStatus') && (
                          <td>
                            <Badge 
                              bg={
                                order.paymentStatus?.toLowerCase() === 'paid' ? 'success' :
                                order.paymentStatus?.toLowerCase() === 'partial' ? 'warning' :
                                'danger'
                              }
                            >
                              {order.paymentStatus}
                            </Badge>
                          </td>
                        )}
                        {selectedOrdersColumns.includes('priority') && (
                          <td>
                            {order.priority && (
                              <Badge 
                                bg={
                                  order.priority?.toLowerCase() === 'urgent' ? 'danger' :
                                  order.priority?.toLowerCase() === 'high' ? 'warning' :
                                  order.priority?.toLowerCase() === 'medium' ? 'info' :
                                  'secondary'
                                }
                              >
                                {order.priority}
                              </Badge>
                            )}
                          </td>
                        )}
                        {selectedOrdersColumns.includes('orderDate') && (
                          <td>{order.orderDate || '-'}</td>
                        )}
                        {selectedOrdersColumns.includes('owner') && (
                          <td>{order.owner || '-'}</td>
                        )}
                        {selectedOrdersColumns.includes('created') && (
                          <td>{order.created || '-'}</td>
                        )}
                        <td>
                          <div className="d-flex gap-1">
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="p-1" 
                                title="Edit"
                                onClick={() => window.location.href = `/crm/orders/${order.rawData?.id || order.id}/edit`}
                              >
                                <Edit size={16} />
                              </Button>
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="p-1 text-danger" 
                                title="Delete"
                                onClick={() => handleDeleteOrder(order.rawData?.id || order.id)}
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
              {renderPaginationControls(filteredOrders.length, ordersPagination, setOrdersPagination, 'orders')}
            </div>
          </Card.Body>
        </Card>
      </div>

      <ConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        title="Delete Order"
        description="Are you sure you want to delete this order?"
        onConfirm={() => confirmDeleteOrder()}
        targetName=""
        confirmButtonText="Delete"
        confirmButtonVariant="danger"
        cancelButtonVariant="secondary"
        onCancel={() => setShowDeleteModal(false)}
      />

      <SuccessfulModal
        show={showSuccessfulModal}
        onHide={() => setShowSuccessfulModal(false)}
        title={successModalTitle}
        description={successModalDescription}
      />
    </React.Fragment>
  );
};

CrmOrders.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmOrders;

