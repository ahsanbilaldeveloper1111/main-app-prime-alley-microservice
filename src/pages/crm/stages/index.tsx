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
import GenericTable, { TableColumn, ToolbarConfig } from "@components/GenericTable";
import CrmColorCell from "@components/crm/crmColorCell";
import { CrmDescriptionDetailsBlock, CrmTruncatedDescriptionCell } from "@components/crm/crmTruncatedDescriptionCell";
import {
  CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE,
  CRM_DIALOG_PRIMARY_BUTTON_STYLE,
  CRM_DIALOG_SECONDARY_BUTTON_STYLE,
} from "@components/crm/crmDialogActionButtonStyles";
import {
  getStages,
  createStage,
  deleteStage,
  restoreStage,
  updateStage,
  StageData,
} from "@utils/crm";
import {
  Button,
  Modal,
  Row,
  Col,
  Badge,
  Form,
  Card,
} from "react-bootstrap";
import { FiEdit2 } from "react-icons/fi";
import {
  X,
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
  RotateCcw,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { toast } from "react-toastify";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import FormModal from "../../partial/FormModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { useSession } from "next-auth/react";
import { reportApiErrorFromCatch } from "@utils/sentryLogger";

type StageType = "lead" | "deal" | "order" | "lost_reason";

const PERMISSION_LIST_STAGES = "list-crm-stages";
const PERMISSION_ADD_STAGES = "add-crm-stages";
const PERMISSION_EDIT_STAGES = "edit-crm-stages";
const PERMISSION_DELETE_STAGES = "delete-crm-stages";

const TYPE_DISPLAY_NAMES: Record<StageType, string> = {
  lead: "Lead",
  deal: "Deal",
  order: "Order",
  lost_reason: "Lost Reason",
};

const TYPE_BADGE_COLORS: Record<StageType, string> = {
  lead: "primary",
  deal: "warning",
  order: "success",
  lost_reason: "danger",
};

function getTypeDisplayName(type: string): string {
  return TYPE_DISPLAY_NAMES[type as StageType] ?? type;
}

function getTypeBadgeColor(type: string): string {
  return TYPE_BADGE_COLORS[type as StageType] ?? "secondary";
}

function consumeHandledApiError(error: unknown, source: string): void {
  reportApiErrorFromCatch(error, source, { scope: "StagesManagement" });
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((x) => typeof x === "string");
}

function parseSavedStageColumns(raw: string | null): string[] | undefined {
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isStringArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

type StageFormState = {
  name: string;
  sequence: number;
  is_won: boolean;
  fold: boolean;
  color: string;
  description: string;
  is_default: boolean;
  active: boolean;
  type: StageType;
  probability: number;
};

const INITIAL_STAGE_FORM: StageFormState = {
  name: "",
  sequence: 1,
  is_won: false,
  fold: false,
  color: "#6c757d",
  description: "",
  is_default: false,
  active: true,
  type: "lead",
  probability: 50,
};

function scaffoldFormEvent(): React.FormEvent {
  return { preventDefault() {} } as React.FormEvent;
}

function parseSequenceInput(raw: string, fallback: number): number {
  const n = Number.parseInt(raw, 10);
  return Number.isNaN(n) || n < 1 ? fallback : n;
}

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
  type: StageType;
  created_at: string;
  updated_at: string;
  probability: number;
}

interface StageFilterState {
  search: string;
  type: string;
}

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
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        border: "1px solid #e9ecef",
      }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
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

