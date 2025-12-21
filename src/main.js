
import Handlebars from 'handlebars';
import './styles/main.scss';

const routes = {
  login: async () => {
    const template = await import('./templates/login.hbs?raw');
    const compiled = Handlebars.compile(template.default);
    document.getElementById('app').innerHTML = compiled();
    setupLoginPage();
  },
  
  register: async () => {
    const template = await import('./templates/register.hbs?raw');
    const compiled = Handlebars.compile(template.default);
    document.getElementById('app').innerHTML = compiled();
    setupRegisterPage();
  },
  
  notFound: async () => {
    const template = await import('./templates/404.hbs?raw');
    const compiled = Handlebars.compile(template.default);
    document.getElementById('app').innerHTML = compiled();
    setupNotFoundPage();
  },
  
  serverError: async () => {
    const template = await import('./templates/500.hbs?raw');
    const compiled = Handlebars.compile(template.default);
    document.getElementById('app').innerHTML = compiled();
    setupServerErrorPage();
  },
  
  profileEdit: async () => {
    const template = await import('./templates/profile-edit.hbs?raw');
    const compiled = Handlebars.compile(template.default);
    document.getElementById('app').innerHTML = compiled();
    setupProfilePage();
  }
};

const router = {
  '#login': () => routes.login(),
  '#register': () => routes.register(),
  '#profile': () => routes.profileEdit(),
  '#404': () => routes.notFound(),
  '#500': () => routes.serverError(),
  

  default: () => routes.login()
};

function getCurrentRoute() {
  const hash = window.location.hash;
  return router[hash] || router.default;
}

function navigateTo(hash) {
  window.location.hash = hash;
}

window.addEventListener('hashchange', () => {
  const routeHandler = getCurrentRoute();
  routeHandler();
});

function validateLogin() {
  const login = document.getElementById('login')?.value.trim();
  const password = document.getElementById('password')?.value;
  let isValid = true;

  document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));

  if (!login) {
    showError('login', 'Введите логин');
    isValid = false;
  }

  if (!password) {
    showError('password', 'Введите пароль');
    isValid = false;
  } else if (password.length < 6) {
    showError('password', 'Пароль должен быть не менее 6 символов');
    isValid = false;
  }

  return isValid;
}

function validateRegister() {
  const fields = {
    first_name: document.getElementById('first_name')?.value.trim(),
    second_name: document.getElementById('second_name')?.value.trim(),
    login: document.getElementById('login')?.value.trim(),
    email: document.getElementById('email')?.value.trim(),
    password: document.getElementById('password')?.value,
    phone: document.getElementById('phone')?.value.trim(),
    password_confirm: document.getElementById('password_confirm')?.value
  };

  let isValid = true;

  document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));

  if (!fields.first_name) {
    showError('first_name', 'Введите имя');
    isValid = false;
  }

  if (!fields.second_name) {
    showError('second_name', 'Введите фамилию');
    isValid = false;
  }

  if (!fields.login) {
    showError('login', 'Введите логин');
    isValid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!fields.email) {
    showError('email', 'Введите email');
    isValid = false;
  } else if (!emailRegex.test(fields.email)) {
    showError('email', 'Не корректный email');
    isValid = false;
  }

  if (!fields.password) {
    showError('password', 'Введите пароль');
    isValid = false;
  } else if (fields.password.length < 6) {
    showError('password', 'Пароль должен быть не менее 6 символов');
    isValid = false;
  }

  if (!fields.password_confirm) {
    showError('password_confirm', 'Подтвердите пароль');
    isValid = false;
  } else if (fields.password_confirm !== fields.password) {
    showError('password_confirm', 'Пароли не совпадают');
    isValid = false;
  }

  const phoneRegex = /^\+?[0-9\s\-\(\)]+$/;
  if (!fields.phone) {
    showError('phone', 'Введите номер телефона');
    isValid = false;
  } else if (!phoneRegex.test(fields.phone)) {
    showError('phone', 'Не корректный номер телефона');
    isValid = false;
  }

  return isValid;
}

