/** Columns for the summary stats grid at common breakpoints (matches prior inline behavior). */
export function getResponsiveStatsGridColumns(
  isMobile: boolean,
  isTablet: boolean,
): string {
  if (isMobile) return "repeat(2, minmax(0, 1fr))";
  if (isTablet) return "repeat(3, minmax(0, 1fr))";
  return "repeat(6, 1fr)";
}
