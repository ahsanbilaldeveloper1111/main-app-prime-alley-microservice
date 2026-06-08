import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import { useSession } from "next-auth/react";
import { type EmployeeDashboardParams } from "@utils/staffManagement";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import {
  AGING_CHART_COLORS,
  DEPARTMENT_CHART_COLORS,
  departmentNameFromLookup,
  type LeaveCalendarDay,
} from "@page-modules/workforce/dashboard/dashboardDomain";
import { useEmployeeDashboardGraphBundle } from "@page-modules/workforce/dashboard/useEmployeeDashboardGraphBundle";

import DashboardStats from "@page-modules/workforce/dashboard/partials/DashboardStats";
import DashboardPageToolbar, { type DashboardPeriodType } from "@page-modules/workforce/dashboard/partials/DashboardPageToolbar";
import DashboardQuickActions from "@page-modules/workforce/dashboard/partials/DashboardQuickActions";
import DepartmentHeadcountPanel from "@page-modules/workforce/dashboard/partials/DepartmentHeadcountPanel";
import ApprovalsAgingPanel from "@page-modules/workforce/dashboard/partials/ApprovalsAgingPanel";
import LeaveCalendarModal from "@page-modules/workforce/dashboard/partials/LeaveCalendarModal";

import AddEmployeeModal from "@page-modules/workforce/AddEmployeeModal";
import NewRequestModal from "@page-modules/workforce/NewRequestModal";

import { Plus, Calendar, type LucideIcon } from "lucide-react";

import "@page-modules/workforce/dashboard/employeesDashboard.scss";
import { workforceKeys } from "@query/keys";

const { PERMISSIONS } = HEADER_CONSTANTS;

