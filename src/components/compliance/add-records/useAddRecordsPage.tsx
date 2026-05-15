import type {
  TableAction,
  TableColumn,
  ToolbarConfig,
} from "@components/GenericTable";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import {
  addLocalDNDBlock,
  bulkAddLocalDNDBlocks,
  bulkDeleteLocalDNDBlocks,
  deleteLocalDNDBlock,
  fetchLocalDNDBlocks,
  LocalDNDBlockRecord,
} from "@utils/dncr";
import { usePermissions } from "@utils/permissionUtils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import { Trash2 } from "lucide-react";

import { AddRecordsTableToolbar } from "./AddRecordsTableToolbar";
import {
  ADD_RECORDS_DNCR_PERM_MSG,
  digitsOnlyCalledNumber,
  downloadLocalDndBlocksSampleCsv,
  formatLocalDndDateTime,
  getAddRecordsErrorMessage,
  isValidCalledNumber,
  parseLocalDndBulkCsvPreview,
  type AddRecordsFetchParams,
} from "./addRecordsDomain";

import { complianceKeys } from "@query/keys";

import "./addRecordsPage.scss";

const { PERMISSIONS: P } = HEADER_CONSTANTS;

export interface AddRecordsPageViewModel {
  hasAddSection: boolean;
  canAddLocalDnd: boolean;
  canBulkAddLocalDnd: boolean;
  canDeleteLocalDnd: boolean;
  canBulkDeleteLocalDnd: boolean;
  calledNumber: string;
  setCalledNumber: (v: string) => void;
  comments: string;
  setComments: (v: string) => void;
  submitting: boolean;
  handleAddBlock: (e: FormEvent) => Promise<void>;
  csvFile: File | null;
  csvPreview: string;
  bulkSubmitting: boolean;
  csvInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleBulkUpload: () => Promise<void>;
  downloadSampleCSV: () => void;
  apiData: LocalDNDBlockRecord[];
  loading: boolean;
  error: string | null;
  totalRecords: number;
  currentPage: number;
  itemsPerPage: number;
  selectedItems: number[];
  selectedRows: LocalDNDBlockRecord[];
  setSelectedItems: (ids: number[]) => void;
  columns: TableColumn<LocalDNDBlockRecord>[];
  actions: TableAction<LocalDNDBlockRecord>[];
  toolbarConfig: ToolbarConfig;
  showDeleteModal: boolean;
  setShowDeleteModal: (v: boolean) => void;
  showBulkDeleteModal: boolean;
  setShowBulkDeleteModal: (v: boolean) => void;
  recordToDelete: LocalDNDBlockRecord | null;
  setRecordToDelete: (r: LocalDNDBlockRecord | null) => void;
  deleting: boolean;
  handleConfirmDelete: () => Promise<void>;
  handleConfirmBulkDelete: () => Promise<void>;
  handleItemsPerPageChange: (value: number) => void;
  setCurrentPage: (page: number) => void;
}

