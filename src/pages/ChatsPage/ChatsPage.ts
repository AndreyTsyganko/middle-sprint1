import Block from '../../Core/Block';
import ChatItem from '../../components/ChatItem/ChatItem';
import Message from '../../components/Message/Message';
import { api } from '../../Api/Client';
import wsService from '../../WebSocketService/WebSocketService';
import ProfileModal from '../../components/ProfileModal/ProfileModal';

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
  private profileModal: ProfileModal | null = null;
  private isModalOpen: boolean = false;

  constructor(props: ChatsPageProps = {}) {
    super('div', {
      ...props,
      chatItems: [],
      messageComponents: [],
    });

    (window as any).chatsPageInstance = this;

    setTimeout(() => {
      this.loadInitialData();
    }, 0);
  }

  private async loadInitialData(): Promise<void> {
    await this.loadCurrentUser();
    await this.loadChats();
  }

  async loadCurrentUser(): Promise<void> {
    try {
      this.currentUser = await api.getUser();
      console.log('Current user loaded for ChatsPage:', this.currentUser);
    } catch (error: any) {
      console.error('Failed to load current user:', error.message);
      this.currentUser = { 
        id: 1, 
        login: 'Testuser',
        first_name: 'Тестовый',
        second_name: 'Пользователь',
        display_name: '',
        email: 'test@example.com',
        phone: '+79991234567',
        avatar: '/ui/default-avatar.jpg'
      };
      console.log('Using mock user for demo');
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
        console.log('No chats found. Creating test chat...');
        try {
          await api.createChat('Тестовый чат');
          const newChats = await api.getChats();
          this.chats = Array.isArray(newChats) ? newChats : [];
        } catch (error) {
          console.log('Failed to create test chat:', error);
          this.chats = [{
            id: 1,
            title: 'Демо чат',
            avatar: '/ui/default-avatar.jpg',
            unread_count: 0
          }];
        }
      }
  
      const chatItems = this.chats.map((chat) => new ChatItem({
        id: chat.id,
        title: chat.title,
        avatar: chat.avatar || '/ui/default-avatar.jpg',
        lastMessage: chat.last_message?.content || 'Нет сообщений',
        time: this.formatTime(chat.last_message?.time),
        unreadCount: chat.unread_count,
      }));

      this.setProps({ chatItems });

      if (this.chats.length > 0 && !this.selectedChatId) {
        setTimeout(() => {
          this.handleChatSelect(this.chats[0].id);
        }, 100);
      }
    } catch (error: any) {
      console.error('Failed to load chats:', error.message);
      this.chats = [{
        id: 1,
        title: 'Демо чат',
        avatar: '/ui/default-avatar.jpg',
        unread_count: 3
      }];
      const chatItems = this.chats.map((chat) => new ChatItem({
        id: chat.id,
        title: chat.title,
        avatar: chat.avatar,
        lastMessage: 'Привет! Как дела?',
        time: '14:30',
        unreadCount: chat.unread_count,
      }));
      this.setProps({ chatItems });
    }
  }

  async handleChatSelect(chatId: number): Promise<void> {
    try {
      console.log(`🔥 Выбран чат: ${chatId}`);
      this.selectedChatId = chatId;
  
      wsService.disconnect();
  
      this.loadChatUsers(chatId).catch(console.error);
  
      try {
        const messagesResponse = await api.getMessages(chatId);
        console.log(`Raw messages response:`, messagesResponse);
        this.messages = Array.isArray(messagesResponse) ? messagesResponse : [];
      } catch (error) {
        console.log('No messages available:', error);
        this.messages = [];
      }
  
      const messageComponents = this.messages.map((msg: any) => new Message({
        content: msg.content || 'Тестовое сообщение',
        time: this.formatTime(msg.time),
        isMine: msg.user_id === this.currentUser?.id,
      }));

      this.setProps({ messageComponents });
  
      const selectedChat = this.chats.find(chat => chat.id === chatId);
      if (selectedChat) {
        this.updateChatHeader(selectedChat);
      }

      const token = localStorage.getItem('token') || localStorage.getItem('userToken') || '';
      wsService.connect(chatId, token, this.handleNewWebSocketMessage.bind(this));

      if (this.props.onChatSelect) {
        this.props.onChatSelect(chatId);
      }
    } catch (error: any) {
      console.error('Failed to load chat data:', error.message);
    }
  }

  private handleNewWebSocketMessage = (data: any): void => {
    console.log('Новое WebSocket сообщение:', data);
    
    const message = data.type === 'message' ? data : data.server_message;
    
    this.messages.unshift({
      id: Date.now(),
      content: message.content,
      time: new Date().toISOString(),
      user_id: message.user_id || 2,
    });

    this.messages = this.messages.slice(0, 100);

    const messageComponents = this.messages.map((msg: any) => new Message({
      content: msg.content,
      time: this.formatTime(msg.time),
      isMine: msg.user_id === this.currentUser?.id,
    }));

    this.setProps({ messageComponents });
  }

  async handleSendMessage(): Promise<void> {
    if (!this.selectedChatId) {
      alert('Выберите чат для отправки сообщения');
      return;
    }

    const messageInput = this.element?.querySelector('#message') as HTMLInputElement;
    const text = messageInput?.value.trim();

    if (!text) {
      return;
    }

    const wsMessage = {
      content: text,
      type: 'message'
    };
    
    wsService.send(JSON.stringify(wsMessage));
    
    if (messageInput) {
      messageInput.value = '';
    }

    console.log('Сообщение отправлено через WebSocket!');
  }

  async loadChatUsers(chatId: number): Promise<void> {
    try {
      const usersResponse = await api.getChatUsers(chatId);
      this.chatUsersList = Array.isArray(usersResponse) ? usersResponse : [];
      console.log(`Loaded ${this.chatUsersList.length} users for chat ${chatId}`);
    } catch (error: any) {
      console.error('Failed to load chat users:', error.message);
      this.chatUsersList = [];
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
      if (!Array.isArray(users) || users.length === 0) {
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

  openProfileModal(): void {
    console.log('Opening profile modal with user data:', this.currentUser);
    
    if (this.isModalOpen) {
      return;
    }
    
    this.isModalOpen = true;
    

    this.profileModal = new ProfileModal({
      user: {
        ...this.currentUser,
        avatar: this.currentUser?.avatar || '/ui/default-avatar.jpg',
        first_name: this.currentUser?.first_name || '',
        second_name: this.currentUser?.second_name || '',
        display_name: this.currentUser?.display_name || '',
        login: this.currentUser?.login || '',
        email: this.currentUser?.email || '',
        phone: this.currentUser?.phone || ''
      },
      isOpen: true,
      onClose: () => {
        console.log('ProfileModal onClose callback');
        this.closeProfileModal();
      },
      onSave: async (data: any) => {
        console.log('ProfileModal onSave callback with data:', data);
        try {
          await api.updateProfile(data);
          await this.loadCurrentUser();
          alert('Профиль успешно обновлен');
          this.closeProfileModal();
        } catch (error: any) {
          console.error('Profile update error:', error);
          alert('Ошибка обновления профиля: ' + error.message);
        }
      },
      onLogout: () => {
        console.log('ProfileModal onLogout callback');
        this.handleLogout();
      },
      onDelete: () => {
        console.log('ProfileModal onDelete callback');
        this.handleDeleteProfile();
      }
    });
    
    this.addModalToDOM();
  }

  private addModalToDOM(): void {
    if (!this.profileModal || !this.element) return;
    
    const existingContainer = this.element.querySelector('#profileModalContainer');
    if (existingContainer) {
      existingContainer.remove();
    }
    

    const modalContainer = document.createElement('div');
    modalContainer.id = 'profileModalContainer';
    

    const modalHtml = this.profileModal.render();
    

    modalContainer.innerHTML = modalHtml;
    this.element.appendChild(modalContainer);
    

    this.profileModal.componentDidMount();
  }

  closeProfileModal(): void {
    console.log('Closing profile modal');
    
    this.isModalOpen = false;
    
    if (this.element) {
      const modalContainer = this.element.querySelector('#profileModalContainer');
      if (modalContainer) {
        modalContainer.remove();
      }
    }
    
    if (this.profileModal) {
      this.profileModal.setProps({ isOpen: false });
      this.profileModal = null;
    }
  }

  async handleLogout(): Promise<void> {
    try {
      await api.logout();
      

      localStorage.removeItem('authToken');
      localStorage.removeItem('userLogin');
      localStorage.removeItem('userPassword');
      

      wsService.disconnect();
      
      console.log('User logged out successfully');
      

      this.closeProfileModal();
      
      if ((window as any).appRouter) {
        (window as any).appRouter.go('/');
      }
    } catch (error: any) {
      console.error('Logout error:', error.message);

      if ((window as any).appRouter) {
        (window as any).appRouter.go('/');
      }
    }
  }

  async handleDeleteProfile(): Promise<void> {
    const confirmDelete = confirm('Вы уверены, что хотите удалить профиль? Это действие нельзя отменить.');
    if (confirmDelete) {
      try {
        // Здесь должен быть вызов API для удаления профиля
        // await api.deleteProfile();
        alert('Профиль удален');
        

        await this.handleLogout();
      } catch (error: any) {
        alert('Ошибка удаления профиля: ' + error.message);
      }
    }
  }

  handleCreateChat(): void {
    const title = prompt('Введите название нового чата:');
    if (title) {
      console.log('🔥 Создание чата:', title);
      this.createChat(title.trim());
    }
  }

  async createChat(title: string): Promise<void> {
    try {
      console.log('API createChat called with:', { title });
      await api.createChat(title);
      alert('Чат успешно создан!');
      await this.loadChats();
    } catch (error: any) {
      console.error('Failed to create chat:', error.message);
      alert('Ошибка создания чата: ' + error.message);
      this.chats.unshift({
        id: Date.now(),
        title: title,
        avatar: '/ui/default-avatar.jpg',
        unread_count: 0
      });
      const chatItems = this.chats.map((chat) => new ChatItem({
        id: chat.id,
        title: chat.title,
        avatar: chat.avatar,
        lastMessage: 'Новый чат создан!',
        time: this.formatTime(new Date().toISOString()),
        unreadCount: chat.unread_count,
      }));
      this.setProps({ chatItems });
    }
  }

  componentDidMount(): void {
    console.log('ChatsPage mounted');
    this.setupEventDelegation();
    this.setupProfileModalDelegation();
  }

  setupEventDelegation(): void {
    this.element?.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;
      
      if (target.id === 'createChat' || target.closest('#createChat')) {
        e.preventDefault();
        console.log('🔥 CREATE CHAT BUTTON CLICKED!');
        this.handleCreateChat();
      }
      
      if (target.id === 'sendMessage' || target.closest('#sendMessage')) {
        e.preventDefault();
        console.log('🔥 Send button clicked');
        this.handleSendMessage();
      }
      
      // Обработка клика по кнопке "Профиль"
      if (target.classList.contains('profile-link-button') || 
          target.closest('.profile-link-button')) {
        e.preventDefault();
        console.log('🔥 Profile button clicked - opening modal');
        this.openProfileModal();
      }
      
      if (target.id === 'addUserToChat' || target.closest('#addUserToChat')) {
        e.preventDefault();
        console.log('Add user clicked');
        this.handleAddUserToChat();
      }
      
      if (target.id === 'removeUserFromChat' || target.closest('#removeUserFromChat')) {
        e.preventDefault();
        console.log('Remove user clicked');
        this.handleRemoveUserFromChat();
      }
    });

    this.element?.addEventListener('keypress', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.target as HTMLElement).id === 'message') {
        console.log('Enter pressed in message input');
        this.handleSendMessage();
      }
    });
  }

  setupProfileModalDelegation(): void {
    this.element?.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;
      
      if (target.classList.contains('modal-close') || target.closest('.modal-close')) {
        e.preventDefault();
        console.log('Modal close clicked from delegation');
        this.closeProfileModal();
      }
      
      const modalOverlay = target.closest('.modal-overlay');
      if (modalOverlay && !modalOverlay.querySelector('.modal-content')?.contains(target)) {
        console.log('Modal overlay clicked from delegation');
        this.closeProfileModal();
      }
      
      if (target.id === 'backToChats' || target.closest('#backToChats')) {
        e.preventDefault();
        console.log('Back to chats clicked from delegation');
        this.closeProfileModal();
      }
    });
  }

  render(): string {
    const { chatItems = [], messageComponents = [] } = this.props;

    return `
    <main class="chats-page">
      <div class="chats-container">
        <aside class="chats-sidebar">
          <div class="sidebar-header">
            <button class="profile-link-button">Профиль ></button>
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
              <div class="chat-header-title">
                ${this.selectedChatId ? this.chats.find(c => c.id === this.selectedChatId)?.title || 'Загрузка...' : 'Выберите чат'}
              </div>
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
      
      <div id="profileModalContainer"></div>
    </main>
    `;
  }
}
