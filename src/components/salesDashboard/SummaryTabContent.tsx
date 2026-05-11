import React from "react";
import {
  AlertTriangle,
  CheckSquare,
  ExternalLink,
  List,
  Mail,
  Phone,
  Plus,
} from "lucide-react";
import UserActivityByCategory from "@components/UserActivityByCategory";
import TwoCharts from "@components/TwoCharts";
import { DashboardSectionHeader } from "./DashboardSectionHeader";
import type { TaskStatKey } from "./salesDashboardConstants";
import { TASK_QUICK_FILTERS } from "./salesDashboardConstants";

export type SummaryTabContentProps = Readonly<{
  activeTaskFilter: string;
  setActiveTaskFilter: React.Dispatch<React.SetStateAction<string>>;
  setShowCreate: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTaskStats: Record<TaskStatKey, number>;
  selectedChartScale: number;
  collapsedSections: Set<string>;
  toggleSection: (sectionId: string) => void;
  responsiveStatsGridColumns: string;
}>;

export function SummaryTabContent({
  activeTaskFilter,
  setActiveTaskFilter,
  setShowCreate,
  selectedTaskStats,
  selectedChartScale,
  collapsedSections,
  toggleSection,
  responsiveStatsGridColumns,
}: SummaryTabContentProps) {
  return (
    <>
      <div className="sales-dashboard__section">
        <DashboardSectionHeader
          title="Tasks"
          actionSlot={
            <button type="button" className="sales-dashboard__view-all-link">
              View all <ExternalLink size={11} />
            </button>
          }
          onToggle={() => toggleSection("tasks")}
          isCollapsed={collapsedSections.has("tasks")}
        />

        {!collapsedSections.has("tasks") && (
          <>
            <div className="sales-dashboard__task-filters">
              <div className="sales-dashboard__task-filters-inner">
                {TASK_QUICK_FILTERS.map((f, index, arr) => (
                  <button
                    key={f}
                    type="button"
                    className={`sales-dashboard__task-filter-btn${
                      activeTaskFilter === f ? " sales-dashboard__task-filter-btn--active" : ""
                    }${index === arr.length - 1 ? " sales-dashboard__task-filter-btn--last" : ""}`}
                    onClick={() => setActiveTaskFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="sales-dashboard__task-filters-actions">
                <button
                  type="button"
                  className="sales-dashboard__btn"
                  onClick={() => setShowCreate(true)}
                >
                  <span className="sales-dashboard__btn-inner">
                    <Plus size={12} /> Create task
                  </span>
                </button>
              </div>
            </div>

            <div
              className="sales-dashboard__stats-grid"
              style={{ gridTemplateColumns: responsiveStatsGridColumns }}
            >
              {[
                {
                  label: "All tasks",
                  value: selectedTaskStats.allTasks,
                  icon: <CheckSquare size={16} color="#666" />,
                },
                {
                  label: "High priority",
                  value: selectedTaskStats.highPriority,
                  icon: <AlertTriangle size={16} color="#666" />,
                },
                {
                  label: "To-dos",
                  value: selectedTaskStats.toDos,
                  icon: <List size={16} color="#666" />,
                },
                {
                  label: "Calls",
                  value: selectedTaskStats.calls,
                  icon: <Phone size={16} color="#666" />,
                },
                {
                  label: "Emails",
                  value: selectedTaskStats.emails,
                  icon: <Mail size={16} color="#666" />,
                },
                {
                  label: "LinkedIn",
                  value: selectedTaskStats.linkedin,
                  icon: <ExternalLink size={16} color="#22c55e" />,
                  done: true,
                },
              ].map((stat) => (
                <div key={stat.label} className="sales-dashboard__stat-card">
                  <div className="sales-dashboard__stat-label">
                    {stat.label}
                    {stat.done ? (
                      <span className="sales-dashboard__linkedin-check">
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path
                            d="M1 4l2.5 2.5L9 1"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    ) : (
                      stat.icon
                    )}
                  </div>
                  <div
                    className={`sales-dashboard__stat-value${
                      stat.value === 0 ? " sales-dashboard__stat-value--zero" : ""
                    }`}
                  >
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="sales-dashboard__section">
        <DashboardSectionHeader
          title="User activity by category"
          infoIcon
          onToggle={() => toggleSection("userActivity")}
          isCollapsed={collapsedSections.has("userActivity")}
        />
        {!collapsedSections.has("userActivity") && (
          <div className="sales-dashboard__chart-panel">
            <UserActivityByCategory scale={selectedChartScale} />
          </div>
        )}
      </div>

      <div className="sales-dashboard__section">
        <DashboardSectionHeader
          title="Activity"
          infoIcon
          onToggle={() => toggleSection("twoCharts")}
          isCollapsed={collapsedSections.has("twoCharts")}
        />
        {!collapsedSections.has("twoCharts") && (
          <div className="sales-dashboard__chart-panel">
            <TwoCharts scale={selectedChartScale} />
          </div>
        )}
      </div>
    </>
  );
}
