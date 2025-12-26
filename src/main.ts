import './styles/main.scss';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import ChatsPage from './pages/ChatsPage/ChatsPage';

class SimpleApp {
  private currentPage: any = null;

  constructor() {
    this.handleInitialRoute();

    this.setupLinkNavigation();

    window.addEventListener('popstate', () => {
      const path = window.location.pathname;
      this.showPageByPath(path);
    });
  }

  private handleInitialRoute(): void {
    const path = window.location.pathname;
    console.log('Initial path:', path);

    this.showPageByPath(path);
  }

  private showPageByPath(path: string): void {
    switch (path) {
      case '/':
      case '/login':
        this.showLoginPage();
        break;
      case '/register':
        this.showRegisterPage();
        break;
      case '/profile':
        this.showProfilePage();
        break;
      case '/chats':
        this.showChatsPage();
        break;
      default:
        console.warn(`Unknown path: ${path}, redirecting to login`);
        window.history.replaceState({}, '', '/login');
        this.showLoginPage();
        break;
    }
  }

  private showLoginPage(): void {
    const page = new LoginPage({
      onLogin: (data: any) => {
        console.log('Login:', data);
        window.history.pushState({}, '', '/chats');
        this.showChatsPage();
      },
      onRegister: () => {
        window.history.pushState({}, '', '/register');
        this.showRegisterPage();
      },
    });

    this.renderPage(page);
  }

  private showRegisterPage(): void {
    const page = new RegisterPage({
      onRegister: (data: any) => {
        console.log('Register:', data);
        window.history.pushState({}, '', '/chats');
        this.showChatsPage();
      },
    });

    this.renderPage(page);
  }

  private showProfilePage(): void {
    const page = new ProfilePage({
      user: {
        first_name: 'Иван',
        second_name: 'Иванович',
        display_name: 'Ваня',
        login: 'ivanov',
        email: 'ivan@mail.ru',
        phone: '+7 (999) 123-45-67',
        avatar: '/ui/BMW 1.jpg',
      },
      onSave: (data: any) => {
        console.log('Save profile:', data);
        alert('Профиль сохранен!');
      },
      onAvatarChange: (file: File) => {
        console.log('Avatar change:', file.name);
        alert(`Аватар изменен: ${file.name}`);
      },
      onBack: () => {
        window.history.pushState({}, '', '/chats');
        this.showChatsPage();
      },
    });

    this.renderPage(page);
  }

  private showChatsPage(): void {
    const page = new ChatsPage({
      chats: [
        {
          id: 1,
          title: 'Дарья',
          avatar: '/ui/BMW 1.jpg',
          lastMessage: 'Привет! Как дела?',
          time: '10:49',
          unreadCount: 2,
        },
        {
          id: 2,
          title: 'Киноклуб',
          avatar: '/ui/BMW 1.jpg',
          lastMessage: 'Смотрим сегодня в 20:00',
          time: '12:00',
          unreadCount: 5,
        },
        {
          id: 3,
          title: 'Илья',
          avatar: '/ui/BMW 1.jpg',
          lastMessage: 'Дедлайн через 2 дня',
          time: '15:30',
          unreadCount: 0,
        },
        {
          id: 4,
          title: 'Вадим',
          avatar: '/ui/BMW 1.jpg',
          lastMessage: 'Круто!',
          time: 'Пт',
          unreadCount: 0,
        },
        {
          id: 5,
          title: 'Вика',
          avatar: '/ui/BMW 1.jpg',
          lastMessage: 'Привет)',
          time: 'Пн',
          unreadCount: 0,
        },
        {
          id: 6,
          title: 'Новости',
          avatar: '/ui/BMW 1.jpg',
          lastMessage: 'Ученые открыли новый вид пауков...',
          time: 'Пн',
          unreadCount: 4,
        },
        {
          id: 7,
          title: 'Никита',
          avatar: '/ui/BMW 1.jpg',
          lastMessage: 'Привет, завтра у нас выходной!',
          time: 'Пн',
          unreadCount: 0,
        },
        {
          id: 8,
          title: 'Света',
          avatar: '/ui/BMW 1.jpg',
          lastMessage: 'Гуляю с собакой)',
          time: 'Ср',
          unreadCount: 0,
        },
      ],
      messages: [
        {
          id: 1, content: 'Привет! Как у тебя дела?', time: '10:49', isMine: false,
        },
        {
          id: 2, content: 'Всё отлично, а у тебя?)', time: '10:50', isMine: true,
        },
        {
          id: 3, content: 'У меня прекрасно) Завтра встретимся?', time: '10:51', isMine: false,
        },
        {
          id: 4, content: 'Да, в 18:00 у кафе', time: '10:52', isMine: true,
        },
        {
          id: 5, content: 'Отлично)', time: '11:00', isMine: false,
        },
        {
          id: 6, content: 'Приедешь на такси?', time: '11:01', isMine: true,
        },
        {
          id: 7, content: 'Да)', time: '12:30', isMine: false,
        },
        {
          id: 8, content: 'Ок, тогда я тоже на такси!)', time: '12:31', isMine: true,
        },
      ],
      onSendMessage: (message: string) => {
        console.log('Send message:', message);
      },
      onProfileClick: () => {
        window.history.pushState({}, '', '/profile');
        this.showProfilePage();
      },
      onChatSelect: (chatId: number) => {
        console.log('Select chat:', chatId);
      },
    });

    this.renderPage(page);
  }

  private renderPage(page: any): void {
    if (this.currentPage) {
      this.currentPage.hide();
    }

    this.currentPage = page;

    const app = document.getElementById('app');
    if (app && page.getContent()) {
      app.innerHTML = '';
      app.appendChild(page.getContent()!);
      page.dispatchComponentDidMount();
    }
  }

  private setupLinkNavigation(): void {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href) {
        const url = new URL(link.href);

        if (url.origin !== window.location.origin) {
          return;
        }

        e.preventDefault();

        const path = url.pathname;

        window.history.pushState({}, '', path);

        this.showPageByPath(path);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing app...');
  try {
    new SimpleApp();
    console.log('App initialized successfully');
  } catch (error) {
    console.error('Error initializing app:', error);
  }
});
