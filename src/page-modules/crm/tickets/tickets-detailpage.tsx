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
    Ticket,
    Search,
    AlertCircle,
  } from "lucide-react";
  import { parsePhoneNumber as parsePhoneNumberInput } from "react-phone-number-input";
  import Layout from "@layout/index";
  import {
    getAllCrmDataById,
    CRM_CAMPAIGNS_LIST_ACTIVE_ONLY,
    getCampaigns,
    getCrmDataTags,
    updateCrmData,
    deleteCrmData,
    type CrmDataItem,
  } from "@utils/crm";
  import { ModuleSlug } from "@utils/Helper";
  import moment from "moment-timezone";
  import { usePermissions } from "@utils/permissionUtils";
  import { HEADER_CONSTANTS } from "@constants/headerConstants";
  import CrmActivitiesPanel, {
    type CrmActivitiesPanelRef,
  } from "@components/CrmActivitiesPanel";
  import CrmAssociatedCompaniesCard from "@components/CrmAssociatedCompaniesCard";
  import ProspectEditSidebar, {
    type ProspectFormState as ProspectSidebarFormState,
  } from "@components/ProspectEditSidebar";
  import { useCrmActivityModals } from "@hooks/useCrmActivityModals";
  import { useCti } from "@hooks/useCti";
  import DeviceSelectionModal from "@components/DeviceSelectionModal";
  import { toast } from "react-toastify";
  import { GetHierarchyData } from "@utils/users";
  import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
  import SuccessfulModal from "@components/page-partials/SuccessfulModal";
  import { createNonPrngId } from "@utils/id";
  
  // ============================================================================
  // TYPE DEFINITIONS
  // ============================================================================

  type NextPageWithLayout = React.FC & {
    getLayout?: (page: ReactElement) => ReactElement;
  };

  const GearButton = () => (
    <button
      type="button"
      className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
      style={{ width: "28px", height: "28px", padding: 0 }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </button>
  );

  const AddButton = () => (
    <button
      type="button"
      className="btn btn-sm btn-link text-decoration-none d-flex align-items-center gap-1 p-0"
    >
      <span className="fs-5 lh-1">+</span>
      <span>Add</span>
    </button>
  );

  const AssociatedCard = ({ title, items }: { title: string; items: any[] }) => (
    <div className="bg-white border rounded mb-3 overflow-hidden" style={{ borderColor: "#e2e8f0" }}>
      <div className="d-flex align-items-center justify-content-between px-4 py-3">
        <h6 className="mb-0 fw-semibold">{title}</h6>
        <div className="d-flex align-items-center gap-2">
          <AddButton />
          <GearButton />
        </div>
      </div>
      <p className="mb-0 px-4 pb-3 text-muted small">
        {items.length === 0
          ? "No associated objects of this type exist or you don’t have permission to view them."
          : null}
      </p>
    </div>
  );

  const ActivitiesToolbar = ({
    filterLabel = "All time so far",
    activityLabel = "Activity (5/9)",
  }: {
    filterLabel?: string;
    activityLabel?: string;
  }) => (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              border: "1px solid #cbd5e0",
              borderRadius: "5px",
              padding: "6px 10px",
              backgroundColor: "#ffffff",
              minWidth: "160px",
            }}
          >
            <Search size={14} color="#718096" />
            <input
              placeholder="Search activities"
              style={{
                border: "none",
                outline: "none",
                fontSize: "13px",
                color: "#141414",
                backgroundColor: "transparent",
                width: "100%",
              }}
            />
          </div>

          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              border: "1px solid #cbd5e0",
              borderRadius: "5px",
              padding: "6px 12px",
              backgroundColor: "#ffffff",
              fontSize: "13px",
              color: "#141414",
              cursor: "pointer",
            }}
          >
            Add activities
            <ChevronDown size={13} />
          </button>
        </div>

        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            backgroundColor: "transparent",
            border: "none",
            fontSize: "13px",
            color: "#141414",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          Collapse all
          <ChevronDown size={13} />
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            border: "1px solid #cbd5e0",
            borderRadius: "5px",
            padding: "4px 10px",
            backgroundColor: "#ffffff",
            fontSize: "13px",
            color: "#141414",
            cursor: "pointer",
          }}
        >
          {filterLabel}
          <ChevronDown size={12} />
        </button>

        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            border: "1px solid #cbd5e0",
            borderRadius: "5px",
            padding: "4px 10px",
            backgroundColor: "#edf2f7",
            fontSize: "13px",
            color: "#141414",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          {activityLabel}
          <ChevronDown size={12} />
          <X size={12} />
        </button>
      </div>
    </>
  );

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
  
    const [activeTab, setActiveTab] = useState("overview");
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
    const [extensions, setExtensions] = useState<any[]>([]);
    const [prospectForm, setProspectForm] = useState<ProspectSidebarFormState>({
      firstName: "",
      lastName: "",
      email: "",
      phone_country_code: "",
      phoneNumber: "",
      campaign_id: null,
      campaign_name: null,
      campaign_status: null,
      contact_owner: null,
      lifecycle_stage: "Lead",
      disposition: "",
      legal_basis: [],
      company_domain: "",
      scheduled_call_at: "",
      tags: [],
      note: "",
      source_file: "",
      custom_fields: [],
    });
    // Edit Prospect Sidebar States
    const [showEditContactSidebar, setShowEditContactSidebar] = useState(false);
    const [editContactLoading, setEditContactLoading] = useState(false);
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
    const prospectRecordName = prospect?.data?.name ?? `Ticket ${prospectRecordId || ""}`.trim();
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
        try {
          const result = await ctiDialNumber(numberToDial);
          if (result?.error) {
            toast.error(result.error);
          }
        } catch {
          toast.error("Failed to make call");
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

    const handleWhatsAppChatClick = useCallback(
      (chat: { id: string | number }) => {
        router.push(`/crm/inbox?chat_id=${chat.id}`);
      },
      [router],
    );
  
    const handleProspectExport = useCallback(async () => {
      if (!prospect?.data) return;
      const id = prospect.data.id ?? prospectRecordId;
      const name = `ticket_${id}.csv`;
      const ext = name.endsWith(".csv") ? "" : ".csv";
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
              const s = String(val).replaceAll('"', '""');
              return s.includes(",") || s.includes('"') ? `"${s}"` : s;
            })
            .join(","),
        ];
        const blob = new Blob([csvRows.join("\n")], {
          type: "text/csv;charset=utf-8;",
        });
        const url = globalThis.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name + ext;
        a.click();
        globalThis.URL.revokeObjectURL(url);
        toast.success("Exported ticket successfully!");
      } catch (err) {
        console.error("Export ticket error:", err);
        toast.error("Failed to export ticket");
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
        setSuccessModalTitle("Ticket Deleted");
        setSuccessModalDescription("Ticket has been deleted successfully");
        router.push("/crm-tickets");
      } catch (error: any) {
        console.error("Delete ticket error:", error);
        toast.error("Failed to delete ticket");
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
        setProspectError("Invalid ticket ID");
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
          setProspectError("Failed to load ticket");
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
    const validTabIds = new Set(["overview", "activities"]);
    useEffect(() => {
      if (!router.isReady) return;
      const section = router.query.section;
      const tabId =
        typeof section === "string" ? section.toLowerCase().trim() : null;
      if (tabId && validTabIds.has(tabId)) {
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
  
      const rawTags = item.tags ?? item?.data?.tags ?? d.tags ?? [];
      const tagsArray: Array<{ value: string; label: string; id: number }> = Array.isArray(rawTags)
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
          const normalized = item.phone.replaceAll(/\s/g, "");
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
  
      const normalizeCustomFieldValue = (value: unknown): string => {
        if (value == null) return "";
        if (Array.isArray(value)) {
          return value
            .map((v) => normalizeCustomFieldValue(v))
            .map((v) => v.trim())
            .filter(Boolean)
            .join(", ");
        }
        if (value instanceof Date) return value.toISOString();
        if (typeof value === "string") return value;
        if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return `${value}`;
        if (typeof value === "object") {
          try {
            return JSON.stringify(value);
          } catch {
            return "";
          }
        }
        return "";
      };

      const customFieldsArray =
        d && typeof d === "object"
          ? Object.entries(d)
              .filter(([k]) => !reservedDataKeys.has(k))
              .map(([field_name, field_value]) => ({
                id: createNonPrngId(field_name),
                field_name,
                field_value: normalizeCustomFieldValue(field_value).trim(),
              }))
              .filter((f) => f.field_name || f.field_value)
          : [];
  
      setProspectForm({
        firstName,
        lastName,
        email: d.email ?? item.email ?? "",
        phone_country_code: phoneCountryCode,
        phoneNumber,
        campaign_id: item.campaign_id ?? d.campaign_id ?? null,
        campaign_name: item.campaign_name ?? d.campaign_name ?? null,
        campaign_status: item.campaign_status ?? d.campaign_status ?? null,
        contact_owner:
          item.user_extension ??
          d.contact_owner ??
          item.contact_owner ??
          null,
        lifecycle_stage: d.lifecycle_stage ?? "",
        disposition: d.disposition ?? item.disposition ?? "",
        legal_basis: Array.isArray(d.legal_basis) ? d.legal_basis : [],
        company_domain:
          item.company_domain ?? d.company_domain ?? "",
        scheduled_call_at: toDatetimeLocal(
          item.scheduled_call_at ?? d.scheduled_call_at,
        ),
        tags: tagsArray,
        note: item.note ?? d.note ?? "",
        source_file:
          item.source_file ??
          d.source ??
          item.source ??
          "",
        custom_fields: customFieldsArray,
      });
    }, [showEditContactSidebar, prospect]);
  
    // Load available campaigns
    useEffect(() => {
      const loadCampaigns = async () => {
        try {
          const campaignsResponse = await getCampaigns({
            per_page: 1000,
            filters: CRM_CAMPAIGNS_LIST_ACTIVE_ONLY,
          });
          const campaignOptions = campaignsResponse.data.map((campaign: any) => ({
            value: campaign.id.toString(),
            label: campaign.name,
            id: campaign.id,
          }));
          setAvailableCampaigns(campaignOptions);
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
              id: Number.parseInt(tag.value.replace("tag-", ""), 10) || 0,
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
      { id: "overview", label: "Overview" },
      { id: "activities", label: "Activities" },
    ];
  
    // Key Information Fields (from prospect + tickets/leads)
    const firstTicket = prospect?.data?.tickets?.[0];
    const keyInfoFields = [
      {
        label: "Requester email",
        value: prospect?.data?.data?.email ?? "--",
        copyable: true,
      },
      {
        label: "Phone Number",
        value: prospect?.data?.phone ?? "--",
        copyable: true,
      },
      {
        label: "Company",
        value:
          firstTicket?.company_name ??
          prospect?.data?.company_name ??
          prospect?.data?.name ??
          "--",
      },
      // {
      //   label: "Lifecycle Stage",
      //   value:
      //     prospect?.data?.lifecycle_stage ??
      //     prospect?.data?.data?.lifecycle_stage ??
      //     "--",
      // },
      {
        label: "Ticket owner",
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
  
    // ============================================================================
    // LEFT SIDEBAR (Contact Info)
    // ============================================================================
  
    const handleUpdateContactSubmit = async (data: any) => {
      const name = [data.firstName, data.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      if(data.id == null) {
        toast.error("Ticket not found");
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
          source: data.source_file?.trim() || undefined,
          scheduled_call_at: data.scheduled_call_at || undefined,
          data: dataPayload,
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
        prospectForm?.lastName?.trim();
  
      return (
        <ProspectEditSidebar
          isOpen={showEditContactSidebar}
          title="Edit Ticket"
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
              onClick={() => router.back()}
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
              Tickets
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
                          handleProspectExport();
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
                  {prospect?.data?.name ?? (prospectRecordId ? `Ticket #${prospectRecordId}` : "Unknown ticket")}
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
                    : "Ticket"}
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
                  key={action.label}
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
          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              cursor: "pointer",
              backgroundColor: "#ffffff",
              width: "100%",
              border: "none",
              textAlign: "left",
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
              type="button"
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
          </button>
  
          {!collapsedSections.has("key-info") && (
            <div style={{ padding: "20px" }}>
              {keyInfoFields.map((field) => (
                <div key={field.label} style={{ marginBottom: "16px" }}>
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
  
    const renderMainContent = () => {
      const ticketCreateDate = prospect?.data?.created_at ?? (prospect as any)?.created_at ?? null;
      const ticketStatus = (prospect as any)?.data?.status ?? (prospect as any)?.status ?? "New (Support Pipeline)";
      const lastActivityDate =
        (prospect as any)?.data?.last_activity_date ??
        (prospect as any)?.last_activity_date ??
        null;

      const formatDisplayDate = (d: string | null | undefined) => {
        if (!d) return "--";
        return new Date(d).toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        });
      };

      const recentActivities: Array<{
        icon: string;
        label: string;
        date: string;
        description: string;
        rawDate: string | null;
      }> = [];

      if (ticketCreateDate) {
        recentActivities.push({
          icon: "ticket",
          label: "Created",
          date: formatDisplayDate(ticketCreateDate),
          description: "This ticket was created",
          rawDate: ticketCreateDate,
        });
      }

      const groupedActivities: Record<string, typeof recentActivities> = {};
      recentActivities.forEach((activity) => {
        const month = activity.rawDate
          ? new Date(activity.rawDate).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })
          : "Unknown";
        if (!groupedActivities[month]) groupedActivities[month] = [];
        groupedActivities[month].push(activity);
      });

      const associatedContacts: any[] = [];
      const associatedCompanies: any[] = (prospect as any)?.data?.company ? [(prospect as any).data.company] : [];
      const associatedDeals = prospect?.data?.tickets?.flatMap((t: any) => t.deals ?? []) ?? [];
      const associatedTickets: any[] = prospect?.data?.tickets ?? [];
      const associatedSubscriptions: any[] = [];
      const associatedPayments: any[] = [];
      const associatedProjects: any[] = [];

      return (
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
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
                  borderRight: index < tabs.length - 1 ? "1px solid #cbd5e0" : "none",
                  borderBottom: activeTab === tab.id ? "1px solid #ffffff" : "1px solid #cbd5e0",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: activeTab === tab.id ? "600" : "400",
                  color: "#141414",
                  transition: "all 0.2s",
                  textAlign: "center",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#eaf0f6";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f5f8fa";
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: "14px 20px", flex: 1 }}>
            {activeTab === "overview" && (
              <>
                <div className="bg-white border rounded mb-3 overflow-hidden" style={{ borderColor: "#e2e8f0" }}>
                  <div
                    className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom"
                    style={{ borderColor: "#e2e8f0" }}
                  >
                    <span className="fw-semibold">Data highlights</span>
                    <GearButton />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      padding: "16px 20px",
                      gap: "16px",
                    }}
                  >
                    {[
                      {
                        label: "CREATE DATE",
                        value: ticketCreateDate ? formatDisplayDate(ticketCreateDate) : "--",
                      },
                      {
                        label: "TICKET STATUS",
                        value: ticketStatus,
                      },
                      {
                        label: "LAST ACTIVITY DATE",
                        value: lastActivityDate ? formatDisplayDate(lastActivityDate) : "--",
                      },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ textAlign: "center" }}>
                        <p
                          style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            letterSpacing: "0.06em",
                            color: "#718096",
                            margin: "0 0 6px 0",
                            textTransform: "uppercase",
                          }}
                        >
                          {label}
                        </p>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#141414",
                            margin: 0,
                            fontWeight: "400",
                          }}
                        >
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border rounded mb-3 overflow-hidden" style={{ borderColor: "#e2e8f0" }}>
                  <div
                    style={{
                      padding: "16px 20px",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    <p className="fw-semibold mb-3">Recent activities</p>

                    <ActivitiesToolbar
                      filterLabel="All time so far"
                      activityLabel="Activity (5/9)"
                    />
                  </div>

                  <div style={{ padding: "16px 20px" }}>
                    {recentActivities.length === 0 ? (
                      <p style={{ fontSize: "13px", color: "#718096", margin: 0 }}>
                        No recent activities.
                      </p>
                    ) : (
                      Object.entries(groupedActivities).map(([monthLabel, activities]) => (
                        <div key={monthLabel}>
                          <p
                            style={{
                              fontSize: "13px",
                              fontWeight: "600",
                              color: "#141414",
                              marginBottom: "12px",
                            }}
                          >
                            {monthLabel}
                          </p>

                          {activities.map((activity) => (
                            <div
                              key={`${activity.label}-${activity.rawDate ?? activity.date}`}
                              style={{
                                display: "flex",
                                gap: "12px",
                                marginBottom: "12px",
                              }}
                            >
                              <div
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "4px",
                                  backgroundColor: "#edf2f7",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  marginTop: "2px",
                                }}
                              >
                                <Ticket size={14} color="#718096" />
                              </div>

                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "4px",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "13px",
                                      fontWeight: "600",
                                      color: "#141414",
                                    }}
                                  >
                                    {activity.label}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "12px",
                                      color: "#718096",
                                    }}
                                  >
                                    {activity.date}
                                  </span>
                                </div>

                                <div
                                  style={{
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "6px",
                                    padding: "10px 14px",
                                    backgroundColor: "#fafafa",
                                    fontSize: "13px",
                                    color: "#4a5568",
                                  }}
                                >
                                  {activity.description}
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    marginTop: "6px",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "8px",
                                      height: "8px",
                                      borderRadius: "50%",
                                      border: "1px solid #cbd5e0",
                                      backgroundColor: "#fff",
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <AssociatedCard title="Contacts" items={associatedContacts} />
                <AssociatedCard title="Companies" items={associatedCompanies} />
                <AssociatedCard title="Deals" items={associatedDeals} />
                <AssociatedCard title="Tickets" items={associatedTickets} />
                <AssociatedCard title="Subscriptions" items={associatedSubscriptions} />
                <AssociatedCard title="Payments" items={associatedPayments} />
                <AssociatedCard title="Projects" items={associatedProjects} />

                <div className="bg-white border rounded mb-3 overflow-hidden" style={{ borderColor: "#e2e8f0" }}>
                  <div
                    style={{
                      padding: "16px 20px",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    <p className="fw-semibold mb-3">Upcoming activities</p>

                    <ActivitiesToolbar
                      filterLabel="All upcoming"
                      activityLabel="Activity (5/9)"
                    />
                  </div>

                  <div
                    style={{
                      padding: "32px 20px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        backgroundColor: "#edf2f7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Search size={28} color="#a0aec0" />
                    </div>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#141414",
                        margin: 0,
                        textAlign: "center",
                      }}
                    >
                      No activities match the current filters.
                    </p>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#718096",
                        margin: 0,
                        textAlign: "center",
                      }}
                    >
                      Change filters to broaden your search.
                    </p>
                  </div>
                </div>

                <div className="bg-white border rounded mb-3 overflow-hidden" style={{ borderColor: "#e2e8f0" }}>
                  <div style={{ padding: "14px 20px" }}>
                    <span className="fw-semibold">Pinned activity</span>
                  </div>

                  <div
                    style={{
                      padding: "32px 20px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        backgroundColor: "#edf2f7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MessageSquare size={28} color="#a0aec0" />
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#718096",
                        margin: 0,
                        textAlign: "center",
                      }}
                    >
                      There is no pinned activity on this record.
                    </p>
                  </div>
                </div>
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
                onWhatsAppChatClick={handleWhatsAppChatClick}
                onTasksRefetchReady={(fn: () => void) => setTasksRefetch(() => fn)}
                {...activityModals.crmActivitiesPanelProps}
              />
            )}
          </div>
        </div>
      );
    };
  
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
                    <button
                      type="button"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 20px 0",
                        cursor: "pointer",
                        backgroundColor: "#ffffff",
                        width: "100%",
                        border: "none",
                        textAlign: "left",
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
                    </button>
  
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
                            <button
                              type="button"
                              onClick={() => {
                                const firstDeal = allDeals[0];
                                const id = firstDeal?.id;
                                const href = id
                                  ? `/crm/detailspage?type=deal&id=${encodeURIComponent(
                                      String(id),
                                    )}`
                                  : "/crm/deals";
                                globalThis.window?.open(href, "_blank", "noopener,noreferrer");
                              }}
                              style={{
                                fontSize: "13px",
                                color: "#006162",
                                textDecoration: "none",
                                fontWeight: "500",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "none",
                                border: "none",
                                padding: 0,
                                cursor: "pointer",
                              }}
                            >
                              View all associated Deals
                              <ExternalLink size={12} />
                            </button>
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
                    <button
                      type="button"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 20px 0",
                        cursor: "pointer",
                        backgroundColor: "#ffffff",
                        width: "100%",
                        border: "none",
                        textAlign: "left",
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
                    </button>
  
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
                            <button
                              type="button"
                              onClick={() => {
                                const firstLead = leads[0];
                                const id = firstLead?.id;
                                const href = id
                                  ? `/crm/detailspage?type=lead&id=${encodeURIComponent(
                                      String(id),
                                    )}`
                                  : "/crm/leads";
                                globalThis.window?.open(href, "_blank", "noopener,noreferrer");
                              }}
                              style={{
                                fontSize: "13px",
                                color: "#006162",
                                textDecoration: "none",
                                fontWeight: "500",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "none",
                                border: "none",
                                padding: 0,
                                cursor: "pointer",
                              }}
                            >
                              View all associated Leads
                              <ExternalLink size={12} />
                            </button>
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
              Loading ticket...
            </p>
          </div>
        </Layout>
      );
    }
  
    if (prospectError) {
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
              {prospectError}
            </p>
            <button
              onClick={() => router.push("/crm-tickets")}
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
              Back to tickets
            </button>
          </div>
        </Layout>
      );
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
          itemType="ticket"
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
  