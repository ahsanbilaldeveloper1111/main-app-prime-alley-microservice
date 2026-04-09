/** Remove empty / cleared entries so API params stay clean. */
export function pruneEmptyCrmListFilterEntries(
  next: Record<string, any>,
): void {
  for (const k of Object.keys(next)) {
    const v = next[k];
    if (
      v === undefined ||
      v === null ||
      v === "" ||
      (Array.isArray(v) && v.length === 0)
    ) {
      delete next[k];
    }
  }
}
