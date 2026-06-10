export type ConfigTagFormValues = {
  clientId: string;
  label: string;
  whenToApply: string;
  color: string;
};

export type ConfigCriterionFormValues = {
  clientId: string;
  text: string;
  weight: string;
};

export type ConfigBandFormValues = {
  clientId: string;
  minScore: string;
  maxScore: string;
  label: string;
  color: string;
};

export type ConfigAssessmentFormValues = {
  clientId: string;
  label: string;
  criteria: ConfigCriterionFormValues[];
  bands: ConfigBandFormValues[];
};

export type ConfigInfoFieldFormValues = {
  clientId: string;
  label: string;
  fieldType: "text" | "yes_no" | "number";
  description: string;
};

export type ConfigAuthoringFormValues = {
  statedIndustry: string;
  authoredBy: string;
  tags: ConfigTagFormValues[];
  assessments: ConfigAssessmentFormValues[];
  infoFields: ConfigInfoFieldFormValues[];
};

export function createConfigFormClientId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `cfg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function defaultConfigTagForm(): ConfigTagFormValues {
  return {
    clientId: createConfigFormClientId(),
    label: "",
    whenToApply: "",
    color: "green",
  };
}

export function defaultConfigCriterionForm(): ConfigCriterionFormValues {
  return {
    clientId: createConfigFormClientId(),
    text: "",
    weight: "0",
  };
}

export function defaultConfigBandForm(): ConfigBandFormValues {
  return {
    clientId: createConfigFormClientId(),
    minScore: "0",
    maxScore: "100",
    label: "",
    color: "neutral",
  };
}

export function defaultConfigAssessmentForm(): ConfigAssessmentFormValues {
  return {
    clientId: createConfigFormClientId(),
    label: "",
    criteria: [],
    bands: [],
  };
}

export function defaultConfigInfoFieldForm(): ConfigInfoFieldFormValues {
  return {
    clientId: createConfigFormClientId(),
    label: "",
    fieldType: "text",
    description: "",
  };
}

export function defaultConfigAuthoringFormValues(
  fallbackAuthor = "",
): ConfigAuthoringFormValues {
  return {
    statedIndustry: "",
    authoredBy: fallbackAuthor,
    tags: [],
    assessments: [],
    infoFields: [],
  };
}
