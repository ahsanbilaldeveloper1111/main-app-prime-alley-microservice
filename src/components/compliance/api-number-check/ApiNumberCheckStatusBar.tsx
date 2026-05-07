import React from "react";
import { Download } from "lucide-react";

import "./apiNumberCheckPage.scss";

export interface ApiNumberCheckStatusBarProps {
  activeTab: "manual" | "csv";
  validCount: number;
  invalidCount: number;
  csvFile: File | null;
  csvValidCount: number;
  csvInvalidCount: number;
  onBulkUpload: () => void;
  isUploading: boolean;
  showDownloadResults: boolean;
  onDownloadResults: () => void;
  disableBulkSubmit: boolean;
}

export function ApiNumberCheckStatusBar({
  activeTab,
  validCount,
  invalidCount,
  csvFile,
  csvValidCount,
  csvInvalidCount,
  onBulkUpload,
  isUploading,
  showDownloadResults,
  onDownloadResults,
  disableBulkSubmit,
}: ApiNumberCheckStatusBarProps): React.ReactElement {
  return (
    <div className="apiNumberCheck-statusBar">
      <div className="apiNumberCheck-statusLeft">
        {activeTab === "manual" ? (
          <div className="apiNumberCheck-statusRow">
            <span
              className={
                validCount > 0
                  ? "apiNumberCheck-statusBadgeSuccess"
                  : "apiNumberCheck-statusBadgeDisabled"
              }
            >
              Valid Numbers: {validCount}
            </span>
            <span
              className={
                invalidCount > 0
                  ? "apiNumberCheck-statusBadgeError"
                  : "apiNumberCheck-statusBadgeDisabled"
              }
            >
              Invalid Numbers: {invalidCount}
            </span>
            {validCount === 0 && invalidCount === 0 && (
              <span className="apiNumberCheck-statusBadgeDisabled">
                Total Numbers: 0
              </span>
            )}
          </div>
        ) : (
          <div className="apiNumberCheck-statusRow">
            {csvFile ? (
              <>
                <span
                  className={
                    csvValidCount > 0
                      ? "apiNumberCheck-statusBadgeSuccess"
                      : "apiNumberCheck-statusBadgeDisabled"
                  }
                >
                  Valid Numbers: {csvValidCount}
                </span>
                <span
                  className={
                    csvInvalidCount > 0
                      ? "apiNumberCheck-statusBadgeError"
                      : "apiNumberCheck-statusBadgeDisabled"
                  }
                >
                  Invalid Numbers: {csvInvalidCount}
                </span>
              </>
            ) : (
              <span className="apiNumberCheck-statusBadgeDisabled">
                CSV: No file selected
              </span>
            )}
          </div>
        )}
      </div>
      <div className="apiNumberCheck-statusRight">
        {activeTab === "csv" && (
          <button
            type="button"
            className="apiNumberCheck-btnPrimaryLarge"
            onClick={onBulkUpload}
            disabled={disableBulkSubmit}
          >
            {isUploading ? "Uploading..." : "Upload & Check Numbers"}
          </button>
        )}
        {showDownloadResults && (
          <button
            type="button"
            className="apiNumberCheck-btnOutline"
            onClick={onDownloadResults}
          >
            <Download size={16} className="apiNumberCheck-downloadIcon" />
            Download Results
          </button>
        )}
      </div>
    </div>
  );
}
