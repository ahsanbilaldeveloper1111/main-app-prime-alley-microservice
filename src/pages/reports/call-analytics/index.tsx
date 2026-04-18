import { ReactElement, useCallback, useMemo, useState } from "react";
import moment from "moment";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Eye } from "lucide-react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable from "@components/GenericTable";
import type {
    TableAction,
    TableColumn,
    ToolbarConfig,
} from "@components/GenericTable";
import GenericSidebar, { SidebarSection } from "@components/GenericSidebarNew";
import Layout from "@layout/index";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@assets/scss/reports.scss";

const { PERMISSIONS } = HEADER_CONSTANTS;

type ReportDefinition = {
    id: string;
    title: string;
    description: string;
    type: string;
    href: string;
    permission: string;
};

type ReportRow = {
    id: string;
    title: string;
    description: string;
    type: string;
    lastRun: string;
    href: string;
    permission: string;
};

function buildReportSidebarSections(report: ReportRow): SidebarSection[] {
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

const REPORT_DEFINITIONS: readonly ReportDefinition[] = [
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

const REPORT_COLUMNS: TableColumn<ReportRow>[] = [
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

const PageReports = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [showPreviewSidebar, setShowPreviewSidebar] = useState(false);
    const [selectedPreviewReport, setSelectedPreviewReport] = useState<ReportRow | null>(null);

    const userPermissions = session?.user?.permissions ?? [];
    const lastRunLabel = useMemo(() => moment().format("MMM D, YYYY"), []);

    const availableReports = useMemo<ReportRow[]>(() => {
        return REPORT_DEFINITIONS.filter((report) =>
            userPermissions.includes(report.permission),
        ).map((report) => ({
            id: report.id,
            title: report.title,
            description: report.description,
            type: report.type,
            lastRun: lastRunLabel,
            href: report.href,
            permission: report.permission,
        }));
    }, [lastRunLabel, userPermissions]);

    const visibleReports = useMemo<ReportRow[]>(() => {
        const query = searchQuery.trim().toLowerCase();
        if (query.length === 0) {
            return availableReports;
        }
        return availableReports.filter((report) => {
            return (
                report.title.toLowerCase().includes(query) ||
                report.description.toLowerCase().includes(query) ||
                report.type.toLowerCase().includes(query)
            );
        });
    }, [availableReports, searchQuery]);

    const reportActions = useMemo<TableAction<ReportRow>[]>(
        () => [
            {
                label: "View",
                onClick: (row) => router.push(row.href),
            },
        ],
        [router],
    );

    const handlePreviewClick = useCallback((row: ReportRow) => {
        setSelectedPreviewReport(row);
        setShowPreviewSidebar(true);
    }, []);

    const handleClosePreviewSidebar = useCallback(() => {
        setShowPreviewSidebar(false);
        setSelectedPreviewReport(null);
    }, []);

    const previewSections = useMemo<SidebarSection[]>(() => {
        if (selectedPreviewReport === null) {
            return [];
        }
        return buildReportSidebarSections(selectedPreviewReport);
    }, [selectedPreviewReport]);

    const previewQuickActions = useMemo(() => {
        if (selectedPreviewReport === null) {
            return [];
        }
        return [
            {
                id: "open-report",
                label: "Open Report",
                icon: Eye,
                onClick: () => router.push(selectedPreviewReport.href),
            },
        ];
    }, [router, selectedPreviewReport]);

    const toolbar = useMemo<ToolbarConfig>(
        () => ({
            showTabs: true,
            tabs: [
                {
                    id: "call-reports",
                    label: "Call Reports",
                    count: visibleReports.length,
                },
            ],
            activeTab: "call-reports",
            showSearch: true,
            searchValue: searchQuery,
            searchPlaceholder: "Search call reports",
            onSearchChange: setSearchQuery,
        }),
        [searchQuery, visibleReports.length],
    );

    return (
        <>
            <BreadcrumbItem mainTitle="Reports" mainLink="/reports" subTitle="Reports" />
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    width: "100%",
                    minWidth: 0,
                }}
            >
                <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                    <GenericTable<ReportRow>
                        data={visibleReports}
                        columns={REPORT_COLUMNS}
                        uniqueKey="id"
                        showActions
                        showToolbarActions={false}
                        actions={reportActions}
                        showToolbar
                        toolbar={toolbar}
                        onPreviewClick={handlePreviewClick}
                        emptyMessage="No call reports available for your permissions."
                    />
                </div>

                {showPreviewSidebar && selectedPreviewReport !== null && (
                    <div style={{ flex: "0 0 470px", width: 470, maxWidth: "40vw" }}>
                        <GenericSidebar
                            isOpen={showPreviewSidebar}
                            onClose={handleClosePreviewSidebar}
                            width="100%"
                            title={selectedPreviewReport.title}
                            subtitle={selectedPreviewReport.type}
                            avatar={{
                                initials: "CR",
                                name: selectedPreviewReport.title,
                                gradient: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)",
                            }}
                            quickActions={previewQuickActions}
                            sections={previewSections}
                            recordLink={{
                                label: "View report",
                                onClick: () => router.push(selectedPreviewReport.href),
                            }}
                            actionsDropdown={{
                                label: "Actions",
                                items: [
                                    {
                                        label: "Open report",
                                        onClick: () => router.push(selectedPreviewReport.href),
                                    },
                                ],
                            }}
                            permissionMessage="Preview shows only values available in this reports table data source."
                        />
                    </div>
                )}
            </div>
        </>
    );
};

PageReports.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default PageReports;
