import { useEffect, useRef, useState } from "react";

export function useGenericTableContextMenu<T>() {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    row: T;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }
    const close = () => setContextMenu(null);
    const onMouseDown = (e: MouseEvent) => {
      const menuEl = contextMenuRef.current;
      if (!menuEl) {
        return;
      }
      const { target } = e;
      if (target instanceof Node && menuEl.contains(target)) {
        return;
      }
      close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [contextMenu]);

  return { contextMenu, setContextMenu, contextMenuRef };
}
