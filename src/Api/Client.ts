import HTTPTransport from '../Core/HTTPTransport';

const API_BASE_URL = '/api/v2';

class ApiClient {
  private http: HTTPTransport;

  constructor(baseUrl: string = API_BASE_URL) {
    this.http = new HTTPTransport(baseUrl);
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(xhr: XMLHttpRequest): Promise<T> {
    console.log('Response status:', xhr.status);
    console.log('Response text:', xhr.responseText);
    
    if (xhr.status < 200 || xhr.status >= 300) {
      let errorData;
      try {
        if (xhr.responseText) {
          errorData = JSON.parse(xhr.responseText);
        } else {
          errorData = { reason: 'Empty response' };
        }
      } catch {
        errorData = { reason: xhr.responseText || xhr.statusText || 'Unknown error' };
      }
      console.error('API Error:', errorData);
      throw new Error(errorData.reason || `HTTP ${xhr.status}`);
    }

    if (xhr.responseText === 'OK' || xhr.responseText.trim() === 'OK') {
      return { token: 'login-success' } as T;
    }

    try {
      if (xhr.responseText) {
        return JSON.parse(xhr.responseText);
      }
      return {} as T;
    } catch (error) {
      console.error('JSON parse error:', error, 'on text:', xhr.responseText);
      if (xhr.status === 200) {
        return { token: 'server-success' } as T;
      }
      throw new Error('Wrong json format');
    }
  }

  async login(login: string, password: string): Promise<{ token: string }> {
    console.log('API login called with:', { login, password: password ? '***' : 'empty' });
    
    const response = await this.http.post('/auth/signin', {
      data: { login, password },
      headers: this.getHeaders(),
    });

    const result = await this.handleResponse<{ token: string }>(response);
    
    console.log('Login result:', result);
    
    localStorage.setItem('authToken', result.token || 'login-success');
    console.log('Token saved to localStorage');
    
    return result;
  }

  async register(data: {
    first_name: string;
    second_name: string;
    login: string;
    email: string;
    password: string;
    phone: string;
  }): Promise<{ id: number }> {
    console.log('API register called with data:', { ...data, password: '***' });
    
    const response = await this.http.post('/auth/signup', {
      data,
      headers: this.getHeaders(),
    });

    return this.handleResponse<{ id: number }>(response);
  }

  async logout(): Promise<void> {
    try {
      const response = await this.http.post('/auth/logout', {
        headers: this.getHeaders(),
      });
      await this.handleResponse<void>(response);
    } finally {
      localStorage.removeItem('authToken');
    }
  }

  async getUser(): Promise<any> {
    const response = await this.http.get('/auth/user', {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
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

    const token = localStorage.getItem('authToken');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await this.http.post('/user/avatar', {
      data: formData,
      headers,
    });

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
    const response = await this.http.post(`/chats/${chatId}/users`, {
      data: { users },
      headers: this.getHeaders(),
    });

    return this.handleResponse<void>(response);
  }

  async deleteUsersFromChat(chatId: number, users: number[]): Promise<void> {
    const response = await this.http.delete(`/chats/${chatId}/users`, {
      data: { users },
      headers: this.getHeaders(),
    });

    return this.handleResponse<void>(response);
  }

  async getToken(chatId: number): Promise<{ token: string }> {
    const response = await this.http.get(`/chats/${chatId}/token`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<{ token: string }>(response);
  }

  async getMessages(chatId: number): Promise<any[]> {
    const response = await this.http.get(`/chats/${chatId}/messages`, {
      data: { limit: 20 },
      headers: this.getHeaders(),
    });

    return this.handleResponse<any[]>(response);
  }

  async sendMessage(chatId: number, content: string): Promise<any> {
    const response = await this.http.post(`/chats/${chatId}/messages`, {
      data: { content },
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }
}

export const api = new ApiClient();
