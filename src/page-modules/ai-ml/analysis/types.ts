export interface SummaryData {
  summary: string;
  interaction_type: string;
  main_topic: string;
  tags: Array<{
    [key: string]: unknown;
  }>;
}

export interface Transcription {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

export interface AnalysisStepEntry {
  step: string;
  message: string;
  status: string;
  timestamp: number;
}

export interface CallAnalysisWithDataParams {
  dateParam: string;
  localPartyNumberParam: string;
  ownerUsernameParam: string;
  uuidParam: string;
  imagicleParam: string;
  dateTimeParam: string;
  durationParam: string;
  directionParam: string;
  phoneParam: string;
}
