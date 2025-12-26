import Block from '../../Core/Block';
import ChatItem from '../../components/ChatItem/ChatItem';
import Message from '../../components/Message/Message';

interface Chat {
  id: number;
  title: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
}

interface ChatsPageProps {
  chats: Chat[];
  messages: Array<{
    id: number;
    content: string;
    time: string;
    isMine: boolean;
  }>;
  onSendMessage?: (message: string) => void;
  onProfileClick?: () => void;
  onChatSelect?: (chatId: number) => void;
}

export default class ChatsPage extends Block {
  constructor(props: ChatsPageProps) {
    const chatItems = (props.chats || []).map((chat) => new ChatItem({
      ...chat,
      onClick: props.onChatSelect,
    }));

    const messageComponents = (props.messages || []).map((msg) => new Message(msg));

    super('div', {
      ...props,
      chatItems,
      messageComponents,
    });
  }

  componentDidMount(): void {
    this.setupEventListeners();
  }

  setupEventListeners(): void {
    const messageInput = this.element?.querySelector('#message') as HTMLInputElement;
    const sendButton = this.element?.querySelector('#sendMessage');
    const goToProfile = this.element?.querySelector('#goToProfile');

    if (messageInput && sendButton) {
      const handleSend = () => {
        const text = messageInput.value.trim();
        if (text && this.props.onSendMessage) {
          this.props.onSendMessage(text);
          messageInput.value = '';
        }
      };

      sendButton.addEventListener('click', handleSend);
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
      });
    }

    if (goToProfile && this.props.onProfileClick) {
      goToProfile.addEventListener('click', (e) => {
        e.preventDefault();
        this.props.onProfileClick!();
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
            <a href="/profile" class="profile-link">Профиль ></a>
            <div class="search-container">
              <input type="text" class="search-input" placeholder="Поиск">
            </div>
          </div>
          <div class="chats-list">
            ${chatItems.map((chat) => chat.render()).join('')}
          </div>
        </aside>
        <section class="chat-area">
          <div class="chat-header">
            <div class="chat-header-info">
              <div class="chat-header-avatar">
                <img src="/ui/BMW 1.jpg" alt="Андрей" class="header-avatar-img">
              </div>
              <div class="chat-header-title">Андрей</div>
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
