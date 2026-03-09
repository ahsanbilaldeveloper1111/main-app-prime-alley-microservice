import React, { useState, useCallback, useRef, useEffect, ReactElement } from "react";
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
} from "lucide-react";
import Layout from "@layout/index";
import { getLead, deleteLead, type LeadData } from "@utils/crm";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import CrmActivitiesPanel, {
  type CrmActivitiesPanelRef,
} from "@components/CrmActivitiesPanel";
import CrmIntelligenceTab from "@components/CrmIntelligenceTab";
import CrmAssociatedCompaniesCard from "@components/CrmAssociatedCompaniesCard";
import CrmProfileSection from "@components/CrmProfileSection";
import { useCrmActivityModals } from "@hooks/useCrmActivityModals";
import CreateLeadModal from "@components/CreateLeadModal";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import { toast } from "react-toastify";
import { GetHierarchyData } from "@utils/users";
import { ModuleSlug } from "@utils/Helper";

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

// Add this function to toggle activity expansion

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ContactRecordPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id: leadId } = (router.query as { id?: string }) ?? {};
  const [lead, setLead] = useState<LeadData | null>(null);
  const [leadLoading, setLeadLoading] = useState(true);
  const [leadError, setLeadError] = useState<string | null>(null);
  const { hasPermission } = usePermissions();
  const canSendWhatsApp = hasPermission(
    HEADER_CONSTANTS.PERMISSIONS.SEND_WHATSAPP_MESSAGE_CRM,
  );

  const [activeTab, setActiveTab] = useState("about");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(),
  );
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showMoreActivities, setShowMoreActivities] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [tasksRefetch, setTasksRefetch] = useState<(() => void) | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreActivitiesRef = useRef<HTMLDivElement>(null);
  const activitiesPanelRef = useRef<CrmActivitiesPanelRef>(null);

  // Edit Lead sidebar (same CreateLeadModal as list page)
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [editLeadIdForSidebar, setEditLeadIdForSidebar] = useState<
    number | null
  >(null);

  // Delete Lead modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<{
    id: number;
    name?: string;
  } | null>(null);

  // Success modal (reuse common SuccessfulModal)
  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");

  // Export single lead (CSV)
  const [exporting, setExporting] = useState(false);
  const [extensions, setExtensions] = useState<any[]>([]);

  // Fetch lead detail by ID from URL (same pattern as prospect detail page)
  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    if (leadId == null || leadId === "") {
      setLeadLoading(false);
      setLead(null);
      setLeadError(null);
      return;
    }
    const id = Number(leadId);
    if (Number.isNaN(id)) {
      setLeadError("Invalid lead ID");
      setLeadLoading(false);
      setLead(null);
      return;
    }
    setLeadLoading(true);
    setLeadError(null);
    getLead(id)
      .then((data: LeadData) => {
        setLead(data);
        setLeadError(null);
      })
      .catch(() => {
        setLead(null);
        setLeadError("Failed to load lead");
      })
      .finally(() => {
        setLeadLoading(false);
      });
  }, [router.isReady, leadId]);

  // Load extensions (owners/associates) for friendly "Associate with" name
  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_LEADS);
        if (hierarchyData?.extensions) {
          setExtensions(hierarchyData.extensions);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch extensions:", error);
      }
    };

    void fetchExtensions();
  }, []);

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

  // Normalize lead for CrmActivitiesPanel (panel expects record.data / record.audit_trail)
  const leadRecord = lead
    ? {
        data: {
          id: lead.id,
          name: lead.name,
          phone: (lead as any).phone ?? lead.company_contact ?? null,
          data: lead.campaign_field_values ?? {},
        },
        audit_trail: lead.audit_trail,
      }
    : null;

  const leadRecordId = Number(leadId) || lead?.id || 0;
  const leadRecordName = lead?.name ?? leadRecord?.data?.name ?? "Lead";
  const leadRecordEmail =
    (lead as any)?.contact_persons?.[0]?.email ??
    (lead as any)?.crm_data?.data?.email ??
    "";

  const leadRecordPhone =
    (lead as any)?.contact_persons?.[0]?.phone ??
    (lead as any)?.crm_data?.phone ??
    lead?.company_contact ??
    "";

  const activityModals = useCrmActivityModals({
    recordType: "lead",
    recordId: leadRecordId,
    recordName: leadRecordName,
    recordEmail: leadRecordEmail,
    recordPhone: leadRecordPhone,
    onTaskCreated: () => tasksRefetch?.(),
    onNoteCreated: () => activitiesPanelRef.current?.refetchNotes?.(),
    onEmailSent: () => activitiesPanelRef.current?.refetchEmails?.(),
    onMeetingScheduled: () => activitiesPanelRef.current?.refetchMeetings?.(),
  });

  const handleOpenEditLead = useCallback(() => {
    if (!leadRecordId) return;
    setEditLeadIdForSidebar(leadRecordId);
    setShowCreateLeadModal(true);
  }, [leadRecordId]);

  const handleOpenDeleteLead = useCallback(() => {
    if (!leadRecordId) return;
    setLeadToDelete({ id: leadRecordId, name: leadRecordName });
    setShowDeleteModal(true);
  }, [leadRecordId, leadRecordName]);

  const confirmDeleteLead = useCallback(async () => {
    if (!leadToDelete) return;

    try {
      await deleteLead(leadToDelete.id);
      setShowDeleteModal(false);
      setLeadToDelete(null);
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Lead Deleted");
      setSuccessModalDescription("Lead has been deleted successfully");
      router.push("/crm/leads");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete lead:", error);
      toast.error("Failed to delete lead");
    }
  }, [leadToDelete, router]);

  const handleLeadsExport = useCallback(async () => {
    if (!lead) return;
    const name = `lead_${lead.id}.csv`;
    const ext = name.endsWith(".csv") ? "" : ".csv";
    setExporting(true);
    try {
      const row = lead as any;
      const headers = Object.keys(row).filter(
        (k) =>
          !["campaign", "stage", "contact_persons", "audit_trail"].includes(k) &&
          typeof row[k] !== "object",
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
      toast.success("Exported lead successfully!");
    } catch (err) {
      toast.error("Failed to export lead");
    } finally {
      setExporting(false);
    }
  }, [lead]);

  const handleOpenExport = useCallback(() => {
    if (!lead) return;
    // Directly export the currently opened lead
    void handleLeadsExport();
  }, [lead, handleLeadsExport]);

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

  // Key Information Fields – values from lead API response (same pattern as prospects)
  const primaryContact = (lead as any)?.contact_persons?.[0] ?? null;
  const primaryPhoneCountryCode = primaryContact?.phone_country_code || "";
  const primaryPhoneNumber = primaryContact?.phone || "";
  const formattedPhoneNumber =
    primaryPhoneCountryCode && primaryPhoneNumber
      ? `${primaryPhoneCountryCode} ${primaryPhoneNumber}`
      : primaryPhoneNumber ||
        (lead as any)?.crm_data?.phone ||
        lead?.company_contact ||
        "--";

  const associateName = (() => {
    const rawAssociate =
      (lead as any)?.user_extension ??
      (lead as any)?.created_by ??
      (lead as any)?.owner_id ??
      null;

    if (rawAssociate != null) {
      const match = extensions.find(
        (ext: any) =>
          String(ext.id) === String(rawAssociate) ||
          String(ext.extension) === String(rawAssociate),
      );
      if (match) {
        return match.display_name || match.name || String(rawAssociate);
      }
      return String(rawAssociate);
    }

    return (
      (lead as any)?.created_by_name ||
      (lead as any)?.owner_name ||
      (lead as any)?.user_extension_name ||
      "--"
    );
  })();

  const keyInfoFields: KeyInfoField[] = [
    {
      label: "Email",
      value:
        primaryContact?.email ??
        (lead as any)?.crm_data?.data?.email ??
        "--",
      copyable: true,
    },
    {
      label: "Phone Number",
      value: formattedPhoneNumber,
      copyable: true,
    },
    { label: "Company Name", value: lead?.company_name ?? "--" },
    { label: "Lead Status", value: lead?.status ?? "--" },
    {
      label: "Lifecycle Stage",
      value:
        (lead as any)?.crm_data?.data?.lifecycle_stage ??
        lead?.stage?.name ??
        "--",
    },
    {
      label: "Owner",
      value: associateName,
    },
    { label: "Source", value: (lead as any)?.source ?? "--" },
  ];

  // Intelligence tab is now a shared component (CrmIntelligenceTab)

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
                  <FileText size={18} color="#7c98b6" />
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
            Leads
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
                {["Edit", "Delete", "Clone", "Export"].map((action) => (
                  <button
                    key={action}
            onClick={() => {
              setShowActionsDropdown(false);
              if (action === "Edit") {
                handleOpenEditLead();
              } else if (action === "Delete") {
                handleOpenDeleteLead();
              } else if (action === "Export") {
                handleOpenExport();
              }
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
              {lead?.name
                ? (lead.name.match(/\b\w/g) ?? [])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : "—"}
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
                {lead?.name ?? "—"}
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "#718096",
                  margin: "0 0 8px 0",
                  lineHeight: "1.4",
                }}
              >
                {lead?.company_name ? `at ${lead.company_name}` : "—"}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {((lead as any)?.contact_persons?.[0]?.email ??
                (lead as any)?.crm_data?.data?.email) ? (
                  <>
                    <a
                      href={`mailto:${(lead as any)?.contact_persons?.[0]?.email ?? (lead as any)?.crm_data?.data?.email}`}
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
                      {(lead as any)?.contact_persons?.[0]?.email ??
                        (lead as any)?.crm_data?.data?.email}
                    </a>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          (lead as any)?.contact_persons?.[0]?.email ??
                            (lead as any)?.crm_data?.data?.email ??
                            "",
                        )
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
                    <button
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: "4px",
                        cursor: "pointer",
                        color: "#718096",
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="Link"
                    >
                      <Link2 size={14} />
                    </button>
                  </>
                ) : (
                  <span style={{ fontSize: "14px", color: "#718096" }}>—</span>
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
            { icon: Phone, label: "Call", disabled: true, onClick: undefined },
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
                  { label: "Message", onClick: activityModals.openSms },
                  { label: "Task", onClick: activityModals.openTask },
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

      {/* <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #cccccc',
              borderRadius: '10px',
            }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  borderBottom: collapsedSections.has('enrollments') ? 'none' : '1px solid #eaf0f6',
                }}
                onClick={() => toggleSection('enrollments')}
              >
                <ChevronDown
                  size={18}
                  style={{
                    color: '#141414',
                    marginRight: '10px',
                    transform: collapsedSections.has('enrollments') ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#141414',
                  margin: 0,
                }}>
                  Enrollments
                </h3>
              </div>

              {!collapsedSections.has('enrollments') && (
                <div style={{ padding: '20px' }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#141414',
                    marginBottom: '12px',
                  }}>
                    Communication subscriptions
                  </h4>
                  <p style={{
                    fontSize: '14px',
                    color: '#666666',
                    marginBottom: '12px',
                  }}>
                    Ahmad Hussain has not specified any preferences.
                  </p>
                  <a
                    href="#"
                    style={{
                      fontSize: '14px',
                      color: '#006162',
                      textDecoration: 'none',
                      fontWeight: '500',
                    }}
                  >
                    View subscriptions
                  </a>
                </div>
              )}
            </div> */}

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
                  {field.copyable && field.value !== "--" && (
                    <button
                      onClick={() => copyToClipboard(field.value ?? "")}
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
      <div style={{ padding: "14px 0", flex: 1 }}>
        {activeTab === "about" && (
          <>
            {/* Record Summary */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #cccccc",
                borderRadius: "10px",
                marginBottom: "20px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  cursor: "pointer",
                  borderBottom: collapsedSections.has("breeze")
                    ? "none"
                    : "1px solid #eaf0f6",
                }}
                onClick={() => toggleSection("breeze")}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <ChevronDown
                    size={18}
                    style={{
                      color: "#141414",
                      transform: collapsedSections.has("breeze")
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
                    Record summary
                  </h3>
                  <div
                    style={{
                      padding: "3px 10px",
                      background:
                        "linear-gradient(114deg, rgb(255, 56, 66) 0%, rgb(210, 6, 136) 100%)",
                      color: "white",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "600",
                      textTransform: "uppercase",
                    }}
                  >
                    AI
                  </div>
                </div>
              </div>

              {!collapsedSections.has("breeze") && (
                <div style={{ padding: "20px" }}>
                  {(lead as any)?.crm_summary?.summary != null && (
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "13px",
                          color: "#141414",
                          marginBottom: "12px",
                        }}
                      >
                        {lead?.updated_at && (
                          <span>
                            Updated{" "}
                            {new Date(lead.updated_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        )}
                        <button
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: "2px",
                            cursor: "pointer",
                            color: "#141414",
                            display: "flex",
                            alignItems: "center",
                          }}
                          title="Refresh"
                        >
                          <RefreshCw size={12} />
                        </button>
                      </div>

                      <div
                        style={{
                          fontSize: "14px",
                          color: "#141414",
                          lineHeight: "1.6",
                          marginBottom: "16px",
                          border: "1px solid #ff9fcc",
                          padding: "18px 20px",
                          borderRadius: "10px",
                        }}
                      >
                        {(lead as any)?.crm_summary?.summary}
                      </div>
                    </>
                  )}
                  {(lead as any)?.crm_summary?.summary == null && (
                    <div style={{ fontSize: "14px", color: "#718096" }}>
                      No summary available.
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      paddingTop: "12px",
                      borderTop: "1px solid #fee",
                    }}
                  >
                    <button
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: "6px",
                        cursor: "pointer",
                        color: "#141414",
                        display: "flex",
                        alignItems: "center",
                        borderRadius: "3px",
                      }}
                      title="Good summary"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f7fafc";
                        e.currentTarget.style.color = "#2d3748";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#141414";
                      }}
                    >
                      <ThumbsUp size={16} />
                    </button>
                    <button
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: "6px",
                        cursor: "pointer",
                        color: "#141414",
                        display: "flex",
                        alignItems: "center",
                        borderRadius: "3px",
                      }}
                      title="Bad summary"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f7fafc";
                        e.currentTarget.style.color = "#2d3748";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#141414";
                      }}
                    >
                      <ThumbsDown size={16} />
                    </button>
                    <button
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: "6px",
                        cursor: "pointer",
                        color: "#141414",
                        display: "flex",
                        alignItems: "center",
                        borderRadius: "3px",
                      }}
                      title="Copy"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f7fafc";
                        e.currentTarget.style.color = "#2d3748";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#141414";
                      }}
                    >
                      <Copy size={16} />
                    </button>
                  </div>

                  <button
                    style={{
                      marginTop: "16px",
                      padding: "6px 16px",
                      backgroundColor: "transparent",
                      border: "1px solid #d20688",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#d20688",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#fff5f7";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <Sparkles size={16} />
                    Ask a question
                  </button>
                </div>
              )}
            </div>

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
                      (lead as any)?.company?.enrichment_data?.structured_data
                        ?.official_company_name ?? lead?.company_name ?? "--",
                  },
                  {
                    label: "Street address",
                    value:
                      (lead as any)?.company?.enrichment_data?.structured_data
                        ?.headquarters?.address ??
                      (lead as any)?.crm_data?.data?.street_address ??
                      lead?.campaign_field_values?.street_address ??
                      "--",
                  },
                  {
                    label: "City",
                    value:
                      (lead as any)?.company?.enrichment_data?.structured_data
                        ?.headquarters?.city ??
                      (lead as any)?.crm_data?.data?.city ??
                      lead?.campaign_field_values?.city ??
                      "--",
                  },
                  {
                    label: "Postal code",
                    value:
                      (lead as any)?.crm_data?.data?.postal_code ??
                      lead?.campaign_field_values?.postal_code ??
                      "--",
                  },
                  {
                    label: "State/Region",
                    value:
                      (lead as any)?.crm_data?.data?.state ??
                      lead?.campaign_field_values?.state ??
                      "--",
                  },
                  {
                    label: "Email",
                    value:
                      (lead as any)?.company?.enrichment_data?.structured_data
                        ?.emails?.[0]?.email ??
                      (lead as any)?.contact_persons?.[0]?.email ??
                      (lead as any)?.crm_data?.data?.email ??
                      "--",
                    link: true,
                  },
                ]}
              />
            </div>
          </>
        )}

        {activeTab === "activities" && (
          <CrmActivitiesPanel
            ref={activitiesPanelRef}
            recordType="lead"
            recordId={leadRecordId}
            record={leadRecord}
            recordLoading={leadLoading}
            recordName={leadRecordName}
            canSendWhatsApp={canSendWhatsApp}
            onTasksRefetchReady={(fn) => setTasksRefetch(() => fn)}
            {...activityModals.crmActivitiesPanelProps}
          />
        )}

        {activeTab === "intelligence" && (
          <CrmIntelligenceTab
            company={(lead as any)?.company ?? null}
            relatedCompany={lead?.company_name ?? "—"}
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
              const company = (lead as any)?.company ?? null;
              const struct = company?.enrichment_data?.structured_data ?? null;
              const companyName =
                struct?.official_company_name ??
                company?.name ??
                lead?.company_name ??
                null;
              const primaryPhone =
                struct?.phones?.[0]?.number ??
                company?.phone ??
                lead?.company_contact ??
                null;
              const phones =
                struct?.phones?.map((p: any) => ({
                  number: p?.number ?? "",
                  type: p?.type ?? null,
                })) ?? undefined;
              return (
                <CrmAssociatedCompaniesCard
                  sectionId="companies"
                  collapsedSections={collapsedSections}
                  toggleSection={toggleSection}
                  companyName={companyName}
                  primaryPhone={primaryPhone}
                  phones={phones}
                />
              );
            })()}

            {/* Deals - from (lead as any).deals if API returns them */}
            {(() => {
              const allDeals = (lead as any)?.deals ?? [];
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#141414",
                        fontSize: "20px",
                        padding: "6px",
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
                      <span style={{ fontSize: "14px", fontWeight: "300" }}>
                        +
                      </span>{" "}
                      <span style={{ fontSize: "12px", fontWeight: "500" }}>
                        Add
                      </span>
                    </button>
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
          </div>
        </div>
      )}
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (leadLoading) {
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
          <p style={{ fontSize: "14px", color: "#718096" }}>Loading lead...</p>
        </div>
      </Layout>
    );
  }

  if (leadError || (leadId == null && !lead)) {
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
            {leadError || "No lead selected"}
          </p>
          <button
            onClick={() => router.push("/crm/leads")}
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
            Back to leads
          </button>
        </div>
      </Layout>
    );
  }

  if (!lead) {
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

      {activityModals.modals}

      {/* Delete Lead Modal (same as list page) */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setLeadToDelete(null);
        }}
        onConfirm={confirmDeleteLead}
        itemName={leadToDelete?.name}
        itemType="lead"
      />

      {/* Success Modal for delete and other lead actions */}
      <SuccessfulModal
        show={showSuccessfulModal}
        onHide={() => setShowSuccessfulModal(false)}
        title={successModalTitle}
        description={successModalDescription}
      />

      {/* Edit Lead sidebar (CreateLeadModal in edit mode) */}
      <CreateLeadModal
        show={showCreateLeadModal}
        onHide={() => {
          setShowCreateLeadModal(false);
          setEditLeadIdForSidebar(null);
        }}
        onSuccess={async () => {
          setShowCreateLeadModal(false);
          setEditLeadIdForSidebar(null);
          if (leadRecordId) {
            try {
              const data = await getLead(leadRecordId);
              setLead(data);
            } catch {
              // ignore refresh errors
            }
          }
        }}
        type="lead"
        editLeadId={editLeadIdForSidebar}
      />
    </>
  );
};

ContactRecordPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ContactRecordPage;
