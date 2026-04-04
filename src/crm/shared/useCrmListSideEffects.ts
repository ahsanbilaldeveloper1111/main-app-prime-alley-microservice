import { useCallback, useEffect } from "react";
import { GetHierarchyData } from "@utils/users";
import { ModuleSlug } from "@utils/Helper";
import { getCrmDataTags, getCampaigns } from "@utils/crm";
import { CRM_LIST_PAGE_STATIC_TAGS } from "@utils/crmListPageStaticData";
import moment from "moment";

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
  setExtensions: (v: any) => void;
  setAvailableTags: (v: Array<{ value: string; label: string; id: number }>) => void;
  setAvailableCampaigns: (v: Array<{ value: string; label: string; id: number }>) => void;
  setCampaignsById: (v: any) => void;
  setSelectedItems: (v: number[]) => void;
  setCurrentFilters: (fn: (prev: Record<string, any>) => Record<string, any>) => void;
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

  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData(
          ModuleSlug.CRM_DATA_MANAGEMENT,
        );
        if (hierarchyData?.extensions) {
          setExtensions(hierarchyData.extensions);
        }
      } catch (error) {
        console.error("Failed to fetch extensions:", error);
      }
    };
    fetchExtensions();
  }, []);

  useEffect(() => {
    if (showHistoryModal) {
      fetchHistoryData();
    }
  }, [showHistoryModal, fetchHistoryData]);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await getCrmDataTags();
        const tagOptions = tags
          .filter((tag: any) => tag.id != null)
          .map((tag: any) => ({
            value: tag.name,
            label: tag.name,
            id: tag.id,
          }));
        setAvailableTags(tagOptions);
      } catch (error) {
        console.error("Failed to load tags:", error);
        setAvailableTags(
          CRM_LIST_PAGE_STATIC_TAGS.map((tag) => ({
            value: tag.value,
            label: tag.label,
            id: Number.parseInt(tag.value.replace("tag-", "")) || 0,
          })),
        );
      }
    };
    loadTags();
  }, [refreshKey]);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const campaignsResponse = await getCampaigns({ per_page: 1000 });
        const campaignOptions = campaignsResponse.data.map((campaign: any) => ({
          value: campaign.id.toString(),
          label: campaign.name,
          id: campaign.id,
        }));
        setAvailableCampaigns(campaignOptions);

        const campaignsMap: Record<number, string> = {};
        campaignsResponse.data.forEach((campaign: any) => {
          campaignsMap[campaign.id] = campaign.name;
        });
        setCampaignsById((prev: Record<number, string>) => ({ ...prev, ...campaignsMap }));
      } catch (error) {
        console.error("Failed to load campaigns:", error);
        setAvailableCampaigns([]);
      }
    };
    loadCampaigns();
  }, [refreshKey]);

  useEffect(() => {
    if (activeFilter === "all") {
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.has_scheduled_calls;
        delete newFilters.has_tickets;
        return newFilters;
      });
    } else if (activeFilter === "scheduled") {
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.has_tickets;
        newFilters.has_scheduled_calls = true;
        return newFilters;
      });
    } else if (activeFilter === "has_leads") {
      setCurrentFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.has_scheduled_calls;
        newFilters.has_tickets = true;
        return newFilters;
      });
    }
  }, [activeFilter]);

  useEffect(() => {
    if (clearSelectedRows) {
      setSelectedItems([]);
    }
  }, [clearSelectedRows]);

  const getNameByExtension = useCallback(
    (extension: string) => {
      const extensionData = extensions.find((ext: any) => ext.id === extension);
      return extensionData?.display_name || extensionData?.name || extension;
    },
    [extensions],
  );

  return { getNameByExtension };
}
