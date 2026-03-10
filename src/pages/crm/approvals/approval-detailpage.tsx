import React, { useState, useRef, useEffect, ReactElement } from "react";
import { useRouter } from "next/router";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Mail,
  Phone,
  MoreHorizontal,
  Calendar,
  ClipboardList,
  ExternalLink,
  Copy,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  FileText,
  Ticket,
  Paperclip,
  Link2,
  AlertCircle,
  ShoppingCart,
} from "lucide-react";
import Layout from "@layout/index";
import { getDeal, type DealData } from "@utils/crm";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import CrmActivitiesPanel from "@components/CrmActivitiesPanel";
import CrmIntelligenceTab from "@components/CrmIntelligenceTab";
import CrmProfileSection from "@components/CrmProfileSection";
import CrmRecordSummarySection from "@components/CrmRecordSummarySection";
import { toast } from "react-toastify";

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

const DealRecordPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id: dealId } = router.query;
  const { hasPermission } = usePermissions();
  const canSendWhatsApp = hasPermission(
    HEADER_CONSTANTS.PERMISSIONS.SEND_WHATSAPP_MESSAGE_CRM,
  );

  const [deal, setDeal] = useState<DealData | null>(null);
  const [dealLoading, setDealLoading] = useState(true);
  const [dealError, setDealError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("about");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(),
  );
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showMoreActivities, setShowMoreActivities] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreActivitiesRef = useRef<HTMLDivElement>(null);

  // Open a specific tab when navigating with ?section= (e.g. ?section=activities)
  const validTabIds = ["about", "activities", "revenue", "intelligence"];
  useEffect(() => {
    if (!router.isReady) return;
    const section = router.query.section;
    const tabId =
      typeof section === "string" ? section.toLowerCase().trim() : null;
    if (tabId && validTabIds.includes(tabId)) {
      setActiveTab(tabId);
    }
  }, [router.isReady, router.query.section]);

  // Load deal by ID from URL
  useEffect(() => {
    if (!router.isReady || dealId == null || dealId === "") {
      setDealLoading(false);
      return;
    }
    const id = Number(dealId);
    if (Number.isNaN(id)) {
      setDealError("Invalid deal ID");
      setDealLoading(false);
      return;
    }
    setDealLoading(true);
    setDealError(null);
    getDeal(id)
      .then((data: DealData) => {
        setDeal(data);
        setDealError(null);
      })
      .catch(() => {
        setDeal(null);
        setDealError("Failed to load deal");
      })
      .finally(() => {
        setDealLoading(false);
      });
  }, [router.isReady, dealId]);

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

  // Revenue data
  const subscriptionsData: SubscriptionItem[] = [
    {
      id: "1",
      name: "Connect Pro",
      status: "active",
      nextBillingDate: "03/13/2026",
      nextPaymentAmount: "$500.00",
      contactEmail: "deal@example.com",
      link: "#",
    },
  ];

  const revenueSections: RevenueSection[] = [
    {
      id: "quotes",
      title: "Quotes",
      count: 0,
      description: "Track the sales documents associated with this record.",
      buttonText: "Create quote",
      buttonIcon: FileText,
      onButtonClick: () => console.log("Create quote"),
      addButtonText: "Add",
      onAddClick: () => console.log("Add quote"),
    },
    {
      id: "invoices",
      title: "Invoices",
      count: 0,
      description:
        "Send your customer a request for payment and associate it with this record.",
      buttonText: "Set up payments",
      onButtonClick: () => console.log("Set up payments"),
      addButtonText: "Add",
      onAddClick: () => console.log("Add invoice"),
    },
    {
      id: "payment-links",
      title: "Payment Links",
      count: 0,
      description:
        "Add a payment link to accept a payment and associate it with this record.",
      buttonText: "Set up payments",
      onButtonClick: () => console.log("Set up payments"),
      addButtonText: "Add",
      onAddClick: () => console.log("Add payment link"),
    },
    {
      id: "subscriptions",
      title: "Subscriptions",
      count: 1,
      description: "",
      buttonText: "",
      items: subscriptionsData,
      onButtonClick: () => console.log("Subscriptions"),
      addButtonText: "Add",
      onAddClick: () => console.log("Add subscription"),
    },
    {
      id: "payments",
      title: "Payments",
      count: 0,
      description:
        "Track payments associated with this record. A payment is created when a customer pays or a recurring payment is processed.",
      buttonText: "Set up payments",
      onButtonClick: () => console.log("Set up payments"),
    },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDealAmount = (d: DealData | null) => {
    if (!d) return "--";
    const curr = d.currency ?? "";
    const val = d.net_value ?? d.grand_total ?? "";
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

  // Tabs
  const tabs = [
    { id: "about", label: "About" },
    { id: "activities", label: "Activities" },
    { id: "revenue", label: "Revenue" },
    { id: "intelligence", label: "Intelligence" },
  ];

  // Key Information Fields - from deal API
  const keyInfoFields: KeyInfoField[] = [
    {
      label: "Email",
      value:
        deal?.decision_maker_email ??
        (deal as any)?.main_decision_maker?.email ??
        "--",
      copyable: true,
    },
    {
      label: "Phone Number",
      value:
        [deal?.decision_maker_phone_country_code, deal?.decision_maker_phone]
          .filter(Boolean)
          .join(" ") ||
        (deal as any)?.main_decision_maker?.phone ||
        "--",
      copyable: true,
    },
    { label: "Company Name", value: deal?.company_name ?? "--" },
    { label: "Deal Stage", value: deal?.stage?.name ?? deal?.status ?? "--" },
    { label: "Deal Value", value: formatDealAmount(deal) },
    {
      label: "Expected Close Date",
      value: formatDate(deal?.expected_close_date),
    },
    { label: "Associate with", value: deal?.assigned_to ?? "--" },
  ];

  // Normalize deal for CrmActivitiesPanel
  const dealRecord = deal
    ? {
        id: deal.id,
        data: {
          id: deal.id,
          name: deal.name,
          phone: deal.decision_maker_phone ?? (deal as any).phone ?? null,
          data: {},
        },
      }
    : null;

  const renderIntelligenceTab = () => {
    // Deprecated: intelligence UI now handled by CrmIntelligenceTab
    return (
      <div>
        {/* Info Banner */}
        {/* <div style={{
          padding: '16px 20px',
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '5px',
          marginBottom: '20px',
        }}>
          <p style={{
            fontSize: '14px',
            color: '#92400e',
            margin: 0,
          }}>
            We does not have enrichment data for this record, yet.
          </p>
        </div> */}

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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "20px",
              marginBottom: "16px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#7c98b6",
                  marginBottom: "6px",
                }}
              >
                Deal Stage
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#141414",
                  fontWeight: "400",
                }}
              >
                {deal?.stage?.name ?? deal?.status ?? "--"}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#7c98b6",
                  marginBottom: "6px",
                }}
              >
                Related company
              </div>
              <span
                style={{
                  fontSize: "14px",
                  color: "#006162",
                  fontWeight: "500",
                }}
              >
                {deal?.company_name ?? "--"}
              </span>
            </div>
            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#7c98b6",
                  marginBottom: "6px",
                }}
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
            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#7c98b6",
                  marginBottom: "6px",
                }}
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
                --
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#7c98b6",
                  marginBottom: "6px",
                }}
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
                --
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#7c98b6",
                  marginBottom: "6px",
                }}
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
          </div>

          {/* Social Icons */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              paddingTop: "16px",
              borderTop: "1px solid #eaf0f6",
            }}
          >
            <button
              style={{
                padding: "8px",
                backgroundColor: "#f7fafc",
                border: "1px solid #eaf0f6",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#eaf0f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f7fafc";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#7c98b6">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
            <button
              style={{
                padding: "8px",
                backgroundColor: "#f7fafc",
                border: "1px solid #eaf0f6",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#eaf0f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f7fafc";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#7c98b6">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </button>
            <button
              style={{
                padding: "8px",
                backgroundColor: "#f7fafc",
                border: "1px solid #eaf0f6",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#eaf0f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f7fafc";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#7c98b6">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </button>
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
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  fontSize: "13px",
                  color: "#7c98b6",
                  marginBottom: "6px",
                }}
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
                {deal?.industry ?? "--"}
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  fontSize: "13px",
                  color: "#7c98b6",
                  marginBottom: "6px",
                }}
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
                {deal?.company_name ? `${deal.company_name} deal` : "--"}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#7c98b6",
                  marginBottom: "6px",
                }}
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
                fontWeight: "600",
                color: "#141414",
                margin: "0 0 16px 0",
              }}
            >
              Contact Outreach
            </h3>

            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  fontSize: "13px",
                  color: "#7c98b6",
                  marginBottom: "6px",
                }}
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
                {deal?.decision_maker_email ??
                  (deal as any)?.main_decision_maker?.email ??
                  "--"}
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
                    color: "#7c98b6",
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
                    color: "#7c98b6",
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
                style={{
                  fontSize: "13px",
                  color: "#7c98b6",
                  marginBottom: "6px",
                }}
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
            Deals Approval
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
              {deal?.name
                ? deal.name
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
                {deal?.name ?? "Unknown"}
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "#718096",
                  margin: "0 0 8px 0",
                  lineHeight: "1.4",
                }}
              >
                {deal?.company_name ?? "--"}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {(deal?.decision_maker_email ??
                (deal as any)?.main_decision_maker?.email) ? (
                  <>
                    <a
                      href={`mailto:${deal?.decision_maker_email ?? (deal as any)?.main_decision_maker?.email}`}
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
                      {deal?.decision_maker_email ??
                        (deal as any)?.main_decision_maker?.email}
                    </a>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          deal?.decision_maker_email ??
                            (deal as any)?.main_decision_maker?.email ??
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
            { icon: ClipboardList, label: "Note", disabled: false },
            { icon: Mail, label: "Email", disabled: true },
            { icon: Phone, label: "Call", disabled: true },
            { icon: ClipboardList, label: "Task", disabled: true },
            { icon: Calendar, label: "Meeting", disabled: false },
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
                  // disabled={action.disabled}
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
                {["SMS", "WhatsApp"].map((action) => (
                  <button
                    key={action}
                    onClick={() => setShowMoreActivities(false)}
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
      <div style={{ padding: "14px 0", flex: 1 }}>
        {activeTab === "about" && (
          <>
            {/* Record Summary */}
            <CrmRecordSummarySection
              isCollapsed={collapsedSections.has("breeze")}
              onToggle={() => toggleSection("breeze")}
              summary={(deal as any)?.crm_summary?.summary ?? null}
              metaLabel={
                (deal as any)?.crm_summary?.updated_at
                  ? `Updated ${new Date(
                      (deal as any).crm_summary.updated_at,
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
                const idNum = Number(dealId || deal?.id);
                if (!idNum || Number.isNaN(idNum)) {
                  toast.error("Invalid deal ID");
                  return;
                }
                try {
                  const refreshed = await getDeal(idNum);
                  setDeal(refreshed);
                  toast.success("Summary refreshed");
                } catch {
                  toast.error("Failed to refresh summary");
                }
              }}
            />

            {/* Contact Profile */}
            <CrmProfileSection
              title="Deal profile"
              fields={[
                {
                  label: "Company name",
                  value:
                    (deal as any)?.company?.enrichment_data?.structured_data
                      ?.official_company_name ?? deal?.company_name ?? "--",
                },
                {
                  label: "Street address",
                  value:
                    (deal as any)?.company?.enrichment_data?.structured_data
                      ?.headquarters?.address ??
                    (deal as any)?.company?.address ??
                    "--",
                },
                {
                  label: "City",
                  value:
                    (deal as any)?.company?.enrichment_data?.structured_data
                      ?.headquarters?.city ??
                    (deal as any)?.company?.city ??
                    "--",
                },
                {
                  label: "Postal code",
                  value:
                    (deal as any)?.company?.postal_code ??
                    (deal as any)?.company?.zip ??
                    "--",
                },
                {
                  label: "State/Region",
                  value:
                    (deal as any)?.company?.state ??
                    (deal as any)?.company?.province ??
                    "--",
                },
                {
                  label: "Email",
                  value:
                    (deal as any)?.company?.enrichment_data?.structured_data
                      ?.emails?.[0]?.email ??
                    (deal as any)?.decision_maker_email ??
                    (deal as any)?.contact_email ??
                    "--",
                  link: true,
                },
              ]}
            />
          </>
        )}

        {activeTab === "activities" && (
          <CrmActivitiesPanel
            recordType="deal"
            recordId={Number(dealId) || deal?.id || 0}
            record={dealRecord}
            recordLoading={dealLoading}
            recordName={deal?.name ?? "Deal"}
            canSendWhatsApp={canSendWhatsApp}
          />
        )}

        {activeTab === "revenue" && (
          <div>
            {/* Quote-to-cash Section */}
            <div
              style={{
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                  cursor: "pointer",
                }}
                onClick={() => toggleSection("quote-to-cash")}
              >
                <ChevronDown
                  size={20}
                  style={{
                    color: "#141414",
                    transform: collapsedSections.has("quote-to-cash")
                      ? "rotate(-90deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#141414",
                    margin: 0,
                  }}
                >
                  Quote-to-cash
                </h2>
              </div>

              {!collapsedSections.has("quote-to-cash") && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {revenueSections
                    .slice(0, 5)
                    .map((section) => renderRevenueSection(section))}
                </div>
              )}
            </div>

            {/* e-Commerce Section */}
            <div
              style={{
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                  cursor: "pointer",
                }}
                onClick={() => toggleSection("e-commerce")}
              >
                <ChevronDown
                  size={20}
                  style={{
                    color: "#141414",
                    transform: collapsedSections.has("e-commerce")
                      ? "rotate(-90deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#141414",
                    margin: 0,
                  }}
                >
                  e-Commerce
                </h2>
              </div>

              {!collapsedSections.has("e-commerce") && (
                <div
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    backgroundColor: "#f7fafc",
                    borderRadius: "5px",
                    border: "1px solid #eaf0f6",
                  }}
                >
                  <ShoppingCart
                    size={48}
                    style={{ marginBottom: "16px", color: "#cbd5e0" }}
                  />
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#7c98b6",
                      margin: 0,
                    }}
                  >
                    No e-commerce data available
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === "intelligence" && (
          <CrmIntelligenceTab
            company={(deal as any)?.company ?? null}
            relatedCompany={deal?.company_name ?? "--"}
            industryName={(deal as any)?.industries?.[0]?.name ?? deal?.industry ?? null}
            industryDescription={(deal as any)?.industries?.[0]?.description ?? null}
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
            {/* Companies */}
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
                onClick={() => toggleSection("companies")}
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
                      transform: collapsedSections.has("companies")
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
                    Companies ({deal?.company_name ? 1 : 0})
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
                    fontSize: "12px",
                    fontWeight: "500",
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
                  <span style={{ fontSize: "14px", fontWeight: "300" }}>+</span>{" "}
                  <span style={{ fontSize: "12px", fontWeight: "500" }}>
                    Add
                  </span>
                </button>
              </div>

              {!collapsedSections.has("companies") && (
                <div style={{ padding: "20px" }}>
                  {deal?.company_name ? (
                    <>
                      <div
                        style={{
                          marginBottom: "16px",
                          border: "1px solid #cccccc",
                          borderRadius: "10px",
                          padding: "15px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "8px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "14px",
                              color: "#006162",
                              fontWeight: "500",
                            }}
                          >
                            {deal.company_name}
                          </span>
                          <span
                            style={{
                              padding: "2px 8px",
                              backgroundColor: "#e6f3ff",
                              color: "#006162",
                              borderRadius: "3px",
                              fontSize: "11px",
                              fontWeight: "600",
                            }}
                          >
                            Primary
                          </span>
                        </div>
                        {deal.industry && (
                          <p
                            style={{
                              fontSize: "13px",
                              color: "#666666",
                              margin: "4px 0",
                            }}
                          >
                            Industry: {deal.industry}
                          </p>
                        )}
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#666666",
                            margin: "4px 0",
                          }}
                        >
                          Phone:{" "}
                          {[
                            deal.decision_maker_phone_country_code,
                            deal.decision_maker_phone,
                          ]
                            .filter(Boolean)
                            .join(" ") || "--"}
                        </p>
                      </div>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          const companyId = (deal as any)?.company?.id ?? null;
                          const href = companyId
                            ? `/crm/companies/company-detailpage?id=${encodeURIComponent(
                                String(companyId),
                              )}`
                            : "/crm/companies";
                          window.open(href, "_blank", "noopener,noreferrer");
                        }}
                        style={{
                          fontSize: "12px",
                          color: "#141414",
                          textDecoration: "none",
                          fontWeight: "300",
                          display: "inline-flex", // ✅ change this
                          alignItems: "center",
                          gap: "4px",
                          border: "1px solid #cccccc",
                          borderRadius: "6px",
                          padding: "6px 12px",
                        }}
                      >
                        View all associated Companies
                        <ExternalLink size={12} />
                      </a>
                    </>
                  ) : (
                    <p
                      style={{ fontSize: "13px", color: "#666666", margin: 0 }}
                    >
                      No companies associated.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Deals */}
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
                    Deals ({deal ? 1 : 0})
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
                  <span style={{ fontSize: "14px", fontWeight: "300" }}>+</span>{" "}
                  <span style={{ fontSize: "12px", fontWeight: "500" }}>
                    Add
                  </span>
                </button>
              </div>

              {!collapsedSections.has("deals") && (
                <div style={{ padding: "20px" }}>
                  {deal ? (
                    <>
                      <div
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
                          Amount: {formatDealAmount(deal)}
                        </p>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#666666",
                            margin: "4px 0",
                          }}
                        >
                          Close Date: {formatDate(deal.expected_close_date)}
                        </p>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#666666",
                            margin: "4px 0",
                          }}
                        >
                          Deal Stage: {deal.stage?.name ?? deal.status ?? "--"}
                        </p>
                      </div>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          const id = deal?.id;
                          const href = id
                            ? `/crm/deals/deals-detailpage?id=${encodeURIComponent(
                                String(id),
                              )}`
                            : "/crm/deals";
                          window.open(href, "_blank", "noopener,noreferrer");
                        }}
                        style={{
                          fontSize: "13px",
                          color: " #006162",
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
                  ) : (
                    <p
                      style={{ fontSize: "13px", color: "#666666", margin: 0 }}
                    >
                      No deals.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Tickets */}
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
                    Tickets ({deal?.ticket ? 1 : 0})
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
                  <span style={{ fontSize: "14px", fontWeight: "300" }}>+</span>{" "}
                  <span style={{ fontSize: "12px", fontWeight: "500" }}>
                    Add
                  </span>
                </button>
              </div>

              {!collapsedSections.has("tickets") && (
                <div style={{ padding: "20px" }}>
                  {deal?.ticket ? (
                    <>
                      <div
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
                          {(deal.ticket as any)?.name ?? "Lead"}
                        </span>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#666666",
                            margin: "4px 0",
                          }}
                        >
                          Company: {(deal.ticket as any)?.company_name ?? "--"}
                        </p>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#666666",
                            margin: "4px 0",
                          }}
                        >
                          Status: {(deal.ticket as any)?.status ?? "--"}
                        </p>
                      </div>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          const ticketId = (deal.ticket as any)?.id;
                          const href = ticketId
                            ? `/crm/leads/leads-detailpage?id=${encodeURIComponent(
                                String(ticketId),
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
                        View all associated Tickets
                        <ExternalLink size={12} />
                      </a>
                    </>
                  ) : (
                    <div
                      style={{
                        padding: "32px 20px",
                        textAlign: "center",
                      }}
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
                        Track the customer requests associated with this record.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Attachments */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
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
                onClick={() => toggleSection("attachments")}
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
                      transform: collapsedSections.has("attachments")
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
                    Attachments ({deal?.attachments?.length ?? 0})
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
                    fontSize: "14px",
                    fontWeight: "500",
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
                  <span style={{ fontSize: "14px", fontWeight: "300" }}>+</span>{" "}
                  <span style={{ fontSize: "12px", fontWeight: "500" }}>
                    Add
                  </span>
                </button>
              </div>

              {!collapsedSections.has("attachments") && (
                <div style={{ padding: "20px" }}>
                  {(deal?.attachments?.length ?? 0) > 0 ? (
                    <>
                      {deal!.attachments!.map((att: any) => (
                        <div
                          key={att.id}
                          style={{
                            marginBottom: "12px",
                            border: "1px solid #cccccc",
                            borderRadius: "8px",
                            padding: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Paperclip size={18} style={{ color: "#718096" }} />
                          <a
                            href={att.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: "14px",
                              color: "#006162",
                              textDecoration: "none",
                              fontWeight: "500",
                            }}
                          >
                            {att.file_path?.split("/").pop() ??
                              `Attachment ${att.id}`}
                          </a>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div
                      style={{
                        padding: "32px 20px",
                        textAlign: "center",
                      }}
                    >
                      <Paperclip
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
                        No attachments yet
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (dealLoading) {
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
          <p style={{ fontSize: "14px", color: "#718096" }}>Loading deal...</p>
        </div>
      </Layout>
    );
  }

  if (dealError || (!dealId && !deal)) {
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
            {dealError || "No deal selected"}
          </p>
          <button
            onClick={() => router.push("/crm/approvals")}
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
            Back to deals approval
          </button>
        </div>
      </Layout>
    );
  }

  if (!deal) {
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
    </>
  );
};

DealRecordPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default DealRecordPage;
