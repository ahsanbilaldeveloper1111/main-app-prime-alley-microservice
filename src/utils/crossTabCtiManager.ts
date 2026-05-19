/**
 * Cross-Tab CTI Manager
 * 
 * Manages CTI state and WebSocket connection sharing across browser tabs.
 * Uses BroadcastChannel API for cross-tab communication.
 * Only one tab (the "master") maintains the WebSocket connection.
 * Other tabs receive events via BroadcastChannel.
 */

const MASTER_TAB_KEY = 'cti_master_tab_id';
const MASTER_TAB_TIMEOUT = 5000; // 5 seconds - if master doesn't heartbeat, elect new master
const HEARTBEAT_INTERVAL = 2000; // 2 seconds - master tab sends heartbeat
const BROADCAST_CHANNEL_NAME = 'cti-broadcast-channel';

// Helper function to safely access localStorage (works in Next.js SSR + private browsing)
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const fromLocal = localStorage.getItem(key);
      if (fromLocal != null) {
        return fromLocal;
      }
    } catch {
      // fall through to sessionStorage
    }
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
      return;
    } catch {
      // fall through to sessionStorage (common in strict private mode / quota)
    }
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Ignore errors (e.g., quota exceeded, storage disabled)
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
};

export interface CtiEvent {
  type: 'cti_event' | 'state_update' | 'heartbeat' | 'master_election' | 'master_heartbeat' | 'action_request' | 'action_response';
  data?: any;
  timestamp: number;
  tabId: string;
  actionId?: string; // For action request/response correlation
}

export class CrossTabCtiManager {
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private isMaster: boolean = false;
  private masterCheckInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private eventListeners: Set<(event: CtiEvent) => void> = new Set();
  private stateListeners: Set<(state: any) => void> = new Set();
  private actionListeners: Set<(event: CtiEvent) => void> = new Set();
  private pendingActions: Map<string, { resolve: (value: any) => void; reject: (error: any) => void }> = new Map();
  private isSupported: boolean;
  /** When persistent storage is blocked, master liveness is tracked in-memory for this tab. */
  private lastLocalHeartbeatAt: number | null = null;

  constructor() {
    this.tabId = this.generateTabId();
    // Check if we're in browser environment and BroadcastChannel is available
    this.isSupported = typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined';
    
    if (this.isSupported) {
      this.initializeChannel();
      this.electMaster();
      this.startMasterMonitoring();
    } else {
      // In SSR or unsupported environment, this tab is master (fallback)
      this.isMaster = true;
    }
  }

