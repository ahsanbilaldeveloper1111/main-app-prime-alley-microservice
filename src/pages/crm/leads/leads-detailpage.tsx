import React, { useState, useEffect, useCallback, useMemo, ReactElement } from "react";
import { useRouter } from "next/router";
import Layout from "@layout/index";
import { getLead, deleteLead, type LeadData } from "@utils/crm";
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
import CreateLeadModal from "@components/CreateLeadModal";
import { toast } from "react-toastify";
import { GetHierarchyData } from "@utils/users";
import { ModuleSlug } from "@utils/Helper";
import { exportRecordAsCsv } from "@utils/csvExport";
import CrmAssociatedRecordsSectionCard from "@components/CrmAssociatedRecordsSectionCard";
import CrmDealListItemCard from "@components/CrmDealListItemCard";
import { buildCrmDealsDetailpageHref } from "@pages/crm/common/crm-detail-navigation";

type NextPageWithLayout = React.FC & {
  getLayout?: (page: ReactElement) => ReactElement;
};

const ContactRecordPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id: leadId } = (router.query as { id?: string }) ?? {};
  const [lead, setLead] = useState<LeadData | null>(null);
  const [leadLoading, setLeadLoading] = useState(true);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<{ id: number; name?: string } | null>(null);
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
    Array<{ email?: string; phone?: string }> | undefined;
  const crmData = (lead as unknown as Record<string, unknown>)?.crm_data as Record<string, unknown> | undefined;
  const crmDataDetails = (crmData?.data as Record<string, unknown> | undefined) ?? undefined;
  const crmDataPhone = crmData?.phone as string | undefined;
  const companyData = (lead as unknown as Record<string, unknown>)?.company as Record<string, unknown> | undefined;
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
          data: lead.campaign_field_values ?? {},
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
      : primaryPhoneNumber ||
        crmDataPhone ||
        lead?.company_contact ||
        "--";

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
    () => [
      {
        label: "Email",
        value:
          (primaryContact as { email?: string })?.email ??
          (crmDataDetails?.email as string | undefined) ??
          "--",
        copyable: true,
      },
      { label: "Phone Number", value: formattedPhoneNumber, copyable: true },
      { label: "Company Name", value: lead?.company_name ?? "--" },
      { label: "Company Domain", value: lead?.company_domain ?? "--" },
      { label: "Lead Status", value: lead?.status ?? "--" },
      {
        label: "Lifecycle Stage",
        value:
          (crmDataDetails?.lifecycle_stage as string | undefined) ??
          lead?.stage?.name ??
          "--",
      },
      { label: "Owner", value: associateName },
      { label: "Source", value: ((lead as unknown as Record<string, unknown>)?.source as string | undefined) ?? "--" },
    ],
    [lead, primaryContact, formattedPhoneNumber, associateName]
  );

  const profileFields: ProfileField[] = useMemo(
    () => [
      {
        label: "Company name",
        value:
          (structuredData?.official_company_name as string | undefined) ??
          lead?.company_name ??
          "--",
      },
      {
        label: "Street address",
        value:
          (headquartersData?.address as string | undefined) ??
          (crmDataDetails?.street_address as string | undefined) ??
          lead?.campaign_field_values?.street_address ??
          "--",
      },
      {
        label: "City",
        value:
          (headquartersData?.city as string | undefined) ??
          (crmDataDetails?.city as string | undefined) ??
          lead?.campaign_field_values?.city ??
          "--",
      },
      {
        label: "Postal code",
        value:
          (crmDataDetails?.postal_code as string | undefined) ??
          lead?.campaign_field_values?.postal_code ??
          "--",
      },
      {
        label: "State/Region",
        value:
          (crmDataDetails?.state as string | undefined) ??
          lead?.campaign_field_values?.state ??
          "--",
      },
      {
        label: "Email",
        value:
          structuredEmails?.[0]?.email ??
          contactPersons?.[0]?.email ??
          (crmDataDetails?.email as string | undefined) ??
          "--",
        link: true,
      },
    ],
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
      phones: structuredPhones?.map(
        (p: { number?: string; type?: string | null }) => ({
          number: p?.number ?? "",
          type: p?.type ?? null,
        })
      ),
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
        string | undefined) ??
        null),
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
      <CrmAssociatedRecordsSectionCard
        sectionId="deals"
        title="Deals"
        count={dealsCount}
        collapsedSections={collapsedSections}
        toggleSection={toggleSection}
        items={allDeals as Record<string, unknown>[]}
        showAddButton
        renderItem={(deal) => <CrmDealListItemCard deal={deal} />}
        emptyState={<p style={{ fontSize: "13px", color: "#666666", margin: 0 }}>No deals associated.</p>}
        viewAllLabel="View all associated Deals"
        onViewAllClick={() => {
          const firstDeal = allDeals[0] as Record<string, unknown>;
          const href = buildCrmDealsDetailpageHref(firstDeal?.id as string | number | null | undefined);
          window.open(href, "_blank", "noopener,noreferrer");
        }}
      />
    ),
  };

  return <CrmDetailPageLayout config={config} canSendWhatsApp={canSendWhatsApp} />;
};

ContactRecordPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default ContactRecordPage;
