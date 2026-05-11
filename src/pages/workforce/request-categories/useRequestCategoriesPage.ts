import {
  invalidateAllUserRequestCategories,
} from "@page-modules/workforce/request-categories/invalidateRequestCategoriesQueries";
import {
  runMutationWithQuietCatch,
  toastSuccessAndInvalidateCategoryFields,
} from "@page-modules/workforce/request-categories/requestCategoriesMutationHelpers";
import {
  consumeHandledApiError,
  defaultCategoryForm,
  emptyFieldForm,
  fieldPayloadFromExisting,
  getCategoryFormSubmitValidationError,
  getFieldFormSubmitValidationError,
  MANAGE_REQUEST_CATEGORIES_PERMISSION,
  normalizeWorkflowLevelsForPayload,
  slugifyForKey,
  type CategoryFormState,
} from "@page-modules/workforce/request-categories/requestCategoriesDomain";
import {
  useRequestCategoriesListQuery,
  useRequestCategoryChildrenQuery,
  useRequestCategoryFieldsQuery,
} from "@page-modules/workforce/request-categories/useRequestCategoriesQueries";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createUserRequestCategory,
  createUserRequestCategoryField,
  deleteUserRequestCategory,
  deleteUserRequestCategoryField,
  reorderUserRequestCategoryFields,
  updateUserRequestCategory,
  updateUserRequestCategoryField,
  type FieldsReorderItem,
  type UserRequestCategory,
  type UserRequestCategoryField,
  type UserRequestCategoryFieldPayload,
  type UserRequestCategoryPayload,
} from "@utils/staffManagement";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "react-toastify";

export function useRequestCategoriesPage() {
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
      invalidateAllUserRequestCategories(queryClient);
    },
    onError: (e: unknown) => consumeHandledApiError(e, "RequestCategories.handleSaveCategory"),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => deleteUserRequestCategory(id),
    onSuccess: () => {
      invalidateAllUserRequestCategories(queryClient);
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
      toastSuccessAndInvalidateCategoryFields(
        queryClient,
        vars.categoryId,
        vars.editing ? "Field updated" : "Field added",
      );
    },
    onError: (e: unknown) => consumeHandledApiError(e, "RequestCategories.handleSaveField"),
  });

  const deleteFieldMutation = useMutation({
    mutationFn: ({ categoryId, fieldId }: { categoryId: number; fieldId: number }) =>
      deleteUserRequestCategoryField(categoryId, fieldId),
    onSuccess: (_, vars) => {
      toastSuccessAndInvalidateCategoryFields(queryClient, vars.categoryId, "Field deleted");
    },
    onError: (e: unknown) =>
      consumeHandledApiError(e, "RequestCategories.handleConfirmDeleteField"),
  });

  const reorderFieldsMutation = useMutation({
    mutationFn: ({ categoryId, order }: { categoryId: number; order: FieldsReorderItem[] }) =>
      reorderUserRequestCategoryFields(categoryId, order),
    onSuccess: (_, vars) => {
      toastSuccessAndInvalidateCategoryFields(queryClient, vars.categoryId, "Order updated");
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

  const handleSaveCategory = async (e: FormEvent) => {
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
    await runMutationWithQuietCatch(async () => {
      await saveCategoryMutation.mutateAsync({ editing: editingCategory, payload });
      setShowCategoryModal(false);
      setShowChildrenModal(false);
    });
  };

  const openDeleteCategory = (cat: UserRequestCategory) => {
    setCategoryToDelete(cat);
    setShowDeleteModal(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    await runMutationWithQuietCatch(async () => {
      await deleteCategoryMutation.mutateAsync(categoryToDelete.id);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    });
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

  const handleSaveField = async (e: FormEvent) => {
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
    await runMutationWithQuietCatch(async () => {
      await saveFieldMutation.mutateAsync({
        categoryId: fieldsCategoryId,
        editing: editingField,
        body: payloadForSave,
      });
      setShowFieldModal(false);
    });
  };

  const openDeleteFieldModal = (f: UserRequestCategoryField) => {
    setFieldPendingDelete(f);
    setShowDeleteFieldModal(true);
  };

  const handleConfirmDeleteField = async () => {
    if (!fieldsCategoryId || !fieldPendingDelete) return;
    await runMutationWithQuietCatch(async () => {
      await deleteFieldMutation.mutateAsync({
        categoryId: fieldsCategoryId,
        fieldId: fieldPendingDelete.id,
      });
      setShowDeleteFieldModal(false);
      setFieldPendingDelete(null);
    });
  };

  const moveField = async (index: number, direction: "up" | "down") => {
    if (!fieldsCategoryId || fields.length < 2) return;
    const newFields = [...fields];
    const swap = direction === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= newFields.length) return;
    [newFields[index], newFields[swap]] = [newFields[swap], newFields[index]];
    const order: FieldsReorderItem[] = newFields.map((f, i) => ({ id: f.id, sort_order: i }));
    await runMutationWithQuietCatch(async () => {
      await reorderFieldsMutation.mutateAsync({ categoryId: fieldsCategoryId, order });
    });
  };

  const reordering = reorderFieldsMutation.isPending;
  const canManage =
    session?.user?.permissions?.includes(MANAGE_REQUEST_CATEGORIES_PERMISSION) ?? false;

  return {
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
    saveCategoryPending: saveCategoryMutation.isPending,
    openCreateCategory,
    openEditCategory,
    showDeleteModal,
    setShowDeleteModal,
    categoryToDelete,
    setCategoryToDelete,
    handleDeleteCategory,
    deleteCategoryPending: deleteCategoryMutation.isPending,
    showChildrenModal,
    setShowChildrenModal,
    categoryForChildren,
    openChildrenModal,
    childrenList,
    loadingChildren,
    openAddChildCategory,
    showFieldsModal,
    closeFieldsModal,
    fieldsCategoryName,
    fields,
    loadingFields,
    openFieldsModal,
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
    saveFieldPending: saveFieldMutation.isPending,
    showAdvanced,
    setShowAdvanced,
    autoGenerateKey,
    showDeleteFieldModal,
    setShowDeleteFieldModal,
    fieldPendingDelete,
    setFieldPendingDelete,
    handleConfirmDeleteField,
    deleteFieldPending: deleteFieldMutation.isPending,
    openDeleteCategory,
    openDeleteFieldModal,
  };
}
