export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email) ? null : 'Некорректный email';
};

export const validatePhone = (phone: string): string | null => {
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const phoneRegex = /^\+?\d{10,15}$/;
  
  if (!phoneRegex.test(cleanPhone)) {
    return 'Телефон должен содержать 10-15 цифр, может начинаться с +';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (password.length < 8 || password.length > 40) {
    return 'Пароль должен быть от 8 до 40 символов';
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  
  if (!hasUpperCase) {
    return 'Пароль должен содержать хотя бы одну заглавную букву';
  }
  
  if (!hasDigit) {
    return 'Пароль должен содержать хотя бы одну цифру';
  }
  
  return null;
};

export const validateRequired = (value: string, fieldName: string = 'Поле'): string | null => {
  return value.trim().length > 0 ? null : `${fieldName} обязательно`;
};

export const validateName = (name: string): string | null => {

  const nameRegex = /^[A-ZА-ЯЁ][a-zа-яё]*(-[A-ZА-ЯЁ][a-zа-яё]*)?$/;
  
  if (!nameRegex.test(name)) {
    return 'Имя должно начинаться с заглавной буквы, содержать только буквы и дефис';
  }
  return null;
};

export const validateLogin = (login: string): string | null => {
  if (login.length < 3 || login.length > 20) {
    return 'Логин должен быть от 3 до 20 символов';
  }
  const loginRegex = /^[a-zA-Z0-9_-]+$/;
  if (!loginRegex.test(login)) {
    return 'Логин может содержать только латинские буквы, цифры, дефис и подчёркивание';
  }
  
  const onlyDigitsRegex = /^\d+$/;
  if (onlyDigitsRegex.test(login)) {
    return 'Логин не может состоять только из цифр';
  }
  
  const hasLetterRegex = /[a-zA-Z]/;
  if (!hasLetterRegex.test(login)) {
    return 'Логин должен содержать хотя бы одну букву';
  }
  
  return null;
};

export const validateMessage = (message: string): string | null => {
  return message.trim().length > 0 ? null : 'Сообщение не может быть пустым';
};
