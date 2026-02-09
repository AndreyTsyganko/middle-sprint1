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

    this.loadUser();
  }

  async loadUser(): Promise<void> {
    try {
      if (!api.isAuthenticated()) {
        if (window.appRouter) {
          window.appRouter.go('/');
        }
        return;
      }

      const user = await api.getUser();
      
      this.updateFormFields(user);
    } catch (error) {
      console.error('Failed to load user:', error);
      alert('Ошибка загрузки профиля');
    }
  }

  updateFormFields(user: any): void {
    Object.values(this.fields).forEach((field) => {
      const fieldName = field.props.name;
      if (user[fieldName] !== undefined) {
        field.setProps({ value: user[fieldName] });
      }
    });

    if (user.avatar) {
      this.props.avatar.setProps({ src: user.avatar });
    }
  }

  async handleSave(): Promise<void> {
    const data: Record<string, string> = {};
    let isValid = true;

    Object.values(this.fields).forEach((field) => {
      const value = field.getValue();
      const fieldName = field.props.name;
      data[fieldName] = value;

      if (fieldName !== 'oldPassword' && fieldName !== 'newPassword' && !value) {
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

    if (!isValid) return;

    try {
      this.props.saveButton.setProps({ text: 'Сохранение...', disabled: true });

      const profileData = {
        first_name: data.first_name,
        second_name: data.second_name,
        display_name: data.display_name,
        login: data.login,
        email: data.email,
        phone: data.phone,
      };

      await api.updateProfile(profileData);
      

      if (data.oldPassword && data.newPassword) {
        await api.updatePassword(data.oldPassword, data.newPassword);
      }

      alert('Профиль успешно сохранен!');
      
      await this.loadUser();
      
      if (this.props.onSave) {
        this.props.onSave(profileData);
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
      const result = await api.updateAvatar(file);
      console.log('Avatar updated:', result);
      
      if (result.avatar) {
        this.props.avatar.setProps({ src: result.avatar });
        alert('Аватар успешно обновлен!');
      }
      
      if (this.props.onAvatarChange) {
        this.props.onAvatarChange(file);
      }
    } catch (error: any) {
      console.error('Failed to update avatar:', error);
      alert(`Ошибка обновления аватара: ${error.message}`);
    }
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
