export interface CompanyRow {
  id?: string;
  company_id?: string;
  identifier?: string;
  name?: string;
  company_name?: string;
  subscription_tier?: string;
  subscriptionTier?: string;
  [key: string]: unknown;
}

export interface BotRow {
  id?: string;
  bot_id?: string;
  company_id?: string;
  companyId?: string;
  company?: string;
  name?: string;
  bot_name?: string;
  status?: string;
  is_active?: boolean;
  isActive?: boolean;
  [key: string]: unknown;
}

export interface CallRow {
  id?: string;
  session_id?: string;
  company?: string;
  company_id?: string;
  company_name?: string;
  /** Some API versions return camelCase. */
  companyName?: string;
  bot?: string;
  bot_id?: string;
  bot_name?: string;
  botName?: string;
  status?: string;
  session_start_time?: string;
  call_duration_seconds?: number;
  [key: string]: unknown;
}

export interface CompanyTableRow {
  company: string;
  tier: string;
  bots: number;
  calls: number;
  cost: string;
}

export function formatStartTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  const min = String(d.getMinutes()).padStart(2, "0");
  const sec = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${day} ${String(h12).padStart(2, "0")}:${min}:${sec} ${ampm}`;
}

export function formatDuration(sec?: number): string {
  if (sec == null) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
