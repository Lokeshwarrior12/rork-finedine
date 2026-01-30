import { useEffect } from 'react';
import { wsClient } from '@/lib/realtime/websocket';
import { auth } from '@/lib/supabase';

export function useWebSocket() {
  useEffect(() => {
    let userId: string;
    let clientId: string;

    const initWebSocket = async () => {
      const user = await auth.getUser();
      if (user) {
        userId = user.id;
        clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        wsClient.connect(userId, clientId);
      }
    };

    initWebSocket();

    return () => {
      wsClient.disconnect();
    };
  }, []);
}

// Hook for listening to specific events
export function useWebSocketEvent(event: string, callback: Function) {
  useEffect(() => {
    wsClient.on(event, callback);

    return () => {
      wsClient.off(event, callback);
    };
  }, [event, callback]);
}
