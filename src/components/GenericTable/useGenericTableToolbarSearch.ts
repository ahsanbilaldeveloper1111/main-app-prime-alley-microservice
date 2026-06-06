import { useCallback, useEffect, useRef, useState } from "react";
import { sanitizeSearchInputLive } from "@utils/Helper";

type ToolbarSearchConfig = {
  searchDebounceMs?: number;
  showSearch?: boolean;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
};

export function useGenericTableToolbarSearch({
  showToolbar,
  toolbar,
}: {
  showToolbar: boolean;
  toolbar: ToolbarSearchConfig | undefined;
}) {
  const toolbarSearchDebounceMs = toolbar?.searchDebounceMs ?? 0;
  const debounceToolbarSearch = Boolean(
    showToolbar &&
      toolbar?.showSearch &&
      toolbar?.onSearchChange &&
      toolbarSearchDebounceMs > 0,
  );
  const [toolbarSearchDraft, setToolbarSearchDraft] = useState(
    () => toolbar?.searchValue ?? "",
  );

  useEffect(() => {
    if (!debounceToolbarSearch) return;
    setToolbarSearchDraft(toolbar?.searchValue ?? "");
  }, [debounceToolbarSearch, toolbar?.searchValue]);

  const onToolbarSearchChangeRef = useRef(toolbar?.onSearchChange);
  onToolbarSearchChangeRef.current = toolbar?.onSearchChange;

  useEffect(() => {
    if (!debounceToolbarSearch) return;
    const t = globalThis.setTimeout(() => {
      onToolbarSearchChangeRef.current?.(toolbarSearchDraft);
    }, toolbarSearchDebounceMs);
    return () => globalThis.clearTimeout(t);
  }, [debounceToolbarSearch, toolbarSearchDraft, toolbarSearchDebounceMs]);

  const flushDebouncedToolbarSearch = useCallback(() => {
    if (!debounceToolbarSearch) {
      return;
    }
    onToolbarSearchChangeRef.current?.(
      sanitizeSearchInputLive(toolbarSearchDraft),
    );
  }, [debounceToolbarSearch, toolbarSearchDraft]);

  return {
    debounceToolbarSearch,
    toolbarSearchDraft,
    setToolbarSearchDraft,
    flushDebouncedToolbarSearch,
  };
}
