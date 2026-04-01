import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { useSession } from "next-auth/react";
import {
  getUserRequestCategories,
  getUserRequestCategoryFields,
  getUserRequests,
  getUserRequest,
  updateUserRequest,
  deleteUserRequest,
  downloadUserRequestAttachment,
  type UserRequestCategory,
  type UserRequestCategoryField,
  type UserRequest,
} from "@utils/staffManagement";
import { useMainAppLookups, type MainAppUserLookup } from "@hooks/useMainAppLookups";
import { toast } from "react-toastify";
import { Badge, Button, Modal, Form } from "react-bootstrap";
import GenericTable, { FilterPill, TableColumn, ToolbarConfig } from "@components/GenericTable";

import {
  FileText,
  Calendar,
  UserPlus,
  User,
  File,
  Plus,
  Download,
} from "lucide-react";
import ApprovalDetailSidebar from "./sidebar";
import DeleteConfirmationModal from "../../partial/DeleteConfirmationModal";
import NewRequestModal from "@pages/workforce/NewRequestModal";
import {
  findMainAppUserByRequestUserId,
  getUserDisplayNameFromLookup,
  type UserRequestIdValue,
} from "@utils/workforceApprovalRequestsUserLookup";

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

function getDateRangeForOption(option: string): { start_date_from: string; start_date_to: string } | null {
  if (!option?.trim()) return null;
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  const toStr = to.toISOString().slice(0, 10);
  const from = new Date(now);
  switch (option.trim()) {
    case "Today":
      from.setHours(0, 0, 0, 0);
      return { start_date_from: toStr, start_date_to: toStr };
    case "Last 7 days":
      from.setDate(from.getDate() - 7);
      break;
    case "Last 30 days":
      from.setDate(from.getDate() - 30);
      break;
    case "Last 3 months":
      from.setMonth(from.getMonth() - 3);
      break;
    case "All time":
    default:
      return null;
  }
  from.setHours(0, 0, 0, 0);
  const fromStr = from.toISOString().slice(0, 10);
  return { start_date_from: fromStr, start_date_to: toStr };
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

function getMultiselectValues(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") return raw.split(",").filter(Boolean);
  return [];
}

function dynamicFieldInputType(fieldType: string): "number" | "date" | "text" {
  if (fieldType === "number") return "number";
  if (fieldType === "date") return "date";
  return "text";
}

function isFileOrAttachmentField(field: UserRequestCategoryField): boolean {
  const t = String(field.type);
  return t === "file" || t === "attachment";
}

type EditDynamicFieldsProps = {
  fields: UserRequestCategoryField[];
  dynamic_fields: Record<string, unknown>;
  onDynamicFieldChange: (key: string, value: unknown) => void;
  onDynamicFileChange: (key: string, file: File | null) => void;
};

type EditDynamicFieldRowProps = {
  field: UserRequestCategoryField;
  dynamic_fields: Record<string, unknown>;
  onDynamicFieldChange: (key: string, value: unknown) => void;
  onDynamicFileChange: (key: string, file: File | null) => void;
};

function EditRequestDynamicFieldRow({
  field,
  dynamic_fields,
  onDynamicFieldChange,
  onDynamicFileChange,
}: Readonly<EditDynamicFieldRowProps>) {
  const fieldKey = field.key ?? "";

  if (field.type === "textarea") {
    return (
      <Form.Control
        as="textarea"
        rows={2}
        value={(dynamic_fields[fieldKey] as string) ?? ""}
        onChange={(e) => onDynamicFieldChange(fieldKey, e.target.value)}
        placeholder={field.config?.placeholder ?? undefined}
      />
    );
  }

  if (isFileOrAttachmentField(field)) {
    return (
      <Form.Control
        type="file"
        onChange={(e) => {
          const file = (e.target as HTMLInputElement).files?.[0] ?? null;
          onDynamicFileChange(fieldKey, file);
        }}
      />
    );
  }

  if (field.type === "select") {
    return (
      <Form.Select
        value={(dynamic_fields[fieldKey] as string) ?? ""}
        onChange={(e) => onDynamicFieldChange(fieldKey, e.target.value)}
      >
        <option value="">Select...</option>
        {(field.options ?? []).map((opt: { value: string; label: string }) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Form.Select>
    );
  }

  if (field.type === "multiselect") {
    return (
      <Form.Select
        multiple
        value={getMultiselectValues(dynamic_fields[fieldKey])}
        onChange={(e) => {
          const selected = Array.from((e.target as HTMLSelectElement).selectedOptions, (o) => o.value);
          onDynamicFieldChange(fieldKey, selected);
        }}
      >
        {(field.options ?? []).map((opt: { value: string; label: string }) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Form.Select>
    );
  }

  if (field.type === "radio") {
    return (
      <div className="d-flex flex-wrap gap-2">
        {(field.options ?? []).map((opt: { value: string; label: string }) => (
          <Form.Check
            key={opt.value}
            type="radio"
            id={`edit-${field.key}-${opt.value}`}
            name={fieldKey}
            label={opt.label}
            value={opt.value}
            checked={(dynamic_fields[fieldKey] as string) === opt.value}
            onChange={() => onDynamicFieldChange(fieldKey, opt.value)}
          />
        ))}
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <div className="d-flex flex-wrap gap-2">
        {(field.options ?? []).map((opt: { value: string; label: string }) => {
          const arr = getMultiselectValues(dynamic_fields[fieldKey]);
          const checked = arr.includes(opt.value);
          const next = checked ? arr.filter((v) => v !== opt.value) : [...arr, opt.value];
          return (
            <Form.Check
              key={opt.value}
              type="checkbox"
              id={`edit-${field.key}-${opt.value}`}
              label={opt.label}
              checked={checked}
              onChange={() => onDynamicFieldChange(fieldKey, next)}
            />
          );
        })}
      </div>
    );
  }

  return (
    <Form.Control
      type={dynamicFieldInputType(field.type)}
      value={(dynamic_fields[fieldKey] as string) ?? ""}
      onChange={(e) => onDynamicFieldChange(fieldKey, e.target.value)}
      placeholder={field.config?.placeholder ?? undefined}
    />
  );
}

function EditRequestAdditionalFieldsSection(props: Readonly<EditDynamicFieldsProps>) {
  const { fields, dynamic_fields, onDynamicFieldChange, onDynamicFileChange } = props;
  return (
    <Form.Group className="mb-3">
      <Form.Label>Additional fields</Form.Label>
      <div className="border rounded p-3 bg-light">
        {fields.map((field) => (
          <div key={field.id} className="mb-2">
            <Form.Label className="small mb-1">
              {field.label ?? field.key}
              {field.required ? " *" : ""}
            </Form.Label>
            <EditRequestDynamicFieldRow
              field={field}
              dynamic_fields={dynamic_fields}
              onDynamicFieldChange={onDynamicFieldChange}
              onDynamicFileChange={onDynamicFileChange}
            />
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
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);

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
  const [editForm, setEditForm] = useState<{
    subject: string;
    reason: string;
    dynamic_fields: Record<string, unknown>;
    dynamic_files: Record<string, File | null>;
    attachments: File[];
  }>({ subject: "", reason: "", dynamic_fields: {}, dynamic_files: {}, attachments: [] });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const loadCategories = useCallback(
    async () => {
      setLoadingCategories(true);
      try {
        const { data } = await getUserRequestCategories({ limit: 100,is_active:true });
        setCategories(data ?? []);
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

  const loadRequests = useCallback(
    async (page = 1) => {
      setLoadingRequests(true);
      try {
        const status = TAB_TO_STATUS[activeTab] ?? "";
        const params: Record<string, unknown> = {
          page,
          limit: 10,
          status,
        };
        if (searchTerm?.trim()) params.search = searchTerm.trim();
        const category = selectedType ? categories.find((c) => (c.name ?? c.code ?? String(c.id)) === selectedType) : undefined;
        if (category?.id != null) params.user_request_category_id = category.id;
        const requestedByTrimmed = selectedRequestedByUserId?.trim();
        if (requestedByTrimmed) params.user_ids = [requestedByTrimmed];
        const dateRange = getDateRangeForOption(selectedDate ?? "");
        if (dateRange) {
          params.created_at_from = dateRange.start_date_from;
          params.created_at_to = dateRange.start_date_to;
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
    [activeTab, searchTerm, selectedType, selectedRequestedByUserId, selectedDate, categories]
  );

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

  const openCreateModal = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const openEditModal = useCallback((request: UserRequest) => {
    setSelectedRequest(null);
    setEditingRequest(request);
    const df =
      request.dynamic_fields && typeof request.dynamic_fields === "object"
        ? request.dynamic_fields
        : {};
    setEditForm({
      subject: String(request.subject ?? ""),
      reason: String(request.reason ?? ""),
      dynamic_fields: { ...df },
      dynamic_files: {},
      attachments: [],
    });
    setShowEditModal(true);
  }, []);

  const handleEditSubmit = useCallback(
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
        setShowEditModal(false);
        setEditingRequest(null);
        refreshRequests();
      } catch (err) {
        console.error("Failed to update request", err);
      } finally {
        setEditSubmitting(false);
      }
    },
    [editingRequest, editForm, refreshRequests]
  );

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

  const getCategoryName = (categoryId: number | string | null): string => {
    if (categoryId == null || categoryId === "") return "—";
    const id = Number(categoryId);
    const cat = categories.find((c) => Number(c.id) === id);
    return cat?.name ?? cat?.code ?? String(categoryId);
  };

  const getTypeIconFromCategory = (categoryId: number | null): string => {
    const name = getCategoryName(categoryId).toLowerCase();
    if (name.includes("leave")) return "leave";
    if (name.includes("document")) return "document";
    if (name.includes("onboarding")) return "onboarding";
    if (name.includes("profile")) return "profile";
    return "file";
  };

  const getTypeIcon = (iconType: string) => {
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
  };

  const getTypeColor = (iconType: string) => {
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
    () => [
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
          const iconType = getTypeIconFromCategory(request.user_request_category_id);
          const categoryName =
            (request as UserRequest & { category?: { name?: string | null } }).category?.name ?? "—";
          return (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                backgroundColor: getTypeColor(iconType),
                borderRadius: "6px",
              }}
            >
              {getTypeIcon(iconType)}
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
    ],
    [getDisplayName, categories]
  );

  const requestedByDropdownContent = useMemo(
    () => (
      <div style={{ minWidth: "260px", maxHeight: "320px", overflow: "hidden" }}>
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
        <div style={{ maxHeight: "200px", overflowY: "auto", marginBottom: "8px" }}>
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
          {requestedByUsers
            .filter((u: MainAppUserLookup) => {
              const name = String(u.name ?? "");
              const q = requestedBySearchTerm.trim().toLowerCase();
              return q.length === 0 || name.toLowerCase().includes(q);
            })
            .map((u: MainAppUserLookup) => {
              const phoneKey = String(u.phone ?? "").trim();
              const isSelected =
                selectedRequestedByUserId != null &&
                findMainAppUserByRequestUserId([u], selectedRequestedByUserId) != null;
              return (
                <label
                  key={u.id}
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
                  <span>{u.name}</span>
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
    ),
    [requestedBySearchTerm, selectedRequestedByUserId, requestedByUsers]
  );

  const typeDropdownContent = useMemo(
    () => (
      <div style={{ minWidth: "220px" }}>
        <div style={{ maxHeight: "240px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
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
    ),
    [selectedType, types]
  );

  const filterPills = useMemo<FilterPill[]>(
    () => [
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
    ],
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
    () => ({
      showSearch: true,
      searchValue: searchTerm,
      searchPlaceholder: "Search keyword ...",
      onSearchChange: setSearchTerm,
      onSearch: () => {
        setCurrentPage(1);
        loadRequests(1);
      },
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
      customActions: (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={() => {
              setCurrentPage(1);
              loadRequests(1);
            }}
            style={{
              border: "none",
              backgroundColor: "#6366f1",
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
            onClick={() => {
              setSearchTerm("");
              setSelectedType("");
              setSelectedRequestedByUserId(null);
              setRequestedBySearchTerm("");
              setSelectedDate("");
              setCurrentPage(1);
            }}
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
    }),
    [
      searchTerm,
      loadRequests,
      requestTabs,
      activeTab,
      filterPills,
    ]
  );

  const requestsSummary =
    totalRequests === 0
      ? "Showing 0 of 0 requests"
      : `Showing ${((currentPage - 1) * (requestsPagination?.limit ?? 10)) + 1}-${Math.min(currentPage * (requestsPagination?.limit ?? 10), totalRequests)} of ${totalRequests} requests`;

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Customer Dashboard" />
      <div>
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              Approval Requests
            </h1>
            {session?.user?.permissions?.includes("add-approval-request-staff-management") && (
              <button
                type="button"
                onClick={openCreateModal}
                disabled={categories.length === 0 || loadingCategories}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 14px",
                  backgroundColor: categories.length === 0 || loadingCategories ? "#e5e7eb" : "#6366f1",
                  color: categories.length === 0 || loadingCategories ? "#9ca3af" : "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: categories.length === 0 || loadingCategories ? "not-allowed" : "pointer",
                }}
              >
                <Plus size={16} />
                New Request
              </button>
            )}
          </div>

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
              rowsPerPage: requestsPagination?.limit ?? 10,
              totalRows: totalRequests,
              pageSizeOptions: [10],
            }}
            onPaginationChange={(page) => setCurrentPage(page)}
            onRowClick={(request) => {
              setSelectedRequest(request);
              getUserRequest(request.id)
                .then((nextRequest: UserRequest) => {
                  setSelectedRequest(nextRequest);
                })
                .catch((err: unknown) => {
                  console.error("Failed to load request details", err);
                  toast.error("Could not load request details");
                });
            }}
            showToolbar={true}
            toolbar={approvalToolbar}
            showToolbarActions={false}
          />

          <div style={{ marginTop: "10px", fontSize: "12px", color: "#6b7280" }}>
            {requestsSummary}
          </div>
        </div>
      </div>

      <NewRequestModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSuccess={refreshRequests}
        title="New Request"
        submitLabel="Create Request"
      />

      {/* Edit Request Modal */}
      <Modal show={showEditModal} onHide={() => { setShowEditModal(false); setEditingRequest(null); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Request</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            {editingRequest && (
              <>
                {/* <Form.Group className="mb-3">
                  <Form.Label>Created at</Form.Label>
                  <Form.Control
                    type="text"
                    value={formatRequestDateTime((editingRequest as { created_at?: string }).created_at)}
                    readOnly
                    disabled
                    className="bg-light"
                  />
                </Form.Group> */}
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={editingRequest.user_request_category_id ?? ""}
                    disabled
                    className="bg-light"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name ?? c.code ?? `Category ${c.id}`}
                      </option>
                    ))}
                    {editingRequest.user_request_category_id != null &&
                      !categories.some((c) => c.id === editingRequest.user_request_category_id) && (
                      <option value={editingRequest.user_request_category_id}>
                        {getCategoryName(editingRequest.user_request_category_id)}
                      </option>
                    )}
                  </Form.Select>
                </Form.Group>
              </>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Subject *</Form.Label>
              <Form.Control
                type="text"
                value={editForm.subject}
                onChange={(e) => setEditForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Request subject"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reason</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editForm.reason}
                onChange={(e) => setEditForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Optional reason or description"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Attachments</Form.Label>
              {editingRequest && (editingRequest.attachments ?? []).length > 0 && (
                <div className="mb-2 p-2 border rounded bg-light">
                  <div className="small text-muted mb-2">Current attachments</div>
                  {(editingRequest.attachments ?? []).map((att: UserRequestAttachmentRow) => (
                    <div
                      key={att.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 8px",
                        backgroundColor: "white",
                        borderRadius: "6px",
                        marginBottom: "4px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                        <FileText size={16} color="#6b7280" />
                        <span className="text-truncate" style={{ fontSize: "13px" }}>
                          {att.original_name || "Attachment"}
                        </span>
                        {(att.mime_type ?? att.size_bytes) && (
                          <span className="text-muted" style={{ fontSize: "12px" }}>
                            {att.mime_type ?? ""}
                            {att.size_bytes != null && ` • ${(att.size_bytes / 1024).toFixed(1)} KB`}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
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
                        }}
                        style={{
                          padding: "4px 8px",
                          border: "none",
                          borderRadius: "4px",
                          backgroundColor: "#f3f4f6",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
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
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setEditingRequest(null); }} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={editSubmitting}>
              {editSubmitting ? "Saving…" : "Save"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Approval Detail Sidebar */}
      {selectedRequest && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "stretch",
          }}
        >
          <button
            type="button"
            aria-label="Close request details"
            onClick={() => setSelectedRequest(null)}
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              padding: 0,
              margin: 0,
              cursor: "pointer",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            }}
          />
          <div style={{ flexShrink: 0, maxWidth: "100%", overflow: "auto" }}>
            <ApprovalDetailSidebar
              request={selectedRequest}
              categoryName={getCategoryName(selectedRequest.user_request_category_id)}
              onClose={() => setSelectedRequest(null)}
              onSuccess={refreshRequests}
              onEditClick={openEditModal}
              
              onDeleteClick={(request: UserRequest) => {
                setRequestToDelete(request);
                setSelectedRequest(null);
                setShowDeleteModal(true);
              }}
              downloadAttachment={downloadUserRequestAttachment}
            />
          </div>
        </div>
      )}

      {/* Delete request confirmation modal */}
      <DeleteConfirmationModal
        show={showDeleteModal && !!requestToDelete}
        onHide={() => {
          setShowDeleteModal(false);
          setRequestToDelete(null);
        }}
        onConfirm={async () => {
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
        }}
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
