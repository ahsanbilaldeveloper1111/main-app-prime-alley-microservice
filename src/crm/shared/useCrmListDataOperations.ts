import {
  useCallback,
  useEffect,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "next-auth";
import { toast } from "react-toastify";
import moment from "moment";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import {
  getCrmData,
  uploadCrmDataCsv,
  deleteCrmData,
  type CrmDataItem,
  type CrmDataMetrics,
  type CrmDataResponse,
} from "@utils/crm";
import { handleCrmListUploadResponse } from "@crm/shared/crmListUploadResponseUtils";
import { crmAppKeys } from "../../query/keys";

const { PERMISSIONS } = HEADER_CONSTANTS;

function readAxiosLikeMessage(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const response = (error as { response?: { data?: { message?: unknown } } })
    .response;
  const message = response?.data?.message;
  return typeof message === "string" ? message : undefined;
}

interface CsvValidationResult {
  isValid: boolean;
  errors: string[];
}

interface ExportHeadersResult {
  headers: string[];
  nestedDataKeysSet: Set<string>;
}

interface UseCrmListDataOperationsParams {
  entityName: string;
  memoizedFilters: Record<string, unknown>;
  buildCrmDataParams: (overrides?: {
    page?: number;
    per_page?: number;
  }) => Record<string, unknown>;
  buildExportParams: (
    filters: Record<string, unknown>,
    overrides?: { page?: number; per_page?: number },
  ) => Record<string, unknown>;
  buildExportHeaders: (data: CrmDataItem[]) => ExportHeadersResult;
  buildCsvContent: (
    headers: string[],
    data: CrmDataItem[],
    nestedDataKeysSet: Set<string>,
  ) => string;
  validateUploadCsvFile: (file: File) => CsvValidationResult;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setDataList: Dispatch<SetStateAction<CrmDataItem[]>>;
  setTotalRecords: Dispatch<SetStateAction<number>>;
  setTotalAll: Dispatch<SetStateAction<number>>;
  setMetrics: Dispatch<SetStateAction<CrmDataMetrics>>;
  setExporting: Dispatch<SetStateAction<boolean>>;
  setShowExportModal: Dispatch<SetStateAction<boolean>>;
  setSelectedFile: Dispatch<SetStateAction<File | null>>;
  setFieldTags: Dispatch<SetStateAction<any>>;
  setShowUploadModal: Dispatch<SetStateAction<boolean>>;
  setRefreshKey: Dispatch<SetStateAction<number>>;
  setShowDeleteModal: Dispatch<SetStateAction<boolean>>;
  setDeleteModalMode: Dispatch<SetStateAction<"single" | "bulk" | null>>;
  setItemToDelete: Dispatch<SetStateAction<CrmDataItem | null>>;
  setSelectedItems: Dispatch<SetStateAction<number[]>>;
  setSuccessModalTitle: Dispatch<SetStateAction<string>>;
  setSuccessModalDescription: Dispatch<SetStateAction<string>>;
  setShowSuccessfulModal: Dispatch<SetStateAction<boolean>>;
  exportFileName: string;
  exportFilters: Record<string, unknown>;
  selectedFile: File | null;
  fieldTags: any;
  itemToDelete: CrmDataItem | null;
  session: Session | null;
  refreshKey: number;
  activeFilter: string;
  pagination: {
    currentPage: number;
    rowsPerPage: number;
    sortBy: string;
    sortOrder: string;
  };
  /** Called after a single record is successfully deleted from the list modal. */
  onSingleRecordDeleted?: (deletedId: number) => void;
  /**
   * When true, skips updating `totalAll` from list responses (e.g. prospects “All” total
   * frozen until the user returns to an unfiltered baseline view).
   */
  skipTotalAllUpdate?: boolean;
  /** Invoked after a successful list load with the parsed API payload (not on placeholder data). */
  onListResponse?: (response: CrmDataResponse) => void;
}

export function useCrmListDataOperations({
  entityName,
  memoizedFilters,
  buildCrmDataParams,
  buildExportParams,
  buildExportHeaders,
  buildCsvContent,
  validateUploadCsvFile,
  setLoading,
  setDataList,
  setTotalRecords,
  setTotalAll,
  setMetrics,
  setExporting,
  setShowExportModal,
  setSelectedFile,
  setFieldTags,
  setShowUploadModal,
  setRefreshKey,
  setShowDeleteModal,
  setDeleteModalMode,
  setItemToDelete,
  setSelectedItems,
  setSuccessModalTitle,
  setSuccessModalDescription,
  setShowSuccessfulModal,
  exportFileName,
  exportFilters,
  selectedFile,
  fieldTags,
  itemToDelete,
  session,
  refreshKey,
  activeFilter,
  pagination,
  onSingleRecordDeleted,
  skipTotalAllUpdate = false,
  onListResponse,
}: UseCrmListDataOperationsParams) {
  const queryClient = useQueryClient();

  const filtersKey = useMemo(
    () => JSON.stringify(memoizedFilters),
    [memoizedFilters],
  );

  const crmListQuery = useQuery({
    queryKey: crmAppKeys.crmDataManagementList.list({
      entity: entityName,
      filtersKey,
      activeTab: activeFilter,
      page: pagination.currentPage,
      perPage: pagination.rowsPerPage,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
      refreshKey,
    }),
    queryFn: (): Promise<CrmDataResponse> =>
      getCrmData(buildCrmDataParams()),
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    setLoading(crmListQuery.isPending || crmListQuery.isFetching);
  }, [crmListQuery.isPending, crmListQuery.isFetching, setLoading]);

  useEffect(() => {
    if (crmListQuery.isError) {
      setDataList([]);
      setTotalRecords(0);
      return;
    }
    if (!crmListQuery.data || crmListQuery.isPlaceholderData) return;

    const response = crmListQuery.data;
    setDataList(response.data || []);
    setTotalRecords(response.pagination?.total || 0);

    const totalAllFromMetrics = Number(response?.metrics?.total_all_records);
    if (!skipTotalAllUpdate) {
      if (Number.isFinite(totalAllFromMetrics)) {
        setTotalAll(totalAllFromMetrics);
      } else {
        const isAllTab =
          memoizedFilters.has_scheduled_calls !== true &&
          memoizedFilters.has_tickets !== true;
        if (isAllTab) {
          setTotalAll(response.pagination?.total || 0);
        }
      }
    }

    setMetrics(response.metrics);
    onListResponse?.(response);
  }, [
    crmListQuery.data,
    crmListQuery.isError,
    crmListQuery.isPlaceholderData,
    memoizedFilters.has_scheduled_calls,
    memoizedFilters.has_tickets,
    onListResponse,
    skipTotalAllUpdate,
    setDataList,
    setMetrics,
    setTotalAll,
    setTotalRecords,
  ]);

  const bumpEntityListAndPicklists = useCallback(() => {
    queryClient
      .invalidateQueries({
        queryKey: crmAppKeys.crmDataManagementList.entityRoot(entityName),
      })
      .catch(() => undefined);
    setRefreshKey((prev) => prev + 1);
  }, [entityName, queryClient, setRefreshKey]);

  const fetchCrmData = useCallback(() => {
    queryClient
      .invalidateQueries({
        queryKey: crmAppKeys.crmDataManagementList.entityRoot(entityName),
      })
      .catch(() => undefined);
  }, [entityName, queryClient]);

  const fetchCrmDataForExport = useCallback(
    async (filters: Record<string, unknown>) => {
      const PER_PAGE = 100;
      const allData: CrmDataItem[] = [];
      let page = 1;
      for (;;) {
        const response = await getCrmData(
          buildExportParams(filters, { page, per_page: PER_PAGE }),
        );
        const chunk = response?.data || [];
        allData.push(...chunk);
        if (chunk.length < PER_PAGE) break;
        page += 1;
      }
      return allData;
    },
    [buildExportParams],
  );

  const handleExport = useCallback(async () => {
    const name =
      exportFileName.trim() || `${entityName}_${moment().format("YYYY-MM-DD")}`;
    const ext = name.endsWith(".csv") ? "" : ".csv";
    setExporting(true);
    try {
      const allData = await fetchCrmDataForExport(exportFilters);
      if (allData.length === 0) {
        toast.info(`No ${entityName} match the selected filters.`);
        return;
      }
      const { headers, nestedDataKeysSet } = buildExportHeaders(allData);
      const csvContent = buildCsvContent(headers, allData, nestedDataKeysSet);

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name + ext;
      a.click();
      globalThis.URL.revokeObjectURL(url);
      setShowExportModal(false);
      toast.success(`Exported ${allData.length} ${entityName} successfully!`);
    } catch {
      toast.error(`Failed to export ${entityName}`);
    } finally {
      setExporting(false);
    }
  }, [
    entityName,
    exportFileName,
    exportFilters,
    fetchCrmDataForExport,
    buildExportHeaders,
    buildCsvContent,
    setExporting,
    setShowExportModal,
  ]);

  const handleFileSelect = useCallback(
    (file: File) => {
      const validation = validateUploadCsvFile(file);
      if (validation.isValid) {
        setSelectedFile(file);
      } else {
        validation.errors.forEach((error) => toast.error(error));
      }
    },
    [validateUploadCsvFile, setSelectedFile],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const handleUpload = useCallback(async () => {
    if (
      !session?.user?.permissions?.includes(
        PERMISSIONS.CREATE_CRM_DATA_MANAGEMENT,
      )
    ) {
      toast.error("You don't have permission to upload data");
      return;
    }

    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      const tagValues = Array.from(fieldTags).map((tag: any) => tag.value);

      const response = await uploadCrmDataCsv(
        selectedFile,
        [],
        tagValues,
        true,
      );

      handleCrmListUploadResponse(response, entityName, {
        setSuccessModalTitle,
        setSuccessModalDescription,
        setShowSuccessfulModal,
      });

      setSelectedFile(null);
      setFieldTags([]);
      setShowUploadModal(false);

      bumpEntityListAndPicklists();
    } catch (error: unknown) {
      console.error("Upload error:", error);
      const errorMessage =
        readAxiosLikeMessage(error) ||
        (error instanceof Error ? error.message : "") ||
        "Failed to upload file. Please try again.";
      toast.error(errorMessage);
    }
  }, [
    bumpEntityListAndPicklists,
    entityName,
    fieldTags,
    selectedFile,
    session?.user?.permissions,
    setFieldTags,
    setSelectedFile,
    setShowSuccessfulModal,
    setShowUploadModal,
    setSuccessModalDescription,
    setSuccessModalTitle,
  ]);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      const deletedId = itemToDelete.id;
      await deleteCrmData(deletedId);
      setShowDeleteModal(false);
      setDeleteModalMode(null);
      setItemToDelete(null);
      onSingleRecordDeleted?.(deletedId);
      bumpEntityListAndPicklists();
    } catch (error: unknown) {
      console.error("Delete error:", error);
    }
  }, [
    bumpEntityListAndPicklists,
    itemToDelete,
    onSingleRecordDeleted,
    setDeleteModalMode,
    setItemToDelete,
    setShowDeleteModal,
  ]);

  return {
    fetchCrmData,
    fetchCrmDataForExport,
    handleExport,
    handleFileSelect,
    handleFileInputChange,
    handleUpload,
    confirmDelete,
  };
}
