import "@assets/scss/datatable-style.scss";
import { useRouter } from "next/router";
import React, {
  ReactElement,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, {
  TableColumn,
  TableAction,
  TabConfig,
  buildBoundTableContextMenuItems,
} from "@components/GenericTable";
import KanbanBoard, { type KanbanCardData } from "@components/KanbanBoard";
import { useCrmToolbarConfig } from "@hooks/useCrmToolbarConfig";
import { useCrmLogActivityModals } from "@hooks/useCrmLogActivityModals";
import GenericSidebar from "@components/GenericSidebarNew";
import GenericFilterSidebar from "@components/GenericFilterSidebar";
import ColumnEditorModal from "@components/ColumnEditorModal";
import { CrmListColumnEditorModal } from "@crm/shared/CrmListColumnEditorModal";
import {
  parseStoredVisibleColumnKeysLoose,
  persistVisibleColumnKeys,
} from "@utils/crmListVisibleColumnsStorage";
import CrmExportModal from "@components/CrmExportModal";
import { StatsCardData } from "@components/GenericStatsCards";
import ConvertDealToOrderModal from "@components/ConvertDealToOrderModal";
import { CreateDealSidebar } from "@components/renderCreateDealForm";
import { EditDealApprovalSidebar } from "@components/EditDealApprovalSidebar";
import {
  getDeals,
  getStages,
  deleteDeal,
  restoreDeal,
  getDeal,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  markDealLost,
  updateDeal,
  getBusinessTypes,
  BusinessTypeData,
  PDFDownloadDeal,
  createDealFollowUp,
  updateDealFollowUp,
  deleteDealFollowUp,
  approveDeal,
  rejectDeal,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import {
  Button,
  Row,
  Col,
  Badge,
  Form,
  Card,
  Modal,
  Spinner,
} from "react-bootstrap";
import Select, {
  type GroupBase,
  type StylesConfig,
} from "react-select";
import {
  GlobalDateFormat,
  ModuleSlug,
  formatDateForTable,
  formatFileSize,
  checkRequiredFields,
  formatCrmPreviewDate,
  formatCrmPreviewDateTime,
  formatMeetingDateLocal,
  convertLocalMeetingToUtc,
  convertUtcMeetingToLocal,
  RECORD_TYPES,
} from "@utils/Helper";
import {
  Target,
  CheckCircle,
  Plus,

  Edit,
  Trash2,
  Handshake,
  X,
  Users,
  Calendar,
  GitBranch,
  History,
  Clock,
  DollarSign,
  Activity,
  FileText,
  Send,
  UserCheck,
  User,
  Building2,
  Phone as PhoneIcon,
  Paperclip,
  Download as DownloadIcon,
  AlertCircle,
  Percent,
  Trash,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { toast } from "react-toastify";
import moment from "moment";
import "react-phone-number-input/style.css";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import SuccessfulModal from "@components/page-partials/SuccessfulModal";
import FormModal from "@components/page-partials/FormModal";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import { useSession } from "next-auth/react";
import { useCti } from "@hooks/useCti";
import { crmListPageReactSelectStyles as customSelectStyles } from "@utils/crmListPageReactSelectStyles";
import { useCrmListPreviewPersistence } from "@crm/shared/useCrmListPreviewPersistence";
import { CrmListExportModalAssignedToSelect } from "@crm/shared/CrmListExportModalAssignedToSelect";
import {
  CrmPhoneDisplay as PhoneDisplay,
  CrmKPICard,
} from "@components/crm/CrmListPageUi";
import {
  buildDealsListSidebarBaseFilterPayload,
  mergeDealsSidebarFiltersIntoCurrent,
} from "@crm/deals/dealsListPageFilterHelpers";
import { CrmDealsListAddTabModal } from "@crm/deals/CrmDealsListAddTabModal";
import {
  buildDealsListFullExportCsvFromApiRows,
  triggerCsvDownload,
} from "@crm/deals/dealsListCsvExport";
import { buildDealsKanbanColumns } from "@crm/deals/dealsListKanbanColumns";
import {
  computeDealsListAnalytics,
  computeDealsListTabFilterCounts,
} from "@crm/deals/dealsListAnalyticsHelpers";
import { transformDealForGenericTableRow } from "@crm/deals/dealsListTransformDealRow";
import {
  DEALS_EMPTY_FOLLOWUP_FORM,
  DEALS_EMPTY_MEETING_FORM,
  dealsFollowupChannelOtherIsInvalid,
} from "@crm/deals/dealsListModalFormDefaults";
import {
  buildDealsListGetDealsExportParams,
  buildDealsListGetDealsParams,
} from "@crm/deals/dealsListGetDealsQueryParams";
import {
  CrmDealDetailViewModalHeader,
  DEAL_DETAIL_MODAL_BODY_FILTER_CSS,
} from "@crm/deals/CrmDealDetailViewModalShared";
import { loadCrmDealWithOptionalLead } from "@crm/deals/crmDealDetailLoad";
import { buildCrmDealDetailPagePath } from "@crm/deals/dealsListDetailRoutes";
import { useCrmDealAttachmentModal } from "@crm/deals/useCrmDealAttachmentModal";
import { useCrmDealMeetingsAndFollowUps } from "@crm/deals/useCrmDealMeetingsAndFollowUps";
import { useDealsListActiveFilterSync } from "@crm/deals/useDealsListActiveFilterSync";
import {
  DEALS_LIST_KANBAN_AVATAR,
  buildDealsListStatsCards,
  buildDealsListTableColumns,
  buildDealsListTableActions,
} from "@crm/deals/dealsListScreenTableBuilders";
import { applyCrmFilterRules, CRM_BASE_FILTER_RULES } from "@crm/shared/crmListFilterHelpers";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { crmAppKeys } from "@query/keys";

const { PERMISSIONS } = HEADER_CONSTANTS;
const ignoredKeys = ["stage_id"];

export type CrmDealsListVariant = "deals" | "approvals";

type DealApprovalsFilterOption = {
  value: string | number;
  label: string | number;
};

const dealApprovalsSelectStyles =
  customSelectStyles as StylesConfig<
    DealApprovalsFilterOption,
    false,
    GroupBase<DealApprovalsFilterOption>
  >;

const APPROVAL_FILTER_RULES = [
  ...CRM_BASE_FILTER_RULES,
  { key: "follow_up_date_from", kind: "truthy" },
  { key: "follow_up_date_to", kind: "truthy" },
  { key: "meeting_date_from", kind: "truthy" },
  { key: "meeting_date_to", kind: "truthy" },
  { key: "probability_min", kind: "string" },
  { key: "probability_max", kind: "string" },
  { key: "deal_type", kind: "truthy" },
  { key: "approval_status", kind: "truthy" },
  { key: "industry", kind: "truthy" },
  { key: "expected_close_date_from", kind: "truthy" },
  { key: "expected_close_date_to", kind: "truthy" },
  { key: "is_won", kind: "truthy", trueValue: true },
  { key: "overdue", kind: "truthy", trueValue: true },
  { key: "high_value", kind: "truthy", trueValue: true },
  { key: "at_risk", kind: "truthy", trueValue: true },
  { key: "reviewed_last_24h", kind: "truthy", trueValue: true },
] as const;

const detailSectionTitleStyle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#1f2937",
  marginBottom: "16px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const detailSectionCardStyle: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "20px",
};

const detailFieldLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: "6px",
};

const detailFieldValueStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#1f2937",
  fontWeight: 500,
  wordBreak: "break-word",
};

const DetailSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div style={{ marginBottom: "28px" }}>
    <h5 style={detailSectionTitleStyle}>
      <div
        style={{
          width: "4px",
          height: "18px",
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          borderRadius: "2px",
        }}
      />
      {title}
    </h5>
    {children}
  </div>
);

const DetailField = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div>
    <div style={detailFieldLabelStyle}>{label}</div>
    <div style={detailFieldValueStyle}>{value}</div>
  </div>
);

function getDealAttachmentIconBackground(
  mimeType: string | undefined,
): string {
  if (!mimeType) {
    return "#6c757d";
  }
  if (mimeType.includes("pdf")) {
    return "#dc3545";
  }
  if (
    mimeType.includes("csv") ||
    mimeType.includes("excel") ||
    mimeType.includes("spreadsheet")
  ) {
    return "#198754";
  }
  if (mimeType.includes("image")) {
    return "#0d6efd";
  }
  return "#6c757d";
}

