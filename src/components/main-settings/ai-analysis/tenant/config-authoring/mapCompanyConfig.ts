import type {
  AnalysisCompanyConfigRecord,
  AnalysisCompanyConfigUpdateRequest,
  AnalysisConfigAssessment,
  AnalysisConfigBand,
  AnalysisConfigCriterion,
  AnalysisConfigInfoField,
  AnalysisConfigTag,
} from "@utils/aiAnalytics";

import type {
  ConfigAssessmentFormValues,
  ConfigAuthoringFormValues,
  ConfigBandFormValues,
  ConfigCriterionFormValues,
  ConfigInfoFieldFormValues,
  ConfigTagFormValues,
} from "./types";
import { defaultConfigAuthoringFormValues, createConfigFormClientId } from "./types";

/** Derive a stable snake_case key from a human-readable label. */
export function labelToSnakeCase(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

function numberToInput(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "";
  }
  return String(value);
}

function parseRequiredInt(raw: string, fallback = 0): number {
  const trimmed = raw.trim();
  if (!trimmed) {
    return fallback;
  }
  const value = Number.parseInt(trimmed, 10);
  return Number.isFinite(value) ? value : fallback;
}

function parseRequiredScore(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const value = Number.parseInt(trimmed, 10);
  return Number.isFinite(value) ? value : null;
}

/** Label inputs must begin with A–Z or a–z (after trim). */
function validateLabelStartsWithLetter(
  label: string,
  fieldName: string,
): string | null {
  const trimmed = label.trim();
  if (!trimmed) {
    return null;
  }
  if (!/^[a-zA-Z]/.test(trimmed)) {
    return `${fieldName} must start with a letter.`;
  }
  return null;
}

function validateAssessmentCriteriaWeights(
  criteria: ConfigCriterionFormValues[],
  assessmentName: string,
): string | null {
  if (criteria.length === 0) {
    return null;
  }

  let total = 0;
  for (let index = 0; index < criteria.length; index += 1) {
    const weightRaw = criteria[index].weight.trim();
    if (!weightRaw) {
      return `Criterion ${index + 1} in "${assessmentName}" requires a weight.`;
    }
    const weight = Number.parseInt(weightRaw, 10);
    if (!Number.isFinite(weight) || weight < 0) {
      return `Criterion ${index + 1} in "${assessmentName}" must have a valid non-negative weight.`;
    }
    total += weight;
  }

  if (total !== 100) {
    return `Criteria weights in "${assessmentName}" must total 100 (currently ${total}).`;
  }

  return null;
}

function scoreRangesOverlap(
  a: { min: number; max: number },
  b: { min: number; max: number },
): boolean {
  return a.max >= b.min && b.max >= a.min;
}

function validateAssessmentScoreBands(
  bands: ConfigBandFormValues[],
  assessmentName: string,
): string | null {
  if (bands.length === 0) {
    return null;
  }

  const ranges: Array<{ min: number; max: number; label: string }> = [];

  for (let index = 0; index < bands.length; index += 1) {
    const band = bands[index];
    const bandLabel = band.label.trim() || `Band ${index + 1}`;
    const labelError = validateLabelStartsWithLetter(
      band.label,
      `Band "${bandLabel}" label`,
    );
    if (labelError) {
      return `${labelError} (assessment "${assessmentName}")`;
    }

    const min = parseRequiredScore(band.minScore);
    const max = parseRequiredScore(band.maxScore);
    if (min == null || max == null) {
      return `Band "${bandLabel}" in "${assessmentName}" must have valid min and max scores.`;
    }
    if (min > max) {
      return `Band "${bandLabel}" in "${assessmentName}": min score cannot exceed max score.`;
    }

    ranges.push({ min, max, label: bandLabel });
  }

  for (let i = 0; i < ranges.length; i += 1) {
    for (let j = i + 1; j < ranges.length; j += 1) {
      const left = ranges[i];
      const right = ranges[j];
      if (scoreRangesOverlap(left, right)) {
        return `Score bands "${left.label}" (${left.min}–${left.max}) and "${right.label}" (${right.min}–${right.max}) overlap in "${assessmentName}". Bands must use non-overlapping ranges (e.g. 0–49 then 50–100).`;
      }
    }
  }

  return null;
}

function validateConfigAuthoringFields(
  values: ConfigAuthoringFormValues,
): string | null {
  for (let index = 0; index < values.tags.length; index += 1) {
    const tag = values.tags[index];
    const tagName = tag.label.trim() || `Tag ${index + 1}`;
    const labelError = validateLabelStartsWithLetter(tag.label, `Tag "${tagName}" label`);
    if (labelError) {
      return labelError;
    }
  }

  for (let index = 0; index < values.assessments.length; index += 1) {
    const assessment = values.assessments[index];
    const assessmentName = assessment.label.trim() || `Assessment ${index + 1}`;

    const labelError = validateLabelStartsWithLetter(
      assessment.label,
      `Assessment "${assessmentName}" label`,
    );
    if (labelError) {
      return labelError;
    }

    const weightError = validateAssessmentCriteriaWeights(
      assessment.criteria,
      assessmentName,
    );
    if (weightError) {
      return weightError;
    }

    const bandsError = validateAssessmentScoreBands(assessment.bands, assessmentName);
    if (bandsError) {
      return bandsError;
    }
  }

  for (let index = 0; index < values.infoFields.length; index += 1) {
    const field = values.infoFields[index];
    const fieldName = field.label.trim() || `Info field ${index + 1}`;
    const labelError = validateLabelStartsWithLetter(
      field.label,
      `Info field "${fieldName}" label`,
    );
    if (labelError) {
      return labelError;
    }
  }

  return null;
}

