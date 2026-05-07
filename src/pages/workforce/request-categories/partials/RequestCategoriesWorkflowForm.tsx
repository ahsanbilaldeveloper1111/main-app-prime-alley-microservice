import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import Select from "@components/AppSelect";
import {
  CategorySidebarField,
  CategorySidebarLabel,
  CategorySidebarSelect,
  CategorySidebarTextInput,
  categorySidebarLabelStyle,
} from "@components/CategoryEditSidebar";
import type {
  WorkflowLevelAssignee,
  WorkflowLevelPayload,
} from "@utils/staffManagement";
import type { MainAppUserLookup } from "@hooks/useMainAppLookups";
import type { CategoryFormState } from "../requestCategoriesDomain";

type AssigneesListProps = Readonly<{
  assignees: WorkflowLevelAssignee[];
  mainAppUsers: MainAppUserLookup[];
  levelIndex: number;
  categoryForm: CategoryFormState;
  setCategoryForm: React.Dispatch<React.SetStateAction<CategoryFormState>>;
}>;

function AssigneesList({
  assignees,
  mainAppUsers,
  levelIndex,
  categoryForm,
  setCategoryForm,
}: AssigneesListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const updateAssignees = (newAssignees: WorkflowLevelAssignee[]) => {
    const levels = [...(categoryForm.workflow_levels ?? [])];
    levels[levelIndex] = { ...levels[levelIndex], assignees: newAssignees };
    setCategoryForm((f: CategoryFormState) => ({ ...f, workflow_levels: levels }));
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
    if (fromIndex < 0 || Number.isNaN(fromIndex) || fromIndex === toIndex || fromIndex >= assignees.length)
      return;
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
    .map((u) => ({
      value: String(u.phone).trim(),
      label: u.name ? `${u.name} (${u.phone})` : String(u.phone),
    }));

  return (
    <ul className="list-unstyled d-flex flex-column gap-2 mb-0" aria-label="Workflow assignees">
      {assignees.map((assignee, assigneeIdx) => {
        const uid = (assignee.user_id ?? "").trim();
        const rowKey =
          `wl-${String(levelIndex)}-assignee-${String(assignee.sort_order)}-${uid.length > 0 ? uid : "empty"}`;
        return (
          <li
            key={rowKey}
            draggable
            aria-label={`Assignee position ${String(assigneeIdx + 1)}`}
            onDragStart={(e) => handleDragStart(e, assigneeIdx)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, assigneeIdx)}
            onDragEnd={handleDragEnd}
            className="request-categories-page__assignee-row d-flex align-items-center gap-2 p-2 border rounded bg-white"
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
                          (x) =>
                            String(x.phone ?? "").trim() === assignee.user_id ||
                            String(x.id) === assignee.user_id,
                        );
                        if (u && (u.phone ?? "").trim() !== "") {
                          return {
                            value: String(u.phone).trim(),
                            label: u.name ? `${u.name} (${u.phone})` : String(u.phone),
                          };
                        }
                        return { value: assignee.user_id, label: u?.name ?? assignee.user_id };
                      })()
                    : null
                }
                onChange={(opt: { value: string; label: string } | null) => {
                  const next = [...assignees];
                  next[assigneeIdx] = {
                    ...next[assigneeIdx],
                    user_id: opt?.value ?? "",
                    sort_order: assigneeIdx,
                  };
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
                const next = assignees
                  .filter((_, i) => i !== assigneeIdx)
                  .map((a, i) => ({ ...a, sort_order: i }));
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
  mainAppUsers: MainAppUserLookup[];
}>;

function WorkflowLevelRow({
  lvl,
  idx,
  categoryForm,
  setCategoryForm,
  mainAppUsers,
}: WorkflowLevelRowProps) {
  const removeLevel = () => {
    const levels = categoryForm.workflow_levels ?? [];
    setCategoryForm((f: CategoryFormState) => ({
      ...f,
      workflow_levels: levels
        .filter((_: WorkflowLevelPayload, i: number) => i !== idx)
        .map((l: WorkflowLevelPayload, i: number) => ({ ...l, level: i + 1 })),
    }));
  };

  const updateLevelName = (name: string) => {
    const levels = [...(categoryForm.workflow_levels ?? [])];
    levels[idx] = { ...levels[idx], name: name || undefined };
    setCategoryForm((f: CategoryFormState) => ({ ...f, workflow_levels: levels }));
  };

  const updateApprovalRule = (value: string) => {
    const levels = [...(categoryForm.workflow_levels ?? [])];
    levels[idx] = { ...levels[idx], approval_rule: (value as "any" | "all") || undefined };
    setCategoryForm((f: CategoryFormState) => ({ ...f, workflow_levels: levels }));
  };

  const updateApproveInOrder = (checked: boolean) => {
    const levels = [...(categoryForm.workflow_levels ?? [])];
    levels[idx] = { ...levels[idx], approve_in_order: checked };
    setCategoryForm((f: CategoryFormState) => ({ ...f, workflow_levels: levels }));
  };

  const addAssignee = () => {
    const levels = [...(categoryForm.workflow_levels ?? [])];
    const current = levels[idx].assignees ?? [];
    levels[idx] = {
      ...levels[idx],
      assignees: [...current, { user_id: "", sort_order: current.length }],
    };
    setCategoryForm((f: CategoryFormState) => ({ ...f, workflow_levels: levels }));
  };

  const approvalRuleAll = lvl.approval_rule === "all";

  return (
    <div className="mb-3 pb-3 border-bottom border-secondary border-opacity-25">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <strong className="request-categories-page__workflow-level-title">
          Level {lvl.level}
        </strong>
        <Button type="button" variant="outline-danger" size="sm" onClick={removeLevel}>
          Remove
        </Button>
      </div>
      <CategorySidebarField>
        <CategorySidebarLabel htmlFor={`wl-name-${String(idx)}`}>Level name (optional)</CategorySidebarLabel>
        <CategorySidebarTextInput
          id={`wl-name-${String(idx)}`}
          type="text"
          value={lvl.name ?? ""}
          onChange={(e) => updateLevelName(e.target.value)}
          placeholder="e.g. Manager approval"
        />
      </CategorySidebarField>
      <CategorySidebarField>
        <CategorySidebarLabel htmlFor={`wl-rule-${String(idx)}`}>Approval rule</CategorySidebarLabel>
        <CategorySidebarSelect
          id={`wl-rule-${String(idx)}`}
          value={lvl.approval_rule ?? "any"}
          onChange={(e) => updateApprovalRule(e.target.value)}
        >
          <option value="any">Any one can approve</option>
          <option value="all">All must approve</option>
        </CategorySidebarSelect>
      </CategorySidebarField>
      <CategorySidebarField>
        <Form.Check
          type="checkbox"
          id={`wl-order-${String(idx)}`}
          label="Approve in order"
          disabled={!approvalRuleAll}
          checked={lvl.approve_in_order === true}
          onChange={(e) => updateApproveInOrder(e.target.checked)}
          title={approvalRuleAll ? undefined : "Only available when 'All must approve' is selected"}
          className="request-categories-page__workflow-checkbox"
        />
        <span className="ms-1 small text-muted" title="Only when All must approve">
          ⓘ
        </span>
      </CategorySidebarField>
      <CategorySidebarField>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span style={{ ...categorySidebarLabelStyle, marginBottom: 0 }}>
            Assignees (who can approve this level)
          </span>
          <Button type="button" variant="outline-primary" size="sm" onClick={addAssignee}>
            <Plus size={14} className="me-1" />
            Add
          </Button>
        </div>
        {(lvl.assignees ?? []).length === 0 ? (
          <div className="text-muted small py-2">
            No assignees. Click Add to assign approvers for this level.
          </div>
        ) : (
          <AssigneesList
            assignees={lvl.assignees ?? []}
            mainAppUsers={mainAppUsers}
            levelIndex={idx}
            categoryForm={categoryForm}
            setCategoryForm={setCategoryForm}
          />
        )}
      </CategorySidebarField>
    </div>
  );
}

export type SubCategoryWorkflowFormProps = Readonly<{
  categoryForm: CategoryFormState;
  setCategoryForm: React.Dispatch<React.SetStateAction<CategoryFormState>>;
  mainAppUsers: MainAppUserLookup[];
}>;

export function SubCategoryWorkflowForm({
  categoryForm,
  setCategoryForm,
  mainAppUsers,
}: SubCategoryWorkflowFormProps) {
  const workflowLevels = categoryForm.workflow_levels ?? [];

  return (
    <div className="request-categories-page__workflow-root">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <CategorySidebarLabel required>Approval workflow (level & order)</CategorySidebarLabel>

        {workflowLevels.length > 0 && (
          <Button
            type="button"
            variant="outline-primary"
            size="sm"
            onClick={() => {
              const levels = categoryForm.workflow_levels ?? [];
              const nextLevel = levels.length + 1;
              setCategoryForm((f: CategoryFormState) => ({
                ...f,
                workflow_levels: [
                  ...levels,
                  { level: nextLevel, name: `Level ${String(nextLevel)}`, assignees: [] },
                ],
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
          <p className="mb-2 small">
            At least one approval level with an assignee is required for sub-categories.
          </p>
          <Button
            type="button"
            variant="outline-primary"
            size="sm"
            onClick={() => {
              setCategoryForm((f: CategoryFormState) => ({
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
          {workflowLevels.map((lvl: WorkflowLevelPayload, idx: number) => (
            <WorkflowLevelRow
              key={`workflow-level-${String(lvl.level)}`}
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
