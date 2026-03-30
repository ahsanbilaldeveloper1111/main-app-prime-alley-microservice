import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button, Modal } from "react-bootstrap";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import { getUserDisplayNameFromLookup, type UserRequestIdValue } from "./userLookup";
import { useSession } from "next-auth/react";
import {
  X,
  Calendar,
  FileText,
  Clock,
  Download,
  MoreVertical,
  Circle,
  User,
  CheckCircle,
  XCircle,
  Edit3,
  UserPlus,
  File,
  ExternalLink,
  Pencil,
  Trash2,
} from "lucide-react";
import { updateUserRequest, type UserRequest, type UserRequestAttachment } from "@utils/staffManagement";

interface ApprovalDetailSidebarProps {
  request: UserRequest;
  categoryName?: string;
  onClose: () => void;
  onSuccess?: () => void;
  onEditClick?: (request: UserRequest) => void;
  onDeleteClick?: (request: UserRequest) => void;
  downloadAttachment: (attachmentId: number) => Promise<Blob>;
}

interface PendingApproval {
  count: number;
  label: string;
  color: string;
}

interface HistoryItem {
  id: string;
  avatar: string;
  name: string;
  action: string;
  timestamp: string;
}

function formatEventDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function isImageMime(mime: string | null | undefined): boolean {
  return Boolean(mime?.startsWith("image/"));
}

