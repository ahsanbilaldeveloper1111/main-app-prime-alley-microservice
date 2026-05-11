import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import GenericListPage from "@components/GenericListPage";
import type { Column } from "@components/CustomDataTable";
import { AI_FAQ_TENANT_FILE_ACCEPT } from "../../faqItemDraft";
import { AiFaqDeleteConfirmModal } from "../../components/AiFaqDeleteConfirmModal";
import { AiFaqUpsertModal } from "../../components/AiFaqUpsertModal";
import { useAIFaqsTenantPage } from "../useAIFaqsTenantPage";
import { Button, Form } from "react-bootstrap";
import { ArrowLeft, Filter, Plus } from "lucide-react";
import Select from "react-select";
import React, { useMemo } from "react";

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

  const companyOptions = useMemo(
    () => companies.map((c) => ({ value: c.identifier, label: c.name ?? c.identifier })),
    [companies],
  );

  const tenantSelect = (
    <Form.Group className="mb-4">
      <Form.Label>Tenant</Form.Label>
      <Select
        isLoading={companiesLoading}
        options={companyOptions}
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
            options={companyOptions}
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

      <AiFaqUpsertModal
        show={showAddModal}
        title="Add Tenant FAQs"
        primaryActionLabel="Create FAQs"
        editorMode="add"
        fileAccept={AI_FAQ_TENANT_FILE_ACCEPT}
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
        childrenBeforeItems={tenantSelect}
      />

      <AiFaqUpsertModal
        show={showEditModal}
        title="Edit Tenant FAQ"
        primaryActionLabel="Update FAQ"
        editorMode="edit"
        fileAccept={AI_FAQ_TENANT_FILE_ACCEPT}
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
    </React.Fragment>
  );
}
