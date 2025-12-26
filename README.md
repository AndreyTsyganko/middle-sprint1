TalkChat это мессенджер для общения и обмена фотографиями и видео.

Предпросмотр проекта командой - npm run preview
Командой npm run build проект собирается
Командой npm run dev проект запускается на порту 3000

Проверка TypeScript - npm run type-check

Ссылка на страницу входа - http://localhost:3000
Ссылка на страницу 404 - http://localhost:3000/404.html
Ссылка на страницу 500 - http://localhost:3000/500.html

Ссылка на страницу редактирования профися - http://localhost:3000/#profile
Ссылка на Netlify - https://app.netlify.com/projects/talkchat-sprint1/overview

Используемые технологии:
Frontend Framework: Vite (сборщик),
Языки: HTML5, SCSS, JavaScript (ES6+),
Шаблонизация: Handlebars,
Стилизация: SCSS с CSS-переменными,
Валидация форм: Кастомная JavaScript валидация,
Маршрутизация: Hash-based routing

Архитектура
- Компонентный подход - классы компонентов, наследуемые от базового "Block",
- Event Bus - собственная реализация шины событий для управления жизненным циклом,
- Собственный HTTP Transport - класс для работы с HTTP-запросами (XHR).

Инструменты разработки
- Vite - сборщик и dev-сервер,
- ESLint - линтинг JavaScript/TypeScript кода,
- Stylelint - проверка стилей (SCSS),
- TypeScript Compiler - статическая проверка типов,
- Jest - тестирование (настроен, тесты могут быть добавлены).

Конфигурации
- EditorConfig - единый стиль кодирования,
- TypeScript Config - настройки компилятора TypeScript,
- Vite Config - настройки сборки и dev-сервера.

Добавлена страница чатов. Ссылка - http://localhost:3000/chats
