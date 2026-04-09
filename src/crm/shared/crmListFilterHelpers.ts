type AnyRecord = Record<string, any>;

type FilterRuleKind = "string" | "truthy" | "defined" | "present";

type FilterRule = Readonly<{
  key: string;
  kind: FilterRuleKind;
  targetKey?: string;
  trueValue?: unknown;
}>;

function applyRule(nextFilters: AnyRecord, incomingFilters: AnyRecord, rule: FilterRule) {
  if (!(rule.key in incomingFilters)) {
    return;
  }

  const incomingValue = incomingFilters[rule.key];
  const targetKey = rule.targetKey ?? rule.key;

  if (rule.kind === "defined") {
    nextFilters[targetKey] = incomingValue;
    return;
  }

  if (rule.kind === "present") {
    if (incomingValue != null && incomingValue !== "") {
      nextFilters[targetKey] = incomingValue;
      return;
    }
    delete nextFilters[targetKey];
    return;
  }

  if (rule.kind === "truthy") {
    if (incomingValue) {
      nextFilters[targetKey] = rule.trueValue ?? incomingValue;
      return;
    }
    delete nextFilters[targetKey];
    return;
  }

  if (incomingValue) {
    nextFilters[targetKey] = String(incomingValue);
    return;
  }
  delete nextFilters[targetKey];
}

export function applyCrmFilterRules(
  previousFilters: AnyRecord,
  incomingFilters: AnyRecord,
  rules: readonly FilterRule[],
): AnyRecord {
  const nextFilters = { ...previousFilters };
  rules.forEach((rule) => {
    applyRule(nextFilters, incomingFilters, rule);
  });
  return nextFilters;
}

export const CRM_BASE_FILTER_RULES: readonly FilterRule[] = [
  { key: "stage_id", kind: "string" },
  { key: "user_extension_filter", kind: "string" },
  { key: "assigned_to", kind: "string", targetKey: "user_extension_filter" },
  { key: "search", kind: "truthy" },
  { key: "is_lost", kind: "defined" },
  { key: "include_lost", kind: "truthy", trueValue: true },
  { key: "include_archived", kind: "truthy", trueValue: true },
];
