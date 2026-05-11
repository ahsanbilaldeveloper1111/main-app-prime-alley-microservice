import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import GenericListPage from "@components/GenericListPage";
import type { Column } from "@components/CustomDataTable";
import { AI_FAQ_GLOBAL_FILE_ACCEPT } from "../../faqItemDraft";
import { AiFaqDeleteConfirmModal } from "../../components/AiFaqDeleteConfirmModal";
import { AiFaqUpsertModal } from "../../components/AiFaqUpsertModal";
import { useAIFaqsGlobalPage } from "../useAIFaqsGlobalPage";
import { Button, Modal } from "react-bootstrap";
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
    closeDeleteModal,
  } = ctx;

  const closeAddModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedFAQ(null);
    resetForm();
  };

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

      <AiFaqUpsertModal
        show={showAddModal}
        title="Add Global FAQs"
        primaryActionLabel="Create FAQs"
        editorMode="add"
        fileAccept={AI_FAQ_GLOBAL_FILE_ACCEPT}
        faqItems={faqItems}
        haveFiles={haveFiles}
        fileInputKey={fileInputKey}
        selectedFiles={selectedFiles}
        onRequestClose={closeAddModal}
        onSubmit={handleSubmit}
        onAddItem={handleAddFAQItem}
        onRemoveItem={handleRemoveFAQItem}
        onUpdateItem={handleUpdateFAQItem}
        onFileChange={handleFileChange}
        onRemoveFile={handleRemoveFile}
      />

      <AiFaqUpsertModal
        show={showEditModal}
        title="Edit Global FAQ"
        primaryActionLabel="Update FAQ"
        editorMode="edit"
        fileAccept={AI_FAQ_GLOBAL_FILE_ACCEPT}
        faqItems={faqItems}
        haveFiles={haveFiles}
        fileInputKey={fileInputKey}
        selectedFiles={selectedFiles}
        onRequestClose={closeEditModal}
        onSubmit={handleSubmit}
        onUpdateItem={handleUpdateFAQItem}
        onFileChange={handleFileChange}
        onRemoveFile={handleRemoveFile}
      />

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
