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
  getDeals,
  getStages,
  deleteDeal,
  getDeal,
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
  Handshake,
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
  ShoppingBag,
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

const CrmDeals = () => {
  const { data: session } = useSession();

  const [stages, setStages] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const [dealsData, setDealsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalDeals, setTotalDeals] = useState(0);
  const [summaryTiles, setSummaryTiles] = useState<any>(null);
  
  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<any>(null);
  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState('');
  const [successModalDescription, setSuccessModalDescription] = useState('');
  
  // UI State
  const [showDealsAnalytics, setShowDealsAnalytics] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [dealsSearch, setDealsSearch] = useState('');
  const [selectedDeals, setSelectedDeals] = useState<number[]>([]);
  const [selectedDealsColumns, setSelectedDealsColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('dealsSelectedColumns');
    return saved ? JSON.parse(saved) : ['name', 'company', 'stage', 'dealType', 'value', 'probability', 'closeDate', 'owner'];
  });
  const [dealsPagination, setDealsPagination] = useState({ currentPage: 1, rowsPerPage: 15, sortColumn: '', sortDirection: 'asc' as 'asc' | 'desc' });
  const [dealsFilters, setDealsFilters] = useState({
    stage: [] as string[],
    dealType: [] as string[],
    owner: [] as string[],
    industry: [] as string[],
    riskLevel: [] as string[],
    minValue: '',
    closeDate: ''
  });

  // Fetch stages and extensions on component mount
  useEffect(() => {
    fetchStages();
    fetchExtensions(ModuleSlug.CRM_LEADS);
  }, []);

  // Fetch deals when filters or search change
  const fetchDeals = useCallback(
    async (page = 1, perPage = 15, search = "") => {
      setLoading(true);
      try {
        const params: any = {
          page,
          per_page: perPage,
          ...(currentFilters || {}),
        };

        const searchTerm = currentFilters.search || search || dealsSearch;
        if (searchTerm) {
          params.search = searchTerm;
        }

        if (currentFilters.stage_id) {
          params.stage_id = currentFilters.stage_id;
        }
        if (currentFilters.is_lost !== undefined) {
          params.is_lost = currentFilters.is_lost;
        }

        const response: any = await getDeals(params);
        console.log("Raw response from getDeals:", response);

        const dealsArray: any[] = response?.dataList || [];
        const pagination: any = response?.meta || {};
        const summary: any = response?.summary_tiles || null;
        
        setDealsData(Array.isArray(dealsArray) ? dealsArray : []);
        setTotalDeals(pagination?.total || 0);
        setSummaryTiles(summary);

        return response;
      } finally {
        setLoading(false);
      }
    },
    [currentFilters, dealsSearch]
  );

  useEffect(() => {
    fetchDeals(dealsPagination.currentPage, dealsPagination.rowsPerPage, dealsSearch);
  }, [refreshKey, currentFilters, dealsPagination.currentPage, dealsPagination.rowsPerPage, fetchDeals]);

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters(filters);
    setRefreshKey((prev) => prev + 1);
  }, []);

  const fetchStages = async () => {
    try {
      const stagesData = await getStages('deal');
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

  const handleDeleteDeal = useCallback((dealId: number) => {
    setDealToDelete({ id: dealId });
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteDeal = useCallback(async () => {
    if (!dealToDelete) return;

    try {
      await deleteDeal(dealToDelete.id);
      setShowDeleteModal(false);
      setDealToDelete(null);
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Deal Deleted");
      setSuccessModalDescription("Deal has been deleted successfully");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to delete deal:", error);
    }
  }, [dealToDelete]);

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

  // Transform API deal data to UI format
  const transformDealData = (deal: any) => {
    return {
      id: deal.id,
      name: deal.name || '',
      company: deal.company_name || '',
      industry: deal.industry || '',
      stage: deal.stage?.name || 'New',
      dealType: deal.deal_type || '',
      value: deal.net_value || deal.grand_total || '0',
      currency: deal.currency || 'USD',
      probability: deal.probability || 0,
      closeDate: deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : '',
      owner: extensions.find((ext: any) => ext?.id == deal?.assigned_to || ext?.extension == deal?.assigned_to)?.display_name || 
              extensions.find((ext: any) => ext?.id == deal?.assigned_to || ext?.extension == deal?.assigned_to)?.name || 
              deal.assigned_to || '',
      created: deal.created_at ? new Date(deal.created_at).toLocaleDateString() : '',
      riskLevel: deal.risk_level || '',
      negotiationBar: deal.negotiation_bar || 0,
      quotationSent: deal.quotation_sent || false,
      contractSent: deal.contract_sent || false,
      isLost: deal.is_lost || false,
      rawData: deal // Keep original data for actions
    };
  };

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    const transformedDeals = dealsData.map(transformDealData);
    
    const total = summaryTiles ? totalDeals : transformedDeals.length;
    const won = transformedDeals.filter(d => d.stage?.toLowerCase().includes('won') || d.rawData?.stage?.is_won).length;
    const inNegotiation = transformedDeals.filter(d => d.stage?.toLowerCase().includes('negotiation')).length;
    
    // Calculate total value
    const totalValue = transformedDeals.reduce((sum, d) => {
      const value = parseFloat(String(d.value).replace(/[^0-9.-]/g, '')) || 0;
      return sum + value;
    }, 0);
    
    // Stage distribution
    const stageCounts: Record<string, number> = {};
    transformedDeals.forEach(d => {
      const stage = d.stage || 'New';
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    });
    
    // Deal type distribution
    const dealTypeCounts: Record<string, number> = {};
    transformedDeals.forEach(d => {
      const type = d.dealType || 'new_sale';
      dealTypeCounts[type] = (dealTypeCounts[type] || 0) + 1;
    });

    return { total, won, inNegotiation, totalValue, stageCounts, dealTypeCounts };
  }, [dealsData, extensions, summaryTiles, totalDeals]);

  // Filter and transform deals data
  const filteredDeals = useMemo(() => {
    const transformed = dealsData.map(transformDealData);
    
    return transformed.filter(deal => {
      // Quick filters
      if (activeFilter === 'negotiation') {
        if (!deal.stage?.toLowerCase().includes('negotiation')) return false;
      } else if (activeFilter === 'proposal') {
        if (!deal.stage?.toLowerCase().includes('proposal')) return false;
      } else if (activeFilter === 'high-value') {
        const value = parseFloat(String(deal.value).replace(/[^0-9.-]/g, '')) || 0;
        if (value <= 50000) return false;
      } else if (activeFilter === 'closing-soon') {
        const closeDate = deal.rawData?.expected_close_date;
        if (!closeDate) return false;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const dealCloseDate = new Date(closeDate);
        if (dealCloseDate.getMonth() !== currentMonth || dealCloseDate.getFullYear() !== currentYear) return false;
      } else if (activeFilter === 'won') {
        if (!deal.stage?.toLowerCase().includes('won') && !deal.rawData?.stage?.is_won) return false;
      }

      // Search filter
      const matchesSearch = !dealsSearch || !dealsSearch.trim() ||
        (deal.name && deal.name.toLowerCase().includes(dealsSearch.toLowerCase())) ||
        (deal.company && deal.company.toLowerCase().includes(dealsSearch.toLowerCase()));

      // Advanced filters
      const matchesStage = dealsFilters.stage.length === 0 || dealsFilters.stage.includes(deal.stage);
      const matchesDealType = dealsFilters.dealType.length === 0 || dealsFilters.dealType.includes(deal.dealType);
      const matchesOwner = dealsFilters.owner.length === 0 || dealsFilters.owner.includes(deal.owner);
      const matchesIndustry = dealsFilters.industry.length === 0 || dealsFilters.industry.includes(deal.industry);
      const matchesRiskLevel = dealsFilters.riskLevel.length === 0 || dealsFilters.riskLevel.includes(deal.riskLevel);
      const matchesMinValue = !dealsFilters.minValue || parseFloat(String(deal.value).replace(/[^0-9.-]/g, '')) >= parseFloat(dealsFilters.minValue);
      const matchesCloseDate = !dealsFilters.closeDate;

      return matchesSearch && matchesStage && matchesDealType && 
        matchesOwner && matchesIndustry && matchesRiskLevel && 
        matchesMinValue && matchesCloseDate;
    });
  }, [dealsData, activeFilter, dealsSearch, dealsFilters, extensions]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const transformed = dealsData.map(transformDealData);
    return {
      all: transformed.length,
      negotiation: transformed.filter(d => d.stage?.toLowerCase().includes('negotiation')).length,
      proposal: transformed.filter(d => d.stage?.toLowerCase().includes('proposal')).length,
      highValue: transformed.filter(d => {
        const value = parseFloat(String(d.value).replace(/[^0-9.-]/g, '')) || 0;
        return value > 50000;
      }).length,
      closingSoon: transformed.filter(d => {
        const closeDate = d.rawData?.expected_close_date;
        if (!closeDate) return false;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const dealCloseDate = new Date(closeDate);
        return dealCloseDate.getMonth() === currentMonth && dealCloseDate.getFullYear() === currentYear;
      }).length,
      won: transformed.filter(d => d.stage?.toLowerCase().includes('won') || d.rawData?.stage?.is_won).length
    };
  }, [dealsData, extensions]);

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
        subTitle="Deals"
      />
      <div>
        {/* Page Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div className="mb-3 mb-md-0">
            <h2 className="mb-1 fw-bold">Deals & Opportunities</h2>
            <p className="text-muted mb-0">Manage your sales pipeline and deals</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button 
              variant={showDealsAnalytics ? "primary" : "outline-secondary"}
              onClick={() => setShowDealsAnalytics(!showDealsAnalytics)}
            >
              <BarChart3 size={16} className="me-2" />
              {showDealsAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </Button>
            {session?.user?.permissions?.includes('add-crm-deals') && (
              <Link href="/crm/deals/create">
                <Button variant="primary">
                  <Plus size={16} className="me-2" />
                  Add Deal
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Analytics Section - Collapsible */}
        {showDealsAnalytics && (
          <>
            {/* Summary Stats using KPICard */}
            <Row className="mb-4">
              <Col lg={3} md={6} className="mb-3">
                <KPICard 
                  title="Total Deals"
                  value={analyticsData.total.toString()}
                  icon={<Handshake size={24} />}
                  color="primary"
                />
              </Col>
              <Col lg={3} md={6} className="mb-3">
                <KPICard 
                  title="Won Deals"
                  value={analyticsData.won.toString()}
                  icon={<CheckCircle size={24} />}
                  color="success"
                />
              </Col>
              <Col lg={3} md={6} className="mb-3">
                <KPICard 
                  title="In Negotiation"
                  value={analyticsData.inNegotiation.toString()}
                  icon={<Activity size={24} />}
                  color="warning"
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
                    <h6 className="fw-bold mb-3">Deals by Stage</h6>
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
                    <h6 className="fw-bold mb-3">Deal Type Distribution</h6>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={Object.entries(analyticsData.dealTypeCounts).map(([type, count]) => ({ type, count }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
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
              label: 'All Deals',
              count: filterCounts.all,
              color: '#6c757d',
              activeColor: '#0d6efd',
              icon: <Users size={16} />
            },
            {
              id: 'negotiation',
              label: 'Negotiation',
              count: filterCounts.negotiation,
              color: '#0dcaf0',
              activeColor: '#0d6efd',
              icon: <DollarSign size={16} />
            },
            {
              id: 'proposal',
              label: 'Proposal',
              count: filterCounts.proposal,
              color: '#0d6efd',
              activeColor: '#0d6efd',
              icon: <FileText size={16} />
            },
            {
              id: 'high-value',
              label: 'High Value (>£50k)',
              count: filterCounts.highValue,
              color: '#198754',
              activeColor: '#0d6efd',
              icon: <Star size={16} />
            },
            {
              id: 'closing-soon',
              label: 'Closing This Month',
              count: filterCounts.closingSoon,
              color: '#ffc107',
              activeColor: '#0d6efd',
              icon: <Calendar size={16} />
            },
            {
              id: 'won',
              label: 'Won',
              count: filterCounts.won,
              color: '#198754',
              activeColor: '#0d6efd',
              icon: <CheckCircle size={16} />
            }
          ]}
          activeFilter={activeFilter}
          onFilterChange={(filterId) => setActiveFilter(filterId)}
          searchValue={dealsSearch}
          onSearchChange={(value) => setDealsSearch(value)}
          onSearch={() => {
            setDealsPagination({ ...dealsPagination, currentPage: 1 });
            setRefreshKey(prev => prev + 1);
          }}
          searchPlaceholder="Search deals by name, company..."
          showAdvancedFilters={showAdvancedFilters}
          onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
          advancedFilterCount={
            dealsFilters.stage.length +
            dealsFilters.dealType.length +
            dealsFilters.owner.length +
            dealsFilters.industry.length +
            dealsFilters.riskLevel.length +
            (dealsFilters.minValue ? 1 : 0) +
            (dealsFilters.closeDate ? 1 : 0)
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
                    value={dealsFilters.stage.map(s => ({ value: s, label: s }))}
                    onChange={(selected) => {
                      setDealsFilters(prev => ({
                        ...prev,
                        stage: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select stages..."
                    styles={customSelectStyles}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Deal Type</Form.Label>
                  <Select
                    isMulti
                    options={[
                      { value: 'new_sale', label: 'New Sale' },
                      { value: 'renewal', label: 'Renewal' },
                      { value: 'migration', label: 'Migration' },
                      { value: 'upsell', label: 'Upsell' }
                    ]}
                    value={dealsFilters.dealType.map(t => ({ value: t, label: t }))}
                    onChange={(selected) => {
                      setDealsFilters(prev => ({
                        ...prev,
                        dealType: selected ? selected.map(s => s.value) : []
                      }));
                    }}
                    placeholder="Select types..."
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
                    value={dealsFilters.owner.map(o => ({ value: o, label: o }))}
                    onChange={(selected) => {
                      setDealsFilters(prev => ({
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
                    value={dealsFilters.minValue}
                    onChange={(e) => setDealsFilters(prev => ({
                      ...prev,
                      minValue: e.target.value
                    }))}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">Close Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    size="sm"
                    value={dealsFilters.closeDate}
                    onChange={(e) => setDealsFilters(prev => ({
                      ...prev,
                      closeDate: e.target.value
                    }))}
                  />
                </Col>
                <Col md={2}>
                  <div className="d-flex gap-2">
                    <Button
                      variant="primary"
                      className="flex-grow-1 d-flex align-items-center justify-content-center"
                      onClick={() => {
                        setDealsPagination({ ...dealsPagination, currentPage: 1 });
                      }}
                    >
                      Apply
                    </Button>
                    <Button
                      variant="outline-secondary"
                      className="d-flex align-items-center justify-content-center"
                      onClick={() => {
                        setDealsFilters({
                          stage: [],
                          dealType: [],
                          owner: [],
                          industry: [],
                          riskLevel: [],
                          minValue: '',
                          closeDate: ''
                        });
                        setDealsPagination({ ...dealsPagination, currentPage: 1 });
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
          {selectedDeals.length > 0 && (
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary" size="sm">
                <CheckSquare size={16} className="me-2" />
                Bulk Actions ({selectedDeals.length})
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item 
                  onClick={() => {
                    if (selectedDeals.length === 1) {
                      toast.info(`Bulk delete for ${selectedDeals.length} deal - implement bulk delete handler`);
                    } else {
                      toast.info(`Bulk delete for ${selectedDeals.length} deals - implement bulk delete handler`);
                    }
                  }}
                  className="d-flex align-items-center text-danger"
                >
                  <Trash2 size={14} className="me-2" />
                  Delete Selected ({selectedDeals.length})
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
                { key: 'name', label: 'Deal Name' },
                { key: 'company', label: 'Company' },
                { key: 'value', label: 'Value' },
                { key: 'stage', label: 'Stage' },
                { key: 'dealType', label: 'Deal Type' },
                { key: 'owner', label: 'Owner' },
                { key: 'industry', label: 'Industry' },
                { key: 'probability', label: 'Probability' },
                { key: 'closeDate', label: 'Close Date' },
                { key: 'created', label: 'Created' }
              ].map((col) => (
                <Dropdown.Item key={col.key} as="div">
                  <Form.Check
                    type="checkbox"
                    label={col.label}
                    checked={selectedDealsColumns.includes(col.key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDealsColumns([...selectedDealsColumns, col.key]);
                        localStorage.setItem('dealsSelectedColumns', JSON.stringify([...selectedDealsColumns, col.key]));
                      } else {
                        const newCols = selectedDealsColumns.filter(c => c !== col.key);
                        setSelectedDealsColumns(newCols);
                        localStorage.setItem('dealsSelectedColumns', JSON.stringify(newCols));
                      }
                    }}
                  />
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => {
                const allCols = ['name', 'company', 'value', 'stage', 'dealType', 'owner', 'industry', 'probability', 'closeDate', 'created'];
                setSelectedDealsColumns(allCols);
                localStorage.setItem('dealsSelectedColumns', JSON.stringify(allCols));
              }}>
                Select All
              </Dropdown.Item>
              <Dropdown.Item onClick={() => {
                const defaultCols = ['name', 'company', 'value', 'stage', 'dealType', 'owner', 'industry', 'probability', 'closeDate', 'created'];
                setSelectedDealsColumns(defaultCols);
                localStorage.setItem('dealsSelectedColumns', JSON.stringify(defaultCols));
              }}>
                Reset to Default
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Deals Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th style={{ width: '50px' }}>
                      <Form.Check
                        type="checkbox"
                        checked={filteredDeals.length > 0 && filteredDeals.every(d => selectedDeals.includes(d.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDeals(filteredDeals.map(d => d.id));
                          } else {
                            setSelectedDeals([]);
                          }
                        }}
                      />
                    </th>
                    {selectedDealsColumns.includes('name') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('name', dealsPagination, setDealsPagination)}
                      >
                        Deal Name {renderSortIcon('name', dealsPagination)}
                      </th>
                    )}
                    {selectedDealsColumns.includes('company') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('company', dealsPagination, setDealsPagination)}
                      >
                        Company {renderSortIcon('company', dealsPagination)}
                      </th>
                    )}
                    {selectedDealsColumns.includes('stage') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('stage', dealsPagination, setDealsPagination)}
                      >
                        Stage {renderSortIcon('stage', dealsPagination)}
                      </th>
                    )}
                    {selectedDealsColumns.includes('dealType') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('dealType', dealsPagination, setDealsPagination)}
                      >
                        Deal Type {renderSortIcon('dealType', dealsPagination)}
                      </th>
                    )}
                    {selectedDealsColumns.includes('value') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('value', dealsPagination, setDealsPagination)}
                      >
                        Value {renderSortIcon('value', dealsPagination)}
                      </th>
                    )}
                    {selectedDealsColumns.includes('probability') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('probability', dealsPagination, setDealsPagination)}
                      >
                        Probability {renderSortIcon('probability', dealsPagination)}
                      </th>
                    )}
                    {selectedDealsColumns.includes('closeDate') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('closeDate', dealsPagination, setDealsPagination)}
                      >
                        Expected Close {renderSortIcon('closeDate', dealsPagination)}
                      </th>
                    )}
                    {selectedDealsColumns.includes('owner') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('owner', dealsPagination, setDealsPagination)}
                      >
                        Owner {renderSortIcon('owner', dealsPagination)}
                      </th>
                    )}
                    {selectedDealsColumns.includes('created') && (
                      <th 
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('created', dealsPagination, setDealsPagination)}
                      >
                        Created {renderSortIcon('created', dealsPagination)}
                      </th>
                    )}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={selectedDealsColumns.length + 2} className="text-center py-4">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredDeals.length === 0 ? (
                    <tr>
                      <td colSpan={selectedDealsColumns.length + 2} className="text-center py-4 text-muted">
                        No deals found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    paginateData(
                      sortData(filteredDeals, dealsPagination.sortColumn, dealsPagination.sortDirection),
                      dealsPagination.currentPage,
                      dealsPagination.rowsPerPage
                    ).map((deal) => (
                      <tr key={deal.id}>
                        <td>
                          <Form.Check
                            type="checkbox"
                            checked={selectedDeals.includes(deal.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDeals([...selectedDeals, deal.id]);
                              } else {
                                setSelectedDeals(selectedDeals.filter(id => id !== deal.id));
                              }
                            }}
                          />
                        </td>
                        {selectedDealsColumns.includes('name') && (
                          <td className="fw-semibold">{deal.name}</td>
                        )}
                        {selectedDealsColumns.includes('company') && (
                          <td>
                            <div>
                              <div className="fw-medium">{deal.company || 'No Company'}</div>
                              {deal.industry && <small className="text-muted">{deal.industry}</small>}
                            </div>
                          </td>
                        )}
                        {selectedDealsColumns.includes('stage') && (
                          <td>
                            <Badge 
                              bg={
                                deal.stage?.toLowerCase().includes('negotiation') ? 'warning' :
                                deal.stage?.toLowerCase().includes('proposal') ? 'info' :
                                deal.stage?.toLowerCase().includes('won') ? 'success' :
                                'secondary'
                              }
                            >
                              {deal.stage}
                            </Badge>
                          </td>
                        )}
                        {selectedDealsColumns.includes('dealType') && (
                          <td>
                            <Badge bg="primary" className="bg-opacity-10 text-dark">
                              {deal.dealType}
                            </Badge>
                          </td>
                        )}
                        {selectedDealsColumns.includes('value') && (
                          <td className="fw-semibold">{deal.currency} {parseFloat(String(deal.value)).toLocaleString()}</td>
                        )}
                        {selectedDealsColumns.includes('probability') && (
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="progress" style={{ width: '60px', height: '8px' }}>
                                <div 
                                  className="progress-bar" 
                                  role="progressbar" 
                                  style={{ width: `${deal.probability}%` }}
                                />
                              </div>
                              <small>{deal.probability}%</small>
                            </div>
                          </td>
                        )}
                        {selectedDealsColumns.includes('closeDate') && (
                          <td>{deal.closeDate || '-'}</td>
                        )}
                        {selectedDealsColumns.includes('owner') && (
                          <td>{deal.owner || '-'}</td>
                        )}
                        {selectedDealsColumns.includes('created') && (
                          <td>{deal.created || '-'}</td>
                        )}
                        <td>
                          <div className="d-flex gap-1">
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="p-1" 
                                title="Edit"
                                onClick={() => window.location.href = `/crm/deals/${deal.rawData?.id || deal.id}/edit`}
                              >
                                <Edit size={16} />
                              </Button>
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="p-1 text-success" 
                                  title="Convert to Order"
                                  onClick={() => window.location.href = `/crm/orders/create?deal_id=${deal.rawData?.id || deal.id}`}
                                >
                                  <ShoppingBag size={16} />
                                </Button>
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="p-1 text-danger" 
                                title="Delete"
                                onClick={() => handleDeleteDeal(deal.rawData?.id || deal.id)}
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
              {renderPaginationControls(filteredDeals.length, dealsPagination, setDealsPagination, 'deals')}
            </div>
          </Card.Body>
        </Card>
      </div>

      <ConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        title="Delete Deal"
        description="Are you sure you want to delete this deal?"
        onConfirm={() => confirmDeleteDeal()}
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

CrmDeals.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmDeals;

