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
import {
  getCampaigns,
  deleteCampaign,
  createCampaign,
  updateCampaign,
  getCampaign,
  CampaignMetrics,
  uploadCrmDataCsv,
  getCrmDataTags,
  getCrmDataCounts,
  assignCrmDataAdvanced,
  downloadExampleCsv,
  getIndustries,
  getDealTemplates,
  IndustryData,
  DealTemplateData,
} from "@utils/crm";
import {
  Button,
  Modal,
  Row,
  Col,
  Badge,
  Form,
  Card,
  Alert,
  Table,
  Dropdown,
  InputGroup,
} from "react-bootstrap";
import {
  FiEdit,
  FiTrash2,
  FiEye,
  FiPlus,
  FiCalendar,
  FiFilter,
  FiDatabase,
  FiUsers,
} from "react-icons/fi";
import {
  X,
  FileText,
  Megaphone,
  Users,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Target,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Edit,
  Eye,
  Trash2,
  Calendar,
  User,
  Download,
  AlertCircle as AlertCircleIcon,
  Hash,
  Briefcase,
  RefreshCw,
  UserPlus,
  Building2,
  Plus,
} from "lucide-react";
import { toast } from "react-toastify";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { GetHierarchyData } from "@utils/users";
import axiosInstance from "@utils/axios";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
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
  Legend,
} from "recharts";

import FormModal from "@pages/partial/FormModal";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { ModuleSlug, checkRequiredFields } from "@utils/Helper";
import { useSession } from "next-auth/react";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import moment from "moment";

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

