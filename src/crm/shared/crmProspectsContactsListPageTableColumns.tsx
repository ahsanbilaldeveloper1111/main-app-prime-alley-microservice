import React from "react";
import moment from "moment";
import type { TableColumn } from "@components/GenericTable";
import { CRM_LIST_PAGE_CALL_END_REASONS } from "@utils/crmListPageStaticData";
import { getInitials, getRandomColor } from "@utils/crmNameAvatar";
import {
  formatCrmPersonDispositionLabel,
  getCrmPersonDispositionBadgeVariant,
  getCrmPersonRowDispositionRaw,
} from "@utils/crmPersonDisposition";
import type { CrmProspectsContactsListPageConfig } from "@crm/shared/crmProspectsContactsListPageConfig";

export function buildCrmProspectsContactsTableColumns(
  config: CrmProspectsContactsListPageConfig,
  extensions: any[],
): TableColumn<any>[] {
  return config.augmentTableColumns([
    {
      key: "name",
      label: "Name",
      sortable: true,
      type: "avatar",
      avatar: {
        getInitials: (row) => getInitials(row.name),
        getColor: (row) => getRandomColor(row.name),
      },
      emptyValue: "N/A",
    },
    {
      key: "phone",
      label: "Phone",
      sortable: true,
      type: "custom",
      align: "left",
    },
    {
      key: "source_file",
      label: "Source",
      sortable: true,
      type: "badge",
      badge: {
        getVariant: () => "secondary",
      },
      emptyValue: "N/A",
    },
    {
      key: "user_extension",
      label: "Owner",
      sortable: true,
      type: "badge",
      accessor: (row) => {
        const extension = extensions.find(
          (ext: any) => ext.id.toString() === row.user_extension?.toString(),
        );
        return row.user_extension
          ? extension?.display_name || row.user_extension
          : "Unassigned";
      },
      badge: {
        getVariant: (row) => (row.user_extension ? "success" : "secondary"),
        showDot: () => true,
      },
    },
    {
      key: "campaign",
      label: "Campaign",
      sortable: true,
      type: "badge",
      accessor: (row) => row.campaign?.name || "No Campaign",
      badge: {
        getVariant: (row) => (row.campaign ? "primary" : "info"),
      },
    },
    {
      key: "last_called_at",
      label: "Last Called",
      sortable: true,
      type: "text",
      accessor: (row) =>
        row.last_called_at
          ? moment(row.last_called_at).format("MMM DD, HH:mm")
          : "-",
    },
    {
      key: "last_call_end_reason",
      label: "Last Call Status",
      sortable: true,
      type: "badge",
      accessor: (row) => {
        if (!row.last_call_end_reason) return null;
        const endReason = CRM_LIST_PAGE_CALL_END_REASONS.find(
          (r) => r.value === row.last_call_end_reason,
        );
        return endReason?.label || row.last_call_end_reason;
      },
      badge: {
        getVariant: (row) => {
          if (!row.last_call_end_reason) return "secondary";
          const endReason = CRM_LIST_PAGE_CALL_END_REASONS.find(
            (r) => r.value === row.last_call_end_reason,
          );
          return (endReason?.color as any) || "secondary";
        },
      },
      emptyValue: "-",
    },
    {
      key: "disposition",
      label: "Disposition",
      sortable: true,
      type: "badge",
      accessor: (row) => {
        const raw = getCrmPersonRowDispositionRaw(row);
        if (!raw) {
          return null;
        }
        return formatCrmPersonDispositionLabel(raw);
      },
      badge: {
        getVariant: (row) =>
          getCrmPersonDispositionBadgeVariant(getCrmPersonRowDispositionRaw(row)),
      },
      emptyValue: "-",
    },
    {
      key: "scheduled_call_at",
      label: "Next Call",
      sortable: true,
      type: "badge",
      accessor: (row) => {
        if (!row.scheduled_call_at) return "Not scheduled";
        const isOverdue = moment(row.scheduled_call_at).isBefore(moment());
        const isNextHour = moment(row.scheduled_call_at).isBefore(
          moment().add(1, "hour"),
        );
        const formatted = moment(row.scheduled_call_at).format(
          "MMM DD, HH:mm",
        );
        if (isOverdue) return `${formatted} (Overdue)`;
        if (isNextHour) return `${formatted} (Soon)`;
        return formatted;
      },
      badge: {
        getVariant: (row) => {
          if (!row.scheduled_call_at) return "info";
          const isOverdue = moment(row.scheduled_call_at).isBefore(moment());
          const isNextHour = moment(row.scheduled_call_at).isBefore(
            moment().add(1, "hour"),
          );
          if (isOverdue) return "danger";
          if (isNextHour) return "warning";
          return "info";
        },
      },
    },
    {
      key: "tags",
      label: "Tags",
      sortable: false,
      type: "custom",
      render: (row) => (
        <div className="d-flex gap-1 flex-wrap">
          {(row.tags || []).map((tag: any, idx: number) => (
            <span key={`${tag.name}-${idx}`} className="gt-badge gt-badge-secondary">
              {tag.name || tag}
            </span>
          ))}
        </div>
      ),
    },
  ]);
}
