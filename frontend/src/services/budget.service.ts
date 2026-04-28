export interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  category: string;
  period: string;
  createdAt: string;
  updatedAt: string;
}

import axios from 'axios';
import { Budget } from '../types';

const API_URL = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : null) || process.env.REACT_APP_API_URL || 'https://pocketaccountant-api.onrender.com/api';

class BudgetService {
  async createBudget(budgetData: Omit<Budget, 'id'>): Promise<Budget> {
    try {
      const response = await axios.post(`${API_URL}/budgets`, budgetData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to create budget');
      }
      throw error;
    }
  }

  async getBudgets(): Promise<Budget[]> {
    try {
      const response = await axios.get(`${API_URL}/budgets`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch budgets');
      }
      throw error;
    }
  }

  async getBudgetSummary(): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/budgets/summary`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch budget summary');
      }
      throw error;
    }
  }

  async updateBudget(id: string, budgetData: Partial<Budget>): Promise<Budget> {
    try {
      const response = await axios.put(`${API_URL}/budgets/${id}`, budgetData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to update budget');
      }
      throw error;
    }
  }

  async deleteBudget(id: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/budgets/${id}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to delete budget');
      }
      throw error;
    }
  }

  async getBudgetById(id: string): Promise<Budget> {
    try {
      const response = await axios.get(`${API_URL}/budgets/${id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch budget');
      }
      throw error;
    }
  }
}

export default new BudgetService();