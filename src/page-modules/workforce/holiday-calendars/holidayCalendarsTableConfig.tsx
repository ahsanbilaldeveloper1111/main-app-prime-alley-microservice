import type { TableColumn } from "@components/GenericTable";
import { appendSettingsActionsColumn } from "@components/main-settings/settingsEmbeddedTable";
import {
  formatHolidayCalendarDefaultFlag,
  formatHolidayCalendarHolidaysCount,
  formatHolidayCalendarLabel,
  formatHolidayCalendarYear,
  isHolidayCalendarDraft,
  readHolidayCalendarYear,
  resolveHolidayCalendarTenantId,
  resolveVisibleHolidayCalendarTableColumns,
  type HolidayCalendarTableColumnKey,
  type HolidayTenantOption,
} from "@page-modules/workforce/holiday-calendars/holidayCalendarDomain";
import type { CrmTableRowAction } from "@page-modules/crm/shared/CrmTableRowActions";
import type { HolidayCalendar } from "@utils/staffManagement";
import { CalendarDays, CalendarPlus, Send } from "lucide-react";

const HOLIDAY_TABLE_ACTION_ICON_SIZE = 16;

function holidayStatusBadge(status: string | null | undefined) {
  const label = formatHolidayCalendarLabel(status);
  const normalized = (status ?? "").trim().toLowerCase();
  let color = "#6b7280";
  if (normalized === "published") color = "#10b981";
  if (normalized === "draft") color = "#f59e0b";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontWeight: 500,
        color,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: color,
        }}
      />
      {label}
    </span>
  );
}

function resolveTenantLabel(
  calendar: HolidayCalendar,
  tenantOptions: readonly HolidayTenantOption[],
): string {
  const tenantId = resolveHolidayCalendarTenantId(calendar, "");
  if (!tenantId) return "—";
  return tenantOptions.find((option) => option.value === tenantId)?.label ?? tenantId;
}

function buildHolidayCalendarTableColumn(
  key: HolidayCalendarTableColumnKey,
  tenantOptions: readonly HolidayTenantOption[],
): TableColumn<HolidayCalendar> {
  switch (key) {
    case "name":
      return {
        key,
        label: "Calendar name",
        sortable: true,
        render: (row) => row.name?.trim() || "—",
      };
    case "year":
      return {
        key,
        label: "Year",
        sortable: true,
        accessor: (row) => readHolidayCalendarYear(row) ?? "",
        render: (row) => formatHolidayCalendarYear(readHolidayCalendarYear(row)),
      };
    case "status":
      return {
        key,
        label: "Status",
        sortable: true,
        render: (row) => holidayStatusBadge(row.status),
      };
    case "holidays":
      return {
        key,
        label: "Holidays",
        sortable: false,
        render: (row) => formatHolidayCalendarHolidaysCount(row.holidays),
      };
    case "country_code":
      return {
        key,
        label: "Country",
        sortable: true,
        render: (row) => row.country_code?.trim() || "—",
      };
    case "is_default":
      return {
        key,
        label: "Default",
        sortable: true,
        render: (row) => formatHolidayCalendarDefaultFlag(row.is_default),
      };
    case "description":
      return {
        key,
        label: "Description",
        sortable: false,
        render: (row) => row.description?.trim() || "—",
      };
    case "tenant_id":
      return {
        key,
        label: "Tenant",
        sortable: true,
        render: (row) => resolveTenantLabel(row, tenantOptions),
      };
    default:
      return {
        key,
        label: key,
        sortable: false,
        render: () => "—",
      };
  }
}

export type BuildHolidayCalendarsTableColumnsOptions = Readonly<{
  rows?: readonly HolidayCalendar[];
  isWorkforceAdmin?: boolean;
  tenantOptions?: readonly HolidayTenantOption[];
  onAddHoliday?: (calendar: HolidayCalendar) => void;
  onViewHolidays?: (calendar: HolidayCalendar) => void;
  onPublish?: (calendar: HolidayCalendar) => void;
  publishingCalendarId?: number | null;
}>;

export function buildHolidayCalendarsTableColumns(
  options?: BuildHolidayCalendarsTableColumnsOptions,
): TableColumn<HolidayCalendar>[] {
  const rows = options?.rows ?? [];
  const tenantOptions = options?.tenantOptions ?? [];
  const visibleColumnKeys = resolveVisibleHolidayCalendarTableColumns(rows, {
    includeTenant: options?.isWorkforceAdmin,
  });

  const baseColumns = visibleColumnKeys.map((key) =>
    buildHolidayCalendarTableColumn(key, tenantOptions),
  );

  if (!options?.onAddHoliday && !options?.onPublish && !options?.onViewHolidays) {
    return baseColumns;
  }

  return appendSettingsActionsColumn<HolidayCalendar>(
    baseColumns,
    (row): CrmTableRowAction[] => {
      const calendarLabel = row.name?.trim() || "calendar";
      const isPublishing = options.publishingCalendarId === row.id;
      const actions: CrmTableRowAction[] = [];

      if (options.onViewHolidays) {
        actions.push({
          label: `View holidays in ${calendarLabel}`,
          icon: <CalendarDays size={HOLIDAY_TABLE_ACTION_ICON_SIZE} aria-hidden />,
          tone: "info",
          onClick: () => options.onViewHolidays?.(row),
        });
      }

      if (options.onPublish && isHolidayCalendarDraft(row)) {
        actions.push({
          label: `Publish ${calendarLabel}`,
          icon: <Send size={HOLIDAY_TABLE_ACTION_ICON_SIZE} aria-hidden />,
          tone: "success",
          disabled: isPublishing,
          disabledTitle: isPublishing ? "Publishing calendar..." : undefined,
          onClick: () => options.onPublish?.(row),
        });
      }

      if (options.onAddHoliday) {
        actions.push({
          label: `Add holiday to ${calendarLabel}`,
          icon: <CalendarPlus size={HOLIDAY_TABLE_ACTION_ICON_SIZE} aria-hidden />,
          tone: "primary",
          onClick: () => options.onAddHoliday?.(row),
        });
      }

      return actions;
    },
    { width: "260px" },
  );
}
