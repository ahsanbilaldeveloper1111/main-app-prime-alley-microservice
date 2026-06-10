import { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import {
  formatPastDayStatsLine,
  loadMyDayHistoryForDate,
  type MyDayHistoryLoadResult,
  type MyDayHistoryTaskRow,
} from "@page-modules/planner/my-day/myDayHistoryDomain";
import { listMyDayDailyLogs } from "@utils/tasks";

export type MyDayHistoryView = "past_day" | "monthly";

function buildDefaultPastDates(todayIso: string): string[] {
  const options: string[] = [];
  const base = moment(todayIso, "YYYY-MM-DD");
  for (let i = 1; i <= 14; i += 1) {
    options.push(base.clone().subtract(i, "day").format("YYYY-MM-DD"));
  }
  return options;
}

function mergePastDateOptions(defaultPastDates: string[], logs: Awaited<ReturnType<typeof listMyDayDailyLogs>>): string[] {
  const fromLogs = logs
    .map((log) => log.log_date ?? log.plan_date)
    .filter((d): d is string => typeof d === "string" && d.length > 0);
  return [...new Set([...defaultPastDates, ...fromLogs])].sort((a, b) => b.localeCompare(a));
}

export function useMyDayHistoryModal(show: boolean, todayIso: string) {
  const yesterdayIso = useMemo(
    () => moment(todayIso, "YYYY-MM-DD").subtract(1, "day").format("YYYY-MM-DD"),
    [todayIso],
  );

  const defaultPastDates = useMemo(() => buildDefaultPastDates(todayIso), [todayIso]);

  const [activeView, setActiveView] = useState<MyDayHistoryView>("past_day");
  const [selectedDate, setSelectedDate] = useState(yesterdayIso);
  const [dateOptions, setDateOptions] = useState<string[]>(defaultPastDates);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MyDayHistoryTaskRow[]>([]);
  const [historyResult, setHistoryResult] = useState<MyDayHistoryLoadResult | null>(null);
  const [metaLine, setMetaLine] = useState("");

  const loadHistory = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const result = await loadMyDayHistoryForDate(date);
      setRows(result.rows);
      setHistoryResult(result);
      setMetaLine(formatPastDayStatsLine(result.stats));
    } catch {
      setRows([]);
      setHistoryResult(null);
      setMetaLine("Unable to load history for this date.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    setActiveView("past_day");
    setSelectedDate(yesterdayIso);
  }, [show, yesterdayIso]);

  useEffect(() => {
    if (!show) return;
    listMyDayDailyLogs({ limit: 90 })
      .then((logs) => setDateOptions(mergePastDateOptions(defaultPastDates, logs)))
      .catch(() => setDateOptions(defaultPastDates));
  }, [defaultPastDates, show]);

  useEffect(() => {
    if (!show || activeView !== "past_day" || !selectedDate) return;
    loadHistory(selectedDate).catch(() => undefined);
  }, [loadHistory, selectedDate, show, activeView]);

  return {
    yesterdayIso,
    activeView,
    setActiveView,
    selectedDate,
    setSelectedDate,
    dateOptions,
    loading,
    rows,
    historyResult,
    metaLine,
  };
}
