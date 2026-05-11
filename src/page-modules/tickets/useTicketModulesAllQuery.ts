import { useQuery } from "@tanstack/react-query";
import { ticketsKeys } from "../../query/keys";
import { GetAllModules } from "@utils/ticket-module";

export type TicketModuleOption = Readonly<{
  id: string;
  name: string;
  color: string;
}>;

export function useTicketModulesAllQuery() {
  return useQuery({
    queryKey: ticketsKeys.modulesAll(),
    queryFn: async () => {
      const data = await GetAllModules();
      return (data ?? []) as TicketModuleOption[];
    },
  });
}