const EmployeesDashboard = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { mainAppUsers, mainAppDepartments, companyIdentifier } = useMainAppLookups();

  const canQuickAddEmployee = Boolean(
    session?.user?.permissions?.includes(PERMISSIONS.ADD_EMPLOYEE_STAFF_MANAGEMENT),
  );
  const canQuickNewRequest = Boolean(
    session?.user?.permissions?.includes(PERMISSIONS.ADD_APPROVAL_REQUEST_STAFF_MANAGEMENT),
  );

  const refreshDashboardQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: workforceKeys.dashboard.all() });
  }, [queryClient]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (router.pathname !== "/workforce/dashboard") return;
      refreshDashboardQueries();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router.pathname, refreshDashboardQueries]);

  useEffect(() => {
    const onRouteDone = (url: unknown) => {
      const path =
        typeof url === "string" ? url.split("?")[0] : "";
      if (path === "/workforce/dashboard") refreshDashboardQueries();
    };
    router.events.on("routeChangeComplete", onRouteDone);
    return () => {
      router.events.off("routeChangeComplete", onRouteDone);
    };
  }, [router.events, refreshDashboardQueries]);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

  const getDisplayName = useCallback(
    (userId: string | number | null | undefined, fallback?: string): string => {
      if (userId == null || userId === "") return fallback ?? "—";
      const lookupKey = String(userId).trim();
      const u = mainAppUsers?.find(
        (x) => String(x.id) === lookupKey || String(x.phone ?? "").trim() === lookupKey,
      );
      return u?.name ?? fallback ?? lookupKey;
    },
    [mainAppUsers],
  );

  const [selectedDays, setSelectedDays] = useState("30");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [periodType, setPeriodType] = useState<DashboardPeriodType>("Monthly");
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [rangeStartDate, setRangeStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [rangeEndDate, setRangeEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [showCalendar, setShowCalendar] = useState(false);

  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );

  const dashboardParams: EmployeeDashboardParams = useMemo(() => {
    const base: EmployeeDashboardParams = { days: selectedDays };
    if (periodType === "Monthly") {
      base.period_type = "monthly";
      return base;
    }
    if (periodType === "Date") {
      base.period_type = "date";
      base.date = selectedDate;
      return base;
    }
    base.period_type = "range";
    base.start_date = rangeStartDate;
    base.end_date = rangeEndDate;
    return base;
  }, [selectedDays, periodType, selectedDate, rangeStartDate, rangeEndDate]);

  const { data: graphBundle } = useEmployeeDashboardGraphBundle(dashboardParams);
  const leaveCalendarData: LeaveCalendarDay[] = graphBundle?.leaveCalendarData ?? [];
  const departmentHeadcountRows = graphBundle?.departmentHeadcountRows ?? [];
  const approvalsAgingData = graphBundle?.approvalsAgingData ?? {};

  const leaveByDate = useMemo(() => {
    const map: Record<string, LeaveCalendarDay> = {};
    leaveCalendarData.forEach((d) => {
      map[d.date] = d;
    });
    return map;
  }, [leaveCalendarData]);

  const calendarMonthInfo = useMemo(() => {
    if (leaveCalendarData.length === 0) {
      const now = new Date();
      return {
        year: now.getFullYear(),
        month: now.getMonth(),
        monthLabel: now.toLocaleString("default", { month: "long", year: "numeric" }),
        daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
        startWeekday: new Date(now.getFullYear(), now.getMonth(), 1).getDay(),
      };
    }
    const firstDate = new Date(leaveCalendarData[0].date);
    const year = firstDate.getFullYear();
    const month = firstDate.getMonth();
    return {
      year,
      month,
      monthLabel: firstDate.toLocaleString("default", { month: "long", year: "numeric" }),
      daysInMonth: new Date(year, month + 1, 0).getDate(),
      startWeekday: new Date(year, month, 1).getDay(),
    };
  }, [leaveCalendarData]);

  const departmentHeadcountData = useMemo(
    () =>
      departmentHeadcountRows.map((row) => ({
        departmentId: row.department_id,
        name: departmentNameFromLookup(row.department_id, mainAppDepartments),
        count: row.count,
      })),
    [departmentHeadcountRows, mainAppDepartments],
  );

  const departmentData = useMemo(() => {
    const list = departmentHeadcountData;
    if (!list.length) return [];
    const total = list.reduce((sum, d) => sum + d.count, 0);
    return list.map((d, idx) => ({
      id: d.departmentId,
      name: d.name,
      value: d.count,
      color: DEPARTMENT_CHART_COLORS[idx % DEPARTMENT_CHART_COLORS.length],
      percentage: total > 0 ? Math.round((d.count / total) * 1000) / 10 : 0,
    }));
  }, [departmentHeadcountData]);

  const approvalsAgingChartData = useMemo(() => {
    const d = approvalsAgingData;
    return [
      { name: "0-3 days", value: d["0_3_days"] ?? 0, fill: AGING_CHART_COLORS[0] },
      { name: "4-7 days", value: d["4_7_days"] ?? 0, fill: AGING_CHART_COLORS[1] },
      { name: "8+ days", value: d["8_plus_days"] ?? 0, fill: AGING_CHART_COLORS[2] },
    ];
  }, [approvalsAgingData]);

  const approvalsAgingTotal =
    (approvalsAgingData["0_3_days"] ?? 0) +
    (approvalsAgingData["4_7_days"] ?? 0) +
    (approvalsAgingData["8_plus_days"] ?? 0);

  const handleAddEmployee = useCallback(() => {
    setShowAddEmployeeModal(true);
  }, []);

  const handleNewRequest = useCallback(() => {
    setShowNewRequestModal(true);
  }, []);

  const handleViewCalendar = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setShowCalendar(true);
  }, []);

  const quickActions = useMemo(() => {
    const items: { icon: LucideIcon; color: string; text: string; onClick: () => void }[] = [];
    if (canQuickAddEmployee) {
      items.push({ icon: Plus, color: "#0066CC", text: "Add Employee", onClick: handleAddEmployee });
    }
    if (canQuickNewRequest) {
      items.push({ icon: Calendar, color: "#0066CC", text: "New Request", onClick: handleNewRequest });
    }
    return items;
  }, [canQuickAddEmployee, canQuickNewRequest, handleAddEmployee, handleNewRequest]);

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Employees Dashboard" />

      <div className="employees-dashboard">
        <div>
          <DashboardPageToolbar
            periodType={periodType}
            setPeriodType={setPeriodType}
            selectedDays={selectedDays}
            setSelectedDays={setSelectedDays}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            rangeStartDate={rangeStartDate}
            setRangeStartDate={setRangeStartDate}
            rangeEndDate={rangeEndDate}
            setRangeEndDate={setRangeEndDate}
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
          />

          <DashboardStats onViewCalendar={handleViewCalendar} params={dashboardParams} />

          {quickActions.length > 0 ? <DashboardQuickActions actions={quickActions} /> : null}

          <div className="employees-dashboard__charts-row">
            <DepartmentHeadcountPanel departmentData={departmentData} />
            <ApprovalsAgingPanel
              approvalsAgingChartData={approvalsAgingChartData}
              approvalsAgingTotal={approvalsAgingTotal}
            />
          </div>
        </div>

        <LeaveCalendarModal
          open={showCalendar}
          onClose={() => setShowCalendar(false)}
          calendarMonthInfo={calendarMonthInfo}
          leaveByDate={leaveByDate}
          selectedCalendarDate={selectedCalendarDate}
          onSelectCalendarDate={setSelectedCalendarDate}
          getDisplayName={getDisplayName}
        />

        <AddEmployeeModal
          show={showAddEmployeeModal}
          onHide={() => setShowAddEmployeeModal(false)}
          onSuccess={refreshDashboardQueries}
          tenantId={companyIdentifier ?? undefined}
        />

        <NewRequestModal
          show={showNewRequestModal}
          onHide={() => setShowNewRequestModal(false)}
          onSuccess={refreshDashboardQueries}
        />
      </div>
    </React.Fragment>
  );
};

EmployeesDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default EmployeesDashboard;
