import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { BulkCheckNumber, CheckNumber } from "@utils/dncr";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import React, {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useCallback,
  useRef,
  useState,
} from "react";

import {
  bulkFileValidationToastMessage,
  downloadCheckNumberSampleFile,
  isValidPhoneCharacter,
  isValidPhoneInput,
  validateBulkCsvFile,
  type BulkCheckResultValue,
  type CheckNumberResultRow,
} from "./checkNumberDomain";

function normalizeCheckNumberResponse(
  response: unknown,
): CheckNumberResultRow[] | null {
  if (response === false || response == null) {
    return null;
  }
  if (Array.isArray(response)) {
    return response as CheckNumberResultRow[];
  }
  if (typeof response === "object") {
    return [response as CheckNumberResultRow];
  }
  return null;
}

export interface CheckNumberPageViewModel {
  canBulkUpload: boolean;
  phoneNumber: string;
  isChecking: boolean;
  checkResultRows: CheckNumberResultRow[] | null;
  bulkResults: Record<string, BulkCheckResultValue> | null;
  handleCheckNumber: (e: FormEvent) => Promise<void>;
  handleClearAll: () => void;
  onPhoneChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onPhoneKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  showBulkUploadModal: boolean;
  setShowBulkUploadModal: (show: boolean) => void;
  bulkFile: File | null;
  setBulkFile: (f: File | null) => void;
  isUploading: boolean;
  handleBulkUpload: () => Promise<void>;
  handleFileDrop: (e: DragEvent<HTMLElement>) => void;
  handleDragOver: (e: DragEvent<HTMLElement>) => void;
  handleFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  bulkFileInputRef: React.RefObject<HTMLInputElement | null>;
  openBulkFilePicker: () => void;
  downloadSampleFile: () => void;
}

export function useCheckNumberPage(): CheckNumberPageViewModel {
  const { data: session } = useSession();
  const canBulkUpload =
    session?.user?.permissions?.includes(
      HEADER_CONSTANTS.PERMISSIONS.BULK_CHECK_NUMBERS_DNCR,
    ) ?? false;

  const [phoneNumber, setPhoneNumber] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [checkResultRows, setCheckResultRows] = useState<
    CheckNumberResultRow[] | null
  >(null);

  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState<Record<
    string,
    BulkCheckResultValue
  > | null>(null);

  const bulkFileInputRef = useRef<HTMLInputElement | null>(null);

  const applyValidatedBulkFile = useCallback(
    (file: File, notifySuccess: boolean) => {
      const err = validateBulkCsvFile(file);
      if (err) {
        toast.error(bulkFileValidationToastMessage(err));
        return;
      }
      setBulkFile(file);
      if (notifySuccess) {
        toast.success(`File "${file.name}" selected successfully`);
      }
    },
    [],
  );

  const handleCheckNumber = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!phoneNumber.trim()) {
        toast.error("Please enter a phone number");
        return;
      }

      setIsChecking(true);
      setCheckResultRows(null);

      try {
        const response = await CheckNumber(phoneNumber);
        const rows = normalizeCheckNumberResponse(response);
        if (rows === null) {
          toast.error("No results found for this phone number");
        } else {
          setCheckResultRows(rows);
        }
      } catch {
        toast.error("Error checking number status");
      } finally {
        setIsChecking(false);
      }
    },
    [phoneNumber],
  );

  const handleBulkUpload = useCallback(async () => {
    if (!bulkFile) {
      toast.error("Please select a file");
      return;
    }

    const err = validateBulkCsvFile(bulkFile);
    if (err) {
      toast.error(bulkFileValidationToastMessage(err));
      return;
    }

    setIsUploading(true);
    setBulkResults(null);

    try {
      const formData = new FormData();
      formData.append("sheet", bulkFile);

      const response = await BulkCheckNumber(formData);

      if (!response) {
        toast.error("Failed to check numbers");
        return;
      }

      setBulkResults(response as Record<string, BulkCheckResultValue>);
      setShowBulkUploadModal(false);
    } catch (error: unknown) {
      console.error("Bulk upload error:", error);
      const errObj = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      if (errObj.response?.data?.message) {
        toast.error(errObj.response.data.message);
      } else if (errObj.message) {
        toast.error(`Upload failed: ${errObj.message}`);
      } else {
        toast.error("Error during bulk upload");
      }
    } finally {
      setIsUploading(false);
    }
  }, [bulkFile]);

  const handleFileDrop = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length === 0) return;
      applyValidatedBulkFile(files[0], true);
    },
    [applyValidatedBulkFile],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
  }, []);

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        applyValidatedBulkFile(files[0], false);
      }
    },
    [applyValidatedBulkFile],
  );

  const onPhoneChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || isValidPhoneInput(value)) {
      setPhoneNumber(value);
    }
  }, []);

  const onPhoneKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const { key } = e;
      if (key.length !== 1) return;
      if (!isValidPhoneCharacter(key)) {
        e.preventDefault();
      }
    },
    [],
  );

  const handleClearAll = useCallback(() => {
    setPhoneNumber("");
    setCheckResultRows(null);
    setBulkFile(null);
    setBulkResults(null);
    setIsChecking(false);
    setIsUploading(false);
  }, []);

  const openBulkFilePicker = useCallback(() => {
    bulkFileInputRef.current?.click();
  }, []);

  const downloadSampleFile = useCallback(() => {
    downloadCheckNumberSampleFile();
  }, []);

  return {
    canBulkUpload,
    phoneNumber,
    isChecking,
    checkResultRows,
    bulkResults,
    handleCheckNumber,
    handleClearAll,
    onPhoneChange,
    onPhoneKeyPress,
    showBulkUploadModal,
    setShowBulkUploadModal,
    bulkFile,
    setBulkFile,
    isUploading,
    handleBulkUpload,
    handleFileDrop,
    handleDragOver,
    handleFileSelect,
    bulkFileInputRef,
    openBulkFilePicker,
    downloadSampleFile,
  };
}
