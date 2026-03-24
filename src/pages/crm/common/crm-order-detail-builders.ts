import type { CrmActivitiesRecord } from "@components/CrmActivitiesPanel";
import type {
  KeyInfoField,
  ProfileField,
} from "@pages/crm/common/crm-detail-layout";
import { formatDateForTable } from "@utils/Helper";

type AnyRecord = Record<string, any>;

export const buildOrderRecordForActivities = (
  orderData: AnyRecord | null | undefined
): CrmActivitiesRecord | null => {
  if (!orderData) return null;

  return {
    id: orderData.id,
    data: {
      id: orderData.id,
      name: orderData.order_number || orderData.customer_name || "",
      phone: orderData.customer_phone || "",
      data: orderData,
    },
    audit_trail: orderData.audit_trail ?? [],
  };
};

export const buildOrderKeyInfoFields = (
  orderData: AnyRecord | null | undefined,
  extensions: Array<AnyRecord>
): KeyInfoField[] => {
  if (!orderData) {
    return [
      { label: "Order Value", value: "N/A", copyable: true },
      { label: "Stage", value: "N/A" },
      { label: "Order Status", value: "N/A" },
      { label: "Order Date", value: "N/A" },
      { label: "Expected Delivery", value: "N/A" },
      { label: "Company Name", value: "N/A" },
      { label: "Order Owner", value: "N/A" },
    ];
  }

  const ownerRaw = orderData.assigned_to;
  const ownerExt =
    extensions.find(
      (ext) => ext?.id == ownerRaw || ext?.extension == ownerRaw
    ) ?? null;

  const ownerDisplay =
    ownerExt?.display_name || ownerExt?.name || ownerRaw || "N/A";

  return [
    {
      label: "Order Value",
      value:
        orderData.final_amount || orderData.total_amount
          ? `${orderData.currency || "AED"} ${Number.parseFloat(
              String(orderData.final_amount || orderData.total_amount)
            ).toLocaleString()}`
          : "N/A",
      copyable: true,
    },
    { label: "Stage", value: orderData?.stage?.name || "N/A" },
    { label: "Order Status", value: orderData?.status || "N/A" },
    {
      label: "Order Date",
      value: orderData?.order_date
        ? formatDateForTable(orderData.order_date)
        : "N/A",
    },
    {
      label: "Expected Delivery",
      value: orderData?.expected_delivery_date
        ? formatDateForTable(orderData.expected_delivery_date)
        : "N/A",
    },
    { label: "Company Name", value: orderData?.customer_name || "N/A" },
    { label: "Order Owner", value: ownerDisplay },
  ];
};

export const buildOrderProfileFields = (args: {
  orderData: AnyRecord | null | undefined;
  relatedDeal: AnyRecord | null | undefined;
}): ProfileField[] => {
  const { orderData, relatedDeal } = args;

  return [
    {
      label: "Company name",
      value:
        relatedDeal?.company?.enrichment_data?.structured_data
          ?.official_company_name ??
        relatedDeal?.company?.name ??
        orderData?.customer_name ??
        "--",
    },
    {
      label: "Street address",
      value:
        relatedDeal?.company?.enrichment_data?.structured_data
          ?.headquarters?.address ??
        relatedDeal?.company?.address ??
        orderData?.billing_address ??
        orderData?.shipping_address ??
        "--",
    },
    {
      label: "City",
      value:
        relatedDeal?.company?.enrichment_data?.structured_data
          ?.headquarters?.city ??
        orderData?.billing_city ??
        orderData?.city ??
        "--",
    },
    {
      label: "Postal code",
      value:
        relatedDeal?.company?.enrichment_data?.structured_data
          ?.headquarters?.postal_code ??
        orderData?.postal_code ??
        orderData?.billing_postal_code ??
        "--",
    },
    {
      label: "State/Region",
      value:
        relatedDeal?.company?.enrichment_data?.structured_data
          ?.headquarters?.state ??
        orderData?.state ??
        orderData?.billing_state ??
        "--",
    },
    {
      label: "Email",
      value:
        relatedDeal?.company?.enrichment_data?.structured_data?.emails?.[0]
          ?.email ??
        orderData?.customer_email ??
        "--",
      link: true,
    },
  ];
};

