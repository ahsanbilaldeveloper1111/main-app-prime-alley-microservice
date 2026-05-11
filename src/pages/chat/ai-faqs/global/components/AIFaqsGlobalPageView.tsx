import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import GenericListPage from "@components/GenericListPage";
import type { Column } from "@components/CustomDataTable";
import { AI_FAQ_GLOBAL_FILE_ACCEPT } from "../../faqItemDraft";
import { AiFaqAttachmentField } from "../../components/AiFaqAttachmentField";
import { AiFaqDeleteConfirmModal } from "../../components/AiFaqDeleteConfirmModal";
import { AiFaqDraftItemsEditor } from "../../components/AiFaqDraftItemsEditor";
import { useAIFaqsGlobalPage } from "../useAIFaqsGlobalPage";
import { Button, Form, Modal } from "react-bootstrap";
import { ArrowLeft, Plus } from "lucide-react";
import React from "react";

export type AIFaqsGlobalPageViewProps = Readonly<{
  ctx: ReturnType<typeof useAIFaqsGlobalPage>;
}>;

export function AIFaqsGlobalPageView({ ctx }: AIFaqsGlobalPageViewProps) {
  const {
    router,
    refreshKey,
    columns,
    fetchData,
    showAddModal,
    setShowAddModal,
    showEditModal,
    setShowEditModal,
    showDeleteModal,
    selectedFAQ,
    setSelectedFAQ,
    faqItems,
    haveFiles,
    selectedFiles,
    fileInputKey,
    showViewModal,
    setShowViewModal,
    viewFAQ,
    resetForm,
    handleAddFAQItem,
    handleRemoveFAQItem,
    handleUpdateFAQItem,
    handleFileChange,
    handleRemoveFile,
    handleSubmit,
    handleConfirmDelete,
    closeDeleteModal,
  } = ctx;

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Global FAQs" />

      <PageHeader
        title=""
        showSearch={false}
        buttons={
          <>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} className="me-2" />
              Add FAQs
            </Button>
            <Button variant="outline-secondary" onClick={() => router.back()}>
              <ArrowLeft size={16} className="me-2" />
              Back
            </Button>
          </>
        }
      />

      <GenericListPage
        columns={columns as unknown as Column[]}
        fetchData={fetchData}
        title="Global FAQs"
        searchPlaceholder="Search FAQs..."
        defaultPageSize={15}
        filters={{}}
        refreshKey={refreshKey}
        search={true}
        tableStyle="table-style-2"
      />

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
          <Modal.Title>Add Global FAQs</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <AiFaqDraftItemsEditor
              mode="add"
              faqItems={faqItems}
              onAddItem={handleAddFAQItem}
              onRemoveItem={handleRemoveFAQItem}
              onUpdateItem={handleUpdateFAQItem}
            />
            <AiFaqAttachmentField
              haveFiles={haveFiles}
              fileInputKey={fileInputKey}
              selectedFiles={selectedFiles}
              accept={AI_FAQ_GLOBAL_FILE_ACCEPT}
              onFileChange={handleFileChange}
              onRemoveFile={handleRemoveFile}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowAddModal(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={() => handleSubmit()}>
            Create FAQs
          </Button>
        </Modal.Footer>
      </Modal>

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
          <Modal.Title>Edit Global FAQ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <AiFaqDraftItemsEditor mode="edit" faqItems={faqItems} onUpdateItem={handleUpdateFAQItem} />
            <AiFaqAttachmentField
              haveFiles={haveFiles}
              fileInputKey={fileInputKey}
              selectedFiles={selectedFiles}
              accept={AI_FAQ_GLOBAL_FILE_ACCEPT}
              onFileChange={handleFileChange}
              onRemoveFile={handleRemoveFile}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowEditModal(false);
              setSelectedFAQ(null);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={() => handleSubmit()}>
            Update FAQ
          </Button>
        </Modal.Footer>
      </Modal>

      <AiFaqDeleteConfirmModal
        show={showDeleteModal}
        targetQuestion={selectedFAQ?.question ?? ""}
        onConfirm={handleConfirmDelete}
        onClose={closeDeleteModal}
      />

      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>View FAQ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <strong>Question:</strong> {viewFAQ?.question}
            <br />
            <strong>Answer:</strong> {viewFAQ?.answer}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
}
