/**
 * Must stay aligned with `normalizePostPagedListResult` in `src/utils/paginatedList.ts`.
 * Used by ListTeams and ListGroups (control hub / main settings).
 */

function normalizePostPagedListResult(raw) {
  if (!raw || typeof raw !== "object") {
    return { data: [], total: 0 };
  }

  const record = raw;
  const dataList = record.dataList;
  const data = record.data;
  let rows = [];
  if (Array.isArray(dataList)) {
    rows = dataList;
  } else if (Array.isArray(data)) {
    rows = data;
  }

  const meta =
    record.meta && typeof record.meta === "object" ? record.meta : undefined;

  const total =
    Number(record.total) ||
    Number(meta?.total) ||
    Number(record.recordsTotal) ||
    Number(record.recordsFiltered) ||
    rows.length ||
    0;

  return { data: rows, total };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const teamsShape = normalizePostPagedListResult({
    dataList: [{ id: 1, name: "Alpha" }],
    meta: { total: 42 },
  });
  assert(teamsShape.data.length === 1, "expected one row from dataList");
  assert(teamsShape.total === 42, "expected total from meta");

  const legacyShape = normalizePostPagedListResult({
    data: [{ id: 2 }],
    total: 7,
  });
  assert(legacyShape.data.length === 1, "expected one row from data");
  assert(legacyShape.total === 7, "expected total from total");

  const empty = normalizePostPagedListResult(null);
  assert(empty.data.length === 0 && empty.total === 0, "expected empty result");

  console.log("normalizePostPagedListResult: all assertions passed");
}

run();
