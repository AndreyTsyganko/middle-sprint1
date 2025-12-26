import Block from '../../Core/Block';
import FormField from '../../components/FormField/FormField';
import Button from '../../components/Button/Button';

interface RegisterPageProps {
  onRegister?: (data: any) => void;
}

export default class RegisterPage extends Block {
  private fields: Record<string, FormField>;

  constructor(props: RegisterPageProps) {
    const emailField = new FormField({
      label: 'Почта',
      name: 'email',
      type: 'email',
      placeholder: 'Введите email',
      required: true,
    });

    const loginField = new FormField({
      label: 'Логин',
      name: 'login',
      placeholder: 'Введите логин',
      required: true,
    });

    const firstNameField = new FormField({
      label: 'Имя',
      name: 'first_name',
      placeholder: 'Введите имя',
      required: true,
    });

    const secondNameField = new FormField({
      label: 'Фамилия',
      name: 'second_name',
      placeholder: 'Введите фамилию',
      required: true,
    });

    const phoneField = new FormField({
      label: 'Телефон',
      name: 'phone',
      placeholder: '+7 (XXX) XXX-XX-XX',
      required: true,
    });

    const passwordField = new FormField({
      label: 'Пароль',
      name: 'password',
      type: 'password',
      placeholder: 'Введите пароль',
      required: true,
    });

    const passwordConfirmField = new FormField({
      label: 'Повторите пароль',
      name: 'password_confirm',
      type: 'password',
      placeholder: 'Повторите пароль',
      required: true,
    });

    const fields = {
      email: emailField,
      login: loginField,
      firstName: firstNameField,
      secondName: secondNameField,
      phone: phoneField,
      password: passwordField,
      passwordConfirm: passwordConfirmField,
    };

    super('div', {
      ...props,
      emailField,
      loginField,
      firstNameField,
      secondNameField,
      phoneField,
      passwordField,
      passwordConfirmField,
      registerButton: new Button({
        text: 'Зарегистрироваться',
        type: 'submit',
        className: 'auth-button',
        onClick: () => this.handleRegister(),
      }),
    });

    this.fields = fields;
  }

  handleRegister(): void {
    if (!this.fields) {
      console.error('Fields not initialized');
      return;
    }

    const data: Record<string, string> = {};
    let isValid = true;

    Object.entries(this.fields).forEach(([key, field]) => {
      const value = field.getValue();
      data[key] = value;

      if (!value || value.trim() === '') {
        field.setError('Это поле обязательно');
        isValid = false;
      }
    });

    if (data.password !== data.passwordConfirm) {
      this.fields.passwordConfirm.setError('Пароли не совпадают');
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.email && !emailRegex.test(data.email)) {
      this.fields.email.setError('Не корректный email');
      isValid = false;
    }

    if (data.password && data.password.length < 8) {
      this.fields.password.setError('Пароль должен быть не менее 8 символов');
      isValid = false;
    }

    if (isValid && this.props.onRegister) {
      this.props.onRegister(data);
    }
  }

  render(): string {
    const { fields } = this;

    if (!fields) {
      return `
        <main class="auth-page">
          <div class="auth-card">
            <h1 class="auth-title">Регистрация</h1>
            <form class="auth-form">
              ${this.props.emailField?.render() || ''}
              ${this.props.loginField?.render() || ''}
              ${this.props.firstNameField?.render() || ''}
              ${this.props.secondNameField?.render() || ''}
              ${this.props.phoneField?.render() || ''}
              ${this.props.passwordField?.render() || ''}
              ${this.props.passwordConfirmField?.render() || ''}
              ${this.props.registerButton?.render() || ''}
            </form>
            <a href="/login" class="auth-link">Войти</a>
          </div>
        </main>
      `;
    }

    return `
      <main class="auth-page">
        <div class="auth-card">
          <h1 class="auth-title">Регистрация</h1>
          <form class="auth-form">
            ${fields.email.render()}
            ${fields.login.render()}
            ${fields.firstName.render()}
            ${fields.secondName.render()}
            ${fields.phone.render()}
            ${fields.password.render()}
            ${fields.passwordConfirm.render()}
            ${this.props.registerButton?.render() || ''}
          </form>
          <a href="/login" class="auth-link">Войти</a>
        </div>
      </main>
    `;
  }
}
