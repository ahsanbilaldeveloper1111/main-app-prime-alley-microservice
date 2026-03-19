import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactElement,
} from "react";
import { useRouter } from "next/router";
import { Ticket } from "lucide-react";
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
import { ModuleSlug } from "@utils/Helper";
import moment from "moment-timezone";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import {
  CrmDetailPageLayout,
  type KeyInfoField,
  type ProfileField,
  type CrmDetailPageLayoutConfig,
} from "@pages/crm/common/crm-detail-layout";
import {
  formatCrmSummaryUpdatedLabel,
  getCrmExtensionDisplayName,
} from "@pages/crm/common/crm-detail-formatters";
import { getCrmDetailStaticConfig } from "@pages/crm/common/crm-detail-config";
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
  buildCrmDealsDetailpageHref,
  buildCrmLeadsDetailpageHref,
} from "@pages/crm/common/crm-detail-navigation";

let customFieldIdCounter = 0;
const createCustomFieldId = () =>
  `custom-field-${Date.now()}-${customFieldIdCounter++}`;

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

type NextPageWithLayout = React.FC & {
  getLayout?: (page: ReactElement) => ReactElement;
};

const ContactRecordPage: NextPageWithLayout = () => {
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
                value: (t as { name?: string; value?: string; id?: number })
                  ?.name ?? (t as { name?: string; value?: string })?.value ?? String((t as { id?: number })?.id ?? ""),
                label: (t as { name?: string; label?: string; value?: string })
                  ?.name ?? (t as { name?: string; label?: string })?.label ?? (t as { value?: string })?.value ?? String((t as { id?: number })?.id ?? ""),
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
        return v == null ? null : String(v);
      })(),
      lifecycle_stage: (d.lifecycle_stage as string) ?? "",
      disposition: (d.disposition as string) ?? (item.disposition as string) ?? "",
      legal_basis: Array.isArray(d.legal_basis)
        ? (d.legal_basis as string[])
        : [],
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
    () => [
      {
        label: "Email",
        value: (prospect?.data as { data?: { email?: string } })?.data?.email ?? "--",
        copyable: true,
      },
      {
        label: "Phone Number",
        value: (prospect?.data as { phone?: string })?.phone ?? "--",
        copyable: true,
      },
      {
        label: "Company Name",
        value:
          firstTicket?.company_name ??
          (prospect?.data as { company_name?: string })?.company_name ??
          (prospect?.data as { name?: string })?.name ??
          "--",
      },
      {
        label: "Company Domain",
        value: (prospect?.data as { company_domain?: string })?.company_domain ?? "--",
      },
      {
        label: "Owner",
        value: (() => {
          const ownerId = (prospect?.data as { user_extension?: number })?.user_extension;
          return getCrmExtensionDisplayName(ownerId, extensions);
        })(),
      },
    ],
    [prospect, firstTicket, extensions]
  );

  const profileFields: ProfileField[] = useMemo(
    () => [
      {
        label: "Company name",
        value:
          (prospect?.data as { company?: { enrichment_data?: { structured_data?: { official_company_name?: string } } } })
            ?.company?.enrichment_data?.structured_data?.official_company_name ??
          (prospect?.data as { company_name?: string })?.company_name ??
          "--",
      },
      {
        label: "Street address",
        value:
          (prospect?.data as { company?: { enrichment_data?: { structured_data?: { headquarters?: { address?: string } }; headquarters?: { address?: string } } } })
            ?.company?.enrichment_data?.structured_data?.headquarters?.address ??
          (prospect?.data as { company?: { address?: string } })?.company?.address ??
          "--",
      },
      {
        label: "City",
        value:
          (prospect?.data as { company?: { enrichment_data?: { structured_data?: { headquarters?: { city?: string } } } } })
            ?.company?.enrichment_data?.structured_data?.headquarters?.city ??
          "--",
      },
      {
        label: "Postal code",
        value: (prospect?.data as { data?: { postal_code?: string } })?.data?.postal_code ?? "--",
      },
      {
        label: "State/Region",
        value:
          (prospect?.data as { company?: { enrichment_data?: { structured_data?: { headquarters?: { state?: string } } } } })
            ?.company?.enrichment_data?.structured_data?.headquarters?.state ??
          "--",
      },
      {
        label: "Email",
        value:
          (prospect?.data as { company?: { enrichment_data?: { structured_data?: { emails?: { email?: string }[] } } } })
            ?.company?.enrichment_data?.structured_data?.emails?.[0]?.email ??
          "--",
        link: true,
      },
    ],
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
        const refreshedSummary = (
          refreshed as { data?: { crm_summary?: unknown } }
        )?.data?.crm_summary;
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
      if (data.campaign_id == null) {
        toast.error("Campaign is required");
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
          tag_ids: data.tags?.length
            ? data.tags.map((t: { id: number }) => t.id)
            : [],
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
    []
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
      (prospect as { crm_summary?: { summary?: string } })?.crm_summary
        ?.summary ??
      (prospect?.data as { crm_summary?: { summary?: string } })?.crm_summary
        ?.summary ??
      (prospect?.data as { data?: { crm_summary?: { summary?: string } } })
        ?.data?.crm_summary?.summary ??
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
              id: (prospect?.data as { id?: number })?.id,
            })
          }
        />
      );
    },
    renderRightSidebarExtra: ({ collapsedSections, toggleSection }) => (
      <>
        <CrmAssociatedRecordsSectionCard
          sectionId="deals"
          title="Deals"
          count={allDeals.length}
          collapsedSections={collapsedSections}
          toggleSection={toggleSection}
          items={allDeals as Record<string, unknown>[]}
          renderItem={(deal) => <CrmDealListItemCard deal={deal} />}
          emptyState={
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <Ticket size={48} style={{ color: "#cbd5e0", marginBottom: "16px" }} />
              <p style={{ fontSize: "14px", color: "#718096", margin: 0, lineHeight: "1.6" }}>
                Track the customer requests associated with this record.
              </p>
            </div>
          }
          viewAllLabel="View all associated Deals"
          onViewAllClick={() => {
            const firstDeal = allDeals[0] as Record<string, unknown>;
            const href = buildCrmDealsDetailpageHref(firstDeal?.id as string | number | null | undefined);
            window.open(href, "_blank", "noopener,noreferrer");
          }}
        />

        <CrmAssociatedRecordsSectionCard
          sectionId="tickets"
          title="Leads"
          count={leads.length}
          collapsedSections={collapsedSections}
          toggleSection={toggleSection}
          items={leads as Record<string, unknown>[]}
          renderItem={(lead) => <CrmTicketListItemCard lead={lead} />}
          emptyState={
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <Ticket size={48} style={{ color: "#cbd5e0", marginBottom: "16px" }} />
              <p style={{ fontSize: "14px", color: "#718096", margin: 0, lineHeight: "1.6" }}>
                Track the customer requests associated with this record.
              </p>
            </div>
          }
          viewAllLabel="View all associated Leads"
          onViewAllClick={() => {
            const firstLead = leads[0] as Record<string, unknown>;
            const href = buildCrmLeadsDetailpageHref(firstLead?.id as string | number | null | undefined);
            window.open(href, "_blank", "noopener,noreferrer");
          }}
        />
      </>
    ),
  };

  return (
    <CrmDetailPageLayout
      config={config}
      canSendWhatsApp={canSendWhatsApp}
    />
  );
};

ContactRecordPage.getLayout = (page: ReactElement) => (
  <Layout>{page}</Layout>
);

export default ContactRecordPage;
