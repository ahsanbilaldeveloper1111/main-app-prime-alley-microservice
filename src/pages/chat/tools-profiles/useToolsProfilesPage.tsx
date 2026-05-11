import { chatKeys } from "../../../query/keys";
import { useToolsListQuery } from "@page-modules/chat/useToolsListQuery";
import {
  createTool,
  deleteTool,
  getToolsExecutor,
  reloadToolsExecutor,
  testTool,
  toggleTool,
  updateTool,
  type Tool,
  type ToolPayload,
} from "@utils/tools";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import {
  EMPTY_FORM,
  buildFormFromTool,
  isCreatePayloadValid,
  isUpdatePayloadValid,
} from "./toolsProfilesHelpers";
import type { ToolFormState } from "@components/ToolEditSidebar";

export function useToolsProfilesPage() {
  const queryClient = useQueryClient();
  const toolsQuery = useToolsListQuery();
  const tools = toolsQuery.data ?? [];
  const loading = toolsQuery.isFetching;

  const invalidateTools = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: chatKeys.tools.all() });
  }, [queryClient]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showExecutorModal, setShowExecutorModal] = useState(false);
  const [executorConfig, setExecutorConfig] = useState<unknown>(null);
  const [executorLoading, setExecutorLoading] = useState(false);
  const [reloadExecutorLoading, setReloadExecutorLoading] = useState(false);

  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<ToolFormState>(EMPTY_FORM);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [testParamsJson, setTestParamsJson] = useState("{}");
  const [testLoading, setTestLoading] = useState(false);

  const openAdd = useCallback(() => {
    setFormState(EMPTY_FORM);
    setIsEditing(false);
    setSelectedTool(null);
    setSidebarOpen(true);
  }, []);

  const openEdit = useCallback((tool: Tool) => {
    setSelectedTool(tool);
    setFormState(buildFormFromTool(tool));
    setIsEditing(true);
    setSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    setSelectedTool(null);
  }, []);

  const createMutation = useMutation({
    mutationFn: (payload: ToolPayload) => createTool(payload),
    onSuccess: async () => {
      toast.success("Tool created");
      closeSidebar();
      await invalidateTools();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: number; form: ToolFormState }) => updateTool(vars.id, vars.form),
    onSuccess: async () => {
      toast.success("Tool updated");
      closeSidebar();
      await invalidateTools();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTool(id),
    onSuccess: async () => {
      toast.success("Tool deleted");
      setShowDeleteModal(false);
      setSelectedTool(null);
      await invalidateTools();
    },
  });

  const handleCreate = useCallback(async () => {
    if (!isCreatePayloadValid(formState)) {
      toast.error("Tool name, display name, and endpoint URL are required");
      return;
    }
    setSubmitLoading(true);
    try {
      await createMutation.mutateAsync(formState as ToolPayload);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitLoading(false);
    }
  }, [formState, createMutation]);

  const handleUpdate = useCallback(async () => {
    if (!isUpdatePayloadValid(selectedTool, formState)) {
      toast.error("Display name and endpoint URL are required");
      return;
    }
    setSubmitLoading(true);
    try {
      await updateMutation.mutateAsync({ id: selectedTool!.id, form: formState });
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitLoading(false);
    }
  }, [selectedTool, formState, updateMutation]);

  const handleSubmit = useCallback(() => {
    if (isEditing) {
      handleUpdate();
    } else {
      handleCreate();
    }
  }, [isEditing, handleUpdate, handleCreate]);

  const handleDelete = useCallback(async () => {
    if (!selectedTool?.id) return;
    try {
      await deleteMutation.mutateAsync(selectedTool.id);
    } catch (e) {
      console.error(e);
    }
  }, [selectedTool, deleteMutation]);

  const handleToggle = useCallback(
    async (tool: Tool) => {
      try {
        await toggleTool(tool.id, { enabled: !tool.enabled });
        toast.success(tool.enabled ? "Tool disabled" : "Tool enabled");
        await invalidateTools();
      } catch (e) {
        console.error(e);
      }
    },
    [invalidateTools],
  );

  const openTest = useCallback((tool: Tool) => {
    setSelectedTool(tool);
    setTestParamsJson("{}");
    setShowTestModal(true);
  }, []);

  const handleTest = useCallback(async () => {
    if (!selectedTool?.id) return;
    let params: Record<string, unknown> = {};
    try {
      params = JSON.parse(testParamsJson || "{}");
    } catch {
      toast.error("Invalid JSON for parameters");
      return;
    }
    setTestLoading(true);
    try {
      const result = await testTool(selectedTool.id, { parameters: params });
      toast.success("Test completed. Check response in console.");
      console.log("Tool test result:", result);
    } catch (e) {
      console.error(e);
    } finally {
      setTestLoading(false);
    }
  }, [selectedTool, testParamsJson]);

  const handleReloadExecutor = useCallback(async () => {
    setReloadExecutorLoading(true);
    try {
      await reloadToolsExecutor();
      toast.success("Executor reloaded. Enabled tools are now in sync.");
      await invalidateTools();
    } catch (e) {
      console.error(e);
      toast.error("Failed to reload executor");
    } finally {
      setReloadExecutorLoading(false);
    }
  }, [invalidateTools]);

  const handleViewExecutor = useCallback(async () => {
    setExecutorLoading(true);
    setShowExecutorModal(true);
    setExecutorConfig(null);
    try {
      const config = await getToolsExecutor();
      setExecutorConfig(config);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load executor config");
      setExecutorConfig(undefined);
    } finally {
      setExecutorLoading(false);
    }
  }, []);

  return {
    tools,
    loading,
    showDeleteModal,
    setShowDeleteModal,
    showTestModal,
    setShowTestModal,
    showExecutorModal,
    setShowExecutorModal,
    executorConfig,
    executorLoading,
    reloadExecutorLoading,
    selectedTool,
    setSelectedTool,
    sidebarOpen,
    isEditing,
    formState,
    setFormState,
    submitLoading,
    testParamsJson,
    setTestParamsJson,
    testLoading,
    openAdd,
    openEdit,
    closeSidebar,
    handleSubmit,
    handleDelete,
    handleToggle,
    openTest,
    handleTest,
    handleReloadExecutor,
    handleViewExecutor,
  };
}