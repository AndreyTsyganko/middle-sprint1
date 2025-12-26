import Block from '../../Core/Block';

interface MessageProps {
  content: string;
  time: string;
  isMine: boolean;
}

export default class Message extends Block {
  constructor(props: MessageProps) {
    super('div', props);
  }

  render(): string {
    const { content, time, isMine } = this.props;
    return `
      <div class="message ${isMine ? 'message-mine' : 'message-theirs'}">
        <div class="message-content">${content}</div>
        <div class="message-time">${time}</div>
      </div>
    `;
  }
}
