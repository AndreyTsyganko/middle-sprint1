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
    super('div', {
      ...props,
      avatar: props.user?.avatar || '/ui/default-avatar.jpg',
      first_name: props.user?.first_name || '',
      second_name: props.user?.second_name || '',
      display_name: props.user?.display_name || '',
      login: props.user?.login || '',
      email: props.user?.email || '',
      phone: props.user?.phone || '',
    });
  }

  componentDidMount(): void {
    this.bindEvents();
    this.loadUserData();
  }

  async loadUserData(): Promise<void> {
    try {
      const user = await api.getUser();
      this.setProps({ 
        ...user,
        avatar: user.avatar || '/ui/default-avatar.jpg'
      });
    } catch (error) {
      console.error('Ошибка загрузки данных пользователя:', error);
    }
  }

  bindEvents(): void {
    const closeBtn = this.element?.querySelector('#closeProfileModal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (this.props.onClose) this.props.onClose();
      });
    }

    const modalOverlay = this.element?.querySelector('.modal-overlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          if (this.props.onClose) this.props.onClose();
        }
      });
    }

    const form = this.element?.querySelector('#profileForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSave();
      });
    }


    const logoutBtn = this.element?.querySelector('#logoutButton');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.handleLogout();
      });
    }

    const deleteBtn = this.element?.querySelector('#deleteProfileButton');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        this.openDeleteModal();
      });
    }


    const backLink = this.element?.querySelector('#backToChats');
    if (backLink) {
      backLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.props.onClose) this.props.onClose();
      });
    }

    const cancelDeleteBtn = this.element?.querySelector('#cancelDelete');
    const confirmDeleteBtn = this.element?.querySelector('#confirmDelete');
    
    if (cancelDeleteBtn) {
      cancelDeleteBtn.addEventListener('click', () => {
        this.closeDeleteModal();
      });
    }
    
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', () => {
        this.handleDeleteProfile();
      });
    }
  }

  async handleSave(): Promise<void> {
    const formData = {
      first_name: (this.element?.querySelector('#first_name') as HTMLInputElement)?.value,
      second_name: (this.element?.querySelector('#second_name') as HTMLInputElement)?.value,
      display_name: (this.element?.querySelector('#display_name') as HTMLInputElement)?.value,
      login: (this.element?.querySelector('#login') as HTMLInputElement)?.value,
      email: (this.element?.querySelector('#email') as HTMLInputElement)?.value,
      phone: (this.element?.querySelector('#phone') as HTMLInputElement)?.value,
    };

    try {
      await api.updateProfile(formData);
      alert('Профиль обновлен');
      if (this.props.onClose) this.props.onClose();
    } catch (error: any) {
      alert('Ошибка: ' + (error.message || 'Не удалось обновить профиль'));
    }
  }

  handleLogout(): void {
    if (this.props.onLogout) {
      this.props.onLogout();
    }
  }

  openDeleteModal(): void {
    const modal = this.element?.querySelector('#deleteModal') as HTMLElement;
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  closeDeleteModal(): void {
    const modal = this.element?.querySelector('#deleteModal') as HTMLElement;
    if (modal) {
      modal.style.display = 'none';
    }
  }

  async handleDeleteProfile(): Promise<void> {
    const password = (this.element?.querySelector('#confirmPassword') as HTMLInputElement)?.value;
    
    if (!password) {
      alert('Введите пароль для подтверждения');
      return;
    }

    try {
      
      alert('Профиль удален');
      if (this.props.onDelete) {
        this.props.onDelete();
      }
    } catch (error) {
      alert('Ошибка удаления профиля');
    }
  }

  render(): string {
    const { isOpen = false } = this.props;
    
    return `
      <div class="modal-overlay" id="profileModal" style="display: ${isOpen ? 'flex' : 'none'}">
        <div class="modal-content">
          <button class="modal-close" id="closeProfileModal">✕</button>
          <!-- Вставьте ваш profile-redact.hbs код здесь -->
          ${this.renderProfileForm()}
        </div>
      </div>
    `;
  }

  renderProfileForm(): string {
    const { avatar, first_name, second_name, display_name, login, email, phone } = this.props;
    
    return `
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
      
      <div class="modal-overlay" id="deleteModal" style="display: none;">
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
            >
            <div class="error-message" id="confirmPasswordError"></div>
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
