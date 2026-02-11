describe('Валидация', () => {
  test('email должен содержать @', () => {
    const email = 'test@example.com';
    expect(email).toContain('@');
  });

  test('пароль должен быть не меньше 6 символов', () => {
    const password = '123456';
    expect(password.length).toBeGreaterThanOrEqual(6);
  });
});
