import moment from "moment";

export function normalizeAuditResponse(result: unknown): unknown[] {
  if (Array.isArray(result)) return result;
  if (result && typeof result === "object" && "data" in result) {
    const d = (result as { data: unknown }).data;
    return Array.isArray(d) ? d : [];
  }
  return [];
}

const DISPLAY_OBJECT_KEYS = [
  "label",
  "name",
  "display_name",
  "title",
  "email",
  "id",
  "extension_number",
  "extension",
  "user_id",
  "value",
  "text",
] as const;

function displayStringFromPlainObject(o: Record<string, unknown>): string {
  for (const k of DISPLAY_OBJECT_KEYS) {
    const v = o[k];
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      const s = String(v);
      if (s !== "") return s;
    }
  }
  if (typeof o.$date === "string" || typeof o.$date === "number") return scalarToDisplayString(o.$date);
  if (o.user != null && typeof o.user === "object" && !Array.isArray(o.user)) {
    const u = o.user as Record<string, unknown>;
    const inner = scalarToDisplayString(u.display_name ?? u.name ?? u.email);
    if (inner !== "") return inner;
  }
  return "";
}

export function scalarToDisplayString(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  if (Array.isArray(value)) return value.map(scalarToDisplayString).filter((p) => p !== "").join(", ");
  if (typeof value === "object") return displayStringFromPlainObject(value as Record<string, unknown>);
  return "";
}

function momentFormatIfValid(value: moment.MomentInput, pattern: string): string | null {
  const m = moment(value);
  return m.isValid() ? m.format(pattern) : null;
}

export function formatAuditTimestampOrDash(value: unknown, pattern: string): string {
  if (value == null || value === "") return "—";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return moment(value).format(pattern);
  if (typeof value === "number" && Number.isFinite(value)) return momentFormatIfValid(value, pattern) ?? "—";
  if (typeof value === "string") return momentFormatIfValid(value, pattern) ?? "—";
  if (typeof value === "object" && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    if ("$date" in o) return formatAuditTimestampOrDash(o.$date, pattern);
    if (o.date != null) return formatAuditTimestampOrDash(o.date, pattern);
  }
  return "—";
}

export function formatAuditTimestampOrEmpty(value: unknown, pattern: string): string {
  const s = formatAuditTimestampOrDash(value, pattern);
  return s === "—" ? "" : s;
}

export function hierarchyExtOptionValue(ext: Record<string, unknown>): string {
  for (const k of ["id", "extension_number", "extension", "user_id"] as const) {
    const s = scalarToDisplayString(ext[k]);
    if (s !== "") return s;
  }
  return "";
}

export function hierarchyExtOptionLabel(ext: Record<string, unknown>): string {
  for (const k of ["display_name", "name", "extension_number", "extension", "id"] as const) {
    const s = scalarToDisplayString(ext[k]);
    if (s !== "") return s;
  }
  return "Unknown";
}

export function formatLabel(value: unknown): string {
  const base = scalarToDisplayString(value);
  if (base === "") return "—";
  return base.replaceAll("_", " ").replaceAll(/\b\w/g, (c) => c.toUpperCase());
}

export type UserLike = { display_name?: string; name?: string; email?: string };
export type HierarchyResponse = { extensions?: Array<Record<string, unknown>> };
export type ChangeItem = { field?: string; type?: string; new?: string; old?: string };

export function toUserLike(value: unknown): UserLike | null {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as UserLike;
  return null;
}

export function asStringOrEmpty(value: unknown): string {
  return scalarToDisplayString(value);
}

export function valueOrDash(value: unknown): string {
  const s = scalarToDisplayString(value);
  return s === "" ? "—" : s;
}

function formatIfNotNull(value: unknown, formatter: (v: unknown) => string): string {
  return value === null || value === undefined ? "—" : formatter(value);
}

export function getCrmUserDisplay(row: Record<string, unknown>): string {
  if (row.user_display != null && row.user_display !== "") {
    return scalarToDisplayString(row.user_display) || "—";
  }
  const u = row.user_extension;
  const uObj = toUserLike(u);
  if (uObj) {
    return uObj.display_name || uObj.name || "—";
  }
  if (u != null && u !== "") {
    return scalarToDisplayString(u) || "—";
  }
  return "—";
}

