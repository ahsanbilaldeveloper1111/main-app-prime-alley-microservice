"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Bell, ChevronDown, Smile, Link2 } from "lucide-react";

const FONT    = "'Lexend Deca', Helvetica, Arial, sans-serif";
const PRIMARY = "rgb(20, 20, 20)";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuditSidebarField {
  label: string;
  value: string | React.ReactNode;
  isUser?: boolean;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  /** Show info (ℹ) icon next to label */
  infoIcon?: boolean;
  /** Render a thicker section-break divider after this field */
  sectionBreakAfter?: boolean;
}

export interface AuditLogSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  fields: AuditSidebarField[];
  onSaveComment?: (comment: string) => void;
}

// ─── User avatar block ────────────────────────────────────────────────────────

function UserAvatar({ name, email, avatarUrl }: { name: string; email?: string; avatarUrl?: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
      <div style={{
        width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
        background: avatarUrl ? `url(${avatarUrl}) center/cover` : "linear-gradient(135deg, #4f8ef7 0%, #2ecc71 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "13px", fontWeight: 700, color: "#fff", fontFamily: FONT,
      }}>
        {!avatarUrl && initials}
      </div>
      <div>
        <div style={{ fontSize: "14px", fontWeight: 500, color: "#0070d2", fontFamily: FONT, cursor: "pointer" }}>
          {name}
        </div>
        {email && (
          <div style={{ fontSize: "12px", color: "#666", fontFamily: FONT, fontWeight: 300 }}>
            {email}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── People illustration SVG (empty comments state) ──────────────────────────

function PeopleIllustration() {
    return (
      <svg width="140" height="120" viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background circles - decorative */}
        <circle cx="70" cy="50" r="45" fill="#f0f4ff" opacity="0.5" />
        <circle cx="85" cy="35" r="20" fill="#e8f0fe" opacity="0.6" />
        
        {/* Main message bubble (large) */}
        <g>
          <rect x="30" y="35" width="60" height="42" rx="8" fill="#6366f1" />
          <path d="M 50 77 L 45 85 L 55 77 Z" fill="#6366f1" />
          {/* Message lines */}
          <line x1="40" y1="45" x2="70" y2="45" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
          <line x1="40" y1="53" x2="80" y2="53" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
          <line x1="40" y1="61" x2="65" y2="61" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
        </g>
        
        {/* Secondary message bubble (small, top right) */}
        <g>
          <rect x="75" y="20" width="48" height="34" rx="7" fill="#a5b4fc" />
          <path d="M 110 54 L 115 60 L 107 54 Z" fill="#a5b4fc" />
          {/* Message lines */}
          <line x1="83" y1="29" x2="107" y2="29" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.95" />
          <line x1="83" y1="36" x2="115" y2="36" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.95" />
          <line x1="83" y1="43" x2="100" y2="43" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.95" />
        </g>
        
        {/* Tertiary message bubble (small, left) */}
        <g>
          <rect x="15" y="60" width="40" height="28" rx="6" fill="#c7d2fe" />
          <path d="M 25 88 L 20 95 L 30 88 Z" fill="#c7d2fe" />
          {/* Message lines */}
          <line x1="22" y1="68" x2="45" y2="68" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.95" />
          <line x1="22" y1="74" x2="48" y2="74" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.95" />
          <line x1="22" y1="80" x2="38" y2="80" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.95" />
        </g>
        
        {/* Floating dots - indicating activity/typing */}
        <g opacity="0.6">
          <circle cx="100" cy="75" r="3" fill="#6366f1">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="110" cy="75" r="3" fill="#6366f1">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" begin="0.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="120" cy="75" r="3" fill="#6366f1">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" begin="0.4s" repeatCount="indefinite" />
          </circle>
        </g>
        
        {/* Decorative plus/add icons */}
        <g opacity="0.4">
          <path d="M 20 25 L 20 30 M 17.5 27.5 L 22.5 27.5" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
          <path d="M 125 90 L 125 95 M 122.5 92.5 L 127.5 92.5" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
        </g>
        
        {/* Ground shadow */}
        <ellipse cx="70" cy="108" rx="50" ry="6" fill="#e0e7ff" opacity="0.4" />
      </svg>
    );
  }

// ─── Rich text comment editor (matches Image 1 toolbar exactly) ──────────────

function CommentEditor({ onChange }: { onChange: (v: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (document as any).execCommand(cmd, false, val ?? null);
  };

  const toolbarItems = [
    { label: "B",  title: "Bold",          action: () => exec("bold"),          style: { fontWeight: 700, fontSize: "13px" } },
    { label: "I",  title: "Italic",        action: () => exec("italic"),        style: { fontStyle: "italic", fontSize: "13px" } },
    { label: "U",  title: "Underline",     action: () => exec("underline"),     style: { textDecoration: "underline", fontSize: "13px" } },
    { label: "I̶",  title: "Strikethrough", action: () => exec("strikeThrough"), style: { textDecoration: "line-through", fontSize: "12px" } },
  ];

  return (
    <div style={{
      border: `1px solid ${isFocused ? "#a0a0a0" : "#d8d8d8"}`,
      borderRadius: "6px",
      fontFamily: FONT,
      transition: "border-color 150ms ease",
      backgroundColor: "#fff",
    }}>
      {/* Placeholder text area */}
      <div style={{ position: "relative" }}>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onInput={() => onChange(editorRef.current?.innerHTML ?? "")}
          style={{
            minHeight: "72px",
            padding: "14px 16px 8px",
            fontSize: "13px",
            fontFamily: FONT,
            fontWeight: 300,
            color: PRIMARY,
            outline: "none",
            lineHeight: "20px",
          }}
          data-placeholder="Write a comment. Send your colleague a notification by typing @ followed by their name."
        />
        <style>{`
          [data-placeholder]:empty:before {
            content: attr(data-placeholder);
            color: #aaa;
            pointer-events: none;
            font-size: 13px;
            font-weight: 300;
            font-family: ${FONT};
            line-height: 20px;
          }
          [data-placeholder]:empty:before span {
            color: #0070d2;
          }
        `}</style>
      </div>

      {/* Toolbar — matches image exactly: B I U strikethrough | bullet dropdown | link | emoji */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "2px",
        padding: "6px 10px 10px",
        borderTop: "none",
        flexWrap: "wrap",
      }}>
        {toolbarItems.map((btn) => (
          <button
            key={btn.label}
            title={btn.title}
            onMouseDown={(e) => { e.preventDefault(); btn.action(); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "4px 6px", borderRadius: "3px", color: "#555",
              fontFamily: "serif", display: "flex", alignItems: "center",
              ...btn.style,
            }}
          >
            {btn.label}
          </button>
        ))}

        {/* Divider */}
        <div style={{ width: "1px", height: "16px", backgroundColor: "#e0e0e0", margin: "0 4px" }} />

        {/* Bullet list with dropdown */}
        <button
          title="Bullet list"
          onMouseDown={(e) => { e.preventDefault(); exec("insertUnorderedList"); }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 2px", color: "#555", display: "flex", alignItems: "center", gap: "1px" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="2" cy="4" r="1.5" fill="currentColor"/>
            <rect x="5" y="3" width="8" height="2" rx="1" fill="currentColor"/>
            <circle cx="2" cy="8" r="1.5" fill="currentColor"/>
            <rect x="5" y="7" width="8" height="2" rx="1" fill="currentColor"/>
            <circle cx="2" cy="12" r="1.5" fill="currentColor"/>
            <rect x="5" y="11" width="8" height="2" rx="1" fill="currentColor"/>
          </svg>
          <ChevronDown size={10} color="#888" />
        </button>

        {/* Link */}
        <button
          title="Insert link"
          onMouseDown={(e) => {
            e.preventDefault();
            const url = prompt("Enter URL");
            if (url) exec("createLink", url);
          }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", color: "#555", display: "flex", alignItems: "center" }}
        >
          <Link2 size={13} />
        </button>

        {/* Emoji */}
        <button
          title="Emoji"
          onMouseDown={(e) => { e.preventDefault(); }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", color: "#555", display: "flex", alignItems: "center" }}
        >
          <Smile size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function AuditLogSidebar({
  isOpen,
  onClose,
  title = "Additional details",
  fields,
  onSaveComment,
}: AuditLogSidebarProps) {
  const [activeTab, setActiveTab] = useState<"details" | "comments">("details");
  const [comment,   setComment]   = useState("");

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.22)", zIndex: 1200 }}
      />

      {/* Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed", top: 0, right: 0,
          height: "100vh", width: "574px", maxWidth: "100vw",
          backgroundColor: "#fff", zIndex: 99999,
          display: "flex", flexDirection: "column",
          boxShadow: "-4px 0 32px rgba(0,0,0,0.13)",
          fontFamily: FONT,
        }}
      >
        {/* ── Header ── */}
        <div style={{ padding: "22px 24px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <h2 style={{
              margin: 0, color: PRIMARY,
              fontSize: "20px", fontWeight: 600, lineHeight: "24px", fontFamily: FONT,
            }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: "2px", display: "flex" }}
              aria-label="Close"
            >
              <X size={20} strokeWidth={1.8} />
            </button>
          </div>

          {/* Full-width tabs — each 50%, centered text */}
          <div style={{ display: "flex", borderBottom: "1px solid #e5e5e5" }}>
            {(["Details", "Comments"] as const).map((tab) => {
              const key = tab.toLowerCase() as "details" | "comments";
              const isActive = activeTab === key;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(key)}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    borderBottom: isActive ? `2px solid ${PRIMARY}` : "2px solid transparent",
                    marginBottom: "-1px",
                    cursor: "pointer",
                    padding: "10px 0 12px",
                    fontWeight: isActive ? 600 : 500,
                    fontSize: "14px",
                    color: isActive ? PRIMARY : "#888",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                    fontFamily: FONT,
                    transition: "color 150ms ease, border-color 150ms ease",
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

          {/* ════ DETAILS TAB ════ */}
          {activeTab === "details" && (
            <div style={{ padding: "0 40px 32px" }}>
              {fields.map((field, i) => (
                <React.Fragment key={i}>
                  <div style={{ padding: "10px 0" }}>
                    {/* Label row */}
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
                      <span style={{
                        fontWeight: 500, color: PRIMARY,
                        fontSize: "0.875rem", fontFamily: FONT, lineHeight: "20px",
                      }}>
                        {field.label}
                      </span>
                      {field.infoIcon && (
                        <span style={{
                          width: "15px", height: "15px", borderRadius: "50%",
                          border: "1px solid #999", display: "inline-flex",
                          alignItems: "center", justifyContent: "center",
                          fontSize: "10px", color: "#666", flexShrink: 0, lineHeight: 1,
                        }}>
                          i
                        </span>
                      )}
                    </div>

                    {/* Value */}
                    {field.isUser && field.userName ? (
                      <UserAvatar
                        name={field.userName}
                        email={field.userEmail}
                        avatarUrl={field.userAvatar}
                      />
                    ) : (
                      <div style={{
                        color: PRIMARY, fontFamily: FONT,
                        fontSize: "14px", fontWeight: 300,
                        letterSpacing: "0px", lineHeight: "24px",
                      }}>
                        {field.value}
                      </div>
                    )}
                  </div>
                  {/* Divider — thicker section break or normal thin line */}
                  {i < fields.length - 1 && (
                    field.sectionBreakAfter
                      ? <div style={{ height: "1px", backgroundColor: "#cccccc", margin: "0px" }} />
                      : <div style={{ height: "1px", backgroundColor: "#eeeeee" }} />
                  )}
                </React.Fragment>
              ))}
              {/* Bottom border after last item */}
              <div style={{ height: "1px", backgroundColor: "#eeeeee" }} />
            </div>
          )}

          {/* ════ COMMENTS TAB ════ */}
          {activeTab === "comments" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 40px" }}>

              {/* Open comments filter row */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 0 14px", borderBottom: "1px solid #f0f0f0",
              }}>
                <button style={{
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "4px",
                  fontSize: "13px", fontWeight: 500, color: PRIMARY, fontFamily: FONT, padding: 0,
                }}>
                  Open comments
                  <ChevronDown size={13} color={PRIMARY} />
                </button>

                {/* Bell icon button */}
                <button style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  border: "1px solid #e0e0e0", background: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#666",
                }}>
                  <Bell size={14} strokeWidth={1.5} />
                </button>
              </div>

              {/* Empty state — illustration + text, fills available space */}
              <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                textAlign: "center", padding: "32px 0 16px",
              }}>
                <PeopleIllustration />
                <div style={{
                  fontSize: "15px", fontWeight: 700, color: PRIMARY,
                  fontFamily: FONT, marginTop: "20px", marginBottom: "10px",
                  lineHeight: "22px",
                }}>
                  There are no comments on this audit log
                </div>
                <div style={{
                  fontSize: "13px", fontWeight: 300, color: "#555",
                  fontFamily: FONT, lineHeight: "20px", maxWidth: "320px",
                }}>
                  Collaborate with coworkers with comments. Leave a comment below
                  and notify a coworker using{" "}
                  <strong style={{ fontWeight: 700 }}>@mentions</strong>.
                </div>
              </div>

              {/* Comment editor — pinned to bottom */}
              <div style={{ paddingBottom: "20px" }}>
                <CommentEditor onChange={setComment} />
                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  <button
                    onClick={() => { onSaveComment?.(comment); }}
                    style={{
                      padding: "9px 22px",
                      backgroundColor: "#e6e6e6",
                      border: "1px solid #c8c8c8",
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontFamily: FONT,
                      fontWeight: 400,
                      color: "#888",
                      cursor: "pointer",
                    }}
                  >
                    Comment
                  </button>
                  <button
                    onClick={() => {}}
                    style={{
                      padding: "9px 22px",
                      backgroundColor: "#e6e6e6",
                      border: "1px solid #c8c8c8",
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontFamily: FONT,
                      fontWeight: 400,
                      color: "#888",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Example / preview wrapper ────────────────────────────────────────────────

export function AuditLogSidebarExample() {
  const [open, setOpen] = useState(false);

  const fields: AuditSidebarField[] = [
    { label: "Category",      value: "Login" },
    { label: "Subcategory",   value: "Login Succeeded", infoIcon: true },
    { label: "Action",        value: "Perform" },
    {
      label: "Date of change",
      value: (
        <>
          <div>Local: 28 Feb 2026 00:21 GMT+5</div>
          <div>Account: 27 Feb 2026 14:21 EST</div>
        </>
      ),
    },
    {
      label: "Modified by",
      value: "",
      isUser: true,
      userName: "Rizwan Haider",
      userEmail: "rizwan@primealley.com",
      sectionBreakAfter: true,
    },
    { label: "Country",    value: "Pakistan" },
    { label: "Region",     value: "Punjab" },
    { label: "Login Type", value: "Password login" },
    {
      label: "User Agent",
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0",
    },
    { label: "IP Address", value: "223.123.19.243" },
  ];

  return (
    <div style={{ padding: "40px", fontFamily: FONT }}>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "10px 20px", backgroundColor: PRIMARY, color: "#fff",
          border: "none", borderRadius: "6px", cursor: "pointer",
          fontSize: "13px", fontFamily: FONT,
        }}
      >
        Open Audit Log Sidebar
      </button>

      <AuditLogSidebar
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Additional details"
        fields={fields}
        onSaveComment={(c) => console.log("Comment:", c)}
      />
    </div>
  );
}
