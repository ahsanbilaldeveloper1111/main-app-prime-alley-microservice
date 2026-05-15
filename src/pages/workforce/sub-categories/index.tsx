import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import { Button, Modal } from "react-bootstrap";
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
  type WorkflowLevelPayload,
} from "@utils/staffManagement";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import { Pencil, Trash2, List, Plus, ChevronUp, ChevronDown } from "lucide-react";
import GenericTable from "@components/GenericTable";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import { workforceKeys } from "@query/keys";
import { consumeHandledApiError } from "@page-modules/workforce/request-categories/requestCategoriesDomain";
import {
  useRequestCategoryFieldsQuery,
  useRequestSubCategoriesListQuery,
} from "@page-modules/workforce/request-categories/useRequestCategoriesQueries";
import {
  MANAGE_REQUEST_CATEGORIES_PERMISSION,
  type CategoryFormState,
  defaultCategoryForm,
  emptyFieldForm,
  fieldPayloadFromExisting,
  formatDescriptionCell,
  normalizeWorkflowLevelsForPayload,
} from "@page-modules/workforce/sub-categories/subCategoriesDomain";
import SubCategoriesCategoryModal from "@page-modules/workforce/sub-categories/partials/SubCategoriesCategoryModal";
import SubCategoriesFieldModal from "@page-modules/workforce/sub-categories/partials/SubCategoriesFieldModal";

import "@page-modules/workforce/sub-categories/subCategoriesPage.scss";

