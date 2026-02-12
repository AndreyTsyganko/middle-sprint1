import Block from '../../Core/Block';
interface MessageProps {
  content: string;
  time: string;
  isMine: boolean;
}

export default class Message extends Block {
  constructor(props: MessageProps) {
    super('div', {
      ...props,
      events: {},
    });
  }

  render(): string {

    const props = this.props as unknown as MessageProps;
    const { content, time, isMine } = props;
    
    return `
      <div class="message ${isMine ? 'message-mine' : 'message-theirs'}">
        <div class="message-content">${content}</div>
        <div class="message-time">${time}</div>
      </div>
    `;
  }
}
