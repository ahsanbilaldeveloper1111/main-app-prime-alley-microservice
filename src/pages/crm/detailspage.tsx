import React, { useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@layout/index";
import { getCrmDetailStaticConfig } from "@utils/crm/common/crm-detail-config";
import type {
  SupportedCrmDetailType,
} from "@utils/crm/common/crm-detail-unified";
import { getCrmDetailPageForType } from "@utils/crm/common/crm-detail-unified";

const getSingleQueryValue = (
  value: unknown
): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : undefined;
  }
  return undefined;
};

const normalizeCrmType = (raw: string | undefined): SupportedCrmDetailType | null => {
  const t = (raw ?? "").toString().toLowerCase().trim();
  if (!t) return null;

  // Accept common misspelling from the prompt.
  if (t === "propspect") return "prospect";

  if (t === "lead" || t === "leads") return "lead";
  if (t === "prospect" || t === "prospects") return "prospect";
  if (t === "deal" || t === "deals") return "deal";
  if (t === "order" || t === "orders") return "order";
  if (t === "company" || t === "companies") return "company";

  return null;
};

export default function CrmDetailsPage() {
  const router = useRouter();

  const rawType = useMemo(() => {
    const t1 = getSingleQueryValue(router.query.type);
    const t2 = getSingleQueryValue(router.query.recordType);
    const t3 = getSingleQueryValue(router.query.dynamic);
    return t1 ?? t2 ?? t3;
  }, [router.query.dynamic, router.query.recordType, router.query.type]);

  const recordType = useMemo(() => normalizeCrmType(rawType), [rawType]);

  const rawId = useMemo(
    () =>
      getSingleQueryValue(router.query.id) ??
      getSingleQueryValue(router.query.recordId) ??
      getSingleQueryValue(router.query.record_id),
    [router.query.id, router.query.recordId, router.query.record_id]
  );

  const hasTypeOrAlias = Boolean(
    router.query.type != null ||
      router.query.recordType != null ||
      router.query.dynamic != null
  );
  const hasIdOrAlias = Boolean(
    router.query.id != null || router.query.recordId != null || router.query.record_id != null
  );

  const isValid = Boolean(recordType && rawId && rawId.trim().length > 0);

  const errorView = useMemo(() => {
    if (router.isReady && !isValid && hasTypeOrAlias && hasIdOrAlias) {
      const staticConfig =
        recordType ? getCrmDetailStaticConfig(recordType) : null;

      return (
        <Layout>
          <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
            <h2 style={{ fontSize: 18, margin: "0 0 8px 0" }}>Invalid CRM detail link</h2>
            <p style={{ margin: "0 0 16px 0", color: "#718096" }}>
              Expected <code>type</code> (lead|deal|prospect|order|companies) and <code>id</code>.
            </p>
            {staticConfig ? (
              <Link href={staticConfig.listPath} style={{ color: "#006162", textDecoration: "none" }}>
                Back to {staticConfig.breadcrumbLabel}
              </Link>
            ) : (
              <Link href="/crm" style={{ color: "#006162", textDecoration: "none" }}>
                Back to CRM
              </Link>
            )}
          </div>
        </Layout>
      );
    }
    return null;
  }, [router.isReady, isValid, recordType, hasTypeOrAlias, hasIdOrAlias]);

  if (!router.isReady) return null;
  if (errorView) return errorView;

  if (!isValid || !recordType || !rawId) {
    return errorView;
  }

  let SelectedDetailPage: React.ComponentType | null = null;
  if (recordType) SelectedDetailPage = getCrmDetailPageForType(recordType);

  if (!SelectedDetailPage) return errorView;

  const getLayout = (SelectedDetailPage as any).getLayout as
    | ((page: React.ReactElement) => React.ReactNode)
    | undefined;

  const page = <SelectedDetailPage />;
  return getLayout ? getLayout(page) : page;
}

