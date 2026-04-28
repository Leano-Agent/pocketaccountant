import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : null) || process.env.REACT_APP_API_URL || 'https://pocketaccountant-api.onrender.com/api';

type ReportType = 'profit-loss' | 'balance-sheet' | 'cash-flow';

interface PLData {
  period: { start: string; end: string };
  revenue: { total: number; count: number };
  expenses: { total: number; byCategory: { category: string; amount: number; percentage: number }[]; count: number };
  netProfit: number;
  isProfitable: boolean;
  profitMargin: number;
}

interface BalanceSheetData {
  asAt: string;
  assets: { total: number; accountsReceivable: number; cashAndBank: number };
  liabilities: { total: number; outstandingExpenses: number };
  equity: { total: number; retainedEarnings: number };
}

interface CashFlowData {
  monthly: { period: string; cashIn: number; cashOut: number; netCashFlow: number }[];
  summary: { totalIn: number; totalOut: number; netTotal: number };
}

const Reports: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportType>('profit-loss');
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return {
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
    };
  });
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plData, setPlData] = useState<PLData | null>(null);
  const [bsData, setBsData] = useState<BalanceSheetData | null>(null);
  const [cfData, setCfData] = useState<CashFlowData | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';

      if (activeReport === 'profit-loss') {
        endpoint = `${API_URL}/reports/profit-loss?startDate=${dateRange.start}&endDate=${dateRange.end}`;
      } else if (activeReport === 'balance-sheet') {
        endpoint = `${API_URL}/reports/balance-sheet?asAt=${dateRange.end}`;
      } else {
        endpoint = `${API_URL}/reports/cash-flow?months=${months}`;
      }

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data.data || res.data;
      if (activeReport === 'profit-loss') setPlData(data);
      else if (activeReport === 'balance-sheet') setBsData(data);
      else setCfData(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [activeReport, dateRange, months]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const formatCurrency = (amt: number) =>
    `R${Number(amt).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const reportTabs: { type: ReportType; label: string; icon: string }[] = [
    { type: 'profit-loss', label: 'P&L', icon: '📊' },
    { type: 'balance-sheet', label: 'Balance Sheet', icon: '⚖️' },
    { type: 'cash-flow', label: 'Cash Flow', icon: '💵' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Financial Reports</h1>
        <p className="text-gray-500 text-sm">Profit & Loss, Balance Sheet, and Cash Flow statements</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 p-1.5 mb-6 inline-flex">
        {reportTabs.map(tab => (
          <button
            key={tab.type}
            onClick={() => setActiveReport(tab.type)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${
              activeReport === tab.type
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Date Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {(activeReport === 'profit-loss' || activeReport === 'balance-sheet') && (
            <>
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </>
          )}
          {activeReport === 'cash-flow' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Months</label>
              <select value={months} onChange={e => setMonths(parseInt(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
              </select>
            </div>
          )}
          <button
            onClick={fetchReport}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-3 text-gray-500">Generating report...</p>
        </div>
      ) : (
        <>
          {/* PROFIT & LOSS */}
          {activeReport === 'profit-loss' && plData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="text-sm text-gray-500 mb-1">Revenue</div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(plData.revenue.total)}</div>
                  <div className="text-xs text-gray-400">{plData.revenue.count} paid invoices</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="text-sm text-gray-500 mb-1">Expenses</div>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(plData.expenses.total)}</div>
                  <div className="text-xs text-gray-400">{plData.expenses.count} transactions</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="text-sm text-gray-500 mb-1">Net Profit</div>
                  <div className={`text-2xl font-bold ${plData.isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(plData.netProfit)}
                  </div>
                  <div className="text-xs text-gray-400">{plData.profitMargin}% margin</div>
                </div>
              </div>

              {/* Expenses by Category */}
              {plData.expenses.byCategory.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Expenses by Category</h3>
                  <div className="space-y-3">
                    {plData.expenses.byCategory.map((cat, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{cat.category}</span>
                          <span className="font-medium">
                            {formatCurrency(cat.amount)} ({cat.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                Period: {plData.period.start} → {plData.period.end}
              </div>
            </div>
          )}

          {/* BALANCE SHEET */}
          {activeReport === 'balance-sheet' && bsData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Assets</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Cash & Bank</span>
                    <span className="font-medium text-gray-800">{formatCurrency(bsData.assets.cashAndBank)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Accounts Receivable</span>
                    <span className="font-medium text-gray-800">{formatCurrency(bsData.assets.accountsReceivable)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-semibold text-lg">
                    <span>Total Assets</span>
                    <span className="text-green-700">{formatCurrency(bsData.assets.total)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Liabilities & Equity</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Liabilities</span>
                    <span className="font-medium text-gray-800">{formatCurrency(bsData.liabilities.total)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Retained Earnings</span>
                    <span className="font-medium text-gray-800">{formatCurrency(bsData.equity.retainedEarnings)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-semibold text-lg">
                    <span>Total Liabilities & Equity</span>
                    <span className="text-green-700">{formatCurrency(bsData.totalLiabilitiesAndEquity)}</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                As at: {bsData.asAt}
              </div>
            </div>
          )}

          {/* CASH FLOW */}
          {activeReport === 'cash-flow' && cfData && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="text-sm text-gray-500 mb-1">Total Cash In</div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(cfData.summary.totalIn)}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="text-sm text-gray-500 mb-1">Total Cash Out</div>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(cfData.summary.totalOut)}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="text-sm text-gray-500 mb-1">Net Cash Flow</div>
                  <div className={`text-2xl font-bold ${cfData.summary.netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(cfData.summary.netTotal)}
                  </div>
                </div>
              </div>

              {/* Monthly Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Monthly Cash Flow</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 font-medium text-gray-600">Period</th>
                        <th className="text-right py-3 font-medium text-gray-600">Cash In</th>
                        <th className="text-right py-3 font-medium text-gray-600">Cash Out</th>
                        <th className="text-right py-3 font-medium text-gray-600">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cfData.monthly.map((m, i) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="py-3 font-medium">{m.period}</td>
                          <td className="py-3 text-right text-green-600">{formatCurrency(m.cashIn)}</td>
                          <td className="py-3 text-right text-red-600">{formatCurrency(m.cashOut)}</td>
                          <td className={`py-3 text-right font-medium ${m.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(m.netCashFlow)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!plData && !bsData && !cfData && !loading && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="text-5xl mb-4">📈</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No data yet</h3>
              <p className="text-gray-500">Add expenses and create invoices to see your financial reports</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
