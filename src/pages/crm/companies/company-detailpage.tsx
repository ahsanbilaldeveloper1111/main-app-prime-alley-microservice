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
  Copy,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Building2,
  Link2,
  AlertCircle,
  MessageCircle,
  FileText,
  ExternalLink,
} from "lucide-react";
import Layout from "@layout/index";
import { getCompany, type CompanyData, type EnrichmentData } from "@utils/crm";
import moment from "moment-timezone";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
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

const CompanyDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id: companyId } = router.query;
  const { hasPermission } = usePermissions();
  const canSendWhatsApp = hasPermission(
    HEADER_CONSTANTS.PERMISSIONS.SEND_WHATSAPP_MESSAGE_CRM,
  );

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("about");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showMoreActivities, setShowMoreActivities] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreActivitiesRef = useRef<HTMLDivElement>(null);

  const companyRecordId = Number(companyId) || company?.id || 0;
  const companyRecordName = company?.name ?? "Company";

  const activityModals = useCrmActivityModals({
    recordType: "company",
    recordId: companyRecordId,
    recordName: companyRecordName,
    recordEmail: company?.email ?? "",
    recordPhone: company?.phone ?? "",
  });

  // Load company by ID from URL
  useEffect(() => {
    if (!router.isReady || companyId == null || companyId === "") {
      setCompanyLoading(false);
      return;
    }
    const id = Number(companyId);
    if (Number.isNaN(id)) {
      setCompanyError("Invalid company ID");
      setCompanyLoading(false);
      return;
    }
    setCompanyLoading(true);
    setCompanyError(null);
    getCompany(id)
      .then((data: CompanyData) => {
        setCompany(data);
        setCompanyError(null);
      })
      .catch(() => {
        setCompany(null);
        setCompanyError("Failed to load company");
      })
      .finally(() => {
        setCompanyLoading(false);
      });
  }, [router.isReady, companyId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowActionsDropdown(false);
      }
      if (moreActivitiesRef.current && !moreActivitiesRef.current.contains(event.target as Node)) {
        setShowMoreActivities(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) newSet.delete(sectionId);
      else newSet.add(sectionId);
      return newSet;
    });
  };

  const subscriptionsData: SubscriptionItem[] = [];

  const revenueSections: RevenueSection[] = [
    {
      id: "quotes",
      title: "Quotes",
      count: 0,
      description: "Track the sales documents associated with this record.",
      buttonText: "Create quote",
      buttonIcon: FileText,
      onButtonClick: () => {},
      addButtonText: "Add",
      onAddClick: () => {},
    },
    {
      id: "invoices",
      title: "Invoices",
      count: 0,
      description:
        "Send your customer a request for payment and associate it with this record.",
      buttonText: "Set up payments",
      onButtonClick: () => {},
      addButtonText: "Add",
      onAddClick: () => {},
    },
    {
      id: "payment-links",
      title: "Payment Links",
      count: 0,
      description:
        "Add a payment link to accept a payment and associate it with this record.",
      buttonText: "Set up payments",
      onButtonClick: () => {},
      addButtonText: "Add",
      onAddClick: () => {},
    },
    {
      id: "subscriptions",
      title: "Subscriptions",
      count: subscriptionsData.length,
      description: "",
      buttonText: "",
      items: subscriptionsData,
      onButtonClick: () => {},
      addButtonText: "Add",
      onAddClick: () => {},
    },
    {
      id: "payments",
      title: "Payments",
      count: 0,
      description:
        "Track payments associated with this record. A payment is created when a customer pays or a recurring payment is processed.",
      buttonText: "Set up payments",
      onButtonClick: () => {},
    },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const tabs = [
    { id: "about", label: "About" },
    { id: "revenue", label: "Revenue" },
    { id: "intelligence", label: "Intelligence" },
  ];

  const enrichment = company?.enrichment_data;
  const struct = enrichment?.structured_data;
  const websiteUrl =
    enrichment?.discovered_website ||
    (company?.domain
      ? company.domain.startsWith("http")
        ? company.domain
        : `https://${company.domain}`
      : null);

  const keyInfoFields: KeyInfoField[] = [
    { label: "Email", value: company?.email ?? "--", copyable: true },
    { label: "Phone", value: company?.phone ?? "--", copyable: true },
    { label: "City", value: company?.city ?? "--" },
    { label: "Country", value: company?.country ?? "--" },
    { label: "Industry", value: company?.industry ?? "--" },
    { label: "Domain", value: company?.domain ?? "--" },
    { label: "Website", value: websiteUrl ?? "--", copyable: !!websiteUrl },
    {
      label: "Created",
      value: company?.created_at ? moment(company.created_at).format("MMM DD, YYYY") : "--",
    },
    // {
    //   label: "Updated",
    //   value: company?.updated_at ? moment(company.updated_at).format("MMM DD, YYYY") : "--",
    // },
  ];

  const cardStyle = {
    backgroundColor: "#ffffff",
    border: "1px solid #eaf0f6",
    borderRadius: "5px",
    padding: "20px",
    marginBottom: "16px",
  };
  const fieldRow = (label: string, value: React.ReactNode) => (
    <div key={label} style={{ marginBottom: "14px" }}>
      <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>{value ?? "--"}</div>
    </div>
  );
  const linkRow = (label: string, href: string | null | undefined, text: string) =>
    href ? (
      <div key={label} style={{ marginBottom: "14px" }}>
        <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>{label}</div>
        <a href={href} target="_blank" rel="noopener noreferrer" style={{ fontSize: "14px", color: "#006162", textDecoration: "none" }}>
          {text || href}
        </a>
      </div>
    ) : null;

  const renderIntelligenceTab = () => {
    const enr: EnrichmentData | null | undefined = company?.enrichment_data;
    const raw = enr?.raw_data;
    const struct = enr?.structured_data;
    const validation = enr?.validation_data;
    const hasEnrichment = enr && (enr.status != null || raw || struct || validation);

    if (!hasEnrichment) {
      return (
        <div style={cardStyle}>
          <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
            No enrichment data available for this company yet. Enrichment may be pending or not run.
          </p>
        </div>
      );
    }

    return (
      <div>
        {/* Enrichment overview – matches API: id, status, status_display, confidence_score, discovered_website, input_company_name, company_name, error_message */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#141414", margin: "0 0 16px 0" }}>
            Enrichment overview
          </h3>
          {enr?.id && fieldRow("Enrichment ID", enr.id)}
          {fieldRow("Status", enr?.status_display ?? enr?.status)}
          {fieldRow("Confidence score", enr?.confidence_score != null ? String(enr.confidence_score) : undefined)}
          {fieldRow("Retry count", enr?.retry_count != null ? String(enr.retry_count) : undefined)}
          {fieldRow("Input company name", enr?.input_company_name)}
          {fieldRow("Company name", enr?.company_name)}
          {linkRow("Discovered website", enr?.discovered_website ?? websiteUrl, enr?.discovered_website ?? websiteUrl ?? "")}
          {enr?.error_message != null && enr.error_message !== "" && fieldRow("Error message", enr.error_message)}
        </div>

        {/* Structured data */}
        {struct && (
          <div style={cardStyle}>
            <div
              style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", cursor: "pointer" }}
              onClick={() => toggleSection("intel-structured")}
            >
              <ChevronDown
                size={18}
                style={{
                  color: "#141414",
                  transform: collapsedSections.has("intel-structured") ? "rotate(-90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#141414", margin: 0 }}>Structured data</h3>
            </div>
            {!collapsedSections.has("intel-structured") && (
              <>
                {fieldRow("Official company name", struct.official_company_name)}
                {struct.headquarters && fieldRow(
                  "Headquarters",
                  [struct.headquarters.address, struct.headquarters.city, struct.headquarters.country]
                    .filter((v) => v != null && v !== "" && v !== ".")
                    .join(", ")
                )}
                {struct.other_locations?.length ? (
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Other locations</div>
                    {struct.other_locations.map((loc, i) => (
                      <div key={i} style={{ fontSize: "14px", color: "#141414", marginBottom: "4px" }}>
                        {[loc.address, loc.city, loc.country]
                          .filter((v) => v != null && v !== "" && v !== ".")
                          .join(", ") || "—"}
                      </div>
                    ))}
                  </div>
                ) : null}
                {struct.emails?.length ? (
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Emails</div>
                    {struct.emails.map((e, i) => (
                      <div key={i} style={{ fontSize: "14px" }}>
                        {e.email && <a href={`mailto:${e.email}`} style={{ color: "#006162", textDecoration: "none" }}>{e.email}</a>}
                        {e.type ? ` (${e.type})` : ""}
                      </div>
                    ))}
                  </div>
                ) : null}
                {struct.phones?.length ? (
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Phones</div>
                    {struct.phones.map((p, i) => (
                      <div key={i} style={{ fontSize: "14px" }}>
                        {p.number && <a href={`tel:${p.number}`} style={{ color: "#006162", textDecoration: "none" }}>{p.number}</a>}
                        {p.type ? ` (${p.type})` : ""}
                      </div>
                    ))}
                  </div>
                ) : null}
                {struct.social_links?.length ? (
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Social links</div>
                    {struct.social_links.map((s, i) => (
                      <div key={i} style={{ fontSize: "14px", marginBottom: "4px" }}>
                        {s.url && (
                          <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: "#006162", textDecoration: "none" }}>
                            {s.platform || s.url}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
                {struct.llm_confidence != null && fieldRow("LLM confidence", `${struct.llm_confidence}%`)}
              </>
            )}
          </div>
        )}

        {/* Validation data – is_match, confidence, reason */}
        {validation && (
          <div style={cardStyle}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#141414", margin: "0 0 16px 0" }}>Validation</h3>
            {fieldRow("Is match", validation.is_match != null ? String(validation.is_match) : undefined)}
            {validation.confidence != null && fieldRow("Confidence", `${validation.confidence}%`)}
            {fieldRow("Reason", validation.reason)}
          </div>
        )}

        {/* Raw data – at bottom */}
        {raw && (raw.emails?.length || raw.phones?.length || raw.social_links?.length || raw.address_blocks?.length || raw.combined_text) && (
          <div style={cardStyle}>
            <div
              style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", cursor: "pointer" }}
              onClick={() => toggleSection("intel-raw")}
            >
              <ChevronDown
                size={18}
                style={{
                  color: "#141414",
                  transform: collapsedSections.has("intel-raw") ? "rotate(-90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#141414", margin: 0 }}>Raw data</h3>
            </div>
            {!collapsedSections.has("intel-raw") && (
              <>
                {raw.emails?.length ? (
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Emails</div>
                    <div style={{ fontSize: "14px", color: "#141414" }}>
                      {raw.emails.map((e, i) => (
                        <a key={i} href={`mailto:${e}`} style={{ color: "#006162", textDecoration: "none", display: "block" }}>{e}</a>
                      ))}
                    </div>
                  </div>
                ) : null}
                {raw.phones?.length ? fieldRow("Phones", raw.phones.join(", ")) : null}
                {raw.social_links?.length ? (
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Social links</div>
                    <div style={{ fontSize: "14px", color: "#141414" }}>
                      {raw.social_links.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#006162", textDecoration: "none", display: "block" }}>{url}</a>
                      ))}
                    </div>
                  </div>
                ) : null}
                {raw.address_blocks?.length ? (
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Address blocks ({raw.address_blocks.length})</div>
                    {raw.address_blocks.map((block, i) => (
                      <div
                        key={i}
                        style={{
                          marginBottom: "10px",
                          padding: "10px",
                          backgroundColor: "#f7fafc",
                          border: "1px solid #eaf0f6",
                          borderRadius: "5px",
                          fontSize: "12px",
                          lineHeight: "1.5",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {block}
                      </div>
                    ))}
                  </div>
                ) : null}
                {raw.combined_text ? (
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Combined text</div>
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor: "#f7fafc",
                        border: "1px solid #eaf0f6",
                        borderRadius: "5px",
                        fontSize: "12px",
                        lineHeight: "1.5",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {raw.combined_text}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderRevenueSection = (section: RevenueSection) => (
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: section.items ? "16px" : "12px",
        }}
      >
        <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#141414", margin: 0 }}>
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

      {section.items && section.items.length > 0 ? (
        <>
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
                        backgroundColor: item.status === "active" ? "#10b981" : "#ef4444",
                        display: "inline-block",
                      }}
                    />
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </div>
                <div style={{ color: "#141414" }}>Next billing date: {item.nextBillingDate}</div>
                <div style={{ color: "#141414" }}>Next payment amount: {item.nextPaymentAmount}</div>
                <div>
                  <span style={{ color: "#141414" }}>Contact email: </span>
                  <a
                    href={`mailto:${item.contactEmail}`}
                    style={{ color: "#006162", textDecoration: "none" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = "none";
                    }}
                  >
                    {item.contactEmail}
                  </a>
                  <ExternalLink size={12} style={{ marginLeft: "4px", display: "inline" }} />
                </div>
              </div>
            </div>
          ))}
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

  // Left sidebar (company info + quick actions)
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
      <div
        style={{
          padding: "10px 0px",
          borderRadius: "10px",
          backgroundColor: "#ffffff",
          marginBottom: "12px",
          border: "1px solid #cccccc",
        }}
      >
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
            onClick={() => router.push("/crm/companies")}
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
            Companies
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
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ paddingTop: "16px", paddingLeft: "24px", paddingRight: "24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "37px",
                borderRadius: "26px",
                background: "#e0e7f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: "400",
                color: "#141414",
                flexShrink: 0,
              }}
            >
              <Building2 size={20} style={{ color: "#4f46e5" }} />
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
                {company?.name ?? "Unknown"}
              </h2>
              <p style={{ fontSize: "14px", color: "#718096", margin: "0 0 8px 0", lineHeight: "1.4" }}>
                {company?.industry ?? "Company"}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {company?.email ? (
                  <>
                    <a
                      href={`mailto:${company.email}`}
                      style={{ fontSize: "14px", color: "#006162", textDecoration: "none", fontWeight: "500" }}
                    >
                      {company.email}
                    </a>
                    <button
                      onClick={() => copyToClipboard(company.email ?? "")}
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
                  <span style={{ fontSize: "14px", color: "#718096" }}>No email</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions: Note, Email, Call, Task, Meeting, More (same as prospects with record_type company) */}
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
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}
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
                <span style={{ fontSize: "12px", color: "#141414", fontWeight: "300" }}>{action.label}</span>
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
            <span style={{ fontSize: "12px", color: "#141414", fontWeight: "300" }}>More</span>
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
            borderBottom: collapsedSections.has("key-info") ? "none" : "1px solid #cccccc",
          }}
          onClick={() => toggleSection("key-info")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ChevronDown
              size={18}
              style={{
                color: "#141414",
                transform: collapsedSections.has("key-info") ? "rotate(-90deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#141414", margin: 0 }}>
              Key information
            </h3>
          </div>
        </div>
        {!collapsedSections.has("key-info") && (
          <div style={{ padding: "20px" }}>
            {keyInfoFields.map((field, index) => (
              <div key={index} style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "13px", fontWeight: "400", color: "#666", marginBottom: "4px" }}>
                  {field.label}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400", flex: 1 }}>
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

  // Main content (tabs)
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
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "14px 20px", flex: 1 }}>
        {activeTab === "about" && (
          <>
            {/* Breeze record summary */}
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
                  borderBottom: collapsedSections.has("breeze") ? "none" : "1px solid #eaf0f6",
                }}
                onClick={() => toggleSection("breeze")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <ChevronDown
                    size={18}
                    style={{
                      color: "#141414",
                      transform: collapsedSections.has("breeze") ? "rotate(-90deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#141414", margin: 0 }}>
                    Breeze record summary
                  </h3>
                  <div
                    style={{
                      padding: "3px 10px",
                      background: "linear-gradient(114deg, rgb(255, 56, 66) 0%, rgb(210, 6, 136) 100%)",
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
                    <span>Generated {moment().format("MMM DD, YYYY")}</span>
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
                    {company?.name ?? "This company"} is in the {company?.industry ?? "N/A"} industry
                    {company?.city || company?.country ? `, based in ${[company?.city, company?.country].filter(Boolean).join(", ")}.` : "."}
                    {websiteUrl ? " Company website is available for reference." : ""}
                    Recommended next steps: log a call or schedule a meeting to track engagement.
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "12px", borderTop: "1px solid #fee" }}>
                    <button title="Good summary" style={{ background: "transparent", border: "none", padding: "6px", cursor: "pointer", color: "#141414" }}>
                      <ThumbsUp size={16} />
                    </button>
                    <button title="Bad summary" style={{ background: "transparent", border: "none", padding: "6px", cursor: "pointer", color: "#141414" }}>
                      <ThumbsDown size={16} />
                    </button>
                    <button title="Copy" style={{ background: "transparent", border: "none", padding: "6px", cursor: "pointer", color: "#141414" }}>
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
                    }}
                  >
                    <Sparkles size={16} />
                    Ask a question
                  </button>
                </div>
              )}
            </div>

            {/* Company profile */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #cccccc",
                borderRadius: "10px",
                marginBottom: "20px",
              }}
            >
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #eaf0f6" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#141414", margin: 0 }}>
                  Company profile
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
                    { label: "Company name", value: company?.name ?? "--" },
                    { label: "Phone", value: company?.phone ?? "--" },
                    { label: "Email", value: company?.email ?? "--", link: true },
                    { label: "City", value: company?.city ?? "--" },
                    { label: "Country", value: company?.country ?? "--" },
                    { label: "Industry", value: company?.industry ?? "--" },
                    { label: "Domain", value: company?.domain ?? "--" },
                    { label: "Website", value: websiteUrl ?? "--", link: !!websiteUrl },
                  ].map((field, index) => (
                    <div key={index}>
                      <div style={{ fontSize: "13px", color: "#666666", marginBottom: "4px" }}>{field.label}</div>
                      <div style={{ fontSize: "14px", color: field.link ? "#006162" : "#141414" }}>{field.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "revenue" && (
          <div>
            <div style={{ marginBottom: "24px" }}>
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
                    transform: collapsedSections.has("quote-to-cash") ? "rotate(-90deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
                <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#141414", margin: 0 }}>
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
                  {revenueSections.slice(0, 5).map((section) => renderRevenueSection(section))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "intelligence" && renderIntelligenceTab()}
      </div>
    </div>
  );

  // Right sidebar (placeholder for Deals / Leads when API supports company association)
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
            borderRadius: "10px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "10px",
              marginBottom: "12px",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
              border: "1px solid #cccccc",
              padding: "20px",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#141414", margin: "0 0 12px 0" }}>
              Associated records
            </h3>
            <p style={{ fontSize: "13px", color: "#666666", margin: 0 }}>
              Deals and leads linked to this company will appear here when available.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  if (companyLoading) {
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
          <RefreshCw size={32} style={{ color: "#006162", animation: "spin 1s linear infinite" }} />
          <p style={{ fontSize: "14px", color: "#718096" }}>Loading company...</p>
        </div>
      </Layout>
    );
  }

  if (companyError || (!companyId && !company)) {
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
            {companyError || "No company selected"}
          </p>
          <button
            onClick={() => router.push("/crm/companies")}
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
            Back to companies
          </button>
        </div>
      </Layout>
    );
  }

  if (!company) return null;

  return (
    <>
      <style>
        {`
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: #f7fafc; }
          ::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 4px; }
          .sidebar-scrollbar::-webkit-scrollbar { width: 8px; }
          .sidebar-scrollbar::-webkit-scrollbar-track { background: #f7fafc; }
          .sidebar-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 4px; }
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
        {renderLeftSidebar()}
        {renderMainContent()}
        {renderRightSidebar()}
      </div>
      {activityModals.modals}
    </>
  );
};

CompanyDetailPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CompanyDetailPage;
