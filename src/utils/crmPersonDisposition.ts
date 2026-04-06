/**
 * Shared disposition keys/labels for CRM person records (prospects/contacts).
 * API stores values like `follow_up`; UI shows human-readable labels.
 */

export const CRM_PERSON_DISPOSITION_OPTIONS = [
  { value: "interested", label: "Interested", color: "success" },
  {
    value: "not_interested",
    label: "Not Interested",
    color: "danger",
  },
  {
    value: "callback_requested",
    label: "Callback Requested",
    color: "warning",
  },
  { value: "no_answer", label: "No Answer", color: "warning" },
  { value: "busy", label: "Busy", color: "info" },
  { value: "do_not_call", label: "Do Not Call", color: "danger" },
  { value: "wrong_number", label: "Wrong Number", color: "info" },
  { value: "follow_up", label: "Follow Up", color: "primary" },
] as const;

const CRM_PERSON_DISPOSITION_LABEL_BY_VALUE: Record<string, string> =
  Object.fromEntries(
    CRM_PERSON_DISPOSITION_OPTIONS.map((o) => [o.value, o.label]),
  );

export type CrmPersonDispositionBadgeVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "dark"
  | "light";

/** Reads disposition from list/detail row shapes (top-level or nested `data`). */
export function getCrmPersonRowDispositionRaw(row: unknown): string {
  const r = row as Record<string, unknown> | null | undefined;
  if (!r || typeof r !== "object") {
    return "";
  }
  const candidates = [
    r.disposition,
    (r.data as Record<string, unknown> | undefined)?.disposition,
  ];
  for (const c of candidates) {
    if (c == null) {
      continue;
    }
    const s = String(c).trim();
    if (s) {
      return s;
    }
  }
  return "";
}

export function formatCrmPersonDispositionLabel(raw: string): string {
  if (!raw) {
    return "";
  }
  const known = CRM_PERSON_DISPOSITION_LABEL_BY_VALUE[raw];
  if (known) {
    return known;
  }
  return raw
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function getCrmPersonDispositionBadgeVariant(
  raw: string,
): CrmPersonDispositionBadgeVariant {
  if (!raw) {
    return "secondary";
  }
  const found = CRM_PERSON_DISPOSITION_OPTIONS.find((o) => o.value === raw);
  return (found?.color as CrmPersonDispositionBadgeVariant) ?? "secondary";
}
