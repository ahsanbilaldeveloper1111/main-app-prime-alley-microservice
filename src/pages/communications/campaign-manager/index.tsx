import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import React, {
  type ReactElement,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useId,
  useMemo,
  useCallback,
} from "react";
import { Row, Col } from "react-bootstrap";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { useSession } from "next-auth/react";
import {
  Plus,
  Upload,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  ChevronDown,
  Grid,
  Target,
  Loader,
  RefreshCw,
} from "lucide-react";

import AppSelect from "@components/AppSelect";
import CallWidget from "../campaign-partials/CallWidget";
import WrapUpModal from "../campaign-partials/WrapUp";

import TopBar, { type TeamOption } from "../campaign-partials/TopBarAgent";
import FinesseAuthGate from "../campaign-partials/FinesseAuthGate";
import { toast } from "react-toastify";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { usePermissions } from "@utils/permissionUtils";
import {
  getFinesseUserData,
  getFinesseToken,
  setFinesseUserData,
  clearFinesseUserData,
  setFinesseManualReconnectRequired,
  finesseUnlink,
  getFinesseUser,
  finesseSetState,
  getFinesseCampaigns,
  setFinesseCampaignEnabled,
  importFinesseCampaignContacts,
  getFinesseCampaignsContactsStatus,
  getFinesseCampaignContactsConfig,
  getFinesseCampaignContacts,
  deleteFinesseCampaignContacts,
  getEffectiveTeamId,
  getStoredTeamId,
  setStoredTeamId,
  assertFinesseTeamSwitchable,
  getFinesseApiErrorMessage,
  getFinesseClusterId,
  normalizeFinesseUserData,
  scheduleFinesseCampaign,
  type FinesseUserData,
} from "@utils/finesse";
import {
  findRosterEntryForLogin,
  resolveRosterAgentDisplayState,
} from "@utils/finesseRosterMerge";
import { useFinesseCapabilities } from "@hooks/live-calls/useFinesseCapabilities";
import { useFinesseStomp } from "@hooks/live-calls/useFinesseStomp";
import { useFinesseCampaignPreview } from "@hooks/live-calls/useFinesseCampaignPreview";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { communicationsKeys } from "@query/keys";

import {
  CAMPAIGN_MANAGER_CONTACT_HEADER_VALUE_OPTIONS,
  CAMPAIGN_MANAGER_VISUALLY_HIDDEN_INPUT_STYLE,
  extractRemainingContactsCount,
  formatImportStatusDisplay,
  mapApiCampaignToRow,
  type CampaignRow,
  type ContactHeaderValueOption,
  type ImportStatusShape,
} from "@utils/communications/campaign-shared/campaignManagerHelpers";

const { PERMISSIONS } = HEADER_CONSTANTS;

