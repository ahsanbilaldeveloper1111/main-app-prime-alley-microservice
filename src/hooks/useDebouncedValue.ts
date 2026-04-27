import { useEffect, useState } from "react";

const DEFAULT_DELAY_MS = 400;

/**
 * Returns `value` after it has stayed unchanged for `delayMs` (useful for search/filter API calls).
 */
export function useDebouncedValue<T>(value: T, delayMs: number = DEFAULT_DELAY_MS): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = globalThis.setTimeout(() => setDebounced(value), delayMs);
    return () => globalThis.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
