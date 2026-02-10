import Block from '../../Core/Block';
import { api } from '../../Api/Client';

interface ProfileModalProps {
  isOpen?: boolean;
  user?: any;
  onClose?: () => void;
  onSave?: (data: any) => void;
  onLogout?: () => void;
  onDelete?: () => void;
}

export default class ProfileModal extends Block {
  constructor(props: ProfileModalProps = {}) {
    const user = props.user || {};
    
    super('div', {
      ...props,
      avatar: user.avatar || '/ui/default-avatar.jpg',
      first_name: user.first_name || '',
      second_name: user.second_name || '',
      display_name: user.display_name || '',
      login: user.login || '',
      email: user.email || '',
      phone: user.phone || '',
      showDeleteModal: false,
      deletePassword: '',
      deleteError: ''
    });
  }

  componentDidMount(): void {
    console.log('ProfileModal mounted');
    this.bindEvents();
  }

  componentDidUpdate(): boolean {
    console.log('ProfileModal updated');
    this.bindEvents();
    return true;
  }

  bindEvents(): void {
    console.log('Binding events...');
    
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) {
      console.log('Found close button');
      closeBtn.addEventListener('click', this.handleClose.bind(this));
    }

    const modalOverlay = document.querySelector('#profileModal .modal-overlay');
    if (modalOverlay) {
      console.log('Found modal overlay');
      modalOverlay.addEventListener('click', this.handleOverlayClick.bind(this));
    }

    const form = document.querySelector('#profileForm');
    if (form) {
      console.log('Found form');
      form.addEventListener('submit', this.handleFormSubmit.bind(this));
    }

    const logoutBtn = document.querySelector('#logoutButton');
    if (logoutBtn) {
      console.log('Found logout button');
      logoutBtn.addEventListener('click', this.handleLogout.bind(this));
    }

    const deleteBtn = document.querySelector('#deleteProfileButton');
    if (deleteBtn) {
      console.log('Found delete button');
      deleteBtn.addEventListener('click', this.handleDeleteClick.bind(this));
    }

    const backLink = document.querySelector('#backToChats');
    if (backLink) {
      console.log('Found back link');
      backLink.addEventListener('click', this.handleClose.bind(this));
    }

    const cancelDeleteBtn = document.querySelector('#cancelDelete');
    const confirmDeleteBtn = document.querySelector('#confirmDelete');
    const deleteModalOverlay = document.querySelector('#deleteModal .modal-overlay');
    
