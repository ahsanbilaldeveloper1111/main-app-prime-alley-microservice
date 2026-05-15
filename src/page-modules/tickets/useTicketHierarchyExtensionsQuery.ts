import { useQuery } from "@tanstack/react-query";
import { ticketsKeys } from "@query/keys";
import { ModuleSlug } from "@utils/Helper";
import { GetHierarchyData } from "@utils/users";

export function useTicketHierarchyExtensionsQuery() {
  return useQuery({
    queryKey: ticketsKeys.hierarchyExtensions(),
    queryFn: async () => {
      const hierarchyData = await GetHierarchyData(ModuleSlug.TICKET);
      return hierarchyData?.extensions ?? [];
    },
  });
}
