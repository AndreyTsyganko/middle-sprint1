
class WebSocketService {
  private socket: WebSocket | null = null;
  private currentChatId: number | null = null; 

  connect(chatId: number, token: string, onMessage: (data: any) => void): void {
    this.disconnect();
    
    const wsUrl = `wss://ya-praktikum.tech/ws/chats/${chatId}/${token}/${token}`;
    console.log(`WS Connect: ${wsUrl}`);
    
    this.socket = new WebSocket(wsUrl);
    this.currentChatId = chatId;

    this.socket.onopen = () => {
      console.log('WebSocket подключен');
      this.socket?.send(JSON.stringify({ content: '0', type: 'get old' }));
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WS Message:', data);
      if (data.type === 'message' || data.server_message?.type === 'message') {
        onMessage(data);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket закрыт');
      this.socket = null;
      this.currentChatId = null;
    };

    this.socket.onerror = () => {
      console.error('WebSocket ошибка');
    };
  }

  send(message: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    }
  }

  disconnect(): void {
    console.log(`WebSocket отключен для чата ${this.currentChatId}`);
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.currentChatId = null;
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export default new WebSocketService();
