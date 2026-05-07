import type { SidebarSection } from "@components/GenericSidebarNew";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import type { TableColumn } from "@components/GenericTable";

const { PERMISSIONS } = HEADER_CONSTANTS;

export type CallAnalyticsReportDefinition = {
  id: string;
  title: string;
  description: string;
  type: string;
  href: string;
  permission: string;
};

export type CallAnalyticsReportRow = {
  id: string;
  title: string;
  description: string;
  type: string;
  lastRun: string;
  href: string;
  permission: string;
};

export function buildCallAnalyticsReportSidebarSections(
  report: CallAnalyticsReportRow,
): SidebarSection[] {
  return [
    {
      id: "about-report",
      title: "About this report",
      collapsible: true,
      defaultExpanded: true,
      fields: [
        { label: "Report Name", value: report.title },
        { label: "Type", value: report.type },
        { label: "Last Run", value: report.lastRun },
        { label: "Permission", value: report.permission },
        { label: "Route", value: report.href, copyable: true },
        { label: "Description", value: report.description },
      ],
    },
  ];
}

export const CALL_ANALYTICS_REPORT_DEFINITIONS: readonly CallAnalyticsReportDefinition[] = [
  {
    id: "stats-country",
    title: "Call Stats By Country",
    description:
      "Visualize call volumes, durations, and trends across countries with dynamic charts and detailed metrics.",
    type: "Call Outbound",
    href: "/reports/call-analytics/stats/country",
    permission: PERMISSIONS.CALL_STATS_BY_COUNTRY_REPORTS,
  },
  {
    id: "stats-department",
    title: "Call Stats By Department",
    description:
      "Visualize call volumes, durations, and trends across departments with dynamic charts and detailed metrics.",
    type: "Call Outbound",
    href: "/reports/call-analytics/stats/department",
    permission: PERMISSIONS.CALL_STATS_BY_DEPARTMENT_REPORTS,
  },
  {
    id: "stats-extension",
    title: "Call Stats By Extension",
    description:
      "Visualize call volumes, durations, and trends across extensions with dynamic charts and detailed metrics.",
    type: "Call Outbound",
    href: "/reports/call-analytics/stats/extension",
    permission: PERMISSIONS.CALL_STATS_BY_EXTENSION_REPORTS,
  },
  {
    id: "stats-department-extension",
    title: "Call Stats By Department Extension",
    description:
      "Visualize call volumes, durations, and trends across departments extensions with dynamic charts and detailed metrics.",
    type: "Inbound/Outbound",
    href: "/reports/call-analytics/stats/department/extension",
    permission: PERMISSIONS.CALL_STATS_BY_DEPARTMENT_EXTENSION_REPORTS,
  },
  {
    id: "stats-general",
    title: "General Call Statistics",
    description:
      "Visualize call volumes, durations, and trends across all calls with dynamic charts and detailed metrics.",
    type: "Call Outbound",
    href: "/reports/call-analytics/stats/general",
    permission: PERMISSIONS.GENERAL_CALL_STATISTICS_REPORTS,
  },
  {
    id: "incoming-country",
    title: "Call Incoming By Country",
    description:
      "Visualize call volumes, durations, and trends across countries with dynamic charts and detailed metrics.",
    type: "Call Incoming",
    href: "/reports/call-analytics/incoming/country",
    permission: PERMISSIONS.CALL_INCOMING_BY_COUNTRY_REPORTS,
  },
  {
    id: "incoming-department",
    title: "Call Incoming By Department",
    description:
      "Visualize call volumes, durations, and trends across departments with dynamic charts and detailed metrics.",
    type: "Call Incoming",
    href: "/reports/call-analytics/incoming/department",
    permission: PERMISSIONS.CALL_INCOMING_BY_DEPARTMENT_REPORTS,
  },
  {
    id: "incoming-extension",
    title: "Call Incoming By Extension",
    description:
      "Visualize call volumes, durations, and trends across extensions with dynamic charts and detailed metrics.",
    type: "Call Incoming",
    href: "/reports/call-analytics/incoming/extension",
    permission: PERMISSIONS.CALL_INCOMING_BY_EXTENSION_REPORTS,
  },
];

export const CALL_ANALYTICS_REPORT_COLUMNS: TableColumn<CallAnalyticsReportRow>[] = [
  {
    key: "title",
    label: "Report",
    sortable: true,
    width: "280px",
    render: (row) => <span style={{ fontWeight: 600 }}>{row.title}</span>,
  },
  {
    key: "description",
    label: "Description",
    sortable: false,
    width: "560px",
    render: (row) => (
      <span
        style={{
          color: "#374151",
          display: "block",
          minWidth: "560px",
          width: "560px",
          maxWidth: "560px",
          whiteSpace: "normal",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
          lineHeight: 1.4,
        }}
      >
        {row.description}
      </span>
    ),
  },
  {
    key: "type",
    label: "Type",
    sortable: true,
    width: "170px",
    type: "text",
  },
  {
    key: "lastRun",
    label: "Last Run",
    sortable: true,
    width: "140px",
    type: "text",
  },
];
