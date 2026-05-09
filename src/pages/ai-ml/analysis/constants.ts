export const UNABLE_TO_ANALYZE_CALL =
  "Unable to process request at this moment. Please try again later.";

export const STEP_CODES = {
  TRANSCRIPTION: "001",
  ANALYSIS: "002",
  QUALIFICATION_FIELDS: "003",
  CLASSIFICATION: "004",
  SUMMARY: "005",
  LEAD_QUALITY: "006",
  BUYER_INTENT: "007",
  FEEDBACK: "008",
  TRANSLATIONS: "009",
  FROM_DATABAE: "100",
} as const;

export const TRANSCRIPTION_SPEAKER_1 = "Speaker 1";
export const TRANSCRIPTION_SPEAKER_2 = "Speaker 2";

export const INITIAL_CHUNKS_ANALYSIS_DATA = {
  summary: "",
  main_topic: "",
  interaction_type: "",
  analysis: [],
  extracted_qualification_fields: null,
  qualified: false,
  call_categories: [],
  transcriptions: [],
  sentiment: "",
  resolution_status: "",
  customer_intent: "",
  key_topics: [],
  action_items: [],
  entities_customer: [],
  customer_emotions: [],
  operator_emotions: [],
  follow_up_required: false,
  tags: [] as unknown[],
};
