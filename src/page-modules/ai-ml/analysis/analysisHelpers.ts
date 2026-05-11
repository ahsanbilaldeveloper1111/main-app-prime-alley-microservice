import type { AnalysisStepEntry } from "./types";

export const normalizeStep = (step: string) => step.toLowerCase().trim();

export const hasData = (data: unknown) => data !== null && data !== undefined;

export const hasArrayData = (arr: unknown) => Array.isArray(arr) && arr.length > 0;

export const capitalizeFirst = (str: string) => {
  if (!str) return "";
  return str.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

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
