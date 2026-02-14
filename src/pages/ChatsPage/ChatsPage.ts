import Block from '../../Core/Block';
import ChatItem from '../../components/ChatItem/ChatItem';
import Message from '../../components/Message/Message';

import { api } from '../../Api/Client';
import wsService from '../../WebSocketService/WebSocketService';

interface Chat {
  id: number;
  title: string;
  avatar: string;
  last_message?: {
    content: string;
    time: string;
  };
  unread_count?: number;
}

interface ChatUser {
  id: number;
  first_name: string;
  second_name: string;
  login: string;
  avatar: string;
}

interface ChatsPageProps {
  onSendMessage?: (message: string) => void;
  onChatSelect?: (chatId: number) => void;
  chatItems?: ChatItem[];
  messageComponents?: Message[];
  isChatSelected?: boolean;
  selectedChatTitle?: string;
}

export default class ChatsPage extends Block {
  private chats: Chat[] = [];

  private selectedChatId: number | null = null;

  private messages: any[] = [];

  private chatUsersList: ChatUser[] = [];

  private currentUser: any = null;

  private eventHandlersAttached: boolean = false;

  constructor(props: ChatsPageProps = {}) {
    super('div', {
      ...props,
      chatItems: [],
      messageComponents: [],
      isChatSelected: false,
      selectedChatTitle: 'Выберите чат',
    });

    (window as any).chatsPageInstance = this;

    setTimeout(() => {
      this.loadInitialData();
    }, 0);
  }

  private fixAvatarUrl(avatar: string): string {
    if (!avatar || avatar === '/ui/default-avatar.jpg') return avatar;
    if (avatar.includes('http')) return avatar;
    return `https://ya-praktikum.tech/api/v2/resources${avatar}?t=${Date.now()}`;
  }

  private async loadInitialData(): Promise<void> {
    await this.loadCurrentUser();
    await this.loadChats();
  }

