import { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Eye } from "lucide-react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable from "@components/GenericTable";
import type { TableAction, ToolbarConfig } from "@components/GenericTable";
import GenericSidebar from "@components/GenericSidebarNew";
import Layout from "@layout/index";
import { CrmListPageScopedLayoutStyles } from "@crm/shared/CrmListPageScopedLayoutStyles";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@assets/scss/reports.scss";
import "@page-modules/reports/call-analytics/callAnalyticsReportsList.scss";
import {
    CALL_ANALYTICS_REPORT_COLUMNS,
    CALL_ANALYTICS_REPORT_DEFINITIONS,
    buildCallAnalyticsReportSidebarSections,
    type CallAnalyticsReportRow,
} from "@page-modules/reports/call-analytics/callAnalyticsReportCatalog";

const CALL_ANALYTICS_LIST_LAYOUT = {
    tableWrapperClass: "call-analytics-reports-list",
    scrollableContentClass: "prospects-scrollable-content",
    pageContainerClass: "prospects-page-container call-analytics-reports-page-container",
    contentAreaClass: "prospects-content-area",
} as const;

const PageReports = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [showPreviewSidebar, setShowPreviewSidebar] = useState(false);
    const [selectedPreviewReport, setSelectedPreviewReport] = useState<CallAnalyticsReportRow | null>(null);
    const [tableMaxHeight, setTableMaxHeight] = useState("calc(100vh - 295px)");
    const [sidebarMarginTop, setSidebarMarginTop] = useState(0);
    const [layoutRowMinHeight, setLayoutRowMinHeight] = useState<number | undefined>(undefined);
    const [sidebarWidth, setSidebarWidth] = useState("470px");

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

    useEffect(() => {
        const root = document.querySelector(".call-analytics-reports-list");
        if (!root) return;

        const updateTableLayout = () => {
            const toolbarEl = root.querySelector<HTMLElement>(".gt-toolbar-container");
            const tabsEl = root.querySelector<HTMLElement>(".gt-toolbar-tabs-section");
            const tableContainerEl = root.querySelector<HTMLElement>(".generic-table-container");

            if (toolbarEl) {
                const headerHeight = 74;
                const breadcrumbHeight = 48;
                const paginationHeight = 72;
                const toolbarHeight = Math.round(toolbarEl.getBoundingClientRect().height);
                setTableMaxHeight(
                    `calc(100vh - ${headerHeight + breadcrumbHeight + toolbarHeight + paginationHeight}px)`,
                );
            }
            if (tabsEl) {
                setSidebarMarginTop(Math.round(tabsEl.getBoundingClientRect().height));
            }
            if (tableContainerEl) {
                setLayoutRowMinHeight(Math.round(tableContainerEl.getBoundingClientRect().height));
            }

            const viewportWidth = window.innerWidth;
            if (viewportWidth < 768) {
                setSidebarWidth("320px");
            } else if (viewportWidth < 1280) {
                setSidebarWidth("360px");
            } else {
                setSidebarWidth("470px");
            }
        };

        const timer = globalThis.setTimeout(updateTableLayout, 100);
        const observer = new ResizeObserver(updateTableLayout);
        const toolbarEl = root.querySelector(".gt-toolbar-container");
        const tableContainerEl = root.querySelector(".generic-table-container");
        if (toolbarEl) observer.observe(toolbarEl);
        if (tableContainerEl) observer.observe(tableContainerEl);
        window.addEventListener("resize", updateTableLayout);

        return () => {
            globalThis.clearTimeout(timer);
            observer.disconnect();
            window.removeEventListener("resize", updateTableLayout);
        };
    }, [showPreviewSidebar, visibleReports.length]);

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
            <CrmListPageScopedLayoutStyles config={CALL_ANALYTICS_LIST_LAYOUT} />
            <div className={CALL_ANALYTICS_LIST_LAYOUT.pageContainerClass}>
                <div className={CALL_ANALYTICS_LIST_LAYOUT.scrollableContentClass}>
                    <BreadcrumbItem mainTitle="Reports" mainLink="/reports" subTitle="Reports" />
                    <div className={`container-fluid ${CALL_ANALYTICS_LIST_LAYOUT.contentAreaClass}`}>
                        <div className={`prospects-table-wrapper ${CALL_ANALYTICS_LIST_LAYOUT.tableWrapperClass}`}>
                            <div
                                className="call-analytics-reports-list__layout-row"
                                style={layoutRowMinHeight == null ? undefined : { minHeight: layoutRowMinHeight }}
                            >
                                <div className="call-analytics-reports-list__table-main">
                                    <GenericTable<CallAnalyticsReportRow>
                                        data={visibleReports}
                                        columns={CALL_ANALYTICS_REPORT_COLUMNS}
                                        uniqueKey="id"
                                        onPreviewClick={handlePreviewClick}
                                        showActions
                                        showToolbarActions={false}
                                        actions={reportActions}
                                        showToolbar
                                        toolbar={toolbar}
                                        emptyMessage="No call reports available for your permissions."
                                        fixedHeight
                                        maxHeight={tableMaxHeight}
                                    />
                                </div>

                                {showPreviewSidebar && selectedPreviewReport !== null && (
                                    <GenericSidebar
                                        isOpen={showPreviewSidebar}
                                        onClose={handleClosePreviewSidebar}
                                        width={sidebarWidth}
                                        sidebarMarginTop={sidebarMarginTop}
                                        title={selectedPreviewReport.title}
                                        subtitle={selectedPreviewReport.type}
                                        avatar={{
                                            initials: "CR",
                                            name: selectedPreviewReport.title,
                                            gradient: "#0066CC",
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
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

PageReports.getLayout = (page: ReactElement) => {
    return <Layout>{page}</Layout>;
};

export default PageReports;
