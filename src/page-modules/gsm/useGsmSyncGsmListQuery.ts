import { ListGsmManagement } from "@utils/GsmManagement";
import { gsmKeys } from "../../query/keys";
import { useArrayListQuery } from "../_shared/listQuery";

export type GsmSyncSelectOption = {
  value: string | number;
  label: string;
  gsm: unknown;
};

type GsmRow = { id: string | number; name: string; ip_address: string };

const toSelectOption = (gsm: GsmRow): GsmSyncSelectOption => ({
  value: gsm.id,
  label: `${gsm.name} (${gsm.ip_address})`,
  gsm,
});

export function useGsmSyncGsmListQuery() {
  return useArrayListQuery<GsmSyncSelectOption>({
    queryKey: gsmKeys.sync.gsmSelectOptions(),
    staleTime: 30_000,
    fetch: () => ListGsmManagement({ page: 1, perPage: 1000 }),
    select: (raw) => {
      const dataList = (raw as { dataList?: GsmRow[] } | undefined)?.dataList;
      return dataList ? dataList.map(toSelectOption) : [];
    },
    errorLabel: "GSM list",
    toastId: "gsm_sync_list_failed",
  });
}
