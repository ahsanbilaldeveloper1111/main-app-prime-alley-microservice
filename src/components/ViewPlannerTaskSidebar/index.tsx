"use client";

import React, { useEffect, useState } from "react";
import { Row, Col, Spinner, Nav, Form, Button } from "react-bootstrap";
import {
  X,
  ListTodo,
  FileText,
  FolderOpen,
  Tag,
  Users,
  Eye,
  Calendar,
  Flag,
  History,
  MessageSquare,
  Send,
} from "lucide-react";
import { getTaskActivities, getTaskComments, createTaskComment } from "@utils/tasks";

export interface ViewPlannerTaskSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  /** Loaded task payload (same shape as work-planner task from `getTask`). */
  task?: Record<string, unknown> | null;
  /** User directory rows for resolving assignee / watcher names. */
  extensions?: Array<{ id?: string; extension_number?: string; name?: string }>;
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 14,
  color: "#141414",
  fontWeight: 600,
  marginBottom: 8,
};

const VALUE_BOX: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 300,
  color: "#141414",
  padding: "10px 12px",
  border: "1px solid #8a8a8a",
  borderRadius: 4,
  backgroundColor: "#fafafa",
  minHeight: 40,
  display: "flex",
  alignItems: "center",
};

function formatDisplayDate(value: unknown): string {
  if (value == null || value === "") return "—";
  const displayValue = formatUnknownForDisplay(value);
  const d = new Date(displayValue);
  if (Number.isNaN(d.getTime())) return displayValue;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatUnknownForDisplay(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    const serialized = JSON.stringify(value);
    return serialized ?? "—";
  } catch {
    return "—";
  }
}

function priorityLabel(p: unknown): string {
  const s = formatUnknownForDisplay(p ?? "normal").toLowerCase();
  const map: Record<string, string> = {
    low: "Low",
    normal: "Normal",
    medium: "Medium",
    high: "High",
    urgent: "Urgent",
  };
  return map[s] ?? formatUnknownForDisplay(p);
}

function taskTypeLabel(t: unknown): string {
  if (t === "todo") return "Todo";
  if (t === "recurring") return "Recurring";
  return "Regular";
}

function viewTitle(t: unknown): string {
  if (t === "todo") return "View Todo";
  if (t === "recurring") return "View Recurring";
  return "View Task";
}

interface FieldRowProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function FieldRow({ label, icon, children }: Readonly<FieldRowProps>) {
  return (
    <div className="mb-3">
      <div style={LABEL_STYLE} className="d-flex align-items-center gap-2">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

function normalizeApiList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && "data" in raw && Array.isArray((raw as { data: unknown }).data)) {
    return (raw as { data: T[] }).data;
  }
  return [];
}

function formatActivityDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

function personFromExtension(
  extNumber: string,
  extensions: ViewPlannerTaskSidebarProps["extensions"],
): { name: string; initials: string } {
  if (!extNumber) {
    return { name: "—", initials: "—" };
  }
  if (!extensions?.length) {
    return { name: extNumber, initials: extNumber.toUpperCase().slice(0, 2) };
  }
  const extension = extensions.find(
    (ext) => ext.id === extNumber || ext.extension_number === extNumber,
  );
  const name = extension?.name ?? extNumber;
  if (name === extNumber) {
    return { name, initials: extNumber.toUpperCase().slice(0, 2) };
  }
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return { name, initials };
}

function extensionNumberToString(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return "";
}

