import { useCallback, useState } from "react";
import { getDealFollowUps, getDealMeetings } from "@utils/crm";

export function useCrmDealMeetingsAndFollowUps() {
  const [dealMeetings, setDealMeetings] = useState<any[]>([]);
  const [loadingDealMeetings, setLoadingDealMeetings] = useState(false);
  const [dealFollowUps, setDealFollowUps] = useState<any[]>([]);
  const [loadingDealFollowUps, setLoadingDealFollowUps] = useState(false);

  const fetchDealMeetings = useCallback(async (dealId: number) => {
    try {
      setLoadingDealMeetings(true);
      const res = await getDealMeetings({ deal_id: dealId });
      setDealMeetings(res?.data || []);
    } catch (error) {
      console.error("Failed to fetch deal meetings:", error);
    } finally {
      setLoadingDealMeetings(false);
    }
  }, []);

  const fetchDealFollowUps = useCallback(async (dealId: number) => {
    try {
      setLoadingDealFollowUps(true);
      const list = await getDealFollowUps(dealId);
      setDealFollowUps(Array.isArray(list) ? list : []);
    } catch {
      /* optional enrichment; sidebar still works without follow-ups */
    } finally {
      setLoadingDealFollowUps(false);
    }
  }, []);

  return {
    dealMeetings,
    loadingDealMeetings,
    fetchDealMeetings,
    dealFollowUps,
    loadingDealFollowUps,
    fetchDealFollowUps,
  };
}
