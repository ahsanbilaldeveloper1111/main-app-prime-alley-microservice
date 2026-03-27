import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button, Form, Nav, Spinner } from "react-bootstrap";
import { Edit, Trash2, Send, Upload, FileText, Download } from "lucide-react";
import {
  getTaskActivities,
  getTaskComments,
  createTaskComment,
  updateTaskComment,
  deleteTaskComment,
  getTaskDocumentDownload,
  getTaskDocuments,
  postTaskDocuments,
  deleteTaskDocument,
} from "@utils/tasks";
import AllActivitiesBrowserModal from "./AllActivitiesBrowserModal";
import { useAllActivitiesBrowserModal } from "./useAllActivitiesBrowserModal";
import type { ActivityLogExtension } from "./activityLogExtension";
import {
  formatActivityDate,
  getExtensionDisplay,
  normalizeTaskActivitiesPayload,
  ActivitiesTabPanel,
} from "./taskActivityLogModalShared";

export type { ActivityLogExtension as TaskSecondaryTabsExtension } from "./activityLogExtension";

export type TaskSecondaryTabId = "activity" | "comments" | "documents";

interface TaskSecondaryTabsProps {
  taskId: string | number | null | undefined;
  extensions?: ActivityLogExtension[];
  /** When false, renders nothing (e.g. create mode). */
  visible?: boolean;
}

function normalizeCommentsResponse(commentsResponse: unknown): any[] {
  if (commentsResponse && Array.isArray(commentsResponse)) {
    return commentsResponse;
  }
  if (
    commentsResponse &&
    typeof commentsResponse === "object" &&
    Array.isArray((commentsResponse as { data?: unknown }).data)
  ) {
    return (commentsResponse as { data: any[] }).data;
  }
  return [];
}

function documentPluralSuffix(count: number): string {
  if (count === 1) {
    return "";
  }
  return "s";
}

