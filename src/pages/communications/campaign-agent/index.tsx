import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import React, {
  type ReactElement,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Row, Col } from "react-bootstrap";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { useSession } from "next-auth/react";
import { CheckCircle, XCircle, Loader, RefreshCw, User } from "lucide-react";

import TopBar, { type TeamOption } from "../campaign-partials/TopBarAgent";
import CallWidget from "../campaign-partials/CallWidget";
import WrapUpModal from "../campaign-partials/WrapUp";
import FinesseAuthGate from "../campaign-partials/FinesseAuthGate";
import { toast } from "react-toastify";
import {
  getFinesseUserData,
  getFinesseUser,
  getFinesseToken,
  getFinesseClusterId,
  clearFinesseUserData,
  setFinesseUserData,
  setFinesseManualReconnectRequired,
  finesseUnlink,
  finesseSetState,
  getEffectiveTeamId,
  getStoredTeamId,
  setStoredTeamId,
  assertFinesseTeamSwitchable,
  getFinesseApiErrorMessage,
  normalizeFinesseUserData,
  type FinesseUserData,
} from "@utils/finesse";
import {
  findRosterEntryForLogin,
  mergeAgentProfileFromRoster,
  resolveRosterAgentDisplayState,
} from "@utils/finesseRosterMerge";
import { useFinesseStomp } from "@hooks/live-calls/useFinesseStomp";
import { useFinesseStreamClusterSync } from "@hooks/live-calls/useFinesseStreamClusterSync";
import { useFinesseCampaignPreview } from "@hooks/live-calls/useFinesseCampaignPreview";
import {
  formatFinesseReasonLabel,
  formatFinesseStateDuration,
  getCampaignAgentStateColor,
} from "@utils/communications/campaign-shared/finesseAgentDisplay";
import { CAMPAIGN_AGENT_PAGE_STYLES } from "@utils/communications/campaign-shared/campaignAgentPageStyles";

