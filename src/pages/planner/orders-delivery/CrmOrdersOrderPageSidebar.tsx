import React, { useMemo } from "react";
import { GenericSidebar } from "@crm/orders/orderListOrderPageFrame";
import {
  buildCrmOrdersOrderSidebarActions,
  buildCrmOrdersOrderSidebarTabs,
} from "./crmOrdersOrderSidebarTabs";

export type CrmOrdersOrderPageSidebarProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  moduleSlug: string;
  viewingOrder: any;
  relatedDeal: any;
  relatedLead: any;
  extensions: any[];
  showEditAction: boolean;
  onEditOrder: () => void;
  onViewOrderDetails: () => void | Promise<void>;
}>;

export function CrmOrdersOrderPageSidebar(props: CrmOrdersOrderPageSidebarProps) {
  const {
    isOpen,
    onClose,
    moduleSlug,
    viewingOrder,
    relatedDeal,
    relatedLead,
    extensions,
    showEditAction,
    onEditOrder,
    onViewOrderDetails,
  } = props;

  const tabs = useMemo(
    () =>
      buildCrmOrdersOrderSidebarTabs({
        viewingOrder,
        relatedDeal,
        relatedLead,
        extensions,
      }),
    [viewingOrder, relatedDeal, relatedLead, extensions],
  );

  const actions = useMemo(
    () =>
      buildCrmOrdersOrderSidebarActions({
        showEditAction,
        onEditOrder,
        onViewDetails: onViewOrderDetails,
      }),
    [showEditAction, onEditOrder, onViewOrderDetails],
  );

  const title =
    viewingOrder?.order_number ||
    `Order #${viewingOrder?.id}` ||
    "Order Details";

  return (
    <GenericSidebar
      isOpen={isOpen}
      onClose={onClose}
      moduleSlug={moduleSlug}
      title={title}
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
      actions={actions}
    />
  );
}
