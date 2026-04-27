import "@crm/orders/orderListPageOrderScss";
import type { ReactElement } from "react";
import { Layout } from "@crm/orders/orderListOrderPageFrame";
import { CrmOrdersPageContentImpl } from "./CrmOrdersPageContentImpl";

const CrmOrdersPageContent = () => <CrmOrdersPageContentImpl />;

const CrmOrdersPage = () => <CrmOrdersPageContent />;

const CrmOrders = () => <CrmOrdersPage />;

CrmOrders.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmOrders;
