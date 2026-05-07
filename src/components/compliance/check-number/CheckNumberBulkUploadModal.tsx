import React from "react";
import { Button, Form, Modal } from "react-bootstrap";

import type { CheckNumberPageViewModel } from "./useCheckNumberPage";

import "./checkNumberPage.scss";

export interface CheckNumberBulkUploadModalProps {
  vm: Pick<
    CheckNumberPageViewModel,
    | "showBulkUploadModal"
    | "setShowBulkUploadModal"
    | "bulkFile"
    | "setBulkFile"
    | "isUploading"
    | "handleBulkUpload"
    | "handleFileDrop"
    | "handleDragOver"
    | "handleFileSelect"
    | "bulkFileInputRef"
    | "openBulkFilePicker"
    | "downloadSampleFile"
  >;
}

export function CheckNumberBulkUploadModal(
  props: Readonly<CheckNumberBulkUploadModalProps>,
): React.ReactElement {
  const { vm } = props;

  return (
    <Modal
      show={vm.showBulkUploadModal}
      onHide={() => vm.setShowBulkUploadModal(false)}
      size="lg"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Bulk Upload DNCR Check</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <h6>Upload File</h6>
          <p className="text-muted mb-2">
            Upload a CSV file with phone numbers (one per line)
          </p>

          {vm.bulkFile ? (
            <section
              className="checkNumberPage-dropzone border-2 rounded p-4 text-center checkNumberPage-dropzone--hasFile"
              aria-label={`CSV file loaded: ${vm.bulkFile.name}`}
              onDrop={vm.handleFileDrop}
              onDragOver={vm.handleDragOver}
            >
              <div>
                <i className="fas fa-file-csv text-success fa-2x mb-2" />
                <p className="mb-1">
                  <strong>{vm.bulkFile.name}</strong>
                </p>
                <p className="text-muted mb-2">File selected successfully</p>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => vm.setBulkFile(null)}
                >
                  Remove File
                </Button>
              </div>
            </section>
          ) : (
            <div className="checkNumberPage-dropzone border-2 rounded p-4 text-center checkNumberPage-dropzone--empty">
              <Form.Control
                ref={vm.bulkFileInputRef}
                type="file"
                accept=".csv"
                onChange={vm.handleFileSelect}
                onDragOver={vm.handleDragOver}
                onDrop={vm.handleFileDrop}
                className="checkNumberPage-fileInputOverlay"
                id="bulk-file-input"
              />
              <div className="checkNumberPage-dropzoneFace" aria-hidden="true">
                <i className="fas fa-cloud-upload-alt text-muted fa-2x mb-2" />
                <p className="mb-1">Drag and drop your CSV file here</p>
                <p className="text-muted mb-2">or</p>
              </div>
              <Button
                variant="outline-primary"
                size="sm"
                className="checkNumberPage-browseBtn"
                onClick={vm.openBulkFilePicker}
              >
                Browse File
              </Button>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex justify-content-between w-100">
          <div>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={vm.downloadSampleFile}
            >
              <span className="d-inline-flex align-items-center gap-2">
                <span aria-hidden="true">
                  <i className="fas fa-download" />
                </span>
                <span>Download Sample File</span>
              </span>
            </Button>
          </div>
          <div>
            <Button
              variant="secondary"
              onClick={() => vm.setShowBulkUploadModal(false)}
              className="me-2"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={vm.handleBulkUpload}
              disabled={!vm.bulkFile || vm.isUploading}
            >
              {vm.isUploading ? (
                <output
                  className="d-inline-flex align-items-center gap-2 mb-0 align-middle border-0 p-0 bg-transparent"
                  aria-live="polite"
                  aria-label="Uploading"
                >
                  <span
                    className="spinner-border spinner-border-sm"
                    aria-hidden="true"
                  />
                  <span>Uploading...</span>
                </output>
              ) : (
                "Upload & Check Numbers"
              )}
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