function AttachmentPreview({
  att,
  downloadAttachment,
}: {
  att: UserRequestAttachment;
  downloadAttachment: (id: number) => Promise<Blob>;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const isImage = isImageMime(att.mime_type);

  useEffect(() => {
    if (!isImage) return;
    let revoked = false;
    downloadAttachment(att.id)
      .then((blob) => {
        if (revoked) return;
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      })
      .catch(() => {});
    return () => {
      revoked = true;
      setImageUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [isImage, att.id, downloadAttachment]);

  if (isImage && imageUrl) {
    return (
      <>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowImageModal(true)}
          onKeyDown={(e) => e.key === "Enter" && setShowImageModal(true)}
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "8px",
            overflow: "hidden",
            flexShrink: 0,
            backgroundColor: "#f3f4f6",
            cursor: "pointer",
          }}
        >
          <img
            src={imageUrl}
            alt={att.original_name || "Attachment"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>
        <Modal
          show={showImageModal}
          onHide={() => setShowImageModal(false)}
          centered
          size="lg"
          style={{ maxWidth: "90vw",zIndex: 99999 }}
        >
          <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb" }}>
            <Modal.Title style={{ fontSize: "16px", fontWeight: "600" }}>
              {att.original_name || "Attachment"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: "16px", textAlign: "center", backgroundColor: "#f9fafb" }}>
            <img
              src={imageUrl}
              alt={att.original_name || "Attachment"}
              style={{
                maxWidth: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
                display: "block",
                margin: "0 auto",
              }}
            />
          </Modal.Body>
        </Modal>
      </>
    );
  }

  return (
    <div style={{
      width: "40px",
      height: "40px",
      backgroundColor: "#dbeafe",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <FileText size={20} color="#3b82f6" />
    </div>
  );
}

const ApprovalDetailSidebar: React.FC<ApprovalDetailSidebarProps> = ({
  request,
  categoryName = "—",
  onClose,
  onSuccess,
  onEditClick,
  onDeleteClick,
  downloadAttachment,
}) => {
  const { data: session } = useSession();
  const { mainAppUsers } = useMainAppLookups();

  const getDisplayName = useCallback(
    (userId: UserRequestIdValue) => getUserDisplayNameFromLookup(mainAppUsers, userId),
    [mainAppUsers]
  );

  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const maxCommentLength = 500;
  const [showDialog, setShowDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    type: "success" | "error" | "warning";
    title: string;
    message: string;
    onConfirm?: () => void;
  } | null>(null);

  const created_at = (request as UserRequest & { created_at?: string }).created_at;
  const pendingApprovals: PendingApproval[] = [
    { count: 5, label: "Aging", color: "#6b7280" },
    { count: 1, label: "2d", color: "#9ca3af" },
    { count: 0, label: "3-7d", color: "#d1d5db" },
    { count: 0, label: "7d+", color: "#e5e7eb" },
  ];

  const handleApprove = async () => {
    if (!comment.trim()) {
      setDialogConfig({
        type: "warning",
        title: "Comment Required",
        message: "Please add a comment before approving this request.",
      });
      setShowDialog(true);
      return;
    }
    setSubmitting(true);
    try {
      await updateUserRequest(request.id, { status: "approved", comment: comment.trim() });
      toast.success("Request approved");
      setDialogConfig({
        type: "success",
        title: "Request Approved",
        message: `The request has been approved successfully.`,
        onConfirm: () => {
          setComment("");
          onSuccess?.();
          onClose();
        },
      });
      setShowDialog(true);
    } catch {
      setDialogConfig({
        type: "error",
        title: "Error",
        message: "Failed to approve request.",
      });
      setShowDialog(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      setDialogConfig({
        type: "warning",
        title: "Comment Required",
        message: "Please add a comment explaining the reason for rejection.",
      });
      setShowDialog(true);
      return;
    }
    setSubmitting(true);
    try {
      await updateUserRequest(request.id, { status: "rejected", comment: comment.trim() });
      toast.success("Request rejected");
      setDialogConfig({
        type: "error",
        title: "Request Rejected",
        message: "The request has been rejected.",
        onConfirm: () => {
          setComment("");
          onSuccess?.();
          onClose();
        },
      });
      setShowDialog(true);
    } catch {
      setDialogConfig({
        type: "error",
        title: "Error",
        message: "Failed to reject request.",
      });
      setShowDialog(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!comment.trim()) {
      setDialogConfig({
        type: "warning",
        title: "Comment Required",
        message: "Please add a comment explaining what changes are needed.",
      });
      setShowDialog(true);
      return;
    }
    setSubmitting(true);
    try {
      await updateUserRequest(request.id, { status: "pending", comment: comment.trim() });
      toast.success("Changes requested");
      setDialogConfig({
        type: "warning",
        title: "Changes Requested",
        message: "Changes have been requested for this request.",
        onConfirm: () => {
          setComment("");
          onSuccess?.();
          onClose();
        },
      });
      setShowDialog(true);
    } catch {
      setDialogConfig({
        type: "error",
        title: "Error",
        message: "Failed to request changes.",
      });
      setShowDialog(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadAttachment = async (att: UserRequestAttachment) => {
    try {
      const blob = await downloadAttachment(att.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = att.original_name || "attachment";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch {
      toast.error("Download failed");
    }
  };

  const handleOpenAttachment = (att: UserRequestAttachment) => {
    handleDownloadAttachment(att).then(() => {
      setDialogConfig({
        type: "success",
        title: "Opening Document",
        message: "The document has been downloaded.",
      });
      setShowDialog(true);
    });
  };

  const closeDialog = () => {
    setShowDialog(false);
    if (dialogConfig?.onConfirm) {
      dialogConfig.onConfirm();
    }
    setDialogConfig(null);
  };

  const getTypeIcon = (iconType: string) => {
    const t = (iconType || "").toLowerCase();
    if (t.includes("leave")) return <Calendar size={20} color="#3b82f6" />;
    if (t.includes("document")) return <FileText size={20} color="#8b5cf6" />;
    if (t.includes("onboarding")) return <UserPlus size={20} color="#10b981" />;
    if (t.includes("profile")) return <User size={20} color="#6366f1" />;
    return <File size={20} color="#6b7280" />;
  };

  const attachments = request.attachments ?? [];
  const events = request.events ?? [];
  const dynamicFields = request.dynamic_fields && typeof request.dynamic_fields === "object" ? request.dynamic_fields : {};
  const statusDisplay = (request.status || "").toLowerCase();
  const isPending = statusDisplay === "pending";

  return (
    <div style={{
      width: '460px',
      height: '100vh',
      backgroundColor: '#ffffff',
      boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px',
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#1f2937',
          margin: 0,
          flex: 1,
        }}>
          Approval Detail
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {session?.user?.permissions?.includes('update-approval-request-staff-management') && (
          <button
            type="button"
            onClick={() => onEditClick?.(request)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '6px',
            }}
            title="Edit"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.color = '#6366f1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <Pencil size={20} />
          </button>
          )}
          {session?.user?.permissions?.includes('delete-approval-request-staff-management') && onDeleteClick && (
            <button
              type="button"
              onClick={() => onDeleteClick?.(request)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '6px',
              }}
              title="Delete"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fef2f2';
                e.currentTarget.style.color = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              <Trash2 size={20} />
            </button>
          )}
          
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Close"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px'
      }}>
        {/* User Info Section */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <User size={40} color="white" />
                      </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#1f2937",
                  margin: "0 0 4px 0",
                }}>
                  {getDisplayName(request.user_id)}
                </h3>
                {/* <p style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  margin: "0 0 8px 0",
                }}>
                  {categoryName}
                </p> */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  color: "#6b7280",
                }}>
                  {getTypeIcon(categoryName)}
                  <span>{categoryName}</span>
                </div>
              </div>
              {/* <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#6b7280'
                }}
              >
                <MoreVertical size={20} />
              </button> */}
            </div>
          </div>
        </div>

        {/* Request Summary Section */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#1f2937',
            margin: '0 0 16px 0'
          }}>
            Request summary
          </h4>

          <div style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <div style={{
              fontSize: "15px",
              fontWeight: "600",
              color: "#1f2937",
              marginBottom: "8px",
            }}>
              {request.subject ?? "—"}
            </div>
            {request.reason && (
              <div style={{ fontSize: "14px", color: "#4b5563", marginBottom: "8px", lineHeight: 1.5 }}>
                {request.reason}
              </div>
            )}
          </div>

          <div style={{
            display: "flex",
            gap: "12px",
            marginBottom: "16px",
            fontSize: "13px",
            color: "#6b7280",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Calendar size={14} />
              <span>Submitted: {formatEventDate(created_at)}</span>
            </div>
          </div>

          {Object.keys(dynamicFields).length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ marginBottom: "8px", fontSize: "13px", fontWeight: "500", color: "#6b7280" }}>
                Details
              </div>
              <div style={{ padding: "12px", backgroundColor: "#f9fafb", borderRadius: "8px", fontSize: "13px", color: "#374151" }}>
                {Object.entries(dynamicFields).map(([key, value]) => (
                  <div key={key} style={{ marginBottom: "4px" }}>
                    <strong>{key}:</strong> {typeof value === "object" ? JSON.stringify(value) : String(value ?? "")}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          <div style={{ marginBottom: "8px", fontSize: "13px", fontWeight: "500", color: "#6b7280" }}>
            Attachments
          </div>
          {attachments.length === 0 ? (
            <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "16px" }}>No attachments</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              {attachments.map((att) => (
                <div
                  key={att.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: "white",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                    <AttachmentPreview
                      att={att}
                      downloadAttachment={downloadAttachment}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: "500", color: "#1f2937" }}>
                        {att.original_name || "Attachment"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                        {att.mime_type ?? "File"}
                        {att.size_bytes != null && ` • ${(att.size_bytes / 1024).toFixed(1)} KB`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {/* <button
                      type="button"
                      onClick={() => handleOpenAttachment(att)}
                      style={{
                        padding: "8px",
                        backgroundColor: "#f3f4f6",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Open / Download"
                    >
                      <ExternalLink size={16} color="#6b7280" />
                    </button> */}
                    <button
                      type="button"
                      onClick={() => handleDownloadAttachment(att)}
                      style={{
                        padding: "8px",
                        backgroundColor: "#f3f4f6",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Download"
                    >
                      <Download size={16} color="#6b7280" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
        }}>
          {isPending ? (
            <>
         
         {session?.user?.permissions?.includes('approve-request-approval-request-staff-management') && (
          <button
            type="button"
            onClick={handleApprove}
            disabled={submitting}
            style={{
              flex: 1,
              padding: '12px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
          >
            <CheckCircle size={18} />
            Approve
          </button>
          )}

          {session?.user?.permissions?.includes('reject-request-approval-request-staff-management') && (
          <button
            type="button"
            onClick={handleReject}
            disabled={submitting}
            style={{
              flex: 1,
              padding: '12px 20px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
          >
            <XCircle size={18} />
            Reject
          </button>
          )}

          {session?.user?.permissions?.includes('request-changes-approval-request-staff-management') && (
          <button
            type="button"
            onClick={handleRequestChanges}
            disabled={submitting}
            style={{
              padding: '12px 12px',
              backgroundColor: 'white',
              color: '#6b7280',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            <Edit3 size={16} />
            Request Changes
          </button>
          )}



            </>
          ) : null}
        </div>

        {/* Comment Section */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ position: 'relative' }}>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, maxCommentLength))}
              placeholder="Add a comment *"
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#1f2937',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
            <div style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              fontSize: '12px',
              color: '#9ca3af'
            }}>
              {comment.length}/{maxCommentLength}
            </div>
          </div>
        </div>

        {/* Pending Approvals Section */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h4 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#1f2937',
              margin: 0
            }}>
              Pending Approvals
            </h4>
            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#6b7280'
              }}
            >
              <MoreVertical size={20} />
            </button>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '12px'
          }}>
            {pendingApprovals.map((approval, index) => (
              <div
                key={index}
                style={{
                  textAlign: 'center',
                  padding: '16px 8px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px'
                }}
              >
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: '#1f2937',
                  marginBottom: '4px'
                }}>
                  {approval.count}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#6b7280',
                  fontWeight: '500'
                }}>
                  {approval.label}
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '4px',
                  marginTop: '8px'
                }}>
                  <Circle 
                    size={8} 
                    fill={approval.color} 
                    color={approval.color}
                  />
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                    {approval.label === 'Aging' ? 'Aging' : approval.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* History Section */}
        <div>
          <h4 style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#1f2937",
            margin: "0 0 16px 0",
          }}>
            History
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                gap: "12px",
                padding: "12px",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
              }}
            >
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0,
              }}>
                {(request.user_id || "U").charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#1f2937",
                  marginBottom: "2px",
                }}>
                  {getDisplayName(request.user_id)}
                  <span style={{ fontWeight: "400", color: "#6b7280", marginLeft: "6px" }}>
                    Submitted
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#9ca3af", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={12} />
                  {formatEventDate(created_at)}
                </div>
              </div>
            </div>
            {events.map((ev) => (
              <div
                key={ev.id}
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "12px",
                  backgroundColor:
                    ev.event_type === "approved" ? "#d1fae5" : ev.event_type === "rejected" ? "#fee2e2" : "#f9fafb",
                  borderRadius: "8px",
                }}
              >
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor:
                    ev.event_type === "approved" ? "#10b981" : ev.event_type === "rejected" ? "#ef4444" : "#6b7280",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "white",
                }}>
                  {ev.event_type === "approved" ? <CheckCircle size={20} /> : ev.event_type === "rejected" ? <XCircle size={20} /> : <Edit3 size={20} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: "500", color: "#1f2937", marginBottom: "2px" }}>
                    {ev.event_type}
                    {ev.comment && (
                      <span style={{ fontWeight: "400", color: "#6b7280", marginLeft: "6px" }}>
                        {ev.comment}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "#9ca3af", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={12} />
                    {formatEventDate(ev.created_at)}
                  </div>
                </div>
              </div>
            ))}
            {!isPending && (
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "12px",
                  backgroundColor: statusDisplay === "approved" ? "#d1fae5" : "#fee2e2",
                  borderRadius: "8px",
                }}
              >
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: statusDisplay === "approved" ? "#10b981" : "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "white",
                }}>
                  {statusDisplay === "approved" ? <CheckCircle size={20} /> : <XCircle size={20} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: "500", color: "#1f2937", marginBottom: "2px" }}>
                    {request.status}
                  </div>
                  {request.approved_at && (
                    <div style={{ fontSize: "12px", color: "#9ca3af", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={12} />
                      {formatEventDate(request.approved_at)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showDialog && dialogConfig ? (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={closeDialog}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  backgroundColor: 
                    dialogConfig.type === 'success' ? '#d1fae5' :
                    dialogConfig.type === 'error' ? '#fee2e2' : '#fef3c7',
                }}
              >
                {dialogConfig.type === 'success' && <CheckCircle size={28} color="#10b981" />}
                {dialogConfig.type === 'error' && <XCircle size={28} color="#ef4444" />}
                {dialogConfig.type === 'warning' && <Edit3 size={28} color="#f59e0b" />}
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: '0 0 8px 0',
                  }}
                >
                  {dialogConfig.title}
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    lineHeight: '1.5',
                    margin: 0,
                  }}
                >
                  {dialogConfig.message}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={closeDialog}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4f46e5')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6366f1')}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ApprovalDetailSidebar;