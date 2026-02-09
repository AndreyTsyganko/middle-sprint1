import Block from '../../Core/Block';
import ChatItem from '../../components/ChatItem/ChatItem';
import Message from '../../components/Message/Message';
import { api } from '../../Api/Client';

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
}

export default class ChatsPage extends Block {
  private chats: Chat[] = [];
  private selectedChatId: number | null = null;
  private messages: any[] = [];
  private chatUsersList: ChatUser[] = [];
  private currentUser: any = null;

  constructor(props: ChatsPageProps = {}) {
    super('div', {
      ...props,
      chatItems: [],
      messageComponents: [],
    });

    this.loadCurrentUser();
    this.loadChats();
  }

  async loadCurrentUser(): Promise<void> {
    try {
      this.currentUser = await api.getUser();
      console.log('Current user loaded:', this.currentUser);
    } catch (error: any) {
      console.error('Failed to load current user:', error.message);
    }
  }

  async loadChats(): Promise<void> {
    try {
      if (!api.isAuthenticated()) {
        if (window.appRouter) {
          window.appRouter.go('/');
        }
        return;
      }

      this.chats = await api.getChats();
      console.log('Chats loaded:', this.chats);
      
      const chatItems = this.chats.map((chat) => new ChatItem({
        id: chat.id,
        title: chat.title,
        avatar: chat.avatar || '/ui/default-avatar.jpg',
        lastMessage: chat.last_message?.content || 'Нет сообщений',
        time: this.formatTime(chat.last_message?.time),
        unreadCount: chat.unread_count,
        onClick: (id: number) => this.handleChatSelect(id),
      }));

      this.setProps({ chatItems });

      if (this.chats.length > 0 && !this.selectedChatId) {
        this.handleChatSelect(this.chats[0].id);
      }
    } catch (error: any) {
      console.error('Failed to load chats:', error.message);
      alert('Ошибка загрузки чатов: ' + error.message);
    }
  }

  async handleChatSelect(chatId: number): Promise<void> {
    try {
      this.selectedChatId = chatId;
      
      await this.loadChatUsers(chatId);
      
      const messages = await api.getMessages(chatId);
      console.log(`Loaded ${messages.length} messages for chat ${chatId}`);
      
      const messageComponents = messages.map((msg: any) => new Message({
        content: msg.content,
        time: this.formatTime(msg.time),
        isMine: msg.user_id === this.currentUser?.id,
      }));

      this.messages = messages;
      this.setProps({ messageComponents });
      
      const selectedChat = this.chats.find(chat => chat.id === chatId);
      if (selectedChat) {
        this.updateChatHeader(selectedChat);
      }

      if (this.props.onChatSelect) {
        this.props.onChatSelect(chatId);
      }
    } catch (error: any) {
      console.error('Failed to load chat data:', error.message);
      alert('Ошибка загрузки чата: ' + error.message);
    }
  }

  async loadChatUsers(chatId: number): Promise<void> {
    try {
      this.chatUsersList = await api.getChatUsers(chatId);
      console.log(`Loaded ${this.chatUsersList.length} users for chat ${chatId}`);
    } catch (error: any) {
      console.error('Failed to load chat users:', error.message);
    }
  }

  async handleAddUserToChat(): Promise<void> {
    if (!this.selectedChatId) {
      alert('Выберите чат');
      return;
    }

    const login = prompt('Введите логин пользователя для добавления:');
    if (!login) return;

    try {
      const users = await api.searchUsers(login);
      if (users.length === 0) {
        alert('Пользователь не найден');
        return;
      }

      const user = users[0];
      const confirmAdd = confirm(`Добавить пользователя ${user.login} (${user.first_name} ${user.second_name}) в чат?`);
      
      if (confirmAdd) {
        await api.addUsersToChat(this.selectedChatId!, [user.id]);
        alert('Пользователь добавлен в чат');
        
        await this.loadChatUsers(this.selectedChatId!);
      }
    } catch (error: any) {
      console.error('Failed to add user to chat:', error.message);
      alert('Ошибка добавления пользователя: ' + error.message);
    }
  }

  async handleRemoveUserFromChat(): Promise<void> {
    if (!this.selectedChatId || this.chatUsersList.length === 0) {
      alert('Выберите чат с пользователями');
      return;
    }

    const userList = this.chatUsersList
      .map(user => `${user.login} (${user.first_name} ${user.second_name})`)
      .join('\n');
    
    const userLogin = prompt(`Введите логин пользователя для удаления:\n\nДоступные пользователи:\n${userList}`);
    if (!userLogin) return;

    const userToRemove = this.chatUsersList.find(user => user.login === userLogin);
    if (!userToRemove) {
      alert('Пользователь не найден в чате');
      return;
    }

    const confirmRemove = confirm(`Удалить пользователя ${userToRemove.login} из чата?`);
    
    if (confirmRemove) {
      try {
        await api.deleteUsersFromChat(this.selectedChatId!, [userToRemove.id]);
        alert('Пользователь удален из чата');
        
        await this.loadChatUsers(this.selectedChatId!);
      } catch (error: any) {
        console.error('Failed to remove user from chat:', error.message);
        alert('Ошибка удаления пользователя: ' + error.message);
      }
    }
  }

