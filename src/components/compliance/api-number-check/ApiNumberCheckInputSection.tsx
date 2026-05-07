import React, {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  RefObject,
} from "react";
import { Edit3, HelpCircle, Upload } from "lucide-react";

import { ApiNumberCheckCsvTab } from "./ApiNumberCheckCsvTab";
import { ApiNumberCheckManualTab } from "./ApiNumberCheckManualTab";
import { ApiNumberCheckStatusBar } from "./ApiNumberCheckStatusBar";

import "./apiNumberCheckPage.scss";

export interface ApiNumberCheckInputSectionProps {
  canBulkCheckDncr: boolean;
  activeTab: "manual" | "csv";
  setActiveTab: (tab: "manual" | "csv") => void;
  onOpenFormatGuide: () => void;
  manualInput: string;
  setManualInput: (value: string) => void;
  isManualInputValid: boolean;
  validCount: number;
  invalidCount: number;
  isChecking: boolean;
  handleCheckNumbers: () => void;
  clearManualInput: () => void;
  csvFile: File | null;
  csvInputRef: RefObject<HTMLInputElement | null>;
  csvValidCount: number;
  csvInvalidCount: number;
  handleFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (e: DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: DragEvent<HTMLDivElement>) => void;
  handleDropzoneKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
  onRemoveCsvFile: () => void;
  downloadSampleFile: () => void;
  handleBulkUpload: () => void;
  isUploading: boolean;
  handleDownloadResults: () => void;
  showDownloadResults: boolean;
  disableBulkSubmit: boolean;
}

export function ApiNumberCheckInputSection(
  props: Readonly<ApiNumberCheckInputSectionProps>,
): React.ReactElement {
  const {
    canBulkCheckDncr,
    activeTab,
    setActiveTab,
    onOpenFormatGuide,
    manualInput,
    setManualInput,
    isManualInputValid,
    validCount,
    invalidCount,
    isChecking,
    handleCheckNumbers,
    clearManualInput,
    csvFile,
    csvInputRef,
    csvValidCount,
    csvInvalidCount,
    handleFileUpload,
    handleDragOver,
    handleDrop,
    handleDropzoneKeyDown,
    onRemoveCsvFile,
    downloadSampleFile,
    handleBulkUpload,
    isUploading,
    handleDownloadResults,
    showDownloadResults,
    disableBulkSubmit,
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
          <div className="apiNumberCheck-tabsContainer">
            <div className="apiNumberCheck-tabs">
              <button
                type="button"
                className={
                  activeTab === "manual"
                    ? "apiNumberCheck-tab apiNumberCheck-tab--active"
                    : "apiNumberCheck-tab"
                }
                onClick={() => setActiveTab("manual")}
              >
                <Edit3 size={16} className="apiNumberCheck-tabIcon" />
                Manual
              </button>
              {canBulkCheckDncr && (
                <button
                  type="button"
                  className={
                    activeTab === "csv"
                      ? "apiNumberCheck-tab apiNumberCheck-tab--active"
                      : "apiNumberCheck-tab"
                  }
                  onClick={() => setActiveTab("csv")}
                >
                  <Upload size={16} className="apiNumberCheck-tabIcon" />
                  CSV
                </button>
              )}
            </div>
          </div>

          <div className="apiNumberCheck-tabContent">
            {activeTab === "manual" && (
              <ApiNumberCheckManualTab
                value={manualInput}
                onChange={setManualInput}
                isManualInputValid={isManualInputValid}
                isChecking={isChecking}
                onCheck={handleCheckNumbers}
                onClear={clearManualInput}
              />
            )}
            {activeTab === "csv" && (
              <ApiNumberCheckCsvTab
                csvFile={csvFile}
                csvInputRef={csvInputRef}
                onFileUpload={handleFileUpload}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDropzoneKeyDown={handleDropzoneKeyDown}
                onRemoveFile={onRemoveCsvFile}
                onDownloadSample={downloadSampleFile}
              />
            )}
          </div>

          <ApiNumberCheckStatusBar
            activeTab={activeTab}
            validCount={validCount}
            invalidCount={invalidCount}
            csvFile={csvFile}
            csvValidCount={csvValidCount}
            csvInvalidCount={csvInvalidCount}
            onBulkUpload={handleBulkUpload}
            isUploading={isUploading}
            showDownloadResults={showDownloadResults}
            onDownloadResults={handleDownloadResults}
            disableBulkSubmit={disableBulkSubmit}
          />
        </div>
      </div>
    </>
  );
}
