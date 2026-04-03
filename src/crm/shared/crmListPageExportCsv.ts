import type { CrmDataItem } from "@utils/crm";

type ExportValueHandler = (row: any) => string | null;

const crmListExportValueHandlers: Record<string, ExportValueHandler> = {
  campaign_id: (row) => {
    const label = row?.campaign?.name;
    if (label != null) return label;
    return row?.campaign_id == null ? null : String(row.campaign_id);
  },
  company_name: (row) => {
    const name = row?.company?.name;
    if (name != null) return name;
    return row?.company_name == null ? null : String(row.company_name);
  },
  crm_summary: (row) => {
    const summary =
      row?.crm_summary?.summary ?? row?.data?.crm_summary?.summary;
    if (summary == null) return "";
    return typeof summary === "string" ? summary : String(summary);
  },
};

export function formatCrmListExportRawValue(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
  try {
    return JSON.stringify(raw);
  } catch {
    return "";
  }
}

export function escapeCrmListCsvCell(val: string): string {
  const s = String(val);
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function getCrmListExportCellValue(
  row: any,
  header: string,
  nestedDataKeysSet: Set<string>,
): string | null {
  const specialHandler = crmListExportValueHandlers[header];
  if (specialHandler) {
    return specialHandler(row);
  }

  const raw = nestedDataKeysSet.has(header)
    ? (row?.data?.[header] ?? row?.[header])
    : row?.[header];

  return formatCrmListExportRawValue(raw);
}

const preferredCrmListExportTopLevelOrder = [
  "id",
  "name",
  "phone",
  "user_extension",
  "campaign_id",
  "source_file",
  "directory",
  "is_viewed",
  "scheduled_call_at",
  "uploaded_by",
  "created_by",
  "note",
  "company_name",
  "company_domain",
  "company_id",
  "created_at",
  "updated_at",
  "tags",
  "crm_summary",
];

export function buildCrmListExportHeaders(allData: CrmDataItem[]): {
  headers: string[];
  nestedDataKeysSet: Set<string>;
} {
  const topLevelKeys = new Set<string>();
  const nestedDataKeys = new Set<string>();

  for (const row of allData as any[]) {
    if (!row || typeof row !== "object") continue;
    for (const k of Object.keys(row)) {
      if (k === "data" && row.data && typeof row.data === "object") {
        for (const dk of Object.keys(row.data)) nestedDataKeys.add(dk);
      } else if (k !== "campaign" && k !== "company") {
        topLevelKeys.add(k);
      }
    }
  }

  const orderedTopLevel = [
    ...preferredCrmListExportTopLevelOrder.filter((k) => topLevelKeys.has(k)),
    ...Array.from(topLevelKeys)
      .filter((k) => !preferredCrmListExportTopLevelOrder.includes(k))
      .sort((a, b) => a.localeCompare(b)),
  ];

  const orderedNestedData = Array.from(nestedDataKeys).sort((a, b) =>
    a.localeCompare(b),
  );
  const nestedDataKeysSet = new Set(orderedNestedData);

  const headers = [
    ...orderedTopLevel,
    ...orderedNestedData.filter((k) => !orderedTopLevel.includes(k)),
  ];

  return { headers, nestedDataKeysSet };
}

export function buildCrmListCsvContent(
  headers: string[],
  allData: CrmDataItem[],
  nestedDataKeysSet: Set<string>,
): string {
  return [
    headers.map((h) => escapeCrmListCsvCell(h)).join(","),
    ...allData.map((row) =>
      headers
        .map((h) =>
          escapeCrmListCsvCell(
            String(
              getCrmListExportCellValue(row, h, nestedDataKeysSet) ?? "",
            ),
          ),
        )
        .join(","),
    ),
  ].join("\n");
}

export type CrmListSourceFileOption = { value: string; label: string };

/** Distinct non-empty `source_file` values from loaded rows for creatable select. */
export function buildCrmListSourceFileSelectOptions(
  dataList: readonly CrmDataItem[],
): CrmListSourceFileOption[] {
  const sources = new Set<string>();
  for (const item of dataList) {
    const sf = (item as CrmDataItem & { source_file?: string }).source_file?.trim();
    if (sf) sources.add(sf);
  }
  return Array.from(sources)
    .sort()
    .map((source) => ({ value: source, label: source }));
}
