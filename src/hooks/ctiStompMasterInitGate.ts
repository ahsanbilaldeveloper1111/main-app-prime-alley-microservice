import type { CrossTabCtiManager } from "../utils/crossTabCtiManager";

const MASTER_TAB_KEY = "cti_master_tab_id";
const MASTER_TAB_HEARTBEAT_KEY = "cti_master_tab_id_heartbeat";
const MASTER_TAB_TIMEOUT_MS = 5000;

type SafeStorage = {
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
};

type ManagerPick = Pick<
  CrossTabCtiManager,
  "isCrossTabSupported" | "isMasterTab" | "requestAction"
>;

function isLiveCallsRoute(routerPathname: string | undefined): boolean {
  return Boolean(
    routerPathname?.includes("live-calls") ||
      (typeof globalThis !== "undefined" &&
        globalThis.window?.location.pathname?.includes("live-calls")),
  );
}

function requestInitialStateForLiveCallsPage(
  manager: ManagerPick,
  routerPathname: string | undefined,
  currentInstanceId: string,
): void {
  if (!isLiveCallsRoute(routerPathname) || !manager.isCrossTabSupported()) {
    return;
  }
  manager.requestAction("requestInitialState", {}).catch((error: unknown) => {
    console.log(
      `[${currentInstanceId}] Failed to request initial state from master:`,
      error,
    );
  });
  console.log(
    `[${currentInstanceId}] Requested initial state for live-calls page from master tab`,
  );
}

function finalizeFollowerWait(
  isConnectingRef: { current: boolean },
  isGettingTokenRef: { current: boolean },
  setFollowerUiReady: () => void,
): void {
  isConnectingRef.current = false;
  isGettingTokenRef.current = false;
  setFollowerUiReady();
}

function abortAsFollowerTab(options: {
  manager: ManagerPick;
  routerPathname: string | undefined;
  currentInstanceId: string;
  isConnectingRef: { current: boolean };
  isGettingTokenRef: { current: boolean };
  setFollowerUiReady: () => void;
  logMessage: string;
}): "abort" {
  console.log(options.logMessage);
  requestInitialStateForLiveCallsPage(
    options.manager,
    options.routerPathname,
    options.currentInstanceId,
  );
  finalizeFollowerWait(
    options.isConnectingRef,
    options.isGettingTokenRef,
    options.setFollowerUiReady,
  );
  return "abort";
}

function clearStaleMasterKeys(storage: SafeStorage): void {
  storage.removeItem(MASTER_TAB_KEY);
  storage.removeItem(MASTER_TAB_HEARTBEAT_KEY);
}

/**
 * When global + cross-tab: ensures only the master tab proceeds to open SSE.
 * @returns `abort` if initialize() should return null; `continue_master` if this tab owns the connection;
 *          `skipped` if cross-tab / global rules do not apply.
 */
export function runCtiMasterTabInitGate(options: {
  currentInstanceId: string;
  isGlobalInstance: boolean;
  manager: ManagerPick;
  storage: SafeStorage;
  routerPathname: string | undefined;
  isConnectingRef: { current: boolean };
  isGettingTokenRef: { current: boolean };
  setFollowerUiReady: () => void;
}): "skipped" | "abort" | "continue_master" {
  const {
    currentInstanceId,
    isGlobalInstance,
    manager,
    storage,
    routerPathname,
    isConnectingRef,
    isGettingTokenRef,
    setFollowerUiReady,
  } = options;

  if (!isGlobalInstance || !manager.isCrossTabSupported()) {
    return "skipped";
  }

  let isMaster = manager.isMasterTab();
  if (isMaster) {
    console.log(
      `[${currentInstanceId}] This tab is master, initializing connection...`,
    );
    return "continue_master";
  }

  console.log(
    `[${currentInstanceId}] Not master tab, checking for stale master entry...`,
  );

  const masterTabId = storage.getItem(MASTER_TAB_KEY);
  const lastHeartbeat = storage.getItem(MASTER_TAB_HEARTBEAT_KEY);

  if (!masterTabId || !lastHeartbeat) {
    console.log(
      `[${currentInstanceId}] No master exists, forcing master election...`,
    );
    isMaster = manager.isMasterTab();
    if (isMaster) {
      console.log(
        `[${currentInstanceId}] No master exists, became master, proceeding with initialization...`,
      );
      console.log(
        `[${currentInstanceId}] This tab is master, initializing connection...`,
      );
      return "continue_master";
    }
    console.log(
      `[${currentInstanceId}] Failed to become master when none exists, waiting...`,
    );
    finalizeFollowerWait(
      isConnectingRef,
      isGettingTokenRef,
      setFollowerUiReady,
    );
    return "abort";
  }

  const heartbeatTime = Number.parseInt(lastHeartbeat, 10);
  const timeSinceHeartbeat = Date.now() - heartbeatTime;

  if (timeSinceHeartbeat <= MASTER_TAB_TIMEOUT_MS) {
    return abortAsFollowerTab({
      manager,
      routerPathname,
      currentInstanceId,
      isConnectingRef,
      isGettingTokenRef,
      setFollowerUiReady,
      logMessage: `[${currentInstanceId}] Active master tab exists, waiting for state from master tab...`,
    });
  }

  console.log(
    `[${currentInstanceId}] Stale master detected (${Math.round(timeSinceHeartbeat / 1000)}s old), clearing and retrying master election...`,
  );
  clearStaleMasterKeys(storage);
  isMaster = manager.isMasterTab();

  if (!isMaster) {
    return abortAsFollowerTab({
      manager,
      routerPathname,
      currentInstanceId,
      isConnectingRef,
      isGettingTokenRef,
      setFollowerUiReady,
      logMessage: `[${currentInstanceId}] Still not master after clearing stale entry, waiting for state from master tab...`,
    });
  }

  console.log(
    `[${currentInstanceId}] Successfully became master after clearing stale entry, proceeding with initialization...`,
  );
  console.log(
    `[${currentInstanceId}] This tab is master, initializing connection...`,
  );
  return "continue_master";
}
