import { EmbeddedSettingsTable } from "@components/main-settings/EmbeddedSettingsTable";
import { SettingsEmbeddedToolbar } from "@components/main-settings/SettingsEmbeddedToolbar";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import { AddHolidaySidebar } from "@page-modules/workforce/holiday-calendars/AddHolidaySidebar";
import { CreateHolidayCalendarSidebar } from "@page-modules/workforce/holiday-calendars/CreateHolidayCalendarSidebar";
import { EditHolidaySidebar } from "@page-modules/workforce/holiday-calendars/EditHolidaySidebar";
import { HolidayManagementFilters } from "@page-modules/workforce/holiday-calendars/HolidayManagementFilters";
import { ViewCalendarHolidaysSidebar } from "@page-modules/workforce/holiday-calendars/ViewCalendarHolidaysSidebar";
import {
  HOLIDAY_LIST_DEFAULT_LIMIT,
  HOLIDAY_LIST_PAGE_SIZE_OPTIONS,
  filterHolidayCalendarsBySearch,
  readCalendarHolidayId,
  type HolidayDepartmentOption,
} from "@page-modules/workforce/holiday-calendars/holidayCalendarDomain";
import { buildHolidayCalendarsTableColumns } from "@page-modules/workforce/holiday-calendars/holidayCalendarsTableConfig";
import { useCreateCalendarHolidayMutation } from "@page-modules/workforce/holiday-calendars/useCreateCalendarHolidayMutation";
import { useCreateHolidayCalendarMutation } from "@page-modules/workforce/holiday-calendars/useCreateHolidayCalendarMutation";
import { useDeleteCalendarHolidayMutation } from "@page-modules/workforce/holiday-calendars/useDeleteCalendarHolidayMutation";
import { useHolidayCalendarsQuery } from "@page-modules/workforce/holiday-calendars/useHolidayCalendarsQuery";
import { usePublishHolidayCalendarMutation } from "@page-modules/workforce/holiday-calendars/usePublishHolidayCalendarMutation";
import { useUpdateCalendarHolidayMutation } from "@page-modules/workforce/holiday-calendars/useUpdateCalendarHolidayMutation";
import { useShiftTenantOptions } from "@page-modules/workforce/shifts/useShiftTenantOptions";
import type { HolidayCalendar, HolidayCalendarHoliday } from "@utils/staffManagement";
import { usePermissions } from "@utils/permissionUtils";
import { Plus } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "react-bootstrap";

