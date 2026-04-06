import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactElement,
} from "react";
import { useRouter } from "next/router";
import {
  ChevronDown,
  ExternalLink,
  FileText,
  Paperclip,
  ShoppingCart,
  Download as DownloadIcon,
  Upload,
  Trash2,
  Ticket,
} from "lucide-react";
import { Modal, Button, Form, Card } from "react-bootstrap";
import { parsePhoneNumber as parsePhoneNumberInput } from "react-phone-number-input";
import Layout from "@layout/index";
import {
  getAllCrmDataById,
  getLead,
  getDeal,
  getOrder,
  getCompany,
  deleteDeal,
  PDFDownloadDeal,
  downloadDealAttachment,
  getDealAttachments,
  uploadDealAttachment,
  deleteDealAttachment,
  getCampaigns,
  getCrmDataTags,
  updateCrmData,
  deleteCrmData,
  deleteLead,
  deleteCompany,
  updateCompany,
  type CrmDataItem,
  type LeadData,
  type DealData,
  type CompanyData,
  type EnrichmentData,
} from "@utils/crm";
import { ModuleSlug, formatDateForTable } from "@utils/Helper";
import moment from "moment-timezone";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import {
  CrmDetailPageLayout,
  type KeyInfoField,
  type ProfileField,
  type CrmDetailPageLayoutConfig,
} from "@utils/crm/common/crm-detail-layout";
import {
  formatCrmAmount,
  formatCrmShortDate,
  formatCrmSummaryUpdatedLabel,
  getCrmExtensionDisplayName,
} from "@utils/crm/common/crm-detail-formatters";
import { getCrmDetailStaticConfig } from "@utils/crm/common/crm-detail-config";
import ProspectEditSidebar, {
  type ProspectFormState as ProspectSidebarFormState,
} from "@components/ProspectEditSidebar";
import { toast } from "react-toastify";
import { GetHierarchyData } from "@utils/users";
import { exportRecordAsCsv } from "@utils/csvExport";
import CrmAssociatedRecordsSectionCard from "@components/CrmAssociatedRecordsSectionCard";
import CrmDealListItemCard from "@components/CrmDealListItemCard";
import CrmTicketListItemCard from "@components/CrmTicketListItemCard";
import {
  buildOrderKeyInfoFields,
  buildOrderProfileFields,
  buildOrderRecordForActivities,
} from "@utils/crm/common/crm-order-detail-builders";
import {
  buildCrmDealsDetailpageHref,
  buildCrmLeadsDetailpageHref,
} from "@utils/crm/common/crm-detail-navigation";

import { CreateCompanySidebar, type CompanyFormPayload } from "@components/renderCreateCompany";
import CreateLeadModal from "@components/CreateLeadModal";
import CrmIntelligenceTab from "@components/CrmIntelligenceTab";
import CrmAssociatedCompaniesCard from "@components/CrmAssociatedCompaniesCard";
import { CreateDealSidebar } from "@components/renderCreateDealForm";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import {
  CrmRevenueQuoteToCash,
  type SubscriptionItem,
  type RevenueSection,
  createDefaultRevenueSections,
} from "@components/CrmRevenueQuoteToCash";

let customFieldIdCounter = 0;
const createCustomFieldId = () =>
  `custom-field-${Date.now()}-${customFieldIdCounter++}`;

const getCrmStatusColor = (status: unknown): string => {
  const s = typeof status === "string" ? status : "";
  if (s === "active") return "#10b981";
  if (s === "cancelled") return "#ef4444";
  return "#f59e0b";
};

const buildDealKeyInfoFields = (params: {
  deal: DealData | null;
  extensions: Array<Record<string, unknown>>;
  formatDealAmount: (d: DealData | null) => string;
}): KeyInfoField[] => {
  const { deal, extensions, formatDealAmount } = params;

  return [
    { label: "Deal Value", value: formatDealAmount(deal), copyable: true },
    { label: "Stage", value: deal?.stage?.name ?? deal?.status ?? "--" },
    { label: "Probability", value: deal == null ? "--" : `${deal.probability ?? 0}%` },
    { label: "Expected Close Date", value: formatCrmShortDate(deal?.expected_close_date) },
    { label: "Company Name", value: deal?.company_name ?? "--" },
    {
      label: "Owner",
      value: (() => {
        const rawOwner = deal?.assigned_to ?? null;
        return getCrmExtensionDisplayName(rawOwner, extensions);
      })(),
    },
  ];
};

const buildDealProfileFields = (deal: DealData | null): ProfileField[] => {
  const d = deal as any;

  return [
    {
      label: "Company name",
      value:
        d?.company?.enrichment_data?.structured_data?.official_company_name ??
        d?.company_name ??
        "--",
    },
    {
      label: "Street address",
      value:
        d?.company?.enrichment_data?.structured_data?.headquarters?.address ??
        d?.company?.address ??
        "--",
    },
    {
      label: "City",
      value:
        d?.company?.enrichment_data?.structured_data?.headquarters?.city ??
        d?.company?.city ??
        "--",
    },
    {
      label: "Postal code",
      value: d?.company?.postal_code ?? d?.company?.zip ?? "--",
    },
    {
      label: "State/Region",
      value: d?.company?.state ?? d?.company?.province ?? "--",
    },
    {
      label: "Email",
      value:
        d?.company?.enrichment_data?.structured_data?.emails?.[0]?.email ??
        d?.decision_maker_email ??
        d?.contact_email ??
        "--",
      link: true,
    },
  ];
};

const buildLeadKeyInfoFields = (params: {
  lead: LeadData | null;
  primaryContact: { email?: string } | null;
  formattedPhoneNumber: string;
  associateName: string;
  crmDataDetails: Record<string, unknown> | undefined;
}): KeyInfoField[] => {
  const { lead, primaryContact, formattedPhoneNumber, associateName, crmDataDetails } = params;
  const l = lead as any;
  const d = crmDataDetails ?? {};

  return [
    {
      label: "Email",
      value: (primaryContact?.email ?? (d as any)?.email ?? "--") as string,
      copyable: true,
    },
    { label: "Phone Number", value: formattedPhoneNumber, copyable: true },
    { label: "Company Name", value: l?.company_name ?? "--" },
    { label: "Company Domain", value: l?.company_domain ?? "--" },
    { label: "Lead Status", value: l?.status ?? "--" },
    {
      label: "Lifecycle Stage",
      value: (d as any)?.lifecycle_stage ?? l?.stage?.name ?? "--",
    },
    { label: "Owner", value: associateName },
    { label: "Source", value: (l?.source ?? "--") as string },
  ];
};

const buildLeadProfileFields = (params: {
  lead: LeadData | null;
  structuredData: Record<string, unknown> | undefined;
  headquartersData: Record<string, unknown> | undefined;
  crmDataDetails: Record<string, unknown> | undefined;
  structuredEmails: Array<{ email?: string }> | undefined;
  contactPersons: Array<{ email?: string; phone?: string }> | undefined;
}): ProfileField[] => {
  const {
    lead,
    structuredData,
    headquartersData,
    crmDataDetails,
    structuredEmails,
    contactPersons,
  } = params;

  const l = lead as any;
  const s = structuredData ?? {};
  const h = headquartersData ?? {};
  const d = crmDataDetails ?? {};

  return [
    {
      label: "Company name",
      value: (s as any)?.official_company_name ?? l?.company_name ?? "--",
    },
    {
      label: "Street address",
      value:
        (h as any)?.address ??
        (d as any)?.street_address ??
        l?.campaign_field_values?.street_address ??
        "--",
    },
    {
      label: "City",
      value:
        (h as any)?.city ?? (d as any)?.city ?? l?.campaign_field_values?.city ?? "--",
    },
    {
      label: "Postal code",
      value: (d as any)?.postal_code ?? l?.campaign_field_values?.postal_code ?? "--",
    },
    {
      label: "State/Region",
      value: (d as any)?.state ?? l?.campaign_field_values?.state ?? "--",
    },
    {
      label: "Email",
      value:
        structuredEmails?.[0]?.email ??
        contactPersons?.[0]?.email ??
        (d as any)?.email ??
        "--",
      link: true,
    },
  ];
};

const buildProspectKeyInfoFields = (params: {
  prospect: CrmDataItem | null;
  firstTicket:
    | { company_name?: string }
    | undefined;
  extensions: Array<Record<string, unknown>>;
}): KeyInfoField[] => {
  const { prospect, firstTicket, extensions } = params;
  const data = prospect?.data as any;

  return [
    {
      label: "Email",
      value: data?.data?.email ?? "--",
      copyable: true,
    },
    {
      label: "Phone Number",
      value: data?.phone ?? "--",
      copyable: true,
    },
    {
      label: "Company Name",
      value:
        firstTicket?.company_name ??
        data?.company_name ??
        data?.name ??
        "--",
    },
    {
      label: "Company Domain",
      value: data?.company_domain ?? "--",
    },
    {
      label: "Owner",
      value: (() => {
        const ownerId = data?.user_extension;
        return getCrmExtensionDisplayName(ownerId, extensions);
      })(),
    },
  ];
};

const buildProspectProfileFields = (prospect: CrmDataItem | null): ProfileField[] => {
  const data = prospect?.data as any;

  return [
    {
      label: "Company name",
      value:
        data?.company?.enrichment_data?.structured_data
          ?.official_company_name ?? data?.company_name ?? "--",
    },
    {
      label: "Street address",
      value:
        data?.company?.enrichment_data?.structured_data?.headquarters?.address ??
        data?.company?.address ??
        "--",
    },
    {
      label: "City",
      value:
        data?.company?.enrichment_data?.structured_data?.headquarters?.city ??
        "--",
    },
    {
      label: "Postal code",
      value: data?.data?.postal_code ?? "--",
    },
    {
      label: "State/Region",
      value:
        data?.company?.enrichment_data?.structured_data?.headquarters?.state ??
        "--",
    },
    {
      label: "Email",
      value:
        data?.company?.enrichment_data?.structured_data?.emails?.[0]?.email ??
        "--",
      link: true,
    },
  ];
};

