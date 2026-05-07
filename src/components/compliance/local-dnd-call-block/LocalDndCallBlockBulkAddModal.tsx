import React from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { Download } from "lucide-react";

import type { LocalDndCallBlockViewModel } from "./useLocalDndCallBlockPage";

import "./localDndCallBlockPage.scss";

export function LocalDndCallBlockBulkAddModal(
  props: Readonly<{ vm: LocalDndCallBlockViewModel }>,
): React.ReactElement {
  const { vm } = props;

  return (
    <Modal
      show={vm.showBulkAddModal}
      onHide={vm.handleCloseBulkAddModal}
      centered
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>Bulk Add Local DND Blocks</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <h6 className="mb-3">CSV Format</h6>
          <p className="text-muted small mb-3">
            Upload a CSV file with columns:{" "}
            <strong>called_number</strong>, <strong>company_name</strong>,{" "}
            <strong>comments</strong>
          </p>

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small">Sample CSV format:</span>
              <Button
                variant="link"
                size="sm"
                onClick={vm.downloadSampleCSV}
                className="localDndCallBlockPage-sampleLink"
              >
                <Download size={14} className="me-1" />
                Download Sample CSV
              </Button>
            </div>
            <div className="localDndCallBlockPage-codeBox">
              <pre>
                {`called_number,company_name,comments
0501234567,Acme Corporation,Bulk upload - Campaign 2026
0557890123,Tech Solutions Ltd,DND List Import
0509876543,Global Industries,Customer requested block`}
              </pre>
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Select CSV File</Form.Label>
            <Form.Control
              ref={vm.bulkCsvInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => {
                void vm.handleFileSelect(e);
              }}
              disabled={vm.bulkSubmitting}
            />
            <Form.Text className="text-muted">
              Select a CSV file with the required columns
            </Form.Text>
          </Form.Group>

          {vm.csvPreview && (
            <div className="mt-3">
              <h6 className="mb-2">File Preview</h6>
              <div className="localDndCallBlockPage-previewBox">
                <pre>{vm.csvPreview}</pre>
              </div>
              <Form.Text className="text-muted small mt-2">
                {vm.csvFile?.name} ({(vm.csvFile?.size || 0) / 1024} KB)
              </Form.Text>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={vm.handleCloseBulkAddModal}
          disabled={vm.bulkSubmitting}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            void vm.handleBulkAdd();
          }}
          disabled={!vm.csvFile || vm.bulkSubmitting}
          className="localDndCallBlockPage-modalSubmit"
        >
          {vm.bulkSubmitting ? (
            <>
              <div
                className="spinner-border spinner-border-sm me-2"
                role="status"
              />
              Uploading...
            </>
          ) : (
            "Upload & Add Records"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
