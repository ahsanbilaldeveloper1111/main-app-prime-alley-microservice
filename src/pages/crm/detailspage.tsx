import React, { useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@layout/index";
import { getCrmDetailStaticConfig } from "@utils/crm/common/crm-detail-config";
import { getCrmDetailPageForType } from "@utils/crm/common/crm-detail-unified";
import { useCrmDetailsRouteParams } from "@hooks/crm/useCrmDetailsRouteParams";
import "@assets/scss/crm-details-route.scss";

export default function CrmDetailsPage() {
  const router = useRouter();

  const { recordType, rawId, hasTypeOrAlias, hasIdOrAlias, isValid } =
    useCrmDetailsRouteParams(router);

  const errorView = useMemo(() => {
    if (router.isReady && !isValid && hasTypeOrAlias && hasIdOrAlias) {
      const staticConfig =
        recordType ? getCrmDetailStaticConfig(recordType) : null;

      return (
        <Layout>
          <div className="crm-details-invalid">
            <h2 className="crm-details-invalid-title">Invalid CRM detail link</h2>
            <p className="crm-details-invalid-text">
              Expected <code>type</code> (lead|deal|prospect|order|companies) and <code>id</code>.
            </p>
            {staticConfig ? (
              <Link href={staticConfig.listPath} className="crm-details-invalid-link">
                Back to {staticConfig.breadcrumbLabel}
              </Link>
            ) : (
              <Link href="/crm" className="crm-details-invalid-link">
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

