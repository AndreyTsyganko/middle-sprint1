import Block from '../../Core/Block';
import Avatar from '../../components/Avatar/Avatar';
import FormField from '../../components/FormField/FormField';
import Button from '../../components/Button/Button';
interface UserData {
  first_name: string;
  second_name: string;
  display_name: string;
  login: string;
  email: string;
  phone: string;
  avatar: string;
}
interface ProfileFormData {
  email: string;
  login: string;
  firstName: string;
  secondName: string;
  displayName: string;
  phone: string;
  oldPassword: string;
  newPassword: string;
}
interface ProfilePageProps {
  user?: UserData;
  onSave?: (data: ProfileFormData) => void;
  onBack?: () => void;
  onAvatarChange?: (file: File) => void;
}
export default class ProfilePage extends Block {
  private fields: Record<string, FormField> = {};

  constructor(props: ProfilePageProps) {
    const user = props.user || {
      first_name: '',
      second_name: '',
      display_name: '',
      login: '',
      email: '',
      phone: '',
      avatar: '/ui/BMW 1.jpg',
    };

    const fields = {
      email: new FormField({
        label: 'Почта',
        name: 'email',
        type: 'email',
        value: user.email,
        required: true,
      }),
      login: new FormField({
        label: 'Логин',
        name: 'login',
        value: user.login,
        required: true,
      }),
      firstName: new FormField({
        label: 'Имя',
        name: 'first_name',
        value: user.first_name,
        required: true,
      }),
      secondName: new FormField({
        label: 'Фамилия',
        name: 'second_name',
        value: user.second_name,
        required: true,
      }),
      displayName: new FormField({
        label: 'Имя в чате',
        name: 'display_name',
        value: user.display_name,
        required: true,
      }),
      phone: new FormField({
        label: 'Телефон',
        name: 'phone',
        value: user.phone,
        required: true,
      }),
      oldPassword: new FormField({
        label: 'Старый пароль',
        name: 'oldPassword',
        type: 'password',
        placeholder: 'Введите старый пароль',
      }),
      newPassword: new FormField({
        label: 'Новый пароль',
        name: 'newPassword',
        type: 'password',
        placeholder: 'Введите новый пароль',
      }),
    };

    super('div', {
      ...props,
      avatar: new Avatar({
        src: user.avatar,
        size: 'large',
        onChange: props.onAvatarChange,
      }),
      ...fields,
      saveButton: new Button({
        text: 'Сохранить',
        type: 'submit',
        className: 'auth-button profile-save',
        onClick: () => this.handleSave(),
      }),
      backButton: new Button({
        text: 'Назад к чатам',
        className: 'auth-link',
        onClick: props.onBack,
      }),
    });

    this.fields = fields;
  }

  handleSave(): void {
    const data: ProfileFormData = {
      email: this.fields.email.getValue(),
      login: this.fields.login.getValue(),
      firstName: this.fields.firstName.getValue(),
      secondName: this.fields.secondName.getValue(),
      displayName: this.fields.displayName.getValue(),
      phone: this.fields.phone.getValue(),
      oldPassword: this.fields.oldPassword.getValue(),
      newPassword: this.fields.newPassword.getValue(),
    };

    let isValid = true;

    Object.entries(this.fields).forEach(([key, field]) => {
      const value = field.getValue();
      
      if (key !== 'oldPassword' && key !== 'newPassword' && !value) {
        field.setError('Это поле обязательно');
        isValid = false;
      }
    });


    if ((data.oldPassword || data.newPassword) && (!data.oldPassword || !data.newPassword)) {
      if (!data.oldPassword) {
        this.fields.oldPassword.setError('Введите старый пароль');
      }
      if (!data.newPassword) {
        this.fields.newPassword.setError('Введите новый пароль');
      }
      isValid = false;
    }

    if (data.newPassword && data.newPassword.length < 6) {
      this.fields.newPassword.setError('Новый пароль должен быть не менее 6 символов');
      isValid = false;
    }

    const typedProps = this.props as unknown as ProfilePageProps;
    if (isValid && typedProps.onSave) {
      typedProps.onSave(data);
    }
  }

  render(): string {
    const avatar = this.props.avatar as Avatar;
    const saveButton = this.props.saveButton as Button;
    
    const nonPasswordFields = Object.values(this.fields).filter((field) => {

      const fieldName = (field.props as { name?: string }).name;
      return fieldName && !fieldName.includes('Password');
    });

    return `
    <main class="auth-page">
      <div class="auth-card profile-card">
        <h1 class="auth-title">Редактирование профиля</h1>
        <div class="avatar-section">
          ${avatar.render()}
        </div>
        <form class="auth-form profile-form">
          ${nonPasswordFields.map((field) => field.render()).join('')}
          
          <div class="password-section">
            <h3 class="password-title">Смена пароля</h3>
            ${this.fields.oldPassword.render()}
            ${this.fields.newPassword.render()}
          </div>
          
          <div class="profile-buttons">
            ${saveButton.render()}
            <a href="/chats" class="auth-link">Назад к чатам</a>
          </div>
        </form>
      </div>
    </main>
  `;
  }
}
