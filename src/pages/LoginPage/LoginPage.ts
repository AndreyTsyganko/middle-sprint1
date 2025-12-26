import Block from '../../Core/Block';
import FormField from '../../components/FormField/FormField';
import Button from '../../components/Button/Button';

interface LoginPageProps {
  onLogin?: (data: { login: string; password: string }) => void;
  onRegister?: () => void;
}

export default class LoginPage extends Block {
  private loginField: FormField;

  private passwordField: FormField;

  constructor(props: LoginPageProps) {
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
        type: 'submit',
        className: 'auth-button',
        onClick: () => this.handleLogin(),
      }),
      registerButton: new Button({
        text: 'Нет аккаунта?',
        className: 'auth-link',
        onClick: props.onRegister,
      }),
    });

    this.loginField = loginField;
    this.passwordField = passwordField;
  }

  handleLogin(): void {
    const login = this.loginField.getValue();
    const password = this.passwordField.getValue();

    let isValid = true;

    if (!login) {
      this.loginField.setError('Введите логин');
      isValid = false;
    }

    if (!password) {
      this.passwordField.setError('Введите пароль');
      isValid = false;
    } else if (password.length < 8) {
      this.passwordField.setError('Пароль должен быть не менее 8 символов');
      isValid = false;
    }

    if (isValid && this.props.onLogin) {
      this.props.onLogin({ login, password });
    }
  }

  render(): string {
    return `
    <main class="auth-page">
      <div class="auth-card">
        <h1 class="auth-title">Вход</h1>
        <form class="auth-form">
          ${this.props.loginField.render()}
          ${this.props.passwordField.render()}
          ${this.props.loginButton.render()}
        </form>
        <a href="/register" class="auth-link">Нет аккаунта?</a>
      </div>
    </main>
  `;
  }
}
