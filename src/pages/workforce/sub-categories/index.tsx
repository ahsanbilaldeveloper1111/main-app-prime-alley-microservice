import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useEffect, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import { Button, Modal, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import {
  getUserRequestCategories,
  createUserRequestCategory,
  updateUserRequestCategory,
  deleteUserRequestCategory,
  getUserRequestCategoryFields,
  createUserRequestCategoryField,
  updateUserRequestCategoryField,
  deleteUserRequestCategoryField,
  reorderUserRequestCategoryFields,
  type UserRequestCategory,
  type UserRequestCategoryPayload,
  type UserRequestCategoryField,
  type UserRequestCategoryFieldPayload,
  type UserRequestCategoryFieldType,
  type FieldsReorderItem,
  type WorkflowLevelPayload,
  type WorkflowLevelAssignee,
} from "@utils/staffManagement";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import { Pencil, Trash2, List, Plus, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, GripVertical } from "lucide-react";
import Select from "@components/AppSelect";

const FIELD_TYPES: { value: UserRequestCategoryFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select" },
  { value: "multiselect", label: "Multi Select" },
  { value: "boolean", label: "Boolean" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio buttons" },
  { value: "toggle", label: "Yes/No toggle" },
  { value: "file", label: "File" },
];

const CONDITION_OPS: { value: "eq" | "neq" | "in" | "contains"; label: string }[] = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
  { value: "in", label: "in (comma list)" },
  { value: "contains", label: "contains" },
];

const OPTION_TYPES: UserRequestCategoryFieldType[] = ["select", "multiselect", "radio", "checkbox"];

function slugifyForKey(label: string): string {
  const s = String(label ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  if (!s) return "";
  return /^[a-z]/.test(s) ? s : `field_${s}`;
}

const defaultCategoryForm: UserRequestCategoryPayload & { workflow_levels?: WorkflowLevelPayload[] } = {
  name: "",
  code: "",
  description: "",
  is_active: true,
  sort_order: 0,
  tracking_enabled: false,
  tracking_code_prefix: "",
  workflow_levels: [],
};

type CategoryFormState = UserRequestCategoryPayload & { workflow_levels?: WorkflowLevelPayload[] };

function AssigneesList({
  assignees,
  mainAppUsers,
  levelIndex,
  categoryForm,
  setCategoryForm,
}: {
  assignees: WorkflowLevelAssignee[];
  mainAppUsers: { id: number; name: string }[];
  levelIndex: number;
  categoryForm: CategoryFormState;
  setCategoryForm: React.Dispatch<React.SetStateAction<CategoryFormState>>;
}) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const updateAssignees = (newAssignees: WorkflowLevelAssignee[]) => {
    const levels = [...(categoryForm.workflow_levels ?? [])];
    levels[levelIndex] = { ...levels[levelIndex], assignees: newAssignees };
    setCategoryForm((f) => ({ ...f, workflow_levels: levels }));
  };

  const handleDragStart = (e: React.DragEvent, assigneeIdx: number) => {
    setDraggedIndex(assigneeIdx);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(assigneeIdx));
    e.dataTransfer.setData("application/json", JSON.stringify({ from: assigneeIdx }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    setDraggedIndex(null);
    const fromStr = e.dataTransfer.getData("text/plain");
    const fromIndex = fromStr === "" ? -1 : parseInt(fromStr, 10);
    if (fromIndex < 0 || fromIndex === toIndex) return;
    const reordered = [...assignees];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, removed);
    updateAssignees(reordered.map((a, i) => ({ ...a, sort_order: i })));
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const userOptions = mainAppUsers.map((u) => ({ value: String(u.id), label: u.name ?? String(u.id) }));

  return (
    <div className="d-flex flex-column gap-2">
      {assignees.map((assignee, assigneeIdx) => (
        <div
          key={assigneeIdx}
          draggable
          onDragStart={(e) => handleDragStart(e, assigneeIdx)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, assigneeIdx)}
          onDragEnd={handleDragEnd}
          className="d-flex align-items-center gap-2 p-2 border rounded bg-white"
          style={{
            opacity: draggedIndex === assigneeIdx ? 0.6 : 1,
            cursor: "grab",
          }}
        >
          <span className="d-flex align-items-center" style={{ cursor: "grab" }} aria-hidden>
            <GripVertical size={18} className="text-muted" />
          </span>
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <Select<{ value: string; label: string }, false>
              options={userOptions}
              value={
                assignee.user_id
                  ? (() => {
                      const u = mainAppUsers.find((x) => String(x.id) === assignee.user_id);
                      return { value: assignee.user_id, label: u?.name ?? assignee.user_id };
                    })()
                  : null
              }
              onChange={(opt: { value: string; label: string } | null) => {
                const next = [...assignees];
                next[assigneeIdx] = { ...next[assigneeIdx], user_id: opt?.value ?? "", sort_order: assigneeIdx };
                updateAssignees(next);
              }}
              placeholder="Select user..."
              isClearable
              className="react-select-container"
              classNamePrefix="select"
            />
          </div>
          <span className="small text-muted text-nowrap">Order: {assigneeIdx + 1}</span>
          <Button
            type="button"
            variant="link"
            className="text-danger p-0"
            aria-label="Remove assignee"
            onClick={() => {
              const next = assignees.filter((_, i) => i !== assigneeIdx).map((a, i) => ({ ...a, sort_order: i }));
              updateAssignees(next);
            }}
          >
            <Trash2 size={18} />
          </Button>
        </div>
      ))}
    </div>
  );
}

const RequestSubCategories = () => {
  const { data: session } = useSession();
  const { mainAppUsers } = useMainAppLookups();
  const [categories, setCategories] = useState<UserRequestCategory[]>([]);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; last_page: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<UserRequestCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<UserRequestCategoryPayload & { workflow_levels?: WorkflowLevelPayload[] }>(defaultCategoryForm);
  const [savingCategory, setSavingCategory] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<UserRequestCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showFieldsModal, setShowFieldsModal] = useState(false);
  const [fieldsCategoryId, setFieldsCategoryId] = useState<number | null>(null);
  const [fieldsCategoryName, setFieldsCategoryName] = useState("");
  const [fields, setFields] = useState<UserRequestCategoryField[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<UserRequestCategoryField | null>(null);
  const [fieldForm, setFieldForm] = useState<UserRequestCategoryFieldPayload>({
    key: "",
    label: "",
    type: "text",
    required: false,
    options: null,
    config: null,
    sort_order: 0,
    is_active: true,
  });
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [autoGenerateKey, setAutoGenerateKey] = useState(true);
  const [savingField, setSavingField] = useState(false);
  const [reordering, setReordering] = useState(false);

  const loadCategories = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const { data, pagination: p } = await getUserRequestCategories({ page, limit, children: true });
      setCategories(data ?? []);
      if (p) setPagination({ page: p.page, limit: p.limit, total: p.total, last_page: p.last_page });
      else setPagination(null);
    } catch {
      setCategories([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ ...defaultCategoryForm });
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat: UserRequestCategory) => {
    setEditingCategory(cat);
    const raw = cat as UserRequestCategory & { parent_id?: number | null; sort_order?: number; tracking_enabled?: boolean; tracking_code_prefix?: string; workflow_levels?: WorkflowLevelPayload[] };
    setCategoryForm({
      name: cat.name ?? "",
      code: cat.code ?? "",
      description: cat.description ?? "",
      is_active: cat.is_active !== false,
      parent_id: raw.parent_id ?? undefined,
      sort_order: raw.sort_order ?? 0,
      tracking_enabled: raw.tracking_enabled ?? false,
      tracking_code_prefix: raw.tracking_code_prefix ?? "",
      workflow_levels: Array.isArray(raw.workflow_levels) ? raw.workflow_levels : [],
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const isChild = categoryForm.parent_id != null && categoryForm.parent_id !== 0;
    if (isChild && !categoryForm.name?.trim()) {
      toast.error("Name is required for sub-categories");
      return;
    }
    const payload: UserRequestCategoryPayload = {
      name: categoryForm.name?.trim() || undefined,
      code: categoryForm.code?.trim() || undefined,
      description: categoryForm.description?.trim() || undefined,
      is_active: categoryForm.is_active,
      parent_id: null,
      sort_order: categoryForm.sort_order ?? 0,
      tracking_enabled: categoryForm.tracking_enabled ?? false,
      tracking_code_prefix: (categoryForm.tracking_code_prefix ?? "").slice(0, 50) || undefined,
      workflow_levels: (() => {
        const levels = (categoryForm as { workflow_levels?: WorkflowLevelPayload[] }).workflow_levels;
        if (!levels?.length) return undefined;
        return levels.map((lvl) => ({
          ...lvl,
          assignees: (lvl.assignees ?? [])
            .filter((a) => (a.user_id ?? "").trim() !== "")
            .map((a, i) => ({ ...a, sort_order: i })),
        }));
      })(),
    };
    setSavingCategory(true);
    try {
      if (editingCategory) {
        await updateUserRequestCategory(editingCategory.id, payload);
        toast.success("Category updated");
      } else {
        await createUserRequestCategory(payload);
        toast.success("Category created");
      }
      setShowCategoryModal(false);
      loadCategories(pagination?.page ?? 1, pagination?.limit ?? 10);
    } catch {
      // toast in API
    } finally {
      setSavingCategory(false);
    }
  };

  const openDeleteCategory = (cat: UserRequestCategory) => {
    setCategoryToDelete(cat);
    setShowDeleteModal(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    try {
      await deleteUserRequestCategory(categoryToDelete.id);
      toast.success("Category deleted");
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      loadCategories(pagination?.page ?? 1, pagination?.limit ?? 10);
    } catch {
      // toast in API
    } finally {
      setDeleting(false);
    }
  };

  const openFieldsModal = async (cat: UserRequestCategory) => {
    setFieldsCategoryId(cat.id);
    setFieldsCategoryName(cat.name ?? "");
    setShowFieldsModal(true);
    setLoadingFields(true);
    try {
      const list = await getUserRequestCategoryFields(cat.id);
      setFields(list ?? []);
    } catch {
      setFields([]);
    } finally {
      setLoadingFields(false);
    }
  };

  const closeFieldsModal = () => {
    setShowFieldsModal(false);
    setFieldsCategoryId(null);
    setFieldsCategoryName("");
    setFields([]);
    setShowFieldModal(false);
  };

  const openAddField = () => {
    setEditingField(null);
    setFieldForm({
      key: "",
      label: "",
      type: "text",
      required: false,
      options: null,
      sort_order: fields.length,
      is_active: true,
    });
    setShowFieldModal(true);
  };

  const openEditField = (f: UserRequestCategoryField) => {
    setEditingField(f);
    setAutoGenerateKey(false);
    setShowAdvanced(true);
    const c = f.config ?? {};
    setFieldForm({
      key: f.key ?? "",
      label: f.label ?? "",
      type: f.type ?? "text",
      required: f.required ?? false,
      options: f.options ?? [],
      config: {
        placeholder: c.placeholder ?? "",
        help_text: c.help_text ?? "",
        validation: c.validation
          ? {
              pattern: c.validation.pattern ?? "",
              mimes: c.validation.mimes ?? "",
              min: c.validation.min ?? "",
              max: c.validation.max ?? "",
            }
          : { pattern: "", mimes: "", min: "", max: "" },
        required_if: c.required_if ?? null,
        show_if: c.show_if ?? null,
      },
      sort_order: f.sort_order ?? 0,
      is_active: f.is_active !== false,
    });
    setShowFieldModal(true);
  };

  const generateKeyFromLabel = () => {
    setFieldForm((f) => ({ ...f, key: slugifyForKey(f.label) }));
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldsCategoryId) return;
    if (!fieldForm.key?.trim() || !fieldForm.label?.trim()) {
      toast.error("Key and label are required");
      return;
    }
    setSavingField(true);
    try {
      if (editingField) {
        await updateUserRequestCategoryField(fieldsCategoryId, editingField.id, fieldForm);
        toast.success("Field updated");
      } else {
        await createUserRequestCategoryField(fieldsCategoryId, fieldForm);
        toast.success("Field added");
      }
      setShowFieldModal(false);
      const list = await getUserRequestCategoryFields(fieldsCategoryId);
      setFields(list ?? []);
    } catch {
      // toast in API
    } finally {
      setSavingField(false);
    }
  };

  const handleDeleteField = async (fieldId: number) => {
    if (!fieldsCategoryId || !globalThis.confirm("Delete this field?")) return;
    try {
      await deleteUserRequestCategoryField(fieldsCategoryId, fieldId);
      toast.success("Field deleted");
      const list = await getUserRequestCategoryFields(fieldsCategoryId);
      setFields(list ?? []);
    } catch {
      // toast in API
    }
  };

  const moveField = async (index: number, direction: "up" | "down") => {
    if (!fieldsCategoryId || fields.length < 2) return;
    const newFields = [...fields];
    const swap = direction === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= newFields.length) return;
    [newFields[index], newFields[swap]] = [newFields[swap], newFields[index]];
    const order: FieldsReorderItem[] = newFields.map((f, i) => ({ id: f.id, sort_order: i }));
    setReordering(true);
    try {
      await reorderUserRequestCategoryFields(fieldsCategoryId, order);
      setFields(newFields);
      toast.success("Order updated");
    } catch {
      // toast in API
    } finally {
      setReordering(false);
    }
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Request Sub-Categories" />
      <PageHeader
        title="Request Sub-Categories"
        showSearch={false}
        buttons={
          <>
          {session?.user?.permissions?.includes('manage-request-categories-staff-management') && (
          <Button variant="primary" onClick={openCreateCategory}>
            <Plus size={18} className="me-1" />
            Add Category
          </Button>
          )}
          </>
        }
      />

      <div style={{ backgroundColor: "#F9FAFB", fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif" }}>
        {/* Table */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            overflow: "hidden",
            marginBottom: "24px",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#6b7280" }}>Name</th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#6b7280" }}>Code</th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#6b7280" }}>Description</th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#6b7280" }}>Active</th>
                  <th style={{ padding: "16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#6b7280", width: 180 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "24px", fontSize: "14px", color: "#6b7280" }}>
                      Loading…
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "24px", fontSize: "14px", color: "#6b7280" }}>
                      No request categories yet. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat, index) => (
                    <tr
                      key={cat.id}
                      style={{
                        borderBottom: index < categories.length - 1 ? "1px solid #f3f4f6" : "none",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f9fafb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "white";
                      }}
                    >
                      <td style={{ padding: "16px" }}>
                        <div style={{ fontSize: "14px", fontWeight: "500", color: "#1f2937" }}>
                          {cat.name ?? "—"}
                        </div>
                      </td>
                      <td style={{ padding: "16px", fontSize: "14px", color: "#1f2937" }}>
                        {cat.code ?? "—"}
                      </td>
                      <td style={{ padding: "16px", fontSize: "14px", color: "#1f2937" }}>
                        {cat.description
                          ? String(cat.description).slice(0, 50) + (String(cat.description).length > 50 ? "…" : "")
                          : "—"}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "16px",
                            fontSize: "13px",
                            fontWeight: "500",
                            backgroundColor: cat.is_active !== false ? "#d1fae5" : "#e5e7eb",
                            color: cat.is_active !== false ? "#065f46" : "#6b7280",
                          }}
                        >
                          {cat.is_active !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ padding: "16px" }}>
                        {session?.user?.permissions?.includes('manage-request-categories-staff-management') && (
                       <>
                       <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditCategory(cat);
                          }}
                          title="Edit"
                          style={{
                            padding: "6px 10px",
                            marginRight: "6px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                            backgroundColor: "white",
                            cursor: "pointer",
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openFieldsModal(cat);
                          }}
                          title="Manage fields"
                          style={{
                            padding: "6px 10px",
                            marginRight: "6px",
                            border: "1px solid #6366f1",
                            borderRadius: "6px",
                            backgroundColor: "white",
                            color: "#6366f1",
                            cursor: "pointer",
                          }}
                        >
                          <List size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteCategory(cat);
                          }}
                          title="Delete"
                          style={{
                            padding: "6px 10px",
                            border: "1px solid #fecaca",
                            borderRadius: "6px",
                            backgroundColor: "#fef2f2",
                            color: "#b91c1c",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                        </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ fontSize: "14px", color: "#6b7280" }}>
              {pagination
                ? `Showing ${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} categories`
                : categories.length > 0
                  ? `Showing ${categories.length} categories`
                  : "No categories"}
            </div>
            {pagination && pagination.last_page > 1 && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => loadCategories(1, pagination.limit)}
                  disabled={pagination.page <= 1}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    backgroundColor: pagination.page <= 1 ? "#f9fafb" : "white",
                    cursor: pagination.page <= 1 ? "not-allowed" : "pointer",
                    opacity: pagination.page <= 1 ? 0.5 : 1,
                  }}
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => loadCategories(pagination.page - 1, pagination.limit)}
                  disabled={pagination.page <= 1}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    backgroundColor: pagination.page <= 1 ? "#f9fafb" : "white",
                    cursor: pagination.page <= 1 ? "not-allowed" : "pointer",
                    opacity: pagination.page <= 1 ? 0.5 : 1,
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                {[...new Array(pagination.last_page)].map((_, idx) => {
                  const pageNum = idx + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.last_page ||
                    (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => loadCategories(pageNum, pagination.limit)}
                        style={{
                          padding: "8px 14px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          backgroundColor: pagination.page === pageNum ? "#6366f1" : "white",
                          color: pagination.page === pageNum ? "white" : "#1f2937",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: pagination.page === pageNum ? "600" : "400",
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === pagination.page - 2 || pageNum === pagination.page + 2) {
                    return (
                      <span key={pageNum} style={{ padding: "8px 4px", color: "#6b7280" }}>
                        …
                      </span>
                    );
                  }
                  return null;
                })}
                <button
                  type="button"
                  onClick={() => loadCategories(pagination.page + 1, pagination.limit)}
                  disabled={pagination.page >= pagination.last_page}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    backgroundColor: pagination.page >= pagination.last_page ? "#f9fafb" : "white",
                    cursor: pagination.page >= pagination.last_page ? "not-allowed" : "pointer",
                    opacity: pagination.page >= pagination.last_page ? 0.5 : 1,
                  }}
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => loadCategories(pagination.last_page, pagination.limit)}
                  disabled={pagination.page >= pagination.last_page}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    backgroundColor: pagination.page >= pagination.last_page ? "#f9fafb" : "white",
                    cursor: pagination.page >= pagination.last_page ? "not-allowed" : "pointer",
                    opacity: pagination.page >= pagination.last_page ? 0.5 : 1,
                  }}
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Category Modal */}
      <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingCategory ? "Edit Category" : "Create Category"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveCategory}>
          <Modal.Body>
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Name (optional)</Form.Label>
                  <Form.Control
                    type="text"
                    value={categoryForm.name ?? ""}
                    onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Leave Request"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Code (optional)</Form.Label>
                  <Form.Control
                    type="text"
                    value={categoryForm.code ?? ""}
                    onChange={(e) => setCategoryForm((f) => ({ ...f, code: e.target.value || undefined }))}
                    placeholder="e.g. LEAVE"
                  />
                </Form.Group>
              </div>
              
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Parent category</Form.Label>
                  <Form.Select
                    value={categoryForm.parent_id ?? ""}
                    onChange={(e) => setCategoryForm((f) => ({ ...f, parent_id: e.target.value === "" ? undefined : Number(e.target.value) }))}
                  >
                    <option value="">— Main category (no parent) —</option>
                    {categories
                      .filter((c) => !editingCategory || c.id !== editingCategory.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name ?? `Category ${c.id}`}
                        </option>
                      ))}
                  </Form.Select>
                  <Form.Text className="text-muted">Leave as &quot;Main category&quot; for top-level. Sub-categories get their own fields.</Form.Text>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={categoryForm.is_active !== false ? "true" : "false"}
                    onChange={(e) => setCategoryForm((f) => ({ ...f, is_active: e.target.value === "true" }))}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Sort order</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    value={categoryForm.sort_order ?? 0}
                    onChange={(e) => setCategoryForm((f) => ({ ...f, sort_order: parseInt(String(e.target.value), 10) || 0 }))}
                  />
                </Form.Group>
              </div>
              <div className="col-12">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <Form.Label className="mb-0 fw-semibold">Approval workflow (level & order) (optional)</Form.Label>
                  <Button
                    type="button"
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      const levels = (categoryForm as { workflow_levels?: WorkflowLevelPayload[] }).workflow_levels ?? [];
                      const nextLevel = levels.length + 1;
                      setCategoryForm((f) => ({
                        ...f,
                        workflow_levels: [...levels, { level: nextLevel, name: `Level ${nextLevel}`, assignees: [] }],
                      }));
                    }}
                  >
                    <Plus size={14} className="me-1" />
                    Add level
                  </Button>
                </div>
                <Form.Text className="text-muted d-block mb-2">
                  Optional for main (parent) categories. Add levels if you want approval workflow; child categories can define their own.
                </Form.Text>
                {((categoryForm as { workflow_levels?: WorkflowLevelPayload[] }).workflow_levels?.length ?? 0) === 0 ? (
                  <div className="border rounded p-3 bg-light text-center text-muted">
                    <p className="mb-2 small">No workflow levels. You can add levels and assign approvers, or save as-is.</p>
                    <Button
                      type="button"
                      variant="outline-primary"
                      size="sm"
                      onClick={() => {
                        setCategoryForm((f) => ({
                          ...f,
                          workflow_levels: [{ level: 1, name: "Level 1", assignees: [] }],
                        }));
                      }}
                    >
                      <Plus size={14} className="me-1" />
                      Add level (optional)
                    </Button>
                  </div>
                ) : (
                  <div className="border rounded p-3 bg-light">
                    {((categoryForm as { workflow_levels?: WorkflowLevelPayload[] }).workflow_levels ?? []).map((lvl, idx) => (
                      <div key={idx} className="mb-3 pb-3 border-bottom border-secondary border-opacity-25">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <strong>Level {lvl.level}</strong>
                          <Button
                            type="button"
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              const levels = (categoryForm as { workflow_levels?: WorkflowLevelPayload[] }).workflow_levels ?? [];
                              setCategoryForm((f) => ({
                                ...f,
                                workflow_levels: levels.filter((_, i) => i !== idx).map((l, i) => ({ ...l, level: i + 1 })),
                              }));
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                        <Form.Group className="mb-2">
                          <Form.Label className="small">Level name (optional)</Form.Label>
                          <Form.Control
                            size="sm"
                            type="text"
                            value={lvl.name ?? ""}
                            onChange={(e) => {
                              const levels = [...((categoryForm as { workflow_levels?: WorkflowLevelPayload[] }).workflow_levels ?? [])];
                              levels[idx] = { ...levels[idx], name: e.target.value || undefined };
                              setCategoryForm((f) => ({ ...f, workflow_levels: levels }));
                            }}
                            placeholder="e.g. Manager approval"
                          />
                        </Form.Group>
                        <div className="row g-2 mb-2">
                          <div className="col-md-6">
                            <Form.Select
                              value={lvl.approval_rule ?? "any"}
                              onChange={(e) => {
                                const levels = [...((categoryForm as { workflow_levels?: WorkflowLevelPayload[] }).workflow_levels ?? [])];
                                levels[idx] = { ...levels[idx], approval_rule: (e.target.value as "any" | "all") || undefined };
                                setCategoryForm((f) => ({ ...f, workflow_levels: levels }));
                              }}
                            >
                              <option value="any">Any one can approve</option>
                              <option value="all">All must approve</option>
                            </Form.Select>
                          </div>
                          <div className="col-md-6 d-flex align-items-center">
                            <Form.Check
                              type="checkbox"
                              id={`wl-order-${idx}`}
                              label="Approve in order"
                              disabled={lvl.approval_rule !== "all"}
                              checked={lvl.approve_in_order === true}
                              onChange={(e) => {
                                const levels = [...((categoryForm as { workflow_levels?: WorkflowLevelPayload[] }).workflow_levels ?? [])];
                                levels[idx] = { ...levels[idx], approve_in_order: e.target.checked };
                                setCategoryForm((f) => ({ ...f, workflow_levels: levels }));
                              }}
                              title={lvl.approval_rule !== "all" ? "Only available when 'All must approve' is selected" : undefined}
                            />
                            <span className="ms-1 small text-muted" title="Only when All must approve">ⓘ</span>
                          </div>
                        </div>
                        <Form.Group>
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <Form.Label className="small mb-0">Assignees (who can approve this level)</Form.Label>
                            <Button
                              type="button"
                              variant="outline-primary"
                              size="sm"
                              onClick={() => {
                                const levels = [...((categoryForm as { workflow_levels?: WorkflowLevelPayload[] }).workflow_levels ?? [])];
                                const current = levels[idx].assignees ?? [];
                                levels[idx] = {
                                  ...levels[idx],
                                  assignees: [...current, { user_id: "", sort_order: current.length }],
                                };
                                setCategoryForm((f) => ({ ...f, workflow_levels: levels }));
                              }}
                            >
                              <Plus size={14} className="me-1" />
                              Add
                            </Button>
                          </div>
                          {(lvl.assignees ?? []).length === 0 ? (
                            <div className="text-muted small py-2">No assignees. Click Add to assign approvers for this level.</div>
                          ) : (
                            <AssigneesList
                              assignees={lvl.assignees ?? []}
                              mainAppUsers={mainAppUsers}
                              levelIndex={idx}
                              categoryForm={categoryForm}
                              setCategoryForm={setCategoryForm}
                            />
                          )}
                        </Form.Group>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Tracking</Form.Label>
                  <Form.Select
                    value={categoryForm.tracking_enabled ? "true" : "false"}
                    onChange={(e) => setCategoryForm((f) => ({ ...f, tracking_enabled: e.target.value === "true" }))}
                  >
                    <option value="false">Disabled</option>
                    <option value="true">Enabled</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Tracking code prefix (optional)</Form.Label>
                  <Form.Control
                    type="text"
                    maxLength={50}
                    value={categoryForm.tracking_code_prefix ?? ""}
                    onChange={(e) => setCategoryForm((f) => ({ ...f, tracking_code_prefix: e.target.value || undefined }))}
                    placeholder="e.g. REQ"
                  />
                  <Form.Text className="text-muted">Used when tracking is enabled.</Form.Text>
                </Form.Group>
              </div>
              <div className="col-12">
                <Form.Group>
                  <Form.Label>Description (optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={categoryForm.description ?? ""}
                    onChange={(e) => setCategoryForm((f) => ({ ...f, description: e.target.value || undefined }))}
                    placeholder="Optional description"
                  />
                </Form.Group>
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="light" type="button" onClick={() => setShowCategoryModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={savingCategory}>
                {savingCategory ? "Saving…" : editingCategory ? "Update" : "Create"}
              </Button>
            </div>
          </Modal.Body>
        </Form>
      </Modal>

      {/* Delete Category Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => !deleting && setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {categoryToDelete && (
            <p className="mb-0">
              Are you sure you want to delete <strong>{categoryToDelete.name}</strong>? This action cannot be undone.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteCategory} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Manage Fields Modal */}
      <Modal show={showFieldsModal} onHide={closeFieldsModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Fields: {fieldsCategoryName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-muted">Define form fields for this request category.</span>
            <Button variant="primary" size="sm" onClick={openAddField}>
              <Plus size={16} className="me-1" />
              Add Field
            </Button>
          </div>
          {loadingFields ? (
            <p className="text-muted mb-0">Loading fields…</p>
          ) : fields.length === 0 ? (
            <p className="text-muted mb-0">No fields yet. Add one to define the request form.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#6b7280", width: 50 }} />
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#6b7280" }}>Key</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#6b7280" }}>Label</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#6b7280" }}>Type</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#6b7280" }}>Required</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#6b7280" }}>Active</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#6b7280", width: 140 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((f, index) => (
                    <tr
                      key={f.id}
                      style={{
                        borderBottom: index < fields.length - 1 ? "1px solid #f3f4f6" : "none",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f9fafb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "white";
                      }}
                    >
                      <td style={{ padding: "12px", color: "#6b7280" }}>
                        <button type="button" style={{ cursor: reordering ? "not-allowed" : "pointer", opacity: reordering ? 0.5 : 1, padding: "4px", marginRight: "4px", border: "none", background: "none" }} onClick={() => moveField(index, "up")} disabled={reordering} aria-label="Move up">
                          <ChevronUp size={16} />
                        </button>
                        <button type="button" style={{ cursor: reordering ? "not-allowed" : "pointer", opacity: reordering ? 0.5 : 1, padding: "4px", border: "none", background: "none" }} onClick={() => moveField(index, "down")} disabled={reordering} aria-label="Move down">
                          <ChevronDown size={16} />
                        </button>
                      </td>
                      <td style={{ padding: "12px", fontSize: "14px", color: "#1f2937" }}>{f.key}</td>
                      <td style={{ padding: "12px", fontSize: "14px", color: "#1f2937" }}>{f.label}</td>
                      <td style={{ padding: "12px", fontSize: "14px", color: "#1f2937" }}>{f.type}</td>
                      <td style={{ padding: "12px", fontSize: "14px", color: "#1f2937" }}>{f.required ? "Yes" : "No"}</td>
                      <td style={{ padding: "12px", fontSize: "14px", color: "#1f2937" }}>{f.is_active !== false ? "Yes" : "No"}</td>
                      <td style={{ padding: "12px" }}>
                        <button type="button" onClick={() => openEditField(f)} style={{ padding: "6px 10px", marginRight: "6px", border: "1px solid #e5e7eb", borderRadius: "6px", backgroundColor: "white", cursor: "pointer", fontSize: "13px" }}>
                          Edit
                        </button>
                        <button type="button" onClick={() => handleDeleteField(f.id)} style={{ padding: "6px 10px", border: "1px solid #fecaca", borderRadius: "6px", backgroundColor: "#fef2f2", color: "#b91c1c", cursor: "pointer", fontSize: "13px" }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeFieldsModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add/Edit Field Modal */}
      <Modal show={showFieldModal} onHide={() => setShowFieldModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingField ? "Edit Field" : "Add Field"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveField}>
          <Modal.Body>
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Key *</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="text"
                      value={fieldForm.key}
                      onChange={(e) => setFieldForm((f) => ({ ...f, key: e.target.value }))}
                      placeholder="e.g. doc_type"
                      required
                      pattern="^[A-Za-z][A-Za-z0-9_]*$"
                      title="Letters, numbers, underscore only; must start with a letter"
                      disabled={!!editingField}
                    />
                    <Button type="button" variant="outline-secondary" onClick={generateKeyFromLabel} disabled={!!editingField}>
                      Generate
                    </Button>
                  </div>
                  <Form.Text className="text-muted small">Letters/numbers/underscore only.</Form.Text>
                  <div className="mt-2">
                    <Form.Check
                      type="switch"
                      id="auto-generate-key"
                      label="Auto-generate key from label"
                      checked={autoGenerateKey}
                      onChange={(e) => setAutoGenerateKey(e.target.checked)}
                      disabled={!!editingField}
                    />
                  </div>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Label *</Form.Label>
                  <Form.Control
                    type="text"
                    value={fieldForm.label}
                    onChange={(e) =>
                      setFieldForm((f) => ({
                        ...f,
                        label: e.target.value,
                        ...(autoGenerateKey && !editingField ? { key: slugifyForKey(e.target.value) } : {}),
                      }))
                    }
                    placeholder="e.g. Document Type"
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={fieldForm.type}
                    onChange={(e) => setFieldForm((f) => ({ ...f, type: e.target.value as UserRequestCategoryFieldType }))}
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Required</Form.Label>
                  <Form.Select
                    value={fieldForm.required === true ? "true" : "false"}
                    onChange={(e) => setFieldForm((f) => ({ ...f, required: e.target.value === "true" }))}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-3">
                <Form.Group>
                  <Form.Label>Sort</Form.Label>
                  <Form.Control
                    type="number"
                    value={fieldForm.sort_order ?? 0}
                    onChange={(e) =>
                      setFieldForm((f) => ({ ...f, sort_order: Number.parseInt(String(e.target.value), 10) || 0 }))
                    }
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Active</Form.Label>
                  <Form.Select
                    value={fieldForm.is_active !== false ? "true" : "false"}
                    onChange={(e) => setFieldForm((f) => ({ ...f, is_active: e.target.value === "true" }))}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-12">
                <Button
                  type="button"
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setShowAdvanced((a) => !a)}
                >
                  {showAdvanced ? "Hide Advanced" : "Show Advanced"}
                </Button>
              </div>
              {showAdvanced && (
                <div className="col-12">
                  <div className="border rounded p-3 bg-light">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <Form.Group>
                          <Form.Label>Placeholder</Form.Label>
                          <Form.Control
                            placeholder="Shown inside the input (text/textarea/number)"
                            value={fieldForm.config?.placeholder ?? ""}
                            onChange={(e) =>
                              setFieldForm((f) => ({
                                ...f,
                                config: {
                                  ...(f.config ?? {}),
                                  placeholder: e.target.value || null,
                                },
                              }))
                            }
                          />
                        </Form.Group>
                      </div>
                      <div className="col-md-6">
                        <Form.Group>
                          <Form.Label>Help text</Form.Label>
                          <Form.Control
                            placeholder="Small helper under the field"
                            value={fieldForm.config?.help_text ?? ""}
                            onChange={(e) =>
                              setFieldForm((f) => ({
                                ...f,
                                config: { ...(f.config ?? {}), help_text: e.target.value || null },
                              }))
                            }
                          />
                        </Form.Group>
                      </div>
                      <div className="col-md-3">
                        <Form.Group>
                          <Form.Label>Min</Form.Label>
                          <Form.Control
                            placeholder="e.g. 0"
                            value={fieldForm.config?.validation?.min ?? ""}
                            onChange={(e) =>
                              setFieldForm((f) => ({
                                ...f,
                                config: {
                                  ...(f.config ?? {}),
                                  validation: { ...(f.config?.validation ?? {}), min: e.target.value || null },
                                },
                              }))
                            }
                          />
                        </Form.Group>
                      </div>
                      <div className="col-md-3">
                        <Form.Group>
                          <Form.Label>Max</Form.Label>
                          <Form.Control
                            placeholder="e.g. 100"
                            value={fieldForm.config?.validation?.max ?? ""}
                            onChange={(e) =>
                              setFieldForm((f) => ({
                                ...f,
                                config: {
                                  ...(f.config ?? {}),
                                  validation: { ...(f.config?.validation ?? {}), max: e.target.value || null },
                                },
                              }))
                            }
                          />
                        </Form.Group>
                      </div>
                      <div className="col-md-6">
                        <Form.Group>
                          <Form.Label>Regex pattern</Form.Label>
                          <Form.Control
                            placeholder="e.g. ^[0-9]{3}$"
                            value={fieldForm.config?.validation?.pattern ?? ""}
                            onChange={(e) =>
                              setFieldForm((f) => ({
                                ...f,
                                config: {
                                  ...(f.config ?? {}),
                                  validation: {
                                    ...(f.config?.validation ?? {}),
                                    pattern: e.target.value || null,
                                  },
                                },
                              }))
                            }
                          />
                          <Form.Text className="text-muted small">Applied for text/textarea only.</Form.Text>
                        </Form.Group>
                      </div>
                      <div className="col-md-6">
                        <Form.Group>
                          <Form.Label>File accept / mimes</Form.Label>
                          <Form.Control
                            placeholder="e.g. pdf,jpg,jpeg,png"
                            value={fieldForm.config?.validation?.mimes ?? ""}
                            onChange={(e) =>
                              setFieldForm((f) => ({
                                ...f,
                                config: {
                                  ...(f.config ?? {}),
                                  validation: {
                                    ...(f.config?.validation ?? {}),
                                    mimes: e.target.value || null,
                                  },
                                },
                              }))
                            }
                          />
                          <Form.Text className="text-muted small">
                            Applied for file fields (comma-separated extensions).
                          </Form.Text>
                        </Form.Group>
                      </div>
                      <div className="col-12">
                        <div className="fw-semibold mb-2">Conditional required (optional)</div>
                      </div>
                      <div className="col-md-4">
                        <Form.Group>
                          <Form.Label>Required if key</Form.Label>
                          <Form.Select
                            value={fieldForm.config?.required_if?.key ?? ""}
                            onChange={(e) =>
                              setFieldForm((f) => ({
                                ...f,
                                config: {
                                  ...(f.config ?? {}),
                                  required_if:
                                    e.target.value === ""
                                      ? null
                                      : {
                                          key: e.target.value,
                                          op: (f.config?.required_if?.op ?? "eq") as "eq" | "neq" | "in" | "contains",
                                          value: f.config?.required_if?.value ?? "",
                                        },
                                },
                              }))
                            }
                          >
                            <option value="">(none)</option>
                            {fields
                              .filter((ff) => ff.key && ff.key !== fieldForm.key)
                              .map((ff) => (
                                <option key={ff.id} value={ff.key ?? ""}>
                                  {ff.key}
                                </option>
                              ))}
                          </Form.Select>
                        </Form.Group>
                      </div>
                      <div className="col-md-4">
                        <Form.Group>
                          <Form.Label>Operator</Form.Label>
                          <Form.Select
                            value={fieldForm.config?.required_if?.op ?? "eq"}
                            onChange={(e) =>
                              setFieldForm((f) => ({
                                ...f,
                                config: {
                                  ...(f.config ?? {}),
                                  required_if: f.config?.required_if
                                    ? {
                                        ...f.config.required_if,
                                        op: e.target.value as "eq" | "neq" | "in" | "contains",
                                      }
                                    : null,
                                },
                              }))
                            }
                          >
                            {CONDITION_OPS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </div>
                      <div className="col-md-4">
                        <Form.Group>
                          <Form.Label>Value</Form.Label>
                          <Form.Control
                            placeholder="value"
                            value={fieldForm.config?.required_if?.value ?? ""}
                            onChange={(e) =>
                              setFieldForm((f) => ({
                                ...f,
                                config: {
                                  ...(f.config ?? {}),
                                  required_if: f.config?.required_if
                                    ? { ...f.config.required_if, value: e.target.value }
                                    : null,
                                },
                              }))
                            }
                          />
                        </Form.Group>
                      </div>
                      <div className="col-12">
                        <div className="fw-semibold mb-2">Conditional visibility (show/hide)</div>
                        <Form.Text className="text-muted small">
                          If not matched, the field will be hidden in the request form.
                        </Form.Text>
                      </div>
                      <div className="col-md-4">
                        <Form.Group>
                          <Form.Label>Show if key</Form.Label>
                          <Form.Select
                            value={fieldForm.config?.show_if?.key ?? ""}
                            onChange={(e) =>
                              setFieldForm((f) => ({
                                ...f,
                                config: {
                                  ...(f.config ?? {}),
                                  show_if:
                                    e.target.value === ""
                                      ? null
                                      : {
                                          key: e.target.value,
                                          op: (f.config?.show_if?.op ?? "eq") as "eq" | "neq" | "in" | "contains",
                                          value: f.config?.show_if?.value ?? "",
                                        },
                                },
                              }))
                            }
                          >
                            <option value="">(none)</option>
                            {fields
                              .filter((ff) => ff.key && ff.key !== fieldForm.key)
                              .map((ff) => (
                                <option key={ff.id} value={ff.key ?? ""}>
                                  {ff.key}
                                </option>
                              ))}
                          </Form.Select>
                        </Form.Group>
                      </div>
                      <div className="col-md-4">
                        <Form.Group>
                          <Form.Label>Operator</Form.Label>
                          <Form.Select
                            value={fieldForm.config?.show_if?.op ?? "eq"}
                            onChange={(e) =>
                              setFieldForm((f) => ({
                                ...f,
                                config: {
                                  ...(f.config ?? {}),
                                  show_if: f.config?.show_if
                                    ? { ...f.config.show_if, op: e.target.value as "eq" | "neq" | "in" | "contains" }
                                    : null,
                                },
                              }))
                            }
                          >
                            {CONDITION_OPS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </div>
                      <div className="col-md-4">
                        <Form.Group>
                          <Form.Label>Value</Form.Label>
                          <Form.Control
                            placeholder="value"
                            value={fieldForm.config?.show_if?.value ?? ""}
                            onChange={(e) =>
                              setFieldForm((f) => ({
                                ...f,
                                config: {
                                  ...(f.config ?? {}),
                                  show_if: f.config?.show_if
                                    ? { ...f.config.show_if, value: e.target.value }
                                    : null,
                                },
                              }))
                            }
                          />
                        </Form.Group>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="col-12">
                <Form.Text className="text-muted small">
                  Options are used for <strong>Select</strong>, <strong>Multi Select</strong>,{" "}
                  <strong>Radio buttons</strong>, and <strong>Checkbox</strong> (as a checkbox list).
                </Form.Text>
              </div>
              {OPTION_TYPES.includes(fieldForm.type) && (
                <div className="col-12">
                  <div className="fw-semibold mb-2">Options</div>
                  <div className="border rounded p-3 bg-light">
                    {(fieldForm.options ?? []).map((opt, idx) => (
                      <div key={idx} className="row g-2 align-items-center mb-2">
                        <div className="col-md-5">
                          <Form.Control
                            placeholder="Label"
                            value={opt.label}
                            onChange={(e) => {
                              const opts = [...(fieldForm.options ?? [])];
                              opts[idx] = { ...opts[idx], label: e.target.value };
                              setFieldForm((f) => ({ ...f, options: opts }));
                            }}
                          />
                        </div>
                        <div className="col-md-5">
                          <Form.Control
                            placeholder="Value"
                            value={opt.value}
                            onChange={(e) => {
                              const opts = [...(fieldForm.options ?? [])];
                              opts[idx] = { ...opts[idx], value: e.target.value };
                              setFieldForm((f) => ({ ...f, options: opts }));
                            }}
                          />
                        </div>
                        <div className="col-md-2">
                          <Button
                            type="button"
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              const opts = (fieldForm.options ?? []).filter((_, i) => i !== idx);
                              setFieldForm((f) => ({ ...f, options: opts }));
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline-secondary"
                      size="sm"
                      onClick={() =>
                        setFieldForm((f) => ({
                          ...f,
                          options: [...(f.options ?? []), { label: "", value: "" }],
                        }))
                      }
                    >
                      Add option
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowFieldModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={savingField}>
              {savingField ? "Saving…" : editingField ? "Update" : "Add"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </React.Fragment>
  );
};

RequestSubCategories.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default RequestSubCategories;
