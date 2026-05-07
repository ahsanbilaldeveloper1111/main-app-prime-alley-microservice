import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  User,
  Phone,
  Calendar,
  Briefcase,
  Clock,
  Building2,
  UserCheck,
  Search,
} from "lucide-react";
import {
  putUserProfileParent,
  putUserProfileBulkReports,
  type UserProfileMinified,
} from "@utils/staffManagement";
import { formatPhoneForDisplay } from "@utils/phoneDisplay";
import {
  filterOrgChartUsersWithMinifiedProfile,
  mainAppUserMatchesOrgChartUserId,
  mainAppUserRowKeyForSelection,
  normalizeOrgChartUserKey,
} from "@utils/workforce/orgChartMainAppUserMatch";
import { workforceKeys } from "../../../query/keys";
import {
  findOrgChartEmployeeParent,
  type OrgChartEmployee,
  type OrgChartRawProfile,
} from "./orgChartDomain";

import "./orgChartSidebar.scss";

interface UserOption {
  id: number;
  name: string;
  phone?: string | null;
}

interface OrganizationEmployeeSidebarProps {
  employee: OrgChartEmployee;
  onClose: () => void;
  allEmployees: OrgChartEmployee;
  rawProfile?: OrgChartRawProfile | null;
  /** List of users for "Reports to" dropdown (excluding current employee). */
  users?: UserOption[];
  /** Minified profiles for initial direct-report checkboxes and manager id fallback. */
  userProfilesMinified?: UserProfileMinified[];
}

function parentProfileFieldToManagerExtensionForSelect(
  rawProfile: OrgChartRawProfile | null | undefined,
  profiles: UserProfileMinified[],
): string {
  if (rawProfile == null) return "";
  const pid = rawProfile.parent_id ?? rawProfile.parent_profile_id;
  if (pid == null) return "";
  if (typeof pid === "string" && pid.trim() === "") return "";

  if (typeof pid === "number" && Number.isFinite(pid)) {
    const prof = profiles.find((p) => Number(p.id) === pid);
    if (prof?.user_id == null) return "";
    return normalizeOrgChartUserKey(prof.user_id);
  }

  const trimmed = String(pid).trim();
  if (trimmed === "") return "";
  const asNum = Number(trimmed);
  if (Number.isNaN(asNum) || !Number.isFinite(asNum) || String(asNum) !== trimmed) {
    return normalizeOrgChartUserKey(trimmed);
  }
  const profByNumericString = profiles.find((p) => Number(p.id) === asNum);
  if (profByNumericString?.user_id != null) {
    const ext = normalizeOrgChartUserKey(profByNumericString.user_id);
    if (ext !== "") return ext;
  }
  return normalizeOrgChartUserKey(trimmed);
}

type SidebarEmployeeStatus = OrgChartEmployee["status"];

function getCurrentStatusVisuals(status: SidebarEmployeeStatus): {
  panelBg: string;
  iconBg: string;
  text: string;
  subtitle: string;
} {
  if (status === "On Leave") {
    return {
      panelBg: "#fef3c7",
      iconBg: "#fbbf24",
      text: "#92400e",
      subtitle: "Currently away from office",
    };
  }
  if (status === "Inactive") {
    return {
      panelBg: "#f3f4f6",
      iconBg: "#9ca3af",
      text: "#6b7280",
      subtitle: "No longer active",
    };
  }
  return {
    panelBg: "#d1fae5",
    iconBg: "#10b981",
    text: "#065f46",
    subtitle: "Available and working",
  };
}

