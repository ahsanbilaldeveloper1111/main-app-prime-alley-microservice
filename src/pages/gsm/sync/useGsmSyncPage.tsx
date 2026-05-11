import { useGsmSyncGsmListQuery, type GsmSyncSelectOption } from "@page-modules/gsm/useGsmSyncGsmListQuery";
import { SyncPorts, ViewGsm, SyncPortsMobileNumber } from "@utils/GsmAssign";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { gsmKeys } from "../../../query/keys";

const TYPE_OPTIONS = [
  { value: "imei", label: "IMEI" },
  { value: "iccid", label: "ICCID" },
  { value: "imsi", label: "IMSI" },
  { value: "reg", label: "REG" },
] as const;

export function useGsmSyncPage() {
  const queryClient = useQueryClient();
  const gsmListQuery = useGsmSyncGsmListQuery();
  const gsmList = gsmListQuery.data ?? [];
  const isFetchingGsm = gsmListQuery.isFetching;

  const [selectedGsm, setSelectedGsm] = useState<GsmSyncSelectOption | null>(null);
  const [selectedType, setSelectedType] = useState<{ value: string; label: string } | null>(null);
  const [portsList, setPortsList] = useState<{ value: string | number; label: string }[]>([]);
  const [selectedPorts, setSelectedPorts] = useState<{ value: string | number; label: string }[]>([]);

  const portsSyncMutation = useMutation({
    mutationFn: ({ type, gsmId }: { type: string; gsmId: string | number }) =>
      SyncPorts(type, String(gsmId)),
    onSuccess: (response) => {
      if (response) {
        toast.success("Sync completed successfully");
      } else {
        toast.error("Sync failed");
      }
      void queryClient.invalidateQueries({ queryKey: gsmKeys.sync.all() });
    },
    onError: () => {
      toast.error("Sync failed. Please try again.");
    },
  });

  const mobileSyncMutation = useMutation({
    mutationFn: ({
      portIds,
      gsmId,
    }: {
      portIds: (string | number)[];
      gsmId: string | number;
    }) => SyncPortsMobileNumber(portIds.map(Number), String(gsmId)),
    onSuccess: (response) => {
      if (response) {
        toast.success("Mobile numbers sync completed successfully");
      } else {
        toast.error("Mobile numbers sync failed");
      }
      void queryClient.invalidateQueries({ queryKey: gsmKeys.sync.all() });
    },
    onError: () => {
      toast.error("Mobile numbers sync failed. Please try again.");
    },
  });

  const handleGsmChange = useCallback((selectedOption: GsmSyncSelectOption | null) => {
    setSelectedGsm(selectedOption);
    setSelectedPorts([]);
    setPortsList([]);

    if (selectedOption) {
      ViewGsm(selectedOption.value)
        .then((res: { data?: { id: string | number; port_number: string }[] }) => {
          if (res?.data) {
            const portOptions = res.data.map((port) => ({
              value: port.id,
              label: `Port ${port.port_number} (ID: ${port.id})`,
            }));
            setPortsList(portOptions);
          }
        })
        .catch((error) => {
          console.error("Error fetching ports:", error);
          toast.error("Failed to fetch ports for selected GSM");
        });
    }
  }, []);

  const handleTypeChange = useCallback((selectedOption: { value: string; label: string } | null) => {
    setSelectedType(selectedOption);
  }, []);

  const handlePortsChange = useCallback(
    (selectedOptions: readonly { value: string | number; label: string }[] | null) => {
      setSelectedPorts(selectedOptions ? [...selectedOptions] : []);
    },
    [],
  );

  const handleFetchDetails = useCallback(() => {
    if (!selectedGsm || !selectedType) {
      toast.error("Please select both GSM and Type");
      return;
    }
    portsSyncMutation.mutate({ type: selectedType.value, gsmId: selectedGsm.value });
  }, [selectedGsm, selectedType, portsSyncMutation]);

  const handleSyncMobileNumbers = useCallback(() => {
    if (!selectedGsm || selectedPorts.length === 0) {
      toast.error("Please select GSM and at least one port");
      return;
    }
    const portIds = selectedPorts.map((port) => port.value);
    mobileSyncMutation.mutate({ portIds, gsmId: selectedGsm.value });
  }, [selectedGsm, selectedPorts, mobileSyncMutation]);

  const isFetchButtonDisabled =
    !selectedGsm || !selectedType || portsSyncMutation.isPending;
  const isMobileSyncButtonDisabled =
    !selectedGsm || selectedPorts.length === 0 || mobileSyncMutation.isPending;

  return {
    gsmList,
    isFetchingGsm,
    selectedGsm,
    selectedType,
    portsList,
    selectedPorts,
    typeOptions: TYPE_OPTIONS,
    handleGsmChange,
    handleTypeChange,
    handlePortsChange,
    handleFetchDetails,
    handleSyncMobileNumbers,
    isFetchButtonDisabled,
    isMobileSyncButtonDisabled,
    isLoading: portsSyncMutation.isPending,
    isLoadingMobile: mobileSyncMutation.isPending,
  };
}
