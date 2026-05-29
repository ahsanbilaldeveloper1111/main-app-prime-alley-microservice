import ConfirmModal from "@components/page-partials/ConfirmModal";
import type { FAQData, FAQItem } from "@utils/chat";
import React from "react";
import { Button, Form, Modal } from "react-bootstrap";

import type { FAQItemDraft } from "../faqItemDraft";
import { AiFaqAttachmentField } from "./AiFaqAttachmentField";
import { AiFaqDraftItemCards } from "./AiFaqDraftItemCards";

const ADD_FAQ_FORM_ID = "ai-faq-add-form";
const EDIT_FAQ_FORM_ID = "ai-faq-edit-form";

export type AiFaqPageModalsProps = Readonly<{
  scopeLabel: string;
  showAddModal: boolean;
  setShowAddModal: (v: boolean) => void;
  showEditModal?: boolean;
  setShowEditModal?: (v: boolean) => void;
  showDeleteModal: boolean;
  setShowDeleteModal: (v: boolean) => void;
  selectedFAQ: FAQData | null;
  setSelectedFAQ: (v: FAQData | null) => void;

  faqItems: FAQItemDraft[];
  haveFiles: boolean;
  selectedFiles: File[];
  fileInputKey: number;
  resetForm: () => void;
  handleAddFAQItem: () => void;
  handleRemoveFAQItem: (clientKey: string) => void;
  handleUpdateFAQItem: (clientKey: string, field: keyof FAQItem, value: string) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveFile: (index: number) => void;
  handleSubmit: () => void | Promise<void>;
  handleConfirmDelete: () => void | Promise<void>;

  /** Rendered inside the add modal body before FAQ draft cards (e.g. tenant picker). */
  addModalBodyPrefix?: React.ReactNode;

  /** Optional `accept` for the attachment file input (e.g. tenant API allows PDF/TXT only). */
  faqAttachmentAccept?: string;

  viewModal?: Readonly<{
    show: boolean;
    setShow: (v: boolean) => void;
    faq: FAQData | null;
  }>;
}>;

export function AiFaqPageModals(props: AiFaqPageModalsProps) {
  const {
    scopeLabel,
    showAddModal,
    setShowAddModal,
    showEditModal,
    setShowEditModal,
    showDeleteModal,
    setShowDeleteModal,
    selectedFAQ,
    setSelectedFAQ,
    faqItems,
    haveFiles,
    selectedFiles,
    fileInputKey,
    resetForm,
    handleAddFAQItem,
    handleRemoveFAQItem,
    handleUpdateFAQItem,
    handleFileChange,
    handleRemoveFile,
    handleSubmit,
    handleConfirmDelete,
    addModalBodyPrefix,
    faqAttachmentAccept,
    viewModal,
  } = props;

  return (
    <React.Fragment>
      <Modal
        show={showAddModal}
        onHide={() => {
          setShowAddModal(false);
          resetForm();
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{`Add ${scopeLabel} FAQs`}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form
            id={ADD_FAQ_FORM_ID}
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
          >
            {addModalBodyPrefix}
            <AiFaqDraftItemCards
              variant="multi"
              faqItems={faqItems}
              onAddItem={handleAddFAQItem}
              onRemoveItem={handleRemoveFAQItem}
              onUpdateItem={handleUpdateFAQItem}
            />
            <AiFaqAttachmentField
              haveFiles={haveFiles}
              fileInputKey={fileInputKey}
              selectedFiles={selectedFiles}
              accept={faqAttachmentAccept}
              onFileChange={handleFileChange}
              onRemoveFile={handleRemoveFile}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setShowAddModal(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={ADD_FAQ_FORM_ID}>
            Create FAQs
          </Button>
        </Modal.Footer>
      </Modal>

      {showEditModal !== undefined && setShowEditModal ? (
        <Modal
          show={showEditModal}
          onHide={() => {
            setShowEditModal(false);
            setSelectedFAQ(null);
            resetForm();
          }}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>{`Edit ${scopeLabel} FAQ`}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form
              id={EDIT_FAQ_FORM_ID}
              onSubmit={(e) => {
                e.preventDefault();
                void handleSubmit();
              }}
            >
              <AiFaqDraftItemCards
                variant="single"
                faqItems={faqItems}
                onRemoveItem={handleRemoveFAQItem}
                onUpdateItem={handleUpdateFAQItem}
              />
              <AiFaqAttachmentField
                haveFiles={haveFiles}
                fileInputKey={fileInputKey}
                selectedFiles={selectedFiles}
                accept={faqAttachmentAccept}
                onFileChange={handleFileChange}
                onRemoveFile={handleRemoveFile}
              />
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowEditModal(false);
                setSelectedFAQ(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={EDIT_FAQ_FORM_ID}>
              Update FAQ
            </Button>
          </Modal.Footer>
        </Modal>
      ) : null}

      {showDeleteModal ? (
        <ConfirmModal
          show={showDeleteModal}
          onHide={() => {
            setShowDeleteModal(false);
            setSelectedFAQ(null);
          }}
          title="Delete FAQ?"
          description="Are you sure you want to delete this FAQ? This action cannot be undone."
          targetName={selectedFAQ?.question ?? ""}
          confirmButtonText="Delete"
          cancelButtonText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedFAQ(null);
          }}
        />
      ) : null}

      {viewModal ? (
        <Modal show={viewModal.show} onHide={() => viewModal.setShow(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>View FAQ</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              <strong>Question:</strong> {viewModal.faq?.question}
              <br />
              <strong>Answer:</strong> {viewModal.faq?.answer}
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => viewModal.setShow(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      ) : null}
    </React.Fragment>
  );
}
