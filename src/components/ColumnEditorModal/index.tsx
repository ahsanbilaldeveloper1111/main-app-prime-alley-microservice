import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";

export interface ColumnOption {
  key: string;
  label: string;
}

export interface ColumnEditorModalProps {
  show: boolean;
  onHide: () => void;
  title?: string;
  columns: ColumnOption[];
  selectedColumnKeys: string[];
  onApply: (selectedKeys: string[]) => void;
}

/**
 * Reusable modal to customize which columns are visible in a table.
 * Used by CRM list pages (prospects, leads, deals, orders).
 */
export const ColumnEditorModal: React.FC<ColumnEditorModalProps> = ({
  show,
  onHide,
  title = "Customize Columns",
  columns,
  selectedColumnKeys,
  onApply,
}) => {
  const [draftSelectedKeys, setDraftSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    if (show) {
      setDraftSelectedKeys([...selectedColumnKeys]);
    }
  }, [show, selectedColumnKeys]);

  const handleApply = () => {
    onApply(draftSelectedKeys);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted mb-3">
          Select which columns to display in the table
        </p>
        <Row>
          {columns.map((col) => {
            const isChecked = draftSelectedKeys.includes(col.key);
            const isOnlySelected =
              isChecked && draftSelectedKeys.length === 1;
            return (
              <Col key={col.key} md={6} className="mb-2">
                <Form.Check
                  type="checkbox"
                  id={`column-check-${col.key}`}
                  label={col.label}
                  checked={isChecked}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    if (checked) {
                      setDraftSelectedKeys((prev) =>
                        prev.includes(col.key) ? prev : [...prev, col.key],
                      );
                    } else if (!isOnlySelected) {
                      setDraftSelectedKeys((prev) =>
                        prev.filter((k) => k !== col.key),
                      );
                    }
                  }}
                />
              </Col>
            );
          })}
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleApply}>
          Apply Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ColumnEditorModal;
