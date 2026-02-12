import HTTPTransport from '../Core/HTTPTransport';

interface UserData {
  id: number;
  first_name: string;
  second_name: string;
  display_name: string;
  login: string;
  email: string;
  phone: string;
  avatar: string;
}

interface Chat {
  id: number;
  title: string;
  avatar: string;
  created_by: number;
  last_message?: {
    content: string;
    time: string;
    user: UserData;
  };
  unread_count: number;
}

interface Message {
  id: number;
  user_id: number;
  chat_id: number;
  content: string;
  time: string;
  is_read: boolean;
  type: string;
}

class ApiClient {
  private http: HTTPTransport;

  constructor() {
    this.http = new HTTPTransport('https://ya-praktikum.tech/api/v2');
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('authToken');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: XMLHttpRequest): Promise<T> {
    if (response.status < 200 || response.status >= 300) {
      let errorData;
      try {
        errorData = JSON.parse(response.responseText);
      } catch {
        errorData = { reason: response.responseText || response.statusText || 'Unknown error' };
      }

      throw new Error(errorData.reason || `HTTP ${response.status}`);
    }

    try {
      return JSON.parse(response.responseText) as T;
    } catch {
      return {} as T;
    }
  }

  async login(login: string, password: string): Promise<UserData> {
    try {
      console.log('API login called:', login);

      const response = await this.http.post('/auth/signin', {
        data: { login, password },
        headers: this.getHeaders(),
      });

      await this.handleResponse<any>(response);

      const user = await this.getUser();
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('authChecked', 'true');
      localStorage.setItem('authToken', 'dummy-token');

      console.log('Login successful, user data saved');
      return user;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(data: {
    first_name: string;
    second_name: string;
    login: string;
    email: string;
    password: string;
    phone: string;
  }): Promise<{ id: number }> {
    try {
      console.log('API register called with:', { ...data, password: '***' });

      const response = await this.http.post('/auth/signup', {
        data,
        headers: this.getHeaders(),
      });

      const result = await this.handleResponse<{ id: number }>(response);

      console.log('Registration successful, auto-login...');

      try {
        const user = await this.login(data.login, data.password);
        console.log('Auto-login after registration successful');
        return { id: user.id, ...result };
      } catch (loginError) {
        console.log('Auto-login failed:', loginError);
        return result;
      }
    } catch (error: any) {
      console.error('Register error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const response = await this.http.post('/auth/logout', {
        headers: this.getHeaders(),
      });

      await this.handleResponse<void>(response);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.setItem('authChecked', 'true');
    }
  }

  async getUser(): Promise<UserData> {
    try {
      const response = await this.http.get('/auth/user', {
        headers: this.getHeaders(),
      });

      const user = await this.handleResponse<UserData>(response);
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error: any) {
      console.error('Get user error:', error);
      localStorage.removeItem('user');
      throw error;
    }
  }

  async updateProfile(data: {
    first_name: string;
    second_name: string;
    display_name: string;
    login: string;
    email: string;
    phone: string;
  }): Promise<UserData> {
    try {
      const response = await this.http.put('/user/profile', {
        data,
        headers: this.getHeaders(),
      });

      const updatedUser = await this.handleResponse<UserData>(response);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  async updateAvatar(file: File): Promise<UserData> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const headers: Record<string, string> = {};
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await this.http.put('/user/profile/avatar', {
        data: formData,
        headers,
      });

      const updatedUser = await this.handleResponse<UserData>(response);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error: any) {
      console.error('Update avatar error:', error);
      throw error;
    }
  }

  async updatePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await this.http.put('/user/password', {
        data: { oldPassword, newPassword },
        headers: this.getHeaders(),
      });

      return this.handleResponse<void>(response);
    } catch (error: any) {
      console.error('Update password error:', error);
      throw error;
    }
  }

  async searchUsers(login: string): Promise<UserData[]> {
    try {
      const response = await this.http.post('/user/search', {
        data: { login },
        headers: this.getHeaders(),
      });

      return this.handleResponse<UserData[]>(response);
    } catch (error: any) {
      console.error('Search users error:', error);
      throw error;
    }
  }

  async getChats(): Promise<Chat[]> {
    try {
      const response = await this.http.get('/chats', {
        headers: this.getHeaders(),
      });

      return this.handleResponse<Chat[]>(response);
    } catch (error: any) {
      console.error('Get chats error:', error);
      throw error;
    }
  }

  async createChat(title: string): Promise<{ id: number }> {
    try {
      const response = await this.http.post('/chats', {
        data: { title },
        headers: this.getHeaders(),
      });

      return this.handleResponse<{ id: number }>(response);
    } catch (error: any) {
      console.error('Create chat error:', error);
      throw error;
    }
  }

  async getChatUsers(chatId: number): Promise<UserData[]> {
    try {
      const response = await this.http.get(`/chats/${chatId}/users`, {
        headers: this.getHeaders(),
      });

      return this.handleResponse<UserData[]>(response);
    } catch (error: any) {
      console.error('Get chat users error:', error);
      throw error;
    }
  }

  async addUsersToChat(chatId: number, userIds: number[]): Promise<void> {
    try {
      const response = await this.http.put('/chats/users', {
        data: { users: userIds, chatId },
        headers: this.getHeaders(),
      });

      return this.handleResponse<void>(response);
    } catch (error: any) {
      console.error('Add users to chat error:', error);
      throw error;
    }
  }

  async deleteUsersFromChat(chatId: number, userIds: number[]): Promise<void> {
    try {
      const response = await this.http.delete('/chats/users', {
        data: { users: userIds, chatId },
        headers: this.getHeaders(),
      });

      return this.handleResponse<void>(response);
    } catch (error: any) {
      console.error('Delete users from chat error:', error);
      throw error;
    }
  }

  async getToken(chatId: number): Promise<{ token: string }> {
    try {
      const response = await this.http.post(`/chats/token/${chatId}`, {
        headers: this.getHeaders(),
      });

      return this.handleResponse<{ token: string }>(response);
    } catch (error: any) {
      console.error('Get token error:', error);
      throw error;
    }
  }

  async getMessages(chatId: number, offset: number = 0, limit: number = 20): Promise<Message[]> {
    try {
      const response = await this.http.get(`/chats/${chatId}/messages?offset=${offset}&limit=${limit}`, {
        headers: this.getHeaders(),
      });

      return this.handleResponse<Message[]>(response);
    } catch (error: any) {
      console.error('Get messages error:', error);
      throw error;
    }
  }

  async sendMessage(chatId: number, content: string): Promise<Message> {
    try {
      const response = await this.http.post(`/chats/${chatId}/messages`, {
        data: { content },
        headers: this.getHeaders(),
      });

      return this.handleResponse<Message>(response);
    } catch (error: any) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    const user = localStorage.getItem('user');
    const authChecked = localStorage.getItem('authChecked') === 'true';
    return authChecked && !!user;
  }

  getCurrentUser(): UserData | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr) as UserData;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export const api = new ApiClient();