const buildCompanyKeyInfoFields = (params: {
  company: CompanyData | null;
  primaryPhoneRaw: string;
  websiteUrl: string | null;
}): KeyInfoField[] => {
  const { company, primaryPhoneRaw, websiteUrl } = params;
  const createdValue = company?.created_at ? formatCrmShortDate(company.created_at) : "--";

  return [
    { label: "Email", value: company?.email ?? "--", copyable: true },
    { label: "Phone", value: primaryPhoneRaw || "--", copyable: true },
    { label: "City", value: company?.city ?? "--" },
    { label: "Country", value: company?.country ?? "--" },
    { label: "Industry", value: company?.industry ?? "--" },
    { label: "Domain", value: company?.domain ?? "--" },
    { label: "Website", value: websiteUrl ?? "--", copyable: !!websiteUrl },
    { label: "Created", value: createdValue },
  ];
};

const buildCompanyProfileFields = (params: {
  company: CompanyData | null;
  primaryPhoneRaw: string;
  websiteUrl: string | null;
}): ProfileField[] => {
  const { company, primaryPhoneRaw, websiteUrl } = params;

  return [
    { label: "Company name", value: company?.name ?? "--" },
    { label: "Phone", value: primaryPhoneRaw || "--" },
    { label: "Email", value: company?.email ?? "--", link: true },
    { label: "City", value: company?.city ?? "--" },
    { label: "Country", value: company?.country ?? "--" },
    { label: "Industry", value: company?.industry ?? "--" },
    { label: "Domain", value: company?.domain ?? "--" },
    { label: "Website", value: websiteUrl ?? "--" },
  ];
};

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

type CrmId = string | number | null | undefined;

type NextPageWithLayout = React.FC & {
  getLayout?: (page: ReactElement) => ReactElement;
};

const renderAssociatedRecordsCard = (params: {
  sectionId: string;
  title: string;
  count: number;
  collapsedSections: Set<string>;
  toggleSection: (id: string) => void;
  items: Array<Record<string, unknown>>;
  renderItem: (item: Record<string, unknown>) => React.ReactNode;
  emptyState: React.ReactNode;
  viewAllLabel?: string;
  onViewAllClick?: () => void;
  showAddButton?: boolean;
}) => {
  const {
    sectionId,
    title,
    count,
    collapsedSections,
    toggleSection,
    items,
    renderItem,
    emptyState,
    viewAllLabel,
    onViewAllClick,
    showAddButton,
  } = params;

  return (
    <CrmAssociatedRecordsSectionCard
      sectionId={sectionId}
      title={title}
      count={count}
      collapsedSections={collapsedSections}
      toggleSection={toggleSection}
      items={items}
      renderItem={renderItem}
      emptyState={emptyState}
      viewAllLabel={viewAllLabel}
      onViewAllClick={onViewAllClick}
      {...(showAddButton ? { showAddButton: true } : {})}
    />
  );
};

const renderCompanyAssociatedRecordsExtra = (): React.ReactNode => (
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
    <h3
      style={{
        fontSize: "16px",
        fontWeight: "600",
        color: "#141414",
        margin: "0 0 12px 0",
      }}
    >
      Associated records
    </h3>
    <p style={{ fontSize: "13px", color: "#666666", margin: 0 }}>
      Deals and leads linked to this company will appear here when available.
    </p>
  </div>
);

const ProspectDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id: prospectId } = router.query;

  const [prospect, setProspect] = useState<CrmDataItem | null>(null);
  const [prospectLoading, setProspectLoading] = useState(true);
  const [prospectError, setProspectError] = useState<string | null>(null);
  const [prospectToDelete, setProspectToDelete] = useState<{
    id: number;
    name?: string;
  } | null>(null);
  const [showEditContactSidebar, setShowEditContactSidebar] = useState(false);
  const [editContactLoading, setEditContactLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [availableTags, setAvailableTags] = useState<
    Array<{ value: string; label: string; id: number }>
  >([]);
  const [availableCampaigns, setAvailableCampaigns] = useState<
    Array<{ value: string; label: string; id: number }>
  >([]);
  const [extensions, setExtensions] = useState<Record<string, unknown>[]>([]);
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
    source_file: "",
    custom_fields: [],
  });

  const { hasPermission } = usePermissions();
  const canSendWhatsApp = hasPermission(
    HEADER_CONSTANTS.PERMISSIONS.SEND_WHATSAPP_MESSAGE_CRM
  );

  const prospectRecordId =
    Number(prospectId) || (prospect?.data as { id?: number })?.id || 0;
  const prospectRecordName =
    (prospect?.data as { name?: string })?.name ?? "Prospect";
  const prospectRecordEmail =
    (prospect?.data as { data?: { email?: string } })?.data?.email ?? "";
  const prospectRecordPhone =
    (prospect?.data as { phone?: string })?.phone ?? "";

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

  useEffect(() => {
    if (!showEditContactSidebar || !prospect?.data) return;

    const item = prospect.data as Record<string, unknown>;
    const d = (item.data as Record<string, unknown>) || {};

    const nameParts = ((item.name as string) || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const toDatetimeLocal = (v: string | null | undefined) => {
      if (!v) return "";
      const m = moment(v);
      return m.isValid() ? m.format("YYYY-MM-DDTHH:mm") : "";
    };

    const rawTags =
      (item.tags ?? (item.data as Record<string, unknown>)?.tags ?? d.tags) as
        | unknown[]
        | undefined;

    const tagsArray = Array.isArray(rawTags)
      ? rawTags.map((t: unknown) =>
          typeof t === "string"
            ? { value: t, label: t, id: 0 }
            : {
                value:
                  (t as { name?: string; value?: string; id?: number })?.name ??
                  (t as { name?: string; value?: string })?.value ??
                  String((t as { id?: number })?.id ?? ""),
                label:
                  (t as { name?: string; label?: string; value?: string })?.name ??
                  (t as { name?: string; label?: string; value?: string })?.label ??
                  (t as { value?: string })?.value ??
                  String((t as { id?: number })?.id ?? ""),
                id: Number(
                  (t as { id?: number })?.id ??
                    (t as { tag_id?: number })?.tag_id ??
                    (t as { pivot?: { tag_id?: number } })?.pivot?.tag_id ??
                    0
                ),
              }
        )
      : [];

    let phoneCountryCode = "";
    let phoneNumber = (item.phone as string) ?? "";
    if (typeof item.phone === "string" && item.phone.trim()) {
      try {
        const normalized = item.phone.replaceAll(" ", "");
        const parsed = parsePhoneNumberInput(normalized);
        if (parsed) {
          phoneCountryCode = `+${parsed.countryCallingCode}`;
          phoneNumber = parsed.nationalNumber;
        }
      } catch {
        // keep as-is
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
            .map(([field_name, field_value]) => {
              let normalizedValue = "";
              if (Array.isArray(field_value)) {
                normalizedValue = (field_value as string[]).join(", ");
              } else if (field_value != null) {
                if (typeof field_value === "string") {
                  normalizedValue = field_value.trim();
                } else if (
                  typeof field_value === "number" ||
                  typeof field_value === "boolean"
                ) {
                  normalizedValue = String(field_value);
                }
              }

              return {
                id: createCustomFieldId(),
                field_name,
                field_value: normalizedValue,
              };
            })
            .filter((f) => f.field_name || f.field_value)
        : [];

    setProspectForm({
      firstName,
      lastName,
      email: (d.email as string) ?? (item.email as string) ?? "",
      phone_country_code: phoneCountryCode,
      phoneNumber,
      campaign_id: (item.campaign_id ?? d.campaign_id ?? null) as number | null,
      contact_owner: (() => {
        const v = item.user_extension ?? d.contact_owner ?? item.contact_owner;
        if (v == null) {
          return null;
        }
        if (typeof v === "string") {
          return v;
        }
        if (typeof v === "number") {
          return v.toString();
        }
        if (typeof v === "boolean") {
          return v ? "true" : "false";
        }
        if (typeof v === "bigint") {
          return v.toString();
        }
        if (typeof v === "object") {
          try {
            return JSON.stringify(v);
          } catch {
            return null;
          }
        }
        return null;
      })(),
      lifecycle_stage: (d.lifecycle_stage as string) ?? "",
      disposition: (d.disposition as string) ?? (item.disposition as string) ?? "",
      legal_basis: Array.isArray(d.legal_basis) ? (d.legal_basis as string[]) : [],
      company_domain: (item.company_domain ?? d.company_domain ?? "") as string,
      scheduled_call_at: toDatetimeLocal(
        (item.scheduled_call_at ?? d.scheduled_call_at) as string
      ),
      tags: tagsArray as Array<{ value: string; label: string; id: number }>,
      note: (item.note ?? d.note ?? "") as string,
      source_file: (item.source_file ?? d.source ?? item.source ?? "") as string,
      custom_fields: customFieldsArray,
    });
  }, [showEditContactSidebar, prospect]);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const campaignsResponse = await getCampaigns({ per_page: 1000 });
        const campaignOptions = campaignsResponse.data.map(
          (campaign: { id: number; name: string }) => ({
            value: campaign.id.toString(),
            label: campaign.name,
            id: campaign.id,
          })
        );
        setAvailableCampaigns(campaignOptions);
      } catch (error) {
        console.error("Failed to load campaigns:", error);
        setAvailableCampaigns([]);
      }
    };

    const fetchExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData(
          ModuleSlug.CRM_DATA_MANAGEMENT
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
        const tagOptions = tags.map((tag: { id: number; name: string }) => ({
          value: tag.name,
          label: tag.name,
          id: tag.id,
        }));
        setAvailableTags(tagOptions);
      } catch (error) {
        console.error("Failed to load tags:", error);
        setAvailableTags(
          staticTags.map((tag) => ({
            value: tag.value,
            label: tag.label,
            id: Number.parseInt(tag.value.replace("tag-", "")) || 0,
          }))
        );
      }
    };

    fetchExtensions();
    loadCampaigns();
    loadTags();
  }, [showEditContactSidebar]);

  const firstTicket = (prospect?.data as { tickets?: unknown[] })?.tickets?.[0] as
    | { company_name?: string }
    | undefined;

  const keyInfoFields: KeyInfoField[] = useMemo(
    () =>
      buildProspectKeyInfoFields({
        prospect,
        firstTicket,
        extensions,
      }),
    [prospect, firstTicket, extensions]
  );

  const profileFields: ProfileField[] = useMemo(
    () => buildProspectProfileFields(prospect),
    [prospect]
  );

  const prospectData = prospect?.data as Record<string, unknown> | undefined;
  const company = prospectData?.company as Record<string, unknown> | undefined;
  const enrichmentData = company?.enrichment_data as Record<string, unknown> | undefined;
  const struct = enrichmentData?.structured_data as Record<string, unknown> | undefined;

  const associatedCompany = useMemo(
    () => ({
      companyName:
        (struct?.official_company_name as string) ??
        (company?.name as string) ??
        (prospectData?.company_name as string) ??
        null,
      primaryPhone:
        (struct?.phones as { number?: string }[])?.[0]?.number ??
        (company?.phone as string) ??
        (prospectData?.company_contact as string) ??
        null,
      phones: (struct?.phones as { number?: string; type?: string | null }[])?.map(
        (p: { number?: string; type?: string | null }) => ({
          number: p?.number ?? "",
          type: p?.type ?? null,
        })
      ),
      companyId:
        (company?.id ?? prospectData?.company_id ?? (prospectData?.company as { company_id?: number })?.company_id) as
          | string
          | number
          | null,
    }),
    [company, struct, prospectData]
  );

  const handleRefreshSummary = useCallback(async () => {
    const id = Number(
      prospectId || (prospect?.data as { id?: number })?.id || prospect?.id
    );
    if (!id || Number.isNaN(id)) {
      toast.error("Invalid prospect ID");
      return;
    }

    try {
      const refreshed = await getAllCrmDataById(id);
      setProspect((prev) => {
        if (!prev) return refreshed;
        const refreshedSummary = (refreshed as { data?: { crm_summary?: unknown } })?.data?.crm_summary;
        if (!refreshedSummary) return prev;
        return {
          ...prev,
          data: {
            crm_summary: refreshedSummary,
            ...prev.data,
          },
        };
      });
      toast.success("Summary refreshed");
    } catch {
      toast.error("Failed to refresh summary");
    }
  }, [prospectId, prospect]);

  const handleExport = useCallback(() => {
    if (!prospect?.data) return;
    setExporting(true);
    try {
      exportRecordAsCsv({
        row: prospect.data as unknown as Record<string, unknown>,
        fileName: `prospect_${(prospect.data as { id?: number })?.id ?? prospectRecordId}.csv`,
      });
      toast.success("Exported prospect successfully!");
    } catch (err) {
      toast.error("Failed to export prospect");
      console.error("Failed to export prospect:", err);
    } finally {
      setExporting(false);
    }
  }, [prospect, prospectRecordId]);

  const handleDeleteSuccess = useCallback(async () => {
    if (!prospectToDelete) return;
    await deleteCrmData(prospectToDelete.id);
  }, [prospectToDelete]);

  const handleUpdateContactSubmit = useCallback(
    async (data: ProspectSidebarFormState & { id?: number }) => {
      const name = [data.firstName, data.lastName].filter(Boolean).join(" ").trim();
      if (data.id == null) {
        toast.error("Prospect not found");
        return;
      }

      if (!name || !data.email?.trim() || !data.phoneNumber?.trim()) {
        toast.error("Name, email and phone are required");
        return;
      }

      const phoneForPayload =
        data.phone_country_code && data.phoneNumber?.trim()
          ? `${data.phone_country_code} ${data.phoneNumber.trim()}`
          : data.phoneNumber?.trim() ?? "";

      const customFieldsForPayload = (data.custom_fields ?? [])
        .map(
          (f: { field_name?: string; field_value?: string }) => ({
            field_name: String(f.field_name ?? "").trim(),
            field_value: String(f.field_value ?? "").trim(),
          })
        )
        .filter(
          (f: { field_name: string; field_value: string }) =>
            f.field_name || f.field_value
        );

      const dataPayload: Record<string, unknown> = {
        email: data.email.trim(),
        disposition: data.disposition || undefined,
        note: data.note || undefined,
        contact_owner: data.contact_owner ?? undefined,
        legal_basis: data.legal_basis?.length ? data.legal_basis : undefined,
      };

      customFieldsForPayload.forEach(
        (f: { field_name: string; field_value: string }) => {
          dataPayload[f.field_name] = f.field_value;
        }
      );

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
        // Error shown by updateCrmData
      } finally {
        setEditContactLoading(false);
      }
    },
    [],
  );

  const allDeals =
    (prospect?.data as { tickets?: { deals?: unknown[] }[] })?.tickets?.flatMap(
      (t: { deals?: unknown[] }) => t.deals ?? []
    ) ?? [];

  const leads = (prospect?.data as { tickets?: unknown[] })?.tickets ?? [];

  const detailStaticConfig = getCrmDetailStaticConfig("prospect");

  const config: CrmDetailPageLayoutConfig = {
    recordType: "prospect",
    recordId: prospectRecordId,
    recordName: prospectRecordName,
    recordEmail: prospectRecordEmail,
    recordPhone: prospectRecordPhone,
    record: prospect,
    recordLoading: prospectLoading,
    recordError: prospectError,
    hasRecord: !!prospect,
    ...detailStaticConfig,
    keyInfoFields,
    profileFields,
    summary:
      (prospect as { crm_summary?: { summary?: string } })?.crm_summary?.summary ??
      (prospect?.data as { crm_summary?: { summary?: string } })?.crm_summary?.summary ??
      (prospect?.data as { data?: { crm_summary?: { summary?: string } } })?.data?.crm_summary?.summary ??
      null,
    summaryMetaLabel: formatCrmSummaryUpdatedLabel(
      (prospect?.data as { crm_summary?: { updated_at?: string } })?.crm_summary?.updated_at
    ),
    onRefreshSummary: handleRefreshSummary,
    company: (prospect?.data as { company?: unknown })?.company ?? null,
    relatedCompany: (prospect?.data as { company_name?: string })?.company_name ?? "—",
    exporting,
    onEdit: () => setShowEditContactSidebar(true),
    onDelete: () =>
      setProspectToDelete({
        id: prospectRecordId,
        name: (prospect?.data as { name?: string })?.name,
      }),
    onExport: handleExport,
    deleteItemName: prospectToDelete?.name ?? prospectRecordName,
    onDeleteSuccess: handleDeleteSuccess,
    avatarDisplayName: (prospect?.data as { name?: string })?.name ?? "—",
    avatarSubtitle: firstTicket?.company_name
      ? `Director at ${firstTicket.company_name}`
      : "Prospect",
    primaryEmail: (prospect?.data as { data?: { email?: string } })?.data?.email ?? "",
    activitiesRecord: prospect
      ? {
          data: prospect.data,
          audit_trail: (prospect as { audit_trail?: unknown })?.audit_trail,
        }
      : null,
    associatedCompany,
    onWhatsAppChatClick: (chat) => {
      router.push(`/crm/inbox?chat_id=${chat.id}`);
    },
    renderEditModal: () => {
      if (!showEditContactSidebar) return null;

      const isFormValid =
        prospectForm?.email?.trim() &&
        prospectForm?.phoneNumber?.trim() &&
        prospectForm?.firstName?.trim() &&
        prospectForm?.lastName?.trim();

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
              id: (prospect?.data as { id?: number })?.id,
            })
          }
        />
      );
    },
    renderRightSidebarExtra: ({ collapsedSections, toggleSection }) => (
      <>
        {renderAssociatedRecordsCard({
          sectionId: "deals",
          title: "Deals",
          count: allDeals.length,
          collapsedSections,
          toggleSection,
          items: allDeals as Record<string, unknown>[],
          renderItem: (deal) => <CrmDealListItemCard deal={deal} />,
          emptyState: (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <Ticket size={48} style={{ color: "#cbd5e0", marginBottom: "16px" }} />
              <p style={{ fontSize: "14px", color: "#718096", margin: 0, lineHeight: "1.6" }}>
                Track the customer requests associated with this record.
              </p>
            </div>
          ),
          viewAllLabel: "View all associated Deals",
          onViewAllClick: () => {
            const firstDeal = allDeals[0] as Record<string, unknown>;
            const href = buildCrmDealsDetailpageHref(firstDeal?.id as CrmId);
            window.open(href, "_blank", "noopener,noreferrer");
          },
        })}

        {renderAssociatedRecordsCard({
          sectionId: "tickets",
          title: "Leads",
          count: leads.length,
          collapsedSections,
          toggleSection,
          items: leads as Record<string, unknown>[],
          renderItem: (lead) => <CrmTicketListItemCard lead={lead} />,
          emptyState: (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <Ticket size={48} style={{ color: "#cbd5e0", marginBottom: "16px" }} />
              <p style={{ fontSize: "14px", color: "#718096", margin: 0, lineHeight: "1.6" }}>
                Track the customer requests associated with this record.
              </p>
            </div>
          ),
          viewAllLabel: "View all associated Leads",
          onViewAllClick: () => {
            const firstLead = leads[0] as Record<string, unknown>;
            const href = buildCrmLeadsDetailpageHref(firstLead?.id as CrmId);
            window.open(href, "_blank", "noopener,noreferrer");
          },
        })}
      </>
    ),
  };

  return <CrmDetailPageLayout config={config} canSendWhatsApp={canSendWhatsApp} />;
};

ProspectDetailPage.getLayout = (page: ReactElement) => (
  <Layout>{page}</Layout>
);

const LeadDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id: leadId } = (router.query as { id?: string }) ?? {};

  const [lead, setLead] = useState<LeadData | null>(null);
  const [leadLoading, setLeadLoading] = useState(true);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<{
    id: number;
    name?: string;
  } | null>(null);
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [editLeadIdForSidebar, setEditLeadIdForSidebar] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [extensions, setExtensions] = useState<Record<string, unknown>[]>([]);

  const { hasPermission } = usePermissions();
  const canSendWhatsApp = hasPermission(
    HEADER_CONSTANTS.PERMISSIONS.SEND_WHATSAPP_MESSAGE_CRM
  );

  const leadRecordId = Number(leadId) || lead?.id || 0;
  const leadRecordName = lead?.name ?? "Lead";
  const contactPersons = (lead as unknown as Record<string, unknown>)?.contact_persons as
    | Array<{ email?: string; phone?: string }>
    | undefined;
  const crmData = (lead as unknown as Record<string, unknown>)?.crm_data as
    | Record<string, unknown>
    | undefined;
  const crmDataDetails = (crmData?.data as Record<string, unknown> | undefined) ?? undefined;
  const crmDataPhone = crmData?.phone as string | undefined;
  const companyData = (lead as unknown as Record<string, unknown>)?.company as
    | Record<string, unknown>
    | undefined;
  const enrichmentData = (companyData?.enrichment_data as Record<string, unknown> | undefined) ?? undefined;
  const structuredData = (enrichmentData?.structured_data as Record<string, unknown> | undefined) ?? undefined;
  const headquartersData = (structuredData?.headquarters as Record<string, unknown> | undefined) ?? undefined;
  const structuredEmails = Array.isArray(structuredData?.emails)
    ? (structuredData.emails as Array<{ email?: string }>)
    : undefined;
  const structuredPhones = Array.isArray(structuredData?.phones)
    ? (structuredData.phones as Array<{ number?: string; type?: string | null }>)
    : undefined;

  const leadRecordEmail =
    contactPersons?.[0]?.email ??
    (crmDataDetails?.email as string | undefined) ??
    "";
  const leadRecordPhone =
    contactPersons?.[0]?.phone ??
    crmDataPhone ??
    lead?.company_contact ??
    "";

  const leadRecord = lead
    ? {
        data: {
          id: lead.id,
          name: lead.name,
          phone: (lead as unknown as Record<string, unknown>).phone ?? lead.company_contact ?? null,
          data: (lead as unknown as Record<string, unknown>).campaign_field_values ?? {},
        },
        audit_trail: lead.audit_trail,
      }
    : null;

  useEffect(() => {
    if (!router.isReady) return;
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

  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_LEADS);
        if (hierarchyData?.extensions) {
          setExtensions((hierarchyData.extensions ?? []) as Record<string, unknown>[]);
        }
      } catch (error) {
        console.error("Failed to fetch extensions:", error);
      }
    };
    fetchExtensions();
  }, []);

  const leadAny = lead as Record<string, unknown> | null;
  const leadContacts = leadAny?.contact_persons;
  const primaryContact =
    Array.isArray(leadContacts) && leadContacts.length > 0
      ? (leadContacts[0] as { phone_country_code?: string; phone?: string; email?: string })
      : null;
  const primaryPhoneCountryCode = primaryContact?.phone_country_code ?? "";
  const primaryPhoneNumber = primaryContact?.phone ?? "";
  const formattedPhoneNumber =
    primaryPhoneCountryCode && primaryPhoneNumber
      ? `${primaryPhoneCountryCode} ${primaryPhoneNumber}`
      : primaryPhoneNumber || crmDataPhone || lead?.company_contact || "--";

  const associateName = (() => {
    const rawAssociate =
      (lead as unknown as Record<string, unknown>)?.user_extension ??
      (lead as unknown as Record<string, unknown>)?.created_by ??
      (lead as unknown as Record<string, unknown>)?.owner_id ??
      null;

    if (rawAssociate != null) {
      return getCrmExtensionDisplayName(rawAssociate, extensions);
    }

    return (
      ((lead as unknown as Record<string, unknown>)?.created_by_name as string) ??
      ((lead as unknown as Record<string, unknown>)?.owner_name as string) ??
      ((lead as unknown as Record<string, unknown>)?.user_extension_name as string) ??
      "--"
    );
  })();

  const keyInfoFields: KeyInfoField[] = useMemo(
    () =>
      buildLeadKeyInfoFields({
        lead,
        primaryContact,
        formattedPhoneNumber,
        associateName,
        crmDataDetails,
      }),
    [lead, primaryContact, formattedPhoneNumber, associateName]
  );

  const profileFields: ProfileField[] = useMemo(
    () =>
      buildLeadProfileFields({
        lead,
        structuredData,
        headquartersData,
        crmDataDetails,
        structuredEmails,
        contactPersons,
      }),
    [lead, structuredEmails, contactPersons, crmDataDetails, headquartersData]
  );

  const associatedCompany = useMemo(
    () => ({
      companyName:
        (structuredData?.official_company_name as string | undefined) ??
        (companyData?.name as string | undefined) ??
        lead?.company_name ??
        null,
      primaryPhone:
        structuredPhones?.[0]?.number ??
        (companyData?.phone as string | undefined) ??
        lead?.company_contact ??
        null,
      phones: structuredPhones?.map((p: { number?: string; type?: string | null }) => ({
        number: p?.number ?? "",
        type: p?.type ?? null,
      })),
      companyId:
        ((companyData?.id as string | number | undefined) ??
          (lead as unknown as Record<string, unknown>)?.company_id ??
          null) as string | number | null,
    }),
    [companyData, structuredData, lead, structuredPhones]
  );

  const handleRefreshSummary = useCallback(async () => {
    const id = Number(leadId || lead?.id);
    if (!id || Number.isNaN(id)) {
      toast.error("Invalid lead ID");
      return;
    }
    try {
      const refreshed = await getLead(id);
      setLead(refreshed);
      toast.success("Summary refreshed");
    } catch {
      toast.error("Failed to refresh summary");
    }
  }, [leadId, lead?.id]);

  const handleExport = useCallback(() => {
    if (!lead) return;
    setExporting(true);
    try {
      exportRecordAsCsv({
        row: lead as unknown as Record<string, unknown>,
        fileName: `lead_${lead.id}.csv`,
        excludeKeys: ["campaign", "stage", "contact_persons", "audit_trail"],
      });
      toast.success("Exported lead successfully!");
    } catch (err) {
      toast.error("Failed to export lead");
      console.error("Failed to export lead:", err);
    } finally {
      setExporting(false);
    }
  }, [lead]);

  const handleDeleteSuccess = useCallback(async () => {
    if (!leadToDelete) return;
    await deleteLead(leadToDelete.id);
  }, [leadToDelete]);

  const allDeals = ((lead as unknown as Record<string, unknown>)?.deals as unknown[]) ?? [];
  const dealsCount = allDeals.length;
  const detailStaticConfig = getCrmDetailStaticConfig("lead");

  const config: CrmDetailPageLayoutConfig = {
    recordType: "lead",
    recordId: leadRecordId,
    recordName: leadRecordName,
    recordEmail: leadRecordEmail,
    recordPhone: leadRecordPhone,
    record: lead,
    recordLoading: leadLoading,
    recordError: leadError,
    hasRecord: !!lead,
    ...detailStaticConfig,
    keyInfoFields,
    profileFields,
    summary:
      ((((lead as unknown as Record<string, unknown>)?.crm_summary as Record<string, unknown> | undefined)?.summary as
        string | undefined) ?? null),
    summaryMetaLabel: formatCrmSummaryUpdatedLabel(lead?.updated_at),
    onRefreshSummary: handleRefreshSummary,
    company: companyData ?? null,
    relatedCompany: lead?.company_name ?? "—",
    exporting,
    onEdit: () => {
      if (leadRecordId) {
        setEditLeadIdForSidebar(leadRecordId);
        setShowCreateLeadModal(true);
      }
    },
    onDelete: () => setLeadToDelete({ id: leadRecordId, name: leadRecordName }),
    onExport: handleExport,
    deleteItemName: leadToDelete?.name ?? leadRecordName,
    onDeleteSuccess: handleDeleteSuccess,
    avatarDisplayName: lead?.name ?? "—",
    avatarSubtitle: lead?.company_name ? `at ${lead.company_name}` : "—",
    primaryEmail:
      contactPersons?.[0]?.email ??
      (crmDataDetails?.email as string | undefined) ??
      "",
    activitiesRecord: leadRecord,
    associatedCompany,
    renderEditModal: () =>
      showCreateLeadModal ? (
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
      ) : null,
    renderRightSidebarExtra: ({ collapsedSections, toggleSection }) => (
      renderAssociatedRecordsCard({
        sectionId: "deals",
        title: "Deals",
        count: dealsCount,
        collapsedSections,
        toggleSection,
        items: allDeals as Record<string, unknown>[],
        renderItem: (deal) => <CrmDealListItemCard deal={deal} />,
        showAddButton: true,
        emptyState: (
          <p style={{ fontSize: "13px", color: "#666666", margin: 0 }}>
            No deals associated.
          </p>
        ),
        viewAllLabel: "View all associated Deals",
        onViewAllClick: () => {
          const firstDeal = allDeals[0] as Record<string, unknown>;
          const href = buildCrmDealsDetailpageHref(firstDeal?.id as CrmId);
          window.open(href, "_blank", "noopener,noreferrer");
        },
      })
    ),
  };

  return <CrmDetailPageLayout config={config} canSendWhatsApp={canSendWhatsApp} />;
};

LeadDetailPage.getLayout = (page: ReactElement) => (
  <Layout>{page}</Layout>
);

// ============================================================================
// DEAL TYPE IMPLEMENTATION (collapsed into unified dispatcher)
// ============================================================================

type CollapsibleSectionHeaderProps = {
  isCollapsed: boolean;
  onToggle: () => void;
  title: string;
  titleTag: "h2" | "h3";
  titleFontSize: string;
  chevronSize: number;
  rightButtonLabel?: string;
  onRightButtonClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  showBorderBottom?: boolean;
};

