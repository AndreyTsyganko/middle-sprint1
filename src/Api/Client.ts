const API_BASE_URL = 'http://localhost:3000/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const text = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { reason: text || response.statusText || 'Unknown error' };
      }
      
      throw new Error(errorData.reason || `HTTP ${response.status}`);
    }

    try {
      return await response.json();
    } catch {
      return {} as T;
    }
  }


  async login(login: string, password: string): Promise<{ token: string }> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ login, password }),
    });

    const result = await this.handleResponse<{ token: string }>(response);
    

    if (result.token) {
      localStorage.setItem('authToken', result.token);
    }
    
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
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<{ id: number }>(response);
  }

  async logout(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      await this.handleResponse<void>(response);
    } finally {
      localStorage.removeItem('authToken');
    }
  }


  async getUser(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/user`, {
      method: 'GET',
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
    const response = await fetch(`${this.baseUrl}/user/profile`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async updateAvatar(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/user/avatar`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse(response);
  }

  async updatePassword(oldPassword: string, newPassword: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/user/password`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    return this.handleResponse<void>(response);
  }

  async searchUsers(login: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/user/search`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ login }),
    });

    return this.handleResponse<any[]>(response);
  }


  async getChats(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/chats`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse<any[]>(response);
  }

  async createChat(title: string): Promise<{ id: number }> {
    const response = await fetch(`${this.baseUrl}/chats`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ title }),
    });

    return this.handleResponse<{ id: number }>(response);
  }

  async getChatUsers(chatId: number): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/chats/${chatId}/users`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<any[]>(response);
  }

  async addUsersToChat(chatId: number, users: number[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/chats/${chatId}/users`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ users }),
    });

    return this.handleResponse<void>(response);
  }

  async deleteUsersFromChat(chatId: number, users: number[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/chats/${chatId}/users`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ users }),
    });

    return this.handleResponse<void>(response);
  }

  async getToken(chatId: number): Promise<{ token: string }> {
    const response = await fetch(`${this.baseUrl}/chats/${chatId}/token`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<{ token: string }>(response);
  }

  async getMessages(chatId: number): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/chats/${chatId}/messages`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<any[]>(response);
  }

  async sendMessage(chatId: number, content: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/chats/${chatId}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ content }),
    });

    return this.handleResponse(response);
  }


  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }
}

export const api = new ApiClient();
