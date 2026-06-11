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

/** Used only when Web Crypto is missing; monotonic suffix for same-ms IDs. */
let configFormClientIdNoCryptoSeq = 0;

/**
 * Stable React list keys for config authoring rows only — not used for auth or API identity.
 */
export function createConfigFormClientId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return `cfg-${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
  }
  configFormClientIdNoCryptoSeq += 1;
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return `cfg-${Date.now()}-${configFormClientIdNoCryptoSeq}-${performance.now()}`;
  }
  return `cfg-${Date.now()}-${configFormClientIdNoCryptoSeq}`;
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
