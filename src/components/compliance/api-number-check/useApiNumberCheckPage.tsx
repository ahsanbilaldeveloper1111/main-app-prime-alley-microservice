import { useSession } from "next-auth/react";
import {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";

import { TableColumn } from "@components/GenericTable";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { CheckNumber, BulkCheckNumber } from "@utils/dncr";

import { NumberCheckDncrStatusBadge } from "./NumberCheckDncrStatusBadge";
import {
  BULK_DNCR_PERMISSION_TOAST,
  createErrorResult,
  getStatusCategory,
  getStatusLabel,
  isValidPhoneNumber,
  MAX_FILE_SIZE_BYTES,
  normalizeDigits,
  parsePhoneNumbers,
  runManualNumberCheck,
  transformCheckResult,
  type ApiResultItem,
  type NumberCheckTableRow,
  type PhoneResult,
} from "./apiNumberCheckDomain";

import "./apiNumberCheckPage.scss";

export interface ApiNumberCheckPageViewModel {
  canBulkCheckDncr: boolean;
  activeTab: "manual" | "csv";
  setActiveTab: (tab: "manual" | "csv") => void;
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
  csvFile: File | null;
  csvInputRef: RefObject<HTMLInputElement | null>;
  csvValidCount: number;
  csvInvalidCount: number;
  handleFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (e: DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: DragEvent<HTMLDivElement>) => void;
  handleDropzoneKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
  onRemoveCsvFile: () => void;
  downloadSampleFile: () => void;
  handleBulkUpload: () => void;
  isUploading: boolean;
  handleDownloadResults: () => void;
  showDownloadResults: boolean;
  disableBulkSubmit: boolean;
  totalNumbers: number;
  deniedCount: number;
  permittedCount: number;
  invalidStatusCount: number;
  hasResults: boolean;
  tableData: NumberCheckTableRow[];
  tableColumns: TableColumn<NumberCheckTableRow>[];
}

export function useApiNumberCheckPage(): ApiNumberCheckPageViewModel {
  const { data: session } = useSession();
  const canBulkCheckDncr =
    session?.user?.permissions?.includes(
      HEADER_CONSTANTS.PERMISSIONS.BULK_CHECK_NUMBERS_DNCR,
    ) ?? false;

  const [activeTab, setActiveTab] = useState<"manual" | "csv">("manual");
  const [manualInput, setManualInput] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [results, setResults] = useState<PhoneResult[]>([]);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [bulkResults, setBulkResults] = useState<Record<
    string,
    ApiResultItem
  > | null>(null);
  const [showFormatGuide, setShowFormatGuide] = useState<boolean>(false);
  const csvInputRef = useRef<HTMLInputElement | null>(null);

  const [csvValidCount, setCsvValidCount] = useState<number>(0);
  const [csvInvalidCount, setCsvInvalidCount] = useState<number>(0);

  const isManualInputValid = useMemo(() => {
    if (!manualInput.trim()) {
      return false;
    }
    const phoneNumbers = parsePhoneNumbers(manualInput);
    if (phoneNumbers.length === 0) {
      return false;
    }
    return phoneNumbers.every((phoneNumber) =>
      isValidPhoneNumber(phoneNumber),
    );
  }, [manualInput]);

  const { validCount, invalidCount } = useMemo(() => {
    if (!manualInput.trim()) {
      return { validCount: 0, invalidCount: 0 };
    }
    const phoneNumbers = parsePhoneNumbers(manualInput);
    let valid = 0;
    let invalid = 0;
    phoneNumbers.forEach((phoneNumber) => {
      if (isValidPhoneNumber(phoneNumber)) {
        valid++;
      } else {
        invalid++;
      }
    });
    return { validCount: valid, invalidCount: invalid };
  }, [manualInput]);

  useEffect(() => {
    if (!canBulkCheckDncr && activeTab === "csv") {
      setActiveTab("manual");
      setCsvFile(null);
      setBulkResults(null);
    }
  }, [canBulkCheckDncr, activeTab]);

  useEffect(() => {
    if (!csvFile) {
      setCsvValidCount(0);
      setCsvInvalidCount(0);
      return;
    }

    let cancelled = false;

    const validateCSV = async () => {
      try {
        const text = await csvFile.text();
        if (cancelled) return;
        if (!text) {
          setCsvValidCount(0);
          setCsvInvalidCount(0);
          return;
        }

        const lines = text
          .split(/\r?\n/)
          .filter((line) => line.trim().length > 0);
        let valid = 0;
        let invalid = 0;

        lines.forEach((line, index) => {
          if (index === 0) {
            const firstValue = line.split(",")[0]?.trim() || "";
            const digitsOnly = normalizeDigits(firstValue);
            if (!digitsOnly.startsWith("05") || digitsOnly.length !== 10) {
              return;
            }
          }

          const phoneNumber = line.split(",")[0]?.trim() || "";
          if (phoneNumber) {
            const digitsOnly = normalizeDigits(phoneNumber);
            if (digitsOnly.startsWith("05") && digitsOnly.length === 10) {
              valid++;
            } else {
              invalid++;
            }
          }
        });

        if (!cancelled) {
          setCsvValidCount(valid);
          setCsvInvalidCount(invalid);
        }
      } catch (error) {
        console.error("Error parsing CSV:", error);
        if (!cancelled) {
          setCsvValidCount(0);
          setCsvInvalidCount(0);
        }
      }
    };

    validateCSV().catch((err) => {
      console.error("Error parsing CSV:", err);
      if (!cancelled) {
        setCsvValidCount(0);
        setCsvInvalidCount(0);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [csvFile]);

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
    setBulkResults(null);

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

  const isAcceptableCsvFile = useCallback(
    (file: File, invalidTypeMessage: string): boolean => {
      const fileExtension = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf("."));
      if (fileExtension !== ".csv") {
        toast.error(invalidTypeMessage);
        return false;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error("File size must be less than 10MB");
        return false;
      }
      return true;
    },
    [],
  );

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>): void => {
    if (!canBulkCheckDncr) {
      toast.error(BULK_DNCR_PERMISSION_TOAST);
      e.target.value = "";
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAcceptableCsvFile(file, "Please select a CSV file")) return;
    setCsvFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    if (!canBulkCheckDncr) {
      toast.error(BULK_DNCR_PERMISSION_TOAST);
      return;
    }
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!isAcceptableCsvFile(file, "Please drop a CSV file")) return;
    setCsvFile(file);
    toast.success(`File "${file.name}" selected successfully`);
  };

  const handleDropzoneKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (!canBulkCheckDncr) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    csvInputRef.current?.click();
  };

  const handleBulkUpload = useCallback(async (): Promise<void> => {
    if (!canBulkCheckDncr) {
      toast.error(BULK_DNCR_PERMISSION_TOAST);
      return;
    }
    if (!csvFile) {
      toast.error("Please select a CSV file");
      return;
    }

    if (!(csvFile instanceof File)) {
      toast.error("Invalid file object");
      return;
    }

    if (csvFile.size === 0) {
      toast.error("The selected file is empty");
      return;
    }

    if (
      !isAcceptableCsvFile(csvFile, "Invalid file type. Please use CSV format")
    ) {
      return;
    }

    setIsUploading(true);
    setBulkResults(null);
    setResults([]);

    try {
      const formData = new FormData();
      formData.append("sheet", csvFile);

      const response = await BulkCheckNumber(formData);

      if (response) {
        setBulkResults(response?.results);
        toast.success("Numbers checked successfully");
      } else {
        toast.error("Failed to check numbers");
      }
    } catch (error: unknown) {
      console.error("Bulk upload error:", error);
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const msg = err.response?.data?.message || err.message;
      toast.error(msg ? `Upload failed: ${msg}` : "Error during bulk upload");
    } finally {
      setIsUploading(false);
    }
  }, [canBulkCheckDncr, csvFile, isAcceptableCsvFile]);

  const clearManualInput = (): void => {
    setManualInput("");
    setResults([]);
    setBulkResults(null);
  };

  const onRemoveCsvFile = (): void => {
    setCsvFile(null);
    setBulkResults(null);
  };

  const downloadSampleFile = (): void => {
    const sampleData = `PhoneNumber
0557044312
0556960535
0556930017
0557067850
0509380627
0551234567
0559876543`;

    const BOM = "\uFEFF";
    const csvContent = BOM + sampleData;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = globalThis.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "api_number_check_sample.csv";
    document.body.appendChild(a);
    a.click();
    globalThis.URL.revokeObjectURL(url);
    a.remove();
  };

  const handleDownloadResults = (): void => {
    if (results.length === 0 && !bulkResults) {
      toast.error("No results to download");
      return;
    }

    let csvContent = "";

    if (bulkResults) {
      csvContent = "Called Number,DNCR Status\n";
      Object.entries(bulkResults).forEach(([, data]) => {
        const statusLabel = getStatusLabel(
          data?.status,
          data?.details?.dncrStatus,
        );
        csvContent += `${data?.details?.accountNumber},${statusLabel}\n`;
      });
    } else if (results.length > 0) {
      csvContent = "Called Number,DNCR Status\n";

      results.forEach((result) => {
        const statusLabel = getStatusLabel(result?.status, result?.dncrStatus);
        csvContent += `${result?.input + "" || result?.accountNumber},${statusLabel}\n`;
      });
    }

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
    const total =
      results.length || (bulkResults ? Object.keys(bulkResults).length : 0);
    let denied = 0;
    let permitted = 0;
    let invalidStatus = 0;

    if (bulkResults) {
      Object.values(bulkResults).forEach((data) => {
        const category = getStatusCategory(
          data?.status,
          data?.details?.dncrStatus,
        );
        if (category === "invalid") invalidStatus++;
        else if (category === "denied") denied++;
        else permitted++;
      });
    } else {
      results.forEach((result: PhoneResult) => {
        const category = getStatusCategory(result?.status, result?.dncrStatus);
        if (category === "invalid") invalidStatus++;
        else if (category === "denied") denied++;
        else permitted++;
      });
    }

    return {
      totalNumbers: total,
      deniedCount: denied,
      permittedCount: permitted,
      invalidStatusCount: invalidStatus,
    };
  }, [bulkResults, results]);

  const tableData = useMemo<NumberCheckTableRow[]>(() => {
    if (bulkResults) {
      return Object.entries(bulkResults).map(([phoneNumber, data], idx: number) => ({
        id: `${phoneNumber}-${idx}`,
        calledNumber: String(data?.details?.accountNumber || phoneNumber || ""),
        status: String(data?.status || ""),
        dncrStatus: data?.details?.dncrStatus,
      }));
    }

    return results.map((result, idx) => ({
      id: `${result.input}-${idx}`,
      calledNumber: String(result?.accountNumber || result?.input || ""),
      status: String(result?.status || ""),
      dncrStatus: result?.dncrStatus,
    }));
  }, [bulkResults, results]);

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

  const hasResults = results.length > 0 || !!bulkResults;
  const showDownloadResults = hasResults;
  const disableBulkSubmit =
    !csvFile || isUploading || csvInvalidCount > 0;

  return {
    canBulkCheckDncr,
    activeTab,
    setActiveTab,
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
    csvFile,
    csvInputRef,
    csvValidCount,
    csvInvalidCount,
    handleFileUpload,
    handleDragOver,
    handleDrop,
    handleDropzoneKeyDown,
    onRemoveCsvFile,
    downloadSampleFile,
    handleBulkUpload,
    isUploading,
    handleDownloadResults,
    showDownloadResults,
    disableBulkSubmit,
    totalNumbers,
    deniedCount,
    permittedCount,
    invalidStatusCount,
    hasResults,
    tableData,
    tableColumns,
  };
}
