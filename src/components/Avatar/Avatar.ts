import Block from '../../Core/Block';

interface AvatarProps {
  src: string;
  size?: 'small' | 'medium' | 'large';
  onChange?: (file: File) => void;
  events?: Record<string, EventListener>;
}

export default class Avatar extends Block {
  constructor(props: AvatarProps) {
    const sizeClasses: Record<string, string> = {
      small: 'avatar-image-small',
      medium: 'avatar-image-medium',
      large: 'avatar-image-large',
    };

    super('div', {
      ...props,
      size: props.size || 'medium',
      sizeClasses,
      events: {
        change: (event: Event) => {
          const input = event.target as HTMLInputElement;
          if (input.files && input.files[0]) {
            if (props.onChange) {
              props.onChange(input.files[0]);
            }
          }
        },
      },
    });
  }

  render(): string {
    const { src, size = 'medium' } = this.props as AvatarProps & { sizeClasses: Record<string, string> };
    const sizeClasses = (this.props as any).sizeClasses as Record<string, string>;

    return `
      <div class="avatar-container">
        <img 
          src="${src}" 
          alt="Аватар" 
          class="avatar-image ${sizeClasses[size]}"
          id="avatarImage"
        >
        <label for="avatarInput" class="avatar-change-link">
          Изменить аватар
        </label>
        <input 
          type="file" 
          id="avatarInput" 
          class="avatar-input"
          accept="image/*"
        >
        <div class="error-message" id="avatarError"></div>
      </div>
    `;
  }
}
