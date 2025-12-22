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

// Helper function to safely access localStorage (works in Next.js SSR)
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore errors (e.g., quota exceeded)
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  }
};

export interface CtiEvent {
  type: 'cti_event' | 'state_update' | 'heartbeat' | 'master_election' | 'master_heartbeat';
  data?: any;
  timestamp: number;
  tabId: string;
}

export class CrossTabCtiManager {
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private isMaster: boolean = false;
  private masterCheckInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private eventListeners: Set<(event: CtiEvent) => void> = new Set();
  private stateListeners: Set<(state: any) => void> = new Set();
  private isSupported: boolean;

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