function renderPlannerHistoryBody(
  loadingActivities: boolean,
  activities: Record<string, unknown>[],
  extensions: ViewPlannerTaskSidebarProps["extensions"],
  emptyListStyle: React.CSSProperties,
  spinnerWrapStyle: React.CSSProperties,
): React.ReactNode {
  if (loadingActivities) {
    return (
      <div style={spinnerWrapStyle}>
        <Spinner animation="border" size="sm" />
      </div>
    );
  }
  if (activities.length === 0) {
    return <div style={emptyListStyle}>No activity yet</div>;
  }
  return (
    <div>
      {activities.map((activity, idx) => {
        const extNumber = extensionNumberToString(activity.extension_number);
        const { name: extensionName, initials } = personFromExtension(extNumber, extensions);
        const activityDate = formatActivityDateTime(
          formatUnknownForDisplay(activity.created_at),
        );
        const actionText = formatUnknownForDisplay(
          activity.description ?? activity.action ?? "Activity",
        );
        return (
          <div
            key={formatUnknownForDisplay(activity.id ?? idx)}
            style={{
              marginBottom: 12,
              display: "flex",
              gap: 12,
              paddingBottom: 12,
              borderBottom: idx < activities.length - 1 ? "1px solid #f1f5f9" : "none",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#fff",
                fontSize: "0.7rem",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
              }}
            >
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, color: "#1e293b", marginBottom: 4 }}>
                {extNumber === "system" ? (
                  actionText
                ) : (
                  <>
                    <strong>{extensionName}</strong> {actionText}
                  </>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>{activityDate}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderPlannerCommentList(
  comments: Record<string, unknown>[],
  extensions: ViewPlannerTaskSidebarProps["extensions"],
  emptyListStyle: React.CSSProperties,
): React.ReactNode {
  if (comments.length === 0) {
    return <div style={emptyListStyle}>No comments yet</div>;
  }
  return (
    <div>
      {comments.map((comment, idx) => {
        const extNumber = extensionNumberToString(
          comment.extension_number ??
            (comment.user as { extension_number?: string } | undefined)?.extension_number,
        );
        const { name: extensionName, initials } = personFromExtension(extNumber, extensions);
        const commentDate = formatActivityDateTime(
          formatUnknownForDisplay(comment.created_at),
        );
        const body = formatUnknownForDisplay(comment.comment);
        return (
          <div
            key={formatUnknownForDisplay(comment.id ?? idx)}
            style={{
              marginBottom: 12,
              padding: 12,
              backgroundColor: "#f8fafc",
              borderRadius: 6,
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  fontSize: "0.7rem",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                }}
              >
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: "#1e293b" }}>
                  <strong>{extensionName}</strong>
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{commentDate}</div>
              </div>
            </div>
            <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.5, paddingLeft: 2 }}>
              {body}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface PlannerCommentComposerProps {
  taskId: string | number;
  newComment: string;
  setNewComment: React.Dispatch<React.SetStateAction<string>>;
  submittingComment: boolean;
  setSubmittingComment: React.Dispatch<React.SetStateAction<boolean>>;
  setComments: React.Dispatch<React.SetStateAction<Record<string, unknown>[]>>;
}

function PlannerCommentComposer({
  taskId,
  newComment,
  setNewComment,
  submittingComment,
  setSubmittingComment,
  setComments,
}: Readonly<PlannerCommentComposerProps>) {
  const handlePost = async () => {
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      await createTaskComment(taskId, newComment.trim());
      setNewComment("");
      try {
        const commRaw = await getTaskComments(taskId);
        setComments(normalizeApiList<Record<string, unknown>>(commRaw));
      } catch (refreshErr) {
        console.error("Error refreshing comments:", refreshErr);
      }
    } catch {
      // createTaskComment surfaces errors via toast
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div
      style={{
        borderTop: "1px solid #e2e8f0",
        paddingTop: 16,
        marginTop: 16,
      }}
    >
      <Form.Group>
        <Form.Control
          as="textarea"
          rows={3}
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={submittingComment}
          style={{ marginBottom: 8, fontSize: 14 }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="primary"
            size="sm"
            disabled={submittingComment || !newComment.trim()}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
            onClick={handlePost}
          >
            {submittingComment ? (
              <Spinner animation="border" size="sm" style={{ width: 14, height: 14 }} />
            ) : (
              <Send size={14} />
            )}
            Post comment
          </Button>
        </div>
      </Form.Group>
    </div>
  );
}

interface PlannerCommentsSectionParams {
  loadingComments: boolean;
  comments: Record<string, unknown>[];
  extensions: ViewPlannerTaskSidebarProps["extensions"];
  taskId: string | number | null;
  newComment: string;
  setNewComment: React.Dispatch<React.SetStateAction<string>>;
  submittingComment: boolean;
  setSubmittingComment: React.Dispatch<React.SetStateAction<boolean>>;
  setComments: React.Dispatch<React.SetStateAction<Record<string, unknown>[]>>;
  emptyListStyle: React.CSSProperties;
  spinnerWrapStyle: React.CSSProperties;
}

function renderPlannerCommentsBody(
  p: Readonly<PlannerCommentsSectionParams>,
): React.ReactNode {
  const {
    loadingComments,
    comments,
    extensions,
    taskId,
    newComment,
    setNewComment,
    submittingComment,
    setSubmittingComment,
    setComments,
    emptyListStyle,
    spinnerWrapStyle,
  } = p;
  if (loadingComments) {
    return (
      <div style={spinnerWrapStyle}>
        <Spinner animation="border" size="sm" />
      </div>
    );
  }
  return (
    <>
      {renderPlannerCommentList(comments, extensions, emptyListStyle)}
      {taskId != null && (
        <PlannerCommentComposer
          taskId={taskId}
          newComment={newComment}
          setNewComment={setNewComment}
          submittingComment={submittingComment}
          setSubmittingComment={setSubmittingComment}
          setComments={setComments}
        />
      )}
    </>
  );
}

const ViewPlannerTaskSidebar: React.FC<ViewPlannerTaskSidebarProps> = ({
  isOpen = false,
  onClose,
  task,
  extensions = [],
}) => {
  const t = task ?? {};
  const taskId =
    t.id != null && t.id !== ""
      ? (t.id as string | number)
      : null;

  const [activities, setActivities] = useState<Record<string, unknown>[]>([]);
  const [comments, setComments] = useState<Record<string, unknown>[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [detailTab, setDetailTab] = useState<"history" | "comments">("history");
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (isOpen && taskId != null) {
      setDetailTab("history");
    }
  }, [isOpen, taskId]);

  useEffect(() => {
    setNewComment("");
  }, [taskId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || taskId == null) {
      setActivities([]);
      setComments([]);
      return;
    }
    let cancelled = false;
    setLoadingActivities(true);
    setLoadingComments(true);
    (async () => {
      try {
        const [actRaw, commRaw] = await Promise.all([
          getTaskActivities(taskId, 1, 20),
          getTaskComments(taskId),
        ]);
        if (cancelled) return;
        setActivities(normalizeApiList<Record<string, unknown>>(actRaw));
        setComments(normalizeApiList<Record<string, unknown>>(commRaw));
      } catch {
        if (!cancelled) {
          setActivities([]);
          setComments([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingActivities(false);
          setLoadingComments(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, taskId]);

  if (!isOpen) return null;

  const title = String(t.title ?? "—");
  const taskType = t.type;
  const project = t.project as { name?: string } | null | undefined;
  const status = t.status as { name?: string } | null | undefined;
  const assignees = (t.assignees as Array<{ extension_number?: string }> | undefined) ?? [];
  const watchersRaw = t.watchers as Array<{ extension_number?: string }> | undefined;
  const watcherNums = t.watcher_numbers as string[] | undefined;
  const watchers =
    watchersRaw?.length
      ? watchersRaw
      : (watcherNums?.map((n) => ({ extension_number: n })) ?? []);
  const labels = (t.labels as Array<{ id: number; name: string; color?: string }> | undefined) ?? [];
  const description = typeof t.description === "string" ? t.description.trim() : "";

  const emptyListStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "1rem",
    color: "#94a3b8",
    fontSize: 14,
  };
  const spinnerWrapStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "1.5rem",
  };

  const historySectionBody = renderPlannerHistoryBody(
    loadingActivities,
    activities,
    extensions,
    emptyListStyle,
    spinnerWrapStyle,
  );

  const commentsSectionBody = renderPlannerCommentsBody({
    loadingComments,
    comments,
    extensions,
    taskId,
    newComment,
    setNewComment,
    submittingComment,
    setSubmittingComment,
    setComments,
    emptyListStyle,
    spinnerWrapStyle,
  });

  return (
    <>
      <style>{`
        .view-planner-task-sidebar .description-html ul,
        .view-planner-task-sidebar .description-html ol {
          padding-left: 20px;
          margin: 8px 0;
        }
        .view-planner-task-sidebar .description-html a {
          color: #4680ff;
          text-decoration: underline;
        }
        .view-planner-task-sidebar-tabs {
          margin-top: 24px;
        }
        .view-planner-task-sidebar-tabs .nav-tabs {
          border-bottom: 2px solid #e2e8f0;
        }
        .view-planner-task-sidebar-tabs .nav-link {
          color: #64748b;
          border: none;
          border-bottom: 2px solid transparent;
          padding: 0.65rem 1rem;
          font-weight: 500;
          font-size: 0.875rem;
          background: transparent;
          margin-bottom: -2px;
        }
        .view-planner-task-sidebar-tabs .nav-link:hover {
          color: #334155;
          border-color: transparent;
        }
        .view-planner-task-sidebar-tabs .nav-link.active {
          color: #3b82f6;
          background: transparent;
          border-bottom: 2px solid #3b82f6;
        }
      `}</style>

      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          backgroundColor: "rgba(0,0,0,0.2)",
        }}
        aria-hidden
      />
      <div
        className="view-planner-task-sidebar"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 520,
          maxWidth: "100vw",
          height: "100vh",
          backgroundColor: "#fff",
          boxShadow: "-4px 0 20px rgba(0,0,0,0.12)",
          zIndex: 999999,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #e8eef5",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <ListTodo size={20} color="#4e6fa5" />
            {viewTitle(taskType)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              padding: 4,
              cursor: "pointer",
              color: "#6c757d",
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
          }}
        >
          
          <Row>
            <Col xs={12}>
              <FieldRow label="Title" icon={<FileText size={16} />}>
                <div style={VALUE_BOX}>{title}</div>
              </FieldRow>
            </Col>

            <Col xs={12} md={6}>
              <FieldRow label="Task type" icon={<ListTodo size={16} />}>
                <div style={VALUE_BOX}>{taskTypeLabel(taskType)}</div>
              </FieldRow>
            </Col>
            <Col xs={12} md={6}>
              <FieldRow label="Priority" icon={<Flag size={16} />}>
                <div style={VALUE_BOX}>{priorityLabel(t.priority)}</div>
              </FieldRow>
            </Col>

            {taskType !== "todo" && (
              <>
                <Col xs={12} md={6}>
                  <FieldRow label="Project" icon={<FolderOpen size={16} />}>
                    <div style={VALUE_BOX}>{project?.name ?? "Not assigned"}</div>
                  </FieldRow>
                </Col>
                <Col xs={12} md={6}>
                  <FieldRow label="Status" icon={<ListTodo size={16} />}>
                    <div style={VALUE_BOX}>{status?.name ?? "Not assigned"}</div>
                  </FieldRow>
                </Col>
              </>
            )}

            <Col xs={12}>
              <FieldRow label="Assignees" icon={<Users size={16} />}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {assignees.length === 0 ? (
                    <div style={{ ...VALUE_BOX, flex: 1 }}>Not assigned</div>
                  ) : (
                    assignees.map((a, i) => {
                      const ext = String(a.extension_number ?? "");
                      const { name, initials } = personFromExtension(ext, extensions);
                      return (
                        <div
                          key={`${ext}-${i}`}
                          title={name}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {initials}
                        </div>
                      );
                    })
                  )}
                </div>
              </FieldRow>
            </Col>

            <Col xs={12}>
              <FieldRow label="Watchers" icon={<Eye size={16} />}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {watchers.length === 0 ? (
                    <div style={{ ...VALUE_BOX, flex: 1 }}>Not assigned</div>
                  ) : (
                    watchers.map((w, i) => {
                      const ext = String(w.extension_number ?? "");
                      const { name, initials } = personFromExtension(ext, extensions);
                      return (
                        <div
                          key={`w-${ext}-${i}`}
                          title={name}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {initials}
                        </div>
                      );
                    })
                  )}
                </div>
              </FieldRow>
            </Col>

            <Col xs={12} md={6}>
              <FieldRow label="Due date" icon={<Calendar size={16} />}>
                <div style={VALUE_BOX}>{formatDisplayDate(t.due_date)}</div>
              </FieldRow>
            </Col>
            <Col xs={12} md={6}>
              <FieldRow label="Start date" icon={<Calendar size={16} />}>
                <div style={VALUE_BOX}>{formatDisplayDate(t.start_date)}</div>
              </FieldRow>
            </Col>

            {taskType === "recurring" && (
              <Col xs={12}>
                <FieldRow label="Recurrence" icon={<Calendar size={16} />}>
                  <div style={{ ...VALUE_BOX, flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                    <span>Frequency: {formatUnknownForDisplay(t.frequency)}</span>
                    <span>Interval: {formatUnknownForDisplay(t.repeat_interval)}</span>
                    {t.repeat_on != null && (
                      <span>Repeat on: {formatUnknownForDisplay(t.repeat_on)}</span>
                    )}
                  </div>
                </FieldRow>
              </Col>
            )}

            {labels.length > 0 && (
              <Col xs={12}>
                <FieldRow label="Labels" icon={<Tag size={16} />}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {labels.map((lb) => (
                      <span
                        key={lb.id}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          backgroundColor: lb.color ?? "#e2e8f0",
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#141414",
                        }}
                      >
                        {lb.name}
                      </span>
                    ))}
                  </div>
                </FieldRow>
              </Col>
            )}

            <Col xs={12}>
              <FieldRow label="Description" icon={<FileText size={16} />}>
                <div
                  className="description-html"
                  style={{
                    ...VALUE_BOX,
                    minHeight: 100,
                    alignItems: "flex-start",
                    overflowX: "auto",
                  }}
                  dangerouslySetInnerHTML={{
                    __html:
                      description ||
                      '<span style="color:#64748b">No description</span>',
                  }}
                />
              </FieldRow>
            </Col>

            <Col xs={12}>
              <div className="view-planner-task-sidebar-tabs">
                <Nav variant="tabs" className="border-0">
                  <Nav.Item>
                    <Nav.Link
                      active={detailTab === "history"}
                      onClick={() => setDetailTab("history")}
                      className="d-flex align-items-center gap-2"
                    >
                      <History size={16} />
                      History
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      active={detailTab === "comments"}
                      onClick={() => setDetailTab("comments")}
                      className="d-flex align-items-center gap-2"
                    >
                      <MessageSquare size={16} />
                      Comments
                      {comments.length > 0 && (
                        <span className="text-muted fw-normal">({comments.length})</span>
                      )}
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
                <div style={{ paddingTop: 12, minHeight: 120 }}>
                  {detailTab === "history" ? historySectionBody : commentsSectionBody}
                </div>
              </div>
            </Col>
          </Row>
        </div>

        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e8eef5",
            display: "flex",
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 20px",
              fontSize: 14,
              fontWeight: 600,
              border: "1px solid #e2e8f0",
              borderRadius: 4,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default ViewPlannerTaskSidebar;
