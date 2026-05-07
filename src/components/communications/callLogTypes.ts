/** Row shape from call-logs API (data / dataList items) */
export interface CallLogRow {
  id?: number | string;
  Date?: string;
  Time?: string;
  username?: string;
  department_name?: string;
  call_type?: string;
  is_answered?: string;
  duration?: string | number;
  extension?: string;
  phone_number?: string;
  [key: string]: unknown;
}

/** Summary payload from call-logs list API */
export interface CallLogsSummary {
  totalCalls: number;
  users: number;
  extensions: number;
  inbound: number;
  outbound: number;
}
