import axios from 'axios';

const API_URL = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : null) || process.env.REACT_APP_API_URL || 'https://pocketaccountant-api.onrender.com/api';

export interface User {
  id: string;
  email: string;
  name: string;
  default_currency: string;
  preferred_currencies: string[];
  country?: string;
  phone_number?: string;
  created_at: string;
  token?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  default_currency?: string;
  country?: string;
  phone_number?: string;
}

class AuthService {
  private tokenKey = 'pocketaccountant_token';
  private userKey = 'pocketaccountant_user';

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      const user = response.data;
      
      if (user.token) {
        this.setToken(user.token);
        this.setUser(user);
      }
      
      return user;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Login failed');
      }
      throw error;
    }
  }

  async register(userData: RegisterData): Promise<User> {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      const user = response.data;
      
      if (user.token) {
        this.setToken(user.token);
        this.setUser(user);
      }
      
      return user;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Registration failed');
      }
      throw error;
    }
  }

  async getProfile(): Promise<User> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          this.clearAuth();
        }
        throw new Error(error.response?.data?.error || 'Failed to fetch profile');
      }
      throw error;
    }
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await axios.put(`${API_URL}/auth/profile`, userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update stored user data
      const currentUser = this.getUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...response.data };
        this.setUser(updatedUser);
      }
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to update profile');
      }
      throw error;
    }
  }

  logout(): void {
    this.clearAuth();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    // Set default axios authorization header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  private setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  private clearAuth(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    delete axios.defaults.headers.common['Authorization'];
  }

  // Initialize axios interceptor for token refresh (simplified)
  initialize(): void {
    const token = this.getToken();
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
}

export default new AuthService();