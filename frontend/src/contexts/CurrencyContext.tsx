import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Currency, AFRICAN_CURRENCIES } from '../types';

interface CurrencyContextType {
  currencies: Currency[];
  selectedCurrency: string;
  exchangeRates: Record<string, number>;
  loading: boolean;
  setSelectedCurrency: (currencyCode: string) => void;
  convertAmount: (amount: number, fromCurrency: string, toCurrency?: string) => number;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  updateExchangeRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currencies] = useState<Currency[]>(AFRICAN_CURRENCIES);
  const [selectedCurrency, setSelectedCurrencyState] = useState<string>('ZAR');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize with default rates
    const initialRates: Record<string, number> = {};
    AFRICAN_CURRENCIES.forEach(currency => {
      initialRates[currency.code] = currency.rate;
    });
    setExchangeRates(initialRates);

    // Load saved currency preference
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency && AFRICAN_CURRENCIES.some(c => c.code === savedCurrency)) {
      setSelectedCurrencyState(savedCurrency);
    }

    // Try to fetch updated rates
    updateExchangeRates();
  }, []);

  const updateExchangeRates = async () => {
    if (!navigator.onLine) return; // Skip if offline
    
    setLoading(true);
    try {
      // In a real app, this would fetch from an API
      // For now, we'll simulate with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate updated rates (in reality, fetch from API)
      const updatedRates: Record<string, number> = {};
      AFRICAN_CURRENCIES.forEach(currency => {
        // Add some random variation to simulate real rates
        const variation = 0.95 + Math.random() * 0.1;
        updatedRates[currency.code] = currency.rate * variation;
      });
      
      setExchangeRates(updatedRates);
      localStorage.setItem('exchangeRates', JSON.stringify(updatedRates));
      localStorage.setItem('exchangeRatesUpdated', new Date().toISOString());
    } catch (error) {
      console.error('Failed to update exchange rates:', error);
      // Fallback to cached rates
      const cached = localStorage.getItem('exchangeRates');
      if (cached) {
        setExchangeRates(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  };

  const setSelectedCurrency = (currencyCode: string) => {
    if (AFRICAN_CURRENCIES.some(c => c.code === currencyCode)) {
      setSelectedCurrencyState(currencyCode);
      localStorage.setItem('preferredCurrency', currencyCode);
    }
  };

  const convertAmount = (amount: number, fromCurrency: string, toCurrency?: string): number => {
    const targetCurrency = toCurrency || selectedCurrency;
    
    if (fromCurrency === targetCurrency) return amount;
    
    const fromRate = exchangeRates[fromCurrency] || 1;
    const toRate = exchangeRates[targetCurrency] || 1;
    
    if (!fromRate || !toRate) return amount;
    
    // Convert to base currency (ZAR) first, then to target
    const amountInBase = amount / fromRate;
    return amountInBase * toRate;
  };

  const formatCurrency = (amount: number, currencyCode?: string): string => {
    const code = currencyCode || selectedCurrency;
    const currency = currencies.find(c => c.code === code);
    
    if (!currency) {
      return `${amount.toFixed(2)} ${code}`;
    }
    
    // Format based on currency
    let formattedAmount: string;
    
    switch (code) {
      case 'ZAR':
        formattedAmount = `R ${amount.toFixed(2)}`;
        break;
      case 'NGN':
        formattedAmount = `₦${amount.toFixed(2)}`;
        break;
      case 'KES':
        formattedAmount = `KSh ${amount.toFixed(2)}`;
        break;
      case 'GHS':
        formattedAmount = `GH₵${amount.toFixed(2)}`;
        break;
      case 'EGP':
        formattedAmount = `E£${amount.toFixed(2)}`;
        break;
      case 'USD':
        formattedAmount = `$${amount.toFixed(2)}`;
        break;
      case 'EUR':
        formattedAmount = `€${amount.toFixed(2)}`;
        break;
      default:
        formattedAmount = `${amount.toFixed(2)} ${code}`;
    }
    
    return formattedAmount;
  };

  const value: CurrencyContextType = {
    currencies,
    selectedCurrency,
    exchangeRates,
    loading,
    setSelectedCurrency,
    convertAmount,
    formatCurrency,
    updateExchangeRates,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};