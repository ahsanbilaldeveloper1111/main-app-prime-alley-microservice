"use client";

import React, { ReactElement } from "react";
import Layout from "@layout/index";
import { HelpCircle } from "lucide-react";
import { toast } from "react-toastify";
import CompanyData from "@pages/crm/companies";
import DealsData from "@pages/crm/deals";
import TasksData from "@pages/crm/crm-tasks";
import AssociateTaskModal from "@components/AssociateTaskModal";
import CreateTaskSidebar from "@components/CreateTaskSidebar";
import { MainDashboardSectionHeader } from "@components/crm/main-dashboard/MainDashboardSectionHeader";
import { MainDashboardSummaryTab } from "@components/crm/main-dashboard/MainDashboardSummaryTab";
import { useCrmMainDashboardUiState } from "@hooks/useCrmMainDashboardUiState";
import "@assets/scss/crm-main-dashboard.scss";

const navTabs = ["Summary", "Companies", "Deals", "Tasks", "Schedule", "Dashboard"];

type NextPageWithLayout = React.FC & {
  getLayout?: (page: ReactElement) => ReactElement;
};

const SalesDashboard: NextPageWithLayout = () => {
  const {
    activeTab,
    setActiveTab,
    showCreate,
    setShowCreate,
    editId,
    setEditId,
    saving,
    activeTaskFilter,
    setActiveTaskFilter,
    collapsedSections,
    toggleSection,
    isModalOpen,
    setIsModalOpen,
  } = useCrmMainDashboardUiState();

  return (
    <div className="crm-md-page">
      <div className="crm-md-header">
        <div className="crm-md-headerTop">
          <div className="crm-md-headerTitle">
            <span>Sales</span>
            <span className="crm-md-headerDivider">|</span>
            <span className="crm-md-headerUser">Rizwan Haider</span>
          </div>
          <div className="crm-md-helpBtn" aria-label="Help">
            <HelpCircle size={15} color="#666" />
          </div>
        </div>
        <nav className="crm-md-nav" aria-label="Sales sections">
          {navTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={
                "crm-md-navTab" + (activeTab === tab ? " crm-md-navTab--active" : "")
              }
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="crm-md-content">
        {activeTab === "Summary" && (
          <MainDashboardSummaryTab
            activeTaskFilter={activeTaskFilter}
            setActiveTaskFilter={setActiveTaskFilter}
            collapsedSections={collapsedSections}
            toggleSection={toggleSection}
            onCreateTask={() => setShowCreate(true)}
            onStartTasks={() => setIsModalOpen(true)}
          />
        )}

        {activeTab === "Companies" && <CompanyData />}

        {activeTab === "Deals" && <DealsData />}

        {activeTab === "Tasks" && <TasksData />}

        {activeTab === "Schedule" && (
          <div className="crm-md-section">
            <MainDashboardSectionHeader title="Schedule" />
            <div className="crm-md-emptyState">
              <div className="crm-md-emptyTitle">Schedule View</div>
              <p className="crm-md-emptyText">
                This is the Schedule tab content. Calendar and scheduling features will be displayed
                here.
              </p>
            </div>
          </div>
        )}

        {activeTab === "Dashboard" && (
          <div className="crm-md-section">
            <MainDashboardSectionHeader title="Dashboard Analytics" />
            <div className="crm-md-emptyState">
              <div className="crm-md-emptyTitle">Dashboard View</div>
              <p className="crm-md-emptyText">
                This is the Dashboard tab content. Analytics and insights will be displayed here.
              </p>
            </div>
          </div>
        )}
      </div>

      <button type="button" className="crm-md-feedbackFab">
        Got feedback?
      </button>

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
