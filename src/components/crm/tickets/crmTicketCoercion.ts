/** Coerces API picklist / entity ids to string without `[object Object]`. */
export function coercePicklistId(value: unknown): string {
  if (value == null || value === "") {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  return "";
}

export function coerceOptionalPicklistId(value: unknown): string | undefined {
  const id = coercePicklistId(value);
  return id || undefined;
}

/** Coerces primitive display values to string without object default stringification. */
export function coerceDisplayText(value: unknown): string {
  if (value == null || value === "") {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  return "";
}

export function normalizeUnknownToArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw == null || raw === "") {
    return [];
  }
  return [raw];
}

export function readTrimmedString(value: unknown): string {
  return coerceDisplayText(value).trim();
}

export function readNestedEntityName(
  entity: Record<string, unknown> | null,
): string {
  if (!entity) {
    return "";
  }
  return readTrimmedString(entity.name);
}
