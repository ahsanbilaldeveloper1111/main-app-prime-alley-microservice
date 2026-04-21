/**
 * Shared localStorage helpers for CRM list "visible columns" preferences.
 * Keeps parsing/validation consistent across modules (prospects, quotes, leads, etc.).
 */

export function parseStoredVisibleColumnKeys(
  raw: string | null,
  allowedKeys: readonly string[],
): string[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const keys = parsed.filter((c): c is string => typeof c === "string");
    if (keys.length === 0) return null;
    const allowed = new Set(allowedKeys);
    const valid = keys.filter((k) => allowed.has(k));
    return valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}

/**
 * For lists where we do not maintain a static "all keys" set (large pages).
 * Still rejects non-arrays and empty lists; tolerates corrupt JSON.
 */
export function parseStoredVisibleColumnKeysLoose(
  raw: string | null,
): string[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const keys = parsed.filter((c): c is string => typeof c === "string");
    return keys.length > 0 ? keys : null;
  } catch {
    return null;
  }
}

export function loadVisibleColumnKeys(
  storageKey: string,
  allowedKeys: readonly string[],
  defaultOrder: readonly string[],
  legacyKeys?: readonly string[],
): string[] {
  if (
    typeof globalThis === "undefined" ||
    !globalThis.localStorage
  ) {
    return [...defaultOrder];
  }
  const keysToTry = [storageKey, ...(legacyKeys ?? [])];
  for (const k of keysToTry) {
    const found = parseStoredVisibleColumnKeys(
      globalThis.localStorage.getItem(k),
      allowedKeys,
    );
    if (found) return found;
  }
  return [...defaultOrder];
}

export function persistVisibleColumnKeys(
  storageKey: string,
  keys: readonly string[],
): void {
  try {
    globalThis.localStorage?.setItem(storageKey, JSON.stringify([...keys]));
  } catch {
    // quota / private mode
  }
}
