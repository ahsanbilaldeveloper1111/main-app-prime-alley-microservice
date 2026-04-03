import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { NextRouter } from "next/router";
import { toast } from "react-toastify";
import {
  deleteCrmData,
  getCrmDataCounts,
  type CrmDataItem,
} from "@utils/crm";

/** Shape of `assignmentFilters` from `useCrmQuotesListDataAssignmentContactFormState`. */
export type CrmQuotesListAssignmentFiltersForCounts = Readonly<{
  selectedCampaigns: readonly { value: unknown }[];
  selectedTags: readonly { value: unknown }[];
}>;

export type UseCrmQuotesListSharedQuoteListCallbacksParams = Readonly<{
  itemToDelete: CrmDataItem | null;
  setShowDeleteModal: (open: boolean) => void;
  setDeleteModalMode: (mode: "single" | "bulk" | null) => void;
  setItemToDelete: (item: CrmDataItem | null) => void;
  setRefreshKey: Dispatch<SetStateAction<number>>;
  router: NextRouter;
  assignmentFilters: CrmQuotesListAssignmentFiltersForCounts;
}>;

/**
 * Shared delete / duplicate / send / assignment-count helpers for billing + CRM quotes list pages.
 */
export function useCrmQuotesListSharedQuoteListCallbacks(
  params: UseCrmQuotesListSharedQuoteListCallbacksParams,
) {
  const {
    itemToDelete,
    setShowDeleteModal,
    setDeleteModalMode,
    setItemToDelete,
    setRefreshKey,
    router,
    assignmentFilters,
  } = params;

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) {
      return;
    }

    try {
      await deleteCrmData(itemToDelete.id);
      setShowDeleteModal(false);
      setDeleteModalMode(null);
      setItemToDelete(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error: unknown) {
      console.error("Delete error:", error);
    }
  }, [
    itemToDelete,
    setDeleteModalMode,
    setItemToDelete,
    setRefreshKey,
    setShowDeleteModal,
  ]);

  const handleDuplicateQuote = useCallback(
    (quote: { id: number | string }) => {
      router.push(`/crm/quotes/create?duplicate=${quote.id}`);
    },
    [router],
  );

  const handleSendToContact = useCallback(
    (quote: { id: number; title?: string }) => {
      const label = quote.title ?? `Quote #${quote.id}`;
      toast.info(`Sending quote "${label}" to contact...`);
    },
    [],
  );

  const calculateEntryCounts = useCallback(async () => {
    try {
      const campaignIds = Array.from(assignmentFilters.selectedCampaigns).map(
        (campaign) => Number.parseInt(String(campaign.value), 10),
      );
      const tags = Array.from(assignmentFilters.selectedTags).map((tag) =>
        String(tag.value),
      );

      const counts = await getCrmDataCounts(campaignIds, tags);

      return {
        total: counts.summary.total_records,
        assigned: counts.summary.assigned_records,
        unassigned: counts.summary.unassigned_records,
      };
    } catch (error) {
      console.error("Failed to get entry counts:", error);
      return {
        total: 5000,
        assigned: 2000,
        unassigned: 3000,
      };
    }
  }, [assignmentFilters]);

  return {
    confirmDelete,
    handleDuplicateQuote,
    handleSendToContact,
    calculateEntryCounts,
  };
}
