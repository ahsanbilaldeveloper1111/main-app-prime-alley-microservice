import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  ReactElement,
} from "react";
import { useRouter } from "next/router";
import {
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Mail,
  Phone,
  MoreHorizontal,
  Calendar,
  MessageSquare,
  ClipboardList,
  ExternalLink,
  Copy,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  User,
  Building2,
  Briefcase,
  FileText,
  Ticket,
  Paperclip,
  Link2,
  Tag,
  DollarSign,
  Search,
  Filter,
  AlertCircle,
  ShoppingCart,
  Pencil,
  Trash2,
  MessageCircle,
  Download as DownloadIcon,
} from "lucide-react";
import parsePhoneNumber from "libphonenumber-js";
import { parsePhoneNumber as parsePhoneNumberInput } from "react-phone-number-input";
import Layout from "@layout/index";
import {
  getAllCrmDataById,
  getCampaigns,
  getCrmDataTags,
  updateCrmData,
  deleteCrmData,
  type CrmDataItem,
} from "@utils/crm";
import { GlobalDateTimeFormat, ModuleSlug } from "@utils/Helper";
import moment from "moment-timezone";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import CrmActivitiesPanel, {
  type CrmActivitiesPanelRef,
} from "@components/CrmActivitiesPanel";
import CrmIntelligenceTab from "@components/CrmIntelligenceTab";
import CrmAssociatedCompaniesCard from "@components/CrmAssociatedCompaniesCard";
import CrmProfileSection from "@components/CrmProfileSection";
import CrmRecordSummarySection from "@components/CrmRecordSummarySection";
import RichNoteEditor from "@components/RichNoteEditor";
import ProspectEditSidebar, {
  type ProspectFormState as ProspectSidebarFormState,
} from "@components/ProspectEditSidebar";
import { useCrmActivityModals } from "@hooks/useCrmActivityModals";
import { useCti } from "@hooks/useCti";
import DeviceSelectionModal from "@components/DeviceSelectionModal";
import { toast } from "react-toastify";
import { Dropdown, Form } from "react-bootstrap";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import { GetHierarchyData } from "@utils/users";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface KeyInfoField {
  label: string;
  value: string;
  copyable?: boolean;
}

type NextPageWithLayout = React.FC & {
  getLayout?: (page: ReactElement) => ReactElement;
};

interface SubscriptionItem {
  id: string;
  name: string;
  status: "active" | "inactive" | "cancelled";
  nextBillingDate: string;
  nextPaymentAmount: string;
  contactEmail: string;
  link: string;
}

