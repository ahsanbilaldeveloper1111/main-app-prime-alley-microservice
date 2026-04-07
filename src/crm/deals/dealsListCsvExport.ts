export type DealsExportField = { label: string; key: string };

function serializeCsvCell(val: unknown): string {
  let serialized = "";
  switch (typeof val) {
    case "string":
    case "number":
    case "boolean":
    case "bigint":
      serialized = `${val}`;
      break;
    default:
      return "";
  }
  const s = serialized.replaceAll('"', '""');
  return s.includes(",") || s.includes('"') ? `"${s}"` : s;
}

export function buildDealsExportCsvContent(
  exportFields: DealsExportField[],
  allData: any[],
  getRowValue: (row: Record<string, any>, key: string) => unknown,
): string {
  const headerRow = exportFields.map((f) => f.label).join(",");
  const dataRows = allData.map((row) =>
    exportFields
      .map(({ key }) => {
        const val =
          typeof row === "object" && row !== null
            ? getRowValue(row as Record<string, any>, key)
            : "";
        if (val == null) return "";
        return serializeCsvCell(val);
      })
      .join(","),
  );
  return [headerRow, ...dataRows].join("\n");
}

export function triggerCsvDownload(csvText: string, downloadBaseName: string): void {
  const ext = downloadBaseName.endsWith(".csv") ? "" : ".csv";
  const blob = new Blob([csvText], {
    type: "text/csv;charset=utf-8;",
  });
  const url = globalThis.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = downloadBaseName + ext;
  a.click();
  globalThis.URL.revokeObjectURL(url);
}
