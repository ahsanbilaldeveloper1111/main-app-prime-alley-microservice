import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { GripVertical, Trash2 } from "lucide-react";
import Select from "@components/AppSelect";
import type { MainAppUserLookup } from "@hooks/useMainAppLookups";
import type { WorkflowLevelAssignee } from "@utils/staffManagement";
import type { CategoryFormState } from "../../request-categories/requestCategoriesDomain";

export type SubCategoriesAssigneesListProps = Readonly<{
  assignees: WorkflowLevelAssignee[];
  mainAppUsers: MainAppUserLookup[];
  levelIndex: number;
  categoryForm: CategoryFormState;
  setCategoryForm: React.Dispatch<React.SetStateAction<CategoryFormState>>;
}>;

export default function SubCategoriesAssigneesList({
  assignees,
  mainAppUsers,
  levelIndex,
  categoryForm,
  setCategoryForm,
}: SubCategoriesAssigneesListProps) {
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
    if (
      fromIndex < 0 ||
      Number.isNaN(fromIndex) ||
      fromIndex === toIndex ||
      fromIndex >= assignees.length
    ) {
      return;
    }
    const reordered = [...assignees];
    const [removed] = reordered.splice(fromIndex, 1);
    if (removed === undefined) return;
    reordered.splice(toIndex, 0, removed);
    updateAssignees(reordered.map((a, i) => ({ ...a, sort_order: i })));
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const userOptions = mainAppUsers.map((u) => ({
    value: String(u.id),
    label: u.name ?? String(u.id),
  }));

  const assigneeRowKey = (a: WorkflowLevelAssignee) =>
    `wf-assignee-${levelIndex}-${a.sort_order ?? 0}-${(a.user_id ?? "").trim() || "empty"}`;

  return (
    <ul className="list-unstyled mb-0 ps-0 d-flex flex-column gap-2">
      {assignees.map((assignee, assigneeIdx) => (
        <li
          key={assigneeRowKey(assignee)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, assigneeIdx)}
          className="d-flex align-items-center gap-2 p-2 border rounded bg-white"
          style={{
            opacity: draggedIndex === assigneeIdx ? 0.6 : 1,
          }}
        >
          <button
            type="button"
            draggable
            onDragStart={(e) => handleDragStart(e, assigneeIdx)}
            onDragEnd={handleDragEnd}
            className="btn btn-link p-0 d-flex align-items-center text-muted border-0"
            style={{ cursor: "grab" }}
            aria-label="Drag to reorder assignee"
          >
            <GripVertical size={18} aria-hidden />
          </button>
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
      ))}
    </ul>
  );
}
