import type { ToolFormState } from "@components/ToolEditSidebar";
import type { Tool } from "@utils/tools";

export const EMPTY_FORM: ToolFormState = {
  display_name: "",
  tool_name: "",
  description: "",
  method: "GET",
  endpoint_url: "",
  auth_type: "none",
  auth_config: {},
  enabled: true,
  parameters: [],
  headers: [],
  response_mapping: {},
};

export function buildFormFromTool(tool: Tool): ToolFormState {
  return {
    display_name: tool.display_name ?? "",
    tool_name: tool.tool_name ?? "",
    description: tool.description ?? "",
    method: tool.method ?? "GET",
    endpoint_url: tool.endpoint_url ?? "",
    auth_type: tool.auth_type ?? "none",
    auth_config: tool.auth_config ?? {},
    enabled: tool.enabled ?? true,
    parameters: tool.parameters ?? [],
    headers: tool.headers ?? [],
    response_mapping: tool.response_mapping ?? {},
  };
}

export function getToolLabel(tool: Tool | null): string {
  return tool?.display_name ?? tool?.tool_name ?? "";
}

export function isCreatePayloadValid(payload: ToolFormState): boolean {
  return (
    Boolean(String(payload.tool_name ?? "").trim()) &&
    Boolean(String(payload.display_name ?? "").trim()) &&
    Boolean(String(payload.endpoint_url ?? "").trim())
  );
}

export function isUpdatePayloadValid(tool: Tool | null, payload: ToolFormState): boolean {
  return (
    Boolean(tool?.id) &&
    Boolean(payload.display_name?.trim()) &&
    Boolean(payload.endpoint_url?.trim())
  );
}
