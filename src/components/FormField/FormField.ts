import Block from '../../Core/Block';
import Input from '../Input/Input';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value?: string;
  error?: string;
  required?: boolean;
  onInput?: (value: string) => void;
}

export default class FormField extends Block {
  private input: Input;

  constructor(props: FormFieldProps) {
    const input = new Input({
      type: props.type,
      name: props.name,
      placeholder: props.placeholder,
      value: props.value,
      error: props.error,
      onInput: (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (props.onInput) {
          props.onInput(target.value);
        }
      },
    });

    super('div', {
      ...props,
      input,
    });

    this.input = input;
  }

  getValue(): string {
    return this.input.getValue();
  }

  setError(error: string): void {
    this.setProps({ error });
  }

  render(): string {
    const { label, required = false, error } = this.props;
    return `
      <div class="form-field">
        <label class="form-label">
          ${label}${required ? ' *' : ''}
        </label>
        ${this.props.input.render()}
        ${error ? `<div class="form-error">${error}</div>` : ''}
      </div>
    `;
  }
}
