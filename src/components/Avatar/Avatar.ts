import Block from '../../Core/Block';

interface AvatarProps {
  src: string;
  size?: 'small' | 'medium' | 'large';
  onChange?: (file: File) => void;
}

export default class Avatar extends Block {
  constructor(props: AvatarProps) {
    super('div', {
      ...props,
      size: props.size || 'medium',
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
    const props = this.props as unknown as AvatarProps & { size: 'small' | 'medium' | 'large' };
    const { src, size = 'medium' } = props;

    const sizeClasses: Record<'small' | 'medium' | 'large', string> = {
      small: 'avatar-image-small',
      medium: 'avatar-image-medium',
      large: 'avatar-image-large',
    };

    const validSize = size in sizeClasses ? size as 'small' | 'medium' | 'large' : 'medium';
    const sizeClass = sizeClasses[validSize];

    return `
      <div class="avatar-container">
        <img 
          src="${src}" 
          alt="Аватар" 
          class="avatar-image ${sizeClass}"
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
