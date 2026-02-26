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
import GenericListPage from "@components/GenericListPage";
import {
  getStages,
  createStage,
  deleteStage,
  restoreStage,
  updateStage,
  StageData,
} from "@utils/crm";
import { Column } from "@components/CustomDataTable";
import {
  Button,
  Modal,
  Row,
  Col,
  Badge,
  Form,
  Alert,
  Card,
  Table,
  Dropdown,
  InputGroup,
} from "react-bootstrap";
import Select from "react-select";
import { FiTrash2, FiPlus, FiSave, FiEdit2, FiEye } from "react-icons/fi";
import {
  History,
  X,
  Clock,
  User,
  GitBranch,
  DollarSign,
  MessageSquare,
  Send,
  UserCheck,
  Plus,
  FileText,
  Layers,
  BarChart3,
  Target,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle,
  XCircle,
  ChevronRight as ChevronRightIcon,
  Search,
  Filter,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { toast } from "react-toastify";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import FormModal from "../../partial/FormModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import PageSummaryGrid, { SummaryCard } from "@components/PageSummaryGrid";
import DatatableActionButton from "@components/DatatableActionButton";
import { useSession } from "next-auth/react";

interface Stage {
  id: number;
  name: string;
  sequence: number;
  is_won: boolean;
  fold: boolean;
  color: string;
  description?: string | null;
  is_default: boolean;
  active: boolean;
  type: "lead" | "deal" | "order" | "lost_reason";
  created_at: string;
  updated_at: string;
  probability: number;
}

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
                const bgColor = filter.color;
                if (isActive) {
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
                  onClick={() => onFilterChange(filter.id)}
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

          <div className="d-flex flex-column flex-sm-row gap-2 align-items-stretch align-items-sm-center flex-shrink-0">
            <InputGroup
              style={{ width: "300px", minWidth: "200px" }}
              className="flex-shrink-0"
            >
              <Form.Control
                style={{ height: "41px" }}
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    onSearch();
                  }
                }}
              />
              <Button variant="outline-secondary" onClick={onSearch}>
                <Search size={16} />
              </Button>
            </InputGroup>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

