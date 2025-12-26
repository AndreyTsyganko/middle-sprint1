import Block from '../../Core/Block';

interface ChatItemProps {
  id: number;
  title: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  onClick?: (id: number) => void;
}

export default class ChatItem extends Block {
  constructor(props: ChatItemProps) {
    super('div', {
      ...props,
      events: {
        click: () => props.onClick?.(props.id),
      },
    });
  }

  render(): string {
    const {
      id, title, avatar, lastMessage, time, unreadCount,
    } = this.props;
    return `
      <div class="chat-item" data-chat-id="${id}">
        <div class="chat-avatar">
          <img src="${avatar}" alt="${title}" class="chat-avatar-img">
        </div>
        <div class="chat-info">
          <div class="chat-title">${title}</div>
          <div class="chat-last-message">${lastMessage}</div>
        </div>
        <div class="chat-meta">
          <div class="chat-time">${time}</div>
          ${unreadCount ? `<div class="unread-badge">${unreadCount}</div>` : ''}
        </div>
      </div>
    `;
  }
}