  async loadCurrentUser(): Promise<void> {
    try {
      this.currentUser = await api.getUser();

      if (this.currentUser?.avatar && !this.currentUser.avatar.includes('http')) {
        this.currentUser.avatar = this.fixAvatarUrl(this.currentUser.avatar);
      }

      console.log('Current user loaded for ChatsPage:', this.currentUser);

      if (this.currentUser?.id) {
        localStorage.setItem('userId', this.currentUser.id.toString());
      }
    } catch (error: any) {
      console.error('Failed to load current user:', error.message);

      if (!api.isAuthenticated()) {
        console.log('User not authenticated, redirecting to login');
        if ((window as any).appRouter) {
          (window as any).appRouter.go('/');
        }
        return;
      }

      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          this.currentUser = JSON.parse(savedUser);
        } catch (e) {
          this.currentUser = {
            id: localStorage.getItem('userId') || 0,
            login: localStorage.getItem('userLogin') || 'User',
            first_name: 'Пользователь',
            second_name: '',
            avatar: '/ui/default-avatar.jpg',
          };
        }
      } else {
        this.currentUser = {
          id: localStorage.getItem('userId') || 0,
          login: localStorage.getItem('userLogin') || 'User',
          first_name: 'Пользователь',
          second_name: '',
          avatar: '/ui/default-avatar.jpg',
        };
      }
    }
  }

  async loadChats(): Promise<void> {
    try {
      if (!api.isAuthenticated()) {
        console.log('Not authenticated, redirecting to login');
        if ((window as any).appRouter) {
          (window as any).appRouter.go('/');
        }
        return;
      }

      const chatsResponse = await api.getChats();
      console.log('Raw chats response:', chatsResponse);

      this.chats = Array.isArray(chatsResponse) ? chatsResponse : [];

      if (this.chats.length === 0) {
        console.log('No chats found');
        const chatItems: ChatItem[] = [];
        this.setProps({ chatItems });
        return;
      }

      const chatItems = this.chats.map((chat) => new ChatItem({
        id: chat.id,
        title: chat.title,
        avatar: this.fixAvatarUrl(chat.avatar),
        lastMessage: chat.last_message?.content || 'Нет сообщений',
        time: this.formatTime(chat.last_message?.time),
        unreadCount: chat.unread_count,
        onClick: (id: number) => {
          console.log(`Chat item clicked via ChatItem: ${id}`);
          this.handleChatSelect(id);
        },
      }));

      this.setProps({ chatItems });

      if (this.chats.length > 0 && !this.selectedChatId) {
        setTimeout(() => {
          this.handleChatSelect(this.chats[0].id);
        }, 100);
      }
    } catch (error: any) {
      console.error('Failed to load chats:', error.message);
      this.chats = [];
      this.setProps({ chatItems: [] });
    }
  }

  private updateInputFieldsState(enabled: boolean): void {
    setTimeout(() => {
      const messageInput = this.element?.querySelector('#message') as HTMLInputElement;
      const sendButton = this.element?.querySelector('#sendMessage') as HTMLButtonElement;
      const attachButton = this.element?.querySelector('.attach-button') as HTMLButtonElement;

      if (messageInput) {
        messageInput.disabled = !enabled;
        messageInput.placeholder = enabled ? 'Сообщение' : 'Выберите чат для отправки сообщения';
        if (enabled) {
          messageInput.focus();
        }
      }

      if (sendButton) {
        sendButton.disabled = !enabled;
      }

      if (attachButton) {
        attachButton.disabled = !enabled;
      }
    }, 50);
  }

  async handleChatSelect(chatId: number): Promise<void> {
    try {
      console.log(`Выбран чат: ${chatId}`);
      this.selectedChatId = chatId;

      const selectedChat = this.chats.find((chat) => chat.id === chatId);
      const chatTitle = selectedChat?.title || 'Загрузка...';

      this.setProps({
        isChatSelected: true,
        selectedChatTitle: chatTitle,
      });

      wsService.disconnect();

      this.updateInputFieldsState(true);

      await this.loadChatUsers(chatId);

      this.messages = [];
      const messageComponents = this.messages.map((msg: any) => new Message({
        content: msg.content || '',
        time: this.formatTime(msg.time),
        isMine: msg.user_id === this.currentUser?.id,
      }));

      this.setProps({ messageComponents });

      if (selectedChat) {
        this.updateChatHeader(selectedChat);
      }

      try {
        console.log(`Получение токена для чата ${chatId}...`);
        const tokenResponse = await api.getToken(chatId);
        console.log('WebSocket токен получен:', tokenResponse);

        if (tokenResponse.token) {
          const userId = this.currentUser?.id || localStorage.getItem('userId');
          if (!userId) {
            console.error('User ID не найден для WebSocket');
            throw new Error('User ID не найден');
          }

          console.log(`Подключение WebSocket: userId=${userId}, chatId=${chatId}, token=${tokenResponse.token.substring(0, 10)}...`);

          wsService.connect(
            chatId,
            tokenResponse.token,
            this.handleNewWebSocketMessage.bind(this),
          );
        } else {
          console.error('Токен не получен от сервера');
          throw new Error('Не удалось получить токен для чата');
        }
      } catch (tokenError: any) {
        console.error('Ошибка получения WebSocket токена:', tokenError.message);

        const userId = this.currentUser?.id || localStorage.getItem('userId');
        if (userId) {
          console.log('Используем User ID как токен для отладки');
          wsService.connect(
            chatId,
            userId.toString(),
            this.handleNewWebSocketMessage.bind(this),
          );
        } else {
          console.error('User ID не найден для fallback подключения');
          alert('Не удалось подключиться к чату. Попробуйте перезагрузить страницу.');
        }
      }

      const props = this.props as unknown as ChatsPageProps;
      if (props.onChatSelect) {
        props.onChatSelect(chatId);
      }
    } catch (error: any) {
      console.error('Failed to load chat data:', error.message);
      alert(`Ошибка загрузки чата: ${error.message}`);
    }
  }

  private handleNewWebSocketMessage = (data: any): void => {
    console.log('Новое WebSocket сообщение:', data);

    const userId = this.currentUser?.id || localStorage.getItem('userId');

    if (Array.isArray(data)) {
      data.forEach((msg: any) => {
        this.messages.push({
          id: msg.id,
          content: msg.content,
          time: msg.time,
          user_id: msg.user_id,
          isMine: msg.user_id?.toString() === userId?.toString(),
        });
      });
    } else if (data.type === 'message' && data.content) {
      this.messages.push({
        id: data.id || Date.now(),
        content: data.content,
        time: data.time || new Date().toISOString(),
        user_id: data.user_id,
        isMine: data.user_id?.toString() === userId?.toString(),
      });
    }

    const messagesContainer = this.element?.querySelector('#messagesContainer');
    if (messagesContainer) {
      const messagesHtml = this.messages.slice(-20).map((msg: any) => new Message({
        content: msg.content,
        time: this.formatTime(msg.time),
        isMine: msg.user_id?.toString() === userId?.toString(),
      }).render()).join('');

      messagesContainer.innerHTML = messagesHtml;
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 50);
    }
  };

  async handleSendMessage(): Promise<void> {
    if (!this.selectedChatId) {
      return;
    }

    const messageInput = this.element?.querySelector('#message') as HTMLInputElement;
    const text = messageInput?.value.trim();

    if (!text) {
      return;
    }

    const wsMessage = {
      content: text,
      type: 'message',
    };

    try {
      if (!wsService.isConnected()) {
        alert('WebSocket не подключен. Переподключаемся...');
        await this.handleChatSelect(this.selectedChatId);
        return;
      }

      console.log('Отправка сообщения через WebSocket:', wsMessage);
      wsService.send(JSON.stringify(wsMessage));

      if (messageInput) {
        messageInput.value = '';
      }

      console.log('Сообщение отправлено, ожидаем подтверждения от сервера...');
    } catch (error: any) {
      console.error('Ошибка отправки сообщения:', error);
      alert('Не удалось отправить сообщения. Проверьте подключение.');
    }
  }

  async loadChatUsers(chatId: number): Promise<void> {
    try {
      const usersResponse = await api.getChatUsers(chatId);
      this.chatUsersList = (Array.isArray(usersResponse) ? usersResponse : []).map((user: any) => ({
        ...user,
        avatar: this.fixAvatarUrl(user.avatar),
      }));
      console.log(`Loaded ${this.chatUsersList.length} users for chat ${chatId}`);
    } catch (error: any) {
      console.error('Failed to load chat users:', error.message);
      this.chatUsersList = [];
    }
  }

  async handleAddUserToChat(): Promise<void> {
    if (!this.selectedChatId) {
      return;
    }

    const login = prompt('Введите логин пользователя для добавления:');
    if (!login) return;

    try {
      const users = await api.searchUsers(login);
      if (!Array.isArray(users) || users.length === 0) {
        alert('Пользователь не найден');
        return;
      }

      const user = users[0];
      const confirmAdd = confirm(`Добавить пользователя ${user.login} (${user.first_name} ${user.second_name}) в чат?`);

      if (confirmAdd) {
        await api.addUsersToChat(this.selectedChatId!, [user.id]);
        await this.loadChatUsers(this.selectedChatId!);
      }
    } catch (error: any) {
      console.error('Failed to add user to chat:', error.message);
      alert(`Ошибка добавления пользователя: ${error.message}`);
    }
  }

  async handleRemoveUserFromChat(): Promise<void> {
    if (!this.selectedChatId || this.chatUsersList.length === 0) {
      return;
    }

    const userList = this.chatUsersList
      .map((user) => `${user.login} (${user.first_name} ${user.second_name})`)
      .join('\n');

    const userLogin = prompt(`Введите логин пользователя для удаления:\n\nДоступные пользователи:\n${userList}`);
    if (!userLogin) return;

    const userToRemove = this.chatUsersList.find((user) => user.login === userLogin);
    if (!userToRemove) {
      alert('Пользователь не найден в чате');
      return;
    }

    const confirmRemove = confirm(`Удалить пользователя ${userToRemove.login} из чата?`);

    if (confirmRemove) {
      try {
        await api.deleteUsersFromChat(this.selectedChatId!, [userToRemove.id]);
        await this.loadChatUsers(this.selectedChatId!);
      } catch (error: any) {
        console.error('Failed to remove user from chat:', error.message);
        alert(`Ошибка удаления пользователя: ${error.message}`);
      }
    }
  }

  updateChatHeader(chat: Chat): void {
    const chatHeader = this.element?.querySelector('.chat-header-title');
    if (chatHeader) {
      chatHeader.textContent = chat.title;
    }

    const chatAvatar = this.element?.querySelector('.header-avatar-img') as HTMLImageElement;
    if (chatAvatar && chat.avatar) {
      chatAvatar.src = chat.avatar;
      chatAvatar.alt = chat.title;
    }
  }

  formatTime(timeString?: string): string {
    if (!timeString) return '';

    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeString;
    }
  }

  openProfilePage(): void {
    console.log('Navigating to profile page');
    
    if ((window as any).appRouter) {
      (window as any).appRouter.go('/settings');
    } else {
      window.location.href = '/settings';
    }
  }

  componentDidMount(): void {
    console.log('ChatsPage mounted');

    if (!this.eventHandlersAttached) {
      this.setupEventDelegation();
      this.eventHandlersAttached = true;
    }
  }

  setupEventDelegation(): void {
    console.log('Setting up event delegation...');

    this.element?.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;

      const chatItem = target.closest('.chat-item');
      if (chatItem) {
        const chatId = parseInt(chatItem.getAttribute('data-chat-id') || '0');
        if (chatId) {
          console.log('КЛИК ПО ЧАТУ:', chatId);
          this.handleChatSelect(chatId);
          return;
        }
      }

      if (target.id === 'sendMessage' || target.closest('#sendMessage')) {
        e.preventDefault();
        console.log('Send button clicked');
        this.handleSendMessage();
      } else if (target.id === 'createChat' || target.closest('#createChat')) {
        e.preventDefault();
        console.log('CREATE CHAT BUTTON CLICKED!');
        this.handleCreateChat();
      } else if (target.classList.contains('profile-link-button') || target.closest('.profile-link-button')) {
        e.preventDefault();
        console.log('Profile button clicked - navigating to profile page');
        this.openProfilePage();
      } else if (target.id === 'addUserToChat' || target.closest('#addUserToChat')) {
        e.preventDefault();
        console.log('Add user clicked');
        this.handleAddUserToChat();
      } else if (target.id === 'removeUserFromChat' || target.closest('#removeUserFromChat')) {
        e.preventDefault();
        console.log('Remove user clicked');
        this.handleRemoveUserFromChat();
      }
    });

    this.element?.addEventListener('keypress', (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).id === 'message' && e.key === 'Enter') {
        e.preventDefault();
        console.log('Enter pressed in message input');
        this.handleSendMessage();
      }
    });
  }

  handleCreateChat(): void {
    const title = prompt('Введите название нового чата:');
    if (title) {
      console.log('Создание чата:', title);
      this.createChat(title.trim());
    }
  }

  async createChat(title: string): Promise<void> {
    try {
      console.log('API createChat called with:', { title });
      const response = await api.createChat(title);
      console.log('Chat created:', response);
      await this.loadChats();

      if (response.id) {
        setTimeout(() => {
          this.handleChatSelect(response.id);
        }, 500);
      }
    } catch (error: any) {
      console.error('Failed to create chat:', error.message);
      alert(`Ошибка создания чата: ${error.message}`);
    }
  }

  render(): string {
    const props = this.props as unknown as ChatsPageProps;
    const chatItems = props.chatItems || [];
    const messageComponents = props.messageComponents || [];
    const isChatSelected = props.isChatSelected || false;
    const selectedChatTitle = props.selectedChatTitle || 'Выберите чат';

    return `
    <main class="chats-page">
      <div class="chats-container">
        <aside class="chats-sidebar">
          <div class="sidebar-header">
            <button class="profile-link-button">Мой профиль</button>
            <div class="search-container">
              <input type="text" class="search-input" placeholder="Поиск">
            </div>
            <button id="createChat" class="create-chat-button">+ Создать чат</button>
          </div>
          <div class="chats-list">
            ${Array.isArray(chatItems) ? chatItems.map((chat) => chat.render()).join('') : ''}
          </div>
        </aside>
        <section class="chat-area">
          <div class="chat-header">
            <div class="chat-header-info">
              <div class="chat-header-avatar">
                <img src="${this.fixAvatarUrl(this.currentUser?.avatar || '/ui/default-avatar.jpg')}" 
                alt="Мой аватар" 
                class="header-avatar-img"
                data-user-id="${this.currentUser?.id}">
              </div>
              <div class="chat-header-title">
                ${selectedChatTitle}
              </div>
            </div>
            <div class="chat-header-actions">
              ${isChatSelected ? `
                <button class="action-button" id="addUserToChat" title="Добавить пользователя">+👤</button>
                <button class="action-button" id="removeUserFromChat" title="Удалить пользователя">-👤</button>
              ` : ''}
              <button class="action-button" title="Действия">⋮</button>
            </div>
          </div>
          <div class="messages-container" id="messagesContainer">
            ${Array.isArray(messageComponents) ? messageComponents.map((msg) => msg.render()).join('') : ''}
            ${(!Array.isArray(messageComponents) || messageComponents.length === 0) ? `
              <div class="no-messages">
                <p>${isChatSelected ? 'Сообщений пока нет' : 'Выберите чат для начала общения'}</p>
                <p>${isChatSelected ? 'Начните общение!' : ''}</p>
              </div>
            ` : ''}
          </div>
          <div class="message-input-area">
            <button class="attach-button" title="Прикрепить файл" ${!isChatSelected ? 'disabled' : ''}>📎</button>
            <input
              type="text"
              class="message-input"
              id="message"
              name="message"
              placeholder="${isChatSelected ? 'Сообщение' : 'Выберите чат для отправки сообщения'}"
              ${!isChatSelected ? 'disabled' : ''}
            >
            <button class="send-button" id="sendMessage" ${!isChatSelected ? 'disabled' : ''}>→</button>
          </div>
        </section>
      </div>
    </main>
    `;
  }
}

