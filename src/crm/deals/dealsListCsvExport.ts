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

/** Preferred column order/labels when exporting raw deal API rows (Deals + Approvals lists). */
export const DEALS_LIST_PREFERRED_SCALAR_EXPORT_FIELDS: DealsExportField[] = [
  { label: "Deal ID", key: "id" },
  { label: "Deal Name", key: "name" },
  { label: "Company", key: "company_name" },
  { label: "Stage", key: "stage_name" },
  { label: "Approval Status", key: "approval_status" },
  { label: "Value", key: "net_value" },
  { label: "Currency", key: "currency" },
  { label: "Probability (%)", key: "probability" },
  { label: "Expected Close Date", key: "expected_close_date" },
  { label: "Follow-up Date", key: "follow_up_date" },
  { label: "Owner", key: "assigned_to" },
  { label: "Source Ticket ID", key: "ticket_id" },
  { label: "Decision Maker Name", key: "decision_maker_name" },
  { label: "Decision Maker Title", key: "decision_maker_title" },
  { label: "Decision Maker Phone", key: "decision_maker_phone" },
  { label: "Decision Maker Email", key: "decision_maker_email" },
  { label: "Created At", key: "created_at" },
  { label: "Updated At", key: "updated_at" },
];

const DEALS_EXPORT_OPTIONAL_HIDDEN_KEYS = new Set([
  "business_type_id",
  "deal_template_id",
]);

export function getDealsListExportRowValue(
  row: Record<string, any>,
  key: string,
): unknown {
  switch (key) {
    case "stage_name":
      return row.stage?.name ?? row.stage_name ?? "";
    case "decision_maker_phone": {
      const code = row.decision_maker_phone_country_code || "";
      const phone = row.decision_maker_phone || "";
      return `${code} ${phone}`.trim() || "";
    }
    default:
      return row[key];
  }
}

/** Builds CSV for paginated deal API responses (scalar columns + remaining keys). */
export function buildDealsListFullExportCsvFromApiRows(allData: any[]): string {
  const usedPreferredKeys = new Set(
    DEALS_LIST_PREFERRED_SCALAR_EXPORT_FIELDS.map((f) => f.key),
  );

  const availablePreferredFields = DEALS_LIST_PREFERRED_SCALAR_EXPORT_FIELDS.filter(
    ({ key }) =>
      allData.some((row) => {
        if (typeof row !== "object" || row === null) return false;
        const value = getDealsListExportRowValue(row as Record<string, any>, key);
        return value != null && value !== "";
      }),
  );

  const remainingScalarKeys = Array.from(
    new Set(
      allData.flatMap((row) =>
        typeof row === "object" && row !== null
          ? Object.keys(row).filter((k) => {
              const value = (row as Record<string, any>)[k];
              return (
                typeof value !== "object" &&
                !usedPreferredKeys.has(k) &&
                !DEALS_EXPORT_OPTIONAL_HIDDEN_KEYS.has(k)
              );
            })
          : [],
      ),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const exportFields = [
    ...availablePreferredFields,
    ...remainingScalarKeys.map((key) => ({ label: key, key })),
  ];

  return buildDealsExportCsvContent(exportFields, allData, getDealsListExportRowValue);
}
