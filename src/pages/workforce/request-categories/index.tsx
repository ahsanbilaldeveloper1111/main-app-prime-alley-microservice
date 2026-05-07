import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useEffect, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import { Button, Modal, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createUserRequestCategory,
  updateUserRequestCategory,
  deleteUserRequestCategory,
  createUserRequestCategoryField,
  updateUserRequestCategoryField,
  deleteUserRequestCategoryField,
  reorderUserRequestCategoryFields,
  type UserRequestCategory,
  type UserRequestCategoryPayload,
  type UserRequestCategoryField,
  type UserRequestCategoryFieldPayload,
  type FieldsReorderItem,
} from "@utils/staffManagement";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import { Pencil, Trash2, List, Plus, ChevronUp, ChevronDown, FolderTree } from "lucide-react";
import GenericTable from "@components/GenericTable";
import CategoryEditSidebar, {
  CategorySidebarField,
  CategorySidebarLabel,
  CategorySidebarSelect,
  CategorySidebarTextArea,
  CategorySidebarTextInput,
} from "@components/CategoryEditSidebar";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { workforceKeys } from "../../../query/keys";

import {
  MANAGE_REQUEST_CATEGORIES_PERMISSION,
  categoryModalTitle,
  categorySaveButtonLabel,
  consumeHandledApiError,
  defaultCategoryForm,
  emptyFieldForm,
  fieldPayloadFromExisting,
  formatDescriptionPreview,
  formatTrackingLabel,
  getCategoryFormSubmitValidationError,
  isCategoryFormReadyForSubmit,
  getFieldFormSubmitValidationError,
  normalizeWorkflowLevelsForPayload,
  requestCategoryFieldTypeLabel,
  slugifyForKey,
  type CategoryFormState,
} from "./requestCategoriesDomain";
import {
  useRequestCategoriesListQuery,
  useRequestCategoryChildrenQuery,
  useRequestCategoryFieldsQuery,
} from "./useRequestCategoriesQueries";
import { SubCategoryWorkflowForm } from "./partials/RequestCategoriesWorkflowForm";
import RequestCategoryFieldModal from "./partials/RequestCategoryFieldModal";

import "./requestCategoriesPage.scss";

