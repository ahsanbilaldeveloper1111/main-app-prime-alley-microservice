import Layout from "@layout/index";
import type { ReactElement } from "react";
import {
  CrmDealsListScreenView,
  type CrmDealsListVariant,
} from "@crm/deals/CrmDealsListScreen";

export function CrmDealsListScreen(
  props: Readonly<{ listVariant: CrmDealsListVariant }>,
) {
  return <CrmDealsListScreenView {...props} />;
}

export type { CrmDealsListVariant } from "@crm/deals/CrmDealsListScreen";

function CrmDealsPage() {
  return <CrmDealsListScreen listVariant="deals" />;
}

CrmDealsPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmDealsPage;
