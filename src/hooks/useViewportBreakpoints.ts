import { useEffect, useState } from "react";

export type ViewportBreakpoints = Readonly<{
  viewportWidth: number | null;
  isMobile: boolean;
  isTablet: boolean;
  isCompactViewport: boolean;
}>;

/** Tracks window width for responsive dashboard-style layouts; cleans up listeners on unmount. */
export function useViewportBreakpoints(): ViewportBreakpoints {
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);
    return () => window.removeEventListener("resize", updateViewportWidth);
  }, []);

  const isMobile = viewportWidth !== null && viewportWidth <= 767;
  const isTablet =
    viewportWidth !== null && viewportWidth > 767 && viewportWidth <= 1024;
  const isCompactViewport = isMobile || isTablet;

  return { viewportWidth, isMobile, isTablet, isCompactViewport };
}
