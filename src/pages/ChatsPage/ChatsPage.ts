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

interface ChatsPageProps {
  onSendMessage?: (message: string) => void;
  onChatSelect?: (chatId: number) => void;
}

export default class ChatsPage extends Block {
  private chats: Chat[] = [];
  private selectedChatId: number | null = null;
  private messages: Array<{
    id: number;
    content: string;
    time: string;
    isMine: boolean;
    user_id: number;
  }> = [];

  constructor(props: ChatsPageProps = {}) {
    super('div', {
      ...props,
      chatItems: [],
      messageComponents: [],
    });

    this.loadChats();
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
      
      const chatItems = this.chats.map((chat) => new ChatItem({
        id: chat.id,
        title: chat.title,
        avatar: chat.avatar || '/ui/BMW 1.jpg',
        lastMessage: chat.last_message?.content || 'Нет сообщений',
        time: this.formatTime(chat.last_message?.time),
        unreadCount: chat.unread_count,
        onClick: (id: number) => this.handleChatSelect(id),
      }));

      this.setProps({ chatItems });

      if (this.chats.length > 0 && !this.selectedChatId) {
        this.handleChatSelect(this.chats[0].id);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
      alert('Ошибка загрузки чатов');
    }
  }

  async handleChatSelect(chatId: number): Promise<void> {
    this.selectedChatId = chatId;
    
    try {
      const messages = await api.getMessages(chatId);
      
      const currentUser = await api.getUser();
      const messageComponents = messages.map((msg: any) => new Message({
        content: msg.content,
        time: this.formatTime(msg.time),
        isMine: msg.user_id === currentUser.id,
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
    } catch (error) {
      console.error('Failed to load messages:', error);
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
      return;
    }

    try {
      await api.sendMessage(this.selectedChatId, text);
      
      const newMessage = {
        id: Date.now(),
        content: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMine: true,
        user_id: 1,
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
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Ошибка отправки сообщения');
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
    } catch (error) {
      console.error('Failed to create chat:', error);
      alert('Ошибка создания чата');
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
                <img src="/ui/BMW 1.jpg" alt="Чат" class="header-avatar-img">
              </div>
              <div class="chat-header-title">Выберите чат</div>
            </div>
            <div class="chat-header-actions">
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
