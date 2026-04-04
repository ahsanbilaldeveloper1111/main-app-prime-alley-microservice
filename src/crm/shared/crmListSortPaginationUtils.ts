export function sortData<T extends Record<string, any>>(
  data: T[],
  sortColumn: string,
  sortDirection: "asc" | "desc",
): T[] {
  if (!sortColumn) return data;

  return [...data].sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];

    if (aVal === undefined) aVal = "";
    if (bVal === undefined) bVal = "";

    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();

    if (aStr < bStr) return sortDirection === "asc" ? -1 : 1;
    if (aStr > bStr) return sortDirection === "asc" ? 1 : -1;
    return 0;
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