const CampaignAgentPage = () => {
  const { data: session } = useSession();
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [agentStatus, setAgentStatus] = useState("READY");
  const [searchQuery, setSearchQuery] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [finesseHydrated, setFinesseHydrated] = useState(false);
  const [agentProfile, setAgentProfile] = useState<FinesseUserData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [timeRerender, setTimeRerender] = useState(0);
  const [finesseSseToken, setFinesseSseToken] = useState<string | null>(null);
  const { syncStreamClusterFromTeam, streamConfigBump, setStreamConfigBump } =
    useFinesseStreamClusterSync();
  const profileLoadInFlightRef = useRef(false);

  const statusOptions = [
    { value: "READY", label: "Ready", color: "#10b981", icon: CheckCircle },
    { value: "NOT_READY", label: "Not Ready", color: "#ef4444", icon: XCircle },
  ];

  const finesseUsername =
    getFinesseUserData()?.loginId ??
    getFinesseUserData()?.loginName ??
    (session?.user as { username?: string } | undefined)?.username ??
    "";

  const hydrateFromStorage = useCallback(() => {
    const stored = getFinesseUserData();
    if (stored) {
      setFinesseHydrated(true);
      const withIds: TeamOption[] = (stored.teams ?? []).map((t) => ({
        id: t.id,
        name: t.name,
      }));
      if (withIds.length > 0) {
        setTeams(withIds);
        const storedTeamId = getStoredTeamId();
        const match = withIds.find((t) => t.id === storedTeamId);
        setSelectedTeam(match?.name ?? stored.teamName ?? withIds[0]?.name ?? "");
      } else if (stored.teamName) {
        setTeams([]);
        setSelectedTeam(stored.teamName);
      }
      if (stored.state) setAgentStatus(stored.state);
      setAgentProfile(stored);
    }
  }, []);

  useLayoutEffect(() => {
    if (globalThis.window === undefined) return;
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (globalThis.window === undefined) return;
    const onAuthenticated = () => hydrateFromStorage();
    globalThis.window.addEventListener("finesse-authenticated", onAuthenticated);
    return () =>
      globalThis.window.removeEventListener("finesse-authenticated", onAuthenticated);
  }, [hydrateFromStorage]);

  useEffect(() => {
    const t = setInterval(() => setTimeRerender((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setFinesseSseToken(null);
      return;
    }
    if (globalThis.window === undefined) return;
    setFinesseSseToken(getFinesseToken());
  }, [session?.user]);

  const rosterClusterId = useMemo(
    () => getFinesseClusterId(),
    [finesseHydrated, agentProfile?.loginId, agentProfile?.settings, streamConfigBump],
  );
  const streamTeamId = useMemo(
    () => getEffectiveTeamId(getFinesseUserData()),
    [finesseHydrated, selectedTeam, streamConfigBump],
  );

  const {
    handlePreviewEvent,
    handleAgentStateEvent,
    getFinesseContext,
    callWidgetProps,
    wrapUpModalProps,
  } = useFinesseCampaignPreview(session, {
    selectedTeam,
    includeTeamRow: false,
  });

  const handleRosterEvent = useCallback((raw: unknown) => {
    const d = getFinesseUserData();
    const self =
      d?.loginId ?? d?.loginName ?? finesseUsername ?? "";
    if (!self) return;
    const patch = findRosterEntryForLogin(raw, self);
    const rosterDisplay = patch ? resolveRosterAgentDisplayState(patch) : undefined;
    if (rosterDisplay) {
      setAgentStatus(rosterDisplay);
      handleAgentStateEvent({ state: rosterDisplay });
    }
    setAgentProfile((prev) => {
      if (!prev) return prev;
      const next = mergeAgentProfileFromRoster(prev, raw, self);
      const stored = getFinesseUserData();
      if (
        stored &&
        (stored.loginId === next.loginId || stored.loginName === next.loginName)
      ) {
        setFinesseUserData(next);
      }
      return next;
    });
  }, [finesseUsername, handleAgentStateEvent]);

  const handleFinesseStateEvent = useCallback((p: { state?: string }) => {
    if (!p?.state) return;
    handleAgentStateEvent(p);
    setAgentStatus(p.state);
    setAgentProfile((prev) => (prev ? { ...prev, state: p.state } : prev));
    const stored = getFinesseUserData();
    if (stored) {
      setFinesseUserData({ ...stored, state: p.state });
    }
  }, [handleAgentStateEvent]);

  const handleFinesseErrorEvent = useCallback((p: unknown) => {
    toast.error((p as { message?: string })?.message ?? "Finesse error");
  }, []);

  const handleFinesseAuthError = useCallback((msg: string) => {
    toast.error(msg);
  }, []);

  const handleStompConnected = useCallback(() => {
    syncStreamClusterFromTeam().catch(() => undefined);
  }, [syncStreamClusterFromTeam]);

  useFinesseStomp({
    token: finesseSseToken,
    finesseUserId: finesseUsername || null,
    clusterId: rosterClusterId,
    teamId: streamTeamId,
    onStateEvent: handleFinesseStateEvent,
    onPreviewEvent: handlePreviewEvent,
    onErrorEvent: handleFinesseErrorEvent,
    onAuthError: handleFinesseAuthError,
    onRosterEvent: handleRosterEvent,
    onStompConnected: handleStompConnected,
  });

  const loadSelfProfile = useCallback(async () => {
    if (!finesseHydrated) return;
    if (profileLoadInFlightRef.current) return;
    const data = getFinesseUserData();
    const teamId = getStoredTeamId();
    const username =
      data?.loginId ??
      data?.loginName ??
      (session?.user as { username?: string } | undefined)?.username ??
      "";
    if (!username || teamId == null) return;

    profileLoadInFlightRef.current = true;
    setProfileLoading(true);
    try {
      const response = await getFinesseUser(teamId, username);
      const resData = response?.responseData ?? response;
      if (!resData) return;
      const normalized = normalizeFinesseUserData(resData as FinesseUserData);
      const clusterBefore = getFinesseClusterId();
      setFinesseUserData(normalized);
      setAgentProfile(normalized);
      if (!clusterBefore && getFinesseClusterId()) {
        setStreamConfigBump((b) => b + 1);
      }
      const withIds: TeamOption[] = (normalized.teams ?? []).map((t) => ({
        id: t.id,
        name: t.name,
      }));
      if (withIds.length > 0) {
        setTeams(withIds);
        const match = withIds.find((t) => t.id === teamId);
        setSelectedTeam(
          match?.name ?? normalized.teamName ?? withIds[0]?.name ?? "",
        );
      }
      if (normalized.state) setAgentStatus(normalized.state);
      if (!getFinesseClusterId()) {
        await syncStreamClusterFromTeam();
      }
    } catch (err: unknown) {
      toast.error(getFinesseApiErrorMessage(err, "Failed to load your agent profile"));
      const stored = getFinesseUserData();
      if (stored) setAgentProfile(stored);
    } finally {
      profileLoadInFlightRef.current = false;
      setProfileLoading(false);
    }
  }, [finesseHydrated, session?.user, syncStreamClusterFromTeam, setStreamConfigBump]);

  useEffect(() => {
    if (!finesseHydrated) return;
    loadSelfProfile().catch(() => undefined);
  }, [finesseHydrated, loadSelfProfile]);

  const handleTeamChange = async (newTeamName: string, newTeamId: number) => {
    if (Number(getStoredTeamId()) === newTeamId) return;
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
      [teams, stored?.teams],
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
    globalThis.dispatchEvent(
      new CustomEvent("finesse-require-reauth", { detail: { manualConnect: false } }),
    );
  };

  const handleLogout = async () => {
    const { username, teamId } = getFinesseContext();
    if (username && teamId != null) {
      try {
        await finesseUnlink(username, teamId);
      } catch (err: unknown) {
        toast.error(getFinesseApiErrorMessage(err, "Failed to unlink from Finesse"));
      }
    }
    clearFinesseUserData();
    setFinesseManualReconnectRequired();
    globalThis.dispatchEvent(
      new CustomEvent("finesse-require-reauth", { detail: { manualConnect: true } }),
    );
  };

  const handleAgentStatusChange = async (newState: string) => {
    const { username, teamId } = getFinesseContext();
    if (!username || teamId == null) {
      toast.error("User not found.");
      return;
    }
    const state = newState === "READY" || newState === "NOT_READY" ? newState : "READY";
    try {
      await finesseSetState(teamId, username, state);
      setAgentStatus(state);
      setAgentProfile((prev) => (prev ? { ...prev, state } : prev));
      loadSelfProfile().catch(() => undefined);
    } catch (err: unknown) {
      toast.error(
        getFinesseApiErrorMessage(err, "Failed to update agent state."),
      );
    }
  };

  const displayName = [agentProfile?.firstName, agentProfile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const loginLabel =
    agentProfile?.loginId ?? agentProfile?.loginName ?? finesseUsername ?? "â€”";
  const teamLabel = agentProfile?.teamName ?? selectedTeam ?? "â€”";
  const reasonLabel = formatFinesseReasonLabel(agentProfile?.reasonCode);

  const topBarTeams = useMemo((): TeamOption[] => {
    if (teams.length > 0) return teams;
    if (selectedTeam) {
      return [{ id: getStoredTeamId(), name: selectedTeam }];
    }
    return [];
  }, [teams, selectedTeam]);

  return (
    <FinesseAuthGate
      subTitle="Campaign Agent"
      pageLabel="Campaign Agent"
      authMessage="Sign in to Finesse to view your agent details."
    >
      <BreadcrumbItem
        mainTitle="Campaign Agent"
        mainLink="/communications/campaign-agent"
        subTitle="Campaign Agent"
      />

      <style>{CAMPAIGN_AGENT_PAGE_STYLES}</style>

      <div className="campaign-agent-page">
        <Row>
          <Col md={12}>
            <TopBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedTeam={selectedTeam}
              setSelectedTeam={setSelectedTeam}
              teams={topBarTeams}
              agentStatus={agentStatus}
              setAgentStatus={setAgentStatus}
              showStatusDropdown={showStatusDropdown}
              setShowStatusDropdown={setShowStatusDropdown}
              showUserMenu={showUserMenu}
              setShowUserMenu={setShowUserMenu}
              statusOptions={statusOptions}
              handleLogout={handleLogout}
              onStatusChange={handleAgentStatusChange}
              onTeamChange={teams.length > 0 ? handleTeamChange : undefined}
            />
          </Col>
        </Row>

        <div className="page-header" style={{ marginTop: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div className="agent-hero">
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #0066CC 0%, #0052A3 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  flexShrink: 0,
                }}
              >
                <User size={28} />
              </div>
              <div>
                <h1 className="page-title" style={{ marginBottom: 4 }}>
                  Your Stats
                </h1>
                <p className="page-subtitle" style={{ margin: 0 }}>
                  Signed-in Finesse identity and presence for this session only.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
              disabled={profileLoading}
              onClick={() => {
                loadSelfProfile().catch(() => undefined);
              }}
            >
              {profileLoading ? (
                <Loader size={18} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <RefreshCw size={18} />
              )}
              Refresh
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          {profileLoading && !agentProfile ? (
            <div
              className="d-flex justify-content-center align-items-center py-5"
              style={{ color: "#6c757d" }}
            >
              <Loader size={32} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : (
            <div className="detail-grid">
                <div className="detail-tile">
                  <div className="detail-label">Display name</div>
                  <div className="detail-value">
                    {displayName || loginLabel}
                  </div>
                </div>
                <div className="detail-tile">
                  <div className="detail-label">Login</div>
                  <div className="detail-value">{loginLabel}</div>
                </div>
                <div className="detail-tile">
                  <div className="detail-label">Extension</div>
                  <div className="detail-value">{agentProfile?.extension ?? "â€”"}</div>
                </div>
                <div className="detail-tile">
                  <div className="detail-label">Team</div>
                  <div className="detail-value">{teamLabel}</div>
                </div>
                <div className="detail-tile">
                  <div className="detail-label">State</div>
                  <div className="detail-value">
                    <span
                      className="state-pill"
                      style={{
                        background: `${getCampaignAgentStateColor(agentProfile?.state ?? agentStatus)}18`,
                        color: getCampaignAgentStateColor(agentProfile?.state ?? agentStatus),
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: getCampaignAgentStateColor(agentProfile?.state ?? agentStatus),
                        }}
                      />
                      {agentProfile?.state ?? agentStatus ?? "â€”"}
                    </span>
                  </div>
                </div>
                <div className="detail-tile">
                  <div className="detail-label">Time in state</div>
                  <div className="detail-value" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatFinesseStateDuration(agentProfile?.stateChangeTime, timeRerender)}
                  </div>
                </div>
                <div className="detail-tile">
                  <div className="detail-label">Reason / not-ready</div>
                  <div className="detail-value">{reasonLabel ?? "â€”"}</div>
                </div>
                <div className="detail-tile">
                  <div className="detail-label">Roles</div>
                  <div className="detail-value">
                    {agentProfile?.roles?.length
                      ? agentProfile.roles.join(", ")
                      : "â€”"}
                  </div>
                </div>
              </div>
          )}
        </div>
      </div>

      <CallWidget {...callWidgetProps} />
      <WrapUpModal {...wrapUpModalProps} />
    </FinesseAuthGate>
  );
};

CampaignAgentPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CampaignAgentPage;
