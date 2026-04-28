import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Expense, Category, Budget } from '../types';
import apiService from '../services/api';

interface ExpenseContextType {
  expenses: Expense[];
  categories: Category[];
  budgets: Budget[];
  loading: boolean;
  error: string | null;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  refreshExpenses: () => Promise<void>;
  getExpense: (id: string) => Expense | undefined;
  getExpensesByCategory: (categoryId: string) => Expense[];
  getTotalExpenses: (currency?: string) => number;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};

interface ExpenseProviderProps {
  children: ReactNode;
}

export const ExpenseProvider: React.FC<ExpenseProviderProps> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setLoading(true);
      apiService.initializeOfflineStorage();
      
      // Load initial data
      const [expensesData, categoriesData, budgetsData] = await Promise.all([
        apiService.getExpenses(),
        apiService.getCategories(),
        apiService.getBudgets(),
      ]);
      
      setExpenses(expensesData.data);
      setCategories(categoriesData);
      setBudgets(budgetsData);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Using offline mode.');
      console.error('Error initializing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newExpense = await apiService.createExpense(expenseData);
      setExpenses(prev => [...prev, newExpense]);
    } catch (err) {
      setError('Failed to add expense. Saved locally.');
      throw err;
    }
  };

  const updateExpense = async (id: string, expenseData: Partial<Expense>) => {
    try {
      const updatedExpense = await apiService.updateExpense(id, expenseData);
      setExpenses(prev => prev.map(expense => 
        expense.id === id ? updatedExpense : expense
      ));
    } catch (err) {
      setError('Failed to update expense. Updated locally.');
      throw err;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await apiService.deleteExpense(id);
      setExpenses(prev => prev.filter(expense => expense.id !== id));
    } catch (err) {
      setError('Failed to delete expense. Removed locally.');
      throw err;
    }
  };

  const refreshExpenses = async () => {
    try {
      setLoading(true);
      const expensesData = await apiService.getExpenses();
      setExpenses(expensesData.data);
      setError(null);
    } catch (err) {
      setError('Failed to refresh expenses');
      console.error('Error refreshing expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const getExpense = (id: string) => {
    return expenses.find(expense => expense.id === id);
  };

  const getExpensesByCategory = (categoryId: string) => {
    return expenses.filter(expense => expense.category === categoryId);
  };

  const getTotalExpenses = (currency?: string) => {
    let filteredExpenses = expenses;
    if (currency) {
      filteredExpenses = expenses.filter(expense => expense.currency === currency);
    }
    return filteredExpenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const value: ExpenseContextType = {
    expenses,
    categories,
    budgets,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    refreshExpenses,
    getExpense,
    getExpensesByCategory,
    getTotalExpenses,
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};