import React from "react";
import moment from "moment";
import type { TableColumn } from "@components/GenericTable";
import { CRM_LIST_PAGE_CALL_END_REASONS } from "@utils/crmListPageStaticData";
import { getInitials, getRandomColor } from "@utils/crmNameAvatar";
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
        if (!row.disposition) return null;
        const dispositions = [
          { value: "interested", label: "Interested", color: "success" },
          {
            value: "not_interested",
            label: "Not Interested",
            color: "danger",
          },
          {
            value: "callback_requested",
            label: "Callback Requested",
            color: "warning",
          },
          { value: "no_answer", label: "No Answer", color: "warning" },
          { value: "busy", label: "Busy", color: "info" },
          { value: "do_not_call", label: "Do Not Call", color: "danger" },
          { value: "wrong_number", label: "Wrong Number", color: "info" },
          { value: "follow_up", label: "Follow Up", color: "primary" },
        ];
        const disposition = dispositions.find(
          (d) => d.value === row.disposition,
        );
        if (disposition) return disposition.label;
        const randomDisposition =
          dispositions[Math.floor(Math.random() * dispositions.length)];
        return randomDisposition.label;
      },
      badge: {
        getVariant: (row) => {
          if (!row.disposition) return "secondary";
          const dispositions = [
            { value: "interested", color: "success" },
            { value: "not_interested", color: "danger" },
            { value: "callback_requested", color: "warning" },
            { value: "no_answer", color: "warning" },
            { value: "busy", color: "info" },
            { value: "do_not_call", color: "danger" },
            { value: "wrong_number", color: "info" },
            { value: "follow_up", color: "primary" },
          ];
          const disposition = dispositions.find(
            (d) => d.value === row.disposition,
          );
          if (disposition) return disposition.color as any;
          const randomColors = [
            "success",
            "danger",
            "warning",
            "info",
            "primary",
          ];
          return randomColors[
            Math.floor(Math.random() * randomColors.length)
          ] as any;
        },
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
          return isOverdue ? "danger" : isNextHour ? "warning" : "info";
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
            <span key={idx} className="gt-badge gt-badge-secondary">
              {tag.name || tag}
            </span>
          ))}
        </div>
      ),
    },
  ]);
}
