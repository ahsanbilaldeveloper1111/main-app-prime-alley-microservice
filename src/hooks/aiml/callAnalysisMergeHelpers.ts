import { STEP_CODES } from "@pages/ai-ml/analysis/constants";

type AnyChunks = Record<string, unknown>;

/** Tags derived from lead_quality / buyer_intent / feedback objects in analysis results. */
export function leadQualityTagEntries(result: any): any[] {
  if (result.lead_quality === undefined || result.lead_quality === null) return [];
  return [
    {
      status: result.lead_quality.good_lead ?? false,
      name: "Good Lead",
      percentage: result.lead_quality.good_lead_percentage ?? "N/A",
      description: result.lead_quality.good_lead_description ?? "N/A",
    },
  ];
}

export function buyerIntentTagEntries(result: any): any[] {
  if (result.buyer_intent === undefined || result.buyer_intent === null) return [];
  const b = result.buyer_intent;
  return [
    {
      status: b.fast_buyer ?? false,
      name: "Fast Buyer",
      percentage: b.fast_buyer_percentage ?? "N/A",
      description: b.fast_buyer_description ?? "N/A",
    },
    {
      status: b.big_budget_buyer ?? false,
      name: "Big Budget Buyer",
      percentage: b.big_budget_buyer_percentage ?? "N/A",
      description: b.big_budget_buyer_description ?? "N/A",
    },
    {
      status: b.not_a_lead ?? false,
      name: "Not a Lead",
      percentage: b.not_a_lead_percentage ?? "N/A",
      description: b.not_a_lead_description ?? "N/A",
    },
  ];
}

export function feedbackTagEntries(result: any): any[] {
  if (result.feedback === undefined || result.feedback === null) return [];
  return [
    {
      status: result.feedback.negative_feedback ?? false,
      name: "Negative Feedback",
      percentage: result.feedback.negative_feedback_percentage ?? "N/A",
      description: result.feedback.negative_feedback_description ?? "N/A",
    },
  ];
}

export function buildAllTagEntriesFromResult(result: any): any[] {
  return [
    ...leadQualityTagEntries(result),
    ...buyerIntentTagEntries(result),
    ...feedbackTagEntries(result),
  ];
}

type ChunkPatchFn = (prev: AnyChunks, result: any) => AnyChunks;

const mergeQualificationStep: ChunkPatchFn = (prev, result) => {
  let next: AnyChunks = { ...prev };
  if (result.extracted_qualification_fields !== undefined) {
    next = { ...next, extracted_qualification_fields: result.extracted_qualification_fields };
  }
  if (result.qualified !== undefined) {
    next = { ...next, qualified: result.qualified };
  }
  if (result.completion_percent !== undefined) {
    next = { ...next, completion_percent: result.completion_percent };
  }
  return next;
};

const patchTranscription: ChunkPatchFn = (prev, r) => {
  if (r.transcription === undefined || r.transcription === null) {
    return prev;
  }
  return { ...prev, transcriptions: r.transcription };
};

const patchAnalysis: ChunkPatchFn = (prev, r) => {
  if (r.analysis === undefined) {
    return prev;
  }
  return { ...prev, analysis: r.analysis };
};

const patchClassification: ChunkPatchFn = (prev, r) => {
  if (r.classification === undefined) {
    return prev;
  }
  return { ...prev, main_topic: r.classification?.main_topic };
};

const patchSummaryChunk: ChunkPatchFn = (prev, r) => {
  if (r.summary === undefined) {
    return prev;
  }
  return { ...prev, summary: r.summary?.summary };
};

const appendTagPatch =
  (getEntries: (result: any) => any[]): ChunkPatchFn =>
  (prev, r) => {
    const add = getEntries(r);
    if (add.length === 0) {
      return prev;
    }
    return { ...prev, tags: [...(prev.tags as unknown[]), ...add] };
  };

const patchTranslationsChunk: ChunkPatchFn = (prev, r) => {
  if (r.translations === undefined) {
    return prev;
  }
  return { ...prev, translations: r.translations };
};

/**
 * Applies one streaming step_code result to chunks state (append/replace fields).
 * Keeps each branch isolated for low Sonar cognitive complexity.
 */
export const STREAMING_STEP_CHUNK_PATCHES: Record<string, ChunkPatchFn> = {
  [STEP_CODES.TRANSCRIPTION]: patchTranscription,
  [STEP_CODES.ANALYSIS]: patchAnalysis,
  [STEP_CODES.QUALIFICATION_FIELDS]: mergeQualificationStep,
  [STEP_CODES.CLASSIFICATION]: patchClassification,
  [STEP_CODES.SUMMARY]: patchSummaryChunk,
  [STEP_CODES.LEAD_QUALITY]: appendTagPatch(leadQualityTagEntries),
  [STEP_CODES.BUYER_INTENT]: appendTagPatch(buyerIntentTagEntries),
  [STEP_CODES.FEEDBACK]: appendTagPatch(feedbackTagEntries),
  [STEP_CODES.TRANSLATIONS]: patchTranslationsChunk,
};

function pickDoneTranscription(result: any): Record<string, unknown> {
  if (result.transcription === undefined || result.transcription === null) {
    return {};
  }
  return { transcriptions: result.transcription };
}

function pickDoneAnalysis(result: any): Record<string, unknown> {
  if (result.analysis === undefined || result.analysis === null) {
    return {};
  }
  return { analysis: result.analysis };
}

function pickDoneQualification(result: any): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  if (result.extracted_qualification_fields !== undefined && result.extracted_qualification_fields !== null) {
    o.extracted_qualification_fields = result.extracted_qualification_fields;
  }
  if (result.qualified !== undefined && result.qualified !== null) {
    o.qualified = result.qualified;
  }
  if (result.completion_percent !== undefined && result.completion_percent !== null) {
    o.completion_percent = result.completion_percent;
  }
  return o;
}

function pickDoneClassificationSummary(result: any): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  if (result.classification !== undefined && result.classification !== null) {
    o.main_topic = result.classification?.main_topic;
  }
  if (result.summary !== undefined && result.summary !== null) {
    o.summary = result.summary?.summary;
  }
  return o;
}

function pickDoneTags(result: any): Record<string, unknown> {
  const tags = buildAllTagEntriesFromResult(result);
  if (tags.length === 0) {
    return {};
  }
  return { tags };
}

function pickDoneTranslations(result: any): Record<string, unknown> {
  if (result.translation === undefined || result.translation === null) {
    return {};
  }
  return { translations: result.translation?.translations ?? [] };
}

/** Builds the flat chunks update object from a final "done" result payload. */
export function mergeDoneResultIntoChunkUpdates(result: any): Record<string, unknown> {
  return {
    ...pickDoneTranscription(result),
    ...pickDoneAnalysis(result),
    ...pickDoneQualification(result),
    ...pickDoneClassificationSummary(result),
    ...pickDoneTags(result),
    ...pickDoneTranslations(result),
  };
}
