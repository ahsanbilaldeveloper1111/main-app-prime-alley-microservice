/** Pure merge for `handleFiltersChange` — keeps Sonar cognitive complexity low. */

function setStringOrRemove(
  target: Record<string, unknown>,
  key: string,
  raw: unknown,
): void {
  if (raw) {
    target[key] = String(raw);
  } else {
    delete target[key];
  }
}

function setTruthyOrRemove(
  target: Record<string, unknown>,
  key: string,
  raw: unknown,
): void {
  if (raw) {
    target[key] = raw;
  } else {
    delete target[key];
  }
}

function setSearchOrRemove(
  target: Record<string, unknown>,
  raw: unknown,
): void {
  if (raw) {
    target.search = raw;
  } else {
    delete target.search;
  }
}

function setFlagOrRemove(
  target: Record<string, unknown>,
  key: string,
  raw: unknown,
): void {
  if (raw) {
    target[key] = true;
  } else {
    delete target[key];
  }
}

export function mergeOrdersListFilters(
  prev: Record<string, any>,
  filters: Record<string, any>,
): Record<string, any> {
  const next: Record<string, any> = { ...prev };

  if ("stage_id" in filters) {
    setStringOrRemove(next, "stage_id", filters.stage_id);
  }
  if ("assigned_to" in filters) {
    setStringOrRemove(next, "assigned_to", filters.assigned_to);
  }
  if ("search" in filters) {
    setSearchOrRemove(next, filters.search);
  }
  if ("is_lost" in filters) {
    next.is_lost = filters.is_lost;
  }
  if ("include_lost" in filters) {
    setFlagOrRemove(next, "include_lost", filters.include_lost);
  }
  if ("include_archived" in filters) {
    setFlagOrRemove(next, "include_archived", filters.include_archived);
  }
  if ("industry" in filters) {
    setTruthyOrRemove(next, "industry", filters.industry);
  }
  if ("order_value_min" in filters) {
    setStringOrRemove(next, "order_value_min", filters.order_value_min);
  }
  if ("order_value_max" in filters) {
    setStringOrRemove(next, "order_value_max", filters.order_value_max);
  }
  if ("order_stage_id" in filters) {
    setStringOrRemove(next, "order_stage_id", filters.order_stage_id);
  }
  if ("order_approval_status" in filters) {
    setTruthyOrRemove(next, "order_approval_status", filters.order_approval_status);
  }
  if ("fulfillment_status" in filters) {
    setTruthyOrRemove(next, "fulfillment_status", filters.fulfillment_status);
  }
  if ("payment_status" in filters) {
    setTruthyOrRemove(next, "payment_status", filters.payment_status);
  }
  if ("date_from" in filters) {
    setTruthyOrRemove(next, "date_from", filters.date_from);
  }
  if ("date_to" in filters) {
    setTruthyOrRemove(next, "date_to", filters.date_to);
  }

  return next;
}
