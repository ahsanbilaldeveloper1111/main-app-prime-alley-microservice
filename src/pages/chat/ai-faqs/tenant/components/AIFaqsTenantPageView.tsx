import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import GenericListPage from "@components/GenericListPage";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import type { Column } from "@components/CustomDataTable";
import { useAIFaqsTenantPage } from "../useAIFaqsTenantPage";
import { FAQ_ATTACHMENTS_ACCEPT_TENANT } from "../../faqDraftUtils";
import { FaqAttachmentsField } from "../../components/FaqAttachmentsField";
import { FaqDraftItemCard } from "../../components/FaqDraftItemCard";
import { Button, Form, Modal } from "react-bootstrap";
import { ArrowLeft, Filter, Plus } from "lucide-react";
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
              label: (c.name ?? c.identifier) as string,
            }))}
            value={
              selectedCompanyForFilter
                ? {
                    value: selectedCompanyForFilter,
                    label:
                      (companies.find((c) => c.identifier === selectedCompanyForFilter)?.name ??
                        selectedCompanyForFilter) as string,
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
        columns={columns as unknown as Column[]}
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
                    label: (c.name ?? c.identifier) as string,
                  }))}
                  value={
                    tenantId
                      ? {
                          value: tenantId,
                          label: (companies.find((c) => c.identifier === tenantId)?.name ?? tenantId) as string,
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
              accept={FAQ_ATTACHMENTS_ACCEPT_TENANT}
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
          <Modal.Title>Edit Tenant FAQ</Modal.Title>
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
              accept={FAQ_ATTACHMENTS_ACCEPT_TENANT}
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
    </React.Fragment>
  );
}
