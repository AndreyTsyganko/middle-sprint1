import Block from '../../Core/Block';

interface ButtonProps {
  text: string;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  onClick?: (event: Event) => void;
}

export default class Button extends Block {
  constructor(props: ButtonProps) {
    super('button', {
      ...props,
      events: {
        click: props.onClick,
      },
    });
  }

  render(): string {
    const { text, type = 'button', className = '' } = this.props;
    return `
      <button 
        type="${type}" 
        class="button ${className}"
      >
        ${text}
      </button>
    `;
  }
}
