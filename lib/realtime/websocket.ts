import Constants from 'expo-constants';

interface WebSocketConfig {
  baseUrl: string;
  wsUrl: string;  // Add separate WebSocket URL
  reconnectInterval?: number;
}

const config: WebSocketConfig = {
  baseUrl: __DEV__
    ? 'http://localhost:8080'
    : Constants.expoConfig?.extra?.apiUrl?.replace('/api/v1', '') || 'https://primedine.fly.dev/',
  
  // WebSocket URL (ws:// or wss://)
  wsUrl: __DEV__
    ? 'ws://localhost:8080/ws'
    : 'wss://primedine.fly.dev/ws',
  
  reconnectInterval: 5000,
};

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect() {
    try {
      // Use wsUrl instead of url
      this.ws = new WebSocket(config.wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.type, data.payload);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected, reconnecting...');
        this.reconnect();
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.reconnect();
    }
  }

  private reconnect() {
    if (this.reconnectTimer) return;
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, config.reconnectInterval);
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  send(type: string, payload: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket not connected');
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}

export const wsClient = new WebSocketClient();
export default wsClient;
