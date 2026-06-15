/**
 * Shared Finesse/agent UI helpers for campaign communications pages.
 */

import { isFinesseAgentOnCallFromRosterState } from "../../finesse";

const FINESSE_TOP_BAR_LOCKED_STATES = new Set([
  "WRAP_UP",
  "ALERTING",
  "RESERVED",
  "RESERVED_OUTBOUND",
  "WORK_NOT_READY",
]);

/** Human-readable Finesse state for badges and call popup (e.g. TALKING → Talking). */
export function formatFinesseStateLabel(raw: string | undefined): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";
  if (trimmed !== trimmed.toUpperCase()) return trimmed;
  return trimmed
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

/** When `treatLoginAsReady`, LOGIN uses the same color as READY (supervisor console). */
export function getCampaignAgentStateColor(
  state: string,
  opts?: { treatLoginAsReady?: boolean },
): string {
  if (opts?.treatLoginAsReady) {
    if (state === "READY" || state === "LOGIN") return "#10b981";
    if (state === "NOT_READY") return "#ef4444";
    return "#6b7280";
  }
  if (state === "READY") return "#10b981";
  if (state === "NOT_READY") return "#ef4444";
  return "#6b7280";
}

/** Elapsed time in state as HH:MM:SS. Optional tick forces re-render when passed from a 1s interval. */
export function formatFinesseStateDuration(
  stateChangeTime?: string,
  _rerenderTick?: number,
): string {
  if (!stateChangeTime) return "00:00:00";
  try {
    const then = new Date(stateChangeTime).getTime();
    const diffMs = Date.now() - then;
    const totalSec = Math.max(0, Math.floor(diffMs / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  } catch {
    return "00:00:00";
  }
}

/** API may return reasonCode as a string or an object e.g. `{ label: string }`. */
export function formatFinesseReasonLabel(reasonCode: unknown): string | null {
  if (reasonCode == null) return null;
  if (typeof reasonCode === "string") {
    const t = reasonCode.trim();
    return t === "" ? null : t;
  }
  if (typeof reasonCode === "object" && reasonCode !== null && "label" in reasonCode) {
    const lab = (reasonCode as { label?: unknown }).label;
    if (typeof lab === "string" && lab.trim() !== "") return lab.trim();
  }
  if (typeof reasonCode === "number" && Number.isFinite(reasonCode)) {
    return String(reasonCode);
  }
  return null;
}

/** TopBar only toggles READY / NOT_READY; map any other Finesse state to NOT_READY. */
export function mapEffectiveFinesseStateToTopBarReadyToggle(
  raw: string | undefined,
): "READY" | "NOT_READY" {
  const u = (raw ?? "").trim().toUpperCase();
  if (u === "READY" || u === "LOGIN") return "READY";
  return "NOT_READY";
}

/** True while the agent is on a call or in wrap-up — TopBar Ready/Not Ready is display-only. */
export function isFinesseCampaignTopBarStatusLockedState(
  state: string | undefined,
): boolean {
  const trimmed = (state ?? "").trim();
  if (!trimmed) return false;
  const upper = trimmed.toUpperCase();
  if (FINESSE_TOP_BAR_LOCKED_STATES.has(upper)) return true;
  return isFinesseAgentOnCallFromRosterState(trimmed);
}

/** Indicator color for any Finesse state shown in the campaign TopBar selector. */
export function getCampaignTopBarStatusColor(state: string | undefined): string {
  const upper = (state ?? "").trim().toUpperCase();
  if (upper === "READY" || upper === "LOGIN") return "#10b981";
  if (upper === "NOT_READY") return "#ef4444";
  if (upper === "TALKING" || upper === "ACTIVE" || upper === "ALERTING") {
    return "#0066CC";
  }
  if (upper === "HELD") return "#f59e0b";
  if (upper === "WRAP_UP") return "#8b5cf6";
  if (upper === "RESERVED" || upper === "RESERVED_OUTBOUND") return "#6366f1";
  return "#6b7280";
}

export type CampaignTopBarStatusPresentation = {
  label: string;
  color: string;
  statusChangeDisabled: boolean;
  readyOptionActive: boolean;
  notReadyOptionActive: boolean;
};

/** Resolve TopBar button label, color, and dropdown behaviour from the live Finesse state. */
export function getCampaignTopBarStatusPresentation(
  agentStatus: string | undefined,
  statusOptions: ReadonlyArray<{ value: string; label: string; color: string }>,
): CampaignTopBarStatusPresentation {
  const raw = (agentStatus ?? "").trim();
  const readyOption =
    statusOptions.find((option) => option.value === "READY") ?? statusOptions[0];
  const notReadyOption =
    statusOptions.find((option) => option.value === "NOT_READY") ??
    statusOptions[1] ??
    statusOptions[0];

  if (isFinesseCampaignTopBarStatusLockedState(raw)) {
    return {
      label: formatFinesseStateLabel(raw) || raw,
      color: getCampaignTopBarStatusColor(raw),
      statusChangeDisabled: true,
      readyOptionActive: false,
      notReadyOptionActive: false,
    };
  }

  if (isFinesseConsoleReadyLikeState(raw)) {
    return {
      label: readyOption.label,
      color: readyOption.color,
      statusChangeDisabled: false,
      readyOptionActive: true,
      notReadyOptionActive: false,
    };
  }

  if (isFinesseConsoleNotReadyState(raw)) {
    return {
      label: notReadyOption.label,
      color: notReadyOption.color,
      statusChangeDisabled: false,
      readyOptionActive: false,
      notReadyOptionActive: true,
    };
  }

  const availability = mapEffectiveFinesseStateToTopBarReadyToggle(raw);
  if (availability === "READY") {
    return {
      label: readyOption.label,
      color: readyOption.color,
      statusChangeDisabled: false,
      readyOptionActive: true,
      notReadyOptionActive: false,
    };
  }

  return {
    label: notReadyOption.label,
    color: notReadyOption.color,
    statusChangeDisabled: false,
    readyOptionActive: false,
    notReadyOptionActive: true,
  };
}

/** Console treats LOGIN like READY for availability actions and badges. */
export function isFinesseConsoleReadyLikeState(state: string | undefined): boolean {
  const u = (state ?? "").trim().toUpperCase();
  return u === "READY" || u === "LOGIN";
}

export function isFinesseConsoleNotReadyState(state: string | undefined): boolean {
  return (state ?? "").trim().toUpperCase() === "NOT_READY";
}

/** True when the target Ready/Not Ready action would not change the agent. */
export function isFinesseConsoleStatusActionDisabled(
  currentState: string | undefined,
  targetState: "READY" | "NOT_READY",
): boolean {
  if (targetState === "READY") {
    return isFinesseConsoleReadyLikeState(currentState);
  }
  return isFinesseConsoleNotReadyState(currentState);
}
