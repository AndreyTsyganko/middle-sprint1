import Block from '../../Core/Block';

interface AvatarProps {
  src: string;
  alt?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  onChange?: (file: File) => void;
}

export default class Avatar extends Block {
  constructor(props: AvatarProps) {
    super('div', {
      ...props,
      events: {
        change: (event: Event) => {
          const input = event.target as HTMLInputElement;
          if (input.files && input.files[0] && props.onChange) {
            props.onChange(input.files[0]);
          }
        },
      },
    });
  }

  render(): string {
    const {
      src, alt = 'Аватар', size = 'medium', className = '',
    } = this.props;

    const sizeClass = {
      small: 'avatar-small',
      medium: 'avatar-medium',
      large: 'avatar-large',
    }[size];

    return `
      <div class="avatar-container ${className}">
        <img 
          src="${src}" 
          alt="${alt}" 
          class="avatar-image ${sizeClass}"
        />
        <label for="avatar-input" class="avatar-change-link">Поменять аватар</label>
        <input 
          type="file" 
          id="avatar-input" 
          accept="image/*" 
          class="avatar-input"
        />
      </div>
    `;
  }
}
