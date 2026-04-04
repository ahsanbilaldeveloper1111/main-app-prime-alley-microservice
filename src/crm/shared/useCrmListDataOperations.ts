import { useCallback, useEffect, type Dispatch, type RefObject, type SetStateAction } from "react";
import { toast } from "react-toastify";
import moment from "moment";
import { getCrmData, uploadCrmDataCsv, deleteCrmData, CrmDataItem } from "@utils/crm";
import { handleCrmListUploadResponse } from "@crm/shared/crmListUploadResponseUtils";

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
  requestIdRef: RefObject<number>;
  memoizedFilters: Record<string, any>;
  buildCrmDataParams: (overrides?: { page?: number; per_page?: number }) => Record<string, any>;
  buildExportParams: (filters: Record<string, any>, overrides?: { page?: number; per_page?: number }) => Record<string, any>;
  buildExportHeaders: (data: CrmDataItem[]) => ExportHeadersResult;
  buildCsvContent: (headers: string[], data: CrmDataItem[], nestedDataKeysSet: Set<string>) => string;
  validateUploadCsvFile: (file: File) => CsvValidationResult;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setDataList: Dispatch<SetStateAction<CrmDataItem[]>>;
  setTotalRecords: Dispatch<SetStateAction<number>>;
  setTotalAll: Dispatch<SetStateAction<number>>;
  setMetrics: Dispatch<SetStateAction<any>>;
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
  exportFilters: Record<string, any>;
  selectedFile: File | null;
  fieldTags: any;
  itemToDelete: CrmDataItem | null;
  session: any;
  refreshKey: number;
}

export function useCrmListDataOperations({
  entityName,
  requestIdRef,
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
}: UseCrmListDataOperationsParams) {
  const fetchCrmDataForExport = useCallback(
    async (filters: Record<string, any>) => {
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
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name + ext;
      a.click();
      window.URL.revokeObjectURL(url);
      setShowExportModal(false);
      toast.success(`Exported ${allData.length} ${entityName} successfully!`);
    } catch {
      toast.error(`Failed to export ${entityName}`);
    } finally {
      setExporting(false);
    }
  }, [entityName, exportFileName, exportFilters, fetchCrmDataForExport, buildExportHeaders, buildCsvContent]);

  const fetchCrmData = useCallback(async () => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    setLoading(true);
    try {
      const response = await getCrmData(buildCrmDataParams());

      if (currentRequestId !== requestIdRef.current) return;

      setDataList(response.data || []);
      setTotalRecords(response.pagination.total || 0);

      const isAll =
        memoizedFilters.has_scheduled_calls !== true &&
        memoizedFilters.has_tickets !== true;
      if (isAll) {
        setTotalAll(response.pagination.total || 0);
      }

      setMetrics(response.metrics || {});
    } catch (error: any) {
      if (currentRequestId !== requestIdRef.current) return;
      console.error("Failed to fetch CRM data:", error);
      setDataList([]);
      setTotalRecords(0);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [buildCrmDataParams]);

  useEffect(() => {
    fetchCrmData();
  }, [fetchCrmData, refreshKey]);

  const handleFileSelect = useCallback(
    (file: File) => {
      const validation = validateUploadCsvFile(file);
      if (validation.isValid) {
        setSelectedFile(file);
      } else {
        validation.errors.forEach((error) => toast.error(error));
      }
    },
    [validateUploadCsvFile],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    },
    [handleFileSelect],
  );

  const handleUpload = useCallback(async () => {
    if (!session?.user?.permissions?.includes("add-crm-data-management")) {
      toast.error("You don't have permission to upload data");
      return;
    }

    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      const tagValues = Array.from(fieldTags).map((tag: any) => tag.value);

      const response: any = await uploadCrmDataCsv(
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

      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to upload file. Please try again.";
      toast.error(errorMessage);
    }
  }, [session, selectedFile, fieldTags, entityName]);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      await deleteCrmData(itemToDelete.id);
      setShowDeleteModal(false);
      setDeleteModalMode(null);
      setItemToDelete(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Delete error:", error);
    }
  }, [itemToDelete]);

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
