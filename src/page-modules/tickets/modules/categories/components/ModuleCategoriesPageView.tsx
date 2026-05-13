import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";
import type { Column } from "@components/CustomDataTable";
import FormModal from "@components/page-partials/FormModal";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import PageHeader from "@components/PageHeader";
import React from "react";
import { Button } from "react-bootstrap";
import { Info } from "lucide-react";
import type { GenericListPageQueryParams, GenericListPageQueryOptions } from "@components/GenericListPage";
import type { TicketModulePickerRow } from "../moduleCategoriesTypes";

export type ModuleCategoriesPageViewProps = Readonly<{
  memoizedFilters: { search: string };
  columns: Column[];
  getListQueryOptions: (params: GenericListPageQueryParams) => GenericListPageQueryOptions;
  showCreateModal: boolean;
  onCloseCreateModal: () => void;
  onOpenCreateModal: () => void;
  newSubmoduleName: string;
  onNewSubmoduleNameChange: (v: string) => void;
  newSubmoduleDescription: string;
  onNewSubmoduleDescriptionChange: (v: string) => void;
  newSubmoduleModuleId: string;
  onNewSubmoduleModuleIdChange: (v: string) => void;
  modules: TicketModulePickerRow[];
  onSubmitCreateCategory: () => void;
  showDeleteModal: boolean;
  onCloseDeleteModal: () => void;
  onConfirmDelete: () => void;
}>;

export const ModuleCategoriesPageView: React.FC<ModuleCategoriesPageViewProps> = ({
  memoizedFilters,
  columns,
  getListQueryOptions,
  showCreateModal,
  onCloseCreateModal,
  onOpenCreateModal,
  newSubmoduleName,
  onNewSubmoduleNameChange,
  newSubmoduleDescription,
  onNewSubmoduleDescriptionChange,
  newSubmoduleModuleId,
  onNewSubmoduleModuleIdChange,
  modules,
  onSubmitCreateCategory,
  showDeleteModal,
  onCloseDeleteModal,
  onConfirmDelete,
}) => (
  <React.Fragment>
    <BreadcrumbItem mainTitle="Tickets" mainLink="/tickets/modules" subTitle="Submodules" />

      <PageHeader
        title=""
        buttons={
          <Button variant="primary" onClick={onOpenCreateModal} type="button">
            New Category
          </Button>
        }
      />

      <GenericListPage
        columns={columns}
        getListQueryOptions={getListQueryOptions}
        title="Submodules"
        searchPlaceholder="Search submodules..."
        defaultPageSize={15}
        filters={memoizedFilters}
        search={true}
        tableStyle="table-style-2"
      />

      <FormModal
        show={showCreateModal}
        onHide={onCloseCreateModal}
        title="Create New Category"
        desc="Please fill in the details below to create a new category."
        submitButtonText="Create Category"
        isSubmitDisabled={!newSubmoduleName || !newSubmoduleModuleId}
        cancelButtonText="Cancel"
        onSubmit={onSubmitCreateCategory}
        onCancel={onCloseCreateModal}
        formHtml={
          <>
            <div className="form-group mb-3">
              <label
                htmlFor="submoduleName"
                className="fw-semibold d-flex align-items-center gap-2 form-label"
              >
                Category Name <span className="text-danger">*</span>
                <span className="text-muted" title="Enter the name of the category">
                  <Info size={14} />
                </span>
              </label>
              <input
                type="text"
                className="form-control"
                id="submoduleName"
                value={newSubmoduleName}
                onChange={(e) => onNewSubmoduleNameChange(e.target.value)}
                placeholder="Enter submodule name"
              />
            </div>

            <div className="form-group mb-3">
              <label
                htmlFor="submoduleDescription"
                className="fw-semibold d-flex align-items-center gap-2 form-label"
              >
                Description{" "}
                <span className="text-muted" title="Description">
                  <Info size={14} />
                </span>
              </label>
              <textarea
                className="form-control"
                id="submoduleDescription"
                value={newSubmoduleDescription}
                onChange={(e) => onNewSubmoduleDescriptionChange(e.target.value)}
                placeholder="Enter description (optional)"
                rows={3}
              />
            </div>

            <div className="form-group mb-3">
              <label
                htmlFor="submoduleModule"
                className="fw-semibold d-flex align-items-center gap-2 form-label"
              >
                Module <span className="text-danger">*</span>
                <span className="text-muted" title="Select module">
                  <Info size={14} />
                </span>
              </label>
              <select
                className="form-control"
                id="submoduleModule"
                value={newSubmoduleModuleId}
                onChange={(e) => onNewSubmoduleModuleIdChange(e.target.value)}
              >
                <option value="">Select Module</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        }
      />

      <ConfirmModal
        show={showDeleteModal}
        onHide={onCloseDeleteModal}
        title="Delete Submodule"
        description="Are you sure you want to delete this submodule? This action cannot be undone."
        targetName=""
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        onConfirm={onConfirmDelete}
        onCancel={onCloseDeleteModal}
      />
  </React.Fragment>
);