const StagesManagement = () => {
  const { data: session } = useSession();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<Stage | null>(null);
  const [stageToUpdate, setStageToUpdate] = useState<Stage | null>(null);
  const [viewingStage, setViewingStage] = useState<Stage | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [formData, setFormData] = useState({
    name: "",
    sequence: 1,
    is_won: false,
    fold: false,
    color: "#6c757d",
    description: "",
    is_default: false,
    active: true,
    type: "lead" as "lead" | "deal" | "order" | "lost_reason",
    probability: 50,
  });

  const [currentFilters, setCurrentFilters] = useState({
    search: "",
    type: "" as string,
  });
  const [stagesSearch, setStagesSearch] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showStagesAnalytics, setShowStagesAnalytics] = useState(false);
  const [selectedStagesColumns, setSelectedStagesColumns] = useState<string[]>(
    () => {
      const saved = localStorage.getItem("stagesSelectedColumns");
      return saved
        ? JSON.parse(saved)
        : ["order", "stageName", "category", "description", "color"];
    },
  );
  const [stagesPagination, setStagesPagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    sortColumn: "",
    sortDirection: "asc" as "asc" | "desc",
  });
  const [stagesData, setStagesData] = useState<StageData[]>([]);
  const [loadingStages, setLoadingStages] = useState(false);

  const handleFiltersChange = (filters: any) => {
    setCurrentFilters(filters);
  };

  const fetchStages = useCallback(
    async (type?: string, includeArchived?: boolean) => {
      setLoadingStages(true);
      try {
        const stageType = type
          ? (type as "lead" | "deal" | "order" | "lost_reason")
          : undefined;
        const params = includeArchived ? { include_archived: true } : undefined;
        const allStages = await getStages(stageType, params);
        setStagesData(allStages);
      } catch (error) {
        console.error("Failed to fetch stages:", error);
        setStagesData([]);
      } finally {
        setLoadingStages(false);
      }
    },
    [],
  );

  useEffect(() => {
    const includeArchived = activeFilter === "deleted";
    const typeFilter =
      activeFilter === "all" || activeFilter === "deleted"
        ? undefined
        : activeFilter;
    setSelectedTypeFilter(typeFilter || "");
    fetchStages(
      typeFilter as "lead" | "deal" | "order" | "lost_reason" | undefined,
      includeArchived,
    );
  }, [fetchStages, refreshKey, activeFilter]);

  const fetchStagesForTable = useCallback(
    async (page = 1, perPage = 15) => {
      try {
        const searchTerm = currentFilters.search;

        // Only filter by search on frontend, type is already filtered by API
        let filteredStages = stagesData.filter((stage) => {
          // Search filter
          if (searchTerm) {
            const matchesSearch =
              stage.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              stage.description
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;
          }

          return true;
        });

        return {
          dataList: filteredStages,
          meta: {
            total: filteredStages.length,
            current_page: page,
            per_page: perPage,
            last_page: Math.ceil(filteredStages.length / perPage),
          },
        };
      } catch (error) {
        console.error("Failed to fetch stages:", error);
        return {
          dataList: [],
          meta: {
            total: 0,
            current_page: page,
            per_page: perPage,
            last_page: 1,
          },
        };
      }
    },
    [currentFilters, stagesData],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createStage(formData);
      toast.success("Stage created successfully!");
      setShowCreateModal(false);
      setFormData({
        name: "",
        sequence: 1,
        is_won: false,
        fold: false,
        color: "#6c757d",
        description: "",
        is_default: false,
        active: true,
        type: "lead" as "lead" | "deal" | "order" | "lost_reason",
        probability: 50,
      });
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Stage Created");
      setSuccessModalDescription("Stage created successfully!");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      toast.error("Failed to create stage");
      console.error("Create stage error:", error);
    }
  };

  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");
  const handleCloseSuccessfulModal = () => {
    setShowSuccessfulModal(false);
  };

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setStageToUpdate(null);
    setFormData({
      name: "",
      sequence: 1,
      is_won: false,
      fold: false,
      color: "#6c757d",
      description: "",
      is_default: false,
      active: true,
      type: "lead" as "lead" | "deal" | "order" | "lost_reason",
      probability: 50,
    });
  };

  const handleUpdateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageToUpdate) return;

    try {
      await updateStage(stageToUpdate.id, formData);
      toast.success("Stage updated successfully!");
      setShowUpdateModal(false);
      setStageToUpdate(null);
      setFormData({
        name: "",
        sequence: 1,
        is_won: false,
        fold: false,
        color: "#6c757d",
        description: "",
        is_default: false,
        active: true,
        type: "lead" as "lead" | "deal" | "order" | "lost_reason",
        probability: 50,
      });
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Stage Updated");
      setSuccessModalDescription("Stage updated successfully!");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      toast.error("Failed to update stage");
      console.error("Update stage error:", error);
    }
  };

  const handleDeleteStage = async () => {
    if (!stageToDelete) return;

    try {
      await deleteStage(stageToDelete.id);
      toast.success("Stage deleted successfully!");
      setShowDeleteModal(false);
      setStageToDelete(null);
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Stage Deleted");
      setSuccessModalDescription("Stage deleted successfully!");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      toast.error("Failed to delete stage");
      console.error("Delete stage error:", error);
    }
  };

  // Restore Stage Handler
  const handleRestoreStage = useCallback(async (stageId: number) => {
    if (!window.confirm("Are you sure you want to restore this stage?")) return;

    try {
      await restoreStage(stageId);
      toast.success("Stage restored successfully!");
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Stage Restored");
      setSuccessModalDescription("Stage has been restored successfully");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error) {
      console.error("Failed to restore stage:", error);
      toast.error("Failed to restore stage");
    }
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [field]: value,
      };

      // If type changes to lost_reason, disable and set probability to 0
      if (field === "type" && value === "lost_reason") {
        newData.probability = 0;
      }

      return newData;
    });
  };

  const getStatusBadge = (stage: Stage) => {
    if (stage.is_won) {
      return <span className="status-badge success">Won</span>;
    }
    if (stage.fold) {
      return <span className="status-badge danger">Fold</span>;
    }
    if (stage.is_default) {
      return <span className="status-badge primary">Default</span>;
    }
    return <span className="status-badge success">Active</span>;
  };

  // Memoized columns for the table
  const columns: Column[] = useMemo(
    () => [
      {
        key: "name",
        name: "Stage",
        selector: (row: Stage) => row.name,
        sortable: true,
      },
      {
        key: "sequence",
        name: "Sequence",
        selector: (row: Stage) => row.sequence,
        sortable: true,
        cell: (props: Stage) => (
          <span className="status-badge info">{props.sequence}</span>
        ),
      },
      {
        key: "type",
        name: "Type",
        selector: (row: Stage) => row.type,
        sortable: true,
        cell: (props: Stage) => (
          <span
            className={`status-badge ${props.type === "lead" ? "primary" : "success"}`}
          >
            {props.type.charAt(0).toUpperCase() + props.type.slice(1)}
          </span>
        ),
      },
      {
        key: "color",
        name: "Color",
        selector: (row: Stage) => row.color,
        sortable: false,
        cell: (props: Stage) => (
          <div className="d-flex align-items-center">
            <div
              className="me-2"
              style={{
                width: "20px",
                height: "20px",
                backgroundColor: props.color,
                borderRadius: "4px",
              }}
            />
            <span className="status-badge info">{props.color}</span>
          </div>
        ),
      },
      {
        key: "description",
        name: "Description",
        selector: (row: Stage) => row.description || "",
        sortable: true,
        cell: (props: Stage) => <p>{props.description || "No description"}</p>,
      },
      {
        key: "created_at",
        name: "Created",
        selector: (row: Stage) => row.created_at,
        sortable: true,
        cell: (props: Stage) => (
          <p>{new Date(props.created_at).toLocaleDateString()}</p>
        ),
      },
      {
        key: "actions",
        name: "Actions",
        selector: (row: Stage) => row.id,
        sortable: false,
        cell: (props: Stage) => (
          <DatatableActionButton
            actions={[
              {
                label: "View",
                icon: <FiEye />,
                onClick: () => {
                  setViewingStage(props);
                  setShowViewModal(true);
                },
                className: "text-info",
              },
              ...(session?.user?.permissions?.includes("edit-crm-stages")
                ? [
                    {
                      label: "Edit",
                      icon: <FiEdit2 />,
                      onClick: () => {
                        setStageToUpdate(props);
                        setFormData({
                          name: props.name,
                          sequence: props.sequence,
                          is_won: props.is_won,
                          fold: props.fold,
                          color: props.color,
                          description: props.description || "",
                          is_default: props.is_default,
                          active: props.active,
                          type: props.type,
                          probability: props.probability,
                        });
                        setShowUpdateModal(true);
                      },
                      className: "text-primary",
                    },
                  ]
                : []),

              ...(session?.user?.permissions?.includes("delete-crm-stages")
                ? [
                    {
                      label: "Delete",
                      icon: <FiTrash2 />,
                      onClick: () => {
                        setStageToDelete(props);
                        setShowDeleteModal(true);
                      },
                      className: "text-danger",
                    },
                  ]
                : []),
            ]}
          />
        ),
      },
    ],
    [],
  );

  const filters = useMemo(() => ({}), []);

  // Helper functions for sorting and pagination
  const handleSort = (
    column: string,
    paginationState: any,
    setPaginationState: (state: any) => void,
  ) => {
    const newDirection =
      paginationState.sortColumn === column &&
      paginationState.sortDirection === "asc"
        ? "desc"
        : "asc";
    setPaginationState({
      ...paginationState,
      sortColumn: column,
      sortDirection: newDirection,
      currentPage: 1,
    });
  };

  const sortData = <T extends Record<string, any>>(
    data: T[],
    sortColumn: string,
    sortDirection: "asc" | "desc",
  ): T[] => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      if (aVal === undefined) aVal = "";
      if (bVal === undefined) bVal = "";

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (aStr < bStr) return sortDirection === "asc" ? -1 : 1;
      if (aStr > bStr) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const paginateData = <T,>(
    data: T[],
    currentPage: number,
    rowsPerPage: number,
  ): T[] => {
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
    label: string,
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
            onChange={(e) =>
              setPaginationState({
                ...paginationState,
                rowsPerPage: Number(e.target.value),
                currentPage: 1,
              })
            }
            style={{ width: "auto" }}
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
            onClick={() =>
              setPaginationState({ ...paginationState, currentPage: 1 })
            }
          >
            <ChevronsLeft size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === 1}
            onClick={() =>
              setPaginationState({
                ...paginationState,
                currentPage: currentPage - 1,
              })
            }
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
                  variant={
                    currentPage === pageNum ? "primary" : "outline-secondary"
                  }
                  onClick={() =>
                    setPaginationState({
                      ...paginationState,
                      currentPage: pageNum,
                    })
                  }
                >
                  {pageNum}
                </Button>
              );
            } else if (
              pageNum === currentPage - 2 ||
              pageNum === currentPage + 2
            ) {
              return (
                <span key={pageNum} className="px-2">
                  ...
                </span>
              );
            }
            return null;
          })}

          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() =>
              setPaginationState({
                ...paginationState,
                currentPage: currentPage + 1,
              })
            }
          >
            <ChevronRight size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() =>
              setPaginationState({
                ...paginationState,
                currentPage: totalPages,
              })
            }
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
    return paginationState.sortDirection === "asc" ? (
      <ArrowUp size={14} className="ms-1" />
    ) : (
      <ArrowDown size={14} className="ms-1" />
    );
  };

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

  const KPICard: React.FC<KPICardData> = ({
    title,
    value,
    change,
    isPositive,
    icon,
    color,
    onClick,
  }) => {
    return (
      <Card
        className={onClick ? "h-100" : ""}
        style={{
          cursor: onClick ? "pointer" : "default",
          transition: "all 0.2s ease",
          border: "1px solid #e9ecef",
        }}
        onClick={onClick}
        onMouseEnter={(e) => {
          if (onClick) {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
          }
        }}
        onMouseLeave={(e) => {
          if (onClick) {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }
        }}
      >
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className={`bg-${color} bg-opacity-10 rounded p-3`}>
              <div className={`text-${color}`}>{icon}</div>
            </div>
            {change && (
              <Badge
                bg={isPositive ? "success" : "danger"}
                className="bg-opacity-10"
              >
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

  // Filter and transform stages data (only search filter, type is filtered by API)
  const filteredStages = useMemo(() => {
    const searchTerm = currentFilters.search || "";

    return stagesData.filter((stage) => {
      // Search filter
      if (searchTerm) {
        const matchesSearch =
          stage.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stage.description?.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [stagesData, currentFilters]);

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    const total = filteredStages.length;
    const byType = {
      lead: filteredStages.filter((s) => s.type === "lead").length,
      deal: filteredStages.filter((s) => s.type === "deal").length,
      order: filteredStages.filter((s) => s.type === "order").length,
      lost_reason: filteredStages.filter((s) => s.type === "lost_reason")
        .length,
    };

    const stagesByType = [
      { type: "Lead", count: byType.lead, fill: "#0d6efd" },
      { type: "Deal", count: byType.deal, fill: "#ffc107" },
      { type: "Order", count: byType.order, fill: "#20c997" },
      { type: "Lost Reason", count: byType.lost_reason, fill: "#dc3545" },
    ].filter((item) => item.count > 0);

    return { total, byType, stagesByType };
  }, [filteredStages]);

  const getTypeDisplayName = (type: string) => {
    const typeMap: Record<string, string> = {
      lead: "Lead",
      deal: "Deal",
      order: "Order",
      lost_reason: "Lost Reason",
    };
    return typeMap[type] || type;
  };

  const getTypeBadgeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      lead: "primary",
      deal: "warning",
      order: "success",
      lost_reason: "danger",
    };
    return colorMap[type] || "secondary";
  };

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const allStages = stagesData;
    const counts: Record<string, number> = {
      all: allStages.length,
      lead: allStages.filter((s) => s.type === "lead").length,
      deal: allStages.filter((s) => s.type === "deal").length,
      order: allStages.filter((s) => s.type === "order").length,
      lost_reason: allStages.filter((s) => s.type === "lost_reason").length,
      deleted: 0, // Will be calculated when include_archived is true
    };
    return counts;
  }, [stagesData]);

  if (!session?.user?.permissions?.includes("list-crm-stages")) {
    return null;
  }

  return (
    <React.Fragment>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .stages-table-wrapper {
          width: 100%;
          overflow: hidden;
        }
        .stages-table-wrapper .table-responsive {
          width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
        }
        .stages-table-wrapper .table-responsive table {
          width: 100%;
          table-layout: auto;
          margin-bottom: 0;
        }
        .stages-table-wrapper .table-responsive table th,
        .stages-table-wrapper .table-responsive table td {
          padding: 12px 16px;
          vertical-align: middle;
        }
        .stages-table-wrapper .table-responsive table td:last-child,
        .stages-table-wrapper .table-responsive table th:last-child {
          max-width: none;
        }
        .stages-table-wrapper .table-responsive table td[style*="width"],
        .stages-table-wrapper .table-responsive table th[style*="width"] {
          max-width: none;
        }
      `,
        }}
      />
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Stages"
      />

      <div>
        {/* Page Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div className="mb-3 mb-md-0">
            <h2 className="mb-1 fw-bold">Stages Management</h2>
            <p className="text-muted mb-0">
              Configure and manage your sales pipeline stages
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button
              variant={showStagesAnalytics ? "primary" : "outline-secondary"}
              onClick={() => setShowStagesAnalytics(!showStagesAnalytics)}
            >
              <BarChart3 size={16} className="me-2" />
              {showStagesAnalytics ? "Hide Analytics" : "Show Analytics"}
            </Button>
            {session?.user?.permissions?.includes("add-crm-stages") && (
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={16} className="me-2" />
                Add Custom Stage
              </Button>
            )}
          </div>
        </div>

        {/* Analytics Section - Collapsible */}
        {showStagesAnalytics && (
          <>
            {/* Summary Stats */}
            <Row className="mb-4">
              <Col lg={3} md={6} className="mb-3">
                <KPICard
                  title="Total Stages"
                  value={analyticsData.total.toString()}
                  icon={<Layers size={24} />}
                  color="primary"
                />
              </Col>
              <Col lg={3} md={6} className="mb-3">
                <KPICard
                  title="Lead Stages"
                  value={analyticsData.byType.lead.toString()}
                  icon={<Target size={24} />}
                  color="primary"
                />
              </Col>
              <Col lg={3} md={6} className="mb-3">
                <KPICard
                  title="Deal Stages"
                  value={analyticsData.byType.deal.toString()}
                  icon={<TrendingUp size={24} />}
                  color="warning"
                />
              </Col>
              <Col lg={3} md={6} className="mb-3">
                <KPICard
                  title="Order Stages"
                  value={analyticsData.byType.order.toString()}
                  icon={<Layers size={24} />}
                  color="success"
                />
              </Col>
            </Row>

            {/* Analytics Charts */}
            {analyticsData.stagesByType.length > 0 && (
              <Row className="mb-4">
                <Col lg={6} className="mb-4">
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <h5 className="mb-4 fw-bold">Stages by Type</h5>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={analyticsData.stagesByType}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ type, count }: any) =>
                              `${type}: ${count}`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {analyticsData.stagesByType.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </>
        )}

        {/* Filter Bar */}
        <FilterBar
          quickFilters={[
            {
              id: "all",
              label: "All Types",
              count: filterCounts.all,
              color: "#6c757d",
              icon: <Layers size={16} />,
            },
            {
              id: "lead",
              label: "Lead",
              count: filterCounts.lead,
              color: "#0d6efd",
              icon: <Target size={16} />,
            },
            {
              id: "deal",
              label: "Deal",
              count: filterCounts.deal,
              color: "#ffc107",
              icon: <TrendingUp size={16} />,
            },
            {
              id: "order",
              label: "Order",
              count: filterCounts.order,
              color: "#20c997",
              icon: <Layers size={16} />,
            },
            {
              id: "lost_reason",
              label: "Lost Reason",
              count: filterCounts.lost_reason,
              color: "#dc3545",
              icon: <XCircle size={16} />,
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
          onFilterChange={(filterId) => {
            setActiveFilter(filterId);
            setStagesPagination({ ...stagesPagination, currentPage: 1 });
          }}
          searchValue={stagesSearch}
          onSearchChange={(value) => setStagesSearch(value)}
          onSearch={() => {
            if (stagesSearch.trim()) {
              handleFiltersChange({
                ...currentFilters,
                search: stagesSearch.trim(),
              });
            } else {
              handleFiltersChange({ ...currentFilters, search: null });
            }
            setStagesPagination({ ...stagesPagination, currentPage: 1 });
            setRefreshKey((prev) => prev + 1);
          }}
          searchPlaceholder="Search stages..."
          showAdvancedFilters={showAdvancedFilters}
          onToggleAdvancedFilters={() =>
            setShowAdvancedFilters(!showAdvancedFilters)
          }
          advancedFilterCount={0}
        />

        {/* Column Customization */}
        <div className="d-flex justify-content-end gap-2 mb-3">
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              <Layers size={16} className="me-2" />
              Customize Table
            </Dropdown.Toggle>
            <Dropdown.Menu
              align="end"
              style={{ maxHeight: "300px", overflowY: "auto" }}
            >
              {[
                { key: "order", label: "Sequence" },
                { key: "stageName", label: "Stage Name" },
                { key: "category", label: "Type" },
                { key: "description", label: "Description" },
                { key: "color", label: "Color" },
              ].map((col) => (
                <Dropdown.Item key={col.key} as="div">
                  <Form.Check
                    type="checkbox"
                    label={col.label}
                    checked={selectedStagesColumns.includes(col.key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStagesColumns([
                          ...selectedStagesColumns,
                          col.key,
                        ]);
                        localStorage.setItem(
                          "stagesSelectedColumns",
                          JSON.stringify([...selectedStagesColumns, col.key]),
                        );
                      } else {
                        const newCols = selectedStagesColumns.filter(
                          (c) => c !== col.key,
                        );
                        setSelectedStagesColumns(newCols);
                        localStorage.setItem(
                          "stagesSelectedColumns",
                          JSON.stringify(newCols),
                        );
                      }
                    }}
                  />
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item
                onClick={() => {
                  const allCols = [
                    "order",
                    "stageName",
                    "category",
                    "description",
                    "color",
                  ];
                  setSelectedStagesColumns(allCols);
                  localStorage.setItem(
                    "stagesSelectedColumns",
                    JSON.stringify(allCols),
                  );
                }}
              >
                Select All
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => {
                  const defaultCols = [
                    "order",
                    "stageName",
                    "category",
                    "description",
                    "color",
                  ];
                  setSelectedStagesColumns(defaultCols);
                  localStorage.setItem(
                    "stagesSelectedColumns",
                    JSON.stringify(defaultCols),
                  );
                }}
              >
                Reset to Default
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Stages Table */}
        <Card
          className="border-0 shadow-sm stages-table-wrapper mb-4"
          style={{ width: "100%" }}
        >
          <Card.Body className="p-0" style={{ width: "100%" }}>
            <div className="table-responsive">
              <Table
                hover
                className="mb-0"
                style={{ width: "100%", margin: 0, tableLayout: "auto" }}
              >
                <thead className="bg-light">
                  <tr>
                    {selectedStagesColumns.includes("stageName") && (
                      <th
                        style={{ cursor: "pointer", userSelect: "none" }}
                        onClick={() =>
                          handleSort(
                            "name",
                            stagesPagination,
                            setStagesPagination,
                          )
                        }
                      >
                        Stage Name {renderSortIcon("name", stagesPagination)}
                      </th>
                    )}
                    {selectedStagesColumns.includes("order") && (
                      <th
                        style={{
                          cursor: "pointer",
                          userSelect: "none",
                          width: "20px",
                          minWidth: "20px",
                        }}
                        className="text-center"
                        onClick={() =>
                          handleSort(
                            "sequence",
                            stagesPagination,
                            setStagesPagination,
                          )
                        }
                      >
                        Sequence {renderSortIcon("sequence", stagesPagination)}
                      </th>
                    )}
                    {selectedStagesColumns.includes("category") && (
                      <th
                        style={{ cursor: "pointer", userSelect: "none" }}
                        onClick={() =>
                          handleSort(
                            "type",
                            stagesPagination,
                            setStagesPagination,
                          )
                        }
                      >
                        Type {renderSortIcon("type", stagesPagination)}
                      </th>
                    )}
                    {selectedStagesColumns.includes("description") && (
                      <th>Description</th>
                    )}
                    {selectedStagesColumns.includes("color") && <th>Color</th>}
                    <th style={{ width: "120px", minWidth: "120px" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStages ? (
                    <tr>
                      <td
                        colSpan={selectedStagesColumns.length + 1}
                        className="text-center py-4"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : filteredStages.length === 0 ? (
                    <tr>
                      <td
                        colSpan={selectedStagesColumns.length + 1}
                        className="text-center py-4 text-muted"
                      >
                        No stages found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    paginateData(
                      sortData(
                        filteredStages,
                        stagesPagination.sortColumn,
                        stagesPagination.sortDirection,
                      ),
                      stagesPagination.currentPage,
                      stagesPagination.rowsPerPage,
                    ).map((stage) => (
                      <tr key={stage.id}>
                        {selectedStagesColumns.includes("stageName") && (
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div
                                style={{
                                  width: "10px",
                                  height: "10px",
                                  backgroundColor: stage.color,
                                  borderRadius: "50%",
                                }}
                              />
                              <span className="fw-semibold">{stage.name}</span>
                            </div>
                          </td>
                        )}
                        {selectedStagesColumns.includes("order") && (
                          <td
                            className="text-center fw-bold"
                            style={{ width: "20px", minWidth: "20px" }}
                          >
                            {stage.sequence}
                          </td>
                        )}
                        {selectedStagesColumns.includes("category") && (
                          <td>
                            <Badge
                              bg={getTypeBadgeColor(stage.type)}
                              className="bg-opacity-10 text-dark"
                            >
                              {getTypeDisplayName(stage.type)}
                            </Badge>
                          </td>
                        )}
                        {selectedStagesColumns.includes("description") && (
                          <td className="small text-muted">
                            {stage.description || "No description"}
                          </td>
                        )}
                        {selectedStagesColumns.includes("color") && (
                          <td>
                            <Badge style={{ backgroundColor: stage.color }}>
                              {stage.color}
                            </Badge>
                          </td>
                        )}
                        <td style={{ width: "120px", minWidth: "120px" }}>
                          <div className="d-flex gap-1">
                            {activeFilter === "deleted" ? (
                              <>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-1"
                                  title="View"
                                  onClick={() => {
                                    setViewingStage(stage);
                                    setShowViewModal(true);
                                  }}
                                >
                                  <Eye size={16} />
                                </Button>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-1 text-success"
                                  title="Restore"
                                  onClick={() => handleRestoreStage(stage.id)}
                                >
                                  <RotateCcw size={16} />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-1"
                                  title="View"
                                  onClick={() => {
                                    setViewingStage(stage);
                                    setShowViewModal(true);
                                  }}
                                >
                                  <Eye size={16} />
                                </Button>
                                {session?.user?.permissions?.includes(
                                  "edit-crm-stages",
                                ) && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-1"
                                    title="Edit Stage"
                                    onClick={() => {
                                      setStageToUpdate(stage);
                                      setFormData({
                                        name: stage.name,
                                        sequence: stage.sequence,
                                        is_won: stage.is_won,
                                        fold: stage.fold,
                                        color: stage.color,
                                        description: stage.description || "",
                                        is_default: stage.is_default,
                                        active: stage.active,
                                        type: stage.type,
                                        probability: stage.probability,
                                      });
                                      setShowUpdateModal(true);
                                    }}
                                  >
                                    <Edit size={16} />
                                  </Button>
                                )}
                                {session?.user?.permissions?.includes(
                                  "delete-crm-stages",
                                ) && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-1 text-danger"
                                    title="Delete Stage"
                                    onClick={() => {
                                      setStageToDelete(stage);
                                      setShowDeleteModal(true);
                                    }}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
            <div className="p-3">
              {renderPaginationControls(
                filteredStages.length,
                stagesPagination,
                setStagesPagination,
                "stages",
              )}
            </div>
          </Card.Body>
        </Card>
      </div>

      <FormModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        title="Create Stage"
        desc="Please fill in the details below to create a new stage."
        size="lg"
        formHtml={
          <>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Stage Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Enter stage name"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Sequence *</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.sequence}
                      onChange={(e) =>
                        handleInputChange("sequence", parseInt(e.target.value))
                      }
                      min="1"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Type *</Form.Label>
                    <Form.Select
                      value={formData.type}
                      onChange={(e) =>
                        handleInputChange(
                          "type",
                          e.target.value as
                            | "lead"
                            | "deal"
                            | "order"
                            | "lost_reason",
                        )
                      }
                      required
                    >
                      <option value="lead">Lead</option>
                      <option value="deal">Deal</option>
                      <option value="order">Order</option>
                      <option value="lost_reason">Lost Reason</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Color</Form.Label>
                    <Form.Control
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        handleInputChange("color", e.target.value)
                      }
                    />
                  </Form.Group>
                </Col>
                {/* <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <div className="d-flex gap-3">
                    <Form.Check
                      type="checkbox"
                      label="Won Stage"
                      checked={formData.is_won}
                      onChange={(e) => handleInputChange("is_won", e.target.checked)}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Fold Stage"
                      checked={formData.fold}
                      onChange={(e) => handleInputChange("fold", e.target.checked)}
                    />
                    <Form.Check
                      type="checkbox"
                      label="Default"
                      checked={formData.is_default}
                      onChange={(e) => handleInputChange("is_default", e.target.checked)}
                    />
                  </div>
                </Form.Group>
              </Col> */}
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Probability</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.probability}
                      onChange={(e) =>
                        handleInputChange(
                          "probability",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      min="0"
                      max="100"
                      disabled={formData.type === "lost_reason"}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Enter stage description (optional)"
                />
              </Form.Group>
            </Form>
          </>
        }
        submitButtonText="Create Stage"
        cancelButtonText="Cancel"
        onSubmit={() => {
          const mockEvent = { preventDefault: () => {} } as React.FormEvent;
          handleSubmit(mockEvent);
        }}
        onCancel={() => setShowCreateModal(false)}
        submitButtonVariant="primary"
        cancelButtonVariant="secondary"
      />

      {/* Update Stage Modal */}
      <FormModal
        show={showUpdateModal}
        onHide={handleCloseUpdateModal}
        title="Update Stage"
        desc="Please update the details below for this stage."
        size="lg"
        formHtml={
          <>
            <Form onSubmit={handleUpdateStage}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Stage Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Enter stage name"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Sequence *</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.sequence}
                      onChange={(e) =>
                        handleInputChange("sequence", parseInt(e.target.value))
                      }
                      min="1"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Type *</Form.Label>
                    <Form.Select
                      value={formData.type}
                      onChange={(e) =>
                        handleInputChange(
                          "type",
                          e.target.value as
                            | "lead"
                            | "deal"
                            | "order"
                            | "lost_reason",
                        )
                      }
                      required
                    >
                      <option value="lead">Lead</option>
                      <option value="deal">Deal</option>
                      <option value="order">Order</option>
                      <option value="lost_reason">Lost Reason</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Color</Form.Label>
                    <Form.Control
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        handleInputChange("color", e.target.value)
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Probability</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.probability}
                      onChange={(e) =>
                        handleInputChange(
                          "probability",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      min="0"
                      max="100"
                      disabled={formData.type === "lost_reason"}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Enter stage description (optional)"
                />
              </Form.Group>
            </Form>
          </>
        }
        submitButtonText="Update Stage"
        cancelButtonText="Cancel"
        onSubmit={() => {
          const mockEvent = { preventDefault: () => {} } as React.FormEvent;
          handleUpdateStage(mockEvent);
        }}
        onCancel={handleCloseUpdateModal}
        submitButtonVariant="primary"
        cancelButtonVariant="secondary"
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setStageToDelete(null);
        }}
        onConfirm={handleDeleteStage}
        itemName={stageToDelete?.name}
        itemType="stage"
      />

      {/* Stage View Modal */}
      {viewingStage && (
        <Modal
          show={showViewModal}
          onHide={() => setShowViewModal(false)}
          size="xl"
          centered
        >
          {/* Custom Header */}
          <div
            style={{
              color: "black",
              padding: "30px",
              position: "relative",
              borderTopLeftRadius: "8px",
              borderTopRightRadius: "8px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <button
              onClick={() => setShowViewModal(false)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "black",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                cursor: "pointer",
                transition: "all 0.3s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.3)";
                e.currentTarget.style.transform = "rotate(90deg)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                e.currentTarget.style.transform = "rotate(0deg)";
              }}
            >
              <X size={20} />
            </button>
            <h3 style={{ margin: 0, fontWeight: 600, fontSize: "24px" }}>
              {viewingStage.name}
            </h3>
            <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "14px" }}>
              Stage Details
            </p>
          </div>

          <Modal.Body style={{ padding: "30px" }}>
            {/* Stage Information Section */}
            <div
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#1f2937",
                marginBottom: "20px",
                paddingBottom: "10px",
                borderBottom: "2px solid #f8f9fa",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Layers size={18} style={{ color: "#4680ff" }} />
              Stage Information
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "20px",
                marginBottom: "30px",
              }}
            >
              <div
                style={{
                  background: "#f8f9fa",
                  padding: "16px",
                  borderRadius: "10px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "6px",
                  }}
                >
                  Stage Name
                </div>
                <div
                  style={{
                    fontSize: "15px",
                    color: "#1f2937",
                    fontWeight: 500,
                  }}
                >
                  {viewingStage.name}
                </div>
              </div>
              <div
                style={{
                  background: "#f8f9fa",
                  padding: "16px",
                  borderRadius: "10px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "6px",
                  }}
                >
                  Sequence
                </div>
                <div
                  style={{
                    fontSize: "15px",
                    color: "#1f2937",
                    fontWeight: 500,
                  }}
                >
                  {viewingStage.sequence}
                </div>
              </div>
              <div
                style={{
                  background: "#f8f9fa",
                  padding: "16px",
                  borderRadius: "10px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "6px",
                  }}
                >
                  Type
                </div>
                <div
                  style={{
                    fontSize: "15px",
                    color: "#1f2937",
                    fontWeight: 500,
                  }}
                >
                  <Badge bg={getTypeBadgeColor(viewingStage.type)}>
                    {getTypeDisplayName(viewingStage.type)}
                  </Badge>
                </div>
              </div>
              <div
                style={{
                  background: "#f8f9fa",
                  padding: "16px",
                  borderRadius: "10px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "6px",
                  }}
                >
                  Color
                </div>
                <div
                  style={{
                    fontSize: "15px",
                    color: "#1f2937",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      backgroundColor: viewingStage.color,
                      borderRadius: "4px",
                    }}
                  />
                  {viewingStage.color}
                </div>
              </div>
              <div
                style={{
                  background: "#f8f9fa",
                  padding: "16px",
                  borderRadius: "10px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "6px",
                  }}
                >
                  Status
                </div>
                <div
                  style={{
                    fontSize: "15px",
                    color: "#1f2937",
                    fontWeight: 500,
                  }}
                >
                  {getStatusBadge(viewingStage)}
                </div>
              </div>
              <div
                style={{
                  background: "#f8f9fa",
                  padding: "16px",
                  borderRadius: "10px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "6px",
                  }}
                >
                  Created Date
                </div>
                <div
                  style={{
                    fontSize: "15px",
                    color: "#1f2937",
                    fontWeight: 500,
                  }}
                >
                  {new Date(viewingStage.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Description */}
            {viewingStage.description && (
              <>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#1f2937",
                    marginBottom: "20px",
                    paddingBottom: "10px",
                    borderBottom: "2px solid #f8f9fa",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <FileText size={18} style={{ color: "#4680ff" }} />
                  Description
                </div>
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "16px",
                    borderRadius: "10px",
                    marginBottom: "30px",
                    fontSize: "14px",
                    color: "#1f2937",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {viewingStage.description}
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                paddingTop: "20px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              {session?.user?.permissions?.includes("edit-crm-stages") && (
                <Button
                  variant="primary"
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    fontWeight: 500,
                    fontSize: "14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#4680ff",
                    border: "none",
                  }}
                  onClick={() => {
                    setShowViewModal(false);
                    setStageToUpdate(viewingStage);
                    setFormData({
                      name: viewingStage.name,
                      sequence: viewingStage.sequence,
                      is_won: viewingStage.is_won,
                      fold: viewingStage.fold,
                      color: viewingStage.color,
                      description: viewingStage.description || "",
                      is_default: viewingStage.is_default,
                      active: viewingStage.active,
                      type: viewingStage.type,
                      probability: viewingStage.probability,
                    });
                    setShowUpdateModal(true);
                  }}
                >
                  <FiEdit2 size={16} />
                  Edit Stage
                </Button>
              )}
              <Button
                variant="outline-secondary"
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: 500,
                  fontSize: "14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "white",
                  color: "#6b7280",
                  border: "2px solid #e5e7eb",
                }}
                onClick={() => setShowViewModal(false)}
              >
                Close
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      )}

      <SuccessfulModal
        show={showSuccessfulModal}
        onHide={() => setShowSuccessfulModal(false)}
        title={successModalTitle}
        description={successModalDescription}
      />
    </React.Fragment>
  );
};

StagesManagement.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default StagesManagement;
