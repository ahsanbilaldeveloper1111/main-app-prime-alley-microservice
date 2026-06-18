import type { TeamAttendanceSnapshotSummary } from "@utils/staffManagement";

const SNAPSHOT_STATUS_COLORS: Record<string, string> = {
  present: "#059669",
  absent: "#dc2626",
  late: "#ea580c",
  on_break: "#7c3aed",
  overtime: "#b45309",
  on_leave: "#2563eb",
  no_show: "#6b7280",
};

export type TeamSnapshotDonutChart = Readonly<{
  labels: string[];
  series: number[];
  colors: string[];
}>;

export function buildTeamSnapshotStatusDonutChart(
  summary: TeamAttendanceSnapshotSummary,
): TeamSnapshotDonutChart {
  const entries: ReadonlyArray<{ key: keyof TeamAttendanceSnapshotSummary; label: string }> = [
    { key: "present", label: "Present" },
    { key: "absent", label: "Absent" },
    { key: "late", label: "Late" },
    { key: "on_break", label: "On break" },
    { key: "on_overtime", label: "Overtime" },
    { key: "on_leave", label: "On leave" },
    { key: "no_show", label: "No show" },
  ];

  const labels: string[] = [];
  const series: number[] = [];
  const colors: string[] = [];

  for (const entry of entries) {
    const value = summary[entry.key];
    if (value == null || !Number.isFinite(value) || value <= 0) {
      continue;
    }

    labels.push(entry.label);
    series.push(value);
    colors.push(SNAPSHOT_STATUS_COLORS[entry.key] ?? "#6b7280");
  }

  return { labels, series, colors };
}
