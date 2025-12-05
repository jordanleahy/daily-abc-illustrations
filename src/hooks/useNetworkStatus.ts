import { useState, useEffect, useCallback, useRef } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isWeak: boolean;
  effectiveType: string | null;
  rtt: number | null;
}

interface NetworkInformation extends EventTarget {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  rtt: number;
  downlink: number;
  saveData: boolean;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

const WEAK_RTT_THRESHOLD = 300; // ms
const WEAK_EFFECTIVE_TYPES = ['slow-2g', '2g'];

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const effectiveType = connection?.effectiveType || null;
    const rtt = connection?.rtt ?? null;
    
    return {
      isOnline: navigator.onLine,
      isWeak: calculateIsWeak(effectiveType, rtt),
      effectiveType,
      rtt,
    };
  });

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const updateStatus = useCallback(() => {
    // Debounce updates to prevent rapid state changes
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const effectiveType = connection?.effectiveType || null;
      const rtt = connection?.rtt ?? null;
      const isOnline = navigator.onLine;

      setStatus({
        isOnline,
        isWeak: isOnline && calculateIsWeak(effectiveType, rtt),
        effectiveType,
        rtt,
      });
    }, 500);
  }, []);

  useEffect(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    // Listen to online/offline events
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    // Listen to connection changes if supported
    if (connection) {
      connection.addEventListener('change', updateStatus);
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      
      if (connection) {
        connection.removeEventListener('change', updateStatus);
      }

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [updateStatus]);

  return status;
}

function calculateIsWeak(effectiveType: string | null, rtt: number | null): boolean {
  if (effectiveType && WEAK_EFFECTIVE_TYPES.includes(effectiveType)) {
    return true;
  }
  if (rtt !== null && rtt > WEAK_RTT_THRESHOLD) {
    return true;
  }
  return false;
}
