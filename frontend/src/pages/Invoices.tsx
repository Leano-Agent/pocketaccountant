import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Invoice, InvoiceStatus } from '../types';

const API_URL = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : null) || process.env.REACT_APP_API_URL || 'https://pocketaccountant-api.onrender.com/api';

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-200 text-gray-500',
};

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  partial: 'Partial',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      
      const res = await axios.get(`${API_URL}/invoices?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvoices(res.data.data || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const formatCurrency = (amount: number) => {
    return `R${Number(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-ZA', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const filteredInvoices = search
    ? invoices.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        inv.client?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : invoices;

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    outstanding: invoices.filter(i => ['sent', 'partial', 'draft'].includes(i.status))
      .reduce((sum, i) => sum + (Number(i.total) - Number(i.paidAmount)), 0),
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
          <p className="text-gray-500 text-sm">Create, send, and track invoices</p>
        </div>
        <button
          onClick={() => navigate('/invoices/new')}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
        >
          + New Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-green-600">Paid</div>
          <div className="text-2xl font-bold text-green-700">{stats.paid}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-red-600">Overdue</div>
          <div className="text-2xl font-bold text-red-700">{stats.overdue}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-blue-600">Outstanding</div>
          <div className="text-2xl font-bold text-blue-700">{formatCurrency(stats.outstanding)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by invoice number or client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Invoice List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-3 text-gray-500">Loading invoices...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">📄</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No invoices yet</h3>
          <p className="text-gray-500 mb-6">Create your first invoice to get paid faster</p>
          <button
            onClick={() => navigate('/invoices/new')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium transition"
          >
            Create Invoice
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Invoice #</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Client</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Due</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Amount</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                  >
                    <td className="py-3 px-4 font-medium text-gray-800">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 text-gray-700">{inv.client?.name || '—'}</td>
                    <td className="py-3 px-4 text-gray-600 text-sm">{formatDate(inv.issueDate)}</td>
                    <td className="py-3 px-4 text-gray-600 text-sm">{formatDate(inv.dueDate)}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(inv.total)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status]}`}>
                        {STATUS_LABELS[inv.status]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${inv.id}`); }}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
