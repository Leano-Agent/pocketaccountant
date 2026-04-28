import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useExpenses } from '../contexts/ExpenseContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useOffline } from '../contexts/OfflineContext';
import { format } from 'date-fns';
import { EXPENSE_CATEGORIES } from '../types';

const API_URL = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : null) || process.env.REACT_APP_API_URL || 'https://pocketaccountant-api.onrender.com/api';

const Dashboard: React.FC = () => {
  const { expenses, loading, getTotalExpenses, getExpensesByCategory } = useExpenses();
  const { formatCurrency, selectedCurrency } = useCurrency();
  const { isOnline, lastSync } = useOffline();
  
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Array<{category: string, amount: number, percentage: number}>>([]);
  const [recentExpenses, setRecentExpenses] = useState(expenses.slice(0, 5));
  const [invoiceSummary, setInvoiceSummary] = useState({ revenue: 0, overdue: 0, overdueCount: 0, net: 0 });

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
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setRecentExpenses(sortedExpenses.slice(0, 5));

    // Fetch invoice summary from API
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/reports/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data.data || res.data;
        setInvoiceSummary({
          revenue: data.currentMonth?.revenue || 0,
          overdue: data.overdue?.total || 0,
          overdueCount: data.overdue?.count || 0,
          net: data.currentMonth?.net || 0,
        });
      } catch {
        // Silent fail — dashboard still shows expense data
      }
    };
    fetchSummary();
  }, [expenses, getExpensesByCategory]);

  const formatAmount = (amount: number) => {
    return formatCurrency(amount);
  };

  const totalExpenses = getTotalExpenses();

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
        <h2 className="text-lg font-semibold mb-1">Welcome back</h2>
        <p className="text-green-100 text-sm">Here's your financial overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
              💰
            </div>
          </div>
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-800">{formatAmount(totalExpenses)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              📅
            </div>
          </div>
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-2xl font-bold text-gray-800">{formatAmount(monthlyTotal)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              📄
            </div>
          </div>
          <p className="text-sm text-gray-500">Revenue (This Month)</p>
          <p className="text-2xl font-bold text-purple-700">{formatAmount(invoiceSummary.revenue)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 ${invoiceSummary.overdueCount > 0 ? 'bg-red-100' : 'bg-green-100'} rounded-lg flex items-center justify-center ${invoiceSummary.overdueCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ⚠️
            </div>
          </div>
          <p className="text-sm text-gray-500">Overdue</p>
          <p className={`text-2xl font-bold ${invoiceSummary.overdueCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {invoiceSummary.overdueCount > 0 
              ? `${formatAmount(invoiceSummary.overdue)} (${invoiceSummary.overdueCount})`
              : 'None ✨'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Spending by Category</h3>
          {categoryBreakdown.length > 0 ? (
            <div className="space-y-3">
              {categoryBreakdown.slice(0, 5).map((cat, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{cat.category}</span>
                    <span className="font-medium text-gray-800">
                      {formatAmount(cat.amount)} ({Math.round(cat.percentage)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 rounded-full h-2 transition-all"
                      style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No expenses this month</p>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Transactions</h3>
            <Link to="/expenses" className="text-sm text-green-600 hover:text-green-700">
              View All
            </Link>
          </div>
          {recentExpenses.length > 0 ? (
            <div className="space-y-3">
              {recentExpenses.map((expense) => {
                const category = EXPENSE_CATEGORIES.find(c => c.id === expense.category);
                return (
                  <div key={expense.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm">
                        {category?.icon || '📦'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{expense.description}</p>
                        <p className="text-xs text-gray-500">{format(new Date(expense.date), 'dd MMM yyyy')}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-800">-{formatAmount(expense.amount)}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No transactions yet</p>
              <Link to="/add-expense" className="text-green-600 text-sm mt-2 inline-block hover:underline">
                Add your first expense
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link to="/add-expense" className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition">
          <div className="text-2xl mb-1">➕</div>
          <div className="text-sm font-medium text-gray-700">Add Expense</div>
        </Link>
        <Link to="/invoices/new" className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition">
          <div className="text-2xl mb-1">📄</div>
          <div className="text-sm font-medium text-gray-700">New Invoice</div>
        </Link>
        <Link to="/import" className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition">
          <div className="text-2xl mb-1">📥</div>
          <div className="text-sm font-medium text-gray-700">Import Statement</div>
        </Link>
        <Link to="/reports" className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition">
          <div className="text-2xl mb-1">📊</div>
          <div className="text-sm font-medium text-gray-700">Reports</div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
