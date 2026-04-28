import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Client } from '../types';

const API_URL = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : null) || process.env.REACT_APP_API_URL || 'https://pocketaccountant-api.onrender.com/api';

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', address: '', vatNumber: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const fetchClients = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/clients`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowForm(false);
      setForm({ name: '', email: '', phone: '', company: '', address: '', vatNumber: '' });
      fetchClients();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create client');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this client? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/clients/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchClients();
    } catch {
      alert('Failed to delete client');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
          <p className="text-gray-500 text-sm">Manage your clients and contacts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition"
        >
          {showForm ? 'Cancel' : '+ Add Client'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">New Client</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">VAT Number</label>
              <input value={form.vatNumber} onChange={e => setForm({...form, vatNumber: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition">
              {saving ? 'Saving...' : 'Save Client'}
            </button>
          </div>
        </form>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">👤</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No clients yet</h3>
          <p className="text-gray-500">Add clients so you can create invoices for them</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Phone</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Company</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{c.name}</td>
                  <td className="py-3 px-4 text-gray-600">{c.email || '—'}</td>
                  <td className="py-3 px-4 text-gray-600">{c.phone || '—'}</td>
                  <td className="py-3 px-4 text-gray-600">{c.company || '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Clients;
