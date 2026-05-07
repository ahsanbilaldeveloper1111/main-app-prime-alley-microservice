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

          <div
            className={`checkNumberPage-dropzone border-2 rounded p-4 text-center ${
              vm.bulkFile
                ? "checkNumberPage-dropzone--hasFile"
                : "checkNumberPage-dropzone--empty"
            }`}
            onDrop={vm.handleFileDrop}
            onDragOver={vm.handleDragOver}
          >
            {vm.bulkFile ? (
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
            ) : (
              <div>
                <i className="fas fa-cloud-upload-alt text-muted fa-2x mb-2" />
                <p className="mb-1">Drag and drop your CSV file here</p>
                <p className="text-muted mb-2">or</p>
                <Form.Control
                  ref={vm.bulkFileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={vm.handleFileSelect}
                  className="checkNumberPage-fileInputHidden"
                  id="bulk-file-input"
                />
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={vm.openBulkFilePicker}
                >
                  Browse File
                </Button>
              </div>
            )}
          </div>
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
              <i className="fas fa-download me-2" />
              Download Sample File
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
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />
                  Uploading...
                </>
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
