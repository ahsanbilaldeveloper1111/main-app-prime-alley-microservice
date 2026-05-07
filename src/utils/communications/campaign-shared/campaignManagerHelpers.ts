import type React from "react";

export type ContactHeaderValueOption = { value: string; label: string };

export const CAMPAIGN_MANAGER_VISUALLY_HIDDEN_INPUT_STYLE: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  opacity: 0,
  pointerEvents: "none",
  margin: 0,
};

export const CAMPAIGN_MANAGER_CONTACT_HEADER_VALUE_OPTIONS: ContactHeaderValueOption[] =
  [
    { value: "Phone1", label: "Phone1" },
    { value: "First Name", label: "First Name" },
    { value: "Last Name", label: "Last Name" },
    { value: "Phone2", label: "Phone2" },
    { value: "Phone3", label: "Phone3" },
    { value: "Account Number", label: "Account Number" },
    { value: "Dial Time", label: "Dial Time" },
    { value: "None", label: "None" },
  ];

export interface CampaignRow {
  id: number;
  name: string;
  type: string;
  dialerType: string;
  timeFrom: string;
  timeTo: string;
  startTime: string;
  endTime: string;
  timezone: string;
  contactsRemaining: number;
  pendingContacts: number;
  enabled: boolean;
}

export const extractRemainingContactsCount = (raw: unknown): number | null => {
  if (raw == null) return null;
  const data =
    (raw as { data?: unknown })?.data ??
    (raw as { responseData?: unknown })?.responseData ??
    raw;
  if (Array.isArray(data)) return data.length;
  if (typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const numericKeys = [
    "pendingContacts",
    "contactsRemaining",
    "remaining",
    "remainingContacts",
    "pendingCount",
    "pending",
    "totalPending",
    "count",
    "total",
    "totalElements",
    "totalContacts",
  ];
  for (const key of numericKeys) {
    const v = d[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
      return Number(v);
    }
  }
  const arrayKeys = ["contacts", "items", "content", "rows", "results"];
  for (const key of arrayKeys) {
    const v = d[key];
    if (Array.isArray(v)) return v.length;
  }
  return null;
};

export const mapApiCampaignToRow = (item: unknown, index: number): CampaignRow => {
  const it = item as Record<string, unknown>;
  const timeFrom = (it.startTime ?? it.timeFrom ?? "09:00") as string;
  const timeTo = (it.endTime ?? it.timeTo ?? "17:00") as string;
  return {
    id: (it.id ?? it.campaignId ?? index + 1) as number,
    name: (it.name ?? it.campaignName ?? "") as string,
    type: (it.type ?? "Agent") as string,
    dialerType: (it.dialerType ?? "Direct Preview") as string,
    timeFrom,
    timeTo,
    startTime: timeFrom,
    endTime: timeTo,
    timezone: (it.timezone ?? "Server Time Zone-Gulf Standard Time") as string,
    contactsRemaining: (it.contactsRemaining ?? it.contactCount ?? 0) as number,
    pendingContacts: (it.pendingContacts ??
      it.contactsRemaining ??
      it.contactCount ??
      0) as number,
    enabled: (it.enabled ?? true) as boolean,
  };
};

export interface ImportStatusShape {
  status?: string;
  result?: string;
  lastImportTime?: string;
  importedCount?: number;
  message?: string;
  importStatus?: {
    states?: Array<{
      result?: string;
      numContactsImported?: number;
      message?: string;
    }>;
  };
}

export function formatImportStatusDisplay(
  s: ImportStatusShape | null | undefined,
): string {
  if (!s) return "—";
  const result = s.importStatus?.states?.[0]?.result ?? s.result ?? s.status;
  const upper = String(result ?? "").toUpperCase();
  if (upper === "SUCCESS") {
    const count =
      s.importStatus?.states?.[0]?.numContactsImported ?? s.importedCount ?? 0;
    const date = s.lastImportTime
      ? new Date(s.lastImportTime).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "";
    const dateSuffix = date ? ` (${date})` : "";
    return `Imported ${count} contacts${dateSuffix}.`;
  }
  if (upper === "IN_PROGRESS") return "Import in progress…";
  if (upper === "FAILURE" || upper === "ERROR") {
    const msg =
      s.importStatus?.states?.[0]?.message ?? s.message ?? "Unknown error";
    return `Failed: ${msg}`;
  }
  return "—";
}
