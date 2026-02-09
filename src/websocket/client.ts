
export default class ChatWebSocket {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  constructor(private chatId: number, private token: string) {
    this.connect();
  }
  
  private connect(): void {
    const wsUrl = `ws://localhost:3000/ws/chats/${this.chatId}?token=${this.token}`;
    
    try {
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log(`WebSocket connected to chat ${this.chatId}`);
        this.reconnectAttempts = 0;
        this.emit('open');
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('message', data);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };
      
      this.socket.onclose = (event) => {
        console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
        this.emit('close', event);
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          this.reconnectAttempts++;
          
          console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
          
          setTimeout(() => {
            if (this.socket?.readyState !== WebSocket.OPEN) {
              this.connect();
            }
          }, delay);
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }
  
  sendMessage(content: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'message',
        content: content.trim()
      };
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }
  
  sendTyping(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'typing' }));
    }
  }
  
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }
  
  off(event: string, callback: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
  
  close(): void {
    if (this.socket) {
      this.socket.onclose = null; 
      this.socket.close();
      this.socket = null;
    }
  }
  
  get readyState(): number {
    return this.socket?.readyState || WebSocket.CLOSED;
  }
}
