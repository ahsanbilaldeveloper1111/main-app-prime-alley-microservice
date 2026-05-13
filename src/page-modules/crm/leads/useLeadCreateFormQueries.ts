import { useQuery } from "@tanstack/react-query";
import { crmAppKeys } from "../../../query/keys";
import { GetHierarchyData } from "@utils/users";
import { ModuleSlug } from "@utils/Helper";
import {
  getStages,
  getCampaigns,
  getCrmData,
  getCrmDataById,
  getIndustries,
  getBusinessTypes,
  CRM_CAMPAIGNS_LIST_ACTIVE_ONLY,
} from "@utils/crm";
import type {
  CampaignData,
  CrmDataItem,
  IndustryData,
  BusinessTypeData,
  StageData,
} from "@utils/crm";

async function loadHierarchyExtensions(moduleSlug: string): Promise<unknown[]> {
  const raw = await GetHierarchyData(moduleSlug);
  if (
    raw &&
    typeof raw === "object" &&
    "extensions" in raw &&
    Array.isArray((raw as { extensions: unknown }).extensions)
  ) {
    return (raw as { extensions: unknown[] }).extensions;
  }
  return [];
}

/**
 * TanStack Query bootstrap for the lead/opportunity create form.
 * Shared cache keys allow instant revisits and align with app `staleTime` defaults.
 */
export function useLeadCreateBootstrapQueries() {
  const leadsHierarchy = useQuery({
    queryKey: crmAppKeys.leadCreateForm.hierarchy(ModuleSlug.CRM_LEADS),
    queryFn: () => loadHierarchyExtensions(ModuleSlug.CRM_LEADS),
  });

  const opportunitiesHierarchy = useQuery({
    queryKey: crmAppKeys.leadCreateForm.hierarchy(ModuleSlug.CRM_OPPORTUNITIES),
    queryFn: () => loadHierarchyExtensions(ModuleSlug.CRM_OPPORTUNITIES),
  });

  const campaigns = useQuery({
    queryKey: crmAppKeys.leadCreateForm.activeCampaignsPicklist(),
    queryFn: async (): Promise<CampaignData[]> => {
      const res = await getCampaigns({
        per_page: 100,
        filters: CRM_CAMPAIGNS_LIST_ACTIVE_ONLY,
      });
      return res?.data ?? [];
    },
  });

  const crmDataPicklist = useQuery({
    queryKey: crmAppKeys.leadCreateForm.crmDataPicklist100(),
    queryFn: async (): Promise<CrmDataItem[]> => {
      const res = await getCrmData({ per_page: 100 });
      return res?.data ?? [];
    },
  });

  const businessTypes = useQuery({
    queryKey: crmAppKeys.businessTypes.selectOptions(),
    queryFn: async (): Promise<BusinessTypeData[]> => {
      const res = await getBusinessTypes({ per_page: 1000 });
      return res?.data ?? [];
    },
  });

  const industries = useQuery({
    queryKey: crmAppKeys.leadCreateForm.industriesPicklist1000(),
    queryFn: async (): Promise<IndustryData[]> => {
      const res = await getIndustries({ per_page: 1000 });
      return res?.data ?? [];
    },
  });

  return {
    leadsHierarchy,
    opportunitiesHierarchy,
    campaigns,
    crmDataPicklist,
    businessTypes,
    industries,
  };
}

export function useLeadCreateStagesQuery(
  stageType: "lead" | "opportunity",
  enabled: boolean,
) {
  return useQuery({
    queryKey: crmAppKeys.crmStages.byType(stageType),
    queryFn: async (): Promise<StageData[]> => (await getStages(stageType)) ?? [],
    enabled,
  });
}

export function leadCreateCrmRecordByIdQueryOptions(id: number) {
  return {
    queryKey: crmAppKeys.leadCreateForm.crmRecordById(id),
    queryFn: () => getCrmDataById(id),
  } as const;
}
