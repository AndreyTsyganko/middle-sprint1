import Block from '../../Core/Block';

interface InputProps {
  type?: string;
  name: string;
  placeholder?: string;
  value?: string;
  className?: string;
  error?: string;
  onBlur?: (event: Event) => void;
  onInput?: (event: Event) => void;
}

export default class Input extends Block {
  constructor(props: InputProps) {
    super('input', {
      ...props,
      events: {
        blur: props.onBlur,
        input: props.onInput,
      },
    });
  }

  render(): string {
    const {
      type = 'text',
      name,
      placeholder = '',
      value = '',
      className = '',
      error = '',
    } = this.props;

    return `
      <div class="input-wrapper ${className}">
        <input 
          type="${type}" 
          name="${name}" 
          placeholder="${placeholder}"
          value="${value}"
          class="input ${error ? 'input-error' : ''}"
        />
        ${error ? `<div class="input-error-message">${error}</div>` : ''}
      </div>
    `;
  }

  getValue(): string {
    const element = this.element?.querySelector('input') as HTMLInputElement;
    return element?.value || '';
  }
}
