import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/invoices/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInvoice(res.data.data || res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const updateStatus = async (status: InvoiceStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(
        `${API_URL}/invoices/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInvoice(res.data.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const recordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/invoices/${id}/payment`,
        { amount: parseFloat(paymentAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInvoice(res.data.data);
      setShowPayment(false);
      setPaymentAmount('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record payment');
    }
  };

  const formatCurrency = (amount: number) =>
    `R${Number(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (date: string) =>
    new Date(date + 'T00:00:00').toLocaleDateString('en-ZA', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

  if (loading) return (
    <div className="text-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
      <p className="mt-3 text-gray-500">Loading invoice...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      <button onClick={() => navigate('/invoices')} className="mt-4 text-green-600 hover:underline">Back to invoices</button>
    </div>
  );

  if (!invoice) return null;

  const balanceDue = Number(invoice.total) - Number(invoice.paidAmount);
  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' && invoice.status !== 'cancelled';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate('/invoices')} className="text-green-600 hover:text-green-800 mb-4 flex items-center gap-1">
        ← Back to Invoices
      </button>

      {/* Status Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-800">{invoice.invoiceNumber}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[invoice.status]}`}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </span>
              {isOverdue && <span className="text-red-600 text-sm font-medium">OVERDUE</span>}
            </div>
            <p className="text-gray-500">{invoice.client?.name}</p>
          </div>
          <div className="flex gap-2">
            {invoice.status === 'draft' && (
              <button onClick={() => updateStatus('sent')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                Mark Sent
              </button>
            )}
            {['sent', 'partial', 'overdue'].includes(invoice.status) && (
              <button onClick={() => setShowPayment(!showPayment)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                Record Payment
              </button>
            )}
            {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
              <button onClick={() => updateStatus('cancelled')} className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50">
                Cancel
              </button>
            )}
          </div>
        </div>

        {showPayment && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg flex gap-3 items-end">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Payment Amount</label>
              <input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                className="border border-gray-300 rounded-lg px-4 py-2 w-40"
                max={balanceDue}
              />
            </div>
            <button onClick={recordPayment} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
              Apply Payment
            </button>
            <span className="text-sm text-gray-500">Balance due: {formatCurrency(balanceDue)}</span>
          </div>
        )}
      </div>

      {invoice.paidAmount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex justify-between items-center">
          <span className="text-green-800 font-medium">Paid: {formatCurrency(invoice.paidAmount)}</span>
          <span className="text-green-800">Remaining: {formatCurrency(balanceDue)}</span>
        </div>
      )}

      {/* Invoice Body */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-1">INVOICE</h2>
            <p className="text-gray-500">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <p className="font-medium">Issue Date: {formatDate(invoice.issueDate)}</p>
            <p className="font-medium">Due Date: {formatDate(invoice.dueDate)}</p>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
          <p className="font-medium text-gray-800">{invoice.client?.name}</p>
          {invoice.client?.email && <p className="text-gray-600">{invoice.client.email}</p>}
          {invoice.client?.company && <p className="text-gray-600">{invoice.client.company}</p>}
          {invoice.client?.address && <p className="text-gray-600">{invoice.client.address}</p>}
          {invoice.client?.vatNumber && <p className="text-gray-600">VAT: {invoice.client.vatNumber}</p>}
        </div>

        {/* Items Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 font-medium text-gray-600 text-sm">Description</th>
              <th className="text-right py-3 font-medium text-gray-600 text-sm">Qty</th>
              <th className="text-right py-3 font-medium text-gray-600 text-sm">Unit Price</th>
              {invoice.vatRegistered && <th className="text-right py-3 font-medium text-gray-600 text-sm">VAT%</th>}
              <th className="text-right py-3 font-medium text-gray-600 text-sm">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-3 text-gray-800">{item.description}</td>
                <td className="py-3 text-right text-gray-700">{item.quantity}</td>
                <td className="py-3 text-right text-gray-700">{formatCurrency(item.unitPrice)}</td>
                {invoice.vatRegistered && <td className="py-3 text-right text-gray-700">{item.vatRate || 15}%</td>}
                <td className="py-3 text-right font-medium">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.vatRegistered && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VAT (15%)</span>
                <span>{formatCurrency(invoice.vatAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t-2 border-gray-200 pt-2">
              <span>Total</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notes</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        {invoice.terms && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Terms</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{invoice.terms}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetail;
