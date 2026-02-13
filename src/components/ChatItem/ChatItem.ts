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
        }
      }
    });
  }

  render(): string {

    const props = this.props as unknown as ChatItemProps;
    
    const title = props.title || 'Без названия';
    const avatar = props.avatar || '';
    const lastMessage = props.lastMessage || 'Нет сообщений';
    const time = props.time || '';
    const unreadCount = props.unreadCount || 0;


    const firstChar = title && typeof title === 'string' && title.length > 0 
      ? title.charAt(0).toUpperCase() 
      : '?';

    return `
      <div class="chat-item" data-chat-id="${props.id}">
        <div class="chat-item-avatar" data-initials="${firstChar}">
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
