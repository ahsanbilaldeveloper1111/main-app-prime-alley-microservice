/**
 * Shared Finesse/agent UI helpers for campaign communications pages.
 */

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
  if (u === "READY") return "READY";
  return "NOT_READY";
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
