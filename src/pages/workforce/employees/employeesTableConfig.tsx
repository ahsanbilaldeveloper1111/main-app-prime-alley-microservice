import React from "react";
import moment from "moment";
import { Calendar, Pencil, Trash2, User } from "lucide-react";
import type { TableAction, TableColumn } from "@components/GenericTable";
import type { MainAppDepartmentLookup } from "@hooks/useMainAppLookups";
import type { UserProfile } from "@utils/staffManagement";
import { GlobalDateTimeFormat } from "@utils/Helper";
import { formatPhoneForDisplay } from "@utils/phoneDisplay";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;

export interface EmployeeTableColumnsParams {
  getDisplayName: (p: UserProfile) => string;
  departments: MainAppDepartmentLookup[];
}

export function buildEmployeeTableColumns({
  getDisplayName,
  departments,
}: EmployeeTableColumnsParams): TableColumn<UserProfile>[] {
  return [
    {
      key: "name",
      label: "Employee",
      type: "custom",
      sortable: false,
      render: (profile: UserProfile) => {
        const statusText = String(profile.status ?? "Active");
        const isActive = statusText.toLowerCase() === "active";
        return (
          <div className="employees-page__cell-employee">
            <div className="employees-page__cell-avatar">
              <User size={20} color="#6366f1" />
            </div>
            <div>
              <div className="employees-page__cell-name">{getDisplayName(profile)}</div>
              <div className="employees-page__cell-sub employees-page__cell-sub--capitalize">
                <span
                  className={`employees-page__cell-dot${isActive ? " employees-page__cell-dot--active" : " employees-page__cell-dot--inactive"}`}
                />
                {statusText}
              </div>
            </div>
          </div>
        );
      },
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
      render: (profile: UserProfile) => (
        <span className="employees-page__cell-text-primary">{formatPhoneForDisplay(profile.phone)}</span>
      ),
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
}

export interface EmployeeTableActionsParams {
  permissions: string[] | undefined;
  openEditModal: (profile: UserProfile, e?: React.MouseEvent) => void;
  openJourneyModal: (profile: UserProfile, e?: React.MouseEvent) => void;
  handleDeleteClick: (profile: UserProfile, e?: React.MouseEvent) => void;
}

export function buildEmployeeTableActions({
  permissions,
  openEditModal,
  openJourneyModal,
  handleDeleteClick,
}: EmployeeTableActionsParams): TableAction<UserProfile>[] {
  return [
    {
      label: "Edit",
      icon: <Pencil size={16} />,
      onClick: (profile: UserProfile) => openEditModal(profile),
      show: () => Boolean(permissions?.includes(PERMISSIONS.UPDATE_EMPLOYEE_STAFF_MANAGEMENT)),
      variant: "link",
    },
    {
      label: "Create Journey",
      icon: <Calendar size={16} />,
      onClick: (profile: UserProfile) => openJourneyModal(profile),
      show: () => Boolean(permissions?.includes(PERMISSIONS.UPDATE_EMPLOYEE_STAFF_MANAGEMENT)),
      disabled: (profile: UserProfile) => (profile as UserProfile & { journey?: { id?: number } }).journey?.id != null,
      disabledTitle: "Journey already started",
      variant: "link",
    },
    {
      label: "Delete",
      icon: <Trash2 size={16} />,
      onClick: (profile: UserProfile) => handleDeleteClick(profile),
      show: () => Boolean(permissions?.includes(PERMISSIONS.DELETE_EMPLOYEE_STAFF_MANAGEMENT)),
      variant: "link",
    },
  ];
}
