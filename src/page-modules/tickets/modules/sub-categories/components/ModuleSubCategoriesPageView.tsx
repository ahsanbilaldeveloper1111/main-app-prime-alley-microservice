import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { type TableAction, type TableColumn } from "@components/GenericTable";
import PageHeader from "@components/PageHeader";
import FormModal from "@components/page-partials/FormModal";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import { TicketsSettingsEmbeddedToolbar } from "@page-modules/tickets/shared/TicketsSettingsEmbeddedToolbar";
import type { SubCategoryRow } from "../useModuleSubCategoriesPage";
import React from "react";
import { Button } from "react-bootstrap";
import type { TicketModulePickerRow, TicketSubmoduleRow } from "../../categories/moduleCategoriesTypes";

export type ModuleSubCategoriesPageViewProps = Readonly<{
  showBreadcrumb?: boolean;
  embeddedInMainSettings?: boolean;
  breadcrumbMainLink?: string;
  data: SubCategoryRow[];
  loading: boolean;
  columns: TableColumn<SubCategoryRow>[];
  actions: TableAction<SubCategoryRow>[];
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onPaginationChange: (page: number, perPage: number) => void;
  showSubmoduleChildrenModal: boolean;
  onCloseSubCategoryModal: () => void;
  onOpenNewSubcategoryModal: () => void;
  modules: TicketModulePickerRow[];
  newChildModuleId: string;
  onModuleChange: (id: string) => void;
  submodules: TicketSubmoduleRow[];
  newChildSubmoduleId: string;
  onSubmoduleChange: (id: string) => void;
  newChildName: string;
  onNewChildNameChange: (v: string) => void;
  newChildDescription: string;
  onNewChildDescriptionChange: (v: string) => void;
  onSubmitCreateSubCategory: () => void;
  showDeleteModal: boolean;
  onCloseDeleteModal: () => void;
  onConfirmDelete: () => void;
}>;

export const ModuleSubCategoriesPageView: React.FC<ModuleSubCategoriesPageViewProps> = ({
  showBreadcrumb = true,
  embeddedInMainSettings = false,
  breadcrumbMainLink = "/main-settings/tickets/modules",
  data,
  loading,
  columns,
  actions,
  currentPage,
  rowsPerPage,
  totalRows,
  searchValue,
  onSearchChange,
  onPaginationChange,
  showSubmoduleChildrenModal,
  onCloseSubCategoryModal,
  onOpenNewSubcategoryModal,
  modules,
  newChildModuleId,
  onModuleChange,
  submodules,
  newChildSubmoduleId,
  onSubmoduleChange,
  newChildName,
  onNewChildNameChange,
  newChildDescription,
  onNewChildDescriptionChange,
  onSubmitCreateSubCategory,
  showDeleteModal,
  onCloseDeleteModal,
  onConfirmDelete,
}) => (
  <div className={embeddedInMainSettings ? "tickets-settings-page" : undefined}>
    {showBreadcrumb ? (
      <BreadcrumbItem mainTitle="Tickets" mainLink={breadcrumbMainLink} subTitle="Sub Categories" />
    ) : null}

    {embeddedInMainSettings ? (
      <TicketsSettingsEmbeddedToolbar
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search sub categories..."
        actions={
          <Button variant="primary" type="button" onClick={onOpenNewSubcategoryModal}>
            New SubCategory
          </Button>
        }
      />
    ) : (
      <PageHeader
        title=""
        buttons={
          <Button variant="primary" type="button" onClick={onOpenNewSubcategoryModal}>
            New SubCategory
          </Button>
        }
      />
    )}

    <GenericTable<SubCategoryRow>
      data={data}
      columns={columns}
      loading={loading}
      actions={actions}
      showActions={actions.length > 0}
      actionsLabel="Actions"
      pagination={{
        currentPage,
        rowsPerPage,
        totalRows,
        pageSizeOptions: [15, 25, 50, 100],
      }}
      onPaginationChange={onPaginationChange}
      sortable={true}
      hover={true}
      emptyMessage="No sub categories found."
      showToolbar={!embeddedInMainSettings}
      toolbar={
        embeddedInMainSettings
          ? undefined
          : {
              showSearch: true,
              searchValue,
              searchPlaceholder: "Search sub categories...",
              onSearchChange,
            }
      }
      showToolbarActions={false}
      uniqueKey="id"
    />

    <FormModal
      show={showSubmoduleChildrenModal}
      onHide={onCloseSubCategoryModal}
      title="Add SubCategory"
      desc="Please fill in the details below to add a new subcategory."
      submitButtonText="Add SubCategory"
      isSubmitDisabled={!newChildName}
      cancelButtonText="Close"
      onSubmit={onSubmitCreateSubCategory}
      onCancel={onCloseSubCategoryModal}
      formHtml={
        <div className="row">
          <div className="col-md-12">
            <div className="form-group mb-3">
              <label htmlFor="module">Module</label>
              <select
                className="form-control"
                id="module"
                value={newChildModuleId}
                onChange={(e) => onModuleChange(e.target.value)}
              >
                <option value="">Select Module</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group mb-3">
              <label htmlFor="submodule">Category</label>
              <select
                className="form-control"
                id="submodule"
                value={newChildSubmoduleId}
                onChange={(e) => onSubmoduleChange(e.target.value)}
              >
                <option value="">Select Category</option>
                {submodules?.length > 0 &&
                  submodules.map((submodule) => (
                    <option key={submodule.id} value={submodule.id}>
                      {submodule.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group mb-3">
              <label htmlFor="childName">SubCategory Name *</label>
              <input
                type="text"
                className="form-control"
                id="childName"
                value={newChildName}
                onChange={(e) => onNewChildNameChange(e.target.value)}
                placeholder="Enter child name"
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="childDescription">Description</label>
              <textarea
                className="form-control"
                id="childDescription"
                value={newChildDescription}
                onChange={(e) => onNewChildDescriptionChange(e.target.value)}
                placeholder="Enter description (optional)"
                rows={3}
              />
            </div>
          </div>
        </div>
      }
    />

    <ConfirmModal
      show={showDeleteModal}
      onHide={onCloseDeleteModal}
      title="Delete SubCategory"
      description="Are you sure you want to delete this subcategory? This action cannot be undone."
      targetName=""
      confirmButtonText="Delete"
      cancelButtonText="Cancel"
      onConfirm={onConfirmDelete}
      onCancel={onCloseDeleteModal}
    />
  </div>
);
