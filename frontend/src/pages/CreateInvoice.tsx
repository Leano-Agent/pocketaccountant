import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Client, InvoiceItem } from '../types';

const API_URL = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : null) || process.env.REACT_APP_API_URL || 'https://pocketaccountant-api.onrender.com/api';

const CreateInvoice: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [vatRegistered, setVatRegistered] = useState(false);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, lineTotal: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loadingClients, setLoadingClients] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClients(res.data.data || []);
      } catch {
        // Will show error if no clients exist
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, []);

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;

    if (field === 'quantity' || field === 'unitPrice') {
      const qty = updated[index].quantity || 0;
      const price = updated[index].unitPrice || 0;
      updated[index].lineTotal = qty * price;
    }

    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, lineTotal: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const vatAmount = vatRegistered ? subtotal * 0.15 : 0;
  const total = subtotal + vatAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) { setError('Please select a client'); return; }
    if (items.some(i => !i.description.trim())) { setError('All items need a description'); return; }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        clientId: parseInt(clientId),
        issueDate,
        dueDate,
        vatRegistered,
        notes,
        terms,
        items: items.map(i => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      };

      const res = await axios.post(`${API_URL}/invoices`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate(`/invoices/${res.data.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amt: number) => `R${amt.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Create Invoice</h1>
        <p className="text-gray-500 text-sm">Fill in the details below to generate a new invoice</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Client & Dates */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
              {loadingClients ? (
                <div className="border border-gray-300 rounded-lg px-4 py-3 text-gray-400">Loading clients...</div>
              ) : clients.length === 0 ? (
                <div className="border border-gray-300 rounded-lg px-4 py-3 text-amber-600 text-sm">
                  No clients yet. <button type="button" onClick={() => navigate('/clients/new')} className="underline font-medium">Add a client first</button>
                </div>
              ) : (
                <select
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => navigate('/clients/new')}
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                + Add New Client
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={vatRegistered}
                onChange={e => setVatRegistered(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">VAT Registered (15% VAT applies)</span>
            </label>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Line Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Description (e.g. Web Design Services)"
                    value={item.description}
                    onChange={e => updateItem(i, 'description', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div className="w-20">
                  <input
                    type="number"
                    placeholder="Qty"
                    min="1"
                    value={item.quantity}
                    onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    placeholder="Price"
                    step="0.01"
                    min="0"
                    value={item.unitPrice || ''}
                    onChange={e => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="w-28 pt-2 text-right text-sm font-medium text-gray-800">
                  {formatCurrency(item.lineTotal)}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="pt-2 text-red-400 hover:text-red-600"
                  disabled={items.length === 1}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 mt-4 pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {vatRegistered && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">VAT (15%)</span>
                    <span>{formatCurrency(vatAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500"
                placeholder="Any notes for the client..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms (optional)</label>
              <textarea
                value={terms}
                onChange={e => setTerms(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500"
                placeholder="e.g. Payment due within 30 days"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
          >
            {submitting ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoice;
