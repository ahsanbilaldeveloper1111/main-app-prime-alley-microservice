import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { reportApiErrorFromCatch } from "@utils/sentryLogger";
import type {
  UserRequestCategory,
  UserRequestCategoryField,
  UserRequestCategoryFieldConfig,
  UserRequestCategoryFieldPayload,
  UserRequestCategoryFieldType,
  UserRequestCategoryPayload,
  WorkflowLevelAssignee,
  WorkflowLevelPayload,
  FieldConfigValidation,
} from "@utils/staffManagement";

/** Permission key duplicated in UI checks — single source avoids typos (Sonar S1192). */
export const MANAGE_REQUEST_CATEGORIES_PERMISSION =
  HEADER_CONSTANTS.PERMISSIONS.MANAGE_REQUEST_CATEGORIES_STAFF_MANAGEMENT;

export type FieldConditionOp = "eq" | "neq" | "in" | "contains";

export const FIELD_TYPES: { value: UserRequestCategoryFieldType; label: string }[] = [
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

export const CONDITION_OPS: { value: FieldConditionOp; label: string }[] = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
  { value: "in", label: "in (comma list)" },
  { value: "contains", label: "contains" },
];

export const OPTION_TYPES = new Set<UserRequestCategoryFieldType>([
  "select",
  "multiselect",
  "radio",
  "checkbox",
]);

export function requestCategoryFieldTypeLabel(type: string | null | undefined): string {
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

export function formatTrackingLabel(row: UserRequestCategory): string {
  return row.tracking_enabled === true ? "Enabled" : "Disabled";
}

export function formatDescriptionPreview(description: unknown): string {
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
  return s.length > 50 ? `${s.slice(0, 50)}…` : s;
}

export function categoryModalTitle(
  editingCategory: UserRequestCategory | null,
  parentId: number | null | undefined,
): string {
  const isSub = parentId != null && parentId !== 0;
  if (isSub) {
    return editingCategory ? "Edit Sub Category" : "Create Sub Category";
  }
  return editingCategory ? "Edit Category" : "Create Category";
}

export function categorySaveButtonLabel(
  savingCategory: boolean,
  editingCategory: UserRequestCategory | null,
): string {
  if (savingCategory) return "Saving…";
  return editingCategory ? "Update" : "Create";
}

export function fieldModalTitle(editingField: UserRequestCategoryField | null): string {
  return editingField ? "Edit Field" : "Add Field";
}

export function fieldModalPrimaryButtonLabel(
  savingField: boolean,
  editingField: UserRequestCategoryField | null,
): string {
  if (savingField) return "Saving…";
  return editingField ? "Update" : "Add";
}

export function patchFieldFormConfig(
  f: UserRequestCategoryFieldPayload,
  patch: Partial<UserRequestCategoryFieldConfig>,
): UserRequestCategoryFieldPayload {
  const cfg = f.config;
  return {
    ...f,
    config: cfg ? { ...cfg, ...patch } : ({ ...patch } as UserRequestCategoryFieldConfig),
  };
}

export function patchFieldFormValidation(
  f: UserRequestCategoryFieldPayload,
  patch: Partial<FieldConfigValidation>,
): UserRequestCategoryFieldPayload {
  const cfg = f.config;
  const val = cfg?.validation ?? {};
  const nextValidation = { ...val, ...patch };
  if (cfg) {
    return { ...f, config: { ...cfg, validation: nextValidation } };
  }
  return { ...f, config: { validation: nextValidation } };
}

export function normalizeWorkflowLevelsForPayload(
  levels: WorkflowLevelPayload[] | undefined | null,
): WorkflowLevelPayload[] | undefined {
  if (!levels?.length) return undefined;
  return levels.map((lvl: WorkflowLevelPayload) => ({
    ...lvl,
    assignees: (lvl.assignees ?? [])
      .filter((a: WorkflowLevelAssignee) => (a.user_id ?? "").trim() !== "")
      .map((a: WorkflowLevelAssignee, i: number) => ({ ...a, sort_order: i })),
  }));
}

export type CategoryFormState = UserRequestCategoryPayload & {
  workflow_levels?: WorkflowLevelPayload[];
};

export const defaultCategoryForm: CategoryFormState = {
  name: "",
  code: "",
  description: "",
  is_active: true,
  sort_order: 0,
  tracking_enabled: false,
  tracking_code_prefix: "",
  workflow_levels: [],
};

export function isSubCategoryForm(form: CategoryFormState): boolean {
  return form.parent_id != null && form.parent_id !== 0;
}

/** Non-null message blocks submit (name + sub-category workflow rules). */
export function getCategoryFormSubmitValidationError(form: CategoryFormState): string | null {
  if ((form.name?.trim() ?? "").length === 0) {
    return "Category name is required.";
  }
  if (!isSubCategoryForm(form)) {
    return null;
  }
  const workflowLevels = form.workflow_levels ?? [];
  if (
    workflowLevels.every(
      (lvl: WorkflowLevelPayload) =>
        !(lvl.assignees ?? []).some((a: WorkflowLevelAssignee) => (a.user_id ?? "").trim() !== ""),
    )
  ) {
    return "Sub-categories require at least one approval workflow level with at least one assignee.";
  }
  return null;
}

export function isCategoryFormReadyForSubmit(form: CategoryFormState): boolean {
  return getCategoryFormSubmitValidationError(form) == null;
}

/**
 * UI catch blocks reset local state after API helpers toast/rethrow. Report for observability (Sentry dedupes similar events).
 */
export function consumeHandledApiError(error: unknown, source: string): void {
  reportApiErrorFromCatch(error, source, { scope: "RequestCategories" });
}

export function slugifyForKey(label: string): string {
  const s = String(label ?? "")
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, "_")
    .replaceAll(/[^a-z0-9_]/g, "");
  if (!s) return "";
  return /^[a-z]/.test(s) ? s : `field_${s}`;
}

export function getFieldFormSubmitValidationError(f: UserRequestCategoryFieldPayload): string | null {
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

export function isFieldFormReadyForSubmit(f: UserRequestCategoryFieldPayload): boolean {
  return getFieldFormSubmitValidationError(f) == null;
}

export function emptyFieldForm(sortOrder: number): UserRequestCategoryFieldPayload {
  return {
    key: "",
    label: "",
    type: "text",
    required: false,
    options: null,
    config: null,
    sort_order: sortOrder,
    is_active: true,
  };
}

export function fieldPayloadFromExisting(f: UserRequestCategoryField): UserRequestCategoryFieldPayload {
  const c = f.config ?? {};
  return {
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
  };
}
