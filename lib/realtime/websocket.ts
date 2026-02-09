import { config } from '../config';

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(userId: string, clientId: string) {
    const wsUrl = config.api.baseUrl.replace('http', 'ws');
    this.ws = new WebSocket(`${wsUrl}/ws?userId=${userId}&clientId=${clientId}`);

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      this.attemptReconnect(userId, clientId);
    };
  }

  private handleMessage(message: any) {
    const { type, payload } = message;
    
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.forEach(handler => handler(payload));
    }

    // Also trigger generic listeners
    const allHandlers = this.listeners.get('*');
    if (allHandlers) {
      allHandlers.forEach(handler => handler(message));
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(callback);
    }
  }

  private attemptReconnect(userId: string, clientId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnecting... Attempt ${this.reconnectAttempts}`);
      
      setTimeout(() => {
        this.connect(userId, clientId);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsClient = new WebSocketClient();
