import { useState, useEffect, useRef, useCallback } from 'react';

interface SSEConfig {
  onMessage?: (data: any) => void;
  onError?: (error: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  uuid?: string;
  date?: string;
  localPartyNumber?: string;
  ownerUsername?: string;
  imagicle?: string;
  preventAutoConnect?: boolean;
}

interface SSEState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastMessage: any;
  parametersReady: boolean;
}

export const useAnalysisSSE = (config: SSEConfig) => {
  const [state, setState] = useState<SSEState>({
    connected: false,
    connecting: false,
    error: null,
    lastMessage: null,
    parametersReady: false
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const configRef = useRef(config);
  const isConnectingRef = useRef(false);
  const hasConnectedRef = useRef(false);
  const lastConnectionParamsRef = useRef<string>('');
  const autoConnectTriggeredRef = useRef(false);
  const currentConnectionUrlRef = useRef<string>('');

  // Update config ref when config changes
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Check if parameters are ready
  useEffect(() => {
    const hasAllParams = !!(config.uuid && config.date && config.localPartyNumber && config.ownerUsername && config.imagicle);
    setState(prev => ({
      ...prev,
      parametersReady: hasAllParams
    }));
    // Reset auto-connect trigger when parameters change
    if (!hasAllParams) {
      autoConnectTriggeredRef.current = false;
      lastConnectionParamsRef.current = '';
    }
  }, [config.uuid, config.date, config.localPartyNumber, config.ownerUsername, config.imagicle]);

  const connect = useCallback(() => {
    // Create a unique key from connection parameters
    const connectionKey = `${configRef.current.uuid}-${configRef.current.date}-${configRef.current.localPartyNumber}-${configRef.current.ownerUsername}-${configRef.current.imagicle}`;
    
    // Prevent multiple simultaneous connections using ref
    if (isConnectingRef.current) {
      console.log('SSE connection attempt already in progress, skipping');
      return;
    }
    
    // Prevent connecting with the same parameters if already attempted
    if (lastConnectionParamsRef.current === connectionKey && (eventSourceRef.current?.readyState === EventSource.CONNECTING || eventSourceRef.current?.readyState === EventSource.OPEN)) {
      console.log('SSE connection already in progress for these parameters, skipping');
      return;
    }
    
    // Prevent multiple simultaneous connections
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      console.log('SSE already connected, skipping reconnect');
      return;
    }
    
    // If already connecting, don't start another connection
    if (eventSourceRef.current?.readyState === EventSource.CONNECTING) {
      console.log('SSE already connecting, skipping reconnect');
      return;
    }
    
    // Mark that we're attempting to connect and store the connection key
    isConnectingRef.current = true;
    lastConnectionParamsRef.current = connectionKey;
    
    // Clean up any existing connection before creating a new one
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Check if required parameters are available
    if (!configRef.current.uuid || !configRef.current.date || !configRef.current.localPartyNumber || !configRef.current.ownerUsername || !configRef.current.imagicle) {
      isConnectingRef.current = false;
      autoConnectTriggeredRef.current = false; // Reset so we can try again when parameters are ready
      currentConnectionUrlRef.current = ''; // Clear URL ref
      console.warn('⚠️ Cannot connect: Missing required parameters', {
        uuid: configRef.current.uuid,
        date: configRef.current.date,
        localPartyNumber: configRef.current.localPartyNumber,
        ownerUsername: configRef.current.ownerUsername,
        imagicle: configRef.current.imagicle
      });
      setState(prev => ({
        ...prev,
        connecting: false,
        error: 'Missing required parameters: uuid, date, localPartyNumber, ownerUsername, imagicle'
      }));
      configRef.current.onError?.('Missing required parameters: uuid, date, localPartyNumber, ownerUsername, imagicle');
      return;
    }

    setState(prev => ({
      ...prev,
      connecting: true,
      error: null
    }));

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (configRef.current.uuid) params.append('uuid', configRef.current.uuid);
      if (configRef.current.date) params.append('date', configRef.current.date);
      if (configRef.current.localPartyNumber) params.append('localPartyNumber', configRef.current.localPartyNumber);
      if (configRef.current.ownerUsername) params.append('ownerUsername', configRef.current.ownerUsername);
      if (configRef.current.imagicle) params.append('imagicle', configRef.current.imagicle);
      
      const sseUrl = `/api/analysis-stream?${params.toString()}`;
      
      // CRITICAL: Check if we're already connecting to this exact URL
      // This prevents duplicate HTTP requests from being made
      if (currentConnectionUrlRef.current === sseUrl && eventSourceRef.current) {
        const readyState: number = (eventSourceRef.current as EventSource).readyState;
        if (readyState === EventSource.CONNECTING || readyState === EventSource.OPEN) {
          console.log('SSE connection already in progress for this URL, skipping duplicate request');
          isConnectingRef.current = false; // Reset since we're not actually connecting
          return;
        }
      }
      
      // Store the URL we're about to connect to BEFORE creating EventSource
      // This prevents race conditions where multiple calls happen before EventSource is created
      currentConnectionUrlRef.current = sseUrl;
      
      console.log('Creating new EventSource for:', sseUrl);
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        isConnectingRef.current = false;
        hasConnectedRef.current = true;
        // Keep autoConnectTriggeredRef as true since we successfully connected
        // Keep currentConnectionUrlRef.current set to prevent duplicate connections
        setState(prev => ({
          ...prev,
          connected: true,
          connecting: false,
          error: null
        }));
        reconnectAttempts.current = 0;
        configRef.current.onOpen?.();
      };

      eventSource.onmessage = (event) => {
        console.log('EventSource onmessage triggered, raw event.data:', event.data);
        try {
          const data = JSON.parse(event.data);
          console.log('Parsed SSE data:', data);
          
          // Check if message indicates an error - stop connection and don't reconnect
          if (data.status === 'error') {
            console.error('Error status received, stopping connection:', data);
            isConnectingRef.current = false;
            autoConnectTriggeredRef.current = false;
            reconnectAttempts.current = maxReconnectAttempts; // Prevent reconnection
            currentConnectionUrlRef.current = '';
            
            // Close the EventSource immediately
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
              eventSourceRef.current = null;
            }
            
            setState(prev => ({
              ...prev,
              error: data.msg || data.message || 'Error received from server',
              connecting: false,
              connected: false,
              lastMessage: data
            }));
            
            // Call onMessage with error data
            configRef.current.onMessage?.(data);
            configRef.current.onError?.(data);
            return;
          }
          
          setState(prev => ({
            ...prev,
            lastMessage: data
          }));
          console.log('Calling onMessage callback with data:', data);
          configRef.current.onMessage?.(data);
        } catch (error) {
          // Still call onMessage with raw data in case it's not JSON
          console.warn('Failed to parse SSE message as JSON, using raw data:', error, event.data);
          configRef.current.onMessage?.(event.data);
        }
      };

      eventSource.onerror = (error) => {
        // Check the readyState to determine if connection is actually closed
        // EventSource.CONNECTING = 0, EventSource.OPEN = 1, EventSource.CLOSED = 2
        const isClosed = eventSource.readyState === EventSource.CLOSED;
        const isConnecting = eventSource.readyState === EventSource.CONNECTING;
        
        // Only treat as error if connection is actually closed
        // If it's still connecting or open, don't reconnect (might be temporary network hiccup)
        if (isClosed) {
          isConnectingRef.current = false;
          // Clear the URL ref
          currentConnectionUrlRef.current = '';
          
          setState(prev => ({
            ...prev,
            error: 'SSE connection closed',
            connecting: false,
            connected: false
          }));
          configRef.current.onError?.(error);
          
          // DO NOT automatically reconnect on error
          // User must manually retry if needed
          autoConnectTriggeredRef.current = false;
          reconnectAttempts.current = maxReconnectAttempts; // Prevent automatic reconnection
          
          console.log('SSE connection closed, not reconnecting automatically');
        } else if (isConnecting) {
          // Connection is still trying to establish, just log but don't reconnect
          console.log('SSE connection still connecting, waiting...');
        } else {
          // Connection is open, might be a temporary error, don't reconnect
          console.log('SSE connection is open, ignoring temporary error');
        }
      };

    } catch (error) {
      isConnectingRef.current = false;
      autoConnectTriggeredRef.current = false; // Reset so we can try again
      currentConnectionUrlRef.current = ''; // Clear URL ref on error
      const errorMessage = error instanceof Error ? error.message : 'Failed to create SSE connection';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        connecting: false
      }));
      configRef.current.onError?.(error);
      console.error('SSE connection error:', error);
    }
  }, []); // Empty dependency array since we use configRef

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Reset all connection tracking refs
    isConnectingRef.current = false;
    hasConnectedRef.current = false;
    reconnectAttempts.current = 0;
    autoConnectTriggeredRef.current = false; // Reset so auto-connect can work again if needed
    lastConnectionParamsRef.current = '';
    currentConnectionUrlRef.current = ''; // Clear URL ref on disconnect

    setState(prev => ({
      ...prev,
      connected: false,
      connecting: false,
      error: null
    }));
  }, []); // Empty dependency array

  // Auto-connect when parameters are ready (unless prevented)
  useEffect(() => {
    // Early return checks - do these synchronously to prevent race conditions
    if (!state.parametersReady) return;
    if (state.connected) return;
    if (state.connecting) return;
    if (isConnectingRef.current) return;
    if (autoConnectTriggeredRef.current) return;
    if (configRef.current.preventAutoConnect) return;
    
    // Check EventSource state synchronously
    if (eventSourceRef.current) {
      const readyState = eventSourceRef.current.readyState;
      if (readyState === EventSource.OPEN || readyState === EventSource.CONNECTING) {
        // Already connected or connecting, don't trigger again
        console.log('Auto-connect blocked: EventSource already exists and is', readyState === EventSource.OPEN ? 'OPEN' : 'CONNECTING');
        return;
      }
    }
    
    // Build the URL to check if we're already connecting to it
    const params = new URLSearchParams();
    if (configRef.current.uuid) params.append('uuid', configRef.current.uuid);
    if (configRef.current.date) params.append('date', configRef.current.date);
    if (configRef.current.localPartyNumber) params.append('localPartyNumber', configRef.current.localPartyNumber);
    if (configRef.current.ownerUsername) params.append('ownerUsername', configRef.current.ownerUsername);
    if (configRef.current.imagicle) params.append('imagicle', configRef.current.imagicle);
    const sseUrl = `/api/analysis-stream?${params.toString()}`;
    
    // CRITICAL: Check if we're already connecting to this exact URL
    if (currentConnectionUrlRef.current === sseUrl) {
      console.log('Auto-connect blocked: Already connecting to this URL');
      return;
    }
    
    // All checks passed - mark that we're triggering auto-connect BEFORE calling connect
    // This prevents the effect from running again even if state hasn't updated yet
    autoConnectTriggeredRef.current = true;
    
    connect();
  }, [state.parametersReady, state.connected, state.connecting, connect]); // connect is stable (empty deps)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []); // Empty dependency array to run only once

  return {
    ...state,
    connect,
    disconnect
  };
};
