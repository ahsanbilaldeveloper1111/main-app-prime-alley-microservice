import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TableColumn, ToolbarConfig } from "@components/GenericTable";
import {
  getBusinessTypes,
  createBusinessType,
  updateBusinessType,
  deleteBusinessType,
  BusinessTypeData,
  CreateBusinessTypePayload,
  UpdateBusinessTypePayload,
} from "@utils/crm";
import { reportApiErrorFromCatch } from "@utils/sentryLogger";
import { formatDateTimeToLocal, GlobalDateFormat, normalizeSearchQuery } from "@utils/Helper";
import { Button } from "react-bootstrap";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCrmSettingsTableState } from "@hooks/useCrmSettingsTableState";
import { useDebouncedSearchInput } from "@hooks/useDebouncedSearchInput";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { CrmTruncatedDescriptionCell } from "@components/crm/crmTruncatedDescriptionCell";
import { crmAppKeys } from "../query/keys";

const { PERMISSIONS } = HEADER_CONSTANTS;

const BUSINESS_TYPES_TABLE_COLUMN_STORAGE_KEY = "businessTypesSelectedColumns";
export const BUSINESS_TYPES_TABLE_SELECTABLE_KEYS = [
  "name",
  "description",
  "created_at",
  "actions",
] as const;
export const DEFAULT_BUSINESS_TYPES_TABLE_COLUMNS = [
  "name",
  "description",
  "created_at",
  "actions",
];

function consumeHandledApiError(error: unknown, source: string): void {
  reportApiErrorFromCatch(error, source, { scope: "BusinessTypes" });
}

type BusinessTypeFormState = {
  name: string;
  description: string;
};

const EMPTY_FORM: BusinessTypeFormState = {
  name: "",
  description: "",
};

export function modalTitle(editing: BusinessTypeData | null): string {
  return editing ? "Edit Business Type" : "Add New Business Type";
}

export function primarySubmitLabel(submitting: boolean, editing: BusinessTypeData | null): string {
  if (submitting) return editing ? "Updating..." : "Creating...";
  return editing ? "Update" : "Create";
}

