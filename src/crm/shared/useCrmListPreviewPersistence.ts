import { useCallback, useEffect, useRef } from "react";

export type UseCrmListPreviewPersistenceParams = {
  /** Distinct per list (e.g. leads vs deals) so keys never collide. */
  localStorageKey: string;
  /** When true, restore waits (same pattern as table loading). */
  listLoading: boolean;
  /** Re-open sidebar for this record id (should match preview click behavior / fetch full row). */
  openPreviewByNumericId: (id: number) => void | Promise<void>;
};

/**
 * Persists list preview sidebar record id in localStorage so browser back from the
 * detail page can reopen the same preview. Cleared when the page passes `clearPreviewIdFromStorage`
 * (typically sidebar X). Navigation to detail should hide the sidebar without clearing storage.
 */
export function useCrmListPreviewPersistence({
  localStorageKey,
  listLoading,
  openPreviewByNumericId,
}: UseCrmListPreviewPersistenceParams) {
  const didInitialRestoreRef = useRef(false);

  const writePreviewIdToStorage = useCallback(
    (id: number) => {
      if (!Number.isFinite(id) || id <= 0) return;
      if (globalThis.window === undefined) return;
      try {
        globalThis.localStorage.setItem(localStorageKey, String(id));
      } catch {
        /* quota / private mode */
      }
    },
    [localStorageKey],
  );

  const clearPreviewIdFromStorage = useCallback(() => {
    if (globalThis.window === undefined) return;
    try {
      globalThis.localStorage.removeItem(localStorageKey);
    } catch {
      /* ignore */
    }
  }, [localStorageKey]);

  useEffect(() => {
    if (listLoading) return;
    if (didInitialRestoreRef.current) return;
    didInitialRestoreRef.current = true;

    let raw: string | null = null;
    try {
      raw = globalThis.localStorage.getItem(localStorageKey);
    } catch {
      return;
    }
    const trimmed = raw?.trim() ?? "";
    if (!trimmed) return;
    const id = Number(trimmed);
    if (!Number.isFinite(id) || id <= 0) {
      try {
        globalThis.localStorage.removeItem(localStorageKey);
      } catch {
        /* ignore */
      }
      return;
    }
    void openPreviewByNumericId(id);
  }, [listLoading, localStorageKey, openPreviewByNumericId]);

  return { writePreviewIdToStorage, clearPreviewIdFromStorage };
}
