import React from "react";
import { Download } from "lucide-react";

import "./apiNumberCheckPage.scss";

export interface ApiNumberCheckStatusBarProps {
  validCount: number;
  invalidCount: number;
  showDownloadResults: boolean;
  onDownloadResults: () => void;
}

export function ApiNumberCheckStatusBar({
  validCount,
  invalidCount,
  showDownloadResults,
  onDownloadResults,
}: Readonly<ApiNumberCheckStatusBarProps>): React.ReactElement {
  return (
    <div className="apiNumberCheck-statusBar">
      <div className="apiNumberCheck-statusLeft">
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
      </div>
      <div className="apiNumberCheck-statusRight">
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
