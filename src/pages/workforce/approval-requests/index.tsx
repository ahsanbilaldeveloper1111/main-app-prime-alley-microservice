import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@assets/scss/workforce-user-request.scss";
import { useSession } from "next-auth/react";
import {
  getUserRequestCategories,
  getUserRequestCategory,
  getUserRequestCategoryFields,
  getUserRequests,
  getUserRequest,
  getUserRequestApprovalInfo,
  approveUserRequest,
  rejectUserRequest,
  updateUserRequest,
  deleteUserRequest,
  downloadUserRequestAttachment,
  type UserRequestCategory,
  type UserRequestCategoryField,
  type UserRequest,
} from "@utils/staffManagement";
import { getWorkforceTableDatePresetRange } from "@utils/workforceTableDatePresetRange";
import { useMainAppLookups, type MainAppUserLookup } from "@hooks/useMainAppLookups";
import { toast } from "react-toastify";
import { Badge, Modal, Form } from "react-bootstrap";
import GenericTable, { FilterPill, TableColumn, ToolbarConfig } from "@components/GenericTable";
import GenericSidebar, { SidebarSection } from "@components/GenericSidebarNew";

import {
  FileText,
  Calendar,
  UserPlus,
  User,
  File,
  Plus,
  Download,
  Check,
  Clock,
  CheckCircle,
  XCircle,
  Edit3,
  Pencil,
  Trash2,
} from "lucide-react";
import DeleteConfirmationModal from "../../partial/DeleteConfirmationModal";
import NewRequestModal from "@pages/workforce/NewRequestModal";
import UserRequestDynamicFieldInput from "@components/workforce/UserRequestDynamicFieldInput";
import WorkforceSidebarShell from "@components/workforce/WorkforceSidebarShell";
import {
  findMainAppUserByRequestUserId,
  getUserDisplayNameFromLookup,
  type UserRequestIdValue,
} from "@utils/workforceApprovalRequestsUserLookup";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;

const TAB_TO_STATUS: Record<string, string> = {
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected",
};

function formatRequestDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

function getAgingLabel(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const days = Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
    if (days < 1) return "Less than 1 day";
    if (days <= 3) return "1-3 days";
    if (days <= 7) return "3-7 days";
    return "7d+";
  } catch {
    return "—";
  }
}

function parseOpenIdFromQuery(openId: string | string[] | undefined): string | undefined {
  if (typeof openId === "string") return openId;
  if (Array.isArray(openId)) return openId[0];
  return undefined;
}

function requestStatusBadgeVariant(status: string | null | undefined): "success" | "danger" | "info" {
  const s = status?.toLowerCase();
  if (s === "approved") return "success";
  if (s === "rejected") return "danger";
  return "info";
}

function resolveUserRequestParentCategoryId(category: UserRequestCategory | undefined): number | null {
  if (!category) return null;
  const raw = category.parent_id;
  if (raw == null) return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isNaN(n) ? null : n;
}

/** API may return parents with a nested `children` array but omit `parent_id` on the child in the flat list. */
type CategoryWithOptionalChildren = UserRequestCategory & {
  children?: Array<{ id: number; name?: string | null; code?: string | null; is_active?: boolean }>;
};

function findParentCategoryNodeForChildId(
  categories: UserRequestCategory[],
  childId: number,
): UserRequestCategory | null {
  for (const c of categories) {
    const children = (c as CategoryWithOptionalChildren).children;
    if (!Array.isArray(children)) continue;
    if (children.some((ch) => ch.id === childId)) {
      return c;
    }
  }
  return null;
}

/** When the request category is a sub-category, expose parent + sub names for read-only display. */
function getEditRequestCategoryView(
  userRequestCategoryId: number | null | undefined,
  categories: UserRequestCategory[],
  getNameById: (id: number) => string,
  options?: { categoryDetail?: UserRequestCategory | null },
): {
  hasParent: boolean;
  parentName: string;
  subCategoryId: number;
  subCategoryName: string;
} | null {
  if (userRequestCategoryId == null) return null;
  const id = userRequestCategoryId;
  const detail = options?.categoryDetail;
  const currentFromList = categories.find((c) => c.id === id);
  const current =
    detail != null && Number(detail.id) === Number(id) ? detail : currentFromList;
  const parentNode = findParentCategoryNodeForChildId(categories, id);
  const parentIdFromField = resolveUserRequestParentCategoryId(current);
  const parentIdFromTree =
    parentNode?.id == null ? null : Number(parentNode.id);
  const parentId =
    parentIdFromField ??
    (parentIdFromTree != null && !Number.isNaN(parentIdFromTree) ? parentIdFromTree : null);

  const subName = current?.name ?? current?.code ?? getNameById(id);
  if (parentId == null) {
    return {
      hasParent: false,
      parentName: "",
      subCategoryId: id,
      subCategoryName: subName,
    };
  }
  const parentFromList = categories.find((c) => c.id === parentId);
  const parentName =
    (parentId === parentNode?.id
      ? parentNode?.name ?? parentNode?.code
      : undefined) ??
    parentFromList?.name ??
    parentFromList?.code ??
    getNameById(parentId);
  return {
    hasParent: true,
    parentName,
    subCategoryId: id,
    subCategoryName: subName,
  };
}

type EditDynamicFieldsProps = {
  fields: UserRequestCategoryField[];
  dynamic_fields: Record<string, unknown>;
  onDynamicFieldChange: (key: string, value: unknown) => void;
  onDynamicFileChange: (key: string, file: File | null) => void;
};

function EditRequestAdditionalFieldsSection(props: Readonly<EditDynamicFieldsProps>) {
  const { fields, dynamic_fields, onDynamicFieldChange, onDynamicFileChange } = props;
  return (
    <Form.Group className="mb-3">
      <Form.Label className="new-request-label">Additional fields</Form.Label>
      <div className="new-request-additionalFieldsPanel">
        <div className="new-request-additionalFieldsHint">
          Fill out the category-specific details below.
        </div>
        {fields.map((field) => (
          <div key={field.id} className="new-request-additionalFieldCard">
            <Form.Label className="mb-2 new-request-additionalFieldLabel">
              {field.label ?? field.key}
              {field.required && <span className="text-danger"> *</span>}
            </Form.Label>
            <div className="new-request-additionalFieldInput">
              <UserRequestDynamicFieldInput
                field={field}
                values={dynamic_fields}
                onValueChange={onDynamicFieldChange}
                onFileChange={onDynamicFileChange}
                idPrefix="edit"
              />
            </div>
          </div>
        ))}
      </div>
    </Form.Group>
  );
}

type UserRequestAttachmentRow = {
  id: number;
  original_name?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
};

type RequestUserIdentifier = string | number | null;
type DialogVariant = "success" | "error" | "warning";
type SidebarSubmittingAction = "approve" | "reject" | "changes" | null;
type ApprovalLevel = string | number;
type ApprovalLevelOrNull = ApprovalLevel | null;

interface RequestApprovalItem {
  id: number;
  level: ApprovalLevel;
  status: string | null;
  approved_by_user_id: RequestUserIdentifier;
  approved_at: string | null;
  notes: string | null;
}

interface UserRequestApprovalInfo {
  can_approve: boolean;
  can_reject: boolean;
  assignees_for_current_level: string[];
  current_approval_level: ApprovalLevelOrNull;
  approval_rule?: string | null;
  approve_in_order?: boolean | null;
}

function formatEventDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? "—"
      : d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function formatDynamicFieldKey(rawKey: string): string {
  return String(rawKey ?? "")
    .replaceAll("_", " ")
    .trim()
    .split(/\s+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ""))
    .join(" ");
}

function formatDynamicFieldValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value.trim() === "" ? "—" : value.trim();
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  if (Array.isArray(value)) return value.length ? value.map(String).join(", ") : "—";
  if (typeof value === "object") return JSON.stringify(value);
  return "—";
}

