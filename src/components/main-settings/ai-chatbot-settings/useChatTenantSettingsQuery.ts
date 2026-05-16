import { chatKeys } from "@query/keys";
import { getTenantChatSettings } from "@utils/chat";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import {
  mapTenantChatSettingsBudget,
  mapTenantChatSettingsModelOptions,
  mapTenantChatSettingsPricingTable,
  mapTenantChatSettingsToFormValues,
  normalizeTenantChatSettingsPayload,
} from "./mapTenantChatSettings";

/** Loads settings for the applied company only (`tenant_id` query param). */
export function useChatTenantSettingsQuery(appliedTenantId: string) {
  const { status: sessionStatus } = useSession();
  const tenantId = appliedTenantId.trim();

  const query = useQuery({
    queryKey: chatKeys.tenantSettings.detail(tenantId),
    queryFn: () => getTenantChatSettings(tenantId),
    enabled: sessionStatus === "authenticated" && Boolean(tenantId),
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
    dataUpdatedAt: query.dataUpdatedAt,
    formValues: query.data?.formValues ?? null,
    budget: query.data?.budget ?? null,
    modelOptions: query.data?.modelOptions ?? [],
    pricingTable: query.data?.pricingTable ?? {},
    rawSettings: query.data?.rawSettings ?? null,
    hasApiData: query.data?.hasApiData ?? false,
  };
}