export function useBusinessTypesPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const {
    pagination,
    setPagination,
    selectedColumns,
    setSelectedColumns,
    handlePaginationChange,
  } = useCrmSettingsTableState({
    defaultSelectedColumns: DEFAULT_BUSINESS_TYPES_TABLE_COLUMNS,
    selectableColumnKeys: BUSINESS_TYPES_TABLE_SELECTABLE_KEYS,
    columnStorageKey: BUSINESS_TYPES_TABLE_COLUMN_STORAGE_KEY,
  });
  const {
    inputValue: searchInput,
    queryValue: search,
    handleInputChange: handleSearchChange,
    submitQuery: submitSearch,
  } = useDebouncedSearchInput({ normalize: normalizeSearchQuery });

  const listQuery = useQuery({
    queryKey: crmAppKeys.businessTypes.list({
      page: pagination.currentPage,
      perPage: pagination.rowsPerPage,
      search,
    }),
    queryFn: async () => {
      const params: { page: number; per_page: number; search?: string } = {
        page: pagination.currentPage,
        per_page: pagination.rowsPerPage,
      };
      if (search) params.search = search;
      return getBusinessTypes(params);
    },
  });

  useEffect(() => {
    if (listQuery.isError) {
      consumeHandledApiError(listQuery.error, "BusinessTypes.listQuery");
    }
  }, [listQuery.isError, listQuery.error]);

  const businessTypes = listQuery.data?.data ?? [];
  const totalBusinessTypes = listQuery.data?.total ?? 0;
  const loading = listQuery.isPending || listQuery.isFetching;

  useEffect(() => {
    setPagination((prev) =>
      prev.currentPage === 1 ? prev : { ...prev, currentPage: 1 },
    );
  }, [search, setPagination]);

  const [showModal, setShowModal] = useState(false);
  const [editingBusinessType, setEditingBusinessType] = useState<BusinessTypeData | null>(null);
  const [deletingBusinessType, setDeletingBusinessType] = useState<BusinessTypeData | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState<BusinessTypeFormState>({ ...EMPTY_FORM });

  const invalidateList = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: crmAppKeys.businessTypes.all() });
  }, [queryClient]);

  const saveMutation = useMutation({
    mutationFn: async (input: {
      editing: BusinessTypeData | null;
      payload: CreateBusinessTypePayload | UpdateBusinessTypePayload;
    }) => {
      if (input.editing) {
        await updateBusinessType(input.editing.id, input.payload as UpdateBusinessTypePayload);
      } else {
        await createBusinessType(input.payload as CreateBusinessTypePayload);
      }
    },
    onSuccess: () => {
      invalidateList();
    },
    onError: (error: unknown) => {
      consumeHandledApiError(error, "BusinessTypes.saveMutation");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await deleteBusinessType(id);
    },
    onSuccess: () => {
      invalidateList();
    },
    onError: (error: unknown) => {
      consumeHandledApiError(error, "BusinessTypes.deleteMutation");
    },
  });

  const handleOpenModal = useCallback((businessType?: BusinessTypeData) => {
    if (businessType) {
      setEditingBusinessType(businessType);
      setFormData({
        name: businessType.name || "",
        description: businessType.description || "",
      });
    } else {
      setEditingBusinessType(null);
      setFormData({ ...EMPTY_FORM });
    }
    setShowModal(true);
  }, []);

  const openDeleteModal = useCallback((bt: BusinessTypeData) => {
    setDeletingBusinessType(bt);
    setShowDeleteModal(true);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const payload: CreateBusinessTypePayload = {
        name: formData.name.trim(),
        description: formData.description.trim() || "",
      };
      try {
        await saveMutation.mutateAsync({ editing: editingBusinessType, payload });
        setShowModal(false);
        setEditingBusinessType(null);
        setFormData({ ...EMPTY_FORM });
      } catch {
        /* onError handled */
      }
    },
    [editingBusinessType, formData, saveMutation],
  );

  const handleDelete = useCallback(async () => {
    if (!deletingBusinessType) return;
    try {
      await deleteMutation.mutateAsync(deletingBusinessType.id);
      setShowDeleteModal(false);
      setDeletingBusinessType(null);
    } catch {
      /* onError handled */
    }
  }, [deletingBusinessType, deleteMutation]);

  const businessTableColumns = useMemo<TableColumn<BusinessTypeData>[]>(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
        type: "custom",
        width: "260px",
        render: (bt) => <div className="fw-semibold">{bt.name}</div>,
      },
      {
        key: "description",
        label: "Description",
        sortable: false,
        type: "custom",
        width: "420px",
        render: (bt) => <CrmTruncatedDescriptionCell text={bt.description} />,
      },
      {
        key: "created_at",
        label: "Created At",
        sortable: true,
        type: "custom",
        width: "200px",
        render: (bt) => (
          <div className="text-muted small">
            {bt.created_at
              ? formatDateTimeToLocal(bt.created_at, GlobalDateFormat)
              : "—"}
          </div>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        sortable: false,
        align: "right",
        type: "custom",
        width: "160px",
        render: (bt) => (
          <div className="d-flex justify-content-end gap-2">
            {session?.user?.permissions?.includes(PERMISSIONS.EDIT_CRM_BUSINESS_TYPES) && (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleOpenModal(bt)}
                aria-label={"Edit business type " + (bt.name ?? "")}
              >
                <Edit size={14} aria-hidden />
              </Button>
            )}
            {session?.user?.permissions?.includes(PERMISSIONS.DELETE_CRM_BUSINESS_TYPES) && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => openDeleteModal(bt)}
                aria-label={"Delete business type " + (bt.name ?? "")}
              >
                <Trash2 size={14} aria-hidden />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [session?.user?.permissions, handleOpenModal, openDeleteModal],
  );

  const handleToolbarSearch = useCallback(() => {
    submitSearch();
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [setPagination, submitSearch]);

  const businessToolbarConfig = useMemo<ToolbarConfig>(
    () => ({
      showSearch: true,
      searchValue: searchInput,
      searchPlaceholder: "Search business types by name or description...",
      onSearchChange: handleSearchChange,
      onSearch: handleToolbarSearch,
      rightActions: (
        <div className="d-flex gap-2">
          {session?.user?.permissions?.includes(
            PERMISSIONS.CREATE_CRM_BUSINESS_TYPES,
          ) && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenModal()}
              className="d-flex align-items-center gap-2"
            >
              <PlusCircle size={16} aria-hidden />
              Add Business Type
            </Button>
          )}
        </div>
      ),
    }),
    [
      handleOpenModal,
      handleSearchChange,
      handleToolbarSearch,
      searchInput,
      session?.user?.permissions,
    ],
  );

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setDeletingBusinessType(null);
  }, []);

  return {
    businessTypes,
    totalBusinessTypes,
    loading,
    pagination,
    selectedColumns,
    setSelectedColumns,
    handlePaginationChange,
    searchInput,
    handleSearchChange,
    showModal,
    setShowModal,
    editingBusinessType,
    deletingBusinessType,
    showDeleteModal,
    deletingBusinessTypePending: deleteMutation.isPending,
    formData,
    setFormData,
    submitting: saveMutation.isPending,
    handleOpenModal,
    handleSubmit,
    handleDelete,
    businessTableColumns,
    businessToolbarConfig,
    columnStorageKey: BUSINESS_TYPES_TABLE_COLUMN_STORAGE_KEY,
    closeDeleteModal,
  };
}
