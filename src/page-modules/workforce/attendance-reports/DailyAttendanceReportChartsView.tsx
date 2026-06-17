import ChartDonut from "@components/ChartDonut";
import {
  buildResponsiveLineChartOptions,
  resolveDonutChartHeight,
  resolveLineChartHeight,
} from "@page-modules/chat/shared/chatbotsDashboardChart";
import { useMediaQuery } from "@page-modules/chat/shared/useMediaQuery";
import {
  AttendanceAnalyticsChartCard,
  AttendanceAnalyticsChartEmpty,
  AttendanceAnalyticsStatCard,
} from "@page-modules/workforce/attendance-reports/attendanceAnalyticsUi";
import {
  buildDailyAttendanceSummaryStats,
  buildDailyDepartmentDonutChart,
  buildDailyStatusDonutChart,
  buildDailyWorkedHoursBarChart,
} from "@page-modules/workforce/attendance-reports/dailyAttendanceReportCharts";
import type { DailyAttendanceReportRow } from "@utils/staffManagement";
import { AlertTriangle, Clock, Timer, UserCheck, Users, UserX } from "lucide-react";
import dynamic from "next/dynamic";
import React, { useMemo } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const intFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

export type DailyAttendanceReportChartsViewProps = Readonly<{
  rows: readonly DailyAttendanceReportRow[];
  userLabelById: ReadonlyMap<string, string>;
  reportDate: string;
  loading: boolean;
}>;

export function DailyAttendanceReportChartsView({
  rows,
  userLabelById,
  reportDate,
  loading,
}: DailyAttendanceReportChartsViewProps) {
  const isMobile = useMediaQuery("(max-width: 767.98px)");
  const isTablet = useMediaQuery("(max-width: 991.98px)");

  const lineChartHeight = resolveLineChartHeight(isMobile, isTablet, 340);
  const donutChartHeight = resolveDonutChartHeight(isMobile, isTablet, 320);

  const summary = useMemo(() => buildDailyAttendanceSummaryStats(rows), [rows]);
  const statusDonut = useMemo(() => buildDailyStatusDonutChart(rows), [rows]);
  const departmentDonut = useMemo(() => buildDailyDepartmentDonutChart(rows), [rows]);
  const workedHoursChart = useMemo(
    () => buildDailyWorkedHoursBarChart(rows, userLabelById),
    [rows, userLabelById],
  );

  const workedHoursOptions = useMemo(
    () =>
      buildResponsiveLineChartOptions(
        {
          ...workedHoursChart.options,
          chart: {
            ...workedHoursChart.options.chart,
            type: "bar",
          },
        },
        isMobile,
      ),
    [workedHoursChart.options, isMobile],
  );

  if (loading && rows.length === 0) {
    return (
      <div className="attendance-analytics-dashboard">
        <AttendanceAnalyticsChartEmpty message="Loading daily attendance analytics…" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="attendance-analytics-dashboard">
        <AttendanceAnalyticsChartEmpty message="No attendance records found for the selected filters." />
      </div>
    );
  }

  const statusHasData = statusDonut.series.some((value) => value > 0);
  const departmentHasData = departmentDonut.series.some((value) => value > 0);
  const workedHoursHasData = workedHoursChart.series[0]?.data.some((value) => value > 0) ?? false;

  return (
    <div className="attendance-analytics-dashboard">
      <div className="attendance-analytics-stats-grid">
        <AttendanceAnalyticsStatCard
          title="Employees"
          value={intFmt.format(summary.totalEmployees)}
          icon={<Users size={20} />}
          accent="#2563eb"
        />
        <AttendanceAnalyticsStatCard
          title="Present"
          value={intFmt.format(summary.presentCount)}
          icon={<UserCheck size={20} />}
          accent="#059669"
        />
        <AttendanceAnalyticsStatCard
          title="Late"
          value={intFmt.format(summary.lateCount)}
          icon={<AlertTriangle size={20} />}
          accent="#ea580c"
        />
        <AttendanceAnalyticsStatCard
          title="Absent"
          value={intFmt.format(summary.absentCount)}
          icon={<UserX size={20} />}
          accent="#dc2626"
        />
        <AttendanceAnalyticsStatCard
          title="Total worked"
          value={`${intFmt.format(summary.totalWorkedHours)} hrs`}
          icon={<Clock size={20} />}
          accent="#7c3aed"
        />
        <AttendanceAnalyticsStatCard
          title="Avg worked"
          value={`${intFmt.format(summary.averageWorkedHours)} hrs`}
          icon={<Timer size={20} />}
          accent="#0891b2"
        />
      </div>

      <div className="attendance-analytics-charts-grid attendance-analytics-charts-grid--split">
        <AttendanceAnalyticsChartCard
          title="Status breakdown"
          subtitle={`Attendance status for ${reportDate}.`}
        >
          {statusHasData ? (
            <ChartDonut
              series={statusDonut.series}
              labels={statusDonut.labels}
              colors={statusDonut.colors}
              height={donutChartHeight}
              dataType="custom"
              customTooltipFormatter={(value) => `${Math.round(value)} employees`}
              legendPosition="bottom"
              showDataLabels
            />
          ) : (
            <AttendanceAnalyticsChartEmpty message="No status data to chart." />
          )}
        </AttendanceAnalyticsChartCard>

        <AttendanceAnalyticsChartCard
          title="By department"
          subtitle="Employee count grouped by department."
        >
          {departmentHasData ? (
            <ChartDonut
              series={departmentDonut.series}
              labels={departmentDonut.labels}
              colors={departmentDonut.colors}
              height={donutChartHeight}
              dataType="custom"
              customTooltipFormatter={(value) => `${Math.round(value)} employees`}
              legendPosition="bottom"
              showDataLabels
            />
          ) : (
            <AttendanceAnalyticsChartEmpty message="No department data to chart." />
          )}
        </AttendanceAnalyticsChartCard>
      </div>

      <div className="attendance-analytics-charts-grid">
        <AttendanceAnalyticsChartCard
          title="Worked hours by employee"
          subtitle="Top employees by hours worked on the selected day."
        >
          {workedHoursHasData ? (
            <ReactApexChart
              options={workedHoursOptions}
              series={workedHoursChart.series}
              type="bar"
              height={lineChartHeight}
            />
          ) : (
            <AttendanceAnalyticsChartEmpty message="No worked hours data to chart." />
          )}
        </AttendanceAnalyticsChartCard>
      </div>
    </div>
  );
}