export function HolidayManagementTab() {
  const { companyIdentifier, mainAppDepartments, loadingDepartments } = useMainAppLookups();
  const { isAdmin } = usePermissions();
  const isWorkforceAdmin = isAdmin();
  const { tenantOptions, defaultTenantId, isLoading: tenantOptionsLoading } =
    useShiftTenantOptions(isWorkforceAdmin);

  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(HOLIDAY_LIST_DEFAULT_LIMIT);
  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [calendarForView, setCalendarForView] = useState<HolidayCalendar | null>(null);
  const [calendarForHoliday, setCalendarForHoliday] = useState<HolidayCalendar | null>(null);
  const [calendarToPublish, setCalendarToPublish] = useState<HolidayCalendar | null>(null);
  const [editingHoliday, setEditingHoliday] = useState<{
    calendar: HolidayCalendar;
    holiday: HolidayCalendarHoliday;
  } | null>(null);
  const [deletingHoliday, setDeletingHoliday] = useState<{
    calendar: HolidayCalendar;
    holiday: HolidayCalendarHoliday;
  } | null>(null);

  const createHolidayCalendarMutation = useCreateHolidayCalendarMutation();
  const createCalendarHolidayMutation = useCreateCalendarHolidayMutation();
  const updateCalendarHolidayMutation = useUpdateCalendarHolidayMutation();
  const deleteCalendarHolidayMutation = useDeleteCalendarHolidayMutation();
  const publishHolidayCalendarMutation = usePublishHolidayCalendarMutation();

  const departmentOptions = useMemo((): HolidayDepartmentOption[] => {
    return (mainAppDepartments ?? []).map((department) => ({
      value: String(department.id),
      label: department.name?.trim() || String(department.id),
    }));
  }, [mainAppDepartments]);

  const handleAddHoliday = useCallback((calendar: HolidayCalendar) => {
    setCalendarForHoliday(calendar);
  }, []);

  const handleViewHolidays = useCallback((calendar: HolidayCalendar) => {
    setCalendarForView(calendar);
  }, []);

  const handlePublishCalendar = useCallback((calendar: HolidayCalendar) => {
    setCalendarToPublish(calendar);
  }, []);

  const publishingCalendarLabel =
    calendarToPublish?.name?.trim() || "this holiday calendar";
  const deletingHolidayLabel =
    deletingHoliday?.holiday.name?.trim() || "this holiday";

  useEffect(() => {
    if (!defaultTenantId) return;
    setSelectedTenantId((current) => current || defaultTenantId);
  }, [defaultTenantId]);

  const activeTenantId = isWorkforceAdmin
    ? selectedTenantId || defaultTenantId
    : companyIdentifier;

  const holidayCalendarsQuery = useHolidayCalendarsQuery({
    tenantId: activeTenantId,
    year: yearFilter,
    status: statusFilter,
    limit: rowsPerPage,
  });

  const calendarRows = holidayCalendarsQuery.data?.data ?? [];

  const columns = useMemo(
    () =>
      buildHolidayCalendarsTableColumns({
        rows: calendarRows,
        isWorkforceAdmin,
        tenantOptions,
        onAddHoliday: handleAddHoliday,
        onViewHolidays: handleViewHolidays,
        onPublish: handlePublishCalendar,
        publishingCalendarId: publishHolidayCalendarMutation.isPending
          ? publishHolidayCalendarMutation.variables ?? null
          : null,
      }),
    [
      calendarRows,
      handleAddHoliday,
      handlePublishCalendar,
      handleViewHolidays,
      isWorkforceAdmin,
      publishHolidayCalendarMutation.isPending,
      publishHolidayCalendarMutation.variables,
      tenantOptions,
    ],
  );

  const searchedRows = useMemo(
    () => filterHolidayCalendarsBySearch(calendarRows, searchValue),
    [calendarRows, searchValue],
  );

  const filteredRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return searchedRows.slice(start, start + rowsPerPage);
  }, [currentPage, rowsPerPage, searchedRows]);

  const totalRows = searchedRows.length;

  const resetToFirstPage = () => {
    setCurrentPage(1);
  };

  const addButton = (
    <Button
      variant="primary"
      size="sm"
      type="button"
      className="shadow-sm"
      disabled={!activeTenantId}
      onClick={() => setShowCreateSidebar(true)}
    >
      <Plus size={16} className="me-1" aria-hidden />
      Create calendar
    </Button>
  );

  if (!companyIdentifier) {
    return (
      <div className="settings-section-shell__no-permission">
        Company context is not available. Sign in again or select a company to load holiday calendars.
      </div>
    );
  }

  return (
    <div className="workforce-settings-panel">
      <div className="settings-embedded-page">
        <SettingsEmbeddedToolbar
          searchValue={searchValue}
          onSearchChange={(value) => {
            setSearchValue(value);
            resetToFirstPage();
          }}
          searchPlaceholder="Search holiday calendars..."
          actions={addButton}
        />

        <HolidayManagementFilters
          isWorkforceAdmin={isWorkforceAdmin}
          tenantOptions={tenantOptions}
          tenantOptionsLoading={tenantOptionsLoading}
          activeTenantId={activeTenantId ?? ""}
          yearFilter={yearFilter}
          statusFilter={statusFilter}
          onTenantChange={(tenantId) => {
            setSelectedTenantId(tenantId);
            resetToFirstPage();
          }}
          onYearChange={(year) => {
            setYearFilter(year);
            resetToFirstPage();
          }}
          onStatusChange={(status) => {
            setStatusFilter(status);
            resetToFirstPage();
          }}
        />

        <EmbeddedSettingsTable
          embedded
          data={filteredRows}
          columns={columns}
          loading={holidayCalendarsQuery.isFetching}
          emptyMessage="No holiday calendars found."
          pagination={{
            currentPage,
            rowsPerPage,
            totalRows,
            pageSizeOptions: [...HOLIDAY_LIST_PAGE_SIZE_OPTIONS],
          }}
          onPaginationChange={(page, perPage) => {
            setCurrentPage(page);
            setRowsPerPage(perPage);
          }}
          uniqueKey="id"
          sortable
          hover
        />
      </div>

      <CreateHolidayCalendarSidebar
        show={showCreateSidebar}
        isAdmin={isWorkforceAdmin}
        tenantOptions={tenantOptions}
        lockedTenantId={activeTenantId ?? companyIdentifier}
        isSubmitting={createHolidayCalendarMutation.isPending}
        onClose={() => {
          if (createHolidayCalendarMutation.isPending) return;
          setShowCreateSidebar(false);
        }}
        onSubmit={({ tenantId, form }) => {
          createHolidayCalendarMutation.mutate(
            { tenantId, form },
            {
              onSuccess: () => {
                setShowCreateSidebar(false);
              },
            },
          );
        }}
      />

      <ViewCalendarHolidaysSidebar
        show={calendarForView != null}
        calendar={calendarForView}
        departmentOptions={departmentOptions}
        onClose={() => setCalendarForView(null)}
        onAddHoliday={handleAddHoliday}
        onEditHoliday={(calendar, holiday) => {
          setEditingHoliday({ calendar, holiday });
        }}
        onDeleteHoliday={(calendar, holiday) => {
          setDeletingHoliday({ calendar, holiday });
        }}
      />

      <EditHolidaySidebar
        show={editingHoliday != null}
        calendar={editingHoliday?.calendar ?? null}
        holiday={editingHoliday?.holiday ?? null}
        departmentOptions={departmentOptions}
        departmentsLoading={loadingDepartments}
        isSubmitting={updateCalendarHolidayMutation.isPending}
        onClose={() => {
          if (updateCalendarHolidayMutation.isPending) return;
          setEditingHoliday(null);
        }}
        onSubmit={({ calendarId, holidayId, form }) => {
          updateCalendarHolidayMutation.mutate(
            { calendarId, holidayId, form },
            {
              onSuccess: () => {
                setEditingHoliday(null);
              },
            },
          );
        }}
      />

      <AddHolidaySidebar
        show={calendarForHoliday != null}
        calendar={calendarForHoliday}
        departmentOptions={departmentOptions}
        departmentsLoading={loadingDepartments}
        isSubmitting={createCalendarHolidayMutation.isPending}
        onClose={() => {
          if (createCalendarHolidayMutation.isPending) return;
          setCalendarForHoliday(null);
        }}
        onSubmit={({ calendarId, form }) => {
          createCalendarHolidayMutation.mutate(
            { calendarId, form },
            {
              onSuccess: () => {
                setCalendarForHoliday(null);
              },
            },
          );
        }}
      />

      <ConfirmModal
        show={Boolean(deletingHoliday)}
        onHide={() => {
          if (deleteCalendarHolidayMutation.isPending) return;
          setDeletingHoliday(null);
        }}
        title="Delete holiday"
        description="Are you sure you want to delete {targetName}? This action cannot be undone."
        targetName={deletingHolidayLabel}
        confirmButtonText="Delete holiday"
        confirmButtonVariant="danger"
        requireTextConfirmation={false}
        loading={deleteCalendarHolidayMutation.isPending}
        onConfirm={() => {
          if (!deletingHoliday) return;
          const holidayId = readCalendarHolidayId(deletingHoliday.holiday);
          if (holidayId == null) return;
          deleteCalendarHolidayMutation.mutate(
            {
              calendarId: deletingHoliday.calendar.id,
              holidayId,
            },
            {
              onSuccess: () => {
                setDeletingHoliday(null);
              },
            },
          );
        }}
        onCancel={() => {
          if (deleteCalendarHolidayMutation.isPending) return;
          setDeletingHoliday(null);
        }}
      />

      <ConfirmModal
        show={Boolean(calendarToPublish)}
        onHide={() => {
          if (publishHolidayCalendarMutation.isPending) return;
          setCalendarToPublish(null);
        }}
        title="Publish holiday calendar"
        description="Are you sure you want to publish {targetName}? Once published, the calendar will be active for the organization."
        targetName={publishingCalendarLabel}
        confirmButtonText="Publish calendar"
        confirmButtonVariant="success"
        requireTextConfirmation={false}
        loading={publishHolidayCalendarMutation.isPending}
        onConfirm={() => {
          if (!calendarToPublish) return;
          publishHolidayCalendarMutation.mutate(calendarToPublish.id, {
            onSuccess: () => {
              setCalendarToPublish(null);
            },
          });
        }}
        onCancel={() => {
          if (publishHolidayCalendarMutation.isPending) return;
          setCalendarToPublish(null);
        }}
      />
    </div>
  );
}