const OrganizationEmployeeSidebar: React.FC<OrganizationEmployeeSidebarProps> = ({
  employee,
  onClose,
  allEmployees,
  rawProfile,
  users = [],
  userProfilesMinified = [],
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"Overview" | "Reporting">("Overview");
  const [childUserIds, setChildUserIds] = useState<string[]>([]);
  const [directReportSearch, setDirectReportSearch] = useState("");

  const invalidateOrgChartTree = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: workforceKeys.orgChart.all() });
  }, [queryClient]);

  const updateParentMutation = useMutation({
    mutationFn: ({ profileId, parentExtension }: { profileId: string; parentExtension: string }) =>
      putUserProfileParent(profileId, { parent_id: parentExtension }),
    onSuccess: async () => {
      toast.success("Reporting manager updated");
      invalidateOrgChartTree();
    },
    onError: () => {
      toast.error("Failed to update reporting manager");
    },
  });

  const bulkReportsMutation = useMutation({
    mutationFn: ({ profileId, childIds }: { profileId: string; childIds: string[] }) =>
      putUserProfileBulkReports(profileId, { child_user_ids: childIds }),
    onSuccess: async () => {
      toast.success("Direct reports updated");
      invalidateOrgChartTree();
    },
  });

  const manager = findOrgChartEmployeeParent(allEmployees, employee.id);
  const directReports = employee.children ?? [];
  const totalTeamSize = directReports.length;

  const managerUserId = useMemo(() => {
    if (!manager) return undefined;
    if (manager.userId != null && String(manager.userId) !== "") {
      return String(manager.userId);
    }
    const prof = userProfilesMinified.find((p) => String(p.id) === String(manager.id));
    if (prof?.user_id == null) {
      return undefined;
    }
    return String(prof.user_id);
  }, [manager, userProfilesMinified]);

  const dropdownUsers = useMemo(
    () =>
      filterOrgChartUsersWithMinifiedProfile(
        users.filter((u) => !mainAppUserMatchesOrgChartUserId(u, rawProfile?.user_id)),
        userProfilesMinified,
      ),
    [users, rawProfile?.user_id, userProfilesMinified],
  );

  const directReportOptionUsers = useMemo(
    () =>
      filterOrgChartUsersWithMinifiedProfile(
        users.filter((u) => {
          if (mainAppUserMatchesOrgChartUserId(u, rawProfile?.user_id)) return false;
          if (managerUserId != null && mainAppUserMatchesOrgChartUserId(u, managerUserId))
            return false;
          return true;
        }),
        userProfilesMinified,
      ),
    [users, rawProfile?.user_id, managerUserId, userProfilesMinified],
  );

  const initialChildUserIds = useMemo(
    () =>
      (userProfilesMinified ?? [])
        .filter((p) => String(p.parent_id) === String(rawProfile?.user_id))
        .map((p) => String(p.user_id)),
    [userProfilesMinified, rawProfile?.user_id],
  );

  useEffect(() => {
    setChildUserIds(initialChildUserIds);
  }, [initialChildUserIds]);

  const parentSelectValue = useMemo(
    () => parentProfileFieldToManagerExtensionForSelect(rawProfile, userProfilesMinified),
    [rawProfile, userProfilesMinified],
  );

  const joinDateFormatted =
    rawProfile?.created_at != null &&
    (typeof rawProfile.created_at === "string" || typeof rawProfile.created_at === "number")
      ? new Date(rawProfile.created_at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

  const employeeDetails = {
    email: rawProfile?.user_id
      ? `${rawProfile.user_id}@company.com`
      : `${employee.name.toLowerCase().replaceAll(/\s+/g, ".")}@company.com`,
    phone: typeof rawProfile?.phone === "string" ? rawProfile.phone : undefined,
    location: "—",
    employeeId: (() => {
      const code = rawProfile?.employee_code;
      if (typeof code === "string" && code.trim() !== "") return code;
      return employee.id ? `EMP-${String(employee.id).padStart(5, "0")}` : "—";
    })(),
    joinDate: joinDateFormatted,
    employmentType:
      typeof rawProfile?.employment_type === "string" ? rawProfile.employment_type : "—",
    workSchedule: (() => {
      const ct = rawProfile?.contract_type;
      if (ct == null || ct === "") return "Mon - Fri, 9:00 AM - 5:00 PM";
      if (typeof ct === "string") return ct;
      return "Mon - Fri, 9:00 AM - 5:00 PM";
    })(),
    identificationNumber:
      typeof rawProfile?.identification_number === "string"
        ? rawProfile.identification_number
        : "—",
    attendance: rawProfile?.attendance,
  };

  const statusUi = getCurrentStatusVisuals(employee.status);

  const handleParentSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      updateParentMutation.mutate({ profileId: employee.id, parentExtension: value });
    },
    [employee.id, updateParentMutation],
  );

  const handleDirectReportToggle = useCallback(
    (uid: string, currentlyChecked: boolean) => {
      const prevIds = childUserIds;
      const newIds = currentlyChecked ? prevIds.filter((id) => id !== uid) : [...prevIds, uid];
      setChildUserIds(newIds);
      bulkReportsMutation.mutate(
        { profileId: employee.id, childIds: newIds },
        {
          onError: () => {
            toast.error("Failed to update direct reports");
            setChildUserIds(prevIds);
          },
        },
      );
    },
    [bulkReportsMutation, childUserIds, employee.id],
  );

  const filteredDirectReportOptionUsers = useMemo(() => {
    const q = directReportSearch.trim().toLowerCase();
    if (q === "") {
      return directReportOptionUsers;
    }
    return directReportOptionUsers.filter((u) => u.name.toLowerCase().includes(q));
  }, [directReportOptionUsers, directReportSearch]);

  const parentPending = updateParentMutation.isPending;
  const bulkPending = bulkReportsMutation.isPending;

  const renderOverviewTab = () => (
    <>
      <div className="org-chart-sidebar__section-spacer">
        <h3 className="org-chart-sidebar__section-title">Employment Information</h3>

        <div className="org-chart-sidebar__card-panel">
          <div className="org-chart-sidebar__info-row">
            <div
              className="org-chart-sidebar__info-icon-wrap"
              style={{ backgroundColor: "#e0e7ff" }}
            >
              <Briefcase size={18} color="#6366f1" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="org-chart-sidebar__info-label">Employee ID</div>
              <div className="org-chart-sidebar__info-value">{employeeDetails.employeeId}</div>
            </div>
          </div>

          <div className="org-chart-sidebar__info-row">
            <div
              className="org-chart-sidebar__info-icon-wrap"
              style={{ backgroundColor: "#dbeafe" }}
            >
              <Building2 size={18} color="#3b82f6" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="org-chart-sidebar__info-label">Department</div>
              <div className="org-chart-sidebar__info-value">{employee.department}</div>
            </div>
          </div>

          <div className="org-chart-sidebar__info-row">
            <div
              className="org-chart-sidebar__info-icon-wrap"
              style={{ backgroundColor: "#d1fae5" }}
            >
              <Calendar size={18} color="#10b981" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="org-chart-sidebar__info-label">Join Date</div>
              <div className="org-chart-sidebar__info-value">{employeeDetails.joinDate}</div>
            </div>
          </div>

          <div className="org-chart-sidebar__info-row">
            <div
              className="org-chart-sidebar__info-icon-wrap"
              style={{ backgroundColor: "#fef3c7" }}
            >
              <Clock size={18} color="#f59e0b" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="org-chart-sidebar__info-label">Work Schedule</div>
              <div className="org-chart-sidebar__info-value">{employeeDetails.workSchedule}</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="org-chart-sidebar__section-title">Current Status</h3>

        <div
          className="org-chart-sidebar__status-panel"
          style={{ backgroundColor: statusUi.panelBg }}
        >
          <div
            className="org-chart-sidebar__status-icon-circle"
            style={{ backgroundColor: statusUi.iconBg }}
          >
            <UserCheck size={20} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div className="org-chart-sidebar__status-heading" style={{ color: statusUi.text }}>
              {employee.status ?? "Active"}
            </div>
            <div className="org-chart-sidebar__status-sub" style={{ color: statusUi.text }}>
              {statusUi.subtitle}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderReportingTab = () => (
    <div className="org-chart-sidebar__section-spacer">
      <h3 className="org-chart-sidebar__subsection-title">Reporting Structure</h3>

      {manager && (
        <button type="button" className="org-chart-sidebar__manager-btn">
          <div className="org-chart-sidebar__muted-label">Reports to</div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="org-chart-sidebar__avatar" style={{ width: "40px", height: "40px" }}>
              <User size={20} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#1f2937" }}>
                {manager.name}
              </div>
              <div style={{ fontSize: "13px", color: "#6b7280" }}>{manager.title}</div>
            </div>
          </div>
        </button>
      )}

      {dropdownUsers.length > 0 && (
        <div className="org-chart-sidebar__section-spacer">
          <h3 className="org-chart-sidebar__subsection-title">
            {rawProfile?.parent_id ? "Change Head" : "Choose Head"}
          </h3>
          <select
            value={parentSelectValue}
            onChange={handleParentSelectChange}
            disabled={parentPending}
            className="org-chart-sidebar__select"
            style={{ cursor: parentPending ? "wait" : "pointer" }}
          >
            <option value="">Select manager</option>
            {dropdownUsers.map((u) => (
              <option key={u.id} value={mainAppUserRowKeyForSelection(u)}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {directReportOptionUsers.length > 0 && (
        <div className="org-chart-sidebar__section-spacer">
          <h3 className="org-chart-sidebar__subsection-title">Choose Subordinates</h3>
          <div className="org-chart-sidebar__search-wrap">
            <Search size={18} className="org-chart-sidebar__search-icon" />
            <input
              type="text"
              placeholder="Search users..."
              value={directReportSearch}
              onChange={(e) => setDirectReportSearch(e.target.value)}
              className="org-chart-sidebar__search-input"
            />
          </div>
          <div className="org-chart-sidebar__checkbox-list">
            {filteredDirectReportOptionUsers.map((u) => {
              const uid = mainAppUserRowKeyForSelection(u);
              const checked = childUserIds.includes(uid);
              return (
                <label key={u.id} className="org-chart-sidebar__checkbox-row">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={bulkPending}
                    onChange={() => {
                      handleDirectReportToggle(uid, checked);
                    }}
                    style={{ cursor: bulkPending ? "wait" : "pointer" }}
                  />
                  <span style={{ color: "#1f2937" }}>{u.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {totalTeamSize > 0 && (
        <div className="org-chart-sidebar__reports-panel">
          <div className="org-chart-sidebar__reports-header">
            <span>Direct Reports ({totalTeamSize})</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {directReports.slice(0, 3).map((report) => (
              <button key={report.id} type="button" className="org-chart-sidebar__report-card">
                <div className="org-chart-sidebar__report-avatar">
                  <User size={16} color="white" />
                </div>
                <div className="org-chart-sidebar__report-text">
                  <div className="org-chart-sidebar__report-name">{report.name}</div>
                  <div className="org-chart-sidebar__report-title">{report.title}</div>
                </div>
                {report.status === "On Leave" && (
                  <div className="org-chart-sidebar__pill-warning">On Leave</div>
                )}
                {report.status === "Inactive" && (
                  <div className="org-chart-sidebar__pill-muted">Inactive</div>
                )}
              </button>
            ))}
            {totalTeamSize > 3 && (
              <div
                style={{
                  padding: "8px",
                  textAlign: "center",
                  fontSize: "13px",
                  color: "#6366f1",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                View all {totalTeamSize} reports
              </div>
            )}
          </div>
        </div>
      )}

      {!manager && totalTeamSize === 0 && (
        <div className="org-chart-sidebar__empty-structure">
          No reporting structure information available
        </div>
      )}
    </div>
  );

  return (
    <div className="org-chart-sidebar">
      <div className="org-chart-sidebar__header">
        <div className="org-chart-sidebar__header-row">
          <h2 className="org-chart-sidebar__title">Employee Details</h2>
          <button type="button" aria-label="Close employee details" className="org-chart-sidebar__close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="org-chart-sidebar__profile-row">
          <div className="org-chart-sidebar__avatar">
            <User size={32} color="white" />
          </div>
          <div className="org-chart-sidebar__profile-text">
            <h3 className="org-chart-sidebar__profile-name">{employee.name}</h3>
            <div className="org-chart-sidebar__designation">
              {typeof rawProfile?.designation === "string" ? rawProfile.designation : ""}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div className="org-chart-sidebar__phone-row">
                <Phone size={14} color="#9ca3af" />
                <span className="org-chart-sidebar__phone-text">
                  {formatPhoneForDisplay(employeeDetails.phone)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="org-chart-sidebar__tabs">
        {(["Overview", "Reporting"] as const).map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`org-chart-sidebar__tab ${activeTab === tab ? "org-chart-sidebar__tab--active" : "org-chart-sidebar__tab--inactive"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="org-chart-sidebar__scroll">
        {activeTab === "Overview" && renderOverviewTab()}
        {activeTab === "Reporting" && renderReportingTab()}
      </div>
    </div>
  );
};

export default OrganizationEmployeeSidebar;
