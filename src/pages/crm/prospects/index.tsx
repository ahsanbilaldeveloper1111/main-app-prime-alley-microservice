import "@assets/scss/datatable-style.scss";
import parsePhoneNumber from "libphonenumber-js";
import PhoneInput from "react-phone-number-input";
import { parsePhoneNumber as parsePhoneNumberInput } from "react-phone-number-input";
import "react-phone-number-input/style.css";

import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  Button,
  Card,
  Row,
  Col,
  Form,
  Alert,
  Spinner,
  Modal,
  Badge,
  InputGroup,
  Dropdown,
  Table,
  Popover,
  OverlayTrigger,
} from "react-bootstrap";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import moment from "moment";
import {
  FiUpload,
  FiDatabase,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiEye,
  FiEdit,
  FiUser,
  FiUsers,
  FiPhone,
  FiMessageCircle,
  FiPlay,
  FiClock,
  FiX,
  FiAlertCircle,
  FiCalendar,
  FiTarget,
  FiMoreVertical,
} from "react-icons/fi";
import {
  Users,
  Calendar,
  XCircle,
  Clock as ClockIcon,
  ChevronDown,
  X,
  AlertCircle as AlertCircleIcon,
  UserPlus,
  ArrowUp,
  ArrowDown,
  Download,
  CheckSquare,
  ArrowUpDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  MoreVertical,
  Phone as PhoneIcon,
  Phone,
  Mail,
  User,
  History,
  FileText,
  Target,
  Layers,
  MessageCircle,
  MessageSquare,
} from "lucide-react";
import CreateLeadModal from "@components/CreateLeadModal";
import { Column } from "@components/CustomDataTable";
import GenericTable, {
  TableColumn,
  TableAction,
  PaginationConfig,
  ToolbarConfig,
  FilterPill,
  TabConfig,
} from "@components/GenericTable";

import GenericSidebar, {
  SidebarSection,
  QuickAction,
  SidebarField,
} from "@components/GenericSidebarNew";
import GenericFilterSidebar, {
  FilterField,
} from "@components/GenericFilterSidebar";
import StatsCards, { StatsCardData } from "@components/GenericStatsCards";
import {
  getCrmData,
  getCrmDataById,
  createCrmData,
  updateCrmData,
  uploadCrmDataCsv,
  deleteCrmData,
  assignCrmDataAdvanced,
  getCrmDataCounts,
  bulkDeleteCrmData,
  getCrmDataTags,
  markCrmDataAsViewed,
  getCampaigns,
  scheduleCall,
  unscheduleCall,
  getCrmDataHistory,
  CrmDataItem,
  CrmDataMetrics,
  downloadExampleCsv,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import FormModal from "../../partial/FormModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import {
  ModuleSlug,
  formatDuration,
  formatDateTimeToLocal,
  GlobalDateFormat,
  GlobalTimeFormat,
  GlobalDateTimeFormat,
  RECORD_TYPES,
} from "@utils/Helper";
import PageSummaryGrid from "@components/PageSummaryGrid";
import DatatableActionButton from "@components/DatatableActionButton";
import { useCti } from "../../../contexts/CtiContext";
import { DownloadCallRecording } from "@utils/calls";
import CallRecordingPlayerModal from "@components/CallRecordingPlayerModal";
import CircularProgressCircle from "@components/CircularProgressCircle";

