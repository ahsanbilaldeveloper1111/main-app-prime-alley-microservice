import { useMemo } from "react";
import type { NextRouter } from "next/router";
import type { SupportedCrmDetailType } from "@utils/crm/common/crm-detail-unified";

export function getSingleQueryValue(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : undefined;
  }
  return undefined;
}

export function normalizeCrmDetailType(
  raw: string | undefined,
): SupportedCrmDetailType | null {
  const t = (raw ?? "").toString().toLowerCase().trim();
  if (!t) return null;

  if (t === "propspect") return "prospect";

  if (t === "lead" || t === "leads") return "lead";
  if (t === "prospect" || t === "prospects") return "prospect";
  if (t === "deal" || t === "deals") return "deal";
  if (t === "order" || t === "orders") return "order";
  if (t === "company" || t === "companies") return "company";

  return null;
}

export function useCrmDetailsRouteParams(router: NextRouter) {
  const rawType = useMemo(() => {
    const t1 = getSingleQueryValue(router.query.type);
    const t2 = getSingleQueryValue(router.query.recordType);
    const t3 = getSingleQueryValue(router.query.dynamic);
    return t1 ?? t2 ?? t3;
  }, [router.query.dynamic, router.query.recordType, router.query.type]);

  const recordType = useMemo(() => normalizeCrmDetailType(rawType), [rawType]);

  const rawId = useMemo(
    () =>
      getSingleQueryValue(router.query.id) ??
      getSingleQueryValue(router.query.recordId) ??
      getSingleQueryValue(router.query.record_id),
    [router.query.id, router.query.recordId, router.query.record_id],
  );

  const hasTypeOrAlias = Boolean(
    router.query.type != null ||
      router.query.recordType != null ||
      router.query.dynamic != null,
  );
  const hasIdOrAlias = Boolean(
    router.query.id != null ||
      router.query.recordId != null ||
      router.query.record_id != null,
  );

  const isValid = Boolean(recordType && rawId && rawId.trim().length > 0);

  return {
    rawType,
    recordType,
    rawId,
    hasTypeOrAlias,
    hasIdOrAlias,
    isValid,
  };
}
