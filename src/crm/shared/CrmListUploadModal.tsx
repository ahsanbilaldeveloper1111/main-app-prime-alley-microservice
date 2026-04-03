import React from "react";
import { Modal, Button, Form } from "react-bootstrap";
import CreatableSelect from "react-select/creatable";
import { AlertCircle as AlertCircleIcon, Download } from "lucide-react";
import { downloadExampleCsv } from "@utils/crm";

export interface CrmListUploadModalProps {
  show: boolean;
  onHide: () => void;
  title: string;
  fieldTags: readonly any[];
  onFieldTagsChange: (tags: readonly any[]) => void;
  availableTags: Array<{ value: string; label: string; id: number }>;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
}

export function CrmListUploadModal({
  show,
  onHide,
  title,
  fieldTags,
  onFieldTagsChange,
  availableTags,
  onFileInputChange,
  onUpload,
}: CrmListUploadModalProps) {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="border-bottom bg-light">
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <div className="alert alert-info mb-4">
          <AlertCircleIcon size={18} className="me-2" />
          <strong>Import Guidelines:</strong>
          <ul className="mb-0 mt-2">
            <li>
              <strong>Headers:</strong> First row must contain column headers
            </li>
            <li>
              <strong>Name Column:</strong> Include a &quot;name&quot; column
              (case insensitive) for first name and last name, or use separate
              &quot;first name&quot; and &quot;last name&quot; columns
            </li>
            <li>
              <strong>Phone Column:</strong> Include a &quot;phone&quot; column
              (case insensitive) for contact information. Phone must follow the
              E.164 format. (e.g., +14155552671)
            </li>
            <li>
              <strong>Email Column:</strong> Include a &quot;email&quot; column
              for contact information. Email must be a valid email address.
            </li>
            <li>
              <strong>File Size:</strong> Maximum 2MB per file
            </li>
            <li>
              <strong>Formats:</strong> CSV files supported
            </li>
            <li>
              <strong>Data Quality:</strong> Clean, valid data imports faster and
              works better
            </li>
          </ul>
        </div>
        <Form>
          <Form.Group className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Form.Label className="fw-semibold mb-0">
                Select CSV File <span className="text-danger">*</span>
              </Form.Label>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={downloadExampleCsv}
                className="d-flex align-items-center gap-1"
              >
                <Download size={14} />
                Download Example CSV
              </Button>
            </div>
            <Form.Control type="file" accept=".csv" onChange={onFileInputChange} />
            <Form.Text className="text-muted">
              Supported formats: CSV
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Tags (Optional)</Form.Label>
            <CreatableSelect
              isMulti
              value={fieldTags}
              onChange={(selected) => onFieldTagsChange(selected || [])}
              options={availableTags}
              placeholder="Add tags to organize and filter this data..."
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: "#ced4da",
                  boxShadow: "none",
                  fontSize: "14px",
                }),
              }}
            />
            <Form.Text className="text-muted">
              Add descriptive tags to help categorize and filter your data later.
              You can create new tags by typing them.
            </Form.Text>
          </Form.Group>
          <div className="alert alert-warning">
            <small>
              <strong>Note:</strong> The data will be uploaded even if some
              fields remain empty.
            </small>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-top">
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onUpload}>
          <Download size={16} className="me-2" />
          Upload &amp; Import
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
