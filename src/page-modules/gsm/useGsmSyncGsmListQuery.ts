import { useQuery } from "@tanstack/react-query";
import { ListGsmManagement } from "@utils/GsmManagement";
import { getErrorMessage } from "@utils/errors";
import { toast } from "react-toastify";
import { gsmKeys } from "../../query/keys";

export type GsmSyncSelectOption = {
  value: string | number;
  label: string;
  gsm: unknown;
};

export function useGsmSyncGsmListQuery() {
  return useQuery({
    queryKey: gsmKeys.sync.gsmSelectOptions(),
    staleTime: 30_000,
    queryFn: async (): Promise<GsmSyncSelectOption[]> => {
      try {
        const response = await ListGsmManagement({ page: 1, perPage: 1000 });
        if (response?.dataList) {
          return response.dataList.map((gsm: { id: string | number; name: string; ip_address: string }) => ({
            value: gsm.id,
            label: `${gsm.name} (${gsm.ip_address})`,
            gsm,
          }));
        }
        return [];
      } catch (error) {
        toast.error(`Failed to fetch GSM list: ${getErrorMessage(error)}`, {
          toastId: "gsm_sync_list_failed",
        });
        return [];
      }
    },
  });
}
