import { useRef, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import type { CrmDataItem } from "@utils/crm";
import { useCti } from "../../contexts/CtiContext";

/**
 * Shared CRM list page bootstrap: session, router, CTI, upload/view/delete/assignment
 * shell state duplicated across quotes, companies, contacts-style pages.
 */
export function useCrmListPageCoreState() {
  const { data: session } = useSession();
  const router = useRouter();
  const { dialNumber, isInitialized } = useCti();
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});
  const requestIdRef = useRef(0);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDataItem, setSelectedDataItem] = useState<CrmDataItem | null>(
    null,
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CrmDataItem | null>(null);
  const [showDataAssignmentModal, setShowDataAssignmentModal] =
    useState(false);
  const [showAfterCallModal, setShowAfterCallModal] = useState(false);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<readonly any[]>(
    [],
  );
  const [fieldTags, setFieldTags] = useState<readonly any[]>([]);
  const [assignToCampaignUsers, setAssignToCampaignUsers] = useState(false);
  const [showConvertToLeadModal, setShowConvertToLeadModal] = useState(false);
  const [convertingToLeadCrmRecordId, setConvertingToLeadCrmRecordId] =
    useState<number | null>(null);

  return {
    session,
    router,
    dialNumber,
    isInitialized,
    refreshKey,
    setRefreshKey,
    currentFilters,
    setCurrentFilters,
    requestIdRef,
    uploading,
    setUploading,
    selectedFile,
    setSelectedFile,
    dragActive,
    setDragActive,
    showUploadModal,
    setShowUploadModal,
    uploadProgress,
    setUploadProgress,
    showViewModal,
    setShowViewModal,
    selectedDataItem,
    setSelectedDataItem,
    showDeleteModal,
    setShowDeleteModal,
    itemToDelete,
    setItemToDelete,
    showDataAssignmentModal,
    setShowDataAssignmentModal,
    showAfterCallModal,
    setShowAfterCallModal,
    extensions,
    setExtensions,
    selectedCampaigns,
    setSelectedCampaigns,
    fieldTags,
    setFieldTags,
    assignToCampaignUsers,
    setAssignToCampaignUsers,
    showConvertToLeadModal,
    setShowConvertToLeadModal,
    convertingToLeadCrmRecordId,
    setConvertingToLeadCrmRecordId,
  };
}
