import BreadcrumbItem from "@common/BreadcrumbItem";
import CategoryEditSidebar, {
  CategorySidebarField,
  CategorySidebarLabel,
  CategorySidebarSelect,
  CategorySidebarTextArea,
  CategorySidebarTextInput,
} from "@components/CategoryEditSidebar";
import GenericTable from "@components/GenericTable";
import PageHeader from "@components/PageHeader";
import {
  categoryModalTitle,
  categorySaveButtonLabel,
  formatDescriptionPreview,
  formatTrackingLabel,
  isCategoryFormReadyForSubmit,
  requestCategoryFieldTypeLabel,
  type CategoryFormState,
} from "@page-modules/workforce/request-categories/requestCategoriesDomain";
import RequestCategoryFieldModal from "@page-modules/workforce/request-categories/partials/RequestCategoryFieldModal";
import { SubCategoryWorkflowForm } from "@page-modules/workforce/request-categories/partials/RequestCategoriesWorkflowForm";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import type { UserRequestCategory, UserRequestCategoryField } from "@utils/staffManagement";
import { ChevronDown, ChevronUp, FolderTree, List, Pencil, Plus, Trash2 } from "lucide-react";
import React, { useMemo, type ReactNode } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { useRequestCategoriesPage } from "../useRequestCategoriesPage";

function CategoryActiveStatusBadge({ row }: Readonly<{ row: UserRequestCategory }>) {
  return (
    <span className={`gt-badge gt-badge-${row.is_active === false ? "secondary" : "success"}`}>
      {row.is_active === false ? "Inactive" : "Active"}
    </span>
  );
}

function FieldReorderButtons({
  index,
  reordering,
  onMove,
}: Readonly<{
  index: number;
  reordering: boolean;
  onMove: (i: number, direction: "up" | "down") => void;
}>) {
  return (
    <div className="d-flex align-items-center gap-1">
      <button
        type="button"
        className="request-categories-page__field-reorder-btn"
        onClick={() => onMove(index, "up")}
        disabled={reordering}
        aria-label="Move up"
      >
        <ChevronUp size={16} />
      </button>
      <button
        type="button"
        className="request-categories-page__field-reorder-btn"
        onClick={() => onMove(index, "down")}
        disabled={reordering}
        aria-label="Move down"
      >
        <ChevronDown size={16} />
      </button>
    </div>
  );
}

function ManagedDeleteConfirmationModal({
  show,
  pending,
  itemName,
  itemType,
  onConfirm,
  onReset,
}: Readonly<{
  show: boolean;
  pending: boolean;
  itemName: string | undefined;
  itemType: "category" | "field";
  onConfirm: () => void | Promise<void>;
  onReset: () => void;
}>) {
  return (
    <DeleteConfirmationModal
      show={show}
      onHide={() => {
        if (pending) return;
        onReset();
      }}
      onConfirm={onConfirm}
      itemName={itemName}
      itemType={itemType}
      loading={pending}
    />
  );
}

