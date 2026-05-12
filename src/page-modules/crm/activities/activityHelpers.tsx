import React, { type ReactElement } from "react";
import {
  PlusCircle,
  ArrowRight,
  Phone,
  Mail,
  FileText,
} from "lucide-react";

/** Stage labels indexed by `currentStageIndex` from the activity history API. */
export const ACTIVITY_STAGE_LABELS = [
  "Prospect",
  "Lead",
  "Deal",
  "Order",
] as const;

/** Resolve the stage label for a given current-stage index. */
export function getActivityStageLabel(idx: number): string {
  return ACTIVITY_STAGE_LABELS[idx] ?? "Unknown";
}

/** Extract a 2-letter initials string from an agent display name. */
export function computeAgentInitials(
  agentName: string | undefined | null,
): string {
  const alphabeticChars = (agentName ?? "").replace(/[^a-zA-Z]/g, "");
  const parts = alphabeticChars.split(" ");
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  const joined = (first + second).toUpperCase();
  return joined || "NA";
}

/** Pick the icon + background colour for an activity timeline entry. */
export function getActivityTimelineIconData(
  event: string,
  action: string | null,
): { icon: ReactElement; bg: string } {
  if (event === "created") {
    return { icon: <PlusCircle size={20} />, bg: "#10b981" };
  }
  const actionLower = action?.toLowerCase() ?? "";
  const eventLower = event?.toLowerCase() ?? "";
  if (actionLower.includes("stage") || eventLower.includes("stage")) {
    return { icon: <ArrowRight size={20} />, bg: "#3b82f6" };
  }
  if (actionLower.includes("call") || eventLower.includes("call")) {
    return { icon: <Phone size={20} />, bg: "#8b5cf6" };
  }
  if (actionLower.includes("email") || eventLower.includes("email")) {
    return { icon: <Mail size={20} />, bg: "#ec4899" };
  }
  return { icon: <FileText size={20} />, bg: "#f59e0b" };
}
