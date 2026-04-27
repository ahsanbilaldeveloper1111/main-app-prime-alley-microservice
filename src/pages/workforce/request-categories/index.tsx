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
  type UserRequestCategoryFieldConfig,
  type FieldConfigValidation,
  type FieldsReorderItem,
  type WorkflowLevelPayload,
  type WorkflowLevelAssignee,
} from "@utils/staffManagement";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import { Pencil, Trash2, List, Plus, ChevronUp, ChevronDown, GripVertical, FolderTree } from "lucide-react";
import Select from "@components/AppSelect";
import GenericTable from "@components/GenericTable";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { reportApiErrorFromCatch } from "@utils/sentryLogger";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

/** Permission key duplicated in UI checks — single source avoids typos (Sonar S1192). */
const MANAGE_REQUEST_CATEGORIES_PERMISSION =
  HEADER_CONSTANTS.PERMISSIONS.MANAGE_REQUEST_CATEGORIES_STAFF_MANAGEMENT;

type FieldConditionOp = "eq" | "neq" | "in" | "contains";

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

const CONDITION_OPS: { value: FieldConditionOp; label: string }[] = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
  { value: "in", label: "in (comma list)" },
  { value: "contains", label: "contains" },
];

const OPTION_TYPES = new Set<UserRequestCategoryFieldType>(["select", "multiselect", "radio", "checkbox"]);

function requestCategoryFieldTypeLabel(type: string | null | undefined): string {
  const raw = String(type ?? "").trim();
  if (raw === "") return "—";
  const normalized = raw.toLowerCase();
  const found = FIELD_TYPES.find((t) => t.value === normalized);
  if (found) return found.label;
  return raw
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatTrackingLabel(row: UserRequestCategory): string {
  return row.tracking_enabled === true ? "Enabled" : "Disabled";
}

function formatDescriptionPreview(description: unknown): string {
  if (description == null || description === "") return "—";
  let s = "";
  if (typeof description === "string") {
    s = description;
  } else if (
    typeof description === "number" ||
    typeof description === "boolean" ||
    typeof description === "bigint"
  ) {
    s = String(description);
  } else {
    s = JSON.stringify(description) ?? "";
  }
  return s.length > 50 ? s.slice(0, 50) + "…" : s;
}

function categoryModalTitle(editingCategory: UserRequestCategory | null, parentId: number | null | undefined): string {
  const isSub = parentId != null && parentId !== 0;
  if (isSub) {
    return editingCategory ? "Edit Sub Category" : "Create Sub Category";
  }
  return editingCategory ? "Edit Category" : "Create Category";
}

function categorySaveButtonLabel(savingCategory: boolean, editingCategory: UserRequestCategory | null): string {
  if (savingCategory) return "Saving…";
  return editingCategory ? "Update" : "Create";
}

function fieldModalTitle(editingField: UserRequestCategoryField | null): string {
  return editingField ? "Edit Field" : "Add Field";
}

function fieldModalPrimaryButtonLabel(savingField: boolean, editingField: UserRequestCategoryField | null): string {
  if (savingField) return "Saving…";
  return editingField ? "Update" : "Add";
}

function patchFieldFormConfig(
  f: UserRequestCategoryFieldPayload,
  patch: Partial<UserRequestCategoryFieldConfig>
): UserRequestCategoryFieldPayload {
  const cfg = f.config;
  return {
    ...f,
    config: cfg ? { ...cfg, ...patch } : ({ ...patch } as UserRequestCategoryFieldConfig),
  };
}

function patchFieldFormValidation(
  f: UserRequestCategoryFieldPayload,
  patch: Partial<FieldConfigValidation>
): UserRequestCategoryFieldPayload {
  const cfg = f.config;
  const val = cfg?.validation ?? {};
  const nextValidation = { ...val, ...patch };
  if (cfg) {
    return { ...f, config: { ...cfg, validation: nextValidation } };
  }
  return { ...f, config: { validation: nextValidation } };
}

function normalizeWorkflowLevelsForPayload(
  levels: WorkflowLevelPayload[] | undefined | null
): WorkflowLevelPayload[] | undefined {
  if (!levels?.length) return undefined;
  return levels.map((lvl) => ({
    ...lvl,
    assignees: (lvl.assignees ?? [])
      .filter((a) => (a.user_id ?? "").trim() !== "")
      .map((a, i) => ({ ...a, sort_order: i })),
  }));
}

function isSubCategoryForm(form: CategoryFormState): boolean {
  return form.parent_id != null && form.parent_id !== 0;
}

/** Non-null message blocks submit (name + sub-category workflow rules). */
function getCategoryFormSubmitValidationError(form: CategoryFormState): string | null {
  if ((form.name?.trim() ?? "").length === 0) {
    return "Category name is required.";
  }
  if (!isSubCategoryForm(form)) {
    return null;
  }
  const workflowLevels = form.workflow_levels ?? [];
  if (
    workflowLevels.every(
      (lvl) => !(lvl.assignees ?? []).some((a) => (a.user_id ?? "").trim() !== ""),
    )
  ) {
    return "Sub-categories require at least one approval workflow level with at least one assignee.";
  }
  return null;
}

function isCategoryFormReadyForSubmit(form: CategoryFormState): boolean {
  return getCategoryFormSubmitValidationError(form) == null;
}

/**
 * UI catch blocks reset local state after API helpers toast/rethrow. Report for observability (Sentry dedupes similar events).
 */
function consumeHandledApiError(error: unknown, source: string): void {
  reportApiErrorFromCatch(error, source, { scope: "RequestCategories" });
}

function slugifyForKey(label: string): string {
  const s = String(label ?? "")
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, "_")
    .replaceAll(/[^a-z0-9_]/g, "");
  if (!s) return "";
  return /^[a-z]/.test(s) ? s : `field_${s}`;
}

