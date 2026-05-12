import React from "react";
import { Col, Row } from "react-bootstrap";
import type {
  StageFormState,
  StageType,
} from "@page-modules/crm/stages/stagesPageModel";

function parseSequenceInput(raw: string, fallback: number): number {
  const n = Number.parseInt(raw, 10);
  return Number.isNaN(n) || n < 1 ? fallback : n;
}

function parseProbabilityInput(raw: string): number {
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

export interface StageFormFieldsProps {
  formData: StageFormState;
  onChange: <K extends keyof StageFormState>(
    field: K,
    value: StageFormState[K],
  ) => void;
  singleColumn?: boolean;
}

/** Shared form layout used by stage create sidebar and update modal. */
export const StageFormFields: React.FC<StageFormFieldsProps> = ({
  formData,
  onChange,
  singleColumn = false,
}) => {
  const fieldColumnWidth = singleColumn ? 12 : 6;

  return (
    <>
      <Row>
        <Col md={fieldColumnWidth}>
          <div className="stages-form-field contact-form-field">
            <label htmlFor="stage-name-input" className="stages-form-label">
              Stage Name <span className="stages-form-required">*</span>
            </label>
            <input
              id="stage-name-input"
              type="text"
              className="stages-form-input"
              value={formData.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="Enter stage name"
              required
            />
          </div>
        </Col>
        <Col md={fieldColumnWidth}>
          <div className="stages-form-field contact-form-field">
            <label htmlFor="stage-sequence-input" className="stages-form-label">
              Sequence <span className="stages-form-required">*</span>
            </label>
            <input
              id="stage-sequence-input"
              type="number"
              className="stages-form-input"
              value={formData.sequence}
              onChange={(e) =>
                onChange(
                  "sequence",
                  parseSequenceInput(e.target.value, formData.sequence),
                )
              }
              min="1"
              required
            />
          </div>
        </Col>
      </Row>

      <Row>
        <Col md={fieldColumnWidth}>
          <div className="stages-form-field contact-form-field">
            <label htmlFor="stage-type-select" className="stages-form-label">
              Type <span className="stages-form-required">*</span>
            </label>
            <select
              id="stage-type-select"
              className="stages-form-input"
              value={formData.type}
              onChange={(e) => onChange("type", e.target.value as StageType)}
              required
            >
              <option value="lead">Lead</option>
              <option value="deal">Deal</option>
              <option value="order">Order</option>
              <option value="lost_reason">Lost Reason</option>
            </select>
          </div>
        </Col>
        <Col md={2}>
          <div className="stages-form-field contact-form-field">
            <label htmlFor="stage-color-input" className="stages-form-label">
              Color
            </label>
            <input
              id="stage-color-input"
              type="color"
              className="stages-form-input stages-form-input--color"
              value={formData.color}
              onChange={(e) => onChange("color", e.target.value)}
            />
          </div>
        </Col>
      </Row>

      <Row>
        <Col md={fieldColumnWidth}>
          <div className="stages-form-field contact-form-field">
            <label
              htmlFor="stage-probability-input"
              className="stages-form-label"
            >
              Probability
            </label>
            <input
              id="stage-probability-input"
              type="number"
              className="stages-form-input"
              value={formData.probability}
              onChange={(e) =>
                onChange("probability", parseProbabilityInput(e.target.value))
              }
              min="0"
              max="100"
              disabled={formData.type === "lost_reason"}
            />
          </div>
        </Col>
      </Row>

      <div className="stages-form-field contact-form-field">
        <label htmlFor="stage-description-input" className="stages-form-label">
          Description
        </label>
        <textarea
          id="stage-description-input"
          className="stages-form-textarea"
          rows={3}
          value={formData.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Enter stage description (optional)"
        />
      </div>
    </>
  );
};
