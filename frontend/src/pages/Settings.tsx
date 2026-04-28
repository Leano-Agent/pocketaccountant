import React, { useState } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { useOffline } from '../contexts/OfflineContext';
import { AFRICAN_CURRENCIES } from '../types';
import { Save, Globe, Bell, Shield, Download, Trash2, Moon, Sun } from 'lucide-react';

const Settings: React.FC = () => {
  const { selectedCurrency, setSelectedCurrency, currencies, updateExchangeRates } = useCurrency();
  const { triggerSync, isSyncing, pendingSyncs } = useOffline();
  
  const [settings, setSettings] = useState({
    notifications: true,
    biometricAuth: false,
    autoSync: true,
    darkMode: false,
    dataSaver: true,
    currencyRatesAutoUpdate: true,
  });
  
  const [exportFormat, setExportFormat] = useState('csv');
  const [syncFrequency, setSyncFrequency] = useState('15');
  const [backupFrequency, setBackupFrequency] = useState('weekly');

  const handleSettingChange = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportData = () => {
    alert(`Exporting data in ${exportFormat.toUpperCase()} format...`);
    // In a real app, this would trigger data export
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
      alert('Local data cleared (simulated)');
      // In a real app, this would clear localStorage
    }
  };

  const handleBackupNow = () => {
    alert('Creating backup...');
    // In a real app, this would create a backup
  };

  const handleSyncNow = async () => {
    await triggerSync();
  };

  const handleUpdateRates = async () => {
    await updateExchangeRates();
    alert('Exchange rates updated!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Customize your PocketAccountant experience</p>
      </div>

      {/* Currency Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-primary-100 p-2 rounded-lg">
            <Globe className="text-primary-600" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Currency & Region</h2>
            <p className="text-gray-600 text-sm">Set your preferred currency and regional settings</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="label">Default Currency</label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="input-field"
            >
              {AFRICAN_CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name} ({currency.symbol})
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-2">
              This currency will be used as default for new expenses and reports
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Auto-update Exchange Rates</div>
              <div className="text-sm text-gray-600">Update rates automatically when online</div>
            </div>
            <button
              onClick={handleUpdateRates}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Update Now
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currencies.slice(0, 3).map((currency) => (
              <div key={currency.code} className="p-4 border border-gray-200 rounded-lg">
                <div className="font-semibold text-gray-900">{currency.code}</div>
                <div className="text-sm text-gray-600">{currency.name}</div>
                <div className="mt-2 text-lg font-bold">{currency.symbol}1 = R{currency.rate.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* App Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-green-100 p-2 rounded-lg">
            <Bell className="text-green-600" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">App Settings</h2>
            <p className="text-gray-600 text-sm">Customize app behavior and appearance</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { key: 'notifications', label: 'Push Notifications', description: 'Receive alerts for budgets and reminders' },
            { key: 'biometricAuth', label: 'Biometric Authentication', description: 'Use fingerprint or face ID to secure app' },
            { key: 'autoSync', label: 'Auto Sync', description: 'Automatically sync data when online' },
            { key: 'darkMode', label: 'Dark Mode', description: 'Use dark theme for better battery life' },
            { key: 'dataSaver', label: 'Data Saver Mode', description: 'Reduce data usage for slower networks' },
            { key: 'currencyRatesAutoUpdate', label: 'Auto-update Currency Rates', description: 'Update exchange rates daily' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">{item.label}</div>
                <div className="text-sm text-gray-600">{item.description}</div>
              </div>
              <button
                onClick={() => handleSettingChange(item.key as keyof typeof settings)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  settings[item.key as keyof typeof settings] ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings[item.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Sync Frequency */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <label className="label">Sync Frequency (minutes)</label>
          <select
            value={syncFrequency}
            onChange={(e) => setSyncFrequency(e.target.value)}
            className="input-field"
          >
            <option value="5">Every 5 minutes</option>
            <option value="15">Every 15 minutes</option>
            <option value="30">Every 30 minutes</option>
            <option value="60">Every hour</option>
            <option value="manual">Manual only</option>
          </select>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-purple-100 p-2 rounded-lg">
            <Shield className="text-purple-600" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
            <p className="text-gray-600 text-sm">Backup, export, and manage your data</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Export Data */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-medium text-gray-900">Export Data</div>
                <div className="text-sm text-gray-600">Download your expense data</div>
              </div>
              <Download className="text-gray-400" size={20} />
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="label">Export Format</label>
                <div className="flex space-x-3">
                  {['csv', 'json', 'excel'].map((format) => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => setExportFormat(format)}
                      className={`px-4 py-2 rounded-lg ${
                        exportFormat === format
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={handleExportData}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Download size={20} />
                <span>Export Data</span>
              </button>
            </div>
          </div>

          {/* Backup Settings */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-medium text-gray-900">Backup Settings</div>
                <div className="text-sm text-gray-600">Automatically backup your data</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="label">Backup Frequency</label>
                <select
                  value={backupFrequency}
                  onChange={(e) => setBackupFrequency(e.target.value)}
                  className="input-field"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="manual">Manual only</option>
                </select>
              </div>
              
              <button
                onClick={handleBackupNow}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Create Backup Now
              </button>
            </div>
          </div>

          {/* Sync Status */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-medium text-gray-900">Sync Status</div>
                <div className="text-sm text-gray-600">Manage data synchronization</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                pendingSyncs > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                {pendingSyncs > 0 ? `${pendingSyncs} pending` : 'Up to date'}
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleSyncNow}
                disabled={isSyncing || pendingSyncs === 0}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSyncing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Sync Now</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleClearData}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 size={20} />
                <span>Clear Local Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">About PocketAccountant</h3>
        
        <div className="space-y-4 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          
          <div className="flex justify-between">
            <span>Last Updated</span>
            <span className="font-medium">March 25, 2026</span>
          </div>
          
          <div className="flex justify-between">
            <span>Data Size</span>
            <span className="font-medium">~2.4 MB</span>
          </div>
          
          <div className="flex justify-between">
            <span>Offline Storage</span>
            <span className="font-medium">Enabled</span>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <p className="text-center">
              PocketAccountant is designed for African users with features like multi-currency support,
              offline capability, and low data usage.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="sticky bottom-6">
        <button
          onClick={() => alert('Settings saved!')}
          className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-lg"
        >
          <Save size={20} />
          <span className="font-medium">Save All Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Settings;