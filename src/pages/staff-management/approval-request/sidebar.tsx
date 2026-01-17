import React, { useState } from 'react';
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
  ExternalLink
} from 'lucide-react';

interface Request {
  id: string;
  title: string;
  subtitle?: string;
  type: string;
  typeIcon: string;
  requestedBy: string;
  requestedBySubtitle?: string;
  submittedOn: string;
  aging: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  days?: string;
}

interface ApprovalDetailSidebarProps {
  request: Request;
  onClose: () => void;
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

const ApprovalDetailSidebar: React.FC<ApprovalDetailSidebarProps> = ({ request, onClose }) => {
  const [comment, setComment] = useState('');
  const maxCommentLength = 500;
  const [showDialog, setShowDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
    onConfirm?: () => void;
  } | null>(null);

  const pendingApprovals: PendingApproval[] = [
    { count: 5, label: 'Aging', color: '#6b7280' },
    { count: 1, label: '2d', color: '#9ca3af' },
    { count: 0, label: '3-7d', color: '#d1d5db' },
    { count: 0, label: '7d+', color: '#e5e7eb' }
  ];

  const historyItems: HistoryItem[] = [
    {
      id: '1',
      avatar: '👨',
      name: 'Adeel Raza',
      action: 'Submitted',
      timestamp: 'Apr 1, 2024  10:12 AM'
    }
  ];

  const handleApprove = () => {
    if (!comment.trim()) {
      setDialogConfig({
        type: 'warning',
        title: 'Comment Required',
        message: 'Please add a comment before approving this request.',
      });
      setShowDialog(true);
      return;
    }
    // Here you would typically make an API call
    console.log('Approving request:', request.id, 'with comment:', comment);
    setDialogConfig({
      type: 'success',
      title: 'Request Approved',
      message: `The request "${request.title}" has been approved successfully!`,
      onConfirm: () => {
        setComment('');
        setTimeout(() => onClose(), 300);
      }
    });
    setShowDialog(true);
  };

  const handleReject = () => {
    if (!comment.trim()) {
      setDialogConfig({
        type: 'warning',
        title: 'Comment Required',
        message: 'Please add a comment explaining the reason for rejection.',
      });
      setShowDialog(true);
      return;
    }
    // Here you would typically make an API call
    console.log('Rejecting request:', request.id, 'with comment:', comment);
    setDialogConfig({
      type: 'error',
      title: 'Request Rejected',
      message: `The request "${request.title}" has been rejected.`,
      onConfirm: () => {
        setComment('');
        setTimeout(() => onClose(), 300);
      }
    });
    setShowDialog(true);
  };

  const handleRequestChanges = () => {
    if (!comment.trim()) {
      setDialogConfig({
        type: 'warning',
        title: 'Comment Required',
        message: 'Please add a comment explaining what changes are needed.',
      });
      setShowDialog(true);
      return;
    }
    // Here you would typically make an API call
    console.log('Requesting changes for:', request.id, 'with comment:', comment);
    setDialogConfig({
      type: 'warning',
      title: 'Changes Requested',
      message: `Changes have been requested for "${request.title}".`,
      onConfirm: () => {
        setComment('');
        setTimeout(() => onClose(), 300);
      }
    });
    setShowDialog(true);
  };

  const handleDownloadAttachment = () => {
    // Create a mock download for demonstration
    const filename = 'Doc_Note.jpg';
    console.log('Downloading attachment:', filename);
    
    // In a real application, you would fetch the file from your server
    // For now, we'll create a simple text file as demonstration
    const element = document.createElement('a');
    const file = new Blob(['This is a sample document attachment for request: ' + request.title], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    setDialogConfig({
      type: 'success',
      title: 'Download Started',
      message: `Downloading ${filename}...`,
    });
    setShowDialog(true);
  };

  const handleOpenAttachment = () => {
    // Open attachment in new tab
    console.log('Opening attachment in new tab');
    // In a real application, you would have the actual file URL
    window.open('about:blank', '_blank');
    setDialogConfig({
      type: 'success',
      title: 'Opening Document',
      message: 'The document is being opened in a new tab.',
    });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    if (dialogConfig?.onConfirm) {
      dialogConfig.onConfirm();
    }
    setDialogConfig(null);
  };

  const getTypeIcon = (iconType: string) => {
    switch (iconType) {
      case 'leave':
        return <Calendar size={20} color="#3b82f6" />;
      case 'document':
        return <FileText size={20} color="#8b5cf6" />;
      case 'onboarding':
        return <UserPlus size={20} color="#10b981" />;
      case 'profile':
        return <User size={20} color="#6366f1" />;
      default:
        return <File size={20} color="#6b7280" />;
    }
  };

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
        alignItems: 'center'
      }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          color: '#1f2937',
          margin: 0
        }}>
          Approval Detail
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <X size={24} />
        </button>
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
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#1f2937',
                  margin: '0 0 4px 0'
                }}>
                  {request.requestedBy}
                </h3>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#6b7280',
                  margin: '0 0 8px 0'
                }}>
                  {request.requestedBySubtitle || 'Employee'}
                </p>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  fontSize: '13px',
                  color: '#6b7280'
                }}>
                  {getTypeIcon(request.typeIcon)}
                  <span>{request.type}</span>
                </div>
              </div>
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
              fontSize: '15px', 
              fontWeight: '600', 
              color: '#1f2937',
              marginBottom: '8px'
            }}>
              {request.title}
            </div>
            {request.subtitle && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '13px',
                color: '#6b7280'
              }}>
                <Calendar size={14} />
                <span>{request.subtitle}</span>
              </div>
            )}
          </div>

          <div style={{ 
            display: 'flex',
            gap: '12px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#6b7280'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} />
              <span>Submitted: {request.submittedOn}</span>
            </div>
          </div>

          <p style={{ 
            fontSize: '14px', 
            color: '#4b5563',
            lineHeight: '1.6',
            margin: '0 0 16px 0'
          }}>
            This is a {request.type.toLowerCase()} request submitted by {request.requestedBy}.
            {request.days && ` Duration: ${request.days}.`}
          </p>

          {/* Attachment */}
          <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#6b7280' }}>
            Attachments
          </div>
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              transition: 'all 0.2s',
              backgroundColor: 'white'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#dbeafe',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileText size={20} color="#3b82f6" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#1f2937'
                }}>
                  Doc_Note.jpg
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#9ca3af'
                }}>
                  Image • 345 KB
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleOpenAttachment}
                style={{
                  padding: '8px',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                title="Open in new tab"
              >
                <ExternalLink size={16} color="#6b7280" />
              </button>
              <button
                onClick={handleDownloadAttachment}
                style={{
                  padding: '8px',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                title="Download"
              >
                <Download size={16} color="#6b7280" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          marginBottom: '24px'
        }}>
          <button
            onClick={handleApprove}
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
          <button
            onClick={handleReject}
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
          <button
            onClick={handleRequestChanges}
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
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#1f2937',
            margin: '0 0 16px 0'
          }}>
            History
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0
              }}>
                {request.requestedBy.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#1f2937',
                  marginBottom: '2px'
                }}>
                  {request.requestedBy}
                  <span style={{ 
                    fontWeight: '400',
                    color: '#6b7280',
                    marginLeft: '6px'
                  }}>
                    Submitted
                  </span>
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Clock size={12} />
                  {request.submittedOn}
                </div>
              </div>
            </div>
            {request.status !== 'Pending' && (
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: request.status === 'Approved' ? '#d1fae5' : '#fee2e2',
                  borderRadius: '8px'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: request.status === 'Approved' ? '#10b981' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                  color: 'white'
                }}>
                  {request.status === 'Approved' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#1f2937',
                    marginBottom: '2px'
                  }}>
                    System
                    <span style={{ 
                      fontWeight: '400',
                      color: '#6b7280',
                      marginLeft: '6px'
                    }}>
                      {request.status}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Clock size={12} />
                    {request.submittedOn}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showDialog && dialogConfig && (
        <div
          style={{
            position: 'fixed',
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
      )}
    </div>
  );
};

export default ApprovalDetailSidebar;