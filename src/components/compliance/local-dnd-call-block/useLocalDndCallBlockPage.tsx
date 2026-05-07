import axiosInstance from "@utils/axios";
import { fetchLocalDNDBlocks } from "@utils/dncr";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, {
  ChangeEvent,
  FormEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";

import {
  AddLocalDNDResponse,
  BulkAddLocalDNDResponse,
  downloadLocalDndCallBlockSampleCsv,
  formatLocalDndBlockDateTime,
  getLocalDndCallBlockErrorMessage,
  LOCAL_DND_BLOCKS_ADD_PATH,
  LOCAL_DND_BLOCKS_BULK_ADD_PATH,
  LOCAL_DND_BLOCKS_BULK_DELETE_PATH,
  localDndBlockDeletePath,
  type LocalDNDBlockRecord,
} from "./localDndCallBlockDomain";

import { complianceKeys } from "../../../query/keys";

import "./localDndCallBlockPage.scss";

export interface LocalDndCallBlockViewModel {
  currentPage: number;
  recordsPerPage: number;
  totalPages: number;
  totalRecords: number;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  companyFilter: string;
  setCompanyFilter: (v: string) => void;
  appliedFilters: { search: string; company: string };
  loading: boolean;
  apiData: LocalDNDBlockRecord[];
  error: string | null;
  selectedRecords: number[];
  handleSelectRecord: (id: number) => void;
  handleSelectAll: () => void;
  handleApplyFilters: () => void;
  handleResetFilters: () => void;
  handleFirstPage: () => void;
  handleLastPage: () => void;
  handleNextPage: () => void;
  handlePrevPage: () => void;
  handleRecordsPerPageChange: (n: number) => void;
  formatDateTime: (s: string) => string;
  handleBulkDeleteClick: () => void;
  setShowBulkAddModal: (v: boolean) => void;
  setShowAddModal: (v: boolean) => void;
  showAddModal: boolean;
  showBulkAddModal: boolean;
  formData: { called_number: string; comments: string };
  setFormData: React.Dispatch<
    React.SetStateAction<{ called_number: string; comments: string }>
  >;
  submitting: boolean;
  handleAddRecord: (e: FormEvent) => Promise<void>;
  handleCloseModal: () => void;
  showDeleteModal: boolean;
  setShowDeleteModal: (v: boolean) => void;
  showBulkDeleteModal: boolean;
  setShowBulkDeleteModal: (v: boolean) => void;
  recordToDelete: LocalDNDBlockRecord | null;
  setRecordToDelete: (r: LocalDNDBlockRecord | null) => void;
  deleting: boolean;
  handleDeleteClick: (r: LocalDNDBlockRecord) => void;
  handleConfirmDelete: () => Promise<void>;
  handleConfirmBulkDelete: () => Promise<void>;
  csvFile: File | null;
  csvPreview: string;
  bulkSubmitting: boolean;
  bulkCsvInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleBulkAdd: () => Promise<void>;
  handleCloseBulkAddModal: () => void;
  downloadSampleCSV: () => void;
}

export function useLocalDndCallBlockPage(): LocalDndCallBlockViewModel {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    company: "",
  });

  const localDndListQueryKey = useMemo(
    () =>
      complianceKeys.localDndBlocks.list({
        variant: "call-block",
        page: currentPage,
        perPage: recordsPerPage,
        search: appliedFilters.search,
        company: appliedFilters.company,
      }),
    [currentPage, recordsPerPage, appliedFilters.search, appliedFilters.company],
  );

  const {
    data: localDndPayload,
    isPending,
    isFetching,
    error: listQueryError,
  } = useQuery({
    queryKey: localDndListQueryKey,
    queryFn: async () => {
      const offset = (currentPage - 1) * recordsPerPage;
      const params: {
        limit: number;
        offset: number;
        search?: string;
        company?: string;
      } = {
        limit: recordsPerPage,
        offset,
      };

      if (appliedFilters.search) {
        params.search = appliedFilters.search;
      }
      if (appliedFilters.company) {
        params.company = appliedFilters.company;
      }

      const response = await fetchLocalDNDBlocks(params);

      if (response?.status === "success") {
        return response;
      }
      throw new Error(response?.error || "Failed to fetch Local DND blocks");
    },
  });

  const apiData = localDndPayload?.records ?? [];
  const totalRecords = localDndPayload?.total ?? 0;
  const loading = isPending || isFetching;
  let error: string | null = null;
  if (listQueryError instanceof Error) {
    error = listQueryError.message;
  } else if (listQueryError) {
    error = "Failed to fetch Local DND blocks";
  }

  const invalidateLocalDndLists = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: complianceKeys.localDndBlocks.all(),
    });
  }, [queryClient]);

  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    called_number: "",
    comments: "",
  });

  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<LocalDNDBlockRecord | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const bulkCsvInputRef = useRef<HTMLInputElement | null>(null);
  const csvReadVersionRef = useRef(0);

  const handleAddRecord = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!formData.called_number.trim()) {
        toast.error("Please enter a called number");
        return;
      }

      setSubmitting(true);
      try {
        const payload: { called_number: string; comments?: string } = {
          called_number: formData.called_number.trim(),
        };

        if (formData.comments.trim()) {
          payload.comments = formData.comments.trim();
        }

        const response = await axiosInstance.post<AddLocalDNDResponse>(
          LOCAL_DND_BLOCKS_ADD_PATH,
          payload,
        );

        if (response.data?.status === "success") {
          toast.success(response.data.message || "Record added successfully");
          setShowAddModal(false);
          setFormData({
            called_number: "",
            comments: "",
          });
          invalidateLocalDndLists();
        } else {
          toast.error("Failed to add record");
        }
      } catch (err: unknown) {
        console.error("Error adding record:", err);
        toast.error(
          getLocalDndCallBlockErrorMessage(err, "Failed to add record"),
        );
      } finally {
        setSubmitting(false);
      }
    },
    [formData, invalidateLocalDndLists],
  );

  const handleCloseModal = useCallback(() => {
    setShowAddModal(false);
    setFormData({
      called_number: "",
      comments: "",
    });
  }, []);

  const handleSelectRecord = useCallback((recordId: number) => {
    setSelectedRecords((prev) =>
      prev.includes(recordId)
        ? prev.filter((id) => id !== recordId)
        : [...prev, recordId],
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedRecords((prev) =>
      apiData.length > 0 && prev.length === apiData.length
        ? []
        : apiData.map((record) => record.id),
    );
  }, [apiData]);

  const handleDeleteClick = useCallback((record: LocalDNDBlockRecord) => {
    setRecordToDelete(record);
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!recordToDelete) return;

    setDeleting(true);
    try {
      const response = await axiosInstance.delete(
        localDndBlockDeletePath(recordToDelete.id),
      );

      if ((response.data as { status?: string })?.status === "success") {
        toast.success(
          (response.data as { message?: string }).message ||
            "Record deleted successfully",
        );
        setShowDeleteModal(false);
        setRecordToDelete(null);
        invalidateLocalDndLists();
      } else {
        toast.error("Failed to delete record");
      }
    } catch (err: unknown) {
      console.error("Error deleting record:", err);
      toast.error(
        getLocalDndCallBlockErrorMessage(err, "Failed to delete record"),
      );
    } finally {
      setDeleting(false);
    }
  }, [recordToDelete, invalidateLocalDndLists]);

  const handleBulkDeleteClick = useCallback(() => {
    if (selectedRecords.length === 0) {
      toast.warning("Please select at least one record to delete");
      return;
    }
    setShowBulkDeleteModal(true);
  }, [selectedRecords.length]);

  const handleConfirmBulkDelete = useCallback(async () => {
    if (selectedRecords.length === 0) return;

    setDeleting(true);
    try {
      const response = await axiosInstance.post(LOCAL_DND_BLOCKS_BULK_DELETE_PATH, {
        ids: selectedRecords,
      });

      if ((response.data as { status?: string })?.status === "success") {
        toast.success(
          (response.data as { message?: string }).message ||
            `${selectedRecords.length} record(s) deleted successfully`,
        );
        setShowBulkDeleteModal(false);
        setSelectedRecords([]);
        invalidateLocalDndLists();
      } else {
        toast.error("Failed to delete records");
      }
    } catch (err: unknown) {
      console.error("Error bulk deleting records:", err);
      toast.error(
        getLocalDndCallBlockErrorMessage(err, "Failed to delete records"),
      );
    } finally {
      setDeleting(false);
    }
  }, [selectedRecords, invalidateLocalDndLists]);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters({
      search: searchQuery,
      company: companyFilter,
    });
    setCurrentPage(1);
    setSelectedRecords([]);
  }, [searchQuery, companyFilter]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setCompanyFilter("");
    setAppliedFilters({
      search: "",
      company: "",
    });
    setCurrentPage(1);
    setSelectedRecords([]);
  }, []);

  const handleFirstPage = useCallback(() => setCurrentPage(1), []);
  const handleLastPage = useCallback(
    () => setCurrentPage(totalPages),
    [totalPages],
  );
  const handleNextPage = useCallback(
    () => setCurrentPage((prev) => Math.min(prev + 1, totalPages)),
    [totalPages],
  );
  const handlePrevPage = useCallback(
    () => setCurrentPage((prev) => Math.max(prev - 1, 1)),
    [],
  );

  const handleRecordsPerPageChange = useCallback((value: number) => {
    setRecordsPerPage(value);
    setCurrentPage(1);
    setSelectedRecords([]);
  }, []);

  const resetBulkCsv = useCallback(() => {
    csvReadVersionRef.current += 1;
    setCsvFile(null);
    setCsvPreview("");
    if (bulkCsvInputRef.current) {
      bulkCsvInputRef.current.value = "";
    }
  }, []);

  const handleCloseBulkAddModal = useCallback(() => {
    setShowBulkAddModal(false);
    resetBulkCsv();
  }, [resetBulkCsv]);

  const downloadSampleCSV = useCallback(() => {
    downloadLocalDndCallBlockSampleCsv();
  }, []);

  const handleFileSelect = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith(".csv")) {
        toast.error("Please select a CSV file");
        return;
      }

      const readVersion = ++csvReadVersionRef.current;
      setCsvFile(file);
      setCsvPreview("");

      try {
        const text = await file.text();
        if (readVersion !== csvReadVersionRef.current) return;
        setCsvPreview(text);
      } catch (err) {
        console.error("Error reading file:", err);
        if (readVersion === csvReadVersionRef.current) {
          toast.error("Failed to read CSV file");
          resetBulkCsv();
        }
      }
    },
    [resetBulkCsv],
  );

  const handleBulkAdd = useCallback(async () => {
    if (!csvFile || !csvPreview) {
      toast.error("Please select a CSV file");
      return;
    }

    setBulkSubmitting(true);
    try {
      const response = await axiosInstance.post<BulkAddLocalDNDResponse>(
        LOCAL_DND_BLOCKS_BULK_ADD_PATH,
        { csv_data: csvPreview },
      );

      if (response.data?.status === "success") {
        toast.success(
          response.data.message ||
            `Successfully added ${response.data.records_added || 0} record(s)`,
        );
        setShowBulkAddModal(false);
        resetBulkCsv();
        invalidateLocalDndLists();
      } else {
        toast.error("Failed to add records");
      }
    } catch (err: unknown) {
      console.error("Error bulk adding records:", err);
      toast.error(
        getLocalDndCallBlockErrorMessage(err, "Failed to add records"),
      );
    } finally {
      setBulkSubmitting(false);
    }
  }, [csvFile, csvPreview, invalidateLocalDndLists, resetBulkCsv]);

  return {
    currentPage,
    recordsPerPage,
    totalPages,
    totalRecords,
    searchQuery,
    setSearchQuery,
    companyFilter,
    setCompanyFilter,
    appliedFilters,
    loading,
    apiData,
    error,
    selectedRecords,
    handleSelectRecord,
    handleSelectAll,
    handleApplyFilters,
    handleResetFilters,
    handleFirstPage,
    handleLastPage,
    handleNextPage,
    handlePrevPage,
    handleRecordsPerPageChange,
    formatDateTime: formatLocalDndBlockDateTime,
    handleBulkDeleteClick,
    setShowBulkAddModal,
    setShowAddModal,
    showAddModal,
    showBulkAddModal,
    formData,
    setFormData,
    submitting,
    handleAddRecord,
    handleCloseModal,
    showDeleteModal,
    setShowDeleteModal,
    showBulkDeleteModal,
    setShowBulkDeleteModal,
    recordToDelete,
    setRecordToDelete,
    deleting,
    handleDeleteClick,
    handleConfirmDelete,
    handleConfirmBulkDelete,
    csvFile,
    csvPreview,
    bulkSubmitting,
    bulkCsvInputRef,
    handleFileSelect,
    handleBulkAdd,
    handleCloseBulkAddModal,
    downloadSampleCSV,
  };
}
