import {
  useCallback,
  useEffect,
  type Dispatch,
  type SetStateAction,
} from "react";
import moment from "moment";
import { getCrmListExtensionDisplayName } from "@crm/shared/crmListExtensionDisplayName";
import { useCrmListActiveTabFiltersEffect } from "@crm/shared/crmListActiveTabFiltersEffect";
import { useCrmListClearSelectedRowsEffect } from "@crm/shared/crmListClearSelectedRowsEffect";
import {
  useCrmListCampaignsOnRefreshEffect,
  useCrmListExtensionsLoadEffect,
  useCrmListHistoryModalOpenEffect,
  useCrmListTagsOnRefreshEffect,
} from "@crm/shared/crmListResourceLoadEffects";

interface UseCrmListSideEffectsParams {
  refreshKey: number;
  showHistoryModal: boolean;
  fetchHistoryData: () => void;
  activeFilter: string;
  clearSelectedRows: boolean;
  showExportModal: boolean;
  currentFilters: Record<string, any>;
  entityName: string;
  extensions: any[];
  setExtensions: Dispatch<SetStateAction<any[]>>;
  setAvailableTags: Dispatch<
    SetStateAction<Array<{ value: string; label: string; id: number }>>
  >;
  setAvailableCampaigns: Dispatch<
    SetStateAction<Array<{ value: string; label: string; id: number }>>
  >;
  setCampaignsById: Dispatch<SetStateAction<Record<number, string>>>;
  setCampaignStatusById?: Dispatch<
    SetStateAction<Record<number, string>>
  >;
  setSelectedItems: Dispatch<SetStateAction<number[]>>;
  setCurrentFilters: Dispatch<SetStateAction<Record<string, any>>>;
  setExportFilters: (v: Record<string, any>) => void;
  setExportFileName: (v: string) => void;
}

export function useCrmListSideEffects({
  refreshKey,
  showHistoryModal,
  fetchHistoryData,
  activeFilter,
  clearSelectedRows,
  showExportModal,
  currentFilters,
  entityName,
  extensions,
  setExtensions,
  setAvailableTags,
  setAvailableCampaigns,
  setCampaignsById,
  setCampaignStatusById,
  setSelectedItems,
  setCurrentFilters,
  setExportFilters,
  setExportFileName,
}: UseCrmListSideEffectsParams) {
  useEffect(() => {
    if (showExportModal) {
      setExportFilters({ ...currentFilters });
      setExportFileName(`${entityName}_${moment().format("YYYY-MM-DD")}`);
    }
  }, [showExportModal, currentFilters]);

  useCrmListExtensionsLoadEffect(setExtensions);
  useCrmListHistoryModalOpenEffect(showHistoryModal, fetchHistoryData);
  useCrmListTagsOnRefreshEffect(refreshKey, setAvailableTags);
  useCrmListCampaignsOnRefreshEffect(
    refreshKey,
    setAvailableCampaigns,
    setCampaignsById,
    "merge",
    setCampaignStatusById,
  );

  useCrmListActiveTabFiltersEffect(activeFilter, setCurrentFilters);
  useCrmListClearSelectedRowsEffect(clearSelectedRows, setSelectedItems);

  const getNameByExtension = useCallback(
    (extension: string) => getCrmListExtensionDisplayName(extensions, extension),
    [extensions],
  );

  return { getNameByExtension };
}
