import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Maximize2,
  X,
  Link,
  Image,
  Paperclip,
} from "lucide-react";

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail?: string;
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
}

const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  recipientEmail,
  recipientName,
  senderEmail = "user@example.com",
  senderName = "Your Name",
  onSend,
}) => {
  const [toEmails, setToEmails] = useState<string[]>(
    recipientEmail ? [recipientEmail] : [],
  );
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
    if (recipientEmail && !toEmails.includes(recipientEmail)) {
      setToEmails([recipientEmail]);
    }
  }, [recipientEmail]);

  useEffect(() => {
    if (isOpen && emailBodyRef.current) {
      emailBodyRef.current.focus();
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
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* <label style={{ fontSize: '14px', fontWeight: '600', color: '#141414', minWidth: '60px' }}>
              From
            </label>
            <div>
              <span style={{ fontSize: '14px', color: '#141414', fontWeight: '500' }}>
                {senderName}
              </span>
              {' '}
              <span style={{ fontSize: '13px', color: '#718096' }}>
                ({senderEmail})
              </span>
            </div> */}
          </div>
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

export default EmailModal;