export function getMainAppUserDisplay(row: Record<string, unknown>): string {
  if (row.user_display != null && row.user_display !== "") {
    return scalarToDisplayString(row.user_display) || "—";
  }
  const uExt = row.user_extension;
  const uExtObj = toUserLike(uExt);
  if (uExtObj) {
    return uExtObj.display_name || uExtObj.name || uExtObj.email || "—";
  }
  const u = row.user_id;
  const uObj = toUserLike(u);
  if (uObj) {
    return uObj.display_name || uObj.name || "—";
  }
  if (u != null && u !== "") {
    return scalarToDisplayString(u) || "—";
  }
  if (uExt != null && uExt !== "") {
    return scalarToDisplayString(uExt) || "—";
  }
  return "—";
}

export function userDisplayFromRow(row: Record<string, unknown>): string {
  if (row.user_display != null && row.user_display !== "") return scalarToDisplayString(row.user_display) || "—";
  const uExt = row.user_extension;
  const uExtObj = toUserLike(uExt);
  if (uExtObj) return uExtObj.display_name || uExtObj.name || uExtObj.email || "—";
  if (uExt != null && uExt !== "") return scalarToDisplayString(uExt) || "—";
  const uObj = toUserLike(row.user);
  if (uObj) return uObj.display_name || uObj.email || uObj.name || "—";
  if (row.user_id != null && row.user_id !== "") return scalarToDisplayString(row.user_id) || "—";
  return "—";
}

export function companyNameFromRow(row: Record<string, unknown>): string {
  const company = row.company;
  if (company && typeof company === "object" && !Array.isArray(company)) {
    const name = (company as { name?: unknown }).name;
    if (name != null && name !== "") return scalarToDisplayString(name) || "—";
  }
  return "—";
}

export function getTimestampParamKeys(timestamp: string | [string, string] | undefined): [string, string] {
  if (!timestamp) return ["date_from", "date_to"];
  if (Array.isArray(timestamp)) return [timestamp[0], timestamp[1]];
  return [`${timestamp}_from`, `${timestamp}_to`];
}

export function deriveChangesFromOldNew(
  oldValues: Record<string, unknown> | null | undefined,
  newValues: Record<string, unknown> | null | undefined,
): ChangeItem[] {
  const old = oldValues && typeof oldValues === "object" ? oldValues : {};
  const newV = newValues && typeof newValues === "object" ? newValues : {};
  const format = (v: unknown): string => (v == null || v === "" ? "—" : scalarToDisplayString(v) || "—");
  const allKeys = new Set([...Object.keys(old), ...Object.keys(newV)]);
  const items: ChangeItem[] = [];
  allKeys.forEach((key) => {
    const oldVal = old[key];
    const newVal = newV[key];
    const hasOld = key in old;
    const hasNew = key in newV;
    if (!hasOld && hasNew) items.push({ field: formatLabel(key), type: "added", old: "—", new: format(newVal) });
    else if (hasOld && !hasNew) items.push({ field: formatLabel(key), type: "removed", old: format(oldVal), new: "—" });
    else if (hasOld && hasNew && oldVal !== newVal)
      items.push({ field: formatLabel(key), type: "updated", old: format(oldVal), new: format(newVal) });
  });
  return items;
}

export function normalizeCrmChanges(changes: unknown): ChangeItem[] {
  if (!changes) return [];
  const format = (v: unknown): string => (v == null || v === "" ? "—" : scalarToDisplayString(v) || "—");
  if (Array.isArray(changes)) {
    return changes.map((c) => {
      const obj = c as Record<string, unknown>;
      const fv = valueOrDash(obj.field);
      const fkv = valueOrDash(obj.fieldKey) === "—" ? "—" : formatLabel(obj.fieldKey);
      const field = fv === "—" ? fkv : fv;
      const type = valueOrDash(obj.type) === "—" ? "updated" : scalarToDisplayString(obj.type) || "updated";
      return {
        field,
        type,
        old: valueOrDash(obj.old) === "—" ? "—" : format(obj.old),
        new: valueOrDash(obj.new) === "—" ? "—" : format(obj.new),
      };
    });
  }
  if (typeof changes === "object" && changes !== null && !Array.isArray(changes)) {
    const obj = changes as Record<string, { old?: unknown; new?: unknown }>;
    return Object.entries(obj).map(([key, val]) => ({
      field: formatLabel(key),
      type: "updated",
      old: formatIfNotNull(val?.old, format),
      new: formatIfNotNull(val?.new, format),
    }));
  }
  return [];
}
