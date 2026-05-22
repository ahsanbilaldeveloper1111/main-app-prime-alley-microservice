import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { TableColumn } from "@components/GenericTable";
import { CheckNumber } from "@utils/dncr";

import { NumberCheckDncrStatusBadge } from "./NumberCheckDncrStatusBadge";
import {
  createErrorResult,
  getStatusCategory,
  getStatusLabel,
  isValidPhoneNumber,
  parsePhoneNumbers,
  runManualNumberCheck,
  transformCheckResult,
  type NumberCheckTableRow,
  type PhoneResult,
} from "./apiNumberCheckDomain";

import "./apiNumberCheckPage.scss";

export interface ApiNumberCheckPageViewModel {
  showFormatGuide: boolean;
  setShowFormatGuide: (show: boolean) => void;
  manualInput: string;
  setManualInput: (value: string) => void;
  isManualInputValid: boolean;
  validCount: number;
  invalidCount: number;
  isChecking: boolean;
  handleCheckNumbers: () => void;
  clearManualInput: () => void;
  handleDownloadResults: () => void;
  showDownloadResults: boolean;
  totalNumbers: number;
  deniedCount: number;
  permittedCount: number;
  invalidStatusCount: number;
  hasResults: boolean;
  tableData: NumberCheckTableRow[];
  tableColumns: TableColumn<NumberCheckTableRow>[];
}

export function useApiNumberCheckPage(): ApiNumberCheckPageViewModel {
  const [manualInput, setManualInput] = useState<string>("");
  const [results, setResults] = useState<PhoneResult[]>([]);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [showFormatGuide, setShowFormatGuide] = useState<boolean>(false);

  const isManualInputValid = useMemo(() => {
    if (!manualInput.trim()) {
      return false;
    }
    const phoneNumbers = parsePhoneNumbers(manualInput);
    if (phoneNumbers.length !== 1) {
      return false;
    }
    return isValidPhoneNumber(phoneNumbers[0]);
  }, [manualInput]);

  const { validCount, invalidCount } = useMemo(() => {
    if (!manualInput.trim()) {
      return { validCount: 0, invalidCount: 0 };
    }
    const phoneNumbers = parsePhoneNumbers(manualInput);
    if (phoneNumbers.length > 1) {
      return { validCount: 0, invalidCount: phoneNumbers.length };
    }
    if (phoneNumbers.length === 1) {
      return isValidPhoneNumber(phoneNumbers[0])
        ? { validCount: 1, invalidCount: 0 }
        : { validCount: 0, invalidCount: 1 };
    }
    return { validCount: 0, invalidCount: 0 };
  }, [manualInput]);

  const checkSingleNumber = useCallback(
    async (phoneNumber: string): Promise<PhoneResult> => {
      try {
        const response = await CheckNumber(phoneNumber);
        return transformCheckResult(phoneNumber, response);
      } catch (error) {
        console.error(`Error checking ${phoneNumber}:`, error);
        return createErrorResult(phoneNumber, "Check failed");
      }
    },
    [],
  );

  const handleCheckNumbers = useCallback(async (): Promise<void> => {
    setIsChecking(true);
    setResults([]);

    try {
      const nextResults = await runManualNumberCheck(
        manualInput,
        checkSingleNumber,
      );
      if (nextResults) setResults(nextResults);
    } catch (error) {
      console.error("Error checking numbers:", error);
      toast.error("Error checking numbers");
    } finally {
      setIsChecking(false);
    }
  }, [manualInput, checkSingleNumber]);

  const clearManualInput = (): void => {
    setManualInput("");
    setResults([]);
  };

  const handleDownloadResults = (): void => {
    if (results.length === 0) {
      toast.error("No results to download");
      return;
    }

    let csvContent = "Called Number,DNCR Status\n";

    results.forEach((result) => {
      const statusLabel = getStatusLabel(result?.status, result?.dncrStatus);
      csvContent += `${result?.input + "" || result?.accountNumber},${statusLabel}\n`;
    });

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8" });
    const url = globalThis.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `api_number_check_results_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    globalThis.URL.revokeObjectURL(url);
    a.remove();
    toast.success("Results downloaded successfully");
  };

  const {
    totalNumbers,
    deniedCount,
    permittedCount,
    invalidStatusCount,
  } = useMemo(() => {
    let denied = 0;
    let permitted = 0;
    let invalidStatus = 0;

    results.forEach((result: PhoneResult) => {
      const category = getStatusCategory(result?.status, result?.dncrStatus);
      if (category === "invalid") invalidStatus++;
      else if (category === "denied") denied++;
      else permitted++;
    });

    return {
      totalNumbers: results.length,
      deniedCount: denied,
      permittedCount: permitted,
      invalidStatusCount: invalidStatus,
    };
  }, [results]);

  const tableData = useMemo<NumberCheckTableRow[]>(
    () =>
      results.map((result, idx) => ({
        id: `${result.input}-${idx}`,
        calledNumber: String(result?.accountNumber || result?.input || ""),
        status: String(result?.status || ""),
        dncrStatus: result?.dncrStatus,
      })),
    [results],
  );

  const tableColumns = useMemo<TableColumn<NumberCheckTableRow>[]>(
    () => [
      {
        key: "calledNumber",
        label: "CALLED NUMBER",
        type: "custom",
        sortable: false,
        render: (row) => <strong>{row.calledNumber || "--"}</strong>,
      },
      {
        key: "status",
        label: "DNCR STATUS",
        type: "custom",
        sortable: false,
        render: (row) => (
          <NumberCheckDncrStatusBadge
            status={row.status}
            dncrStatus={row.dncrStatus}
          />
        ),
      },
    ],
    [],
  );

  const hasResults = results.length > 0;
  const showDownloadResults = hasResults;

  return {
    showFormatGuide,
    setShowFormatGuide,
    manualInput,
    setManualInput,
    isManualInputValid,
    validCount,
    invalidCount,
    isChecking,
    handleCheckNumbers,
    clearManualInput,
    handleDownloadResults,
    showDownloadResults,
    totalNumbers,
    deniedCount,
    permittedCount,
    invalidStatusCount,
    hasResults,
    tableData,
    tableColumns,
  };
}
