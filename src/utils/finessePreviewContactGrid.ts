/**
 * Builds read-only contact rows for the Finesse preview popup from callVariables
 * and contactHeader.column* definitions (campaign manager / preview dialer).
 */

export type PreviewContactGridRow = { label: string; value: string };

type CallVarRow = { name?: string; value?: string };

function normalizeVarMap(rows: CallVarRow[] | undefined): Map<string, string> {
  const m = new Map<string, string>();
  if (!Array.isArray(rows)) return m;
  for (const row of rows) {
    const k = String(row?.name ?? "").trim();
    if (!k) continue;
    m.set(k.toLowerCase(), String(row?.value ?? "").trim());
  }
  return m;
}

function mapGetCI(map: Map<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const v = map.get(key.toLowerCase());
    if (v != null && v !== "") return v;
  }
  return "";
}

function callVariableAtColumn(map: Map<string, string>, columnIndex: number): string {
  const key = `callvariable${columnIndex}`;
  return mapGetCI(map, key, `call_variable${columnIndex}`);
}

function classifyContactHeader(headerRaw: string): "none" | "first" | "last" | "account" | "phone1" | "other" {
  const t = headerRaw.trim().toLowerCase();
  if (!t || t === "none") return "none";
  const compact = t.replace(/\s+/g, "");
  if (compact === "firstname" || (t.includes("first") && t.includes("name")))
    return "first";
  if (compact === "lastname" || (t.includes("last") && t.includes("name")))
    return "last";
  if (
    compact === "accountnumber" ||
    (t.includes("account") && t.includes("number"))
  )
    return "account";
  if (compact === "phone1") return "phone1";
  return "other";
}

function titleCaseHeader(h: string): string {
  const t = h.trim();
  if (!t) return t;
  return t.replace(/\b\w/g, (c) => c.toUpperCase());
}

function gridLabelForKind(
  kind: "account" | "phone1" | "other",
  headerRaw: string,
): string {
  if (kind === "account") return "Company Name";
  if (kind === "phone1") return "Dialed Number";
  return titleCaseHeader(headerRaw);
}

function parseClientNameFromBuddy(buddyRaw: string): string {
  const buddy = String(buddyRaw ?? "").trim();
  if (!buddy) return "";
  const comma = buddy.indexOf(",");
  const first = comma >= 0 ? buddy.slice(0, comma).trim() : buddy;
  const last = comma >= 0 ? buddy.slice(comma + 1).trim() : "";
  return [first, last].filter(Boolean).join(" ").trim();
}

type ColumnDef = {
  index: number;
  headerRaw: string;
  kind: ReturnType<typeof classifyContactHeader>;
};

/**
 * @param callVariables — { name, value } pairs from the preview event (participant or dialog).
 */
export function buildPreviewContactGridRows(
  callVariables: CallVarRow[] | undefined,
): PreviewContactGridRow[] {
  const map = normalizeVarMap(callVariables);
  const columns: ColumnDef[] = [];

  for (const [k, headerVal] of map.entries()) {
    const m = /^contactheader\.column(\d+)$/i.exec(k);
    if (!m) continue;
    const index = Number(m[1]);
    if (!Number.isFinite(index)) continue;
    const headerRaw = String(headerVal ?? "").trim();
    const kind = classifyContactHeader(headerRaw);
    if (kind === "none") continue;
    columns.push({ index, headerRaw, kind });
  }

  columns.sort((a, b) => a.index - b.index);

  const hasNameCol = columns.some((c) => c.kind === "first" || c.kind === "last");
  const rows: PreviewContactGridRow[] = [];

  if (hasNameCol) {
    const clientName = parseClientNameFromBuddy(mapGetCI(map, "babuddyname"));
    if (clientName) rows.push({ label: "Client Name", value: clientName });
  }

  for (const col of columns) {
    if (col.kind === "first" || col.kind === "last") continue;

    let value = "";
    if (col.kind === "account") {
      value =
        mapGetCI(map, "baaccountnumber") ||
        callVariableAtColumn(map, col.index);
    } else if (col.kind === "phone1") {
      value =
        mapGetCI(map, "bacustomernumber") ||
        callVariableAtColumn(map, col.index);
    } else {
      value = callVariableAtColumn(map, col.index);
    }

    if (!value) continue;
    rows.push({
      label: gridLabelForKind(col.kind, col.headerRaw),
      value,
    });
  }

  return rows;
}
