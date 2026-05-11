import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import GenericListPage from "@components/GenericListPage";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import { useAIFaqsTenantPage } from "../useAIFaqsTenantPage";
import { AiFaqAttachmentField } from "../../components/AiFaqAttachmentField";
import { AiFaqDraftItemCards } from "../../components/AiFaqDraftItemCards";
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
