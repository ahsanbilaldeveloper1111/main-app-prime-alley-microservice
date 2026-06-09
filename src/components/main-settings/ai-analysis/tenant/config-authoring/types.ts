export type ConfigTagFormValues = {
  label: string;
  whenToApply: string;
  color: string;
};

export type ConfigCriterionFormValues = {
  text: string;
  weight: string;
};

export type ConfigBandFormValues = {
  minScore: string;
  maxScore: string;
  label: string;
  color: string;
};

export type ConfigAssessmentFormValues = {
  label: string;
  criteria: ConfigCriterionFormValues[];
  bands: ConfigBandFormValues[];
};

export type ConfigInfoFieldFormValues = {
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

export function defaultConfigTagForm(): ConfigTagFormValues {
  return {
    label: "",
    whenToApply: "",
    color: "green",
  };
}

export function defaultConfigCriterionForm(): ConfigCriterionFormValues {
  return {
    text: "",
    weight: "0",
  };
}

export function defaultConfigBandForm(): ConfigBandFormValues {
  return {
    minScore: "0",
    maxScore: "100",
    label: "",
    color: "neutral",
  };
}

export function defaultConfigAssessmentForm(): ConfigAssessmentFormValues {
  return {
    label: "",
    criteria: [],
    bands: [],
  };
}

export function defaultConfigInfoFieldForm(): ConfigInfoFieldFormValues {
  return {
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
