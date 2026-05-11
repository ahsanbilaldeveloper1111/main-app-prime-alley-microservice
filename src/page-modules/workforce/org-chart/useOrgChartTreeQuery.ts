import { useQuery } from "@tanstack/react-query";
import { getUserProfilesOrgChartTree } from "@utils/staffManagement";
import { workforceKeys } from "../../../query/keys";
import {
  buildOrgChartTreeRequestParams,
  parseOrgChartTreeResponse,
  serializeOrgChartFiltersKey,
  type ApiOrgChartNode,
} from "./orgChartDomain";

export interface UseOrgChartTreeQueryParams {
  companyIdentifier: string | null;
  departmentId?: string;
  userIds?: string[];
}

export function useOrgChartTreeQuery(params: Readonly<UseOrgChartTreeQueryParams>) {
  const { companyIdentifier, departmentId, userIds } = params;
  const filtersKey = serializeOrgChartFiltersKey(departmentId, userIds);

  return useQuery({
    queryKey: workforceKeys.orgChart.tree(filtersKey),
    queryFn: async (): Promise<ApiOrgChartNode[]> => {
      try {
        const req = buildOrgChartTreeRequestParams(departmentId, userIds);
        const raw = await getUserProfilesOrgChartTree(req);
        return parseOrgChartTreeResponse(raw);
      } catch (e) {
        console.error("[useOrgChartTreeQuery] fetch org chart error:", e);
        return [];
      }
    },
    enabled: Boolean(companyIdentifier),
  });
}
