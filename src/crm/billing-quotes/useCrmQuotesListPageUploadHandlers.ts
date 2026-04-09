import { useCallback, type Dispatch, type SetStateAction } from "react";
import { toast } from "react-toastify";
import { uploadCrmDataCsv } from "@utils/crm";
import { handleCrmListUploadResponse } from "@crm/shared/crmListUploadResponseUtils";
import { validateCrmListUploadCsvFile } from "@crm/shared/crmListUploadCsvValidation";

type SessionForUpload = { user?: { permissions?: string[] } } | null;

type UploadHandlersParams = {
  session: SessionForUpload;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  setDragActive: (v: boolean) => void;
  fieldTags: readonly any[];
  setFieldTags: Dispatch<SetStateAction<readonly any[]>>;
  setUploading: (v: boolean) => void;
  setUploadProgress: (v: number | ((prev: number) => number)) => void;
  setShowUploadModal: (v: boolean) => void;
  setRefreshKey: (fn: (prev: number) => number) => void;
  setSuccessModalTitle: (t: string) => void;
  setSuccessModalDescription: (d: string) => void;
  setShowSuccessfulModal: (v: boolean) => void;
};

export function useCrmQuotesListPageUploadHandlers({
  session,
  selectedFile,
  setSelectedFile,
  setDragActive,
  fieldTags,
  setFieldTags,
  setUploading,
  setUploadProgress,
  setShowUploadModal,
  setRefreshKey,
  setSuccessModalTitle,
  setSuccessModalDescription,
  setShowSuccessfulModal,
}: UploadHandlersParams) {
  const handleFileSelect = useCallback(
    (file: File) => {
      const validation = validateCrmListUploadCsvFile(file);
      if (validation.isValid) {
        setSelectedFile(file);
        return;
      }
      validation.errors.forEach((error) => toast.error(error));
    },
    [setSelectedFile],
  );

  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    },
    [setDragActive],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [setDragActive, handleFileSelect],
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
    if (!session?.user?.permissions?.includes("add-crm-data-management")) {
      toast.error("You don't have permission to upload data");
      return;
    }
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const tagValues = Array.from(fieldTags).map((tag) => tag.value);
      const response: unknown = await uploadCrmDataCsv(
        selectedFile,
        [],
        tagValues,
        true,
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      handleCrmListUploadResponse(response, "prospects", {
        setSuccessModalTitle,
        setSuccessModalDescription,
        setShowSuccessfulModal,
      });

      setSelectedFile(null);
      setFieldTags([]);
      setShowUploadModal(false);
      setUploadProgress(0);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to upload file. Please try again.";
      toast.error(errorMessage);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  }, [
    session,
    selectedFile,
    fieldTags,
    setUploading,
    setUploadProgress,
    setSelectedFile,
    setFieldTags,
    setShowUploadModal,
    setRefreshKey,
    setSuccessModalTitle,
    setSuccessModalDescription,
    setShowSuccessfulModal,
  ]);

  return {
    handleFileSelect,
    handleDrag,
    handleDrop,
    handleFileInputChange,
    handleUpload,
  };
}
