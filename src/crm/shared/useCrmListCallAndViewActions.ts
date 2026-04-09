import { useCallback, type Dispatch, type SetStateAction } from "react";
import { toast } from "react-toastify";
import { markCrmDataAsViewed, type CrmDataItem } from "@utils/crm";

const CALL_ACTIONS: Record<string, (phone: string) => void> = {
  whatsapp: (phone) =>
    window.open(`https://wa.me/${phone.replaceAll(/\D/g, "")}`, "_blank"),
  phone: (phone) => window.open(`tel:${phone}`, "_self"),
  sms: (phone) => window.open(`sms:${phone}`, "_self"),
  facebook: () => toast.info("Facebook calling feature coming soon"),
  telegram: () => toast.info("Telegram calling feature coming soon"),
  skype: () => toast.info("Skype calling feature coming soon"),
};

export function useCrmListCallAndViewActions(
  setRefreshKey: Dispatch<SetStateAction<number>>,
) {
  const handleMarkAsViewed = useCallback(
    async (item: CrmDataItem) => {
      try {
        await markCrmDataAsViewed(item.id);
        setRefreshKey((prev) => prev + 1);
      } catch (error: any) {
        console.error("Mark as viewed error:", error);
      }
    },
    [setRefreshKey],
  );

  const handleCallAction = useCallback(
    (action: string, item: CrmDataItem) => {
      const phone = item.phone;
      if (!phone) {
        toast.error("No phone number available for this entry");
        return;
      }
      const handler = CALL_ACTIONS[action];
      if (handler) {
        handler(phone);
      } else {
        toast.error("Unknown action");
      }
    },
    [],
  );

  return { handleMarkAsViewed, handleCallAction };
}
