import moment from "moment";
import { toMinutesDisplay } from "@page-modules/planner/my-day/myDayDomain";
import { buildPastDayStats, resolveMyDayCompletionRatePercent } from "@page-modules/planner/my-day/myDayHistoryDomain";
import type { MyDayDailyLogPayload } from "@utils/tasks";

export type MyDayMonthlyReport = Readonly<{
  monthLabel: string;
  workingDays: number;
  balancedDays: number;
  overloadedDays: number;
  lightDays: number;
  averagePlannedMinutesPerDay: number;
  averageCompletionRatePercent: number;
  daysInMonth: number;
}>;

const LIGHT_DAY_COMPLETED_FRACTION = 0.5;

function readLogDateIso(log: MyDayDailyLogPayload): string | null {
  const raw = log.log_date ?? log.plan_date;
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const parsed = moment(raw, "YYYY-MM-DD", true);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : null;
}

function isLogInMonth(isoDate: string, monthStart: moment.Moment, monthEnd: moment.Moment): boolean {
  const day = moment(isoDate, "YYYY-MM-DD", true);
  if (!day.isValid()) return false;
  return !day.isBefore(monthStart, "day") && !day.isAfter(monthEnd, "day");
}

export function resolveMyDayMonthlyReportMonthBounds(monthIso: string): Readonly<{
  monthStart: moment.Moment;
  monthEnd: moment.Moment;
  monthLabel: string;
}> {
  const monthStart = moment(monthIso, "YYYY-MM", true).startOf("month");
  const monthEnd = monthStart.clone().endOf("month");
  return {
    monthStart,
    monthEnd,
    monthLabel: monthStart.format("MMMM YYYY"),
  };
}

type MyDayMonthlyDayTally = Readonly<{
  workingDays: number;
  balancedDays: number;
  overloadedDays: number;
  lightDays: number;
  plannedMinutesTotal: number;
  completionRateSum: number;
  completionRateCount: number;
}>;

const EMPTY_MONTHLY_TALLY: MyDayMonthlyDayTally = {
  workingDays: 0,
  balancedDays: 0,
  overloadedDays: 0,
  lightDays: 0,
  plannedMinutesTotal: 0,
  completionRateSum: 0,
  completionRateCount: 0,
};

function tallyMyDayMonthlyLogDay(log: MyDayDailyLogPayload): MyDayMonthlyDayTally | null {
  const stats = buildPastDayStats(log.meta ?? {}, null, log);
  const capacity = Math.max(1, stats.originalCapacityMinutes);
  const planned = stats.plannedMinutes;
  const completed = stats.completedMinutes;
  const isWorkingDay = stats.tasksPlanned > 0 || planned > 0;
  if (!isWorkingDay) return null;

  const overloaded = planned > capacity;
  const balanced = !overloaded && planned > 0;
  const light = completed < capacity * LIGHT_DAY_COMPLETED_FRACTION;
  const dayRate = resolveMyDayCompletionRatePercent(stats.tasksPlanned, stats.tasksCompleted);
  const countsCompletion = stats.tasksPlanned > 0;

  return {
    workingDays: 1,
    balancedDays: balanced ? 1 : 0,
    overloadedDays: overloaded ? 1 : 0,
    lightDays: light ? 1 : 0,
    plannedMinutesTotal: planned,
    completionRateSum: countsCompletion ? dayRate : 0,
    completionRateCount: countsCompletion ? 1 : 0,
  };
}

function mergeMonthlyDayTallies(
  total: MyDayMonthlyDayTally,
  day: MyDayMonthlyDayTally,
): MyDayMonthlyDayTally {
  return {
    workingDays: total.workingDays + day.workingDays,
    balancedDays: total.balancedDays + day.balancedDays,
    overloadedDays: total.overloadedDays + day.overloadedDays,
    lightDays: total.lightDays + day.lightDays,
    plannedMinutesTotal: total.plannedMinutesTotal + day.plannedMinutesTotal,
    completionRateSum: total.completionRateSum + day.completionRateSum,
    completionRateCount: total.completionRateCount + day.completionRateCount,
  };
}

export function buildMyDayMonthlyReport(
  logs: ReadonlyArray<MyDayDailyLogPayload>,
  monthIso: string,
): MyDayMonthlyReport {
  const { monthStart, monthEnd, monthLabel } = resolveMyDayMonthlyReportMonthBounds(monthIso);
  const daysInMonth = monthEnd.date();
  const seenDates = new Set<string>();

  const totals = logs.reduce<MyDayMonthlyDayTally>((acc, log) => {
    const isoDate = readLogDateIso(log);
    if (isoDate == null || seenDates.has(isoDate)) return acc;
    if (!isLogInMonth(isoDate, monthStart, monthEnd)) return acc;
    seenDates.add(isoDate);

    const dayTally = tallyMyDayMonthlyLogDay(log);
    return dayTally == null ? acc : mergeMonthlyDayTallies(acc, dayTally);
  }, EMPTY_MONTHLY_TALLY);

  const averagePlannedMinutesPerDay =
    totals.workingDays > 0
      ? Math.round(totals.plannedMinutesTotal / totals.workingDays)
      : 0;
  const averageCompletionRatePercent =
    totals.completionRateCount > 0
      ? Math.round((totals.completionRateSum / totals.completionRateCount) * 10) / 10
      : 0;

  return {
    monthLabel,
    workingDays: totals.workingDays,
    balancedDays: totals.balancedDays,
    overloadedDays: totals.overloadedDays,
    lightDays: totals.lightDays,
    averagePlannedMinutesPerDay,
    averageCompletionRatePercent,
    daysInMonth,
  };
}

export function formatAveragePlannedPerDayLabel(minutes: number): string {
  if (minutes <= 0) return "0m";
  return `${toMinutesDisplay(minutes)} / day`;
}

export function formatAverageCompletionRateLabel(percent: number): string {
  if (percent <= 0) return "0%";
  return `${percent % 1 === 0 ? Math.round(percent) : percent}%`;
}
