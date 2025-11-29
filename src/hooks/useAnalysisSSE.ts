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
  }, [config.uuid, config.date, config.localPartyNumber, config.ownerUsername, config.imagicle]);

  const connect = useCallback(() => {
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
    
    // Clean up any existing connection before creating a new one
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Check if required parameters are available
    if (!configRef.current.uuid || !configRef.current.date || !configRef.current.localPartyNumber || !configRef.current.ownerUsername || !configRef.current.imagicle) {
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
      
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
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
        try {
          const data = JSON.parse(event.data);
          setState(prev => ({
            ...prev,
            lastMessage: data
          }));
          configRef.current.onMessage?.(data);
        } catch (error) {
          // Still call onMessage with raw data in case it's not JSON
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
          setState(prev => ({
            ...prev,
            error: 'SSE connection closed',
            connecting: false,
            connected: false
          }));
          configRef.current.onError?.(error);
          
          // Only attempt to reconnect if connection is actually closed and we haven't exceeded max attempts
          if (reconnectAttempts.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts.current++;
              connect();
            }, delay);
          }
        } else if (isConnecting) {
          // Connection is still trying to establish, just log but don't reconnect
          console.log('SSE connection still connecting, waiting...');
        } else {
          // Connection is open, might be a temporary error, don't reconnect
          console.log('SSE connection is open, ignoring temporary error');
        }
      };

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to create SSE connection',
        connecting: false
      }));
      configRef.current.onError?.(error);
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

    // Reset reconnect attempts on manual disconnect
    reconnectAttempts.current = 0;

    setState(prev => ({
      ...prev,
      connected: false,
      connecting: false,
      error: null
    }));
  }, []); // Empty dependency array

  // Auto-connect when parameters are ready (unless prevented)
  useEffect(() => {
    // Only auto-connect if:
    // 1. Parameters are ready
    // 2. Not already connected
    // 3. Not currently connecting
    // 4. Not prevented by config
    // 5. No existing EventSource connection
    if (
      state.parametersReady && 
      !state.connected && 
      !state.connecting && 
      !configRef.current.preventAutoConnect &&
      (!eventSourceRef.current || eventSourceRef.current.readyState === EventSource.CLOSED)
    ) {
      connect();
    }
  }, [state.parametersReady, state.connected, state.connecting, connect]);

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
