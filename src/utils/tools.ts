import axiosInstance from "./axios";

const PREFIX = "chat";

// ---------------------------------------------------------------------------
// Types (from API collection)
// ---------------------------------------------------------------------------

export interface ToolParameter {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  location?: string;
  default_value?: string | null;
}

export interface ToolHeader {
  key: string;
  value: string;
}

export interface ToolResponseMapping {
  response_path?: string | null;
  status_path?: string | null;
  [key: string]: unknown;
}

export interface ToolPayload {
  tool_name?: string;
  display_name: string;
  description?: string;
  method: string;
  endpoint_url: string;
  auth_type?: string;
  auth_config?: Record<string, unknown>;
  enabled?: boolean;
  parameters?: ToolParameter[];
  headers?: ToolHeader[];
  response_mapping?: ToolResponseMapping;
}

/** Tool as returned from API (uses tool_id) */
export interface ToolFromApi extends Omit<ToolPayload, "tool_name"> {
  tool_id: number;
  tool_name: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface Tool extends ToolPayload {
  id: number;
  tool_name: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/** GET tools list response */
export interface GetToolsResponse {
  count: number;
  tools: ToolFromApi[];
}

function normalizeTool(t: ToolFromApi | (ToolFromApi & { id?: number })): Tool {
  const id = "id" in t && typeof t.id === "number" ? t.id : t.tool_id;
  return { ...t, id } as Tool;
}

export interface ToggleToolPayload {
  enabled?: boolean;
}

export interface TestToolPayload {
  parameters?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Tools CRUD
// ---------------------------------------------------------------------------

/** GET tools - list all. Use enabled_only=true to filter only enabled tools. */
export const getTools = async (params?: { enabled_only?: boolean }): Promise<Tool[]> => {
  try {
    const response = await axiosInstance.get<GetToolsResponse>(`${PREFIX}/tools/`, {
      params: params?.enabled_only !== undefined ? { enabled_only: params.enabled_only } : undefined,
    });
    const data = response.data;
    const list = data?.tools ?? [];
    return list.map((t) => ({ ...t, id: t.tool_id } as Tool));
  } catch (error) {
    console.error("getTools error:", error);
    throw error;
  }
};

/** POST tools - create a new tool */
export const createTool = async (payload: ToolPayload): Promise<Tool> => {
  try {
    const response = await axiosInstance.post<ToolFromApi>(`${PREFIX}/tools/`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return normalizeTool(response.data);
  } catch (error) {
    console.error("createTool error:", error);
    throw error;
  }
};

/** GET tools/{id} - get tool by ID */
export const getToolById = async (id: number | string): Promise<Tool> => {
  try {
    const response = await axiosInstance.get<ToolFromApi>(`${PREFIX}/tools/${id}/`);
    return normalizeTool(response.data);
  } catch (error) {
    console.error("getToolById error:", error);
    throw error;
  }
};

/** PUT tools/{id} - update tool (tool_name cannot be changed) */
export const updateTool = async (id: number | string, payload: Partial<ToolPayload>): Promise<Tool> => {
  try {
    const response = await axiosInstance.put<ToolFromApi>(`${PREFIX}/tools/${id}/`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return normalizeTool(response.data);
  } catch (error) {
    console.error("updateTool error:", error);
    throw error;
  }
};

/** DELETE tools/{id} */
export const deleteTool = async (id: number | string): Promise<void> => {
  try {
    await axiosInstance.delete(`${PREFIX}/tools/${id}/`);
  } catch (error) {
    console.error("deleteTool error:", error);
    throw error;
  }
};

/** POST tools/{id}/toggle - enable/disable. If enabled not provided, toggles current state. */
export const toggleTool = async (id: number | string, payload?: ToggleToolPayload): Promise<Tool> => {
  try {
    const response = await axiosInstance.post<ToolFromApi>(`${PREFIX}/tools/${id}/toggle/`, payload ?? {}, {
      headers: { "Content-Type": "application/json" },
    });
    return normalizeTool(response.data);
  } catch (error) {
    console.error("toggleTool error:", error);
    throw error;
  }
};

/** POST tools/{id}/test - test/execute tool with parameters */
export const testTool = async (id: number | string, payload: TestToolPayload): Promise<unknown> => {
  try {
    const response = await axiosInstance.post(`${PREFIX}/tools/${id}/test/`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("testTool error:", error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Tool Executor
// ---------------------------------------------------------------------------

/** GET tools/executor - get all enabled tools in LangGraph-compatible format */
export const getToolsExecutor = async (): Promise<unknown> => {
  try {
    const response = await axiosInstance.get(`${PREFIX}/tools/executor/`);
    return response.data;
  } catch (error) {
    console.error("getToolsExecutor error:", error);
    throw error;
  }
};

/** POST tools/executor - reload tools from database */
export const reloadToolsExecutor = async (): Promise<unknown> => {
  try {
    const response = await axiosInstance.post(`${PREFIX}/tools/executor/`);
    return response.data;
  } catch (error) {
    console.error("reloadToolsExecutor error:", error);
    throw error;
  }
};
