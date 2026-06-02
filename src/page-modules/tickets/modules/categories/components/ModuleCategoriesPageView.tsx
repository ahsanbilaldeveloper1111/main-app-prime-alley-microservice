import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { type TableAction, type TableColumn } from "@components/GenericTable";
import FormModal from "@components/page-partials/FormModal";
import ConfirmModal from "@components/page-partials/ConfirmModal";
import PageHeader from "@components/PageHeader";
import { TicketsSettingsEmbeddedToolbar } from "@page-modules/tickets/shared/TicketsSettingsEmbeddedToolbar";
import React from "react";
import { Button } from "react-bootstrap";
import { Info } from "lucide-react";
import type { TicketModulePickerRow, TicketSubmoduleRow } from "../moduleCategoriesTypes";

export type ModuleCategoriesPageViewProps = Readonly<{
  showBreadcrumb?: boolean;
  embeddedInMainSettings?: boolean;
  breadcrumbMainLink?: string;
  data: TicketSubmoduleRow[];
  loading: boolean;
  columns: TableColumn<TicketSubmoduleRow>[];
  actions: TableAction<TicketSubmoduleRow>[];
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onPaginationChange: (page: number, perPage: number) => void;
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
  <div className={embeddedInMainSettings ? "tickets-settings-page" : undefined}>
    {showBreadcrumb ? (
      <BreadcrumbItem mainTitle="Tickets" mainLink={breadcrumbMainLink} subTitle="Categories" />
    ) : null}

    {embeddedInMainSettings ? (
      <TicketsSettingsEmbeddedToolbar
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search categories..."
        actions={
          <Button variant="primary" onClick={onOpenCreateModal} type="button">
            New Category
          </Button>
        }
      />
    ) : (
      <PageHeader
        title=""
        buttons={
          <Button variant="primary" onClick={onOpenCreateModal} type="button">
            New Category
          </Button>
        }
      />
    )}

    <GenericTable<TicketSubmoduleRow>
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
      emptyMessage="No categories found."
      showToolbar={!embeddedInMainSettings}
      toolbar={
        embeddedInMainSettings
          ? undefined
          : {
              showSearch: true,
              searchValue,
              searchPlaceholder: "Search categories...",
              onSearchChange,
            }
      }
      showToolbarActions={false}
      uniqueKey="id"
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
              placeholder="Enter category name"
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
      title="Delete Category"
      description="Are you sure you want to delete this category? This action cannot be undone."
      targetName=""
      confirmButtonText="Delete"
      cancelButtonText="Cancel"
      onConfirm={onConfirmDelete}
      onCancel={onCloseDeleteModal}
    />
  </div>
);
