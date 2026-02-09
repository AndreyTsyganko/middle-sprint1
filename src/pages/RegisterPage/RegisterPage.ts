import Block from '../../Core/Block';
import FormField from '../../components/FormField/FormField';
import { api } from '../../Api/Client';

interface RegisterPageProps {
  onRegister?: (data: any) => void;
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
      placeholder: '+7 (999) 123-45-67',
      required: false,
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
    
    const formData = {
      first_name: getFieldValue('first_name'),
      second_name: getFieldValue('second_name'),
      login: getFieldValue('login'),
      email: getFieldValue('email'),
      password: getFieldValue('password'),
      password_confirm: getFieldValue('password_confirm'),
      phone: getFieldValue('phone'),
    };
    
    console.log('Данные формы:', { ...formData, password: '***', password_confirm: '***' });
    
    if (!formData.first_name || !formData.second_name || !formData.login || 
        !formData.email || !formData.password || !formData.password_confirm) {
      alert('Заполните все обязательные поля');
      return;
    }
    
    if (formData.password !== formData.password_confirm) {
      alert('Пароли не совпадают');
      return;
    }
    
    try {
      console.log('Отправка данных на сервер...');
      
      const button = this.element?.querySelector('#registerButton') as HTMLButtonElement;
      if (button) {
        button.textContent = 'Регистрация...';
        button.disabled = true;
      }
      
      const response = await api.register({
        first_name: formData.first_name,
        second_name: formData.second_name,
        login: formData.login,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });
      
      console.log('Регистрация успешна:', response);
      

      const loginResponse = await api.login(formData.login, formData.password);
      console.log('Вход успешен:', loginResponse);
      
      if (window.appRouter) {
        window.appRouter.go('/messenger');
      } else {
        window.location.href = '/messenger';
      }
      
    } catch (error: any) {
      console.error('Ошибка:', error);
      alert(error.message || 'Ошибка регистрации');
      
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
