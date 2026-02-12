import Block from '../../Core/Block';
import FormField from '../../components/FormField/FormField';
import Button from '../../components/Button/Button';

interface RegisterFormData {
  email: string;
  login: string;
  firstName: string;
  secondName: string;
  phone: string;
  password: string;
  passwordConfirm: string;
}

interface RegisterPageProps {
  onRegister?: (data: RegisterFormData) => void;
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

  const data: RegisterFormData = {
    email: this.fields.email.getValue(),
    login: this.fields.login.getValue(),
    firstName: this.fields.firstName.getValue(),
    secondName: this.fields.secondName.getValue(),
    phone: this.fields.phone.getValue(),
    password: this.fields.password.getValue(),
    passwordConfirm: this.fields.passwordConfirm.getValue(),
  };

  let isValid = true;

  Object.values(this.fields).forEach((field) => {
    const value = field.getValue();

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

  if (isValid) {
    const onRegister = (this.props as any).onRegister as 
      ((data: RegisterFormData) => void) | undefined;
    
    if (onRegister) {
      onRegister(data);
    }
  }
}

  render(): string {
    const { fields } = this;

    const emailField = this.props.emailField as FormField;
    const loginField = this.props.loginField as FormField;
    const firstNameField = this.props.firstNameField as FormField;
    const secondNameField = this.props.secondNameField as FormField;
    const phoneField = this.props.phoneField as FormField;
    const passwordField = this.props.passwordField as FormField;
    const passwordConfirmField = this.props.passwordConfirmField as FormField;
    const registerButton = this.props.registerButton as Button;

    if (!fields) {
      return `
        <main class="auth-page">
          <div class="auth-card">
            <h1 class="auth-title">Регистрация</h1>
            <form class="auth-form">
              ${emailField?.render() || ''}
              ${loginField?.render() || ''}
              ${firstNameField?.render() || ''}
              ${secondNameField?.render() || ''}
              ${phoneField?.render() || ''}
              ${passwordField?.render() || ''}
              ${passwordConfirmField?.render() || ''}
              ${registerButton?.render() || ''}
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
            ${registerButton?.render() || ''}
          </form>
          <a href="/login" class="auth-link">Войти</a>
        </div>
      </main>
    `;
  }
}