// KPI Card Component (from crm-new.tsx design)
interface KPICardData {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const PhoneContainer = ({
  phone,
  onClick,
}: {
  phone: string;
  onClick?: () => void;
}) => {
  const [showPopover, setShowPopover] = useState(false);

  const parsePhone = useCallback((phone: string) => {
    if (!phone)
      return {
        phone: "N/A",
        countryCode: "",
      };
    try {
      const parsedPhone = parsePhoneNumber(phone);
      return {
        phone: parsedPhone?.formatInternational() || phone,
        countryCode: parsedPhone?.country || "",
      };
    } catch (e) {
      console.error(e);
      return {
        phone: phone,
        countryCode: "",
      };
    }
  }, []);
  const getFlagImgSrc = useCallback((countryCode: string) => {
    return `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;
  }, []);
  const phoneNumber = useMemo(() => {
    return phone
      ? parsePhone(phone)
      : {
          phone: "N/A",
          countryCode: "",
        };
  }, [phone, parsePhone]);

  const flagImgSrc = getFlagImgSrc(phoneNumber.countryCode);

  const phoneBadge = (
    <Badge
      bg="info"
      className="bg-opacity-10 text-dark"
      style={{ cursor: onClick ? "pointer" : "default" }}
      onMouseEnter={() => setShowPopover(true)}
      onMouseLeave={() => setShowPopover(false)}
    >
      <div className="d-flex align-items-center gap-2">
        {phoneNumber?.countryCode && (
          <img src={flagImgSrc} alt={phoneNumber.countryCode} />
        )}
        {phoneNumber.phone}
      </div>
    </Badge>
  );

  if (!onClick) {
    return phoneBadge;
  }

  const popover = (
    <Popover
      id={`phone-popover-${phone}`}
      style={{
        maxWidth: "160px",
        pointerEvents: "auto",
        border: "none",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        borderRadius: "8px",
      }}
      onMouseEnter={() => setShowPopover(true)}
      onMouseLeave={() => setShowPopover(false)}
    >
      <Popover.Body
        className="p-0"
        style={{
          padding: "8px",
          borderRadius: "8px",
        }}
      >
        <Button
          variant="default"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
            setShowPopover(false);
          }}
          className="d-flex align-items-center justify-content-center gap-2 w-100"
          style={{
            fontSize: "13px",
            fontWeight: "600",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "1px solid #dee2e6",
            backgroundColor: "transparent",
            color: "#212529",
            boxShadow: "none",
            transition: "all 0.2s ease",
            minHeight: "36px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.backgroundColor = "#f8f9fa";
            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <Phone size={18} style={{ strokeWidth: 2.5 }} />
          <span>Call</span>
        </Button>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger
      show={showPopover}
      placement="top"
      overlay={popover}
      trigger={[]}
    >
      <span style={{ display: "inline-block" }}>{phoneBadge}</span>
    </OverlayTrigger>
  );
};

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

// Filter Bar Component (from crm-new.tsx design)
interface FilterBarProps {
  quickFilters: {
    id: string;
    label: string;
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
          {/* Left Side: Quick Filter Buttons */}
          <div className="d-flex gap-2 flex-wrap align-items-center flex-grow-1">
            {quickFilters.map((filter) => {
              const isActive = activeFilter === filter.id;
              const hasCustomColor = filter.color;

              // Determine button styles
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
                  className="d-flex align-items-center gap-2 "
                  style={hasCustomColor ? buttonStyle : undefined}
                >
                  <span className="d-flex align-items-center gap-2">
                    {filter.icon && (
                      <span className="d-flex align-items-center">
                        {filter.icon}
                      </span>
                    )}
                    {filter.label}
                  </span>
                </Button>
              );
            })}
          </div>

          {/* Right Side: Search and Filters */}
          {(onSearchChange || onToggleAdvancedFilters) && (
            <div className="d-flex flex-column flex-sm-row gap-2 align-items-stretch align-items-sm-center flex-shrink-0">
              {onSearchChange && onSearch && (
                <InputGroup
                  style={{ width: "300px", minWidth: "200px" }}
                  className="flex-shrink-0"
                >
                  <Form.Control
                    style={{ height: "41px" }}
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue || ""}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && onSearch) {
                        onSearch();
                      }
                    }}
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => onSearch?.()}
                  >
                    <FiSearch size={16} />
                  </Button>
                </InputGroup>
              )}
              {onToggleAdvancedFilters && (
                <Button
                  variant={
                    showAdvancedFilters ? "primary" : "outline-secondary"
                  }
                  onClick={onToggleAdvancedFilters}
                  className="d-flex align-items-center flex-shrink-0"
                >
                  <FiFilter size={16} className="me-2" />
                  Filters
                  {(advancedFilterCount ?? 0) > 0 && (
                    <Badge bg="light" text="dark" className="ms-2">
                      {advancedFilterCount}
                    </Badge>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

// Helper function to get initials from name (first two words, first two letters, only a-z)
const getInitials = (name: string): string => {
  if (!name) return "NA";

  // Split by spaces and take up to first two words
  const words = name.trim().split(/\s+/).slice(0, 2);

  // Check if we have two words and the second word has at least one letter
  const hasSecondWord = words.length >= 2;
  const secondWordHasLetter = hasSecondWord && /[a-z]/i.test(words[1]);

  if (hasSecondWord && secondWordHasLetter) {
    // First letter of first two words
    const firstLetter1 = words[0].match(/[a-z]/i)?.[0];
    const firstLetter2 = words[1].match(/[a-z]/i)?.[0];

    if (firstLetter1 && firstLetter2) {
      return (firstLetter1 + firstLetter2).toUpperCase();
    }
  }

  // If no second word or second word is only numbers, use first two letters of first word
  if (words[0]) {
    const letters = words[0].match(/[a-z]/gi) || [];
    if (letters.length >= 2) {
      return (letters[0] + letters[1]).toUpperCase();
    } else if (letters.length === 1) {
      return letters[0].toUpperCase();
    }
  }

  return "NA";
};

// Helper function to generate a random background color based on name
const getRandomColor = (name: string): string => {
  if (!name) return "#6c757d";

  // Generate a consistent color based on the name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (name?.codePointAt(i) || 0) + ((hash << 5) - hash);
  }

  // Generate a color with good contrast (avoid too light colors)
  const hue = Math.abs(hash) % 360;
  const saturation = 50 + (Math.abs(hash) % 30); // 50-80%
  const lightness = 40 + (Math.abs(hash) % 20); // 40-60%

  return `hsla(${hue}, ${saturation}%, ${lightness}%, 0.6)`;
};

const CrmProspectsManagement = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const { dialNumber, isInitialized } = useCti();
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const requestIdRef = useRef(0);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDataItem, setSelectedDataItem] = useState<CrmDataItem | null>(
    null,
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteModalMode, setDeleteModalMode] = useState<"single" | "bulk" | null>(null);
  const [itemToDelete, setItemToDelete] = useState<CrmDataItem | null>(null);
  const [showDataAssignmentModal, setShowDataAssignmentModal] = useState(false);
  const [showAfterCallModal, setShowAfterCallModal] = useState(false);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<readonly any[]>(
    [],
  );
  const [fieldTags, setFieldTags] = useState<readonly any[]>([]);
  const [assignToCampaignUsers, setAssignToCampaignUsers] = useState(false);
  const [showConvertToLeadModal, setShowConvertToLeadModal] = useState(false);
  const [convertingProspectId, setConvertingProspectId] = useState<
    number | null
  >(null);

  // Data assignment modal states
  const [assignmentFilters, setAssignmentFilters] = useState({
    selectedTags: [] as readonly any[],
    selectedCampaigns: [] as readonly any[],
  });
  const [assignmentCampaign, setAssignmentCampaign] = useState<readonly any[]>(
    [],
  );
  const [assignmentDistribution, setAssignmentDistribution] = useState<
    "equal" | "custom"
  >("equal");
  const [totalEntriesToAssign, setTotalEntriesToAssign] = useState(0);
  const [customDistribution, setCustomDistribution] = useState<
    Record<string, number>
  >({});
  const [assignmentCounts, setAssignmentCounts] = useState({
    total: 0,
    assigned: 0,
    unassigned: 0,
  });
  const [availableTags, setAvailableTags] = useState<
    Array<{
      value: string;
      label: string;
      id: number;
    }>
  >([]);
  const [availableCampaigns, setAvailableCampaigns] = useState<
    Array<{
      value: string;
      label: string;
      id: number;
    }>
  >([]);
  const [campaignsById, setCampaignsById] = useState<Record<number, string>>(
    {},
  );
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // After Call modal states
  const [afterCallData, setAfterCallData] = useState({
    disposition: "",
    callStatus: "",
    comment: "",
    nextCallDate: "",
    nextCallTime: "",
    generateLead: "no", // "yes" or "no"
  });

  // Schedule modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedEntryForSchedule, setSelectedEntryForSchedule] =
    useState<any>(null);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    date: "",
    time: "",
    notes: "",
  });

  // Unschedule confirmation modal state
  const [showUnscheduleModal, setShowUnscheduleModal] = useState(false);
  const [entryToUnschedule, setEntryToUnschedule] = useState<any>(null);

  // History modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Sidebar states
  const [showProspectSidebar, setShowProspectSidebar] = useState(false);
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const [showFilterBar, setShowFilterBar] = useState(false);

  // Add Contacts button states
  const [showAddContactsDropdown, setShowAddContactsDropdown] = useState(false);
  const [showCreateContactSidebar, setShowCreateContactSidebar] =
    useState(false);
  const addContactsRef = useRef<HTMLDivElement>(null);
  const [contactForm, setContactForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone_country_code: "",
    phoneNumber: "",
    campaign_id: null as number | null,
    contact_owner: null as string | null,
    lifecycle_stage: "Lead",
    disposition: "",
    legal_basis: [] as string[],
    company_domain: "",
    scheduled_call_at: "",
    tags: [] as Array<{ value: string; label: string; id?: number }>,
    note: "",
    source: "",
  });
  const [createContactLoading, setCreateContactLoading] = useState(false);
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [contactFormLoadError, setContactFormLoadError] = useState<
    string | null
  >(null);
  const [contactFormLoading, setContactFormLoading] = useState(false);

  // Call recordings state
  const [callRecordings, setCallRecordings] = useState<any[]>([]);
  const [callRecordingsLoading, setCallRecordingsLoading] = useState(false);
  const [callRecordingsTotal, setCallRecordingsTotal] = useState(0);
  const [selectedRecording, setSelectedRecording] = useState<any>(null);
  const [showRecordingPlayerModal, setShowRecordingPlayerModal] =
    useState(false);
  const [downloadingRecordings, setDownloadingRecordings] = useState<
    Set<string>
  >(new Set());
  const [downloadProgress, setDownloadProgress] = useState<
    Record<string, number>
  >({});

  const [showProspectsAnalytics, setShowProspectsAnalytics] = useState(false);
  const [showAllProspectStats, setShowAllProspectStats] = useState(false);

  // Valid filter IDs
  const validFilters = ["all", "scheduled", "has_leads"];

  // Initialize activeFilter state
  const [activeFilter, setActiveFilter] = useState("all");

  // Read tab from URL on mount and when router is ready
  useEffect(() => {
    if (router.isReady && router.query.tab) {
      const tabFromUrl = String(router.query.tab);
      if (validFilters.includes(tabFromUrl)) {
        setActiveFilter(tabFromUrl);
      }
    }
  }, [router.isReady, router.query.tab]);

  // Open Create Contact sidebar when navigated from header (Ticket = Prospect)
  useEffect(() => {
    if (!router.isReady || router.query.createContact !== "1") return;
    setShowCreateContactSidebar(true);
    const { createContact: _, ...rest } = router.query;
    router.replace({ pathname: router.pathname, query: rest }, undefined, {
      shallow: true,
    });
  }, [router.isReady, router.query.createContact]);

  // Close Add Contacts dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addContactsRef.current &&
        !addContactsRef.current.contains(event.target as Node)
      ) {
        setShowAddContactsDropdown(false);
      }
    };

    if (showAddContactsDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showAddContactsDropdown]);

  // Load prospect into form when sidebar opens in edit mode
  useEffect(() => {
    if (!showCreateContactSidebar || !editingContactId) {
      setContactFormLoadError(null);
      setContactFormLoading(false);
      return;
    }
    let cancelled = false;
    setContactFormLoadError(null);
    setContactFormLoading(true);
    getCrmDataById(editingContactId)
      .then((item: CrmDataItem & { data?: Record<string, any> }) => {
        if (cancelled) return;
        const d = item.data || {};
        const nameParts = (item.name || "").trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        const toDatetimeLocal = (v: string | null | undefined) => {
          if (!v) return "";
          const m = moment(v);
          return m.isValid() ? m.format("YYYY-MM-DDTHH:mm") : "";
        };
        const rawTags = item?.data?.tags ?? d.tags ?? [];
        const tagsArray = Array.isArray(rawTags)
          ? rawTags.map((t: any) =>
              typeof t === "string"
                ? { value: t, label: t }
                : {
                    value: t.name ?? t.value ?? "",
                    label: t.name ?? t.label ?? t.value ?? "",
                  },
            )
          : [];
        // Parse phone for country code + national number (payload may be "+1 4155551234" or E.164)
        let phoneCountryCode = "";
        let phoneNumber = item.phone ?? "";
        if (typeof item.phone === "string" && item.phone.trim()) {
          try {
            const normalized = item.phone.replace(/\s/g, "");
            const parsed = parsePhoneNumberInput(normalized);
            if (parsed) {
              phoneCountryCode = `+${parsed.countryCallingCode}`;
              phoneNumber = parsed.nationalNumber;
            }
          } catch {
            // keep phoneNumber as-is, phoneCountryCode ""
          }
        }
        setContactForm({
          firstName,
          lastName,
          email: d.email ?? (item as any).email ?? "",
          phone_country_code: phoneCountryCode,
          phoneNumber,
          campaign_id: item.campaign_id ?? d.campaign_id ?? null,
          contact_owner: d.contact_owner ?? (item as any).contact_owner ?? null,
          lifecycle_stage: d.lifecycle_stage ?? "Lead",
          disposition: d.disposition ?? (item as any).disposition ?? "",
          legal_basis: Array.isArray(d.legal_basis) ? d.legal_basis : [],
          company_domain: d.company_domain ?? (item as any).company_domain ?? "",
          scheduled_call_at: toDatetimeLocal(
            item.scheduled_call_at ?? d.scheduled_call_at,
          ),
          tags: tagsArray,
          note: item.note ?? d.note ?? "",
          source: d.source ?? (item as any).source ?? "",
        });
        if (!cancelled) setContactFormLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setContactFormLoadError("Failed to load prospect");
          setContactFormLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [showCreateContactSidebar, editingContactId]);

  // Handler to update filter and URL
  const handleFilterChange = useCallback(
    (filterId: string) => {
      setActiveFilter(filterId);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      // Prevent showing stale totalRecords on "Convert to Leads" tab until new data loads
      if (filterId === "has_leads") {
        setLoading(true);
      }

      // Update URL with tab query parameter
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, tab: filterId },
        },
        undefined,
        { shallow: true },
      );
    },
    [router],
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [prospectsSearch, setProspectsSearch] = useState("");
  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFilters, setExportFilters] = useState<Record<string, any>>({});
  const [exportFileName, setExportFileName] = useState("");
  const [showTabModal, setShowTabModal] = useState(false);
  const [customTabs, setCustomTabs] = useState<TabConfig[]>([]);
  const [prospectsFilters, setProspectsFilters] = useState({
    assignedTo: null as string | null,
    campaigns: null as string[] | null,
    nextCallDateFrom: null as string | null,
    nextCallDateTo: null as string | null,
    sourceFile: null as string | null,
    tags: null as string[] | null,
  });
  /** View mode: table or board; dropdown shows only the other option to switch */
  const [prospectsViewMode, setProspectsViewMode] = useState<
    "table" | "board"
  >("table");

  // Column customization and pagination states
  const defaultSelectedColumns = [
    "name",
    "phone",
    "source_file",
    "user_extension",
    "campaign",
    "last_called_at",
    "last_call_end_reason",
    "disposition",
    "scheduled_call_at",
    "tags",
  ];
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    () => defaultSelectedColumns,
  );
  const [draftSelectedColumns, setDraftSelectedColumns] = useState<string[]>(
    [],
  );

  const [pagination, setPagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    sortColumn: "",
    sortDirection: "asc" as "asc" | "desc",
  });
  const [dataList, setDataList] = useState<CrmDataItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  /** Total count of all prospects (unchanged when switching to Scheduled / Convert to Leads tab) */
  const [totalAllProspects, setTotalAllProspects] = useState(0);
  const [loading, setLoading] = useState(false);
  const [clearSelectedRows, setClearSelectedRows] = useState(false);
  const [metrics, setMetrics] = useState<CrmDataMetrics>({
    assigned_records: 0,
    unassigned_records: 0,
    scheduled_records: 0,
    not_scheduled_records: 0,
    scheduled_next_hour_records: 0,
    scheduled_next_24_hours_records: 0,
  });

  // Static tags data
  const staticTags = [
    { value: "hot-lead", label: "Hot Lead" },
    { value: "cold-lead", label: "Cold Lead" },
    { value: "follow-up", label: "Follow Up" },
    { value: "interested", label: "Interested" },
    { value: "not-interested", label: "Not Interested" },
    { value: "callback", label: "Callback" },
    { value: "qualified", label: "Qualified" },
    { value: "unqualified", label: "Unqualified" },
  ];

  // Static call end reasons
  const callEndReasons = [
    { value: "call_later", label: "Call Later", color: "warning" },
    { value: "dont_call", label: "Don't Call", color: "danger" },
    {
      value: "not_reachable",
      label: "Number Not Reachable",
      color: "secondary",
    },
    { value: "dncr_blocklisted", label: "DNCR Blocklisted", color: "dark" },
    { value: "answered", label: "Answered", color: "success" },
    { value: "busy", label: "Busy", color: "info" },
    { value: "no_answer", label: "No Answer", color: "light" },
  ];

  // Static call history data with varied information
  const getCallHistory = (entryId: number) => {
    const histories = [
      {
        id: 1,
        duration: "2:34",
        endReason: "answered",
        disposition: "interested",
        calledAt: "2024-01-15T10:30:00Z",
        recordingUrl: "https://example.com/recording1.mp3",
        comment:
          "Client showed interest in our premium package. Asked for pricing details and wants to schedule a demo next week.",
      },
      {
        id: 2,
        duration: "0:45",
        endReason: "busy",
        disposition: "callback_requested",
        calledAt: "2024-01-14T14:20:00Z",
        recordingUrl: "https://example.com/recording2.mp3",
        comment:
          "Line was busy. Left voicemail with callback request for tomorrow morning.",
      },
      {
        id: 3,
        duration: "1:12",
        endReason: "no_answer",
        disposition: "no_answer",
        calledAt: "2024-01-13T09:15:00Z",
        recordingUrl: "https://example.com/recording3.mp3",
        comment:
          "No answer after multiple rings. Will try again later in the day.",
      },
      {
        id: 4,
        duration: "3:45",
        endReason: "answered",
        disposition: "not_interested",
        calledAt: "2024-01-12T16:20:00Z",
        recordingUrl: "https://example.com/recording4.mp3",
        comment:
          "Client politely declined. Not interested in our services at this time. Asked to be removed from calling list.",
      },
      {
        id: 5,
        duration: "4:12",
        endReason: "answered",
        disposition: "follow_up",
        calledAt: "2024-01-11T11:30:00Z",
        recordingUrl: "https://example.com/recording5.mp3",
        comment:
          "Client needs to discuss with their team. Will follow up in 2 weeks with additional information about our enterprise solutions.",
      },
    ];

    // Return different histories based on entryId for variety
    return histories.slice(0, (entryId % 3) + 2);
  };

  // History data state
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPagination, setHistoryPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: 0,
    to: 0,
  });

  // Function to fetch campaigns by IDs
  const fetchCampaignsByIds = useCallback(async (campaignIds: number[]) => {
    try {
      const campaignsMap: Record<number, string> = {};

      // Fetch campaigns in batches to avoid overwhelming the API
      const batchSize = 50;
      for (let i = 0; i < campaignIds.length; i += batchSize) {
        const batch = campaignIds.slice(i, i + batchSize);
        const campaignsResponse = await getCampaigns({
          per_page: 1000,
          filters: { ids: batch },
          module_slug: ModuleSlug.CRM_CAMPAIGNS,
        });

        campaignsResponse.data.forEach((campaign: any) => {
          campaignsMap[campaign.id] = campaign.name;
        });
      }

      setCampaignsById((prev) => ({ ...prev, ...campaignsMap }));
      return campaignsMap;
    } catch (error) {
      console.error("Failed to fetch campaigns by IDs:", error);
      return {};
    }
  }, []);

  // Fetch history data
  const fetchHistoryData = useCallback(
    async (page: number = 1) => {
      try {
        setHistoryLoading(true);
        const response = await getCrmDataHistory(page, 15);
        console.log("ZE HISTORY DATA", response);
        setHistoryData(response.data);
        setHistoryPagination(response.pagination);

        // Extract campaign IDs from history data and fetch campaign names
        const campaignIds: number[] = [];
        response.data.forEach((activity: any) => {
          if (activity.details?.campaign_ids) {
            campaignIds.push(...activity.details.campaign_ids);
          }
        });

        if (campaignIds.length > 0) {
          const uniqueCampaignIds = Array.from(new Set(campaignIds));
          await fetchCampaignsByIds(uniqueCampaignIds);
        }
      } catch (error) {
        console.error("Failed to fetch history data:", error);
        setHistoryData([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    [fetchCampaignsByIds],
  );

  // Custom select styles
  const customSelectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: "45px",
      fontSize: "0.875rem",
      borderColor: state.isFocused ? "#86b7fe" : "#dee2e6",
      boxShadow: state.isFocused
        ? "0 0 0 0.2rem rgba(13, 110, 253, 0.25)"
        : "none",
      "&:hover": {
        borderColor: "#86b7fe",
      },
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: "#0d6efd",
      color: "white",
      fontSize: "0.813rem",
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: "white",
      padding: "2px 6px",
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: "white",
      "&:hover": {
        backgroundColor: "#0b5ed7",
        color: "white",
      },
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: "#6c757d",
      fontSize: "0.875rem",
    }),
    singleValue: (provided: any) => ({
      ...provided,
      fontSize: "0.875rem",
    }),
  };

  const memoizedFilters = useMemo(() => currentFilters, [currentFilters]);

  const buildCrmDataParams = useCallback(
    (overrides: { page?: number; per_page?: number } = {}) => {
      const params: any = {
        page: pagination.currentPage,
        per_page: pagination.rowsPerPage,
        ...overrides,
      };
      if (memoizedFilters.search) params.search = memoizedFilters.search;
      if (memoizedFilters.campaign_id?.length)
        params.campaign_ids = memoizedFilters.campaign_id;
      if (memoizedFilters.tags?.length) params.tags = memoizedFilters.tags;
      if (memoizedFilters.assignment_status)
        params.assignment_status = memoizedFilters.assignment_status;
      if (memoizedFilters.user_extension?.length) {
        params.user_extensions = Array.isArray(memoizedFilters.user_extension)
          ? memoizedFilters.user_extension
          : [memoizedFilters.user_extension];
      }
      if (
        memoizedFilters.is_viewed !== undefined &&
        memoizedFilters.is_viewed !== ""
      )
        params.is_viewed = memoizedFilters.is_viewed;
      // Create date filter: backend expects date_from / date_to
      if (memoizedFilters.created_at_from)
        params.date_from = memoizedFilters.created_at_from;
      if (memoizedFilters.created_at_to)
        params.date_to = memoizedFilters.created_at_to;
      if (memoizedFilters.last_called_at_from)
        params.last_called_at_from = memoizedFilters.last_called_at_from;
      if (memoizedFilters.last_called_at_to)
        params.last_called_at_to = memoizedFilters.last_called_at_to;
      if (memoizedFilters.has_scheduled_calls !== undefined)
        params.has_scheduled_calls = memoizedFilters.has_scheduled_calls;
      if (memoizedFilters.has_tickets !== undefined)
        params.has_tickets = memoizedFilters.has_tickets;
      if (memoizedFilters.scheduled_call_status)
        params.scheduled_call_status = memoizedFilters.scheduled_call_status;
      if (memoizedFilters.scheduled_call_from)
        params.scheduled_call_from = memoizedFilters.scheduled_call_from;
      if (memoizedFilters.scheduled_call_to)
        params.scheduled_call_to = memoizedFilters.scheduled_call_to;
      if (memoizedFilters.source_file)
        params.source_file = memoizedFilters.source_file;
      if (memoizedFilters.tag_ids?.length)
        params.tag_ids = memoizedFilters.tag_ids;
      // Last activity / last called filter (from filter pill)
      if (memoizedFilters.last_called_at_from)
        params.last_called_at_from = memoizedFilters.last_called_at_from;
      if (memoizedFilters.last_called_at_to)
        params.last_called_at_to = memoizedFilters.last_called_at_to;
      // Lead status / disposition filter (from filter pill)
      if (memoizedFilters.disposition)
        params.disposition = memoizedFilters.disposition;
      if (pagination.sortColumn) {
        params.sort_column = pagination.sortColumn;
        params.sort_direction = pagination.sortDirection;
      }
      params.module_slug = ModuleSlug.CRM_DATA_MANAGEMENT;
      return params;
    },
    [
      memoizedFilters,
      pagination.currentPage,
      pagination.rowsPerPage,
      pagination.sortColumn,
      pagination.sortDirection,
    ],
  );

  // Build API params from arbitrary filters (for export with custom filters)
  const buildExportParams = useCallback(
    (
      filters: Record<string, any>,
      overrides: { page?: number; per_page?: number } = {},
    ) => {
      const params: any = {
        page: overrides.page ?? 1,
        per_page: overrides.per_page ?? 100,
        ...overrides,
      };
      if (filters.search) params.search = filters.search;
      if (filters.campaign_id?.length)
        params.campaign_ids = filters.campaign_id;
      if (filters.tags?.length) params.tags = filters.tags;
      if (filters.assignment_status)
        params.assignment_status = filters.assignment_status;
      if (filters.user_extension?.length)
        params.user_extensions = Array.isArray(filters.user_extension)
          ? filters.user_extension
          : [filters.user_extension];
      if (filters.is_viewed !== undefined && filters.is_viewed !== "")
        params.is_viewed = filters.is_viewed;
      // Create date filter: backend expects date_from / date_to
      if (filters.created_at_from) params.date_from = filters.created_at_from;
      if (filters.created_at_to) params.date_to = filters.created_at_to;
      if (filters.last_called_at_from)
        params.last_called_at_from = filters.last_called_at_from;
      if (filters.last_called_at_to)
        params.last_called_at_to = filters.last_called_at_to;
      if (filters.has_scheduled_calls !== undefined)
        params.has_scheduled_calls = filters.has_scheduled_calls;
      if (filters.has_tickets !== undefined)
        params.has_tickets = filters.has_tickets;
      if (filters.scheduled_call_status)
        params.scheduled_call_status = filters.scheduled_call_status;
      if (filters.scheduled_call_from)
        params.scheduled_call_from = filters.scheduled_call_from;
      if (filters.scheduled_call_to)
        params.scheduled_call_to = filters.scheduled_call_to;
      if (filters.source_file) params.source_file = filters.source_file;
      if (filters.tag_ids?.length) params.tag_ids = filters.tag_ids;
      if (filters.disposition) params.disposition = filters.disposition;
      params.module_slug = ModuleSlug.CRM_DATA_MANAGEMENT;
      return params;
    },
    [],
  );

  const fetchCrmDataForExport = useCallback(
    async (filters: Record<string, any>) => {
      const PER_PAGE = 100;
      const allData: CrmDataItem[] = [];
      let page = 1;
      for (;;) {
        const response = await getCrmData(
          buildExportParams(filters, { page, per_page: PER_PAGE }),
        );
        const chunk = response?.data || [];
        allData.push(...chunk);
        if (chunk.length < PER_PAGE) break;
        page += 1;
      }
      return allData;
    },
    [buildExportParams],
  );

  // Extract unique source_file values from dataList for creatable select
  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    dataList.forEach((item: any) => {
      if (item.source_file && item.source_file.trim()) {
        sources.add(item.source_file.trim());
      }
    });
    return Array.from(sources)
      .sort()
      .map((source) => ({
        value: source,
        label: source,
      }));
  }, [dataList]);

  // Set draft selected columns when column editor is shown
  useEffect(() => {
    if (showColumnEditor) setDraftSelectedColumns([...selectedColumns]);
  }, [showColumnEditor]);

  // Initialize export filters when export modal opens (default to current table filters)
  useEffect(() => {
    if (showExportModal) {
      setExportFilters({ ...currentFilters });
      setExportFileName(`prospects_${moment().format("YYYY-MM-DD")}`);
    }
  }, [showExportModal, currentFilters]);

  // Fetch extensions data
  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData(
          ModuleSlug.CRM_DATA_MANAGEMENT,
        );
        if (hierarchyData?.extensions) {
          setExtensions(hierarchyData.extensions);
        }
      } catch (error) {
        console.error("Failed to fetch extensions:", error);
      }
    };
    fetchExtensions();
  }, []);

  function getNameByExtension(extension: string) {
    const extensionData = extensions.find((ext) => ext.id === extension);
    return extensionData?.display_name || extensionData?.name || extension;
  }

  // Load history data when modal is opened
  useEffect(() => {
    if (showHistoryModal) {
      fetchHistoryData();
    }
  }, [showHistoryModal, fetchHistoryData]);

  // Load available tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await getCrmDataTags();
        const tagOptions = tags.map((tag: any) => ({
          value: tag.name,
          label: tag.name,
          id: tag.id,
        }));
        setAvailableTags(tagOptions);
      } catch (error) {
        console.error("Failed to load tags:", error);
        // Fallback to static tags
        setAvailableTags(
          staticTags.map((tag) => ({
            value: tag.value,
            label: tag.label,
            id: parseInt(tag.value.replace("tag-", "")) || 0,
          })),
        );
      }
    };
    loadTags();
  }, [refreshKey]);

  // Load available campaigns
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const campaignsResponse = await getCampaigns({ per_page: 1000 });
        const campaignOptions = campaignsResponse.data.map((campaign: any) => ({
          value: campaign.id.toString(),
          label: campaign.name,
          id: campaign.id,
        }));
        setAvailableCampaigns(campaignOptions);

        // Also populate the campaignsById map
        const campaignsMap: Record<number, string> = {};
        campaignsResponse.data.forEach((campaign: any) => {
          campaignsMap[campaign.id] = campaign.name;
        });
        setCampaignsById(campaignsMap);
      } catch (error) {
        console.error("Failed to load campaigns:", error);
        // Fallback to empty array
        setAvailableCampaigns([]);
      }
    };
    loadCampaigns();
  }, [refreshKey]);

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters(filters);
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Handle activeFilter changes to update currentFilters
  useEffect(() => {
    if (activeFilter === "all") {
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.has_scheduled_calls;
        delete newFilters.has_tickets;
        return newFilters;
      });
    } else if (activeFilter === "scheduled") {
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.has_tickets;
        newFilters.has_scheduled_calls = true;
        return newFilters;
      });
    } else if (activeFilter === "has_leads") {
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.has_scheduled_calls;
        newFilters.has_tickets = true;
        return newFilters;
      });
    }
    // Don't reset pagination here - it's already reset in onFilterChange
  }, [activeFilter]);

  // Helper functions for sorting and pagination
  const handleSort = (column: string) => {
    const newDirection =
      pagination.sortColumn === column && pagination.sortDirection === "asc"
        ? "desc"
        : "asc";
    setPagination({
      ...pagination,
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

  const renderSortIcon = (column: string) => {
    if (pagination.sortColumn !== column) {
      return <ArrowUpDown size={14} className="ms-1 text-muted" />;
    }
    return pagination.sortDirection === "asc" ? (
      <ArrowUp size={14} className="ms-1" />
    ) : (
      <ArrowDown size={14} className="ms-1" />
    );
  };

  const renderPaginationControls = () => {
    const totalPages = getTotalPages(totalRecords, pagination.rowsPerPage);
    const { currentPage, rowsPerPage } = pagination;
    const startRow = (currentPage - 1) * rowsPerPage + 1;
    const endRow = Math.min(currentPage * rowsPerPage, totalRecords);

    return (
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">Show</span>
          <Form.Select
            size="sm"
            value={rowsPerPage}
            onChange={(e) =>
              setPagination({
                ...pagination,
                rowsPerPage: Number(e.target.value),
                currentPage: 1,
              })
            }
            style={{ width: "auto" }}
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </Form.Select>
          <span className="text-muted small">entries</span>
        </div>

        <div className="text-muted small">
          Showing {startRow} to {endRow} of {totalRecords} prospects
        </div>

        <div className="d-flex gap-1">
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === 1}
            onClick={() => setPagination({ ...pagination, currentPage: 1 })}
          >
            <ChevronsLeft size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === 1}
            onClick={() =>
              setPagination({ ...pagination, currentPage: currentPage - 1 })
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
                    setPagination({ ...pagination, currentPage: pageNum })
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
              setPagination({ ...pagination, currentPage: currentPage + 1 })
            }
          >
            <ChevronRight size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() =>
              setPagination({ ...pagination, currentPage: totalPages })
            }
          >
            <ChevronsRight size={14} />
          </Button>
        </div>
      </div>
    );
  };

  // Fetch prospects data
  const fetchCrmData = useCallback(async () => {
    // Increment request ID to track the latest request
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    setLoading(true);
    try {
      const response = await getCrmData(buildCrmDataParams());

      // Only update state if this is still the latest request
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setDataList(response.data || []);
      setTotalRecords(response.pagination.total || 0);

      // Keep total all prospects only when fetching without tab filter (all prospects)
      const isAllProspects =
        memoizedFilters.has_scheduled_calls !== true &&
        memoizedFilters.has_tickets !== true;
      if (isAllProspects) {
        setTotalAllProspects(response.pagination.total || 0);
      }

      setMetrics(
        response.metrics || {},
      );
    } catch (error: any) {
      // Only handle error if this is still the latest request
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      console.error("Failed to fetch CRM data:", error);
      setDataList([]);
      setTotalRecords(0);
    } finally {
      // Only set loading to false if this is still the current request
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [buildCrmDataParams]);

  // Load data when filters or pagination changes
  useEffect(() => {
    fetchCrmData();
  }, [fetchCrmData, refreshKey]);

  // Clear selection after bulk delete or when clearSelectedRows changes
  useEffect(() => {
    if (clearSelectedRows) {
      setSelectedItems([]);
    }
  }, [clearSelectedRows]);

  // CSV validation function
  const validateCsvFile = (
    file: File,
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check file type
    if (
      !file.type.includes("csv") &&
      !file.name.toLowerCase().endsWith(".csv")
    ) {
      errors.push("File must be a CSV file");
    }

    // Check file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      errors.push("File size must be less than 2MB");
    }

    // Check if file is empty
    if (file.size === 0) {
      errors.push("File cannot be empty");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const validation = validateCsvFile(file);

    if (validation.isValid) {
      setSelectedFile(file);
    } else {
      validation.errors.forEach((error) => toast.error(error));
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Upload CSV file
  const handleUpload = async () => {
    if (!session?.user?.permissions?.includes("add-crm-data-management")) {
      toast.error("You don't have permission to upload data");
      return;
    }

    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Extract tag values from selected options
      const tagValues = Array.from(fieldTags).map((tag) => tag.value);

      const response: any = await uploadCrmDataCsv(
        selectedFile,
        [], // No campaigns selected
        tagValues,
        true, // No auto-assignment
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Parse response
      const responseData = response?.data || {};
      const processedCount = responseData.processed_count || 0;
      const validationFailures = responseData.validation_failures || 0;
      // const errors = responseData.errors || [];
      const message = responseData.message || "Upload completed";

      // Show error messages for validation failures
      // if (errors.length > 0) {
      //   errors.forEach((error: string) => {
      //     toast.warn(error);
      //   });
      // }

      // Show success message
      if (processedCount > 0) {
        let successMessage = `Successfully processed ${processedCount} record${
          processedCount !== 1 ? "s" : ""
        }`;

        if (validationFailures > 0) {
          successMessage += ` with ${validationFailures} validation failure${
            validationFailures !== 1 ? "s" : ""
          }`;
        }

        setSuccessModalTitle("Upload Successful");
        setSuccessModalDescription(successMessage);
        setShowSuccessfulModal(true);
      } else if (validationFailures > 0) {
        // All records failed validation
        toast.error(
          `Upload failed: All ${validationFailures} record${
            validationFailures !== 1 ? "s" : ""
          } failed validation`,
        );
      } else {
        toast.error("Upload completed but no prospects were processed");
      }

      setSelectedFile(null);
      setFieldTags([]);
      setShowUploadModal(false);
      setUploadProgress(0);

      // Refresh data
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to upload file. Please try again.";
      toast.error(errorMessage);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  // Handle view data item - open GenericSidebar only (no modal)
  const handleViewData = useCallback((item: CrmDataItem) => {
    setSelectedDataItem(item);
    setSelectedProspect(item);
    setShowProspectSidebar(true);
  }, []);

  // Handle play call recording
  const handlePlayCallRecording = useCallback((recording: any) => {
    setSelectedRecording(recording);
    setShowRecordingPlayerModal(true);
  }, []);

  // Handle download call recording
  const handleDownloadCallRecording = useCallback(async (recording: any) => {
    const { Id, AgentExtension } = recording;

    // Add to downloading set and initialize progress
    setDownloadingRecordings((prev) => new Set(prev).add(Id));
    setDownloadProgress((prev) => ({ ...prev, [Id]: 0 }));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => {
          const currentProgress = prev[Id] || 0;
          if (currentProgress < 90) {
            return { ...prev, [Id]: currentProgress + Math.random() * 15 };
          }
          return prev;
        });
      }, 200);

      await DownloadCallRecording(
        Id,
        AgentExtension,
        "call-logs/recordings/download",
        recording.imagicle,
      );

      // Complete the progress
      clearInterval(progressInterval);
      setDownloadProgress((prev) => ({ ...prev, [Id]: 100 }));

      // Show completion briefly before hiding
      setTimeout(() => {
        setDownloadingRecordings((prev) => {
          const newSet = new Set(prev);
          newSet.delete(Id);
          return newSet;
        });
        setDownloadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[Id];
          return newProgress;
        });
      }, 1000);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Download failed");

      // Remove from downloading set on error
      setDownloadingRecordings((prev) => {
        const newSet = new Set(prev);
        newSet.delete(Id);
        return newSet;
      });
      setDownloadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[Id];
        return newProgress;
      });
    }
  }, []);

  // Handle delete data item
  const handleDeleteData = useCallback((item: CrmDataItem) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  }, []);

  // Confirm single delete
  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      await deleteCrmData(itemToDelete.id);
      setShowDeleteModal(false);
      setDeleteModalMode(null);
      setItemToDelete(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Delete error:", error);
    }
  }, [itemToDelete]);

  // Calculate filtered entry counts using API
  const calculateEntryCounts = useCallback(async () => {
    try {
      const campaignIds = Array.from(assignmentFilters.selectedCampaigns).map(
        (campaign) => parseInt(campaign.value),
      );
      const tags = Array.from(assignmentFilters.selectedTags).map(
        (tag) => tag.value,
      );

      const counts = await getCrmDataCounts(campaignIds, tags);

      return {
        total: counts.summary.total_records,
        assigned: counts.summary.assigned_records,
        unassigned: counts.summary.unassigned_records,
      };
    } catch (error) {
      console.error("Failed to get entry counts:", error);
      // Fallback to static data
      return {
        total: 5000,
        assigned: 2000,
        unassigned: 3000,
      };
    }
  }, [assignmentFilters]);

  // Auto-refetch counts when filter dropdowns change
  useEffect(() => {
    const refetchCounts = async () => {
      if (
        assignmentFilters.selectedCampaigns.length > 0 ||
        assignmentFilters.selectedTags.length > 0
      ) {
        try {
          const counts = await calculateEntryCounts();
          setAssignmentCounts(counts);
          setTotalEntriesToAssign(counts.unassigned);
        } catch (error) {
          console.error("Failed to refetch counts:", error);
        }
      }
    };

    refetchCounts();
  }, [
    assignmentFilters.selectedCampaigns,
    assignmentFilters.selectedTags,
    calculateEntryCounts,
  ]);

  // Handle data assignment
  const handleDataAssignment = useCallback(async () => {
    try {
      const counts = await calculateEntryCounts();
      setAssignmentCounts(counts);
      setTotalEntriesToAssign(counts.unassigned);
      setShowDataAssignmentModal(true);
    } catch (error) {
      console.error("Failed to get entry counts:", error);
      // Fallback to static data
      setAssignmentCounts({ total: 5000, assigned: 2000, unassigned: 3000 });
      setTotalEntriesToAssign(3000);
      setShowDataAssignmentModal(true);
    }
  }, [calculateEntryCounts]);

  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");

  // Handle data assignment directly (no second dialog)
  const handleDataAssignmentSubmit = useCallback(async () => {
    if (assignmentCampaign.length === 0) {
      toast.error("Please select at least one campaign to assign entries to");
      return;
    }

    if (totalEntriesToAssign === 0) {
      toast.error("Please specify how many entries to assign");
      return;
    }

    // Validate custom distribution if in custom mode
    if (assignmentDistribution === "custom") {
      const totalCustomAllocation = Object.values(customDistribution).reduce(
        (sum, count) => sum + count,
        0,
      );
      if (totalCustomAllocation !== totalEntriesToAssign) {
        toast.error(
          `Custom allocation must equal total entries to assign (${totalEntriesToAssign}). Current total: ${totalCustomAllocation}`,
        );
        return;
      }
    }

    try {
      const campaignFilterIds = Array.from(
        assignmentFilters.selectedCampaigns,
      ).map((campaign) => parseInt(campaign.value));
      console.log(assignmentFilters.selectedTags, "ZEZA");
      const tagIds = Array.from(assignmentFilters.selectedTags).map((tag) =>
        parseInt(tag.id),
      );

      const campaignIds = Array.from(assignmentCampaign).map((campaign) =>
        parseInt(campaign.value),
      );

      let result;

      if (assignmentDistribution === "equal") {
        // Equal distribution - single API call
        result = await assignCrmDataAdvanced(
          campaignIds,
          totalEntriesToAssign,
          campaignFilterIds,
          tagIds,
          "equal",
        );
      } else {
        // Custom distribution - single API call with campaign distribution
        const campaignDistribution: Record<number, number> = {};
        Array.from(assignmentCampaign).forEach((campaign: any) => {
          const campaignId = parseInt(campaign.value);
          const countForThisCampaign = customDistribution[campaign.value] || 0;
          if (countForThisCampaign > 0) {
            campaignDistribution[campaignId] = countForThisCampaign;
          }
        });

        result = await assignCrmDataAdvanced(
          campaignIds,
          totalEntriesToAssign,
          campaignFilterIds,
          tagIds,
          "custom",
          campaignDistribution,
        );
      }

      console.log("Assignment result:", result);

      // Close modal and reset state
      setShowDataAssignmentModal(false);
      setAssignmentFilters({
        selectedTags: [],
        selectedCampaigns: [],
      });
      setAssignmentCampaign([]);
      setAssignmentDistribution("equal");
      setTotalEntriesToAssign(0);
      setCustomDistribution({});

      setShowSuccessfulModal(true);
      setSuccessModalTitle("Data Assignment Successful!");
      setSuccessModalDescription("The data has been successfully assigned.");

      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Assign error:", error);
    }
  }, [
    assignmentCampaign,
    totalEntriesToAssign,
    assignmentFilters,
    assignmentDistribution,
    customDistribution,
  ]);

  // Handle mark as viewed
  const handleMarkAsViewed = useCallback(async (item: CrmDataItem) => {
    try {
      await markCrmDataAsViewed(item.id);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Mark as viewed error:", error);
    }
  }, []);

  // Handle call actions
  const handleCallAction = useCallback((action: string, item: CrmDataItem) => {
    const phone = item.phone;
    if (!phone) {
      toast.error("No phone number available for this entry");
      return;
    }

    switch (action) {
      case "whatsapp":
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}`, "_blank");
        break;
      case "phone":
        window.open(`tel:${phone}`, "_self");
        break;
      case "sms":
        window.open(`sms:${phone}`, "_self");
        break;
      case "facebook":
        toast.info("Facebook calling feature coming soon");
        break;
      case "telegram":
        toast.info("Telegram calling feature coming soon");
        break;
      case "skype":
        toast.info("Skype calling feature coming soon");
        break;
      default:
        toast.error("Unknown action");
    }
  }, []);

  const handleNoteCreate = (
    note: string,
    createTask: boolean,
    taskDueDate?: string,
  ) => {
    console.log("Note created:", {
      prospectId: selectedProspect.id,
      note,
      createTask,
      taskDueDate,
    });
  };
  // Handle call button click
  const handleCallClick = useCallback(
    async (item: CrmDataItem) => {
      const phone = item.phone;
      if (!phone) {
        toast.error("No phone number available for this entry");
        return;
      }

      if (!isInitialized) {
        toast.error("CTI not initialized. Please wait...");
        return;
      }

      try {
        const result = await dialNumber(phone);

        if (result.success) {
          toast.success(`Calling ${item.name || phone}...`);
        } else {
          toast.error(result.error || "Failed to make call");
        }
      } catch (error) {
        console.error("Call error:", error);
        toast.error("Failed to make call");
      }
    },
    [dialNumber, isInitialized],
  );

  // Handle recording playback
  const handlePlayRecording = useCallback((recordingUrl: string) => {
    // In a real app, this would open the recording player
    toast.info(`Playing recording: ${recordingUrl}`);
    console.log("Playing recording:", recordingUrl);
  }, []);

  // Handle data assignment modal close
  const handleDataAssignmentModalClose = useCallback(() => {
    setShowDataAssignmentModal(false);
    setAssignmentFilters({
      selectedTags: [],
      selectedCampaigns: [],
    });
    setAssignmentCampaign([]);
    setAssignmentDistribution("equal");
    setTotalEntriesToAssign(0);
    setCustomDistribution({});
  }, []);

  // After Call modal handlers
  const handleAfterCallModalClose = useCallback(() => {
    setShowAfterCallModal(false);
    setAfterCallData({
      disposition: "",
      callStatus: "",
      comment: "",
      nextCallDate: "",
      nextCallTime: "",
      generateLead: "no",
    });
  }, []);

  const handleAfterCallSubmit = useCallback(() => {
    if (!afterCallData.disposition) {
      toast.error("Please select a disposition");
      return;
    }
    if (!afterCallData.callStatus) {
      toast.error("Please select a call status");
      return;
    }
    if (!afterCallData.comment.trim()) {
      toast.error("Please add a comment");
      return;
    }
    if (!afterCallData.generateLead) {
      toast.error("Please select whether to generate a lead");
      return;
    }

    // Close the dialog
    handleAfterCallModalClose();

    // If lead generation is selected, redirect to create lead page with prospect data
    if (afterCallData.generateLead === "yes" && selectedDataItem) {
      // Show success message and navigate to create lead page
      toast.success(
        "Redirecting to create lead page with pre-filled prospect data...",
      );
      window.location.href = `/crm/leads/create?crm_data_id=${selectedDataItem.id}`;
    } else {
      toast.success("After call data saved successfully! No lead generated.");
      setShowSuccessfulModal(true);
      setSuccessModalTitle("After Call Successful!");
      setSuccessModalDescription(
        "The after call data has been successfully saved.",
      );
    }
  }, [afterCallData, selectedDataItem, handleAfterCallModalClose]);

  // Schedule/Unschedule call handlers
  const handleScheduleCall = useCallback((entry: any) => {
    setSelectedEntryForSchedule(entry);

    // Check if entry has a scheduled call - if yes, we're editing
    if (entry.scheduled_call_at) {
      setIsEditingSchedule(true);
      const scheduledDate = moment(entry.scheduled_call_at);
      setScheduleData({
        date: scheduledDate.format("YYYY-MM-DD"),
        time: scheduledDate.format("HH:mm"),
        notes: entry.note || "",
      });
    } else {
      setIsEditingSchedule(false);
      setScheduleData({
        date: "",
        time: "",
        notes: "",
      });
    }
    setShowScheduleModal(true);
  }, []);

  const handleUnscheduleCallClick = useCallback((entry: any) => {
    setEntryToUnschedule(entry);
    setShowUnscheduleModal(true);
  }, []);

  const confirmUnscheduleCall = useCallback(async () => {
    if (!entryToUnschedule) return;

    try {
      const userExtension = (session?.user as any)?.extension || "default";
      await unscheduleCall(entryToUnschedule.id, userExtension);
      setRefreshKey((prev) => prev + 1);
      setShowUnscheduleModal(false);
      setEntryToUnschedule(null);
      toast.success("Call unscheduled successfully");
    } catch (error) {
      console.error("Failed to unschedule call:", error);
    }
  }, [entryToUnschedule, session]);

  // Schedule modal handlers
  const handleScheduleModalClose = useCallback(() => {
    setShowScheduleModal(false);
    setSelectedEntryForSchedule(null);
    setIsEditingSchedule(false);
    setScheduleData({
      date: "",
      time: "",
      notes: "",
    });
  }, []);

  const handleScheduleSubmit = useCallback(async () => {
    if (!scheduleData.date) {
      toast.error("Please select a date");
      return;
    }
    if (!scheduleData.time) {
      toast.error("Please select a time");
      return;
    }

    try {
      const userExtension = (session?.user as any)?.extension || "default";
      const scheduledDateTime = moment(
        `${scheduleData.date} ${scheduleData.time}`,
      ).toISOString();

      await scheduleCall(
        selectedEntryForSchedule.id,
        scheduledDateTime,
        userExtension,
        scheduleData.notes,
      );
      setRefreshKey((prev) => prev + 1);
      handleScheduleModalClose();
      setShowSuccessfulModal(true);
      setSuccessModalTitle(
        isEditingSchedule
          ? "Call Schedule Updated!"
          : "Schedule Call Successful!",
      );
      setSuccessModalDescription(
        isEditingSchedule
          ? "The call schedule has been successfully updated."
          : "The call has been successfully scheduled.",
      );
    } catch (error) {
      console.error(
        isEditingSchedule
          ? "Failed to update scheduled call:"
          : "Failed to schedule call:",
        error,
      );
    }
  }, [
    scheduleData,
    selectedEntryForSchedule,
    handleScheduleModalClose,
    session,
    isEditingSchedule,
  ]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.length === 0) {
      toast.error("Please select items to delete");
      return;
    }

    try {
      await bulkDeleteCrmData(selectedItems);
      setShowDeleteModal(false);
      setDeleteModalMode(null);
      setRefreshKey((prev) => prev + 1);
      setSelectedItems([]);
      setClearSelectedRows(!clearSelectedRows);
    } catch (error: any) {
      console.error("Bulk delete error:", error);
    }
  }, [selectedItems]);

  // Handle item selection
  const handleItemSelection = useCallback((selected: CrmDataItem[]) => {
    setSelectedItems(selected.map((item) => item.id));
  }, []);

  // Handle prospect row click
  const handleProspectClick = useCallback((prospect: any) => {
    setSelectedProspect(prospect);
    setShowProspectSidebar(true);
  }, []);

  // Handle close prospect sidebar
  const handleCloseProspectSidebar = useCallback(() => {
    setShowProspectSidebar(false);
    setSelectedProspect(null);
  }, []);

  // Handle owner change from prospect sidebar (Update owner dropdown)
  const handleProspectOwnerSelect = useCallback(
    async (ownerValue: string) => {
      const prospect = selectedProspect;
      if (!prospect?.id) return;
      const name = prospect.name ?? "";
      const phone = prospect.phone ?? "";
      const campaignId =
        prospect.campaign_id ?? prospect.campaign?.id ?? null;
      const existingData = (prospect.data as Record<string, unknown>) ?? {};
      try {
        await updateCrmData(prospect.id, {
          name,
          phone,
          campaign_id: campaignId,
          data: { ...existingData, contact_owner: ownerValue || undefined },
        });
        fetchCrmData();
        setSelectedProspect((prev: CrmDataItem | null) =>
          prev
            ? {
                ...prev,
                data: {
                  ...(prev.data as Record<string, unknown>),
                  contact_owner: ownerValue || null,
                },
              }
            : null,
        );
      } catch {
        // Error already shown by updateCrmData
      }
    },
    [selectedProspect, fetchCrmData],
  );

  // Handle open filters sidebar
  const handleOpenFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(true);
  }, []);

  // Handle close filters sidebar
  const handleCloseFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(false);
  }, []);

  // Handle preview button click - shows sidebar
  const handlePreviewClick = useCallback((prospect: any) => {
    setSelectedProspect(prospect);
    setShowProspectSidebar(true);
  }, []);

  // Handle first column click - navigates to detail page with prospect ID in URL
  const handleFirstColumnClick = useCallback(
    (prospect: any) => {
      router.push(
        `/crm/prospects/prospects-detailpage?id=${prospect?.id ?? ""}`,
      );
    },
    [router],
  );

  // Stats cards data for metrics
  const prospectsStatsCards: StatsCardData[] = useMemo(
    () => [
      {
        title: "All Prospects",
        value: metrics.total_all_records ?? 0,
        icon: Users,
        iconColor: "#6366F1",
        iconBgColor: "#EEF2FF",
        subtitle: `${metrics.assigned_records} Assigned / ${metrics.unassigned_records} Unassigned`,
      },
      {
        title: "Scheduled",
        value: metrics.scheduled_records ?? 0,
        icon: Calendar,
        iconColor: "#10B981",
        iconBgColor: "#D1FAE5",
        metric: {
          text: `${metrics.scheduled_next_hour_records ?? 0} in next hour`,
          dotColor: "#F59E0B",
        },
      },
      {
        title: "Overdue",
        value: metrics.overdue_scheduled_records ?? 0,
        icon: ClockIcon,
        iconColor: "#F97316",
        iconBgColor: "#FFEDD5",
        metric: {
          text: "Client-defined",
          dotColor: "#F97316",
        },
      },
      {
        title: "Converted Prospects",
        value: metrics.converted_prospects_records ?? 0,
        icon: Target,
        iconColor: "#8B5CF6",
        iconBgColor: "#EDE9FE",
        metric: {
          text: "Has associated leads",
          dotColor: "#8B5CF6",
        },
      },
      {
        title: "Recently Contacted",
        value: metrics.recently_contacted_last_24h_records ?? 0,
        icon: MessageCircle,
        iconColor: "#0EA5E9",
        iconBgColor: "#E0F2FE",
        metric: {
          text: "In last 24 hrs",
          dotColor: "#0EA5E9",
        },
      },
      {
        title: "Not Contacted",
        value: metrics.not_contacted_records ?? 0,
        icon: XCircle,
        iconColor: "#64748B",
        iconBgColor: "#F1F5F9",
        metric: {
          text: "No call attempt has occurred yet.",
          dotColor: "#94A3B8",
        },
      },
    ],
    [metrics],
  );

  // Define columns for GenericTable - Clean declarative definitions
  const prospectsColumns: TableColumn<any>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
        type: "avatar",
        avatar: {
          getInitials: (row) => getInitials(row.name),
          getColor: (row) => getRandomColor(row.name),
        },
        emptyValue: "N/A",
      },
      {
        key: "phone",
        label: "Phone",
        sortable: true,
        type: "custom",
        align: "left",
      },
      {
        key: "source_file",
        label: "Source",
        sortable: true,
        type: "badge",
        badge: {
          getVariant: () => "secondary",
        },
        emptyValue: "N/A",
      },
      {
        key: "user_extension",
        label: "Assigned To",
        sortable: true,
        type: "badge",
        accessor: (row) => {
          const extension = extensions.find(
            (ext: any) => ext.id.toString() === row.user_extension?.toString(),
          );
          return row.user_extension
            ? extension?.display_name || row.user_extension
            : "Unassigned";
        },
        badge: {
          getVariant: (row) => (row.user_extension ? "success" : "secondary"),
          showDot: () => true,
        },
      },
      {
        key: "campaign",
        label: "Campaign",
        sortable: true,
        type: "badge",
        accessor: (row) => row.campaign?.name || "No Campaign",
        badge: {
          getVariant: (row) => (row.campaign ? "primary" : "info"),
        },
      },
      {
        key: "last_called_at",
        label: "Last Called",
        sortable: true,
        type: "text",
        accessor: (row) =>
          row.last_called_at
            ? moment(row.last_called_at).format("MMM DD, HH:mm")
            : "-",
      },
      {
        key: "last_call_end_reason",
        label: "Last Call Status",
        sortable: true,
        type: "badge",
        accessor: (row) => {
          if (!row.last_call_end_reason) return null;
          const endReason = callEndReasons.find(
            (r) => r.value === row.last_call_end_reason,
          );
          return endReason?.label || row.last_call_end_reason;
        },
        badge: {
          getVariant: (row) => {
            if (!row.last_call_end_reason) return "secondary";
            const endReason = callEndReasons.find(
              (r) => r.value === row.last_call_end_reason,
            );
            return (endReason?.color as any) || "secondary";
          },
        },
        emptyValue: "-",
      },
      {
        key: "disposition",
        label: "Disposition",
        sortable: true,
        type: "badge",
        accessor: (row) => {
          if (!row.disposition) return null;
          const dispositions = [
            { value: "interested", label: "Interested", color: "success" },
            {
              value: "not_interested",
              label: "Not Interested",
              color: "danger",
            },
            {
              value: "callback_requested",
              label: "Callback Requested",
              color: "warning",
            },
            { value: "no_answer", label: "No Answer", color: "warning" },
            { value: "busy", label: "Busy", color: "info" },
            { value: "do_not_call", label: "Do Not Call", color: "danger" },
            { value: "wrong_number", label: "Wrong Number", color: "info" },
            { value: "follow_up", label: "Follow Up", color: "primary" },
          ];
          const disposition = dispositions.find(
            (d) => d.value === row.disposition,
          );
          if (disposition) return disposition.label;
          // Fallback to random for demo
          const randomDisposition =
            dispositions[Math.floor(Math.random() * dispositions.length)];
          return randomDisposition.label;
        },
        badge: {
          getVariant: (row) => {
            if (!row.disposition) return "secondary";
            const dispositions = [
              { value: "interested", color: "success" },
              { value: "not_interested", color: "danger" },
              { value: "callback_requested", color: "warning" },
              { value: "no_answer", color: "warning" },
              { value: "busy", color: "info" },
              { value: "do_not_call", color: "danger" },
              { value: "wrong_number", color: "info" },
              { value: "follow_up", color: "primary" },
            ];
            const disposition = dispositions.find(
              (d) => d.value === row.disposition,
            );
            if (disposition) return disposition.color as any;
            // Fallback to random for demo
            const randomColors = [
              "success",
              "danger",
              "warning",
              "info",
              "primary",
            ];
            return randomColors[
              Math.floor(Math.random() * randomColors.length)
            ] as any;
          },
        },
        emptyValue: "-",
      },
      {
        key: "scheduled_call_at",
        label: "Next Call",
        sortable: true,
        type: "badge",
        accessor: (row) => {
          if (!row.scheduled_call_at) return "Not scheduled";
          const isOverdue = moment(row.scheduled_call_at).isBefore(moment());
          const isNextHour = moment(row.scheduled_call_at).isBefore(
            moment().add(1, "hour"),
          );
          const formatted = moment(row.scheduled_call_at).format(
            "MMM DD, HH:mm",
          );
          if (isOverdue) return `${formatted} (Overdue)`;
          if (isNextHour) return `${formatted} (Soon)`;
          return formatted;
        },
        badge: {
          getVariant: (row) => {
            if (!row.scheduled_call_at) return "info";
            const isOverdue = moment(row.scheduled_call_at).isBefore(moment());
            const isNextHour = moment(row.scheduled_call_at).isBefore(
              moment().add(1, "hour"),
            );
            return isOverdue ? "danger" : isNextHour ? "warning" : "info";
          },
        },
      },
      {
        key: "tags",
        label: "Tags",
        sortable: false,
        type: "custom",
        render: (row) => (
          <div className="d-flex gap-1 flex-wrap">
            {(row.tags || []).map((tag: any, idx: number) => (
              <span key={idx} className="gt-badge gt-badge-secondary">
                {tag.name || tag}
              </span>
            ))}
          </div>
        ),
      },
    ],
    [extensions, callEndReasons, handleCallClick],
  );

  // Define table actions
  const prospectsActions: TableAction<any>[] = useMemo(
    () => [
      ...(session?.user?.permissions?.includes("view-crm-data-management")
        ? [
            {
              label: "View",
              icon: <Eye size={16} />,
              onClick: (row: any) => handleViewData(row),
              variant: "link" as const,
            },
          ]
        : []),
      ...(session?.user?.permissions?.includes("view-crm-data-management")
        ? [
            {
              label: "Edit",
              icon: <FiEdit size={16} />,
              onClick: (row: any) => {
                setEditingContactId(row.id);
                setShowCreateContactSidebar(true);
              },
              variant: "link" as const,
            },
          ]
        : []),
      ...(session?.user?.permissions?.includes(
        "call-service-crm-data-management",
      )
        ? [
            {
              label: "Call",
              icon: <PhoneIcon size={16} />,
              onClick: (row: any) => handleCallClick(row),
              variant: "link" as const,
              className: "text-success",
            },
          ]
        : []),
      ...(activeFilter !== "has_leads"
        ? [
            {
              label: "More Actions",
              icon: <MoreVertical size={16} />,
              variant: "link" as const,
              dropdown: {
                align: "end" as const,
                options: [
                  ...(session?.user?.permissions?.includes(
                    "call-service-crm-data-management",
                  )
                    ? [
                        {
                          label: "Schedule Call",
                          icon: <FiCalendar size={14} />,
                          onClick: (row: any) => handleScheduleCall(row),
                          show: (row: any) => !row.scheduled_call_at,
                        },
                        {
                          label: "Edit Scheduled Call",
                          icon: <FiCalendar size={14} />,
                          onClick: (row: any) => handleScheduleCall(row),
                          show: (row: any) => !!row.scheduled_call_at,
                        },
                        {
                          label: "Unschedule Call",
                          icon: <FiX size={14} />,
                          onClick: (row: any) => handleUnscheduleCallClick(row),
                          className: "text-danger",
                          show: (row: any) => !!row.scheduled_call_at,
                          divider: true,
                        },
                      ]
                    : []),
                  {
                    label: "Convert to Lead",
                    icon: <FiTarget size={14} />,
                    onClick: (row: any) => {
                      setConvertingProspectId(row.id);
                      setShowConvertToLeadModal(true);
                    },
                  },
                  {
                    label: "Send Email",
                    icon: <Mail size={14} />,
                    onClick: (row: any) => {
                      window.location.href = `mailto:${row.email}`;
                    },
                    show: (row: any) => !!row.email,
                  },
                ],
              },
            },
          ]
        : []),
      ...(session?.user?.permissions?.includes("delete-crm-data-management")
        ? [
            {
              label: "Delete",
              icon: <Trash2 size={16} />,
              onClick: (row: any) => {
                setDeleteModalMode("single");
                setItemToDelete(row);
                setShowDeleteModal(true);
              },
              variant: "link" as const,
              className: "text-danger",
            },
          ]
        : []),
    ],
    [
      session,
      activeFilter,
      handleViewData,
      handleCallClick,
      handleScheduleCall,
      handleUnscheduleCallClick,
    ],
  );

  // Define old columns for GenericListPage (keep for backward compatibility if needed)
  const columns: Column[] = useMemo(
    () => [
      {
        key: "name",
        name: "Name",
        selector: (row: any) => row.name,
        sortable: true,
        cell: (props: any) => (
          <div>
            {props.name ? (
              <span className="text-muted">{props.name}</span>
            ) : (
              <span className="text-muted">N/A</span>
            )}
          </div>
        ),
      },
      {
        key: "phone",
        name: "Phone",
        selector: (row: any) => row.phone,
        sortable: true,
        cell: (props: any) => (
          <div>
            {props.phone ? (
              <span className="status-badge info">{props.phone}</span>
            ) : (
              <span className="status-badge info">N/A</span>
            )}
          </div>
        ),
      },
      {
        key: "source",
        name: "Source",
        selector: (row: any) => row.source_file,
        sortable: true,
        cell: (props: any) => (
          <div>
            {props.source_file ? (
              <span className="status-badge secondary">
                {props.source_file}
              </span>
            ) : (
              <span className="text-muted">N/A</span>
            )}
          </div>
        ),
      },
      {
        key: "user_extension",
        name: "Assigned To",
        selector: (row: any) => row.user_extension,
        sortable: true,
        cell: (props: any) => (
          <div>
            {props.user_extension ? (
              <span className="status-badge success">
                {extensions.find(
                  (extension: any) =>
                    extension.id.toString() ===
                    props.user_extension?.toString(),
                )?.display_name || props.user_extension}
              </span>
            ) : (
              <span className="status-badge default">Unassigned</span>
            )}
          </div>
        ),
      },
      {
        key: "campaign",
        name: "Campaign",
        selector: (row: any) => row.campaign_id,
        sortable: true,
        cell: (props: any) => {
          return (
            <div>
              {props?.campaign ? (
                <span className="status-badge primary">
                  {props.campaign?.name}
                </span>
              ) : (
                <span className="status-badge info">No Campaign</span>
              )}
            </div>
          );
        },
      },
      {
        key: "last_called_at",
        name: "Last Called",
        selector: (row: any) => row.last_called_at,
        sortable: true,
        cell: (props: any) => {
          // Generate random date within last week
          const now = moment();
          const oneWeekAgo = moment().subtract(7, "days");
          const randomDays = Math.floor(Math.random() * 7);
          const randomHours = Math.floor(Math.random() * 24);
          const randomMinutes = Math.floor(Math.random() * 60);

          const lastCalled = oneWeekAgo
            .add(randomDays, "days")
            .add(randomHours, "hours")
            .add(randomMinutes, "minutes")
            .toISOString();

          return (
            <div className="d-flex align-items-center">
              <span className="text-uppercase">
                {lastCalled
                  ? moment(lastCalled).format(GlobalDateTimeFormat)
                  : "-"}
              </span>
            </div>
          );
        },
      },
      {
        key: "last_call_end_reason",
        name: "Last Call Status",
        selector: (row: any) => row.last_call_end_reason,
        sortable: true,
        cell: (props: any) => {
          // Static data for now
          const endReason =
            callEndReasons.find((r) => r.value === "answered") ||
            callEndReasons[0];
          return (
            <span className={`status-badge ${endReason.color as any}`}>
              {endReason.label}
            </span>
          );
        },
      },
      {
        key: "disposition",
        name: "Disposition",
        selector: (row: any) => row.disposition,
        sortable: true,
        cell: (props: any) => {
          // Static disposition data for now
          const dispositions = [
            { value: "interested", label: "Interested", color: "success" },
            {
              value: "not_interested",
              label: "Not Interested",
              color: "danger",
            },
            {
              value: "callback_requested",
              label: "Callback Requested",
              color: "warning",
            },
            { value: "no_answer", label: "No Answer", color: "warning" },
            { value: "busy", label: "Busy", color: "info" },
            { value: "do_not_call", label: "Do Not Call", color: "danger" },
            { value: "wrong_number", label: "Wrong Number", color: "info" },
            { value: "follow_up", label: "Follow Up", color: "primary" },
          ];

          // Randomly select a disposition for demo purposes
          const randomDisposition =
            dispositions[Math.floor(Math.random() * dispositions.length)];

          return (
            <span className={`status-badge ${randomDisposition.color as any}`}>
              {randomDisposition.label}
            </span>
          );
        },
      },
      {
        key: "scheduled_call_at",
        name: "Next Call",
        selector: (row: any) => row.scheduled_call_at,
        sortable: true,
        cell: (props: any) => {
          if (!props.scheduled_call_at) {
            return <span className="status-badge info">Not scheduled</span>;
          }

          const isOverdue = moment(props.scheduled_call_at).isBefore(moment());
          const isNextHour = moment(props.scheduled_call_at).isBefore(
            moment().add(1, "hour"),
          );

          return (
            <div className="d-flex align-items-center">
              <span
                className={`status-badge text-uppercase ${
                  isOverdue ? "danger" : isNextHour ? "warning" : ""
                }`}
              >
                {props.scheduled_call_at
                  ? moment(props.scheduled_call_at).format(GlobalDateTimeFormat)
                  : "-"}
                {isOverdue && <span className="ms-1 fw-bold">(Overdue)</span>}
                {isNextHour && !isOverdue && (
                  <span className="ms-1 fw-bold">(Soon)</span>
                )}
              </span>
            </div>
          );
        },
      },

      ...(session?.user?.permissions?.includes("view-crm-data-management")
        ? [
            {
              key: "view_action",
              name: "View",
              selector: (row: any) => row.id,
              sortable: false,
              cell: (props: any) => (
                <Button
                  variant="primary"
                  className="app-button"
                  size="sm"
                  onClick={() => handleViewData(props)}
                  title="View Details"
                >
                  <FiEye size={14} />
                </Button>
              ),
            },
          ]
        : []),

      {
        key: "call_action",
        name: "Call",
        selector: (row: any) => row.id,
        sortable: false,
        cell: (props: any) => (
          <div className="d-flex gap-1">
            {session?.user?.permissions?.includes(
              "call-service-crm-data-management",
            ) && (
              <Button
                variant="success"
                className="app-button"
                size="sm"
                onClick={() => handleCallClick(props)}
                title="Call Now"
              >
                <FiPhone size={14} />
              </Button>
            )}

            <Dropdown>
              <Dropdown.Toggle
                variant="outline-secondary"
                size="sm"
                className="app-button"
                id={`dropdown-${props.id}`}
              >
                <FiMoreVertical size={14} />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {session?.user?.permissions?.includes(
                  "call-service-crm-data-management",
                ) && (
                  <>
                    {props.scheduled_call_at ? (
                      <>
                        <Dropdown.Item
                          onClick={() => handleScheduleCall(props)}
                        >
                          <FiCalendar size={14} className="me-2" />
                          Edit Scheduled Call
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => handleUnscheduleCallClick(props)}
                          className="text-danger"
                        >
                          <FiX size={14} className="me-2" />
                          Unschedule Call
                        </Dropdown.Item>
                      </>
                    ) : (
                      <Dropdown.Item onClick={() => handleScheduleCall(props)}>
                        <FiCalendar size={14} className="me-2" />
                        Schedule Call
                      </Dropdown.Item>
                    )}
                    <Dropdown.Divider />
                  </>
                )}
                <Dropdown.Item
                  onClick={() => {
                    window.location.href = `/crm/leads/create?crm_data_id=${props.id}`;
                  }}
                >
                  <FiTarget size={14} className="me-2" />
                  Convert to Lead
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        ),
      },

      {
        key: "tags",
        name: "Tags",
        selector: (row: any) => row.tags,
        sortable: false,
        cell: (props: any) => {
          // Show hardcoded tags for now
          const tags = props.tags;
          return (
            <div className="d-flex flex-wrap gap-1">
              {tags?.map((tag: any, index: any) => (
                <span key={index} className="status-badge info">
                  {tag.name}
                </span>
              ))}
            </div>
          );
        },
      },
      // {
      //   key: "delete_action",
      //   name: "Delete",
      //   selector: (row: any) => row.id,
      //   sortable: false,
      //   cell: (props: any) => (
      //     <Button
      //       variant="danger"
      //       className="app-button"
      //       size="sm"
      //       onClick={() => handleDeleteData(props)}
      //       title="Delete Entry"
      //     >
      //       <FiTrash2 size={14} />
      //     </Button>
      //   ),
      // },
    ],
    [
      handleViewData,
      handleMarkAsViewed,
      handleDeleteData,
      handleCallAction,
      handleCallClick,
      handlePlayRecording,
      extensions,
      availableCampaigns,
      callEndReasons,
      handleScheduleCall,
      handleUnscheduleCallClick,
    ],
  );

  // Render Add Contacts Button with Dropdown (and Bulk Delete when rows selected)
  const renderAddContactsButton = () => (
    <div
      style={{
        position: "absolute",
        right: "19px",
        top: "18px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
      ref={addContactsRef}
    >
      {session?.user?.permissions?.includes("delete-crm-data-management") &&
        selectedItems.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setDeleteModalMode("bulk");
              setShowDeleteModal(true);
            }}
            style={{
              padding: "9px 13px",
              backgroundColor: "#dc3545",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#c82333";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#dc3545";
            }}
          >
            <Trash2 size={16} />
            Delete ({selectedItems.length})
          </button>
        )}
      <div style={{ width: "146px" }}>
        <button
          onClick={() => setShowAddContactsDropdown(!showAddContactsDropdown)}
          style={{
            padding: "9px 13px",
            backgroundColor: "#000000",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1a1a1a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#000000";
          }}
        >
          Add prospects
          <ChevronDown size={16} />
        </button>

      {showAddContactsDropdown && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "4px",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "5px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            minWidth: "160px",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => {
              setShowAddContactsDropdown(false);
              setEditingContactId(null);
              setContactForm({
                firstName: "",
                lastName: "",
                email: "",
                phone_country_code: "",
                phoneNumber: "",
                campaign_id: null,
                contact_owner: null,
                lifecycle_stage: "Lead",
                disposition: "",
                legal_basis: [],
                company_domain: "",
                scheduled_call_at: "",
                tags: [],
                note: "",
                source: "",
              });
              setShowCreateContactSidebar(true);
            }}
            style={{
              width: "100%",
              padding: "12px 16px",
              backgroundColor: "transparent",
              border: "none",
              textAlign: "left",
              fontSize: "14px",
              color: "#141414",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f7fafc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Create new
          </button>
          <button
            onClick={() => {
              setShowAddContactsDropdown(false);
              setShowUploadModal(true);
            }}
            style={{
              width: "100%",
              padding: "12px 16px",
              backgroundColor: "transparent",
              border: "none",
              textAlign: "left",
              fontSize: "14px",
              color: "#d97706",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f7fafc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Import
          </button>
        </div>
      )}
      </div>
    </div>
  );

  // Create prospect (contact) API submit - POST crm/crm-data { name, phone, data }
  const handleCreateContactSubmit = useCallback(
    async (addAnother: boolean) => {
      const name = [contactForm.firstName, contactForm.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      if (!name || !contactForm.email || !contactForm.phoneNumber?.trim()) {
        toast.error("Name, email and phone are required");
        return;
      }
      if (contactForm.campaign_id == null) {
        toast.error("Campaign is required");
        return;
      }
      const sessionUser = session?.user as any;
      const userExtension = String(sessionUser?.phone ?? "");
      const assignedTo = userExtension;
      const uploadedBy = userExtension;

      const phoneForPayload =
        contactForm.phone_country_code && contactForm.phoneNumber?.trim()
          ? `${contactForm.phone_country_code} ${contactForm.phoneNumber.trim()}`
          : contactForm.phoneNumber?.trim() ?? "";
      setCreateContactLoading(true);
      try {
        await createCrmData({
          name,
          phone: phoneForPayload,
          user_extension: userExtension,
          campaign_id: contactForm.campaign_id ?? null,
          scheduled_call_at: contactForm.scheduled_call_at || undefined,
          company_domain: contactForm.company_domain?.trim() || undefined,
          source: contactForm.source?.trim() || undefined,
          data: {
            email: contactForm.email.trim(),
            assigned_to: assignedTo,
            uploaded_by: uploadedBy,
            disposition: contactForm.disposition || undefined,
            tags: contactForm.tags?.length
              ? contactForm.tags.map((t) => t.value || t.label)
              : undefined,
            note: contactForm.note || undefined,
            contact_owner: contactForm.contact_owner ?? undefined,
            lifecycle_stage: contactForm.lifecycle_stage || undefined,
            legal_basis: contactForm.legal_basis?.length
              ? contactForm.legal_basis
              : undefined,
          },
        });
        fetchCrmData();
        setContactForm({
          firstName: "",
          lastName: "",
          email: "",
          phone_country_code: "",
          phoneNumber: "",
          campaign_id: null,
          contact_owner: null,
          lifecycle_stage: "Lead",
          disposition: "",
          legal_basis: [],
          company_domain: "",
          scheduled_call_at: "",
          tags: [],
          note: "",
          source: "",
        });
        if (!addAnother) {
          setShowCreateContactSidebar(false);
        }
      } catch {
        // Error already shown by createCrmData
      } finally {
        setCreateContactLoading(false);
      }
    },
    [contactForm, fetchCrmData, session?.user],
  );

  const handleUpdateContactSubmit = useCallback(async () => {
    if (editingContactId == null) return;
    const name = [contactForm.firstName, contactForm.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (
      !name ||
      !contactForm.email?.trim() ||
      !contactForm.phoneNumber?.trim()
    ) {
      toast.error("Name, email and phone are required");
      return;
    }
    if (contactForm.campaign_id == null) {
      toast.error("Campaign is required");
      return;
    }
    const phoneForPayload =
      contactForm.phone_country_code && contactForm.phoneNumber?.trim()
        ? `${contactForm.phone_country_code} ${contactForm.phoneNumber.trim()}`
        : contactForm.phoneNumber?.trim() ?? "";
    setCreateContactLoading(true);
    try {
      await updateCrmData(editingContactId, {
        name,
        phone: phoneForPayload,
        campaign_id: contactForm.campaign_id ?? null,
        company_domain: contactForm.company_domain?.trim() || undefined,
        source: contactForm.source?.trim() || undefined,
        scheduled_call_at: contactForm.scheduled_call_at || undefined,
        data: {
          email: contactForm.email.trim(),
          disposition: contactForm.disposition || undefined,
          tags: contactForm.tags?.length
            ? contactForm.tags.map((t) => t.value || t.label)
            : undefined,
          note: contactForm.note || undefined,
          contact_owner: contactForm.contact_owner ?? undefined,
          lifecycle_stage: contactForm.lifecycle_stage || undefined,
          legal_basis: contactForm.legal_basis?.length
            ? contactForm.legal_basis
            : undefined,
        },
      });
      fetchCrmData();
      setShowCreateContactSidebar(false);
      setEditingContactId(null);
    } catch {
      // Error already shown by updateCrmData
    } finally {
      setCreateContactLoading(false);
    }
  }, [editingContactId, contactForm, fetchCrmData]);

  // Render Create Contact Sidebar
  const renderCreateContactSidebar = () => {
    if (!showCreateContactSidebar) return null;

    const isFormValid =
      contactForm.email?.trim() &&
      contactForm.phoneNumber?.trim() &&
      (contactForm.firstName?.trim() || contactForm.lastName?.trim()) &&
      contactForm.campaign_id != null;

    return (
      <>
        {/* Overlay */}
        <div
          className="contact-sidebar-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
          }}
          onClick={() => setShowCreateContactSidebar(false)}
        />

        {/* Sidebar */}
        <div
          className="contact-sidebar-container"
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "600px",
            height: "100vh",
            backgroundColor: "#ffffff",
            boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.1)",
            zIndex: 999999,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            className="contact-sidebar-header"
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid #eaf0f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2
              className="contact-sidebar-title"
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#141414",
                margin: 0,
              }}
            >
              {editingContactId ? "Edit Prospect" : "Create Prospect"}
            </h2>
            <button
              className="contact-sidebar-close-btn"
              onClick={() => {
                setShowCreateContactSidebar(false);
                setEditingContactId(null);
                setContactFormLoadError(null);
                setContactFormLoading(false);
              }}
              style={{
                background: "transparent",
                border: "none",
                padding: "4px",
                cursor: "pointer",
                color: "#718096",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={24} />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (
                !isFormValid ||
                createContactLoading ||
                (editingContactId != null && contactFormLoading)
              )
                return;
              if (editingContactId) handleUpdateContactSubmit();
              else handleCreateContactSubmit(false);
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
            }}
          >
            {contactFormLoadError && (
              <div
                style={{
                  padding: "12px 24px",
                  background: "#fef2f2",
                  color: "#b91c1c",
                  fontSize: "14px",
                }}
              >
                {contactFormLoadError}
              </div>
            )}
            {/* Form Content */}
            <div
              className="contact-sidebar-content"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "40px",
              }}
            >
              {editingContactId && contactFormLoading ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 280,
                    gap: "16px",
                  }}
                >
                  <Spinner
                    animation="border"
                    role="status"
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      color: "#0091ae",
                    }}
                  />
                  <span style={{ fontSize: "14px", color: "#64748b" }}>
                    Loading prospect...
                  </span>
                </div>
              ) : (
                <>
                  {/* Required: Name, Email, Phone */}
                  <div className="contact-form-section">
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label contact-form-label-required"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        First name <span style={{ color: "#f2545b" }}>*</span>
                      </label>
                      <input
                        type="text"
                        data-test-id="firstname-input"
                        value={contactForm.firstName}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            firstName: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#0091ae")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "#8a8a8a")
                        }
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label contact-form-label-required"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Last name <span style={{ color: "#f2545b" }}>*</span>
                      </label>
                      <input
                        type="text"
                        data-test-id="lastname-input"
                        value={contactForm.lastName}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            lastName: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#0091ae")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "#8a8a8a")
                        }
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label contact-form-label-required"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Email <span style={{ color: "#f2545b" }}>*</span>
                      </label>
                      <input
                        type="email"
                        data-test-id="email-input"
                        value={contactForm.email}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            email: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#0091ae")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "#8a8a8a")
                        }
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label contact-form-label-required"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Phone <span style={{ color: "#f2545b" }}>*</span>
                      </label>
                      <div className="phone-input-wrapper contact-form-phone-input-wrapper">
                        <PhoneInput
                          international
                          defaultCountry="US"
                          value={
                            contactForm.phone_country_code && contactForm.phoneNumber
                              ? `${contactForm.phone_country_code}${contactForm.phoneNumber}`
                              : contactForm.phoneNumber || undefined
                          }
                          onChange={(value) => {
                            if (value) {
                              try {
                                const phoneNumber = parsePhoneNumberInput(value);
                                if (phoneNumber) {
                                  setContactForm({
                                    ...contactForm,
                                    phone_country_code: `+${phoneNumber.countryCallingCode}`,
                                    phoneNumber: phoneNumber.nationalNumber,
                                  });
                                } else {
                                  setContactForm({
                                    ...contactForm,
                                    phone_country_code: "",
                                    phoneNumber: value,
                                  });
                                }
                              } catch {
                                setContactForm({
                                  ...contactForm,
                                  phone_country_code: "",
                                  phoneNumber: value,
                                });
                              }
                            } else {
                              setContactForm({
                                ...contactForm,
                                phone_country_code: "",
                                phoneNumber: "",
                              });
                            }
                          }}
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Optional: Campaign, Contact owner, Lifecycle stage, Disposition, Legal basis */}
                  <div
                    className="contact-form-section"
                    style={{ marginTop: "24px" }}
                  >
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label contact-form-label-required"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Campaign <span style={{ color: "#f2545b" }}>*</span>
                      </label>
                      {(() => {
                        const campaignSelectOptions = availableCampaigns.map(
                          (c) => ({
                            value: String(c.id),
                            label: c.label,
                          }),
                        );
                        return (
                          <Select
                            value={
                              contactForm.campaign_id != null
                                ? (campaignSelectOptions.find(
                                    (o) =>
                                      o.value ===
                                      String(contactForm.campaign_id),
                                  ) ?? null)
                                : null
                            }
                            onChange={(opt: any) =>
                              setContactForm({
                                ...contactForm,
                                campaign_id: opt?.value
                                  ? Number(opt.value)
                                  : null,
                              })
                            }
                            options={campaignSelectOptions}
                            placeholder="Select campaign"
                            isClearable
                            isSearchable
                            styles={{
                              control: (base) => ({
                                ...base,
                                minHeight: 40,
                                border: "1px solid #8a8a8a",
                                borderRadius: "4px",
                                fontSize: "14px",
                              }),
                            }}
                          />
                        );
                      })()}
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Owner
                      </label>
                      <Select
                        value={(() => {
                          const opts = extensions.map((ext: any) => ({
                            value: String(ext.extension ?? ext.id ?? ""),
                            label:
                              ext.display_name ||
                              ext.name ||
                              ext.extension ||
                              String(ext.id || ""),
                          }));
                          return contactForm.contact_owner != null
                            ? opts.find(
                                (o) => o.value === contactForm.contact_owner,
                              ) || null
                            : null;
                        })()}
                        onChange={(opt: any) =>
                          setContactForm({
                            ...contactForm,
                            contact_owner: opt?.value ?? null,
                          })
                        }
                        options={extensions.map((ext: any) => ({
                          value: String(ext.extension ?? ext.id ?? ""),
                          label:
                            ext.display_name ||
                            ext.name ||
                            ext.extension ||
                            String(ext.id || ""),
                        }))}
                        placeholder="Select owner"
                        isClearable
                        isSearchable
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: 40,
                            border: "1px solid #8a8a8a",
                            borderRadius: "4px",
                            fontSize: "14px",
                          }),
                        }}
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Source
                      </label>
                      <input
                        type="text"
                        value={contactForm.source}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            source: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#0091ae")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "#8a8a8a")
                        }
                        placeholder="Enter source"
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Lifecycle stage
                      </label>
                      <Dropdown>
                        <Dropdown.Toggle
                          variant="outline-secondary"
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 12px",
                            border: "1px solid #8a8a8a",
                            borderRadius: "4px",
                            fontSize: "14px",
                            backgroundColor: "#fff",
                          }}
                        >
                          {contactForm.lifecycle_stage || "Select..."}
                        </Dropdown.Toggle>
                        <Dropdown.Menu style={{ width: "100%" }}>
                          {["Lead", "Prospect", "Customer", "Evangelist"].map(
                            (stage) => (
                              <Dropdown.Item
                                key={stage}
                                onClick={() =>
                                  setContactForm({
                                    ...contactForm,
                                    lifecycle_stage: stage,
                                  })
                                }
                              >
                                {stage}
                              </Dropdown.Item>
                            ),
                          )}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Disposition
                      </label>
                      <Dropdown>
                        <Dropdown.Toggle
                          variant="outline-secondary"
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 12px",
                            border: "1px solid #8a8a8a",
                            borderRadius: "4px",
                            fontSize: "14px",
                            backgroundColor: "#fff",
                            color: contactForm.disposition
                              ? "#141414"
                              : "#a0aec0",
                          }}
                        >
                          {contactForm.disposition || "Select..."}
                        </Dropdown.Toggle>
                        <Dropdown.Menu style={{ width: "100%" }}>
                          {[
                            "interested",
                            "not_interested",
                            "callback_requested",
                            "no_answer",
                            "busy",
                            "do_not_call",
                            "wrong_number",
                            "follow_up",
                          ].map((d) => (
                            <Dropdown.Item
                              key={d}
                              onClick={() =>
                                setContactForm({
                                  ...contactForm,
                                  disposition: d,
                                })
                              }
                            >
                              {d.replace(/_/g, " ")}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Legal basis for processing contact&apos;s data
                      </label>
                      <Dropdown>
                        <Dropdown.Toggle
                          variant="outline-secondary"
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 12px",
                            border: "1px solid #8a8a8a",
                            borderRadius: "4px",
                            fontSize: "14px",
                            backgroundColor: "#fff",
                            color: contactForm.legal_basis?.length
                              ? "#141414"
                              : "#a0aec0",
                          }}
                        >
                          {contactForm.legal_basis?.length
                            ? contactForm.legal_basis.join(", ")
                            : "Select..."}
                        </Dropdown.Toggle>
                        <Dropdown.Menu
                          style={{ width: "100%", padding: "8px" }}
                        >
                          {[
                            "Legitimate interest",
                            "Consent",
                            "Contract",
                            "Legal obligation",
                            "Vital interests",
                            "Public task",
                          ].map((option) => (
                            <Dropdown.Item
                              key={option}
                              as="div"
                              style={{ padding: "4px 8px" }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const isSelected =
                                  contactForm.legal_basis.includes(option);
                                setContactForm({
                                  ...contactForm,
                                  legal_basis: isSelected
                                    ? contactForm.legal_basis.filter(
                                        (b) => b !== option,
                                      )
                                    : [...contactForm.legal_basis, option],
                                });
                              }}
                            >
                              <Form.Check
                                type="checkbox"
                                label={option}
                                checked={contactForm.legal_basis.includes(
                                  option,
                                )}
                                onChange={() => {}}
                              />
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </div>

                  {/* Optional: Datetime and text fields */}
                  <div
                    className="contact-form-section"
                    style={{
                      marginTop: "24px",
                      paddingTop: "24px",
                      borderTop: "1px solid #eaf0f6",
                    }}
                  >
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Company domain
                      </label>
                      <input
                        type="text"
                        value={contactForm.company_domain}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            company_domain: e.target.value,
                          })
                        }
                        placeholder="e.g. example.com"
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#0091ae")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "#8a8a8a")
                        }
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Scheduled call at
                      </label>
                      <input
                        type="datetime-local"
                        value={contactForm.scheduled_call_at}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            scheduled_call_at: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Tags
                      </label>
                      <CreatableSelect
                        isMulti
                        value={contactForm.tags}
                        onChange={(selected) =>
                          setContactForm({
                            ...contactForm,
                            tags: selected ? [...selected] : [],
                          })
                        }
                        options={availableTags.map((t: any) => ({
                          value: t.value,
                          label: t.label,
                          id: t.id,
                        }))}
                        placeholder="Select or create tags"
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: 40,
                            border: "1px solid #8a8a8a",
                            borderRadius: "4px",
                            fontSize: "14px",
                          }),
                        }}
                      />
                    </div>
                    <div
                      className="contact-form-field"
                      style={{ marginBottom: "20px" }}
                    >
                      <label
                        className="contact-form-label"
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#141414",
                          marginBottom: "8px",
                        }}
                      >
                        Note
                      </label>
                      <textarea
                        rows={3}
                        value={contactForm.note}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            note: e.target.value,
                          })
                        }
                        placeholder="Notes about this contact"
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #8a8a8a",
                          borderRadius: "4px",
                          fontSize: "14px",
                          outline: "none",
                          resize: "vertical",
                          fontFamily: "inherit",
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "#0091ae")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = "#8a8a8a")
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Buttons */}
            <div
              className="contact-sidebar-footer"
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #eaf0f6",
                display: "flex",
                gap: "12px",
                justifyContent: "flex-start",
              }}
            >
              <button
                type="submit"
                className="contact-form-btn-create"
                disabled={
                  !isFormValid ||
                  createContactLoading ||
                  (!!editingContactId && contactFormLoading)
                }
                style={{
                  padding: "10px 20px",
                  backgroundColor:
                    isFormValid && !createContactLoading
                      ? "#0091ae"
                      : "#cbd5e0",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor:
                    isFormValid && !createContactLoading
                      ? "pointer"
                      : "not-allowed",
                }}
                onMouseEnter={(e) => {
                  if (isFormValid && !createContactLoading)
                    e.currentTarget.style.backgroundColor = "#007a94";
                }}
                onMouseLeave={(e) => {
                  if (isFormValid && !createContactLoading)
                    e.currentTarget.style.backgroundColor = "#0091ae";
                }}
              >
                {createContactLoading
                  ? editingContactId
                    ? "Updating..."
                    : "Creating..."
                  : editingContactId
                    ? "Update"
                    : "Create"}
              </button>
              {!editingContactId && (
                <button
                  type="button"
                  className="contact-form-btn-create-another"
                  disabled={!isFormValid || createContactLoading}
                  onClick={() => handleCreateContactSubmit(true)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "transparent",
                    color:
                      isFormValid && !createContactLoading
                        ? "#141414"
                        : "#a0aec0",
                    border: "1px solid #8a8a8a",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor:
                      isFormValid && !createContactLoading
                        ? "pointer"
                        : "not-allowed",
                  }}
                  onMouseEnter={(e) => {
                    if (isFormValid && !createContactLoading)
                      e.currentTarget.style.backgroundColor = "#f7fafc";
                  }}
                  onMouseLeave={(e) => {
                    if (isFormValid && !createContactLoading)
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Create and add another
                </button>
              )}
              <button
                type="button"
                className="contact-form-btn-cancel"
                disabled={createContactLoading}
                onClick={() => {
                  setShowCreateContactSidebar(false);
                  setEditingContactId(null);
                  setContactFormLoadError(null);
                  setContactFormLoading(false);
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "transparent",
                  color: "#141414",
                  border: "1px solid #8a8a8a",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f7fafc")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </>
    );
  };

  if (!session?.user?.permissions?.includes("list-crm-data-management")) {
    return null;
  }

  return (
    <React.Fragment>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .prospects-table-wrapper {
          width: 100%;
          overflow: hidden;
        }
        .prospects-table-wrapper .table-responsive {
          width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
        }
        .prospects-table-wrapper .table-responsive table {
          width: 100%;
          table-layout: auto;
          margin-bottom: 0;
        }
        .prospects-table-wrapper .table-responsive table th,
        .prospects-table-wrapper .table-responsive table td {
          padding: 12px 16px;
          vertical-align: middle;
        }
        .prospects-table-wrapper .table-responsive table td:last-child,
        .prospects-table-wrapper .table-responsive table th:last-child {
          max-width: none;
        }
        .prospects-table-wrapper .table-responsive table td[style*="width"],
        .prospects-table-wrapper .table-responsive table th[style*="width"] {
          max-width: none;
        }
        .timeline-line {
          position: relative;
          height: 2px;
          background: #e9ecef;
          margin-top: 10px;
        }
        .timeline-line::after {
          content: "";
          position: absolute;
          top: -8px;
          left: 0;
          width: 2px;
          height: 18px;
          background: #e9ecef;
        }
        .timeline-item:last-child .timeline-line {
          display: none;
        }
        .generic-table-row.clickable {
          cursor: pointer;
        }
        
        
        /* Page layout for full height */
        .prospects-page-container {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 100px);
          overflow: hidden;
        }
        
        .prospects-content-area {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .prospects-scrollable-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }
        /* Phone input: match other form fields - border like text inputs, no blue focus glow */
        .contact-form-phone-input-wrapper .PhoneInput {
          border: 1px solid #8a8a8a !important;
          border-radius: 4px;
          padding: 10px 12px;
          font-size: 14px;
          box-shadow: none !important;
        }
        .contact-form-phone-input-wrapper .PhoneInput:focus-within {
          border-color: #0091ae !important;
          outline: none;
          box-shadow: none !important;
        }
      `,
        }}
      />
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Prospects"
      />
      {/* Main flex container for content and sidebar */}
      <div
        style={{
          display: "flex",
          gap: "0",
          height: "calc(100vh)",
          overflow: "hidden",
        }}
      >
        {/* Main content area */}
        <div className="prospects-scrollable-content" style={{ flex: 1 }}>
          {/* <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-0">
        <div className="mb-3 mb-md-0">
  <nav aria-label="breadcrumb">
    <ol className="breadcrumb mb-0">
      <li className="breadcrumb-item">
        <a href="/dashboard" className="text-decoration-none">
          CRM
        </a>
      </li>
      <li className="breadcrumb-item active fw-bold" aria-current="page">
        Prospects
      </li>
    </ol>
  </nav>
</div>
        <div className="d-flex flex-wrap gap-2">
         

{session?.user?.permissions?.includes("add-crm-data-management") && (
  <Button
    variant="outline-secondary"
    className=""
    onClick={() => setShowUploadModal(true)}
  >
    <span className="">
      <Download size={16} className="me-2" />
      Import Contacts
    </span>
  </Button>
)}

<Button
  variant="outline-secondary"
  className=""
  onClick={() => setShowFilterBar(!showFilterBar)}
>
  <span className="">
    <Layers size={16} className="me-2" />
    {showFilterBar ? "Hide Tabs" : "Show Tabs"}
  </span>
</Button>

<Button
  variant="outline-secondary"
  className=""
  onClick={handleOpenFiltersSidebar}
>
  <span className="">
    <FiFilter size={16} className="me-2" />
    Filters
  </span>
</Button>


        </div>
      </div> */}

          {/* Stats Cards */}
          {/* <StatsCards 
        data={[
          {
            title: 'All Prospects',
            value: totalRecords,
            icon: Users,
            iconColor: '#6366F1',
            iconBgColor: '#EEF2FF',
            subtitle: `${metrics.assigned_records} Assigned / ${metrics.unassigned_records} Unassigned`
          },
          {
            title: 'Scheduled',
            value: metrics.scheduled_records,
            icon: Calendar,
            iconColor: '#10B981',
            iconBgColor: '#D1FAE5',
            metric: {
              text: `${metrics.scheduled_next_hour_records} in next hour`,
              dotColor: '#F59E0B'
            }
          },
          {
            title: 'Convert to Leads',
            value: totalRecords > 0 ? `${((metrics.assigned_records / totalRecords) * 100).toFixed(1)}%` : '0%',
            icon: Target,
            iconColor: '#8B5CF6',
            iconBgColor: '#EDE9FE',
            badge: {
              text: `${metrics.assigned_records} Ready`,
              bgColor: '#FEF3C7',
              textColor: '#92400E'
            }
          },
          {
            title: 'All Prospects',
            value: totalRecords,
            icon: Users,
            iconColor: '#6366F1',
            iconBgColor: '#EEF2FF',
            subtitle: `${metrics.assigned_records} Assigned / ${metrics.unassigned_records} Unassigned`
          },
          {
            title: 'Scheduled',
            value: metrics.scheduled_records,
            icon: Calendar,
            iconColor: '#10B981',
            iconBgColor: '#D1FAE5',
            metric: {
              text: `${metrics.scheduled_next_hour_records} in next hour`,
              dotColor: '#F59E0B'
            }
          },
          {
            title: 'Convert to Leads',
            value: totalRecords > 0 ? `${((metrics.assigned_records / totalRecords) * 100).toFixed(1)}%` : '0%',
            icon: Target,
            iconColor: '#8B5CF6',
            iconBgColor: '#EDE9FE',
            badge: {
              text: `${metrics.assigned_records} Ready`,
              bgColor: '#FEF3C7',
              textColor: '#92400E'
            }
          }
        ]}
        gridMinWidth="180px"
      /> */}

          <div className="container-fluid">
            {/* Analytics Section - Collapsible */}
            {showProspectsAnalytics && (
              <>
                {/* Summary Stats Grid - Using KPICard design */}
                <Row className="mb-2">
                  <Col xl={3} lg={4} md={6} className="mb-3">
                    <KPICard
                      title="Total Prospects"
                      value={totalRecords}
                      icon={<Users size={24} />}
                      color="primary"
                    />
                  </Col>
                  <Col xl={3} lg={4} md={6} className="mb-3">
                    <KPICard
                      title="Prospects with Calls Scheduled"
                      value={metrics.scheduled_records}
                      icon={<Calendar size={24} />}
                      color="success"
                    />
                  </Col>
                  <Col xl={3} lg={4} md={6} className="mb-3">
                    <KPICard
                      title="Prospects with No Calls Scheduled"
                      value={metrics.not_scheduled_records}
                      icon={<XCircle size={24} />}
                      color="secondary"
                    />
                  </Col>
                  <Col xl={3} lg={4} md={6} className="mb-3">
                    <KPICard
                      title="Meetings in Next Hour"
                      value={metrics.scheduled_next_hour_records}
                      icon={<ClockIcon size={24} />}
                      color="info"
                    />
                  </Col>
                  {showAllProspectStats && (
                    <>
                      <Col xl={3} lg={4} md={6} className="mb-3">
                        <KPICard
                          title="Meetings in Next 24h"
                          value={metrics.scheduled_next_24_hours_records}
                          icon={<Calendar size={24} />}
                          color="warning"
                        />
                      </Col>

                      <Col xl={3} lg={4} md={6} className="mb-3">
                        <KPICard
                          title=" Prospects Assigned to Team Members"
                          value={metrics.assigned_records}
                          icon={<UserPlus size={24} />}
                          color="primary"
                        />
                      </Col>
                      <Col xl={3} lg={4} md={6} className="mb-3">
                        <KPICard
                          title="Prospects Not Assigned to Team Members"
                          value={metrics.unassigned_records}
                          icon={<AlertCircleIcon size={24} />}
                          color="warning"
                        />
                      </Col>
                    </>
                  )}
                </Row>

                <div className="text-center mb-4">
                  <Button
                    variant="link"
                    onClick={() =>
                      setShowAllProspectStats(!showAllProspectStats)
                    }
                    className="text-decoration-none"
                  >
                    {showAllProspectStats ? (
                      <>
                        <ArrowUp size={16} className="me-1" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ArrowDown size={16} className="me-1" />
                        Show More Stats
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {/* Filter Bar */}
            {showFilterBar &&
              session?.user?.permissions?.includes(
                "list-crm-data-management",
              ) && (
                <FilterBar
                  quickFilters={[
                    {
                      id: "all",
                      label: "All Prospects",
                      color: "#0d6efd",
                      icon: <Users size={16} />,
                    },
                    {
                      id: "scheduled",
                      label: "Scheduled",
                      color: "#20c997",
                      icon: <FiCalendar size={16} />,
                    },
                    {
                      id: "has_leads",
                      label: "Converted to Leads",
                      color: "#0dcaf0",
                      icon: <FiTarget size={16} />,
                    },
                  ]}
                  activeFilter={activeFilter}
                  onFilterChange={handleFilterChange}
                  // searchValue={prospectsSearch}
                  // onSearchChange={(value) => {
                  //   setProspectsSearch(value);
                  // }}
                  // onSearch={() =>
                  //   handleFiltersChange({
                  //     ...currentFilters,
                  //     search: prospectsSearch,
                  //   })
                  // }
                  // searchPlaceholder="Search by name or phone..."
                  // showAdvancedFilters={showAdvancedFilters}
                  // onToggleAdvancedFilters={() =>
                  //   setShowAdvancedFilters(!showAdvancedFilters)
                  // }
                  // advancedFilterCount={
                  //   (prospectsFilters.assignedTo !== null ? 1 : 0) +
                  //   (prospectsFilters.campaigns !== null &&
                  //   prospectsFilters.campaigns.length > 0
                  //     ? 1
                  //     : 0) +
                  //   (prospectsFilters.sourceFile !== null ? 1 : 0) +
                  //   (prospectsFilters.tags !== null &&
                  //   prospectsFilters.tags.length > 0
                  //     ? 1
                  //     : 0)
                  // }
                />
              )}

            {/* Advanced Filters */}
            {showAdvancedFilters &&
              session?.user?.permissions?.includes(
                "list-crm-data-management",
              ) && (
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <Row className="g-3 align-items-end">
                      <Col md={4}>
                        <Form.Label className="small fw-bold mb-2">
                          Search
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Search by name or phone..."
                          value={prospectsSearch}
                          onChange={(e) => setProspectsSearch(e.target.value)}
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold mb-2">
                          Owner
                        </Form.Label>
                        <Select
                          options={extensions.map((ext: any) => ({
                            value: ext.id || ext.extension,
                            label:
                              ext.display_name ||
                              ext.name ||
                              ext.id ||
                              ext.extension,
                          }))}
                          value={
                            prospectsFilters.assignedTo
                              ? (() => {
                                  const assignedToId =
                                    prospectsFilters.assignedTo;
                                  const ext = extensions.find(
                                    (e: any) =>
                                      (e.id || e.extension) === assignedToId,
                                  );
                                  return ext
                                    ? {
                                        value: assignedToId,
                                        label:
                                          ext.display_name ||
                                          ext.name ||
                                          assignedToId,
                                      }
                                    : {
                                        value: assignedToId,
                                        label: assignedToId,
                                      };
                                })()
                              : null
                          }
                          onChange={(selected) => {
                            const assignedToValue = selected
                              ? selected.value
                              : null;
                            setProspectsFilters((prev) => ({
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
                          Campaigns
                        </Form.Label>
                        <Select
                          isMulti
                          options={availableCampaigns.map((c) => ({
                            value: c.value,
                            label: c.label,
                          }))}
                          value={
                            prospectsFilters.campaigns
                              ? prospectsFilters.campaigns.map(
                                  (campaignId: string) => {
                                    const campaign = availableCampaigns.find(
                                      (c: any) => c.value === campaignId,
                                    );
                                    return campaign
                                      ? {
                                          value: campaignId,
                                          label: campaign.label,
                                        }
                                      : {
                                          value: campaignId,
                                          label: campaignId,
                                        };
                                  },
                                )
                              : null
                          }
                          onChange={(selected) => {
                            const campaignValues = selected
                              ? selected.map((s: any) => s.value)
                              : null;
                            setProspectsFilters((prev) => ({
                              ...prev,
                              campaigns: campaignValues,
                            }));
                            // Reset to all when campaign filter changes
                            setActiveFilter("all");
                          }}
                          placeholder="Select campaigns..."
                          styles={customSelectStyles}
                          isClearable
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold mb-2">
                          Next Call Date (From)
                        </Form.Label>
                        <Form.Control
                          type="date"
                          value={prospectsFilters.nextCallDateFrom || ""}
                          onChange={(e) => {
                            const dateValue = e.target.value || null;
                            setProspectsFilters((prev) => ({
                              ...prev,
                              nextCallDateFrom: dateValue,
                            }));
                          }}
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold mb-2">
                          Next Call Date (To)
                        </Form.Label>
                        <Form.Control
                          type="date"
                          value={prospectsFilters.nextCallDateTo || ""}
                          onChange={(e) => {
                            const dateValue = e.target.value || null;
                            setProspectsFilters((prev) => ({
                              ...prev,
                              nextCallDateTo: dateValue,
                            }));
                          }}
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold mb-2">
                          Source Name
                        </Form.Label>
                        <CreatableSelect
                          options={uniqueSources}
                          value={
                            prospectsFilters.sourceFile
                              ? {
                                  value: prospectsFilters.sourceFile,
                                  label: prospectsFilters.sourceFile,
                                }
                              : null
                          }
                          onChange={(selected) => {
                            const sourceValue = selected
                              ? selected.value
                              : null;
                            setProspectsFilters((prev) => ({
                              ...prev,
                              sourceFile: sourceValue,
                            }));
                            setActiveFilter("all");
                          }}
                          placeholder="Select or create source..."
                          styles={customSelectStyles}
                          isClearable
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold mb-2">
                          Tags
                        </Form.Label>
                        <Select
                          isMulti
                          options={availableTags.map((tag) => ({
                            value: tag.value,
                            label: tag.label,
                          }))}
                          value={
                            prospectsFilters.tags
                              ? prospectsFilters.tags.map(
                                  (tagValue: string) => {
                                    const tag = availableTags.find(
                                      (t: any) => t.value === tagValue,
                                    );
                                    return tag
                                      ? { value: tagValue, label: tag.label }
                                      : { value: tagValue, label: tagValue };
                                  },
                                )
                              : null
                          }
                          onChange={(selected) => {
                            const tagValues = selected
                              ? selected.map((s: any) => s.value)
                              : null;
                            setProspectsFilters((prev) => ({
                              ...prev,
                              tags: tagValues,
                            }));
                            setActiveFilter("all");
                          }}
                          placeholder="Select tags..."
                          styles={customSelectStyles}
                          isClearable
                        />
                      </Col>
                      <Col md={4}>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-secondary"
                            className="d-flex align-items-center justify-content-center"
                            onClick={() => {
                              // Map prospectsFilters to the format expected by handleFiltersChange
                              const filtersToApply: Record<string, any> = {};

                              if (prospectsSearch) {
                                filtersToApply.search = prospectsSearch;
                              }
                              if (prospectsFilters.assignedTo) {
                                filtersToApply.user_extension = [
                                  prospectsFilters.assignedTo,
                                ];
                              }
                              if (
                                prospectsFilters.campaigns &&
                                prospectsFilters.campaigns.length > 0
                              ) {
                                filtersToApply.campaign_id =
                                  prospectsFilters.campaigns;
                              }
                              if (prospectsFilters.sourceFile) {
                                filtersToApply.source_file =
                                  prospectsFilters.sourceFile;
                              }
                              if (
                                prospectsFilters.tags &&
                                prospectsFilters.tags.length > 0
                              ) {
                                filtersToApply.tags = prospectsFilters.tags;
                              }

                              // Next Call Date (From)/(To) -> scheduled_call_from / scheduled_call_to
                              if (prospectsFilters.nextCallDateFrom) {
                                filtersToApply.scheduled_call_from =
                                  prospectsFilters.nextCallDateFrom;
                              }
                              if (prospectsFilters.nextCallDateTo) {
                                filtersToApply.scheduled_call_to =
                                  prospectsFilters.nextCallDateTo;
                              }

                              handleFiltersChange(filtersToApply);
                              setPagination((prev) => ({
                                ...prev,
                                currentPage: 1,
                              }));
                              setRefreshKey((prev) => prev + 1);
                            }}
                          >
                            Submit Filters
                          </Button>
                          <Button
                            variant="outline-secondary"
                            className="d-flex align-items-center justify-content-center"
                            onClick={() => {
                              setProspectsSearch("");
                              setProspectsFilters({
                                assignedTo: null,
                                campaigns: null,
                                nextCallDateFrom: null,
                                nextCallDateTo: null,
                                sourceFile: null,
                                tags: null,
                              });
                              handleFiltersChange({});
                              setCurrentFilters({});
                              setActiveFilter("all");
                              setPagination((prev) => ({
                                ...prev,
                                currentPage: 1,
                              }));
                              setRefreshKey((prev) => prev + 1);
                            }}
                          >
                            Reset Filters
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

            {/* Bulk Actions */}
            {/* {selectedItems.length > 0 &&
          session?.user?.permissions?.includes(
            "delete-crm-data-management"
          ) && (
            <div className="d-flex justify-content-end gap-2 mb-3">
              <Dropdown>
                <Dropdown.Toggle variant="outline-primary" size="sm">
                  <CheckSquare size={16} className="me-2" />
                  Bulk Actions ({selectedItems.length})
                </Dropdown.Toggle>
                <Dropdown.Menu align="end">
                  <Dropdown.Item
                    onClick={() => {
                      setDeleteModalMode("bulk");
                      setShowDeleteModal(true);
                    }}
                    className="d-flex align-items-center text-danger"
                  >
                    <Trash2 size={14} className="me-2" />
                    Delete Selected ({selectedItems.length})
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          )} */}

            {/* Prospects Table */}
            <div
              className="prospects-table-wrapper"
              style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <GenericTable
                data={dataList}
                columns={prospectsColumns.filter((c) =>
                  selectedColumns.includes(c.key),
                )}
                actions={prospectsActions}
                showActions={false}
                // Selection
                selectable={session?.user?.permissions?.includes(
                  "delete-crm-data-management",
                )}
                selectedRows={dataList.filter((item) =>
                  selectedItems.includes(item.id),
                )}
                onSelectionChange={(selected) => {
                  setSelectedItems(selected.map((item) => item.id));
                  setClearSelectedRows(false);
                }}
                // Column customization
                // customizableColumns={true}
                // defaultSelectedColumns={defaultSelectedColumns}
                // columnStorageKey="crmDataSelectedColumns"

                // Pagination
                pagination={{
                  currentPage: pagination.currentPage,
                  rowsPerPage: pagination.rowsPerPage,
                  totalRows: totalRecords,
                  pageSizeOptions: [10, 15, 25, 50, 100],
                }}
                onPaginationChange={(page, rowsPerPage) => {
                  setPagination({
                    ...pagination,
                    currentPage: page,
                    rowsPerPage,
                  });
                }}
                // Sorting
                sortable={true}
                defaultSortColumn={pagination.sortColumn}
                defaultSortDirection={pagination.sortDirection}
                onSort={(column, direction) => {
                  setPagination((prev) => ({
                    ...prev,
                    sortColumn: column,
                    sortDirection: direction,
                    currentPage: 1,
                  }));
                }}
                // Row interactions
                onPreviewClick={(row) => handlePreviewClick(row)}
                onFirstColumnClick={(row) => handleFirstColumnClick(row)}
                onRowDoubleClick={(row) => {
                  if (
                    session?.user?.permissions?.includes(
                      "view-crm-data-management",
                    )
                  ) {
                    handleViewData(row);
                  }
                }}
                // Loading & styling
                loading={loading}
                emptyMessage="No prospects found matching your criteria"
                loadingMessage="Loading prospects..."
                hover={true}
                uniqueKey="id"
                // Fixed height mode
                fixedHeight={true}
                maxHeight="calc(100vh - 345px)"
                // Toolbar
                showToolbar={true}
                toolbar={{
                  // Tabs
                  showTabs: true,
                  showImport: true,
                  onImportClick: () => {
                    console.log("Import prospects");
                  },
                  tabsDropdownLabel: "Prospects",
                  tabs: [
                    {
                      id: "all",
                      label: "All prospects",
                      count: totalAllProspects,
                      removable: false,
                    },
                    ...customTabs.map((tab) =>
                      tab.id === "has_leads"
                        ? {
                            ...tab,
                            count:
                              activeFilter === "has_leads" && !loading
                                ? totalRecords
                                : undefined,
                          }
                        : tab,
                    ),
                  ],
                  activeTab: activeFilter,
                  onTabChange: handleFilterChange,
                  onTabAdd: () => setShowTabModal(true),
                  onTabRemove: (tabId) => {
                    setCustomTabs((tabs) => tabs.filter((t) => t.id !== tabId));
                    if (activeFilter === tabId) {
                      handleFilterChange("all");
                    }
                  },

                  // Search
                  showSearch: true,
                  searchValue: prospectsSearch,
                  searchPlaceholder: "Search prospects...",
                  onSearchChange: (value) => {
                    setProspectsSearch(value);
                    // Clear search on empty value
                    if (!value) {
                      const newFilters = { ...currentFilters };
                      delete newFilters.search;
                      handleFiltersChange(newFilters);
                      setRefreshKey((prev) => prev + 1);
                    }
                  },
                  onSearch: () => {
                    if (prospectsSearch) {
                      handleFiltersChange({
                        ...currentFilters,
                        search: prospectsSearch,
                      });
                      setRefreshKey((prev) => prev + 1);
                    }
                  },

                  // Actions (Table view / Board View only; dropdown shows other option)
                  showTableViewDropdown: true,
                  currentTableView: prospectsViewMode,
                  onTableViewChange: (view) => setProspectsViewMode(view),
                  showEditColumns: true,
                  onEditColumnsClick: () => setShowColumnEditor(true),
                  showPipelineDropdown: false,
                  pipelineLabel: "All Pipelines",
                  showFiltersButton: true,
                  onFiltersClick: handleOpenFiltersSidebar,
                  showSortButton: true,
                  showExportButton: true,
                  onExportClick: () => setShowExportModal(true),
                  showSaveButton: true,
                  onSaveClick: () => console.log("Save view"),

                  // Filter Pills (active/activeLabel from currentFilters so applied filters are visible)
                  filterPills: [
                    {
                      id: "contact_owner",
                      label: "Owner",
                      showDropdown: true,
                      searchable: true,
                      active: !!(currentFilters.user_extension && (Array.isArray(currentFilters.user_extension) ? currentFilters.user_extension.length > 0 : true)),
                      activeLabel: (() => {
                        const extId = Array.isArray(currentFilters.user_extension) ? currentFilters.user_extension[0] : currentFilters.user_extension;
                        if (!extId) return undefined;
                        const ext = extensions.find((e: any) => (e.id || e.extension) === extId);
                        return ext ? (ext.display_name || ext.name || ext.extension) : String(extId);
                      })(),
                      onClear: () => {
                        const newFilters = { ...currentFilters };
                        delete newFilters.user_extension;
                        handleFiltersChange(newFilters);
                        setRefreshKey((prev) => prev + 1);
                      },
                      dropdownOptions: [
                        {
                          label: "All Owners",
                          value: "all",
                          onClick: () => {
                            const newFilters = { ...currentFilters };
                            delete newFilters.user_extension;
                            handleFiltersChange(newFilters);
                            setRefreshKey((prev) => prev + 1);
                          },
                        },
                        ...extensions.map((ext) => ({
                          label: ext.display_name || ext.name || ext.extension,
                          value: ext.extension,
                          onClick: () => {
                            handleFiltersChange({
                              ...currentFilters,
                              user_extension: [ext.id || ext.extension],
                            });
                            setRefreshKey((prev) => prev + 1);
                          },
                        })),
                      ],
                    },
                    {
                      id: "create_date",
                      label: "Create date",
                      showDropdown: true,
                      active: !!(currentFilters.created_at_from || currentFilters.created_at_to),
                      activeLabel: (() => {
                        if (!currentFilters.created_at_from && !currentFilters.created_at_to) return undefined;
                        const from = currentFilters.created_at_from;
                        const to = currentFilters.created_at_to;
                        const today = moment().format("YYYY-MM-DD");
                        if (from === today && to === today) return "Today";
                        const weekStart = moment().subtract(7, "days").format("YYYY-MM-DD");
                        if (from === weekStart && to === today) return "Last 7 Days";
                        const monthStart = moment().subtract(30, "days").format("YYYY-MM-DD");
                        if (from === monthStart && to === today) return "Last 30 Days";
                        return "Custom";
                      })(),
                      onClear: () => {
                        const newFilters = { ...currentFilters };
                        delete newFilters.created_at_from;
                        delete newFilters.created_at_to;
                        handleFiltersChange(newFilters);
                        setRefreshKey((prev) => prev + 1);
                      },
                      dropdownOptions: [
                        {
                          label: "All Time",
                          value: "all",
                          onClick: () => {
                            const newFilters = { ...currentFilters };
                            delete newFilters.created_at_from;
                            delete newFilters.created_at_to;
                            handleFiltersChange(newFilters);
                            setRefreshKey((prev) => prev + 1);
                          },
                        },
                        {
                          label: "Today",
                          value: "today",
                          onClick: () => {
                            const today = moment().format("YYYY-MM-DD");
                            handleFiltersChange({
                              ...currentFilters,
                              created_at_from: today,
                              created_at_to: today,
                            });
                            setRefreshKey((prev) => prev + 1);
                          },
                        },
                        {
                          label: "Last 7 Days",
                          value: "week",
                          onClick: () => {
                            const from = moment()
                              .subtract(7, "days")
                              .format("YYYY-MM-DD");
                            const to = moment().format("YYYY-MM-DD");
                            handleFiltersChange({
                              ...currentFilters,
                              created_at_from: from,
                              created_at_to: to,
                            });
                            setRefreshKey((prev) => prev + 1);
                          },
                        },
                        {
                          label: "Last 30 Days",
                          value: "month",
                          onClick: () => {
                            const from = moment()
                              .subtract(30, "days")
                              .format("YYYY-MM-DD");
                            const to = moment().format("YYYY-MM-DD");
                            handleFiltersChange({
                              ...currentFilters,
                              created_at_from: from,
                              created_at_to: to,
                            });
                            setRefreshKey((prev) => prev + 1);
                          },
                        },
                      ],
                    },
                    {
                      id: "last_activity",
                      label: "Last activity date",
                      showDropdown: true,
                      active: !!(currentFilters.last_called_at_from || currentFilters.last_called_at_to),
                      activeLabel: (() => {
                        if (!currentFilters.last_called_at_from && !currentFilters.last_called_at_to) return undefined;
                        const from = currentFilters.last_called_at_from;
                        const to = currentFilters.last_called_at_to;
                        const today = moment().format("YYYY-MM-DD");
                        if (from === today && to === today) return "Today";
                        const weekStart = moment().subtract(7, "days").format("YYYY-MM-DD");
                        if (from === weekStart && to === today) return "Last 7 Days";
                        const monthStart = moment().subtract(30, "days").format("YYYY-MM-DD");
                        if (from === monthStart && to === today) return "Last 30 Days";
                        return "Custom";
                      })(),
                      onClear: () => {
                        const newFilters = { ...currentFilters };
                        delete newFilters.last_called_at_from;
                        delete newFilters.last_called_at_to;
                        handleFiltersChange(newFilters);
                        setRefreshKey((prev) => prev + 1);
                      },
                      dropdownOptions: [
                        {
                          label: "All Time",
                          value: "all",
                          onClick: () => {
                            const newFilters = { ...currentFilters };
                            delete newFilters.last_called_at_from;
                            delete newFilters.last_called_at_to;
                            handleFiltersChange(newFilters);
                            setRefreshKey((prev) => prev + 1);
                          },
                        },
                        {
                          label: "Today",
                          value: "today",
                          onClick: () => {
                            const today = moment().format("YYYY-MM-DD");
                            handleFiltersChange({
                              ...currentFilters,
                              last_called_at_from: today,
                              last_called_at_to: today,
                            });
                            setRefreshKey((prev) => prev + 1);
                          },
                        },
                        {
                          label: "Last 7 Days",
                          value: "week",
                          onClick: () => {
                            const from = moment()
                              .subtract(7, "days")
                              .format("YYYY-MM-DD");
                            const to = moment().format("YYYY-MM-DD");
                            handleFiltersChange({
                              ...currentFilters,
                              last_called_at_from: from,
                              last_called_at_to: to,
                            });
                            setRefreshKey((prev) => prev + 1);
                          },
                        },
                        {
                          label: "Last 30 Days",
                          value: "month",
                          onClick: () => {
                            const from = moment()
                              .subtract(30, "days")
                              .format("YYYY-MM-DD");
                            const to = moment().format("YYYY-MM-DD");
                            handleFiltersChange({
                              ...currentFilters,
                              last_called_at_from: from,
                              last_called_at_to: to,
                            });
                            setRefreshKey((prev) => prev + 1);
                          },
                        },
                      ],
                    },
                  ],
                  showAdvancedFilters: true,
                  onAdvancedFiltersClick: handleOpenFiltersSidebar,

                  // Right-aligned custom actions
                  rightActions: renderAddContactsButton(),
                }}
                // Stats cards for metrics
                statsCards={prospectsStatsCards}
                // When Board View is selected, show board content instead of table
                customBody={
                  prospectsViewMode === "board" ? (
                    <div
                      className="d-flex align-items-center justify-content-center p-5"
                      style={{ minHeight: "400px", background: "#f8f9fa" }}
                    >
                      <div className="text-center text-muted">
                        <Layers size={48} className="mb-3 opacity-50" />
                        <h5 className="mb-2">Board View</h5>
                        <p className="mb-0 small">
                          Switch to Table view from the dropdown to see the
                          table.
                        </p>
                      </div>
                    </div>
                  ) : undefined
                }
              />
            </div>
          </div>

          {/* Upload Modal */}
          {session?.user?.permissions?.includes("add-crm-data-management") && (
            <Modal
              show={showUploadModal}
              onHide={() => setShowUploadModal(false)}
              size="lg"
              centered
            >
              <Modal.Header closeButton className="border-bottom bg-light">
                <Modal.Title>Import Contacts - Prospects</Modal.Title>
              </Modal.Header>
              <Modal.Body className="p-4">
                <div className="alert alert-info mb-4">
                  <AlertCircleIcon size={18} className="me-2" />
                  <strong>📋 Import Guidelines:</strong>
                  <ul className="mb-0 mt-2">
                    <li>
                      <strong>Headers:</strong> First row must contain column
                      headers
                    </li>
                    <li>
                      <strong>Name Column:</strong> Include a "name" column
                      (case insensitive) for first name and last name, or use
                      separate "first name" and "last name" columns
                    </li>
                    <li>
                      <strong>Phone Column:</strong> Include a "phone" column
                      (case insensitive) for contact information. Phone must
                      follow the E.164 format. (e.g., +14155552671)
                    </li>
                    <li>
                      <strong>Email Column:</strong> Include a "email" column
                      for contact information. Email must be a valid email
                      address.
                    </li>
                    <li>
                      <strong>File Size:</strong> Maximum 2MB per file
                    </li>
                    <li>
                      <strong>Formats:</strong> CSV files supported
                    </li>
                    <li>
                      <strong>Data Quality:</strong> Clean, valid data imports
                      faster and works better
                    </li>
                  </ul>
                </div>
                <Form>
                  <Form.Group className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Form.Label className="fw-semibold mb-0">
                        Select CSV File <span className="text-danger">*</span>
                      </Form.Label>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={downloadExampleCsv}
                        className="d-flex align-items-center gap-1"
                      >
                        <Download size={14} />
                        Download Example CSV
                      </Button>
                    </div>
                    <Form.Control
                      type="file"
                      accept=".csv"
                      onChange={handleFileInputChange}
                    />
                    <Form.Text className="text-muted">
                      Supported formats: CSV
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Tags (Optional)
                    </Form.Label>
                    <CreatableSelect
                      isMulti
                      value={fieldTags}
                      onChange={(selected) => setFieldTags(selected || [])}
                      options={availableTags}
                      placeholder="Add tags to organize and filter this data..."
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: "#ced4da",
                          boxShadow: "none",
                          fontSize: "14px",
                        }),
                      }}
                    />
                    <Form.Text className="text-muted">
                      Add descriptive tags to help categorize and filter your
                      data later. You can create new tags by typing them.
                    </Form.Text>
                  </Form.Group>
                  <div className="alert alert-warning">
                    <small>
                      <strong>Note:</strong> The data will be uploaded even if
                      some fields remain empty.
                    </small>
                  </div>
                </Form>
              </Modal.Body>
              <Modal.Footer className="border-top">
                <Button
                  variant="secondary"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => handleUpload()}>
                  <Download size={16} className="me-2" />
                  Upload & Import
                </Button>
              </Modal.Footer>
            </Modal>
          )}

          {/* View Data Modal - Redesigned */}
          {selectedDataItem && (
            <Modal
              show={showViewModal}
              onHide={() => setShowViewModal(false)}
              size="xl"
              centered
              className="prospect-view-modal"
            >
              {/* Modern Header with Gradient */}
              <div
                style={{
                  background: "#fff",
                  color: "black",
                  padding: "24px 32px",
                  position: "relative",
                  borderTopLeftRadius: "12px",
                  borderTopRightRadius: "12px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  borderBottom: "1px solid #ccc",
                }}
              >
                <button
                  onClick={() => setShowViewModal(false)}
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "black",
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.25)";
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <X size={18} />
                </button>

                {/* Header Content */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "16px" }}
                >
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "16px",
                      background: "#2563eb",
                      backdropFilter: "blur(10px)",
                      border: "2px solid rgba(255,255,255,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "28px",
                      fontWeight: "700",
                      flexShrink: 0,
                      color: "#fff",
                    }}
                  >
                    {selectedDataItem.name
                      ? selectedDataItem.name.charAt(0).toUpperCase()
                      : "P"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        fontSize: "26px",
                        textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {selectedDataItem.name ||
                        `Prospect #${selectedDataItem.id}`}
                    </h2>
                    <div
                      style={{
                        marginTop: "6px",
                        opacity: 0.95,
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        flexWrap: "wrap",
                        color: "#000",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <PhoneIcon size={14} />
                        {selectedDataItem.phone || "No phone"}
                      </span>
                      <span>•</span>
                      <span>
                        Added{" "}
                        {selectedDataItem.created_at
                          ? moment(selectedDataItem.created_at).format(
                              "MMM DD, YYYY",
                            )
                          : "N/A"}
                      </span>
                      {selectedDataItem.is_viewed && (
                        <>
                          <span>•</span>
                          <Badge
                            bg="light"
                            text="dark"
                            style={{
                              background: "rgba(255,255,255,0.25)",
                              border: "1px solid rgba(255,255,255,0.3)",
                              color: "white",
                              fontWeight: 500,
                            }}
                          >
                            Viewed
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Modal.Body
                style={{
                  padding: 0,
                  maxHeight: "calc(90vh - 200px)",
                  overflowY: "auto",
                }}
              >
                {/* Main Content Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 360px",
                    minHeight: "500px",
                  }}
                >
                  {/* Left Panel - Main Information */}
                  <div
                    style={{
                      padding: "32px",
                      borderRight: "1px solid #e5e7eb",
                    }}
                  >
                    {/* Quick Info Cards */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "16px",
                        marginBottom: "28px",
                      }}
                    >
                      <div
                        style={{
                          background: "#f9fafb",
                          border: "1px solid #e5e7eb",
                          padding: "20px",
                          borderRadius: "12px",
                          transition: "all 0.3s ease",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow =
                            "0 8px 16px rgba(102, 126, 234, 0.15)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "44px",
                              height: "44px",
                              borderRadius: "10px",
                              background: "#2563eb",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <User size={20} style={{ color: "white" }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#2563eb",
                                textTransform: "uppercase",
                                letterSpacing: "0.8px",
                                marginBottom: "4px",
                              }}
                            >
                              Assigned Agent
                            </div>
                            <div
                              style={{
                                fontSize: "15px",
                                color: "#1f2937",
                                fontWeight: 600,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {selectedDataItem.user_extension
                                ? extensions.find(
                                    (extension: any) =>
                                      extension.id.toString() ===
                                      selectedDataItem.user_extension?.toString(),
                                  )?.display_name ||
                                  selectedDataItem.user_extension
                                : "Unassigned"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          background: "#f9fafb",
                          border: "1px solid #f093fb30",
                          padding: "20px",
                          borderRadius: "12px",
                          transition: "all 0.3s ease",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow =
                            "0 8px 16px rgba(240, 147, 251, 0.15)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "44px",
                              height: "44px",
                              borderRadius: "10px",
                              background: "#0284c7",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <Target size={20} style={{ color: "white" }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#f5576c",
                                textTransform: "uppercase",
                                letterSpacing: "0.8px",
                                marginBottom: "4px",
                              }}
                            >
                              Campaign
                            </div>
                            <div
                              style={{
                                fontSize: "15px",
                                color: "#1f2937",
                                fontWeight: 600,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {availableCampaigns.find(
                                (c) =>
                                  c.value ===
                                  selectedDataItem.campaign_id?.toString(),
                              )?.label || "No Campaign"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information Section */}
                    <div style={{ marginBottom: "28px" }}>
                      <h5
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#1f2937",
                          marginBottom: "16px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "4px",
                            height: "18px",
                            background:
                              "linear-gradient(135deg, #f093fb15 0%, #f5576c15 100%)",
                            borderRadius: "2px",
                          }}
                        />
                        Contact Details
                      </h5>
                      <div
                        style={{
                          background: "#f9fafb",
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                          padding: "20px",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "140px 1fr",
                            gap: "16px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              color: "#6b7280",
                              fontSize: "14px",
                              fontWeight: 600,
                            }}
                          >
                            <PhoneIcon size={16} style={{ color: "#2563eb" }} />
                            Phone
                          </div>
                          <div
                            style={{
                              color: "#1f2937",
                              fontSize: "15px",
                              fontWeight: 500,
                            }}
                          >
                            {selectedDataItem.phone || "N/A"}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              color: "#6b7280",
                              fontSize: "14px",
                              fontWeight: 600,
                            }}
                          >
                            <Calendar size={16} style={{ color: "#2563eb" }} />
                            Created
                          </div>
                          <div
                            style={{
                              color: "#1f2937",
                              fontSize: "15px",
                              fontWeight: 500,
                            }}
                          >
                            {selectedDataItem.created_at
                              ? moment(selectedDataItem.created_at).format(
                                  "MMMM DD, YYYY [at] hh:mm A",
                                )
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Call Note Section */}
                    {selectedDataItem?.note && (
                      <div style={{ marginBottom: "28px" }}>
                        <h5
                          style={{
                            fontSize: "15px",
                            fontWeight: 700,
                            color: "#1f2937",
                            marginBottom: "16px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "4px",
                              height: "18px",
                              background:
                                "linear-gradient(135deg, #2563eb 0%, #764ba2 100%)",
                              borderRadius: "2px",
                            }}
                          />
                          Call Notes
                        </h5>
                        <div
                          style={{
                            background: "#fffbeb",
                            border: "1px solid #fcd34d",
                            borderRadius: "12px",
                            padding: "16px 20px",
                            fontSize: "14px",
                            color: "#78350f",
                            lineHeight: "1.6",
                          }}
                        >
                          {selectedDataItem.note}
                        </div>
                      </div>
                    )}

                    {/* Custom Data Fields Section */}
                    {selectedDataItem.data &&
                      Object.keys(selectedDataItem.data).length > 0 && (
                        <div style={{ marginBottom: "28px" }}>
                          <h5
                            style={{
                              fontSize: "15px",
                              fontWeight: 700,
                              color: "#1f2937",
                              marginBottom: "16px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "4px",
                                height: "18px",
                                background:
                                  "linear-gradient(135deg, #2563eb 0%, #764ba2 100%)",
                                borderRadius: "2px",
                              }}
                            />
                            Additional Information
                          </h5>
                          <div
                            style={{
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              borderRadius: "12px",
                              padding: "20px",
                            }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "16px 24px",
                              }}
                            >
                              {Object.entries(selectedDataItem.data).map(
                                ([key, value]) => (
                                  <div key={key}>
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        color: "#6b7280",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        marginBottom: "6px",
                                      }}
                                    >
                                      {key
                                        .replace(/_/g, " ")
                                        .replace(/\b\w/g, (l) =>
                                          l.toUpperCase(),
                                        )}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#1f2937",
                                        fontWeight: 500,
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {value !== null && value !== undefined
                                        ? typeof value === "object"
                                          ? JSON.stringify(value)
                                          : String(value)
                                        : "N/A"}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Call Recordings Section */}
                    <div style={{ marginBottom: "20px" }}>
                      <h5
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#1f2937",
                          marginBottom: "16px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "4px",
                            height: "18px",
                            background:
                              "linear-gradient(135deg, #2563eb 0%, #764ba2 100%)",
                            borderRadius: "2px",
                          }}
                        />
                        Call Recordings
                        <Badge
                          bg="secondary"
                          style={{
                            marginLeft: "8px",
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "4px 10px",
                            borderRadius: "6px",
                          }}
                        >
                          {callRecordingsTotal > 0
                            ? callRecordingsTotal
                            : callRecordings.length}
                        </Badge>
                      </h5>

                      {callRecordingsLoading ? (
                        <div
                          style={{
                            padding: "48px 20px",
                            background: "#f9fafb",
                            borderRadius: "12px",
                            textAlign: "center",
                          }}
                        >
                          <Spinner
                            animation="border"
                            variant="primary"
                            size="sm"
                            style={{ marginBottom: "12px" }}
                          />
                          <p
                            className="mb-0"
                            style={{ color: "#6b7280", fontSize: "14px" }}
                          >
                            Loading recordings...
                          </p>
                        </div>
                      ) : callRecordings.length === 0 ? (
                        <div
                          style={{
                            padding: "48px 20px",
                            background: "#f9fafb",
                            border: "2px dashed #d1d5db",
                            borderRadius: "12px",
                            textAlign: "center",
                          }}
                        >
                          <History
                            size={40}
                            style={{ color: "#9ca3af", marginBottom: "12px" }}
                          />
                          <p
                            className="mb-0"
                            style={{
                              color: "#6b7280",
                              fontSize: "14px",
                              fontWeight: 500,
                            }}
                          >
                            No call recordings found
                          </p>
                        </div>
                      ) : (
                        <div
                          style={{
                            background: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                            overflow: "hidden",
                          }}
                        >
                          <div style={{ overflowX: "auto" }}>
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                              }}
                            >
                              <thead>
                                <tr
                                  style={{
                                    background: "#f9fafb",
                                    borderBottom: "1px solid #e5e7eb",
                                  }}
                                >
                                  <th
                                    style={{
                                      padding: "12px 16px",
                                      textAlign: "left",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    Date & Time
                                  </th>
                                  <th
                                    style={{
                                      padding: "12px 16px",
                                      textAlign: "left",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    Extension
                                  </th>
                                  <th
                                    style={{
                                      padding: "12px 16px",
                                      textAlign: "left",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    Direction
                                  </th>
                                  <th
                                    style={{
                                      padding: "12px 16px",
                                      textAlign: "left",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    Duration
                                  </th>
                                  <th
                                    style={{
                                      padding: "12px 16px",
                                      textAlign: "center",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      width: "100px",
                                    }}
                                  >
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {callRecordings.map(
                                  (recording: any, index: number) => {
                                    const duration =
                                      parseInt(
                                        recording.Duration?.toString() || "0",
                                      ) / 10000000 || 0;
                                    const isDownloading =
                                      downloadingRecordings.has(recording.Id);
                                    const progress =
                                      downloadProgress[recording.Id] || 0;
                                    const isOutgoing =
                                      recording.Direction === "CALL_OUTGOING";

                                    return (
                                      <tr
                                        key={recording.Id || index}
                                        style={{
                                          borderBottom: "1px solid #f3f4f6",
                                          transition: "background 0.2s ease",
                                        }}
                                        onMouseOver={(e) => {
                                          e.currentTarget.style.background =
                                            "#f9fafb";
                                        }}
                                        onMouseOut={(e) => {
                                          e.currentTarget.style.background =
                                            "white";
                                        }}
                                      >
                                        <td style={{ padding: "14px 16px" }}>
                                          <div
                                            style={{
                                              fontSize: "13px",
                                              color: "#1f2937",
                                              fontWeight: 500,
                                            }}
                                          >
                                            {formatDateTimeToLocal(
                                              recording.DateTime,
                                              GlobalDateFormat,
                                            )}
                                          </div>
                                          <div
                                            style={{
                                              fontSize: "12px",
                                              color: "#6b7280",
                                              marginTop: "2px",
                                            }}
                                          >
                                            {formatDateTimeToLocal(
                                              recording.DateTime,
                                              GlobalTimeFormat,
                                              "YYYY-MM-DD HH:mm:ss.SSSSSSS",
                                            )}
                                          </div>
                                        </td>
                                        <td
                                          style={{
                                            padding: "14px 16px",
                                            fontSize: "13px",
                                            color: "#1f2937",
                                            fontWeight: 500,
                                          }}
                                        >
                                          {recording.AgentExtension || "N/A"}
                                        </td>
                                        <td style={{ padding: "14px 16px" }}>
                                          <span
                                            style={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              gap: "6px",
                                              padding: "4px 10px",
                                              borderRadius: "6px",
                                              fontSize: "12px",
                                              fontWeight: 600,
                                              background: isOutgoing
                                                ? "#dbeafe"
                                                : "#d1fae5",
                                              color: isOutgoing
                                                ? "#1e40af"
                                                : "#065f46",
                                            }}
                                          >
                                            {isOutgoing
                                              ? "Outgoing"
                                              : "Incoming"}
                                          </span>
                                        </td>
                                        <td
                                          style={{
                                            padding: "14px 16px",
                                            fontSize: "13px",
                                            color: "#1f2937",
                                            fontWeight: 500,
                                          }}
                                        >
                                          {formatDuration(duration)}
                                        </td>
                                        <td style={{ padding: "14px 16px" }}>
                                          <div
                                            style={{
                                              display: "flex",
                                              gap: "8px",
                                              alignItems: "center",
                                              justifyContent: "center",
                                            }}
                                          >
                                            <button
                                              style={{
                                                background: "transparent",
                                                border: "none",
                                                color: "#2563eb",
                                                cursor: "pointer",
                                                padding: "6px",
                                                borderRadius: "6px",
                                                transition: "all 0.2s ease",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                              }}
                                              title="Play Recording"
                                              onClick={() =>
                                                handlePlayCallRecording(
                                                  recording,
                                                )
                                              }
                                              onMouseOver={(e) => {
                                                e.currentTarget.style.background =
                                                  "#ede9fe";
                                              }}
                                              onMouseOut={(e) => {
                                                e.currentTarget.style.background =
                                                  "transparent";
                                              }}
                                            >
                                              <FiPlay size={16} />
                                            </button>
                                            {isDownloading ? (
                                              <CircularProgressCircle
                                                progress={progress}
                                                size="small"
                                                color="#28a745"
                                                backgroundColor="#e9ecef"
                                                textColor="#495057"
                                                showPercentage={false}
                                                className="circular-progress-inline"
                                              />
                                            ) : (
                                              <button
                                                style={{
                                                  background: "transparent",
                                                  border: "none",
                                                  color: "#2563eb",
                                                  cursor: "pointer",
                                                  padding: "6px",
                                                  borderRadius: "6px",
                                                  transition: "all 0.2s ease",
                                                  display: "flex",
                                                  alignItems: "center",
                                                  justifyContent: "center",
                                                }}
                                                title="Download Recording"
                                                onClick={() =>
                                                  handleDownloadCallRecording(
                                                    recording,
                                                  )
                                                }
                                                onMouseOver={(e) => {
                                                  e.currentTarget.style.background =
                                                    "#ede9fe";
                                                }}
                                                onMouseOut={(e) => {
                                                  e.currentTarget.style.background =
                                                    "transparent";
                                                }}
                                              >
                                                <Download size={16} />
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  },
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Panel - Quick Actions & Timeline */}
                  <div
                    style={{
                      padding: "32px 24px",
                      background: "#fafbfc",
                      display: "flex",
                      flexDirection: "column",
                      gap: "24px",
                    }}
                  >
                    {/* Quick Actions */}
                    <div>
                      <h6
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "14px",
                        }}
                      >
                        Quick Actions
                      </h6>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        <button
                          style={{
                            background: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "10px",
                            padding: "12px 16px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#1f2937",
                          }}
                          onClick={() => {
                            // Handle call action
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = "#2563eb";
                            e.currentTarget.style.background = "#eff6ff";
                            e.currentTarget.style.transform = "translateX(4px)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = "#e5e7eb";
                            e.currentTarget.style.background = "white";
                            e.currentTarget.style.transform = "translateX(0)";
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background: "#2563eb",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <PhoneIcon size={16} style={{ color: "white" }} />
                          </div>
                          Call Prospect
                        </button>

                        <button
                          style={{
                            background: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "10px",
                            padding: "12px 16px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#1f2937",
                          }}
                          onClick={() => {
                            // Handle message action
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = "#2563eb";
                            e.currentTarget.style.background = "#eff6ff";
                            e.currentTarget.style.transform = "translateX(4px)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = "#e5e7eb";
                            e.currentTarget.style.background = "white";
                            e.currentTarget.style.transform = "translateX(0)";
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background:
                                "linear-gradient(135deg, #2563eb 0%, #764ba2 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <Mail size={16} style={{ color: "white" }} />
                          </div>
                          Send Message
                        </button>
                      </div>
                    </div>

                    {/* Status Overview */}
                    <div>
                      <h6
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "14px",
                        }}
                      >
                        Status Overview
                      </h6>
                      <div
                        style={{
                          background: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#6b7280",
                                fontWeight: 500,
                              }}
                            >
                              Status
                            </span>
                            <Badge
                              bg={
                                selectedDataItem.is_viewed
                                  ? "success"
                                  : "primary"
                              }
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                padding: "4px 10px",
                                borderRadius: "6px",
                              }}
                            >
                              {selectedDataItem.is_viewed ? "Viewed" : "New"}
                            </Badge>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#6b7280",
                                fontWeight: 500,
                              }}
                            >
                              Total Calls
                            </span>
                            <span
                              style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 600,
                              }}
                            >
                              {callRecordings.length}
                            </span>
                          </div>

                          {selectedDataItem.scheduled_call_at && (
                            <div
                              style={{
                                marginTop: "8px",
                                paddingTop: "14px",
                                borderTop: "1px solid #f3f4f6",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  marginBottom: "6px",
                                }}
                              >
                                <Calendar
                                  size={14}
                                  style={{ color: "#2563eb" }}
                                />
                                <span
                                  style={{
                                    fontSize: "12px",
                                    color: "#6b7280",
                                    fontWeight: 600,
                                  }}
                                >
                                  Scheduled Call
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#1f2937",
                                  fontWeight: 500,
                                  marginLeft: "22px",
                                }}
                              >
                                {moment(
                                  selectedDataItem.scheduled_call_at,
                                ).format("MMM DD, YYYY [at] hh:mm A")}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Activity Timeline */}
                    <div style={{ flex: 1 }}>
                      <h6
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "14px",
                        }}
                      >
                        Recent Activity
                      </h6>
                      <div
                        style={{
                          background: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "16px",
                          maxHeight: "300px",
                          overflowY: "auto",
                        }}
                      >
                        {callRecordings.length > 0 ? (
                          <div style={{ position: "relative" }}>
                            {/* Timeline line */}
                            <div
                              style={{
                                position: "absolute",
                                left: "7px",
                                top: "8px",
                                bottom: "8px",
                                width: "2px",
                                background: "#e5e7eb",
                              }}
                            />

                            {callRecordings
                              .slice(0, 5)
                              .map((recording: any, index: number) => {
                                const isOutgoing =
                                  recording.Direction === "CALL_OUTGOING";
                                return (
                                  <div
                                    key={recording.Id || index}
                                    style={{
                                      position: "relative",
                                      paddingLeft: "28px",
                                      paddingBottom:
                                        index <
                                        Math.min(callRecordings.length, 5) - 1
                                          ? "16px"
                                          : "0",
                                    }}
                                  >
                                    {/* Timeline dot */}
                                    <div
                                      style={{
                                        position: "absolute",
                                        left: "0",
                                        top: "4px",
                                        width: "16px",
                                        height: "16px",
                                        borderRadius: "50%",
                                        background: isOutgoing
                                          ? "#2563eb"
                                          : "#10b981",
                                        border: "3px solid white",
                                        boxShadow: "0 0 0 1px #e5e7eb",
                                      }}
                                    />

                                    <div>
                                      <div
                                        style={{
                                          fontSize: "12px",
                                          color: "#1f2937",
                                          fontWeight: 600,
                                          marginBottom: "4px",
                                        }}
                                      >
                                        {isOutgoing
                                          ? "Outgoing Call"
                                          : "Incoming Call"}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "#6b7280",
                                        }}
                                      >
                                        {moment(recording.DateTime).format(
                                          "MMM DD, hh:mm A",
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}

                            {callRecordings.length > 5 && (
                              <div
                                style={{
                                  textAlign: "center",
                                  marginTop: "12px",
                                  paddingTop: "12px",
                                  borderTop: "1px solid #f3f4f6",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "12px",
                                    color: "#2563eb",
                                    fontWeight: 600,
                                  }}
                                >
                                  +{callRecordings.length - 5} more activities
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            style={{
                              textAlign: "center",
                              padding: "20px",
                              color: "#9ca3af",
                            }}
                          >
                            <ClockIcon
                              size={32}
                              style={{ marginBottom: "8px", opacity: 0.5 }}
                            />
                            <div style={{ fontSize: "13px" }}>
                              No activity yet
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Modal.Body>

              {/* Footer */}
              <div
                style={{
                  padding: "20px 32px",
                  borderTop: "1px solid #e5e7eb",
                  background: "white",
                  borderBottomLeftRadius: "12px",
                  borderBottomRightRadius: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: "13px", color: "#6b7280" }}>
                  Prospect ID: <strong>#{selectedDataItem.id}</strong>
                </div>
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowViewModal(false)}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "14px",
                    border: "2px solid #e5e7eb",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "#2563eb";
                    e.currentTarget.style.color = "#2563eb";
                    e.currentTarget.style.background = "#eff6ff";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.color = "#6c757d";
                    e.currentTarget.style.background = "white";
                  }}
                >
                  Close
                </Button>
              </div>
            </Modal>
          )}

          {/* Audio Player Modal */}
          {/* {getCallHistory(selectedDataItem.id).length > 0 && (
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
                  <History size={18} style={{ color: '#4680ff' }} />
                  Call History ({getCallHistory(selectedDataItem.id).length})
                </div>
                <div style={{ position: 'relative', paddingLeft: '30px', marginBottom: '30px' }}>
                  <div style={{
                    content: '',
                    position: 'absolute',
                    left: '8px',
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    background: '#e5e7eb'
                  }} />
                  {getCallHistory(selectedDataItem.id).map((call, idx) => {
                    const endReason = callEndReasons.find(
                      (r) => r.value === call.endReason
                    );
                    const dispositionColors: Record<string, string> = {
                      interested: 'success',
                      not_interested: 'danger',
                      callback_requested: 'warning',
                      no_answer: 'secondary',
                      busy: 'info',
                      do_not_call: 'dark',
                      wrong_number: 'light',
                      follow_up: 'primary',
                    };
                    const dispositionColor = dispositionColors[call.disposition] || 'primary';
                    const endReasonColor = endReason?.color || 'secondary';
                    
                    return (
                      <div key={call.id || idx} style={{ position: 'relative', paddingBottom: '20px' }}>
                        <div style={{
                          content: '',
                          position: 'absolute',
                          left: '-26px',
                          top: '4px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: endReasonColor === 'success' ? '#10b981' : '#4680ff',
                          border: '3px solid white',
                          boxShadow: '0 0 0 2px #e5e7eb'
                        }} />
                        <div style={{
                          background: '#f8f9fa',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, marginBottom: '4px' }}>
                              {moment(call.calledAt).format("MMM DD, YYYY HH:mm")} - Duration: {call.duration}
                            </div>
                            <div style={{ fontSize: '14px', color: '#1f2937', marginBottom: '8px', fontWeight: 500 }}>
                              <Badge bg={endReasonColor as any} className="me-2">
                                {endReason?.label || call.endReason}
                              </Badge>
                              <Badge bg={dispositionColor as any}>
                                {call.disposition
                                  ?.replace("_", " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </Badge>
                            </div>
                            {call.comment && (
                              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
                                {call.comment}
                              </div>
                            )}
                          </div>
                          {call.recordingUrl && (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-1"
                              title="Play Recording"
                              onClick={() => handlePlayRecording(call.recordingUrl)}
                            >
                              <FiPlay size={16} />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )} */}

          {/* Delete Confirmation Modal (single + bulk) */}
          <DeleteConfirmationModal
            show={showDeleteModal}
            onHide={() => {
              setShowDeleteModal(false);
              setDeleteModalMode(null);
              setItemToDelete(null);
            }}
            onConfirm={
              deleteModalMode === "bulk" ? handleBulkDelete : confirmDelete
            }
            itemName={
              deleteModalMode === "single" && itemToDelete
                ? `prospect entry #${itemToDelete.id}`
                : deleteModalMode === "bulk"
                  ? `${selectedItems.length} selected prospects`
                  : undefined
            }
            itemType={
              deleteModalMode === "bulk" ? "prospect entries" : "prospect entry"
            }
            additionalInfo={
              deleteModalMode === "single" && itemToDelete ? (
                <div className="alert alert-warning mb-3">
                  <strong>Entry ID:</strong> #{itemToDelete.id}
                  <br />
                  <strong>Phone:</strong> {itemToDelete.phone || "N/A"}
                  <br />
                  <strong>Assigned To:</strong>{" "}
                  {itemToDelete.user_extension
                    ? extensions.find(
                        (extension: any) =>
                          extension.id.toString() ===
                          itemToDelete.user_extension?.toString(),
                      )?.display_name || itemToDelete.user_extension
                    : "Unassigned"}
                  <br />
                  <strong>Created:</strong>{" "}
                  {moment(itemToDelete.created_at).format("MMM DD, YYYY HH:mm")}
                </div>
              ) : deleteModalMode === "bulk" ? (
                <div className="alert alert-warning mb-3">
                  <strong>Warning:</strong> This action cannot be undone. All{" "}
                  {selectedItems.length} selected entries will be permanently
                  deleted.
                </div>
              ) : undefined
            }
          />

          {/* Data Assignment Success Modal */}
          <FormModal
            show={showDataAssignmentModal}
            onHide={handleDataAssignmentModalClose}
            title="Smart Prospect Distribution"
            desc="Please fill the details below to smart prospect distribution."
            size="lg"
            formHtml={
              <>
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <FiFilter className="me-2 text-primary" />
                    <h6 className="mb-0">Step 1: Filter Your Prospects</h6>
                  </div>
                  <p className="text-muted small mb-3">
                    Choose which prospects to assign by filtering by tags and
                    campaigns.
                  </p>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Filter by Tags</Form.Label>
                        <CreatableSelect
                          isMulti
                          value={assignmentFilters.selectedTags}
                          onChange={(selected) =>
                            setAssignmentFilters((prev) => ({
                              ...prev,
                              selectedTags: selected || [],
                            }))
                          }
                          options={availableTags}
                          placeholder="Select tags to filter prospects..."
                          styles={{
                            control: (base) => ({
                              ...base,
                              borderColor: "#ced4da",
                              boxShadow: "none",
                              fontSize: "14px",
                            }),
                          }}
                        />
                        <Form.Text className="text-muted">
                          Only prospects with these tags will be considered for
                          assignment.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Filter by Campaigns</Form.Label>
                        <CreatableSelect
                          isMulti
                          value={assignmentFilters.selectedCampaigns}
                          onChange={(selected) =>
                            setAssignmentFilters((prev) => ({
                              ...prev,
                              selectedCampaigns: selected || [],
                            }))
                          }
                          options={availableCampaigns}
                          placeholder="Select campaigns to filter prospects..."
                          styles={{
                            control: (base) => ({
                              ...base,
                              borderColor: "#ced4da",
                              boxShadow: "none",
                              fontSize: "14px",
                            }),
                          }}
                        />
                        <Form.Text className="text-muted">
                          Only prospects from these campaigns will be considered
                          for assignment.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <FiDatabase className="me-2 text-info" />
                    <h6 className="mb-0">Step 2: Review Available Prospects</h6>
                  </div>
                  <p className="text-muted small mb-3">
                    Based on your filters, here's what's available for
                    assignment.
                  </p>

                  {/* <div className="row">
              <div className="col-md-4">
                <div className="card bg-light border-primary">
                  <div className="card-body text-center">
                    <h4 className="text-primary">
                      {assignmentCounts.total.toLocaleString()}
                    </h4>
                    <p className="mb-0 small">Total Entries</p>
                    <small className="text-muted">Matching your filters</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-success text-white">
                  <div className="card-body text-center">
                    <h4>{assignmentCounts.assigned.toLocaleString()}</h4>
                    <p className="mb-0 small">Already Assigned</p>
                    <small className="opacity-75">In use by team members</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-warning text-white">
                  <div className="card-body text-center">
                    <h4>{assignmentCounts.unassigned.toLocaleString()}</h4>
                    <p className="mb-0 small">Available</p>
                    <small className="opacity-75">Ready for assignment</small>
                  </div>
                </div>
              </div>
            </div> */}

                  <Row>
                    <Col md={12} className="text-left">
                      <PageSummaryGrid
                        gridColumns={3}
                        cardHeading="h5"
                        gridTextAlign="center"
                        cards={[
                          {
                            id: "total-entries",
                            title: "Total Prospects",
                            value: assignmentCounts?.total || 0,
                            description: "Matching your filters",
                          },
                          {
                            id: "assigned-entries",
                            title: "Assigned Prospects",
                            value: assignmentCounts?.assigned || 0,
                            description: "In use by team members",
                          },
                          {
                            id: "available-entries",
                            title: "Available Prospects",
                            value: assignmentCounts?.unassigned || 0,
                            description: "Ready for assignment",
                          },
                        ]}
                      />
                    </Col>
                  </Row>
                </div>

                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <FiUsers className="me-2 text-success" />
                    <h6 className="mb-0">Step 3: Configure Assignment</h6>
                  </div>
                  <p className="text-muted small mb-3">
                    You have{" "}
                    <strong>
                      {assignmentCounts.unassigned.toLocaleString()}
                    </strong>{" "}
                    prospects ready for assignment out of{" "}
                    <strong>{assignmentCounts.total.toLocaleString()}</strong>{" "}
                    total matching prospects.
                  </p>

                  <Form.Group className="mb-3">
                    <Form.Label>Target Campaigns *</Form.Label>
                    <CreatableSelect
                      isMulti
                      value={assignmentCampaign}
                      onChange={(selected) =>
                        setAssignmentCampaign(selected || [])
                      }
                      options={availableCampaigns}
                      placeholder="Choose which campaigns to assign prospects to..."
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: "#ced4da",
                          boxShadow: "none",
                          fontSize: "14px",
                        }),
                      }}
                    />
                    <Form.Text className="text-muted">
                      <strong>Smart Distribution:</strong> Prospects will be
                      automatically distributed among users in the selected
                      campaigns based on their workload and availability.
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Assignment Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      max={assignmentCounts.unassigned}
                      value={totalEntriesToAssign}
                      onChange={(e) =>
                        setTotalEntriesToAssign(parseInt(e.target.value) || 0)
                      }
                      placeholder="How many prospects to assign?"
                    />
                    <Form.Text className="text-muted">
                      <strong>Maximum:</strong>{" "}
                      {assignmentCounts.unassigned.toLocaleString()} prospects
                      available. Start with a smaller batch to test the
                      assignment process.
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Distribution Strategy</Form.Label>
                    <div>
                      <Form.Check
                        type="radio"
                        id="equal-distribution"
                        name="assignmentDistribution"
                        label="Auto-balance across campaigns"
                        value="equal"
                        checked={assignmentDistribution === "equal"}
                        onChange={() => setAssignmentDistribution("equal")}
                        className="mb-2"
                      />
                      <Form.Check
                        type="radio"
                        id="custom-distribution"
                        name="assignmentDistribution"
                        label="Custom allocation per campaign"
                        value="custom"
                        checked={assignmentDistribution === "custom"}
                        onChange={() => setAssignmentDistribution("custom")}
                      />
                    </div>
                    <Form.Text className="text-muted">
                      <strong>Auto-balance:</strong> Prospects are distributed
                      evenly. <strong>Custom:</strong> You specify exactly how
                      many prospects each campaign gets.
                    </Form.Text>
                  </Form.Group>

                  {assignmentDistribution === "custom" &&
                    assignmentCampaign.length > 0 && (
                      <Form.Group className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <Form.Label className="mb-0">
                            Custom Distribution
                          </Form.Label>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => {
                              const equalDistribution = Math.floor(
                                totalEntriesToAssign /
                                  assignmentCampaign.length,
                              );
                              const remainder =
                                totalEntriesToAssign %
                                assignmentCampaign.length;
                              const newCustomDistribution: Record<
                                string,
                                number
                              > = {};

                              Array.from(assignmentCampaign).forEach(
                                (campaign: any, index: number) => {
                                  newCustomDistribution[campaign.value] =
                                    equalDistribution +
                                    (index < remainder ? 1 : 0);
                                },
                              );

                              setCustomDistribution(newCustomDistribution);
                            }}
                          >
                            Auto-fill Equal
                          </Button>
                        </div>
                        <div className="border rounded p-3 bg-light">
                          <p className="small text-muted mb-3">
                            Total to assign:{" "}
                            <strong>{totalEntriesToAssign}</strong> | Allocated:{" "}
                            <strong>
                              {Object.values(customDistribution).reduce(
                                (sum, count) => sum + count,
                                0,
                              )}
                            </strong>{" "}
                            | Remaining:{" "}
                            <strong>
                              {totalEntriesToAssign -
                                Object.values(customDistribution).reduce(
                                  (sum, count) => sum + count,
                                  0,
                                )}
                            </strong>
                          </p>
                          {Array.from(assignmentCampaign).map(
                            (campaign: any) => (
                              <div key={campaign.value} className="mb-2">
                                <Row>
                                  <Col md={6}>
                                    <Form.Label className="small mb-0">
                                      {campaign.label}
                                    </Form.Label>
                                  </Col>
                                  <Col md={6}>
                                    <Form.Control
                                      type="number"
                                      min="0"
                                      max={totalEntriesToAssign}
                                      value={
                                        customDistribution[campaign.value] || 0
                                      }
                                      onChange={(e) =>
                                        setCustomDistribution((prev) => ({
                                          ...prev,
                                          [campaign.value]:
                                            parseInt(e.target.value) || 0,
                                        }))
                                      }
                                      size="sm"
                                    />
                                  </Col>
                                </Row>
                              </div>
                            ),
                          )}
                        </div>
                      </Form.Group>
                    )}

                  <Alert variant="info" className="mt-3">
                    <strong>Assignment Info:</strong> Prospects will be
                    automatically assigned to users within the selected
                    campaigns based on their campaign user extensions. The
                    system will distribute prospects equally among users in each
                    campaign.
                  </Alert>
                </div>
              </>
            }
            submitButtonText="OK"
            cancelButtonText="Cancel"
            onSubmit={handleDataAssignmentSubmit}
            onCancel={handleDataAssignmentModalClose}
          />

          <FormModal
            show={showAfterCallModal}
            onHide={() => setShowAfterCallModal(false)}
            title="After Call Dialog"
            desc="Please fill the details below to record call outcomes and schedule follow-up actions."
            size="lg"
            formHtml={
              <>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Disposition *</Form.Label>
                      <Form.Select
                        value={afterCallData.disposition}
                        onChange={(e) =>
                          setAfterCallData({
                            ...afterCallData,
                            disposition: e.target.value,
                          })
                        }
                      >
                        <option value="">Select Disposition</option>
                        <option value="interested">Interested</option>
                        <option value="not_interested">Not Interested</option>
                        <option value="callback_requested">
                          Call Back Requested
                        </option>
                        <option value="follow_up">Follow Up</option>
                        <option value="do_not_call">Do Not Call</option>
                        <option value="wrong_number">Wrong Number</option>
                        <option value="spam">Spam</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Call Status *</Form.Label>
                      <Form.Select
                        value={afterCallData.callStatus}
                        onChange={(e) =>
                          setAfterCallData({
                            ...afterCallData,
                            callStatus: e.target.value,
                          })
                        }
                      >
                        <option value="">Select Call Status</option>
                        <option value="answered">Answered</option>
                        <option value="no_answer">No Answer</option>
                        <option value="busy">Busy</option>
                        <option value="voicemail">Voicemail</option>
                        <option value="disconnected">Disconnected</option>
                        <option value="network_error">Network Error</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Call Comment *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={afterCallData.comment}
                    onChange={(e) =>
                      setAfterCallData({
                        ...afterCallData,
                        comment: e.target.value,
                      })
                    }
                    placeholder="Enter call details, client response, and any important notes..."
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Generate Lead *</Form.Label>
                  <div className="d-flex gap-4">
                    <Form.Check
                      type="radio"
                      id="generate-lead-yes"
                      name="generateLead"
                      value="yes"
                      checked={afterCallData.generateLead === "yes"}
                      onChange={(e) =>
                        setAfterCallData({
                          ...afterCallData,
                          generateLead: e.target.value,
                        })
                      }
                      label="Yes, generate lead"
                    />
                    <Form.Check
                      type="radio"
                      id="generate-lead-no"
                      name="generateLead"
                      value="no"
                      checked={afterCallData.generateLead === "no"}
                      onChange={(e) =>
                        setAfterCallData({
                          ...afterCallData,
                          generateLead: e.target.value,
                        })
                      }
                      label="No, do not generate lead"
                    />
                  </div>
                  <Form.Text className="text-muted">
                    Select "Yes" if this call resulted in a qualified lead that
                    should be created in the CRM system.
                  </Form.Text>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Schedule Next Call (Optional)</Form.Label>
                      <Form.Control
                        type="date"
                        value={afterCallData.nextCallDate}
                        onChange={(e) =>
                          setAfterCallData({
                            ...afterCallData,
                            nextCallDate: e.target.value,
                          })
                        }
                        min={moment().format("YYYY-MM-DD")}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Time (Optional)</Form.Label>
                      <Form.Control
                        type="time"
                        value={afterCallData.nextCallTime}
                        onChange={(e) =>
                          setAfterCallData({
                            ...afterCallData,
                            nextCallTime: e.target.value,
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Alert variant="info">
                  <strong>Note:</strong> This dialog will be used to record call
                  outcomes and schedule follow-up actions. All fields marked
                  with * are required.
                </Alert>
              </>
            }
            submitButtonText="Save Call Data"
            cancelButtonText="Cancel"
            onSubmit={() => handleAfterCallSubmit()}
            onCancel={() => setShowAfterCallModal(false)}
          />

          <FormModal
            show={showScheduleModal}
            onHide={() => setShowScheduleModal(false)}
            title={isEditingSchedule ? "Edit Scheduled Call" : "Schedule Call"}
            desc={
              isEditingSchedule
                ? "Please update the details below to modify the scheduled call."
                : "Please fill the details below to schedule a call."
            }
            size="lg"
            formHtml={
              <>
                {selectedEntryForSchedule && (
                  <div className="mb-3">
                    <h6>Schedule Call For:</h6>
                    <div className="bg-light p-3 rounded">
                      <div>
                        <strong>Name:</strong>{" "}
                        {selectedEntryForSchedule.name || "N/A"}
                      </div>
                      <div>
                        <strong>Phone:</strong>{" "}
                        {selectedEntryForSchedule.phone || "N/A"}
                      </div>
                      <div>
                        <strong>Email:</strong>{" "}
                        {selectedEntryForSchedule?.data?.email || "N/A"}
                      </div>
                    </div>
                  </div>
                )}

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date *</Form.Label>
                      <Form.Control
                        type="date"
                        value={scheduleData.date}
                        onChange={(e) =>
                          setScheduleData({
                            ...scheduleData,
                            date: e.target.value,
                          })
                        }
                        min={moment().format("YYYY-MM-DD")}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Time *</Form.Label>
                      <Form.Control
                        type="time"
                        value={scheduleData.time}
                        onChange={(e) =>
                          setScheduleData({
                            ...scheduleData,
                            time: e.target.value,
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Notes (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={scheduleData.notes}
                    onChange={(e) =>
                      setScheduleData({
                        ...scheduleData,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Add any notes or reminders for this call..."
                  />
                </Form.Group>

                <Alert variant="info">
                  <strong>Note:</strong> The call will be scheduled and you'll
                  receive a reminder at the selected time.
                </Alert>
              </>
            }
            submitButtonText={
              isEditingSchedule ? "Update Schedule" : "Schedule Call"
            }
            cancelButtonText="Cancel"
            onSubmit={() => handleScheduleSubmit()}
            onCancel={() => handleScheduleModalClose()}
          />

          {/* Unschedule Confirmation Modal */}
          <Modal
            show={showUnscheduleModal}
            onHide={() => {
              setShowUnscheduleModal(false);
              setEntryToUnschedule(null);
            }}
            centered
          >
            <Modal.Header closeButton className="border-bottom">
              <Modal.Title>Confirm Unschedule</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <div className="text-center">
                <AlertCircleIcon size={48} className="text-warning mb-3" />
                <p className="mb-0">
                  Are you sure you want to unschedule the call for{" "}
                  <strong>
                    {entryToUnschedule
                      ? entryToUnschedule.name ||
                        `prospect #${entryToUnschedule.id}`
                      : "this prospect"}
                  </strong>
                  ?
                </p>
                <p className="text-muted small mb-3">
                  This action cannot be undone.
                </p>

                {entryToUnschedule && entryToUnschedule.scheduled_call_at && (
                  <div className="alert alert-warning mb-3 text-start">
                    <strong>Prospect:</strong>{" "}
                    {entryToUnschedule.name || `#${entryToUnschedule.id}`}
                    <br />
                    <strong>Phone:</strong> {entryToUnschedule.phone || "N/A"}
                    <br />
                    <strong>Scheduled Date:</strong>{" "}
                    {moment(entryToUnschedule.scheduled_call_at).format(
                      "MMM DD, YYYY HH:mm",
                    )}
                    {entryToUnschedule.note && (
                      <>
                        <br />
                        <strong>Note:</strong> {entryToUnschedule.note}
                      </>
                    )}
                  </div>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer className="border-top">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowUnscheduleModal(false);
                  setEntryToUnschedule(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="warning" onClick={confirmUnscheduleCall}>
                Unschedule
              </Button>
            </Modal.Footer>
          </Modal>

          <FormModal
            show={showHistoryModal}
            onHide={() => setShowHistoryModal(false)}
            title="Activity History"
            desc="Please fill the details below to view the activity history."
            size="lg"
            formHtml={
              <>
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-1">System Activity Log</h5>
                      <p className="text-muted mb-0">
                        Track all user activities including CSV uploads, data
                        assignments, and campaign management.
                      </p>
                    </div>
                    <div className="text-end">
                      <Badge bg="info" className="me-2">
                        {historyPagination.total} Total Activities
                      </Badge>
                      <Badge bg="secondary">
                        Page {historyPagination.current_page} of{" "}
                        {historyPagination.last_page}
                      </Badge>
                    </div>
                  </div>
                </div>

                {historyLoading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 text-muted">
                      Loading activity history...
                    </p>
                  </div>
                ) : historyData.length === 0 ? (
                  <div className="text-center py-5">
                    <FiClock size={48} className="text-muted mb-3" />
                    <h6 className="text-muted">No Activity Found</h6>
                    <p className="text-muted">
                      No activities have been recorded yet.
                    </p>
                  </div>
                ) : (
                  <div className="timeline ">
                    {historyData.map((activity, index) => {
                      const getActivityIcon = (action: string) => {
                        switch (action) {
                          case "upload":
                            return (
                              <FiUpload size={18} className="text-white" />
                            );
                          case "assign":
                            return <FiUsers size={18} className="text-white" />;
                          case "schedule_call":
                          case "reschedule_call":
                            return (
                              <FiCalendar size={18} className="text-white" />
                            );
                          case "cancel_call":
                          case "unschedule_call":
                            return <FiX size={18} className="text-white" />;
                          default:
                            return <FiUser size={18} className="text-white" />;
                        }
                      };

                      const getActivityColor = (action: string) => {
                        switch (action) {
                          case "upload":
                            return "primary";
                          case "assign":
                            return "success";
                          case "schedule_call":
                          case "reschedule_call":
                            return "info";
                          case "cancel_call":
                          case "unschedule_call":
                            return "warning";
                          default:
                            return "secondary";
                        }
                      };

                      const formatActivityDetails = (activity: any) => {
                        const details = activity.details || {};
                        switch (activity.action) {
                          case "upload":
                            const campaignNames =
                              details.campaign_ids
                                ?.map(
                                  (id: number) =>
                                    campaignsById[id] || `Campaign #${id}`,
                                )
                                .join(", ") || "No campaigns";
                            const tags = details.tags?.join(", ") || "No tags";
                            return (
                              <div>
                                <div className="mb-1">
                                  <strong>
                                    Uploaded {activity.total_records || 0}{" "}
                                    prospects
                                  </strong>
                                </div>
                                <div className="small text-muted">
                                  <div>
                                    <strong>Campaigns:</strong> {campaignNames}
                                  </div>
                                  <div>
                                    <strong>Tags:</strong> {tags}
                                  </div>
                                </div>
                              </div>
                            );
                          case "assign":
                            return (
                              <div>
                                <div className="mb-1">
                                  <strong>
                                    Assigned {activity.total_records || 0}{" "}
                                    prospects
                                  </strong>
                                </div>
                                <div className="small text-muted">
                                  <strong>To:</strong>{" "}
                                  {getNameByExtension(
                                    activity.user_extension_done_to,
                                  ) || "Campaign team"}
                                </div>
                              </div>
                            );
                          case "schedule_call":
                            return (
                              <div>
                                <div className="mb-1">
                                  <strong>Scheduled call</strong>
                                </div>
                                <div className="small text-muted">
                                  <div>
                                    <strong>Phone:</strong>{" "}
                                    {details.phone || "N/A"}
                                  </div>
                                  <div>
                                    <strong>Time:</strong>{" "}
                                    {moment(details.scheduled_call_at).format(
                                      "MMM DD, YYYY HH:mm",
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          case "reschedule_call":
                            return (
                              <div>
                                <div className="mb-1">
                                  <strong>Rescheduled call</strong>
                                </div>
                                <div className="small text-muted">
                                  <div>
                                    <strong>Phone:</strong>{" "}
                                    {details.phone || "N/A"}
                                  </div>
                                  <div>
                                    <strong>From:</strong>{" "}
                                    {moment(
                                      details.old_scheduled_call_at,
                                    ).format("MMM DD, HH:mm")}
                                  </div>
                                  <div>
                                    <strong>To:</strong>{" "}
                                    {moment(
                                      details.new_scheduled_call_at,
                                    ).format("MMM DD, HH:mm")}
                                  </div>
                                </div>
                              </div>
                            );
                          case "cancel_call":
                          case "unschedule_call":
                            return (
                              <div>
                                <div className="mb-1">
                                  <strong>Cancelled call</strong>
                                </div>
                                <div className="small text-muted">
                                  <div>
                                    <strong>Phone:</strong>{" "}
                                    {details.phone || "N/A"}
                                  </div>
                                  <div>
                                    <strong>Was scheduled:</strong>{" "}
                                    {moment(
                                      details.cancelled_scheduled_call_at ||
                                        details.unscheduled_call_at,
                                    ).format("MMM DD, HH:mm")}
                                  </div>
                                </div>
                              </div>
                            );
                          default:
                            return (
                              <div>
                                <div className="mb-1">
                                  <strong>
                                    {activity.action
                                      ?.replace("_", " ")
                                      .replace(/\b\w/g, (l: string) =>
                                        l.toUpperCase(),
                                      )}
                                  </strong>
                                </div>
                                <div className="small text-muted">
                                  {activity.details?.description ||
                                    "No details available"}
                                </div>
                              </div>
                            );
                        }
                      };

                      return (
                        <div key={activity.id} className="timeline-item mb-4 ">
                          <div className="d-flex">
                            <div className="timeline-marker me-3">
                              <div
                                className={`bg-${getActivityColor(
                                  activity.action,
                                )} rounded-circle d-flex align-items-center justify-content-center shadow-sm`}
                                style={{ width: "36px", height: "36px" }}
                              >
                                {getActivityIcon(activity.action)}
                              </div>
                            </div>
                            <div className="timeline-content flex-grow-1">
                              <div className="card border-0 shadow-sm">
                                <div className="card-body p-3">
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div className="flex-grow-1">
                                      <h6 className="mb-1 d-flex align-items-center">
                                        <strong className="text-primary">
                                          {getNameByExtension(
                                            activity.user_extension_done_by,
                                          ) || "System"}
                                        </strong>
                                        <Badge
                                          bg={getActivityColor(activity.action)}
                                          className="ms-2 small"
                                        >
                                          {activity.action
                                            ?.replace("_", " ")
                                            .replace(/\b\w/g, (l: string) =>
                                              l.toUpperCase(),
                                            )}
                                        </Badge>
                                      </h6>
                                      <div className="text-muted">
                                        {formatActivityDetails(activity)}
                                      </div>
                                    </div>
                                    <div className="text-end">
                                      <small className="text-muted">
                                        {moment(activity.created_at).format(
                                          "MMM DD, YYYY",
                                        )}
                                      </small>
                                      <br />
                                      <small className="text-muted">
                                        {moment(activity.created_at).format(
                                          "HH:mm:ss",
                                        )}
                                      </small>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="timeline-line"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {!historyLoading &&
                  historyData.length > 0 &&
                  historyPagination.last_page > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <div className="btn-group" role="group">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          disabled={historyPagination.current_page === 1}
                          onClick={() =>
                            fetchHistoryData(historyPagination.current_page - 1)
                          }
                        >
                          Previous
                        </Button>
                        <Button variant="outline-secondary" size="sm" disabled>
                          {historyPagination.current_page} /{" "}
                          {historyPagination.last_page}
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          disabled={
                            historyPagination.current_page ===
                            historyPagination.last_page
                          }
                          onClick={() =>
                            fetchHistoryData(historyPagination.current_page + 1)
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
              </>
            }
            submitButtonText="Close"
            cancelButtonText="Cancel"
            onSubmit={() => setShowHistoryModal(false)}
            onCancel={() => setShowHistoryModal(false)}
          />

          <SuccessfulModal
            show={showSuccessfulModal}
            onHide={() => setShowSuccessfulModal(false)}
            title={successModalTitle}
            description={successModalDescription}
          />

          {/* Call Recording Player Modal */}
          <CallRecordingPlayerModal
            show={showRecordingPlayerModal}
            onHide={() => {
              setShowRecordingPlayerModal(false);
              setSelectedRecording(null);
            }}
            recording={selectedRecording}
          />
        </div>{" "}
        {/* End main content area */}
        {/* Prospect Detail Sidebar */}
        {showProspectSidebar && (
          <GenericSidebar
            isOpen={showProspectSidebar}
            onClose={handleCloseProspectSidebar}
            title={selectedProspect?.name || "Prospect Details"}
            subtitle={selectedProspect?.phone || ""}
            email={selectedProspect?.data?.email}
            phone={selectedProspect?.phone}
            record={{
              id: selectedProspect?.id,
              type: RECORD_TYPES.PROSPECT,
            }}
            avatar={{
              initials: getInitials(selectedProspect?.name || "NA"),
              name: selectedProspect?.name || "NA",
              gradient: getRandomColor(selectedProspect?.name || ""),
            }}
            recordType="prospect"
            recordId={
              selectedProspect?.id ?? selectedProspect?.data?.id ?? undefined
            }
            resolveUserLabel={getNameByExtension}
            onNoteCreate={handleNoteCreate}
            crmSummary={selectedProspect?.data?.crm_summary ?? selectedProspect?.crm_summary ?? undefined}
            recordLink={{
              label: "View record",
              onClick: () => console.log("View full prospect record"),
            }}
            actionsDropdown={{
              label: "Actions",
              items: [
                {
                  label: "Convert to Lead",
                  onClick: () => {
                    setConvertingProspectId(selectedProspect?.id);
                    setShowConvertToLeadModal(true);
                  },
                },
                {
                  label: "Update owner",
                  subItems: extensions.map((ext: any) => ({
                    label:
                      ext.display_name ||
                      ext.name ||
                      ext.extension ||
                      String(ext.id ?? ""),
                    value: String(ext.extension ?? ext.id ?? ""),
                  })),
                  onSubItemSelect: handleProspectOwnerSelect,
                },
                {
                  label: "Delete",
                  onClick: () => handleDeleteData(selectedProspect),
                },
              ],
            }}
            quickActions={[
              {
                id: "call",
                label: "Call",
                icon: Phone,
                onClick: () => {},
                disabled: !selectedProspect?.phone,
              },
              {
                id: "whatsapp",
                label: "WhatsApp",
                icon: MessageCircle,
                onClick: () => {},
                disabled: false,
              },
              {
                id: "sms",
                label: "SMS",
                icon: MessageSquare,
                onClick: () => {},
                disabled: false,
              },
              {
                id: "meeting",
                label: "Meeting",
                icon: Calendar,
                onClick: () => {},
                disabled: false,
              },
              {
                id: "email",
                label: "Email",
                icon: Mail,
                onClick: () => {},
                disabled: false,
              },
              {
                id: "more",
                label: "More",
                icon: MoreVertical,
                onClick: () => {},
                disabled: false,
              },
            ]}
            sections={[
              {
                id: "about-prospect",
                title: "About this prospect",
                icon: Target,
                collapsible: true,
                defaultExpanded: true,
                actions: [
                  {
                    label: "Edit all properties",
                    onClick: () => console.log("Edit all"),
                  },
                ],
                fields: [
                  {
                    label: "Name",
                    value: selectedProspect?.name || "N/A",
                    copyable: true,
                  },
                  {
                    label: "Phone",
                    value: selectedProspect?.phone || "N/A",
                    type: "phone",
                    copyable: true,
                    externalLink: selectedProspect?.phone
                      ? `tel:${selectedProspect.phone}`
                      : undefined,
                  },
                  {
                    label: "Email",
                    value: selectedProspect?.data?.email || "N/A",
                    type: "email",
                    copyable: true,
                    externalLink: selectedProspect?.data?.email
                      ? `mailto:${selectedProspect.data.email}`
                      : undefined,
                    show: !!selectedProspect?.data?.email,
                  },
                  {
                    label: "Owner",
                    value: selectedProspect?.data?.contact_owner
                      ? getNameByExtension(selectedProspect.data.contact_owner)
                      : "—",
                    hasDetails: true,
                    onDetailsClick: () => console.log("Show user details"),
                  },
                  {
                    label: "Campaign",
                    value: selectedProspect?.campaign?.name || "No Campaign",
                    show: !!selectedProspect?.campaign,
                    hasDetails: !!selectedProspect?.campaign,
                    onDetailsClick: () => console.log("Show campaign details"),
                  },
                  {
                    label: "Created Date",
                    value: selectedProspect?.created_at
                      ? moment(selectedProspect.created_at).format(
                          "MMM DD, YYYY",
                        )
                      : "N/A",
                    type: "date",
                  },
                  {
                    label: "Last Updated",
                    value: selectedProspect?.updated_at
                      ? moment(selectedProspect.updated_at).format(
                          "MMM DD, YYYY",
                        )
                      : "N/A",
                    type: "date",
                  },
                ],
              },
              {
                id: "recent-activities",
                title: "Recent activities",
                icon: History,
                collapsible: true,
                defaultExpanded: true,
                count: 0,
                emptyState: {
                  icon: History,
                  message: "No recent activities for this prospect.",
                  action: {
                    label: "Log activity",
                    onClick: () => {
                      const id = selectedProspect?.id ?? selectedProspect?.data?.id ?? "";
                      if (id) {
                        router.push(`/crm/prospects/prospects-detailpage?id=${id}`);
                        handleCloseProspectSidebar();
                      }
                    },
                  },
                },
              },
              {
                id: "call-recordings",
                title: "Call Recordings",
                icon: PhoneIcon,
                collapsible: true,
                defaultExpanded: true,
                emptyState: {
                  icon: PhoneIcon,
                  message: "No call recordings available yet.",
                  action: {
                    label: "Make a call",
                    onClick: () =>
                      selectedProspect?.phone &&
                      handleCallClick(selectedProspect),
                  },
                },
              },
              {
                id: "notes",
                title: "Notes",
                icon: FileText,
                collapsible: true,
                defaultExpanded: true,
                count: 0,
                emptyState: {
                  icon: FileText,
                  message: "No notes added yet.",
                  action: {
                    label: "Add note",
                    onClick: () => console.log("Add note"),
                  },
                },
              },
            ]}
          />
        )}
        {/* Filters Sidebar */}
        <GenericFilterSidebar
          isOpen={showFiltersSidebar}
          onClose={handleCloseFiltersSidebar}
          title="Filters"
          subtitle="Filter prospects by various criteria"
          width="400px"
          filters={[
            {
              id: "search",
              label: "Search",
              type: "text",
              value: prospectsSearch,
              onChange: (value) => setProspectsSearch(value),
              placeholder: "Search by name or phone...",
            },
            {
              id: "assignedTo",
              label: "Owner",
              type: "select",
              value: prospectsFilters.assignedTo
                ? (() => {
                    const assignedToId = prospectsFilters.assignedTo;
                    const ext = extensions.find(
                      (e: any) => (e.id || e.extension) === assignedToId,
                    );
                    return ext
                      ? {
                          value: assignedToId,
                          label: ext.display_name || ext.name || assignedToId,
                        }
                      : { value: assignedToId, label: assignedToId };
                  })()
                : null,
              onChange: (selected) => {
                const assignedToValue = selected ? selected.value : null;
                setProspectsFilters((prev) => ({
                  ...prev,
                  assignedTo: assignedToValue,
                }));
                setActiveFilter("all");
              },
              options: extensions.map((ext: any) => ({
                value: ext.id || ext.extension,
                label: ext.display_name || ext.name || ext.id || ext.extension,
              })),
              placeholder: "Search and select owner...",
              isClearable: true,
              styles: customSelectStyles,
            },
            {
              id: "campaigns",
              label: "Campaigns",
              type: "multi-select",
              value: prospectsFilters.campaigns
                ? prospectsFilters.campaigns.map((campaignId: string) => {
                    const campaign = availableCampaigns.find(
                      (c: any) => c.value === campaignId,
                    );
                    return campaign
                      ? { value: campaignId, label: campaign.label }
                      : { value: campaignId, label: campaignId };
                  })
                : [],
              onChange: (selected) => {
                const campaignValues = selected
                  ? selected.map((s: any) => s.value)
                  : null;
                setProspectsFilters((prev) => ({
                  ...prev,
                  campaigns: campaignValues,
                }));
                setActiveFilter("all");
              },
              options: availableCampaigns.map((c) => ({
                value: c.value,
                label: c.label,
              })),
              placeholder: "Select campaigns...",
              isClearable: true,
              styles: customSelectStyles,
            },
            {
              id: "nextCallDateFrom",
              label: "Next Call Date (From)",
              type: "date",
              value: prospectsFilters.nextCallDateFrom || "",
              onChange: (value) => {
                const dateValue = value || null;
                setProspectsFilters((prev) => ({
                  ...prev,
                  nextCallDateFrom: dateValue,
                }));
              },
              placeholder: "From date",
            },
            {
              id: "nextCallDateTo",
              label: "Next Call Date (To)",
              type: "date",
              value: prospectsFilters.nextCallDateTo || "",
              onChange: (value) => {
                const dateValue = value || null;
                setProspectsFilters((prev) => ({
                  ...prev,
                  nextCallDateTo: dateValue,
                }));
              },
              placeholder: "To date",
            },
            {
              id: "sourceFile",
              label: "Source Name",
              type: "select",
              value: prospectsFilters.sourceFile
                ? {
                    value: prospectsFilters.sourceFile,
                    label: prospectsFilters.sourceFile,
                  }
                : null,
              onChange: (selected) => {
                const sourceValue = selected ? selected.value : null;
                setProspectsFilters((prev) => ({
                  ...prev,
                  sourceFile: sourceValue,
                }));
                setActiveFilter("all");
              },
              options: uniqueSources,
              placeholder: "Select source...",
              isClearable: true,
              styles: customSelectStyles,
            },
            {
              id: "tags",
              label: "Tags",
              type: "multi-select",
              value: prospectsFilters.tags
                ? prospectsFilters.tags.map((tagValue: string) => {
                    const tag = availableTags.find(
                      (t: any) => t.value === tagValue,
                    );
                    return tag
                      ? { value: tagValue, label: tag.label }
                      : { value: tagValue, label: tagValue };
                  })
                : [],
              onChange: (selected) => {
                const tagValues = selected
                  ? selected.map((s: any) => s.value)
                  : null;
                setProspectsFilters((prev) => ({
                  ...prev,
                  tags: tagValues,
                }));
                setActiveFilter("all");
              },
              options: availableTags.map((tag) => ({
                value: tag.value,
                label: tag.label,
              })),
              placeholder: "Select tags...",
              isClearable: true,
              styles: customSelectStyles,
            },
          ]}
          onApply={() => {
            const filtersToApply: Record<string, any> = {};

            if (prospectsSearch) {
              filtersToApply.search = prospectsSearch;
            }
            if (prospectsFilters.assignedTo) {
              filtersToApply.user_extension = [prospectsFilters.assignedTo];
            }
            if (
              prospectsFilters.campaigns &&
              prospectsFilters.campaigns.length > 0
            ) {
              filtersToApply.campaign_id = prospectsFilters.campaigns;
            }
            if (prospectsFilters.sourceFile) {
              filtersToApply.source_file = prospectsFilters.sourceFile;
            }
            if (prospectsFilters.tags && prospectsFilters.tags.length > 0) {
              filtersToApply.tags = prospectsFilters.tags;
            }

            // Next Call Date (From)/(To) -> scheduled_call_from / scheduled_call_to
            if (prospectsFilters.nextCallDateFrom) {
              filtersToApply.scheduled_call_from =
                prospectsFilters.nextCallDateFrom;
            }
            if (prospectsFilters.nextCallDateTo) {
              filtersToApply.scheduled_call_to = prospectsFilters.nextCallDateTo;
            }

            handleFiltersChange(filtersToApply);
            setPagination((prev) => ({
              ...prev,
              currentPage: 1,
            }));
            setRefreshKey((prev) => prev + 1);
            setShowFiltersSidebar(false);
          }}
          onReset={() => {
            setProspectsSearch("");
            setProspectsFilters({
              assignedTo: null,
              campaigns: null,
              nextCallDateFrom: null,
              nextCallDateTo: null,
              sourceFile: null,
              tags: null,
            });
            handleFiltersChange({});
            setCurrentFilters({});
            setActiveFilter("all");
            setPagination((prev) => ({
              ...prev,
              currentPage: 1,
            }));
            setRefreshKey((prev) => prev + 1);
          }}
        />
      </div>{" "}
      {/* End flex container */}
      {/* Convert to Lead – same sidebar as Create Lead on leads page, with prospect pre-filled */}
      <CreateLeadModal
        show={showConvertToLeadModal}
        onHide={() => {
          setShowConvertToLeadModal(false);
          setConvertingProspectId(null);
        }}
        onSuccess={() => {
          setShowConvertToLeadModal(false);
          setConvertingProspectId(null);
          setRefreshKey((prev) => prev + 1);
          toast.success("Prospect converted to lead successfully!");
        }}
        type="lead"
        crmDataId={convertingProspectId ?? undefined}
      />
      {/* Column Editor Modal */}
      <Modal
        show={showColumnEditor}
        onHide={() => setShowColumnEditor(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Customize Columns</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">
            Select which columns to display in the table
          </p>
          <Row>
            {prospectsColumns.map((col) => {
              const isChecked = draftSelectedColumns.includes(col.key);
              const isOnlySelected =
                isChecked && draftSelectedColumns.length === 1;
              return (
                <Col key={col.key} md={6} className="mb-2">
                  <Form.Check
                    type="checkbox"
                    id={`column-check-${col.key}`}
                    label={col.label}
                    checked={isChecked}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked) {
                        setDraftSelectedColumns((prev) =>
                          prev.includes(col.key) ? prev : [...prev, col.key],
                        );
                      } else if (!isOnlySelected) {
                        setDraftSelectedColumns((prev) =>
                          prev.filter((k) => k !== col.key),
                        );
                      }
                    }}
                  />
                </Col>
              );
            })}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowColumnEditor(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setSelectedColumns(draftSelectedColumns);
              setShowColumnEditor(false);
            }}
          >
            Apply Changes
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Export Modal */}
      <Modal
        show={showExportModal}
        onHide={() => setShowExportModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Export Prospects</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small mb-3">
            Choose filters to define which prospects are exported. Defaults
            match your current table view.
          </p>
          <Form.Group className="mb-3">
            <Form.Label>File name</Form.Label>
            <Form.Control
              type="text"
              value={exportFileName}
              onChange={(e) => setExportFileName(e.target.value)}
              placeholder="prospects_2025-02-24"
            />
          </Form.Group>
          <hr />
          <h6 className="mb-3">Export filters</h6>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Associate with</Form.Label>
                <Form.Select
                  value={
                    exportFilters.user_extension
                      ? String(exportFilters.user_extension)
                      : ""
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    setExportFilters((prev) => {
                      const next = { ...prev };
                      if (v) next.user_extension = v;
                      else delete next.user_extension;
                      return next;
                    });
                  }}
                >
                  <option value="">All owners</option>
                  {extensions.map((ext) => (
                    <option
                      key={String(ext.id || ext.extension)}
                      value={String(ext.id || ext.extension)}
                    >
                      {ext.display_name ||
                        ext.name ||
                        ext.id ||
                        ext.extension ||
                        ""}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Lead status</Form.Label>
                <Form.Select
                  value={exportFilters.disposition || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setExportFilters((prev) => {
                      const next = { ...prev };
                      if (v) next.disposition = v;
                      else delete next.disposition;
                      return next;
                    });
                  }}
                >
                  <option value="">All status</option>
                  <option value="hot_lead">Hot Lead</option>
                  <option value="warm_lead">Warm Lead</option>
                  <option value="cold_lead">Cold Lead</option>
                  <option value="interested">Interested</option>
                  <option value="callback_requested">Callback Requested</option>
                  <option value="no_answer">No Answer</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="follow_up">Follow Up</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Create date</Form.Label>
                <Form.Select
                  value={(() => {
                    const from = exportFilters.created_at_from;
                    const to = exportFilters.created_at_to;
                    if (!from || !to) return "all";
                    const days = moment(to).diff(moment(from), "days");
                    if (days === 0) return "today";
                    if (days >= 6 && days <= 8) return "week";
                    if (days >= 28 && days <= 31) return "month";
                    return "all";
                  })()}
                  onChange={(e) => {
                    const v = e.target.value;
                    setExportFilters((prev) => {
                      const next = { ...prev };
                      if (v === "all") {
                        delete next.created_at_from;
                        delete next.created_at_to;
                      } else {
                        const today = moment().format("YYYY-MM-DD");
                        if (v === "today") {
                          next.created_at_from = today;
                          next.created_at_to = today;
                        } else if (v === "week") {
                          next.created_at_from = moment()
                            .subtract(7, "days")
                            .format("YYYY-MM-DD");
                          next.created_at_to = today;
                        } else {
                          next.created_at_from = moment()
                            .subtract(30, "days")
                            .format("YYYY-MM-DD");
                          next.created_at_to = today;
                        }
                      }
                      return next;
                    });
                  }}
                >
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 30 days</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Last activity date</Form.Label>
                <Form.Select
                  value={(() => {
                    const from = exportFilters.last_called_at_from;
                    const to = exportFilters.last_called_at_to;
                    if (!from || !to) return "all";
                    const days = moment(to).diff(moment(from), "days");
                    if (days === 0) return "today";
                    if (days >= 6 && days <= 8) return "week";
                    if (days >= 28 && days <= 31) return "month";
                    return "all";
                  })()}
                  onChange={(e) => {
                    const v = e.target.value;
                    setExportFilters((prev) => {
                      const next = { ...prev };
                      if (v === "all") {
                        delete next.last_called_at_from;
                        delete next.last_called_at_to;
                      } else {
                        const today = moment().format("YYYY-MM-DD");
                        if (v === "today") {
                          next.last_called_at_from = today;
                          next.last_called_at_to = today;
                        } else if (v === "week") {
                          next.last_called_at_from = moment()
                            .subtract(7, "days")
                            .format("YYYY-MM-DD");
                          next.last_called_at_to = today;
                        } else {
                          next.last_called_at_from = moment()
                            .subtract(30, "days")
                            .format("YYYY-MM-DD");
                          next.last_called_at_to = today;
                        }
                      }
                      return next;
                    });
                  }}
                >
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 30 days</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-0">
            <Form.Label>Search (optional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Filter by name, phone, etc."
              value={exportFilters.search || ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                setExportFilters((prev) => {
                  const next = { ...prev };
                  if (v) next.search = v;
                  else delete next.search;
                  return next;
                });
              }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={exporting}
            onClick={async () => {
              const name =
                exportFileName.trim() ||
                `prospects_${moment().format("YYYY-MM-DD")}`;
              const ext = name.endsWith(".csv") ? "" : ".csv";
              setExporting(true);
              try {
                const allData = await fetchCrmDataForExport(exportFilters);
                if (allData.length === 0) {
                  toast.info("No prospects match the selected filters.");
                  return;
                }

                // Export ALL fields present in the API response rows.
                // - Top-level keys become columns (excluding campaign/company objects).
                // - Nested `data` object expands into columns by field name only (no "data." prefix).
                // - campaign_id shows campaign name (from campaign object); company_name from company object.
                // - crm_summary column shows crm_summary.summary only.
                const topLevelKeys = new Set<string>();
                const nestedDataKeys = new Set<string>();
                for (const row of allData as any[]) {
                  if (!row || typeof row !== "object") continue;
                  for (const k of Object.keys(row)) {
                    if (k === "data" && row.data && typeof row.data === "object") {
                      for (const dk of Object.keys(row.data)) nestedDataKeys.add(dk);
                    } else if (k !== "campaign" && k !== "company") {
                      topLevelKeys.add(k);
                    }
                  }
                }

                const preferredTopLevelOrder = [
                  "id",
                  "name",
                  "phone",
                  "user_extension",
                  "campaign_id",
                  "source_file",
                  "directory",
                  "is_viewed",
                  "scheduled_call_at",
                  "uploaded_by",
                  "created_by",
                  "note",
                  "company_name",
                  "company_domain",
                  "company_id",
                  "created_at",
                  "updated_at",
                  "tags",
                  "crm_summary",
                ];

                const orderedTopLevel = [
                  ...preferredTopLevelOrder.filter((k) => topLevelKeys.has(k)),
                  ...Array.from(topLevelKeys)
                    .filter((k) => !preferredTopLevelOrder.includes(k))
                    .sort((a, b) => a.localeCompare(b)),
                ];
                const orderedNestedData = Array.from(nestedDataKeys).sort((a, b) =>
                  a.localeCompare(b),
                );
                const nestedDataKeysSet = new Set(orderedNestedData);

                // Headers: top-level keys + data field names only (no "data." prefix); dedupe so shared keys appear once
                const headers = [
                  ...orderedTopLevel,
                  ...orderedNestedData.filter((k) => !orderedTopLevel.includes(k)),
                ];

                const getCellValue = (row: any, header: string) => {
                  // campaign_id: show campaign label (name) from campaign object
                  if (header === "campaign_id") {
                    const label = row?.campaign?.name;
                    if (label != null) return label;
                    const id = row?.campaign_id;
                    return id != null ? String(id) : "";
                  }
                  // company_name: show name from company object
                  if (header === "company_name") {
                    const name = row?.company?.name;
                    if (name != null) return name;
                    const fallback = row?.company_name;
                    return fallback != null ? String(fallback) : "";
                  }
                  // crm_summary: show summary text only, not the full object
                  if (header === "crm_summary") {
                    const summary =
                      row?.crm_summary?.summary ?? row?.data?.crm_summary?.summary;
                    if (summary != null) return typeof summary === "string" ? summary : String(summary);
                    return "";
                  }
                  // Nested data fields: use field name only (read from row.data; if key exists in both, prefer data)
                  let raw: any;
                  if (nestedDataKeysSet.has(header)) {
                    raw = row?.data?.[header] ?? row?.[header];
                  } else {
                    raw = row?.[header];
                  }
                  if (raw == null) return "";
                  if (typeof raw === "string") return raw;
                  if (typeof raw === "number" || typeof raw === "boolean")
                    return String(raw);
                  try {
                    return JSON.stringify(raw);
                  } catch {
                    return String(raw);
                  }
                };
                const escapeCsv = (val: string) => {
                  const s = String(val);
                  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
                  return s;
                };
                const csvContent = [
                  headers.map((h) => escapeCsv(h)).join(","),
                  ...allData.map((row) =>
                    headers
                      .map((h) => escapeCsv(getCellValue(row, h)))
                      .join(","),
                  ),
                ].join("\n");

                const blob = new Blob([csvContent], { type: "text/csv" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = name + ext;
                a.click();
                window.URL.revokeObjectURL(url);
                setShowExportModal(false);
                toast.success(
                  `Exported ${allData.length} prospects successfully!`,
                );
              } catch (err) {
                toast.error("Failed to export prospects");
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} className="me-2" />
                Export
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Add Tab Modal */}
      <Modal show={showTabModal} onHide={() => setShowTabModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Tab</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">Select a filter to add as a new tab</p>
          <div className="d-grid gap-2">
            <Button
              variant="outline-primary"
              onClick={() => {
                if (!customTabs.find((t) => t.id === "scheduled")) {
                  setCustomTabs([
                    ...customTabs,
                    {
                      id: "scheduled",
                      label: "Scheduled",
                      count: metrics.scheduled_records,
                      removable: true,
                    },
                  ]);
                  setShowTabModal(false);
                  toast.success("Tab added successfully!");
                }
              }}
              disabled={customTabs.some((t) => t.id === "scheduled")}
            >
              <FiCalendar size={16} className="me-2" />
              Scheduled
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => {
                if (!customTabs.find((t) => t.id === "has_leads")) {
                  setCustomTabs([
                    ...customTabs,
                    {
                      id: "has_leads",
                      label: "Convert to Leads",
                      removable: true,
                    },
                  ]);
                  setShowTabModal(false);
                  toast.success("Tab added successfully!");
                }
              }}
              disabled={customTabs.some((t) => t.id === "has_leads")}
            >
              <FiTarget size={16} className="me-2" />
              Convert to Leads
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTabModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Create Contact Sidebar */}
      {renderCreateContactSidebar()}
    </React.Fragment>
  );
};

CrmProspectsManagement.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmProspectsManagement;
