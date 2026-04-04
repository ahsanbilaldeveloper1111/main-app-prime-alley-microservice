export interface JourneyStatusOption {
  value: string;
  label: string;
}

/** API values + labels (journey list filter, sidebar status control) */
export const JOURNEY_STATUS_OPTIONS: JourneyStatusOption[] = [
  { value: "in_progress", label: "In Progress" },
  { value: "on_track", label: "On Track" },
  { value: "completed", label: "Completed (End Journey)" },
];
