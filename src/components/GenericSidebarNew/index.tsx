import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  X,
  ChevronDown,
  ChevronRight,
  LucideIcon,
  Mail,
  Phone,
  MoreHorizontal,
  Calendar,
  MessageSquare,
  ClipboardList,
  ExternalLink,
  Copy,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  Sparkles,
  Maximize2,
  Bold,
  Linkedin,
  Italic,
  Underline,
  List,
  Link,
  Image,
  Plus,
  Clock,
  Repeat,
  MessageCircle,
  Search,
} from "lucide-react";
import WhatsAppMessageModal from '@components/WhatsAppMessageModalNew';
import LogSmsModal from '@components/LogSms';
import { Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import { sendEmail, sendSms, sendWhatsApp } from "@utils/communication";
import { useSession } from "next-auth/react";
import { createMeeting, createCrmNote, getCrmNotes, type CrmNoteItem } from "@utils/crm";
import { RECORD_TYPES, ModuleSlug } from "@utils/Helper";
import { ListCallLogs } from "@utils/calls";
import { useCti } from "@hooks/useCti";
import DeviceSelectionModal from "@components/DeviceSelectionModal";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SidebarField {
  label: string;
  value: any;
  icon?: LucideIcon;
  type?:
    | "text"
    | "date"
    | "datetime"
    | "badge"
    | "tags"
    | "link"
    | "email"
    | "phone";
  badgeVariant?: string;
  show?: boolean;
  hasDetails?: boolean;
  onDetailsClick?: () => void;
  copyable?: boolean;
  externalLink?: string;
}

export interface SidebarSection {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: {
    value: string | number;
    variant?: string;
    icon?: LucideIcon;
  };
  fields?: SidebarField[];
  emptyState?: {
    icon?: LucideIcon;
    message: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  customContent?: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  isLoading?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
  count?: number;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

export interface BreezeRecordSummary {
  content: string;
  timestamp: string;
  onRefresh?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  onCopy?: () => void;
  onAskQuestion?: () => void;
}

export interface GenericSidebarProps {
  isOpen: boolean;
  onClose?: () => void;

  // Header Information
  title: string;
  subtitle?: string;
  company?: string;
  avatar?: {
    initials?: string;
    name: string;
    gradient?: string;
    imageUrl?: string;
  };

  // Contact Information
  email?: string;
  phone?: string;

  record?: {
    id: number;
    type: RECORD_TYPES;
  };

  // Quick Actions
  quickActions?: QuickAction[];
  onQuickActionClick?: (actionId: string) => void;

  // Breeze AI Summary
  breezeRecordSummary?: BreezeRecordSummary;

  // Sections
  sections?: SidebarSection[];

  // Additional Props
  width?: string;
  recordLink?: {
    label: string;
    onClick: () => void;
  };
  actionsDropdown?: {
    label: string;
    items: Array<{
      label: string;
      onClick: () => void;
    }>;
  };
  permissionMessage?: string;

  // Context payload for integrations
  contextPayload?: Record<string, unknown>;
  
  recordType?: 'prospect' | 'lead' | 'deal' | 'order';
  recordId?: number;
  
  onNoteCreate?: (note: string, createTask: boolean, taskDueDate?: string) => void;
  
  // Email modal callbacks
  onEmailSend?: (emailData: {
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    body: string;
    attachments?: File[];
  }) => void;

  // Sender info for email
  senderEmail?: string;
  senderName?: string;

  // Task modal callbacks
  onTaskCreate?: (taskData: {
    title: string;
    activityDate: string;
    activityTime: string;
    reminder: string;
    repeat: boolean;
    taskType: string;
    priority: string;
    queue: string;
    assignedTo: string;
    notes: string;
  }) => void;

  onCall?: (phoneNumber: string) => void;
  callerNumber?: string;

  // Meeting modal callbacks
  onMeetingSchedule?: (meetingData: {
    title: string;
    hostType: "user" | "rotation";
    hostEmail: string;
    startDate: string;
    startTime: string;
    endTime: string;
    attendees: string[];
    location: string;
    reminders: string[];
    description: string;
    internalNote: string;
  }) => void;
  /** Lead (ticket) ID for CRM meeting association */
  leadId?: number;
  /** Deal ID for CRM meeting association */
  dealId?: number;
  /** Current user extension for meeting participants (required by CRM meetings API) */
  userExtension?: string;
  
  // WhatsApp message modal callback
  onWhatsAppLog?: (whatsappData: {
    message: string;
    contacts: Array<{ id: string; name: string; email?: string }>;
    activityDate: string;
    createTask: boolean;
    taskDueDate?: string;
    attachments: File[];
  }) => void;
  
  // SMS message modal callback
  onSmsLog?: (smsData: {
    message: string;
    contacts: Array<{ id: string; name: string; email?: string }>;
    activityDate: string;
    createTask: boolean;
    taskDueDate?: string;
    attachments: File[];
  }) => void;
}

// ============================================================================
// CALL MODAL COMPONENT
// ============================================================================

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  phoneNumbers: string[];
  company?: string;
  callerNumber?: string;
  onCall: (phoneNumber: string) => void;
}

const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  contactName,
  phoneNumbers,
  company,
  callerNumber,
  onCall,
}) => {
  if (!isOpen) return null;

  const handleCall = (phoneNumber: string) => {
    onCall(phoneNumber);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: "auto 15vh auto auto",
        top: "275px",
        width: "340px",
        backgroundColor: "#ffffff",
        zIndex: 1000,
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
        borderRadius: "8px",
        border: "1px solid #cbd5e0",
        overflow: "hidden",
        animation: "slideInUp 0.3s ease-out",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#141414",
            margin: 0,
          }}
        >
          {contactName}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f5f8fa";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          title="Close"
        >
          <X size={18} style={{ color: "#141414" }} />
        </button>
      </div>

      {/* Content - one button per phone number */}
      <div style={{ padding: "16px" }}>
        {phoneNumbers.map((phoneNumber, idx) => (
          <button
            key={`call-${idx}-${phoneNumber}`}
            onClick={() => handleCall(phoneNumber)}
            style={{
              width: "100%",
              padding: "10px 12px",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
              fontSize: "14px",
              color: "#141414",
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f7fafc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
            }}
          >
            <Phone size={16} style={{ color: "#718096" }} />
            <div>
              <span style={{ fontWeight: "500" }}>Call {phoneNumber}</span>
              {phoneNumbers.length > 1 && (
                <span
                  style={{ color: "#718096", fontSize: "13px", marginLeft: "4px" }}
                >
                  (Phone {idx + 1})
                </span>
              )}
            </div>
          </button>
        ))}

        {/* Company Name */}
        {company && (
          <div style={{ marginBottom: "12px" }}>
            <p
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "#141414",
                margin: 0,
              }}
            >
              {company}
            </p>
          </div>
        )}

        {/* Call From Section */}
        {callerNumber && (
          <div
            style={{
              paddingTop: "12px",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <button
              style={{
                width: "100%",
                padding: "8px 0",
                backgroundColor: "transparent",
                border: "none",
                fontSize: "13px",
                color: "#141414",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>Call from: {callerNumber}</span>
              <ChevronRight size={16} style={{ color: "#718096" }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// NOTES MODAL COMPONENT
// ============================================================================

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordName: string;
  onSave: (note: string, createTask: boolean, taskDueDate?: string) => void;
}

const NotesModal: React.FC<NotesModalProps> = ({
  isOpen,
  onClose,
  recordName,
  onSave,
}) => {
  const [noteText, setNoteText] = useState("");
  const [createTask, setCreateTask] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Auto-save draft simulation
  useEffect(() => {
    if (noteText.trim()) {
      const timer = setTimeout(() => {
        setIsDraftSaved(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [noteText]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(
      noteText,
      createTask,
      createTask ? "In 3 business days (Friday)" : undefined,
    );
    setNoteText("");
    setCreateTask(false);
    setIsDraftSaved(false);
    setIsMaximized(false);
    setAttachments([]);
    onClose();
  };

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  // Text formatting functions with toggle support
  const toggleFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = noteText.substring(start, end);

    if (selectedText) {
      // Check if text is already formatted
      const beforeText = noteText.substring(
        Math.max(0, start - prefix.length),
        start,
      );
      const afterText = noteText.substring(end, end + suffix.length);

      if (beforeText === prefix && afterText === suffix) {
        // Remove formatting
        const newText =
          noteText.substring(0, start - prefix.length) +
          selectedText +
          noteText.substring(end + suffix.length);
        setNoteText(newText);

        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(
            start - prefix.length,
            end - prefix.length,
          );
        }, 0);
      } else {
        // Add formatting
        const newText =
          noteText.substring(0, start) +
          prefix +
          selectedText +
          suffix +
          noteText.substring(end);
        setNoteText(newText);

        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(
            start + prefix.length,
            end + prefix.length,
          );
        }, 0);
      }
    } else {
      // No selection, insert at cursor with placeholder
      const placeholder = "text";
      const newText =
        noteText.substring(0, start) +
        prefix +
        placeholder +
        suffix +
        noteText.substring(end);
      setNoteText(newText);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length + placeholder.length,
        );
      }, 0);
    }
  };

  const insertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newText =
      noteText.substring(0, start) + text + noteText.substring(end);
    setNoteText(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleBold = () => {
    toggleFormatting("**");
  };

  const handleItalic = () => {
    toggleFormatting("*");
  };

  const handleUnderline = () => {
    toggleFormatting("__");
  };

  const handleLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = noteText.substring(start, end);

    const linkText = selectedText || "link text";
    const linkUrl = "https://";
    const markdown = `[${linkText}](${linkUrl})`;

    const newText =
      noteText.substring(0, start) + markdown + noteText.substring(end);
    setNoteText(newText);

    setTimeout(() => {
      textarea.focus();
      const urlStart = start + linkText.length + 3;
      textarea.setSelectionRange(urlStart, urlStart + linkUrl.length);
    }, 0);
  };

  const handleList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lines = noteText.substring(0, start).split("\n");
    const isAtLineStart = lines[lines.length - 1].trim() === "";

    if (isAtLineStart) {
      insertText("- ");
    } else {
      insertText("\n- ");
    }
  };

  const handleCode = () => {
    toggleFormatting("`");
  };

  const handleImage = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = noteText.substring(start, end);

    const altText = selectedText || "image description";
    const imageUrl = "https://";
    const markdown = `![${altText}](${imageUrl})`;

    const newText =
      noteText.substring(0, start) + markdown + noteText.substring(end);
    setNoteText(newText);

    setTimeout(() => {
      textarea.focus();
      const urlStart = start + altText.length + 4;
      textarea.setSelectionRange(urlStart, urlStart + imageUrl.length);
    }, 0);
  };

  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Keyboard shortcuts handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          handleBold();
          break;
        case "i":
          e.preventDefault();
          handleItalic();
          break;
        case "u":
          e.preventDefault();
          handleUnderline();
          break;
        case "k":
          e.preventDefault();
          handleLink();
          break;
      }
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: isMaximized ? "60px 20px 20px 20px" : "auto 15vh 0.5vh auto",
        height: isMaximized ? "auto" : "512px",
        width: isMaximized ? "auto" : "650px",
        backgroundColor: "#ffffff",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
        borderRadius: "8px",
        border: "1px solid #cbd5e0",
        overflow: "hidden",
        animation: "slideInUp 0.3s ease-out",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              color: "#141414",
              padding: "4px",
            }}
          >
            <ChevronDown size={20} style={{ transform: "rotate(90deg)" }} />
          </button>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#141414",
              margin: 0,
            }}
          >
            Note
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={handleMaximize}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              color: "#141414",
            }}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            <Maximize2 size={18} />
          </button>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              color: "#141414",
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Record Label */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{ fontSize: "13px", color: "#141414", fontWeight: "400" }}
          >
            For
          </span>
          <span
            style={{
              padding: "4px 12px",
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e0",
              borderRadius: "16px",
              fontSize: "13px",
              color: "#141414",
              fontWeight: "500",
            }}
          >
            {recordName}
          </span>
        </div>
      </div>

      {/* Note Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "20px", flex: 1 }}>
          <textarea
            ref={textareaRef}
            placeholder="Start typing to leave a note..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: "100%",
              height: isMaximized ? "400px" : "120px",
              border: "none",
              outline: "none",
              fontSize: "14px",
              color: "#141414",
              fontFamily: "inherit",
              resize: "none",
              lineHeight: "1.5",
            }}
          />
        </div>

        {/* Formatting Toolbar */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #e2e8f0",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <button
            onClick={handleBold}
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Bold (Ctrl+B)"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Bold size={16} />
          </button>
          <button
            onClick={handleItalic}
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Italic (Ctrl+I)"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Italic size={16} />
          </button>
          <button
            onClick={handleUnderline}
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Underline (Ctrl+U)"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Underline size={16} />
          </button>
          <div
            style={{
              width: "1px",
              height: "20px",
              backgroundColor: "#cbd5e0",
              margin: "0 4px",
            }}
          />
          <button
            style={{
              background: "transparent",
              border: "none",
              padding: "6px 10px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
              fontSize: "13px",
              fontWeight: "500",
              gap: "4px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            More
            <ChevronDown size={14} />
          </button>
          <button
            onClick={handleLink}
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Link (Ctrl+K)"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Link size={16} />
          </button>
          <button
            onClick={handleImage}
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Insert Image"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Image size={16} aria-label="Insert Image" />
          </button>
          <button
            onClick={handleCode}
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Code"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <MessageSquare size={16} />
          </button>
          <button
            onClick={handleList}
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Bullet List"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <List size={16} />
          </button>
          <button
            onClick={handleAttachment}
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Attach File"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Paperclip size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <button
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="More options"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid #e2e8f0" }}>
            <div
              style={{
                fontSize: "13px",
                color: "#666",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Attachments ({attachments.length})
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              {attachments.map((file, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    backgroundColor: "#f5f8fa",
                    borderRadius: "4px",
                    fontSize: "13px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flex: 1,
                      overflow: "hidden",
                    }}
                  >
                    <Paperclip size={14} style={{ flexShrink: 0 }} />
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {file.name}
                    </span>
                    <span
                      style={{ color: "#666", fontSize: "12px", flexShrink: 0 }}
                    >
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => removeAttachment(index)}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: "4px",
                      cursor: "pointer",
                      color: "#718096",
                      display: "flex",
                      alignItems: "center",
                    }}
                    title="Remove"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#f44336")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#718096")
                    }
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Associated Records */}
        <div
          style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}
        >
          <button
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: "600",
              color: "#141414",
            }}
          >
            Associated with 1 record
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Task Creation Option */}
        <div style={{ padding: "16px 20px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontSize: "13px",
              color: "#141414",
            }}
          >
            <input
              type="checkbox"
              checked={createTask}
              onChange={(e) => setCreateTask(e.target.checked)}
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer",
              }}
            />
            <span>
              Create a <strong>To-do</strong> task to follow up{" "}
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#141414",
                  textDecoration: "underline",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                In 3 business days (Friday)
              </button>
              <ChevronDown size={14} style={{ marginLeft: "4px" }} />
            </span>
          </label>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isDraftSaved && (
            <>
              <span
                style={{
                  fontSize: "13px",
                  color: "#0c9960",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M13.5 4.5L6 12L2.5 8.5"
                    stroke="#0c9960"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Draft saved
              </span>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  color: "#cbd5e0",
                }}
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={!noteText.trim()}
          style={{
            padding: "8px 20px",
            backgroundColor: noteText.trim() ? "#141414" : "#cbd5e0",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: noteText.trim() ? "pointer" : "not-allowed",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            if (noteText.trim()) {
              e.currentTarget.style.backgroundColor = "#ff6347";
            }
          }}
          onMouseLeave={(e) => {
            if (noteText.trim()) {
              e.currentTarget.style.backgroundColor = "#141414";
            }
          }}
        >
          Create note
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// EMAIL MODAL COMPONENT
// ============================================================================
interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Single email, comma-separated string, or array of emails */
  recipientEmail?: string | string[];
  recipientName?: string;
  senderEmail?: string;
  senderName?: string;
  onSend: (emailData: {
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    body: string;
    createTask: boolean;
    taskDueDate?: string;
    attachments?: File[];
  }) => void | Promise<void>;
  record?: {
    id: number;
    type: RECORD_TYPES;
  };
}