const TaskSecondaryTabs: React.FC<TaskSecondaryTabsProps> = ({
  taskId,
  extensions = [],
  visible = true,
}) => {
  const [activeTab, setActiveTab] = useState<TaskSecondaryTabId>("activity");
  const [taskActivities, setTaskActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [taskComments, setTaskComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [taskDocuments, setTaskDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const resolvedId = taskId != null && taskId !== "" ? taskId : null;

  const { openActivitiesModal, resetActivitiesModal, activitiesModalProps } = useAllActivitiesBrowserModal(
    { type: "task", taskId: resolvedId },
    extensions,
  );

  const resetLocalState = useCallback(() => {
    setActiveTab("activity");
    setTaskActivities([]);
    setTaskComments([]);
    setTaskDocuments([]);
    setNewComment("");
    setEditingCommentId(null);
    setEditingCommentText("");
    resetActivitiesModal();
  }, [resetActivitiesModal]);

  useEffect(() => {
    if (!visible || resolvedId == null) {
      resetLocalState();
    }
  }, [visible, resolvedId, resetLocalState]);

  const fetchActivitiesPreview = useCallback(async () => {
    if (resolvedId == null) return;
    try {
      setLoadingActivities(true);
      const res = await getTaskActivities(resolvedId, 1, 5);
      setTaskActivities(normalizeTaskActivitiesPayload(res));
    } catch (e) {
      console.error("Error fetching task activities:", e);
      setTaskActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  }, [resolvedId]);

  useEffect(() => {
    if (!visible || resolvedId == null) return;
    void fetchActivitiesPreview();
  }, [visible, resolvedId, fetchActivitiesPreview]);

  const handleCommentsTabClick = async () => {
    setActiveTab("comments");
    if (resolvedId == null || taskComments.length > 0) return;
    try {
      setLoadingComments(true);
      const commentsResponse = await getTaskComments(resolvedId);
      setTaskComments(normalizeCommentsResponse(commentsResponse));
    } catch (error) {
      console.error("Error fetching comments:", error);
      setTaskComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchTaskDocuments = async () => {
    if (resolvedId == null) return;
    try {
      setLoadingDocuments(true);
      const data = await getTaskDocuments(resolvedId);
      setTaskDocuments(Array.isArray(data) ? data : data?.data ?? []);
    } catch (error) {
      console.error("Error fetching task documents:", error);
      setTaskDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleDocumentsTabClick = async () => {
    setActiveTab("documents");
    if (resolvedId != null) {
      await fetchTaskDocuments();
    }
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || resolvedId == null) return;
    try {
      setUploadingDocument(true);
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append("documents[]", file);
      }
      await postTaskDocuments(resolvedId, formData);
      await fetchTaskDocuments();
      if (documentInputRef.current) documentInputRef.current.value = "";
    } catch (error) {
      console.error("Error uploading document:", error);
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDownloadDocument = async (doc: any) => {
    if (resolvedId == null || !doc?.id) return;
    try {
      const blob = await getTaskDocumentDownload(resolvedId, doc.id);
      if (!blob) return;
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.original_name || doc.name || doc.file_name || "document";
      a.click();
      globalThis.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
    }
  };

  const handleDeleteDocument = async (doc: any) => {
    if (resolvedId == null || !doc?.id) return;
    try {
      await deleteTaskDocument(resolvedId, doc.id);
      await fetchTaskDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  if (!visible || resolvedId == null) {
    return null;
  }

  return (
    <>
      <style>{`
        .task-secondary-tabs .nav-link {
          color: #64748b;
          border: none;
          border-bottom: 2px solid transparent;
          padding: 0.65rem 0.75rem;
          font-weight: 500;
          font-size: 0.8125rem;
          background: transparent;
          margin-bottom: -2px;
        }
        .task-secondary-tabs .nav-link.active {
          color: #3b82f6;
          background: transparent;
          border-bottom: 2px solid #3b82f6;
        }
      `}</style>
      <div
        className="task-secondary-tabs"
        style={{
          flexShrink: 0,
          borderTop: "1px solid #e8eef5",
          backgroundColor: "#fafbfc",
        }}
      >
        <Nav
          variant="tabs"
          className="px-2 pt-1"
          style={{ borderBottom: "2px solid #e2e8f0", marginBottom: 0 }}
        >
          <Nav.Item>
            <Nav.Link
              className="py-2"
              active={activeTab === "activity"}
              onClick={() => setActiveTab("activity")}
            >
              Activities
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              className="py-2"
              active={activeTab === "comments"}
              onClick={() => void handleCommentsTabClick()}
            >
              Comments{taskComments.length > 0 ? ` (${taskComments.length})` : ""}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              className="py-2"
              active={activeTab === "documents"}
              onClick={() => void handleDocumentsTabClick()}
            >
              Documents
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <div
          style={{
            maxHeight: "min(240px, 32vh)",
            overflowY: "auto",
            padding: "12px 16px 16px",
            backgroundColor: "#fff",
          }}
        >
          {activeTab === "activity" && (
            <ActivitiesTabPanel
              loadingActivities={loadingActivities}
              taskActivities={taskActivities}
              extensions={extensions}
              onViewAll={openActivitiesModal}
            />
          )}

          {activeTab === "comments" && (
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 8,
                padding: "0.75rem",
                border: "1px solid #e2e8f0",
              }}
            >
              {loadingComments ? (
                <div style={{ textAlign: "center", padding: "1.5rem" }}>
                  <Spinner animation="border" size="sm" />
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: "0.75rem" }}>
                    {taskComments.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "1.5rem",
                          color: "#94a3b8",
                          fontSize: "0.875rem",
                        }}
                      >
                        No comments yet
                      </div>
                    ) : (
                      taskComments.map((comment: any, idx: number) => {
                        const extNumber =
                          comment.extension_number || comment.user?.extension_number || "";
                        const { name: extensionName, initials: extensionInitials } =
                          getExtensionDisplay(extensions, String(extNumber));
                        const commentDate = formatActivityDate(comment.created_at || "");
                        const isEditing = editingCommentId === comment.id;

                        return (
                          <div
                            key={comment.id ?? idx}
                            style={{
                              marginBottom: "0.75rem",
                              padding: "0.75rem",
                              backgroundColor: "#f8fafc",
                              borderRadius: 6,
                            }}
                          >
                            {isEditing ? (
                              <div>
                                <Form.Control
                                  as="textarea"
                                  rows={3}
                                  value={editingCommentText}
                                  onChange={(e) => setEditingCommentText(e.target.value)}
                                  style={{ marginBottom: "0.5rem" }}
                                />
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "0.5rem",
                                    justifyContent: "flex-end",
                                  }}
                                >
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
                                    onClick={async () => {
                                      if (resolvedId != null && editingCommentText.trim()) {
                                        try {
                                          setSubmittingComment(true);
                                          await updateTaskComment(
                                            resolvedId,
                                            comment.id,
                                            editingCommentText.trim(),
                                          );
                                          const commentsResponse = await getTaskComments(resolvedId);
                                          setTaskComments(normalizeCommentsResponse(commentsResponse));
                                          setEditingCommentId(null);
                                          setEditingCommentText("");
                                        } catch (error) {
                                          console.error("Error updating comment:", error);
                                        } finally {
                                          setSubmittingComment(false);
                                        }
                                      }
                                    }}
                                    disabled={submittingComment || !editingCommentText.trim()}
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "0.75rem",
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "32px",
                                      height: "32px",
                                      fontSize: "0.7rem",
                                      flexShrink: 0,
                                      borderRadius: "50%",
                                      background:
                                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                      color: "white",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {extensionInitials}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: "0.875rem",
                                        color: "#1e293b",
                                        marginBottom: "0.25rem",
                                      }}
                                    >
                                      <strong>{extensionName}</strong>
                                    </div>
                                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                                      {commentDate}
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", gap: "0.25rem" }}>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="p-0"
                                      onClick={() => {
                                        setEditingCommentId(comment.id);
                                        setEditingCommentText(comment.comment || "");
                                      }}
                                      style={{ padding: "0.25rem", minWidth: "auto" }}
                                    >
                                      <Edit size={14} />
                                    </Button>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="p-0"
                                      onClick={async () => {
                                        try {
                                          await deleteTaskComment(resolvedId, comment.id);
                                          const commentsResponse = await getTaskComments(resolvedId);
                                          setTaskComments(normalizeCommentsResponse(commentsResponse));
                                        } catch (error) {
                                          console.error("Error deleting comment:", error);
                                        }
                                      }}
                                      style={{
                                        padding: "0.25rem",
                                        minWidth: "auto",
                                        color: "#dc3545",
                                      }}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.875rem",
                                    color: "#475569",
                                    lineHeight: 1.6,
                                  }}
                                >
                                  {comment.comment}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div
                    style={{
                      borderTop: "1px solid #e2e8f0",
                      paddingTop: "0.75rem",
                      marginTop: "0.75rem",
                    }}
                  >
                    <Form.Group>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        style={{ marginBottom: "0.5rem", fontSize: "0.875rem" }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={async () => {
                            if (resolvedId != null && newComment.trim()) {
                              try {
                                setSubmittingComment(true);
                                await createTaskComment(resolvedId, newComment.trim());
                                setNewComment("");
                                const commentsResponse = await getTaskComments(resolvedId);
                                setTaskComments(normalizeCommentsResponse(commentsResponse));
                              } catch (error) {
                                console.error("Error creating comment:", error);
                              } finally {
                                setSubmittingComment(false);
                              }
                            }
                          }}
                          disabled={submittingComment || !newComment.trim()}
                          style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
                        >
                          <Send size={14} />
                          Post
                        </Button>
                      </div>
                    </Form.Group>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 8,
                padding: "0.75rem",
                border: "1px solid #e2e8f0",
              }}
            >
              {loadingDocuments ? (
                <div style={{ textAlign: "center", padding: "1.5rem" }}>
                  <Spinner animation="border" size="sm" />
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "0.75rem",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <span style={{ fontSize: "0.875rem", color: "#64748b" }}>
                      {taskDocuments.length} document{documentPluralSuffix(taskDocuments.length)}
                    </span>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        ref={documentInputRef}
                        type="file"
                        accept="*/*"
                        multiple
                        style={{ display: "none" }}
                        onChange={handleUploadDocument}
                        disabled={uploadingDocument}
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={uploadingDocument}
                        onClick={() => documentInputRef.current?.click()}
                        style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
                      >
                        {uploadingDocument ? (
                          <Spinner
                            animation="border"
                            size="sm"
                            style={{ width: "14px", height: "14px" }}
                          />
                        ) : (
                          <Upload size={14} />
                        )}
                        Upload
                      </Button>
                    </div>
                  </div>
                  {taskDocuments.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "1.25rem",
                        color: "#94a3b8",
                        fontSize: "0.875rem",
                      }}
                    >
                      No documents yet. Upload a file to attach it to this task.
                    </div>
                  ) : (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {taskDocuments.map((doc: any, idx: number) => {
                        const label =
                          doc.original_name || doc.name || doc.file_name || `Document ${idx + 1}`;
                        return (
                          <li
                            key={doc.id ?? idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "0.5rem 0.65rem",
                              backgroundColor: "#f8fafc",
                              borderRadius: 6,
                              marginBottom: "0.5rem",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                minWidth: 0,
                                flex: 1,
                              }}
                            >
                              <FileText size={16} className="text-muted" style={{ flexShrink: 0 }} />
                              <span
                                style={{
                                  fontSize: "0.8125rem",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {label}
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0"
                                onClick={() => void handleDownloadDocument(doc)}
                                title="Download"
                                style={{ minWidth: "auto", padding: "0.25rem" }}
                              >
                                <Download size={15} />
                              </Button>
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0"
                                onClick={() => void handleDeleteDocument(doc)}
                                title="Delete"
                                style={{ minWidth: "auto", padding: "0.25rem", color: "#dc3545" }}
                              >
                                <Trash2 size={15} />
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <AllActivitiesBrowserModal {...activitiesModalProps} />
    </>
  );
};

export default TaskSecondaryTabs;