function RequestSubCategories() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { mainAppUsers, companyIdentifier } = useMainAppLookups();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const listQuery = useRequestSubCategoriesListQuery({
    companyIdentifier,
    page,
    limit,
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
      queryClient
        .invalidateQueries({ queryKey: workforceKeys.requestCategories.all() })
        .catch((e: unknown) => consumeHandledApiError(e, "SubCategories.invalidateAll"));
    },
    onError: (e: unknown) => consumeHandledApiError(e, "SubCategories.handleSaveCategory"),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => deleteUserRequestCategory(id),
    onSuccess: () => {
      toast.success("Category deleted");
      queryClient
        .invalidateQueries({ queryKey: workforceKeys.requestCategories.all() })
        .catch((e: unknown) => consumeHandledApiError(e, "SubCategories.invalidateAll"));
    },
    onError: (e: unknown) => consumeHandledApiError(e, "SubCategories.handleDeleteCategory"),
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
      queryClient
        .invalidateQueries({
          queryKey: workforceKeys.requestCategories.fields(vars.categoryId),
        })
        .catch((e: unknown) => consumeHandledApiError(e, "SubCategories.invalidateFields"));
    },
    onError: (e: unknown) => consumeHandledApiError(e, "SubCategories.handleSaveField"),
  });

  const deleteFieldMutation = useMutation({
    mutationFn: ({ categoryId, fieldId }: { categoryId: number; fieldId: number }) =>
      deleteUserRequestCategoryField(categoryId, fieldId),
    onSuccess: (_, vars) => {
      toast.success("Field deleted");
      queryClient
        .invalidateQueries({
          queryKey: workforceKeys.requestCategories.fields(vars.categoryId),
        })
        .catch((e: unknown) => consumeHandledApiError(e, "SubCategories.invalidateFields"));
    },
    onError: (e: unknown) => consumeHandledApiError(e, "SubCategories.handleDeleteField"),
  });

  const reorderFieldsMutation = useMutation({
    mutationFn: ({ categoryId, order }: { categoryId: number; order: FieldsReorderItem[] }) =>
      reorderUserRequestCategoryFields(categoryId, order),
    onSuccess: (_, vars) => {
      toast.success("Order updated");
      queryClient
        .invalidateQueries({
          queryKey: workforceKeys.requestCategories.fields(vars.categoryId),
        })
        .catch((e: unknown) => consumeHandledApiError(e, "SubCategories.invalidateFields"));
    },
    onError: (e: unknown) => consumeHandledApiError(e, "SubCategories.moveField"),
  });

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ ...defaultCategoryForm });
    setShowCategoryModal(true);
  };

  const openEditCategory = useCallback((cat: UserRequestCategory) => {
    setEditingCategory(cat);
    const raw = cat as UserRequestCategory & {
      parent_id?: number | null;
      sort_order?: number;
      tracking_enabled?: boolean;
      tracking_code_prefix?: string;
      workflow_levels?: WorkflowLevelPayload[];
    };
    setCategoryForm({
      name: cat.name ?? "",
      code: cat.code ?? "",
      description: cat.description ?? "",
      is_active: cat.is_active !== false,
      parent_id: raw.parent_id ?? undefined,
      sort_order: raw.sort_order ?? 0,
      tracking_enabled: raw.tracking_enabled ?? false,
      tracking_code_prefix: raw.tracking_code_prefix ?? "",
      workflow_levels: Array.isArray(raw.workflow_levels) ? raw.workflow_levels : [],
    });
    setShowCategoryModal(true);
  }, []);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const isChild = categoryForm.parent_id != null && categoryForm.parent_id !== 0;
    if (isChild && !categoryForm.name?.trim()) {
      toast.error("Name is required for sub-categories");
      return;
    }
    const payload: UserRequestCategoryPayload = {
      name: categoryForm.name?.trim() || undefined,
      code: categoryForm.code?.trim() || undefined,
      description: categoryForm.description?.trim() || undefined,
      is_active: categoryForm.is_active,
      parent_id: null,
      sort_order: categoryForm.sort_order ?? 0,
      tracking_enabled: categoryForm.tracking_enabled ?? false,
      tracking_code_prefix: (categoryForm.tracking_code_prefix ?? "").slice(0, 50) || undefined,
      workflow_levels: normalizeWorkflowLevelsForPayload(categoryForm.workflow_levels),
    };
    try {
      await saveCategoryMutation.mutateAsync({ editing: editingCategory, payload });
      setShowCategoryModal(false);
    } catch {
      /* mutation onError */
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
      /* mutation onError */
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
    if (!fieldForm.key?.trim() || !fieldForm.label?.trim()) {
      toast.error("Key and label are required");
      return;
    }
    try {
      await saveFieldMutation.mutateAsync({
        categoryId: fieldsCategoryId,
        editing: editingField,
        body: fieldForm,
      });
      setShowFieldModal(false);
    } catch {
      /* mutation onError */
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
      /* mutation onError */
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
      /* mutation onError */
    }
  };

  const reordering = reorderFieldsMutation.isPending;

  const canManage =
    session?.user?.permissions?.includes(MANAGE_REQUEST_CATEGORIES_PERMISSION) ?? false;

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
                  className="sub-categories-page__field-reorder-btn"
                  onClick={() => moveField(index, "up")}
                  disabled={reordering}
                  aria-label="Move up"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  className="sub-categories-page__field-reorder-btn"
                  onClick={() => moveField(index, "down")}
                  disabled={reordering}
                  aria-label="Move down"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            ),
          },
          { key: "key", label: "Key", type: "text" },
          { key: "label", label: "Label", type: "text" },
          { key: "type", label: "Type", type: "text" },
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

  return (
    <div className="sub-categories-page">
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Request Sub-Categories" />
      <PageHeader
        title="Request Sub-Categories"
        showSearch={false}
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

      <div className="sub-categories-page__shell">
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
              key: "code",
              label: "Code",
              type: "text",
              emptyValue: "—",
            },
            {
              key: "description",
              label: "Description",
              render: (row) => <span>{formatDescriptionCell(row.description)}</span>,
            },
            {
              key: "is_active",
              label: "Active",
              render: (row) => (
                <span
                  className={`gt-badge gt-badge-${row.is_active === false ? "secondary" : "success"}`}
                >
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
              label: "Manage fields",
              icon: <List size={14} />,
              onClick: openFieldsModal,
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
      </div>

      <SubCategoriesCategoryModal
        show={showCategoryModal}
        onHide={() => setShowCategoryModal(false)}
        editingCategory={editingCategory}
        categoryForm={categoryForm}
        setCategoryForm={setCategoryForm}
        mainAppUsers={mainAppUsers}
        categoryOptions={categories}
        saving={saveCategoryMutation.isPending}
        onSubmit={handleSaveCategory}
      />

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

      <SubCategoriesFieldModal
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
        setAutoGenerateKey={setAutoGenerateKey}
        onSubmit={handleSaveField}
      />
    </div>
  );
}

RequestSubCategories.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default RequestSubCategories;
