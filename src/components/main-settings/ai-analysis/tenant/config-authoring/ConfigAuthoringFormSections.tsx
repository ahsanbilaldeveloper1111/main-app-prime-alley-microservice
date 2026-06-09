import React from "react";
import { Button } from "react-bootstrap";

import { TenantField } from "../AnalysisTenantShared";

import type {
  ConfigAssessmentFormValues,
  ConfigAuthoringFormValues,
  ConfigBandFormValues,
  ConfigCriterionFormValues,
  ConfigInfoFieldFormValues,
  ConfigTagFormValues,
} from "./types";
import {
  defaultConfigAssessmentForm,
  defaultConfigBandForm,
  defaultConfigCriterionForm,
  defaultConfigInfoFieldForm,
  defaultConfigTagForm,
} from "./types";

const COLOR_OPTIONS = ["green", "red", "amber", "neutral", "blue", "purple"] as const;

const INFO_FIELD_TYPE_OPTIONS = [
  { value: "text" as const, label: "Text" },
  { value: "yes_no" as const, label: "Yes / No" },
  { value: "number" as const, label: "Number" },
];

function SectionHint(props: Readonly<{ children: React.ReactNode }>) {
  return (
    <p className="ai-analysis-tenant-config__config-section-hint">{props.children}</p>
  );
}

function SectionCard(props: Readonly<{
  title: string;
  hint?: string;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="ai-analysis-tenant-config__config-section">
      <div className="ai-analysis-tenant-config__config-section-header">
        <h3 className="ai-analysis-tenant-config__config-section-title">{props.title}</h3>
        {props.onAdd ? (
          <Button type="button" variant="outline-primary" size="sm" onClick={props.onAdd}>
            {props.addLabel ?? "Add"}
          </Button>
        ) : null}
      </div>
      {props.hint ? <SectionHint>{props.hint}</SectionHint> : null}
      {props.children}
    </section>
  );
}

function ItemCard(props: Readonly<{
  title: string;
  onRemove: () => void;
  children: React.ReactNode;
}>) {
  return (
    <div className="ai-analysis-tenant-config__config-item">
      <div className="ai-analysis-tenant-config__config-item-header">
        <h4 className="ai-analysis-tenant-config__config-item-title">{props.title}</h4>
        <Button type="button" variant="outline-danger" size="sm" onClick={props.onRemove}>
          Remove
        </Button>
      </div>
      <div className="ai-analysis-tenant-config__grid">{props.children}</div>
    </div>
  );
}

function ColorSelect(props: Readonly<{
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}>) {
  return (
    <label className="ai-analysis-tenant-config__field">
      <span className="ai-analysis-tenant-config__field-label">Color</span>
      <select
        className="ai-analysis-tenant-config__input"
        value={props.value}
        disabled={props.disabled}
        onChange={(e) => props.onChange(e.target.value)}
      >
        {COLOR_OPTIONS.map((color) => (
          <option key={color} value={color}>
            {color}
          </option>
        ))}
      </select>
    </label>
  );
}

function TagsSection(props: Readonly<{
  tags: ConfigTagFormValues[];
  disabled: boolean;
  onChange: (tags: ConfigTagFormValues[]) => void;
}>) {
  const updateTag = (index: number, patch: Partial<ConfigTagFormValues>) => {
    props.onChange(
      props.tags.map((tag, i) => (i === index ? { ...tag, ...patch } : tag)),
    );
  };

  return (
    <SectionCard
      title="Tags"
      hint="Labels must start with a letter."
      addLabel="Add tag"
      onAdd={() => props.onChange([...props.tags, defaultConfigTagForm()])}
    >
      {props.tags.length === 0 ? (
        <p className="ai-analysis-tenant-config__config-empty">No tags defined.</p>
      ) : (
        props.tags.map((tag, index) => (
          <ItemCard
            key={`tag-${index}`}
            title={tag.label.trim() || `Tag ${index + 1}`}
            onRemove={() => props.onChange(props.tags.filter((_, i) => i !== index))}
          >
            <TenantField
              label="Label"
              value={tag.label}
              disabled={props.disabled}
              onChange={(v) => updateTag(index, { label: v })}
            />
            <TenantField
              label="When to apply"
              value={tag.whenToApply}
              disabled={props.disabled}
              onChange={(v) => updateTag(index, { whenToApply: v })}
            />
            <ColorSelect
              value={tag.color}
              disabled={props.disabled}
              onChange={(v) => updateTag(index, { color: v })}
            />
          </ItemCard>
        ))
      )}
    </SectionCard>
  );
}

