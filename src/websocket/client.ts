class WebSocketClient {
  private socket: WebSocket | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private messageHandler: ((data: any) => void) | null = null;

  connect(chatId: number, token: string, onMessage: (data: any) => void): void {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('User ID not found');
      return;
    }

    this.messageHandler = onMessage;
    const url = `wss://ya-praktikum.tech/ws/chats/${userId}/${chatId}/${token}`;
    
    this.socket = new WebSocket(url);
    
    this.socket.addEventListener('open', () => {
      console.log('WebSocket connected');
      this.startPing();
    });

    this.socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (this.messageHandler) {
        this.messageHandler(data);
      }
    });

    this.socket.addEventListener('close', () => {
      console.log('WebSocket disconnected');
      this.stopPing();
    });

    this.socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  send(data: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    } else {
      console.error('WebSocket is not connected');
    }
  }

  disconnect(): void {
    this.stopPing();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      this.send(JSON.stringify({ type: 'ping' }));
    }, 30000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

export const wsClient = new WebSocketClient();
