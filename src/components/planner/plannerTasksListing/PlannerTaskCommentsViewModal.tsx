import React, { useCallback, useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { getTaskComments } from "@utils/tasks";
import {
  normalizeTaskCommentsResponse,
} from "@components/planner/plannerTaskDetail/plannerTaskDetailDomain";
import {
  PlannerTaskCommentsTabPanel,
  type TaskCommentRow,
} from "@components/planner/plannerTaskDetail/PlannerTaskCommentsTabPanel";
import type { Task } from "./plannerTasksListingDomain";

export type PlannerTaskCommentsViewModalProps = Readonly<{
  show: boolean;
  task: Task | null;
  onHide: () => void;
  hierarchyDataExtensions: unknown;
  allowMutations: boolean;
  onCommentsChanged?: () => void;
}>;

export function PlannerTaskCommentsViewModal({
  show,
  task,
  onHide,
  hierarchyDataExtensions,
  allowMutations,
  onCommentsChanged,
}: PlannerTaskCommentsViewModalProps) {
  const [loadingComments, setLoadingComments] = useState(false);
  const [taskComments, setTaskComments] = useState<TaskCommentRow[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  const loadComments = useCallback(async () => {
    if (!task?.id) {
      setTaskComments([]);
      return;
    }
    setLoadingComments(true);
    try {
      const res = await getTaskComments(task.id);
      setTaskComments(normalizeTaskCommentsResponse(res));
    } catch {
      setTaskComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, [task?.id]);

  useEffect(() => {
    if (!show || !task?.id) {
      setTaskComments([]);
      setNewComment("");
      setEditingCommentId(null);
      setEditingCommentText("");
      return;
    }
    void loadComments();
  }, [show, task?.id, loadComments]);

  const handleHide = () => {
    setNewComment("");
    setEditingCommentId(null);
    setEditingCommentText("");
    onHide();
    onCommentsChanged?.();
  };

  return (
    <Modal show={show} onHide={handleHide} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6">
          Comments
          {task ? (
            <span className="text-muted fw-normal ms-2">{task.title}</span>
          ) : null}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="ptl-comments-modal-body">
        {task ? (
          <PlannerTaskCommentsTabPanel
            taskId={task.id}
            loadingComments={loadingComments}
            taskComments={taskComments}
            setTaskComments={setTaskComments}
            editingCommentId={editingCommentId}
            setEditingCommentId={setEditingCommentId}
            editingCommentText={editingCommentText}
            setEditingCommentText={setEditingCommentText}
            newComment={newComment}
            setNewComment={setNewComment}
            submittingComment={submittingComment}
            setSubmittingComment={setSubmittingComment}
            hierarchyDataExtensions={hierarchyDataExtensions}
            allowMutations={allowMutations}
          />
        ) : (
          <div className="text-center py-4 text-muted">No task selected</div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={handleHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
