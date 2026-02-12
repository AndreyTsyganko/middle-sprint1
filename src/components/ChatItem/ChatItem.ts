import Block from '../../Core/Block';

interface ChatItemProps {
  id: number;
  title: string;
  avatar?: string;
  lastMessage?: string;
  time?: string;
  unreadCount?: number;
  onClick?: (id: number) => void;
}

export default class ChatItem extends Block {
  constructor(props: ChatItemProps) {
    super('div', {
      ...props,
      events: {
        click: () => {
          if (props.onClick) {
            props.onClick(props.id);
          }
        },
      },
    });
  }

  render(): string {
    const {
      title = 'Без названия',
      avatar = '',
      lastMessage = 'Нет сообщений',
      time = '',
      unreadCount = 0,
    } = this.props;

    return `
      <div class="chat-item" data-chat-id="${this.props.id}">
        <div class="chat-item-avatar" data-initials="${title.charAt(0).toUpperCase()}">
          ${avatar ? `<img src="${avatar}" alt="" class="chat-avatar-img">` : ''}
        </div>
        <div class="chat-item-content">
          <div class="chat-item-header">
            <h3 class="chat-title">${title}</h3>
            ${time ? `<span class="chat-time">${time}</span>` : ''}
          </div>
          <div class="chat-item-footer">
            <p class="chat-last-message">${lastMessage}</p>
          </div>
        </div>
        ${unreadCount > 0 ? `
          <div class="chat-unread-badge">${unreadCount > 99 ? '99+' : unreadCount}</div>
        ` : ''}
      </div>
    `;
  }
}
