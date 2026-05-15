import { useQuery } from "@tanstack/react-query";

import { accountBillingKeys } from "@query/keys";
import { normalizeCompanyDocumentsResponse } from "@components/billings/DocumentPage/documentPageHelpers";
import { GetCompanyDocuments } from "@utils/accounting";

export function useAccountBillingCompanyDocumentsQuery(
  companyId: string | null,
  options: { enabled?: boolean } = {},
) {
  const cid = companyId ?? "";
  return useQuery({
    queryKey: accountBillingKeys.documents.list(cid || "__none__"),
    queryFn: async () => {
      const raw = await GetCompanyDocuments(cid);
      return normalizeCompanyDocumentsResponse(raw);
    },
    enabled: Boolean(cid) && (options.enabled ?? true),
  });
}
