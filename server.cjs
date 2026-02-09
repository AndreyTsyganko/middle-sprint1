const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let users = [];
let tokens = {};

// Тестовый маршрут
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Сервер работает!', 
        users: users.length,
        timestamp: new Date().toISOString()
    });
});

// Регистрация
app.post('/api/auth/register', (req, res) => {
    console.log('Регистрация:', req.body);
    
    const { first_name, second_name, login, email, password, phone } = req.body;
    
    if (!first_name || !second_name || !login || !email || !password) {
        return res.status(400).json({ reason: 'Заполните все поля' });
    }
    
    // Проверка уникальности логина
    if (users.find(u => u.login === login)) {
        return res.status(400).json({ reason: 'Логин уже занят' });
    }
    
    // Проверка уникальности email
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ reason: 'Email уже используется' });
    }
    
    const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        first_name,
        second_name,
        login,
        email,
        password,
        phone: phone || '',
        avatar: '/ui/default-avatar.jpg',
        display_name: `${first_name} ${second_name}`,
        created_at: new Date().toISOString()
    };
    
    users.push(newUser);
    console.log('✅ Пользователь создан:', { id: newUser.id, login: newUser.login });
    
    res.status(201).json({ 
        id: newUser.id,
        message: 'Регистрация успешна'
    });
});

// Вход
app.post('/api/auth/login', (req, res) => {
    const { login, password } = req.body;
    console.log('Вход:', login);
    
    const user = users.find(u => u.login === login && u.password === password);
    
    if (user) {
        const token = `token-${Date.now()}-${user.id}`;
        tokens[token] = user.id;
        
        const { password: _, ...safeUser } = user;
        console.log('✅ Успешный вход для:', user.login);
        
        res.json({ 
            token, 
            user: safeUser 
        });
    } else {
        console.log('❌ Ошибка входа для:', login);
        res.status(401).json({ 
            reason: 'Неверный логин или пароль' 
        });
    }
});

// Получение данных пользователя
app.get('/api/user', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    console.log('Запрос данных пользователя, токен:', token ? 'есть' : 'нет');
    
    if (!token || !tokens[token]) {
        return res.status(401).json({ 
            reason: 'Не авторизован' 
        });
    }
    
    const user = users.find(u => u.id === tokens[token]);
    if (!user) {
        return res.status(404).json({ 
            reason: 'Пользователь не найден' 
        });
    }
    
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
});

// Обновление профиля
app.put('/api/user/profile', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token || !tokens[token]) {
        return res.status(401).json({ 
            reason: 'Не авторизован' 
        });
    }
    
    const userId = tokens[token];
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ 
            reason: 'Пользователь не найден' 
        });
    }
    
    const { first_name, second_name, display_name, login, email, phone } = req.body;
    
    // Проверка уникальности логина (если изменился)
    if (login && login !== user.login) {
        if (users.find(u => u.login === login && u.id !== userId)) {
            return res.status(400).json({ 
                reason: 'Логин уже занят' 
            });
        }
    }
    
    // Проверка уникальности email (если изменился)
    if (email && email !== user.email) {
        if (users.find(u => u.email === email && u.id !== userId)) {
            return res.status(400).json({ 
                reason: 'Email уже используется' 
            });
        }
    }
    
    // Обновление данных
    if (first_name) user.first_name = first_name;
    if (second_name) user.second_name = second_name;
    if (display_name) user.display_name = display_name;
    if (login) user.login = login;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    
    // Обновляем отображаемое имя если не задано явно
    if (!display_name && (first_name || second_name)) {
        user.display_name = `${user.first_name} ${user.second_name}`;
    }
    
    console.log('✅ Профиль обновлен для:', user.login);
    
    const { password: _, ...safeUser } = user;
    res.json({
        message: 'Профиль успешно обновлен',
        user: safeUser
    });
});

// Получение списка чатов
app.get('/api/chats', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token || !tokens[token]) {
        return res.status(401).json({ 
            reason: 'Не авторизован' 
        });
    }
    
    const userId = tokens[token];
    console.log('Запрос чатов для пользователя:', userId);
    
    const chats = [
        {
            id: 1,
            title: 'Техподдержка',
            avatar: '/ui/default-avatar.jpg',
            last_message: {
                content: 'Добро пожаловать в наш мессенджер!',
                time: new Date().toISOString()
            },
            unread_count: 0
        },
        {
            id: 2,
            title: 'Общий чат',
            avatar: '/ui/default-avatar.jpg',
            last_message: {
                content: 'Приветствуем нового пользователя!',
                time: new Date().toISOString()
            },
            unread_count: 3
        }
    ];
    
    res.json(chats);
});

