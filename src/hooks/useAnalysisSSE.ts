import { useState, useEffect, useRef, useCallback } from 'react';

interface SSEConfig {
  onMessage?: (data: any) => void;
  onError?: (error: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  uuid?: string;
  localPartyNumber?: string;
  ownerUsername?: string;
  imagicle?: string;
  mlCallDuration?: string;
  callDirection?: string;
  callRemoteNumber?: string;
  callDateTime?: string;
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
    const hasAllParams = !!(config.uuid  && config.localPartyNumber && config.ownerUsername && config.imagicle && config.mlCallDuration && config.callDirection && config.callRemoteNumber && config.callDateTime);
    setState(prev => ({
      ...prev,
      parametersReady: hasAllParams
    }));
  }, [config.uuid, config.localPartyNumber, config.ownerUsername, config.imagicle, config.mlCallDuration, config.callDirection, config.callRemoteNumber, config.callDateTime]);

  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    // Check if required parameters are available
    if (!configRef.current.uuid || !configRef.current.localPartyNumber || !configRef.current.ownerUsername || !configRef.current.imagicle || !configRef.current.mlCallDuration || !configRef.current.callDirection || !configRef.current.callRemoteNumber || !configRef.current.callDateTime) {
      console.warn('⚠️ Cannot connect: Missing required parameters', {
        uuid: configRef.current.uuid,
        localPartyNumber: configRef.current.localPartyNumber,
        ownerUsername: configRef.current.ownerUsername,
        imagicle: configRef.current.imagicle,
        mlCallDuration: configRef.current.mlCallDuration,
        callDirection: configRef.current.callDirection,
        callRemoteNumber: configRef.current.callRemoteNumber,
        callDateTime: configRef.current.callDateTime
      });
      setState(prev => ({
        ...prev,
        connecting: false,
        error: 'Missing required parameters: uuid, localPartyNumber, ownerUsername, imagicle, mlCallDuration, callDirection, callRemoteNumber, callDateTime'
      }));
      configRef.current.onError?.('Missing required parameters: uuid, localPartyNumber, ownerUsername, imagicle, mlCallDuration, callDirection, callRemoteNumber, callDateTime');
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
      
      if (configRef.current.localPartyNumber) params.append('localPartyNumber', configRef.current.localPartyNumber);
      if (configRef.current.ownerUsername) params.append('ownerUsername', configRef.current.ownerUsername);
      if (configRef.current.imagicle) params.append('imagicle', configRef.current.imagicle);
      if (configRef.current.mlCallDuration) params.append('mlCallDuration', configRef.current.mlCallDuration);
      if (configRef.current.callDirection) params.append('callDirection', configRef.current.callDirection);
      if (configRef.current.callRemoteNumber) params.append('callRemoteNumber', configRef.current.callRemoteNumber);
      if (configRef.current.callDateTime) params.append('callDateTime', configRef.current.callDateTime);
      
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
        setState(prev => ({
          ...prev,
          error: 'SSE connection error',
          connecting: false,
          connected: false
        }));
        configRef.current.onError?.(error);
        
        // Attempt to reconnect if not a manual close
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
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

    setState(prev => ({
      ...prev,
      connected: false,
      connecting: false,
      error: null
    }));
  }, []); // Empty dependency array

  // Auto-connect when parameters are ready (unless prevented)
  useEffect(() => {
    if (state.parametersReady && !state.connected && !state.connecting && !configRef.current.preventAutoConnect) {
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
