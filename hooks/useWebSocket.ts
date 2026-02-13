import { useEffect } from 'react';
import { wsClient } from '@/lib/realtime/websocket';

export function useWebSocket() {
  useEffect(() => {
    const initWebSocket = async () => {
      wsClient.connect();
    };

    initWebSocket();

    return () => {
      wsClient.disconnect();
    };
  }, []);
}

export function useWebSocketEvent(event: string, callback: (data: any) => void) {
  useEffect(() => {
    wsClient.on(event, callback);

    return () => {
      wsClient.off(event, callback);
    };
  }, [event, callback]);
}
