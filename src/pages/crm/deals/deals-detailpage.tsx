import React, { useState, useEffect, ReactElement, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  ChevronDown, ExternalLink,
  FileText, Paperclip,
  ShoppingCart, Download as DownloadIcon,
  Upload, Trash2
} from 'lucide-react';
import { Modal, Button, Form, Card } from 'react-bootstrap';
import Layout from "@layout/index";
import {
  getDeal,
  deleteDeal,
  PDFDownloadDeal,
  downloadDealAttachment,
  getDealAttachments,
  uploadDealAttachment,
  deleteDealAttachment,
  type DealData,
} from "@utils/crm";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import CrmIntelligenceTab from "@components/CrmIntelligenceTab";
import CrmAssociatedCompaniesCard from "@components/CrmAssociatedCompaniesCard";
import { CreateDealSidebar } from "@components/renderCreateDealForm";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { GetHierarchyData } from "@utils/users";
import { ModuleSlug, formatDateForTable } from "@utils/Helper";
import {
  CrmRevenueQuoteToCash,
  type SubscriptionItem,
  type RevenueSection,
  createDefaultRevenueSections,
} from "@components/CrmRevenueQuoteToCash";
import { toast } from "react-toastify";
import {
  CrmDetailPageLayout,
  type CrmDetailPageLayoutConfig,
  type KeyInfoField,
  type ProfileField,
} from "@pages/crm/common/crm-detail-layout";
import {
  formatCrmAmount,
  formatCrmShortDate,
  formatCrmSummaryUpdatedLabel,
  getCrmExtensionDisplayName,
} from "@pages/crm/common/crm-detail-formatters";
import { getCrmDetailStaticConfig } from "@pages/crm/common/crm-detail-config";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type CollapsibleSectionHeaderProps = {
  isCollapsed: boolean;
  onToggle: () => void;
  title: string;
  titleTag: 'h2' | 'h3';
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
    color: '#141414',
    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
    transition: 'transform 0.2s ease',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: titleFontSize,
    fontWeight: '600',
    color: '#141414',
    margin: 0,
  };

  let borderBottomStyle: React.CSSProperties['borderBottom'] = undefined;
  if (showBorderBottom) {
    if (isCollapsed) {
      borderBottomStyle = 'none';
    } else {
      borderBottomStyle = '1px solid #cccccc';
    }
  }

  const renderTitle = () => {
    if (titleTag === 'h2') {
      return <h2 style={titleStyle}>{title}</h2>;
    }
    return <h3 style={titleStyle}>{title}</h3>;
  };

  return rightButtonLabel ? (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        cursor: 'pointer',
        backgroundColor: '#ffffff',
        borderBottom: borderBottomStyle,
      }}
      onClick={onToggle}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ChevronDown size={chevronSize} style={chevronStyle} />
        {renderTitle()}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRightButtonClick?.(e);
        }}
        style={{
          background: 'transparent',
          border: 'none',
          padding: '6px',
          cursor: 'pointer',
          color: '#141414',
          fontSize: '14px',
          fontWeight: '500',
          borderRadius: '3px',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f5f8fa';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        type="button"
      >
        {rightButtonLabel}
      </button>
    </div>
  ) : (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
        cursor: 'pointer',
      }}
      onClick={onToggle}
    >
      <ChevronDown size={chevronSize} style={chevronStyle} />
      {renderTitle()}
    </div>
  );
};