function RequestCategoriesLargeModal({
  show,
  onHide,
  title,
  toolbarHint,
  toolbarAction,
  bodyContent,
}: Readonly<{
  show: boolean;
  onHide: () => void;
  title: ReactNode;
  toolbarHint: ReactNode;
  toolbarAction?: ReactNode;
  bodyContent: ReactNode;
}>) {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="text-muted">{toolbarHint}</span>
          {toolbarAction}
        </div>
        {bodyContent}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export function RequestCategoriesPageView() {
  const ctx = useRequestCategoriesPage();

  const {
    mainAppUsers,
    categories,
    loading,
    pagination,
    setPage,
    setLimit,
    searchValue,
    setSearchValue,
    canManage,
    showCategoryModal,
    setShowCategoryModal,
    editingCategory,
    categoryForm,
    setCategoryForm,
    handleSaveCategory,
    saveCategoryPending,
    openCreateCategory,
    openEditCategory,
    showDeleteModal,
    setShowDeleteModal,
    categoryToDelete,
    setCategoryToDelete,
    handleDeleteCategory,
    deleteCategoryPending,
    showChildrenModal,
    setShowChildrenModal,
    categoryForChildren,
    childrenList,
    loadingChildren,
    openAddChildCategory,
    showFieldsModal,
    closeFieldsModal,
    fieldsCategoryName,
    fields,
    loadingFields,
    openFieldsModal,
    openChildrenModal,
    openAddField,
    openEditField,
    moveField,
    reordering,
    showFieldModal,
    setShowFieldModal,
    editingField,
    fieldForm,
    setFieldForm,
    handleSaveField,
    saveFieldPending,
    showAdvanced,
    setShowAdvanced,
    autoGenerateKey,
    showDeleteFieldModal,
    setShowDeleteFieldModal,
    fieldPendingDelete,
    setFieldPendingDelete,
    handleConfirmDeleteField,
    deleteFieldPending,
    openDeleteCategory,
    openDeleteFieldModal,
  } = ctx;

  const mainTableColumns = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        type: "text" as const,
        emptyValue: "—",
      },
      {
        key: "description",
        label: "Description",
        render: (row: UserRequestCategory) => (
          <span>{formatDescriptionPreview(row.description)}</span>
        ),
      },
      {
        key: "tracking_enabled",
        label: "Tracking",
        render: (row: UserRequestCategory) => <span>{formatTrackingLabel(row)}</span>,
      },
      {
        key: "code_prefix",
        label: "Code Prefix",
        render: (row: UserRequestCategory) => <span>{row.tracking_code_prefix ?? "—"}</span>,
      },
      {
        key: "is_active",
        label: "Active",
        render: (row: UserRequestCategory) => <CategoryActiveStatusBadge row={row} />,
      },
    ],
    [],
  );

  const mainTableActions = useMemo(
    () => [
      {
        label: "Edit",
        icon: <Pencil size={14} />,
        onClick: openEditCategory,
        variant: "outline-secondary" as const,
        show: () => canManage,
      },
      {
        label: "Sub-categories",
        icon: <FolderTree size={14} />,
        onClick: openChildrenModal,
        variant: "outline-secondary" as const,
        show: () => canManage,
      },
      {
        label: "Delete",
        icon: <Trash2 size={14} />,
        onClick: openDeleteCategory,
        variant: "outline-danger" as const,
        show: () => canManage,
      },
    ],
    [canManage, openChildrenModal, openDeleteCategory, openEditCategory],
  );

  const childrenModalMain = useMemo(() => {
    if (loadingChildren) {
      return <p className="text-muted mb-0">Loading sub-categories…</p>;
    }
    if (childrenList.length === 0) {
      return (
        <p className="text-muted mb-0">
          No sub-categories yet. Click &quot;Add sub-category&quot; to create one.
        </p>
      );
    }
    return (
      <GenericTable<UserRequestCategory>
        data={childrenList}
        columns={[
          {
            key: "name",
            label: "Name",
            type: "text",
            emptyValue: "—",
          },
          {
            key: "tracking_enabled",
            label: "Tracking",
            render: (row) => <span>{formatTrackingLabel(row)}</span>,
          },
          {
            key: "is_active",
            label: "Active",
            render: (row) => <CategoryActiveStatusBadge row={row} />,
          },
        ]}
        actions={[
          {
            label: "Edit",
            icon: <Pencil size={14} />,
            onClick: (child) => {
              setShowChildrenModal(false);
              openEditCategory(child);
            },
            variant: "outline-secondary",
          },
          {
            label: "Manage fields",
            icon: <List size={14} />,
            onClick: (child) => {
              setShowChildrenModal(false);
              openFieldsModal(child);
            },
            variant: "outline-secondary",
          },
          {
            label: "Delete",
            icon: <Trash2 size={14} />,
            onClick: openDeleteCategory,
            variant: "outline-danger",
          },
        ]}
        showActions
        uniqueKey="id"
        showToolbarActions={false}
        noBorder
      />
    );
  }, [
    childrenList,
    loadingChildren,
    openDeleteCategory,
    openEditCategory,
    openFieldsModal,
    setShowChildrenModal,
  ]);

  const fieldsModalMain = useMemo(() => {
    if (loadingFields) {
      return <p className="text-muted mb-0">Loading fields…</p>;
    }
    if (fields.length === 0) {
      return (
        <p className="text-muted mb-0">No fields yet. Add one to define the request form.</p>
      );
    }
    return (
      <GenericTable<UserRequestCategoryField>
        data={fields}
        columns={[
          {
            key: "_order",
            label: "",
            sortable: false,
            render: (_row, index) => (
              <FieldReorderButtons index={index} reordering={reordering} onMove={moveField} />
            ),
          },
          { key: "label", label: "Label", type: "text" },
          {
            key: "type",
            label: "Type",
            render: (row) => <span>{requestCategoryFieldTypeLabel(row.type)}</span>,
          },
          {
            key: "required",
            label: "Required",
            render: (row) => <span>{row.required ? "Yes" : "No"}</span>,
          },
          {
            key: "is_active",
            label: "Active",
            render: (row) => <span>{row.is_active === false ? "No" : "Yes"}</span>,
          },
        ]}
        actions={[
          {
            label: "Edit",
            icon: <Pencil size={14} />,
            onClick: openEditField,
            variant: "outline-secondary",
          },
          {
            label: "Delete",
            icon: <Trash2 size={14} />,
            onClick: openDeleteFieldModal,
            variant: "outline-danger",
          },
        ]}
        showActions
        uniqueKey="id"
        showToolbarActions={false}
        noBorder
      />
    );
  }, [fields, loadingFields, moveField, openDeleteFieldModal, openEditField, reordering]);

  return (
    <div className="request-categories-page">
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Request Categories" />
      <PageHeader
        title=""
        showSearch={true}
        searchPlaceholder="Search categories..."
        searchValue={searchValue}
        onSearchChange={(value) => setSearchValue(value)}
        buttons={
          <>
            {canManage && (
              <Button variant="primary" onClick={openCreateCategory}>
                <Plus size={18} className="me-1" />
                Add Category
              </Button>
            )}
          </>
        }
      />

      <GenericTable<UserRequestCategory>
        data={categories}
        columns={mainTableColumns}
        actions={mainTableActions}
        showActions
        loading={loading}
        emptyMessage="No request categories yet. Create one to get started."
        pagination={
          pagination
            ? {
                currentPage: pagination.page,
                rowsPerPage: pagination.limit,
                totalRows: pagination.total,
              }
            : undefined
        }
        onPaginationChange={(p, rowsPerPage) => {
          setPage(p);
          setLimit(rowsPerPage);
        }}
        uniqueKey="id"
        showToolbarActions={false}
      />

      <CategoryEditSidebar
        isOpen={showCategoryModal}
        title={categoryModalTitle(editingCategory, categoryForm.parent_id)}
        onClose={() => setShowCategoryModal(false)}
        onSubmit={handleSaveCategory}
        savingCategory={saveCategoryPending}
        submitDisabled={saveCategoryPending || !isCategoryFormReadyForSubmit(categoryForm)}
        submitLabel={categorySaveButtonLabel(saveCategoryPending, editingCategory)}
      >
        <CategorySidebarField>
          <CategorySidebarLabel htmlFor="category-name" required>
            Name
          </CategorySidebarLabel>
          <CategorySidebarTextInput
            id="category-name"
            type="text"
            value={categoryForm.name ?? ""}
            onChange={(e) =>
              setCategoryForm((f: CategoryFormState) => ({ ...f, name: e.target.value }))
            }
            required
            placeholder="e.g. Leave Request"
          />
        </CategorySidebarField>

        <CategorySidebarField>
          <CategorySidebarLabel htmlFor="category-status" required>
            Status
          </CategorySidebarLabel>
          <CategorySidebarSelect
            id="category-status"
            value={categoryForm.is_active === false ? "false" : "true"}
            onChange={(e) =>
              setCategoryForm((f: CategoryFormState) => ({
                ...f,
                is_active: e.target.value === "true",
              }))
            }
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </CategorySidebarSelect>
        </CategorySidebarField>

        {categoryForm.parent_id != null && categoryForm.parent_id !== 0 ? (
          <SubCategoryWorkflowForm
            categoryForm={categoryForm}
            setCategoryForm={setCategoryForm}
            mainAppUsers={mainAppUsers}
          />
        ) : null}

        <CategorySidebarField>
          <CategorySidebarLabel htmlFor="category-tracking">Tracking</CategorySidebarLabel>
          <CategorySidebarSelect
            id="category-tracking"
            value={categoryForm.tracking_enabled ? "true" : "false"}
            onChange={(e) =>
              setCategoryForm((f: CategoryFormState) => ({
                ...f,
                tracking_enabled: e.target.value === "true",
              }))
            }
          >
            <option value="false">Disabled</option>
            <option value="true">Enabled</option>
          </CategorySidebarSelect>
        </CategorySidebarField>

        <CategorySidebarField>
          <CategorySidebarLabel htmlFor="category-tracking-prefix">
            Tracking code prefix (optional)
          </CategorySidebarLabel>
          <CategorySidebarTextInput
            id="category-tracking-prefix"
            type="text"
            maxLength={50}
            value={categoryForm.tracking_code_prefix ?? ""}
            onChange={(e) =>
              setCategoryForm((f: CategoryFormState) => ({
                ...f,
                tracking_code_prefix: e.target.value || undefined,
              }))
            }
            placeholder="e.g. REQ"
          />
          <Form.Text className="request-categories-page__tracking-hint">
            Used when tracking is enabled.
          </Form.Text>
        </CategorySidebarField>

        <CategorySidebarField>
          <CategorySidebarLabel htmlFor="category-description">
            Description (optional)
          </CategorySidebarLabel>
          <CategorySidebarTextArea
            id="category-description"
            rows={3}
            value={categoryForm.description ?? ""}
            onChange={(e) =>
              setCategoryForm((f: CategoryFormState) => ({
                ...f,
                description: e.target.value || undefined,
              }))
            }
            placeholder="Optional description"
          />
        </CategorySidebarField>
      </CategoryEditSidebar>

      <ManagedDeleteConfirmationModal
        show={showDeleteModal}
        pending={deleteCategoryPending}
        itemName={categoryToDelete?.name?.trim() || undefined}
        itemType="category"
        onConfirm={handleDeleteCategory}
        onReset={() => {
          setShowDeleteModal(false);
          setCategoryToDelete(null);
        }}
      />
      <ManagedDeleteConfirmationModal
        show={showDeleteFieldModal}
        pending={deleteFieldPending}
        itemName={
          fieldPendingDelete
            ? (fieldPendingDelete.label ?? fieldPendingDelete.key ?? "").trim() || undefined
            : undefined
        }
        itemType="field"
        onConfirm={handleConfirmDeleteField}
        onReset={() => {
          setShowDeleteFieldModal(false);
          setFieldPendingDelete(null);
        }}
      />

      <RequestCategoriesLargeModal
        show={showChildrenModal}
        onHide={() => setShowChildrenModal(false)}
        title={<>{categoryForChildren?.name ?? "—"} Sub-categories</>}
        toolbarHint="Sub-categories under this category. Add or edit below."
        toolbarAction={
          categoryForChildren ? (
            <Button variant="primary" size="sm" onClick={() => openAddChildCategory(categoryForChildren)}>
              <Plus size={16} className="me-1" />
              Add Sub Category
            </Button>
          ) : null
        }
        bodyContent={childrenModalMain}
      />

      <RequestCategoriesLargeModal
        show={showFieldsModal}
        onHide={closeFieldsModal}
        title={<>Fields: {fieldsCategoryName}</>}
        toolbarHint="Define form fields for this request category."
        toolbarAction={
          <Button variant="primary" size="sm" onClick={openAddField}>
            <Plus size={16} className="me-1" />
            Add Field
          </Button>
        }
        bodyContent={fieldsModalMain}
      />

      <RequestCategoryFieldModal
        show={showFieldModal}
        onHide={() => setShowFieldModal(false)}
        editingField={editingField}
        siblingFields={fields}
        fieldForm={fieldForm}
        setFieldForm={setFieldForm}
        savingField={saveFieldPending}
        showAdvanced={showAdvanced}
        setShowAdvanced={setShowAdvanced}
        autoGenerateKey={autoGenerateKey}
        onSubmit={handleSaveField}
      />
    </div>
  );
}
