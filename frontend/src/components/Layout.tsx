import React, { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useOffline } from '../contexts/OfflineContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOnline, pendingSyncs } = useOffline();
  const { selectedCurrency, formatCurrency } = useCurrency();
  const { user, logout } = useAuth();

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="PocketAccountant" className="w-10 h-10 rounded-lg" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">PocketAccountant</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>African Personal Finance</span>
                  {!isOnline && (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                      Offline
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-sm text-gray-600">Selected Currency</div>
                <div className="font-semibold">{selectedCurrency}</div>
              </div>
              
              {/* User Profile */}
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </div>
                  <div className="relative group">
                    <button
                      onClick={() => {
                        logout();
                        navigate('/login');
                      }}
                      className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
              
              {pendingSyncs > 0 && (
                <div className="relative">
                  <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingSyncs}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="md:ml-64">
        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
        <div className="flex justify-around py-3">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:text-primary-600'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 pt-20">
        <div className="px-4">
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Navigation</h2>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Quick Stats */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Stats</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className={`font-medium ${isOnline ? 'text-green-600' : 'text-yellow-600'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
              {pendingSyncs > 0 && (
                <div>
                  <div className="text-sm text-gray-600">Pending Syncs</div>
                  <div className="font-medium text-red-600">{pendingSyncs}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Layout;