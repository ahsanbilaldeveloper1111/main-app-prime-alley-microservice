"use client";

import React, { useEffect, useRef } from "react";
import { X, ChevronDown, ExternalLink, Info } from "lucide-react";

const FONT = "'Lexend Deca', Helvetica, Arial, sans-serif";

interface AssociateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskName?: string;
  onAddAssociations?: () => void;
  onMarkComplete?: () => void;
  onSkipTask?: () => void;
}

export default function AssociateTaskModal({
  isOpen,
  onClose,
  taskName = "AI bot offer",
  onAddAssociations,
  onMarkComplete,
  onSkipTask,
}: AssociateTaskModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Close on backdrop click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "500px",
          margin: "0 16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: "1px solid #e5e5e5",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 700,
              color: "#141414",
              fontFamily: FONT,
              letterSpacing: "-0.2px",
            }}
          >
            Associate task with a record
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#666",
              borderRadius: "4px",
              transition: "background 150ms ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f0f0f0")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "20px 24px 24px" }}>
          {/* Description text */}
          <p
            style={{
              margin: "0 0 20px",
              fontSize: "14px",
              fontWeight: 400,
              color: "#141414",
              lineHeight: "20px",
              fontFamily: FONT,
            }}
          >
            The next task{" "}
            <a
              href="#"
              style={{
                color: "#141414",
                fontWeight: 700,
                textDecoration: "underline",
                textDecorationColor: "#141414",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                cursor: "pointer",
              }}
            >
              {taskName}
              <ExternalLink size={12} style={{ flexShrink: 0 }} />
            </a>{" "}
            isn't associated with a record yet. Skip or complete this task below
            to continue.
          </p>

          {/* Label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#141414",
                fontFamily: FONT,
              }}
            >
              Associate with records
            </span>
            <Info size={14} color="#888" />
          </div>

          {/* Dropdown */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid #adadad",
              borderRadius: "4px",
              padding: "10px 14px",
              cursor: "pointer",
              backgroundColor: "#ffffff",
              marginBottom: "24px",
              transition: "border-color 150ms ease",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLDivElement).style.borderColor = "#141414")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLDivElement).style.borderColor = "#adadad")
            }
          >
            <span
              style={{
                fontSize: "14px",
                color: "#141414",
                fontFamily: FONT,
                fontWeight: 400,
              }}
            >
              Associated with 0 records
            </span>
            <ChevronDown size={18} color="#444" />
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            {/* Add associations - outlined / disabled-looking */}
            <button
              onClick={onAddAssociations}
              style={{
                cursor: "pointer",
                transition: "150ms ease-out",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#e6e6e6",
                border: "1px solid rgb(138, 138, 138)",
                color: "#141414",
                borderRadius: "4px",
                padding: "9px 16px",
                fontFamily: FONT,
                fontSize: "13px",
                fontWeight: 400,
                lineHeight: "16px",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#d4d4d4")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#e6e6e6")
              }
            >
              Add associations
            </button>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Mark complete */}
            <button
              onClick={onMarkComplete}
              style={{
                cursor: "pointer",
                transition: "150ms ease-out",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ffffff",
                border: "1px solid rgb(138, 138, 138)",
                color: "#141414",
                borderRadius: "4px",
                padding: "9px 16px",
                fontFamily: FONT,
                fontSize: "13px",
                fontWeight: 600,
                lineHeight: "16px",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f5f5f5")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#ffffff")
              }
            >
              Mark complete
            </button>

            {/* Skip task */}
            <button
              onClick={onSkipTask}
              style={{
                cursor: "pointer",
                transition: "150ms ease-out",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ffffff",
                border: "1px solid rgb(138, 138, 138)",
                color: "#141414",
                borderRadius: "4px",
                padding: "9px 16px",
                fontFamily: FONT,
                fontSize: "13px",
                fontWeight: 600,
                lineHeight: "16px",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f5f5f5")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#ffffff")
              }
            >
              Skip task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
