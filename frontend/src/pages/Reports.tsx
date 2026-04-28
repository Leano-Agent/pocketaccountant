import React, { useState, useEffect } from 'react';
import { useExpenses } from '../contexts/ExpenseContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { EXPENSE_CATEGORIES } from '../types';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { Download, Filter, TrendingUp, TrendingDown, PieChart, BarChart, Calendar } from 'lucide-react';

const Reports: React.FC = () => {
  const { expenses } = useExpenses();
  const { formatCurrency, selectedCurrency } = useCurrency();
  
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    generateReportData();
  }, [expenses, timeRange, selectedMonth, selectedCurrency]);

  const generateReportData = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        endDate = now;
        break;
      case 'month':
        const [year, month] = selectedMonth.split('-').map(Number);
        startDate = startOfMonth(new Date(year, month - 1));
        endDate = endOfMonth(new Date(year, month - 1));
        break;
      case 'quarter':
        startDate = subMonths(now, 3);
        endDate = now;
        break;
      case 'year':
        startDate = subMonths(now, 12);
        endDate = now;
        break;
    }

    // Filter expenses for the time range
    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    // Calculate category breakdown
    const categoryBreakdown = EXPENSE_CATEGORIES.map(category => {
      const categoryExpenses = filteredExpenses.filter(expense => expense.category === category.id);
      const total = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const count = categoryExpenses.length;
      
      return {
        ...category,
        total,
        count,
        percentage: filteredExpenses.length > 0 ? (total / filteredExpenses.reduce((sum, e) => sum + e.amount, 0)) * 100 : 0,
      };
    }).filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total);

    // Calculate monthly trends
    const months = eachMonthOfInterval({ start: subMonths(now, 5), end: now });
    const monthlyTrends = months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      });
      
      const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      return {
        month: format(month, 'MMM yyyy'),
        total,
        count: monthExpenses.length,
      };
    });

    // Calculate top expenses
    const topExpenses = [...filteredExpenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Calculate statistics
    const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const averageExpense = filteredExpenses.length > 0 ? totalAmount / filteredExpenses.length : 0;
    const largestExpense = filteredExpenses.length > 0 ? Math.max(...filteredExpenses.map(e => e.amount)) : 0;
    const smallestExpense = filteredExpenses.length > 0 ? Math.min(...filteredExpenses.map(e => e.amount)) : 0;

    // Calculate trend vs previous period
    let previousPeriodTotal = 0;
    if (timeRange === 'month') {
      const prevMonth = subMonths(startDate, 1);
      const prevMonthStart = startOfMonth(prevMonth);
      const prevMonthEnd = endOfMonth(prevMonth);
      
      previousPeriodTotal = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= prevMonthStart && expenseDate <= prevMonthEnd;
        })
        .reduce((sum, expense) => sum + expense.amount, 0);
    }

    const trendPercentage = previousPeriodTotal > 0 
      ? ((totalAmount - previousPeriodTotal) / previousPeriodTotal) * 100 
      : 0;

    setReportData({
      timeRange,
      startDate,
      endDate,
      totalAmount,
      totalExpenses: filteredExpenses.length,
      categoryBreakdown,
      monthlyTrends,
      topExpenses,
      statistics: {
        averageExpense,
        largestExpense,
        smallestExpense,
        trendPercentage,
      },
    });
  };

  const exportReport = () => {
    if (!reportData) return;

    const reportText = `
PocketAccountant Report
Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
Time Range: ${timeRange}
Period: ${format(reportData.startDate, 'yyyy-MM-dd')} to ${format(reportData.endDate, 'yyyy-MM-dd')}

SUMMARY
Total Amount: ${formatCurrency(reportData.totalAmount)}
Total Expenses: ${reportData.totalExpenses}
Average Expense: ${formatCurrency(reportData.statistics.averageExpense)}
Trend vs Previous: ${reportData.statistics.trendPercentage.toFixed(1)}%

CATEGORY BREAKDOWN
${reportData.categoryBreakdown.map((cat: any) => 
  `${cat.name}: ${formatCurrency(cat.total)} (${cat.count} expenses, ${cat.percentage.toFixed(1)}%)`
).join('\n')}

TOP EXPENSES
${reportData.topExpenses.map((expense: any, index: number) => 
  `${index + 1}. ${expense.description}: ${formatCurrency(expense.amount, expense.currency)} (${format(new Date(expense.date), 'MMM dd')})`
).join('\n')}

MONTHLY TRENDS
${reportData.monthlyTrends.map((month: any) => 
  `${month.month}: ${formatCurrency(month.total)} (${month.count} expenses)`
).join('\n')}
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pocketaccountant_report_${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!reportData) {
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
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Gain insights into your spending habits</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={exportReport}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Download size={18} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Calendar className="text-gray-400" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Report Period</h2>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {['week', 'month', 'quarter', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                className={`px-4 py-2 rounded-lg capitalize ${
                  timeRange === range
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {timeRange === 'month' && (
          <div className="mt-4">
            <label className="label">Select Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-field"
            />
          </div>
        )}

        {/* Period Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-primary-600">
                {formatCurrency(reportData.totalAmount)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Spending</div>
            </div>
            
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-green-600">
                {reportData.totalExpenses}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Expenses</div>
            </div>
            
            <div className="text-center p-4">
              <div className="flex items-center justify-center space-x-2">
                {reportData.statistics.trendPercentage >= 0 ? (
                  <TrendingUp className="text-red-500" size={24} />
                ) : (
                  <TrendingDown className="text-green-500" size={24} />
                )}
                <div className="text-2xl font-bold">
                  {Math.abs(reportData.statistics.trendPercentage).toFixed(1)}%
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {reportData.statistics.trendPercentage >= 0 ? 'Increase' : 'Decrease'} vs previous
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Visualization</h2>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setChartType('pie')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                chartType === 'pie'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <PieChart size={18} />
              <span>Pie Chart</span>
            </button>
            
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                chartType === 'bar'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart size={18} />
              <span>Bar Chart</span>
            </button>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">Spending by Category</h3>
            <p className="text-gray-600">Visualization would appear here</p>
            <div className="mt-4 text-sm text-gray-500">
              {chartType === 'pie' ? 'Pie chart showing category distribution' : 'Bar chart showing monthly trends'}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="mt-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Category Breakdown</h3>
          {reportData.categoryBreakdown.map((category: any) => (
            <div key={category.id} className="space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="font-medium">{category.name}</span>
                  <span className="text-gray-500">({category.count} expenses)</span>
                </div>
                <div className="font-semibold">{formatCurrency(category.total)}</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{ 
                    width: `${Math.min(category.percentage, 100)}%`,
                    backgroundColor: category.color 
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 text-right">
                {category.percentage.toFixed(1)}% of total
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Expenses */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Expenses</h2>
          
          <div className="space-y-4">
            {reportData.topExpenses.length > 0 ? (
              reportData.topExpenses.map((expense: any, index: number) => {
                const category = EXPENSE_CATEGORIES.find(c => c.id === expense.category);
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: category?.color || '#6B7280' }}>
                        {category?.icon || '📦'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{expense.description}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(expense.date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(expense.amount, expense.currency)}
                      </div>
                      <div className="text-sm text-gray-500">{expense.currency}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">💸</div>
                <p>No expenses in this period</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h2>
          
          <div className="space-y-4">
            {reportData.monthlyTrends.map((month: any, index: number) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-900">{month.month}</span>
                  <span className="font-semibold">{formatCurrency(month.total)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ 
                      width: `${(month.total / Math.max(...reportData.monthlyTrends.map((m: any) => m.total))) * 100}%` 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 text-right">
                  {month.count} expenses
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">📈 Spending Insights</h3>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <span className="text-blue-600">💡</span>
            </div>
            <div>
              <div className="font-medium text-blue-900">Average Expense</div>
              <div className="text-blue-800">
                You spend {formatCurrency(reportData.statistics.averageExpense)} on average per expense
              </div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <span className="text-blue-600">🎯</span>
            </div>
            <div>
              <div className="font-medium text-blue-900">Top Category</div>
              <div className="text-blue-800">
                {reportData.categoryBreakdown[0]?.name || 'No data'} is your highest spending category at{' '}
                {reportData.categoryBreakdown[0] ? formatCurrency(reportData.categoryBreakdown[0].total) : '--'}
              </div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <span className="text-blue-600">📅</span>
            </div>
            <div>
              <div className="font-medium text-blue-900">Monthly Trend</div>
              <div className="text-blue-800">
                {reportData.statistics.trendPercentage >= 0 ? 'Spending increased' : 'Spending decreased'} by{' '}
                {Math.abs(reportData.statistics.trendPercentage).toFixed(1)}% compared to last period
              </div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <span className="text-blue-600">💰</span>
            </div>
            <div>
              <div className="font-medium text-blue-900">Budget Recommendation</div>
              <div className="text-blue-800">
                Consider setting a monthly budget of {formatCurrency(reportData.totalAmount * 0.9)} to reduce spending by 10%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