const normalizeRecipientEmails = (v?: string | string[]): string[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((e) => e.trim()).filter(Boolean);
  return v
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
};

const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  recipientEmail,
  recipientName,
  senderEmail = "user@example.com",
  senderName = "Your Name",
  onSend,
}) => {
  const initialTo = normalizeRecipientEmails(recipientEmail);
  const [toEmails, setToEmails] = useState<string[]>(initialTo);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [bccEmails, setBccEmails] = useState<string[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentToInput, setCurrentToInput] = useState("");
  const [currentCcInput, setCurrentCcInput] = useState("");
  const [currentBccInput, setCurrentBccInput] = useState("");
  const [activeTab, setActiveTab] = useState<
    "templates" | "sequences" | "documents" | "meetings" | "quotes"
  >("templates");
  const [createTask, setCreateTask] = useState(false);
  const [showSendDropdown, setShowSendDropdown] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const emailBodyRef = useRef<HTMLTextAreaElement>(null);
  const sendDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const next = normalizeRecipientEmails(recipientEmail);
    if (next.length > 0) {
      setToEmails((prev) =>
        next.some((e) => !prev.includes(e)) ? next : prev,
      );
    }
  }, [recipientEmail]);

  useEffect(() => {
    if (isOpen) {
      const next = normalizeRecipientEmails(recipientEmail);
      if (next.length > 0) setToEmails(next);
      if (emailBodyRef.current) emailBodyRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sendDropdownRef.current &&
        !sendDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSendDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const addEmail = (email: string, type: "to" | "cc" | "bcc") => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      alert("Please enter a valid email address");
      return;
    }

    if (type === "to") {
      if (!toEmails.includes(trimmedEmail)) {
        setToEmails([...toEmails, trimmedEmail]);
      }
      setCurrentToInput("");
    } else if (type === "cc") {
      if (!ccEmails.includes(trimmedEmail)) {
        setCcEmails([...ccEmails, trimmedEmail]);
      }
      setCurrentCcInput("");
    } else if (type === "bcc") {
      if (!bccEmails.includes(trimmedEmail)) {
        setBccEmails([...bccEmails, trimmedEmail]);
      }
      setCurrentBccInput("");
    }
  };

  const removeEmail = (email: string, type: "to" | "cc" | "bcc") => {
    if (type === "to") {
      setToEmails(toEmails.filter((e) => e !== email));
    } else if (type === "cc") {
      setCcEmails(ccEmails.filter((e) => e !== email));
    } else if (type === "bcc") {
      setBccEmails(bccEmails.filter((e) => e !== email));
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: "to" | "cc" | "bcc",
  ) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      const value =
        type === "to"
          ? currentToInput
          : type === "cc"
            ? currentCcInput
            : currentBccInput;
      addEmail(value, type);
    }
  };

  const handleSend = async () => {
    if (toEmails.length === 0) {
      alert("Please add at least one recipient");
      return;
    }

    if (!subject.trim()) {
      const confirmSend = window.confirm("Send email without a subject?");
      if (!confirmSend) return;
    }
    setSendLoading(true);
    try {
      await onSend({
        to: toEmails,
        cc: ccEmails,
        bcc: bccEmails,
        subject,
        body: emailBody,
        createTask,
        taskDueDate: createTask ? "In 3 business days (Friday)" : undefined,
      });
      setToEmails([]);
      setCcEmails([]);
      setBccEmails([]);
      setSubject("");
      setEmailBody("");
      setShowCc(false);
      setShowBcc(false);
      setCreateTask(false);
      setIsMaximized(false);
      onClose();
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: isMaximized ? "60px 20px 20px 20px" : "auto 15vh 7.5vh auto",
        height: isMaximized ? "auto" : "550px",
        width: isMaximized ? "auto" : "650px",
        backgroundColor: "#ffffff",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
        borderRadius: "8px",
        border: "1px solid #cbd5e0",
        overflow: "hidden",
        animation: "slideInUp 0.3s ease-out",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              color: "#141414",
              padding: "4px",
            }}
          >
            <ChevronDown size={20} style={{ transform: "rotate(90deg)" }} />
          </button>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#141414",
              margin: 0,
            }}
          >
            Email
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={handleMaximize}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              color: "#141414",
            }}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            <Maximize2 size={18} />
          </button>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              color: "#141414",
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          padding: "12px 20px",
          borderBottom: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
        }}
      >
        {["Templates", "Sequences", "Documents", "Meetings", "Quotes"].map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase() as any)}
              style={{
                background: "transparent",
                border: "none",
                padding: "4px 0",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: activeTab === tab.toLowerCase() ? "600" : "400",
                color: "#141414",
                borderBottom:
                  activeTab === tab.toLowerCase()
                    ? "2px solid #ff7a59"
                    : "2px solid transparent",
                transition: "all 0.2s",
              }}
            >
              {tab}
            </button>
          ),
        )}
      </div>

      {/* Email Form */}
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#ffffff" }}>
        {/* To Field */}
        <div
          style={{ padding: "12px 20px", borderBottom: "1px solid #e2e8f0" }}
        >
          <div
            style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}
          >
            <label
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#141414",
                minWidth: "60px",
                paddingTop: "8px",
              }}
            >
              To
            </label>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                alignItems: "center",
              }}
            >
              {toEmails.map((email) => (
                <span
                  key={email}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    backgroundColor: "#f7fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    fontSize: "13px",
                    color: "#141414",
                  }}
                >
                  {email}
                  <button
                    onClick={() => removeEmail(email, "to")}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "0",
                      display: "flex",
                      alignItems: "center",
                      color: "#718096",
                    }}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              <input
                type="email"
                value={currentToInput}
                onChange={(e) => setCurrentToInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, "to")}
                onBlur={() => currentToInput && addEmail(currentToInput, "to")}
                placeholder={toEmails.length === 0 ? "Enter email address" : ""}
                style={{
                  flex: 1,
                  minWidth: "200px",
                  border: "none",
                  outline: "none",
                  fontSize: "14px",
                  color: "#141414",
                  padding: "6px 0",
                }}
              />
            </div>
          </div>
        </div>

        {/* From Field */}
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "12px" }}
          ></div>
          <div style={{ display: "flex", gap: "12px" }}>
            {!showCc && (
              <button
                onClick={() => setShowCc(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "#0091ae",
                  textDecoration: "underline",
                  padding: "0",
                }}
              >
                Cc
              </button>
            )}
            {!showBcc && (
              <button
                onClick={() => setShowBcc(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "#0091ae",
                  textDecoration: "underline",
                  padding: "0",
                }}
              >
                Bcc
              </button>
            )}
          </div>
        </div>

        {/* CC Field */}
        {showCc && (
          <div
            style={{ padding: "12px 20px", borderBottom: "1px solid #e2e8f0" }}
          >
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}
            >
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#141414",
                  minWidth: "60px",
                  paddingTop: "8px",
                }}
              >
                Cc
              </label>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  alignItems: "center",
                }}
              >
                {ccEmails.map((email) => (
                  <span
                    key={email}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      backgroundColor: "#f7fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      fontSize: "13px",
                      color: "#141414",
                    }}
                  >
                    {email}
                    <button
                      onClick={() => removeEmail(email, "cc")}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "0",
                        display: "flex",
                        alignItems: "center",
                        color: "#718096",
                      }}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                <input
                  type="email"
                  value={currentCcInput}
                  onChange={(e) => setCurrentCcInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "cc")}
                  onBlur={() =>
                    currentCcInput && addEmail(currentCcInput, "cc")
                  }
                  placeholder="Enter email address"
                  style={{
                    flex: 1,
                    minWidth: "200px",
                    border: "none",
                    outline: "none",
                    fontSize: "14px",
                    color: "#141414",
                    padding: "6px 0",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* BCC Field */}
        {showBcc && (
          <div
            style={{ padding: "12px 20px", borderBottom: "1px solid #e2e8f0" }}
          >
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}
            >
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#141414",
                  minWidth: "60px",
                  paddingTop: "8px",
                }}
              >
                Bcc
              </label>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  alignItems: "center",
                }}
              >
                {bccEmails.map((email) => (
                  <span
                    key={email}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      backgroundColor: "#f7fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      fontSize: "13px",
                      color: "#141414",
                    }}
                  >
                    {email}
                    <button
                      onClick={() => removeEmail(email, "bcc")}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "0",
                        display: "flex",
                        alignItems: "center",
                        color: "#718096",
                      }}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                <input
                  type="email"
                  value={currentBccInput}
                  onChange={(e) => setCurrentBccInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "bcc")}
                  onBlur={() =>
                    currentBccInput && addEmail(currentBccInput, "bcc")
                  }
                  placeholder="Enter email address"
                  style={{
                    flex: 1,
                    minWidth: "200px",
                    border: "none",
                    outline: "none",
                    fontSize: "14px",
                    color: "#141414",
                    padding: "6px 0",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Subject Field */}
        <div
          style={{ padding: "12px 20px", borderBottom: "1px solid #e2e8f0" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <label
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#141414",
                minWidth: "60px",
              }}
            >
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder=""
              style={{
                flex: 1,
                border: "none",
                fontSize: "14px",
                color: "#141414",
                padding: "8px 12px",
                borderRadius: "3px",
              }}
            />
          </div>
        </div>

        {/* Email Body */}
        <div style={{ padding: "20px" }}>
          <textarea
            ref={emailBodyRef}
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            placeholder="Type your email message here..."
            style={{
              width: "100%",
              height: isMaximized ? "400px" : "200px",
              border: "none",
              outline: "none",
              fontSize: "14px",
              color: "#141414",
              fontFamily: "inherit",
              resize: "none",
              lineHeight: "1.6",
            }}
          />
        </div>
      </div>

      {/* Formatting Toolbar and Associated Records */}
      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid #e2e8f0",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
              fontSize: "14px",
              fontWeight: "600",
            }}
            title="Bold"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            B
          </button>
          <button
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
              fontSize: "14px",
              fontWeight: "600",
              fontStyle: "italic",
            }}
            title="Italic"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            I
          </button>
          <button
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
              fontSize: "14px",
              fontWeight: "600",
              textDecoration: "underline",
            }}
            title="Underline"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            U
          </button>
          <button
            style={{
              background: "transparent",
              border: "none",
              padding: "6px 10px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
              fontSize: "13px",
              fontWeight: "500",
              gap: "4px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            More
            <ChevronDown size={14} />
          </button>
          <button
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Link"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Link size={16} />
          </button>
          <button
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Image"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Image size={16} aria-label="Insert Image" />
          </button>
          <button
            style={{
              background: "transparent",
              border: "none",
              padding: "6px 10px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
              fontSize: "13px",
              fontWeight: "500",
              gap: "4px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            Insert
            <ChevronDown size={14} />
          </button>
          <button
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Attach file"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Paperclip size={16} />
          </button>
        </div>
        <button
          style={{
            background: "transparent",
            border: "none",
            padding: "6px 10px",
            cursor: "pointer",
            color: "#141414",
            display: "flex",
            alignItems: "center",
            borderRadius: "3px",
            fontSize: "13px",
            fontWeight: "500",
            gap: "4px",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#f5f8fa")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          Associated with 1 record
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Footer - Task Creation and Send */}
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ position: "relative" }} ref={sendDropdownRef}>
            <div style={{ display: "flex", alignItems: "stretch" }}>
              <button
                onClick={handleSend}
                disabled={toEmails.length === 0 || sendLoading}
                style={{
                  padding: "8px 16px",
                  paddingRight: "12px",
                  backgroundColor:
                    toEmails.length > 0 && !sendLoading ? "#cbd5e0" : "#e2e8f0",
                  color: "#141414",
                  border: "none",
                  borderRadius: "4px 0 0 4px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor:
                    toEmails.length > 0 && !sendLoading
                      ? "pointer"
                      : "not-allowed",
                  transition: "background-color 0.2s",
                  borderRight: "1px solid #a0aec0",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                onMouseEnter={(e) => {
                  if (toEmails.length > 0 && !sendLoading) {
                    e.currentTarget.style.backgroundColor = "#b8c5d0";
                  }
                }}
                onMouseLeave={(e) => {
                  if (toEmails.length > 0 && !sendLoading) {
                    e.currentTarget.style.backgroundColor = "#cbd5e0";
                  }
                }}
              >
                {sendLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                      style={{
                        width: "14px",
                        height: "14px",
                        borderWidth: "2px",
                      }}
                    />
                    Sending...
                  </>
                ) : (
                  "Send"
                )}
              </button>
              <button
                onClick={() => setShowSendDropdown(!showSendDropdown)}
                disabled={toEmails.length === 0 || sendLoading}
                style={{
                  padding: "8px 8px",
                  backgroundColor:
                    toEmails.length > 0 && !sendLoading ? "#cbd5e0" : "#e2e8f0",
                  color: "#141414",
                  border: "none",
                  borderRadius: "0 4px 4px 0",
                  fontSize: "14px",
                  cursor:
                    toEmails.length > 0 && !sendLoading
                      ? "pointer"
                      : "not-allowed",
                  transition: "background-color 0.2s",
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => {
                  if (toEmails.length > 0 && !sendLoading) {
                    e.currentTarget.style.backgroundColor = "#b8c5d0";
                  }
                }}
                onMouseLeave={(e) => {
                  if (toEmails.length > 0 && !sendLoading) {
                    e.currentTarget.style.backgroundColor = "#cbd5e0";
                  }
                }}
              >
                <ChevronDown size={16} />
              </button>
            </div>
            {showSendDropdown && (
              <div
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: 0,
                  marginBottom: "4px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "5px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  minWidth: "180px",
                  zIndex: 1000,
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => {
                    handleSend();
                    setShowSendDropdown(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    backgroundColor: "transparent",
                    border: "none",
                    textAlign: "left",
                    fontSize: "14px",
                    color: "#33475b",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f7fafc";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Send now
                </button>
                <button
                  onClick={() => {
                    console.log("Schedule send");
                    setShowSendDropdown(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    backgroundColor: "transparent",
                    border: "none",
                    textAlign: "left",
                    fontSize: "14px",
                    color: "#33475b",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f7fafc";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Schedule send
                </button>
              </div>
            )}
          </div>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            fontSize: "13px",
            color: "#141414",
          }}
        >
          <input
            type="checkbox"
            checked={createTask}
            onChange={(e) => setCreateTask(e.target.checked)}
            style={{
              width: "16px",
              height: "16px",
              cursor: "pointer",
            }}
          />
          <span>
            Create a <strong>To-do</strong> task to follow up{" "}
            <button
              style={{
                background: "transparent",
                border: "none",
                color: "#141414",
                textDecoration: "underline",
                cursor: "pointer",
                padding: 0,
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              In 3 business days (Friday)
            </button>
            <ChevronDown
              size={14}
              style={{ marginLeft: "4px", verticalAlign: "middle" }}
            />
          </span>
        </label>
      </div>
    </div>
  );
};

// ============================================================================
// MORE ACTIONS MODAL COMPONENT
// Add this after CallModal component
// ============================================================================

interface MoreActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  onActionSelect: (actionId: string) => void;
}

const MoreActionsModal: React.FC<MoreActionsModalProps> = ({
  isOpen,
  onClose,
  position,
  onActionSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: "enroll-sequence",
      icon: Repeat,
      label: "Enroll in a sequence",
      hasSubmenu: false,
    },
    {
      id: "engage-linkedin",
      icon: Linkedin,
      label: "Engage on LinkedIn",
      hasSubmenu: true,
      highlighted: "LinkedIn",
    },
    {
      id: "log-sms",
      icon: MessageSquare,
      label: "Log SMS",
      hasSubmenu: false,
    },
    {
      id: "log-linkedin",
      icon: Linkedin,
      label: "Log a LinkedIn message",
      hasSubmenu: false,
      highlighted: "LinkedIn",
    },
    {
      id: "log-whatsapp",
      icon: MessageCircle,
      label: "Log a WhatsApp message",
      hasSubmenu: false,
      highlighted: "WhatsApp",
    },
    {
      id: "log-call",
      icon: Phone,
      label: "Log a call",
      hasSubmenu: false,
    },
  ];

  const filteredActions = actions.filter((action) =>
    action.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleActionClick = (actionId: string) => {
    onActionSelect(actionId);
    onClose();
  };

  const highlightText = (text: string, highlight?: string) => {
    if (!highlight) return text;

    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={index} style={{ color: "#0073b1" }}>
              {part}
            </span>
          ) : (
            part
          ),
        )}
      </>
    );
  };

  return (
    <div
      ref={modalRef}
      style={{
        position: "fixed",
        top: `${position.top}px`,
        right: "0px",
        width: "280px",
        backgroundColor: "#ffffff",
        border: "1px solid #cbd5e0",
        borderRadius: "8px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
        zIndex: 1001,
        overflow: "hidden",
        animation: "fadeIn 0.15s ease-out",
      }}
    >
      {/* Search Bar */}
      <div
        style={{
          padding: "12px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              border: "1px solid #cbd5e0",
              borderRadius: "20px",
              fontSize: "14px",
              color: "#141414",
              outline: "none",
              backgroundColor: "#ffffff",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#0091ae";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#cbd5e0";
            }}
          />
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#718096",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      {/* Actions List */}
      <div
        style={{
          maxHeight: "320px",
          overflowY: "auto",
        }}
      >
        {filteredActions.length === 0 ? (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              color: "#718096",
              fontSize: "14px",
            }}
          >
            No actions found
          </div>
        ) : (
          filteredActions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f7fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flex: 1,
                  }}
                >
                  <ActionIcon
                    size={18}
                    style={{ color: "#718096", flexShrink: 0 }}
                  />
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#141414",
                      fontWeight: "400",
                    }}
                  >
                    {highlightText(action.label, action.highlighted)}
                  </span>
                </div>
                {action.hasSubmenu && (
                  <ChevronRight size={16} style={{ color: "#718096" }} />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid #e2e8f0",
          backgroundColor: "#fafafa",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            color: "#141414",
            fontWeight: "600",
            marginBottom: "4px",
          }}
        >
          Reorder activity buttons
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TASK MODAL COMPONENT
// ============================================================================

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignedTo?: string;
  assignedToName?: string;
  onSave: (taskData: {
    title: string;
    activityDate: string;
    activityTime: string;
    reminder: string;
    repeat: boolean;
    taskType: string;
    priority: string;
    queue: string;
    assignedTo: string;
    notes: string;
  }) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  assignedTo = "",
  assignedToName = "Unassigned",
  onSave,
}) => {
  const [title, setTitle] = useState("");
  const [activityDate, setActivityDate] = useState(
    "In 3 business days (Friday)",
  );
  const [activityTime, setActivityTime] = useState("08:00");
  const [reminder, setReminder] = useState("No reminder");
  const [repeat, setRepeat] = useState(false);
  const [taskType, setTaskType] = useState("To-do");
  const [priority, setPriority] = useState("None");
  const [queue, setQueue] = useState("None");
  const [assignedToState, setAssignedToState] = useState(assignedToName);
  const [notes, setNotes] = useState("");
  const [isMaximized, setIsMaximized] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [showTaskTypeDropdown, setShowTaskTypeDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showQueueDropdown, setShowQueueDropdown] = useState(false);
  const [showAssignedToDropdown, setShowAssignedToDropdown] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Text formatting functions with toggle support
  const toggleFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = notesRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = notes.substring(start, end);

    if (selectedText) {
      // Check if text is already formatted
      const beforeText = notes.substring(
        Math.max(0, start - prefix.length),
        start,
      );
      const afterText = notes.substring(end, end + suffix.length);

      if (beforeText === prefix && afterText === suffix) {
        // Remove formatting
        const newText =
          notes.substring(0, start - prefix.length) +
          selectedText +
          notes.substring(end + suffix.length);
        setNotes(newText);

        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(
            start - prefix.length,
            end - prefix.length,
          );
        }, 0);
      } else {
        // Add formatting
        const newText =
          notes.substring(0, start) +
          prefix +
          selectedText +
          suffix +
          notes.substring(end);
        setNotes(newText);

        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(
            start + prefix.length,
            end + prefix.length,
          );
        }, 0);
      }
    } else {
      // No selection, insert at cursor with placeholder
      const placeholder = "text";
      const newText =
        notes.substring(0, start) +
        prefix +
        placeholder +
        suffix +
        notes.substring(end);
      setNotes(newText);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length + placeholder.length,
        );
      }, 0);
    }
  };

  const insertText = (text: string) => {
    const textarea = notesRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newText = notes.substring(0, start) + text + notes.substring(end);
    setNotes(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleBold = () => {
    toggleFormatting("**");
  };

  const handleItalic = () => {
    toggleFormatting("*");
  };

  const handleUnderline = () => {
    toggleFormatting("__");
  };

  const handleLink = () => {
    const textarea = notesRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = notes.substring(start, end);

    const linkText = selectedText || "link text";
    const linkUrl = "https://";
    const markdown = `[${linkText}](${linkUrl})`;

    const newText = notes.substring(0, start) + markdown + notes.substring(end);
    setNotes(newText);

    setTimeout(() => {
      textarea.focus();
      const urlStart = start + linkText.length + 3;
      textarea.setSelectionRange(urlStart, urlStart + linkUrl.length);
    }, 0);
  };

  const handleList = () => {
    const textarea = notesRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lines = notes.substring(0, start).split("\n");
    const isAtLineStart = lines[lines.length - 1].trim() === "";

    if (isAtLineStart) {
      insertText("- ");
    } else {
      insertText("\n- ");
    }
  };

  const handleCode = () => {
    toggleFormatting("`");
  };

  const handleImage = () => {
    const textarea = notesRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = notes.substring(start, end);

    const altText = selectedText || "image description";
    const imageUrl = "https://";
    const markdown = `![${altText}](${imageUrl})`;

    const newText = notes.substring(0, start) + markdown + notes.substring(end);
    setNotes(newText);

    setTimeout(() => {
      textarea.focus();
      const urlStart = start + altText.length + 4;
      textarea.setSelectionRange(urlStart, urlStart + imageUrl.length);
    }, 0);
  };

  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Keyboard shortcuts handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          handleBold();
          break;
        case "i":
          e.preventDefault();
          handleItalic();
          break;
        case "u":
          e.preventDefault();
          handleUnderline();
          break;
        case "k":
          e.preventDefault();
          handleLink();
          break;
      }
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert("Please enter a task title");
      return;
    }

    onSave({
      title,
      activityDate,
      activityTime,
      reminder,
      repeat,
      taskType,
      priority,
      queue,
      assignedTo: assignedToState,
      notes,
    });

    // Reset form
    setTitle("");
    setActivityDate("In 3 business days (Friday)");
    setActivityTime("08:00");
    setReminder("No reminder");
    setRepeat(false);
    setTaskType("To-do");
    setPriority("None");
    setQueue("None");
    setNotes("");
    setAttachments([]);
    setIsMaximized(false);
    onClose();
  };

  const taskTypes = ["To-do", "Call", "Email", "Meeting"];
  const priorities = ["None", "Low", "Medium", "High"];
  const queues = ["None", "Sales Queue", "Support Queue", "Marketing Queue"];
  const dateOptions = [
    "Today",
    "Tomorrow",
    "In 3 business days (Friday)",
    "In 1 week",
    "In 2 weeks",
    "In 1 month",
    "Custom...",
  ];
  const reminderOptions = [
    "No reminder",
    "At time of task",
    "5 minutes before",
    "15 minutes before",
    "30 minutes before",
    "1 hour before",
    "1 day before",
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: isMaximized ? "60px 20px 20px 20px" : "auto 15vh 7.5vh auto",
        height: isMaximized ? "auto" : "650px",
        width: isMaximized ? "auto" : "650px",
        backgroundColor: "#ffffff",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
        borderRadius: "8px",
        border: "1px solid #cbd5e0",
        overflow: "hidden",
        animation: "slideInUp 0.3s ease-out",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              color: "#141414",
              padding: "4px",
            }}
          >
            <ChevronDown size={20} style={{ transform: "rotate(90deg)" }} />
          </button>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#141414",
              margin: 0,
            }}
          >
            Task
          </h2>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "6px",
            color: "#141414",
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Task Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          backgroundColor: "#ffffff",
          padding: "20px",
        }}
      >
        {/* Task Title Input */}
        <div style={{ marginBottom: "20px" }}>
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your task"
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontSize: "14px",
              color: "#141414",
              padding: "12px 16px",
              borderRadius: "4px",
            }}
          />
        </div>

        {/* Activity Date and Reminder Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          {/* Activity Date */}
          <div>
            <label
              style={{
                fontSize: "13px",
                color: "#141414",
                fontWeight: "400",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Activity date
            </label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                style={{
                  padding: "8px 2px",
                  backgroundColor: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#141414",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {activityDate}
              </button>
              <button
                onClick={() => setShowTimePicker(!showTimePicker)}
                style={{
                  padding: "8px 2px",
                  backgroundColor: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                  color: "#141414",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: "300",
                }}
              >
                <Clock size={16} />
                {activityTime}
              </button>
            </div>

            {/* Date Picker Dropdown */}
            {showDatePicker && (
              <div
                style={{
                  position: "absolute",
                  marginTop: "4px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "5px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  minWidth: "200px",
                  zIndex: 1001,
                  overflow: "hidden",
                }}
              >
                {dateOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setActivityDate(option);
                      setShowDatePicker(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      backgroundColor: "transparent",
                      border: "none",
                      textAlign: "left",
                      fontSize: "14px",
                      color: "#33475b",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f7fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Send Reminder */}
          <div>
            <label
              style={{
                fontSize: "13px",
                color: "#141414",
                fontWeight: "400",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Send reminder
            </label>
            <button
              onClick={() => setShowReminderPicker(!showReminderPicker)}
              style={{
                width: "100%",
                padding: "8px 3px",
                backgroundColor: "#ffffff",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#141414",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {reminder}
            </button>

            {/* Reminder Picker Dropdown */}
            {showReminderPicker && (
              <div
                style={{
                  position: "absolute",
                  marginTop: "4px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "5px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  minWidth: "200px",
                  zIndex: 1001,
                  overflow: "hidden",
                }}
              >
                {reminderOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setReminder(option);
                      setShowReminderPicker(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      backgroundColor: "transparent",
                      border: "none",
                      textAlign: "left",
                      fontSize: "14px",
                      color: "#33475b",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f7fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Set to Repeat Checkbox */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontSize: "14px",
              color: "#141414",
            }}
          >
            <input
              type="checkbox"
              checked={repeat}
              onChange={(e) => setRepeat(e.target.checked)}
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer",
              }}
            />
            Set to repeat
          </label>
        </div>

        {/* Task Properties Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            marginBottom: "20px",
            paddingBottom: "20px",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          {/* Task Type */}
          <div style={{ position: "relative" }}>
            <label
              style={{
                fontSize: "13px",
                color: "#718096",
                fontWeight: "400",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Task Type
            </label>
            <button
              onClick={() => setShowTaskTypeDropdown(!showTaskTypeDropdown)}
              style={{
                width: "100%",
                padding: "4px 0",
                backgroundColor: "transparent",
                border: "none",
                fontSize: "14px",
                fontWeight: "600",
                color: "#141414",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {taskType}
            </button>
            {showTaskTypeDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: "4px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "5px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  minWidth: "150px",
                  zIndex: 1001,
                  overflow: "hidden",
                }}
              >
                {taskTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setTaskType(type);
                      setShowTaskTypeDropdown(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      backgroundColor: "transparent",
                      border: "none",
                      textAlign: "left",
                      fontSize: "14px",
                      color: "#33475b",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f7fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority */}
          <div style={{ position: "relative" }}>
            <label
              style={{
                fontSize: "13px",
                color: "#718096",
                fontWeight: "400",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Priority
            </label>
            <button
              onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
              style={{
                width: "100%",
                padding: "4px 0",
                backgroundColor: "transparent",
                border: "none",
                fontSize: "14px",
                fontWeight: "600",
                color: "#141414",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {priority}
            </button>
            {showPriorityDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: "4px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "5px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  minWidth: "150px",
                  zIndex: 1001,
                  overflow: "hidden",
                }}
              >
                {priorities.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPriority(p);
                      setShowPriorityDropdown(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      backgroundColor: "transparent",
                      border: "none",
                      textAlign: "left",
                      fontSize: "14px",
                      color: "#33475b",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f7fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Queue */}
          <div style={{ position: "relative" }}>
            <label
              style={{
                fontSize: "13px",
                color: "#718096",
                fontWeight: "400",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Queue
            </label>
            <button
              onClick={() => setShowQueueDropdown(!showQueueDropdown)}
              style={{
                width: "100%",
                padding: "4px 0",
                backgroundColor: "transparent",
                border: "none",
                fontSize: "14px",
                fontWeight: "600",
                color: "#141414",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {queue}
            </button>
            {showQueueDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: "4px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "5px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  minWidth: "180px",
                  zIndex: 1001,
                  overflow: "hidden",
                }}
              >
                {queues.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setQueue(q);
                      setShowQueueDropdown(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      backgroundColor: "transparent",
                      border: "none",
                      textAlign: "left",
                      fontSize: "14px",
                      color: "#33475b",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f7fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Activity Assigned To */}
          <div style={{ position: "relative" }}>
            <label
              style={{
                fontSize: "13px",
                color: "#718096",
                fontWeight: "400",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Activity assigned to
            </label>
            <button
              onClick={() => setShowAssignedToDropdown(!showAssignedToDropdown)}
              style={{
                width: "100%",
                padding: "4px 0",
                backgroundColor: "transparent",
                border: "none",
                fontSize: "14px",
                fontWeight: "600",
                color: "#141414",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {assignedToState}
            </button>
          </div>
        </div>

        {/* Notes Section */}
        <div style={{ marginBottom: "20px" }}>
          <textarea
            ref={notesRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Notes..."
            style={{
              width: "100%",
              height: isMaximized ? "300px" : "75px",
              border: "none",
              outline: "none",
              fontSize: "14px",
              color: "#141414",
              fontFamily: "inherit",
              resize: "none",
              lineHeight: "1.6",
              padding: "0",
            }}
          />
        </div>

        {/* Formatting Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "12px",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              style={{
                background: "transparent",
                border: "none",
                padding: "6px",
                cursor: "pointer",
                color: "#141414",
                display: "flex",
                alignItems: "center",
                borderRadius: "3px",
                fontSize: "14px",
                fontWeight: "600",
              }}
              title="Bold"
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f5f8fa")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              B
            </button>
            <button
              style={{
                background: "transparent",
                border: "none",
                padding: "6px",
                cursor: "pointer",
                color: "#141414",
                display: "flex",
                alignItems: "center",
                borderRadius: "3px",
                fontSize: "14px",
                fontWeight: "600",
                fontStyle: "italic",
              }}
              title="Italic"
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f5f8fa")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              I
            </button>
            <button
              style={{
                background: "transparent",
                border: "none",
                padding: "6px",
                cursor: "pointer",
                color: "#141414",
                display: "flex",
                alignItems: "center",
                borderRadius: "3px",
                fontSize: "14px",
                fontWeight: "600",
                textDecoration: "underline",
              }}
              title="Underline"
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f5f8fa")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              U
            </button>
            <button
              style={{
                background: "transparent",
                border: "none",
                padding: "6px 10px",
                cursor: "pointer",
                color: "#141414",
                display: "flex",
                alignItems: "center",
                borderRadius: "3px",
                fontSize: "13px",
                fontWeight: "500",
                gap: "4px",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f5f8fa")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              More
              <ChevronDown size={14} />
            </button>
            <button
              style={{
                background: "transparent",
                border: "none",
                padding: "6px",
                cursor: "pointer",
                color: "#141414",
                display: "flex",
                alignItems: "center",
                borderRadius: "3px",
              }}
              title="Link"
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f5f8fa")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <Link size={16} />
            </button>
            <button
              style={{
                background: "transparent",
                border: "none",
                padding: "6px",
                cursor: "pointer",
                color: "#141414",
                display: "flex",
                alignItems: "center",
                borderRadius: "3px",
              }}
              title="Image"
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f5f8fa")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <Image size={16} aria-label="Insert Image" />
            </button>
            <button
              style={{
                background: "transparent",
                border: "none",
                padding: "6px",
                cursor: "pointer",
                color: "#141414",
                display: "flex",
                alignItems: "center",
                borderRadius: "3px",
              }}
              title="List"
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f5f8fa")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <List size={16} />
            </button>
          </div>
          <button
            style={{
              background: "transparent",
              border: "none",
              padding: "6px 10px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
              fontSize: "13px",
              fontWeight: "500",
              gap: "4px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            Associated with 1 record
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          backgroundColor: "#ffffff",
        }}
      >
        <button
          onClick={handleSave}
          disabled={!title.trim()}
          style={{
            padding: "8px 24px",
            backgroundColor: title.trim() ? "#cbd5e0" : "#e2e8f0",
            color: "#141414",
            border: "none",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: title.trim() ? "pointer" : "not-allowed",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            if (title.trim()) {
              e.currentTarget.style.backgroundColor = "#b8c5d0";
            }
          }}
          onMouseLeave={(e) => {
            if (title.trim()) {
              e.currentTarget.style.backgroundColor = "#cbd5e0";
            }
          }}
        >
          Create
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MEETING/SCHEDULE MODAL COMPONENT - Add this after TaskModal in your file
// ============================================================================

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostEmail?: string;
  hostName?: string;
  /** Single email, comma-separated string, or array of emails */
  attendeeEmail?: string | string[];
  attendeeName?: string;
  onSchedule: (meetingData: {
    title: string;
    hostType: "user" | "rotation";
    hostEmail: string;
    startDate: string;
    startTime: string;
    endTime: string;
    attendees: string[];
    location: string;
    reminders: string[];
    description: string;
    internalNote: string;
  }) => void | Promise<void>;
}

const normalizeAttendeeEmails = (v?: string | string[]): string[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((e) => e.trim()).filter(Boolean);
  return v
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
};

const MeetingModal: React.FC<MeetingModalProps> = ({
  isOpen,
  onClose,
  hostEmail = "user@example.com",
  hostName = "Your Name",
  attendeeEmail,
  attendeeName,
  onSchedule,
}) => {
  const initialAttendees = normalizeAttendeeEmails(attendeeEmail);
  // State management
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [hostType, setHostType] = useState<"user" | "rotation">("user");
  const [selectedHost, setSelectedHost] = useState(hostEmail);
  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState("01:00");
  const [endTime, setEndTime] = useState("01:30");
  const [attendees, setAttendees] = useState<string[]>(initialAttendees);
  const [attendeeCount, setAttendeeCount] = useState(
    initialAttendees.length > 0 ? initialAttendees.length : 2,
  );
  const [location, setLocation] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [reminders, setReminders] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [hideWeekends, setHideWeekends] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showHostDropdown, setShowHostDropdown] = useState(false);
  const [showAttendeesDropdown, setShowAttendeesDropdown] = useState(false);
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const next = normalizeAttendeeEmails(attendeeEmail);
      if (next.length > 0) setAttendees(next);
      if (titleInputRef.current) titleInputRef.current.focus();
    }
  }, [isOpen, attendeeEmail]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target as Node)
      ) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // Calendar utilities
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const formatDateRange = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4); // 5 days for weekdays

    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
    };
    return `${startOfWeek.toLocaleDateString("en-US", options)} - ${endOfWeek.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}`;
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Previous month days
    const prevMonthDays = getDaysInMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() - 1,
          prevMonthDays - i,
        ),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i),
      });
    }

    // Next month days to fill the grid
    const remainingDays = 35 - days.length; // 5 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          i,
        ),
      });
    }

    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === startDate.getDate() &&
      date.getMonth() === startDate.getMonth() &&
      date.getFullYear() === startDate.getFullYear()
    );
  };

  const handleDateSelect = (date: Date) => {
    setStartDate(date);
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentMonth);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentMonth(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentMonth);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentMonth(newDate);
  };

  const handleSchedule = async () => {
    if (!title.trim()) {
      alert("Please enter a meeting title");
      return;
    }
    setScheduleLoading(true);
    try {
      await onSchedule({
        title,
        hostType,
        hostEmail: selectedHost,
        startDate: startDate.toISOString(),
        startTime,
        endTime,
        attendees,
        location,
        reminders,
        description,
        internalNote,
      });
      setTitle("");
      setHostType("user");
      setStartDate(new Date());
      setStartTime("01:00");
      setEndTime("01:30");
      setAttendees([]);
      setLocation("");
      setReminders([]);
      setDescription("");
      setInternalNote("");
      onClose();
    } finally {
      setScheduleLoading(false);
    }
  };

  const weekDays = hideWeekends
    ? ["Mon", "Tue", "Wed", "Thu", "Fri"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const timeSlots = [];
  for (let hour = 0; hour < 24; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, "0")}:00`);
    timeSlots.push(`${hour.toString().padStart(2, "0")}:30`);
  }

  const locations = [
    "Conference Room A",
    "Conference Room B",
    "Video Call",
    "Phone Call",
    "Client Office",
    "Custom Location",
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        height: isMaximized ? "auto" : "750px",
        width: isMaximized ? "auto" : "1320px",
        backgroundColor: "#ffffff",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
        borderRadius: "8px",
        border: "1px solid #cbd5e0",
        overflow: "hidden",
        opacity: 1,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              color: "#141414",
              padding: "4px",
            }}
          >
            <ChevronDown size={20} />
          </button>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#141414",
              margin: 0,
            }}
          >
            Schedule
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              color: "#141414",
            }}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            <Maximize2 size={18} />
          </button>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              color: "#141414",
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Panel - Form */}
        <div
          style={{
            width: "480px",
            borderRight: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#ffffff",
          }}
        >
          <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
            {/* Host Section */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#141414",
                  display: "block",
                  marginBottom: "12px",
                }}
              >
                Host
              </label>

              <div
                style={{ display: "flex", gap: "16px", marginBottom: "12px" }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#141414",
                  }}
                >
                  <input
                    type="radio"
                    name="hostType"
                    checked={hostType === "user"}
                    onChange={() => setHostType("user")}
                    style={{
                      width: "16px",
                      height: "16px",
                      cursor: "pointer",
                    }}
                  />
                  User
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#141414",
                  }}
                >
                  <input
                    type="radio"
                    name="hostType"
                    checked={hostType === "rotation"}
                    onChange={() => setHostType("rotation")}
                    style={{
                      width: "16px",
                      height: "16px",
                      cursor: "pointer",
                    }}
                  />
                  Meeting rotation
                </label>
              </div>

              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowHostDropdown(!showHostDropdown)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e0",
                    borderRadius: "4px",
                    fontSize: "14px",
                    color: "#141414",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    {hostName} &lt;{selectedHost}&gt;
                  </span>
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#141414",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Title
              </label>
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder=""
                style={{
                  width: "100%",
                  border: "1px solid #cccccc",
                  outline: "none",
                  fontSize: "14px",
                  color: "#141414",
                  padding: "10px 12px",
                  borderRadius: "4px",
                }}
              />
            </div>

            {/* Date and Time */}
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#141414",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Start date
                  </label>
                  <div
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #cbd5e0",
                      borderRadius: "4px",
                      fontSize: "14px",
                      color: "#141414",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Calendar size={16} style={{ color: "#718096" }} />
                    <span>
                      {startDate.toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#141414",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Start time
                  </label>
                  <div
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #cbd5e0",
                      borderRadius: "4px",
                      fontSize: "14px",
                      color: "#141414",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Clock size={16} style={{ color: "#718096" }} />
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      style={{
                        border: "none",
                        outline: "none",
                        fontSize: "14px",
                        color: "#141414",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        width: "100%",
                      }}
                    >
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#141414",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    End time
                  </label>
                  <div
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #cbd5e0",
                      borderRadius: "4px",
                      fontSize: "14px",
                      color: "#141414",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Clock size={16} style={{ color: "#718096" }} />
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      style={{
                        border: "none",
                        outline: "none",
                        fontSize: "14px",
                        color: "#141414",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        width: "100%",
                      }}
                    >
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendees */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#141414",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Attendees
              </label>
              <button
                onClick={() => setShowAttendeesDropdown(!showAttendeesDropdown)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #cbd5e0",
                  borderRadius: "4px",
                  fontSize: "14px",
                  color: "#141414",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>{attendeeCount} attendees</span>
                <ChevronDown size={16} />
              </button>
            </div>

            {/* Location */}
            <div
              style={{ marginBottom: "24px", position: "relative" }}
              ref={locationDropdownRef}
            >
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#141414",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Location
              </label>
              <button
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #cbd5e0",
                  borderRadius: "4px",
                  fontSize: "14px",
                  color: location ? "#141414" : "#718096",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>{location || "Select location"}</span>
                <ChevronDown size={16} />
              </button>

              {showLocationDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: "4px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "5px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    zIndex: 1001,
                    overflow: "hidden",
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {locations.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setLocation(loc);
                        setShowLocationDropdown(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        backgroundColor: "transparent",
                        border: "none",
                        textAlign: "left",
                        fontSize: "14px",
                        color: "#141414",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f7fafc";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Scheduled reminder emails */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#141414",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Scheduled reminder emails
              </label>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#0091ae",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  padding: "0",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = "underline";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = "none";
                }}
              >
                <Plus size={16} />
                Add reminder
              </button>
            </div>

            {/* Attendee description */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#141414",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Attendee description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Send a description to your attendees..."
                style={{
                  width: "100%",
                  minHeight: "80px",
                  border: "1px solid #cbd5e0",
                  borderRadius: "4px",
                  padding: "10px 12px",
                  fontSize: "14px",
                  color: "#141414",
                  fontFamily: "inherit",
                  resize: "vertical",
                  outline: "none",
                }}
              />
            </div>

            {/* Associated with */}
            <div style={{ marginBottom: "24px" }}>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#141414",
                }}
              >
                Associated with 1 record
                <ChevronDown size={14} />
              </button>
            </div>

            {/* Add internal note */}
            <div>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#0091ae",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  padding: "0",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = "underline";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = "none";
                }}
              >
                <Plus size={16} />
                Add internal note
              </button>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              gap: "12px",
              backgroundColor: "#ffffff",
            }}
          >
            <button
              onClick={handleSchedule}
              disabled={!title.trim() || scheduleLoading}
              style={{
                padding: "10px 24px",
                backgroundColor:
                  title.trim() && !scheduleLoading ? "#cbd5e0" : "#e2e8f0",
                color: "#141414",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "500",
                cursor:
                  title.trim() && !scheduleLoading ? "pointer" : "not-allowed",
                transition: "background-color 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              onMouseEnter={(e) => {
                if (title.trim() && !scheduleLoading) {
                  e.currentTarget.style.backgroundColor = "#b8c5d0";
                }
              }}
              onMouseLeave={(e) => {
                if (title.trim() && !scheduleLoading) {
                  e.currentTarget.style.backgroundColor = "#cbd5e0";
                }
              }}
            >
              {scheduleLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                    style={{
                      width: "14px",
                      height: "14px",
                      borderWidth: "2px",
                    }}
                  />
                  Scheduling...
                </>
              ) : (
                "Schedule meeting"
              )}
            </button>
            <button
              onClick={onClose}
              disabled={scheduleLoading}
              style={{
                padding: "10px 24px",
                backgroundColor: "transparent",
                color: "#141414",
                border: "1px solid #cbd5e0",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f7fafc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Right Panel - Calendar */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#fafafa",
          }}
        >
          {/* Calendar Header */}
          {/* <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => setStartDate(new Date())}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e0',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#141414',
                    cursor: 'pointer',
                  }}
                >
                  Today
                </button>
                
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#141414',
                }}>
                  <input
                    type="checkbox"
                    checked={hideWeekends}
                    onChange={(e) => setHideWeekends(e.target.checked)}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                    }}
                  />
                  Hide weekends
                </label>
              </div>
  
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#141414',
                }}>
                  {formatDateRange(currentMonth)}
                </div>
                
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={handlePrevWeek}
                    style={{
                      background: 'transparent',
                      border: '1px solid #cbd5e0',
                      borderRadius: '4px',
                      padding: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#141414',
                    }}
                  >
                    <ChevronDown size={16} style={{ transform: 'rotate(90deg)' }} />
                  </button>
                  <button
                    onClick={handleNextWeek}
                    style={{
                      background: 'transparent',
                      border: '1px solid #cbd5e0',
                      borderRadius: '4px',
                      padding: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#141414',
                    }}
                  >
                    <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                  </button>
                </div>
              </div>
  
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#141414',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  UTC +05:00 Almaty, Aqtau, Aqtobe, Ashgabat
                  <ChevronDown size={14} />
                </button>
              </div>
            </div> */}

          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
            }}
          >
            {/* First Row - Today Button, Date Range with Arrows */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              {/* Left - Today Button */}
              <button
                onClick={() => setStartDate(new Date())}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #cbd5e0",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "400",
                  color: "#141414",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f7fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                }}
              >
                Today
              </button>

              {/* Center - Date Range with Navigation Arrows */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <button
                  onClick={handlePrevWeek}
                  style={{
                    background: "transparent",
                    border: "1px solid #cbd5e0",
                    borderRadius: "4px",
                    padding: "6px 8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    color: "#141414",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f7fafc";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <ChevronDown
                    size={16}
                    style={{ transform: "rotate(90deg)" }}
                  />
                </button>

                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#141414",
                    minWidth: "240px",
                    textAlign: "center",
                  }}
                >
                  {formatDateRange(currentMonth)}
                </div>

                <button
                  onClick={handleNextWeek}
                  style={{
                    background: "transparent",
                    border: "1px solid #cbd5e0",
                    borderRadius: "4px",
                    padding: "6px 8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    color: "#141414",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f7fafc";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <ChevronDown
                    size={16}
                    style={{ transform: "rotate(-90deg)" }}
                  />
                </button>
              </div>

              {/* Right - Empty space for alignment */}
              <div style={{ width: "80px" }}></div>
            </div>

            {/* Second Row - Hide Weekends and Timezone */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {/* Left - Hide Weekends Checkbox */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#141414",
                  fontWeight: "400",
                }}
              >
                <input
                  type="checkbox"
                  checked={hideWeekends}
                  onChange={(e) => setHideWeekends(e.target.checked)}
                  style={{
                    width: "18px",
                    height: "18px",
                    cursor: "pointer",
                    accentColor: "#141414",
                  }}
                />
                Hide weekends
              </label>

              {/* Right - Timezone Selector */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "400",
                    color: "#141414",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "background-color 0.2s",
                    borderRadius: "4px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f7fafc";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  UTC +05:00 Almaty, Aqtau, Aqtobe, Ashgabat
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div style={{ flex: 1, overflow: "auto", padding: "0" }}>
            {/* Week Days Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: hideWeekends
                  ? "80px repeat(5, 1fr)"
                  : "80px repeat(7, 1fr)",
                borderBottom: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
                position: "sticky",
                top: 0,
                zIndex: 10,
              }}
            >
              <div
                style={{ padding: "12px", borderRight: "1px solid #e2e8f0" }}
              ></div>
              {weekDays.map((day, index) => {
                const dayDate = new Date(currentMonth);
                const startOfWeek = new Date(dayDate);
                startOfWeek.setDate(
                  dayDate.getDate() - dayDate.getDay() + (hideWeekends ? 1 : 0),
                );
                const currentDayDate = new Date(startOfWeek);
                currentDayDate.setDate(startOfWeek.getDate() + index);

                const isCurrentDay = isToday(currentDayDate);

                return (
                  <div
                    key={day}
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderRight:
                        index < weekDays.length - 1
                          ? "1px solid #e2e8f0"
                          : "none",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#718096",
                        marginBottom: "4px",
                      }}
                    >
                      {day}
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: isCurrentDay ? "600" : "400",
                        color: isCurrentDay ? "#ffffff" : "#141414",
                        backgroundColor: isCurrentDay
                          ? "#ff3842"
                          : "transparent",
                        borderRadius: "50%",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto",
                      }}
                    >
                      {currentDayDate.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Slots */}
            <div style={{ position: "relative" }}>
              {Array.from({ length: 24 }, (_, hour) => (
                <div
                  key={hour}
                  style={{
                    display: "grid",
                    gridTemplateColumns: hideWeekends
                      ? "80px repeat(5, 1fr)"
                      : "80px repeat(7, 1fr)",
                    borderBottom: "1px solid #e2e8f0",
                    minHeight: "60px",
                  }}
                >
                  {/* Time Label */}
                  <div
                    style={{
                      padding: "8px 12px",
                      fontSize: "13px",
                      color: "#718096",
                      borderRight: "1px solid #e2e8f0",
                      backgroundColor: "#ffffff",
                      position: "sticky",
                      left: 0,
                    }}
                  >
                    {`${hour.toString().padStart(2, "0")}:00`}
                  </div>

                  {/* Day Cells */}
                  {weekDays.map((_, dayIndex) => (
                    <div
                      key={dayIndex}
                      style={{
                        borderRight:
                          dayIndex < weekDays.length - 1
                            ? "1px solid #e2e8f0"
                            : "none",
                        backgroundColor: "#fafafa",
                        cursor: "pointer",
                        position: "relative",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f0f4f8";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#fafafa";
                      }}
                    >
                      {/* Sample Event on Wednesday at 18:00 */}
                      {dayIndex === 2 && hour === 18 && (
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: "-60px",
                            backgroundColor: "#e3f2fd",
                            border: "1px solid #2196f3",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            fontSize: "12px",
                            color: "#141414",
                            fontWeight: "500",
                            overflow: "hidden",
                          }}
                        >
                          Prime alley x Hub...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const GenericSidebar: React.FC<GenericSidebarProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  company,
  avatar,
  email,
  phone,
  quickActions,
  onQuickActionClick,
  breezeRecordSummary,
  sections = [],
  width = "470px",
  recordLink,
  actionsDropdown,
  permissionMessage,
  contextPayload,
  recordType,
  recordId,
  onNoteCreate,
  onEmailSend,
  senderEmail,
  senderName,
  onTaskCreate,
  onCall,
  callerNumber,
  onMeetingSchedule,
  leadId,
  dealId,
  userExtension,
  record,
  onWhatsAppLog,
  onSmsLog,
}) => {
  const { data: session } = useSession();
  const {
    dialNumber: ctiDialNumber,
    getAllUserDevices,
    makeCall,
    userAddress: ctiUserAddress,
  } = useCti();
  const [showDeviceSelectionModal, setShowDeviceSelectionModal] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [pendingDialedNumber, setPendingDialedNumber] = useState("");
  const [isDialing, setIsDialing] = useState(false);
  const extension = (session?.user as { extension?: string; phone?: string } | undefined)?.extension
    ?? (session?.user as { extension?: string; phone?: string } | undefined)?.phone
    ?? 'unknown';
  const tenantId = (session?.user as { tenant_id?: string; tenant?: string } | undefined)?.tenant_id
    ?? (session?.user as { tenant_id?: string; tenant?: string } | undefined)?.tenant
    ?? '';

  // Parse comma-separated email/phone into arrays for multiple contact support
  const emailList = useMemo(() => {
    if (!email || typeof email !== "string") return [];
    return email
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
  }, [email]);
  const phoneList = useMemo(() => {
    if (!phone || typeof phone !== "string") return [];
    return phone
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
  }, [phone]);
  const hasEmail = emailList.length > 0;
  const hasPhone = phoneList.length > 0;

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(),
  );
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showSectionActions, setShowSectionActions] = useState<string | null>(
    null,
  );
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [moreModalPosition, setMoreModalPosition] = useState({ top: 0, left: 0 });
  const [sidebarNotesList, setSidebarNotesList] = useState<CrmNoteItem[]>([]);
  const [sidebarNotesLoading, setSidebarNotesLoading] = useState(false);
  const [sidebarCallRecordings, setSidebarCallRecordings] = useState<any[]>([]);
  const [sidebarCallRecordingsLoading, setSidebarCallRecordingsLoading] = useState(false);
  const callRecordingsFetchKeyRef = useRef<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sectionDropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>(
    {},
  );
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  // Initialize collapsed sections based on defaultExpanded
  useEffect(() => {
    const collapsed = new Set<string>();
    if (sections && sections.length > 0) {
      sections.forEach((section) => {
        if (section.collapsible && section.defaultExpanded === false) {
          collapsed.add(section.id);
        }
      });
    }
    setCollapsedSections(collapsed);
  }, [sections]);

  // Fetch notes when sidebar is open and we have a CRM record
  useEffect(() => {
    if (!isOpen || !recordType || recordId == null || Number.isNaN(Number(recordId))) {
      return;
    }
    const rType = recordType as "prospect" | "lead" | "deal" | "order";
    setSidebarNotesLoading(true);
    getCrmNotes(rType, Number(recordId))
      .then((res) => {
        setSidebarNotesList(res?.data ?? []);
      })
      .catch(() => setSidebarNotesList([]))
      .finally(() => setSidebarNotesLoading(false));
  }, [isOpen, recordType, recordId]);

  // Fetch call recordings when sidebar is open and we have a phone number (ref prevents double call)
  useEffect(() => {
    if (!isOpen) {
      callRecordingsFetchKeyRef.current = null;
      return;
    }
    const normalizedPhone = (phone || "").trim().replace(/\s/g, "");
    if (!normalizedPhone) {
      setSidebarCallRecordings([]);
      return;
    }
    const fetchKey = `${normalizedPhone}`;
    if (callRecordingsFetchKeyRef.current === fetchKey) return;
    callRecordingsFetchKeyRef.current = fetchKey;
    setSidebarCallRecordingsLoading(true);
    ListCallLogs(
      {
        page: 1,
        perPage: 20,
        search: "",
        filters: { remote_party_number: [String(normalizedPhone)] },
        reportType: "recordings",
        moduleSlug: ModuleSlug.CALL_RECORDINGS,
      },
      "call-logs/recordings",
    )
      .then((response: any) => {
        const data = response ?? {};
        setSidebarCallRecordings(Array.isArray(data.dataList) ? data.dataList : []);
      })
      .catch(() => setSidebarCallRecordings([]))
      .finally(() => setSidebarCallRecordingsLoading(false));
  }, [isOpen, phone]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowActionsDropdown(false);
      }

      Object.entries(sectionDropdownRefs.current).forEach(([key, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          setShowSectionActions((prev) => (prev === key ? null : prev));
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleNoteClick = () => {
    setShowNotesModal(true);
  };

  const handleNoteClose = () => {
    setShowNotesModal(false);
  };

  const handleNoteSave = async (note: string, createTask: boolean, taskDueDate?: string) => {
    const text = note.trim();
    if (!text) return;
    if (recordType && recordId != null) {
      try {
        await createCrmNote({ record_type: recordType, record_id: Number(recordId), text });
        setShowNotesModal(false);
        toast.success('Note created successfully');
        onNoteCreate?.(note, createTask, taskDueDate);
        // Refresh sidebar notes list
        const rType = recordType as "prospect" | "lead" | "deal" | "order";
        getCrmNotes(rType, Number(recordId)).then((res) => setSidebarNotesList(res?.data ?? [])).catch(() => {});
      } catch {
        // createCrmNote already shows toast on error
      }
      return;
    }
    onNoteCreate?.(note, createTask, taskDueDate);
  };

  const handleEmailClick = () => {
    setShowEmailModal(true);
  };

  const handleEmailClose = () => {
    setShowEmailModal(false);
  };

  const handleEmailSend = async (
    emailData: {
      to: string[];
      cc: string[];
      bcc: string[];
      subject: string;
      body: string;
      attachments?: File[];
    },
    record?: {
      id: number;
      type: RECORD_TYPES;
    },
  ) => {
    if (!emailData.to?.length) return;
    try {
      await sendEmail({
        to: emailData.to,
        cc: emailData.cc?.length ? emailData.cc : undefined,
        bcc: emailData.bcc?.length ? emailData.bcc : undefined,
        subject: emailData.subject,
        content: emailData.body,
        record_id: record?.id,
        record_type: record?.type,
      });
      onEmailSend?.(emailData);
    } catch (err: unknown) {
      let message = "Failed to send email";
      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
      ) {
        message = (err as { message: string }).message;
      } else if (err && typeof err === "object" && "response" in err) {
        const res = (err as { response?: { data?: { message?: string } } })
          .response;
        if (typeof res?.data?.message === "string") message = res.data.message;
      }
      toast.error(message);
      throw err;
    }
  };

  const handleTaskClick = () => {
    setShowTaskModal(true);
  };

  const handleTaskClose = () => {
    setShowTaskModal(false);
  };

  const handleTaskSave = (taskData: {
    title: string;
    activityDate: string;
    activityTime: string;
    reminder: string;
    repeat: boolean;
    taskType: string;
    priority: string;
    queue: string;
    assignedTo: string;
    notes: string;
  }) => {
    onTaskCreate?.(taskData);
    console.log("Task created:", taskData);
  };
  const handleCallClick = () => {
    if (hasPhone) {
      setShowCallModal(true);
    } else {
      alert("No phone number available");
    }
  };

  const handleCallClose = () => {
    setShowCallModal(false);
  };

  /** Initiate call via CTI (same flow as Layout handleDial): device selection if multiple devices, else dialNumber */
  const handleCall = useCallback(
    async (phoneNumber: string) => {
      const numberToDial = (phoneNumber || "").trim();
      if (!numberToDial) {
        toast.error("No phone number available to call");
        return;
      }
      const userDevices = getAllUserDevices?.();
      if (userDevices && userDevices.length > 1) {
        setAvailableDevices(userDevices);
        setPendingDialedNumber(numberToDial);
        setShowDeviceSelectionModal(true);
        setShowCallModal(false);
        return;
      }
      setIsDialing(true);
      try {
        const result = await ctiDialNumber(numberToDial);
        if (result?.success) {
          setShowCallModal(false);
          onCall?.(numberToDial);
        } else if (result?.error) {
          toast.error(result.error);
        }
      } catch {
        toast.error("Failed to make call");
      } finally {
        setIsDialing(false);
      }
    },
    [ctiDialNumber, getAllUserDevices, onCall],
  );

  const handleDeviceSelect = useCallback(
    async (device: { deviceType: string; deviceName: string }) => {
      const numberToDial = pendingDialedNumber;
      setShowDeviceSelectionModal(false);
      setAvailableDevices([]);
      setPendingDialedNumber("");
      const callerInfo = {
        callingAddress: ctiUserAddress,
        callingDeviceName: device.deviceName,
        callingDeviceType: device.deviceType,
        selectedAt: new Date().toISOString(),
      };
      localStorage.setItem("cti_caller_info", JSON.stringify(callerInfo));
      setIsDialing(true);
      try {
        const result = await makeCall({
          callingAddress: ctiUserAddress ?? "",
          calledAddress: numberToDial,
          callingDeviceType: device.deviceType,
          callingDeviceName: device.deviceName,
        });
        if (result?.success) {
          setShowCallModal(false);
          onCall?.(numberToDial);
        } else if (result?.error) {
          toast.error(result.error);
        }
      } catch {
        toast.error("Failed to make call");
      } finally {
        setIsDialing(false);
      }
    },
    [pendingDialedNumber, ctiUserAddress, makeCall, onCall],
  );

  const handleMeetingClick = () => {
    setShowMeetingModal(true);
  };

  const handleMeetingClose = () => {
    setShowMeetingModal(false);
  };

  const handleMeetingSchedule = async (
    meetingData: {
      title: string;
      hostType: "user" | "rotation";
      hostEmail: string;
      startDate: string;
      startTime: string;
      endTime: string;
      attendees: string[];
      location: string;
      reminders: string[];
      description: string;
      internalNote: string;
    },
    record?: {
      id: number;
      type: RECORD_TYPES;
    },
  ) => {
    const meeting_date = meetingData.startDate.slice(0, 10);
    const meeting_time =
      meetingData.startTime.length === 5
        ? meetingData.startTime
        : meetingData.startTime.slice(0, 5);
    const extensions = userExtension
      ? [userExtension]
      : [meetingData.hostEmail?.slice(0, 15) || "0"];
    try {
      console.log("record received in handleMeetingSchedule", record);
      await createMeeting({
        name: meetingData.title.trim(),
        meeting_type: "Video",
        meeting_date,
        meeting_time,
        extensions,
        ...(record?.id != null && { record_id: record.id }),
        ...(record?.type != null && { record_type: record.type }),
        ...(leadId != null && { lead_id: leadId }),
        ...(dealId != null && { deal_id: dealId }),
        ...(meetingData.attendees?.length
          ? { attendees: meetingData.attendees }
          : {}),
        ...([meetingData.description, meetingData.internalNote].filter(Boolean)
          .length
          ? {
              summary: [meetingData.description, meetingData.internalNote]
                .filter(Boolean)
                .join("\n\n")
                .slice(0, 255),
            }
          : {}),
      });
      onMeetingSchedule?.(meetingData);
    } catch (err: unknown) {
      throw err;
    }
  };

  const handleWhatsAppClick = () => {
    setShowWhatsAppModal(true);
  };

  const handleWhatsAppClose = () => {
    setShowWhatsAppModal(false);
  };

  const handleWhatsAppLog = async (whatsappData: {
    content_sid: string;
    content_variables: Record<string, string>;
  }) => {
    const rawNumber = (phoneList && phoneList[0]) || (typeof phone === 'string' ? phone.trim() : '') || '';
    const number = rawNumber.replace(/\s/g, '');
    if (!number) {
      toast.error('No phone number available for this record.');
      return;
    }
    try {
      await sendWhatsApp({
        number,
        content_sid: whatsappData.content_sid,
        content_variables: Object.keys(whatsappData.content_variables || {}).length > 0
          ? whatsappData.content_variables
          : undefined,
      });
      setShowWhatsAppModal(false);
      // if (onWhatsAppLog) onWhatsAppLog(whatsappData);
    } catch {
      // sendWhatsApp shows toast on error
    }
  };

  const handleSmsClick = () => {
    setShowSmsModal(true);
  };

  const handleSmsClose = () => {
    setShowSmsModal(false);
  };

  const handleSmsLog = async (smsData: {
    message: string;
    contacts: Array<{ id: string; name: string; email?: string }>;
    activityDate: string;
    createTask: boolean;
    taskDueDate?: string;
    attachments: File[];
  }) => {
    const rawTo = (phoneList && phoneList[0]) || (typeof phone === 'string' ? phone.trim() : '') || '';
    const to = rawTo.replace(/\s/g, '');
    const body = smsData.message?.trim() || '';
    if (!to || !body) {
      if (!to) toast.error('No phone number available for this record.');
      if (!body) toast.error('Please enter a message.');
      return;
    }
    try {
      await sendSms({
        to,
        message: body,
        tenant_id: tenantId || 'default',
        extension,
        ...(recordType && { record_type: recordType }),
        ...(recordId != null && { record_id: Number(recordId) }),
      });
      setShowSmsModal(false);
      if (onSmsLog) onSmsLog(smsData);
    } catch {
      // sendSms already shows toast on error
    }
  };

  const handleMoreClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect();
      setMoreModalPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
    setShowMoreModal(true);
  };

  const handleMoreClose = () => {
    setShowMoreModal(false);
  };

  const handleMoreActionSelect = (actionId: string) => {
    console.log("Selected action:", actionId);
    // Handle different actions
    switch (actionId) {
      case "enroll-sequence":
        console.log("Enroll in sequence");
        break;
      case "engage-linkedin":
        console.log("Engage on LinkedIn");
        break;
      case 'log-sms':
        setShowSmsModal(true);
        break;
      case "log-linkedin":
        console.log("Log LinkedIn message");
        break;
      case 'log-whatsapp':
        setShowWhatsAppModal(true);
        break;
      case "log-call":
        console.log("Log a call");
        break;
    }
  };

  // Process quick actions to override note and email actions if provided
  const processedQuickActions = quickActions
    ? quickActions.map((action) => {
        if (action.id === "note") {
          return {
            ...action,
            onClick: () => {
              handleNoteClick();
              action.onClick?.(); // Call the original onClick if provided
            },
          };
        }
        if (action.id === "email") {
          return {
            ...action,
            onClick: () => {
              handleEmailClick();
              action.onClick?.(); // Call the original onClick if provided
            },
            disabled: !hasEmail,
          };
        }
        if (action.id === "task") {
          return {
            ...action,
            onClick: () => {
              handleTaskClick();
              action.onClick?.(); // Call the original onClick if provided
            },
          };
        }
        if (action.id === "call") {
          return {
            ...action,
            onClick: () => {
              handleCallClick();
              action.onClick?.(); // Call the original onClick if provided
            },
            disabled: !hasPhone,
          };
        }
        if (action.id === "meeting") {
          return {
            ...action,
            onClick: () => {
              handleMeetingClick();
              action.onClick?.(); // Call the original onClick if provided
            },
          };
        }
        if (action.id === "more") {
          return {
            ...action,
            onClick: (e?: React.MouseEvent<HTMLButtonElement>) => {
              if (e) handleMoreClick(e);
              action.onClick?.();
            },
          };
        }
        return action;
      })
    : [
        {
          id: "note",
          label: "Note",
          icon: ClipboardList,
          onClick: handleNoteClick,
          disabled: false,
        },
        {
          id: "email",
          label: "Email",
          icon: Mail,
          onClick: handleEmailClick,
          disabled: !hasEmail,
        },
        {
          id: "call",
          label: "Call",
          icon: Phone,
          onClick: handleCallClick,
          disabled: !hasPhone,
        },
        {
          id: "task",
          label: "Task",
          icon: ClipboardList,
          onClick: handleTaskClick,
          disabled: false,
        },
        {
          id: "meeting",
          label: "Meeting",
          icon: Calendar,
          onClick: handleMeetingClick,
          disabled: false,
        },
        {
          id: "more",
          label: "More",
          icon: MoreHorizontal,
          onClick: handleMoreClick,
          disabled: false,
        },
      ];

  // Process sections to override note-related actions
  const processedSections = sections.map((section) => {
    // If this is a notes section with an empty state action, override it to open modal
    if (section.id === "notes" && section.emptyState?.action) {
      return {
        ...section,
        emptyState: {
          ...section.emptyState,
          action: {
            ...section.emptyState.action,
            onClick: () => {
              handleNoteClick();
              section.emptyState?.action?.onClick?.(); // Call original if provided
            },
          },
        },
      };
    }
    return section;
  });

  const renderField = (field: SidebarField, index: number) => {
    if (field.show === false) return null;

    if (
      field.type === "tags" &&
      Array.isArray(field.value) &&
      field.value.length > 0
    ) {
      return (
        <div key={index} style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "400",
              color: "#666",
              marginBottom: "8px",
            }}
          >
            {field.label}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {field.value.map((tag: any, idx: number) => (
              <span
                key={idx}
                style={{
                  padding: "4px 10px",
                  backgroundColor: "#eaf0f6",
                  color: "#141414",
                  borderRadius: "3px",
                  fontSize: "13px",
                  fontWeight: "400",
                }}
              >
                {typeof tag === "string" ? tag : tag.name}
              </span>
            ))}
          </div>
        </div>
      );
    }

    if (field.type === "badge") {
      return (
        <div key={index} style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "400",
              color: "#666",
              marginBottom: "8px",
            }}
          >
            {field.label}
          </div>
          <Badge
            bg={field.badgeVariant || "primary"}
            style={{
              fontSize: "12px",
              padding: "4px 10px",
              borderRadius: "3px",
              fontWeight: "500",
            }}
          >
            {field.value}
          </Badge>
        </div>
      );
    }

    return (
      <div key={index} style={{ marginBottom: "16px" }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: "400",
            color: "#666",
            marginBottom: "4px",
          }}
        >
          {field.label}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              color: "#141414",
              fontWeight: "400",
              flex: 1,
              wordBreak: "break-word",
            }}
          >
            {field.value || "--"}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexShrink: 0,
            }}
          >
            {field.copyable && field.value && (
              <button
                onClick={() => copyToClipboard(field.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "4px",
                  cursor: "pointer",
                  color: "#141414",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "3px",
                }}
                title="Copy"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f5f8fa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Copy size={14} />
              </button>
            )}
            {field.externalLink && (
              <a
                href={field.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "4px",
                  cursor: "pointer",
                  color: "#141414",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "3px",
                  textDecoration: "none",
                }}
                title="Open in new tab"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f5f8fa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <ExternalLink size={14} />
              </a>
            )}
            {field.hasDetails && (
              <button
                onClick={field.onDetailsClick}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "2px 6px",
                  cursor: "pointer",
                  color: "#0091ae",
                  fontSize: "13px",
                  fontWeight: "400",
                  borderRadius: "3px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f5f8fa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Details
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (section: SidebarSection) => {
    const SectionIcon = section.icon;
    const EmptyIcon = section.emptyState?.icon;
    const isCollapsed = collapsedSections.has(section.id);
    const showActions = showSectionActions === section.id;

    return (
      <div
        key={section.id}
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "10px",
          marginBottom: "12px",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
          border: "1px solid #cccccc",
        }}
      >
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            cursor: section.collapsible ? "pointer" : "default",
            backgroundColor: "#ffffff",
            borderBottom: isCollapsed ? "none" : "1px solid #eaf0f6",
          }}
          onClick={() => section.collapsible && toggleSection(section.id)}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flex: 1,
            }}
          >
            {section.collapsible && (
              <ChevronDown
                size={18}
                style={{
                  color: "#141414",
                  transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            )}
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#141414",
                margin: 0,
                lineHeight: "1.2",
              }}
            >
              {section.title}
            </h3>
            {section.count !== undefined && (
              <span
                style={{
                  fontSize: "13px",
                  color: "#7c98b6",
                  fontWeight: "400",
                }}
              >
                ({section.count})
              </span>
            )}
            {section.badge && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 10px",
                  backgroundColor:
                    section.badge.variant === "danger" ? "#ffe8ec" : "#e3f2fd",
                  borderRadius: "12px",
                }}
              >
                {section.badge.icon && (
                  <section.badge.icon
                    size={12}
                    style={{
                      color:
                        section.badge.variant === "danger"
                          ? "#f44336"
                          : "#2196f3",
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color:
                      section.badge.variant === "danger"
                        ? "#f44336"
                        : "#2196f3",
                    textTransform: "uppercase",
                  }}
                >
                  {section.badge.value}
                </span>
              </div>
            )}
          </div>

          {/* Section Actions Dropdown */}
          {section.actions && section.actions.length > 0 && (
            <div
              style={{ position: "relative" }}
              ref={(el) => {
                sectionDropdownRefs.current[section.id] = el;
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() =>
                  setShowSectionActions(showActions ? null : section.id)
                }
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "6px",
                  cursor: "pointer",
                  color: "#141414",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "3px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f5f8fa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Actions
                <ChevronDown size={14} style={{ marginLeft: "4px" }} />
              </button>

              {showActions && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "4px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "5px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    minWidth: "180px",
                    zIndex: 1000,
                    overflow: "hidden",
                  }}
                >
                  {section.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        action.onClick();
                        setShowSectionActions(null);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        backgroundColor: "transparent",
                        border: "none",
                        textAlign: "left",
                        fontSize: "14px",
                        color: "#141414",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f7fafc";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section Content */}
        {!isCollapsed && (
          <div style={{ padding: "20px" }}>
            {section.id === "notes" ? (
              sidebarNotesLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", color: "#141414" }}>
                  <RefreshCw size={16} className="spin" style={{ marginRight: "8px" }} />
                  Loading...
                </div>
              ) : sidebarNotesList.length > 0 ? (
                <div>
                  {sidebarNotesList.map((note) => {
                    const updatedAt = new Date(note.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
                    return (
                      <div key={note.id} style={{ backgroundColor: "#fff", border: "1px solid #eaf0f6", borderRadius: "5px", padding: "12px 16px", marginBottom: "10px" }}>
                        <p style={{ fontSize: "14px", color: "#141414", margin: "0 0 8px 0", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{note.text}</p>
                        <span style={{ fontSize: "12px", color: "#718096" }}>{updatedAt}</span>
                      </div>
                    );
                  })}
                </div>
              ) : section.emptyState ? (
                <div style={{ padding: "24px 16px", textAlign: "center" }}>
                  {EmptyIcon && <EmptyIcon size={40} style={{ color: "#cbd5e0", marginBottom: "12px" }} />}
                  <p style={{ fontSize: "14px", color: "#718096", margin: 0, lineHeight: "1.6" }}>{section.emptyState.message}</p>
                  {section.emptyState.action && (
                    <button onClick={(e) => { e.stopPropagation(); section.emptyState?.action?.onClick(); }} style={{ marginTop: "12px", padding: "8px 16px", backgroundColor: "#0091ae", color: "white", border: "none", borderRadius: "4px", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>
                      {section.emptyState.action.label}
                    </button>
                  )}
                </div>
              ) : null
            ) : (section.id === "calls" || section.id === "call-recordings") ? (
              sidebarCallRecordingsLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", color: "#141414" }}>
                  <RefreshCw size={16} className="spin" style={{ marginRight: "8px" }} />
                  Loading...
                </div>
              ) : sidebarCallRecordings.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "280px", overflowY: "auto" }}>
                  {sidebarCallRecordings.map((rec: any, index: number) => {
                    const dateStr = rec.DateTime ?? rec.start_time ?? rec.created_at ?? "";
                    const timestamp = dateStr ? (dateStr.length > 10 ? new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : dateStr) : "—";
                    const dir = rec.Direction ?? rec.direction ?? rec.CallDirection ?? "";
                    const direction = dir.includes("INBOUND") || dir === "Inbound" || dir === "CALL_INCOMING" ? "Incoming" : "Outgoing";
                    const rawDuration = rec.Duration ?? rec.duration ?? rec.CallDuration ?? 0;
                    const durationSec = parseInt(String(rawDuration), 10) / 10000000 || 0;
                    const roundedSec = Math.round(durationSec * 10) / 10;
                    const durationStr = durationSec >= 60 ? `${Math.floor(durationSec / 60)}:${String(Math.floor(durationSec % 60)).padStart(2, "0")}` : roundedSec > 0 ? `${roundedSec}s` : "";
                    return (
                      <div
                        key={rec.Id ?? rec.id ?? index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 12px",
                          background: "#f9fafb",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 500, color: "#1f2937" }}>{timestamp}</div>
                          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                            {durationStr ? `${durationStr} · ` : ""}{direction}
                          </div>
                        </div>
                        <Phone size={16} style={{ color: "#718096", flexShrink: 0 }} />
                      </div>
                    );
                  })}
                </div>
              ) : section.emptyState ? (
                <div style={{ padding: "24px 16px", textAlign: "center" }}>
                  {EmptyIcon && <EmptyIcon size={40} style={{ color: "#cbd5e0", marginBottom: "12px" }} />}
                  <p style={{ fontSize: "14px", color: "#718096", margin: 0, lineHeight: "1.6" }}>{section.emptyState.message}</p>
                  {section.emptyState.action && (
                    <button onClick={(e) => { e.stopPropagation(); section.emptyState?.action?.onClick(); }} style={{ marginTop: "12px", padding: "8px 16px", backgroundColor: "#0091ae", color: "white", border: "none", borderRadius: "4px", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>
                      {section.emptyState.action.label}
                    </button>
                  )}
                </div>
              ) : null
            ) : section.isLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "24px",
                  color: "#141414",
                }}
              >
                <RefreshCw
                  size={16}
                  className="spin"
                  style={{ marginRight: "8px" }}
                />
                Loading...
              </div>
            ) : section.customContent ? (
              section.customContent
            ) : section.fields && section.fields.length > 0 ? (
              <div>
                {section.fields.map((field, index) =>
                  renderField(field, index),
                )}
              </div>
            ) : section.emptyState ? (
              <div
                style={{
                  padding: "32px 20px",
                  textAlign: "center",
                }}
              >
                {EmptyIcon && (
                  <EmptyIcon
                    size={48}
                    style={{ color: "#cbd5e0", marginBottom: "16px" }}
                  />
                )}
                <p
                  style={{
                    fontSize: "14px",
                    color: "#718096",
                    margin: section.emptyState.action ? "0 0 20px 0" : 0,
                    lineHeight: "1.6",
                  }}
                >
                  {section.emptyState.message}
                </p>
                {section.emptyState.action && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      section.emptyState?.action?.onClick();
                    }}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#0091ae",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#007a8c";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#0091ae";
                    }}
                  >
                    {section.emptyState.action.label}
                  </button>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>
        {`
          @keyframes slideInRight {
            from { 
              transform: translateX(20px);
              opacity: 0;
            }
            to { 
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes slideInUp {
            from { 
              transform: translateY(20px);
              opacity: 0;
            }
            to { 
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .spin {
            animation: spin 1s linear infinite;
          }
          
          .sidebar-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .sidebar-scrollbar::-webkit-scrollbar-track {
            background: #f7fafc;
          }
          .sidebar-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 4px;
          }
          .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
          }

          .quick-action-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 11px 10px;
            background: #ffffff;
            border: 1px solid #8a8a8a;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s ease;
            width: 40px;
            height: 40px;
            position: relative;
          }

          .quick-action-btn:not(.disabled):hover {
            background-color: #f7fafc;
            border-color: #cbd5e0;
            transform: translateY(-2px);
          }

          .quick-action-btn.disabled {
            background-color: rgb(245, 245, 245);
            border-color: rgb(230, 230, 230);
            color: rgb(138, 138, 138);
            cursor: not-allowed;
          }

          .quick-action-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
          }

          .quick-action-label {
            font-size: 12px;
            color: #141414;
            font-weight: '500';
            white-space: nowrap;
            text-align: center;
          }

          .contact-info-link {
            color: '#0091ae';
            text-decoration: none;
            font-size: 14px;
            font-weight: 400;
          }

          .contact-info-link:hover {
            text-decoration: underline;
          }
        `}
      </style>

      {/* Notes Modal - Rendered as floating window */}
      <NotesModal
        isOpen={showNotesModal}
        onClose={handleNoteClose}
        recordName={title}
        onSave={handleNoteSave}
      />

      {/* Email Modal - Rendered as floating window */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={handleEmailClose}
        recipientEmail={emailList}
        recipientName={title}
        senderEmail={senderEmail}
        senderName={senderName}
        onSend={(emailData) => handleEmailSend(emailData, record)}
      />

      {/* Task Modal - Rendered as floating window */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={handleTaskClose}
        assignedTo={title}
        assignedToName={title}
        onSave={handleTaskSave}
      />

      {/* Call Modal - Rendered as floating dropdown */}
      <CallModal
        isOpen={showCallModal}
        onClose={handleCallClose}
        contactName={title}
        phoneNumbers={phoneList}
        company={company}
        callerNumber={callerNumber}
        onCall={handleCall}
      />

      <DeviceSelectionModal
        show={showDeviceSelectionModal}
        onHide={() => {
          setShowDeviceSelectionModal(false);
          setAvailableDevices([]);
          setPendingDialedNumber("");
        }}
        devices={availableDevices}
        onSelectDevice={handleDeviceSelect}
        extensionNumber={ctiUserAddress ?? ""}
        userAddress={ctiUserAddress}
      />

      {/* Meeting Modal - Rendered as floating window */}
      <MeetingModal
        isOpen={showMeetingModal}
        onClose={handleMeetingClose}
        hostEmail={senderEmail}
        hostName={senderName}
        attendeeEmail={emailList}
        attendeeName={title}
        onSchedule={(meetingData) => handleMeetingSchedule(meetingData, record)}
      />

      {/* More Actions Modal */}
      <MoreActionsModal
        isOpen={showMoreModal}
        onClose={handleMoreClose}
        position={moreModalPosition}
        onActionSelect={handleMoreActionSelect}
      />

      <div
        style={{
          width,
          backgroundColor: "#f0f0f0",
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 43px)",
          maxHeight: "calc(100vh - 43px)",
          overflow: "hidden",
          animation: "slideInRight 0.3s ease-out",
          flexShrink: 0,
          marginTop: "43px",
          position: "relative",
        }}
      >
        {/* Fixed Top Bar - Title and Close (Non-scrollable) */}
        <div
          style={{
            padding: "20px 24px",
            border: "1px solid #cccccc",
            backgroundColor: "#ffffff",
            flexShrink: 0,
            borderRadius: "10px 10px 0 0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "500",
                color: "#141414",
                margin: 0,
              }}
            >
              {title}
            </h2>

            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#718096",
                  transition: "all 0.2s",
                  borderRadius: "4px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#2d3748";
                  e.currentTarget.style.backgroundColor = "#f7fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#718096";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div
          className="sidebar-scrollbar"
          style={{
            flex: 1,
            overflowY: "auto",
            backgroundColor: "#f0f0f0",
            maxHeight: "calc(100vh - 217px)",
            borderBottom: "1px solid #cccccc",
            borderRadius: "0 0 10px 10px",
          }}
        >
          {/* Contact & Actions Section */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "16px 24px",
              marginBottom: "12px",
              borderLeft: "1px solid #cccccc",
              borderRight: "1px solid #cccccc",
              borderBottom: "1px solid #cccccc",
              borderRadius: "0 0 10px 10px",
            }}
          >
            {/* Record Link and Actions */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
                paddingBottom: "10px",
              }}
            >
              {recordLink && (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    recordLink.onClick();
                  }}
                  style={{
                    fontSize: "14px",
                    color: "#006162",
                    textDecoration: "underline",
                    fontWeight: "500",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#007a8c";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#0091ae";
                  }}
                >
                  {recordLink.label}
                </a>
              )}

              {actionsDropdown && (
                <div style={{ position: "relative" }} ref={dropdownRef}>
                  <button
                    onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                    style={{
                      padding: "6px 14px",
                      backgroundColor: "transparent",
                      border: "none",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#141414",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f7fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {actionsDropdown.label}
                    <ChevronDown size={14} />
                  </button>

                  {showActionsDropdown && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        marginTop: "4px",
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "5px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        minWidth: "180px",
                        zIndex: 1000,
                        overflow: "hidden",
                      }}
                    >
                      {actionsDropdown.items.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            item.onClick();
                            setShowActionsDropdown(false);
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 16px",
                            backgroundColor: "transparent",
                            border: "none",
                            textAlign: "left",
                            fontSize: "14px",
                            color: "#141414",
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f7fafc";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Permission Message */}
            {permissionMessage && (
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: "5px",
                  fontSize: "13px",
                  color: "#92400e",
                  marginBottom: "16px",
                  lineHeight: "1.5",
                }}
              >
                {permissionMessage}
              </div>
            )}

            {/* Avatar and Name Section */}
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                {avatar && (
                  <div
                    style={{
                      width: "40px",
                      height: "37px",
                      borderRadius: "26px",
                      background: "#efe7f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "400",
                      color: "#141414",
                      flexShrink: 0,
                      backgroundImage: avatar.imageUrl
                        ? `url(${avatar.imageUrl})`
                        : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {!avatar.imageUrl &&
                      (avatar.initials ||
                        avatar.name.substring(0, 2).toUpperCase())}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <h1
                    style={{
                      fontSize: "22px",
                      fontWeight: "500",
                      color: "#141414",
                      margin: "0 0 4px 0",
                      lineHeight: "1.3",
                    }}
                  >
                    {title}
                  </h1>
                </div>
              </div>

              {/* Emails - multiple records */}
              {emailList.length > 0 &&
                emailList.map((em, idx) => (
                  <div
                    key={`email-${idx}-${em}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <a
                      href={`mailto:${em}`}
                      style={{
                        fontSize: "14px",
                        color: "#0091ae",
                        textDecoration: "none",
                        fontWeight: "400",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = "underline";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = "none";
                      }}
                    >
                      {em}
                    </a>
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      <button
                        onClick={() => copyToClipboard(em)}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: "4px",
                          cursor: "pointer",
                          color: "#718096",
                          display: "flex",
                          alignItems: "center",
                          borderRadius: "3px",
                        }}
                        title="Copy email"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f7fafc";
                          e.currentTarget.style.color = "#2d3748";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#718096";
                        }}
                      >
                        <Copy size={14} />
                      </button>
                      <a
                        href={`mailto:${em}`}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: "4px",
                          cursor: "pointer",
                          color: "#718096",
                          display: "flex",
                          alignItems: "center",
                          borderRadius: "3px",
                          textDecoration: "none",
                        }}
                        title="Send email"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f7fafc";
                          e.currentTarget.style.color = "#2d3748";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#718096";
                        }}
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                ))}

              {/* Phones - multiple records */}
              {phoneList.length > 0 &&
                phoneList.map((ph, idx) => (
                  <div
                    key={`phone-${idx}-${ph}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#141414",
                          fontWeight: "400",
                          marginBottom: "1px",
                        }}
                      >
                        {phoneList.length > 1 ? `Phone ${idx + 1}` : "Phone Number"}
                      </p>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#141414",
                          fontWeight: "400",
                        }}
                      >
                        {ph}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(ph)}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: "4px",
                        cursor: "pointer",
                        color: "#718096",
                        display: "flex",
                        alignItems: "center",
                        borderRadius: "3px",
                      }}
                      title="Copy phone"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f7fafc";
                        e.currentTarget.style.color = "#2d3748";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#718096";
                      }}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                ))}
              {phoneList.length > 0 && (
                <div style={{ marginBottom: "16px" }} />
              )}
            </div>

            {/* Quick Actions */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "23px",
                paddingTop: "5px",
                flexWrap: "wrap",
              }}
            >
              {processedQuickActions.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <div key={action.id} className="quick-action-wrapper">
                    <button
                      ref={action.id === "more" ? moreButtonRef : undefined}
                      onClick={(e) => {
                        if (!action.disabled) {
                          action.onClick(e);
                          onQuickActionClick?.(action.id);
                        }
                      }}
                      className={`quick-action-btn ${action.disabled ? "disabled" : ""}`}
                      title={action.label}
                      disabled={action.disabled}
                    >
                      <ActionIcon
                        size={20}
                        color={action.disabled ? "#cbd5e0" : "#718096"}
                      />
                    </button>
                    <span className="quick-action-label">{action.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Breeze Record Summary */}
          {breezeRecordSummary && (
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                marginBottom: "12px",
                overflow: "hidden",
                border: "1px solid #cccccc",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 20px",
                  cursor: "pointer",
                  backgroundColor: "#ffffff",
                }}
                onClick={() => toggleSection("breeze-summary")}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <ChevronDown
                    size={18}
                    style={{
                      color: "#141414",
                      transform: collapsedSections.has("breeze-summary")
                        ? "rotate(-90deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#141414",
                      margin: 0,
                      lineHeight: "1.2",
                    }}
                  >
                    Breeze record summary
                  </h3>
                  <div
                    style={{
                      padding: "3px 10px",
                      background:
                        "linear-gradient(114deg, rgb(255, 56, 66) 0%, rgb(210, 6, 136) 100%)",
                      color: "white",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "600",
                      textTransform: "uppercase",
                    }}
                  >
                    AI
                  </div>
                </div>
              </div>

              {!collapsedSections.has("breeze-summary") && (
                <div
                  style={{
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      color: "#141414",
                      marginBottom: "12px",
                    }}
                  >
                    <span>{breezeRecordSummary.timestamp}</span>
                    {breezeRecordSummary.onRefresh && (
                      <button
                        onClick={breezeRecordSummary.onRefresh}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: "2px",
                          cursor: "pointer",
                          color: "#141414",
                          display: "flex",
                          alignItems: "center",
                        }}
                        title="Refresh"
                      >
                        <RefreshCw size={12} />
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      color: "#141414",
                      lineHeight: "1.6",
                      marginBottom: "16px",
                      border: "1px solid #ff9fcc",
                      padding: "18px 20px",
                      borderRadius: "5px",
                    }}
                  >
                    {breezeRecordSummary.content}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      paddingTop: "12px",
                      borderTop: "1px solid #fee",
                    }}
                  >
                    {breezeRecordSummary.onThumbsUp && (
                      <button
                        onClick={breezeRecordSummary.onThumbsUp}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: "6px",
                          cursor: "pointer",
                          color: "#141414",
                          display: "flex",
                          alignItems: "center",
                          borderRadius: "3px",
                        }}
                        title="Good summary"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f7fafc";
                          e.currentTarget.style.color = "#2d3748";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#718096";
                        }}
                      >
                        <ThumbsUp size={16} />
                      </button>
                    )}
                    {breezeRecordSummary.onThumbsDown && (
                      <button
                        onClick={breezeRecordSummary.onThumbsDown}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: "6px",
                          cursor: "pointer",
                          color: "#141414",
                          display: "flex",
                          alignItems: "center",
                          borderRadius: "3px",
                        }}
                        title="Bad summary"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f7fafc";
                          e.currentTarget.style.color = "#2d3748";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#718096";
                        }}
                      >
                        <ThumbsDown size={16} />
                      </button>
                    )}
                    {breezeRecordSummary.onCopy && (
                      <button
                        onClick={breezeRecordSummary.onCopy}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: "6px",
                          cursor: "pointer",
                          color: "#141414",
                          display: "flex",
                          alignItems: "center",
                          borderRadius: "3px",
                        }}
                        title="Copy"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f7fafc";
                          e.currentTarget.style.color = "#2d3748";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#718096";
                        }}
                      >
                        <Copy size={16} />
                      </button>
                    )}
                  </div>

                  {breezeRecordSummary.onAskQuestion && (
                    <button
                      onClick={breezeRecordSummary.onAskQuestion}
                      style={{
                        marginTop: "16px",
                        width: "36%",
                        padding: "6px 0",
                        backgroundColor: "transparent",
                        border: "1px solid #d20688",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "#d20688",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "5px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#fff5f7";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <Sparkles size={16} />
                      Ask a question
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sections */}
          {processedSections.map((section) => renderSection(section))}
        </div>
      </div>

      {/* WhatsApp Message Modal */}
      <WhatsAppMessageModal
        isOpen={showWhatsAppModal}
        onClose={handleWhatsAppClose}
        associatedRecords={title ? [title] : []}
        onSave={handleWhatsAppLog}
      />

      {/* SMS Message Modal */}
      <LogSmsModal
        isOpen={showSmsModal}
        onClose={handleSmsClose}
        associatedRecords={title ? [title] : []}
        onSave={handleSmsLog}
      />
    </>
  );
};

export default GenericSidebar;
