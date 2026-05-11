/**
 * SSE / chunked analysis merge helpers — kept separate from {@link useCallAnalysis} for Sonar CPD.
 */
import type { Dispatch, SetStateAction } from "react";
import type { AnalysisStepEntry } from "@page-modules/ai-ml/analysis/types";
import { normalizeStep } from "@page-modules/ai-ml/analysis/analysisHelpers";
import { STEP_CODES } from "@page-modules/ai-ml/analysis/constants";

export type ChunksStateSetter = Dispatch<SetStateAction<any>>;

function isPresent<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

function copyChunkField(updates: Record<string, unknown>, key: string, value: unknown) {
  if (value !== undefined && value !== null) {
    updates[key] = value;
  }
}

function leadQualityTagFromSource(leadQuality: any) {
  return {
    status: leadQuality.good_lead ?? false,
    name: "Good Lead",
    percentage: leadQuality.good_lead_percentage ?? "N/A",
    description: leadQuality.good_lead_description ?? "N/A",
  };
}

function buyerIntentTagsFromSource(buyerIntent: any) {
  return [
    {
      status: buyerIntent.fast_buyer ?? false,
      name: "Fast Buyer",
      percentage: buyerIntent.fast_buyer_percentage ?? "N/A",
      description: buyerIntent.fast_buyer_description ?? "N/A",
    },
    {
      status: buyerIntent.big_budget_buyer ?? false,
      name: "Big Budget Buyer",
      percentage: buyerIntent.big_budget_buyer_percentage ?? "N/A",
      description: buyerIntent.big_budget_buyer_description ?? "N/A",
    },
    {
      status: buyerIntent.not_a_lead ?? false,
      name: "Not a Lead",
      percentage: buyerIntent.not_a_lead_percentage ?? "N/A",
      description: buyerIntent.not_a_lead_description ?? "N/A",
    },
  ];
}

function feedbackTagFromSource(feedback: any) {
  return {
    status: feedback.negative_feedback ?? false,
    name: "Negative Feedback",
    percentage: feedback.negative_feedback_percentage ?? "N/A",
    description: feedback.negative_feedback_description ?? "N/A",
  };
}

function collectTagsFromResultPayload(result: any): any[] {
  const tags: any[] = [];
  if (isPresent(result.lead_quality)) {
    tags.push(leadQualityTagFromSource(result.lead_quality));
  }
  if (isPresent(result.buyer_intent)) {
    tags.push(...buyerIntentTagsFromSource(result.buyer_intent));
  }
  if (isPresent(result.feedback)) {
    tags.push(feedbackTagFromSource(result.feedback));
  }
  return tags;
}

export function buildDoneResultChunksPatch(result: any): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  copyChunkField(updates, "transcriptions", result.transcription);
  copyChunkField(updates, "analysis", result.analysis);
  copyChunkField(updates, "extracted_qualification_fields", result.extracted_qualification_fields);
  copyChunkField(updates, "qualified", result.qualified);
  copyChunkField(updates, "completion_percent", result.completion_percent);
  if (isPresent(result.classification)) {
    updates.main_topic = result.classification?.main_topic;
  }
  if (isPresent(result.summary)) {
    updates.summary = result.summary?.summary;
  }
  if (isPresent(result.translation)) {
    updates.translations = result.translation?.translations ?? [];
  }
  const tagsArray = collectTagsFromResultPayload(result);
  if (tagsArray.length > 0) {
    updates.tags = tagsArray;
  }
  return updates;
}

export function upsertCompletedStepEntry(
  step: string,
  message: string | undefined,
  setSteps: Dispatch<SetStateAction<AnalysisStepEntry[]>>,
) {
  const stepEntry: AnalysisStepEntry = {
    step,
    message: message || "Completed",
    status: "done",
    timestamp: Date.now(),
  };
  setSteps((prev) => {
    const currentNormalized = normalizeStep(step);
    const existingIndex = prev.findIndex((s) => normalizeStep(s.step) === currentNormalized);
    if (existingIndex >= 0) {
      const updated = [...prev];
      updated[existingIndex] = stepEntry;
      return updated;
    }
    return [...prev, stepEntry];
  });
}

type StepChunkHandler = (result: any, setChunks: ChunksStateSetter) => void;

const STEP_CHUNK_HANDLERS: Record<string, StepChunkHandler> = {
  [STEP_CODES.TRANSCRIPTION]: (result, setChunks) => {
    if (!isPresent(result.transcription)) return;
    setChunks((prev: any) => ({ ...prev, transcriptions: result.transcription }));
  },
  [STEP_CODES.ANALYSIS]: (result, setChunks) => {
    if (result.analysis === undefined) return;
    setChunks((prev: any) => ({ ...prev, analysis: result.analysis }));
  },
  [STEP_CODES.QUALIFICATION_FIELDS]: (result, setChunks) => {
    const patch: Record<string, unknown> = {};
    if (result.extracted_qualification_fields !== undefined) {
      patch.extracted_qualification_fields = result.extracted_qualification_fields;
    }
    if (result.qualified !== undefined) {
      patch.qualified = result.qualified;
    }
    if (result.completion_percent !== undefined) {
      patch.completion_percent = result.completion_percent;
    }
    if (Object.keys(patch).length === 0) return;
    setChunks((prev: any) => ({ ...prev, ...patch }));
  },
  [STEP_CODES.CLASSIFICATION]: (result, setChunks) => {
    if (result.classification === undefined) return;
    setChunks((prev: any) => ({ ...prev, main_topic: result.classification?.main_topic }));
  },
  [STEP_CODES.SUMMARY]: (result, setChunks) => {
    if (result.summary === undefined) return;
    setChunks((prev: any) => ({ ...prev, summary: result.summary?.summary }));
  },
  [STEP_CODES.LEAD_QUALITY]: (result, setChunks) => {
    if (!isPresent(result.lead_quality)) return;
    const tag = leadQualityTagFromSource(result.lead_quality);
    setChunks((prev: any) => ({ ...prev, tags: [...prev.tags, tag] }));
  },
  [STEP_CODES.BUYER_INTENT]: (result, setChunks) => {
    if (!isPresent(result.buyer_intent)) return;
    const extra = buyerIntentTagsFromSource(result.buyer_intent);
    setChunks((prev: any) => ({ ...prev, tags: [...prev.tags, ...extra] }));
  },
  [STEP_CODES.FEEDBACK]: (result, setChunks) => {
    if (!isPresent(result.feedback)) return;
    const tag = feedbackTagFromSource(result.feedback);
    setChunks((prev: any) => ({ ...prev, tags: [...prev.tags, tag] }));
  },
  [STEP_CODES.TRANSLATIONS]: (result, setChunks) => {
    if (result.translations === undefined) return;
    setChunks((prev: any) => ({ ...prev, translations: result.translations }));
  },
};

export function applyAnalysisStepChunk(
  stepCode: string,
  result: any,
  setChunks: ChunksStateSetter,
): void {
  const key = String(stepCode).trim();
  const run = STEP_CHUNK_HANDLERS[key];
  if (run) {
    run(result, setChunks);
  } else {
    console.log("Unknown step code:", stepCode);
  }
}
