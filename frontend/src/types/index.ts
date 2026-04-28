export interface Expense {
  id: string | number;
  amount: number;
  currency: string;
  description: string;
  category: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  userId?: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  budget?: number;
  userId?: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  currency: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  userId?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  defaultCurrency: string;
  preferredCurrencies: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Exchange rate to base currency
}

// Invoice types
export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  vatNumber?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  lineTotal: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';

export interface Invoice {
  id: number;
  userId: number;
  clientId: number;
  client?: Client;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  currency: string;
  notes?: string;
  terms?: string;
  paidAmount: number;
  status: InvoiceStatus;
  vatRegistered: boolean;
  sentAt?: string;
  paidAt?: string;
  items?: InvoiceItem[];
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// African currencies
export const AFRICAN_CURRENCIES: Currency[] = [
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', rate: 1 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', rate: 0.0021 },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', rate: 0.0078 },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', rate: 0.083 },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', rate: 0.032 },
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 18.5 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 20.1 },
];

// Expense categories with African context
export const EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Food & Dining', color: '#10B981', icon: '🍲' },
  { id: 'transport', name: 'Transport', color: '#3B82F6', icon: '🚗' },
  { id: 'housing', name: 'Housing', color: '#8B5CF6', icon: '🏠' },
  { id: 'utilities', name: 'Utilities', color: '#F59E0B', icon: '💡' },
  { id: 'health', name: 'Health', color: '#EF4444', icon: '🏥' },
  { id: 'education', name: 'Education', color: '#06B6D4', icon: '📚' },
  { id: 'entertainment', name: 'Entertainment', color: '#EC4899', icon: '🎬' },
  { id: 'shopping', name: 'Shopping', color: '#8B4513', icon: '🛍️' },
  { id: 'savings', name: 'Savings', color: '#059669', icon: '💰' },
  { id: 'other', name: 'Other', color: '#6B7280', icon: '📦' },
];