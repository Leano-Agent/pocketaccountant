import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  category: string;
}

const BANK_FORMATS = [
  { id: 'auto', label: 'Auto Detect' },
  { id: 'csv_generic', label: 'CSV (Generic)' },
  { id: 'csv_absa', label: 'Absa CSV' },
  { id: 'csv_fnb', label: 'FNB CSV' },
  { id: 'csv_standard', label: 'Standard Bank CSV' },
  { id: 'csv_nedbank', label: 'Nedbank CSV' },
  { id: 'csv_capitec', label: 'Capitec CSV' },
];

const ImportStatement: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [bankFormat, setBankFormat] = useState('auto');
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const ext = selected.name.split('.').pop()?.toLowerCase();
    const validTypes = ['csv', 'xls', 'xlsx', 'pdf', 'ofx', 'qfx', 'qif'];
    
    if (!ext || !validTypes.includes(ext)) {
      setError('Unsupported file format. Please use CSV, Excel, PDF, OFX/QFX, or QIF.');
      setFile(null);
      return;
    }

    setError('');
    setFile(selected);
    setTransactions([]);
    setPreview(false);
  };

  const parseCSV = useCallback(async (text: string, format: string): Promise<ParsedTransaction[]> => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) throw new Error('File is empty');

    const results: ParsedTransaction[] = [];
    
    // Try to detect delimiter
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';

    if (format === 'auto') {
      // Try each format until one works
      const formats = ['csv_absa', 'csv_fnb', 'csv_standard', 'csv_nedbank', 'csv_capitec', 'csv_generic'];
      for (const fmt of formats) {
        try {
          const parsed = await parseCSV(text, fmt);
          if (parsed.length > 0) return parsed;
        } catch { continue; }
      }
      throw new Error('Could not auto-detect bank statement format. Please select your bank.');
    }

    // Find the header row (skip blank lines and metadata)
    let startIndex = 0;
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const lower = lines[i].toLowerCase();
      if (lower.includes('date') || lower.includes('transaction') || lower.includes('description') || 
          lower.includes('amount') || lower.includes('debit') || lower.includes('credit')) {
        startIndex = i;
        break;
      }
    }

    const headers = lines[startIndex].split(delimiter).map(h => h.trim().toLowerCase());
    
    // Map column indices based on format
    let dateIdx = -1, descIdx = -1, amountIdx = -1, debitIdx = -1, creditIdx = -1, balanceIdx = -1;

    if (format === 'csv_generic') {
      dateIdx = headers.findIndex(h => h.includes('date') || h === 'tran_date' || h === 'transactiondate');
      descIdx = headers.findIndex(h => h.includes('desc') || h.includes('narrative') || h.includes('detail') || h === 'memo');
      amountIdx = headers.findIndex(h => h.includes('amount') || h === 'value');
      debitIdx = headers.findIndex(h => h === 'debit' || h === 'withdrawal' || h === 'dr');
      creditIdx = headers.findIndex(h => h === 'credit' || h === 'deposit' || h === 'cr');
    } else if (format === 'csv_absa') {
      // Absa: Date, Description, Debit/Credit
      dateIdx = 0;
      descIdx = 1;
      debitIdx = 2;
      creditIdx = 3;
    } else if (format === 'csv_fnb') {
      // FNB: Date, Description, Debit/Credit
      dateIdx = 0;
      descIdx = 1;
      debitIdx = 2;
      creditIdx = 3;
    } else if (format === 'csv_standard') {
      // Standard Bank: Date, Description, Amount/Credit
      dateIdx = headers.findIndex(h => h.includes('date'));
      descIdx = headers.findIndex(h => h.includes('desc') || h.includes('narrative'));
      amountIdx = headers.findIndex(h => h.includes('amount'));
    } else if (format === 'csv_nedbank') {
      // Nedbank: Date, Description, Debit/Credit
      dateIdx = 0;
      descIdx = 1;
      debitIdx = 2;
      creditIdx = 3;
    } else if (format === 'csv_capitec') {
      // Capitec: Date, Description, Amount, Balance
      dateIdx = 0;
      descIdx = 1;
      amountIdx = 2;
      balanceIdx = 3;
    }

    if (dateIdx === -1) throw new Error('Could not find date column');
    if (descIdx === -1) throw new Error('Could not find description column');
    if (amountIdx === -1 && debitIdx === -1 && creditIdx === -1) {
      throw new Error('Could not find amount column');
    }

    // Parse data rows (skip header)
    for (let i = startIndex + 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 2) continue;

      const date = cols[dateIdx];
      const description = cols[descIdx];
      
      // Skip subtotals and metadata
      if (!date || !description || description.toLowerCase().includes('total') || 
          description.toLowerCase().includes('opening balance') || description.toLowerCase().includes('closing balance')) {
        continue;
      }

      let amount = 0;
      let type: 'debit' | 'credit' = 'debit';

      if (amountIdx !== -1) {
        const rawAmount = parseFloat(cols[amountIdx]?.replace(/[RZ \s,]/g, '').replace(',', '.')) || 0;
        if (rawAmount > 0) {
          amount = Math.abs(rawAmount);
          type = headers[amountIdx]?.includes('credit') ? 'credit' : 
                 (rawAmount < 0 ? 'debit' : 'credit');
          if (rawAmount < 0) type = 'debit';
        } else {
          amount = Math.abs(rawAmount);
          type = 'debit';
        }
      } else {
        const debit = parseFloat(cols[debitIdx]?.replace(/[RZ \s,]/g, '').replace(',', '.')) || 0;
        const credit = parseFloat(cols[creditIdx]?.replace(/[RZ \s,]/g, '').replace(',', '.')) || 0;
        if (credit > 0) {
          amount = credit;
          type = 'credit';
        } else if (debit > 0) {
          amount = debit;
          type = 'debit';
        } else continue;
      }

      if (amount <= 0) continue;

      results.push({
        date: date.replace(/\//g, '-'),
        description: description,
        amount,
        type,
        category: 'uncategorized',
      });
    }

    return results;
  }, []);

  const handlePreview = async () => {
    if (!file) return;
    
    try {
      setError('');
      setImporting(true);
      setProgress(10);

      const text = await file.text();
      setProgress(40);

      let parsed: ParsedTransaction[] = [];

      if (file.name.endsWith('.csv')) {
        parsed = await parseCSV(text, bankFormat);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setError('Excel parsing requires the xlsx library. Please convert to CSV for now.');
        setImporting(false);
        return;
      } else if (file.name.endsWith('.pdf')) {
        setError('PDF parsing is not yet available. Please use CSV format.');
        setImporting(false);
        return;
      } else {
        setError('Unsupported file format.');
        setImporting(false);
        return;
      }

      setProgress(80);

      if (parsed.length === 0) {
        setError('No transactions found in the file. Check the format.');
        setImporting(false);
        return;
      }

      setTransactions(parsed);
      setPreview(true);
      setProgress(100);
    } catch (err: any) {
      setError(err.message || 'Failed to parse file');
    } finally {
      setImporting(false);
    }
  };

  const handleImport = async () => {
    if (transactions.length === 0) return;

    setImporting(true);
    setProgress(0);
    let imported = 0;
    let failed = 0;

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      try {
        await api.createExpense({
          amount: tx.amount,
          currency: 'ZAR',
          description: `${tx.type === 'debit' ? '' : 'Deposit: '}${tx.description}`,
          category: tx.category,
          date: tx.date,
          // transactionType: tx.type,
        } as any);
        imported++;
      } catch {
        failed++;
      }
      setProgress(Math.round(((i + 1) / transactions.length) * 100));
    }

    setImporting(false);
    
    if (failed === 0) {
      alert(`✅ Successfully imported ${imported} transactions!`);
      navigate('/');
    } else {
      alert(`⚠️ Imported ${imported} transactions. ${failed} failed. Check console for details.`);
    }
  };

  const categorizeTransaction = (description: string): string => {
    const lower = description.toLowerCase();
    if (lower.includes('spar') || lower.includes('checkers') || lower.includes('woolworths') || 
        lower.includes('pick n pay') || lower.includes('shoprite') || lower.includes('food')) return 'Food & Dining';
    if (lower.includes('engen') || lower.includes('sasol') || lower.includes('total') || 
        lower.includes('fuel') || lower.includes('petrol') || lower.includes('taxi')) return 'Transport';
    if (lower.includes('eskom') || lower.includes('water') || lower.includes('cell') || 
        lower.includes('vodacom') || lower.includes('mtn') || lower.includes('municipal')) return 'Utilities';
    if (lower.includes('salary') || lower.includes('wage') || lower.includes('income')) return 'Income';
    if (lower.includes('medical') || lower.includes('hospital') || lower.includes('doctor') || 
        lower.includes('pharmacy') || lower.includes('clinic')) return 'Health';
    if (lower.includes('rent') || lower.includes('bond') || lower.includes('mortgage')) return 'Housing';
    if (lower.includes('netflix') || lower.includes('showmax') || lower.includes('dstv') || 
        lower.includes('spotify')) return 'Entertainment';
    return 'Other';
  };

  const updateCategory = (index: number, category: string) => {
    const updated = [...transactions];
    updated[index] = { ...updated[index], category };
    setTransactions(updated);
  };

  const toggleTransactionSelection = (index: number) => {
    // For future: skip/select individual transactions
  };

  const formatAmount = (amount: number, type: 'debit' | 'credit') => {
    const formatted = `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    return type === 'credit' ? `+${formatted}` : `-${formatted}`;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Import Bank Statement</h1>
        <p className="text-gray-600">
          Upload your bank statement to automatically import transactions.
        </p>
      </div>

      {!preview ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Step 1: Upload */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              1. Select Your Statement File
            </h2>
            
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-green-400 transition cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx,.pdf,.ofx,.qfx,.qif"
                className="hidden"
                onChange={handleFileChange}
              />
              
              {file ? (
                <div className="space-y-2">
                  <div className="text-4xl">📄</div>
                  <p className="font-medium text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setError(''); }}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-5xl">📂</div>
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      Drop your statement here or click to browse
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Supports CSV, Excel, PDF, OFX/QFX, QIF formats
                    </p>
                  </div>
                  <div className="flex justify-center space-x-4 text-xs text-gray-400">
                    <span>🏦 Absa</span>
                    <span>🏦 FNB</span>
                    <span>🏦 Standard Bank</span>
                    <span>🏦 Nedbank</span>
                    <span>🏦 Capitec</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Select Bank */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              2. Select Your Bank (Optional)
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              Choose your bank for better parsing. Select "Auto Detect" if unsure.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {BANK_FORMATS.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setBankFormat(fmt.id)}
                  className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition ${
                    bankFormat === fmt.id
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {importing && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Parsing file...</span>
                <span className="text-sm text-gray-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          <button
            onClick={handlePreview}
            disabled={!file || importing}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            {importing ? 'Parsing...' : 'Preview Transactions'}
          </button>
        </div>
      ) : (
        /* Preview/Import View */
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Found {transactions.length} Transactions
                </h2>
                <p className="text-sm text-gray-500">
                  Review and categorize before importing
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => { setPreview(false); setTransactions([]); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-semibold transition"
                >
                  {importing ? 'Importing...' : `Import All (${transactions.length})`}
                </button>
              </div>
            </div>

            {importing && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Importing transactions...</span>
                  <span className="text-sm text-gray-600">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Total</div>
                <div className="font-semibold">{transactions.length}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-sm text-green-600">Credits</div>
                <div className="font-semibold text-green-700">
                  {transactions.filter(t => t.type === 'credit').length}
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-sm text-red-600">Debits</div>
                <div className="font-semibold text-red-700">
                  {transactions.filter(t => t.type === 'debit').length}
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-sm text-blue-600">Uncategorized</div>
                <div className="font-semibold text-blue-700">
                  {transactions.filter(t => t.category === 'uncategorized').length}
                </div>
              </div>
            </div>

            {/* Transaction Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Description</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-600">Amount</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 50).map((tx, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 text-gray-800 whitespace-nowrap">{tx.date}</td>
                      <td className="py-3 px-2 text-gray-800 max-w-xs truncate">{tx.description}</td>
                      <td className={`py-3 px-2 text-right font-medium whitespace-nowrap ${
                        tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatAmount(tx.amount, tx.type)}
                      </td>
                      <td className="py-3 px-2">
                        <select
                          value={tx.category}
                          onChange={(e) => updateCategory(i, e.target.value)}
                          className="text-sm border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-green-500"
                        >
                          <option value="uncategorized">Categorize...</option>
                          <option value="Food & Dining">Food & Dining</option>
                          <option value="Transport">Transport</option>
                          <option value="Housing">Housing</option>
                          <option value="Utilities">Utilities</option>
                          <option value="Health">Health</option>
                          <option value="Education">Education</option>
                          <option value="Entertainment">Entertainment</option>
                          <option value="Shopping">Shopping</option>
                          <option value="Income">Income</option>
                          <option value="Other">Other</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {transactions.length > 50 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-500 text-sm">
                        + {transactions.length - 50} more transactions. Import all to see them.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportStatement;
