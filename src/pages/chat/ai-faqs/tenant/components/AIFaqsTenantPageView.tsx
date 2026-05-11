import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import GenericListPage from "@components/GenericListPage";
import type { Column } from "@components/CustomDataTable";
import {
  AI_FAQ_TENANT_FILE_ACCEPT,
} from "../../faqItemDraft";
import { AiFaqAttachmentField } from "../../components/AiFaqAttachmentField";
import { AiFaqDeleteConfirmModal } from "../../components/AiFaqDeleteConfirmModal";
import { AiFaqDraftItemsEditor } from "../../components/AiFaqDraftItemsEditor";
import { useAIFaqsTenantPage } from "../useAIFaqsTenantPage";
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
    closeDeleteModal,
    openAddModalWithTenant,
  } = ctx;

  const tenantSelect = (
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
  );

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
            <AiFaqDraftItemsEditor
              mode="add"
              faqItems={faqItems}
              onAddItem={handleAddFAQItem}
              onRemoveItem={handleRemoveFAQItem}
              onUpdateItem={handleUpdateFAQItem}
              childrenBeforeItems={tenantSelect}
            />
            <AiFaqAttachmentField
              haveFiles={haveFiles}
              fileInputKey={fileInputKey}
              selectedFiles={selectedFiles}
              accept={AI_FAQ_TENANT_FILE_ACCEPT}
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
            <AiFaqDraftItemsEditor mode="edit" faqItems={faqItems} onUpdateItem={handleUpdateFAQItem} />
            <AiFaqAttachmentField
              haveFiles={haveFiles}
              fileInputKey={fileInputKey}
              selectedFiles={selectedFiles}
              accept={AI_FAQ_TENANT_FILE_ACCEPT}
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
    </React.Fragment>
  );
}