const StagesManagement = () => {
  const { data: session } = useSession();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");
  const [stageToDelete, setStageToDelete] = useState<Stage | null>(null);
  const [stageToUpdate, setStageToUpdate] = useState<Stage | null>(null);
  const [viewingStage, setViewingStage] = useState<Stage | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [formData, setFormData] = useState<StageFormState>(() => ({
    ...INITIAL_STAGE_FORM,
  }));

  const [currentFilters, setCurrentFilters] = useState<StageFilterState>({
    search: "",
    type: "",
  });
  const [stagesSearch, setStagesSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showStagesAnalytics, setShowStagesAnalytics] = useState(false);

  const normalizeSelectedStageColumns = (
    cols: string[] | null | undefined,
  ): string[] => {
    const map: Record<string, string> = {
      order: "sequence",
      stageName: "name",
      category: "type",
      description: "description",
      color: "color",
      actions: "actions",
      sequence: "sequence",
      name: "name",
      type: "type",
    };

    const normalized = (cols ?? [])
      .map((c) => map[c])
      .filter((c): c is string => Boolean(c));
    return normalized.reduce<string[]>((acc, value) => {
      if (!acc.includes(value)) acc.push(value);
      return acc;
    }, []);
  };

  const [selectedStagesColumns, setSelectedStagesColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("stagesSelectedColumns");
    return normalizeSelectedStageColumns(parseSavedStageColumns(saved));
  });
  const [stagesPagination, setStagesPagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    sortColumn: "",
    sortDirection: "asc" as "asc" | "desc",
  });
  const [stagesData, setStagesData] = useState<StageData[]>([]);
  const [allStagesData, setAllStagesData] = useState<StageData[]>([]);
  const [loadingStages, setLoadingStages] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [stageToRestore, setStageToRestore] = useState<Stage | null>(null);
  const [restoring, setRestoring] = useState(false);

  const handleCloseSuccessfulModal = () => {
    setShowSuccessfulModal(false);
  };

  const fetchStages = useCallback(
    async (type?: string, includeArchived?: boolean) => {
      setLoadingStages(true);
      try {
        const stageType = type ? (type as StageType) : undefined;
        const params = includeArchived ? { include_archived: true } : undefined;
        const stages = await getStages(stageType, params);
        setStagesData(stages);
      } catch (error: unknown) {
        consumeHandledApiError(error, "StagesManagement.fetchStages");
        setStagesData([]);
      } finally {
        setLoadingStages(false);
      }
    },
    [],
  );

  const fetchAllStagesForCounts = useCallback(async () => {
    try {
      const all = await getStages();
      setAllStagesData(all);
    } catch (error: unknown) {
      consumeHandledApiError(error, "StagesManagement.fetchAllStagesForCounts");
      setAllStagesData([]);
    }
  }, []);

  useEffect(() => {
    const includeArchived = activeFilter === "deleted";
    const typeFilter =
      activeFilter === "all" || activeFilter === "deleted"
        ? undefined
        : activeFilter;
    fetchStages(
      typeFilter as StageType | undefined,
      includeArchived,
    );
  }, [fetchStages, refreshKey, activeFilter]);

  useEffect(() => {
    fetchAllStagesForCounts();
  }, [fetchAllStagesForCounts, refreshKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createStage(formData);
      toast.success("Stage created successfully!");
      setShowCreateModal(false);
      setFormData({ ...INITIAL_STAGE_FORM });
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Stage Created");
      setSuccessModalDescription("Stage created successfully!");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error: unknown) {
      consumeHandledApiError(error, "StagesManagement.handleSubmit");
      toast.error("Failed to create stage");
    }
  };

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setStageToUpdate(null);
    setFormData({ ...INITIAL_STAGE_FORM });
  };

  const handleUpdateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageToUpdate) return;

    try {
      await updateStage(stageToUpdate.id, formData);
      toast.success("Stage updated successfully!");
      setShowUpdateModal(false);
      setStageToUpdate(null);
      setFormData({ ...INITIAL_STAGE_FORM });
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Stage Updated");
      setSuccessModalDescription("Stage updated successfully!");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error: unknown) {
      consumeHandledApiError(error, "StagesManagement.handleUpdateStage");
      toast.error("Failed to update stage");
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
    } catch (error: unknown) {
      consumeHandledApiError(error, "StagesManagement.handleDeleteStage");
      toast.error("Failed to delete stage");
    }
  };

  const openRestoreModal = useCallback((stage: Stage) => {
    setStageToRestore(stage);
    setShowRestoreModal(true);
  }, []);

  const handleConfirmRestore = useCallback(async () => {
    if (!stageToRestore) return;
    setRestoring(true);
    try {
      await restoreStage(stageToRestore.id);
      toast.success("Stage restored successfully!");
      setShowRestoreModal(false);
      setStageToRestore(null);
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Stage Restored");
      setSuccessModalDescription("Stage has been restored successfully");
      setRefreshKey((oldKey) => oldKey + 1);
    } catch (error: unknown) {
      consumeHandledApiError(error, "StagesManagement.handleConfirmRestore");
      toast.error("Failed to restore stage");
    } finally {
      setRestoring(false);
    }
  }, [stageToRestore]);

  const openStageView = useCallback((stage: Stage) => {
    setViewingStage(stage);
    setShowViewModal(true);
  }, []);

  const openStageEdit = useCallback((stage: Stage) => {
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
  }, []);

  const openStageDelete = useCallback((stage: Stage) => {
    setStageToDelete(stage);
    setShowDeleteModal(true);
  }, []);

  const handleInputChange = <K extends keyof StageFormState>(field: K, value: StageFormState[K]) => {
    setFormData((prev) => {
      if (field === "type" && value === "lost_reason") {
        return { ...prev, type: "lost_reason", probability: 0 };
      }
      return { ...prev, [field]: value };
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

  const stagesTableColumns = useMemo<TableColumn<Stage>[]>(() => {
    const cols: TableColumn<Stage>[] = [];

    if (selectedStagesColumns.includes("name")) {
      cols.push({
        key: "name",
        label: "Stage Name",
        sortable: true,
        type: "custom",
        render: (stage: Stage) => (
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
        ),
      });
    }

    if (selectedStagesColumns.includes("sequence")) {
      cols.push({
        key: "sequence",
        label: "Sequence",
        sortable: true,
        align: "center",
        type: "custom",
        render: (stage: Stage) => <span className="fw-bold">{stage.sequence}</span>,
      });
    }

    if (selectedStagesColumns.includes("type")) {
      cols.push({
        key: "type",
        label: "Type",
        sortable: true,
        type: "custom",
        render: (stage: Stage) => (
          <Badge
            bg={getTypeBadgeColor(stage.type)}
            className="bg-opacity-10 text-dark"
          >
            {getTypeDisplayName(stage.type)}
          </Badge>
        ),
      });
    }

    if (selectedStagesColumns.includes("description")) {
      cols.push({
        key: "description",
        label: "Description",
        sortable: false,
        type: "custom",
        width: "260px",
        render: (stage: Stage) => (
          <CrmTruncatedDescriptionCell
            text={stage.description}
            emptyDisplay="No description"
          />
        ),
      });
    }

    if (selectedStagesColumns.includes("color")) {
      cols.push({
        key: "color",
        label: "Color",
        sortable: false,
        type: "custom",
        render: (stage: Stage) => <CrmColorCell color={stage.color} />,
      });
    }

    cols.push({
      key: "actions",
      label: "Actions",
      sortable: false,
      type: "custom",
      render: (stage: Stage) => (
        <div className="d-flex gap-1">
          {activeFilter === "deleted" ? (
            <>
              <Button
                variant="link"
                size="sm"
                className="p-1"
                title="View"
                onClick={() => openStageView(stage)}
                aria-label={"View stage " + stage.name}
              >
                <Eye size={16} aria-hidden />
              </Button>
              <Button
                variant="link"
                size="sm"
                className="p-1 text-success"
                title="Restore"
                onClick={() => openRestoreModal(stage)}
                aria-label={"Restore stage " + stage.name}
              >
                <RotateCcw size={16} aria-hidden />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="link"
                size="sm"
                className="p-1"
                title="View"
                onClick={() => openStageView(stage)}
                aria-label={"View stage " + stage.name}
              >
                <Eye size={16} aria-hidden />
              </Button>
              {session?.user?.permissions?.includes(PERMISSION_EDIT_STAGES) && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-1"
                  title="Edit Stage"
                  onClick={() => openStageEdit(stage)}
                  aria-label={"Edit stage " + stage.name}
                >
                  <Edit size={16} aria-hidden />
                </Button>
              )}
              {session?.user?.permissions?.includes(PERMISSION_DELETE_STAGES) && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-1 text-danger"
                  title="Delete Stage"
                  onClick={() => openStageDelete(stage)}
                  aria-label={"Delete stage " + stage.name}
                >
                  <Trash2 size={16} aria-hidden />
                </Button>
              )}
            </>
          )}
        </div>
      ),
    });

    return cols;
  }, [
    selectedStagesColumns,
    activeFilter,
    session?.user?.permissions,
    openStageView,
    openRestoreModal,
    openStageEdit,
    openStageDelete,
  ]);

  const sortData = <T,>(
    data: T[],
    sortColumn: string,
    sortDirection: "asc" | "desc",
  ): T[] => {
    if (!sortColumn) return data;

    const cell = (row: T, key: string): unknown =>
      (row as Record<string, unknown>)[key];

    return [...data].sort((a, b) => {
      let aVal = cell(a, sortColumn);
      let bVal = cell(b, sortColumn);

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

  const sortedStages = useMemo(
    () => sortData(filteredStages, stagesPagination.sortColumn, stagesPagination.sortDirection),
    [filteredStages, stagesPagination.sortColumn, stagesPagination.sortDirection],
  );

  const paginatedStages = useMemo(
    () =>
      paginateData(
        sortedStages,
        stagesPagination.currentPage,
        stagesPagination.rowsPerPage,
      ),
    [sortedStages, stagesPagination.currentPage, stagesPagination.rowsPerPage],
  );

  const handleStagesSort = useCallback(
    (column: string, direction: "asc" | "desc") => {
      setStagesPagination((prev) => ({
        ...prev,
        sortColumn: column,
        sortDirection: direction,
        currentPage: 1,
      }));
    },
    [],
  );

  const handleStagesPaginationChange = useCallback(
    (page: number, rowsPerPage: number) => {
      setStagesPagination((prev) => ({
        ...prev,
        currentPage: rowsPerPage === prev.rowsPerPage ? page : 1,
        rowsPerPage,
      }));
    },
    [],
  );

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

  // Calculate filter counts — always from the full unfiltered dataset
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allStagesData.length,
      lead: allStagesData.filter((s) => s.type === "lead").length,
      deal: allStagesData.filter((s) => s.type === "deal").length,
      order: allStagesData.filter((s) => s.type === "order").length,
      lost_reason: allStagesData.filter((s) => s.type === "lost_reason").length,
      deleted: 0,
    };
    return counts;
  }, [allStagesData]);

  const handleToolbarSearchChange = useCallback((value: string) => {
    setStagesSearch(value);
    setCurrentFilters((prev) => ({ ...prev, search: value }));
    setStagesPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  const handleToolbarSearchSubmit = useCallback(() => {
    setCurrentFilters((prev) => ({ ...prev, search: stagesSearch }));
    setStagesPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [stagesSearch]);

  const handleToolbarTabChange = useCallback((tabId: string) => {
    setActiveFilter(tabId);
    setStagesPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, []);

  const toggleStagesAnalytics = useCallback(() => {
    setShowStagesAnalytics((open) => !open);
  }, []);

  const openCreateStageModal = useCallback(() => setShowCreateModal(true), []);

  const toolbarConfig = useMemo<ToolbarConfig>(
    () => ({
      showSearch: true,
      searchValue: stagesSearch,
      searchPlaceholder: "Search stages...",
      onSearchChange: handleToolbarSearchChange,
      onSearch: handleToolbarSearchSubmit,
      showTabs: true,
      tabs: [
        { id: "all", label: "All Types", count: filterCounts.all, removable: false },
        { id: "lead", label: "Lead", count: filterCounts.lead, removable: false },
        { id: "deal", label: "Deal", count: filterCounts.deal, removable: false },
        { id: "order", label: "Order", count: filterCounts.order, removable: false },
        { id: "lost_reason", label: "Lost Reason", count: filterCounts.lost_reason, removable: false },
        { id: "deleted", label: "Deleted", removable: false },
      ],
      activeTab: activeFilter,
      onTabChange: handleToolbarTabChange,
      rightActions: (
        <div className="d-flex gap-2">
          <Button
            variant={showStagesAnalytics ? "primary" : "light"}
            onClick={toggleStagesAnalytics}
            style={{
              border: "1px solid #dee2e6",
              borderRadius: "8px",
              color: showStagesAnalytics ? undefined : "#212529",
              height: "33px",
              fontSize: "0.875rem",
              padding: "0 12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <BarChart3 size={15} aria-hidden />
            Analytics
          </Button>
          {session?.user?.permissions?.includes(PERMISSION_ADD_STAGES) && (
            <Button
              onClick={openCreateStageModal}
              style={{
                backgroundColor: "#4f46e5",
                border: "none",
                borderRadius: "8px",
                color: "#ffffff",
                height: "33px",
                fontSize: "0.875rem",
                padding: "0 12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Plus size={15} aria-hidden />
              Add Custom Stage
            </Button>
          )}
        </div>
      ),
    }),
    [
      stagesSearch,
      activeFilter,
      filterCounts,
      showStagesAnalytics,
      session?.user?.permissions,
      handleToolbarSearchChange,
      handleToolbarSearchSubmit,
      handleToolbarTabChange,
      toggleStagesAnalytics,
      openCreateStageModal,
    ],
  );

  if (!session?.user?.permissions?.includes(PERMISSION_LIST_STAGES)) {
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
                            label={(props) => {
                              const slice = props as unknown as {
                                type?: string;
                                count?: number;
                                payload?: { type?: string; count?: number };
                              };
                              const p = slice.payload ?? slice;
                              return `${p.type ?? ""}: ${p.count ?? 0}`;
                            }}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {analyticsData.stagesByType.map((entry) => (
                              <Cell
                                key={`pie-slice-${entry.type}`}
                                fill={entry.fill}
                              />
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

        {/* Stages Table */}
        <div className="stages-table-wrapper mb-4">
          <GenericTable<Stage>
            data={paginatedStages}
            columns={stagesTableColumns}
            actions={[]}
            showActions={false}
            sortable
            defaultSortColumn={stagesPagination.sortColumn}
            defaultSortDirection={stagesPagination.sortDirection}
            onSort={handleStagesSort}
            loading={loadingStages}
            emptyMessage="No stages found matching your criteria"
            pagination={{
              currentPage: stagesPagination.currentPage,
              rowsPerPage: stagesPagination.rowsPerPage,
              totalRows: filteredStages.length,
              pageSizeOptions: [10, 25, 50, 100],
            }}
            onPaginationChange={handleStagesPaginationChange}
            customizableColumns
            selectedColumns={selectedStagesColumns}
            defaultSelectedColumns={[
              "sequence",
              "name",
              "type",
              "description",
              "color",
              "actions",
            ]}
            onColumnChange={(cols) => {
              const normalized = normalizeSelectedStageColumns(cols);
              setSelectedStagesColumns(normalized);
              localStorage.setItem(
                "stagesSelectedColumns",
                JSON.stringify(normalized),
              );
            }}
            columnStorageKey="stagesSelectedColumns"
            showToolbar={true}
            toolbar={toolbarConfig}
            showToolbarActions={false}
            uniqueKey="id"
          />
        </div>
      </div>

      <FormModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        title="Create Stage"
        desc="Please fill in the details below to create a new stage."
        size="lg"
        formHtml={
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Stage Name <span className="text-danger">*</span>
                    </Form.Label>
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
                    <Form.Label>
                      Sequence <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.sequence}
                      onChange={(e) =>
                        handleInputChange(
                          "sequence",
                          parseSequenceInput(e.target.value, formData.sequence),
                        )
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
                    <Form.Label>
                      Type <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      value={formData.type}
                      onChange={(e) =>
                        handleInputChange(
                          "type",
                          e.target.value as StageType,
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
                      onChange={(e) => {
                        const n = Number.parseInt(e.target.value, 10);
                        handleInputChange(
                          "probability",
                          Number.isNaN(n) ? 0 : Math.min(100, Math.max(0, n)),
                        );
                      }}
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
        }
        submitButtonText="Create Stage"
        cancelButtonText="Cancel"
        onSubmit={() => {
          handleSubmit(scaffoldFormEvent()).catch((error: unknown) => {
            consumeHandledApiError(error, "StagesManagement.createStageSubmit");
          });
        }}
        onCancel={() => setShowCreateModal(false)}
        submitButtonVariant="primary"
        cancelButtonVariant="secondary"
        useCrmDialogFooterStyle
      />

      {/* Update Stage Modal */}
      <FormModal
        show={showUpdateModal}
        onHide={handleCloseUpdateModal}
        title="Update Stage"
        desc="Please update the details below for this stage."
        size="lg"
        formHtml={
            <Form onSubmit={handleUpdateStage}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Stage Name <span className="text-danger">*</span>
                    </Form.Label>
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
                    <Form.Label>
                      Sequence <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.sequence}
                      onChange={(e) =>
                        handleInputChange(
                          "sequence",
                          parseSequenceInput(e.target.value, formData.sequence),
                        )
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
                    <Form.Label>
                      Type <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      value={formData.type}
                      onChange={(e) =>
                        handleInputChange(
                          "type",
                          e.target.value as StageType,
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
                      onChange={(e) => {
                        const n = Number.parseInt(e.target.value, 10);
                        handleInputChange(
                          "probability",
                          Number.isNaN(n) ? 0 : Math.min(100, Math.max(0, n)),
                        );
                      }}
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
        }
        submitButtonText="Update Stage"
        cancelButtonText="Cancel"
        onSubmit={() => {
          handleUpdateStage(scaffoldFormEvent()).catch((error: unknown) => {
            consumeHandledApiError(error, "StagesManagement.updateStageSubmit");
          });
        }}
        onCancel={handleCloseUpdateModal}
        submitButtonVariant="primary"
        cancelButtonVariant="secondary"
        useCrmDialogFooterStyle
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

      <Modal
        show={showRestoreModal}
        onHide={() => {
          if (restoring) return;
          setShowRestoreModal(false);
          setStageToRestore(null);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Restore stage</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {stageToRestore && (
            <p className="mb-0">
              Restore <strong>{stageToRestore.name}</strong>? It will be available again in the pipeline.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <div
            className="w-100 d-flex justify-content-end"
            style={CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE}
          >
            <Button
              variant="primary"
              onClick={() => {
                handleConfirmRestore().catch((error: unknown) => {
                  consumeHandledApiError(error, "StagesManagement.restoreStageSubmit");
                });
              }}
              disabled={restoring}
              style={CRM_DIALOG_PRIMARY_BUTTON_STYLE}
            >
              {restoring ? "Restoring…" : "Restore"}
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => {
                setShowRestoreModal(false);
                setStageToRestore(null);
              }}
              disabled={restoring}
              style={CRM_DIALOG_SECONDARY_BUTTON_STYLE}
            >
              Cancel
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

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
              type="button"
              aria-label="Close stage details"
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
              onFocus={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.3)";
                e.currentTarget.style.transform = "rotate(90deg)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                e.currentTarget.style.transform = "rotate(0deg)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                e.currentTarget.style.transform = "rotate(0deg)";
              }}
            >
              <X size={20} aria-hidden />
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
            <CrmDescriptionDetailsBlock
              text={viewingStage.description}
              emptyDisplay="No description"
            />

            {/* Action Buttons */}
            <div
              style={{
                ...CRM_DIALOG_FOOTER_ACTIONS_ROW_STYLE,
                width: "100%",
                justifyContent: "flex-end",
                paddingTop: "20px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              {session?.user?.permissions?.includes(PERMISSION_EDIT_STAGES) && (
                <Button
                  variant="primary"
                  style={CRM_DIALOG_PRIMARY_BUTTON_STYLE}
                  onClick={() => {
                    setShowViewModal(false);
                    openStageEdit(viewingStage);
                  }}
                >
                  <FiEdit2 size={16} aria-hidden />
                  Edit Stage
                </Button>
              )}
              <Button
                variant="outline-secondary"
                style={CRM_DIALOG_SECONDARY_BUTTON_STYLE}
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
        onHide={handleCloseSuccessfulModal}
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