function CrmDealsListScreenDealHistoryModal({
  viewingDeal,
  showDealHistoryModal,
  setShowDealHistoryModal,
  extensions,
}: Readonly<{
  viewingDeal: any;
  showDealHistoryModal: boolean;
  setShowDealHistoryModal: (v: boolean) => void;
  extensions: any[];
}>): React.ReactElement | null {
  if (!viewingDeal) return null;
  return (
        <Modal
          show={showDealHistoryModal}
          onHide={() => {
            setShowDealHistoryModal(false);
          }}
          size="xl"
          centered
        >
          {/* Custom Header */}
          <div
            style={{
              borderBottom: "1px solid #ccc",
              color: "black",
              padding: "30px",
              position: "relative",
            }}
          >
            <button
              onClick={() => {
                setShowDealHistoryModal(false);
              }}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "black",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                cursor: "pointer",
                transition: "all 0.3s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.3)";
                e.currentTarget.style.transform = "rotate(90deg)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                e.currentTarget.style.transform = "rotate(0deg)";
              }}
            >
              <X size={20} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <History size={28} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontWeight: 600, fontSize: "24px" }}>
                  Complete Deal History
                </h3>
                <p
                  style={{
                    margin: "8px 0 0 0",
                    opacity: 0.9,
                    fontSize: "14px",
                  }}
                >
                  {viewingDeal.name} - All Activities & Changes
                </p>
              </div>
            </div>
          </div>

          <Modal.Body
            style={{ padding: "30px", maxHeight: "70vh", overflowY: "auto" }}
          >
            {/* Deal Summary Card */}
            <Card
              className="border-0 shadow-sm mb-4"
              style={{
                background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
              }}
            >
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6c757d",
                        marginBottom: "4px",
                      }}
                    >
                      Deal Name
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 600 }}>
                      {viewingDeal.name}
                    </div>
                  </Col>
                  <Col md={3}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6c757d",
                        marginBottom: "4px",
                      }}
                    >
                      Current Value
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#198754",
                      }}
                    >
                      {viewingDeal.currency || "AED"}{" "}
                      {Number.parseFloat(
                        String(
                          viewingDeal.net_value || viewingDeal.grand_total || 0,
                        ),
                      ).toLocaleString()}
                    </div>
                  </Col>
                  <Col md={3}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6c757d",
                        marginBottom: "4px",
                      }}
                    >
                      Current Stage
                    </div>
                    <Badge
                      bg="primary"
                      style={{
                        fontSize: "13px",
                        padding: "6px 12px",
                        backgroundColor: viewingDeal.stage?.color || "#6c757d",
                      }}
                    >
                      {viewingDeal.stage?.name || "Not assigned"}
                    </Badge>
                  </Col>
                  <Col md={3}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6c757d",
                        marginBottom: "4px",
                      }}
                    >
                      Owner
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 600 }}>
                      {extensions.find(
                        (ext: any) =>
                          ext?.id == viewingDeal?.assigned_to ||
                          ext?.extension == viewingDeal?.assigned_to,
                      )?.display_name ||
                        extensions.find(
                          (ext: any) =>
                            ext?.id == viewingDeal?.assigned_to ||
                            ext?.extension == viewingDeal?.assigned_to,
                        )?.name ||
                        viewingDeal.assigned_to ||
                        "Not assigned"}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Timeline */}
            {viewingDeal.histories &&
            Array.isArray(viewingDeal.histories) &&
            viewingDeal.histories.length > 0 ? (
              <div style={{ position: "relative" }}>
                {/* Vertical Timeline Line */}
                <div
                  style={{
                    position: "absolute",
                    left: "25px",
                    top: "0",
                    bottom: "0",
                    width: "2px",
                    background:
                      "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
                    opacity: 0.3,
                  }}
                />

                {viewingDeal.histories.map((history: any, index: number) => {
                  // Transform history data to history format
                  const getCategoryAndIcon = (event: string, changes: any) => {
                    if (event === "created") {
                      return {
                        category: "Creation",
                        icon: <Plus size={16} />,
                        color: "#198754",
                      };
                    }
                    if (changes && Object.keys(changes).length > 0) {
                      const changeKeys = Object.keys(changes);
                      if (changeKeys.some((k) => k.includes("stage"))) {
                        return {
                          category: "Stage Change",
                          icon: <GitBranch size={16} />,
                          color: "#0d6efd",
                        };
                      }
                      if (
                        changeKeys.some(
                          (k) =>
                            k.includes("grand_total") ||
                            k.includes("net_value") ||
                            k.includes("discount") ||
                            k.includes("value") ||
                            k.includes("amount") ||
                            k.includes("price"),
                        )
                      ) {
                        return {
                          category: "Financial",
                          icon: <DollarSign size={16} />,
                          color: "#198754",
                        };
                      }
                      if (
                        changeKeys.some(
                          (k) =>
                            k.includes("assigned") ||
                            k.includes("owner") ||
                            k.includes("user_extension"),
                        )
                      ) {
                        return {
                          category: "Assignment",
                          icon: <UserCheck size={16} />,
                          color: "#20c997",
                        };
                      }
                      if (
                        changeKeys.some(
                          (k) =>
                            k.includes("contract") || k.includes("quotation"),
                        )
                      ) {
                        return {
                          category: "Document",
                          icon: <Send size={16} />,
                          color: "#fd7e14",
                        };
                      }
                      if (
                        changeKeys.some(
                          (k) =>
                            k.includes("probability") ||
                            k.includes("negotiation"),
                        )
                      ) {
                        return {
                          category: "Update",
                          icon: <FileText size={16} />,
                          color: "#6c757d",
                        };
                      }
                    }
                    return {
                      category: "Update",
                      icon: <FileText size={16} />,
                      color: "#6c757d",
                    };
                  };

                  const { category, icon, color } = getCategoryAndIcon(
                    history.event,
                    history.changes,
                  );
                  const performedBy =
                    extensions.find(
                      (ext: any) =>
                        ext?.id == history?.user_extension ||
                        ext?.extension == history?.user_extension,
                    )?.display_name ||
                    extensions.find(
                      (ext: any) =>
                        ext?.id == history?.user_extension ||
                        ext?.extension == history?.user_extension,
                    )?.name ||
                    history.user_extension ||
                    "System";
                  const timestamp = new Date(
                    history.created_at,
                  ).toLocaleString();

                  // Build metadata from changes
                  const metadata: Record<string, any> = {};
                  if (
                    history.changes &&
                    Object.keys(history.changes).length > 0
                  ) {
                    Object.entries(history.changes).forEach(
                      ([key, change]: any) => {
                        if (ignoredKeys.includes(key)) return;
                        if (
                          change.old !== undefined &&
                          change.new !== undefined
                        ) {
                          metadata[key] = `${change.old} → ${change.new}`;
                        } else if (change.new !== undefined) {
                          metadata[key] = change.new;
                        }
                      },
                    );
                  }

                  return (
                    <div
                      key={history.id || index}
                      style={{
                        position: "relative",
                        paddingLeft: "60px",
                        paddingBottom: "30px",
                        opacity: 0,
                        animation: `slideIn 0.4s ease forwards ${index * 0.05}s`,
                      }}
                    >
                      {/* Timeline Node */}
                      <div
                        style={{
                          position: "absolute",
                          left: "16px",
                          top: "0",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          background: "white",
                          border: `3px solid ${color}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 1,
                          boxShadow: `0 0 0 4px ${color}20`,
                        }}
                      />

                      {/* Activity Card */}
                      <Card
                        className="border-0 shadow-sm"
                        style={{
                          transition: "all 0.3s",
                          cursor: "pointer",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = "translateX(5px)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(0,0,0,0.15)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = "translateX(0)";
                          e.currentTarget.style.boxShadow =
                            "0 1px 3px rgba(0,0,0,0.1)";
                        }}
                      >
                        <Card.Body style={{ padding: "16px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: "8px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                flex: 1,
                              }}
                            >
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "8px",
                                  background: `${color}15`,
                                  color: color,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {icon}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "14px",
                                      fontWeight: 600,
                                      color: "#1f2937",
                                    }}
                                  >
                                    {history.event === "created"
                                      ? "Created"
                                      : history.event === "updated"
                                        ? "Updated"
                                        : history.event}
                                  </span>
                                  <div
                                    style={{
                                      display: "inline-block",
                                      backgroundColor: color,
                                      color: "#fff",
                                      fontSize: "11px",
                                      padding: "3px 8px",
                                      fontWeight: 500,
                                      borderRadius: "0.375rem",
                                      lineHeight: 1,
                                      textAlign: "center",
                                      whiteSpace: "nowrap",
                                      verticalAlign: "baseline",
                                    }}
                                  >
                                    {category}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    fontSize: "13px",
                                    color: "#6b7280",
                                    marginBottom: "4px",
                                  }}
                                >
                                  {history.description || "Record updated"}
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    fontSize: "12px",
                                    color: "#9ca3af",
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                  >
                                    <Clock size={12} />
                                    {timestamp}
                                  </span>
                                  <span
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                  >
                                    <User size={12} />
                                    {performedBy}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Metadata Tags */}
                          {Object.keys(metadata).length > 0 && (
                            <div
                              style={{
                                marginTop: "12px",
                                paddingTop: "12px",
                                borderTop: "1px solid #f3f4f6",
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "8px",
                              }}
                            >
                              {Object.entries(metadata).map(([key, value]) => (
                                <span
                                  key={key}
                                  style={{
                                    fontSize: "11px",
                                    padding: "4px 8px",
                                    background: "#f9fafb",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "4px",
                                    color: "#4b5563",
                                  }}
                                >
                                  <strong>{key}:</strong> {String(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#6b7280",
                }}
              >
                <History
                  size={48}
                  style={{ opacity: 0.3, marginBottom: "16px" }}
                />
                <p>No history available for this deal</p>
              </div>
            )}

            {/* Animation Keyframes */}
            <style>{`
              @keyframes slideIn {
                from {
                  opacity: 0;
                  transform: translateX(-20px);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }
            `}</style>
          </Modal.Body>

          <Modal.Footer
            style={{
              background: "#f9fafb",
              borderTop: "1px solid #e5e7eb",
              padding: "20px 30px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: "13px", color: "#6b7280" }}>
                <strong>{viewingDeal.histories?.length || 0}</strong> activities
                recorded
              </div>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setShowDealHistoryModal(false);
                }}
                style={{
                  padding: "10px 24px",
                  borderRadius: "8px",
                  fontWeight: 500,
                  fontSize: "14px",
                }}
              >
                Close
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
  );
}

function CrmDealsListScreenDealViewModal({
  viewingDeal,
  showDealViewModal,
  setShowDealViewModal,
  loadingDeal,
  session,
  activeFilter,
  activeTab,
  setActiveTab,
  relatedLead,
  extensions,
  setShowDealHistoryModal,
  setShowAddMeetingModal,
  setMeetingData,
  setMeetingAttendees,
}: Readonly<{
  viewingDeal: any;
  showDealViewModal: boolean;
  setShowDealViewModal: (v: boolean) => void;
  loadingDeal: boolean;
  session: any;
  activeFilter: string;
  activeTab: string;
  setActiveTab: (t: string) => void;
  relatedLead: any;
  extensions: any[];
  setShowDealHistoryModal: (v: boolean) => void;
  setShowAddMeetingModal: (v: boolean) => void;
  setMeetingData: (meeting: any) => void;
  setMeetingAttendees: (attendees: readonly any[]) => void;
}>): React.ReactElement | null {
  if (!viewingDeal) return null;
  return (
        <Modal
          show={showDealViewModal}
          onHide={() => setShowDealViewModal(false)}
          size="xl"
          centered
          className="deal-view-modal"
        >
          <CrmDealDetailViewModalHeader
            onClose={() => setShowDealViewModal(false)}
            dealName={viewingDeal.name}
            stageName={viewingDeal.stage?.name || "No stage"}
            valueDisplay={`${viewingDeal.currency || "AED"} ${Number.parseFloat(
              String(
                viewingDeal.net_value || viewingDeal.grand_total || 0,
              ),
            ).toLocaleString()}`}
            createdLabel={
              viewingDeal.created_at
                ? formatCrmPreviewDate(viewingDeal.created_at) || "N/A"
                : "N/A"
            }
          />

          <Modal.Body
            style={{
              padding: 0,
              maxHeight: "calc(90vh - 200px)",
              overflowY: "auto",
            }}
          >
            {loadingDeal ? (
              <div
                style={{
                  padding: "48px 20px",
                  textAlign: "center",
                }}
              >
                <Spinner
                  animation="border"
                  variant="primary"
                  size="sm"
                  style={{ marginBottom: "12px" }}
                />
                <p
                  className="mb-0"
                  style={{ color: "#6b7280", fontSize: "14px" }}
                >
                  Loading deal details...
                </p>
              </div>
            ) : (
              <>
                <style>{DEAL_DETAIL_MODAL_BODY_FILTER_CSS}</style>

                {/* Main Content Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 360px",
                    minHeight: "500px",
                  }}
                >
                  {/* Left Panel - Main Information */}
                  <div
                    style={{
                      padding: "32px",
                      borderRight: "1px solid #e5e7eb",
                    }}
                  >
                    {/* Tabs Navigation */}
                    <div className="deal-detail-filter-buttons mb-4">
                      <button
                        className={`deal-detail-filter-button ${activeTab === "general-info" ? "active" : ""}`}
                        onClick={() => setActiveTab("general-info")}
                        style={{
                          backgroundColor:
                            activeTab === "general-info" ? "#10b981" : "white",
                          borderColor: "#10b981",
                          color:
                            activeTab === "general-info" ? "white" : "#10b981",
                        }}
                      >
                        <Handshake className="filter-icon" size={18} />
                        <span>General Information</span>
                      </button>
                      <button
                        className={`deal-detail-filter-button ${activeTab === "campaign-prospect" ? "active" : ""}`}
                        onClick={() => setActiveTab("campaign-prospect")}
                        style={{
                          backgroundColor:
                            activeTab === "campaign-prospect"
                              ? "#10b981"
                              : "white",
                          borderColor: "#10b981",
                          color:
                            activeTab === "campaign-prospect"
                              ? "white"
                              : "#10b981",
                        }}
                      >
                        <FileText className="filter-icon" size={18} />
                        <span>Campaign & Prospect</span>
                      </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === "general-info" && (
                      <div>
                        {/* Quick Info Cards */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: "16px",
                            marginBottom: "28px",
                          }}
                        >
                          <div
                            style={{
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              padding: "20px",
                              borderRadius: "12px",
                              transition: "all 0.3s ease",
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform =
                                "translateY(-4px)";
                              e.currentTarget.style.boxShadow =
                                "0 8px 16px rgba(16, 185, 129, 0.15)";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              <div
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "10px",
                                  background: "#10b981",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <User size={20} style={{ color: "white" }} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#10b981",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.8px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Owner
                                </div>
                                <div
                                  style={{
                                    fontSize: "15px",
                                    color: "#1f2937",
                                    fontWeight: 600,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {extensions.find(
                                    (ext: any) =>
                                      ext?.id == viewingDeal?.assigned_to ||
                                      ext?.extension ==
                                        viewingDeal?.assigned_to,
                                  )?.display_name ||
                                    extensions.find(
                                      (ext: any) =>
                                        ext?.id == viewingDeal?.assigned_to ||
                                        ext?.extension ==
                                          viewingDeal?.assigned_to,
                                    )?.name ||
                                    viewingDeal.assigned_to ||
                                    "Not assigned"}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              padding: "20px",
                              borderRadius: "12px",
                              transition: "all 0.3s ease",
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform =
                                "translateY(-4px)";
                              e.currentTarget.style.boxShadow =
                                "0 8px 16px rgba(16, 185, 129, 0.15)";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              <div
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "10px",
                                  background: "#f59e0b",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <DollarSign
                                  size={20}
                                  style={{ color: "white" }}
                                />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#f59e0b",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.8px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Deal Value
                                </div>
                                <div
                                  style={{
                                    fontSize: "15px",
                                    color: "#1f2937",
                                    fontWeight: 600,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {viewingDeal.currency || "AED"}{" "}
                                  {Number.parseFloat(
                                    String(
                                      viewingDeal.net_value ||
                                        viewingDeal.grand_total ||
                                        0,
                                    ),
                                  ).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              padding: "20px",
                              borderRadius: "12px",
                              transition: "all 0.3s ease",
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform =
                                "translateY(-4px)";
                              e.currentTarget.style.boxShadow =
                                "0 8px 16px rgba(16, 185, 129, 0.15)";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              <div
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "10px",
                                  background:
                                    viewingDeal.stage?.color || "#6c757d",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <Target size={20} style={{ color: "white" }} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#6b7280",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.8px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Stage
                                </div>
                                <div
                                  style={{
                                    fontSize: "15px",
                                    color: "#1f2937",
                                    fontWeight: 600,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {viewingDeal.stage?.name || "Not assigned"}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              padding: "20px",
                              borderRadius: "12px",
                              transition: "all 0.3s ease",
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform =
                                "translateY(-4px)";
                              e.currentTarget.style.boxShadow =
                                "0 8px 16px rgba(16, 185, 129, 0.15)";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              <div
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "10px",
                                  background: "#8b5cf6",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <Percent size={20} style={{ color: "white" }} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#8b5cf6",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.8px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Probability
                                </div>
                                <div
                                  style={{
                                    fontSize: "15px",
                                    color: "#1f2937",
                                    fontWeight: 600,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {viewingDeal?.stage?.probability || 0}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Deal Information Section */}
                        <div style={{ marginBottom: "28px" }}>
                          <h5
                            style={{
                              fontSize: "15px",
                              fontWeight: 700,
                              color: "#1f2937",
                              marginBottom: "16px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "4px",
                                height: "18px",
                                background:
                                  "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                borderRadius: "2px",
                              }}
                            />
                            Deal Details
                          </h5>
                          <div
                            style={{
                              background: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              borderRadius: "12px",
                              padding: "20px",
                            }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "140px 1fr",
                                gap: "16px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  color: "#6b7280",
                                  fontSize: "14px",
                                  fontWeight: 600,
                                }}
                              >
                                <Handshake
                                  size={16}
                                  style={{ color: "#10b981" }}
                                />
                                Deal Name
                              </div>
                              <div
                                style={{
                                  color: "#1f2937",
                                  fontSize: "15px",
                                  fontWeight: 500,
                                }}
                              >
                                {viewingDeal.name}
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  color: "#6b7280",
                                  fontSize: "14px",
                                  fontWeight: 600,
                                }}
                              >
                                <Calendar
                                  size={16}
                                  style={{ color: "#10b981" }}
                                />
                                Created
                              </div>
                              <div
                                style={{
                                  color: "#1f2937",
                                  fontSize: "15px",
                                  fontWeight: 500,
                                }}
                              >
                                {viewingDeal.created_at
                                  ? formatCrmPreviewDateTime(
                                      viewingDeal.created_at,
                                    ) || "N/A"
                                  : "N/A"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Client Information Section */}
                        {viewingDeal.company_name && (
                          <DetailSection title="Client Information">
                            <div style={detailSectionCardStyle}>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: "16px 24px",
                                }}
                              >
                                <DetailField
                                  label="Client Name"
                                  value={
                                    <>
                                      <Building2
                                        size={14}
                                        style={{
                                          color: "#10b981",
                                          marginRight: "6px",
                                          display: "inline",
                                        }}
                                      />
                                      {viewingDeal.company_name}
                                    </>
                                  }
                                />
                                {viewingDeal.industry && (
                                  <DetailField
                                    label="Industry"
                                    value={viewingDeal.industry}
                                  />
                                )}
                              </div>
                            </div>
                          </DetailSection>
                        )}

                        {/* Lead Information Section */}
                        {relatedLead && (
                          <DetailSection title="Lead Information">
                            <div style={detailSectionCardStyle}>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: "16px 24px",
                                }}
                              >
                                <DetailField
                                  label="Lead Name"
                                  value={relatedLead.name}
                                />
                                {relatedLead.lead_potential && (
                                  <DetailField
                                    label="Lead Potential"
                                    value={
                                      <Badge
                                        bg={
                                          relatedLead.lead_potential === "Hot"
                                            ? "danger"
                                            : relatedLead.lead_potential ===
                                                "Warm"
                                              ? "warning"
                                              : "secondary"
                                        }
                                        style={{
                                          padding: "6px 14px",
                                          borderRadius: "20px",
                                          fontSize: "12px",
                                          fontWeight: 600,
                                        }}
                                      >
                                        {relatedLead.lead_potential || "N/A"}
                                      </Badge>
                                    }
                                  />
                                )}
                                {relatedLead.user_extension && (
                                  <DetailField
                                    label="Owner"
                                    value={
                                      <>
                                        <User
                                          size={14}
                                          style={{
                                            color: "#10b981",
                                            marginRight: "6px",
                                            display: "inline",
                                          }}
                                        />
                                        {extensions.find(
                                          (ext: any) =>
                                            ext?.id ==
                                              relatedLead?.user_extension ||
                                            ext?.extension ==
                                              relatedLead?.user_extension,
                                        )?.display_name ||
                                          extensions.find(
                                            (ext: any) =>
                                              ext?.id ==
                                                relatedLead?.user_extension ||
                                              ext?.extension ==
                                                relatedLead?.user_extension,
                                          )?.name ||
                                          relatedLead.user_extension ||
                                          "Not assigned"}
                                      </>
                                    }
                                  />
                                )}
                                {relatedLead.created_at && (
                                  <DetailField
                                    label="Created Date"
                                    value={
                                      <>
                                        <Calendar
                                          size={14}
                                          style={{
                                            color: "#10b981",
                                            marginRight: "6px",
                                            display: "inline",
                                          }}
                                        />
                                        {relatedLead.created_at
                                          ? formatDateForTable(
                                              relatedLead.created_at,
                                            )
                                          : "N/A"}
                                      </>
                                    }
                                  />
                                )}
                              </div>
                            </div>
                          </DetailSection>
                        )}
                      </div>
                    )}

                    {activeTab === "campaign-prospect" && (
                      <div>
                        {/* Campaign Information Section */}
                        <DetailSection title="Campaign Information">
                          {relatedLead?.campaign ? (
                            <div style={detailSectionCardStyle}>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: "16px 24px",
                                }}
                              >
                                <DetailField
                                  label="Campaign Name"
                                  value={relatedLead.campaign.name}
                                />
                                {relatedLead.campaign_field_values &&
                                  Object.keys(relatedLead.campaign_field_values)
                                    .length > 0 &&
                                  Object.entries(
                                    relatedLead.campaign_field_values,
                                  ).map(([key, value]: [string, any]) => (
                                    <DetailField
                                      key={key}
                                      label={key}
                                      value={String(value)}
                                    />
                                  ))}
                              </div>
                            </div>
                          ) : (
                            <div
                              style={{
                                padding: "40px",
                                textAlign: "center",
                                color: "#6b7280",
                                background: "#f9fafb",
                                border: "2px dashed #d1d5db",
                                borderRadius: "12px",
                              }}
                            >
                              No campaign information available
                            </div>
                          )}
                        </DetailSection>

                        {/* Prospect Information Section */}
                        <DetailSection title="Prospect Information">
                          {relatedLead?.crm_data ? (
                            <div style={detailSectionCardStyle}>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: "16px 24px",
                                }}
                              >
                                {relatedLead.crm_data.id && (
                                  <DetailField
                                    label="CRM Data ID"
                                    value={`#${relatedLead.crm_data.id}`}
                                  />
                                )}
                                {(relatedLead.crm_data.name ||
                                  (relatedLead.crm_data.data &&
                                    relatedLead.crm_data.data.name)) && (
                                  <DetailField
                                    label="Name"
                                    value={
                                      relatedLead.crm_data.name ||
                                      (relatedLead.crm_data.data &&
                                        relatedLead.crm_data.data.name) ||
                                      "N/A"
                                    }
                                  />
                                )}
                                {(relatedLead.crm_data.phone ||
                                  (relatedLead.crm_data.data &&
                                    relatedLead.crm_data.data.phone)) && (
                                  <DetailField
                                    label="Phone"
                                    value={
                                      <PhoneDisplay
                                        phone={
                                          relatedLead.crm_data.phone ||
                                          (relatedLead.crm_data.data &&
                                            relatedLead.crm_data.data.phone) ||
                                          ""
                                        }
                                      />
                                    }
                                  />
                                )}
                                {relatedLead.crm_data.source_file && (
                                  <DetailField
                                    label="Source File"
                                    value={relatedLead.crm_data.source_file}
                                  />
                                )}
                                {relatedLead.crm_data.uploaded_by && (
                                  <DetailField
                                    label="Uploaded By"
                                    value={
                                      <>
                                        <User
                                          size={14}
                                          style={{
                                            color: "#10b981",
                                            marginRight: "6px",
                                            display: "inline",
                                          }}
                                        />
                                        {relatedLead.crm_data.uploaded_by}
                                      </>
                                    }
                                  />
                                )}
                                {relatedLead.crm_data.created_at && (
                                  <DetailField
                                    label="Created At"
                                    value={
                                      <>
                                        <Calendar
                                          size={14}
                                          style={{
                                            color: "#10b981",
                                            marginRight: "6px",
                                            display: "inline",
                                          }}
                                        />
                                        {formatDateForTable(
                                          relatedLead.crm_data.created_at,
                                        )}
                                      </>
                                    }
                                  />
                                )}
                              </div>
                            </div>
                          ) : (
                            <div
                              style={{
                                padding: "40px",
                                textAlign: "center",
                                color: "#6b7280",
                                background: "#f9fafb",
                                border: "2px dashed #d1d5db",
                                borderRadius: "12px",
                              }}
                            >
                              No prospect information available
                            </div>
                          )}
                        </DetailSection>

                        {/* Prospect Fields Section */}
                        {relatedLead?.crm_data?.data &&
                          typeof relatedLead.crm_data.data === "object" &&
                          Object.keys(relatedLead.crm_data.data).length > 0 && (
                            <DetailSection title="Prospect Fields">
                              <div style={detailSectionCardStyle}>
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "16px 24px",
                                  }}
                                >
                                  {Object.entries(relatedLead.crm_data.data)
                                    .filter(
                                      ([key]) =>
                                        key.toLowerCase() !== "name" &&
                                        key.toLowerCase() !== "phone",
                                    )
                                    .map(([key, value]: [string, any]) => (
                                      <DetailField
                                        key={key}
                                        label={key.replaceAll("_", " ")}
                                        value={String(value || "N/A")}
                                      />
                                    ))}
                                </div>
                              </div>
                            </DetailSection>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Right Panel - Quick Actions & Timeline */}
                  <div
                    style={{
                      padding: "32px 24px",
                      background: "#fafbfc",
                      display: "flex",
                      flexDirection: "column",
                      gap: "24px",
                    }}
                  >
                    {/* Quick Actions */}
                    <div>
                      <h6
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "14px",
                        }}
                      >
                        Quick Actions
                      </h6>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        {session?.user?.permissions?.includes(
                          PERMISSIONS.EDIT_CRM_DEALS,
                        ) && (
                          <button
                            style={{
                              background: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "10px",
                              padding: "12px 16px",
                              cursor:
                                activeFilter === "lost"
                                  ? "not-allowed"
                                  : "pointer",
                              opacity: activeFilter === "lost" ? 0.6 : 1,
                              transition: "all 0.2s ease",
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              fontSize: "14px",
                              fontWeight: 500,
                              color: "#1f2937",
                            }}
                            onClick={() => {
                              if (activeFilter === "lost") return;
                              setShowDealViewModal(false);
                              window.location.href = `/crm/deals/${viewingDeal.id}/edit`;
                            }}
                            disabled={activeFilter === "lost"}
                            onMouseOver={(e) => {
                              if (activeFilter === "lost") return;
                              e.currentTarget.style.borderColor = "#10b981";
                              e.currentTarget.style.background = "#f0fdf4";
                              e.currentTarget.style.transform =
                                "translateX(4px)";
                            }}
                            onMouseOut={(e) => {
                              if (activeFilter === "lost") return;
                              e.currentTarget.style.borderColor = "#e5e7eb";
                              e.currentTarget.style.background = "white";
                              e.currentTarget.style.transform = "translateX(0)";
                            }}
                          >
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                background: "#10b981",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Edit size={16} style={{ color: "white" }} />
                            </div>
                            Edit Deal
                          </button>
                        )}

                        <button
                          style={{
                            background: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "10px",
                            padding: "12px 16px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#1f2937",
                          }}
                          onClick={() => setShowDealHistoryModal(true)}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = "#10b981";
                            e.currentTarget.style.background = "#f0fdf4";
                            e.currentTarget.style.transform = "translateX(4px)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = "#e5e7eb";
                            e.currentTarget.style.background = "white";
                            e.currentTarget.style.transform = "translateX(0)";
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background:
                                "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <History size={16} style={{ color: "white" }} />
                          </div>
                          View History
                        </button>
                      </div>
                    </div>

                    {/* Status Overview */}
                    <div>
                      <h6
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "14px",
                        }}
                      >
                        Status Overview
                      </h6>
                      <div
                        style={{
                          background: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#6b7280",
                                fontWeight: 500,
                              }}
                            >
                              Stage
                            </span>
                            <Badge
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                padding: "4px 10px",
                                borderRadius: "6px",
                                backgroundColor:
                                  viewingDeal.stage?.color || "#6c757d",
                              }}
                            >
                              {viewingDeal.stage?.name || "N/A"}
                            </Badge>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#6b7280",
                                fontWeight: 500,
                              }}
                            >
                              Value
                            </span>
                            <span
                              style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 600,
                              }}
                            >
                              {viewingDeal.currency || "AED"}{" "}
                              {Number.parseFloat(
                                String(
                                  viewingDeal.net_value ||
                                    viewingDeal.grand_total ||
                                    0,
                                ),
                              ).toLocaleString()}
                            </span>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#6b7280",
                                fontWeight: 500,
                              }}
                            >
                              Probability
                            </span>
                            <span
                              style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 600,
                              }}
                            >
                              {viewingDeal?.stage?.probability || 0}%
                            </span>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#6b7280",
                                fontWeight: 500,
                              }}
                            >
                              Meetings
                            </span>
                            <span
                              style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 600,
                              }}
                            >
                              {viewingDeal.meetings?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Meetings Timeline */}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "14px",
                        }}
                      >
                        <h6
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            margin: 0,
                          }}
                        >
                          Recent Meetings
                        </h6>
                        {session?.user?.permissions?.includes(
                          PERMISSIONS.ADD_MEETING_CRM_DEALS,
                        ) && (
                          <button
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#10b981",
                              cursor: "pointer",
                              padding: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "6px",
                              transition: "all 0.2s ease",
                            }}
                            onClick={() => {
                              setMeetingData({
                                ...DEALS_EMPTY_MEETING_FORM,
                                dealId: viewingDeal.id,
                                dealName: viewingDeal.name,
                                meetingOutcome: "Scheduled",
                              });
                              setMeetingAttendees([]);
                              setShowAddMeetingModal(true);
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = "#f0fdf4";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                            title="Schedule Meeting"
                          >
                            <Plus size={16} />
                          </button>
                        )}
                      </div>
                      <div
                        style={{
                          background: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "16px",
                          maxHeight: "300px",
                          overflowY: "auto",
                        }}
                      >
                        {viewingDeal.meetings &&
                        viewingDeal.meetings.length > 0 ? (
                          <div style={{ position: "relative" }}>
                            {/* Timeline line */}
                            <div
                              style={{
                                position: "absolute",
                                left: "7px",
                                top: "8px",
                                bottom: "8px",
                                width: "2px",
                                background: "#e5e7eb",
                              }}
                            />

                            {viewingDeal.meetings
                              .slice(0, 5)
                              .map((meeting: any, index: number) => {
                                const isCompleted =
                                  meeting.meeting_outcome ===
                                  "Completed - Successful";
                                const isCancelled =
                                  meeting.meeting_outcome === "Cancelled";
                                return (
                                  <div
                                    key={meeting.id || index}
                                    style={{
                                      position: "relative",
                                      paddingLeft: "28px",
                                      paddingBottom:
                                        index <
                                        Math.min(
                                          viewingDeal.meetings.length,
                                          5,
                                        ) -
                                          1
                                          ? "16px"
                                          : "0",
                                    }}
                                  >
                                    {/* Timeline dot */}
                                    <div
                                      style={{
                                        position: "absolute",
                                        left: "0",
                                        top: "4px",
                                        width: "16px",
                                        height: "16px",
                                        borderRadius: "50%",
                                        background: isCompleted
                                          ? "#10b981"
                                          : isCancelled
                                            ? "#dc3545"
                                            : "#f59e0b",
                                        border: "3px solid white",
                                        boxShadow: "0 0 0 1px #e5e7eb",
                                      }}
                                    />

                                    <div>
                                      <div
                                        style={{
                                          fontSize: "12px",
                                          color: "#1f2937",
                                          fontWeight: 600,
                                          marginBottom: "4px",
                                        }}
                                      >
                                        {meeting.name}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "#6b7280",
                                          marginBottom: "4px",
                                        }}
                                      >
                                        {meeting.meeting_date
                                          ? formatMeetingDateLocal(
                                              meeting.meeting_date,
                                              meeting.meeting_time,
                                            ) || moment(meeting.meeting_date).format(
                                              "MMM DD, YYYY",
                                            )
                                          : "N/A"}
                                      </div>
                                      {meeting.meeting_outcome && (
                                        <Badge
                                          bg={
                                            meeting.meeting_outcome ===
                                            "Completed - Successful"
                                              ? "success"
                                              : meeting.meeting_outcome ===
                                                  "Completed - Needs Follow-up"
                                                ? "info"
                                                : meeting.meeting_outcome ===
                                                    "Cancelled"
                                                  ? "danger"
                                                  : meeting.meeting_outcome ===
                                                      "Rescheduled"
                                                    ? "warning"
                                                    : "secondary"
                                          }
                                          style={{
                                            fontSize: "10px",
                                            padding: "2px 8px",
                                          }}
                                        >
                                          {meeting.meeting_outcome}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                            {viewingDeal.meetings.length > 5 && (
                              <div
                                style={{
                                  textAlign: "center",
                                  marginTop: "12px",
                                  paddingTop: "12px",
                                  borderTop: "1px solid #f3f4f6",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "12px",
                                    color: "#10b981",
                                    fontWeight: 600,
                                  }}
                                >
                                  +{viewingDeal.meetings.length - 5} more
                                  meetings
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            style={{
                              textAlign: "center",
                              padding: "20px",
                              color: "#9ca3af",
                            }}
                          >
                            <Users
                              size={32}
                              style={{ marginBottom: "8px", opacity: 0.5 }}
                            />
                            <div style={{ fontSize: "13px" }}>
                              No meetings yet
                            </div>
                            {session?.user?.permissions?.includes(
                              PERMISSIONS.ADD_MEETING_CRM_DEALS,
                            ) && (
                              <button
                                style={{
                                  marginTop: "12px",
                                  padding: "8px 16px",
                                  background: "#10b981",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  transition: "all 0.2s ease",
                                }}
                                onClick={() => {
                                  setMeetingData({
                                    ...DEALS_EMPTY_MEETING_FORM,
                                    dealId: viewingDeal.id,
                                    dealName: viewingDeal.name,
                                    meetingOutcome: "Scheduled",
                                  });
                                  setMeetingAttendees([]);
                                  setShowAddMeetingModal(true);
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.background = "#059669";
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.background = "#10b981";
                                }}
                              >
                                <Plus size={14} />
                                Schedule Meeting
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Modal.Body>

          {/* Footer */}
          <div
            style={{
              padding: "20px 32px",
              borderTop: "1px solid #e5e7eb",
              background: "white",
              borderBottomLeftRadius: "12px",
              borderBottomRightRadius: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: "13px", color: "#6b7280" }}>
              Deal ID: <strong>#{viewingDeal.id}</strong>
            </div>
            <Button
              variant="outline-secondary"
              onClick={() => setShowDealViewModal(false)}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "14px",
                border: "2px solid #e5e7eb",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#10b981";
                e.currentTarget.style.color = "#10b981";
                e.currentTarget.style.background = "#f0fdf4";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.color = "#6c757d";
                e.currentTarget.style.background = "white";
              }}
            >
              Close
            </Button>
          </div>
        </Modal>
  );
}

export function CrmDealsListScreenView({
  listVariant,
}: Readonly<{
  listVariant: CrmDealsListVariant;
}>) {
  const isApprovalsList = listVariant === "approvals";
  const { data: session } = useSession();
  const canAccessDealsScreen = useMemo(() => {
    const p = session?.user?.permissions;
    const canViewDeals = Boolean(p?.includes(PERMISSIONS.VIEW_CRM_DEALS));
    const canApproveDeals = Boolean(
      p?.includes(PERMISSIONS.APPROVE_REJECT_CRM_DEALS),
    );
    return isApprovalsList ? canViewDeals || canApproveDeals : canViewDeals;
  }, [session?.user?.permissions, isApprovalsList]);
  const router = useRouter();
  const { dialNumber, isInitialized } = useCti();

  const dealStagesBootstrapQuery = useQuery({
    queryKey: crmAppKeys.crmStages.byType("deal"),
    queryFn: () => getStages("deal"),
  });
  const lostReasonStagesBootstrapQuery = useQuery({
    queryKey: crmAppKeys.crmStages.byType("lost_reason"),
    queryFn: () => (getStages as (type: string) => Promise<any[]>)("lost_reason"),
  });
  const dealsHierarchyBootstrapQuery = useQuery({
    queryKey: crmAppKeys.hierarchyExtensions.module(ModuleSlug.CRM_DEALS),
    queryFn: async () => {
      const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_DEALS);
      return hierarchyData?.extensions ?? [];
    },
  });
  const dealsFilterBusinessTypesQuery = useQuery({
    queryKey: crmAppKeys.businessTypes.selectOptions(),
    queryFn: async () => {
      const res = await getBusinessTypes({ per_page: 1000 });
      return res?.data ?? [];
    },
  });

  const stages = dealStagesBootstrapQuery.data ?? [];
  const lostReasons = lostReasonStagesBootstrapQuery.data ?? [];
  const extensions = dealsHierarchyBootstrapQuery.data ?? [];
  const filterBusinessTypes = dealsFilterBusinessTypesQuery.data ?? [];

  const [estimationItems, setEstimationItems] = useState<
    Array<{
      product_id: number;
      product_service: string;
      description: string;
      qty: number;
      unit_price: number;
      original_currency: string;
      original_price: number;
    }>
  >([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemFormData, setItemFormData] = useState({
    product_id: null as number | null,
    product_service: "",
    description: "",
    qty: 1,
    unit_price: 0,
  });
  const [showRevisionHistoryModal, setShowRevisionHistoryModal] =
    useState(false);
  const [convertingPrice, setConvertingPrice] = useState(false);
  const [showAllIndustries, setShowAllIndustries] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>(
    () =>
      listVariant === "approvals" ? { approval_status: "pending" } : {},
  );
  const [dealsData, setDealsData] = useState<any[]>([]);
  const [totalDeals, setTotalDeals] = useState(0);
  const [summaryTiles, setSummaryTiles] = useState<any>(null);
  const [dealsMetrics, setDealsMetrics] = useState<Record<string, number> | null>(
    null,
  );
  const [tabTotals, setTabTotals] = useState<Record<string, number>>({
    all: 0,
    lost: 0,
    deleted: 0,
    rejected: 0,
  });

  const [showConvertToOrderModal, setShowConvertToOrderModal] = useState(false);
  const [dealToConvert, setDealToConvert] = useState<number | null>(null);
  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<any>(null);
  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [successModalTitle, setSuccessModalTitle] = useState("");
  const [successModalDescription, setSuccessModalDescription] = useState("");

  // Helper function to get name by extension
  function getNameByExtension(extension: string) {
    const extensionData = extensions.find(
      (ext: { id?: unknown; extension?: unknown; display_name?: string; name?: string }) =>
        ext.id === extension || ext.extension === extension,
    );
    return extensionData?.display_name || extensionData?.name || extension;
  }

  // View Modal
  const [showDealViewModal, setShowDealViewModal] = useState(false);
  const [viewingDeal, setViewingDeal] = useState<any>(null);
  const [loadingDeal, setLoadingDeal] = useState(false);
  const [showDealHistoryModal, setShowDealHistoryModal] = useState(false);
  const [relatedLead, setRelatedLead] = useState<any>(null);
  const [loadingLead, setLoadingLead] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("general-info");

  // Sidebar states
  const [showDealSidebar, setShowDealSidebar] = useState(false);
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [dealSidebarRefreshKey, setDealSidebarRefreshKey] = useState(0);

  const sidebarDealRecordId = useMemo(() => {
    const rawId = selectedDeal?.id ?? selectedDeal?.rawData?.id;
    const numericId = Number(rawId);
    return Number.isFinite(numericId) && numericId > 0 ? numericId : 0;
  }, [selectedDeal]);

  const sidebarLogActivityModals = useCrmLogActivityModals({
    recordType: "deal",
    recordId: sidebarDealRecordId,
    recordName: selectedDeal?.name ?? "",
    recordPhone:
      selectedDeal?.phone ??
      selectedDeal?.rawData?.phone ??
      selectedDeal?.decision_maker_phone ??
      "",
    recordEmail:
      selectedDeal?.email ??
      selectedDeal?.rawData?.email ??
      selectedDeal?.main_decision_maker?.email ??
      "",
    onLogged: () => {
      setDealSidebarRefreshKey((prev) => prev + 1);
    },
  });
  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [dealsViewMode, setDealsViewMode] = useState<"table" | "board">(() =>
    listVariant === "approvals" ? "table" : "board",
  );
  const [boardHeight, setBoardHeight] = useState("calc(100vh - 194px)");

  useEffect(() => {
    const el = document.querySelector(".gt-toolbar-container");
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const toolbarH = entry.contentRect.height;
        setBoardHeight(`calc(100vh - 74px - ${toolbarH}px)`);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const [exportFilters, setExportFilters] = useState<Record<string, any>>({});
  const [exportFileName, setExportFileName] = useState("");
  const [exporting, setExporting] = useState(false);
  const [showCreateDealSidebar, setShowCreateDealSidebar] = useState(false);
  const [editingDealIdInSidebar, setEditingDealIdInSidebar] = useState<
    number | null
  >(null);
  const [showEditDealSidebar, setShowEditDealSidebar] = useState(false);

  // Add Deals button states
  const [showAddDealsDropdown, setShowAddDealsDropdown] = useState(false);
  const addDealsRef = React.useRef<HTMLDivElement>(null);

  // Attachments Modal
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedDealForAttachments, setSelectedDealForAttachments] =
    useState<any>(null);

  const {
    attachments,
    loadingAttachments,
    uploadingFile,
    setFileInputRef,
    showDeleteAttachmentModal,
    setShowDeleteAttachmentModal,
    attachmentToDelete,
    setAttachmentToDelete,
    handleFileUpload,
    confirmDeleteAttachment,
    handleDownloadAttachment,
  } = useCrmDealAttachmentModal({
    selectedDealForAttachments,
    showAttachmentModal,
  });

  const { fetchDealMeetings, dealFollowUps, fetchDealFollowUps } =
    useCrmDealMeetingsAndFollowUps();

  // Download file modal (table column)
  const [showDownloadFileModal, setShowDownloadFileModal] = useState(false);
  const [dealForDownload, setDealForDownload] = useState<any>(null);

  // Follow-up Modal
  const [showAddFollowupModal, setShowAddFollowupModal] = useState(false);
  const [followUpIdToEdit, setFollowUpIdToEdit] = useState<number | null>(null);
  const [followupData, setFollowupData] = useState(() => ({
    ...DEALS_EMPTY_FOLLOWUP_FORM,
  }));
  const [loadingFollowUp, setLoadingFollowUp] = useState(false);

  // Delete Follow-up Modal
  const [showDeleteFollowUpModal, setShowDeleteFollowUpModal] = useState(false);
  const [followUpToDelete, setFollowUpToDelete] = useState<{
    dealId: number;
    followUpId: number;
    label?: string;
  } | null>(null);

  // Meeting Modal
  const [showAddMeetingModal, setShowAddMeetingModal] = useState(false);
  const [meetingIdToEdit, setMeetingIdToEdit] = useState<number | null>(null);
  const [meetingData, setMeetingData] = useState(() => ({
    ...DEALS_EMPTY_MEETING_FORM,
  }));
  const [meetingAttendees, setMeetingAttendees] = useState<readonly any[]>([]);
  const [loadingMeeting, setLoadingMeeting] = useState(false);

  // Delete Meeting Modal
  const [showDeleteMeetingModal, setShowDeleteMeetingModal] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<{
    meetingId: number;
    meetingName?: string;
    dealId?: number;
  } | null>(null);

  // Mark Deal Lost Modal
  const [showMarkLostModal, setShowMarkLostModal] = useState(false);
  const [dealToMarkLost, setDealToMarkLost] = useState<any>(null);
  const [lostReasonId, setLostReasonId] = useState<number | null>(null);
  const [lostFeedback, setLostFeedback] = useState("");

  // UI State
  const [showDealsAnalytics, setShowDealsAnalytics] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [dealsSearch, setDealsSearch] = useState("");
  const [showTabModal, setShowTabModal] = useState(false);
  const [customTabs, setCustomTabs] = useState<TabConfig[]>([]);
  const [selectedDealsColumns, setSelectedDealsColumns] = useState<string[]>(
    () => {
      const defaults = [
        "name",
        "company",
        "stage",
        "approvalStatus",
        "dealType",
        "value",
        "assignedUser",
        "closeDate",
        "owner",
      ];
      if (globalThis.window === undefined) {
        return defaults;
      }
      const stored = parseStoredVisibleColumnKeysLoose(
        globalThis.localStorage.getItem("dealsSelectedColumns"),
      );
      return stored ?? defaults;
    },
  );
  const [dealsPagination, setDealsPagination] = useState({
    currentPage: 1,
    rowsPerPage: 15,
    sortBy: "",
    sortOrder: "asc" as "asc" | "desc",
  });
  const [serverPaginationMeta, setServerPaginationMeta] = useState<{
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
  } | null>(null);
  const [dealsFilters, setDealsFilters] = useState({
    assignedTo: null as string | null,
    approvalStatus: null as string | null,
    stage: null as string | null,
    followUpDateFrom: null as string | null,
    followUpDateTo: null as string | null,
    probabilityMin: null as string | null,
    probabilityMax: null as string | null,
    dealType: null as string | null,
    industry: null as string | null,
    businessType: null as string | null,
    expectedCloseDateFrom: null as string | null,
    expectedCloseDateTo: null as string | null,
    includeConverted: false as boolean,
    includeLost: false as boolean,
    includeArchived: false as boolean,
    createdAtFrom: null as string | null,
    createdAtTo: null as string | null,
    created_at_month: null as string | null,
    ticketId: null as string | null,
    hasMeetings: false as boolean,
  });

  // Handle click outside for Add Deals dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addDealsRef.current &&
        !addDealsRef.current.contains(event.target as Node)
      ) {
        setShowAddDealsDropdown(false);
      }
    };
    if (showAddDealsDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showAddDealsDropdown]);

  // Sync export modal filters from current table filters when modal opens
  useEffect(() => {
    if (showExportModal) {
      setExportFilters({ ...currentFilters });
      if (!exportFileName) {
        setExportFileName(
          isApprovalsList
            ? `approvals_deals_${moment().format("YYYY-MM-DD")}`
            : `deals_${moment().format("YYYY-MM-DD")}`,
        );
      }
    }
  }, [showExportModal, currentFilters, isApprovalsList]);

  // Build API params from filters for export (same shape as fetchDeals)
  const buildDealsExportParams = useCallback(
    (
      filters: Record<string, any>,
      pagination?: { page: number; per_page: number },
    ) => buildDealsListGetDealsExportParams(filters, pagination),
    [],
  );

  const fetchDealsForExport = useCallback(
    async (filters: Record<string, any>) => {
      const PER_PAGE = 100;
      let page = 1;
      const allData: any[] = [];
      for (;;) {
        const response: any = await getDeals(
          buildDealsExportParams(filters, { page, per_page: PER_PAGE }),
        );
        const dealsArray: any[] = response?.dataList || [];
        const pagination: any = response?.meta || {};
        const lastPage = pagination?.last_page ?? 1;
        allData.push(...dealsArray);
        if (page >= lastPage || dealsArray.length < PER_PAGE) break;
        page += 1;
      }
      return allData;
    },
    [buildDealsExportParams],
  );

  const handleDealsExport = useCallback(async () => {
    const defaultName = isApprovalsList
      ? `approvals_deals_${moment().format("YYYY-MM-DD")}`
      : `deals_${moment().format("YYYY-MM-DD")}`;
    const name = exportFileName.trim() || defaultName;
    setExporting(true);
    try {
      const allData = await fetchDealsForExport(exportFilters);
      if (allData.length === 0) {
        toast.info("No deals match the selected filters.");
        return;
      }
      const csvText = buildDealsListFullExportCsvFromApiRows(allData);
      triggerCsvDownload(csvText, name);
      setShowExportModal(false);
      toast.success(`Exported ${allData.length} deals successfully!`);
    } catch (err) {
      toast.error("Failed to export deals");
    } finally {
      setExporting(false);
    }
  }, [exportFileName, exportFilters, fetchDealsForExport, isApprovalsList]);

  const buildDealsParams = useCallback(
    (
      filters: Record<string, any>,
      page = 1,
      perPage = 15,
      includeTableSorting = true,
    ) =>
      buildDealsListGetDealsParams(filters, {
        page,
        perPage,
        includeTableSorting,
        tableSort: dealsPagination,
      }),
    [dealsPagination.sortBy, dealsPagination.sortOrder],
  );

  const buildDealsSidebarFiltersPayload = useCallback(() => {
    const filtersToApply = buildDealsListSidebarBaseFilterPayload(
      dealsSearch,
      {
        assignedTo: dealsFilters.assignedTo,
        stage: dealsFilters.stage,
        followUpDateFrom: dealsFilters.followUpDateFrom,
        followUpDateTo: dealsFilters.followUpDateTo,
        probabilityMin: dealsFilters.probabilityMin,
        probabilityMax: dealsFilters.probabilityMax,
        expectedCloseDateFrom: dealsFilters.expectedCloseDateFrom,
        expectedCloseDateTo: dealsFilters.expectedCloseDateTo,
        approvalStatus: dealsFilters.approvalStatus,
      },
      "includeIfTruthy",
    );
    if (dealsFilters.businessType) {
      filtersToApply.business_type_id = dealsFilters.businessType;
    }
    filtersToApply.include_converted = dealsFilters.includeConverted || undefined;
    filtersToApply.include_lost = dealsFilters.includeLost || undefined;
    filtersToApply.include_archived = dealsFilters.includeArchived || undefined;
    filtersToApply.has_meetings = dealsFilters.hasMeetings || undefined;
    if (dealsFilters.createdAtFrom) {
      filtersToApply.created_at_from = dealsFilters.createdAtFrom;
    }
    if (dealsFilters.createdAtTo) {
      filtersToApply.created_at_to = dealsFilters.createdAtTo;
    }
    if (dealsFilters.created_at_month) {
      filtersToApply.created_at_month = dealsFilters.created_at_month;
    }
    if (dealsFilters.ticketId) {
      filtersToApply.ticket_id = dealsFilters.ticketId;
    }
    return filtersToApply;
  }, [dealsSearch, dealsFilters]);

  const buildApprovalsSidebarFiltersPayload = useCallback(() => {
    const filtersToApply = buildDealsListSidebarBaseFilterPayload(
      dealsSearch,
      {
        assignedTo: dealsFilters.assignedTo,
        stage: dealsFilters.stage,
        followUpDateFrom: dealsFilters.followUpDateFrom,
        followUpDateTo: dealsFilters.followUpDateTo,
        probabilityMin: dealsFilters.probabilityMin,
        probabilityMax: dealsFilters.probabilityMax,
        expectedCloseDateFrom: dealsFilters.expectedCloseDateFrom,
        expectedCloseDateTo: dealsFilters.expectedCloseDateTo,
        approvalStatus: dealsFilters.approvalStatus,
      },
      "alwaysSetNullable",
    );
    if (dealsFilters.dealType) {
      filtersToApply.deal_type = dealsFilters.dealType;
    }
    if (dealsFilters.industry) {
      filtersToApply.industry = dealsFilters.industry;
    }
    return filtersToApply;
  }, [dealsSearch, dealsFilters]);

  const queryClient = useQueryClient();
  const dealsListFiltersKey = useMemo(
    () => JSON.stringify(currentFilters),
    [currentFilters],
  );

  const dealsListQuery = useQuery({
    queryKey: crmAppKeys.dealsPage.list({
      filtersKey: dealsListFiltersKey,
      activeTab: activeFilter,
      page: dealsPagination.currentPage,
      perPage: dealsPagination.rowsPerPage,
      sortBy: dealsPagination.sortBy,
      sortOrder: dealsPagination.sortOrder,
      approvalsVariant: isApprovalsList,
    }),
    queryFn: async () => {
      const params = buildDealsParams(
        currentFilters,
        dealsPagination.currentPage,
        dealsPagination.rowsPerPage,
        true,
      );
      return getDeals(params);
    },
    placeholderData: (previousData) => previousData,
  });

  const dealsListLoading =
    dealsListQuery.isPending || dealsListQuery.isFetching;

  const refreshDealsListAndTabTotals = useCallback(() => {
    queryClient
      .invalidateQueries({ queryKey: crmAppKeys.dealsPage.all() })
      .catch(() => undefined);
    setRefreshKey((prev) => prev + 1);
  }, [queryClient, setRefreshKey]);

  useEffect(() => {
    if (dealsListQuery.isError) {
      setDealsData([]);
      setTotalDeals(0);
      setSummaryTiles(null);
      setDealsMetrics(null);
      return;
    }
    if (!dealsListQuery.data || dealsListQuery.isPlaceholderData) return;
    const response: any = dealsListQuery.data;
    const dealsArray: any[] = response?.dataList || [];
    const pagination: any = response?.meta || {};
    const summary: any = response?.summary_tiles || null;
    const metricsFromApi: any = response?.metrics || null;

    setDealsData(Array.isArray(dealsArray) ? dealsArray : []);
    setTotalDeals(pagination?.total || 0);
    setSummaryTiles(summary);
    setDealsMetrics(metricsFromApi);

    if (pagination && pagination.total !== undefined) {
      setServerPaginationMeta({
        total: pagination.total || 0,
        current_page: pagination.current_page || 1,
        per_page: pagination.per_page || 5,
        last_page: pagination.last_page || 1,
      });

      setDealsPagination((prev) => ({
        ...prev,
        currentPage: pagination.current_page || prev.currentPage,
        rowsPerPage: pagination.per_page || prev.rowsPerPage,
      }));
    }
  }, [dealsListQuery.data, dealsListQuery.isError, dealsListQuery.isPlaceholderData]);

  const tabTotalsBaseFilters = useMemo(() => {
    const baseFilters = { ...currentFilters };
    delete baseFilters.stage_id;
    delete baseFilters.include_lost;
    delete baseFilters.include_archived;
    if (!isApprovalsList && activeFilter === "rejected") {
      delete baseFilters.approval_status;
    }
    return baseFilters;
  }, [activeFilter, currentFilters, isApprovalsList]);

  const tabTotalsRequestKey = useMemo(
    () =>
      JSON.stringify(
        isApprovalsList
          ? {
              refreshKey,
              filters: tabTotalsBaseFilters,
              stageIds: stages.map((stage: any) => stage.id),
            }
          : {
              filters: tabTotalsBaseFilters,
              stageIds: stages.map((stage: any) => stage.id),
            },
      ),
    [isApprovalsList, refreshKey, stages, tabTotalsBaseFilters],
  );
  const lastTabTotalsRequestKeyRef = useRef<string>("");

  const fetchTabTotals = useCallback(
    async (baseFilters: Record<string, any>) => {
      try {
        if (isApprovalsList) {
          const [allResp, lostResp, deletedResp, ...stageResponses] =
            await Promise.all([
              getDeals(buildDealsParams(baseFilters, 1, 1, false)),
              getDeals(
                buildDealsParams(
                  { ...baseFilters, include_lost: true },
                  1,
                  1,
                  false,
                ),
              ),
              getDeals(
                buildDealsParams(
                  { ...baseFilters, include_archived: true },
                  1,
                  1,
                  false,
                ),
              ),
              ...stages.map((stage: { id: number | string }) =>
                getDeals(
                  buildDealsParams(
                    { ...baseFilters, stage_id: String(stage.id) },
                    1,
                    1,
                    false,
                  ),
                ),
              ),
            ]);

          const nextTotals: Record<string, number> = {
            all: allResp?.meta?.total ?? 0,
            lost: lostResp?.meta?.total ?? 0,
            deleted: deletedResp?.meta?.total ?? 0,
            rejected: 0,
          };

          stages.forEach((stage: { id: number | string }, index: number) => {
            nextTotals[stage.id] = stageResponses[index]?.meta?.total ?? 0;
          });

          setTabTotals(nextTotals);
          return;
        }

        const [
          allResp,
          lostResp,
          deletedResp,
          rejectedResp,
          ...stageResponses
        ] = await Promise.all([
          getDeals(buildDealsParams(baseFilters, 1, 1, false)),
          getDeals(
            buildDealsParams(
              { ...baseFilters, include_lost: true },
              1,
              1,
              false,
            ),
          ),
          getDeals(
            buildDealsParams(
              { ...baseFilters, include_archived: true },
              1,
              1,
              false,
            ),
          ),
          getDeals(
            buildDealsParams(
              { ...baseFilters, approval_status: "rejected" },
              1,
              1,
              false,
            ),
          ),
          ...stages.map((stage: any) =>
            getDeals(
              buildDealsParams(
                { ...baseFilters, stage_id: stage.id },
                1,
                1,
                false,
              ),
            ),
          ),
        ]);

        const nextTotals: Record<string, number> = {
          all: allResp?.meta?.total ?? 0,
          lost: lostResp?.meta?.total ?? 0,
          deleted: deletedResp?.meta?.total ?? 0,
          rejected: rejectedResp?.meta?.total ?? 0,
        };

        stages.forEach((stage: any, index) => {
          nextTotals[stage.id] = stageResponses[index]?.meta?.total ?? 0;
        });

        setTabTotals(nextTotals);
      } catch (error) {
        console.error("Failed to fetch tab totals:", error);
      }
    },
    [buildDealsParams, isApprovalsList, stages],
  );

  useDealsListActiveFilterSync({
    activeFilter,
    isApprovalsList,
    stages,
    setCurrentFilters,
    setDealsFilters,
  });

  // Read tab from URL on mount and when router is ready
  useEffect(() => {
    if (router.isReady && router.query.tab) {
      const tabFromUrl = String(router.query.tab);
      const isValidFilter =
        tabFromUrl === "all" ||
        tabFromUrl === "lost" ||
        tabFromUrl === "deleted" ||
        (!isApprovalsList && tabFromUrl === "rejected") ||
        (stages.length > 0 &&
          stages.some((s: any) => s.id.toString() === tabFromUrl));
      if (isValidFilter) {
        setActiveFilter((prev) => (prev === tabFromUrl ? prev : tabFromUrl));
      }
    }
  }, [router.isReady, router.query.tab, stages, isApprovalsList]);

  // Handler to update filter and URL
  const handleFilterChange = useCallback(
    (filterId: string) => {
      setActiveFilter(filterId);
      setDealsPagination((prev) => ({ ...prev, currentPage: 1 }));

      // Update URL with tab query parameter
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, tab: filterId },
        },
        undefined,
        { shallow: true },
      );
    },
    [router],
  );

  useEffect(() => {
    if (lastTabTotalsRequestKeyRef.current === tabTotalsRequestKey) {
      return;
    }
    lastTabTotalsRequestKeyRef.current = tabTotalsRequestKey;
    fetchTabTotals(tabTotalsBaseFilters).catch((err) => {
      console.error("Failed to fetch deal tab totals:", err);
    });
  }, [fetchTabTotals, tabTotalsBaseFilters, tabTotalsRequestKey]);

  // Handle open filters sidebar
  const handleOpenFiltersSidebar = useCallback(() => {
    setShowFiltersSidebar(true);
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (filters: Record<string, any>) => {
      setCurrentFilters((prev) =>
        isApprovalsList
          ? applyCrmFilterRules(prev, filters, APPROVAL_FILTER_RULES)
          : mergeDealsSidebarFiltersIntoCurrent(prev, filters),
      );
    },
    [isApprovalsList],
  );

  // Handle view deal - open GenericSidebar only (no modal)
  const handleViewDeal = useCallback(async (dealId: number) => {
    try {
      setLoadingDeal(true);
      setLoadingLead(true);
      setRelatedLead(null);
      const { deal: dealData, relatedLead: leadData } =
        await loadCrmDealWithOptionalLead(dealId);
      setViewingDeal(dealData);
      setSelectedDeal(dealData);
      setShowDealSidebar(true);
      setRelatedLead(leadData);
    } catch (error) {
      console.error("Failed to fetch deal:", error);
      toast.error("Failed to load deal details");
    } finally {
      setLoadingDeal(false);
      setLoadingLead(false);
    }
  }, []);

  const handleRowClicked = useCallback(async (dealId: number) => {
    try {
      const dealData: any = await getDeal(dealId);
      setSelectedDeal(dealData);
      setShowDealSidebar(true);

      await fetchDealFollowUps(dealId);
      await fetchDealMeetings(dealId);
    } catch (error) {
      console.error("Failed to fetch deal:", error);
      toast.error("Failed to load deal details");
    }
  }, [fetchDealFollowUps, fetchDealMeetings]);

  const handlePreviewClickBase = useCallback(
    async (deal: any) => {
      const dealId = deal.rawData?.id || deal.id;
      // Set the deal immediately to show sidebar
      setSelectedDeal(deal.rawData || deal);
      setShowDealSidebar(true);

      // Fetch additional data (follow-ups, meetings) in the background
      if (dealId) {
        try {
          await fetchDealFollowUps(dealId);
          await fetchDealMeetings(dealId);
          // Optionally refresh the deal data to get latest info
          const dealData: any = await getDeal(dealId);
          setSelectedDeal(dealData);
        } catch (error) {
          console.error("Failed to fetch deal details:", error);
          // Don't show error toast as sidebar is already open with basic data
        }
      }
    },
    [fetchDealFollowUps, fetchDealMeetings],
  );

  const openDealPreviewById = useCallback(
    (id: number) => {
      handlePreviewClickBase({ id, rawData: { id } }).catch((error: unknown) => {
        console.error("openDealPreviewById:", error);
      });
    },
    [handlePreviewClickBase],
  );

  const { writePreviewIdToStorage, clearPreviewIdFromStorage } =
    useCrmListPreviewPersistence({
      localStorageKey: isApprovalsList
        ? "crm-approvals-list-preview-record-id"
        : "crm-deals-list-preview-record-id",
      listLoading: !isInitialized || dealsListLoading,
      openPreviewByNumericId: openDealPreviewById,
      enableRestore: false,
    });

  const handlePreviewClick = useCallback(
    async (deal: any) => {
      const dealId = deal.rawData?.id || deal.id;
      if (dealId) writePreviewIdToStorage(Number(dealId));
      await handlePreviewClickBase(deal);
    },
    [handlePreviewClickBase, writePreviewIdToStorage],
  );

  // Handle first column click - navigates to detail page
  const handleFirstColumnClick = useCallback(
    (deal: any) => {
      const id = deal?.id ?? deal?.rawData?.id;
      router.push(buildCrmDealDetailPagePath(id, isApprovalsList));
    },
    [router, isApprovalsList],
  );

  const handleCallClick = useCallback(
    async (deal: any) => {
      const phone = deal?.decision_maker_phone || deal?.crm_data?.phone;
      if (!phone) {
        toast.error("No phone number available for this deal");
        return;
      }
      if (!isInitialized) {
        toast.error("CTI not initialized. Please wait...");
        return;
      }
        try {
        const result = await dialNumber(phone);
        if (result.success) {
          toast.success(`Calling ${deal?.name || phone}...`);
        } else {
          toast.error(result.error || "Failed to make call");
        }
      } catch (error) {
        console.error("Call error:", error);
        toast.error("Failed to make call");
      }
    },
    [dialNumber, isInitialized],
  );

  const handleNoteCreate = useCallback(
    (note: string, createTask: boolean, taskDueDate?: string) => {
      console.log("Note created:", {
        dealId: selectedDeal?.id || selectedDeal?.rawData?.id,
        note,
        createTask,
        taskDueDate,
      });
      // Implement note creation logic here
      toast.success("Note created successfully");
    },
    [selectedDeal],
  );

  const handleCloseDealSidebar = useCallback(() => {
    setShowDealSidebar(false);
    setSelectedDeal(null);
    clearPreviewIdFromStorage();
  }, [clearPreviewIdFromStorage]);

  const handleHideDealSidebarKeepPersistence = useCallback(() => {
    setShowDealSidebar(false);
    setSelectedDeal(null);
  }, []);

  const handleDeleteDeal = useCallback((dealId: number, dealName?: string) => {
    setDealToDelete({ id: dealId, name: dealName });
    setShowDeleteModal(true);
  }, []);

  // Handle meeting creation
  const handleCreateMeeting = useCallback(async () => {
    if (
      !meetingData.dealId ||
      !meetingData.meetingName ||
      !meetingData.meetingDate ||
      !meetingData.meetingTime
    )
      return;

    setLoadingMeeting(true);
    try {
      const utcMeeting = convertLocalMeetingToUtc(
        String(meetingData.meetingDate || "").slice(0, 10),
        String(meetingData.meetingTime || "").slice(0, 5),
      );
      const payload: any = {
        name: meetingData.meetingName,
        meeting_type: meetingData.meetingType,
        meeting_date: utcMeeting.utcDate || meetingData.meetingDate,
        meeting_time: utcMeeting.utcTime || meetingData.meetingTime,
        ...(utcMeeting.utcIso && { start_date_time: utcMeeting.utcIso }),
        deal_id: String(meetingData.dealId),
        meeting_outcome: "Scheduled", // Default to "Scheduled" when creating
        extensions:
          meetingAttendees.length > 0
            ? meetingAttendees.map((user: any) => user.value)
            : [(session?.user as any)?.extension || "admin"],
      };

      await createMeeting(payload);

      // Refresh deal data
      // if (viewingDeal?.id === meetingData.dealId) {
      // await handleRowClicked(meetingData.dealId);
      await fetchDealMeetings(meetingData.dealId);
      // }

      // Reset form and close modal
      setShowAddMeetingModal(false);
      setMeetingIdToEdit(null);
      setMeetingData({ ...DEALS_EMPTY_MEETING_FORM });
      setMeetingAttendees([]);
    } catch (error) {
      console.error("Failed to create meeting:", error);
    } finally {
      setLoadingMeeting(false);
    }
  }, [meetingData, meetingAttendees, session, viewingDeal, handleViewDeal]);

  // Handle meeting update
  const handleUpdateMeeting = useCallback(async () => {
    if (
      !meetingIdToEdit ||
      !meetingData.meetingName ||
      !meetingData.meetingDate ||
      !meetingData.meetingTime
    )
      return;

    setLoadingMeeting(true);
    try {
      const utcMeeting = convertLocalMeetingToUtc(
        String(meetingData.meetingDate || "").slice(0, 10),
        String(meetingData.meetingTime || "").slice(0, 5),
      );
      const payload: any = {
        name: meetingData.meetingName,
        meeting_type: meetingData.meetingType,
        meeting_date: utcMeeting.utcDate || meetingData.meetingDate,
        meeting_time: utcMeeting.utcTime || meetingData.meetingTime,
        ...(utcMeeting.utcIso && { start_date_time: utcMeeting.utcIso }),
        extensions:
          meetingAttendees.length > 0
            ? meetingAttendees.map((user: any) => user.value)
            : [],
      };

      if (meetingData.meetingOutcome) {
        payload.meeting_outcome = meetingData.meetingOutcome;
      }

      await updateMeeting(meetingIdToEdit, payload);

      // Refresh deal data
      if (viewingDeal?.id === meetingData.dealId && meetingData.dealId) {
        // await handleRowClicked(meetingData.dealId);
        await fetchDealMeetings(meetingData.dealId);
      }

      // Reset form and close modal
      setShowAddMeetingModal(false);
      setMeetingIdToEdit(null);
      setMeetingData({ ...DEALS_EMPTY_MEETING_FORM });
      setMeetingAttendees([]);
    } catch (error) {
      console.error("Failed to update meeting:", error);
    } finally {
      setLoadingMeeting(false);
    }
  }, [
    meetingIdToEdit,
    meetingData,
    meetingAttendees,
    viewingDeal,
    handleViewDeal,
  ]);

  // Handle edit meeting click
  const handleEditMeeting = useCallback(
    (meeting: any) => {
      const utcDateRaw = meeting.meeting_date
        ? new Date(meeting.meeting_date).toISOString().split("T")[0]
        : "";
      const utcTimeRaw = meeting.meeting_time || "";
      const localized = convertUtcMeetingToLocal(
        utcDateRaw,
        String(utcTimeRaw || "").slice(0, 5),
      );
      const meetingDate = localized.localDate || utcDateRaw;
      const meetingTime = localized.localTime || utcTimeRaw;

      // Set attendees from meeting extensions
      // meeting.extensions is an array of objects with 'extension' property (e.g., { extension: "511", ... })
      const meetingExtensionStrings =
        meeting.extensions && Array.isArray(meeting.extensions)
          ? meeting.extensions.map(
              (extObj: any) => extObj.extension || String(extObj.id),
            )
          : [];

      const attendees =
        meetingExtensionStrings.length > 0
          ? extensions
              .filter((ext: any) => {
                // Match by extension string or ID (convert to string for comparison)
                const extExtension = String(ext.extension || "");
                const extId = String(ext.id || "");
                return meetingExtensionStrings.some(
                  (meetingExt: string) =>
                    meetingExt === extExtension || meetingExt === extId,
                );
              })
              .map((ext: any) => ({
                value: ext.id || ext.extension,
                label: ext.display_name || ext.name || ext.id || ext.extension,
              }))
          : [];

      setMeetingIdToEdit(meeting.id);
      setMeetingData({
        ...DEALS_EMPTY_MEETING_FORM,
        dealId: viewingDeal?.id || null,
        dealName: viewingDeal?.name || "",
        meetingName: meeting.name || "",
        meetingType: meeting.meeting_type || "Online",
        meetingDate: meetingDate,
        meetingTime: meetingTime,
        meetingOutcome: meeting.meeting_outcome || "",
        extensions: meetingExtensionStrings,
      });
      setMeetingAttendees(attendees);
      setShowAddMeetingModal(true);
    },
    [viewingDeal, extensions],
  );

  const getTodayDate = useCallback((startDateParam: string = "") => {
    let today = new Date();
    if (startDateParam) {
      const startDate = new Date(startDateParam);
      if (moment(startDate).isBefore(today)) {
        today = startDate;
      }
    }
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Handle meeting deletion
  const handleDeleteMeeting = useCallback(
    (meetingId: number, meetingName?: string, dealId?: number) => {
      setMeetingToDelete({ meetingId, meetingName, dealId });
      setShowDeleteMeetingModal(true);
    },
    [],
  );

  const confirmDeleteMeeting = useCallback(async () => {
    if (!meetingToDelete) return;

    try {
      await deleteMeeting(meetingToDelete.meetingId);

      // Refresh deal data (sidebar or view modal)
      const dealIdToRefresh = meetingToDelete.dealId ?? viewingDeal?.id;
      if (dealIdToRefresh) {
        //await handleRowClicked(dealIdToRefresh);
        await fetchDealMeetings(dealIdToRefresh);
      }

      setShowDeleteMeetingModal(false);
      setMeetingToDelete(null);
      toast.success("Meeting deleted successfully!");
    } catch (error) {
      console.error("Failed to delete meeting:", error);
      toast.error("Failed to delete meeting");
    }
  }, [meetingToDelete, viewingDeal, handleRowClicked]);

  const handleCreateFollowUp = useCallback(async () => {
    const isValid = checkRequiredFields(followupData, [
      { field: "dealId", name: "Deal" },
      { field: "followUpDate", name: "Follow-up Date" },
      { field: "communicationChannel", name: "Communication Channel" },
    ]);
    if (dealsFollowupChannelOtherIsInvalid(followupData)) {
      toast.error("Please specify the communication channel");
      return;
    }
    if (!isValid) return;

    setLoadingFollowUp(true);
    try {
      const dealId = followupData.dealId!;
      const followUp: any = await createDealFollowUp(dealId, {
        follow_up_date: followupData.followUpDate,
        communication_channel: followupData.communicationChannel,
        communication_channel_other: followupData.communicationChannelOther,
        notes: followupData.notes,
      });
      if (followUp) {
        setShowAddFollowupModal(false);
        setFollowUpIdToEdit(null);
        setFollowupData({ ...DEALS_EMPTY_FOLLOWUP_FORM });
        // handleRowClicked(dealId);
        await fetchDealFollowUps(dealId);
      }
    } catch (error) {
      console.error("Failed to save follow-up:", error);
      toast.error("Failed to save follow-up");
    } finally {
      setLoadingFollowUp(false);
    }
  }, [followupData, viewingDeal, selectedDeal, handleViewDeal]);

  const handleUpdateFollowUp = useCallback(async () => {
    const isValid = checkRequiredFields(followupData, [
      { field: "dealId", name: "Deal" },
      { field: "followUpDate", name: "Follow-up Date" },
      { field: "communicationChannel", name: "Communication Channel" },
    ]);
    if (dealsFollowupChannelOtherIsInvalid(followupData)) {
      toast.error("Please specify the communication channel");
      return;
    }
    if (!followUpIdToEdit || !isValid) return;

    setLoadingFollowUp(true);
    try {
      const dealId = followupData.dealId!;
      const followUp: any = await updateDealFollowUp(dealId, followUpIdToEdit, {
        follow_up_date: followupData.followUpDate,
        communication_channel: followupData.communicationChannel,
        communication_channel_other: followupData.communicationChannelOther,
        notes: followupData.notes,
      });
      if (followUp) {
        setShowAddFollowupModal(false);
        setFollowUpIdToEdit(null);
        setFollowupData({ ...DEALS_EMPTY_FOLLOWUP_FORM });
        //handleRowClicked(dealId);
        await fetchDealFollowUps(dealId);
      }
    } catch (error) {
      console.error("Failed to update follow-up:", error);
      toast.error("Failed to update follow-up");
    } finally {
      setLoadingFollowUp(false);
    }
  }, [
    followUpIdToEdit,
    followupData,
    viewingDeal,
    selectedDeal,
    handleViewDeal,
  ]);

  const handleDeleteFollowUp = useCallback(
    async (dealId: number, followUpId: number) => {
      try {
        await deleteDealFollowUp(dealId, followUpId);
        handleRowClicked(dealId);
      } catch (error) {
        console.error("Failed to delete follow-up:", error);
      }
    },
    [],
  );

  const confirmDeleteFollowUp = useCallback(async () => {
    if (!followUpToDelete) return;
    try {
      await handleDeleteFollowUp(
        followUpToDelete.dealId,
        followUpToDelete.followUpId,
      );
      await fetchDealFollowUps(followUpToDelete.dealId);
      setShowDeleteFollowUpModal(false);
      setFollowUpToDelete(null);
    } catch (error) {
      console.error("Failed to delete follow-up:", error);
    }
  }, [followUpToDelete, handleDeleteFollowUp]);

  const confirmDeleteDeal = useCallback(async () => {
    if (!dealToDelete) return;

    try {
      await deleteDeal(dealToDelete.id);
      setShowDeleteModal(false);
      setDealToDelete(null);
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Deal Deleted");
      setSuccessModalDescription("Deal has been deleted successfully");
      refreshDealsListAndTabTotals();
    } catch (error) {
      console.error("Failed to delete deal:", error);
    }
  }, [dealToDelete, refreshDealsListAndTabTotals]);

  // Restore Deal Handler
  const handleRestoreDeal = useCallback(async (dealId: number) => {
    if (!window.confirm("Are you sure you want to restore this deal?")) return;

    try {
      await restoreDeal(dealId);
      toast.success("Deal restored successfully!");
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Deal Restored");
      setSuccessModalDescription("Deal has been restored successfully");
      refreshDealsListAndTabTotals();
    } catch (error) {
      console.error("Failed to restore deal:", error);
      toast.error("Failed to restore deal");
    }
  }, [refreshDealsListAndTabTotals]);

  // Mark Deal Lost Modal
  const handleMarkLost = useCallback((deal: any) => {
    setDealToMarkLost(deal);
    setShowMarkLostModal(true);
  }, []);

  const handleMarkLostSubmit = useCallback(async () => {
    if (!dealToMarkLost || !lostReasonId || !lostFeedback.trim()) return;

    try {
      await markDealLost(dealToMarkLost.id, {
        lost_reason_id: lostReasonId,
        lost_feedback: lostFeedback,
      });
      setShowMarkLostModal(false);
      setDealToMarkLost(null);
      setLostReasonId(null);
      setLostFeedback("");
      toast.success("Deal marked as lost!");
      setShowSuccessfulModal(true);
      setSuccessModalTitle("Deal Marked as Lost");
      setSuccessModalDescription("Deal has been marked as lost successfully");
      refreshDealsListAndTabTotals();
    } catch (error) {
      console.error("Failed to mark deal as lost:", error);
    }
  }, [dealToMarkLost, lostReasonId, lostFeedback, refreshDealsListAndTabTotals]);

  const handleDownloadDeal = useCallback(async (dealId: number) => {
    try {
      await PDFDownloadDeal(dealId);
    } catch (error) {
      console.error("Failed to download deal:", error);
      toast.error("Failed to download deal");
    }
  }, []);

  const runDealApprovalDecision = useCallback(
    async (deal: any, decision: "approve" | "reject") => {
      const dealId = deal?.id ?? deal?.rawData?.id;
      if (!dealId) return;
      try {
        if (decision === "approve") {
          await approveDeal(dealId);
          toast.success("Deal approved successfully!");
        } else {
          await rejectDeal(dealId);
          toast.success("Deal rejected successfully!");
        }
        refreshDealsListAndTabTotals();
      } catch (error) {
        console.error(`Failed to ${decision} deal:`, error);
        toast.error(
          decision === "approve"
            ? "Failed to approve deal"
            : "Failed to reject deal",
        );
      }
    },
    [refreshDealsListAndTabTotals],
  );

  const handleApproveDeal = useCallback(
    (deal: any) => {
      runDealApprovalDecision(deal, "approve").catch((err) => {
        console.error("Approve deal failed:", err);
      });
    },
    [runDealApprovalDecision],
  );

  const handleRejectDeal = useCallback(
    (deal: any) => {
      runDealApprovalDecision(deal, "reject").catch((err) => {
        console.error("Reject deal failed:", err);
      });
    },
    [runDealApprovalDecision],
  );

  // Edit Deal Handler - Opens sidebar for editing
  const handleEditDeal = useCallback(
    (dealId: number) => {
      setEditingDealIdInSidebar(dealId);
      if (isApprovalsList) {
        setShowEditDealSidebar(true);
      } else {
        setShowCreateDealSidebar(true);
      }
    },
    [isApprovalsList],
  );

  const transformDealData = (deal: any) =>
    transformDealForGenericTableRow(deal, extensions, {
      includeTicketId: !isApprovalsList,
    });

  const analyticsData = useMemo(() => {
    const transformedDeals = dealsData.map(transformDealData);
    return computeDealsListAnalytics(transformedDeals, summaryTiles, totalDeals);
  }, [dealsData, extensions, summaryTiles, totalDeals, isApprovalsList]);

  const filteredDeals = useMemo(() => {
    return dealsData.map(transformDealData);
  }, [dealsData, extensions, isApprovalsList]);

  const filterCounts = useMemo(() => {
    const transformed = dealsData.map(transformDealData);
    return computeDealsListTabFilterCounts(
      transformed,
      tabTotals,
      summaryTiles,
      totalDeals,
      stages,
      { includeRejectedCount: !isApprovalsList },
    );
  }, [
    dealsData,
    extensions,
    isApprovalsList,
    stages,
    summaryTiles,
    tabTotals,
    totalDeals,
  ]);

  // Update custom tabs counts when filterCounts change
  useEffect(() => {
    setCustomTabs((prevTabs) =>
      prevTabs.map((tab) => {
        const count = filterCounts[tab.id] || 0;
        return { ...tab, count };
      }),
    );
  }, [filterCounts]);

  const clearDealsWidgetFiltersPatch = useMemo(
    () => ({
      follow_up_date_from: undefined,
      follow_up_date_to: undefined,
      meeting_date_from: undefined,
      meeting_date_to: undefined,
      expected_close_date_from: undefined,
      expected_close_date_to: undefined,
      is_won: undefined,
      overdue: undefined,
      high_value: undefined,
      at_risk: undefined,
      reviewed_last_24h: undefined,
      approval_status: undefined,
    }),
    [],
  );

  const applyDealsWidgetFiltersPatch = useCallback(
    (patch: Record<string, any>) => {
      if (activeFilter !== "all") {
        handleFilterChange("all");
      }
      handleFiltersChange(patch);
      setDealsPagination((prev) => ({ ...prev, currentPage: 1 }));
    },
    [activeFilter, handleFilterChange, handleFiltersChange],
  );

  const dealsStatsCards: StatsCardData[] = useMemo(() => {
    const base = buildDealsListStatsCards(dealsMetrics, isApprovalsList);
    const today = moment().format("YYYY-MM-DD");

    // Maps each card title to the partial filter patch the widget should
    // apply. Empty object means "clear all filters" only.
    const approvalsCardPatches: Record<string, Record<string, unknown>> = {
      "All deals submitted": {},
      "Pending Approval": { approval_status: "pending" },
      "Approved Deals": { approval_status: "approved" },
      "Rejected Deals": { approval_status: "rejected" },
      "High-Value (Pending)": {
        approval_status: "pending",
        high_value: true,
      },
      "Recently Reviewed": { reviewed_last_24h: true },
    };

    const dealsCardPatches: Record<string, Record<string, unknown>> = {
      "All Deals": {},
      "High-Value Deals": { high_value: true },
      "At-Risk Deals": { at_risk: true },
      "Deals Won": { is_won: true },
      "Today's Follow-ups": {
        follow_up_date_from: today,
        follow_up_date_to: today,
      },
      Overdue: { overdue: true },
    };

    const cardPatches = isApprovalsList
      ? approvalsCardPatches
      : dealsCardPatches;

    return base.map((card) => {
      const patch = cardPatches[card.title];
      if (patch === undefined) return card;
      return {
        ...card,
        onClick: () =>
          applyDealsWidgetFiltersPatch({
            ...clearDealsWidgetFiltersPatch,
            ...patch,
          }),
      };
    });
  }, [
    dealsMetrics,
    isApprovalsList,
    activeFilter,
    applyDealsWidgetFiltersPatch,
    clearDealsWidgetFiltersPatch,
  ]);

  const dealsColumns: TableColumn<any>[] = useMemo(
    () => buildDealsListTableColumns(isApprovalsList),
    [isApprovalsList],
  );

  const dealsActions: TableAction<any>[] = useMemo(
    () =>
      buildDealsListTableActions({
        activeFilter,
        session,
        isApprovalsList,
        handlePreviewClick,
        handleEditDeal,
        handleRestoreDeal,
        handleDeleteDeal,
        handleMarkLost,
        handleApproveDeal,
        handleRejectDeal,
        handleDownloadDeal,
        setSelectedDealForAttachments,
        setShowAttachmentModal,
        setDealToConvert,
        setShowConvertToOrderModal,
      }),
    [
      session,
      activeFilter,
      handlePreviewClick,
      handleEditDeal,
      handleRestoreDeal,
      handleDeleteDeal,
      handleMarkLost,
      handleApproveDeal,
      handleRejectDeal,
      handleDownloadDeal,
      isApprovalsList,
    ],
  );

  const getDealCardContextMenuItems = useCallback(
    (card: KanbanCardData) => {
      if (!card.raw) return [];
      const row = transformDealData(card.raw);
      return buildBoundTableContextMenuItems(dealsActions, row);
    },
    [dealsActions, extensions, isApprovalsList],
  );

  const dealsToolbarConfig = useCrmToolbarConfig({
    entity: isApprovalsList ? "approvals" : "deals",
    searchValue: dealsSearch,
    searchPlaceholder: isApprovalsList
      ? "Search approvals by name, company, value..."
      : "Search deals by name, company, value...",
    onSearchChange: setDealsSearch,
    onSearch: () => {},
    currentFilters,
    handleFiltersChange,
    refresh: () => refreshDealsListAndTabTotals(),
    activeTab: activeFilter,
    onTabChange: handleFilterChange,
    tabs: [
      {
        id: "all",
        label: isApprovalsList ? "All approvals" : "All deals",
        count: filterCounts.all,
        removable: false,
      },
      ...customTabs,
    ],
    onTabAdd: () => setShowTabModal(true),
    onTabRemove: (tabId) => {
      setCustomTabs((tabs) => tabs.filter((t) => t.id !== tabId));
      if (activeFilter === tabId) handleFilterChange("all");
    },
    tabsDropdownLabel: isApprovalsList ? "Approvals" : "Deals",
    onFiltersClick: handleOpenFiltersSidebar,
    onExportClick: () => setShowExportModal(true),
    onEditColumnsClick: () => setShowColumnEditor(true),
    showImport: false,
    currentTableView: dealsViewMode,
    onTableViewChange: setDealsViewMode,
    extensions,
    onPaginationReset: () =>
      setDealsPagination((prev) => ({ ...prev, currentPage: 1 })),
  });

  if (!canAccessDealsScreen) {
    return null;
  }

  return (
    <React.Fragment>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .deals-table-wrapper {
          width: 100%;
          overflow: hidden;
        }
        .deals-table-wrapper .table-responsive {
          width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
        }
        .deals-table-wrapper .table-responsive table {
          width: 100%;
          table-layout: auto;
          margin-bottom: 0;
        }
        .deals-table-wrapper .table-responsive table th,
        .deals-table-wrapper .table-responsive table td {
          padding: 12px 16px;
          vertical-align: middle;
        }
        
        /* Page layout for full height */
        .deals-page-container {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 100px);
          overflow: hidden;
        }
        
        .deals-content-area {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .deals-scrollable-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }
      `,
        }}
      />
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle={isApprovalsList ? "Deals Approval" : "Deals"}
      />

      {/* Main flex container for content and sidebar */}
      <div
        style={{
          display: "flex",
          gap: "0",
          height: "calc(100vh - 74px)",
          overflow: "hidden",
        }}
      >
        {/* Main content area */}
        <div
          className="deals-scrollable-content"
          style={{ flex: 1, height: "100%", overflowY: "hidden" }}
        >
          <div
            className="container-fluid"
            style={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            {/* Analytics Section - Collapsible */}
            {showDealsAnalytics && (
              <>
                {/* Summary Stats using KPICard */}
                <Row className="mb-4">
                  <Col lg={3} md={6} className="mb-3">
                    <CrmKPICard
                      title="Total Deals"
                      value={analyticsData.total.toString()}
                      icon={<Handshake size={24} />}
                      color="primary"
                    />
                  </Col>
                  <Col lg={3} md={6} className="mb-3">
                    <CrmKPICard
                      title="Won Deals"
                      value={analyticsData.won.toString()}
                      icon={<CheckCircle size={24} />}
                      color="success"
                    />
                  </Col>
                  <Col lg={3} md={6} className="mb-3">
                    <CrmKPICard
                      title="In Negotiation"
                      value={analyticsData.inNegotiation.toString()}
                      icon={<Activity size={24} />}
                      color="warning"
                    />
                  </Col>
                  <Col lg={3} md={6} className="mb-3">
                    <CrmKPICard
                      title="Total Value"
                      value={`${analyticsData.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                      icon={<DollarSign size={24} />}
                      color="success"
                    />
                  </Col>
                </Row>

                {/* Analytics Charts */}
                <Row className="mb-4">
                  <Col md={6} className="mb-3">
                    <Card className="border-0 shadow-sm h-100">
                      <Card.Body>
                        <h6 className="fw-bold mb-3">Deals by Stage</h6>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={Object.entries(
                                analyticsData.stageCounts,
                              ).map(([stage, count]) => ({
                                name: stage,
                                value: count,
                              }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }: any) =>
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {Object.entries(analyticsData.stageCounts).map(
                                ([stage, count], index) => {
                                  const colors = [
                                    "#0dcaf0",
                                    "#0d6efd",
                                    "#ffc107",
                                    "#fd7e14",
                                    "#198754",
                                    "#6c757d",
                                  ];
                                  return (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={colors[index % colors.length]}
                                    />
                                  );
                                },
                              )}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Card className="border-0 shadow-sm h-100">
                      <Card.Body>
                        <h6 className="fw-bold mb-3">Deal Type Distribution</h6>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart
                            data={Object.entries(
                              analyticsData.dealTypeCounts,
                            ).map(([type, count]) => ({ type, count }))}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="type" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#0d6efd" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </>
            )}

            {/* Deals Table with GenericTable */}
            <div
              className="deals-table-wrapper"
              style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <GenericTable
                data={filteredDeals}
                columns={dealsColumns.filter((c) =>
                  selectedDealsColumns.includes(c.key),
                )}
                actions={dealsActions}
                showActions={false}
                // customizableColumns={true}
                defaultSelectedColumns={[
                  "name",
                  "company",
                  "stage",
                  "status",
                  "approvalStatus",
                  "dealType",
                  "value",
                  "assignedUser",
                  "closeDate",
                  "owner",
                ]}
                columnStorageKey="dealsSelectedColumns"
                onColumnChange={(cols) => setSelectedDealsColumns(cols)}
                onPreviewClick={(deal) => handlePreviewClick(deal)}
                onFirstColumnClick={(deal) => handleFirstColumnClick(deal)}
                pagination={{
                  currentPage: dealsPagination.currentPage,
                  rowsPerPage: dealsPagination.rowsPerPage,
                  totalRows: totalDeals,
                  pageSizeOptions: [10, 15, 25, 50, 100],
                }}
                onPaginationChange={(page, rowsPerPage) => {
                  setDealsPagination({
                    ...dealsPagination,
                    currentPage: page,
                    rowsPerPage,
                  });
                }}
                sortable={true}
                defaultSortBy={dealsPagination.sortBy}
                defaultSortOrder={dealsPagination.sortOrder}
                onSort={(column, direction) => {
                  setDealsPagination({
                    ...dealsPagination,
                    sortBy: column,
                    sortOrder: direction,
                  });
                }}
                onRowDoubleClick={(row) => {
                  if (canAccessDealsScreen) {
                    handleViewDeal(row.rawData?.id || row.id);
                  }
                }}
                loading={dealsListLoading}
                emptyMessage="No deals found matching your criteria"
                loadingMessage="Loading deals..."
                hover={true}
                uniqueKey="id"
                // Fixed height mode
                fixedHeight={true}
                maxHeight="calc(100vh - 380px)"
                // Toolbar
                showToolbar={true}
                toolbar={dealsToolbarConfig}
                // Stats cards for metrics
                statsCards={dealsStatsCards}
                metricsGridMinWidth="120px"
                metricsColumns={6}
                metricsEmbedded={false}
                defaultShowMetrics={true}
                customBody={
                  dealsViewMode === "board" ? (
                    <KanbanBoard
                      columns={buildDealsKanbanColumns(
                        dealsData,
                        stages,
                        DEALS_LIST_KANBAN_AVATAR,
                      )}
                      onCardClick={(card) => handleViewDeal(Number(card.id))}
                      cardContextMenuItems={getDealCardContextMenuItems}
                      onCardMove={(cardId, fromCol, toCol) => {
                        const deal = dealsData.find((d) => d.id === Number(cardId) || d.id === cardId);
                        if (deal) {
                          updateDeal(Number(deal.id), {
                            stage_id: toCol,
                          }).then(() => {
                            refreshDealsListAndTabTotals();
                          }).catch((err) => {
                            console.error("Failed to update deal stage:", err);
                            toast.error("Failed to update deal stage");
                          });
                        }
                      }}
                      searchValue={dealsSearch}
                      boardHeight={boardHeight}
                    />
                  ) : undefined
                }
              />
            </div>
          </div>
        </div>

        {/* Deal Sidebar */}
        {showDealSidebar && (
          <GenericSidebar
            key={`deal-sidebar-${selectedDeal?.id ?? selectedDeal?.rawData?.id ?? "unknown"}-${dealSidebarRefreshKey}`}
            isOpen={showDealSidebar}
            onClose={handleCloseDealSidebar}
            title={selectedDeal?.name || "Deal Details"}
            subtitle={
              selectedDeal?.phone ||
              selectedDeal?.rawData?.phone ||
              relatedLead?.phone ||
              selectedDeal?.company ||
              selectedDeal?.company_name ||
              ""
            }
            email={
              selectedDeal?.main_decision_maker?.email
            }
            phone={
              selectedDeal?.decision_maker_phone_country_code && selectedDeal?.decision_maker_phone ? `${selectedDeal?.decision_maker_phone_country_code} ${selectedDeal?.decision_maker_phone}` : selectedDeal?.decision_maker_phone
            }
            avatar={{
              initials: DEALS_LIST_KANBAN_AVATAR.getInitials(
                selectedDeal?.name || "NA",
              ),
              name: selectedDeal?.name || "NA",
              gradient: DEALS_LIST_KANBAN_AVATAR.getRandomColor(
                selectedDeal?.name || "",
              ),
            }}
            record={{
              id: selectedDeal?.id || selectedDeal?.rawData?.id,
              type: RECORD_TYPES.DEAL,
            }}
            recordType="deal"
            recordId={
              selectedDeal?.id ?? selectedDeal?.rawData?.id ?? undefined
            }
            senderName={session?.user?.name || ""}
            senderEmail={session?.user?.email || ""}
            resolveUserLabel={getNameByExtension}
            onNoteCreate={handleNoteCreate}
            onLogCall={sidebarLogActivityModals.openLogCall}
            onLogEmail={sidebarLogActivityModals.openLogEmail}
            onLogSms={sidebarLogActivityModals.openLogSms}
            onLogWhatsApp={sidebarLogActivityModals.openLogWhatsApp}
            onLogMeeting={sidebarLogActivityModals.openLogMeeting}
            crmSummary={selectedDeal?.rawData?.crm_summary ?? selectedDeal?.crm_summary ?? undefined}
            recordLink={{
              label: "View record",
              onClick: () => {
                const dealId = selectedDeal?.id || selectedDeal?.rawData?.id;
                if (dealId) {
                  handleHideDealSidebarKeepPersistence();
                  router.push(
                    `/crm/detailspage?type=deal&id=${dealId}${
                      isApprovalsList ? "&approval=1" : ""
                    }`,
                  );
                }
              },
            }}
            actionsDropdown={{
              label: "Actions",
              items: [
                {
                  label: "Edit Deal",
                  onClick: () => {
                    const dealId =
                      selectedDeal?.id || selectedDeal?.rawData?.id;
                    if (dealId) {
                      setShowDealSidebar(false);
                      handleEditDeal(dealId);
                    }
                  },
                },
                ...((selectedDeal?.approval_status ??
                  selectedDeal?.rawData?.approval_status) === "approved"
                  ? [
                      {
                        label: "Convert to Order",
                        onClick: () => {
                          setShowDealSidebar(false);
                          const dealId =
                            selectedDeal?.id || selectedDeal?.rawData?.id;
                          if (dealId) {
                            setDealToConvert(dealId);
                            setShowConvertToOrderModal(true);
                          }
                        },
                      },
                    ]
                  : []),
                {
                  label: "View History",
                  onClick: () => {
                    setShowDealSidebar(false);
                    const dealId =
                      selectedDeal?.id || selectedDeal?.rawData?.id;
                    if (dealId) {
                      handleViewDeal(dealId);
                      setShowDealHistoryModal(true);
                    }
                  },
                },
                {
                  label: "Delete",
                  onClick: () => {
                    const dealId =
                      selectedDeal?.id || selectedDeal?.rawData?.id;
                    if (dealId) {
                      setShowDealSidebar(false);
                      handleDeleteDeal(dealId, selectedDeal?.name);
                    }
                  },
                },
              ],
            }}
            sections={[
              {
                id: "about-deal",
                title: "About this deal",
                icon: Handshake,
                collapsible: true,
                defaultExpanded: true,
                actions: [
                  {
                    label: "Edit all properties",
                    onClick: () => {
                      const dealId =
                        selectedDeal?.id || selectedDeal?.rawData?.id;
                      if (dealId) {
                        setShowDealSidebar(false);
                        handleEditDeal(dealId);
                      }
                    },
                  },
                ],
                fields: [
                  {
                    label: "Name",
                    value: selectedDeal?.name || "N/A",
                    copyable: true,
                  },
                  {
                    label: "Phone",
                    value:
                      selectedDeal?.phone ||
                      selectedDeal?.rawData?.phone ||
                      relatedLead?.phone ||
                      "N/A",
                    type: "phone",
                    copyable: true,
                    externalLink:
                      selectedDeal?.phone ||
                      selectedDeal?.rawData?.phone ||
                      relatedLead?.phone
                        ? `tel:${selectedDeal?.phone || selectedDeal?.rawData?.phone || relatedLead?.phone}`
                        : undefined,
                    show: !!(
                      selectedDeal?.phone ||
                      selectedDeal?.rawData?.phone ||
                      relatedLead?.phone
                    ),
                  },
                  {
                    label: "Email",
                    value:
                      selectedDeal?.email ||
                      selectedDeal?.rawData?.email ||
                      relatedLead?.email ||
                      "N/A",
                    type: "email",
                    copyable: true,
                    externalLink:
                      selectedDeal?.email ||
                      selectedDeal?.rawData?.email ||
                      relatedLead?.email
                        ? `mailto:${selectedDeal?.email || selectedDeal?.rawData?.email || relatedLead?.email}`
                        : undefined,
                    show: !!(
                      selectedDeal?.email ||
                      selectedDeal?.rawData?.email ||
                      relatedLead?.email
                    ),
                  },
                  {
                    label: "Company",
                    value:
                      selectedDeal?.company_name ||
                      selectedDeal?.company ||
                      "N/A",
                    copyable: true,
                    show: !!(
                      selectedDeal?.company_name || selectedDeal?.company
                    ),
                  },
                  {
                    label: "Ticket ID",
                    value:
                      selectedDeal?.ticketId ||
                      selectedDeal?.ticket_id ||
                      selectedDeal?.rawData?.ticket_id ||
                      "N/A",
                    show: !!(
                      selectedDeal?.ticketId ||
                      selectedDeal?.ticket_id ||
                      selectedDeal?.rawData?.ticket_id
                    ),
                    copyable: true,
                  },
                  {
                    label: "Stage",
                    value:
                      typeof selectedDeal?.stage === "string"
                        ? selectedDeal.stage
                        : selectedDeal?.stage?.name ||
                          selectedDeal?.rawData?.stage?.name ||
                          "N/A",
                    type: "badge",
                    badgeVariant: "primary",
                  },
                  {
                    label: "Deal Value",
                    value: selectedDeal?.value
                      ? `${selectedDeal?.currency || "AED"} ${Number.parseFloat(String(selectedDeal.value)).toLocaleString()}`
                      : "N/A",
                    copyable: true,
                    show: !!selectedDeal?.value,
                  },
                  {
                    label: "Probability",
                    value: selectedDeal?.probability
                      ? `${selectedDeal.probability}%`
                      : "N/A",
                    show: !!selectedDeal?.probability,
                  },
                  {
                    label: "Deal Type",
                    value:
                      selectedDeal?.dealType ||
                      selectedDeal?.deal_type ||
                      "N/A",
                    type: "badge",
                    badgeVariant: "info",
                    show: !!(selectedDeal?.dealType || selectedDeal?.deal_type),
                  },
                  {
                    label: "Owner",
                value: getNameByExtension(
                  (selectedDeal as any)?.assigned_to) || "Unassigned",
                    hasDetails: false,
                    onDetailsClick: () => {},
                  },
                  {
                    label: "Created Date",
                    value:
                      selectedDeal?.created_at || selectedDeal?.created
                        ? formatCrmPreviewDate(
                            selectedDeal.created_at || selectedDeal.created,
                          ) || "N/A"
                        : "N/A",
                    type: "date",
                  },
                  {
                    label: "Last Updated",
                    value:
                      selectedDeal?.updated_at || selectedDeal?.last_activity_at
                        ? formatCrmPreviewDate(
                            selectedDeal.updated_at ||
                              selectedDeal.last_activity_at,
                          ) || "N/A"
                        : "N/A",
                    type: "date",
                  },
                ],
              },
              {
                id: "recent-activities",
                title: "Recent activities",
                icon: History,
                collapsible: true,
                defaultExpanded: true,
                count: Array.isArray(selectedDeal?.audit_trail)
                  ? selectedDeal.audit_trail.length
                  : 0,
                emptyState: {
                  icon: History,
                  message: "No recent activities for this deal.",
                  action: {
                    label: "Log activity",
                    onClick: () => console.log("Log activity"),
                  },
                },
              },
              {
                id: "call-recordings",
                title: "Call Recordings",
                icon: PhoneIcon,
                collapsible: true,
                defaultExpanded: true,
                count: 0,
                emptyState: {
                  icon: PhoneIcon,
                  message: "No call recordings available yet.",
                  action: {
                    label: "Make a call",
                    onClick: () => 
                      selectedDeal?.decision_maker_phone &&
                      handleCallClick(selectedDeal),
                  },
                },
              },
              {
                id: "notes",
                title: "Notes",
                icon: FileText,
                collapsible: true,
                defaultExpanded: true,
                count: 0,
                emptyState: {
                  icon: FileText,
                  message: "No notes added yet.",
                  action: {
                    label: "Add note",
                    onClick: () => console.log("Add note"),
                  },
                },
              },
              {
                id: "follow-ups",
                title: "Follow-ups",
                icon: History,
                collapsible: true,
                defaultExpanded: true,
                badge: {
                  value: dealFollowUps?.length ?? 0,
                  variant: "secondary",
                },
                ...(dealFollowUps?.length
                  ? {
                      customContent: (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                          }}
                        >
                          {(dealFollowUps || []).map((fu: any) => (
                            <div
                              key={fu.id}
                              style={{
                                padding: "12px",
                                backgroundColor: "#f8fafc",
                                borderRadius: "8px",
                                border: "1px solid #e2e8f0",
                                fontSize: "13px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  marginBottom: "6px",
                                }}
                              >
                                <span
                                  style={{ fontWeight: 600, color: "#1e293b" }}
                                >
                                  {fu.follow_up_date
                                    ? moment(fu.follow_up_date).format(
                                        GlobalDateFormat,
                                      )
                                    : "-"}
                                </span>
                                <span
                                  style={{ color: "#64748b", fontSize: "12px" }}
                                >
                                  {fu.communication_channel ||
                                    fu.communication_channel_other ||
                                    "-"}
                                </span>
                              </div>
                              {fu.follow_up_status && (
                                <div
                                  style={{
                                    marginBottom: "4px",
                                    color: "#475569",
                                  }}
                                >
                                  <span style={{ color: "#94a3b8" }}>
                                    Status:{" "}
                                  </span>
                                  {fu.follow_up_status}
                                </div>
                              )}
                              {fu.notes && (
                                <div
                                  style={{ color: "#475569", lineHeight: 1.4 }}
                                >
                                  {fu.notes.length > 120
                                    ? `${fu.notes.slice(0, 120)}...`
                                    : fu.notes}
                                </div>
                              )}
                              <div
                                style={{
                                  marginTop: "8px",
                                  display: "flex",
                                  gap: "8px",
                                  justifyContent: "flex-end",
                                }}
                              >
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0"
                                  title="Edit"
                                  onClick={() => {
                                    const dealId =
                                      selectedDeal?.id ||
                                      selectedDeal?.rawData?.id;
                                    if (dealId) {
                                      setFollowupData({
                                        ...DEALS_EMPTY_FOLLOWUP_FORM,
                                        dealId: Number(dealId),
                                        dealName: selectedDeal?.name || "",
                                        followUpDate: fu.follow_up_date
                                          ? moment(fu.follow_up_date).format(
                                              "YYYY-MM-DD",
                                            )
                                          : "",
                                        followUpStatus:
                                          fu.follow_up_status || "Pending",
                                        communicationChannel:
                                          fu.communication_channel ||
                                          "Phone Call",
                                        communicationChannelOther:
                                          fu.communication_channel_other || "",
                                        notes: fu.notes || "",
                                        userExtension:
                                          (session?.user as any)?.extension ||
                                          "",
                                      });
                                      setFollowUpIdToEdit(fu.id);
                                      setShowAddFollowupModal(true);
                                    }
                                  }}
                                >
                                  <Edit size={14} className="me-1" />
                                </Button>

                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 text-danger"
                                  title="Delete"
                                  onClick={() => {
                                    const dealId =
                                      selectedDeal?.id ||
                                      selectedDeal?.rawData?.id;
                                    if (dealId) {
                                      setFollowUpToDelete({
                                        dealId: Number(dealId),
                                        followUpId: fu.id,
                                        label: fu.follow_up_date
                                          ? moment(fu.follow_up_date).format(
                                              GlobalDateFormat,
                                            )
                                          : "Follow-up",
                                      });
                                      setShowDeleteFollowUpModal(true);
                                    }
                                  }}
                                >
                                  <Trash size={14} className="me-1" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <Button
                            variant="outline-primary"
                            size="sm"
                            style={{
                              alignSelf: "flex-start",
                              marginTop: "4px",
                            }}
                            onClick={() => {
                              const dealId =
                                selectedDeal?.id || selectedDeal?.rawData?.id;
                              if (dealId) {
                                setFollowupData({
                                  ...DEALS_EMPTY_FOLLOWUP_FORM,
                                  dealId: Number(dealId),
                                  dealName: selectedDeal?.name || "",
                                  userExtension:
                                    (session?.user as any)?.extension || "",
                                });
                                setFollowUpIdToEdit(null);
                                setShowAddFollowupModal(true);
                              }
                            }}
                          >
                            <Plus size={14} className="me-1" /> Add Follow Up
                          </Button>
                        </div>
                      ),
                    }
                  : {
                      emptyState: {
                        icon: History,
                        message: "No follow-ups yet",
                        action: {
                          label: "Add Follow Up",
                          onClick: () => {
                            const dealId =
                              selectedDeal?.id || selectedDeal?.rawData?.id;
                            if (dealId) {
                              setFollowupData({
                                ...DEALS_EMPTY_FOLLOWUP_FORM,
                                dealId: Number(dealId),
                                dealName: selectedDeal?.name || "",
                                userExtension:
                                  (session?.user as any)?.extension || "",
                              });
                              setFollowUpIdToEdit(null);
                              setShowAddFollowupModal(true);
                            }
                          },
                        },
                      },
                    }),
              },
            ]}
          />
        )}
        {sidebarLogActivityModals.modals}
      </div>

      {/* Delete Deal Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setDealToDelete(null);
        }}
        onConfirm={confirmDeleteDeal}
        itemName={dealToDelete?.name}
        itemType="deal"
      />

      <SuccessfulModal
        show={showSuccessfulModal}
        onHide={() => setShowSuccessfulModal(false)}
        title={successModalTitle}
        description={successModalDescription}
      />

      {/* Mark Deal Lost Modal */}
      <FormModal
        show={showMarkLostModal}
        onHide={() => setShowMarkLostModal(false)}
        title="Mark deal as lost"
        desc="Please fill in the details below to mark the deal as lost."
        size="lg"
        formHtml={
          <>
            <Form.Group className="mb-3">
              <Form.Label>Lost Reason *</Form.Label>
              <Form.Select
                value={lostReasonId || ""}
                onChange={(e) =>
                  setLostReasonId(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                required
              >
                <option value="">Select a reason</option>
                {lostReasons.map((reason) => (
                  <option key={reason.id} value={reason.id}>
                    {reason.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Additional Feedback *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={lostFeedback}
                onChange={(e) => setLostFeedback(e.target.value)}
                placeholder="Please provide additional feedback about why this deal was lost..."
                required
              />
            </Form.Group>
          </>
        }
        onSubmit={handleMarkLostSubmit}
        onCancel={() => setShowMarkLostModal(false)}
        submitButtonText="Mark Lost Reason"
        cancelButtonText="Cancel"
        isSubmitDisabled={!lostReasonId || !lostFeedback.trim()}
      />

      {/* Deal View Modal */}
      <CrmDealsListScreenDealViewModal
        viewingDeal={viewingDeal}
        showDealViewModal={showDealViewModal}
        setShowDealViewModal={setShowDealViewModal}
        loadingDeal={loadingDeal}
        session={session}
        activeFilter={activeFilter}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        relatedLead={relatedLead}
        extensions={extensions}
        setShowDealHistoryModal={setShowDealHistoryModal}
        setShowAddMeetingModal={setShowAddMeetingModal}
        setMeetingData={setMeetingData}
        setMeetingAttendees={setMeetingAttendees}
      />
      {/* Deal History Modal */}
      <CrmDealsListScreenDealHistoryModal
        viewingDeal={viewingDeal}
        showDealHistoryModal={showDealHistoryModal}
        setShowDealHistoryModal={setShowDealHistoryModal}
        extensions={extensions}
      />

      {/* Manage Attachments Modal */}
      {selectedDealForAttachments && (
        <Modal
          show={showAttachmentModal}
          onHide={() => {
            setShowAttachmentModal(false);
            setSelectedDealForAttachments(null);
          }}
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
                  {selectedDealForAttachments.name}
                </div>
              </div>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-4">
            {/* Upload Section */}
            <div
              className="mb-4 p-4 border rounded"
              style={{ background: "#f8f9fa" }}
            >
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
                    if (files && files.length > 0) {
                      const file = files[0];
                      handleFileUpload(file);
                    }
                  }}
                  accept=".pdf,.csv,.xls,.xlsx,.xlsm,.png,.jpg,.jpeg,.gif,.webp"
                  style={{ flex: 1 }}
                  disabled={uploadingFile}
                />
                {/* <Button 
                  variant="primary" 
                  className="d-flex align-items-center gap-2"
                  disabled={uploadingFile}
                >
                  {uploadingFile ? (
                    <>
                      <div className="spinner-border spinner-border-sm" role="status" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload
                    </>
                  )}
                </Button> */}
              </div>
            </div>

            {/* Attachments List */}
            <div>
              <h6 className="mb-3 fw-bold d-flex align-items-center gap-2">
                <FileText size={18} />
                Attached Files ({attachments.length})
              </h6>

              {(() => {
                if (loadingAttachments) {
                  return (
                    <div className="text-center py-5">
                      <output
                        className="spinner-border text-primary d-inline-block"
                        aria-live="polite"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </output>
                    </div>
                  );
                }
                if (attachments.length === 0) {
                  return (
                    <div className="text-center py-5 text-muted">
                      <Paperclip size={48} className="mb-3 opacity-25" />
                      <div>No attachments yet</div>
                      <small>Upload files using the form above</small>
                    </div>
                  );
                }
                return (
                  <div className="d-flex flex-column gap-2">
                    {attachments.map((attachment: any) => (
                      <Card key={attachment.id} className="border shadow-sm">
                        <Card.Body className="p-3">
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-3 flex-grow-1">
                              {/* File Icon */}
                              <div
                                className="rounded d-flex align-items-center justify-content-center"
                                style={{
                                  width: "45px",
                                  height: "45px",
                                  background: getDealAttachmentIconBackground(
                                    attachment.mime_type,
                                  ),
                                  color: "white",
                                }}
                              >
                                <FileText size={22} />
                              </div>

                              {/* File Info */}
                              <div className="flex-grow-1">
                                <div
                                  className="fw-semibold"
                                  style={{ fontSize: "14px" }}
                                >
                                  {attachment.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "#6c757d",
                                  }}
                                >
                                  {formatFileSize(attachment.file_size)} •{" "}
                                  {attachment.created_at
                                    ? formatDateForTable(attachment.created_at)
                                    : "N/A"}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="d-flex gap-1">
                              {session?.user?.permissions?.includes(
                                PERMISSIONS.DOWNLOAD_DOCUMENT_CRM_DEALS,
                              ) && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-2 text-primary"
                                  title="Download"
                                  onClick={() =>
                                    handleDownloadAttachment(attachment.id)
                                  }
                                >
                                  <DownloadIcon size={18} />
                                </Button>
                              )}
                              <Button
                                variant="link"
                                size="sm"
                                className="p-2 text-danger"
                                title="Delete"
                                onClick={() => {
                                  setAttachmentToDelete({
                                    id: attachment.id,
                                    name: attachment.name,
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
                    ))}
                  </div>
                );
              })()}
            </div>
          </Modal.Body>

          <Modal.Footer className="border-0">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAttachmentModal(false);
                setSelectedDealForAttachments(null);
              }}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Add/Edit Meeting Modal */}
      <Modal
        show={showAddMeetingModal}
        onHide={() => {
          setShowAddMeetingModal(false);
          setMeetingIdToEdit(null);
          setMeetingData({ ...DEALS_EMPTY_MEETING_FORM });
          setMeetingAttendees([]);
        }}
        size="lg"
        centered
      >
        <Modal.Header
          closeButton
          style={{ color: "black", borderBottom: "1px solid #ccc" }}
        >
          <Modal.Title className="d-flex align-items-center">
            <Users size={24} className="me-2" />
            {meetingIdToEdit ? "Update Meeting" : "Schedule Meeting"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {meetingData.dealName && (
            <div className="alert alert-info mb-4 d-flex align-items-center">
              <User size={20} className="me-2" />
              <span>
                <strong>Deal:</strong> {meetingData.dealName}
              </span>
            </div>
          )}

          <Form>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">
                    Meeting Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={meetingData.meetingName}
                    onChange={(e) =>
                      setMeetingData({
                        ...meetingData,
                        meetingName: e.target.value,
                      })
                    }
                    placeholder="Enter meeting name or title..."
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">
                    Meeting Type <span className="text-danger">*</span>
                  </Form.Label>
                  <Select
                    value={{
                      value: meetingData.meetingType,
                      label: meetingData.meetingType,
                    }}
                    onChange={(option) => {
                      const selected =
                        option as {
                          value: string;
                          label: string;
                        } | null;
                      setMeetingData({
                        ...meetingData,
                        meetingType: selected?.value || "Online",
                      });
                    }}
                    options={[
                      { value: "Online", label: "Online" },
                      { value: "In-Person", label: "In-Person" },
                      { value: "Phone Call", label: "Phone Call" },
                      { value: "Video Call", label: "Video Call" },
                    ]}
                    styles={customSelectStyles}
                    placeholder="Select meeting type..."
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">
                    Meeting Date <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={meetingData.meetingDate}
                    onChange={(e) =>
                      setMeetingData({
                        ...meetingData,
                        meetingDate: e.target.value,
                      })
                    }
                    min={
                      meetingIdToEdit
                        ? getTodayDate(meetingData.meetingDate)
                        : new Date().toISOString().split("T")[0]
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">
                    Meeting Time <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="time"
                    value={meetingData.meetingTime}
                    onChange={(e) =>
                      setMeetingData({
                        ...meetingData,
                        meetingTime: e.target.value,
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Meeting Outcome - Only show when editing */}
            {meetingIdToEdit && (
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold small">
                      Meeting Outcome
                    </Form.Label>
                    <Select
                      value={
                        meetingData.meetingOutcome
                          ? {
                              value: meetingData.meetingOutcome,
                              label: meetingData.meetingOutcome,
                            }
                          : null
                      }
                      onChange={(option) => {
                        const selected =
                          option as {
                            value: string;
                            label: string;
                          } | null;
                        setMeetingData({
                          ...meetingData,
                          meetingOutcome: selected?.value ?? "",
                        });
                      }}
                      options={[
                        { value: "Scheduled", label: "Scheduled" },
                        {
                          value: "Completed - Successful",
                          label: "Completed - Successful",
                        },
                        {
                          value: "Completed - Needs Follow-up",
                          label: "Completed - Needs Follow-up",
                        },
                        { value: "Cancelled", label: "Cancelled" },
                        { value: "No Show", label: "No Show" },
                        { value: "Rescheduled", label: "Rescheduled" },
                      ]}
                      styles={customSelectStyles}
                      placeholder="Select meeting outcome..."
                      isClearable
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">
                    Attendees
                  </Form.Label>
                  <Select
                    isMulti
                    value={meetingAttendees}
                    onChange={(selected) => setMeetingAttendees(selected || [])}
                    options={extensions.map(
                      (extension: {
                        id: string;
                        display_name: string;
                        name: string;
                      }) => ({
                        value: extension.id,
                        label:
                          extension.display_name ||
                          extension.name ||
                          extension.id,
                      }),
                    )}
                    placeholder="Select attendees for this meeting..."
                    styles={customSelectStyles}
                  />
                  <Form.Text className="text-muted">
                    Select users who will attend this meeting.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <div className="alert alert-info mb-0 d-flex align-items-center">
              <AlertCircle size={18} className="me-2" />
              <small>
                Schedule meetings to track important interactions with your
                deals.
              </small>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-top bg-light">
          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowAddMeetingModal(false);
              setMeetingIdToEdit(null);
              setMeetingData({ ...DEALS_EMPTY_MEETING_FORM });
              setMeetingAttendees([]);
            }}
          >
            <X size={16} className="me-1" />
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={
              !meetingData.meetingName ||
              !meetingData.meetingType ||
              !meetingData.meetingDate ||
              !meetingData.meetingTime ||
              loadingMeeting
            }
            onClick={
              meetingIdToEdit ? handleUpdateMeeting : handleCreateMeeting
            }
          >
            {loadingMeeting ? (
              <>
                <div
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                />
                {meetingIdToEdit ? "Updating..." : "Scheduling..."}
              </>
            ) : (
              <>
                <Calendar size={16} className="me-1" />
                {meetingIdToEdit ? "Update Meeting" : "Schedule Meeting"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Meeting Modal */}
      <DeleteConfirmationModal
        show={showDeleteMeetingModal}
        onHide={() => {
          setShowDeleteMeetingModal(false);
          setMeetingToDelete(null);
        }}
        onConfirm={confirmDeleteMeeting}
        itemName={meetingToDelete?.meetingName}
        itemType="meeting"
      />

      {/* Delete Attachment Modal */}
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

      {/* Delete Follow-up Modal */}
      <DeleteConfirmationModal
        show={showDeleteFollowUpModal}
        onHide={() => {
          setShowDeleteFollowUpModal(false);
          setFollowUpToDelete(null);
        }}
        onConfirm={confirmDeleteFollowUp}
        itemName={followUpToDelete?.label}
        itemType="follow-up"
      />

      {/* Download File Modal */}
      <Modal
        show={showDownloadFileModal}
        onHide={() => {
          setShowDownloadFileModal(false);
          setDealForDownload(null);
        }}
        centered
        size="sm"
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <DownloadIcon size={22} className="me-2" />
            Download File
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            You can download a file for this deal. Click the button below to
            download a summary file (dummy file for now).
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowDownloadFileModal(false);
              setDealForDownload(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              const content = dealForDownload
                ? `Deal: ${dealForDownload.name || "N/A"}\nCompany: ${dealForDownload.company || dealForDownload.company_name || "N/A"}\nValue: ${dealForDownload.currency || "AED"} ${dealForDownload.value ?? "N/A"}\n\nThis is a dummy file for download.`
                : "This is a dummy file for download.";
              const blob = new Blob([content], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `deal-${dealForDownload?.name?.replace(/\s+/g, "-") || "export"}-${new Date().toISOString().slice(0, 10)}.txt`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              setShowDownloadFileModal(false);
              setDealForDownload(null);
              toast.success("File downloaded successfully");
            }}
          >
            <DownloadIcon size={16} className="me-1" />
            Download file
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add/Edit Follow-up Modal */}
      <Modal
        show={showAddFollowupModal}
        onHide={() => {
          setShowAddFollowupModal(false);
          setFollowUpIdToEdit(null);
          setFollowupData({ ...DEALS_EMPTY_FOLLOWUP_FORM });
        }}
        size="lg"
        centered
      >
        <Modal.Header
          closeButton
          style={{ color: "black", borderBottom: "1px solid #ccc" }}
        >
          <Modal.Title className="d-flex align-items-center">
            <Calendar size={24} className="me-2" />
            {followUpIdToEdit
              ? "Update Follow up Activity"
              : "Add Follow up Activity"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {followupData.dealName && (
            <div className="alert alert-info mb-4 d-flex align-items-center">
              <Handshake size={20} className="me-2" />
              <span>
                <strong>Deal:</strong> {followupData.dealName}
              </span>
            </div>
          )}

          <Form>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">
                    Follow-up Date <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={followupData.followUpDate}
                    onChange={(e) =>
                      setFollowupData({
                        ...followupData,
                        followUpDate: e.target.value,
                      })
                    }
                    min={
                      followUpIdToEdit
                        ? getTodayDate(followupData.followUpDate)
                        : new Date().toISOString().split("T")[0]
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Status</Form.Label>
                  <Select
                    value={{
                      value: followupData.followUpStatus,
                      label: followupData.followUpStatus,
                    }}
                    onChange={(option) => {
                      const selected =
                        option as {
                          value: string;
                          label: string;
                        } | null;
                      setFollowupData({
                        ...followupData,
                        followUpStatus: selected?.value || "Pending",
                      });
                    }}
                    options={[
                      { value: "Pending", label: "Pending" },
                      { value: "In Progress", label: "In Progress" },
                      { value: "Completed", label: "Completed" },
                      { value: "Cancelled", label: "Cancelled" },
                    ]}
                    styles={customSelectStyles}
                    placeholder="Select status..."
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">
                    Communication Channel <span className="text-danger">*</span>
                  </Form.Label>
                  <Select
                    value={{
                      value: followupData.communicationChannel,
                      label: followupData.communicationChannel,
                    }}
                    onChange={(option) => {
                      const selected =
                        option as {
                          value: string;
                          label: string;
                        } | null;
                      setFollowupData({
                        ...followupData,
                        communicationChannel: selected?.value || "Phone Call",
                        communicationChannelOther: "",
                      });
                    }}
                    options={[
                      { value: "Phone Call", label: "Phone Call" },
                      { value: "Email", label: "Email" },
                      { value: "Video Call", label: "Video Call" },
                      {
                        value: "In-Person Meeting",
                        label: "In-Person Meeting",
                      },
                      { value: "SMS", label: "SMS" },
                      { value: "WhatsApp", label: "WhatsApp" },
                      { value: "Other", label: "Other" },
                    ]}
                    styles={customSelectStyles}
                    placeholder="Select communication channel..."
                  />
                </Form.Group>
              </Col>
            </Row>

            {followupData.communicationChannel === "Other" && (
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold small">
                      Communication Channel (Other){" "}
                      <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={followupData.communicationChannelOther}
                      onChange={(e) =>
                        setFollowupData({
                          ...followupData,
                          communicationChannelOther: e.target.value,
                        })
                      }
                      placeholder="Specify communication channel..."
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={followupData.notes}
                    onChange={(e) =>
                      setFollowupData({
                        ...followupData,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Add notes, description, or specific action items for this follow-up..."
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="alert alert-info mb-0 d-flex align-items-center">
              <AlertCircle size={18} className="me-2" />
              <small>
                Follow-up activities help track communication and next steps
                with deals.
              </small>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-top bg-light">
          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowAddFollowupModal(false);
              setFollowUpIdToEdit(null);
              setFollowupData({ ...DEALS_EMPTY_FOLLOWUP_FORM });
            }}
          >
            <X size={16} className="me-1" />
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={
              !followupData.followUpDate ||
              !followupData.communicationChannel ||
              dealsFollowupChannelOtherIsInvalid(followupData) ||
              loadingFollowUp
            }
            onClick={
              followUpIdToEdit ? handleUpdateFollowUp : handleCreateFollowUp
            }
          >
            {loadingFollowUp ? (
              <>
                <div
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                />
                {followUpIdToEdit ? "Updating..." : "Adding..."}
              </>
            ) : (
              <>
                <Plus size={16} className="me-1" />
                {followUpIdToEdit ? "Update Follow up" : "Add Follow up"}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Column Editor Modal */}
      {isApprovalsList ? (
        <CrmListColumnEditorModal
          show={showColumnEditor}
          onHide={() => setShowColumnEditor(false)}
          columns={dealsColumns.map((c) => ({ key: c.key, label: c.label }))}
          selectedColumnKeys={selectedDealsColumns}
          storageKey="dealsSelectedColumns"
          onSelectedKeysChange={setSelectedDealsColumns}
        />
      ) : (
        <ColumnEditorModal
          show={showColumnEditor}
          onHide={() => setShowColumnEditor(false)}
          title="Customize Columns"
          columns={dealsColumns.map((c) => ({ key: c.key, label: c.label }))}
          selectedColumnKeys={selectedDealsColumns}
          onApply={(keys) => {
            setSelectedDealsColumns(keys);
            persistVisibleColumnKeys("dealsSelectedColumns", keys);
          }}
        />
      )}

      {/* Export Modal */}
      <CrmExportModal
        show={showExportModal}
        onHide={() => setShowExportModal(false)}
        title="Export Deals"
        subtitle="Choose filters to define which deals are exported. Defaults match your current table view."
        fileNameValue={exportFileName}
        onFileNameChange={setExportFileName}
        fileNamePlaceholder={
          isApprovalsList
            ? `approvals_deals_${moment().format("YYYY-MM-DD")}`
            : `deals_${moment().format("YYYY-MM-DD")}`
        }
        onExportClick={handleDealsExport}
        exporting={exporting}
        exportButtonLabel="Export"
      >
        <hr />
        <h6 className="mb-3">Export filters</h6>
        <Row>
          <Col md={6}>
            <CrmListExportModalAssignedToSelect
              extensions={extensions}
              value={
                exportFilters.user_extension_filter != null &&
                exportFilters.user_extension_filter !== ""
                  ? String(exportFilters.user_extension_filter)
                  : undefined
              }
              setExportFilters={setExportFilters}
              styles={
                isApprovalsList ? dealApprovalsSelectStyles : customSelectStyles
              }
            />
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Stage</Form.Label>
              <Select
                options={[
                  { value: "", label: "All stages" },
                  ...stages.map((st: any) => ({
                    value: String(st.id),
                    label: st.name || `Stage ${st.id}`,
                  })),
                ]}
                value={
                  exportFilters.stage_id
                    ? (() => {
                        const id = String(exportFilters.stage_id);
                        const stage = stages.find((s: any) => String(s.id) === id);
                        return { value: id, label: stage?.name || id };
                      })()
                    : null
                }
                onChange={(selected) => {
                  const v = (
                    selected as { value: string; label: string } | null
                  )?.value;
                  setExportFilters((prev) => {
                    const next = { ...prev };
                    if (v) next.stage_id = v;
                    else delete next.stage_id;
                    return next;
                  });
                }}
                placeholder="Select stage..."
                isClearable
                isSearchable
                styles={customSelectStyles}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Approval Status</Form.Label>
              <Select
                options={[
                  { value: "", label: "All statuses" },
                  { value: "pending", label: "Pending" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                ]}
                value={
                  exportFilters.approval_status
                    ? (() => {
                        const value = String(exportFilters.approval_status);
                        const labelMap: Record<string, string> = {
                          pending: "Pending",
                          approved: "Approved",
                          rejected: "Rejected",
                        };
                        return {
                          value,
                          label: labelMap[value] || value,
                        };
                      })()
                    : null
                }
                onChange={(selected) => {
                  const v = (
                    selected as { value: string; label: string } | null
                  )?.value;
                  setExportFilters((prev) => {
                    const next = { ...prev };
                    if (v) next.approval_status = v;
                    else delete next.approval_status;
                    return next;
                  });
                }}
                placeholder="Select approval status..."
                isClearable
                isSearchable
                styles={customSelectStyles}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Business Type</Form.Label>
              <Select
                options={[
                  { value: "", label: "All business types" },
                  ...filterBusinessTypes.map((bt: BusinessTypeData) => ({
                    value: bt.id.toString(),
                    label: bt.name,
                  })),
                ]}
                value={
                  exportFilters.business_type_id
                    ? (() => {
                        const id = String(exportFilters.business_type_id);
                        const bt = filterBusinessTypes.find(
                          (b: BusinessTypeData) => b.id.toString() === id,
                        );
                        return { value: id, label: bt?.name || id };
                      })()
                    : null
                }
                onChange={(selected) => {
                  const v = (
                    selected as { value: string; label: string } | null
                  )?.value;
                  setExportFilters((prev) => {
                    const next = { ...prev };
                    if (v) next.business_type_id = v;
                    else delete next.business_type_id;
                    return next;
                  });
                }}
                placeholder="Select business type..."
                isClearable
                isSearchable
                styles={customSelectStyles}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Ticket ID (source)</Form.Label>
              <Form.Control
                type="text"
                value={exportFilters.ticket_id || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setExportFilters((prev) => {
                    const next = { ...prev };
                    if (value) next.ticket_id = value;
                    else delete next.ticket_id;
                    return next;
                  });
                }}
                placeholder="Filter by source ticket ID"
              />
            </Form.Group>
          </Col>
        </Row>
      </CrmExportModal>

      {/* Filters Sidebar */}
      <GenericFilterSidebar
        isOpen={showFiltersSidebar}
        onClose={() => setShowFiltersSidebar(false)}
        title="Filters"
        subtitle="Filter and refine your deals"
        width="400px"
        filters={[
          {
            id: "assignedTo",
            label: "Owner",
            type: "select" as const,
            value: dealsFilters.assignedTo
              ? (() => {
                  const assignedToId = dealsFilters.assignedTo;
                  const ext = extensions.find(
                    (e: any) => (e.id || e.extension) === assignedToId,
                  );
                  return ext
                    ? {
                        value: assignedToId,
                        label: ext.display_name || ext.name || assignedToId,
                      }
                    : { value: assignedToId, label: assignedToId };
                })()
              : null,
            onChange: (selected) => {
              const assignedToValue = selected ? selected.value : null;
              setDealsFilters((prev) => ({
                ...prev,
                assignedTo: assignedToValue,
              }));
              setActiveFilter("all");
            },
            options: extensions.map((ext: any) => ({
              value: ext.id || ext.extension,
              label: ext.display_name || ext.name || ext.id || ext.extension,
            })),
            placeholder: "Select user...",
            isClearable: true,
            styles: customSelectStyles,
          },
          {
            id: "stage",
            label: "Stage",
            type: "select" as const,
            value: dealsFilters.stage
              ? (() => {
                  const stageId = dealsFilters.stage;
                  const stage = stages.find(
                    (st: any) => st.id.toString() === stageId,
                  );
                  return stage
                    ? { value: stageId, label: stage.name }
                    : { value: stageId, label: stageId };
                })()
              : null,
            onChange: (selected) => {
              const stageValue = selected ? selected.value : null;
              setDealsFilters((prev) => ({
                ...prev,
                stage: stageValue,
              }));
              if (stageValue) {
                setActiveFilter(stageValue);
              } else {
                setActiveFilter("all");
              }
            },
            options: stages.map((s) => ({
              value: s.id.toString(),
              label: s.name,
            })),
            placeholder: "Select stage...",
            isClearable: true,
            styles: customSelectStyles,
          },
          {
            id: "followUpDateFrom",
            label: "Follow-up Date From",
            type: "date" as const,
            value: dealsFilters.followUpDateFrom || "",
            onChange: (value) =>
              setDealsFilters((prev) => ({ ...prev, followUpDateFrom: value })),
          },
          {
            id: "followUpDateTo",
            label: "Follow-up Date To",
            type: "date" as const,
            value: dealsFilters.followUpDateTo || "",
            onChange: (value) =>
              setDealsFilters((prev) => ({ ...prev, followUpDateTo: value })),
          },
          {
            id: "probabilityMin",
            label: "Probability Min (%)",
            type: "text" as const,
            value: dealsFilters.probabilityMin || "",
            onChange: (value) =>
              setDealsFilters((prev) => ({ ...prev, probabilityMin: value })),
            placeholder: "0",
          },
          {
            id: "probabilityMax",
            label: "Probability Max (%)",
            type: "text" as const,
            value: dealsFilters.probabilityMax || "",
            onChange: (value) =>
              setDealsFilters((prev) => ({ ...prev, probabilityMax: value })),
            placeholder: "100",
          },
          ...(isApprovalsList
            ? [
                {
                  id: "dealType",
                  label: "Deal Type",
                  type: "dropdown" as const,
                  value: dealsFilters.dealType || "",
                  onChange: (value: string) =>
                    setDealsFilters((prev) => ({ ...prev, dealType: value })),
                  options: [
                    { value: "", label: "Select Deal Type" },
                    { value: "new_sale", label: "New Sale" },
                    { value: "renewal", label: "Renewal" },
                    { value: "migration", label: "Migration" },
                    { value: "upsell", label: "Upsell" },
                  ],
                },
                {
                  id: "approvalStatus",
                  label: "Approval Status",
                  type: "dropdown" as const,
                  value: dealsFilters.approvalStatus || "",
                  onChange: (value: string) =>
                    setDealsFilters((prev) => ({
                      ...prev,
                      approvalStatus: value,
                    })),
                  options: [
                    { value: "", label: "Select Approval Status" },
                    { value: "pending", label: "Pending" },
                    { value: "approved", label: "Approved" },
                    { value: "rejected", label: "Rejected" },
                  ],
                },
                {
                  id: "industry",
                  label: "Industry",
                  type: "dropdown" as const,
                  value: dealsFilters.industry || "",
                  onChange: (value: string) =>
                    setDealsFilters((prev) => ({ ...prev, industry: value })),
                  options: [
                    { value: "", label: "Select Industry" },
                    { value: "Technology", label: "Technology" },
                    { value: "Healthcare", label: "Healthcare" },
                    { value: "Finance", label: "Finance" },
                    {
                      value: "Banking & Financial Services",
                      label: "Banking & Financial Services",
                    },
                    { value: "Manufacturing", label: "Manufacturing" },
                    { value: "Retail", label: "Retail" },
                    { value: "Education", label: "Education" },
                    { value: "Real Estate", label: "Real Estate" },
                    { value: "Telecommunications", label: "Telecommunications" },
                    { value: "Construction", label: "Construction" },
                    { value: "Other", label: "Other" },
                  ],
                },
              ]
            : [
                {
                  id: "approvalStatus",
                  label: "Approval Status",
                  type: "dropdown" as const,
                  value: dealsFilters.approvalStatus || "",
                  onChange: (value: string) =>
                    setDealsFilters((prev) => ({
                      ...prev,
                      approvalStatus: value,
                    })),
                  options: [
                    { value: "", label: "Select Approval Status" },
                    { value: "pending", label: "Pending" },
                    { value: "approved", label: "Approved" },
                    { value: "rejected", label: "Rejected" },
                  ],
                },
                {
                  id: "businessType",
                  label: "Business Type",
                  type: "dropdown" as const,
                  value: dealsFilters.businessType || "",
                  onChange: (value: string) =>
                    setDealsFilters((prev) => ({
                      ...prev,
                      businessType: value,
                    })),
                  options: [
                    { value: "", label: "Select Business Type" },
                    ...filterBusinessTypes.map((bt: BusinessTypeData) => ({
                      value: bt.id.toString(),
                      label: bt.name,
                    })),
                  ],
                },
              ]),
          {
            id: "expectedCloseDateFrom",
            label: "Expected Close Date From",
            type: "date" as const,
            value: dealsFilters.expectedCloseDateFrom || "",
            onChange: (value) =>
              setDealsFilters((prev) => ({
                ...prev,
                expectedCloseDateFrom: value,
              })),
          },
          {
            id: "expectedCloseDateTo",
            label: "Expected Close Date To",
            type: "date" as const,
            value: dealsFilters.expectedCloseDateTo || "",
            onChange: (value) =>
              setDealsFilters((prev) => ({
                ...prev,
                expectedCloseDateTo: value,
              })),
          },
          ...(isApprovalsList
            ? []
            : [
                {
                  id: "includeConverted",
                  label: "Include converted",
                  type: "dropdown" as const,
                  value: dealsFilters.includeConverted ? "true" : "false",
                  onChange: (value: string) =>
                    setDealsFilters((prev) => ({
                      ...prev,
                      includeConverted: value === "true",
                    })),
                  options: [
                    { value: "false", label: "No (exclude deals with orders)" },
                    { value: "true", label: "Yes" },
                  ],
                },
                {
                  id: "includeLost",
                  label: "Include lost",
                  type: "dropdown" as const,
                  value: dealsFilters.includeLost ? "true" : "false",
                  onChange: (value: string) =>
                    setDealsFilters((prev) => ({
                      ...prev,
                      includeLost: value === "true",
                    })),
                  options: [
                    { value: "false", label: "No" },
                    {
                      value: "true",
                      label: "Yes (show only lost deals)",
                    },
                  ],
                },
                {
                  id: "includeArchived",
                  label: "Include deleted records",
                  type: "dropdown" as const,
                  value: dealsFilters.includeArchived ? "true" : "false",
                  onChange: (value: string) =>
                    setDealsFilters((prev) => ({
                      ...prev,
                      includeArchived: value === "true",
                    })),
                  options: [
                    { value: "false", label: "No" },
                    {
                      value: "true",
                      label: "Yes (show only deleted records)",
                    },
                  ],
                },
                {
                  id: "createdAtFrom",
                  label: "Created date from",
                  type: "date" as const,
                  value: dealsFilters.createdAtFrom || "",
                  onChange: (value: string) =>
                    setDealsFilters((prev) => ({
                      ...prev,
                      createdAtFrom: value || null,
                    })),
                },
                {
                  id: "createdAtTo",
                  label: "Created date to",
                  type: "date" as const,
                  value: dealsFilters.createdAtTo || "",
                  onChange: (value: string) =>
                    setDealsFilters((prev) => ({
                      ...prev,
                      createdAtTo: value || null,
                    })),
                },
                {
                  id: "ticketId",
                  label: "Ticket ID (source)",
                  type: "text" as const,
                  value: dealsFilters.ticketId || "",
                  onChange: (value: string) =>
                    setDealsFilters((prev) => ({
                      ...prev,
                      ticketId: value || null,
                    })),
                  placeholder: "Filter by source ticket ID",
                },
                {
                  id: "hasMeetings",
                  label: "Has meetings",
                  type: "dropdown" as const,
                  value: dealsFilters.hasMeetings ? "true" : "false",
                  onChange: (value: string) =>
                    setDealsFilters((prev) => ({
                      ...prev,
                      hasMeetings: value === "true",
                    })),
                  options: [
                    { value: "false", label: "No" },
                    {
                      value: "true",
                      label: "Yes (only deals with meetings)",
                    },
                  ],
                },
              ]),
        ]}
        onApply={() => {
          handleFiltersChange(
            isApprovalsList
              ? buildApprovalsSidebarFiltersPayload()
              : buildDealsSidebarFiltersPayload(),
          );
          setDealsPagination({ ...dealsPagination, currentPage: 1 });
          setShowFiltersSidebar(false);
        }}
        onReset={() => {
          setDealsSearch("");
          if (isApprovalsList) {
            setDealsFilters({
              assignedTo: null,
              stage: null,
              followUpDateFrom: null,
              followUpDateTo: null,
              probabilityMin: null,
              probabilityMax: null,
              dealType: null,
              approvalStatus: null,
              industry: null,
              businessType: null,
              expectedCloseDateFrom: null,
              expectedCloseDateTo: null,
              includeConverted: false,
              includeLost: false,
              includeArchived: false,
              createdAtFrom: null,
              createdAtTo: null,
              created_at_month: null,
              ticketId: null,
              hasMeetings: false,
            });
            handleFiltersChange({});
            setCurrentFilters({ approval_status: "pending" });
          } else {
            setDealsFilters({
              assignedTo: null,
              stage: null,
              followUpDateFrom: null,
              followUpDateTo: null,
              probabilityMin: null,
              probabilityMax: null,
              dealType: null,
              industry: null,
              businessType: null,
              expectedCloseDateFrom: null,
              expectedCloseDateTo: null,
              approvalStatus: null,
              includeConverted: false,
              includeLost: false,
              includeArchived: false,
              createdAtFrom: null,
              createdAtTo: null,
              created_at_month: null,
              ticketId: null,
              hasMeetings: false,
            });
            handleFiltersChange({});
            setCurrentFilters({});
          }
          setActiveFilter("all");
          setDealsPagination({ ...dealsPagination, currentPage: 1 });
        }}
        showApplyButton={true}
        showResetButton={true}
      />

      {/* Edit Deal Modal - Removed, using sidebar instead */}
      {/* Add/Edit Revision Modal - Removed, was part of Edit Deal Modal */}

      {/* Convert to Order Modal */}
      {dealToConvert && (
        <ConvertDealToOrderModal
          show={showConvertToOrderModal}
          onHide={() => {
            setShowConvertToOrderModal(false);
            setDealToConvert(null);
          }}
          dealId={dealToConvert}
          onSuccess={() => {
            refreshDealsListAndTabTotals();
          }}
        />
      )}

      <CrmDealsListAddTabModal
        show={showTabModal}
        onHide={() => setShowTabModal(false)}
        stages={stages}
        customTabs={customTabs}
        setCustomTabs={setCustomTabs}
        filterCounts={filterCounts}
        showRejectedTab={!isApprovalsList}
      />

      {/* Create Deal Sidebar */}
      {showCreateDealSidebar && !isApprovalsList && (
        <CreateDealSidebar
          onClose={() => {
            setShowCreateDealSidebar(false);
            setEditingDealIdInSidebar(null);
          }}
          dealId={editingDealIdInSidebar}
          onSuccess={() => {
            refreshDealsListAndTabTotals();
          }}
        />
      )}

      {showEditDealSidebar && isApprovalsList && (
        <EditDealApprovalSidebar
          onClose={() => {
            setShowEditDealSidebar(false);
            setEditingDealIdInSidebar(null);
          }}
          dealId={editingDealIdInSidebar}
          onSuccess={() => refreshDealsListAndTabTotals()}
        />
      )}
    </React.Fragment>
  );
}
