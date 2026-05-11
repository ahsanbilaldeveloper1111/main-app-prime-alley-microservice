import { Button, Form } from "react-bootstrap";
import { X } from "lucide-react";
import {
  AI_FAQ_ATTACHMENT_ACCEPT,
  faqAttachmentFileDomKey,
} from "../faqItemDraft";
import type React from "react";

export type AiFaqAttachmentFieldProps = Readonly<{
  haveFiles: boolean;
  fileInputKey: number;
  selectedFiles: File[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
}>;

export function AiFaqAttachmentField({
  haveFiles,
  fileInputKey,
  selectedFiles,
  onFileChange,
  onRemoveFile,
}: AiFaqAttachmentFieldProps) {
  if (!haveFiles) {
    return null;
  }
  return (
    <div className="mb-3">
      <Form.Label>Files</Form.Label>
      <Form.Control
        key={fileInputKey}
        type="file"
        multiple
        onChange={onFileChange}
        accept={AI_FAQ_ATTACHMENT_ACCEPT}
      />
      {selectedFiles.length > 0 ? (
        <div className="mt-2">
          {selectedFiles.map((file, index) => (
            <div
              key={faqAttachmentFileDomKey(file)}
              className="d-flex justify-content-between align-items-center p-2 bg-light rounded mb-1"
            >
              <span className="small">{file.name}</span>
              <Button
                variant="link"
                size="sm"
                className="text-danger p-0"
                type="button"
                onClick={() => onRemoveFile(index)}
              >
                <X size={14} />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
