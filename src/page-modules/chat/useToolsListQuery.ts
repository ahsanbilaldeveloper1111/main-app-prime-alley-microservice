import { useQuery } from "@tanstack/react-query";
import { getTools, type Tool } from "@utils/tools";
import { getErrorMessage } from "@utils/errors";
import { toast } from "react-toastify";
import { chatKeys } from "../../query/keys";

export function useToolsListQuery() {
  return useQuery({
    queryKey: chatKeys.tools.list(),
    queryFn: async (): Promise<Tool[]> => {
      try {
        const list = await getTools();
        return Array.isArray(list) ? list : [];
      } catch (e) {
        toast.error(`Failed to load tools: ${getErrorMessage(e)}`, {
          toastId: "tools_list_failed",
        });
        return [];
      }
    },
  });
}
