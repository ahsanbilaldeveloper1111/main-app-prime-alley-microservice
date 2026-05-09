import { getTools, type Tool } from "@utils/tools";
import { chatKeys } from "../../query/keys";
import { useArrayListQuery } from "../_shared/listQuery";

export function useToolsListQuery() {
  return useArrayListQuery<Tool>({
    queryKey: chatKeys.tools.list(),
    fetch: getTools,
    errorLabel: "tools",
    toastId: "tools_list_failed",
  });
}
