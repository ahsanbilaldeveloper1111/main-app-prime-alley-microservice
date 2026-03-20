import React, { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { useRouter } from "next/router";
import Layout from "@layout/index";
import { toast } from "react-toastify";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import {
  CrmDetailPageLayout,
  type CrmDetailPageLayoutConfig,
  type KeyInfoField,
  type ProfileField,
} from "@pages/crm/common/crm-detail-layout";
import { getCrmDetailStaticConfig } from "@pages/crm/common/crm-detail-config";
import {
  formatCrmShortDate,
  formatCrmSummaryUpdatedLabel,
} from "@pages/crm/common/crm-detail-formatters";
import { exportRecordAsCsv } from "@utils/csvExport";
import {
  getCompany,
  deleteCompany,
  updateCompany,
  type CompanyData,
  type EnrichmentData,
} from "@utils/crm";
import { CreateCompanySidebar, type CompanyFormPayload } from "@components/renderCreateCompany";
import {
  CrmRevenueQuoteToCash,
  createDefaultRevenueSections,
  type RevenueSection,
  type SubscriptionItem,
} from "@components/CrmRevenueQuoteToCash";

type NextPageWithLayout = React.FC & {
  getLayout?: (page: ReactElement) => ReactElement;
};

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
  const [editingCompanyForm, setEditingCompanyForm] =
    useState<CompanyFormPayload | null>(null);

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
    const createdValue = company?.created_at
      ? formatCrmShortDate(company.created_at)
      : "--";

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
    () => [
      { label: "Company name", value: company?.name ?? "--" },
      { label: "Phone", value: primaryPhoneRaw || "--" },
      { label: "Email", value: company?.email ?? "--", link: true },
      { label: "City", value: company?.city ?? "--" },
      { label: "Country", value: company?.country ?? "--" },
      { label: "Industry", value: company?.industry ?? "--" },
      { label: "Domain", value: company?.domain ?? "--" },
      { label: "Website", value: websiteUrl ?? "--" },
    ],
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
    renderRightSidebarExtra: () => (
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
    ),
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

export default CompanyDetailPage;

