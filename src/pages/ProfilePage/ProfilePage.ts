import Block from '../../Core/Block';
import Avatar from '../../components/Avatar/Avatar';
import FormField from '../../components/FormField/FormField';
import Button from '../../components/Button/Button';
import { api } from '../../Api/Client';

interface ProfilePageProps {
  user?: {
    first_name: string;
    second_name: string;
    display_name: string;
    login: string;
    email: string;
    phone: string;
    avatar: string;
  };
  onSave?: (data: any) => void;
  onAvatarChange?: (file: File) => void;
}

export default class ProfilePage extends Block {
  private fields: Record<string, FormField> = {};

  constructor(props: ProfilePageProps = {}) {
    const user = props.user || {
      first_name: '',
      second_name: '',
      display_name: '',
      login: '',
      email: '',
      phone: '',
      avatar: '',
    };

    const fields = {
      email: new FormField({
        label: 'Почта',
        name: 'email',
        type: 'email',
        value: user.email,
        required: true,
        onInput: (value: string) => this.onFieldChange('email', value),
      }),
      login: new FormField({
        label: 'Логин',
        name: 'login',
        value: user.login,
        required: true,
        onInput: (value: string) => this.onFieldChange('login', value),
      }),
      firstName: new FormField({
        label: 'Имя',
        name: 'first_name',
        value: user.first_name,
        required: true,
        onInput: (value: string) => this.onFieldChange('first_name', value),
      }),
      secondName: new FormField({
        label: 'Фамилия',
        name: 'second_name',
        value: user.second_name,
        required: true,
        onInput: (value: string) => this.onFieldChange('second_name', value),
      }),
      displayName: new FormField({
        label: 'Имя в чате',
        name: 'display_name',
        value: user.display_name,
        required: true,
        onInput: (value: string) => this.onFieldChange('display_name', value),
      }),
      phone: new FormField({
        label: 'Телефон',
        name: 'phone',
        value: user.phone,
        required: true,
        onInput: (value: string) => this.onFieldChange('phone', value),
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
        src: user.avatar || '/ui/default-avatar.jpg',
        size: 'large',
        onChange: (file: File) => this.handleAvatarChange(file),
      }),
      ...fields,
      saveButton: new Button({
        text: 'Сохранить',
        type: 'submit',
        className: 'auth-button profile-save',
        onClick: () => this.handleSave(),
      }),
    });

    this.fields = fields;

    this.loadUserData();
  }

  async loadUserData(): Promise<void> {
    try {
      if (!api.isAuthenticated()) {
        if (window.appRouter) {
          window.appRouter.go('/');
        }
        return;
      }

      const user = await api.getUser();
      console.log('User data loaded:', user);

      this.updateFormFields(user);

      if (user.avatar) {
        this.props.avatar.setProps({ src: user.avatar });
      }

      this.setProps({ userData: user });
    } catch (error: any) {
      console.error('Failed to load user data:', error);
      alert(`Ошибка загрузки профиля: ${error.message}`);
    }
  }

  updateFormFields(user: any): void {
    Object.keys(this.fields).forEach((key) => {
      const field = this.fields[key];
      const fieldName = field.props.name;

      if (user[fieldName] !== undefined && user[fieldName] !== null) {
        field.setProps({ value: user[fieldName] });
      }
    });

    if (user.avatar) {
      this.props.avatar.setProps({ src: user.avatar });
    }
  }

  onFieldChange(fieldName: string, value: string): void {
    console.log(`Field ${fieldName} changed:`, value);
  }

  async handleSave(): Promise<void> {
    try {
      this.props.saveButton.setProps({ text: 'Сохранение...', disabled: true });

      const data: Record<string, string> = {};
      let isValid = true;

      Object.values(this.fields).forEach((field) => {
        const value = field.getValue();
        const fieldName = field.props.name;

        if (fieldName !== 'oldPassword' && fieldName !== 'newPassword') {
          data[fieldName] = value;

          if (!value.trim()) {
            field.setError('Это поле обязательно');
            isValid = false;
          }
        }
      });

      if (!isValid) {
        this.props.saveButton.setProps({ text: 'Сохранить', disabled: false });
        return;
      }

      const profileData = {
        first_name: data.first_name,
        second_name: data.second_name,
        display_name: data.display_name,
        login: data.login,
        email: data.email,
        phone: data.phone,
      };

      const updatedUser = await api.updateProfile(profileData);

      const oldPassword = this.fields.oldPassword.getValue();
      const newPassword = this.fields.newPassword.getValue();

      if (oldPassword && newPassword) {
        if (newPassword.length < 6) {
          this.fields.newPassword.setError('Новый пароль должен быть не менее 6 символов');
          this.props.saveButton.setProps({ text: 'Сохранить', disabled: false });
          return;
        }

        await api.updatePassword(oldPassword, newPassword);

        this.fields.oldPassword.setProps({ value: '' });
        this.fields.newPassword.setProps({ value: '' });
      }

      this.updateFormFields(updatedUser);

      this.showSuccessMessage('Профиль успешно сохранен!');

      localStorage.setItem('user', JSON.stringify(updatedUser));

      if (this.props.onSave) {
        this.props.onSave(updatedUser);
      }
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      alert(`Ошибка сохранения: ${error.message}`);
    } finally {
      this.props.saveButton.setProps({ text: 'Сохранить', disabled: false });
    }
  }

  async handleAvatarChange(file: File): Promise<void> {
    try {
      const updatedUser = await api.updateAvatar(file);

      this.props.avatar.setProps({ src: updatedUser.avatar });

      localStorage.setItem('user', JSON.stringify(updatedUser));

      this.showSuccessMessage('Аватар успешно обновлен!');

      if (this.props.onAvatarChange) {
        this.props.onAvatarChange(file);
      }
    } catch (error: any) {
      console.error('Failed to update avatar:', error);
      alert(`Ошибка обновления аватара: ${error.message}`);
    }
  }

  showSuccessMessage(message: string): void {
    const messageEl = document.createElement('div');
    messageEl.className = 'success-message';
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 1000;
    `;

    document.body.appendChild(messageEl);

    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 3000);
  }

  handleBackClick(): void {
    if (window.appRouter) {
      window.appRouter.go('/messenger');
    }
  }

  render(): string {
    return `
    <main class="auth-page">
      <div class="auth-card profile-card">
        <h1 class="auth-title">Редактирование профиля</h1>
        <div class="avatar-section">
          ${this.props.avatar.render()}
        </div>
        <div class="auth-form profile-form">
          ${Object.values(this.fields)
    .filter((field) => !field.props.name.includes('Password'))
    .map((field) => field.render())
    .join('')}
          
          <div class="password-section">
            <h3 class="password-title">Смена пароля</h3>
            ${this.fields.oldPassword.render()}
            ${this.fields.newPassword.render()}
          </div>
          
          <div class="profile-buttons">
            ${this.props.saveButton.render()}
            <a href="/messenger" class="auth-link" id="backLink">Назад к чатам</a>
          </div>
        </div>
      </div>
    </main>
  `;
  }

  componentDidMount(): void {
    const backLink = this.element?.querySelector('#backLink');
    if (backLink) {
      backLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleBackClick();
      });
    }
  }
}
