import React from "react";
import GenericSidebar from "@components/GenericSidebar";
import { ModuleSlug } from "@utils/Helper";
import { Edit, Eye } from "lucide-react";
import {
  buildOrderInvoicingAdditionalTab,
  buildOrderInvoicingGeneralTab,
  buildOrderInvoicingHistoryTab,
  buildOrderInvoicingLeadDealTab,
} from "./orderInvoicingOrderSidebarTabs";

export type OrderInvoicingOrderSidebarProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  viewingOrder: any;
  relatedDeal: any;
  relatedLead: any;
  extensions: any[];
  session: { user?: { permissions?: string[] } } | null;
  activeFilter: string;
  onEditOrder: () => void;
  onViewDetails: () => void;
}>;

export function OrderInvoicingOrderSidebar({
  isOpen,
  onClose,
  viewingOrder,
  relatedDeal,
  relatedLead,
  extensions,
  session,
  activeFilter,
  onEditOrder,
  onViewDetails,
}: OrderInvoicingOrderSidebarProps): React.ReactElement {
  const tabs = [
    buildOrderInvoicingGeneralTab(viewingOrder),
    buildOrderInvoicingLeadDealTab(relatedDeal, relatedLead, extensions),
    buildOrderInvoicingAdditionalTab(viewingOrder, extensions),
    buildOrderInvoicingHistoryTab(viewingOrder),
  ];

  return (
    <GenericSidebar
      isOpen={isOpen}
      onClose={onClose}
      moduleSlug={ModuleSlug.BILLING}
      title={
        viewingOrder?.order_number ||
        `Order #${viewingOrder?.id}` ||
        "Order Details"
      }
      subtitle={viewingOrder?.customer_name || ""}
      metadata={viewingOrder?.id ? `Order ID: ${viewingOrder.id}` : ""}
      email={viewingOrder?.customer_email || ""}
      phone={viewingOrder?.customer_phone || ""}
      avatar={{
        name: viewingOrder?.customer_name || "Order",
        useIcon: true,
      }}
      width="420px"
      tabs={tabs}
      actions={[
        {
          label: "Edit Order",
          icon: Edit,
          onClick: onEditOrder,
          variant: "primary",
          show:
            session?.user?.permissions?.includes("edit-crm-orders") &&
            activeFilter !== "lost",
        },
        {
          label: "View Details",
          icon: Eye,
          onClick: onViewDetails,
          variant: "outline-primary",
        },
      ]}
    />
  );
}
