import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import GenericListPage from "@components/GenericListPage";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import { useAIFaqsTenantPage } from "../useAIFaqsTenantPage";
import { faqAttachmentFileDomKey } from "../../faqItemDraft";
import { Button, Card, Form, Modal } from "react-bootstrap";
import { ArrowLeft, Filter, Plus, X } from "lucide-react";
import Select from "react-select";
import React from "react";

export type AIFaqsTenantPageViewProps = Readonly<{
  ctx: ReturnType<typeof useAIFaqsTenantPage>;
}>;

export function AIFaqsTenantPageView({ ctx }: AIFaqsTenantPageViewProps) {
  const {
    router,
    refreshKey,
    columns,
    fetchData,
    stableFilters,
    companies,
    companiesLoading,
    tenantId,
    setTenantId,
    selectedCompanyForFilter,
    setSelectedCompanyForFilter,
    handleApplyFilter,
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
    openAddModalWithTenant,
  } = ctx;

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Tenant FAQs" />

      <PageHeader
        title=""
        showSearch={false}
        buttons={
          <>
            <Button variant="primary" onClick={openAddModalWithTenant}>
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

      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <div style={{ minWidth: "220px" }}>
          <Select
            isLoading={companiesLoading}
            options={companies.map((c) => ({
              value: c.identifier,
              label: c.name ?? c.identifier,
            }))}
            value={
              selectedCompanyForFilter
                ? {
                    value: selectedCompanyForFilter,
                    label:
                      companies.find((c) => c.identifier === selectedCompanyForFilter)?.name ??
                      selectedCompanyForFilter,
                  }
                : null
            }
            onChange={(opt) => setSelectedCompanyForFilter(opt?.value ?? "")}
            placeholder="Select company..."
            isClearable
          />
        </div>
        <Button variant="primary" onClick={handleApplyFilter}>
          <Filter size={16} className="me-2" />
          Filter
        </Button>
      </div>

      <GenericListPage
        columns={columns}
        fetchData={fetchData}
        title="Tenant FAQs"
        searchPlaceholder="Search FAQs..."
        defaultPageSize={15}
        filters={stableFilters}
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
          <Modal.Title>Add Tenant FAQs</Modal.Title>
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

              <Form.Group className="mb-4">
                <Form.Label>Tenant</Form.Label>
                <Select
                  isLoading={companiesLoading}
                  options={companies.map((c) => ({
                    value: c.identifier,
                    label: c.name ?? c.identifier,
                  }))}
                  value={
                    tenantId
                      ? {
                          value: tenantId,
                          label: companies.find((c) => c.identifier === tenantId)?.name ?? tenantId,
                        }
                      : null
                  }
                  onChange={(opt) => {
                    if (opt) setTenantId(opt.value);
                  }}
                  placeholder="Select tenant..."
                  isClearable={false}
                />
              </Form.Group>

              {faqItems.map((item, index) => (
                <Card key={item.clientKey} className="mb-3">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong>FAQ #{index + 1}</strong>
                      {faqItems.length > 1 ? (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-danger p-0"
                          onClick={() => handleRemoveFAQItem(index)}
                        >
                          <X size={16} />
                        </Button>
                      ) : null}
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
                  accept=".pdf,.txt,.doc,.docx"
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
          <Modal.Title>Edit Tenant FAQ</Modal.Title>
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
                  accept=".pdf,.txt,.doc,.docx"
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
    </React.Fragment>
  );
}