const RequestCategories = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { mainAppUsers, companyIdentifier } = useMainAppLookups();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    setPage(1);
  }, [searchValue]);

  const listQuery = useRequestCategoriesListQuery({
    companyIdentifier,
    page,
    limit,
    search: searchValue,
  });

  const categories = listQuery.data?.data ?? [];
  const pagination = listQuery.data?.pagination ?? null;
  const loading = listQuery.isFetching;

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<UserRequestCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(defaultCategoryForm);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<UserRequestCategory | null>(null);

  const [showFieldsModal, setShowFieldsModal] = useState(false);
  const [fieldsCategoryId, setFieldsCategoryId] = useState<number | null>(null);
  const [fieldsCategoryName, setFieldsCategoryName] = useState("");

  const fieldsQuery = useRequestCategoryFieldsQuery(
    fieldsCategoryId,
    showFieldsModal,
    companyIdentifier,
  );
  const fields = fieldsQuery.data ?? [];
  const loadingFields = fieldsQuery.isPending && showFieldsModal;

  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<UserRequestCategoryField | null>(null);
  const [fieldForm, setFieldForm] = useState<UserRequestCategoryFieldPayload>(emptyFieldForm(0));
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [autoGenerateKey, setAutoGenerateKey] = useState(true);

  const [showChildrenModal, setShowChildrenModal] = useState(false);
  const [categoryForChildren, setCategoryForChildren] = useState<UserRequestCategory | null>(null);

  const childrenQuery = useRequestCategoryChildrenQuery(
    categoryForChildren?.id ?? null,
    showChildrenModal,
    companyIdentifier,
  );
  const childrenList = childrenQuery.data ?? [];
  const loadingChildren = childrenQuery.isPending && showChildrenModal;

  const [showDeleteFieldModal, setShowDeleteFieldModal] = useState(false);
  const [fieldPendingDelete, setFieldPendingDelete] = useState<UserRequestCategoryField | null>(
    null,
  );

  const saveCategoryMutation = useMutation({
    mutationFn: async ({
      editing,
      payload,
    }: {
      editing: UserRequestCategory | null;
      payload: UserRequestCategoryPayload;
    }) => {
      if (editing) return updateUserRequestCategory(editing.id, payload);
      return createUserRequestCategory(payload);
    },
    onSuccess: (_, vars) => {
      toast.success(vars.editing ? "Category updated" : "Category created");
      void queryClient.invalidateQueries({ queryKey: workforceKeys.requestCategories.all() });
    },
    onError: (e: unknown) => consumeHandledApiError(e, "RequestCategories.handleSaveCategory"),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => deleteUserRequestCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workforceKeys.requestCategories.all() });
    },
    onError: (e: unknown) => consumeHandledApiError(e, "RequestCategories.handleDeleteCategory"),
  });

  const saveFieldMutation = useMutation({
    mutationFn: async ({
      categoryId,
      editing,
      body,
    }: {
      categoryId: number;
      editing: UserRequestCategoryField | null;
      body: UserRequestCategoryFieldPayload;
    }) => {
      if (editing) return updateUserRequestCategoryField(categoryId, editing.id, body);
      return createUserRequestCategoryField(categoryId, body);
    },
    onSuccess: (_, vars) => {
      toast.success(vars.editing ? "Field updated" : "Field added");
      void queryClient.invalidateQueries({
        queryKey: workforceKeys.requestCategories.fields(vars.categoryId),
      });
    },
    onError: (e: unknown) => consumeHandledApiError(e, "RequestCategories.handleSaveField"),
  });

  const deleteFieldMutation = useMutation({
    mutationFn: ({ categoryId, fieldId }: { categoryId: number; fieldId: number }) =>
      deleteUserRequestCategoryField(categoryId, fieldId),
    onSuccess: (_, vars) => {
      toast.success("Field deleted");
      void queryClient.invalidateQueries({
        queryKey: workforceKeys.requestCategories.fields(vars.categoryId),
      });
    },
    onError: (e: unknown) =>
      consumeHandledApiError(e, "RequestCategories.handleConfirmDeleteField"),
  });

  const reorderFieldsMutation = useMutation({
    mutationFn: ({ categoryId, order }: { categoryId: number; order: FieldsReorderItem[] }) =>
      reorderUserRequestCategoryFields(categoryId, order),
    onSuccess: (_, vars) => {
      toast.success("Order updated");
      void queryClient.invalidateQueries({
        queryKey: workforceKeys.requestCategories.fields(vars.categoryId),
      });
    },
    onError: (e: unknown) => consumeHandledApiError(e, "RequestCategories.moveField"),
  });

  const openChildrenModal = (cat: UserRequestCategory) => {
    setCategoryForChildren(cat);
    setShowChildrenModal(true);
  };

  const openAddChildCategory = (parentCat: UserRequestCategory) => {
    setEditingCategory(null);
    setCategoryForm({ ...defaultCategoryForm, parent_id: parentCat.id });
    setShowCategoryModal(true);
    setShowChildrenModal(false);
  };

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ ...defaultCategoryForm });
    setShowCategoryModal(true);
  };

  const openEditCategory = useCallback((cat: UserRequestCategory) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name ?? "",
      code: cat.code ?? "",
      description: cat.description ?? "",
      is_active: cat.is_active !== false,
      parent_id: cat.parent_id ?? undefined,
      sort_order: cat.sort_order ?? 0,
      tracking_enabled: cat.tracking_enabled ?? false,
      tracking_code_prefix: cat.tracking_code_prefix ?? "",
      workflow_levels: Array.isArray(cat.workflow_levels) ? cat.workflow_levels : [],
    });
    setShowCategoryModal(true);
  }, []);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = getCategoryFormSubmitValidationError(categoryForm);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const trimmedName = categoryForm.name?.trim() ?? "";
    const payload: UserRequestCategoryPayload = {
      name: trimmedName,
      code: categoryForm.code?.trim() || undefined,
      description: categoryForm.description?.trim() || undefined,
      is_active: categoryForm.is_active,
      parent_id: categoryForm.parent_id ?? null,
      sort_order: categoryForm.sort_order ?? 0,
      tracking_enabled: categoryForm.tracking_enabled ?? false,
      tracking_code_prefix: (categoryForm.tracking_code_prefix ?? "").slice(0, 50) || undefined,
      workflow_levels: normalizeWorkflowLevelsForPayload(categoryForm.workflow_levels),
    };
    try {
      await saveCategoryMutation.mutateAsync({ editing: editingCategory, payload });
      setShowCategoryModal(false);
      setShowChildrenModal(false);
    } catch {
      /* toast handled by mutation */
    }
  };

  const openDeleteCategory = (cat: UserRequestCategory) => {
    setCategoryToDelete(cat);
    setShowDeleteModal(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategoryMutation.mutateAsync(categoryToDelete.id);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch {
      /* handled */
    }
  };

  const openFieldsModal = (cat: UserRequestCategory) => {
    setFieldsCategoryId(cat.id);
    setFieldsCategoryName(cat.name ?? "");
    setShowFieldsModal(true);
  };

  const closeFieldsModal = () => {
    setShowFieldsModal(false);
    setFieldsCategoryId(null);
    setFieldsCategoryName("");
    setShowFieldModal(false);
    setShowDeleteFieldModal(false);
    setFieldPendingDelete(null);
  };

  const openAddField = () => {
    setEditingField(null);
    setAutoGenerateKey(true);
    setFieldForm(emptyFieldForm(fields.length));
    setShowFieldModal(true);
  };

  const openEditField = (f: UserRequestCategoryField) => {
    setEditingField(f);
    setAutoGenerateKey(false);
    setShowAdvanced(true);
    setFieldForm(fieldPayloadFromExisting(f));
    setShowFieldModal(true);
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldsCategoryId) return;
    const validationError = getFieldFormSubmitValidationError(fieldForm);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const trimmedLabel = fieldForm.label?.trim() ?? "";
    const generatedKey = slugifyForKey(trimmedLabel);
    const payloadForSave: UserRequestCategoryFieldPayload = {
      ...fieldForm,
      label: trimmedLabel,
      key: fieldForm.key?.trim() || generatedKey,
    };
    try {
      await saveFieldMutation.mutateAsync({
        categoryId: fieldsCategoryId,
        editing: editingField,
        body: payloadForSave,
      });
      setShowFieldModal(false);
    } catch {
      /* handled */
    }
  };

  const openDeleteFieldModal = (f: UserRequestCategoryField) => {
    setFieldPendingDelete(f);
    setShowDeleteFieldModal(true);
  };

  const handleConfirmDeleteField = async () => {
    if (!fieldsCategoryId || !fieldPendingDelete) return;
    try {
      await deleteFieldMutation.mutateAsync({
        categoryId: fieldsCategoryId,
        fieldId: fieldPendingDelete.id,
      });
      setShowDeleteFieldModal(false);
      setFieldPendingDelete(null);
    } catch {
      /* handled */
    }
  };

  const moveField = async (index: number, direction: "up" | "down") => {
    if (!fieldsCategoryId || fields.length < 2) return;
    const newFields = [...fields];
    const swap = direction === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= newFields.length) return;
    [newFields[index], newFields[swap]] = [newFields[swap], newFields[index]];
    const order: FieldsReorderItem[] = newFields.map((f, i) => ({ id: f.id, sort_order: i }));
    try {
      await reorderFieldsMutation.mutateAsync({ categoryId: fieldsCategoryId, order });
    } catch {
      /* handled */
    }
  };

  const reordering = reorderFieldsMutation.isPending;

  let childrenModalMain: React.ReactNode;
  if (loadingChildren) {
    childrenModalMain = <p className="text-muted mb-0">Loading sub-categories…</p>;
  } else if (childrenList.length === 0) {
    childrenModalMain = (
      <p className="text-muted mb-0">
        No sub-categories yet. Click &quot;Add sub-category&quot; to create one.
      </p>
    );
  } else {
    childrenModalMain = (
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
            render: (row) => (
              <span className={`gt-badge gt-badge-${row.is_active === false ? "secondary" : "success"}`}>
                {row.is_active === false ? "Inactive" : "Active"}
              </span>
            ),
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
  }

  let fieldsModalMain: React.ReactNode;
  if (loadingFields) {
    fieldsModalMain = <p className="text-muted mb-0">Loading fields…</p>;
  } else if (fields.length === 0) {
    fieldsModalMain = (
      <p className="text-muted mb-0">No fields yet. Add one to define the request form.</p>
    );
  } else {
    fieldsModalMain = (
      <GenericTable<UserRequestCategoryField>
        data={fields}
        columns={[
          {
            key: "_order",
            label: "",
            sortable: false,
            render: (_row, index) => (
              <div className="d-flex align-items-center gap-1">
                <button
                  type="button"
                  className="request-categories-page__field-reorder-btn"
                  onClick={() => moveField(index, "up")}
                  disabled={reordering}
                  aria-label="Move up"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  className="request-categories-page__field-reorder-btn"
                  onClick={() => moveField(index, "down")}
                  disabled={reordering}
                  aria-label="Move down"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
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
  }

  const canManage = session?.user?.permissions?.includes(MANAGE_REQUEST_CATEGORIES_PERMISSION) ?? false;

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
        columns={[
          {
            key: "name",
            label: "Name",
            type: "text",
            emptyValue: "—",
          },

          {
            key: "description",
            label: "Description",
            render: (row) => <span>{formatDescriptionPreview(row.description)}</span>,
          },
          {
            key: "tracking_enabled",
            label: "Tracking",
            render: (row) => <span>{formatTrackingLabel(row)}</span>,
          },
          {
            key: "code_prefix",
            label: "Code Prefix",
            render: (row) => <span>{row.tracking_code_prefix ?? "—"}</span>,
          },
          {
            key: "is_active",
            label: "Active",
            render: (row) => (
              <span className={`gt-badge gt-badge-${row.is_active === false ? "secondary" : "success"}`}>
                {row.is_active === false ? "Inactive" : "Active"}
              </span>
            ),
          },
        ]}
        actions={[
          {
            label: "Edit",
            icon: <Pencil size={14} />,
            onClick: openEditCategory,
            variant: "outline-secondary",
            show: () => canManage,
          },
          {
            label: "Sub-categories",
            icon: <FolderTree size={14} />,
            onClick: openChildrenModal,
            variant: "outline-secondary",
            show: () => canManage,
          },
          {
            label: "Delete",
            icon: <Trash2 size={14} />,
            onClick: openDeleteCategory,
            variant: "outline-danger",
            show: () => canManage,
          },
        ]}
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
        savingCategory={saveCategoryMutation.isPending}
        submitDisabled={
          saveCategoryMutation.isPending || !isCategoryFormReadyForSubmit(categoryForm)
        }
        submitLabel={categorySaveButtonLabel(saveCategoryMutation.isPending, editingCategory)}
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
          <CategorySidebarLabel htmlFor="category-description">Description (optional)</CategorySidebarLabel>
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

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          if (deleteCategoryMutation.isPending) return;
          setShowDeleteModal(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleDeleteCategory}
        itemName={categoryToDelete?.name?.trim() || undefined}
        itemType="category"
        loading={deleteCategoryMutation.isPending}
      />
      <DeleteConfirmationModal
        show={showDeleteFieldModal}
        onHide={() => {
          if (deleteFieldMutation.isPending) return;
          setShowDeleteFieldModal(false);
          setFieldPendingDelete(null);
        }}
        onConfirm={handleConfirmDeleteField}
        itemName={
          fieldPendingDelete
            ? (fieldPendingDelete.label ?? fieldPendingDelete.key ?? "").trim() || undefined
            : undefined
        }
        itemType="field"
        loading={deleteFieldMutation.isPending}
      />

      <Modal show={showChildrenModal} onHide={() => setShowChildrenModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{categoryForChildren?.name ?? "—"} Sub-categories</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-muted">Sub-categories under this category. Add or edit below.</span>
            {categoryForChildren && (
              <Button variant="primary" size="sm" onClick={() => openAddChildCategory(categoryForChildren)}>
                <Plus size={16} className="me-1" />
                Add Sub Category
              </Button>
            )}
          </div>
          {childrenModalMain}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowChildrenModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showFieldsModal} onHide={closeFieldsModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Fields: {fieldsCategoryName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-muted">Define form fields for this request category.</span>
            <Button variant="primary" size="sm" onClick={openAddField}>
              <Plus size={16} className="me-1" />
              Add Field
            </Button>
          </div>
          {fieldsModalMain}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeFieldsModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <RequestCategoryFieldModal
        show={showFieldModal}
        onHide={() => setShowFieldModal(false)}
        editingField={editingField}
        siblingFields={fields}
        fieldForm={fieldForm}
        setFieldForm={setFieldForm}
        savingField={saveFieldMutation.isPending}
        showAdvanced={showAdvanced}
        setShowAdvanced={setShowAdvanced}
        autoGenerateKey={autoGenerateKey}
        onSubmit={handleSaveField}
      />
    </div>
  );
};

RequestCategories.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default RequestCategories;
