import { useEffect, type Dispatch, type SetStateAction } from "react";
import { ModuleSlug } from "@utils/Helper";
import { GetHierarchyData } from "@utils/users";
import {
  type CampaignData,
  CRM_CAMPAIGNS_LIST_ACTIVE_ONLY,
  getCrmDataTags,
  getCampaigns,
} from "@utils/crm";
import { CRM_LIST_PAGE_STATIC_TAGS } from "@utils/crmListPageStaticData";

export type CrmListTagOption = { value: string; label: string; id: number };

type SetExtensions = Dispatch<SetStateAction<any[]>>;
type SetAvailableTags = Dispatch<SetStateAction<CrmListTagOption[]>>;
type SetAvailableCampaigns = Dispatch<
  SetStateAction<Array<{ value: string; label: string; id: number }>>
>;
type SetCampaignsById = Dispatch<SetStateAction<Record<number, string>>>;
type SetCampaignStatusById = Dispatch<
  SetStateAction<Record<number, string>>
>;

export function useCrmListExtensionsLoadEffect(setExtensions: SetExtensions) {
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
    void fetchExtensions();
  }, [setExtensions]);
}

function mapTagsToOptionsStrict(
  tags: Array<{ id?: unknown; name: string }>,
): CrmListTagOption[] {
  return tags
    .filter((tag) => tag.id != null)
    .map((tag) => ({
      value: tag.name,
      label: tag.name,
      id: tag.id as number,
    }));
}

/** Mirrors legacy list pages that mapped every tag without filtering on `id`. */
function mapTagsToOptionsAllIds(
  tags: Array<{ id?: unknown; name: string }>,
): CrmListTagOption[] {
  return tags.map((tag) => ({
    value: tag.name,
    label: tag.name,
    id: tag.id as number,
  }));
}

function staticTagsFallback(): CrmListTagOption[] {
  return CRM_LIST_PAGE_STATIC_TAGS.map((tag) => ({
    value: tag.value,
    label: tag.label,
    id: Number.parseInt(tag.value.replace("tag-", ""), 10) || 0,
  }));
}

export function useCrmListTagsOnRefreshEffect(
  refreshKey: number,
  setAvailableTags: SetAvailableTags,
  options?: { mapMode?: "strict" | "includeAll" },
) {
  const mapMode = options?.mapMode ?? "strict";

  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await getCrmDataTags();
        const tagOptions =
          mapMode === "includeAll"
            ? mapTagsToOptionsAllIds(tags)
            : mapTagsToOptionsStrict(tags);
        setAvailableTags(tagOptions);
      } catch (error) {
        console.error("Failed to load tags:", error);
        setAvailableTags(staticTagsFallback());
      }
    };
    void loadTags();
  }, [refreshKey, setAvailableTags, mapMode]);
}

export type CampaignsByIdUpdateMode = "merge" | "replace";

export function useCrmListCampaignsOnRefreshEffect(
  refreshKey: number,
  setAvailableCampaigns: SetAvailableCampaigns,
  setCampaignsById: SetCampaignsById,
  campaignsByIdMode: CampaignsByIdUpdateMode = "merge",
  setCampaignStatusById?: SetCampaignStatusById,
) {
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const campaignsResponse = await getCampaigns({
          per_page: 1000,
          filters: CRM_CAMPAIGNS_LIST_ACTIVE_ONLY,
        });
        const campaignOptions = campaignsResponse.data.map(
          (campaign: { id: number; name: string }) => ({
            value: campaign.id.toString(),
            label: campaign.name,
            id: campaign.id,
          }),
        );
        setAvailableCampaigns(campaignOptions);

        const campaignsMap: Record<number, string> = {};
        const statusMap: Record<number, string> = {};
        campaignsResponse.data.forEach((campaign: CampaignData) => {
          campaignsMap[campaign.id] = campaign.name;
          if (campaign.status != null) {
            statusMap[campaign.id] = campaign.status;
          }
        });

        if (campaignsByIdMode === "merge") {
          setCampaignsById((prev: Record<number, string>) => ({
            ...prev,
            ...campaignsMap,
          }));
        } else {
          setCampaignsById(campaignsMap);
        }

        if (setCampaignStatusById) {
          if (campaignsByIdMode === "merge") {
            setCampaignStatusById((prev: Record<number, string>) => ({
              ...prev,
              ...statusMap,
            }));
          } else {
            setCampaignStatusById(statusMap);
          }
        }
      } catch (error) {
        console.error("Failed to load campaigns:", error);
        setAvailableCampaigns([]);
      }
    };
    void loadCampaigns();
  }, [
    refreshKey,
    setAvailableCampaigns,
    setCampaignsById,
    campaignsByIdMode,
    setCampaignStatusById,
  ]);
}

export function useCrmListHistoryModalOpenEffect(
  showHistoryModal: boolean,
  fetchHistoryData: () => void | Promise<void>,
) {
  useEffect(() => {
    if (!showHistoryModal) return;
    void fetchHistoryData();
  }, [showHistoryModal, fetchHistoryData]);
}