function formatApprovalStatusLabel(status: string | null | undefined): string {
  const normalized = String(status ?? "").trim().toLowerCase();
  if (normalized === "pending") return "Pending";
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  if (!normalized) return "Unknown";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getApprovalStatusPillStyle(status: string): { bg: string; color: string } {
  if (status === "approved") return { bg: "#dcfce7", color: "#166534" };
  if (status === "rejected") return { bg: "#fee2e2", color: "#991b1b" };
  return { bg: "#f3f4f6", color: "#4b5563" };
}

function getDialogTypeBgColor(type: DialogVariant): string {
  if (type === "success") return "#d1fae5";
  if (type === "error") return "#fee2e2";
  return "#fef3c7";
}

function getEventView(eventType: string): { bgColor: string; avatarBgColor: string; icon: React.ReactNode } {
  if (eventType === "approved") {
    return { bgColor: "#d1fae5", avatarBgColor: "#10b981", icon: <CheckCircle size={20} /> };
  }
  if (eventType === "rejected") {
    return { bgColor: "#fee2e2", avatarBgColor: "#ef4444", icon: <XCircle size={20} /> };
  }
  return { bgColor: "#f9fafb", avatarBgColor: "#6b7280", icon: <Edit3 size={20} /> };
}

function getApprovalActionValidationError(
  comment: string,
  extensionNumber: string,
  action: "approve" | "reject"
): string | null {
  if (!comment.trim()) {
    return action === "approve"
      ? "Please add a comment before approving this request."
      : "Please add a comment explaining the reason for rejection.";
  }
  if (!extensionNumber) {
    return action === "approve"
      ? "Current user phone/extension is required to approve this request."
      : "Current user phone/extension is required to reject this request.";
  }
  return null;
}

function getApprovalValidationDialogConfig(
  extensionNumber: string,
  message: string
): { type: DialogVariant; title: string; message: string } {
  if (!extensionNumber) {
    return { type: "error", title: "Missing Extension", message };
  }
  return { type: "warning", title: "Comment Required", message };
}

function formatCurrentApprovalLevelLabel(level: ApprovalLevelOrNull | undefined): string {
  if (level == null) return "";
  return ` (Level ${String(level)})`;
}

function formatAttachmentSizeSuffix(sizeBytes: number | null | undefined): string {
  if (sizeBytes == null) return "";
  return ` • ${(sizeBytes / 1024).toFixed(1)} KB`;
}

function getApprovalRequestTypeIconName(
  categoryId: number | null,
  categories: UserRequestCategory[],
): string {
  const category = categories.find((item) => item.id === categoryId);
  const name = String(category?.name ?? category?.code ?? "").toLowerCase();
  if (name.includes("leave")) return "leave";
  if (name.includes("document")) return "document";
  if (name.includes("onboarding")) return "onboarding";
  if (name.includes("profile")) return "profile";
  return "file";
}

function getApprovalRequestTypeIcon(iconType: string): React.ReactNode {
  switch (iconType) {
    case "leave":
      return <Calendar size={16} color="#6366f1" />;
    case "document":
      return <FileText size={16} color="#8b5cf6" />;
    case "onboarding":
      return <UserPlus size={16} color="#10b981" />;
    case "profile":
      return <User size={16} color="#6366f1" />;
    default:
      return <File size={16} color="#6b7280" />;
  }
}

function getApprovalRequestTypeColor(iconType: string): string {
  switch (iconType) {
    case "leave":
      return "#dbeafe";
    case "document":
      return "#f3e8ff";
    case "onboarding":
      return "#d1fae5";
    case "profile":
      return "#dbeafe";
    default:
      return "#f3f4f6";
  }
}

type ApprovalRequestColumnsArgs = {
  categories: UserRequestCategory[];
  getDisplayName: (userId: UserRequestIdValue) => string;
};

function createApprovalRequestColumns({
  categories,
  getDisplayName,
}: Readonly<ApprovalRequestColumnsArgs>): TableColumn<UserRequest>[] {
  return [
    {
      key: "subject",
      label: "Request",
      type: "custom",
      sortable: false,
      render: (request) => (
        <div style={{ fontSize: "14px", fontWeight: 500, color: "#1f2937" }}>
          {request.subject ?? "—"}
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      type: "custom",
      sortable: false,
      render: (request) => {
        const iconType = getApprovalRequestTypeIconName(request.user_request_category_id, categories);
        const categoryName =
          (request as UserRequest & { category?: { name?: string | null } }).category?.name ?? "—";
        return (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              backgroundColor: getApprovalRequestTypeColor(iconType),
              borderRadius: "6px",
            }}
          >
            {getApprovalRequestTypeIcon(iconType)}
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#1f2937" }}>
              {categoryName}
            </span>
          </div>
        );
      },
    },
    {
      key: "requested_by",
      label: "Requested By",
      type: "custom",
      sortable: false,
      render: (request) => (
        <span style={{ fontSize: "14px", color: "#1f2937" }}>{getDisplayName(request.user_id)}</span>
      ),
    },
    {
      key: "submitted_on",
      label: "Submitted On",
      type: "custom",
      sortable: false,
      render: (request) => (
        <span style={{ fontSize: "14px", color: "#1f2937" }}>
          {formatRequestDate((request as UserRequest & { created_at?: string }).created_at)}
        </span>
      ),
    },
    {
      key: "aging",
      label: "Aging",
      type: "custom",
      sortable: false,
      render: (request) => (
        <span
          style={{
            padding: "4px 12px",
            backgroundColor: "#fef3c7",
            color: "#92400e",
            borderRadius: "16px",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          {getAgingLabel((request as UserRequest & { created_at?: string }).created_at)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      type: "custom",
      sortable: false,
      render: (request) => (
        <Badge bg={requestStatusBadgeVariant(request.status)} className="text-capitalize">
          {request.status}
        </Badge>
      ),
    },
    {
      key: "approved_rejected_by",
      label: "Approved/Rejected By",
      type: "custom",
      sortable: false,
      render: (request) => (
        <span style={{ fontSize: "14px", color: "#1f2937" }}>
          {getDisplayName(request.approved_by_user_id)}
        </span>
      ),
    },
    {
      key: "approved_rejected_on",
      label: "Approved/Rejected On",
      type: "custom",
      sortable: false,
      render: (request) => (
        <span style={{ fontSize: "14px", color: "#1f2937" }}>{formatRequestDate(request.approved_at)}</span>
      ),
    },
  ];
}

type RequestedByDropdownProps = {
  requestedBySearchTerm: string;
  setRequestedBySearchTerm: (value: string) => void;
  selectedRequestedByUserId: string | null;
  setSelectedRequestedByUserId: (value: string | null) => void;
  requestedByUsers: MainAppUserLookup[];
  setCurrentPage: (page: number) => void;
};

function RequestedByDropdownContent({
  requestedBySearchTerm,
  setRequestedBySearchTerm,
  selectedRequestedByUserId,
  setSelectedRequestedByUserId,
  requestedByUsers,
  setCurrentPage,
}: Readonly<RequestedByDropdownProps>) {
  const normalizedQuery = requestedBySearchTerm.trim().toLowerCase();
  const filteredUsers = requestedByUsers.filter((user: MainAppUserLookup) => {
    if (normalizedQuery.length === 0) return true;
    return String(user.name ?? "").toLowerCase().includes(normalizedQuery);
  });

  return (
    <div style={{ minWidth: "260px" }}>
      <input
        type="text"
        placeholder="Search user..."
        value={requestedBySearchTerm}
        onChange={(e) => setRequestedBySearchTerm(e.target.value)}
        style={{
          width: "100%",
          marginBottom: "8px",
          padding: "8px 10px",
          border: "1px solid #e5e7eb",
          borderRadius: "6px",
          fontSize: "13px",
        }}
      />
      <div style={{ marginBottom: "8px" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 4px",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          <input
            type="radio"
            name="approval-request-user-filter"
            checked={selectedRequestedByUserId == null}
            onChange={() => setSelectedRequestedByUserId(null)}
          />
          <span>All Users</span>
        </label>
        {filteredUsers.map((user: MainAppUserLookup) => {
          const phoneKey = String(user.phone ?? "").trim();
          const isSelected =
            selectedRequestedByUserId != null &&
            findMainAppUserByRequestUserId([user], selectedRequestedByUserId) != null;
          return (
            <label
              key={user.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 4px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="approval-request-user-filter"
                checked={isSelected}
                onChange={() => setSelectedRequestedByUserId(phoneKey)}
              />
              <span>{user.name}</span>
            </label>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={() => {
            setCurrentPage(1);
            setRequestedBySearchTerm("");
          }}
          style={{
            border: "none",
            backgroundColor: "#6366f1",
            color: "white",
            borderRadius: "6px",
            padding: "6px 10px",
            fontSize: "12px",
          }}
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedRequestedByUserId(null);
            setRequestedBySearchTerm("");
            setCurrentPage(1);
          }}
          style={{
            border: "1px solid #d1d5db",
            backgroundColor: "white",
            color: "#374151",
            borderRadius: "6px",
            padding: "6px 10px",
            fontSize: "12px",
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

type TypeDropdownProps = {
  selectedType: string;
  setSelectedType: (value: string) => void;
  setCurrentPage: (page: number) => void;
  types: string[];
};

function TypeDropdownContent({
  selectedType,
  setSelectedType,
  setCurrentPage,
  types,
}: Readonly<TypeDropdownProps>) {
  return (
    <div style={{ minWidth: "220px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <button
          type="button"
          onClick={() => {
            setSelectedType("");
            setCurrentPage(1);
          }}
          style={{
            textAlign: "left",
            border: "0px solid #e5e7eb",
            backgroundColor: selectedType === "" ? "#eef2ff" : "white",
            color: "#111827",
            borderRadius: "6px",
            padding: "8px 10px",
            fontSize: "13px",
          }}
        >
          All Types
        </button>
        {types.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setSelectedType(type);
              setCurrentPage(1);
            }}
            style={{
              textAlign: "left",
              border: "1px solid #e5e7eb",
              backgroundColor: selectedType === type ? "#eef2ff" : "white",
              color: "#111827",
              borderRadius: "6px",
              padding: "8px 10px",
              fontSize: "13px",
            }}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
}

type ApprovalFilterPillsArgs = {
  selectedType: string;
  setSelectedType: (value: string) => void;
  setCurrentPage: (page: number) => void;
  typeDropdownContent: React.ReactNode;
  selectedRequestedByUserId: string | null;
  setSelectedRequestedByUserId: (value: string | null) => void;
  setRequestedBySearchTerm: (value: string) => void;
  selectedRequestedByName: string;
  requestedByDropdownContent: React.ReactNode;
  selectedDate: string;
  setSelectedDate: (value: string) => void;
  dateOptions: string[];
};

function createApprovalFilterPills({
  selectedType,
  setSelectedType,
  setCurrentPage,
  typeDropdownContent,
  selectedRequestedByUserId,
  setSelectedRequestedByUserId,
  setRequestedBySearchTerm,
  selectedRequestedByName,
  requestedByDropdownContent,
  selectedDate,
  setSelectedDate,
  dateOptions,
}: Readonly<ApprovalFilterPillsArgs>): FilterPill[] {
  return [
    {
      id: "approval-type",
      label: "Type",
      showDropdown: true,
      active: Boolean(selectedType),
      activeLabel: selectedType || undefined,
      onClear: selectedType
        ? () => {
            setSelectedType("");
            setCurrentPage(1);
          }
        : undefined,
      dropdownContent: typeDropdownContent,
    },
    {
      id: "approval-requested-by",
      label: "Requested by",
      showDropdown: true,
      active: Boolean(selectedRequestedByUserId),
      activeLabel: selectedRequestedByName || undefined,
      onClear: selectedRequestedByUserId
        ? () => {
            setSelectedRequestedByUserId(null);
            setRequestedBySearchTerm("");
            setCurrentPage(1);
          }
        : undefined,
      dropdownContent: requestedByDropdownContent,
    },
    {
      id: "approval-date",
      label: "Dates",
      showDropdown: true,
      searchable: false,
      active: Boolean(selectedDate),
      activeLabel: selectedDate || undefined,
      onClear: selectedDate
        ? () => {
            setSelectedDate("");
            setCurrentPage(1);
          }
        : undefined,
      dropdownOptions: [
        {
          label: "All Dates",
          value: "__all__",
          onClick: () => {
            setSelectedDate("");
            setCurrentPage(1);
          },
        },
        ...dateOptions.map((option) => ({
          label: option,
          value: option,
          onClick: () => {
            setSelectedDate(option);
            setCurrentPage(1);
          },
        })),
      ],
    },
  ];
}

type ApprovalToolbarArgs = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onSearch: () => void;
  requestTabs: Array<{ id: string; label: string; removable: boolean }>;
  activeTab: "All" | "Pending" | "Approved" | "Rejected";
  setActiveTab: (tab: "All" | "Pending" | "Approved" | "Rejected") => void;
  setCurrentPage: (page: number) => void;
  filterPills: FilterPill[];
  canCreateRequest: boolean;
  openCreateModal: () => void;
  disableCreateRequest: boolean;
  onClearFilters: () => void;
};

function createApprovalToolbar({
  searchTerm,
  setSearchTerm,
  onSearch,
  requestTabs,
  activeTab,
  setActiveTab,
  setCurrentPage,
  filterPills,
  canCreateRequest,
  openCreateModal,
  disableCreateRequest,
  onClearFilters,
}: Readonly<ApprovalToolbarArgs>): ToolbarConfig {
  return {
    showSearch: true,
    searchValue: searchTerm,
    searchPlaceholder: "Search keyword ...",
    onSearchChange: setSearchTerm,
    onSearch,
    showTabs: true,
    tabs: requestTabs,
    activeTab,
    onTabChange: (tabId: string) => {
      if (tabId === "All" || tabId === "Pending" || tabId === "Approved" || tabId === "Rejected") {
        setActiveTab(tabId);
        setCurrentPage(1);
      }
    },
    showFilterPills: true,
    filterPills,
    showMoreFiltersButton: false,
    rightActions: canCreateRequest ? (
      <button
        type="button"
        onClick={openCreateModal}
        disabled={disableCreateRequest}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 14px",
          backgroundColor: disableCreateRequest ? "#000000" : "#141414",
          color: disableCreateRequest ? "#9ca3af" : "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: disableCreateRequest ? "not-allowed" : "pointer",
        }}
      >
        <Plus size={16} />
        New Request
      </button>
    ) : undefined,
    customActions: (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          type="button"
          onClick={onSearch}
          style={{
            border: "none",
            backgroundColor: "#141414",
            color: "white",
            borderRadius: "6px",
            padding: "7px 12px",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          Search
        </button>
        <button
          type="button"
          onClick={onClearFilters}
          style={{
            border: "1px solid #d1d5db",
            backgroundColor: "white",
            color: "#374151",
            borderRadius: "6px",
            padding: "7px 12px",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          Clear
        </button>
      </div>
    ),
  };
}

type ApprovalSummarySectionProps = {
  selectedRequest: UserRequest;
  approvalInfo: UserRequestApprovalInfo | null;
  mainAppUsers: MainAppUserLookup[];
  getDisplayName: (userId: UserRequestIdValue) => string;
};

function ApprovalLevelRow({
  approval,
  isLast,
  getDisplayName,
}: Readonly<{
  approval: RequestApprovalItem;
  isLast: boolean;
  getDisplayName: (userId: UserRequestIdValue) => string;
}>) {
  const statusNormalized = String(approval.status ?? "").toLowerCase();
  const isPendingApproval = statusNormalized === "pending";
  const statusPillStyle = getApprovalStatusPillStyle(statusNormalized);
  const approvedBy = approval.approved_by_user_id == null ? "-" : getDisplayName(approval.approved_by_user_id);

  return (
    <div
      style={{ padding: "8px 0", borderBottom: isLast ? "none" : "1px solid #e5e7eb" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "4px" }}>
        <strong style={{ color: "#374151" }}>Level {String(approval.level)}</strong>
        <span
          style={{
            backgroundColor: statusPillStyle.bg,
            color: statusPillStyle.color,
            borderRadius: "999px",
            padding: "2px 8px",
            fontSize: "11px",
            fontWeight: 600,
          }}
        >
          {formatApprovalStatusLabel(approval.status)}
        </span>
      </div>
      {isPendingApproval ? <div style={{ color: "#6b7280" }}>Awaiting approval</div> : null}
      {isPendingApproval ? null : <div style={{ color: "#111827", fontWeight: 500 }}>By: {approvedBy}</div>}
      {isPendingApproval || !approval.approved_at ? null : (
        <div style={{ color: "#6b7280" }}>At: {formatEventDate(approval.approved_at)}</div>
      )}
      {isPendingApproval || !approval.notes ? null : (
        <div style={{ color: "#6b7280" }}>Note: {approval.notes}</div>
      )}
    </div>
  );
}

function ApprovalSummarySection({
  selectedRequest,
  approvalInfo,
  mainAppUsers,
  getDisplayName,
}: Readonly<ApprovalSummarySectionProps>) {
  const dynamicApprovals = ((selectedRequest as UserRequest & { approvals?: RequestApprovalItem[] }).approvals ?? [])
    .slice()
    .sort((a: RequestApprovalItem, b: RequestApprovalItem) => Number(a.level) - Number(b.level));
  const approverNames = (approvalInfo?.assignees_for_current_level ?? [])
    .map((userId) => String(userId ?? "").trim())
    .filter((userId) => userId !== "")
    .map((userId) => {
      const matchedUser = mainAppUsers.find((user: MainAppUserLookup) => String(user.phone ?? "").trim() === userId);
      return matchedUser?.name ?? userId;
    });
  const currentLevelLabel = formatCurrentApprovalLevelLabel(approvalInfo?.current_approval_level);
  const createdAt = (selectedRequest as UserRequest & { created_at?: string }).created_at;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "#f9fafb" }}>
        <div style={{ fontSize: "15px", fontWeight: 600, color: "#1f2937", marginBottom: "6px" }}>
          {selectedRequest.subject ?? "—"}
        </div>
        {selectedRequest.reason ? (
          <div style={{ fontSize: "14px", color: "#4b5563", lineHeight: 1.5 }}>{selectedRequest.reason}</div>
        ) : null}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#6b7280" }}>
        <Calendar size={14} />
        <span>Submitted: {formatEventDate(createdAt)}</span>
      </div>
      {approverNames.length > 0 ? (
        <div>
          <div style={{ marginBottom: "8px", fontSize: "13px", fontWeight: 500, color: "#6b7280" }}>
            Who can approve{currentLevelLabel}:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {approverNames.map((name) => (
              <span
                key={name}
                style={{
                  padding: "5px 10px",
                  borderRadius: "999px",
                  backgroundColor: "#eef2ff",
                  border: "1px solid #e0e7ff",
                  color: "#3730a3",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {dynamicApprovals.length > 0 ? (
        <div>
          <div style={{ marginBottom: "8px", fontSize: "13px", fontWeight: 500, color: "#6b7280" }}>
            Who has approved
          </div>
          <div style={{ padding: "10px 12px", backgroundColor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "10px" }}>
            {dynamicApprovals.map((approval: RequestApprovalItem, idx: number) => (
              <ApprovalLevelRow
                key={approval.id}
                approval={approval}
                isLast={idx === dynamicApprovals.length - 1}
                getDisplayName={getDisplayName}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ApprovalDetailsSection({
  selectedCategoryName,
  dynamicFields,
}: Readonly<{
  selectedCategoryName: string;
  dynamicFields: Record<string, unknown>;
}>) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ fontSize: "13px", color: "#6b7280" }}>Type: {selectedCategoryName}</div>
      {Object.keys(dynamicFields).length > 0 ? (
        <div style={{ padding: "10px 12px", backgroundColor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "10px" }}>
          {Object.entries(dynamicFields).map(([key, value], idx, arr) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                padding: "8px 0",
                borderBottom: idx < arr.length - 1 ? "1px solid #e5e7eb" : "none",
              }}
            >
              <span style={{ color: "#6b7280", fontWeight: 600 }}>{formatDynamicFieldKey(key)}</span>
              <span style={{ color: "#111827", textAlign: "right", fontWeight: 500 }}>
                {formatDynamicFieldValue(value)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: "13px", color: "#9ca3af" }}>No additional details</div>
      )}
    </div>
  );
}

function ApprovalAttachmentsSection({
  attachments,
  handleDownloadAttachmentFromSidebar,
}: Readonly<{
  attachments: UserRequestAttachmentRow[];
  handleDownloadAttachmentFromSidebar: (attachment: UserRequestAttachmentRow) => Promise<void>;
}>) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {attachments.length === 0 ? (
        <div style={{ fontSize: "13px", color: "#9ca3af" }}>No attachments</div>
      ) : (
        attachments.map((attachment) => (
          <div
            key={attachment.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              backgroundColor: "white",
              gap: "10px",
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "#1f2937" }}>
                {attachment.original_name || "Attachment"}
              </div>
              <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                {attachment.mime_type ?? "File"}
                {formatAttachmentSizeSuffix(attachment.size_bytes)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDownloadAttachmentFromSidebar(attachment)}
              style={{
                padding: "8px",
                backgroundColor: "#f3f4f6",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
              title="Download"
            >
              <Download size={16} color="#6b7280" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function ApprovalCommentField({
  sidebarComment,
  setSidebarComment,
}: Readonly<{
  sidebarComment: string;
  setSidebarComment: (value: string) => void;
}>) {
  return (
    <div style={{ position: "relative" }}>
      <textarea
        value={sidebarComment}
        onChange={(e) => setSidebarComment(e.target.value.slice(0, 500))}
        placeholder="Add a comment *"
        style={{
          width: "100%",
          minHeight: "100px",
          padding: "12px",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          fontSize: "14px",
          color: "#1f2937",
          resize: "vertical",
        }}
      />
      <div style={{ position: "absolute", bottom: "10px", right: "12px", fontSize: "12px", color: "#9ca3af" }}>
        {sidebarComment.length}/500
      </div>
    </div>
  );
}

function PendingApprovalActionButtons({
  canApprove,
  canReject,
  canRequestChanges,
  sidebarSubmitting,
  sidebarSubmittingAction,
  handleApproveRequest,
  handleRejectRequest,
  handleRequestChanges,
}: Readonly<{
  canApprove: boolean;
  canReject: boolean;
  canRequestChanges: boolean;
  sidebarSubmitting: boolean;
  sidebarSubmittingAction: SidebarSubmittingAction;
  handleApproveRequest: () => Promise<void>;
  handleRejectRequest: () => Promise<void>;
  handleRequestChanges: () => Promise<void>;
}>) {
  return (
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
      {canApprove ? (
        <button
          type="button"
          onClick={handleApproveRequest}
          disabled={sidebarSubmitting}
          style={{
            flex: 1,
            minWidth: "110px",
            padding: "10px 14px",
            backgroundColor: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {sidebarSubmittingAction === "approve" ? "Approving..." : "Approve"}
        </button>
      ) : null}
      {canReject ? (
        <button
          type="button"
          onClick={handleRejectRequest}
          disabled={sidebarSubmitting}
          style={{
            flex: 1,
            minWidth: "110px",
            padding: "10px 14px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {sidebarSubmittingAction === "reject" ? "Rejecting..." : "Reject"}
        </button>
      ) : null}
      {canRequestChanges ? (
        <button
          type="button"
          onClick={handleRequestChanges}
          disabled={sidebarSubmitting}
          style={{
            flex: 1,
            minWidth: "140px",
            padding: "10px 14px",
            backgroundColor: "white",
            color: "#6b7280",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {sidebarSubmittingAction === "changes" ? "Submitting..." : "Request Changes"}
        </button>
      ) : null}
    </div>
  );
}

function ApprovalActionsSection({
  selectedRequest,
  sidebarComment,
  setSidebarComment,
  sidebarSubmitting,
  sidebarSubmittingAction,
  approvalInfo,
  permissions,
  handleApproveRequest,
  handleRejectRequest,
  handleRequestChanges,
}: Readonly<{
  selectedRequest: UserRequest;
  sidebarComment: string;
  setSidebarComment: (value: string) => void;
  sidebarSubmitting: boolean;
  sidebarSubmittingAction: SidebarSubmittingAction;
  approvalInfo: UserRequestApprovalInfo | null;
  permissions: string[] | undefined;
  handleApproveRequest: () => Promise<void>;
  handleRejectRequest: () => Promise<void>;
  handleRequestChanges: () => Promise<void>;
}>) {
  const statusDisplay = (selectedRequest.status || "").toLowerCase();
  const isPending = statusDisplay === "pending";
  const isApproved = statusDisplay === "approved";
  const canApprove = Boolean(
    isPending &&
    permissions?.includes(PERMISSIONS.APPROVE_REQUEST_APPROVAL_REQUEST_STAFF_MANAGEMENT) &&
    approvalInfo?.can_approve
  );
  const canReject = Boolean(
    isPending &&
    permissions?.includes(PERMISSIONS.REJECT_REQUEST_APPROVAL_REQUEST_STAFF_MANAGEMENT) &&
    approvalInfo?.can_reject
  );
  const canRequestChanges = Boolean(
    isPending &&
    permissions?.includes(PERMISSIONS.REQUEST_CHANGES_APPROVAL_REQUEST_STAFF_MANAGEMENT)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {isPending ? (
        <PendingApprovalActionButtons
          canApprove={canApprove}
          canReject={canReject}
          canRequestChanges={canRequestChanges}
          sidebarSubmitting={sidebarSubmitting}
          sidebarSubmittingAction={sidebarSubmittingAction}
          handleApproveRequest={handleApproveRequest}
          handleRejectRequest={handleRejectRequest}
          handleRequestChanges={handleRequestChanges}
        />
      ) : null}
      {isApproved ? null : <ApprovalCommentField sidebarComment={sidebarComment} setSidebarComment={setSidebarComment} />}
    </div>
  );
}

function ApprovalHistorySection({
  events,
}: Readonly<{
  events: Array<{ id: number; event_type: string; comment?: string | null; created_at?: string | null }>;
}>) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {events.length === 0 ? <div style={{ fontSize: "13px", color: "#9ca3af" }}>No history yet</div> : null}
      {events.map((event) => {
        const eventView = getEventView(event.event_type);
        return (
          <div
            key={event.id}
            style={{
              display: "flex",
              gap: "12px",
              padding: "12px",
              backgroundColor: eventView.bgColor,
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: eventView.avatarBgColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              {eventView.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "#1f2937", marginBottom: "2px" }}>
                {event.event_type}
                {event.comment ? (
                  <span style={{ fontWeight: 400, color: "#6b7280", marginLeft: "6px" }}>{event.comment}</span>
                ) : null}
              </div>
              <div style={{ fontSize: "12px", color: "#9ca3af" }}>{formatEventDate(event.created_at)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

type ApprovalSidebarSectionsArgs = {
  selectedRequest: UserRequest;
  approvalInfo: UserRequestApprovalInfo | null;
  mainAppUsers: MainAppUserLookup[];
  selectedCategoryName: string;
  permissions: string[] | undefined;
  sidebarComment: string;
  setSidebarComment: (value: string) => void;
  sidebarSubmitting: boolean;
  sidebarSubmittingAction: SidebarSubmittingAction;
  handleApproveRequest: () => Promise<void>;
  handleRejectRequest: () => Promise<void>;
  handleRequestChanges: () => Promise<void>;
  handleDownloadAttachmentFromSidebar: (attachment: UserRequestAttachmentRow) => Promise<void>;
  getDisplayName: (userId: UserRequestIdValue) => string;
};

function buildApprovalSidebarSections({
  selectedRequest,
  approvalInfo,
  mainAppUsers,
  selectedCategoryName,
  permissions,
  sidebarComment,
  setSidebarComment,
  sidebarSubmitting,
  sidebarSubmittingAction,
  handleApproveRequest,
  handleRejectRequest,
  handleRequestChanges,
  handleDownloadAttachmentFromSidebar,
  getDisplayName,
}: Readonly<ApprovalSidebarSectionsArgs>): SidebarSection[] {
  const dynamicFields =
    selectedRequest.dynamic_fields && typeof selectedRequest.dynamic_fields === "object"
      ? selectedRequest.dynamic_fields
      : {};
  const attachments = (selectedRequest.attachments ?? []) as UserRequestAttachmentRow[];
  const events = selectedRequest.events ?? [];

  return [
    {
      id: "approval-request-summary",
      title: "Request Summary",
      icon: FileText,
      collapsible: true,
      defaultExpanded: true,
      customContent: (
        <ApprovalSummarySection
          selectedRequest={selectedRequest}
          approvalInfo={approvalInfo}
          mainAppUsers={mainAppUsers}
          getDisplayName={getDisplayName}
        />
      ),
    },
    {
      id: "approval-details",
      title: "Details",
      icon: User,
      collapsible: true,
      defaultExpanded: true,
      customContent: (
        <ApprovalDetailsSection
          selectedCategoryName={selectedCategoryName}
          dynamicFields={dynamicFields}
        />
      ),
    },
    {
      id: "approval-attachments",
      title: "Attachments",
      icon: Download,
      collapsible: true,
      defaultExpanded: true,
      customContent: (
        <ApprovalAttachmentsSection
          attachments={attachments}
          handleDownloadAttachmentFromSidebar={handleDownloadAttachmentFromSidebar}
        />
      ),
    },
    {
      id: "approval-actions",
      title: "Actions",
      icon: Check,
      collapsible: true,
      defaultExpanded: true,
      customContent: (
        <ApprovalActionsSection
          selectedRequest={selectedRequest}
          sidebarComment={sidebarComment}
          setSidebarComment={setSidebarComment}
          sidebarSubmitting={sidebarSubmitting}
          sidebarSubmittingAction={sidebarSubmittingAction}
          approvalInfo={approvalInfo}
          permissions={permissions}
          handleApproveRequest={handleApproveRequest}
          handleRejectRequest={handleRejectRequest}
          handleRequestChanges={handleRequestChanges}
        />
      ),
    },
    {
      id: "approval-history",
      title: "History",
      icon: Clock,
      collapsible: true,
      defaultExpanded: true,
      customContent: <ApprovalHistorySection events={events} />,
    },
  ];
}

function ApprovalRequestsTableSection({
  requests,
  requestColumns,
  loadingRequests,
  currentPage,
  rowsPerPage,
  totalRequests,
  requestsPagination,
  handlePaginationChange,
  handleSelectRequest,
  approvalToolbar,
  requestsSummary,
}: Readonly<{
  requests: UserRequest[];
  requestColumns: TableColumn<UserRequest>[];
  loadingRequests: boolean;
  currentPage: number;
  rowsPerPage: number;
  totalRequests: number;
  requestsPagination: { page: number; limit: number; total: number; last_page: number } | null;
  handlePaginationChange: (page: number, limit: number) => void;
  handleSelectRequest: (request: UserRequest) => void;
  approvalToolbar: ToolbarConfig;
  requestsSummary: string;
}>) {
  return (
    <div className="approval-table-pane" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <GenericTable<UserRequest>
        data={requests}
        columns={requestColumns}
        showActions={false}
        loading={loadingRequests}
        loadingMessage="Loading requests..."
        emptyMessage="No requests"
        hover={true}
        uniqueKey="id"
        pagination={{
          currentPage,
          rowsPerPage: requestsPagination?.limit ?? rowsPerPage,
          totalRows: totalRequests,
          pageSizeOptions: [15, 25, 50, 100],
        }}
        onPaginationChange={handlePaginationChange}
        onRowClick={handleSelectRequest}
        onPreviewClick={handleSelectRequest}
        showToolbar={true}
        toolbar={approvalToolbar}
        showToolbarActions={false}
        fixedHeight={true}
        maxHeight="calc(100vh - 295px)"
      />

      <div style={{ marginTop: "10px", fontSize: "12px", color: "#6b7280" }}>
        {requestsSummary}
      </div>
    </div>
  );
}

type EditApprovalRequestModalProps = {
  show: boolean;
  editingRequest: UserRequest | null;
  categories: UserRequestCategory[];
  categoryFields: Record<number, UserRequestCategoryField[]>;
  onHide: () => void;
  onSuccess: () => void;
};

function EditApprovalRequestModal({
  show,
  editingRequest,
  categories,
  categoryFields,
  onHide,
  onSuccess,
}: Readonly<EditApprovalRequestModalProps>) {
  const [editForm, setEditForm] = useState<{
    subject: string;
    reason: string;
    dynamic_fields: Record<string, unknown>;
    dynamic_files: Record<string, File | null>;
    attachments: File[];
  }>({ subject: "", reason: "", dynamic_fields: {}, dynamic_files: {}, attachments: [] });
  const [editSubmitting, setEditSubmitting] = useState(false);
  /** Single-category fetch so we get `parent_id` when the list endpoint omits it on sub-categories. */
  const [editingCategoryDetail, setEditingCategoryDetail] = useState<UserRequestCategory | null>(null);

  useEffect(() => {
    if (!editingRequest) return;
    const df =
      editingRequest.dynamic_fields && typeof editingRequest.dynamic_fields === "object"
        ? editingRequest.dynamic_fields
        : {};
    setEditForm({
      subject: String(editingRequest.subject ?? ""),
      reason: String(editingRequest.reason ?? ""),
      dynamic_fields: { ...df },
      dynamic_files: {},
      attachments: [],
    });
  }, [editingRequest]);

  useEffect(() => {
    setEditingCategoryDetail(null);
    if (!show || editingRequest?.user_request_category_id == null) {
      return;
    }
    const catId = Number(editingRequest.user_request_category_id);
    if (Number.isNaN(catId)) {
      return;
    }
    let cancelled = false;
    getUserRequestCategory(catId)
      .then((cat) => {
        if (!cancelled) setEditingCategoryDetail(cat);
      })
      .catch(() => {
        if (!cancelled) setEditingCategoryDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [show, editingRequest?.user_request_category_id]);

  const getEditCategoryName = useCallback(
    (categoryId: number | string | null): string => {
      if (categoryId == null || categoryId === "") return "—";
      const id = Number(categoryId);
      const cat = categories.find((c) => Number(c.id) === id);
      return cat?.name ?? cat?.code ?? String(categoryId);
    },
    [categories]
  );

  const handleDownloadAttachment = useCallback(async (att: UserRequestAttachmentRow) => {
    try {
      const blob = await downloadUserRequestAttachment(att.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = att.original_name || "attachment";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (err) {
      console.error("Attachment download failed", err);
      toast.error("Download failed");
    }
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingRequest || !editForm.subject.trim()) {
        toast.error("Subject is required");
        return;
      }
      setEditSubmitting(true);
      try {
        const dynamic_files: Record<string, File> = {};
        Object.entries(editForm.dynamic_files).forEach(([key, file]) => {
          if (file) dynamic_files[key] = file;
        });
        await updateUserRequest(editingRequest.id, {
          subject: editForm.subject.trim(),
          reason: editForm.reason.trim() || null,
          dynamic_fields:
            Object.keys(editForm.dynamic_fields).length > 0 ? editForm.dynamic_fields : undefined,
          ...(Object.keys(dynamic_files).length > 0 ? { dynamic_files } : {}),
          ...(editForm.attachments.length > 0 ? { files: editForm.attachments } : {}),
        });
        toast.success("Request updated");
        onHide();
        onSuccess();
      } catch (err) {
        console.error("Failed to update request", err);
      } finally {
        setEditSubmitting(false);
      }
    },
    [editingRequest, editForm, onHide, onSuccess]
  );

  return (
    <WorkforceSidebarShell
      isOpen={show && editingRequest != null}
      className="new-request-sidebar"
      title="Edit Request"
      onClose={onHide}
      onSubmit={handleSubmit}
      submitLabel="Save"
      submittingLabel="Saving…"
      submitting={editSubmitting}
      primaryDisabled={editSubmitting}
    >
      {editingRequest &&
        (() => {
          const categoryView = getEditRequestCategoryView(
            editingRequest.user_request_category_id,
            categories,
            getEditCategoryName,
            { categoryDetail: editingCategoryDetail },
          );
          if (!categoryView) return null;
          const catId = editingRequest.user_request_category_id;
          return (
            <>
              {categoryView.hasParent && (
                <Form.Group className="mb-3">
                  <Form.Label className="new-request-label">Main category</Form.Label>
                  <Form.Control
                    readOnly
                    className="new-request-readonlyValue"
                    value={categoryView.parentName}
                    tabIndex={-1}
                  />
                </Form.Group>
              )}
              <Form.Group className="mb-3">
                <Form.Label className="new-request-label">
                  {categoryView.hasParent ? "Sub-category" : "Category"}
                </Form.Label>
                <Form.Select value={catId == null ? "" : String(catId)} disabled>
                  {categoryView.hasParent ? (
                    <option value={String(categoryView.subCategoryId)}>{categoryView.subCategoryName}</option>
                  ) : (
                    <>
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name ?? c.code ?? `Category ${c.id}`}
                        </option>
                      ))}
                      {catId != null && !categories.some((c) => c.id === catId) && (
                        <option value={catId}>{getEditCategoryName(catId)}</option>
                      )}
                    </>
                  )}
                </Form.Select>
              </Form.Group>
            </>
          );
        })()}
      <Form.Group className="mb-3">
        <Form.Label className="new-request-label">
          Subject <span className="text-danger">*</span>
        </Form.Label>
        <Form.Control
          type="text"
          value={editForm.subject}
          onChange={(e) => setEditForm((f) => ({ ...f, subject: e.target.value }))}
          placeholder="Request subject"
          required
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label className="new-request-label">Reason</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={editForm.reason}
          onChange={(e) => setEditForm((f) => ({ ...f, reason: e.target.value }))}
          placeholder="Optional reason or description"
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label className="new-request-label">Attachments</Form.Label>
        {editingRequest && (editingRequest.attachments ?? []).length > 0 && (
          <div className="new-request-attachmentList">
            <div className="new-request-attachmentListHeading">Current attachments</div>
            {(editingRequest.attachments ?? []).map((att: UserRequestAttachmentRow) => (
              <div key={att.id} className="new-request-attachmentRow">
                <div className="new-request-attachmentRowMain">
                  <FileText size={16} color="#6b7280" />
                  <span className="text-truncate new-request-attachmentName">
                    {att.original_name || "Attachment"}
                  </span>
                  {(att.mime_type ?? att.size_bytes) && (
                    <span className="new-request-attachmentMeta">
                      {att.mime_type ?? ""}
                      {att.size_bytes != null && ` • ${(att.size_bytes / 1024).toFixed(1)} KB`}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="new-request-attachmentDownloadBtn"
                  onClick={() => handleDownloadAttachment(att)}
                  title="Download"
                >
                  <Download size={14} color="#6b7280" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Form.Group>
      {editingRequest?.user_request_category_id != null &&
        (categoryFields[editingRequest.user_request_category_id] ?? []).length > 0 && (
          <EditRequestAdditionalFieldsSection
            fields={categoryFields[editingRequest.user_request_category_id] ?? []}
            dynamic_fields={editForm.dynamic_fields}
            onDynamicFieldChange={(key, value) =>
              setEditForm((f) => ({
                ...f,
                dynamic_fields: { ...f.dynamic_fields, [key]: value },
              }))
            }
            onDynamicFileChange={(key, file) =>
              setEditForm((f) => ({
                ...f,
                dynamic_files: { ...f.dynamic_files, [key]: file },
              }))
            }
          />
        )}
    </WorkforceSidebarShell>
  );
}

const ApprovalRequest = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { mainAppUsers } = useMainAppLookups();

  const getDisplayName = useCallback(
    (userId: UserRequestIdValue) => getUserDisplayNameFromLookup(mainAppUsers, userId),
    [mainAppUsers]
  );

  const [activeTab, setActiveTab] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedRequestedByUserId, setSelectedRequestedByUserId] = useState<string | null>(null);
  const [requestedBySearchTerm, setRequestedBySearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const rowsPerPageRef = useRef(rowsPerPage);
  rowsPerPageRef.current = rowsPerPage;
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);

  /** Categories bundle driven by TanStack Query (`useApprovalRequestCategoriesBundleQuery` in-page wiring pending — legacy fetch retained below). */
  const [categories, setCategories] = useState<UserRequestCategory[]>([]);
  const [categoryFields, setCategoryFields] = useState<Record<number, UserRequestCategoryField[]>>({});
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestsPagination, setRequestsPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    last_page: number;
  } | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<UserRequest | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<UserRequest | null>(null);
  const [sidebarComment, setSidebarComment] = useState("");
  const [sidebarSubmitting, setSidebarSubmitting] = useState(false);
  const [sidebarSubmittingAction, setSidebarSubmittingAction] = useState<SidebarSubmittingAction>(null);
  const [approvalInfo, setApprovalInfo] = useState<UserRequestApprovalInfo | null>(null);
  const [showSidebarDialog, setShowSidebarDialog] = useState(false);
  const [sidebarDialogConfig, setSidebarDialogConfig] = useState<{
    type: DialogVariant;
    title: string;
    message: string;
    onConfirm?: () => void;
  } | null>(null);

  const loadCategories = useCallback(
    async () => {
      setLoadingCategories(true);
      try {
        const { data } = await getUserRequestCategories({
          limit: 100,
          is_active: true,
          parent_id: null,
          children: false,
        });
        const parentsOnly = (data ?? []).filter((c) => c.parent_id == null);
        setCategories(parentsOnly);
        setCategoryFields({});
        if (data?.length) {
          const fieldsByCategory: Array<{ id: number; fields: UserRequestCategoryField[] }> = await Promise.all(
            data.map(async (cat: UserRequestCategory) => {
              try {
                const fields = await getUserRequestCategoryFields(cat.id);
                return { id: cat.id, fields };
              } catch (err) {
                console.error(`Failed to load fields for category ${cat.id}`, err);
                return { id: cat.id, fields: [] };
              }
            })
          );
          const map: Record<number, UserRequestCategoryField[]> = {};
          fieldsByCategory.forEach(({ id, fields }) => {
            map[id] = fields ?? [];
          });
          setCategoryFields(map);
        }
      } catch (err) {
        console.error("Failed to load request categories", err);
        setCategories([]);
        setCategoryFields({});
      } finally {
        setLoadingCategories(false);
      }
    },
    []
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  /** Sub-categories are not in `categories` when using `parent: null`; load fields when opening edit. */
  useEffect(() => {
    if (editingRequest?.user_request_category_id == null) return;
    const categoryId = Number(editingRequest.user_request_category_id);
    if (Number.isNaN(categoryId)) return;

    let cancelled = false;
    getUserRequestCategoryFields(categoryId)
      .then((fields) => {
        if (cancelled) return;
        setCategoryFields((prev) => {
          if (prev[categoryId] !== undefined) return prev;
          return { ...prev, [categoryId]: fields ?? [] };
        });
      })
      .catch((err) => {
        console.error(`Failed to load fields for category ${categoryId}`, err);
      });
    return () => {
      cancelled = true;
    };
  }, [editingRequest?.user_request_category_id]);

  const closeSidebar = useCallback(() => {
    setSelectedRequest(null);
    setSidebarComment("");
    setApprovalInfo(null);
  }, []);

  const loadRequests = useCallback(
    async (page = 1) => {
      setLoadingRequests(true);
      try {
        const status = TAB_TO_STATUS[activeTab] ?? "";
        const params: Record<string, unknown> = {
          page,
          limit: rowsPerPage,
          status,
        };
        if (searchTerm?.trim()) params.search = searchTerm.trim();
        const category = selectedType ? categories.find((c) => (c.name ?? c.code ?? String(c.id)) === selectedType) : undefined;
        if (category?.id != null) params.user_request_category_id = category.id;
        const requestedByTrimmed = selectedRequestedByUserId?.trim();
        if (requestedByTrimmed) params.user_ids = [requestedByTrimmed];
        const dateRange = getWorkforceTableDatePresetRange(selectedDate ?? "");
        if (dateRange) {
          params.created_at_from = dateRange.from;
          params.created_at_to = dateRange.to;
        }
        const { data, pagination: p } = await getUserRequests(params);
        setRequests(data ?? []);
        if (p) setRequestsPagination({ page: p.page, limit: p.limit, total: p.total, last_page: p.last_page });
        else setRequestsPagination(null);
      } catch (err) {
        console.error("Failed to load approval requests", err);
        setRequests([]);
        setRequestsPagination(null);
      } finally {
        setLoadingRequests(false);
      }
    },
    [activeTab, searchTerm, selectedType, selectedRequestedByUserId, selectedDate, categories, rowsPerPage]
  );

  const handlePaginationChange = useCallback((page: number, limit: number) => {
    if (rowsPerPageRef.current !== limit) {
      setRowsPerPage(limit);
      setCurrentPage(1);
      return;
    }
    setCurrentPage(page);
  }, []);

  useEffect(() => {
    loadRequests(currentPage);
  }, [currentPage, loadRequests]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRequestedByUserId, selectedDate]);

  // Open sidebar when navigating from notification with ?openId= (target_id)
  useEffect(() => {
    if (!router.isReady || !router.query.openId) return;
    const id = parseOpenIdFromQuery(router.query.openId);
    if (!id || Number.isNaN(Number(id))) return;
    let cancelled = false;
    (async () => {
      try {
        const request = await getUserRequest(Number(id));
        if (!cancelled && request) setSelectedRequest(request);
      } catch (err) {
        console.error("Failed to open request from notification", err);
      } finally {
        if (!cancelled) {
          const { openId: _, ...rest } = router.query;
          router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [router.isReady, router.query.openId]);

  const refreshRequests = useCallback(() => {
    loadRequests(currentPage);
  }, [loadRequests, currentPage]);

  const openActionResultDialog = useCallback(
    (type: DialogVariant, title: string, message: string, closeOnConfirm = false) => {
      setSidebarDialogConfig({
        type,
        title,
        message,
        onConfirm: closeOnConfirm
          ? () => {
              setSidebarComment("");
              refreshRequests();
              closeSidebar();
            }
          : undefined,
      });
      setShowSidebarDialog(true);
    },
    [closeSidebar, refreshRequests],
  );

  const closeSidebarDialog = useCallback(() => {
    setShowSidebarDialog(false);
    if (sidebarDialogConfig?.onConfirm) sidebarDialogConfig.onConfirm();
    setSidebarDialogConfig(null);
  }, [sidebarDialogConfig]);

  useEffect(() => {
    if (!selectedRequest) return;
    let cancelled = false;
    getUserRequestApprovalInfo(selectedRequest.id)
      .then((data: unknown) => {
        if (!cancelled) setApprovalInfo(data as UserRequestApprovalInfo);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          // noop
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRequest?.id]);

  const handleApproveRequest = useCallback(async () => {
    if (!selectedRequest) return;
    const extensionNumber = String((session?.user as { phone?: string | number } | undefined)?.phone ?? "").trim();
    const validationError = getApprovalActionValidationError(sidebarComment, extensionNumber, "approve");
    if (validationError) {
      setSidebarDialogConfig(getApprovalValidationDialogConfig(extensionNumber, validationError));
      setShowSidebarDialog(true);
      return;
    }
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setSidebarSubmitting(true);
    setSidebarSubmittingAction("approve");
    try {
      await approveUserRequest(selectedRequest.id, {
        extension_number: extensionNumber,
        notes: sidebarComment.trim(),
        timezone,
      });
      toast.success("Request approved");
      openActionResultDialog("success", "Request Approved", "The request has been approved successfully.", true);
    } catch {
      openActionResultDialog("error", "Error", "Failed to approve request.");
    } finally {
      setSidebarSubmitting(false);
      setSidebarSubmittingAction(null);
    }
  }, [selectedRequest, session?.user, sidebarComment, openActionResultDialog]);

  const handleRejectRequest = useCallback(async () => {
    if (!selectedRequest) return;
    const extensionNumber = String((session?.user as { phone?: string | number } | undefined)?.phone ?? "").trim();
    const validationError = getApprovalActionValidationError(sidebarComment, extensionNumber, "reject");
    if (validationError) {
      setSidebarDialogConfig(getApprovalValidationDialogConfig(extensionNumber, validationError));
      setShowSidebarDialog(true);
      return;
    }
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setSidebarSubmitting(true);
    setSidebarSubmittingAction("reject");
    try {
      await rejectUserRequest(selectedRequest.id, {
        notes: sidebarComment.trim(),
        timezone,
        extension_number: extensionNumber,
      });
      toast.success("Request rejected");
      openActionResultDialog("error", "Request Rejected", "The request has been rejected.", true);
    } catch {
      openActionResultDialog("error", "Error", "Failed to reject request.");
    } finally {
      setSidebarSubmitting(false);
      setSidebarSubmittingAction(null);
    }
  }, [selectedRequest, session?.user, sidebarComment, openActionResultDialog]);

  const handleRequestChanges = useCallback(async () => {
    if (!selectedRequest) return;
    if (!sidebarComment.trim()) {
      setSidebarDialogConfig({
        type: "warning",
        title: "Comment Required",
        message: "Please add a comment explaining what changes are needed.",
      });
      setShowSidebarDialog(true);
      return;
    }
    setSidebarSubmitting(true);
    setSidebarSubmittingAction("changes");
    try {
      await updateUserRequest(selectedRequest.id, { status: "pending", comment: sidebarComment.trim() });
      toast.success("Changes requested");
      openActionResultDialog("warning", "Changes Requested", "Changes have been requested for this request.", true);
    } catch {
      openActionResultDialog("error", "Error", "Failed to request changes.");
    } finally {
      setSidebarSubmitting(false);
      setSidebarSubmittingAction(null);
    }
  }, [selectedRequest, sidebarComment, openActionResultDialog]);

  const handleDownloadAttachmentFromSidebar = useCallback(async (attachment: UserRequestAttachmentRow) => {
    try {
      const blob = await downloadUserRequestAttachment(attachment.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.original_name || "attachment";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (err) {
      console.error("Attachment download failed", err);
      toast.error("Download failed");
    }
  }, []);

  const openCreateModal = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const openEditModal = useCallback((request: UserRequest) => {
    setSelectedRequest(null);
    setEditingRequest(request);
    setShowEditModal(true);
  }, []);

  const handleEditModalHide = useCallback(() => {
    setShowEditModal(false);
    setEditingRequest(null);
  }, []);

  const typeOptionsFromCategories = useMemo(() => categories.map((c) => c.name ?? c.code ?? String(c.id)), [categories]);

  const types = typeOptionsFromCategories.length > 0 ? typeOptionsFromCategories : ["Leave", "Document", "Onboarding", "Profile"];
  const requestedByUsers = Array.isArray(mainAppUsers) ? mainAppUsers : [];
  const selectedRequestedByName =
    selectedRequestedByUserId == null
      ? ""
      : (findMainAppUserByRequestUserId(requestedByUsers, selectedRequestedByUserId)?.name ??
        selectedRequestedByUserId);
  const dateOptions = ["Today", "Last 7 days", "Last 30 days", "All time"];
  const totalRequests = requestsPagination?.total ?? 0;
  const canCreateRequest =
    session?.user?.permissions?.includes(PERMISSIONS.ADD_APPROVAL_REQUEST_STAFF_MANAGEMENT) ?? false;

  const handleRunSearch = useCallback(() => {
    setCurrentPage(1);
    loadRequests(1);
  }, [loadRequests]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedType("");
    setSelectedRequestedByUserId(null);
    setRequestedBySearchTerm("");
    setSelectedDate("");
    setCurrentPage(1);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!requestToDelete) return;
    setDeleting(true);
    try {
      await deleteUserRequest(requestToDelete.id);
      toast.success("Request deleted");
      refreshRequests();
      setShowDeleteModal(false);
      setRequestToDelete(null);
    } catch (err) {
      console.error("Failed to delete request", err);
    } finally {
      setDeleting(false);
    }
  }, [requestToDelete, refreshRequests]);

  const getCategoryName = (categoryId: number | string | null): string => {
    if (categoryId == null || categoryId === "") return "—";
    const id = Number(categoryId);
    const cat = categories.find((c) => Number(c.id) === id);
    return cat?.name ?? cat?.code ?? String(categoryId);
  };

  const requestTabs = useMemo(
    () => [
      { id: "All", label: "All", removable: false },
      { id: "Pending", label: "Pending", removable: false },
      { id: "Approved", label: "Approved", removable: false },
      { id: "Rejected", label: "Rejected", removable: false },
    ],
    []
  );

  const requestColumns = useMemo<TableColumn<UserRequest>[]>(
    () => createApprovalRequestColumns({ categories, getDisplayName }),
    [categories, getDisplayName]
  );

  const requestedByDropdownContent = useMemo(
    () => (
      <RequestedByDropdownContent
        requestedBySearchTerm={requestedBySearchTerm}
        setRequestedBySearchTerm={setRequestedBySearchTerm}
        selectedRequestedByUserId={selectedRequestedByUserId}
        setSelectedRequestedByUserId={setSelectedRequestedByUserId}
        requestedByUsers={requestedByUsers}
        setCurrentPage={setCurrentPage}
      />
    ),
    [requestedBySearchTerm, selectedRequestedByUserId, requestedByUsers]
  );

  const typeDropdownContent = useMemo(
    () => (
      <TypeDropdownContent
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        setCurrentPage={setCurrentPage}
        types={types}
      />
    ),
    [selectedType, types]
  );

  const filterPills = useMemo<FilterPill[]>(
    () =>
      createApprovalFilterPills({
        selectedType,
        setSelectedType,
        setCurrentPage,
        typeDropdownContent,
        selectedRequestedByUserId,
        setSelectedRequestedByUserId,
        setRequestedBySearchTerm,
        selectedRequestedByName,
        requestedByDropdownContent,
        selectedDate,
        setSelectedDate,
        dateOptions,
      }),
    [
      selectedType,
      typeDropdownContent,
      selectedRequestedByUserId,
      selectedRequestedByName,
      requestedByDropdownContent,
      selectedDate,
      dateOptions,
    ]
  );

  const approvalToolbar = useMemo<ToolbarConfig>(
    () =>
      createApprovalToolbar({
        searchTerm,
        setSearchTerm,
        onSearch: handleRunSearch,
        requestTabs,
        activeTab,
        setActiveTab,
        setCurrentPage,
        filterPills,
        canCreateRequest,
        openCreateModal,
        disableCreateRequest: categories.length === 0 || loadingCategories,
        onClearFilters: handleClearFilters,
      }),
    [
      searchTerm,
      handleRunSearch,
      requestTabs,
      activeTab,
      filterPills,
      canCreateRequest,
      openCreateModal,
      categories.length,
      loadingCategories,
      handleClearFilters,
    ]
  );

  const requestsSummary =
    totalRequests === 0
      ? "Showing 0 of 0 requests"
      : `Showing ${((currentPage - 1) * (requestsPagination?.limit ?? rowsPerPage)) + 1}-${Math.min(currentPage * (requestsPagination?.limit ?? rowsPerPage), totalRequests)} of ${totalRequests} requests`;

  const selectedCategoryName = selectedRequest ? getCategoryName(selectedRequest.user_request_category_id) : "—";

  const handleSelectRequest = useCallback((request: UserRequest) => {
    setSelectedRequest(request);
    getUserRequest(request.id)
      .then((nextRequest: UserRequest) => {
        setSelectedRequest(nextRequest);
      })
      .catch((err: unknown) => {
        console.error("Failed to load request details", err);
        toast.error("Could not load request details");
      });
  }, []);

  const approvalSidebarSections = useMemo<SidebarSection[]>(() => {
    if (!selectedRequest) return [];
    return buildApprovalSidebarSections({
      selectedRequest,
      approvalInfo,
      mainAppUsers,
      selectedCategoryName,
      permissions: session?.user?.permissions,
      sidebarComment,
      setSidebarComment,
      sidebarSubmitting,
      sidebarSubmittingAction,
      handleApproveRequest,
      handleRejectRequest,
      handleRequestChanges,
      handleDownloadAttachmentFromSidebar,
      getDisplayName,
    });
  }, [
    selectedRequest,
    approvalInfo,
    sidebarComment,
    sidebarSubmitting,
    sidebarSubmittingAction,
    mainAppUsers,
    selectedCategoryName,
    session?.user?.permissions,
    handleApproveRequest,
    handleRejectRequest,
    handleRequestChanges,
    handleDownloadAttachmentFromSidebar,
    getDisplayName,
  ]);

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Customer Dashboard" />
      <div className="approval-page-shell" style={{ display: "flex", gap: 0, height: "calc(100vh)", overflow: "hidden" }}>
        <ApprovalRequestsTableSection
          requests={requests}
          requestColumns={requestColumns}
          loadingRequests={loadingRequests}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          totalRequests={totalRequests}
          requestsPagination={requestsPagination}
          handlePaginationChange={handlePaginationChange}
          handleSelectRequest={handleSelectRequest}
          approvalToolbar={approvalToolbar}
          requestsSummary={requestsSummary}
        />

        {selectedRequest ? (
          <GenericSidebar
            isOpen={Boolean(selectedRequest)}
            onClose={closeSidebar}
            title={getDisplayName(selectedRequest.user_id)}
            subtitle={selectedCategoryName}
            company={selectedRequest.status}
            avatar={{
              initials: getDisplayName(selectedRequest.user_id).slice(0, 2).toUpperCase(),
              name: getDisplayName(selectedRequest.user_id),
              gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
            quickActions={[
              {
                id: "edit-request",
                label: "Edit",
                icon: Pencil,
                onClick: () => openEditModal(selectedRequest),
                disabled:
                  !session?.user?.permissions?.includes(
                    PERMISSIONS.UPDATE_APPROVAL_REQUEST_STAFF_MANAGEMENT,
                  ),
              },
              {
                id: "delete-request",
                label: "Delete",
                icon: Trash2,
                onClick: () => {
                  setRequestToDelete(selectedRequest);
                  setShowDeleteModal(true);
                  closeSidebar();
                },
                disabled:
                  !session?.user?.permissions?.includes(
                    PERMISSIONS.DELETE_APPROVAL_REQUEST_STAFF_MANAGEMENT,
                  ) || deleting,
              },
            ]}
            sections={approvalSidebarSections}
          />
        ) : null}
      </div>

      <NewRequestModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSuccess={refreshRequests}
        title="New Request"
        submitLabel="Create Request"
      />

      <EditApprovalRequestModal
        show={showEditModal}
        editingRequest={editingRequest}
        categories={categories}
        categoryFields={categoryFields}
        onHide={handleEditModalHide}
        onSuccess={refreshRequests}
      />

      {showSidebarDialog && sidebarDialogConfig ? (
        <Modal show onHide={closeSidebarDialog} centered style={{ zIndex: 999999 }}>
          <Modal.Body style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  backgroundColor: getDialogTypeBgColor(sidebarDialogConfig.type),
                }}
              >
                {sidebarDialogConfig.type === "success" ? <CheckCircle size={28} color="#10b981" /> : null}
                {sidebarDialogConfig.type === "error" ? <XCircle size={28} color="#ef4444" /> : null}
                {sidebarDialogConfig.type === "warning" ? <Edit3 size={28} color="#f59e0b" /> : null}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937", margin: "0 0 8px 0" }}>
                  {sidebarDialogConfig.title}
                </h3>
                <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.5", margin: 0 }}>
                  {sidebarDialogConfig.message}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={closeSidebarDialog}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "#6366f1",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                OK
              </button>
            </div>
          </Modal.Body>
        </Modal>
      ) : null}

      {/* Delete request confirmation modal */}
      <DeleteConfirmationModal
        show={showDeleteModal && !!requestToDelete}
        onHide={() => {
          setShowDeleteModal(false);
          setRequestToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemName={requestToDelete?.subject ?? (requestToDelete ? `Request #${requestToDelete.id}` : undefined)}
        itemType="request"
        loading={deleting}
      />
    </React.Fragment>
  );
};

ApprovalRequest.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ApprovalRequest;
