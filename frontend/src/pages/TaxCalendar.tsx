import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : null) || process.env.REACT_APP_API_URL || 'https://pocketaccountant-api.onrender.com/api';

interface CalendarItem {
  type: string;
  label: string;
  deadline: string;
  description: string;
  daysRemaining: number;
  isUrgent: boolean;
  isOverdue: boolean;
  status: string;
  sarsReference: string | null;
}

const FILING_TIPS: Record<string, string> = {
  ITR12: 'Gather your IRP5, medical certificates, retirement annuity receipts, and mileage logbook before starting.',
  VAT201: 'Make sure all invoices and expenses for the period are captured. Reconcile your bank statement first.',
  EMP501: 'Reconcile your payroll records. All employee IRP5/IT3(a) certificates must be issued before submission.',
  IRP6: 'Estimate your taxable income for the year. Pay at least 50% of the estimated tax liability by first deadline.',
};

const STATUS_BADGES: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  preparing: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-blue-100 text-blue-700',
  filed: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
};

const TaxCalendar: React.FC = () => {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');

  const fetchCalendar = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/tax/calendar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

  const formatDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-ZA', {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const stats = {
    overdue: items.filter(i => i.isOverdue).length,
    urgent: items.filter(i => i.isUrgent && !i.isOverdue).length,
    upcoming: items.filter(i => !i.isUrgent && !i.isOverdue && i.status !== 'filed' && i.status !== 'completed').length,
    filed: items.filter(i => i.status === 'filed' || i.status === 'completed').length,
  };

  const filteredItems = selectedType
    ? items.filter(i => i.type === selectedType)
    : items;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tax Calendar</h1>
        <p className="text-gray-500 text-sm">SARS deadlines and filing status tracking</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-sm text-red-600">Overdue</div>
          <div className="text-2xl font-bold text-red-700">{stats.overdue}</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="text-sm text-yellow-600">Due Soon (7d)</div>
          <div className="text-2xl font-bold text-yellow-700">{stats.urgent}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="text-sm text-blue-600">Upcoming</div>
          <div className="text-2xl font-bold text-blue-700">{stats.upcoming}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-sm text-green-600">Filed</div>
          <div className="text-2xl font-bold text-green-700">{stats.filed}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex gap-2">
          {['', 'ITR12', 'VAT201', 'EMP501', 'IRP6'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedType === type
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type || 'All'}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}

      {loading ? (
        <div className="py-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No deadlines found</h3>
          <p className="text-gray-500">Your tax calendar will populate with SARS deadlines automatically.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item, i) => (
            <div
              key={i}
              className={`bg-white rounded-xl border-2 p-5 transition hover:shadow-sm ${
                item.isOverdue ? 'border-red-300' :
                item.isUrgent ? 'border-yellow-300' :
                item.status === 'filed' || item.status === 'completed' ? 'border-green-200' :
                'border-gray-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{item.label}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[item.status]}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                    {item.isOverdue && (
                      <span className="text-red-600 text-xs font-bold">OVERDUE</span>
                    )}
                    {item.isUrgent && !item.isOverdue && (
                      <span className="text-yellow-600 text-xs font-bold">{item.daysRemaining}d left</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{item.description}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Due: {formatDate(item.deadline)}
                    {item.daysRemaining >= 0 && !item.isOverdue && (
                      <span className="ml-2">({item.daysRemaining} days remaining)</span>
                    )}
                  </p>
                  {item.sarsReference && (
                    <p className="text-xs text-green-600 mt-1">SARS Ref: {item.sarsReference}</p>
                  )}
                </div>
                <div className="sm:text-right">
                  <div className="text-sm text-gray-600 mb-1">
                    Type: {item.type}
                  </div>
                </div>
              </div>

              {/* Filing tip */}
              {FILING_TIPS[item.type] && item.status !== 'filed' && item.status !== 'completed' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    <span className="text-blue-500">💡</span>
                    <p className="text-xs text-gray-500">{FILING_TIPS[item.type]}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info card */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h3 className="font-semibold text-gray-800 mb-2">🇿🇦 South African Tax Year</h3>
        <p className="text-sm text-gray-600 mb-3">
          The SA tax year runs from 1 March to 28/29 February. ITR12 returns are due by 31 October each year.
          Provisional taxpayers (IRP6) pay twice a year. VAT registered businesses file monthly or bi-monthly by the 25th.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="bg-white rounded-lg p-3">
            <div className="font-medium">ITR12</div>
            <div className="text-gray-500">Due 31 Oct</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="font-medium">VAT 201</div>
            <div className="text-gray-500">Due 25th monthly</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="font-medium">EMP501</div>
            <div className="text-gray-500">Bi-annual (May/Oct)</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="font-medium">IRP6</div>
            <div className="text-gray-500">Aug & Feb</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxCalendar;