function mapTagToForm(tag: AnalysisConfigTag): ConfigTagFormValues {
  return {
    clientId: createConfigFormClientId(),
    label: tag.label,
    whenToApply: tag.when_to_apply,
    color: tag.color,
  };
}

function mapCriterionToForm(
  criterion: AnalysisConfigCriterion,
): ConfigCriterionFormValues {
  return {
    clientId: createConfigFormClientId(),
    text: criterion.text,
    weight: numberToInput(criterion.weight),
  };
}

function mapBandToForm(band: AnalysisConfigBand): ConfigBandFormValues {
  return {
    clientId: createConfigFormClientId(),
    minScore: numberToInput(band.min_score),
    maxScore: numberToInput(band.max_score),
    label: band.label,
    color: band.color,
  };
}

function mapAssessmentToForm(
  assessment: AnalysisConfigAssessment,
): ConfigAssessmentFormValues {
  return {
    clientId: createConfigFormClientId(),
    label: assessment.label,
    criteria: assessment.criteria.map(mapCriterionToForm),
    bands: assessment.bands.map(mapBandToForm),
  };
}

function mapInfoFieldToForm(
  field: AnalysisConfigInfoField,
): ConfigInfoFieldFormValues {
  return {
    clientId: createConfigFormClientId(),
    label: field.label,
    fieldType: field.field_type,
    description: field.description,
  };
}

export function mapCompanyConfigToFormValues(
  data: AnalysisCompanyConfigRecord | null | undefined,
  fallbackAuthor = "",
): ConfigAuthoringFormValues {
  if (!data) {
    return defaultConfigAuthoringFormValues(fallbackAuthor);
  }
  return {
    statedIndustry: data.stated_industry,
    authoredBy: data.authored_by ?? fallbackAuthor,
    tags: data.tags.map(mapTagToForm),
    assessments: data.assessments.map(mapAssessmentToForm),
    infoFields: data.info_fields.map(mapInfoFieldToForm),
  };
}

function mapTagFormToApi(tag: ConfigTagFormValues): AnalysisConfigTag {
  const label = tag.label.trim();
  return {
    tag_key: labelToSnakeCase(label),
    label,
    when_to_apply: tag.whenToApply.trim(),
    example: null,
    color: tag.color.trim() || "green",
    enabled: true,
    sort_order: null,
  };
}

function mapCriterionFormToApi(
  criterion: ConfigCriterionFormValues,
): AnalysisConfigCriterion {
  const text = criterion.text.trim();
  return {
    criterion_key: labelToSnakeCase(text),
    text,
    weight: parseRequiredInt(criterion.weight, 0),
    example: null,
    sort_order: null,
  };
}

function mapBandFormToApi(band: ConfigBandFormValues): AnalysisConfigBand {
  return {
    min_score: parseRequiredInt(band.minScore, 0),
    max_score: parseRequiredInt(band.maxScore, 100),
    label: band.label.trim(),
    color: band.color.trim() || "neutral",
    sort_order: null,
  };
}

function mapAssessmentFormToApi(
  assessment: ConfigAssessmentFormValues,
): AnalysisConfigAssessment {
  const label = assessment.label.trim();
  return {
    assess_key: labelToSnakeCase(label),
    label,
    enabled: true,
    sort_order: null,
    criteria: assessment.criteria.map(mapCriterionFormToApi),
    bands: assessment.bands.map(mapBandFormToApi),
  };
}

function mapInfoFieldFormToApi(
  field: ConfigInfoFieldFormValues,
): AnalysisConfigInfoField {
  const label = field.label.trim();
  return {
    field_key: labelToSnakeCase(label),
    label,
    field_type: field.fieldType,
    description: field.description.trim(),
    example: null,
    enabled: true,
    sort_order: null,
  };
}

export function mapFormValuesToCompanyConfigUpdate(
  values: ConfigAuthoringFormValues,
): AnalysisCompanyConfigUpdateRequest {
  const statedIndustry = values.statedIndustry.trim();
  if (!statedIndustry) {
    throw new Error("Industry type (stated industry) is required.");
  }

  const payload: AnalysisCompanyConfigUpdateRequest = {
    stated_industry: statedIndustry,
    industry_key: labelToSnakeCase(statedIndustry),
    tags: values.tags.map(mapTagFormToApi),
    assessments: values.assessments.map(mapAssessmentFormToApi),
    info_fields: values.infoFields.map(mapInfoFieldFormToApi),
  };

  const authoredBy = values.authoredBy.trim();
  if (authoredBy) {
    payload.authored_by = authoredBy;
  }

  return payload;
}

export function validateConfigAuthoringForm(
  values: ConfigAuthoringFormValues,
): string | null {
  const fieldError = validateConfigAuthoringFields(values);
  if (fieldError) {
    return fieldError;
  }

  try {
    mapFormValuesToCompanyConfigUpdate(values);
    return null;
  } catch (error: unknown) {
    return error instanceof Error ? error.message : "Invalid config values.";
  }
}
