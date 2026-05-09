import { useMemo } from "react";
import type { FocusEvent, MouseEvent } from "react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable from "@components/GenericTable";
import CrmExportModal from "@components/CrmExportModal";
import GenericSidebar from "@components/GenericSidebarNew";
import GenericFilterSidebar from "@components/GenericFilterSidebar";
import { updateLead } from "./leadsPageCrmBundle";
import type { BusinessTypeData } from "./leadsPageCrmBundle";
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
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import PhoneInput, {
  parsePhoneNumber as parsePhoneLib,
} from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Country, State, City } from "country-state-city";
import {
  formatCrmPreviewDate,
  formatCrmPreviewDateTime,
  formatMeetingDateLocal,
  RECORD_TYPES,
} from "@utils/Helper";
import {
  Target,
  CheckCircle,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Handshake,
  X,
  Users,
  Clock,
  Layers,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone as PhoneIcon,
  ChartLine,
  Building2,
  User,
  History,
  FileText,
  GitBranch,
  DollarSign,
  UserCheck,
  AlertCircle,
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
import { FiPlus } from "react-icons/fi";
import { toast } from "react-toastify";
import moment from "moment";

import FormModal from "@components/page-partials/FormModal";
import SuccessfulModal from "@components/page-partials/SuccessfulModal";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import { CrmListColumnEditorModal } from "@crm/shared/CrmListColumnEditorModal";
import CreateLeadModal from "@components/CreateLeadModal";
import CallRecordingPlayerModal from "@components/CallRecordingPlayerModal";
import {
  CrmPhoneDisplay as PhoneDisplay,
  CrmKPICard as KPICard,
  CrmFilterBar as FilterBar,
} from "@components/crm/CrmListPageUi";
import { getInitials, getRandomColor } from "@utils/crmNameAvatar";
import { crmListPageReactSelectStyles as customSelectStyles } from "@utils/crmListPageReactSelectStyles";

import ConvertLeadToDealModal from "@components/ConvertLeadToDealModal";
import KanbanBoard from "@components/KanbanBoard";
import { useLeadsPageContext } from "./leadsPageContext";
import { ignoredKeys, leadsToKanbanColumns } from "./leadsPageShared";
import {
  CrmLeadEditCampaignFieldControl,
  CrmLeadPreviewGrayField,
  CrmLeadViewDetailTabButton,
  CrmLeadViewQuickStatCard,
  CrmLeadViewSectionTitle,
  crmMeetingOutcomeToBadgeBg,
  crmMeetingTimelineDotFill,
  resolveCrmExtensionDisplayName,
} from "./CrmLeadsViewUiPrimitives";
import {
  CrmModalCloseButton,
  CrmModalAvatar,
} from "@crm/shared/CrmListViewDataModalPrimitives";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;

function getCrmLeadsStringSelectValue(selected: unknown): string | undefined {
  if (selected && typeof selected === "object" && "value" in selected) {
    const v = (selected as { value: unknown }).value;
    if (v == null) return undefined;
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    return undefined;
  }
  return undefined;
}

function crmSidebarLeadPotentialBadgeVariant(
  leadPotential: string | undefined,
  leadPotentialAlt: string | undefined,
): "danger" | "warning" | "secondary" {
  if (leadPotential === "Hot" || leadPotentialAlt === "Hot") return "danger";
  if (leadPotential === "Warm" || leadPotentialAlt === "Warm")
    return "warning";
  return "secondary";
}

function crmLeadDetailPotentialBadgeBg(
  potential: string | undefined,
): "danger" | "warning" | "secondary" {
  if (potential === "Hot") return "danger";
  if (potential === "Warm") return "warning";
  return "secondary";
}

function formatCrmSidebarLeadScoreValue(
  stageScore: unknown,
  leadScore: unknown,
): string {
  if (stageScore) return `${stageScore as string | number}%`;
  if (leadScore) return `${leadScore as string | number}%`;
  return "N/A";
}

function crmFollowUpTimelineStatusBadgeBg(
  status: string | undefined,
): "success" | "primary" | "warning" {
  if (status === "Completed") return "success";
  if (status === "In Progress") return "primary";
  return "warning";
}

function crmLeadHistoryAuditEventLabel(event: string): string {
  if (event === "created") return "Created";
  if (event === "updated") return "Updated";
  return event;
}

/** Pairs onMouseOver/onMouseOut with onFocus/onBlur for keyboard parity (Sonar accessibility). */
const crmLeadIconSoftSurfaceHoverHandlers = {
  onMouseOver(e: MouseEvent<HTMLButtonElement>) {
    e.currentTarget.style.background = "#eff6ff";
  },
  onMouseOut(e: MouseEvent<HTMLButtonElement>) {
    e.currentTarget.style.background = "transparent";
  },
  onFocus(e: FocusEvent<HTMLButtonElement>) {
    e.currentTarget.style.background = "#eff6ff";
  },
  onBlur(e: FocusEvent<HTMLButtonElement>) {
    e.currentTarget.style.background = "transparent";
  },
};

const crmLeadPrimaryBlueCtaHoverHandlers = {
  onMouseOver(e: MouseEvent<HTMLButtonElement>) {
    e.currentTarget.style.background = "#1d4ed8";
  },
  onMouseOut(e: MouseEvent<HTMLButtonElement>) {
    e.currentTarget.style.background = "#2563eb";
  },
  onFocus(e: FocusEvent<HTMLButtonElement>) {
    e.currentTarget.style.background = "#1d4ed8";
  },
  onBlur(e: FocusEvent<HTMLButtonElement>) {
    e.currentTarget.style.background = "#2563eb";
  },
};

const LEAD_POTENTIAL_PIE_SLICES = [
  { name: "Hot" as const, color: "#dc3545" },
  { name: "Warm" as const, color: "#ffc107" },
  { name: "Cold" as const, color: "#0dcaf0" },
];

function crmLeadsLeadPotentialPieData(potentialCounts: Record<string, number>) {
  return LEAD_POTENTIAL_PIE_SLICES.map((s) => ({
    name: s.name,
    value: potentialCounts[s.name] || 0,
    color: s.color,
  }));
}

function crmLeadCrmDataNestedName(
  crm: { name?: string; data?: { name?: string } } | null | undefined,
): string | undefined {
  return crm?.name ?? crm?.data?.name;
}

function crmLeadCrmDataNestedPhone(
  crm: { phone?: string; data?: { phone?: string } } | null | undefined,
): string {
  return crm?.phone ?? crm?.data?.phone ?? "";
}

function crmLeadOverviewStatusBadgeVariant(
  isLost: boolean,
  status: string | undefined,
): "danger" | "primary" | "success" {
  if (isLost) return "danger";
  if (status === "new") return "primary";
  return "success";
}

function editLeadModalBusinessTypeSelectValue(
  showOther: boolean,
  businessTypeId: number | null,
): string {
  if (showOther) return "other";
  if (businessTypeId) return String(businessTypeId);
  return "";
}

type CrmLeadEditCountryOption = {
  value: string;
  label: string;
  isoCode: string;
};

function CrmLeadEditCountrySelectFormatOption({
  option,
}: Readonly<{ option: CrmLeadEditCountryOption }>) {
  return (
    <div className="d-flex align-items-center">
      <img
        src={`https://flagcdn.com/w20/${option.isoCode.toLowerCase()}.png`}
        alt={option.label}
        className="me-2"
        style={{ width: "20px", height: "15px" }}
      />
      {option.label}
    </div>
  );
}

function formatCrmLeadEditCountrySelectOptionLabel(option: unknown) {
  return (
    <CrmLeadEditCountrySelectFormatOption
      option={option as CrmLeadEditCountryOption}
    />
  );
}

function CrmLeadEditModalCountrySelectGroup({
  editSelectedCountry,
  onCountryChange,
}: Readonly<{
  editSelectedCountry: CrmLeadEditCountryOption | null;
  onCountryChange: (value: unknown) => void;
}>) {
  return (
    <Col md={6}>
      <Form.Group className="mb-3">
        <Form.Label>Country</Form.Label>
        <Select
          value={editSelectedCountry}
          onChange={onCountryChange}
          options={Country.getAllCountries().map((country) => ({
            value: country.isoCode,
            label: country.name,
            isoCode: country.isoCode,
          }))}
          placeholder="Select Country"
          isClearable
          isSearchable
          formatOptionLabel={formatCrmLeadEditCountrySelectOptionLabel}
        />
      </Form.Group>
    </Col>
  );
}

function editLeadContactPersonStableKey(
  person: { id?: number; name?: string; phone?: string; title?: string },
  index: number,
): string {
  if (person.id != null && Number.isFinite(person.id)) {
    return `lead-contact-${person.id}`;
  }
  return `lead-contact-${person.name ?? ""}-${person.phone ?? ""}-${person.title ?? ""}-i${index}`;
}

function CrmLeadsAnalyticsSection(
  props: Readonly<{
    analyticsData: {
      total: number;
      potentialCounts: Record<string, number>;
      stageCounts: Record<string, number>;
    };
    summaryTiles?: { qualified_leads?: number; new_leads?: number };
  }>,
) {
  const { analyticsData, summaryTiles } = props;
  const pieData = crmLeadsLeadPotentialPieData(analyticsData.potentialCounts);
  return (
    <>
      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-3">
          <KPICard
            title="Total Leads"
            value={analyticsData.total.toString()}
            icon={<Target size={24} />}
            color="primary"
          />
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <KPICard
            title="Qualified Leads"
            value={summaryTiles?.qualified_leads?.toString() || "0"}
            icon={<CheckCircle size={24} />}
            color="success"
          />
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <KPICard
            title="New Leads"
            value={summaryTiles?.new_leads?.toString() || "0"}
            icon={<TrendingUp size={24} />}
            color="danger"
          />
        </Col>
      </Row>
      <Row className="mb-4">
        <Col md={6} className="mb-3">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h6 className="fw-bold mb-3">Lead Potential Distribution</h6>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) =>
                      `${props.name}: ${((props.percent as number) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
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
              <h6 className="fw-bold mb-3">Lead Stage Distribution</h6>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={Object.entries(analyticsData.stageCounts).map(
                    ([stage, count]) => ({ stage, count }),
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
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
  );
}

function CrmLeadViewModalGeneralInfoTab() {
  const { viewingLead, extensions } = useLeadsPageContext();
  if (!viewingLead) {
    return null;
  }
  return (
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
                          <CrmLeadViewQuickStatCard
                            accentColor="#2563eb"
                            label="Assigned To"
                            icon={<User size={20} style={{ color: "white" }} />}
                          >
                            {resolveCrmExtensionDisplayName(
                              extensions,
                              viewingLead?.user_extension,
                            )}
                          </CrmLeadViewQuickStatCard>

                          <CrmLeadViewQuickStatCard
                            accentColor="#0284c7"
                            label="Lead Potential"
                            icon={
                              <Target size={20} style={{ color: "white" }} />
                            }
                          >
                            <Badge
                              bg={crmLeadDetailPotentialBadgeBg(
                                viewingLead.lead_potential,
                              )}
                              style={{
                                padding: "6px 14px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: 600,
                              }}
                            >
                              {viewingLead.lead_potential || "N/A"}
                            </Badge>
                          </CrmLeadViewQuickStatCard>

                          <CrmLeadViewQuickStatCard
                            accentColor={
                              viewingLead.stage?.color || "#6c757d"
                            }
                            labelColor="#6b7280"
                            label="Stage"
                            icon={
                              <Target size={20} style={{ color: "white" }} />
                            }
                          >
                            {viewingLead.stage?.name || "Not assigned"}
                          </CrmLeadViewQuickStatCard>

                          <CrmLeadViewQuickStatCard
                            accentColor="#10b981"
                            label="Lead Score"
                            icon={
                              <ChartLine
                                size={20}
                                style={{ color: "white" }}
                              />
                            }
                          >
                            {viewingLead?.lead_score == null
                              ? "Not Set"
                              : `${viewingLead.lead_score}%`}
                          </CrmLeadViewQuickStatCard>
                        </div>

                        {/* Lead Information Section */}
                        <div style={{ marginBottom: "28px" }}>
                          <CrmLeadViewSectionTitle>
                            Lead Details
                          </CrmLeadViewSectionTitle>
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
                                <User size={16} style={{ color: "#2563eb" }} />
                                Lead Name
                              </div>
                              <div
                                style={{
                                  color: "#1f2937",
                                  fontSize: "15px",
                                  fontWeight: 500,
                                }}
                              >
                                {viewingLead.name}
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
                                  style={{ color: "#2563eb" }}
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
                                {viewingLead.created_at
                                  ? formatCrmPreviewDateTime(
                                      viewingLead.created_at,
                                    ) || "N/A"
                                  : "N/A"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Company Information Section */}
                        {viewingLead.company_name && (
                          <div style={{ marginBottom: "28px" }}>
                            <CrmLeadViewSectionTitle>
                              Company Information
                            </CrmLeadViewSectionTitle>
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
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: "16px 24px",
                                }}
                              >
                                <CrmLeadPreviewGrayField label="Company Name">
                                  <>
                                    <Building2
                                      size={14}
                                      style={{
                                        color: "#2563eb",
                                        marginRight: "6px",
                                        display: "inline",
                                      }}
                                    />
                                    {viewingLead.company_name}
                                  </>
                                </CrmLeadPreviewGrayField>
                                {viewingLead.industry && (
                                  <CrmLeadPreviewGrayField label="Industry">
                                    {viewingLead.industry}
                                  </CrmLeadPreviewGrayField>
                                )}
                                {viewingLead.business_type && (
                                  <CrmLeadPreviewGrayField label="Business Type">
                                    {viewingLead.business_type}
                                  </CrmLeadPreviewGrayField>
                                )}
                                {viewingLead.company_size && (
                                  <CrmLeadPreviewGrayField label="Company Size">
                                    {viewingLead.company_size}
                                  </CrmLeadPreviewGrayField>
                                )}
                                {viewingLead.company_city && (
                                  <CrmLeadPreviewGrayField label="Location">
                                    {[
                                      viewingLead.company_city,
                                      viewingLead.company_country,
                                    ]
                                      .filter(Boolean)
                                      .join(", ") || "N/A"}
                                  </CrmLeadPreviewGrayField>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Contact Persons Section */}
                        {viewingLead.contact_persons &&
                          Array.isArray(viewingLead.contact_persons) &&
                          viewingLead.contact_persons.length > 0 && (
                            <div style={{ marginBottom: "28px" }}>
                              <CrmLeadViewSectionTitle>
                                Contact Persons
                                <Badge
                                  bg="secondary"
                                  style={{
                                    marginLeft: "8px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    padding: "4px 10px",
                                    borderRadius: "6px",
                                  }}
                                >
                                  {viewingLead.contact_persons.length}
                                </Badge>
                              </CrmLeadViewSectionTitle>
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
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "16px",
                                  }}
                                >
                                  {viewingLead.contact_persons.map(
                                    (person: any, index: number) => (
                                      <div
                                        key={`${person.id ?? person.email ?? "p"}-${person.name ?? ""}-${index}`}
                                        style={{
                                          background: "white",
                                          padding: "16px",
                                          borderRadius: "8px",
                                          border: "1px solid #e5e7eb",
                                        }}
                                      >
                                        <div
                                          style={{
                                            fontSize: "14px",
                                            fontWeight: 600,
                                            color: "#1f2937",
                                            marginBottom: "8px",
                                          }}
                                        >
                                          {person.title} {person.name}
                                        </div>
                                        {person.email && (
                                          <div
                                            style={{
                                              fontSize: "13px",
                                              color: "#6b7280",
                                              marginBottom: "4px",
                                            }}
                                          >
                                            <Mail
                                              size={12}
                                              style={{
                                                marginRight: "6px",
                                                display: "inline",
                                              }}
                                            />
                                            {person.email}
                                          </div>
                                        )}
                                        {person.phone && (
                                          <div
                                            style={{
                                              fontSize: "13px",
                                              color: "#6b7280",
                                            }}
                                          >
                                            <PhoneDisplay
                                              phone={
                                                person.phone_country_code &&
                                                person.phone
                                                  ? `${person.phone_country_code}${person.phone}`
                                                  : person.phone
                                              }
                                            />
                                          </div>
                                        )}
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                        {/* Description */}
                        {viewingLead.description && (
                          <div style={{ marginBottom: "28px" }}>
                            <CrmLeadViewSectionTitle>
                              Description
                            </CrmLeadViewSectionTitle>
                            <div
                              style={{
                                background: "#fffbeb",
                                border: "1px solid #fcd34d",
                                borderRadius: "12px",
                                padding: "16px 20px",
                                fontSize: "14px",
                                color: "#78350f",
                                lineHeight: "1.6",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {viewingLead.description}
                            </div>
                          </div>
                        )}

                        {/* Lost Reason */}
                        {viewingLead.is_lost && viewingLead.lost_reason && (
                          <div style={{ marginBottom: "28px" }}>
                            <CrmLeadViewSectionTitle accent="danger">
                              Lead Lost Information
                            </CrmLeadViewSectionTitle>
                            <div
                              style={{
                                background: "#fee2e2",
                                border: "1px solid #fecaca",
                                borderRadius: "12px",
                                padding: "16px 20px",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  color: "#dc2626",
                                  marginBottom: "8px",
                                }}
                              >
                                Reason: {viewingLead.lost_reason.name}
                              </div>
                              {viewingLead.lost_feedback && (
                                <div
                                  style={{
                                    fontSize: "13px",
                                    color: "#991b1b",
                                    lineHeight: "1.6",
                                  }}
                                >
                                  Feedback: {viewingLead.lost_feedback}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
  );
}

function CrmLeadViewModalCampaignProspectTab() {
  const { viewingLead } = useLeadsPageContext();
  if (!viewingLead) {
    return null;
  }
  return (
                      <div>
                        {/* Campaign Information Section */}
                        <div style={{ marginBottom: "28px" }}>
                          <CrmLeadViewSectionTitle>
                            Campaign Information
                          </CrmLeadViewSectionTitle>
                          {viewingLead.campaign ? (
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
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: "16px 24px",
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      marginBottom: "6px",
                                    }}
                                  >
                                    Campaign Name
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      fontWeight: 500,
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {viewingLead.campaign.name}
                                  </div>
                                </div>
                                {viewingLead.campaign_field_values &&
                                  Object.keys(viewingLead.campaign_field_values)
                                    .length > 0 &&
                                  Object.entries(
                                    viewingLead.campaign_field_values,
                                  ).map(([key, value]: [string, any]) => (
                                    <div key={key}>
                                      <div
                                        style={{
                                          fontSize: "12px",
                                          fontWeight: 700,
                                          color: "#6b7280",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.5px",
                                          marginBottom: "6px",
                                        }}
                                      >
                                        {key}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: "14px",
                                          color: "#1f2937",
                                          fontWeight: 500,
                                          wordBreak: "break-word",
                                        }}
                                      >
                                        {String(value)}
                                      </div>
                                    </div>
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
                        </div>

                        {/* Prospect Information Section */}
                        <div style={{ marginBottom: "28px" }}>
                          <CrmLeadViewSectionTitle>
                            Prospect Information
                          </CrmLeadViewSectionTitle>
                          {viewingLead.crm_data ? (
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
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: "16px 24px",
                                }}
                              >
                                {viewingLead.crm_data.id && (
                                  <CrmLeadPreviewGrayField label="CRM Data ID">
                                    #{viewingLead.crm_data.id}
                                  </CrmLeadPreviewGrayField>
                                )}
                                {crmLeadCrmDataNestedName(viewingLead.crm_data) && (
                                  <CrmLeadPreviewGrayField label="Name">
                                    {crmLeadCrmDataNestedName(viewingLead.crm_data) ||
                                      "N/A"}
                                  </CrmLeadPreviewGrayField>
                                )}
                                {crmLeadCrmDataNestedPhone(viewingLead.crm_data) && (
                                  <CrmLeadPreviewGrayField label="Phone">
                                    <PhoneDisplay
                                      phone={crmLeadCrmDataNestedPhone(
                                        viewingLead.crm_data,
                                      )}
                                    />
                                  </CrmLeadPreviewGrayField>
                                )}
                                {viewingLead.crm_data.source_file && (
                                  <CrmLeadPreviewGrayField label="Source File">
                                    {viewingLead.crm_data.source_file}
                                  </CrmLeadPreviewGrayField>
                                )}
                                {viewingLead.crm_data.uploaded_by && (
                                  <CrmLeadPreviewGrayField label="Uploaded By">
                                    <User
                                      size={14}
                                      style={{
                                        color: "#2563eb",
                                        marginRight: "6px",
                                        display: "inline",
                                      }}
                                    />
                                    {viewingLead.crm_data.uploaded_by}
                                  </CrmLeadPreviewGrayField>
                                )}
                                {viewingLead?.crm_data?.scheduled_call_at && (
                                  <CrmLeadPreviewGrayField label="Scheduled Call">
                                    <Calendar
                                      size={14}
                                      style={{
                                        color: "#2563eb",
                                        marginRight: "6px",
                                        display: "inline",
                                      }}
                                    />
                                    {(() => {
                                      const scheduledAt =
                                        viewingLead.crm_data.scheduled_call_at;
                                      const isOverdue = moment(
                                        scheduledAt,
                                      ).isBefore(moment());
                                      const isNextHour = moment(
                                        scheduledAt,
                                      ).isBefore(moment().add(1, "hour"));
                                      return (
                                        <span>
                                          {moment(scheduledAt).format(
                                            "MMM DD, YYYY HH:mm",
                                          )}
                                          {isOverdue && (
                                            <Badge
                                              bg="danger"
                                              className="ms-2"
                                              style={{
                                                fontSize: "10px",
                                                padding: "2px 6px",
                                              }}
                                            >
                                              Overdue
                                            </Badge>
                                          )}
                                          {isNextHour && isOverdue === false && (
                                            <Badge
                                              bg="warning"
                                              className="ms-2"
                                              style={{
                                                fontSize: "10px",
                                                padding: "2px 6px",
                                              }}
                                            >
                                              Soon
                                            </Badge>
                                          )}
                                        </span>
                                      );
                                    })()}
                                  </CrmLeadPreviewGrayField>
                                )}
                                {viewingLead.crm_data?.created_at && (
                                  <CrmLeadPreviewGrayField label="Created At">
                                    <Calendar
                                      size={14}
                                      style={{
                                        color: "#2563eb",
                                        marginRight: "6px",
                                        display: "inline",
                                      }}
                                    />
                                    {formatCrmPreviewDate(
                                      viewingLead.crm_data?.created_at,
                                    )}
                                  </CrmLeadPreviewGrayField>
                                )}
                              </div>

                              {/* Scheduled Call Notes */}
                              {viewingLead.crm_data?.note && (
                                <div
                                  style={{
                                    marginTop: "20px",
                                    paddingTop: "20px",
                                    borderTop: "1px solid #e5e7eb",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      color: "#6b7280",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                      marginBottom: "8px",
                                    }}
                                  >
                                    Scheduled Call Notes
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      color: "#1f2937",
                                      lineHeight: "1.6",
                                      whiteSpace: "pre-wrap",
                                    }}
                                  >
                                    {viewingLead.crm_data.note}
                                  </div>
                                </div>
                              )}
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
                        </div>

                        {/* Prospect Fields Section */}
                        {viewingLead.crm_data?.data &&
                          typeof viewingLead.crm_data.data === "object" &&
                          Object.keys(viewingLead.crm_data.data).length > 0 && (
                            <div style={{ marginBottom: "28px" }}>
                              <CrmLeadViewSectionTitle>
                                Prospect Fields
                              </CrmLeadViewSectionTitle>
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
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "16px 24px",
                                  }}
                                >
                                  {Object.entries(viewingLead.crm_data.data)
                                    .filter(
                                      ([key]) =>
                                        key.toLowerCase() !== "name" &&
                                        key.toLowerCase() !== "phone",
                                    )
                                    .map(([key, value]: [string, any]) => (
                                      <CrmLeadPreviewGrayField
                                        key={key}
                                        label={key}
                                      >
                                        {String(value || "N/A")}
                                      </CrmLeadPreviewGrayField>
                                    ))}
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
  );
}

function CrmLeadViewModalRightPanel() {
  const {
    activeFilter,
    handleConvertLead,
    session,
    setEditLeadIdForSidebar,
    setFollowupData,
    setMeetingAttendees,
    setMeetingData,
    setShowAddFollowupModal,
    setShowAddMeetingModal,
    setShowCreateLeadModal,
    setShowLeadHistoryModal,
    setShowLeadViewModal,
    viewingLead,
  } = useLeadsPageContext();
  if (!viewingLead) {
    return null;
  }
  return (
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
                          PERMISSIONS.EDIT_CRM_LEADS,
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
                              setShowLeadViewModal(false);
                              setEditLeadIdForSidebar(viewingLead.id);
                              setShowCreateLeadModal(true);
                            }}
                            disabled={activeFilter === "lost"}
                            onMouseOver={(e) => {
                              if (activeFilter === "lost") return;
                              e.currentTarget.style.borderColor = "#2563eb";
                              e.currentTarget.style.background = "#eff6ff";
                              e.currentTarget.style.transform =
                                "translateX(4px)";
                            }}
                            onMouseOut={(e) => {
                              if (activeFilter === "lost") return;
                              e.currentTarget.style.borderColor = "#e5e7eb";
                              e.currentTarget.style.background = "white";
                              e.currentTarget.style.transform = "translateX(0)";
                            }}
                            onFocus={(e) => {
                              if (activeFilter === "lost") return;
                              e.currentTarget.style.borderColor = "#2563eb";
                              e.currentTarget.style.background = "#eff6ff";
                              e.currentTarget.style.transform =
                                "translateX(4px)";
                            }}
                            onBlur={(e) => {
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
                                background: "#2563eb",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Edit size={16} style={{ color: "white" }} />
                            </div>
                            Edit Lead
                          </button>
                        )}

                        {session?.user?.permissions?.includes(
                          PERMISSIONS.CREATE_CRM_DEALS,
                        ) && (
                          <button
                            disabled={activeFilter === "lost"}
                            style={{
                              background: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "10px",
                              padding: "12px 16px",
                              cursor:
                                activeFilter === "lost"
                                  ? "not-allowed"
                                  : "pointer",
                              transition: "all 0.2s ease",
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              fontSize: "14px",
                              fontWeight: 500,
                              color: "#1f2937",
                              opacity: activeFilter === "lost" ? 0.6 : 1,
                            }}
                            onClick={() => {
                              if (activeFilter !== "lost") {
                                setShowLeadViewModal(false);
                                handleConvertLead(viewingLead);
                              }
                            }}
                            onMouseOver={(e) => {
                              if (activeFilter !== "lost") {
                                e.currentTarget.style.borderColor = "#10b981";
                                e.currentTarget.style.background = "#f0fdf4";
                                e.currentTarget.style.transform =
                                  "translateX(4px)";
                              }
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.borderColor = "#e5e7eb";
                              e.currentTarget.style.background = "white";
                              e.currentTarget.style.transform = "translateX(0)";
                            }}
                            onFocus={(e) => {
                              if (activeFilter !== "lost") {
                                e.currentTarget.style.borderColor = "#10b981";
                                e.currentTarget.style.background = "#f0fdf4";
                                e.currentTarget.style.transform =
                                  "translateX(4px)";
                              }
                            }}
                            onBlur={(e) => {
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
                              <Handshake size={16} style={{ color: "white" }} />
                            </div>
                            Convert to Deal
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
                          onClick={() => setShowLeadHistoryModal(true)}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = "#2563eb";
                            e.currentTarget.style.background = "#eff6ff";
                            e.currentTarget.style.transform = "translateX(4px)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = "#e5e7eb";
                            e.currentTarget.style.background = "white";
                            e.currentTarget.style.transform = "translateX(0)";
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = "#2563eb";
                            e.currentTarget.style.background = "#eff6ff";
                            e.currentTarget.style.transform = "translateX(4px)";
                          }}
                          onBlur={(e) => {
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
                                "linear-gradient(135deg, #2563eb 0%, #0284c7 100%)",
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
                                  viewingLead.stage?.color || "#6c757d",
                              }}
                            >
                              {viewingLead.stage?.name || "N/A"}
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
                              Lead Score
                            </span>
                            <span
                              style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 600,
                              }}
                            >
                              {viewingLead?.lead_score == null
                                ? "N/A"
                                : `${viewingLead.lead_score}%`}
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
                              Follow-ups
                            </span>
                            <span
                              style={{
                                fontSize: "14px",
                                color: "#1f2937",
                                fontWeight: 600,
                              }}
                            >
                              {viewingLead.follow_ups?.length || 0}
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
                              {viewingLead.meetings?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Follow-ups Timeline */}
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
                          Recent Follow-ups
                        </h6>
                        {session?.user?.permissions?.includes(
                          PERMISSIONS.ADD_FOLLOW_UP_CRM_LEADS,
                        ) && (
                          <button
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#2563eb",
                              cursor: "pointer",
                              padding: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "6px",
                              transition: "all 0.2s ease",
                            }}
                            onClick={() => {
                              setFollowupData({
                                leadId: viewingLead.id,
                                leadName: viewingLead.name,
                                followUpDate: "",
                                followUpStatus: "Pending",
                                communicationChannel: "Phone Call",
                                communicationChannelOther: "",
                                notes: "",
                                userExtension:
                                  (session?.user as any)?.extension || "admin",
                              });
                              setShowAddFollowupModal(true);
                            }}
                            type="button"
                            aria-label="Add follow-up"
                            title="Add Follow-up"
                            {...crmLeadIconSoftSurfaceHoverHandlers}
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
                        {viewingLead.follow_ups &&
                        viewingLead.follow_ups.length > 0 ? (
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

                            {viewingLead.follow_ups
                              .slice(0, 5)
                              .map((followUp: any, index: number) => {
                                const isCompleted =
                                  followUp.follow_up_status === "Completed";
                                return (
                                  <div
                                    key={followUp.id || index}
                                    style={{
                                      position: "relative",
                                      paddingLeft: "28px",
                                      paddingBottom:
                                        index <
                                        Math.min(
                                          viewingLead.follow_ups.length,
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
                                          : "#2563eb",
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
                                        {followUp.communication_channel ===
                                        "Other"
                                          ? followUp.communication_channel_other
                                          : followUp.communication_channel}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "#6b7280",
                                          marginBottom: "4px",
                                        }}
                                      >
                                        {followUp.follow_up_date
                                          ? formatCrmPreviewDate(
                                              followUp.follow_up_date,
                                            ) || "N/A"
                                          : "N/A"}
                                      </div>
                                      <Badge
                                        bg={crmFollowUpTimelineStatusBadgeBg(
                                          followUp.follow_up_status,
                                        )}
                                        style={{
                                          fontSize: "10px",
                                          padding: "2px 8px",
                                        }}
                                      >
                                        {followUp.follow_up_status}
                                      </Badge>
                                    </div>
                                  </div>
                                );
                              })}

                            {viewingLead.follow_ups.length > 5 && (
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
                                    color: "#2563eb",
                                    fontWeight: 600,
                                  }}
                                >
                                  {`+${viewingLead.follow_ups.length - 5} more follow-ups`}
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
                            <History
                              size={32}
                              style={{ marginBottom: "8px", opacity: 0.5 }}
                            />
                            <div style={{ fontSize: "13px" }}>
                              No follow-ups yet
                            </div>
                            {session?.user?.permissions?.includes(
                              PERMISSIONS.ADD_FOLLOW_UP_CRM_LEADS,
                            ) && (
                              <button
                                style={{
                                  marginTop: "12px",
                                  padding: "8px 16px",
                                  background: "#2563eb",
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
                                  setFollowupData({
                                    leadId: viewingLead.id,
                                    leadName: viewingLead.name,
                                    followUpDate: "",
                                    followUpStatus: "Pending",
                                    communicationChannel: "Phone Call",
                                    communicationChannelOther: "",
                                    notes: "",
                                    userExtension:
                                      (session?.user as any)?.extension ||
                                      "admin",
                                  });
                                  setShowAddFollowupModal(true);
                                }}
                                type="button"
                                {...crmLeadPrimaryBlueCtaHoverHandlers}
                              >
                                <Plus size={14} />
                                Add Follow-up
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meetings Timeline */}
                    <div>
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
                          PERMISSIONS.ADD_MEETING_CRM_LEADS,
                        ) && (
                          <button
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#2563eb",
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
                                leadId: viewingLead.id,
                                leadName: viewingLead.name,
                                meetingName: "",
                                meetingType: "Online",
                                meetingDate: "",
                                meetingTime: "",
                                meetingOutcome: "Scheduled",
                                extensions: [],
                              });
                              setMeetingAttendees([]);
                              setShowAddMeetingModal(true);
                            }}
                            type="button"
                            aria-label="Schedule meeting"
                            title="Schedule Meeting"
                            {...crmLeadIconSoftSurfaceHoverHandlers}
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
                        {viewingLead.meetings &&
                        viewingLead.meetings.length > 0 ? (
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

                            {viewingLead.meetings
                              .slice(0, 5)
                              .map((meeting: any, index: number) => (
                                  <div
                                    key={meeting.id || index}
                                    style={{
                                      position: "relative",
                                      paddingLeft: "28px",
                                      paddingBottom:
                                        index <
                                        Math.min(
                                          viewingLead.meetings.length,
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
                                        background: crmMeetingTimelineDotFill(
                                          meeting.meeting_outcome,
                                        ),
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
                                            ) ||
                                            formatCrmPreviewDate(
                                              meeting.meeting_date,
                                            ) ||
                                            "N/A"
                                          : "N/A"}
                                      </div>
                                      {meeting.meeting_outcome && (
                                        <Badge
                                          bg={crmMeetingOutcomeToBadgeBg(
                                            meeting.meeting_outcome,
                                          )}
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
                                ))}

                            {viewingLead.meetings.length > 5 && (
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
                                    color: "#2563eb",
                                    fontWeight: 600,
                                  }}
                                >
                                  {`+${viewingLead.meetings.length - 5} more meetings`}
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
                              PERMISSIONS.ADD_MEETING_CRM_LEADS,
                            ) && (
                              <button
                                style={{
                                  marginTop: "12px",
                                  padding: "8px 16px",
                                  background: "#2563eb",
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
                                    leadId: viewingLead.id,
                                    leadName: viewingLead.name,
                                    meetingName: "",
                                    meetingType: "Online",
                                    meetingDate: "",
                                    meetingTime: "",
                                    meetingOutcome: "Scheduled",
                                    extensions: [],
                                  });
                                  setMeetingAttendees([]);
                                  setShowAddMeetingModal(true);
                                }}
                                type="button"
                                {...crmLeadPrimaryBlueCtaHoverHandlers}
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
  );
}

export function CrmLeadsViewFragment01() {
  useLeadsPageContext();
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .leads-table-wrapper {
          width: 100%;
          overflow: hidden;
        }
        .leads-table-wrapper .table-responsive {
          width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
        }
        .leads-table-wrapper .table-responsive table {
          width: 100%;
          table-layout: auto;
          margin-bottom: 0;
        }
        .leads-table-wrapper .table-responsive table th,
        .leads-table-wrapper .table-responsive table td {
          padding: 12px 16px;
          vertical-align: middle;
        }
        .leads-table-wrapper .table-responsive table td:last-child,
        .leads-table-wrapper .table-responsive table th:last-child {
          max-width: none;
        }
        .leads-table-wrapper .table-responsive table td[style*="width"],
        .leads-table-wrapper .table-responsive table th[style*="width"] {
          max-width: none;
        }
        .timeline-line {
          position: relative;
          height: 2px;
          background: #e9ecef;
          margin-top: 10px;
        }
        .timeline-line::after {
          content: "";
          position: absolute;
          top: -8px;
          left: 0;
          width: 2px;
          height: 18px;
          background: #e9ecef;
        }
        .timeline-item:last-child .timeline-line {
          display: none;
        }
        .generic-table-row.clickable {
          cursor: pointer;
        }
        
        
        /* Page layout for full height */
        .leads-page-container {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 100px);
          overflow: hidden;
        }
        
        .leads-content-area {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .leads-scrollable-content {
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
        subTitle="Leads"
      />

    </>
  );
}

export function CrmLeadsViewFragment02() {
  const {
    activeFilter,
    analyticsData,
    campaigns,
    contactEmail,
    contactPhone,
    extensions,
    fetchLeads,
    filterBusinessTypes,
    filterCounts,
    filteredLeads,
    getNameByExtension,
    handleCallClick,
    handleCloseLeadSidebar,
    handleDeleteFollowUp,
    handleDeleteLead,
    handleEditLead,
    handleFilterChange,
    handleFiltersChange,
    handleFirstColumnClick,
    handleHideLeadSidebarKeepPersistence,
    handleNoteCreate,
    handlePlayCallRecording,
    handlePreviewClick,
    handleViewLead,
    sidebarLogActivityModals,
    showRecordingPlayerModal,
    selectedRecording,
    handleCloseRecordingPlayerModal,
    leadFollowUps,
    leadsActions,
    leadsColumns,
    leadsFilters,
    leadsPagination,
    leadsSearch,
    leadsStatsCards,
    leadsToolbarConfig,
    leadsViewMode,
    loading,
    router,
    selectedLead,
    selectedLeadsColumns,
    session,
    setActiveFilter,
    setConvertingLeadId,
    setCurrentFilters,
    setFollowUpIdToEdit,
    setFollowupData,
    setLeadsFilters,
    setLeadsPagination,
    setLeadsSearch,
    setRefreshKey,
    setSelectedLeadsColumns,
    setShowAddFollowupModal,
    setShowConvertToDealModal,
    setShowLeadHistoryModal,
    setShowLeadSidebar,
    showAdvancedFilters,
    showFilterBar,
    showLeadSidebar,
    showLeadsAnalytics,
    stages,
    summaryTiles,
    totalLeads,
    uniqueSources
  } = useLeadsPageContext();

  const leadsQuickFilters = useMemo(
    () => [
      {
        id: "all",
        label: "All Leads",
        count: filterCounts.all,
        color: "#0d6efd",
        icon: <Users size={16} />,
      },
      ...stages.slice(0, 5).map((stage: any) => ({
        id: stage.id.toString(),
        label: stage.name,
        count: filterCounts[stage.id] || 0,
        color: stage.color || "#6c757d",
        icon: <Layers size={16} />,
      })),
      {
        id: "lost",
        label: "Lost",
        count: filterCounts.lost || 0,
        color: "#fd7e14",
        icon: <X size={16} />,
      },
      {
        id: "deleted",
        label: "Deleted",
        count: filterCounts.deleted || 0,
        color: "#dc3545",
        icon: <Trash2 size={16} />,
      },
    ],
    [filterCounts, stages],
  );

  return (
    <>
      {/* Main flex container for content and sidebar */}
      <div
        style={{
          display: "flex",
          gap: "0",
          height: "calc(100vh)",
          overflow: "hidden",
        }}
      >
        {/* Main content area */}
        <div className="leads-scrollable-content" style={{ flex: 1 }}>
          {/* Analytics Section - Collapsible */}
          {showLeadsAnalytics && (
            <CrmLeadsAnalyticsSection
              analyticsData={analyticsData}
              summaryTiles={summaryTiles}
            />
          )}

          <div className="container-fluid">
            {/* Filter Bar */}
            {showFilterBar && (
              <FilterBar
                quickFilters={leadsQuickFilters}
                activeFilter={activeFilter}
                onFilterChange={handleFilterChange}
              />
            )}

            {/* Advanced Filters */}
            {showAdvancedFilters &&
              session?.user?.permissions?.includes(PERMISSIONS.VIEW_CRM_LEADS) && (
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <Row className="g-3 align-items-end">
                      <Col md={4}>
                        <Form.Label className="small fw-bold mb-2">
                          Owner
                        </Form.Label>
                        <Select
                          options={extensions.map((ext: any) => ({
                            value: ext.id || ext.extension,
                            label:
                              ext.display_name ||
                              ext.name ||
                              ext.id ||
                              ext.extension,
                          }))}
                          value={
                            leadsFilters.assignedTo
                              ? (() => {
                                  const assignedToId = leadsFilters.assignedTo;
                                  const ext = extensions.find(
                                    (e: any) =>
                                      (e.id || e.extension) === assignedToId,
                                  );
                                  return ext
                                    ? {
                                        value: assignedToId,
                                        label:
                                          ext.display_name ||
                                          ext.name ||
                                          assignedToId,
                                      }
                                    : {
                                        value: assignedToId,
                                        label: assignedToId,
                                      };
                                })()
                              : null
                          }
                          onChange={(selected) => {
                            const assignedToValue =
                              getCrmLeadsStringSelectValue(selected) ?? null;
                            setLeadsFilters((prev) => ({
                              ...prev,
                              assignedTo: assignedToValue,
                            }));
                            // Reset to all when assigned filter changes
                            setActiveFilter("all");
                          }}
                          placeholder="Select user..."
                          styles={customSelectStyles}
                          isClearable
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold mb-2">
                          Stages
                        </Form.Label>
                        <Select
                          options={stages.map((s) => ({
                            value: s.id.toString(),
                            label: s.name,
                          }))}
                          value={
                            leadsFilters.stage
                              ? (() => {
                                  const stageId = leadsFilters.stage;
                                  const stage = stages.find(
                                    (st: any) => st.id.toString() === stageId,
                                  );
                                  return stage
                                    ? { value: stageId, label: stage.name }
                                    : { value: stageId, label: stageId };
                                })()
                              : null
                          }
                          onChange={(selected) => {
                            const stageValue =
                              getCrmLeadsStringSelectValue(selected) ?? null;
                            setLeadsFilters((prev) => ({
                              ...prev,
                              stage: stageValue,
                            }));
                            // Update activeFilter to match selected stage
                            if (stageValue) {
                              setActiveFilter(stageValue);
                            } else {
                              setActiveFilter("all");
                            }
                          }}
                          placeholder="Select stage..."
                          styles={customSelectStyles}
                          isClearable
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold mb-2">
                          Business Type
                        </Form.Label>
                        <Select
                          options={filterBusinessTypes.map(
                            (bt: BusinessTypeData) => ({
                              value: bt.id.toString(),
                              label: bt.name,
                            }),
                          )}
                          value={
                            leadsFilters.businessType
                              ? (() => {
                                  const btId = leadsFilters.businessType;
                                  const bt = filterBusinessTypes.find(
                                    (b: BusinessTypeData) =>
                                      b.id.toString() === btId,
                                  );
                                  return bt
                                    ? { value: btId, label: bt.name }
                                    : { value: btId, label: btId };
                                })()
                              : null
                          }
                          onChange={(selected) => {
                            const businessTypeValue =
                              getCrmLeadsStringSelectValue(selected) ?? null;
                            setLeadsFilters((prev) => ({
                              ...prev,
                              businessType: businessTypeValue,
                            }));
                          }}
                          placeholder="Select business type..."
                          styles={customSelectStyles}
                          isClearable
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold mb-2">
                          Source
                        </Form.Label>
                        <CreatableSelect
                          options={uniqueSources}
                          value={
                            leadsFilters.source
                              ? {
                                  value: leadsFilters.source,
                                  label: leadsFilters.source,
                                }
                              : null
                          }
                          onChange={(selected) => {
                            const sourceValue =
                              getCrmLeadsStringSelectValue(selected) ?? null;
                            setLeadsFilters((prev) => ({
                              ...prev,
                              source: sourceValue,
                            }));
                          }}
                          placeholder="Select or create source..."
                          styles={customSelectStyles}
                          isClearable
                          formatCreateLabel={(inputValue) =>
                            `Create "${inputValue}"`
                          }
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold mb-2">
                          Lead Potential
                        </Form.Label>
                        <Select
                          options={[
                            { value: "Hot", label: "Hot" },
                            { value: "Warm", label: "Warm" },
                            { value: "Cold", label: "Cold" },
                          ]}
                          value={
                            leadsFilters.leadPotential
                              ? {
                                  value: leadsFilters.leadPotential,
                                  label: leadsFilters.leadPotential,
                                }
                              : null
                          }
                          onChange={(selected) => {
                            const leadPotentialValue =
                              getCrmLeadsStringSelectValue(selected) ?? null;
                            setLeadsFilters((prev) => ({
                              ...prev,
                              leadPotential: leadPotentialValue,
                            }));
                          }}
                          placeholder="Select lead potential..."
                          styles={customSelectStyles}
                          isClearable
                        />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold mb-2">
                          Campaign
                        </Form.Label>
                        <Select
                          options={campaigns.map((campaign: any) => ({
                            value: campaign.id.toString(),
                            label: campaign.name,
                          }))}
                          value={
                            leadsFilters.campaign
                              ? (() => {
                                  const campaignId = leadsFilters.campaign;
                                  const campaign = campaigns.find(
                                    (c: any) => c.id.toString() === campaignId,
                                  );
                                  return campaign
                                    ? {
                                        value: campaignId,
                                        label: campaign.name,
                                      }
                                    : { value: campaignId, label: campaignId };
                                })()
                              : null
                          }
                          onChange={(selected) => {
                            const campaignValue =
                              getCrmLeadsStringSelectValue(selected) ?? null;
                            setLeadsFilters((prev) => ({
                              ...prev,
                              campaign: campaignValue,
                            }));
                          }}
                          placeholder="Select campaign..."
                          styles={customSelectStyles}
                          isClearable
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Label className="small fw-bold mb-2">
                          Lead Score Range
                        </Form.Label>
                        <div className="d-flex gap-2 align-items-center">
                          <Form.Control
                            type="number"
                            min="0"
                            value={leadsFilters.leadScoreMin || ""}
                            onChange={(e) => {
                              const minValue = e.target.value || null;
                              setLeadsFilters((prev) => ({
                                ...prev,
                                leadScoreMin: minValue,
                              }));
                            }}
                            placeholder="Min"
                            style={{ flex: 1 }}
                          />
                          <span className="text-muted">to</span>
                          <Form.Control
                            type="number"
                            min="0"
                            value={leadsFilters.leadScoreMax || ""}
                            onChange={(e) => {
                              const maxValue = e.target.value || null;
                              setLeadsFilters((prev) => ({
                                ...prev,
                                leadScoreMax: maxValue,
                              }));
                            }}
                            placeholder="Max"
                            style={{ flex: 1 }}
                          />
                        </div>
                      </Col>
                      <Col md={6}>
                        <Form.Label className="small fw-bold mb-2">
                          Date Range
                        </Form.Label>
                        <div className="d-flex gap-2 align-items-center">
                          <Form.Control
                            type="date"
                            value={leadsFilters.dateFrom || ""}
                            onChange={(e) => {
                              const dateFromValue = e.target.value || null;
                              setLeadsFilters((prev) => ({
                                ...prev,
                                dateFrom: dateFromValue,
                              }));
                            }}
                            placeholder="From"
                            style={{ flex: 1 }}
                          />
                          <span className="text-muted">to</span>
                          <Form.Control
                            type="date"
                            value={leadsFilters.dateTo || ""}
                            onChange={(e) => {
                              const dateToValue = e.target.value || null;
                              setLeadsFilters((prev) => ({
                                ...prev,
                                dateTo: dateToValue,
                              }));
                            }}
                            placeholder="To"
                            style={{ flex: 1 }}
                          />
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-secondary"
                            className="d-flex align-items-center justify-content-center"
                            onClick={() => {
                              // Map leadsFilters to the format expected by handleFiltersChange
                              const filtersToApply: Record<string, any> = {};

                              if (leadsSearch) {
                                filtersToApply.search = leadsSearch;
                              }
                              if (leadsFilters.assignedTo) {
                                filtersToApply.user_extension_filter =
                                  leadsFilters.assignedTo;
                              }
                              if (leadsFilters.stage) {
                                filtersToApply.stage_id = leadsFilters.stage;
                              }
                              if (leadsFilters.businessType) {
                                filtersToApply.business_type_id =
                                  leadsFilters.businessType;
                              }
                              if (leadsFilters.source) {
                                filtersToApply.source = leadsFilters.source;
                              }
                              if (leadsFilters.leadPotential) {
                                filtersToApply.lead_potential =
                                  leadsFilters.leadPotential;
                              }
                              if (leadsFilters.campaign) {
                                filtersToApply.campaign_id =
                                  leadsFilters.campaign;
                              }
                              if (leadsFilters.lostReason) {
                                filtersToApply.lost_reason_id =
                                  leadsFilters.lostReason;
                              }
                              if (leadsFilters.leadScoreMin) {
                                filtersToApply.lead_score_min =
                                  leadsFilters.leadScoreMin;
                              }
                              if (leadsFilters.leadScoreMax) {
                                filtersToApply.lead_score_max =
                                  leadsFilters.leadScoreMax;
                              }
                              if (leadsFilters.dateFrom) {
                                filtersToApply.date_from =
                                  leadsFilters.dateFrom;
                              }
                              if (leadsFilters.dateTo) {
                                filtersToApply.date_to = leadsFilters.dateTo;
                              }

                              handleFiltersChange(filtersToApply);
                              setLeadsPagination({
                                ...leadsPagination,
                                currentPage: 1,
                              });
                              setRefreshKey((prev) => prev + 1);
                            }}
                          >
                            Submit Filters
                          </Button>
                          <Button
                            variant="outline-secondary"
                            className="d-flex align-items-center justify-content-center"
                            onClick={() => {
                              setLeadsSearch("");
                              setLeadsFilters({
                                assignedTo: null,
                                stage: null,
                                businessType: null,
                                source: null,
                                leadPotential: null,
                                campaign: null,
                                lostReason: null,
                                leadScoreMin: null,
                                leadScoreMax: null,
                                dateFrom: null,
                                dateTo: null,
                              });
                              handleFiltersChange({});
                              setCurrentFilters({});
                              setActiveFilter("all");
                              setLeadsPagination({
                                ...leadsPagination,
                                currentPage: 1,
                              });
                              setRefreshKey((prev) => prev + 1);
                            }}
                          >
                            Reset Filters
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

            {/* Leads Table */}
            <div
              className="leads-table-wrapper"
              style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <GenericTable
                data={filteredLeads}
                columns={leadsColumns.filter((c) =>
                  selectedLeadsColumns.includes(c.key) ||
                  (activeFilter === "lost" && c.key === "stage.name"),
                )}
                actions={leadsActions}
                showActions={false}
                pagination={{
                  currentPage: leadsPagination.currentPage,
                  rowsPerPage: leadsPagination.rowsPerPage,
                  totalRows: totalLeads,
                  pageSizeOptions: [10, 15, 25, 50, 100],
                }}
                onPaginationChange={(page, rowsPerPage) => {
                  setLeadsPagination({
                    ...leadsPagination,
                    currentPage: page,
                    rowsPerPage,
                  });
                }}
                sortable={true}
                defaultSortBy={leadsPagination.sortBy}
                defaultSortOrder={leadsPagination.sortOrder}
                onSort={(column, direction) => {
                  setLeadsPagination({
                    ...leadsPagination,
                    sortBy: column,
                    sortOrder: direction,
                  });
                }}
                // customizableColumns={true}
                defaultSelectedColumns={[
                  "name",
                  "company",
                  "email",
                  "phone",
                  "stage",
                  "leadPotential",
                  "followUps",
                  "assignedUser",
                  "created",
                ]}
                columnStorageKey="leadsSelectedColumns"
                onColumnChange={(cols) => setSelectedLeadsColumns(cols)}
                onPreviewClick={(lead) => handlePreviewClick(lead)}
                onFirstColumnClick={(lead) => handleFirstColumnClick(lead)}
                onRowDoubleClick={(lead) => {
                  if (
                    session?.user?.permissions?.includes(
                      PERMISSIONS.VIEW_CRM_LEADS,
                    )
                  ) {
                    handleViewLead(lead.rawData?.id || lead.id);
                  }
                }}
                loading={loading}
                emptyMessage="No leads found matching your criteria"
                loadingMessage="Loading leads..."
                hover={true}
                uniqueKey="id"
                // Fixed height mode
                fixedHeight={true}
                maxHeight="calc(100vh - 380px)"
                // Toolbar
                showToolbar={true}
                toolbar={leadsToolbarConfig}
                statsCards={leadsStatsCards}
                customBody={
                  leadsViewMode === "board" ? (
                    <KanbanBoard
                      columns={leadsToKanbanColumns(filteredLeads, stages)}
                      onCardClick={(lead) =>
                        handleViewLead(lead.raw?.id ?? lead.id)
                      }
                      onCardMove={(leadId, fromCol, toCol) => {
                        const lead = filteredLeads.find(
                          (l) => l.id === Number(leadId) || l.id === leadId
                        );
                        if (lead) {
                          updateLead(Number(lead.id), {
                            stage_id: Number(toCol),
                          })
                            .then(() => {
                              fetchLeads(
                                leadsPagination.currentPage,
                                leadsPagination.rowsPerPage
                              );
                            })
                            .catch((err) => {
                              console.error("Failed to update lead stage:", err);
                              toast.error("Failed to update lead stage");
                            });
                        }
                      }}
                      searchValue={leadsSearch}
                    />
                  ) : undefined
                }
              />
            </div>
          </div>
        </div>

        {/* Lead Details Sidebar */}
        {showLeadSidebar && (
          <GenericSidebar
            isOpen={showLeadSidebar}
            onClose={handleCloseLeadSidebar}
            title={selectedLead?.name || "Lead Details"}
            subtitle={selectedLead?.phone || selectedLead?.rawData?.phone || ""}
            email={
              selectedLead?.email ||
              selectedLead?.rawData?.email ||
              contactEmail
            }
            phone={
              selectedLead?.phone ||
              selectedLead?.rawData?.phone ||
              contactPhone
            }
            avatar={{
              initials: getInitials(selectedLead?.name || "NA"),
              name: selectedLead?.name || "NA",
              gradient: getRandomColor(selectedLead?.name || ""),
            }}
            recordType="lead"
            recordId={
              selectedLead?.id ?? selectedLead?.rawData?.id ?? undefined
            }
            senderName={session?.user?.name || ""}
            senderEmail={session?.user?.email || ""}
            resolveUserLabel={getNameByExtension}
            onNoteCreate={handleNoteCreate}
            onPlayCallRecording={handlePlayCallRecording}
            onLogCall={sidebarLogActivityModals.openLogCall}
            onLogEmail={sidebarLogActivityModals.openLogEmail}
            onLogSms={sidebarLogActivityModals.openLogSms}
            onLogWhatsApp={sidebarLogActivityModals.openLogWhatsApp}
            onLogMeeting={sidebarLogActivityModals.openLogMeeting}
            crmSummary={selectedLead?.rawData?.crm_summary ?? selectedLead?.crm_summary ?? undefined}
            record={{
              id: selectedLead?.id || selectedLead?.rawData?.id,
              type: RECORD_TYPES.LEAD,
            }}
            recordLink={{
              label: "View record",
              onClick: () => {
                const leadId = selectedLead?.id || selectedLead?.rawData?.id;
                if (leadId) {
                  handleHideLeadSidebarKeepPersistence();
                  router.push(`/crm/detailspage?type=lead&id=${leadId}`);
                }
              },
            }}
            actionsDropdown={{
              label: "Actions",
              items: [
                {
                  label: "Edit Lead",
                  onClick: () => {
                    const leadId =
                      selectedLead?.id || selectedLead?.rawData?.id;
                    if (leadId) {
                      setShowLeadSidebar(false);
                      handleEditLead(leadId);
                    }
                  },
                },
                {
                  label: "Convert to Deal",
                  onClick: () => {
                    const leadId = selectedLead?.id ?? selectedLead?.rawData?.id;
                    if (leadId) {
                      setShowLeadSidebar(false);
                      setConvertingLeadId(Number(leadId));
                      setShowConvertToDealModal(true);
                    }
                  },
                },
                {
                  label: "View History",
                  onClick: () => {
                    setShowLeadSidebar(false);
                    const leadId =
                      selectedLead?.id || selectedLead?.rawData?.id;
                    if (leadId) {
                      handleViewLead(leadId);
                      setShowLeadHistoryModal(true);
                    }
                  },
                },
                {
                  label: "Delete",
                  onClick: () => {
                    const leadId =
                      selectedLead?.id || selectedLead?.rawData?.id;
                    if (leadId) {
                      setShowLeadSidebar(false);
                      handleDeleteLead(leadId, selectedLead?.name);
                    }
                  },
                },
              ],
            }}
            sections={[
              {
                id: "about-lead",
                title: "About this lead",
                icon: Target,
                collapsible: true,
                defaultExpanded: true,
                actions: [
                  {
                    label: "Edit all properties",
                    onClick: () => {
                      const leadId =
                        selectedLead?.id || selectedLead?.rawData?.id;
                      if (leadId) {
                        setShowLeadSidebar(false);
                        handleEditLead(leadId);
                      }
                    },
                  },
                ],
                fields: [
                  {
                    label: "Name",
                    value: selectedLead?.name || "N/A",
                    copyable: true,
                  },
                  {
                    label: "Phone",
                    value: (() => {
                      const directPhone =
                        selectedLead?.phone || selectedLead?.rawData?.phone;
                      if (directPhone) return directPhone;
                      const contactPhoneNumber = selectedLead?.contact_phone;
                      if (!contactPhoneNumber) return "N/A";
                      const countryCode =
                        selectedLead?.contact_phone_country_code;
                      return countryCode
                        ? `${countryCode} ${contactPhoneNumber}`
                        : String(contactPhoneNumber);
                    })(),
                    type: "phone",
                    copyable: true,
                    externalLink: (() => {
                      const phoneForLink =
                        selectedLead?.phone ||
                        selectedLead?.rawData?.phone ||
                        selectedLead?.contact_phone;
                      return phoneForLink ? `tel:${phoneForLink}` : undefined;
                    })(),
                  },
                  {
                    label: "Email",
                    value:
                      selectedLead?.email ||
                      selectedLead?.rawData?.email ||
                      "N/A",
                    type: "email",
                    copyable: true,
                    externalLink:
                      selectedLead?.email || selectedLead?.rawData?.email
                        ? `mailto:${selectedLead?.email || selectedLead?.rawData?.email}`
                        : undefined,
                    show: !!(
                      selectedLead?.email || selectedLead?.rawData?.email
                    ),
                  },
                  {
                    label: "Description",
                    value: selectedLead?.description || "N/A",
                    show: !!selectedLead?.description,
                  },
                  {
                    label: "Company",
                    value:
                      selectedLead?.company_name ||
                      selectedLead?.company ||
                      "N/A",
                    copyable: true,
                    show: !!(
                      selectedLead?.company_name || selectedLead?.company
                    ),
                  },
                  {
                    label: "Stage",
                    value:
                      selectedLead?.is_lost || selectedLead?.isLost
                        ? "Lost"
                        : selectedLead?.stage?.name ||
                          selectedLead?.stage ||
                          "N/A",
                    type: "badge",
                    badgeVariant:
                      selectedLead?.is_lost || selectedLead?.isLost
                        ? "danger"
                        : "primary",
                  },
                  {
                    label: "Lead Potential",
                    value:
                      selectedLead?.lead_potential ||
                      selectedLead?.leadPotential ||
                      "N/A",
                    type: "badge",
                    badgeVariant: crmSidebarLeadPotentialBadgeVariant(
                      selectedLead?.lead_potential,
                      selectedLead?.leadPotential,
                    ),
                  },
                  {
                    label: "Owner",
                    value:
                      getNameByExtension(selectedLead?.user_extension) ||                     
                      "Unassigned",
                    hasDetails: false,
                    onDetailsClick: () => {},
                  },
                  {
                    label: "Lead Score",
                    value: formatCrmSidebarLeadScoreValue(
                      selectedLead?.stage?.score,
                      selectedLead?.lead_score,
                    ),
                    show: !!(
                      selectedLead?.stage?.score || selectedLead?.lead_score
                    ),
                  },
                  {
                    label: "Source",
                    value: selectedLead?.source || "N/A",
                    show: !!selectedLead?.source,
                  },
                  {
                    label: "Created Date",
                    value: (() => {
                      const raw =
                        selectedLead?.created_at || selectedLead?.created;
                      if (!raw) return "N/A";
                      return formatCrmPreviewDate(raw) || "N/A";
                    })(),
                    type: "date",
                  },
                  {
                    label: "Last Updated",
                    value: (() => {
                      const raw =
                        selectedLead?.updated_at ||
                        selectedLead?.last_activity_at;
                      if (!raw) return "N/A";
                      return formatCrmPreviewDate(raw) || "N/A";
                    })(),
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
                count: Array.isArray(selectedLead?.audit_trail)
                  ? selectedLead.audit_trail.length
                  : 0,
                emptyState: {
                  icon: History,
                  message: "No recent activities for this lead.",
                  action: {
                    label: "Log activity",
                    onClick: () => {
                      const leadId =
                        selectedLead?.id || selectedLead?.rawData?.id;
                      if (!leadId) return;
                      handleHideLeadSidebarKeepPersistence();
                      router.push(`/crm/detailspage?type=lead&id=${leadId}`);
                    },
                  },
                },
              },
              {
                id: "call-recordings",
                title: "Call Recordings",
                icon: PhoneIcon,
                collapsible: true,
                defaultExpanded: true,
                count: Array.isArray(selectedLead?.call_recordings)
                  ? selectedLead.call_recordings.length
                  : 0,
                emptyState: {
                  icon: PhoneIcon,
                  message: "No call recordings available yet.",
                  action: {
                    label: "Make a call",
                    onClick: () => {
                      const hasPhone = !!(
                        selectedLead?.phone ||
                        selectedLead?.rawData?.phone ||
                        selectedLead?.contact_persons?.[0]?.phone ||
                        selectedLead?.crm_data?.phone
                      );
                      if (!hasPhone) return;
                      handleCallClick(selectedLead);
                    },
                  },
                },
              },
              {
                id: "notes",
                title: "Notes",
                icon: FileText,
                collapsible: true,
                defaultExpanded: true,
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
                  value: leadFollowUps?.length || 0,
                  variant: "secondary",
                },
                ...(leadFollowUps?.length
                  ? {
                      customContent: (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                          }}
                        >
                          {(leadFollowUps || []).map((fu: any) => (
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
                                <span style={{ fontWeight: 600, color: "#1e293b" }}>
                                  {fu.follow_up_date
                                    ? formatCrmPreviewDate(fu.follow_up_date) ||
                                      "-"
                                    : "-"}
                                </span>
                                <span style={{ color: "#64748b", fontSize: "12px" }}>
                                  {fu.communication_channel === "Other"
                                    ? fu.communication_channel_other || "-"
                                    : fu.communication_channel ||
                                      fu.communication_channel_other ||
                                      "-"}
                                </span>
                              </div>
                              {fu.follow_up_status && (
                                <div style={{ marginBottom: "4px", color: "#475569" }}>
                                  <span style={{ color: "#94a3b8" }}>Status: </span>
                                  {fu.follow_up_status}
                                </div>
                              )}
                              {fu.notes && (
                                <div style={{ color: "#475569", lineHeight: 1.4 }}>
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
                                    const leadId =
                                      selectedLead?.id || selectedLead?.rawData?.id;
                                    if (!leadId) return;
                                    const followUpDate = fu.follow_up_date
                                      ? new Date(fu.follow_up_date)
                                          .toISOString()
                                          .split("T")[0]
                                      : "";
                                    setFollowUpIdToEdit(fu.id);
                                    setFollowupData({
                                      leadId: Number(leadId),
                                      leadName: selectedLead?.name || "",
                                      followUpDate,
                                      followUpStatus:
                                        fu.follow_up_status || "Pending",
                                      communicationChannel:
                                        fu.communication_channel || "Phone Call",
                                      communicationChannelOther:
                                        fu.communication_channel_other || "",
                                      notes: fu.notes || "",
                                      userExtension:
                                        (session?.user as any)?.extension || "",
                                    });
                                    setShowAddFollowupModal(true);
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
                                    const leadId =
                                      selectedLead?.id || selectedLead?.rawData?.id;
                                    if (!leadId) return;
                                    handleDeleteFollowUp(
                                      Number(leadId),
                                      fu.id,
                                      selectedLead?.name,
                                    );
                                  }}
                                >
                                  <Trash2 size={14} className="me-1" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <Button
                            variant="outline-primary"
                            size="sm"
                            style={{ alignSelf: "flex-start", marginTop: "4px" }}
                            onClick={() => {
                              const leadId =
                                selectedLead?.id || selectedLead?.rawData?.id;
                              if (!leadId) return;
                              setFollowUpIdToEdit(null);
                              setFollowupData({
                                leadId: Number(leadId),
                                leadName: selectedLead?.name || "",
                                followUpDate: "",
                                followUpStatus: "Pending",
                                communicationChannel: "Phone Call",
                                communicationChannelOther: "",
                                notes: "",
                                userExtension:
                                  (session?.user as any)?.extension || "admin",
                              });
                              setShowAddFollowupModal(true);
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
                            const leadId =
                              selectedLead?.id || selectedLead?.rawData?.id;
                            if (!leadId) return;
                            setFollowUpIdToEdit(null);
                            setFollowupData({
                              leadId: Number(leadId),
                              leadName: selectedLead?.name || "",
                              followUpDate: "",
                              followUpStatus: "Pending",
                              communicationChannel: "Phone Call",
                              communicationChannelOther: "",
                              notes: "",
                              userExtension:
                                (session?.user as any)?.extension || "admin",
                            });
                            setShowAddFollowupModal(true);
                          },
                        },
                      },
                    }),
              },
            ]}
          />
        )}
        {sidebarLogActivityModals.modals}
        <CallRecordingPlayerModal
          show={showRecordingPlayerModal}
          onHide={handleCloseRecordingPlayerModal}
          recording={selectedRecording}
        />
      </div>
    </>
  );
}

export function CrmLeadsViewFragment03() {
  const {
    confirmDeleteFollowUp,
    confirmDeleteLead,
    confirmDeleteMeeting,
    convertFormData,
    followUpToDelete,
    handleConvertSubmit,
    handleMarkLostSubmit,
    leadToDelete,
    lostFeedback,
    lostReasonId,
    lostReasons,
    meetingToDelete,
    setConvertFormData,
    setFollowUpToDelete,
    setLeadToDelete,
    setLostFeedback,
    setLostReasonId,
    setMeetingToDelete,
    setShowConvertModal,
    setShowDeleteFollowUpModal,
    setShowDeleteMeetingModal,
    setShowDeleteModal,
    setShowMarkLostModal,
    setShowSuccessfulModal,
    showConvertModal,
    showDeleteFollowUpModal,
    showDeleteMeetingModal,
    showDeleteModal,
    showMarkLostModal,
    showSuccessfulModal,
    successModalDescription,
    successModalTitle
  } = useLeadsPageContext();
  return (
    <>
      {/* Delete Lead Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setLeadToDelete(null);
        }}
        onConfirm={confirmDeleteLead}
        itemName={leadToDelete?.name}
        itemType="lead"
      />

      {/* Delete Follow-up Modal */}
      <DeleteConfirmationModal
        show={showDeleteFollowUpModal}
        onHide={() => {
          setShowDeleteFollowUpModal(false);
          setFollowUpToDelete(null);
        }}
        onConfirm={confirmDeleteFollowUp}
        itemName={
          followUpToDelete?.leadName
            ? `follow-up for ${followUpToDelete.leadName}`
            : "this follow-up"
        }
        itemType="follow-up"
      />

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

      {/* Convert Lead Modal */}
      <FormModal
        show={showConvertModal}
        onHide={() => setShowConvertModal(false)}
        title="Convert lead to opportunity"
        desc="Please fill in the details below to convert the lead to an opportunity."
        size="lg"
        formHtml={
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Opportunity Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={convertFormData.opportunity_name}
                      onChange={(e) =>
                        setConvertFormData({
                          ...convertFormData,
                          opportunity_name: e.target.value,
                        })
                      }
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Value</Form.Label>
                    <Form.Control
                      type="number"
                      value={convertFormData.value}
                      onChange={(e) =>
                        setConvertFormData({
                          ...convertFormData,
                          value: e.target.value,
                        })
                      }
                      placeholder="0.00"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Probability (%)</Form.Label>
                    <Form.Control
                      type="number"
                      value={convertFormData.probability}
                      onChange={(e) =>
                        setConvertFormData({
                          ...convertFormData,
                          probability: e.target.value,
                        })
                      }
                      min="0"
                      max="100"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Expected Close Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={convertFormData.expected_close_date}
                      onChange={(e) =>
                        setConvertFormData({
                          ...convertFormData,
                          expected_close_date: e.target.value,
                        })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={convertFormData.description}
                  onChange={(e) =>
                    setConvertFormData({
                      ...convertFormData,
                      description: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Form>
        }
        onSubmit={handleConvertSubmit}
        onCancel={() => setShowConvertModal(false)}
        submitButtonText="Convert to Opportunity"
        cancelButtonText="Cancel"
      />

      <FormModal
        show={showMarkLostModal}
        onHide={() => setShowMarkLostModal(false)}
        title="Mark lead as lost"
        desc="Please fill in the details below to mark the lead as lost."
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
                placeholder="Please provide additional feedback about why this lead was lost..."
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

      <SuccessfulModal
        show={showSuccessfulModal}
        onHide={() => setShowSuccessfulModal(false)}
        title={successModalTitle}
        description={successModalDescription}
      />

    </>
  );
}

export function CrmLeadsViewFragment04() {
  const {
    activeTab,
    loadingLead,
    setActiveTab,
    setShowLeadViewModal,
    showLeadViewModal,
    viewingLead,
  } = useLeadsPageContext();
  return (
    <>
      {/* Lead View Modal */}
      {viewingLead && (
        <Modal
          show={showLeadViewModal}
          onHide={() => setShowLeadViewModal(false)}
          size="xl"
          centered
          className="lead-view-modal"
        >
          {/* Modern Header with Gradient */}
          <div
            style={{
              background: "#fff",
              color: "black",
              padding: "24px 32px",
              position: "relative",
              borderTopLeftRadius: "12px",
              borderTopRightRadius: "12px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              borderBottom: "1px solid #ccc",
            }}
          >
            <CrmModalCloseButton onClick={() => setShowLeadViewModal(false)} ariaLabel="Close lead view" />

            {/* Header Content */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <CrmModalAvatar name={viewingLead.name} fallback="L" background="#2563eb" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    fontSize: "26px",
                    textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {viewingLead.name}
                </h2>
                <div
                  style={{
                    marginTop: "6px",
                    opacity: 0.95,
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                    color: "#000",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Target size={14} />
                    {viewingLead.stage?.name || "No stage"}
                  </span>
                  <span>•</span>
                  <span>
                    Created{" "}
                    {viewingLead.created_at
                      ? formatCrmPreviewDate(viewingLead.created_at) || "N/A"
                      : "N/A"}
                  </span>
                  {viewingLead.is_lost && (
                    <>
                      <span>•</span>
                      <Badge
                        bg="danger"
                        style={{
                          fontWeight: 500,
                        }}
                      >
                        Lost
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Modal.Body
            style={{
              padding: 0,
              maxHeight: "calc(90vh - 200px)",
              overflowY: "auto",
            }}
          >
            {loadingLead ? (
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
                  Loading lead details...
                </p>
              </div>
            ) : (
              <>
                <style>{`
            .lead-detail-filter-buttons {
              display: flex;
              flex-direction: row;
              align-items: center;
              gap: 12px;
              flex-wrap: wrap;
              margin-bottom: 0;
              padding: 0;
              width: 100%;
            }

            .lead-detail-filter-button {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 10px 20px;
              border-radius: 8px;
              border: 1px solid;
              font-weight: 500;
              font-size: 14px;
              cursor: pointer;
              transition: all 0.2s ease;
              background: white;
              white-space: nowrap;
            }

            .lead-detail-filter-button:hover {
              transform: translateY(-1px);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .lead-detail-filter-button.active {
              color: white;
            }

            .lead-detail-filter-button.active .filter-icon {
              color: white;
            }

            .lead-detail-filter-button:not(.active) .filter-icon {
              color: inherit;
            }

            .filter-icon {
              width: 18px;
              height: 18px;
              flex-shrink: 0;
            }
          `}</style>

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
                    <div className="lead-detail-filter-buttons mb-4">
                      <CrmLeadViewDetailTabButton
                        active={activeTab === "general-info"}
                        onClick={() => setActiveTab("general-info")}
                        icon={<Target className="filter-icon" size={18} />}
                        label="General Information"
                      />
                      <CrmLeadViewDetailTabButton
                        active={activeTab === "campaign-prospect"}
                        onClick={() => setActiveTab("campaign-prospect")}
                        icon={<FileText className="filter-icon" size={18} />}
                        label="Campaign & Prospect"
                      />
                    </div>

                    {/* Tab Content */}
                    {activeTab === "general-info" && (
                      <CrmLeadViewModalGeneralInfoTab />
                    )}
                    {activeTab === "campaign-prospect" && (
                      <CrmLeadViewModalCampaignProspectTab />
                    )}
                  </div>

                  {/* Right Panel - Quick Actions & Timeline */}
                  <CrmLeadViewModalRightPanel />
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
              Lead ID: <strong>#{viewingLead.id}</strong>
            </div>
            <Button
              variant="outline-secondary"
              onClick={() => setShowLeadViewModal(false)}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "14px",
                border: "2px solid #e5e7eb",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#2563eb";
                e.currentTarget.style.color = "#2563eb";
                e.currentTarget.style.background = "#eff6ff";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.color = "#6c757d";
                e.currentTarget.style.background = "white";
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#2563eb";
                e.currentTarget.style.color = "#2563eb";
                e.currentTarget.style.background = "#eff6ff";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.color = "#6c757d";
                e.currentTarget.style.background = "white";
              }}
            >
              Close
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function CrmLeadsViewFragment05() {
  const {
    extensions,
    setShowLeadHistoryModal,
    showLeadHistoryModal,
    viewingLead
  } = useLeadsPageContext();
  return (
    <>
      {/* Lead History Modal */}
      {viewingLead && (
        <Modal
          show={showLeadHistoryModal}
          onHide={() => {
            setShowLeadHistoryModal(false);
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
              type="button"
              aria-label="Close lead history"
              onClick={() => {
                setShowLeadHistoryModal(false);
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
              onFocus={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.3)";
                e.currentTarget.style.transform = "rotate(90deg)";
              }}
              onBlur={(e) => {
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
                  Complete Lead History
                </h3>
                <p
                  style={{
                    margin: "8px 0 0 0",
                    opacity: 0.9,
                    fontSize: "14px",
                  }}
                >
                  {viewingLead.name} - All Activities & Changes
                </p>
              </div>
            </div>
          </div>

          <Modal.Body
            style={{ padding: "30px", maxHeight: "70vh", overflowY: "auto" }}
          >
            {/* Lead Summary Card */}
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
                      Lead Name
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 600 }}>
                      {viewingLead.name}
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
                        backgroundColor: viewingLead.stage?.color || "#6c757d",
                      }}
                    >
                      {viewingLead.stage?.name || "Not assigned"}
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
                      Status
                    </div>
                    <Badge
                      bg={crmLeadOverviewStatusBadgeVariant(
                        Boolean(viewingLead.is_lost),
                        viewingLead.status,
                      )}
                      style={{ fontSize: "13px", padding: "6px 12px" }}
                    >
                      {viewingLead.is_lost
                        ? "Lost"
                        : viewingLead.status || "N/A"}
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
                      Assigned To
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 600 }}>
                      {resolveCrmExtensionDisplayName(
                        extensions,
                        viewingLead?.user_extension,
                      )}
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Timeline */}
            {viewingLead.audit_trail &&
            Array.isArray(viewingLead.audit_trail) &&
            viewingLead.audit_trail.length > 0 ? (
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

                {viewingLead.audit_trail.map((audit: any, index: number) => {
                  // Transform audit trail data to history format
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
                    }
                    return {
                      category: "Update",
                      icon: <FileText size={16} />,
                      color: "#6c757d",
                    };
                  };

                  const { category, icon, color } = getCategoryAndIcon(
                    audit.event,
                    audit.changes,
                  );
                  const performedBy = resolveCrmExtensionDisplayName(
                    extensions,
                    audit?.user_extension,
                    "System",
                  );
                  const timestamp =
                    audit.created_at_human ||
                    new Date(audit.created_at).toLocaleString();

                  // Build metadata from changes
                  const metadata: Record<string, any> = {};
                  if (audit.changes && Object.keys(audit.changes).length > 0) {
                    Object.entries(audit.changes).forEach(
                      ([key, change]: [string, any]) => {
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
                      key={String(audit.id ?? `audit-${index}`)}
                      style={{
                        position: "relative",
                        paddingLeft: "60px",
                        paddingBottom: "30px",
                        opacity: 0,
                        animation: `slideIn 0.4s ease forwards ${
                          index * 0.05
                        }s`,
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
                      <Card className="border-0 shadow-sm crm-lead-history-audit-card">
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
                                    {crmLeadHistoryAuditEventLabel(
                                      audit.event,
                                    )}
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
                                  {audit.description || "Record updated"}
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
                <p>No history available for this lead</p>
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
              .crm-lead-history-audit-card {
                transition: all 0.3s;
              }
              .crm-lead-history-audit-card:hover {
                transform: translateX(5px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
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
                <strong>{viewingLead.audit_trail?.length || 0}</strong>{" "}
                activities recorded
              </div>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setShowLeadHistoryModal(false);
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
      )}
    </>
  );
}

export function CrmLeadsViewFragment06() {
  const {
    followUpIdToEdit,
    followupData,
    getTodayDate,
    submitFollowUpFromModal,
    loadingFollowUp,
    setFollowUpIdToEdit,
    setFollowupData,
    setShowAddFollowupModal,
    showAddFollowupModal
  } = useLeadsPageContext();
  return (
    <>
      {/* Add/Edit Follow-up Modal */}
      <Modal
        show={showAddFollowupModal}
        onHide={() => {
          setShowAddFollowupModal(false);
          setFollowUpIdToEdit(null);
          setFollowupData({
            leadId: null,
            leadName: "",
            followUpDate: "",
            followUpStatus: "Pending",
            communicationChannel: "Phone Call",
            communicationChannelOther: "",
            notes: "",
            userExtension: "",
          });
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
          {followupData.leadName && (
            <div className="alert alert-info mb-4 d-flex align-items-center">
              <User size={20} className="me-2" />
              <span>
                <strong>Lead:</strong> {followupData.leadName}
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
                    onChange={(option) =>
                      setFollowupData({
                        ...followupData,
                        followUpStatus:
                          getCrmLeadsStringSelectValue(option) || "Pending",
                      })
                    }
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
                    onChange={(option) =>
                      setFollowupData({
                        ...followupData,
                        communicationChannel:
                          getCrmLeadsStringSelectValue(option) || "Phone Call",
                        communicationChannelOther: "",
                      })
                    }
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
                with leads.
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
              setFollowupData({
                leadId: null,
                leadName: "",
                followUpDate: "",
                followUpStatus: "Pending",
                communicationChannel: "Phone Call",
                communicationChannelOther: "",
                notes: "",
                userExtension: "",
              });
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
              (followupData.communicationChannel === "Other" &&
                !followupData.communicationChannelOther?.trim()) ||
              loadingFollowUp
            }
            onClick={submitFollowUpFromModal}
          >
            {loadingFollowUp ? (
              <>
                <output
                  className="spinner-border spinner-border-sm me-1 d-inline-block"
                  aria-live="polite"
                  aria-label="Loading"
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
    </>
  );
}

export function CrmLeadsViewFragment07() {
  const {
    extensions,
    getTodayDate,
    submitMeetingFromModal,
    loadingMeeting,
    meetingAttendees,
    meetingData,
    meetingIdToEdit,
    setMeetingAttendees,
    setMeetingData,
    setMeetingIdToEdit,
    setShowAddMeetingModal,
    showAddMeetingModal
  } = useLeadsPageContext();
  return (
    <>
      {/* Add/Edit Meeting Modal */}
      <Modal
        show={showAddMeetingModal}
        onHide={() => {
          setShowAddMeetingModal(false);
          setMeetingIdToEdit(null);
          setMeetingData({
            leadId: null,
            leadName: "",
            meetingName: "",
            meetingType: "Online",
            meetingDate: "",
            meetingTime: "",
            meetingOutcome: "",
            extensions: [],
          });
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
          {meetingData.leadName && (
            <div className="alert alert-info mb-4 d-flex align-items-center">
              <User size={20} className="me-2" />
              <span>
                <strong>Lead:</strong> {meetingData.leadName}
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
                    onChange={(option) =>
                      setMeetingData({
                        ...meetingData,
                        meetingType:
                          getCrmLeadsStringSelectValue(option) || "Online",
                      })
                    }
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
                      onChange={(option) =>
                        setMeetingData({
                          ...meetingData,
                          meetingOutcome:
                            getCrmLeadsStringSelectValue(option) || "",
                        })
                      }
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
                leads.
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
              setMeetingData({
                leadId: null,
                leadName: "",
                meetingName: "",
                meetingType: "Online",
                meetingDate: "",
                meetingTime: "",
                meetingOutcome: "",
                extensions: [],
              });
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
            onClick={submitMeetingFromModal}
          >
            {loadingMeeting ? (
              <>
                <output
                  className="spinner-border spinner-border-sm me-1 d-inline-block"
                  aria-live="polite"
                  aria-label="Loading"
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
    </>
  );
}

export function CrmLeadsViewFragment08() {
  const {
    handleChangeStageSubmit,
    leadStages,
    leadToChangeStage,
    loadingChangeStage,
    selectedStageId,
    setLeadToChangeStage,
    setSelectedStageId,
    setShowChangeStageModal,
    showChangeStageModal
  } = useLeadsPageContext();
  return (
    <>
      {/* Change Stage Modal */}
      <Modal
        show={showChangeStageModal}
        onHide={() => {
          setShowChangeStageModal(false);
          setLeadToChangeStage(null);
          setSelectedStageId(null);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <GitBranch size={20} className="me-2" />
            Change Lead Stage
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {leadToChangeStage && (
            <div className="mb-3">
              <p className="mb-1">
                <strong>Lead:</strong> {leadToChangeStage.name}
              </p>
              {(leadToChangeStage.stage || leadToChangeStage.is_lost) && (
                <p className="mb-0 text-muted">
                  <strong>Current Stage:</strong>{" "}
                  {leadToChangeStage.is_lost
                    ? "Lost"
                    : leadToChangeStage.stage?.name}
                </p>
              )}
            </div>
          )}
          <Form.Group className="mb-3">
            <Form.Label>
              Select Stage <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              value={selectedStageId || ""}
              onChange={(e) => setSelectedStageId(Number(e.target.value))}
            >
              <option value="">Select a stage</option>
              {leadStages
                .filter((stage) => stage.type === "lead" && stage.active)
                .sort((a, b) => a.sequence - b.sequence)
                .map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Choose the new stage for this lead
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-top bg-light">
          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowChangeStageModal(false);
              setLeadToChangeStage(null);
              setSelectedStageId(null);
            }}
          >
            <X size={16} className="me-1" />
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!selectedStageId || loadingChangeStage}
            onClick={handleChangeStageSubmit}
          >
            {loadingChangeStage ? (
              <>
                <output
                  className="spinner-border spinner-border-sm me-2 d-inline-block"
                  aria-live="polite"
                  aria-label="Loading"
                />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle size={16} className="me-1" />
                Update Stage
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export function CrmLeadsViewFragment09() {
  const {
    addEditContactPerson,
    editBusinessTypeId,
    editBusinessTypeOther,
    editBusinessTypes,
    editCampaigns,
    editCrmData,
    editExtensions,
    editFetching,
    editFormData,
    editFormStep,
    editLoading,
    editSelectedCampaign,
    editSelectedCity,
    editSelectedCountry,
    editSelectedState,
    editShowOtherBusinessType,
    editStages,
    editingLead,
    handleEditCampaignChange,
    handleEditCampaignFieldChange,
    handleEditCityChange,
    handleEditCountryChange,
    handleEditInputChange,
    handleEditNextStep,
    handleEditStateChange,
    handleEditSubmit,
    removeEditContactPerson,
    setEditBusinessTypeId,
    setEditBusinessTypeOther,
    setEditFormStep,
    setEditShowOtherBusinessType,
    setEditingLead,
    setShowEditModal,
    showEditModal,
    updateEditContactPerson
  } = useLeadsPageContext();
  return (
    <>
      {/* Edit Lead Modal */}
      <Modal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setEditingLead(null);
          setEditFormStep(0);
        }}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Lead: {editingLead?.name || ""}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editFetching ? (
            <div className="text-center py-5">
              <output
                className="spinner-border text-primary d-inline-block"
                aria-live="polite"
              >
                <span className="visually-hidden">Loading...</span>
              </output>
              <p className="mt-3">Loading lead data...</p>
            </div>
          ) : (
            <>
              {/* Step Timeline */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center position-relative">
                  <div
                    className="position-absolute top-50 start-0 end-0"
                    style={{
                      height: "2px",
                      backgroundColor: "#e0e0e0",
                      zIndex: 0,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        backgroundColor: "#198754",
                        width: `${(editFormStep / 3) * 100}%`,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  {[
                    { step: 0, label: "Lead Info" },
                    { step: 1, label: "Company Info" },
                    { step: 2, label: "Contact Persons" },
                    { step: 3, label: "Other Info" },
                  ].map(({ step, label }) => (
                    <button
                      key={step}
                      type="button"
                      className="d-flex flex-column align-items-center position-relative btn btn-link p-0 border-0 bg-transparent"
                      style={{
                        zIndex: 1,
                        cursor: "pointer",
                        color: "inherit",
                        textDecoration: "none",
                      }}
                      onClick={() => setEditFormStep(step)}
                    >
                      <div
                        className={`rounded-circle d-flex align-items-center justify-content-center ${
                          editFormStep >= step
                            ? "bg-primary text-white"
                            : "bg-light border border-secondary text-secondary"
                        }`}
                        style={{
                          width: "40px",
                          height: "40px",
                          fontWeight: "bold",
                        }}
                      >
                        {editFormStep > step ? (
                          <CheckCircle size={20} />
                        ) : (
                          step + 1
                        )}
                      </div>
                      <small
                        className={`mt-2 ${
                          editFormStep === step
                            ? "text-primary fw-bold"
                            : "text-muted"
                        }`}
                      >
                        {label}
                      </small>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 0: Lead Information */}
              {editFormStep === 0 && (
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h5 className="fw-bold mb-4 text-primary">
                      LEAD INFORMATION
                    </h5>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Lead Name <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={editFormData.name}
                            onChange={(e) =>
                              handleEditInputChange("name", e.target.value)
                            }
                            placeholder="Enter lead name"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Assigned To <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Select
                            value={editFormData.user_extension || ""}
                            onChange={(e) =>
                              handleEditInputChange(
                                "user_extension",
                                e.target.value ? Number(e.target.value) : null,
                              )
                            }
                          >
                            <option value="">Select User</option>
                            {editExtensions.map((ext: any) => (
                              <option key={ext.id} value={ext.id}>
                                {ext.display_name || ext.name}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Stage <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Select
                            value={editFormData.stage_id || ""}
                            onChange={(e) =>
                              handleEditInputChange(
                                "stage_id",
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              )
                            }
                            required
                          >
                            <option value="">Select a stage</option>
                            {editStages.map((stage) => (
                              <option key={stage.id} value={stage.id}>
                                {stage.name}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Source</Form.Label>
                          <Form.Control
                            type="text"
                            value={editFormData.source}
                            onChange={(e) =>
                              handleEditInputChange("source", e.target.value)
                            }
                            placeholder="e.g., LinkedIn, Website, Referral"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Campaign</Form.Label>
                          <Select
                            value={
                              editFormData.campaign_id
                                ? {
                                    value: editFormData.campaign_id,
                                    label:
                                      editCampaigns.find(
                                        (c) =>
                                          c.id === editFormData.campaign_id,
                                      )?.name || "",
                                  }
                                : null
                            }
                            onChange={(selectedOption: any) => {
                              handleEditCampaignChange(
                                selectedOption?.value || undefined,
                              );
                            }}
                            options={editCampaigns.map((campaign) => ({
                              value: campaign.id,
                              label: campaign.name,
                            }))}
                            placeholder="Select a campaign (Optional)"
                            isClearable
                            isSearchable
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Prospect</Form.Label>
                          <Select
                            value={
                              editFormData.crm_data_id
                                ? {
                                    value: editFormData.crm_data_id,
                                    label: `${editCrmData.find((d) => d.id === editFormData.crm_data_id)?.name || "No Name"}`,
                                  }
                                : null
                            }
                            onChange={(selectedOption: any) => {
                              handleEditInputChange(
                                "crm_data_id",
                                selectedOption?.value || undefined,
                              );
                            }}
                            options={editCrmData.map((data) => ({
                              value: data.id,
                              label: `${data?.name || "No Name"} - ${data?.phone || "No Phone"}`,
                            }))}
                            placeholder="Select Prospect (Optional)"
                            isClearable
                            isSearchable
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Description</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={editFormData.description}
                            onChange={(e) =>
                              handleEditInputChange(
                                "description",
                                e.target.value,
                              )
                            }
                            placeholder="Enter lead description or notes"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {/* Step 1: Company Information */}
              {editFormStep === 1 && (
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h5 className="fw-bold mb-4 text-primary">
                      COMPANY INFORMATION
                    </h5>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Company Name <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={editFormData.company_name}
                            onChange={(e) =>
                              handleEditInputChange(
                                "company_name",
                                e.target.value,
                              )
                            }
                            placeholder="Enter company name"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Business Type <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Select
                            value={editLeadModalBusinessTypeSelectValue(
                              editShowOtherBusinessType,
                              editBusinessTypeId,
                            )}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "other") {
                                setEditShowOtherBusinessType(true);
                                setEditBusinessTypeId(null);
                                setEditBusinessTypeOther("");
                              } else if (value) {
                                setEditShowOtherBusinessType(false);
                                setEditBusinessTypeId(Number(value));
                                setEditBusinessTypeOther("");
                              } else {
                                setEditShowOtherBusinessType(false);
                                setEditBusinessTypeId(null);
                                setEditBusinessTypeOther("");
                              }
                            }}
                          >
                            <option value="">Select Business Type</option>
                            {editBusinessTypes.map((businessType) => (
                              <option
                                key={businessType.id}
                                value={businessType.id}
                              >
                                {businessType.name}
                              </option>
                            ))}
                            <option value="other">Other</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      {editShowOtherBusinessType && (
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>
                              Specify Business Type{" "}
                              <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              type="text"
                              value={editBusinessTypeOther}
                              onChange={(e) =>
                                setEditBusinessTypeOther(e.target.value)
                              }
                              placeholder="Enter business type"
                            />
                          </Form.Group>
                        </Col>
                      )}
                      <CrmLeadEditModalCountrySelectGroup
                        editSelectedCountry={editSelectedCountry}
                        onCountryChange={handleEditCountryChange}
                      />
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Province/State</Form.Label>
                          <Select
                            value={editSelectedState}
                            onChange={handleEditStateChange}
                            options={
                              editSelectedCountry
                                ? State.getStatesOfCountry(
                                    editSelectedCountry.value,
                                  ).map((state: any) => ({
                                    value: state.isoCode,
                                    label: state.name,
                                  }))
                                : []
                            }
                            placeholder="Select Province/State"
                            isClearable
                            isSearchable
                            isDisabled={!editSelectedCountry}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>City</Form.Label>
                          <Select
                            value={editSelectedCity}
                            onChange={handleEditCityChange}
                            options={
                              editSelectedCountry && editSelectedState
                                ? City.getCitiesOfState(
                                    editSelectedCountry.value,
                                    editSelectedState.value,
                                  ).map((city: any) => ({
                                    value: city.name,
                                    label: city.name,
                                  }))
                                : []
                            }
                            placeholder="Select City"
                            isClearable
                            isSearchable
                            isDisabled={
                              !editSelectedCountry || !editSelectedState
                            }
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Company Size</Form.Label>
                          <Form.Select
                            value={editFormData.company_size}
                            onChange={(e) =>
                              handleEditInputChange(
                                "company_size",
                                e.target.value,
                              )
                            }
                          >
                            <option value="">Select Size</option>
                            <option value="Micro (1-10 employees)">
                              Micro (1-10 employees)
                            </option>
                            <option value="Small (11-50 employees)">
                              Small (11-50 employees)
                            </option>
                            <option value="Medium (51-200 employees)">
                              Medium (51-200 employees)
                            </option>
                            <option value="Large (201-500 employees)">
                              Large (201-500 employees)
                            </option>
                            <option value="Enterprise (500+ employees)">
                              Enterprise (500+ employees)
                            </option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Location Notes</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={editFormData.company_location_other}
                            onChange={(e) =>
                              handleEditInputChange(
                                "company_location_other",
                                e.target.value,
                              )
                            }
                            placeholder="Any additional location details"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {/* Step 2: Contact Persons */}
              {editFormStep === 2 && (
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="fw-bold text-primary mb-0">
                        CONTACT PERSONS
                      </h5>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={addEditContactPerson}
                      >
                        <FiPlus size={16} className="me-1" />
                        Add Contact Person
                      </Button>
                    </div>
                    {editFormData.contact_persons.map((person, index) => (
                      <Card
                        key={editLeadContactPersonStableKey(person, index)}
                        className="mb-3 border"
                      >
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="mb-0">Contact Person {index + 1}</h6>
                            {editFormData.contact_persons.length > 1 && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => removeEditContactPerson(index)}
                              >
                                <X size={16} />
                              </Button>
                            )}
                          </div>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  Title <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  value={person.title}
                                  onChange={(e) =>
                                    updateEditContactPerson(
                                      index,
                                      "title",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="e.g., CEO, Manager"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  Name <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  value={person.name}
                                  onChange={(e) =>
                                    updateEditContactPerson(
                                      index,
                                      "name",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Enter contact name"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  Phone <span className="text-danger">*</span>
                                </Form.Label>
                                <PhoneInput
                                  international
                                  defaultCountry="PK"
                                  value={person.phone}
                                  onChange={(value: any) => {
                                    updateEditContactPerson(
                                      index,
                                      "phone",
                                      value || "",
                                    );
                                    if (value) {
                                      try {
                                        const phoneNumber =
                                          parsePhoneLib(value);
                                        if (phoneNumber) {
                                          updateEditContactPerson(
                                            index,
                                            "phone_country_code",
                                            `+${phoneNumber.countryCallingCode}`,
                                          );
                                        }
                                      } catch (e) {
                                        console.error("Phone parse error:", e);
                                      }
                                    }
                                  }}
                                  className="form-control"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  Email <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="email"
                                  value={person.email}
                                  onChange={(e) =>
                                    updateEditContactPerson(
                                      index,
                                      "email",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Enter email address"
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    ))}
                  </Card.Body>
                </Card>
              )}

              {/* Step 3: Other Information */}
              {editFormStep === 3 && (
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h5 className="fw-bold mb-4 text-primary">
                      OTHER INFORMATION
                    </h5>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Lead Potential</Form.Label>
                          <Form.Select
                            value={editFormData.lead_potential}
                            onChange={(e) =>
                              handleEditInputChange(
                                "lead_potential",
                                e.target.value,
                              )
                            }
                          >
                            <option value="">Select Lead Potential</option>
                            <option value="Hot">Hot</option>
                            <option value="Warm">Warm</option>
                            <option value="Cold">Cold</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Campaign Custom Fields */}
                    {(editSelectedCampaign as any)?.custom_fields &&
                      (editSelectedCampaign as any).custom_fields.length >
                        0 && (
                        <>
                          <h6 className="fw-bold mt-4 mb-3 text-primary">
                            Campaign Custom Fields
                          </h6>
                          <Row>
                            {(editSelectedCampaign as any).custom_fields.map(
                              (field: any) => (
                                <Col md={6} key={field.field_key}>
                                  <Form.Group className="mb-3">
                                    <Form.Label>
                                      {field.field_name}
                                      {field.required && (
                                        <span className="text-danger">*</span>
                                      )}
                                    </Form.Label>
                                    <CrmLeadEditCampaignFieldControl
                                      field={field}
                                      values={editFormData.campaign_field_values}
                                      onFieldChange={
                                        handleEditCampaignFieldChange
                                      }
                                    />
                                  </Form.Group>
                                </Col>
                              ),
                            )}
                          </Row>
                        </>
                      )}
                  </Card.Body>
                </Card>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {editFormStep > 0 && (
            <Button
              variant="outline-secondary"
              onClick={() => setEditFormStep((prev) => prev - 1)}
            >
              <ChevronLeft size={16} className="me-1" />
              Back
            </Button>
          )}
          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowEditModal(false);
              setEditingLead(null);
              setEditFormStep(0);
            }}
          >
            <X size={16} className="me-1" />
            Cancel
          </Button>
          {editFormStep < 3 ? (
            <Button variant="primary" onClick={handleEditNextStep}>
              Next
              <ChevronRight size={16} className="ms-1" />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleEditSubmit}
              disabled={editLoading}
            >
              {editLoading ? (
                <>
                  <output
                    className="spinner-border spinner-border-sm me-2 d-inline-block"
                    aria-live="polite"
                    aria-label="Loading"
                  />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle size={16} className="me-1" />
                  Update Lead
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
}

export function CrmLeadsViewFragment10() {
  const {
    campaigns,
    convertingLeadId,
    customTabs,
    editLeadIdForSidebar,
    exportFileName,
    exportFilters,
    exporting,
    extensions,
    fetchLeads,
    filterBusinessTypes,
    filterCounts,
    handleAddCustomTab,
    handleFiltersChange,
    handleLeadsExport,
    lostReasons,
    leadsColumns,
    leadsFilters,
    leadsSearch,
    selectedLeadsColumns,
    stages,
    setActiveFilter,
    setConvertingLeadId,
    setEditLeadIdForSidebar,
    setExportFileName,
    setExportFilters,
    setLeadsFilters,
    setLeadsPagination,
    setLeadsSearch,
    setRefreshKey,
    setSelectedLeadsColumns,
    setShowColumnEditor,
    setShowConvertToDealModal,
    setShowCreateLeadModal,
    setShowExportModal,
    setShowFiltersSidebar,
    setShowTabModal,
    showColumnEditor,
    showConvertToDealModal,
    showCreateLeadModal,
    showExportModal,
    showFiltersSidebar,
    showTabModal,
    uniqueSources,
  } = useLeadsPageContext();
  return (
    <>
      {/* Filters Sidebar */}
      <GenericFilterSidebar
        isOpen={showFiltersSidebar}
        onClose={() => setShowFiltersSidebar(false)}
        title="Filters"
        subtitle="Filter and refine your leads"
        width="400px"
        filters={[
          {
            id: "assignedTo",
            label: "Owner",
            type: "select",
            value: leadsFilters.assignedTo
              ? (() => {
                  const assignedToId = leadsFilters.assignedTo;
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
              setLeadsFilters((prev) => ({
                ...prev,
                assignedTo: assignedToValue,
              }));
              setActiveFilter("all");
            },
            options: extensions.map((ext: any) => ({
              value: ext.id || ext.extension,
              label: ext.display_name || ext.name || ext.id || ext.extension,
            })),
            placeholder: "Search and select owner...",
            isClearable: true,
          },
          {
            id: "stage",
            label: "Stages",
            type: "select",
            value: leadsFilters.stage
              ? (() => {
                  const stageId = leadsFilters.stage;
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
              setLeadsFilters((prev) => ({
                ...prev,
                stage: stageValue,
              }));
              if (stageValue) {
                setActiveFilter(stageValue);
              } else {
                setActiveFilter("all");
              }
            },
            options: stages.map((s: any) => ({
              value: s.id.toString(),
              label: s.name,
            })),
            placeholder: "Select stage...",
            isClearable: true,
          },
          {
            id: "businessType",
            label: "Business Type",
            type: "select",
            value: leadsFilters.businessType
              ? (() => {
                  const btId = leadsFilters.businessType;
                  const bt = filterBusinessTypes.find(
                    (b: BusinessTypeData) => b.id.toString() === btId,
                  );
                  return bt
                    ? { value: btId, label: bt.name }
                    : { value: btId, label: btId };
                })()
              : null,
            onChange: (selected) => {
              const businessTypeValue = selected ? selected.value : null;
              setLeadsFilters((prev) => ({
                ...prev,
                businessType: businessTypeValue,
              }));
            },
            options: filterBusinessTypes.map((bt: BusinessTypeData) => ({
              value: bt.id.toString(),
              label: bt.name,
            })),
            placeholder: "Select business type...",
            isClearable: true,
          },
          {
            id: "source",
            label: "Source",
            type: "select",
            value: leadsFilters.source
              ? { value: leadsFilters.source, label: leadsFilters.source }
              : null,
            onChange: (selected) => {
              const sourceValue = selected ? selected.value : null;
              setLeadsFilters((prev) => ({
                ...prev,
                source: sourceValue,
              }));
            },
            options: uniqueSources,
            placeholder: "Select source...",
            isClearable: true,
          },
          {
            id: "leadPotential",
            label: "Lead Potential",
            type: "select",
            value: leadsFilters.leadPotential
              ? {
                  value: leadsFilters.leadPotential,
                  label: leadsFilters.leadPotential,
                }
              : null,
            onChange: (selected) => {
              const leadPotentialValue = selected ? selected.value : null;
              setLeadsFilters((prev) => ({
                ...prev,
                leadPotential: leadPotentialValue,
              }));
            },
            options: [
              { value: "Hot", label: "Hot" },
              { value: "Warm", label: "Warm" },
              { value: "Cold", label: "Cold" },
            ],
            placeholder: "Select lead potential...",
            isClearable: true,
          },
          {
            id: "campaign",
            label: "Campaign",
            type: "select",
            value: leadsFilters.campaign
              ? (() => {
                  const campaignId = leadsFilters.campaign;
                  const campaign = campaigns.find(
                    (c: any) => c.id.toString() === campaignId,
                  );
                  return campaign
                    ? { value: campaignId, label: campaign.name }
                    : { value: campaignId, label: campaignId };
                })()
              : null,
            onChange: (selected) => {
              const campaignValue = selected ? selected.value : null;
              setLeadsFilters((prev) => ({
                ...prev,
                campaign: campaignValue,
              }));
            },
            options: campaigns.map((campaign: any) => ({
              value: campaign.id.toString(),
              label: campaign.name,
            })),
            placeholder: "Select campaign...",
            isClearable: true,
          },
          {
            id: "lostReason",
            label: "Lost Lead Reason",
            type: "select",
            value: leadsFilters.lostReason
              ? (() => {
                  const reasonId = leadsFilters.lostReason;
                  const reason = lostReasons.find(
                    (r: any) => r.id.toString() === reasonId,
                  );
                  return reason
                    ? { value: reasonId, label: reason.name }
                    : { value: reasonId, label: reasonId };
                })()
              : null,
            onChange: (selected) => {
              const lostReasonValue = selected ? selected.value : null;
              setLeadsFilters((prev) => ({
                ...prev,
                lostReason: lostReasonValue,
              }));
            },
            options: lostReasons.map((r: any) => ({
              value: r.id.toString(),
              label: r.name,
            })),
            placeholder: "Select lost reason...",
            isClearable: true,
          },
          {
            id: "leadScoreMin",
            label: "Lead Score (Min)",
            type: "text",
            value: leadsFilters.leadScoreMin || "",
            onChange: (value = "") => {
              setLeadsFilters((prev) => ({
                ...prev,
                leadScoreMin: value || null,
              }));
            },
            placeholder: "Minimum score",
          },
          {
            id: "leadScoreMax",
            label: "Lead Score (Max)",
            type: "text",
            value: leadsFilters.leadScoreMax || "",
            onChange: (value = "") => {
              setLeadsFilters((prev) => ({
                ...prev,
                leadScoreMax: value || null,
              }));
            },
            placeholder: "Maximum score",
          },
          {
            id: "dateFrom",
            label: "Date (From)",
            type: "date",
            value: leadsFilters.dateFrom || "",
            onChange: (value = "") => {
              setLeadsFilters((prev) => ({
                ...prev,
                dateFrom: value || null,
              }));
            },
            placeholder: "From date",
          },
          {
            id: "dateTo",
            label: "Date (To)",
            type: "date",
            value: leadsFilters.dateTo || "",
            onChange: (value = "") => {
              setLeadsFilters((prev) => ({
                ...prev,
                dateTo: value || null,
              }));
            },
            placeholder: "To date",
          },
        ]}
        onApply={() => {
          // Pass all filter keys so handleFiltersChange can both set and clear (like prospects Apply)
          const filtersToApply: Record<string, any> = {
            search: leadsSearch?.trim() || "",
            user_extension_filter: leadsFilters.assignedTo ?? undefined,
            stage_id: leadsFilters.stage ?? undefined,
            business_type_id: leadsFilters.businessType ?? undefined,
            source: leadsFilters.source ?? undefined,
            lead_potential: leadsFilters.leadPotential ?? undefined,
            campaign_id: leadsFilters.campaign ?? undefined,
            lost_reason_id: leadsFilters.lostReason ?? undefined,
            lead_score_min: leadsFilters.leadScoreMin ?? undefined,
            lead_score_max: leadsFilters.leadScoreMax ?? undefined,
            date_from: leadsFilters.dateFrom ?? undefined,
            date_to: leadsFilters.dateTo ?? undefined,
          };

          handleFiltersChange(filtersToApply);
          setLeadsPagination((prev) => ({ ...prev, currentPage: 1 }));
          setRefreshKey((prev) => prev + 1);
          setShowFiltersSidebar(false);
        }}
        onReset={() => {
          setLeadsSearch("");
          setLeadsFilters({
            assignedTo: null,
            stage: null,
            businessType: null,
            source: null,
            leadPotential: null,
            campaign: null,
            lostReason: null,
            leadScoreMin: null,
            leadScoreMax: null,
            dateFrom: null,
            dateTo: null,
          });
          // Pass all filter keys as undefined so handleFiltersChange removes each one
          handleFiltersChange({
            search: undefined,
            user_extension_filter: undefined,
            stage_id: undefined,
            business_type_id: undefined,
            source: undefined,
            lead_potential: undefined,
            campaign_id: undefined,
            lost_reason_id: undefined,
            lead_score_min: undefined,
            lead_score_max: undefined,
            date_from: undefined,
            date_to: undefined,
          });
          setActiveFilter("all");
          setRefreshKey((prev) => prev + 1);
        }}
      />

      {convertingLeadId != null && (
        <ConvertLeadToDealModal
          show={showConvertToDealModal}
          onHide={() => {
            setShowConvertToDealModal(false);
            setConvertingLeadId(null);
          }}
          leadId={convertingLeadId}
          onSuccess={() => {
            setRefreshKey((prev) => prev + 1);
            toast.success("Lead converted to deal successfully!");
          }}
        />
      )}

      {/* Add Tab Modal */}
      <Modal show={showTabModal} onHide={() => setShowTabModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Tab</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">Select a stage to add as a new tab</p>
          <div
            className="d-grid gap-2"
            style={{ maxHeight: "400px", overflowY: "auto" }}
          >
            {stages.map((stage: any) => {
              const isAlreadyAdded = customTabs.some(
                (t) => t.id === stage.id.toString(),
              );
              const stageId = String(stage.id);
              const stageCount = filterCounts[stageId] || 0;
              return (
                <Button
                  key={stage.id}
                  variant="outline-primary"
                  onClick={() => handleAddCustomTab(stageId, stage.name, stageCount)}
                  disabled={isAlreadyAdded}
                  className="d-flex align-items-center justify-content-start"
                  style={{ textAlign: "left" }}
                >
                  <Layers size={16} className="me-2" />
                  {stage.name}
                  {stageCount > 0 && (
                    <Badge bg="secondary" className="ms-auto">
                      {stageCount}
                    </Badge>
                  )}
                </Button>
              );
            })}
            {/* Lost and Deleted tabs */}
            <Button
              variant="outline-primary"
              onClick={() =>
                handleAddCustomTab("lost", "Lost", filterCounts.lost || 0)
              }
              disabled={customTabs.some((t) => t.id === "lost")}
              className="d-flex align-items-center justify-content-start"
              style={{ textAlign: "left" }}
            >
              <X size={16} className="me-2" />
              Lost
              {(filterCounts.lost || 0) > 0 && (
                <Badge bg="secondary" className="ms-auto">
                  {filterCounts.lost || 0}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline-primary"
              onClick={() =>
                handleAddCustomTab("deleted", "Deleted", filterCounts.deleted || 0)
              }
              disabled={customTabs.some((t) => t.id === "deleted")}
              className="d-flex align-items-center justify-content-start"
              style={{ textAlign: "left" }}
            >
              <Trash2 size={16} className="me-2" />
              Deleted
              {(filterCounts.deleted || 0) > 0 && (
                <Badge bg="secondary" className="ms-auto">
                  {filterCounts.deleted || 0}
                </Badge>
              )}
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTabModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Column Editor Modal */}
      <CrmListColumnEditorModal
        show={showColumnEditor}
        onHide={() => setShowColumnEditor(false)}
        columns={leadsColumns.map((c) => ({ key: c.key, label: c.label }))}
        selectedColumnKeys={selectedLeadsColumns}
        storageKey="leadsSelectedColumns"
        onSelectedKeysChange={setSelectedLeadsColumns}
      />

      {/* Export Leads Modal */}
      <CrmExportModal
        show={showExportModal}
        onHide={() => setShowExportModal(false)}
        title="Export Leads"
        subtitle="Choose filters to define which leads are exported. Defaults match your current table view."
        fileNameValue={exportFileName}
        onFileNameChange={setExportFileName}
        fileNamePlaceholder="leads_2025-02-27"
        onExportClick={handleLeadsExport}
        exporting={exporting}
        exportButtonLabel="Export"
      >
        <hr />
        <h6 className="mb-3">Export filters</h6>
        <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Owner</Form.Label>
                <Form.Select
                  value={
                    exportFilters.user_extension_filter
                      ? String(exportFilters.user_extension_filter)
                      : ""
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    setExportFilters((prev) => {
                      const next = { ...prev };
                      if (v) next.user_extension_filter = v;
                      else delete next.user_extension_filter;
                      return next;
                    });
                  }}
                >
                  <option value="">All owners</option>
                  {extensions.map((ext) => (
                    <option
                      key={String(ext.id || ext.extension)}
                      value={String(ext.id || ext.extension)}
                    >
                      {ext.display_name ||
                        ext.name ||
                        ext.id ||
                        ext.extension ||
                        ""}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Lead Stage</Form.Label>
                <Form.Select
                  value={exportFilters.stage_id || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setExportFilters((prev) => {
                      const next = { ...prev };
                      if (v) next.stage_id = v;
                      else delete next.stage_id;
                      return next;
                    });
                  }}
                >
                  <option value="">All stages</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={String(stage.id)}>
                      {stage.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Lead Potential</Form.Label>
                <Form.Select
                  value={exportFilters.lead_potential || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setExportFilters((prev) => {
                      const next = { ...prev };
                      if (v) next.lead_potential = v;
                      else delete next.lead_potential;
                      return next;
                    });
                  }}
                >
                  <option value="">All potential</option>
                  <option value="Hot">Hot</option>
                  <option value="Warm">Warm</option>
                  <option value="Cold">Cold</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Create date</Form.Label>
                <Form.Select
                  value={(() => {
                    const from = exportFilters.date_from;
                    const to = exportFilters.date_to;
                    if (!from || !to) return "all";
                    const days = moment(to).diff(moment(from), "days");
                    if (days === 0) return "today";
                    if (days >= 6 && days <= 8) return "week";
                    if (days >= 28 && days <= 31) return "month";
                    return "all";
                  })()}
                  onChange={(e) => {
                    const v = e.target.value;
                    setExportFilters((prev) => {
                      const next = { ...prev };
                      if (v === "all") {
                        delete next.date_from;
                        delete next.date_to;
                      } else {
                        const today = moment().format("YYYY-MM-DD");
                        if (v === "today") {
                          next.date_from = today;
                          next.date_to = today;
                        } else if (v === "week") {
                          next.date_from = moment()
                            .subtract(7, "days")
                            .format("YYYY-MM-DD");
                          next.date_to = today;
                        } else {
                          next.date_from = moment()
                            .subtract(30, "days")
                            .format("YYYY-MM-DD");
                          next.date_to = today;
                        }
                      }
                      return next;
                    });
                  }}
                >
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 30 days</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Filter by name, company, etc."
                  value={exportFilters.search || ""}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    setExportFilters((prev) => {
                      const next = { ...prev };
                      if (v) next.search = v;
                      else delete next.search;
                      return next;
                    });
                  }}
                />
              </Form.Group>
            </Col>
          </Row>
      </CrmExportModal>

      {/* Add modal at the end */}
      <CreateLeadModal
        show={showCreateLeadModal}
        onHide={() => {
          setShowCreateLeadModal(false);
          setEditLeadIdForSidebar(null);
        }}
        onSuccess={() => {
          setShowCreateLeadModal(false);
          setEditLeadIdForSidebar(null);
          fetchLeads();
        }}
        type="lead"
        editLeadId={editLeadIdForSidebar}
      />
    </>
  );
}
