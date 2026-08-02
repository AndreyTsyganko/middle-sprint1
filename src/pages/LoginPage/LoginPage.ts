import Block from '../../Core/Block';
import FormField from '../../components/FormField/FormField';
import Button from '../../components/Button/Button';

import { api } from '../../Api/Client';

interface LoginPageProps {
  onLogin?: (data: { login: string; password: string }) => void;
  loginField?: FormField;
  passwordField?: FormField;
  loginButton?: Button;
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
      }),
    });

    this.loginField = loginField;
    this.passwordField = passwordField;
  }

  async handleLogin(): Promise<void> {
    console.log('=== START handleLogin ===');

    const loginInput = this.element?.querySelector('input[name="login"]') as HTMLInputElement;
    const passwordInput = this.element?.querySelector('input[name="password"]') as HTMLInputElement;
    const loginBtn = this.element?.querySelector('#loginBtn') as HTMLButtonElement;

    const login = loginInput?.value?.trim();
    const password = passwordInput?.value?.trim();

    console.log('DOM values:', { login, password: password ? '***' : 'empty' });

    if (!login) {
      this.loginField?.setError('Введите логин');
      return;
    }

    if (!password) {
      this.passwordField?.setError('Введите пароль');
      return;
    }

    try {
      loginBtn.textContent = 'Вход...';
      loginBtn.disabled = true;

      console.log('Calling api.login с логином:', login);
      const result = await api.login(login, password);
      console.log('API login result:', result);

      console.log('Login successful! Cookies set by server. Redirecting to /messenger');

      setTimeout(() => {
        if (window.appRouter) {
          window.appRouter.go('/messenger');
        } else {
          window.location.href = '/messenger';
        }
      }, 100);
    } catch (error: any) {
      console.error('Login error:', error);

      if (error.reason === 'User already in system'
          || error.message?.includes('User already in system')
          || error.responseData?.reason?.includes('User already in system')) {
        console.log('Пользователь уже в системе - перенаправляем в чаты');

        if (window.appRouter) {
          window.appRouter.go('/messenger');
        } else {
          window.location.href = '/messenger';
        }

        return;
      }

      this.passwordField?.setError(error.message || 'Ошибка входа');
    } finally {
      loginBtn.textContent = 'Войти';
      loginBtn.disabled = false;
    }
  }

  handleRegisterClick(): void {
    if (window.appRouter) {
      window.appRouter.go('/sign-up');
    }
  }

  render(): string {
    const props = this.props as unknown as LoginPageProps;
    const { loginField } = props;
    const { passwordField } = props;

    return `
    <main class="auth-page">
      <div class="auth-card">
        <h1 class="auth-title">Вход</h1>

        <div class="auth-form">
          ${loginField?.render() || ''}
          ${passwordField?.render() || ''}
          <button class="auth-button" type="button" id="loginBtn">Войти</button>
        </div>
        <a href="/sign-up" class="auth-link" id="registerLink">Нет аккаунта?</a>
      </div>
    </main>
    `;
  }

  async componentDidMount(): Promise<void> {
    try {
      const user = await api.getUser();
      if (user?.id) {
        console.log('Активная сессия на сервере - редирект в чаты');

        localStorage.setItem('authToken', 'authenticated');
        localStorage.setItem('userId', user.id.toString());
        localStorage.setItem('userLogin', user.login);

        if (window.appRouter) {
          window.appRouter.go('/messenger');
        } else {
          window.location.href = '/messenger';
        }
        return;
      }
    } catch (error) {
      console.log('Нет активной сессии на сервере');
    }

    const loginBtn = this.element?.querySelector('#loginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('*** КНОПКА НАЖАТА ***');
        this.handleLogin();
      });
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
