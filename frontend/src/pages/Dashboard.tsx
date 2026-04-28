import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useExpenses } from '../contexts/ExpenseContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useOffline } from '../contexts/OfflineContext';
import { format } from 'date-fns';
import { EXPENSE_CATEGORIES } from '../types';

const Dashboard: React.FC = () => {
  const { expenses, loading, getTotalExpenses, getExpensesByCategory } = useExpenses();
  const { formatCurrency, selectedCurrency } = useCurrency();
  const { isOnline, lastSync } = useOffline();
  
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Array<{category: string, amount: number, percentage: number}>>([]);
  const [recentExpenses, setRecentExpenses] = useState(expenses.slice(0, 5));

  useEffect(() => {
    // Calculate monthly total (current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    });
    
    const total = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    setMonthlyTotal(total);

    // Calculate category breakdown
    const breakdown = EXPENSE_CATEGORIES.map(category => {
      const categoryExpenses = getExpensesByCategory(category.id);
      const categoryTotal = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const percentage = total > 0 ? (categoryTotal / total) * 100 : 0;
      
      return {
        category: category.name,
        amount: categoryTotal,
        percentage,
      };
    }).filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    setCategoryBreakdown(breakdown);

    // Get recent expenses
    const sortedExpenses = [...expenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    
    setRecentExpenses(sortedExpenses);
  }, [expenses, getExpensesByCategory]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back! 👋</h1>
            <p className="opacity-90">Track your expenses and manage your budget effectively</p>
          </div>
          <div className="bg-white/20 p-3 rounded-lg">
            <span className="text-3xl">💰</span>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/20 p-4 rounded-lg">
            <div className="text-sm opacity-90">Monthly Spending</div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(monthlyTotal)}</div>
          </div>
          <div className="bg-white/20 p-4 rounded-lg">
            <div className="text-sm opacity-90">Total Expenses</div>
            <div className="text-2xl font-bold mt-1">{expenses.length}</div>
          </div>
          <div className="bg-white/20 p-4 rounded-lg">
            <div className="text-sm opacity-90">Connection</div>
            <div className="text-2xl font-bold mt-1">{isOnline ? 'Online' : 'Offline'}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/add-expense"
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-gray-900">Add Expense</div>
              <div className="text-sm text-gray-600 mt-1">Record a new expense</div>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <span className="text-2xl">➕</span>
            </div>
          </div>
        </Link>

        <Link
          to="/reports"
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-gray-900">View Reports</div>
              <div className="text-sm text-gray-600 mt-1">Analyze your spending</div>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </Link>

        <Link
          to="/settings"
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-gray-900">Settings</div>
              <div className="text-sm text-gray-600 mt-1">Manage preferences</div>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <span className="text-2xl">⚙️</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Spending by Category</h2>
            <Link to="/categories" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All
            </Link>
          </div>
          
          <div className="space-y-4">
            {categoryBreakdown.length > 0 ? (
              categoryBreakdown.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.category}</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    {item.percentage.toFixed(1)}% of monthly total
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📊</div>
                <p>No expenses recorded yet</p>
                <p className="text-sm mt-2">Start by adding your first expense!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Expenses</h2>
            <Link to="/expenses" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentExpenses.length > 0 ? (
              recentExpenses.map((expense) => {
                const category = EXPENSE_CATEGORIES.find(c => c.id === expense.category);
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: category?.color || '#6B7280' }}
                      >
                        <span className="text-lg">{category?.icon || '📦'}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{expense.description}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(expense.date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(expense.amount, expense.currency)}</div>
                      <div className="text-sm text-gray-500">{expense.currency}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">💸</div>
                <p>No recent expenses</p>
                <p className="text-sm mt-2">Your expenses will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Monthly Summary</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-primary-600">{formatCurrency(monthlyTotal)}</div>
            <div className="text-sm text-gray-600 mt-1">This Month</div>
          </div>
          
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(getTotalExpenses(selectedCurrency))}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total ({selectedCurrency})</div>
          </div>
          
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-blue-600">{expenses.length}</div>
            <div className="text-sm text-gray-600 mt-1">Total Expenses</div>
          </div>
          
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-purple-600">
              {categoryBreakdown.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Active Categories</div>
          </div>
        </div>
      </div>

      {/* Offline Status */}
      {!isOnline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600">⚠️</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">You're currently offline</h3>
              <div className="mt-1 text-sm text-yellow-700">
                <p>Some features may be limited. Your data will sync when you're back online.</p>
                {lastSync && (
                  <p className="mt-1">Last sync: {format(lastSync, 'MMM dd, HH:mm')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;