import React from "react";

import type { ChatUserRateLimitView } from "@page-modules/chat/shared/mapChatRateLimit";

const intFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function limitTone(remaining: number, limit: number): string {
  if (limit <= 0) return "#4a5568";
  const ratio = remaining / limit;
  if (ratio <= 0.1) return "#dc2626";
  if (ratio <= 0.25) return "#d97706";
  return "#4a5568";
}

export const AssistantRateLimitBar: React.FC<{
  rateLimit: ChatUserRateLimitView | null;
  isLoading?: boolean;
}> = ({ rateLimit, isLoading }) => {
  if (isLoading) {
    return (
      <span style={{ fontSize: "12px", color: "#718096", fontWeight: 500 }}>
        Loading message limits…
      </span>
    );
  }

  if (!rateLimit) {
    return (
      <span style={{ fontSize: "12px", color: "#a0aec0" }}>
        Message limits unavailable
      </span>
    );
  }

  const {
    perMinuteRemaining,
    perMinuteLimit,
    perDayRemaining,
    perDayLimit,
    hasUsageCounts,
  } = rateLimit;

  if (!hasUsageCounts) {
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "4px 12px",
          fontSize: "12px",
          lineHeight: 1.45,
          color: "#4a5568",
          fontWeight: 500,
          textAlign: "center",
        }}
        aria-live="polite"
      >
        <span>
          Limit: <strong>{intFmt.format(perMinuteLimit)}</strong> messages per
          minute
        </span>
        <span style={{ color: "#cbd5e0" }} aria-hidden>
          ·
        </span>
        <span>
          <strong>{intFmt.format(perDayLimit)}</strong> per day
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "4px 12px",
        fontSize: "12px",
        lineHeight: 1.45,
        textAlign: "center",
        fontWeight: 500,
      }}
      aria-live="polite"
    >
      <span style={{ color: limitTone(perMinuteRemaining, perMinuteLimit) }}>
        <strong>{intFmt.format(perMinuteRemaining)}</strong>
        {" of "}
        {intFmt.format(perMinuteLimit)} messages left this minute
      </span>
      <span style={{ color: "#cbd5e0" }} aria-hidden>
        ·
      </span>
      <span style={{ color: limitTone(perDayRemaining, perDayLimit) }}>
        <strong>{intFmt.format(perDayRemaining)}</strong>
        {" of "}
        {intFmt.format(perDayLimit)} left today
      </span>
    </div>
  );
};
