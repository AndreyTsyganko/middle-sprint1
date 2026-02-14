import Block from '../../Core/Block';
import Avatar from '../../components/Avatar/Avatar';
import FormField from '../../components/FormField/FormField';
import Button from '../../components/Button/Button';
import { RESOURCES_URL } from '../../Api/config';

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

  avatar?: Avatar;
  saveButton?: Button;
  email?: FormField;
  login?: FormField;
  firstName?: FormField;
  secondName?: FormField;
  displayName?: FormField;
  phone?: FormField;
  oldPassword?: FormField;
  newPassword?: FormField;
  userData?: any;
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
        src: user.avatar ? `${RESOURCES_URL}${user.avatar}?t=${Date.now()}` : '/ui/default-avatar.jpg',
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
      events: {
        click: (e: Event) => this.handleClick(e),
        submit: (e: Event) => this.handleFormSubmit(e),
      },
    });

    this.fields = fields;

    setTimeout(() => {
      this.loadUserData();
    }, 0);
  }

  private handleClick(e: Event): void {
    const target = e.target as HTMLElement;

    if (target.id === 'backLink' || target.closest('#backLink')) {
      e.preventDefault();
      this.goToChats();
    }

    if (target.id === 'logoutButton' || target.closest('#logoutButton')) {
      e.preventDefault();
      this.handleLogout();
    }

    if (target.id === 'deleteProfileButton' || target.closest('#deleteProfileButton')) {
      e.preventDefault();
      alert('Удаление профиля пока не реализовано');
    }
  }

  private handleFormSubmit(e: Event): void {
    e.preventDefault();
    this.handleSave();
  }

  async loadUserData(): Promise<void> {
    try {
      if (!api.isAuthenticated()) {
        if ((window as any).appRouter) {
          (window as any).appRouter.go('/');
        }
        return;
      }

      const user = await api.getUser();
      console.log('User data loaded:', user);

      if (user.avatar && !user.avatar.includes('http')) {
        user.avatar = `${RESOURCES_URL}${user.avatar}?t=${Date.now()}`;
      }

      this.updateFormFields(user);
      this.updateGlobalStore(user);

      this.setProps({ userData: user });
    } catch (error: any) {
      console.error('Failed to load user data:', error);

      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          this.updateFormFields(user);
        } catch (e) {
          // ignore - используем данные из localStorage как fallback
        }
      }
    }
  }

  private updateGlobalStore(user: any): void {
    try {
      const { store } = (window as any);
      if (store) {
        store.set('user', user);
      }
    } catch (e) {
      console.log('Store недоступен');
    }
  }

  updateFormFields(user: any): void {
    if (!this.fields) return;

    Object.keys(this.fields).forEach((key) => {
      const field = this.fields[key];
      if (!field) return;

      const fieldProps = field.props as unknown as { name?: string };
      const fieldName = fieldProps.name;

      if (fieldName && user[fieldName] !== undefined && user[fieldName] !== null) {
        field.setProps({ value: user[fieldName] });
      }
    });

    const props = this.props as unknown as ProfilePageProps;
    if (user.avatar && props.avatar) {
      props.avatar.setProps({ src: user.avatar });
    }
  }

  onFieldChange(fieldName: string, value: string): void {
    console.log(`Field ${fieldName} changed:`, value);
  }

  async handleSave(): Promise<void> {
    const props = this.props as unknown as ProfilePageProps;

    try {
      if (props.saveButton) {
        props.saveButton.setProps({ text: 'Сохранение...', disabled: true });
      }

      const data: Record<string, string> = {};
      let isValid = true;

      if (!this.fields) {
        console.error('Fields is undefined');
        return;
      }

      Object.values(this.fields).forEach((field) => {
        if (!field) return;

        const value = field.getValue();
        const fieldProps = field.props as unknown as { name?: string };
        const fieldName = fieldProps.name;

        if (fieldName && fieldName !== 'oldPassword' && fieldName !== 'newPassword') {
          data[fieldName] = value;

          if (!value.trim()) {
            field.setError('Это поле обязательно');
            isValid = false;
          }
        }
      });

      if (!isValid) {
        if (props.saveButton) {
          props.saveButton.setProps({ text: 'Сохранить', disabled: false });
        }
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

      if (updatedUser.avatar && !updatedUser.avatar.includes('http')) {
        updatedUser.avatar = `${RESOURCES_URL}${updatedUser.avatar}?t=${Date.now()}`;
      }

      const oldPassword = this.fields.oldPassword?.getValue();
      const newPassword = this.fields.newPassword?.getValue();

      if (oldPassword && newPassword) {
        if (newPassword.length < 6) {
          this.fields.newPassword?.setError('Новый пароль должен быть не менее 6 символов');
          if (props.saveButton) {
            props.saveButton.setProps({ text: 'Сохранить', disabled: false });
          }
          return;
        }

        await api.updatePassword(oldPassword, newPassword);

        if (this.fields.oldPassword) this.fields.oldPassword.setProps({ value: '' });
        if (this.fields.newPassword) this.fields.newPassword.setProps({ value: '' });
      }

      this.updateFormFields(updatedUser);
      this.updateGlobalStore(updatedUser);
      this.updateAvatarGlobally(updatedUser.avatar);

      this.showSuccessMessage('Профиль успешно сохранен!');

      localStorage.setItem('user', JSON.stringify(updatedUser));

      if (props.onSave) {
        props.onSave(updatedUser);
      }

      setTimeout(() => {
        this.goToChats();
      }, 1500);
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      alert(`Ошибка сохранения: ${error.message}`);
    } finally {
      if (props.saveButton) {
        props.saveButton.setProps({ text: 'Сохранить', disabled: false });
      }
    }
  }

  private updateAvatarGlobally(avatarUrl: string): void {
    const myAvatarSelectors = [
      '.header-avatar-img',
      '.profile-avatar',
      '.user-avatar.current-user',
    ];

    myAvatarSelectors.forEach((selector) => {
      const images = document.querySelectorAll(selector);
      images.forEach((img: Element) => {
        const image = img as HTMLImageElement;
        image.src = avatarUrl;
        image.style.objectFit = 'cover';
      });
    });
  }

  async handleAvatarChange(file: File): Promise<void> {
    const props = this.props as unknown as ProfilePageProps;

    try {
      const updatedUser = await api.updateAvatar(file);

      if (updatedUser.avatar && !updatedUser.avatar.includes('http')) {
        updatedUser.avatar = `${RESOURCES_URL}${updatedUser.avatar}?t=${Date.now()}`;
      }

      if (props.avatar) {
        props.avatar.setProps({ src: updatedUser.avatar });
      }

      this.updateGlobalStore(updatedUser);
      this.updateAvatarGlobally(updatedUser.avatar);

      localStorage.setItem('user', JSON.stringify(updatedUser));

      this.showSuccessMessage('Аватар успешно обновлен!');

      if (props.onAvatarChange) {
        props.onAvatarChange(file);
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
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(messageEl);

    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 3000);
  }

  async handleLogout(): Promise<void> {
    try {
      await api.logout();

      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userLogin');
      localStorage.removeItem('user');

      if ((window as any).appRouter) {
        (window as any).appRouter.go('/');
      } else {
        window.location.href = '/';
      }
    } catch (error: any) {
      console.error('Logout error:', error.message);

      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userLogin');
      localStorage.removeItem('user');

      if ((window as any).appRouter) {
        (window as any).appRouter.go('/');
      } else {
        window.location.href = '/';
      }
    }
  }

  private goToChats(): void {
    if ((window as any).appRouter) {
      (window as any).appRouter.go('/messenger');
    } else {
      window.location.href = '/messenger';
    }
  }

  render(): string {
    const props = this.props as unknown as ProfilePageProps;
    const { avatar } = props;
    const { saveButton } = props;

    const nonPasswordFields = this.fields ? Object.values(this.fields).filter((field) => {
      if (!field) return false;
      const fieldProps = field.props as unknown as { name?: string };
      const fieldName = fieldProps.name;
      return fieldName && !fieldName.includes('Password');
    }) : [];

    const oldPasswordField = this.fields?.oldPassword;
    const newPasswordField = this.fields?.newPassword;

    return `
    <main class="auth-page">
      <div class="auth-card profile-card">
        <button class="back-button" id="backLink" style="
          background: none;
          border: none;
          color: #5b5252;
          font-size: 14px;
          cursor: pointer;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 0;
        ">
          <span style="font-size: 20px;">←</span> Назад к чатам
        </button>
        
        <h1 class="auth-title">Редактирование профиля</h1>
        
        <div class="avatar-section">
          ${avatar?.render() || ''}
        </div>

        <form class="auth-form profile-form" id="profileForm">
          ${nonPasswordFields.map((field) => field.render()).join('')}
          
          <div class="password-section">
            <h3 class="password-title">Смена пароля</h3>
            ${oldPasswordField ? oldPasswordField.render() : ''}
            ${newPasswordField ? newPasswordField.render() : ''}
          </div>
          
          <div class="profile-buttons">
            ${saveButton?.render() || ''}
            <button type="button" class="auth-button" id="logoutButton">Выйти</button>
            <button type="button" class="auth-button delete-profile-button" id="deleteProfileButton">
              Удалить профиль
            </button>
          </div>
        </form>
      </div>
    </main>
  `;
  }

  componentDidMount(): void {
    console.log('ProfilePage mounted');
  }
}