function validateProfile() {
  const fields = {
    first_name: document.getElementById('first_name')?.value.trim(),
    second_name: document.getElementById('second_name')?.value.trim(),
    display_name: document.getElementById('display_name')?.value.trim(),
    login: document.getElementById('login')?.value.trim(),
    email: document.getElementById('email')?.value.trim(),
    phone: document.getElementById('phone')?.value.trim(),
    oldPassword: document.getElementById('oldPassword')?.value,
    newPassword: document.getElementById('newPassword')?.value
  };

  let isValid = true;

  document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));

  if (!fields.email) {
    showError('email', 'Введите email');
    isValid = false;
  }

  if (!fields.login) {
    showError('login', 'Введите логин');
    isValid = false;
  }

  if (!fields.first_name) {
    showError('first_name', 'Введите имя');
    isValid = false;
  }

  if (!fields.second_name) {
    showError('second_name', 'Введите фамилию');
    isValid = false;
  }

  if (!fields.display_name) {
    showError('display_name', 'Введите имя в чате');
    isValid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (fields.email && !emailRegex.test(fields.email)) {
    showError('email', 'Не корректный email');
    isValid = false;
  }

  const phoneRegex = /^\+?[0-9\s\-\(\)]+$/;
  if (!fields.phone) {
    showError('phone', 'Введите номер телефона');
    isValid = false;
  } else if (!phoneRegex.test(fields.phone)) {
    showError('phone', 'Не корректный номер телефона');
    isValid = false;
  }

  if (fields.oldPassword || fields.newPassword) {
    if (!fields.oldPassword) {
      showError('oldPassword', 'Введите старый пароль');
      isValid = false;
    }
    if (!fields.newPassword) {
      showError('newPassword', 'Введите новый пароль');
      isValid = false;
    } else if (fields.newPassword.length < 6) {
      showError('newPassword', 'Новый пароль должен быть не менее 6 символов');
      isValid = false;
    }
  }

  return isValid;
}

function submitRegistration() {
  const data = {
    first_name: document.getElementById('first_name')?.value.trim(),
    second_name: document.getElementById('second_name')?.value.trim(),
    login: document.getElementById('login')?.value.trim(),
    email: document.getElementById('email')?.value.trim(),
    password: document.getElementById('password')?.value,
    phone: document.getElementById('phone')?.value.trim()
  };
  
  console.log('Данные регистрации:', data);
  return data;
}

function submitProfile() {
  const data = {
    first_name: document.getElementById('first_name')?.value.trim(),
    second_name: document.getElementById('second_name')?.value.trim(),
    display_name: document.getElementById('display_name')?.value.trim(),
    login: document.getElementById('login')?.value.trim(),
    email: document.getElementById('email')?.value.trim(),
    phone: document.getElementById('phone')?.value.trim()
  };

  const oldPassword = document.getElementById('oldPassword')?.value;
  const newPassword = document.getElementById('newPassword')?.value;
  
  if (oldPassword && newPassword) {
    data.oldPassword = oldPassword;
    data.newPassword = newPassword;
  }

  const avatarInput = document.getElementById('avatar');
  if (avatarInput && avatarInput.files.length > 0) {
    data.avatar = avatarInput.files[0];
  }

  console.log('Данные профиля:', data);
  return data;
}

function showError(fieldId, message) {
  const errorElement = document.getElementById(`${fieldId}Error`);
  const inputElement = document.getElementById(fieldId);
  
  if (errorElement) errorElement.textContent = message;
  if (inputElement) inputElement.classList.add('error');
}

function setupLoginPage() {
  const form = document.getElementById('loginForm');
  const goToRegister = document.getElementById('goToRegister');
  const goToProfile = document.getElementById('goToProfile');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (validateLogin()) {
        console.log('Вход успешен');
        navigateTo('#profile');
      }
    });
  }

  if (goToRegister) {
    goToRegister.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('#register');
    });
  }

  if (goToProfile) {
    goToProfile.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('#profile');
    });
  }
}

function setupRegisterPage() {
  const form = document.getElementById('registerForm');
  const goToLogin = document.getElementById('goToLogin');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (validateRegister()) {
        const userData = submitRegistration();
        console.log('Регистрация прошла успешно:', userData);
        navigateTo('#login');
      }
    });
  }

  if (goToLogin) {
    goToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('#login');
    });
  }
}

function setupNotFoundPage() {
  const goHome = document.getElementById('goToHome');
  if (goHome) {
    goHome.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('#login');
    });
  }
}

function setupServerErrorPage() {
  const goHome = document.getElementById('goToHome500');
  if (goHome) {
    goHome.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('#login');
    });
  }
}

function setupProfilePage() {
  const form = document.getElementById('profileForm');
  const goToChats = document.getElementById('goToChats');
  const avatarInput = document.getElementById('avatar');
  const avatarChangeLink = document.querySelector('.avatar-change-link');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (validateProfile()) {
        const profileData = submitProfile();
        console.log('Профиль сохранен:', profileData);
        alert('Профиль успешно сохранен!');
      }
    });
  }

  if (goToChats) {
    goToChats.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('#login');
    });
  }

  if (avatarChangeLink && avatarInput) {
    avatarChangeLink.addEventListener('click', () => {
      avatarInput.click();
    });
  }

  if (avatarInput) {
    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
          const avatarImage = document.querySelector('.avatar-image');
          if (avatarImage) {
            avatarImage.src = event.target.result;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const routeHandler = getCurrentRoute();
  routeHandler();
  
  // Если хэш пустой, добавляем #login
  if (!window.location.hash) {
    navigateTo('#login');
  }
});
