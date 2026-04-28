import React, { useState, useEffect } from 'react';
import { useBudgets } from '../contexts/BudgetContext';
import { useExpenses } from '../contexts/ExpenseContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Budget, EXPENSE_CATEGORIES, AFRICAN_CURRENCIES } from '../types';
import { format } from 'date-fns';
import { Plus, Trash2, Edit, TrendingUp, TrendingDown } from 'lucide-react';

const Budgets: React.FC = () => {
  const { budgets, loading, createBudget, deleteBudget, error } = useBudgets();
  const { expenses, getExpensesByCategory } = useExpenses();
  const { formatCurrency } = useCurrency();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: 'food',
    amount: '',
    currency: 'ZAR',
    period: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });
  const [formError, setFormError] = useState('');

  const calculateBudgetProgress = (budget: Budget) => {
    const categoryExpenses = getExpensesByCategory(budget.categoryId);
    
    // Filter expenses for the current period
    const now = new Date();
    let periodStart = new Date(budget.startDate);
    let periodEnd = new Date();
    
    if (budget.endDate) {
      periodEnd = new Date(budget.endDate);
    } else {
      // Calculate period end based on budget period
      switch (budget.period) {
        case 'daily':
          periodEnd = new Date(periodStart);
          periodEnd.setDate(periodEnd.getDate() + 1);
          break;
        case 'weekly':
          periodEnd = new Date(periodStart);
          periodEnd.setDate(periodEnd.getDate() + 7);
          break;
        case 'monthly':
          periodEnd = new Date(periodStart);
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          break;
        case 'yearly':
          periodEnd = new Date(periodStart);
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          break;
      }
    }

    const periodExpenses = categoryExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= periodStart && expenseDate <= periodEnd;
    });

    const totalSpent = periodExpenses.reduce((sum, expense) => {
      // Convert to budget currency if needed
      // For simplicity, we'll assume same currency for now
      return sum + expense.amount;
    }, 0);

    const percentage = (totalSpent / budget.amount) * 100;
    const remaining = budget.amount - totalSpent;
    
    return {
      spent: totalSpent,
      percentage,
      remaining,
      isOverBudget: totalSpent > budget.amount,
      periodExpenses: periodExpenses.length
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setFormError('Please enter a valid amount');
      return;
    }

    if (!formData.startDate) {
      setFormError('Start date is required');
      return;
    }

    try {
      await createBudget({
        categoryId: formData.categoryId,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        period: formData.period,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
      });

      // Reset form
      setFormData({
        categoryId: 'food',
        amount: '',
        currency: 'ZAR',
        period: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
      });
      setShowForm(false);
    } catch (err) {
      console.error('Error creating budget:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      await deleteBudget(id);
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return EXPENSE_CATEGORIES.find(c => c.id === categoryId) || {
      name: categoryId,
      color: '#6B7280',
      icon: '📦',
    };
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return period;
    }
  };

  if (loading && budgets.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
          <p className="text-gray-600 mt-1">Set and track your spending limits</p>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          <span>Add Budget</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Budget Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Create New Budget</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Category</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="input-field"
                >
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {AFRICAN_CURRENCIES.find(c => c.code === formData.currency)?.symbol || '$'}
                  </span>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="label">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="input-field"
                >
                  {AFRICAN_CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Period</label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value as any })}
                  className="input-field"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="label">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">End Date (Optional)</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {formError}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Create Budget
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budgets List */}
      <div className="space-y-4">
        {budgets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No budgets set up yet</h3>
            <p className="text-gray-600">Create your first budget to start tracking your spending limits</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create First Budget
            </button>
          </div>
        ) : (
          budgets.map((budget) => {
            const category = getCategoryInfo(budget.categoryId);
            const progress = calculateBudgetProgress(budget);
            const progressColor = progress.isOverBudget ? 'bg-red-500' : 'bg-primary-500';
            
            return (
              <div key={budget.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: category.color }}
                    >
                      <span className="text-xl">{category.icon}</span>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-600">
                          {formatCurrency(budget.amount, budget.currency)} {getPeriodLabel(budget.period)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(budget.startDate), 'MMM dd, yyyy')}
                          {budget.endDate && ` - ${format(new Date(budget.endDate), 'MMM dd, yyyy')}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="p-2 text-red-600 hover:text-red-700"
                      title="Delete budget"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-700">Spent: {formatCurrency(progress.spent, budget.currency)}</span>
                      {progress.isOverBudget ? (
                        <TrendingUp className="text-red-500" size={16} />
                      ) : (
                        <TrendingDown className="text-green-500" size={16} />
                      )}
                    </div>
                    <div className="text-gray-700">
                      {progress.percentage.toFixed(1)}% of budget
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${progressColor} transition-all duration-300`}
                      style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>
                      {progress.isOverBudget ? 'Over budget by ' : 'Remaining: '}
                      {formatCurrency(Math.abs(progress.remaining), budget.currency)}
                    </span>
                    <span>{progress.periodExpenses} expenses in period</span>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className="mt-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    progress.isOverBudget
                      ? 'bg-red-100 text-red-800'
                      : progress.percentage > 80
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {progress.isOverBudget
                      ? 'Over Budget'
                      : progress.percentage > 80
                      ? 'Approaching Limit'
                      : 'On Track'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Budget Summary */}
      {budgets.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Budget Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-primary-600">{budgets.length}</div>
              <div className="text-sm text-gray-600 mt-1">Active Budgets</div>
            </div>
            
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-green-600">
                {budgets.filter(budget => {
                  const progress = calculateBudgetProgress(budget);
                  return !progress.isOverBudget && progress.percentage <= 80;
                }).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">On Track</div>
            </div>
            
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-red-600">
                {budgets.filter(budget => {
                  const progress = calculateBudgetProgress(budget);
                  return progress.isOverBudget;
                }).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Over Budget</div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Tip: Set realistic budgets based on your past spending patterns. 
              Review and adjust your budgets monthly to stay on track with your financial goals.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;