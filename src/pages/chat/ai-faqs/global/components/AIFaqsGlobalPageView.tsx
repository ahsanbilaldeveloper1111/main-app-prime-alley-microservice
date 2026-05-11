import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import GenericListPage from "@components/GenericListPage";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import type { Column } from "@components/CustomDataTable";
import { useAIFaqsGlobalPage } from "../useAIFaqsGlobalPage";
import { FAQ_ATTACHMENTS_ACCEPT_GLOBAL } from "../../faqDraftUtils";
import { FaqAttachmentsField } from "../../components/FaqAttachmentsField";
import { FaqDraftItemCard } from "../../components/FaqDraftItemCard";
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
    setShowDeleteModal,
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
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6>FAQ Items</h6>
                <Button variant="outline-primary" size="sm" onClick={handleAddFAQItem}>
                  <Plus size={14} className="me-1" />
                  Add FAQ
                </Button>
              </div>

              {faqItems.map((item, index) => (
                <FaqDraftItemCard
                  key={item.draftId}
                  item={item}
                  index={index}
                  totalCount={faqItems.length}
                  variant="add"
                  onUpdate={handleUpdateFAQItem}
                  onRemoveItem={handleRemoveFAQItem}
                />
              ))}
            </div>

            <FaqAttachmentsField
              haveFiles={haveFiles}
              fileInputKey={fileInputKey}
              selectedFiles={selectedFiles}
              accept={FAQ_ATTACHMENTS_ACCEPT_GLOBAL}
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
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6>FAQ Item</h6>
              </div>

              {faqItems.map((item, index) => (
                <FaqDraftItemCard
                  key={item.draftId}
                  item={item}
                  index={index}
                  totalCount={faqItems.length}
                  variant="edit"
                  onUpdate={handleUpdateFAQItem}
                  onRemoveItem={handleRemoveFAQItem}
                />
              ))}
            </div>

            <FaqAttachmentsField
              haveFiles={haveFiles}
              fileInputKey={fileInputKey}
              selectedFiles={selectedFiles}
              accept={FAQ_ATTACHMENTS_ACCEPT_GLOBAL}
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
