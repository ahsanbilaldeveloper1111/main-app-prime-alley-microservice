import type { Dispatch, SetStateAction } from "react";
import {
  useCrmListCampaignsOnRefreshEffect,
  useCrmListExtensionsLoadEffect,
  useCrmListHistoryModalOpenEffect,
  useCrmListTagsOnRefreshEffect,
} from "@crm/shared/crmListResourceLoadEffects";

type SetExtensions = Dispatch<SetStateAction<any[]>>;
type SetTags = Dispatch<SetStateAction<any>>;
type SetCampaigns = Dispatch<SetStateAction<any>>;
type SetCampaignsById = Dispatch<SetStateAction<Record<number, string>>>;

export function useCrmQuotesListExtensionsEffect(setExtensions: SetExtensions) {
  useCrmListExtensionsLoadEffect(setExtensions);
}

export function useCrmQuotesListHistoryModalEffect(
  showHistoryModal: boolean,
  fetchHistoryData: () => void | Promise<void>,
) {
  useCrmListHistoryModalOpenEffect(showHistoryModal, fetchHistoryData);
}

export function useCrmQuotesListTagsEffect(
  refreshKey: number,
  setAvailableTags: SetTags,
) {
  useCrmListTagsOnRefreshEffect(refreshKey, setAvailableTags);
}

/** Replaces the full campaigns map on each load (quotes list behavior). */
export function useCrmQuotesListCampaignsEffect(
  refreshKey: number,
  setAvailableCampaigns: SetCampaigns,
  setCampaignsById: SetCampaignsById,
) {
  useCrmListCampaignsOnRefreshEffect(
    refreshKey,
    setAvailableCampaigns,
    setCampaignsById,
    "replace",
  );
}
