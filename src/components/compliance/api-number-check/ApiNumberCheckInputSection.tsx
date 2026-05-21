import React from "react";
import { Edit3, HelpCircle } from "lucide-react";

import { ApiNumberCheckManualTab } from "./ApiNumberCheckManualTab";
import { ApiNumberCheckStatusBar } from "./ApiNumberCheckStatusBar";

import "./apiNumberCheckPage.scss";

export interface ApiNumberCheckInputSectionProps {
  onOpenFormatGuide: () => void;
  manualInput: string;
  setManualInput: (value: string) => void;
  isManualInputValid: boolean;
  validCount: number;
  invalidCount: number;
  isChecking: boolean;
  handleCheckNumbers: () => void;
  clearManualInput: () => void;
  handleDownloadResults: () => void;
  showDownloadResults: boolean;
}

export function ApiNumberCheckInputSection(
  props: Readonly<ApiNumberCheckInputSectionProps>,
): React.ReactElement {
  const {
    onOpenFormatGuide,
    manualInput,
    setManualInput,
    isManualInputValid,
    validCount,
    invalidCount,
    isChecking,
    handleCheckNumbers,
    clearManualInput,
    handleDownloadResults,
    showDownloadResults,
  } = props;

  return (
    <>
      <div className="apiNumberCheck-header">
        <h1 className="apiNumberCheck-title">API Number Check</h1>
        <button
          type="button"
          className="apiNumberCheck-formatGuideBtn"
          onClick={(e) => {
            e.preventDefault();
            onOpenFormatGuide();
          }}
        >
          <HelpCircle size={16} className="apiNumberCheck-tabIcon" />
          Guidelines
        </button>
      </div>

      <div className="apiNumberCheck-card">
        <div className="apiNumberCheck-cardHeader">
          <div className="apiNumberCheck-sectionTitle">
            <div className="apiNumberCheck-iconBadge">
              <Edit3 size={16} color="#6c757d" />
            </div>
            Input
          </div>
        </div>

        <div className="apiNumberCheck-cardBody">
          <div className="apiNumberCheck-tabContent">
            <ApiNumberCheckManualTab
              value={manualInput}
              onChange={setManualInput}
              isManualInputValid={isManualInputValid}
              isChecking={isChecking}
              onCheck={handleCheckNumbers}
              onClear={clearManualInput}
            />
          </div>

          <ApiNumberCheckStatusBar
            validCount={validCount}
            invalidCount={invalidCount}
            showDownloadResults={showDownloadResults}
            onDownloadResults={handleDownloadResults}
          />
        </div>
      </div>
    </>
  );
}
