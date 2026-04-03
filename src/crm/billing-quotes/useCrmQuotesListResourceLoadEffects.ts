import { useEffect, type Dispatch, type SetStateAction } from "react";
import { ModuleSlug } from "@utils/Helper";
import { GetHierarchyData } from "@utils/users";
import { getCrmDataTags, getCampaigns } from "@utils/crm";
import { CRM_LIST_PAGE_STATIC_TAGS } from "@utils/crmListPageStaticData";

type SetExtensions = Dispatch<SetStateAction<any[]>>;
type SetTags = Dispatch<SetStateAction<any>>;
type SetCampaigns = Dispatch<SetStateAction<any>>;
type SetCampaignsById = Dispatch<SetStateAction<Record<number, string>>>;

export function useCrmQuotesListExtensionsEffect(setExtensions: SetExtensions) {
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
  }, [setExtensions]);
}

export function useCrmQuotesListHistoryModalEffect(
  showHistoryModal: boolean,
  fetchHistoryData: () => void | Promise<void>,
) {
  useEffect(() => {
    if (!showHistoryModal) return;
    void fetchHistoryData();
  }, [showHistoryModal, fetchHistoryData]);
}

export function useCrmQuotesListTagsEffect(
  refreshKey: number,
  setAvailableTags: SetTags,
) {
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await getCrmDataTags();
        const tagOptions = tags
          .filter((tag: { id?: unknown }) => tag.id != null)
          .map((tag: { name: string; id: number }) => ({
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
            id: Number.parseInt(tag.value.replace("tag-", ""), 10) || 0,
          })),
        );
      }
    };
    void loadTags();
  }, [refreshKey, setAvailableTags]);
}

export function useCrmQuotesListCampaignsEffect(
  refreshKey: number,
  setAvailableCampaigns: SetCampaigns,
  setCampaignsById: SetCampaignsById,
) {
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const campaignsResponse = await getCampaigns({ per_page: 1000 });
        const campaignOptions = campaignsResponse.data.map(
          (campaign: { id: number; name: string }) => ({
            value: campaign.id.toString(),
            label: campaign.name,
            id: campaign.id,
          }),
        );
        setAvailableCampaigns(campaignOptions);

        const campaignsMap: Record<number, string> = {};
        campaignsResponse.data.forEach((campaign: { id: number; name: string }) => {
          campaignsMap[campaign.id] = campaign.name;
        });
        setCampaignsById(campaignsMap);
      } catch (error) {
        console.error("Failed to load campaigns:", error);
        setAvailableCampaigns([]);
      }
    };
    void loadCampaigns();
  }, [refreshKey, setAvailableCampaigns, setCampaignsById]);
}
