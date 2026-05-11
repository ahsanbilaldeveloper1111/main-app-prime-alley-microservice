import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import GenericListPage from "@components/GenericListPage";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import type { Column } from "@components/CustomDataTable";
import { useAIFaqsGlobalPage } from "../useAIFaqsGlobalPage";
import { faqAttachmentFileDomKey } from "../../faqItemDraft";
import { Button, Card, Form, Modal } from "react-bootstrap";
import { ArrowLeft, Plus, X } from "lucide-react";
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
        columns={columns as Column[]}
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
                <Card key={item.clientKey} className="mb-3">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong>FAQ #{index + 1}</strong>
                      {faqItems.length > 1 && (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-danger p-0"
                          onClick={() => handleRemoveFAQItem(index)}
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Question <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={item.question}
                        onChange={(e) => handleUpdateFAQItem(index, "question", e.target.value)}
                        placeholder="Enter question"
                      />
                    </Form.Group>
                    <Form.Group className="mb-0">
                      <Form.Label>
                        Answer <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={item.answer}
                        onChange={(e) => handleUpdateFAQItem(index, "answer", e.target.value)}
                        placeholder="Enter answer"
                      />
                    </Form.Group>
                  </Card.Body>
                </Card>
              ))}
            </div>

            {haveFiles ? (
              <div className="mb-3">
                <Form.Label>Files</Form.Label>
                <Form.Control
                  key={fileInputKey}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx"
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
                          onClick={() => handleRemoveFile(index)}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
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
                <Card key={item.clientKey} className="mb-3">
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Question <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={item.question}
                        onChange={(e) => handleUpdateFAQItem(index, "question", e.target.value)}
                        placeholder="Enter question"
                      />
                    </Form.Group>
                    <Form.Group className="mb-0">
                      <Form.Label>
                        Answer <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={item.answer}
                        onChange={(e) => handleUpdateFAQItem(index, "answer", e.target.value)}
                        placeholder="Enter answer"
                      />
                    </Form.Group>
                  </Card.Body>
                </Card>
              ))}
            </div>

            {haveFiles ? (
              <div className="mb-3">
                <Form.Label>Files</Form.Label>
                <Form.Control
                  key={fileInputKey}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx"
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
                          onClick={() => handleRemoveFile(index)}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
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
