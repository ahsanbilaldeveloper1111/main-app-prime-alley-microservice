import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useMemo, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import { type EmployeeDashboardParams } from "@utils/staffManagement";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import {
  DEPARTMENT_CHART_COLORS,
  departmentNameFromLookup,
  type LeaveCalendarDay,
} from "./dashboardDomain";
import { useEmployeeDashboardGraphBundle } from "./useEmployeeDashboardGraphBundle";

import DashboardStats from "./partials/DashboardStats";
import DashboardPageToolbar, { type DashboardPeriodType } from "./partials/DashboardPageToolbar";
import DashboardQuickActions from "./partials/DashboardQuickActions";
import DepartmentHeadcountPanel from "./partials/DepartmentHeadcountPanel";
import ApprovalsAgingPanel from "./partials/ApprovalsAgingPanel";
import LeaveCalendarModal from "./partials/LeaveCalendarModal";

import AddEmployeeModal from "@pages/workforce/AddEmployeeModal";
import NewRequestModal from "@pages/workforce/NewRequestModal";

import { Plus, Calendar } from "lucide-react";

import "./employeesDashboard.scss";

const EmployeesDashboard = () => {
  const { mainAppUsers, mainAppDepartments, companyIdentifier } = useMainAppLookups();
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
      { name: "0-3 days", value: d["0_3_days"] ?? 0, fill: "#10B981" },
      { name: "4-7 days", value: d["4_7_days"] ?? 0, fill: "#F59E0B" },
      { name: "8+ days", value: d["8_plus_days"] ?? 0, fill: "#EF4444" },
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

  const quickActions = useMemo(
    () => [
      { icon: Plus, color: "#6366F1", text: "Add Employee", onClick: handleAddEmployee },
      { icon: Calendar, color: "#10B981", text: "New Request", onClick: handleNewRequest },
    ],
    [handleAddEmployee, handleNewRequest],
  );

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

          <DashboardQuickActions actions={quickActions} />

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
          tenantId={companyIdentifier ?? undefined}
        />

        <NewRequestModal show={showNewRequestModal} onHide={() => setShowNewRequestModal(false)} />
      </div>
    </React.Fragment>
  );
};

EmployeesDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default EmployeesDashboard;