const CollapsibleSectionHeader: React.FC<CollapsibleSectionHeaderProps> = ({
  isCollapsed,
  onToggle,
  title,
  titleTag,
  titleFontSize,
  chevronSize,
  rightButtonLabel,
  onRightButtonClick,
  showBorderBottom = false,
}) => {
  const chevronStyle: React.CSSProperties = {
    color: "#141414",
    transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
    transition: "transform 0.2s ease",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: titleFontSize,
    fontWeight: "600",
    color: "#141414",
    margin: 0,
  };

  let borderBottomStyle: React.CSSProperties["borderBottom"] = undefined;
  if (showBorderBottom) {
    borderBottomStyle = isCollapsed ? "none" : "1px solid #cccccc";
  }

  const renderTitle = () => {
    if (titleTag === "h2") return <h2 style={titleStyle}>{title}</h2>;
    return <h3 style={titleStyle}>{title}</h3>;
  };

  return rightButtonLabel ? (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 20px",
        cursor: "pointer",
        backgroundColor: "#ffffff",
        borderBottom: borderBottomStyle,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flex: 1,
          background: "transparent",
          border: "none",
          padding: 0,
          margin: 0,
          textAlign: "left",
          cursor: "pointer",
          font: "inherit",
          color: "inherit",
        }}
      >
        <ChevronDown size={chevronSize} style={chevronStyle} />
        {renderTitle()}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRightButtonClick?.(e);
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
        type="button"
      >
        {rightButtonLabel}
      </button>
    </div>
  ) : (
    <button
      type="button"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "16px",
        cursor: "pointer",
        background: "transparent",
        border: "none",
        padding: 0,
        textAlign: "left",
        font: "inherit",
        color: "inherit",
      }}
      onClick={onToggle}
    >
      <ChevronDown size={chevronSize} style={chevronStyle} />
      {renderTitle()}
    </button>
  );
};

const DealDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id: dealId } = router.query;
  const { hasPermission } = usePermissions();
  const canSendWhatsApp = hasPermission(
    HEADER_CONSTANTS.PERMISSIONS.SEND_WHATSAPP_MESSAGE_CRM
  );

  const [deal, setDeal] = useState<DealData | null>(null);
  const [dealLoading, setDealLoading] = useState(true);
  const [dealError, setDealError] = useState<string | null>(null);

  // Edit Deal sidebar (same CreateDealSidebar as list page)
  const [showCreateDealSidebar, setShowCreateDealSidebar] = useState(false);
  const [editDealIdForSidebar, setEditDealIdForSidebar] = useState<number | null>(null);

  const [dealToDelete, setDealToDelete] = useState<{ id: number; name?: string } | null>(null);

  const [extensions, setExtensions] = useState<any[]>([]);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<number | null>(null);

  // Manage Attachments modal
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showDeleteAttachmentModal, setShowDeleteAttachmentModal] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<{ id: number; name: string } | null>(null);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);

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

  // Load extensions (owners/assignees) for friendly Deal Owner names
  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_DEALS);
        if (hierarchyData?.extensions) setExtensions(hierarchyData.extensions);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch extensions:", error);
      }
    };
    fetchExtensions().catch((error) => {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch extensions:", error);
    });
  }, []);

  const subscriptionsData: SubscriptionItem[] = [
    {
      id: "1",
      name: "Connect Pro",
      status: "active",
      nextBillingDate: "03/13/2026",
      nextPaymentAmount: "$500.00",
      contactEmail: "ahmad@gmail.com",
      link: "#",
    },
  ];

  const revenueSections: RevenueSection[] = createDefaultRevenueSections(
    subscriptionsData.length,
    subscriptionsData
  );

  const formatDealAmount = (d: DealData | null) => {
    if (!d) return "--";
    return formatCrmAmount(d as unknown as Record<string, unknown>);
  };

  // Key Information Fields - from deal API
  const keyInfoFields: KeyInfoField[] = buildDealKeyInfoFields({
    deal,
    extensions: extensions as Array<Record<string, unknown>>,
    formatDealAmount,
  });

  // Normalize deal for CrmActivitiesPanel (include audit_trail so Activity tab shows deal history)
  const dealRecord = deal
    ? {
        id: deal.id,
        data: {
          id: deal.id,
          name: deal.name,
          phone: (deal as any).decision_maker_phone ?? (deal as any).phone ?? null,
          data: {},
        },
        audit_trail: deal.audit_trail ?? [],
      }
    : null;

  const dealRecordId = Number(dealId) || deal?.id || 0;
  const dealRecordName = deal?.name ?? "Deal";
  const dealRecordEmail =
    (deal as any)?.contact_email ??
    (deal as any)?.decision_maker_email ??
    (deal as any)?.main_decision_maker?.email ??
    "";
  const dealRecordPhone = (deal as any)?.phone ?? deal?.decision_maker_phone ?? "";

  const handleOpenEditDeal = useCallback(() => {
    if (!dealRecordId) return;
    const id = dealRecordId;
    setEditDealIdForSidebar(id);
    setShowCreateDealSidebar(true);
  }, [dealRecordId]);

  const handleDealExport = useCallback(async () => {
    if (!dealRecordId) return;
    setExporting(true);
    try {
      const id = dealRecordId;
      await PDFDownloadDeal(id);
      toast.success("Exported deal successfully!");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to export deal:", error);
      toast.error("Failed to export deal");
    } finally {
      setExporting(false);
    }
  }, [dealRecordId]);

  const handleDownloadAttachment = useCallback(
    async (attachmentId: number) => {
      if (!dealRecordId) return;
      setDownloadingAttachmentId(attachmentId);
      try {
        const id = dealRecordId;
        await downloadDealAttachment(id, attachmentId);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to download attachment:", error);
        toast.error("Failed to download attachment");
      } finally {
        setDownloadingAttachmentId(null);
      }
    },
    [dealRecordId]
  );

  // Fetch attachments when Manage Attachments modal opens
  useEffect(() => {
    if (showAttachmentModal && dealRecordId) {
      const fetchAttachments = async () => {
        setLoadingAttachments(true);
        try {
          const data = await getDealAttachments(dealRecordId);
          setAttachments(data || []);
        } catch {
          setAttachments([]);
        } finally {
          setLoadingAttachments(false);
        }
      };
      fetchAttachments();
    } else {
      setAttachments([]);
    }
  }, [showAttachmentModal, dealRecordId]);

  const refetchDealForAttachments = useCallback(async () => {
    if (!dealRecordId) return;
    try {
      const data = await getDeal(dealRecordId);
      setDeal(data);
    } catch {
      // ignore
    }
  }, [dealRecordId]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
    );
  };

  const getAttachmentBackgroundColor = (mimeType?: string | null): string => {
    if (!mimeType) return "#6c757d";
    if (mimeType.includes("pdf")) return "#dc3545";
    if (
      mimeType.includes("csv") ||
      mimeType.includes("excel") ||
      mimeType.includes("spreadsheet")
    ) {
      return "#198754";
    }
    if (mimeType.includes("image")) return "#0d6efd";
    return "#6c757d";
  };

  const getAttachmentDisplayName = (attachment: any): string => {
    if (attachment.name) return attachment.name;
    if (attachment.original_name) return attachment.original_name;
    if (attachment.file_path) {
      const segments = String(attachment.file_path).split("/");
      const lastSegment = segments.at(-1);
      if (lastSegment) return lastSegment;
    }
    return `Attachment ${attachment.id}`;
  };

  const renderAttachmentCard = (attachment: any): React.ReactNode => {
    const backgroundColor = getAttachmentBackgroundColor(attachment.mime_type);
    const displayName = getAttachmentDisplayName(attachment);

    return (
      <Card key={attachment.id} className="border shadow-sm">
        <Card.Body className="p-3">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3 flex-grow-1">
              <div
                className="rounded d-flex align-items-center justify-content-center"
                style={{
                  width: "45px",
                  height: "45px",
                  background: backgroundColor,
                  color: "white",
                }}
              >
                <FileText size={22} />
              </div>
              <div className="flex-grow-1">
                <div className="fw-semibold" style={{ fontSize: "14px" }}>
                  {displayName}
                </div>
                <div style={{ fontSize: "12px", color: "#6c757d" }}>
                  {attachment.file_size == null
                    ? null
                    : formatFileSize(attachment.file_size)}
                  {attachment.created_at
                    ? ` • ${formatDateForTable(attachment.created_at)}`
                    : ""}
                </div>
              </div>
            </div>
            <div className="d-flex gap-1">
              <Button
                variant="link"
                size="sm"
                className="p-2 text-primary"
                title="Download"
                onClick={() => handleDownloadAttachment(attachment.id)}
              >
                <DownloadIcon size={18} />
              </Button>
              <Button
                variant="link"
                size="sm"
                className="p-2 text-danger"
                title="Delete"
                onClick={() => {
                  setAttachmentToDelete({
                    id: attachment.id,
                    name: getAttachmentDisplayName(attachment),
                  });
                  setShowDeleteAttachmentModal(true);
                }}
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  };

  const renderAttachmentsEmptyState = (): React.ReactNode => (
    <div className="text-center py-4 text-muted">
      <Paperclip size={48} className="mb-3 opacity-25" />
      <div>No attachments yet</div>
      <small>Upload files using the form above</small>
    </div>
  );

  const renderAttachmentUploadPanel = (): React.ReactNode => (
    <div className="mb-4 p-4 border rounded" style={{ background: "#f8f9fa" }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h6 className="mb-1 fw-bold">Upload New Attachments</h6>
          <small className="text-muted">
            Supported formats: PDF, CSV, Excel, or Image (Max 5MB)
          </small>
        </div>
      </div>
      <div className="d-flex gap-2">
        <Form.Control
          ref={(input) => setFileInputRef(input as HTMLInputElement)}
          type="file"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files?.length) handleDealFileUpload(files[0]);
          }}
          accept=".pdf,.csv,.xls,.xlsx,.xlsm,.png,.jpg,.jpeg,.gif,.webp"
          style={{ flex: 1 }}
          disabled={uploadingFile}
        />
        <Button
          variant="primary"
          className="d-flex align-items-center gap-2"
          disabled={uploadingFile}
        >
          {uploadingFile ? "Uploading..." : <><Upload size={16} />Upload</>}
        </Button>
      </div>
    </div>
  );

  const handleDealFileUpload = async (file: File) => {
    if (!dealRecordId) return;
    setUploadingFile(true);
    try {
      await uploadDealAttachment(dealRecordId, file, file.name);
      const data = await getDealAttachments(dealRecordId);
      setAttachments(data || []);
      await refetchDealForAttachments();
      if (fileInputRef) {
        fileInputRef.value = "";
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to upload file:", error);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteDealAttachment = useCallback(
    async (attachmentId: number) => {
      if (!dealRecordId) return;
      try {
        await deleteDealAttachment(dealRecordId, attachmentId);
        const data = await getDealAttachments(dealRecordId);
        setAttachments(data || []);
        await refetchDealForAttachments();
        toast.success("Attachment deleted successfully!");
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to delete attachment:", error);
        toast.error("Failed to delete attachment");
      }
    },
    [dealRecordId, refetchDealForAttachments]
  );

  const confirmDeleteAttachment = useCallback(async () => {
    if (!attachmentToDelete) return;
    await handleDeleteDealAttachment(attachmentToDelete.id);
    setShowDeleteAttachmentModal(false);
    setAttachmentToDelete(null);
  }, [attachmentToDelete, handleDeleteDealAttachment]);

  const profileFields: ProfileField[] = buildDealProfileFields(deal);

  const detailStaticConfig = getCrmDetailStaticConfig("deal");

  const config: CrmDetailPageLayoutConfig = {
    recordType: "deal",
    recordId: dealRecordId,
    recordName: dealRecordName,
    recordEmail: dealRecordEmail,
    recordPhone: dealRecordPhone,
    record: deal,
    recordLoading: dealLoading,
    recordError: dealError,
    hasRecord: !!dealId || !!deal,
    ...detailStaticConfig,
    keyInfoFields: keyInfoFields.map((field) => ({
      ...field,
      value: String(field.value ?? "--"),
    })),
    profileFields,
    profileSectionTitle: "Deal profile",
    summary: (deal as any)?.crm_summary?.summary ?? null,
    summaryMetaLabel: formatCrmSummaryUpdatedLabel(
      (deal as any)?.crm_summary?.updated_at
    ),
    onRefreshSummary: async () => {
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
    },
    company: (deal as any)?.company ?? null,
    relatedCompany: deal?.company_name ?? "--",
    exporting,
    onEdit: handleOpenEditDeal,
    onDelete: () =>
      setDealToDelete({ id: dealRecordId, name: dealRecordName }),
    onExport: () => {
      handleDealExport().then(() => undefined);
    },
    deleteItemName: dealToDelete?.name ?? dealRecordName,
    onDeleteSuccess: async () => {
      if (!dealToDelete) return;
      await deleteDeal(dealToDelete.id);
      setDealToDelete(null);
    },
    avatarDisplayName: deal?.name ?? "Deal",
    avatarSubtitle: `${formatDealAmount(deal)} • ${deal?.stage?.name ?? deal?.status ?? "--"}`,
    primaryEmail: dealRecordEmail,
    headerSecondaryText: `Expected Close: ${formatCrmShortDate(deal?.expected_close_date)}`,
    activitiesRecord: dealRecord,
    associatedCompany: {
      companyName:
        (deal as any)?.company?.enrichment_data?.structured_data
          ?.official_company_name ?? deal?.company_name ?? null,
      primaryPhone:
        (deal as any)?.company?.enrichment_data?.structured_data
          ?.phones?.[0]?.number ?? (deal as any)?.company?.phone ?? null,
      phones: ((deal as any)?.company?.enrichment_data?.structured_data?.phones ?? []).map(
        (p: any) => ({
          number: p?.number ?? "",
          type: p?.type ?? null,
        })
      ),
      companyId:
        (deal as any)?.company?.id ?? (deal as any)?.company_id ?? null,
    },
    rightSidebarSections: [
      {
        id: "company",
        render: ({ collapsedSections, toggleSection }) => (
          <CrmAssociatedCompaniesCard
            sectionId="companies"
            collapsedSections={collapsedSections}
            toggleSection={toggleSection}
            companyName={
              (deal as any)?.company?.enrichment_data?.structured_data
                ?.official_company_name ?? deal?.company_name ?? null
            }
            primaryPhone={
              (deal as any)?.company?.enrichment_data?.structured_data
                ?.phones?.[0]?.number ?? (deal as any)?.company?.phone ?? null
            }
            phones={((deal as any)?.company?.enrichment_data?.structured_data?.phones ?? []).map(
              (p: any) => ({
                number: p?.number ?? "",
                type: p?.type ?? null,
              })
            )}
            companyId={(deal as any)?.company?.id ?? (deal as any)?.company_id ?? null}
            viewAllLabel="View all associated Companies"
            viewAllHref={
              (deal as any)?.company?.id == null
                ? "/crm/companies"
                : `/crm/detailspage?type=companies&id=${encodeURIComponent(
                    String((deal as any)?.company?.id)
                  )}`
            }
          />
        ),
      },
      {
        id: "contacts-and-attachments",
        render: ({ collapsedSections, toggleSection }) => (
          <>
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
                  margin: 0,
                  textAlign: "left",
                  font: "inherit",
                  color: "inherit",
                }}
                onClick={() => toggleSection("contacts")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                  <ChevronDown
                    size={18}
                    style={{
                      color: "#141414",
                      transform: collapsedSections.has("contacts")
                        ? "rotate(-90deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#141414", margin: 0, lineHeight: "1.2" }}>
                    Contacts ({deal?.decision_maker_name ?? deal?.decision_maker_email ? 1 : 0})
                  </h3>
                </div>
              </button>
              {!collapsedSections.has("contacts") && (
                <div style={{ padding: "20px" }}>
                  {(deal?.decision_maker_name ?? deal?.decision_maker_email ?? (deal as any)?.main_decision_maker?.name) ? (
                    <>
                      <div style={{ marginBottom: "16px", border: "1px solid #cccccc", borderRadius: "10px", padding: "15px" }}>
                        <span style={{ fontSize: "14px", color: "#006162", fontWeight: "500", display: "block", marginBottom: "8px" }}>
                          {deal?.decision_maker_name ?? (deal as any)?.main_decision_maker?.name ?? "Contact"}
                        </span>
                        <p style={{ fontSize: "13px", color: "#666666", margin: "4px 0" }}>
                          Email: {deal?.decision_maker_email ?? (deal as any)?.main_decision_maker?.email ?? "--"}
                        </p>
                        <p style={{ fontSize: "13px", color: "#666666", margin: "4px 0" }}>
                          Phone: {[deal?.decision_maker_phone_country_code, deal?.decision_maker_phone].filter(Boolean).join(" ") || (deal as any)?.main_decision_maker?.phone || "--"}
                        </p>
                      </div>
                      <a
                        href="/crm/contacts"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: "12px",
                          color: "#141414",
                          textDecoration: "none",
                          fontWeight: "300",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          border: "1px solid #cccccc",
                          borderRadius: "6px",
                          padding: "6px 12px",
                        }}
                      >
                        View all associated Contacts
                        <ExternalLink size={12} />
                      </a>
                    </>
                  ) : (
                    <p style={{ fontSize: "13px", color: "#666666", margin: 0 }}>No contacts associated.</p>
                  )}
                </div>
              )}
            </div>

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
                  backgroundColor: "#ffffff",
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleSection("attachments")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    margin: 0,
                    textAlign: "left",
                    cursor: "pointer",
                    font: "inherit",
                    color: "inherit",
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
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#141414", margin: 0, lineHeight: "1.2" }}>
                    Attachments ({deal?.attachments?.length ?? 0})
                  </h3>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAttachmentModal(true);
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
                  }}
                >
                  <span style={{ fontSize: "14px", fontWeight: "300" }}>+</span>{" "}
                  <span style={{ fontSize: "12px", fontWeight: "500" }}>Add</span>
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
                          <button
                            type="button"
                            onClick={() => handleDownloadAttachment(att.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              background: "transparent",
                              border: "none",
                              padding: 0,
                              cursor: "pointer",
                              fontSize: "14px",
                              color: "#006162",
                              fontWeight: "500",
                            }}
                          >
                            <span>
                              {att.file_path?.split("/").pop() ??
                                att.original_name ??
                                `Attachment ${att.id}`}
                            </span>
                            <DownloadIcon size={16} />
                            {downloadingAttachmentId === att.id && (
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "#718096",
                                  marginLeft: "4px",
                                }}
                              >
                                Downloading...
                              </span>
                            )}
                          </button>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div style={{ padding: "32px 20px", textAlign: "center" }}>
                      <Paperclip size={48} style={{ color: "#cbd5e0", marginBottom: "16px" }} />
                      <p style={{ fontSize: "14px", color: "#718096", margin: 0, lineHeight: "1.6" }}>
                        No attachments yet
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ),
      },
    ],
    tabs: [
      { id: "about", label: "About" },
      { id: "activities", label: "Activities" },
      { id: "revenue", label: "Revenue" },
      { id: "intelligence", label: "Intelligence" },
    ],
    renderCustomTabContent: (tabId, ctx) => {
      if (tabId === "revenue") {
        return (
          <div>
            <CrmRevenueQuoteToCash
              sections={revenueSections.slice(0, 5)}
              isCollapsed={ctx.collapsedSections.has("quote-to-cash")}
              onToggle={() => ctx.toggleSection("quote-to-cash")}
            />
            <div style={{ marginBottom: "24px" }}>
              <CollapsibleSectionHeader
                isCollapsed={ctx.collapsedSections.has("e-commerce")}
                onToggle={() => ctx.toggleSection("e-commerce")}
                title="e-Commerce"
                titleTag="h2"
                titleFontSize="18px"
                chevronSize={20}
              />
              {!ctx.collapsedSections.has("e-commerce") && (
                <div
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    backgroundColor: "#f7fafc",
                    borderRadius: "5px",
                    border: "1px solid #eaf0f6",
                  }}
                >
                  <ShoppingCart size={48} style={{ marginBottom: "16px", color: "#cbd5e0" }} />
                  <p style={{ fontSize: "14px", color: "#7c98b6", margin: 0 }}>
                    No e-commerce data available
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      }

      if (tabId === "intelligence") {
        return (
          <CrmIntelligenceTab
            company={(deal as any)?.company ?? null}
            relatedCompany={deal?.company_name ?? "--"}
            industryName={(deal as any)?.industries?.[0]?.name ?? "--"}
            industryDescription={(deal as any)?.industries?.[0]?.description ?? "--"}
          />
        );
      }

      return undefined;
    },
    renderEditModal: () =>
      showCreateDealSidebar ? (
        <CreateDealSidebar
          onClose={() => {
            setShowCreateDealSidebar(false);
            setEditDealIdForSidebar(null);
          }}
          dealId={editDealIdForSidebar}
          onSuccess={async () => {
            setShowCreateDealSidebar(false);
            setEditDealIdForSidebar(null);
            if (dealRecordId) {
              try {
                const data = await getDeal(dealRecordId);
                setDeal(data);
              } catch {
                // ignore refresh errors
              }
            }
          }}
        />
      ) : null,
    renderFooterModals: () => (
      <>
        <DeleteConfirmationModal
          show={showDeleteAttachmentModal}
          onHide={() => {
            setShowDeleteAttachmentModal(false);
            setAttachmentToDelete(null);
          }}
          onConfirm={confirmDeleteAttachment}
          itemName={attachmentToDelete?.name}
          itemType="attachment"
        />
        {deal && (
          <Modal
            show={showAttachmentModal}
            onHide={() => setShowAttachmentModal(false)}
            size="lg"
            centered
          >
            <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "40px",
                    height: "40px",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                >
                  <Paperclip size={20} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 600 }}>
                    Manage Attachments
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#6c757d",
                      fontWeight: "normal",
                    }}
                  >
                    {deal.name || `Deal #${deal.id}`}
                  </div>
                </div>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              {renderAttachmentUploadPanel()}
              <div>
                <h6 className="mb-3 fw-bold d-flex align-items-center gap-2">
                  <FileText size={18} />
                  Attachments ({attachments.length})
                </h6>
                {!loadingAttachments && attachments.length > 0 && (
                  <div className="d-flex flex-column gap-2 mb-4">
                    {attachments.map((attachment: any) =>
                      renderAttachmentCard(attachment)
                    )}
                  </div>
                )}
                {!loadingAttachments && attachments.length === 0 &&
                  renderAttachmentsEmptyState()}
              </div>
            </Modal.Body>
            <Modal.Footer className="border-0">
              <Button
                variant="secondary"
                onClick={() => setShowAttachmentModal(false)}
              >
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        )}
      </>
    ),
  };

  return (
    <CrmDetailPageLayout config={config} canSendWhatsApp={canSendWhatsApp} />
  );
};

DealDetailPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

// ============================================================================
// ORDER TYPE IMPLEMENTATION (using common CrmDetailPageLayout)
// ============================================================================

const OrderDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id } = router.query;

  const orderId = Number(id) || 0;

  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);

  const [relatedDeal, setRelatedDeal] = useState<any>(null);
  const [relatedLead, setRelatedLead] = useState<any>(null);

  const [extensions, setExtensions] = useState<any[]>([]);

  const { hasPermission } = usePermissions();
  const canSendWhatsApp = hasPermission(
    HEADER_CONSTANTS.PERMISSIONS.SEND_WHATSAPP_MESSAGE_CRM
  );

  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_ORDERS);
        if (hierarchyData?.extensions) setExtensions(hierarchyData.extensions);
      } catch {
        // keep extensions empty on error
      }
    };

    fetchExtensions();
  }, []);

  useEffect(() => {
    const fetchOrderData = async () => {
      if (!router.isReady) return;
      if (!orderId) {
        setLoading(false);
        setOrderError("Invalid order ID");
        return;
      }

      setLoading(true);
      setOrderError(null);

      try {
        const order = await getOrder(orderId);
        setOrderData(order);

        if (order?.deal_id) {
          const deal = await getDeal(Number(order.deal_id));
          setRelatedDeal(deal);

          if (deal?.ticket_id) {
            const lead = await getLead(Number(deal.ticket_id));
            setRelatedLead(lead);
          }
        } else {
          setRelatedDeal(null);
          setRelatedLead(null);
        }
      } catch {
        setOrderData(null);
        setRelatedDeal(null);
        setRelatedLead(null);
        setOrderError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [router.isReady, orderId]);

  const tabs = useMemo(
    () => [
      { id: "about", label: "About" },
      { id: "activities", label: "Activities" },
      { id: "revenue", label: "Revenue" },
      { id: "intelligence", label: "Intelligence" },
    ],
    []
  );

  const detailStaticConfig = getCrmDetailStaticConfig("order");

  const orderRecordId = orderData?.id ? Number(orderData.id) : orderId;
  const orderRecordName = orderData?.order_number ?? orderData?.customer_name ?? "Order";
  const orderRecordEmail = orderData?.customer_email ?? "";
  const orderRecordPhone = orderData?.customer_phone ?? "";

  const orderRecord = buildOrderRecordForActivities(orderData);
  const keyInfoFields = buildOrderKeyInfoFields(orderData, extensions);
  const profileFields = buildOrderProfileFields({ orderData, relatedDeal });

  const associatedCompany = (() => {
    const company = relatedDeal?.company ?? null;
    const struct = company?.enrichment_data?.structured_data ?? null;

    return {
      companyName: struct?.official_company_name ?? company?.name ?? orderData?.customer_name ?? null,
      primaryPhone: struct?.phones?.[0]?.number ?? company?.phone ?? orderData?.customer_phone ?? null,
      phones:
        struct?.phones?.map((p: any) => ({
          number: p?.number ?? "",
          type: p?.type ?? null,
        })) ?? [],
      companyId: company?.id ?? orderData?.customer_id ?? null,
    };
  })();

  const subscriptionsData: SubscriptionItem[] = [
    {
      id: "1",
      name: "Order Subscription",
      status: "active",
      nextBillingDate: "03/13/2026",
      nextPaymentAmount:
        orderData?.final_amount || orderData?.total_amount
          ? `${
              orderData?.currency || "AED"
            } ${Number.parseFloat(String(orderData.final_amount || orderData.total_amount)).toLocaleString()}`
          : "$500.00",
      contactEmail: orderData?.customer_email || "ahmad@gmail.com",
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
      // Keep icon optional; common UI still shows cards
      onButtonClick: () => undefined,
      addButtonText: "Add",
      onAddClick: () => undefined,
    },
    {
      id: "invoices",
      title: "Invoices",
      count: 0,
      description:
        "Send your customer a request for payment and associate it with this record.",
      buttonText: "Set up payments",
      onButtonClick: () => undefined,
      addButtonText: "Add",
      onAddClick: () => undefined,
    },
    {
      id: "payment-links",
      title: "Payment Links",
      count: 0,
      description: "Add a payment link to accept a payment and associate it with this record.",
      buttonText: "Set up payments",
      onButtonClick: () => undefined,
      addButtonText: "Add",
      onAddClick: () => undefined,
    },
    {
      id: "subscriptions",
      title: "Subscriptions",
      count: 1,
      description: "",
      buttonText: "",
      items: subscriptionsData,
      onButtonClick: () => undefined,
      addButtonText: "Add",
      onAddClick: () => undefined,
    },
    {
      id: "payments",
      title: "Payments",
      count: 0,
      description:
        "Track payments associated with this record. A payment is created when a customer pays or a recurring payment is processed.",
      buttonText: "Set up payments",
      onButtonClick: () => undefined,
    },
  ];

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
            type="button"
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

      {section.items && section.items.length > 0 && (
        <div style={{ display: "grid", gap: "12px" }}>
          {section.items.map((item) => (
            <div
              key={item.id}
              style={{
                padding: "16px",
                backgroundColor: "#f7fafc",
                border: "1px solid #eaf0f6",
                borderRadius: "5px",
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

              <div style={{ fontSize: "14px" }}>
                <span style={{ color: "#141414" }}>Status: </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#141414",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: getCrmStatusColor(item.status),
                      display: "inline-block",
                    }}
                  />
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const config: CrmDetailPageLayoutConfig = {
    recordType: "order",
    recordId: orderRecordId,
    recordName: orderRecordName,
    recordEmail: orderRecordEmail,
    recordPhone: orderRecordPhone,
    record: orderData,
    recordLoading: loading,
    recordError: orderError,
    hasRecord: !!orderData,
    ...detailStaticConfig,
    keyInfoFields,
    profileFields,
    profileSectionTitle: "Order profile",
    tabs,
    summary: orderData?.crm_summary?.summary ?? null,
    summaryMetaLabel: formatCrmSummaryUpdatedLabel(orderData?.crm_summary?.updated_at),
    onRefreshSummary: async () => {
      if (!orderRecordId || Number.isNaN(orderRecordId)) {
        toast.error("Invalid order ID");
        return;
      }
      try {
        const refreshed = await getOrder(orderRecordId);
        setOrderData(refreshed);
        toast.success("Summary refreshed");
      } catch {
        toast.error("Failed to refresh summary");
      }
    },
    company: relatedDeal?.company ?? null,
    relatedCompany: orderData?.customer_name ?? relatedDeal?.company_name ?? "—",
    exporting: false,
    showEdit: false,
    showDelete: false,
    onEdit: () => undefined,
    onDelete: () => undefined,
    onExport: () => undefined,
    deleteItemName: orderRecordName,
    onDeleteSuccess: async () => undefined,
    avatarDisplayName: orderRecordName,
    avatarSubtitle: orderData?.stage?.name ?? "—",
    headerSecondaryText: orderData?.expected_delivery_date
      ? `Expected Delivery: ${formatDateForTable(orderData.expected_delivery_date)}`
      : undefined,
    primaryEmail: orderRecordEmail,
    activitiesRecord:
      orderRecord?.data == null
        ? null
        : { data: orderRecord.data as unknown, audit_trail: orderRecord.audit_trail },
    associatedCompany,
    showAssociatedCompanyCard: Boolean(relatedDeal),
    renderCustomTabContent: (tabId, ctx) => {
      if (tabId !== "revenue") return undefined;

      return (
        <div>
          <div style={{ marginBottom: "24px" }}>
            <button
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                padding: 0,
                textAlign: "left",
                font: "inherit",
                color: "inherit",
              }}
              onClick={() => ctx.toggleSection("quote-to-cash")}
            >
              <ChevronDown
                size={20}
                style={{
                  color: "#141414",
                  transform: ctx.collapsedSections.has("quote-to-cash")
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
            </button>

            {!ctx.collapsedSections.has("quote-to-cash") && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                  gap: "16px",
                }}
              >
                {revenueSections.slice(0, 5).map((section) =>
                  renderRevenueSection(section)
                )}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "24px" }}>
            <button
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                padding: 0,
                textAlign: "left",
                font: "inherit",
                color: "inherit",
              }}
              onClick={() => ctx.toggleSection("e-commerce")}
            >
              <ChevronDown
                size={20}
                style={{
                  color: "#141414",
                  transform: ctx.collapsedSections.has("e-commerce")
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
            </button>

            {!ctx.collapsedSections.has("e-commerce") && (
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
                <p style={{ fontSize: "14px", color: "#7c98b6", margin: 0 }}>
                  No e-commerce data available
                </p>
              </div>
            )}
          </div>
        </div>
      );
    },
    renderRightSidebarExtra: ({ collapsedSections, toggleSection }) => {
      const dealItems = relatedDeal ? [relatedDeal] : [];
      const contactItems = relatedLead ? [relatedLead] : [];
      const attachmentsItems: Array<Record<string, unknown>> = [];

      return (
        <>
          {relatedDeal &&
            renderAssociatedRecordsCard({
              sectionId: "deals",
              title: "Deals",
              count: 1,
              collapsedSections,
              toggleSection,
              items: dealItems,
              renderItem: (deal) => <CrmDealListItemCard deal={deal} />,
              emptyState: (
                <p style={{ fontSize: "13px", color: "#666666", margin: 0 }}>
                  No deals associated.
                </p>
              ),
              viewAllLabel: "View all associated Deals",
              onViewAllClick: () => {
                const href = buildCrmDealsDetailpageHref(relatedDeal?.id);
                window.open(href, "_blank", "noopener,noreferrer");
              },
            })}

          {relatedLead &&
            renderAssociatedRecordsCard({
              sectionId: "contacts",
              title: "Contacts",
              count: 1,
              collapsedSections,
              toggleSection,
              items: contactItems,
              renderItem: (lead) => <CrmTicketListItemCard lead={lead} />,
              emptyState: (
                <p style={{ fontSize: "13px", color: "#666666", margin: 0 }}>
                  No contacts associated.
                </p>
              ),
              viewAllLabel: "View all associated Contacts",
              onViewAllClick: () => {
                const href = buildCrmLeadsDetailpageHref(relatedLead?.id);
                window.open(href, "_blank", "noopener,noreferrer");
              },
            })}

          {renderAssociatedRecordsCard({
            sectionId: "attachments",
            title: "Attachments",
            count: 0,
            collapsedSections,
            toggleSection,
            items: attachmentsItems,
            renderItem: (_item) => null,
            emptyState: (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <Paperclip size={48} style={{ color: "#cbd5e0", marginBottom: "16px" }} />
                <p style={{ fontSize: "14px", color: "#718096", margin: 0, lineHeight: "1.6" }}>
                  No attachments yet
                </p>
              </div>
            ),
          })}
        </>
      );
    },
  };

  return <CrmDetailPageLayout config={config} canSendWhatsApp={canSendWhatsApp} />;
};

OrderDetailPage.getLayout = (page: ReactElement) => (
  <Layout>{page}</Layout>
);

// ============================================================================
// COMPANY TYPE IMPLEMENTATION (collapsed into unified dispatcher)
// ============================================================================

const CompanyDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id: companyId } = (router.query as { id?: string }) ?? {};

  const { hasPermission } = usePermissions();
  const canSendWhatsApp = hasPermission(
    HEADER_CONSTANTS.PERMISSIONS.SEND_WHATSAPP_MESSAGE_CRM
  );

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState<string | null>(null);

  const [exporting, setExporting] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<{
    id: number;
    name?: string | null;
  } | null>(null);

  const [showEditCompanySidebar, setShowEditCompanySidebar] = useState(false);
  const [editingCompanyForm, setEditingCompanyForm] = useState<CompanyFormPayload | null>(null);

  const companyRecordId = Number(companyId) || company?.id || 0;
  const companyRecordName = company?.name ?? "Company";

  const enrData: EnrichmentData | null | undefined = company?.enrichment_data;

  const allPhones = useMemo(() => {
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
  }, [
    company?.phone,
    enrData?.structured_data?.phones,
    enrData?.raw_data?.phones,
  ]);

  const primaryPhoneRaw = allPhones[0] ?? company?.phone ?? "";
  const primaryPhone = primaryPhoneRaw.replaceAll(" ", "").trim();

  const enrichmentEmail =
    enrData?.raw_data?.emails?.[0] ??
    enrData?.structured_data?.emails?.[0]?.email ??
    company?.email ??
    "";

  const websiteUrl = useMemo(() => {
    const discovered = enrData?.discovered_website;
    if (discovered) return discovered;
    if (!company?.domain) return null;
    return company.domain.startsWith("http")
      ? company.domain
      : `https://${company.domain}`;
  }, [company?.domain, enrData?.discovered_website]);

  useEffect(() => {
    if (!router.isReady || companyId == null || companyId === "") {
      setCompanyLoading(false);
      setCompanyError(null);
      setCompany(null);
      return;
    }

    const idNum = Number(companyId);
    if (Number.isNaN(idNum) || idNum <= 0) {
      setCompanyError("Invalid company ID");
      setCompanyLoading(false);
      setCompany(null);
      return;
    }

    setCompanyLoading(true);
    setCompanyError(null);

    getCompany(idNum)
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

  const handleRefreshSummary = useCallback(async () => {
    if (!companyRecordId || Number.isNaN(companyRecordId)) {
      toast.error("Invalid company ID");
      return;
    }
    try {
      setCompanyLoading(true);
      const refreshed = await getCompany(companyRecordId);
      setCompany(refreshed);
      toast.success("Summary refreshed");
    } catch {
      toast.error("Failed to refresh summary");
    } finally {
      setCompanyLoading(false);
    }
  }, [companyRecordId]);

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

  const handleDeleteSuccess = useCallback(async () => {
    if (!companyToDelete) return;
    await deleteCompany(companyToDelete.id);
  }, [companyToDelete]);

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
    },
    [companyRecordId]
  );

  const keyInfoFields: KeyInfoField[] = useMemo(() => {
    return buildCompanyKeyInfoFields({
      company,
      primaryPhoneRaw,
      websiteUrl,
    });
  }, [
    company?.city,
    company?.country,
    company?.created_at,
    company?.domain,
    company?.email,
    company?.industry,
    primaryPhoneRaw,
    websiteUrl,
  ]);

  const profileFields: ProfileField[] = useMemo(
    () =>
      buildCompanyProfileFields({
        company,
        primaryPhoneRaw,
        websiteUrl,
      }),
    [
      company?.city,
      company?.country,
      company?.domain,
      company?.email,
      company?.industry,
      company?.name,
      primaryPhoneRaw,
      websiteUrl,
    ]
  );

  const activitiesRecord = useMemo(() => {
    if (!company) return null;
    return {
      data: {
        id: company.id,
        name: company.name,
        phone: primaryPhoneRaw || "",
        data: company as unknown as Record<string, unknown>,
      },
      audit_trail: (company as unknown as { audit_trail?: unknown }).audit_trail,
    };
  }, [company, primaryPhoneRaw]);

  const associatedCompany = useMemo(
    () => ({
      companyName: company?.name ?? null,
      primaryPhone: primaryPhone || null,
      phones:
        allPhones.length > 0
          ? allPhones.map((n) => ({ number: n, type: null }))
          : undefined,
      companyId: company?.id ?? null,
    }),
    [allPhones, company?.id, company?.name, primaryPhone]
  );

  const subscriptionsData: SubscriptionItem[] = [];
  const revenueSections: RevenueSection[] = createDefaultRevenueSections(
    subscriptionsData.length,
    subscriptionsData
  );

  const tabs = useMemo(
    () => [
      { id: "about", label: "About" },
      { id: "revenue", label: "Revenue" },
      { id: "intelligence", label: "Intelligence" },
    ],
    []
  );

  const config: CrmDetailPageLayoutConfig = {
    recordType: "company",
    recordId: companyRecordId,
    recordName: companyRecordName,
    recordEmail: enrichmentEmail,
    recordPhone: primaryPhone,
    record: company,
    recordLoading: companyLoading,
    recordError: companyError,
    hasRecord: !!company,
    ...getCrmDetailStaticConfig("company"),
    keyInfoFields,
    profileSectionTitle: "Company profile",
    profileFields,
    summary: (company as any)?.crm_summary?.summary ?? null,
    summaryMetaLabel: formatCrmSummaryUpdatedLabel(
      (company as any)?.crm_summary?.updated_at
    ),
    onRefreshSummary: handleRefreshSummary,
    company,
    relatedCompany: companyRecordName,
    exporting,
    onEdit: handleOpenEditCompany,
    onDelete: () =>
      setCompanyToDelete({
        id: companyRecordId,
        name: company?.name,
      }),
    onExport: handleCompanyExport,
    deleteItemName: companyToDelete?.name ?? companyRecordName,
    onDeleteSuccess: handleDeleteSuccess,
    avatarDisplayName: company?.name ?? "Company",
    avatarSubtitle: company?.industry ?? "—",
    primaryEmail: enrichmentEmail,
    activitiesRecord,
    associatedCompany,
    showAssociatedCompanyCard: false,
    tabs,
    renderCustomTabContent: (tabId, ctx) => {
      if (tabId !== "revenue") return undefined;
      return (
        <div>
          <CrmRevenueQuoteToCash
            sections={revenueSections.slice(0, 5)}
            isCollapsed={ctx.collapsedSections.has("quote-to-cash")}
            onToggle={() => ctx.toggleSection("quote-to-cash")}
          />
        </div>
      );
    },
    renderRightSidebarExtra: () => renderCompanyAssociatedRecordsExtra(),
    renderEditModal: () =>
      showEditCompanySidebar ? (
        <CreateCompanySidebar
          onClose={() => setShowEditCompanySidebar(false)}
          initialData={editingCompanyForm}
          editingId={companyRecordId || undefined}
          onSave={handleCompanySave}
        />
      ) : null,
  };

  return <CrmDetailPageLayout config={config} canSendWhatsApp={canSendWhatsApp} />;
};

CompanyDetailPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export type SupportedCrmDetailType = "lead" | "prospect" | "deal" | "order" | "company";

export const getCrmDetailPageForType = (
  recordType: SupportedCrmDetailType
): React.ComponentType | null => {
  switch (recordType) {
    case "lead":
      return LeadDetailPage;
    case "prospect":
      return ProspectDetailPage;
    case "deal":
      return DealDetailPage;
    case "order":
      return OrderDetailPage;
    case "company":
      return CompanyDetailPage;
    default:
      return null;
  }
};

