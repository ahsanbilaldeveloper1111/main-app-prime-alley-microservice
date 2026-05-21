export function formatAuditMeta(meta: Record<string, unknown> | null | undefined): string {
  if (!meta || Object.keys(meta).length === 0) {
    return "—";
  }
  try {
    return JSON.stringify(meta);
  } catch {
    return "—";
  }
}