// Получение сообщений чата
app.get('/api/chats/:chatId/messages', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token || !tokens[token]) {
        return res.status(401).json({ 
            reason: 'Не авторизован' 
        });
    }
    
    const chatId = parseInt(req.params.chatId);
    const userId = tokens[token];
    
    console.log(`Запрос сообщений чата ${chatId} для пользователя ${userId}`);
    
    // Тестовые сообщения
    const messages = [
        {
            id: 1,
            content: 'Привет! Как дела?',
            time: new Date(Date.now() - 3600000).toISOString(), // 1 час назад
            user_id: userId
        },
        {
            id: 2,
            content: 'Всё отлично! А у тебя?',
            time: new Date(Date.now() - 1800000).toISOString(), // 30 минут назад
            user_id: 999 // ID другого пользователя
        },
        {
            id: 3,
            content: 'Тоже всё хорошо!',
            time: new Date().toISOString(),
            user_id: userId
        }
    ];
    
    res.json(messages);
});

// Отправка сообщения
app.post('/api/chats/:chatId/messages', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token || !tokens[token]) {
        return res.status(401).json({ 
            reason: 'Не авторизован' 
        });
    }
    
    const chatId = parseInt(req.params.chatId);
    const userId = tokens[token];
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
        return res.status(400).json({ 
            reason: 'Сообщение не может быть пустым' 
        });
    }
    
    console.log(`💬 Новое сообщение в чате ${chatId} от пользователя ${userId}: "${content}"`);
    
    // Создаем новое сообщение
    const newMessage = {
        id: Date.now(),
        content: content.trim(),
        time: new Date().toISOString(),
        user_id: userId
    };
    
    res.status(201).json(newMessage);
});

// Создание чата
app.post('/api/chats', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token || !tokens[token]) {
        return res.status(401).json({ 
            reason: 'Не авторизован' 
        });
    }
    
    const { title } = req.body;
    
    if (!title || title.trim() === '') {
        return res.status(400).json({ 
            reason: 'Название чата не может быть пустым' 
        });
    }
    
    const userId = tokens[token];
    console.log(`➕ Создание нового чата "${title}" пользователем ${userId}`);
    
    // Создаем новый чат
    const newChat = {
        id: Math.floor(Math.random() * 1000) + 100, // случайный ID
        title: title.trim(),
        avatar: '/ui/default-avatar.jpg',
        last_message: {
            content: 'Чат создан',
            time: new Date().toISOString()
        },
        unread_count: 0,
        created_by: userId,
        created_at: new Date().toISOString()
    };
    
    res.status(201).json(newChat);
});

// Выход
app.post('/api/auth/logout', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
        delete tokens[token];
        console.log('Пользователь вышел из системы');
    }
    
    res.json({ 
        message: 'Выход выполнен успешно' 
    });
});

// Обновление аватара (заглушка)
app.post('/api/user/avatar', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token || !tokens[token]) {
        return res.status(401).json({ 
            reason: 'Не авторизован' 
        });
    }
    
    const userId = tokens[token];
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ 
            reason: 'Пользователь не найден' 
        });
    }
    
    // В реальном приложении здесь была бы загрузка файла
    console.log('🖼️ Обновление аватара для пользователя:', user.login);
    
    // Обновляем аватар
    user.avatar = '/ui/default-avatar.jpg';
    
    const { password: _, ...safeUser } = user;
    res.json({
        message: 'Аватар успешно обновлен',
        user: safeUser
    });
});

// Смена пароля (заглушка)
app.put('/api/user/password', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token || !tokens[token]) {
        return res.status(401).json({ 
            reason: 'Не авторизован' 
        });
    }
    
    const userId = tokens[token];
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ 
            reason: 'Пользователь не найден' 
        });
    }
    
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ 
            reason: 'Заполните все поля' 
        });
    }
    
    // Проверка старого пароля
    if (user.password !== oldPassword) {
        return res.status(400).json({ 
            reason: 'Неверный старый пароль' 
        });
    }
    
    // Смена пароля
    user.password = newPassword;
    console.log('🔑 Пароль изменен для пользователя:', user.login);
    
    res.json({ 
        message: 'Пароль успешно изменен' 
    });
});

// Отладочный маршрут для просмотра пользователей
app.get('/api/debug/users', (req, res) => {
    // Показываем всех пользователей (без паролей)
    const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
    });
    
    res.json({
        total: users.length,
        users: safeUsers,
        tokens: Object.keys(tokens).length
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
    console.log('='.repeat(50));
    console.log('📋 Доступные маршруты:');
    console.log('  POST   /api/auth/register   - Регистрация');
    console.log('  POST   /api/auth/login      - Вход');
    console.log('  POST   /api/auth/logout     - Выход');
    console.log('  GET    /api/user            - Данные пользователя');
    console.log('  PUT    /api/user/profile    - Обновление профиля');
    console.log('  PUT    /api/user/password   - Смена пароля');
    console.log('  POST   /api/user/avatar     - Обновление аватара');
    console.log('  GET    /api/chats           - Список чатов');
    console.log('  POST   /api/chats           - Создание чата');
    console.log('  GET    /api/chats/:id/messages - Сообщения чата');
    console.log('  POST   /api/chats/:id/messages - Отправка сообщения');
    console.log('='.repeat(50));
});