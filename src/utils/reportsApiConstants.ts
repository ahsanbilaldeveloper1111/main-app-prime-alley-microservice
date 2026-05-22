/** Mirrors backend `config/reports.php` defaults used by overview requests. */
export const TASK_REPORTS_OVERVIEW_LIMITS = {
  pending_limit: 50,
  top_assignees_limit: 25,
  recent_activity_limit: 20,
  member_report_limit: 25,
  member_trends_members_limit: 15,
  member_trends_periods_limit: 8,
  completion_trends_days_limit: 31,
  trends_days_limit: 31,
  project_breakdown_limit: 50,
} as const;

export const TASK_REPORTS_EXPORT_PENDING_LIMIT = 100;

/** API rejects ranges longer than 62 days from start_date. */
export const TASK_REPORTS_MAX_DATE_RANGE_DAYS = 62;
