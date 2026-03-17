export interface CsvExportOptions {
  // Generic record to export
  row: Record<string, unknown>;
  // Final filename, including extension (e.g. "lead_1.csv")
  fileName: string;
  // Optional keys to ignore when building the CSV
  excludeKeys?: string[];
}

export const exportRecordAsCsv = (options: CsvExportOptions): void => {
  const { row, fileName, excludeKeys = [] } = options;

  const headers = Object.keys(row).filter(
    (key) => !excludeKeys.includes(key) && typeof row[key] !== "object",
  );

  const csvRows = [
    headers.join(","),
    headers
      .map((header) => {
        const value = row[header];
        if (value == null) return "";
        if (typeof value === "object") return "";
        const stringValue = String(value).replaceAll('"', '""');
        return stringValue.includes(",") || stringValue.includes('"')
          ? `"${stringValue}"`
          : stringValue;
      })
      .join(","),
  ];

  const blob = new Blob([csvRows.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });

  const url = globalThis.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  globalThis.URL.revokeObjectURL(url);
};