    if (cancelDeleteBtn) {
      cancelDeleteBtn.addEventListener('click', this.handleCancelDelete.bind(this));
    }
    
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', this.handleConfirmDelete.bind(this));
    }
    
    if (deleteModalOverlay) {
      deleteModalOverlay.addEventListener('click', this.handleDeleteOverlayClick.bind(this));
    }

    const confirmPasswordInput = document.querySelector('#confirmPassword');
    if (confirmPasswordInput) {
      confirmPasswordInput.addEventListener('input', this.handleDeletePasswordInput.bind(this));
    }
  }

  handleClose(e: Event): void {
    e.preventDefault();
    console.log('Close button clicked');
    if (this.props.onClose) {
      this.props.onClose();
    }
  }

  handleOverlayClick(e: Event): void {
    if (e.target === e.currentTarget) {
      console.log('Overlay clicked');
      if (this.props.onClose) {
        this.props.onClose();
      }
    }
  }

  handleFormSubmit(e: Event): void {
    e.preventDefault();
    console.log('Form submitted');
    this.handleSave();
  }

  handleLogout(e: Event): void {
    e.preventDefault();
    console.log('Logout button clicked');
    if (this.props.onLogout) {
      this.props.onLogout();
    }
  }

  handleDeleteClick(e: Event): void {
    e.preventDefault();
    console.log('Delete button clicked');
    this.openDeleteModal();
  }

  handleCancelDelete(e: Event): void {
    e.preventDefault();
    console.log('Cancel delete clicked');
    this.closeDeleteModal();
  }

  handleConfirmDelete(e: Event): void {
    e.preventDefault();
    console.log('Confirm delete clicked');
    this.handleDeleteProfile();
  }

  handleDeleteOverlayClick(e: Event): void {
    if (e.target === e.currentTarget) {
      console.log('Delete modal overlay clicked');
      this.closeDeleteModal();
    }
  }

  handleDeletePasswordInput(e: Event): void {
    const value = (e.target as HTMLInputElement).value;
    this.setProps({ deletePassword: value });
  }

  async handleSave(): Promise<void> {
    console.log('handleSave called');
    
    const getValue = (id: string): string => {
      const element = document.querySelector(`#${id}`) as HTMLInputElement;
      return element?.value || '';
    };
    
    const formData = {
      first_name: getValue('first_name'),
      second_name: getValue('second_name'),
      display_name: getValue('display_name'),
      login: getValue('login'),
      email: getValue('email'),
      phone: getValue('phone'),
    };

    console.log('Form data to save:', formData);

    const oldPassword = getValue('old_password');
    const newPassword = getValue('new_password');
    const newPasswordConfirm = getValue('new_password_confirm');

    const hasProfileChanges = Object.keys(formData).some(key => {
      const newValue = formData[key as keyof typeof formData];
      const oldValue = this.props[key] || '';
      return newValue !== oldValue;
    });

    const hasPasswordChanges = oldPassword || newPassword || newPasswordConfirm;

    if (!hasProfileChanges && !hasPasswordChanges) {
      alert('Нет изменений для сохранения');
      return;
    }

    try {
      if (hasProfileChanges) {
        await api.updateProfile(formData);
        console.log('Profile updated');
      }

      if (hasPasswordChanges) {
        if (!oldPassword || !newPassword) {
          throw new Error('Для смены пароля нужно заполнить все поля пароля');
        }

        if (newPassword !== newPasswordConfirm) {
          throw new Error('Новые пароли не совпадают');
        }

        if (newPassword.length < 6) {
          throw new Error('Новый пароль должен быть не менее 6 символов');
        }

        await api.updatePassword(oldPassword, newPassword);
        console.log('Password updated');
      }

      alert('Профиль успешно обновлен');
      
      if (this.props.onSave) {
        this.props.onSave(formData);
      }
      
    } catch (error: any) {
      console.error('Profile update error:', error);
      alert('Ошибка: ' + (error.message || 'Не удалось обновить профиль'));
    }
  }

  openDeleteModal(): void {
    console.log('openDeleteModal called');
    this.setProps({ 
      showDeleteModal: true,
      deletePassword: '',
      deleteError: ''
    });
  }

  closeDeleteModal(): void {
    console.log('closeDeleteModal called');
    this.setProps({ 
      showDeleteModal: false,
      deletePassword: '',
      deleteError: ''
    });
  }

  async handleDeleteProfile(): Promise<void> {
    console.log('handleDeleteProfile called');
    
    const { deletePassword } = this.props;
    
    if (!deletePassword) {
      this.setProps({ deleteError: 'Введите пароль для подтверждения' });
      return;
    }

    try {
      if (this.props.onDelete) {
        await this.props.onDelete();
      }
    } catch (error: any) {
      console.error('Delete profile error:', error);
      this.setProps({ deleteError: 'Ошибка удаления профиля: ' + error.message });
    }
  }

  render(): string {
    const { isOpen = false, showDeleteModal = false, deletePassword = '', deleteError = '' } = this.props;
    
    if (!isOpen) {
      return '';
    }

    const { 
      avatar = '/ui/default-avatar.jpg',
      first_name = '',
      second_name = '',
      display_name = '',
      login = '',
      email = '',
      phone = ''
    } = this.props;

    const deleteModalStyle = showDeleteModal ? 'display: flex' : 'display: none';

    return `
      <div class="modal-overlay" id="profileModal" style="display: flex">
        <div class="modal-content">
          <button class="modal-close">✕</button>
          
          <main class="auth-page">
            <div class="auth-card profile-card">
              <h1 class="auth-title">Редактирование профиля</h1>
              
              <div class="avatar-section">
                <div class="avatar-container">
                  <img 
                    src="${avatar}" 
                    alt="Аватар" 
                    class="avatar-image"
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
              </div>
              
              <form id="profileForm" class="auth-form profile-form">
                <div class="form-row">
                  <div class="form-field">
                    <label class="form-label" for="first_name">Имя</label>
                    <input 
                      type="text" 
                      id="first_name" 
                      name="first_name"
                      class="form-input"
                      placeholder="Введите имя"
                      value="${first_name}"
                      required
                    >
                    <div class="error-message" id="firstNameError"></div>
                  </div>
                  
                  <div class="form-field">
                    <label class="form-label" for="second_name">Фамилия</label>
                    <input 
                      type="text" 
                      id="second_name" 
                      name="second_name"
                      class="form-input"
                      placeholder="Введите фамилию"
                      value="${second_name}"
                      required
                    >
                    <div class="error-message" id="secondNameError"></div>
                  </div>
                </div>
                
                <div class="form-field">
                  <label class="form-label" for="display_name">Отображаемое имя</label>
                  <input 
                    type="text" 
                    id="display_name" 
                    name="display_name"
                    class="form-input"
                    placeholder="Как вас будут видеть другие"
                    value="${display_name}"
                  >
                  <div class="error-message" id="displayNameError"></div>
                </div>
                
                <div class="form-field">
                  <label class="form-label" for="login">Логин</label>
                    <input 
                      type="text" 
                      id="login" 
                      name="login"
                      class="form-input"
                      placeholder="Введите логин"
                      value="${login}"
                      required
                    >
                    <div class="error-message" id="loginError"></div>
                  </div>
                
                <div class="form-field">
                  <label class="form-label" for="email">Почта</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email"
                    class="form-input"
                    placeholder="Введите email"
                    value="${email}"
                    required
                  >
                  <div class="error-message" id="emailError"></div>
                </div>
                
                <div class="form-field">
                  <label class="form-label" for="phone">Телефон</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    name="phone"
                    class="form-input"
                    placeholder="+7 (999) 123-45-67"
                    value="${phone}"
                  >
                  <div class="error-message" id="phoneError"></div>
                </div>
                
                <h3 class="password-title">Смена пароля</h3>
                
                <div class="form-field">
                  <label class="form-label" for="old_password">Старый пароль</label>
                  <input 
                    type="password" 
                    id="old_password" 
                    name="old_password"
                    class="form-input"
                    placeholder="Введите старый пароль"
                  >
                  <div class="error-message" id="oldPasswordError"></div>
                </div>
                
                <div class="form-field">
                  <label class="form-label" for="new_password">Новый пароль</label>
                  <input 
                    type="password" 
                    id="new_password" 
                    name="new_password"
                    class="form-input"
                    placeholder="Введите новый пароль"
                  >
                  <div class="error-message" id="newPasswordError"></div>
                </div>
                
                <div class="form-field">
                  <label class="form-label" for="new_password_confirm">Повторите новый пароль</label>
                  <input 
                    type="password" 
                    id="new_password_confirm" 
                    name="new_password_confirm"
                    class="form-input"
                    placeholder="Повторите новый пароль"
                  >
                  <div class="error-message" id="newPasswordConfirmError"></div>
                </div>
                
                <div class="profile-buttons">
                  <button type="submit" class="auth-button profile-save">
                    Сохранить изменения
                  </button>
                  
                  <button type="button" class="auth-button" id="logoutButton">
                    Выйти
                  </button>
                  
                  <button type="button" class="auth-button delete-profile-button" id="deleteProfileButton">
                    Удалить профиль
                  </button>
                  
                  <button type="button" class="auth-link" id="backToChats">
                    Вернуться к чатам
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
      
      <div class="modal-overlay" id="deleteModal" style="${deleteModalStyle}">
        <div class="modal-content">
          <h3 class="modal-title">Удаление профиля</h3>
          <p class="modal-text">
            Вы уверены, что хотите удалить свой профиль?<br>
            Это действие нельзя отменить. Все ваши данные и чаты будут удалены.
          </p>
          
          <div class="form-field">
            <label class="form-label" for="confirmPassword">Для подтверждения введите пароль:</label>
            <input 
              type="password" 
              id="confirmPassword" 
              class="form-input"
              placeholder="Введите ваш пароль"
              value="${deletePassword}"
            >
            ${deleteError ? `<div class="error-message">${deleteError}</div>` : ''}
          </div>
          
          <div class="modal-buttons">
            <button type="button" class="modal-button cancel-button" id="cancelDelete">
              Отмена
            </button>
            <button type="button" class="modal-button delete-confirm-button" id="confirmDelete">
              Удалить профиль
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
