class WebSocketService {
  private socket: WebSocket | null = null;

  private currentChatId: number | null = null;

  private messageCallback: ((data: any) => void) | null = null;

  connect(chatId: number, token: string, onMessage: (data: any) => void): void {
    this.disconnect();

    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('WebSocketService: User ID не найден');
      return;
    }

    const wsUrl = `wss://ya-praktikum.tech/ws/chats/${userId}/${chatId}/${token}`;
    console.log(`WebSocketService: Подключение к ${wsUrl}`);

    this.socket = new WebSocket(wsUrl);
    this.currentChatId = chatId;
    this.messageCallback = onMessage;

    this.socket.onopen = () => {
      console.log('WebSocketService: WebSocket подключен успешно');

      this.socket?.send(JSON.stringify({
        content: '0',
        type: 'get old',
      }));
    };

    this.socket.onmessage = (event) => {
      console.log('WebSocketService: Получено сообщение', event.data);

      try {
        const data = JSON.parse(event.data);

        if (Array.isArray(data)) {
          console.log(`WebSocketService: Получено ${data.length} старых сообщений`);
          if (this.messageCallback) {
            data.forEach((message: any) => {
              this.messageCallback!({
                type: 'message',
                id: message.id,
                content: message.content,
                user_id: message.user_id,
                time: message.time,
              });
            });
          }
        } else if (data.type === 'message' || data.type === 'file') {
          console.log('WebSocketService: Новое сообщение', data);
          if (this.messageCallback) {
            this.messageCallback(data);
          }
        } else if (data.type === 'user connected') {
          console.log('WebSocketService: Пользователь подключился', data);
        } else if (data.type === 'pong') {
          console.log('WebSocketService: Pong получен');
        } else {
          console.log('WebSocketService: Неизвестный тип сообщения', data);
        }
      } catch (error) {
        console.error('WebSocketService: Ошибка парсинга сообщения', error, event.data);
      }
    };

    this.socket.onclose = (event) => {
      console.log(`WebSocketService: WebSocket закрыт (код: ${event.code})`);
      this.socket = null;
      this.currentChatId = null;
      this.messageCallback = null;
    };

    this.socket.onerror = (event) => {
      console.error('WebSocketService: WebSocket ошибка', event);
    };
  }

  send(message: string | object): void {
    if (typeof message === 'object') {
      message = JSON.stringify(message);
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('WebSocketService: Отправка сообщения', message);
      this.socket.send(message);
    } else {
      console.error('WebSocketService: WebSocket не подключен');
    }
  }

  disconnect(): void {
    console.log(`WebSocketService: Отключение от чата ${this.currentChatId}`);

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.currentChatId = null;
    this.messageCallback = null;
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  getCurrentChatId(): number | null {
    return this.currentChatId;
  }
}

export default new WebSocketService();
