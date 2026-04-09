import { useState } from "react";

/**
 * View-modal wiring for CRM list pages that surface call recordings from the row modal.
 * Single implementation for quotes and prospects/contacts list pages (Sonar DRY).
 */
export function useCrmListCallRecordingViewModalState() {
  const [callRecordings] = useState<any[]>([]);
  const [callRecordingsLoading] = useState(false);
  const [callRecordingsTotal] = useState(0);
  const [selectedRecording, setSelectedRecording] = useState<any>(null);
  const [showRecordingPlayerModal, setShowRecordingPlayerModal] =
    useState(false);
  const [downloadingRecordings, setDownloadingRecordings] = useState<
    Set<string>
  >(new Set());
  const [downloadProgress, setDownloadProgress] = useState<
    Record<string, number>
  >({});

  return {
    callRecordings,
    callRecordingsLoading,
    callRecordingsTotal,
    selectedRecording,
    setSelectedRecording,
    showRecordingPlayerModal,
    setShowRecordingPlayerModal,
    downloadingRecordings,
    setDownloadingRecordings,
    downloadProgress,
    setDownloadProgress,
  };
}
