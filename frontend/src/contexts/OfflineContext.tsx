import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncs: number;
  lastSync: Date | null;
  checkConnection: () => boolean;
  triggerSync: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingSyncs, setPendingSyncs] = useState<number>(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Device is online');
      // Auto-sync when coming back online
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Device is offline');
    };

    // Check pending syncs on mount
    checkPendingSyncs();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic sync check (every 5 minutes)
    const syncInterval = setInterval(() => {
      if (isOnline && pendingSyncs > 0) {
        triggerSync();
      }
    }, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, [isOnline, pendingSyncs]);

  const checkPendingSyncs = () => {
    try {
      const queue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
      setPendingSyncs(queue.length);
    } catch (error) {
      console.error('Error checking pending syncs:', error);
      setPendingSyncs(0);
    }
  };

  const checkConnection = (): boolean => {
    return navigator.onLine;
  };

  const triggerSync = async (): Promise<void> => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      // In a real app, this would sync with the backend
      // For now, we'll simulate syncing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear sync queue (simulate successful sync)
      localStorage.setItem('syncQueue', JSON.stringify([]));
      setPendingSyncs(0);
      setLastSync(new Date());
      
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Listen for storage changes to update pending syncs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'syncQueue') {
        checkPendingSyncs();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value: OfflineContextType = {
    isOnline,
    isSyncing,
    pendingSyncs,
    lastSync,
    checkConnection,
    triggerSync,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed top-4 right-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg shadow-md z-50 flex items-center space-x-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Offline Mode</span>
        </div>
      )}
      {/* Syncing indicator */}
      {isSyncing && (
        <div className="fixed top-4 right-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow-md z-50 flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Syncing...</span>
        </div>
      )}
    </OfflineContext.Provider>
  );
};