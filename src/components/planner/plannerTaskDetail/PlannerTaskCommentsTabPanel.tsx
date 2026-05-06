import React from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { Edit, Send, Trash2 } from "lucide-react";
import {
  formatActivityDate,
  getExtensionDisplay,
  normalizeTaskCommentsResponse,
} from "@components/planner/plannerTaskDetail/plannerTaskDetailDomain";
import {
  createTaskComment,
  deleteTaskComment,
  getTaskComments,
  updateTaskComment,
} from "@utils/tasks";
import "./plannerTaskDetail.scss";

export type TaskCommentRow = Readonly<{
  id: number;
  extension_number?: string;
  user?: { extension_number?: string };
  created_at?: string;
  comment?: string;
}>;

export type PlannerTaskCommentsTabPanelProps = Readonly<{
  taskId: number | string | undefined;
  loadingComments: boolean;
  taskComments: TaskCommentRow[];
  setTaskComments: React.Dispatch<React.SetStateAction<TaskCommentRow[]>>;
  editingCommentId: number | null;
  setEditingCommentId: React.Dispatch<React.SetStateAction<number | null>>;
  editingCommentText: string;
  setEditingCommentText: React.Dispatch<React.SetStateAction<string>>;
  newComment: string;
  setNewComment: React.Dispatch<React.SetStateAction<string>>;
  submittingComment: boolean;
  setSubmittingComment: React.Dispatch<React.SetStateAction<boolean>>;
  hierarchyDataExtensions: unknown;
  /** When false, hide create / edit / delete comment controls (offcanvas read-only). */
  allowMutations?: boolean;
  /** Replaces default activity date formatting for comment timestamps. */
  formatCommentDateFn?: (dateString: string) => string;
  sectionClassName?: string;
}>;

export function PlannerTaskCommentsTabPanel({
  taskId,
  loadingComments,
  taskComments,
  setTaskComments,
  editingCommentId,
  setEditingCommentId,
  editingCommentText,
  setEditingCommentText,
  newComment,
  setNewComment,
  submittingComment,
  setSubmittingComment,
  hierarchyDataExtensions,
  allowMutations = true,
  formatCommentDateFn,
  sectionClassName,
}: PlannerTaskCommentsTabPanelProps) {
  const refreshComments = async () => {
    if (!taskId) return;
    const res = await getTaskComments(taskId);
    setTaskComments(normalizeTaskCommentsResponse(res));
  };

  const formatCommentDate = formatCommentDateFn ?? formatActivityDate;

  let content: React.ReactNode;
  if (loadingComments) {
    content = (
      <div className="text-center py-4">
        <Spinner animation="border" size="sm" />
      </div>
    );
  } else {
    content = (
      <>
        <div className="mb-3">
          {taskComments.length === 0 ? (
            <div className="text-center py-4 text-muted small">No comments yet</div>
          ) : (
            taskComments.map((comment, idx) => {
              const extNumber = comment.extension_number || comment.user?.extension_number || "";
              const { name: extensionName, initials: extensionInitials } = getExtensionDisplay(
                extNumber,
                hierarchyDataExtensions,
              );
              const commentDate = formatCommentDate(comment.created_at || "");
              const isEditing = allowMutations && editingCommentId === comment.id;
              const commentKey =
                comment.id === undefined || comment.id === null
                  ? `comment-idx-${idx}`
                  : `comment-${comment.id}`;
              return (
                <div key={commentKey} className="p-3 bg-light rounded mb-2">
                  {isEditing ? (
                    <>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        className="mb-2"
                      />
                      <div className="d-flex gap-2 justify-content-end">
                        <Button
                          variant="light"
                          size="sm"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingCommentText("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={submittingComment || !editingCommentText.trim()}
                          onClick={async () => {
                            if (!taskId || !editingCommentText.trim()) {
                              return;
                            }
                            try {
                              setSubmittingComment(true);
                              await updateTaskComment(taskId, comment.id, editingCommentText.trim());
                              await refreshComments();
                              setEditingCommentId(null);
                              setEditingCommentText("");
                            } finally {
                              setSubmittingComment(false);
                            }
                          }}
                        >
                          Save
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="d-flex gap-2 mb-2">
                        <div className="ptd-activity-avatar ptd-activity-avatar--sm">
                          {extensionInitials}
                        </div>
                        <div className="flex-grow-1">
                          <strong className="small">{extensionName}</strong>
                          <div className="small text-muted">{commentDate}</div>
                        </div>
                        {allowMutations ? (
                          <>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0"
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditingCommentText(comment.comment || "");
                              }}
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 text-danger"
                              onClick={async () => {
                                if (!taskId) return;
                                await deleteTaskComment(taskId, comment.id);
                                await refreshComments();
                              }}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </>
                        ) : null}
                      </div>
                      <div className="small">{comment.comment}</div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
        {allowMutations ? (
          <div className="border-top pt-3">
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="mb-2"
            />
            <Button
              variant="primary"
              size="sm"
              disabled={submittingComment || !newComment.trim()}
              onClick={async () => {
                if (!taskId || !newComment.trim()) {
                  return;
                }
                try {
                  setSubmittingComment(true);
                  await createTaskComment(taskId, newComment.trim());
                  setNewComment("");
                  await refreshComments();
                } finally {
                  setSubmittingComment(false);
                }
              }}
            >
              <Send size={14} className="me-1" />
              Post Comment
            </Button>
          </div>
        ) : null}
      </>
    );
  }

  return sectionClassName ? <div className={sectionClassName}>{content}</div> : content;
}
