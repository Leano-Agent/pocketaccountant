import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenses } from '../contexts/ExpenseContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useOffline } from '../contexts/OfflineContext';
import { Expense, EXPENSE_CATEGORIES, AFRICAN_CURRENCIES } from '../types';
import { Save, X, Camera, Receipt } from 'lucide-react';

const AddExpense: React.FC = () => {
  const navigate = useNavigate();
  const { addExpense, loading } = useExpenses();
  const { selectedCurrency, formatCurrency } = useCurrency();
  const { isOnline } = useOffline();
  
  const [formData, setFormData] = useState({
    amount: '',
    currency: selectedCurrency,
    description: '',
    category: 'food',
    date: new Date().toISOString().split('T')[0],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> = {
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description.trim(),
        category: formData.category,
        date: formData.date,
      };

      await addExpense(expenseData);
      
      // Reset form
      setFormData({
        amount: '',
        currency: selectedCurrency,
        description: '',
        category: 'food',
        date: new Date().toISOString().split('T')[0],
      });
      setReceiptImage(null);
      setErrors({});

      // Show success message and navigate back
      alert('Expense added successfully!');
      navigate('/expenses');
      
    } catch (error) {
      console.error('Error adding expense:', error);
      alert(`Failed to add expense: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB for mobile networks)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleTakePhoto = () => {
    // This would use the device camera in a real app
    alert('Camera functionality would be implemented here');
  };

  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Expense</h1>
            <p className="text-gray-600 mt-1">Record your spending quickly and easily</p>
          </div>
          <button
            onClick={() => navigate('/expenses')}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            <X size={20} />
            <span>Cancel</span>
          </button>
        </div>

        {/* Offline Indicator */}
        {!isOnline && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm">⚠️</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  You're offline. This expense will be saved locally and synced when you're back online.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Amount</h2>
          
          <div className="space-y-4">
            <div>
              <label className="label">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  {AFRICAN_CURRENCIES.find(c => c.code === formData.currency)?.symbol || '$'}
                </span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={`input-field pl-10 ${errors.amount ? 'border-red-300' : ''}`}
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="label">Currency</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="input-field"
              >
                {AFRICAN_CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name} ({currency.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <label className="label">Quick Amounts ({formData.currency})</label>
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, amount: amount.toString() }))}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {formatCurrency(amount, formData.currency)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="label">Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="What did you spend on?"
                className={`input-field ${errors.description ? 'border-red-300' : ''}`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
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
                <label className="label">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={`input-field ${errors.date ? 'border-red-300' : ''}`}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                )}
              </div>
            </div>

            {/* Selected Category Preview */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                {(() => {
                  const category = EXPENSE_CATEGORIES.find(c => c.id === formData.category);
                  return (
                    <>
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white mr-3"
                        style={{ backgroundColor: category?.color || '#6B7280' }}
                      >
                        <span className="text-lg">{category?.icon || '📦'}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{category?.name || 'Other'}</div>
                        <div className="text-sm text-gray-600">Selected category</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Receipt (Optional)</h2>
            <button
              type="button"
              onClick={() => setShowReceiptUpload(!showReceiptUpload)}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              {showReceiptUpload ? 'Hide' : 'Add Receipt'}
            </button>
          </div>

          {showReceiptUpload && (
            <div className="space-y-4">
              {receiptImage ? (
                <div className="relative">
                  <img
                    src={receiptImage}
                    alt="Receipt"
                    className="w-full h-64 object-contain rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setReceiptImage(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Receipt className="mx-auto text-gray-400" size={48} />
                  <p className="mt-2 text-sm text-gray-600">No receipt uploaded</p>
                </div>
              )}

              <div className="flex space-x-3">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="hidden"
                  />
                  <div className="cursor-pointer flex items-center justify-center space-x-2 px-4 py-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors">
                    <span>📁</span>
                    <span>Upload from Device</span>
                  </div>
                </label>

                <button
                  type="button"
                  onClick={handleTakePhoto}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Camera size={20} />
                  <span>Take Photo</span>
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Max file size: 5MB. Supported formats: JPG, PNG, PDF
              </p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount</span>
              <span className="font-semibold">
                {formData.amount ? formatCurrency(parseFloat(formData.amount), formData.currency) : '--'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Category</span>
              <span className="font-semibold">
                {EXPENSE_CATEGORIES.find(c => c.id === formData.category)?.name || 'Other'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Date</span>
              <span className="font-semibold">
                {new Date(formData.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`font-semibold ${isOnline ? 'text-green-600' : 'text-yellow-600'}`}>
                  {isOnline ? 'Will sync immediately' : 'Will sync when online'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-6 bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={20} />
                <span className="font-medium">Save Expense</span>
              </>
            )}
          </button>
          
          <p className="text-center text-sm text-gray-500 mt-2">
            {isOnline 
              ? 'Expense will be saved to the cloud'
              : 'Expense will be saved locally and synced later'
            }
          </p>
        </div>
      </form>
    </div>
  );
};

export default AddExpense;