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
  onDragOver: (e: DragEvent<HTMLElement>) => void;
  onDrop: (e: DragEvent<HTMLElement>) => void;
  onDropzoneKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
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

  const dropzoneClassName = `apiNumberCheck-dropzone${
    csvFile ? " apiNumberCheck-dropzone--hasFile" : " apiNumberCheck-dropzone--empty"
  }`;

  return (
    <div className="apiNumberCheck-csvTab">
      {csvFile ? (
        <section
          className={dropzoneClassName}
          aria-label={`CSV file loaded: ${csvFile.name}`}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
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
        </section>
      ) : (
        <div className={dropzoneClassName}>
          <input
            ref={csvInputRef}
            id="csvUpload"
            type="file"
            accept=".csv"
            onChange={onFileUpload}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onKeyDown={onDropzoneKeyDown}
            className="apiNumberCheck-fileInputOverlay"
            aria-label="Upload CSV file by drop or keyboard"
          />
          <div className="apiNumberCheck-dropzoneFace" aria-hidden="true">
            <Upload
              size={32}
              color="#6c757d"
              className="apiNumberCheck-dropzoneIcon"
            />
            <span className="apiNumberCheck-dropzoneText">
              Drag and drop or browse to upload CSV
            </span>
            <span className="apiNumberCheck-browseLabel">Browse</span>
          </div>
        </div>
      )}
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
