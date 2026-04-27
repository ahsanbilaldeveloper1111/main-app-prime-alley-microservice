import React from "react";
import moment from "moment";
import type { TableColumn } from "@components/GenericTable";
import { formatDateTimeToLocal } from "@utils/Helper";
import { getInitials, getRandomColor } from "@utils/crmNameAvatar";
import {
  formatCrmPersonDispositionLabel,
  getCrmPersonDispositionBadgeVariant,
  getCrmPersonRowDispositionRaw,
} from "@utils/crmPersonDisposition";
import type { CrmProspectsContactsListPageConfig } from "@crm/shared/crmProspectsContactsListPageConfig";
import { CrmPhoneDisplay } from "@components/crm/CrmListPageUi";

function formatCrmCampaignStatusLabel(status: unknown): string {
  if (typeof status !== "string" || !status.trim()) {
    return "";
  }
  const s = status.trim();
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/** Root class `crm-crm-personlist-campaign-col` scopes styles to this column only (see GenericTable.css). */
/** Modifier for `.gt-campaign-status-chip`. */
function crmCampaignStatusChipModifier(status: unknown): string {
  if (typeof status !== "string" || !status.trim()) {
    return "gt-campaign-status--unknown";
  }
  const s = status.trim().toLowerCase();
  if (s === "active") {
    return "gt-campaign-status--active";
  }
  if (s === "inactive" || s === "deactive" || s === "disabled") {
    return "gt-campaign-status--inactive";
  }
  if (s === "draft" || s === "paused") {
    return "gt-campaign-status--warning";
  }
  if (s === "completed" || s === "ended") {
    return "gt-campaign-status--neutral";
  }
  return "gt-campaign-status--info";
}

export function buildCrmProspectsContactsTableColumns(
  config: CrmProspectsContactsListPageConfig,
  extensions: any[],
  campaignStatusById: Readonly<Record<number, string>> = {},
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
      emptyValue: "N/A",
      render: (row) => {
        const raw = row.phone;
        if (raw == null || String(raw).trim() === "") {
          return <span className="gt-empty-cell">N/A</span>;
        }
        return <CrmPhoneDisplay phone={String(raw)} />;
      },
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
      type: "custom",
      width: "min(240px, 38vw)",
      accessor: (row) => row.campaign?.name || "No Campaign",
      render: (row) => {
        const name = row.campaign?.name;
        if (!name) {
          return (
            <div className="crm-crm-personlist-campaign-col d-flex flex-row justify-content-between align-items-center w-100 min-w-0 gap-2 gt-campaign-cell">
              <span className="gt-campaign-name gt-campaign-name--muted text-truncate min-w-0">
                —
              </span>
              <span className="gt-campaign-status-chip gt-campaign-status--none flex-shrink-0">
                No Campaign
              </span>
            </div>
          );
        }
        const campaignIdRaw = row.campaign_id ?? row.campaign?.id;
        const campaignId =
          campaignIdRaw != null && campaignIdRaw !== ""
            ? Number(campaignIdRaw)
            : Number.NaN;
        const statusFromMap =
          Number.isFinite(campaignId) && campaignStatusById[campaignId] != null
            ? campaignStatusById[campaignId]
            : undefined;
        const statusRaw = row.campaign?.status ?? statusFromMap;
        const statusLabel = formatCrmCampaignStatusLabel(statusRaw);
        const title = statusLabel ? `${name} — ${statusLabel}` : name;
        return (
          <div className="crm-crm-personlist-campaign-col d-flex flex-row justify-content-between align-items-center w-100 min-w-0 gap-2 text-start gt-campaign-cell">
            <span className="gt-campaign-name text-truncate min-w-0" title={title}>
              {name}
            </span>
            {statusLabel ? (
              <span
                className={`gt-campaign-status-chip ${crmCampaignStatusChipModifier(statusRaw)} flex-shrink-0`}
              >
                {statusLabel}
              </span>
            ) : (
              <span className="text-muted small flex-shrink-0">—</span>
            )}
          </div>
        );
      },
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
        const formatted = formatDateTimeToLocal(
          row.scheduled_call_at,
          "MMM DD, HH:mm",
        );
        if (formatted === "Invalid Date") {
          return "Not scheduled";
        }
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
