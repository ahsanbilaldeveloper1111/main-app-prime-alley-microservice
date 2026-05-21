import {
  chatAssistantBudgetBarColor,
  formatChatBudgetUsd,
  type ChatAssistantBudgetView,
} from "@components/chat-assistant/mapChatAssistantBudgetView";
import React from "react";

export type ChatAssistantBudgetBarProps = Readonly<{
  budget: ChatAssistantBudgetView | null | undefined;
  isLoading?: boolean;
  compact?: boolean;
}>;

export function ChatAssistantBudgetBar({
  budget,
  isLoading = false,
  compact = false,
}: ChatAssistantBudgetBarProps) {
  if (isLoading) {
    return (
      <div
        style={{
          padding: compact ? "6px 12px" : "8px 16px",
          borderBottom: "1px solid #f0f0f0",
          flexShrink: 0,
          backgroundColor: "#ffffff",
        }}
        aria-busy="true"
        aria-label="Loading monthly budget"
      >
        <div
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: "#e2e8f0",
            animation: "pulse 1.2s ease-in-out infinite",
          }}
        />
      </div>
    );
  }

  if (!budget) return null;

  const padding = compact ? "6px 12px" : "8px 16px";
  const barColor = chatAssistantBudgetBarColor(budget.variant);
  const remainingLabel = formatChatBudgetUsd(budget.remainingUsd, true);
  const totalLabel = formatChatBudgetUsd(budget.totalUsd);

  return (
    <div
      style={{
        padding,
        borderBottom: "1px solid #f0f0f0",
        flexShrink: 0,
        backgroundColor: "#ffffff",
      }}
      role="group"
      aria-label="Monthly chat budget usage"
    >
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
    </div>
  );
}
