import React from "react";
import type { SidebarAction, SidebarTab } from "@components/GenericSidebar";
import { formatDateForTable } from "@utils/Helper";
import {
  ShoppingBag,
  DollarSign,
  Calendar,
  User,
  Building2,
  Mail,
  Phone,
  Link2,
  Target,
  FileText,
  AlertCircle,
  History,
  Edit,
  Eye,
} from "@crm/orders/orderListLucideHeavy";
import {
  crmPlannerExtensionDisplayName,
  formatDealValue,
  formatOrderAmount,
  fulfillmentBadgeVariant,
  leadPotentialBadgeVariant,
  orderApprovalBadgeVariant,
  orderStatusBadgeVariant,
  paymentBadgeVariant,
} from "./crmOrdersPlannerOrderDisplayHelpers";

function CrmOrdersSidebarHistoryList(props: Readonly<{ histories: any[] }>) {
  const { histories } = props;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {histories.map((history: any, idx: number) => (
        <div
          key={history.id || idx}
          style={{
            padding: "16px",
            backgroundColor: "#f9fafb",
            borderRadius: "10px",
            border: "1px solid #f3f4f6",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#111827",
              marginBottom: "6px",
            }}
          >
            {history.action || "Activity"}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#6b7280",
              marginBottom: "4px",
            }}
          >
            by {history.user?.name || history.created_by || "System"}
          </div>
          <div style={{ fontSize: "11px", color: "#9ca3af" }}>
            {history.created_at
              ? formatDateForTable(history.created_at)
              : "N/A"}
          </div>
          {history.description ? (
            <div
              style={{
                marginTop: "8px",
                fontSize: "12px",
                color: "#4b5563",
                fontStyle: "italic",
              }}
            >
              {history.description}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function buildGeneralTab(viewingOrder: any): SidebarTab {
  return {
    id: "general",
    label: "General Information",
    sections: [
      {
        id: "order-info",
        title: "Order Information",
        icon: ShoppingBag,
        fields: [
          {
            label: "Order Number",
            value:
              viewingOrder?.order_number ||
              `ORD-${viewingOrder?.id}` ||
              "N/A",
            type: "text" as const,
          },
          {
            label: "Stage",
            value: viewingOrder?.stage?.name || "Not assigned",
            type: "badge" as const,
            badgeVariant: "secondary",
            show: Boolean(viewingOrder?.stage),
          },
          {
            label: "Status",
            value: viewingOrder?.status || "N/A",
            type: "badge" as const,
            badgeVariant: orderStatusBadgeVariant(viewingOrder?.status),
          },
          {
            label: "Final Amount",
            value: formatOrderAmount(viewingOrder),
            type: "text" as const,
            icon: DollarSign,
          },
          {
            label: "Order Date",
            value: viewingOrder?.order_date,
            type: "date" as const,
            icon: Calendar,
            show: Boolean(viewingOrder?.order_date),
          },
          {
            label: "Expected Delivery",
            value: viewingOrder?.expected_delivery_date,
            type: "date" as const,
            icon: Calendar,
            show: Boolean(viewingOrder?.expected_delivery_date),
          },
          {
            label: "Industry",
            value: viewingOrder?.industry || "N/A",
            type: "text" as const,
            show: Boolean(viewingOrder?.industry),
          },
        ],
      },
      {
        id: "customer-info",
        title: "Company Information",
        icon: User,
        fields: [
          {
            label: "Company Name",
            value: viewingOrder?.customer_name || "N/A",
            type: "text" as const,
            icon: Building2,
          },
          {
            label: "Email",
            value: viewingOrder?.customer_email || "N/A",
            type: "text" as const,
            icon: Mail,
            show: Boolean(viewingOrder?.customer_email),
          },
          {
            label: "Phone",
            value: viewingOrder?.customer_phone || "N/A",
            type: "text" as const,
            icon: Phone,
            show: Boolean(viewingOrder?.customer_phone),
          },
          {
            label: "Address",
            value: viewingOrder?.customer_address || "N/A",
            type: "text" as const,
            show: Boolean(viewingOrder?.customer_address),
          },
        ],
      },
    ],
  };
}

function buildLeadDealSections(
  relatedDeal: any,
  relatedLead: any,
  extensions: any[],
): SidebarTab["sections"] {
  const sections: SidebarTab["sections"] = [];

  if (relatedDeal) {
    sections.push({
      id: "deal-info",
      title: "Deal Information",
      icon: Link2,
      fields: [
        {
          label: "Deal Name",
          value: relatedDeal?.name || "N/A",
          type: "text" as const,
        },
        {
          label: "Stage",
          value: relatedDeal?.stage?.name || "Not assigned",
          type: "badge" as const,
          badgeVariant: "primary",
          show: Boolean(relatedDeal?.stage),
        },
        {
          label: "Deal Value",
          value: formatDealValue(relatedDeal),
          type: "text" as const,
          icon: DollarSign,
          show: Boolean(relatedDeal?.net_value || relatedDeal?.grand_total),
        },
        {
          label: "Assigned To",
          value: crmPlannerExtensionDisplayName(
            extensions,
            relatedDeal?.assigned_to,
          ),
          type: "text" as const,
          icon: User,
          show: Boolean(relatedDeal?.assigned_to),
        },
        {
          label: "Created Date",
          value: relatedDeal?.created_at,
          type: "date" as const,
          icon: Calendar,
          show: Boolean(relatedDeal?.created_at),
        },
      ],
    });
  }

  if (relatedDeal?.company_name) {
    sections.push({
      id: "deal-company-info",
      title: "Deal Company Information",
      icon: Building2,
      fields: [
        {
          label: "Company Name",
          value: relatedDeal?.company_name || "N/A",
          type: "text" as const,
          icon: Building2,
        },
        {
          label: "Industry",
          value: relatedDeal?.industry || "N/A",
          type: "text" as const,
          show: Boolean(relatedDeal?.industry),
        },
      ],
    });
  }

  if (relatedLead) {
    sections.push({
      id: "lead-info",
      title: "Lead Information",
      icon: Target,
      fields: [
        {
          label: "Lead Name",
          value: relatedLead?.name || "N/A",
          type: "text" as const,
        },
        {
          label: "Stage",
          value: relatedLead?.stage?.name || "Not assigned",
          type: "badge" as const,
          badgeVariant: "primary",
          show: Boolean(relatedLead?.stage),
        },
        {
          label: "Lead Potential",
          value: relatedLead?.lead_potential || "N/A",
          type: "badge" as const,
          badgeVariant: leadPotentialBadgeVariant(
            relatedLead?.lead_potential,
          ),
          show: Boolean(relatedLead?.lead_potential),
        },
        {
          label: "Status",
          value: relatedLead?.status || "N/A",
          type: "text" as const,
          show: Boolean(relatedLead?.status),
        },
        {
          label: "Assigned To",
          value: crmPlannerExtensionDisplayName(
            extensions,
            relatedLead?.assigned_to,
          ),
          type: "text" as const,
          icon: User,
          show: Boolean(relatedLead?.assigned_to),
        },
        {
          label: "Created Date",
          value: relatedLead?.created_at,
          type: "date" as const,
          icon: Calendar,
          show: Boolean(relatedLead?.created_at),
        },
      ],
    });
  }

  if (relatedLead?.campaign) {
    sections.push({
      id: "campaign-info",
      title: "Campaign Information",
      icon: FileText,
      fields: [
        {
          label: "Campaign Name",
          value: relatedLead?.campaign?.name || "N/A",
          type: "text" as const,
        },
      ],
    });
  }

  if (relatedLead?.crm_data) {
    const crm = relatedLead.crm_data;
    sections.push({
      id: "prospect-info",
      title: "Prospect Information",
      icon: User,
      fields: [
        {
          label: "CRM Data ID",
          value: crm?.id ? `#${crm.id}` : "N/A",
          type: "text" as const,
          show: Boolean(crm?.id),
        },
        {
          label: "Name",
          value: crm?.name || crm?.data?.name || "N/A",
          type: "text" as const,
        },
        {
          label: "Phone",
          value: crm?.phone || crm?.data?.phone || "N/A",
          type: "text" as const,
          icon: Phone,
        },
        {
          label: "Source File",
          value: crm?.source_file || "N/A",
          type: "text" as const,
          show: Boolean(crm?.source_file),
        },
        {
          label: "Uploaded By",
          value: crm?.uploaded_by || "N/A",
          type: "text" as const,
          icon: User,
          show: Boolean(crm?.uploaded_by),
        },
        {
          label: "Created At",
          value: crm?.created_at,
          type: "date" as const,
          icon: Calendar,
          show: Boolean(crm?.created_at),
        },
      ],
    });
  }

  if (!relatedDeal && !relatedLead) {
    sections.push({
      id: "no-info",
      title: "No Information Available",
      icon: AlertCircle,
      emptyState: {
        icon: AlertCircle,
        message: "No deal or lead information available for this order",
      },
    });
  }

  return sections;
}

function buildAdditionalInfoTab(
  viewingOrder: any,
  extensions: any[],
): SidebarTab {
  return {
    id: "additional-info",
    label: "Additional Information",
    sections: [
      {
        id: "additional-details",
        title: "Additional Information",
        icon: FileText,
        fields: [
          {
            label: "Approval Status",
            value: viewingOrder?.order_approval_status || "Not Set",
            type: "badge" as const,
            badgeVariant: orderApprovalBadgeVariant(
              viewingOrder?.order_approval_status,
            ),
          },
          {
            label: "Fulfillment Status",
            value: viewingOrder?.fulfillment_status || "Not Set",
            type: "badge" as const,
            badgeVariant: fulfillmentBadgeVariant(
              viewingOrder?.fulfillment_status,
            ),
          },
          {
            label: "Payment Status",
            value: viewingOrder?.payment_status || "Not Set",
            type: "badge" as const,
            badgeVariant: paymentBadgeVariant(viewingOrder?.payment_status),
          },
          {
            label: "Assigned To",
            value: crmPlannerExtensionDisplayName(
              extensions,
              viewingOrder?.assigned_to,
            ),
            type: "text" as const,
            icon: User,
            show: Boolean(viewingOrder?.assigned_to),
          },
          {
            label: "Contract Length",
            value: viewingOrder?.contract_length || "N/A",
            type: "text" as const,
            show: Boolean(viewingOrder?.contract_length),
          },
        ],
      },
      {
        id: "notes",
        title: "Notes",
        icon: FileText,
        fields: viewingOrder?.notes
          ? [
              {
                label: "Notes",
                value: viewingOrder?.notes,
                type: "text" as const,
              },
            ]
          : [],
        emptyState: viewingOrder?.notes
          ? undefined
          : {
              icon: FileText,
              message: "No notes available",
            },
      },
    ],
  };
}

function buildHistoryTab(viewingOrder: any): SidebarTab {
  const histories = viewingOrder?.histories;
  const hasHistories = Array.isArray(histories) && histories.length > 0;
  return {
    id: "history",
    label: "History",
    sections: [
      {
        id: "activity-history",
        title: "Activity History",
        icon: History,
        badge: {
          value: histories?.length || 0,
          variant: "secondary",
        },
        emptyState: hasHistories
          ? undefined
          : {
              icon: History,
              message: "No activity history yet",
            },
        customContent: hasHistories ? (
          <CrmOrdersSidebarHistoryList histories={histories} />
        ) : undefined,
      },
    ],
  };
}

export type BuildCrmOrdersOrderSidebarTabsInput = Readonly<{
  viewingOrder: any;
  relatedDeal: any;
  relatedLead: any;
  extensions: any[];
}>;

export function buildCrmOrdersOrderSidebarTabs(
  input: BuildCrmOrdersOrderSidebarTabsInput,
): SidebarTab[] {
  const { viewingOrder, relatedDeal, relatedLead, extensions } = input;
  return [
    buildGeneralTab(viewingOrder),
    {
      id: "lead-deal",
      label: "Lead/Deal Information",
      sections: buildLeadDealSections(relatedDeal, relatedLead, extensions),
    },
    buildAdditionalInfoTab(viewingOrder, extensions),
    buildHistoryTab(viewingOrder),
  ];
}

export type BuildCrmOrdersOrderSidebarActionsInput = Readonly<{
  showEditAction: boolean;
  onEditOrder: () => void;
  onViewDetails: () => void | Promise<void>;
}>;

export function buildCrmOrdersOrderSidebarActions(
  input: BuildCrmOrdersOrderSidebarActionsInput,
): SidebarAction[] {
  return [
    {
      label: "Edit Order",
      icon: Edit,
      onClick: input.onEditOrder,
      variant: "primary",
      show: input.showEditAction,
    },
    {
      label: "View Details",
      icon: Eye,
      onClick: () => {
        void input.onViewDetails();
      },
      variant: "outline-primary",
    },
  ];
}