interface RevenueSection {
  id: string;
  title: string;
  count: number;
  description: string;
  buttonText: string;
  buttonIcon?: React.ComponentType<{ size?: number }>;
  items?: SubscriptionItem[];
  onButtonClick: () => void;
  addButtonText?: string;
  onAddClick?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ContactRecordPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id: prospectId } = router.query;
  const { hasPermission } = usePermissions();
  const canSendWhatsApp = hasPermission(
    HEADER_CONSTANTS.PERMISSIONS.SEND_WHATSAPP_MESSAGE_CRM,
  );

  const [prospect, setProspect] = useState<CrmDataItem | null>(null);
  const [prospectLoading, setProspectLoading] = useState(true);
  const [prospectError, setProspectError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("about");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(),
  );
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showMoreActivities, setShowMoreActivities] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [tasksRefetch, setTasksRefetch] = useState<(() => void) | null>(null);

  // Prospect & it's related data states
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
  const [extensions, setExtensions] = useState<any[]>([]);
  const [prospectForm, setProspectForm] = useState<ProspectSidebarFormState>({
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
    custom_fields: [],
  });
  // Edit Prospect Sidebar States
  const [showEditContactSidebar, setShowEditContactSidebar] = useState(false);
  const [editContactLoading, setEditContactLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [prospectToDelete, setProspectToDelete] = useState<{
    id: number;
    name?: string;
  } | null>(null);
  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreActivitiesRef = useRef<HTMLDivElement>(null);
  const activitiesPanelRef = useRef<CrmActivitiesPanelRef>(null);

  const prospectRecordId = Number(prospectId) || prospect?.data?.id || 0;
  const prospectRecordName = prospect?.data?.name ?? "Prospect";
  const prospectRecordEmail = prospect?.data?.data?.email ?? "";

  const activityModals = useCrmActivityModals({
    recordType: "prospect",
    recordId: prospectRecordId,
    recordName: prospectRecordName,
    recordEmail: prospectRecordEmail,
    recordPhone: prospect?.data?.phone ?? "",
    onTaskCreated: () => tasksRefetch?.(),
    onNoteCreated: () => activitiesPanelRef.current?.refetchNotes?.(),
    onEmailSent: () => activitiesPanelRef.current?.refetchEmails?.(),
    onMeetingScheduled: () => activitiesPanelRef.current?.refetchMeetings?.(),
  });

  const {
    dialNumber: ctiDialNumber,
    getAllUserDevices,
    makeCall,
    userAddress: ctiUserAddress,
  } = useCti();

  const phoneList = useMemo(() => {
    const phone = prospect?.data?.phone;
    if (!phone || typeof phone !== "string") return [];
    return phone
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
  }, [prospect?.data?.phone]);
  const hasPhone = phoneList.length > 0;
  const numberToCall = hasPhone ? phoneList[0] : "";

  const [showDeviceSelectionModal, setShowDeviceSelectionModal] =
    useState(false);
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [pendingDialedNumber, setPendingDialedNumber] = useState("");
  const [isDialing, setIsDialing] = useState(false);

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

  const handleCall = useCallback(
    async (phoneNumber: string) => {
      const numberToDial = (phoneNumber || "").trim();
      if (!numberToDial) {
        toast.error("No phone number available to call");
        return;
      }
      const userDevices = getAllUserDevices?.();
      if (userDevices && userDevices.length > 1) {
        setAvailableDevices(userDevices);
        setPendingDialedNumber(numberToDial);
        setShowDeviceSelectionModal(true);
        return;
      }
      setIsDialing(true);
      try {
        const result = await ctiDialNumber(numberToDial);
        if (result?.error) {
          toast.error(result.error);
        }
      } catch {
        toast.error("Failed to make call");
      } finally {
        setIsDialing(false);
      }
    },
    [ctiDialNumber, getAllUserDevices],
  );

  const handleDeviceSelect = useCallback(
    async (device: { deviceType: string; deviceName: string }) => {
      const numberToDial = pendingDialedNumber;
      setShowDeviceSelectionModal(false);
      setAvailableDevices([]);
      setPendingDialedNumber("");
      const callerInfo = {
        callingAddress: ctiUserAddress,
        callingDeviceName: device.deviceName,
        callingDeviceType: device.deviceType,
        selectedAt: new Date().toISOString(),
      };
      localStorage.setItem("cti_caller_info", JSON.stringify(callerInfo));
      setIsDialing(true);
      try {
        const result = await makeCall({
          callingAddress: ctiUserAddress ?? "",
          calledAddress: numberToDial,
          callingDeviceType: device.deviceType,
          callingDeviceName: device.deviceName,
        });
        if (result?.error) {
          toast.error(result.error);
        }
      } catch {
        toast.error("Failed to make call");
      } finally {
        setIsDialing(false);
      }
    },
    [pendingDialedNumber, ctiUserAddress, makeCall],
  );

  const handleCallClick = useCallback(() => {
    if (hasPhone) {
      handleCall(numberToCall);
    } else {
      toast.error("No phone number available");
    }
  }, [hasPhone, numberToCall, handleCall]);

  const handleProspectExport = useCallback(async () => {
    if (!prospect?.data) return;
    const id = prospect.data.id ?? prospectRecordId;
    const name = `prospect_${id}.csv`;
    const ext = name.endsWith(".csv") ? "" : ".csv";
    setExporting(true);
    try {
      const row = prospect.data as any;
      const headers = Object.keys(row).filter(
        (k) => typeof row[k] !== "object",
      );
      const csvRows = [
        headers.join(","),
        headers
          .map((h) => {
            const val = row[h];
            if (val == null) return "";
            if (typeof val === "object") return "";
            const s = String(val).replace(/"/g, '""');
            return s.includes(",") || s.includes('"') ? `"${s}"` : s;
          })
          .join(","),
      ];
      const blob = new Blob([csvRows.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name + ext;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Exported prospect successfully!");
    } catch (err) {
      toast.error("Failed to export prospect");
    } finally {
      setExporting(false);
    }
  }, [prospect, prospectRecordId]);

  const handleOpenDeleteProspect = useCallback(() => {
    if (!prospectRecordId || !prospect) return;
    setProspectToDelete({ id: prospectRecordId, name: prospect.data?.name });
    setShowDeleteModal(true);
  }, [prospectRecordId, prospect]);

  const confirmDeleteProspect = useCallback(async () => {
    if (!prospectToDelete) return;
    try {
      await deleteCrmData(prospectToDelete.id);
      setShowDeleteModal(false);
      setProspectToDelete(null);
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Prospect Deleted");
      setSuccessModalDescription("Prospect has been deleted successfully");
      router.push("/crm/prospects");
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("Delete prospect error:", error);
      toast.error("Failed to delete prospect");
    }
  }, [prospectToDelete, router]);

  // Load prospect by ID from URL
  useEffect(() => {
    if (!router.isReady || prospectId == null || prospectId === "") {
      setProspectLoading(false);
      return;
    }
    const id = Number(prospectId);
    if (Number.isNaN(id)) {
      setProspectError("Invalid prospect ID");
      setProspectLoading(false);
      return;
    }
    setProspectLoading(true);
    setProspectError(null);
    getAllCrmDataById(id)
      .then((data: CrmDataItem) => {
        setProspect(data);
        setProspectError(null);
      })
      .catch(() => {
        setProspect(null);
        setProspectError("Failed to load prospect");
      })
      .finally(() => {
        setProspectLoading(false);
      });
  }, [router.isReady, prospectId]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowActionsDropdown(false);
      }
      if (
        moreActivitiesRef.current &&
        !moreActivitiesRef.current.contains(event.target as Node)
      ) {
        setShowMoreActivities(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Open a specific tab when navigating with ?section= (e.g. ?section=activities)
  const validTabIds = ["about", "activities", "intelligence"];
  useEffect(() => {
    if (!router.isReady) return;
    const section = router.query.section;
    const tabId =
      typeof section === "string" ? section.toLowerCase().trim() : null;
    if (tabId && validTabIds.includes(tabId)) {
      setActiveTab(tabId);
    }
  }, [router.isReady, router.query.section]);

  // Load prospect into form when sidebar opens in edit mode
  useEffect(() => {
    if (!showEditContactSidebar || !prospect?.data) return;

    const item = prospect.data as any;
    const d = item.data || {};

    const nameParts = (item.name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const toDatetimeLocal = (v: string | null | undefined) => {
      if (!v) return "";
      const m = moment(v);
      return m.isValid() ? m.format("YYYY-MM-DDTHH:mm") : "";
    };

    const rawTags = (item as any).tags ?? item?.data?.tags ?? d.tags ?? [];
    const tagsArray = Array.isArray(rawTags)
      ? rawTags.map((t: any) =>
          typeof t === "string"
            ? { value: t, label: t, id: 0 }
            : {
                value: t.name ?? t.value ?? String(t.id ?? ""),
                label: t.name ?? t.label ?? t.value ?? String(t.id ?? ""),
                id: Number(t.id ?? t.tag_id ?? t.pivot?.tag_id ?? 0),
              },
        )
      : [];

    let phoneCountryCode = "";
    let phoneNumber = item.phone ?? "";
    console.log("phone", item);
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

    const reservedDataKeys = new Set([
      "email",
      "assigned_to",
      "uploaded_by",
      "disposition",
      "tags",
      "note",
      "contact_owner",
      "lifecycle_stage",
      "legal_basis",
    ]);

    const customFieldsArray =
      d && typeof d === "object"
        ? Object.entries(d)
            .filter(([k]) => !reservedDataKeys.has(k))
            .map(([field_name, field_value]) => ({
              id: `${Date.now()}-${Math.random()}-${field_name}`,
              field_name,
              field_value: Array.isArray(field_value)
                ? (field_value as string[]).join(", ")
                : String(field_value ?? "").trim(),
            }))
            .filter((f) => f.field_name || f.field_value)
        : [];

    setProspectForm({
      firstName,
      lastName,
      email: d.email ?? (item as any).email ?? "",
      phone_country_code: phoneCountryCode,
      phoneNumber,
      campaign_id: item.campaign_id ?? d.campaign_id ?? null,
      contact_owner:
        (item as any).user_extension ??
        d.contact_owner ??
        (item as any).contact_owner ??
        null,
      lifecycle_stage: d.lifecycle_stage ?? "",
      disposition: d.disposition ?? (item as any).disposition ?? "",
      legal_basis: Array.isArray(d.legal_basis) ? d.legal_basis : [],
      company_domain:
        (item as any).company_domain ?? d.company_domain ?? "",
      scheduled_call_at: toDatetimeLocal(
        item.scheduled_call_at ?? d.scheduled_call_at,
      ),
      tags: tagsArray as Array<{ value: string; label: string; id: number }>,
      note: item.note ?? d.note ?? "",
      source:
        (item as any).source_file ??
        d.source ??
        (item as any).source ??
        "",
      custom_fields: customFieldsArray,
    });
  }, [showEditContactSidebar, prospect]);

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

    fetchExtensions();
    loadCampaigns();
    loadTags();
  }, [showEditContactSidebar]);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Tabs
  const tabs = [
    { id: "about", label: "About" },
    { id: "activities", label: "Activities" },
    { id: "intelligence", label: "Intelligence" },
  ];

  // Key Information Fields (from prospect + tickets/leads)
  const firstTicket = prospect?.data?.tickets?.[0];
  const keyInfoFields: KeyInfoField[] = [
    {
      label: "Email",
      value: prospect?.data?.data?.email ?? "--",
      copyable: true,
    },
    {
      label: "Phone Number",
      value: prospect?.data?.phone ?? "--",
      copyable: true,
    },
    {
      label: "Company Name",
      value:
        firstTicket?.company_name ??
        prospect?.data?.company_name ??
        prospect?.data?.name ??
        "--",
    },
    { label: "Company Domain", value: prospect?.data?.company_domain ?? "--" },
    // {
    //   label: "Lifecycle Stage",
    //   value:
    //     prospect?.data?.lifecycle_stage ??
    //     prospect?.data?.data?.lifecycle_stage ??
    //     "--",
    // },
    {
      label: "Owner",
      value: (() => {
        const ownerId = prospect?.data?.user_extension;
        if (ownerId == null) return "--";
        const match = extensions.find(
          (ext: any) =>
            String(ext.id) === String(ownerId) ||
            String(ext.extension) === String(ownerId),
        );
        return match?.display_name ?? match?.name ?? String(ownerId);
      })(),
    },
  ];

  const renderRevenueSection = (section: RevenueSection) => {
    return (
      <div
        key={section.id}
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #eaf0f6",
          borderRadius: "5px",
          padding: "20px",
          marginBottom: "16px",
        }}
      >
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: section.items ? "16px" : "12px",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#141414",
              margin: 0,
            }}
          >
            {section.title} ({section.count})
          </h3>
          {section.addButtonText && (
            <button
              onClick={section.onAddClick}
              style={{
                padding: "6px 12px",
                backgroundColor: "transparent",
                border: "none",
                fontSize: "14px",
                fontWeight: "500",
                color: "#006162",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              +{section.addButtonText}
              <ChevronDown size={14} />
            </button>
          )}
        </div>

        {/* Section Content */}
        {section.items && section.items.length > 0 ? (
          <>
            {/* Subscription Items */}
            {section.items.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "16px",
                  backgroundColor: "#f7fafc",
                  border: "1px solid #eaf0f6",
                  borderRadius: "5px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <FileText size={18} color="#141414" />
                  <a
                    href={item.link}
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      color: "#006162",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = "none";
                    }}
                  >
                    {item.name}
                  </a>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    fontSize: "14px",
                  }}
                >
                  <div>
                    <span style={{ color: "#141414" }}>Status: </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        color: "#141414",
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor:
                            item.status === "active" ? "#10b981" : "#ef4444",
                          display: "inline-block",
                        }}
                      />
                      {item.status.charAt(0).toUpperCase() +
                        item.status.slice(1)}
                    </span>
                  </div>
                  <div style={{ color: "#141414" }}>
                    Next billing date: {item.nextBillingDate}
                  </div>
                  <div style={{ color: "#141414" }}>
                    Next payment amount: {item.nextPaymentAmount}
                  </div>
                  <div>
                    <span style={{ color: "#141414" }}>Contact email: </span>
                    <a
                      href={`mailto:${item.contactEmail}`}
                      style={{
                        color: "#006162",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = "underline";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = "none";
                      }}
                    >
                      {item.contactEmail}
                    </a>
                    <ExternalLink
                      size={12}
                      style={{ marginLeft: "4px", display: "inline" }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* View All Link */}
            <button
              style={{
                padding: "8px 16px",
                backgroundColor: "transparent",
                border: "1px solid #cbd5e0",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#141414",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f7fafc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              View all associated {section.title}
              <ExternalLink size={14} />
            </button>
          </>
        ) : (
          <>
            {/* Empty State */}
            <p
              style={{
                fontSize: "14px",
                color: "#141414",
                lineHeight: "1.6",
                marginBottom: "16px",
              }}
            >
              {section.description}
            </p>

            {section.buttonText && (
              <button
                onClick={section.onButtonClick}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "transparent",
                  border: "1px solid #cbd5e0",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#141414",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f7fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {section.buttonIcon && <section.buttonIcon size={16} />}
                {section.buttonText}
              </button>
            )}
          </>
        )}
      </div>
    );
  };
  // ============================================================================
  // LEFT SIDEBAR (Contact Info)
  // ============================================================================

  const handleUpdateContactSubmit = async (data: any) => {
    const name = [data.firstName, data.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    if(data.id == null) {
      toast.error("Prospect not found");
      return;
    }
    if (
      !name ||
      !data.email?.trim() ||
      !data.phoneNumber?.trim()
    ) {
      toast.error("Name, email and phone are required");
      return;
    }
    if (data.campaign_id == null) {
      toast.error("Campaign is required");
      return;
    }

    const phoneForPayload =
      data.phone_country_code && data.phoneNumber?.trim()
        ? `${data.phone_country_code} ${data.phoneNumber.trim()}`
        : data.phoneNumber?.trim() ?? "";

    const customFieldsForPayload: Array<{ field_name: string; field_value: string }> =
      (data.custom_fields ?? [])
        .map((f: { field_name?: string; field_value?: string }) => ({
          field_name: String(f.field_name ?? "").trim(),
          field_value: String(f.field_value ?? "").trim(),
        }))
        .filter((f: { field_name: string; field_value: string }) => f.field_name || f.field_value);

    const dataPayload: Record<string, any> = {
      email: data.email.trim(),
      disposition: data.disposition || undefined,
      note: data.note || undefined,
      contact_owner: data.contact_owner ?? undefined,
      // lifecycle_stage: data.lifecycle_stage || undefined,
      legal_basis: data.legal_basis?.length ? data.legal_basis : undefined,
    };

    customFieldsForPayload.forEach((f: { field_name: string; field_value: string }) => {
      dataPayload[f.field_name] = f.field_value;
    });

    setEditContactLoading(true);
    try {
      await updateCrmData(data.id, {
        name,
        phone: phoneForPayload,
        campaign_id: data.campaign_id ?? null,
        company_domain: data.company_domain?.trim() || undefined,
        source: data.source?.trim() || undefined,
        scheduled_call_at: data.scheduled_call_at || undefined,
        data: dataPayload,
        tag_ids: data.tags?.length
          ? data.tags.map((t: { id: number }) => t.id)
          : [],
      });
      setShowEditContactSidebar(false);
      const updated = await getAllCrmDataById(data.id);
      setProspect(updated);
    } catch {
      // Error already shown by updateCrmData
    } finally {
      setEditContactLoading(false);
    }
  };

  const renderEditContactSidebar = () => {

    if (!showEditContactSidebar) return null;

    const isFormValid =
      prospectForm?.email?.trim() &&
      prospectForm?.phoneNumber?.trim() &&
      prospectForm?.firstName?.trim() &&
      prospectForm?.lastName?.trim() &&
      prospectForm?.campaign_id != null;

    return (
      <ProspectEditSidebar
        isOpen={showEditContactSidebar}
        title="Edit Prospect"
        isEditing
        isFormValid={!!isFormValid}
        createContactLoading={editContactLoading}
        contactForm={prospectForm}
        setContactForm={setProspectForm}
        contactFormLoading={false}
        contactFormLoadError={null}
        availableCampaigns={availableCampaigns}
        extensions={extensions}
        availableTags={availableTags}
        parsePhoneNumberInput={parsePhoneNumberInput}
        onClose={() => {
          setShowEditContactSidebar(false);
          setEditContactLoading(false);
        }}
        onSubmitPrimary={() =>
          handleUpdateContactSubmit({
            ...prospectForm,
            id: prospect?.data?.id,
          })
        }
      />
    );
  };

  const renderLeftSidebar = () => (
    <div
      className="sidebar-scrollbar"
      style={{
        width: "385px",
        backgroundColor: "#f0f0f0",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        flexShrink: 0,
        overflowY: "auto",
        marginRight: "10px",
      }}
    >
      {/* Header Card */}
      <div
        style={{
          padding: "10px 0px",
          borderRadius: "10px",
          backgroundColor: "#ffffff",
          marginBottom: "12px",
          border: "1px solid #cccccc",
        }}
      >
        {/* Top Bar - Breadcrumb and Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "10px",
            borderBottom: "1px solid #cccccc",
            paddingLeft: "24px",
            paddingRight: "24px",
          }}
        >
          <button
            onClick={() => window.history.back()}
            style={{
              background: "transparent",
              border: "none",
              padding: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              color: "#141414",
              fontWeight: "500",
            }}
          >
            <ChevronDown size={16} style={{ transform: "rotate(90deg)" }} />
            Prospects
          </button>

          <div style={{ position: "relative" }} ref={dropdownRef}>
            <button
              onClick={() => setShowActionsDropdown(!showActionsDropdown)}
              style={{
                padding: "6px 14px",
                backgroundColor: "transparent",
                border: "none",
                fontSize: "14px",
                fontWeight: "500",
                color: "#141414",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                borderRadius: "3px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f5f8fa";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Actions
              <ChevronDown size={14} />
            </button>

            {showActionsDropdown && (
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
                  minWidth: "180px",
                  zIndex: 1000,
                  overflow: "hidden",
                }}
              >
                {["Edit", "Delete", "Export"].map((action) => (
                  <button
                    key={action}
                    onClick={() => {
                      if (action === "Edit") {
                        setShowEditContactSidebar(true);
                      } else if (action === "Delete") {
                        handleOpenDeleteProspect();
                      } else if (action === "Export") {
                        void handleProspectExport();
                      }
                      setShowActionsDropdown(false);
                    }}
                
                    style={{
                      width: "100%",
                      padding: "10px 16px",
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
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Avatar and Contact Info */}
        <div
          style={{
            paddingTop: "16px",
            paddingBottom: "0px",

            paddingLeft: "24px",
            paddingRight: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "37px",
                borderRadius: "26px",
                background: "#efe7f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: "400",
                color: "#141414",
                flexShrink: 0,
              }}
            >
              {prospect?.data?.name
                ? prospect?.data.name
                    .trim()
                    .split(/\s+/)
                    .map((s: string) => s[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "NA"}
            </div>
            <div style={{ flex: 1 }}>
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: "500",
                  color: "#141414",
                  margin: "0 0 4px 0",
                  lineHeight: "1.3",
                }}
              >
                {prospect?.data?.name ?? "Unknown"}
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "#718096",
                  margin: "0 0 8px 0",
                  lineHeight: "1.4",
                }}
              >
                {firstTicket?.company_name
                  ? `Director at ${firstTicket?.company_name}`
                  : "Prospect"}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {prospect?.data?.data?.email ? (
                  <>
                    <a
                      href={`mailto:${prospect?.data?.data?.email}`}
                      style={{
                        fontSize: "14px",
                        color: "#006162",
                        textDecoration: "none",
                        fontWeight: "500",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = "underline";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = "none";
                      }}
                    >
                      {prospect?.data?.data?.email}
                    </a>
                    <button
                      onClick={() =>
                        copyToClipboard(prospect?.data?.data?.email ?? "")
                      }
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: "4px",
                        cursor: "pointer",
                        color: "#718096",
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="Copy email"
                    >
                      <Copy size={14} />
                    </button>
                  </>
                ) : (
                  <span style={{ fontSize: "14px", color: "#718096" }}>
                    No email
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "17px",
            paddingTop: "6px",
            paddingBottom: "4px",
            paddingLeft: "24px",
            paddingRight: "24px",
          }}
        >
          {[
            {
              icon: ClipboardList,
              label: "Note",
              disabled: false,
              onClick: activityModals.openNote,
            },
            {
              icon: Mail,
              label: "Email",
              disabled: false,
              onClick: activityModals.openEmail,
            },
            {
              icon: Phone,
              label: "Call",
              disabled: !hasPhone,
              onClick: handleCallClick,
            },
            {
              icon: ClipboardList,
              label: "Task",
              disabled: false,
              onClick: activityModals.openTask,
            },
            {
              icon: Calendar,
              label: "Meeting",
              disabled: false,
              onClick: activityModals.openMeeting,
            },
          ].map((action, index) => {
            const Icon = action.icon;
            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <button
                  type="button"
                  disabled={action.disabled}
                  onClick={action.onClick}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "9px 7px",
                    background: "#ffffff",
                    border: "1px solid #8a8a8a",
                    borderRadius: "50%",
                    cursor: action.disabled ? "not-allowed" : "pointer",
                    width: "30px",
                    height: "30px",
                    color: "#141414",
                  }}
                >
                  <Icon size={20} />
                </button>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#141414",
                    fontWeight: "300",
                  }}
                >
                  {action.label}
                </span>
              </div>
            );
          })}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              position: "relative",
            }}
            ref={moreActivitiesRef}
          >
            <button
              onClick={() => setShowMoreActivities(!showMoreActivities)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "9px 7px",
                background: "#ffffff",
                border: "1px solid #8a8a8a",
                borderRadius: "50%",
                cursor: "pointer",
                width: "30px",
                height: "30px",
                color: "#141414",
              }}
            >
              <MoreHorizontal size={20} />
            </button>
            <span
              style={{
                fontSize: "12px",
                color: "#141414",
                fontWeight: "300",
              }}
            >
              More
            </span>

            {showMoreActivities && (
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
                  minWidth: "150px",
                  zIndex: 1000,
                }}
              >
                {[
                  { label: "SMS", onClick: activityModals.openSms },
                  { label: "WhatsApp", onClick: activityModals.openWhatsApp },
                ].map(({ label, onClick }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setShowMoreActivities(false);
                      onClick();
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
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
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Information Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "5px",
          marginBottom: "12px",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
          border: "1px solid #cccccc",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            cursor: "pointer",
            backgroundColor: "#ffffff",
            borderBottom: collapsedSections.has("key-info")
              ? "none"
              : "1px solid #cccccc",
          }}
          onClick={() => toggleSection("key-info")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ChevronDown
              size={18}
              style={{
                color: "#141414",
                transform: collapsedSections.has("key-info")
                  ? "rotate(-90deg)"
                  : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#141414",
                margin: 0,
              }}
            >
              Key information
            </h3>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              fontSize: "14px",
              fontWeight: "500",
              borderRadius: "3px",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f5f8fa";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Actions
          </button>
        </div>

        {!collapsedSections.has("key-info") && (
          <div style={{ padding: "20px" }}>
            {keyInfoFields.map((field, index) => (
              <div key={index} style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "400",
                    color: "#666",
                    marginBottom: "4px",
                  }}
                >
                  {field.label}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#141414",
                      fontWeight: "400",
                      flex: 1,
                    }}
                  >
                    {field.value}
                  </div>
                  {field.copyable && (
                    <button
                      onClick={() => copyToClipboard(field.value)}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: "4px",
                        cursor: "pointer",
                        color: "#141414",
                        display: "flex",
                        alignItems: "center",
                        borderRadius: "3px",
                      }}
                      title="Copy"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f5f8fa";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <Copy size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ============================================================================
  // MAIN CONTENT (Center with Tabs)
  // ============================================================================

  console.log("prospect", prospect);

  const renderMainContent = () => (
    <div
      style={{
        flex: 1,
        backgroundColor: "transparent",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        marginLeft: "6px",
        marginRight: "6px",
        borderTop: "1px solid #cccccc",
        borderRadius: "10px",
      }}
    >
      {/* Tabs */}
      {/* Tabs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
          // borderBottom: '1px solid #cbd5e0',
          backgroundColor: "#f5f8fa",
          position: "sticky",
          top: 0,
          zIndex: 10,
          gap: "0",
          borderLeft: "1px solid #cccccc",
          borderRight: "1px solid #cccccc",
          borderRadius: "10px 10px 0 0",
        }}
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "14px 20px",
              backgroundColor: activeTab === tab.id ? "#ffffff" : "#f5f5f5",
              border: "none",
              borderRight:
                index < tabs.length - 1 ? "1px solid #cbd5e0" : "none",
              borderBottom:
                activeTab === tab.id
                  ? "1px solid #ffffff"
                  : "1px solid #cbd5e0",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: activeTab === tab.id ? "600" : "400",
              color: activeTab === tab.id ? "#141414" : "#141414",
              transition: "all 0.2s",
              textAlign: "center",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.backgroundColor = "#eaf0f6";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.backgroundColor = "#f5f8fa";
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: "14px 20px", flex: 1 }}>
        {activeTab === "about" && (
          <>
            {/* Record Summary */}
            <CrmRecordSummarySection
              isCollapsed={collapsedSections.has("breeze")}
              onToggle={() => toggleSection("breeze")}
              summary={
                (prospect as any)?.crm_summary?.summary ??
                (prospect as any)?.data?.crm_summary?.summary ??
                (prospect as any)?.data?.data?.crm_summary?.summary ??
                null
              }
              metaLabel={
                prospect?.data?.crm_summary?.updated_at
                  ? `Updated ${new Date(
                      prospect.data.crm_summary.updated_at,
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : undefined
              }
              onRefreshClick={async () => {
                const id = Number(prospectId || prospect?.data?.id || prospect?.id);
                if (!id || Number.isNaN(id)) {
                  toast.error("Invalid prospect ID");
                  return;
                }
                try {
                  const refreshed = await getAllCrmDataById(id);
                  setProspect((prev) => {
                    if (!prev) return refreshed;
                    const refreshedSummary = (refreshed as any)?.data?.crm_summary;
                    if (!refreshedSummary) return prev;
                    return {
                      ...prev,
                      data: {
                        crm_summary: refreshedSummary,
                        ...(prev as any).data,
                      },
                    } as any;
                  });
                  toast.success("Summary refreshed");
                } catch {
                  toast.error("Failed to refresh summary");
                }
              }}
            />

            {/* Contact Profile */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #cccccc",
                borderRadius: "10px",
                marginBottom: "20px",
              }}
            >
              <CrmProfileSection
                title="Contact profile"
                fields={[
                  {
                    label: "Company name",
                    value:
                      (prospect as any)?.data?.company?.enrichment_data?.structured_data
                        ?.official_company_name ?? prospect?.data?.company_name ?? "--",
                  },
                  {
                    label: "Street address",
                    value:
                      (prospect as any)?.data?.company?.enrichment_data?.structured_data
                        ?.headquarters?.address ??
                      (prospect as any)?.data?.company?.address ??
                      "--",
                  },
                  {
                    label: "City",
                    value:
                      (prospect as any)?.data?.company?.enrichment_data?.structured_data
                        ?.headquarters?.city ??
                      "--",
                  },
                  {
                    label: "Postal code",
                    value:
                      (prospect as any)?.data?.data?.postal_code ?? "--",
                  },
                  {
                    label: "State/Region",
                    value:
                    (prospect as any)?.data?.company?.enrichment_data?.structured_data
                    ?.headquarters?.state ?? "--",
                  },
                  {
                    label: "Email",
                    value:
                      (prospect as any)?.data?.company?.enrichment_data?.structured_data
                        ?.emails?.[0]?.email ?? "--",
                    link: true,
                  },
                ]}
              />
            </div>
            {/* Enrollments */}
            {/* <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #cccccc",
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px 20px",
                  cursor: "pointer",
                  borderBottom: collapsedSections.has("enrollments")
                    ? "none"
                    : "1px solid #eaf0f6",
                }}
                onClick={() => toggleSection("enrollments")}
              >
                <ChevronDown
                  size={18}
                  style={{
                    color: "#141414",
                    marginRight: "10px",
                    transform: collapsedSections.has("enrollments")
                      ? "rotate(-90deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#141414",
                    margin: 0,
                  }}
                >
                  Enrollments
                </h3>
              </div>

              {!collapsedSections.has("enrollments") && (
                <div style={{ padding: "20px" }}>
                  <h4
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#141414",
                      marginBottom: "12px",
                    }}
                  >
                    Communication subscriptions
                  </h4>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#666666",
                      marginBottom: "12px",
                    }}
                  >
                    Ahmad Hussain has not specified any preferences.
                  </p>
                  <a
                    href="#"
                    style={{
                      fontSize: "14px",
                      color: "#006162",
                      textDecoration: "none",
                      fontWeight: "500",
                    }}
                  >
                    View subscriptions
                  </a>
                </div>
              )}
            </div> */}
          </>
        )}

        {activeTab === "activities" && (
          <CrmActivitiesPanel
            ref={activitiesPanelRef}
            recordType="prospect"
            recordId={prospectRecordId}
            record={prospect}
            recordLoading={prospectLoading}
            recordName={prospectRecordName}
            canSendWhatsApp={canSendWhatsApp}
            onWhatsAppChatClick={(chat) => {
              router.push(`/crm/inbox?chat_id=${chat.id}`);
            }}
            onTasksRefetchReady={(fn: () => void) => setTasksRefetch(() => fn)}
            {...activityModals.crmActivitiesPanelProps}
          />
        )}

        {activeTab === "intelligence" && (
          <CrmIntelligenceTab
            company={(prospect as any)?.data?.company ?? null}
            relatedCompany={prospect?.data?.company_name ?? "—"}
          />
        )}
      </div>
    </div>
  );

  // ============================================================================
  // RIGHT SIDEBAR (Associated Records)
  // ============================================================================

  const renderRightSidebar = () => (
    <div
      style={{
        position: "relative",
        width: isRightSidebarCollapsed ? "0px" : "385px",
        marginLeft: isRightSidebarCollapsed ? "0px" : "10px",
        flexShrink: 0,
        transition: "width 0.3s ease, margin-left 0.3s ease",
      }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
        style={{
          position: "fixed",
          top: "100px",
          right: isRightSidebarCollapsed ? "10px" : "calc(395px)",
          zIndex: 101,
          backgroundColor: "#ffffff",
          border: "1px solid #8a8a8a",
          borderRadius: "30px",
          padding: "3px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f5f8fa";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#ffffff";
        }}
        title={isRightSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isRightSidebarCollapsed ? (
          <ChevronLeft size={20} style={{ color: "#141414" }} />
        ) : (
          <ChevronRight size={20} style={{ color: "#141414" }} />
        )}
      </button>

      {!isRightSidebarCollapsed && (
        <div
          className="sidebar-scrollbar"
          style={{
            width: "100%",
            backgroundColor: "#f0f0f0",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflowY: "auto",
            padding: "0",

            borderRadius: "10px",
          }}
        >
          <div
            style={{
              paddingTop: "0px",
              paddingBottom: "0",
            }}
          >

            {(() => {
              const company = (prospect as any)?.data?.company ?? null;
              const struct = company?.enrichment_data?.structured_data ?? null;
              const companyName =
                struct?.official_company_name ??
                company?.name ??
                prospect?.data?.company_name ??
                null;
              const primaryPhone =
                struct?.phones?.[0]?.number ??
                company?.phone ??
                prospect?.data?.company_contact ??
                null;
              const phones =
                struct?.phones?.map((p: any) => ({
                  number: p?.number ?? "",
                  type: p?.type ?? null,
                })) ?? undefined;
              const companyId =
                company?.id ??
                (prospect as any)?.data?.company_id ??
                (prospect as any)?.data?.company?.company_id ??
                null;
              return (
                <CrmAssociatedCompaniesCard
                  sectionId="companies"
                  collapsedSections={collapsedSections}
                  toggleSection={toggleSection}
                  companyName={companyName}
                  primaryPhone={primaryPhone}
                  phones={phones}
                  companyId={companyId}
                />
              );
            })()}
            {/* Deals - from prospect.data.tickets[].deals */}
            {(() => {
              const allDeals =
                prospect?.data?.tickets?.flatMap((t: any) => t.deals ?? []) ??
                [];
              const dealsCount = allDeals.length;
              const formatAmount = (deal: any) => {
                const curr = deal.currency ?? "";
                const val = deal.net_value ?? deal.grand_total ?? "";
                return val ? `${curr} ${val}` : "--";
              };
              const formatDate = (d: string | null | undefined) =>
                d
                  ? new Date(d).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "--";
              return (
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "10px",
                    marginBottom: "12px",
                    overflow: "hidden",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
                    border: "1px solid #cccccc",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 20px 0",
                      cursor: "pointer",
                      backgroundColor: "#ffffff",
                    }}
                    onClick={() => toggleSection("deals")}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        flex: 1,
                      }}
                    >
                      <ChevronDown
                        size={18}
                        style={{
                          color: "#141414",
                          transform: collapsedSections.has("deals")
                            ? "rotate(-90deg)"
                            : "rotate(0deg)",
                          transition: "transform 0.2s ease",
                        }}
                      />
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#141414",
                          margin: 0,
                          lineHeight: "1.2",
                        }}
                      >
                        Deals ({dealsCount})
                      </h3>
                    </div>
                  </div>

                  {!collapsedSections.has("deals") && (
                    <div style={{ padding: "20px" }}>
                      {dealsCount === 0 ? (
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#666666",
                            margin: 0,
                          }}
                        >
                          No deals associated.
                        </p>
                      ) : (
                        <>
                          {allDeals.map((deal: any) => (
                            <div
                              key={deal.id}
                              style={{
                                marginBottom: "16px",
                                border: "1px solid #cccccc",
                                borderRadius: "10px",
                                padding: "15px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "14px",
                                  color: "#006162",
                                  fontWeight: "500",
                                  display: "block",
                                  marginBottom: "8px",
                                }}
                              >
                                {deal.name}
                              </span>
                              <p
                                style={{
                                  fontSize: "13px",
                                  color: "#666666",
                                  margin: "4px 0",
                                }}
                              >
                                Amount: {formatAmount(deal)}
                              </p>
                              <p
                                style={{
                                  fontSize: "13px",
                                  color: "#666666",
                                  margin: "4px 0",
                                }}
                              >
                                Close Date:{" "}
                                {formatDate(deal.expected_close_date)}
                              </p>
                              <p
                                style={{
                                  fontSize: "13px",
                                  color: "#666666",
                                  margin: "4px 0",
                                }}
                              >
                                Deal Stage: {deal.status ?? "--"}
                              </p>
                            </div>
                          ))}
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              const firstDeal = allDeals[0];
                              const id = firstDeal?.id;
                              const href = id
                                ? `/crm/deals/deals-detailpage?id=${encodeURIComponent(
                                    String(id),
                                  )}`
                                : "/crm/deals";
                              window.open(href, "_blank", "noopener,noreferrer");
                            }}
                            style={{
                              fontSize: "13px",
                              color: "#006162",
                              textDecoration: "none",
                              fontWeight: "500",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            View all associated Deals
                            <ExternalLink size={12} />
                          </a>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Leads (API: tickets) */}
            {(() => {
              const leads = prospect?.data?.tickets ?? [];
              const leadsCount = leads.length;
              return (
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "10px",
                    marginBottom: "12px",
                    overflow: "hidden",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
                    border: "1px solid #cccccc",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 20px 0",
                      cursor: "pointer",
                      backgroundColor: "#ffffff",
                    }}
                    onClick={() => toggleSection("tickets")}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        flex: 1,
                      }}
                    >
                      <ChevronDown
                        size={18}
                        style={{
                          color: "#141414",
                          transform: collapsedSections.has("tickets")
                            ? "rotate(-90deg)"
                            : "rotate(0deg)",
                          transition: "transform 0.2s ease",
                        }}
                      />
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#141414",
                          margin: 0,
                          lineHeight: "1.2",
                        }}
                      >
                        Leads ({leadsCount})
                      </h3>
                    </div>
                  </div>

                  {!collapsedSections.has("tickets") && (
                    <div style={{ padding: "20px" }}>
                      {leadsCount === 0 ? (
                        <div
                          style={{ padding: "32px 20px", textAlign: "center" }}
                        >
                          <Ticket
                            size={48}
                            style={{ color: "#cbd5e0", marginBottom: "16px" }}
                          />
                          <p
                            style={{
                              fontSize: "14px",
                              color: "#718096",
                              margin: 0,
                              lineHeight: "1.6",
                            }}
                          >
                            Track the customer requests associated with this
                            record.
                          </p>
                        </div>
                      ) : (
                        <>
                          {leads.map((lead: any) => (
                            <div
                              key={lead.id}
                              style={{
                                marginBottom: "16px",
                                border: "1px solid #cccccc",
                                borderRadius: "10px",
                                padding: "15px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "14px",
                                  color: "#006162",
                                  fontWeight: "500",
                                  display: "block",
                                  marginBottom: "8px",
                                }}
                              >
                                {lead.name}
                              </span>
                              <p
                                style={{
                                  fontSize: "13px",
                                  color: "#666666",
                                  margin: "4px 0",
                                }}
                              >
                                Company: {lead.company_name ?? "--"}
                              </p>
                              <p
                                style={{
                                  fontSize: "13px",
                                  color: "#666666",
                                  margin: "4px 0",
                                }}
                              >
                                Status: {lead.status ?? "--"}
                              </p>
                              {(lead.deals?.length ?? 0) > 0 && (
                                <p
                                  style={{
                                    fontSize: "13px",
                                    color: "#666666",
                                    margin: "4px 0",
                                  }}
                                >
                                  Deals: {lead.deals.length}
                                </p>
                              )}
                            </div>
                          ))}
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              const firstLead = leads[0];
                              const id = firstLead?.id;
                              const href = id
                                ? `/crm/leads/leads-detailpage?id=${encodeURIComponent(
                                    String(id),
                                  )}`
                                : "/crm/leads";
                              window.open(href, "_blank", "noopener,noreferrer");
                            }}
                            style={{
                              fontSize: "13px",
                              color: "#006162",
                              textDecoration: "none",
                              fontWeight: "500",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            View all associated Leads
                            <ExternalLink size={12} />
                          </a>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (prospectLoading) {
    return (
      <Layout>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "calc(100vh - 120px)",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <RefreshCw
            size={32}
            style={{ color: "#006162", animation: "spin 1s linear infinite" }}
          />
          <p style={{ fontSize: "14px", color: "#718096" }}>
            Loading prospect...
          </p>
        </div>
      </Layout>
    );
  }

  if (prospectError || (!prospectId && !prospect)) {
    return (
      <Layout>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "calc(100vh - 120px)",
            flexDirection: "column",
            gap: "12px",
            padding: "24px",
          }}
        >
          <AlertCircle size={48} style={{ color: "#e53e3e" }} />
          <p style={{ fontSize: "16px", color: "#141414", fontWeight: 500 }}>
            {prospectError || "No prospect selected"}
          </p>
          <button
            onClick={() => router.push("/crm/prospects")}
            style={{
              padding: "8px 16px",
              backgroundColor: "#006162",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Back to prospects
          </button>
        </div>
      </Layout>
    );
  }

  if (!prospect) {
    return null;
  }

  return (
    <>
      <style>
        {`
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;
            
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }

          ::-webkit-scrollbar-track {
            background: #f7fafc;
          }

          ::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 4px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
          }

          .sidebar-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .sidebar-scrollbar::-webkit-scrollbar-track {
            background: #f7fafc;
          }
          .sidebar-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 4px;
          }
          .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
          }
        `}
      </style>

      <div
        style={{
          display: "flex",
          width: "100%",
          height: "calc(100vh - 60px)",
          overflow: "hidden",
          backgroundColor: "transparent",
        }}
      >
        {/* Left Sidebar - Contact Info */}
        {renderLeftSidebar()}

        {/* Main Content - Tabs */}
        {renderMainContent()}

        {/* Right Sidebar - Associated Records */}
        {renderRightSidebar()}
      </div>

      <DeviceSelectionModal
        show={showDeviceSelectionModal}
        onHide={() => {
          setShowDeviceSelectionModal(false);
          setAvailableDevices([]);
          setPendingDialedNumber("");
        }}
        devices={availableDevices}
        onSelectDevice={handleDeviceSelect}
        extensionNumber={ctiUserAddress ?? ""}
        userAddress={ctiUserAddress}
      />
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setProspectToDelete(null);
        }}
        onConfirm={confirmDeleteProspect}
        itemName={prospectToDelete?.name}
        itemType="prospect"
      />
      <SuccessfulModal
        show={showSuccessfulModal}
        onHide={() => setShowSuccessfulModal(false)}
        title={successModalTitle}
        description={successModalDescription}
      />
      {activityModals.modals}
      {renderEditContactSidebar()}
    </>
  );
};

ContactRecordPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ContactRecordPage;
