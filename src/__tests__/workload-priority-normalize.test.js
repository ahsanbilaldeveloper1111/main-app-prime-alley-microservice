/**
 * Must stay aligned with `normalizeWorkloadPriorityRank` in workloadDomain.ts.
 */

function normalizeWorkloadPriorityRank(priority) {
  if (typeof priority === "number" && Number.isFinite(priority)) {
    if (priority >= 3) return 3;
    if (priority >= 2) return 2;
    if (priority >= 1) return 1;
    return 0;
  }

  if (typeof priority === "string") {
    const normalized = priority.trim().toLowerCase();
    if (normalized === "urgent" || normalized === "critical") return 3;
    if (normalized === "high") return 2;
    if (normalized === "normal" || normalized === "medium") return 1;
    if (normalized === "low") return 0;
    const asNumber = Number(normalized);
    if (Number.isFinite(asNumber)) {
      return normalizeWorkloadPriorityRank(asNumber);
    }
  }

  return 1;
}

function workloadPriorityTone(priority) {
  const rank = normalizeWorkloadPriorityRank(priority);
  if (rank >= 3) return "critical";
  if (rank >= 2) return "high";
  if (rank >= 1) return "medium";
  return "low";
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  assert(workloadPriorityTone("urgent") === "critical", "urgent → critical");
  assert(workloadPriorityTone("high") === "high", "high → high");
  assert(workloadPriorityTone("normal") === "medium", "normal → medium");
  assert(workloadPriorityTone("low") === "low", "low → low");
  assert(workloadPriorityTone(3) === "critical", "rank 3 → critical");
  assert(workloadPriorityTone("not-a-priority") === "medium", "unknown defaults to medium");
  console.log("workload-priority-normalize: all assertions passed");
}

run();
