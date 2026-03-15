export function toYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatPercent(value: unknown, fractionDigits: number = 2): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${(0).toFixed(fractionDigits)}%`;
  return `${n.toFixed(fractionDigits)}%`;
}

export function formatFixed(value: unknown, fractionDigits: number, fallback: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n.toFixed(fractionDigits);
}

export function formatDurationSeconds(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return "0:00";
  const total = Math.floor(n);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

