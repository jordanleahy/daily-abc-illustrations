import React, { createContext, useContext, ReactNode } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface NetworkStatusContextValue {
  isOnline: boolean;
  isWeak: boolean;
  effectiveType: string | null;
  rtt: number | null;
}

const NetworkStatusContext = createContext<NetworkStatusContextValue | null>(null);

interface NetworkStatusProviderProps {
  children: ReactNode;
}

export function NetworkStatusProvider({ children }: NetworkStatusProviderProps) {
  const status = useNetworkStatus();

  return (
    <NetworkStatusContext.Provider value={status}>
      {children}
    </NetworkStatusContext.Provider>
  );
}

export function useNetworkStatusContext(): NetworkStatusContextValue {
  const context = useContext(NetworkStatusContext);
  if (!context) {
    throw new Error('useNetworkStatusContext must be used within a NetworkStatusProvider');
  }
  return context;
}
