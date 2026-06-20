import React from "react";
import moment from "moment";
import { Calendar, Pencil, Trash2, User } from "lucide-react";
import type { TableColumn } from "@components/GenericTable";
import type { MainAppDepartmentLookup } from "@hooks/useMainAppLookups";
import type { UserProfile } from "@utils/staffManagement";
import { GlobalDateTimeFormat } from "@utils/Helper";
import { CrmPhoneDisplay } from "@components/crm/CrmListPageUi";
import { formatCnicForDisplay } from "@utils/workforce/employeeProfileFieldUtils";
import {
  CrmTableRowActions,
  type CrmTableRowAction,
} from "@page-modules/crm/shared/CrmTableRowActions";
import { employeeProfileHasJourneyStarted } from "./employeesDomain";

export interface EmployeeTableColumnsParams {
  getDisplayName: (p: UserProfile) => string;
  departments: MainAppDepartmentLookup[];
  tableActions?: EmployeeTableActionsParams;
}

export function buildEmployeeTableColumns({
  getDisplayName,
  departments,
  tableActions,
}: EmployeeTableColumnsParams): TableColumn<UserProfile>[] {
  const columns: TableColumn<UserProfile>[] = [
    {
      key: "name",
      label: "Employee",
      type: "custom",
      sortable: false,
      render: (profile: UserProfile) => (
        <div className="employees-page__cell-employee">
          <div className="employees-page__cell-avatar">
            <User size={20} aria-hidden />
          </div>
          <div>
            <div className="employees-page__cell-name">{getDisplayName(profile)}</div>
          </div>
        </div>
      ),
    },
    {
      key: "user_id",
      label: "Extension",
      type: "text",
      sortable: false,
    },
    {
      key: "identification_number",
      label: "CNIC/ID",
      type: "custom",
      sortable: false,
      render: (profile: UserProfile) => (
        <span className="employees-page__cell-text-primary">
          {formatCnicForDisplay(profile.identification_number)}
        </span>
      ),
    },
    {
      key: "designation",
      label: "Designation",
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
      key: "contract_type",
      label: "Contract Type",
      type: "text",
      sortable: false,
    },
    {
      key: "department_id",
      label: "Department",
      type: "custom",
      sortable: false,
      render: (profile: UserProfile) => (
        <span className="employees-page__cell-text-primary">
          {profile.department_id == null
            ? "—"
            : departments.find((d) => Number(d.id) === Number(profile.department_id))?.name ??
              String(profile.department_id)}
        </span>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      type: "custom",
      sortable: false,
      render: (profile: UserProfile) => {
        const phone = String(profile.phone ?? "").trim();
        if (phone === "") {
          return <span className="employees-page__cell-muted">—</span>;
        }
        return <CrmPhoneDisplay phone={phone} />;
      },
    },
    {
      key: "status",
      label: "Status",
      type: "custom",
      sortable: false,
      render: (profile: UserProfile) => {
        const statusText = String(profile.status ?? "");
        const isActive = statusText.toLowerCase() === "active";
        return (
          <span
            className={`employees-page__status-pill${isActive ? " employees-page__status-pill--active" : " employees-page__status-pill--inactive"}`}
          >
            <span
              className={`employees-page__status-dot${isActive ? " employees-page__status-dot--active" : " employees-page__status-dot--inactive"}`}
            />
            {statusText}
          </span>
        );
      },
    },
    {
      key: "updated_at",
      label: "Last Updated",
      type: "custom",
      sortable: false,
      render: (profile: UserProfile) => (
        <span className="employees-page__cell-muted">
          {(profile as UserProfile & { updated_at?: string }).updated_at
            ? moment((profile as UserProfile & { updated_at?: string }).updated_at).format(GlobalDateTimeFormat)
            : "—"}
        </span>
      ),
    },
  ];

  if (
    tableActions &&
    (tableActions.canEdit || tableActions.canCreateJourney || tableActions.canDelete)
  ) {
    columns.push({
      key: "actions",
      label: "Actions",
      type: "custom",
      sortable: false,
      align: "center",
      width: "140px",
      render: (profile: UserProfile) => (
        <CrmTableRowActions actions={buildEmployeeRowActions(profile, tableActions)} />
      ),
    });
  }

  return columns;
}

export interface EmployeeTableActionsParams {
  canEdit: boolean;
  canCreateJourney: boolean;
  canDelete: boolean;
  openEditModal: (profile: UserProfile, e?: React.MouseEvent) => void;
  openJourneyModal: (profile: UserProfile, e?: React.MouseEvent) => void;
  handleDeleteClick: (profile: UserProfile, e?: React.MouseEvent) => void;
}

function buildEmployeeRowActions(
  profile: UserProfile,
  {
    canEdit,
    canCreateJourney,
    canDelete,
    openEditModal,
    openJourneyModal,
    handleDeleteClick,
  }: EmployeeTableActionsParams,
): CrmTableRowAction[] {
  const actions: CrmTableRowAction[] = [];

  if (canEdit) {
    actions.push({
      label: "Edit",
      icon: <Pencil size={16} aria-hidden />,
      tone: "primary",
      onClick: () => openEditModal(profile),
    });
  }

  if (canCreateJourney) {
    const journeyStarted = employeeProfileHasJourneyStarted(profile);
    actions.push({
      label: "Create Journey",
      icon: <Calendar size={16} aria-hidden />,
      tone: "primary",
      disabled: journeyStarted,
      disabledTitle: "Journey already started",
      onClick: () => openJourneyModal(profile),
    });
  }

  if (canDelete) {
    actions.push({
      label: "Delete",
      icon: <Trash2 size={16} aria-hidden />,
      tone: "danger",
      onClick: () => handleDeleteClick(profile),
    });
  }

  return actions;
}
