import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { Expense, Category, Budget, ApiResponse, PaginatedResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://pocketaccountant-api.onrender.com/api';

class ApiService {
  private api: AxiosInstance;
  private offlineStorage: Storage;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000, // 10 second timeout for slow networks
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.offlineStorage = window.localStorage;

    // Request interceptor for adding auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for handling errors
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (!navigator.onLine) {
          console.warn('Offline mode: Using cached data');
          // We'll handle offline mode in the specific methods
        }
        return Promise.reject(error);
      }
    );
  }

  // Expense endpoints
  async getExpenses(page = 1, limit = 20): Promise<PaginatedResponse<Expense>> {
    try {
      const response: AxiosResponse<ApiResponse<PaginatedResponse<Expense>>> = 
        await this.api.get(`/expenses?page=${page}&limit=${limit}`);
      return response.data.data!;
    } catch (error) {
      // Fallback to offline storage
      const cached = this.offlineStorage.getItem('expenses');
      if (cached) {
        const expenses = JSON.parse(cached);
        return {
          data: expenses.slice((page - 1) * limit, page * limit),
          total: expenses.length,
          page,
          limit,
          totalPages: Math.ceil(expenses.length / limit),
        };
      }
      throw error;
    }
  }

  async getExpense(id: string): Promise<Expense> {
    try {
      const response: AxiosResponse<ApiResponse<Expense>> = await this.api.get(`/expenses/${id}`);
      return response.data.data!;
    } catch (error) {
      // Fallback to offline storage
      const cached = this.offlineStorage.getItem('expenses');
      if (cached) {
        const expenses: Expense[] = JSON.parse(cached);
        const expense = expenses.find(e => e.id === id);
        if (expense) return expense;
      }
      throw error;
    }
  }

  async createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    try {
      const response: AxiosResponse<ApiResponse<Expense>> = await this.api.post('/expenses', expense);
      
      // Cache the new expense
      const cached = this.offlineStorage.getItem('expenses');
      if (cached) {
        const expenses: Expense[] = JSON.parse(cached);
        expenses.push(response.data.data!);
        this.offlineStorage.setItem('expenses', JSON.stringify(expenses));
      } else {
        this.offlineStorage.setItem('expenses', JSON.stringify([response.data.data!]));
      }
      
      // Queue for sync if offline
      if (!navigator.onLine) {
        this.queueForSync('CREATE_EXPENSE', expense);
      }
      
      return response.data.data!;
    } catch (error) {
      // Store in offline queue
      this.queueForSync('CREATE_EXPENSE', expense);
      
      // Create temporary local expense
      const tempExpense: Expense = {
        ...expense,
        id: `temp_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Cache locally
      const cached = this.offlineStorage.getItem('expenses');
      if (cached) {
        const expenses: Expense[] = JSON.parse(cached);
        expenses.push(tempExpense);
        this.offlineStorage.setItem('expenses', JSON.stringify(expenses));
      } else {
        this.offlineStorage.setItem('expenses', JSON.stringify([tempExpense]));
      }
      
      return tempExpense;
    }
  }

  async updateExpense(id: string, expense: Partial<Expense>): Promise<Expense> {
    try {
      const response: AxiosResponse<ApiResponse<Expense>> = await this.api.put(`/expenses/${id}`, expense);
      
      // Update cache
      const cached = this.offlineStorage.getItem('expenses');
      if (cached) {
        const expenses: Expense[] = JSON.parse(cached);
        const index = expenses.findIndex(e => e.id === id);
        if (index !== -1) {
          expenses[index] = response.data.data!;
          this.offlineStorage.setItem('expenses', JSON.stringify(expenses));
        }
      }
      
      return response.data.data!;
    } catch (error) {
      // Queue for sync
      this.queueForSync('UPDATE_EXPENSE', { id, ...expense });
      
      // Update local cache
      const cached = this.offlineStorage.getItem('expenses');
      if (cached) {
        const expenses: Expense[] = JSON.parse(cached);
        const index = expenses.findIndex(e => e.id === id);
        if (index !== -1) {
          expenses[index] = { ...expenses[index], ...expense, updatedAt: new Date().toISOString() };
          this.offlineStorage.setItem('expenses', JSON.stringify(expenses));
          return expenses[index];
        }
      }
      throw error;
    }
  }

  async deleteExpense(id: string): Promise<void> {
    try {
      await this.api.delete(`/expenses/${id}`);
      
      // Remove from cache
      const cached = this.offlineStorage.getItem('expenses');
      if (cached) {
        const expenses: Expense[] = JSON.parse(cached);
        const filtered = expenses.filter(e => e.id !== id);
        this.offlineStorage.setItem('expenses', JSON.stringify(filtered));
      }
    } catch (error) {
      // Queue for sync
      this.queueForSync('DELETE_EXPENSE', { id });
      
      // Remove from local cache
      const cached = this.offlineStorage.getItem('expenses');
      if (cached) {
        const expenses: Expense[] = JSON.parse(cached);
        const filtered = expenses.filter(e => e.id !== id);
        this.offlineStorage.setItem('expenses', JSON.stringify(filtered));
      }
    }
  }

  // Category endpoints
  async getCategories(): Promise<Category[]> {
    try {
      const response: AxiosResponse<ApiResponse<Category[]>> = await this.api.get('/categories');
      return response.data.data!;
    } catch (error) {
      const cached = this.offlineStorage.getItem('categories');
      if (cached) return JSON.parse(cached);
      throw error;
    }
  }

  // Budget endpoints
  async getBudgets(): Promise<Budget[]> {
    try {
      const response: AxiosResponse<ApiResponse<Budget[]>> = await this.api.get('/budgets');
      return response.data.data!;
    } catch (error) {
      const cached = this.offlineStorage.getItem('budgets');
      if (cached) return JSON.parse(cached);
      throw error;
    }
  }

  // Sync queued operations when back online
  private queueForSync(action: string, data: any) {
    const queue = JSON.parse(this.offlineStorage.getItem('syncQueue') || '[]');
    queue.push({ action, data, timestamp: Date.now() });
    this.offlineStorage.setItem('syncQueue', JSON.stringify(queue));
    
    // Try to sync if we come back online
    window.addEventListener('online', this.syncQueue.bind(this));
  }

  private async syncQueue() {
    const queue = JSON.parse(this.offlineStorage.getItem('syncQueue') || '[]');
    if (queue.length === 0) return;

    const successful: number[] = [];
    
    for (let i = 0; i < queue.length; i++) {
      const { action, data } = queue[i];
      
      try {
        switch (action) {
          case 'CREATE_EXPENSE':
            await this.createExpense(data);
            break;
          case 'UPDATE_EXPENSE':
            await this.updateExpense(data.id, data);
            break;
          case 'DELETE_EXPENSE':
            await this.deleteExpense(data.id);
            break;
        }
        successful.push(i);
      } catch (error) {
        console.error(`Failed to sync ${action}:`, error);
      }
    }
    
    // Remove successful syncs
    if (successful.length > 0) {
      const newQueue = queue.filter((_: any, index: number) => !successful.includes(index));
      this.offlineStorage.setItem('syncQueue', JSON.stringify(newQueue));
    }
  }

  // Initialize offline storage
  initializeOfflineStorage() {
    if (!this.offlineStorage.getItem('expenses')) {
      this.offlineStorage.setItem('expenses', JSON.stringify([]));
    }
    if (!this.offlineStorage.getItem('categories')) {
      this.offlineStorage.setItem('categories', JSON.stringify([]));
    }
    if (!this.offlineStorage.getItem('budgets')) {
      this.offlineStorage.setItem('budgets', JSON.stringify([]));
    }
    if (!this.offlineStorage.getItem('syncQueue')) {
      this.offlineStorage.setItem('syncQueue', JSON.stringify([]));
    }
  }
}

export default new ApiService();