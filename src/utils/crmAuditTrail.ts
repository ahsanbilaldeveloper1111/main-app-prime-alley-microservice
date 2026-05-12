import type { AuditTrailEntry } from "@utils/crm";

type AuditTrailChangeValue = {
  old?: unknown;
  new?: unknown;
};

type ResolveFieldValue = (field: string, value: unknown) => string;
type HumanizeKey = (key: string) => string;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function parseJsonObjectString(value: string): Record<string, unknown> | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function toComparableObject(
  value: unknown,
): Record<string, unknown> | null {
  if (isPlainObject(value)) {
    return value;
  }

  if (typeof value === "string") {
    return parseJsonObjectString(value);
  }

  return null;
}

function isValidChangeValue(value: unknown): value is AuditTrailChangeValue {
  return (
    isPlainObject(value) &&
    ("old" in value || "new" in value)
  );
}

function buildObjectChangeLines(
  field: string,
  rawOld: unknown,
  rawNew: unknown,
  resolveFieldVal: ResolveFieldValue,
  humanizeKey: HumanizeKey,
): string[] {
  const oldObject = toComparableObject(rawOld) ?? {};
  const newObject = toComparableObject(rawNew) ?? {};
  const allKeys = new Set([
    ...Object.keys(oldObject),
    ...Object.keys(newObject),
  ]);

  const lines: string[] = [];
  const prefix = field === "data" ? "" : `${humanizeKey(field)} • `;

  allKeys.forEach((key) => {
    const oldValue = resolveFieldVal(key, oldObject[key]);
    const newValue = resolveFieldVal(key, newObject[key]);

    if (oldValue !== newValue) {
      lines.push(`${prefix}${humanizeKey(key)}: ${oldValue} → ${newValue}`);
    }
  });

  return lines;
}

function shouldExpandObjectChange(
  field: string,
  rawOld: unknown,
  rawNew: unknown,
): boolean {
  if (field === "data") {
    return true;
  }

  return (
    toComparableObject(rawOld) !== null ||
    toComparableObject(rawNew) !== null
  );
}

export function buildCrmAuditLinesForEntry(
  entry: AuditTrailEntry,
  resolveFieldVal: ResolveFieldValue,
  humanizeKey: HumanizeKey,
): string {
  const event = entry.event === "created" ? "created" : "updated";
  if (event === "created") {
    return entry.description?.trim() || "Record created";
  }

  const changes =
    isPlainObject(entry.changes) ? entry.changes : null;
  if (!changes) {
    return entry.description?.trim() || "Record updated";
  }

  const statusChange = changes.status;
  const isLostChange = changes.is_lost;
  const stageChange = changes.stage_id;
  const feedbackChange = changes.lost_feedback;

  const isLeadConvertedToLost =
    isValidChangeValue(statusChange) &&
    isValidChangeValue(isLostChange) &&
    isValidChangeValue(stageChange) &&
    isValidChangeValue(feedbackChange) &&
    isLostChange.old === false &&
    isLostChange.new === true &&
    statusChange.old === "new" &&
    statusChange.new === "lost";

  if (isLeadConvertedToLost) {
    const convertedStatus = resolveFieldVal("status", statusChange.new);
    return `Lead converted to ${convertedStatus}`;
  }

  const lines: string[] = [];

  Object.entries(changes).forEach(([field, value]) => {
    if (!isValidChangeValue(value)) {
      return;
    }

    const rawOld = value.old;
    const rawNew = value.new;

    if (shouldExpandObjectChange(field, rawOld, rawNew)) {
      lines.push(
        ...buildObjectChangeLines(
          field,
          rawOld,
          rawNew,
          resolveFieldVal,
          humanizeKey,
        ),
      );
      return;
    }

    const oldValue = resolveFieldVal(field, rawOld);
    const newValue = resolveFieldVal(field, rawNew);

    if (oldValue !== newValue) {
      lines.push(`${humanizeKey(field)}: ${oldValue} → ${newValue}`);
    }
  });

  return lines.length > 0
    ? lines.join("\n")
    : entry.description?.trim() || "Record updated";
}