  async handleSendMessage(): Promise<void> {
    if (!this.selectedChatId) {
      alert('Выберите чат для отправки сообщения');
      return;
    }

    const messageInput = this.element?.querySelector('#message') as HTMLInputElement;
    const text = messageInput?.value.trim();

    if (!text) {
      alert('Сообщение не может быть пустым');
      return;
    }

    try {
      await api.sendMessage(this.selectedChatId, text);
      
      const newMessage = {
        id: Date.now(),
        content: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMine: true,
        user_id: this.currentUser?.id || 0,
      };

      this.messages.push(newMessage);
      
      const messageComponents = this.messages.map(msg => new Message({
        content: msg.content,
        time: msg.time,
        isMine: msg.isMine,
      }));

      this.setProps({ messageComponents });
      
      if (messageInput) {
        messageInput.value = '';
      }

      await this.loadChats();
    } catch (error: any) {
      console.error('Failed to send message:', error.message);
      alert('Ошибка отправки сообщения: ' + error.message);
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

  handleProfileClick(): void {
    if (window.appRouter) {
      window.appRouter.go('/settings');
    }
  }

  handleCreateChat(): void {
    const title = prompt('Введите название нового чата:');
    if (title) {
      this.createChat(title);
    }
  }

  async createChat(title: string): Promise<void> {
    try {
      await api.createChat(title);
      alert('Чат успешно создан!');
      await this.loadChats();
    } catch (error: any) {
      console.error('Failed to create chat:', error.message);
      alert('Ошибка создания чата: ' + error.message);
    }
  }

  componentDidMount(): void {
    this.setupEventListeners();
  }

  setupEventListeners(): void {
    const messageInput = this.element?.querySelector('#message') as HTMLInputElement;
    const sendButton = this.element?.querySelector('#sendMessage');
    const profileLink = this.element?.querySelector('.profile-link');
    const createChatButton = this.element?.querySelector('#createChat');
    const addUserButton = this.element?.querySelector('#addUserToChat');
    const removeUserButton = this.element?.querySelector('#removeUserFromChat');

    if (messageInput && sendButton) {
      const handleSend = () => this.handleSendMessage();
      sendButton.addEventListener('click', handleSend);
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
      });
    }

    if (profileLink) {
      profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleProfileClick();
      });
    }

    if (createChatButton) {
      createChatButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleCreateChat();
      });
    }

    if (addUserButton) {
      addUserButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleAddUserToChat();
      });
    }

    if (removeUserButton) {
      removeUserButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleRemoveUserFromChat();
      });
    }
  }

  render(): string {
    const { chatItems = [], messageComponents = [] } = this.props;

    return `
    <main class="chats-page">
      <div class="chats-container">
        <aside class="chats-sidebar">
          <div class="sidebar-header">
            <a href="/settings" class="profile-link">Профиль ></a>
            <div class="search-container">
              <input type="text" class="search-input" placeholder="Поиск">
            </div>
            <button id="createChat" class="create-chat-button">+ Создать чат</button>
          </div>
          <div class="chats-list">
            ${chatItems.map((chat) => chat.render()).join('')}
          </div>
        </aside>
        <section class="chat-area">
          <div class="chat-header">
            <div class="chat-header-info">
              <div class="chat-header-avatar">
                <img src="/ui/default-avatar.jpg" alt="Чат" class="header-avatar-img">
              </div>
              <div class="chat-header-title">Выберите чат</div>
            </div>
            <div class="chat-header-actions">
              ${this.selectedChatId ? `
                <button class="action-button" id="addUserToChat" title="Добавить пользователя">+👤</button>
                <button class="action-button" id="removeUserFromChat" title="Удалить пользователя">-👤</button>
              ` : ''}
              <button class="action-button" title="Действия">⋮</button>
            </div>
          </div>
          <div class="messages-container" id="messagesContainer">
            ${messageComponents.map((msg) => msg.render()).join('')}
          </div>
          <div class="message-input-area">
            <button class="attach-button" title="Прикрепить файл">📎</button>
            <input 
              type="text" 
              class="message-input" 
              id="message" 
              name="message" 
              placeholder="Сообщение"
            >
            <button class="send-button" id="sendMessage">→</button>
          </div>
        </section>
      </div>
    </main>
  `;
  }
}
