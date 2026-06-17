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
import { buildMonthlyReportSummaryCards } from "@page-modules/workforce/attendance-reports/monthlyAttendanceReportDomain";
import {
  buildMonthlyAttendanceMixDonut,
  buildMonthlyAttendanceRateBarChart,
  buildMonthlyEmployeeDaysBarChart,
  buildMonthlyTrendLineChart,
} from "@page-modules/workforce/attendance-reports/monthlyAttendanceReportCharts";
import type {
  MonthlyAttendanceReportRow,
  MonthlyAttendanceReportSummary,
  MonthlyAttendanceReportTrendPoint,
} from "@utils/staffManagement";
import { AlertTriangle, CalendarRange, Clock, TrendingUp, UserX } from "lucide-react";
import dynamic from "next/dynamic";
import React, { useMemo } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const SUMMARY_CARD_META: Record<
  string,
  Readonly<{ icon: React.ReactNode; accent: string }>
> = {
  average_attendance_rate: { icon: <TrendingUp size={20} />, accent: "#2563eb" },
  total_late_arrivals: { icon: <AlertTriangle size={20} />, accent: "#ea580c" },
  total_absent_days: { icon: <UserX size={20} />, accent: "#dc2626" },
  total_overtime_hours: { icon: <Clock size={20} />, accent: "#7c3aed" },
};

export type MonthlyAttendanceReportChartsViewProps = Readonly<{
  rows: readonly MonthlyAttendanceReportRow[];
  trend: readonly MonthlyAttendanceReportTrendPoint[];
  summary: MonthlyAttendanceReportSummary;
  userLabelById: ReadonlyMap<string, string>;
  reportMonth: string;
  apiMonth?: string | null;
  loading: boolean;
}>;

export function MonthlyAttendanceReportChartsView({
  rows,
  trend,
  summary,
  userLabelById,
  reportMonth,
  apiMonth,
  loading,
}: MonthlyAttendanceReportChartsViewProps) {
  const isMobile = useMediaQuery("(max-width: 767.98px)");
  const isTablet = useMediaQuery("(max-width: 991.98px)");

  const lineChartHeight = resolveLineChartHeight(isMobile, isTablet, 340);
  const donutChartHeight = resolveDonutChartHeight(isMobile, isTablet, 320);
  const barChartHeight = resolveLineChartHeight(isMobile, isTablet, 380);

  const resolvedMonth = apiMonth?.trim() || reportMonth;
  const summaryCards = useMemo(() => buildMonthlyReportSummaryCards(summary), [summary]);
  const trendChart = useMemo(() => buildMonthlyTrendLineChart(trend), [trend]);
  const mixDonut = useMemo(() => buildMonthlyAttendanceMixDonut(rows), [rows]);
  const employeeDaysChart = useMemo(
    () => buildMonthlyEmployeeDaysBarChart(rows, userLabelById),
    [rows, userLabelById],
  );
  const attendanceRateChart = useMemo(
    () => buildMonthlyAttendanceRateBarChart(rows, userLabelById),
    [rows, userLabelById],
  );

  const trendOptions = useMemo(
    () => buildResponsiveLineChartOptions(trendChart.options, isMobile),
    [trendChart.options, isMobile],
  );

  const employeeDaysOptions = useMemo(
    () => buildResponsiveLineChartOptions(employeeDaysChart.options, isMobile),
    [employeeDaysChart.options, isMobile],
  );

  const attendanceRateOptions = useMemo(
    () => buildResponsiveLineChartOptions(attendanceRateChart.options, isMobile),
    [attendanceRateChart.options, isMobile],
  );

  if (loading && rows.length === 0 && trend.length === 0) {
    return (
      <div className="attendance-analytics-dashboard">
        <AttendanceAnalyticsChartEmpty message="Loading monthly attendance analytics…" />
      </div>
    );
  }

  const trendHasData = trend.length > 0;
  const mixHasData = mixDonut.series.some((value) => value > 0);
  const employeeDaysHasData =
    employeeDaysChart.series.some((series) => series.data.some((value) => value > 0)) ?? false;
  const attendanceRateHasData =
    attendanceRateChart.series[0]?.data.some((value) => value > 0) ?? false;

  return (
    <div className="attendance-analytics-dashboard">
      <div className="attendance-analytics-stats-grid attendance-analytics-stats-grid--monthly">
        {summaryCards.map((card) => {
          const meta = SUMMARY_CARD_META[card.key] ?? {
            icon: <CalendarRange size={20} />,
            accent: "#2563eb",
          };
          return (
            <AttendanceAnalyticsStatCard
              key={card.key}
              title={card.label}
              value={card.value}
              icon={meta.icon}
              accent={meta.accent}
            />
          );
        })}
      </div>

      <div className="attendance-analytics-charts-grid">
        <AttendanceAnalyticsChartCard
          title={`Attendance trend — ${resolvedMonth}`}
          subtitle="Daily attendance rate and present count across the month."
        >
          {trendHasData ? (
            <ReactApexChart
              options={trendOptions}
              series={trendChart.series}
              type="line"
              height={lineChartHeight}
            />
          ) : (
            <AttendanceAnalyticsChartEmpty message="No trend data available for this month." />
          )}
        </AttendanceAnalyticsChartCard>
      </div>

      <div className="attendance-analytics-charts-grid attendance-analytics-charts-grid--split">
        <AttendanceAnalyticsChartCard
          title="Attendance mix"
          subtitle="Present, absent, and leave days across all employees."
        >
          {mixHasData ? (
            <ChartDonut
              series={mixDonut.series}
              labels={mixDonut.labels}
              colors={mixDonut.colors}
              height={donutChartHeight}
              dataType="custom"
              customTooltipFormatter={(value) => `${Math.round(value)} days`}
              legendPosition="bottom"
              showDataLabels
            />
          ) : (
            <AttendanceAnalyticsChartEmpty message="No attendance mix data to chart." />
          )}
        </AttendanceAnalyticsChartCard>

        <AttendanceAnalyticsChartCard
          title="Attendance rate by employee"
          subtitle="Top employees by monthly attendance rate."
        >
          {attendanceRateHasData ? (
            <ReactApexChart
              options={attendanceRateOptions}
              series={attendanceRateChart.series}
              type="bar"
              height={barChartHeight}
            />
          ) : (
            <AttendanceAnalyticsChartEmpty message="No employee attendance rates to chart." />
          )}
        </AttendanceAnalyticsChartCard>
      </div>

      <div className="attendance-analytics-charts-grid">
        <AttendanceAnalyticsChartCard
          title="Days by employee"
          subtitle="Present, absent, and leave days for top employees."
        >
          {employeeDaysHasData ? (
            <ReactApexChart
              options={employeeDaysOptions}
              series={employeeDaysChart.series}
              type="bar"
              height={barChartHeight}
            />
          ) : (
            <AttendanceAnalyticsChartEmpty message="No employee day breakdown to chart." />
          )}
        </AttendanceAnalyticsChartCard>
      </div>
    </div>
  );
}
