import React from "react";
import { Button, Form, Modal } from "react-bootstrap";

const ESTIMATE_PRESETS = [30, 60, 120, 15, 90, 180] as const;

export type PlannerAddToMyDayEstimateModalProps = Readonly<{
  show: boolean;
  taskTitle: string;
  estimateInput: string;
  onEstimateInputChange: (value: string) => void;
  onClose: () => void;
  onSkip: () => void;
  onConfirm: () => void;
}>;

export function PlannerAddToMyDayEstimateModal({
  show,
  taskTitle,
  estimateInput,
  onEstimateInputChange,
  onClose,
  onSkip,
  onConfirm,
}: PlannerAddToMyDayEstimateModalProps) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add estimate</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="small text-muted mb-3">
          Add an estimate for &ldquo;{taskTitle}&rdquo; before adding it to My Day, or skip to add
          without an estimate.
        </p>
        <PlannerEstimatePresetChips onSelect={onEstimateInputChange} />
        <Form.Control
          type="number"
          min={1}
          placeholder="Custom minutes"
          value={estimateInput}
          onChange={(e) => onEstimateInputChange(e.target.value)}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onSkip}>
          Skip
        </Button>
        <Button onClick={onConfirm}>Add to My Day</Button>
      </Modal.Footer>
    </Modal>
  );
}

function PlannerEstimatePresetChips({
  onSelect,
}: Readonly<{ onSelect: (value: string) => void }>) {
  return (
    <div className="d-flex flex-wrap gap-2 mb-3">
      {ESTIMATE_PRESETS.map((preset) => (
        <button
          key={preset}
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => onSelect(String(preset))}
        >
          {preset}m
        </button>
      ))}
    </div>
  );
}
