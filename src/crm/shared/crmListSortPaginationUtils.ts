function sortComparableString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    try {
      const serialized = JSON.stringify(value);
      return serialized ?? "";
    } catch {
      return "";
    }
  }
  if (typeof value === "bigint") {
    return String(value);
  }
  return "";
}

export function sortData<T extends Record<string, unknown>>(
  data: T[],
  sortBy: string,
  sortOrder: "asc" | "desc",
): T[] {
  if (!sortBy) return data;

  const factor = sortOrder === "asc" ? 1 : -1;
  return [...data].sort((a, b) => {
    const aStr = sortComparableString(a[sortBy]).toLowerCase();
    const bStr = sortComparableString(b[sortBy]).toLowerCase();
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