  private generateTabId(): string {
    return `tab-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private initializeChannel(): void {
    if (!this.isSupported) return;

    try {
      this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      
      this.channel.onmessage = (event: MessageEvent<CtiEvent>) => {
        this.handleMessage(event.data);
      };
    } catch (error) {
      console.error('[CrossTabCtiManager] Failed to initialize BroadcastChannel:', error);
      this.isSupported = false;
    }
  }

  private handleMessage(event: CtiEvent): void {
    // Ignore messages from self
    if (event.tabId === this.tabId) return;

    switch (event.type) {
      case 'cti_event':
        // Broadcast CTI event to all listeners
        this.eventListeners.forEach(listener => listener(event));
        break;

      case 'state_update':
        // Broadcast state update to all listeners
        this.stateListeners.forEach(listener => listener(event.data));
        break;

      case 'master_election':
        // Another tab is claiming master status
        this.checkMasterStatus();
        break;

      case 'master_heartbeat':
        // Master tab is alive
        if (event.tabId === this.getMasterTabId()) {
          safeLocalStorage.setItem(`${MASTER_TAB_KEY}_heartbeat`, Date.now().toString());
        }
        break;

      case 'action_request':
        // Non-master tab is requesting an action - master should handle it
        if (this.isMaster) {
          this.actionListeners.forEach(listener => listener(event));
        }
        break;

      case 'action_response':
        // Master tab responded to an action request
        if (event.actionId && this.pendingActions.has(event.actionId)) {
          const { resolve, reject } = this.pendingActions.get(event.actionId)!;
          this.pendingActions.delete(event.actionId);
          if (event.data?.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data?.result);
          }
        }
        break;

      default:
        break;
    }
  }

  private electMaster(): void {
    if (!this.isSupported) {
      this.isMaster = true; // Fallback: this tab is master
      return;
    }

    const currentMaster = this.getMasterTabId();
    const lastHeartbeat = safeLocalStorage.getItem(`${MASTER_TAB_KEY}_heartbeat`);
    
    // If no master exists or master hasn't sent heartbeat recently, become master
    if (!currentMaster || !lastHeartbeat) {
      this.becomeMaster();
      return;
    }

    const heartbeatTime = parseInt(lastHeartbeat, 10);
    const timeSinceHeartbeat = Date.now() - heartbeatTime;

    // If master is dead (no heartbeat for timeout period), become master
    if (timeSinceHeartbeat > MASTER_TAB_TIMEOUT) {
      this.becomeMaster();
      return;
    }

    // If we are the current master, confirm it
    if (currentMaster === this.tabId) {
      this.isMaster = true;
      this.startHeartbeat();
    } else {
      this.isMaster = false;
    }
  }

  private becomeMaster(): void {
    this.isMaster = true;
    this.lastLocalHeartbeatAt = Date.now();
    safeLocalStorage.setItem(MASTER_TAB_KEY, this.tabId);
    safeLocalStorage.setItem(`${MASTER_TAB_KEY}_heartbeat`, Date.now().toString());
    
    // Broadcast master election
    this.broadcast({
      type: 'master_election',
      tabId: this.tabId,
      timestamp: Date.now()
    });

    this.startHeartbeat();
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.isMaster) {
        this.lastLocalHeartbeatAt = Date.now();
        safeLocalStorage.setItem(`${MASTER_TAB_KEY}_heartbeat`, Date.now().toString());
        
        this.broadcast({
          type: 'master_heartbeat',
          tabId: this.tabId,
          timestamp: Date.now()
        });
      }
    }, HEARTBEAT_INTERVAL);
  }

  private startMasterMonitoring(): void {
    // Check master status periodically
    this.masterCheckInterval = setInterval(() => {
      this.checkMasterStatus();
    }, 3000); // Check every 3 seconds

    // Listen for storage events (when master tab closes)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === MASTER_TAB_KEY || e.key === `${MASTER_TAB_KEY}_heartbeat`) {
          this.checkMasterStatus();
        }
      });

      // Listen for page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkMasterStatus();
        }
      });

      // Clean up on page unload
      window.addEventListener('beforeunload', () => {
        if (this.isMaster) {
          // Clear master status so another tab can take over
          safeLocalStorage.removeItem(MASTER_TAB_KEY);
          safeLocalStorage.removeItem(`${MASTER_TAB_KEY}_heartbeat`);
        }
      });
    }
  }

  private checkMasterStatus(): void {
    const currentMaster = this.getMasterTabId();
    
    if (currentMaster === this.tabId) {
      if (!this.isMaster) {
        // We should be master but aren't
        this.becomeMaster();
      }
      return;
    }

    // Check if current master is alive
    const lastHeartbeat = safeLocalStorage.getItem(`${MASTER_TAB_KEY}_heartbeat`);
    if (!lastHeartbeat) {
      // No heartbeat, elect new master
      this.electMaster();
      return;
    }

    const heartbeatTime = parseInt(lastHeartbeat, 10);
    const timeSinceHeartbeat = Date.now() - heartbeatTime;

    if (timeSinceHeartbeat > MASTER_TAB_TIMEOUT) {
      // Master is dead, become master
      this.becomeMaster();
    } else if (this.isMaster && currentMaster !== this.tabId) {
      // We think we're master but another tab is registered
      this.isMaster = false;
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
    }
  }

  private getMasterTabId(): string | null {
    return safeLocalStorage.getItem(MASTER_TAB_KEY);
  }

  private getLastHeartbeatMs(): number | null {
    const stored = safeLocalStorage.getItem(`${MASTER_TAB_KEY}_heartbeat`);
    if (stored) {
      const parsed = Number.parseInt(stored, 10);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return this.lastLocalHeartbeatAt;
  }

  /**
   * True when another tab is the active CTI master (fresh heartbeat, different tab id).
   * Used to avoid closing SSE on transient demotion in private/single-tab edge cases.
   */
  public hasActiveRemoteMasterTab(): boolean {
    if (!this.isSupported || this.isMaster) {
      return false;
    }
    const masterId = this.getMasterTabId();
    if (!masterId || masterId === this.tabId) {
      return false;
    }
    const heartbeatMs = this.getLastHeartbeatMs();
    if (heartbeatMs == null) {
      return false;
    }
    return Date.now() - heartbeatMs <= MASTER_TAB_TIMEOUT;
  }

  private broadcast(event: CtiEvent): void {
    if (!this.isSupported || !this.channel) return;

    try {
      this.channel.postMessage(event);
    } catch (error) {
      console.error('[CrossTabCtiManager] Failed to broadcast message:', error);
    }
  }

  // Public API

  /**
   * Check if this tab is the master tab (maintains WebSocket connection)
   */
  public isMasterTab(): boolean {
    return this.isMaster;
  }

  /**
   * Broadcast a CTI event to all tabs
   */
  public broadcastCtiEvent(data: any): void {
    if (!this.isMaster) return; // Only master broadcasts events

    this.broadcast({
      type: 'cti_event',
      data,
      tabId: this.tabId,
      timestamp: Date.now()
    });
  }

  /**
   * Broadcast state update to all tabs
   */
  public broadcastStateUpdate(state: any): void {
    if (!this.isMaster) return; // Only master broadcasts state

    this.broadcast({
      type: 'state_update',
      data: state,
      tabId: this.tabId,
      timestamp: Date.now()
    });
  }

  /**
   * Subscribe to CTI events from master tab
   */
  public onCtiEvent(listener: (event: CtiEvent) => void): () => void {
    this.eventListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  /**
   * Subscribe to state updates from master tab
   */
  public onStateUpdate(listener: (state: any) => void): () => void {
    this.stateListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  /**
   * Subscribe to action requests from non-master tabs (master tab only)
   */
  public onActionRequest(listener: (event: CtiEvent) => void): () => void {
    this.actionListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.actionListeners.delete(listener);
    };
  }

  /**
   * Request an action from the master tab (non-master tabs use this)
   * Returns a promise that resolves when the master tab completes the action
   */
  public async requestAction(actionType: string, actionData: any): Promise<any> {
    if (this.isMaster) {
      // If we're the master, we can't forward to ourselves
      // This shouldn't happen, but handle it gracefully
      throw new Error('Cannot request action from master tab - execute directly');
    }

    if (!this.isSupported) {
      throw new Error('Cross-tab communication not supported');
    }

    const actionId = `${this.tabId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    return new Promise((resolve, reject) => {
      // Set timeout for action response
      const timeout = setTimeout(() => {
        if (this.pendingActions.has(actionId)) {
          this.pendingActions.delete(actionId);
          reject(new Error('Action request timeout - master tab may be unavailable'));
        }
      }, 30000); // 30 second timeout

      // Wrapper functions that clear timeout
      const wrappedResolve = (value: any) => {
        clearTimeout(timeout);
        resolve(value);
      };
      const wrappedReject = (error: any) => {
        clearTimeout(timeout);
        reject(error);
      };

      // Store the promise handlers
      this.pendingActions.set(actionId, { resolve: wrappedResolve, reject: wrappedReject });

      // Send action request to master tab
      this.broadcast({
        type: 'action_request',
        data: {
          actionType,
          actionData
        },
        tabId: this.tabId,
        actionId,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Send action response to requesting tab (master tab uses this)
   */
  public sendActionResponse(actionId: string, result?: any, error?: string): void {
    if (!this.isMaster) {
      console.warn('[CrossTabCtiManager] Only master tab can send action responses');
      return;
    }

    this.broadcast({
      type: 'action_response',
      data: {
        result,
        error
      },
      tabId: this.tabId,
      actionId,
      timestamp: Date.now()
    });
  }

  /**
   * Check if cross-tab communication is supported
   */
  public isCrossTabSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get the current tab ID
   */
  public getTabId(): string {
    return this.tabId;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.masterCheckInterval) {
      clearInterval(this.masterCheckInterval);
      this.masterCheckInterval = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.isMaster) {
      safeLocalStorage.removeItem(MASTER_TAB_KEY);
      safeLocalStorage.removeItem(`${MASTER_TAB_KEY}_heartbeat`);
    }

    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }

    this.eventListeners.clear();
    this.stateListeners.clear();
  }
}

// Singleton instance
let crossTabManagerInstance: CrossTabCtiManager | null = null;

export function getCrossTabCtiManager(): CrossTabCtiManager {
  if (!crossTabManagerInstance) {
    crossTabManagerInstance = new CrossTabCtiManager();
  }
  return crossTabManagerInstance;
}

