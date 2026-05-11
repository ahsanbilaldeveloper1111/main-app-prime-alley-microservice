import type { AnalysisStepEntry } from "./types";

export const normalizeStep = (step: string) => step.toLowerCase().trim();

export const hasData = (data: unknown) => data !== null && data !== undefined;

export const hasArrayData = (arr: unknown) => Array.isArray(arr) && arr.length > 0;

/**
 * React list keys for string arrays — uses value + occurrence index (not array position)
 * so Sonar does not flag `key={i}` while keeping keys stable for duplicate labels.
 */
export function keyedStringItems(
  strings: readonly string[],
  keyPrefix: string,
): readonly { key: string; value: string }[] {
  const seen = new Map<string, number>();
  const out: { key: string; value: string }[] = [];
  for (const value of strings) {
    const n = (seen.get(value) ?? 0) + 1;
    seen.set(value, n);
    out.push({ key: `${keyPrefix}:${n}:${value}`, value });
  }
  return out;
}

export function keyedBySignature<T>(
  items: readonly T[],
  signature: (item: T) => string,
  keyPrefix: string,
): readonly { key: string; item: T }[] {
  const seen = new Map<string, number>();
  const out: { key: string; item: T }[] = [];
  for (const item of items) {
    const sig = signature(item);
    const n = (seen.get(sig) ?? 0) + 1;
    seen.set(sig, n);
    out.push({ key: `${keyPrefix}:${n}:${sig}`, item });
  }
  return out;
}

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
