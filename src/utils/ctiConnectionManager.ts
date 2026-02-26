/**
 * CTI Connection Manager (Singleton)
 * 
 * Manages a single, persistent CTI WebSocket/SSE connection for the entire app.
 * All components share the same connection instance.
 */

import { Client } from '@stomp/stompjs';
import axiosInstance from '@utils/axios';
import { getCrossTabCtiManager } from './crossTabCtiManager';

export interface CtiConnectionState {
  dnsMap: Record<string, any>;
  callStateMap: Record<string, any>;
  eventLog: any[];
  error: string | null;
  isInitialized: boolean;
  userAddress: string;
  summaryData: any;
}

export type CtiStateListener = (state: CtiConnectionState) => void;
export type CtiEventListener = (event: any) => void;

class CtiConnectionManager {
  private static instance: CtiConnectionManager | null = null;
  
  // Connection refs
  private clientRef: Client | null = null;
  private eventSourceRef: EventSource | null = null;
  private tokenRef: string | null = null;
  private userAddressRef: string | null = null;
  private isConnecting: boolean = false;
  private isInitialized: boolean = false;
  private connectionStartTime: number | null = null;
  private reconnectionTimer: NodeJS.Timeout | null = null;
  private isReconnecting: boolean = false;
  
  // State
  private state: CtiConnectionState = {
    dnsMap: {},
    callStateMap: {},
    eventLog: [],
    error: null,
    isInitialized: false,
    userAddress: '',
    summaryData: {
      extensions: 0,
      online: 0,
      offline: 0,
      connected: 0,
      on_hold: 0,
      incoming: 0,
      answered: 0,
      incomingEvents: 0
    }
  };
  
  // Listeners
  private stateListeners: Set<CtiStateListener> = new Set();
  private eventListeners: Set<CtiEventListener> = new Set();
  
  // Cross-tab manager
  private crossTabManager = getCrossTabCtiManager();
  
  private constructor() {
    // Private constructor for singleton
    this.setupCrossTabListeners();
  }
  
  public static getInstance(): CtiConnectionManager {
    if (!CtiConnectionManager.instance) {
      CtiConnectionManager.instance = new CtiConnectionManager();
    }
    return CtiConnectionManager.instance;
  }
  
  private setupCrossTabListeners(): void {
    if (!this.crossTabManager.isCrossTabSupported()) {
      return;
    }
    
    // Listen to events from master tab
    this.crossTabManager.onCtiEvent((event) => {
      if (event.data?.type === 'call_event' && event.data?.event) {
        this.handleCallEvent(event.data.event);
      }
    });
    
    // Listen to state updates from master tab
    this.crossTabManager.onStateUpdate((state) => {
      this.updateState({
        dnsMap: state.dnsMap || this.state.dnsMap,
        callStateMap: state.callStateMap || this.state.callStateMap,
        summaryData: state.summaryData || this.state.summaryData,
        userAddress: state.userAddress || this.state.userAddress,
        isInitialized: state.isInitialized !== undefined ? state.isInitialized : this.state.isInitialized,
        error: null,
        eventLog: this.state.eventLog
      });
    });
  }
  
  private notifyStateListeners(): void {
    this.stateListeners.forEach(listener => {
      try {
        listener({ ...this.state });
      } catch (error) {
        console.error('[CtiConnectionManager] Error in state listener:', error);
      }
    });
  }
  
