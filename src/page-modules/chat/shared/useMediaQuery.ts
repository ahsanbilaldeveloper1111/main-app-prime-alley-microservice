import { useEffect, useState } from "react";

function getInitialMatches(query: string): boolean {
  if (globalThis.window === undefined) {
    return false;
  }
  return globalThis.matchMedia(query).matches;
}

/** Subscribes to a CSS media query; updates when the viewport crosses the breakpoint. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => getInitialMatches(query));

  useEffect(() => {
    const mediaQuery = globalThis.matchMedia(query);
    const onChange = () => {
      setMatches(mediaQuery.matches);
    };
    onChange();
    mediaQuery.addEventListener("change", onChange);
    return () => {
      mediaQuery.removeEventListener("change", onChange);
    };
  }, [query]);

  return matches;
}