type NextPageWithLayout = React.FC & {
  getLayout?: (page: ReactElement) => ReactElement;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DealRecordPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id: dealId } = router.query;
  const { hasPermission } = usePermissions();
  const canSendWhatsApp = hasPermission(HEADER_CONSTANTS.PERMISSIONS.SEND_WHATSAPP_MESSAGE_CRM);

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
    if (!router.isReady || dealId == null || dealId === '') {
      setDealLoading(false);
      return;
    }
    const id = Number(dealId);
    if (Number.isNaN(id)) {
      setDealError('Invalid deal ID');
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
        setDealError('Failed to load deal');
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
        if (hierarchyData?.extensions) {
          setExtensions(hierarchyData.extensions);
        }
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
      id: '1',
      name: 'Connect Pro',
      status: 'active',
      nextBillingDate: '03/13/2026',
      nextPaymentAmount: '$500.00',
      contactEmail: 'ahmad@gmail.com',
      link: '#',
    },
  ];

  const revenueSections: RevenueSection[] = createDefaultRevenueSections(
    subscriptionsData.length,
    subscriptionsData,
  );

  const formatDealAmount = (d: DealData | null) => {
    if (!d) return '--';
    return formatCrmAmount(d as unknown as Record<string, unknown>);
  };

  // Key Information Fields - from deal API
  const keyInfoFields: KeyInfoField[] = [
    { label: "Deal Value", value: formatDealAmount(deal), copyable: true },
    { label: "Stage", value: deal?.stage?.name ?? deal?.status ?? "--" },
    { label: "Probability", value: deal == null ? "--" : `${deal.probability ?? 0}%` },
    { label: "Expected Close Date", value: formatCrmShortDate(deal?.expected_close_date) },
    {
      label: "Company Name",
      value: deal?.company_name ?? "--",
    },
    {
      label: "Owner",
      value: (() => {
        const rawOwner = deal?.assigned_to ?? null;
        return getCrmExtensionDisplayName(rawOwner, extensions as Record<string, unknown>[]);
      })(),
    },
  ];

  // Normalize deal for CrmActivitiesPanel (include audit_trail so Activity tab shows deal history)
  const dealRecord = deal
    ? {
        id: deal.id,
        data: {
          id: deal.id,
          name: deal.name,
          phone: deal.decision_maker_phone ?? (deal as any).phone ?? null,
          data: {},
        },
        audit_trail: deal.audit_trail ?? [],
      }
    : null;

  const dealRecordId = Number(dealId) || deal?.id || 0;
  const dealRecordName = deal?.name ?? 'Deal';
  const dealRecordEmail = (deal as any)?.contact_email ??  (deal as any)?.decision_maker_email  ?? (deal as any)?.main_decision_maker?.email ?? '';

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
    [dealRecordId],
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
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
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
    [dealRecordId, refetchDealForAttachments],
  );

  const confirmDeleteAttachment = useCallback(async () => {
    if (!attachmentToDelete) return;
    await handleDeleteDealAttachment(attachmentToDelete.id);
    setShowDeleteAttachmentModal(false);
    setAttachmentToDelete(null);
  }, [attachmentToDelete, handleDeleteDealAttachment]);

  const profileFields: ProfileField[] = [
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
  ];
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
    keyInfoFields: keyInfoFields.map((field) => ({ ...field, value: String(field.value ?? "--") })),
    profileFields,
    profileSectionTitle: "Deal profile",
    summary: (deal as any)?.crm_summary?.summary ?? null,
    summaryMetaLabel: formatCrmSummaryUpdatedLabel((deal as any)?.crm_summary?.updated_at),
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
    onDelete: () => setDealToDelete({ id: dealRecordId, name: dealRecordName }),
    onExport: handleDealExport,
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
      phones: ((deal as any)?.company?.enrichment_data?.structured_data?.phones ?? []).map((p: any) => ({
        number: p?.number ?? "",
        type: p?.type ?? null,
      })),
      companyId:
        (deal as any)?.company?.id ??
        (deal as any)?.company_id ??
        null,
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
            phones={((deal as any)?.company?.enrichment_data?.structured_data?.phones ?? []).map((p: any) => ({
              number: p?.number ?? "",
              type: p?.type ?? null,
            }))}
            companyId={(deal as any)?.company?.id ?? (deal as any)?.company_id ?? null}
            viewAllLabel="View all associated Companies"
            viewAllHref={
              (deal as any)?.company?.id != null
                ? `/crm/companies/company-detailpage?id=${encodeURIComponent(String((deal as any)?.company?.id))}`
                : "/crm/companies"
            }
          />
        ),
      },
      {
        id: "contacts-and-attachments",
        render: ({ collapsedSections, toggleSection }) => (
          <>
            <div style={{ backgroundColor: "#ffffff", borderRadius: "10px", marginBottom: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)", border: "1px solid #cccccc" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 0", cursor: "pointer", backgroundColor: "#ffffff" }} onClick={() => toggleSection("contacts")}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                  <ChevronDown size={18} style={{ color: "#141414", transform: collapsedSections.has("contacts") ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#141414", margin: 0, lineHeight: "1.2" }}>
                    Contacts ({deal?.decision_maker_name ?? deal?.decision_maker_email ? 1 : 0})
                  </h3>
                </div>
              </div>
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
                        href={
                          (deal as any)?.main_decision_maker?.id != null
                            ? `/crm/contacts/contact-detailpage?id=${encodeURIComponent(String((deal as any)?.main_decision_maker?.id))}`
                            : "/crm/contacts"
                        }
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

            <div style={{ backgroundColor: "#ffffff", borderRadius: "10px", marginBottom: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)", border: "1px solid #cccccc" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 0", cursor: "pointer", backgroundColor: "#ffffff" }} onClick={() => toggleSection("attachments")}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                  <ChevronDown size={18} style={{ color: "#141414", transform: collapsedSections.has("attachments") ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#141414", margin: 0, lineHeight: "1.2" }}>
                    Attachments ({deal?.attachments?.length ?? 0})
                  </h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAttachmentModal(true);
                  }}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#141414", fontSize: "14px", fontWeight: "500", padding: "6px", borderRadius: "3px" }}
                >
                  <span style={{ fontSize: "14px", fontWeight: "300" }}>+</span> <span style={{ fontSize: "12px", fontWeight: "500" }}>Add</span>
                </button>
              </div>
              {!collapsedSections.has("attachments") && (
                <div style={{ padding: "20px" }}>
                  {(deal?.attachments?.length ?? 0) > 0 ? (
                    <>
                      {deal!.attachments!.map((att: any) => (
                        <div key={att.id} style={{ marginBottom: "12px", border: "1px solid #cccccc", borderRadius: "8px", padding: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Paperclip size={18} style={{ color: "#718096" }} />
                          <button
                            type="button"
                            onClick={() => handleDownloadAttachment(att.id)}
                            style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", padding: 0, cursor: "pointer", fontSize: "14px", color: "#006162", fontWeight: "500" }}
                          >
                            <span>{att.file_path?.split("/").pop() ?? att.original_name ?? `Attachment ${att.id}`}</span>
                            <DownloadIcon size={16} />
                            {downloadingAttachmentId === att.id && <span style={{ fontSize: "12px", color: "#718096", marginLeft: "4px" }}>Downloading...</span>}
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
          <Modal show={showAttachmentModal} onHide={() => setShowAttachmentModal(false)} size="lg" centered>
            <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title className="d-flex align-items-center gap-2">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                  <Paperclip size={20} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 600 }}>Manage Attachments</div>
                  <div style={{ fontSize: "13px", color: "#6c757d", fontWeight: "normal" }}>
                    {deal.name || `Deal #${deal.id}`}
                  </div>
                </div>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <div className="mb-4 p-4 border rounded" style={{ background: "#f8f9fa" }}>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <h6 className="mb-1 fw-bold">Upload New Attachments</h6>
                    <small className="text-muted">Supported formats: PDF, CSV, Excel, or Image (Max 5MB)</small>
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
                  <Button variant="primary" className="d-flex align-items-center gap-2" disabled={uploadingFile}>
                    {uploadingFile ? <>Uploading...</> : <><Upload size={16} />Upload</>}
                  </Button>
                </div>
              </div>
              <div>
                <h6 className="mb-3 fw-bold d-flex align-items-center gap-2">
                  <FileText size={18} />
                  Attachments ({attachments.length})
                </h6>
                {!loadingAttachments && attachments.length > 0 && (
                  <div className="d-flex flex-column gap-2 mb-4">
                    {attachments.map((attachment: any) => {
                      const backgroundColor = getAttachmentBackgroundColor(attachment.mime_type);
                      const displayName = getAttachmentDisplayName(attachment);
                      return (
                        <Card key={attachment.id} className="border shadow-sm">
                          <Card.Body className="p-3">
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="d-flex align-items-center gap-3 flex-grow-1">
                                <div className="rounded d-flex align-items-center justify-content-center" style={{ width: "45px", height: "45px", background: backgroundColor, color: "white" }}>
                                  <FileText size={22} />
                                </div>
                                <div className="flex-grow-1">
                                  <div className="fw-semibold" style={{ fontSize: "14px" }}>{displayName}</div>
                                  <div style={{ fontSize: "12px", color: "#6c757d" }}>
                                    {attachment.file_size == null ? null : formatFileSize(attachment.file_size)}
                                    {attachment.created_at ? ` • ${formatDateForTable(attachment.created_at)}` : ""}
                                  </div>
                                </div>
                              </div>
                              <div className="d-flex gap-1">
                                <Button variant="link" size="sm" className="p-2 text-primary" title="Download" onClick={() => handleDownloadAttachment(attachment.id)}>
                                  <DownloadIcon size={18} />
                                </Button>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-2 text-danger"
                                  title="Delete"
                                  onClick={() => {
                                    setAttachmentToDelete({ id: attachment.id, name: getAttachmentDisplayName(attachment) });
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
                    })}
                  </div>
                )}
                {!loadingAttachments && attachments.length === 0 && (
                  <div className="text-center py-4 text-muted">
                    <Paperclip size={48} className="mb-3 opacity-25" />
                    <div>No attachments yet</div>
                    <small>Upload files using the form above</small>
                  </div>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer className="border-0">
              <Button variant="secondary" onClick={() => setShowAttachmentModal(false)}>Close</Button>
            </Modal.Footer>
          </Modal>
        )}
      </>
    ),
  };

  return <CrmDetailPageLayout config={config} canSendWhatsApp={canSendWhatsApp} />;
};

DealRecordPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default DealRecordPage;