  private notifyEventListeners(event: any): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[CtiConnectionManager] Error in event listener:', error);
      }
    });
  }
  
  private updateState(updates: Partial<CtiConnectionState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyStateListeners();
    
    // Broadcast state update if master tab
    if (this.crossTabManager.isMasterTab() && this.crossTabManager.isCrossTabSupported()) {
      this.crossTabManager.broadcastStateUpdate(this.state);
    }
  }
  
  private handleCallEvent(evt: any): void {
    // Add to event log
    const newEventLog = [...this.state.eventLog, evt];
    if (newEventLog.length > 200) {
      newEventLog.shift();
    }
    
    // Update call state map
    const callId = evt.callId;
    if (callId) {
      const updatedCallStateMap = { ...this.state.callStateMap };
      
      if (evt.isTerminating) {
        delete updatedCallStateMap[callId];
      } else {
        updatedCallStateMap[callId] = evt;
      }
      
      this.updateState({
        callStateMap: updatedCallStateMap,
        eventLog: newEventLog
      });
    } else {
      this.updateState({
        eventLog: newEventLog
      });
    }
    
    // Notify event listeners
    this.notifyEventListeners(evt);
    
    // Broadcast event if master tab
    if (this.crossTabManager.isMasterTab() && this.crossTabManager.isCrossTabSupported()) {
      this.crossTabManager.broadcastCtiEvent({
        type: 'call_event',
        event: evt
      });
    }
  }
  
  public async initialize(): Promise<void> {
    // Check if already initialized
    if (this.isInitialized && this.eventSourceRef) {
      console.log('[CtiConnectionManager] Already initialized, skipping...');
      return;
    }
    
    // Check if already connecting
    if (this.isConnecting) {
      console.log('[CtiConnectionManager] Already connecting, skipping...');
      return;
    }
    
    // Only master tab should create connection
    if (!this.crossTabManager.isMasterTab() && this.crossTabManager.isCrossTabSupported()) {
      console.log('[CtiConnectionManager] Not master tab, skipping connection creation');
      this.updateState({ isInitialized: true });
      return;
    }
    
    this.isConnecting = true;
    
    try {
      // Get token
      const response = await axiosInstance.get('/cti/connect', {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.status === 200) {
        const data = response.data;
        const token = data.token || data.accessToken || data.bearerToken;
        const userAddress = data.userAddress || data.user_address;
        
        if (token && userAddress) {
          this.tokenRef = token;
          this.userAddressRef = userAddress;
          
          await this.connectViaSSE(token, userAddress);
        } else {
          this.updateState({ error: 'Failed to get token', isInitialized: false });
          this.isConnecting = false;
        }
      } else {
        this.updateState({ error: 'Service unavailable', isInitialized: false });
        this.isConnecting = false;
      }
    } catch (error) {
      this.updateState({ error: 'Service unavailable', isInitialized: false });
      this.isConnecting = false;
    }
  }
  
  private async connectViaSSE(token: string, userAddress: string): Promise<void> {
    // Close existing connection if any
    if (this.eventSourceRef) {
      this.eventSourceRef.close();
      this.eventSourceRef = null;
    }
    
    const params = new URLSearchParams();
    params.append('token', token);
    params.append('userAddress', userAddress);
    params.append('instanceId', 'global-cti-instance');
    params.append('screenId', 'global');
    
    const sseUrl = `/api/cti-stomp-stream?${params.toString()}`;
    
    console.log('[CtiConnectionManager] Creating SSE connection...');
    
    const eventSource = new EventSource(sseUrl);
    this.eventSourceRef = eventSource;
    
    eventSource.onopen = () => {
      console.log('[CtiConnectionManager] ✅ Connection opened successfully');
      this.isConnecting = false;
      this.isInitialized = true;
      this.connectionStartTime = Date.now();
      
      this.updateState({
        isInitialized: true,
        error: null,
        userAddress: userAddress
      });
      
      // Set up reconnection timer (2.5 hours)
      if (this.reconnectionTimer) {
        clearTimeout(this.reconnectionTimer);
      }
      
      this.reconnectionTimer = setTimeout(async () => {
        console.log('[CtiConnectionManager] Reconnecting after 2.5 hours...');
        this.isReconnecting = true;
        await this.initialize();
      }, 9000000); // 2.5 hours
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'DEVICE_STATE') {
          // Handle device state updates
          // This would need to be implemented based on your actual event structure
        } else if (data.type === 'CALL_EVENT') {
          this.handleCallEvent(data.event || data);
        }
      } catch (error) {
        console.error('[CtiConnectionManager] Error parsing event:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('[CtiConnectionManager] EventSource error:', error);
      
      if (eventSource.readyState === EventSource.CLOSED) {
        this.updateState({ error: 'Connection closed', isInitialized: false });
        
        // Attempt reconnection if not already reconnecting
        if (!this.isReconnecting) {
          this.isReconnecting = true;
          setTimeout(async () => {
            await this.initialize();
          }, 3000);
        }
      }
    };
  }
  
  public subscribe(listener: CtiStateListener): () => void {
    this.stateListeners.add(listener);
    
    // Immediately notify with current state
    listener({ ...this.state });
    
    // Return unsubscribe function
    return () => {
      this.stateListeners.delete(listener);
    };
  }
  
  public subscribeToEvents(listener: CtiEventListener): () => void {
    this.eventListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.eventListeners.delete(listener);
    };
  }
  
  public getState(): CtiConnectionState {
    return { ...this.state };
  }
  
  public isConnected(): boolean {
    return this.isInitialized && this.eventSourceRef !== null;
  }
  
  public async publishStompMessage(destination: string, body: string = ''): Promise<boolean> {
    if (!this.tokenRef || !this.userAddressRef) {
      return false;
    }
    
    try {
      const response = await axiosInstance.post('/cti-stomp-stream', {
        token: this.tokenRef,
        userAddress: this.userAddressRef,
        destination,
        body,
        screenId: 'global'
      });
      
      return response.data.success === true;
    } catch (error) {
      return false;
    }
  }
  
  public destroy(): void {
    if (this.eventSourceRef) {
      this.eventSourceRef.close();
      this.eventSourceRef = null;
    }
    
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = null;
    }
    
    this.stateListeners.clear();
    this.eventListeners.clear();
    
    this.isInitialized = false;
    this.isConnecting = false;
    this.isReconnecting = false;
    
    CtiConnectionManager.instance = null;
  }
}

export default CtiConnectionManager;

