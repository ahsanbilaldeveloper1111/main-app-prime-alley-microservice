export function sortData<T extends Record<string, unknown>>(
  data: T[],
  sortColumn: string,
  sortDirection: "asc" | "desc",
): T[] {
  if (!sortColumn) return data;

  const factor = sortDirection === "asc" ? 1 : -1;
  return [...data].sort((a, b) => {
    const aStr = String(a[sortColumn] ?? "").toLowerCase();
    const bStr = String(b[sortColumn] ?? "").toLowerCase();
    return aStr.localeCompare(bStr) * factor;
  });
}

export function paginateData<T>(
  data: T[],
  currentPage: number,
  rowsPerPage: number,
): T[] {
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  return data.slice(startIndex, endIndex);
}

export function getTotalPages(
  dataLength: number,
  rowsPerPage: number,
): number {
  return Math.ceil(dataLength / rowsPerPage);
}
