import type { AnalysisStepEntry } from "./types";

export const normalizeStep = (step: string) => step.toLowerCase().trim();

export const hasData = (data: unknown) => data !== null && data !== undefined;

export const hasArrayData = (arr: unknown) => Array.isArray(arr) && arr.length > 0;

export const capitalizeFirst = (str: string) => {
  if (!str) return "";
  return str.replaceAll("_", " ").replaceAll(/\b\w/g, (char) => char.toUpperCase());
};

/** Safe string for inline display — avoids `[object Object]` when the API returns a nested value. */
export function formatUnknownForDisplay(value: unknown): string {
  if (value == null) return "";
  const t = typeof value;
  if (t === "string") return value;
  if (t === "number") return String(value as number);
  if (t === "boolean") return String(value as boolean);
  if (t === "bigint") return (value as bigint).toString();
  if (t === "symbol") return value.description ?? "";
  if (t === "function") return "[Function]";
  if (t === "object") return JSON.stringify(value);
  return "";
}

/** Uses formatUnknownForDisplay, then capitalizeFirst when the result is plain text (not JSON). */
export function formatAnalysisFieldLabel(value: unknown): string {
  const raw = formatUnknownForDisplay(value);
  if (!raw) return "";
  const trimmed = raw.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return raw;
  return capitalizeFirst(raw);
}

export const updateStepInList = (
  prevSteps: AnalysisStepEntry[],
  stepEntry: AnalysisStepEntry,
): AnalysisStepEntry[] => {
  const currentStepNormalized = normalizeStep(stepEntry.step);
  const existingIndex = prevSteps.findIndex(
    (s) => normalizeStep(s.step) === currentStepNormalized,
  );

  let updated = [...prevSteps];

  if (existingIndex >= 0) {
    updated[existingIndex] = stepEntry;
  } else {
    updated = [...prevSteps, stepEntry];
  }

  if (
    (stepEntry.status === "processing" ||
      stepEntry.status === "connecting" ||
      stepEntry.status === "connected") &&
    updated.length > 1
  ) {
    const currentIndex = existingIndex >= 0 ? existingIndex : updated.length - 1;
    for (let i = 0; i < currentIndex; i++) {
      if (updated[i].status !== "done" && updated[i].status !== "error") {
        updated[i] = { ...updated[i], status: "done" };
      }
    }
  }

  return updated;
};
