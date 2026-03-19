import React, { useState, useRef, useEffect, ReactElement, useCallback } from "react";
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
  Building2,
  AlertCircle,
} from "lucide-react";
import Layout from "@layout/index";
import {
  getCompany,
  deleteCompany,
  updateCompany,
  type CompanyData,
  type EnrichmentData,
} from "@utils/crm";
import {
  CreateCompanySidebar,
  type CompanyFormPayload,
} from "@components/renderCreateCompany";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import moment from "moment-timezone";
import { useCrmActivityModals } from "@hooks/useCrmActivityModals";
import CrmRecordSummarySection from "@components/CrmRecordSummarySection";
import { useCti } from "@hooks/useCti";
import { toast } from "react-toastify";
import { exportRecordAsCsv } from "@utils/csvExport";
import {
  sidebarContainerStyle,
  sidebarCardStyle,
  sectionHeaderRowStyle,
  chevronTitleRowStyle,
  ghostActionButtonStyle,
  dropdownItemButtonStyle,
  quickActionCircleButtonStyle,
} from "@components/CrmDetailSharedStyles";
import {
  CrmRevenueQuoteToCash,
  type SubscriptionItem,
  type RevenueSection,
  createDefaultRevenueSections,
} from "@components/CrmRevenueQuoteToCash";

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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CompanyDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id: companyId } = router.query;

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
  const enrData = company?.enrichment_data;
  const enrichmentEmail =
    enrData?.raw_data?.emails?.[0] ??
    enrData?.structured_data?.emails?.[0]?.email ??
    company?.email ??
    "";
  const enrichmentPhone =
    enrData?.structured_data?.phones?.[0]?.number ??
    enrData?.raw_data?.phones?.[0] ??
    company?.phone ??
    "";

  // All phone numbers: company + structured_data.phones + raw_data.phones (unique, for display and Call button)
  const allPhones = React.useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    const add = (n: string | null | undefined) => {
      const v = (n ?? "").trim();
      if (!v) return;
      const key = v.replaceAll(" ", "");
      if (seen.has(key)) return;
      seen.add(key);
      out.push(v);
    };
    add(company?.phone);
    enrData?.structured_data?.phones?.forEach((p) => add(p?.number));
    enrData?.raw_data?.phones?.forEach((p) => add(p));
    return out;
  }, [company?.phone, enrData?.structured_data?.phones, enrData?.raw_data?.phones]);
  const firstPhone = allPhones[0] ?? "";
  const hasAnyPhone = allPhones.length > 0;

  const { dialNumber, isInitialized } = useCti();
  const handleCallClick = React.useCallback(async () => {
    if (!firstPhone) {
      toast.error("No phone number available to call");
      return;
    }
    if (!isInitialized) {
      toast.error("CTI not initialized. Please wait...");
      return;
    }
    try {
      const result = await dialNumber(firstPhone);
      if (result.success) {
        toast.success(`Calling ${companyRecordName || firstPhone}...`);
      } else {
        toast.error(result.error || "Failed to make call");
      }
    } catch (err) {
      console.error("Call error:", err);
      toast.error("Failed to make call");
    }
  }, [firstPhone, companyRecordName, dialNumber, isInitialized]);

  const activityModals = useCrmActivityModals({
    recordType: "company",
    recordId: companyRecordId,
    recordName: companyRecordName,
    recordEmail: enrichmentEmail,
    recordPhone: enrichmentPhone,
  });

  const [exporting, setExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<{
    id: number;
    name?: string | null;
  } | null>(null);
  const [showEditCompanySidebar, setShowEditCompanySidebar] = useState(false);
  const [editingCompanyForm, setEditingCompanyForm] =
    useState<CompanyFormPayload | null>(null);

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

  const revenueSections: RevenueSection[] = createDefaultRevenueSections(
    subscriptionsData.length,
    subscriptionsData,
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const tabs = [
    { id: "about", label: "About" },
    { id: "revenue", label: "Revenue" },
    { id: "intelligence", label: "Intelligence" },
  ];

  const enrichment = company?.enrichment_data;
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

  const detectSocialPlatform = (url: string): "facebook" | "linkedin" | "twitter" | null => {
    const u = url.toLowerCase();
    if (u.includes("facebook.com")) return "facebook";
    if (u.includes("linkedin.com")) return "linkedin";
    if (u.includes("twitter.com") || u.includes("x.com")) return "twitter";
    return null;
  };

  const renderIntelligenceTab = () => {
    const enr: EnrichmentData | null | undefined = company?.enrichment_data;
    const raw = enr?.raw_data;
    const struct = enr?.structured_data;

    // Social links: merge raw (string[]) + structured (object[]), dedupe by URL case-insensitive
    const socialLinksDeduped: string[] = [];
    const seenUrl = new Set<string>();
    const addUrl = (url: string | null | undefined) => {
      const u = (url ?? "").trim();
      if (!u) return;
      const key = u.toLowerCase();
      if (seenUrl.has(key)) return;
      seenUrl.add(key);
      socialLinksDeduped.push(u);
    };
    raw?.social_links?.forEach(addUrl);
    struct?.social_links?.forEach((s) => addUrl(s?.url));
    const socialLinks = socialLinksDeduped;

    const cityVal = struct?.headquarters?.city ?? company?.city ?? "--";
    const stateVal = struct?.headquarters?.address ?? company?.country ?? "--";
    const regionVal = struct?.headquarters?.country ?? company?.country ?? "--";
    const lifecycleStage = enr?.status_display ?? enr?.status ?? "--";
    const relatedCompany = enr?.company_name ?? company?.name ?? "--";
    const industryVal = company?.industry ?? "--";
    const companyDesc = struct?.official_company_name ?? company?.name ?? "--";
    const firstLinkedIn = socialLinks.find((u) => detectSocialPlatform(u) === "linkedin") ?? "--";
    const iconBtn = (href: string | null, iconSvg: React.ReactNode, label: string) => (
      <a
        href={href || "#"}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: "7px",
          backgroundColor: "#f0f0f0",
          border: "none",
          borderRadius: "4px",
          cursor: href ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
        }}
        onMouseEnter={(e) => {
          if (href) e.currentTarget.style.backgroundColor = "#e0e0e0";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#f0f0f0";
        }}
      >
        {iconSvg}
      </a>
    );
    const facebookUrl = socialLinks.find((u) => detectSocialPlatform(u) === "facebook") ?? null;
    const linkedinUrl = socialLinks.find((u) => detectSocialPlatform(u) === "linkedin") ?? null;
    const twitterUrl = socialLinks.find((u) => detectSocialPlatform(u) === "twitter") ?? null;

    return (
      <div>
        {/* Info Banner – same as prospects */}
        <div
          style={{
            padding: "16px 20px",
            backgroundColor: "#ffffff",
            border: "1px solid #eaf0f6",
            borderRadius: "5px",
            marginBottom: "20px",
          }}
        >
          <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
            {enr ? "Enrichment data for this company is shown below." : "We do not have enrichment data for this record, yet."}
          </p>
        </div>

        {/* Contact Information Card – single row + up to 3 social icons (from raw_data.social_links) */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #eaf0f6",
            borderRadius: "5px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", flexWrap: "nowrap" }}>
            <div style={{ flex: "1 1 auto", minWidth: "100px" }}>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Lifecycle stage</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "700" }}>{lifecycleStage}</div>
            </div>
            <div style={{ flex: "1 1 auto", minWidth: "100px" }}>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Related company</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>{relatedCompany}</div>
            </div>
            <div style={{ flex: "1 1 auto", minWidth: "100px" }}>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Employment role</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>--</div>
            </div>
            <div style={{ flex: "1 1 auto", minWidth: "60px" }}>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>City</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>{cityVal}</div>
            </div>
            <div style={{ flex: "1 1 auto", minWidth: "60px" }}>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>State</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>{stateVal}</div>
            </div>
            <div style={{ flex: "1 1 auto", minWidth: "60px" }}>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Region</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>{regionVal}</div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0, marginLeft: "auto", paddingTop: "2px" }}>
              {facebookUrl && iconBtn(facebookUrl, <svg width="16" height="16" viewBox="0 0 24 24" fill="#555"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>, "Facebook")}
              {linkedinUrl && iconBtn(linkedinUrl, <svg width="16" height="16" viewBox="0 0 24 24" fill="#555"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>, "LinkedIn")}
              {twitterUrl && iconBtn(twitterUrl, <svg width="16" height="16" viewBox="0 0 24 24" fill="#555"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>, "X")}
            </div>
          </div>
        </div>

        {/* Two Column Layout – same as prospects */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #eaf0f6", borderRadius: "5px", padding: "20px" }}>
            <div style={{ paddingBottom: "16px", borderBottom: "1px solid #eaf0f6", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Industry</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>{industryVal}</div>
            </div>
            <div style={{ paddingBottom: "16px", borderBottom: "1px solid #eaf0f6", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Company description</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>{companyDesc}</div>
            </div>
            <div>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Company keywords</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>--</div>
            </div>
          </div>
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #eaf0f6", borderRadius: "5px", padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#141414", margin: "0 0 16px 0" }}>Contact Outreach</h3>
            {/* All emails: structured_data + raw + company */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Emails</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400", display: "flex", flexDirection: "column", gap: "6px" }}>
                {(() => {
                  const seen = new Set<string>();
                  const list: { email: string; type?: string }[] = [];
                  struct?.emails?.forEach((e) => {
                    const v = (e?.email ?? "").trim();
                    if (v && !seen.has(v.toLowerCase())) {
                      seen.add(v.toLowerCase());
                      list.push({ email: v, type: e?.type ?? undefined });
                    }
                  });
                  raw?.emails?.forEach((v) => {
                    const s = (v ?? "").trim();
                    if (s && !seen.has(s.toLowerCase())) {
                      seen.add(s.toLowerCase());
                      list.push({ email: s });
                    }
                  });
                  if (company?.email?.trim() && !seen.has(company.email.trim().toLowerCase())) {
                    list.push({ email: company.email.trim() });
                  }
                  if (list.length === 0) return "--";
                  return list.map(({ email, type }, i) => (
                    <span key={i}>
                      <a href={`mailto:${email}`} style={{ color: "#006162", textDecoration: "none" }}>{email}</a>
                      {type ? <span style={{ color: "#666", fontSize: "12px", marginLeft: "6px" }}>({type})</span> : null}
                    </span>
                  ));
                })()}
              </div>
            </div>
            {/* All phones: structured_data + raw + company */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Phones</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400", display: "flex", flexDirection: "column", gap: "6px" }}>
                {allPhones.length === 0 ? (
                  "--"
                ) : (
                  allPhones.map((num) => {
                    const normalized = num.replaceAll(" ", "");
                    return (
                      <a
                        key={normalized}
                        href={`tel:${normalized}`}
                        style={{ color: "#006162", textDecoration: "none" }}
                      >
                        {num}
                      </a>
                    );
                  })
                )}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Job sub role</div>
                <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>--</div>
              </div>
              <div>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>Job seniority</div>
                <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>--</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "6px" }}>LinkedIn</div>
              <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400" }}>
                {firstLinkedIn === "--" ? (
                  "--"
                ) : (
                  <a
                    href={firstLinkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#006162", textDecoration: "none" }}
                  >
                    {firstLinkedIn}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* All structured_data: headquarters, other_locations, llm_confidence */}
        {struct && (
          <div style={{ ...cardStyle, marginTop: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#141414", margin: "0 0 16px 0" }}>Structured data</h3>
            {struct.official_company_name && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Official company name</div>
                <div style={{ fontSize: "14px", color: "#141414" }}>{struct.official_company_name}</div>
              </div>
            )}
            {struct.headquarters && (struct.headquarters.address || struct.headquarters.city || struct.headquarters.country) && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Headquarters</div>
                <div style={{ fontSize: "14px", color: "#141414" }}>
                  {[struct.headquarters.address, struct.headquarters.city, struct.headquarters.country].filter(Boolean).join(", ")}
                </div>
              </div>
            )}
            {struct.other_locations && struct.other_locations.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Other locations</div>
                <div style={{ fontSize: "14px", color: "#141414", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {struct.other_locations.map((loc, i) => (
                    <div key={i}>
                      {[loc?.address, loc?.city, loc?.country].filter((x) => x && x !== ".").join(", ") || "—"}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {struct.emails && struct.emails.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Emails (structured)</div>
                <div style={{ fontSize: "14px", color: "#141414", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {struct.emails.map((e, i) => (
                    <span key={i}>
                      {e?.email}
                      {e?.type ? <span style={{ color: "#666", fontSize: "12px", marginLeft: "6px" }}>({e.type})</span> : null}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {struct.phones && struct.phones.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>Phones (structured)</div>
                <div style={{ fontSize: "14px", color: "#141414", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {struct.phones.map((p, i) => (
                    <span key={i}>
                      {p?.number}
                      {p?.type ? <span style={{ color: "#666", fontSize: "12px", marginLeft: "6px" }}>({p.type})</span> : null}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {struct.llm_confidence != null && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>LLM confidence</div>
                <div style={{ fontSize: "14px", color: "#141414" }}>{struct.llm_confidence}%</div>
              </div>
            )}
          </div>
        )}

        {/* All social links at bottom – deduped, case-insensitive */}
        {socialLinks.length > 0 && (
          <div style={{ ...cardStyle, marginTop: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#141414", margin: "0 0 16px 0" }}>Social links</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {socialLinks.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "14px", color: "#006162", textDecoration: "none" }}
                >
                  {url}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleCompanyExport = useCallback(() => {
    if (!company) return;
    const id = company.id ?? companyRecordId;
    setExporting(true);
    try {
      exportRecordAsCsv({
        row: company as unknown as Record<string, unknown>,
        fileName: `company_${id}.csv`,
      });
      toast.success("Exported company successfully!");
    } catch (err) {
      toast.error("Failed to export company");
      // eslint-disable-next-line no-console
      console.error("Failed to export company:", err);
    } finally {
      setExporting(false);
    }
  }, [company, companyRecordId]);

  const handleOpenDeleteCompany = useCallback(() => {
    if (!companyRecordId || !company) return;
    setCompanyToDelete({ id: companyRecordId, name: company.name });
    setShowDeleteModal(true);
  }, [companyRecordId, company]);

  const confirmDeleteCompany = useCallback(async () => {
    if (!companyToDelete) return;
    try {
      await deleteCompany(companyToDelete.id);
      setShowDeleteModal(false);
      setCompanyToDelete(null);
      router.push("/crm/companies");
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("Delete company error:", error);
    }
  }, [companyToDelete, router]);

  const handleOpenEditCompany = useCallback(() => {
    if (!company) return;
    setEditingCompanyForm({
      name: company.name ?? "",
      domain: company.domain ?? "",
      industry: company.industry ?? "",
      country: company.country ?? "",
      city: company.city ?? "",
      email: company.email ?? "",
      phone: company.phone ?? "",
    });
    setShowEditCompanySidebar(true);
  }, [company]);

  const handleCompanySave = useCallback(
    async (data: CompanyFormPayload, id?: number) => {
      const targetId = id ?? companyRecordId;
      if (!targetId) return;
      try {
        const updated = await updateCompany(targetId, {
          name: data.name,
          phone: data.phone,
          city: data.city,
          country: data.country,
          industry: data.industry,
          domain: data.domain,
          email: data.email,
        });
        setCompany(updated);
      } catch {
        // errors/toasts handled in updateCompany
      }
    },
    [companyRecordId],
  );

  // Left sidebar (company info + quick actions)
  const renderLeftSidebar = () => (
    <div
      className="sidebar-scrollbar"
      style={{
        width: "385px",
        marginRight: "10px",
        ...sidebarContainerStyle,
      }}
    >
      <div
        style={{
          padding: "10px 0px",
          marginBottom: "12px",
          ...sidebarCardStyle,
        }}
      >
        <div
          style={{
            ...sectionHeaderRowStyle,
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
              style={{
                padding: "6px 14px",
                fontSize: "14px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                ...ghostActionButtonStyle,
              }}
              onClick={() => setShowActionsDropdown(!showActionsDropdown)}
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
                    disabled={action === "Export" && exporting}
                    onClick={() => {
                      if (action === "Edit") {
                        handleOpenEditCompany();
                      } else if (action === "Delete") {
                        handleOpenDeleteCompany();
                      } else if (action === "Export") {
                        handleCompanyExport();
                      }
                      setShowActionsDropdown(false);
                    }}
                    style={dropdownItemButtonStyle}
                  >
                    {action === "Export" && exporting ? "Exporting..." : action}
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
            { icon: Phone, label: "Call", disabled: !hasAnyPhone, onClick: handleCallClick },
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
                    ...quickActionCircleButtonStyle,
                    cursor: action.disabled ? "not-allowed" : "pointer",
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
                ...quickActionCircleButtonStyle,
                cursor: "pointer",
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
                    style={dropdownItemButtonStyle}
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
          marginBottom: "12px",
          overflow: "hidden",
          ...sidebarCardStyle,
        }}
      >
        <div
          style={{
            ...sectionHeaderRowStyle,
            padding: "14px 20px",
            cursor: "pointer",
            backgroundColor: "#ffffff",
            borderBottom: collapsedSections.has("key-info") ? "none" : "1px solid #cccccc",
          }}
          onClick={() => toggleSection("key-info")}
        >
          <div style={chevronTitleRowStyle}>
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
          <div style={{
            padding: "20px",
            maxHeight: "480px",
            overflowY: "auto",
          }}>
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
            {/* Record Summary */}
            <CrmRecordSummarySection
              isCollapsed={collapsedSections.has("breeze")}
              onToggle={() => toggleSection("breeze")}
              summary={(company as any)?.crm_summary?.summary ?? null}
              metaLabel={
                (company as any)?.crm_summary?.updated_at
                  ? `Updated ${new Date(
                      (company as any).crm_summary.updated_at,
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
                const id = Number(companyId || company?.id);
                if (!id || Number.isNaN(id)) {
                  toast.error("Invalid company ID");
                  return;
                }
                try {
                  const refreshed = await getCompany(id);
                  setCompany(refreshed);
                  toast.success("Summary refreshed");
                } catch {
                  toast.error("Failed to refresh summary");
                }
              }}
            />

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
            <CrmRevenueQuoteToCash
              sections={revenueSections.slice(0, 5)}
              isCollapsed={collapsedSections.has("quote-to-cash")}
              onToggle={() => toggleSection("quote-to-cash")}
            />
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
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setCompanyToDelete(null);
        }}
        onConfirm={confirmDeleteCompany}
        itemName={companyToDelete?.name ?? company?.name}
        itemType="company"
      />
      {activityModals.modals}
      {showEditCompanySidebar && (
        <CreateCompanySidebar
          onClose={() => setShowEditCompanySidebar(false)}
          initialData={editingCompanyForm}
          editingId={companyRecordId || undefined}
          onSave={handleCompanySave}
        />
      )}
    </>
  );
};

CompanyDetailPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CompanyDetailPage;
