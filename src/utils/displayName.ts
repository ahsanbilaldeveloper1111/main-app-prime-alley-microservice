/**
 * Display-name helpers that intentionally avoid regular expressions which
 * could backtrack (e.g. ReDoS via `/\s*\([^)]*\)\s*$/`).
 *
 * Prefer these helpers over inline regex when you need to clean up the
 * trailing `"(ext 123)"`-style decoration commonly added by hierarchy APIs to
 * agent / user display names.
 */

/**
 * Strip a trailing parenthetical block — e.g. `"John Doe (ext 123)"` → `"John Doe"`.
 *
 * Linear-time, regex-free implementation:
 *   1. Trim trailing whitespace.
 *   2. If the trimmed string does not end with `)`, just trim and return it.
 *   3. Otherwise find the LAST `(` and slice everything before it (and trim).
 *
 * Returns the original (whitespace-trimmed) input when no parenthetical is found
 * or when slicing would yield an empty string.
 */
export function stripTrailingParenthetical(value: string): string {
  if (!value) return "";
  const trimmedEnd = value.trimEnd();
  if (!trimmedEnd.endsWith(")")) {
    return value.trim();
  }
  const openIdx = trimmedEnd.lastIndexOf("(");
  if (openIdx <= 0) {
    return value.trim();
  }
  const head = trimmedEnd.slice(0, openIdx).trim();
  return head || value.trim();
}
