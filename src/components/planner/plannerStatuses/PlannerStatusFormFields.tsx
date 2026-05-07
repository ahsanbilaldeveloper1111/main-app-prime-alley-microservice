import React from "react";
import { Form } from "react-bootstrap";
import { PLANNER_STATUS_PREDEFINED_COLORS } from "./plannerStatusesDomain";
import type { PlannerStatusFormState } from "./plannerStatusesDomain";
import "./plannerStatuses.scss";

export type PlannerStatusColorSwatchesProps = Readonly<{
  selectedColor: string;
  onSelectColor: (color: string) => void;
}>;

export function PlannerStatusColorSwatches({
  selectedColor,
  onSelectColor,
}: PlannerStatusColorSwatchesProps) {
  return (
    <div className="wps-color-swatches">
      {PLANNER_STATUS_PREDEFINED_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={`wps-color-swatch${selectedColor === color ? " wps-color-swatch--selected" : ""}`}
          style={{ backgroundColor: color }}
          onClick={() => onSelectColor(color)}
          title={color}
        />
      ))}
    </div>
  );
}

export type PlannerStatusFormFieldsProps = Readonly<{
  formData: PlannerStatusFormState;
  setFormData: React.Dispatch<React.SetStateAction<PlannerStatusFormState>>;
}>;

export function PlannerStatusFormFields({ formData, setFormData }: PlannerStatusFormFieldsProps) {
  return (
    <Form>
      <Form.Group className="mb-3">
        <Form.Label>
          Name <span className="text-danger">*</span>
        </Form.Label>
        <Form.Control
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter status name"
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Color</Form.Label>
        <PlannerStatusColorSwatches
          selectedColor={formData.color}
          onSelectColor={(color) => setFormData({ ...formData, color })}
        />
        <Form.Control
          type="color"
          value={formData.color}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Order</Form.Label>
        <Form.Control
          type="number"
          value={formData.order}
          onChange={(e) =>
            setFormData({ ...formData, order: Number.parseInt(e.target.value, 10) || 0 })
          }
          min={0}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          label="Is Default"
          checked={formData.is_default}
          onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          label="Is Completed"
          checked={formData.is_completed}
          onChange={(e) => setFormData({ ...formData, is_completed: e.target.checked })}
        />
      </Form.Group>
    </Form>
  );
}
