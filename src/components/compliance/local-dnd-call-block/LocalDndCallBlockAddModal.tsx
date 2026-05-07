import React, { FormEvent } from "react";
import { Button, Form, Modal } from "react-bootstrap";

import type { LocalDndCallBlockViewModel } from "./useLocalDndCallBlockPage";

import "./localDndCallBlockPage.scss";

export function LocalDndCallBlockAddModal(
  props: Readonly<{ vm: LocalDndCallBlockViewModel }>,
): React.ReactElement {
  const { vm } = props;

  return (
    <Modal show={vm.showAddModal} onHide={vm.handleCloseModal} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add Local DND Block</Modal.Title>
      </Modal.Header>
      <Form
        onSubmit={(e: FormEvent) => {
          void vm.handleAddRecord(e);
        }}
      >
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>
              Called Number <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter called number (e.g., 0501234567)"
              value={vm.formData.called_number}
              onChange={(e) =>
                vm.setFormData((prev) => ({
                  ...prev,
                  called_number: e.target.value,
                }))
              }
              required
            />
            <Form.Text className="text-muted">
              The phone number to be blocked
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Comments</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter comments (optional)"
              value={vm.formData.comments}
              onChange={(e) =>
                vm.setFormData((prev) => ({
                  ...prev,
                  comments: e.target.value,
                }))
              }
            />
            <Form.Text className="text-muted">
              Optional: Additional notes or reason for blocking
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={vm.handleCloseModal}
            disabled={vm.submitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={vm.submitting}
            className="localDndCallBlockPage-modalSubmit"
          >
            {vm.submitting ? "Adding..." : "Add Block"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