const CrmCampaigns = () => {
  const { data: session } = useSession();

  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const [campaignsData, setCampaignsData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<CampaignMetrics>({
    active_campaigns: 0,
    inactive_campaigns: 0,
  });
  const [totalCampaigns, setTotalCampaigns] = useState(0);

  // UI State
  const [showCampaignsAnalytics, setShowCampaignsAnalytics] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [campaignsSearch, setCampaignsSearch] = useState("");
  const [campaignsPagination, setCampaignsPagination] = useState({
    currentPage: 1,
    rowsPerPage: 10,
    sortColumn: "",
    sortDirection: "asc" as "asc" | "desc",
  });
  const [campaignFilters, setCampaignFilters] = useState({
    status: [] as string[],
    dateFrom: null as string | null,
    dateTo: null as string | null,
    userExtensions: null as string[] | null,
    hasUnassignedProspects: null as boolean | null,
    tags: null as string[] | null,
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "active",
    options: {} as Record<string, any>,
  });

  // Campaign fields management
  const [campaignFields, setCampaignFields] = useState<any[]>([]);
  const [newField, setNewField] = useState({
    field_name: "",
    field_type: "string",
    field_options: [] as string[],
    sort_order: 0,
    is_required: false,
  });

  // Extensions and campaign users
  const [extensions, setExtensions] = useState<any[]>([]);
  const [campaignUsers, setCampaignUsers] = useState<readonly any[]>([]);

  // Industries and Deal Templates
  const [industries, setIndustries] = useState<IndustryData[]>([]);
  const [dealTemplates, setDealTemplates] = useState<DealTemplateData[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<readonly any[]>([]);
  const [selectedDealTemplate, setSelectedDealTemplate] = useState<any>(null);

  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fieldTags, setFieldTags] = useState<readonly any[]>([]);
  const [uploadSelectedCampaigns, setUploadSelectedCampaigns] = useState<readonly any[]>([]);
  const [availableTags, setAvailableTags] = useState<Array<{ value: string; label: string; id: number }>>([]);
  const [availableCampaignsForUpload, setAvailableCampaignsForUpload] = useState<Array<{ value: string; label: string; id: number }>>([]);
  const [autoDistributeToUsers, setAutoDistributeToUsers] = useState(false);

  // Data assignment modal states
  const [showDataAssignmentModal, setShowDataAssignmentModal] = useState(false);
  const [assignmentFilterCampaigns, setAssignmentFilterCampaigns] = useState<string[]>([]);
  const [assignmentFilterTags, setAssignmentFilterTags] = useState<readonly any[]>([]);
  const [assignmentType, setAssignmentType] = useState<string>("");
  const [assignmentTargetType, setAssignmentTargetType] = useState<"campaigns" | "users">("campaigns");
  const [distributionMode, setDistributionMode] = useState<string>("equal");
  const [selectedUserExtensions, setSelectedUserExtensions] = useState<readonly any[]>([]);
  const [assignToCampaigns, setAssignToCampaigns] = useState<string[]>([]);
  const [recordsToAssign, setRecordsToAssign] = useState<number>(0);
  const [includeAssignedRecords, setIncludeAssignedRecords] = useState<boolean>(false);
  const [dataManagementExtensions, setDataManagementExtensions] = useState<any[]>([]);
  const [assignmentCounts, setAssignmentCounts] = useState({ total: 0, assigned: 0, unassigned: 0 });
  const [customDistribution, setCustomDistribution] = useState<Record<string, number>>({});
  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");
  const [assigningData, setAssigningData] = useState(false);

  // Fetch extensions data
  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_CAMPAIGNS);
        setExtensions(hierarchyData?.extensions || []);
      } catch (error) {
        console.error("Failed to fetch extensions:", error);
      }
    };
    fetchExtensions();
  }, []);

  useEffect(() => {
    const fetchDataManagementExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_DATA_MANAGEMENT);
        setDataManagementExtensions(hierarchyData?.extensions || []);
      } catch (error) {
        console.error("Failed to fetch data management extensions:", error);
      }
    };
    fetchDataManagementExtensions();
  }, []);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await getCrmDataTags();
        setAvailableTags(tags.map((tag) => ({ value: tag.name, label: tag.name, id: tag.id })));
      } catch {
        setAvailableTags([]);
      }
    };
    loadTags();
  }, [refreshKey]);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const campaignsResponse = await getCampaigns({ per_page: 1000 });
        setAvailableCampaignsForUpload(
          campaignsResponse.data.map((campaign) => ({
            value: campaign.id.toString(),
            label: campaign.name,
            id: campaign.id,
          }))
        );
      } catch {
        setAvailableCampaignsForUpload([]);
      }
    };
    loadCampaigns();
  }, [refreshKey]);

  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const response = await getIndustries({ per_page: 1000 });
        setIndustries(response.data || []);
      } catch {
        setIndustries([]);
      }
    };
    loadIndustries();
  }, []);

  useEffect(() => {
    const loadDealTemplates = async () => {
      try {
        const response = await getDealTemplates({ per_page: 1000 });
        setDealTemplates(response.data || []);
      } catch {
        setDealTemplates([]);
      }
    };
    loadDealTemplates();
  }, []);

  const getUserNames = (userExtensions: any[]) => {
    if (!userExtensions || userExtensions.length === 0) return "No users assigned";
    const maxDisplay = 2;
    const userNames = userExtensions
      .map((ue) => {
        const extension = extensions.find((ext) => ext.id == ue.user_extension);
        return extension?.display_name || extension?.name || `Extension ${ue.user_extension}`;
      })
      .filter(Boolean);
    if (userNames.length <= maxDisplay) return userNames.join(", ");
    return `${userNames.slice(0, maxDisplay).join(", ")} +${userNames.length - maxDisplay} more`;
  };

  const customSelectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: "38px",
      fontSize: "0.875rem",
      borderColor: state.isFocused ? "#86b7fe" : "#dee2e6",
      boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(13, 110, 253, 0.25)" : "none",
      "&:hover": { borderColor: "#86b7fe" },
    }),
    multiValue: (provided: any) => ({ ...provided, backgroundColor: "#0d6efd", color: "white", fontSize: "0.813rem" }),
    multiValueLabel: (provided: any) => ({ ...provided, color: "white", padding: "2px 6px" }),
    multiValueRemove: (provided: any) => ({ ...provided, color: "white", "&:hover": { backgroundColor: "#0b5ed7", color: "white" } }),
    menu: (provided: any) => ({ ...provided, fontSize: "0.875rem" }),
  };

  const getUserNameByExtension = (extension: string) => {
    const ext = dataManagementExtensions.find(
      (e: any) => e.id?.toString() === extension.trim() || e.extension?.toString() === extension.trim()
    );
    return ext?.display_name || ext?.name || `Extension ${extension.trim()}`;
  };

  const getMaxRecords = () => includeAssignedRecords ? assignmentCounts.total : assignmentCounts.unassigned;

  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
  };

  const handleNumberChange = (value: string, max: number, setter: (val: number) => void) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    if (cleaned === "") { setter(0); return; }
    const numValue = parseInt(cleaned, 10);
    setter(numValue < 0 ? 0 : numValue > max ? max : numValue);
  };

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters((prev) => {
      const merged = { ...prev, ...filters };
      for (const key in merged) {
        if (merged[key] === null || merged[key] === undefined || (Array.isArray(merged[key]) && merged[key].length === 0)) {
          delete merged[key];
        }
      }
      return merged;
    });
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Fetch campaigns data
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setLoading(true);
        let statusFilter: string[] = [];
        if (activeFilter === "active") statusFilter = ["active"];
        else if (activeFilter === "inactive") statusFilter = ["inactive"];
        const combinedStatus = campaignFilters.status.length > 0 ? campaignFilters.status : statusFilter;
        const filters: Record<string, any> = { ...memoizedFilters };
        if (combinedStatus.length > 0) filters.status = combinedStatus.length === 1 ? combinedStatus[0] : combinedStatus;
        if (campaignFilters.dateFrom) filters.date_from = campaignFilters.dateFrom;
        if (campaignFilters.dateTo) filters.date_to = campaignFilters.dateTo;
        if (campaignFilters.userExtensions?.length) filters.user_extensions = campaignFilters.userExtensions;
        if (campaignFilters.hasUnassignedProspects !== null) filters.has_unassigned_prospects = campaignFilters.hasUnassignedProspects;
        if (campaignFilters.tags?.length) filters.tags = campaignFilters.tags;

        const response = await getCampaigns({
          page: campaignsPagination.currentPage,
          per_page: campaignsPagination.rowsPerPage,
          search: memoizedFilters.search || campaignsSearch || undefined,
          filters,
          module_slug: ModuleSlug.CRM_CAMPAIGNS,
        });

        if (response?.data) {
          setCampaignsData(response.data);
          setMetrics(response.metrics);
          setTotalCampaigns(response.total || response.data.length);
        }
      } catch (error) {
        console.error("Failed to fetch campaigns:", error);
        toast.error("Failed to load campaigns");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.permissions?.includes("list-crm-campaigns")) {
      loadCampaigns();
    }
  }, [refreshKey, campaignsPagination, memoizedFilters, campaignFilters, activeFilter, campaignsSearch, session]);

  // Modal handlers
  const handleCreateCampaign = useCallback(() => {
    setFormData({ name: "", description: "", start_date: "", end_date: "", status: "active", options: {} });
    setCampaignFields([]);
    setCampaignUsers([]);
    setSelectedIndustries([]);
    setSelectedDealTemplate(null);
    setNewField({ field_name: "", field_type: "string", field_options: [], sort_order: 0, is_required: false });
    setShowCreateModal(true);
  }, []);

  const handleEditCampaign = useCallback(async (campaign: any) => {
    try {
      setLoading(true);
      const campaignData = await getCampaign(campaign.id);
      setSelectedCampaign(campaignData);
      setFormData({
        name: campaignData.name || "",
        description: campaignData.description || "",
        start_date: campaignData.start_date ? campaignData.start_date.split("T")[0] : "",
        end_date: campaignData.end_date ? campaignData.end_date.split("T")[0] : "",
        status: campaignData.status || "active",
        options: campaignData.options || {},
      });
      setCampaignFields(campaignData.fields || []);

      if (campaignData.user_extensions?.length) {
        setCampaignUsers(
          campaignData.user_extensions.map((ue: any) => {
            const extension = extensions.find((ext) => ext.id == ue.user_extension);
            return { value: ue.user_extension, label: extension?.display_name || extension?.name || ue?.user_extension };
          })
        );
      } else {
        setCampaignUsers([]);
      }

      const industriesData = (campaignData as any).industries;
      const industryIds = (campaignData as any).industry_ids;
      if (industriesData?.length) {
        setSelectedIndustries(industriesData.map((ind: any) => ({ value: ind.id.toString(), label: ind.name || `Industry ${ind.id}`, id: ind.id })));
      } else if (industryIds?.length) {
        setSelectedIndustries(industryIds.map((id: number) => {
          const industry = industries.find((ind) => ind.id === id);
          return { value: id.toString(), label: industry?.name || `Industry ${id}`, id };
        }));
      } else {
        setSelectedIndustries([]);
      }

      const dealTemplateData = (campaignData as any).deal_template;
      const dealTemplateId = (campaignData as any).deal_template_id;
      if (dealTemplateData?.id) {
        setSelectedDealTemplate({ value: dealTemplateData.id.toString(), label: dealTemplateData.name || `Deal Template ${dealTemplateData.id}`, id: dealTemplateData.id });
      } else if (dealTemplateId) {
        const dt = dealTemplates.find((d) => d.id === parseInt(dealTemplateId.toString()));
        setSelectedDealTemplate({ value: dealTemplateId.toString(), label: dt?.name || `Deal Template ${dealTemplateId}`, id: parseInt(dealTemplateId.toString()) });
      } else {
        setSelectedDealTemplate(null);
      }

      setNewField({ field_name: "", field_type: "string", field_options: [], sort_order: 0, is_required: false });
      setShowEditModal(true);
    } catch {
      toast.error("Failed to fetch campaign details");
    } finally {
      setLoading(false);
    }
  }, [extensions, industries, dealTemplates]);

  const handleViewCampaign = useCallback(async (campaign: any) => {
    try {
      setLoading(true);
      const campaignData = await getCampaign(campaign.id);
      setSelectedCampaign(campaignData);
      setShowViewModal(true);
    } catch {
      toast.error("Failed to fetch campaign details");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteCampaign = useCallback((campaign: any) => {
    setSelectedCampaign(campaign);
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteCampaign = useCallback(async () => {
    if (!selectedCampaign) return;
    try {
      setLoading(true);
      await deleteCampaign(selectedCampaign.id);
      setShowDeleteModal(false);
      setSelectedCampaign(null);
      toast.success("Campaign deleted successfully!");
      setRefreshKey((prev) => prev + 1);
    } catch {
      toast.error("Failed to delete campaign");
    } finally {
      setLoading(false);
    }
  }, [selectedCampaign]);

  const getTodayDate = useCallback((startDateParam: string = "") => {
    let today = new Date();
    if (startDateParam) {
      const startDate = new Date(startDateParam);
      if (moment(startDate).isBefore(today)) today = startDate;
    }
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const getMinEndDate = useCallback(() => {
    const today = getTodayDate();
    if (formData.start_date) {
      const startDate = new Date(formData.start_date);
      startDate.setDate(startDate.getDate() + 1);
      const nextDay = startDate.toISOString().split("T")[0];
      return nextDay > today ? nextDay : today;
    }
    return today;
  }, [formData.start_date, getTodayDate]);

  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    const today = getTodayDate();
    if (!showEditModal && newStartDate && newStartDate < today) {
      toast.error("Start date must be today or a future date");
      return;
    }
    setFormData((prev) => {
      if (prev.end_date && newStartDate && newStartDate >= prev.end_date) return { ...prev, start_date: newStartDate, end_date: "" };
      return { ...prev, start_date: newStartDate };
    });
  }, [getTodayDate, showEditModal]);

  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    const minEndDate = getMinEndDate();
    if (!showEditModal && newEndDate && newEndDate < minEndDate) {
      toast.error(`End date must be after ${new Date(formData.start_date || minEndDate).toLocaleDateString()}`);
      return;
    }
    if (formData.start_date && newEndDate && newEndDate <= formData.start_date) {
      toast.error("End date must be after start date");
      return;
    }
    setFormData((prev) => ({ ...prev, end_date: newEndDate }));
  }, [formData.start_date, getMinEndDate, showEditModal]);

  const handleFormSubmit = useCallback(async () => {
    const requiredFields: Array<{ field: keyof typeof formData; name: string; required: boolean }> = [
      { field: "name", name: "Campaign Name", required: true },
      { field: "start_date", name: "Start Date", required: true },
      { field: "end_date", name: "End Date", required: true },
    ];
    if (!checkRequiredFields(formData, requiredFields)) return;

    const today = getTodayDate();
    if (!showEditModal) {
      if (formData.start_date && formData.start_date < today) { toast.error("Start date must be today or a future date"); return; }
      if (formData.end_date && formData.end_date < today) { toast.error("End date must be today or a future date"); return; }
    }
    if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
      toast.error("End date must be after start date"); return;
    }

    try {
      setLoading(true);
      const cleanedFields = campaignFields.map((field) => {
        if (field.field_type === "dropdown" && field.field_options) {
          return { ...field, field_options: field.field_options.filter((opt: string) => opt.trim() !== "") };
        }
        return field;
      });

      const campaignData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        status: formData.status as "active" | "inactive",
        fields: cleanedFields,
        campaign_users: campaignUsers.map((user) => user.value),
        industry_ids: selectedIndustries.map((ind: any) => parseInt(ind.value || ind.id)),
        deal_template_id: selectedDealTemplate ? parseInt(selectedDealTemplate.value || selectedDealTemplate.id) : undefined,
      };

      if (showEditModal && selectedCampaign) {
        await updateCampaign(selectedCampaign.id, campaignData);
        toast.success("Campaign updated successfully!");
        setShowEditModal(false);
      } else {
        await createCampaign(campaignData);
        toast.success("Campaign created successfully!");
        setShowCreateModal(false);
      }
      setSelectedCampaign(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      toast.error(error.message || "Failed to save campaign");
    } finally {
      setLoading(false);
    }
  }, [formData, campaignFields, campaignUsers, selectedIndustries, selectedDealTemplate, showEditModal, selectedCampaign, getTodayDate]);

  // Field management
  const handleAddField = useCallback(() => {
    if (!newField.field_name.trim()) { toast.error("Field name is required"); return; }
    setCampaignFields([...campaignFields, { ...newField, field_name: newField.field_name.trim(), sort_order: campaignFields.length }]);
    setNewField({ field_name: "", field_type: "string", field_options: [], sort_order: 0, is_required: false });
  }, [newField, campaignFields]);

  const handleRemoveField = useCallback((index: number) => setCampaignFields(campaignFields.filter((_, i) => i !== index)), [campaignFields]);

  const handleFieldTypeChange = useCallback((index: number, fieldType: string) => {
    const updated = [...campaignFields];
    updated[index].field_type = fieldType;
    if (fieldType !== "dropdown") updated[index].field_options = [];
    setCampaignFields(updated);
  }, [campaignFields]);

  const handleFieldOptionChange = useCallback((index: number, optionIndex: number, value: string) => {
    const updated = [...campaignFields];
    if (!updated[index].field_options) updated[index].field_options = [];
    updated[index].field_options[optionIndex] = value;
    setCampaignFields(updated);
  }, [campaignFields]);

  const handleAddFieldOption = useCallback((index: number) => {
    const updated = [...campaignFields];
    if (!updated[index].field_options) updated[index].field_options = [];
    const options = updated[index].field_options;
    if (options.length > 0 && options[options.length - 1].trim() === "") {
      toast.error("Please fill in the current option before adding a new one"); return;
    }
    updated[index].field_options.push("");
    setCampaignFields(updated);
  }, [campaignFields]);

  const handleRemoveFieldOption = useCallback((index: number, optionIndex: number) => {
    const updated = [...campaignFields];
    updated[index].field_options.splice(optionIndex, 1);
    setCampaignFields(updated);
  }, [campaignFields]);

  const validateCsvFile = (file: File): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (!file.type.includes("csv") && !file.name.toLowerCase().endsWith(".csv")) errors.push("File must be a CSV file");
    if (file.size > 2 * 1024 * 1024) errors.push("File size must be less than 2MB");
    if (file.size === 0) errors.push("File cannot be empty");
    return { isValid: errors.length === 0, errors };
  };

  const handleFileSelect = (file: File) => {
    const validation = validateCsvFile(file);
    if (validation.isValid) setSelectedFile(file);
    else validation.errors.forEach((error) => toast.error(error));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!session?.user?.permissions?.includes("add-crm-data-management")) {
      toast.error("You don't have permission to upload data"); return;
    }
    if (!selectedFile) { toast.error("Please select a file to upload"); return; }

    setUploading(true);
    setUploadProgress(0);
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => { if (prev >= 90) { clearInterval(progressInterval); return prev; } return prev + 10; });
      }, 200);

      const response: any = await uploadCrmDataCsv(
        selectedFile,
        Array.from(uploadSelectedCampaigns).map((c) => c.value),
        Array.from(fieldTags).map((tag) => tag.value),
        autoDistributeToUsers,
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      const responseData = response?.data || {};
      const processedCount = responseData.processed_count || 0;
      const validationFailures = responseData.validation_failures || 0;

      if (processedCount > 0) {
        let msg = `Successfully processed ${processedCount} record${processedCount !== 1 ? "s" : ""}`;
        if (validationFailures > 0) msg += ` with ${validationFailures} validation failure${validationFailures !== 1 ? "s" : ""}`;
        validationFailures > 0 ? toast.warn(msg) : toast.success(msg);
      } else if (validationFailures > 0) {
        toast.error(`Upload failed: All ${validationFailures} record${validationFailures !== 1 ? "s" : ""} failed validation`);
      } else {
        toast.error("Upload completed but no records were processed");
      }

      setSelectedFile(null);
      setFieldTags([]);
      setUploadSelectedCampaigns([]);
      setAutoDistributeToUsers(false);
      setShowUploadModal(false);
      setUploadProgress(0);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to upload file. Please try again.");
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const calculateEntryCounts = useCallback(async () => {
    try {
      const campaignIds = assignmentFilterCampaigns.map((c) => parseInt(c)).filter((id) => !isNaN(id) && id > 0);
      const tags = assignmentFilterTags.map((tag: any) => tag.value || tag);
      const counts = await getCrmDataCounts(campaignIds, tags);
      return { total: counts.summary.total_records, assigned: counts.summary.assigned_records, unassigned: counts.summary.unassigned_records };
    } catch {
      return { total: 5000, assigned: 2000, unassigned: 3000 };
    }
  }, [assignmentFilterCampaigns, assignmentFilterTags]);

  useEffect(() => {
    const refetchCounts = async () => {
      if (showDataAssignmentModal) {
        const counts = await calculateEntryCounts();
        setAssignmentCounts(counts);
        if (recordsToAssign === 0 || recordsToAssign > counts.unassigned) setRecordsToAssign(counts.unassigned);
      }
    };
    refetchCounts();
  }, [assignmentFilterCampaigns, assignmentFilterTags, calculateEntryCounts, showDataAssignmentModal]);

  const handleDataAssignment = useCallback(async () => {
    try {
      const counts = await calculateEntryCounts();
      setAssignmentCounts(counts);
      setRecordsToAssign(counts.unassigned);
      setShowDataAssignmentModal(true);
    } catch {
      setAssignmentCounts({ total: 5000, assigned: 2000, unassigned: 3000 });
      setRecordsToAssign(3000);
      setShowDataAssignmentModal(true);
    }
  }, [calculateEntryCounts]);

  const resetAssignmentState = () => {
    setAssignmentFilterCampaigns([]);
    setAssignmentFilterTags([]);
    setAssignmentTargetType("campaigns");
    setAssignmentType("");
    setDistributionMode("equal");
    setAssignToCampaigns([]);
    setSelectedUserExtensions([]);
    setRecordsToAssign(0);
    setIncludeAssignedRecords(false);
    setCustomDistribution({});
  };

  const handleDataAssignmentModalClose = useCallback(() => {
    setShowDataAssignmentModal(false);
    resetAssignmentState();
  }, []);

  const handleDataAssignmentSubmit = useCallback(async () => {
    if (!assignmentTargetType) { toast.error("Please select assignment target (Campaigns or Users)"); return; }
    const maxRecords = getMaxRecords();
    if (recordsToAssign === 0 || recordsToAssign > maxRecords) { toast.error(`Please enter a valid number of records (max: ${maxRecords})`); return; }
    if (assignmentTargetType === "campaigns" && (!distributionMode || assignToCampaigns.length === 0)) { toast.error("Please select distribution mode and target campaigns"); return; }
    if (assignmentTargetType === "campaigns" && distributionMode === "custom") {
      const total = Object.values(customDistribution).reduce((sum, count) => sum + count, 0);
      if (total !== recordsToAssign) { toast.error(`Custom allocation must equal total records to assign (${recordsToAssign}). Current total: ${total}`); return; }
    }
    if (assignmentTargetType === "users" && selectedUserExtensions.length === 0) { toast.error("Please select at least one user"); return; }

    setAssigningData(true);
    try {
      const campaignFilterIds = assignmentFilterCampaigns.map((c) => parseInt(c)).filter((id) => !isNaN(id) && id > 0);
      const tagIds = assignmentFilterTags.map((tag: any) => {
        const t = availableTags.find((at) => at.value === (tag.value || tag));
        return t ? t.id : 0;
      }).filter((id) => id > 0);

      let payload: any = { count: recordsToAssign, include_assigned: includeAssignedRecords };
      if (campaignFilterIds.length > 0) payload.campaign_filter_ids = campaignFilterIds;
      if (tagIds.length > 0) payload.tag_ids = tagIds;

      if (assignmentTargetType === "campaigns") {
        const targetCampaignIds = assignToCampaigns.map((c) => {
          const camp = availableCampaignsForUpload.find((ac) => ac.label === c);
          return camp ? parseInt(camp.value) : 0;
        }).filter((id) => id > 0);

        if (targetCampaignIds.length === 0) { toast.error("Please select valid campaigns"); return; }

        payload.campaign_ids = targetCampaignIds;
        payload.distribution_mode = distributionMode === "custom" ? "custom" : distributionMode;
        if (distributionMode === "custom") {
          const dist: Record<number, number> = {};
          Object.entries(customDistribution).forEach(([v, count]) => {
            const id = parseInt(v);
            if (id > 0 && count > 0) dist[id] = count;
          });
          payload.campaign_distribution = dist;
        }
      } else {
        const extensionArray = selectedUserExtensions.map((ext: any) =>
          ext.value || ext.extension?.id?.toString() || ext.extension?.extension?.toString() || ""
        ).filter((e) => e.length > 0);

        if (extensionArray.length === 0) { toast.error("Please select valid users"); setAssigningData(false); return; }
        payload.custom_extensions = extensionArray;
      }

      const response = await axiosInstance.post("/crm/crm_data/assign", payload);
      if (response?.data?.data?.success) {
        toast.success(`Successfully assigned ${recordsToAssign} records!`);
        setShowDataAssignmentModal(false);
        resetAssignmentState();
        setShowSuccessfulModal(true);
        setSuccessModalTitle("Data Assignment Successful!");
        setSuccessModalDescription(`Successfully assigned ${recordsToAssign} records!`);
        setRefreshKey((prev) => prev + 1);
      } else {
        toast.error(response.data.message || "Failed to assign data");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to assign data");
    } finally {
      setAssigningData(false);
    }
  }, [assignmentTargetType, recordsToAssign, distributionMode, assignToCampaigns, selectedUserExtensions, assignmentFilterCampaigns, assignmentFilterTags, availableTags, availableCampaignsForUpload, includeAssignedRecords, customDistribution]);

  const getFieldTypeText = (_fieldType: string) => {
    switch (_fieldType.toLowerCase()) {
      case "string": return "Text";
      case "integer": return "Number";
      case "date": return "Date";
      case "email": return "Email";
      case "dropdown": return "Dropdown";
      default: return _fieldType;
    }
  };

  // --- GenericTable columns ---
  const campaignsTableColumns = useMemo<TableColumn<any>[]>(() => [
    {
      key: "name",
      label: "Campaign Name",
      sortable: true,
      type: "custom",
      render: (campaign: any) => (
        <div>
          <div className="fw-semibold">{campaign.name || "Unnamed Campaign"}</div>
          <div
            className="small text-muted mt-1"
            title={campaign.description || "No Description"}
            style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}
          >
            {campaign.description || "No Description"}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      type: "custom",
      render: (campaign: any) => (
        <Badge bg={campaign.status === "active" ? "success" : "secondary"} className="bg-opacity-10 text-dark">
          {campaign.status?.charAt(0).toUpperCase() + campaign.status?.slice(1) || "Inactive"}
        </Badge>
      ),
    },
    {
      key: "start_date",
      label: "Date Range",
      sortable: true,
      type: "custom",
      render: (campaign: any) => (
        <div>
          <div className="fw-semibold small">
            {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : "No start date"}
          </div>
          <small className="text-muted">
            to {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : "No end date"}
          </small>
        </div>
      ),
    },
    {
      key: "user_extensions",
      label: "Campaign Users",
      sortable: false,
      type: "custom",
      render: (campaign: any) => (
        <span className="text-muted small">{getUserNames(campaign.user_extensions || [])}</span>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      type: "custom",
      render: (campaign: any) => (
        <small className="text-muted">
          {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : "Unknown"}
        </small>
      ),
    },
  ], [extensions]);

  const campaignsTableActions = useMemo(() => {
    const actions: any[] = [];

    if (session?.user?.permissions?.includes("view-crm-campaigns")) {
      actions.push({
        label: "View",
        icon: <Eye size={16} />,
        onClick: (campaign: any) => handleViewCampaign(campaign),
        variant: "link",
        className: "p-1",
      });
    }
    if (session?.user?.permissions?.includes("edit-crm-campaigns")) {
      actions.push({
        label: "Edit",
        icon: <Edit size={16} />,
        onClick: (campaign: any) => handleEditCampaign(campaign),
        variant: "link",
        className: "p-1 text-primary",
      });
    }
    if (session?.user?.permissions?.includes("delete-crm-campaigns")) {
      actions.push({
        label: "Delete",
        icon: <Trash2 size={16} />,
        onClick: (campaign: any) => handleDeleteCampaign(campaign),
        variant: "link",
        className: "p-1 text-danger",
      });
    }

    return actions;
  }, [session?.user?.permissions, handleViewCampaign, handleEditCampaign, handleDeleteCampaign]);

  // Filter counts for tabs
  const filterCounts = useMemo(() => ({
    all: totalCampaigns,
    active: metrics.active_campaigns,
    inactive: metrics.inactive_campaigns,
  }), [totalCampaigns, metrics]);

  const toolbarConfig = useMemo<ToolbarConfig>(() => ({
    showSearch: true,
    searchValue: campaignsSearch,
    searchPlaceholder: "Search campaigns by name, description...",
    onSearchChange: (value) => {
      setCampaignsSearch(value);
    },
    onSearch: () => {
      handleFiltersChange({ search: campaignsSearch });
      setCampaignsPagination((prev) => ({ ...prev, currentPage: 1 }));
      setRefreshKey((prev) => prev + 1);
    },
    showTabs: true,
    tabs: [
      { id: "all", label: "All Campaigns", count: filterCounts.all, removable: false },
      { id: "active", label: "Active", count: filterCounts.active, removable: false },
      { id: "inactive", label: "Inactive", count: filterCounts.inactive, removable: false },
      { id: "assigned", label: "Assigned Records", removable: false },
      { id: "unassigned", label: "Unassigned Records", removable: false },
    ],
    activeTab: activeFilter,
    onTabChange: (tabId) => {
      setActiveFilter(tabId);
      if (tabId === "assigned") {
        setCampaignFilters((prev) => ({ ...prev, hasUnassignedProspects: false }));
      } else if (tabId === "unassigned") {
        setCampaignFilters((prev) => ({ ...prev, hasUnassignedProspects: true }));
      } else {
        setCampaignFilters((prev) => ({ ...prev, hasUnassignedProspects: null }));
      }
      setCampaignsPagination((prev) => ({ ...prev, currentPage: 1 }));
      setRefreshKey((prev) => prev + 1);
    },
    showFiltersButton: true,
    showFilterPills: showAdvancedFilters,
    filterPills: [
      {
        id: "status",
        label: "Status",
        showDropdown: true,
        active: campaignFilters.status.length > 0,
        activeLabel: campaignFilters.status.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", "),
        onClear: () => {
          setCampaignFilters((prev) => ({ ...prev, status: [] }));
          setActiveFilter("all");
          setRefreshKey((prev) => prev + 1);
        },
        dropdownOptions: [
          { label: "Active", value: "active", onClick: () => { setCampaignFilters((prev) => ({ ...prev, status: ["active"] })); setActiveFilter("all"); setRefreshKey((prev) => prev + 1); } },
          { label: "Inactive", value: "inactive", onClick: () => { setCampaignFilters((prev) => ({ ...prev, status: ["inactive"] })); setActiveFilter("all"); setRefreshKey((prev) => prev + 1); } },
          { label: "All", value: "", onClick: () => { setCampaignFilters((prev) => ({ ...prev, status: [] })); setActiveFilter("all"); setRefreshKey((prev) => prev + 1); } },
        ],
      },
      {
        id: "dateFrom",
        label: "Date From",
        showDropdown: true,
        active: !!campaignFilters.dateFrom,
        activeLabel: campaignFilters.dateFrom ? new Date(campaignFilters.dateFrom).toLocaleDateString() : undefined,
        onClear: () => { setCampaignFilters((prev) => ({ ...prev, dateFrom: null })); handleFiltersChange({ date_from: null }); },
        dropdownContent: (
          <Form.Group style={{ minWidth: "200px" }}>
            <Form.Label className="small fw-bold">Date From</Form.Label>
            <Form.Control
              type="date"
              value={campaignFilters.dateFrom || ""}
              onChange={(e) => {
                const v = e.target.value || null;
                setCampaignFilters((prev) => ({ ...prev, dateFrom: v }));
                handleFiltersChange({ date_from: v || null });
              }}
            />
          </Form.Group>
        ),
      },
      {
        id: "dateTo",
        label: "Date To",
        showDropdown: true,
        active: !!campaignFilters.dateTo,
        activeLabel: campaignFilters.dateTo ? new Date(campaignFilters.dateTo).toLocaleDateString() : undefined,
        onClear: () => { setCampaignFilters((prev) => ({ ...prev, dateTo: null })); handleFiltersChange({ date_to: null }); },
        dropdownContent: (
          <Form.Group style={{ minWidth: "200px" }}>
            <Form.Label className="small fw-bold">Date To</Form.Label>
            <Form.Control
              type="date"
              value={campaignFilters.dateTo || ""}
              onChange={(e) => {
                const v = e.target.value || null;
                setCampaignFilters((prev) => ({ ...prev, dateTo: v }));
                handleFiltersChange({ date_to: v || null });
              }}
            />
          </Form.Group>
        ),
      },
      {
        id: "users",
        label: "Campaign Users",
        showDropdown: true,
        active: !!(campaignFilters.userExtensions?.length),
        activeLabel: campaignFilters.userExtensions?.length ? `${campaignFilters.userExtensions.length} selected` : undefined,
        onClear: () => { setCampaignFilters((prev) => ({ ...prev, userExtensions: null })); handleFiltersChange({ user_extensions: null }); },
        dropdownContent: (
          <div style={{ minWidth: "260px" }}>
            <Form.Label className="small fw-bold mb-2">Campaign Users</Form.Label>
            <Select
              isMulti
              options={extensions.map((ext: any) => ({ value: ext.id, label: ext.display_name || ext.name || ext.id }))}
              value={campaignFilters.userExtensions?.map((extId: string) => {
                const ext = extensions.find((e: any) => e.id == extId);
                return { value: extId, label: ext?.display_name || ext?.name || `Extension ${extId}` };
              }) || []}
              onChange={(selected) => {
                const vals = selected ? selected.map((s) => s.value) : null;
                setCampaignFilters((prev) => ({ ...prev, userExtensions: vals }));
                handleFiltersChange({ user_extensions: vals || null });
              }}
              placeholder="Select users..."
              styles={customSelectStyles}
            />
          </div>
        ),
      },
    ],
    showMoreFiltersButton: false,
    rightActions: (
      <div className="d-flex gap-2">
        <Button
          variant={showCampaignsAnalytics ? "primary" : "light"}
          onClick={() => setShowCampaignsAnalytics((open) => !open)}
          style={{
            border: "1px solid #dee2e6",
            borderRadius: "8px",
            color: showCampaignsAnalytics ? undefined : "#212529",
            height: "33px",
            fontSize: "0.875rem",
            padding: "0 12px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <BarChart3 size={15} />
          Analytics
        </Button>
        {session?.user?.permissions?.includes("add-crm-data-management") &&
          session?.user?.permissions?.includes("data-assignment-crm-data-management") && (
            <Button
              variant="light"
              onClick={() => setShowUploadModal(true)}
              style={{
                border: "1px solid #dee2e6",
                borderRadius: "8px",
                color: "#212529",
                height: "33px",
                fontSize: "0.875rem",
                padding: "0 12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Download size={15} />
              Import
            </Button>
          )}
        {session?.user?.permissions?.includes("data-assignment-crm-data-management") && (
          <Button
            variant="light"
            onClick={handleDataAssignment}
            style={{
              border: "1px solid #dee2e6",
              borderRadius: "8px",
              color: "#212529",
              height: "33px",
              fontSize: "0.875rem",
              padding: "0 12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Target size={15} />
            Data Assignment
          </Button>
        )}
        {session?.user?.permissions?.includes("add-crm-campaigns") && (
          <Button
            onClick={handleCreateCampaign}
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
            <Plus size={15} />
            New Campaign
          </Button>
        )}
      </div>
    ),
  }), [
    campaignsSearch,
    activeFilter,
    filterCounts,
    showCampaignsAnalytics,
    showAdvancedFilters,
    campaignFilters,
    session?.user?.permissions,
    extensions,
    handleDataAssignment,
    handleCreateCampaign,
  ]);

  const handleCampaignsPaginationChange = useCallback((page: number, rowsPerPage: number) => {
    setCampaignsPagination((prev) => ({
      ...prev,
      currentPage: rowsPerPage === prev.rowsPerPage ? page : 1,
      rowsPerPage,
    }));
  }, []);

  const handleCampaignsSort = useCallback((column: string, direction: "asc" | "desc") => {
    setCampaignsPagination((prev) => ({ ...prev, sortColumn: column, sortDirection: direction, currentPage: 1 }));
  }, []);

  const closeCreateEditModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedCampaign(null);
    setCampaignUsers([]);
    setSelectedIndustries([]);
    setSelectedDealTemplate(null);
    setNewField({ field_name: "", field_type: "string", field_options: [], sort_order: 0, is_required: false });
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="CRM" mainLink="/crm/dashboard" subTitle="Campaigns" />

      {/* Analytics Section - Collapsible */}
      {showCampaignsAnalytics && session?.user?.permissions?.includes("list-crm-campaigns") && (
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <KPICard title="Total Campaigns" value={totalCampaigns.toString()} icon={<Megaphone size={24} />} color="primary" />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard title="Active Campaigns" value={metrics.active_campaigns.toString()} icon={<TrendingUp size={24} />} color="success" />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard title="Inactive Campaigns" value={metrics.inactive_campaigns.toString()} icon={<AlertCircle size={24} />} color="warning" />
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <KPICard title="Total Users" value={extensions.length.toString()} icon={<Users size={24} />} color="info" />
          </Col>
        </Row>
      )}

      {/* Campaigns Table via GenericTable */}
      {session?.user?.permissions?.includes("list-crm-campaigns") && (
        <GenericTable<any>
          data={campaignsData}
          columns={campaignsTableColumns}
          actions={campaignsTableActions}
          showActions={campaignsTableActions.length > 0}
          actionsLabel="Actions"
          sortable
          defaultSortColumn={campaignsPagination.sortColumn}
          defaultSortDirection={campaignsPagination.sortDirection}
          onSort={handleCampaignsSort}
          loading={loading}
          emptyMessage="No campaigns found matching your criteria"
          pagination={{
            currentPage: campaignsPagination.currentPage,
            rowsPerPage: campaignsPagination.rowsPerPage,
            totalRows: totalCampaigns,
            pageSizeOptions: [10, 25, 50, 100],
          }}
          onPaginationChange={handleCampaignsPaginationChange}
          customizableColumns
          defaultSelectedColumns={["name", "status", "start_date", "user_extensions", "created_at"]}
          columnStorageKey="campaignsSelectedColumns"
          showToolbar
          toolbar={toolbarConfig}
          showToolbarActions={false}
          uniqueKey="id"
        />
      )}

      {/* Create/Edit Campaign Modal */}
      <Modal show={showCreateModal || showEditModal} onHide={closeCreateEditModal} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {showEditModal ? `Edit Campaign: ${selectedCampaign?.name}` : "Add New Campaign"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Campaign Name *</Form.Label>
                  <Form.Control type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter campaign name" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date *</Form.Label>
                  <Form.Control type="date" value={formData.start_date} onChange={handleStartDateChange} min={showEditModal ? getTodayDate(formData.start_date || "") : getTodayDate()} />
                  <Form.Text className="text-muted">{showEditModal ? "Campaign start date" : "Must be today or a future date"}</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date *</Form.Label>
                  <Form.Control type="date" value={formData.end_date} onChange={handleEndDateChange} min={showEditModal ? undefined : getMinEndDate()} />
                  <Form.Text className="text-muted">Must be after start date</Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-4">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter campaign description (optional)" />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label>Product Groups</Form.Label>
                  <Select
                    isMulti
                    value={selectedIndustries}
                    onChange={(selected) => setSelectedIndustries(selected || [])}
                    options={industries.map((industry) => ({ value: industry.id.toString(), label: industry.name, id: industry.id }))}
                    placeholder="Select product groups..."
                    styles={{ control: (base) => ({ ...base, borderColor: "#ced4da", boxShadow: "none", fontSize: "14px" }) }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label>Deal Template</Form.Label>
                  <Select
                    value={selectedDealTemplate}
                    onChange={(selected) => setSelectedDealTemplate(selected)}
                    options={dealTemplates.map((template) => ({ value: template.id.toString(), label: template.name, id: template.id }))}
                    placeholder="Select deal template..."
                    isClearable
                    styles={{ control: (base) => ({ ...base, borderColor: "#ced4da", boxShadow: "none", fontSize: "14px" }) }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-4">
              <Form.Label>Campaign Users</Form.Label>
              <Select
                isMulti
                value={campaignUsers}
                onChange={(selected) => setCampaignUsers(selected || [])}
                options={extensions.map((ext: any) => ({ value: ext.id, label: ext.display_name || ext.name || ext.id }))}
                placeholder="Select users for this campaign..."
                styles={{ control: (base) => ({ ...base, borderColor: "#ced4da", boxShadow: "none", fontSize: "14px" }) }}
              />
            </Form.Group>

            {/* Campaign Fields */}
            <div className="border-top pt-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Campaign Fields</h5>
              </div>
              <Card className="mb-3">
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <Form.Control type="text" placeholder="Field name" value={newField.field_name} onChange={(e) => setNewField({ ...newField, field_name: e.target.value })} />
                    </Col>
                    <Col md={3}>
                      <Form.Select value={newField.field_type} onChange={(e) => setNewField({ ...newField, field_type: e.target.value })}>
                        <option value="string">Text</option>
                        <option value="integer">Number</option>
                        <option value="date">Date</option>
                        <option value="email">Email</option>
                        <option value="dropdown">Dropdown</option>
                      </Form.Select>
                    </Col>
                    <Col md={2}>
                      <Form.Check type="checkbox" label="Required" checked={newField.is_required} onChange={(e) => setNewField({ ...newField, is_required: e.target.checked })} />
                    </Col>
                    <Col md={3}>
                      <Button variant="success" className="app-button" onClick={handleAddField}>Add Field</Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
              {campaignFields.map((field, index) => (
                <Card key={index} className="mb-2">
                  <Card.Body>
                    <Row className="align-items-center">
                      <Col md={4}>
                        <Form.Control type="text" value={field.field_name} onChange={(e) => { const u = [...campaignFields]; u[index].field_name = e.target.value; setCampaignFields(u); }} />
                      </Col>
                      <Col md={3}>
                        <Form.Select value={field.field_type} onChange={(e) => handleFieldTypeChange(index, e.target.value)}>
                          <option value="string">Text</option>
                          <option value="integer">Number</option>
                          <option value="date">Date</option>
                          <option value="email">Email</option>
                          <option value="dropdown">Dropdown</option>
                        </Form.Select>
                      </Col>
                      <Col md={2}>
                        <Form.Check type="checkbox" label="Required" checked={field.is_required || false} onChange={(e) => { const u = [...campaignFields]; u[index].is_required = e.target.checked; setCampaignFields(u); }} />
                      </Col>
                      <Col md={3}>
                        <Button variant="danger" className="app-button" onClick={() => handleRemoveField(index)}><FiTrash2 /> Delete</Button>
                      </Col>
                      {field.field_type === "dropdown" && (
                        <Col md={12} className="mt-3">
                          {field.field_options?.map((option: string, optionIndex: number) => (
                            <div key={optionIndex} className="d-flex mb-3 row align-items-center justify-content-left">
                              <Col md={5}>
                                <Form.Control type="text" size="sm" value={option} onChange={(e) => handleFieldOptionChange(index, optionIndex, e.target.value)} placeholder="Option value" />
                              </Col>
                              <Col md={5}>
                                <Button variant="danger" size="sm" className="app-button" onClick={() => handleRemoveFieldOption(index, optionIndex)}>Remove Option</Button>
                              </Col>
                            </div>
                          ))}
                          <Button variant="primary" className="app-button" size="sm" onClick={() => handleAddFieldOption(index)}>Add Option</Button>
                        </Col>
                      )}
                    </Row>
                  </Card.Body>
                </Card>
              ))}
              {campaignFields.length === 0 && (
                <Alert variant="info">No fields added yet. Click "Add Field" to create custom fields for this campaign.</Alert>
              )}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={closeCreateEditModal}>Cancel</Button>
          <Button variant="primary" onClick={handleFormSubmit} disabled={loading}>
            {loading ? "Saving..." : showEditModal ? "Update Campaign" : "Create Campaign"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Campaign Modal */}
      {selectedCampaign && (
        <Modal show={showViewModal} onHide={() => { setShowViewModal(false); setSelectedCampaign(null); }} size="xl" centered>
          <div style={{ color: "black", padding: "30px", position: "relative", borderTopLeftRadius: "8px", borderTopRightRadius: "8px", borderBottom: "1px solid #e5e7eb" }}>
            <button onClick={() => { setShowViewModal(false); setSelectedCampaign(null); }} style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(255,255,255,0.2)", border: "none", color: "black", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center" }} onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.3)"; e.currentTarget.style.transform = "rotate(90deg)"; }} onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; e.currentTarget.style.transform = "rotate(0deg)"; }}>
              <X size={20} />
            </button>
            <h3 style={{ margin: 0, fontWeight: 600, fontSize: "24px" }}>{selectedCampaign.name}</h3>
            <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "14px" }}>Campaign Details</p>
          </div>
          <Modal.Body style={{ padding: "30px" }}>
            {loading ? (
              <div className="text-center py-4"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>
            ) : (
              <>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "#1f2937", marginBottom: "20px", paddingBottom: "10px", borderBottom: "2px solid #f8f9fa", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Megaphone size={18} style={{ color: "#4680ff" }} /> Campaign Information
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "30px" }}>
                  {[
                    { label: "Campaign Name", value: selectedCampaign.name },
                    { label: "Status", value: <Badge bg={selectedCampaign.status === "active" ? "success" : "secondary"} style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 }}>{selectedCampaign.status?.charAt(0).toUpperCase() + selectedCampaign.status?.slice(1) || "Inactive"}</Badge> },
                  ].map((item, i) => (
                    <div key={i} style={{ background: "#f8f9fa", padding: "16px", borderRadius: "10px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{item.label}</div>
                      <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500 }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {selectedCampaign.description && (
                  <div style={{ background: "#f8f9fa", padding: "16px", borderRadius: "10px", marginBottom: "30px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Description</div>
                    <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500, wordWrap: "break-word", whiteSpace: "pre-wrap" }}>{selectedCampaign.description}</div>
                  </div>
                )}

                <div style={{ fontSize: "16px", fontWeight: 600, color: "#1f2937", marginBottom: "20px", paddingBottom: "10px", borderBottom: "2px solid #f8f9fa", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Calendar size={18} style={{ color: "#4680ff" }} /> Date Information
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "30px" }}>
                  <div style={{ background: "#f8f9fa", padding: "16px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Date Range</div>
                    <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500 }}>
                      {selectedCampaign.start_date && selectedCampaign.end_date
                        ? `${new Date(selectedCampaign.start_date).toLocaleDateString()} - ${new Date(selectedCampaign.end_date).toLocaleDateString()}`
                        : selectedCampaign.start_date ? `Starts: ${new Date(selectedCampaign.start_date).toLocaleDateString()}` : "Not set"}
                    </div>
                  </div>
                  <div style={{ background: "#f8f9fa", padding: "16px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Created Date</div>
                    <div style={{ fontSize: "15px", color: "#1f2937", fontWeight: 500 }}>{selectedCampaign.created_at ? new Date(selectedCampaign.created_at).toLocaleDateString() : "N/A"}</div>
                  </div>
                </div>

                {selectedCampaign.user_extensions?.length > 0 && (
                  <>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "#1f2937", marginBottom: "20px", paddingBottom: "10px", borderBottom: "2px solid #f8f9fa", display: "flex", alignItems: "center", gap: "10px" }}>
                      <Users size={18} style={{ color: "#4680ff" }} /> Campaign Users ({selectedCampaign.user_extensions.length})
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "30px" }}>
                      {selectedCampaign.user_extensions.map((ue: any, index: number) => {
                        const ext = extensions.find((e) => e.id == ue.user_extension);
                        return (
                          <div key={index} style={{ background: "#f8f9fa", padding: "12px", borderRadius: "8px", fontSize: "14px", fontWeight: 500 }}>
                            {ext?.display_name || ext?.name || `Extension ${ue.user_extension}`}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                <div style={{ fontSize: "16px", fontWeight: 600, color: "#1f2937", marginBottom: "20px", paddingBottom: "10px", borderBottom: "2px solid #f8f9fa", display: "flex", alignItems: "center", gap: "10px" }}>
                  <FileText size={18} style={{ color: "#4680ff" }} /> Campaign Fields ({selectedCampaign.fields?.length || 0})
                </div>
                {selectedCampaign.fields?.length > 0 ? (
                  <div className="table-responsive mb-4">
                    <table className="table table-bordered">
                      <thead>
                        <tr><th>Field Name</th><th>Type</th><th>Required</th><th>Options</th></tr>
                      </thead>
                      <tbody>
                        {selectedCampaign.fields.map((field: any, index: number) => (
                          <tr key={index}>
                            <td>{field.field_name}</td>
                            <td><Badge bg="primary" className="text-capitalize">{getFieldTypeText(field.field_type)}</Badge></td>
                            <td>{field.is_required ? <Badge bg="danger">Required</Badge> : <Badge bg="secondary">Optional</Badge>}</td>
                            <td>
                              {field.field_type === "dropdown" && field.field_options
                                ? field.field_options.map((opt: string, i: number) => <Badge key={i} bg="info" className="me-1">{opt}</Badge>)
                                : <span className="text-muted">N/A</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Alert variant="info" className="mb-4">No custom fields defined for this campaign.</Alert>
                )}

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", paddingTop: "20px", borderTop: "1px solid #e5e7eb" }}>
                  <Button variant="outline-secondary" onClick={() => { setShowViewModal(false); setSelectedCampaign(null); }} style={{ borderRadius: "8px", padding: "10px 24px", fontWeight: 500 }}>Close</Button>
                  {session?.user?.permissions?.includes("edit-crm-campaigns") && (
                    <Button variant="primary" onClick={() => { setShowViewModal(false); handleEditCampaign(selectedCampaign); }} style={{ borderRadius: "8px", padding: "10px 24px", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px" }}>
                      <Edit size={16} /> Edit Campaign
                    </Button>
                  )}
                </div>
              </>
            )}
          </Modal.Body>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => { setShowDeleteModal(false); setSelectedCampaign(null); }}
        onConfirm={confirmDeleteCampaign}
        itemName={selectedCampaign?.name}
        itemType="campaign"
        loading={loading}
        additionalInfo={<p className="text-muted small mb-0">This action will also delete all associated campaign fields.</p>}
      />

      {/* Upload Modal */}
      {session?.user?.permissions?.includes("add-crm-data-management") && (
        <Modal show={showUploadModal} onHide={() => { setShowUploadModal(false); setSelectedFile(null); setFieldTags([]); setUploadSelectedCampaigns([]); setAutoDistributeToUsers(false); }} size="lg" centered>
          <Modal.Header closeButton className="border-bottom bg-light">
            <Modal.Title>Upload CSV - Import Prospects</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <div className="alert alert-info mb-4">
              <AlertCircleIcon size={18} className="me-2" />
              <strong>📋 Import Guidelines:</strong>
              <ul className="mb-0 mt-2">
                <li><strong>Headers:</strong> First row must contain column headers</li>
                <li><strong>Name Column:</strong> Include a "name" column (case insensitive) for first name and last name</li>
                <li><strong>Phone Column:</strong> Include a "phone" column (case insensitive) for contact information</li>
                <li><strong>File Size:</strong> Maximum 2MB per file</li>
                <li><strong>Phone Format:</strong> Phone numbers must be in E.164 format (e.g., +1234567890)</li>
                <li><strong>Formats:</strong> CSV files supported</li>
              </ul>
            </div>
            <Form>
              <Form.Group className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label className="fw-semibold mb-0">Select CSV File <span className="text-danger">*</span></Form.Label>
                  <Button variant="outline-primary" size="sm" onClick={downloadExampleCsv} className="d-flex align-items-center gap-1"><Download size={14} /> Download Example CSV</Button>
                </div>
                <Form.Control type="file" accept=".csv" onChange={handleFileInputChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Campaigns (Optional)</Form.Label>
                <Select isMulti value={uploadSelectedCampaigns} onChange={(s) => setUploadSelectedCampaigns(s || [])} options={availableCampaignsForUpload} placeholder="Select campaigns..." styles={{ control: (base) => ({ ...base, borderColor: "#ced4da", boxShadow: "none", fontSize: "14px" }) }} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Tags (Optional)</Form.Label>
                <CreatableSelect isMulti value={fieldTags} onChange={(s) => setFieldTags(s || [])} options={availableTags} placeholder="Add tags..." styles={{ control: (base) => ({ ...base, borderColor: "#ced4da", boxShadow: "none", fontSize: "14px" }) }} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Data Distribution</Form.Label>
                <div>
                  <Form.Check type="radio" id="auto-distribute-yes" name="autoDistribute" label="Automatically distribute data between campaign users" checked={autoDistributeToUsers === true} onChange={() => setAutoDistributeToUsers(true)} className="mb-2" />
                  <Form.Check type="radio" id="auto-distribute-no" name="autoDistribute" label="Do not automatically distribute" checked={autoDistributeToUsers === false} onChange={() => setAutoDistributeToUsers(false)} />
                </div>
              </Form.Group>
              <div className="alert alert-warning"><small><strong>Note:</strong> The data will be uploaded even if some fields remain empty.</small></div>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowUploadModal(false); setSelectedFile(null); setFieldTags([]); setUploadSelectedCampaigns([]); setAutoDistributeToUsers(false); }}>Cancel</Button>
            <Button variant="primary" onClick={handleUpload} disabled={uploading || !selectedFile}>
              {uploading ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Uploading...</> : <><Download size={16} className="me-2" />Upload & Import</>}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Data Assignment Modal */}
      <Modal show={showDataAssignmentModal} onHide={handleDataAssignmentModalClose} size="lg" centered backdrop="static">
        <Modal.Header closeButton style={{ borderBottom: "1px solid #ccc" }} className="pb-2">
          <Modal.Title className="d-flex align-items-center gap-2 fs-5 fw-bold text-dark">
            <div className="p-2 bg-primary bg-opacity-10 rounded-3"><Target size={20} className="text-primary" /></div>
            Data Assignment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pb-4">
          <div className="alert alert-primary border-0 d-flex align-items-start mb-4 shadow-sm" style={{ background: "linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)", borderLeft: "4px solid #4f46e5" }}>
            <AlertCircle size={20} className="text-primary mt-1 me-2 flex-shrink-0" />
            <div><strong className="d-block mb-1 text-dark">Smart Data Assignment</strong><span className="text-muted small">Configure filters and assignment criteria to distribute prospects efficiently.</span></div>
          </div>
          <Form>
            <div className="mb-4 p-4 rounded-4 border" style={{ background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)" }}>
              <div className="d-flex align-items-center gap-2 mb-4"><Filter size={18} className="text-primary" /><h6 className="mb-0 fw-bold text-dark">Filter Records</h6></div>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small text-muted mb-2"><span className="d-flex align-items-center gap-1"><Megaphone size={14} /> Campaign Filter</span></Form.Label>
                    <Select isMulti options={availableCampaignsForUpload.map((c) => ({ value: c.value, label: c.label }))} value={assignmentFilterCampaigns.map((c) => { const opt = availableCampaignsForUpload.find((ac) => ac.value === c); return opt ? { value: opt.value, label: opt.label } : { value: c, label: c }; })} onChange={(s) => setAssignmentFilterCampaigns(s ? s.map((o) => o.value) : [])} placeholder="Select campaigns..." styles={customSelectStyles} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small text-muted mb-2"><span className="d-flex align-items-center gap-1"><Hash size={14} /> Tag Filter</span></Form.Label>
                    <CreatableSelect isMulti options={availableTags} value={assignmentFilterTags} onChange={(s) => setAssignmentFilterTags(s || [])} placeholder="Select or create tags..." styles={customSelectStyles} />
                  </Form.Group>
                </Col>
              </Row>
              <div className="mt-4 p-4 rounded-3" style={{ background: "linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(74, 222, 128, 0.08) 100%)", border: "1px solid rgba(34, 197, 94, 0.2)" }}>
                <Row className="g-3 align-items-center">
                  {[{ label: "Total Records", value: assignmentCounts.total, icon: <Users size={28} className="text-success" />, bg: "success" }, { label: "Assigned", value: assignmentCounts.assigned, icon: <UserPlus size={28} className="text-primary" />, bg: "primary" }, { label: "Unassigned", value: assignmentCounts.unassigned, icon: <AlertCircle size={28} className="text-warning" />, bg: "warning" }].map((item, i) => (
                    <Col key={i} md={4}>
                      <div className="d-flex align-items-center gap-3">
                        <div className={`p-3 bg-${item.bg} bg-opacity-10 rounded-3`}>{item.icon}</div>
                        <div><small className="text-muted d-block mb-1">{item.label}</small><strong className="fs-3 text-dark">{item.value.toLocaleString()}</strong></div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            </div>

            <div className="mb-4 p-4 rounded-4 border" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)" }}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small text-muted mb-2">Assign To <span className="text-danger">*</span></Form.Label>
                <div>
                  <Form.Check type="radio" id="assign-campaigns" name="assignTarget" label="Campaigns" value="campaigns" checked={assignmentTargetType === "campaigns"} onChange={() => { setAssignmentTargetType("campaigns"); setAssignmentType("campaigns"); setDistributionMode("equal"); setAssignToCampaigns([]); setSelectedUserExtensions([]); }} className="mb-2" />
                  <Form.Check type="radio" id="assign-users" name="assignTarget" label="Users" value="users" checked={assignmentTargetType === "users"} onChange={() => { setAssignmentTargetType("users"); setAssignmentType("custom"); setDistributionMode(""); setAssignToCampaigns([]); setSelectedUserExtensions([]); }} />
                </div>
              </Form.Group>

              {assignmentTargetType === "campaigns" && (
                <div className="p-4 rounded-3" style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%)" }}>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small text-muted mb-2">Distribution Mode <span className="text-danger">*</span></Form.Label>
                        <Select options={[{ value: "equal", label: "Equal Distribution" }, { value: "custom", label: "Proportional Distribution" }]} value={{ value: distributionMode, label: distributionMode === "equal" ? "Equal Distribution" : "Proportional Distribution" }} onChange={(s) => setDistributionMode(s?.value || "equal")} placeholder="Select distribution mode..." styles={customSelectStyles} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small text-muted mb-2">Target Campaigns <span className="text-danger">*</span></Form.Label>
                        <Select isMulti options={availableCampaignsForUpload.map((c) => ({ value: c.label, label: c.label }))} value={assignToCampaigns.map((c) => ({ value: c, label: c }))} onChange={(s) => setAssignToCampaigns(s ? s.map((o) => o.value) : [])} placeholder="Select campaigns..." styles={customSelectStyles} />
                      </Form.Group>
                    </Col>
                  </Row>
                  {distributionMode === "custom" && assignToCampaigns.length > 0 && (
                    <Row className="mt-3">
                      <Col md={12}>
                        <Form.Group>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <Form.Label className="mb-0 fw-semibold small text-muted">Proportional Distribution</Form.Label>
                            <Button variant="outline-secondary" size="sm" onClick={() => {
                              const eq = Math.floor(recordsToAssign / assignToCampaigns.length);
                              const rem = recordsToAssign % assignToCampaigns.length;
                              const dist: Record<string, number> = {};
                              assignToCampaigns.forEach((c, i) => {
                                const opt = availableCampaignsForUpload.find((ac) => ac.label === c);
                                if (opt) dist[opt.value] = eq + (i < rem ? 1 : 0);
                              });
                              setCustomDistribution(dist);
                            }}>Auto-fill Equal</Button>
                          </div>
                          <div className="border rounded p-3 bg-light">
                            <p className="small text-muted mb-3">Total: <strong>{recordsToAssign}</strong> | Allocated: <strong>{Object.values(customDistribution).reduce((s, c) => s + c, 0)}</strong> | Remaining: <strong>{recordsToAssign - Object.values(customDistribution).reduce((s, c) => s + c, 0)}</strong></p>
                            {assignToCampaigns.map((c) => {
                              const opt = availableCampaignsForUpload.find((ac) => ac.label === c);
                              if (!opt) return null;
                              return (
                                <div key={opt.value} className="mb-2">
                                  <Row>
                                    <Col md={6}><Form.Label className="small mb-0">{c}</Form.Label></Col>
                                    <Col md={6}><Form.Control type="number" min="0" max={recordsToAssign} value={customDistribution[opt.value] || 0} onKeyDown={handleNumberKeyDown} onChange={(e) => handleNumberChange(e.target.value, recordsToAssign, (v) => setCustomDistribution((prev) => ({ ...prev, [opt.value]: v })))} size="sm" /></Col>
                                  </Row>
                                </div>
                              );
                            })}
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                </div>
              )}

              {assignmentTargetType === "users" && (
                <div className="p-4 rounded-3" style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%)" }}>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small text-muted mb-2">Distribution Mode <span className="text-danger">*</span></Form.Label>
                        <Select options={[{ value: "equal", label: "Equal Distribution" }, { value: "custom", label: "Proportional Distribution" }]} value={{ value: distributionMode, label: distributionMode === "equal" ? "Equal Distribution" : "Proportional Distribution" }} onChange={(s) => setDistributionMode(s?.value || "equal")} placeholder="Select distribution mode..." styles={customSelectStyles} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small text-muted mb-2">Select Users <span className="text-danger">*</span></Form.Label>
                        <Select isMulti options={dataManagementExtensions.map((ext: any) => ({ value: ext.id?.toString() || ext.extension?.toString() || "", label: ext.display_name || ext.name || `Extension ${ext.id || ext.extension}`, extension: ext }))} value={selectedUserExtensions} onChange={(s) => setSelectedUserExtensions(s || [])} placeholder="Select users..." styles={customSelectStyles} />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}
            </div>

            <div className="mb-3">
              <Form.Group>
                <Form.Label className="fw-semibold small text-muted mb-2">Number of Records to Assign <span className="text-danger">*</span></Form.Label>
                <div className="position-relative">
                  <Form.Control type="number" min="1" max={getMaxRecords()} value={recordsToAssign || ""} onKeyDown={handleNumberKeyDown} onChange={(e) => handleNumberChange(e.target.value, getMaxRecords(), setRecordsToAssign)} placeholder={`Enter number (max: ${getMaxRecords().toLocaleString()})`} className="border-2 py-2" style={{ paddingRight: "100px" }} />
                  <div className="position-absolute top-50 end-0 translate-middle-y me-3"><small className="text-muted">of {getMaxRecords().toLocaleString()}</small></div>
                </div>
                <div className="mt-2 d-flex align-items-center gap-2">
                  <div className="flex-grow-1 bg-light rounded-pill overflow-hidden" style={{ height: "6px" }}>
                    <div className="bg-primary h-100 rounded-pill" style={{ width: `${recordsToAssign > 0 && getMaxRecords() > 0 ? (recordsToAssign / getMaxRecords()) * 100 : 0}%`, transition: "width 0.3s ease" }} />
                  </div>
                  <small className="text-muted fw-medium">{recordsToAssign > 0 && getMaxRecords() > 0 ? ((recordsToAssign / getMaxRecords()) * 100).toFixed(1) : "0"}%</small>
                </div>
              </Form.Group>
            </div>

            <div className="mb-4 p-4 rounded-3" style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)", border: "1px solid rgba(99, 102, 241, 0.15)" }}>
              <h6 className="fw-bold mb-3 text-primary d-flex align-items-center"><Briefcase size={18} className="me-2" />Assignment Settings</h6>
              <div className="p-3 bg-white rounded-3">
                <Form.Label className="fw-semibold text-dark mb-2">Include already assigned records (allow reassignment)</Form.Label>
                <div>
                  <Form.Check type="radio" id="include-yes" name="includeAssigned" label="Yes, include already assigned records" checked={includeAssignedRecords === true} onChange={() => { setIncludeAssignedRecords(true); if (recordsToAssign > assignmentCounts.total) setRecordsToAssign(assignmentCounts.total); }} className="mb-2" />
                  <Form.Check type="radio" id="include-no" name="includeAssigned" label="No, only assign unassigned records" checked={includeAssignedRecords === false} onChange={() => { setIncludeAssignedRecords(false); if (recordsToAssign > assignmentCounts.unassigned) setRecordsToAssign(assignmentCounts.unassigned); }} />
                </div>
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 px-4 pb-4">
          <Button variant="light" onClick={handleDataAssignmentModalClose} disabled={assigningData} className="px-4 fw-semibold">Cancel</Button>
          <Button variant="primary" disabled={assigningData || !assignmentTargetType || recordsToAssign === 0 || recordsToAssign > getMaxRecords() || (assignmentTargetType === "campaigns" && (!distributionMode || assignToCampaigns.length === 0)) || (assignmentTargetType === "users" && selectedUserExtensions.length === 0)} onClick={handleDataAssignmentSubmit} className="px-4 fw-semibold d-flex align-items-center gap-2">
            {assigningData ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Assigning...</> : <><UserPlus size={18} />Assign {recordsToAssign > 0 ? `${recordsToAssign.toLocaleString()} Records` : "Records"}</>}
          </Button>
        </Modal.Footer>
      </Modal>

      <SuccessfulModal show={showSuccessfulModal} onHide={() => setShowSuccessfulModal(false)} title={successModalTitle} description={successModalDescription} />
    </React.Fragment>
  );
};

CrmCampaigns.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmCampaigns;
