import React, { useState, useRef, useEffect, ReactElement } from "react";
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
} from "lucide-react";
import Layout from "@layout/index";
import { getAllCrmDataById, type CrmDataItem } from "@utils/crm";
import { GlobalDateTimeFormat } from "@utils/Helper";
import moment from "moment-timezone";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import CrmActivitiesPanel from "@components/CrmActivitiesPanel";
import { useCrmActivityModals } from "@hooks/useCrmActivityModals";

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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreActivitiesRef = useRef<HTMLDivElement>(null);

  const prospectRecordId = Number(prospectId) || prospect?.data?.id || 0;
  const prospectRecordName = prospect?.data?.name ?? "Prospect";
  const prospectRecordEmail = prospect?.data?.data?.email ?? "";

  const activityModals = useCrmActivityModals({
    recordType: "prospect",
    recordId: prospectRecordId,
    recordName: prospectRecordName,
    recordEmail: prospectRecordEmail,
    recordPhone: prospect?.data?.phone ?? "",
  });

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
    {
      label: "Lead Status",
      value: firstTicket?.status ?? prospect?.data?.disposition ?? "--",
    },
    {
      label: "Lifecycle Stage",
      value: prospect?.data?.lifecycle_stage ?? "--",
    },
    { label: "Buying Role", value: prospect?.data?.buying_role ?? "--" },
    { label: "Contact owner", value: prospect?.data?.contact_owner ?? "--" },
  ];

  const renderIntelligenceTab = () => {
    return (
      <div>
        {/* Info Banner */}
        <div
          style={{
            padding: "16px 20px",
            backgroundColor: "#ffffff",
            border: "1px solid #eaf0f6",
            borderRadius: "5px",
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "#666",
              margin: 0,
            }}
          >
            HubSpot does not have enrichment data for this record, yet.
          </p>
        </div>

        {/* Contact Information Card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #eaf0f6",
            borderRadius: "5px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          {/* Single row: all fields + social icons */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "20px",
              flexWrap: "nowrap",
            }}
          >
            {/* Lifecycle stage */}
            <div style={{ flex: "1 1 auto", minWidth: "100px" }}>
              <div
                style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}
              >
                Lifecycle stage
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#141414",
                  fontWeight: "700",
                }}
              >
                Lead
              </div>
            </div>

            {/* Related company */}
            <div style={{ flex: "1 1 auto", minWidth: "100px" }}>
              <div
                style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}
              >
                Related company
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#141414",
                  fontWeight: "400",
                }}
              >
                --
              </div>
            </div>

            {/* Employment role */}
            <div style={{ flex: "1 1 auto", minWidth: "100px" }}>
              <div
                style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}
              >
                Employment role
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#141414",
                  fontWeight: "400",
                }}
              >
                --
              </div>
            </div>

            {/* City */}
            <div style={{ flex: "1 1 auto", minWidth: "60px" }}>
              <div
                style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}
              >
                City
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#141414",
                  fontWeight: "400",
                }}
              >
                {firstTicket?.company_city ?? "--"}
              </div>
            </div>

            {/* State */}
            <div style={{ flex: "1 1 auto", minWidth: "60px" }}>
              <div
                style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}
              >
                State
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#141414",
                  fontWeight: "400",
                }}
              >
                {firstTicket?.company_province ?? "--"}
              </div>
            </div>

            {/* Region */}
            <div style={{ flex: "1 1 auto", minWidth: "60px" }}>
              <div
                style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}
              >
                Region
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#141414",
                  fontWeight: "400",
                }}
              >
                --
              </div>
            </div>

            {/* Social Icons — same row, pushed to the right */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                flexShrink: 0,
                marginLeft: "auto",
                paddingTop: "2px",
              }}
            >
              {/* Facebook */}
              <button
                style={{
                  padding: "7px",
                  backgroundColor: "#f0f0f0",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#e0e0e0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f0f0f0";
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#555">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>
              {/* LinkedIn */}
              <button
                style={{
                  padding: "7px",
                  backgroundColor: "#f0f0f0",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#e0e0e0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f0f0f0";
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#555">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </button>
              {/* X / Twitter */}
              <button
                style={{
                  padding: "7px",
                  backgroundColor: "#f0f0f0",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#e0e0e0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f0f0f0";
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#555">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          {/* Left Column - Company Info */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #eaf0f6",
              borderRadius: "5px",
              padding: "20px",
            }}
          >
            <div
              style={{
                paddingBottom: "16px",
                borderBottom: "1px solid #eaf0f6",
                marginBottom: "16px",
              }}
            >
              <div
                style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}
              >
                Industry
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#141414",
                  fontWeight: "400",
                }}
              >
                --
              </div>
            </div>

            <div
              style={{
                paddingBottom: "16px",
                borderBottom: "1px solid #eaf0f6",
                marginBottom: "16px",
              }}
            >
              <div
                style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}
              >
                Company description
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#141414",
                  fontWeight: "400",
                }}
              >
                --
              </div>
            </div>

            <div>
              <div
                style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}
              >
                Company keywords
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#141414",
                  fontWeight: "400",
                }}
              >
                --
              </div>
            </div>
          </div>

          {/* Right Column - Contact Outreach */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #eaf0f6",
              borderRadius: "5px",
              padding: "20px",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#141414",
                margin: "0 0 16px 0",
              }}
            >
              Contact Outreach
            </h3>

            <div style={{ marginBottom: "20px" }}>
              <div
                style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}
              >
                Email
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#141414",
                  fontWeight: "400",
                }}
              >
                {prospect?.data?.data?.email ?? "--"}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                marginBottom: "20px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    marginBottom: "6px",
                  }}
                >
                  Job sub role
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#141414",
                    fontWeight: "400",
                  }}
                >
                  --
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    marginBottom: "6px",
                  }}
                >
                  Job seniority
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#141414",
                    fontWeight: "400",
                  }}
                >
                  --
                </div>
              </div>
            </div>

            <div>
              <div
                style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}
              >
                LinkedIn
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#141414",
                  fontWeight: "400",
                }}
              >
                --
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
            Contacts
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
                    onClick={() => setShowActionsDropdown(false)}
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
            { icon: ClipboardList, label: "Note", disabled: false, onClick: activityModals.openNote },
            { icon: Mail, label: "Email", disabled: false, onClick: activityModals.openEmail },
            { icon: Phone, label: "Call", disabled: true, onClick: undefined },
            { icon: ClipboardList, label: "Task", disabled: false, onClick: activityModals.openTask },
            { icon: Calendar, label: "Meeting", disabled: false, onClick: activityModals.openMeeting },
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
            {/* Breeze Record Summary */}
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
                    Breeze record summary
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
                    <span>Generated Feb 14, 2026</span>
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
                    {prospect?.data?.name ?? "This prospect"} is a Director at{" "}
                    {firstTicket?.company_name ??
                      prospect?.data?.company_name ??
                      "N/A"}
                    , currently in the Opportunity stage. Recent activity shows
                    strong engagement. The contact is revenue-generating.
                    Recommended next steps: consider a follow-up call to discuss
                    potential opportunities.
                  </div>

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
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #eaf0f6",
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
                  Contact profile
                </h3>
              </div>

              <div style={{ padding: "20px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {[
                    {
                      label: "Company name",
                      value: firstTicket?.company_name ?? "--",
                    },
                    { label: "Street address", value: "--" },
                    { label: "City", value: firstTicket?.company_city ?? "--" },
                    { label: "Postal code", value: "--" },
                    {
                      label: "State",
                      value: firstTicket?.company_province ?? "--",
                    },
                    {
                      label: "Email",
                      value: prospect?.data?.data?.email ?? "--",
                      link: true,
                    },
                  ].map((field, index) => (
                    <div key={index}>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#666666",
                          marginBottom: "4px",
                        }}
                      >
                        {field.label}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: field.link ? "#006162" : "#141414",
                        }}
                      >
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
            recordType="prospect"
            recordId={prospectRecordId}
            record={prospect}
            recordLoading={prospectLoading}
            recordName={prospectRecordName}
            canSendWhatsApp={canSendWhatsApp}
            {...activityModals.crmActivitiesPanelProps}
          />
        )}

        {activeTab === "intelligence" && renderIntelligenceTab()}
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

      {activityModals.modals}
    </>
  );
};

ContactRecordPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ContactRecordPage;
