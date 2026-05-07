import { ReactElement, useCallback, useMemo, useState } from "react";
import moment from "moment";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Eye } from "lucide-react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable from "@components/GenericTable";
import type { TableAction, ToolbarConfig } from "@components/GenericTable";
import GenericSidebar from "@components/GenericSidebarNew";
import Layout from "@layout/index";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@assets/scss/reports.scss";
import {
    CALL_ANALYTICS_REPORT_COLUMNS,
    CALL_ANALYTICS_REPORT_DEFINITIONS,
    buildCallAnalyticsReportSidebarSections,
    type CallAnalyticsReportRow,
} from "./callAnalyticsReportCatalog";

const PageReports = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [showPreviewSidebar, setShowPreviewSidebar] = useState(false);
    const [selectedPreviewReport, setSelectedPreviewReport] = useState<CallAnalyticsReportRow | null>(null);

    const userPermissions = session?.user?.permissions ?? [];
    const lastRunLabel = useMemo(() => moment().format("MMM D, YYYY"), []);

    const availableReports = useMemo<CallAnalyticsReportRow[]>(() => {
        return CALL_ANALYTICS_REPORT_DEFINITIONS.filter((report) =>
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

    const visibleReports = useMemo<CallAnalyticsReportRow[]>(() => {
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

    const reportActions = useMemo<TableAction<CallAnalyticsReportRow>[]>(
        () => [
            {
                label: "View",
                onClick: (row) => router.push(row.href),
            },
        ],
        [router],
    );

    const handlePreviewClick = useCallback((row: CallAnalyticsReportRow) => {
        setSelectedPreviewReport(row);
        setShowPreviewSidebar(true);
    }, []);

    const handleClosePreviewSidebar = useCallback(() => {
        setShowPreviewSidebar(false);
        setSelectedPreviewReport(null);
    }, []);

    const previewSections = useMemo(() => {
        if (selectedPreviewReport === null) {
            return [];
        }
        return buildCallAnalyticsReportSidebarSections(selectedPreviewReport);
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
                    <GenericTable<CallAnalyticsReportRow>
                        data={visibleReports}
                        columns={CALL_ANALYTICS_REPORT_COLUMNS}
                        uniqueKey="id"
                        showActions
                        showToolbarActions={false}
                        actions={reportActions}
                        showToolbar
                        toolbar={toolbar}
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
