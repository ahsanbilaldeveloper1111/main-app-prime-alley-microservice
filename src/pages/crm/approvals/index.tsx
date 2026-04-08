import Layout from "@layout/index";
import type { ReactElement } from "react";
import { CrmDealsListScreen } from "../deals";

/**
 * Deal approvals use the same list/detail surface as Deals (`CrmDealsListScreen`)
 * with `listVariant="approvals"` so Sonar/other tooling see a single implementation.
 */
function CrmApprovalsPage() {
  return <CrmDealsListScreen listVariant="approvals" />;
}

CrmApprovalsPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmApprovalsPage;
