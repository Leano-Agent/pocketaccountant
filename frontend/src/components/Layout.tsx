import React, { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useOffline } from '../contexts/OfflineContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import PWAInstallPrompt from './PWAInstallPrompt';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOnline, pendingSyncs } = useOffline();
  const { selectedCurrency, formatCurrency } = useCurrency();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/expenses', label: 'Expenses', icon: '💰' },
    { path: '/add-expense', label: 'Add', icon: '➕' },
    { path: '/categories', label: 'Categories', icon: '🏷️' },
    { path: '/budgets', label: 'Budgets', icon: '🎯' },
    { path: '/reports', label: 'Reports', icon: '📈' },
    { path: '/invoices', label: 'Invoices', icon: '📄' },
    { path: '/clients', label: 'Clients', icon: '👤' },
    { path: '/ai', label: 'PocketAI', icon: '🤖' },
    { path: '/tax', label: 'Tax', icon: '📅' },
    { path: '/mileage', label: 'Mileage', icon: '🚗' },
    { path: '/import', label: 'Import', icon: '📥' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="PocketAccountant" className="w-10 h-10 rounded-lg" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">PocketAccountant</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                  <span>African Personal Finance</span>
                  {!isOnline && (
                    <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs">
                      Offline
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-lg"
                title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              >
                {isDark ? '☀️' : '🌙'}
              </button>

              <div className="text-right hidden sm:block">
                <div className="text-sm text-gray-500 dark:text-gray-400">Selected Currency</div>
                <div className="font-semibold dark:text-gray-200">{selectedCurrency}</div>
              </div>
              
              {/* User Profile */}
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="text-right hidden sm:block">
                    <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
              
              {pendingSyncs > 0 && (
                <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingSyncs}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 pt-20 z-10">
        <div className="px-4">
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Navigation</h2>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Quick Stats */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Stats</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                <div className={`font-medium ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
              {pendingSyncs > 0 && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Pending Sync</div>
                  <div className="font-medium text-yellow-600 dark:text-yellow-400">{pendingSyncs} items</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      <div className="md:ml-64">
        {/* Main Content */}
        <main className="container mx-auto px-4 py-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden z-10">
        <div className="flex justify-around py-2 px-1 overflow-x-auto">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 min-w-[60px] rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                  : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-0.5 truncate max-w-[60px]">{item.label}</span>
            </Link>
          ))}
          <Link
            to="/settings"
            className="flex flex-col items-center p-2 min-w-[60px] rounded-lg transition-colors"
          >
            <span className="text-xl">•••</span>
            <span className="text-xs mt-0.5">More</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
