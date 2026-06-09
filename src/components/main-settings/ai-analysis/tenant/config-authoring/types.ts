export type ConfigTagFormValues = {
  label: string;
  whenToApply: string;
  color: string;
};

export type ConfigCriterionFormValues = {
  text: string;
  weight: string;
  example: string;
  sortOrder: string;
};

export type ConfigBandFormValues = {
  minScore: string;
  maxScore: string;
  label: string;
  color: string;
  sortOrder: string;
};

export type ConfigAssessmentFormValues = {
  label: string;
  enabled: boolean;
  sortOrder: string;
  criteria: ConfigCriterionFormValues[];
  bands: ConfigBandFormValues[];
};

export type ConfigInfoFieldFormValues = {
  label: string;
  fieldType: "text" | "yes_no" | "number";
  description: string;
  example: string;
  enabled: boolean;
  sortOrder: string;
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

export function defaultConfigCriterionForm(sortOrder = 1): ConfigCriterionFormValues {
  return {
    text: "",
    weight: "0",
    example: "",
    sortOrder: String(sortOrder),
  };
}

export function defaultConfigBandForm(sortOrder = 1): ConfigBandFormValues {
  return {
    minScore: "0",
    maxScore: "100",
    label: "",
    color: "neutral",
    sortOrder: String(sortOrder),
  };
}

export function defaultConfigAssessmentForm(sortOrder = 1): ConfigAssessmentFormValues {
  return {
    label: "",
    enabled: true,
    sortOrder: String(sortOrder),
    criteria: [],
    bands: [],
  };
}

export function defaultConfigInfoFieldForm(sortOrder = 1): ConfigInfoFieldFormValues {
  return {
    label: "",
    fieldType: "text",
    description: "",
    example: "",
    enabled: true,
    sortOrder: String(sortOrder),
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
