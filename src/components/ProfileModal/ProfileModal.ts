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
  private isDataLoaded = false;

  private isUploading = false;

  private currentUser: any = null;

  private pendingAvatarFile: File | null = null;

  constructor(props: ProfileModalProps = {}) {
    const globalUser = (window as any).store?.get('user');
    const userData = globalUser || props.user || {};

    super('div', {
      ...props,
      avatar: userData.avatar || '/ui/default-avatar.jpg',
      first_name: userData.first_name || '',
      second_name: userData.second_name || '',
      display_name: userData.display_name || '',
      login: userData.login || '',
      email: userData.email || '',
      phone: userData.phone || '',
    });

    this.currentUser = { ...userData };
  }

  componentDidMount(): void {
    console.log('ProfileModal mounted');
    console.log('currentUser:', this.currentUser?.avatar);
    console.log('props.user:', this.props.user?.avatar);
    this.bindEvents();

    if (!this.isDataLoaded && !this.currentUser.avatar) {
      this.loadUserProfile();
      this.isDataLoaded = true;
    }
  }

  private async loadUserProfile(): Promise<void> {
    try {
      this.currentUser = await api.getUser();
      console.log('Загружен профиль с сервера:', this.currentUser);

      const avatarUrl = this.currentUser.avatar
        ? `https://ya-praktikum.tech/api/v2/resources${this.currentUser.avatar}?t=${Date.now()}`
        : '/ui/default-avatar.jpg';

      this.currentUser = { ...this.currentUser, avatar: avatarUrl };
      this.setProps({ user: this.currentUser });
      this.updateGlobalStore();
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    }
  }

  private async handleAvatarChange(event: Event): Promise<void> {
    if (this.isUploading) return;

    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    console.log('Выбран файл:', file.name);
    this.pendingAvatarFile = file;

    const localUrl = URL.createObjectURL(file);
    const avatarImg = document.querySelector('#avatarImage') as HTMLImageElement;
    if (avatarImg) {
      avatarImg.src = localUrl;
    }

    target.value = '';
  }

  private updateGlobalStore(): void {
    try {
      const { store } = (window as any);
      if (store && this.currentUser) {
        store.set('user', this.currentUser);
        console.log('Store обновлен:', this.currentUser.avatar);
      }
    } catch (e) {
      console.log('Store недоступен');
    }
  }

  bindEvents(): void {
    console.log('Привязка событий');

    const avatarInput = document.querySelector('#avatarInput');
    if (avatarInput) {
      avatarInput.addEventListener('change', this.handleAvatarChange.bind(this));
    }

    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', this.handleClose.bind(this));

    const form = document.querySelector('#profileForm');
    if (form) form.addEventListener('submit', this.handleFormSubmit.bind(this));

    const logoutBtn = document.querySelector('#logoutButton');
    if (logoutBtn) logoutBtn.addEventListener('click', this.handleLogout.bind(this));

    const deleteBtn = document.querySelector('#deleteProfileButton');
    if (deleteBtn) deleteBtn.addEventListener('click', this.handleDeleteClick.bind(this));

    const backLink = document.querySelector('#backToChats');
    if (backLink) backLink.addEventListener('click', this.handleClose.bind(this));
  }

  handleClose(e?: Event): void {
    if (e) e.preventDefault();
    if (this.props.onClose) this.props.onClose!();
  }

  handleFormSubmit(e: Event): void {
    e.preventDefault();
    this.handleSave();
  }

  handleLogout(): void {
    if (this.props.onLogout) this.props.onLogout!();
  }

  handleDeleteClick(): void {
    alert('Удаление пока не реализовано');
  }

  private updateMyAvatarGlobally(): void {
    const myAvatarSelectors = [
      '#avatarImage',
      '.header-avatar-img',
      '.profile-avatar',
      '.user-avatar.current-user',
      `[data-user-id="${this.currentUser?.id || localStorage.getItem('userId')}"] img`,
    ];

    myAvatarSelectors.forEach((selector) => {
      const images = document.querySelectorAll(selector);
      images.forEach((img: Element) => {
        const image = img as HTMLImageElement;
        image.src = this.currentUser.avatar;
        image.style.objectFit = 'cover';
        image.loading = 'eager';
      });
    });

    console.log('Обновлены МОИ аватарки:', myAvatarSelectors);
  }

  async handleSave(): Promise<void> {
    const getValue = (id: string): string => (document.querySelector(`#${id}`) as HTMLInputElement)?.value || '';

    const changes = {
      first_name: getValue('first_name'),
      second_name: getValue('second_name'),
      display_name: getValue('display_name'),
      login: getValue('login'),
      email: getValue('email'),
      phone: getValue('phone'),
    };

    const hasTextChanges = Object.keys(changes).some((key) => changes[key as keyof typeof changes] !== this.currentUser?.[key as keyof typeof this.currentUser]);
    const hasChanges = hasTextChanges || this.pendingAvatarFile !== null;

    if (!hasChanges) {
      alert('Нет изменений для сохранения');
      return;
    }

    this.isUploading = true;

    try {
      console.log('НАЧИНАЕМ СОХРАНЕНИЕ...');

      if (hasTextChanges) {
        console.log('Обновляем профиль:', changes);
        await api.updateProfile(changes);
      }

      if (this.pendingAvatarFile) {
        console.log('Отправляем аватар:', this.pendingAvatarFile.name);
        await api.updateAvatar(this.pendingAvatarFile);
        this.pendingAvatarFile = null;
      }

      const updatedUser = await api.getUser();
      const NEW_AVATAR_URL = updatedUser.avatar
        ? `https://ya-praktikum.tech/api/v2/resources${updatedUser.avatar}?t=${Date.now()}`
        : '/ui/default-avatar.jpg';

      console.log('НОВЫЙ АВАТАР URL:', NEW_AVATAR_URL);

      this.currentUser = { ...updatedUser, avatar: NEW_AVATAR_URL };
      this.updateMyAvatarGlobally();

      this.setProps({ user: this.currentUser });
      this.updateGlobalStore();

      if (this.props.onSave) {
        console.log('Отправляем в ChatsPage:', this.currentUser.avatar);
        this.props.onSave(this.currentUser);
      }

      setTimeout(() => {
        if (this.props.onClose) this.props.onClose!();
      }, 100);
    } catch (error: any) {
      console.error('Ошибка сохранения:', error);
      alert(`❌ ${error.reason || error.message || 'Ошибка сервера'}`);
    } finally {
      this.isUploading = false;
    }
  }

  render(): string {
    const { isOpen = false } = this.props;
    if (!isOpen) return '';

    const avatar = this.currentUser?.avatar || '/ui/default-avatar.jpg';
    const first_name = this.currentUser?.first_name || '';
    const second_name = this.currentUser?.second_name || '';
    const display_name = this.currentUser?.display_name || '';
    const login = this.currentUser?.login || '';
    const email = this.currentUser?.email || '';
    const phone = this.currentUser?.phone || '';

    return `
      <div class="modal-overlay" id="profileModal" style="display: flex">
        <div class="modal-content">
          <button class="modal-close">✕</button>
          <main class="auth-page">
            <div class="auth-card profile-card">
              <h1 class="auth-title">Редактирование профиля</h1>
              
              <div class="avatar-section">
                <div class="avatar-container">
                  <img src="${avatar}" alt="Аватар" class="avatar-image" id="avatarImage">
                  <label for="avatarInput" class="avatar-change-link">Изменить аватар</label>
                  <input type="file" id="avatarInput" class="avatar-input" accept="image/*">
                </div>
              </div>
              
              <form id="profileForm" class="auth-form profile-form">
                <div class="form-row">
                  <div class="form-field">
                    <label class="form-label" for="first_name">Имя</label>
                    <input type="text" id="first_name" name="first_name" class="form-input" 
                          placeholder="Введите имя" value="${first_name}" required>
                  </div>
                  <div class="form-field">
                    <label class="form-label" for="second_name">Фамилия</label>
                    <input type="text" id="second_name" name="second_name" class="form-input" 
                          placeholder="Введите фамилию" value="${second_name}" required>
                  </div>
                </div>
                
                <div class="form-field">
                  <label class="form-label" for="display_name">Отображаемое имя</label>
                  <input type="text" id="display_name" name="display_name" class="form-input" 
                        placeholder="Как вас будут видеть другие" value="${display_name}">
                </div>
                
                <div class="form-field">
                  <label class="form-label" for="login">Логин</label>
                  <input type="text" id="login" name="login" class="form-input" 
                        placeholder="Введите логин" value="${login}" required>
                </div>
                
                <div class="form-field">
                  <label class="form-label" for="email">Почта</label>
                  <input type="email" id="email" name="email" class="form-input" 
                        placeholder="Введите email" value="${email}" required>
                </div>
                
                <div class="form-field">
                  <label class="form-label" for="phone">Телефон</label>
                  <input type="tel" id="phone" name="phone" class="form-input" 
                        placeholder="+7 (999) 123-45-67" value="${phone}">
                </div>
                
                <div class="profile-buttons">
                  <button type="submit" class="auth-button profile-save" ${this.isUploading ? 'disabled' : ''}>
                    ${this.isUploading ? 'Сохраняем...' : 'Сохранить изменения'}
                  </button>
                  <button type="button" class="auth-button" id="logoutButton">Выйти</button>
                  <button type="button" class="auth-button delete-profile-button" id="deleteProfileButton">
                    Удалить профиль
                  </button>
                  <button type="button" class="auth-link" id="backToChats">Вернуться к чатам</button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    `;
  }
}
