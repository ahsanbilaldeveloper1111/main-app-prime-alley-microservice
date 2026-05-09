function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function extractSummaryUsersCount(value: unknown): number | null {
  if (!isRecord(value)) return null;

  const summary = value.summary;
  if (!isRecord(summary)) return null;

  const users = summary.users;
  if (typeof users === "number") return users;
  if (typeof users === "string") {
    const parsed = Number(users);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (isRecord(users)) {
    const candidate = users.total ?? users.count ?? users.users;
    if (typeof candidate === "number") return candidate;
    if (typeof candidate === "string") {
      const parsed = Number(candidate);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }

  return null;
}
