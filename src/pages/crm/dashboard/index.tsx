import React, {
  ReactElement,
  useState,
  useMemo,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  Card,
  Row,
  Col,
  Button,
  Badge,
  Spinner,
  ListGroup,
  Table,
  Modal,
} from "react-bootstrap";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import {
  getCrmDashboard,
  getCrmData,
  AuditTrailEntry,
  LeadData,
  DealData,
  CrmDataItem,
  OrderData,
  type CrmDataResponse,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import { buildCrmAuditLinesForEntry } from "@utils/crmAuditTrail";
import {
  TrendingUp,
  Calendar,
  Copy,
  ExternalLink,
  Eye,
  Users,
  UserPlus,
  DollarSign,
  ShoppingCart,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import moment from "moment";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";

import StatsCards from "@components/GenericStatsCards";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import {
  formatCrmPreviewDate,
  formatMeetingDateLocal,
  formatMeetingTimeLocal,
  formatNumber,
  ModuleSlug,
} from "@utils/Helper";

import { crmAppKeys } from "../../../query/keys";

const { PERMISSIONS } = HEADER_CONSTANTS;

// Helper functions for badge colors
const getDealBadgeColor = (deal: DealData): string => {
  if (deal.is_lost) return "danger";
  if (deal.stage?.is_won) return "success";
  return "secondary";
};

const getOrderBadgeColor = (order: OrderData): string => {
  if (order.status === "delivered") return "success";
  if (order.status === "in_progress") return "info";
  if (order.status === "approved") return "primary";
  return "warning";
};

const getRecordTypeFromAuditableType = (auditableType: unknown): string => {
  if (typeof auditableType !== "string" || !auditableType.trim()) return "";
  const typeParts = auditableType.split("\\").filter(Boolean);
  return typeParts.at(-1) || "";
};

const DASHBOARD_TIMEFRAME_LABEL = "Last 30 days";

const formatDashboardHistoryUtcDateTime = (date: unknown): string => {
  if (typeof date !== "string" || !date.trim()) {
    return "";
  }

  const parsed = moment.utc(date);
  if (!parsed.isValid()) {
    return "";
  }

  return parsed.local().format("D MMMM, YYYY [at] hh:mm A");
};

const getLeadToOrderConversionPercentage = (
  apiValue: unknown,
  leadsCount: number,
  ordersCount: number,
): number => {
  if (typeof apiValue === "number" && !Number.isNaN(apiValue)) {
    return apiValue;
  }
  if (leadsCount > 0) {
    return (ordersCount / leadsCount) * 100;
  }
  return 0;
};

const getMeetingRecordNavigation = (
  recordType: unknown,
  recordId: unknown,
): { label: string; href: string | null } => {
  const typeLabel = getRecordTypeFromAuditableType(recordType);
  const normalizedType = typeLabel.toLowerCase();
  const idValue =
    typeof recordId === "string" || typeof recordId === "number"
      ? String(recordId).trim()
      : "";

  if (!normalizedType || !idValue) {
    return { label: typeLabel || "", href: null };
  }

  if (normalizedType === "ticket") {
    return {
      label: typeLabel,
      href: `/crm/tickets/tickets-detailpage?id=${encodeURIComponent(idValue)}`,
    };
  }

  const detailPageTypeMap: Record<string, string> = {
    prospect: "prospect",
    lead: "lead",
    deal: "deal",
    order: "order",
    company: "companies",
    companies: "companies",
  };

  const detailType = detailPageTypeMap[normalizedType];
  if (!detailType) {
    return { label: typeLabel, href: null };
  }

  return {
    label: typeLabel,
    href: `/crm/detailspage?type=${detailType}&id=${encodeURIComponent(idValue)}`,
  };
};

const buildAbsoluteAppUrl = (path: string): string => {
  const win = globalThis.window;
  if (win === undefined) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${win.location.origin}${normalized}`;
};

const safeUnknownToDateString = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "";
};

const formatMeetingEntityTypeLabel = (auditableType: unknown): string => {
  const raw = getRecordTypeFromAuditableType(auditableType);
  const key = raw.toLowerCase();
  const map: Record<string, string> = {
    ticket: "Lead",
    lead: "Lead",
    prospect: "Prospect",
    crmdata: "Prospect",
    deal: "Deal",
    order: "Order",
    company: "Company",
    companies: "Company",
  };
  if (map[key]) {
    return map[key];
  }
  if (!raw) {
    return "Record";
  }
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
};

const pickFirstNonEmptyString = (...values: Array<unknown>): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
};

const getMeetingRelatedRecordName = (meeting: Record<string, unknown>): string => {
  const record = meeting.record as Record<string, unknown> | undefined;
  const lead = meeting.lead as Record<string, unknown> | undefined;
  const deal = meeting.deal as Record<string, unknown> | undefined;
  const ticket = meeting.ticket as Record<string, unknown> | undefined;

  return (
    pickFirstNonEmptyString(
      record?.name,
      record?.company_name,
      lead?.name,
      lead?.company_name,
      deal?.name,
      deal?.company_name,
      ticket?.company_name,
      ticket?.name,
    ) || "—"
  );
};

const getCrmRecordDetailHref = (
  entity: "prospect" | "lead" | "deal" | "order",
  id: number | string | undefined | null,
): string | null => {
  if (id === undefined || id === null || id === "") {
    return null;
  }
  const idValue = String(id).trim();
  if (!idValue) {
    return null;
  }
  return `/crm/detailspage?type=${entity}&id=${encodeURIComponent(idValue)}`;
};

type DashboardApiPayload = Record<string, unknown> & {
  totals?: Record<string, number>;
  last_30_days?: Record<string, number>;
  conversion_last_30_days?: {
    lead_to_deal?: { rate_percent?: number };
    deal_to_order?: { rate_percent?: number };
  };
};

const readNumeric = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const selectDashboardOverallCounts = (data: DashboardApiPayload | null | undefined) => {
  const totals = data?.totals;
  const counts = data?.counts as Record<string, unknown> | undefined;
  return {
    prospects: readNumeric(totals?.prospects ?? counts?.crm_data),
    leads: readNumeric(totals?.leads ?? counts?.leads),
    deals: readNumeric(totals?.deals ?? counts?.deals),
    orders: readNumeric(totals?.orders ?? counts?.orders),
  };
};

const selectLast30DaysCounts = (data: DashboardApiPayload | null | undefined) => {
  const last30 = data?.last_30_days;
  if (!last30) {
    const counts = data?.counts as Record<string, unknown> | undefined;
    return {
      prospects: readNumeric(counts?.crm_data),
      leads: readNumeric(counts?.leads),
      deals: readNumeric(counts?.deals),
      orders: readNumeric(counts?.orders),
    };
  }
  return {
    prospects: readNumeric(last30.prospects ?? last30.crm_data),
    leads: readNumeric(last30.leads),
    deals: readNumeric(last30.deals),
    orders: readNumeric(last30.orders),
  };
};

const selectConversionRatesLast30Days = (data: DashboardApiPayload | null | undefined) => {
  const nested = data?.conversion_last_30_days;
  const flat = data?.conversion_ratios as Record<string, unknown> | undefined;
  const leadToDeal =
    readNumeric(nested?.lead_to_deal?.rate_percent) ||
    readNumeric(flat?.lead_to_deal);
  const dealToOrder =
    readNumeric(nested?.deal_to_order?.rate_percent) ||
    readNumeric(flat?.deal_to_order);
  return { leadToDeal, dealToOrder };
};

const crmDashboardRecordTableStyle: React.CSSProperties = {
  tableLayout: "fixed",
  width: "100%",
};

const crmDashboardActionThStyle: React.CSSProperties = {
  width: "2.5rem",
  maxWidth: "2.5rem",
  padding: "0.35rem 0.25rem",
  textAlign: "center",
};

const crmDashboardActionTdStyle: React.CSSProperties = {
  ...crmDashboardActionThStyle,
  verticalAlign: "middle",
};

function CrmDetailEyeLink({
  href,
  label = "View record",
}: Readonly<{ href: string | null; label?: string }>) {
  if (!href) {
    return <span className="text-muted">—</span>;
  }
  return (
    <Link
      href={href}
      className="d-inline-flex align-items-center justify-content-center rounded p-1 text-primary"
      title={label}
      aria-label={label}
      style={{ lineHeight: 1 }}
    >
      <Eye size={16} aria-hidden />
    </Link>
  );
}

const dashboardCellEllipsisStyle: React.CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const dashboardWrapTextStyle: React.CSSProperties = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const humanizeDashboardAuditKey = (key: string): string =>
  key
    .replaceAll("_", " ")
    .replaceAll(/\b\w/g, (char) => char.toUpperCase());

const formatDashboardAuditFieldValue = (
  _field: string,
  value: unknown,
): string => {
  if (value == null || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "—";
  }

  if (typeof value === "string") {
    return value.trim() || "—";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "—";
    }

    return value
      .map((item) => formatDashboardAuditFieldValue("", item))
      .join(", ");
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "[Complex value]";
  }
};

const getDashboardActivitySummary = (
  activity: AuditTrailEntry,
): string =>
  buildCrmAuditLinesForEntry(
    activity,
    formatDashboardAuditFieldValue,
    humanizeDashboardAuditKey,
  );

// Chart color palette - 15 colors for handling large datasets
const CHART_COLORS = [
  "#ffc107", // Yellow
  "#0dcaf0", // Cyan
  "#6c757d", // Gray
  "#198754", // Green
  "#dc3545", // Red
  "#0d6efd", // Blue
  "#6610f2", // Purple
  "#e83e8c", // Pink
  "#fd7e14", // Orange
  "#20c997", // Teal
  "#ff6b6b", // Coral Red
  "#4ecdc4", // Turquoise
  "#95e1d3", // Mint
  "#f38181", // Salmon
  "#aa96da", // Lavender
];

const safeScalarToString = (value: unknown): string => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return "";
};

function resolveExtensionDisplayName(
  extensions: Array<Record<string, unknown>>,
  extension: string,
): string {
  const extensionValue = String(extension);
  const extensionData = extensions.find(
    (ext) =>
      String(ext.id) === extensionValue ||
      String(ext.extension) === extensionValue,
  );
  const displayName = extensionData?.display_name;
  const name = extensionData?.name;
  if (typeof displayName === "string" && displayName.trim()) {
    return displayName;
  }
  if (typeof name === "string" && name.trim()) {
    return name;
  }
  return extension;
}

// Helper function to format numbers with commas
// const formatNumber = (value: number | undefined | null): string => {
//   const num = value || 0;
//   return num.toLocaleString('en-US');
// };

type MeetingDetailsModalProps = Readonly<{
  meeting: Record<string, unknown> | null;
  onHide: () => void;
}>;

type MeetingDetailsComputed = {
  meetingRecordNav: ReturnType<typeof getMeetingRecordNavigation>;
  relatedName: string;
  entityTypeLabel: string;
  subject: string;
  companyName: string;
  meetingTypeLabel: string;
  meetingTime: string;
  dateLabel: string;
  /** Google Meet (or primary join) URL from API `meet_link` / legacy fields */
  meetLink: string;
  /** Google Calendar event URL from API `invite_link` */
  inviteLink: string;
  notes: string;
  location: string;
  status: string;
  duration: string;
};

function buildMeetingDateDisplayLabel(
  meetingDateStr: string,
  meetingTimeRaw: string | undefined,
): string {
  const formatted = formatMeetingDateLocal(
    meetingDateStr || undefined,
    meetingTimeRaw,
  );
  if (formatted) {
    return formatted;
  }
  if (meetingDateStr) {
    return formatCrmPreviewDate(meetingDateStr);
  }
  return "";
}

function readMeetingJoinUrls(meeting: Record<string, unknown>) {
  const meetLink = pickFirstNonEmptyString(
    meeting.meet_link,
    meeting.meeting_link,
    meeting.join_url,
    meeting.url,
    meeting.meeting_url,
    meeting.hangout_link,
  );
  const inviteLink = pickFirstNonEmptyString(meeting.invite_link);
  return { meetLink, inviteLink };
}

function readMeetingTextFields(meeting: Record<string, unknown>) {
  const { meetLink, inviteLink } = readMeetingJoinUrls(meeting);
  return {
    subject: pickFirstNonEmptyString(meeting.name, meeting.title),
    companyName: pickFirstNonEmptyString(
      (meeting.record as { company_name?: string } | undefined)?.company_name,
      (meeting.lead as { company_name?: string } | undefined)?.company_name,
      (meeting.deal as { company_name?: string } | undefined)?.company_name,
    ),
    meetLink,
    inviteLink,
    notes: pickFirstNonEmptyString(
      meeting.notes,
      meeting.description,
      meeting.agenda,
    ),
    location: pickFirstNonEmptyString(meeting.location, meeting.venue),
    status: pickFirstNonEmptyString(meeting.status, meeting.state),
    duration: pickFirstNonEmptyString(
      meeting.duration,
      meeting.duration_minutes,
    ),
    meetingTypeLabel: pickFirstNonEmptyString(
      meeting.meeting_type,
      meeting.type,
    ),
  };
}

function computeMeetingDetails(meeting: Record<string, unknown>): MeetingDetailsComputed {
  const record = meeting.record as { id?: string | number } | undefined;
  const meetingRecordNav = getMeetingRecordNavigation(
    meeting.record_type,
    record?.id,
  );
  const relatedName = getMeetingRelatedRecordName(meeting);
  const entityTypeLabel = formatMeetingEntityTypeLabel(meeting.record_type);
  const textFields = readMeetingTextFields(meeting);
  const meetingDateStr = safeUnknownToDateString(meeting.meeting_date);
  const meetingTimeRaw =
    typeof meeting.meeting_time === "string" ? meeting.meeting_time : undefined;
  const meetingTime =
    meetingTimeRaw?.trim()
      ? formatMeetingTimeLocal(meetingDateStr, meetingTimeRaw)
      : "";
  const dateLabel = buildMeetingDateDisplayLabel(meetingDateStr, meetingTimeRaw);

  return {
    meetingRecordNav,
    relatedName,
    entityTypeLabel,
    subject: textFields.subject,
    companyName: textFields.companyName,
    meetingTypeLabel: textFields.meetingTypeLabel,
    meetingTime,
    dateLabel,
    meetLink: textFields.meetLink,
    inviteLink: textFields.inviteLink,
    notes: textFields.notes,
    location: textFields.location,
    status: textFields.status,
    duration: textFields.duration,
  };
}

async function copyAbsoluteOrAppUrlToClipboard(
  rawUrl: string,
  successMessage: string,
): Promise<void> {
  if (!rawUrl.trim()) {
    toast.error("No link available");
    return;
  }
  const toCopy = rawUrl.startsWith("http")
    ? rawUrl
    : buildAbsoluteAppUrl(rawUrl);
  try {
    await navigator.clipboard.writeText(toCopy);
    toast.success(successMessage);
  } catch (err) {
    console.error("Clipboard copy failed:", err);
    toast.error("Could not copy link");
  }
}

function MeetingDetailRow({ label, value }: Readonly<{ label: string; value: string }>) {
  if (!value) {
    return null;
  }
  return (
    <div className="row mb-2">
      <div className="col-sm-4 text-muted small">{label}</div>
      <div className="col-sm-8" style={dashboardWrapTextStyle}>
        {value}
      </div>
    </div>
  );
}

function MeetingDetailsModalBody({
  details,
}: Readonly<{
  details: MeetingDetailsComputed;
}>) {
  return (
    <>
      <MeetingDetailRow label="Subject" value={details.subject} />
      {details.companyName ? (
        <MeetingDetailRow label="Company" value={details.companyName} />
      ) : null}
      <MeetingDetailRow label="Meeting type" value={details.meetingTypeLabel} />
      <MeetingDetailRow label="Date" value={details.dateLabel} />
      {details.meetingTime ? (
        <MeetingDetailRow label="Time" value={details.meetingTime} />
      ) : null}
      {details.duration ? (
        <MeetingDetailRow label="Duration" value={details.duration} />
      ) : null}
      {details.location ? (
        <MeetingDetailRow label="Location" value={details.location} />
      ) : null}
      {details.status ? (
        <MeetingDetailRow label="Status" value={details.status} />
      ) : null}
      {details.notes ? <MeetingDetailRow label="Notes" value={details.notes} /> : null}
      <hr />
      <div className="mb-2 small text-muted">Related CRM record</div>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <span style={{ fontWeight: 600 }}>{details.relatedName}</span>
        <Badge
          bg="light"
          text="dark"
          style={{
            fontSize: "12px",
            border: "1px solid #E2E8F0",
          }}
        >
          {details.entityTypeLabel}
        </Badge>
      </div>
      <div className="d-flex flex-wrap gap-2">
        {details.meetLink ? (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() =>
              void copyAbsoluteOrAppUrlToClipboard(
                details.meetLink,
                "Meet link copied",
              )
            }
            className="d-inline-flex align-items-center gap-1"
          >
            <Copy size={14} aria-hidden />
            Copy Meet link
          </Button>
        ) : null}
        {details.meetLink ? (
          <Link
            href={details.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
          >
            <ExternalLink size={14} aria-hidden />
            Join Meet
          </Link>
        ) : null}
        {details.inviteLink ? (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() =>
              void copyAbsoluteOrAppUrlToClipboard(
                details.inviteLink,
                "Calendar invite link copied",
              )
            }
            className="d-inline-flex align-items-center gap-1"
          >
            <Copy size={14} aria-hidden />
            Copy calendar invite
          </Button>
        ) : null}
        {details.meetingRecordNav.href ? (
          <Link
            href={details.meetingRecordNav.href}
            className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"
          >
            <ExternalLink size={14} aria-hidden />
            Open record
          </Link>
        ) : null}
      </div>
    </>
  );
}

function MeetingDetailsModal({
  meeting,
  onHide,
}: MeetingDetailsModalProps) {
  const details = meeting ? computeMeetingDetails(meeting) : null;

  return (
    <Modal show={meeting !== null} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Meeting details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {details ? (
          <MeetingDetailsModalBody
            details={details}
          />
        ) : null}
      </Modal.Body>
    </Modal>
  );
}


interface CrmDashboardMainViewProps {
  session: ReturnType<typeof useSession>["data"];
  dashboardData: any;
  recentProspects: CrmDataItem[];
  leadToDealPercent: number;
  dealToOrderPercent: number;
  extensions: any[];
  selectedMeeting: Record<string, unknown> | null;
  setSelectedMeeting: React.Dispatch<
    React.SetStateAction<Record<string, unknown> | null>
  >;
}

function CrmDashboardMainView({
  session,
  dashboardData,
  recentProspects,
  leadToDealPercent,
  dealToOrderPercent,
  extensions,
  selectedMeeting,
  setSelectedMeeting,
}: Readonly<CrmDashboardMainViewProps>) {
    // Campaign Performance data from API
    const campaignData = dashboardData?.campaign_performance?.chart_data?.map((item: any) => ({
      name: item.month_label || item.month,
      Leads: Number(item.leads) || 0,
      Deals: Number(item.deals) || 0,
      Orders: Number(item.orders) || 0,
    })) || [];

    // Tasks data from API
    const tasksData = dashboardData?.task_statuses ? [
      { name: 'Completed', value: dashboardData.task_statuses.completed || 0, color: '#20C997' },
      { name: 'Pending', value: dashboardData.task_statuses.pending || 0, color: '#FFC107' },
      { name: 'Overdue', value: dashboardData.task_statuses.overdue || 0, color: '#FD7E14' },
    ] : [];

    const totalTasks = tasksData.reduce((sum, item) => sum + item.value, 0);
    const completedPercentage = totalTasks > 0 ? Math.round((tasksData[0]?.value / totalTasks) * 100) : 0;

    // Funnel: last 30 days volume (relative to prospects in window as 100%)
    const last30Counts = selectLast30DaysCounts(dashboardData as DashboardApiPayload);
    const prospectsCount = last30Counts.prospects;
    const leadsCount = last30Counts.leads;
    const dealsCount = last30Counts.deals;
    const ordersCount = last30Counts.orders;
    const conversionRatios = dashboardData?.conversion_ratios as
      | Record<string, unknown>
      | undefined;
    const leadToOrderConversionPercentage =
      readNumeric(conversionRatios?.order_conversion_percentage) ||
      readNumeric(conversionRatios?.lead_to_order) ||
      getLeadToOrderConversionPercentage(
        conversionRatios?.lead_to_order,
        leadsCount,
        ordersCount,
      );

    const prospectsPercentage = prospectsCount > 0 ? 100 : 0;
    const leadsPercentage = prospectsCount > 0 ? Math.round((leadsCount / prospectsCount) * 100) : 0;
    const dealsPercentage = prospectsCount > 0 ? Math.round((dealsCount / prospectsCount) * 100) : 0;
    const ordersPercentage = prospectsCount > 0 ? Math.round((ordersCount / prospectsCount) * 100) : 0;

    return (
      <React.Fragment>
        <BreadcrumbItem
          mainTitle="CRM"
          mainLink="/crm/dashboard"
          subTitle="Dashboard"
        />

     
  <>
        <Row className="mb-4 align-items-center">
            <Col xs={12} md={7} className="mb-2 mb-md-0">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 600, color: '#1E293B' }}>CRM Dashboard</h4>
                  <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748B' }}>
                    Track lead flow, conversion performance, tasks, meetings, and revenue in one place.
                  </p>
                </div>
              </div>
            </Col>

          </Row>

          {/* Top Stats */}
          {/* <Row className="g-3 mb-4">
            <Col xxl={2}  xl={4} lg={4} md={4} sm={6}>
              <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <Card.Body>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Users size={20} color="#0EA5E9" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '28px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>{formatNumber(dashboardData?.counts?.crm_data || 0, true)}</h3>
                      <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Prospects</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col  xxl={2}  xl={4} lg={4} md={4} sm={6}>
              <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <Card.Body>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <UserPlus size={20} color="#3B82F6" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '28px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>{formatNumber(dashboardData?.counts?.leads || 0, true)}</h3>
                      <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Leads</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col  xxl={2}  xl={4} lg={4} md={4} sm={6}>
              <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <Card.Body>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <DollarSign size={20} color="#F59E0B" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '28px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>{formatNumber(dashboardData?.counts?.deals || 0, true)}</h3>
                      <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Deals</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col  xxl={2}  xl={4} lg={4} md={4} sm={6}>
              <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <Card.Body>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ShoppingCart size={20} color="#F97316" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '28px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>{formatNumber(dashboardData?.counts?.orders || 0, true)}</h3>
                      <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Orders</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col  xxl={2}  xl={4} lg={4} md={4} sm={6}>
              <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <Card.Body>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <TrendingUp size={20} color="#0EA5E9" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '28px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>{dashboardData?.conversion_ratios?.lead_to_deal?.toFixed(2) || 0}%</h3>
                      <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Leads to Deals Conversion</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xxl={2}  xl={4} lg={4} md={4} sm={6}>
              <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <Card.Body>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <TrendingUp size={20} color="#10B981" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '28px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>{dashboardData?.conversion_ratios?.deal_to_order?.toFixed(2) || 0}%</h3>
                      <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Deals to Orders Conversion</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row> */}

  <div className="mb-4">
            <StatsCards
              gridMinWidth="180px"
              data={(() => {
                const api = dashboardData as DashboardApiPayload;
                const overall = selectDashboardOverallCounts(api);
                const conv = selectConversionRatesLast30Days(api);
                return [
                  {
                    title: "Prospects",
                    value: formatNumber(overall.prospects, true),
                    icon: Users,
                    iconColor: "#0EA5E9",
                    iconBgColor: "#E0F2FE",
                  },
                  {
                    title: "Leads",
                    value: formatNumber(overall.leads, true),
                    icon: UserPlus,
                    iconColor: "#3B82F6",
                    iconBgColor: "#DBEAFE",
                  },
                  {
                    title: "Deals",
                    value: formatNumber(overall.deals, true),
                    icon: DollarSign,
                    iconColor: "#F59E0B",
                    iconBgColor: "#FEF3C7",
                  },
                  {
                    title: "Orders",
                    value: formatNumber(overall.orders, true),
                    icon: ShoppingCart,
                    iconColor: "#F97316",
                    iconBgColor: "#FED7AA",
                  },
                  {
                    title: "Leads to Deals Conversion",
                    value: `${conv.leadToDeal.toFixed(2)}%`,
                    icon: TrendingUp,
                    iconColor: "#0EA5E9",
                    iconBgColor: "#E0F2FE",
                    subtitle: DASHBOARD_TIMEFRAME_LABEL,
                  },
                  {
                    title: "Deals to Orders Conversion",
                    value: `${conv.dealToOrder.toFixed(2)}%`,
                    icon: TrendingUp,
                    iconColor: "#10B981",
                    iconBgColor: "#D1FAE5",
                    subtitle: DASHBOARD_TIMEFRAME_LABEL,
                  },
                ];
              })()}
            />
          </div>

          {/* Main Content */}
          <Row className="g-4">
            {/* Left Column */}
            <Col xxl={4} xl={6} lg={12} md={12}>
              {/* Leads Funnel */}
              <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
                <Card.Body>
                  <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: '#1E293B' }}>Leads Funnel</h5>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: 0 }}>
                      Stage volume for the {DASHBOARD_TIMEFRAME_LABEL.toLowerCase()}
                    </p>
                    <Badge bg="light" text="dark" style={{ fontSize: '12px', fontWeight: 500, color: '#64748B', border: '1px solid #E2E8F0' }}>
                      {DASHBOARD_TIMEFRAME_LABEL}
                    </Badge>
                  </div>
                
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '14px', color: '#1E293B', fontWeight: 500 }}>Prospects</span>
                        <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>{formatNumber(prospectsCount, true)}</span>
                      </div>
                      <div style={{ flex: 1, marginLeft: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: '100%', maxWidth: '260px', height: '32px', backgroundColor: '#E6EEF9', borderRadius: '8px' }}>
                          <div style={{ width: `${prospectsPercentage}%`, height: '100%', backgroundColor: '#3B82F6', borderRadius: '8px' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '14px', color: '#1E293B', fontWeight: 500 }}>Leads</span>
                        <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>{formatNumber(leadsCount, true)}</span>
                      </div>
                      <div style={{ flex: 1, marginLeft: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: '100%', maxWidth: '260px', height: '32px', backgroundColor: '#ECFDF5', borderRadius: '8px' }}>
                          <div style={{ width: `${leadsPercentage}%`, height: '100%', backgroundColor: '#14B8A6', borderRadius: '8px' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '14px', color: '#1E293B', fontWeight: 500 }}>Deals</span>
                        <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>{formatNumber(dealsCount, true)}</span>
                      </div>
                      <div style={{ flex: 1, marginLeft: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: '100%', maxWidth: '260px', height: '32px', backgroundColor: '#FFFAEB', borderRadius: '8px' }}>
                          <div style={{ width: `${dealsPercentage}%`, height: '100%', backgroundColor: '#F59E0B', borderRadius: '8px' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '14px', color: '#1E293B', fontWeight: 500 }}>Orders</span>
                        <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>{formatNumber(ordersCount, true)}</span>
                      </div>
                      <div style={{ flex: 1, marginLeft: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: '100%', maxWidth: '260px', height: '32px', backgroundColor: '#FFF7ED', borderRadius: '8px' }}>
                          <div style={{ width: `${ordersPercentage}%`, height: '100%', backgroundColor: '#F97316', borderRadius: '8px' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Leads → Orders conversion: {leadToOrderConversionPercentage.toFixed(2)}%</p>
                </Card.Body>
              </Card>

              {/* Recent Activities */}
              <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <Card.Body>
                  <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: '#1E293B' }}>Recent Activities</h5>
                
                  <ListGroup variant="flush">
                    {(dashboardData?.recent_activities || []).slice(0, 5).map((activity: any, index: number) => {
                      const recordType = getRecordTypeFromAuditableType(activity.auditable_type);
                      const recordTypeLabel =
                        recordType.toLowerCase() === "ticket" ? "Lead" : recordType;
                      const activitySummary = getDashboardActivitySummary(
                        activity as AuditTrailEntry,
                      );
                      const getIcon = () => {
                        if (activity.type === 'lead') return <UserPlus size={16} color="#3B82F6" />;
                        if (activity.type === 'meeting') return <Calendar size={16} color="#10B981" />;
                        if (activity.type === 'followup') return <CheckCircle size={16} color="#10B981" />;
                        return <Users size={16} color="#10B981" />;
                      };
                      const getBgColor = () => {
                        if (activity.type === 'lead') return '#DBEAFE';
                        if (activity.type === 'meeting') return '#D1FAE5';
                        if (activity.type === 'followup') return '#D1FAE5';
                        return '#D1FAE5';
                      };
                      const getTypeLabel = () => {
                        if (activity.type === 'lead') return 'Lead';
                        if (activity.type === 'meeting') return 'Meeting';
                        if (activity.type === 'followup') return 'Follow-up';
                        return 'Activity';
                      };
                      return (
                        <ListGroup.Item key={activity.id || index} style={{ padding: '16px 0', border: 'none', borderBottom: index < 4 ? '1px solid #F1F5F9' : 'none' }}>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: getBgColor(), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {getIcon()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ ...dashboardWrapTextStyle, flex: 1 }}>
                                  <span style={{ fontSize: '13px', color: '#64748B' }}>
                                    {activity.created_at
                                      ? formatDashboardHistoryUtcDateTime(activity.created_at)
                                      : ""}
                                  </span>
                                  <div
                                    title={activitySummary}
                                    style={{
                                      ...dashboardWrapTextStyle,
                                      fontSize: '14px',
                                      color: '#1E293B',
                                      marginTop: '6px',
                                      fontWeight: 500,
                                      whiteSpace: 'pre-wrap',
                                      lineHeight: '1.5',
                                    }}
                                  >
                                    {activitySummary}
                                  </div>
                                </div>
                                <div style={{ padding: '4px 12px', backgroundColor: '#F1F5F9', borderRadius: '6px', fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                  {getTypeLabel()}
                                </div>
                              </div>
                              {activity.user_extension && (
                                <p style={{ ...dashboardWrapTextStyle, fontSize: '13px', color: '#94A3B8', margin: 0, marginTop: '8px' }}>
                                  Extension:{" "}
                                  {resolveExtensionDisplayName(
                                    extensions,
                                    String(activity.user_extension),
                                  )}
                                </p>
                              )}
                              {recordTypeLabel && (
                                <div style={{ marginTop: '8px', minWidth: 0 }}>
                                  <Badge bg="light" text="dark" style={{ fontSize: '12px', fontWeight: 500, color: '#64748B', border: '1px solid #E2E8F0' }}>
                                    {recordTypeLabel}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </ListGroup.Item>
                      );
                    })}
                    {(!dashboardData?.recent_activities || dashboardData.recent_activities.length === 0) && (
                      <ListGroup.Item style={{ padding: '16px 0', border: 'none' }}>
                        <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, textAlign: 'center' }}>No recent activities</p>
                      </ListGroup.Item>
                    )}
                  </ListGroup>
                </Card.Body>
              </Card>

              {/* Upcoming Meetings */}
              <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginTop: '24px' }}>
                <Card.Body>
                  <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1E293B' }}>Upcoming Meetings</h5>

                  {(dashboardData?.upcoming_meetings || []).length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, textAlign: 'center' }}>No upcoming meetings</p>
                  ) : (
                    <div>
                      <Table
                        hover
                        size="sm"
                        className="align-middle mb-0"
                        style={crmDashboardRecordTableStyle}
                      >
                        <thead className="text-muted small">
                          <tr>
                            <th style={crmDashboardActionThStyle} className="border-0">
                              <span className="visually-hidden">View</span>
                            </th>
                            <th>Meeting</th>
                            <th>Schedule</th>
                            <th>Related record</th>
                            <th style={crmDashboardActionThStyle} className="text-center border-0">
                              <span className="visually-hidden">Copy CRM or Meet link</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(dashboardData?.upcoming_meetings || []).slice(0, 5).map((meeting: Record<string, unknown>, index: number) => {
                            const meetingId = meeting.id;
                            const rowKey =
                              typeof meetingId === "string" || typeof meetingId === "number"
                                ? String(meetingId)
                                : `meeting-${index}`;
                            const subject = pickFirstNonEmptyString(
                              meeting.name,
                              meeting.title,
                            );
                            const companyName = pickFirstNonEmptyString(
                              (meeting.record as { company_name?: string } | undefined)?.company_name,
                              (meeting.lead as { company_name?: string } | undefined)?.company_name,
                              (meeting.deal as { company_name?: string } | undefined)?.company_name,
                            );
                            const meetingDateStr = safeUnknownToDateString(meeting.meeting_date);
                            const meetingTimeStr =
                              typeof meeting.meeting_time === "string"
                                ? meeting.meeting_time
                                : "";
                            const meetingTime =
                              meetingTimeStr.trim()
                                ? formatMeetingTimeLocal(meetingDateStr, meetingTimeStr)
                                : "";
                            const relatedName = getMeetingRelatedRecordName(meeting);
                            const entityTypeLabel = formatMeetingEntityTypeLabel(meeting.record_type);
                            const dateLabel =
                              formatMeetingDateLocal(
                                meetingDateStr || undefined,
                                meetingTimeStr || undefined,
                              ) ||
                              (meetingDateStr ? formatCrmPreviewDate(meetingDateStr) : "");
                            const { meetLink } = readMeetingJoinUrls(meeting);

                            return (
                              <tr key={rowKey}>
                                <td style={crmDashboardActionTdStyle}>
                                  <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    className="p-0 text-primary"
                                    title="Meeting details"
                                    aria-label="Meeting details"
                                    onClick={() => setSelectedMeeting(meeting)}
                                  >
                                    <Eye size={16} aria-hidden />
                                  </Button>
                                </td>
                                <td
                                  style={{ ...dashboardCellEllipsisStyle, cursor: "pointer" }}
                                  onClick={() => setSelectedMeeting(meeting)}
                                >
                                  <div style={{ fontWeight: 600, color: "#1E293B", fontSize: "13px" }}>
                                    {subject || "—"}
                                  </div>
                                  {companyName ? (
                                    <div className="small text-muted">{companyName}</div>
                                  ) : null}
                                  <div className="small text-muted mt-1">
                                    {pickFirstNonEmptyString(meeting.meeting_type, meeting.type) || "—"}
                                    {meetingTime ? ` · ${meetingTime}` : ""}
                                  </div>
                                </td>
                                <td
                                  className="text-nowrap small"
                                  style={{ ...dashboardCellEllipsisStyle, cursor: "pointer" }}
                                  onClick={() => setSelectedMeeting(meeting)}
                                >
                                  <div className="d-flex align-items-center gap-1">
                                    <Calendar size={14} className="text-muted flex-shrink-0" />
                                    <span>{dateLabel}</span>
                                  </div>
                                </td>
                                <td
                                  style={{ ...dashboardCellEllipsisStyle, cursor: "pointer" }}
                                  onClick={() => setSelectedMeeting(meeting)}
                                >
                                  <div style={{ fontWeight: 500, fontSize: "13px" }} title={relatedName}>
                                    {relatedName}
                                  </div>
                                  <Badge
                                    bg="light"
                                    text="dark"
                                    className="mt-1"
                                    style={{
                                      fontSize: "11px",
                                      fontWeight: 500,
                                      color: "#64748B",
                                      border: "1px solid #E2E8F0",
                                    }}
                                  >
                                    {entityTypeLabel}
                                  </Badge>
                                </td>
                                <td style={crmDashboardActionTdStyle}>
                                  <div className="d-flex align-items-center justify-content-center gap-1">
                                    <Button
                                      type="button"
                                      variant="link"
                                      size="sm"
                                      className="p-0 text-secondary"
                                      title="Copy Google Meet link"
                                      aria-label="Copy Google Meet link"
                                      disabled={!meetLink}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        void copyAbsoluteOrAppUrlToClipboard(
                                          meetLink,
                                          "Meet link copied",
                                        );
                                      }}
                                    >
                                      <Copy size={16} aria-hidden />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Middle Column */}
            <Col xxl={4} xl={6} lg={12} md={12}>
              {/* Orders Revenue */}
              <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
                <Card.Body>
                  <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#1E293B' }}>Orders Revenue</h5>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '13px', color: '#64748B', marginBottom: 0 }}>
                      Total order revenue for the {DASHBOARD_TIMEFRAME_LABEL.toLowerCase()}
                    </p>
                    <Badge bg="light" text="dark" style={{ fontSize: '12px', fontWeight: 500, color: '#64748B', border: '1px solid #E2E8F0' }}>
                      {DASHBOARD_TIMEFRAME_LABEL}
                    </Badge>
                  </div>
                
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <h2 style={{ fontSize: '32px', fontWeight: 700, margin: 0, color: '#1E293B' }}>AED {formatNumber(dashboardData?.order_revenue_aed || 0)}</h2>
                    <div style={{ height: '32px' }}>
                      <svg width="120" height="32" viewBox="0 0 120 32">
                        <path d="M0,16 L10,20 L20,12 L30,18 L40,8 L50,14 L60,10 L70,6 L80,4 L90,8 L100,6 L110,4 L120,2" 
                              fill="none" 
                              stroke="#10B981" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px 0' }}>
                    Revenue from orders created within the {DASHBOARD_TIMEFRAME_LABEL.toLowerCase()}.
                  </p>

                  <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: '1.6' }}>
                    Tip: Track pipeline volume in the Leads Funnel to monitor conversion rates. Revenue is only generated at the Orders stage.
                  </p>
                </Card.Body>
              </Card>

              {/* Tasks Completion */}
              <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
                <Card.Body>
                  <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: '#1E293B' }}>Tasks Completion</h5>
                
                  <Row>
                    <Col md={6}>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={tasksData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {tasksData.map((entry) => (
                              <Cell
                                key={`task-pie-${entry.name}-${entry.color}`}
                                fill={entry.color}
                              />
                            ))}
                          </Pie>
                          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '28px', fontWeight: 700, fill: '#1E293B' }}>
                            {completedPercentage}%
                          </text>
                          <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '13px', fill: '#64748B' }}>
                            Completed
                          </text>
                        </PieChart>
                      </ResponsiveContainer>
                    </Col>
                    <Col md={6} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {tasksData.map((item) => (
                        <div
                          key={`task-legend-${item.name}`}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color }}></div>
                            <span style={{ fontSize: '14px', color: '#64748B' }}>{item.name}</span>
                          </div>
                          <span style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B' }}>{item.value}</span>
                        </div>
                      ))}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Upcoming Tasks */}
              <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <Card.Body>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h5 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#1E293B' }}>Upcoming Tasks</h5>
                    {session?.user?.permissions?.includes(PERMISSIONS.VIEW_CRM_TASKS) && (
                    <Link href="/crm/tasks" style={{ fontSize: '14px', color: '#3B82F6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      View All <ChevronRight size={16} />
                    </Link>
                    )}

                  </div>

                  <ListGroup variant="flush">
                    {(dashboardData?.upcoming_tasks || []).slice(0, 5).map((task: any, index: number) => {
                      const initials = task.name ? task.name.charAt(0).toUpperCase() : 'T';
                      const isOverdue = task.status === 'overdue';
                      const bgColor = isOverdue ? '#F1F5F9' : '#D1FAE5';
                      const textColor = isOverdue ? '#64748B' : '#10B981';
                      return (
                        <ListGroup.Item key={task.id || index} style={{ padding: '16px 0', border: 'none', borderBottom: index < (dashboardData?.upcoming_tasks?.length || 0) - 1 ? '1px solid #F1F5F9' : 'none' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px', fontWeight: 600, color: '#3B82F6' }}>
                              {initials}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h6 style={{ ...dashboardWrapTextStyle, fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>{task.name}</h6>
                              {task.company_name && (
                                <p style={{ ...dashboardWrapTextStyle, fontSize: '13px', color: '#64748B', margin: 0 }}>{task.company_name}</p>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', backgroundColor: bgColor, borderRadius: '6px',textTransform: 'uppercase', flexShrink: 0 }}>
                              <Calendar size={14} color={textColor} />
                              <span style={{ fontSize: '13px', color: textColor, fontWeight: 500 }}>
                                {task.due_date ? formatCrmPreviewDate(task.due_date) : "—"}
                              </span>
                            </div>
                          </div>
                        </ListGroup.Item>
                      );
                    })}
                    {(!dashboardData?.upcoming_tasks || dashboardData.upcoming_tasks.length === 0) && (
                      <ListGroup.Item style={{ padding: '16px 0', border: 'none' }}>
                        <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, textAlign: 'center' }}>No upcoming tasks</p>
                      </ListGroup.Item>
                    )}
                  </ListGroup>
                </Card.Body>
              </Card>

              {/* Recent Deals */}
              <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginTop: '24px', marginBottom: '16px' }}>
                <Card.Body style={{ padding: '20px' }}>
                  <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1E293B' }}>Recent Deals</h5>
                  {(!dashboardData?.recent_deals || dashboardData.recent_deals.length === 0) ? (
                    <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, textAlign: 'center' }}>No recent deals</p>
                  ) : (
                    <Table hover size="sm" className="align-middle mb-0" style={crmDashboardRecordTableStyle}>
                      <thead className="text-muted small">
                        <tr>
                          <th style={crmDashboardActionThStyle} className="border-0"><span className="visually-hidden">View</span></th>
                          <th>Deal</th>
                          <th style={{ width: "26%" }}>Stage</th>
                          <th className="text-end" style={{ width: "22%" }}>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(dashboardData?.recent_deals || []).slice(0, 5).map((deal: DealData & { ticket?: { company_name?: string }; stage?: { name?: string; color?: string } }) => {
                          const displayName = pickFirstNonEmptyString(
                            deal.company_name,
                            deal.ticket?.company_name,
                            deal.name,
                          );
                          const dealValue = deal.grand_total || deal.net_value || 0;
                          const currency = deal.currency || "AED";
                          const stageName = deal.stage?.name || "—";
                          const stageColor = deal.stage?.color || "#64748B";
                          const href = getCrmRecordDetailHref("deal", deal.id);
                          const createdHint = deal.created_at
                            ? formatCrmPreviewDate(deal.created_at)
                            : "";
                          const dealRowTitle = [displayName, createdHint]
                            .filter((part) => part.length > 0)
                            .join(" · ");
                          return (
                            <tr key={deal.id}>
                              <td style={crmDashboardActionTdStyle}>
                                <CrmDetailEyeLink href={href} label={`View deal ${displayName}`} />
                              </td>
                              <td style={{ ...dashboardCellEllipsisStyle }} title={dealRowTitle}>
                                <div className="fw-medium" style={{ fontSize: "13px" }}>{displayName}</div>
                              </td>
                              <td className="small" style={{ ...dashboardCellEllipsisStyle, color: stageColor, fontWeight: 500 }} title={stageName}>
                                {stageName}
                              </td>
                              <td className="text-end small text-nowrap" title={`${currency} ${formatNumber(Number(dealValue))}`}>
                                {currency} {formatNumber(Number(dealValue))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>

              {/* Recent Orders */}
              <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <Card.Body style={{ padding: '20px' }}>
                  <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1E293B' }}>Recent Orders</h5>
                  {(!dashboardData?.recent_orders || dashboardData.recent_orders.length === 0) ? (
                    <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, textAlign: 'center' }}>No recent orders</p>
                  ) : (
                    <Table hover size="sm" className="align-middle mb-0" style={crmDashboardRecordTableStyle}>
                      <thead className="text-muted small">
                        <tr>
                          <th style={crmDashboardActionThStyle} className="border-0"><span className="visually-hidden">View</span></th>
                          <th style={{ width: "28%" }}>Order</th>
                          <th>Customer</th>
                          <th className="text-end" style={{ width: "24%" }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Array.isArray(dashboardData?.recent_orders)
                          ? (dashboardData.recent_orders as Record<string, unknown>[])
                          : []
                        ).slice(0, 5).map((row) => {
                          const orderIdStr = safeScalarToString(row.id);
                          const orderNumRaw =
                            typeof row.order_number === "string"
                              ? row.order_number
                              : "";
                          const orderNumber = pickFirstNonEmptyString(
                            orderNumRaw,
                            orderIdStr ? `ORD-${orderIdStr}` : "",
                          );
                          const customerName = pickFirstNonEmptyString(row.customer_name);
                          const amount = pickFirstNonEmptyString(row.final_amount, row.total_amount, "0");
                          const currency = pickFirstNonEmptyString(row.currency, "AED");
                          const status = pickFirstNonEmptyString(row.status);
                          const stageName = pickFirstNonEmptyString(
                            (row.stage as { name?: string } | undefined)?.name,
                          );
                          const href = getCrmRecordDetailHref(
                            "order",
                            row.id as number | string | undefined,
                          );
                          const orderRowKey = orderIdStr || orderNumber;
                          return (
                            <tr key={orderRowKey}>
                              <td style={crmDashboardActionTdStyle}>
                                <CrmDetailEyeLink href={href} label={`View order ${orderNumber}`} />
                              </td>
                              <td className="small text-nowrap fw-medium" style={dashboardCellEllipsisStyle} title={orderNumber}>
                                {orderNumber}
                              </td>
                              <td style={{ ...dashboardCellEllipsisStyle, fontSize: "13px" }} title={customerName}>
                                {customerName || "—"}
                                {status ? (
                                  <div className="text-muted" style={{ fontSize: "11px" }}>{status}{stageName ? ` · ${stageName}` : ""}</div>
                                ) : null}
                              </td>
                              <td className="text-end small text-nowrap">
                                {currency} {formatNumber(Number(amount))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Right Column */}
            <Col xxl={4} xl={12} lg={12} md={12}>
              {/* CRM Pipeline */}
              <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
                <Card.Body style={{ padding: '20px' }}>
                  <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: '#1E293B' }}>CRM Pipeline</h5>
                
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={campaignData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" iconSize={8} />
                      <Line type="monotone" dataKey="Leads" stroke="#14B8A6" strokeWidth={2} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="Deals" stroke="#F59E0B" strokeWidth={2} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="Orders" stroke="#F97316" strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>

              {/* Recent Prospects */}
              <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
                <Card.Body style={{ padding: '20px' }}>
                  <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1E293B' }}>Recent Prospects</h5>
                  {recentProspects.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, textAlign: 'center' }}>No recent prospects</p>
                  ) : (
                    <Table hover size="sm" className="align-middle mb-0" style={crmDashboardRecordTableStyle}>
                      <thead className="text-muted small">
                        <tr>
                          <th style={crmDashboardActionThStyle} className="border-0"><span className="visually-hidden">View</span></th>
                          <th>Name</th>
                          <th>Phone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentProspects.map((prospect) => {
                          const href = getCrmRecordDetailHref("prospect", prospect.id);
                          return (
                            <tr key={prospect.id}>
                              <td style={crmDashboardActionTdStyle}>
                                <CrmDetailEyeLink href={href} label={`View prospect ${prospect.name || prospect.id}`} />
                              </td>
                              <td style={{ ...dashboardCellEllipsisStyle, fontWeight: 500 }} title={prospect.name || "—"}>
                                {prospect.name || "—"}
                              </td>
                              <td className="small text-muted" style={dashboardCellEllipsisStyle} title={prospect.phone || ""}>
                                {prospect.phone || "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>

              {/* Recent Leads */}
              <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
                <Card.Body style={{ padding: '20px' }}>
                  <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1E293B' }}>Recent Leads</h5>
                  {(!dashboardData?.recent_leads || dashboardData.recent_leads.length === 0) ? (
                    <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, textAlign: 'center' }}>No recent leads</p>
                  ) : (
                    <Table hover size="sm" className="align-middle mb-0" style={crmDashboardRecordTableStyle}>
                      <thead className="text-muted small">
                        <tr>
                          <th style={crmDashboardActionThStyle} className="border-0"><span className="visually-hidden">View</span></th>
                          <th style={{ width: "34%" }}>Lead</th>
                          <th style={{ width: "34%" }}>Campaign</th>
                          <th style={{ width: "26%" }}>Stage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(dashboardData?.recent_leads || []).slice(0, 5).map((lead: LeadData & { campaign?: { name?: string }; company_name?: string }) => {
                          const campaignName = lead.campaign?.name || "—";
                          const stageName = lead.stage?.name || "—";
                          const stageColor = lead.stage?.color || "#64748B";
                          const href = getCrmRecordDetailHref("lead", lead.id);
                          const primaryLabel = pickFirstNonEmptyString(lead.company_name, lead.name);
                          return (
                            <tr key={lead.id}>
                              <td style={crmDashboardActionTdStyle}>
                                <CrmDetailEyeLink href={href} label={`View lead ${primaryLabel}`} />
                              </td>
                              <td style={{ ...dashboardCellEllipsisStyle }} title={primaryLabel}>
                                <div className="fw-medium" style={{ fontSize: "13px" }}>{primaryLabel || "—"}</div>
                                {lead.company_name && lead.name && lead.company_name !== lead.name ? (
                                  <div className="text-muted small">{lead.name}</div>
                                ) : null}
                              </td>
                              <td className="small" style={dashboardCellEllipsisStyle} title={campaignName}>{campaignName}</td>
                              <td className="small" style={{ ...dashboardCellEllipsisStyle, color: stageColor, fontWeight: 500 }} title={stageName}>
                                {stageName}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>

            </Col>
          </Row>
        </>

        <MeetingDetailsModal
          meeting={selectedMeeting}
          onHide={() => setSelectedMeeting(null)}
        />
      </React.Fragment>
    );

}

/** Mirrors legacy `getCrmDashboard().then((res) => res.data.data)` when the client still returns a nested envelope. */
function unwrapCrmDashboardFromGetResponse(res: unknown): unknown {
  if (typeof res !== "object" || res === null || !("data" in res)) {
    return res;
  }
  const outer = res as { data: unknown };
  const inner = outer.data;
  if (typeof inner !== "object" || inner === null || !("data" in inner)) {
    return res;
  }
  return (inner as { data: unknown }).data;
}

type CrmDashboardHomeBundle = {
  dashboard: unknown;
  crmProspectsResponse: CrmDataResponse;
};

const CrmDashboard = () => {
  const { data: session } = useSession();
  const [selectedMeeting, setSelectedMeeting] = useState<Record<
    string,
    unknown
  > | null>(null);

  const dashboardQuery = useQuery({
    queryKey: crmAppKeys.crmDashboard.home(),
    queryFn: async (): Promise<CrmDashboardHomeBundle> => {
      const [dashboard, crmProspectsResponse] = await Promise.all([
        getCrmDashboard().then(unwrapCrmDashboardFromGetResponse),
        getCrmData({ per_page: 5 }),
      ]);
      return {
        dashboard,
        crmProspectsResponse,
      };
    },
  });

  const dashboardExtensionsQuery = useQuery({
    queryKey: crmAppKeys.hierarchyExtensions.module(ModuleSlug.CRM_LEADS),
    queryFn: async () => {
      const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_LEADS);
      return hierarchyData?.extensions ?? [];
    },
  });

  const extensions = dashboardExtensionsQuery.data ?? [];

  const dashboardData = dashboardQuery.data?.dashboard ?? null;
  const recentProspects = useMemo((): CrmDataItem[] => {
    const rows = dashboardQuery.data?.crmProspectsResponse?.data;
    return (rows || []).slice(0, 5);
  }, [dashboardQuery.data?.crmProspectsResponse?.data]);

  const { leadToDealPercent, dealToOrderPercent } = useMemo(() => {
    const dashboard = dashboardQuery.data?.dashboard;
    if (dashboard == null) {
      return { leadToDealPercent: 0, dealToOrderPercent: 0 };
    }
    const apiPayload = dashboard as DashboardApiPayload;
    const conv = selectConversionRatesLast30Days(apiPayload);
    return {
      leadToDealPercent: conv.leadToDeal,
      dealToOrderPercent: conv.dealToOrder,
    };
  }, [dashboardQuery.data?.dashboard]);

  const loading = dashboardQuery.isLoading;
  const errorMessage = useMemo(() => {
    if (!dashboardQuery.isError) return null;
    if (
      dashboardQuery.error instanceof Error &&
      dashboardQuery.error.message.trim().length > 0
    ) {
      return dashboardQuery.error.message;
    }
    return "Failed to load dashboard data";
  }, [dashboardQuery.error, dashboardQuery.isError]);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <Spinner animation="border">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="alert alert-danger" role="alert">
        {errorMessage}
        <Button
          variant="outline-danger"
          size="sm"
          className="ms-3"
          onClick={() => {
            void dashboardQuery.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <CrmDashboardMainView
      session={session}
      dashboardData={dashboardData}
      recentProspects={recentProspects}
      leadToDealPercent={leadToDealPercent}
      dealToOrderPercent={dealToOrderPercent}
      extensions={extensions}
      selectedMeeting={selectedMeeting}
      setSelectedMeeting={setSelectedMeeting}
    />
  );
};

CrmDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmDashboard;
