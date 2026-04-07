/**
 * Client-side page slice for GenericTable-style pagination controls.
 */
export function paginatedSlice<T>(
  items: readonly T[],
  currentPage: number,
  rowsPerPage: number,
): T[] {
  const start = (currentPage - 1) * rowsPerPage;
  return items.slice(start, start + rowsPerPage);
}
