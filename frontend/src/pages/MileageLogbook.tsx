import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : null) || process.env.REACT_APP_API_URL || 'https://pocketaccountant-api.onrender.com/api';

interface MileageTrip {
  id: number;
  tripDate: string;
  startLocation: string;
  endLocation: string;
  distanceKm: number;
  tripType: 'business' | 'personal';
  businessPurpose: string;
  sarsRate: number;
  claimableAmount: number;
  vehicleReg: string;
  notes: string;
}

const MileageLogbook: React.FC = () => {
  const [trips, setTrips] = useState<MileageTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({ totalBusinessKm: 0, totalClaimable: 0, totalTrips: 0, businessTrips: 0 });
  const [showForm, setShowForm] = useState(false);
  const [tripType, setTripType] = useState<'business' | 'personal'>('business');
  const [form, setForm] = useState({
    tripDate: new Date().toISOString().split('T')[0],
    startLocation: '',
    endLocation: '',
    distanceKm: '',
    businessPurpose: '',
    vehicleReg: '',
    notes: '',
  });
  const [sarsRate, setSarsRate] = useState(4.58);
  const [saving, setSaving] = useState(false);
  const [dateFilter, setDateFilter] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-01-01`;
  });

  const fetchTrips = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const startDate = dateFilter;
      const endDate = new Date().toISOString().split('T')[0];
      const res = await axios.get(`${API_URL}/mileage?startDate=${startDate}&endDate=${endDate}&limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrips(res.data.data || []);
      setSummary(res.data.summary || {});
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/mileage/rate`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSarsRate(res.data.data?.standardRate || 4.58);
      } catch { /* use default */ }
    };
    fetchRate();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.distanceKm || parseFloat(form.distanceKm) <= 0) {
      setError('Please enter a valid distance');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/mileage`, {
        ...form,
        distanceKm: parseFloat(form.distanceKm),
        tripType,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowForm(false);
      setForm({
        tripDate: new Date().toISOString().split('T')[0],
        startLocation: '',
        endLocation: '',
        distanceKm: '',
        businessPurpose: '',
        vehicleReg: '',
        notes: '',
      });
      fetchTrips();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save trip');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this trip?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/mileage/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTrips();
    } catch {
      alert('Failed to delete trip');
    }
  };

  const handleExport = () => {
    const businessTrips = trips.filter(t => t.tripType === 'business');
    if (businessTrips.length === 0) {
      alert('No business trips to export.');
      return;
    }

    // Generate CSV
    const headers = ['Date', 'Start Location', 'End Location', 'Distance (km)', 'Business Purpose', 'Rate (R/km)', 'Claimable Amount (R)'];
    const rows = businessTrips.map(t => [
      t.tripDate,
      `"${t.startLocation}"`,
      `"${t.endLocation}"`,
      t.distanceKm,
      `"${t.businessPurpose || ''}"`,
      t.sarsRate,
      t.claimableAmount,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mileage-logbook-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amt: number) => `R${Number(amt).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  const formatDate = (date: string) => new Date(date + 'T00:00:00').toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mileage Logbook</h1>
          <p className="text-gray-500 text-sm">Track business trips at SARS rate of R{sarsRate.toFixed(2)}/km</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(!showForm)} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition">
            {showForm ? 'Cancel' : '+ Add Trip'}
          </button>
          <button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition">
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Trips</div>
          <div className="text-2xl font-bold">{summary.totalTrips}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-blue-500">Business Trips</div>
          <div className="text-2xl font-bold text-blue-700">{summary.businessTrips}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-green-500">Business KM</div>
          <div className="text-2xl font-bold text-green-700">{summary.totalBusinessKm.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-purple-500">Claimable</div>
          <div className="text-2xl font-bold text-purple-700">{formatCurrency(summary.totalClaimable)}</div>
        </div>
      </div>

      {/* Year Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <label className="text-sm text-gray-500 mr-2">Tax Year:</label>
        <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          <option value={new Date().getFullYear() + '-01-01'}>Current Year ({new Date().getFullYear()})</option>
          <option value={(new Date().getFullYear() - 1) + '-06-01'}>Last 12 months</option>
          <option value='2025-01-01'>2025</option>
        </select>
      </div>

      {/* Add Trip Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border-2 border-green-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">New Trip</h2>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={form.tripDate} onChange={e => setForm({...form, tripDate: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
              <input type="number" step="0.1" min="0.1" value={form.distanceKm} onChange={e => setForm({...form, distanceKm: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g. 45.5" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Location</label>
              <input value={form.startLocation} onChange={e => setForm({...form, startLocation: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g. 123 Main St, Cape Town" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Location</label>
              <input value={form.endLocation} onChange={e => setForm({...form, endLocation: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g. Airport, Cape Town" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trip Type</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setTripType('business')} className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition ${tripType === 'business' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
                  💼 Business
                </button>
                <button type="button" onClick={() => setTripType('personal')} className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition ${tripType === 'personal' ? 'border-gray-500 bg-gray-50 text-gray-700' : 'border-gray-200 text-gray-600'}`}>
                  🏠 Personal
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Reg</label>
              <input value={form.vehicleReg} onChange={e => setForm({...form, vehicleReg: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g. CA 123-456" />
            </div>
          </div>

          {tripType === 'business' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Purpose</label>
              <input value={form.businessPurpose} onChange={e => setForm({...form, businessPurpose: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g. Client meeting at Foreshore" required={tripType === 'business'} />
              <p className="text-xs text-green-600 mt-1">
                SARS claimable: {form.distanceKm ? formatCurrency(parseFloat(form.distanceKm || '0') * sarsRate) : 'R0.00'} (R{sarsRate.toFixed(2)}/km)
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition">
              {saving ? 'Saving...' : 'Save Trip'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">🚗</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No trips logged</h3>
          <p className="text-gray-500">Start tracking your mileage for SARS-compliant claims</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Route</th>
                  <th className="text-right py-3 px-3 font-medium text-gray-600">KM</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-600">Purpose</th>
                  <th className="text-right py-3 px-3 font-medium text-gray-600">Claim</th>
                  <th className="text-right py-3 px-3 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody>
                {trips.map(trip => (
                  <tr key={trip.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 whitespace-nowrap">{formatDate(trip.tripDate)}</td>
                    <td className="py-3 px-3 max-w-xs truncate">
                      {trip.startLocation} → {trip.endLocation}
                      {!trip.startLocation && !trip.endLocation && <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-3 px-3 text-right font-medium">{Number(trip.distanceKm).toFixed(1)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${trip.tripType === 'business' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {trip.tripType === 'business' ? 'Biz' : 'Pers'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-600 max-w-xs truncate">{trip.businessPurpose || '—'}</td>
                    <td className="py-3 px-3 text-right font-medium text-green-700">
                      {trip.tripType === 'business' ? formatCurrency(trip.claimableAmount) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button onClick={() => handleDelete(trip.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>🇿🇦 SARS Rate:</strong> R{sarsRate.toFixed(2)}/km for 2025/2026 tax year. Business trips only.
        Keep a logbook for at least 3 months to use the fixed cost method. Logbook must include date, distance, purpose, and locations.
      </div>
    </div>
  );
};

export default MileageLogbook;