const LiveCallsCampaignsManagement = () => {
  const { data: session } = useSession();
  const { hasPermission } = usePermissions();
  const canChangeCampaignStatus = hasPermission(
    PERMISSIONS.CAN_CHANGE_CAMPAIGN_STATUS_TMS,
  );
  const canChangeCampaignTiming = hasPermission(
    PERMISSIONS.CAN_CHANGE_CAMPAIGN_TIMING_TMS,
  );
  const [teams, setTeams] = useState<string[]>([]);
  const [teamsWithIds, setTeamsWithIds] = useState<TeamOption[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [agentStatus, setAgentStatus] = useState("READY");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(
    null,
  );
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [allowDuplicateContacts, setAllowDuplicateContacts] = useState(true);
  const [columnMapping, setColumnMapping] = useState<
    Array<{ id: number; key: string; value: string; order: number }>
  >([]);
  const [columnsLoading, setColumnsLoading] = useState(false);
  const [uploadModalRemainingCount, setUploadModalRemainingCount] = useState<
    number | null
  >(null);
  const [uploadModalRemainingLoading, setUploadModalRemainingLoading] =
    useState(false);
  const [uploadModalClearingContacts, setUploadModalClearingContacts] =
    useState(false);

  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadFileInputId = useId();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setShowStatusDropdown(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Username available after FinesseAuthGate (from storage or session)
  const finesseData = getFinesseUserData();
  const finesseUsername =
    finesseData?.loginId ??
    finesseData?.loginName ??
    (session?.user as { username?: string } | undefined)?.username ??
    "";

  // Hydrate from storage on mount so teams/APIs run when landing after link (storage is set but first render may miss it).
  // useLayoutEffect so dropdown is filled before first paint and dependent APIs run.
  const [finesseHydrated, setFinesseHydrated] = useState(false);
  const hydrateFromStorage = useCallback(() => {
    const stored = getFinesseUserData();
    if (stored) {
      setFinesseHydrated(true);
      const teamList = stored.teams ?? [];
      const withIds: TeamOption[] = teamList.map((t) => ({
        id: t.id,
        name: t.name,
      }));
      let teamNames: string[] = [];
      if (withIds.length > 0) {
        teamNames = withIds.map((t) => t.name);
      } else if (stored.teamName) {
        teamNames = [stored.teamName];
      }
      if (withIds.length > 0) {
        setTeamsWithIds(withIds);
        setTeams(teamNames);
      } else if (teamNames.length > 0) {
        setTeams(teamNames);
      }
      const storedTeamId = getStoredTeamId();
      const match = withIds.find((t) => t.id === storedTeamId);
      setSelectedTeam(match?.name ?? stored.teamName ?? teamNames[0] ?? "");
      if (stored.state) setAgentStatus(stored.state);
    }
  }, []);
  useLayoutEffect(() => {
    if (globalThis.window === undefined) return;
    hydrateFromStorage();
  }, [hydrateFromStorage]);
  // When gate authenticates on same page (no reload/router), re-hydrate from storage so teams and APIs run
  useEffect(() => {
    if (globalThis.window === undefined) return;
    const onAuthenticated = () => hydrateFromStorage();
    globalThis.window.addEventListener(
      "finesse-authenticated",
      onAuthenticated,
    );
    return () =>
      globalThis.window.removeEventListener(
        "finesse-authenticated",
        onAuthenticated,
      );
  }, [hydrateFromStorage]);

  // Fetch Finesse user and map to TopBar (teams, selectedTeam, agentStatus) â€“ runs when past FinesseAuthGate / after hydrate
  useEffect(() => {
    if (!finesseHydrated) return;
    const data = getFinesseUserData();
    const teamId = getStoredTeamId();
    const username =
      data?.loginId ??
      data?.loginName ??
      (session?.user as { username?: string } | undefined)?.username ??
      "";
    if (!username || teamId == null) return;

    const loadUser = async () => {
      try {
        const response = await getFinesseUser(teamId, username);
        const resData = response?.responseData ?? response;
        if (!resData) return;
        const rawTeams =
          (resData as { teams?: Array<{ id: number; name: string }> }).teams ??
          [];
        const withIds: TeamOption[] = rawTeams.map((t) => ({
          id: t.id,
          name: t.name,
        }));
        const teamNames = withIds.length > 0 ? withIds.map((t) => t.name) : [];
        setTeamsWithIds(withIds);
        setTeams(teamNames);
        const normalized = normalizeFinesseUserData(resData as FinesseUserData);
        setFinesseUserData(normalized);
        setStoredTeamId(teamId);
        const match = withIds.find((t) => t.id === teamId);
        setSelectedTeam(
          match?.name ??
            (resData as { teamName?: string }).teamName ??
            teamNames[0] ??
            "",
        );
        setAgentStatus((resData as { state?: string }).state ?? "READY");
      } catch {
        const stored = getFinesseUserData();
        if (stored) {
          const withIds =
            stored.teams?.map((t) => ({ id: t.id, name: t.name })) ?? [];
          if (withIds.length > 0) {
            setTeamsWithIds(withIds);
            setTeams(withIds.map((t) => t.name));
          }
          const storedTeamId = getStoredTeamId();
          const match = withIds.find((t) => t.id === storedTeamId);
          setSelectedTeam(
            match?.name ?? stored.teamName ?? withIds[0]?.name ?? "",
          );
          if (stored.state) setAgentStatus(stored.state);
        }
      }
    };
    loadUser();
  }, [finesseHydrated, finesseUsername, session?.user]);

  // Load import statuses in background â€“ runs when past FinesseAuthGate / after hydrate
  useEffect(() => {
    if (!finesseHydrated) return;
    const data = getFinesseUserData();
    const teamId = getEffectiveTeamId(data);
    const username =
      data?.loginId ??
      data?.loginName ??
      (session?.user as { username?: string } | undefined)?.username ??
      "";
    if (!username || teamId == null) return;

    const loadImportStatuses = async () => {
      try {
        const statusData = await getFinesseCampaignsContactsStatus(
          teamId,
          username,
        );
        const list =
          (statusData as { importStatuses?: Array<{ campaignId: number }> })
            ?.importStatuses ??
          (statusData as { campaigns?: Array<{ campaignId: number }> })
            ?.campaigns ??
          [];
        const arr = Array.isArray(list) ? list : [];
        const map: Record<number, unknown> = {};
        arr.forEach((s: { campaignId: number }) => {
          map[s.campaignId] = s;
        });
        setImportStatuses(map);
      } catch {
        // Non-blocking
      }
    };
    loadImportStatuses();
  }, [finesseHydrated, finesseUsername, session?.user]);

  const campaignQueryContext = useMemo(() => {
    if (!finesseHydrated)
      return { teamId: null as number | null, username: "" };
    const data = getFinesseUserData();
    const teamId = data ? getEffectiveTeamId(data) : null;
    const username =
      data?.loginId ??
      data?.loginName ??
      (session?.user as { username?: string } | undefined)?.username ??
      "";
    return { teamId, username };
  }, [finesseHydrated, session?.user]);

  const queryClient = useQueryClient();

  const campaignsQueryKey = useMemo(
    () =>
      finesseHydrated &&
      campaignQueryContext.teamId != null &&
      campaignQueryContext.username.length > 0
        ? communicationsKeys.finesse.campaigns(
            campaignQueryContext.teamId,
            campaignQueryContext.username,
          )
        : null,
    [
      finesseHydrated,
      campaignQueryContext.teamId,
      campaignQueryContext.username,
    ],
  );

  const { data: campaigns = [], isPending: campaignsLoading } = useQuery({
    queryKey: campaignsQueryKey ?? [
      "communications",
      "finesse",
      "campaigns",
      "idle",
    ],
    enabled: Boolean(campaignsQueryKey),
    queryFn: async () => {
      const { teamId, username } = campaignQueryContext;
      if (teamId == null || username.length === 0) return [];
      try {
        const response = await getFinesseCampaigns(teamId, username);
        const list = response?.data ?? response?.responseData ?? response;
        const arr = Array.isArray(list)
          ? list
          : (list?.campaigns ?? list?.items ?? []);
        return (arr as any[]).map((item, index) =>
          mapApiCampaignToRow(item, index),
        );
      } catch (err) {
        toast.error(
          (err as any)?.response?.data?.message ??
            (err as Error)?.message ??
            "Failed to load campaigns.",
        );
        throw err;
      }
    },
  });

  const patchCampaignsCache = useCallback(
    (updater: (prev: CampaignRow[]) => CampaignRow[]) => {
      if (!campaignsQueryKey) return;
      queryClient.setQueryData<CampaignRow[]>(campaignsQueryKey, (prev) =>
        updater(prev ?? []),
      );
    },
    [campaignsQueryKey, queryClient],
  );

  const statusOptions = [
    { value: "READY", label: "Ready", color: "#10b981", icon: CheckCircle },
    { value: "NOT_READY", label: "Not Ready", color: "#ef4444", icon: XCircle },
  ];

  const [importStatuses, setImportStatuses] = useState<Record<number, unknown>>(
    {},
  );
  const [token, setToken] = useState<string | null>(null);

  const {
    handlePreviewEvent,
    getFinesseContext,
    callWidgetProps,
    wrapUpModalProps,
  } = useFinesseCampaignPreview(session, {
    selectedTeam,
    includeTeamRow: false,
  });

  const finesseDataForCap = getFinesseUserData();
  const capabilityTeamId = getEffectiveTeamId(finesseDataForCap);
  const capabilityUsername =
    finesseDataForCap?.loginId ?? finesseDataForCap?.loginName ?? null;
  const { hasCampaignMgmt, loading: capabilityLoading } =
    useFinesseCapabilities(capabilityTeamId, capabilityUsername);

  /** Fetches remaining contacts per campaign via `/campaigns/{campaignId}/contacts` and merges counts into campaign rows. */
  const refreshRemainingContacts = useCallback(
    async (campaignIds: number[]) => {
      if (campaignIds.length === 0) return;
      const { username, teamId } = getFinesseContext();
      if (!username || teamId == null) return;
      const results = await Promise.all(
        campaignIds.map(async (id) => {
          try {
            const resp = await getFinesseCampaignContacts(teamId, username, id);
            const count = extractRemainingContactsCount(resp);
            return { id, count };
          } catch {
            return { id, count: null as number | null };
          }
        }),
      );
      const countById = new Map(results.map((r) => [r.id, r.count]));
      patchCampaignsCache((prev) =>
        prev.map((c) => {
          const count = countById.get(c.id);
          if (count == null) return c;
          return {
            ...c,
            contactsRemaining: count,
            pendingContacts: count,
          };
        }),
      );
    },
    [getFinesseContext, patchCampaignsCache],
  );

  const campaignIdsKey = useMemo(
    () =>
      campaigns
        .map((c) => c.id)
        .sort((a, b) => a - b)
        .join(","),
    [campaigns],
  );

  useEffect(() => {
    if (!finesseHydrated) return;
    if (!campaignIdsKey) return;
    const ids = campaignIdsKey.split(",").map(Number).filter(Number.isFinite);
    refreshRemainingContacts(ids).catch(() => undefined);
  }, [finesseHydrated, campaignIdsKey, refreshRemainingContacts]);

  const rosterClusterId = useMemo(
    () => getFinesseClusterId(),
    [finesseHydrated, finesseDataForCap?.loginId, finesseDataForCap?.settings],
  );

  const handleRosterEvent = useCallback(
    (raw: unknown) => {
      const d = getFinesseUserData();
      const self = d?.loginId ?? d?.loginName ?? finesseUsername ?? "";
      if (!self) return;
      const patch = findRosterEntryForLogin(raw, self);
      if (!patch) return;
      const display = resolveRosterAgentDisplayState(patch);
      if (!display) return;
      setAgentStatus(display);
      const prev = getFinesseUserData();
      if (!prev) return;
      setFinesseUserData({
        ...prev,
        state: display,
        ...(patch.stateChangeTime == null
          ? {}
          : { stateChangeTime: patch.stateChangeTime }),
      });
    },
    [finesseUsername],
  );

  useEffect(() => {
    if (!session?.user) return;
    if (globalThis.window === undefined) {
      setToken(null);
      return;
    }
    setToken(getFinesseToken());
  }, [session?.user]);

  const handleStompConnected = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: communicationsKeys.finesse.all(),
    });
  }, [queryClient]);

  useFinesseStomp({
    token,
    finesseUserId: capabilityUsername,
    clusterId: rosterClusterId,
    teamId: capabilityTeamId,
    onStateEvent: (p) => p?.state && setAgentStatus(p.state),
    onErrorEvent: (p) =>
      toast.error((p as { message?: string })?.message ?? "Finesse error"),
    onAuthError: (msg) => toast.error(msg),
    onPreviewEvent: handlePreviewEvent,
    onRosterEvent: handleRosterEvent,
    onStompConnected: handleStompConnected,
  });

  const filteredCampaigns = campaigns.filter(
    (campaign) =>
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (campaign.type ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.dialerType.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const uploadModalCampaignRow = useMemo(() => {
    if (selectedCampaignId == null) return undefined;
    return campaigns.find((c) => c.id === selectedCampaignId);
  }, [campaigns, selectedCampaignId]);

  const uploadModalDisplayRemaining = uploadModalRemainingLoading
    ? null
    : (uploadModalRemainingCount ??
      uploadModalCampaignRow?.pendingContacts ??
      uploadModalCampaignRow?.contactsRemaining ??
      null);

  const handleSelectCampaign = (id: number) => {
    setSelectedCampaigns((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedCampaigns.length === filteredCampaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(filteredCampaigns.map((c) => c.id));
    }
  };

  /** When user selects a different team: unlink from current team, then set stored teamId, clear finesse data and token, then show Authentication required (no reload). */
  const handleTeamChange = async (newTeamName: string, newTeamId: number) => {
    const currentTeamId = getStoredTeamId();
    if (Number(currentTeamId) === newTeamId) return;
    const previousTeamName = selectedTeam;
    const stored = getFinesseUserData();
    const usernameForCheck =
      stored?.loginId ??
      stored?.loginName ??
      (session?.user as { username?: string } | undefined)?.username ??
      "";
    const switchCheck = await assertFinesseTeamSwitchable(
      newTeamId,
      usernameForCheck || undefined,
      [teamsWithIds, stored?.teams],
    );
    if (!switchCheck.ok) {
      toast.error(switchCheck.message);
      setSelectedTeam(previousTeamName);
      return;
    }
    const { username, teamId } = getFinesseContext();
    if (username && teamId != null) {
      try {
        await finesseUnlink(username, teamId);
      } catch (err: unknown) {
        toast.error(getFinesseApiErrorMessage(err, "Unlink failed"));
        setSelectedTeam(previousTeamName);
        return;
      }
    }
    setStoredTeamId(newTeamId);
    clearFinesseUserData();
    if (typeof globalThis.dispatchEvent === "function") {
      globalThis.dispatchEvent(
        new CustomEvent("finesse-require-reauth", {
          detail: { manualConnect: false },
        }),
      );
    }
  };

  const handleLogout = async () => {
    const { username, teamId } = getFinesseContext();
    if (username && teamId != null) {
      try {
        await finesseUnlink(username, teamId);
      } catch (err: unknown) {
        toast.error(
          getFinesseApiErrorMessage(err, "Failed to unlink from Finesse"),
        );
      }
    }
    clearFinesseUserData();
    setFinesseManualReconnectRequired();
    if (typeof globalThis.dispatchEvent === "function") {
      globalThis.dispatchEvent(
        new CustomEvent("finesse-require-reauth", {
          detail: { manualConnect: true },
        }),
      );
    }
  };

  const handleToggleCampaign = async (id: number) => {
    if (!canChangeCampaignStatus) {
      toast.error("You do not have permission to change campaign status.");
      return;
    }
    const campaign = campaigns.find((c) => c.id === id);
    if (!campaign) return;
    const { username, teamId } = getFinesseContext();
    if (!username || teamId == null) {
      toast.error("user not found.");
      return;
    }
    const newEnabled = !campaign.enabled;
    try {
      await setFinesseCampaignEnabled(teamId, username, id, newEnabled);
      patchCampaignsCache((prev) =>
        prev.map((c) => (c.id === id ? { ...c, enabled: newEnabled } : c)),
      );
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to update campaign.",
      );
    }
  };

  const handleOpenUploadModal = (campaignId: number) => {
    setSelectedCampaignId(campaignId);
    setShowUploadModal(true);
    setUploadedFile(null);
    setAllowDuplicateContacts(true);
    // Columns are loaded from getFinesseCampaignContactsConfig (manual.fieldsOrder)
    setColumnMapping([]);
    setUploadModalRemainingCount(null);
    setUploadModalRemainingLoading(false);
    setUploadModalClearingContacts(false);
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setSelectedCampaignId(null);
    setUploadedFile(null);
    setAllowDuplicateContacts(true);
    setColumnMapping([]);
    setColumnsLoading(false);
    setUploadModalRemainingCount(null);
    setUploadModalRemainingLoading(false);
    setUploadModalClearingContacts(false);
  };

  const buildColumnMappingFromConfig = useCallback((raw: any) => {
    // Typical response shape: { status, statusCode, responseData: { importConfig: { manual: { fieldsOrder: [...] } } } }
    const cfg = raw?.data ?? raw?.responseData ?? raw;
    const fieldsOrder =
      cfg?.importConfig?.manual?.fieldsOrder ??
      cfg?.importConfig?.manual?.fields_order ??
      cfg?.manual?.fieldsOrder ??
      cfg?.manual?.fields_order;

    if (Array.isArray(fieldsOrder)) {
      const rows = fieldsOrder
        .map((f: any, idx: number) => {
          const key = String(f?.name ?? "").trim();
          const value = String(f?.value ?? "").trim();
          const positionRaw = f?.position ?? idx + 1;
          const position = Number(positionRaw);
          const order = Number.isFinite(position) ? position : idx + 1;
          return { id: idx + 1, key, value, order };
        })
        .filter((r: any) => r.key);
      rows.sort((a: any, b: any) => a.order - b.order);
      // Reassign stable id/order
      return rows.map((r: any, idx: number) => ({
        id: idx + 1,
        key: r.key,
        value: r.value,
        order: idx + 1,
      }));
    }

    return [];
  }, []);

  const loadUploadModalRemainingFromApi = useCallback(async (): Promise<
    number | null
  > => {
    if (selectedCampaignId == null) return null;
    const { username, teamId } = getFinesseContext();
    if (!username || teamId == null) return null;
    try {
      const resp = await getFinesseCampaignContacts(
        teamId,
        username,
        selectedCampaignId,
      );
      return extractRemainingContactsCount(resp);
    } catch {
      return null;
    }
  }, [getFinesseContext, selectedCampaignId]);

  // Load columns config + remaining contacts when upload modal opens
  useEffect(() => {
    const run = async () => {
      if (!showUploadModal) return;
      if (selectedCampaignId == null) return;
      const { username, teamId } = getFinesseContext();
      if (!username || teamId == null) return;

      setColumnsLoading(true);
      setUploadModalRemainingLoading(true);
      setUploadModalRemainingCount(null);

      const [configOutcome, count] = await Promise.all([
        getFinesseCampaignContactsConfig(teamId, username, selectedCampaignId)
          .then((r) => ({ ok: true as const, r }))
          .catch(() => ({ ok: false as const })),
        loadUploadModalRemainingFromApi(),
      ]);

      if (configOutcome.ok) {
        const mapped = buildColumnMappingFromConfig(configOutcome.r);
        if (mapped.length > 0) {
          setColumnMapping(mapped);
        }
      } else {
        toast.error("Failed to load contact columns config.");
      }
      setColumnsLoading(false);

      setUploadModalRemainingCount(count);
      setUploadModalRemainingLoading(false);
    };
    run().catch(() => undefined);
  }, [
    showUploadModal,
    selectedCampaignId,
    getFinesseContext,
    buildColumnMappingFromConfig,
    loadUploadModalRemainingFromApi,
  ]);

  const handleRefreshUploadModalContacts = useCallback(async () => {
    if (selectedCampaignId == null) return;
    setUploadModalRemainingLoading(true);
    setUploadModalRemainingCount(null);
    const count = await loadUploadModalRemainingFromApi();
    setUploadModalRemainingCount(count);
    setUploadModalRemainingLoading(false);
    refreshRemainingContacts([selectedCampaignId]).catch(() => undefined);
  }, [
    loadUploadModalRemainingFromApi,
    selectedCampaignId,
    refreshRemainingContacts,
  ]);

  const handleClearUploadModalContacts = useCallback(async () => {
    if (selectedCampaignId == null) return;
    if (uploadModalRemainingLoading || uploadModalClearingContacts) return;
    if ((uploadModalDisplayRemaining ?? 0) <= 0) return;
    const { username, teamId } = getFinesseContext();
    if (!username || teamId == null) {
      toast.error("user not found.");
      return;
    }
    if (
      !globalThis.window?.confirm(
        "Remove all remaining contacts for this campaign? This cannot be undone.",
      )
    ) {
      return;
    }
    setUploadModalClearingContacts(true);
    try {
      await deleteFinesseCampaignContacts(teamId, username, selectedCampaignId);
      toast.success("Remaining contacts removed.");
      setUploadModalRemainingLoading(true);
      setUploadModalRemainingCount(null);
      const count = await loadUploadModalRemainingFromApi();
      setUploadModalRemainingCount(count);
      await refreshRemainingContacts([selectedCampaignId]);
    } catch (err: unknown) {
      toast.error(getFinesseApiErrorMessage(err, "Failed to remove contacts."));
    } finally {
      setUploadModalRemainingLoading(false);
      setUploadModalClearingContacts(false);
    }
  }, [
    selectedCampaignId,
    uploadModalRemainingLoading,
    uploadModalClearingContacts,
    uploadModalDisplayRemaining,
    getFinesseContext,
    loadUploadModalRemainingFromApi,
    refreshRemainingContacts,
  ]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleAddColumn = () => {
    const newId = Math.max(...columnMapping.map((c) => c.id), 0) + 1;
    setColumnMapping([
      ...columnMapping,
      {
        id: newId,
        key: `column${newId}`,
        value: "",
        order: columnMapping.length + 1,
      },
    ]);
  };

  const handleRemoveColumn = (id: number) => {
    const newMapping = columnMapping.filter((c) => c.id !== id);
    // Reorder
    newMapping.forEach((col, index) => {
      col.order = index + 1;
    });
    setColumnMapping(newMapping);
  };

  const handleColumnValueChange = (id: number, newValue: string) => {
    setColumnMapping(
      columnMapping.map((col) =>
        col.id === id ? { ...col, value: newValue } : col,
      ),
    );
  };

  const handleUploadContacts = async () => {
    if (!uploadedFile || selectedCampaignId == null) {
      toast.error("Please select a file to upload.");
      return;
    }
    if (!columnMapping || columnMapping.length === 0) {
      toast.error(
        "No column mapping found. Please load config or add at least one column.",
      );
      return;
    }
    const { username, teamId } = getFinesseContext();
    if (!username || teamId == null) {
      toast.error("user not found.");
      return;
    }
    try {
      const contactHeaders: Record<string, string> = {};
      columnMapping.forEach((c) => {
        const k = String(c?.key ?? "").trim();
        if (!k) return;
        contactHeaders[k] = String(c?.value ?? "").trim();
      });

      await importFinesseCampaignContacts(
        teamId,
        username,
        selectedCampaignId,
        uploadedFile,
        {
          allowDuplicateContacts,
          importType: "MANUAL",
          contactHeaders,
        },
      );
      toast.success("Contacts imported successfully.");
      handleCloseUploadModal();
      if (campaignsQueryKey) {
        await queryClient.refetchQueries({ queryKey: campaignsQueryKey });
      }
      const rowsAfter =
        (campaignsQueryKey
          ? queryClient.getQueryData<CampaignRow[]>(campaignsQueryKey)
          : undefined) ?? [];
      refreshRemainingContacts(rowsAfter.map((c) => c.id)).catch(
        () => undefined,
      );
      const statusData = await getFinesseCampaignsContactsStatus(
        teamId,
        username,
      ).catch(() => null);
      if (statusData) {
        const listStatus =
          (statusData as { importStatuses?: Array<{ campaignId: number }> })
            ?.importStatuses ??
          (statusData as { campaigns?: Array<{ campaignId: number }> })
            ?.campaigns ??
          [];
        const arrStatus = Array.isArray(listStatus) ? listStatus : [];
        const map: Record<number, unknown> = {};
        arrStatus.forEach((s: { campaignId: number }) => {
          map[s.campaignId] = s;
        });
        setImportStatuses(map);
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to import contacts.",
      );
    }
  };

  const handleTimeChange = async (
    campaignId: number,
    field: "timeFrom" | "timeTo" | "startTime" | "endTime",
    value: string,
  ) => {
    if (!canChangeCampaignTiming) {
      toast.error("You do not have permission to change campaign schedule.");
      return;
    }
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign) return;
    const updates: Partial<CampaignRow> = { [field]: value };
    if (field === "startTime") updates.timeFrom = value;
    if (field === "endTime") updates.timeTo = value;
    if (field === "timeFrom") updates.startTime = value;
    if (field === "timeTo") updates.endTime = value;
    const nextStart = updates.startTime ?? campaign.startTime;
    const nextEnd = updates.endTime ?? campaign.endTime;
    patchCampaignsCache((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, ...updates } : c)),
    );
    const { username, teamId } = getFinesseContext();
    if (!username || teamId == null) return;
    try {
      await scheduleFinesseCampaign(teamId, username, campaignId, {
        startTime: nextStart,
        endTime: nextEnd,
      });
      toast.success("Campaign schedule updated.");
    } catch (err: unknown) {
      toast.error(getFinesseApiErrorMessage(err, "Failed to update schedule"));
      patchCampaignsCache((prev) =>
        prev.map((c) => (c.id === campaignId ? { ...campaign } : c)),
      );
    }
  };

  const handleAgentStatusChange = async (newState: string) => {
    const { username, teamId } = getFinesseContext();
    if (!username || teamId == null) {
      toast.error("user not found.");
      return;
    }
    const state =
      newState === "READY" || newState === "NOT_READY" ? newState : "READY";
    try {
      await finesseSetState(teamId, username, state);
      setAgentStatus(state);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update agent state.",
      );
    }
  };

  const renderCapabilityLoadingBlock = (): ReactElement | null => {
    if (!capabilityUsername) return null;
    if (capabilityLoading) {
      return (
        <React.Fragment>
          <BreadcrumbItem
            mainTitle=""
            mainLink=""
            subTitle="Live Calls Campaigns Management"
          />
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "50vh",
            }}
          >
            <Loader
              size={40}
              className="text-primary"
              style={{ animation: "spin 1s linear infinite" }}
            />
          </div>
        </React.Fragment>
      );
    }
    if (!hasCampaignMgmt) {
      return (
        <React.Fragment>
          <BreadcrumbItem
            mainTitle=""
            mainLink=""
            subTitle="Live Calls Campaigns Management"
          />
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "70vh",
              padding: "24px",
            }}
          >
            <div
              className="card"
              style={{ maxWidth: "420px", width: "100%", padding: "32px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "24px",
                }}
              >
                <AlertCircle size={28} color="#f59e0b" />
                <h2
                  style={{
                    margin: 0,
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "#141414",
                  }}
                >
                  Insufficient Capabilities
                </h2>
              </div>
              <p
                style={{
                  color: "#6c757d",
                  fontSize: "14px",
                  marginBottom: "24px",
                }}
              >
                You don&apos;t have sufficient capabilities to access Live Calls
                Campaigns.
              </p>
            </div>
          </div>
        </React.Fragment>
      );
    }
    return null;
  };
  const capabilityLoadingBlock = renderCapabilityLoadingBlock();

  return (
    <FinesseAuthGate
      subTitle="Live Calls Campaigns Management"
      pageLabel="Live Calls Campaigns"
    >
      {capabilityLoadingBlock ?? (
        <React.Fragment>
          <BreadcrumbItem
            mainTitle=""
            mainLink=""
            subTitle="Live Calls Campaigns Management"
          />

          <style>{`
        

        .campaign-info-bar {
          background: linear-gradient(135deg, #0066CC 0%, #0066CC 100%);
          color: white;
          padding: 16px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          animation: slideDown 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .campaign-info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }

        .campaign-info-item strong {
          font-weight: 700;
          opacity: 0.9;
        }

        .call-widget {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 315px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          animation: slideUp 0.3s ease;
          z-index: 1000;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .call-widget-header {
          background: linear-gradient(135deg, #0066CC 0%, #0066CC 100%);
          color: white;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .call-widget-body {
          padding: 15px;
        }

        .call-status {
          text-align: center;
          margin-bottom: 12px;
        }

        .call-timer {
          font-size: 32px;
          font-weight: 700;
          color: #141414;
          margin: 0;
        }

        .call-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          background: #fef3c7;
          color: #92400e;
        }

        .call-status-badge.connected {
          background: #dcfce7;
          color: #166534;
        }

        .call-info-grid {
          display: grid;
          gap: 12px;
          margin-bottom: 5px;
        }

        .call-info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
           padding: 3px 12px;
          background: #f8fafc;
          border-radius: 10px;
          font-size: 14px;
        }

        .call-info-label {
          color: #6c757d;
          font-weight: 500;
        }

        .call-info-value {
          color: #141414;
          font-weight: 600;
        }

        .call-controls {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 5px;
        }

        .call-control-btn {
          width: 100%;
          aspect-ratio: 1;
          border: none;
          border-radius: 12px;
          background: #f8fafc;
          color: #6c757d;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 500;
        }

        .call-control-btn:hover {
          background: #e2e8f0;
          transform: translateY(-2px);
        }

        .call-control-btn.active {
          background: #0066CC;
          color: white;
        }

        .call-action-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .btn-accept {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn-accept:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
        }

        .btn-reject {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn-reject:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
        }

        .btn-end-call {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          width: 100%;
        }

        .btn-end-call:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
        }

        .search-box {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-box input {
          width: 100%;
          padding: 10px 16px 10px 42px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .search-box input:focus {
          outline: none;
          border-color: #0066CC;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .team-selector {
          position: relative;
        }

        .team-selector select {
          padding: 11px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: #475569;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 200px;
        }

        .team-selector select:focus {
          outline: none;
          border-color: #0066CC;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .team-selector select:hover {
          border-color: #0066CC;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .top-right-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-dropdown-container {
          position: relative;
        }

        .status-selector {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          font-weight: 600;
          min-width: 160px;
        }

        .status-selector:hover {
          border-color: #0066CC;
          box-shadow: 0 2px 8px rgba(0, 102, 204, 0.15);
        }

        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          min-width: 200px;
          z-index: 1000;
          overflow: hidden;
          animation: slideDownMenu 0.2s ease;
        }

        @keyframes slideDownMenu {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          font-size: 14px;
          color: #475569;
        }

        .dropdown-item:hover {
          background: #f8fafc;
        }

        .dropdown-item.active {
          background: #EEF2FF;
          color: #0066CC;
        }

        .icon-button {
          width: 44px;
          height: 44px;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: #6c757d;
        }

        .icon-button:hover {
          border-color: #0066CC;
          color: #0066CC;
          box-shadow: 0 2px 8px rgba(0, 102, 204, 0.15);
        }

        .icon-button.refreshing {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .user-menu-button {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #0066CC 0%, #0052A3 100%);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: white;
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0, 102, 204, 0.3);
        }

        .user-menu-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 102, 204, 0.4);
        }

        .content-area {
          padding: 32px;
        }

        .page-header {
          display: block
        }

        .page-title {
          font-size: 32px;
          font-weight: 700;
          color: #141414;
          margin-bottom: 8px;
        }

        .page-subtitle {
          color: #6c757d;
          font-size: 16px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #0066CC 0%, #0052A3 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(0, 102, 204, 0.4);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 102, 204, 0.5);
        }

        .btn-secondary {
          background: white;
          color: #475569;
          border: 2px solid #e5e7eb;
        }

        .btn-secondary:hover {
          border-color: #0066CC;
          color: #0066CC;
        }

        .btn-wrap-up {
          background: linear-gradient(135deg, #2c7ade 0%, #2c7ade 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
        }

        .btn-wrap-up:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(6, 182, 212, 0.5);
        }

        .btn-close {
          background: #fff;
  color: #000;
  opacity: 1;
  padding-right: 37px;
  padding-top: 13px;
  padding-bottom: 13px;
        }

        .btn-close:hover {
          background: #e2e8f0;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .card-header {
          padding: 24px 32px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .card-title {
          font-size: 20px;
          font-weight: 600;
          color: #141414;
        }

        .filters {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .table-container {
          overflow-x: auto;
          overflow-y: visible;
          padding-bottom: 8px;
          max-height: initial !important;
        }

        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        thead th {
          background: #f8fafc;
          padding: 16px 24px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e5e7eb;
        }

        tbody tr {
          transition: all 0.2s;
          border-bottom: 1px solid #f1f5f9;
        }

        tbody tr:hover {
          background: #f8fafc;
        }

        tbody tr.selected {
          background: #EEF2FF;
        }

        tbody td {
          padding: 10px 24px;
          color: #475569;
          font-size: 14px;
        }

        .campaign-name {
          font-weight: 600;
          color: #141414;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge-agent {
          background: #dbeafe;
          color: #1e40af;
        }

        .badge-predictive {
          background: #fef3c7;
          color: #92400e;
        }

        .badge-preview {
          background: #e0e7ff;
          color: #3730a3;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .time-display {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .time-badge {
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 500;
        }

        .time-input {
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 500;
          border: 2px solid transparent;
          font-size: 13px;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
        }

        .time-input:hover {
          background: #e2e8f0;
          border-color: #cbd5e1;
        }

        .time-input:focus {
          outline: none;
          background: white;
          border-color: #0066CC;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .timezone-text {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
        }

        .contacts-remaining {
          font-size: 18px;
          font-weight: 700;
          color: #141414;
        }

        .toggle-switch {
          position: relative;
          width: 48px;
          height: 26px;
          background: #cbd5e1;
          border-radius: 13px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .toggle-switch.enabled {
          background: #10b981;
        }

        .toggle-slider {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: all 0.3s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .toggle-switch.enabled .toggle-slider {
          transform: translateX(22px);
        }

        .action-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: #f8fafc;
          border-radius: 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: #6c757d;
        }

        .action-btn:hover {
          background: #0066CC;
          color: white;
        }

        .action-menu-container {
          position: relative;
          display: inline-block;
        }

        .action-menu {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          min-width: 160px;
          z-index: 1000;
          overflow: hidden;
          animation: slideDownMenu 0.2s ease;
          border: 1px solid #e5e7eb;
        }

        .action-menu.show-above {
          top: auto;
          bottom: calc(100% + 4px);
          animation: slideUpMenu 0.2s ease;
        }

        @keyframes slideUpMenu {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .action-menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          background: white;
          width: 100%;
          text-align: left;
          font-size: 14px;
          color: #475569;
        }

        .action-menu-item:hover {
          background: #f8fafc;
        }

        .checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          cursor: pointer;
        }

        .checkbox.checked {
          background: #0066CC;
          border-color: #0066CC;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.2s ease;
          overflow-y: auto;
          padding: 20px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 800px;
          max-height: 85vh;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.3s ease;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        @keyframes slideIn {
          from {
            transform: translateY(-50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-header {
          padding: 24px 32px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #0066CC 0%, #0066CC 100%);
          color: white;
        }

        .modal-title {
          font-size: 24px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .modal-body {
          padding: 32px;
          overflow-y: auto;
          flex: 1;
        }

        .modal-section {
          margin-bottom: 32px;
        }

        .modal-section:last-child {
          margin-bottom: 0;
        }

        .modal-section-title {
          font-size: 18px;
          font-weight: 600;
          color: #141414;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .upload-area {
          border: 2px dashed #e5e7eb;
          border-radius: 12px;
          padding: 40px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #f8fafc;
        }

        .upload-area:hover {
          border-color: #0066CC;
          background: #f1f5f9;
        }

        .upload-area.active {
          border-color: #0066CC;
          background: #EEF2FF;
        }

        .upload-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          background: linear-gradient(135deg, #0066CC 0%, #0066CC 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .upload-text {
          font-size: 16px;
          font-weight: 600;
          color: #141414;
          margin-bottom: 8px;
        }

        .upload-hint {
          font-size: 14px;
          color: #6c757d;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .file-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #0066CC 0%, #0066CC 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .file-details {
          flex: 1;
        }

        .file-name {
          font-weight: 600;
          color: #141414;
          margin-bottom: 4px;
        }

        .file-size {
          font-size: 13px;
          color: #6c757d;
        }

        .column-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .column-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .column-order {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #0066CC 0%, #0066CC 100%);
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .column-input {
          flex: 1;
          padding: 10px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .column-input:focus {
          outline: none;
          border-color: #0066CC;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .column-controls {
          display: flex;
          gap: 4px;
        }

        .column-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: #6c757d;
          border: 1px solid #e5e7eb;
        }

        .column-btn:hover {
          background: #0066CC;
          color: white;
          border-color: #0066CC;
        }

        .column-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .column-btn:disabled:hover {
          background: white;
          color: #6c757d;
          border-color: #e5e7eb;
        }

        .column-btn.delete:hover {
          background: #ef4444;
          border-color: #ef4444;
        }

        .add-column-btn {
          width: 100%;
          padding: 12px;
          border: 2px dashed #e5e7eb;
          background: white;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 600;
          color: #0066CC;
          transition: all 0.2s;
        }

        .add-column-btn:hover {
          border-color: #0066CC;
          background: #f8fafc;
        }

        .modal-footer {
          padding: 24px 32px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn-cancel {
          background: #f1f5f9;
          color: #6c757d;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel:hover {
          background: #e2e8f0;
        }

        .btn-upload {
          background: linear-gradient(135deg, #0066CC 0%, #0066CC 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-upload:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 102, 204, 0.4);
        }

        @media (max-width: 1024px) {
         

          .call-widget {
            width: 320px;
            bottom: 16px;
            right: 16px;
          }
        }

        @media (max-width: 768px) {
          

          .call-widget {
            width: calc(100% - 32px);
            left: 16px;
            right: 16px;
          }
        }
      `}</style>
          {/* Top Bar */}
          <Row>
            <Col md={12}>
              <TopBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedTeam={selectedTeam}
                setSelectedTeam={setSelectedTeam}
                teams={
                  teamsWithIds.length > 0
                    ? teamsWithIds
                    : teams.map((name, i) => ({ id: i, name }))
                }
                agentStatus={agentStatus}
                setAgentStatus={setAgentStatus}
                showStatusDropdown={showStatusDropdown}
                setShowStatusDropdown={setShowStatusDropdown}
                showUserMenu={showUserMenu}
                setShowUserMenu={setShowUserMenu}
                statusOptions={statusOptions}
                handleLogout={handleLogout}
                onStatusChange={handleAgentStatusChange}
                onTeamChange={
                  teamsWithIds.length > 0 ? handleTeamChange : undefined
                }
              />
            </Col>
          </Row>
          {/* Page Header */}
          <div className="page-header">
            <h1 className="page-title">Campaign </h1>
            <p className="page-subtitle">
              Monitor agent status, availability, and manage team operations in
              real-time
            </p>
          </div>

          {/* Main Table Card */}
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>
                      <label
                        className={`checkbox ${selectedCampaigns.length === filteredCampaigns.length && filteredCampaigns.length > 0 ? "checked" : ""}`}
                        style={{ cursor: "pointer" }}
                      >
                        <input
                          type="checkbox"
                          checked={
                            selectedCampaigns.length ===
                              filteredCampaigns.length &&
                            filteredCampaigns.length > 0
                          }
                          onChange={handleSelectAll}
                          aria-label="Select all campaigns"
                          style={CAMPAIGN_MANAGER_VISUALLY_HIDDEN_INPUT_STYLE}
                        />
                        {selectedCampaigns.length ===
                          filteredCampaigns.length &&
                          filteredCampaigns.length > 0 && (
                            <CheckCircle size={14} color="white" />
                          )}
                      </label>
                    </th>
                    <th>Campaign Name</th>
                    <th>Campaign Type</th>
                    <th>Dialer Type</th>
                    <th>Time</th>
                    <th>Contacts Remaining</th>
                    <th>Enabled</th>
                    <th style={{ width: "80px", textAlign: "center" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaignsLoading && (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          textAlign: "center",
                          padding: "48px 24px",
                          color: "#6c757d",
                        }}
                      >
                        <Loader
                          size={32}
                          style={{
                            display: "inline-block",
                            marginBottom: "12px",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                        <div>Loading campaigns...</div>
                      </td>
                    </tr>
                  )}
                  {!campaignsLoading && filteredCampaigns.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          textAlign: "center",
                          padding: "48px 24px",
                          color: "#6c757d",
                        }}
                      >
                        No campaigns found.
                      </td>
                    </tr>
                  )}
                  {!campaignsLoading &&
                    filteredCampaigns.length > 0 &&
                    filteredCampaigns.map((campaign) => (
                      <tr
                        key={campaign.id}
                        className={
                          selectedCampaigns.includes(campaign.id)
                            ? "selected"
                            : ""
                        }
                      >
                        <td>
                          <label
                            className={`checkbox ${selectedCampaigns.includes(campaign.id) ? "checked" : ""}`}
                            style={{ cursor: "pointer" }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedCampaigns.includes(campaign.id)}
                              onChange={() => handleSelectCampaign(campaign.id)}
                              aria-label={`Select campaign ${campaign.name}`}
                              style={
                                CAMPAIGN_MANAGER_VISUALLY_HIDDEN_INPUT_STYLE
                              }
                            />
                            {selectedCampaigns.includes(campaign.id) && (
                              <CheckCircle size={14} color="white" />
                            )}
                          </label>
                        </td>
                        <td>
                          <div className="campaign-name">
                            <Target size={18} color="#0066CC" />
                            {campaign.name}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge badge-${campaign.type.toLowerCase()}`}
                          >
                            {campaign.type}
                          </span>
                        </td>
                        <td>{campaign.dialerType}</td>
                        <td>
                          <div>
                            <div className="time-display">
                              <span>From</span>
                              <input
                                type="time"
                                className="time-input"
                                value={campaign.startTime}
                                disabled={!canChangeCampaignTiming}
                                title={
                                  canChangeCampaignTiming
                                    ? undefined
                                    : "You do not have permission to change campaign schedule"
                                }
                                onChange={(e) =>
                                  handleTimeChange(
                                    campaign.id,
                                    "startTime",
                                    e.target.value,
                                  )
                                }
                              />
                              <Clock size={14} color="#94a3b8" />
                              <span>To</span>
                              <input
                                type="time"
                                className="time-input"
                                value={campaign.endTime}
                                disabled={!canChangeCampaignTiming}
                                title={
                                  canChangeCampaignTiming
                                    ? undefined
                                    : "You do not have permission to change campaign schedule"
                                }
                                onChange={(e) =>
                                  handleTimeChange(
                                    campaign.id,
                                    "endTime",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="timezone-text">
                              {campaign.timezone}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="contacts-remaining">
                            {campaign.pendingContacts ??
                              campaign.contactsRemaining}
                          </span>
                        </td>
                        <td>
                          <div
                            className={`toggle-switch ${campaign.enabled ? "enabled" : ""} ${canChangeCampaignStatus ? "" : "opacity-50"}`}
                            style={
                              canChangeCampaignStatus
                                ? undefined
                                : { cursor: "not-allowed" }
                            }
                            onClick={() => {
                              if (!canChangeCampaignStatus) return;
                              handleToggleCampaign(campaign.id).catch(
                                () => undefined,
                              );
                            }}
                            onKeyDown={(e) => {
                              if (!canChangeCampaignStatus) return;
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleToggleCampaign(campaign.id).catch(
                                  () => undefined,
                                );
                              }
                            }}
                            role="switch"
                            tabIndex={canChangeCampaignStatus ? 0 : -1}
                            aria-checked={campaign.enabled}
                            aria-disabled={!canChangeCampaignStatus}
                            title={
                              canChangeCampaignStatus
                                ? undefined
                                : "You do not have permission to change campaign status"
                            }
                            aria-label={`Toggle ${campaign.name}`}
                          >
                            <div className="toggle-slider" />
                          </div>
                        </td>
                        <td>
                          <button
                            className="action-btn"
                            title="Update Contacts"
                            onClick={() => handleOpenUploadModal(campaign.id)}
                          >
                            <Upload size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Outgoing Call Widget â€“ dynamic from preview event */}
          <CallWidget {...callWidgetProps} />

          <WrapUpModal {...wrapUpModalProps} />

          {/* Upload Contacts Modal */}
          {showUploadModal && (
            <div className="modal-overlay" onClick={handleCloseUploadModal}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div className="modal-title">
                    <Upload size={28} />
                    Upload Contacts
                  </div>
                  <button
                    className="modal-close-btn"
                    onClick={handleCloseUploadModal}
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="modal-body">
                  {selectedCampaignId != null && (
                    <div
                      style={{
                        marginBottom: "24px",
                        padding: "14px 18px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px 16px",
                        fontSize: "14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          color: "#475569",
                          fontWeight: 600,
                        }}
                      >
                        <Target size={18} color="#0066CC" />
                        <span>
                          {uploadModalCampaignRow?.name ??
                            `Campaign #${selectedCampaignId}`}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            color: "#6c757d",
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>
                            Remaining contacts
                          </span>
                          {uploadModalRemainingLoading ||
                          uploadModalClearingContacts ? (
                            <Loader
                              size={16}
                              className="text-primary"
                              style={{ animation: "spin 1s linear infinite" }}
                            />
                          ) : (
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: "18px",
                                color: "#141414",
                              }}
                            >
                              {uploadModalDisplayRemaining ?? "â€”"}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          className={`action-btn${uploadModalRemainingLoading ? " refreshing" : ""}`}
                          title="Refresh remaining contacts"
                          aria-label="Refresh remaining contacts"
                          onClick={() => {
                            handleRefreshUploadModalContacts().catch(
                              () => undefined,
                            );
                          }}
                          disabled={
                            uploadModalRemainingLoading ||
                            uploadModalClearingContacts
                          }
                        >
                          <RefreshCw size={18} />
                        </button>
                        <button
                          type="button"
                          className="action-btn"
                          title="Remove all remaining contacts"
                          aria-label="Remove all remaining contacts"
                          onClick={() => {
                            handleClearUploadModalContacts().catch(
                              () => undefined,
                            );
                          }}
                          disabled={
                            uploadModalRemainingLoading ||
                            uploadModalClearingContacts ||
                            (uploadModalDisplayRemaining ?? 0) <= 0
                          }
                        >
                          {uploadModalClearingContacts ? (
                            <Loader
                              size={18}
                              style={{ animation: "spin 1s linear infinite" }}
                            />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  {/* File Upload Section */}
                  <div className="modal-section">
                    <div className="modal-section-title">
                      <Upload size={20} />
                      Select File
                    </div>

                    {uploadedFile ? (
                      <div className="file-info">
                        <div className="file-icon">
                          <CheckCircle size={24} />
                        </div>
                        <div className="file-details">
                          <div className="file-name">{uploadedFile.name}</div>
                          <div className="file-size">
                            {(uploadedFile.size / 1024).toFixed(2)} KB
                          </div>
                        </div>
                        <button
                          className="action-btn"
                          onClick={() => {
                            setUploadedFile(null);
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }}
                          title="Remove file"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor={uploadFileInputId}
                        className="upload-area"
                        style={{ cursor: "pointer" }}
                      >
                        <div className="upload-icon">
                          <Upload size={32} />
                        </div>
                        <div className="upload-text">
                          Click to upload or drag and drop
                        </div>
                        <div className="upload-hint">
                          CSV, XLSX, or TXT files (Max 10MB)
                        </div>
                        <input
                          id={uploadFileInputId}
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.xlsx,.txt"
                          style={{ display: "none" }}
                          onChange={handleFileSelect}
                        />
                      </label>
                    )}
                  </div>

                  <div className="modal-section">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "16px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#334155",
                            marginBottom: "4px",
                          }}
                        >
                          Allow duplicate contacts
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#6c757d",
                            maxWidth: "420px",
                          }}
                        >
                          When off, the import may reject or skip rows that
                          duplicate existing contacts.
                        </div>
                      </div>
                      <div
                        className={`toggle-switch ${allowDuplicateContacts ? "enabled" : ""}`}
                        onClick={() => setAllowDuplicateContacts((v) => !v)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setAllowDuplicateContacts((v) => !v);
                          }
                        }}
                        role="switch"
                        tabIndex={0}
                        aria-checked={allowDuplicateContacts}
                        title={
                          allowDuplicateContacts
                            ? "Duplicates allowed"
                            : "Duplicates not allowed"
                        }
                      >
                        <div className="toggle-slider" />
                      </div>
                    </div>
                  </div>

                  {/* Import Status (reference: UpdateContactsModal initialImportStatus) */}
                  {selectedCampaignId != null &&
                    importStatuses[selectedCampaignId] != null && (
                      <div className="modal-section">
                        <div
                          style={{
                            padding: "16px",
                            background: "#f0f9ff",
                            border: "1px solid #bae6fd",
                            borderRadius: "12px",
                            fontSize: "14px",
                            color: "#0c4a6e",
                          }}
                        >
                          <strong>Last import:</strong>{" "}
                          {formatImportStatusDisplay(
                            importStatuses[
                              selectedCampaignId
                            ] as ImportStatusShape,
                          )}
                        </div>
                      </div>
                    )}

                  {/* Column Mapping Section */}
                  <div className="modal-section">
                    <div className="modal-section-title">
                      <Grid size={20} />
                      Column Mapping
                    </div>

                    {columnsLoading && (
                      <div
                        style={{
                          marginTop: "8px",
                          color: "#6c757d",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Loader
                          size={16}
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                        Loading columns from config...
                      </div>
                    )}

                    <div className="column-list">
                      {columnMapping.map((column, index) => (
                        <div key={column.id} className="column-item">
                          <div className="column-order">{column.order}</div>
                          <div
                            style={{
                              minWidth: "88px",
                              fontWeight: 600,
                              color: "#475569",
                            }}
                          >
                            {column.key}
                          </div>
                          <div style={{ flex: 1, minWidth: 220 }}>
                            <AppSelect<ContactHeaderValueOption>
                              instanceId={`contact-header-value-${column.id}`}
                              isSearchable={false}
                              isClearable={false}
                              isDisabled={columnsLoading}
                              options={
                                CAMPAIGN_MANAGER_CONTACT_HEADER_VALUE_OPTIONS
                              }
                              value={
                                CAMPAIGN_MANAGER_CONTACT_HEADER_VALUE_OPTIONS.find(
                                  (o) => o.value === column.value,
                                ) ??
                                CAMPAIGN_MANAGER_CONTACT_HEADER_VALUE_OPTIONS.find(
                                  (o) => o.value === "None",
                                ) ??
                                null
                              }
                              onChange={(opt) =>
                                handleColumnValueChange(
                                  column.id,
                                  (opt as ContactHeaderValueOption | null)
                                    ?.value ?? "None",
                                )
                              }
                              placeholder="Select value"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preview Info */}
                  {uploadedFile && columnMapping.length > 0 && (
                    <div className="modal-section">
                      <div
                        style={{
                          padding: "16px",
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <CheckCircle size={20} color="#16a34a" />
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#166534",
                              marginBottom: "4px",
                            }}
                          >
                            Ready to Upload
                          </div>
                          <div style={{ fontSize: "14px", color: "#15803d" }}>
                            File: {uploadedFile.name} | Columns:{" "}
                            {columnMapping.length}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    className="btn-cancel"
                    onClick={handleCloseUploadModal}
                  >
                    Cancel
                  </button>
                  <button className="btn-upload" onClick={handleUploadContacts}>
                    <Upload size={20} />
                    Upload Contacts
                  </button>
                </div>
              </div>
            </div>
          )}
        </React.Fragment>
      )}
    </FinesseAuthGate>
  );
};

LiveCallsCampaignsManagement.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default LiveCallsCampaignsManagement;
