import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import PageHeader from "@components/PageHeader";
import FormModal from "@components/page-partials/FormModal";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import type { Column } from "@components/CustomDataTable";
import React from "react";
import { Button } from "react-bootstrap";
import type { TicketModulePickerRow, TicketSubmoduleRow } from "../../categories/moduleCategoriesTypes";

export type ModuleSubCategoriesPageViewProps = Readonly<{
  refreshKey: number;
  memoizedFilters: { search: string };
  columns: Column[];
  fetchSubCategories: (page?: number, perPage?: number, search?: string) => Promise<unknown>;
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
  refreshKey,
  memoizedFilters,
  columns,
  fetchSubCategories,
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
  <React.Fragment>
    <BreadcrumbItem mainTitle="Tickets" mainLink="/tickets/modules" subTitle="Submodules" />

    <PageHeader
      title=""
      buttons={
        <Button variant="primary" type="button" onClick={onOpenNewSubcategoryModal}>
          New SubCategory
        </Button>
      }
    />

    <GenericListPage
      columns={columns}
      fetchData={fetchSubCategories}
      title="Submodules"
      searchPlaceholder="Search submodules..."
      defaultPageSize={15}
      filters={memoizedFilters}
      refreshKey={refreshKey}
      search={true}
      tableStyle="table-style-2"
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
  </React.Fragment>
);
