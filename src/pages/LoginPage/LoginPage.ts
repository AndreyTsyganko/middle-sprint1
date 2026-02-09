import Block from '../../Core/Block';
import FormField from '../../components/FormField/FormField';
import Button from '../../components/Button/Button';
import { api } from '../../Api/Client';

interface LoginPageProps {
  onLogin?: (data: { login: string; password: string }) => void;
}

export default class LoginPage extends Block {
  private loginField: FormField;
  private passwordField: FormField;

  constructor(props: LoginPageProps = {}) {
    const loginField = new FormField({
      label: 'Логин',
      name: 'login',
      placeholder: 'Введите логин',
      required: true,
    });

    const passwordField = new FormField({
      label: 'Пароль',
      name: 'password',
      type: 'password',
      placeholder: 'Введите пароль',
      required: true,
    });

    super('div', {
      ...props,
      loginField,
      passwordField,
      loginButton: new Button({
        text: 'Войти',
        type: 'button',
        className: 'auth-button',
        onClick: (event: Event) => {
          event.preventDefault();
          this.handleLogin();
        },
      }),
    });

    this.loginField = loginField;
    this.passwordField = passwordField;
  }

  async handleLogin(): Promise<void> {
    console.log('=== START handleLogin ===');
    
    const login = this.loginField.getValue();
    const password = this.passwordField.getValue();

    console.log('Inputs:', { login, password: password ? '***' : 'empty' });


    if (!login.trim()) {
      this.loginField.setError('Введите логин');
      return;
    }

    if (!password.trim()) {
      this.passwordField.setError('Введите пароль');
      return;
    }

    try {
      this.props.loginButton.setProps({ text: 'Вход...', disabled: true });
      
      console.log('Calling api.login...');
      
      const result = await api.login(login, password);
      console.log('API login result:', result);
      
      const savedToken = localStorage.getItem('authToken');
      console.log('Token in localStorage:', savedToken ? 'YES' : 'NO');
      
      if (!savedToken) {
        throw new Error('Токен не был сохранен');
      }
      
      console.log(' Login successful! Redirecting to /messenger');
      
      if (window.appRouter) {
        console.log('Using router...');
        window.appRouter.go('/messenger');
      } 
      else {
        console.log('Using direct redirect...');
        window.location.href = '/messenger';
      }
      
      setTimeout(() => {
        if (window.location.pathname !== '/messenger') {
          console.log('Fallback redirect...');
          window.location.href = '/messenger';
        }
      }, 300);
      
    } catch (error: any) {
      console.error('Login error:', error);
      this.passwordField.setError(error.message || 'Ошибка входа');
    } finally {
      this.props.loginButton.setProps({ text: 'Войти', disabled: false });
    }
  }

  handleRegisterClick(): void {
    if (window.appRouter) {
      window.appRouter.go('/sign-up');
    }
  }

  render(): string {
    return `
    <main class="auth-page">
      <div class="auth-card">
        <h1 class="auth-title">Вход</h1>
        <div class="auth-form"> <!-- Важно: div вместо form! -->
          ${this.props.loginField.render()}
          ${this.props.passwordField.render()}
          ${this.props.loginButton.render()}
        </div>
        <a href="/sign-up" class="auth-link" id="registerLink">Нет аккаунта?</a>
      </div>
    </main>
  `;
  }

  componentDidMount(): void {
    if (api.isAuthenticated()) {
      console.log('Already authenticated, redirecting to /messenger');
      if (window.appRouter) {
        window.appRouter.go('/messenger');
      }
    }
    
    const registerLink = this.element?.querySelector('#registerLink');
    if (registerLink) {
      registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleRegisterClick();
      });
    }
  }
}
