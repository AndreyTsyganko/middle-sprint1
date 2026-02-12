import Block from '../Core/Block';

class Router {
  private static __instance: Router;

  private routes: Record<string, typeof Block> = {};

  private currentPage: Block | null = null;

  private history = window.history;

  constructor() {
    if (Router.__instance) {
      return Router.__instance;
    }

    Router.__instance = this;
  }

  static getInstance(): Router {
    if (!Router.__instance) {
      Router.__instance = new Router();
    }
    return Router.__instance;
  }

  use(path: string, component: typeof Block): Router {
    this.routes[path] = component;
    return this;
  }

  start(): void {
    window.onpopstate = () => {
      this._onRoute(window.location.pathname);
    };

    this._onRoute(window.location.pathname);
  }

  go(path: string): void {
    this.history.pushState({}, '', path);
    this._onRoute(path);
  }

  back(): void {
    this.history.back();
  }

  forward(): void {
    this.history.forward();
  }

  private _onRoute(path: string): void {
    const route = Object.keys(this.routes).find((key) => path.match(new RegExp(`^${key}$`)));

    if (!route) {
      this.go('/404');
      return;
    }

    const Component = this.routes[route];

    let pageProps: any = {};

    if (route === '/login' || route === '/') {
      pageProps = {
        onLogin: () => console.log('Login'),
        onRegister: () => this.go('/register'),
      };
    } else if (route === '/register') {
      pageProps = {
        onRegister: () => console.log('Register'),
        onLogin: () => this.go('/login'),
      };
    } else if (route === '/profile') {
      pageProps = {
        user: {
          first_name: '',
          second_name: '',
          display_name: '',
          login: '',
          email: '',
          phone: '',
          avatar: '',
        },
        onSave: () => console.log('Save'),
        onBack: () => this.go('/chats'),
      };
    } else if (route === '/chats') {
      pageProps = {
        chats: [],
        messages: [],
        onSendMessage: () => console.log('Send'),
        onProfileClick: () => this.go('/profile'),
        onChatSelect: () => console.log('Select chat'),
      };
    }

    const page = new Component(pageProps);

    if (this.currentPage) {
      this.currentPage.hide();
    }

    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = '';
      const content = page.getContent();
      if (content) {
        app.appendChild(content);
        page.dispatchComponentDidMount();
      }
    }

    this.currentPage = page;
  }
}

export default Router;
