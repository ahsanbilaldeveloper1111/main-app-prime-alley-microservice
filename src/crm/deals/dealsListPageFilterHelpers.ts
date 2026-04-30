type AnyRecord = Record<string, any>;

/** Shared UI → API field mapping for deals / approvals list filter sidebars. */
export type DealsListSidebarUiFiltersBase = Readonly<{
  assignedTo: string | null;
  stage: string | null;
  followUpDateFrom: string | null;
  followUpDateTo: string | null;
  probabilityMin: string | null;
  probabilityMax: string | null;
  expectedCloseDateFrom: string | null;
  expectedCloseDateTo: string | null;
  approvalStatus: string | null;
}>;

export type DealsListSidebarApprovalStatusPolicy =
  | "includeIfTruthy"
  | "alwaysSetNullable";

/**
 * Builds the portion of the API filter object shared by CRM deals and approvals pages.
 * Extra fields (deal type, industry, business type, etc.) are merged by the caller.
 */
export function buildDealsListSidebarBaseFilterPayload(
  dealsSearch: string,
  dealsFilters: DealsListSidebarUiFiltersBase,
  approvalStatusPolicy: DealsListSidebarApprovalStatusPolicy,
): AnyRecord {
  const filtersToApply: AnyRecord = {};

  if (dealsSearch) {
    filtersToApply.search = dealsSearch;
  }
  if (dealsFilters.assignedTo) {
    filtersToApply.user_extension_filter = [dealsFilters.assignedTo];
  }
  if (dealsFilters.stage) {
    filtersToApply.stage_id = dealsFilters.stage;
  }
  if (dealsFilters.followUpDateFrom) {
    filtersToApply.follow_up_date_from = dealsFilters.followUpDateFrom;
  }
  if (dealsFilters.followUpDateTo) {
    filtersToApply.follow_up_date_to = dealsFilters.followUpDateTo;
  }
  if (dealsFilters.probabilityMin) {
    filtersToApply.probability_min = dealsFilters.probabilityMin;
  }
  if (dealsFilters.probabilityMax) {
    filtersToApply.probability_max = dealsFilters.probabilityMax;
  }
  if (dealsFilters.expectedCloseDateFrom) {
    filtersToApply.expected_close_date_from =
      dealsFilters.expectedCloseDateFrom;
  }
  if (dealsFilters.expectedCloseDateTo) {
    filtersToApply.expected_close_date_to = dealsFilters.expectedCloseDateTo;
  }

  if (approvalStatusPolicy === "alwaysSetNullable") {
    filtersToApply.approval_status = dealsFilters.approvalStatus || null;
  } else if (dealsFilters.approvalStatus) {
    filtersToApply.approval_status = dealsFilters.approvalStatus;
  }

  return filtersToApply;
}

function mergeTruthyOrDelete(
  target: AnyRecord,
  source: AnyRecord,
  key: string,
  stringify: boolean,
): void {
  if (!(key in source)) return;
  const value = source[key];
  if (value) {
    target[key] = stringify ? String(value) : value;
  } else {
    delete target[key];
  }
}

function mergeBooleanFlagOrDelete(target: AnyRecord, source: AnyRecord, key: string): void {
  if (!(key in source)) return;
  if (source[key]) {
    target[key] = true;
  } else {
    delete target[key];
  }
}

function mergeTicketId(target: AnyRecord, source: AnyRecord): void {
  if (!("ticket_id" in source)) return;
  const value = source.ticket_id;
  if (value != null && value !== "") {
    target.ticket_id = value;
  } else {
    delete target.ticket_id;
  }
}

function mergeUserExtensions(target: AnyRecord, source: AnyRecord): void {
  if (!("user_extensions" in source)) return;
  const value = source.user_extensions;
  if (Array.isArray(value) && value.length > 0) {
    target.user_extensions = value;
  } else {
    delete target.user_extensions;
  }
}

/** Merge sidebar filter payload into the deals list API filter object (immutable). */
export function mergeDealsSidebarFiltersIntoCurrent(
  prev: AnyRecord,
  filters: AnyRecord,
): AnyRecord {
  const next: AnyRecord = { ...prev };

  mergeTruthyOrDelete(next, filters, "stage_id", true);
  if ("user_extension_filter" in filters) {
    const value = filters.user_extension_filter;
    if (Array.isArray(value) ? value.length > 0 : !!value) {
      next.user_extension_filter = Array.isArray(value)
        ? value
        : [String(value)];
    } else {
      delete next.user_extension_filter;
    }
  }
  mergeTruthyOrDelete(next, filters, "assigned_to", true);
  mergeTruthyOrDelete(next, filters, "search", false);

  if ("is_lost" in filters) {
    next.is_lost = filters.is_lost;
  }

  mergeBooleanFlagOrDelete(next, filters, "include_lost");
  mergeBooleanFlagOrDelete(next, filters, "include_archived");

  mergeTruthyOrDelete(next, filters, "follow_up_date_from", false);
  mergeTruthyOrDelete(next, filters, "follow_up_date_to", false);
  mergeTruthyOrDelete(next, filters, "probability_min", true);
  mergeTruthyOrDelete(next, filters, "probability_max", true);
  mergeTruthyOrDelete(next, filters, "approval_status", false);
  mergeTruthyOrDelete(next, filters, "business_type_id", false);
  mergeTruthyOrDelete(next, filters, "expected_close_date_from", false);
  mergeTruthyOrDelete(next, filters, "expected_close_date_to", false);

  mergeBooleanFlagOrDelete(next, filters, "include_converted");

  mergeTruthyOrDelete(next, filters, "created_at_from", false);
  mergeTruthyOrDelete(next, filters, "created_at_to", false);
  mergeTruthyOrDelete(next, filters, "created_at_month", false);

  mergeTicketId(next, filters);
  mergeBooleanFlagOrDelete(next, filters, "has_meetings");
  mergeUserExtensions(next, filters);

  // Widget / quick-filter flags (not part of the sidebar UI yet)
  mergeBooleanFlagOrDelete(next, filters, "is_won");
  mergeBooleanFlagOrDelete(next, filters, "overdue");
  mergeBooleanFlagOrDelete(next, filters, "high_value");
  mergeBooleanFlagOrDelete(next, filters, "at_risk");
  mergeBooleanFlagOrDelete(next, filters, "reviewed_last_24h");
  mergeTruthyOrDelete(next, filters, "meeting_date_from", false);
  mergeTruthyOrDelete(next, filters, "meeting_date_to", false);

  return next;
}

