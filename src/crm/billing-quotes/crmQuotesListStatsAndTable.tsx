import React from "react";
import moment from "moment";
import { FiCopy, FiEdit } from "react-icons/fi";
import {
  AlertCircle as AlertCircleIcon,
  Clock as ClockIcon,
  Eye,
  FileText,
  Mail,
  MoreVertical,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import type { TableAction, TableColumn } from "@components/GenericTable";
import type { StatsCardData } from "@components/GenericStatsCards";
import type { NextRouter } from "next/router";
import { getInitials, getRandomColor } from "@utils/crmNameAvatar";

/** Quote list metrics used by the shared stats strip (billing + CRM quotes pages). */
export type CrmQuotesListStatsMetrics = {
  pending_count?: number;
  expiring_soon_count?: number;
  total_value?: number;
  signed_count?: number;
};

export function buildCrmQuotesListStatsCards(
  metrics: CrmQuotesListStatsMetrics,
  totalRecords: number,
): StatsCardData[] {
  return [
    {
      title: "Total Quotes",
      value: totalRecords,
      icon: FileText,
      iconColor: "#6366F1",
      iconBgColor: "#EEF2FF",
    },
    {
      title: "Pending Acceptance",
      value: metrics.pending_count ?? 0,
      icon: ClockIcon,
      iconColor: "#F59E0B",
      iconBgColor: "#FEF3C7",
      metric: { text: "Awaiting response", dotColor: "#F59E0B" },
    },
    {
      title: "Expiring Soon",
      value: metrics.expiring_soon_count ?? 0,
      icon: AlertCircleIcon,
      iconColor: "#EF4444",
      iconBgColor: "#FEE2E2",
      metric: { text: "Within 7 days", dotColor: "#EF4444" },
    },
    {
      title: "Total Value",
      value: `$${Number(metrics.total_value ?? 0).toLocaleString()}`,
      icon: Target,
      iconColor: "#10B981",
      iconBgColor: "#D1FAE5",
    },
    {
      title: "Signed Quotes",
      value: metrics.signed_count ?? 0,
      icon: Users,
      iconColor: "#0EA5E9",
      iconBgColor: "#E0F2FE",
    },
  ];
}

export type BuildCrmQuotesListTableColumnsParams = {
  extensions: Array<{ id?: string; display_name?: string }>;
  handleViewData: (row: any) => void;
};

export function buildCrmQuotesListTableColumns(
  params: BuildCrmQuotesListTableColumnsParams,
): TableColumn<any>[] {
  const { extensions, handleViewData } = params;
  return [
    {
      key: "title",
      label: "Quote title",
      sortable: true,
      type: "custom",
      render: (row) => (
        <span
          style={{ color: "#1d6ae5", fontWeight: 500, cursor: "pointer" }}
          onClick={() => handleViewData(row)}
        >
          {row.title || `Quote #${row.id}`}
        </span>
      ),
    },
    {
      key: "status",
      label: "Quote Status",
      sortable: true,
      type: "custom",
      render: (row) => {
        const isPublished = row.status === "Published";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isPublished && (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                  display: "inline-block",
                }}
              />
            )}
            <span style={{ color: "#374151", fontSize: 13 }}>
              {row.status || "Draft"}
            </span>
          </div>
        );
      },
    },
    {
      key: "amount",
      label: "Quote amount",
      sortable: true,
      type: "custom",
      render: (row) => (
        <span style={{ color: "#374151", fontSize: 13 }}>
          {row.amount != null
            ? `US$${Number(row.amount).toLocaleString()}`
            : "--"}
        </span>
      ),
    },
    {
      key: "view_count",
      label: "Quote View Count",
      sortable: true,
      type: "custom",
      render: (row) => (
        <span style={{ color: "#6b7280", fontSize: 13 }}>
          {row.view_count ?? "--"}
        </span>
      ),
    },
    {
      key: "signing_status",
      label: "Signing Status",
      sortable: true,
      type: "custom",
      render: (row) => (
        <span style={{ color: "#f97316", fontSize: 13, fontWeight: 500 }}>
          {row.signing_status || "Not applicable"}
        </span>
      ),
    },
    {
      key: "user_extension",
      label: "Quote owner",
      sortable: true,
      type: "custom",
      render: (row) => {
        const name =
          extensions.find(
            (e: any) => e.id?.toString() === row.user_extension?.toString(),
          )?.display_name ||
          row.user_extension ||
          "—";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: getRandomColor(name),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {getInitials(name)}
            </div>
            <span style={{ fontSize: 13, color: "#374151" }}>{name}</span>
          </div>
        );
      },
    },
    {
      key: "created_at",
      label: "Create date (GMT+5)",
      sortable: true,
      type: "custom",
      render: (row) => (
        <span style={{ fontSize: 13, color: "#374151" }}>
          {row.created_at
            ? moment(row.created_at).format("D MMM YYYY HH:mm [GMT+5]")
            : "--"}
        </span>
      ),
    },
  ];
}

export type BuildCrmQuotesListTableActionsParams = {
  permissions: string[] | undefined;
  router: NextRouter;
  handleViewData: (row: any) => void;
  handleDuplicateQuote: (row: any) => void;
  handleSendToContact: (row: any) => void;
  onRequestDeleteSingleRow: (row: any) => void;
};

export function buildCrmQuotesListTableActions(
  params: BuildCrmQuotesListTableActionsParams,
): TableAction<any>[] {
  const {
    permissions,
    router,
    handleViewData,
    handleDuplicateQuote,
    handleSendToContact,
    onRequestDeleteSingleRow,
  } = params;

  return [
    ...(permissions?.includes("view-crm-data-management")
      ? [
          {
            label: "View",
            icon: <Eye size={16} />,
            onClick: (row: any) => handleViewData(row),
            variant: "link" as const,
          },
        ]
      : []),
    ...(permissions?.includes("edit-crm-data-management")
      ? [
          {
            label: "Edit",
            icon: <FiEdit size={16} />,
            onClick: (row: any) => router.push(`/crm/quotes/${row.id}/edit`),
            variant: "link" as const,
          },
        ]
      : []),
    {
      label: "More Actions",
      icon: <MoreVertical size={16} />,
      variant: "link" as const,
      dropdown: {
        align: "end" as const,
        options: [
          {
            label: "Duplicate",
            icon: <FiCopy size={14} />,
            onClick: (row: any) => handleDuplicateQuote(row),
          },
          {
            label: "Send to Contact",
            icon: <Mail size={14} />,
            onClick: (row: any) => handleSendToContact(row),
          },
          ...(permissions?.includes("delete-crm-data-management")
            ? [
                {
                  label: "Delete",
                  icon: <Trash2 size={14} />,
                  onClick: (row: any) => onRequestDeleteSingleRow(row),
                  className: "text-danger",
                  divider: true,
                },
              ]
            : []),
        ],
      },
    },
  ];
}
