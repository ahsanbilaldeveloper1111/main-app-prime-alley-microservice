import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import GenericListPage from "@components/GenericListPage";
import { AiFaqPageModals } from "../../components/AiFaqPageModals";
import { Button, Form } from "react-bootstrap";
import { ArrowLeft, Filter, Plus } from "lucide-react";
import Select from "react-select";
import React from "react";

import { useAIFaqsTenantPage } from "../useAIFaqsTenantPage";

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

  const companyOptions = companies.map((c) => ({
    value: c.identifier,
    label: c.name ?? c.identifier,
  }));

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

      <AiFaqPageModals
        scopeLabel="Tenant"
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        selectedFAQ={selectedFAQ}
        setSelectedFAQ={setSelectedFAQ}
        faqItems={faqItems}
        haveFiles={haveFiles}
        selectedFiles={selectedFiles}
        fileInputKey={fileInputKey}
        resetForm={resetForm}
        handleAddFAQItem={handleAddFAQItem}
        handleRemoveFAQItem={handleRemoveFAQItem}
        handleUpdateFAQItem={handleUpdateFAQItem}
        handleFileChange={handleFileChange}
        handleRemoveFile={handleRemoveFile}
        handleSubmit={handleSubmit}
        handleConfirmDelete={handleConfirmDelete}
        addModalBodyPrefix={
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
        }
      />
    </React.Fragment>
  );
}
