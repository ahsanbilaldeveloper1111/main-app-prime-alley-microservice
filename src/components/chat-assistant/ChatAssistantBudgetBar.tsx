import {
  chatAssistantBudgetBarColor,
  formatChatBudgetUsd,
  type ChatAssistantBudgetView,
} from "@components/chat-assistant/mapChatAssistantBudgetView";
import React from "react";

export type ChatAssistantBudgetBarProps = Readonly<{
  budget: ChatAssistantBudgetView | null | undefined;
  isLoading?: boolean;
  isUnlimited?: boolean;
  identityMissing?: boolean;
  loadError?: boolean;
  compact?: boolean;
}>;

export function ChatAssistantBudgetBar({
  budget,
  isLoading = false,
  isUnlimited = false,
  identityMissing = false,
  loadError = false,
  compact = false,
}: ChatAssistantBudgetBarProps) {
  const padding = compact ? "6px 12px" : "8px 16px";
  const fieldsetStyle: React.CSSProperties = {
    padding,
    border: "none",
    margin: 0,
    minWidth: 0,
    borderBottom: "1px solid #f0f0f0",
    flexShrink: 0,
    backgroundColor: "#ffffff",
  };

  if (isLoading) {
    return (
      <fieldset
        style={{
          padding: compact ? "6px 12px" : "8px 16px",
          border: "none",
          margin: 0,
          minWidth: 0,
          borderBottom: "1px solid #f0f0f0",
          flexShrink: 0,
          backgroundColor: "#ffffff",
        }}
        aria-busy="true"
      >
        <legend className="visually-hidden">Loading monthly budget</legend>
        <div
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: "#e2e8f0",
            animation: "pulse 1.2s ease-in-out infinite",
          }}
          aria-hidden
        />
      </fieldset>
    );
  }

  if (identityMissing) {
    return (
      <fieldset style={fieldsetStyle}>
        <legend className="visually-hidden">Monthly chat budget</legend>
        <div style={{ fontSize: "11px", color: "#a0aec0" }}>
          Monthly budget unavailable (missing tenant or user context).
        </div>
      </fieldset>
    );
  }

  if (loadError) {
    return (
      <fieldset style={fieldsetStyle}>
        <legend className="visually-hidden">Monthly chat budget</legend>
        <div style={{ fontSize: "11px", color: "#a0aec0" }}>
          Monthly budget could not be loaded. Try again in a moment.
        </div>
      </fieldset>
    );
  }

  if (isUnlimited) {
    return (
      <fieldset style={fieldsetStyle}>
        <legend className="visually-hidden">Monthly chat budget</legend>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11.5px",
            color: "#4a5568",
            marginBottom: 4,
          }}
        >
          <span style={{ fontWeight: 600, color: "#2d3748" }}>Monthly budget</span>
          <span style={{ fontWeight: 600, color: "#059669" }}>Unlimited</span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: "#d1fae5",
          }}
          aria-hidden
        />
      </fieldset>
    );
  }

  if (!budget) return null;

  const barColor = chatAssistantBudgetBarColor(budget.variant);
  const remainingLabel = formatChatBudgetUsd(budget.remainingUsd, true);
  const totalLabel = formatChatBudgetUsd(budget.totalUsd);

  return (
    <fieldset style={fieldsetStyle}>
      <legend className="visually-hidden">Monthly chat budget usage</legend>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          fontSize: "11.5px",
          color: "#4a5568",
          marginBottom: 4,
        }}
      >
        <span style={{ fontWeight: 600, color: "#2d3748" }}>Monthly budget</span>
        <span style={{ textAlign: "right" }}>
          <span style={{ fontWeight: 600, color: barColor }}>{remainingLabel}</span>
          <span style={{ color: "#a0aec0" }}> left of </span>
          <span>{totalLabel}</span>
          {budget.isExhausted ? (
            <span style={{ color: barColor, fontWeight: 600 }}> · Exhausted</span>
          ) : null}
        </span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: "#e2e8f0",
          overflow: "hidden",
        }}
        aria-hidden
      >
        <div
          style={{
            height: "100%",
            width: `${budget.usedPct}%`,
            backgroundColor: barColor,
            transition: "width 0.25s ease",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 3,
          fontSize: "10.5px",
          color: "#a0aec0",
        }}
      >
        <span>{budget.usedPct.toFixed(1)}% used</span>
        <span>MTD {formatChatBudgetUsd(budget.spendUsd, true)}</span>
      </div>
    </fieldset>
  );
}
