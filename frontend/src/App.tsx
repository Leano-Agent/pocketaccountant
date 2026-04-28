import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ExpenseProvider } from './contexts/ExpenseContext';
import { BudgetProvider } from './contexts/BudgetContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { OfflineProvider } from './contexts/OfflineContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import AddExpense from './pages/AddExpense';
import Categories from './pages/Categories';
import Budgets from './pages/Budgets';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ImportStatement from './pages/ImportStatement';
import Invoices from './pages/Invoices';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceDetail from './pages/InvoiceDetail';
import Clients from './pages/Clients';
import TaxCalendar from './pages/TaxCalendar';
import MileageLogbook from './pages/MileageLogbook';
import OAuthCallback from './pages/OAuthCallback';
import AIChat from './pages/AIChat';
import TaxCalendar from './pages/TaxCalendar';
import MileageLogbook from './pages/MileageLogbook';
import OAuthCallback from './pages/OAuthCallback';
import AIChat from './pages/AIChat';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

function AppContent() {
  return (
    <OfflineProvider>
      <CurrencyProvider>
        <ExpenseProvider>
          <BudgetProvider>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/expenses" element={
                  <ProtectedRoute>
                    <Layout>
                      <Expenses />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/add-expense" element={
                  <ProtectedRoute>
                    <Layout>
                      <AddExpense />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/categories" element={
                  <ProtectedRoute>
                    <Layout>
                      <Categories />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/budgets" element={
                  <ProtectedRoute>
                    <Layout>
                      <Budgets />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <Layout>
                      <Reports />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Layout>
                      <Settings />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/import" element={
                  <ProtectedRoute>
                    <Layout>
                      <ImportStatement />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/invoices" element={
                  <ProtectedRoute>
                    <Layout>
                      <Invoices />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/invoices/new" element={
                  <ProtectedRoute>
                    <Layout>
                      <CreateInvoice />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/invoices/:id" element={
                  <ProtectedRoute>
                    <Layout>
                      <InvoiceDetail />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/clients" element={
                  <ProtectedRoute>
                    <Layout>
                      <Clients />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/clients/new" element={
                  <ProtectedRoute>
                    <Layout>
                      <Clients />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/tax" element={
                  <ProtectedRoute>
                    <Layout>
                      <TaxCalendar />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/mileage" element={
                  <ProtectedRoute>
                    <Layout>
                      <MileageLogbook />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                {/* Redirect unknown routes */}
                <Route path="/ai" element={
                  <ProtectedRoute>
                    <Layout>
                      <AIChat />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/oauth-callback" element={<OAuthCallback />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Router>
          </BudgetProvider>
        </ExpenseProvider>
      </CurrencyProvider>
    </OfflineProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;