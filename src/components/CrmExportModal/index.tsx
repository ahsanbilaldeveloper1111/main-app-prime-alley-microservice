import React from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";

export interface CrmExportModalProps {
  show: boolean;
  onHide: () => void;
  title: string;
  subtitle?: React.ReactNode;
  fileNameValue: string;
  onFileNameChange: (value: string) => void;
  fileNamePlaceholder?: string;
  onExportClick: () => void | Promise<void>;
  exporting: boolean;
  exportButtonLabel?: string;
  children: React.ReactNode;
}

/**
 * Reusable export modal for CRM list pages (prospects, leads, deals, orders).
 * Provides consistent layout: title, subtitle, file name input, filter form (children), Cancel/Export buttons.
 * Export logic and filter state are owned by the parent.
 */
export const CrmExportModal: React.FC<CrmExportModalProps> = ({
  show,
  onHide,
  title,
  subtitle,
  fileNameValue,
  onFileNameChange,
  fileNamePlaceholder = "export_2025-02-24",
  onExportClick,
  exporting,
  exportButtonLabel = "Export",
  children,
}) => {
  const handleExport = async () => {
    await onExportClick();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {subtitle && (
          <p className="text-muted small mb-3">{subtitle}</p>
        )}
        <Form.Group className="mb-3">
          <Form.Label>File name</Form.Label>
          <Form.Control
            type="text"
            value={fileNameValue}
            onChange={(e) => onFileNameChange(e.target.value)}
            placeholder={fileNamePlaceholder}
          />
        </Form.Group>
        {children}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={exporting}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={exporting}
          onClick={handleExport}
        >
          {exporting ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Exporting...
            </>
          ) : (
            exportButtonLabel
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CrmExportModal;
