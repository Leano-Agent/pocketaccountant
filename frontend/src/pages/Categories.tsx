import React, { useState } from 'react';
import { useExpenses } from '../contexts/ExpenseContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { EXPENSE_CATEGORIES } from '../types';
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

const Categories: React.FC = () => {
  const { expenses, getExpensesByCategory, getTotalExpenses } = useExpenses();
  const { formatCurrency, selectedCurrency } = useCurrency();
  
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const categoriesWithStats = EXPENSE_CATEGORIES.map(category => {
    const categoryExpenses = getExpensesByCategory(category.id);
    const total = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const percentage = getTotalExpenses(selectedCurrency) > 0 
      ? (total / getTotalExpenses(selectedCurrency)) * 100 
      : 0;
    
    // Calculate trend (simplified - would be based on time period in real app)
    const trend = Math.random() > 0.5 ? 'up' : 'down';
    const trendAmount = Math.random() * 20;
    
    return {
      ...category,
      total,
      percentage,
      count: categoryExpenses.length,
      trend,
      trendAmount,
    };
  }).sort((a, b) => b.total - a.total);

  const handleEditCategory = (categoryId: string) => {
    const category = categoriesWithStats.find(c => c.id === categoryId);
    if (category) {
      setEditingCategory(categoryId);
      setNewCategoryName(category.name);
    }
  };

  const handleSaveEdit = () => {
    if (editingCategory && newCategoryName.trim()) {
      // In a real app, this would update the category in the backend
      console.log(`Updating category ${editingCategory} to ${newCategoryName}`);
      setEditingCategory(null);
      setNewCategoryName('');
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category? Expenses in this category will be moved to "Other".')) {
      // In a real app, this would delete the category and update expenses
      console.log(`Deleting category ${categoryId}`);
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      // In a real app, this would add a new category to the backend
      console.log(`Adding new category: ${newCategoryName}`);
      setNewCategoryName('');
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">Manage your expense categories</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          <span>Add Category</span>
        </button>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Category</h2>
          
          <div className="space-y-4">
            <div>
              <label className="label">Category Name</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
                className="input-field"
              />
            </div>
            
            <div>
              <label className="label">Color</label>
              <div className="flex space-x-2">
                {['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#8B4513'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-8 h-8 rounded-full border-2 border-gray-200"
                    style={{ backgroundColor: color }}
                    title={`Color: ${color}`}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <label className="label">Icon</label>
              <div className="flex space-x-2">
                {['🍲', '🚗', '🏠', '💡', '🏥', '📚', '🎬', '🛍️', '💰', '📦'].map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-xl hover:bg-gray-50"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleAddCategory}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Save Category
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoriesWithStats.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl"
                  style={{ backgroundColor: category.color }}
                >
                  {category.icon}
                </div>
                <div>
                  {editingCategory === category.id ? (
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="input-field py-1 text-lg font-semibold"
                      autoFocus
                    />
                  ) : (
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  )}
                  <div className="text-sm text-gray-600">{category.count} expenses</div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {editingCategory === category.id ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="p-1 text-green-600 hover:text-green-700"
                      title="Save"
                    >
                      <span className="text-lg">✓</span>
                    </button>
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="p-1 text-gray-600 hover:text-gray-700"
                      title="Cancel"
                    >
                      <span className="text-lg">✗</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditCategory(category.id)}
                      className="p-1 text-primary-600 hover:text-primary-700"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-1 text-red-600 hover:text-red-700"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Total Spent</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(category.total, selectedCurrency)}
                  </span>
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
                <div className="text-xs text-gray-500 text-right mt-1">
                  {category.percentage.toFixed(1)}% of total
                </div>
              </div>

              {/* Trend */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  {category.trend === 'up' ? (
                    <TrendingUp className="text-red-500" size={18} />
                  ) : (
                    <TrendingDown className="text-green-500" size={18} />
                  )}
                  <span className="text-sm text-gray-600">
                    {category.trend === 'up' ? 'Increased' : 'Decreased'} by{' '}
                    <span className={`font-medium ${category.trend === 'up' ? 'text-red-600' : 'text-green-600'}`}>
                      {category.trendAmount.toFixed(1)}%
                    </span>
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  vs last month
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
              <button className="flex-1 px-3 py-1.5 text-sm bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors">
                View Expenses
              </button>
              <button className="flex-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Set Budget
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4">
            <div className="text-3xl font-bold text-primary-600">
              {categoriesWithStats.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Categories</div>
          </div>
          
          <div className="text-center p-4">
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(getTotalExpenses(selectedCurrency))}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Spent</div>
          </div>
          
          <div className="text-center p-4">
            <div className="text-3xl font-bold text-purple-600">
              {expenses.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Expenses</div>
          </div>
        </div>
        
        {/* Top Categories */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Top Spending Categories</h3>
          <div className="space-y-3">
            {categoriesWithStats
              .filter(c => c.total > 0)
              .slice(0, 3)
              .map((category, index) => (
                <div key={category.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: category.color }}>
                      {category.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{category.name}</div>
                      <div className="text-sm text-gray-600">{category.count} expenses</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatCurrency(category.total, selectedCurrency)}</div>
                    <div className="text-sm text-gray-600">{category.percentage.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Category Management Tips</h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Create specific categories for your regular expenses</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Use the "Other" category for one-time or unusual expenses</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Set monthly budgets for each category to control spending</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Review and adjust categories quarterly based on your spending patterns</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Categories;