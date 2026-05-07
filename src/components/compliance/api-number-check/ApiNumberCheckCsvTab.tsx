import React, {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  RefObject,
} from "react";
import { Upload, X } from "lucide-react";

import "./apiNumberCheckPage.scss";

export interface ApiNumberCheckCsvTabProps {
  csvFile: File | null;
  csvInputRef: RefObject<HTMLInputElement | null>;
  onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onDropzoneKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
  onRemoveFile: () => void;
  onDownloadSample: () => void;
}

export function ApiNumberCheckCsvTab(
  props: Readonly<ApiNumberCheckCsvTabProps>,
): React.ReactElement {
  const {
    csvFile,
    csvInputRef,
    onFileUpload,
    onDragOver,
    onDrop,
    onDropzoneKeyDown,
    onRemoveFile,
    onDownloadSample,
  } = props;

  return (
    <div className="apiNumberCheck-csvTab">
      <div
        className={`apiNumberCheck-dropzone${
          csvFile ? " apiNumberCheck-dropzone--hasFile" : ""
        }`}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onKeyDown={onDropzoneKeyDown}
        tabIndex={0}
        aria-label="Upload CSV file by drop or keyboard"
      >
        {csvFile ? (
          <div className="apiNumberCheck-dropzoneInner">
            <Upload
              size={32}
              color="#28a745"
              className="apiNumberCheck-dropzoneIcon"
            />
            <p className="apiNumberCheck-dropzoneText apiNumberCheck-dropzoneText--success">
              {csvFile.name}
            </p>
            <p className="apiNumberCheck-dropzoneText apiNumberCheck-dropzoneText--meta">
              {(csvFile.size / 1024).toFixed(2)} KB
            </p>
            <button
              type="button"
              className="apiNumberCheck-btnSecondary apiNumberCheck-btnSecondarySm"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onRemoveFile();
              }}
            >
              <X size={14} className="apiNumberCheck-inlineIconSm" />
              Remove File
            </button>
          </div>
        ) : (
          <>
            <Upload
              size={32}
              color="#6c757d"
              className="apiNumberCheck-dropzoneIcon"
            />
            <p className="apiNumberCheck-dropzoneText">
              Drag and drop or browse to upload CSV
            </p>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              onChange={onFileUpload}
              className="apiNumberCheck-fileInput"
              id="csvUpload"
            />
            <label htmlFor="csvUpload" className="apiNumberCheck-browseLabel">
              Browse
            </label>
          </>
        )}
      </div>
      <div className="apiNumberCheck-csvInfo">
        <span className="apiNumberCheck-mutedLink">CSV column: PhoneNumber</span>
        <button
          type="button"
          onClick={onDownloadSample}
          className="apiNumberCheck-textLinkBtn"
        >
          Download sample
        </button>
      </div>
    </div>
  );
}
