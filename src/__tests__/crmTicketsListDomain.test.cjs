/**
 * Mirrors helpers in crmTicketsListDomain.ts (keep in sync).
 */

function readRecord(value) {
  return value != null && typeof value === "object" ? value : null;
}

function readPositiveNumber(value) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed;
  }
  return undefined;
}

function resolveTicketsListTotal(source, rowCount) {
  if (!source) {
    return rowCount;
  }

  const pagination = readRecord(source.pagination);
  const candidates = [
    source.total,
    source.recordsTotal,
    source.recordsFiltered,
    source.totalRecords,
    pagination?.total,
    pagination?.recordsTotal,
    pagination?.recordsFiltered,
  ];

  for (const candidate of candidates) {
    const parsed = readPositiveNumber(candidate);
    if (parsed != null) {
      return parsed;
    }
  }

  return rowCount;
}

function normalizeTicketsListResponse(response) {
  if (response == null) {
    return { items: [], total: 0 };
  }
  if (Array.isArray(response)) {
    return { items: response, total: response.length };
  }

  const root = response;
  if (Array.isArray(root.data)) {
    return {
      items: root.data,
      total: resolveTicketsListTotal(root, root.data.length),
    };
  }

  const nested = root.data;
  if (nested != null && typeof nested === "object") {
    const rows = nested.data;
    if (Array.isArray(rows)) {
      return {
        items: rows,
        total: resolveTicketsListTotal(nested, rows.length),
      };
    }
  }

  return { items: [], total: 0 };
}

function isResolvedOrClosedStatusName(name) {
  const normalized = String(name ?? "").toLowerCase();
  return normalized.includes("resolved") || normalized.includes("closed");
}

function mapDashboardToCrmStats(dashboard) {
  const record = dashboard != null && typeof dashboard === "object" ? dashboard : null;

  const total = readPositiveNumber(record?.total ?? record?.total_tickets) ?? 0;
  const byStatus = Array.isArray(record?.by_status) ? record.by_status : [];
  const byApproval = readRecord(record?.by_approval);

  let open = 0;
  for (const entry of byStatus) {
    const row = readRecord(entry);
    const name = String(row?.name ?? "");
    const count = readPositiveNumber(row?.count ?? row?.total) ?? 0;
    if (isResolvedOrClosedStatusName(name)) {
      continue;
    }
    open += count;
  }

  const unassigned =
    readPositiveNumber(
      byApproval?.unassigned ??
        byApproval?.unassigned_count ??
        record?.unassigned ??
        record?.unassigned_count,
    ) ?? 0;

  return { total, open, unassigned };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runTests() {
  const list = normalizeTicketsListResponse({
    data: [{ id: 1 }, { id: 2 }],
    recordsTotal: 42,
  });
  assert(list.total === 42, "recordsTotal should drive pagination total");
  assert(list.items.length === 2, "items should be preserved");

  const nested = normalizeTicketsListResponse({
    data: { data: [{ id: 1 }], pagination: { total: 17 } },
  });
  assert(nested.total === 17, "nested pagination total should be read");

  const stats = mapDashboardToCrmStats({
    total: 10,
    by_status: [
      { name: "Open", count: 4 },
      { name: "Resolved", count: 3 },
    ],
    by_approval: { unassigned: 2 },
  });
  assert(stats.total === 10, "dashboard total");
  assert(stats.open === 4, "open excludes resolved");
  assert(stats.unassigned === 2, "unassigned from by_approval");

  const zeroOpen = mapDashboardToCrmStats({
    total: 5,
    by_status: [{ name: "Resolved", count: 5 }],
  });
  assert(zeroOpen.open === 0, "open should stay zero when all resolved");

  console.log("crmTicketsListDomain: all assertions passed");
}

runTests();
