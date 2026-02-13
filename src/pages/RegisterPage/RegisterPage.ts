import Block from '../../Core/Block';
import FormField from '../../components/FormField/FormField';
import { api } from '../../Api/Client';

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
  constructor(props: RegisterPageProps = {}) {

    const emailField = new FormField({
      label: 'Почта',
      name: 'email',
      type: 'email',
      placeholder: 'test@mail.ru',
      required: true,
    });

    const loginField = new FormField({
      label: 'Логин',
      name: 'login',
      placeholder: 'testuser',
      required: true,
    });

    const firstNameField = new FormField({
      label: 'Имя',
      name: 'first_name',
      placeholder: 'Иван',
      required: true,
    });

    const secondNameField = new FormField({
      label: 'Фамилия',
      name: 'second_name',
      placeholder: 'Иванов',
      required: true,
    });

    const phoneField = new FormField({
      label: 'Телефон',
      name: 'phone',
      placeholder: '+79999999999',
      required: true,
    });

    const passwordField = new FormField({
      label: 'Пароль',
      name: 'password',
      type: 'password',
      placeholder: 'Password123',
      required: true,
    });

    const passwordConfirmField = new FormField({
      label: 'Повторите пароль',
      name: 'password_confirm',
      type: 'password',
      placeholder: 'Password123',
      required: true,
    });

    super('div', {
      ...props,
      emailField,
      loginField,
      firstNameField,
      secondNameField,
      phoneField,
      passwordField,
      passwordConfirmField,
    });
  }

  render(): string {
    return `
      <main class="auth-page">
        <div class="auth-card">
          <h1 class="auth-title">Регистрация</h1>
          
          <form class="auth-form" id="registerForm">
            <div class="form-row">
              ${this.props.firstNameField.render()}
              ${this.props.secondNameField.render()}
            </div>
            
            ${this.props.loginField.render()}
            ${this.props.emailField.render()}
            ${this.props.phoneField.render()}
            
            <div class="form-row">
              ${this.props.passwordField.render()}
              ${this.props.passwordConfirmField.render()}
            </div>
            
            <button type="button" class="auth-button" id="registerButton">
              Зарегистрироваться
            </button>
          </form>
          
          <a href="#" class="auth-link" id="loginLink">
            Уже есть аккаунт? Войти
          </a>
        </div>
      </main>
    `;
  }


  componentDidMount(): void {
    console.log('RegisterPage mounted');
    
    const registerButton = this.element?.querySelector('#registerButton');
    if (registerButton) {
      registerButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleRegister();
      });
    }
    
    const loginLink = this.element?.querySelector('#loginLink');
    if (loginLink) {
      loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleLoginClick();
      });
    }
  }

async handleRegister(): Promise<void> {
  console.log('Кнопка регистрации нажата!');
  
  const getFieldValue = (name: string): string => {
    const input = this.element?.querySelector(`[name="${name}"]`) as HTMLInputElement;
    return input?.value || '';
  };
  
  const firstName = getFieldValue('first_name');
  const secondName = getFieldValue('second_name');
  const login = getFieldValue('login');
  const email = getFieldValue('email');
  const password = getFieldValue('password');
  const passwordConfirm = getFieldValue('password_confirm');
  const phone = getFieldValue('phone');
  
  console.log('Данные формы:', { 
    firstName, 
    secondName, 
    login, 
    email, 
    password: password ? '***' : 'empty',
    phone 
  });
  
  const requiredFields = [
    { name: 'first_name', value: firstName, label: 'Имя' },
    { name: 'second_name', value: secondName, label: 'Фамилия' },
    { name: 'login', value: login, label: 'Логин' },
    { name: 'email', value: email, label: 'Почта' },
    { name: 'password', value: password, label: 'Пароль' },
    { name: 'phone', value: phone, label: 'Телефон' },
  ];
  
  const missingFields = requiredFields
    .filter(field => !field.value?.trim())
    .map(field => field.label);
  
  if (missingFields.length > 0) {
    alert(`Заполните обязательные поля: ${missingFields.join(', ')}`);
    return;
  }
  
  if (password !== passwordConfirm) {
    alert('Пароли не совпадают');
    return;
  }
  
  if (password.length < 6) {
    alert('Пароль должен быть не менее 6 символов');
    return;
  }
  
  try {
    console.log('Отправка данных на сервер...');
    
    const button = this.element?.querySelector('#registerButton') as HTMLButtonElement;
    if (button) {
      button.textContent = 'Регистрация...';
      button.disabled = true;
    }
    
    const dataToSend = {
      first_name: firstName.trim(),
      second_name: secondName.trim(),
      login: login.trim(),
      email: email.trim(),
      password: password,
      phone: phone.trim(),
    };
    
    console.log('Данные для API:', { ...dataToSend, password: '***' });
    
    const response = await api.register(dataToSend);
    
    console.log('Регистрация успешна:', response);
    
    
    if (window.appRouter) {
      window.appRouter.go('/');
    } else {
      window.location.href = '/';
    }
    
  } catch (error: any) {
    console.error('Ошибка регистрации:', error);
    
    let errorMessage = 'Ошибка регистрации';
    if (error.message && error.message.includes('400')) {
      errorMessage = 'Некорректные данные. Проверьте:\n' +
        '- Email должен быть валидным\n' +
        '- Логин должен быть от 3 символов\n' +
        '- Имя и фамилия должны содержать только буквы\n' +
        '- Телефон должен быть в формате +79999999999\n' +
        '- Пароль должен быть не менее 6 символов';
    } else if (error.message && error.message.includes('409')) {
      errorMessage = 'Пользователь с таким логином или email уже существует';
    } else if (error.message === 'Wrong json format') {
      errorMessage = 'Ошибка формата данных. Проверьте введенные значения.';
    } else if (error.message === 'Not found') {
      errorMessage = 'Endpoint не найден. Проверьте URL API.';
    } else {
      errorMessage = error.message || 'Ошибка регистрации';
    }
    
    alert(errorMessage);
    
    const button = this.element?.querySelector('#registerButton') as HTMLButtonElement;
    if (button) {
      button.textContent = 'Зарегистрироваться';
      button.disabled = false;
    }
  }
}

  handleLoginClick(): void {
    console.log('Переход на страницу входа');
    if (window.appRouter) {
      window.appRouter.go('/');
    } else {
      window.location.href = '/';
    }

  }
}
