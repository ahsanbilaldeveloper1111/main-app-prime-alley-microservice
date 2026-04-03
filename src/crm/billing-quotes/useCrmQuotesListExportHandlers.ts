import { useCallback, useEffect, type Dispatch, type SetStateAction } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import {
  buildCrmListExportCrmDataParams,
} from "@crm/shared/crmListCrmQueryParams";
import {
  buildCrmListCsvContent,
  buildCrmListExportHeaders,
} from "@crm/shared/crmListPageExportCsv";
import { getCrmData, type CrmDataItem } from "@utils/crm";

export type UseCrmQuotesListExportHandlersParams = {
  exportFileName: string;
  exportFilters: Record<string, any>;
  currentFilters: Record<string, any>;
  showExportModal: boolean;
  setExporting: Dispatch<SetStateAction<boolean>>;
  setExportFilters: Dispatch<SetStateAction<Record<string, any>>>;
  setExportFileName: Dispatch<SetStateAction<string>>;
  setShowExportModal: Dispatch<SetStateAction<boolean>>;
};

export function useCrmQuotesListExportHandlers(
  params: UseCrmQuotesListExportHandlersParams,
) {
  const {
    exportFileName,
    exportFilters,
    currentFilters,
    showExportModal,
    setExporting,
    setExportFilters,
    setExportFileName,
    setShowExportModal,
  } = params;

  const fetchCrmDataForExport = useCallback(
    async (filters: Record<string, any>) => {
      const PER_PAGE = 100;
      const allData: CrmDataItem[] = [];
      let page = 1;
      for (;;) {
        const response = await getCrmData(
          buildCrmListExportCrmDataParams(filters, {
            page,
            per_page: PER_PAGE,
          }),
        );
        const chunk = response?.data || [];
        allData.push(...chunk);
        if (chunk.length < PER_PAGE) break;
        page += 1;
      }
      return allData;
    },
    [],
  );

  const handleProspectsExport = useCallback(async () => {
    const name =
      exportFileName.trim() || `quotes_${moment().format("YYYY-MM-DD")}`;
    const ext = name.endsWith(".csv") ? "" : ".csv";
    setExporting(true);
    try {
      const allData = await fetchCrmDataForExport(exportFilters);
      if (allData.length === 0) {
        toast.info("No quotes match the selected filters.");
        return;
      }
      const { headers, nestedDataKeysSet } = buildCrmListExportHeaders(allData);
      const csvContent = buildCrmListCsvContent(
        headers,
        allData,
        nestedDataKeysSet,
      );
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name + ext;
      a.click();
      globalThis.URL.revokeObjectURL(url);
      setShowExportModal(false);
      toast.success(`Exported ${allData.length} rows successfully!`);
    } catch {
      toast.error("Failed to export");
    } finally {
      setExporting(false);
    }
  }, [
    exportFileName,
    exportFilters,
    fetchCrmDataForExport,
    setExporting,
    setShowExportModal,
  ]);

  useEffect(() => {
    if (!showExportModal) return;
    setExportFilters({ ...currentFilters });
    setExportFileName(`quotes_${moment().format("YYYY-MM-DD")}`);
  }, [showExportModal, currentFilters, setExportFilters, setExportFileName]);

  return { handleProspectsExport, fetchCrmDataForExport };
}
