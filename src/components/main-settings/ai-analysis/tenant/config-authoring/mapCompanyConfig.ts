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
import { defaultConfigAuthoringFormValues } from "./types";

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

function parseOptionalSortOrder(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const value = Number.parseInt(trimmed, 10);
  return Number.isFinite(value) ? value : null;
}

function parseRequiredInt(raw: string, fallback = 0): number {
  const trimmed = raw.trim();
  if (!trimmed) {
    return fallback;
  }
  const value = Number.parseInt(trimmed, 10);
  return Number.isFinite(value) ? value : fallback;
}

function optionalString(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed || null;
}

function mapTagToForm(tag: AnalysisConfigTag): ConfigTagFormValues {
  return {
    label: tag.label,
    whenToApply: tag.when_to_apply,
    color: tag.color,
  };
}

function mapCriterionToForm(
  criterion: AnalysisConfigCriterion,
): ConfigCriterionFormValues {
  return {
    text: criterion.text,
    weight: numberToInput(criterion.weight),
    example: criterion.example ?? "",
    sortOrder: numberToInput(criterion.sort_order),
  };
}

function mapBandToForm(band: AnalysisConfigBand): ConfigBandFormValues {
  return {
    minScore: numberToInput(band.min_score),
    maxScore: numberToInput(band.max_score),
    label: band.label,
    color: band.color,
    sortOrder: numberToInput(band.sort_order),
  };
}

function mapAssessmentToForm(
  assessment: AnalysisConfigAssessment,
): ConfigAssessmentFormValues {
  return {
    label: assessment.label,
    enabled: assessment.enabled,
    sortOrder: numberToInput(assessment.sort_order),
    criteria: assessment.criteria.map(mapCriterionToForm),
    bands: assessment.bands.map(mapBandToForm),
  };
}

function mapInfoFieldToForm(
  field: AnalysisConfigInfoField,
): ConfigInfoFieldFormValues {
  return {
    label: field.label,
    fieldType: field.field_type,
    description: field.description,
    example: field.example ?? "",
    enabled: field.enabled,
    sortOrder: numberToInput(field.sort_order),
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
    example: optionalString(criterion.example),
    sort_order: parseOptionalSortOrder(criterion.sortOrder),
  };
}

function mapBandFormToApi(band: ConfigBandFormValues): AnalysisConfigBand {
  return {
    min_score: parseRequiredInt(band.minScore, 0),
    max_score: parseRequiredInt(band.maxScore, 100),
    label: band.label.trim(),
    color: band.color.trim() || "neutral",
    sort_order: parseOptionalSortOrder(band.sortOrder),
  };
}

function mapAssessmentFormToApi(
  assessment: ConfigAssessmentFormValues,
): AnalysisConfigAssessment {
  const label = assessment.label.trim();
  return {
    assess_key: labelToSnakeCase(label),
    label,
    enabled: assessment.enabled,
    sort_order: parseOptionalSortOrder(assessment.sortOrder),
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
    example: optionalString(field.example),
    enabled: field.enabled,
    sort_order: parseOptionalSortOrder(field.sortOrder),
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
  try {
    mapFormValuesToCompanyConfigUpdate(values);
    return null;
  } catch (error: unknown) {
    return error instanceof Error ? error.message : "Invalid config values.";
  }
}
