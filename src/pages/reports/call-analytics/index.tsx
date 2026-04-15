import { ReactElement, useMemo, useState } from "react";
import moment from "moment";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable from "@components/GenericTable";
import type {
    TableAction,
    TableColumn,
    ToolbarConfig,
} from "@components/GenericTable";
import Layout from "@layout/index";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@assets/scss/reports.scss";

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
};

const REPORT_DEFINITIONS: readonly ReportDefinition[] = [
    {
        id: "stats-country",
        title: "Call Stats By Country",
        description:
            "Visualize call volumes, durations, and trends across countries with dynamic charts and detailed metrics.",
        type: "Call Outbound",
        href: "/reports/call-analytics/stats/country",
        permission: "call-reports-by-statistics-reports",
    },
    {
        id: "stats-department",
        title: "Call Stats By Department",
        description:
            "Visualize call volumes, durations, and trends across departments with dynamic charts and detailed metrics.",
        type: "Call Outbound",
        href: "/reports/call-analytics/stats/department",
        permission: "call-reports-by-statistics-reports",
    },
    {
        id: "stats-extension",
        title: "Call Stats By Extension",
        description:
            "Visualize call volumes, durations, and trends across extensions with dynamic charts and detailed metrics.",
        type: "Call Outbound",
        href: "/reports/call-analytics/stats/extension",
        permission: "call-reports-by-statistics-reports",
    },
    {
        id: "stats-department-extension",
        title: "Call Stats By Department Extension",
        description:
            "Visualize call volumes, durations, and trends across departments extensions with dynamic charts and detailed metrics.",
        type: "Inbound/Outbound",
        href: "/reports/call-analytics/stats/department/extension",
        permission: "call-reports-by-statistics-reports",
    },
    {
        id: "stats-general",
        title: "General Call Statistics",
        description:
            "Visualize call volumes, durations, and trends across all calls with dynamic charts and detailed metrics.",
        type: "Call Outbound",
        href: "/reports/call-analytics/stats/general",
        permission: "call-reports-by-statistics-reports",
    },
    {
        id: "incoming-country",
        title: "Call Incoming By Country",
        description:
            "Visualize call volumes, durations, and trends across countries with dynamic charts and detailed metrics.",
        type: "Call Incoming",
        href: "/reports/call-analytics/incoming/country",
        permission: "call-reports-by-call-incoming-reports",
    },
    {
        id: "incoming-department",
        title: "Call Incoming By Department",
        description:
            "Visualize call volumes, durations, and trends across departments with dynamic charts and detailed metrics.",
        type: "Call Incoming",
        href: "/reports/call-analytics/incoming/department",
        permission: "call-reports-by-call-incoming-reports",
    },
    {
        id: "incoming-extension",
        title: "Call Incoming By Extension",
        description:
            "Visualize call volumes, durations, and trends across extensions with dynamic charts and detailed metrics.",
        type: "Call Incoming",
        href: "/reports/call-analytics/incoming/extension",
        permission: "call-reports-by-call-incoming-reports",
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

            <GenericTable<ReportRow>
                data={visibleReports}
                columns={REPORT_COLUMNS}
                uniqueKey="id"
                showActions
                showToolbarActions={false}
                actions={reportActions}
                showToolbar
                toolbar={toolbar}
                emptyMessage="No call reports available for your permissions."
            />
        </>
    );
};

PageReports.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default PageReports;