export function useAddRecordsPage(): AddRecordsPageViewModel {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canAddLocalDnd = hasPermission(P.ADD_LOCAL_DND_BLOCKS_DNCR);
  const canBulkAddLocalDnd = hasPermission(P.BULK_ADD_LOCAL_DND_BLOCKS_DNCR);
  const canDeleteLocalDnd = hasPermission(P.DELETE_LOCAL_DND_BLOCKS_DNCR);
  const canBulkDeleteLocalDnd = hasPermission(P.BULK_DELETE_LOCAL_DND_BLOCKS_DNCR);

  const [calledNumber, setCalledNumber] = useState("");
  const [comments, setComments] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [searchNumber, setSearchNumber] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState("");
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const csvReadVersionRef = useRef(0);

  const [appliedFilters, setAppliedFilters] = useState({ search: "" });

  const localDndListQueryKey = useMemo(
    () =>
      complianceKeys.localDndBlocks.list({
        variant: "add-records",
        page: currentPage,
        perPage: itemsPerPage,
        search: appliedFilters.search,
        company: "",
      }),
    [currentPage, itemsPerPage, appliedFilters.search],
  );

  const {
    data: localDndPayload,
    isPending,
    isFetching,
    error: listQueryError,
  } = useQuery({
    queryKey: localDndListQueryKey,
    queryFn: async () => {
      const offset = (currentPage - 1) * itemsPerPage;
      const params: AddRecordsFetchParams = {
        limit: itemsPerPage,
        offset,
      };

      if (appliedFilters.search) {
        params.search = appliedFilters.search;
      }

      const response = await fetchLocalDNDBlocks(params);

      if (response?.status === "success") {
        return response;
      }
      throw new Error(response?.error || "Failed to fetch records");
    },
  });

  const apiData = localDndPayload?.records ?? [];
  const totalRecords = localDndPayload?.total ?? 0;
  const loading = isPending || isFetching;
  let error: string | null = null;
  if (listQueryError instanceof Error) {
    error = listQueryError.message;
  } else if (listQueryError) {
    error = "Failed to fetch records";
  }

  const invalidateLocalDndLists = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: complianceKeys.localDndBlocks.all(),
    });
  }, [queryClient]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<LocalDNDBlockRecord | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const resetCsvSelection = useCallback(() => {
    csvReadVersionRef.current += 1;
    setCsvFile(null);
    setCsvPreview("");
    if (csvInputRef.current) {
      csvInputRef.current.value = "";
    }
  }, []);

  useEffect(() => {
    if (!canBulkDeleteLocalDnd) {
      setSelectedItems([]);
      setShowBulkDeleteModal(false);
    }
  }, [canBulkDeleteLocalDnd]);

  useEffect(() => {
    if (!canBulkAddLocalDnd) {
      resetCsvSelection();
    }
  }, [canBulkAddLocalDnd, resetCsvSelection]);

  const handleAddBlock = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!canAddLocalDnd) {
        toast.error(ADD_RECORDS_DNCR_PERM_MSG);
        return;
      }
      if (!calledNumber.trim()) {
        toast.error("Please enter a called number");
        return;
      }

      const normalizedNumber = digitsOnlyCalledNumber(calledNumber);
      if (!isValidCalledNumber(normalizedNumber)) {
        toast.error(
          "Number must be 10 digits starting with 05 (e.g. 0501234567). Spaces and dashes are OK.",
        );
        return;
      }

      setSubmitting(true);
      try {
        const response = await addLocalDNDBlock({
          called_number: normalizedNumber,
          comments: comments.trim() || undefined,
        });

        if (response?.status === "success") {
          toast.success(response.message || "Record added successfully");
          setCalledNumber("");
          setComments("");
          invalidateLocalDndLists();
        } else if (response?.status === "error") {
          toast.error(response?.error || "Failed to add record");
        } else {
          toast.error("Failed to add record");
        }
      } catch (err: unknown) {
        console.error("Error adding record:", err);
        toast.error(getAddRecordsErrorMessage(err, "Failed to add record"));
      } finally {
        setSubmitting(false);
      }
    },
    [canAddLocalDnd, calledNumber, comments, invalidateLocalDndLists],
  );

  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!canBulkAddLocalDnd) {
        toast.error(ADD_RECORDS_DNCR_PERM_MSG);
        e.target.value = "";
        return;
      }

      if (!file.name.toLowerCase().endsWith(".csv")) {
        toast.error("Please select a CSV file");
        resetCsvSelection();
        return;
      }

      const readVersion = ++csvReadVersionRef.current;
      setCsvFile(file);
      setCsvPreview("");

      try {
        const text = await file.text();
        if (readVersion !== csvReadVersionRef.current) {
          return;
        }
        setCsvPreview(text);
      } catch (err) {
        console.error("Error reading file:", err);
        if (readVersion === csvReadVersionRef.current) {
          toast.error("Failed to read CSV file");
          resetCsvSelection();
        }
      }
    },
    [canBulkAddLocalDnd, resetCsvSelection],
  );

  const downloadSampleCSV = useCallback(() => {
    downloadLocalDndBlocksSampleCsv();
  }, []);

  const handleBulkUpload = useCallback(async () => {
    if (!canBulkAddLocalDnd) {
      toast.error(ADD_RECORDS_DNCR_PERM_MSG);
      return;
    }
    if (!csvFile || !csvPreview) {
      toast.error("Please select a CSV file");
      return;
    }

    setBulkSubmitting(true);
    try {
      const parsed = parseLocalDndBulkCsvPreview(csvPreview);
      if (!parsed.ok) {
        toast.error(parsed.message);
        resetCsvSelection();
        return;
      }

      const response = await bulkAddLocalDNDBlocks({ records: parsed.records });

      if (response?.status === "success") {
        toast.success(
          response.message ||
            `Successfully added ${response.records_added || 0} record(s)`,
        );
        resetCsvSelection();
        invalidateLocalDndLists();
      } else {
        toast.error("Failed to add records");
      }
    } catch (err: unknown) {
      console.error("Error bulk adding records:", err);
      toast.error(getAddRecordsErrorMessage(err, "Failed to add records"));
    } finally {
      setBulkSubmitting(false);
    }
  }, [canBulkAddLocalDnd, csvFile, csvPreview, invalidateLocalDndLists, resetCsvSelection]);

  const handleDeleteClick = useCallback(
    (record: LocalDNDBlockRecord) => {
      if (!canDeleteLocalDnd) {
        toast.error(ADD_RECORDS_DNCR_PERM_MSG);
        return;
      }
      setRecordToDelete(record);
      setShowDeleteModal(true);
    },
    [canDeleteLocalDnd],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!recordToDelete) return;
    if (!canDeleteLocalDnd) {
      toast.error(ADD_RECORDS_DNCR_PERM_MSG);
      return;
    }

    setDeleting(true);
    try {
      const response = await deleteLocalDNDBlock(recordToDelete.id);

      if (response?.status === "success") {
        toast.success(response.message || "Record deleted successfully");
        setShowDeleteModal(false);
        setRecordToDelete(null);
        invalidateLocalDndLists();
      } else {
        toast.error("Failed to delete record");
      }
    } catch (err: unknown) {
      console.error("Error deleting record:", err);
      toast.error(getAddRecordsErrorMessage(err, "Failed to delete record"));
    } finally {
      setDeleting(false);
    }
  }, [canDeleteLocalDnd, recordToDelete, invalidateLocalDndLists]);

  const handleBulkDeleteClick = useCallback(() => {
    if (!canBulkDeleteLocalDnd) {
      toast.error(ADD_RECORDS_DNCR_PERM_MSG);
      return;
    }
    if (selectedItems.length === 0) {
      toast.warn("Please select at least one record to delete");
      return;
    }
    setShowBulkDeleteModal(true);
  }, [canBulkDeleteLocalDnd, selectedItems.length]);

  const handleConfirmBulkDelete = useCallback(async () => {
    if (selectedItems.length === 0) return;
    if (!canBulkDeleteLocalDnd) {
      toast.error(ADD_RECORDS_DNCR_PERM_MSG);
      return;
    }

    setDeleting(true);
    try {
      const response = await bulkDeleteLocalDNDBlocks(selectedItems);

      if (response?.status === "success") {
        toast.success(
          response.message ||
            `${selectedItems.length} record(s) deleted successfully`,
        );
        setShowBulkDeleteModal(false);
        setSelectedItems([]);
        invalidateLocalDndLists();
      } else {
        toast.error("Failed to delete records");
      }
    } catch (err: unknown) {
      console.error("Error bulk deleting records:", err);
      toast.error(getAddRecordsErrorMessage(err, "Failed to delete records"));
    } finally {
      setDeleting(false);
    }
  }, [canBulkDeleteLocalDnd, selectedItems, invalidateLocalDndLists]);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters({ search: searchNumber });
    setCurrentPage(1);
    setSelectedItems([]);
  }, [searchNumber]);

  const handleResetFilters = useCallback(() => {
    setSearchNumber("");
    setAppliedFilters({ search: "" });
    setCurrentPage(1);
    setSelectedItems([]);
  }, []);

  const handleRefresh = useCallback(() => {
    handleResetFilters();
    invalidateLocalDndLists();
  }, [handleResetFilters, invalidateLocalDndLists]);

  const handleItemsPerPageChange = useCallback((value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    setSelectedItems([]);
  }, []);

  const selectedRows = useMemo(
    () => apiData.filter((record) => selectedItems.includes(record.id)),
    [apiData, selectedItems],
  );

  const toolbarConfig = useMemo<ToolbarConfig>(
    () => ({
      showSearch: true,
      searchValue: searchNumber,
      searchPlaceholder: "Search by number...",
      onSearchChange: setSearchNumber,
      onSearch: handleApplyFilters,
      showFilterPills: false,
      showMoreFiltersButton: false,
      customActions: (
        <AddRecordsTableToolbar
          canBulkDelete={canBulkDeleteLocalDnd}
          selectedCount={selectedItems.length}
          onBulkDeleteClick={handleBulkDeleteClick}
          onRefresh={handleRefresh}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
        />
      ),
    }),
    [
      searchNumber,
      canBulkDeleteLocalDnd,
      selectedItems.length,
      handleBulkDeleteClick,
      handleRefresh,
      handleApplyFilters,
      handleResetFilters,
    ],
  );

  const columns = useMemo<TableColumn<LocalDNDBlockRecord>[]>(
    () => [
      { key: "id", label: "ID", type: "text", sortable: false },
      {
        key: "called_number",
        label: "CALLED NUMBER",
        type: "text",
        sortable: false,
      },
      {
        key: "company_name",
        label: "COMPANY NAME",
        type: "text",
        sortable: false,
        emptyValue: "-",
      },
      {
        key: "date_time",
        label: "DATE/TIME",
        type: "custom",
        sortable: false,
        render: (row) => formatLocalDndDateTime(row.date_time),
      },
      {
        key: "comments",
        label: "COMMENTS",
        type: "custom",
        sortable: false,
        render: (row) => (
          <span className="addRecordsPage-commentsCell">
            {row.comments || "-"}
          </span>
        ),
      },
    ],
    [],
  );

  const actions = useMemo<TableAction<LocalDNDBlockRecord>[]>(
    () =>
      canDeleteLocalDnd
        ? [
            {
              label: "Delete",
              icon: <Trash2 size={16} />,
              onClick: (row) => handleDeleteClick(row),
              variant: "link",
              className: "text-danger",
            },
          ]
        : [],
    [canDeleteLocalDnd, handleDeleteClick],
  );

  const hasAddSection = canAddLocalDnd || canBulkAddLocalDnd;

  return {
    hasAddSection,
    canAddLocalDnd,
    canBulkAddLocalDnd,
    canDeleteLocalDnd,
    canBulkDeleteLocalDnd,
    calledNumber,
    setCalledNumber,
    comments,
    setComments,
    submitting,
    handleAddBlock,
    csvFile,
    csvPreview,
    bulkSubmitting,
    csvInputRef,
    handleFileChange,
    handleBulkUpload,
    downloadSampleCSV,
    apiData,
    loading,
    error,
    totalRecords,
    currentPage,
    itemsPerPage,
    selectedItems,
    selectedRows,
    setSelectedItems,
    columns,
    actions,
    toolbarConfig,
    showDeleteModal,
    setShowDeleteModal,
    showBulkDeleteModal,
    setShowBulkDeleteModal,
    recordToDelete,
    setRecordToDelete,
    deleting,
    handleConfirmDelete,
    handleConfirmBulkDelete,
    handleItemsPerPageChange,
    setCurrentPage,
  };
}
