import { chatKeys } from "@query/keys";
import { getTenantChatSettings } from "@utils/chat";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

import {
  mapTenantChatSettingsBudget,
  mapTenantChatSettingsModelOptions,
  mapTenantChatSettingsPricingTable,
  mapTenantChatSettingsToFormValues,
  normalizeTenantChatSettingsPayload,
} from "./mapTenantChatSettings";
import type { TenantChatPricingTable } from "./mapTenantChatSettings";
import { resolveChatTenantIdFromSession } from "./resolveChatTenantId";

export function useChatTenantSettingsQuery() {
  const { data: session, status: sessionStatus } = useSession();
  const tenantId = useMemo(
    () =>
      resolveChatTenantIdFromSession(
        session?.user as Record<string, unknown> | undefined,
      ),
    [session?.user],
  );

  const query = useQuery({
    queryKey: chatKeys.tenantSettings.detail(tenantId),
    queryFn: () => getTenantChatSettings(tenantId || undefined),
    enabled: sessionStatus === "authenticated",
    staleTime: 60_000,
    select: (raw) => {
      const data = normalizeTenantChatSettingsPayload(raw);
      return {
        rawSettings: data,
        formValues: mapTenantChatSettingsToFormValues(data),
        budget: mapTenantChatSettingsBudget(data),
        modelOptions: mapTenantChatSettingsModelOptions(data),
        pricingTable: mapTenantChatSettingsPricingTable(data),
        hasApiData: data != null,
      };
    },
  });

  return {
    ...query,
    tenantId,
    formValues: query.data?.formValues ?? null,
    budget: query.data?.budget ?? null,
    modelOptions: query.data?.modelOptions ?? [],
    pricingTable: query.data?.pricingTable ?? {},
    rawSettings: query.data?.rawSettings ?? null,
    hasApiData: query.data?.hasApiData ?? false,
  };
}
