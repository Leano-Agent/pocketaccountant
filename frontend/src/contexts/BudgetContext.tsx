import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import budgetService, { Budget } from '../services/budget.service';

interface BudgetContextType {
  budgets: Budget[];
  loading: boolean;
  error: string | null;
  createBudget: (budgetData: Omit<Budget, 'id'>) => Promise<void>;
  updateBudget: (id: string, budgetData: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  refreshBudgets: () => Promise<void>;
  clearError: () => void;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const useBudgets = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudgets must be used within a BudgetProvider');
  }
  return context;
};

interface BudgetProviderProps {
  children: ReactNode;
}

export const BudgetProvider: React.FC<BudgetProviderProps> = ({ children }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await budgetService.getBudgets();
      setBudgets(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch budgets';
      setError(errorMessage);
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const createBudget = async (budgetData: Omit<Budget, 'id'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const newBudget = await budgetService.createBudget(budgetData);
      setBudgets(prev => [...prev, newBudget]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create budget';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBudget = async (id: string, budgetData: Partial<Budget>) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedBudget = await budgetService.updateBudget(id, budgetData);
      setBudgets(prev => prev.map(budget => 
        budget.id === id ? updatedBudget : budget
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update budget';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteBudget = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await budgetService.deleteBudget(id);
      setBudgets(prev => prev.filter(budget => budget.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete budget';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshBudgets = async () => {
    await fetchBudgets();
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    budgets,
    loading,
    error,
    createBudget,
    updateBudget,
    deleteBudget,
    refreshBudgets,
    clearError
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
};