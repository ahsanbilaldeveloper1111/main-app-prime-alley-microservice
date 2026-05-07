import React, { type Dispatch, type SetStateAction } from "react";
import { ChevronRight } from "lucide-react";
import type { TableAction, TableColumn } from "@components/GenericTable";
import { getAvatarColor, getInitials } from "@utils/workforceUserAvatar";
import { getStatusColor, type OnboardingEmployee } from "./journeyDomain";

export function buildOnboardingColumns(): TableColumn<OnboardingEmployee>[] {
  return [
    {
      key: "name",
      label: "Employee Name",
      type: "avatar",
      sortable: false,
      avatar: {
        getInitials: (row) => getInitials(row.name),
        getColor: (row) => getAvatarColor(row.name),
      },
    },
    {
      key: "user_id",
      label: "Extension",
      type: "text",
      sortable: false,
    },
    {
      key: "department_name",
      label: "Department",
      type: "text",
      sortable: false,
    },
    {
      key: "designation",
      label: "Designation",
      type: "text",
      sortable: false,
    },
    {
      key: "contract_type",
      label: "Contract Type",
      type: "text",
      sortable: false,
    },
    {
      key: "employment_type",
      label: "Employment Type",
      type: "text",
      sortable: false,
    },
    {
      key: "startDate",
      label: "Start Date",
      type: "text",
      sortable: false,
    },
    {
      key: "stages",
      label: "Steps",
      type: "custom",
      sortable: false,
      render: (row) => (
        <span>
          {row.completed_steps_count ?? 0}/{row.total_steps_count ?? 0}
        </span>
      ),
    },
    {
      key: "progress",
      label: "Progress",
      type: "custom",
      sortable: false,
      render: (row) => (
        <div className="journey-page__progress-row">
          <div className="journey-page__progress-track">
            <div className="journey-page__progress-fill" style={{ width: `${row.progress}%` }} />
          </div>
          <span className="journey-page__progress-label">{row.progress}%</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      type: "custom",
      sortable: false,
      render: (row) => {
        const statusColors = getStatusColor(row.status);
        return (
          <div
            className="journey-page__status-chip-table"
            style={{ backgroundColor: statusColors.bg }}
          >
            <span
              className="journey-page__status-dot-table"
              style={{ backgroundColor: statusColors.dot }}
            />
            <span className="journey-page__status-label-table" style={{ color: statusColors.color }}>
              {row.status}
            </span>
          </div>
        );
      },
    },
  ];
}

export function buildOnboardingActions(params: {
  setSelectedEmployee: Dispatch<SetStateAction<OnboardingEmployee | null>>;
  setIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
}): TableAction<OnboardingEmployee>[] {
  return [
    {
      label: "View",
      icon: <ChevronRight size={16} />,
      onClick: (row) => {
        params.setSelectedEmployee(row);
        params.setIsSidebarOpen(true);
      },
      variant: "link",
    },
  ];
}
