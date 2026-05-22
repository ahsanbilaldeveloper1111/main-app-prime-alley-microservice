import type { FAQItem } from "@utils/chat";
import type { FAQItemDraft } from "../faqItemDraft";
import { AiFaqAttachmentField } from "./AiFaqAttachmentField";
import { AiFaqDraftItemsEditor } from "./AiFaqDraftItemsEditor";
import { Button, Form, Modal } from "react-bootstrap";
import type { ChangeEvent, ReactNode } from "react";

export type AiFaqUpsertModalProps = Readonly<{
  show: boolean;
  title: string;
  primaryActionLabel: string;
  editorMode: "add" | "edit";
  fileAccept: string;
  faqItems: FAQItemDraft[];
  haveFiles: boolean;
  fileInputKey: number;
  selectedFiles: File[];
  onRequestClose: () => void;
  onSubmit: () => void | Promise<void>;
  onAddItem?: () => void;
  onRemoveItem?: (clientKey: string) => void;
  onUpdateItem: (clientKey: string, field: keyof FAQItem, value: string) => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  childrenBeforeItems?: ReactNode;
}>;

export function AiFaqUpsertModal({
  show,
  title,
  primaryActionLabel,
  editorMode,
  fileAccept,
  faqItems,
  haveFiles,
  fileInputKey,
  selectedFiles,
  onRequestClose,
  onSubmit,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onFileChange,
  onRemoveFile,
  childrenBeforeItems,
}: AiFaqUpsertModalProps) {
  return (
    <Modal show={show} onHide={onRequestClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form
          id="ai-faq-upsert-form"
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          <AiFaqDraftItemsEditor
            mode={editorMode}
            faqItems={faqItems}
            onAddItem={onAddItem}
            onRemoveItem={onRemoveItem}
            onUpdateItem={onUpdateItem}
            childrenBeforeItems={childrenBeforeItems}
          />
          <AiFaqAttachmentField
            haveFiles={haveFiles}
            fileInputKey={fileInputKey}
            selectedFiles={selectedFiles}
            accept={fileAccept}
            onFileChange={onFileChange}
            onRemoveFile={onRemoveFile}
          />
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="secondary" onClick={onRequestClose}>
          Cancel
        </Button>
        <Button type="submit" form="ai-faq-upsert-form" variant="primary">
          {primaryActionLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