function CriteriaSection(props: Readonly<{
  criteria: ConfigCriterionFormValues[];
  disabled: boolean;
  onChange: (criteria: ConfigCriterionFormValues[]) => void;
}>) {
  const updateCriterion = (
    index: number,
    patch: Partial<ConfigCriterionFormValues>,
  ) => {
    props.onChange(
      props.criteria.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  return (
    <div className="ai-analysis-tenant-config__config-nested">
      <div className="ai-analysis-tenant-config__config-nested-header">
        <h5>Criteria</h5>
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          disabled={props.disabled}
          onClick={() =>
            props.onChange([...props.criteria, defaultConfigCriterionForm()])
          }
        >
          Add criterion
        </Button>
      </div>
      <SectionHint>Criteria weights must total 100.</SectionHint>
      {props.criteria.length === 0 ? (
        <p className="ai-analysis-tenant-config__config-empty">No criteria.</p>
      ) : (
        props.criteria.map((criterion, index) => (
          <div key={`criterion-${index}`} className="ai-analysis-tenant-config__config-nested-item">
            <div className="ai-analysis-tenant-config__config-nested-item-header">
              <span>
                {criterion.text.trim() || `Criterion ${index + 1}`}
              </span>
              <Button
                type="button"
                variant="link"
                className="text-danger p-0"
                disabled={props.disabled}
                onClick={() =>
                  props.onChange(props.criteria.filter((_, i) => i !== index))
                }
              >
                Remove
              </Button>
            </div>
            <div className="ai-analysis-tenant-config__grid">
              <TenantField
                label="Text"
                value={criterion.text}
                disabled={props.disabled}
                onChange={(v) => updateCriterion(index, { text: v })}
              />
              <TenantField
                label="Weight"
                value={criterion.weight}
                type="number"
                step="1"
                disabled={props.disabled}
                onChange={(v) => updateCriterion(index, { weight: v })}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function BandsSection(props: Readonly<{
  bands: ConfigBandFormValues[];
  disabled: boolean;
  onChange: (bands: ConfigBandFormValues[]) => void;
}>) {
  const updateBand = (index: number, patch: Partial<ConfigBandFormValues>) => {
    props.onChange(
      props.bands.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  return (
    <div className="ai-analysis-tenant-config__config-nested">
      <div className="ai-analysis-tenant-config__config-nested-header">
        <h5>Score bands</h5>
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          disabled={props.disabled}
          onClick={() =>
            props.onChange([...props.bands, defaultConfigBandForm()])
          }
        >
          Add band
        </Button>
      </div>
      <SectionHint>
        Score bands must not overlap (e.g. 0–49, then 50–100). Band labels must start
        with a letter.
      </SectionHint>
      {props.bands.length === 0 ? (
        <p className="ai-analysis-tenant-config__config-empty">No bands.</p>
      ) : (
        props.bands.map((band, index) => (
          <div key={`band-${index}`} className="ai-analysis-tenant-config__config-nested-item">
            <div className="ai-analysis-tenant-config__config-nested-item-header">
              <span>{band.label.trim() || `Band ${index + 1}`}</span>
              <Button
                type="button"
                variant="link"
                className="text-danger p-0"
                disabled={props.disabled}
                onClick={() => props.onChange(props.bands.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </div>
            <div className="ai-analysis-tenant-config__grid">
              <TenantField
                label="Min score"
                value={band.minScore}
                type="number"
                step="1"
                disabled={props.disabled}
                onChange={(v) => updateBand(index, { minScore: v })}
              />
              <TenantField
                label="Max score"
                value={band.maxScore}
                type="number"
                step="1"
                disabled={props.disabled}
                onChange={(v) => updateBand(index, { maxScore: v })}
              />
              <TenantField
                label="Label"
                value={band.label}
                disabled={props.disabled}
                onChange={(v) => updateBand(index, { label: v })}
              />
              <ColorSelect
                value={band.color}
                disabled={props.disabled}
                onChange={(v) => updateBand(index, { color: v })}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function AssessmentsSection(props: Readonly<{
  assessments: ConfigAssessmentFormValues[];
  disabled: boolean;
  onChange: (assessments: ConfigAssessmentFormValues[]) => void;
}>) {
  const updateAssessment = (
    index: number,
    patch: Partial<ConfigAssessmentFormValues>,
  ) => {
    props.onChange(
      props.assessments.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  return (
    <SectionCard
      title="Assessments"
      hint="Assessment labels must start with a letter."
      addLabel="Add assessment"
      onAdd={() =>
        props.onChange([...props.assessments, defaultConfigAssessmentForm()])
      }
    >
      {props.assessments.length === 0 ? (
        <p className="ai-analysis-tenant-config__config-empty">No assessments defined.</p>
      ) : (
        props.assessments.map((assessment, index) => (
          <ItemCard
            key={`assessment-${index}`}
            title={assessment.label.trim() || `Assessment ${index + 1}`}
            onRemove={() =>
              props.onChange(props.assessments.filter((_, i) => i !== index))
            }
          >
            <TenantField
              label="Label"
              value={assessment.label}
              disabled={props.disabled}
              onChange={(v) => updateAssessment(index, { label: v })}
            />
            <CriteriaSection
              criteria={assessment.criteria}
              disabled={props.disabled}
              onChange={(criteria) => updateAssessment(index, { criteria })}
            />
            <BandsSection
              bands={assessment.bands}
              disabled={props.disabled}
              onChange={(bands) => updateAssessment(index, { bands })}
            />
          </ItemCard>
        ))
      )}
    </SectionCard>
  );
}

function InfoFieldsSection(props: Readonly<{
  infoFields: ConfigInfoFieldFormValues[];
  disabled: boolean;
  onChange: (infoFields: ConfigInfoFieldFormValues[]) => void;
}>) {
  const updateField = (index: number, patch: Partial<ConfigInfoFieldFormValues>) => {
    props.onChange(
      props.infoFields.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  return (
    <SectionCard
      title="Info fields"
      hint="Labels must start with a letter."
      addLabel="Add info field"
      onAdd={() =>
        props.onChange([...props.infoFields, defaultConfigInfoFieldForm()])
      }
    >
      {props.infoFields.length === 0 ? (
        <p className="ai-analysis-tenant-config__config-empty">No info fields defined.</p>
      ) : (
        props.infoFields.map((field, index) => (
          <ItemCard
            key={`info-field-${index}`}
            title={field.label.trim() || `Field ${index + 1}`}
            onRemove={() => props.onChange(props.infoFields.filter((_, i) => i !== index))}
          >
            <TenantField
              label="Label"
              value={field.label}
              disabled={props.disabled}
              onChange={(v) => updateField(index, { label: v })}
            />
            <label className="ai-analysis-tenant-config__field">
              <span className="ai-analysis-tenant-config__field-label">Field type</span>
              <select
                className="ai-analysis-tenant-config__input"
                value={field.fieldType}
                disabled={props.disabled}
                onChange={(e) =>
                  updateField(index, {
                    fieldType: e.target.value as ConfigInfoFieldFormValues["fieldType"],
                  })
                }
              >
                {INFO_FIELD_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <TenantField
              label="Description"
              value={field.description}
              disabled={props.disabled}
              onChange={(v) => updateField(index, { description: v })}
            />
          </ItemCard>
        ))
      )}
    </SectionCard>
  );
}

export function ConfigAuthoringFormSections(props: Readonly<{
  values: ConfigAuthoringFormValues;
  disabled: boolean;
  onChange: (values: ConfigAuthoringFormValues) => void;
}>) {
  const { values, disabled, onChange } = props;

  return (
    <div className="ai-analysis-tenant-config__config-form">
      <div className="ai-analysis-tenant-config__grid">
        <TenantField
          label="Industry type (stated industry)"
          value={values.statedIndustry}
          disabled={disabled}
          hint="Required — synced with company industry type on save"
          onChange={(v) => onChange({ ...values, statedIndustry: v })}
        />
        <TenantField
          label="Authored by"
          value={values.authoredBy}
          disabled={disabled}
          onChange={(v) => onChange({ ...values, authoredBy: v })}
        />
      </div>

      <div className="ai-analysis-tenant-config__config-sections">
        <TagsSection
          tags={values.tags}
          disabled={disabled}
          onChange={(tags) => onChange({ ...values, tags })}
        />
        <AssessmentsSection
          assessments={values.assessments}
          disabled={disabled}
          onChange={(assessments) => onChange({ ...values, assessments })}
        />
        <InfoFieldsSection
          infoFields={values.infoFields}
          disabled={disabled}
          onChange={(infoFields) => onChange({ ...values, infoFields })}
        />
      </div>
    </div>
  );
}
