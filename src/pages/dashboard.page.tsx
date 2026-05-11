"use client";

import React, { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import Layout from "@layout/index";
import CompanyData from "@pages/crm/companies";
import DealsData from "@pages/crm/deals";
import TasksData from "@pages/planner/tasks";
import AssociateTaskModal from "@components/AssociateTaskModal";
import CreateTaskSidebar from "@components/CreateTaskSidebar";
import SchedulePage from "@components/SchedulePage";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

import "@assets/scss/salesDashboard.scss";
import { getResponsiveStatsGridColumns } from "@components/salesDashboard/getResponsiveStatsGridColumns";
import {
  CHART_SCALE_BY_FILTER,
  SALES_DASHBOARD_NAV_TABS,
  TASK_STATS_BY_FILTER,
} from "@components/salesDashboard/salesDashboardConstants";
import { SummaryTabContent } from "@components/salesDashboard/SummaryTabContent";
import { useViewportBreakpoints } from "@hooks/useViewportBreakpoints";

type NextPageWithLayout = React.FC & {
  getLayout?: (page: ReactElement) => ReactElement;
};

const SalesDashboard: NextPageWithLayout = () => {
  const { data: session } = useSession();
  const { isMobile, isTablet, isCompactViewport } = useViewportBreakpoints();

  const navTabs = useMemo(() => {
    const perms = session?.user?.permissions ?? [];
    return SALES_DASHBOARD_NAV_TABS.filter(
      (tab) => !tab.permission || perms.includes(tab.permission),
    );
  }, [session?.user?.permissions]);

  const [activeTab, setActiveTab] = useState("Summary");

  useEffect(() => {
    if (navTabs.length && !navTabs.some((t) => t.id === activeTab)) {
      setActiveTab(navTabs[0].id);
    }
  }, [navTabs, activeTab]);

  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving] = useState(false);
  const [activeTaskFilter, setActiveTaskFilter] = useState("All tasks");

  const selectedTaskStats =
    TASK_STATS_BY_FILTER[activeTaskFilter] ?? TASK_STATS_BY_FILTER["All tasks"];
  const selectedChartScale = CHART_SCALE_BY_FILTER[activeTaskFilter] ?? 1;

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => new Set(),
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }, []);

  const responsiveStatsGridColumns = getResponsiveStatsGridColumns(isMobile, isTablet);

  const rootClassName = [
    "sales-dashboard",
    isCompactViewport && "sales-dashboard--compact",
    isMobile && "sales-dashboard--mobile",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClassName}>
      <div className="sales-dashboard__header">
        <div className="sales-dashboard__header-top">
          <div className="sales-dashboard__header-title">
            <span>Welcome</span>
            <span className="sales-dashboard__header-divider">|</span>
            <span className="sales-dashboard__header-user">{session?.user?.name}</span>
          </div>
        </div>
        <nav className="sales-dashboard__nav" aria-label="Dashboard sections">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`sales-dashboard__nav-tab${
                activeTab === tab.id ? " sales-dashboard__nav-tab--active" : ""
              }`}
              aria-current={activeTab === tab.id ? "page" : undefined}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="sales-dashboard__content">
        {activeTab === "Summary" && (
          <SummaryTabContent
            activeTaskFilter={activeTaskFilter}
            setActiveTaskFilter={setActiveTaskFilter}
            setShowCreate={setShowCreate}
            selectedTaskStats={selectedTaskStats}
            selectedChartScale={selectedChartScale}
            collapsedSections={collapsedSections}
            toggleSection={toggleSection}
            responsiveStatsGridColumns={responsiveStatsGridColumns}
          />
        )}

        {activeTab === "Companies" && <CompanyData />}
        {activeTab === "Deals" && <DealsData />}
        {activeTab === "Tasks" && <TasksData />}
        {activeTab === "Calendar" && <SchedulePage />}
      </div>

      <AssociateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskName="AI bot offer"
        onAddAssociations={() => console.log("Add associations clicked")}
        onMarkComplete={() => {
          console.log("Marked complete");
          setIsModalOpen(false);
        }}
        onSkipTask={() => {
          console.log("Skipped task");
          setIsModalOpen(false);
        }}
      />

      <CreateTaskSidebar
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
          setEditId(null);
        }}
        onSubmit={(formData, addAnother) => {
          console.log("Task form submitted:", formData, "Add another:", addAnother);
          toast.success(editId ? "Task updated" : "Task created");
          if (!addAnother) {
            setShowCreate(false);
            setEditId(null);
          }
        }}
        taskId={editId}
        loading={saving}
        assigneeOptions={[
          { value: "U001", label: "John Smith" },
          { value: "U002", label: "Sarah Johnson" },
          { value: "U003", label: "Mike Davis" },
          { value: "U004", label: "Emily Chen" },
        ]}
        queueOptions={[
          { value: "queue-1", label: "Sales Queue" },
          { value: "queue-2", label: "Support Queue" },
        ]}
        recordOptions={[
          { value: "contact-1", label: "Contact Records" },
          { value: "company-1", label: "Company Records" },
          { value: "deal-1", label: "Deal Records" },
        ]}
      />
    </div>
  );
};

SalesDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default SalesDashboard;
