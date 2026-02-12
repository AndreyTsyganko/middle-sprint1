import HTTPTransport from '../Core/HTTPTransport';

const API_BASE_URL = 'https://ya-praktikum.tech/api/v2';

class ApiClient {
  private http: HTTPTransport;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.http = new HTTPTransport(baseUrl);
    this.token = localStorage.getItem('authToken');
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const token = this.token || localStorage.getItem('authToken');
    if (token && token !== 'authenticated') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async handleResponse<T>(xhr: XMLHttpRequest): Promise<T> {
    console.log('Response status:', xhr.status, 'URL:', xhr.responseURL);
    
    if (xhr.status === 401 || xhr.status === 403) {
      console.warn('Authentication error');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userLogin');
      this.token = null;
    }
    
    if (xhr.status < 200 || xhr.status >= 300) {
      let errorData;
      try {
        if (xhr.responseText) {
          errorData = JSON.parse(xhr.responseText);
        } else {
          errorData = { reason: `HTTP ${xhr.status}: ${xhr.statusText || 'No response'}` };
        }
      } catch {
        errorData = { reason: xhr.responseText || xhr.statusText || `HTTP ${xhr.status}: Unknown error` };
      }
      
      const errorMessage = errorData.reason || `HTTP ${xhr.status}`;
      const apiError = new Error(errorMessage);
      
      (apiError as any).status = xhr.status;
      (apiError as any).responseData = errorData;
      (apiError as any).reason = errorData.reason;
      
      throw apiError;
    }

    if (xhr.responseText === 'OK' || xhr.responseText.trim() === 'OK') {
      return {} as T;
    }

    try {
      if (xhr.responseText) {
        return JSON.parse(xhr.responseText);
      }
      return {} as T;
    } catch (error) {
      console.error('JSON parse error:', error, 'on text:', xhr.responseText);
      if (xhr.status === 200) {
        return {} as T;
      }
      const parseError = new Error('Wrong json format');
      (parseError as any).status = xhr.status;
      throw parseError;
    }
  }

  async login(login: string, password: string): Promise<void> {
    console.log('API login called with:', { login, password: password ? '***' : 'empty' });
    
    try {
      const response = await this.http.post('/auth/signin', {
        data: { login, password },
        headers: this.getHeaders(),
      });

      await this.handleResponse(response);
      
      console.log('Login successful');
      localStorage.setItem('authToken', 'authenticated');
      localStorage.setItem('userLogin', login);
      
      try {
        const userData = await this.getUser();
        if (userData.id) {
          localStorage.setItem('userId', userData.id.toString());
          console.log('User ID saved:', userData.id);
        }
      } catch (error) {
        console.error('Failed to get user after login:', error);
      }
    } catch (error: any) {
      console.error('Login API error:', error);
      
      if (error.message?.includes('User already in system') && !error.reason) {
        error.reason = 'User already in system';
      }
      
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
  }): Promise<void> {
    console.log('API register called with data:', { ...data, password: '***' });
    
    const response = await this.http.post('/auth/signup', {
      data,
      headers: this.getHeaders(),
    });

    await this.handleResponse<void>(response);
    
    console.log('Registration successful');
    
    await this.login(data.login, data.password);
  }

  async logout(): Promise<void> {
    try {
      const response = await this.http.post('/auth/logout', {
        headers: this.getHeaders(),
      });
      await this.handleResponse<void>(response);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userLogin');
      this.token = null;
    }
  }

  async getUser(): Promise<any> {
    try {
      const response = await this.http.get('/auth/user', {
        headers: this.getHeaders(),
      });

      return this.handleResponse(response);
    } catch (error: any) {
      if (error.status === 401 || error.status === 403) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userLogin');
      }
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
  }): Promise<any> {
    const response = await this.http.put('/user/profile', {
      data,
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async updateAvatar(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('avatar', file);

    console.log('API updateAvatar → PUT /user/profile/avatar');
    console.log('Файл:', file.name, file.size, 'bytes');
    console.log('Токен:', localStorage.getItem('authToken') ? 'есть' : 'НЕТ!');

    const token = localStorage.getItem('authToken');
    const response = await this.http.put('/user/profile/avatar', {
      data: formData,
      headers: token ? {
        'Authorization': `Bearer ${token}`
      } : {}
    });

    console.log('Аватар сохранен! Статус:', response.status);
    return this.handleResponse(response);
  }

  async updatePassword(oldPassword: string, newPassword: string): Promise<void> {
    const response = await this.http.put('/user/password', {
      data: { oldPassword, newPassword },
      headers: this.getHeaders(),
    });

    return this.handleResponse<void>(response);
  }

  async searchUsers(login: string): Promise<any[]> {
    const response = await this.http.post('/user/search', {
      data: { login },
      headers: this.getHeaders(),
    });

    return this.handleResponse<any[]>(response);
  }

  async getChats(): Promise<any[]> {
    const response = await this.http.get('/chats', {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse<any[]>(response);
  }

  async createChat(title: string): Promise<{ id: number }> {
    const response = await this.http.post('/chats', {
      data: { title },
      headers: this.getHeaders(),
    });

    return this.handleResponse<{ id: number }>(response);
  }

  async getChatUsers(chatId: number): Promise<any[]> {
    const response = await this.http.get(`/chats/${chatId}/users`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<any[]>(response);
  }

  async addUsersToChat(chatId: number, users: number[]): Promise<void> {
    const response = await this.http.put('/chats/users', {
      data: { users, chatId },
      headers: this.getHeaders(),
    });

    return this.handleResponse<void>(response);
  }

  async deleteUsersFromChat(chatId: number, users: number[]): Promise<void> {
    const response = await this.http.delete('/chats/users', {
      data: { users, chatId },
      headers: this.getHeaders(),
    });

    return this.handleResponse<void>(response);
  }

  async getToken(chatId: number): Promise<{ token: string }> {
    const response = await this.http.post(`/chats/token/${chatId}`, {
      headers: this.getHeaders(),
    });

    const result = await this.handleResponse<{ token: string }>(response);
    
    if (result.token) {
      this.token = result.token;
      localStorage.setItem(`chatToken_${chatId}`, result.token);
    }
    
    return result;
  }

  async sendMessage(chatId: number, content: string): Promise<any> {
    console.log('API: Сообщения отправляются через WebSocket, не через REST API');
    console.log('chatId:', chatId, 'content:', content);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Сообщение отправлено через WebSocket' });
      }, 100);
    });
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('authToken') === 'authenticated';
  }
}

export const api = new ApiClient();
