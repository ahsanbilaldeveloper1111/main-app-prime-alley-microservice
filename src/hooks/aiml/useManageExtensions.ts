import { useHierarchyData } from "@components/filters/useHierarchyData";
import { ModuleSlug } from "@utils/Helper";
import { getImagicleTriggerExtensions, updateImagicleTrigger } from "@utils/aiml";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";

export interface ExtensionsResponse {
  success?: boolean;
  message?: string;
  data?: {
    nodes_processed?: number;
    total_unique_extensions?: number;
    all_extensions?: number[];
    imagicles?: string;
    nodes_used?: string[];
    nodes?: Record<
      string,
      {
        success?: boolean;
        extensions?: number[];
        extensions_count?: number;
        trigger_definition?: string;
        message?: string;
      }
    >;
  };
}

export type ManageExtensionsSelectOption = { value: string; label: string };

export const MANAGE_EXTENSIONS_DEFAULT_IMAGICLES = [
  "node1",
  "node2",
  "node3",
  "node4",
  "node5",
  "node6",
];

function extractErrorMessage(err: unknown, fallback: string): string {
  const e = err as {
    response?: { data?: { message?: string; error?: string } };
    message?: string;
  };
  return (
    e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? fallback
  );
}

export function useManageExtensions() {
  const { hierarchyDataExtensions, loading: hierarchyLoading } = useHierarchyData(
    ModuleSlug.USER_DIRECTORY,
  );

  const [selectedImagicles, setSelectedImagicles] = useState<ManageExtensionsSelectOption[]>([]);
  const [selectedExtensions, setSelectedExtensions] = useState<ManageExtensionsSelectOption[]>([]);
  const [data, setData] = useState<ExtensionsResponse["data"] | null>(null);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modalSelectedImagicles, setModalSelectedImagicles] = useState<
    ManageExtensionsSelectOption[]
  >([]);
  const [modalSelectedExtensions, setModalSelectedExtensions] = useState<
    ManageExtensionsSelectOption[]
  >([]);

  const imagiclesList = useMemo(
    () => selectedImagicles.map((o) => o.value).filter(Boolean),
    [selectedImagicles],
  );

  const imagicleOptions: ManageExtensionsSelectOption[] = useMemo(
    () => MANAGE_EXTENSIONS_DEFAULT_IMAGICLES.map((n) => ({ value: n, label: n })),
    [],
  );

  const extensionOptions: ManageExtensionsSelectOption[] = useMemo(() => {
    if (!hierarchyDataExtensions || !Array.isArray(hierarchyDataExtensions)) {
      return [];
    }
    return (
      hierarchyDataExtensions as {
        id?: string;
        extension_number?: string;
        name?: string;
        user?: { name?: string };
      }[]
    ).map((ext) => {
      const value = String(ext?.extension_number ?? ext?.id ?? "").trim();
      const label = (ext?.user?.name ?? ext?.name ?? value) || "—";
      return { value, label };
    });
  }, [hierarchyDataExtensions]);

  const fetchExtensionsMutation = useMutation({
    mutationFn: async () => {
      const res = (await getImagicleTriggerExtensions(imagiclesList)) as ExtensionsResponse;
      return { res, extensionOptionsSnapshot: extensionOptions };
    },
    onMutate: () => {
      setData(null);
    },
    onSuccess: ({ res, extensionOptionsSnapshot }) => {
      if (res?.data) {
        setData(res.data);
        toast.success(res.message ?? "Extensions loaded");
        const extNums = res.data.all_extensions ?? [];
        setSelectedExtensions(
          extNums.map((num) => {
            const opt = extensionOptionsSnapshot.find((o) => o.value === String(num));
            return opt ?? { value: String(num), label: String(num) };
          }),
        );
      } else {
        toast.error(res?.message ?? "Failed to load extensions");
      }
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err, "Failed to fetch extensions"));
    },
  });

  const fetchExtensions = useCallback(async (): Promise<void> => {
    await fetchExtensionsMutation.mutateAsync();
  }, [fetchExtensionsMutation]);

  const updateTriggerMutation = useMutation({
    mutationFn: (vars: { imagicles: string[]; extension_numbers: number[] }) =>
      updateImagicleTrigger(vars),
  });

  const openModifyModal = useCallback(() => {
    setModalSelectedImagicles(imagiclesList.map((n) => ({ value: n, label: n })));
    const current = data?.all_extensions ?? [];
    const opts = current.map((num: number) => {
      const opt = extensionOptions.find((o) => o.value === String(num));
      return opt ?? { value: String(num), label: String(num) };
    });
    setModalSelectedExtensions(opts);
    setShowModifyModal(true);
  }, [imagiclesList, data?.all_extensions, extensionOptions]);

  const handleModalSubmit = useCallback(async () => {
    const numbers = modalSelectedExtensions
      .map((o) => Number.parseInt(o.value, 10))
      .filter((n) => !Number.isNaN(n));
    if (!numbers.length) {
      toast.warning("Select at least one extension");
      return;
    }
    const imagicles = modalSelectedImagicles.map((o) => o.value).filter(Boolean);
    if (!imagicles.length) {
      toast.warning("Select at least one imagicle node");
      return;
    }
    try {
      const res = await updateTriggerMutation.mutateAsync({
        imagicles,
        extension_numbers: numbers,
      });
      const payload = res as { success?: boolean; message?: string };
      if (payload?.success) {
        toast.success(payload.message ?? "Trigger updated successfully");
        setShowModifyModal(false);
        await fetchExtensionsMutation.mutateAsync();
      } else {
        toast.error(
          (payload as { message?: string })?.message ?? "Failed to update trigger",
        );
      }
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, "Failed to update trigger"));
    }
  }, [modalSelectedImagicles, modalSelectedExtensions, updateTriggerMutation, fetchExtensionsMutation]);

  const modalExtensionOptions = useMemo(() => {
    const fromData = new Set((data?.all_extensions ?? []).map(String));
    const opts = extensionOptions
      .filter((o) => o.value)
      .map((o) => ({ value: o.value, label: o.label }));
    const combined = [...opts];
    fromData.forEach((v) => {
      if (!combined.some((o) => o.value === v)) {
        combined.push({ value: v, label: v });
      }
    });
    return combined.length
      ? combined
      : Array.from(fromData).map((v) => ({ value: v, label: v }));
  }, [extensionOptions, data?.all_extensions]);

  const loading = fetchExtensionsMutation.isPending;
  const updating = updateTriggerMutation.isPending;

  return {
    hierarchyLoading,
    selectedImagicles,
    setSelectedImagicles,
    selectedExtensions,
    setSelectedExtensions,
    loading,
    updating,
    data,
    showModifyModal,
    setShowModifyModal,
    modalSelectedImagicles,
    setModalSelectedImagicles,
    modalSelectedExtensions,
    setModalSelectedExtensions,
    imagiclesList,
    imagicleOptions,
    extensionOptions,
    fetchExtensions,
    openModifyModal,
    handleModalSubmit,
    modalExtensionOptions,
  };
}
