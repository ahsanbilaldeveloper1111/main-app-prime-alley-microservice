import React from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { Plus } from "lucide-react";
import type { MainAppUserLookup } from "@hooks/useMainAppLookups";
import type {
  UserRequestCategory,
  WorkflowLevelPayload,
} from "@utils/staffManagement";
import {
  categorySaveButtonLabel,
  type CategoryFormState,
} from "../subCategoriesDomain";
import SubCategoriesAssigneesList from "./SubCategoriesAssigneesList";

export type SubCategoriesCategoryModalProps = Readonly<{
  show: boolean;
  onHide: () => void;
  editingCategory: UserRequestCategory | null;
  categoryForm: CategoryFormState;
  setCategoryForm: React.Dispatch<React.SetStateAction<CategoryFormState>>;
  mainAppUsers: MainAppUserLookup[];
  categoryOptions: UserRequestCategory[];
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}>;

export default function SubCategoriesCategoryModal({
  show,
  onHide,
  editingCategory,
  categoryForm,
  setCategoryForm,
  mainAppUsers,
  categoryOptions,
  saving,
  onSubmit,
}: SubCategoriesCategoryModalProps) {
  const workflowLevels = categoryForm.workflow_levels ?? [];

  function removeWorkflowLevelAt(idx: number): void {
    setCategoryForm((f) => {
      const levels = f.workflow_levels ?? [];
      return {
        ...f,
        workflow_levels: levels
          .filter((_, i) => i !== idx)
          .map((l, i) => ({ ...l, level: i + 1 })),
      };
    });
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{editingCategory ? "Edit Category" : "Create Category"}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
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
                  onChange={(e) =>
                    setCategoryForm((f) => ({ ...f, code: e.target.value || undefined }))
                  }
                  placeholder="e.g. LEAVE"
                />
              </Form.Group>
            </div>

            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Parent category</Form.Label>
                <Form.Select
                  value={categoryForm.parent_id ?? ""}
                  onChange={(e) =>
                    setCategoryForm((f) => ({
                      ...f,
                      parent_id: e.target.value === "" ? undefined : Number(e.target.value),
                    }))
                  }
                >
                  <option value="">— Main category (no parent) —</option>
                  {categoryOptions
                    .filter((c) => !editingCategory || c.id !== editingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name ?? `Category ${c.id}`}
                      </option>
                    ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Leave as &quot;Main category&quot; for top-level. Sub-categories get their own fields.
                </Form.Text>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={categoryForm.is_active === false ? "false" : "true"}
                  onChange={(e) =>
                    setCategoryForm((f) => ({ ...f, is_active: e.target.value === "true" }))
                  }
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
                  onChange={(e) =>
                    setCategoryForm((f) => ({
                      ...f,
                      sort_order: Number.parseInt(String(e.target.value), 10) || 0,
                    }))
                  }
                />
              </Form.Group>
            </div>
            <div className="col-12">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <Form.Label className="mb-0 fw-semibold">
                  Approval workflow (level & order) (optional)
                </Form.Label>
                <Button
                  type="button"
                  variant="outline-primary"
                  size="sm"
                  onClick={() => {
                    const levels = categoryForm.workflow_levels ?? [];
                    const nextLevel = levels.length + 1;
                    setCategoryForm((f) => ({
                      ...f,
                      workflow_levels: [
                        ...levels,
                        { level: nextLevel, name: `Level ${nextLevel}`, assignees: [] },
                      ],
                    }));
                  }}
                >
                  <Plus size={14} className="me-1" />
                  Add level
                </Button>
              </div>
              <Form.Text className="text-muted d-block mb-2">
                Optional for main (parent) categories. Add levels if you want approval workflow; child
                categories can define their own.
              </Form.Text>
              {workflowLevels.length === 0 ? (
                <div className="border rounded p-3 bg-light text-center text-muted">
                  <p className="mb-2 small">
                    No workflow levels. You can add levels and assign approvers, or save as-is.
                  </p>
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
                  {workflowLevels.map((lvl: WorkflowLevelPayload, idx: number) => {
                    const approvalRule = lvl.approval_rule ?? "any";
                    const orderCheckboxDisabled = approvalRule === "any";
                    return (
                    <div
                      key={`wf-${String(lvl.level)}-${String(idx)}`}
                      className="mb-3 pb-3 border-bottom border-secondary border-opacity-25"
                    >
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <strong>Level {lvl.level}</strong>
                        <Button
                          type="button"
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeWorkflowLevelAt(idx)}
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
                            const levels = [...(categoryForm.workflow_levels ?? [])];
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
                              const levels = [...(categoryForm.workflow_levels ?? [])];
                              levels[idx] = {
                                ...levels[idx],
                                approval_rule: (e.target.value as "any" | "all") || undefined,
                              };
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
                            id={`wl-order-${String(idx)}`}
                            label="Approve in order"
                            disabled={orderCheckboxDisabled}
                            checked={lvl.approve_in_order === true}
                            onChange={(e) => {
                              const levels = [...(categoryForm.workflow_levels ?? [])];
                              levels[idx] = { ...levels[idx], approve_in_order: e.target.checked };
                              setCategoryForm((f) => ({ ...f, workflow_levels: levels }));
                            }}
                            title={
                              orderCheckboxDisabled
                                ? "Only available when 'All must approve' is selected"
                                : undefined
                            }
                          />
                          <span className="ms-1 small text-muted" title="Only when All must approve">
                            ⓘ
                          </span>
                        </div>
                      </div>
                      <Form.Group>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <Form.Label className="small mb-0">
                            Assignees (who can approve this level)
                          </Form.Label>
                          <Button
                            type="button"
                            variant="outline-primary"
                            size="sm"
                            onClick={() => {
                              const levels = [...(categoryForm.workflow_levels ?? [])];
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
                          <div className="text-muted small py-2">
                            No assignees. Click Add to assign approvers for this level.
                          </div>
                        ) : (
                          <SubCategoriesAssigneesList
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
                  })}
                </div>
              )}
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Tracking</Form.Label>
                <Form.Select
                  value={categoryForm.tracking_enabled ? "true" : "false"}
                  onChange={(e) =>
                    setCategoryForm((f) => ({ ...f, tracking_enabled: e.target.value === "true" }))
                  }
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
                  onChange={(e) =>
                    setCategoryForm((f) => ({
                      ...f,
                      tracking_code_prefix: e.target.value || undefined,
                    }))
                  }
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
                  onChange={(e) =>
                    setCategoryForm((f) => ({ ...f, description: e.target.value || undefined }))
                  }
                  placeholder="Optional description"
                />
              </Form.Group>
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="light" type="button" onClick={onHide}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {categorySaveButtonLabel(saving, editingCategory)}
            </Button>
          </div>
        </Modal.Body>
      </Form>
    </Modal>
  );
}
