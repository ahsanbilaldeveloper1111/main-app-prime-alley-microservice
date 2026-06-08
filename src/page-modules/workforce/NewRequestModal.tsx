import React, { useCallback, useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { toast } from "react-toastify";
import WorkforceSidebarShell from "@components/workforce/WorkforceSidebarShell";
import UserRequestDynamicFieldInput from "@components/workforce/UserRequestDynamicFieldInput";
import {
  getUserRequestCategories,
  getUserRequestCategoryFields,
  createUserRequest,
  type UserRequestCategory,
  type UserRequestCategoryField,
} from "@utils/staffManagement";
import "@assets/scss/workforce-user-request.scss";

export interface NewRequestModalProps {
  show: boolean;
  onHide: () => void;
  /** Called after a request is created successfully (e.g. to refetch list) */
  onSuccess?: () => void;
  /** Optional sidebar title */
  title?: string;
  /** Optional submit button label */
  submitLabel?: string;
}

/** Category with optional children (sub-categories) from API */
type CategoryWithChildren = UserRequestCategory & {
  children?: Array<{ id: number; name?: string | null; code?: string | null; is_active?: boolean }>;
};

type CreateFormState = {
  user_request_category_id: number | "";
  subject: string;
  reason: string;
  start_date: string;
  end_date: string;
  dynamic_fields: Record<string, unknown>;
  dynamic_files: Record<string, File | null>;
  attachments: File[];
};

type ActiveChildCategory = {
  id: number;
  name?: string | null;
  code?: string | null;
  is_active?: boolean;
};

const defaultForm: CreateFormState = {
  user_request_category_id: "",
  subject: "",
  reason: "",
  start_date: "",
  end_date: "",
  dynamic_fields: {},
  dynamic_files: {},
  attachments: [],
};

type SidebarDateInputFieldProps = {
  label: string;
  value: string;
  min?: string;
  helpText: string;
  onChange: (next: string) => void;
};

const SidebarDateInputField: React.FC<SidebarDateInputFieldProps> = ({
  label,
  value,
  min,
  helpText,
  onChange,
}) => (
  <Form.Group className="mb-3 flex-grow-1 new-request-dateFieldGroup">
    <Form.Label className="new-request-label">{label}</Form.Label>
    <Form.Control
      type="date"
      className="new-request-fieldControl"
      value={value}
      min={min}
      onChange={(e) => onChange(e.target.value)}
    />
    <Form.Text className="text-muted">{helpText}</Form.Text>
  </Form.Group>
);

/** Resolves the effective category id for form submission */
function resolveSubmitCategoryId(
  formCategoryId: number | "",
  hasSubCategories: boolean,
  selectedParentId: number | "",
): number | "" {
  if (hasSubCategories) {
    return formCategoryId;
  }
  if (formCategoryId !== "") return formCategoryId;
  return selectedParentId;
}

/** Collects non-null dynamic files from the form state */
function collectDynamicFiles(dynamicFiles: Record<string, File | null>): Record<string, File> {
  const result: Record<string, File> = {};
  Object.entries(dynamicFiles).forEach(([key, file]) => {
    if (file) result[key] = file;
  });
  return result;
}

/** Determines the category id whose fields should be displayed */
function resolveDisplayFieldsCategoryId(
  effectiveCategoryId: number | "",
  hasSubCategories: boolean,
  selectedParentId: number | "",
): number | null {
  if (effectiveCategoryId !== "") return Number(effectiveCategoryId);
  if (hasSubCategories && selectedParentId !== "") return Number(selectedParentId);
  return null;
}

/** Determines whether display fields are currently loading */
function resolveIsLoadingDisplayFields(
  hasDisplayFieldsCategory: boolean,
  displayFieldsCategoryId: number | null,
  effectiveCategoryId: number | "",
  loadingFields: boolean,
  categoryFields: Record<number, UserRequestCategoryField[]>,
): boolean {
  if (!hasDisplayFieldsCategory || displayFieldsCategoryId === null) return false;
  if (displayFieldsCategoryId === Number(effectiveCategoryId)) return loadingFields;
  return categoryFields[displayFieldsCategoryId] === undefined;
}

function getActiveChildCategories(children?: ActiveChildCategory[]): ActiveChildCategory[] {
  return (children ?? []).filter((child: ActiveChildCategory) => child.is_active === true);
}

function resetCategoryDependentFields(
  previousForm: CreateFormState,
  userRequestCategoryId: number | "",
): CreateFormState {
  return {
    ...previousForm,
    user_request_category_id: userRequestCategoryId,
    dynamic_fields: {},
    dynamic_files: {},
  };
}

function mapCategoryFieldsById(
  previous: Record<number, UserRequestCategoryField[]>,
  categoryId: number,
  fields: UserRequestCategoryField[],
): Record<number, UserRequestCategoryField[]> {
  return { ...previous, [categoryId]: fields };
}

const NewRequestModal: React.FC<NewRequestModalProps> = ({
  show,
  onHide,
  onSuccess,
  title = "New Request",
  submitLabel = "Create Request",
}) => {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [categoryFields, setCategoryFields] = useState<Record<number, UserRequestCategoryField[]>>({});
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  const [form, setForm] = useState<CreateFormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  /** Selected parent category id (for showing sub-category dropdown) */
  const [selectedParentId, setSelectedParentId] = useState<number | "">("");

  const applyLoadedCategoryFields = useCallback((categoryId: number, fields: UserRequestCategoryField[]) => {
    setCategoryFields((previous) => mapCategoryFieldsById(previous, categoryId, fields));
  }, []);

  const applyFailedCategoryFields = useCallback((categoryId: number) => {
    setCategoryFields((previous) => mapCategoryFieldsById(previous, categoryId, []));
  }, []);

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const { data } = await getUserRequestCategories({ limit: 100,is_active:true });
      const list = (data ?? []) as CategoryWithChildren[];
      setCategories(list);
      setCategoryFields({});
    } catch {
      setCategories([]);
      setCategoryFields({});
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    if (show) {
      loadCategories();
      setForm(defaultForm);
      setSelectedParentId("");
    }
  }, [show, loadCategories]);

  // When parent category is selected and has children, also fetch parent's fields (effective category will fetch child's when selected)
  const selectedParent = selectedParentId === "" ? null : categories.find((c) => c.id === selectedParentId) ?? null;
  const parentHasChildren = (selectedParent as CategoryWithChildren)?.children?.length;
  useEffect(() => {
    if (selectedParentId === "" || !parentHasChildren) return;
    const id = Number(selectedParentId);
    let cancelled = false;
    getUserRequestCategoryFields(id)
      .then((data: UserRequestCategoryField[]) => {
        if (!cancelled) {
          applyLoadedCategoryFields(id, data ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          applyFailedCategoryFields(id);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [applyFailedCategoryFields, applyLoadedCategoryFields, selectedParentId, parentHasChildren]);

  const effectiveCategoryId = form.user_request_category_id;
  useEffect(() => {
    if (effectiveCategoryId === "") {
      return;
    }
    const id = Number(effectiveCategoryId);
    let cancelled = false;
    setLoadingFields(true);
    getUserRequestCategoryFields(id)
      .then((data: UserRequestCategoryField[]) => {
        if (!cancelled) {
          applyLoadedCategoryFields(id, data ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          applyFailedCategoryFields(id);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingFields(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applyFailedCategoryFields, applyLoadedCategoryFields, effectiveCategoryId]);

  const topLevelCategories = categories.filter((c) => c.parent_id == null);
  const subCategories = getActiveChildCategories(selectedParent?.children);
  const hasSubCategories = subCategories.length > 0;

  const displayFieldsCategoryId = resolveDisplayFieldsCategoryId(
    effectiveCategoryId,
    hasSubCategories,
    selectedParentId,
  );
  const hasDisplayFieldsCategory = displayFieldsCategoryId !== null;
  const displayFields = hasDisplayFieldsCategory ? (categoryFields[displayFieldsCategoryId] ?? []) : [];
  const isLoadingDisplayFields = resolveIsLoadingDisplayFields(
    hasDisplayFieldsCategory,
    displayFieldsCategoryId,
    effectiveCategoryId,
    loadingFields,
    categoryFields,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const categoryId = resolveSubmitCategoryId(
      form.user_request_category_id,
      hasSubCategories,
      selectedParentId,
    );
    const hasSubject = form.subject.trim().length > 0;
    if (hasSubCategories && form.user_request_category_id === "") {
      toast.error("Sub-category is required");
      return;
    }
    if (categoryId === "" || !hasSubject) {
      toast.error("Category and subject are required");
      return;
    }
    const start = form.start_date.trim() || null;
    const end = form.end_date.trim() || null;
    if (start && end && end < start) {
      toast.error("End date must be on or after start date");
      return;
    }
    setSubmitting(true);
    try {
      const dynamic_files = collectDynamicFiles(form.dynamic_files);
      await createUserRequest({
        user_request_category_id: Number(categoryId),
        subject: form.subject.trim(),
        reason: form.reason.trim() || null,
        ...(start ? { start_date: start } : {}),
        ...(end ? { end_date: end } : {}),
        dynamic_fields: Object.keys(form.dynamic_fields).length > 0 ? form.dynamic_fields : undefined,
        ...(Object.keys(dynamic_files).length > 0 ? { dynamic_files } : {}),
        ...(form.attachments.length > 0 ? { files: form.attachments } : {}),
      });
      toast.success("Request created");
      onHide();
      onSuccess?.();
    } catch {
      // toast handled in API
    } finally {
      setSubmitting(false);
    }
  };

  const handleDynamicFieldChange = useCallback((key: string, value: unknown) => {
    setForm((currentForm) => ({
      ...currentForm,
      dynamic_fields: { ...currentForm.dynamic_fields, [key]: value },
    }));
  }, []);

  const handleDynamicFileChange = useCallback((key: string, file: File | null) => {
    setForm((currentForm) => ({
      ...currentForm,
      dynamic_files: { ...currentForm.dynamic_files, [key]: file },
    }));
  }, []);

  const handleCancelClick = useCallback(() => {
    onHide();
  }, [onHide]);

  return (
      <WorkforceSidebarShell
        isOpen={show}
        className="new-request-sidebar"
        title={title}
        onClose={handleCancelClick}
        onSubmit={handleSubmit}
        submitLabel={submitLabel}
        submitting={submitting}
        primaryDisabled={submitting}
      >
            <Form.Group className="mb-3">
              <Form.Label className="new-request-label">
                Category <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                className="new-request-fieldControl"
                value={selectedParentId === "" ? "" : String(selectedParentId)}
                onChange={(e) => {
                  const val = e.target.value;
                  const parentId = val === "" ? "" : Number(val);
                  setSelectedParentId(parentId);
                  const parent = parentId === "" ? null : categories.find((c) => c.id === parentId);
                  const activeChildren = getActiveChildCategories((parent as CategoryWithChildren)?.children);
                  const hasChildren = activeChildren.length > 0;
                  setForm((f) => resetCategoryDependentFields(f, hasChildren ? "" : parentId));
                }}
                required
                disabled={loadingCategories}
              >
                <option value="">{loadingCategories ? "Loading…" : "Select category"}</option>
                {topLevelCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name ?? c.code ?? `Category ${c.id}`}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {hasSubCategories && (
              <Form.Group className="mb-3">
                <Form.Label className="new-request-label">
                  Sub-category <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  className="new-request-fieldControl"
                  value={form.user_request_category_id === "" ? "" : String(form.user_request_category_id)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((f) => resetCategoryDependentFields(f, val === "" ? "" : Number(val)));
                  }}
                  required
                >
                  <option value="">Select sub-category</option>
                  {subCategories.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name ?? ch.code ?? `Sub-category ${ch.id}`}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="new-request-label">
                Subject <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                className="new-request-fieldControl"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Request subject"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="new-request-label">
                Reason
              </Form.Label>
              <Form.Control
                as="textarea"
                className="new-request-fieldControl"
                rows={3}
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Optional reason or description"
              />
            </Form.Group>

            <div className="d-flex gap-3 flex-wrap">
              <SidebarDateInputField
                label="Start date"
                value={form.start_date}
                onChange={(next: string) => setForm((f) => ({ ...f, start_date: next }))}
                helpText="Optional (YYYY-MM-DD)"
              />
              <SidebarDateInputField
                label="End date"
                value={form.end_date}
                min={form.start_date || undefined}
                onChange={(next: string) => setForm((f) => ({ ...f, end_date: next }))}
                helpText="Optional, must be on or after start date"
              />
            </div>

            {displayFieldsCategoryId != null && (isLoadingDisplayFields || displayFields.length > 0) && (
              <Form.Group className="mb-3">
                <Form.Label className="new-request-label">
                  Additional fields
                </Form.Label>
                <div className="new-request-additionalFieldsPanel">
                  <div className="new-request-additionalFieldsHint">
                    Fill out the category-specific details below.
                  </div>
                  {isLoadingDisplayFields ? (
                    <p className="text-muted mb-0 small">Loading fields…</p>
                  ) : (
                    displayFields.map((field) => (
                      <div key={field.id} className="new-request-additionalFieldCard">
                        <Form.Label className="mb-2 new-request-additionalFieldLabel">
                          {field.label ?? field.key}
                          {field.required && <span className="text-danger"> *</span>}
                        </Form.Label>
                        <div className="new-request-additionalFieldInput">
                          <UserRequestDynamicFieldInput
                            field={field}
                            values={form.dynamic_fields}
                            onValueChange={handleDynamicFieldChange}
                            onFileChange={handleDynamicFileChange}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Form.Group>
            )}
      </WorkforceSidebarShell>
  );
};

export default NewRequestModal;
