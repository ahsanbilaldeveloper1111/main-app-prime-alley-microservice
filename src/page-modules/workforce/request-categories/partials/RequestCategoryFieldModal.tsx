import React from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { MainSettingsFormSidebar } from "@components/main-settings/MainSettingsFormSidebar";
import { useMainSettingsFormSidebar } from "@components/main-settings/mainSettingsFormContext";
import type {
  UserRequestCategoryField,
  UserRequestCategoryFieldPayload,
  UserRequestCategoryFieldType,
} from "@utils/staffManagement";
import {
  CONDITION_OPS,
  FIELD_TYPES,
  OPTION_TYPES,
  type FieldConditionOp,
  fieldModalPrimaryButtonLabel,
  fieldModalTitle,
  isFieldFormReadyForSubmit,
  patchFieldFormConfig,
  patchFieldFormValidation,
  slugifyForKey,
} from "../requestCategoriesDomain";

export type RequestCategoryFieldModalProps = Readonly<{
  show: boolean;
  onHide: () => void;
  editingField: UserRequestCategoryField | null;
  /** Existing fields on this category (for conditional key pickers). */
  siblingFields: UserRequestCategoryField[];
  fieldForm: UserRequestCategoryFieldPayload;
  setFieldForm: React.Dispatch<React.SetStateAction<UserRequestCategoryFieldPayload>>;
  savingField: boolean;
  showAdvanced: boolean;
  setShowAdvanced: React.Dispatch<React.SetStateAction<boolean>>;
  autoGenerateKey: boolean;
  onSubmit: (e: React.FormEvent) => void;
  /** Use centered modal when opened over another modal (default follows Main Settings sidebar). */
  presentation?: "modal" | "sidebar";
}>;

export default function RequestCategoryFieldModal(props: RequestCategoryFieldModalProps) {
  const {
    show,
    onHide,
    editingField,
    siblingFields,
    fieldForm,
    setFieldForm,
    savingField,
    showAdvanced,
    setShowAdvanced,
    autoGenerateKey,
    onSubmit,
    presentation,
  } = props;

  const preferSidebar = useMainSettingsFormSidebar();
  const useSidebar = (presentation ?? (preferSidebar ? "sidebar" : "modal")) === "sidebar";
  const panelTitle = fieldModalTitle(editingField);
  const formId = "request-category-field-form";
  const submitDisabled = savingField || !isFieldFormReadyForSubmit(fieldForm);

  const fieldFormBody = (
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>
                  Label <span className="text-danger">*</span>
                </Form.Label>
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
                <Form.Label>
                  Type <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  value={fieldForm.type}
                  onChange={(e) =>
                    setFieldForm((f) => ({ ...f, type: e.target.value as UserRequestCategoryFieldType }))
                  }
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
                <Form.Label>
                  Is Required <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  value={fieldForm.required === true ? "true" : "false"}
                  onChange={(e) =>
                    setFieldForm((f) => ({ ...f, required: e.target.value === "true" }))
                  }
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-md-6">
              <Form.Group>
                <Form.Label>
                  Active <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  value={fieldForm.is_active === false ? "false" : "true"}
                  onChange={(e) =>
                    setFieldForm((f) => ({ ...f, is_active: e.target.value === "true" }))
                  }
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
                            setFieldForm((f) =>
                              patchFieldFormConfig(f, { placeholder: e.target.value || null }),
                            )
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
                            setFieldForm((f) =>
                              patchFieldFormConfig(f, { help_text: e.target.value || null }),
                            )
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
                            setFieldForm((f) =>
                              patchFieldFormValidation(f, { min: e.target.value || null }),
                            )
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
                            setFieldForm((f) =>
                              patchFieldFormValidation(f, { max: e.target.value || null }),
                            )
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
                            setFieldForm((f) =>
                              patchFieldFormValidation(f, { pattern: e.target.value || null }),
                            )
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
                            setFieldForm((f) =>
                              patchFieldFormValidation(f, { mimes: e.target.value || null }),
                            )
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
                              }),
                            )
                          }
                        >
                          <option value="">(none)</option>
                          {siblingFields
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
                              }),
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
                                required_if: f.config?.required_if
                                  ? { ...f.config.required_if, value: e.target.value }
                                  : null,
                              }),
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
                              }),
                            )
                          }
                        >
                          <option value="">(none)</option>
                          {siblingFields
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
                                show_if: f.config?.show_if
                                  ? { ...f.config.show_if, op: e.target.value as FieldConditionOp }
                                  : null,
                              }),
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
                                show_if: f.config?.show_if
                                  ? { ...f.config.show_if, value: e.target.value }
                                  : null,
                              }),
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
                    <div
                      key={`field-opt-${editingField?.id ?? "new"}-${idx}`}
                      className="row g-2 align-items-center mb-2"
                    >
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
  );

  const fieldFormFooter = (
    <>
      <Button variant="secondary" type="button" onClick={onHide} disabled={savingField}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" form={useSidebar ? formId : undefined} disabled={submitDisabled}>
        {fieldModalPrimaryButtonLabel(savingField, editingField)}
      </Button>
    </>
  );

  if (useSidebar) {
    return (
      <MainSettingsFormSidebar
        show={show}
        onHide={onHide}
        title={panelTitle}
        disableClose={savingField}
        footer={
          <div className="main-settings-form-sidebar-footer">
            <div className="main-settings-form-sidebar-footer__actions">{fieldFormFooter}</div>
          </div>
        }
      >
        <Form id={formId} onSubmit={onSubmit}>
          {fieldFormBody}
        </Form>
      </MainSettingsFormSidebar>
    );
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{panelTitle}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body>{fieldFormBody}</Modal.Body>
        <Modal.Footer>{fieldFormFooter}</Modal.Footer>
      </Form>
    </Modal>
  );
}
