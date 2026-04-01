import React, { useCallback, useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import {
  getUserRequestCategories,
  getUserRequestCategoryFields,
  createUserRequest,
  type UserRequestCategory,
  type UserRequestCategoryField,
} from "@utils/staffManagement";

export interface NewRequestModalProps {
  show: boolean;
  onHide: () => void;
  /** Called after a request is created successfully (e.g. to refetch list) */
  onSuccess?: () => void;
  /** Optional modal title */
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

const getFieldKey = (field: UserRequestCategoryField): string | null => {
  const key = field.key?.trim();
  return key ?? null;
};

const getStringValue = (values: Record<string, unknown>, key: string): string => {
  const value = values[key];
  return typeof value === "string" ? value : "";
};

const getStringArrayValue = (values: Record<string, unknown>, key: string): string[] => {
  const value = values[key];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const getBooleanValue = (values: Record<string, unknown>, key: string): boolean => Boolean(values[key]);

const isAttachmentField = (fieldType: string): boolean => fieldType === "file" || fieldType === "attachment";

const getBasicInputType = (fieldType: string): "number" | "date" | "text" => {
  if (fieldType === "number") return "number";
  if (fieldType === "date") return "date";
  return "text";
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

type DynamicFieldInputProps = {
  field: UserRequestCategoryField;
  dynamicFields: Record<string, unknown>;
  onDynamicFieldChange: (key: string, value: unknown) => void;
  onDynamicFileChange: (key: string, file: File | null) => void;
};

const DynamicFieldInput: React.FC<DynamicFieldInputProps> = ({
  field,
  dynamicFields,
  onDynamicFieldChange,
  onDynamicFileChange,
}) => {
  const key = getFieldKey(field);
  if (!key) return null;

  if (field.type === "textarea") {
    return (
      <Form.Control
        as="textarea"
        rows={2}
        value={getStringValue(dynamicFields, key)}
        onChange={(e) => onDynamicFieldChange(key, e.target.value)}
        placeholder={field.config?.placeholder ?? undefined}
      />
    );
  }

  if (isAttachmentField(field.type)) {
    return (
      <Form.Control
        type="file"
        onChange={(e) => {
          const file = (e.target as HTMLInputElement).files?.[0] ?? null;
          onDynamicFileChange(key, file);
        }}
      />
    );
  }

  if (field.type === "select") {
    return (
      <Form.Select value={getStringValue(dynamicFields, key)} onChange={(e) => onDynamicFieldChange(key, e.target.value)}>
        <option value="">Select...</option>
        {(field.options ?? []).map((opt) => (
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
        value={getStringArrayValue(dynamicFields, key)}
        onChange={(e) => {
          const selected = Array.from((e.target as HTMLSelectElement).selectedOptions, (option) => option.value);
          onDynamicFieldChange(key, selected);
        }}
      >
        {(field.options ?? []).map((opt) => (
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
        {(field.options ?? []).map((opt) => (
          <Form.Check
            key={opt.value}
            type="radio"
            id={`${key}-${opt.value}`}
            name={key}
            label={opt.label}
            value={opt.value}
            checked={getStringValue(dynamicFields, key) === opt.value}
            onChange={() => onDynamicFieldChange(key, opt.value)}
          />
        ))}
      </div>
    );
  }

  if (field.type === "checkbox") {
    const selectedValues = getStringArrayValue(dynamicFields, key);
    return (
      <div className="d-flex flex-wrap gap-2">
        {(field.options ?? []).map((opt) => {
          const checked = selectedValues.includes(opt.value);
          return (
            <Form.Check
              key={opt.value}
              type="checkbox"
              id={`${key}-${opt.value}`}
              label={opt.label}
              checked={checked}
              onChange={() => {
                const nextValues = checked
                  ? selectedValues.filter((value) => value !== opt.value)
                  : [...selectedValues, opt.value];
                onDynamicFieldChange(key, nextValues);
              }}
            />
          );
        })}
      </div>
    );
  }

  if (field.type === "boolean") {
    return (
      <Form.Check
        type="checkbox"
        id={`${key}-boolean`}
        label={field.config?.help_text ?? "Yes / No"}
        checked={getBooleanValue(dynamicFields, key)}
        onChange={(e) => onDynamicFieldChange(key, e.target.checked)}
      />
    );
  }

  if (field.type === "toggle") {
    return (
      <Form.Check
        type="switch"
        id={`${key}-toggle`}
        label={field.config?.help_text ?? "Enable"}
        checked={getBooleanValue(dynamicFields, key)}
        onChange={(e) => onDynamicFieldChange(key, e.target.checked)}
      />
    );
  }

  return (
    <Form.Control
      type={getBasicInputType(field.type)}
      value={getStringValue(dynamicFields, key)}
      onChange={(e) => onDynamicFieldChange(key, e.target.value)}
      placeholder={field.config?.placeholder ?? undefined}
    />
  );
};

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
      .then((data) => {
        if (!cancelled) {
          setCategoryFields((prev) => ({ ...prev, [id]: data ?? [] }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategoryFields((prev) => ({ ...prev, [id]: [] }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedParentId, parentHasChildren]);

  const effectiveCategoryId = form.user_request_category_id;
  useEffect(() => {
    if (effectiveCategoryId === "") {
      return;
    }
    const id = Number(effectiveCategoryId);
    let cancelled = false;
    setLoadingFields(true);
    getUserRequestCategoryFields(id)
      .then((data) => {
        if (!cancelled) {
          setCategoryFields((prev) => ({ ...prev, [id]: data ?? [] }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategoryFields((prev) => ({ ...prev, [id]: [] }));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingFields(false);
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveCategoryId]);

  const topLevelCategories = categories.filter((c) => c.parent_id == null);
  const subCategories = (selectedParent?.children ?? []).filter((ch) => ch.is_active === true);
  const hasSubCategories = subCategories.length > 0;
  /** Category id whose fields to show: effective (child/parent) when set, else selected parent when it has children */
  const getDisplayFieldsCategoryId = (): number | null => {
    if (effectiveCategoryId !== "") {
      return Number(effectiveCategoryId);
    }
    if (hasSubCategories && selectedParentId === "") {
      return null;
    }
    if (hasSubCategories) {
      return Number(selectedParentId);
    }
    return null;
  };
  const displayFieldsCategoryId = getDisplayFieldsCategoryId();
  const hasDisplayFieldsCategory = displayFieldsCategoryId !== null;
  const displayFields = hasDisplayFieldsCategory ? (categoryFields[displayFieldsCategoryId] ?? []) : [];
  const getIsLoadingDisplayFields = (): boolean => {
    if (!hasDisplayFieldsCategory) {
      return false;
    }
    if (displayFieldsCategoryId === Number(effectiveCategoryId)) {
      return loadingFields;
    }
    return categoryFields[displayFieldsCategoryId] === undefined;
  };
  const isLoadingDisplayFields = getIsLoadingDisplayFields();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const categoryId = (() => {
      if (form.user_request_category_id !== "") {
        return form.user_request_category_id;
      }
      if (hasSubCategories) {
        return selectedParentId;
      }
      return "";
    })();
    const hasSubject = form.subject.trim().length > 0;
    if (categoryId === "" || hasSubject === false) {
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
      const dynamic_files: Record<string, File> = {};
      Object.entries(form.dynamic_files).forEach(([key, file]) => {
        if (file) dynamic_files[key] = file;
      });
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

  const handleDynamicFieldChange = (key: string, value: unknown) => {
    setForm((currentForm) => ({
      ...currentForm,
      dynamic_fields: { ...currentForm.dynamic_fields, [key]: value },
    }));
  };

  const handleDynamicFileChange = (key: string, file: File | null) => {
    setForm((currentForm) => ({
      ...currentForm,
      dynamic_files: { ...currentForm.dynamic_files, [key]: file },
    }));
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Category <span className="text-danger">*</span></Form.Label>
            <Form.Select
              value={selectedParentId === "" ? "" : String(selectedParentId)}
              onChange={(e) => {
                const val = e.target.value;
                const parentId = val === "" ? "" : Number(val);
                setSelectedParentId(parentId);
                const parent = parentId === "" ? null : categories.find((c) => c.id === parentId);
                const activeChildrenCount =
                  (parent as CategoryWithChildren)?.children?.filter((ch) => ch.is_active === true).length ?? 0;
                const hasChildren = activeChildrenCount > 0;
                setForm((f) => ({
                  ...f,
                  user_request_category_id: hasChildren ? "" : parentId,
                  dynamic_fields: {},
                  dynamic_files: {},
                }));
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
              <Form.Label>Sub-category (Optional)</Form.Label>
              <Form.Select
                value={form.user_request_category_id === "" ? "" : String(form.user_request_category_id)}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((f) => ({
                    ...f,
                    user_request_category_id: val === "" ? "" : Number(val),
                    dynamic_fields: {},
                    dynamic_files: {},
                  }));
                }}
              >
                <option value="">Select sub-category (optional)</option>
                {subCategories.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name ?? ch.code ?? `Sub-category ${ch.id}`}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Subject <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Request subject"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Reason</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="Optional reason or description"
            />
          </Form.Group>
          <div className="d-flex gap-3 flex-wrap">
            <Form.Group className="mb-3 flex-grow-1" style={{ minWidth: 140 }}>
              <Form.Label>Start date</Form.Label>
              <Form.Control
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
              />
              <Form.Text className="text-muted">Optional (YYYY-MM-DD)</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3 flex-grow-1" style={{ minWidth: 140 }}>
              <Form.Label>End date</Form.Label>
              <Form.Control
                type="date"
                value={form.end_date}
                min={form.start_date || undefined}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              />
              <Form.Text className="text-muted">Optional, must be on or after start date</Form.Text>
            </Form.Group>
          </div>
         
          {displayFieldsCategoryId != null &&
            (isLoadingDisplayFields || displayFields.length > 0) && (
            <Form.Group className="mb-3">
              <Form.Label>Additional fields</Form.Label>
              <div className="border rounded p-3 bg-light">
                {isLoadingDisplayFields ? (
                  <p className="text-muted mb-0 small">Loading fields…</p>
                ) : (
                displayFields.map((field) => (
                  <div key={field.id} className="mb-2">
                    <Form.Label className="small mb-1">
                      {field.label ?? field.key}
                      {field.required && " *"}
                    </Form.Label>
                    <DynamicFieldInput
                      field={field}
                      dynamicFields={form.dynamic_fields}
                      onDynamicFieldChange={handleDynamicFieldChange}
                      onDynamicFileChange={handleDynamicFileChange}
                    />
                  </div>
                ))
                )}
              </div>
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? "Creating…" : submitLabel}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default NewRequestModal;
