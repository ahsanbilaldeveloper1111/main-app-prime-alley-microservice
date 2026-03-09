import React from "react";
import { ChevronDown, RefreshCw, ThumbsUp, ThumbsDown, Copy, Sparkles } from "lucide-react";
import { toast } from "react-toastify";

interface CrmRecordSummarySectionProps {
  isCollapsed: boolean;
  onToggle: () => void;
  /** Main summary text; when empty/null, a fallback "No summary available." is shown. */
  summary?: string | null;
  /** Optional label shown before the summary, e.g. "Updated Feb 14, 2026" or "Generated Feb 14, 2026". */
  metaLabel?: string;
  /** Called when the refresh icon is clicked. If not provided, the icon is still shown but does nothing. */
  onRefreshClick?: () => void;
  /** Optional override for the card title (default: "Record summary"). */
  title?: string;
}

const CrmRecordSummarySection: React.FC<CrmRecordSummarySectionProps> = ({
  isCollapsed,
  onToggle,
  summary,
  metaLabel,
  onRefreshClick,
  title = "Record summary",
}) => {
  const hasSummary = typeof summary === "string" && summary.trim().length > 0;

  const handleCopy = () => {
    const text = summary?.trim();
    if (!text) {
      toast.error("Nothing to copy");
      return;
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      toast.success("Copied to clipboard");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to copy summary", err);
      toast.error("Failed to copy. Please try again.");
    }
  };

  const handleAsk = () => {
    globalThis.window?.dispatchEvent(new CustomEvent("breeze-assistant:open"));
  };

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #cccccc",
        borderRadius: "10px",
        marginBottom: "20px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          cursor: "pointer",
          borderBottom: isCollapsed ? "none" : "1px solid #eaf0f6",
        }}
        onClick={onToggle}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ChevronDown
            size={18}
            style={{
              color: "#141414",
              transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#141414",
              margin: 0,
            }}
          >
            {title}
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

      {!isCollapsed && (
        <div style={{ padding: "20px" }}>
          {hasSummary ? (
            <>
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
                {metaLabel && <span>{metaLabel}</span>}
                <button
                  onClick={onRefreshClick}
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
              </div>

              <div
                style={{
                  fontSize: "14px",
                  color: "#141414",
                  lineHeight: "1.6",
                  marginBottom: "16px",
                  border: "1px solid #ff9fcc",
                  padding: "18px 20px",
                  borderRadius: "10px",
                }}
              >
                {summary}
              </div>
            </>
          ) : (
            <div style={{ fontSize: "14px", color: "#718096" }}>
              No summary available.
            </div>
          )}

          {hasSummary && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                paddingTop: "12px",
                borderTop: "1px solid #fee",
              }}
            >
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
                title="Good summary"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f7fafc";
                  e.currentTarget.style.color = "#2d3748";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#141414";
                }}
              >
                <ThumbsUp size={16} />
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
                title="Bad summary"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f7fafc";
                  e.currentTarget.style.color = "#2d3748";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#141414";
                }}
              >
                <ThumbsDown size={16} />
              </button>
              <button
                onClick={handleCopy}
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
                  e.currentTarget.style.color = "#141414";
                }}
              >
                <Copy size={16} />
              </button>
            </div>
          )}

          {hasSummary && (
            <button
              style={{
                marginTop: "16px",
                padding: "6px 16px",
                backgroundColor: "transparent",
                border: "1px solid #d20688",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "500",
                color: "#d20688",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "#fff5f7";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "transparent";
              }}
              onClick={handleAsk}
            >
              <Sparkles size={16} />
              Ask a question
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CrmRecordSummarySection;