function getFieldFormSubmitValidationError(f: UserRequestCategoryFieldPayload): string | null {
  const trimmedLabel = f.label?.trim() ?? "";
  if (!trimmedLabel) {
    return "Label is required";
  }
  const effectiveKey = (f.key?.trim() ?? "") || slugifyForKey(trimmedLabel);
  if (!effectiveKey) {
    return "Failed to generate field key from label";
  }
  return null;
}

function isFieldFormReadyForSubmit(f: UserRequestCategoryFieldPayload): boolean {
  return getFieldFormSubmitValidationError(f) == null;
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

type AssigneesListProps = Readonly<{
  assignees: WorkflowLevelAssignee[];
  mainAppUsers: { id: number; name: string; phone: string }[];
  levelIndex: number;
  categoryForm: CategoryFormState;
  setCategoryForm: React.Dispatch<React.SetStateAction<CategoryFormState>>;
}>;

function AssigneesList({ assignees, mainAppUsers, levelIndex, categoryForm, setCategoryForm }: AssigneesListProps) {
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
    const fromIndex = fromStr === "" ? -1 : Number.parseInt(fromStr, 10);
    if (fromIndex < 0 || Number.isNaN(fromIndex) || fromIndex === toIndex || fromIndex >= assignees.length) return;
    const reordered = [...assignees];
    const [removed] = reordered.splice(fromIndex, 1);
    if (removed === undefined) return;
    reordered.splice(toIndex, 0, removed);
    updateAssignees(reordered.map((a, i) => ({ ...a, sort_order: i })));
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const userOptions = mainAppUsers
    .filter((u) => (u.phone ?? "").trim() !== "")
    .map((u) => ({ value: String(u.phone).trim(), label: u.name ? `${u.name} (${u.phone})` : String(u.phone) }));

  return (
    <ul className="list-unstyled d-flex flex-column gap-2 mb-0" aria-label="Workflow assignees">
      {assignees.map((assignee, assigneeIdx) => {
        const uid = (assignee.user_id ?? "").trim();
        const rowKey = uid.length > 0 ? "wl-" + String(levelIndex) + "-u-" + uid : "wl-" + String(levelIndex) + "-slot-" + String(assigneeIdx);
        return (
        <li
          key={rowKey}
          draggable
          aria-label={"Assignee position " + String(assigneeIdx + 1)}
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
                      const u = mainAppUsers.find(
                        (x) => String(x.phone ?? "").trim() === assignee.user_id || String(x.id) === assignee.user_id
                      );
                      if (u && (u.phone ?? "").trim() !== "") {
                        return { value: String(u.phone).trim(), label: u.name ? `${u.name} (${u.phone})` : String(u.phone) };
                      }
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
        </li>
        );
      })}
    </ul>
  );
}

type WorkflowLevelRowProps = Readonly<{
  lvl: WorkflowLevelPayload;
  idx: number;
  categoryForm: CategoryFormState;
  setCategoryForm: React.Dispatch<React.SetStateAction<CategoryFormState>>;
  mainAppUsers: { id: number; name: string; phone: string }[];
}>;

function WorkflowLevelRow({ lvl, idx, categoryForm, setCategoryForm, mainAppUsers }: WorkflowLevelRowProps) {
  const removeLevel = () => {
    const levels = categoryForm.workflow_levels ?? [];
    setCategoryForm((f) => ({
      ...f,
      workflow_levels: levels.filter((_, i) => i !== idx).map((l, i) => ({ ...l, level: i + 1 })),
    }));
  };

  const updateLevelName = (name: string) => {
    const levels = [...(categoryForm.workflow_levels ?? [])];
    levels[idx] = { ...levels[idx], name: name || undefined };
    setCategoryForm((f) => ({ ...f, workflow_levels: levels }));
  };

  const updateApprovalRule = (value: string) => {
    const levels = [...(categoryForm.workflow_levels ?? [])];
    levels[idx] = { ...levels[idx], approval_rule: (value as "any" | "all") || undefined };
    setCategoryForm((f) => ({ ...f, workflow_levels: levels }));
  };

  const updateApproveInOrder = (checked: boolean) => {
    const levels = [...(categoryForm.workflow_levels ?? [])];
    levels[idx] = { ...levels[idx], approve_in_order: checked };
    setCategoryForm((f) => ({ ...f, workflow_levels: levels }));
  };

  const addAssignee = () => {
    const levels = [...(categoryForm.workflow_levels ?? [])];
    const current = levels[idx].assignees ?? [];
    levels[idx] = {
      ...levels[idx],
      assignees: [...current, { user_id: "", sort_order: current.length }],
    };
    setCategoryForm((f) => ({ ...f, workflow_levels: levels }));
  };

  return (
    <div className="mb-3 pb-3 border-bottom border-secondary border-opacity-25">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <strong>Level {lvl.level}</strong>
        <Button type="button" variant="outline-danger" size="sm" onClick={removeLevel}>
          Remove
        </Button>
      </div>
      <Form.Group className="mb-2">
        <Form.Label className="small">Level name (optional)</Form.Label>
        <Form.Control
          size="sm"
          type="text"
          value={lvl.name ?? ""}
          onChange={(e) => updateLevelName(e.target.value)}
          placeholder="e.g. Manager approval"
        />
      </Form.Group>
      <div className="row g-2 mb-2">
        <div className="col-md-6">
          <Form.Select value={lvl.approval_rule ?? "any"} onChange={(e) => updateApprovalRule(e.target.value)}>
            <option value="any">Any one can approve</option>
            <option value="all">All must approve</option>
          </Form.Select>
        </div>
        <div className="col-md-6 d-flex align-items-center">
          <Form.Check
            type="checkbox"
            id={"wl-order-" + String(idx)}
            label="Approve in order"
            disabled={lvl.approval_rule !== "all"}
            checked={lvl.approve_in_order === true}
            onChange={(e) => updateApproveInOrder(e.target.checked)}
            title={lvl.approval_rule === "all" ? undefined : "Only available when 'All must approve' is selected"}
          />
          <span className="ms-1 small text-muted" title="Only when All must approve">
            ⓘ
          </span>
        </div>
      </div>
      <Form.Group>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <Form.Label className="small mb-0">Assignees (who can approve this level)</Form.Label>
          <Button type="button" variant="outline-primary" size="sm" onClick={addAssignee}>
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
  );
}

type SubCategoryWorkflowFormProps = Readonly<{
  categoryForm: CategoryFormState;
  setCategoryForm: React.Dispatch<React.SetStateAction<CategoryFormState>>;
  mainAppUsers: { id: number; name: string; phone: string }[];
}>;

function SubCategoryWorkflowForm({ categoryForm, setCategoryForm, mainAppUsers }: SubCategoryWorkflowFormProps) {
  const workflowLevels = categoryForm.workflow_levels ?? [];

  return (
    <div className="col-12">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <Form.Label className="mb-0">Approval workflow (level & order) <span className="text-danger">*</span></Form.Label>

        {workflowLevels.length > 0 && (
          <Button
            type="button"
            variant="outline-primary"
            size="sm"
            onClick={() => {
              const levels = categoryForm.workflow_levels ?? [];
              const nextLevel = levels.length + 1;
              setCategoryForm((f) => ({
                ...f,
                workflow_levels: [...levels, { level: nextLevel, name: "Level " + String(nextLevel), assignees: [] }],
              }));
            }}
          >
            <Plus size={14} className="me-1" />
            Add level
          </Button>
        )}
      </div>

      {workflowLevels.length === 0 ? (
        <div className="border rounded p-3 bg-light text-center text-muted">
          <p className="mb-2 small">At least one approval level with an assignee is required for sub-categories.</p>
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
            Add level (required)
          </Button>
        </div>
      ) : (
        <div className="border rounded p-3 bg-light">
          {workflowLevels.map((lvl, idx) => (
            <WorkflowLevelRow
              key={"workflow-level-" + String(lvl.level) + "-" + String(idx)}
              lvl={lvl}
              idx={idx}
              categoryForm={categoryForm}
              setCategoryForm={setCategoryForm}
              mainAppUsers={mainAppUsers}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const RequestCategories = () => {
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
  const [showChildrenModal, setShowChildrenModal] = useState(false);
  const [categoryForChildren, setCategoryForChildren] = useState<UserRequestCategory | null>(null);
  const [childrenList, setChildrenList] = useState<UserRequestCategory[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [showDeleteFieldModal, setShowDeleteFieldModal] = useState(false);
  const [fieldPendingDelete, setFieldPendingDelete] = useState<UserRequestCategoryField | null>(null);
  const [deletingField, setDeletingField] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const loadCategories = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const { data, pagination: p } = await getUserRequestCategories({ page, limit, parent_id: null, children: false, search: searchValue });
      setCategories(data);
      if (p) setPagination({ page: p.page, limit: p.limit, total: p.total, last_page: p.last_page });
      else setPagination(null);
    } catch (error: unknown) {
      consumeHandledApiError(error, "RequestCategories.loadCategories");
      setCategories([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [searchValue]);

  useEffect(() => {
    loadCategories(1, pagination?.limit ?? 10);
  }, [loadCategories]);

  const loadChildren = useCallback(async (parentId: number) => {
    setLoadingChildren(true);
    try {
      const { data } = await getUserRequestCategories({ parent_id: parentId, limit: 500 });
      setChildrenList(data ?? []);
    } catch (error: unknown) {
      consumeHandledApiError(error, "RequestCategories.loadChildren");
      setChildrenList([]);
    } finally {
      setLoadingChildren(false);
    }
  }, []);

  const openChildrenModal = (cat: UserRequestCategory) => {
    setCategoryForChildren(cat);
    setShowChildrenModal(true);
    loadChildren(cat.id);
  };

  const openAddChildCategory = (parentCat: UserRequestCategory) => {
    setEditingCategory(null);
    setCategoryForm({ ...defaultCategoryForm, parent_id: parentCat.id });
    setShowCategoryModal(true);
    setShowChildrenModal(false);
  };

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ ...defaultCategoryForm });
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat: UserRequestCategory) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name ?? "",
      code: cat.code ?? "",
      description: cat.description ?? "",
      is_active: cat.is_active !== false,
      parent_id: cat.parent_id ?? undefined,
      sort_order: cat.sort_order ?? 0,
      tracking_enabled: cat.tracking_enabled ?? false,
      tracking_code_prefix: cat.tracking_code_prefix ?? "",
      workflow_levels: Array.isArray(cat.workflow_levels) ? cat.workflow_levels : [],
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = getCategoryFormSubmitValidationError(categoryForm);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const trimmedName = categoryForm.name?.trim() ?? "";
    const payload: UserRequestCategoryPayload = {
      name: trimmedName,
      code: categoryForm.code?.trim() || undefined,
      description: categoryForm.description?.trim() || undefined,
      is_active: categoryForm.is_active,
      parent_id: categoryForm.parent_id ?? null,
      sort_order: categoryForm.sort_order ?? 0,
      tracking_enabled: categoryForm.tracking_enabled ?? false,
      tracking_code_prefix: (categoryForm.tracking_code_prefix ?? "").slice(0, 50) || undefined,
      workflow_levels: normalizeWorkflowLevelsForPayload(categoryForm.workflow_levels),
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
      setShowChildrenModal(false);
      loadCategories(pagination?.page ?? 1, pagination?.limit ?? 10);
      if (categoryForChildren) loadChildren(categoryForChildren.id);
    } catch (error: unknown) {
      consumeHandledApiError(error, "RequestCategories.handleSaveCategory");
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
    const deletedId = categoryToDelete.id;
    const deletedParentId = categoryToDelete.parent_id;
    const openParentId = categoryForChildren?.id;
    const parentMatchesOpenModal =
      openParentId != null &&
      deletedParentId != null &&
      Number(deletedParentId) === Number(openParentId);
    const deletedRowWasInChildrenTable =
      showChildrenModal &&
      openParentId != null &&
      childrenList.some((c) => Number(c.id) === Number(deletedId));
    const shouldRefreshChildrenList =
      showChildrenModal && openParentId != null && (parentMatchesOpenModal || deletedRowWasInChildrenTable);
    setDeleting(true);
    try {
      await deleteUserRequestCategory(categoryToDelete.id);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      await loadCategories(pagination?.page ?? 1, pagination?.limit ?? 10);
      if (shouldRefreshChildrenList) await loadChildren(openParentId);
    } catch (error: unknown) {
      consumeHandledApiError(error, "RequestCategories.handleDeleteCategory");
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
    } catch (error: unknown) {
      consumeHandledApiError(error, "RequestCategories.openFieldsModal");
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
    setShowDeleteFieldModal(false);
    setFieldPendingDelete(null);
  };

  const openAddField = () => {
    setEditingField(null);
    setAutoGenerateKey(true);
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

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldsCategoryId) return;
    const validationError = getFieldFormSubmitValidationError(fieldForm);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const trimmedLabel = fieldForm.label?.trim() ?? "";
    const generatedKey = slugifyForKey(trimmedLabel);
    const payloadForSave: UserRequestCategoryFieldPayload = {
      ...fieldForm,
      label: trimmedLabel,
      key: fieldForm.key?.trim() || generatedKey,
    };
    setSavingField(true);
    try {
      if (editingField) {
        await updateUserRequestCategoryField(fieldsCategoryId, editingField.id, payloadForSave);
        toast.success("Field updated");
      } else {
        await createUserRequestCategoryField(fieldsCategoryId, payloadForSave);
        toast.success("Field added");
      }
      setShowFieldModal(false);
      const list = await getUserRequestCategoryFields(fieldsCategoryId);
      setFields(list ?? []);
    } catch (error: unknown) {
      consumeHandledApiError(error, "RequestCategories.handleSaveField");
    } finally {
      setSavingField(false);
    }
  };

  const openDeleteFieldModal = (f: UserRequestCategoryField) => {
    setFieldPendingDelete(f);
    setShowDeleteFieldModal(true);
  };

  const handleConfirmDeleteField = async () => {
    if (!fieldsCategoryId || !fieldPendingDelete) return;
    setDeletingField(true);
    try {
      await deleteUserRequestCategoryField(fieldsCategoryId, fieldPendingDelete.id);
      toast.success("Field deleted");
      setShowDeleteFieldModal(false);
      setFieldPendingDelete(null);
      const list = await getUserRequestCategoryFields(fieldsCategoryId);
      setFields(list ?? []);
    } catch (error: unknown) {
      consumeHandledApiError(error, "RequestCategories.handleConfirmDeleteField");
    } finally {
      setDeletingField(false);
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
    } catch (error: unknown) {
      consumeHandledApiError(error, "RequestCategories.moveField");
    } finally {
      setReordering(false);
    }
  };

  let childrenModalMain: React.ReactNode;
  if (loadingChildren) {
    childrenModalMain = <p className="text-muted mb-0">Loading sub-categories…</p>;
  } else if (childrenList.length === 0) {
    childrenModalMain = (
      <p className="text-muted mb-0">No sub-categories yet. Click &quot;Add sub-category&quot; to create one.</p>
    );
  } else {
    childrenModalMain = (
      <GenericTable<UserRequestCategory>
        data={childrenList}
        columns={[
          {
            key: "name",
            label: "Name",
            type: "text",
            emptyValue: "—",
          },
          {
            key: "tracking_enabled",
            label: "Tracking",
            render: (row) => <span>{formatTrackingLabel(row)}</span>,
          },
          {
            key: "is_active",
            label: "Active",
            render: (row) => (
              <span className={`gt-badge gt-badge-${row.is_active === false ? "secondary" : "success"}`}>
                {row.is_active === false ? "Inactive" : "Active"}
              </span>
            ),
          },
        ]}
        actions={[
          {
            label: "Edit",
            icon: <Pencil size={14} />,
            onClick: (child) => {
              setShowChildrenModal(false);
              openEditCategory(child);
            },
            variant: "outline-secondary",
          },
          {
            label: "Manage fields",
            icon: <List size={14} />,
            onClick: (child) => {
              setShowChildrenModal(false);
              openFieldsModal(child);
            },
            variant: "outline-secondary",
          },
          {
            label: "Delete",
            icon: <Trash2 size={14} />,
            onClick: openDeleteCategory,
            variant: "outline-danger",
          },
        ]}
        showActions
        uniqueKey="id"
        showToolbarActions={false}
        noBorder
      />
    );
  }

  let fieldsModalMain: React.ReactNode;
  if (loadingFields) {
    fieldsModalMain = <p className="text-muted mb-0">Loading fields…</p>;
  } else if (fields.length === 0) {
    fieldsModalMain = <p className="text-muted mb-0">No fields yet. Add one to define the request form.</p>;
  } else {
    fieldsModalMain = (
      <GenericTable<UserRequestCategoryField>
        data={fields}
        columns={[
          {
            key: "_order",
            label: "",
            sortable: false,
            render: (_row, index) => (
              <div className="d-flex align-items-center gap-1">
                <button
                  type="button"
                  style={{
                    cursor: reordering ? "not-allowed" : "pointer",
                    opacity: reordering ? 0.5 : 1,
                    padding: "4px",
                    border: "none",
                    background: "none",
                  }}
                  onClick={() => moveField(index, "up")}
                  disabled={reordering}
                  aria-label="Move up"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  style={{
                    cursor: reordering ? "not-allowed" : "pointer",
                    opacity: reordering ? 0.5 : 1,
                    padding: "4px",
                    border: "none",
                    background: "none",
                  }}
                  onClick={() => moveField(index, "down")}
                  disabled={reordering}
                  aria-label="Move down"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            ),
          },
          
          { key: "label", label: "Label", type: "text" },
          {
            key: "type",
            label: "Type",
            render: (row) => <span>{requestCategoryFieldTypeLabel(row.type)}</span>,
          },
          {
            key: "required",
            label: "Required",
            render: (row) => <span>{row.required ? "Yes" : "No"}</span>,
          },
          {
            key: "is_active",
            label: "Active",
            render: (row) => <span>{row.is_active === false ? "No" : "Yes"}</span>,
          },
        ]}
        actions={[
          {
            label: "Edit",
            icon: <Pencil size={14} />,
            onClick: openEditField,
            variant: "outline-secondary",
          },
          {
            label: "Delete",
            icon: <Trash2 size={14} />,
            onClick: openDeleteFieldModal,
            variant: "outline-danger",
          },
        ]}
        showActions
        uniqueKey="id"
        showToolbarActions={false}
        noBorder
      />
    );
  }

  return (
    <React.Fragment>
      <style>{`.generic-table-responsive { padding-top: 0 !important; }`}</style>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Request Categories" />
      <PageHeader
        title=""
        showSearch={true}
        searchPlaceholder="Search categories..."
        searchValue={searchValue}
        onSearchChange={(value) => setSearchValue(value)}
        buttons={
          <>
          {session?.user?.permissions?.includes(MANAGE_REQUEST_CATEGORIES_PERMISSION) && (
          <Button variant="primary" onClick={openCreateCategory}>
            <Plus size={18} className="me-1" />
            Add Category
          </Button>
          )}
          </>
        }
      />

      <GenericTable<UserRequestCategory>
        data={categories}
        columns={[
          {
            key: "name",
            label: "Name",
            type: "text",
            emptyValue: "—",
          },
         
          {
            key: "description",
            label: "Description",
            render: (row) => <span>{formatDescriptionPreview(row.description)}</span>,
          },
          {
            key: "tracking_enabled",
            label: "Tracking",
            render: (row) => <span>{formatTrackingLabel(row)}</span>,
          },
          {
            key: "code_prefix",
            label: "Code Prefix",
            render: (row) => <span>{row.tracking_code_prefix ?? "—"}</span>,
          },
          {
            key: "is_active",
            label: "Active",
            render: (row) => (
              <span className={`gt-badge gt-badge-${row.is_active === false ? "secondary" : "success"}`}>
                {row.is_active === false ? "Inactive" : "Active"}
              </span>
            ),
          },
        ]}
        actions={[
          {
            label: "Edit",
            icon: <Pencil size={14} />,
            onClick: openEditCategory,
            variant: "outline-secondary",
            show: () => session?.user?.permissions?.includes(MANAGE_REQUEST_CATEGORIES_PERMISSION) ?? false,
          },
          {
            label: "Sub-categories",
            icon: <FolderTree size={14} />,
            onClick: openChildrenModal,
            variant: "outline-secondary",
            show: () => session?.user?.permissions?.includes(MANAGE_REQUEST_CATEGORIES_PERMISSION) ?? false,
          },
          {
            label: "Delete",
            icon: <Trash2 size={14} />,
            onClick: openDeleteCategory,
            variant: "outline-danger",
            show: () => session?.user?.permissions?.includes(MANAGE_REQUEST_CATEGORIES_PERMISSION) ?? false,
          },
        ]}
        showActions
        loading={loading}
        emptyMessage="No request categories yet. Create one to get started."
        pagination={
          pagination
            ? {
                currentPage: pagination.page,
                rowsPerPage: pagination.limit,
                totalRows: pagination.total,
              }
            : undefined
        }
        onPaginationChange={(page, rowsPerPage) => loadCategories(page, rowsPerPage)}
        uniqueKey="id"
        showToolbarActions={false}
      />


      {/* Create/Edit Category Modal */}
      <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{categoryModalTitle(editingCategory, categoryForm.parent_id)}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveCategory}>
          <Modal.Body>
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={categoryForm.name ?? ""}
                    onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    placeholder="e.g. Leave Request"
                  />
                </Form.Group>
              </div>
              
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Status <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={categoryForm.is_active === false ? "false" : "true"}
                    onChange={(e) => setCategoryForm((f) => ({ ...f, is_active: e.target.value === "true" }))}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </div>
              
              
             
              {categoryForm.parent_id != null && categoryForm.parent_id !== 0 && (
                <SubCategoryWorkflowForm
                  categoryForm={categoryForm}
                  setCategoryForm={setCategoryForm}
                  mainAppUsers={mainAppUsers}
                />
              )}

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
              <Button
                variant="primary"
                type="submit"
                disabled={savingCategory || !isCategoryFormReadyForSubmit(categoryForm)}
              >
                {categorySaveButtonLabel(savingCategory, editingCategory)}
              </Button>
            </div>
          </Modal.Body>
        </Form>
      </Modal>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          if (deleting) return;
          setShowDeleteModal(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleDeleteCategory}
        itemName={categoryToDelete?.name?.trim() || undefined}
        itemType="category"
        loading={deleting}
      />
      <DeleteConfirmationModal
        show={showDeleteFieldModal}
        onHide={() => {
          if (deletingField) return;
          setShowDeleteFieldModal(false);
          setFieldPendingDelete(null);
        }}
        onConfirm={handleConfirmDeleteField}
        itemName={
          fieldPendingDelete
            ? (fieldPendingDelete.label ?? fieldPendingDelete.key ?? "").trim() || undefined
            : undefined
        }
        itemType="field"
        loading={deletingField}
      />

      {/* Children Modal */}
      <Modal show={showChildrenModal} onHide={() => setShowChildrenModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{categoryForChildren?.name ?? "—"} Sub-categories</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-muted">Sub-categories under this category. Add or edit below.</span>
            {categoryForChildren && (
              <Button variant="primary" size="sm" onClick={() => openAddChildCategory(categoryForChildren)}>
                <Plus size={16} className="me-1" />
                Add Sub Category
              </Button>
            )}
          </div>
          {childrenModalMain}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowChildrenModal(false)}>
            Close
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
          {fieldsModalMain}
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
          <Modal.Title>{fieldModalTitle(editingField)}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveField}>
          <Modal.Body>
            <div className="row g-3">
              
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Label <span className="text-danger">*</span></Form.Label>
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
                  <Form.Label>Type <span className="text-danger">*</span></Form.Label>
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
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Is Required <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={fieldForm.required === true ? "true" : "false"}
                    onChange={(e) => setFieldForm((f) => ({ ...f, required: e.target.value === "true" }))}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </Form.Select>
                </Form.Group>
              </div>
              
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Active <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={fieldForm.is_active === false ? "false" : "true"}
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
                            onChange={(e) => setFieldForm((f) => patchFieldFormConfig(f, { placeholder: e.target.value || null }))}
                          />
                        </Form.Group>
                      </div>
                      <div className="col-md-6">
                        <Form.Group>
                          <Form.Label>Help text</Form.Label>
                          <Form.Control
                            placeholder="Small helper under the field"
                            value={fieldForm.config?.help_text ?? ""}
                            onChange={(e) => setFieldForm((f) => patchFieldFormConfig(f, { help_text: e.target.value || null }))}
                          />
                        </Form.Group>
                      </div>
                      <div className="col-md-3">
                        <Form.Group>
                          <Form.Label>Min</Form.Label>
                          <Form.Control
                            placeholder="e.g. 0"
                            value={fieldForm.config?.validation?.min ?? ""}
                            onChange={(e) => setFieldForm((f) => patchFieldFormValidation(f, { min: e.target.value || null }))}
                          />
                        </Form.Group>
                      </div>
                      <div className="col-md-3">
                        <Form.Group>
                          <Form.Label>Max</Form.Label>
                          <Form.Control
                            placeholder="e.g. 100"
                            value={fieldForm.config?.validation?.max ?? ""}
                            onChange={(e) => setFieldForm((f) => patchFieldFormValidation(f, { max: e.target.value || null }))}
                          />
                        </Form.Group>
                      </div>
                      <div className="col-md-6">
                        <Form.Group>
                          <Form.Label>Regex pattern</Form.Label>
                          <Form.Control
                            placeholder="e.g. ^[0-9]{3}$"
                            value={fieldForm.config?.validation?.pattern ?? ""}
                            onChange={(e) => setFieldForm((f) => patchFieldFormValidation(f, { pattern: e.target.value || null }))}
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
                            onChange={(e) => setFieldForm((f) => patchFieldFormValidation(f, { mimes: e.target.value || null }))}
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
                              setFieldForm((f) =>
                                patchFieldFormConfig(f, {
                                  required_if:
                                    e.target.value === ""
                                      ? null
                                      : {
                                          key: e.target.value,
                                          op: (f.config?.required_if?.op ?? "eq") as FieldConditionOp,
                                          value: f.config?.required_if?.value ?? "",
                                        },
                                })
                              )
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
                              setFieldForm((f) =>
                                patchFieldFormConfig(f, {
                                  required_if: f.config?.required_if
                                    ? { ...f.config.required_if, op: e.target.value as FieldConditionOp }
                                    : null,
                                })
                              )
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
                              setFieldForm((f) =>
                                patchFieldFormConfig(f, {
                                  required_if: f.config?.required_if ? { ...f.config.required_if, value: e.target.value } : null,
                                })
                              )
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
                              setFieldForm((f) =>
                                patchFieldFormConfig(f, {
                                  show_if:
                                    e.target.value === ""
                                      ? null
                                      : {
                                          key: e.target.value,
                                          op: (f.config?.show_if?.op ?? "eq") as FieldConditionOp,
                                          value: f.config?.show_if?.value ?? "",
                                        },
                                })
                              )
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
                              setFieldForm((f) =>
                                patchFieldFormConfig(f, {
                                  show_if: f.config?.show_if ? { ...f.config.show_if, op: e.target.value as FieldConditionOp } : null,
                                })
                              )
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
                              setFieldForm((f) =>
                                patchFieldFormConfig(f, {
                                  show_if: f.config?.show_if ? { ...f.config.show_if, value: e.target.value } : null,
                                })
                              )
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
              {OPTION_TYPES.has(fieldForm.type) && (
                <div className="col-12">
                  <div className="fw-semibold mb-2">Options</div>
                  <div className="border rounded p-3 bg-light">
                    {(fieldForm.options ?? []).map((opt, idx) => (
                      <div key={`field-opt-${editingField?.id ?? "new"}-${idx}`} className="row g-2 align-items-center mb-2">
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
            <Button
              variant="primary"
              type="submit"
              disabled={savingField || !isFieldFormReadyForSubmit(fieldForm)}
            >
              {fieldModalPrimaryButtonLabel(savingField, editingField)}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </React.Fragment>
  );
};

RequestCategories.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default RequestCategories;
